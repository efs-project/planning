import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  checkSealedPacket as checkPacket,
  classifyCostState,
  compareCommitmentClaim,
  correlateRpcResponses,
  reconstructCommitments,
  verifyEoaSignature,
} from './oracle.mjs';

const profileRaw = await readFile(new URL('profile-b.public.json', import.meta.url), 'utf8');
const expectationsRaw = await readFile(new URL('neutral-expectations.json', import.meta.url), 'utf8');
const profile = JSON.parse(profileRaw);
const vectors = JSON.parse(await readFile(new URL('hand-vectors.json', import.meta.url), 'utf8'));
const expectations = JSON.parse(expectationsRaw);
const frozenInputBytes = { profileRaw, expectationsRaw };
const checkSealedPacket = (
  packet,
  selectedProfile = profile,
  selectedExpectations = expectations,
  inputBytes = frozenInputBytes,
) => checkPacket(packet, selectedProfile, selectedExpectations, inputBytes);

const evidence = (kind, value = '0x01') => [{ kind, value }];
const costBlockBefore = `0x${'31'.repeat(32)}`;
const costBlockAfter = `0x${'32'.repeat(32)}`;
const costControl = {
  actor: `0x${'41'.repeat(20)}`,
  actionShape: 'PUBLISH_RECORD_WITH_ONE_OCCURRENCE',
  bodySizeBytes: '96',
  initialStateRegime: 'MATCHED_BASELINE_EXCEPT_CONTENT_PRESENCE',
  operationCommitment: `0x${'71'.repeat(32)}`,
};

function fullCostInput(overrides = {}) {
  return {
    control: costControl,
    basis: { beforeBlockHash: costBlockBefore, afterBlockHash: costBlockAfter },
    provenance: { kind: 'SYNTHETIC_CONTROL', source: 'oracle.test.mjs' },
    recordPresentBefore: false,
    recordPresentAfter: true,
    operationCommitmentBefore: null,
    operationCommitmentAfter: costControl.operationCommitment,
    occurrenceCountBefore: '0',
    occurrenceCountAfter: '1',
    effectCommitmentBefore: `0x${'00'.repeat(32)}`,
    effectCommitmentAfter: `0x${'51'.repeat(32)}`,
    stateDelta: '1',
    ...overrides,
  };
}

