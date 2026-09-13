import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  analyzeRetainedSignedTransactions,
  analyzeSignatureBinding,
  gitBlobHash,
  parsePinnedAbiProfile,
  parsePinnedRetainedPacket,
  parsePinnedVector,
  verifyPinnedPublicProfile,
} from './signature-binding.mjs';

const require = createRequire(import.meta.url);
const { Signature, SigningKey, keccak256, toUtf8Bytes } = require('ethers');

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const profileUrl = new URL('signature-binding-profile-dcc7b94.json', import.meta.url);
const profile = JSON.parse(await readFile(profileUrl, 'utf8'));

function gitBytes(source) {
  return execFileSync('git', [
    'show',
    `${source.publishedCommit}:${source.path}`,
  ], { cwd: repoRoot });
}

const publicProfileBytes = gitBytes(profile.source.publicProfile);
const publicVectorBytes = gitBytes(profile.source.publicVector);
const vector = parsePinnedVector(publicVectorBytes, profile);
const abiProfileBytes = await readFile(new URL('rpc-observed-profile-dcc7b94.json', import.meta.url));
const retainedPacketBytes = execFileSync('git', [
  'show',
  `${profile.source.retainedPacket.commit}:${profile.source.retainedPacket.path}`,
], { cwd: repoRoot });

function analyze(value = vector) {
  return analyzeSignatureBinding(value, profile, {
    publicProfileGitBlob: gitBlobHash(publicProfileBytes),
    publicVectorGitBlob: gitBlobHash(publicVectorBytes),
  });
}

function flipWord(word) {
  const last = word.at(-1);
  return `${word.slice(0, -1)}${last === '0' ? '1' : '0'}`;
}

test('pins only the two authorized public declaration blobs before interpretation', () => {
  assert.equal(
    verifyPinnedPublicProfile(publicProfileBytes, profile),
    profile.source.publicProfile.gitBlob,
  );
  assert.equal(gitBlobHash(publicVectorBytes), profile.source.publicVector.gitBlob);
  assert.equal(vector.schema, profile.source.publicVector.schema);
});

test('independently derives the positive action commitment, EIP-712 digest, and EOA', () => {
  const report = analyze();

  assert.equal(report.derived.actionsEncoded, vector.actionCommitment.actionsEncoded);
  assert.equal(report.derived.actionsHash, vector.actionCommitment.actionsHash);
  assert.equal(report.derived.domainTypehash, vector.eip712.domainTypehash);
  assert.equal(report.derived.domainSeparator, vector.eip712.domainSeparator);
  assert.equal(report.derived.intentTypehash, vector.eip712.intentTypehash);
  assert.equal(report.derived.structEncoded, vector.eip712.structEncoded);
  assert.equal(report.derived.structHash, vector.eip712.structHash);
  assert.equal(report.derived.digestPreimage, vector.eip712.digestPreimage);
  assert.equal(report.derived.digest, vector.eip712.digest);
  assert.equal(report.signatureBinding.recovered.toLowerCase(), vector.author.toLowerCase());
  assert.ok(Object.values(report.comparisons).every(({ status }) => status === 'MATCH'));

  assert.equal(report.bodyCommitment.status, profile.mutationExpectations.positive.bodyCommitment);
  assert.equal(report.declaredActionShape.status, profile.mutationExpectations.positive.declaredActionShape);
  assert.equal(report.signatureBinding.status, profile.mutationExpectations.positive.signatureBinding);
  assert.equal(report.runtimeAcceptance.status, 'UNKNOWN');
  assert.equal(report.stateAuthorization.status, 'UNKNOWN');
  assert.equal(report.candidatePass, 'NOT_EVALUATED');
  assert.equal(report.replayDomain.status, 'PARTIAL');
  assert.deepEqual(report.replayDomain.absent, ['chainId', 'verifyingContract']);
  assert.doesNotMatch(
    JSON.stringify(report),
    new RegExp(vector.publicThrowawayKey.privateKey.slice(2), 'i'),
  );
});

test('changed body under unchanged actions is runtime-shape-invalid while the signature still binds', () => {
  const mutated = structuredClone(vector);
  mutated.inputs.bodies[1] = `${mutated.inputs.bodies[1].slice(0, -2)}b9`;
  const original = analyze();
  const report = analyze(mutated);

  assert.equal(report.bodyCommitment.status, 'MISMATCH');
  assert.equal(report.declaredActionShape.status, 'MISMATCH');
  assert.equal(report.signatureBinding.status, 'VALID');
  assert.equal(report.derived.digest, original.derived.digest);
  assert.equal(report.runtimeAcceptance.status, 'UNKNOWN');
});

