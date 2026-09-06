import test from 'node:test';
import assert from 'node:assert/strict';
import { foldAdmissions, readState, verifyState, readContribution, verifyContribution, ordinaryRecord, composeMembership, HEADER } from '../reference/state-reader.mjs';
import { compileStateful, withStateful, publication, groupLeaf, TX_GAS } from '../scripts/local-stateful.mjs';
import { encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import { keccak256, AbiCoder } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { mkdirSync, writeFileSync } from 'node:fs';

const W = n => '0x' + BigInt(n).toString(16).padStart(64, '0');
const ids = { set: W(101), tombstone: W(102), withdrawal: W(103) };
const principal = W(201), target = W(301), purpose = W(401), subject = W(402), role = W(403);
const schema = { roles: [], indexes: [] };
function entry(ordinal, typeId, fields, envelopeId = W(500 + ordinal)) {
  return { ordinal: BigInt(ordinal), envelopeId, leaf: 0, typeId, recordId: W(600 + ordinal), principal, fields, references: [], schema };
}
const first = () => entry(1, ids.set, [purpose, subject, role, '0x01' + target.slice(2), '0x00', '0x00']);
const second = () => entry(2, ids.set, [purpose, subject, role, '0x01' + target.slice(2), '0x00', '0x01' + W(501).slice(2) + '0000']);
const withdraw = (ordinal, producer) => entry(ordinal, ids.withdrawal, ['0x' + W(500 + producer).slice(2) + '0000']);

// Break caught: losing the first producer/head, or encoding its revision/ordinal incorrectly.
test('literal first Record and Binding produce revision one and RAW_AUDIT origin', () => {
  const f = foldAdmissions([first()], ids);
  assert.equal(f.outcome, 'VERIFIED');
  const head = [...f.bindings.values()][0];
  assert.deepEqual([head.state, head.revision, head.ordinal, head.targetKind, head.target], [1, 1n, 1n, 1, target]);
  assert.deepEqual([...f.histories.values()][0], [1n]);
  assert.deepEqual([...f.scopes.values()][0], [1n]);
});
// Break caught: withdrawal of an old producer rolling back the current head.
test('literal withdrawn old producer remains history without changing current source', () => {
  const f = foldAdmissions([first(), second(), withdraw(3, 1)], ids);
  assert.equal(f.outcome, 'VERIFIED');
  assert.deepEqual([...f.bindings.values()].map(h => [h.revision, h.ordinal, h.state]), [[2n, 2n, 1]]);
  assert.deepEqual([...f.histories.values()][0], [1n, 2n]);
  assert.deepEqual(f.lifecycle.get(W(501) + ':0'), { status: 2, admission: 1n, withdrawal: 3n });
});
// Break caught: current-source withdrawal failing to make the next tombstone.
test('literal current-source withdrawal creates terminal-cause tombstone without history erasure', () => {
  const f = foldAdmissions([first(), withdraw(2, 1)], ids);
  assert.equal(f.outcome, 'VERIFIED');
  assert.deepEqual([...f.bindings.values()].map(h => [h.state, h.cause, h.revision, h.ordinal, h.target]), [[2, 2, 2n, 2n, W(0)]]);
  assert.deepEqual([...f.histories.values()][0], [1n, 2n]);
  assert.deepEqual([...f.scopes.values()][0], [1n]);
});
// Break caught: duplicate/reordered ordinal evidence being accepted as a full history.
test('literal duplicate admission evidence is rejected', () => {
  assert.throws(() => foldAdmissions([first(), first()], ids), /ordinal|duplicate/);
});

// Break caught: a normally deployed, retained-state snapshot not reconstructing
// the intrinsic and all four exact candidate groups without event assistance.
test('real linked slice independently reconstructs all four unchanged groups', { timeout: 240000 }, async () => {
  compileStateful(); const report = { publications: [] };
  await withStateful(async lab => {
    for (const [i, g] of lab.inputs.candidates.groups.entries()) {
      const result = await lab.publish(publication([groupLeaf(lab.inputs.meta, '0x' + g.groupHex)], i + 1));
      assert.equal(result.receipt.status, '0x1');
      const state = await checked(lab), correlation = await readContribution(lab, state, result.tx);
      assert.equal(correlation.outcome, 'ALL_FRESH'); report.publications.push({ ...result, snapshot: state.snapshot, correlation });
    }
    const result = await readState(lab);
    assert.equal(result.outcome, 'VERIFIED', result.reason ?? 'independent state reconstruction');
    assert.deepEqual(result.counts.slice(0, 6), ['4', '4', '17', '1', '4', '4']);
    assert.equal(result.audit, 'COMPLETE');
    assert.equal(result.contribution, 'UNKNOWN');
    // Every historical batch must match independently supplied synthetic fields;
    // neither a complete snapshot nor a recent receipt authenticates these fields.
    const authorityCases = [
      ['substituted basis', 'INVALID', x => { x.row[1] = '4661'; }],
      ['substituted codehash', 'INVALID', x => { x.row[2] = W(0xabce); }],
      ['missing basis', 'UNKNOWN', x => { delete x.row[1]; }],
      ['missing codehash', 'UNKNOWN', x => { delete x.row[2]; }],
      ['truncated row', 'UNKNOWN', x => { x.row.length = 1; }],
      ['missing row', 'UNKNOWN', x => { delete x.row; }],
      ['malformed row', 'INVALID', x => { x.row = { ...x.row }; }],
      ['extra field', 'INVALID', x => { x.row.push('0'); }],
      ['malformed basis', 'INVALID', x => { x.row[1] = '-1'; }],
      ['overflow basis', 'INVALID', x => { x.row[1] = String(1n << 256n); }],
      ['malformed codehash', 'INVALID', x => { x.row[2] = '0x01'; }],
    ];
    const observed = [], wanted = [];
    for (let i = 0; i < 4; i++) for (const [name, outcome, mutate] of authorityCases) {
      const snapshot = structuredClone(result.snapshot); mutate(snapshot.batches[i]);
      const verdict = verifyState(snapshot, lab.expected);
      observed.push([i, name, verdict.outcome, verdict.audit]); wanted.push([i, name, outcome, 'PARTIAL']);
    }
    for (const key of ['authorityBasis', 'authorityCodehash']) {
      const expected = structuredClone(lab.expected); delete expected.syntheticBatchAuthority?.[key];
      const verdict = verifyState(result.snapshot, expected);
      observed.push([key, verdict.outcome, verdict.audit]); wanted.push([key, 'UNKNOWN', 'PARTIAL']);
    }
    assert.deepEqual(observed, wanted, 'synthetic batch authority integrity (not authentication)');
    // Independent cast keccak of domain word + exact first Envelope + uint256(0).
    assert.equal(result.entries[0].occurrenceId, '0x7f5c4ca0f2fd60e02708813f0fa83f62b03432348cbf3c8ed0e1398ab317bca7');
    Object.assign(report, { resources: lab.resources, expected: lab.expected, cleanup: lab.cleanup });
  });
  assert(report.cleanup.stopped); evidence('groups', report);
});

// Break caught: attributing a stale all-fresh preview instead of mined contribution.
test('same-block stale preview has one transition and two independently correlated outcomes', { timeout: 240000 }, async () => {
  compileStateful(); const report = {};
  await withStateful(async lab => {
    const p = publication([groupLeaf(lab.inputs.meta, '0x' + lab.inputs.candidates.groups[0].groupHex)], 100);
    const preview = await lab.preview(p);
    assert.deepEqual(preview.leaves.map(x => Number(x.outcome)), [1]);
    await lab.mine(false);
    const first = await lab.send(lab.data(p), lab.core), second = await lab.send(lab.data(p), lab.core);
    await lab.rpc('evm_mine'); await lab.mine(true);
    const a = await lab.receipt(first), c = await lab.receipt(second);
    assert.equal(a.status, '0x1'); assert.equal(c.status, '0x1'); assert.equal(a.blockHash, c.blockHash);
    assert.equal(BigInt(a.transactionIndex), 0n); assert.equal(BigInt(c.transactionIndex), 1n);
    const result = await readState(lab);
    assert.equal(result.outcome, 'VERIFIED', result.reason ?? 'state');
    assert.deepEqual(result.counts.slice(0, 6), ['1', '1', '7', '1', '1', '1']);
    assert.equal((await readContribution(lab, result, first)).outcome, 'ALL_FRESH');
    assert.equal((await readContribution(lab, result, second)).outcome, 'ALL_REUSED');
    const correlated = await readContribution(lab, result, first);
    const changed = structuredClone(correlated.evidence); changed.transaction.input = '0x';
    assert.equal(verifyContribution(changed, result, first, lab.iface, lab.expected).outcome, 'INVALID');
    const changedLog = structuredClone(correlated.evidence); changedLog.receipts[0].logs[0].transactionHash = second.hash;
    assert.equal(verifyContribution(changedLog, result, first, lab.iface, lab.expected).outcome, 'INVALID');
    const noLog = structuredClone(correlated.evidence); noLog.receipts[0].logs = [];
    assert.equal(verifyContribution(noLog, result, first, lab.iface, lab.expected).outcome, 'UNKNOWN');
    const reusedEvidence = (await readContribution(lab, result, second)).evidence;
    const missingOriginLog = structuredClone(reusedEvidence); missingOriginLog.receipts[0].logs = [];
    assert.equal(verifyContribution(missingOriginLog, result, second, lab.iface, lab.expected).outcome, 'UNKNOWN');
    assert.equal(verifyState(result.snapshot, lab.expected).outcome, 'VERIFIED');
    assert.equal((await readContribution(lab, result, second)).acceptingBatchId, null);
    Object.assign(report, { preview: preview.toArray(true), first, second, receipts: [a, c], snapshot: result.snapshot, correlation: correlated, resources: lab.resources, expected: lab.expected, cleanup: lab.cleanup });
  });
  assert(report.cleanup.stopped); evidence('same-block-race', report);
});

const concat = (...xs) => '0x' + xs.map(x => x.replace(/^0x/, '')).join('');
const occ = (p, leaf = 0) => concat(p.envelopeId, leaf.toString(16).padStart(4, '0'));
const stateHash = snapshot => keccak256(Buffer.from(JSON.stringify(Object.fromEntries(['bootstrap', 'counts', 'records', 'envelopes', 'types', 'principals', 'admissions', 'batches', 'occurrences', 'bindings', 'postings'].map(k => [k, snapshot[k].map ? snapshot[k].map(x => typeof x === 'object' ? { ...x, pin: undefined } : x) : snapshot[k]])))));
async function groups(lab) { for (const [i, g] of lab.inputs.candidates.groups.entries()) assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta, '0x' + g.groupHex)], i + 1))).receipt.status, '0x1'); }
function members(lab) { return Object.fromEntries(lab.inputs.candidates.groups.flatMap(g => g.members.map(m => [m.descriptor.name, m.temporaryTypeSchemaId]))); }
async function checked(lab) { const state = await readState(lab); assert.equal(state.outcome, 'VERIFIED', state.reason ?? 'independent read'); return state; }