function basePacket() {
  const record = vectors.recordQuote3000;
  const subject = vectors.subjectSynthetic;
  const sourceBlockHash = `0x${'ab'.repeat(32)}`;
  const destinationBlockHash = `0x${'ac'.repeat(32)}`;
  const unavailable = (reason) => ({ availability: 'UNAVAILABLE', reason });
  const sourceBasis = {
    basisRole: 'source',
    blockHash: sourceBlockHash,
  };
  const destinationBasis = {
    basisRole: 'destination',
    blockHash: destinationBlockHash,
  };
  return {
    seal: {
      candidateSourceCommit: profile.candidate.sourceCommit,
      neutralSource: expectations.source,
      observationBasis: {
        source: {
          chainId: '31337',
          blockNumber: '100',
          blockHash: sourceBlockHash,
          realmAddress: `0x${'61'.repeat(20)}`,
          provenance: 'synthetic oracle control',
          header: unavailable('synthetic control does not retain a block header'),
          runtime: unavailable('synthetic control does not retain runtime bytes'),
          accountProof: unavailable('synthetic control does not retain an account proof'),
          storageProof: unavailable('synthetic control does not retain a storage proof'),
        },
        destination: {
          chainId: '31337',
          blockNumber: '101',
          blockHash: destinationBlockHash,
          realmAddress: `0x${'62'.repeat(20)}`,
          provenance: 'synthetic oracle control',
          header: unavailable('synthetic control does not retain a block header'),
          runtime: unavailable('synthetic control does not retain runtime bytes'),
          accountProof: unavailable('synthetic control does not retain an account proof'),
          storageProof: unavailable('synthetic control does not retain a storage proof'),
        },
      },
    },
    inputs: {
      typeDomainText: profile.typeIdentity.quoteDomainText,
      body: record.body,
      principalId: subject.principalId,
      salt: subject.salt,
    },
    observations: {
      referenceValidation: {
        ...sourceBasis,
        source: 'candidate packet fixture',
        targetFound: true,
        targetTypeMatches: true,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('RAW_REFERENCE_WORD'),
      },
      sourceAcceptance: {
        ...sourceBasis,
        source: 'candidate packet fixture',
        rowPresent: true,
        acceptanceProfileMatches: true,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('SOURCE_ADMISSION_ROW'),
      },
      destinationAdmission: {
        ...destinationBasis,
        source: 'candidate packet fixture',
        rowPresent: true,
        acceptanceProfileMatches: true,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('DESTINATION_ADMISSION_ROW'),
      },
      submission: {
        ...destinationBasis,
        source: 'candidate packet fixture',
        transactionHash: `0x${'cd'.repeat(32)}`,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('TRANSACTION_HASH'),
      },
      receipt: {
        ...destinationBasis,
        source: 'candidate packet fixture',
        statusHex: '0x1',
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('RECEIPT_BYTES'),
      },
      requiredEffects: [
        {
          ...destinationBasis,
          source: 'candidate packet fixture',
          proofGrade: 'RETAINED_RPC_ONLY',
          name: 'head',
          observed: record.recordId,
          evidence: evidence('HEAD_ROW'),
        },
        {
          ...destinationBasis,
          source: 'candidate packet fixture',
          proofGrade: 'RETAINED_RPC_ONLY',
          name: 'requiredIndex',
          observed: record.recordId,
          evidence: evidence('INDEX_ROW'),
        },
      ],
    },
    claims: {
      recordIdentity: record.recordId,
      subjectIdentity: subject.subjectId,
      actionCommitment: 'UNSUPPORTED',
      signedDigest: 'UNSUPPORTED',
      signatureValidity: 'UNSUPPORTED',
      referenceValidation: 'UNKNOWN',
      sourceAcceptance: 'UNKNOWN',
      destinationAdmission: 'UNKNOWN',
      submission: 'UNKNOWN',
      receipt: 'UNKNOWN',
      canonicalEffect: 'UNSUPPORTED',
      queryCoverage: 'UNSUPPORTED',
      costState: 'UNKNOWN',
    },
  };
}

test('reconstructs declared Record and subject identities from literal hand vectors', () => {
  const record = vectors.recordQuote3000;
  const subject = vectors.subjectSynthetic;

  const result = reconstructCommitments(profile, {
    typeDomainText: profile.typeIdentity.quoteDomainText,
    body: record.body,
    principalId: subject.principalId,
    salt: subject.salt,
  });

  assert.deepEqual(
    {
      typeId: result.typeIdentity.value,
      bodyHash: result.bodyCommitment.value,
      recordPreimage: result.recordIdentity.preimage,
      recordId: result.recordIdentity.value,
      subjectPreimage: result.subjectIdentity.preimage,
      subjectId: result.subjectIdentity.value,
    },
    {
      typeId: record.typeId,
      bodyHash: record.bodyHash,
      recordPreimage: record.preimage,
      recordId: record.recordId,
      subjectPreimage: subject.preimage,
      subjectId: subject.subjectId,
    },
  );
  assert.equal(result.recordIdentity.status, 'SUPPORTED');
  assert.equal(result.subjectIdentity.status, 'SUPPORTED');
  assert.equal(result.actionCommitment.status, 'UNSUPPORTED');
  assert.equal(result.signedDigest.status, 'UNSUPPORTED');
});

test('verifies a supplied digest without treating it as candidate plan authorization', () => {
  const vector = vectors.signaturePrimitive;
  const result = verifyEoaSignature(
    vector.digest,
    vector.signature,
    vector.expectedAuthor,
  );

  assert.equal(result.status, 'VALID');
  assert.equal(result.recovered, vector.expectedAuthor);
  assert.equal(result.scope, vector.scope);
  assert.equal(result.authorizesCandidatePlan, false);
});

test('the same signature over a mutated digest is invalid for the expected author', () => {
  const vector = vectors.signaturePrimitive;
  const result = verifyEoaSignature(
    vector.mutatedDigest,
    vector.signature,
    vector.expectedAuthor,
  );

  assert.equal(result.status, 'INVALID');
  assert.equal(result.reason, 'RECOVERED_AUTHOR_MISMATCH');
  assert.notEqual(result.recovered, vector.expectedAuthor);
  assert.equal(result.authorizesCandidatePlan, false);
});

