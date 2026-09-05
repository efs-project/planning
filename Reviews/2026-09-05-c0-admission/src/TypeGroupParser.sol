// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library TypeGroupParser {
    // Disposable ASCII/DIRECT descriptor admission only. No Record-body validator,
    // Unicode STRUCT-FULL claim, ARRAY_STRUCT_MEMBER selector, or general E1 compiler.
    struct FieldCache {
        uint8 kind;
        uint8 innerKind;
        uint16 widthOrMax;
        uint32 maxBodyBytes;
        uint32 references;
        uint32 skipReads;
        bytes descriptor;
    }

    struct RoleCache {
        uint8 targetClass;
        bytes32 expectedType;
        uint8 fieldIdx;
    }

    struct IndexCache {
        uint8 kind;
        uint8 target;
    }

    struct ConstraintCache {
        uint8 kind;
        uint8 fieldIdx;
        int256 min;
        int256 max;
    }

    struct SchemaCache {
        bytes32 typeId;
        bytes32 blobHash;
        uint32 maxBodyBytes;
        FieldCache[] fields;
        RoleCache[] roles;
        IndexCache[] indexes;
        ConstraintCache[] constraints;
    }

    error InvalidSchema();

    struct Cursor {
        bytes data;
        uint256 pos;
    }

    struct FieldResult {
        FieldCache cache;
        bytes32 name;
        bool hasRef;
    }

    struct Context {
        bytes32 groupHash;
        uint256 own;
        uint256 count;
        bytes32[] admitted;
    }
    bytes32 constant DOM_GROUP = keccak256("efs2/typeschema-group/1");
    bytes32 constant DOM_TYPE = keccak256("efs2/typeschema/1");

    function parse(bytes memory groupBytes, bytes32[] memory admittedTypes)
        internal
        pure
        returns (bytes32 groupHash, SchemaCache[] memory schemas)
    {
        if (groupBytes.length > 8190) revert InvalidSchema();
        Cursor memory c = Cursor(groupBytes, 0);
        uint256 n = number(c, 2);
        if (n == 0 || n > 16) revert InvalidSchema();
        groupHash = keccak256(abi.encode(DOM_GROUP, keccak256(groupBytes)));
        schemas = new SchemaCache[](n);
        for (uint256 i; i < n; ++i) {
            bytes memory b = take(c, number(c, 2));
            schemas[i] = blob(b, Context(groupHash, i, n, admittedTypes));
        }
        end(c);
    }

    function blob(bytes memory b, Context memory ctx) private pure returns (SchemaCache memory s) {
        if (b.length > 8192) revert InvalidSchema();
        Cursor memory c = Cursor(b, 0);
        s.typeId = typeId(ctx.groupHash, ctx.own);
        s.blobHash = keccak256(b);
        if (number(c, 2) != 1) revert InvalidSchema();
        text(c, 128, false);
        text(c, 2048, true);
        uint256 flag = number(c, 1);
        if (flag > 1) revert InvalidSchema();
        if (flag == 1) {
            uint256 alg = number(c, 2);
            uint256 len = number(c, 2);
            uint256 expected = alg == 17 || alg == 61185 ? 20 : alg == 18 || alg == 27 ? 32 : alg == 19 ? 64 : 0;
            if (expected == 0 || len != expected) revert InvalidSchema();
            take(c, len);
        }
        take(c, 32);
        uint256 n = number(c, 2);
        if (n == 0 || n > 64) revert InvalidSchema();
        s.fields = new FieldCache[](n);
        bytes32[] memory names = new bytes32[](n);
        bool[] memory hasRef = new bool[](n);
        uint256 totalRefs;
        uint256 totalBody;
        for (uint256 i; i < n; ++i) {
            FieldResult memory f = field(c, false, 1);
            unique(names, i, f.name);
            s.fields[i] = f.cache;
            hasRef[i] = f.hasRef;
            totalBody += f.cache.maxBodyBytes;
            totalRefs += f.cache.references;
        }
        if (totalRefs > 16) revert InvalidSchema();
        s.maxBodyBytes = narrow(totalBody);
        roles(c, s, hasRef, ctx);
        indexes(c, s);
        if (number(c, 2) != 0) revert InvalidSchema();
        constraints(c, s);
        end(c);
    }

    function field(Cursor memory c, bool unnamed, uint256 depth) private pure returns (FieldResult memory r) {
        if (depth > 4) revert InvalidSchema();
        uint256 start = c.pos;
        r.name = text(c, 64, unnamed);
        if (unnamed && c.pos != start + 2) revert InvalidSchema();
        uint256 kind = number(c, 1);
        r.cache.kind = uint8(kind);
        uint256 body;
        uint256 refs;
        uint256 skip;
        if (kind == 1) {
            body = 1;
        } else if (kind >= 2 && kind <= 4) {
            uint256 width = number(c, 1);
            if (kind == 4
                    ? width == 0 || width > 32
                    : !(width == 1 || width == 2 || width == 4 || width == 8 || width == 16 || width == 32)) revert InvalidSchema();
            r.cache.widthOrMax = uint16(width);
            body = width;
        } else if (kind == 5 || kind == 6) {
            uint256 max = number(c, 2);
            if (max > (kind == 5 ? 8192 : 4096)) revert InvalidSchema();
            r.cache.widthOrMax = uint16(max);
            body = 2 + max;
            skip = 1;
        } else if (kind == 7 || kind == 8) {
            body = kind == 7 ? 32 : 34;
            refs = 1;
            r.hasRef = true;
        } else if (kind == 9) {
            body = 32;
        } else if (kind == 10) {
            body = 68;
            skip = 1;
        } else if (kind == 11 || kind == 12) {
            uint256 max = number(c, 2);
            if (max > (kind == 11 ? 1024 : 256)) revert InvalidSchema();
            r.cache.widthOrMax = uint16(max);
            FieldResult memory a = field(c, true, depth + 1);
            r.cache.innerKind = a.cache.kind;
            body = a.cache.maxBodyBytes;
            refs = a.cache.references;
            skip = a.cache.skipReads;
            r.hasRef = a.hasRef;
            if (kind == 12) {
                if (!(a.cache.kind >= 2 && a.cache.kind <= 6)) revert InvalidSchema();
                FieldResult memory v = field(c, true, depth + 1);
                body += v.cache.maxBodyBytes;
                refs += v.cache.references;
                skip += v.cache.skipReads;
                r.hasRef = r.hasRef || v.hasRef;
            }
            body = 2 + max * body;
            refs *= max;
            skip = 1 + max * skip;
        } else if (kind == 13) {
            uint256 count = number(c, 2);
            if (count == 0 || count > 64) revert InvalidSchema();
            bytes32[] memory names = new bytes32[](count);
            for (uint256 i; i < count; ++i) {
                FieldResult memory m = field(c, false, depth + 1);
                unique(names, i, m.name);
                body += m.cache.maxBodyBytes;
                refs += m.cache.references;
                skip += m.cache.skipReads;
                r.hasRef = r.hasRef || m.hasRef;
            }
        } else if (kind == 14) {
            // Conservative candidate-checker depth accounting, including OPTION.
            FieldResult memory inner = field(c, true, depth + 1);
            r.cache.innerKind = inner.cache.kind;
            body = 1 + uint256(inner.cache.maxBodyBytes);
            refs = inner.cache.references;
            skip = 1 + uint256(inner.cache.skipReads);
            r.hasRef = inner.hasRef;
        } else {
            revert InvalidSchema();
        }
        r.cache.maxBodyBytes = narrow(body);
        r.cache.references = narrow(refs);
        r.cache.skipReads = narrow(skip);
        r.cache.descriptor = slice(c.data, start, c.pos - start);
    }

    function roles(Cursor memory c, SchemaCache memory s, bool[] memory hasRef, Context memory ctx) private pure {
        uint256 count = number(c, 2);
        if (count > 16) revert InvalidSchema();
        s.roles = new RoleCache[](count);
        bool[] memory covered = new bool[](s.fields.length);
        for (uint256 i; i < count; ++i) {
            if (number(c, 1) != i) revert InvalidSchema();
            text(c, 64, false);
            uint256 cls = number(c, 1);
            bytes32 expected = bytes32(number(c, 32));
            uint256 fi = number(c, 1);
            if (number(c, 1) != 0 || number(c, 1) != 0 || fi >= s.fields.length) revert InvalidSchema();
            FieldCache memory f = s.fields[fi];
            uint256 leaf = f.kind == 14 || f.kind == 11 ? f.innerKind : f.kind;
            if (
                !(f.kind == 7 || f.kind == 8 || f.kind == 14 || f.kind == 11) || !(leaf == 7 || leaf == 8)
                    || (f.kind == 11 && leaf != 7)
            ) revert InvalidSchema();
            if (cls < 1 || cls > 5 || ((leaf == 8) != (cls == 4)) || covered[fi]) revert InvalidSchema();
            if (cls != 1 && cls != 5 && expected != bytes32(0)) revert InvalidSchema();
            extraction(s.fields, fi);
            covered[fi] = true;
            s.roles[i] = RoleCache(uint8(cls), resolve(expected, ctx), uint8(fi));
        }
        for (uint256 i; i < hasRef.length; ++i) {
            if (hasRef[i] && !covered[i]) revert InvalidSchema();
        }
    }

    function resolve(bytes32 expected, Context memory ctx) private pure returns (bytes32) {
        uint256 e = uint256(expected);
        if (e == 0) return expected;
        if (e == 1) return typeId(ctx.groupHash, ctx.own);
        if (e >= 256 && e < 272) {
            uint256 k = e - 256;
            if (k == ctx.own || k >= ctx.count || ctx.count == 1) revert InvalidSchema();
            return typeId(ctx.groupHash, k);
        }
        if (e < 65536) revert InvalidSchema();
        for (uint256 i; i < ctx.admitted.length; ++i) {
            if (ctx.admitted[i] == expected) return expected;
        }
        revert InvalidSchema();
    }

    function indexes(Cursor memory c, SchemaCache memory s) private pure {
        uint256 n = number(c, 2);
        if (n > 8) revert InvalidSchema();
        s.indexes = new IndexCache[](n);
        for (uint256 i; i < n; ++i) {
            uint256 kind = number(c, 1);
            uint256 target = number(c, 1);
            for (uint256 j; j < i; ++j) {
                if (s.indexes[j].kind == kind && s.indexes[j].target == target) revert InvalidSchema();
            }
            if (kind == 2) {
                if (target >= s.roles.length) revert InvalidSchema();
            } else {
                if (target >= s.fields.length) revert InvalidSchema();
                uint256 fk = s.fields[target].kind;
                if (kind == 1 ? !(fk >= 1 && fk <= 4 || fk == 9) : !(kind == 3 && fk == 10)) revert InvalidSchema();
                extraction(s.fields, target);
            }
            s.indexes[i] = IndexCache(uint8(kind), uint8(target));
        }
    }

    function constraints(Cursor memory c, SchemaCache memory s) private pure {
        uint256 n = number(c, 2);
        if (n > 32) revert InvalidSchema();
        s.constraints = new ConstraintCache[](n);
        for (uint256 i; i < n; ++i) {
            uint256 kind = number(c, 1);
            uint256 fi = number(c, 1);
            if (fi >= s.fields.length) revert InvalidSchema();
            uint256 fk = s.fields[fi].kind;
            int256 min;
            int256 max;
            if (kind == 1) {
                min = int256(number(c, 32));
                max = int256(number(c, 32));
                if (!(fk == 2 || fk == 3) || min > max) revert InvalidSchema();
            } else if (kind == 2) {
                if (!(fk == 5 || fk == 6 || fk == 11 || fk == 12)) revert InvalidSchema();
            } else if (kind == 3) {
                if (fk != 6) revert InvalidSchema();
            } else {
                revert InvalidSchema();
            }
            s.constraints[i] = ConstraintCache(uint8(kind), uint8(fi), min, max);
        }
    }

    function extraction(FieldCache[] memory f, uint256 target) private pure {
        uint256 walk;
        for (uint256 i; i < target; ++i) {
            walk += f[i].skipReads;
        }
        if (walk > 16) revert InvalidSchema();
    }

    function unique(bytes32[] memory names, uint256 at, bytes32 name) private pure {
        for (uint256 j; j < at; ++j) {
            if (names[j] == name) revert InvalidSchema();
        }
        names[at] = name;
    }

    function narrow(uint256 value) private pure returns (uint32) {
        if (value > type(uint32).max) revert InvalidSchema();
        return uint32(value);
    }

    function typeId(bytes32 gh, uint256 member) private pure returns (bytes32) {
        return keccak256(abi.encode(DOM_TYPE, gh, member));
    }

    function number(Cursor memory c, uint256 width) private pure returns (uint256 n) {
        if (width > c.data.length - c.pos) revert InvalidSchema();
        for (uint256 i; i < width; ++i) {
            n = (n << 8) | uint8(c.data[c.pos++]);
        }
    }

    function take(Cursor memory c, uint256 n) private pure returns (bytes memory b) {
        if (n > c.data.length - c.pos) revert InvalidSchema();
        b = slice(c.data, c.pos, n);
        c.pos += n;
    }

    function slice(bytes memory b, uint256 start, uint256 n) private pure returns (bytes memory out) {
        out = new bytes(n);
        for (uint256 i; i < n; ++i) {
            out[i] = b[start + i];
        }
    }

    function text(Cursor memory c, uint256 max, bool empty) private pure returns (bytes32 name) {
        bytes memory b = take(c, number(c, 2));
        if (b.length > max || (!empty && b.length == 0)) revert InvalidSchema();
        for (uint256 i; i < b.length; ++i) {
            uint8 v = uint8(b[i]);
            if (v > 127 || (!empty && (v < 32 || v == 127))) revert InvalidSchema();
        }
        return keccak256(b);
    }

    function end(Cursor memory c) private pure {
        if (c.pos != c.data.length) revert InvalidSchema();
    }
}
