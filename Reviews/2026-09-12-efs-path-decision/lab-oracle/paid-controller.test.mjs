import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createController, rpcRead } from './paid-controller.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const hex32 = n => `0x${n.toString(16).padStart(64, '0')}`;
const address = '0x0000000000000000000000000000000000000001';
const neutral = Buffer.from('{"scope":"synthetic controller transport test"}\n');
const required = ['counts', 'registryEpoch', 'indexGeneration', 'coreCodeCommitment', 'realmId', 'aPlacement', 'bPlacementAbsent', 'aHead', 'bHead', 'scopeA', 'scopeB'];

// A synthetic external RPC seam keeps the actual pin/read/comparison/retention
// logic real without launching a chain; these tests do not certify a B/C arm.
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'efs-controller-test-'));
  const inputs = { expect: { A_FIRST: { mantissa: '2502000000' } }, roles: {}, types: {} };
  const arm = {
    schema: 'efs-paid-arm/1', runId: 'synthetic-run', chainId: 31337,
    expectationsSha256: sha(neutral), retentionDir: join(dir, 'independent'),
    source: { commit: '1'.repeat(40), dirtyDiffSha256: sha(''), sourceHashes: { 'src/Ledger.sol': sha('source') } },
    build: { solc: '0.8.30', viaIR: true },
    inputs, targets: { ledger: { address, runtime: '0x60016000' } },
    plannedCells: ['failure-rows', 'joined/paid-slice', 'joined/a1-without-placement'], firstCell: 'failure-rows',
    initial: { registryEpoch: '8' },
    checkpoint: { frontier: { admissions: '12', records: '6', bindings: '4', publications: '4' }, indexGeneration: '0', registryEpoch: '8', coreCodeCommitment: hex32(3), realmId: hex32(4) },
    checks: {
      beforeFixture: [{ label: 'counts', to: address, data: '0x12345678', expected: hex32(0) }],
      afterB1: required.map((label, i) => ({ label, to: address, data: `0x${(0x12345680 + i).toString(16)}`, expected: hex32(i + 1) })),
    },
  };
  const armPath = join(dir, 'arm.json');
  const expectationsPath = join(dir, 'expectations.json');
  writeFileSync(armPath, JSON.stringify(arm));
  writeFileSync(expectationsPath, neutral);
  const modulePath = fileURLToPath(new URL('./paid-controller.mjs', import.meta.url));
  const pins = {
    controller: { path: modulePath, sha256: sha(readFileSync(modulePath)) },
    expectations: { path: expectationsPath, sha256: sha(neutral) },
    armInput: { path: armPath, sha256: sha(readFileSync(armPath)) },
  };
  const block = { number: '0x20', hash: hex32(32), timestamp: '0x100', transactions: [] };
  const context = {
    schema: 'efs-lab-b/controller-context/1', runId: arm.runId, stage: 'beforeFixture',
    sentAtUtc: '2026-09-13T12:00:00Z', pins, chain: { chainId: 31337, rpc: 'http://127.0.0.1:12345' },
    source: clone(arm.source), build: clone(arm.build), mirror: clone(inputs), roles: {}, typesObserved: {},
    registry: { epochAfterSetup: '8' }, sealedInitialState: { blockNumber: '32', blockHash: block.hash, snapshot: '0x1' },
    plannedCells: ['failure-rows', 'joined/paid-slice', 'joined/a1-without-placement'], firstCell: 'failure-rows',
  };
  const calls = [];
  const mutate = { response: x => x };
  const request = async (url, method, params) => {
    calls.push({ url, method, params });
    let result;
    if (method === 'eth_chainId') result = '0x7a69';
    else if (method === 'web3_clientVersion') result = 'anvil/v1.7.1';
    else if (method === 'eth_getBlockByNumber') result = clone(block);
    else if (method === 'eth_getCode') result = arm.targets.ledger.runtime;
    else if (method === 'eth_call') {
      const row = [...arm.checks.beforeFixture, ...arm.checks.afterB1].find(x => x.data === params[0].data);
      assert.ok(row, 'controller emitted undeclared calldata');
      result = row.expected;
    } else assert.fail(`write or unknown RPC method ${method}`);
    return mutate.response(result, method, params);
  };
  const controller = createController({ request, expectedNeutralHash: sha(neutral) });
  const after = ack => ({
    schema: context.schema, runId: arm.runId, stage: 'afterB1', sentAtUtc: context.sentAtUtc, pins,
    inputsSha256: ack.inputsSha256,
    checkpoint: { blockNumber: '32', blockHash: block.hash, timestamp: '256', snapshot: '0x2', ...clone(arm.checkpoint) },
  });
  return { dir, arm, context, controller, after, calls, mutate, armPath, pins };
}

