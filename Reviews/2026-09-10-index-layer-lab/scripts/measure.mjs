#!/usr/bin/env node
// Index-layer lab measurement with RETAINED receipts and traces.
//
//   node scripts/measure.mjs --n 1000 --sparse 64 --label n1000 [--skip-compile]
//
// Phases (anvil is re-hosted on the SAME port between them via anvil_dumpState /
// anvil_loadState, because a node started with --steps-tracing keeps every
// mined transaction's step log in memory — ~100 placements exhausted it — and
// anvil_dumpState on such a node serializes those logs and dies; so every dump
// is taken from an UNTRACED node and every measured transaction runs on a
// TRACED one):
//   A (untraced)  the populated files-browser world (nestedFixture -> routerFixture
//                 -> authorityFixture) -> dump D0
//   B (traced)    load D0: U3 baselines of the operations the hook touches
//                 (placement / remove / restore / createDir), the U4 upgrade, the
//                 same operations UNATTACHED (wrapper overhead) -> analysed on B
//   C (untraced)  load D0: the U4 upgrade again (same deterministic addresses), a
//                 directory scope of N placements (4 hot buckets), a sparse
//                 directory of S createDirs -> dump D1
//   D (traced)    load D1: declare (attach at declaration); hook per placement
//                 (fresh / warm word) and per rebind; coverage-slot init; backfill
//                 chunks 32/64/128/256 and the largest chunk under 16,777,216;
//                 probe (hit / covered miss / tail miss / uncovered revert /
//                 tolerant); page (hot 256 / 512, sparse); the sparse arm;
//                 a differential oracle -> analysed on D
// Every transaction: receipt, tx, full structLogs trace (gzip), prestate diff,
// storage ops, analysis (categories, SSTORE classes, SLOAD by StateStore Kind).
// Never run concurrently with the node suites (both call forge build).
import { mkdirSync, writeFileSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { nestedFixture } from '../../2026-09-09-files-browser-mvp/test/nested-fixture.mjs';
import { compileRouter, routerFixture } from '../../2026-09-09-files-browser-mvp/test/router-fixture.mjs';
import { authorityFixture } from '../../2026-09-09-files-browser-mvp/test/authority-fixture.mjs';
import { EXTENDED_TYPES, latestBindingState } from '../../2026-09-09-files-browser-mvp/sdk/files-actions.mjs';
import { FIXTURE, nameRole } from '../../2026-09-09-files-reader/index.mjs';
import { SOLC } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { traceTransaction } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/trace.mjs';
import { intrinsicGas, attributeSteps, categorize, classifyStorage } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/gas.mjs';
import { batchRpc, labelPostingKeys } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/slots.mjs';
import { compileLab, indexLayerFixture, bucketOf, scopeOf, NONE, COV, DE, LAB } from './lab-fixture.mjs';
import { buildLeanSlotMap } from './lab-slots.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const N = Number(opt('--n', '1000'));
const SPARSE = Number(opt('--sparse', '64'));
const LABEL = opt('--label', 'n' + N);
const OUT = resolve(LAB, opt('--out', 'evidence/' + LABEL));
const TX_GAS = 16777216n;
const HARDFORK = 'cancun';
mkdirSync(OUT, { recursive: true });
const json = (path, value) => writeFileSync(path, JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n');
const git = a => { const r = spawnSync('git', a, { cwd: LAB, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
const version = tool => spawnSync(tool, ['--version'], { encoding: 'utf8' }).stdout.trim().split('\n')[0];
const FILES = ['fileA', 'fileB', 'draft', 'extra'];
const log = (...x) => console.log('[' + LABEL + ']', ...x);

if (!args.includes('--skip-compile')) { compileUpgrade(); compileRouter(); compileLab(); }
const t0 = Date.now();
await withUpgrade(async lab => {
  const f = await nestedFixture(lab);
  await routerFixture(lab);
  const auth = await authorityFixture(lab);
  const url = auth.expected.source.replace(/^managed-anvil:/, '');
  const mountId = f.mounts.aFirst;
  const A = auth.A;
  const objects = { fileA: f.fileA, fileB: f.fileB, draft: f.draft, extra: f.extra };
  const B = Object.fromEntries(FILES.map(k => [k, bucketOf(objects[k])]));
  const core = lab.core.toLowerCase(), router = auth.router.toLowerCase();
  const typeNames = new Map(Object.entries(EXTENDED_TYPES).map(([n, id]) => [id, n]));
  const wall = {}, rehosts = [], anvils = [], summary = [];
  const port = Number(new URL(url).port);
  let currentTracing = false;
  const rawRpc = async (method, params) => { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); const j = await r.json(); if (j.error) throw new Error(method + ': ' + JSON.stringify(j.error)); return j.result; };
  const rssOfPort = () => { const r = spawnSync('sh', ['-c', 'pid=$(lsof -ti tcp:' + port + ' -sTCP:LISTEN | head -1); [ -n "$pid" ] && ps -o rss= -p $pid'], { encoding: 'utf8' }); return Number((r.stdout || '0').trim()) * 1024; };
  /** Dump the current (UNTRACED) chain and return the hex. */
  async function dump(why) {
    if (currentTracing) throw new Error('never dump a tracing node');
    const t = Date.now(); const d = await rawRpc('anvil_dumpState', []);
    log('dump', why, 'block=' + Number(await lab.rpc('eth_blockNumber')), ((d.length - 2) / 2 / 1048576).toFixed(1) + 'MiB', ((Date.now() - t) / 1000).toFixed(1) + 's');
    return d;
  }
  /** Kill the current anvil, start one on the SAME port with/without --steps-tracing, load `state`. */
  async function rehost(tracing, why, state) {
    const t = Date.now();
    const rssBefore = rssOfPort();
    spawnSync('sh', ['-c', 'lsof -ti tcp:' + port + ' -sTCP:LISTEN | xargs kill -9'], { encoding: 'utf8' });
    // A multi-GB tracing node takes seconds to be torn down after SIGKILL; wait for the port, then for a live node.
    const listening = () => spawnSync('sh', ['-c', 'lsof -ti tcp:' + port + ' -sTCP:LISTEN'], { encoding: 'utf8' }).stdout.trim() !== '';
    for (let i = 0; i < 1200 && listening(); i++) await delay(100);
    if (listening()) throw new Error('port ' + port + ' still held after 120 s');
    // --no-request-size-limit: anvil_loadState carries the whole dump in one JSON body (default limit 2 MB).
    const a = [...lab.resources.nodeArgs.filter(x => x !== '--steps-tracing'), '--no-request-size-limit']; if (tracing) a.push('--steps-tracing');
    let child = null, ready = false;
    for (let attempt = 0; attempt < 5 && !ready; attempt++) {
      child = spawn('anvil', a, { stdio: 'ignore' }); anvils.push(child);
      for (let i = 0; i < 200 && !ready; i++) { if (child.exitCode !== null) break; try { ready = (await rawRpc('eth_chainId')) === '0x7a69'; } catch {} if (!ready) await delay(50); }
      if (!ready) { if (child.exitCode === null) child.kill('SIGKILL'); await delay(1000); }
    }
    if (!ready) throw new Error('re-hosted anvil did not start');
    if ((await rawRpc('anvil_loadState', [state])) !== true) throw new Error('anvil_loadState failed');
    currentTracing = tracing;
    const block = Number(await lab.rpc('eth_blockNumber'));
    rehosts.push({ why, tracing, block, stateBytes: (state.length - 2) / 2, rssOfPreviousNodeBytes: rssBefore, ms: Date.now() - t });
    log('rehost', why, 'tracing=' + tracing, 'block=' + block, 'state=' + ((state.length - 2) / 2 / 1048576).toFixed(1) + 'MiB', 'previous RSS=' + (rssBefore / 1048576).toFixed(0) + 'MiB', ((Date.now() - t) / 1000).toFixed(1) + 's');
  }
  process.on('exit', () => { for (const c of anvils) if (c.exitCode === null) c.kill('SIGKILL'); });

  async function capture(list, id, hash, note, extra = {}) {
    if (!currentTracing) throw new Error('capture on an untraced node');
    const dir = join(OUT, id); mkdirSync(dir, { recursive: true });
    const [receipt, tx] = await batchRpc(url, [{ method: 'eth_getTransactionReceipt', params: [hash] }, { method: 'eth_getTransactionByHash', params: [hash] }]);
    json(join(dir, 'receipt.json'), receipt); json(join(dir, 'tx.json'), tx);
    const trace = await traceTransaction(url, hash, join(dir, 'trace.json.gz'));
    const [prestate] = await batchRpc(url, [{ method: 'debug_traceTransaction', params: [hash, { tracer: 'prestateTracer', tracerConfig: { diffMode: true } }] }]);
    json(join(dir, 'prestate-diff.json'), prestate);
    json(join(dir, 'storage-ops.json'), trace.storageOps);
    // Pre-transaction values of every written slot, fetched now (the analysis runs later on the same node).
    const prevBlock = '0x' + (BigInt(receipt.blockNumber) - 1n).toString(16);
    const callTargets = new Map(trace.callOps.map(o => [o.i, { op: o.op, target: o.target }]));
    const attribution = attributeSteps(trace.steps, callTargets, tx.to);
    const written = new Set();
    for (const o of trace.storageOps) if (o.op === 'SSTORE') written.add(attribution.contexts[attribution.ctxIndex[o.i]] + ':' + o.slot);
    const wk = [...written];
    const originals = new Map();
    if (wk.length) { const pre = await batchRpc(url, wk.map(k => { const [ad, s] = k.split(':'); return { method: 'eth_getStorageAt', params: [ad, s, prevBlock] }; }), { chunk: 400 }); wk.forEach((k, i) => originals.set(k, '0x' + pre[i].replace(/^0x/, '').padStart(64, '0'))); }
    list.push({ id, note, dir, receipt, tx, trace, prestate, extra, originals });
    log(id.padEnd(28), 'gasUsed=' + Number(receipt.gasUsed).toLocaleString().padStart(11), 'status=' + receipt.status, 'steps=' + trace.steps.n.toLocaleString());
    return receipt;
  }

  /** Analyse a phase's captured transactions against THIS node's state at `finalBlock`. */
  async function analyze(list, finalBlock, labCfg, names) {
    const { map: slotMap, keys } = await buildLeanSlotMap(url, core, finalBlock, { router, carrier, proxyAdmins: [lab.expected.execution.coreAdmin, lab.expected.execution.carrierAdmin], typeNames, lab: labCfg });
    const purposes = [FIXTURE.namePurpose, FIXTURE.headPurpose, FIXTURE.charterPurpose, FIXTURE.removedPurpose, FIXTURE.tagPurpose];
    const familyLabels = labelPostingKeys(keys.postingKeys, { typeIds: keys.typeIds, recordIds: keys.recordIds, principalIds: keys.principalIds, bindingKeys: keys.bindingKeys, envelopeIds: keys.envelopeIds, purposes, scalars: [] });
    for (const [, v] of slotMap) if ((v.kind === 'Posting' || v.kind === 'Word') && v.key && familyLabels.has(v.key)) v.kind = v.kind + ':k' + familyLabels.get(v.key).family;
    for (const c of list) {
      const { id, receipt, tx, trace, prestate, dir, note, extra, originals } = c;
      const steps = trace.steps;
      const callTargets = new Map(trace.callOps.map(o => [o.i, { op: o.op, target: o.target }]));
      const attribution = attributeSteps(steps, callTargets, tx.to);
      const cats = categorize(steps, attribution, callTargets);
      const storage = classifyStorage(trace.storageOps, attribution, steps, originals);
      const label = (addr, slot) => slotMap.get(addr + ':' + slot) ?? null;
      const readSlots = new Map();
      for (const o of trace.storageOps) if (o.op === 'SLOAD') { const ad = attribution.contexts[attribution.ctxIndex[o.i]]; const k = ad + ':' + o.slot; const l = label(ad, o.slot); const r = readSlots.get(k) ?? { kind: l?.kind ?? (names.has(ad) && ad !== core ? names.get(ad) + ' storage' : 'UNATTRIBUTED'), member: l?.member ?? null, reads: 0, gas: 0 }; r.reads++; r.gas += attribution.consumed[o.i]; readSlots.set(k, r); }
      const readsByKind = {};
      for (const r of readSlots.values()) { const b = readsByKind[r.kind] ?? { distinctSlots: 0, reads: 0, gas: 0 }; b.distinctSlots++; b.reads += r.reads; b.gas += r.gas; readsByKind[r.kind] = b; }
      const unattributedReads = [...readSlots.entries()].filter(([, r]) => r.kind === 'UNATTRIBUTED').sort((x, y) => y[1].reads - x[1].reads).slice(0, 40).map(([k, r]) => ({ slot: k, reads: r.reads, gas: r.gas }));
      const writesByKind = {};
      for (const w of storage.writes) { const l = label(w.address, w.slot); const k = l?.kind ?? 'UNATTRIBUTED'; const b = writesByKind[k] ?? { writes: 0, gas: 0, classes: {} }; b.writes++; b.gas += w.gas; b.classes[w.class] = (b.classes[w.class] ?? 0) + 1; writesByKind[k] = b; }
      const intrinsic = intrinsicGas(tx.input, { hardfork: HARDFORK, accessList: tx.accessList ?? [] });
      const startGas = steps.gas[0], last = steps.n - 1;
      const gross = startGas - (steps.gas[last] - attribution.consumed[last]);
      const catTotal = Object.values(cats.sums).reduce((x, y) => x + y, 0);
      const refundApplied = Math.min(storage.refundModel, Math.floor((intrinsic.standard + gross) / 5));
      const receiptGas = Number(receipt.gasUsed);
      const reconciled = intrinsic.standard + gross - refundApplied;
      const diffChanges = [];
      for (const [addr, acct] of Object.entries(prestate.post ?? {})) for (const [slot, v] of Object.entries(acct.storage ?? {})) diffChanges.push({ address: addr.toLowerCase(), slot: '0x' + slot.replace(/^0x/, '').padStart(64, '0'), value: '0x' + v.replace(/^0x/, '').padStart(64, '0') });
      const myChanged = new Map(storage.slots.filter(s => s.final !== s.original).map(s => [s.address + ':' + s.slot, s.final]));
      // geth-style diffMode omits from `post` a slot whose post value is zero (a CLEAR); accept that shape.
      const ZERO32 = '0x' + '0'.repeat(64);
      const diffMismatch = receipt.status !== '0x1' ? null : diffChanges.filter(x => myChanged.get(x.address + ':' + x.slot) !== x.value).length + [...myChanged.entries()].filter(([k, v]) => v !== ZERO32 && !diffChanges.some(x => x.address + ':' + x.slot === k)).length;
      const byContract = Object.fromEntries(Object.entries(cats.byCode).map(([ad, v]) => [names.get(ad) ?? ad, { address: ad, ...v }]));
      const analysis = {
        op: id, note, txHash: receipt.transactionHash, blockNumber: Number(receipt.blockNumber), status: receipt.status, to: tx.to, extra,
        receiptGasUsed: receiptGas, gasLimit: Number(tx.gas),
        intrinsic: { ...intrinsic, fromTrace: Number(tx.gas) - startGas, matches: intrinsic.standard === Number(tx.gas) - startGas },
        execution: { startGas, gross, categoriesTotal: catTotal, categoriesMatchGross: catTotal === gross, steps: steps.n },
        refund: { nodeCounter: steps.refund ? steps.refund[last] : null, model: storage.refundModel, applied: refundApplied },
        reconciliation: { formula: 'intrinsic.standard + execution.gross - refund.applied', value: reconciled, receipt: receiptGas, residual: receiptGas - reconciled },
        categories: cats.sums, categoryCounts: cats.counts, byContract,
        sstore: { ...storage.summary, refundModel: storage.refundModel, byKind: writesByKind },
        sload: { ...storage.reads, byKind: readsByKind, unattributed: unattributedReads },
        checks: { traceErrors: trace.errors.length, sstoreModelMismatches: storage.summary.modelMismatches, prestateDiffMismatches: diffMismatch, unattributedReads: readsByKind.UNATTRIBUTED?.reads ?? 0, unattributedWrites: writesByKind.UNATTRIBUTED?.writes ?? 0 },
        writes: storage.writes.map(w => ({ ...w, kind: label(w.address, w.slot)?.kind ?? 'UNATTRIBUTED', member: label(w.address, w.slot)?.member ?? null })),
        artifacts: { trace: 'trace.json.gz', rawTraceBytes: trace.summary.rawBytes, prestate: 'prestate-diff.json', storageOps: 'storage-ops.json', receipt: 'receipt.json', tx: 'tx.json' },
      };
      json(join(dir, 'analysis.json'), analysis);
      summary.push({ op: id, note, status: receipt.status, receiptGasUsed: receiptGas, gross, intrinsic: intrinsic.standard, residual: analysis.reconciliation.residual, steps: steps.n, categories: cats.sums, sstore: { ops: storage.summary.sstoreOps, distinct: storage.summary.distinctSlotsWritten, classes: storage.summary.writesByClass, gas: cats.sums.SSTORE }, sload: { ops: storage.reads.ops, distinct: storage.reads.distinctSlots, gas: storage.reads.gas, byKind: readsByKind }, sstoreByKind: writesByKind, checks: analysis.checks, extra });
      log(id.padEnd(28), 'receipt=' + receiptGas.toLocaleString(), 'residual=' + analysis.reconciliation.residual, 'sload=' + storage.reads.ops, 'sstore=' + storage.summary.sstoreOps, JSON.stringify(storage.summary.writesByClass), 'unattributedReads=' + analysis.checks.unattributedReads);
      c.trace = null; c.prestate = null; // release memory
    }
  }
  const carrier = lab.expected.execution.carrier.toLowerCase();
  const baseNames = () => { const m = new Map([[router, 'FilesRouterV2'], [core, 'Core proxy'], [carrier, 'Carrier proxy'], [lab.expected.execution.admissionLibrary.toLowerCase(), 'UpgradeAdmissionLibrary (pinned kernel)'], [lab.expected.execution.helper.toLowerCase(), 'PreparationHelper'], [auth.core3.address.toLowerCase(), 'UpgradeableFixtureCoreU3 (impl)'], [auth.carrier3.address.toLowerCase(), 'UpgradeableFixtureCarrierU3 (impl)'], [lab.expected.execution.controller.toLowerCase(), 'FixtureDeployment (controller)'], [lab.expected.execution.coreAdmin.toLowerCase(), 'Core ProxyAdmin'], [lab.expected.execution.carrierAdmin.toLowerCase(), 'Carrier ProxyAdmin'], ['0x0000000000000000000000000000000000000001', 'ecrecover precompile']]); for (const [k, v] of Object.entries(lab.expected.components)) if (v?.address && !m.has(v.address.toLowerCase())) m.set(v.address.toLowerCase(), k); return m; };
  const withIx = (names, ix) => { names.set(ix.hook.address.toLowerCase(), 'IndexedAdmission (hook)'); names.set(ix.module.address.toLowerCase(), 'IndexLayerModule'); names.set(ix.core4.address.toLowerCase(), 'UpgradeableFixtureCoreU4 (impl)'); return names; };
  const call = (to, data) => lab.rpc('eth_call', [{ to, data }, 'latest']);
  const pri = (dir, name) => latestBindingState(call, lab.core, { principal: A, purpose: FIXTURE.namePurpose, subject: dir, fieldRole: nameRole(name) });
  const place = (dir, name, key) => auth.execute({ kind: 'placement', mountId, parent: dir, name, object: objects[key], principal: A });
  async function remove(dir, name, key) { const p = await pri(dir, name); return auth.execute({ kind: 'remove', mountId, parent: dir, name, object: objects[key], principal: A, selectedEntry: p.targetA, priors: { source: p.prior } }); }
  async function restore(dir, name, key, markerId) {
    const m = await latestBindingState(call, lab.core, { principal: A, purpose: FIXTURE.removedPurpose, subject: dir, fieldRole: markerId });
    return auth.execute({ kind: 'restore', mountId, parent: dir, name, object: objects[key], markerId, principal: A, priors: { destination: (await pri(dir, name)).prior, marker: m.prior } });
  }

  // ---- A: dump the populated world ---------------------------------------------
  const D0 = await dump('D0: fixtures');

  // ---- B (traced): U3 baselines, U4 upgrade, U4 unattached ----------------------
  await rehost(true, 'B: load D0 for U3/U4 baselines', D0);
  const phaseB = [];
  const bench = (await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'bench', principal: A })).plan.predicted.objectId;
  for (let i = 0; i < 3; i++) await capture(phaseB, 'u3-placement-' + i, (await place(bench, 'u3-' + i, FILES[i % 2])).receipt.transactionHash, 'U3 placement of ' + FILES[i % 2] + ' under bench/ (2 leaves).');
  {
    const rm = await remove(bench, 'u3-0', 'fileA');
    await capture(phaseB, 'u3-remove', rm.receipt.transactionHash, 'U3 remove (whiteout rebind of the name position + marker, 4 leaves).');
    const rs = await restore(bench, 'u3-0', 'fileA', rm.plan.predicted.markerId);
    await capture(phaseB, 'u3-restore', rs.receipt.transactionHash, 'U3 restore (entry rebind of the whiteout position, 3 leaves).');
    await capture(phaseB, 'u3-createDir', (await auth.execute({ kind: 'createDir', mountId, parent: bench, name: 'u3-dir', principal: A })).receipt.transactionHash, 'U3 createDir under bench/ (4 leaves).');
  }
  let ix = await indexLayerFixture(lab, auth);
  await capture(phaseB, 'u4-upgrade', ix.upgradeReceipt.transactionHash, 'upgradePair(U4 core, same U3 carrier).');
  for (let i = 0; i < 3; i++) await capture(phaseB, 'u4-placement-' + i, (await place(bench, 'u4-' + i, FILES[i % 2])).receipt.transactionHash, 'U4 placement with NO family declared: wrapper overhead (pre-read + nested delegatecall + typeFamilies lookup).');
  {
    const rm = await remove(bench, 'u4-0', 'fileA');
    await capture(phaseB, 'u4-remove', rm.receipt.transactionHash, 'U4 remove, no family.');
    const rs = await restore(bench, 'u4-0', 'fileA', rm.plan.predicted.markerId);
    await capture(phaseB, 'u4-restore', rs.receipt.transactionHash, 'U4 restore, no family.');
    await capture(phaseB, 'u4-createDir', (await auth.execute({ kind: 'createDir', mountId, parent: bench, name: 'u4-dir', principal: A })).receipt.transactionHash, 'U4 createDir, no family.');
  }
  await analyze(phaseB, phaseB.at(-1).receipt.blockNumber, {}, withIx(baseNames(), ix));
  const ixB = ix;

  // ---- C (untraced): load D0 again, U4 upgrade, populate, dump D1 ----------------
  await rehost(false, 'C: load D0 for population', D0);
  ix = await indexLayerFixture(lab, auth); // addresses differ from phase B (the lab wallet paid B's routed ops); each phase is analysed with its own
  const big = (await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'big', principal: A })).plan.predicted.objectId;
  const bigScope = scopeOf(A, big);
  {
    const t = Date.now(); let gas = 0n;
    for (let i = 0; i < N; i++) { const r = await place(big, 'e' + String(i).padStart(5, '0'), FILES[i % 4]); gas += r.gasUsed; if (i % 200 === 199) log('populated', i + 1, 'of', N, 'elapsed', ((Date.now() - t) / 1000).toFixed(0) + 's'); }
    wall.populateBig = { n: N, ms: Date.now() - t, totalGas: gas.toString() };
  }
  const sparse = (await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'sparse', principal: A })).plan.predicted.objectId;
  const sparseScope = scopeOf(A, sparse);
  const sparseChildren = [];
  {
    const t = Date.now();
    for (let i = 0; i < SPARSE; i++) sparseChildren.push((await auth.execute({ kind: 'createDir', mountId, parent: sparse, name: 's' + String(i).padStart(3, '0'), principal: A })).plan.predicted.objectId);
    wall.populateSparse = { n: SPARSE, ms: Date.now() - t };
  }
  const D1 = await dump('D1: populated (N=' + N + ', sparse=' + SPARSE + ')');

  // ---- D (traced): the index layer --------------------------------------------------
  await rehost(true, 'D: load D1 for the index phase', D1);
  const phaseD = [];
  const cap = (id, hash, note, extra) => capture(phaseD, id, hash, note, extra);
  const declared = await ix.tx('declare', [DE, 2]);
  const [familyId, familyOrdinal, d] = declared.values;
  await cap('declare', declared.hash, 'declare FIELD_EQ(DirectoryEntry/1.child); attaches to the Type at declaration.');
  await cap('hook-placement-fresh-word', (await place(big, 'h-fresh', 'fileA')).receipt.transactionHash, 'first post-attach placement: the fileA bucket word at word index ' + Math.floor(N / 256) + ' is fresh.');
  await cap('hook-placement-warm-word', (await place(big, 'h-warm', 'fileA')).receipt.transactionHash, 'second post-attach placement of fileA: same bucket word (cold rewrite).');
  await cap('hook-placement-second-bucket', (await place(big, 'h-second', 'fileB')).receipt.transactionHash, 'third: bucket fileB, fresh word.');
  {
    const rm = await remove(big, 'h-warm', 'fileA');
    await cap('hook-remove-clear', rm.receipt.transactionHash, 'remove = whiteout rebind of a hook-set position: locate by binary search + clear.');
    const rs = await restore(big, 'h-warm', 'fileA', rm.plan.predicted.markerId);
    await cap('hook-restore-set', rs.receipt.transactionHash, 'restore = entry rebind of the whiteout position: locate + set.');
    const rb = await ix.rebindName({ principal: A, dir: big, name: 'h-second', child: objects.draft });
    await cap('hook-rebind-field-change', rb.hash, 'direct one-step rebind fileB -> draft at a hook-maintained position: locate + clear old + set new (fresh word for draft).');
    const rb2 = await ix.rebindName({ principal: A, dir: big, name: 'e00003', child: objects.fileA });
    await cap('hook-rebind-uncovered', rb2.hash, 'direct rebind of an UNBACKFILLED pre-declaration position (extra -> fileA): locate + clear (no-op) + set.');
  }
  await cap('coverage-init', (await ix.tx('backfill', [familyId, bigScope, NONE, 0])).hash, 'backfill with maxEntries=0: allocates the coverage slot (binary search for liveFrom) and nothing else.');
  const chunks = {};
  for (const size of [32, 64, 128]) {
    const r = await ix.tx('backfill', [familyId, bigScope, NONE, size]);
    chunks[size] = { gas: r.gasUsed, through: Number(r.values[0]) };
    await cap('backfill-' + size, r.hash, 'backfill chunk of ' + size + ' entries (hot buckets: 4 objects cycling).');
  }
  let perEntry = Number(chunks[128].gas - chunks[64].gas) / 64;
  let fixed = Number(chunks[128].gas) - 128 * perEntry;
  if (fixed + 256 * perEntry < 16000000 && N - chunks[128].through >= 256) {
    const r = await ix.tx('backfill', [familyId, bigScope, NONE, 256]);
    chunks[256] = { gas: r.gasUsed, through: Number(r.values[0]) };
    await cap('backfill-256', r.hash, 'backfill chunk of 256 entries (hot buckets).');
    perEntry = Number(chunks[256].gas - chunks[128].gas) / 128;
    fixed = Number(chunks[128].gas) - 128 * perEntry;
  }
  let remaining = N - Object.values(chunks).at(-1).through;
  const maxChunk = { perEntryEstimate: perEntry, fixedEstimate: fixed, attempts: [] };
  let candidate = Math.min(remaining, Math.floor((16777216 - fixed) / perEntry) - 4);
  while (candidate > 0) {
    const data = ix.iface.encodeFunctionData('backfill', [familyId, bigScope, NONE, candidate]);
    let estimate = null;
    try { estimate = Number(await lab.rpc('eth_estimateGas', [{ from: lab.expected.execution.controller, to: lab.core, data, gas: '0x' + TX_GAS.toString(16) }])); } catch (e) { estimate = 'revert:' + String(e.data ?? e.message).slice(0, 80); }
    const sent = await ix.send(data, null, { gas: TX_GAS });
    maxChunk.attempts.push({ maxEntries: candidate, estimateGas: estimate, status: sent.receipt.status, gasUsed: Number(sent.receipt.gasUsed) });
    if (sent.receipt.status === '0x1') {
      await cap('backfill-max-' + candidate, sent.hash, 'largest chunk that landed under the 16,777,216 transaction ceiling (see maxChunk.attempts).');
      break;
    }
    await cap('backfill-oog-' + candidate, sent.hash, 'FAILED attempt at ' + candidate + ' entries (out of gas under the ceiling).');
    candidate = Math.floor(candidate * 0.95);
  }
  if (!args.includes('--no-finish')) {
    const t = Date.now(); let calls = 0;
    for (;;) { const r = await ix.tx('backfill', [familyId, bigScope, NONE, 256]); calls++; if (Number(r.values[2]) === COV.COMPLETE) break; }
    wall.finishBig = { ms: Date.now() - t, extraCalls: calls };
  } else wall.finishBig = { skipped: '--no-finish: coverage left PARTIAL on the traced node (finishing N entries under tracing re-creates the memory problem); pages below report PARTIAL' };
  await cap('probe-hit', (await ix.tx('probe', [familyId, bigScope, B.fileA, 0])).hash, 'probe: set bit -> true.');
  await cap('probe-miss-covered', (await ix.tx('probe', [familyId, bigScope, B.fileA, 1])).hash, 'probe: covered clear bit -> false (through > position).');
  await cap('probe-tail-miss', (await ix.tx('probe', [familyId, bigScope, B.fileB, N + 1])).hash, 'probe: clear bit at a born-after-d position -> false via the kind-10 word (no slot needed).');
  await cap('probe-tolerated', (await ix.tx('probeTolerated', [familyId, bigScope, B.fileA, 1])).hash, 'probeTolerated: MISS_COVERED with the Coverage struct.');
  await cap('page-hot-256', (await ix.tx('page', [familyId, bigScope, B.fileA, 0, 256, 0])).hash, 'page over the hot fileA bucket, 256 items.');
  await cap('page-hot-512', (await ix.tx('page', [familyId, bigScope, B.fileA, 0, 512, 0])).hash, 'page over the hot fileA bucket, 512 items (cap).');
  const fam2 = (await ix.tx('declare', [DE, 2])).values[0];
  await cap('probe-uncovered-revert', (await ix.tx('probe', [fam2, bigScope, B.fileA, 0], { expectError: 'Uncovered' })).receipt.transactionHash, 'probe on an uncovered clear bit: reverts Uncovered (gas = work before revert, including the log N liveFrom derivation on the revert path).');
  await cap('coverage-init-2', (await ix.tx('backfill', [fam2, bigScope, NONE, 0])).hash, 'coverage-slot init for a second family on the same scope (N entries, same binary search).');
  {
    const r = await ix.tx('backfill', [familyId, sparseScope, NONE, SPARSE]);
    await cap('backfill-sparse-' + SPARSE, r.hash, 'sparse arm: ' + SPARSE + ' distinct children (createDir objects) -> one fresh bucket word per entry; includes the slot init.');
    await cap('page-sparse', (await ix.tx('page', [familyId, sparseScope, bucketOf(sparseChildren[3]), 0, 16, 0])).hash, 'page over a single-hit bucket in the sparse scope.');
  }
  const oracleResult = { checked: 0, mismatches: [] };
  {
    const t = Date.now();
    const cov = (await ix.view('coverageOf', [familyId, bigScope])).values[0];
    const through = Number(cov.through), liveFrom = Number(cov.liveFrom), count = Number(cov.scopeCount);
    const limit = N <= 1024 ? count : Math.min(count, through + 8);
    oracleResult.sample = { through, liveFrom, count, limit, rule: 'positions < through and >= liveFrom are compared; the uncovered gap is skipped' };
    const o = await ix.oracle(A, big, { limit });
    for (const p of o.positions) for (const k of FILES) {
      if (!(p.position < through || p.position >= liveFrom)) continue;
      const expected = p.bucket === B[k];
      const got = await ix.view('probe', [familyId, bigScope, B[k], p.position]);
      oracleResult.checked++;
      if (!got.ok || got.values[0] !== expected) oracleResult.mismatches.push({ position: p.position, bucket: k, expected, got: got.ok ? got.values[0] : got.error });
    }
    oracleResult.positions = o.positions.length; oracleResult.ms = Date.now() - t;
  }
  log('oracle', JSON.stringify({ checked: oracleResult.checked, mismatches: oracleResult.mismatches.length }));
  const familyOrdinals = [Number(familyOrdinal), Number(familyOrdinal) + 1];
  await analyze(phaseD, phaseD.at(-1).receipt.blockNumber, { familyOrdinals, familyIds: [familyId, fam2], scopes: [bigScope, sparseScope], buckets: [...Object.values(B), ...sparseChildren.map(bucketOf)], maxWords: Math.ceil((N + 8) / 256) + 1 }, withIx(baseNames(), ix));

  const environment = {
    label: LABEL, n: N, sparse: SPARSE, startedAt: new Date(t0).toISOString(), elapsedMs: Date.now() - t0, hardfork: HARDFORK, chainId: 31337, nodeArgs: lab.resources.nodeArgs,
    versions: { node: process.version, anvil: version('anvil'), forge: version('forge'), solc: lab.resources.compiler, solcBinary: SOLC, ethers: lab.resources.versions.ethers },
    git: { commit: git(['rev-parse', 'HEAD']), branch: git(['rev-parse', '--abbrev-ref', 'HEAD']), dirty: git(['status', '--porcelain']) !== '' },
    labFoundry: readFileSync(join(LAB, 'foundry.toml'), 'utf8'),
    addresses: { core, router, hook: ix.hook.address, module: ix.module.address, core4: ix.core4.address, admissionLibrary: lab.expected.execution.admissionLibrary, principalA: A, big, sparse, bench, familyId, fam2, familyOrdinal: String(familyOrdinal), declaredAt: String(d) },
    codeSizes: { core4: ix.core4.runtimeBytes, module: ix.module.runtimeBytes, hook: ix.hook.runtimeBytes },
    buckets: B, scopes: { bigScope, sparseScope },
    wall, rehosts, finalAnvilRssBytes: rssOfPort(), chunks: Object.fromEntries(Object.entries(chunks).map(([k, v]) => [k, { gas: v.gas.toString(), through: v.through }])), maxChunk, oracle: oracleResult,
    fixturePath: 'nestedFixture -> routerFixture -> authorityFixture (U3) -> indexLayerFixture (U4); operations via authorityFixture.execute (FilesRouterV2 -> executeAuthorized) and direct author-signed executeAuthorized; index calls via the U4 fallback -> IndexLayerModule. Phases A-D re-host anvil on one port with anvil_dumpState/anvil_loadState; dumps only from untraced nodes.',
  };
  json(join(OUT, 'environment.json'), environment);
  json(join(OUT, 'summary.json'), { label: LABEL, operations: summary, wall, rehosts, chunks: environment.chunks, maxChunk, oracle: oracleResult, elapsedMs: Date.now() - t0 });
  const files = [];
  (function walk(dir) { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) walk(p); else files.push(p); } })(OUT);
  const index = files.sort().map(p => ({ path: p.slice(LAB.length), bytes: statSync(p).size, sha256: createHash('sha256').update(readFileSync(p)).digest('hex') }));
  json(join(OUT, 'index.json'), { generatedAt: new Date().toISOString(), command: 'node scripts/measure.mjs --n ' + N + ' --sparse ' + SPARSE + ' --label ' + LABEL, files: index.filter(x => !x.path.endsWith('index.json')) });
  log('done in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  for (const c of anvils) if (c.exitCode === null) c.kill('SIGKILL');
}, { profile: 'reads', watchdogMs: 7200000 });
process.exit(0);
