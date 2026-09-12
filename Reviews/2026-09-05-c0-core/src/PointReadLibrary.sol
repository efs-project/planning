// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StatePointReads} from "./StatePointReads.sol";
import {StateStore} from "./StateStore.sol";

library PointReadLibrary {
    struct ReadBasis {
        bytes32 executionSetId;
        uint32 revision;
        uint64 blockNumber;
        uint64 admissionHigh;
    }

    struct RecordResult {
        bytes32 recordId;
        bytes32 typeSchemaId;
        bytes canonicalBody;
        uint64 firstAdmitOrdinal;
    }

    error ErrRecordBatchSize(uint256 count);

    function getRecords(StateStore.Store storage s, bytes32[] calldata ids)
        external
        view
        returns (RecordResult[] memory records)
    {
        // Defensive bound at the allocation boundary, including duplicate IDs.
        if (ids.length == 0 || ids.length > 8) revert ErrRecordBatchSize(ids.length);
        records = new RecordResult[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            (bytes32 typeId, bytes memory body, uint64 ordinal) = StatePointReads.getRecord(s, ids[i]);
            records[i] = RecordResult(ids[i], typeId, body, ordinal);
        }
    }

    function getTypeSchema(StateStore.Store storage s, bytes32 typeId)
        external
        view
        returns (bytes memory, uint48, uint64, uint8, uint8)
    {
        return StatePointReads.getTypeSchema(s, typeId);
    }

    function getTypeOrigin(StateStore.Store storage s, bytes32 typeId) external view returns (bytes32, uint16, bool) {
        return StatePointReads.getTypeOrigin(s, typeId);
    }

    function intrinsicTypeGroupBytes(StateStore.Store storage s) external view returns (bytes memory) {
        return StatePointReads.intrinsicTypeGroupBytes(s);
    }

    function getRecord(StateStore.Store storage s, bytes32 recordId)
        external
        view
        returns (bytes32, bytes memory, uint64)
    {
        return StatePointReads.getRecord(s, recordId);
    }

    function getEnvelope(StateStore.Store storage s, bytes32 envelopeId)
        external
        view
        returns (bytes memory, uint48, uint16, bytes32, uint64)
    {
        return StatePointReads.getEnvelope(s, envelopeId);
    }

    function getOccurrence(StateStore.Store storage s, bytes32 envelopeId, uint16 leafIndex)
        external
        view
        returns (uint8, uint64, bytes32, bytes32, bytes32, uint64)
    {
        return StatePointReads.getOccurrence(s, envelopeId, leafIndex);
    }

    function getOccurrenceByOrdinal(StateStore.Store storage s, uint64 ordinal)
        external
        view
        returns (bytes32, uint16, bytes32, bytes32, bytes32, uint8, uint64)
    {
        return StatePointReads.getOccurrenceByOrdinal(s, ordinal);
    }

    function getReceipt(StateStore.Store storage s, uint64 ordinal)
        external
        view
        returns (StatePointReads.IndexedReceiptView memory)
    {
        return StatePointReads.getReceipt(s, ordinal);
    }
}
