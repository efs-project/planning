// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library StorageByteView {
    error ErrReadState(bytes32 subject);

    function word(bytes storage value, uint256 offset, bytes32 subject) internal view returns (uint256 result) {
        uint256 n = value.length;
        if (offset & 31 != 0 || offset > n || 32 > n - offset) revert ErrReadState(subject);
        assembly ("memory-safe") {
            mstore(0, value.slot)
            result := sload(add(keccak256(0, 32), div(offset, 32)))
        }
    }

    function slice(bytes storage value, uint256 start, uint256 length, bytes32 subject)
        internal
        view
        returns (bytes memory result)
    {
        uint256 n = value.length;
        if (start > n || length > n - start || length > 8192) revert ErrReadState(subject);
        result = new bytes(length);
        if (length == 0) return result;

        uint256 base;
        uint256 shortWord;
        if (n < 32) {
            assembly ("memory-safe") {
                shortWord := sload(value.slot)
            }
        } else {
            assembly ("memory-safe") {
                mstore(0, value.slot)
                base := keccak256(0, 32)
            }
        }

        for (uint256 copied; copied < length; copied += 32) {
            uint256 chunk = length - copied;
            if (chunk > 32) chunk = 32;
            uint256 sourceOffset = start + copied;
            uint256 shiftBytes = sourceOffset & 31;
            uint256 selected;
            if (n < 32) {
                selected = shortWord << (shiftBytes * 8);
            } else {
                uint256 first;
                assembly ("memory-safe") {
                    first := sload(add(base, div(sourceOffset, 32)))
                }
                selected = first << (shiftBytes * 8);
                if (shiftBytes != 0 && shiftBytes + chunk > 32) {
                    uint256 second;
                    assembly ("memory-safe") {
                        second := sload(add(add(base, div(sourceOffset, 32)), 1))
                    }
                    selected |= second >> ((32 - shiftBytes) * 8);
                }
            }
            if (chunk < 32) selected &= type(uint256).max << ((32 - chunk) * 8);
            assembly ("memory-safe") {
                mstore(add(add(result, 32), copied), selected)
            }
        }
    }
}
