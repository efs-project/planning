import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../web/cost-ledger.mjs';

const { createLedger, reduceLedger, selectActionCosts, selectSessionCosts, exportLedger, restoreLedger, COST_PRESET, seedCostDefaults } = api;
const at = '2026-09-11T12:00:00Z';
const hash = `0x${'a'.repeat(64)}`;
const initial = () => createLedger({ sessionId: 'defaults-test', createdAt: at });
const apply = (ledger, ...events) => events.reduce(reduceLedger, ledger);
const seed = ledger => {
  assert.equal(typeof seedCostDefaults, 'function', 'the additive defaults seeder must exist');
  return seedCostDefaults(ledger);
};
const mined = () => apply(initial(), {
  type: 'action/start', actionId: 'upload', label: 'Upload', createdAt: at,
  context: { environmentId: 'anvil-defaults-test', chainId: '31337' },
}, {
  type: 'attempt/upsert', actionId: 'upload', attemptId: 'metadata',
  status: 'submitted', hash, payer: 'user',
}, {
  type: 'receipt/record', actionId: 'upload', attemptId: 'metadata',
  receipt: { hash, status: 'success', chainFamily: 'ethereum', gasUsed: '21000', effectiveGasPrice: '2000000000' },
});
const manualFee = (id, chainFamily, extra = {}) => ({
  type: 'fee/add', snapshot: { id, chainFamily, capturedAt: at, source: 'User-entered estimate', executionGasPriceWei: '7', ...extra },
});
const manualFx = (id, usdPerEth = '2000') => ({
  type: 'fx/add', snapshot: { id, capturedAt: at, source: 'User-entered exchange rate', usdPerEth },
});
const scenarioOptions = ledger => ({
  scenarioSnapshotIds: ledger.feeSnapshots.map(snapshot => snapshot.id),
  fxSnapshotId: ledger.fxSnapshots.at(-1).id,
});

// Catches omitted chain defaults, wrong unit scaling, incomplete rollup components,
// FX omissions, and using included-L1 mode with execution-only Anvil gas.
test('seeded defaults produce four nonzero hand-derived ETH/USD alternatives for a real receipt', () => {
  const original = mined();
  const actualBefore = selectActionCosts(original, 'upload').actual;
  const { ledger, changed } = seed(original);
  assert.equal(changed, true);
  assert.equal(ledger.feeSnapshots.length, 4);
  assert.equal(ledger.fxSnapshots.length, 1);
  const costs = selectActionCosts(ledger, 'upload', scenarioOptions(ledger));
  // 21,000 * sampled wei/gas + 1,000,000,000,000 illustrative posting wei
  // for each rollup. USD = ETH * 2,537.34; the model excludes operator fees.
  assert.deepEqual(costs.scenarios.map(({ chainFamily, totalWei, knownEth, totalUsd }) => ({ chainFamily, totalWei, knownEth, totalUsd })), [
    { chainFamily: 'ethereum', totalWei: '1158702993000', knownEth: '0.000001158702993', totalUsd: '0.00294002345225862' },
    { chainFamily: 'optimism', totalWei: '1021010479000', knownEth: '0.000001021010479', totalUsd: '0.00259065072878586' },
    { chainFamily: 'base', totalWei: '1126000000000', knownEth: '0.000001126', totalUsd: '0.00285704484' },
    { chainFamily: 'arbitrum', totalWei: '1420420000000', knownEth: '0.00000142042', totalUsd: '0.0036040884828' },
  ]);
  for (const cost of costs.scenarios) {
    assert.equal(cost.missingComponentCount, 0);
    assert.equal(cost.missingFxCount, 0);
    assert.equal(cost.transactionCount, 1);
  }
  assert.deepEqual(selectActionCosts(ledger, 'upload').actual, actualBefore);
  assert.equal(ledger.actions[0].effectStatus, 'unknown');
});

// Catches in-place pushes, repeated default additions, or silently rewriting input.
test('seeding is immutable and a second call is a no-op', () => {
  const original = mined();
  const before = JSON.stringify(original);
  const first = seed(original);
  assert.notEqual(first.ledger, original);
  assert.equal(JSON.stringify(original), before);
  const after = JSON.stringify(first.ledger);
  const second = seed(first.ledger);
  assert.equal(second.changed, false);
  assert.equal(second.ledger, first.ledger);
  assert.equal(JSON.stringify(second.ledger), after);
});

