// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Exact arbitrary bytes, including empty; no ABI framing or UTF-8 promise.
/// The kernel independently enforces its MAX_BODY limit.
contract RawBytesValidator {
    function validate(bytes calldata) external pure returns (bool) {
        return true;
    }
}
