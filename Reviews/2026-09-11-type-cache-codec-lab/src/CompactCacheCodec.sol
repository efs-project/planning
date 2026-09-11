// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// Standalone disposable experiment. Not connected to EFS Core.
contract CompactCacheCodec {
    struct FieldCache {
        uint8 kind;
        uint8 innerKind;
        uint16 widthOrMax;
        uint32 maxBodyBytes;
        uint32 references;
        uint32 skipReads;
        bytes descriptor;
    }
    struct RoleCache { uint8 targetClass; bytes32 expectedType; uint8 fieldIdx; }
    struct IndexCache { uint8 kind; uint8 target; }
    struct ConstraintCache { uint8 kind; uint8 fieldIdx; int256 min; int256 max; }
    struct SchemaCache {
        bytes32 typeId;
        bytes32 blobHash;
        uint32 maxBodyBytes;
        FieldCache[] fields;
        RoleCache[] roles;
        IndexCache[] indexes;
        ConstraintCache[] constraints;
    }
    struct Header {
        bytes32 typeId;
        bytes32 blobHash;
        uint32 maxBodyBytes;
        uint8 fieldCount;
        uint8 roleCount;
        uint8 indexCount;
        uint8 constraintCount;
        uint16 fieldSectionBytes;
    }
    // Experiment profile bounds, not new Type-language or protocol constants.
    uint256 private constant LOGICAL_MAX = 131072;
    uint256 private constant DESCRIPTORS_MAX = 8190;
    uint256 private constant PHYSICAL_MAX = 12110;
    uint256 private constant TAG = 0x45433031; // EC01
    error InvalidCache(uint8 reason);

    /// Lossless physical encoding only. Does not establish schema validity,
    /// Type admission, authorship, or authority. All logical fields survive.
    function pack(bytes calldata logical) external pure returns (bytes memory out) {
        if (logical.length > LOGICAL_MAX) revert InvalidCache(1);
        SchemaCache memory s = abi.decode(logical, (SchemaCache));
        if (keccak256(abi.encode(s)) != keccak256(logical)) revert InvalidCache(2);
        _counts(s.fields.length, s.roles.length, s.indexes.length, s.constraints.length);
        uint256 fieldBytes = 18 * s.fields.length;
        for (uint256 i; i < s.fields.length; ++i) fieldBytes += s.fields[i].descriptor.length;
        if (fieldBytes - 18 * s.fields.length > DESCRIPTORS_MAX) revert InvalidCache(3);
        out = new bytes(96 + fieldBytes + 34 * s.roles.length + 2 * s.indexes.length + 66 * s.constraints.length);
        _write(out, 0, TAG, 4);
        _write(out, 4, s.fields.length, 1);
        _write(out, 5, s.roles.length, 1);
        _write(out, 6, s.indexes.length, 1);
        _write(out, 7, s.constraints.length, 1);
        _write(out, 8, s.maxBodyBytes, 4);
        _write(out, 12, fieldBytes, 2);
        // Bytes 14..31 remain canonical zero padding.
        _write(out, 32, uint256(s.typeId), 32);
        _write(out, 64, uint256(s.blobHash), 32);
        uint256 p = 96;
        for (uint256 i; i < s.fields.length; ++i) {
            FieldCache memory f = s.fields[i];
            _write(out, p, f.kind, 1); _write(out, p + 1, f.innerKind, 1);
            _write(out, p + 2, f.widthOrMax, 2); _write(out, p + 4, f.maxBodyBytes, 4);
            _write(out, p + 8, f.references, 4); _write(out, p + 12, f.skipReads, 4);
            _write(out, p + 16, f.descriptor.length, 2);
            p += 18;
            bytes memory d = f.descriptor;
            assembly ("memory-safe") { mcopy(add(add(out, 32), p), add(d, 32), mload(d)) }
            p += d.length;
        }
        for (uint256 i; i < s.roles.length; ++i) {
            RoleCache memory r = s.roles[i];
            _write(out, p, r.targetClass, 1); _write(out, p + 1, uint256(r.expectedType), 32);
            _write(out, p + 33, r.fieldIdx, 1); p += 34;
        }
        for (uint256 i; i < s.indexes.length; ++i) {
            _write(out, p, s.indexes[i].kind, 1); _write(out, p + 1, s.indexes[i].target, 1); p += 2;
        }
        for (uint256 i; i < s.constraints.length; ++i) {
            ConstraintCache memory c = s.constraints[i];
            _write(out, p, c.kind, 1); _write(out, p + 1, c.fieldIdx, 1);
            _write(out, p + 2, uint256(c.min), 32); _write(out, p + 34, uint256(c.max), 32); p += 66;
        }
        assert(p == out.length);
    }

    function unpack(bytes calldata physical) external pure returns (bytes memory) {
        Header memory h = _header(physical);
        SchemaCache memory s;
        s.typeId = h.typeId; s.blobHash = h.blobHash; s.maxBodyBytes = h.maxBodyBytes;
        s.fields = new FieldCache[](h.fieldCount);
        s.roles = new RoleCache[](h.roleCount);
        s.indexes = new IndexCache[](h.indexCount);
        s.constraints = new ConstraintCache[](h.constraintCount);
        uint256 p = 96;
        for (uint256 i; i < h.fieldCount; ++i) {
            uint256 n = _read(physical, p + 16, 2);
            s.fields[i] = FieldCache(
                uint8(_read(physical, p, 1)), uint8(_read(physical, p + 1, 1)),
                uint16(_read(physical, p + 2, 2)), uint32(_read(physical, p + 4, 4)),
                uint32(_read(physical, p + 8, 4)), uint32(_read(physical, p + 12, 4)),
                physical[p + 18:p + 18 + n]
            );
            p += 18 + n;
        }
        for (uint256 i; i < h.roleCount; ++i) {
            s.roles[i] = RoleCache(uint8(_read(physical, p, 1)), bytes32(_read(physical, p + 1, 32)), uint8(_read(physical, p + 33, 1)));
            p += 34;
        }
        for (uint256 i; i < h.indexCount; ++i) {
            s.indexes[i] = IndexCache(uint8(_read(physical, p, 1)), uint8(_read(physical, p + 1, 1))); p += 2;
        }
        for (uint256 i; i < h.constraintCount; ++i) {
            s.constraints[i] = ConstraintCache(uint8(_read(physical, p, 1)), uint8(_read(physical, p + 1, 1)), int256(_read(physical, p + 2, 32)), int256(_read(physical, p + 34, 32)));
            p += 66;
        }
        assert(p == physical.length);
        return abi.encode(s);
    }

    /// Bounded shape/framing check with no descriptor-body allocation or parsing.
    /// This does not upgrade an arbitrary physical blob into an admitted Type.
    function readHeader(bytes calldata physical) external pure returns (Header memory) { return _header(physical); }

    function _header(bytes calldata b) private pure returns (Header memory h) {
        if (b.length < 96 || b.length > PHYSICAL_MAX || _read(b, 0, 4) != TAG || _read(b, 14, 18) != 0) revert InvalidCache(4);
        h = Header(bytes32(_read(b, 32, 32)), bytes32(_read(b, 64, 32)), uint32(_read(b, 8, 4)),
            uint8(_read(b, 4, 1)), uint8(_read(b, 5, 1)), uint8(_read(b, 6, 1)), uint8(_read(b, 7, 1)), uint16(_read(b, 12, 2)));
        _counts(h.fieldCount, h.roleCount, h.indexCount, h.constraintCount);
        uint256 end = 96 + uint256(h.fieldSectionBytes);
        if (h.fieldSectionBytes < 18 * uint256(h.fieldCount)
            || h.fieldSectionBytes - 18 * uint256(h.fieldCount) > DESCRIPTORS_MAX
            || end + 34 * uint256(h.roleCount) + 2 * uint256(h.indexCount) + 66 * uint256(h.constraintCount) != b.length) revert InvalidCache(5);
        uint256 p = 96;
        for (uint256 i; i < h.fieldCount; ++i) {
            if (p + 18 > end) revert InvalidCache(6);
            p += 18 + _read(b, p + 16, 2);
            if (p > end) revert InvalidCache(6);
        }
        if (p != end) revert InvalidCache(6);
    }

    function _counts(uint256 f, uint256 r, uint256 x, uint256 c) private pure {
        if (f == 0 || f > 64 || r > 16 || x > 8 || c > 32) revert InvalidCache(7);
    }

    function _read(bytes calldata b, uint256 p, uint256 n) private pure returns (uint256 v) {
        if (n == 0 || n > 32 || p > b.length || n > b.length - p) revert InvalidCache(8);
        assembly ("memory-safe") { v := shr(mul(sub(32, n), 8), calldataload(add(b.offset, p))) }
    }

    function _write(bytes memory b, uint256 p, uint256 v, uint256 n) private pure {
        assert(n > 0 && n <= 32 && p + n <= b.length);
        if (n == 32) {
            assembly ("memory-safe") { mstore(add(add(b, 32), p), v) }
            return;
        }
        for (uint256 i = n; i != 0; --i) { b[p + i - 1] = bytes1(uint8(v)); v >>= 8; }
        assert(v == 0);
    }
}
