import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { concat, Interface, keccak256, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileStateful, TX_GAS, withStateful } from '../scripts/local-stateful.mjs';
import {
  InvalidCodecError,
  UnsupportedCodecError,
  decodeBatchEvidence,
  domainSeparator,
  effectsHash,
  expectedRevisionsHash,
  planDigest,
  planStructHash,
  publicationDigest,
} from '../reference/c0-authority-codec.mjs';

const strip = value => value.slice(2);
const fixed = (value, bytes) => BigInt(value).toString(16).padStart(bytes * 2, '0');
const word = value => '0x' + fixed(value, 32);
const address = value => '0x' + fixed(value, 20);
const join = parts => '0x' + parts.map(part => part.startsWith('0x') ? strip(part) : part).join('');
const W = Array.from({ length: 20 }, (_, index) => word(index));
const A = Array.from({ length: 20 }, (_, index) => address(index));
const CAS_HASH = '0x4efdbe2f47739ce9c5544159f07e456f85f0bf2ea5b463d244714bedad903d80';
const EFFECTS_HASH = '0x0c405e03b8602dec96cf4574d26783cb75cecdcfb06adb2869fe780df196a59d';
const PLAN_STRUCT_HASH = '0xa4fd0267c4aa60f334a1ae06cd1c03372081ab0a73e38cb0545daddb3cc6f9e0';
const DOMAIN_SEPARATOR = '0x42227fe1cacfc7e934646314ed4171975a4f299efb99df14fa119558b2b7df01';
const PLAN_DIGEST = '0x6fb6e6bbf70cbd51fa95b373752e525e9a79aea40051ba6a36bb5dd370187c4f';
const PUBLICATION_DOMAIN = '0xad872d31d7c6ce265e4ef38af3d323a95450b98bdfe0a43ecacfd134e60e3848';
const PUBLICATION_PREIMAGE = '0x41cb229615379fa5d2f5213653ed99aedca39e150a8add884383d1c269d1b921'
  + fixed(1, 32) + strip(W[11]) + strip(ZeroHash) + fixed(0, 32) + strip(W[12]) + fixed(9000, 32)
  + '9d0231707eb2041153c28e130d22114ee38b252cf17233585036af02278e4181';
const PUBLICATION_STRUCT_HASH = '0xadebc592dd2a021ff8565e12ecb3d19d892df9a170fe71bb34db3deda51874ec';
const PUBLICATION_DIGEST = '0x9080660e2213cef27e1a46f152f6832a5e034b675d690b65bfafe3e86fc378c8';

const rows = Object.freeze([
  Object.freeze({ leafIndex: 1, revision: 7n }),
  Object.freeze({ leafIndex: 63, revision: 4294967294n }),
]);
const effects = Object.freeze({
  realmId: W[1], core: A[2], routeConfigId: W[3], genesisReceiptHash: W[4],
  operationKind: 8, envelopeId: W[5], leafMask: 9223372036854775810n,
  expectedRevisionsHash: CAS_HASH, stateByteStore: A[6], byteCommitment: W[7],
});
const plan = Object.freeze({
  c0ProfileId: W[8], publicationDigest: W[9], realmId: W[1],
  realmEffectsDigest: EFFECTS_HASH, executor: A[2], executorCodeHash: W[10],
  nonceKey: 0n, nonceSeq: 1n, notAfter: 9000n,
});
const header = Object.freeze({
  profile: 1n, principalId: W[11], authorityRef: ZeroHash,
  authEpoch: 0n, pubNonce: W[12], notAfter: 9000n,
});
const recordIds = Object.freeze([W[13], W[14]]);

const planRaw = join([
  plan.c0ProfileId, plan.publicationDigest, plan.realmId, plan.realmEffectsDigest,
  plan.executor, plan.executorCodeHash, fixed(plan.nonceKey, 24),
  fixed(plan.nonceSeq, 8), fixed(plan.notAfter, 8),
]);
const effectsRaw = join([
  effects.realmId, effects.core, effects.routeConfigId, effects.genesisReceiptHash,
  fixed(effects.operationKind, 1), effects.envelopeId, fixed(effects.leafMask, 8),
  effects.expectedRevisionsHash, effects.stateByteStore, effects.byteCommitment,
]);
const rowsRaw = rows.map(row => fixed(row.leafIndex, 2) + fixed(row.revision, 4)).join('');
const witness = '0x' + Array.from({ length: 65 }, (_, index) => (index + 1).toString(16).padStart(2, '0')).join('');
const designatorToZero = '0xef0100' + '00'.repeat(20);

