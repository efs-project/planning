import test from 'node:test';
import assert from 'node:assert/strict';
import { createLedger, reduceLedger } from '../web/cost-ledger.mjs';
const api = await import('../web/economics-panel.mjs').catch(() => ({}));
test('panel model uses all receipt gas including reverts and keeps unknown attempts incomplete', () => {
  assert.equal(typeof api.panelView, 'function');
  let ledger = createLedger({ sessionId: 'test', createdAt: '2026-09-11T12:00:00Z' });
  ledger = reduceLedger(ledger, { type: 'action/start', actionId: 'a', label: 'Upload', createdAt: '2026-09-11T12:00:00Z', context: { environmentId: 'deploy1', chainId: '31337' } });
  for (const [i, status, gas] of [[1, 'success', '21000'], [2, 'reverted', '5000']]) {
    const hash = '0x' + String(i).repeat(64);
    ledger = reduceLedger(ledger, { type: 'attempt/upsert', actionId: 'a', attemptId: String(i), status: 'submitted', hash, payer: 'sponsor' });
    ledger = reduceLedger(ledger, { type: 'receipt/record', actionId: 'a', attemptId: String(i), receipt: { hash, status, gasUsed: gas, effectiveGasPrice: '2', chainFamily: 'ethereum' } });
  }
  ledger = reduceLedger(ledger, { type: 'attempt/upsert', actionId: 'a', attemptId: 'lost', status: 'unknown', payer: 'user' });
  const view = api.panelView(ledger);
  assert.equal(view.actual.executionGasUsed, '26000'); assert.equal(view.actual.totalWei, null);
  assert.equal(view.actions[0].attempts.length, 3); assert.match(view.summary, /26000/); assert.match(view.summary, /incomplete/);
});
test('RPC receipt normalization never substitutes missing gas or price with zero', () => {
  assert.equal(typeof api.normalizeReceipt, 'function');
  const hash = '0x' + 'a'.repeat(64);
  assert.deepEqual(api.normalizeReceipt({ transactionHash: hash, status: '0x0', gasUsed: '0x5208' }), { hash, status: 'reverted', gasUsed: '21000', effectiveGasPrice: null, chainFamily: 'ethereum' });
  assert.throws(() => api.normalizeReceipt({ transactionHash: hash }), /receipt status/);
});
test('sponsor partial errors retain chunk receipts and unknown metadata independently', () => {
  assert.equal(typeof api.sponsorCostEvents, 'function');
  const hash = '0x' + 'b'.repeat(64);
  const events = api.sponsorCostEvents('a', { requestId: 'request', submitted: true, status: 'failed', transactions: [{ phase: 'chunk', index: 0, hash, receipt: { transactionHash: hash, status: '0x0', gasUsed: '0x10', effectiveGasPrice: '0x2' } }, { phase: 'execute', index: null, hash: null, status: 'unknown' }] }, '0x' + '1'.repeat(40));
  assert.equal(events.filter(e => e.type === 'receipt/record')[0].receipt.gasUsed, '16');
  assert.equal(events.filter(e => e.type === 'attempt/upsert').length, 2);
  assert.equal(events.find(e => e.phase === 'execute').status, 'unknown');
});
test('human model amounts convert exactly without binary rounding or silent zero defaults', () => {
  assert.equal(typeof api.modelWei, 'function');
  assert.equal(api.modelWei('1.25', 9), '1250000000');
  assert.equal(api.modelWei('0.000001', 18), '1000000000000');
  assert.equal(api.modelWei('', 18), null);
  assert.throws(() => api.modelWei('0.0000000001', 9), /precision/);
});