test('Object charter, rebind, withdrawal, first tombstone and full raw history reconstruct independently', { timeout: 240000 }, async t => {
  compileStateful(); const report = {};
  await withStateful(async lab => {
    await groups(lab); const m = members(lab), principal = W(0xffffffffffffn);
    const object = { typeId: m['ObjectGenesis/1'], body: concat(principal, W(99), '00') }, rid = ordinaryRecord(object.typeId, object.body);
    const position = [W(401), rid, W(403)];
    const set = pred => ({ typeId: m['BindingSet/1'], body: concat(...position, '01', rid, '00', pred ? concat('01', pred) : '00') });
    const initial = publication([object, set()], 201, { revisions: [[1, 0]] });
    assert.equal((await lab.publish(initial)).receipt.status, '0x1');
    let s = await checked(lab); assert.deepEqual(s.counts.slice(0, 6), ['6', '5', '17', '1', '6', '5']);
    assert.deepEqual([...s.fold.histories.values()], [[6n]]);
    const rebinding = publication([set(occ(initial, 1))], 202, { revisions: [[0, 1]] });
    assert.equal((await lab.publish(rebinding)).receipt.status, '0x1');
    const oldWithdrawal = publication([{ typeId: m['Withdrawal/1'], body: occ(initial, 1) }], 203);
    assert.equal((await lab.publish(oldWithdrawal)).receipt.status, '0x1');
    s = await checked(lab); assert.deepEqual([...s.fold.bindings.values()].map(h => [h.state, h.revision, h.ordinal]), [[1, 2n, 7n]]);
    assert.deepEqual([...s.fold.histories.values()], [[6n, 7n]]); assert.equal(s.fold.lifecycle.get(initial.envelopeId + ':1').status, 2);
    const currentWithdrawal = publication([{ typeId: m['Withdrawal/1'], body: occ(rebinding) }], 204);
    assert.equal((await lab.publish(currentWithdrawal)).receipt.status, '0x1');
    s = await checked(lab); assert.deepEqual([...s.fold.bindings.values()].map(h => [h.state, h.cause, h.revision, h.ordinal]), [[2, 2, 3n, 9n]]);
    // Distinct publication repeating Withdrawal is admitted, but no second target effect.
    assert.equal((await lab.publish(publication(currentWithdrawal.leaves, 205))).receipt.status, '0x1');
    s = await checked(lab); assert.deepEqual([...s.fold.histories.values()], [[6n, 7n, 9n]]);
    let pred = occ(currentWithdrawal), revision = 3;
    for (let i = 0; i < 5; i++) {
      const p = publication([set(pred)], 210 + i, { revisions: [[0, revision++]] });
      assert.equal((await lab.publish(p)).receipt.status, '0x1'); pred = occ(p);
    }
    const explicit = publication([{ typeId: m['BindingTombstone/1'], body: concat(...position, '01', pred) }], 220, { revisions: [[0, revision]] });
    assert.equal((await lab.publish(explicit)).receipt.status, '0x1');
    const firstTomb = publication([{ typeId: m['BindingTombstone/1'], body: concat(W(401), rid, W(999), '00') }], 221, { revisions: [[0, 0]] });
    assert.equal((await lab.publish(firstTomb)).receipt.status, '0x1');
    s = await checked(lab);
    assert.deepEqual([...s.fold.histories.values()], [[6n, 7n, 9n, 11n, 12n, 13n, 14n, 15n, 16n], [17n]]);
    assert.deepEqual([...s.fold.scopes.values()], [[6n, 17n]]); assert.equal(s.audit, 'COMPLETE');
    const mutations = [
      x => x.records.splice(0, 1), x => x.records.push(x.records[0]), x => x.records.reverse(),
      x => x.types[1].row[4] = x.types[0].row[4], x => x.bindings[0].row[0] = '0',
      x => x.occurrences[0].row = ['0'], x => x.admissions[0].row[1] = '0',
      x => x.postings.pop(), x => x.postings[0].words[0] = '0',
      x => { const p = x.postings.find(p => p.words.length > 1); p.words = p.words.slice(-1); },
      x => x.envelopes[0].row[0] = x.envelopes[1].row[0],
    ];
    for (const mutate of mutations) { const x = structuredClone(s.snapshot); mutate(x); assert.equal(verifyState(x, lab.expected).outcome, 'INVALID'); }
    const mixed = structuredClone(s.snapshot); mixed.records[0].pin = W(0);
    assert.equal(verifyState(mixed, lab.expected).outcome, 'UNKNOWN');
    const missing = structuredClone(s.snapshot); delete missing.components.library;
    assert.equal(verifyState(missing, lab.expected).outcome, 'UNKNOWN');
    const altered = structuredClone(s.snapshot); altered.components.library.code += '00';
    assert.equal(verifyState(altered, lab.expected).outcome, 'INVALID');
    // Actual failing transaction's last leaf is structurally invalid, while the
    // first is fresh and otherwise valid. Complete enumerated state is unchanged.
    const before = stateHash(s.snapshot), bad = publication([object, { ...object, body: object.body + 'ff' }], 230);
    const rejected = await lab.publish(bad); assert.equal(rejected.receipt.status, '0x0');
    assert.equal(stateHash((await checked(lab)).snapshot), before);
    // Retrying a WITHDRAWN source rejects without resurrecting any row.
    assert.equal((await lab.publish(initial)).receipt.status, '0x0'); assert.equal(stateHash((await checked(lab)).snapshot), before);
    Object.assign(report, { transactions: lab.transactions, snapshotBeforeRejectedTransactions: s.snapshot, snapshotAfterRejectedTransactions: (await checked(lab)).snapshot, resources: lab.resources, expected: lab.expected, cleanup: lab.cleanup });
    t.diagnostic(JSON.stringify({ resources: lab.resources, snapshotBounds: s.snapshot.stats }, (_, v) => typeof v === 'bigint' ? v.toString() : v));
  });
  assert(report.cleanup.stopped); evidence('lifecycle', report);
});

