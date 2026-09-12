// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "./NativeKernel.sol";

/// @notice Unrelated consumer of two explicitly pinned representations. Not a text decoder.
contract PayloadConsumer {
    bytes32 public immutable canonicalType;
    bytes32 public immutable rawType;
    bytes32 public lastDigest;
    uint256 public lastLength;
    uint64 public lastRevision;
    bytes32 public lastRecordId;
    error UnsupportedFile();

    constructor(bytes32 canonical, bytes32 raw) {
        canonicalType = canonical;
        rawType = raw;
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
        bytes memory payload;
        if (record.typeId == rawType) payload = record.body;
        else if (record.typeId == canonicalType) payload = abi.decode(record.body, (bytes));
        else revert UnsupportedFile();
        return (keccak256(payload), payload.length, file.revision, file.recordId);
    }

    function capture(NativeKernel kernel, address namespace, bytes[] calldata path) external {
        (lastDigest, lastLength, lastRevision, lastRecordId) = read(kernel, namespace, path);
    }
}
