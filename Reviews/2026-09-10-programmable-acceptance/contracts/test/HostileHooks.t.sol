// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ApplicationFixture} from "./ApplicationRules.t.sol";
import {AcceptanceCore} from "../src/AcceptanceCore.sol";
import {AT} from "../src/AcceptanceTypes.sol";
import {PaidClaimRule} from "../src/PaidClaimRule.sol";

contract TestTreasury {
    AcceptanceCore public core;
    bool public reject;

    constructor(AcceptanceCore c, bool r) {
        core = c;
        reject = r;
    }

    receive() external payable {
        require(!reject, "treasury rejected");
        (bool ok,) = address(core).call(abi.encodeCall(core.retainRaw, (bytes32(0))));
        require(!ok, "treasury reentered");
    }
}

contract HostileHook {
    AcceptanceCore public core;
    uint256 public behavior;
    uint256 public writes;
    bytes32 public config;
    bytes32 public local;

    constructor(AcceptanceCore c, uint256 b) {
        core = c;
        behavior = b;
        config = bytes32(b);
        local = keccak256(abi.encode(c));
    }

    function binding() external view returns (address, bytes32, bytes32) {
        if (behavior == 10) assembly { return(0, 32) }
        if (behavior == 11) assembly { return(0, 65536) }
        if (behavior == 12) revert("binding refused");
        return (address(core), config, local);
    }

    function alterConfig() external {
        local = bytes32(uint256(55));
    }

    function accept(AT.Context calldata c, bytes calldata body) external payable returns (bytes32, bytes32) {
        if (behavior == 1) return (0, 0);
        if (behavior == 2) revert("hostile");
        if (behavior == 3) assembly { return(0, 32) }
        if (behavior == 4) assembly { return(0, 65536) }
        if (behavior == 5) ++writes;
        if (behavior == 6) while (gasleft() > 0) ++writes;
        if (behavior == 7) {
            (bool ok,) = address(core).call(abi.encodeCall(core.retainRaw, (bytes32(0))));
            require(!ok, "raw reentry");
            (ok,) = address(core).call(abi.encodeCall(core.registerType, (bytes32(0), hex"00", AT.Rule(0, 0, 0, 0))));
            require(!ok, "register reentry");
            (ok,) = address(core).call(abi.encodeCall(core.activate, (c.typeId, address(this), local)));
            require(!ok, "activation reentry");
            AT.Plan memory p = AT.Plan(address(this), address(0), 0, block.timestamp + 1, new AT.Item[](1));
            p.items[0] = AT.Item(c.typeId, c.activationId, body, 0);
            (ok,) = address(core).call(abi.encodeCall(core.execute, (p, "")));
            require(!ok, "execute reentry");
        }
        if (behavior == 8) {
            require(!core.getReceipt(core.receiptId(c.planId, c.index)).accepted, "own candidate already accepted");
            require(c.author != address(0) && c.bodyHash == keccak256(body), "unauthenticated payload");
        }
        if (behavior == 9) {
            address priorHook = abi.decode(body, (address));
            require(PaidClaimRule(priorHook).count() == 1, "prior dependent counter unavailable");
            require(
                c.index > 0 && core.getReceipt(core.receiptId(c.planId, c.index - 1)).accepted, "prior receipt absent"
            );
            require(!core.getReceipt(core.receiptId(c.planId, c.index)).accepted, "own receipt visible early");
        }
        return (keccak256("efs.acceptance.ok.v1"), bytes32(writes));
    }
}

