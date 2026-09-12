// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "../../src/NativeKernel.sol";

// Test-only physical-path controls. Pure overrides allow the compiler to eliminate occupancy scanning.
contract ForcedCodeKernel is NativeKernel {
    function _selectBodyBackend(uint256, uint256) internal pure override returns (uint8) {
        return 0;
    }
}

contract ForcedWordsKernel is NativeKernel {
    function _selectBodyBackend(uint256, uint256) internal pure override returns (uint8) {
        return 1;
    }
}
