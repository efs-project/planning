// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";

library RecordBody {
    struct ReferenceValue {
        uint8 roleIndex;
        bytes32 targetId;
        uint16 leafIndex;
    }

    struct CheckedBody {
        bytes[] fields;
        ReferenceValue[] references;
    }
    error InvalidBody(uint16 code);

    struct Cursor {
        bytes data;
        uint256 pos;
    }

    struct Descriptor {
        uint8 kind;
        uint256 arg;
        bool hasRef;
        Descriptor[] children;
    }

    struct Walk {
        Cursor body;
        ReferenceValue[] refs;
        uint256 count;
    }

    /// @dev Consumes an admitted TypeGroupParser cache, not an untrusted schema on-ramp.
    /// No target existence, occurrence membership, Principal semantics, NFC or Files claims.
    function validate(TypeGroupParser.SchemaCache memory s, bytes memory body)
        internal
        pure
        returns (CheckedBody memory checked)
    {
        if (body.length > 8192) revert InvalidBody(3);
        checked.fields = new bytes[](s.fields.length);
        Walk memory w = Walk(Cursor(body, 0), new ReferenceValue[](16), 0);
        for (uint256 i; i < s.fields.length; ++i) {
            Cursor memory dc = Cursor(s.fields[i].descriptor, 0);
            Descriptor memory d = descriptor(dc, 1);
            if (dc.pos != dc.data.length || d.kind != s.fields[i].kind) revert InvalidBody(13);
            uint256 roleIndex = 256;
            for (uint256 j; j < s.roles.length; ++j) {
                if (s.roles[j].fieldIdx != i) continue;
                if (roleIndex != 256 || j >= 16) revert InvalidBody(16);
                roleIndex = j;
            }
            if (d.hasRef || roleIndex != 256) {
                uint8 leaf = d.kind == 11 || d.kind == 14 ? d.children[0].kind : d.kind;
                if (
                    roleIndex == 256 || !(d.kind == 7 || d.kind == 8 || d.kind == 11 || d.kind == 14)
                        || !(leaf == 7 || leaf == 8) || (d.kind == 11 && leaf != 7)
                ) revert InvalidBody(16);
                uint8 cls = s.roles[roleIndex].targetClass;
                if (cls < 1 || cls > 5 || ((leaf == 8) != (cls == 4))) revert InvalidBody(16);
            }
            uint256 start = w.body.pos;
            decode(d, w, 1, roleIndex);
            checked.fields[i] = slice(body, start, w.body.pos - start);
        }
        if (w.body.pos != body.length) revert InvalidBody(1);
        for (uint256 i; i < s.roles.length; ++i) {
            if (s.roles[i].fieldIdx >= s.fields.length) revert InvalidBody(16);
        }
        constraints(s, checked.fields);
        checked.references = new ReferenceValue[](w.count);
        for (uint256 i; i < w.count; ++i) {
            checked.references[i] = w.refs[i];
        }
    }

    function descriptor(Cursor memory c, uint256 depth) private pure returns (Descriptor memory d) {
        if (depth > 4) revert InvalidBody(11);
        skip(c, number(c, 2, 13), 13); // Names were checked at descriptor admission.
        d.kind = uint8(number(c, 1, 13));
        uint8 k = d.kind;
        if (k >= 2 && k <= 4) {
            d.arg = number(c, 1, 13);
            if (k == 4
                    ? d.arg == 0 || d.arg > 32
                    : !(d.arg == 1 || d.arg == 2 || d.arg == 4 || d.arg == 8 || d.arg == 16 || d.arg == 32)) revert InvalidBody(13);
        } else if (k == 5 || k == 6) {
            d.arg = number(c, 2, 13);
            if (d.arg > (k == 5 ? 8192 : 4096)) revert InvalidBody(13);
        } else if (k == 11 || k == 12 || k == 13 || k == 14) {
            d.arg = k == 14 ? 0 : number(c, 2, 13);
            if ((k == 11 && d.arg > 1024) || (k == 12 && d.arg > 256) || (k == 13 && (d.arg == 0 || d.arg > 64))) {
                revert InvalidBody(13);
            }
            uint256 n = k == 12 ? 2 : k == 13 ? d.arg : 1;
            d.children = new Descriptor[](n);
            for (uint256 i; i < n; ++i) {
                // Stage A runtime OPTION does not add a container depth. The existing
                // admission parser is more conservative; this does not broaden its on-ramp.
                d.children[i] = descriptor(c, k == 14 ? depth : depth + 1);
                d.hasRef = d.hasRef || d.children[i].hasRef;
            }
            if (k == 12 && !(d.children[0].kind >= 2 && d.children[0].kind <= 6)) revert InvalidBody(13);
        } else if (k == 7 || k == 8) {
            d.hasRef = true;
        } else if (!(k == 1 || k == 9 || k == 10)) {
            revert InvalidBody(13);
        }
    }

    function decode(Descriptor memory d, Walk memory w, uint256 depth, uint256 roleIndex) private pure {
        if (depth > 4) revert InvalidBody(11);
        Cursor memory c = w.body;
        uint8 k = d.kind;
        if (k == 1) {
            if (number(c, 1, 2) > 1) revert InvalidBody(7);
        } else if (k >= 2 && k <= 4) {
            skip(c, d.arg, 2);
        } else if (k == 5 || k == 6) {
            uint256 n = number(c, 2, 2);
            if (n > d.arg) revert InvalidBody(3);
            uint256 start = c.pos;
            skip(c, n, 2);
            if (k == 6) utf8(c.data, start, n, false);
        } else if (k == 7 || k == 8) {
            // OCCREF is one full-width envelope word and uint16 leaf, never two roles.
            need(c, k == 7 ? 32 : 34, 2);
            bytes32 target = bytes32(number(c, 32, 2));
            uint16 leaf = k == 8 ? uint16(number(c, 2, 2)) : 0;
            if (k == 7 && uint256(target) < 65536) revert InvalidBody(8);
            if (w.count == 16) revert InvalidBody(15);
            if (roleIndex == 256) revert InvalidBody(16);
            w.refs[w.count++] = ReferenceValue(uint8(roleIndex), target, leaf);
        } else if (k == 9) {
            skip(c, 32, 2);
        } else if (k == 10) {
            need(c, 4, 2);
            uint256 alg = number(c, 2, 2);
            uint256 n = number(c, 2, 2);
            uint256 expected = alg == 17 || alg == 61185 ? 20 : alg == 18 || alg == 27 ? 32 : alg == 19 ? 64 : 0;
            if (expected == 0 || n != expected) revert InvalidBody(9);
            skip(c, n, 2);
        } else if (k == 11 || k == 12) {
            uint256 n = number(c, 2, 2);
            if (n > d.arg) revert InvalidBody(12);
            bytes memory previous;
            for (uint256 i; i < n; ++i) {
                uint256 start = c.pos;
                decode(d.children[0], w, depth + 1, roleIndex);
                if (k == 12) {
                    bytes memory key = slice(c.data, start, c.pos - start);
                    if (i != 0 && !less(previous, key)) revert InvalidBody(5);
                    previous = key;
                    decode(d.children[1], w, depth + 1, roleIndex);
                }
            }
        } else if (k == 13) {
            for (uint256 i; i < d.children.length; ++i) {
                decode(d.children[i], w, depth + 1, roleIndex);
            }
        } else if (k == 14) {
            uint256 flag = number(c, 1, 2);
            if (flag > 1) revert InvalidBody(6);
            if (flag == 1) decode(d.children[0], w, depth, roleIndex);
        } else {
            revert InvalidBody(13);
        }
    }

    function constraints(TypeGroupParser.SchemaCache memory s, bytes[] memory fields) private pure {
        for (uint256 i; i < s.constraints.length; ++i) {
            TypeGroupParser.ConstraintCache memory x = s.constraints[i];
            if (x.fieldIdx >= fields.length) revert InvalidBody(13);
            uint8 kind = s.fields[x.fieldIdx].kind;
            Cursor memory c = Cursor(fields[x.fieldIdx], 0);
            if (x.kind == 1) {
                if (!(kind == 2 || kind == 3) || x.min > x.max) revert InvalidBody(13);
                uint256 n = c.data.length;
                uint256 raw = number(c, n, 13);
                if (kind == 2) {
                    // Do not cast a UINT(32) above INT256_MAX to a negative value.
                    if (x.max < 0 || raw > uint256(x.max) || (x.min > 0 && raw < uint256(x.min))) {
                        revert InvalidBody(14);
                    }
                } else {
                    if (n < 32 && (raw & (uint256(1) << (n * 8 - 1))) != 0) raw |= type(uint256).max << (n * 8);
                    int256 value = int256(raw);
                    if (value < x.min || value > x.max) revert InvalidBody(14);
                }
            } else if (x.kind == 2) {
                if (!(kind == 5 || kind == 6 || kind == 11 || kind == 12)) revert InvalidBody(13);
                if (number(c, 2, 13) == 0) revert InvalidBody(14);
            } else if (x.kind == 3) {
                if (kind != 6) revert InvalidBody(13);
                uint256 n = number(c, 2, 13);
                if (n == 0) revert InvalidBody(14);
                utf8(c.data, 2, n, true);
            } else {
                revert InvalidBody(13);
            }
        }
    }

    function utf8(bytes memory b, uint256 start, uint256 n, bool name) private pure {
        uint256 end = start + n;
        for (uint256 i = start; i < end;) {
            uint256 first = uint8(b[i++]);
            uint256 cp;
            uint256 rest;
            uint256 min;
            if (first < 128) {
                cp = first;
            } else if (first >= 194 && first <= 223) {
                cp = first & 31;
                rest = 1;
                min = 128;
            } else if (first >= 224 && first <= 239) {
                cp = first & 15;
                rest = 2;
                min = 2048;
            } else if (first >= 240 && first <= 244) {
                cp = first & 7;
                rest = 3;
                min = 65536;
            } else {
                revert InvalidBody(4);
            }
            if (rest > end - i) revert InvalidBody(4);
            for (uint256 j; j < rest; ++j) {
                uint256 next = uint8(b[i++]);
                if (next < 128 || next > 191) revert InvalidBody(4);
                cp = (cp << 6) | (next & 63);
            }
            if (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) revert InvalidBody(4);
            if (name && (cp < 32 || (cp >= 127 && cp <= 159))) revert InvalidBody(14);
        }
    }

    function less(bytes memory a, bytes memory b) private pure returns (bool) {
        uint256 n = a.length < b.length ? a.length : b.length;
        for (uint256 i; i < n; ++i) {
            if (a[i] != b[i]) return uint8(a[i]) < uint8(b[i]);
        }
        return a.length < b.length;
    }

    function need(Cursor memory c, uint256 n, uint16 code) private pure {
        if (n > c.data.length - c.pos) revert InvalidBody(code);
    }

    function skip(Cursor memory c, uint256 n, uint16 code) private pure {
        need(c, n, code);
        c.pos += n;
    }

    function number(Cursor memory c, uint256 n, uint16 code) private pure returns (uint256 value) {
        need(c, n, code);
        for (uint256 i; i < n; ++i) {
            value = (value << 8) | uint8(c.data[c.pos++]);
        }
    }

    function slice(bytes memory b, uint256 start, uint256 n) internal pure returns (bytes memory out) {
        out = new bytes(n);
        // Preserve the loop's allocation-first and empty-span behavior.
        if (n == 0) return out;
        if (start >= b.length || n > b.length - start) {
            // Solidity's array-bounds panic, as in the former byte loop.
            assembly ("memory-safe") {
                mstore(0, shl(224, 0x4e487b71))
                mstore(4, 0x32)
                revert(0, 36)
            }
        }
        assembly ("memory-safe") {
            mcopy(add(out, 32), add(add(b, 32), start), n)
        }
    }
}
