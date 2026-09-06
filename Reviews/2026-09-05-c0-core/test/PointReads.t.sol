// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {PointReadHarness, StorageByteHarness, SyntheticPointReadHarness} from "./PointReadHarness.sol";

interface VmPointReads {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
}

contract PointReadsTest {
    bytes32 private constant BYTE_SUBJECT = keccak256("byte-subject");
    bytes32 private constant AUTHOR = bytes32(type(uint256).max);
    VmPointReads private constant vm = VmPointReads(address(uint160(uint256(keccak256("hevm cheat code")))));

    function patterned(uint256 length) private pure returns (bytes memory out) {
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = bytes1(uint8((i * 71 + 19) & 0xff));
        }
    }

    function memorySlice(bytes memory source, uint256 start, uint256 length) private pure returns (bytes memory out) {
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = source[start + i];
        }
    }

    function expectReadError(address target, bytes memory callData, bytes32 subject) private view {
        (bool ok, bytes memory errorData) = target.staticcall(callData);
        require(!ok, "expected read error");
        require(
            keccak256(errorData) == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, subject)),
            "exact read error"
        );
    }

    function expectExactError(address target, bytes memory callData, bytes memory expected) private view {
        (bool ok, bytes memory errorData) = target.staticcall(callData);
        require(!ok && keccak256(errorData) == keccak256(expected), "exact expected error");
    }

    function memoryWord(bytes memory source, uint256 offset) private pure returns (uint256 result) {
        require(offset <= source.length && 32 <= source.length - offset, "memory word range");
        assembly ("memory-safe") {
            result := mload(add(add(source, 32), offset))
        }
    }

    function withWord(bytes memory source, uint256 offset, uint256 value) private pure returns (bytes memory out) {
        out = abi.decode(abi.encode(source), (bytes));
        require(offset <= out.length && 32 <= out.length - offset, "replace word range");
        assembly ("memory-safe") {
            mstore(add(add(out, 32), offset), value)
        }
    }

    function restoreType(SyntheticPointReadHarness h, bytes32 typeId, StateStore.TypeRow memory row, bytes memory cache)
        private
    {
        h.seedTypeForTest(typeId, row.groupRecordId, row.memberIndex, row.typeOrdinal, row.admittedAtOrdinal, cache);
    }

    function assertSlice(StorageByteHarness bytesHost, bytes memory source, uint256 start, uint256 length)
        private
        view
    {
        (bytes memory actual, uint256 finalWord) = bytesHost.sliceAndFinalWordForTest(start, length, BYTE_SUBJECT);
        require(keccak256(actual) == keccak256(memorySlice(source, start, length)), "exact selected slice");
        if (length % 32 != 0) {
            uint256 unusedBits = (32 - length % 32) * 8;
            require(finalWord & ((uint256(1) << unusedBits) - 1) == 0, "zero final padding");
        }
    }

    function intrinsicBlob() private pure returns (bytes memory blob) {
        blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
    }

    function deployHost() private returns (PointReadHarness h, bytes32 metaId, bytes memory intrinsic) {
        bytes memory blob = intrinsicBlob();
        intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        PreparationHelper helper = new PreparationHelper();
        h = new PointReadHarness(
            StateKernel.Init(keccak256("read-realm"), keccak256("read-revision"), intrinsic, hex"01", hex"01"),
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash
        );
    }

    function deploySynthetic() private returns (SyntheticPointReadHarness h, bytes32 metaId, bytes memory intrinsic) {
        bytes memory blob = intrinsicBlob();
        intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        PreparationHelper helper = new PreparationHelper();
        h = new SyntheticPointReadHarness(
            StateKernel.Init(keccak256("read-realm"), keccak256("read-revision"), intrinsic, hex"01", hex"01"),
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash
        );
    }

    function candidateJson() private view returns (string memory) {
        return vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
    }

    function candidateGroup(uint256 groupIndex) private view returns (bytes memory) {
        string memory j = candidateJson();
        string memory path = groupIndex == 0 ? ".groups[0].groupHex" : ".groups[1].groupHex";
        return vm.parseBytes(string.concat("0x", vm.parseJsonString(j, path)));
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

    function publishGroup(PointReadHarness h, bytes32 metaId, bytes memory raw)
        private
        returns (StateKernel.Publication memory p)
    {
        bytes memory body = abi.encodePacked(uint16(raw.length), raw);
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(uint256(7)), 0);
        p.recordIds = new bytes32[](1);
        p.recordIds[0] = keccak256(abi.encode(keccak256("efs2/record/1"), metaId, keccak256(body)));
        p.leafMask = 1;
        p.leaves = new StateKernel.SelectedLeaf[](1);
        p.leaves[0] = StateKernel.SelectedLeaf(0, metaId, body);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](0);
        identify(p);
        h.publishTrustedForTest(StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p);
    }

    function ordinaryFixture()
        private
        returns (
            SyntheticPointReadHarness h,
            bytes32 metaId,
            StateKernel.Publication memory p,
            bytes32 typeId,
            StateStore.TypeRow memory typeRow,
            StateStore.RecordRow memory groupRecord
        )
    {
        (h, metaId,) = deploySynthetic();
        p = publishGroup(h, metaId, candidateGroup(0));
        typeId = vm.parseJsonBytes32(candidateJson(), ".groups[0].members[4].temporaryTypeSchemaId");
        typeRow = h.typeRow(typeId);
        groupRecord = h.record(p.recordIds[0]);
    }

    function testReadsOriginalIntrinsicType() public {
        bytes memory expectedIntrinsicBlob = intrinsicBlob();
        bytes memory intrinsic =
            abi.encodePacked(uint16(1), uint16(expectedIntrinsicBlob.length), expectedIntrinsicBlob);
        bytes32 metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        PreparationHelper helper = new PreparationHelper();
        PointReadHarness h = new PointReadHarness(
            StateKernel.Init(keccak256("read-realm"), keccak256("read-revision"), intrinsic, hex"01", hex"01"),
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash
        );

        (bytes memory blob, uint48 ord, uint64 admitted, uint8 roles, uint8 indexes) = h.getTypeSchema(metaId);
        require(keccak256(blob) == keccak256(expectedIntrinsicBlob), "intrinsic original blob");
        require(ord == 1 && admitted == 0 && roles == 0 && indexes == 0, "intrinsic metadata");
        (bytes32 groupRecordId, uint16 member, bool intrinsicFlag) = h.getTypeOrigin(metaId);
        require(groupRecordId == 0 && member == 0 && intrinsicFlag, "intrinsic origin");
    }

    function testReadsUnknownSentinelsAndWholeIntrinsicGroup() public {
        (PointReadHarness h,, bytes memory intrinsic) = deployHost();
        bytes32 unknown = keccak256("unknown-Type");
        (bytes memory blob, uint48 ord, uint64 admitted, uint8 roles, uint8 indexes) = h.getTypeSchema(unknown);
        require(blob.length == 0 && ord == 0 && admitted == 0 && roles == 0 && indexes == 0, "unknown schema");
        (bytes32 groupRecordId, uint16 member, bool intrinsicFlag) = h.getTypeOrigin(unknown);
        require(groupRecordId == 0 && member == 0 && !intrinsicFlag, "unknown origin");
        require(keccak256(h.intrinsicTypeGroupBytes()) == keccak256(intrinsic), "whole intrinsic group");
    }

    function testReadsOrdinaryTypeFromRetainedGroup() public {
        (PointReadHarness h, bytes32 metaId,) = deployHost();
        bytes memory raw = candidateGroup(0);
        StateKernel.Publication memory p = publishGroup(h, metaId, raw);
        string memory j = candidateJson();
        bytes32 typeId = vm.parseJsonBytes32(j, ".groups[0].members[4].temporaryTypeSchemaId");
        bytes memory expected =
            vm.parseBytes(string.concat("0x", vm.parseJsonString(j, ".groups[0].members[4].blobHex")));

        (bytes memory blob, uint48 ord, uint64 admitted, uint8 roles, uint8 indexes) = h.getTypeSchema(typeId);
        require(keccak256(blob) == keccak256(expected), "ordinary original blob");
        require(ord == 6 && admitted == 1 && roles == 1 && indexes == 1, "ordinary metadata");
        (bytes32 groupRecordId, uint16 member, bool intrinsicFlag) = h.getTypeOrigin(typeId);
        require(groupRecordId == p.recordIds[0] && member == 4 && !intrinsicFlag, "ordinary origin");
    }

    function testReadsExactRecordAndEnvelopePointValues() public {
        (PointReadHarness h, bytes32 metaId,) = deployHost();
        bytes memory raw = candidateGroup(0);
        StateKernel.Publication memory p = publishGroup(h, metaId, raw);
        bytes memory expectedBody = abi.encodePacked(uint16(raw.length), raw);

        (bytes32 typeId, bytes memory body, uint64 firstAdmission) = h.getRecord(p.recordIds[0]);
        require(typeId == metaId && keccak256(body) == keccak256(expectedBody) && firstAdmission == 1, "exact Record");
        (bytes memory unsignedEnvelope, uint48 ordinal, uint16 leaves, bytes32 principal, uint64 epoch) =
            h.getEnvelope(p.envelopeId);
        require(keccak256(unsignedEnvelope) == keccak256(abi.encode(p.header, p.recordIds)), "exact Envelope bytes");
        require(ordinal == 1 && leaves == 1 && principal == AUTHOR && epoch == 0, "Envelope projection");
    }

    function testReadsUnknownRecordAndEnvelopeSentinels() public {
        (PointReadHarness h,,) = deployHost();
        bytes32 unknownRecord = keccak256("unknown-Record");
        (bytes32 typeId, bytes memory body, uint64 firstAdmission) = h.getRecord(unknownRecord);
        require(typeId == 0 && body.length == 0 && firstAdmission == 0, "unknown Record");
        bytes32 unknownEnvelope = keccak256("unknown-Envelope");
        (bytes memory unsignedEnvelope, uint48 ordinal, uint16 leaves, bytes32 principal, uint64 epoch) =
            h.getEnvelope(unknownEnvelope);
        require(
            unsignedEnvelope.length == 0 && ordinal == 0 && leaves == 0 && principal == 0 && epoch == 0,
            "unknown Envelope"
        );
    }

    function testRefusesCorruptInitializationSeparatelyFromUnknowns() public {
        (SyntheticPointReadHarness h, bytes32 metaId,) = deploySynthetic();
        StateStore.TypeRow memory metaRow = h.typeRow(metaId);
        bytes32 malformedUnknown = keccak256("malformed-unknown");
        h.seedTypeForTest(malformedUnknown, keccak256("origin"), 1, 0, 1, hex"01");
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (malformedUnknown)), malformedUnknown);
        expectReadError(address(h), abi.encodeCall(h.getTypeOrigin, (malformedUnknown)), malformedUnknown);

        h.seedTypeForTest(metaId, 0, 0, 0, 0, new bytes(0));
        expectExactError(
            address(h),
            abi.encodeCall(h.getTypeSchema, (keccak256("unknown"))),
            abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)
        );
        h.seedTypeForTest(metaId, 0, 0, 1, 0, metaRow.cacheBytes);
        h.clearInitializationForTest();
        expectExactError(
            address(h),
            abi.encodeCall(h.getTypeSchema, (keccak256("unknown"))),
            abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)
        );
        expectExactError(
            address(h),
            abi.encodeCall(h.getRecord, (keccak256("unknown"))),
            abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)
        );
        expectExactError(
            address(h),
            abi.encodeCall(h.getEnvelope, (keccak256("unknown"))),
            abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)
        );
    }

    function testRefusesMalformedIntrinsicGroupFraming() public {
        (SyntheticPointReadHarness h, bytes32 metaId, bytes memory intrinsic) = deploySynthetic();
        bytes memory wrongCount = abi.decode(abi.encode(intrinsic), (bytes));
        wrongCount[1] = bytes1(uint8(2));
        h.setIntrinsicGroupForTest(wrongCount);
        expectReadError(address(h), abi.encodeCall(h.intrinsicTypeGroupBytes, ()), metaId);
        bytes memory trailing = bytes.concat(intrinsic, hex"01");
        h.setIntrinsicGroupForTest(trailing);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (metaId)), metaId);
    }

    function testMalformedMetaTypeStateRejectsOtherPointReads() public {
        (SyntheticPointReadHarness h, bytes32 metaId,) = deploySynthetic();
        StateKernel.Publication memory p = publishGroup(h, metaId, candidateGroup(0));
        StateStore.TypeRow memory metaRow = h.typeRow(metaId);
        h.seedTypeForTest(metaId, keccak256("not-intrinsic"), 0, 1, 0, metaRow.cacheBytes);
        bytes32 ordinaryType = vm.parseJsonBytes32(candidateJson(), ".groups[0].members[0].temporaryTypeSchemaId");
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (ordinaryType)), ordinaryType);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (p.recordIds[0])), p.recordIds[0]);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (p.envelopeId)), p.envelopeId);
    }

    function testRefusesMissingAndNonMetaOrdinaryGroupRecord() public {
        (
            SyntheticPointReadHarness h,
            bytes32 metaId,
            StateKernel.Publication memory p,
            bytes32 typeId,
            StateStore.TypeRow memory typeRow,
            StateStore.RecordRow memory groupRecord
        ) = ordinaryFixture();
        h.seedRecordForTest(p.recordIds[0], 0, new bytes(0), 0, 0);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        h.seedRecordForTest(
            p.recordIds[0],
            keccak256("not-meta"),
            groupRecord.body,
            groupRecord.recordOrdinal,
            groupRecord.firstAdmissionOrdinal
        );
        expectReadError(address(h), abi.encodeCall(h.getTypeOrigin, (typeId)), typeId);
        h.seedRecordForTest(
            p.recordIds[0], metaId, groupRecord.body, groupRecord.recordOrdinal, groupRecord.firstAdmissionOrdinal + 1
        );
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, typeRow.cacheBytes);
    }

    function testRefusesCorruptGroupFramingIndexAndOrigin() public {
        (
            SyntheticPointReadHarness h,
            bytes32 metaId,
            StateKernel.Publication memory p,
            bytes32 typeId,
            StateStore.TypeRow memory typeRow,
            StateStore.RecordRow memory groupRecord
        ) = ordinaryFixture();
        bytes memory body = abi.decode(abi.encode(groupRecord.body), (bytes));
        body[0] = 0;
        body[1] = 0;
        h.seedRecordForTest(p.recordIds[0], metaId, body, groupRecord.recordOrdinal, groupRecord.firstAdmissionOrdinal);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);

        body = abi.decode(abi.encode(groupRecord.body), (bytes));
        body[2] = 0;
        body[3] = 0;
        h.seedRecordForTest(p.recordIds[0], metaId, body, groupRecord.recordOrdinal, groupRecord.firstAdmissionOrdinal);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);

        h.seedRecordForTest(
            p.recordIds[0], metaId, groupRecord.body, groupRecord.recordOrdinal, groupRecord.firstAdmissionOrdinal
        );
        h.seedTypeForTest(
            typeId, typeRow.groupRecordId, 6, typeRow.typeOrdinal, typeRow.admittedAtOrdinal, typeRow.cacheBytes
        );
        expectReadError(address(h), abi.encodeCall(h.getTypeOrigin, (typeId)), typeId);

        bytes memory trailing = bytes.concat(groupRecord.body, hex"7f");
        uint256 rawLength = trailing.length - 2;
        // This fixture remains below the u16 group-body bound.
        // forge-lint: disable-next-line(unsafe-typecast)
        trailing[0] = bytes1(uint8(rawLength >> 8));
        // forge-lint: disable-next-line(unsafe-typecast)
        trailing[1] = bytes1(uint8(rawLength));
        h.seedRecordForTest(
            p.recordIds[0], metaId, trailing, groupRecord.recordOrdinal, groupRecord.firstAdmissionOrdinal
        );
        restoreType(h, typeId, typeRow, typeRow.cacheBytes);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);

        h.seedTypeForTest(typeId, 0, 0, typeRow.typeOrdinal, typeRow.admittedAtOrdinal, typeRow.cacheBytes);
        expectReadError(address(h), abi.encodeCall(h.getTypeOrigin, (typeId)), typeId);
    }

    function testRefusesIntrinsicOrdinaryOriginConfusionAndOrdinalCorruption() public {
        (SyntheticPointReadHarness h, bytes32 metaId,) = deploySynthetic();
        StateStore.TypeRow memory metaRow = h.typeRow(metaId);
        h.seedTypeForTest(metaId, keccak256("group"), 0, 1, 0, metaRow.cacheBytes);
        expectReadError(address(h), abi.encodeCall(h.getTypeOrigin, (metaId)), metaId);
        h.seedTypeForTest(metaId, 0, 0, 2, 0, metaRow.cacheBytes);
        h.seedCountsForTest(0, 0, 1, 0);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (metaId)), metaId);
    }

    function testOrdinalBoundaryAcceptsLastAdmittedAndRejectsExhaustionSentinel() public {
        (
            SyntheticPointReadHarness h,,
            StateKernel.Publication memory p,
            bytes32 typeId,
            StateStore.TypeRow memory typeRow,
            StateStore.RecordRow memory groupRecord
        ) = ordinaryFixture();
        uint64 exhaustion = (uint64(1) << 48) - 1;
        uint64 lastAdmitted = exhaustion - 1;
        h.seedCountsForTest(lastAdmitted, lastAdmitted, lastAdmitted, 1);
        h.seedTypeForTest(
            typeId,
            typeRow.groupRecordId,
            typeRow.memberIndex,
            lastAdmitted,
            typeRow.admittedAtOrdinal,
            typeRow.cacheBytes
        );
        h.seedRecordForTest(
            p.recordIds[0], groupRecord.typeId, groupRecord.body, lastAdmitted, groupRecord.firstAdmissionOrdinal
        );
        (, uint48 typeOrdinal,,,) = h.getTypeSchema(typeId);
        require(typeOrdinal == lastAdmitted, "last admitted Type ordinal");
        (,, uint64 firstAdmission) = h.getRecord(p.recordIds[0]);
        require(firstAdmission == 1, "last admitted Record ordinal");

        StateStore.EnvelopeRow memory envelopeRow = h.envelope(p.envelopeId);
        h.seedEnvelopeForTest(p.envelopeId, envelopeRow.canonicalUnsignedEnvelope, lastAdmitted);
        (, uint48 envelopeOrdinal,,,) = h.getEnvelope(p.envelopeId);
        require(envelopeOrdinal == lastAdmitted, "last admitted Envelope ordinal");

        h.seedTypeForTest(
            typeId,
            typeRow.groupRecordId,
            typeRow.memberIndex,
            exhaustion,
            typeRow.admittedAtOrdinal,
            typeRow.cacheBytes
        );
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        h.seedRecordForTest(
            p.recordIds[0], groupRecord.typeId, groupRecord.body, exhaustion, groupRecord.firstAdmissionOrdinal
        );
        expectReadError(address(h), abi.encodeCall(h.getRecord, (p.recordIds[0])), p.recordIds[0]);
        h.seedEnvelopeForTest(p.envelopeId, envelopeRow.canonicalUnsignedEnvelope, exhaustion);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (p.envelopeId)), p.envelopeId);
    }

    function testAdmissionAndRetainedCountersRejectExhaustionSentinel() public {
        (
            SyntheticPointReadHarness h,,
            StateKernel.Publication memory p,
            bytes32 typeId,
            StateStore.TypeRow memory typeRow,
            StateStore.RecordRow memory groupRecord
        ) = ordinaryFixture();
        uint64 exhaustion = (uint64(1) << 48) - 1;
        uint64 lastAdmitted = exhaustion - 1;

        h.seedCountsForTest(groupRecord.recordOrdinal, 1, 7, lastAdmitted);
        h.seedTypeForTest(
            typeId, typeRow.groupRecordId, typeRow.memberIndex, typeRow.typeOrdinal, lastAdmitted, typeRow.cacheBytes
        );
        h.seedRecordForTest(
            p.recordIds[0], groupRecord.typeId, groupRecord.body, groupRecord.recordOrdinal, lastAdmitted
        );
        (, uint48 typeOrdinal, uint64 admitted,,) = h.getTypeSchema(typeId);
        require(typeOrdinal == typeRow.typeOrdinal && admitted == lastAdmitted, "last admission supported");
        (,, uint64 firstAdmission) = h.getRecord(p.recordIds[0]);
        require(firstAdmission == lastAdmitted, "last first-admission supported");

        h.seedCountsForTest(groupRecord.recordOrdinal, 1, 7, exhaustion);
        h.seedTypeForTest(
            typeId, typeRow.groupRecordId, typeRow.memberIndex, typeRow.typeOrdinal, exhaustion, typeRow.cacheBytes
        );
        h.seedRecordForTest(p.recordIds[0], groupRecord.typeId, groupRecord.body, groupRecord.recordOrdinal, exhaustion);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (p.recordIds[0])), p.recordIds[0]);

        h.seedTypeForTest(
            typeId,
            typeRow.groupRecordId,
            typeRow.memberIndex,
            typeRow.typeOrdinal,
            typeRow.admittedAtOrdinal,
            typeRow.cacheBytes
        );
        h.seedRecordForTest(
            p.recordIds[0],
            groupRecord.typeId,
            groupRecord.body,
            groupRecord.recordOrdinal,
            groupRecord.firstAdmissionOrdinal
        );
        h.seedCountsForTest(groupRecord.recordOrdinal, 1, exhaustion, 1);
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        h.seedCountsForTest(exhaustion, 1, 7, 1);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (p.recordIds[0])), p.recordIds[0]);
    }

    function testRefusesAbsentShortOversizedAndIdentityCorruptCaches() public {
        (SyntheticPointReadHarness h,,, bytes32 typeId, StateStore.TypeRow memory typeRow,) = ordinaryFixture();
        restoreType(h, typeId, typeRow, new bytes(0));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, new bytes(319));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, new bytes(131073));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);

        bytes memory cache = typeRow.cacheBytes;
        restoreType(h, typeId, typeRow, withWord(cache, 0, 0));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 32, uint256(keccak256("wrong-Type"))));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 64, uint256(keccak256("wrong-blob"))));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 96, 8193));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 128, 256));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
    }

    function testRefusesCacheOffsetAndTailCountCorruption() public {
        (SyntheticPointReadHarness h,,, bytes32 typeId, StateStore.TypeRow memory typeRow,) = ordinaryFixture();
        bytes memory cache = typeRow.cacheBytes;
        uint256 rolesPos = 32 + memoryWord(cache, 160);
        uint256 indexesPos = 32 + memoryWord(cache, 192);
        uint256 constraintsPos = 32 + memoryWord(cache, 224);

        restoreType(h, typeId, typeRow, withWord(cache, 160, memoryWord(cache, 160) + 1));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 160, cache.length));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 160, memoryWord(cache, 160) + 32));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 160, rolesPos));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);

        restoreType(h, typeId, typeRow, withWord(cache, 256, 0));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, 256, 65));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, rolesPos, 17));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, indexesPos, 9));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, withWord(cache, constraintsPos, 33));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
        restoreType(h, typeId, typeRow, bytes.concat(cache, new bytes(32)));
        expectReadError(address(h), abi.encodeCall(h.getTypeSchema, (typeId)), typeId);
    }

    function testRefusesRecordCorruptionAndPreservesKnownEmptyBody() public {
        (SyntheticPointReadHarness h, bytes32 metaId,) = deploySynthetic();
        bytes32 recordId = keccak256("record-corruption");
        h.seedCountsForTest(1, 0, 1, 1);
        h.seedRecordForTest(recordId, metaId, new bytes(0), 1, 1);
        (bytes32 typeId, bytes memory body, uint64 admitted) = h.getRecord(recordId);
        require(typeId == metaId && body.length == 0 && admitted == 1, "known empty Record body");
        h.seedRecordForTest(recordId, metaId, new bytes(8193), 1, 1);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (recordId)), recordId);
        h.seedRecordForTest(recordId, metaId, new bytes(0), (uint64(1) << 48) - 1, 1);
        h.seedCountsForTest((uint64(1) << 48) - 1, 0, 1, 1);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (recordId)), recordId);
        h.seedRecordForTest(recordId, metaId, new bytes(0), 2, 1);
        h.seedCountsForTest(1, 0, 1, 1);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (recordId)), recordId);
        bytes32 unknown = keccak256("inconsistent-unknown-record");
        h.seedRecordForTest(unknown, metaId, new bytes(0), 0, 0);
        expectReadError(address(h), abi.encodeCall(h.getRecord, (unknown)), unknown);
    }

    function testRefusesEnvelopeShapeHeaderAndOrdinalCorruption() public {
        (SyntheticPointReadHarness h,,) = deploySynthetic();
        bytes32 envelopeId = keccak256("envelope-corruption");
        bytes32[] memory vector = new bytes32[](1);
        vector[0] = keccak256("record");
        bytes memory valid = abi.encode(StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(uint256(1)), 0), vector);
        h.seedCountsForTest(0, 1, 1, 0);

        h.seedEnvelopeForTest(envelopeId, new bytes(287), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, bytes.concat(valid, hex"01"), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 192, 256), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 224, 0), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 224, 65), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 0, 2), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 64, 1), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 96, 1), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, withWord(valid, 160, uint256(type(uint64).max) + 1), 1);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        h.seedEnvelopeForTest(envelopeId, valid, (uint64(1) << 48) - 1);
        h.seedCountsForTest(0, (uint64(1) << 48) - 1, 1, 0);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (envelopeId)), envelopeId);
        bytes32 unknown = keccak256("inconsistent-unknown-envelope");
        h.seedEnvelopeForTest(unknown, hex"01", 0);
        expectReadError(address(h), abi.encodeCall(h.getEnvelope, (unknown)), unknown);
    }

    function testStorageSlicesCoverLengthsAlignmentsAndBounds() public {
        StorageByteHarness bytesHost = new StorageByteHarness();
        uint256[10] memory lengths = [uint256(0), 1, 30, 31, 32, 33, 63, 64, 65, 8192];
        for (uint256 l; l < lengths.length; ++l) {
            bytes memory source = patterned(lengths[l]);
            bytesHost.setForTest(source);
            assertSlice(bytesHost, source, 0, source.length);
            assertSlice(bytesHost, source, source.length, 0);
            uint256 alignments = source.length < 32 ? source.length + 1 : 32;
            for (uint256 start; start < alignments; ++start) {
                uint256 wanted = source.length - start;
                if (wanted > 67) wanted = 67;
                assertSlice(bytesHost, source, start, wanted);
            }
        }

        bytesHost.setForTest(patterned(8193));
        assertSlice(bytesHost, patterned(8193), 1, 8192);
        expectReadError(
            address(bytesHost), abi.encodeCall(bytesHost.sliceForTest, (0, 8193, BYTE_SUBJECT)), BYTE_SUBJECT
        );
        expectReadError(
            address(bytesHost), abi.encodeCall(bytesHost.sliceForTest, (8194, 0, BYTE_SUBJECT)), BYTE_SUBJECT
        );
        expectReadError(
            address(bytesHost), abi.encodeCall(bytesHost.sliceForTest, (8192, 2, BYTE_SUBJECT)), BYTE_SUBJECT
        );
        expectReadError(
            address(bytesHost),
            abi.encodeCall(bytesHost.sliceForTest, (type(uint256).max, 1, BYTE_SUBJECT)),
            BYTE_SUBJECT
        );
        expectReadError(
            address(bytesHost),
            abi.encodeCall(bytesHost.sliceForTest, (1, type(uint256).max, BYTE_SUBJECT)),
            BYTE_SUBJECT
        );
    }

    function testFuzzStorageSliceMatchesIndependentMemory(bytes memory source, uint16 startSeed, uint16 lengthSeed)
        public
    {
        uint256 n = source.length > 8192 ? 8192 : source.length;
        bytes memory bounded = memorySlice(source, 0, n);
        uint256 start = n == 0 ? 0 : uint256(startSeed) % (n + 1);
        uint256 length = uint256(lengthSeed) % (n - start + 1);
        StorageByteHarness bytesHost = new StorageByteHarness();
        bytesHost.setForTest(bounded);
        assertSlice(bytesHost, bounded, start, length);
    }

    function testStorageWordsRequireAlignedCompleteLongWords() public {
        StorageByteHarness bytesHost = new StorageByteHarness();
        bytes memory source = patterned(65);
        bytesHost.setForTest(source);
        require(bytesHost.wordForTest(0, BYTE_SUBJECT) == uint256(bytes32(memorySlice(source, 0, 32))), "first word");
        require(bytesHost.wordForTest(32, BYTE_SUBJECT) == uint256(bytes32(memorySlice(source, 32, 32))), "last word");
        expectReadError(address(bytesHost), abi.encodeCall(bytesHost.wordForTest, (1, BYTE_SUBJECT)), BYTE_SUBJECT);
        expectReadError(address(bytesHost), abi.encodeCall(bytesHost.wordForTest, (64, BYTE_SUBJECT)), BYTE_SUBJECT);
        bytesHost.setForTest(patterned(31));
        expectReadError(address(bytesHost), abi.encodeCall(bytesHost.wordForTest, (0, BYTE_SUBJECT)), BYTE_SUBJECT);
        bytesHost.setForTest(patterned(32));
        require(bytesHost.wordForTest(0, BYTE_SUBJECT) == uint256(bytes32(patterned(32))), "exact one word");
    }
}
