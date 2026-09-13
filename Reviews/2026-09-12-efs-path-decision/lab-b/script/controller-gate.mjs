import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONTEXT_SCHEMA = 'efs-lab-b/controller-context/1';
const ACK_SCHEMA = 'efs-lab-b/controller-ack/1';
const PIN_NAMES = ['controller', 'expectations', 'armInput'];
const TYPE_NAMES = ['QUOTE', 'BINARY', 'ITEM', 'PAIR', 'QUOTE_J', 'LABEL'];
const FIXTURE_NAMES = ['ITEM_ETH', 'ITEM_USDC', 'PAIR_ETH_USDC', 'QUOTE_A1', 'QUOTE_A2', 'QUOTE_B1'];
const EXPECT_NAMES = ['A_FIRST', 'B_FIRST'];
const EXPECT_FIELDS = ['subject', 'expectedHead', 'selectedAuthor', 'selectedProofKind', 'pairId', 'itemA', 'itemB', 'mantissa', 'scale', 'observedAt', 'noteCommitment', 'basisAdmission'];
const ORDINAL_FIELDS = ['placementAdmission', 'placementPublication', 'placementRevision', 'aHeadAdmission', 'aHeadRevision', 'bHeadAdmission', 'bHeadRevision', 'postB1Frontier', 'registryEpoch', 'indexGeneration'];
const CHECKPOINT_FIELDS = ['blockNumber', 'blockHash', 'timestamp', 'snapshot', 'frontier', 'indexGeneration', 'registryEpoch', 'coreCodeCommitment', 'realmId'];
const FRONTIER_FIELDS = ['admissions', 'records', 'bindings', 'publications'];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const isDigest = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const isBytes32 = (value) => typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value);
const isAddress = (value) => typeof value === 'string' && /^0x[0-9a-f]{40}$/.test(value);
const isBytes = (value) => typeof value === 'string' && /^0x(?:[0-9a-f]{2})*$/.test(value);
const isDecimal = (value) => typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value);
const isIndex = (value) => Number.isSafeInteger(value) && value >= 0;

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  if (value === undefined || typeof value === 'bigint' || (typeof value === 'number' && !Number.isFinite(value))) throw new Error('MALFORMED_JSON');
  return JSON.stringify(value);
}

export class ControllerGateError extends Error {
  constructor(code, path = '', { exitCode = 3, cause = null } = {}) {
    const suffix = path ? `:${path}` : '';
    super(`${code}${suffix}`, cause ? { cause } : undefined);
    this.name = 'ControllerGateError';
    this.code = code;
    this.path = path;
    this.exitCode = exitCode;
  }
}

const fail = (code, path = '', options) => { throw new ControllerGateError(code, path, options); };

function exactKeys(value, keys, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('CONTROLLER_ACK_MALFORMED', path);
  const expected = new Set(keys);
  for (const key of Object.keys(value)) if (!expected.has(key)) fail('CONTROLLER_ACK_MALFORMED', path ? `${path}.${key}` : key);
  for (const key of keys) if (!Object.hasOwn(value, key)) fail('CONTROLLER_ACK_MALFORMED', path ? `${path}.${key}` : key);
}

function typed(condition, path) {
  if (!condition) fail('CONTROLLER_ACK_MALFORMED', path);
}

function validatePinsEcho(pins) {
  exactKeys(pins, PIN_NAMES, 'pins');
  for (const name of PIN_NAMES) typed(isDigest(pins[name]), `pins.${name}`);
}

function validateRoles(roles) {
  exactKeys(roles, ['deployer', 'AUTHOR_A', 'actorB', 'paidCaller'], 'inputs.roles');
  for (const name of ['deployer', 'AUTHOR_A', 'paidCaller']) {
    exactKeys(roles[name], ['address', 'derivationIndex'], `inputs.roles.${name}`);
    typed(isAddress(roles[name].address), `inputs.roles.${name}.address`);
    typed(isIndex(roles[name].derivationIndex), `inputs.roles.${name}.derivationIndex`);
  }
  exactKeys(roles.actorB, ['address', 'deploymentNonce'], 'inputs.roles.actorB');
  typed(isAddress(roles.actorB.address), 'inputs.roles.actorB.address');
  typed(isIndex(roles.actorB.deploymentNonce), 'inputs.roles.actorB.deploymentNonce');
}

