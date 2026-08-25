'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const DOMAIN = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/RESOLUTION_PLAN'));
const DOMAIN_POSITION = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/POSITION'));
const RESOLUTION_PLAN = 'tuple(bytes32,bytes32,bytes32[],uint8,uint8)';
const ZERO = `0x${'00'.repeat(32)}`;

const PROBE_STATUS = Object.freeze({
  FOUND: 1,
  ABSENT_PROVEN: 2,
  UNKNOWN: 3,
  CONFLICT: 4,
  UNSUPPORTED: 5,
  BASIS_MISMATCH: 6,
});

function planValue(plan) {
  return [plan.purpose, plan.subject, plan.principals, plan.combiner, plan.maximumProbes];
}

function resolutionPlanId(plan) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', RESOLUTION_PLAN],
    [DOMAIN, VERSION, planValue(plan)],
  ));
}

function positionKey({ purpose, subject, fieldRole }) {
  for (const [field, value] of Object.entries({ purpose, subject, fieldRole })) {
    if (!isB32(value) || /^0x0{64}$/i.test(value)) throw new Error(`${field} must be nonzero bytes32`);
  }
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32'],
    [DOMAIN_POSITION, VERSION, purpose, subject, fieldRole],
  ));
}

function isB32(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function validateResolutionPlanV0(plan) {
  const errors = [];
  if (!isB32(plan?.purpose) || /^0x0{64}$/i.test(plan.purpose)) errors.push('purpose must be nonzero bytes32');
  if (!isB32(plan?.subject) || /^0x0{64}$/i.test(plan.subject)) errors.push('subject must be nonzero bytes32');
  if (!Array.isArray(plan?.principals) || plan.principals.length < 1 || plan.principals.length > 64) {
    errors.push('principals must contain 1..64 entries');
    return errors;
  }
  if (plan.principals.some((principal) => !isB32(principal) || /^0x0{64}$/i.test(principal))) {
    errors.push('every PrincipalId must be a nonzero bytes32');
  }
  if (new Set(plan.principals.map((principal) => principal.toLowerCase())).size !== plan.principals.length) {
    errors.push('principals must be unique and ordered by policy priority');
  }
  if (plan.combiner !== 1) errors.push('combiner must be FIRST_FOUND_AFTER_PROVED_ABSENCE');
  if (plan.maximumProbes !== plan.principals.length) errors.push('maximumProbes must equal principals.length');
  return errors;
}

function resolveFirstFoundAfterProvedAbsence(plan, fieldRole, basisCommitment, pointProbe) {
  const planErrors = validateResolutionPlanV0(plan);
  if (planErrors.length > 0) throw new Error(planErrors.join('; '));
  if (!isB32(fieldRole) || /^0x0{64}$/i.test(fieldRole)) throw new Error('fieldRole must be nonzero bytes32');
  if (!isB32(basisCommitment) || /^0x0{64}$/i.test(basisCommitment)) throw new Error('basis must be nonzero bytes32');
  const position = positionKey({ purpose: plan.purpose, subject: plan.subject, fieldRole });
  const probes = [];

  for (const [index, principalId] of plan.principals.entries()) {
    let observed;
    try {
      observed = pointProbe(principalId, index, position);
    } catch (error) {
      observed = { status: PROBE_STATUS.UNKNOWN, basisCommitment, recordId: ZERO, diagnostic: String(error) };
    }
    const probe = {
      principalId,
      positionKey: position,
      status: observed.status,
      basisCommitment: observed.basisCommitment,
      recordId: observed.recordId ?? ZERO,
    };
    if (observed.basisCommitment !== basisCommitment) {
      probe.status = PROBE_STATUS.BASIS_MISMATCH;
      probes.push(probe);
      return terminal(probes, PROBE_STATUS.BASIS_MISMATCH);
    }
    probes.push(probe);
    if (observed.status === PROBE_STATUS.ABSENT_PROVEN) continue;
    if (observed.status === PROBE_STATUS.FOUND) {
      if (!isB32(observed.recordId) || observed.recordId === ZERO) {
        return terminal(probes, PROBE_STATUS.UNKNOWN);
      }
      return {
        probes,
        selectedPresent: true,
        selectedPrincipalId: principalId,
        selectedRecordId: observed.recordId,
        terminalStatus: PROBE_STATUS.FOUND,
      };
    }
    if (![PROBE_STATUS.UNKNOWN, PROBE_STATUS.CONFLICT, PROBE_STATUS.UNSUPPORTED].includes(observed.status)) {
      probe.status = PROBE_STATUS.UNKNOWN;
    }
    return terminal(probes, probe.status);
  }
  return terminal(probes, PROBE_STATUS.ABSENT_PROVEN);
}

function terminal(probes, status) {
  return {
    probes,
    selectedPresent: false,
    selectedPrincipalId: ZERO,
    selectedRecordId: ZERO,
    terminalStatus: status,
  };
}

module.exports = {
  ABI: Object.freeze({ RESOLUTION_PLAN }),
  PROBE_STATUS,
  positionKey,
  resolutionPlanId,
  resolveFirstFoundAfterProvedAbsence,
  validateResolutionPlanV0,
};