test('a literal signature-byte mutation is invalid for the expected author', () => {
  const vector = vectors.signaturePrimitive;
  const mutatedSignature = `0x0${vector.signature.slice(3)}`;
  const result = verifyEoaSignature(
    vector.digest,
    mutatedSignature,
    vector.expectedAuthor,
  );

  assert.equal(mutatedSignature.length, vector.signature.length);
  assert.notEqual(mutatedSignature, vector.signature);
  assert.equal(result.status, 'INVALID');
  assert.equal(result.reason, 'RECOVERED_AUTHOR_MISMATCH');
  assert.equal(result.authorizesCandidatePlan, false);
});

test('an incomplete public profile disables only the missing reconstruction axis', () => {
  const incomplete = structuredClone(profile);
  incomplete.subjectIdentity = {
    support: 'UNSUPPORTED',
    reason: 'public profile omitted subject framing',
  };

  const result = reconstructCommitments(incomplete, {
    typeDomainText: profile.typeIdentity.quoteDomainText,
    body: vectors.recordQuote3000.body,
    principalId: vectors.subjectSynthetic.principalId,
    salt: vectors.subjectSynthetic.salt,
  });

  assert.equal(result.recordIdentity.status, 'SUPPORTED');
  assert.deepEqual(result.subjectIdentity, {
    status: 'UNSUPPORTED',
    reason: 'public profile omitted subject framing',
    evidence: [],
  });
});

test('unsupported identity framing cannot be overwritten as a matching claim or signature', () => {
  const incomplete = structuredClone(profile);
  incomplete.recordIdentity = {
    support: 'UNSUPPORTED',
    reason: 'public profile omitted Record framing',
  };
  const commitment = reconstructCommitments(incomplete, {
    typeDomainText: profile.typeIdentity.quoteDomainText,
    body: vectors.recordQuote3000.body,
    principalId: vectors.subjectSynthetic.principalId,
    salt: vectors.subjectSynthetic.salt,
  }).recordIdentity;
  const comparison = compareCommitmentClaim(commitment, vectors.recordQuote3000.recordId);

  assert.equal(comparison.status, 'UNSUPPORTED');
  assert.equal(comparison.reason, 'public profile omitted Record framing');
  const report = checkSealedPacket(basePacket());
  assert.equal(report.evaluated.signatureValidity.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.signatureValidity.authorizesCandidatePlan, false);
});

test('a packet cannot substitute an undeclared Type domain under the same profile pin', () => {
  assert.throws(
    () => reconstructCommitments(profile, {
      typeDomainText: 'lab/type/other/1',
      body: vectors.recordQuote3000.body,
      principalId: vectors.subjectSynthetic.principalId,
      salt: vectors.subjectSynthetic.salt,
    }),
    /TYPE_DOMAIN_MISMATCH/,
  );
});

test('body mutation cannot retain identity while candidate signature binding stays unsupported', () => {
  const packet = basePacket();
  packet.inputs.body = vectors.recordQuote3001Mutation.body;

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.recordIdentity.status, 'MISMATCH');
  assert.equal(report.evaluated.recordIdentity.value, vectors.recordQuote3001Mutation.recordId);
  assert.equal(report.evaluated.signatureValidity.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.signatureValidity.authorizesCandidatePlan, false);
  assert.equal(report.evaluated.referenceValidation.status, 'UNKNOWN');
  assert.equal(report.evaluated.actionCommitment.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.signedDigest.status, 'UNSUPPORTED');
});

test('missing evidence remains unknown and cannot satisfy a success claim', () => {
  const packet = basePacket();
  delete packet.observations.referenceValidation;
  packet.claims.referenceValidation = 'VALID';

  const report = checkSealedPacket(packet, profile, expectations);

  assert.deepEqual(report.evaluated.referenceValidation, {
    status: 'UNKNOWN',
    reason: 'MISSING_EVIDENCE:referenceValidation',
    evidence: [],
  });
  assert.deepEqual(report.discrepancies.find(({ axis }) => axis === 'referenceValidation'), {
    axis: 'referenceValidation',
    claimed: 'VALID',
    evaluated: 'UNKNOWN',
  });
});

