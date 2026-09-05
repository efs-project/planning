// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {TypeGroupParser as P} from "../src/TypeGroupParser.sol";

interface VmParser {
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseJsonUint(string calldata, string calldata) external pure returns (uint256);
    function parseJsonBytes32(string calldata, string calldata) external pure returns (bytes32);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
}

contract ParserHarness {
    function parse(bytes memory b, bytes32[] memory known) external pure returns (bytes32, P.SchemaCache[] memory) {
        return P.parse(b, known);
    }
}

contract TypeGroupParserTest {
    VmParser constant vm = VmParser(address(uint160(uint256(keccak256("hevm cheat code")))));
    ParserHarness h = new ParserHarness();

    // Independently written MC/1 framing: one UINT(8), no metadata digest/roles/indexes/constraints.
    function literal() internal pure returns (bytes memory) {
        return hex"0001003700010001540000000000000000000000000000000000000000000000000000000000000000000000000100017802080000000000000000";
    }

    function testLiteralUintWidthAndIdentity() public view {
        (, P.SchemaCache[] memory s) = h.parse(literal(), new bytes32[](0));
        require(s.length == 1, "one member");
        require(s[0].typeId == 0xc0963b3f91a72e99246e935af211995879e598c17beca71cf6fcd463f8079ade, "literal TypeId");
        require(s[0].maxBodyBytes == 8, "uint width");
        require(keccak256(s[0].fields[0].descriptor) == keccak256(hex"0001780208"), "retained descriptor");
    }

    function testRejectsTrailingGroupBytes() public view {
        reject(bytes.concat(literal(), hex"00"));
    }

    function testRejectsTruncatedBlob() public view {
        bytes memory b = literal();
        assembly { mstore(b, sub(mload(b), 1)) }
        reject(b);
    }

    // These tests catch missing grammar branches, reference closure/coverage,
    // bad bounds, and cache derivation independent of the implementation.
    function testRetainedFourGroupsExactIdsAndMaxima() public view {
        string memory json = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes32[] memory known = new bytes32[](16);
        uint256 cursor;
        for (uint256 g; g < 4; ++g) {
            string memory base = string.concat(".groups[", vm.toString(g), "]");
            bytes memory b =
                vm.parseBytes(string.concat("0x", vm.parseJsonString(json, string.concat(base, ".groupHex"))));
            (bytes32 gh, P.SchemaCache[] memory s) = h.parse(b, known);
            require(gh == vm.parseJsonBytes32(json, string.concat(base, ".temporaryGroupHash")), "retained group hash");
            require(s.length == (g == 0 || g == 2 ? 6 : g == 1 ? 3 : 1), "retained member count");
            for (uint256 m; m < s.length; ++m) {
                string memory member = string.concat(base, ".members[", vm.toString(m), "]");
                require(
                    s[m].typeId == vm.parseJsonBytes32(json, string.concat(member, ".temporaryTypeSchemaId")),
                    "retained TypeId"
                );
                require(
                    s[m].maxBodyBytes == vm.parseJsonUint(json, string.concat(member, ".maxStructuralBodyBytes")),
                    "retained max body"
                );
                bytes memory blobBytes =
                    vm.parseBytes(string.concat("0x", vm.parseJsonString(json, string.concat(member, ".blobHex"))));
                require(s[m].blobHash == keccak256(blobBytes), "retained blob hash");
                known[cursor++] = s[m].typeId;
            }
        }
        require(cursor == 16, "complete retained inventory");
    }

    function testAllNonreferenceKindsAndRecursiveDescriptor() public view {
        bytes memory f =
            hex"00016101000162020100016303200001640414000165050010000166060020000167090001680a0001690b00020000020100016a0c000200000201000005000300016b0d000200017801000179040200016c0e00000208";
        (, P.SchemaCache[] memory s) = h.parse(group(schema(12, f, hex"0000", hex"0000", hex"0000")), new bytes32[](0));
        require(s[0].maxBodyBytes == 1 + 1 + 32 + 20 + 18 + 34 + 32 + 68 + 4 + 14 + 3 + 9, "all kind sizes");
        require(s[0].fields[9].skipReads == 3, "map prefix walk");
        require(s[0].fields[10].maxBodyBytes == 3, "struct sum");
        require(s[0].fields[11].innerKind == 2, "option inner");
    }

    function testDirectRolesResolveSelfGroupAndExternal() public view {
        bytes memory s0 = schema(1, hex"00017807", role(1, bytes32(uint256(257)), 0), hex"00010200", hex"0000");
        bytes memory s1 = schema(1, hex"00017807", role(5, bytes32(uint256(1)), 0), hex"0000", hex"0000");
        (, P.SchemaCache[] memory s) = h.parse(
            bytes.concat(hex"0002", bytes2(uint16(s0.length)), s0, bytes2(uint16(s1.length)), s1), new bytes32[](0)
        );
        require(
            s[0].roles[0].expectedType == s[1].typeId && s[1].roles[0].expectedType == s[1].typeId, "resolved sentinels"
        );
        require(keccak256(s[0].fields[0].descriptor) == keccak256(hex"00017807"), "descriptor unchanged");
        bytes32 externalId = keccak256("external admitted Type");
        bytes memory b = group(schema(1, hex"00017807", role(1, externalId, 0), hex"0000", hex"0000"));
        reject(b);
        bytes32[] memory known = new bytes32[](1);
        known[0] = externalId;
        (, s) = h.parse(b, known);
        require(s[0].roles[0].expectedType == externalId, "external retained");
        reject(group(schema(1, hex"00017807", role(1, bytes32(uint256(256)), 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(1, bytes32(uint256(257)), 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(1, bytes32(uint256(2)), 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(2, bytes32(uint256(1)), 0), hex"0000", hex"0000")));
    }

    function testOptionalOccurrenceAndRefArrayBudget() public view {
        (, P.SchemaCache[] memory s) =
            h.parse(group(schema(1, hex"0001780e000008", role(4, 0, 0), hex"0000", hex"0000")), new bytes32[](0));
        require(s[0].maxBodyBytes == 35 && s[0].fields[0].references == 1, "optional occurrence");
        (, s) =
            h.parse(group(schema(1, hex"0001780b0010000007", role(1, 0, 0), hex"0000", hex"0000")), new bytes32[](0));
        require(s[0].maxBodyBytes == 514 && s[0].fields[0].references == 16, "bounded array");
        reject(group(schema(1, hex"0001780b0011000007", role(1, 0, 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780b0000000007", hex"0000", hex"0000", hex"0000"))); // zero fanout cannot hide an unbound REF
        reject(group(schema(1, hex"0001780b0001000008", role(4, 0, 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780d000100017907", role(1, 0, 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017808", role(1, 0, 0), hex"0000", hex"0000")));
    }

    function testNamesDepthWidthsAndBounds() public view {
        reject(group(schema(1, hex"0001780203", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780400", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"000178052001", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"000178061001", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780b0401000001", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780c010100000201000001", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780c0001000001000001", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(2, hex"0001780100017801", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780d00020001790100017901", hex"0000", hex"0000", hex"0000")));
        bytes memory depth4 = hex"0001780e00000e00000e000001";
        (, P.SchemaCache[] memory s) =
            h.parse(group(schema(1, depth4, hex"0000", hex"0000", hex"0000")), new bytes32[](0));
        require(s[0].maxBodyBytes == 4, "depth boundary");
        reject(group(schema(1, hex"0001780e00000e00000e00000e000001", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001780e00017901", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017f01", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"0001ff01", hex"0000", hex"0000", hex"0000")));
    }

    function testExtractionAndIndexConstraints() public view {
        bytes memory fields;
        for (uint8 i; i < 16; ++i) {
            fields = bytes.concat(fields, hex"0001", bytes1(i + 65), hex"050001");
        }
        bytes memory b =
            group(schema(17, bytes.concat(fields, hex"00017807"), role(1, 0, 16), hex"00010200", hex"0000"));
        h.parse(b, new bytes32[](0));
        reject(group(schema(18, bytes.concat(fields, hex"00017a05000100017807"), role(1, 0, 17), hex"0000", hex"0000")));
        h.parse(
            group(
                schema(
                    1,
                    hex"0001780201",
                    hex"0000",
                    hex"00010100",
                    bytes.concat(hex"00010100", bytes32(uint256(2)), bytes32(uint256(3)))
                )
            ),
            new bytes32[](0)
        );
        reject(group(schema(1, hex"0001780201", hex"0000", hex"00010300", hex"0000")));
        reject(group(schema(1, hex"0001780201", hex"0000", hex"000201000100", hex"0000")));
        reject(
            group(
                schema(
                    1,
                    hex"0001780201",
                    hex"0000",
                    hex"0000",
                    bytes.concat(hex"00010100", bytes32(uint256(3)), bytes32(uint256(2)))
                )
            )
        );
        reject(group(schema(1, hex"0001780201", hex"0000", hex"0000", hex"00010200")));
        reject(group(schema(1, hex"000178050001", hex"0000", hex"0000", hex"00010300")));
    }

    function testMetadataDigestAndClosedGrammarBounds() public view {
        bytes memory tail = bytes.concat(bytes32(0), hex"0001000178010000000000000000");
        bytes memory digest = bytes.concat(hex"000100015400000100120020", bytes32(uint256(7)), tail);
        (, P.SchemaCache[] memory s) = h.parse(group(digest), new bytes32[](0));
        require(s[0].maxBodyBytes == 1, "valid metadata digest");
        digest[10] = 0;
        digest[11] = 0x1f;
        reject(group(digest));
        reject(group(bytes.concat(hex"000100015400000200", tail)));
        reject(group(bytes.concat(hex"0002000154000000", tail)));
        reject(group(bytes.concat(hex"00010000", hex"000000", tail)));
        reject(group(bytes.concat(hex"00010001ff000000", tail)));
        reject(group(bytes.concat(hex"000100015400000100ff0000", tail)));
        reject(group(schema(0, hex"", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(65, hex"", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017801", hex"0011", hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017801", hex"0000", hex"0009", hex"0000")));
        reject(group(schema(1, hex"00017801", hex"0000", hex"0000", hex"0021")));
        reject(group(schema(1, hex"0001780f", hex"0000", hex"0000", hex"0000")));
        bytes memory badProfile = schema(1, hex"00017801", hex"0000", hex"0000", hex"0000");
        badProfile[badProfile.length - 3] = 0x01;
        reject(group(badProfile));
        bytes memory extra = bytes.concat(schema(1, hex"00017801", hex"0000", hex"0000", hex"0000"), hex"00");
        reject(group(extra));
    }

    function testDeepDuplicateNamesAndUint32ArithmeticFailClosed() public view {
        reject(group(schema(1, hex"0001780d00010001790d00020001610100016101", hex"0000", hex"0000", hex"0000")));
        (, P.SchemaCache[] memory s) = h.parse(
            group(schema(1, hex"0001780d00010001790d00020001610100016201", hex"0000", hex"0000", hex"0000")),
            new bytes32[](0)
        );
        require(s[0].maxBodyBytes == 2, "nested distinct names");
        // Bounds individually fit, but multiplying three arrays exceeds the cache's u32.
        reject(group(schema(1, hex"0001780b040000000b040000000b04000000052000", hex"0000", hex"0000", hex"0000")));
        (, s) = h.parse(group(schema(1, hex"000178052000", hex"0000", hex"0000", hex"0000")), new bytes32[](0));
        require(s[0].maxBodyBytes == 8194, "schema max not silently clamped to body admission limit");
    }

    function testRoleSelectorDenseIdAndCoverageReject() public view {
        bytes memory r = role(1, 0, 0);
        r[2] = 0x01;
        reject(group(schema(1, hex"00017807", r, hex"0000", hex"0000")));
        r[2] = 0;
        r[r.length - 1] = 0x01;
        reject(group(schema(1, hex"00017807", r, hex"0000", hex"0000")));
        r[r.length - 1] = 0;
        r[r.length - 2] = 0x01;
        reject(group(schema(1, hex"00017807", r, hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(1, 0, 1), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(0, 0, 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(6, 0, 0), hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", hex"0000", hex"0000", hex"0000")));
        reject(group(schema(1, hex"00017807", role(1, 0, 0), hex"00010201", hex"0000")));
        bytes memory duplicate =
            bytes.concat(hex"00020000017201", bytes32(0), hex"0000000100017301", bytes32(0), hex"000000");
        reject(group(schema(1, hex"00017807", duplicate, hex"0000", hex"0000")));
    }

    function testSignedConstraintAndNonemptyNameCaches() public view {
        bytes memory cs =
            bytes.concat(hex"00030100", bytes32(uint256(type(uint256).max - 1)), bytes32(uint256(3)), hex"02010301");
        (, P.SchemaCache[] memory s) =
            h.parse(group(schema(2, hex"0001780301000179060010", hex"0000", hex"00010100", cs)), new bytes32[](0));
        require(s[0].constraints[0].min == -2 && s[0].constraints[0].max == 3, "signed range preserved");
        require(s[0].constraints[1].min == 0 && s[0].constraints[2].max == 0, "unused words zero");
        reject(group(schema(1, hex"0001780201", hex"0000", hex"0000", hex"00010400")));
        reject(group(schema(1, hex"0001780201", hex"0000", hex"0000", hex"00010201")));
    }

    function testCarriageAndMemberCountBoundaries() public view {
        bytes memory base = schema(1, hex"00017801", hex"0000", hex"0000", hex"0000");
        bytes memory b = hex"000f";
        for (uint256 i; i < 15; ++i) {
            uint256 extra = i < 3 ? 2048 : i == 3 ? 1204 : 0;
            bytes memory meaning = new bytes(extra);
            bytes memory member = bytes.concat(
                hex"0001000154", bytes2(uint16(extra)), meaning, hex"00", bytes32(0), hex"0001000178010000000000000000"
            );
            b = bytes.concat(b, bytes2(uint16(member.length)), member);
        }
        require(b.length == 8190, "literal carriage boundary");
        (, P.SchemaCache[] memory s) = h.parse(b, new bytes32[](0));
        require(s.length == 15, "max carriage accepted");
        reject(bytes.concat(b, hex"00"));
        bytes memory sixteen = hex"0010";
        for (uint256 i; i < 16; ++i) {
            sixteen = bytes.concat(sixteen, bytes2(uint16(base.length)), base);
        }
        (, s) = h.parse(sixteen, new bytes32[](0));
        require(s.length == 16 && s[0].typeId != s[1].typeId, "member index identity");
        sixteen[1] = 0x11;
        reject(sixteen);
        reject(hex"0000");
    }

    function testFuzzAnyTruncationRejects(uint256 cut) public view {
        bytes memory b = literal();
        uint256 n = cut % b.length;
        assembly { mstore(b, n) }
        reject(b);
    }

    function schema(
        uint16 count,
        bytes memory fields,
        bytes memory roles,
        bytes memory indexes,
        bytes memory constraints
    ) internal pure returns (bytes memory) {
        return bytes.concat(
            hex"0001000154000000", bytes32(0), bytes2(count), fields, roles, indexes, hex"0000", constraints
        );
    }

    function group(bytes memory s) internal pure returns (bytes memory) {
        return bytes.concat(hex"0001", bytes2(uint16(s.length)), s);
    }

    function role(uint8 cls, bytes32 expected, uint8 field) internal pure returns (bytes memory) {
        return bytes.concat(hex"000100000172", bytes1(cls), expected, bytes1(field), hex"0000");
    }

    function reject(bytes memory b) internal view {
        try h.parse(b, new bytes32[](0)) {
            revert("accepted invalid schema");
        }
            catch {}
    }
}
