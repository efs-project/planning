import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../web/cost-ledger.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const { createLedger, reduceLedger, selectActionCosts, selectSessionCosts, exportLedger, restoreLedger } = api;
const at = '2026-09-11T12:00:00Z';
const hash = `0x${'a'.repeat(64)}`;
const hash2 = `0x${'b'.repeat(64)}`;
const apply = (ledger, ...events) => events.reduce(reduceLedger, ledger);
const start = (actionId = 'upload', environmentId = 'devnet-A') => ({
  type: 'action/start', actionId, label: 'Upload', createdAt: at,
  context: { environmentId, chainId: '31337', core: `0x${'1'.repeat(40)}` },
});
const attempt = (actionId = 'upload', attemptId = 'metadata', extras = {}) => ({
  type: 'attempt/upsert', actionId, attemptId, phase: 'metadata', status: 'submitted', hash,
  payer: 'user', ...extras,
});
const receipt = (actionId = 'upload', attemptId = 'metadata', extras = {}) => ({
  type: 'receipt/record', actionId, attemptId,
  receipt: { hash, status: 'success', gasUsed: '21000', effectiveGasPrice: '2000000000', chainFamily: 'ethereum', ...extras },
});
const initial = () => {
  assert.equal(typeof createLedger, 'function', 'cost ledger API must exist');
  return createLedger({ sessionId: 'session-A', createdAt: at });
};
const mined = () => apply(initial(), start(), attempt(), receipt());
const fx = { type: 'fx/add', snapshot: { id: 'fx-1', capturedAt: at, source: 'manually pinned', usdPerEth: '2000' } };

test('receipt gas and pinned FX yield hand-derived ETH/USD without claiming verified effect', () => {
  const ledger = apply(mined(), fx);
  const cost = selectActionCosts(ledger, 'upload', { fxSnapshotId: 'fx-1' }).actual;
  // 21000 * 2 gwei = 42000000000000 wei = 0.000042 ETH; * 2000 = 0.084 USD.
  assert.equal(cost.totalWei, '42000000000000');
  assert.equal(cost.knownEth, '0.000042');
  assert.equal(cost.totalUsd, '0.084');
  assert.equal(ledger.actions[0].effectStatus, 'unknown');
  assert.equal(cost.transactionCount, 1);
});

test('reverted sponsored chunks count alongside successful metadata; missing FX stays unavailable', () => {
  const ledger = apply(mined(), attempt('upload', 'chunk-1', { hash: hash2, payer: 'sponsor' }), receipt('upload', 'chunk-1', { hash: hash2, status: 'reverted', gasUsed: '10000' }));
  const cost = selectActionCosts(ledger, 'upload').actual;
  assert.equal(cost.totalWei, '62000000000000');
  assert.equal(cost.payers.user.knownTotalWei, '42000000000000');
  assert.equal(cost.payers.sponsor.knownTotalWei, '20000000000000');
  assert.equal(cost.totalUsd, null);
  assert.equal(cost.revertedTransactionCount, 1);
});

test('duplicate receipt/hash and duplicate attempts never double count session spending', () => {
  const ledger = apply(mined(), receipt(), attempt('upload', 'poll-copy'), receipt('upload', 'poll-copy'), start('retry'), attempt('retry'), receipt('retry'));
  assert.equal(selectActionCosts(ledger, 'upload').actual.transactionCount, 1);
  assert.equal(selectSessionCosts(ledger).actual.totalWei, '42000000000000');
});

test('same chainId and hash on independent environment identities count separately', () => {
  const ledger = apply(mined(), start('other', 'devnet-B'), attempt('other'), receipt('other'));
  assert.equal(selectSessionCosts(ledger).actual.totalWei, '84000000000000');
});

test('unknown submission preserves known subtotal and prevents a complete total', () => {
  const ledger = apply(mined(), attempt('upload', 'chunk-unknown', { hash: undefined, status: 'unknown' }));
  const cost = selectActionCosts(ledger, 'upload').actual;
  assert.equal(cost.knownTotalWei, '42000000000000');
  assert.equal(cost.totalWei, null);
  assert.equal(cost.unresolvedAttemptCount, 1);
});

