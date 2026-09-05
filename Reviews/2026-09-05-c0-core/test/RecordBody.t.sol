// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "../src/RecordBody.sol";

interface VmBody {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
}

contract RecordBodyHarness {
    function validate(TypeGroupParser.SchemaCache memory s, bytes memory b)
        external
        pure
        returns (RecordBody.CheckedBody memory)
    {
        return RecordBody.validate(s, b);
    }
}

contract RecordBodyTest {
    VmBody constant vm = VmBody(address(uint160(uint256(keccak256("hevm cheat code")))));
    RecordBodyHarness h = new RecordBodyHarness();

    function schema(bytes memory fields, uint16 count, bytes memory roles, bytes memory constraints)
        private
        pure
        returns (TypeGroupParser.SchemaCache memory)
    {
        // Literal framing: version 1, type name T, empty meaning, no digest, zero qualifier.
        bytes memory blob = bytes.concat(
            hex"0001000154000000", new bytes(32), abi.encodePacked(count), fields, roles, hex"00000000", constraints
        );
        (, TypeGroupParser.SchemaCache[] memory ss) = TypeGroupParser.parse(
            bytes.concat(hex"0001", abi.encodePacked(uint16(blob.length)), blob), new bytes32[](0)
        );
        return ss[0];
    }

    function single(bytes memory descriptor) private pure returns (TypeGroupParser.SchemaCache memory) {
        return schema(descriptor, 1, hex"0000", hex"0000");
    }

    function equal(bytes memory actual, bytes memory expected) private pure {
        require(keccak256(actual) == keccak256(expected), "exact field bytes");
    }

    function rejects(TypeGroupParser.SchemaCache memory s, bytes memory b, uint16 code) private view {
        (bool ok, bytes memory result) = address(h).staticcall(abi.encodeCall(h.validate, (s, b)));
        require(!ok, "expected structural rejection");
        equal(result, abi.encodeWithSelector(RecordBody.InvalidBody.selector, code));
    }

    function testBoolLiteralValuesAndExactSlices() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"00016601");
        RecordBody.CheckedBody memory b = h.validate(s, hex"00");
        require(b.fields.length == 1 && b.references.length == 0, "one field, no refs");
        equal(b.fields[0], hex"00");
        equal(h.validate(s, hex"01").fields[0], hex"01");
    }

    function testBoolRejectsInvalidFlagTruncationAndTrailing() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"00016601");
        rejects(s, hex"02", 7);
        rejects(s, hex"", 2);
        rejects(s, hex"0100", 1);
    }

    function testFixedWidthsAndFullPrincipal() public view {
        for (uint8 width = 1; width <= 32; width *= 2) {
            for (uint8 kind = 2; kind <= 4; ++kind) {
                TypeGroupParser.SchemaCache memory s = single(abi.encodePacked(hex"000166", kind, width));
                bytes memory b = new bytes(width);
                b[0] = 0xff;
                equal(h.validate(s, b).fields[0], b);
                rejects(s, new bytes(width - 1), 2);
                rejects(s, new bytes(width + 1), 1);
            }
        }
        bytes memory principal = abi.encodePacked(type(uint256).max);
        equal(h.validate(single(hex"00016609"), principal).fields[0], principal);
        equal(h.validate(single(hex"00016609"), new bytes(32)).fields[0], new bytes(32));
        rejects(single(hex"00016609"), new bytes(31), 2);
    }

    function testBytesAndStringBounds() public view {
        for (uint8 kind = 5; kind <= 6; ++kind) {
            TypeGroupParser.SchemaCache memory s = single(abi.encodePacked(hex"000166", kind, hex"0003"));
            equal(h.validate(s, hex"0000").fields[0], hex"0000");
            equal(h.validate(s, hex"0003616263").fields[0], hex"0003616263");
            rejects(s, hex"000461626364", 3);
            rejects(s, hex"00036162", 2);
            rejects(s, hex"00", 2);
        }
        rejects(single(hex"000166052000"), new bytes(8193), 3);
    }

    function testUtf8AcceptsAllSequenceWidthsAndBoundaryScalars() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"000166060100");
        bytes memory text = hex"007fc280dfbfe0a080ed9fbfeea080efbfbff0908080f48fbfbf";
        bytes memory b = bytes.concat(abi.encodePacked(uint16(text.length)), text);
        equal(h.validate(s, b).fields[0], b);
        // Well-formed decomposed and BOM strings are not an NFC / STRUCT-FULL claim.
        equal(h.validate(s, hex"000365cc81").fields[0], hex"000365cc81");
        equal(h.validate(s, hex"0003efbbbf").fields[0], hex"0003efbbbf");
    }

    function testUtf8RejectsOverlongSurrogateTruncatedAndOutOfRange() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"000166060100");
        rejects(s, hex"000180", 4);
        rejects(s, hex"0002c080", 4);
        rejects(s, hex"0002c1bf", 4);
        rejects(s, hex"0003e09fbf", 4);
        rejects(s, hex"0003eda080", 4);
        rejects(s, hex"0004f08fbfbf", 4);
        rejects(s, hex"0004f4908080", 4);
        rejects(s, hex"0004f5808080", 4);
        rejects(s, hex"0002e282", 4);
        rejects(s, hex"0002c241", 4);
        rejects(s, hex"0001ff", 4);
    }

    function testDigestClosedTableAndExactLengths() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"0001660a");
        uint16[5] memory alg = [uint16(17), 18, 19, 27, 61185];
        uint16[5] memory len = [uint16(20), 32, 64, 32, 20];
        for (uint256 i; i < 5; ++i) {
            bytes memory b = abi.encodePacked(alg[i], len[i], new bytes(len[i]));
            equal(h.validate(s, b).fields[0], b);
            rejects(s, abi.encodePacked(alg[i], len[i] - 1, new bytes(len[i] - 1)), 9);
            rejects(s, abi.encodePacked(alg[i], len[i], new bytes(len[i] - 1)), 2);
        }
        rejects(s, hex"00010000", 9);
        rejects(s, hex"001200", 2);
    }

    function role(uint8 index, uint8 cls, uint8 field) private pure returns (bytes memory) {
        return abi.encodePacked(index, hex"000172", cls, bytes32(0), field, hex"0000");
    }

    function testReferencesExactRolesOptionsArraysAndOccurrenceBytes() public view {
        TypeGroupParser.SchemaCache memory s = schema(
            hex"000161070001620e0000080001630b0002000007",
            3,
            bytes.concat(hex"0003", role(0, 1, 2), role(1, 4, 1), role(2, 1, 0)),
            hex"0000"
        );
        bytes32 id = bytes32(uint256(65536));
        bytes32 envelope = bytes32(type(uint256).max);
        bytes memory option = abi.encodePacked(hex"01", envelope, uint16(65535));
        bytes memory array = abi.encodePacked(hex"0002", id, bytes32(uint256(65537)));
        RecordBody.CheckedBody memory b = h.validate(s, abi.encodePacked(id, option, array));
        require(b.references.length == 4, "all runtime instances");
        require(
            b.references[0].roleIndex == 2 && b.references[0].targetId == id && b.references[0].leafIndex == 0,
            "direct role"
        );
        require(
            b.references[1].roleIndex == 1 && b.references[1].targetId == envelope
                && b.references[1].leafIndex == 65535,
            "full occurrence"
        );
        require(b.references[2].roleIndex == 0 && b.references[3].targetId == bytes32(uint256(65537)), "array order");
        equal(b.fields[0], abi.encodePacked(id));
        equal(b.fields[1], option);
        equal(b.fields[2], array);
        b = h.validate(s, abi.encodePacked(id, hex"000000"));
        require(b.references.length == 1, "absent option and empty array");
        equal(b.fields[1], hex"00");
        equal(b.fields[2], hex"0000");
    }

    function testRefSentinelsAndOccrefDoesNotInventTargetValidity() public view {
        TypeGroupParser.SchemaCache memory s =
            schema(hex"00016607", 1, bytes.concat(hex"0001", role(0, 1, 0)), hex"0000");
        rejects(s, new bytes(32), 8);
        rejects(s, abi.encodePacked(bytes32(uint256(65535))), 8);
        rejects(s, new bytes(31), 2);
        s = schema(hex"00016608", 1, bytes.concat(hex"0001", role(0, 4, 0)), hex"0000");
        RecordBody.CheckedBody memory b = h.validate(s, new bytes(34));
        require(b.references.length == 1 && b.references[0].targetId == bytes32(0), "no envelope existence claim");
        rejects(s, new bytes(33), 2);
    }

    function testArraysStructsOptionsAndRecursiveErrors() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"0001660b000200000d0002000161010001620e00000202");
        equal(h.validate(s, hex"0002010112340000").fields[0], hex"0002010112340000");
        equal(h.validate(s, hex"0000").fields[0], hex"0000");
        rejects(s, hex"0003", 12);
        rejects(s, hex"00010102", 6);
        rejects(s, hex"00010200", 7);
        rejects(s, hex"0001010112", 2);
        rejects(s, hex"0000ff", 1);
        equal(h.validate(single(hex"0001660e0000050003"), hex"00").fields[0], hex"00");
        equal(h.validate(single(hex"0001660e0000050003"), hex"010000").fields[0], hex"010000");
    }

    function testMapsOrderCompleteEncodingAndDuplicateRejection() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"0001660c00020000060003000001");
        // Prefix order: one-byte z sorts before two-byte aa, despite content order.
        equal(h.validate(s, hex"000200017a010002616100").fields[0], hex"000200017a010002616100");
        equal(h.validate(s, hex"0000").fields[0], hex"0000");
        rejects(s, hex"0002000261610000017a01", 5);
        rejects(s, hex"000200017a0000017a01", 5);
        rejects(s, hex"0003", 12);
        rejects(s, hex"000100017a02", 7);
        rejects(s, hex"00010002c08000", 4);
    }

    function ranged(uint8 kind, uint8 width, int256 min, int256 max)
        private
        pure
        returns (TypeGroupParser.SchemaCache memory)
    {
        return
            schema(abi.encodePacked(hex"000166", kind, width), 1, hex"0000", abi.encodePacked(hex"00010100", min, max));
    }

    function testSignedAndUnsignedRangeBoundariesWithoutNarrowing() public view {
        TypeGroupParser.SchemaCache memory s = ranged(3, 1, -2, 2);
        h.validate(s, hex"fe");
        h.validate(s, hex"02");
        rejects(s, hex"fd", 14);
        rejects(s, hex"03", 14);
        h.validate(ranged(3, 32, type(int256).min, type(int256).max), abi.encodePacked(type(int256).min));
        h.validate(ranged(3, 32, -1, -1), abi.encodePacked(int256(-1)));
        s = ranged(2, 32, -1, type(int256).max);
        h.validate(s, abi.encodePacked(uint256(0)));
        h.validate(s, abi.encodePacked(uint256(type(int256).max)));
        rejects(s, abi.encodePacked(uint256(type(int256).max) + 1), 14);
        rejects(s, abi.encodePacked(type(uint256).max), 14);
        rejects(ranged(2, 1, -2, -1), hex"00", 14);
        rejects(ranged(2, 1, 2, 4), hex"01", 14);
        h.validate(ranged(2, 1, 2, 4), hex"02");
        h.validate(ranged(2, 1, 2, 4), hex"04");
    }

    function testNonemptyAndNameProfileConstraints() public view {
        TypeGroupParser.SchemaCache memory s = schema(hex"0001660500030001670e0000050003", 2, hex"0000", hex"00010200");
        h.validate(s, hex"00016100"); // NONEMPTY on first field does not erase absent second OPTION.
        rejects(s, hex"000000", 14);
        s = schema(hex"0001660b0001000001", 1, hex"0000", hex"00010200");
        rejects(s, hex"0000", 14);
        h.validate(s, hex"000100");
        s = schema(hex"0001660c000100000201000001", 1, hex"0000", hex"00010200");
        rejects(s, hex"0000", 14);
        h.validate(s, hex"00010100");
        s = schema(hex"000166060020", 1, hex"0000", hex"00010300");
        rejects(s, hex"0000", 14);
        rejects(s, hex"000100", 14);
        rejects(s, hex"00011f", 14);
        rejects(s, hex"00017f", 14);
        rejects(s, hex"0002c280", 14);
        rejects(s, hex"0002c29f", 14);
        equal(h.validate(s, hex"0009c3a9e4b8adf09f9880").fields[0], hex"0009c3a9e4b8adf09f9880");
        h.validate(s, hex"0002c2a0");
    }

    function testForgedCacheReferenceBudgetCannotBeLostInArray() public view {
        TypeGroupParser.SchemaCache memory s =
            schema(hex"0001660b0010000007", 1, bytes.concat(hex"0001", role(0, 1, 0)), hex"0000");
        bytes memory b = hex"0010";
        for (uint256 i; i < 16; ++i) {
            b = bytes.concat(b, abi.encodePacked(bytes32(uint256(65536 + i))));
        }
        require(h.validate(s, b).references.length == 16, "budget boundary");
        // Deliberately forged cache: admitted parser refuses a max-ref budget of 17.
        s.fields[0].descriptor = hex"0001660b0011000007";
        s.fields[0].widthOrMax = 17;
        b[1] = 0x11;
        rejects(s, bytes.concat(b, abi.encodePacked(bytes32(uint256(65552)))), 15);
    }

    function testRetainedFourGroupsAndRepresentativeBodies() public view {
        string memory json = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes32[] memory known = new bytes32[](16);
        uint256 cursor;
        for (uint256 g; g < 4; ++g) {
            string memory base = string.concat(".groups[", vm.toString(g), "]");
            bytes memory group =
                vm.parseBytes(string.concat("0x", vm.parseJsonString(json, string.concat(base, ".groupHex"))));
            (bytes32 hash, TypeGroupParser.SchemaCache[] memory ss) = TypeGroupParser.parse(group, known);
            require(
                hash == vm.parseJsonBytes32(json, string.concat(base, ".temporaryGroupHash")),
                "retained group commitment"
            );
            for (uint256 m; m < ss.length; ++m) {
                string memory member = string.concat(base, ".members[", vm.toString(m), "]");
                require(
                    ss[m].typeId == vm.parseJsonBytes32(json, string.concat(member, ".temporaryTypeSchemaId")),
                    "retained Type id"
                );
                known[cursor++] = ss[m].typeId;
            }
            if (g == 0) objectGenesisFixture(ss[0]);
            if (g == 1) bindingFixture(ss[0]);
            if (g == 2) fileRevisionFixture(ss[2]);
        }
        require(cursor == 16, "all sixteen retained Types");
    }

    function objectGenesisFixture(TypeGroupParser.SchemaCache memory s) private view {
        bytes memory rawPrincipal = abi.encodePacked(type(uint256).max);
        bytes memory body = bytes.concat(rawPrincipal, new bytes(32), hex"00");
        RecordBody.CheckedBody memory b = h.validate(s, body);
        require(b.fields.length == 3 && b.references.length == 0, "charter structure only");
        equal(b.fields[0], rawPrincipal);
        equal(b.fields[1], new bytes(32));
        equal(b.fields[2], hex"00");
        b = h.validate(s, bytes.concat(rawPrincipal, new bytes(32), hex"01", new bytes(32)));
        equal(b.fields[2], bytes.concat(hex"01", new bytes(32)));
        rejects(s, bytes.concat(body, hex"00"), 1);
    }

    function bindingFixture(TypeGroupParser.SchemaCache memory s) private view {
        bytes32 record = bytes32(uint256(65536));
        bytes32 envelope = bytes32(type(uint256).max);
        bytes memory target = abi.encodePacked(hex"01", record);
        bytes memory predecessor = abi.encodePacked(hex"01", envelope, uint16(500));
        RecordBody.CheckedBody memory b = h.validate(s, bytes.concat(new bytes(96), target, hex"00", predecessor));
        require(b.fields.length == 6 && b.references.length == 2, "binding structure");
        for (uint256 i; i < 3; ++i) {
            equal(b.fields[i], new bytes(32));
        }
        equal(b.fields[3], target);
        equal(b.fields[4], hex"00");
        equal(b.fields[5], predecessor);
        require(b.references[0].roleIndex == 0 && b.references[0].targetId == record, "target role");
        require(
            b.references[1].roleIndex == 2 && b.references[1].targetId == envelope && b.references[1].leafIndex == 500,
            "predecessor role"
        );
        // Both absent / both present are structural bodies, NOT valid Binding effects.
        b = h.validate(s, bytes.concat(new bytes(96), hex"000000"));
        require(b.references.length == 0 && b.fields.length == 6, "zero references is still a decoded body");
        b = h.validate(s, bytes.concat(new bytes(96), target, predecessor, hex"00"));
        require(b.references.length == 2 && b.references[1].roleIndex == 1, "cardinality belongs to stateful effects");
    }

    function fileRevisionFixture(TypeGroupParser.SchemaCache memory s) private view {
        bytes32 node = bytes32(uint256(65536));
        bytes32 content = bytes32(uint256(65537));
        bytes memory parents = abi.encodePacked(hex"0002", bytes32(uint256(65538)), bytes32(uint256(65539)));
        bytes memory media = hex"000a746578742f706c61696e";
        bytes memory charset = hex"0100057574662d38";
        RecordBody.CheckedBody memory b =
            h.validate(s, abi.encodePacked(node, content, media, charset, hex"01", parents));
        require(b.fields.length == 6 && b.references.length == 4, "revision fields and references");
        equal(b.fields[0], abi.encodePacked(node));
        equal(b.fields[1], abi.encodePacked(content));
        equal(b.fields[2], media);
        equal(b.fields[3], charset);
        equal(b.fields[4], hex"01");
        equal(b.fields[5], parents);
        require(b.references[0].roleIndex == 0 && b.references[0].targetId == node, "node role");
        require(b.references[1].roleIndex == 1 && b.references[1].targetId == content, "content role");
        require(b.references[2].roleIndex == 2 && b.references[2].targetId == bytes32(uint256(65538)), "parent one");
        require(b.references[3].roleIndex == 2 && b.references[3].targetId == bytes32(uint256(65539)), "parent two");
        // Duplicate parents remain structural, despite Files profile requirements.
        parents = abi.encodePacked(hex"0002", node, node);
        require(
            h.validate(s, abi.encodePacked(node, content, media, hex"0000", parents)).references.length == 4,
            "not Files semantic validity"
        );
    }

    function testForgedCacheUnsupportedReferenceShapesFailEvenWhenEmpty() public view {
        TypeGroupParser.SchemaCache memory s =
            schema(hex"0001660b0001000007", 1, bytes.concat(hex"0001", role(0, 1, 0)), hex"0000");
        // A cache cannot opt into ARRAY_STRUCT_MEMBER, which this parser cannot admit.
        s.fields[0].descriptor = hex"0001660b000100000d000100017807";
        rejects(s, hex"0000", 16);
        s.fields[0].descriptor = hex"0001660b0001000008";
        rejects(s, hex"0000", 16);
        s.fields[0].descriptor = hex"0001660b0001000007";
        s.roles = new TypeGroupParser.RoleCache[](0);
        rejects(s, hex"0000", 16);
    }

    function testForgedDescriptorMalformedDepthAndRuntimeOptionDepth() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"00016601");
        s.fields[0].descriptor = hex"000166ff";
        rejects(s, hex"00", 13);
        s.fields[0].descriptor = hex"000166";
        rejects(s, hex"00", 13);
        s.fields[0].descriptor = hex"0001660100";
        rejects(s, hex"00", 13);
        s.fields[0].kind = 11;
        s.fields[0].descriptor = hex"0001660b000100000b000100000b000100000b0001000001";
        rejects(s, hex"0000", 11);
        // Deliberately forged cache only: OPTION uses source runtime depth unchanged.
        // Existing TypeGroupParser still refuses this shape with conservative +1 depth.
        s.fields[0].descriptor = hex"0001660b000100000b000100000b000100000e000001";
        equal(h.validate(s, hex"0001000100010101").fields[0], hex"0001000100010101");
    }

    function testFuzzUint256PreservesExactWidth(uint256 value) public view {
        bytes memory b = abi.encodePacked(value);
        equal(h.validate(single(hex"0001660220"), b).fields[0], b);
    }

    function testFuzzInt8RangeIsSigned(int8 value) public view {
        TypeGroupParser.SchemaCache memory s = ranged(3, 1, -20, 20);
        bytes memory b = abi.encodePacked(value);
        if (value >= -20 && value <= 20) equal(h.validate(s, b).fields[0], b);
        else rejects(s, b, 14);
    }

    function testOptionalRefAndBudgetAcrossTopLevelFields() public view {
        TypeGroupParser.SchemaCache memory s = schema(
            hex"0001610b000f0000070001620e000007", 2, bytes.concat(hex"0002", role(0, 1, 0), role(1, 1, 1)), hex"0000"
        );
        bytes32 id = bytes32(uint256(65536));
        bytes memory array = hex"000f";
        for (uint256 i; i < 15; ++i) {
            array = bytes.concat(array, abi.encodePacked(id));
        }
        RecordBody.CheckedBody memory b = h.validate(s, bytes.concat(array, hex"01", abi.encodePacked(id)));
        require(b.references.length == 16 && b.references[15].roleIndex == 1, "present option consumes final budget");
        equal(b.fields[1], abi.encodePacked(hex"01", id));
        require(h.validate(s, bytes.concat(array, hex"00")).references.length == 15, "absent option consumes none");
        rejects(s, bytes.concat(array, hex"01", new bytes(32)), 8);
        rejects(s, bytes.concat(array, hex"02"), 6);
        rejects(s, bytes.concat(array, hex"01", new bytes(31)), 2);
        // Forged cache only: schema admission disallows worst-case 17 references.
        s.fields[0].descriptor = hex"0001610b0010000007";
        s.fields[0].widthOrMax = 16;
        array[1] = 0x10;
        array = bytes.concat(array, abi.encodePacked(id));
        require(
            h.validate(s, bytes.concat(array, hex"00")).references.length == 16, "budget carries across absent option"
        );
        rejects(s, bytes.concat(array, hex"01", abi.encodePacked(id)), 15);
    }

    function testExactMaximumBodyAndNonPowerOfTwoFixedBytes() public view {
        TypeGroupParser.SchemaCache memory s = single(hex"000166052000");
        bytes memory b = bytes.concat(hex"1ffe", new bytes(8190));
        equal(h.validate(s, b).fields[0], b);
        rejects(s, bytes.concat(hex"1fff", new bytes(8191)), 3);
        s = single(hex"0001660403");
        equal(h.validate(s, hex"abcdef").fields[0], hex"abcdef");
        rejects(s, hex"abcd", 2);
        s = schema(hex"000166060003", 1, hex"0000", hex"00010200");
        rejects(s, hex"0000", 14);
        h.validate(s, hex"000100"); // NONEMPTY does not imply NAME_PROFILE.
    }
}