test('ACK follows independent fixed-block reads and retains evidence outside candidate packet', async () => {
  const f = fixture();
  const first = await f.controller.beforeFixture(f.context);
  assert.equal(first?.decision, 'ACK');
  assert.equal(first.inputs.expect.A_FIRST.mantissa, '2502000000');
  const second = await f.controller.afterB1(f.after(first));
  assert.equal(second.decision, 'ACK');
  assert.equal(second.inputsSha256, first.inputsSha256);
  assert.equal(second.sealedCheckpoint.frontier.admissions, '12');
  assert.equal(readdirSync(join(f.dir, 'independent')).length, 2);
  const evidence = JSON.parse(readFileSync(join(f.dir, 'independent', 'synthetic-run-afterB1.json')));
  assert.equal(evidence.grade, 'RPC_OBSERVED');
  assert.equal(evidence.observations.filter(x => x.method === 'eth_call').length, required.length);
  assert.ok(f.calls.filter(x => ['eth_call', 'eth_getCode'].includes(x.method)).every(x => x.params.at(-1) === '0x20'));
});

test('changed arm bytes refuse before any RPC even with otherwise matching candidate mirror', async () => {
  const f = fixture();
  writeFileSync(f.armPath, JSON.stringify({ ...f.arm, inputs: {} }));
  await assert.rejects(f.controller.beforeFixture(f.context), /PIN_MISMATCH/);
  assert.equal(f.calls.length, 0);
});

test('candidate source or fixture substitution cannot be acknowledged', async () => {
  for (const change of [c => { c.source.commit = '2'.repeat(40); }, c => { c.mirror.expect.A_FIRST.mantissa = '1'; }]) {
    const f = fixture(); change(f.context);
    await assert.rejects(f.controller.beforeFixture(f.context), /MISMATCH/);
  }
});

test('runtime mismatch from independent RPC refuses even when candidate build metadata matches', async () => {
  const f = fixture();
  f.mutate.response = (x, method) => method === 'eth_getCode' ? '0x60026000' : x;
  await assert.rejects(f.controller.beforeFixture(f.context), /RUNTIME_MISMATCH/);
  const retained = JSON.parse(readFileSync(join(f.dir, 'independent', 'synthetic-run-beforeFixture.json')));
  assert.equal(retained.decision, 'REFUSE');
  assert.match(retained.error, /RUNTIME_MISMATCH/);
  assert.equal(retained.observations.find(x => x.method === 'eth_getCode').result, '0x60026000');
  assert.equal(retained.ack, undefined);
});

test('afterB1 requires prior ACK and same bound input digest', async () => {
  const f = fixture();
  await assert.rejects(f.controller.afterB1(f.after({ inputsSha256: '0'.repeat(64) })), /STAGE_ORDER/);
  const first = await f.controller.beforeFixture(f.context);
  const context = f.after(first); context.inputsSha256 = '0'.repeat(64);
  await assert.rejects(f.controller.afterB1(context), /INPUTS_MISMATCH/);
});

test('changed actual state or claimed frontier prevents post-B1 ACK', async () => {
  for (const mode of ['reply', 'frontier', 'block']) {
    const f = fixture(); const first = await f.controller.beforeFixture(f.context);
    const context = f.after(first);
    if (mode === 'reply') f.mutate.response = (x, m) => m === 'eth_call' ? hex32(999) : x;
    if (mode === 'frontier') context.checkpoint.frontier.admissions = '13';
    if (mode === 'block') f.mutate.response = (x, m) => m === 'eth_getBlockByNumber' ? { ...x, hash: hex32(99) } : x;
    await assert.rejects(f.controller.afterB1(context), /MISMATCH/);
  }
});

test('empty or incomplete post-B1 checks cannot manufacture a seal', async () => {
  const f = fixture(); f.arm.checks.afterB1 = [];
  writeFileSync(f.armPath, JSON.stringify(f.arm));
  f.pins.armInput.sha256 = sha(readFileSync(f.armPath));
  await assert.rejects(f.controller.beforeFixture(f.context), /CHECKS_INCOMPLETE/);
});

test('swapping the selected experiment cells refuses before fixture execution', async () => {
  const f = fixture(); f.context.plannedCells = ['unrelated-cheap-cell'];
  await assert.rejects(f.controller.beforeFixture(f.context), /MISMATCH/);
});

test('a second controller cannot overwrite an already retained stage', async () => {
  const f = fixture(); await f.controller.beforeFixture(f.context);
  const second = createController({ expectedNeutralHash: sha(neutral), request: async (_url, method, params) => {
    if (method === 'eth_chainId') return '0x7a69';
    if (method === 'web3_clientVersion') return 'anvil/v1.7.1';
    if (method === 'eth_getBlockByNumber') return { number: '0x20', hash: hex32(32), timestamp: '0x100' };
    if (method === 'eth_getCode') return '0x60016000';
    if (method === 'eth_call') return hex32(0);
    assert.fail(`unexpected ${method} ${params}`);
  } });
  await assert.rejects(second.beforeFixture(f.context), /EEXIST/);
});

