// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice B0 experiment grammar. No standing plan registry or publication authority.
library LensPlan {
    bytes32 internal constant EXPERIMENT_PLAN_TYPE = 0x05cc2a7f4eec5faff7e64f2f8374aca5f980d390fd4eee3b46c2f5c53853e61e;
    bytes32 internal constant SEMANTICS_PROFILE_B0 = keccak256("efs2/lens-semantics/b0/1");
    uint16 internal constant WINNER_NONE = 0xffff;

    enum Presence {
        UNKNOWN,
        FOUND,
        ABSENT,
        CONFLICT,
        UNSUPPORTED
    }

    struct BasisReport {
        bytes32 realmRevisionId;
        uint64 blockNumber;
        uint64 admissionHigh;
        uint8 basisKind;
    }

    struct ResolvedTarget {
        uint8 targetKind;
        bytes32 targetA;
        uint16 targetLeaf;
    }

    struct ResolveResult {
        Presence presence;
        uint8 reasonCode;
        ResolvedTarget target;
        uint16 winnerIndex;
        uint16 winnerTier;
        uint64 winnerAdmissionOrdinal;
        uint16 presentCount;
        uint16 agreeCount;
        BasisReport basis;
    }

    struct Entry {
        bytes32 principalId;
        uint16 tier;
    }

    struct Plan {
        uint8 combiner;
        uint16 thresholdK;
        bytes32 purposeAndScope;
        bytes32 semanticsProfileId;
        Entry[] entries;
    }

    function validate(bytes32 typeId, bytes memory b) internal pure returns (uint8) {
        if (typeId != EXPERIMENT_PLAN_TYPE) return 1;
        if (b.length < 98 || u16(b, 0) != b.length - 2) return 2;
        uint16 n = u16(b, 8);
        if (b.length != 98 + 64 * uint256(n)) return 2;
        if (b[2] != 0x01) return 3;
        uint8 combiner = uint8(b[3]);
        if (combiner > 2) return 4;
        if (uint8(b[4]) & 0xfe != 0) return 5;
        // Structural-code order is global, not entry-local. Even an over-cap
        // frame checks entry flags first; the canonical u16 length bounds this
        // scan to 1,022 entries (the retained Record reader bounds it further).
        for (uint256 i; i < n; ++i) {
            if (u16(b, 132 + 64 * i) != 0) return 5;
        }
        uint16 k = u16(b, 6);
        if (combiner == 2 ? (k == 0 || k > n) : k != 0) return 6;
        if (n == 0 || n > 64) return 7;
        bool duplicate;
        bool reserved = b[5] != 0 || uint256(word(b, 2)) & ((uint256(1) << 192) - 1) != 0;
        bool badTier;
        bool tiedTier;
        bool authFloor;
        for (uint256 i; i < n; ++i) {
            uint256 at = 98 + 64 * i;
            bytes32 principal = word(b, at);
            uint256 metadata = uint256(word(b, at + 32));
            uint16 tier = u16(b, at + 32);
            if (i != 0) {
                uint16 previousTier = u16(b, at - 32);
                if (tier < previousTier || (tier == previousTier && principal <= word(b, at - 64))) return 8;
                if (tier == previousTier) tiedTier = true;
            }
            for (uint256 j; j < i; ++j) {
                if (principal == word(b, 98 + 64 * j)) duplicate = true;
            }
            if (metadata & ((uint256(1) << 160) - 1) != 0) reserved = true;
            if (tier != 0) badTier = true;
            if ((metadata >> 160) & type(uint64).max != 0) authFloor = true;
        }
        if (duplicate) return 9;
        if (reserved) return 10;
        if (combiner != 1 && badTier) return 11;
        if (uint8(b[4]) & 1 != 0 && tiedTier) return 12;
        if (authFloor) return 13;
        return 0;
    }

    /// @dev Call only after validate returned zero.
    function decode(bytes memory b) internal pure returns (Plan memory p) {
        p.combiner = uint8(b[3]);
        p.thresholdK = u16(b, 6);
        p.purposeAndScope = word(b, 34);
        p.semanticsProfileId = word(b, 66);
        uint16 n = u16(b, 8);
        p.entries = new Entry[](n);
        for (uint256 i; i < n; ++i) {
            p.entries[i] = Entry(word(b, 98 + 64 * i), u16(b, 130 + 64 * i));
        }
    }

    function deriveBindingKey(bytes32 principalId, bytes32 positionKey) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/binding/1"), principalId, positionKey));
    }

    function u16(bytes memory b, uint256 at) private pure returns (uint16) {
        return (uint16(uint8(b[at])) << 8) | uint16(uint8(b[at + 1]));
    }

    function word(bytes memory b, uint256 at) private pure returns (bytes32 value) {
        assembly ("memory-safe") { value := mload(add(add(b, 32), at)) }
    }
}