function frame({
  branch = 1, descriptorAccount = A[15], planBytes = planRaw, effectsBytes = effectsRaw,
  revisionRows = rows, rowsBytes = rowsRaw, signature = witness,
  actualSigner = A[16], submittingCaller = A[17], transactionOrigin = A[18],
  observedAccountCode = designatorToZero, admittedAtTimestamp = 1234567890123456789n,
  previousSequence = 4294967297n,
} = {}) {
  return join([
    fixed(1, 2), fixed(branch, 1), '0100' + strip(descriptorAccount), planBytes,
    effectsBytes, fixed(revisionRows.length, 1), rowsBytes,
    branch === 1 ? signature : '0x', actualSigner, submittingCaller,
    transactionOrigin, fixed((observedAccountCode.length - 2) / 2, 1),
    observedAccountCode, fixed(admittedAtTimestamp, 8), fixed(previousSequence, 8),
  ]);
}

function expectedEvidence(overrides = {}) {
  return {
    evidenceVersion: 1, branch: 1, descriptor: '0x0100' + strip(A[15]),
    plan: { ...plan }, effects: { ...effects }, expectedRevisions: rows.map(row => ({ ...row })),
    witness, actualSigner: A[16], submittingCaller: A[17], transactionOrigin: A[18],
    observedAccountCode: designatorToZero, admittedAtTimestamp: 1234567890123456789n,
    previousSequence: 4294967297n, ...overrides,
  };
}

function replaceByte(raw, offset, byte) {
  const index = 2 + offset * 2;
  return raw.slice(0, index) + byte + raw.slice(index + 2);
}

function invalidFraming(raw) {
  assert.throws(() => decodeBatchEvidence(raw), error =>
    error instanceof InvalidCodecError && error.code === 'INVALID_FRAMING');
}

function invalidValue(action) {
  assert.throws(action, error => error instanceof InvalidCodecError && error.code === 'INVALID_VALUE');
}

function mutate(object, field, value) {
  return { ...object, [field]: value };
}

test('literal direct frame has no witness or account code', () => {
  const raw = '0x0001020100' + '00'.repeat(20 + 220 + 241)
    + '00' + '00'.repeat(60) + '00' + '00'.repeat(16);
  assert.equal((raw.length - 2) / 2, 564);
  const decoded = decodeBatchEvidence(raw);
  assert.equal(decoded.evidenceVersion, 1);
  assert.equal(decoded.branch, 2);
  assert.equal(decoded.descriptor, '0x0100' + '00'.repeat(20));
  assert.equal(decoded.plan.nonceSeq, 0n);
  assert.deepEqual(decoded.expectedRevisions, []);
  assert.equal(decoded.witness, '0x');
  assert.equal(decoded.observedAccountCode, '0x');
});

test('independent composite literal decodes every retained field without a verdict', () => {
  const raw = frame();
  assert.equal((raw.length - 2) / 2, 664);
  assert.deepEqual(decodeBatchEvidence(raw), expectedEvidence());
  assert.notEqual(decodeBatchEvidence(raw).descriptor.slice(-40), strip(A[16]), 'account/signer mismatch remains data');
});

test('designator-to-zero remains distinct from no observed code', () => {
  const withDesignator = decodeBatchEvidence(frame());
  const withoutCode = decodeBatchEvidence(frame({ observedAccountCode: '0x' }));
  assert.equal(withDesignator.observedAccountCode, '0xef0100' + '00'.repeat(20));
  assert.equal(withoutCode.observedAccountCode, '0x');
});

test('printed independent hash fixture retains full-width numbers', () => {
  assert.equal(expectedRevisionsHash(rows), CAS_HASH);
  assert.equal(effectsHash(effects), EFFECTS_HASH);
  assert.equal(planStructHash(plan), PLAN_STRUCT_HASH);
  assert.equal(domainSeparator(31337n, A[2]), DOMAIN_SEPARATOR);
  assert.equal(planDigest(plan, 31337n, A[2]), PLAN_DIGEST);
});