test('bounded reader classifies unavailable, inflated, truncated and oversized transport as UNKNOWN', { timeout: 240000 }, async () => {
  compileStateful();
  await withStateful(async lab => {
    const countsSelector = lab.iface.getFunction('counts').selector;
    const codecs = AbiCoder.defaultAbiCoder();
    const countsType = 'tuple(uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64)';
    for (const response of [codecs.encode([countsType], [[2n ** 63n, 0, 1, 0, 0, 0, 0, 0]]), '0x00', '0x' + '00'.repeat(131073)]) {
      let calls = 0;
      const rpc = async (method, args, opts) => { calls++; if (method === 'eth_call' && args[0].data === countsSelector) return response; return lab.rpc(method, args, opts); };
      const result = await readState({ ...lab, rpc }); assert.equal(result.outcome, 'UNKNOWN', result.reason); assert.equal(result.audit, 'PARTIAL'); assert(result.attemptedBasis?.hash); assert(calls < 15);
    }
    const unavailable = await readState({ ...lab, rpc: async () => { throw Error('unavailable'); } });
    assert.equal(unavailable.outcome, 'UNKNOWN'); assert.equal(unavailable.basis, null);
    const limited = await readState(lab, { limits: { work: 2n } }); assert.equal(limited.outcome, 'UNKNOWN');
    let blocks = 0;
    const reorganized = await readState({ ...lab, rpc: async (method, args, opts) => { const result = await lab.rpc(method, args, opts); if (method === 'eth_getBlockByNumber' && ++blocks === 2) return { ...result, hash: W(0) }; return result; } });
    assert.equal(reorganized.outcome, 'UNKNOWN'); assert.match(reorganized.reason, /basis/);
  });
});

