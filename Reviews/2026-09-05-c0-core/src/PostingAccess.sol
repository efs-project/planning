// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {PostingStore} from "./PostingStore.sol";

interface PostingView {
    function head(bytes32) external view returns (uint256);
    function word(bytes32, uint64) external view returns (uint256);
    function keyAt(uint64) external view returns (bytes32);
    function writer() external view returns (address);
}

/// Bounded wire access; semantic head/word validation stays in checked readers.
library PostingAccess {
    error PostingUnavailable();

    function scalar(address target, bytes memory input) internal view returns (uint256 value) {
        bool ok;
        uint256 size;
        assembly ("memory-safe") {
            let out := mload(0x40)
            ok := staticcall(gas(), target, add(input, 32), mload(input), out, 32)
            size := returndatasize()
            value := mload(out)
        }
        if (!ok || size != 32) revert PostingUnavailable();
    }

    function head(address target, bytes32 key) internal view returns (uint256) {
        return scalar(target, abi.encodeCall(PostingView.head, (key)));
    }

    function word(address target, bytes32 key, uint64 index) internal view returns (uint256) {
        return scalar(target, abi.encodeCall(PostingView.word, (key, index)));
    }

    function keyAt(address target, uint64 ordinal) internal view returns (bytes32) {
        return bytes32(scalar(target, abi.encodeCall(PostingView.keyAt, (ordinal))));
    }

    function writer(address target) internal view returns (address) {
        uint256 value = scalar(target, abi.encodeCall(PostingView.writer, ()));
        if (value >> 160 != 0) revert PostingUnavailable();
        return address(uint160(value));
    }

    function mutate(address target, bytes memory input, uint256 expectedSize)
        private returns (uint256 first, uint256 second)
    {
        bool ok;
        uint256 size;
        assembly ("memory-safe") {
            let out := mload(0x40)
            mstore(0x40, add(out, 64))
            ok := call(gas(), target, 0, add(input, 32), mload(input), out, 64)
            size := returndatasize()
            // Existing assert/U48 errors are at most 36 bytes. Never copy a bomb.
            if and(iszero(ok), lt(size, 37)) {
                returndatacopy(out, 0, size)
                revert(out, size)
            }
            first := mload(out)
            second := mload(add(out, 32))
        }
        if (!ok || size != expectedSize) revert PostingUnavailable();
    }

    function append(address target, bytes32 key, uint64 ordinal, bool audit, uint64 high)
        internal returns (uint256 oldHead, uint64 newHigh)
    {
        uint256 value;
        (oldHead, value) = mutate(target, abi.encodeCall(PostingStore.append, (key, ordinal, audit, high)), 64);
        if (value >> 64 != 0) revert PostingUnavailable();
        newHigh = uint64(value);
    }

    function liveDelta(address target, bytes32 key, bool increase) internal returns (uint256 oldHead) {
        (oldHead,) = mutate(target, abi.encodeCall(PostingStore.liveDelta, (key, increase)), 32);
    }
}
