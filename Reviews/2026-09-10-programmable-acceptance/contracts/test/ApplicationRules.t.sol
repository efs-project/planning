// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {CoreFixture} from "./CoreBoundary.t.sol";
import {AcceptanceCore} from "../src/AcceptanceCore.sol";
import {AT} from "../src/AcceptanceTypes.sol";
import {OutfitRule, EquipRule} from "../src/OutfitRules.sol";
import {PaidClaimRule} from "../src/PaidClaimRule.sol";

abstract contract ApplicationFixture is CoreFixture {
    OutfitRule internal outfitRule;
    EquipRule internal equipRule;
    PaidClaimRule internal paid;
    bytes32 internal outfit;
    bytes32 internal equip;
    bytes32 internal claim;
    bytes32 internal outfitActivation;
    bytes32 internal equipActivation;
    bytes32 internal claimActivation;
    address internal treasury = address(0xBEEF);

    function setUp() public override {
        super.setUp();
        outfitRule = new OutfitRule(address(core));
        outfit = registerHook("Outfit", hex"000000", address(outfitRule), keccak256("outfit.compatibility.v1"), 1);
        equipRule = new EquipRule(address(core), address(this), outfit);
        equip = registerHook(
            "Equip", hex"02", address(equipRule), keccak256(abi.encode(keccak256("equip.current.v1"), outfit)), 1
        );
        paid = new PaidClaimRule(address(core), treasury, 1 ether);
        claim = registerHook(
            "Claim", hex"02", address(paid), keccak256(abi.encode(keccak256("paid.unique.v1"), uint256(1 ether))), 2
        );
        outfitActivation = core.activate(outfit, address(outfitRule), keccak256(abi.encode(address(core))));
        equipActivation = core.activate(equip, address(equipRule), keccak256(abi.encode(address(core), address(this))));
        claimActivation = core.activate(claim, address(paid), keccak256(abi.encode(address(core), treasury)));
    }

    function registerHook(string memory name, bytes memory kinds, address hook, bytes32 config, uint8 mode)
        internal
        returns (bytes32)
    {
        return core.registerType(keccak256(bytes(name)), kinds, AT.Rule(hook.codehash, config, mode, 300_000));
    }

    function outfitPlan(uint256 species, uint256 shirt, uint256 pants) internal view returns (AT.Plan memory p) {
        p = plan(abi.encode(species, shirt, pants));
        p.items[0] = AT.Item(outfit, outfitActivation, p.items[0].body, 0);
    }

    function claimPlan(bytes32 key) internal view returns (AT.Plan memory p) {
        p = plan(abi.encode(key));
        p.items[0] = AT.Item(claim, claimActivation, p.items[0].body, 1 ether);
    }

    function publishOutfit() internal returns (bytes32) {
        AT.Plan memory p = outfitPlan(1, 1, 1);
        vm.prank(author);
        return core.execute(p, "")[0];
    }
}

