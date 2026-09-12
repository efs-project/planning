// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {PaidReadProbe} from "./fixtures/PaidReadProbe.sol";

contract PaidReadProbeTest {
    function echo() external pure returns (bytes memory) {
        return hex"ef008000";
    }

    function oversized() external pure returns (bytes memory) {
        return new bytes(8193);
    }

    function testPaidReadCapturesExactReturnedBytes() public {
        PaidReadProbe p = new PaidReadProbe();
        p.capture(address(this), abi.encodeCall(this.echo, ()));
        require(p.lastDigest() == keccak256(abi.encode(hex"ef008000")), "exact returned ABI");
        require(p.lastLength() == 96 && p.lastReads() == 1, "bounded read effect");
    }

    function testPaidReadRefusesLargeReturnWithoutUpdatingEffect() public {
        PaidReadProbe p = new PaidReadProbe();
        (bool ok,) = address(p).call(abi.encodeCall(p.capture, (address(this), abi.encodeCall(this.oversized, ()))));
        require(!ok && p.lastReads() == 0, "bounded refusal");
    }
}
