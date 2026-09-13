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

// ---------------------------------------------------------------- the sealed paid point/list slice: pure helpers
function loadPaidHelpers() {
  const declaration = runnerDeclaration('// ---- paid-slice pure helpers', '// ---- paid-slice cells');
  return vm.runInNewContext(`${declaration}\n({ evidenceCategoryOf, assertUnrelatedCaller, abstractRow, checkPaidRowOrdering, deriveAbstractResult, assertAnvilOnlyCells, buildPaidCalls, controllerFailureRow, ANVIL_ONLY_CELLS, ABSTRACT_FIELDS, SELECTION_FIELDS, PLACEMENT_FIELDS, PAID_CALLER_INDEX, PAID_CALLER_PATH })`, {});
}
const SEAL = { kind: 'seal', block: 40, hash: '0xseal', timestamp: 1000 };
const revertOk = { kind: 'revert', block: 40, hash: '0xseal', nextTimestamp: 1001 };
const txAt = (label, over = {}) => ({ kind: 'tx', label, block: 41, parentHash: '0xseal', timestamp: 1001, txIndex: 0, txCount: 1, onlyTx: true, ...over });
const retained = (label) => ({ kind: 'retained', label });
// fixtures of the pure abstract-row derivation
const SELECTION = { basisAdmission: '12', indexGeneration: '0', rulesEpoch: '6', coreCodeCommitment: '0xcore', lensId: '0xlens', subject: '0xsubj', selectedHead: '0xA2', selectedRevision: '2', selectedAdmission: '10', selectedPublication: '3', selectedAuthor: '0xA1', selectedProofKind: '2', pairId: '0xp1', itemA: '0xi1', itemB: '0xi2', mantissa: '2502000000', scale: '6', observedAt: '1800000000', note: '0xnote' };
const PLACEMENT = { position: '0xpos', actor: '0xA1', proofKind: '2', revision: '1', admission: '7', publication: '2', basisAdmission: '12', pageStatus: '2', rawTotal: '1', scanned: '1', hydrations: '1', selectedSoFar: '1', mutated: false, ended: true };
const goodCheck = () => ({ label: 'paid/list-a-first/paid-result', logCount: 1, fromLog: { commitment: '0xc', selection: { ...SELECTION }, placement: { ...PLACEMENT } }, fromReplay: { commitment: '0xc', selection: { ...SELECTION }, placement: { ...PLACEMENT } }, commitmentsAgree: true, replayOk: true, match: true });
const REPLAY = { rpcId: 77, from: '0xc3', stage: 'paid-replay:paid/list-a-first', blockTag: 41, returnData: '0xret', error: null };
function evidenceFixture(operation = 'PAID_LIST') {
  return {
    operation, lens: 'LENS_A_FIRST', lensArr: ['0xA1', '0xB2'], label: `paid/${operation}`,
    row: { txIndex: 4, hash: '0xtx', block: 41, blockHash: '0xb41', status: 1, gas: '123' },
    executed: { txIndex: 0, txCount: 1, txHashes: ['0xtx'], onlyTx: true, timestamp: 1001, parentHash: '0xseal', hash: '0xb41' },
    seal: { block: 40, hash: '0xseal', timestamp: 1000 },
    sealBasis: { admissionFrontier: 12, indexGeneration: '0', rulesEpoch: '6', coreCodeCommitment: '0xcore', realmId: '0xrealm' },
    chainId: 31337, addrs: { ledger: '0xl', lensReader: '0xr', indexModule: '0xi', registry: '0xg', consumer: '0xc' }, consumerCodehash: '0xcc',
    coordinates: { subject: '0xsubj', folder: '0xswaps', nameRole: '0xname', position: '0xpos' },
    placementAtSeal: { author: '0xA1', proofKind: '2', publication: '2', admission: '7', revision: '1' },
    types: { QUOTE_J: '0xq', PAIR: '0xp', ITEM: '0xi' },
    headLabels: { '0xa2': ['QUOTE_A2', 'A2'] }, authorLabels: { '0xa1': ['AUTHOR_A', 'EOA (wallet 1)'] },
    caller: { address: '0xc3', derivationPath: "m/44'/60'/0'/0/3" },
  };
}
const DERIVED = ['presence', 'support', 'admission', 'selection'];
function assertAllUnknown(row, reasonPattern) {
  for (const k of DERIVED) assert.equal(row[k].outcome, 'UNKNOWN', `${k} UNKNOWN`);
  for (const k of ['selectedFile', 'selectedHead', 'selectedRevision', 'selectedAuthorEvidenceCategory']) assert.equal(row[k], 'UNKNOWN', `${k} UNKNOWN`);
  for (const k of ['selectedPhysical', 'selectedAuthor', 'quoteCheck', 'pairCheck']) assert.equal(row[k].outcome, 'UNKNOWN', `${k} UNKNOWN`);
  assert.equal(row.itemChecks[0].outcome, 'UNKNOWN');
  assert.equal(row.candidateCoverage.status, 'UNKNOWN');
  assert.equal(row.rawEvidence.selfCheck.match, false);
  assert.match(row.rawEvidence.selfCheck.reason, reasonPattern);
  // separately retained observations survive, each naming its source
  assert.equal(row.executionBasis.block, 41);
  assert.equal(row.executionBasis.timestamp, 1001);
  assert.equal(row.rawEvidence.replay.returnData, '0xret');
  assert.match(row.placementProvenance.establishedBy, /seal raw replies|raw replies at the seal/); // list wording / point wording; both name the separate seal observation
  assert.equal(row.placementProvenance.actorAddress, '0xA1');
}
function validAbstract(overrides = {}) {
  return {
    operation: 'PAID_LIST', lens: 'LENS_B_FIRST',
    realm: { chainId: 31337 }, execution: { consumer: '0xc' }, profile: 'road-b-lab/2',
    observationBasis: { admissionFrontier: '12' }, executionBasis: { block: 41 },
    queryCoordinate: { labels: { parent: '/swaps', name: 'eth-usdc' } },
    presence: { outcome: 'FOUND' }, support: { outcome: 'SUPPORTED' }, admission: { outcome: 'ADMITTED' }, selection: { outcome: 'SELECTED' },
    selectedFile: 'FILE_QUOTE', selectedHead: 'QUOTE_B1', selectedRevision: 'B1',
    selectedPhysical: { head: '0xb1', revisionOrdinal: '1' },
    selectedAuthor: { label: 'AUTHOR_B' }, selectedAuthorEvidenceCategory: 'CONTRACT_ORIGINATED_PUBLICATION',
    placementCoordinate: { lookedUpByThisRow: true }, placementProvenance: { sourceStep: 'A1', actor: 'AUTHOR_A', evidenceCategory: 'EOA_SIGNED_PUBLICATION_EFFECT' },
    quoteCheck: { mantissa: '2501000000' }, pairCheck: { pairId: '0xp' }, itemChecks: [{ id: '0xa' }, { id: '0xb' }],
    candidateCoverage: { status: 'COMPLETE', basis: '12' }, pageCoverage: { status: 'COMPLETE' },
    rawEvidence: { transaction: { hash: '0xt' }, selfCheck: { match: true } }, paidExecution: { gasUsed: '1' },
    ...overrides,
  };
}

