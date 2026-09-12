// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "./NativeKernel.sol";

/// @notice Bounded paid read probe; digest and count are independently readable effects.
contract BodyReadConsumer {
    bytes32 public lastDigest;
    uint256 public lastReads;
    error InvalidCount();

    function capture(NativeKernel kernel, bytes32 id, uint256 count) external {
        if (count == 0 || count > 8) revert InvalidCount();
        bytes32 digest;
        for (uint256 i; i < count; ++i) {
            digest = keccak256(kernel.readRecord(id).body);
        }
        lastDigest = digest;
        lastReads = count;
    }
}