test('reset only hides resolved history and does not discard unresolved attempts/effects', () => {
  let ledger = apply(mined(), start('pending'), attempt('pending', 'uncertain', { hash: undefined, status: 'unknown' }), { type: 'action/effect', actionId: 'upload', status: 'verified' });
  ledger = reduceLedger(ledger, { type: 'display/reset' });
  assert.deepEqual(ledger.hiddenActionIds, ['upload']);
  assert.equal(ledger.actions.length, 2);
  assert.equal(selectSessionCosts(ledger).actual.unresolvedAttemptCount, 1);
  assert.equal(selectSessionCosts(ledger, { includeHidden: true }).actual.knownTotalWei, '42000000000000');
});

test('OP and Base distinguish missing L1/operator fees from explicit zero', () => {
  for (const chainFamily of ['optimism', 'base']) {
    const ledger = apply(initial(), start(), attempt(), receipt('upload', 'metadata', { chainFamily, l1FeeWei: '10000000000000' }));
    const cost = selectActionCosts(ledger, 'upload').actual;
    assert.equal(cost.knownTotalWei, '52000000000000');
    assert.equal(cost.totalWei, null);
    assert.equal(cost.missingComponentCount, 1);
    const complete = reduceLedger(ledger, receipt('upload', 'metadata', { chainFamily, l1FeeWei: '10000000000000', operatorFeeWei: '0' }));
    assert.equal(selectActionCosts(complete, 'upload').actual.totalWei, '52000000000000');
  }
});

test('Arbitrum total-receipt gas includes L1 once; execution-only model adds posting once', () => {
  for (const [arbitrumMode, l1FeeWei, expected] of [
    ['included-l1', '10000000000000', '42000000000000'],
    ['separate-execution', '10000000000000', '52000000000000'],
  ]) {
    const ledger = apply(initial(), start(), attempt(), receipt('upload', 'metadata', { chainFamily: 'arbitrum', arbitrumMode, l1FeeWei }));
    assert.equal(selectActionCosts(ledger, 'upload').actual.totalWei, expected);
  }
  const unknown = apply(initial(), start(), attempt(), receipt('upload', 'metadata', { chainFamily: 'arbitrum' }));
  assert.equal(selectActionCosts(unknown, 'upload').actual.totalWei, null);
});

test('missing execution price still reports known L1 fees; not-applicable is explicit', () => {
  const ledger = apply(initial(), start(), attempt(), receipt('upload', 'metadata', { chainFamily: 'base', effectiveGasPrice: null, l1FeeWei: '300', operatorFeeWei: 'not-applicable' }));
  const cost = selectActionCosts(ledger, 'upload').actual;
  assert.equal(cost.knownTotalWei, '300');
  assert.equal(cost.missingComponentCount, 1);
  assert.equal(cost.totalWei, null);
});

test('four immutable model snapshots are alternatives and never actual spending', () => {
  const snapshots = [
    { id: 'eth', chainFamily: 'ethereum', executionGasPriceWei: '3000000000' },
    { id: 'op', chainFamily: 'optimism', executionGasPriceWei: '1000000000', l1FeeWei: '1000000000000', operatorFeeWei: '2000000000000' },
    { id: 'base', chainFamily: 'base', executionGasPriceWei: '1000000000', l1FeeWei: '0' },
    { id: 'arb', chainFamily: 'arbitrum', executionGasPriceWei: '1000000000', arbitrumMode: 'separate-execution', l1FeeWei: '3000000000000' },
  ].map(snapshot => ({ ...snapshot, source: 'manual model; not a quote', capturedAt: at }));
  const ledger = apply(mined(), fx, ...snapshots.map(snapshot => ({ type: 'fee/add', snapshot })));
  const costs = selectActionCosts(ledger, 'upload', { scenarioSnapshotIds: ['eth', 'op', 'base', 'arb'], fxSnapshotId: 'fx-1' });
  assert.equal(costs.actual.totalWei, '42000000000000');
  assert.deepEqual(costs.scenarios.map(x => x.totalWei), ['63000000000000', '24000000000000', null, '24000000000000']);
  assert.equal(costs.scenarios[0].totalUsd, '0.126');
  assert.equal(costs.scenarios[2].knownTotalWei, '21000000000000');
  assert.throws(() => reduceLedger(ledger, { type: 'fee/add', snapshot: { ...snapshots[0], executionGasPriceWei: '1' } }), /immutable/i);
  assert.throws(() => reduceLedger(ledger, { ...fx, snapshot: { ...fx.snapshot, usdPerEth: '1' } }), /immutable/i);
});