function validateInputs(inputs) {
  exactKeys(inputs, ['types', 'fixture', 'subject', 'roles', 'lenses', 'expect', 'placementExpect', 'ordinals'], 'inputs');
  exactKeys(inputs.types, TYPE_NAMES, 'inputs.types');
  for (const name of TYPE_NAMES) typed(isBytes32(inputs.types[name]), `inputs.types.${name}`);

  exactKeys(inputs.fixture, FIXTURE_NAMES, 'inputs.fixture');
  for (const name of FIXTURE_NAMES) {
    const path = `inputs.fixture.${name}`;
    exactKeys(inputs.fixture[name], ['typeId', 'body', 'id'], path);
    typed(isBytes32(inputs.fixture[name].typeId), `${path}.typeId`);
    typed(isBytes(inputs.fixture[name].body), `${path}.body`);
    typed(isBytes32(inputs.fixture[name].id), `${path}.id`);
  }

  exactKeys(inputs.subject, ['FILE_QUOTE', 'salt', 'creatorPrincipal'], 'inputs.subject');
  for (const key of ['FILE_QUOTE', 'salt', 'creatorPrincipal']) typed(isBytes32(inputs.subject[key]), `inputs.subject.${key}`);
  validateRoles(inputs.roles);

  exactKeys(inputs.lenses, ['LENS_A_FIRST', 'LENS_B_FIRST'], 'inputs.lenses');
  for (const name of ['LENS_A_FIRST', 'LENS_B_FIRST']) {
    typed(Array.isArray(inputs.lenses[name]) && inputs.lenses[name].length === 2, `inputs.lenses.${name}`);
    inputs.lenses[name].forEach((value, index) => typed(isAddress(value), `inputs.lenses.${name}.${index}`));
  }

  exactKeys(inputs.expect, EXPECT_NAMES, 'inputs.expect');
  for (const name of EXPECT_NAMES) {
    const path = `inputs.expect.${name}`;
    exactKeys(inputs.expect[name], EXPECT_FIELDS, path);
    for (const key of ['subject', 'expectedHead', 'pairId', 'itemA', 'itemB', 'noteCommitment']) typed(isBytes32(inputs.expect[name][key]), `${path}.${key}`);
    typed(isAddress(inputs.expect[name].selectedAuthor), `${path}.selectedAuthor`);
    for (const key of ['selectedProofKind', 'mantissa', 'scale', 'observedAt', 'basisAdmission']) typed(isDecimal(inputs.expect[name][key]), `${path}.${key}`);
  }

  exactKeys(inputs.placementExpect, ['folder', 'nameRole', 'actor', 'proofKind', 'publication', 'budget'], 'inputs.placementExpect');
  for (const key of ['folder', 'nameRole']) typed(isBytes32(inputs.placementExpect[key]), `inputs.placementExpect.${key}`);
  typed(isAddress(inputs.placementExpect.actor), 'inputs.placementExpect.actor');
  for (const key of ['proofKind', 'publication', 'budget']) typed(isDecimal(inputs.placementExpect[key]), `inputs.placementExpect.${key}`);

  exactKeys(inputs.ordinals, ORDINAL_FIELDS, 'inputs.ordinals');
  for (const key of ORDINAL_FIELDS) typed(isDecimal(inputs.ordinals[key]), `inputs.ordinals.${key}`);
}