test('abstractRow builds the arm-neutral comparison row with the RPC_OBSERVED grade and every required field', () => {
  const { abstractRow, ABSTRACT_FIELDS } = loadPaidHelpers();
  const row = abstractRow(validAbstract());
  assert.equal(row.inputEvidenceGrade, 'RPC_OBSERVED');
  assert.match(row.standing, /never expected answers/);
  for (const k of ABSTRACT_FIELDS) assert.notEqual(row[k], undefined, `${k} present`);
  assert.equal(ABSTRACT_FIELDS.length, 27);
  assert.equal(row.selectedRevision, 'B1');
  assert.equal(row.selectedPhysical.revisionOrdinal, '1');
});

test('abstractRow catches a missing, unknown, ordinal-labelled or point-charged-lookup row instead of defaulting it', () => {
  const { abstractRow } = loadPaidHelpers();
  const { pageCoverage, ...withoutCoverage } = validAbstract();
  assert.throws(() => abstractRow(withoutCoverage), /missing field\(s\) pageCoverage/);
  assert.throws(() => abstractRow(validAbstract({ placementProvenance: null })), /missing field\(s\) placementProvenance/);
  assert.throws(() => abstractRow(validAbstract({ extraneous: 1 })), /unknown field\(s\) extraneous/);
  assert.throws(() => abstractRow(validAbstract({ selectedRevision: '1' })), /fixture label/);
  assert.throws(() => abstractRow(validAbstract({ selectedRevision: 2 })), /fixture label/);
  assert.throws(() => abstractRow(validAbstract({ operation: 'PAID_POINT', placementCoordinate: { lookedUpByThisRow: true } })), /must not charge a directory lookup/);
  assert.throws(() => abstractRow(validAbstract({ pageCoverage: { status: 'PARTIAL' } })), /pageCoverage PARTIAL is not a pass/);
  assert.throws(() => abstractRow(validAbstract({ lens: 'LENS_NO_TIEBREAK' })), /lens LENS_NO_TIEBREAK/);
  assert.doesNotThrow(() => abstractRow(validAbstract({ operation: 'PAID_POINT', placementCoordinate: { lookedUpByThisRow: false }, pageCoverage: { status: 'NOT_APPLICABLE' } })));
});

