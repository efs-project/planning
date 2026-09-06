// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {BindingFold} from "../src/BindingFold.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {StateBindingReads} from "../src/StateBindingReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {BindingReadHarness} from "./BindingReadHarness.sol";

interface VmBindingReads {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
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

    function deployHost() private returns (BindingReadHarness h, bytes32 metaId) {
        bytes memory blob = intrinsicBlob();
        bytes memory intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        PreparationHelper helper = new PreparationHelper();
        StateKernel.Init memory init =
            StateKernel.Init(REALM, REVISION, intrinsic, candidateGroup(0), candidateGroup(1));
        h = new BindingReadHarness(init, address(helper), address(helper).codehash, address(AdmissionLibrary).codehash);
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

    function publish(BindingReadHarness h, StateKernel.Publication memory p)
        private
        returns (StateKernel.AdmitResult memory)
    {
        return h.publishTrustedForTest(StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p);
    }

    function installGroup(BindingReadHarness h, bytes32 metaId, uint256 groupIndex, uint256 nonce) private {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        bytes memory group = candidateGroup(groupIndex);
        leaves[0] = StateKernel.SelectedLeaf(0, metaId, abi.encodePacked(uint16(group.length), group));
        publish(h, publication(leaves, nonce));
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
}
