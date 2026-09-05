// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Bounded efs-lab/1 state carrier. Raw ranges are not integrity proofs.
contract EfsLabBytes {
    address public immutable core;
    mapping(bytes32 => bytes) private payloads;
    mapping(bytes32 => bool) public exists;
    error CarrierAccess();
    error CarrierBounds();
    error MissingBytes();

    constructor() {
        core = msg.sender;
    }

    function put(bytes calldata data) external returns (bytes32 id) {
        if (msg.sender != core) revert CarrierAccess();
        if (data.length > 16384) revert CarrierBounds();
        id = keccak256(abi.encode(keccak256("efs-lab/bytes/1"), keccak256(data)));
        if (!exists[id]) {
            payloads[id] = data;
            exists[id] = true;
        }
    }

    function read(bytes32 id) external view returns (bytes memory) {
        if (!exists[id]) revert MissingBytes();
        return payloads[id];
    }

    function readRange(bytes32 id, uint64 offset, uint32 length) external view returns (bytes memory out) {
        if (!exists[id]) revert MissingBytes();
        bytes storage data = payloads[id];
        if (length > 4096 || offset > data.length || length > data.length - offset) revert CarrierBounds();
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = data[offset + i];
        }
    }
}
