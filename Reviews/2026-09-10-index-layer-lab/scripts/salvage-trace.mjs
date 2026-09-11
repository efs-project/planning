#!/usr/bin/env node
// Offline analysis of RETAINED trace.json.gz files (no node needed): hook /
// module frame self gas and SLOAD counts on the lab's lane, kind-8 and
// inventory slots. Used for a run whose analyze() phase never ran (the
// n10000-mode0 tracing node died after backfill-128). The scanner mirrors
// ../2026-09-09-files-browser-mvp/scripts/measure/lib/trace.mjs (not exported
// there); attribution and categorisation are that library's own functions.
//   node scripts/salvage-trace.mjs --label n10000-mode0 --ops hook-rebind-field-change,coverage-init
import { createReadStream, readFileSync, existsSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { join, resolve } from 'node:path';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { attributeSteps, categorize } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/gas.mjs';
import { norm } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/trace.mjs';
import { EFS_SLOT, STORE, mapSlot, posting } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/slots.mjs';
import { FIXTURE, nameRole, bindingKey } from '../../2026-09-09-files-reader/index.mjs';
import { LAB } from './lab-fixture.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const LABEL = opt('--label', 'n10000-mode0');
const REF = opt('--ref', 'n1000-mode0'); // run whose environment.json names the deterministic addresses / scope
const OPS = opt('--ops', 'hook-placement-fresh-word,hook-placement-warm-word,hook-placement-second-bucket,hook-remove-clear,hook-restore-set,hook-rebind-field-change,hook-rebind-uncovered,coverage-init,backfill-32,backfill-64,backfill-128').split(',');
const OUT = resolve(LAB, 'evidence/' + LABEL);
const env = JSON.parse(readFileSync(resolve(LAB, 'evidence/' + REF + '/environment.json'), 'utf8'));
const Z = '0x' + '0'.repeat(64);
const hex32 = v => '0x' + v.toString(16).padStart(64, '0');
const MASK = (1n << 256n) - 1n;

// Slot classes of interest (all derived from the reference run's deterministic ids).
const bigScope = env.scopes.bigScope;
const k10 = posting(Z, 10, 0, bigScope);
const classes = new Map();
const put = (slot, cls) => classes.set(hex32(slot & MASK), cls);
put(EFS_SLOT + STORE.bindingKeys + 1n, 'Store.scopeLayout');
put(mapSlot(EFS_SLOT + STORE.postings, k10), 'Posting:k10(big).head');
const k10inner = mapSlot(EFS_SLOT + STORE.postingWords, k10);
for (let w = 0n; w < 2400n; w++) put(mapSlot(k10inner, w), 'Word:k10(big)');
const A = env.addresses.principalA, big = env.addresses.big;
for (const name of ['h-warm', 'h-second', 'e00003', 'h-fresh']) {
  const key = bindingKey(A, FIXTURE.namePurpose, big, nameRole(name));
  const k8 = posting(Z, 8, 0, key);
  put(mapSlot(EFS_SLOT + STORE.postings, k8), 'Posting:k8(' + name + ').head');
  const inner = mapSlot(EFS_SLOT + STORE.postingWords, k8);
  for (let w = 0n; w < 4n; w++) put(mapSlot(inner, w), 'Word:k8(' + name + ')');
}
for (let k = 1n; k <= 30000n; k++) put(mapSlot(EFS_SLOT + STORE.bindingKeys, k), 'BindingKey');
const names = new Map([[env.addresses.hook.toLowerCase(), 'IndexedAdmission (hook)'], [env.addresses.module.toLowerCase(), 'IndexLayerModule'], [env.addresses.core4.toLowerCase(), 'UpgradeableFixtureCoreU4 (impl)'], [env.addresses.core.toLowerCase(), 'Core proxy'], [env.addresses.admissionLibrary.toLowerCase(), 'UpgradeAdmissionLibrary (pinned kernel)']]);

function matchObject(s, start) {
  let depth = 0, inString = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) { if (c === '\\') i++; else if (c === '"') inString = false; }
    else if (c === '"') inString = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
const STORAGE_OPS = new Set(['SSTORE', 'SLOAD']);
const CALL_OPS = new Set(['CALL', 'CALLCODE', 'DELEGATECALL', 'STATICCALL', 'CREATE', 'CREATE2']);

async function load(gzPath) {
  const OP_INDEX = new Map(), OP_NAMES = [];
  const opId = name => { let id = OP_INDEX.get(name); if (id === undefined) { id = OP_NAMES.length; OP_NAMES.push(name); OP_INDEX.set(name, id); } return id; };
  let cap = 1 << 16;
  let pc = new Uint32Array(cap), op = new Uint16Array(cap), gas = new Float64Array(cap), gasCost = new Float64Array(cap), depth = new Uint8Array(cap);
  const storageOps = [], callOps = [];
  let n = 0;
  const grow = () => { cap *= 2; const g = (arr, T) => { const b = new T(cap); b.set(arr); return b; }; pc = g(pc, Uint32Array); op = g(op, Uint16Array); gas = g(gas, Float64Array); gasCost = g(gasCost, Float64Array); depth = g(depth, Uint8Array); };
  const onEntry = (e, i) => {
    if (i >= cap) grow();
    pc[i] = e.pc; op[i] = opId(e.op); gas[i] = Number(e.gas); gasCost[i] = Number(e.gasCost); depth[i] = e.depth;
    const st = e.stack;
    if (STORAGE_OPS.has(e.op)) storageOps.push({ i, op: e.op, depth: e.depth, slot: norm(st ? st[st.length - 1] : null), value: e.op === 'SSTORE' && st ? norm(st[st.length - 2]) : null });
    else if (CALL_OPS.has(e.op)) { const target = st && (e.op === 'CREATE' || e.op === 'CREATE2') ? null : st ? norm(st[st.length - 2]) : null; callOps.push({ i, op: e.op, depth: e.depth, target: target ? '0x' + target.slice(-40) : null }); }
    n = i + 1;
  };
  let buffer = '', phase = 'head', count = 0;
  const decoder = new TextDecoder('utf-8');
  const drain = () => {
    for (;;) {
      if (phase === 'head') { const marker = '"structLogs":['; const at = buffer.indexOf(marker); if (at < 0) return; buffer = buffer.slice(at + marker.length); phase = 'array'; }
      else if (phase === 'array') {
        let i = 0; while (i < buffer.length && (buffer[i] === ',' || buffer[i] === ' ' || buffer[i] === '\n')) i++;
        if (i >= buffer.length) { buffer = ''; return; }
        if (buffer[i] === ']') { phase = 'tail'; buffer = ''; return; }
        const end = matchObject(buffer, i); if (end < 0) { buffer = buffer.slice(i); return; }
        onEntry(JSON.parse(buffer.slice(i, end + 1)), count++); buffer = buffer.slice(end + 1);
      } else return;
    }
  };
  const stream = createReadStream(gzPath).pipe(createGunzip());
  for await (const chunk of stream) { buffer += decoder.decode(chunk, { stream: true }); drain(); }
  buffer += decoder.decode(); drain();
  return { steps: { n, pc: pc.subarray(0, n), op: op.subarray(0, n), gas: gas.subarray(0, n), gasCost: gasCost.subarray(0, n), depth: depth.subarray(0, n), refund: null, opNames: OP_NAMES }, storageOps, callOps };
}

const rows = [];
for (const id of OPS) {
  const dir = join(OUT, id);
  if (!existsSync(join(dir, 'trace.json.gz'))) { console.log('missing', id); continue; }
  const tx = JSON.parse(readFileSync(join(dir, 'tx.json'), 'utf8'));
  const receipt = JSON.parse(readFileSync(join(dir, 'receipt.json'), 'utf8'));
  const trace = await load(join(dir, 'trace.json.gz'));
  const callTargets = new Map(trace.callOps.map(o => [o.i, { op: o.op, target: o.target }]));
  const attribution = attributeSteps(trace.steps, callTargets, tx.to);
  const cats = categorize(trace.steps, attribution, callTargets);
  const byContract = Object.fromEntries(Object.entries(cats.byCode).map(([ad, v]) => [names.get(ad) ?? ad, v.gas]));
  const hookAddr = env.addresses.hook.toLowerCase();
  const reads = {}, hookReads = {};
  let sloads = 0, hookSloads = 0;
  for (const o of trace.storageOps) {
    if (o.op !== 'SLOAD') continue;
    sloads++;
    const ctx = attribution.contexts[attribution.ctxIndex[o.i]];
    const cls = classes.get(o.slot) ?? 'other';
    reads[cls] = (reads[cls] ?? 0) + 1;
    if (ctx === hookAddr) { hookSloads++; hookReads[cls] = (hookReads[cls] ?? 0) + 1; }
  }
  const startGas = trace.steps.gas[0], last = trace.steps.n - 1;
  const gross = startGas - (trace.steps.gas[last] - attribution.consumed[last]);
  rows.push({ op: id, receipt: Number(receipt.gasUsed), status: receipt.status, steps: trace.steps.n, gross, hookSelf: byContract['IndexedAdmission (hook)'] ?? 0, moduleSelf: byContract['IndexLayerModule'] ?? 0, sloads, hookSloads, reads, hookReads });
  console.log(JSON.stringify(rows.at(-1)));
}
console.log('');
console.log('| op | receipt | steps | exec gross | hook self gas | module self gas | SLOADs (all / in hook) | lane & history reads (whole tx) |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |');
for (const r of rows) console.log(`| ${r.op} | ${r.receipt.toLocaleString('en-US')} | ${r.steps.toLocaleString('en-US')} | ${r.gross.toLocaleString('en-US')} | ${r.hookSelf.toLocaleString('en-US')} | ${r.moduleSelf.toLocaleString('en-US')} | ${r.sloads} / ${r.hookSloads} | ${Object.entries(r.reads).filter(([k]) => k !== 'other').map(([k, v]) => k + ' ' + v).join(', ')} |`);
