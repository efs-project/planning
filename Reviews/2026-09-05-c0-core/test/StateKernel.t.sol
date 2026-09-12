// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {StateStore} from "../src/StateStore.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StatefulHarness, SyntheticStatefulHarness, DependencyHarness} from "./StatefulHarness.sol";
import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "../src/RecordBody.sol";
import {BindingFold} from "../src/BindingFold.sol";
import {KernelValuesHarness} from "./KernelValues.t.sol";
import {IndexKeys} from "../src/IndexKeys.sol";

interface VmAcceptance {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
    function roll(uint256) external;
    function snapshotState() external returns (uint256);
    function revertToState(uint256) external returns (bool);
}

interface VmState {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
}

contract WordSafetyTest {
    function testMalformedShortWordAndOptionReject() public {
        KernelValuesHarness k = new KernelValuesHarness();
        RecordBody.CheckedBody memory b;
        b.fields = new bytes[](6);
        b.references = new RecordBody.ReferenceValue[](0);
        b.fields[0] = new bytes(31);
        b.fields[1] = new bytes(32);
        b.fields[2] = new bytes(32);
        b.fields[3] = abi.encodePacked(hex"01", bytes32(uint256(65536)));
        b.fields[4] = hex"00";
        b.fields[5] = hex"00";
        (bool ok, bytes memory e) = address(k)
            .staticcall(
                abi.encodeCall(k.decode, (BindingFold.KernelIds(bytes32(uint256(1)), 0, 0), bytes32(uint256(1)), b))
            );
        require(
            !ok && keccak256(e) == keccak256(abi.encodeWithSelector(RecordBody.InvalidBody.selector, uint16(2))),
            "short word must reject explicitly"
        );
        b.fields[0] = new bytes(32);
        b.fields[3] = hex"01";
        (ok, e) = address(k)
            .staticcall(
                abi.encodeCall(k.decode, (BindingFold.KernelIds(bytes32(uint256(1)), 0, 0), bytes32(uint256(1)), b))
            );
        require(
            !ok && keccak256(e) == keccak256(abi.encodeWithSelector(RecordBody.InvalidBody.selector, uint16(2))),
            "short option target must reject explicitly"
        );
    }
}

