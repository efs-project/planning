// Run-local artifact assembly only: no candidate fixture/output imports, no RPC.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = dirname(fileURLToPath(import.meta.url));
const workspace = '/Users/james/Code/EFS/planning-warroom-b-run';
const lab = join(workspace, 'Reviews/2026-09-12-efs-path-decision/lab-b');
const buildRoot = '/tmp/efs-paid-b-build-20260913.EK7l5n';
const oracle = '/Users/james/Code/EFS/planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle';
const neutral = '/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/paid-neutral-expectations.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = path => sha(readFileSync(path));
const preparedPath = join(buildRoot, 'prepared-b.json');
assert.equal(hashFile(preparedPath), 'b376395b4e52fa16f8a530b7ffdc8b4abb36b7313245a919f6b393c6dbca191d');
const prepared = JSON.parse(readFileSync(preparedPath));
assert.equal(hashFile(neutral), prepared.expectationsSha256);
for (const [name, hash] of Object.entries(prepared.authoringModules)) assert.equal(hashFile(join(oracle, name)), hash, name);
for (const [name, hash] of Object.entries(prepared.sourceHashes)) {
  if (name.endsWith('.sol')) assert.equal(hashFile(join(lab, name)), hash, `Solidity changed: ${name}`);
}
assert.equal(hashFile(join(lab, 'foundry.toml')), prepared.foundryConfigSha256);
for (const artifact of Object.values(prepared.artifactFiles)) {
  assert.equal(hashFile(join(buildRoot, 'out', artifact.relative)), artifact.sha256, artifact.relative);
}
const git = args => execFileSync('git', args, { cwd: workspace, encoding: 'utf8' });
const commit = git(['rev-parse', 'HEAD']).trim();
assert.match(commit, /^[0-9a-f]{40}$/);
const expectedCommit = process.argv[2];
assert.equal(commit, expectedCommit, 'explicit reviewed source commit is required');
const diff = git(['diff', 'HEAD', '--binary']);
assert.equal(diff.length, 0, 'tracked source must be clean at seal');
const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'Reviews/2026-09-12-efs-path-decision/lab-b']);
assert.equal(untracked.length, 0, 'untracked candidate files must be resolved before seal');
const sourceHashes = {};
for (const dir of ['src', 'test', 'script']) {
  for (const name of readdirSync(join(lab, dir)).sort()) sourceHashes[`${dir}/${name}`] = hashFile(join(lab, dir, name));
}
const arm = {
  schema: 'efs-paid-arm/1', runId: 'b-paid-20260913-Kf4SOz', chainId: 31337,
  expectationsSha256: prepared.expectationsSha256,
  retentionDir: join(run, 'independent-observations'),
  source: { commit, dirtyDiffSha256: sha(diff), sourceHashes }, build: prepared.build,
  plannedCells: ['joined/paid-slice'], firstCell: 'joined/paid-slice',
  inputs: prepared.inputs, targets: prepared.targets, initial: prepared.initial,
  checkpoint: prepared.checkpoint, checks: prepared.checks, localDependencies: [],
  preparation: { preparedSha256: hashFile(preparedPath), compiledSourceCommit: prepared.compiledSourceCommit,
    authoringModules: prepared.authoringModules, assembledAt: new Date().toISOString(),
    grade: 'PRE_RUN_EXPECTATIONS; NOT DEPLOYED, NOT A STATE PROOF',
    unverified: prepared.unverified },
};
const armPath = join(run, 'arm-b.json');
writeFileSync(armPath, `${JSON.stringify(arm, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ runId: arm.runId, source: commit,
  controller: `${join(oracle, 'paid-controller.mjs')}:${prepared.authoringModules['paid-controller.mjs']}`,
  expectations: `${neutral}:${prepared.expectationsSha256}`,
  armInput: `${armPath}:${hashFile(armPath)}`,
  targetCount: Object.keys(arm.targets).length,
  beforeChecks: arm.checks.beforeFixture.length, afterChecks: arm.checks.afterB1.length,
}, null, 2));
