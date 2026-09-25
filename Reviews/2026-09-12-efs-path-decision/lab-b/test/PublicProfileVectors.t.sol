// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {Utf8NameRule} from "./Utf8NameRule.sol";

/// Disposable raw-byte public-name experiment. Not the installed Files Name Type.
contract PublicProfileVectorsTest is LabBase {
    bytes32 internal constant NAME_SHAPE = keccak256("lab/type/public-name-utf8-raw/1");
    Utf8NameRule internal rule;
    bytes32 internal nameType;

    event LongNameGas(uint256 byteLength, uint256 gasUsed);

    function setUp() public override {
        super.setUp();
        rule = new Utf8NameRule();
        nameType = registry.register(NAME_SHAPE, address(rule), new bytes32[](0));
        require(nameType == Keys.typeId(NAME_SHAPE, new bytes32[](0), address(rule).codehash), "Type identity");
    }

    function test_raw_utf8_vectors_retain_exact_bytes_and_hashes() public {
        bytes[] memory names = new bytes[](7);
        bytes32[] memory hashes = new bytes32[](7);
        names[0] = hex"5265706f72742e545854"; hashes[0] = 0x36810084e09fd082065e1587a57a381b51c77bbb6ee74db5981e5b46b0fa4642;
        names[1] = hex"7265706f72742e747874"; hashes[1] = 0x143801f1f10abf0e6876c8219bfd3c94b8a26e3b604b5ae3c46d383d7a864f70;
        names[2] = hex"636166c3a92e747874"; hashes[2] = 0x51ca49ae9a12210906e1ab86ac1c8731e11cd86edf0df9dbbc4cfd13531de9d9;
        names[3] = hex"63616665cc812e747874"; hashes[3] = 0x4674ddf120a1c4a844be00bf1c468c373a7faff9f25e6d8fe62fe13608d403be;
        names[4] = hex"e69db1e4baac2e747874"; hashes[4] = 0xc1d140dd028ebef7162124945fa2e9e82b6cf62c72cc60a250101139370c159d;
        names[5] = hex"f09f93812e706e67"; hashes[5] = 0x5a1bc69c18b84a38befe5bbe3f361f8956cdfe7d76eb9e56562310a7d8c8bc38;
        names[6] = hex"d985d984d9812e747874"; hashes[6] = 0xaf63a5b59dc2834bb6be59b295c8560db985ae2d6c92387a162229a9f980b4aa;
        require(hashes[0] != hashes[1] && hashes[2] != hashes[3], "no case or Unicode folding");
        for (uint256 i; i < names.length; ++i) {
            require(keccak256(names[i]) == hashes[i], "literal role vector");
            require(rule.accept(nameType, names[i], new bytes32[](0)), "valid UTF-8 refused");
            bytes32 recordId = ledger.publish(nameType, names[i]);
            (bytes32 retainedType, uint64 first,, bytes memory retained) = ledger.record(recordId);
            require(retainedType == nameType && first != 0 && keccak256(retained) == hashes[i], "not byte exact");
        }
    }

    function test_invalid_bytes_and_reserved_segments_never_admit() public {
        bytes[] memory invalid = new bytes[](16);
        invalid[0] = hex""; invalid[1] = hex"2e"; invalid[2] = hex"2e2e";
        invalid[3] = hex"612f62"; invalid[4] = hex"615c62"; invalid[5] = hex"610062";
        invalid[6] = hex"610a62"; invalid[7] = hex"617f62"; invalid[8] = hex"61c28062";
        invalid[9] = hex"ff"; invalid[10] = hex"c0af"; invalid[11] = hex"e282";
        invalid[12] = hex"eda080"; invalid[13] = hex"f4908080"; invalid[14] = hex"e08080";
        invalid[15] = new bytes(256);
        for (uint256 i; i < invalid.length; ++i) {
            require(!rule.accept(nameType, invalid[i], new bytes32[](0)), "invalid Name accepted");
            (bool ok, bytes memory errorData) = address(ledger).call(abi.encodeCall(ledger.publish, (nameType, invalid[i])));
            require(!ok && keccak256(errorData) == keccak256(abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(0), nameType)), "Type refusal");
            (bytes32 t, uint64 first,, bytes memory retained) = ledger.record(Keys.recordFromHash(nameType, keccak256(invalid[i])));
            require(t == 0 && first == 0 && retained.length == 0, "rejected bytes retained");
        }
    }

    function test_only_exact_dot_segments_are_reserved_and_refs_are_forbidden() public view {
        require(rule.accept(nameType, bytes("..."), new bytes32[](0)), "triple dot is not a reserved segment");
        require(rule.accept(nameType, bytes(".config"), new bytes32[](0)), "leading dot is allowed");
        require(rule.accept(nameType, bytes("a b"), new bytes32[](0)), "ordinary spaces are allowed");
        bytes32[] memory refs = new bytes32[](1); refs[0] = bytes32(uint256(1));
        require(!rule.accept(nameType, bytes("valid"), refs), "Name Type accepted references");
    }

    function test_255_byte_scalar_name_cost_and_256_boundary() public {
        bytes memory longName = new bytes(255);
        for (uint256 i; i < 255; i += 3) {
            longName[i] = 0xe7; longName[i + 1] = 0x95; longName[i + 2] = 0x8c; // U+754C, 85 times
        }
        require(rule.accept(nameType, longName, new bytes32[](0)), "255-byte UTF-8 refused");
        uint256 beforeGas = gasleft();
        bytes32 id = ledger.publish(nameType, longName);
        uint256 gasUsed = beforeGas - gasleft();
        emit LongNameGas(longName.length, gasUsed); // measured local execution, not a public-network fee
        (bytes32 t,, , bytes memory retained) = ledger.record(id);
        require(t == nameType && retained.length == 255 && keccak256(retained) == keccak256(longName), "long exact body");
        require(gasUsed > 0, "cost missing");
        bytes memory over = bytes.concat(longName, hex"61");
        require(!rule.accept(nameType, over, new bytes32[](0)), "256-byte name accepted");
    }
}
