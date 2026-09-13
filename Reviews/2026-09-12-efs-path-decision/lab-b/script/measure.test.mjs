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

const SENDER = { address: '0x00000000000000000000000000000000000000a1' };
const ADMIN_ERROR = '0x11111111';
const EXISTS_ERROR = '0x22222222';

// `observeRaw` / `send` / `iface` are injectable so the caller (`from`) and revert-argument plumbing can be observed
function loadFailureRow({ expectedSelector, observedSelector, before = { value: 1 }, after = before, observeRaw = null, send = null, iface = null, captured = {} }) {
  const stripBlock = runnerDeclaration('const stripBlock =', '// ---------------------------------------------------------------- sealed cells');
  const failureRow = runnerDeclaration('async function failureRow(', 'const baseCount =');
  const probes = [before, after];
  let probeCalls = 0; // pre/post alternate per failureRow call; a second call on the same loader must not exhaust the pair
  return vm.runInNewContext(`${stripBlock}\n${failureRow}\nfailureRow`, {
    FAIL_GAS: 1n,
    assert,
    errorSelector: () => expectedSelector,
    iface: iface ?? (() => { throw new Error('iface must not be needed without expected arguments'); }),
    log() {},
    observeRaw: observeRaw ?? (async (_ctx, _sink, _stage, _meta, _to, _data, _block, opts) => { captured.from = opts?.from ?? null; return { error: { data: observedSelector } }; }),
    send: send ?? (async (_ctx, _build, _label, opts) => { captured.sendWallet = opts?.wallet ?? null; return { block: 12, status: 0 }; }),
    stateProbe: async () => probes[probeCalls++ % probes.length],
    Array, // the extracted function builds arrays through the outer realm so deep-equality against test literals holds
  });
}
const failureCtx = () => ({ latestBlock: async () => 11, raw: [], deployer: SENDER });

function loadSelectCells() {
  const declaration = runnerDeclaration('function selectCells(', '// ---------------------------------------------------------------- deployment');
  return vm.runInNewContext(`${declaration}\nselectCells`, {});
}

function loadJoinBasis() {
  const declaration = runnerDeclaration('function joinBasis(', 'const QUOTE_HIGH =');
  return vm.runInNewContext(`${declaration}\njoinBasis`, {});
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
  await assert.rejects(() => failureRow(failureCtx(), 'missing-selector', {}, 'MissingError', []), /expected selector unavailable/);
});

test('failureRow catches accepting a wrong revert selector', async () => {
  const failureRow = loadFailureRow({ expectedSelector: '0x12345678', observedSelector: '0x87654321' });
  await assert.rejects(() => failureRow(failureCtx(), 'wrong-selector', {}, 'WrongError', []), /revert selector mismatch/);
});

test('failureRow catches accepting changed state after the reverted transaction', async () => {
  const failureRow = loadFailureRow({ expectedSelector: '0x12345678', observedSelector: '0x12345678', before: { value: 1 }, after: { value: 2 } });
  await assert.rejects(() => failureRow(failureCtx(), 'changed-state', {}, 'StateError', []), /state changed across expected revert/);
});

test('failureRow simulates the static probe FROM the actual sender and sends from that same wallet', async () => {
  const captured = {};
  const failureRow = loadFailureRow({ expectedSelector: '0x12345678', observedSelector: '0x12345678', captured });
  const row = await failureRow(failureCtx(), 'sender-plumbing', {}, 'SomeError', []);
  assert.equal(captured.from, SENDER.address);
  assert.equal(captured.sendWallet, SENDER);
  assert.equal(row.from, SENDER.address);
  const other = { address: '0x00000000000000000000000000000000000000b2' };
  await failureRow(failureCtx(), 'explicit-wallet', {}, 'SomeError', [], { wallet: other });
  assert.equal(captured.from, other.address);
  assert.equal(captured.sendWallet, other);
});