contract ApplicationRulesTest is ApplicationFixture {
    function testOutfitCompatibilityAndExactPayload() public {
        fails(outfitPlan(1, 2, 1), "", 0);
        fails(outfitPlan(2, 2, 3), "", 0);
        bytes32 id = publishOutfit();
        require(core.getReceipt(id).accepted, "outfit not accepted");
        require(
            keccak256(core.getBody(id)) == keccak256(abi.encode(uint256(1), uint256(1), uint256(1))), "outfit bytes"
        );
    }

    function testNewEquipChecksCurrentPolicyHistoryGrandfathered() public {
        bytes32 outfitId = publishOutfit();
        AT.Plan memory p = plan(abi.encode(outfitId));
        p.items[0] = AT.Item(equip, equipActivation, p.items[0].body, 0);
        vm.prank(author);
        bytes32 id = core.execute(p, "")[0];
        equipRule.setAllowed(false);
        require(core.getReceipt(outfitId).accepted && core.getReceipt(id).accepted, "history erased");
        require(equipRule.grandfathered(id), "grandfather lost");
        p.nonce = core.nonces(author);
        fails(p, "", 0);
        bytes32 raw = core.retainRaw(outfitId);
        require(!equipRule.grandfathered(raw), "raw equip");
        require(!equipRule.grandfathered(outfitId), "Outfit is not Equip");
    }

    function testEquipRejectsWrongAuthorAndRawReference() public {
        bytes32 id = publishOutfit();
        AT.Plan memory p = plan(abi.encode(id));
        p.items[0] = AT.Item(equip, equipActivation, p.items[0].body, 0);
        p.author = address(this);
        p.nonce = 0;
        (bool ok,) = address(core).call(abi.encodeCall(core.execute, (p, "")));
        require(!ok, "borrowed outfit author");
        p.author = author;
        p.nonce = core.nonces(author);
        p.items[0].body = abi.encode(core.retainRaw(id));
        fails(p, "", 0);
    }

    function testStagedOutfitThenEquipAndReverseRejected() public {
        AT.Plan memory p = outfitPlan(1, 1, 1);
        AT.Item memory first = p.items[0];
        p.items = new AT.Item[](2);
        p.items[0] = first;
        p.items[1] = AT.Item(equip, equipActivation, abi.encode(bytes32(0)), 0);
        vm.prank(author);
        bytes32[] memory ids = core.execute(p, "");
        require(core.getReceipt(ids[1]).accepted && equipRule.grandfathered(ids[1]), "prior staged item unavailable");
        p.nonce = core.nonces(author);
        p.items[0] = p.items[1];
        p.items[1] = first;
        fails(p, "", 0);
    }

    function testPaidClaimRetryAndFreshActionCannotReuse() public {
        AT.Plan memory p = claimPlan(bytes32(uint256(77)));
        vm.prank(author);
        bytes32 id = core.execute{value: 1 ether}(p, "")[0];
        require(
            paid.used(bytes32(uint256(77))) && paid.count() == 1 && treasury.balance == 1 ether,
            "payment/uniqueness missing"
        );
        vm.prank(author);
        require(core.execute(p, "")[0] == id, "retry changed receipt");
        require(paid.count() == 1 && treasury.balance == 1 ether, "retry recharged");
        fails(p, "", 1 ether);
        p.nonce = 1;
        fails(p, "", 1 ether);
        require(core.nonces(author) == 1, "failed nonce retained");
        p.author = address(this);
        p.nonce = 0;
        (bool ok,) = address(core).call{value: 1 ether}(abi.encodeCall(core.execute, (p, "")));
        require(!ok, "competing claim succeeded");
    }

    function testLateFailureRollsBackAllEffectsAndSameBatchDuplicate() public {
        AT.Plan memory p = claimPlan(bytes32(uint256(88)));
        AT.Item memory first = p.items[0];
        p.items = new AT.Item[](2);
        p.items[0] = first;
        p.items[1] = AT.Item(outfit, outfitActivation, abi.encode(uint256(1), uint256(2), uint256(1)), 0);
        bytes32 predicted = core.receiptId(core.hashPlan(p), 0);
        uint256 beforeBalance = author.balance;
        fails(p, "", 1 ether);
        require(
            !paid.used(bytes32(uint256(88))) && paid.count() == 0 && treasury.balance == 0,
            "hook effects not rolled back"
        );
        require(
            core.nonces(author) == 0 && !core.getReceipt(predicted).accepted && core.getBody(predicted).length == 0,
            "Core rollback"
        );
        require(
            author.balance == beforeBalance && address(core).balance == 0 && address(paid).balance == 0,
            "value rollback"
        );
        p.items[1] = first;
        fails(p, "", 2 ether);
        require(paid.count() == 0 && treasury.balance == 0, "batch duplicate partial commit");
    }

    function testDirectHookCallerCannotConsumeRightsOrValidateForgedContext() public {
        AT.Context memory c;
        c.author = author;
        (bool ok,) =
            address(paid).call{value: 1 ether}(abi.encodeCall(paid.accept, (c, abi.encode(bytes32(uint256(99))))));
        require(!ok && paid.count() == 0 && treasury.balance == 0, "direct hook spoof");
        (ok,) = address(outfitRule)
            .call(abi.encodeCall(outfitRule.accept, (c, abi.encode(uint256(1), uint256(1), uint256(1)))));
        require(!ok, "direct stateless hook spoof");
    }

    function testPortableRuleDifferentLocalActivationsNoSquatting() public {
        PaidClaimRule otherHook = new PaidClaimRule(address(core), address(0x1234), 1 ether);
        require(address(otherHook).codehash == address(paid).codehash, "constructor leaked into runtime");
        bytes32 alt = core.activate(claim, address(otherHook), keccak256(abi.encode(address(core), address(0x1234))));
        require(
            alt != claimActivation && core.getActivation(claimActivation).hook == address(paid), "activation replaced"
        );
        AcceptanceCore other = new AcceptanceCore();
        PaidClaimRule remote = new PaidClaimRule(address(other), treasury, 1 ether);
        bytes32 remoteType = other.registerType(keccak256("Claim"), hex"02", core.getType(claim).rule);
        bytes32 remoteAct = other.activate(remoteType, address(remote), keccak256(abi.encode(address(other), treasury)));
        require(remoteType == claim && remoteAct != claimActivation, "portable identity/local activation confusion");
    }

    function testOutfitV2KeepsMandatoryRuleAndDoesNotSilentlyBecomeV1() public {
        bytes32 v2 = core.registerType(keccak256("Outfit v2"), hex"00000000", core.getType(outfit).rule);
        bytes32 act = core.activate(v2, address(outfitRule), keccak256(abi.encode(address(core))));
        AT.Plan memory p = plan(abi.encode(uint256(1), uint256(1), uint256(1), uint256(42)));
        p.items[0] = AT.Item(v2, act, p.items[0].body, 0);
        vm.prank(author);
        bytes32 id = core.execute(p, "")[0];
        require(core.getReceipt(id).ruleId == core.getType(outfit).ruleId && v2 != outfit, "dropped mandatory rule");
        p.nonce = 1;
        p.items[0].body = abi.encode(uint256(1), uint256(2), uint256(1), uint256(42));
        fails(p, "", 0);
        p.items[0] = AT.Item(equip, equipActivation, abi.encode(id), 0);
        fails(p, "", 0);
    }

    function testCurrentPolicyAdministratorCannotBeSpoofed() public {
        vm.prank(author);
        (bool ok,) = address(equipRule).call(abi.encodeCall(equipRule.setAllowed, (false)));
        require(!ok && equipRule.allowed() && equipRule.policyVersion() == 1, "policy admin forged");
    }

    function testImportAndControllerUseSameMandatoryGate() public {
        bytes32 sourceId = publishOutfit();
        AcceptanceCore destination = new AcceptanceCore();
        OutfitRule rule = new OutfitRule(address(destination));
        bytes32 tid = destination.registerType(keccak256("Outfit"), hex"000000", core.getType(outfit).rule);
        bytes32 act = destination.activate(tid, address(rule), keccak256(abi.encode(address(destination))));
        require(!destination.getReceipt(sourceId).accepted, "source receipt became destination admission");
        AT.Plan memory p = AT.Plan(author, address(this), 0, block.timestamp + 100, new AT.Item[](1));
        p.items[0] = AT.Item(tid, act, core.getBody(sourceId), 0);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(123, destination.hashPlan(p));
        bytes32 id = destination.execute(p, abi.encodePacked(r, s, v))[0];
        require(destination.getReceipt(id).core == address(destination) && id != sourceId, "import domain");
        p.nonce = 1;
        p.items[0].body = abi.encode(uint256(1), uint256(2), uint256(1));
        (v, r, s) = vm.sign(123, destination.hashPlan(p));
        (bool ok,) = address(destination).call(abi.encodeCall(destination.execute, (p, abi.encodePacked(r, s, v))));
        require(!ok, "controller bypass");
    }
}
