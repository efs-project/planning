// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";

/// Disposable paid-call instrument. No cached answer, caller-supplied result hash,
/// or persistent read result. This is not a production SDK or proof of chain state.
contract FilesPaidRead {
    FilesJoinedConsumer public immutable reader;
    event FilesRead(bytes32 indexed queryKey, bytes32 resultHash);

    constructor(FilesJoinedConsumer reader_) { reader = reader_; }

    function point(bytes32 file, address[] calldata authors, bytes32 concept, FilesJoinedConsumer.Basis calldata basis) external {
        FilesJoinedConsumer.FilePoint memory result = reader.readFilePoint(file, authors, concept, basis);
        bytes32 key = keccak256(abi.encode(address(reader), FilesJoinedConsumer.readFilePoint.selector,
            file, authors, concept, basis));
        emit FilesRead(key, keccak256(abi.encode(result)));
    }

    function folder(bytes32 folder_, address[] calldata authors, bytes32 concept, FilesJoinedConsumer.TagScope scope,
        uint256 budget, FilesJoinedConsumer.Basis calldata basis) external
    {
        FilesJoinedConsumer.FolderResult memory result = reader.readFolderTaggedOnce(folder_, authors, concept, scope, budget, basis);
        bytes32 key = keccak256(abi.encode(address(reader), FilesJoinedConsumer.readFolderTaggedOnce.selector,
            folder_, authors, concept, scope, budget, basis));
        emit FilesRead(key, keccak256(abi.encode(result)));
    }
}