test('independent publication statement preimage and digest agree', () => {
  assert.equal((PUBLICATION_PREIMAGE.length - 2) / 2, 256);
  assert.equal(keccak256(PUBLICATION_PREIMAGE), PUBLICATION_STRUCT_HASH);
  assert.equal(keccak256(concat(['0x1901', PUBLICATION_DOMAIN, PUBLICATION_STRUCT_HASH])), PUBLICATION_DIGEST);
  assert.equal(publicationDigest(header, recordIds), PUBLICATION_DIGEST);
});

test('each publication commitment input either changes the digest or violates the fixed header', () => {
  for (const changed of [
    mutate(header, 'principalId', W[19]), mutate(header, 'pubNonce', W[19]),
    mutate(header, 'notAfter', 9001n),
  ]) assert.notEqual(publicationDigest(changed, recordIds), PUBLICATION_DIGEST);
  assert.notEqual(publicationDigest(header, [W[14], W[13]]), PUBLICATION_DIGEST);
  assert.notEqual(publicationDigest(header, [W[13]]), PUBLICATION_DIGEST);
  invalidValue(() => publicationDigest(mutate(header, 'profile', 2n), recordIds));
  invalidValue(() => publicationDigest(mutate(header, 'authorityRef', W[1]), recordIds));
  invalidValue(() => publicationDigest(mutate(header, 'authEpoch', 1n), recordIds));
});

test('every expected-revision, effects, plan and domain field is committed', () => {
  assert.notEqual(expectedRevisionsHash([{ leafIndex: 2, revision: 7n }, rows[1]]), CAS_HASH);
  assert.notEqual(expectedRevisionsHash([{ leafIndex: 1, revision: 8n }, rows[1]]), CAS_HASH);
  const effectChanges = {
    realmId: W[2], core: A[3], routeConfigId: W[4], genesisReceiptHash: W[5],
    operationKind: 9, envelopeId: W[6], leafMask: 3n,
    expectedRevisionsHash: W[8], stateByteStore: A[7], byteCommitment: W[8],
  };
  for (const [field, value] of Object.entries(effectChanges))
    assert.notEqual(effectsHash(mutate(effects, field, value)), EFFECTS_HASH, field);
  const planChanges = {
    c0ProfileId: W[9], publicationDigest: W[10], realmId: W[2],
    realmEffectsDigest: W[11], executor: A[3], executorCodeHash: W[11],
    nonceKey: 1n, nonceSeq: 2n, notAfter: 9001n,
  };
  for (const [field, value] of Object.entries(planChanges))
    assert.notEqual(planStructHash(mutate(plan, field, value)), PLAN_STRUCT_HASH, field);
  assert.notEqual(domainSeparator(31338n, A[2]), DOMAIN_SEPARATOR);
  assert.notEqual(domainSeparator(31337n, A[3]), DOMAIN_SEPARATOR);
});

test('hash inputs reject wrong counts, order, widths and numeric representations', () => {
  invalidValue(() => publicationDigest(header, []));
  invalidValue(() => publicationDigest(header, Array.from({ length: 65 }, () => W[1])));
  invalidValue(() => publicationDigest(header, ['0x01']));
  invalidValue(() => publicationDigest(mutate(header, 'profile', 1), recordIds));
  invalidValue(() => publicationDigest(mutate(header, 'notAfter', '9000'), recordIds));
  invalidValue(() => expectedRevisionsHash(Array.from({ length: 65 }, (_, leafIndex) => ({ leafIndex, revision: 0n }))));
  invalidValue(() => expectedRevisionsHash([rows[1], rows[0]]));
  invalidValue(() => expectedRevisionsHash([rows[0], rows[0]]));
  invalidValue(() => expectedRevisionsHash([{ leafIndex: 64, revision: 0n }]));
  invalidValue(() => expectedRevisionsHash([{ leafIndex: 1n, revision: 0n }]));
  invalidValue(() => expectedRevisionsHash([{ leafIndex: 1, revision: '7' }]));
  invalidValue(() => effectsHash(mutate(effects, 'operationKind', 8n)));
  invalidValue(() => effectsHash(mutate(effects, 'leafMask', -1n)));
  invalidValue(() => planStructHash(mutate(plan, 'nonceKey', 2n ** 192n)));
  invalidValue(() => planStructHash(mutate(plan, 'nonceSeq', 1)));
  invalidValue(() => domainSeparator('31337', A[2]));
  invalidValue(() => domainSeparator(31337n, '0x02'));
  invalidValue(() => effectsHash(mutate(effects, 'realmId', undefined)));
});

