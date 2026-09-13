import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  checkSealedPacket,
  classifyCostState,
  correlateRpcResponses,
  reconstructCommitments,
  verifyEoaSignature,
} from './oracle.mjs';

const loadJson = async (name) => JSON.parse(
  await readFile(new URL(name, import.meta.url), 'utf8'),
);

const profile = await loadJson('profile-b.public.json');
const vectors = await loadJson('hand-vectors.json');
const expectations = await loadJson('neutral-expectations.json');

const evidence = (kind, value = '0x01') => [{ kind, value }];

function basePacket() {
  const record = vectors.recordQuote3000;
  const subject = vectors.subjectSynthetic;
  return {
    seal: {
      candidateSourceCommit: profile.candidate.sourceCommit,
      neutralSource: expectations.source,
      observationBasis: {
        blockHash: `0x${'ab'.repeat(32)}`,
        proofGrade: 'RETAINED_RPC_ONLY',
      },
    },
    inputs: {
      typeDomainText: profile.typeIdentity.quoteDomainText,
      body: record.body,
      principalId: subject.principalId,
      salt: subject.salt,
    },
    observations: {
      signature: {
        digest: vectors.signaturePrimitive.digest,
        signature: vectors.signaturePrimitive.signature,
        expectedAuthor: vectors.signaturePrimitive.expectedAuthor,
        bindsAxis: 'recordIdentity',
        evidence: evidence('RAW_SIGNATURE', vectors.signaturePrimitive.signature),
      },
      referenceValidation: {
        targetFound: true,
        targetTypeMatches: true,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('RAW_REFERENCE_WORD'),
      },
      sourceAcceptance: {
        rowPresent: true,
        acceptanceProfileMatches: true,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('SOURCE_ADMISSION_ROW'),
      },
      destinationAdmission: {
        rowPresent: true,
        acceptanceProfileMatches: true,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('DESTINATION_ADMISSION_ROW'),
      },
      submission: {
        transactionHash: `0x${'cd'.repeat(32)}`,
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('TRANSACTION_HASH'),
      },
      receipt: {
        statusHex: '0x1',
        proofGrade: 'RETAINED_RPC_ONLY',
        evidence: evidence('RECEIPT_BYTES'),
      },
      requiredEffects: [
        { name: 'head', expected: '0x01', observed: '0x01', evidence: evidence('HEAD_ROW') },
        { name: 'requiredIndex', expected: '0x01', observed: '0x01', evidence: evidence('INDEX_ROW') },
      ],
      costState: {
        recordPresentBefore: false,
        recordPresentAfter: true,
        sameOperationAlreadyPresentBefore: false,
      },
    },
    claims: {
      recordIdentity: record.recordId,
      subjectIdentity: subject.subjectId,
      signatureValidity: 'VALID',
      referenceValidation: 'VALID',
      sourceAcceptance: 'ACCEPTED',
      destinationAdmission: 'ADMITTED',
      receipt: 'SUCCESS',
      canonicalEffect: 'COMMITTED',
      costState: 'FRESH',
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

test('body mutation cannot retain identity or its bound signature while references stay independent', () => {
  const packet = basePacket();
  packet.inputs.body = vectors.recordQuote3001Mutation.body;

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.recordIdentity.status, 'MISMATCH');
  assert.equal(report.evaluated.recordIdentity.value, vectors.recordQuote3001Mutation.recordId);
  assert.equal(report.evaluated.signatureValidity.status, 'INVALID');
  assert.equal(report.evaluated.signatureValidity.reason, 'DIGEST_BINDING_MISMATCH');
  assert.equal(report.evaluated.referenceValidation.status, 'VALID');
  assert.equal(report.evaluated.actionCommitment.status, 'UNSUPPORTED');
  assert.equal(report.evaluated.signedDigest.status, 'UNSUPPORTED');
});

test('missing evidence remains unknown and cannot satisfy a success claim', () => {
  const packet = basePacket();
  delete packet.observations.referenceValidation;

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
    status: 'VALID',
    proofGrade: 'RETAINED_RPC_ONLY',
    evidence: evidence('OPAQUE_CANDIDATE_OUTPUT'),
  };

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.referenceValidation.status, 'UNKNOWN');
  assert.equal(
    report.evaluated.referenceValidation.reason,
    'INSUFFICIENT_RAW_EVIDENCE:referenceValidation',
  );
  assert.equal(report.rawObservations.referenceValidation.status, 'VALID');
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

  assert.equal(report.evaluated.sourceAcceptance.status, 'ACCEPTED');
  assert.equal(report.evaluated.destinationAdmission.status, 'UNKNOWN');
  assert.equal(report.evaluated.destinationAdmission.reason, 'MISSING_EVIDENCE:destinationAdmission');
});

test('receipt success and canonical effects remain independent', () => {
  const packet = basePacket();
  packet.observations.requiredEffects[1] = {
    name: 'requiredIndex',
    expected: '0x01',
    observed: null,
    absenceProven: true,
    evidence: evidence('INDEX_ABSENCE_PROOF'),
  };

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.receipt.status, 'SUCCESS');
  assert.equal(report.evaluated.canonicalEffect.status, 'NOT_COMMITTED_PROVEN');
  assert.equal(report.discrepancies.some(({ axis }) => axis === 'canonicalEffect'), true);
});

test('lost submission evidence does not erase a separately proven effect or permit retry', () => {
  const packet = basePacket();
  delete packet.observations.submission;

  const report = checkSealedPacket(packet, profile, expectations);

  assert.equal(report.evaluated.submission.status, 'UNKNOWN');
  assert.equal(report.evaluated.canonicalEffect.status, 'COMMITTED');
  assert.equal(report.evaluated.retryAllowed, false);
});

test('classifies fresh, existing, retry and contradictory cost states from pre/post facts', () => {
  const cases = new Map(expectations.cases
    .filter(({ input }) => input)
    .map((entry) => [entry.id, entry]));

  for (const id of ['fresh-content', 'existing-content-new-action', 'exact-retry', 'contradictory-cost-state']) {
    const entry = cases.get(id);
    assert.equal(classifyCostState(entry.input).value, entry.expected.costState, id);
  }
});

test('raw observations and candidate claims survive comparison as separate values', () => {
  const packet = basePacket();
  packet.claims.destinationAdmission = 'SELECTED';

  const report = checkSealedPacket(packet, profile, expectations);

  assert.deepEqual(report.rawObservations, packet.observations);
  assert.deepEqual(report.claims, packet.claims);
  assert.equal(report.evaluated.destinationAdmission.status, 'ADMITTED');
  assert.deepEqual(report.discrepancies.find(({ axis }) => axis === 'destinationAdmission'), {
    axis: 'destinationAdmission',
    claimed: 'SELECTED',
    evaluated: 'ADMITTED',
  });
});

test('a moving-tag or malformed observation basis cannot enter the sealed checker', () => {
  const packet = basePacket();
  packet.seal.observationBasis.blockHash = 'latest';

  assert.throws(
    () => checkSealedPacket(packet, profile, expectations),
    /MALFORMED_OBSERVATION_BASIS/,
  );
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
    writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`),
    writeFile(expectationsPath, `${JSON.stringify(expectations, null, 2)}\n`),
  ]);

  const matching = spawnSync(process.execPath, [cliPath.pathname, packetPath, profilePath, expectationsPath], {
    encoding: 'utf8',
    env: process.env,
  });
  assert.equal(matching.status, 0, matching.stderr);
  assert.deepEqual(JSON.parse(matching.stdout).discrepancies, []);

  const upgraded = basePacket();
  delete upgraded.observations.destinationAdmission;
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
});