contract HostileHooksTest is ApplicationFixture {
    function hostile(uint256 behavior, uint8 mode) internal returns (AT.Plan memory p, HostileHook h) {
        h = new HostileHook(core, behavior);
        bytes32 t = registerHook("hostile", hex"02", address(h), bytes32(behavior), mode);
        bytes32 a = core.activate(t, address(h), keccak256(abi.encode(core)));
        p = plan(abi.encode(bytes32(uint256(1))));
        p.items[0] = AT.Item(t, a, p.items[0].body, 0);
    }

    function testFalseRevertMalformedOversizedStaticMutationAndGasExhaustionRefused() public {
        for (uint256 b = 1; b <= 6; ++b) {
            (AT.Plan memory p, HostileHook h) = hostile(b, b == 5 ? 1 : 2);
            fails(p, "", 0);
            require(h.writes() == 0 && core.nonces(author) == 0, "hostile effects retained");
        }
    }

    function testEveryCoreMutationLockedButAuthenticatedReadsAvailable() public {
        (AT.Plan memory p,) = hostile(7, 2);
        vm.prank(author);
        require(core.execute(p, "").length == 1, "locked boundary failed");
        (p,) = hostile(8, 1);
        vm.prank(author);
        require(core.execute(p, "").length == 1, "candidate/read semantics");
    }

    function testNoCodeImpostorCodeWrongConfigAndWrongCoreActivationRefused() public {
        (bool ok,) = address(core).call(abi.encodeCall(core.activate, (claim, address(0x123), bytes32(0))));
        require(!ok, "no code activation");
        HostileHook h = new HostileHook(core, 0);
        (ok,) = address(core).call(abi.encodeCall(core.activate, (claim, address(h), keccak256(abi.encode(core)))));
        require(!ok, "impostor code");
        (ok,) = address(core).call(abi.encodeCall(core.activate, (claim, address(paid), bytes32(0))));
        require(!ok, "wrong config");
        AcceptanceCore other = new AcceptanceCore();
        bytes32 t = other.registerType(keccak256("Claim"), hex"02", core.getType(claim).rule);
        (ok,) = address(other)
            .call(abi.encodeCall(other.activate, (t, address(paid), keccak256(abi.encode(address(core), treasury)))));
        require(!ok, "wrong bound Core");
    }

    function testCodeAndBindingRecheckedAtExecutionAndReadsStayHistorical() public {
        (AT.Plan memory p, HostileHook h) = hostile(8, 1);
        vm.prank(author);
        bytes32 id = core.execute(p, "")[0];
        h.alterConfig();
        p.nonce = 1;
        fails(p, "", 0);
        require(core.getReceipt(id).accepted, "history depends on live hook");
        vm.etch(address(h), hex"00");
        fails(p, "", 0);
        require(core.getBody(id).length == 32, "read reruns changed code");
    }

    function testFundingAndMalformedLateItemPreflight() public {
        AT.Plan memory p = claimPlan(bytes32(uint256(101)));
        fails(p, "", 0);
        fails(p, "", 2 ether);
        AT.Item memory first = p.items[0];
        p.items = new AT.Item[](2);
        p.items[0] = first;
        p.items[1] = AT.Item(note, 0, hex"01", 0);
        vm.expectCall(address(paid), abi.encodePacked(paid.accept.selector), uint64(0));
        fails(p, "", 1 ether);
        require(paid.count() == 0 && treasury.balance == 0, "preflight effects");
    }

    function testTreasuryReentryCannotMutateAndRejectionRollsBack() public {
        for (uint256 i; i < 2; ++i) {
            TestTreasury recipient = new TestTreasury(core, i == 1);
            PaidClaimRule rule = new PaidClaimRule(address(core), address(recipient), 1 ether);
            bytes32 tid = core.registerType(keccak256("Treasury claim"), hex"02", core.getType(claim).rule);
            bytes32 act = core.activate(tid, address(rule), keccak256(abi.encode(core, recipient)));
            AT.Plan memory p = claimPlan(bytes32(uint256(333)));
            p.items[0].typeId = tid;
            p.items[0].activationId = act;
            if (i == 0) {
                vm.prank(author);
                core.execute{value: 1 ether}(p, "");
                require(address(recipient).balance == 1 ether, "treasury unpaid");
            } else {
                fails(p, "", 1 ether);
                require(
                    rule.count() == 0 && !rule.used(bytes32(uint256(333))) && address(recipient).balance == 0,
                    "treasury failure effects"
                );
            }
        }
    }

    function testBoundedDiagnosticIdentifiesHookItemAndFundingShape() public {
        AT.Plan memory p = outfitPlan(1, 2, 1);
        vm.expectRevert(abi.encodeWithSignature("HookRefused(uint256)", uint256(0)));
        vm.prank(author);
        core.execute(p, "");
        p = claimPlan(bytes32(uint256(22)));
        vm.expectRevert(abi.encodeWithSignature("IncorrectFunding(uint256,uint256)", uint256(1 ether), uint256(0)));
        vm.prank(author);
        core.execute(p, "");
        p = plan(hex"01");
        vm.expectRevert(abi.encodeWithSignature("InvalidItem(uint256)", uint256(0)));
        vm.prank(author);
        core.execute(p, "");
    }

    function testMalformedBindingAndSemanticConfigSubstitutionRefused() public {
        for (uint256 i = 10; i <= 12; ++i) {
            HostileHook h = new HostileHook(core, i);
            bytes32 tid = registerHook("bad binding", hex"02", address(h), bytes32(i), 1);
            (bool ok,) =
                address(core).call(abi.encodeCall(core.activate, (tid, address(h), keccak256(abi.encode(core)))));
            require(!ok, "malformed binding accepted");
        }
        PaidClaimRule differentFee = new PaidClaimRule(address(core), treasury, 2 ether);
        (bool accepted,) = address(core)
            .call(abi.encodeCall(core.activate, (claim, address(differentFee), keccak256(abi.encode(core, treasury)))));
        require(!accepted, "semantic fee substitution");
    }

    function testLaterHookObservesStagedCounterAndReceiptButNotOwnCandidate() public {
        (AT.Plan memory second,) = hostile(9, 1);
        second.items[0].body = abi.encode(address(paid));
        AT.Plan memory p = claimPlan(bytes32(uint256(666)));
        AT.Item memory first = p.items[0];
        p.items = new AT.Item[](2);
        p.items[0] = first;
        p.items[1] = second.items[0];
        vm.prank(author);
        bytes32[] memory ids = core.execute{value: 1 ether}(p, "");
        require(
            ids.length == 2 && core.getReceipt(ids[1]).accepted && paid.count() == 1 && treasury.balance == 1 ether,
            "staged effects"
        );
    }

    function testForcedBalanceNeverBecomesAdmissionCredit() public {
        vm.deal(address(core), 3 ether);
        AT.Plan memory p = claimPlan(bytes32(uint256(555)));
        fails(p, "", 0);
        vm.prank(author);
        core.execute{value: 1 ether}(p, "");
        require(address(core).balance == 3 ether && treasury.balance == 1 ether, "forced balance spent as credit");
    }
}