test('changed action field derives the published mutation without trusting its supplied hashes', () => {
  const mutated = structuredClone(vector);
  const independentlyMutatedRole = keccak256(toUtf8Bytes('eth-usdc-mutated'));
  mutated.actions[3].role = independentlyMutatedRole;
  const report = analyze(mutated);

  assert.equal(independentlyMutatedRole, vector.mutationExpectation.mutatedNameHash);
  assert.equal(report.derived.actionsHash, vector.mutationExpectation.mutatedActionsHash);
  assert.equal(report.derived.structHash, vector.mutationExpectation.mutatedStructHash);
  assert.equal(report.derived.digest, vector.mutationExpectation.mutatedDigest);
  assert.equal(
    report.signatureBinding.recovered.toLowerCase(),
    vector.mutationExpectation.recoveredWithOriginalSignature.toLowerCase(),
  );
  assert.equal(report.bodyCommitment.status, 'MATCH');
  assert.equal(report.declaredActionShape.status, 'MATCH');
  assert.equal(report.signatureBinding.status, 'INVALID');
});

test('reordering shape-valid actions and their bodies changes the signature commitment', () => {
  const mutated = structuredClone(vector);
  [mutated.actions[2], mutated.actions[3]] = [mutated.actions[3], mutated.actions[2]];
  [mutated.inputs.bodies[2], mutated.inputs.bodies[3]] = [mutated.inputs.bodies[3], mutated.inputs.bodies[2]];
  const report = analyze(mutated);

  assert.equal(report.bodyCommitment.status, 'MATCH');
  assert.equal(report.declaredActionShape.status, 'MATCH');
  assert.equal(report.signatureBinding.status, 'INVALID');
  assert.notEqual(report.derived.actionsHash, vector.actionCommitment.actionsHash);
});

for (const [field, replacement] of [
  ['realmId', (value) => flipWord(value)],
  ['coreCodeCommitment', (value) => flipWord(value)],
  ['author', () => '0x1111111111111111111111111111111111111111'],
  ['nonce', () => '1'],
  ['deadline', () => '1800000001'],
  ['acceptanceProfile', (value) => flipWord(value)],
  ['indexObligations', (value) => flipWord(value)],
]) {
  test(`changing Intent.${field} invalidates the original signature`, () => {
    const mutated = structuredClone(vector);
    mutated.intent[field] = replacement(mutated.intent[field]);
    const report = analyze(mutated);
    assert.equal(report.signatureBinding.status, 'INVALID');
    assert.equal(report.derived.actionsHash, vector.actionCommitment.actionsHash);
    assert.equal(report.runtimeAcceptance.status, 'UNKNOWN');
  });
}

test('a well-formed signature from the wrong key does not authorize the declared author', () => {
  const mutated = structuredClone(vector);
  const digest = analyze().derived.digest;
  const wrongKey = new SigningKey(`0x${'11'.repeat(32)}`);
  mutated.signature.serialized = Signature.from(wrongKey.sign(digest)).serialized;
  const report = analyze(mutated);

  assert.equal(report.signatureBinding.status, 'INVALID');
  assert.equal(report.signatureBinding.reason, 'RECOVERED_SIGNER_DIFFERS_FROM_INTENT_AUTHOR');
});

for (const [label, mutate] of [
  ['bytes32 width', (value) => { value.actions[0].typeId = '0x12'; }],
  ['uint8 range', (value) => { value.actions[0].kind = 256; }],
  ['uint32 range', (value) => { value.actions[0].expectedRevision = '4294967296'; }],
  ['address width', (value) => { value.intent.author = '0x1234'; }],
  ['uint64 range', (value) => { value.intent.nonce = '18446744073709551616'; }],
  ['negative integer', (value) => { value.intent.deadline = '-1'; }],
]) {
  test(`rejects malformed ${label} before hashing`, () => {
    const malformed = structuredClone(vector);
    mutate(malformed);
    assert.throws(() => analyze(malformed), /MALFORMED_/);
  });
}

test('an in-range but undeclared action kind is a declared shape mismatch', () => {
  const mutated = structuredClone(vector);
  mutated.actions[0].kind = 7;
  const report = analyze(mutated);
  assert.equal(report.declaredActionShape.status, 'MISMATCH');
  assert.equal(report.signatureBinding.status, 'INVALID');
});

test('outer action count and body count rules remain static shape checks, not signature authority', () => {
  const empty = structuredClone(vector);
  empty.actions = [];
  empty.inputs.bodies = [];
  const emptyReport = analyze(empty);
  assert.equal(emptyReport.declaredActionShape.status, 'MISMATCH');
  assert.equal(emptyReport.signatureBinding.status, 'INVALID');

  const unequal = structuredClone(vector);
  unequal.inputs.bodies.pop();
  const unequalReport = analyze(unequal);
  assert.equal(unequalReport.bodyCommitment.status, 'MISMATCH');
  assert.equal(unequalReport.declaredActionShape.status, 'MISMATCH');
  assert.equal(unequalReport.signatureBinding.status, 'VALID');
});

test('the declared publish body limit is checked separately from signature binding', () => {
  const mutated = structuredClone(vector);
  const body = `0x${'00'.repeat(profile.limits.publishBodyMaxBytes + 1)}`;
  mutated.inputs.bodies[1] = body;
  mutated.actions[1].bodyHashOrRecordId = keccak256(body);
  const report = analyze(mutated);
  assert.equal(report.bodyCommitment.status, 'MATCH');
  assert.equal(report.declaredActionShape.status, 'MISMATCH');
  assert.equal(report.signatureBinding.status, 'INVALID');
});

