// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {BindingFold} from "../src/BindingFold.sol";
import {PointReadLibrary} from "../src/PointReadLibrary.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {StateBindingReads} from "../src/StateBindingReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StatePointReads} from "../src/StatePointReads.sol";
import {StateReadPrimitives} from "../src/StateReadPrimitives.sol";
import {StateStore} from "../src/StateStore.sol";
import {StatefulHarness} from "./StatefulHarness.sol";

contract BindingReadHarness is StatefulHarness {
    address public immutable pointReadLibrary;
    bytes32 public immutable pointReadCodehash;
    address public immutable queryReadLibrary;
    bytes32 public immutable queryReadCodehash;

    error ReadCodeMismatch(uint8 role);

    constructor(
        StateKernel.Init memory init,
        address helper,
        bytes32 helperHash,
        bytes32 libraryHash,
        bytes32 pointReadHash,
        bytes32 queryReadHash
    ) StatefulHarness(init, helper, helperHash, libraryHash) {
        if (address(PointReadLibrary).code.length == 0 || address(PointReadLibrary).codehash != pointReadHash) {
            revert ReadCodeMismatch(1);
        }
        if (address(QueryReadLibrary).code.length == 0 || address(QueryReadLibrary).codehash != queryReadHash) {
            revert ReadCodeMismatch(2);
        }
        pointReadLibrary = address(PointReadLibrary);
        pointReadCodehash = pointReadHash;
        queryReadLibrary = address(QueryReadLibrary);
        queryReadCodehash = queryReadHash;
    }

    function getTypeSchema(bytes32 typeId) external view returns (bytes memory, uint48, uint64, uint8, uint8) {
        _requirePointRead();
        return PointReadLibrary.getTypeSchema(s, typeId);
    }

    function getTypeOrigin(bytes32 typeId) external view returns (bytes32, uint16, bool) {
        _requirePointRead();
        return PointReadLibrary.getTypeOrigin(s, typeId);
    }

    function intrinsicTypeGroupBytes() external view returns (bytes memory) {
        _requirePointRead();
        return PointReadLibrary.intrinsicTypeGroupBytes(s);
    }

    function getRecord(bytes32 recordId) external view returns (bytes32, bytes memory, uint64) {
        _requirePointRead();
        return PointReadLibrary.getRecord(s, recordId);
    }

    function getEnvelope(bytes32 envelopeId) external view returns (bytes memory, uint48, uint16, bytes32, uint64) {
        _requirePointRead();
        return PointReadLibrary.getEnvelope(s, envelopeId);
    }

    function getOccurrence(bytes32 envelopeId, uint16 leafIndex)
        external
        view
        returns (uint8, uint64, bytes32, bytes32, bytes32, uint64)
    {
        _requirePointRead();
        return PointReadLibrary.getOccurrence(s, envelopeId, leafIndex);
    }

    function getOccurrenceByOrdinal(uint64 ordinal)
        external
        view
        returns (bytes32, uint16, bytes32, bytes32, bytes32, uint8, uint64)
    {
        _requirePointRead();
        return PointReadLibrary.getOccurrenceByOrdinal(s, ordinal);
    }

    function getReceipt(uint64 ordinal) external view returns (StatePointReads.IndexedReceiptView memory) {
        _requirePointRead();
        return PointReadLibrary.getReceipt(s, ordinal);
    }

    function getBindingHead(bytes32 bindingKey) external view returns (BindingFold.Head memory, bytes32, uint64) {
        _requireQueryRead();
        return QueryReadLibrary.getBindingHead(s, bindingKey);
    }

    function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        _requireQueryRead();
        return QueryReadLibrary.getBindingAtBasis(s, bindingKey, basisOrdinal);
    }

    function readHistory(bytes32 bindingKey, uint32 fromRevision, uint16 limit)
        external
        view
        returns (StateBindingReads.BindingHistoryEntry[] memory, uint32, uint8)
    {
        _requireQueryRead();
        return QueryReadLibrary.readHistory(s, bindingKey, fromRevision, limit);
    }

    function _requirePointRead() private view {
        if (address(PointReadLibrary).code.length == 0 || address(PointReadLibrary).codehash != pointReadCodehash) {
            revert ReadCodeMismatch(1);
        }
    }

    function _requireQueryRead() private view {
        if (address(QueryReadLibrary).code.length == 0 || address(QueryReadLibrary).codehash != queryReadCodehash) {
            revert ReadCodeMismatch(2);
        }
    }
}

