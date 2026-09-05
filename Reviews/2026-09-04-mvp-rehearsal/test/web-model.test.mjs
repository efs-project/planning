import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyRead,
  promptPolicy,
  operationPresentation,
  verifiedLaunchBytes,
  createGameLease,
  humanKind,
  rowEvidence,
  formatBasisSummary,
  decodedFieldRows,
  verifiedLaunchSelection,
  createLaunchCoordinator,
  verifiedSessionGrant,
} from '../web/model.mjs';

const qualified = overrides => ({
  outcome: 'FOUND',
  qualification: {
    coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID',
    authority: 'AUTHORIZED_AT_BASIS', currentness: 'CURRENT_AT_BASIS',
    finality: 'UNFINALIZED', integrity: 'NOT_APPLICABLE',
    availability: 'NOT_APPLICABLE', bytes: 'NOT_APPLICABLE',
    effect: 'NOT_APPLICABLE',
  },
  ...overrides,
});

test('partial zero-row page is incomplete rather than empty', () => {
  const view = classifyRead(qualified({ items: [], qualification: {
    ...qualified({}).qualification, coverage: 'PARTIAL',
  }}));
  assert.equal(view.tone, 'warning');
  assert.match(view.title, /incomplete/i);
  assert.doesNotMatch(view.title, /empty|not found/i);
});

test('unknown provider state is unavailable rather than absent', () => {
  const view = classifyRead(qualified({ outcome: 'UNKNOWN', reasonCode: 'RPC_UNAVAILABLE' }));
  assert.equal(view.tone, 'warning');
  assert.match(view.title, /cannot establish/i);
});

test('write success requires independently committed read-back', () => {
  assert.equal(operationPresentation({ stage: 'WORKING' }).title, 'Working · preparing exact plan');
  assert.equal(operationPresentation({ stage: 'INCLUDED', effect: 'UNKNOWN' }).success, false);
  assert.equal(operationPresentation({ stage: 'READ_BACK_VERIFIED', effect: 'COMMITTED' }).success, true);
});

test('file rows translate protocol kinds and metadata-only evidence without changing raw values', () => {
  assert.equal(humanKind(1), 'Folder');
  assert.equal(humanKind(2), 'File');
  assert.equal(humanKind('custom'), 'custom');
  assert.equal(rowEvidence({ integrity: 'NOT_APPLICABLE' }), 'Observed metadata');
  assert.equal(rowEvidence({ integrity: 'VERIFIED' }), 'Verified');
});

test('basis summary follows the latest fixed block hash', () => {
  const status = { profile: 'mvp-c0', chainId: 31337, realmId: '0xrealm' };
  assert.equal(
    formatBasisSummary(status, { blockNumber: 9n, blockHash: '0x1234567890abcdef1234567890abcdef' }),
    'mvp-c0 · chain 31337 · block 9 · 0x1234567890…90abcdef',
  );
});

test('decoded typed fields become concise human-readable rows', () => {
  assert.deepEqual(decodedFieldRows({ fields: [42n, true, 'ASCII', new Uint8Array([0xab, 0xcd])] }), [
    { name: 'Field 1', value: '42' },
    { name: 'Field 2', value: 'true' },
    { name: 'Field 3', value: 'ASCII' },
    { name: 'Field 4', value: '0xabcd' },
  ]);
  assert.deepEqual(decodedFieldRows({ outcome: 'UNKNOWN' }), []);
});

test('wallet mode prompt budgets are explicit and mutually exclusive', () => {
  assert.deepEqual(promptPolicy('RELAYED_EOA', false), { setup: 0, routine: 1, kind: 'message' });
  assert.deepEqual(promptPolicy('DIRECT_EOA', false), { setup: 0, routine: 1, kind: 'transaction' });
  assert.deepEqual(promptPolicy('SESSION', true), { setup: 0, routine: 0, kind: 'session' });
  assert.deepEqual(promptPolicy('SESSION', false), { setup: 1, routine: 0, kind: 'grant setup' });
});

test('play accepts only exact returned bytes with verified integrity', () => {
  const bytes = new Uint8Array([60, 33, 68, 79, 67, 84, 89, 80, 69, 62]);
  assert.equal(verifiedLaunchBytes({ qualification: {
    integrity: 'VERIFIED', availability: 'AVAILABLE', bytes: 'RETURNED',
  }, bytes }), bytes);
  assert.throws(() => verifiedLaunchBytes({ qualification: {
    integrity: 'FAILED', availability: 'AVAILABLE', bytes: 'RETURNED',
  }, bytes }), /not independently verified/i);
});

test('game lease launches sandboxed and tears down resources idempotently', () => {
  const calls = [];
  const host = {
    createUrl: () => 'blob:game',
    revokeUrl: url => calls.push(['revoke', url]),
    mount: spec => calls.push(['mount', spec]),
    unmount: () => calls.push(['unmount']),
  };
  const lease = createGameLease(host);
  assert.equal(calls.length, 0, 'browsing alone must not mount a game');
  lease.launch(new Uint8Array([1]));
  assert.deepEqual(calls[0], ['mount', { src: 'blob:game', sandbox: 'allow-scripts' }]);
  lease.stop();
  lease.stop();
  assert.deepEqual(calls.slice(1), [['unmount'], ['revoke', 'blob:game']]);
});

