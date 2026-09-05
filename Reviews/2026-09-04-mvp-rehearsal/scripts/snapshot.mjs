// Content pin for a local evidence checkpoint; not a protocol ID or attestation.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
async function walk(directory) {
  const entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await walk(path));
    else if (entry.isFile()) result.push(path);
    else throw new Error(`Unexpected evidence input: ${path}`);
  }
  return result;
}
async function hashes(paths) {
  return Promise.all(paths.sort().map(async path => ({ path,
    sha256: createHash('sha256').update(await readFile(new URL(path, root))).digest('hex') })));
}
const paths = ['package.json', 'package-lock.json', 'foundry.toml'];
for (const directory of ['src', 'consumer', 'sdk', 'web', 'scripts', 'test', 'test-sol']) paths.push(...await walk(directory));
const sourceFiles = await hashes(paths);
const artifactFiles = await hashes(['artifacts/browser-results.json', 'artifacts/measurements.json',
  'artifacts/files-desktop.png', 'artifacts/files-mobile.png', 'artifacts/data-desktop.png', 'artifacts/arcade-desktop.png']);
const snapshot = { kind: 'local source and output inventory, not C0 identity or signed attestation',
  profile: 'efs-lab/1', generatedAt: new Date().toISOString(), sourceFiles, artifactFiles,
  sourceTreeSha256: createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex') };
await writeFile(new URL('artifacts/source-manifest.json', root), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Pinned ${sourceFiles.length} source inputs and ${artifactFiles.length} outputs: ${snapshot.sourceTreeSha256}`);