contract StateKernelTest {
    VmState constant vm = VmState(address(uint160(uint256(keccak256("hevm cheat code")))));
    StatefulHarness h;
    bytes[2] groups;
    bytes32 meta;
    bytes32 objectType;
    bytes32 setType;
    bytes32 constant AUTHOR = bytes32(type(uint256).max);

    function setUp() public {
        string memory j = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        for (uint256 g; g < 2; ++g) {
            groups[g] = vm.parseBytes(
                string.concat("0x", vm.parseJsonString(j, string.concat(".groups[", vm.toString(g), "].groupHex")))
            );
        }
        objectType = vm.parseJsonBytes32(j, ".groups[0].members[0].temporaryTypeSchemaId");
        setType = vm.parseJsonBytes32(j, ".groups[1].members[0].temporaryTypeSchemaId");
        bytes memory blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
        bytes memory intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        meta = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        PreparationHelper helper = new PreparationHelper();
        h = new StatefulHarness(
            StateKernel.Init(keccak256("test-realm"), keccak256("test-revision"), intrinsic, groups[0], groups[1]),
            address(helper),
            address(helper).codehash,
            address(AdmissionLibrary).codehash
        );
    }

    function verified() internal pure returns (StateKernel.VerifiedContext memory) {
        return StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd)));
    }

    function rid(bytes32 t, bytes memory b) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/record/1"), t, keccak256(b)));
    }

    function request(StateKernel.SelectedLeaf[] memory leaves, uint256 salt)
        internal
        pure
        returns (StateKernel.Publication memory p)
    {
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(salt), 0);
        p.leaves = abi.decode(abi.encode(leaves), (StateKernel.SelectedLeaf[]));
        p.recordIds = new bytes32[](leaves.length);
        for (uint256 i; i < leaves.length; ++i) {
            p.recordIds[i] = rid(leaves[i].typeId, leaves[i].body);
            p.leafMask |= uint64(uint256(1) << i);
        }
        p.expectedRevisions = new StateKernel.ExpectedRevision[](0);
        identify(p);
    }

    function identify(StateKernel.Publication memory p) internal pure {
        bytes32 d = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")
            )
        );
        bytes32 sh = keccak256(
            abi.encode(
                keccak256(
                    "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
                ),
                p.header,
                keccak256(abi.encodePacked(p.recordIds))
            )
        );
        p.envelopeId =
            keccak256(abi.encode(keccak256("efs2/envelope/1"), keccak256(abi.encodePacked(hex"1901", d, sh))));
    }

    function groupLeaf(uint16 i, uint256 g) internal view returns (StateKernel.SelectedLeaf memory) {
        return StateKernel.SelectedLeaf(i, meta, abi.encodePacked(uint16(groups[g].length), groups[g]));
    }

    function objectLeaf(uint16 i) internal view returns (StateKernel.SelectedLeaf memory) {
        return StateKernel.SelectedLeaf(i, objectType, abi.encodePacked(AUTHOR, bytes32(0), hex"00"));
    }

    function install() internal {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = groupLeaf(0, 0);
        a[1] = groupLeaf(1, 1);
        h.publishTrustedForTest(verified(), request(a, 1));
    }

    function pk(bytes32 t, uint8 k, bytes32 value) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/pk/1"), t, uint256(k), uint256(0), value));
    }

    function snapshot() internal view returns (bytes32 digest) {
        StateStore.Counts memory c = h.counts();
        digest = keccak256(abi.encode(c, h.bootstrap()));
        for (uint64 i = 1; i <= c.records; ++i) {
            bytes32 id = h.recordIdAt(i);
            digest = keccak256(abi.encode(digest, id, h.record(id)));
        }
        for (uint64 i = 1; i <= c.types; ++i) {
            bytes32 id = h.typeIdAt(i);
            digest = keccak256(abi.encode(digest, id, h.typeRow(id)));
        }
        for (uint64 i = 1; i <= c.envelopes; ++i) {
            bytes32 id = h.envelopeIdAt(i);
            StateStore.EnvelopeRow memory row = h.envelope(id);
            digest = keccak256(abi.encode(digest, id, row));
            (, bytes32[] memory vector) =
                abi.decode(row.canonicalUnsignedEnvelope, (StateKernel.EnvelopeHeader, bytes32[]));
            for (uint16 j; j < vector.length; ++j) {
                digest = keccak256(abi.encode(digest, h.occurrence(id, j)));
            }
        }
        for (uint64 i = 1; i <= c.principals; ++i) {
            bytes32 id = h.principalIdAt(i);
            digest = keccak256(abi.encode(digest, id, h.principal(id)));
        }
        for (uint64 i = 1; i <= c.admissions; ++i) {
            digest = keccak256(abi.encode(digest, h.admissionAt(i)));
        }
        for (uint64 i = 1; i <= c.batches; ++i) {
            digest = keccak256(abi.encode(digest, h.batchAt(i)));
        }
        for (uint64 i = 1; i <= c.bindingKeys; ++i) {
            bytes32 key = h.bindingKeyAt(i);
            digest = keccak256(abi.encode(digest, key, h.binding(key)));
        }
        for (uint64 i = 1; i <= c.postingKeys; ++i) {
            bytes32 key = h.postingKeyAt(i);
            uint256 head = h.postingHead(key);
            digest = keccak256(abi.encode(digest, key, head));
            for (uint64 j; j < (uint64(head) + 4) / 5; ++j) {
                digest = keccak256(abi.encode(digest, h.postingWord(key, j)));
            }
        }
    }

    function testObjectAndCharterBindingExactState() public {
        install();
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = objectLeaf(0);
        bytes32 target = rid(objectType, a[0].body);
        a[1] = StateKernel.SelectedLeaf(
            1, setType, abi.encodePacked(bytes32(uint256(1)), target, bytes32(uint256(2)), hex"01", target, hex"0000")
        );
        StateKernel.Publication memory p = request(a, 2);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        StateKernel.AdmitResult memory r = h.publishTrustedForTest(verified(), p);
        require(
            r.envelopeOrdinal == 2 && r.acceptingBatchId == 2 && r.leaves[0].admissionOrdinal == 3
                && r.leaves[1].admissionOrdinal == 4,
            "fresh exact receipts"
        );
        StateStore.Counts memory c = h.counts();
        require(
            c.records == 4 && c.envelopes == 2 && c.types == 10 && c.principals == 1 && c.admissions == 4
                && c.batches == 2 && c.bindingKeys == 1,
            "exact inventory"
        );
        require(
            h.record(target).recordOrdinal == 3 && h.record(target).firstAdmissionOrdinal == 3,
            "immutable object provenance"
        );
        bytes32 position =
            keccak256(abi.encode(keccak256("efs2/position/1"), bytes32(uint256(1)), target, bytes32(uint256(2))));
        bytes32 key = keccak256(abi.encode(keccak256("efs2/binding/1"), AUTHOR, position));
        StateStore.BindingRow memory b = h.binding(key);
        require(
            b.meta == 1 | (uint256(1) << 8) | (uint256(4) << 40) | (uint256(1) << 88) && b.target == target,
            "exact binding words"
        );
        require(h.postingHead(pk(0, 3, target)) == 1 | (uint256(1) << 64) | (uint256(3) << 128), "exact byRecord head");
    }

    function testInvalidFinalReferenceRollsBack() public {
        install();
        bytes32 beforeState = snapshot();
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = objectLeaf(0);
        a[1] = StateKernel.SelectedLeaf(
            1, setType, abi.encodePacked(new bytes(96), hex"01", bytes32(uint256(65536)), hex"0000")
        );
        StateKernel.Publication memory p = request(a, 3);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        (bool ok, bytes memory e) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        require(!ok, "invalid last reference must reject");
        require(
            keccak256(e)
                == keccak256(abi.encodeWithSelector(StateKernel.ReferenceUnproved.selector, uint16(1), uint8(0))),
            "typed unproved reference"
        );
        require(beforeState == snapshot(), "whole-call rollback");
        require(h.record(p.recordIds[0]).recordOrdinal == 0, "earlier object absent");
    }

    function testDuplicateSelectedRecordsAndGroupCachesRetainFirstProvenance() public {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](4);
        a[0] = groupLeaf(0, 0);
        a[1] = groupLeaf(1, 0);
        a[2] = objectLeaf(2);
        a[3] = objectLeaf(3);
        StateKernel.Publication memory p = request(a, 90);
        StateKernel.AdmitResult memory r = h.publishTrustedForTest(verified(), p);
        StateStore.Counts memory c = h.counts();
        require(
            c.records == 2 && c.types == 7 && c.envelopes == 1 && c.principals == 1 && c.admissions == 4
                && c.batches == 1,
            "unique inserts with four occurrences"
        );
        require(
            r.leaves[0].admissionOrdinal == 1 && r.leaves[1].admissionOrdinal == 2 && r.leaves[2].admissionOrdinal == 3
                && r.leaves[3].admissionOrdinal == 4,
            "four exact fresh receipts"
        );
        require(
            h.record(p.recordIds[0]).recordOrdinal == 1 && h.record(p.recordIds[0]).firstAdmissionOrdinal == 1,
            "group retains first provenance"
        );
        require(
            h.record(p.recordIds[2]).recordOrdinal == 2 && h.record(p.recordIds[2]).firstAdmissionOrdinal == 3,
            "object retains first provenance"
        );
        require(
            h.typeRow(objectType).typeOrdinal == 2 && h.typeRow(objectType).admittedAtOrdinal == 1
                && h.typeRow(objectType).groupRecordId == p.recordIds[0],
            "duplicate Type caches retain original group admission"
        );
        bytes32 key = pk(0, 3, p.recordIds[2]);
        require(h.postingHead(key) == 2 | (uint256(2) << 64) | (uint256(4) << 128), "repeated object posting head");
        require(h.postingWord(key, 0) == 3 | (uint256(4) << 48), "repeated object lanes in same physical word");
        require(uint64(h.postingHead(pk(objectType, 2, 0))) == 1, "unique Type appends once");
    }

    function testEarlierSelectedGroupEnablesTypedInstance() public {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = groupLeaf(0, 0);
        a[1] = objectLeaf(1);
        StateKernel.Publication memory p = request(a, 4);
        StateKernel.AdmitResult memory r = h.publishTrustedForTest(verified(), p);
        require(
            r.leaves[1].admissionOrdinal == 2 && h.record(p.recordIds[1]).recordOrdinal == 2,
            "earlier selected cache visible"
        );
        StateStore.TypeRow memory t = h.typeRow(objectType);
        require(
            t.typeOrdinal == 2 && t.admittedAtOrdinal == 1 && t.groupRecordId == p.recordIds[0],
            "real group cache provenance"
        );
    }

    function testDependencyBridgeRealGroupEquivalentToStrict() public {
        DependencyHarness d = new DependencyHarness();
        (bytes32 gh, TypeGroupParser.SchemaCache[] memory ss, bytes32[] memory deps) = d.parse(groups[1]);
        require(deps.length == 0, "kernel roles use ANY");
        (bytes32 strictHash, TypeGroupParser.SchemaCache[] memory strictSchemas) = d.strict(groups[1], deps);
        require(
            gh == strictHash && keccak256(abi.encode(ss)) == keccak256(abi.encode(strictSchemas)), "strict equivalent"
        );
        // Literal external role dependency, repeated in two different role slots.
        bytes memory blob = bytes.concat(
            hex"0001000154000000",
            new bytes(32),
            hex"0002000161070001620700020000016101",
            abi.encodePacked(objectType),
            hex"0000000100016201",
            abi.encodePacked(objectType),
            hex"010000000000000000"
        );
        bytes memory group = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        (gh, ss, deps) = d.parse(group);
        require(deps.length == 1 && deps[0] == objectType, "stable deduplicated dependency");
        (strictHash, strictSchemas) = d.strict(group, deps);
        require(
            gh == strictHash && keccak256(abi.encode(ss)) == keccak256(abi.encode(strictSchemas)),
            "strict external equivalent"
        );
        (bool ok,) = address(d).staticcall(abi.encodeCall(d.strict, (group, new bytes32[](0))));
        require(!ok, "omitted dependency rejects");
    }
}

