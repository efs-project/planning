// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LegacyNativeKernel} from "./LegacyNativeKernel.sol";

/// @notice Bounded paid read probe; digest and count are independently readable effects.
contract LegacyBodyReadConsumer {
    bytes32 public lastDigest;
    uint256 public lastReads;
    error InvalidCount();

    function capture(LegacyNativeKernel kernel, bytes32 id, uint256 count) external {
        if (count == 0 || count > 8) revert InvalidCount();
        bytes32 digest;
        for (uint256 i; i < count; ++i) {
            digest = keccak256(kernel.readRecord(id).body);
        }
        lastDigest = digest;
        lastReads = count;
    }
}
