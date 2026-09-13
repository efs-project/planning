import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { canonical, createControllerGate } from './controller-gate.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const h32 = (byte) => `0x${byte.padStart(2, '0').repeat(32)}`;
const addr = (byte) => `0x${byte.padStart(2, '0').repeat(20)}`;
const copy = (value) => JSON.parse(JSON.stringify(value));

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'efs-controller-gate-'));
  const files = {
    controller: join(dir, 'controller.mjs'),
    expectations: join(dir, 'expectations.json'),
    armInput: join(dir, 'arm.json'),
  };
  writeFileSync(files.controller, 'export default {}\n');
  writeFileSync(files.expectations, '{"labels":true}\n');
  writeFileSync(files.armInput, '{"private":"controller only"}\n');
  const specs = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, `${path}:${sha(readFileSync(path))}`]));
  const pins = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, { path, sha256: sha(readFileSync(path)) }]));
  const roles = {
    deployer: { address: addr('1'), derivationIndex: 0 },
    AUTHOR_A: { address: addr('2'), derivationIndex: 1 },
    actorB: { address: addr('3'), deploymentNonce: 9 },
    paidCaller: { address: addr('4'), derivationIndex: 3 },
  };
  const inputs = {
    types: { QUOTE: h32('01'), BINARY: h32('02'), ITEM: h32('03'), PAIR: h32('04'), QUOTE_J: h32('05'), LABEL: h32('06') },
    fixture: Object.fromEntries(['ITEM_ETH', 'ITEM_USDC', 'PAIR_ETH_USDC', 'QUOTE_A1', 'QUOTE_A2', 'QUOTE_B1'].map((key, index) => [key, { typeId: h32(`0${(index % 6) + 1}`), body: `0x${'ab'.repeat(index + 1)}`, id: h32(`1${index}`) }])),
    subject: { FILE_QUOTE: h32('21'), salt: h32('22'), creatorPrincipal: h32('23') },
    roles,
    lenses: { LENS_A_FIRST: [roles.AUTHOR_A.address, roles.actorB.address], LENS_B_FIRST: [roles.actorB.address, roles.AUTHOR_A.address] },
    expect: {
      A_FIRST: { subject: h32('21'), expectedHead: h32('31'), selectedAuthor: roles.AUTHOR_A.address, selectedProofKind: '2', pairId: h32('32'), itemA: h32('33'), itemB: h32('34'), mantissa: '2502000000', scale: '6', observedAt: '1800000000', noteCommitment: h32('35'), basisAdmission: '12' },
      B_FIRST: { subject: h32('21'), expectedHead: h32('36'), selectedAuthor: roles.actorB.address, selectedProofKind: '1', pairId: h32('32'), itemA: h32('33'), itemB: h32('34'), mantissa: '2501000000', scale: '6', observedAt: '1800000000', noteCommitment: h32('35'), basisAdmission: '12' },
    },
    placementExpect: { folder: h32('41'), nameRole: h32('42'), actor: roles.AUTHOR_A.address, proofKind: '2', publication: '2', budget: '16' },
    ordinals: { placementAdmission: '7', placementPublication: '2', placementRevision: '1', aHeadAdmission: '10', aHeadRevision: '2', bHeadAdmission: '12', bHeadRevision: '1', postB1Frontier: '12', registryEpoch: '8', indexGeneration: '0' },
  };
  const beforeContext = {
    schema: 'efs-lab-b/controller-context/1', runId: 'b-unit', stage: 'beforeFixture', sentAtUtc: '2026-09-13T12:00:00.000Z', pins,
    chain: { chainId: 31337, rpc: 'http://127.0.0.1:8545', source: 'RPC_OBSERVED:test', anvilArgv: [] },
    source: { commit: 'a'.repeat(40), dirtyDiffSha256: sha(''), sourceHashes: { 'script/measure.mjs': sha('measure'), 'script/controller-gate.mjs': sha('gate') } },
    build: { solc: '0.8.30+commit.73712a01', viaIR: true, optimizerRuns: 200, evm: 'cancun', artifacts: {} },
    roles, deployment: {}, typesObserved: inputs.types, registry: { epochAfterSetup: '8' },
    sealedInitialState: { blockNumber: '26', blockHash: h32('51'), snapshot: '0x1' },
    plannedCells: ['failure-rows', 'joined/paid-slice'], firstCell: 'failure-rows', mirror: inputs,
    ackPath: join(dir, 'controller', 'ack-beforeFixture.json'),
  };
  const checkpoint = {
    blockNumber: '30', blockHash: h32('52'), timestamp: '1757844020', snapshot: '0x2',
    frontier: { admissions: '12', records: '6', bindings: '4', publications: '4' },
    indexGeneration: '0', registryEpoch: '8', coreCodeCommitment: h32('53'), realmId: h32('54'),
  };
  const afterContext = {
    schema: 'efs-lab-b/controller-context/1', runId: 'b-unit', stage: 'afterB1', sentAtUtc: '2026-09-13T12:01:00.000Z', pins,
    inputsSha256: sha(canonical(inputs)), checkpoint,
    setupReceipts: Object.fromEntries(['step1', 'A1', 'A2', 'B1'].map((key, index) => [key, { txHash: h32(`6${index}`), block: String(27 + index), status: 1, gasUsed: String(100 + index), publication: String(index + 1), ...(key === 'B1' ? { actions: 2, folderBind: false } : {}) }])),
    ackPath: join(dir, 'controller', 'ack-afterB1.json'),
  };
  const pinHashes = Object.fromEntries(Object.entries(pins).map(([key, value]) => [key, value.sha256]));
  const ackFor = (context) => ({
    schema: 'efs-lab-b/controller-ack/1', runId: context.runId, stage: context.stage, decision: 'ACK', reason: null,
    issuedAtUtc: '2026-09-13T12:00:01.000Z', pins: copy(pinHashes), contextSha256: sha(canonical(context)), inputsSha256: sha(canonical(inputs)),
    ...(context.stage === 'beforeFixture' ? { inputs: copy(inputs) } : { sealedCheckpoint: copy(checkpoint) }),
  });
  return { dir, files, specs, pins, inputs, beforeContext, afterContext, ackFor, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

async function openGate(f, controller, options = {}) {
  return createControllerGate({
    args: { controller: f.specs.controller, expectations: f.specs.expectations, 'arm-input': f.specs.armInput, 'run-id': 'b-unit' },
    scratchRoot: f.dir, moduleLoader: async () => ({ default: controller }), ...options,
  });
}

test('no pins keeps the runner explicitly diagnostic', async () => {
  const f = fixture();
  try {
    const gate = await createControllerGate({ args: {}, scratchRoot: f.dir });
    assert.equal(gate.gating, 'diagnostic');
    assert.equal(gate.report, null);
  } finally { f.cleanup(); }
});

test('incomplete, malformed, unreadable and changed pins fail before module loading', async () => {
  const f = fixture();
  let loads = 0;
  const make = (args) => createControllerGate({ args, scratchRoot: f.dir, moduleLoader: async () => { loads++; return { default: {} }; } });
  try {
    await assert.rejects(() => make({ controller: f.specs.controller }), /CONTROLLER_PINS_INCOMPLETE/);
    await assert.rejects(() => make({ controller: 'bad', expectations: f.specs.expectations, 'arm-input': f.specs.armInput }), /CONTROLLER_PIN_MALFORMED:controller/);
    const missing = join(f.dir, 'missing.mjs');
    await assert.rejects(() => make({ controller: `${missing}:${'0'.repeat(64)}`, expectations: f.specs.expectations, 'arm-input': f.specs.armInput }), /CONTROLLER_PIN_UNREADABLE:controller/);
    writeFileSync(f.files.expectations, 'changed\n');
    await assert.rejects(() => make({ controller: f.specs.controller, expectations: f.specs.expectations, 'arm-input': f.specs.armInput }), /CONTROLLER_PIN_MISMATCH:expectations/);
    assert.equal(loads, 0);
  } finally { f.cleanup(); }
});

test('a pinned module must export both hook functions', async () => {
  const f = fixture();
  try {
    await assert.rejects(() => openGate(f, { beforeFixture: async () => ({}) }), /CONTROLLER_MALFORMED_MODULE/);
    await assert.rejects(() => openGate(f, { beforeFixture: true, afterB1: async () => ({}) }), /CONTROLLER_MALFORMED_MODULE/);
    await assert.rejects(() => openGate(f, { beforeFixture: () => Promise.resolve({}), afterB1: async () => ({}) }), /CONTROLLER_MALFORMED_MODULE/);
  } finally { f.cleanup(); }
});

test('beforeFixture rejects malformed schema, metadata and context hashes', async () => {
  const f = fixture();
  try {
    for (const [mutate, pattern] of [
      [(ack) => { ack.schema = 'wrong'; }, /CONTROLLER_ACK_MALFORMED:schema/],
      [(ack) => { ack.runId = 'other'; }, /CONTROLLER_ACK_MISMATCH:runId/],
      [(ack) => { ack.pins.controller = '0'.repeat(64); }, /CONTROLLER_ACK_MISMATCH:pins.controller/],
      [(ack) => { ack.contextSha256 = '0'.repeat(64); }, /CONTROLLER_ACK_MISMATCH:contextSha256/],
      [(ack) => { ack.extra = true; }, /CONTROLLER_ACK_MALFORMED:extra/],
    ]) {
      const gate = await openGate(f, { beforeFixture: async (context) => { const ack = f.ackFor(context); mutate(ack); return ack; }, afterB1: async () => ({}) });
      await assert.rejects(() => gate.invoke('beforeFixture', f.beforeContext), pattern);
    }
  } finally { f.cleanup(); }
});

test('an empty hook return is a malformed acknowledgement, not a controller exception', async () => {
  const f = fixture();
  try {
    const gate = await openGate(f, { beforeFixture: async () => undefined, afterB1: async () => ({}) });
    await assert.rejects(() => gate.invoke('beforeFixture', f.beforeContext), /CONTROLLER_ACK_MALFORMED/);
  } finally { f.cleanup(); }
});

test('beforeFixture rejects missing, extra, wrongly typed and mutated input fields with the exact path', async () => {
  const f = fixture();
  try {
    for (const [mutate, pattern] of [
      [(ack) => { delete ack.inputs.ordinals.placementRevision; }, /CONTROLLER_ACK_MALFORMED:inputs.ordinals.placementRevision/],
      [(ack) => { ack.inputs.ordinals.extra = '1'; }, /CONTROLLER_ACK_MALFORMED:inputs.ordinals.extra/],
      [(ack) => { ack.inputs.ordinals.placementRevision = 1; }, /CONTROLLER_ACK_MALFORMED:inputs.ordinals.placementRevision/],
      [(ack) => { ack.inputs.types.QUOTE = h32('77'); ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.types.QUOTE/],
      [(ack) => { ack.inputs.fixture.ITEM_ETH.id = h32('77'); ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.fixture.ITEM_ETH.id/],
      [(ack) => { ack.inputs.subject.salt = h32('77'); ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.subject.salt/],
      [(ack) => { ack.inputs.roles.actorB.address = addr('77'); ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.roles.actorB.address/],
      [(ack) => { ack.inputs.expect.A_FIRST.mantissa = '2502000001'; ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.expect.A_FIRST.mantissa/],
      [(ack) => { ack.inputs.lenses.LENS_A_FIRST.reverse(); ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.lenses.LENS_A_FIRST.0/],
      [(ack) => { ack.inputs.placementExpect.budget = '15'; ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.placementExpect.budget/],
      [(ack) => { ack.inputs.ordinals.bHeadAdmission = '11'; ack.inputsSha256 = sha(canonical(ack.inputs)); }, /CONTROLLER_INPUT_MISMATCH:inputs.ordinals.bHeadAdmission/],
      [(ack) => { ack.inputsSha256 = '0'.repeat(64); }, /CONTROLLER_ACK_MISMATCH:inputsSha256/],
    ]) {
      const gate = await openGate(f, { beforeFixture: async (context) => { const ack = f.ackFor(context); mutate(ack); return ack; }, afterB1: async () => ({}) });
      await assert.rejects(() => gate.invoke('beforeFixture', f.beforeContext), pattern);
    }
  } finally { f.cleanup(); }
});

test('REFUSE and rejected hooks stop the guarded continuation and retain failure status', async () => {
  const f = fixture();
  let sends = 0;
  try {
    let gate = await openGate(f, { beforeFixture: async (context) => ({ ...f.ackFor(context), decision: 'REFUSE', reason: 'operator refused' }), afterB1: async () => ({}) });
    await assert.rejects(() => gate.guard('beforeFixture', f.beforeContext, async () => { sends++; }), /CONTROLLER_REFUSED/);
    assert.equal(sends, 0);
    assert.equal(gate.report.stages.beforeFixture.failureCode, 'CONTROLLER_REFUSED');

    gate = await openGate(f, { beforeFixture: async () => { throw new Error('controller broke'); }, afterB1: async () => ({}) });
    await assert.rejects(() => gate.guard('beforeFixture', f.beforeContext, async () => { sends++; }), /CONTROLLER_ERROR:controller broke/);
    assert.equal(sends, 0);
    assert.equal(gate.report.stages.beforeFixture.failureCode, 'CONTROLLER_ERROR');
  } finally { f.cleanup(); }
});

test('timeout clears its timer, blocks continuation, and late hook completion cannot race a send', async () => {
  const f = fixture();
  let sends = 0;
  const cleared = [];
  try {
    const gate = await openGate(f, { beforeFixture: async () => new Promise((resolve) => setTimeout(() => resolve(f.ackFor(f.beforeContext)), 30)), afterB1: async () => ({}) }, {
      timeoutMs: 5,
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (id) => { cleared.push(id); clearTimeout(id); },
    });
    await assert.rejects(() => gate.guard('beforeFixture', f.beforeContext, async () => { sends++; }), /CONTROLLER_TIMEOUT/);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(sends, 0);
    assert.equal(cleared.length, 1);
  } finally { f.cleanup(); }
});

test('successful beforeFixture consumes a deep-copied ack and retains context, ack and comparison separately', async () => {
  const f = fixture();
  let received;
  let returned;
  try {
    const gate = await openGate(f, {
      beforeFixture: async (context) => { received = context; context.mirror.expect.A_FIRST.mantissa = '999'; returned = f.ackFor(f.beforeContext); return returned; },
      afterB1: async () => ({}),
    });
    const inputs = await gate.guard('beforeFixture', f.beforeContext, async (consumed) => consumed);
    returned.inputs.expect.A_FIRST.mantissa = '777';
    assert.equal(f.beforeContext.mirror.expect.A_FIRST.mantissa, '2502000000');
    assert.notEqual(received, f.beforeContext);
    assert.equal(inputs.expect.A_FIRST.mantissa, '2502000000');
    assert.notEqual(inputs, returned.inputs);
    assert.equal(gate.inputsSha256, sha(canonical(f.inputs)));
    for (const name of ['pins.json', 'context-beforeFixture.json', 'ack-beforeFixture.json', 'comparison-beforeFixture.json']) assert.equal(existsSync(join(f.dir, 'controller', name)), true, name);
    assert.equal(JSON.parse(readFileSync(join(f.dir, 'controller', 'ack-beforeFixture.json'))).inputs.expect.A_FIRST.mantissa, '2502000000');
    assert.equal(gate.report.stages.beforeFixture.comparisonOk, true);
  } finally { f.cleanup(); }
});

test('afterB1 validates stage binding and the complete sealed checkpoint before continuing', async () => {
  const f = fixture();
  let sends = 0;
  try {
    const controller = { beforeFixture: async (context) => f.ackFor(context), afterB1: async (context) => { const ack = f.ackFor(context); ack.sealedCheckpoint.frontier.records = '7'; return ack; } };
    const gate = await openGate(f, controller);
    await gate.invoke('beforeFixture', f.beforeContext);
    await assert.rejects(() => gate.guard('afterB1', f.afterContext, async () => { sends++; }), /CONTROLLER_ACK_MISMATCH:sealedCheckpoint.frontier.records/);
    assert.equal(sends, 0);
    assert.equal(existsSync(join(f.dir, 'controller', 'context-afterB1.json')), true);
    assert.equal(existsSync(join(f.dir, 'controller', 'ack-afterB1.json')), true);
    assert.equal(existsSync(join(f.dir, 'controller', 'comparison-afterB1.json')), true);
  } finally { f.cleanup(); }
});

test('afterB1 succeeds only after beforeFixture and preserves hook ordering', async () => {
  const f = fixture();
  const events = [];
  try {
    const controller = { beforeFixture: async (context) => { events.push('before-hook'); return f.ackFor(context); }, afterB1: async (context) => { events.push('after-hook'); return f.ackFor(context); } };
    let gate = await openGate(f, controller);
    await assert.rejects(() => gate.invoke('afterB1', f.afterContext), /CONTROLLER_STAGE_ORDER/);
    gate = await openGate(f, controller);
    await gate.guard('beforeFixture', f.beforeContext, async () => { events.push('first-cell'); });
    await gate.guard('afterB1', f.afterContext, async () => { events.push('placement-diagnostics'); events.push('paid-send'); });
    assert.deepEqual(events, ['before-hook', 'first-cell', 'after-hook', 'placement-diagnostics', 'paid-send']);
    assert.equal(gate.report.stages.afterB1.comparisonOk, true);
  } finally { f.cleanup(); }
});
