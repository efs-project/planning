'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();
const {
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  decodeByteReadRequestV0,
  decodeSourceDescriptorV0,
  validateReadPreimagesV0,
} = require('./read-request-v0.cjs');

const VERSION = 0;
const ZERO = `0x${'00'.repeat(32)}`;
const DOMAIN = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/SOURCE_OBSERVATION_EVIDENCE'));

const ASSESSMENT = Object.freeze({
  UNASSESSED: 1,
  SOURCE_REPORTED: 2,
  CROSS_SOURCE_MATCHED: 3,
  CONFLICT: 4,
});
const PROOF_KIND = Object.freeze({ NONE: 1, ACCOUNT_STORAGE_PROOF: 2, DECLARED_OTHER: 3 });
const PROOF_SCOPE = Object.freeze({ NONE: 1, POINT: 2, FINITE_SET: 3 });
const AVAILABILITY = Object.freeze({ AVAILABLE: 1, PARTIAL: 2, UNAVAILABLE: 3, UNKNOWN: 4 });
const OPT_B32 = 'tuple(bool,bytes32)';
const EVIDENCE = `tuple(bytes32,bytes32,bytes,bytes32,bytes,bytes,uint64,bytes32,bytes32,uint8,uint8,uint8,${OPT_B32},uint8,bytes)`;

function evidenceValue(value) {
  return [
    value.resultV0Commitment,
    value.requestCommitment,
    value.requestBytes,
    value.sourceDescriptorCommitment,
    value.sourceDescriptorBytes,
    value.requestedBlockReference,
    value.observedBlockNumber,
    value.observedBlockHash,
    value.observedStateRoot,
    value.canonicalityAssessment,
    value.proofKind,
    value.proofScope,
    [Boolean(value.proofScopeCommitment?.present), value.proofScopeCommitment?.value ?? ZERO],
    value.causalAvailability,
    value.evidencePointer,
  ];
}

function encodeSourceObservationEvidenceV0(value) {
  return abi.encode([EVIDENCE], [evidenceValue(value)]);
}

function decodeSourceObservationEvidenceV0(bytes) {
  const value = abi.decode([EVIDENCE], bytes)[0];
  const decoded = {
    resultV0Commitment: value[0],
    requestCommitment: value[1],
    requestBytes: value[2],
    sourceDescriptorCommitment: value[3],
    sourceDescriptorBytes: value[4],
    requestedBlockReference: value[5],
    observedBlockNumber: value[6],
    observedBlockHash: value[7],
    observedStateRoot: value[8],
    canonicalityAssessment: Number(value[9]),
    proofKind: Number(value[10]),
    proofScope: Number(value[11]),
    proofScopeCommitment: { present: value[12][0], value: value[12][1] },
    causalAvailability: Number(value[13]),
    evidencePointer: value[14],
  };
  if (encodeSourceObservationEvidenceV0(decoded).toLowerCase() !== bytes.toLowerCase()) {
    throw new Error('SourceObservationEvidenceV0 is not canonical ABI');
  }
  return decoded;
}

function commitSourceObservationEvidenceV0(value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', EVIDENCE],
    [DOMAIN, VERSION, evidenceValue(value)],
  ));
}

function byteLength(value) {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) return null;
  return (value.length - 2) / 2;
}

function isB32(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function uint64Value(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) return BigInt(value);
  return null;
}

function sameHex(left, right) {
  return typeof left === 'string' && typeof right === 'string'
    && left.toLowerCase() === right.toLowerCase();
}

