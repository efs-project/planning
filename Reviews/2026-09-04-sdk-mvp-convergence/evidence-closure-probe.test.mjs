// Disposable representation test. These are synthetic nodes, NOT C0 wire data.
import assert from 'node:assert/strict';
import test from 'node:test';
import { capture } from './evidence-closure-probe.mjs';

const profile = 'efs2/mvp-c0/2026-09-03/review-only';
const runId = 'synthetic-no-realm';
const raw = '0x00ff80c328000102'; // Includes non-UTF8 bytes: never decode as text.
const store = () => new Map([
  ['read', { refs: [], raw, outcome: 'UNKNOWN', domain: 'exact-synthetic-key',
    basis: { blockHash: 'synthetic-hash', admissionHigh: '18446744073709551615' },
    coverage: 'PARTIAL', support: 'UNSUPPORTED', validation: 'UNKNOWN',
    authority: 'UNKNOWN', currentness: 'HISTORICAL', finality: 'UNFINALIZED',
    integrity: 'UNKNOWN', availability: 'AVAILABLE', bytes: 'RETURNED',
    effect: 'NOT_APPLICABLE', reasonCode: 'UNSUPPORTED_TYPE',
    futureField: { exactOpaqueBytes: '0x80ff00' } }],
  ['plan', { refs: ['read'], raw: '0x0100', predictedEffects: ['head', 'bytes'],
    principal: 'bootstrap', actualSigner: 'bootstrap', payer: 'relayer' }],
  ['prepared', { refs: ['plan'], raw: '0x0200', profile, runId,
    family: 'PreparedWrite', stage: 'PLANNED', path: 'DIRECT_EOA',
    localPreflight: 'CHECKED', coreAuthorization: 'NOT_OBSERVED',
    portablePlanSignature: 'NOT_APPLICABLE' }],
  ['submitted', { refs: ['prepared'], raw: '0x0300', profile, runId,
    family: 'SubmittedWrite', stage: 'SUBMITTED', transactionHash: 'synthetic-tx',
    coreAuthorization: 'NOT_OBSERVED' }],
  ['evm', { refs: ['submitted'], raw: '0x0400', stage: 'INCLUDED',
    evmStatus: 'SUCCESS', blockHash: 'synthetic-post-hash' }],
  ['readback', { refs: ['evm', 'read'], raw: '0x0500', profile, runId,
    family: 'CanonicalReadBack', comparison: 'INCOMPLETE', effect: 'UNKNOWN' }],
]);

test('direct pre-submit projection does not demand or fabricate Core acceptance', () => {
  const packet = capture('prepared', store(), { profile, runId });
  assert.equal(packet.summary.stage, 'PLANNED');
  assert.deepEqual(packet.nodes.map(([id]) => id), ['prepared', 'plan', 'read']);
  assert.equal(packet.nodes[0][1].coreAuthorization, 'NOT_OBSERVED');
  assert.equal(packet.nodes[0][1].portablePlanSignature, 'NOT_APPLICABLE');
  assert.equal(Object.hasOwn(packet.summary, 'effect'), false);
});

test('submission hash is usable progress without a prior Core receipt', () => {
  const packet = capture('submitted', store(), { profile, runId });
  assert.equal(packet.summary.stage, 'SUBMITTED');
  assert.equal(packet.nodes[0][1].transactionHash, 'synthetic-tx');
  assert.equal(Object.hasOwn(packet.summary, 'effect'), false);
});

test('read-back export keeps prior journey and unavailable interpretation', () => {
  const packet = JSON.parse(JSON.stringify(capture('readback', store(), { profile, runId })));
  assert.deepEqual(packet.nodes.map(([id]) => id),
    ['readback', 'evm', 'submitted', 'prepared', 'plan', 'read']);
  assert.equal(packet.nodes[0][1].effect, 'UNKNOWN');
  assert.equal(packet.nodes[1][1].evmStatus, 'SUCCESS');
  const read = packet.nodes[5][1];
  assert.equal(read.raw, '0x00ff80c328000102');
  assert.equal(read.basis.admissionHigh, '18446744073709551615');
  assert.deepEqual(read.futureField, { exactOpaqueBytes: '0x80ff00' });
  assert.deepEqual([read.outcome, read.coverage, read.support, read.validation,
    read.authority, read.currentness, read.finality, read.integrity,
    read.availability, read.bytes, read.effect, read.reasonCode],
  ['UNKNOWN', 'PARTIAL', 'UNSUPPORTED', 'UNKNOWN', 'UNKNOWN', 'HISTORICAL',
    'UNFINALIZED', 'UNKNOWN', 'AVAILABLE', 'RETURNED', 'NOT_APPLICABLE', 'UNSUPPORTED_TYPE']);
});

test('missing prior receipt backing fails closure export instead of pruning lineage', () => {
  const input = store();
  input.delete('submitted');
  assert.throws(() => capture('readback', input, { profile, runId }), /MISSING_EVIDENCE:submitted/);
});

test('August profile cannot be relabelled September by the product adapter', () => {
  const input = store();
  input.get('prepared').profile = 'EXP-C0/v0';
  assert.throws(() => capture('prepared', input, { profile, runId }), /PROFILE_MISMATCH/);
  assert.equal(input.get('read').raw, raw); // rejection does not mutate raw evidence
});

test('different run cannot be silently substituted', () => {
  const input = store();
  input.get('prepared').runId = 'other-synthetic-run';
  assert.throws(() => capture('prepared', input, { profile, runId }), /RUN_MISMATCH/);
});

test('archive owns byte evidence rather than a mutable source alias', () => {
  const input = store();
  const packet = capture('prepared', input, { profile, runId });
  input.get('read').raw = '0x';
  input.get('read').futureField.exactOpaqueBytes = '0x';
  assert.equal(packet.nodes[2][1].raw, raw);
  assert.equal(packet.nodes[2][1].futureField.exactOpaqueBytes, '0x80ff00');
});

test('declared node bound stops oversized lineage before a partial export is returned', () => {
  assert.throws(() => capture('readback', store(), { profile, runId, maxNodes: 2 }), /EVIDENCE_LIMIT/);
});

test('foreign-profile dependency cannot hide under a September root', () => {
  const input = store();
  input.get('plan').profile = 'EXP-C0/v0';
  assert.throws(() => capture('prepared', input, { profile, runId }), /PROFILE_MISMATCH/);
});
