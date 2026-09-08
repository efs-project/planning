// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateKernel} from "C0Core/StateKernel.sol";

interface FixtureVm {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
    function load(address, bytes32) external view returns (bytes32);
    function store(address, bytes32, bytes32) external;
    function prank(address) external;
    function warp(uint256) external;
    function getCode(string calldata) external view returns (bytes memory);
}

abstract contract FixtureInputs {
    FixtureVm constant vm = FixtureVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes32 constant AUTHOR = bytes32(type(uint256).max);
    bytes[2] groups;
    bytes32 meta;
    bytes32 objectType;
    bytes32 setType;
    bytes32 treeType;
    StateKernel.Init init;

    function loadInputs() internal {
        string memory j = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        for (uint256 g; g < 2; ++g) {
            groups[g] = vm.parseBytes(
                string.concat("0x", vm.parseJsonString(j, string.concat(".groups[", vm.toString(g), "].groupHex")))
            );
        }
        objectType = vm.parseJsonBytes32(j, ".groups[0].members[0].temporaryTypeSchemaId");
        setType = vm.parseJsonBytes32(j, ".groups[1].members[0].temporaryTypeSchemaId");
        treeType = vm.parseJsonBytes32(j, ".groups[0].members[3].temporaryTypeSchemaId");
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
        init = StateKernel.Init(keccak256("test-realm"), keccak256("test-revision"), intrinsic, groups[0], groups[1]);
    }

    function rid(bytes32 t, bytes memory b) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/record/1"), t, keccak256(b)));
    }

    function publication(StateKernel.SelectedLeaf[] memory leaves, uint256 salt)
        internal
        pure
        returns (StateKernel.Publication memory p)
    {
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(salt), 0);
        p.leaves = leaves;
        p.recordIds = new bytes32[](leaves.length);
        for (uint256 i; i < leaves.length; ++i) {
            p.recordIds[i] = rid(leaves[i].typeId, leaves[i].body);
            p.leafMask |= uint64(uint256(1) << i);
        }
        p.expectedRevisions = new StateKernel.ExpectedRevision[](0);
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

    function groupPublication() internal view returns (StateKernel.Publication memory) {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        for (uint16 i; i < 2; ++i) {
            a[i] = StateKernel.SelectedLeaf(i, meta, abi.encodePacked(uint16(groups[i].length), groups[i]));
        }
        return publication(a, 1);
    }
}