/// @notice Explicit synthetic setup for Binding read-refusal tests, never a Core write API.
contract SyntheticBindingReadHarness is BindingReadHarness {
    constructor(
        StateKernel.Init memory init,
        address helper,
        bytes32 helperHash,
        bytes32 libraryHash,
        bytes32 pointReadHash,
        bytes32 queryReadHash
    ) BindingReadHarness(init, helper, helperHash, libraryHash, pointReadHash, queryReadHash) {}

    function seedAdmissionCountForTest(uint64 count) external {
        s.count.admissions = count;
    }

    function seedPostingHeadForTest(bytes32 key, uint256 head) external {
        s.postings[key].head = head;
    }

    function seedPostingWordForTest(bytes32 key, uint64 index, uint256 word) external {
        s.postingWords[key][index] = word;
    }

    function postingAtForTest(bytes32 key, uint64 currentH, uint64 position, bytes32 subject)
        external
        view
        returns (uint64)
    {
        StateReadPrimitives.PostingHead memory head = StateReadPrimitives.postingHead(s, key, true, currentH, subject);
        return StateReadPrimitives.postingAt(s, key, head, position, subject);
    }

    function clearInitialRevisionForTest() external {
        s.init.initialRevisionId = 0;
    }

    function seedBindingForTest(bytes32 key, uint256 meta, bytes32 target) external {
        s.bindings[key] = StateStore.BindingRow(meta, target);
    }

    function clearRealmForTest() external {
        s.init.realmId = 0;
    }

    function replaceBodyForTest(bytes32 id, bytes calldata body) external {
        s.records[id].body = body;
    }

    /// Synthetic corruption: retain all hydration joins and a self-consistent Record ID.
    function replaceMutationForTest(bytes32 envelopeId, bytes32 typeId, bytes calldata body)
        external
        returns (bytes32 id)
    {
        (StateKernel.EnvelopeHeader memory header, bytes32[] memory ids) = abi.decode(
            s.envelopes[envelopeId].canonicalUnsignedEnvelope, (StateKernel.EnvelopeHeader, bytes32[])
        );
        StateStore.RecordRow memory old = s.records[ids[0]];
        id = keccak256(abi.encode(keccak256("efs2/record/1"), typeId, keccak256(body)));
        s.records[id] = StateStore.RecordRow(typeId, body, old.recordOrdinal, old.firstAdmissionOrdinal);
        s.recordIds[old.recordOrdinal] = id;
        ids[0] = id;
        s.envelopes[envelopeId].canonicalUnsignedEnvelope = abi.encode(header, ids);
        uint64 ordinal = uint64(
            (s.occurrences[keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(0)))].packed >> 8)
                & ((uint256(1) << 48) - 1)
        );
        uint256 packed = s.admissions[ordinal].packed;
        s.admissions[ordinal].packed =
            (packed & ~(((uint256(1) << 48) - 1) << 16)) | (uint256(s.types[typeId].typeOrdinal) << 16);
    }

    function seedLifecycleForTest(bytes32 envelopeId, uint256 packed) external {
        s.occurrences[keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(0)))].packed = packed;
    }

    function relocateAdmissionForTest(uint64 from, uint64 to) external {
        StateStore.AdmissionRow memory row = s.admissions[from];
        s.admissions[to] = row;
        bytes32 key = keccak256(abi.encode(keccak256("efs2/occurrence/1"), row.envelopeId, uint256(uint16(row.packed))));
        uint256 mask = ((uint256(1) << 48) - 1) << 8;
        s.occurrences[key].packed = (s.occurrences[key].packed & ~mask) | (uint256(to) << 8);
    }

    function replacePrincipalForTest(bytes32 envelopeId, bytes32 principal) external {
        (StateKernel.EnvelopeHeader memory header, bytes32[] memory ids) =
            abi.decode(s.envelopes[envelopeId].canonicalUnsignedEnvelope, (StateKernel.EnvelopeHeader, bytes32[]));
        header.principalId = principal;
        s.envelopes[envelopeId].canonicalUnsignedEnvelope = abi.encode(header, ids);
        uint256 life =
            s.occurrences[keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(0)))].packed;
        uint64 ordinal = uint64((life >> 8) & ((uint256(1) << 48) - 1));
        s.admissions[ordinal].packed = (s.admissions[ordinal].packed & ((uint256(1) << 64) - 1))
            | (uint256(s.principals[principal].principalOrdinal) << 64);
    }

    function recordBodySlotForTest(bytes32 id) external view returns (bytes32 slot) {
        bytes storage body = s.records[id].body;
        assembly ("memory-safe") { slot := body.slot }
    }

    function postingWordSlotForTest(bytes32 key, uint64 position) external view returns (bytes32) {
        mapping(uint64 => uint256) storage words = s.postingWords[key];
        uint256 slot;
        assembly ("memory-safe") { slot := words.slot }
        return keccak256(abi.encode(uint256(position / 5), slot));
    }
}