function simpleSchema(kind = 'UINT') {
  const descriptor = { name: 'SyntheticTask3/' + kind, meaning: '', specDigest: null, qualifier: '00'.repeat(32), fields: kind === 'DIGEST' ? [{ name: 'scalar', kind: 'BOOL' }, { name: 'digest', kind: 'DIGEST' }] : [{ name: 'value', kind, ...(kind === 'UINT' ? { width: 1 } : {}) }], roles: [], indexes: kind === 'DIGEST' ? [{ kind: 1, target: 0 }, { kind: 3, target: 1 }] : [], constraints: [] };
  const raw = '0x' + encodeGroup([descriptor]).toString('hex'); return { raw, typeId: derive(Buffer.from(raw.slice(2), 'hex')).ids[0] };
}
test('portable membership remains separate from same-pin local never-admitted and withdrawn lifecycle', { timeout: 240000 }, async () => {
  compileStateful();
  await withStateful(async lab => {
    await groups(lab); const m = members(lab), schema = simpleSchema('DIGEST');
    assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta, schema.raw)], 300))).receipt.status, '0x1');
    const value = { typeId: schema.typeId, body: concat('01', '00120020', W(98765)) };
    const p = publication([value, value], 301, { selected: [0] }); assert.equal((await lab.publish(p)).receipt.status, '0x1');
    assert.equal((await lab.publish(publication([{ typeId: m['Withdrawal/1'], body: occ(p) }], 302))).receipt.status, '0x1');
    const state = await checked(lab), unsigned = AbiCoder.defaultAbiCoder().encode([HEADER, 'bytes32[]'], [p.header, p.recordIds]);
    const evidence = { envelopeId: p.envelopeId, unsigned, basis: state.basis };
    assert.deepEqual(composeMembership(state, evidence, 0, lab.expected), { membership: 'VERIFIED', lifecycle: 'WITHDRAWN', basis: state.basis });
    assert.deepEqual(composeMembership(state, evidence, 1, lab.expected), { membership: 'VERIFIED', lifecycle: 'NEVER_ADMITTED', basis: state.basis });
    const other = publication([value], 303), external = { envelopeId: other.envelopeId, unsigned: AbiCoder.defaultAbiCoder().encode([HEADER, 'bytes32[]'], [other.header, other.recordIds]), basis: state.basis };
    assert.deepEqual(composeMembership(state, external, 0, lab.expected), { membership: 'VERIFIED', lifecycle: 'UNKNOWN', basis: state.basis });
    const mixed = { ...evidence, basis: { ...state.basis, hash: W(0) } };
    assert.equal(composeMembership(state, mixed, 0, lab.expected).membership, 'UNKNOWN');
    const unique = keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [keccak256(Buffer.from('efs2/pk/1')), schema.typeId, 2, 0, W(0)]));
    assert.deepEqual(state.fold.postings.get(unique), { ordinals: [6n], live: 0n, audit: false });
    assert.equal((await lab.publish(other)).receipt.status, '0x1');
    const revived = await checked(lab);
    assert.deepEqual(revived.fold.postings.get(unique), { ordinals: [6n], live: 1n, audit: false });
    // Declared SCALAR and DIGEST keys are independently recomputed by the reader;
    // substitution cannot disappear behind the three automatic posting families.
    const bad = structuredClone(state.snapshot); bad.postings.at(-2).row = '0'; assert.equal(verifyState(bad, lab.expected).outcome, 'INVALID');
  });
});

