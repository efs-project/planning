// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StorageByteView} from "./StorageByteView.sol";

/// Fresh-state shared blocks: address160 | offset16 | length16 | extent16.
/// The remaining 48 bits are reserved here; Envelope ordinals are stripped by its accessor.
library ImmutableByteView {
    uint256 internal constant MAX_EXTENT = 10496;

    function length(uint256 refWord, bytes32 subject) internal view returns (uint256 n) {
        address pointer = address(uint160(refWord));
        uint256 offset = uint16(refWord >> 160);
        n = uint16(refWord >> 176);
        uint256 extent = uint16(refWord >> 192);
        if (
            refWord >> 208 != 0 || pointer == address(0) || extent > MAX_EXTENT || offset > extent
                || n > extent - offset || pointer.code.length != extent + 1
        ) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint256 first;
        assembly ("memory-safe") {
            extcodecopy(pointer, 0, 0, 1)
            first := byte(0, mload(0))
        }
        if (first != 0) revert StorageByteView.ErrReadState(subject);
    }

    /// Caller has validated the reference and subrange, before allocation.
    function copyChecked(uint256 refWord, uint256 start, uint256 n) internal view returns (bytes memory out) {
        out = new bytes(n);
        address pointer = address(uint160(refWord));
        uint256 offset = uint16(refWord >> 160);
        assembly ("memory-safe") { extcodecopy(pointer, add(out, 32), add(add(offset, start), 1), n) }
    }

    /// Caller validates the bytes it consumes. A short-word consumer may read
    /// neighboring code into scratch, but must discard every byte beyond its range.
    /// No alignment restriction on the physical slice; no memory is allocated.
    function wordChecked(uint256 refWord, uint256 start) internal view returns (uint256 value) {
        address pointer = address(uint160(refWord));
        uint256 offset = uint16(refWord >> 160);
        assembly ("memory-safe") {
            extcodecopy(pointer, 0, add(add(offset, start), 1), 32)
            value := mload(0)
        }
    }
}