test('all truncations and trailing bytes are malformed known framing', () => {
  const raw = frame();
  for (let bytes = 0; bytes < (raw.length - 2) / 2; bytes++) invalidFraming(raw.slice(0, 2 + bytes * 2));
  invalidFraming(raw + '00');
});

test('global syntax and cap checks precede tag interpretation', () => {
  for (const raw of [null, '', '0x0', '0xzz', '0001']) invalidFraming(raw);
  const overCapUnknownVersion = '0xffff' + '00'.repeat(1035);
  assert.equal((overCapUnknownVersion.length - 2) / 2, 1037);
  invalidFraming(overCapUnknownVersion);
});

test('complete unknown version and branch fields use typed unsupported errors', () => {
  assert.throws(() => decodeBatchEvidence('0x0002'), error =>
    error instanceof UnsupportedCodecError && error.code === 'UNSUPPORTED_VERSION');
  assert.throws(() => decodeBatchEvidence('0x000103'), error =>
    error instanceof UnsupportedCodecError && error.code === 'UNSUPPORTED_BRANCH');
  invalidFraming('0x00');
  invalidFraming('0x0001');
});

test('known framing rejects descriptor, CAS, witness and code mutations', () => {
  const raw = frame();
  invalidFraming(replaceByte(raw, 3, '02'));
  invalidFraming(replaceByte(raw, 4, '01'));
  invalidFraming(replaceByte(raw, 486, '41'));
  invalidFraming(frame({ revisionRows: [rows[0], rows[0]], rowsBytes: rowsRaw.slice(0, 12).repeat(2) }));
  invalidFraming(frame({ revisionRows: [{ leafIndex: 64, revision: 0n }], rowsBytes: fixed(64, 2) + fixed(0, 4) }));
  invalidFraming(frame({ signature: witness.slice(0, -2) }));
  invalidFraming(frame({ signature: witness + '00' }));
  invalidFraming(replaceByte(raw, 624, '16'));
  invalidFraming(replaceByte(raw, 625, 'ee'));
  invalidFraming(frame({ branch: 2, signature: '0x', observedAccountCode: designatorToZero }));
});

test('64-CAS direct and composite maxima retain unsigned full-width values', () => {
  const maxRows = Array.from({ length: 64 }, (_, leafIndex) => ({ leafIndex, revision: 4294967295n }));
  const maxRowsRaw = maxRows.map(row => fixed(row.leafIndex, 2) + fixed(row.revision, 4)).join('');
  const maxPlan = { ...plan, nonceKey: 2n ** 192n - 1n, nonceSeq: 2n ** 64n - 1n, notAfter: 2n ** 64n - 1n };
  const maxPlanRaw = join([
    maxPlan.c0ProfileId, maxPlan.publicationDigest, maxPlan.realmId, maxPlan.realmEffectsDigest,
    maxPlan.executor, maxPlan.executorCodeHash, fixed(maxPlan.nonceKey, 24), fixed(maxPlan.nonceSeq, 8), fixed(maxPlan.notAfter, 8),
  ]);
  const maxEffects = { ...effects, leafMask: 2n ** 64n - 1n };
  const maxEffectsRaw = join([
    maxEffects.realmId, maxEffects.core, maxEffects.routeConfigId, maxEffects.genesisReceiptHash,
    fixed(maxEffects.operationKind, 1), maxEffects.envelopeId, fixed(maxEffects.leafMask, 8),
    maxEffects.expectedRevisionsHash, maxEffects.stateByteStore, maxEffects.byteCommitment,
  ]);
  const direct = frame({ branch: 2, planBytes: maxPlanRaw, effectsBytes: maxEffectsRaw, revisionRows: maxRows, rowsBytes: maxRowsRaw, signature: '0x', observedAccountCode: '0x', admittedAtTimestamp: 2n ** 64n - 1n, previousSequence: 2n ** 64n - 1n });
  const composite = frame({ planBytes: maxPlanRaw, effectsBytes: maxEffectsRaw, revisionRows: maxRows, rowsBytes: maxRowsRaw, admittedAtTimestamp: 2n ** 64n - 1n, previousSequence: 2n ** 64n - 1n });
  assert.equal((direct.length - 2) / 2, 948);
  assert.equal((composite.length - 2) / 2, 1036);
  for (const decoded of [decodeBatchEvidence(direct), decodeBatchEvidence(composite)]) {
    assert.equal(decoded.expectedRevisions.length, 64);
    assert.deepEqual(decoded.expectedRevisions.at(-1), { leafIndex: 63, revision: 4294967295n });
    assert.equal(decoded.plan.nonceKey, 2n ** 192n - 1n);
    assert.equal(decoded.plan.nonceSeq, 2n ** 64n - 1n);
    assert.equal(decoded.effects.leafMask, 2n ** 64n - 1n);
    assert.equal(decoded.admittedAtTimestamp, 2n ** 64n - 1n);
  }
});

