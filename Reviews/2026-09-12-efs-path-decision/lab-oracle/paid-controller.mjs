// Disposable two-stage RPC_OBSERVED run gate, not a state-proof verifier.
// Arm inputs/expected raw replies are independently prepared BEFORE the run.
// No candidate encoder, result packet or candidate verifier is imported here.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const NEUTRAL = 'ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795';
const REQUIRED = ['counts', 'registryEpoch', 'indexGeneration', 'coreCodeCommitment', 'realmId', 'aPlacement', 'bPlacementAbsent', 'aHead', 'bHead', 'scopeA', 'scopeB'];
const READS = new Set(['eth_chainId', 'web3_clientVersion', 'eth_getBlockByNumber', 'eth_getCode', 'eth_call']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const fail = (code, path = '') => { throw new Error(`${code}${path ? `:${path}` : ''}`); };
const check = (condition, code, path) => { if (!condition) fail(code, path); };
const bytes = x => typeof x === 'string' && /^0x(?:[0-9a-f]{2})*$/.test(x);
const digest = x => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x);
const decimal = x => typeof x === 'string' && /^(0|[1-9][0-9]*)$/.test(x);

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  check(value !== undefined && !(typeof value === 'number' && !Number.isFinite(value)), 'MALFORMED_JSON');
  return JSON.stringify(value);
}

function equal(actual, expected, path, code = 'INPUT_MISMATCH') {
  check(canonical(actual) === canonical(expected), code, path);
}

// Exposed solely as a testable transport boundary. Only read methods can pass.
export async function rpcRead(url, method, params) {
  check(READS.has(method), 'WRITE_FORBIDDEN', method);
  const id = 1;
  const response = await fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal: AbortSignal.timeout(10000),
  });
  check(response.ok, 'RPC_HTTP_ERROR', String(response.status));
  const body = await response.json();
  if (!(body && body.jsonrpc === '2.0' && body.id === id &&
    Object.hasOwn(body, 'result') && !Object.hasOwn(body, 'error'))) {
    const error = new Error('RPC_ENVELOPE_INVALID');
    error.rpc = { request: { jsonrpc: '2.0', id, method, params }, response: body };
    throw error;
  }
  return body.result;
}

function pinFile(pin, name) {
  check(pin && typeof pin.path === 'string' && digest(pin.sha256), 'PIN_MALFORMED', name);
  const raw = readFileSync(pin.path);
  check(sha(raw) === pin.sha256, 'PIN_MISMATCH', name);
  return raw;
}

function load(context, expectedNeutralHash) {
  check(context && context.schema === 'efs-lab-b/controller-context/1', 'CONTEXT_MALFORMED');
  check(typeof context.runId === 'string' && /^[a-zA-Z0-9_-]{1,96}$/.test(context.runId), 'RUN_ID_MALFORMED');
  check(context.pins && Object.keys(context.pins).sort().join(',') === 'armInput,controller,expectations', 'PIN_MALFORMED');
  pinFile(context.pins.controller, 'controller');
  check(resolve(context.pins.controller.path) === SELF, 'CONTROLLER_PATH_MISMATCH');
  pinFile(context.pins.expectations, 'expectations');
  check(context.pins.expectations.sha256 === expectedNeutralHash, 'NEUTRAL_PIN_MISMATCH');
  const arm = JSON.parse(pinFile(context.pins.armInput, 'armInput'));
  check(arm.schema === 'efs-paid-arm/1', 'ARM_MALFORMED');
  equal(arm.runId, context.runId, 'runId');
  equal(arm.expectationsSha256, expectedNeutralHash, 'expectationsSha256');
  check(Number.isSafeInteger(arm.chainId) && arm.chainId > 0, 'CHAIN_MALFORMED');
  check(typeof arm.retentionDir === 'string' && arm.retentionDir.startsWith('/'), 'RETENTION_MALFORMED');
  check(arm.inputs && arm.source && arm.build && arm.initial && arm.checkpoint, 'ARM_MALFORMED');
  const targets = Object.values(arm.targets ?? {});
  check(targets.length > 0, 'TARGETS_EMPTY');
  for (const target of targets) {
    check(/^0x[0-9a-f]{40}$/.test(target.address) && bytes(target.runtime) && target.runtime !== '0x', 'TARGET_MALFORMED');
  }
  for (const stage of ['beforeFixture', 'afterB1']) {
    const rows = arm.checks?.[stage];
    check(Array.isArray(rows) && rows.length > 0, 'CHECKS_INCOMPLETE', stage);
    const labels = new Set();
    for (const row of rows) {
      check(typeof row.label === 'string' && !labels.has(row.label), 'CHECKS_DUPLICATE', stage);
      labels.add(row.label);
      check(targets.some(t => t.address === row.to) && bytes(row.data) && row.data.length >= 10 && bytes(row.expected), 'CHECK_MALFORMED', row.label);
    }
    if (stage === 'afterB1') check(REQUIRED.every(x => labels.has(x)), 'CHECKS_INCOMPLETE', stage);
    else check(labels.has('counts'), 'CHECKS_INCOMPLETE', stage);
  }
  return arm;
}

