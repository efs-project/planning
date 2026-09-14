// File-only mechanical retention. Never imports model code or launches processes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const model = path.dirname(here);
const workspace = path.resolve(model, '../../../../..');
const run = process.argv[2];
assert.equal(run, '/tmp/efs-b-archive-task1.OXPOfb', 'exact retained run root');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const shared = {
  'reference.mjs': '407af262140a32aa1ac068353fea4c61620ce013e5f60b50fed0add1c0d4eaa5',
  'fixtures.mjs': 'f003a31b1cd770d5e39d20fd966005bd36582a5cb1519691b0c5fc019f619288',
  'model.test.mjs': '210e6226c43b8fc10b3cd82565eac2588c40b77862a42bdfeef4ce6dddc7c344',
};
const candidate = {
  red: '8e76ac7675cdaf3322b5cfd97b3f03a24c087641aadbcc9c65a9fbaab0efb8d6',
  green: '452703b70608ef53294a9f1ad4172b299f2798c71996b73d1bbbbeaecc77605e',
};
const copies = [];
for (const phase of ['red', 'green']) {
  for (const [name, digest] of Object.entries({ ...shared, 'candidate.mjs': candidate[phase] })) {
    copies.push([`source-${phase}/${name}`, path.join(run, `live-placement-${phase}.source`, name), digest]);
  }
}
copies.push(
  ['live-placement-red.json', path.join(run, 'live-placement-red.json'), 'bd2fb1d074963f87594b60032883be7b1c3e6580c5dead059bbbe0f0374d6a59'],
  ['live-placement-green.json', path.join(run, 'live-placement-green.json'), 'def1cd59523d4c48c5a8f7eecdfc3e87844e1d7d12358e5ff82442e2d48d56d7'],
  ['run-live-placement-model.mjs', path.join(run, 'run-live-placement-model.mjs'), '9198c7dfed69e2107e9058590dd7b0bb33791d35710b2a843bccfeb3a10c7bb5'],
  ['source-review.md', path.resolve(run, '../efs-live-candidate-index-review-20260914.md'), 'baddbc836b2d7e5778323283c2cf5a934ac3c954694048b75c7a7324f0c1ff64'],
  ['independent-review.md', path.resolve(run, '../efs-b-live-placement-model-review-20260914.md'), '1999b72fe6ba4bfe15d38376b865f9e573bf52a38ddaafdb1e353651781aad61'],
  ['main-plan.md', path.resolve(workspace, '../planning/Reviews/2026-09-12-efs-path-decision/live-placement-model-plan-20260914.md'), '384cc6c90e5c14c7b50b9d953da10968f0d7dfd0e29a1193bb28b7345bc3c010'],
  ['task-1-report.md', path.join(workspace, '.superpowers/sdd/live-placement-model-plan-20260914/task-1-report.md'), 'af7d93efa67f57f9b71d3367e1f3c0353bb23ade825920e87f8aae28ad628e88'],
);

// Validate every source and destination before writing the first copy.
assert.equal(fs.existsSync(path.join(here, 'manifest.json')), false, 'new packet only');
let inputBytes = 0;
const loaded = copies.map(([name, source, expected]) => {
  assert.equal(fs.existsSync(path.join(here, name)), false, `refuse overwrite: ${name}`);
  const bytes = fs.readFileSync(source);
  assert.ok(bytes.length < 256 * 1024, `per-file cap: ${name}`);
  assert.equal(sha(bytes), expected, `source pin: ${name}`);
  inputBytes += bytes.length;
  return { name, bytes, expected };
});
assert.ok(inputBytes < 1024 * 1024, 'compact packet cap');
for (const [name, digest] of Object.entries({ ...shared, 'candidate.mjs': candidate.green })) {
  assert.equal(sha(fs.readFileSync(path.join(model, name))), digest, `active source unchanged: ${name}`);
}
for (const { name, bytes } of loaded) {
  const target = path.join(here, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { flag: 'wx' });
}
const names = [...loaded.map(x => x.name), 'README.md', 'retain-evidence.mjs'].sort();
const files = names.map(name => {
  const bytes = fs.readFileSync(path.join(here, name));
  const expected = loaded.find(x => x.name === name)?.expected;
  if (expected) assert.equal(sha(bytes), expected, `retained copy: ${name}`);
  return { path: name, bytes: bytes.length, sha256: sha(bytes) };
});
assert.equal(files.length, 17);
const manifest = Buffer.from(JSON.stringify({ schema: 'efs-live-placement-evidence-1',
  status: 'CLOSED: GREEN 13/13; independent SpecCompliant / QualityApproved',
  sourceUnchangedExceptCandidateBetweenRedAndGreen: true,
  packetFileCountIncludingManifest: 18, hashedFileCountExcludingManifest: files.length,
  payloadBytesExcludingManifest: files.reduce((n, file) => n + file.bytes, 0), files }, null, 2) + '\n');
fs.writeFileSync(path.join(here, 'manifest.json'), manifest, { flag: 'wx' });
console.log(JSON.stringify({ packetFiles: 18, payloadBytesExcludingManifest: files.reduce((n, file) => n + file.bytes, 0),
  totalBytesIncludingManifest: files.reduce((n, file) => n + file.bytes, 0) + manifest.length,
  manifestBytes: manifest.length, manifestSHA256: sha(manifest), files }, null, 2));
