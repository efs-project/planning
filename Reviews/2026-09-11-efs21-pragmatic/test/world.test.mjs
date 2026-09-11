import test from 'node:test';
import assert from 'node:assert/strict';
const runner = await import('../scripts/world.mjs').catch(() => ({}));
test('fresh isolated world reconstructs state, detects identity and stale observations, and measures real workloads', {timeout:240000}, async () => {
  assert.equal(typeof runner.withWorld, 'function');
  const { exercise } = await import('../scripts/benchmark.mjs');
  const result = await runner.withWorld(async w => {
    const result = await exercise(w);
    assert.equal(result.checks.consumerValue, '3100');
    assert(result.consumerRead && BigInt(result.consumerRead.executionEstimateGas)>0n);
    assert.equal(result.checks.identityMismatchRejected, true);
    assert.equal(result.checks.staleCursorRejected, true);
    assert.equal(result.checks.staleObservationRejected, true);
    assert.equal(result.checks.historyRetained, true);
    assert(result.actions.every(a => a.receipt.transactionHash && BigInt(a.gasUsed) <= 16777216n));
    assert(result.actions.filter(a=>a.label.startsWith('edit ')||a.label==='unlink').every(a=>a.status==='COMMITTED'&&a.basis.blockHash===a.receipt.blockHash));
    assert.deepEqual(result.reads.map(r=>r.limit), [1,16,32]);
    assert.equal(result.payloads.at(-1).supported, false);
    return result;
  });
  assert.equal(result.cleanup.stopped, true);
  assert.equal(result.cleanup.cacheRemoved, true);
});