test('a status label plus opaque evidence cannot manufacture an evaluated result', () => {
  const packet = basePacket();
  packet.observations.referenceValidation = {
    ...packet.observations.referenceValidation,
    status: 'VALID',
    proofGrade: 'RETAINED_RPC_ONLY',
    evidence: evidence('OPAQUE_CANDIDATE_OUTPUT'),
  };

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.referenceValidation.status, 'UNKNOWN');
  assert.equal(
    report.evaluated.referenceValidation.reason,
    'UNAUTHENTICATED_OBSERVATION:referenceValidation',
  );
  assert.equal(report.rawObservations.referenceValidation.status, 'VALID');
});

test('candidate booleans plus opaque evidence cannot manufacture validation or proof grade', () => {
  const packet = basePacket();
  packet.observations.referenceValidation = {
    ...packet.observations.referenceValidation,
    targetFound: true,
    targetTypeMatches: true,
    proofGrade: 'AUTHENTICATED_STATE_PROOF',
    evidence: [{}],
  };

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.referenceValidation.status, 'UNKNOWN');
  assert.equal(report.evaluated.referenceValidation.reason, 'UNAUTHENTICATED_OBSERVATION:referenceValidation');
  assert.equal(Object.hasOwn(report.evaluated.referenceValidation, 'proofGrade'), false);
  assert.equal(report.rawObservations.referenceValidation.proofGrade, 'AUTHENTICATED_STATE_PROOF');
});

test('reordered RPC responses correlate by exact ID rather than position', () => {
  const requests = [
    { id: 7, method: 'record', params: ['0xa'] },
    { id: 9, method: 'head', params: ['0xb'] },
  ];
  const responses = [
    { id: 9, result: 'HEAD' },
    { id: 7, result: 'RECORD' },
  ];

  assert.deepEqual(
    correlateRpcResponses(requests, responses).map(({ response }) => response.result),
    ['RECORD', 'HEAD'],
  );
});

test('missing or duplicate RPC response IDs invalidate the transport set', () => {
  const requests = [{ id: 7 }, { id: 9 }];
  assert.throws(
    () => correlateRpcResponses(requests, [{ id: 7, result: 'A' }]),
    /MISSING_RPC_RESPONSE:9/,
  );
  assert.throws(
    () => correlateRpcResponses(requests, [
      { id: 7, result: 'A' },
      { id: 7, result: 'B' },
    ]),
    /DUPLICATE_RPC_RESPONSE_ID:7/,
  );
});

test('source acceptance never manufactures missing destination admission', () => {
  const packet = basePacket();
  delete packet.observations.destinationAdmission;

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.sourceAcceptance.status, 'UNKNOWN');
  assert.equal(report.evaluated.destinationAdmission.status, 'UNKNOWN');
  assert.equal(report.evaluated.destinationAdmission.reason, 'MISSING_EVIDENCE:destinationAdmission');
});

test('receipt success and canonical effects remain independent', () => {
  const packet = basePacket();
  packet.claims.receipt = 'SUCCESS';
  packet.claims.canonicalEffect = 'COMMITTED';
  packet.observations.requiredEffects[1] = {
    ...packet.observations.requiredEffects[1],
    name: 'requiredIndex',
    observed: null,
    absenceProven: true,
    evidence: evidence('INDEX_ABSENCE_PROOF'),
  };

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.receipt.status, 'UNKNOWN');
  assert.equal(report.evaluated.canonicalEffect.status, 'UNSUPPORTED');
  assert.equal(report.discrepancies.some(({ axis }) => axis === 'receipt'), true);
  assert.equal(report.discrepancies.some(({ axis }) => axis === 'canonicalEffect'), true);
});

test('candidate-supplied expected effect values cannot manufacture commitment', () => {
  const packet = basePacket();
  packet.observations.requiredEffects[0] = {
    ...packet.observations.requiredEffects[0],
    name: 'head',
    expected: '0x99',
    observed: '0x99',
    evidence: evidence('HEAD_ROW'),
  };

  assert.throws(
    () => checkSealedPacket(packet, profile, expectations),
    /CANDIDATE_EXPECTATION_FORBIDDEN:head/,
  );
});