// Generated experimental evidence only, under the controller-approved scratch
// directory. No historical artifacts, snapshots or durable docs are rewritten.
function evidence(name, value) {
  if (process.env.EFS_TASK3_EVIDENCE !== '1') return;
  const dir = new URL('../../../.superpowers/sdd/stateful-plan/task-3-evidence/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL(name + '.json', dir), JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n');
}
test('real 63-ACTIVE plus one-fresh retry starts from equal prestates and respects transaction cap', { timeout: 240000 }, async t => {
  compileStateful(); const report = {};
  await withStateful(async lab => {
    const schema = simpleSchema('BOOL'); assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta, schema.raw)], 400))).receipt.status, '0x1');
    const leaves = Array.from({ length: 64 }, () => ({ typeId: schema.typeId, body: '0x01' }));
    report.preadmissions = [];
    for (let i = 0; i < 63; i += 7) {
      const result = await lab.publish(publication(leaves, 401, { selected: Array.from({ length: 7 }, (_, j) => i + j) }));
      assert.equal(result.receipt.status, '0x1'); assert(BigInt(result.receipt.gasUsed) <= TX_GAS); report.preadmissions.push(result);
    }
    const pre = await checked(lab); assert.deepEqual(pre.counts.slice(0, 6), ['2', '2', '2', '1', '64', '10']);
    report.prestate = pre.snapshot; const checkpoint = await lab.rpc('evm_snapshot');
    const only = await lab.publish(publication(leaves, 401, { selected: [63] })); assert.equal(only.receipt.status, '0x1');
    const a = await checked(lab), ca = await readContribution(lab, a, only.tx); assert.equal(ca.outcome, 'ALL_FRESH');
    assert.equal(await lab.rpc('evm_revert', [checkpoint]), true);
    assert.equal(stateHash((await checked(lab)).snapshot), stateHash(pre.snapshot), 'equal complete prestate');
    const mixed = await lab.publish(publication(leaves, 401)); assert.equal(mixed.receipt.status, '0x1');
    const c = await checked(lab), cc = await readContribution(lab, c, mixed.tx); assert.equal(cc.outcome, 'MIXED');
    assert.equal(stateHash(a.snapshot), stateHash(c.snapshot), 'identical complete final state');
    assert.equal(cc.leaves.filter(x => x[1] === '2').length, 63); assert.equal(cc.leaves.filter(x => x[1] === '1').length, 1);
    const active = await lab.publish(publication(leaves, 401)); assert.equal(active.receipt.status, '0x1');
    const d = await checked(lab), cd = await readContribution(lab, d, active.tx); assert.equal(cd.outcome, 'ALL_REUSED');
    assert.equal(stateHash(c.snapshot), stateHash(d.snapshot), 'all-ACTIVE has no state effect');
    for (const x of [only, mixed, active]) assert(BigInt(x.receipt.gasUsed) <= TX_GAS);
    Object.assign(report, { resources: lab.resources, expected: lab.expected, only: { ...only, snapshot: a.snapshot, correlation: ca }, mixed: { ...mixed, snapshot: c.snapshot, correlation: cc }, active: { ...active, snapshot: d.snapshot, correlation: cd }, cleanup: lab.cleanup });
    t.diagnostic(JSON.stringify({ onlyGas: BigInt(only.receipt.gasUsed).toString(), mixedGas: BigInt(mixed.receipt.gasUsed).toString(), allActiveGas: BigInt(active.receipt.gasUsed).toString(), snapshotBounds: c.snapshot.stats }, (_, v) => typeof v === 'bigint' ? v.toString() : v));
  });
  assert(report.cleanup.stopped); evidence('retry', report);
});

