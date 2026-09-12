// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Fixed STOP-prefixed immutable bodies for one creating kernel; no arbitrary initcode.
contract LegacyBodyWriter {
    address private immutable kernel;

    error Unauthorized();
    error BodyTooLarge();
    error DeploymentFailed();

    constructor() {
        kernel = msg.sender;
    }

    function write(bytes calldata body) external returns (address pointer) {
        if (msg.sender != kernel) revert Unauthorized();
        if (body.length > 4096) revert BodyTooLarge();
        // The bound precedes narrowing. Ten constructor bytes return STOP || exact body.
        // forge-lint: disable-next-line(unsafe-typecast)
        bytes memory init = abi.encodePacked(hex"61", bytes2(uint16(body.length + 1)), hex"80600a3d393df300", body);
        assembly ("memory-safe") { pointer := create(0, add(init, 32), mload(init)) }
        if (pointer == address(0)) revert DeploymentFailed();
    }
}