test('JSON export strips unrecognized private/content metadata and validates restore', () => {
  const event = start();
  event.context.privateKey = 'SECRET-KEY';
  event.context.authorSignature = 'SECRET-SIGNATURE';
  event.context.contents = 'SECRET-CONTENT';
  const ledger = apply(initial(), event, attempt(), receipt());
  ledger.privateKey = 'INJECTED-SECRET';
  const serialized = exportLedger(ledger);
  assert.equal(/SECRET|privateKey|authorSignature|contents/.test(serialized), false);
  assert.equal(selectSessionCosts(restoreLedger(serialized)).actual.totalWei, '42000000000000');
  assert.throws(() => restoreLedger({ ...JSON.parse(serialized), version: 99 }), /version/i);
  const tampered = JSON.parse(serialized);
  tampered.actions[0].attempts[0].receipt.gasUsed = '-1';
  assert.throws(() => restoreLedger(tampered), /decimal/i);
});

test('conflicting receipt facts and action identity reuse refuse without mutating previous state', () => {
  const ledger = mined();
  const before = JSON.stringify(ledger);
  assert.throws(() => reduceLedger(ledger, receipt('upload', 'metadata', { gasUsed: '1' })), /conflict/i);
  assert.throws(() => reduceLedger(ledger, start('upload', 'devnet-B')), /immutable/i);
  assert.throws(() => reduceLedger(ledger, attempt('upload', 'metadata', { hash: hash2 })), /immutable/i);
  assert.equal(JSON.stringify(ledger), before);
});

test('same transaction cannot acquire contradictory payer attribution through another action', () => {
  const ledger = apply(mined(), start('other'));
  assert.throws(() => reduceLedger(ledger, attempt('other', 'same-tx', { payer: 'sponsor' })), /payer.*conflict|conflict.*payer/i);
});

test('payer unresolved counts remain visible beside partial known payer spending', () => {
  const ledger = apply(mined(), attempt('upload', 'unknown-chunk', { hash: undefined, status: 'unknown', payer: 'sponsor' }));
  const cost = selectSessionCosts(ledger).actual;
  assert.equal(cost.payers.sponsor.unresolvedAttemptCount, 1);
  assert.equal(cost.payers.user.unresolvedAttemptCount, 0);
  assert.equal(cost.executionGasUsed, '21000');
  assert.equal(cost.executionFeeWei, '42000000000000');
});

test('one-wei exact fractional FX does not round through Number and receipt FX survives restore', () => {
  const ledger = apply(initial(), { ...fx, snapshot: { ...fx.snapshot, usdPerEth: '2000.5' } }, start(), attempt(), {
    ...receipt('upload', 'metadata', { gasUsed: '1', effectiveGasPrice: '1' }), fxSnapshotId: 'fx-1',
  });
  assert.equal(selectSessionCosts(restoreLedger(exportLedger(ledger))).actual.totalUsd, '0.0000000000000020005');
});

test('invalid decimal/status/hash inputs and unrecognized event types refuse', () => {
  const ledger = apply(initial(), start(), attempt());
  for (const gasUsed of [21000, '-1', '1.5', '0x10', '01']) {
    assert.throws(() => reduceLedger(ledger, receipt('upload', 'metadata', { gasUsed })), /decimal/i);
  }
  assert.throws(() => reduceLedger(ledger, receipt('upload', 'metadata', { status: 'verified' })), /status/i);
  assert.throws(() => reduceLedger(ledger, attempt('upload', 'bad', { hash: '0x123' })), /hash/i);
  assert.throws(() => reduceLedger(ledger, { type: 'surprise', actionId: 'upload' }), /event type/i);
});

test('restored hidden IDs cannot conceal unresolved state or duplicate identifiers', () => {
  const ledger = mined();
  assert.throws(() => restoreLedger({ ...ledger, hiddenActionIds: ['upload'] }), /unresolved/i);
  assert.throws(() => restoreLedger({ ...ledger, actions: [...ledger.actions, ledger.actions[0]] }), /Duplicate actionId/);
});

test('FX attached during another action poll applies once to the identified transaction', () => {
  const ledger = apply(mined(), fx, start('poll'), attempt('poll'), { ...receipt('poll'), fxSnapshotId: 'fx-1' });
  assert.equal(selectSessionCosts(ledger).actual.totalUsd, '0.084');
  assert.equal(selectActionCosts(ledger, 'upload').actual.totalUsd, '0.084');
  const anotherFx = reduceLedger(ledger, { ...fx, snapshot: { ...fx.snapshot, id: 'fx-2', usdPerEth: '3000' } });
  assert.throws(() => reduceLedger(anotherFx, { ...receipt(), fxSnapshotId: 'fx-2' }), /FX.*immutable|conflict.*FX/i);
});