test('matching candidate-supplied rows cannot manufacture a canonical effect', () => {
  const packet = basePacket();
  packet.observations.requiredEffects = [
    {
      ...packet.observations.requiredEffects[0],
      name: 'head',
      observed: vectors.recordQuote3000.recordId,
      evidence: [{}],
    },
  ];

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.canonicalEffect.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.canonicalEffect.reason, 'REQUIRED_EFFECT_CLOSURE_UNPINNED');
  assert.equal(report.rawObservations.requiredEffects[0].observed, vectors.recordQuote3000.recordId);
});

test('lost submission evidence cannot make an effect provable or permit retry', () => {
  const packet = basePacket();
  delete packet.observations.submission;

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.submission.status, 'UNKNOWN');
  assert.equal(report.evaluated.canonicalEffect.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.retryAllowed, false);
});

test('underspecified cost observations stay unknown rather than becoming classifications', () => {
  const cases = new Map(expectations.cases
    .filter(({ input }) => input)
    .map((entry) => [entry.id, entry]));

  for (const id of ['fresh-content', 'existing-content-new-action', 'exact-retry', 'contradictory-cost-state']) {
    const entry = cases.get(id);
    assert.equal(classifyCostState(entry.input).status, 'UNKNOWN', id);
    assert.match(classifyCostState(entry.input).reason, /^MISSING_COST_EVIDENCE:/, id);
  }
});

test('classifies fresh, existing, retry and inconsistent controls without calling them proof', () => {
  const cases = [
    ['FRESH', fullCostInput()],
    ['EXISTING', fullCostInput({
      recordPresentBefore: true,
      occurrenceCountBefore: '2',
      occurrenceCountAfter: '3',
      effectCommitmentBefore: `0x${'52'.repeat(32)}`,
    })],
    ['RETRY', fullCostInput({
      recordPresentBefore: true,
      operationCommitmentBefore: costControl.operationCommitment,
      occurrenceCountBefore: '3',
      occurrenceCountAfter: '3',
      effectCommitmentBefore: `0x${'53'.repeat(32)}`,
      effectCommitmentAfter: `0x${'53'.repeat(32)}`,
      stateDelta: '0',
    })],
    ['INCONSISTENT', fullCostInput({ recordPresentAfter: false })],
  ];

  const results = cases.map(([expected, input]) => {
    const result = classifyCostState(input);
    assert.equal(result.status, 'CLASSIFIED_FROM_SUPPLIED_FACTS');
    assert.equal(result.value, expected);
    assert.equal(result.evidenceGrade, 'UNAUTHENTICATED_INPUT');
    return result;
  });
  assert.equal(results[0].controlKey, results[1].controlKey);
  assert.equal(results[1].controlKey, results[2].controlKey);
});

test('retry requires the exact operation commitment before and after', () => {
  const input = fullCostInput({
    recordPresentBefore: true,
    operationCommitmentBefore: `0x${'72'.repeat(32)}`,
    occurrenceCountBefore: '3',
    occurrenceCountAfter: '3',
    effectCommitmentBefore: `0x${'53'.repeat(32)}`,
    effectCommitmentAfter: `0x${'53'.repeat(32)}`,
    stateDelta: '0',
    sameOperationAlreadyPresentBefore: true,
  });

  const result = classifyCostState(input);
  const alternateOperation = `0x${'73'.repeat(32)}`;
  const alternate = classifyCostState(fullCostInput({
    control: { ...costControl, operationCommitment: alternateOperation },
    operationCommitmentAfter: alternateOperation,
  }));

  assert.equal(result.value, 'INCONSISTENT');
  assert.notEqual(result.controlKey, alternate.controlKey);
});

test('a provisional cost classification cannot satisfy a candidate truth claim', () => {
  const packet = basePacket();
  packet.observations.costState = fullCostInput();
  packet.claims.costState = 'FRESH';

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.costState.status, 'UNKNOWN');
  assert.equal(report.evaluated.costState.provisionalClassification, 'FRESH');
  assert.equal(report.discrepancies.some(({ axis }) => axis === 'costState'), true);
});