test('signature byte mutation cannot preserve a valid author binding', () => {
  const mutated = structuredClone(vector);
  mutated.signature.serialized = `0xe${mutated.signature.serialized.slice(3)}`;
  assert.notEqual(analyze(mutated).signatureBinding.status, 'VALID');
});

test('signature parsing rejects non-65-byte, high-s, and invalid-v forms before recovery', () => {
  const short = structuredClone(vector);
  short.signature.serialized = short.signature.serialized.slice(0, -2);
  assert.deepEqual(
    [analyze(short).signatureBinding.status, analyze(short).signatureBinding.reason],
    ['MALFORMED', 'SIGNATURE_MUST_BE_EXACTLY_65_BYTES'],
  );

  const original = vector.signature.serialized;
  const r = original.slice(2, 66);
  const lowS = BigInt(`0x${original.slice(66, 130)}`);
  const curveOrder = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
  const highS = (curveOrder - lowS).toString(16).padStart(64, '0');
  const high = structuredClone(vector);
  high.signature.serialized = `0x${r}${highS}${vector.signature.v === 27 ? '1c' : '1b'}`;
  assert.deepEqual(
    [analyze(high).signatureBinding.status, analyze(high).signatureBinding.reason],
    ['MALFORMED', 'SIGNATURE_S_EXCEEDS_LOW_S_MAXIMUM'],
  );

  const invalidV = structuredClone(vector);
  invalidV.signature.serialized = `${original.slice(0, -2)}1d`;
  assert.deepEqual(
    [analyze(invalidV).signatureBinding.status, analyze(invalidV).signatureBinding.reason],
    ['MALFORMED', 'SIGNATURE_V_MUST_BE_27_OR_28'],
  );
});

test('direct light-report mode reads only the two pinned public Git blobs', () => {
  const run = spawnSync(process.execPath, [
    new URL('signature-binding.mjs', import.meta.url).pathname,
    fileURLToPath(profileUrl),
  ], { cwd: repoRoot, encoding: 'utf8', env: process.env });

  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.input.publicProfile.observedGitBlob, profile.source.publicProfile.gitBlob);
  assert.equal(report.input.publicVector.observedGitBlob, profile.source.publicVector.gitBlob);
  assert.equal(report.positiveVector.signatureBinding.status, 'VALID');
  assert.equal(report.positiveVector.comparisonCounts.MISMATCH, 0);
  assert.equal(report.retainedSignedTransactions.status, 'OBSERVED_MATCH');
  assert.equal(report.retainedSignedTransactions.transactions.length, 2);
  assert.ok(report.retainedSignedTransactions.transactions.every(({ calldata }) => (
    calldata.status === 'MATCH'
      && Number.isSafeInteger(calldata.encodedBytes)
      && !Object.hasOwn(calldata, 'computed')
      && !Object.hasOwn(calldata, 'supplied')
  )));
  assert.deepEqual(report.replayDomain.absent, ['chainId', 'verifyingContract']);
  assert.equal(report.candidatePass, 'NOT_EVALUATED');
});

test('stored short report is the exact direct output', async () => {
  const run = spawnSync(process.execPath, [
    new URL('signature-binding.mjs', import.meta.url).pathname,
    fileURLToPath(profileUrl),
  ], { cwd: repoRoot, encoding: 'utf8', env: process.env });

  assert.equal(run.status, 0, run.stderr);
  const stored = await readFile(
    new URL('signature-binding-dcc7b94.report.json', import.meta.url),
    'utf8',
  );
  assert.equal(run.stdout, stored);
});

test('recomputes both retained signed-one signatures from canonical calldata only', () => {
  const abiProfile = parsePinnedAbiProfile(abiProfileBytes, profile);
  const packet = parsePinnedRetainedPacket(retainedPacketBytes, profile);
  const retained = analyzeRetainedSignedTransactions(packet, abiProfile, profile);

  assert.equal(retained.status, 'OBSERVED_MATCH');
  assert.equal(retained.transactions.length, 2);
  assert.deepEqual(retained.transactions.map(({ nonce }) => nonce), ['0', '1']);
  assert.ok(retained.transactions.every((item) => item.calldata.status === 'MATCH'));
  assert.ok(retained.transactions.every((item) => item.bodyCommitment.status === 'MATCH'));
  assert.ok(retained.transactions.every((item) => item.declaredActionShape.status === 'MATCH'));
  assert.ok(retained.transactions.every((item) => item.signatureBinding.status === 'VALID'));
  assert.ok(retained.transactions.every((item) => (
    item.signatureBinding.recovered.toLowerCase()
      === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
  )));
  assert.notEqual(retained.transactions[0].derived.digest, retained.transactions[1].derived.digest);
  assert.equal(retained.authenticatedPacketProvenance.status, 'UNKNOWN');
  assert.equal(retained.runtimeAcceptance.status, 'UNKNOWN');
  assert.equal(retained.canonicalSemanticEffect.status, 'UNKNOWN');
});