test('deployed Solidity hashes and encodings agree with independent literals and reader', { timeout: 240000 }, async t => {
  compileStateful();
  const artifact = JSON.parse(readFileSync(new URL('../out/C0CodecHarness.sol/C0CodecHarness.json', import.meta.url)));
  const iface = new Interface(artifact.abi);
  assert((artifact.bytecode.object.length - 2) / 2 <= 49152, 'initcode ceiling');
  assert((artifact.deployedBytecode.object.length - 2) / 2 <= 24576, 'runtime ceiling');
  const resources = await withStateful(async lab => {
    const transaction = await lab.send(artifact.bytecode.object);
    const receipt = await lab.receipt(transaction);
    assert.equal(receipt.status, '0x1');
    assert(BigInt(receipt.gasUsed) <= TX_GAS, 'deployment transaction ceiling');
    const deployed = await lab.rpc('eth_getCode', [receipt.contractAddress, receipt.blockNumber]);
    assert.equal(deployed, artifact.deployedBytecode.object);
    const call = async (name, args) => {
      const data = iface.encodeFunctionData(name, args);
      const raw = await lab.rpc('eth_call', [{ to: receipt.contractAddress, data }, 'latest']);
      return iface.decodeFunctionResult(name, raw)[0];
    };
    assert.equal(await call('expectedRevisionsHash', [rows]), CAS_HASH);
    assert.equal(await call('effectsHash', [effects]), EFFECTS_HASH);
    assert.equal(await call('planStructHash', [plan]), PLAN_STRUCT_HASH);
    assert.equal(await call('domainSeparator', [31337n, A[2]]), DOMAIN_SEPARATOR);
    assert.equal(await call('planDigest', [plan, 31337n, A[2]]), PLAN_DIGEST);
    assert.equal(await call('publicationDigest', [header, recordIds]), PUBLICATION_DIGEST);
    assert.equal(await call('encodePlan', [plan]), planRaw);
    assert.equal(await call('encodeEffects', [effects]), effectsRaw);
    const { evidenceVersion: _compositeVersion, ...compositeInput } = expectedEvidence();
    const compositeRaw = await call('encodeEvidence', [compositeInput]);
    assert.equal(compositeRaw, frame());
    assert.deepEqual(decodeBatchEvidence(compositeRaw), expectedEvidence());
    const directExpected = expectedEvidence({ branch: 2, witness: '0x', observedAccountCode: '0x' });
    const { evidenceVersion: _directVersion, ...directInput } = directExpected;
    const directRaw = await call('encodeEvidence', [directInput]);
    assert.equal(directRaw, frame({ branch: 2, signature: '0x', observedAccountCode: '0x' }));
    assert.deepEqual(decodeBatchEvidence(directRaw), directExpected);
    return {
      gas: BigInt(receipt.gasUsed),
      initcodeBytes: (artifact.bytecode.object.length - 2) / 2,
      runtimeBytes: (deployed.length - 2) / 2,
      cleanup: lab.cleanup,
    };
  });
  assert.equal(resources.cleanup.stopped, true, 'managed runner cleanup');
  t.diagnostic(`codec deployment gas=${resources.gas} initcode=${resources.initcodeBytes} runtime=${resources.runtimeBytes}`);
});
