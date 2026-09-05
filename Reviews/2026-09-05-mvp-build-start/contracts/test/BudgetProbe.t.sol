// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BudgetProbe} from "../src/BudgetProbe.sol";

contract BudgetProbeTest {
    event Measurement(string arm, uint256 payloadBytes, uint256 charged, uint256 outerGas);

    function testStipendCommitsSemanticCarrierAndFullReservation() public {
        BudgetProbe p = new BudgetProbe(2_000_000);
        uint256 beforeGas = gasleft();
        uint256 charged = p.stipend(hex"aabbcc", 200_000, false);
        uint256 used = beforeGas - gasleft();
        require(p.nonce() == 1 && p.remaining() == 1_800_000, "atomic reservation");
        require(charged == 200_000, "full allowance charged");
        require(p.head() == keccak256(hex"aabbcc"), "semantic head");
        require(keccak256(p.retained(p.head())) == keccak256(hex"aabbcc"), "retained bytes");
        emit Measurement("stipend", 3, charged, used);
    }

    function testMeasuredCommitsAndChargesWorkPlusTail() public {
        BudgetProbe p = new BudgetProbe(2_000_000);
        uint256 beforeGas = gasleft();
        uint256 charged = p.measured(hex"aabbcc", 200_000, false);
        uint256 used = beforeGas - gasleft();
        require(charged > 50_000 && charged <= 200_000, "nontrivial bounded charge");
        require(p.nonce() == 1 && p.remaining() == 2_000_000 - charged, "atomic measured charge");
        require(p.head() == keccak256(hex"aabbcc"), "semantic head");
        require(keccak256(p.retained(p.head())) == keccak256(hex"aabbcc"), "retained bytes");
        emit Measurement("measured", 3, charged, used);
    }

    function _failure(bool metered, uint256 cap, bool lateFailure) internal {
        BudgetProbe p = new BudgetProbe(2_000_000);
        bytes memory payload = hex"ffeedd";
        (bool ok,) = address(p).call(abi.encodeWithSelector(
            metered ? p.measured.selector : p.stipend.selector, payload, cap, lateFailure
        ));
        require(!ok, "must fail");
        require(p.nonce() == 0 && p.remaining() == 2_000_000 && p.head() == 0, "all semantic state rolls back");
        require(p.retained(keccak256(payload)).length == 0, "carrier rollback");
    }

    function testChildOutOfGasRollsBackReservation() public { _failure(false, 10_000, false); }
    function testMeasuredExcessRollsBackCarrier() public { _failure(true, 10_000, false); }
    function testLateFailureRollsBackStipend() public { _failure(false, 200_000, true); }
    function testLateFailureRollsBackMeasured() public { _failure(true, 200_000, true); }

    function testDirectWorkCannotBypassBudget() public {
        BudgetProbe p = new BudgetProbe(2_000_000);
        (bool ok,) = address(p).call(abi.encodeCall(p.work, (hex"aa", false)));
        require(!ok && p.nonce() == 0 && p.head() == 0, "self-only work");
    }

    function testAggregateReservationCannotBeOverspent() public {
        BudgetProbe p = new BudgetProbe(200_000);
        p.stipend(hex"aabb", 200_000, false);
        (bool ok,) = address(p).call(abi.encodeCall(p.stipend, (hex"ccdd", 1, false)));
        require(!ok && p.nonce() == 1 && p.remaining() == 0, "exhausted");
        require(p.head() == keccak256(hex"aabb"), "old state preserved");
    }

    function testFuzzPayloadBothArms(uint16 size) public {
        uint256 length = uint256(size) % 1025;
        bytes memory data = new bytes(length);
        for (uint256 i; i < length; ++i) data[i] = bytes1(uint8(i % 251));
        BudgetProbe a = new BudgetProbe(4_000_000);
        BudgetProbe b = new BudgetProbe(4_000_000);
        a.stipend(data, 2_000_000, false);
        b.measured(data, 2_000_000, false);
        require(a.head() == keccak256(data) && b.head() == a.head(), "same semantic effect");
        require(keccak256(a.retained(a.head())) == keccak256(data), "stipend bytes");
        require(keccak256(b.retained(b.head())) == keccak256(data), "measured bytes");
    }
}