test('pending Play cannot mount after Stop invalidates its generation', async () => {
  let resolveSelection;
  const selection = new Promise(resolve => { resolveSelection = resolve; });
  const calls = [];
  const coordinator = createLaunchCoordinator({
    select: () => selection,
    load: async () => ({ bytes: new Uint8Array([1]) }),
    admit: ({ loaded }) => loaded.bytes,
    launch: bytes => calls.push(bytes),
  });
  const pending = coordinator.play({});
  coordinator.cancel();
  resolveSelection({ value: { contentId: '0x01' } });
  assert.deepEqual(await pending, { launched: false, cancelled: true });
  assert.equal(calls.length, 0);
});

test('new Play supersedes an older deferred byte read', async () => {
  let resolveOldBytes;
  const oldBytes = new Promise(resolve => { resolveOldBytes = resolve; });
  let call = 0;
  const launched = [];
  const coordinator = createLaunchCoordinator({
    select: async () => ({ value: { contentId: '0x01' } }),
    load: async () => (++call === 1 ? oldBytes : { bytes: new Uint8Array([2]) }),
    admit: ({ loaded }) => loaded.bytes,
    launch: bytes => launched.push([...bytes]),
  });
  const first = coordinator.play({});
  await Promise.resolve();
  const second = coordinator.play({});
  assert.equal((await second).launched, true);
  resolveOldBytes({ bytes: new Uint8Array([1]) });
  assert.deepEqual(await first, { launched: false, cancelled: true });
  assert.deepEqual(launched, [[2]]);
});

test('a superseded rejected read is reported as cancellation, not a launch error', async () => {
  let rejectSelection;
  const coordinator = createLaunchCoordinator({
    select: () => new Promise((_, reject) => { rejectSelection = reject; }),
    load: async () => ({ bytes: new Uint8Array([1]) }),
    admit: ({ loaded }) => loaded.bytes,
    launch: () => assert.fail('superseded launch must not mount'),
  });
  const pending = coordinator.play({});
  coordinator.cancel();
  rejectSelection(new Error('late provider failure'));
  assert.deepEqual(await pending, { launched: false, cancelled: true });
});

test('game launch admission rejects contradictory or cross-basis evidence', () => {
  const basis = { blockHash: '0xabc', blockNumber: 7n };
  const contentId = '0x1234';
  const selection = qualified({
    value: { contentId }, basis,
    qualification: { ...qualified({}).qualification, availability: 'AVAILABLE' },
  });
  const bytes = qualified({
    value: { bytes: new Uint8Array([1, 2]) }, bytes: new Uint8Array([1, 2]), basis,
    qualification: { ...qualified({}).qualification, integrity: 'VERIFIED', availability: 'AVAILABLE', bytes: 'RETURNED' },
  });
  assert.deepEqual(verifiedLaunchSelection({ selection, bytes, expectedContentId: contentId }), bytes.bytes);
  assert.throws(() => verifiedLaunchSelection({ selection: { ...selection, qualification: { ...selection.qualification, validation: 'INVALID' } }, bytes, expectedContentId: contentId }), /selection/i);
  assert.throws(() => verifiedLaunchSelection({ selection, bytes: { ...bytes, basis: { blockHash: '0xdef', blockNumber: 8n } }, expectedContentId: contentId }), /basis/i);
  assert.throws(() => verifiedLaunchSelection({ selection, bytes: { ...bytes, qualification: { ...bytes.qualification, support: 'UNSUPPORTED' } }, expectedContentId: contentId }), /bytes/i);
});

test('session readiness requires the qualified exact expected active grant', () => {
  const grant = { key: '0xAbC', scope: '0x01', operations: 4, expiry: 99n, maxWrites: 2, maxBytes: 128n, nonce: 7n };
  const grantId = '0xgrant';
  const observed = qualified({
    basis: { blockHash: '0xabc' }, domain: { subject: grantId },
    value: { grant: { ...grant, key: '0xabc' }, approval: '0x1234', revoked: false, writes: 0n, bytesUsed: 0n },
    qualification: { ...qualified({}).qualification, availability: 'AVAILABLE' },
  });
  assert.equal(verifiedSessionGrant({ observed, expectedGrant: grant, expectedGrantId: grantId }), true);
  assert.throws(() => verifiedSessionGrant({ observed: { ...observed, value: { ...observed.value, revoked: true } }, expectedGrant: grant, expectedGrantId: grantId }), /grant/i);
  assert.throws(() => verifiedSessionGrant({ observed: { ...observed, qualification: { ...observed.qualification, validation: 'UNKNOWN' } }, expectedGrant: grant, expectedGrantId: grantId }), /grant/i);
  assert.throws(() => verifiedSessionGrant({ observed: { ...observed, value: { ...observed.value, grant: { ...observed.value.grant, scope: '0x02' } } }, expectedGrant: grant, expectedGrantId: grantId }), /grant/i);
});