contract StateAcceptanceTest is StateKernelTest {
    uint256 serial = 200;

    function single(bytes32 t, bytes memory body) internal returns (StateKernel.Publication memory) {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = StateKernel.SelectedLeaf(0, t, body);
        return request(a, serial++);
    }

    function cas(StateKernel.Publication memory p, uint16 leaf, uint32 rev) internal pure {
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(leaf, rev);
    }

    function submit(StateKernel.Publication memory p) internal returns (StateKernel.AdmitResult memory) {
        return h.publishTrustedForTest(verified(), p);
    }

    function select(StateKernel.Publication memory p, uint64 mask)
        internal
        pure
        returns (StateKernel.Publication memory q)
    {
        q = abi.decode(abi.encode(p), (StateKernel.Publication));
        q.leafMask = mask;
        uint256 n;
        for (uint256 i; i < p.leaves.length; ++i) {
            if (mask & (uint64(1) << p.leaves[i].leafIndex) != 0) ++n;
        }
        q.leaves = new StateKernel.SelectedLeaf[](n);
        n = 0;
        for (uint256 i; i < p.leaves.length; ++i) {
            if (mask & (uint64(1) << p.leaves[i].leafIndex) != 0) q.leaves[n++] = p.leaves[i];
        }
    }

    function touched(StateKernel.Publication memory p) internal view returns (bytes32 b) {
        b = keccak256(abi.encode(snapshot(), h.envelope(p.envelopeId)));
        for (uint256 i; i < p.leaves.length; ++i) {
            b = keccak256(
                abi.encode(
                    b,
                    h.record(p.recordIds[p.leaves[i].leafIndex]),
                    h.typeRow(p.leaves[i].typeId),
                    h.occurrence(p.envelopeId, p.leaves[i].leafIndex)
                )
            );
        }
    }

    function reject(StateKernel.Publication memory p, bytes memory expected) internal {
        bytes32 beforeState = touched(p);
        VmAcceptance(address(vm)).record();
        (bool ok, bytes memory actual) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        (, bytes32[] memory writes) = VmAcceptance(address(vm)).accesses(address(h));
        require(!ok && keccak256(actual) == keccak256(expected), "exact rejection");
        // Strategy adaptation: late failure may attempt writes, all of which
        // must roll back. Early guards still reject before any Core SSTORE.
        bytes4 selector = bytes4(expected);
        if (
            selector == StateKernel.E_BOUNDS.selector || selector == StateKernel.InvalidCommitment.selector
                || selector == StateKernel.AUTH_PRINCIPAL_MISMATCH.selector
                || selector == StateKernel.InvalidRevision.selector || selector == StateKernel.E_NO_RESURRECTION.selector
                || selector == StateKernel.U48_GUARD.selector
        ) require(writes.length == 0, "early guard rejects before any Core SSTORE");
        require(beforeState == touched(p), "all observable state and attempted points unchanged");
    }

    function obj() internal returns (bytes32 id) {
        StateKernel.Publication memory p = single(objectType, objectLeaf(0).body);
        submit(p);
        return p.recordIds[0];
    }

    function predecessor(bytes32 env, uint16 leaf) internal pure returns (bytes memory) {
        if (env == 0) return hex"00";
        return abi.encodePacked(hex"01", env, leaf);
    }

    function setBody(bytes32 subject, bytes32 target, bytes32 prev, uint16 leaf) internal pure returns (bytes memory) {
        return abi.encodePacked(
            bytes32(uint256(1)), subject, bytes32(uint256(2)), hex"01", target, hex"00", predecessor(prev, leaf)
        );
    }

    function tombBody(bytes32 subject, bytes32 prev, uint16 leaf) internal pure returns (bytes memory) {
        return abi.encodePacked(bytes32(uint256(1)), subject, bytes32(uint256(2)), predecessor(prev, leaf));
    }

    function key(bytes32 author, bytes32 subject) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("efs2/binding/1"),
                author,
                keccak256(abi.encode(keccak256("efs2/position/1"), bytes32(uint256(1)), subject, bytes32(uint256(2))))
            )
        );
    }

    function history(bytes32 k) internal pure returns (bytes32) {
        return pk(0, 8, k);
    }

    function scope(bytes32 author, bytes32 subject) internal pure returns (bytes32) {
        return
            pk(0, 10, keccak256(abi.encode(keccak256("efs2/vk/binding-scope/1"), author, bytes32(uint256(1)), subject)));
    }

    function assertHead(
        bytes32 k,
        uint8 state,
        uint32 rev,
        uint64 ord,
        uint8 kind,
        uint8 cause,
        bytes32 target,
        uint16 leaf
    ) internal view {
        StateStore.BindingRow memory b = h.binding(k);
        require(
            b.meta
                == uint256(state) | (uint256(rev) << 8) | (uint256(ord) << 40) | (uint256(kind) << 88)
                    | (uint256(cause) << 96) | (uint256(leaf) << 104),
            "exact Binding packed word"
        );
        require(b.target == target, "exact full target");
    }

    function withdraw(bytes32 env, uint16 leaf) internal returns (StateKernel.Publication memory p) {
        p = single(h.bootstrap().withdrawalType, abi.encodePacked(env, leaf));
        submit(p);
    }

    function schema(uint16 fieldsCount, bytes memory fields, bytes memory roles, bytes memory indexes)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory s = bytes.concat(
            hex"0001000154000000", bytes32(0), bytes2(fieldsCount), fields, roles, indexes, hex"00000000"
        );
        return bytes.concat(hex"0001", bytes2(uint16(s.length)), s);
    }

    function role(uint8 index, uint8 cls, bytes32 expected, uint8 field) internal pure returns (bytes memory) {
        return abi.encodePacked(index, hex"0001", bytes1(uint8(65 + index)), cls, expected, field, hex"0000");
    }

    function schemaLeaf(uint16 i, bytes memory raw) internal view returns (StateKernel.SelectedLeaf memory) {
        return StateKernel.SelectedLeaf(i, meta, abi.encodePacked(uint16(raw.length), raw));
    }

    function typeOf(bytes memory raw) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(raw))),
                uint256(0)
            )
        );
    }

    function installSchema(bytes memory raw) internal returns (bytes32 t) {
        t = typeOf(raw);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = schemaLeaf(0, raw);
        submit(request(a, serial++));
    }

    function testOnlyExactKernelDispatchAndUnknownType() public {
        install();
        bytes32 target = obj();
        bytes memory raw = abi.decode(abi.encode(groups[1]), (bytes));
        // Retain BindingSet's exact name and field shape; alter only meaning
        // metadata so this ordinary group has distinct identity.
        uint256 nameLength = (uint256(uint8(raw[6])) << 8) | uint8(raw[7]);
        raw[10 + nameLength] = bytes1("X");
        bytes32 ordinary = installSchema(raw);
        submit(single(ordinary, setBody(target, target, 0, 0)));
        require(
            h.counts().bindingKeys == 0 && h.binding(key(AUTHOR, target)).meta == 0,
            "same name and shape remain ordinary"
        );
        reject(
            single(bytes32(uint256(65536)), hex""),
            abi.encodeWithSelector(StateKernel.E_UNKNOWN_TYPE.selector, uint16(0))
        );
    }

    function testBindingTargetExclusivityAndExternalOccurrencePacking() public {
        install();
        bytes32 target = obj();
        bytes memory prefix = abi.encodePacked(bytes32(uint256(1)), target, bytes32(uint256(2)));
        StateKernel.Publication memory p = single(setType, bytes.concat(prefix, hex"000000"));
        cas(p, 0, 0);
        reject(p, abi.encodeWithSelector(RecordBody.InvalidBody.selector, uint16(17)));
        StateKernel.SelectedLeaf[] memory externalLeaves = new StateKernel.SelectedLeaf[](2);
        externalLeaves[0] = objectLeaf(0);
        externalLeaves[1] = objectLeaf(1);
        StateKernel.Publication memory externalP = request(externalLeaves, serial++);
        submit(externalP);
        p = single(
            setType,
            bytes.concat(prefix, abi.encodePacked(hex"01", target, hex"01", externalP.envelopeId, uint16(0), hex"00"))
        );
        cas(p, 0, 0);
        reject(p, abi.encodeWithSelector(RecordBody.InvalidBody.selector, uint16(17)));
        p = single(setType, bytes.concat(prefix, abi.encodePacked(hex"0001", externalP.envelopeId, uint16(1), hex"00")));
        cas(p, 0, 0);
        StateKernel.AdmitResult memory r = submit(p);
        assertHead(key(AUTHOR, target), 1, 1, r.leaves[0].admissionOrdinal, 2, 0, externalP.envelopeId, 1);
    }

    function testSelectedRecordVisibilityAndObjectClass() public {
        install();
        bytes memory raw = schema(1, hex"00016107", bytes.concat(hex"0001", role(0, 1, 0, 0)), hex"0000");
        bytes32 t = installSchema(raw);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = objectLeaf(0);
        a[1] = StateKernel.SelectedLeaf(1, t, abi.encodePacked(rid(objectType, a[0].body)));
        StateKernel.Publication memory p = request(a, serial++);
        reject(select(p, 2), abi.encodeWithSelector(StateKernel.ReferenceUnproved.selector, uint16(1), uint8(0)));
        submit(p);
        a[1] = objectLeaf(1);
        a[1].body = abi.encodePacked(AUTHOR, bytes32(uint256(3)), hex"00");
        a[0] = StateKernel.SelectedLeaf(0, t, abi.encodePacked(rid(objectType, a[1].body)));
        reject(
            request(a, serial++), abi.encodeWithSelector(StateKernel.ReferenceUnproved.selector, uint16(0), uint8(0))
        );
        raw = schema(1, hex"00016107", bytes.concat(hex"0001", role(0, 5, 0, 0)), hex"0000");
        bytes32 objectRef = installSchema(raw);
        // A meta-Type group Record is not an Object even when expected Type is ANY.
        bytes32 nonObject = h.recordIdAt(1);
        reject(
            single(objectRef, abi.encodePacked(nonObject)),
            abi.encodeWithSelector(StateKernel.E_REF_UNSATISFIED.selector, uint16(0), uint8(0))
        );
        submit(single(objectRef, abi.encodePacked(p.recordIds[0])));
    }

    function testExternalOccurrenceMembershipIndependentOfLifecycle() public {
        install();
        bytes memory raw = schema(1, hex"00016108", bytes.concat(hex"0001", role(0, 4, 0, 0)), hex"0000");
        bytes32 t = installSchema(raw);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = objectLeaf(0);
        a[1] = objectLeaf(1);
        StateKernel.Publication memory p = request(a, serial++);
        submit(select(p, 1));
        require(h.occurrence(p.envelopeId, 1).packed == 0, "retained unadmitted leaf");
        submit(single(t, abi.encodePacked(p.envelopeId, uint16(1))));
        withdraw(p.envelopeId, 0);
        require(uint8(h.occurrence(p.envelopeId, 0).packed) == 2, "withdrawn leaf");
        submit(single(t, abi.encodePacked(p.envelopeId, uint16(0))));
        reject(
            single(t, abi.encodePacked(p.envelopeId, uint16(2))),
            abi.encodeWithSelector(StateKernel.E_REF_UNSATISFIED.selector, uint16(0), uint8(0))
        );
        reject(
            single(t, abi.encodePacked(bytes32(uint256(65536)), uint16(0))),
            abi.encodeWithSelector(StateKernel.ReferenceUnproved.selector, uint16(0), uint8(0))
        );
        reject(
            single(h.bootstrap().withdrawalType, abi.encodePacked(p.envelopeId, uint16(1))),
            abi.encodeWithSelector(StateKernel.E_TARGET_EVIDENCE.selector, uint16(0))
        );
    }

    function testFullWidthPrincipalIsolationAndAuthorityMismatch() public {
        install();
        bytes32 target = obj();
        bytes32 other = bytes32(uint256(AUTHOR) ^ (uint256(1) << 200));
        StateKernel.Publication memory p = single(setType, setBody(target, target, 0, 0));
        cas(p, 0, 0);
        StateKernel.AdmitResult memory first = submit(p);
        p = single(setType, setBody(target, target, 0, 0));
        p.header.principalId = other;
        identify(p);
        cas(p, 0, 0);
        reject(p, abi.encodeWithSelector(StateKernel.AUTH_PRINCIPAL_MISMATCH.selector, other, AUTHOR));
        StateKernel.VerifiedContext memory v = verified();
        v.authenticatedPrincipal = other;
        v.authorityBasis = type(uint256).max;
        v.authorityCodehash = bytes32(type(uint256).max);
        StateKernel.AdmitResult memory second = h.publishTrustedForTest(v, p);
        assertHead(key(AUTHOR, target), 1, 1, first.leaves[0].admissionOrdinal, 1, 0, target, 0);
        assertHead(key(other, target), 1, 1, second.leaves[0].admissionOrdinal, 1, 0, target, 0);
        require(
            key(AUTHOR, target) != key(other, target) && h.counts().bindingKeys == 2, "full Principal key separation"
        );
        StateStore.BatchRow memory batch = h.batchAt(second.acceptingBatchId);
        require(
            batch.authorityBasis == type(uint256).max && batch.authorityCodehash == bytes32(type(uint256).max),
            "full retained authority words"
        );
    }

    function testExactCasCarriageAndStaleValuesRollback() public {
        install();
        bytes32 target = obj();
        StateKernel.Publication memory p = single(setType, setBody(target, target, 0, 0));
        reject(p, abi.encodeWithSelector(StateKernel.InvalidCasCarriage.selector));
        cas(p, 0, 1);
        reject(
            p, abi.encodeWithSelector(BindingFold.ErrCasRevision.selector, key(AUTHOR, target), uint32(1), uint32(0))
        );
        StateKernel.Publication memory badFirst = single(setType, setBody(target, target, h.envelopeIdAt(1), 0));
        cas(badFirst, 0, 0);
        reject(
            badFirst,
            abi.encodeWithSelector(
                BindingFold.ErrCasPredecessor.selector, key(AUTHOR, target), bytes32(0), uint16(0), uint64(0), uint32(0)
            )
        );
        cas(p, 0, 0);
        StateKernel.Publication memory first = p;
        StateKernel.AdmitResult memory r = submit(p);
        p = single(setType, setBody(target, target, 0, 0));
        cas(p, 0, 1);
        reject(
            p,
            abi.encodeWithSelector(
                BindingFold.ErrCasPredecessor.selector,
                key(AUTHOR, target),
                first.envelopeId,
                uint16(0),
                r.leaves[0].admissionOrdinal,
                uint32(1)
            )
        );
        p = single(setType, setBody(target, target, first.envelopeId, 0));
        cas(p, 0, 0);
        reject(
            p, abi.encodeWithSelector(BindingFold.ErrCasRevision.selector, key(AUTHOR, target), uint32(0), uint32(1))
        );
        cas(p, 0, 1);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](2);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 1);
        p.expectedRevisions[1] = StateKernel.ExpectedRevision(0, 1);
        reject(p, abi.encodeWithSelector(StateKernel.InvalidCasCarriage.selector));
        p = single(objectType, objectLeaf(0).body);
        cas(p, 0, 0);
        reject(p, abi.encodeWithSelector(StateKernel.InvalidCasCarriage.selector));
    }

    function testTwoSameKeyFreshMutationsObserveShadowAndRollback() public {
        install();
        bytes32 target = obj();
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = StateKernel.SelectedLeaf(0, setType, setBody(target, target, 0, 0));
        a[1] = StateKernel.SelectedLeaf(1, setType, a[0].body);
        StateKernel.Publication memory p = request(a, serial++);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](2);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 0);
        p.expectedRevisions[1] = StateKernel.ExpectedRevision(1, 0);
        reject(
            p,
            abi.encodeWithSelector(
                BindingFold.ErrCasPredecessor.selector,
                key(AUTHOR, target),
                p.envelopeId,
                uint16(0),
                uint64(4),
                uint32(1)
            )
        );
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        p.expectedRevisions[1] = StateKernel.ExpectedRevision(0, 0);
        reject(p, abi.encodeWithSelector(StateKernel.InvalidCasCarriage.selector));
        StateKernel.Publication memory prior = single(setType, setBody(target, target, 0, 0));
        cas(prior, 0, 0);
        submit(prior);
        a[0].body = setBody(target, target, prior.envelopeId, 0);
        a[1].body = a[0].body;
        p = request(a, serial++);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](2);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 1);
        p.expectedRevisions[1] = StateKernel.ExpectedRevision(1, 1);
        reject(
            p,
            abi.encodeWithSelector(
                BindingFold.ErrCasPredecessor.selector,
                key(AUTHOR, target),
                p.envelopeId,
                uint16(0),
                uint64(5),
                uint32(2)
            )
        );
    }

    function eventMatches(StateKernel.AdmitResult memory r) internal {
        VmAcceptance.Log[] memory logs = VmAcceptance(address(vm)).getRecordedLogs();
        require(
            logs.length == 1 && logs[0].emitter == address(h) && logs[0].topics.length == 2,
            "one host correlation event"
        );
        require(
            logs[0].topics[0] == keccak256("TrustedHostAdmissionResult(bytes32,uint64,uint64,(uint16,uint8,uint64)[])")
                && logs[0].topics[1] == r.envelopeId,
            "exact event topics"
        );
        require(
            keccak256(logs[0].data) == keccak256(abi.encode(r.envelopeOrdinal, r.acceptingBatchId, r.leaves)),
            "exact event returned result"
        );
    }

    function testMixedAndAllActiveRetryEventsAndNoWrites() public {
        install();
        bytes32 target = obj();
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = StateKernel.SelectedLeaf(0, setType, setBody(target, target, 0, 0));
        a[1] = objectLeaf(1);
        StateKernel.Publication memory p = request(a, serial++);
        cas(p, 0, 0);
        VmAcceptance(address(vm)).recordLogs();
        StateKernel.AdmitResult memory r = submit(select(p, 1));
        eventMatches(r);
        uint64 first = r.leaves[0].admissionOrdinal;
        cas(p, 0, 99);
        VmAcceptance(address(vm)).recordLogs();
        r = submit(p);
        eventMatches(r);
        require(
            r.leaves[0].outcome == 2 && r.leaves[0].admissionOrdinal == first && r.leaves[1].outcome == 1
                && r.leaves[1].admissionOrdinal == first + 1,
            "mixed exact reused/fresh receipts"
        );
        assertHead(key(AUTHOR, target), 1, 1, first, 1, 0, target, 0);
        bytes32 beforeState = snapshot();
        p.expectedRevisions = new StateKernel.ExpectedRevision[](0);
        VmAcceptance(address(vm)).record();
        VmAcceptance(address(vm)).recordLogs();
        r = submit(p);
        eventMatches(r);
        (, bytes32[] memory writes) = VmAcceptance(address(vm)).accesses(address(h));
        require(writes.length == 0, "all-ACTIVE performs no SSTORE");
        require(
            beforeState == snapshot() && r.acceptingBatchId == 0 && r.leaves[0].outcome == 2
                && r.leaves[1].outcome == 2,
            "all-ACTIVE state and receipts"
        );
        withdraw(p.envelopeId, 0);
        reject(p, abi.encodeWithSelector(StateKernel.E_NO_RESURRECTION.selector, p.envelopeId, uint16(0)));
    }

    function testTombstoneRebindRetombstoneHistoryAndSingleScope() public {
        install();
        bytes32 target = obj();
        bytes32 t = h.bootstrap().bindingTombstoneType;
        bytes32 k = key(AUTHOR, target);
        StateKernel.Publication memory p = single(t, tombBody(target, 0, 0));
        cas(p, 0, 0);
        StateKernel.AdmitResult memory r = submit(p);
        uint64 first = r.leaves[0].admissionOrdinal;
        assertHead(k, 2, 1, first, 0, 1, 0, 0);
        for (uint32 rev = 2; rev <= 4; ++rev) {
            StateKernel.Publication memory nextP = single(
                rev == 2 ? setType : t,
                rev == 2 ? setBody(target, target, p.envelopeId, 0) : tombBody(target, p.envelopeId, 0)
            );
            cas(nextP, 0, rev - 1);
            r = submit(nextP);
            p = nextP;
            assertHead(
                k,
                rev == 2 ? 1 : 2,
                rev,
                first + rev - 1,
                rev == 2 ? 1 : 0,
                rev == 2 ? 0 : 1,
                rev == 2 ? target : bytes32(0),
                0
            );
        }
        require(
            h.postingHead(history(k)) == 4 | (uint256(4) << 64) | (uint256(first + 3) << 128) | (uint256(1) << 176),
            "RAW history exact append-only head"
        );
        require(
            h.postingWord(history(k), 0)
                == uint256(first) | (uint256(first + 1) << 48) | (uint256(first + 2) << 96)
                    | (uint256(first + 3) << 144),
            "four chronological history lanes"
        );
        require(
            h.postingHead(scope(AUTHOR, target))
                == 1 | (uint256(1) << 64) | (uint256(first) << 128) | (uint256(1) << 176),
            "first tombstone anchors scope once"
        );
    }

    function testWithdrawCurrentOlderTombstoneAndSiblingTargets() public {
        install();
        bytes32 target = obj();
        bytes32 k = key(AUTHOR, target);
        StateKernel.Publication memory first = single(setType, setBody(target, target, 0, 0));
        cas(first, 0, 0);
        submit(first);
        StateKernel.Publication memory second = single(setType, setBody(target, target, first.envelopeId, 0));
        cas(second, 0, 1);
        submit(second);
        withdraw(first.envelopeId, 0);
        assertHead(k, 1, 2, 5, 1, 0, target, 0);
        StateKernel.Publication memory w = withdraw(second.envelopeId, 0);
        assertHead(k, 2, 3, 7, 0, 2, 0, 0);
        reject(
            single(h.bootstrap().withdrawalType, abi.encodePacked(w.envelopeId, uint16(0))),
            abi.encodeWithSelector(StateKernel.E_TARGET_EVIDENCE.selector, uint16(0))
        );
        StateKernel.Publication memory tomb =
            single(h.bootstrap().bindingTombstoneType, tombBody(target, w.envelopeId, 0));
        cas(tomb, 0, 3);
        submit(tomb);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = StateKernel.SelectedLeaf(0, h.bootstrap().withdrawalType, abi.encodePacked(tomb.envelopeId, uint16(0)));
        a[1] = StateKernel.SelectedLeaf(1, a[0].typeId, a[0].body);
        StateKernel.AdmitResult memory r = submit(request(a, serial++));
        require(
            r.leaves[0].admissionOrdinal == 9 && r.leaves[1].admissionOrdinal == 10,
            "two withdrawal evidence admissions"
        );
        assertHead(k, 2, 5, 9, 0, 2, 0, 0);
        require(
            h.occurrence(tomb.envelopeId, 0).packed == 2 | (uint256(8) << 8) | (uint256(9) << 56),
            "one terminal transition"
        );
        require(uint64(h.postingHead(pk(0, 3, tomb.recordIds[0])) >> 64) == 0, "one target decrement");
        require(
            uint64(h.postingHead(history(k))) == 5 && uint64(h.postingHead(scope(AUTHOR, target))) == 1,
            "audit history and scope retained"
        );
        require(
            uint64(h.postingHead(history(k)) >> 64) == 5 && uint16(h.postingHead(history(k)) >> 176) == 1,
            "RAW history never loses live count or audit flag"
        );
        require(
            h.postingHead(scope(AUTHOR, target)) == 1 | (uint256(1) << 64) | (uint256(4) << 128) | (uint256(1) << 176),
            "first-bind scope remains exact after lifecycle pressure"
        );
    }

    function testDeduplicatedReferenceValueIndexesAndLastLiveCrossing() public {
        install();
        bytes32 target = obj();
        bytes memory raw = schema(
            3, hex"0001610b0003000007000162010001630a", bytes.concat(hex"0001", role(0, 1, 0, 0)), hex"0003020001010302"
        );
        bytes32 t = installSchema(raw);
        bytes32 digestBytes = bytes32(uint256(123));
        bytes memory body = abi.encodePacked(uint16(3), target, target, target, hex"0100120020", digestBytes);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = StateKernel.SelectedLeaf(0, t, body);
        a[1] = StateKernel.SelectedLeaf(1, t, body);
        StateKernel.Publication memory p = request(a, serial++);
        StateKernel.AdmitResult memory r = submit(p);
        uint64 first = r.leaves[0].admissionOrdinal;
        bytes32[] memory keys = new bytes32[](6);
        keys[0] = pk(0, 3, p.recordIds[0]);
        keys[1] = pk(t, 1, 0);
        keys[2] = pk(0, 5, target);
        keys[3] = keccak256(abi.encode(keccak256("efs2/pk/1"), t, uint256(6), uint256(0), target));
        keys[4] = keccak256(
            abi.encode(
                keccak256("efs2/pk/1"),
                t,
                uint256(7),
                uint256(1),
                keccak256(abi.encode(keccak256("efs2/vk/scalar/1"), keccak256(hex"01")))
            )
        );
        keys[5] = pk(
            0,
            9,
            keccak256(abi.encode(keccak256("efs2/vk/digest/1"), uint256(18), keccak256(abi.encodePacked(digestBytes))))
        );
        for (uint256 i; i < keys.length; ++i) {
            require(
                h.postingHead(keys[i]) == 2 | (uint256(2) << 64) | (uint256(first + 1) << 128), "dedup once per source"
            );
            require(h.postingWord(keys[i], 0) == uint256(first) | (uint256(first + 1) << 48), "two source lanes only");
        }
        bytes32 unique = pk(t, 2, 0);
        require(
            uint64(h.postingHead(unique)) == 1 && uint64(h.postingHead(unique) >> 64) == 1, "one unique live Record"
        );
        withdraw(p.envelopeId, 0);
        for (uint256 i; i < keys.length; ++i) {
            require(uint64(h.postingHead(keys[i]) >> 64) == 1, "decrement distinct keys once");
        }
        require(uint64(h.postingHead(unique) >> 64) == 1, "not last live yet");
        withdraw(p.envelopeId, 1);
        for (uint256 i; i < keys.length; ++i) {
            require(uint64(h.postingHead(keys[i]) >> 64) == 0, "last occurrence dead");
        }
        require(
            uint64(h.postingHead(unique) >> 64) == 0 && uint64(h.postingHead(unique)) == 1,
            "unique zero-crossing keeps append history"
        );
        submit(single(t, body));
        require(
            uint64(h.postingHead(unique) >> 64) == 1 && uint64(h.postingHead(unique)) == 1,
            "new occurrence revives Record count without duplicate unique lane"
        );
        require(h.postingWord(unique, 0) == first, "original immutable unique anchor retained");
    }

    function testDependencyOrderEquivalenceAndMissingVisibilityRollback() public {
        bytes memory aRaw = schema(1, hex"00016101", hex"0000", hex"0000");
        bytes32 dep = typeOf(aRaw);
        bytes memory bRaw = schema(1, hex"00016207", bytes.concat(hex"0001", role(0, 1, dep, 0)), hex"0000");
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = schemaLeaf(0, aRaw);
        a[1] = schemaLeaf(1, bRaw);
        StateKernel.Publication memory p = request(a, serial++);
        reject(select(p, 2), abi.encodeWithSelector(StateKernel.MissingTypeDependency.selector, dep));
        a[0] = schemaLeaf(0, bRaw);
        a[1] = schemaLeaf(1, aRaw);
        reject(request(a, serial++), abi.encodeWithSelector(StateKernel.MissingTypeDependency.selector, dep));
        require(
            h.typeRow(typeOf(bRaw)).typeOrdinal == 0 && h.typeRow(dep).typeOrdinal == 0,
            "no cache visible on failed dependency"
        );
        submit(p);
        require(
            h.typeRow(dep).typeOrdinal == 2 && h.typeRow(typeOf(bRaw)).typeOrdinal == 3,
            "earlier staged dependency visible"
        );
        bytes32 x = bytes32(uint256(65536));
        bytes32 y = bytes32(uint256(65537));
        bytes memory raw = schema(
            3,
            hex"000161070001620700016307",
            bytes.concat(hex"0003", role(0, 1, x, 0), role(1, 1, y, 1), role(2, 1, x, 2)),
            hex"0000"
        );
        DependencyHarness parser = new DependencyHarness();
        (bytes32 gh, TypeGroupParser.SchemaCache[] memory schemas, bytes32[] memory deps) = parser.parse(raw);
        require(deps.length == 2 && deps[0] == x && deps[1] == y, "stable repeated external dependency dedup");
        (bytes32 strictHash, TypeGroupParser.SchemaCache[] memory strict) = parser.strict(raw, deps);
        require(
            gh == strictHash && keccak256(abi.encode(schemas)) == keccak256(abi.encode(strict)),
            "strict interface exact equivalence"
        );
        deps = new bytes32[](1);
        deps[0] = x;
        (bool ok, bytes memory err) = address(parser).staticcall(abi.encodeCall(parser.strict, (raw, deps)));
        require(
            !ok && keccak256(err) == keccak256(abi.encodeWithSelector(TypeGroupParser.InvalidSchema.selector)),
            "omission rejects"
        );
        for (uint256 sentinel = 0; sentinel < 5; ++sentinel) {
            uint256 v = sentinel == 0 ? 0 : sentinel == 1 ? 1 : sentinel == 2 ? 2 : sentinel == 3 ? 256 : 272;
            raw = schema(1, hex"00016107", bytes.concat(hex"0001", role(0, 1, bytes32(v), 0)), hex"0000");
            (ok, err) = address(parser).staticcall(abi.encodeCall(parser.parse, (raw)));
            if (v < 2) {
                require(ok, "ANY SELF allowed");
                (,, deps) = abi.decode(err, (bytes32, TypeGroupParser.SchemaCache[], bytes32[]));
                require(deps.length == 0, "sentinel no external dependency");
            } else {
                require(
                    !ok && keccak256(err) == keccak256(abi.encodeWithSelector(TypeGroupParser.InvalidSchema.selector)),
                    "reserved/self-group sentinel rejected"
                );
            }
        }
    }

    function testCarriageBoundsCommitmentsAndRawGetterBounds() public {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = groupLeaf(0, 0);
        a[1] = groupLeaf(1, 1);
        StateKernel.Publication memory p = request(a, serial++);
        p.leafMask = 1;
        reject(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(2)));
        p.leafMask = 7;
        reject(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(1)));
        p = request(a, serial++);
        p.leaves[1].leafIndex = 0;
        rejectCarriage(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(2)));
        p = request(a, serial++);
        p.leaves[0] = a[1];
        p.leaves[1] = a[0];
        rejectCarriage(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(2)));
        p = request(a, serial++);
        p.recordIds[0] = bytes32(uint256(77));
        identify(p);
        reject(p, abi.encodeWithSelector(StateKernel.InvalidCommitment.selector));
        p = request(a, serial++);
        p.envelopeId = bytes32(uint256(77));
        reject(p, abi.encodeWithSelector(StateKernel.InvalidCommitment.selector));
        p = request(a, serial++);
        p.recordIds = new bytes32[](65);
        rejectCarriage(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(1)));
        p = request(a, serial++);
        p.leaves = new StateKernel.SelectedLeaf[](65);
        rejectCarriage(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(1)));
        p = request(a, serial++);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](65);
        reject(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(1)));
        p = single(meta, new bytes(8193));
        reject(p, abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(3)));
        install();
        bytes memory raw = schema(1, hex"000161051ffe", hex"0000", hex"0000");
        bytes32 t = installSchema(raw);
        bytes memory body = abi.encodePacked(uint16(4095), new bytes(4095));
        a = new StateKernel.SelectedLeaf[](2);
        a[0] = StateKernel.SelectedLeaf(0, t, body);
        a[1] = StateKernel.SelectedLeaf(1, t, body);
        // Each body is valid alone; 8194 aggregate canonical bytes reject.
        submit(single(t, body));
        reject(request(a, serial++), abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(3)));
        bytes4[8] memory selectors = [
            h.recordIdAt.selector,
            h.envelopeIdAt.selector,
            h.typeIdAt.selector,
            h.principalIdAt.selector,
            h.admissionAt.selector,
            h.batchAt.selector,
            h.postingKeyAt.selector,
            h.bindingKeyAt.selector
        ];
        for (uint256 i; i < selectors.length; ++i) {
            for (uint256 j; j < 2; ++j) {
                (bool ok, bytes memory err) =
                    address(h).staticcall(abi.encodeWithSelector(selectors[i], j == 0 ? uint64(0) : type(uint64).max));
                require(
                    !ok
                        && keccak256(err)
                            == keccak256(abi.encodeWithSelector(StatefulHarness.InventoryBounds.selector)),
                    "bounded inventory ordinal"
                );
            }
        }
        (bool wordOk, bytes memory wordErr) =
            address(h).staticcall(abi.encodeCall(h.postingWord, (bytes32(uint256(65536)), uint64(0))));
        require(
            !wordOk
                && keccak256(wordErr) == keccak256(abi.encodeWithSelector(StatefulHarness.InventoryBounds.selector)),
            "absent posting has no word"
        );
    }

    function rejectCarriage(StateKernel.Publication memory p, bytes memory expected) internal {
        bytes32 beforeState = snapshot();
        VmAcceptance(address(vm)).record();
        (bool ok, bytes memory err) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        (, bytes32[] memory writes) = VmAcceptance(address(vm)).accesses(address(h));
        require(writes.length == 0, "carriage rejects before Core SSTORE");
        require(!ok && keccak256(err) == keccak256(expected), "exact carriage rejection");
        require(beforeState == snapshot(), "carriage rollback");
    }
    event log_named_uint(string key, uint256 value);

    function testMixedRetryAllocationScalesWithFreshLeaves() public {
        bytes32 t = installSchema(schema(1, hex"00016101", hex"0000", hex"0000"));
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](64);
        for (uint16 i; i < 64; ++i) {
            a[i] = StateKernel.SelectedLeaf(i, t, hex"00");
        }
        StateKernel.Publication memory p = request(a, serial++);
        for (uint256 start; start < 63; start += 7) {
            submit(select(p, uint64(uint256(127) << start)));
        }
        uint256 checkpoint = VmAcceptance(address(vm)).snapshotState();
        StateKernel.Publication memory q = select(p, uint64(1) << 63);
        uint256 gasBefore = gasleft();
        StateKernel.AdmitResult memory fresh = submit(q);
        uint256 oneGas = gasBefore - gasleft();
        bytes32 finalState = snapshot();
        require(VmAcceptance(address(vm)).revertToState(checkpoint), "restore equivalent initial state");
        gasBefore = gasleft();
        StateKernel.AdmitResult memory mixed = submit(p);
        uint256 mixedGas = gasBefore - gasleft();
        require(
            finalState == snapshot() && fresh.acceptingBatchId == mixed.acceptingBatchId
                && mixed.leaves[63].admissionOrdinal == fresh.leaves[0].admissionOrdinal,
            "same fresh effects and complete state"
        );
        gasBefore = gasleft();
        submit(p);
        uint256 activeGas = gasBefore - gasleft();
        emit log_named_uint("final-only publication gas", oneGas);
        emit log_named_uint("63 ACTIVE plus one fresh gas", mixedGas);
        emit log_named_uint("64 all-ACTIVE gas", activeGas);
        require(mixedGas < oneGas + 5000000, "mixed retry allocates journal for fresh leaves, not ACTIVE inventory");
    }

    function testSyntheticOrdinalRevisionAndPreWithdrawnGuards() public {
        StateStore.Bootstrap memory b = h.bootstrap();
        SyntheticStatefulHarness synthetic = new SyntheticStatefulHarness(
            StateKernel.Init(b.realmId, b.initialRevisionId, b.intrinsicGroupBytes, groups[0], groups[1]),
            h.preparationHelper(),
            h.preparationCodehash(),
            address(AdmissionLibrary).codehash
        );
        h = synthetic;
        install();
        bytes32 target = obj();
        StateKernel.Publication memory p = single(setType, setBody(target, target, 0, 0));
        cas(p, 0, 0);
        submit(p);
        StateKernel.Publication memory nextP = single(setType, setBody(target, target, p.envelopeId, 0));
        cas(nextP, 0, type(uint32).max - 1);
        synthetic.seedRevisionForTest(key(AUTHOR, target), type(uint32).max - 1);
        reject(nextP, abi.encodeWithSelector(BindingFold.ErrRevisionGuard.selector, key(AUTHOR, target)));
        StateKernel.Publication memory freshP = single(objectType, objectLeaf(0).body);
        synthetic.seedPreWithdrawnForTest(freshP.envelopeId, 0);
        reject(freshP, abi.encodeWithSelector(StateKernel.E_NO_RESURRECTION.selector, freshP.envelopeId, uint16(0)));
        freshP = single(objectType, objectLeaf(0).body);
        uint64 realCount = h.counts().admissions;
        bytes32 beforeState = snapshot();
        synthetic.seedAdmissionCountForTest((uint64(1) << 48) - 2);
        // The fake high counter is not an enumerable real inventory. Assert no
        // writes at that prestate, then restore ONLY the synthetic counter.
        VmAcceptance(address(vm)).record();
        (bool ok, bytes memory err) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), freshP)));
        (, bytes32[] memory writes) = VmAcceptance(address(vm)).accesses(address(h));
        require(
            !ok && keccak256(err) == keccak256(abi.encodeWithSelector(StateKernel.U48_GUARD.selector))
                && writes.length == 0,
            "reserved ordinal never allocated"
        );
        require(h.counts().admissions == (uint64(1) << 48) - 2, "synthetic counter unchanged");
        synthetic.seedAdmissionCountForTest(realCount);
        require(beforeState == snapshot(), "every real row unchanged after ordinal refusal");
        VmAcceptance(address(vm)).roll((uint256(1) << 48) - 1);
        reject(freshP, abi.encodeWithSelector(StateKernel.U48_GUARD.selector));
    }

    function testUnsupportedValidReferenceClassesAndAdditionalObjectType() public {
        install();
        bytes32 target = obj();
        for (uint8 cls = 2; cls <= 3; ++cls) {
            bytes32 t = installSchema(schema(1, hex"00016107", bytes.concat(hex"0001", role(0, cls, 0, 0)), hex"0000"));
            reject(
                single(t, abi.encodePacked(target)),
                abi.encodeWithSelector(StateKernel.ReferenceClassUnsupported.selector, uint16(0), uint8(0), cls)
            );
        }
        bytes32 objectRefType =
            installSchema(schema(1, hex"00016107", bytes.concat(hex"0001", role(0, 5, meta, 0)), hex"0000"));
        reject(
            single(objectRefType, abi.encodePacked(target)),
            abi.encodeWithSelector(StateKernel.E_REF_UNSATISFIED.selector, uint16(0), uint8(0))
        );
    }

    function testEarlierSelectedKernelGroupActivatesLaterEffect() public {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = groupLeaf(0, 0);
        submit(request(a, serial++));
        bytes32 target = obj();
        require(h.bootstrap().bindingSetType == 0, "kernel group not active yet");
        a = new StateKernel.SelectedLeaf[](2);
        a[0] = groupLeaf(0, 1);
        a[1] = StateKernel.SelectedLeaf(1, setType, setBody(target, target, 0, 0));
        StateKernel.Publication memory p = request(a, serial++);
        cas(p, 1, 0);
        StateKernel.AdmitResult memory r = submit(p);
        require(
            h.bootstrap().bindingSetType == setType && r.leaves[0].admissionOrdinal == 3
                && r.leaves[1].admissionOrdinal == 4,
            "earlier group activation in current shadow"
        );
        assertHead(key(AUTHOR, target), 1, 1, 4, 1, 0, target, 0);
    }

    function testWrongAuthorWithdrawalAndInvalidLastRollback() public {
        install();
        StateKernel.Publication memory targetP = single(objectType, objectLeaf(0).body);
        targetP.header.principalId = bytes32(uint256(65536));
        identify(targetP);
        StateKernel.VerifiedContext memory v = verified();
        v.authenticatedPrincipal = targetP.header.principalId;
        h.publishTrustedForTest(v, targetP);
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = objectLeaf(0);
        a[1] =
            StateKernel.SelectedLeaf(1, h.bootstrap().withdrawalType, abi.encodePacked(targetP.envelopeId, uint16(0)));
        reject(
            request(a, serial++),
            abi.encodeWithSelector(
                StateKernel.ErrWithdrawNotAuthor.selector,
                targetP.envelopeId,
                uint16(0),
                AUTHOR,
                targetP.header.principalId
            )
        );
        bytes32 target = targetP.recordIds[0];
        a[1] = StateKernel.SelectedLeaf(1, setType, setBody(target, target, 0, 0));
        StateKernel.Publication memory p = request(a, serial++);
        cas(p, 1, 9);
        reject(
            p, abi.encodeWithSelector(BindingFold.ErrCasRevision.selector, key(AUTHOR, target), uint32(9), uint32(0))
        );
    }
}
