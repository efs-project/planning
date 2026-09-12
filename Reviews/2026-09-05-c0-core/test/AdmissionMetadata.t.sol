// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateKernelTest} from "./StateKernel.t.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {CacheCodeForTest} from "./CacheCodeForTest.sol";

interface VmAdmissionMetadata {
    function load(address, bytes32) external view returns (bytes32);
    function record() external;
    function accesses(address) external returns (bytes32[] memory reads, bytes32[] memory writes);
    function store(address, bytes32, bytes32) external;
    function etch(address, bytes calldata) external;
}

/// Test-only scalar/full-row comparison, with the actual unchanged Store layout.
contract AdmissionMetadataViewHarness {
    StateStore.Store private s;

    function seedRecord(bytes32 id, bytes memory body, uint64 ordinal) external {
        s.records[id] = CacheCodeForTest.recordCell(bytes32(uint256(7)), body, ordinal, 9);
    }

    function seedType(bytes32 id, address pointer, uint64 ordinal) external {
        s.types[id] = StateStore.TypeCell(bytes32(uint256(11)), 2, ordinal, 13, pointer);
    }

    function recordMeta(bytes32 id) external view returns (StateStore.RecordAdmissionMeta memory) {
        return StateStore.recordAdmissionMeta(s, id);
    }

    function fullRecordMeta(bytes32 id) external view returns (StateStore.RecordAdmissionMeta memory) {
        StateStore.RecordRow memory row =
            abi.decode(StateStore.read(s, StateStore.Kind.Record, id, 0), (StateStore.RecordRow));
        return StateStore.RecordAdmissionMeta(row.typeId, row.recordOrdinal);
    }

    function typeOrdinal(bytes32 id) external view returns (uint64) {
        return StateStore.typeDependencyOrdinal(s, id);
    }

    function oldTypeOrdinal(bytes32 id) external view returns (uint64) {
        return StateStore.typeRow(s, id).typeOrdinal;
    }
}

contract AdmissionMetadataViewTest {
    VmAdmissionMetadata constant vmMeta = VmAdmissionMetadata(address(uint160(uint256(keccak256("hevm cheat code")))));
    AdmissionMetadataViewHarness v;
    bytes32 constant ID = bytes32(uint256(99));

    function setUp() public {
        v = new AdmissionMetadataViewHarness();
    }

    function bodyHeader(uint256 word) internal {
        vmMeta.store(address(v), bytes32(uint256(keccak256(abi.encode(ID, uint256(12)))) + 1), bytes32(word));
    }

    function sameCall(bytes memory a, bytes memory b, bytes memory expected) internal view {
        (bool okA, bytes memory rawA) = address(v).staticcall(a);
        (bool okB, bytes memory rawB) = address(v).staticcall(b);
        require(
            !okA && !okB && keccak256(rawA) == keccak256(expected) && keccak256(rawB) == keccak256(expected),
            "exact legacy/candidate refusal"
        );
    }

    function testEmpty31_32_8192AndAbsentMetadataMatchesFullRow() public {
        require(v.recordMeta(ID).recordOrdinal == 0, "absent");
        uint256[4] memory sizes = [uint256(0), 31, 32, 8192];
        for (uint256 i; i < sizes.length; ++i) {
            v.seedRecord(ID, new bytes(sizes[i]), 5);
            require(
                keccak256(abi.encode(v.recordMeta(ID))) == keccak256(abi.encode(v.fullRecordMeta(ID))),
                "logical metadata exact"
            );
        }
    }

    function testMalformedReferencesRefuseBeforeMetadata() public {
        // These words are now invalid physical references, not Solidity bytes headers.
        uint256[2] memory malformed = [uint256(64), uint256(1) << 208];
        for (uint256 i; i < malformed.length; ++i) {
            bodyHeader(malformed[i]);
            sameCall(
                abi.encodeCall(v.recordMeta, (ID)),
                abi.encodeCall(v.fullRecordMeta, (ID)),
                abi.encodeWithSelector(StorageByteView.ErrReadState.selector, ID)
            );
        }
    }

    function testMalformedReferenceLengthsRefuseWithoutAbandonedSlotReads() public {
        v.seedRecord(ID, new bytes(8193), 5);
        bytes32 cellSlot = bytes32(uint256(keccak256(abi.encode(ID, uint256(12)))) + 1);
        uint256[2] memory words = [uint256(vmMeta.load(address(v), cellSlot)), type(uint256).max];
        uint256 payload = uint256(keccak256(abi.encode(uint256(keccak256(abi.encode(ID, uint256(12)))) + 1)));
        for (uint256 i; i < words.length; ++i) {
            bodyHeader(words[i]);
            vmMeta.record();
            (bool ok, bytes memory raw) = address(v).staticcall(abi.encodeCall(v.recordMeta, (ID)));
            (bytes32[] memory reads,) = vmMeta.accesses(address(v));
            require(
                !ok && keccak256(raw) == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, ID)),
                "bounded impossible length"
            );
            for (uint256 j; j < reads.length; ++j) {
                require(uint256(reads[j]) != payload, "must not read abandoned payload slot");
            }
        }
        // Both current logical/full-row and metadata paths reject actual physical faults.
        sameCall(
            abi.encodeCall(v.recordMeta, (ID)),
            abi.encodeCall(v.fullRecordMeta, (ID)),
            abi.encodeWithSelector(StorageByteView.ErrReadState.selector, ID)
        );
    }

    function testValidLengthFabricatedPayloadIsNotAuthenticatedByMetadata() public {
        v.seedRecord(ID, new bytes(32), 5);
        bytes32 slot = bytes32(uint256(keccak256(abi.encode(ID, uint256(12)))) + 1);
        address pointer = address(uint160(uint256(vmMeta.load(address(v), slot))));
        vmMeta.etch(pointer, bytes.concat(hex"00", abi.encode(bytes32(type(uint256).max))));
        require(
            v.recordMeta(ID).recordOrdinal == 5 && v.fullRecordMeta(ID).recordOrdinal == 5,
            "no body authentication claim"
        );
    }

    function testRecordMetadataCostDoesNotScaleWithCodePayload() public {
        v.seedRecord(ID, new bytes(31), 5);
        uint256 before = gasleft();
        require(v.recordMeta(ID).recordOrdinal == 5, "tiny metadata");
        uint256 tiny = before - gasleft();
        v.seedRecord(ID, new bytes(8192), 5);
        before = gasleft();
        require(v.recordMeta(ID).recordOrdinal == 5, "large metadata");
        uint256 large = before - gasleft();
        require(large < tiny + 500, "metadata must not allocate/copy the large payload");
    }

    function testTypeNullStopSmallLargeCodeAndMissingOrdinalMatch() public {
        address pointer = address(0xCAFE);
        v.seedType(ID, address(0), 5);
        require(v.typeOrdinal(ID) == 5 && v.oldTypeOrdinal(ID) == 5, "null pointer preserves ordinal");
        uint256[3] memory sizes = [uint256(1), 1537, 24001];
        for (uint256 i; i < sizes.length; ++i) {
            vmMeta.etch(pointer, new bytes(sizes[i]));
            v.seedType(ID, pointer, 5);
            require(v.typeOrdinal(ID) == 5 && v.oldTypeOrdinal(ID) == 5, "STOP/code existence only");
        }
        v.seedType(ID, pointer, 0);
        require(v.typeOrdinal(ID) == 0 && v.oldTypeOrdinal(ID) == 0, "missing ordinal independent of code");
    }

    function testMissingTypeCodePanicPrecedesZeroOrdinal() public {
        for (uint64 ordinal; ordinal < 2; ++ordinal) {
            v.seedType(ID, address(0xBAD), ordinal);
            sameCall(
                abi.encodeCall(v.typeOrdinal, (ID)),
                abi.encodeCall(v.oldTypeOrdinal, (ID)),
                abi.encodeWithSignature("Panic(uint256)", 0x11)
            );
        }
    }
}