test('raw observations and candidate claims survive comparison as separate values', () => {
  const packet = basePacket();
  packet.inputs.unrecognizedCandidateField = { retain: true };
  packet.claims.destinationAdmission = 'SELECTED';

  const report = checkSealedPacket(packet, profile, expectations);

  assert.deepEqual(report.rawObservations, packet.observations);
  assert.deepEqual(report.rawInputs, packet.inputs);
  assert.deepEqual(report.claims, packet.claims);
  assert.equal(report.evaluated.destinationAdmission.status, 'UNKNOWN');
  assert.deepEqual(report.discrepancies.find(({ axis }) => axis === 'destinationAdmission'), {
    axis: 'destinationAdmission',
    claimed: 'SELECTED',
    evaluated: 'UNKNOWN',
  });
});

test('frozen and unknown claim axes never disappear from discrepancy checking', () => {
  const packet = basePacket();
  packet.claims.queryCoverage = 'COMPLETE';
  packet.claims.destinationSelection = 'SELECTED';
  packet.claims.inventedAxis = 'SUCCESS';

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.queryCoverage.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.destinationSelection.status, 'UNSUPPORTED');
  assert.deepEqual(
    report.discrepancies.filter(({ axis }) => ['queryCoverage', 'destinationSelection', 'inventedAxis'].includes(axis)),
    [
      { axis: 'queryCoverage', claimed: 'COMPLETE', evaluated: 'UNSUPPORTED' },
      { axis: 'destinationSelection', claimed: 'SELECTED', evaluated: 'UNSUPPORTED' },
      { axis: 'inventedAxis', claimed: 'SUCCESS', evaluated: 'UNSUPPORTED_CLAIM_AXIS' },
    ],
  );
});

test('omitting required claims is an explicit discrepancy rather than a green result', () => {
  const packet = basePacket();
  packet.claims = {};

  const report = checkSealedPacket(packet);

  assert.equal(report.discrepancies.length, expectations.axes.length);
  assert.deepEqual(report.discrepancies[0], {
    axis: expectations.axes[0],
    claimed: 'MISSING_CLAIM',
    evaluated: report.evaluated.recordIdentity.value,
  });
  assert.equal(report.discrepancies.every(({ claimed }) => claimed === 'MISSING_CLAIM'), true);
});

test('a moving-tag or malformed observation basis cannot enter the sealed checker', () => {
  const packet = basePacket();
  packet.seal.observationBasis.source.blockHash = 'latest';

  assert.throws(
    () => checkSealedPacket(packet, profile, expectations),
    /MALFORMED_OBSERVATION_BASIS/,
  );
});

test('each observation is bound to its declared source or destination block', () => {
  const packet = basePacket();
  packet.observations.requiredEffects[1].blockHash = packet.seal.observationBasis.source.blockHash;

  assert.throws(
    () => checkSealedPacket(packet),
    /MIXED_OBSERVATION_BASIS:requiredEffects\[1\]/,
  );
});

test('the fresh-destination fixture rejects identical source and destination authority', () => {
  const packet = basePacket();
  packet.seal.observationBasis.destination = structuredClone(packet.seal.observationBasis.source);
  for (const name of ['destinationAdmission', 'submission', 'receipt']) {
    packet.observations[name].blockHash = packet.seal.observationBasis.source.blockHash;
  }
  for (const effect of packet.observations.requiredEffects) {
    effect.blockHash = packet.seal.observationBasis.source.blockHash;
  }

  assert.throws(
    () => checkSealedPacket(packet),
    /SOURCE_DESTINATION_AUTHORITY_COLLISION/,
  );
});

test('basis anchors must state chain, realm, provenance, and unavailable proof inputs', () => {
  const packet = basePacket();
  delete packet.seal.observationBasis.destination.runtime;

  assert.throws(
    () => checkSealedPacket(packet),
    /MISSING_BASIS_ARTIFACT:destination.runtime/,
  );
});

test('available basis artifacts must match their declared byte commitment', () => {
  const packet = basePacket();
  packet.seal.observationBasis.source.header = {
    availability: 'AVAILABLE',
    raw: '0x01',
    commitment: `0x${'00'.repeat(32)}`,
  };

  assert.throws(
    () => checkSealedPacket(packet),
    /BASIS_ARTIFACT_COMMITMENT_MISMATCH:source.header/,
  );
});

