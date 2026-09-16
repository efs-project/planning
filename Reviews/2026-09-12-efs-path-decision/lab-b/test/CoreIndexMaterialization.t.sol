// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {IndexFieldProfile} from "../src/IndexFieldProfile.sol";
import {ProfiledIndexModule} from "../src/ProfiledIndexModule.sol";

/// Test-only access to the real packed-list operation, not fabricated effects.
contract PostingProbe is IndexModule {
    constructor(address c) IndexModule(c) {}

    function append(bytes32 key, uint64 ordinal, bool audit) external {
        _append(key, ordinal, audit);
    }
}

contract CoreIndexMaterializationTest is LabBase {
    function test_global_digest_two_declared_types_and_algorithm_separation() public {
        IndexFieldProfile.Spec[] memory specs = new IndexFieldProfile.Spec[](3);
        for (uint256 i; i < 3; i++) {
            specs[i].typeId = i == 0 ? ITEM : i == 1 ? BINARY : QUOTE;
            specs[i].digest = IndexFieldProfile.Digest(true, 2, 1, bytes32(uint256(i == 2 ? 2 : 1)));
        }
        index = new ProfiledIndexModule(address(ledger), specs);
        ledger.setIndexModule(address(index));
        bytes memory b = abi.encode(uint256(7), uint256(1), uint256(123));
        ledger.publish(ITEM, b);
        ledger.publish(BINARY, b);
        ledger.publish(QUOTE, abi.encode(uint256(7), uint256(2), uint256(123)));
        bytes32 oneKey = Keys.posting(0, 15, 0, keccak256(abi.encode(bytes32(uint256(1)), bytes32(uint256(123)))));
        bytes32 twoKey = Keys.posting(0, 15, 0, keccak256(abi.encode(bytes32(uint256(2)), bytes32(uint256(123)))));
        check(oneKey, 2, 2, 2, 1);
        check(twoKey, 1, 1, 3, 1);
        reuseRecord(ITEM, rid(ITEM, b));
        ledger.publish(BINARY, b);
        ledger.execute(one(aWithdraw(1)), new bytes[](1), ledger.nonces(address(this)));
        check(oneKey, 2, 2, 2, 1);
        require(index.postingAt(oneKey, 0) == 1 && index.postingAt(oneKey, 1) == 2, "global source Record admissions");
    }

    function test_manifest_header_exposes_limits_and_callback_abi() public view {
        (bool ok, bytes memory result) = address(index).staticcall(abi.encodeWithSignature("manifestHeader()"));
        require(ok && result.length > 64, "missing manifest header preimage");
        bytes memory header = abi.decode(result, (bytes));
        require(header.length == 14 * 32, "bounded manifest header");
        uint256[14] memory words = abi.decode(header, (uint256[14]));
        require(
            words[1] == uint256(keccak256("efs2/pk/1")) && words[2] == (1 << 48) - 1, "key domain and ordinal guard"
        );
        require(
            words[3] == 8192 && words[4] == 8 && words[5] == 16 && words[6] == 4 && words[7] == 1 && words[8] == 64
                && words[9] == 32,
            "manifest limits"
        );
        bytes4 prefix=bytes4(keccak256("onAdmission(uint64,(uint8,uint64,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,bytes32,bytes32,bool,bool)[])"));
        bytes4 finalPhase=bytes4(keccak256("afterPublication(uint64,(uint8,uint64,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,bytes32,bytes32,bool,bool)[])"));
        require(words[10]==uint256(bytes32(prefix))&&words[11]==uint256(bytes32(finalPhase)),"callback ABI preimage");
    }

    function fieldStatus(bytes memory input) private view returns (uint8 status) {
        (bool ok, bytes memory output) = address(index).staticcall(input);
        require(ok && output.length == 96, "missing exact field coverage");
        (status,,) = abi.decode(output, (uint8, uint64, uint64));
    }

    function test_undeclared_field_spec_kind_and_algorithm_remain_unknown() public {
        index = profile(ITEM, 2, 0, bytes32(uint256(1)));
        ledger.setIndexModule(address(index));
        require(
            fieldStatus(abi.encodeWithSignature("scalarCoverage(bytes32,uint8,uint8)", ITEM, uint8(1), uint8(2))) == 0,
            "undeclared spec complete"
        );
        require(
            fieldStatus(abi.encodeWithSignature("scalarCoverage(bytes32,uint8,uint8)", ITEM, uint8(0), uint8(1))) == 0,
            "undeclared kind complete"
        );
        require(
            fieldStatus(abi.encodeWithSignature("scalarCoverage(bytes32,uint8,uint8)", ITEM, uint8(0), uint8(2))) == 2,
            "declared scalar not complete"
        );
        require(
            fieldStatus(abi.encodeWithSignature("digestCoverage(bytes32,bytes32)", ITEM, bytes32(uint256(2)))) == 0,
            "undeclared algorithm complete"
        );
        require(
            fieldStatus(abi.encodeWithSignature("digestCoverage(bytes32,bytes32)", ITEM, bytes32(uint256(1)))) == 2,
            "declared digest not complete"
        );
    }

    function profile(bytes32 t, uint8 kind, uint16 word, bytes32 algorithm) private returns (IndexModule) {
        IndexFieldProfile.Spec[] memory specs = new IndexFieldProfile.Spec[](1);
        specs[0].typeId = t;
        specs[0].scalars = new IndexFieldProfile.Scalar[](1);
        specs[0].scalars[0] = IndexFieldProfile.Scalar(kind, word);
        specs[0].digest = IndexFieldProfile.Digest(true, word + 2, word + 1, algorithm);
        return new ProfiledIndexModule(address(ledger), specs);
    }

    function test_profile_bounds_and_wrong_algorithm_roll_back_every_family() public {
        index = profile(ITEM, 2, 0, bytes32(uint256(1)));
        ledger.setIndexModule(address(index));
        bytes[2] memory bad = [abi.encode(uint256(7)), abi.encode(uint256(7), uint256(2), uint256(3))];
        for (uint256 i; i < 2; i++) {
            Ledger.Action[] memory a = two(aCreate(bytes32(uint256(9))), aPublish(ITEM, bad[i]));
            bytes[] memory b = new bytes[](2);
            b[1] = bad[i];
            (bool ok,) = address(ledger).call(abi.encodeCall(ledger.execute, (a, b, uint64(0))));
            require(
                !ok && admissions() == 0 && ledger.nonces(address(this)) == 0 && index.lastProcessed() == 0,
                "failed declaration leaked core/index"
            );
            check(Keys.byTypeList(ITEM), 0, 0, 0, 0);
            check(Keys.uniqueByTypeList(ITEM), 0, 0, 0, 0);
            require(
                ledger.subjectCreatedAt(Keys.subject(pid(address(this)), bytes32(uint256(9)))) == 0, "create leaked"
            );
        }
        IndexFieldProfile.Spec[] memory invalid = new IndexFieldProfile.Spec[](17);
        try new IndexFieldProfile(invalid) {
            revert("17 types accepted");
        } catch {}
        invalid = new IndexFieldProfile.Spec[](1);
        invalid[0].typeId = ITEM;
        invalid[0].scalars = new IndexFieldProfile.Scalar[](5);
        try new IndexFieldProfile(invalid) {
            revert("5 scalars accepted");
        } catch {}
        invalid[0].scalars = new IndexFieldProfile.Scalar[](1);
        invalid[0].scalars[0] = IndexFieldProfile.Scalar(3, 0);
        try new IndexFieldProfile(invalid) {
            revert("unknown scalar kind accepted");
        } catch {}
        invalid[0].scalars[0] = IndexFieldProfile.Scalar(2, 256);
        try new IndexFieldProfile(invalid) {
            revert("out of range word accepted");
        } catch {}
    }

    function test_manifest_immutable_data_not_progress_and_unknown_fields() public {
        IndexModule a = profile(ITEM, 1, 0, bytes32(uint256(1)));
        IndexModule b = profile(ITEM, 2, 0, bytes32(uint256(1)));
        require(a.fieldProfile().dataHash() != b.fieldProfile().dataHash(), "different exact profile data");
        require(a.manifestHash() != b.manifestHash(), "constructor field data missing from manifest");
        index = b;
        ledger.setIndexModule(address(index));
        bytes32 h = index.manifestHash();
        bytes32 obligations = ledger.indexObligations();
        ledger.publish(ITEM, abi.encode(uint256(7), uint256(1), uint256(3)));
        index.bumpGeneration();
        index.declareOptional(bytes32("optional"), 2);
        require(
            index.manifestHash() == h && ledger.indexObligations() == obligations, "progress changed semantic identity"
        );
        (uint8 status,,) = index.coverage(index.FAMILY_SCALAR(), BINARY);
        require(status == 0, "undeclared field complete");
        (status,,) = index.coverage(index.FAMILY_SCALAR(), ITEM);
        require(status == 2, "declared field not complete");
        bytes32 future = registry.register(bytes32("future"), address(0), new bytes32[](0));
        ledger.publish(future, hex"01");
        (status,,) = index.coverage(index.FAMILY_UNIQUE_BY_TYPE(), future);
        require(status == 2, "new Type lost baseline obligations");
    }

    function test_unregistered_exact_type_is_unknown_not_future_complete() public view {
        (uint8 status,,) = index.coverage(index.FAMILY_UNIQUE_BY_TYPE(), bytes32("not-a-type"));
        require(status == 0, "unknown future Type claimed complete");
    }

    function test_scalar_type_codec_and_digest_algorithm_separation() public {
        IndexFieldProfile.Spec[] memory specs = new IndexFieldProfile.Spec[](2);
        for (uint256 i; i < 2; i++) {
            specs[i].typeId = i == 0 ? ITEM : BINARY;
            specs[i].scalars = new IndexFieldProfile.Scalar[](2);
            specs[i].scalars[0] = IndexFieldProfile.Scalar(1, 0);
            specs[i].scalars[1] = IndexFieldProfile.Scalar(2, 0);
            specs[i].digest = IndexFieldProfile.Digest(true, 2, 1, bytes32(i + 1));
        }
        index = new ProfiledIndexModule(address(ledger), specs);
        ledger.setIndexModule(address(index));
        ledger.publish(ITEM, abi.encode(uint256(7), uint256(1), uint256(123)));
        ledger.publish(BINARY, abi.encode(uint256(7), uint256(2), uint256(123)));
        check(Keys.scalarList(ITEM, 0, 1, bytes32(uint256(7))), 1, 1, 1, 1);
        check(Keys.scalarList(BINARY, 0, 1, bytes32(uint256(7))), 1, 1, 2, 1);
        check(Keys.scalarList(ITEM, 0, 2, bytes32(uint256(7))), 0, 0, 0, 0);
        check(Keys.scalarList(ITEM, 1, 2, bytes32(uint256(7))), 1, 1, 1, 1);
        check(Keys.digestList(bytes32(uint256(3)), bytes32(uint256(123))), 0, 0, 0, 0);
        check(Keys.digestList(bytes32(uint256(2)), bytes32(uint256(123))), 1, 1, 2, 1);
    }

    function test_declared_scalar_and_digest_are_retained_unique_records() public {
        IndexFieldProfile.Spec[] memory specs = new IndexFieldProfile.Spec[](1);
        specs[0].typeId = ITEM;
        specs[0].scalars = new IndexFieldProfile.Scalar[](1);
        specs[0].scalars[0] = IndexFieldProfile.Scalar(2, 0);
        specs[0].digest = IndexFieldProfile.Digest(true, 2, 1, bytes32(uint256(1)));
        index = new ProfiledIndexModule(address(ledger), specs);
        ledger.setIndexModule(address(index));
        bytes memory body = abi.encode(uint256(17), uint256(1), bytes32(uint256(123)));
        ledger.publish(ITEM, body);
        check(Keys.scalarList(ITEM, 0, 2, bytes32(uint256(17))), 1, 1, 1, 1);
        check(Keys.digestList(bytes32(uint256(1)), bytes32(uint256(123))), 1, 1, 1, 1);
        ledger.publish(ITEM, body);
        reuseRecord(ITEM, rid(ITEM, body));
        ledger.execute(one(aWithdraw(1)), new bytes[](1), ledger.nonces(address(this)));
        check(Keys.scalarList(ITEM, 0, 2, bytes32(uint256(17))), 1, 1, 1, 1);
        check(Keys.digestList(bytes32(uint256(1)), bytes32(uint256(123))), 1, 1, 1, 1);
    }

    function test_bounded_manifest_is_exposed_and_required_by_signed_obligations() public view {
        (bool ok, bytes memory out) = address(index).staticcall(abi.encodeWithSignature("manifestHash()"));
        require(ok && out.length == 32, "missing semantic manifest");
        bytes32 manifest = abi.decode(out, (bytes32));
        require(manifest != 0, "empty manifest");
        require(
            ledger.indexObligations() == keccak256(abi.encode(address(index), address(index).codehash, manifest)),
            "unsigned semantic obligations"
        );
    }

    function reuseRecord(bytes32 t, bytes32 id) private {
        ledger.execute(one(aReuse(t, id)), new bytes[](1), ledger.nonces(address(this)));
    }

    function check(bytes32 key, uint64 count, uint64 live, uint64 last, uint16 flags) private view {
        (uint64 c, uint64 l, uint64 a, uint16 f) = index.postingHead(key);
        require(c == count && l == live && a == last && f == flags, "posting unit/count mismatch");
    }

    // Missing by-Record or unique-by-Type materialization makes these literal keys empty.
    function test_occurrences_distinct_from_retained_records_and_withdrawals() public {
        bytes memory body = abi.encode(uint256(17));
        bytes32 id = rid(ITEM, body);
        ledger.publish(ITEM, body);
        ledger.publish(ITEM, body);
        reuseRecord(ITEM, id);
        bytes32 occurrence = Keys.posting(0, 12, 0, id);
        bytes32 unique = Keys.posting(ITEM, 13, 0, 0);
        check(occurrence, 3, 3, 3, 0);
        check(unique, 1, 1, 1, 1);
        ledger.execute(one(aWithdraw(1)), new bytes[](1), ledger.nonces(address(this)));
        ledger.execute(one(aWithdraw(2)), new bytes[](1), ledger.nonces(address(this)));
        ledger.execute(one(aWithdraw(3)), new bytes[](1), ledger.nonces(address(this)));
        check(occurrence, 3, 0, 3, 0);
        check(unique, 1, 1, 1, 1);
        (,, uint32 occurrences,) = ledger.record(id);
        require(occurrences == 0, "separate record counter");
        reuseRecord(ITEM, id);
        check(occurrence, 4, 1, 7, 0);
        check(unique, 1, 1, 1, 1);
    }

    // Every checked ordinal is generic: no Quote or Files profile is installed.
    function test_generic_references_same_target_two_roles_dedup_and_withdraw() public {
        bytes32 target = rid(ITEM, hex"01");
        ledger.publish(ITEM, hex"01");
        bytes memory body = abi.encode(target, target, uint256(1));
        bytes32 id = rid(PAIR, body);
        ledger.publish(PAIR, body);
        reuseRecord(PAIR, id);
        ledger.publish(PAIR, body);
        for (uint8 role; role < 2; role++) {
            bytes32 key = Keys.referenceList(PAIR, role, target);
            check(key, 1, 1, 2, 1);
            require(index.postingAt(key, 0) == 2, "first admission ordinal");
        }
        ledger.execute(one(aWithdraw(2)), new bytes[](1), ledger.nonces(address(this)));
        for (uint8 role; role < 2; role++) {
            check(Keys.referenceList(PAIR, role, target), 1, 1, 2, 1);
        }
    }

    function test_withdrawn_singleton_keeps_word_when_second_occurrence_arrives() public {
        ledger.publish(ITEM, hex"aa");
        bytes32 key = Keys.byRecordList(rid(ITEM, hex"aa"));
        ledger.execute(one(aWithdraw(1)), new bytes[](1), ledger.nonces(address(this)));
        check(key, 1, 0, 1, 0);
        require(index.postingWord(key, 0) == 1, "withdrawn singleton word");
        reuseRecord(ITEM, rid(ITEM, hex"aa"));
        check(key, 2, 1, 3, 0);
        require(index.postingWord(key, 0) == uint256(1) | (uint256(3) << 48), "transition retains withdrawn ordinal");
    }

    // A fresh list must write only one storage slot; the old two-slot layout fails this bound.
    function test_singleton_saving_and_word_equivalence_boundaries() public {
        PostingProbe p = new PostingProbe(address(ledger));
        bytes32 key = bytes32("tiny");
        require(p.postingAt(key, 0) == 0 && p.postingWord(key, 0) == 0, "empty");
        uint256 beforeGas = gasleft();
        p.append(key, 7, true);
        uint256 spent = beforeGas - gasleft();
        require(spent < 32_000, "singleton stores redundant word");
        uint256 expected = 7;
        for (uint64 i = 1; i <= 6; i++) {
            if (i > 1) {
                p.append(key, 6 + i, true);
                if (i <= 5) expected |= uint256(6 + i) << (48 * (i - 1));
            }
            require(p.postingWord(key, 0) == expected, "packed first word");
            require(p.postingWord(key, 1) == (i == 6 ? 12 : 0), "packed second word");
            for (uint64 j; j < i; j++) {
                require(p.postingAt(key, j) == 7 + j, "ordinal getter");
            }
            require(p.postingAt(key, i) == 0 && p.postingWord(key, 2) == 0, "outside zero");
        }
        (bool ok,) = address(p).call(abi.encodeCall(p.append, (key, uint64(12), true)));
        require(!ok && p.postingAt(key, 5) == 12, "failed append rollback");
        (ok,) = address(p).call(abi.encodeCall(p.append, (bytes32("guard"), uint64((1 << 48) - 1), true)));
        require(!ok && p.postingAt(bytes32("guard"), 0) == 0, "guard rollback");
    }
}
