// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {BindingFold} from "../src/BindingFold.sol";
import {PointReadLibrary} from "../src/PointReadLibrary.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {StateBindingReads} from "../src/StateBindingReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StatePointReads} from "../src/StatePointReads.sol";
import {StateReadPrimitives} from "../src/StateReadPrimitives.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {IndexKeys} from "../src/IndexKeys.sol";
import {BindingReadHarness, SyntheticBindingReadHarness} from "./BindingReadHarness.sol";

interface VmBindingReads {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
    function etch(address, bytes calldata) external;
    function snapshotState() external returns (uint256);
    function revertToState(uint256) external returns (bool);
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
}

contract StaticBindingConsumer {
    function head(BindingReadHarness host, bytes32 key, uint64 basis)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        return host.getBindingAtBasis(key, basis);
    }

    function history(BindingReadHarness host, bytes32 key, uint32 fromRevision, uint16 limit)
        external
        view
        returns (StateBindingReads.BindingHistoryEntry[] memory, uint32, uint8)
    {
        return host.readHistory(key, fromRevision, limit);
    }
}

contract BindingReadsTest {
    bytes32 private constant AUTHOR = bytes32(type(uint256).max);
    bytes32 private constant REALM = keccak256("binding-read-realm");
    bytes32 private constant REVISION = keccak256("binding-read-revision");
    VmBindingReads private constant vm = VmBindingReads(address(uint160(uint256(keccak256("hevm cheat code")))));

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

    function intrinsicBlob() private pure returns (bytes memory blob) {
        blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
    }

    function initValue() private view returns (StateKernel.Init memory init, bytes32 metaId) {
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

    function deployHost() private returns (BindingReadHarness h, bytes32 metaId) {
        StateKernel.Init memory init;
        (init, metaId) = initValue();
        PreparationHelper helper = new PreparationHelper();
        h = new BindingReadHarness(
            init,
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash,
            address(PointReadLibrary).codehash,
            address(QueryReadLibrary).codehash
        );
    }

    function deploySynthetic() private returns (SyntheticBindingReadHarness h) {
        (StateKernel.Init memory init,) = initValue();
        PreparationHelper helper = new PreparationHelper();
        h = new SyntheticBindingReadHarness(
            init,
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash,
            address(PointReadLibrary).codehash,
            address(QueryReadLibrary).codehash
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

    function publication(StateKernel.SelectedLeaf[] memory leaves, uint256 nonce)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(nonce), 0);
        p.recordIds = new bytes32[](leaves.length);
        p.leafMask = uint64((uint256(1) << leaves.length) - 1);
        p.leaves = leaves;
        for (uint256 i; i < leaves.length; ++i) {
            p.recordIds[i] =
                keccak256(abi.encode(keccak256("efs2/record/1"), leaves[i].typeId, keccak256(leaves[i].body)));
        }
        identify(p);
    }

    function publicationAs(StateKernel.SelectedLeaf[] memory leaves, uint256 nonce, bytes32 principal)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        p = publication(leaves, nonce);
        p.header.principalId = principal;
        identify(p);
    }

    function publish(BindingReadHarness h, StateKernel.Publication memory p)
        private
        returns (StateKernel.AdmitResult memory)
    {
        return h.publishTrustedForTest(StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p);
    }

    function publishAs(BindingReadHarness h, StateKernel.Publication memory p, bytes32 principal)
        private
        returns (StateKernel.AdmitResult memory)
    {
        return h.publishTrustedForTest(StateKernel.VerifiedContext(principal, 1, 0x1234, bytes32(uint256(0xabcd))), p);
    }

    function installGroup(BindingReadHarness h, bytes32 metaId, uint256 groupIndex, uint256 nonce) private {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        bytes memory group = candidateGroup(groupIndex);
        leaves[0] = StateKernel.SelectedLeaf(0, metaId, abi.encodePacked(uint16(group.length), group));
        publish(h, publication(leaves, nonce));
    }

    function one(bytes32 typeId, bytes memory body, uint256 nonce, bytes32 principal)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, typeId, body);
        p = publicationAs(leaves, nonce, principal);
    }

    function predecessor(bytes32 envelopeId, uint16 leafIndex) private pure returns (bytes memory) {
        return envelopeId == 0 ? bytes(hex"00") : abi.encodePacked(hex"01", envelopeId, leafIndex);
    }

    function setRecordBody(
        bytes32 purpose,
        bytes32 subject,
        bytes32 fieldRole,
        bytes32 target,
        bytes32 previousEnvelope,
        uint16 previousLeaf
    ) private pure returns (bytes memory) {
        return abi.encodePacked(
            purpose, subject, fieldRole, hex"01", target, hex"00", predecessor(previousEnvelope, previousLeaf)
        );
    }

    function setOccurrenceBody(
        bytes32 purpose,
        bytes32 subject,
        bytes32 fieldRole,
        bytes32 targetEnvelope,
        uint16 targetLeaf,
        bytes32 previousEnvelope,
        uint16 previousLeaf
    ) private pure returns (bytes memory) {
        return abi.encodePacked(
            purpose,
            subject,
            fieldRole,
            hex"00",
            hex"01",
            targetEnvelope,
            targetLeaf,
            predecessor(previousEnvelope, previousLeaf)
        );
    }

    function tombstoneBody(
        bytes32 purpose,
        bytes32 subject,
        bytes32 fieldRole,
        bytes32 previousEnvelope,
        uint16 previousLeaf
    ) private pure returns (bytes memory) {
        return abi.encodePacked(purpose, subject, fieldRole, predecessor(previousEnvelope, previousLeaf));
    }

    function bindingKey(bytes32 principal, bytes32 purpose, bytes32 subject, bytes32 fieldRole)
        private
        pure
        returns (bytes32)
    {
        bytes32 position = keccak256(abi.encode(keccak256("efs2/position/1"), purpose, subject, fieldRole));
        return keccak256(abi.encode(keccak256("efs2/binding/1"), principal, position));
    }

    function withRevision(StateKernel.Publication memory p, uint32 revision)
        private
        pure
        returns (StateKernel.Publication memory)
    {
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, revision);
        return p;
    }

    function assertHead(
        BindingReadHarness h,
        bytes32 key,
        uint64 basis,
        uint8 state,
        uint8 targetKind,
        uint8 cause,
        uint32 revision,
        uint64 ordinal,
        bytes32 target,
        uint16 targetLeaf,
        uint64 returnedH
    ) private view {
        (BindingFold.Head memory head, bytes32 realmBasis, uint64 highWater) = h.getBindingAtBasis(key, basis);
        require(
            head.state == state && head.targetKind == targetKind && head.tombstoneCause == cause
                && head.revision == revision && head.admissionOrdinal == ordinal && head.targetA == target
                && head.targetLeaf == targetLeaf,
            "exact projected head"
        );
        require(realmBasis == REVISION && highWater == returnedH, "exact projected basis");
    }

    function assertRevert(address target, bytes memory callData, bytes memory expected, string memory label)
        private
        view
    {
        (bool ok, bytes memory actual) = target.staticcall(callData);
        require(!ok && keccak256(actual) == keccak256(expected), label);
    }

    function testActualAdmissionProjectsBindingHeadAndHistory() public {
        (BindingReadHarness h, bytes32 metaId) = deployHost();
        installGroup(h, metaId, 0, 1);
        installGroup(h, metaId, 1, 2);

        bytes32 objectType = candidateType(0, 0);
        bytes32 setType = candidateType(1, 0);
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        bytes memory objectBody = abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00");
        bytes32 targetRecordId = keccak256(abi.encode(keccak256("efs2/record/1"), objectType, keccak256(objectBody)));
        leaves[0] = StateKernel.SelectedLeaf(0, objectType, objectBody);
        leaves[1] = StateKernel.SelectedLeaf(
            1,
            setType,
            abi.encodePacked(
                bytes32(uint256(1)), targetRecordId, bytes32(uint256(2)), hex"01", targetRecordId, hex"0000"
            )
        );
        StateKernel.Publication memory setPublication = publication(leaves, 3);
        setPublication.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        setPublication.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        StateKernel.AdmitResult memory result = publish(h, setPublication);
        uint64 setOrdinal = result.leaves[1].admissionOrdinal;
        bytes32 position = keccak256(
            abi.encode(keccak256("efs2/position/1"), bytes32(uint256(1)), targetRecordId, bytes32(uint256(2)))
        );
        bytes32 key = keccak256(abi.encode(keccak256("efs2/binding/1"), AUTHOR, position));

        (BindingFold.Head memory head, bytes32 revision, uint64 highWater) = h.getBindingHead(key);
        require(head.state == 1 && head.revision == 1 && head.admissionOrdinal == setOrdinal, "current head identity");
        require(head.targetKind == 1 && head.targetA == targetRecordId && head.targetLeaf == 0, "current head target");
        require(revision == REVISION && highWater == 4, "current basis");

        (StateBindingReads.BindingHistoryEntry[] memory entries, uint32 next, uint8 completeness) =
            h.readHistory(key, 1, 1);
        require(entries.length == 1 && entries[0].envelopeId == setPublication.envelopeId, "history source");
        require(entries[0].revision == 1 && entries[0].admissionOrdinal == setOrdinal, "history identity");
        require(entries[0].occurrenceStatus == 1 && entries[0].revokedAtOrdinal == 0, "history lifecycle");
        require(next == 0 && completeness == 1, "history completion");
    }

    function testSyntheticFinalPostingTailRejectsFromNonfinalSelectedLane() public {
        SyntheticBindingReadHarness h = deploySynthetic();
        bytes32 key = keccak256("tail-history");
        bytes32 subject = keccak256("tail-subject");
        h.seedAdmissionCountForTest(8);
        h.seedPostingHeadForTest(key, uint256(8) | (uint256(8) << 64) | (uint256(8) << 128) | (uint256(1) << 176));
        h.seedPostingWordForTest(key, 1, uint256(6) | (uint256(7) << 48) | (uint256(8) << 96) | (uint256(9) << 144));
        (bool ok, bytes memory errorData) =
            address(h).staticcall(abi.encodeCall(h.postingAtForTest, (key, uint64(8), uint64(5), subject)));
        require(
            !ok
                && keccak256(errorData)
                    == keccak256(abi.encodeWithSelector(bytes4(keccak256("ErrReadState(bytes32)")), subject)),
            "unused final tail must reject when a nonfinal lane is selected"
        );
    }

    function testHistoryInputAfterInitializationBeforeHeadValidation() public {
        SyntheticBindingReadHarness h = deploySynthetic();
        bytes32 key = keccak256("precedence");
        h.seedBindingForTest(key, 1 << 120, 0);
        assertRevert(
            address(h),
            abi.encodeCall(h.readHistory, (key, 0, 1)),
            abi.encodeWithSelector(StateBindingReads.ErrReadHistory.selector, uint32(0), uint16(1)),
            "caller history after init before head"
        );
        h.clearInitialRevisionForTest();
        assertRevert(
            address(h),
            abi.encodeCall(h.readHistory, (key, 0, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, key),
            "initial revision precedes caller history"
        );
        h.clearRealmForTest();
        assertRevert(
            address(h),
            abi.encodeCall(h.readHistory, (key, 0, 1)),
            abi.encodeWithSelector(StateKernel.InvalidInitialization.selector),
            "initialization precedes caller history"
        );
    }

    struct Fixture {
        SyntheticBindingReadHarness h;
        bytes32 key;
        bytes32 target;
        StateKernel.Publication first;
        StateKernel.Publication second;
    }

    function fixture() private returns (Fixture memory f) {
        f.h = deploySynthetic();
        (, bytes32 meta) = initValue();
        installGroup(f.h, meta, 0, 100);
        installGroup(f.h, meta, 1, 101);
        StateKernel.Publication memory object =
            one(candidateType(0, 0), abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00"), 102, AUTHOR);
        publish(f.h, object);
        f.target = object.recordIds[0];
        f.key = bindingKey(AUTHOR, bytes32(uint256(1)), f.target, bytes32(uint256(2)));
        f.first = withRevision(
            one(
                candidateType(1, 0),
                setRecordBody(bytes32(uint256(1)), f.target, bytes32(uint256(2)), f.target, 0, 0),
                103,
                AUTHOR
            ),
            0
        );
        publish(f.h, f.first);
        f.second = withRevision(
            one(
                candidateType(1, 0),
                setOccurrenceBody(
                    bytes32(uint256(1)), f.target, bytes32(uint256(2)), object.envelopeId, 0, f.first.envelopeId, 0
                ),
                104,
                AUTHOR
            ),
            1
        );
        publish(f.h, f.second);
    }

    function historyError(Fixture memory f, string memory label) private view {
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 1, 64)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            label
        );
    }

    function testHistoryInputAndBasisExactErrors() public {
        Fixture memory f = fixture();
        uint16[3] memory bad = [uint16(0), uint16(65), type(uint16).max];
        for (uint256 i; i < bad.length; ++i) {
            assertRevert(
                address(f.h),
                abi.encodeCall(f.h.readHistory, (f.key, 1, bad[i])),
                abi.encodeWithSelector(StateBindingReads.ErrReadHistory.selector, uint32(1), bad[i]),
                "history limit"
            );
        }
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.getBindingAtBasis, (f.key, 6)),
            abi.encodeWithSelector(StateReadPrimitives.ErrPageBasis.selector, uint64(6), uint64(5)),
            "future basis"
        );
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.getBindingAtBasis, (f.key, (uint64(1) << 48) - 1)),
            abi.encodeWithSelector(StateReadPrimitives.ErrPageBasis.selector, (uint64(1) << 48) - 1, uint64(5)),
            "sentinel basis"
        );
        f.h.seedAdmissionCountForTest((uint64(1) << 48) - 1);
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.getBindingAtBasis, (f.key, 6)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "malformed H precedes input"
        );
    }

    function testSyntheticHeadAndPostingRefusalMatrix() public {
        Fixture memory f = fixture();
        uint256 baseline = vm.snapshotState();
        uint256 valid = uint256(1) | (uint256(2) << 8) | (uint256(5) << 40) | (uint256(2) << 88);
        uint256[7] memory bad = [
            valid | (uint256(1) << 120),
            valid | (uint256(1) << 96),
            uint256(1) | (uint256(5) << 40) | (uint256(2) << 88),
            uint256(1) | (uint256(type(uint32).max) << 8) | (uint256(5) << 40) | (uint256(2) << 88),
            uint256(1) | (uint256(2) << 8) | (uint256(6) << 40) | (uint256(2) << 88),
            valid | (uint256(4) << 88),
            uint256(2) | (uint256(2) << 8) | (uint256(5) << 40)
        ];
        for (uint256 i; i < bad.length; ++i) {
            f.h.seedBindingForTest(f.key, bad[i], f.target);
            historyError(f, "head metadata");
            require(vm.revertToState(baseline));
            baseline = vm.snapshotState();
        }
        f.h.seedBindingForTest(f.key, valid, 0);
        historyError(f, "zero target");
        require(vm.revertToState(baseline));
        baseline = vm.snapshotState();
        bytes32 hk = IndexKeys.posting(0, 8, 0, f.key);
        uint256 good = uint256(2) | (uint256(2) << 64) | (uint256(5) << 128) | (uint256(1) << 176);
        uint256[8] memory heads = [
            good | (uint256(1) << 192),
            good - (uint256(1) << 64),
            good - (uint256(1) << 176),
            good + (uint256(1) << 128),
            good + 1 + (uint256(1) << 64), // valid posting head, count differs from Binding revision
            good - (uint256(1) << 128), // valid posting head, last differs from Binding ordinal
            good + (uint256(1) << 64), // live exceeds count
            uint256(1) << 176
        ];
        for (uint256 i; i < heads.length; ++i) {
            f.h.seedPostingHeadForTest(hk, heads[i]);
            historyError(f, "history count/live/mode/last");
            require(vm.revertToState(baseline));
            baseline = vm.snapshotState();
        }
        uint256[6] memory words = [
            uint256(4) | (uint256(5) << 48) | (uint256(1) << 240),
            uint256(4) | (uint256(5) << 48) | (uint256(1) << 96),
            uint256(5) << 48,
            uint256(6) | (uint256(5) << 48),
            uint256(5) | (uint256(5) << 48),
            uint256(4) | (uint256(3) << 48)
        ];
        for (uint256 i; i < words.length; ++i) {
            f.h.seedPostingWordForTest(hk, 0, words[i]);
            if (i < 4) {
                historyError(f, "posting high/tail/zero/over-last");
            } else {
                assertRevert(
                    address(f.h),
                    abi.encodeCall(f.h.readHistory, (f.key, 2, 1)),
                    abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
                    "selected adjacent order or final equality before mutation decoding"
                );
            }
            require(vm.revertToState(baseline));
            baseline = vm.snapshotState();
        }
        f.h.seedBindingForTest(f.key, 0, 0);
        historyError(f, "absent head with history");
    }

    function testSyntheticExactTypeBeforeBodyAccess() public {
        Fixture memory f = fixture();
        bytes32 id = f.h
            .replaceMutationForTest(
                f.first.envelopeId, candidateType(0, 0), abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00")
            );
        bytes32 bodySlot = f.h.recordBodySlotForTest(id);
        vm.record();
        historyError(f, "non-kernel producer");
        (bytes32[] memory reads,) = vm.accesses(address(f.h));
        for (uint256 i; i < reads.length; ++i) {
            require(reads[i] != bodySlot, "exact Type precedes body access");
        }
    }

    function testSyntheticMutationDecoderRefusalMatrix() public {
        Fixture memory f = fixture();
        uint256 baseline = vm.snapshotState();
        bytes memory valid = f.first.leaves[0].body;
        bytes[] memory bad = new bytes[](9);
        bad[0] = abi.encodePacked(bytes32(uint256(2)), f.target, bytes32(uint256(2)), hex"01", f.target, hex"0000"); // wrong key
        bad[1] = abi.encodePacked(bytes32(uint256(1)), f.target, bytes32(uint256(2)), hex"02", f.target, hex"0000"); // OPTION
        bad[2] = setRecordBody(bytes32(uint256(1)), f.target, bytes32(uint256(2)), bytes32(uint256(65535)), 0, 0);
        bad[3] = setOccurrenceBody(bytes32(uint256(1)), f.target, bytes32(uint256(2)), f.second.envelopeId, 64, 0, 0);
        bad[4] = abi.encodePacked(valid, hex"00");
        bad[5] = setRecordBody(bytes32(uint256(1)), f.target, bytes32(uint256(2)), f.target, f.second.envelopeId, 0);
        bad[6] = abi.encodePacked(bytes32(uint256(1)), f.target, bytes32(uint256(2)), hex"000000"); // neither target
        bad[7] = abi.encodePacked(
            bytes32(uint256(1)),
            f.target,
            bytes32(uint256(2)),
            hex"01",
            f.target,
            hex"01",
            f.second.envelopeId,
            uint16(0),
            hex"00"
        ); // both
        bad[8] = new bytes(168);
        for (uint256 i; i < bad.length; ++i) {
            f.h.replaceMutationForTest(f.first.envelopeId, candidateType(1, 0), bad[i]);
            historyError(f, "self-consistent malformed kernel body");
            require(vm.revertToState(baseline));
            baseline = vm.snapshotState();
        }
        f.h.replaceBodyForTest(f.first.recordIds[0], bad[0]);
        historyError(f, "Record hash mismatch");
        require(vm.revertToState(baseline));
        f.h
            .replaceMutationForTest(
                f.second.envelopeId,
                candidateType(1, 0),
                setRecordBody(bytes32(uint256(1)), f.target, bytes32(uint256(2)), f.target, f.second.envelopeId, 0)
            );
        historyError(f, "wrong predecessor log");
    }

    function testSyntheticHugeHistoryBoundedSearch() public {
        Fixture memory f = fixture();
        uint64 count = uint64(1) << 31;
        uint64 last = count + 3;
        f.h.seedAdmissionCountForTest(last);
        f.h
            .seedBindingForTest(
                f.key, uint256(1) | (uint256(count) << 8) | (uint256(last) << 40) | (uint256(1) << 88), f.target
            );
        bytes32 hk = IndexKeys.posting(0, 8, 0, f.key);
        f.h
            .seedPostingHeadForTest(
                hk, uint256(count) | (uint256(count) << 64) | (uint256(last) << 128) | (uint256(1) << 176)
            );
        // Synthetic monotonic oracle ordinal[position]=position+4; seed only search and required boundary words.
        uint64 lo;
        uint64 hi = count;
        uint256 probes;
        bytes32[] memory slots = new bytes32[](35);
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            seedMonotonicWord(f.h, hk, mid, count);
            slots[probes] = f.h.postingWordSlotForTest(hk, mid);
            ++probes;
            if (mid + 4 <= 4) lo = mid + 1;
            else hi = mid;
        }
        require(lo == 1, "independent selected physical revision");
        seedMonotonicWord(f.h, hk, 0, count);
        seedMonotonicWord(f.h, hk, 1, count);
        seedMonotonicWord(f.h, hk, 2, count);
        // selected, next and following are actual counted boundary calls; no previous at revision 1.
        slots[probes] = f.h.postingWordSlotForTest(hk, 0);
        slots[probes + 1] = f.h.postingWordSlotForTest(hk, 1);
        slots[probes + 2] = f.h.postingWordSlotForTest(hk, 2);
        probes += 3;
        require(probes == 35 && probes < 48, "counted-loop derivation including selected boundary");
        vm.record();
        assertHead(f.h, f.key, 4, 1, 1, 0, 1, 4, f.target, 0, 4);
        (bytes32[] memory reads,) = vm.accesses(address(f.h));
        uint256 actual;
        for (uint256 i; i < reads.length; ++i) {
            for (uint256 j; j < slots.length; ++j) {
                if (reads[i] == slots[j]) {
                    ++actual;
                    break;
                }
            }
        }
        require(actual == probes, "actual posting SLOADs equal search plus counted boundary derivation");
    }

    function seedMonotonicWord(SyntheticBindingReadHarness h, bytes32 key, uint64 position, uint64 count) private {
        uint64 start = (position / 5) * 5;
        uint256 packed;
        for (uint64 i; i < 5 && start + i < count; ++i) {
            packed |= uint256(start + i + 4) << (48 * i);
        }
        h.seedPostingWordForTest(key, position / 5, packed);
    }

    function testSyntheticWithdrawalAssociationRefusals() public {
        Fixture memory f = fixture();
        bytes32 other = bytes32(uint256(1) << 255);
        StateKernel.Publication memory otherObject =
            one(candidateType(0, 0), abi.encodePacked(other, bytes32(uint256(100)), hex"00"), 105, other);
        publishAs(f.h, otherObject, other);
        StateKernel.Publication memory withdrawal =
            one(candidateType(1, 2), abi.encodePacked(f.second.envelopeId, uint16(0)), 106, AUTHOR);
        publish(f.h, withdrawal);
        (StateBindingReads.BindingHistoryEntry[] memory good,,) = f.h.readHistory(f.key, 1, 64);
        require(
            good.length == 3 && good[1].occurrenceStatus == 2 && good[1].revokedAtOrdinal == 7,
            "valid withdrawal baseline"
        );
        uint256 baseline = vm.snapshotState();
        f.h
            .replaceMutationForTest(
                withdrawal.envelopeId, candidateType(1, 2), abi.encodePacked(f.first.envelopeId, uint16(0))
            );
        historyError(f, "withdraw stale not immediately previous");
        require(vm.revertToState(baseline));
        baseline = vm.snapshotState();
        f.h
            .replaceMutationForTest(
                f.second.envelopeId,
                candidateType(1, 0),
                setRecordBody(bytes32(uint256(9)), f.target, bytes32(uint256(2)), f.target, f.first.envelopeId, 0)
            );
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw wrong key"
        );
        require(vm.revertToState(baseline));
        baseline = vm.snapshotState();
        f.h.replacePrincipalForTest(f.second.envelopeId, other);
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw wrong author"
        );
        require(vm.revertToState(baseline));
        baseline = vm.snapshotState();
        f.h
            .replaceMutationForTest(
                f.second.envelopeId, candidateType(0, 0), abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00")
            );
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw nonbinding target"
        );
        require(vm.revertToState(baseline));
        baseline = vm.snapshotState();
        f.h
            .replaceMutationForTest(
                f.second.envelopeId, candidateType(1, 2), abi.encodePacked(f.first.envelopeId, uint16(0))
            );
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw Withdrawal target"
        );
        require(vm.revertToState(baseline));
        baseline = vm.snapshotState();
        f.h.seedLifecycleForTest(f.second.envelopeId, uint256(1) | (uint256(5) << 8));
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw target lifecycle not withdrawn"
        );
        require(vm.revertToState(baseline));
        f.h.seedLifecycleForTest(f.second.envelopeId, uint256(2) | (uint256(5) << 8) | (uint256(6) << 56));
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw lifecycle ordinal mismatch"
        );
    }

    function testSyntheticWithdrawalTargetPredecessorMustBeEarlier() public {
        Fixture memory f = fixture();
        StateKernel.Publication memory withdrawal =
            one(candidateType(1, 2), abi.encodePacked(f.second.envelopeId, uint16(0)), 108, AUTHOR);
        publish(f.h, withdrawal); // original withdrawal ordinal 6
        f.h.seedAdmissionCountForTest(7);
        f.h.relocateAdmissionForTest(6, 7);
        f.h.seedLifecycleForTest(f.second.envelopeId, uint256(2) | (uint256(5) << 8) | (uint256(7) << 56));
        f.h.relocateAdmissionForTest(4, 6); // checked log identity still matches the target's declared predecessor
        f.h.seedBindingForTest(f.key, uint256(2) | (uint256(3) << 8) | (uint256(7) << 40) | (uint256(2) << 96), 0);
        bytes32 hk = IndexKeys.posting(0, 8, 0, f.key);
        f.h.seedPostingHeadForTest(hk, uint256(3) | (uint256(3) << 64) | (uint256(7) << 128) | (uint256(1) << 176));
        f.h.seedPostingWordForTest(hk, 0, uint256(6) | (uint256(5) << 48) | (uint256(7) << 96));
        assertRevert(
            address(f.h),
            abi.encodeCall(f.h.readHistory, (f.key, 3, 1)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, f.key),
            "withdraw target predecessor ordering"
        );
    }

    function testSyntheticFullPrincipalKeyAssociation() public {
        Fixture memory f = fixture();
        bytes32 other = bytes32((uint256(1) << 255) | type(uint160).max);
        publishAs(
            f.h, one(candidateType(0, 0), abi.encodePacked(other, bytes32(uint256(101)), hex"00"), 107, other), other
        );
        f.h.replacePrincipalForTest(f.first.envelopeId, other);
        historyError(f, "full Principal mismatch with equal low 160 bits");
    }

    function testSyntheticReadDependencyGuardsAllElevenMethods() public {
        (BindingReadHarness h,) = deployHost();
        bytes[] memory calls = new bytes[](11);
        calls[0] = abi.encodeCall(h.getTypeSchema, (bytes32(0)));
        calls[1] = abi.encodeCall(h.getTypeOrigin, (bytes32(0)));
        calls[2] = abi.encodeCall(h.intrinsicTypeGroupBytes, ());
        calls[3] = abi.encodeCall(h.getRecord, (bytes32(0)));
        calls[4] = abi.encodeCall(h.getEnvelope, (bytes32(0)));
        calls[5] = abi.encodeCall(h.getOccurrence, (bytes32(0), 0));
        calls[6] = abi.encodeCall(h.getOccurrenceByOrdinal, (0));
        calls[7] = abi.encodeCall(h.getReceipt, (0));
        calls[8] = abi.encodeCall(h.getBindingHead, (bytes32(0)));
        calls[9] = abi.encodeCall(h.getBindingAtBasis, (bytes32(0), 1));
        calls[10] = abi.encodeCall(h.readHistory, (bytes32(0), 0, 0));
        for (uint8 role = 1; role <= 2; ++role) {
            address dep = role == 1 ? address(PointReadLibrary) : address(QueryReadLibrary);
            bytes memory original = dep.code;
            for (uint256 replacement; replacement < 2; ++replacement) {
                vm.etch(dep, replacement == 0 ? bytes("") : bytes(hex"60006000fd"));
                for (uint256 i = role == 1 ? 0 : 8; i < (role == 1 ? 8 : 11); ++i) {
                    assertRevert(
                        address(h),
                        calls[i],
                        abi.encodeWithSelector(BindingReadHarness.ReadCodeMismatch.selector, role),
                        "dependency guard before caller/state"
                    );
                }
            }
            vm.etch(dep, original);
        }
    }

    function testSyntheticConstructorDependencyGuards() public {
        (StateKernel.Init memory init,) = initValue();
        PreparationHelper helper = new PreparationHelper();
        bytes32 pointHash = address(PointReadLibrary).codehash;
        bytes32 queryHash = address(QueryReadLibrary).codehash;
        for (uint8 role = 1; role <= 2; ++role) {
            address dep = role == 1 ? address(PointReadLibrary) : address(QueryReadLibrary);
            bytes memory original = dep.code;
            for (uint256 mode; mode < 3; ++mode) {
                if (mode < 2) vm.etch(dep, mode == 0 ? bytes("") : bytes(hex"60006000fd"));
                try new BindingReadHarness(
                    init,
                    address(helper),
                    address(helper).codehash,
                    address(AdmissionLibrary).codehash,
                    role == 1 && mode == 2 ? bytes32(0) : pointHash,
                    role == 2 && mode == 2 ? bytes32(0) : queryHash
                ) {
                    revert("constructor must reject");
                } catch (bytes memory reason) {
                    require(
                        keccak256(reason)
                            == keccak256(abi.encodeWithSelector(BindingReadHarness.ReadCodeMismatch.selector, role)),
                        "exact constructor mismatch"
                    );
                }
                vm.etch(dep, original);
            }
        }
    }

    function testOrdinaryCallReadsHaveNoStorageWritesAcrossAllElevenMethods() public {
        Fixture memory f = fixture();
        bytes[] memory calls = new bytes[](11);
        calls[0] = abi.encodeCall(f.h.getTypeSchema, (candidateType(1, 0)));
        calls[1] = abi.encodeCall(f.h.getTypeOrigin, (candidateType(1, 0)));
        calls[2] = abi.encodeCall(f.h.intrinsicTypeGroupBytes, ());
        calls[3] = abi.encodeCall(f.h.getRecord, (f.first.recordIds[0]));
        calls[4] = abi.encodeCall(f.h.getEnvelope, (f.first.envelopeId));
        calls[5] = abi.encodeCall(f.h.getOccurrence, (f.first.envelopeId, 0));
        calls[6] = abi.encodeCall(f.h.getOccurrenceByOrdinal, (4));
        calls[7] = abi.encodeCall(f.h.getReceipt, (4));
        calls[8] = abi.encodeCall(f.h.getBindingHead, (f.key));
        calls[9] = abi.encodeCall(f.h.getBindingAtBasis, (f.key, 4));
        calls[10] = abi.encodeCall(f.h.readHistory, (f.key, 1, 64));
        address helper = f.h.preparationHelper();
        vm.etch(helper, hex"60006000fd");
        vm.record();
        for (uint256 i; i < calls.length; ++i) {
            (bool ok,) = address(f.h).call(calls[i]);
            require(ok, "ordinary nonstatic read CALL");
        }
        (, bytes32[] memory writes) = vm.accesses(address(f.h));
        require(writes.length == 0, "no host SSTORE during ordinary read transactions");
        (, writes) = vm.accesses(address(PointReadLibrary));
        require(writes.length == 0, "no point library writes");
        (, writes) = vm.accesses(address(QueryReadLibrary));
        require(writes.length == 0, "no query library writes");
    }
}
