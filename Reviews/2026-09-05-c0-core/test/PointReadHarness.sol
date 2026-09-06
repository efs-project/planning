// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StatePointReads} from "../src/StatePointReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {StatefulHarness} from "./StatefulHarness.sol";

contract PointReadHarness is StatefulHarness {
    constructor(StateKernel.Init memory init, address helper, bytes32 helperHash, bytes32 libraryHash)
        StatefulHarness(init, helper, helperHash, libraryHash)
    {}

    function getTypeSchema(bytes32 typeId) external view returns (bytes memory, uint48, uint64, uint8, uint8) {
        return StatePointReads.getTypeSchema(s, typeId);
    }

    function getTypeOrigin(bytes32 typeId) external view returns (bytes32, uint16, bool) {
        return StatePointReads.getTypeOrigin(s, typeId);
    }

    function intrinsicTypeGroupBytes() external view returns (bytes memory) {
        return StatePointReads.intrinsicTypeGroupBytes(s);
    }

    function getRecord(bytes32 recordId) external view returns (bytes32, bytes memory, uint64) {
        return StatePointReads.getRecord(s, recordId);
    }

    function getEnvelope(bytes32 envelopeId) external view returns (bytes memory, uint48, uint16, bytes32, uint64) {
        return StatePointReads.getEnvelope(s, envelopeId);
    }
}

contract SyntheticPointReadHarness is PointReadHarness {
    constructor(StateKernel.Init memory init, address helper, bytes32 helperHash, bytes32 libraryHash)
        PointReadHarness(init, helper, helperHash, libraryHash)
    {}

    function clearInitializationForTest() external {
        s.init.realmId = 0;
    }

    function setIntrinsicGroupForTest(bytes memory raw) external {
        s.init.intrinsicGroupBytes = raw;
    }

    function seedCountsForTest(uint64 records, uint64 envelopes, uint64 types_, uint64 admissions) external {
        s.count.records = records;
        s.count.envelopes = envelopes;
        s.count.types = types_;
        s.count.admissions = admissions;
    }

    function seedTypeForTest(
        bytes32 id,
        bytes32 groupRecordId,
        uint16 memberIndex,
        uint64 typeOrdinal,
        uint64 admittedAtOrdinal,
        bytes memory cacheBytes
    ) external {
        s.types[id] = StateStore.TypeRow(groupRecordId, memberIndex, typeOrdinal, admittedAtOrdinal, cacheBytes);
    }

    function seedRecordForTest(
        bytes32 id,
        bytes32 typeId,
        bytes memory body,
        uint64 recordOrdinal,
        uint64 firstAdmissionOrdinal
    ) external {
        s.records[id] = StateStore.RecordRow(typeId, body, recordOrdinal, firstAdmissionOrdinal);
    }

    function seedEnvelopeForTest(bytes32 id, bytes memory raw, uint64 envelopeOrdinal) external {
        s.envelopes[id] = StateStore.EnvelopeRow(raw, envelopeOrdinal);
    }

    function corruptCacheWordForTest(bytes32 id, uint256 offset, uint256 next) external {
        bytes storage cache = s.types[id].cacheBytes;
        require(offset <= cache.length && 32 <= cache.length - offset, "test cache word range");
        for (uint256 i; i < 32; ++i) {
            // Test-only word decomposition deliberately selects the low byte.
            // forge-lint: disable-next-line(unsafe-typecast)
            cache[offset + i] = bytes1(uint8(next >> ((31 - i) * 8)));
        }
    }
}

contract StorageByteHarness {
    bytes internal value;

    function setForTest(bytes memory next) external {
        value = next;
    }

    function wordForTest(uint256 offset, bytes32 subject) external view returns (uint256) {
        return StorageByteView.word(value, offset, subject);
    }

    function sliceForTest(uint256 start, uint256 length, bytes32 subject) external view returns (bytes memory) {
        return StorageByteView.slice(value, start, length, subject);
    }

    function sliceAndFinalWordForTest(uint256 start, uint256 length, bytes32 subject)
        external
        view
        returns (bytes memory result, uint256 finalWord)
    {
        result = StorageByteView.slice(value, start, length, subject);
        if (length != 0) {
            assembly ("memory-safe") {
                finalWord := mload(add(add(result, 32), mul(div(sub(length, 1), 32), 32)))
            }
        }
    }
}
