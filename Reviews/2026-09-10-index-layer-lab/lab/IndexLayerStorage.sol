// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Lab-only storage for the declared-family index layer (L1 of
/// index-layer-2026-09-10.md). Lives in its own ERC-7201 namespace inside the
/// Core proxy so the pinned kernel Store is untouched. Disposable prototype.
library IndexLayerStorage {
    struct Family {
        bytes32 id;
        bytes32 typeId; // universe: bindings whose current target is a record of this Type
        uint256 program; // FieldWalk program compiled from the Type's schema cache at declaration
        uint256 packed; // fieldIndex u8 | state u8 <<8 | declaredAt u48 <<16 | detachAt u48 <<64 | retiredAt u48 <<112
    }

    /// @custom:storage-location erc7201:efs.lab.index-layer.v1
    struct Layout {
        uint64 familyCount;
        uint64 detachDelay; // admissions between announceDetach and detach (0 => DEFAULT_DETACH_DELAY)
        mapping(uint64 => Family) families; // family ordinal -> row
        mapping(bytes32 => uint64) familyOrdinal; // family id -> ordinal
        mapping(bytes32 => uint256) typeFamilies; // typeId -> up to 8 family ordinals, u32 each (slot i at bits 32i)
        mapping(bytes32 => uint256) coverage; // coverageKey -> through u48 | liveFrom u48 <<48 | revision u32 <<96 | state u8 <<128
        mapping(bytes32 => mapping(uint64 => uint256)) words; // wordKey -> word index -> 256 position bits
    }

    bytes32 internal constant SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.lab.index-layer.v1")) - 1)) & ~bytes32(uint256(255));
    bytes32 internal constant DOM_FAMILY = keccak256("efs2/lab/index-family/1");
    bytes32 internal constant DOM_CURSOR = keccak256("efs2/lab/index-cursor/1");
    uint64 internal constant NONE = type(uint64).max;
    uint256 internal constant U48 = (uint256(1) << 48) - 1;
    uint64 internal constant DEFAULT_DETACH_DELAY = 4;
    uint8 internal constant COV_NONE = 0; // pre-declaration scope with no slot yet: [0, liveFrom) uncovered
    uint8 internal constant COV_PARTIAL = 1;
    uint8 internal constant COV_COMPLETE = 2;
    uint8 internal constant COV_FROZEN = 3; // reported only; derived from the family's retiredAt

    function layout() internal pure returns (Layout storage l) {
        bytes32 s = SLOT;
        assembly ("memory-safe") {
            l.slot := s
        }
    }

    function fieldIndexOf(uint256 packed) internal pure returns (uint8) {
        return uint8(packed);
    }

    function stateOf(uint256 packed) internal pure returns (uint8) {
        return uint8(packed >> 8);
    }

    function declaredAtOf(uint256 packed) internal pure returns (uint64) {
        return uint64((packed >> 16) & U48);
    }

    function detachAtOf(uint256 packed) internal pure returns (uint64) {
        return uint64((packed >> 64) & U48);
    }

    function retiredAtOf(uint256 packed) internal pure returns (uint64) {
        return uint64((packed >> 112) & U48);
    }

    function packFamily(uint8 fieldIndex, uint8 state, uint64 declaredAt, uint64 detachAt, uint64 retiredAt)
        internal
        pure
        returns (uint256)
    {
        return uint256(fieldIndex) | (uint256(state) << 8) | (uint256(declaredAt) << 16) | (uint256(detachAt) << 64)
            | (uint256(retiredAt) << 112);
    }

    function packCoverage(uint64 through, uint64 liveFrom, uint32 revision, uint8 state)
        internal
        pure
        returns (uint256)
    {
        return uint256(through) | (uint256(liveFrom) << 48) | (uint256(revision) << 96) | (uint256(state) << 128);
    }

    function unpackCoverage(uint256 c)
        internal
        pure
        returns (uint64 through, uint64 liveFrom, uint32 revision, uint8 state)
    {
        through = uint64(c & U48);
        liveFrom = uint64((c >> 48) & U48);
        revision = uint32(c >> 96);
        state = uint8(c >> 128);
    }

    function coverageKey(uint64 ordinal, bytes32 scopeKey) internal pure returns (bytes32) {
        return keccak256(abi.encode(ordinal, scopeKey));
    }

    function wordKey(uint64 ordinal, bytes32 scopeKey, bytes32 bucket) internal pure returns (bytes32) {
        return keccak256(abi.encode(ordinal, scopeKey, bucket));
    }

    /// OR one position bit (never XOR). No write when already set.
    function setBit(Layout storage l, uint64 ordinal, bytes32 scopeKey, bytes32 bucket, uint64 position)
        internal
        returns (bool changed)
    {
        bytes32 wk = wordKey(ordinal, scopeKey, bucket);
        uint64 w = position / 256;
        uint256 mask = uint256(1) << (position % 256);
        uint256 word = l.words[wk][w];
        if (word & mask != 0) return false;
        l.words[wk][w] = word | mask;
        return true;
    }

    /// Clear one position bit on a rebind away from the bucket. No write when already clear.
    function clearBit(Layout storage l, uint64 ordinal, bytes32 scopeKey, bytes32 bucket, uint64 position)
        internal
        returns (bool changed)
    {
        bytes32 wk = wordKey(ordinal, scopeKey, bucket);
        uint64 w = position / 256;
        uint256 mask = uint256(1) << (position % 256);
        uint256 word = l.words[wk][w];
        if (word & mask == 0) return false;
        l.words[wk][w] = word & ~mask;
        return true;
    }

    function bit(Layout storage l, uint64 ordinal, bytes32 scopeKey, bytes32 bucket, uint64 position)
        internal
        view
        returns (bool)
    {
        return l.words[wordKey(ordinal, scopeKey, bucket)][position / 256] & (uint256(1) << (position % 256)) != 0;
    }
}