test('checkPaidRowOrdering accepts seal -> (revert -> first tx -> retained) x 4 and returns the rows in order', () => {
  const { checkPaidRowOrdering } = loadPaidHelpers();
  const events = [SEAL];
  for (const label of ['point-a-first', 'list-a-first', 'point-b-first', 'list-b-first']) events.push(revertOk, txAt(label), retained(label));
  const rows = checkPaidRowOrdering(events);
  // Array.from materializes the vm-realm array in this realm (strict deepEqual compares prototypes)
  assert.deepEqual(Array.from(rows, (r) => [r.label, r.block, r.retained]), [['point-a-first', 41, true], ['list-a-first', 41, true], ['point-b-first', 41, true], ['list-b-first', 41, true]]);
});

test('checkPaidRowOrdering catches a second transaction on the same revert, a revert before retention, a wrong head, a wrong parent and an unretained row', () => {
  const { checkPaidRowOrdering } = loadPaidHelpers();
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a'), retained('a'), txAt('b'), retained('b')]), /row b is not the first transaction after a revert/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a'), revertOk, retained('a')]), /revert before row a was retained/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { kind: 'revert', block: 41, hash: '0xother' }, txAt('a'), retained('a')]), /not the seal/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, { kind: 'tx', label: 'a', block: 42, parentHash: '0xseal' }, retained('a')]), /mined at 42/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, { kind: 'tx', label: 'a', block: 41, parentHash: '0xstale' }, retained('a')]), /on 0xstale/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a')]), /row a was never retained/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, retained('a')]), /retained a without that row open/);
  assert.throws(() => checkPaidRowOrdering([revertOk, txAt('a'), retained('a')]), /first event must be the seal/);
  assert.throws(() => checkPaidRowOrdering([SEAL]), /no paid row/);
});

test('checkPaidRowOrdering catches a wrong timestamp, a wrong next-block timestamp, a non-zero transaction index and an extra transaction in the block', () => {
  const { checkPaidRowOrdering } = loadPaidHelpers();
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a', { timestamp: 1002 }), retained('a')]), /executed at timestamp 1002, expected 1001/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { ...revertOk, nextTimestamp: 1005 }, txAt('a'), retained('a')]), /next block timestamp set to 1005/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a', { txIndex: 1 }), retained('a')]), /transactionIndex 1, not 0/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a', { txCount: 2 }), retained('a')]), /not the only transaction in its block \(2 transactions\)/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt('a', { onlyTx: false }), retained('a')]), /not the only transaction/);
  assert.throws(() => checkPaidRowOrdering([{ kind: 'seal', block: 40, hash: '0xseal' }, revertOk, txAt('a'), retained('a')]), /carries no timestamp/);
  const rows = checkPaidRowOrdering([SEAL, revertOk, txAt('a'), retained('a'), revertOk, txAt('b'), retained('b')]);
  assert.deepEqual(Array.from(rows, (r) => [r.timestamp, r.txIndex, r.txCount]), [[1001, 0, 1], [1001, 0, 1]]);
});