function validateCheckpoint(checkpoint, path = 'sealedCheckpoint') {
  exactKeys(checkpoint, CHECKPOINT_FIELDS, path);
  typed(isDecimal(checkpoint.blockNumber), `${path}.blockNumber`);
  typed(isBytes32(checkpoint.blockHash), `${path}.blockHash`);
  typed(isDecimal(checkpoint.timestamp), `${path}.timestamp`);
  typed(typeof checkpoint.snapshot === 'string' && checkpoint.snapshot.length > 0, `${path}.snapshot`);
  exactKeys(checkpoint.frontier, FRONTIER_FIELDS, `${path}.frontier`);
  for (const key of FRONTIER_FIELDS) typed(isDecimal(checkpoint.frontier[key]), `${path}.frontier.${key}`);
  for (const key of ['indexGeneration', 'registryEpoch']) typed(isDecimal(checkpoint[key]), `${path}.${key}`);
  for (const key of ['coreCodeCommitment', 'realmId']) typed(isBytes32(checkpoint[key]), `${path}.${key}`);
}

function validateAck(ack, stage) {
  const stageField = stage === 'beforeFixture' ? 'inputs' : 'sealedCheckpoint';
  exactKeys(ack, ['schema', 'runId', 'stage', 'decision', 'reason', 'issuedAtUtc', 'pins', 'contextSha256', 'inputsSha256', stageField], '');
  typed(ack.schema === ACK_SCHEMA, 'schema');
  typed(typeof ack.runId === 'string', 'runId');
  typed(typeof ack.stage === 'string', 'stage');
  typed(ack.decision === 'ACK' || ack.decision === 'REFUSE', 'decision');
  typed(ack.reason === null || typeof ack.reason === 'string', 'reason');
  typed(typeof ack.issuedAtUtc === 'string', 'issuedAtUtc');
  validatePinsEcho(ack.pins);
  typed(isDigest(ack.contextSha256), 'contextSha256');
  typed(isDigest(ack.inputsSha256), 'inputsSha256');
  if (stage === 'beforeFixture') validateInputs(ack.inputs);
  else validateCheckpoint(ack.sealedCheckpoint);
}

function compareValue(comparisons, actual, expected, path, code) {
  const equal = canonical(actual) === canonical(expected);
  comparisons.push({ path, expected: clone(expected), actual: clone(actual), equal });
  if (!equal) fail(code, path);
}

function compareTree(comparisons, actual, expected, path, code) {
  if (Array.isArray(expected)) {
    for (let index = 0; index < expected.length; index++) compareTree(comparisons, actual[index], expected[index], `${path}.${index}`, code);
    return;
  }
  if (expected && typeof expected === 'object') {
    for (const key of Object.keys(expected)) compareTree(comparisons, actual[key], expected[key], path ? `${path}.${key}` : key, code);
    return;
  }
  compareValue(comparisons, actual, expected, path, code);
}

function parsePin(spec, name) {
  if (typeof spec !== 'string') fail('CONTROLLER_PIN_MALFORMED', name, { exitCode: 2 });
  const match = /^(.*):([0-9a-f]{64})$/.exec(spec);
  if (!match || !match[1]) fail('CONTROLLER_PIN_MALFORMED', name, { exitCode: 2 });
  const path = resolve(match[1]);
  let raw;
  try { raw = readFileSync(path); } catch (cause) { fail('CONTROLLER_PIN_UNREADABLE', name, { exitCode: 2, cause }); }
  if (digest(raw) !== match[2]) fail('CONTROLLER_PIN_MISMATCH', name, { exitCode: 2 });
  return { path, sha256: match[2], raw };
}

function persistJson(dir, name, value) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function summaryFor(stage, context, ack, comparisonOk, failureCode) {
  return {
    contextSha256: digest(canonical(context)),
    ackSha256: ack === undefined ? null : digest(canonical(ack)),
    decision: ack?.decision ?? null,
    comparisonOk,
    failureCode,
  };
}

