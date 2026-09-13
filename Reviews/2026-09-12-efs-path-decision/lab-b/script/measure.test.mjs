import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

function loadReportFinalizer() {
  const source = readFileSync(runnerPath, 'utf8');
  const finalizerStart = source.indexOf('report.consumerMismatches =');
  const finalizerEnd = source.indexOf('\n  } catch (e) {', finalizerStart);
  assert.notEqual(finalizerStart, -1, 'report finalizer exists');
  assert.notEqual(finalizerEnd, -1, 'report finalizer boundary exists');
  const finalizer = source.slice(finalizerStart, finalizerEnd);
  return vm.runInNewContext(`(report) => { ${finalizer}\nreturn report; }`, { assert, Date });
}

function runnerDeclaration(startText, endText) {
  const source = readFileSync(runnerPath, 'utf8');
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  assert.notEqual(start, -1, `${startText} exists`);
  assert.notEqual(end, -1, `${startText} boundary exists`);
  return source.slice(start, end);
}

function loadFailureRow({ expectedSelector, observedSelector, before = { value: 1 }, after = before }) {
  const stripBlock = runnerDeclaration('const stripBlock =', '// ---------------------------------------------------------------- sealed cells');
  const failureRow = runnerDeclaration('async function failureRow(', 'const baseCount =');
  const probes = [before, after];
  return vm.runInNewContext(`${stripBlock}\n${failureRow}\nfailureRow`, {
    FAIL_GAS: 1n,
    assert,
    errorSelector: () => expectedSelector,
    log() {},
    observeRaw: async () => ({ error: { data: observedSelector } }),
    send: async () => ({ block: 12, status: 0 }),
    stateProbe: async () => probes.shift(),
  });
}

function loadPersist(outJson, write = writeFileSync) {
  const declaration = runnerDeclaration('function persist(report) {', '// ---------------------------------------------------------------- checks');
  return vm.runInNewContext(`${declaration}\npersist`, {
    OUT_JSON: outJson,
    anvilInfo: {},
    process: { pid: 123 },
    renameSync,
    writeFileSync: write,
  });
}

function loadRunFailureMarker(persisted, errors) {
  const declaration = runnerDeclaration('function markRunFailure(', 'function terminateRun(');
  return vm.runInNewContext(`${declaration}\nmarkRunFailure`, {
    Date,
    console: { error: (message) => errors.push(message) },
    persist: (report) => persisted.push(report),
  });
}

function loadDeployAll(ctx) {
  const declaration = runnerDeclaration('async function deployAll(', 'async function main()');
  return vm.runInNewContext(`${declaration}\ndeployAll`, { makeCtx: () => ctx });
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

test('report finalizer catches accepting a nonzero cell mismatch as a successful finish', () => {
  const finalize = loadReportFinalizer();
  const report = { cells: { quote: { mismatches: 1 }, list: { mismatches: 2 } } };

  assert.throws(() => finalize(report), /consumer\/commitment self-check mismatches: 3/);
  assert.equal(report.consumerMismatches, 3);
  assert.equal(report.finishedAt, undefined);
});

test('report finalizer catches rejecting a zero-mismatch run before successful finish', () => {
  const finalize = loadReportFinalizer();
  const report = { cells: { quote: { mismatches: 0 }, list: {} } };

  finalize(report);
  assert.equal(report.consumerMismatches, 0);
  assert.match(report.finishedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('failureRow catches accepting an unavailable expected selector', async () => {
  const failureRow = loadFailureRow({ expectedSelector: null, observedSelector: '0x12345678' });
  await assert.rejects(() => failureRow({ latestBlock: async () => 11, raw: [] }, 'missing-selector', {}, 'MissingError', []), /expected selector unavailable/);
});

test('failureRow catches accepting a wrong revert selector', async () => {
  const failureRow = loadFailureRow({ expectedSelector: '0x12345678', observedSelector: '0x87654321' });
  await assert.rejects(() => failureRow({ latestBlock: async () => 11, raw: [] }, 'wrong-selector', {}, 'WrongError', []), /revert selector mismatch/);
});

test('failureRow catches accepting changed state after the reverted transaction', async () => {
  const failureRow = loadFailureRow({ expectedSelector: '0x12345678', observedSelector: '0x12345678', before: { value: 1 }, after: { value: 2 } });
  await assert.rejects(() => failureRow({ latestBlock: async () => 11, raw: [] }, 'changed-state', {}, 'StateError', []), /state changed across expected revert/);
});

test('persist catches overwriting prior evidence when the replacement write fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'efs-measure-test-'));
  const outJson = join(dir, 'measure.json');
  writeFileSync(outJson, 'prior evidence\n');
  const partialWrite = (path) => { writeFileSync(path, 'partial evidence\n'); throw new Error('simulated write failure'); };
  try {
    const persist = loadPersist(outJson, partialWrite);
    assert.throws(() => persist({ cells: {} }), /simulated write failure/);
    assert.equal(readFileSync(outJson, 'utf8'), 'prior evidence\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('watchdog failure marker catches exiting with initialized evidence still looking successful', () => {
  const persisted = [];
  const errors = [];
  const markRunFailure = loadRunFailureMarker(persisted, errors);
  const report = { failure: null };

  assert.equal(markRunFailure(report, 'watchdog limit elapsed'), true);
  assert.equal(report.failure.message, 'watchdog limit elapsed');
  assert.equal(persisted.length, 1);
  assert.equal(errors.length, 0);
});

test('watchdog failure marker catches pretending evidence exists before report initialization', () => {
  const persisted = [];
  const errors = [];
  const markRunFailure = loadRunFailureMarker(persisted, errors);

  assert.equal(markRunFailure(null, 'watchdog limit elapsed'), false);
  assert.equal(persisted.length, 0);
  assert.match(errors[0], /report not initialized/);
});

test('deployAll catches attaching evidence sinks only after a deployment failure', async () => {
  const ctx = {
    txs: [], raw: [], blocks: [], rpcOther: [],
    async setGasPrice() { throw new Error('controlled pre-deploy failure'); },
  };
  const deployAll = loadDeployAll(ctx);
  const run = { report: {} };

  await assert.rejects(() => deployAll(run), /controlled pre-deploy failure/);
  assert.deepEqual({ ...run.report.deployment }, {});
  assert.equal(run.report.setupTransactions, ctx.txs);
  assert.equal(run.report.setupRaw, ctx.raw);
  assert.equal(run.report.setupBlocks, ctx.blocks);
  assert.equal(run.report.setupRpcOther, ctx.rpcOther);
});
