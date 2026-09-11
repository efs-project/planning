#!/usr/bin/env node
// Reconciled gas baseline for the files-browser routed operations.
//
//   node scripts/measure/baseline.mjs --run 1            # full capture into evidence/gas-2026-09-10/run1
//   node scripts/measure/baseline.mjs --run 2
//   node scripts/measure/report.mjs                      # tables.md + index.json over every run
//
// Options: --out <dir> (default evidence/gas-2026-09-10), --only <opId,...>, --skip-file.
//
// One managed anvil per run (--steps-tracing so structLogs are populated),
// the SAME populated fixture path the node suites use (nestedFixture ->
// routerFixture -> authorityFixture via startEnvironment), and every routed
// operation submitted through FilesRouterV2 exactly as test/authority.test.mjs
// submits it. Per transaction the harness retains the receipt, the raw
// transaction, the full stack-enabled structLogs trace (gzip), the
// prestateTracer diff, the callTracer tree, the compact storage-op list and
// the derived analysis. Nothing is combined across transactions or runs.
process.env.EFS_LAB_ANVIL_STEPS = '1';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const { compileUpgrade, withUpgrade } = await import('../../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
const { startEnvironment, compileRouter } = await import('../environment.mjs');
const { contentLeaves, byteCommitmentOf, EXTENDED_TYPES } = await import('../../sdk/files-actions.mjs');
const { FIXTURE, tagId } = await import('../../../2026-09-09-files-reader/index.mjs');
const { SOLC } = await import('../../../2026-09-05-c0-core/scripts/local-stateful.mjs');
const { traceTransaction } = await import('./lib/trace.mjs');
const { intrinsicGas, attributeSteps, categorize, classifyStorage, CALL_OPS } = await import('./lib/gas.mjs');
const { enumerateStoreKeys, buildSlotMap, labelPostingKeys, batchRpc, EFS_SLOT } = await import('./lib/slots.mjs');

const MVP = fileURLToPath(new URL('../../', import.meta.url));
const VAULT = resolve(MVP, '../..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const RUN = Number(opt('--run', '1'));
const OUT = resolve(MVP, opt('--out', 'evidence/gas-2026-09-10'));
const ONLY = opt('--only', null)?.split(',');
const SKIP_FILE = args.includes('--skip-file');
const HARDFORK = 'cancun';
const runDir = join(OUT, 'run' + RUN);
mkdirSync(runDir, { recursive: true });
const json = (path, value) => writeFileSync(path, JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n');
const git = a => { const r = spawnSync('git', a, { cwd: VAULT, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
const version = tool => spawnSync(tool, ['--version'], { encoding: 'utf8' }).stdout.trim().split('\n')[0];

// Operation scripts. Order matters: "steady state" is defined by what the
// earlier operations left behind, and that is recorded per operation.
// `default` is the reconciled baseline; the `lead-*` sequences replay, at the
// current revision, the exact orders the earlier ad-hoc scratchpad scripts
// used (marginal.mjs, slots.mjs) so their numbers can be checked against
// retained evidence rather than memory.
const SEQUENCES = {
  default: [
    { id: 'tag-first-ever', kind: 'tag', object: 'fileA', label: 'alpha', note: 'First FileTagAssertion ever admitted in this world, first routed V3 operation by principal A (principalNonce slot fresh) and first tag by A on fileA: type-level posting keys AND the (A, tagPurpose, fileA) scope are fresh.' },
    { id: 'tag-steady-1', kind: 'tag', object: 'fileA', label: 'beta', note: 'Second label by A on fileA: the scope (A, tagPurpose, fileA) already has a binding; type-level keys exist. STEADY STATE.' },
    { id: 'tag-steady-2', kind: 'tag', object: 'fileA', label: 'gamma', note: 'Third label by A on fileA. STEADY STATE repeat.' },
    { id: 'tag-first-in-scope', kind: 'tag', object: 'fileB', label: 'alpha', note: 'First tag by A on fileB: scope (A, tagPurpose, fileB) fresh, type-level posting keys already exist; label alpha reused so its scalar index key already exists.' },
    { id: 'createDir-1', kind: 'createDir', parent: 'root', name: 'baseline-dir-1', note: 'Directory under trip/ by A (ObjectGenesis + charter BindingSet + DirectoryEntry + name BindingSet = 4 leaves). The new object\'s charter scope is always fresh.' },
    { id: 'createDir-2', kind: 'createDir', parent: 'root', name: 'baseline-dir-2', note: 'Repeat with a different name.' },
    { id: 'stageChunk-1', kind: 'stageChunk', text: 'baseline file one: a single-chunk body.\n', note: 'Permissionless carrier chunk staging for createFile-1 (one 4 KiB-law chunk, 41 bytes).' },
    { id: 'createFile-1', kind: 'createFile', parent: 'root', name: 'baseline-1.txt', from: 'stageChunk-1', note: 'File under trip/ by A with the staged single-chunk body (7 leaves).' },
    { id: 'stageChunk-2', kind: 'stageChunk', text: 'baseline file two: a different single-chunk body.\n', note: 'Staging for createFile-2.' },
    { id: 'createFile-2', kind: 'createFile', parent: 'root', name: 'baseline-2.txt', from: 'stageChunk-2', note: 'Repeat with different name and bytes.' },
  ],
  'lead-marginal': [
    { id: 'tag-lbl0', kind: 'tag', object: 'fileA', label: 'lbl0', note: 'marginal.mjs tag#0 (first ever).' },
    { id: 'tag-lbl1', kind: 'tag', object: 'fileA', label: 'lbl1', note: 'marginal.mjs tag#1 (steady).' },
    { id: 'tag-lbl2', kind: 'tag', object: 'fileA', label: 'lbl2', note: 'marginal.mjs tag#2 (steady).' },
    { id: 'createDir-m1', kind: 'createDir', parent: 'root', name: 'm1', note: 'marginal.mjs createDir #1.' },
    { id: 'createDir-m2', kind: 'createDir', parent: 'root', name: 'm2', note: 'marginal.mjs createDir #2.' },
  ],
  'lead-slots': [
    { id: 'tag-ocean', kind: 'tag', object: 'fileA', label: 'ocean', note: 'slots.mjs / opcodes.mjs / inside-lib.mjs tag (first ever).' },
    { id: 'createDir-slotsdir', kind: 'createDir', parent: 'root', name: 'slotsdir', note: 'slots.mjs createDir.' },
    { id: 'stage-10k', kind: 'stageChunk', bytesHex: '0x' + 'ab'.repeat(10240), note: 'slots.mjs 10 KiB body: three chunks (4096, 4096, 2048); every chunk staging is captured.' },
    { id: 'createFile-10k', kind: 'createFile', parent: 'root', name: 'slots.bin', from: 'stage-10k', note: 'slots.mjs createFile (7 leaves, 10 KiB content).' },
  ],
};
const SEQUENCE = opt('--sequence', 'default');
if (!SEQUENCES[SEQUENCE]) throw new Error('unknown sequence ' + SEQUENCE);
const OPS = SEQUENCES[SEQUENCE].filter(o => (!ONLY || ONLY.includes(o.id)) && (!SKIP_FILE || !/File|Chunk|stage/.test(o.id)));

compileUpgrade(); compileRouter();
await withUpgrade(async lab => {
  const t0 = Date.now();
  const { f, auth, config } = await startEnvironment(lab, { write: true, relay: false });
  const url = auth.expected.source.replace(/^managed-anvil:/, '');
  const mountId = config.mounts.aFirst;
  const core = lab.core.toLowerCase(), carrier = lab.expected.execution.carrier.toLowerCase(), router = auth.router.toLowerCase();
  const names = new Map([[router, 'FilesRouterV2'], [core, 'Core proxy'], [carrier, 'Carrier proxy'],
    [lab.expected.execution.admissionLibrary.toLowerCase(), 'UpgradeAdmissionLibrary'], [lab.expected.execution.helper.toLowerCase(), 'PreparationHelper'],
    [lab.expected.execution.controller.toLowerCase(), 'FixtureDeployment (controller)'], [lab.expected.execution.coreAdmin.toLowerCase(), 'Core ProxyAdmin'], [lab.expected.execution.carrierAdmin.toLowerCase(), 'Carrier ProxyAdmin'],
    [auth.core3.address.toLowerCase(), 'UpgradeableFixtureCoreU3 (impl)'], [auth.carrier3.address.toLowerCase(), 'UpgradeableFixtureCarrierU3 (impl)'],
    ['0x0000000000000000000000000000000000000001', 'ecrecover precompile']]);
  for (const [k, v] of Object.entries(lab.expected.components)) if (v?.address && !names.has(v.address.toLowerCase())) names.set(v.address.toLowerCase(), k);

  const environment = {
    run: RUN, sequence: SEQUENCE, operations: OPS.map(o => o.id), startedAt: new Date(t0).toISOString(), hardfork: HARDFORK, chainId: 31337, nodeArgs: lab.resources.nodeArgs,
    versions: { node: process.version, anvil: version('anvil'), forge: version('forge'), solc: lab.resources.compiler, solcBinary: SOLC, ethers: lab.resources.versions.ethers },
    compilerSettings: { foundation: lab.resources.settings, mvpContracts: readFileSync(join(MVP, 'contracts/foundry.toml'), 'utf8') },
    git: { commit: git(['rev-parse', 'HEAD']), branch: git(['rev-parse', '--abbrev-ref', 'HEAD']), dirty: git(['status', '--porcelain']) !== '' , statusPorcelain: git(['status', '--porcelain']) },
    addresses: { core, carrier, router, admissionLibrary: lab.expected.execution.admissionLibrary, helper: lab.expected.execution.helper, controller: lab.expected.execution.controller, coreImplementationU3: auth.core3.address, carrierImplementationU3: auth.carrier3.address, principalA: auth.A, principalB: auth.B, fileA: f.fileA, fileB: f.fileB, root: f.root, mountId },
    txGasLimit: lab.resources.txGasCeiling, efsStoreSlot: '0x' + EFS_SLOT.toString(16),
    fixturePath: 'startEnvironment(lab, { write: true, relay: false }) = nestedFixture -> routerFixture -> authorityFixture; operations via authorityFixture.execute / stageChunks (FilesRouterV2 -> Core U3 executeAuthorized).',
  };
  json(join(runDir, 'environment.json'), environment);

  async function capture(op, hash, planInfo) {
    const dir = join(runDir, op.id); mkdirSync(dir, { recursive: true });
    const [receipt, tx] = await batchRpc(url, [{ method: 'eth_getTransactionReceipt', params: [hash] }, { method: 'eth_getTransactionByHash', params: [hash] }]);
    const block = await batchRpc(url, [{ method: 'eth_getBlockByNumber', params: [receipt.blockNumber, false] }]);
    if (block[0].transactions.length !== 1) throw new Error('expected one transaction per block');
    json(join(dir, 'receipt.json'), receipt); json(join(dir, 'tx.json'), tx);
    const trace = await traceTransaction(url, hash, join(dir, 'trace.json.gz'));
    const [prestate, calltree] = await batchRpc(url, [
      { method: 'debug_traceTransaction', params: [hash, { tracer: 'prestateTracer', tracerConfig: { diffMode: true } }] },
      { method: 'debug_traceTransaction', params: [hash, { tracer: 'callTracer' }] }]);
    json(join(dir, 'prestate-diff.json'), prestate); json(join(dir, 'calltree.json'), calltree);
    json(join(dir, 'storage-ops.json'), trace.storageOps);
    return { dir, receipt, tx, trace, prestate, calltree, planInfo };
  }

  const captured = [];
  const staged = {};
  const usedTagIds = new Set();
  for (const op of OPS) {
    let hash, planInfo = {};
    if (op.kind === 'tag') {
      const r = await auth.execute({ kind: 'tag', mountId, object: f[op.object], label: op.label, principal: auth.A });
      hash = r.receipt.transactionHash; usedTagIds.add(tagId(op.label));
      planInfo = { leaves: r.plan.publication.leaves.length, recordIds: r.plan.predicted.recordIds, envelopeId: r.plan.predicted.envelopeId, tagId: r.plan.op.aux, object: f[op.object] };
    } else if (op.kind === 'createDir') {
      const r = await auth.execute({ kind: 'createDir', mountId, parent: f[op.parent], name: op.name, principal: auth.A });
      hash = r.receipt.transactionHash;
      planInfo = { leaves: r.plan.publication.leaves.length, recordIds: r.plan.predicted.recordIds, envelopeId: r.plan.predicted.envelopeId, objectId: r.plan.predicted.objectId };
    } else if (op.kind === 'stageChunk') {
      const bytesHex = op.bytesHex ?? ('0x' + Buffer.from(op.text).toString('hex'));
      const content = contentLeaves(bytesHex);
      const receipts = await auth.stageChunks(content);
      staged[op.id] = { bytesHex, content };
      for (let i = 0; i < receipts.length; i++) {
        const sub = receipts.length === 1 ? op : { ...op, id: op.id + '-c' + i, note: op.note + ' chunk ' + i + ' of ' + receipts.length + '.' };
        const c = await capture(sub, receipts[i].transactionHash, { treeId: content.treeId, bytes: Number(content.size), chunkCount: content.chunkCount, chunkIndex: i, chunkBytes: (content.chunks[i].length - 2) / 2 });
        captured.push({ op: sub, ...c });
        console.log(`[run${RUN}] ${sub.id.padEnd(20)} gasUsed=${Number(c.receipt.gasUsed).toLocaleString().padStart(11)} steps=${c.trace.steps.n.toLocaleString().padStart(9)} sstore=${c.trace.storageOps.filter(o => o.op === 'SSTORE').length}`);
      }
      continue;
    } else if (op.kind === 'createFile') {
      const { bytesHex, content } = staged[op.from];
      const r = await auth.execute({ kind: 'createFile', mountId, parent: f[op.parent], name: op.name, principal: auth.A, bytesHex, byteCommitment: byteCommitmentOf(content.treeId, content.tree.body) });
      hash = r.receipt.transactionHash;
      planInfo = { leaves: r.plan.publication.leaves.length, recordIds: r.plan.predicted.recordIds, envelopeId: r.plan.predicted.envelopeId, objectId: r.plan.predicted.objectId, treeId: content.treeId, bytes: Number(content.size) };
    }
    const c = await capture(op, hash, planInfo);
    captured.push({ op, ...c });
    console.log(`[run${RUN}] ${op.id.padEnd(20)} gasUsed=${Number(c.receipt.gasUsed).toLocaleString().padStart(11)} steps=${c.trace.steps.n.toLocaleString().padStart(9)} sstore=${c.trace.storageOps.filter(o => o.op === 'SSTORE').length}`);
  }

  // Key universe at the final block (keys never change identity; only grow).
  const finalBlock = captured.at(-1).receipt.blockNumber;
  const keys = await enumerateStoreKeys(url, core, finalBlock);
  json(join(runDir, 'store-keys.json'), keys);
  const slotMap = buildSlotMap({ keys, extra: { core, carrier, router, proxyAdmins: [lab.expected.execution.coreAdmin.toLowerCase(), lab.expected.execution.carrierAdmin.toLowerCase()] } });
  const purposes = [FIXTURE.namePurpose, FIXTURE.headPurpose, FIXTURE.charterPurpose, FIXTURE.removedPurpose, FIXTURE.tagPurpose];
  const familyLabels = labelPostingKeys(keys.postingKeys, { typeIds: keys.typeIds, recordIds: keys.recordIds, principalIds: keys.principalIds, bindingKeys: keys.bindingKeys, envelopeIds: keys.envelopeIds, purposes, scalars: [...usedTagIds] });
  json(join(runDir, 'posting-key-labels.json'), Object.fromEntries(familyLabels));
  const recordType = new Map(keys.records.map(r => [r.id, r.typeId]));
  const typeName = new Map(Object.entries(EXTENDED_TYPES).map(([n, id]) => [id, n]));

  const summary = [];
  for (const c of captured) {
    const { op, receipt, tx, trace, prestate, calltree, dir, planInfo } = c;
    const steps = trace.steps;
    const callTargets = new Map(trace.callOps.map(o => [o.i, { op: o.op, target: o.target }]));
    const attribution = attributeSteps(steps, callTargets, tx.to);
    const cats = categorize(steps, attribution, callTargets);
    // Original (pre-transaction) values for every slot written, from the previous block.
    const prevBlock = '0x' + (BigInt(receipt.blockNumber) - 1n).toString(16);
    const written = new Map();
    for (const o of trace.storageOps) if (o.op === 'SSTORE') written.set(attribution.contexts[attribution.ctxIndex[o.i]] + ':' + o.slot, null);
    const wk = [...written.keys()];
    const originals = new Map(), finals = new Map();
    if (wk.length) {
      const pre = await batchRpc(url, wk.map(k => { const [a, s] = k.split(':'); return { method: 'eth_getStorageAt', params: [a, s, prevBlock] }; }));
      const post = await batchRpc(url, wk.map(k => { const [a, s] = k.split(':'); return { method: 'eth_getStorageAt', params: [a, s, receipt.blockNumber] }; }));
      wk.forEach((k, i) => { originals.set(k, '0x' + pre[i].replace(/^0x/, '').padStart(64, '0')); finals.set(k, '0x' + post[i].replace(/^0x/, '').padStart(64, '0')); });
    }
    const storage = classifyStorage(trace.storageOps, attribution, steps, originals);
    // Attribute every written and read slot to a StateStore.Kind.
    const label = (addr, slot) => slotMap.get(addr + ':' + slot) ?? (names.has(addr) && addr !== core && addr !== carrier ? { kind: names.get(addr) + ' storage', member: null, key: null, index: null } : null);
    for (const w of storage.writes) { const l = label(w.address, w.slot); w.kind = l?.kind ?? 'UNATTRIBUTED'; w.member = l?.member ?? null; w.key = l?.key ?? null; w.index = l?.index ?? null; if (l?.kind === 'Posting' || l?.kind === 'Word') { const fl = familyLabels.get(l.key); w.family = fl ? fl.family : null; } if (l?.kind === 'Record') w.recordType = typeName.get(recordType.get(l.key)) ?? recordType.get(l.key) ?? null; }
    for (const s of storage.slots) { const l = label(s.address, s.slot); s.kind = l?.kind ?? 'UNATTRIBUTED'; s.member = l?.member ?? null; s.key = l?.key ?? null; s.index = l?.index ?? null; if (l?.kind === 'Posting' || l?.kind === 'Word') { const fl = familyLabels.get(l.key); s.family = fl ? fl.family : null; } s.finalOnChain = finals.get(s.address + ':' + s.slot); s.finalMatches = s.finalOnChain === s.final; }
    const readSlots = new Map();
    for (const o of trace.storageOps) if (o.op === 'SLOAD') { const a = attribution.contexts[attribution.ctxIndex[o.i]]; const k = a + ':' + o.slot; const r = readSlots.get(k) ?? { address: a, slot: o.slot, reads: 0, gas: 0, kind: label(a, o.slot)?.kind ?? 'UNATTRIBUTED', member: label(a, o.slot)?.member ?? null }; r.reads++; r.gas += attribution.consumed[o.i]; readSlots.set(k, r); }
    const unattributedReads = [...readSlots.values()].filter(r => r.kind === 'UNATTRIBUTED').sort((x, y) => y.reads - x.reads).map(r => ({ address: r.address, name: names.get(r.address) ?? null, slot: r.slot, reads: r.reads }));
    const readsByKind = {};
    for (const r of readSlots.values()) { const b = readsByKind[r.kind] ?? { distinctSlots: 0, reads: 0, gas: 0 }; b.distinctSlots++; b.reads += r.reads; b.gas += r.gas; readsByKind[r.kind] = b; }
    // Census by Kind x class
    const census = {};
    for (const s of storage.slots) { const k = s.kind; const b = census[k] ?? { slots: 0, FRESH: 0, REWRITE: 0, CLEARED: 0, UNCHANGED: 0, UNCHANGED_ZERO: 0, writes: 0, gas: 0 }; b.slots++; b[s.finalClass]++; b.writes += s.writes; b.gas += s.gas; census[k] = b; }
    const writesByKindClass = {};
    for (const w of storage.writes) { const b = writesByKindClass[w.kind] ?? {}; b[w.class] = (b[w.class] ?? 0) + 1; writesByKindClass[w.kind] = b; }
    // Gas reconciliation
    const intrinsic = intrinsicGas(tx.input, { hardfork: HARDFORK, accessList: tx.accessList ?? [] });
    const startGas = steps.gas[0], last = steps.n - 1;
    const endRemaining = steps.gas[last] - attribution.consumed[last];
    const gross = startGas - endRemaining;
    const gasLimit = Number(tx.gas);
    const intrinsicFromTrace = gasLimit - startGas;
    const catTotal = Object.values(cats.sums).reduce((a, b) => a + b, 0);
    const nodeRefund = steps.refund ? steps.refund[last] : null;
    const usedBeforeRefund = intrinsic.standard + gross;
    const refundApplied = Math.min(storage.refundModel, Math.floor(usedBeforeRefund / 5));
    const receiptGas = Number(receipt.gasUsed);
    const reconciled = intrinsic.standard + gross - refundApplied;
    // callTracer cross-check: DFS list of frames and their gasUsed vs. my subtree per call step.
    const frames = []; (function walk(node) { for (const k of node.calls ?? []) { frames.push({ type: k.type, to: k.to?.toLowerCase(), gasUsed: parseInt(k.gasUsed, 16) }); walk(k); } })(calltree);
    const mine = trace.callOps.map(o => ({ type: o.op, to: o.target, subtree: callTargets.get(o.i).subtree, overhead: callTargets.get(o.i).overhead }));
    // A precompile frame has no steps: callTracer reports its cost as the frame's gasUsed, this harness books it as call overhead net of the 100/2600 access cost.
    const frameMismatches = frames.map((fr, i) => ({ i, tracer: fr.gasUsed, mine: mine[i]?.subtree, overhead: mine[i]?.overhead, to: fr.to, precompile: fr.to && BigInt(fr.to) > 0n && BigInt(fr.to) <= 10n }))
      .filter(x => x.precompile ? !(x.overhead - x.tracer === 100 || x.overhead - x.tracer === 2600) : x.tracer !== x.mine);
    // prestate diff cross-check: every changed slot in post must be one of my written slots with the same final value.
    const diffChanges = [];
    for (const [addr, acct] of Object.entries(prestate.post ?? {})) for (const [slot, v] of Object.entries(acct.storage ?? {})) diffChanges.push({ address: addr.toLowerCase(), slot: '0x' + slot.replace(/^0x/, '').padStart(64, '0'), value: '0x' + v.replace(/^0x/, '').padStart(64, '0') });
    const myChanged = new Map(storage.slots.filter(s => s.final !== s.original).map(s => [s.address + ':' + s.slot, s.final]));
    const diffMismatch = diffChanges.filter(d => myChanged.get(d.address + ':' + d.slot) !== d.value).length + [...myChanged.keys()].filter(k => !diffChanges.some(d => d.address + ':' + d.slot === k)).length;
    const calls = trace.callOps.map(o => ({ i: o.i, depth: o.depth, op: o.op, target: o.target, name: names.get(o.target) ?? null, subtree: callTargets.get(o.i).subtree, overhead: callTargets.get(o.i).overhead }));
    const byContract = Object.fromEntries(Object.entries(cats.byCode).map(([a, v]) => [names.get(a) ?? a, { address: a, ...v }]));
    const glamsterdam = { note: 'ESTIMATED: PM-supplied multipliers applied to MEASURED write counts by class (fresh x110,020; cold rewrite x12,100; every other SSTORE on an already-written slot x10,100). Not a prediction of total gas.', freshWrites: storage.summary.writesByClass.FRESH ?? 0, coldRewrites: storage.summary.writesByClass.COLD_REWRITE ?? 0, warmWrites: (storage.summary.writesByClass.WARM_REWRITE ?? 0) + (storage.summary.writesByClass.NOOP ?? 0) + (storage.summary.writesByClass.RESTORE ?? 0), clears: storage.summary.writesByClass.CLEAR ?? 0 };
    glamsterdam.sstoreEstimate = glamsterdam.freshWrites * 110020 + glamsterdam.coldRewrites * 12100 + glamsterdam.warmWrites * 10100;
    const analysis = {
      op: op.id, kind: op.kind, note: op.note, run: RUN, txHash: receipt.transactionHash, blockNumber: Number(receipt.blockNumber), status: receipt.status, to: tx.to, toName: names.get(tx.to.toLowerCase()) ?? null, plan: planInfo,
      receiptGasUsed: receiptGas, gasLimit,
      intrinsic: { ...intrinsic, fromTrace: intrinsicFromTrace, matches: intrinsic.standard === intrinsicFromTrace },
      execution: { startGas, endRemaining, gross, categoriesTotal: catTotal, categoriesMatchGross: catTotal === gross, steps: steps.n },
      refund: { nodeCounter: nodeRefund, model: storage.refundModel, cap: Math.floor(usedBeforeRefund / 5), applied: refundApplied, modelMatchesNode: nodeRefund === null ? null : nodeRefund === storage.refundModel },
      reconciliation: { formula: 'intrinsic.standard + execution.gross - refund.applied', value: reconciled, receipt: receiptGas, residual: receiptGas - reconciled, floor7623: intrinsic.floor7623, floor7623Applies: intrinsic.floorApplies },
      categories: cats.sums, categoryCounts: cats.counts, byOp: Object.fromEntries(Object.entries(cats.byOp).slice(0, 40)), byContract,
      sstore: { ...storage.summary, refundModel: storage.refundModel, census, writesByKindClass, glamsterdam },
      sload: { ...storage.reads, byKind: readsByKind, unattributed: unattributedReads.slice(0, 200) },
      calls, logs: trace.logOps,
      checks: { traceErrors: trace.errors.length, sstoreModelMismatches: storage.summary.modelMismatches, callTracerFrameMismatches: frameMismatches.length, callTracerFrames: frames.length, prestateDiffMismatches: diffMismatch, prestateChangedSlots: diffChanges.length, finalValueMismatches: storage.slots.filter(s => !s.finalMatches).length, unattributedWrites: storage.writes.filter(w => w.kind === 'UNATTRIBUTED').length },
      writes: storage.writes, slots: storage.slots,
      artifacts: { trace: 'trace.json.gz', rawTraceBytes: trace.summary.rawBytes, prestate: 'prestate-diff.json', calltree: 'calltree.json', storageOps: 'storage-ops.json', receipt: 'receipt.json', tx: 'tx.json' },
    };
    if (frameMismatches.length) analysis.checks.frameMismatchDetail = frameMismatches.slice(0, 10);
    json(join(dir, 'analysis.json'), analysis);
    summary.push({ op: op.id, kind: op.kind, txHash: analysis.txHash, receiptGasUsed: receiptGas, gross, intrinsic: intrinsic.standard, refundApplied, residual: analysis.reconciliation.residual, steps: steps.n, categories: cats.sums, sstore: storage.summary, sloadOps: storage.reads.ops, sloadDistinct: storage.reads.distinctSlots, checks: analysis.checks, glamsterdam });
    console.log(`[run${RUN}] ${op.id.padEnd(20)} receipt=${receiptGas.toLocaleString()} reconciled=${reconciled.toLocaleString()} residual=${analysis.reconciliation.residual} sstore=${storage.summary.sstoreOps}/${storage.summary.distinctSlotsWritten} classes=${JSON.stringify(storage.summary.writesByClass)} unattributed=${analysis.checks.unattributedWrites} modelMismatch=${storage.summary.modelMismatches} frames=${frameMismatches.length}/${frames.length}`);
  }
  json(join(runDir, 'summary.json'), { run: RUN, sequence: SEQUENCE, environment: { commit: environment.git.commit, dirty: environment.git.dirty, anvil: environment.versions.anvil, solc: environment.versions.solc }, operations: summary, elapsedMs: Date.now() - t0 });
}, { profile: 'reads', watchdogMs: 1800000 });
process.exit(0);
