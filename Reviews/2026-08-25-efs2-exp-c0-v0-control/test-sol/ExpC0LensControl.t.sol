// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0LensControl} from "../src-sol/ExpC0LensControl.sol";

contract ExpC0LensControlTest {
    ExpC0LensControl internal control;
    bytes32[4] internal measuredPlanIds;
    bytes32[4] internal measuredFieldRoles;
    bytes32[4] internal measuredBases;

    event LensGas(uint8 principalCount, uint8 scenario, uint256 gasUsed, uint256 probeCount);

    function setUp() external {
        control = new ExpC0LensControl();
        uint8[4] memory counts = [uint8(1), 8, 32, 64];
        for (uint256 c; c < counts.length; ++c) {
            ExpC0LensControl.ResolutionPlan memory plan = _plan(counts[c]);
            measuredPlanIds[c] = control.registerPlan(plan);
            measuredFieldRoles[c] = keccak256(abi.encode("measured-field-role", counts[c]));
            measuredBases[c] = keccak256(abi.encode("measured-basis", counts[c]));
            for (uint256 i; i < counts[c]; ++i) {
                uint8 status = i + 1 == counts[c] ? control.STATUS_FOUND() : control.STATUS_ABSENT_PROVEN();
                bytes32 recordId = status == control.STATUS_FOUND() ? bytes32(uint256(0x1000 + i)) : bytes32(0);
                control.setPointEvidence(
                    measuredPlanIds[c], plan.principals[i], measuredFieldRoles[c], measuredBases[c], status, recordId
                );
            }
        }
    }

    function testPlansAt1_8_32_64AndGasEnvelope() external {
        uint8[4] memory counts = [uint8(1), 8, 32, 64];
        for (uint256 c; c < counts.length; ++c) {
            uint256 beforeGas = gasleft();
            ExpC0LensControl.ResolutionResult memory result =
                control.resolve(measuredPlanIds[c], measuredFieldRoles[c], measuredBases[c]);
            uint256 coldUsed = beforeGas - gasleft();
            emit LensGas(counts[c], 1, coldUsed, result.probes.length);
            require(result.selectedPresent, "last FOUND must select");
            require(result.probes.length == counts[c], "must retain every losing probe");
            require(coldUsed < 8_000_000, "disposable 64-principal control exceeds block-like envelope");

            beforeGas = gasleft();
            result = control.resolve(measuredPlanIds[c], measuredFieldRoles[c], measuredBases[c]);
            uint256 warmUsed = beforeGas - gasleft();
            emit LensGas(counts[c], 2, warmUsed, result.probes.length);
            require(warmUsed <= coldUsed, "second read should not cost more");
        }
    }

    function testFirstFoundStopsAndUnknownBlocksFallback() external {
        ExpC0LensControl.ResolutionPlan memory plan = _plan(8);
        bytes32 planId = control.registerPlan(plan);
        bytes32 fieldRole = keccak256("field-role");
        bytes32 basis = keccak256("basis");

        control.setPointEvidence(
            planId, plan.principals[0], fieldRole, basis, control.STATUS_FOUND(), bytes32(uint256(99))
        );
        ExpC0LensControl.ResolutionResult memory first = control.resolve(planId, fieldRole, basis);
        require(first.selectedPresent && first.probes.length == 1, "first FOUND must stop");

        control.setPointEvidence(
            planId, plan.principals[0], fieldRole, basis, control.STATUS_ABSENT_PROVEN(), bytes32(0)
        );
        control.setPointEvidence(planId, plan.principals[1], fieldRole, basis, control.STATUS_UNKNOWN(), bytes32(0));
        control.setPointEvidence(
            planId, plan.principals[2], fieldRole, basis, control.STATUS_FOUND(), bytes32(uint256(100))
        );
        ExpC0LensControl.ResolutionResult memory blocked = control.resolve(planId, fieldRole, basis);
        require(!blocked.selectedPresent, "UNKNOWN must block fallback");
        require(blocked.probes.length == 2, "must stop at UNKNOWN");
        require(blocked.terminalStatus == control.STATUS_UNKNOWN(), "terminal status");
    }

    function testResolveDerivesPositionFromStoredPlanScopeAndFieldRole() external {
        ExpC0LensControl.ResolutionPlan memory plan = _plan(1);
        bytes32 planId = control.registerPlan(plan);
        bytes32 fieldRole = keccak256("field-role");
        bytes32 basis = keccak256("basis");
        bytes32 expectedPosition = keccak256(
            abi.encode(keccak256("EFS2/EXP-C0/V0/POSITION"), uint16(0), plan.purpose, plan.subject, fieldRole)
        );
        control.setPointEvidence(
            planId, plan.principals[0], fieldRole, basis, control.STATUS_FOUND(), bytes32(uint256(99))
        );

        ExpC0LensControl.ResolutionResult memory result = control.resolve(planId, fieldRole, basis);
        require(result.selectedPresent, "fieldRole must resolve through the derived PositionKey");
        require(result.probes[0].positionKey == expectedPosition, "probe must retain derived Plan scope");
        require(result.probes[0].positionKey != fieldRole, "fieldRole must not be trusted as PositionKey");
    }

    function testRawPositionWriteEscapeHatchIsNotCallable() external {
        ExpC0LensControl.ResolutionPlan memory plan = _plan(1);
        control.registerPlan(plan);
        bytes32 arbitraryPosition = keccak256("unrelated-position");
        bytes32 basis = keccak256("basis");
        bytes4 oldSelector = bytes4(keccak256("setPointEvidence(bytes32,bytes32,bytes32,uint8,bytes32)"));
        (bool ok,) = address(control)
            .call(
                abi.encodeWithSelector(
                    oldSelector,
                    plan.principals[0],
                    arbitraryPosition,
                    basis,
                    control.STATUS_FOUND(),
                    bytes32(uint256(99))
                )
            );
        require(!ok, "raw arbitrary PositionKey write escape hatch must reject");
    }

    function testPointEvidenceRejectsPrincipalOutsideRetainedPlan() external {
        ExpC0LensControl.ResolutionPlan memory plan = _plan(1);
        bytes32 planId = control.registerPlan(plan);
        (bool ok,) = address(control)
            .call(
                abi.encodeCall(
                    ExpC0LensControl.setPointEvidence,
                    (
                        planId,
                        bytes32(uint256(999)),
                        keccak256("field-role"),
                        keccak256("basis"),
                        control.STATUS_FOUND(),
                        bytes32(uint256(99))
                    )
                )
            );
        require(!ok, "evidence Principal must be a retained Plan member");
    }

    function testAllProvedAbsentAndUnregisteredSubstitution() external {
        ExpC0LensControl.ResolutionPlan memory plan = _plan(8);
        bytes32 planId = control.registerPlan(plan);
        bytes32 fieldRole = keccak256("field-role");
        bytes32 basis = keccak256("basis");
        for (uint256 i; i < plan.principals.length; ++i) {
            control.setPointEvidence(
                planId, plan.principals[i], fieldRole, basis, control.STATUS_ABSENT_PROVEN(), bytes32(0)
            );
        }
        ExpC0LensControl.ResolutionResult memory absent = control.resolve(planId, fieldRole, basis);
        require(!absent.selectedPresent, "absence has no selection");
        require(absent.terminalStatus == control.STATUS_ABSENT_PROVEN(), "terminal proved absence");

        plan.subject = bytes32(uint256(999));
        bytes32 substituted = control.resolutionPlanId(plan);
        require(substituted != planId, "substitution must change plan ID");
        (bool ok,) = address(control).call(abi.encodeCall(ExpC0LensControl.resolve, (substituted, fieldRole, basis)));
        require(!ok, "unregistered beneficiary substitution must reject");
    }

    function testResolutionPlanPurposeBindsAll256Bits() external view {
        ExpC0LensControl.ResolutionPlan memory low = _plan(1);
        low.purpose = bytes32(uint256(1));
        ExpC0LensControl.ResolutionPlan memory high = _plan(1);
        high.purpose = bytes32((uint256(1) << 248) | 1);
        require(control.resolutionPlanId(low) != control.resolutionPlanId(high), "purpose truncation");
    }

    function testZeroPlanCoordinatesAndFieldRoleReject() external {
        ExpC0LensControl.ResolutionPlan memory plan = _plan(1);
        plan.purpose = bytes32(0);
        (bool ok,) = address(control).call(abi.encodeCall(ExpC0LensControl.registerPlan, (plan)));
        require(!ok, "zero purpose must reject");

        plan = _plan(1);
        plan.subject = bytes32(0);
        (ok,) = address(control).call(abi.encodeCall(ExpC0LensControl.registerPlan, (plan)));
        require(!ok, "zero subject must reject");

        plan = _plan(1);
        bytes32 planId = control.registerPlan(plan);
        bytes32 basis = keccak256("basis");
        (ok,) = address(control)
            .call(
                abi.encodeCall(
                    ExpC0LensControl.setPointEvidence,
                    (planId, plan.principals[0], bytes32(0), basis, control.STATUS_FOUND(), bytes32(uint256(99)))
                )
            );
        require(!ok, "zero fieldRole write must reject");
        (ok,) = address(control).call(abi.encodeCall(ExpC0LensControl.resolve, (planId, bytes32(0), basis)));
        require(!ok, "zero fieldRole resolve must reject");
    }

    function _plan(uint8 count) internal pure returns (ExpC0LensControl.ResolutionPlan memory plan) {
        plan.purpose = keccak256("EFS2/EXP-C0/V0/PURPOSE/FILES");
        plan.subject = bytes32(uint256(0x1234));
        plan.principals = new bytes32[](count);
        for (uint256 i; i < count; ++i) {
            plan.principals[i] = bytes32(i + 1);
        }
        plan.combiner = 1;
        plan.maximumProbes = count;
    }
}
