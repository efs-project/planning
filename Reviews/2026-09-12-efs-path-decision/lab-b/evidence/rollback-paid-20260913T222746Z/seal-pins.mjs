import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const run = '/tmp/efs-b-controls-paid-20260913.00DzB4';
const repo = '/Users/james/Code/EFS/planning-warroom-b-run';
const oracle = '/Users/james/Code/EFS/planning-warroom-oracle';
const prefix = 'Reviews/2026-09-12-efs-path-decision';
const artifacts = '/tmp/efs-b-rollback-build-20260913.Ps480X/green-out';
const expectations = `${run}/expectations-node26.json`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const expectedSource = process.argv[2];
assert(/^[0-9a-f]{40}$/.test(expectedSource), 'reviewed exact B commit required');
assert.equal(git(repo, ['rev-parse', 'HEAD']), expectedSource);
assert.equal(git(repo, ['status', '--porcelain', '--untracked-files=no']), '');
assert.equal(git(oracle, ['rev-parse', 'HEAD']), '3dfd9758fd7be860faa2ebab178521965bd3b67e');
assert.equal(git(oracle, ['status', '--porcelain', '--untracked-files=no']), '');
assert.equal(hash(readFileSync(expectations)), '0b26e6d2a0037de6f89089eece41cbb1174a76eb87e8de945d9c599bf8b28622');
const prepared = JSON.parse(readFileSync(expectations));
const green = JSON.parse(readFileSync('/tmp/efs-b-rollback-build-20260913.Ps480X/green.json'));
const files = {};
for (const [path, sha] of Object.entries(green.sourceHashes)) {
  if (!path.endsWith('.sol') && path !== 'foundry.toml') continue;
  const full = `${repo}/${prefix}/lab-b/${path}`;
  assert.equal(hash(readFileSync(full)), sha, `compiled source differs: ${path}`);
  files[full] = sha;
}
for (const [path, sha] of Object.entries(prepared.source.artifactSha256)) {
  assert.equal(hash(readFileSync(path)), sha, `artifact differs: ${path}`); files[path] = sha;
}
for (const path of [expectations, `${run}/launch.mjs`, `${run}/reproduce-inputs.mjs`, `${run}/seal-pins.mjs`, '/tmp/efs-b-control-independent-prep-20260913.i4vLAa/prepare.mjs', '/tmp/efs-b-control-independent-prep-20260913.i4vLAa/audit.mjs', '/tmp/efs-b-control-independent-prep-20260913.i4vLAa/audit-assumptions.md', `${repo}/${prefix}/lab-b/script/rollback-control.mjs`, `${repo}/${prefix}/lab-b/script/rollback-control.test.mjs`, `${oracle}/${prefix}/lab-oracle/paid-runtime-b.mjs`, '/tmp/efs-b-controls-launch-review-20260913.md', '/tmp/efs-b-control-prep-review-20260913.md', '/tmp/efs-b-control-runner-review-20260913.md', '/tmp/efs-b-control-audit-review-20260913.md']) files[path] = hash(readFileSync(path));
const pins = { source: expectedSource, oracle: git(oracle, ['rev-parse', 'HEAD']), artifacts, expectations, files, scratchRoots: [run, '/tmp/efs-b-rollback-build-20260913.Ps480X', '/tmp/efs-b-parity-build-20260913.lcAzU1', '/tmp/efs-b-parity-paid-20260913.KJ23qU', '/tmp/efs-c-readiness-build-20260913.NoPDle', '/tmp/efs-paid-c-run-20260913.YxKavf', '/tmp/efs-b-parity-inputs-20260913.AHqH23', '/tmp/efs-b-control-independent-prep-20260913.i4vLAa'] };
writeFileSync(`${run}/pins.json`, JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ source: pins.source, oracle: pins.oracle, files: Object.keys(files).length, sha256: hash(readFileSync(`${run}/pins.json`)) }));
