import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { compileUpgrade, withUpgrade } from '../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { keccak256 } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { runFileLifecycle, encodeReport, nonTimingOutcomes } from './workflow.mjs';

const baselineUrl = new URL('./baseline.json', import.meta.url);
const baselineHash = '0x398c1abc743952f3e41d60585d07456b31dcc63630f7df459de994a78f68fa49';

// Breaks: the candidate saves no gas on the actual multi-leaf workload,
// changes retained semantics, or obtains savings by changing workflow/settings.
test('bounded journal improves the frozen multi-leaf baseline with the same lifecycle', { timeout: 300000 }, async t => {
  const original = readFileSync(baselineUrl);
  assert.equal(keccak256(original), baselineHash, 'frozen baseline');
  const baseline = JSON.parse(original);
  compileUpgrade();
  let report, cleanup;
  await withUpgrade(async lab => { cleanup = lab.cleanup; report = await runFileLifecycle(lab); });
  report.cleanup = cleanup;
  assert.equal(cleanup.stopped, true);
  assert.doesNotThrow(() => encodeReport(report));
  assert.deepEqual(nonTimingOutcomes(report), nonTimingOutcomes(baseline));
  assert.deepEqual(report.workflowSourcePins, baseline.workflowSourcePins);
  assert.deepEqual(report.resources.settings, baseline.resources.settings);
  assert.deepEqual(report.resources.inputPins, baseline.resources.inputPins);
  assert.equal(report.resources.compilerBinaryHash, baseline.resources.compilerBinaryHash);
  assert.equal(report.resources.dependencyLockHash, baseline.resources.dependencyLockHash);
  assert.deepEqual(report.resources.supportSourcePins, baseline.resources.supportSourcePins);
  const kernel = '../2026-09-05-c0-core/src/StateKernel.sol';
  const unchanged = pins => Object.fromEntries(Object.entries(pins).filter(([path]) => path !== kernel));
  assert.deepEqual(unchanged(report.resources.sourcePins), unchanged(baseline.resources.sourcePins));
  assert.notEqual(report.resources.sourcePins[kernel], baseline.resources.sourcePins[kernel]);
  for (const phase of ['U1', 'U2']) {
    for (const name of ['create-file-seven-leaf', 'scale-8']) {
      const operation = phase + '/' + name;
      const before = baseline.operations.find(op => op.name === operation);
      const after = report.operations.find(op => op.name === operation);
      assert.equal(after.calldataBytes, before.calldataBytes);
      // A baseline-derived 1% margin is far above the observed 12/24-gas
      // signature/calldata jitter; this is not a universal gas guarantee.
      const ceiling = BigInt(before.gasUsed) * 99n / 100n;
      assert(BigInt(after.gasUsed) <= ceiling, operation + ' must improve measured baseline by at least 1%: ceiling ' + ceiling + ', got ' + after.gasUsed);
    }
  }
  assert.equal(keccak256(readFileSync(baselineUrl)), baselineHash);
  report.comparison = {
    baselineHash,
    comparisonSourcePin: keccak256(readFileSync(new URL(import.meta.url))),
    changedCompilerSources: [kernel],
    minimumMeasuredMultiLeafSavingsPercent: 1,
    scope: 'Local source A/B including pre-existing dirty Binding/read sources; not an entire-branch review or product certification.',
  };
  if (process.env.EFS_FILES_PERF_OPTIMIZED === '1') {
    writeFileSync(new URL('./optimized.json', import.meta.url), encodeReport(report));
  }
  t.diagnostic(JSON.stringify({ operations: report.operations.map(op => [op.name, op.gasUsed]), deployment: report.resources.deployment }));
});
