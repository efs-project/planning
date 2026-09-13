import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const runnerPath = new URL('./measure.mjs', import.meta.url);

function loadConsumerCheck() {
  const source = readFileSync(runnerPath, 'utf8');
  const slotsStart = source.indexOf('const CONSUMER_SLOTS =');
  const slotsEnd = source.indexOf('\n', slotsStart);
  const checkStart = source.indexOf('async function consumerCheck(');
  const checkEnd = source.indexOf('// Stateless consumers:', checkStart);
  assert.notEqual(slotsStart, -1, 'CONSUMER_SLOTS declaration exists');
  assert.notEqual(checkStart, -1, 'consumerCheck declaration exists');
  assert.notEqual(checkEnd, -1, 'consumerCheck declaration boundary exists');

  const calls = [];
  const values = {
    lastStatus: 1n,
    lastTarget: '0xAbCd',
    lastRevision: 2n,
    lastAdmission: 3n,
    lastCount: 4n,
    lastScanned: 5n,
    lastValue: 6n,
  };
  const observe = async (_ctx, _sink, stage, _contract, _key, fn, _args, block) => {
    calls.push({ stage, fn, block });
    return [values[fn]];
  };
  const context = {
    assert,
    CAVEAT_EXPECTED: 'candidate-side self-check',
    log() {},
    observe,
    str: (value) => (typeof value === 'bigint' ? value.toString() : value),
  };
  const declarations = `${source.slice(slotsStart, slotsEnd)}\n${source.slice(checkStart, checkEnd)}`;
  const loaded = vm.runInNewContext(`${declarations}\n({ CONSUMER_SLOTS, consumerCheck })`, context);
  return { ...loaded, calls, values };
}

function makeContext(fn) {
  return {
    raw: [],
    txs: [{ candidateInputs: { fn } }],
    consumerChecks: [],
    mismatches: 0,
    async other() { throw new Error('consumerCheck must not mine a later block'); },
    async latestBlock() { throw new Error('consumerCheck must not query a later height'); },
  };
}

test('consumerCheck catches a receipt-basis regression for every storing-consumer readback stage', async () => {
  for (const fn of ['readQuote', 'readList', 'readHead', 'readHistory']) {
    const { CONSUMER_SLOTS, consumerCheck, calls, values } = loadConsumerCheck();
    const ctx = makeContext(fn);
    const row = { label: fn, block: 91, txIndex: 0 };
    const check = await consumerCheck(ctx, row, values);

    assert.deepEqual(calls.map(({ fn: slot, block }) => [slot, block]), Array.from(CONSUMER_SLOTS, (slot) => [slot, row.block]));
    assert.deepEqual(Array.from(check.slotsAtReceiptBlock), Array.from(CONSUMER_SLOTS));
    assert.deepEqual(Array.from(check.slotsOneBlockLater), []);
    assert.equal(check.laterBlock, null);
    assert.equal(check.block, row.block);
    assert.deepEqual({ ...check.actual }, {
      lastStatus: '1',
      lastTarget: '0xAbCd',
      lastRevision: '2',
      lastAdmission: '3',
      lastCount: '4',
      lastScanned: '5',
      lastValue: '6',
    });
  }
});

test('consumerCheck catches a dropped expected-field comparison by counting the mismatch', async () => {
  const { consumerCheck } = loadConsumerCheck();
  const ctx = makeContext('readQuote');
  const check = await consumerCheck(ctx, { label: 'wrong-quote', block: 37, txIndex: 0 }, {
    lastTarget: '0xdefinitely-wrong',
    lastValue: 6n,
  });

  assert.equal(check.match, false);
  assert.equal(check.compared.lastTarget.equal, false);
  assert.equal(check.compared.lastValue.equal, true);
  assert.equal(ctx.mismatches, 1);
});
