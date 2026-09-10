// Hostile-input regressions for the OFFLINE export verifier. The 2026-09-10
// data-readiness reconciliation reproduced a counterexample: a fabricated
// bundle (arbitrary bytes, zeroed IDs/basis, evidence:[{}]) was accepted as
// "Clean offline verification". These tests pin the CLI contract: the
// verifier must reject fabricated and tampered bundles and must never claim
// authenticity it did not check. Each case runs the real script as a child
// process on a real file — no import hooks, no monkey-patching.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VERIFIER = new URL('../scripts/verify-export.mjs', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'efs-export-hostile-'));
test.after(() => rmSync(dir, { recursive: true, force: true }));

function run(bundle, name) {
  const path = join(dir, name + '.json');
  writeFileSync(path, JSON.stringify(bundle));
  try {
    const stdout = execFileSync(process.execPath, [VERIFIER, path], { encoding: 'utf8' });
    return { code: 0, stdout };
  } catch (e) { return { code: e.status, stdout: (e.stdout ?? '') + (e.stderr ?? '') }; }
}

// The exact fabricated shape from the reconciliation review (V0 kind): bytes
// nobody ever committed, zeroed basis/IDs, a dummy evidence entry.
const FABRICATED_V0 = {
  kind: 'EFS_FILES_EXPORT_V0', pathLabel: '/synthetic', coverage: 'COMPLETE',
  basis: { blockNumber: 1, chainId: 31337, blockHash: '0x' + '0'.repeat(64), executionSetId: '0x' + '0'.repeat(64) },
  rows: [{ kind: 'FILE', name: 'fabricated.bin', nodeId: 'fake' }],
  files: { fake: { integrity: 'VERIFIED', bytes: '0xdeadbeef', revisionId: '0x' + '0'.repeat(64) } },
  evidence: [{}],
};

// The same fabrication wearing the CURRENT envelope, so it reaches the real
// checks instead of stopping at the version gate.
const FABRICATED_V1 = { ...FABRICATED_V0, kind: 'EFS_FILES_EXPORT_V1' };

test('the V0 envelope is refused as unverifiable', () => {
  const { code, stdout } = run(FABRICATED_V0, 'legacy-envelope');
  assert.notEqual(code, 0);
  assert.match(stdout, /predate the authenticated format/);
});

test('fabricated bundle is refused by the real checks, not certified', () => {
  const { code, stdout } = run(FABRICATED_V1, 'fabricated');
  assert.notEqual(code, 0, 'fabricated bytes/zeroed basis must NOT verify cleanly:\n' + stdout);
  assert(!/predate the authenticated format/.test(stdout), 'must reach the real checks, not the envelope gate');
  assert.match(stdout, /FAIL/, 'a substantive check must fail');
  assert(!/Clean offline verification/.test(stdout), 'must not print the clean-verification claim');
});

test('nonsense with a valid-looking envelope is refused', () => {
  const { code } = run({
    ...FABRICATED_V1,
    files: { fake: { integrity: 'VERIFIED', bytes: '0x' + 'ab'.repeat(5000), revisionId: '0x' + '1'.repeat(64) } },
  }, 'nonsense');
  assert.notEqual(code, 0, 'arbitrary multikilobyte bytes with an unrelated revision id must not verify');
});

test('empty evidence and zeroed execution set are not "retained evidence"', () => {
  const { code } = run({ ...FABRICATED_V1, evidence: [{}, {}, {}] }, 'dummy-evidence');
  assert.notEqual(code, 0, 'dummy evidence entries must not count as retained evidence');
});
