import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assertMaySpawn, verifyBuild } from './launch-guards.mjs';

test('spawn requires current lease and reserves termination grace', () => {
  const lease = { stopped: false, start: 100, latest: 1000, end: 7000, now: 900 };
  assert.doesNotThrow(() => assertMaySpawn(lease));
  for (const change of [{ stopped: true }, { now: 99 }, { now: 1001 }, { latest: 6000, now: 2000 }]) assert.throws(() => assertMaySpawn({ ...lease, ...change }), /spawn lease/);
});

test('build verification refuses changed artifacts and incorrect source', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'efs-c-launch-guard-test-'));
  const artifact = path.join(dir, 'artifact.json');
  const build = path.join(dir, 'build.json');
  writeFileSync(artifact, 'exact artifact');
  writeFileSync(build, JSON.stringify({ source: 'pinned', artifactHashes: { 'artifact.json': createHash('sha256').update('exact artifact').digest('hex') } }));
  assert.equal(verifyBuild(build, dir, 'pinned'), 1);
  assert.throws(() => verifyBuild(build, dir, 'other'), /compiled source/);
  writeFileSync(artifact, 'changed artifact');
  assert.throws(() => verifyBuild(build, dir, 'pinned'), /artifact changed/);
});
