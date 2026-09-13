// Copy an explicit, prechecked evidence set byte-for-byte; no source rewrites.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const scratch = '/tmp/efs-paid-c-run-20260913.YxKavf';
const prep = '/tmp/efs-c-independent-prep-20260913.DM1226';
const destination = '/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c/evidence/paid-20260913T162520Z';
const pairs = [
  ...['measure.json', 'inputs.json', 'launch.mjs', 'launch-guards.mjs', 'launch-guards.test.mjs', 'launch-record.json', 'runner.log', 'anvil.log', 'audit-signed-receipts.mjs', 'signed-receipt-check.json', 'retain-packet.mjs'].map((name) => [path.join(scratch, name), name]),
  ...fs.readdirSync(path.join(scratch, 'controller')).map((name) => [path.join(scratch, 'controller', name), path.join('controller', name)]),
  ...['declaration-map.json', 'declaration-map.mjs', 'derive-inputs.mjs', 'verify-inputs.mjs', 'input-check-map.md', 'reviewed-input-handoff.md'].map((name) => [path.join(prep, name), path.join('preparation', name)]),
  ['/tmp/efs-c-gate-source-review-20260913.md', 'source-review.md'],
  ['/tmp/efs-c-paid-packet-review-20260913.md', 'packet-review.md'],
  ['/tmp/efs-bc-cost-interpretation-20260913.md', 'cost-interpretation.md'],
];
const contents = pairs.map(([source, name]) => ({ source, name, bytes: fs.readFileSync(source) }));
if (fs.existsSync(destination)) throw new Error('destination must be new');
fs.mkdirSync(destination);
const files = [];
for (const { source, name, bytes } of contents) {
  const target = path.join(destination, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { flag: 'wx' });
  if (!bytes.equals(fs.readFileSync(target))) throw new Error(`copy differs: ${name}`);
  files.push({ name, source, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const inventory = { standing: 'Evidence-only retention. Absolute paths are historical run/preparation context; source pin predates this evidence addition. No private test signing keys retained. Replication elsewhere requires remapping retained local paths and rebuilding at the named compiled-source pin.', runId: 'c-paid-20260913T162520552Z', runSource: '58dd3d78e8efa8e4490b035bdde5502b75adc9e3', inputSha256: '16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c', files };
fs.writeFileSync(path.join(destination, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ destination, files: files.length, bytes: files.reduce((s, f) => s + f.bytes, 0) }));