function validateSourceObservationEvidenceV0(value, expected) {
  const errors = [];
  for (const field of [
    'resultV0Commitment',
    'requestCommitment',
    'sourceDescriptorCommitment',
    'observedBlockHash',
    'observedStateRoot',
  ]) {
    if (!isB32(value?.[field])) errors.push(`${field} must be bytes32`);
  }
  for (const field of ['resultV0Commitment', 'requestCommitment', 'sourceDescriptorCommitment']) {
    if (isB32(value?.[field]) && /^0x0{64}$/i.test(value[field])) {
      errors.push(`${field} must be nonzero bytes32`);
    }
  }
  const blockReferenceLength = byteLength(value?.requestedBlockReference);
  if (blockReferenceLength === null || blockReferenceLength < 1 || blockReferenceLength > 128) {
    errors.push('requestedBlockReference must contain 1..128 bytes');
  }
  const observedBlockNumber = uint64Value(value?.observedBlockNumber);
  if (observedBlockNumber === null || observedBlockNumber < 0n || observedBlockNumber >= (1n << 64n)) {
    errors.push('observedBlockNumber must fit uint64');
  }
  if (value?.observedBlockHash === ZERO || value?.observedStateRoot === ZERO) {
    errors.push('source observation requires nonzero observed block hash and state root');
  }
  for (const [field, registry] of [
    ['canonicalityAssessment', ASSESSMENT],
    ['proofKind', PROOF_KIND],
    ['proofScope', PROOF_SCOPE],
    ['causalAvailability', AVAILABILITY],
  ]) {
    if (!Object.values(registry).includes(value?.[field])) errors.push(`${field} is unknown`);
  }
  const proofCommitment = value?.proofScopeCommitment;
  if (!proofCommitment || typeof proofCommitment.present !== 'boolean' || !isB32(proofCommitment.value)) {
    errors.push('proofScopeCommitment must be an exact optional bytes32');
  } else {
    if (!proofCommitment.present && proofCommitment.value !== ZERO) {
      errors.push('absent proofScopeCommitment must be zero');
    }
    if (proofCommitment.present && proofCommitment.value === ZERO) {
      errors.push('present proofScopeCommitment must be nonzero');
    }
  }
  if (value?.proofKind === PROOF_KIND.NONE
      && (value.proofScope !== PROOF_SCOPE.NONE || proofCommitment?.present)) {
    errors.push('proofKind NONE requires proofScope NONE and an absent scope commitment');
  }
  if (value?.proofKind !== PROOF_KIND.NONE
      && (value?.proofScope === PROOF_SCOPE.NONE || !proofCommitment?.present)) {
    errors.push('a declared proof requires a non-NONE scope and present scope commitment');
  }
  const pointerLength = byteLength(value?.evidencePointer);
  if (pointerLength === null || pointerLength > 256) errors.push('evidencePointer exceeds 256 bytes or is malformed');

  errors.push(...validateReadPreimagesV0({
    requestBytes: value?.requestBytes,
    sourceDescriptorBytes: value?.sourceDescriptorBytes,
  }).map((error) => `read preimage: ${error}`));
  let request;
  let descriptor;
  try { request = decodeByteReadRequestV0(value?.requestBytes); } catch {}
  try { descriptor = decodeSourceDescriptorV0(value?.sourceDescriptorBytes); } catch {}
  if (request && commitByteReadRequestV0(request) !== value.requestCommitment) {
    errors.push('request commitment does not match retained ByteReadRequestV0 preimage');
  }
  if (descriptor && commitSourceDescriptorV0(descriptor) !== value.sourceDescriptorCommitment) {
    errors.push('source descriptor commitment does not match retained SourceDescriptorV0 preimage');
  }
  if (request && request.sourceDescriptorCommitment !== value.sourceDescriptorCommitment) {
    errors.push('request and observation source descriptor commitments differ');
  }
  if (request && request.requestedBlockReference.toLowerCase() !== value.requestedBlockReference.toLowerCase()) {
    errors.push('requested block reference differs from retained ByteReadRequestV0');
  }

  if (expected) {
    for (const [field, label] of [
      ['resultV0Commitment', 'result commitment'],
      ['requestCommitment', 'request commitment'],
      ['sourceDescriptorCommitment', 'source descriptor commitment'],
    ]) {
      if (!sameHex(value?.[field], expected[field])) errors.push(`${label} belongs to a different observation`);
    }
    if (expected.requestBytes && !sameHex(value?.requestBytes, expected.requestBytes)) {
      errors.push('request preimage belongs to a different observation');
    }
    if (expected.sourceDescriptorBytes && !sameHex(value?.sourceDescriptorBytes, expected.sourceDescriptorBytes)) {
      errors.push('source descriptor preimage belongs to a different observation');
    }
    const observer = expected.observerBasis;
    if (!sameHex(value?.observedBlockHash, observer?.blockHash)) {
      errors.push('observed block hash differs from ResultV0 observer basis');
    }
    if (!sameHex(value?.observedStateRoot, observer?.stateRoot)) {
      errors.push('observed state root differs from ResultV0 observer basis');
    }
    if (observer?.sourceKind !== 3 || observer?.finality !== 1) {
      errors.push('source observation requires SOURCE_OBSERVED with UNPROVEN finality');
    }
    if (request && (request.requestedSourceKind !== observer?.sourceKind
        || request.requestedFinality !== observer?.finality)) {
      errors.push('retained ByteReadRequestV0 source kind/finality differs from ResultV0 observer basis');
    }
    const observerFreshness = uint64Value(observer?.freshnessCoordinate);
    if (observedBlockNumber !== null && observerFreshness !== null && observedBlockNumber !== observerFreshness) {
      errors.push('observed block number differs from ResultV0 observer basis freshness coordinate');
    }
    for (const [field, label] of [
      ['canonicalityAssessment', 'canonicality assessment'],
      ['proofKind', 'proof kind'],
      ['proofScope', 'proof scope'],
      ['causalAvailability', 'causal availability'],
    ]) {
      if (expected[field] !== undefined && value?.[field] !== expected[field]) {
        errors.push(`${label} differs from expected exact evidence profile`);
      }
    }
    if (expected.proofScopeCommitment
        && (value?.proofScopeCommitment?.present !== expected.proofScopeCommitment.present
          || !sameHex(value?.proofScopeCommitment?.value, expected.proofScopeCommitment.value))) {
      errors.push('proof scope commitment differs from expected exact evidence profile');
    }
  }
  return errors;
}

module.exports = {
  ABI: Object.freeze({ EVIDENCE, OPT_B32 }),
  ASSESSMENT,
  AVAILABILITY,
  PROOF_KIND,
  PROOF_SCOPE,
  commitSourceObservationEvidenceV0,
  decodeSourceObservationEvidenceV0,
  encodeSourceObservationEvidenceV0,
  validateSourceObservationEvidenceV0,
};
