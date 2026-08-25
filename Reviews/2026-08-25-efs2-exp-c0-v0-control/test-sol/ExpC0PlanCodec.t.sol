// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0PlanCodec} from "../src-sol/ExpC0PlanCodec.sol";

contract ExpC0PlanCodecTest {
    bytes32 internal constant EXPECTED_PLAN = 0x1768a00edb985996fca3199f348e4e73e1408cd973852ec43fa553961dade331;
    bytes32 internal constant EXPECTED_EFFECT_SET = 0x01f935b7491f0a975c45231cc89e7f6292fd0e26bb5b0ea09f170bc0fd0d1df7;
    bytes32 internal constant EXPECTED_OPERATION = 0x7f0a1608eceb675210af92310dce098bfddb7645cfb7fb8d54ac410450660e38;

    function testFrozenPlanOperationVector() external pure {
        ExpC0PlanCodec.AdmissionPlan memory plan = _plan();
        bytes32 planId = ExpC0PlanCodec.admissionPlanId(plan);
        bytes32 effectsId = ExpC0PlanCodec.effectSetId(plan.effects);
        _assertEq(planId, EXPECTED_PLAN);
        _assertEq(effectsId, EXPECTED_EFFECT_SET);
        _assertEq(ExpC0PlanCodec.operationId(planId, effectsId), EXPECTED_OPERATION);
    }

    function testEveryNonEffectPlanCoordinateBindsPlanAndOperationOnly() external pure {
        ExpC0PlanCodec.AdmissionPlan memory plan = _plan();
        bytes32 baselineEffects = ExpC0PlanCodec.effectSetId(plan.effects);

        plan.occurrenceIds[0] = _b32(0x01);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.realmId = _b32(0x02);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.realmRevisionId = _b32(0x03);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.coreCommitment = _b32(0x04);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.semanticAuthor = _b32(0x05);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.actor = _b32(0x06);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.verifierProfileId = _b32(0x07);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.nonceLane += 1;
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.nonce += 1;
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.expiryCoordinate += 1;
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.executorCommitment = _b32(0x08);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.dependencyCommitment = _b32(0x09);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.payer = _b32(0x0a);
        _assertPlanChanged(plan, baselineEffects);
        plan = _plan();
        plan.maximumCost += 1;
        _assertPlanChanged(plan, baselineEffects);

        plan = _plan();
        (plan.occurrenceIds[0], plan.occurrenceIds[1]) = (plan.occurrenceIds[1], plan.occurrenceIds[0]);
        _assertPlanChanged(plan, baselineEffects);
    }

    function testEveryEffectCoordinateBindsPlanEffectSetAndOperation() external {
        ExpC0PlanCodec.AdmissionPlan memory plan = _plan();
        plan.effects[0].kind = 2;
        plan.effects[0].recordId = bytes32(0);
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[0].principalId = _b32(0x11);
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[0].positionKey = _b32(0x12);
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[0].recordId = _b32(0x13);
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[0].expectedRevision += 1;
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[1].queryProfileId = _b32(0x15);
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[1].generation += 1;
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[1].coverageHighWater += 1;
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[1].terminalCount += 1;
        _assertEffectChanged(plan);
        plan = _plan();
        plan.effects[1].terminalPostingsRoot = _b32(0x16);
        _assertEffectChanged(plan);

        plan = _plan();
        (plan.effects[0], plan.effects[1]) = (plan.effects[1], plan.effects[0]);
        _assertInvalidPlan(plan);
    }

    function testEveryEffectKindRejectsEveryInactiveCoordinate() external {
        ExpC0PlanCodec.EffectV0 memory candidate = _effect(1);
        candidate.occurrenceId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.queryProfileId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.generation = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.coverageHighWater = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.terminalCount = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.terminalPostingsRoot = _b32(0xfe);
        _assertInvalidEffect(candidate);

        candidate = _effect(2);
        candidate.recordId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.occurrenceId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.queryProfileId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.generation = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.coverageHighWater = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.terminalCount = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.terminalPostingsRoot = _b32(0xfe);
        _assertInvalidEffect(candidate);

        candidate = _effect(3);
        candidate.positionKey = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.recordId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.expectedRevision = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.queryProfileId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.generation = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.coverageHighWater = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.terminalCount = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.terminalPostingsRoot = _b32(0xfe);
        _assertInvalidEffect(candidate);

        candidate = _effect(4);
        candidate.principalId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.positionKey = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.recordId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.occurrenceId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.expectedRevision = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.coverageHighWater = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.terminalCount = 1;
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.terminalPostingsRoot = _b32(0xfe);
        _assertInvalidEffect(candidate);

        candidate = _effect(5);
        candidate.principalId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(5);
        candidate.positionKey = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(5);
        candidate.recordId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(5);
        candidate.occurrenceId = _b32(0xfe);
        _assertInvalidEffect(candidate);
        candidate = _effect(5);
        candidate.expectedRevision = 1;
        _assertInvalidEffect(candidate);
    }

    function testRequiredEffectTargetsAndGenerationsRejectZeroAndUnknownKinds() external {
        ExpC0PlanCodec.EffectV0 memory candidate = _effect(1);
        candidate.principalId = bytes32(0);
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.positionKey = bytes32(0);
        _assertInvalidEffect(candidate);
        candidate = _effect(1);
        candidate.recordId = bytes32(0);
        _assertInvalidEffect(candidate);

        candidate = _effect(2);
        candidate.principalId = bytes32(0);
        _assertInvalidEffect(candidate);
        candidate = _effect(2);
        candidate.positionKey = bytes32(0);
        _assertInvalidEffect(candidate);

        candidate = _effect(3);
        candidate.principalId = bytes32(0);
        _assertInvalidEffect(candidate);
        candidate = _effect(3);
        candidate.occurrenceId = bytes32(0);
        _assertInvalidEffect(candidate);

        candidate = _effect(4);
        candidate.queryProfileId = bytes32(0);
        _assertInvalidEffect(candidate);
        candidate = _effect(4);
        candidate.generation = 0;
        _assertInvalidEffect(candidate);

        candidate = _effect(5);
        candidate.queryProfileId = bytes32(0);
        _assertInvalidEffect(candidate);
        candidate = _effect(5);
        candidate.generation = 0;
        _assertInvalidEffect(candidate);

        _assertInvalidEffect(_effect(99));
    }

    function testAdvanceCoverageBoundsAndTerminalCoupling() external {
        ExpC0PlanCodec.EffectV0 memory candidate = _effect(5);
        candidate.coverageHighWater = type(uint32).max;
        _assertValidEffect(candidate);

        candidate = _effect(5);
        candidate.terminalCount = 1;
        _assertInvalidEffect(candidate);

        candidate = _effect(5);
        candidate.terminalPostingsRoot = _b32(0xcc);
        _assertValidEffect(candidate);
    }

    function testEffectTargetKeysUseExactKindSpecificTuples() external pure {
        _assertEq(
            ExpC0PlanCodec.effectTargetKey(_effect(1)),
            0x541a7b9370cba0017c8c0da4eb2dd857b679bce10cc581ceb868605ecca89f0c
        );
        _assertEq(
            ExpC0PlanCodec.effectTargetKey(_effect(2)),
            0xe52d03041c5858d6103e7ac333fac79a70490ae4f4d56394928ddce1d6819e39
        );
        _assertEq(
            ExpC0PlanCodec.effectTargetKey(_effect(3)),
            0x82a5a797f201f77aee89a506893f431e36c0ba9c1a7785854b1d8a040a3405ee
        );
        _assertEq(
            ExpC0PlanCodec.effectTargetKey(_effect(4)),
            0x62af3ed2ee7d7de0f50f662ea2b255bcdabc185898000a6637488a07abb85b78
        );
        _assertEq(
            ExpC0PlanCodec.effectTargetKey(_effect(5)),
            0x1e9fb52756a981cdaceb2664fc884573708429dccf744d07aaf9ccc11513dbfb
        );
    }

    function testEffectsRequireKindThenTargetOrderAndRejectDuplicateTarget() external {
        ExpC0PlanCodec.EffectV0 memory bindA = _effect(1);
        ExpC0PlanCodec.EffectV0 memory bindB = _effect(1);
        bindB.principalId = _b32(0x02);
        bindB.positionKey = _b32(0x22);

        ExpC0PlanCodec.EffectV0[] memory effects = new ExpC0PlanCodec.EffectV0[](2);
        effects[0] = bindA;
        effects[1] = bindB;
        ExpC0PlanCodec.effectSetId(effects);

        effects[0] = bindB;
        effects[1] = bindA;
        _assertInvalidEffects(effects);

        effects[0] = bindA;
        effects[1] = bindA;
        _assertInvalidEffects(effects);

        effects[0] = _effect(2);
        effects[1] = bindA;
        _assertInvalidEffects(effects);

        ExpC0PlanCodec.EffectV0 memory generationOne = _effect(5);
        ExpC0PlanCodec.EffectV0 memory generationTwo = _effect(5);
        generationTwo.generation = 2;
        effects[0] = generationOne;
        effects[1] = generationTwo;
        ExpC0PlanCodec.effectSetId(effects);
        effects[0] = generationTwo;
        effects[1] = generationOne;
        _assertInvalidEffects(effects);
    }

    function testOccurrenceIdsRequireOneOrTwoUniqueNonzeroValuesWithoutOpaqueIdSorting() external {
        ExpC0PlanCodec.AdmissionPlan memory plan = _plan();
        bytes32[] memory occurrences = new bytes32[](1);
        occurrences[0] = plan.occurrenceIds[0];
        plan.occurrenceIds = occurrences;
        ExpC0PlanCodec.admissionPlanId(plan);

        plan = _plan();
        plan.occurrenceIds = new bytes32[](0);
        _assertInvalidPlan(plan);

        plan = _plan();
        occurrences = new bytes32[](3);
        occurrences[0] = plan.occurrenceIds[0];
        occurrences[1] = plan.occurrenceIds[1];
        occurrences[2] = _b32(0xef);
        plan.occurrenceIds = occurrences;
        _assertInvalidPlan(plan);

        plan = _plan();
        plan.occurrenceIds[0] = bytes32(0);
        _assertInvalidPlan(plan);

        plan = _plan();
        plan.occurrenceIds[1] = plan.occurrenceIds[0];
        _assertInvalidPlan(plan);

        plan = _plan();
        (plan.occurrenceIds[0], plan.occurrenceIds[1]) = (plan.occurrenceIds[1], plan.occurrenceIds[0]);
        ExpC0PlanCodec.admissionPlanId(plan);
    }

    function _assertPlanChanged(ExpC0PlanCodec.AdmissionPlan memory plan, bytes32 baselineEffects) internal pure {
        bytes32 changedPlan = ExpC0PlanCodec.admissionPlanId(plan);
        require(changedPlan != EXPECTED_PLAN, "plan coordinate did not bind AdmissionPlanId");
        _assertEq(ExpC0PlanCodec.effectSetId(plan.effects), baselineEffects);
        require(
            ExpC0PlanCodec.operationId(changedPlan, baselineEffects) != EXPECTED_OPERATION,
            "plan coordinate did not bind OperationId"
        );
    }

    function _assertEffectChanged(ExpC0PlanCodec.AdmissionPlan memory plan) internal pure {
        bytes32 changedPlan = ExpC0PlanCodec.admissionPlanId(plan);
        bytes32 changedEffects = ExpC0PlanCodec.effectSetId(plan.effects);
        require(changedPlan != EXPECTED_PLAN, "effect coordinate did not bind AdmissionPlanId");
        require(changedEffects != EXPECTED_EFFECT_SET, "effect coordinate did not bind EffectSetId");
        require(
            ExpC0PlanCodec.operationId(changedPlan, changedEffects) != EXPECTED_OPERATION,
            "effect coordinate did not bind OperationId"
        );
    }

    function deriveEffectSetId(ExpC0PlanCodec.EffectV0[] calldata effects) external pure returns (bytes32) {
        return ExpC0PlanCodec.effectSetId(effects);
    }

    function deriveAdmissionPlanId(ExpC0PlanCodec.AdmissionPlan calldata plan) external pure returns (bytes32) {
        return ExpC0PlanCodec.admissionPlanId(plan);
    }

    function _assertInvalidEffect(ExpC0PlanCodec.EffectV0 memory candidate) internal {
        ExpC0PlanCodec.EffectV0[] memory effects = new ExpC0PlanCodec.EffectV0[](1);
        effects[0] = candidate;
        _assertInvalidEffects(effects);
    }

    function _assertValidEffect(ExpC0PlanCodec.EffectV0 memory candidate) internal pure {
        ExpC0PlanCodec.EffectV0[] memory effects = new ExpC0PlanCodec.EffectV0[](1);
        effects[0] = candidate;
        ExpC0PlanCodec.effectSetId(effects);
    }

    function _assertInvalidEffects(ExpC0PlanCodec.EffectV0[] memory effects) internal {
        (bool accepted,) = address(this).call(abi.encodeCall(this.deriveEffectSetId, (effects)));
        require(!accepted, "accepted invalid effects");
    }

    function _assertInvalidPlan(ExpC0PlanCodec.AdmissionPlan memory plan) internal {
        (bool accepted,) = address(this).call(abi.encodeCall(this.deriveAdmissionPlanId, (plan)));
        require(!accepted, "accepted invalid plan");
    }

    function _effect(uint8 kind) internal pure returns (ExpC0PlanCodec.EffectV0 memory candidate) {
        candidate.kind = kind;
        if (kind == 1) {
            candidate.principalId = _b32(0x01);
            candidate.positionKey = _b32(0x11);
            candidate.recordId = _b32(0x21);
        } else if (kind == 2) {
            candidate.principalId = _b32(0x03);
            candidate.positionKey = _b32(0x33);
        } else if (kind == 3) {
            candidate.principalId = _b32(0x04);
            candidate.occurrenceId = _b32(0x44);
        } else if (kind == 4) {
            candidate.queryProfileId = _b32(0x05);
            candidate.generation = 1;
        } else if (kind == 5) {
            candidate.queryProfileId = _b32(0x06);
            candidate.generation = 1;
            candidate.coverageHighWater = 7;
        }
    }

    function _plan() internal pure returns (ExpC0PlanCodec.AdmissionPlan memory plan) {
        bytes32[] memory occurrences = new bytes32[](2);
        occurrences[0] = 0xd4ef0b18b79a80d7794a0e9ab55b74da7a769ec134f5920e926c72a60e5dffb0;
        occurrences[1] = 0xd7666f18fc6fca4641654072f0dd4e780230b1f77d0e3dc33fbd3a67bee25829;

        ExpC0PlanCodec.EffectV0[] memory effects = new ExpC0PlanCodec.EffectV0[](2);
        effects[0] = ExpC0PlanCodec.EffectV0({
            kind: 1,
            principalId: _b32(0xd2),
            positionKey: _b32(0xc1),
            recordId: 0x3fcaf90c6ed3c59d312f2179f4c7eac58c12f338b804c172ba706d003c0e36d3,
            occurrenceId: bytes32(0),
            expectedRevision: 0,
            queryProfileId: bytes32(0),
            generation: 0,
            coverageHighWater: 0,
            terminalCount: 0,
            terminalPostingsRoot: bytes32(0)
        });
        effects[1] = ExpC0PlanCodec.EffectV0({
            kind: 5,
            principalId: bytes32(0),
            positionKey: bytes32(0),
            recordId: bytes32(0),
            occurrenceId: bytes32(0),
            expectedRevision: 0,
            queryProfileId: 0x7deb23272bc24a4c95f099885e1bdd0e26f665d9b6eb55c5a24120032a77b7e1,
            generation: 1,
            coverageHighWater: 2,
            terminalCount: 2,
            terminalPostingsRoot: _b32(0xcc)
        });

        plan = ExpC0PlanCodec.AdmissionPlan({
            occurrenceIds: occurrences,
            realmId: 0x9e289671410f2b79594923c400395dd6196f90419c55b6fc1370ef5a08022633,
            realmRevisionId: 0x6f02a444ef364f0869c54fce0ea261c1d7c017419068d27cbadeb6d25c280ecd,
            coreCommitment: _b32(0x30),
            semanticAuthor: 0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc,
            actor: 0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc,
            verifierProfileId: _b32(0x91),
            nonceLane: 3,
            nonce: 7,
            expiryCoordinate: 100,
            executorCommitment: _b32(0xaa),
            dependencyCommitment: _b32(0xbb),
            payer: 0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc,
            maximumCost: 1_000_000,
            effects: effects
        });
    }

    function _b32(uint8 value) internal pure returns (bytes32) {
        return bytes32(type(uint256).max / type(uint8).max * uint256(value));
    }

    function _assertEq(bytes32 actual, bytes32 expected) internal pure {
        require(actual == expected, "vector mismatch");
    }
}
