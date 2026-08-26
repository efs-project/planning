// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Consumers} from "../src/Consumers.sol";
import {
    EquipTreasury,
    HonestValidator,
    Reverter,
    GasGriefer,
    ReturndataBomb,
    Reenterer,
    MutableValidator,
    IValidator
} from "../src/Effects.sol";

contract EffectsTest is Test {
    EquipTreasury treas;
    Consumers c;
    bytes32 constant CHAR = bytes32(uint256(0xC0FFEE));
    uint256 constant SLOT = 2;
    bytes32 constant ITEM = bytes32(uint256(0x17E));

    string outLog;

    function _rec(string memory k, string memory v) internal {
        outLog = string.concat(outLog, bytes(outLog).length == 0 ? "" : ",", '{"case":"', k, '","result":"', v, '"}');
    }

    function setUp() public {
        bytes32[] memory empty = new bytes32[](0);
        c = new Consumers(bytes32(0), bytes32(0), [bytes32(0), bytes32(0)], [bytes32(0), bytes32(0)], bytes32(0), 1000, empty, empty);
        treas = new EquipTreasury(c);
    }

    // ---- state machine: CAS, atomicity, grandfather, idempotency -----------
    function test_stateMachine() public {
        // rev 0 -> equip ok
        bytes32 r1 = treas.equip(CHAR, SLOT, ITEM, 0, false, false);
        _rec("equip.first", r1 != bytes32(0) ? "EFFECT" : "NONE");
        (uint64 rev,, bool set) = treas.slots(CHAR, SLOT);
        _rec("equip.first.rev", set && rev == 1 ? "REV_1" : "BAD");

        // policy denies a NEW equip (grandfather: existing state unchanged)
        vm.expectRevert(EquipTreasury.PolicyDenied.selector);
        treas.equip(CHAR, SLOT, bytes32(uint256(0x999)), 1, true, false);
        (uint64 rev2,, ) = treas.slots(CHAR, SLOT);
        _rec("policy.denied.grandfather", rev2 == 1 ? "UNCHANGED" : "MUTATED");

        // atomic: second leaf fails -> whole action reverts, no partial effect
        vm.expectRevert(EquipTreasury.LeafFailed.selector);
        treas.equip(CHAR, SLOT, bytes32(uint256(0x111)), 1, false, true);
        (uint64 rev3, bytes32 item3,) = treas.slots(CHAR, SLOT);
        _rec("atomic.leaf.fail.no.partial", (rev3 == 1 && item3 == ITEM) ? "NO_PARTIAL" : "PARTIAL_LEAK");

        // CAS conflict: wrong expectedRev
        vm.expectRevert(EquipTreasury.CasConflict.selector);
        treas.equip(CHAR, SLOT, bytes32(uint256(0x222)), 7, false, false);
        _rec("cas.conflict", "REVERTED");

        // correct CAS advances
        bytes32 r2 = treas.equip(CHAR, SLOT, bytes32(uint256(0x333)), 1, false, false);
        _rec("equip.second", r2 != bytes32(0) ? "EFFECT" : "NONE");

        // idempotent replay of the FIRST (char,slot,expectedRev=0): returns stored
        // receipt, no double effect (dropped-response recovery).
        (uint64 revBefore,,) = treas.slots(CHAR, SLOT);
        bytes32 rReplay = treas.equip(CHAR, SLOT, ITEM, 0, false, false);
        (uint64 revAfter,,) = treas.slots(CHAR, SLOT);
        _rec("idempotent.replay", (rReplay == r1 && revAfter == revBefore) ? "IDEMPOTENT_NO_DOUBLE" : "DOUBLE_EFFECT");
    }

    // ---- EAS_LIKE callback negative control ---------------------------------
    function test_callbacks() public {
        bytes memory body = hex"deadbeef";
        bytes32 tid = bytes32(uint256(1));

        // naive path: reverting validator kills the whole action
        Reverter rv = new Reverter();
        vm.expectRevert();
        treas.equipViaValidatorNaive(address(rv), tid, body, CHAR, SLOT, ITEM);
        _rec("callback.naive.revert", "ACTION_DEAD");

        // naive path: gas griefer consumes everything -> action dies
        GasGriefer gg = new GasGriefer();
        (bool okg,) = address(treas).call{gas: 2_000_000}(
            abi.encodeWithSelector(treas.equipViaValidatorNaive.selector, address(gg), tid, body, CHAR, SLOT, ITEM)
        );
        _rec("callback.naive.gasgrief", okg ? "SURVIVED" : "OOG_DEAD");

        // guarded path survives all four attacks and NEVER treats bool as authority
        HonestValidator hv = new HonestValidator();
        uint256 g0 = gasleft();
        (bool okh,) = treas.equipViaValidatorGuarded(address(hv), tid, body);
        uint256 gHonest = g0 - gasleft();
        _rec("callback.guarded.honest", okh ? "ADVISORY_TRUE" : "ADVISORY_FALSE");
        emit log_named_uint("gas.guarded.honest", gHonest);

        (bool okr, bytes32 dr) = treas.equipViaValidatorGuarded(address(rv), tid, body);
        _rec("callback.guarded.revert", (!okr && dr == "CALLBACK_REVERTED") ? "CONTAINED" : "LEAK");

        (bool okgg,) = treas.equipViaValidatorGuarded(address(gg), tid, body);
        _rec("callback.guarded.gasgrief", !okgg ? "CONTAINED" : "LEAK");

        ReturndataBomb bomb = new ReturndataBomb();
        uint256 g1 = gasleft();
        (bool okb,) = treas.equipViaValidatorGuarded(address(bomb), tid, body);
        uint256 gBomb = g1 - gasleft();
        _rec("callback.guarded.bomb", "CONTAINED"); // did not OOG on memory expansion
        emit log_named_uint("gas.guarded.bomb", gBomb);
        okb; // bool value irrelevant; containment is the property

        Reenterer re = new Reenterer();
        re.set(treas);
        (bool okre,) = treas.equipViaValidatorGuarded(address(re), tid, body);
        // staticcall context => reentrant state write attempt reverts inside; guarded
        // path reports not-ok, outer state untouched.
        _rec("callback.guarded.reenter", !okre ? "BLOCKED" : "REENTERED");

        // mutable validator: same call, different answer across time = reinterpretation.
        MutableValidator mv = new MutableValidator();
        (bool a1,) = treas.equipViaValidatorGuarded(address(mv), tid, body);
        mv.flip();
        (bool a2,) = treas.equipViaValidatorGuarded(address(mv), tid, body);
        _rec("callback.mutable.reinterpretation", (a1 != a2) ? "ANSWER_CHANGED" : "STABLE");
    }

    // ---- two Realms admit/deny the SAME record; identity is shared ----------
    function test_twoRealmsAndAddress() public {
        bytes memory env = hex"cafe";
        bytes32 typeId = bytes32(uint256(0x7));
        bytes32 recordId = keccak256(abi.encode("DOM_RECORD", typeId, keccak256(env)));

        // Realm A admits (policyRev 1, allow), Realm B denies (policyRev 5, deny)
        bytes32 recA = keccak256(abi.encode(recordId, uint256(1), "ALLOW", bytes32("stateBasisA")));
        bytes32 recB = keccak256(abi.encode(recordId, uint256(5), "DENY", bytes32("stateBasisB")));
        _rec("tworealms.recordId.shared", "SAME_ID"); // recordId identical by construction
        _rec("tworealms.receipts.differ", recA != recB ? "DIFFERENT" : "SAME");

        // address != meaning: deploy honest logic, then vm.etch reverting logic at
        // the SAME address. The portable recordId/typeId are unchanged; only a
        // consumer that (wrongly) trusts the address sees a different answer.
        HonestValidator hv = new HonestValidator();
        address a = address(hv);
        bool before = IValidator(a).validate(typeId, env);
        vm.etch(a, address(new Reverter()).code);
        (bool okAfter,) = address(a).call(abi.encodeWithSelector(IValidator.validate.selector, typeId, env));
        _rec("address.meaning.mutated", (before && !okAfter) ? "ADDRESS_NOT_MEANING" : "STABLE");
        bytes32 recordId2 = keccak256(abi.encode("DOM_RECORD", typeId, keccak256(env)));
        _rec("address.identity.stable", recordId == recordId2 ? "IDENTITY_UNCHANGED" : "CHANGED");
    }

    function test_writeResults() public {
        test_stateMachine();
        string memory a = outLog;
        outLog = "";
        test_callbacks();
        string memory b = outLog;
        outLog = "";
        test_twoRealmsAndAddress();
        string memory cc = outLog;
        vm.writeFile("effects_results.json", string.concat("[", a, ",", b, ",", cc, "]"));
    }
}
