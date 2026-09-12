// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface GenericRecords {
    function storeRecord(bytes32, bytes calldata) external returns (bytes32);
}

/// @notice Test producer uses only author-neutral Record ingestion, no Files interface.
contract RecordProducer {
    bytes32 public lastRecord;

    function publish(GenericRecords target, bytes32 typeId, bytes calldata body) external returns (bytes32) {
        lastRecord = target.storeRecord(typeId, body);
        return lastRecord;
    }
}
