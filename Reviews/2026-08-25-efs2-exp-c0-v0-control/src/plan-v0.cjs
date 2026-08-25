'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');

const abi = AbiCoder.defaultAbiCoder();
const PROFILE_VERSION = 0;
const ZERO_BYTES32 = `0x${'00'.repeat(32)}`;
const domain = (name) => keccak256(toUtf8Bytes(name));

const DOMAINS = Object.freeze({
  admissionPlan: domain('EFS2/EXP-C0/V0/ADMISSION_PLAN'),
  effectSet: domain('EFS2/EXP-C0/V0/EFFECT_SET'),
  operation: domain('EFS2/EXP-C0/V0/OPERATION'),
});

const EFFECT_V0_ABI = 'tuple(uint8,bytes32,bytes32,bytes32,bytes32,uint32,bytes32,uint32,uint32,uint32,bytes32)';
const ADMISSION_PLAN_ABI = `tuple(bytes32[],bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,uint64,uint64,bytes32,bytes32,bytes32,uint64,${EFFECT_V0_ABI}[])`;

function uintValue(value, bits, label) {
  let parsed;
  if (typeof value === 'bigint') {
    parsed = value;
  } else if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be an unsigned integer`);
    parsed = BigInt(value);
  } else if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) {
    parsed = BigInt(value);
  } else {
    throw new TypeError(`${label} must be an unsigned integer`);
  }

  if (parsed < 0n || parsed >= (1n << BigInt(bits))) {
    throw new RangeError(`${label} must fit uint${bits}`);
  }
  return parsed;
}

function bytes32Value(value, label) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new TypeError(`${label} must be bytes32`);
  }
  return value.toLowerCase();
}

function requireZeroId(value, label) {
  if (bytes32Value(value, label) !== ZERO_BYTES32) throw new Error(`${label} must be zero`);
}

function requireNonzeroId(value, label) {
  if (bytes32Value(value, label) === ZERO_BYTES32) throw new Error(`${label} must be nonzero`);
}

function requireZeroUint(value, bits, label) {
  if (uintValue(value, bits, label) !== 0n) throw new Error(`${label} must be zero`);
}

function effectKind(effect) {
  return Number(uintValue(effect.kind, 8, 'effect kind'));
}

function validateEffect(effect) {
  if (effect === null || typeof effect !== 'object' || Array.isArray(effect)) {
    throw new TypeError('effect must be an object');
  }

  const kind = effectKind(effect);
  const expectedRevision = uintValue(effect.expectedRevision, 32, 'expectedRevision');
  const generation = uintValue(effect.generation, 32, 'generation');
  const coverageHighWater = uintValue(effect.coverageHighWater, 32, 'coverageHighWater');
  const terminalCount = uintValue(effect.terminalCount, 32, 'terminalCount');

  switch (kind) {
    case 1: // BIND
      requireNonzeroId(effect.principalId, 'BIND principalId');
      requireNonzeroId(effect.positionKey, 'BIND positionKey');
      requireNonzeroId(effect.recordId, 'BIND recordId');
      requireZeroId(effect.occurrenceId, 'BIND occurrenceId');
      requireZeroId(effect.queryProfileId, 'BIND queryProfileId');
      requireZeroId(effect.terminalPostingsRoot, 'BIND terminalPostingsRoot');
      requireZeroUint(generation, 32, 'BIND generation');
      requireZeroUint(coverageHighWater, 32, 'BIND coverageHighWater');
      requireZeroUint(terminalCount, 32, 'BIND terminalCount');
      void expectedRevision;
      return true;
    case 2: // TOMBSTONE
      requireNonzeroId(effect.principalId, 'TOMBSTONE principalId');
      requireNonzeroId(effect.positionKey, 'TOMBSTONE positionKey');
      requireZeroId(effect.recordId, 'TOMBSTONE recordId');
      requireZeroId(effect.occurrenceId, 'TOMBSTONE occurrenceId');
      requireZeroId(effect.queryProfileId, 'TOMBSTONE queryProfileId');
      requireZeroId(effect.terminalPostingsRoot, 'TOMBSTONE terminalPostingsRoot');
      requireZeroUint(generation, 32, 'TOMBSTONE generation');
      requireZeroUint(coverageHighWater, 32, 'TOMBSTONE coverageHighWater');
      requireZeroUint(terminalCount, 32, 'TOMBSTONE terminalCount');
      void expectedRevision;
      return true;
    case 3: // WITHDRAW
      requireNonzeroId(effect.principalId, 'WITHDRAW principalId');
      requireNonzeroId(effect.occurrenceId, 'WITHDRAW occurrenceId');
      requireZeroId(effect.positionKey, 'WITHDRAW positionKey');
      requireZeroId(effect.recordId, 'WITHDRAW recordId');
      requireZeroId(effect.queryProfileId, 'WITHDRAW queryProfileId');
      requireZeroId(effect.terminalPostingsRoot, 'WITHDRAW terminalPostingsRoot');
      requireZeroUint(expectedRevision, 32, 'WITHDRAW expectedRevision');
      requireZeroUint(generation, 32, 'WITHDRAW generation');
      requireZeroUint(coverageHighWater, 32, 'WITHDRAW coverageHighWater');
      requireZeroUint(terminalCount, 32, 'WITHDRAW terminalCount');
      return true;
    case 4: // ACTIVATE_QUERY
      requireNonzeroId(effect.queryProfileId, 'ACTIVATE_QUERY queryProfileId');
      if (generation === 0n) throw new Error('ACTIVATE_QUERY generation must be nonzero');
      requireZeroId(effect.principalId, 'ACTIVATE_QUERY principalId');
      requireZeroId(effect.positionKey, 'ACTIVATE_QUERY positionKey');
      requireZeroId(effect.recordId, 'ACTIVATE_QUERY recordId');
      requireZeroId(effect.occurrenceId, 'ACTIVATE_QUERY occurrenceId');
      requireZeroId(effect.terminalPostingsRoot, 'ACTIVATE_QUERY terminalPostingsRoot');
      requireZeroUint(expectedRevision, 32, 'ACTIVATE_QUERY expectedRevision');
      requireZeroUint(coverageHighWater, 32, 'ACTIVATE_QUERY coverageHighWater');
      requireZeroUint(terminalCount, 32, 'ACTIVATE_QUERY terminalCount');
      return true;
    case 5: // ADVANCE_COVERAGE
      requireNonzeroId(effect.queryProfileId, 'ADVANCE_COVERAGE queryProfileId');
      if (generation === 0n) throw new Error('ADVANCE_COVERAGE generation must be nonzero');
      requireZeroId(effect.principalId, 'ADVANCE_COVERAGE principalId');
      requireZeroId(effect.positionKey, 'ADVANCE_COVERAGE positionKey');
      requireZeroId(effect.recordId, 'ADVANCE_COVERAGE recordId');
      requireZeroId(effect.occurrenceId, 'ADVANCE_COVERAGE occurrenceId');
      requireZeroUint(expectedRevision, 32, 'ADVANCE_COVERAGE expectedRevision');
      if (bytes32Value(effect.terminalPostingsRoot, 'ADVANCE_COVERAGE terminalPostingsRoot') === ZERO_BYTES32
          && terminalCount !== 0n) {
        throw new Error('ADVANCE_COVERAGE nonterminal terminalCount must be zero');
      }
      return true;
    default:
      throw new Error(`unknown effect kind ${kind}`);
  }
}

function uncheckedEffectTargetKey(effect, kind) {
  switch (kind) {
    case 1:
    case 2:
      return keccak256(abi.encode(
        ['bytes32', 'bytes32'],
        [effect.principalId, effect.positionKey],
      ));
    case 3:
      return keccak256(abi.encode(
        ['bytes32', 'bytes32'],
        [effect.principalId, effect.occurrenceId],
      ));
    case 4:
    case 5:
      return keccak256(abi.encode(
        ['bytes32', 'uint32'],
        [effect.queryProfileId, effect.generation],
      ));
    default:
      throw new Error(`unknown effect kind ${kind}`);
  }
}

function effectTargetKey(effect) {
  validateEffect(effect);
  return uncheckedEffectTargetKey(effect, effectKind(effect));
}

function validateEffects(effects) {
  if (!Array.isArray(effects) || effects.length < 1 || effects.length > 4) {
    throw new Error('effect count must be in 1..4');
  }

  let previousKind = 0;
  let previousTargetKey = null;
  for (const effect of effects) {
    validateEffect(effect);
    const kind = effectKind(effect);
    const targetKey = uncheckedEffectTargetKey(effect, kind);
    if (kind < previousKind) throw new Error('effect order must be kind then target key');
    if (kind === previousKind && targetKey === previousTargetKey) {
      throw new Error('duplicate effect target');
    }
    if (kind === previousKind && targetKey < previousTargetKey) {
      throw new Error('effect order must be kind then target key');
    }
    previousKind = kind;
    previousTargetKey = targetKey;
  }
  return true;
}

function validateAdmissionPlan(plan) {
  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
    throw new TypeError('plan must be an object');
  }
  if (!Array.isArray(plan.occurrenceIds)
      || plan.occurrenceIds.length < 1
      || plan.occurrenceIds.length > 2) {
    throw new Error('occurrence count must be in 1..2');
  }

  // Occurrence IDs are committed in semantic leafIndex order. The leafIndex
  // preimages are outside AdmissionPlan, so their semantic order cannot be
  // inferred by sorting the opaque IDs here.
  const occurrences = new Set();
  for (const occurrenceId of plan.occurrenceIds) {
    requireNonzeroId(occurrenceId, 'occurrence id');
    const normalized = bytes32Value(occurrenceId, 'occurrence id');
    if (occurrences.has(normalized)) throw new Error('duplicate occurrence id');
    occurrences.add(normalized);
  }

  validateEffects(plan.effects);
  return true;
}

function effectValue(effect) {
  return [
    effect.kind,
    effect.principalId,
    effect.positionKey,
    effect.recordId,
    effect.occurrenceId,
    effect.expectedRevision,
    effect.queryProfileId,
    effect.generation,
    effect.coverageHighWater,
    effect.terminalCount,
    effect.terminalPostingsRoot,
  ];
}

function admissionPlanValue(plan) {
  return [
    plan.occurrenceIds,
    plan.realmId,
    plan.realmRevisionId,
    plan.coreCommitment,
    plan.semanticAuthor,
    plan.actor,
    plan.verifierProfileId,
    plan.nonceLane,
    plan.nonce,
    plan.expiryCoordinate,
    plan.executorCommitment,
    plan.dependencyCommitment,
    plan.payer,
    plan.maximumCost,
    plan.effects.map(effectValue),
  ];
}

function admissionPlanId(plan) {
  validateAdmissionPlan(plan);
  return keccak256(abi.encode(
    ['bytes32', 'uint16', ADMISSION_PLAN_ABI],
    [DOMAINS.admissionPlan, PROFILE_VERSION, admissionPlanValue(plan)],
  ));
}

function effectSetId(effects) {
  validateEffects(effects);
  return keccak256(abi.encode(
    ['bytes32', 'uint16', `${EFFECT_V0_ABI}[]`],
    [DOMAINS.effectSet, PROFILE_VERSION, effects.map(effectValue)],
  ));
}

function operationId(planId, effectsId) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32'],
    [DOMAINS.operation, PROFILE_VERSION, planId, effectsId],
  ));
}

module.exports = {
  ADMISSION_PLAN_ABI,
  DOMAINS,
  EFFECT_V0_ABI,
  PROFILE_VERSION,
  admissionPlanId,
  admissionPlanValue,
  effectTargetKey,
  effectSetId,
  effectValue,
  operationId,
  validateAdmissionPlan,
  validateEffect,
  validateEffects,
};
