// Independent fixture history + source-observed runtime evidence. No event oracle.
import assert from 'node:assert/strict';
import { AbiCoder, keccak256, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { collectState, verifyStateWithBatchPolicy } from '../../2026-09-05-c0-core/reference/state-reader.mjs';

const abi = AbiCoder.defaultAbiCoder(), M48 = (1n << 48n) - 1n;
export const HISTORY_LIMIT = 16;
export const EXECUTION_FIELDS = 'uint32 ordinal,uint64 activationBlock,uint64 activationAdmissionHigh,address core,address carrier,address coreImplementation,address carrierImplementation,bytes32 coreCodehash,bytes32 carrierCodehash,address coreAdmin,address carrierAdmin,address controller,address operator,address helper,bytes32 helperCodehash,address admissionLibrary,bytes32 admissionCodehash,bytes32 treeType,bytes32 coreConfiguration,bytes32 carrierConfiguration,bytes32 id';
export const EXECUTION_TUPLE = 'tuple(' + EXECUTION_FIELDS + ')';
const names = EXECUTION_FIELDS.split(',').map(x => x.split(' ')[1]);
export const executionObject = row => Object.fromEntries(names.map((name, i) => [name, String(row[i])]));
export const executionId = e => keccak256(abi.encode(['bytes32', EXECUTION_TUPLE], [keccak256(Buffer.from('efs.fixture.execution-set/1')), { ...e, id: ZeroHash }]));
export function configurationId(e, core) {
  const self = core ? e.core : e.carrier, implementation = core ? e.coreImplementation : e.carrierImplementation;
  return keccak256(abi.encode(['address','address','bytes32','address','address','address','address','address','bytes32','address','address','bytes32','address','bytes32'],
    [self, implementation, core ? e.coreCodehash : e.carrierCodehash, implementation, core ? e.coreAdmin : e.carrierAdmin, e.controller, core ? e.carrier : e.core, e.operator, e.treeType, e.controller, e.helper, e.helperCodehash, e.admissionLibrary, e.admissionCodehash]));
}
class Missing extends Error {}
const unknown = message => { throw new Missing(message); };
const eq = (a, b, message) => assert.equal(String(a).toLowerCase(), String(b).toLowerCase(), message);
const failure = error => ({ outcome: error instanceof Missing ? 'UNKNOWN' : 'INVALID', reason: error.message });
export function verifyUpgradeBatch(row, history, high) {
  try {
    const meta = BigInt(row[0]), revision = (meta >> 112n) & 0xffffffffn;
    const first = meta & M48, count = (meta >> 48n) & 65535n, block = (meta >> 64n) & M48;
    const at = history?.findIndex(e => BigInt(e.ordinal) === revision) ?? -1;
    if (at < 0) unknown('missing historical revision ' + revision);
    const e = history[at], end = history[at + 1] ? BigInt(history[at + 1].activationAdmissionHigh) : BigInt(high);
    assert(revision > 0n && count > 0n && count <= 64n && (meta >> 144n) === 0n, 'batch shape');
    assert(first > BigInt(e.activationAdmissionHigh) && first + count - 1n <= end, 'historical admission interval');
    assert(block >= BigInt(e.activationBlock), 'before activation');
    if (history[at + 1]) assert(block <= BigInt(history[at + 1].activationBlock), 'after next activation');
    eq(row[1], BigInt(e.operator).toString(), 'synthetic operator basis');
    eq(row[2], e.coreCodehash, 'historical Core codehash');
    return { outcome: 'VERIFIED' };
  } catch (error) { return failure(error); }
}

export function verifyExecution(snapshot, expected) {
  try {
    if (!snapshot?.complete || !snapshot.basis) unknown('incomplete snapshot');
    const evidence = snapshot.execution;
    if (!evidence?.complete) unknown(evidence?.reason ?? 'missing execution history');
    const { history, endpoints } = evidence;
    assert(Array.isArray(history) && history.length <= HISTORY_LIMIT, 'bounded execution history');
    if (history.length < Number(evidence.currentRevision) || history.some(e => !e)) unknown('missing historical revision');
    assert(history.length > 0, 'positive execution history');
    eq(history.length, evidence.currentRevision, 'complete revision inventory');
    let block = 0n, high = 0n;
    for (const [i, e] of history.entries()) {
      if (!e) unknown('missing historical revision');
      eq(e.ordinal, i + 1, 'origin-contiguous revisions');
      assert(BigInt(e.activationBlock) >= block && BigInt(e.activationBlock) <= BigInt(snapshot.basis.number), 'activation block order');
      assert(BigInt(e.activationAdmissionHigh) >= high && BigInt(e.activationAdmissionHigh) <= BigInt(snapshot.counts[4]), 'activation admission order');
      if (!i) eq(e.activationAdmissionHigh, 0, 'initial admission boundary');
      block = BigInt(e.activationBlock); high = BigInt(e.activationAdmissionHigh);
      eq(e.id, executionId(e), 'complete execution-set commitment');
      for (const key of ['core','carrier','coreAdmin','carrierAdmin','controller','operator','helper','helperCodehash','admissionLibrary','admissionCodehash','treeType']) eq(e[key], expected.execution[key], 'fixed execution ' + key);
      for (const kind of ['core','carrier']) {
        const implementation = expected.implementations[e[kind + 'Implementation'].toLowerCase()];
        if (!implementation) unknown('unrecognized historical implementation');
        eq(e[kind + 'Codehash'], keccak256(implementation.code), 'source-derived historical implementation hash');
        eq(e[kind + 'Configuration'], configurationId(e, kind === 'core'), 'configuration commitment');
      }
    }
    const active = history.at(-1);
    for (const kind of ['core','carrier']) {
      const observed = endpoints?.[kind]; if (!observed) unknown('missing endpoint evidence');
      if (observed.pin !== snapshot.basis.hash) unknown('mixed endpoint basis');
      eq(observed.implementation, active[kind + 'Implementation'], 'actual implementation slot');
      eq(observed.adminSlot, active[kind + 'Admin'], 'admin slot');
      eq(observed.immutableAdmin, active[kind + 'Admin'], 'immutable actual admin');
      eq(observed.owner, active.controller, 'actual ProxyAdmin owner');
      eq(observed.configuration, active[kind + 'Configuration'], 'installed configuration');
      eq(observed.currentRevision, active.ordinal, 'endpoint active revision');
    }
    return { outcome: 'VERIFIED', history };
  } catch (error) { return failure(error); }
}

export function verifyUpgradeState(snapshot, expected) {
  const execution = verifyExecution(snapshot, expected);
  let pending = execution.outcome === 'UNKNOWN' ? execution.reason : null;
  const state = verifyStateWithBatchPolicy(snapshot, expected, ({ row, high }) => {
    if (execution.outcome !== 'VERIFIED') return;
    const result = verifyUpgradeBatch(row, execution.history, high);
    if (result.outcome === 'UNKNOWN') pending = result.reason;
    else assert.equal(result.outcome, 'VERIFIED', result.reason);
  });
  // Missing history never short-circuits exact raw Record/body/fold validation.
  if (state.outcome === 'INVALID') return state;
  if (execution.outcome === 'INVALID') return { ...state, ...execution, audit: 'PARTIAL', basis: null, attemptedBasis: snapshot?.basis };
  if (pending) return { ...state, outcome: 'UNKNOWN', reason: pending, rawIntegrity: state.outcome, audit: 'PARTIAL', basis: null, attemptedBasis: snapshot?.basis };
  return { ...state, execution, authority: 'operator-signed synthetic fixture authors; NOT portable author authentication' };
}

export async function readUpgradeState(lab, options = {}) {
  let attemptedBasis = null;
  try {
    const snapshot = await collectState(lab, { ...options, onBasis: basis => { attemptedBasis = basis; options.onBasis?.(basis); } });
    try { snapshot.execution = await lab.collectExecution(snapshot.basis); }
    catch (error) { snapshot.execution = { complete: false, reason: error.message }; }
    return verifyUpgradeState(snapshot, lab.expected);
  } catch (error) { return { outcome: error instanceof assert.AssertionError ? 'INVALID' : 'UNKNOWN', audit: 'PARTIAL', basis: null, attemptedBasis, reason: error.message }; }
}
