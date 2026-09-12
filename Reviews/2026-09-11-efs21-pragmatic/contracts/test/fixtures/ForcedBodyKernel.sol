// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LegacyNativeRecordKernel as NativeRecordKernel} from "./legacy4cb/LegacyNativeRecordKernel.sol";

// Test-only physical-path controls. Pure overrides allow the compiler to eliminate occupancy scanning.
contract ForcedCodeKernel is NativeRecordKernel {
    function _selectBodyBackend(uint256, uint256) internal pure override returns (uint8) {
        return 0;
    }
}

contract ForcedWordsKernel is NativeRecordKernel {
    function _selectBodyBackend(uint256, uint256) internal pure override returns (uint8) {
        return 1;
    }
}