export async function createControllerGate({
  args, scratchRoot, timeoutMs = 120_000,
  moduleLoader = (url) => import(url),
  now = () => new Date(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  const provided = [args?.controller, args?.expectations, args?.['arm-input']].filter((value) => value !== undefined).length;
  if (provided === 0) return { gating: 'diagnostic', report: null, enabled: false };
  if (provided !== 3) fail('CONTROLLER_PINS_INCOMPLETE', '', { exitCode: 2 });

  const pinned = Object.fromEntries(PIN_NAMES.map((name) => {
    const argName = name === 'armInput' ? 'arm-input' : name;
    return [name, parsePin(args[argName], name)];
  }));
  const runId = args['run-id'] === undefined
    ? `b-${digest(canonical({ controllerSha256: pinned.controller.sha256, expectationsSha256: pinned.expectations.sha256, armInputSha256: pinned.armInput.sha256, startedAtUtc: now().toISOString() })).slice(0, 16)}`
    : args['run-id'];
  if (typeof runId !== 'string' || !/^[a-zA-Z0-9_-]{1,96}$/.test(runId)) fail('CONTROLLER_RUN_ID_MALFORMED', '', { exitCode: 2 });

  let loaded;
  try { loaded = await moduleLoader(pathToFileURL(pinned.controller.path).href); } catch (cause) { fail('CONTROLLER_MODULE_LOAD_ERROR', cause.message, { exitCode: 2, cause }); }
  const controller = loaded?.default;
  if (!controller || typeof controller !== 'object' || !(controller.beforeFixture instanceof AsyncFunction) || !(controller.afterB1 instanceof AsyncFunction)) fail('CONTROLLER_MALFORMED_MODULE', '', { exitCode: 2 });

  const pins = Object.fromEntries(PIN_NAMES.map((name) => [name, { path: pinned[name].path, sha256: pinned[name].sha256 }]));
  const pinHashes = Object.fromEntries(PIN_NAMES.map((name) => [name, pinned[name].sha256]));
  const retentionDir = join(resolve(scratchRoot), 'controller');
  const report = { gating: 'controller-gated', runId, pins: pinHashes, stages: { beforeFixture: null, afterB1: null } };
  const state = { beforeInputs: null, inputsSha256: null, completed: new Set() };
  persistJson(retentionDir, 'pins.json', { runId, pins, module: { path: pinned.controller.path, sha256: pinned.controller.sha256, loadedAtUtc: now().toISOString(), export: 'default', hooks: ['beforeFixture', 'afterB1'] } });

  async function invoke(stage, originalContext) {
    if (!['beforeFixture', 'afterB1'].includes(stage)) fail('CONTROLLER_STAGE_ORDER', stage);
    if (stage === 'beforeFixture' ? state.completed.size !== 0 : !state.completed.has('beforeFixture') || state.completed.has('afterB1')) fail('CONTROLLER_STAGE_ORDER', stage);
    const context = clone(originalContext);
    if (context.schema !== CONTEXT_SCHEMA || context.stage !== stage || context.runId !== runId) fail('CONTROLLER_CONTEXT_MALFORMED', stage);
    const contextName = `context-${stage}.json`;
    const ackName = `ack-${stage}.json`;
    const comparisonName = `comparison-${stage}.json`;
    persistJson(retentionDir, contextName, context);
    const comparisons = [];
    let ack;
    let timer;
    let failure;
    try {
      const timeout = new Promise((_, reject) => { timer = setTimer(() => reject(new ControllerGateError('CONTROLLER_TIMEOUT')), timeoutMs); });
      try { ack = clone(await Promise.race([Promise.resolve().then(() => controller[stage](clone(context))), timeout])); }
      catch (error) {
        if (error instanceof ControllerGateError && error.code === 'CONTROLLER_TIMEOUT') throw error;
        throw new ControllerGateError('CONTROLLER_ERROR', error?.message ?? String(error), { cause: error });
      } finally { if (timer !== undefined) clearTimer(timer); }
      persistJson(retentionDir, ackName, ack);
      validateAck(ack, stage);
      compareValue(comparisons, ack.runId, context.runId, 'runId', 'CONTROLLER_ACK_MISMATCH');
      compareValue(comparisons, ack.stage, stage, 'stage', 'CONTROLLER_ACK_MISMATCH');
      for (const name of PIN_NAMES) compareValue(comparisons, ack.pins[name], pinHashes[name], `pins.${name}`, 'CONTROLLER_ACK_MISMATCH');
      compareValue(comparisons, ack.contextSha256, digest(canonical(context)), 'contextSha256', 'CONTROLLER_ACK_MISMATCH');
      if (ack.decision !== 'ACK') fail('CONTROLLER_REFUSED');

      if (stage === 'beforeFixture') {
        compareValue(comparisons, ack.inputsSha256, digest(canonical(ack.inputs)), 'inputsSha256', 'CONTROLLER_ACK_MISMATCH');
        compareTree(comparisons, ack.inputs, context.mirror, 'inputs', 'CONTROLLER_INPUT_MISMATCH');
        compareTree(comparisons, ack.inputs.types, context.typesObserved, 'inputs.types', 'CONTROLLER_INPUT_MISMATCH');
        compareTree(comparisons, ack.inputs.roles, context.roles, 'inputs.roles', 'CONTROLLER_INPUT_MISMATCH');
        compareValue(comparisons, ack.inputs.ordinals.postB1Frontier, ack.inputs.expect.A_FIRST.basisAdmission, 'inputs.expect.A_FIRST.basisAdmission', 'CONTROLLER_INPUT_MISMATCH');
        compareValue(comparisons, ack.inputs.ordinals.postB1Frontier, ack.inputs.expect.B_FIRST.basisAdmission, 'inputs.expect.B_FIRST.basisAdmission', 'CONTROLLER_INPUT_MISMATCH');
        state.beforeInputs = clone(ack.inputs);
        state.inputsSha256 = ack.inputsSha256;
      } else {
        compareValue(comparisons, context.inputsSha256, state.inputsSha256, 'inputsSha256', 'CONTROLLER_ACK_MISMATCH');
        compareValue(comparisons, ack.inputsSha256, state.inputsSha256, 'inputsSha256', 'CONTROLLER_ACK_MISMATCH');
        compareValue(comparisons, context.checkpoint.frontier.admissions, state.beforeInputs.ordinals.postB1Frontier, 'ordinals.postB1Frontier', 'CONTROLLER_INPUT_MISMATCH');
        compareValue(comparisons, context.checkpoint.registryEpoch, state.beforeInputs.ordinals.registryEpoch, 'ordinals.registryEpoch', 'CONTROLLER_INPUT_MISMATCH');
        compareValue(comparisons, context.checkpoint.indexGeneration, state.beforeInputs.ordinals.indexGeneration, 'ordinals.indexGeneration', 'CONTROLLER_INPUT_MISMATCH');
        validateCheckpoint(context.checkpoint, 'checkpoint');
        compareTree(comparisons, ack.sealedCheckpoint, context.checkpoint, 'sealedCheckpoint', 'CONTROLLER_ACK_MISMATCH');
      }
      state.completed.add(stage);
      report.stages[stage] = summaryFor(stage, context, ack, true, null);
      persistJson(retentionDir, comparisonName, { stage, comparisons, comparisonOk: true, failureCode: null });
      return stage === 'beforeFixture' ? clone(state.beforeInputs) : clone(ack);
    } catch (error) {
      failure = error instanceof ControllerGateError ? error : new ControllerGateError('CONTROLLER_ERROR', error?.message ?? String(error), { cause: error });
      report.stages[stage] = summaryFor(stage, context, ack, false, failure.code);
      persistJson(retentionDir, comparisonName, { stage, comparisons, comparisonOk: false, failureCode: failure.code, error: failure.message });
      throw failure;
    }
  }

  return {
    enabled: true,
    gating: 'controller-gated',
    runId,
    pins,
    report,
    get inputsSha256() { return state.inputsSha256; },
    invoke,
    async guard(stage, context, continuation) {
      const value = await invoke(stage, context);
      return continuation(clone(value));
    },
  };
}
