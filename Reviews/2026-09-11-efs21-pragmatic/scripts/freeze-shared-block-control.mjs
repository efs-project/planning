// Read-only source/artifact snapshot printer. The caller retains its output exclusively.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (commit !== '8688d5299eac8d9f83264806c32de471f427bbb2') throw Error('exact control only');
const artifacts = {}, sources = {};
const roots = ['Reviews/2026-09-09-files-browser-mvp/contracts', 'Reviews/2026-09-08-upgradeable-foundation'];
for (const name of ['UpgradeableFixtureCoreU3', 'UpgradeableFixtureCarrierU3', 'UpgradeAdmissionLibrary', 'PreparationHelper', 'PointReadLibrary', 'UpgradeQueryReadLibrary', 'FilesRouterV2', 'FixtureDeployment', 'TransparentUpgradeableProxy', 'ProxyAdmin']) {
  let found = false;
  for (const root of roots) {
    for (const path of readdirSync(root + '/out', { recursive: true }).filter(p => p.endsWith('/' + name + '.json'))) {
      let a;
      try {
        a = JSON.parse(readFileSync(join(root, 'out', path)));
        if (!Object.entries(a.metadata.sources).every(([p, m]) => keccak256(readFileSync(resolve(root, p))) === m.keccak256)) continue;
      } catch { continue; }
      for (const [p, m] of Object.entries(a.metadata.sources)) sources[root + ':' + p] = { keccak256: m.keccak256, content: readFileSync(resolve(root, p), 'utf8') };
      artifacts[name] = { root, abi: a.abi, bytecode: a.bytecode, deployedBytecode: a.deployedBytecode, metadata: a.metadata, methodIdentifiers: a.methodIdentifiers };
      found = true; break;
    }
    if (found) break;
  }
  if (!found) throw Error('no current source artifact: ' + name);
}
const canonical = Buffer.from(JSON.stringify({ commit, sources, artifacts }) + '\n');
const compressed = gzipSync(canonical, { mtime: 0 });
console.log(JSON.stringify({ format: 'EFS21_SHARED_BLOCK_CONTROL_GZIP_BASE64_V1', commit,
  canonical: { bytes: canonical.length, keccak256: keccak256(canonical) },
  compressed: { bytes: compressed.length, keccak256: keccak256(compressed) },
  sizes: Object.fromEntries(Object.entries(artifacts).map(([name, a]) => [name, (a.deployedBytecode.object.length - 2) / 2])),
  gzipBase64: compressed.toString('base64') }));
