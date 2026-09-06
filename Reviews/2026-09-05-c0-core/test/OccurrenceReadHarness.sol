// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StatePointReads} from "../src/StatePointReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {PointReadHarness} from "./PointReadHarness.sol";

contract OccurrenceReadHarness is PointReadHarness {
    constructor(StateKernel.Init memory init, address helper, bytes32 helperHash, bytes32 libraryHash)
        PointReadHarness(init, helper, helperHash, libraryHash)
    {}

    function getOccurrence(bytes32 envelopeId, uint16 leafIndex)
        external
        view
        returns (uint8, uint64, bytes32, bytes32, bytes32, uint64)
    {
        return StatePointReads.getOccurrence(s, envelopeId, leafIndex);
    }

    function getOccurrenceByOrdinal(uint64 ordinal)
        external
        view
        returns (bytes32, uint16, bytes32, bytes32, bytes32, uint8, uint64)
    {
        return StatePointReads.getOccurrenceByOrdinal(s, ordinal);
    }

    function getReceipt(uint64 ordinal) external view returns (StatePointReads.IndexedReceiptView memory) {
        return StatePointReads.getReceipt(s, ordinal);
    }
}

/// @notice Explicit synthetic setup for read-refusal tests, never a Core write API.
contract SyntheticOccurrenceReadHarness is OccurrenceReadHarness {
    constructor(StateKernel.Init memory init, address helper, bytes32 helperHash, bytes32 libraryHash)
        OccurrenceReadHarness(init, helper, helperHash, libraryHash)
    {}

    function clearRealmForTest() external {
        s.init.realmId = 0;
    }

    function seedInitialRevisionForTest(bytes32 revisionId) external {
        s.init.initialRevisionId = revisionId;
    }

    function seedCountsForTest(
        uint64 records,
        uint64 envelopes,
        uint64 types_,
        uint64 principals,
        uint64 admissions,
        uint64 batches
    ) external {
        s.count.records = records;
        s.count.envelopes = envelopes;
        s.count.types = types_;
        s.count.principals = principals;
        s.count.admissions = admissions;
        s.count.batches = batches;
    }

    function seedAdmissionForTest(uint64 ordinal, bytes32 envelopeId, uint256 packed) external {
        s.admissions[ordinal] = StateStore.AdmissionRow(envelopeId, packed);
    }

    function seedLifecycleForTest(bytes32 envelopeId, uint16 leafIndex, uint256 packed) external {
        s.occurrences[StateKernel.occKey(envelopeId, leafIndex)] = StateStore.LifecycleRow(packed);
    }

    function seedEnvelopeForTest(bytes32 envelopeId, bytes memory raw, uint64 ordinal) external {
        s.envelopes[envelopeId] = StateStore.EnvelopeRow(raw, ordinal);
    }

    function seedRecordForTest(
        bytes32 recordId,
        bytes32 typeId,
        bytes memory body,
        uint64 ordinal,
        uint64 firstAdmission
    ) external {
        s.records[recordId] = StateStore.RecordRow(typeId, body, ordinal, firstAdmission);
    }

    function seedTypeForTest(
        bytes32 typeId,
        bytes32 groupRecordId,
        uint16 memberIndex,
        uint64 ordinal,
        uint64 firstAdmission,
        bytes memory cache
    ) external {
        s.types[typeId] = StateStore.TypeRow(groupRecordId, memberIndex, ordinal, firstAdmission, cache);
    }

    function seedPrincipalForTest(bytes32 principalId, uint64 ordinal, uint64 firstAdmission) external {
        s.principals[principalId] = StateStore.PrincipalRow(ordinal, firstAdmission);
    }

    function seedRecordIdForTest(uint64 ordinal, bytes32 recordId) external {
        s.recordIds[ordinal] = recordId;
    }

    function seedEnvelopeIdForTest(uint64 ordinal, bytes32 envelopeId) external {
        s.envelopeIds[ordinal] = envelopeId;
    }

    function seedTypeIdForTest(uint64 ordinal, bytes32 typeId) external {
        s.typeIds[ordinal] = typeId;
    }

    function seedPrincipalIdForTest(uint64 ordinal, bytes32 principalId) external {
        s.principalIds[ordinal] = principalId;
    }

    function seedBatchForTest(uint64 batchId, uint256 meta, uint256 authorityBasis, bytes32 authorityCodehash)
        external
    {
        s.batches[batchId] = StateStore.BatchRow(meta, authorityBasis, authorityCodehash);
    }
}
