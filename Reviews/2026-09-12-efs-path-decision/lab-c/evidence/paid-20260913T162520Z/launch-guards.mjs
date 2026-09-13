import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export function assertMaySpawn({ stopped, start, latest, end, now = Date.now() }) {
  if (stopped || !(start <= now && now <= latest && now < end - 5_000)) throw new Error('stopped or outside spawn lease');
}

export function verifyBuild(buildFile, artifactRoot, compiledSource) {
  const build = JSON.parse(readFileSync(buildFile));
  if (build.source !== compiledSource || !build.artifactHashes || Object.keys(build.artifactHashes).length === 0) throw new Error('missing or different compiled source');
  for (const [name, expected] of Object.entries(build.artifactHashes)) {
    if (path.isAbsolute(name) || name.split('/').includes('..') || !/^[a-f0-9]{64}$/.test(expected)) throw new Error('invalid artifact pin');
    const actual = createHash('sha256').update(readFileSync(path.join(artifactRoot, name))).digest('hex');
    if (actual !== expected) throw new Error(`artifact changed: ${name}`);
  }
  return Object.keys(build.artifactHashes).length;
}
