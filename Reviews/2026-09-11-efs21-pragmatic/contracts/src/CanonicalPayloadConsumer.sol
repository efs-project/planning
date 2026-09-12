// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "./NativeKernel.sol";

/// @notice Unrelated exact canonical u16 BYTES consumer; no inferred legacy conversion.
contract CanonicalPayloadConsumer {
    bytes32 public immutable canonicalType;
    bytes32 public lastDigest;
    uint256 public lastLength;
    uint64 public lastRevision;
    bytes32 public lastRecordId;
    error UnsupportedFile();
    error InvalidCanonicalPayload();

    constructor(bytes32 exactType) {
        canonicalType = exactType;
    }

    function read(NativeKernel kernel, address namespace, bytes[] calldata path)
        public
        view
        returns (bytes32 digest, uint256 length, uint64 revision, bytes32 recordId)
    {
        bytes32 id = kernel.resolve(namespace, path);
        if (id == 0) revert UnsupportedFile();
        NativeKernel.FileInfo memory file = kernel.fileInfo(id);
        if (!file.live || file.directory) revert UnsupportedFile();
        NativeKernel.Record memory record = kernel.readRecord(file.recordId);
        if (record.typeId != canonicalType) revert UnsupportedFile();
        bytes memory body = record.body;
        if (body.length < 2) revert InvalidCanonicalPayload();
        length = uint256(uint8(body[0])) * 256 + uint8(body[1]);
        if (length > 4094 || length != body.length - 2) revert InvalidCanonicalPayload();
        assembly ("memory-safe") { digest := keccak256(add(body, 34), length) }
        return (digest, length, file.revision, file.recordId);
    }

    function capture(NativeKernel kernel, address namespace, bytes[] calldata path) external {
        (lastDigest, lastLength, lastRevision, lastRecordId) = read(kernel, namespace, path);
    }
}