test('real HTTP transport rejects malformed JSON-RPC envelopes and write methods', async () => {
  let response = { jsonrpc: '2.0', id: 1, result: '0x20' };
  const server = createServer(async (req, res) => {
    for await (const _ of req) { /* consume actual HTTP request */ }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(response));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await rpcRead(url, 'eth_chainId', []), '0x20');
    for (const bad of [
      { jsonrpc: '2.0', id: 99, result: '0x20' },
      { jsonrpc: '2.0', id: 1, result: '0x20', error: { code: -1 } },
      { jsonrpc: '2.0', id: 1, error: { code: -1 } },
      [{ jsonrpc: '2.0', id: 1, result: '0x20' }],
    ]) {
      response = bad;
      await assert.rejects(rpcRead(url, 'eth_chainId', []), /RPC_ENVELOPE_INVALID/);
    }
    await assert.rejects(rpcRead(url, 'eth_sendTransaction', []), /WRITE_FORBIDDEN/);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

function wordsFixture() {
  const f = fixture();
  const row = { label: 'evidence:publication2', to: address, data: '0xabcdef01',
    expectedWords: { byteLength: 96, equals: { '0': hex32(1), '2': hex32(5) } } };
  f.arm.checks.afterB1.push(row);
  const repin = () => {
    writeFileSync(f.armPath, JSON.stringify(f.arm));
    f.pins.armInput.sha256 = sha(readFileSync(f.armPath));
  };
  repin();
  f.mutate.response = (value, method, params) => method === 'eth_call' && params[0].data === row.data
    ? `${hex32(1)}${hex32(999).slice(2)}${hex32(5).slice(2)}` : value;
  return { ...f, row, repin };
}

test('predeclared raw-word assertions retain unchecked words without claiming to verify them', async () => {
  const f = wordsFixture();
  const first = await f.controller.beforeFixture(f.context);
  assert.equal((await f.controller.afterB1(f.after(first))).decision, 'ACK');
  const retained = JSON.parse(readFileSync(join(f.dir, 'independent', 'synthetic-run-afterB1.json')));
  const raw = retained.observations.find(x => x.label === f.row.label).result;
  assert.equal(raw.slice(66, 130), hex32(999).slice(2));
  assert.equal(raw.length, 2 + 96 * 2);
});

test('changed asserted word or wrong raw byte length refuses the checkpoint and retains the actual reply', async () => {
  for (const bad of [
    `${hex32(2)}${hex32(999).slice(2)}${hex32(5).slice(2)}`,
    `${hex32(1)}${hex32(999).slice(2)}${hex32(6).slice(2)}`,
    `${hex32(1)}${hex32(999).slice(2)}`,
    `${hex32(1)}${hex32(999).slice(2)}${hex32(5).slice(2)}00`,
    '0xzz', null,
  ]) {
    const f = wordsFixture();
    const first = await f.controller.beforeFixture(f.context);
    f.mutate.response = (value, method, params) => method === 'eth_call' && params[0].data === f.row.data ? bad : value;
    await assert.rejects(f.controller.afterB1(f.after(first)), /STATE_MISMATCH/);
    const retained = JSON.parse(readFileSync(join(f.dir, 'independent', 'synthetic-run-afterB1.json')));
    assert.equal(retained.decision, 'REFUSE');
    assert.equal(retained.observations.find(x => x.label === f.row.label).result, bad);
    assert.equal(retained.ack, undefined);
  }
});

test('malformed or ambiguous word declarations refuse before any RPC', async () => {
  for (const change of [
    row => { row.expected = '0x'; },
    row => { row.expectedWords.byteLength = 0; },
    row => { row.expectedWords.byteLength = 95; },
    row => { row.expectedWords.byteLength = '96'; },
    row => { row.expectedWords.equals = {}; },
    row => { row.expectedWords.equals = []; },
    row => { row.expectedWords.equals = { '3': hex32(1) }; },
    row => { row.expectedWords.equals = { '01': hex32(1) }; },
    row => { row.expectedWords.equals = { '-1': hex32(1) }; },
    row => { row.expectedWords.equals = { '0': '0x01' }; },
    row => { row.expectedWords.equals = { '0': `0x${'AA'.repeat(32)}` }; },
    row => { row.expectedWords.unrecognized = true; },
  ]) {
    const f = wordsFixture(); change(f.row); f.repin();
    await assert.rejects(f.controller.beforeFixture(f.context), /CHECK_MALFORMED/);
    assert.equal(f.calls.length, 0);
  }
});
