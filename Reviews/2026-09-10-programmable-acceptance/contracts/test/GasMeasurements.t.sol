// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ApplicationFixture} from "./ApplicationRules.t.sol";
import {AT} from "../src/AcceptanceTypes.sol";

/// @notice Deterministic local function-call gas, excluding transaction intrinsic gas and deployment/setup.
contract GasMeasurementsTest is ApplicationFixture {
    event log_named_uint(string key, uint256 value);

    function testRepresentativeGasAndRetainedBodyBytes() public {
        AT.Plan memory p = outfitPlan(1, 1, 1);
        vm.prank(author);
        uint256 beforeGas = gasleft();
        bytes32 outfitId = core.execute(p, "")[0];
        emit log_named_uint("Outfit execute", beforeGas - gasleft());
        p = plan(abi.encode(outfitId));
        p.items[0] = AT.Item(equip, equipActivation, p.items[0].body, 0);
        vm.prank(author);
        beforeGas = gasleft();
        bytes32 equipId = core.execute(p, "")[0];
        emit log_named_uint("Equip execute", beforeGas - gasleft());
        p = claimPlan(bytes32(uint256(765)));
        vm.prank(author);
        beforeGas = gasleft();
        bytes32 claimId = core.execute{value: 1 ether}(p, "")[0];
        emit log_named_uint("Paid claim execute", beforeGas - gasleft());
        vm.prank(author);
        beforeGas = gasleft();
        core.execute(p, "");
        emit log_named_uint("Exact retry", beforeGas - gasleft());
        beforeGas = gasleft();
        AT.Receipt memory r = core.getReceipt(claimId);
        bytes memory body = core.getBody(claimId);
        emit log_named_uint("Warm receipt and body read", beforeGas - gasleft());
        require(r.accepted && r.author == author && body.length == 32, "read benchmark correctness");
        emit log_named_uint(
            "Body bytes retained across three actions",
            core.getBody(outfitId).length + core.getBody(equipId).length + body.length
        );
        require(address(core).balance == 0 && treasury.balance == 1 ether, "benchmark funding");
    }
}
