'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ASSESSMENT,
  AVAILABILITY,
  PROOF_KIND,
  PROOF_SCOPE,
  commitSourceObservationEvidenceV0,
  decodeSourceObservationEvidenceV0,
  encodeSourceObservationEvidenceV0,
  validateSourceObservationEvidenceV0,
} = require('../src/source-observation-evidence-v0.cjs');
const {
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  encodeByteReadRequestV0,
  encodeSourceDescriptorV0,
} = require('../src/read-request-v0.cjs');

const b32 = (byte) => `0x${byte.repeat(32)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;
const MAX_U64 = (1n << 64n) - 1n;

function evidence() {
  const descriptor = {
    chainNamespace: utf8Hex('eip155'),
    chainReference: utf8Hex('31337'),
    originLineageCommitment: b32('23'),
    componentDescriptorCommitment: b32('24'),
    realmId: b32('31'),
    realmRevisionId: b32('32'),
    endpoints: [{ transportKind: 1, locator: utf8Hex('fixture://rpc'), interfaceCommitment: b32('21'), eligible: true }],
    selectionPolicyCommitment: b32('22'),
  };
  const sourceDescriptorCommitment = commitSourceDescriptorV0(descriptor);
  const request = {
    realmId: b32('31'),
    realmRevisionId: b32('32'),
    recordId: b32('33'),
    digestAlgorithm: 1,
    expectedDigest: b32('34'),
    start: 0,
    length: 5,
    sourceDescriptorCommitment,
    requestedBlockReference: utf8Hex('0xffffffffffffffff'),
    requestedSourceKind: 3,
    requestedFinality: 1,
  };
  return {
    resultV0Commitment: b32('11'),
    requestCommitment: commitByteReadRequestV0(request),
    requestBytes: encodeByteReadRequestV0(request),
    sourceDescriptorCommitment,
    sourceDescriptorBytes: encodeSourceDescriptorV0(descriptor),
    requestedBlockReference: utf8Hex('0xffffffffffffffff'),
    observedBlockNumber: MAX_U64,
    observedBlockHash: b32('14'),
    observedStateRoot: b32('15'),
    canonicalityAssessment: ASSESSMENT.SOURCE_REPORTED,
    proofKind: PROOF_KIND.NONE,
    proofScope: PROOF_SCOPE.NONE,
    proofScopeCommitment: { present: false, value: b32('00') },
    causalAvailability: AVAILABILITY.AVAILABLE,
    evidencePointer: utf8Hex('public RPC response transcript'),
  };
}

function expected(value = evidence()) {
  return {
    resultV0Commitment: value.resultV0Commitment,
    requestCommitment: value.requestCommitment,
    sourceDescriptorCommitment: value.sourceDescriptorCommitment,
    requestBytes: value.requestBytes,
    sourceDescriptorBytes: value.sourceDescriptorBytes,
    observerBasis: {
      blockHash: value.observedBlockHash,
      stateRoot: value.observedStateRoot,
      sourceKind: 3,
      finality: 1,
      freshnessCoordinate: value.observedBlockNumber,
    },
    canonicalityAssessment: ASSESSMENT.SOURCE_REPORTED,
    proofKind: PROOF_KIND.NONE,
    proofScope: PROOF_SCOPE.NONE,
    proofScopeCommitment: { present: false, value: b32('00') },
    causalAvailability: AVAILABILITY.AVAILABLE,
  };
}

test('source observation packet round-trips, commits, and binds the exact weaker Result basis', () => {
  const value = evidence();
  const encoded = encodeSourceObservationEvidenceV0(value);
  const decoded = decodeSourceObservationEvidenceV0(encoded);
  assert.deepEqual(decoded, value);
  assert.deepEqual(validateSourceObservationEvidenceV0(decoded, expected(value)), []);
  assert.match(commitSourceObservationEvidenceV0(value), /^0x[0-9a-f]{64}$/);
  assert.equal(encodeSourceObservationEvidenceV0(decoded), encoded);
});

test('source observation packet rejects mixed result/request/source/basis and invented proof scope', () => {
  const mutations = [
    [(value) => { value.resultV0Commitment = b32('91'); }, /result/i],
    [(value) => { value.requestCommitment = b32('92'); }, /request/i],
    [(value) => { value.sourceDescriptorCommitment = b32('93'); }, /source descriptor/i],
    [(value) => { value.observedBlockHash = b32('94'); }, /block hash/i],
    [(value) => { value.observedStateRoot = b32('95'); }, /state root/i],
    [(value) => { value.observedBlockNumber = MAX_U64 - 1n; }, /freshness|block number/i],
    [(value) => { value.proofScope = PROOF_SCOPE.POINT; }, /proof.*NONE|scope.*commitment/i],
    [(value) => { value.canonicalityAssessment = ASSESSMENT.CROSS_SOURCE_MATCHED; }, /canonicality assessment.*expected/i],
    [(value) => {
      value.proofKind = PROOF_KIND.ACCOUNT_STORAGE_PROOF;
      value.proofScope = PROOF_SCOPE.POINT;
      value.proofScopeCommitment = { present: true, value: b32('97') };
    }, /proof kind.*expected|proof scope.*expected/i],
    [(value) => { value.causalAvailability = AVAILABILITY.PARTIAL; }, /causal availability.*expected/i],
  ];
  for (const [mutate, pattern] of mutations) {
    const value = evidence();
    const wanted = expected(value);
    mutate(value);
    assert.match(validateSourceObservationEvidenceV0(value, wanted).join('\n'), pattern);
  }
});

test('source observation identity commitments are exact nonzero bytes32', () => {
  for (const field of ['resultV0Commitment', 'requestCommitment', 'sourceDescriptorCommitment']) {
    const value = evidence();
    value[field] = b32('00');
    assert.match(validateSourceObservationEvidenceV0(value, expected()).join('\n'), new RegExp(`${field}.*nonzero`, 'i'));
  }
});
