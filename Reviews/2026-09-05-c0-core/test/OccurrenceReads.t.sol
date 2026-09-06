// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StatePointReads} from "../src/StatePointReads.sol";
import {StateStore} from "../src/StateStore.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {OccurrenceReadHarness, SyntheticOccurrenceReadHarness} from "./OccurrenceReadHarness.sol";

interface VmOccurrenceReads {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
}

contract OccurrenceReadsTest {
    uint64 private constant GUARD = (uint64(1) << 48) - 1;
    bytes32 private constant AUTHOR = bytes32(type(uint256).max);
    bytes32 private constant REALM = keccak256("read-realm");
    bytes32 private constant REVISION = keccak256("read-revision");
    VmOccurrenceReads private constant vm = VmOccurrenceReads(address(uint160(uint256(keccak256("hevm cheat code")))));

    struct BaseFixture {
        SyntheticOccurrenceReadHarness h;
        bytes32 metaId;
        StateKernel.Publication publication;
        StateStore.Counts counts;
        StateStore.RecordRow record;
        StateStore.TypeRow metaRow;
        StateStore.PrincipalRow principal;
        StateStore.AdmissionRow admission;
        StateStore.BatchRow batch;
    }

    function intrinsicBlob() private pure returns (bytes memory blob) {
        blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
    }

    function initAndMeta() private view returns (StateKernel.Init memory init, bytes32 metaId) {
        bytes memory blob = intrinsicBlob();
        bytes memory intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        init = StateKernel.Init(REALM, REVISION, intrinsic, candidateGroup(0), candidateGroup(1));
    }

    function deployHost() private returns (OccurrenceReadHarness h, bytes32 metaId) {
        (StateKernel.Init memory init, bytes32 meta) = initAndMeta();
        metaId = meta;
        PreparationHelper helper = new PreparationHelper();
        h = new OccurrenceReadHarness(
            init, address(helper), address(helper).codehash, address(AdmissionLibrary).codehash
        );
    }

    function deploySynthetic() private returns (SyntheticOccurrenceReadHarness h, bytes32 metaId) {
        (StateKernel.Init memory init, bytes32 meta) = initAndMeta();
        metaId = meta;
        PreparationHelper helper = new PreparationHelper();
        h = new SyntheticOccurrenceReadHarness(
            init, address(helper), address(helper).codehash, address(AdmissionLibrary).codehash
        );
    }

    function candidateJson() private view returns (string memory) {
        return vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
    }

    function candidateGroup(uint256 index) private view returns (bytes memory) {
        return vm.parseBytes(
            string.concat(
                "0x", vm.parseJsonString(candidateJson(), string.concat(".groups[", vm.toString(index), "].groupHex"))
            )
        );
    }

    function candidateType(uint256 groupIndex, uint256 memberIndex) private view returns (bytes32) {
        return vm.parseJsonBytes32(
            candidateJson(),
            string.concat(
                ".groups[", vm.toString(groupIndex), "].members[", vm.toString(memberIndex), "].temporaryTypeSchemaId"
            )
        );
    }

    function identify(StateKernel.Publication memory p) private pure {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")
            )
        );
        bytes32 statement = keccak256(
            abi.encode(
                keccak256(
                    "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
                ),
                p.header,
                keccak256(abi.encodePacked(p.recordIds))
            )
        );
        p.envelopeId = keccak256(
            abi.encode(keccak256("efs2/envelope/1"), keccak256(abi.encodePacked(hex"1901", domain, statement)))
        );
    }

    function publication(bytes32[] memory typeIds, bytes[] memory bodies, uint256 nonce, uint64 selectedMask)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        require(typeIds.length == bodies.length && typeIds.length > 0 && typeIds.length <= 64, "fixture vectors");
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(nonce), 0);
        p.recordIds = new bytes32[](typeIds.length);
        uint256 selected;
        for (uint256 i; i < typeIds.length; ++i) {
            p.recordIds[i] = keccak256(abi.encode(keccak256("efs2/record/1"), typeIds[i], keccak256(bodies[i])));
            if (uint256(selectedMask) & (uint256(1) << i) != 0) ++selected;
        }
        require(selected > 0 && (typeIds.length == 64 || selectedMask >> typeIds.length == 0), "fixture selection");
        p.leafMask = selectedMask;
        p.leaves = new StateKernel.SelectedLeaf[](selected);
        uint256 at;
        for (uint256 i; i < typeIds.length; ++i) {
            if (uint256(selectedMask) & (uint256(1) << i) != 0) {
                // The fixture vector is bounded to 64 members above.
                // forge-lint: disable-next-line(unsafe-typecast)
                p.leaves[at++] = StateKernel.SelectedLeaf(uint16(i), typeIds[i], bodies[i]);
            }
        }
        p.expectedRevisions = new StateKernel.ExpectedRevision[](0);
        identify(p);
    }

    function singlePublication(bytes32 typeId, bytes memory body, uint256 nonce)
        private
        pure
        returns (StateKernel.Publication memory)
    {
        bytes32[] memory types_ = new bytes32[](1);
        bytes[] memory bodies = new bytes[](1);
        types_[0] = typeId;
        bodies[0] = body;
        return publication(types_, bodies, nonce, 1);
    }

    function groupBody(bytes memory raw) private pure returns (bytes memory) {
        return abi.encodePacked(uint16(raw.length), raw);
    }

    function publish(
        OccurrenceReadHarness h,
        StateKernel.Publication memory p,
        uint256 authorityBasis,
        bytes32 authorityCodehash
    ) private returns (StateKernel.AdmitResult memory) {
        return h.publishTrustedForTest(StateKernel.VerifiedContext(AUTHOR, 1, authorityBasis, authorityCodehash), p);
    }

    function baseFixture() private returns (BaseFixture memory f) {
        (f.h, f.metaId) = deploySynthetic();
        f.publication = singlePublication(f.metaId, groupBody(candidateGroup(0)), 7);
        StateKernel.AdmitResult memory result = publish(f.h, f.publication, 0x1234, bytes32(uint256(0xabcd)));
        require(result.leaves[0].admissionOrdinal == 1, "base admission");
        f.counts = f.h.counts();
        f.record = f.h.record(f.publication.recordIds[0]);
        f.metaRow = f.h.typeRow(f.metaId);
        f.principal = f.h.principal(AUTHOR);
        f.admission = f.h.admissionAt(1);
        f.batch = f.h.batchAt(1);
    }

    function expectStateError(address target, bytes memory callData, bytes32 subject) private view {
        (bool ok, bytes memory errorData) = target.staticcall(callData);
        require(!ok, "expected state error");
        require(
            keccak256(errorData) == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, subject)),
            "exact state error"
        );
    }

    function expectOrdinalError(address target, bytes memory callData, uint64 ordinal) private view {
        (bool ok, bytes memory errorData) = target.staticcall(callData);
        require(!ok, "expected ordinal error");
        require(
            keccak256(errorData) == keccak256(abi.encodeWithSelector(StatePointReads.ErrReadOrdinal.selector, ordinal)),
            "exact ordinal error"
        );
    }

    function expectInitializationError(address target, bytes memory callData) private view {
        (bool ok, bytes memory errorData) = target.staticcall(callData);
        require(!ok, "expected initialization error");
        require(
            keccak256(errorData) == keccak256(abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)),
            "exact initialization error"
        );
    }

    function selectedType(StateKernel.Publication memory p, uint16 leaf) private pure returns (bytes32) {
        for (uint256 i; i < p.leaves.length; ++i) {
            if (p.leaves[i].leafIndex == leaf) return p.leaves[i].typeId;
        }
        revert("selected fixture leaf");
    }

    function assertOccurrence(
        OccurrenceReadHarness h,
        StateKernel.Publication memory p,
        uint16 leaf,
        uint64 ordinal,
        uint8 status,
        uint64 revoked
    ) private view {
        (uint8 actualStatus, uint64 actualOrdinal, bytes32 recordId, bytes32 typeId, bytes32 principal, uint64 rev) =
            h.getOccurrence(p.envelopeId, leaf);
        require(actualStatus == status && actualOrdinal == ordinal && rev == revoked, "pair lifecycle");
        require(recordId == p.recordIds[leaf] && typeId == selectedType(p, leaf), "pair Record and Type");
        require(principal == p.header.principalId, "pair Principal");
        (
            bytes32 envelopeId,
            uint16 actualLeaf,
            bytes32 byRecord,
            bytes32 byType,
            bytes32 byPrincipal,
            uint8 byStatus,
            uint64 byRev
        ) = h.getOccurrenceByOrdinal(ordinal);
        require(envelopeId == p.envelopeId && actualLeaf == leaf, "ordinal source");
        require(byRecord == recordId && byType == typeId && byPrincipal == principal, "ordinal fixed fields");
        require(byStatus == status && byRev == revoked, "ordinal lifecycle");
    }

    function assertReceipt(
        StatePointReads.IndexedReceiptView memory receipt,
        StateKernel.Publication memory p,
        uint16 leaf,
        uint64 ordinal,
        uint256 basis,
        bytes32 codehash,
        uint8 status,
        uint64 revoked
    ) private pure {
        require(receipt.envelopeId == p.envelopeId && receipt.leafIndex == leaf, "receipt source");
        require(receipt.realmId == REALM && receipt.realmRevisionId == REVISION, "receipt Realm");
        require(receipt.authorityBasis == basis && receipt.authorityCodehash == codehash, "receipt authority words");
        require(receipt.authEpoch == p.header.authEpoch && receipt.admissionOrdinal == ordinal, "receipt admission");
        require(receipt.admittedAtBlock > 0 && receipt.acceptedStatus == 1, "receipt acceptance");
        require(receipt.occurrenceStatus == status && receipt.revokedAtOrdinal == revoked, "receipt current lifecycle");
    }

    function assertZeroOccurrence(OccurrenceReadHarness h, bytes32 envelopeId, uint16 leaf) private view {
        (uint8 status, uint64 ordinal, bytes32 recordId, bytes32 typeId, bytes32 principal, uint64 revoked) =
            h.getOccurrence(envelopeId, leaf);
        require(
            status == 0 && ordinal == 0 && recordId == 0 && typeId == 0 && principal == 0 && revoked == 0,
            "whole zero occurrence"
        );
    }

    function seedCounts(SyntheticOccurrenceReadHarness h, StateStore.Counts memory c) private {
        h.seedCountsForTest(c.records, c.envelopes, c.types, c.principals, c.admissions, c.batches);
    }

    function setOrdinal(BaseFixture memory f, uint64 ordinal, uint64 highWater, uint64 batchCount) private {
        f.h
            .seedCountsForTest(
                f.counts.records, f.counts.envelopes, f.counts.types, f.counts.principals, highWater, batchCount
            );
        f.h.seedAdmissionForTest(ordinal, f.publication.envelopeId, f.admission.packed);
        f.h.seedLifecycleForTest(f.publication.envelopeId, 0, 1 | (uint256(ordinal) << 8));
    }

    function batchMeta(uint64 first, uint16 count, uint48 blockNumber, uint32 revision) private pure returns (uint256) {
        return uint256(first) | (uint256(count) << 48) | (uint256(blockNumber) << 64) | (uint256(revision) << 112);
    }

    function testHydratesActuallyAdmittedGroupOccurrenceAndReceipt() public {
        (OccurrenceReadHarness h, bytes32 metaId) = deployHost();
        StateKernel.Publication memory p = singlePublication(metaId, groupBody(candidateGroup(0)), 7);
        StateKernel.AdmitResult memory result = publish(h, p, 0x1234, bytes32(uint256(0xabcd)));
        uint64 ordinal = result.leaves[0].admissionOrdinal;

        assertOccurrence(h, p, 0, ordinal, 1, 0);
        assertReceipt(h.getReceipt(ordinal), p, 0, ordinal, 0x1234, bytes32(uint256(0xabcd)), 1, 0);
    }

    function testRealFreshSparseRetryMixedReuseAndWithdrawalTransitions() public {
        (OccurrenceReadHarness h, bytes32 metaId) = deployHost();
        bytes32[] memory typeIds = new bytes32[](3);
        bytes[] memory bodies = new bytes[](3);
        for (uint256 i; i < 3; ++i) {
            typeIds[i] = metaId;
            bodies[i] = groupBody(candidateGroup(i));
        }
        StateKernel.Publication memory initial = publication(typeIds, bodies, 100, 3);
        bytes32 firstHash = keccak256("first-context");
        StateKernel.AdmitResult memory first = publish(h, initial, 0x1111, firstHash);
        require(first.acceptingBatchId == 1 && first.leaves.length == 2, "two-fresh batch");
        require(first.leaves[0].admissionOrdinal == 1 && first.leaves[1].admissionOrdinal == 2, "batch endpoints");
        assertOccurrence(h, initial, 0, 1, 1, 0);
        assertOccurrence(h, initial, 1, 2, 1, 0);
        assertReceipt(h.getReceipt(1), initial, 0, 1, 0x1111, firstHash, 1, 0);
        assertReceipt(h.getReceipt(2), initial, 1, 2, 0x1111, firstHash, 1, 0);

        StateKernel.AdmitResult memory retry = publish(h, initial, 0x9999, keccak256("ignored-retry-context"));
        require(retry.acceptingBatchId == 0, "all-reused creates no batch");
        require(retry.leaves[0].outcome == 2 && retry.leaves[1].outcome == 2, "all-reused outcomes");
        require(h.counts().batches == 1, "all-reused batch count unchanged");

        StateKernel.Publication memory mixed = publication(typeIds, bodies, 100, 7);
        bytes32 mixedHash = keccak256("mixed-context");
        StateKernel.AdmitResult memory mixedResult = publish(h, mixed, 0x2222, mixedHash);
        require(mixedResult.acceptingBatchId == 2 && mixedResult.leaves.length == 3, "mixed batch");
        require(
            mixedResult.leaves[0].outcome == 2 && mixedResult.leaves[0].admissionOrdinal == 1
                && mixedResult.leaves[1].outcome == 2 && mixedResult.leaves[1].admissionOrdinal == 2
                && mixedResult.leaves[2].outcome == 1 && mixedResult.leaves[2].admissionOrdinal == 3,
            "mixed old and fresh ordinals"
        );
        assertReceipt(h.getReceipt(1), mixed, 0, 1, 0x1111, firstHash, 1, 0);
        assertReceipt(h.getReceipt(3), mixed, 2, 3, 0x2222, mixedHash, 1, 0);

        bytes32[] memory sparseTypes = new bytes32[](64);
        bytes[] memory sparseBodies = new bytes[](64);
        for (uint256 i; i < 64; ++i) {
            sparseTypes[i] = metaId;
            // The loop is explicitly bounded to the u16 fixture range.
            // forge-lint: disable-next-line(unsafe-typecast)
            sparseBodies[i] = abi.encodePacked(uint16(i + 1));
        }
        sparseBodies[63] = groupBody(candidateGroup(3));
        StateKernel.Publication memory sparse = publication(sparseTypes, sparseBodies, 200, uint64(1) << 63);
        StateKernel.AdmitResult memory sparseResult = publish(h, sparse, 0x3333, keccak256("sparse-context"));
        require(sparseResult.leaves[0].leafIndex == 63 && sparseResult.leaves[0].admissionOrdinal == 4, "sparse leaf63");
        assertOccurrence(h, sparse, 63, 4, 1, 0);
        assertZeroOccurrence(h, sparse.envelopeId, 0);

        StateKernel.Publication memory reusedRecord = singlePublication(metaId, sparseBodies[63], 201);
        require(reusedRecord.recordIds[0] == sparse.recordIds[63], "same Record new Envelope fixture");
        StateKernel.AdmitResult memory reusedResult = publish(h, reusedRecord, 0x4444, keccak256("reused-record"));
        require(reusedResult.leaves[0].admissionOrdinal == 5, "same Record fresh occurrence");
        assertOccurrence(h, reusedRecord, 0, 5, 1, 0);

        bytes32 withdrawalType = candidateType(1, 2);
        StateKernel.Publication memory withdrawal =
            singlePublication(withdrawalType, abi.encodePacked(initial.envelopeId, uint16(0)), 300);
        StateKernel.AdmitResult memory withdrawn = publish(h, withdrawal, 0x5555, keccak256("withdrawal-context"));
        require(withdrawn.leaves[0].admissionOrdinal == 6, "withdrawal admission");
        assertOccurrence(h, initial, 0, 1, 2, 6);
        assertReceipt(h.getReceipt(1), initial, 0, 1, 0x1111, firstHash, 2, 6);
    }

    function _emptyHost() private returns (OccurrenceReadHarness h, bytes32 metaId, StateKernel.Init memory init) {
        (init, metaId) = initAndMeta();
        PreparationHelper helper = new PreparationHelper();
        h = new OccurrenceReadHarness(
            init, address(helper), address(helper).codehash, address(AdmissionLibrary).codehash
        );
    }

    function testAbsenceInvalidOrdinalsAndMalformedCountersAreDistinct() public {
        (OccurrenceReadHarness empty,,) = _emptyHost();
        assertZeroOccurrence(empty, keccak256("unknown-empty"), 63);

        BaseFixture memory f = baseFixture();
        assertZeroOccurrence(f.h, keccak256("unknown"), 12);
        assertZeroOccurrence(f.h, f.publication.envelopeId, 1);
        expectOrdinalError(address(f.h), abi.encodeCall(f.h.getOccurrenceByOrdinal, (0)), 0);
        expectOrdinalError(address(f.h), abi.encodeCall(f.h.getReceipt, (GUARD)), GUARD);
        expectOrdinalError(address(f.h), abi.encodeCall(f.h.getOccurrenceByOrdinal, (2)), 2);

        f.h.clearRealmForTest();
        expectInitializationError(address(f.h), abi.encodeCall(f.h.getOccurrence, (f.publication.envelopeId, 0)));

        f = baseFixture();
        f.h.seedCountsForTest(f.counts.records, f.counts.envelopes, f.counts.types, f.counts.principals, GUARD, 1);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrenceByOrdinal, (0)), bytes32(0));
        for (uint256 i; i < 4; ++i) {
            f.h
                .seedCountsForTest(
                    i == 0 ? GUARD : f.counts.records,
                    i == 1 ? GUARD : f.counts.envelopes,
                    i == 2 ? GUARD : f.counts.types,
                    i == 3 ? GUARD : f.counts.principals,
                    f.counts.admissions,
                    f.counts.batches
                );
            expectStateError(
                address(f.h), abi.encodeCall(f.h.getOccurrence, (f.publication.envelopeId, 0)), f.publication.envelopeId
            );
        }
    }

    function testRefusesTargetedAdmissionLifecycleEnvelopeAndRecordCorruption() public {
        BaseFixture memory f = baseFixture();
        bytes32 subject = f.publication.envelopeId;
        uint256 active = 1 | (uint256(1) << 8);

        f.h.seedAdmissionForTest(1, bytes32(0), f.admission.packed);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedAdmissionForTest(1, subject, f.admission.packed | (uint256(1) << 112));
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedAdmissionForTest(1, subject, f.admission.packed);

        uint256[5] memory badLife = [
            uint256(1) << 8,
            active | (uint256(1) << 104),
            uint256(3) | (uint256(1) << 8),
            uint256(4) | (uint256(1) << 8),
            uint256(2) | (uint256(1) << 8) | (uint256(1) << 56)
        ];
        for (uint256 i; i < badLife.length; ++i) {
            f.h.seedLifecycleForTest(subject, 0, badLife[i]);
            expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        }

        f.h
            .seedCountsForTest(
                f.counts.records, f.counts.envelopes, f.counts.types, f.counts.principals, 2, f.counts.batches
            );
        f.h.seedLifecycleForTest(subject, 0, 1 | (uint256(2) << 8));
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrenceByOrdinal, (1)), bytes32(uint256(1)));
        seedCounts(f.h, f.counts);
        f.h.seedLifecycleForTest(subject, 0, active);

        f.h.seedAdmissionForTest(1, subject, (f.admission.packed & ~uint256(type(uint16).max)) | 1);
        f.h.seedLifecycleForTest(subject, 1, active);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrenceByOrdinal, (1)), bytes32(uint256(1)));
        f.h.seedLifecycleForTest(subject, 1, 0);
        f.h.seedAdmissionForTest(1, subject, f.admission.packed);

        f.h.seedEnvelopeForTest(subject, new bytes(0), 0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedEnvelopeForTest(subject, abi.encode(f.publication.header, f.publication.recordIds), 1);

        f.h.seedRecordForTest(f.publication.recordIds[0], 0, new bytes(0), 0, 0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedRecordForTest(f.publication.recordIds[0], f.record.typeId, f.record.body, f.record.recordOrdinal, 0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedRecordForTest(f.publication.recordIds[0], f.record.typeId, f.record.body, f.record.recordOrdinal, 2);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedRecordForTest(f.publication.recordIds[0], f.record.typeId, f.record.body, f.record.recordOrdinal, 1);
        f.h.seedRecordIdForTest(1, keccak256("wrong Record reverse"));
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
    }

    function configureOrdinaryType(BaseFixture memory f) private returns (bytes32 fakeType, uint64 fakeOrdinal) {
        fakeType = keccak256("synthetic ordinary Type");
        fakeOrdinal = f.counts.types + 1;
        f.h
            .seedCountsForTest(
                f.counts.records,
                f.counts.envelopes,
                fakeOrdinal,
                f.counts.principals,
                f.counts.admissions,
                f.counts.batches
            );
        f.h
            .seedAdmissionForTest(
                1,
                f.publication.envelopeId,
                (f.admission.packed & ~(uint256(GUARD) << 16)) | (uint256(fakeOrdinal) << 16)
            );
        f.h
            .seedRecordForTest(
                f.publication.recordIds[0],
                fakeType,
                f.record.body,
                f.record.recordOrdinal,
                f.record.firstAdmissionOrdinal
            );
        f.h.seedTypeIdForTest(fakeOrdinal, fakeType);
        f.h.seedTypeForTest(fakeType, keccak256("synthetic group"), 0, fakeOrdinal, 1, hex"01");
    }

    function testRefusesTargetedTypeAndPrincipalJoinCorruption() public {
        BaseFixture memory f = baseFixture();
        bytes32 subject = f.publication.envelopeId;
        (bytes32 fakeType, uint64 fakeOrdinal) = configureOrdinaryType(f);
        f.h.getOccurrence(subject, 0);

        f.h.seedTypeIdForTest(fakeOrdinal, keccak256("wrong Type reverse"));
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedTypeIdForTest(fakeOrdinal, fakeType);
        f.h.seedTypeForTest(fakeType, keccak256("synthetic group"), 0, fakeOrdinal + 1, 1, hex"01");
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedTypeForTest(fakeType, 0, 0, fakeOrdinal, 0, hex"01");
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedTypeForTest(fakeType, keccak256("synthetic group"), 0, fakeOrdinal, 2, hex"01");
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedTypeForTest(fakeType, keccak256("synthetic group"), 0, fakeOrdinal, 1, hex"01");

        f.h.seedPrincipalIdForTest(1, keccak256("wrong Principal reverse"));
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedPrincipalIdForTest(1, AUTHOR);
        f.h.seedPrincipalForTest(AUTHOR, 2, 1);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedPrincipalForTest(AUTHOR, 1, 0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
        f.h.seedPrincipalForTest(AUTHOR, 1, 2);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
    }

    function testRefusesFalseIntrinsicOrdinalDictionaryException() public {
        BaseFixture memory f = baseFixture();
        bytes32 subject = f.publication.envelopeId;
        bytes32 fakeType = keccak256("false intrinsic Type");
        f.h.seedTypeIdForTest(1, fakeType);
        f.h.seedTypeForTest(fakeType, keccak256("synthetic group"), 0, 1, 1, hex"01");
        f.h.seedRecordForTest(f.publication.recordIds[0], fakeType, f.record.body, 1, 1);
        expectStateError(address(f.h), abi.encodeCall(f.h.getOccurrence, (subject, 0)), subject);
    }

    function testRefusesTargetedBatchCorruption() public {
        BaseFixture memory f = baseFixture();
        bytes32 subject1 = bytes32(uint256(1));

        f.h.seedBatchForTest(1, f.batch.meta | (uint256(1) << 144), f.batch.authorityBasis, f.batch.authorityCodehash);
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
        f.h.seedBatchForTest(1, batchMeta(1, 1, 1, 2), 1, bytes32(uint256(1)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
        f.h.seedBatchForTest(1, 0, 0, 0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
        f.h.seedBatchForTest(1, batchMeta(1, 0, 1, 1), 1, bytes32(uint256(1)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
        f.h.seedBatchForTest(1, batchMeta(1, 65, 1, 1), 1, bytes32(uint256(1)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);

        setOrdinal(f, 3, 3, 2);
        f.h.seedBatchForTest(1, batchMeta(1, 1, 1, 1), 1, bytes32(uint256(1)));
        f.h.seedBatchForTest(2, batchMeta(3, 1, 2, 1), 2, bytes32(uint256(2)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (3)), bytes32(uint256(3)));

        setOrdinal(f, 2, 2, 2);
        f.h.seedBatchForTest(1, batchMeta(1, 2, 1, 1), 1, bytes32(uint256(1)));
        f.h.seedBatchForTest(2, batchMeta(2, 1, 2, 1), 2, bytes32(uint256(2)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (2)), bytes32(uint256(2)));

        setOrdinal(f, 2, 3, 2);
        f.h.seedBatchForTest(1, batchMeta(1, 1, 1, 1), 1, bytes32(uint256(1)));
        f.h.seedBatchForTest(2, batchMeta(3, 1, 2, 1), 2, bytes32(uint256(2)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (2)), bytes32(uint256(2)));

        setOrdinal(f, 2, 2, 1);
        f.h.seedBatchForTest(1, batchMeta(2, 1, 1, 1), 1, bytes32(uint256(1)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (2)), bytes32(uint256(2)));

        setOrdinal(f, 1, 3, 1);
        f.h.seedBatchForTest(1, batchMeta(1, 1, 1, 1), 1, bytes32(uint256(1)));
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);

        setOrdinal(f, 1, 1, 0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
        setOrdinal(f, 1, 1, 2);
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
        setOrdinal(f, 1, 1, GUARD);
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);

        setOrdinal(f, 1, 1, 1);
        f.h.seedInitialRevisionForTest(0);
        expectStateError(address(f.h), abi.encodeCall(f.h.getReceipt, (1)), subject1);
    }

    function testBoundedSearchAcceptsLastOfTwoToFortyOneElementBatches() public {
        BaseFixture memory f = baseFixture();
        uint64 high = uint64(1) << 40;
        setOrdinal(f, high, high, high);
        uint64 lo = 1;
        uint64 hi = high;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo + 1) / 2;
            f.h.seedBatchForTest(mid, batchMeta(mid, 1, 42, 1), mid, bytes32(uint256(mid)));
            lo = mid;
        }
        f.h.seedBatchForTest(1, batchMeta(1, 1, 42, 1), 1, bytes32(uint256(1)));
        f.h.seedBatchForTest(high - 1, batchMeta(high - 1, 1, 42, 1), high - 1, bytes32(uint256(high - 1)));
        StatePointReads.IndexedReceiptView memory receipt = f.h.getReceipt(high);
        require(receipt.admissionOrdinal == high && receipt.authorityBasis == high, "bounded last receipt");
        require(receipt.authorityCodehash == bytes32(uint256(high)) && receipt.admittedAtBlock == 42, "path row");
    }

    function largeHydrationFixture(uint256 bodyLength, uint256 cacheLength)
        private
        returns (SyntheticOccurrenceReadHarness h, bytes32 envelopeId)
    {
        BaseFixture memory f = baseFixture();
        h = f.h;
        envelopeId = f.publication.envelopeId;
        (bytes32 fakeType, uint64 fakeOrdinal) = configureOrdinaryType(f);
        h.seedRecordForTest(f.publication.recordIds[0], fakeType, new bytes(bodyLength), 1, 1);
        h.seedTypeForTest(fakeType, keccak256("synthetic group"), 0, fakeOrdinal, 1, new bytes(cacheLength));
    }

    function measuredOccurrence(OccurrenceReadHarness h, bytes32 envelopeId) private view returns (uint256 used) {
        uint256 before = gasleft();
        h.getOccurrence(envelopeId, 0);
        used = before - gasleft();
    }

    function testHydrationDoesNotCopyRecordBodyOrTypeCache() public {
        (SyntheticOccurrenceReadHarness small, bytes32 smallEnvelope) = largeHydrationFixture(1, 1);
        (SyntheticOccurrenceReadHarness large, bytes32 largeEnvelope) = largeHydrationFixture(8192, 131072);
        uint256 smallGas = measuredOccurrence(small, smallEnvelope);
        uint256 largeGas = measuredOccurrence(large, largeEnvelope);
        require(smallGas == largeGas, "fixed metadata hydration cost");
    }
}