test('deriveAbstractResult keeps the labels and outcomes only for a fully passing self-check', () => {
  const { deriveAbstractResult } = loadPaidHelpers();
  const row = deriveAbstractResult({ check: goodCheck(), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.equal(row.inputEvidenceGrade, 'RPC_OBSERVED');
  assert.deepEqual([row.selectedFile, row.selectedHead, row.selectedRevision], ['FILE_QUOTE', 'QUOTE_A2', 'A2']);
  assert.equal(row.selectedAuthor.label, 'AUTHOR_A');
  assert.equal(row.selectedAuthorEvidenceCategory, 'EOA_SIGNED_PUBLICATION');
  for (const k of DERIVED) assert.notEqual(row[k].outcome, 'UNKNOWN', k);
  assert.equal(row.candidateCoverage.status, 'COMPLETE');
  assert.equal(row.pageCoverage.status, 'COMPLETE');
  assert.equal(row.placementProvenance.evidenceCategory, 'EOA_SIGNED_PUBLICATION_EFFECT');
  assert.match(row.placementProvenance.establishedBy, /passing self-check/);
  assert.equal(row.quoteCheck.observedAt, '1800000000');
  assert.equal(row.executionBasis.timestamp, 1001);
  assert.equal(row.executionBasis.txIndex, 0);
  assert.equal(row.rawEvidence.selfCheck.match, true);
  assert.equal(row.paidExecution.returnData.decoded.commitment, '0xc');
});

test('deriveAbstractResult catches a replay that differs from the log: every derived field UNKNOWN, raw log and replay retained', () => {
  const { deriveAbstractResult } = loadPaidHelpers();
  const check = goodCheck();
  check.fromReplay = { commitment: '0xd', selection: { ...SELECTION, mantissa: '1' }, placement: { ...PLACEMENT } };
  check.commitmentsAgree = false;
  check.replayOk = false;
  check.match = false;
  const row = deriveAbstractResult({ check, replay: REPLAY, evidenceFor: evidenceFixture() });
  assertAllUnknown(row, /replay commitment differs from the log/);
  assert.equal(row.pageCoverage.status, 'UNKNOWN');
  assert.equal(row.rawEvidence.paidResultLog.commitment, '0xc');
  assert.equal(row.rawEvidence.paidResultLog.selection.mantissa, '2502000000');
  assert.equal(row.paidExecution.returnData.decoded.outcome, 'UNKNOWN');
  assert.match(row.placementProvenance.establishedBy, /SEPARATE seal raw replies/);
  // a POINT row with the same failure keeps its structural NOT_APPLICABLE page coverage and the seal-derived provenance
  const point = deriveAbstractResult({ check, replay: REPLAY, evidenceFor: evidenceFixture('PAID_POINT') });
  assertAllUnknown(point, /replay commitment differs/);
  assert.equal(point.pageCoverage.status, 'NOT_APPLICABLE');
  assert.equal(point.placementCoordinate.lookedUpByThisRow, false);
});

test('deriveAbstractResult catches a missing PaidResult log: UNKNOWN throughout, no log to cite, replay retained', () => {
  const { deriveAbstractResult } = loadPaidHelpers();
  const check = { ...goodCheck(), logCount: 0, fromLog: null, commitmentsAgree: false, match: false };
  const row = deriveAbstractResult({ check, replay: REPLAY, evidenceFor: evidenceFixture() });
  assertAllUnknown(row, /no single PaidResult log/);
  assert.equal(row.rawEvidence.paidResultLog, null);
  assert.equal(row.rawEvidence.selfCheck.logCount, 0);
  assert.equal(row.rawEvidence.replay.rpcId, 77);
});

test('assertAnvilOnlyCells refuses the sealing cells without --anvil before any chain call and leaves the other cells alone', () => {
  const { assertAnvilOnlyCells, ANVIL_ONLY_CELLS } = loadPaidHelpers();
  assert.deepEqual([...ANVIL_ONLY_CELLS], ['joined/paid-slice', 'joined/a1-without-placement']);
  assert.deepEqual([...assertAnvilOnlyCells(['failure-rows', 'joined/steps-1-6'], false)], []);
  assert.deepEqual([...assertAnvilOnlyCells(['joined/paid-slice'], true)], ['joined/paid-slice']);
  assert.throws(() => assertAnvilOnlyCells(['joined/paid-slice', 'failure-rows'], false), /owned --anvil chain/);
  assert.throws(() => assertAnvilOnlyCells(['joined/a1-without-placement'], false), /joined\/a1-without-placement/);
});

test('assertUnrelatedCaller catches a caller that is the deployer, an author or a lab contract (case-insensitive) and pins wallet index 3', () => {
  const { assertUnrelatedCaller, PAID_CALLER_INDEX, PAID_CALLER_PATH } = loadPaidHelpers();
  const related = { deployer: '0x00000000000000000000000000000000000000d0', AUTHOR_A: '0x00000000000000000000000000000000000000a1', 'contract actorB': '0x00000000000000000000000000000000000000B2' };
  assert.equal(assertUnrelatedCaller('0x00000000000000000000000000000000000000c3', related), true);
  assert.throws(() => assertUnrelatedCaller('0x00000000000000000000000000000000000000d0', related), /it is the deployer/);
  assert.throws(() => assertUnrelatedCaller('0x00000000000000000000000000000000000000A1', related), /it is the AUTHOR_A/);
  assert.throws(() => assertUnrelatedCaller('0x00000000000000000000000000000000000000b2', related), /it is the contract actorB/);
  assert.throws(() => assertUnrelatedCaller(null, related), /not an address/);
  assert.equal(PAID_CALLER_INDEX, 3);
  assert.equal(PAID_CALLER_PATH, "m/44'/60'/0'/0/3");
});

test('buildPaidCalls consumes controller-supplied lenses, Expect and PlacementExpect values verbatim', () => {
  const { buildPaidCalls } = loadPaidHelpers();
  const inputs = {
    lenses: { LENS_A_FIRST: ['0xa', '0xb'], LENS_B_FIRST: ['0xb', '0xa'] },
    expect: { A_FIRST: { expectedHead: '0xa2' }, B_FIRST: { expectedHead: '0xb1' } },
    placementExpect: { folder: '0xf', publication: '2' },
  };
  const calls = buildPaidCalls(inputs);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.map(({ key, lensArr, fn, fnArgs }) => ({ key, lensArr, fn, fnArgs })))), [
    { key: 'point-a-first', lensArr: ['0xa', '0xb'], fn: 'paidPoint', fnArgs: [['0xa', '0xb'], { expectedHead: '0xa2' }] },
    { key: 'list-a-first', lensArr: ['0xa', '0xb'], fn: 'paidList', fnArgs: [['0xa', '0xb'], { expectedHead: '0xa2' }, { folder: '0xf', publication: '2' }] },
    { key: 'point-b-first', lensArr: ['0xb', '0xa'], fn: 'paidPoint', fnArgs: [['0xb', '0xa'], { expectedHead: '0xb1' }] },
    { key: 'list-b-first', lensArr: ['0xb', '0xa'], fn: 'paidList', fnArgs: [['0xb', '0xa'], { expectedHead: '0xb1' }, { folder: '0xf', publication: '2' }] },
  ]);
  assert.notEqual(calls[0].fnArgs[1], inputs.expect.A_FIRST, 'calldata input is an isolated copy');
});