// Catches using completeness/recency as permission to override a user's choices.
test('existing manual fee families and FX are preserved even when incomplete or zero', () => {
  const original = apply(mined(), manualFee('old-op', 'optimism'), manualFee('new-op', 'optimism', { executionGasPriceWei: '0' }),
    manualFee('user-arb', 'arbitrum', { arbitrumMode: 'included-l1' }), manualFx('old-fx'), manualFx('latest-fx', '0'));
  const before = exportLedger(original);
  const { ledger, changed } = seed(original);
  assert.equal(changed, true);
  assert.deepEqual(ledger.feeSnapshots.slice(0, 3), original.feeSnapshots);
  assert.deepEqual(ledger.fxSnapshots, original.fxSnapshots);
  assert.deepEqual(ledger.feeSnapshots.slice(3).map(snapshot => snapshot.chainFamily), ['ethereum', 'base']);
  assert.equal(exportLedger(original), before);
  assert.deepEqual(ledger.actions, original.actions);
});

// Catches coupling FX seeding to whether any fee defaults were added.
test('an otherwise configured ledger receives only the missing FX snapshot', () => {
  const original = apply(initial(), ...['ethereum', 'optimism', 'base', 'arbitrum'].map(family => manualFee(`manual-${family}`, family)));
  const { ledger, changed } = seed(original);
  assert.equal(changed, true);
  assert.deepEqual(ledger.feeSnapshots, original.feeSnapshots);
  assert.equal(ledger.fxSnapshots.length, 1);
  assert.equal(seed(ledger).changed, false);
});

// Catches rewriting old actual-USD attribution, dropping hidden/history state, or
// needing new schema fields to preserve usable estimates after a JSON round trip.
test('old exported ledgers gain missing alternatives without changing receipt history or historical FX', () => {
  const old = apply(mined(), manualFx('historical-fx'), {
    type: 'receipt/record', actionId: 'upload', attemptId: 'metadata', fxSnapshotId: 'historical-fx',
    receipt: { hash, status: 'success', chainFamily: 'ethereum', gasUsed: '21000', effectiveGasPrice: '2000000000' },
  }, { type: 'action/effect', actionId: 'upload', status: 'verified' }, { type: 'display/reset' });
  const oldExport = exportLedger(old);
  const restoredOld = restoreLedger(oldExport);
  const { ledger } = seed(restoredOld);
  assert.equal(ledger.version, 1);
  assert.deepEqual(ledger.actions, restoredOld.actions);
  assert.deepEqual(ledger.hiddenActionIds, ['upload']);
  assert.deepEqual(ledger.fxSnapshots, restoredOld.fxSnapshots);
  assert.equal(selectActionCosts(ledger, 'upload').actual.totalUsd, '0.084');
  assert.equal(selectSessionCosts(ledger).actual.transactionCount, 0);
  assert.equal(selectSessionCosts(ledger, { includeHidden: true }).actual.transactionCount, 1);
  const roundTrip = restoreLedger(exportLedger(ledger));
  assert.deepEqual(roundTrip, ledger);
  assert.deepEqual(selectActionCosts(roundTrip, 'upload', scenarioOptions(roundTrip)), selectActionCosts(ledger, 'upload', scenarioOptions(ledger)));
  assert.equal(seed(roundTrip).changed, false);
  assert.equal(exportLedger(restoredOld), oldExport);
});

// Catches placing provenance only in non-schema preset metadata that export drops.
test('exported default snapshots retain observed-source provenance and illustrative assumptions', () => {
  const { ledger } = seed(initial());
  const restored = restoreLedger(exportLedger(ledger));
  assert.equal(typeof COST_PRESET.label, 'string');
  assert.ok(Number.isFinite(Date.parse(COST_PRESET.capturedAt)));
  const rpcSources = [
    ['ethereum', 'https://ethereum-rpc.publicnode.com', '25956788'],
    ['optimism', 'https://mainnet.optimism.io', '156781273'],
    ['base', 'https://mainnet.base.org', '51185988'],
    ['arbitrum', 'https://arb1.arbitrum.io/rpc', '504176093'],
  ];
  for (const [family, endpoint, block] of rpcSources) {
    const snapshot = restored.feeSnapshots.find(snapshot => snapshot.chainFamily === family);
    assert.ok(snapshot.source.includes(endpoint));
    assert.ok(snapshot.source.includes(block));
    assert.ok(snapshot.source.includes('eth_gasPrice'));
    if (family !== 'ethereum') {
      assert.match(snapshot.source, /illustrative/i);
      assert.match(snapshot.source, /uncalibrated/i);
      assert.match(snapshot.source, /operator.*excluded/i);
    }
  }
  assert.match(restored.fxSnapshots[0].source, /vendor\/public quote URL not supplied/);
});
