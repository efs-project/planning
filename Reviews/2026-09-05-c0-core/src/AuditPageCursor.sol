// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Ordinary PageCursorV1 transport only; not authority or a completeness proof.
library AuditPageCursor {
    error ErrPageCursor(uint256 cursor);
    uint256 internal constant GUARD = (uint256(1) << 48) - 1;
    uint256 private constant CONTEXT_MASK = (uint256(1) << 103) - 1;

    function context(
        bytes32 realm,
        bytes32 revision,
        uint8 mode,
        bytes32 T,
        uint8 kind,
        uint8 ordinal,
        bytes32 valueKey
    ) internal pure returns (uint256) {
        bytes32 digest = keccak256(
            abi.encode(
                keccak256("efs2/pk/1"),
                realm,
                revision,
                uint256(1),
                uint256(mode),
                T,
                uint256(kind),
                uint256(ordinal),
                valueKey
            )
        );
        return uint256(digest) & CONTEXT_MASK;
    }

    function encode(uint64 next, uint64 end, uint64 H, uint256 tag) internal pure returns (uint256) {
        return uint256(next) | (uint256(end) << 48) | (uint256(H) << 96) | (uint256(1) << 144) | (tag << 152);
    }

    function decode(uint256 token, uint64 end, uint64 H, uint256 tag) internal pure returns (uint64 next) {
        next = uint64(token & GUARD);
        if (
            token >> 255 != 0 || uint8(token >> 144) != 1 || next == 0 || next >= end || H == 0 || H >= GUARD
                || ((token >> 48) & GUARD) != end || ((token >> 96) & GUARD) != H
                || ((token >> 152) & CONTEXT_MASK) != tag
        ) revert ErrPageCursor(token);
    }
}