contract AdmissionMetadataTest is StateKernelTest {
    VmAdmissionMetadata constant vmMeta = VmAdmissionMetadata(address(uint160(uint256(keccak256("hevm cheat code")))));

    function bytesType() internal returns (bytes32 typeId) {
        bytes memory name = bytes("AdmissionBytes/1");
        bytes memory blob = abi.encodePacked(
            uint16(1),
            uint16(name.length),
            name,
            uint16(0),
            uint8(0),
            bytes32(0),
            uint16(1),
            hex"000164051ffe0000000000000000"
        );
        bytes memory raw = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, meta, abi.encodePacked(uint16(raw.length), raw));
        h.publishTrustedForTest(verified(), request(leaves, 100));
        typeId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(raw))),
                uint256(0)
            )
        );
    }

    function publishBytes(bytes32 typeId, uint16 length, uint256 salt) internal returns (bytes32 id) {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, typeId, abi.encodePacked(length, new bytes(length)));
        StateKernel.Publication memory p = request(leaves, salt);
        h.publishTrustedForTest(verified(), p);
        return p.recordIds[0];
    }

    function referencePlan(bytes32 target, uint256 salt) internal view returns (StateKernel.Publication memory p) {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(
            0, setType, abi.encodePacked(bytes32(salt), bytes32(0), bytes32(0), hex"01", target, hex"0000")
        );
        p = request(leaves, salt);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 0);
    }

    function assertNoPayloadRead(bytes32 target, StateKernel.Publication memory p) internal {
        uint256 cell = uint256(keccak256(abi.encode(target, uint256(12))));
        uint256 payload = uint256(keccak256(abi.encode(cell + 1)));
        vmMeta.record();
        h.publishTrustedForTest(verified(), p);
        (bytes32[] memory reads,) = vmMeta.accesses(address(h));
        for (uint256 i; i < reads.length; ++i) {
            require(
                uint256(reads[i]) < payload || uint256(reads[i]) >= payload + 256, "abandoned Record payload slot read"
            );
        }
    }

    function testReferenceAdmissionNeverReadsAbandonedPayloadSlots() public {
        install();
        bytes32 t = bytesType();
        bytes32 tiny = publishBytes(t, 0, 101);
        bytes32 large = publishBytes(t, 8190, 102);
        assertNoPayloadRead(tiny, referencePlan(tiny, 103));
        assertNoPayloadRead(large, referencePlan(large, 104));
        require(h.record(large).body.length == 8192, "legal near-limit target");
    }

    function testNewOccurrenceNeverReadsAbandonedPayloadSlots() public {
        bytes32 t = bytesType();
        bytes32 large = publishBytes(t, 8190, 105);
        uint64 firstOrdinal = h.record(large).recordOrdinal;
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, t, abi.encodePacked(uint16(8190), new bytes(8190)));
        assertNoPayloadRead(large, request(leaves, 106));
        require(firstOrdinal != 0 && h.record(large).recordOrdinal == firstOrdinal, "dedup keeps first ordinal");
    }

    function testReferenceWordRefusalPrecedesMissingReferenceAndRollsBack() public {
        install();
        bytes32 missing = bytes32(uint256(0xBAD00));
        StateKernel.Publication memory p = referencePlan(missing, 110);
        bytes32 beforeState = snapshot();
        bytes32 headerSlot = bytes32(uint256(keccak256(abi.encode(missing, uint256(12)))) + 1);
        vmMeta.store(address(h), headerSlot, bytes32(uint256(8193 * 2 + 1)));
        (bool ok, bytes memory raw) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        require(
            !ok && keccak256(raw) == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, missing)),
            "header precedes absent ordinal"
        );
        vmMeta.store(address(h), headerSlot, bytes32(0));
        require(snapshot() == beforeState, "all admission state rolled back");
        (ok, raw) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        require(
            !ok
                && keccak256(raw)
                    == keccak256(abi.encodeWithSelector(StateKernel.ReferenceUnproved.selector, uint16(0), uint8(0))),
            "ordinary missing reference unchanged"
        );
    }

    function testAllActiveRetryBypassesMetadataButNewOccurrenceStillChecksIncomingBody() public {
        bytes32 t = bytesType();
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, t, hex"000161");
        StateKernel.Publication memory p = request(leaves, 120);
        h.publishTrustedForTest(verified(), p);
        bytes32 id = p.recordIds[0];
        bytes32 slot = bytes32(uint256(keccak256(abi.encode(id, uint256(12)))) + 1);
        vmMeta.store(address(h), slot, bytes32(uint256(8193 * 2 + 1)));
        StateKernel.AdmitResult memory retried = h.publishTrustedForTest(verified(), p);
        require(retried.leaves[0].outcome == 2, "all ACTIVE does not use metadata guard");
        StateKernel.Publication memory fresh = request(leaves, 121);
        (bool ok, bytes memory raw) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), fresh)));
        require(
            !ok && keccak256(raw) == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, id)),
            "new occurrence reaches guard"
        );
        fresh.leaves[0].body = hex"000162";
        (ok, raw) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), fresh)));
        require(
            !ok && keccak256(raw) == keccak256(abi.encodeWithSelector(StateKernel.InvalidCommitment.selector)),
            "incoming commitment still checked first"
        );
    }

    function dependencyPlan(bytes32 dependency, uint256 salt) internal view returns (StateKernel.Publication memory) {
        bytes memory name = bytes("AdmissionDependency/1");
        bytes memory blob = abi.encodePacked(
            uint16(1),
            uint16(name.length),
            name,
            uint16(0),
            uint8(0),
            bytes32(0),
            uint16(1),
            hex"00067461726765740700010000097265666572656e636501",
            dependency,
            hex"000000000000000000"
        );
        bytes memory raw = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, meta, abi.encodePacked(uint16(raw.length), raw));
        return request(leaves, salt);
    }

    function testActualDependencyLoopNullStopMissingCodeAndMissingOrdinal() public {
        for (uint256 i; i < 4; ++i) {
            bytes32 dependency = bytes32(uint256(0xDEADBEEF) + i);
            uint256 cell = uint256(keccak256(abi.encode(dependency, uint256(14))));
            if (i < 2) vmMeta.store(address(h), bytes32(cell + 1), bytes32(uint256(1) << 16));
            if (i == 1) {
                vmMeta.etch(address(0xCAFE), hex"00");
                vmMeta.store(address(h), bytes32(cell + 2), bytes32(uint256(uint160(address(0xCAFE)))));
            }
            if (i == 2) vmMeta.store(address(h), bytes32(cell + 2), bytes32(uint256(0xBAD)));
            StateKernel.Publication memory p = dependencyPlan(dependency, 130 + i);
            (bool ok, bytes memory raw) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
            if (i < 2) {
                require(ok, "dependency existence allows null/STOP cache");
            } else {
                bytes memory expected = i == 2
                    ? abi.encodeWithSignature("Panic(uint256)", 0x11)
                    : abi.encodeWithSelector(StateKernel.MissingTypeDependency.selector, dependency);
                require(!ok && keccak256(raw) == keccak256(expected), "dependency exact ordered refusal");
                require(h.record(p.recordIds[0]).recordOrdinal == 0, "failed group record rolled back");
            }
        }
    }
}