test('the checker binds parsed profile and expectations to the frozen file blobs', () => {
  const substitutedProfile = structuredClone(profile);
  substitutedProfile.recordIdentity.domainText = 'attacker/record/1';
  assert.throws(
    () => checkSealedPacket(basePacket(), substitutedProfile),
    /PROFILE_OBJECT_MISMATCH/,
  );

  const substitutedExpectations = structuredClone(expectations);
  substitutedExpectations.source.planningCommit = 'f'.repeat(40);
  assert.throws(
    () => checkSealedPacket(basePacket(), profile, substitutedExpectations),
    /EXPECTATIONS_OBJECT_MISMATCH/,
  );

  assert.throws(
    () => checkSealedPacket(basePacket(), profile, expectations, {
      profileRaw: profileRaw.replace('efs2\/record\/1', 'evil\/record\/1'),
      expectationsRaw,
    }),
    /PROFILE_BLOB_MISMATCH/,
  );
});

test('a matching control packet reports frozen inputs but unauthenticated observations', () => {
  const report = checkSealedPacket(basePacket());

  assert.deepEqual(report.inputIntegrity, {
    status: 'VERIFIED_FROZEN_FILES',
    profileBlob: '06106fe3bc717ed4638612f2ef8b90d502c705b8',
    expectationsBlob: 'a9d6c9afb5f51d0f786e006b7b5df667ae69710e',
  });
  assert.equal(report.observationIntegrity.status, 'STRUCTURALLY_BOUND_UNAUTHENTICATED');
  assert.equal(report.evaluated.canonicalEffect.status, 'UNSUPPORTED');
  assert.deepEqual(report.discrepancies, []);
});

test('CLI checks sealed files and exits nonzero when a claim upgrades evidence', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'efs-lab-oracle-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const packetPath = join(directory, 'packet.json');
  const profilePath = join(directory, 'profile.json');
  const expectationsPath = join(directory, 'expectations.json');
  const cliPath = new URL('check.mjs', import.meta.url);

  await Promise.all([
    writeFile(packetPath, `${JSON.stringify(basePacket(), null, 2)}\n`),
    writeFile(profilePath, profileRaw),
    writeFile(expectationsPath, expectationsRaw),
  ]);

  const matching = spawnSync(process.execPath, [cliPath.pathname, packetPath, profilePath, expectationsPath], {
    encoding: 'utf8',
    env: process.env,
  });
  assert.equal(matching.status, 0, matching.stderr);
  assert.deepEqual(JSON.parse(matching.stdout).discrepancies, []);

  const claimless = basePacket();
  claimless.claims = {};
  await writeFile(packetPath, `${JSON.stringify(claimless, null, 2)}\n`);
  const rejectedOmission = spawnSync(
    process.execPath,
    [cliPath.pathname, packetPath, profilePath, expectationsPath],
    { encoding: 'utf8', env: process.env },
  );
  assert.equal(rejectedOmission.status, 1, rejectedOmission.stderr);
  assert.equal(JSON.parse(rejectedOmission.stdout).discrepancies.length, expectations.axes.length);

  const upgraded = basePacket();
  delete upgraded.observations.destinationAdmission;
  upgraded.claims.destinationAdmission = 'ADMITTED';
  await writeFile(packetPath, `${JSON.stringify(upgraded, null, 2)}\n`);
  const rejected = spawnSync(process.execPath, [cliPath.pathname, packetPath, profilePath, expectationsPath], {
    encoding: 'utf8',
    env: process.env,
  });
  assert.equal(rejected.status, 1, rejected.stderr);
  assert.deepEqual(
    JSON.parse(rejected.stdout).discrepancies.find(({ axis }) => axis === 'destinationAdmission'),
    { axis: 'destinationAdmission', claimed: 'ADMITTED', evaluated: 'UNKNOWN' },
  );

  const substitutedProfile = structuredClone(profile);
  substitutedProfile.candidate.sourceCommit = 'f'.repeat(40);
  await writeFile(profilePath, `${JSON.stringify(substitutedProfile, null, 2)}\n`);
  const rejectedSubstitution = spawnSync(
    process.execPath,
    [cliPath.pathname, packetPath, profilePath, expectationsPath],
    { encoding: 'utf8', env: process.env },
  );
  assert.equal(rejectedSubstitution.status, 1);
  assert.match(rejectedSubstitution.stderr, /PROFILE_BLOB_MISMATCH/);
});