test('failureRow catches a caller-insensitive probe: E_ADMIN would be observed instead of E_TYPE_EXISTS without from', async () => {
  // a registry whose admin-only call reverts E_ADMIN unless simulated from the admin
  const callerSensitive = async (_ctx, _sink, _stage, _meta, _to, _data, _block, opts) => ({ error: { data: opts?.from === SENDER.address ? EXISTS_ERROR : ADMIN_ERROR } });
  const withFrom = loadFailureRow({ expectedSelector: EXISTS_ERROR, observedSelector: null, observeRaw: callerSensitive });
  const row = await withFrom(failureCtx(), 'refused-re-registration', {}, ['TypeRegistry', 'E_TYPE_EXISTS'], []);
  assert.equal(row.observedSelector, EXISTS_ERROR);
  // the pre-review probe (no from) reaches the admin check first and the selector assertion must fail loudly
  const withoutFrom = loadFailureRow({ expectedSelector: EXISTS_ERROR, observedSelector: null, observeRaw: async () => ({ error: { data: ADMIN_ERROR } }) });
  await assert.rejects(() => withoutFrom(failureCtx(), 'refused-re-registration-no-from', {}, ['TypeRegistry', 'E_TYPE_EXISTS'], []), /revert selector mismatch/);
});

test('failureRow asserts the decoded revert ARGUMENTS when expected arguments are given', async () => {
  const selector = '0x33333333';
  const data = `${selector}00`;
  const parsed = { name: 'E_INTENT', args: [3n] };
  const iface = () => ({ parseError: (d) => (d === data ? parsed : null) });
  const ok = loadFailureRow({ expectedSelector: selector, observedSelector: data, iface });
  const row = await ok(failureCtx(), 'stale-signature', {}, 'E_INTENT', [], { args: [3] });
  assert.deepEqual([...row.decodedArgs], ['3']);
  assert.deepEqual([...row.expectedArgs], ['3']);
  assert.equal(row.argsMatch, true);
  const wrong = loadFailureRow({ expectedSelector: selector, observedSelector: data, iface });
  await assert.rejects(() => wrong(failureCtx(), 'stale-signature-wrong-field', {}, 'E_INTENT', [], { args: [2] }), /revert arguments mismatch/);
  const wrongName = loadFailureRow({ expectedSelector: selector, observedSelector: data, iface: () => ({ parseError: () => ({ name: 'E_OTHER', args: [3n] }) }) });
  await assert.rejects(() => wrongName(failureCtx(), 'stale-signature-wrong-error', {}, 'E_INTENT', [], { args: [3] }), /does not decode as/);
  // typeId arguments compare case-insensitively as hex strings
  const typed = loadFailureRow({ expectedSelector: selector, observedSelector: data, iface: () => ({ parseError: () => ({ name: 'E_TYPE_EXISTS', args: ['0xABCDEF'] }) }) });
  const typedRow = await typed(failureCtx(), 'refused', {}, ['TypeRegistry', 'E_TYPE_EXISTS'], [], { args: ['0xabcdef'] });
  assert.deepEqual([...typedRow.decodedArgs], ['0xabcdef']);
});

test('selectCells rejects unknown keys and empty selections before any chain starts, and keeps plan order', () => {
  const selectCells = loadSelectCells();
  const plan = ['native-one/quote', 'failure-rows', 'policy/activate', 'failure/refused-re-registration'];
  assert.deepEqual([...selectCells(plan, {})], plan);
  assert.deepEqual([...selectCells(plan, { cells: 'failure/refused-re-registration, policy/activate' })], ['policy/activate', 'failure/refused-re-registration']);
  assert.deepEqual([...selectCells(plan, { only: 'failure' })], ['failure-rows', 'failure/refused-re-registration']);
  assert.throws(() => selectCells(plan, { cells: 'policy/activate,does-not-exist' }), /unknown cell\(s\) does-not-exist/);
  assert.throws(() => selectCells(plan, { cells: '' }), /selected zero cells/);
  assert.throws(() => selectCells(plan, { only: 'nothing-matches' }), /selected zero cells/);
});

test('joinBasis flags a basis whose policy row, codehash or epoch disagree with the registry row', () => {
  const joinBasis = loadJoinBasis();
  const basis = { typeId: '0xT', activation: '3', policyAcceptor: '0xAA', policyCodehash: '0xCC', epoch: '9' };
  assert.equal(joinBasis(basis, { acceptor: '0xaa', codehash: '0xcc', epoch: '9' }).ok, true);
  assert.equal(joinBasis(basis, { acceptor: '0xaa', codehash: '0xdd', epoch: '9' }).codehashEqual, false);
  assert.equal(joinBasis(basis, { acceptor: '0xaa', codehash: '0xcc', epoch: '8' }).ok, false);
  assert.equal(joinBasis(basis, { acceptor: '0xbb', codehash: '0xcc', epoch: '9' }).acceptorEqual, false);
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
