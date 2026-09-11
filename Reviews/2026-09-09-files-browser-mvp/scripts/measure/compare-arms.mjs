// A/B table between two harness output roots (control vs candidate).
//   node scripts/measure/compare-arms.mjs --a evidence/.../control --b evidence/.../candidate [--md out.md]
// Reads every run*/<op>/analysis.json under each root and pairs ops by id.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const MVP = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const A = resolve(MVP, opt('--a')), B = resolve(MVP, opt('--b')), MD = opt('--md', null);
function load(root) {
  const out = new Map();
  for (const run of readdirSync(root).filter(n => /^run\d+$/.test(n)).sort()) {
    for (const op of readdirSync(join(root, run))) {
      const f = join(root, run, op, 'analysis.json');
      if (!existsSync(f) || !statSync(f).isFile()) continue;
      out.set(op, { run, ...JSON.parse(readFileSync(f, 'utf8')) });
    }
  }
  return out;
}
const a = load(A), b = load(B);
const num = x => Number(x ?? 0);
const fmt = x => num(x).toLocaleString('en-US');
const delta = (x, y) => { const d = num(y) - num(x); return (d >= 0 ? '+' : '') + fmt(d); };
const pct = (x, y) => num(x) ? ((num(y) - num(x)) / num(x) * 100).toFixed(1) + '%' : '';
const rows = [];
for (const [op, ca] of a) {
  const cb = b.get(op); if (!cb) continue;
  const cat = k => [num(ca.categories?.[k]), num(cb.categories?.[k])];
  const fresh = c => num(c.sstore?.writesByClass?.FRESH);
  const typeSload = c => num(c.sload?.byKind?.Type?.gas);
  const typeSlots = c => num(c.sload?.byKind?.Type?.distinctSlots);
  const lib = c => num(c.byContract?.UpgradeAdmissionLibrary?.gas);
  const helper = c => num(c.byContract?.PreparationHelper?.gas);
  rows.push({
    op, receiptA: ca.receiptGasUsed, receiptB: cb.receiptGasUsed,
    freshA: fresh(ca), freshB: fresh(cb),
    sstore: cat('SSTORE'), sload: cat('SLOAD'), code: cat('CODE'), memory: cat('MEMORY'), stack: cat('STACK'), control: cat('CONTROL'), arith: cat('ARITH'), calldata: cat('CALLDATA'), keccak: cat('KECCAK256'), callOverhead: cat('CALL_OVERHEAD'),
    typeSload: [typeSload(ca), typeSload(cb)], typeSlots: [typeSlots(ca), typeSlots(cb)], lib: [lib(ca), lib(cb)], helper: [helper(ca), helper(cb)],
    stepsA: ca.execution?.steps, stepsB: cb.execution?.steps,
  });
}
const lines = [];
lines.push('| op | control receipt (FRESH) | candidate receipt (FRESH) | Δ receipt | Δ % | SLOAD Δ | Type-family SLOAD (slots) A → B | CODE Δ | plumbing Δ (MEMORY+STACK+CONTROL+ARITH+CALLDATA) | SSTORE Δ | admission lib self Δ | steps A → B |');
lines.push('| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |');
for (const r of rows) {
  const plumb = c => c.memory[c] ;
  const pa = r.memory[0] + r.stack[0] + r.control[0] + r.arith[0] + r.calldata[0], pb = r.memory[1] + r.stack[1] + r.control[1] + r.arith[1] + r.calldata[1];
  lines.push(`| ${r.op} | ${fmt(r.receiptA)} (${r.freshA}) | ${fmt(r.receiptB)} (${r.freshB}) | ${delta(r.receiptA, r.receiptB)} | ${pct(r.receiptA, r.receiptB)} | ${delta(r.sload[0], r.sload[1])} | ${fmt(r.typeSload[0])} (${r.typeSlots[0]}) → ${fmt(r.typeSload[1])} (${r.typeSlots[1]}) | ${delta(r.code[0], r.code[1])} | ${delta(pa, pb)} | ${delta(r.sstore[0], r.sstore[1])} | ${delta(r.lib[0], r.lib[1])} | ${fmt(r.stepsA)} → ${fmt(r.stepsB)} |`);
}
const text = lines.join('\n') + '\n';
process.stdout.write(text);
if (MD) writeFileSync(resolve(MVP, MD), text);