test('controllerFailureRow maps timeout separately and records every other gate refusal without inventing a send', () => {
  const { controllerFailureRow } = loadPaidHelpers();
  assert.deepEqual(JSON.parse(JSON.stringify(controllerFailureRow('joined/paid-slice', { code: 'CONTROLLER_TIMEOUT', message: 'CONTROLLER_TIMEOUT' }))), {
    label: 'joined/paid-slice', status: 'CONTROLLER_TIMEOUT', failureCode: 'CONTROLLER_TIMEOUT', error: 'CONTROLLER_TIMEOUT', transactions: [],
  });
  assert.equal(controllerFailureRow('failure-rows', { code: 'CONTROLLER_ACK_MISMATCH', message: 'CONTROLLER_ACK_MISMATCH:stage' }).status, 'CONTROLLER_REFUSED');
});

test('evidenceCategoryOf maps the two proof kinds and refuses an unknown kind instead of defaulting', () => {
  const { evidenceCategoryOf } = loadPaidHelpers();
  assert.equal(evidenceCategoryOf(1), 'CONTRACT_ORIGINATED_PUBLICATION');
  assert.equal(evidenceCategoryOf('2'), 'EOA_SIGNED_PUBLICATION');
  assert.equal(evidenceCategoryOf(2, true), 'EOA_SIGNED_PUBLICATION_EFFECT');
  assert.throws(() => evidenceCategoryOf(0), /unknown proof kind 0/);
  assert.throws(() => evidenceCategoryOf(3), /unknown proof kind 3/);
});

test('selectCells keeps an optional cell out of the default and substring selections and admits it only by exact name', () => {
  const selectCells = loadSelectCells();
  const plan = ['failure-rows', 'joined/steps-1-6', 'joined/paid-slice', 'joined/a1-without-placement', 'policy/activate'];
  const optional = ['joined/a1-without-placement'];
  assert.deepEqual([...selectCells(plan, {}, optional)], ['failure-rows', 'joined/steps-1-6', 'joined/paid-slice', 'policy/activate']);
  assert.deepEqual([...selectCells(plan, { only: 'joined' }, optional)], ['joined/steps-1-6', 'joined/paid-slice']);
  assert.deepEqual([...selectCells(plan, { cells: 'joined/a1-without-placement,joined/paid-slice' }, optional)], ['joined/paid-slice', 'joined/a1-without-placement']);
  assert.throws(() => selectCells(plan, {}, ['not-in-plan']), /optional cell\(s\) not in the plan/);
  assert.throws(() => selectCells(plan, { only: 'a1-without' }, optional), /selected zero cells/);
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
