// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Benchmark-only unrelated paid STATICCALL hop, not a product API.
contract PaidReadProbe {
    bytes32 public lastDigest;
    uint256 public lastLength;
    uint256 public lastReads;
    error ReadRefused();
    uint256 public constant MAX_RETURN_BYTES = 8192;

    function capture(address target, bytes calldata input) external {
        bool ok;
        uint256 length;
        bytes memory callData = input;
        assembly ("memory-safe") {
            ok := staticcall(gas(), target, add(callData, 32), mload(callData), 0, 0)
            length := returndatasize()
        }
        if (!ok || length > MAX_RETURN_BYTES) revert ReadRefused();
        bytes memory result = new bytes(length);
        assembly ("memory-safe") { returndatacopy(add(result, 32), 0, length) }
        lastDigest = keccak256(result);
        lastLength = length;
        ++lastReads;
    }
}
