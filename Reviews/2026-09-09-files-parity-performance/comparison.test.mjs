import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { compileUpgrade, withUpgrade } from '../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { keccak256 } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { runFileLifecycle, encodeReport, nonTimingOutcomes } from './workflow.mjs';

const baselineUrl = new URL('./baseline.json', import.meta.url);
const baselineHash = '0x398c1abc743952f3e41d60585d07456b31dcc63630f7df459de994a78f68fa49';
const runnerSource = 'scripts/local-upgrade.mjs';
const frozenRunnerPin = '0x2f342d5b9ea5d3030c57fa5d6f4fbe4b8e6cf702dde2ad2f2ff3162aa930e28a';
const integratedRunnerPin = '0x237fd0a47dd66172e5bba919adfd2fc6328866fde3918e7fb0daf1048b2cb1a9';

function checkSupportPins(candidate, baseline) {
  assert.equal(baseline[runnerSource], frozenRunnerPin, 'frozen runner source');
  assert.deepEqual(Object.keys(candidate).sort(),Object.keys(baseline).sort(),'exact support source inventory');
  assert([frozenRunnerPin,integratedRunnerPin].includes(candidate[runnerSource]),'explicitly pinned runner version');
  for(const source of Object.keys(baseline)) {
    if(source !== runnerSource)assert.equal(candidate[source],baseline[source],'unchanged support source '+source);
  }
}

// Break: silently accepting arbitrary runner code or dropping any other pin.
test('support-pin policy accepts only the frozen and reviewed runner versions', () => {
  const baseline = JSON.parse(readFileSync(baselineUrl)).resources.supportSourcePins;
  assert.equal(baseline[runnerSource], frozenRunnerPin);
  for(const approved of [frozenRunnerPin, integratedRunnerPin]) {
    assert.doesNotThrow(() => checkSupportPins({...baseline,[runnerSource]:approved},baseline));
  }
});
test('support-pin policy rejects unapproved missing extra and changed sources', async t => {
  const baseline = JSON.parse(readFileSync(baselineUrl)).resources.supportSourcePins;
  const cases = {
    'unapproved runner': pins => {pins[runnerSource]='0x'+'ff'.repeat(32);},
    'missing runner': pins => {delete pins[runnerSource];},
    'missing support key': pins => {delete pins['reference/upgrade-reader.mjs'];},
    'extra support key': pins => {pins['unreviewed.mjs']=frozenRunnerPin;},
    'changed non-runner pin': pins => {pins['reference/upgrade-reader.mjs']=frozenRunnerPin;},
  };
  for(const [name,mutate] of Object.entries(cases))await t.test(name,()=>{
    const pins={...baseline,[runnerSource]:integratedRunnerPin};mutate(pins);assert.throws(()=>checkSupportPins(pins,baseline));
  });
});

// Base-profile regression after the separately pinned runner integration. The
// frozen reports remain the original journal A/B, not a newly isolated A/B here.
// Breaks: losing journal savings or changing lifecycle/workflow/settings/pins.
test('base-profile regression retains frozen journal gains after runner integration', { timeout: 300000 }, async t => {
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
  checkSupportPins(report.resources.supportSourcePins, baseline.resources.supportSourcePins);
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
    changedSupportSources: report.resources.supportSourcePins[runnerSource] === frozenRunnerPin ? [] : [runnerSource],
    runnerPinPolicy: { source: runnerSource, frozen: frozenRunnerPin, integrated: integratedRunnerPin },
    originalComparisonBoundary: 'Frozen baseline.json and optimized.json retain their original source-pinned journal A/B; this current run is base-profile regression after runner integration.',
    minimumMeasuredMultiLeafSavingsPercent: 1,
    scope: 'Base-profile regression against the frozen multi-leaf baseline after explicit runner integration; not a newly isolated journal-only A/B, entire-branch review or product certification.',
  };
  if (process.env.EFS_FILES_PERF_OPTIMIZED === '1') {
    writeFileSync(new URL('./optimized.json', import.meta.url), encodeReport(report));
  }
  t.diagnostic(JSON.stringify({ operations: report.operations.map(op => [op.name, op.gasUsed]), deployment: report.resources.deployment }));
});
