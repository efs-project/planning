'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ATTEMPT_OUTCOME,
  commitAcquisitionEvidencePacketV0,
  encodeAcquisitionEvidencePacketV0,
  validateAcquisitionEvidencePacketV0,
} = require('../src/acquisition-evidence-v0.cjs');
const {
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  encodeByteReadRequestV0,
  encodeSourceDescriptorV0,
  decodeByteReadRequestV0,
  decodeSourceDescriptorV0,
  sourceIdentitiesV0,
} = require('../src/read-request-v0.cjs');

const b32 = (byte) => `0x${byte.repeat(32)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;
const MAX_U64 = (1n << 64n) - 1n;

const observer = (block, state) => ({
  blockHash: b32(block),
  stateRoot: b32(state),
  sourceKind: 2,
  finality: 1,
  freshnessCoordinate: 42,
});

function packet() {
  const descriptor = {
    chainNamespace: utf8Hex('eip155'),
    chainReference: utf8Hex('31337'),
    originLineageCommitment: b32('53'),
    componentDescriptorCommitment: b32('54'),
    realmId: b32('61'),
    realmRevisionId: b32('62'),
    endpoints: [
      { transportKind: 1, locator: utf8Hex('fixture://rpc/primary'), interfaceCommitment: b32('51'), eligible: true },
      { transportKind: 1, locator: utf8Hex('fixture://rpc/fallback'), interfaceCommitment: b32('51'), eligible: true },
    ],
    selectionPolicyCommitment: b32('52'),
  };
  const sourceDescriptorCommitment = commitSourceDescriptorV0(descriptor);
  const request = {
    realmId: b32('61'),
    realmRevisionId: b32('62'),
    recordId: b32('63'),
    digestAlgorithm: 1,
    expectedDigest: b32('30'),
    start: 0,
    length: 5,
    sourceDescriptorCommitment,
    requestedBlockReference: utf8Hex('0x2a'),
    requestedSourceKind: 2,
    requestedFinality: 1,
  };
  const identities = sourceIdentitiesV0(descriptor);
  return {
    requestCommitment: commitByteReadRequestV0(request),
    requestBytes: encodeByteReadRequestV0(request),
    sourceDescriptorCommitment,
    sourceDescriptorBytes: encodeSourceDescriptorV0(descriptor),
    resultV0Commitment: b32('11'),
    attempts: [
      {
        ordinal: 0,
        locatorCommitment: identities[0].locatorCommitment,
        sourceCommitment: identities[0].sourceCommitment,
        eligible: true,
        expectedDigest: b32('30'),
        observedDigest: b32('31'),
        requestedStart: 0,
        requestedLength: 5,
        observedLength: 5,
        outcome: ATTEMPT_OUTCOME.INTEGRITY_FAILED,
        observerBasis: observer('40', '41'),
        evidencePointer: utf8Hex('primary response'),
      },
      {
        ordinal: 1,
        locatorCommitment: identities[1].locatorCommitment,
        sourceCommitment: identities[1].sourceCommitment,
        eligible: true,
        expectedDigest: b32('30'),
        observedDigest: b32('30'),
        requestedStart: 0,
        requestedLength: 5,
        observedLength: 5,
        outcome: ATTEMPT_OUTCOME.VERIFIED,
        observerBasis: observer('42', '43'),
        evidencePointer: utf8Hex('fallback response'),
      },
    ],
  };
}

const finalFacts = {
  requestCommitment: packet().requestCommitment,
  resultV0Commitment: b32('11'),
  presence: 'FOUND',
  bytes: 'VERIFIED_AVAILABLE',
  expectedDigest: b32('30'),
  requestedStart: 0,
  requestedLength: 5,
  observerBasis: observer('42', '43'),
};

test('corrupt primary and verified fallback remain one ordered, valid evidence packet', () => {
  const value = packet();
  assert.deepEqual(validateAcquisitionEvidencePacketV0(value, finalFacts), []);
  assert.ok(encodeAcquisitionEvidencePacketV0(value).startsWith('0x'));
  assert.match(commitAcquisitionEvidencePacketV0(value), /^0x[0-9a-f]{64}$/);
  assert.equal(value.attempts[0].outcome, ATTEMPT_OUTCOME.INTEGRITY_FAILED);
  assert.equal(value.attempts[1].outcome, ATTEMPT_OUTCOME.VERIFIED);
});

test('packet commitment binds request, result, attempt order, basis, digests, ranges, and evidence', () => {
  const value = packet();
  const original = commitAcquisitionEvidencePacketV0(value);
  const mutations = [
    (copy) => { copy.requestCommitment = b32('99'); },
    (copy) => { copy.resultV0Commitment = b32('99'); },
    (copy) => { copy.attempts.reverse(); copy.attempts.forEach((attempt, i) => { attempt.ordinal = i; }); },
    (copy) => { copy.attempts[0].locatorCommitment = b32('99'); },
    (copy) => { copy.attempts[0].sourceCommitment = b32('99'); },
    (copy) => { copy.attempts[0].eligible = false; },
    (copy) => { copy.attempts[0].observedDigest = b32('99'); },
    (copy) => { copy.attempts[0].requestedStart = 1; },
    (copy) => { copy.attempts[0].observerBasis.stateRoot = b32('99'); },
    (copy) => { copy.attempts[0].evidencePointer = utf8Hex('different'); },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(value);
    mutate(copy);
    assert.notEqual(commitAcquisitionEvidencePacketV0(copy), original);
  }
});

test('packet rejects mixed reads, ordinal gaps, dishonest VERIFIED, and unsupported final success', () => {
  const mixed = packet();
  assert.match(validateAcquisitionEvidencePacketV0(mixed, { ...finalFacts, resultV0Commitment: b32('99') }).join('\n'), /result/i);

  const gap = packet();
  gap.attempts[1].ordinal = 2;
  assert.match(validateAcquisitionEvidencePacketV0(gap, finalFacts).join('\n'), /ordinal/i);

  const dishonest = packet();
  dishonest.attempts[1].observedDigest = b32('98');
  assert.match(validateAcquisitionEvidencePacketV0(dishonest, finalFacts).join('\n'), /VERIFIED.*digest/i);

  const noSuccess = packet();
  noSuccess.attempts[1].outcome = ATTEMPT_OUTCOME.UNAVAILABLE;
  assert.match(validateAcquisitionEvidencePacketV0(noSuccess, finalFacts).join('\n'), /verified eligible attempt/i);

  const inventedEligibility = packet();
  inventedEligibility.attempts[0].eligible = false;
  assert.match(validateAcquisitionEvidencePacketV0(inventedEligibility, finalFacts).join('\n'), /eligibility.*SourceEndpointV0/i);
});

test('verified fallback exactly matches the final Result observer basis and packet commitments are nonzero', () => {
  for (const [field, value] of [
    ['blockHash', b32('99')],
    ['stateRoot', b32('99')],
    ['sourceKind', 3],
    ['finality', 2],
    ['freshnessCoordinate', 43],
  ]) {
    const changed = structuredClone(finalFacts);
    changed.observerBasis[field] = value;
    assert.match(validateAcquisitionEvidencePacketV0(packet(), changed).join('\n'), new RegExp(field, 'i'));
  }
  const withoutBasis = structuredClone(finalFacts);
  delete withoutBasis.observerBasis;
  assert.match(validateAcquisitionEvidencePacketV0(packet(), withoutBasis).join('\n'), /final.*observer basis/i);

  for (const field of ['requestCommitment', 'sourceDescriptorCommitment', 'resultV0Commitment']) {
    const value = packet();
    value[field] = b32('00');
    assert.match(validateAcquisitionEvidencePacketV0(value, finalFacts).join('\n'), /packet commitments.*nonzero/i);
  }
});

test('bounds and authenticated observer evidence fail closed', () => {
  const tooMany = packet();
  while (tooMany.attempts.length < 9) {
    const copy = structuredClone(tooMany.attempts[1]);
    copy.ordinal = tooMany.attempts.length;
    tooMany.attempts.push(copy);
  }
  assert.match(validateAcquisitionEvidencePacketV0(tooMany, finalFacts).join('\n'), /1\.\.8/);

  const zeroBasis = packet();
  zeroBasis.attempts[0].observerBasis.blockHash = b32('00');
  assert.match(validateAcquisitionEvidencePacketV0(zeroBasis, finalFacts).join('\n'), /block hash/i);
});

test('SOURCE_OBSERVED and uint64-max freshness remain literal without an authentication claim or Number narrowing', () => {
  const value = packet();
  for (const attempt of value.attempts) {
    attempt.observerBasis.sourceKind = 3;
    attempt.observerBasis.finality = 1;
    attempt.observerBasis.freshnessCoordinate = MAX_U64;
  }
  const request = decodeByteReadRequestV0(value.requestBytes);
  request.requestedSourceKind = 3;
  request.requestedFinality = 1;
  value.requestBytes = encodeByteReadRequestV0(request);
  value.requestCommitment = commitByteReadRequestV0(request);
  const final = {
    ...finalFacts,
    requestCommitment: value.requestCommitment,
    observerBasis: {
      ...value.attempts[1].observerBasis,
    },
  };
  assert.deepEqual(validateAcquisitionEvidencePacketV0(value, final), []);
  assert.ok(encodeAcquisitionEvidencePacketV0(value).startsWith('0x'));

  value.attempts[1].observerBasis.freshnessCoordinate = MAX_U64 - 1n;
  assert.match(validateAcquisitionEvidencePacketV0(value, final).join('\n'), /freshness.*ResultV0 observer basis/i);

  value.attempts[1].observerBasis.freshnessCoordinate = MAX_U64;
  value.attempts[1].observerBasis.finality = 2;
  assert.match(validateAcquisitionEvidencePacketV0(value, final).join('\n'), /source observed.*finality.*UNPROVEN/i);
});

test('acquisition retains and recomputes exact request/source preimages and only accepts declared source identities', () => {
  const descriptor = {
    chainNamespace: utf8Hex('eip155'),
    chainReference: utf8Hex('31337'),
    originLineageCommitment: b32('53'),
    componentDescriptorCommitment: b32('54'),
    realmId: b32('61'),
    realmRevisionId: b32('62'),
    endpoints: [
      { transportKind: 1, locator: utf8Hex('fixture://rpc/primary'), interfaceCommitment: b32('51'), eligible: true },
      { transportKind: 1, locator: utf8Hex('fixture://rpc/fallback'), interfaceCommitment: b32('51'), eligible: true },
    ],
    selectionPolicyCommitment: b32('52'),
  };
  const sourceDescriptorCommitment = commitSourceDescriptorV0(descriptor);
  const request = {
    realmId: b32('61'),
    realmRevisionId: b32('62'),
    recordId: b32('63'),
    digestAlgorithm: 1,
    expectedDigest: b32('30'),
    start: 0,
    length: 5,
    sourceDescriptorCommitment,
    requestedBlockReference: utf8Hex('0x2a'),
    requestedSourceKind: 2,
    requestedFinality: 1,
  };
  const identities = sourceIdentitiesV0(descriptor);
  const value = packet();
  value.requestBytes = encodeByteReadRequestV0(request);
  value.requestCommitment = commitByteReadRequestV0(request);
  value.sourceDescriptorBytes = encodeSourceDescriptorV0(descriptor);
  value.sourceDescriptorCommitment = sourceDescriptorCommitment;
  value.attempts.forEach((attempt, index) => Object.assign(attempt, identities[index]));
  const final = { ...finalFacts, requestCommitment: value.requestCommitment };
  assert.deepEqual(validateAcquisitionEvidencePacketV0(value, final), []);

  for (const [label, mutate] of [
    ['request bytes', (copy) => {
      const decoded = decodeByteReadRequestV0(copy.requestBytes);
      copy.requestBytes = encodeByteReadRequestV0({ ...decoded, recordId: b32('99') });
    }],
    ['source bytes', (copy) => {
      const decoded = decodeSourceDescriptorV0(copy.sourceDescriptorBytes);
      copy.sourceDescriptorBytes = encodeSourceDescriptorV0({ ...decoded, chainReference: utf8Hex('1') });
    }],
    ['source identity', (copy) => { copy.attempts[0].sourceCommitment = b32('99'); }],
    ['locator identity', (copy) => { copy.attempts[0].locatorCommitment = b32('99'); }],
    ['endpoint eligibility', (copy) => { copy.attempts[0].eligible = false; }],
  ]) {
    const copy = structuredClone(value);
    mutate(copy);
    assert.notDeepEqual(validateAcquisitionEvidencePacketV0(copy, final), [], label);
  }
});
