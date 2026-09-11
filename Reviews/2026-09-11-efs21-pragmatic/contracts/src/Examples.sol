// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "./NativeKernel.sol";

contract QuoteProducer {
    NativeKernel public immutable kernel;
    bytes32 public immutable quoteType;
    bytes32 public immutable swapsDirectory;
    address public immutable operator;
    bytes32 public quoteFile;
    error OnlyOperator();
    error InitialRevisionMustBeZero();

    constructor(NativeKernel target, bytes32 exactType) {
        kernel = target;
        quoteType = exactType;
        operator = msg.sender;
        bytes32 root = target.ensureRoot();
        swapsDirectory = target.createDirectory(root, "swaps");
    }

    function publish(uint256 value, uint64 expectedRevision) external {
        if (msg.sender != operator) revert OnlyOperator();
        if (quoteFile == 0) {
            if (expectedRevision != 0) revert InitialRevisionMustBeZero();
            quoteFile = kernel.createFile(swapsDirectory, "eth-usdc", quoteType, abi.encode(value));
        } else {
            kernel.editFile(quoteFile, expectedRevision, quoteType, abi.encode(value));
        }
    }
}

/// @notice Unrelated consumer; reads only public canonical kernel state, never producer-local values.
contract QuoteReader {
    error MissingQuote();
    error UnexpectedType();

    function read(NativeKernel kernel, address publisher, bytes32 expectedType)
        external
        view
        returns (uint256 value, bytes32 fileId, uint64 revision)
    {
        bytes[] memory path = new bytes[](2);
        path[0] = "swaps";
        path[1] = "eth-usdc";
        fileId = kernel.resolve(publisher, path);
        if (fileId == 0) revert MissingQuote();
        NativeKernel.FileInfo memory file = kernel.fileInfo(fileId);
        if (!file.live || file.directory) revert MissingQuote();
        NativeKernel.Record memory record = kernel.readRecord(file.recordId);
        if (record.typeId != expectedType || record.body.length != 32) revert UnexpectedType();
        value = abi.decode(record.body, (uint256));
        revision = file.revision;
    }
}

/// @notice Cost floor only: no exact types, history, stable files, directory paths, existence or indexes.
contract PlainQuoteMapping {
    address public immutable operator = msg.sender;
    mapping(bytes32 => uint256) public values;
    error OnlyOperator();

    function set(bytes32 key, uint256 value) external {
        if (msg.sender != operator) revert OnlyOperator();
        values[key] = value;
    }
}