test('fresh selected 1/8/16/32/64 sweep reports real normal-cap failures and selected-mask fallback', { timeout: 240000 }, async t => {
  compileStateful(); const report = { sweep: [] };
  await withStateful(async lab => {
    const schema = simpleSchema(); assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta, schema.raw)], 500))).receipt.status, '0x1');
    const leaves = Array.from({ length: 64 }, (_, i) => ({ typeId: schema.typeId, body: '0x' + i.toString(16).padStart(2, '0') }));
    const base = await checked(lab); report.base = base.snapshot;
    for (const n of [1, 8, 16, 32, 64]) {
      const checkpoint = await lab.rpc('evm_snapshot'), p = publication(leaves, 501, { selected: Array.from({ length: n }, (_, i) => i) });
      const result = await lab.publish(p), after = await checked(lab), gas = BigInt(result.receipt.gasUsed);
      assert(gas <= TX_GAS, 'actual receipt cap');
      if (result.receipt.status === '0x1') { assert.equal(after.counts[4], String(n + 1)); assert.equal((await readContribution(lab, after, result.tx)).outcome, 'ALL_FRESH'); }
      else { assert.equal(result.receipt.status, '0x0'); assert.equal(stateHash(after.snapshot), stateHash(base.snapshot), 'resource failure atomicity'); }
      let trace = null;
      if (result.receipt.status === '0x0') {
        try { trace = await lab.rpc('debug_traceTransaction', [result.tx.hash, { tracer: 'callTracer', tracerConfig: { onlyTopCall: false, withLog: false } }], { maxBytes: 1048576 }); }
        catch (error) { trace = { unavailable: error.message }; }
      }
      report.sweep.push({ selected: n, fresh: n, status: result.receipt.status === '0x1' ? 'SUCCESS' : 'NORMAL_CAP_FAILURE', gas: gas.toString(), result, trace, snapshot: after.snapshot });
      assert.equal(await lab.rpc('evm_revert', [checkpoint]), true);
    }
    // Bounded exact-mask fallback keeps the unchanged 64-member commitment.
    report.fallback = [];
    for (let i = 0; i < 64; i += 7) {
      const result = await lab.publish(publication(leaves, 501, { selected: Array.from({ length: Math.min(7, 64 - i) }, (_, j) => i + j) }));
      assert.equal(result.receipt.status, '0x1'); assert(BigInt(result.receipt.gasUsed) <= TX_GAS); report.fallback.push(result);
    }
    const final = await checked(lab); assert.deepEqual(final.counts.slice(0, 6), ['65', '2', '2', '1', '65', '11']);
    Object.assign(report, { resources: lab.resources, expected: lab.expected, final: final.snapshot, cleanup: lab.cleanup });
    t.diagnostic(JSON.stringify({ sweep: report.sweep.map(({ selected, fresh, status, gas }) => ({ selected, fresh, status, gas })), fallbackBatches: report.fallback.length, snapshotBounds: final.snapshot.stats }, (_, v) => typeof v === 'bigint' ? v.toString() : v));
  });
  assert(report.cleanup.stopped); evidence('resources', report);
});