export function createController({ request = rpcRead, expectedNeutralHash = NEUTRAL } = {}) {
  let prior;
  let finished = false;

  async function verify(context, stage) {
    check(context?.stage === stage, 'STAGE_ORDER');
    check(stage === 'beforeFixture' ? !prior : !!prior && !finished, 'STAGE_ORDER');
    const arm = load(context, expectedNeutralHash);
    const pinHashes = Object.fromEntries(Object.entries(context.pins).map(([k, v]) => [k, v.sha256]));
    const inputHash = sha(canonical(arm.inputs));
    let url, cp;
    if (stage === 'beforeFixture') {
      equal(context.source, arm.source, 'source');
      equal(context.build, arm.build, 'build');
      equal(context.mirror, arm.inputs, 'mirror');
      equal(context.roles, arm.inputs.roles, 'roles');
      equal(context.typesObserved, arm.inputs.types, 'typesObserved');
      equal(context.registry?.epochAfterSetup, arm.initial.registryEpoch, 'initial.registryEpoch');
      equal(context.plannedCells, arm.plannedCells, 'plannedCells');
      equal(context.firstCell, arm.firstCell, 'firstCell');
      equal(context.chain?.chainId, arm.chainId, 'chainId');
      url = context.chain?.rpc;
      cp = context.sealedInitialState;
    } else {
      equal(pinHashes, prior.pins, 'pins');
      equal(context.runId, prior.runId, 'runId');
      equal(context.inputsSha256, prior.inputHash, 'inputsSha256', 'INPUTS_MISMATCH');
      equal(inputHash, prior.inputHash, 'arm.inputs', 'INPUTS_MISMATCH');
      url = prior.url;
      cp = context.checkpoint;
      for (const [key, expected] of Object.entries(arm.checkpoint)) equal(cp?.[key], expected, `checkpoint.${key}`);
    }
    check(typeof url === 'string' && /^http:\/\/(127\.0\.0\.1|localhost):[0-9]+\/?$/.test(url), 'RPC_URL_MALFORMED');
    check(cp && decimal(cp.blockNumber) && /^0x[0-9a-f]{64}$/.test(cp.blockHash) && typeof cp.snapshot === 'string', 'BASIS_MALFORMED');
    const blockTag = `0x${BigInt(cp.blockNumber).toString(16)}`;
    const observations = [];
    async function read(method, params, label) {
      check(READS.has(method), 'WRITE_FORBIDDEN', method);
      try {
        const result = await request(url, method, params);
        observations.push({ label, method, params: clone(params), result: clone(result) });
        return result;
      } catch (error) {
        observations.push({ label, method, params: clone(params), error: error.message, ...(error.rpc ? { rpc: error.rpc } : {}) });
        throw error;
      }
    }
    try {
    equal(BigInt(await read('eth_chainId', [], 'chainId')).toString(), String(arm.chainId), 'chainId');
    check(/anvil/i.test(await read('web3_clientVersion', [], 'clientVersion')), 'NOT_ANVIL');
    const block = await read('eth_getBlockByNumber', [blockTag, false], 'observationBlock');
    equal(block?.hash, cp.blockHash, 'blockHash');
    equal(BigInt(block.number).toString(), cp.blockNumber, 'blockNumber');
    if (stage === 'afterB1') equal(BigInt(block.timestamp).toString(), cp.timestamp, 'timestamp');
    for (const [label, target] of Object.entries(arm.targets)) {
      const runtime = await read('eth_getCode', [target.address, blockTag], `runtime:${label}`);
      equal(runtime, target.runtime, label, 'RUNTIME_MISMATCH');
    }
    for (const row of arm.checks[stage]) {
      const result = await read('eth_call', [{ to: row.to, data: row.data }, blockTag], row.label);
      equal(result, row.expected, row.label, 'STATE_MISMATCH');
    }
    // Detect replacement of the numbered block while collecting independent reads.
    const after = await read('eth_getBlockByNumber', [blockTag, false], 'observationBlockRecheck');
    equal(after?.hash, cp.blockHash, 'blockHashRecheck');
    const ack = {
      schema: 'efs-lab-b/controller-ack/1', runId: context.runId, stage,
      decision: 'ACK', reason: null, issuedAtUtc: new Date().toISOString(),
      pins: pinHashes, contextSha256: sha(canonical(context)), inputsSha256: inputHash,
      ...(stage === 'beforeFixture' ? { inputs: clone(arm.inputs) } : { sealedCheckpoint: clone(cp) }),
    };
    mkdirSync(arm.retentionDir, { recursive: true });
    // Exclusive create: a second attempt cannot replace the first observation seal.
    writeFileSync(join(arm.retentionDir, `${context.runId}-${stage}.json`),
      `${JSON.stringify({ grade: 'RPC_OBSERVED', context: clone(context), observations, ack }, null, 2)}\n`, { flag: 'wx' });
    if (stage === 'beforeFixture') prior = { runId: context.runId, pins: pinHashes, inputHash, url };
    else finished = true;
    return ack;
    } catch (error) {
      // Failed observations are evidence too. Never overwrite an earlier seal,
      // and never attach an ACK to this refusal artifact.
      try {
        mkdirSync(arm.retentionDir, { recursive: true });
        writeFileSync(join(arm.retentionDir, `${context.runId}-${stage}.json`),
          `${JSON.stringify({ grade: 'RPC_OBSERVED', decision: 'REFUSE', context: clone(context), observations, error: error.message }, null, 2)}\n`, { flag: 'wx' });
      } catch (retentionError) {
        error.message += `; REFUSAL_RETENTION:${retentionError.code ?? retentionError.message}`;
      }
      throw error;
    }
  }
  return {
    beforeFixture: async context => verify(context, 'beforeFixture'),
    afterB1: async context => verify(context, 'afterB1'),
  };
}
export default createController();
