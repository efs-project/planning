// Freeze only the exact reviewed pre-extraction source and compiler artifacts.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, statfsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(commit, 'ebc7d540570827c5f5052af83d2cbd80f54092a7');
const disk = statfsSync('.'); assert(disk.bavail * disk.bsize > 20 * 1024 ** 3);
const build = mkdtempSync(join(tmpdir(), 'efs21-posting-control-build-'));
process.env.EFS_TEST_BUILD_ROOT = build;
const { compileUpgrade } = await import('../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
const { compileRouter } = await import('../../2026-09-09-files-browser-mvp/test/router-fixture.mjs');
compileUpgrade(); compileRouter();
const artifacts = {}, sources = {};
const roots = [['Reviews/2026-09-09-files-browser-mvp/contracts', join(build, 'router/out')], ['Reviews/2026-09-08-upgradeable-foundation', join(build, 'foundation/out')]];
for (const name of ['UpgradeableFixtureCoreU3', 'UpgradeableFixtureCarrierU3', 'UpgradeableReadFixtureCore', 'UpgradeableReadFixtureCoreU2', 'UpgradeAdmissionLibrary', 'PreparationHelper', 'PointReadLibrary', 'UpgradeQueryReadLibrary', 'FilesRouterV2', 'FixtureDeployment', 'TransparentUpgradeableProxy', 'ProxyAdmin']) {
  let found = false;
  for (const [root, out] of roots) {
    for (const path of readdirSync(out, { recursive: true }).filter(p => p.endsWith('/' + name + '.json'))) {
      const a = JSON.parse(readFileSync(join(out, path)));
      if (!Object.entries(a.metadata.sources).every(([p, m]) => keccak256(readFileSync(resolve(root, p))) === m.keccak256)) continue;
      for (const [p, m] of Object.entries(a.metadata.sources)) sources[root + ':' + p] = { keccak256: m.keccak256, content: readFileSync(resolve(root, p), 'utf8') };
      artifacts[name] = { root, abi: a.abi, bytecode: a.bytecode, deployedBytecode: a.deployedBytecode, metadata: a.metadata, methodIdentifiers: a.methodIdentifiers };
      found = true; break;
    }
    if (found) break;
  }
  assert(found, 'current source artifact: ' + name);
}
const canonical = Buffer.from(JSON.stringify({ commit, sources, artifacts }) + '\n');
const compressed = gzipSync(canonical, { mtime: 0 });
const result = { format: 'EFS21_POSTING_CONTROL_GZIP_BASE64_V1', commit,
  canonical: { bytes: canonical.length, keccak256: keccak256(canonical) },
  compressed: { bytes: compressed.length, keccak256: keccak256(compressed) },
  sizes: Object.fromEntries(Object.entries(artifacts).map(([name, a]) => [name, (a.deployedBytecode.object.length - 2) / 2])),
  gzipBase64: compressed.toString('base64') };
writeFileSync('Reviews/2026-09-11-efs21-pragmatic/evidence/posting-control-sources.json', JSON.stringify(result) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ build, commit, sourcePins: Object.keys(sources).length, sizes: result.sizes, canonical: result.canonical }));
