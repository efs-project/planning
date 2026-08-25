// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Isolated EXP-C0/v0 AdmissionPlan identity parity control.
/// @dev Rejects noncanonical effects and occurrence sets before encoding. It
///      never sorts: callers must supply occurrence leaf order and canonical
///      effect order.
library ExpC0PlanCodec {
    uint16 internal constant PROFILE_VERSION = 0;

    bytes32 internal constant DOMAIN_ADMISSION_PLAN = keccak256("EFS2/EXP-C0/V0/ADMISSION_PLAN");
    bytes32 internal constant DOMAIN_EFFECT_SET = keccak256("EFS2/EXP-C0/V0/EFFECT_SET");
    bytes32 internal constant DOMAIN_OPERATION = keccak256("EFS2/EXP-C0/V0/OPERATION");

    error InvalidEffect(uint8 kind);
    error InvalidEffectCount(uint256 count);
    error EffectOrder(uint256 index);
    error DuplicateEffectTarget(uint256 index);
    error InvalidOccurrenceCount(uint256 count);
    error ZeroOccurrenceId(uint256 index);
    error DuplicateOccurrenceId();

    struct EffectV0 {
        uint8 kind;
        bytes32 principalId;
        bytes32 positionKey;
        bytes32 recordId;
        bytes32 occurrenceId;
        uint32 expectedRevision;
        bytes32 queryProfileId;
        uint32 generation;
        uint32 coverageHighWater;
        uint32 terminalCount;
        bytes32 terminalPostingsRoot;
    }

    struct AdmissionPlan {
        bytes32[] occurrenceIds;
        bytes32 realmId;
        bytes32 realmRevisionId;
        bytes32 coreCommitment;
        bytes32 semanticAuthor;
        bytes32 actor;
        bytes32 verifierProfileId;
        uint32 nonceLane;
        uint64 nonce;
        uint64 expiryCoordinate;
        bytes32 executorCommitment;
        bytes32 dependencyCommitment;
        bytes32 payer;
        uint64 maximumCost;
        EffectV0[] effects;
    }

    function validateEffect(EffectV0 memory effect) internal pure {
        if (effect.kind == 1) {
            if (
                effect.principalId == bytes32(0) || effect.positionKey == bytes32(0) || effect.recordId == bytes32(0)
                    || effect.occurrenceId != bytes32(0) || effect.queryProfileId != bytes32(0)
                    || effect.generation != 0 || effect.coverageHighWater != 0 || effect.terminalCount != 0
                    || effect.terminalPostingsRoot != bytes32(0)
            ) revert InvalidEffect(effect.kind);
            return;
        }

        if (effect.kind == 2) {
            if (
                effect.principalId == bytes32(0) || effect.positionKey == bytes32(0) || effect.recordId != bytes32(0)
                    || effect.occurrenceId != bytes32(0) || effect.queryProfileId != bytes32(0)
                    || effect.generation != 0 || effect.coverageHighWater != 0 || effect.terminalCount != 0
                    || effect.terminalPostingsRoot != bytes32(0)
            ) revert InvalidEffect(effect.kind);
            return;
        }

        if (effect.kind == 3) {
            if (
                effect.principalId == bytes32(0) || effect.occurrenceId == bytes32(0)
                    || effect.positionKey != bytes32(0) || effect.recordId != bytes32(0) || effect.expectedRevision != 0
                    || effect.queryProfileId != bytes32(0) || effect.generation != 0 || effect.coverageHighWater != 0
                    || effect.terminalCount != 0 || effect.terminalPostingsRoot != bytes32(0)
            ) revert InvalidEffect(effect.kind);
            return;
        }

        if (effect.kind == 4) {
            if (
                effect.queryProfileId == bytes32(0) || effect.generation == 0 || effect.principalId != bytes32(0)
                    || effect.positionKey != bytes32(0) || effect.recordId != bytes32(0)
                    || effect.occurrenceId != bytes32(0) || effect.expectedRevision != 0
                    || effect.coverageHighWater != 0 || effect.terminalCount != 0
                    || effect.terminalPostingsRoot != bytes32(0)
            ) revert InvalidEffect(effect.kind);
            return;
        }

        if (effect.kind == 5) {
            if (
                effect.queryProfileId == bytes32(0) || effect.generation == 0 || effect.principalId != bytes32(0)
                    || effect.positionKey != bytes32(0) || effect.recordId != bytes32(0)
                    || effect.occurrenceId != bytes32(0) || effect.expectedRevision != 0
                    || (effect.terminalPostingsRoot == bytes32(0) && effect.terminalCount != 0)
            ) revert InvalidEffect(effect.kind);
            return;
        }

        revert InvalidEffect(effect.kind);
    }

    function effectTargetKey(EffectV0 memory effect) internal pure returns (bytes32) {
        validateEffect(effect);
        return _effectTargetKey(effect);
    }

    function validateEffects(EffectV0[] memory effects) internal pure {
        if (effects.length == 0 || effects.length > 4) revert InvalidEffectCount(effects.length);

        uint8 previousKind;
        bytes32 previousTargetKey;
        for (uint256 i; i < effects.length; ++i) {
            validateEffect(effects[i]);
            uint8 kind = effects[i].kind;
            bytes32 targetKey = _effectTargetKey(effects[i]);
            if (kind < previousKind) revert EffectOrder(i);
            if (kind == previousKind) {
                if (targetKey == previousTargetKey) revert DuplicateEffectTarget(i);
                if (uint256(targetKey) < uint256(previousTargetKey)) revert EffectOrder(i);
            }
            previousKind = kind;
            previousTargetKey = targetKey;
        }
    }

    function validateAdmissionPlan(AdmissionPlan memory plan) internal pure {
        if (plan.occurrenceIds.length == 0 || plan.occurrenceIds.length > 2) {
            revert InvalidOccurrenceCount(plan.occurrenceIds.length);
        }

        // IDs are supplied in the source PublicationSet's leafIndex order.
        // Opaque OccurrenceIds do not reveal leafIndex and must never be sorted.
        for (uint256 i; i < plan.occurrenceIds.length; ++i) {
            if (plan.occurrenceIds[i] == bytes32(0)) revert ZeroOccurrenceId(i);
        }
        if (plan.occurrenceIds.length == 2 && plan.occurrenceIds[0] == plan.occurrenceIds[1]) {
            revert DuplicateOccurrenceId();
        }

        validateEffects(plan.effects);
    }

    function _effectTargetKey(EffectV0 memory effect) private pure returns (bytes32) {
        if (effect.kind == 1 || effect.kind == 2) {
            return keccak256(abi.encode(effect.principalId, effect.positionKey));
        }
        if (effect.kind == 3) {
            return keccak256(abi.encode(effect.principalId, effect.occurrenceId));
        }
        if (effect.kind == 4 || effect.kind == 5) {
            return keccak256(abi.encode(effect.queryProfileId, effect.generation));
        }
        revert InvalidEffect(effect.kind);
    }

    function admissionPlanId(AdmissionPlan memory plan) internal pure returns (bytes32) {
        validateAdmissionPlan(plan);
        return keccak256(abi.encode(DOMAIN_ADMISSION_PLAN, PROFILE_VERSION, plan));
    }

    function effectSetId(EffectV0[] memory effects) internal pure returns (bytes32) {
        validateEffects(effects);
        return keccak256(abi.encode(DOMAIN_EFFECT_SET, PROFILE_VERSION, effects));
    }

    function operationId(bytes32 planId, bytes32 effectsId) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_OPERATION, PROFILE_VERSION, planId, effectsId));
    }
}
