const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const controlRoot = path.resolve(__dirname, '..');
const manifestPath = path.resolve(controlRoot, '../2026-08-23-efs2-exp-c0-semantic-seal/trace-manifest.json');
const coveragePath = path.resolve(controlRoot, 'trace-coverage.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

test('every one of the 61 sealed traces has one honest executable-status disposition', () => {
  const manifestIds = manifest.traceGroups.flatMap((group) => group.traces.map((trace) => trace.id)).sort();
  const coverageIds = coverage.traces.map((trace) => trace.id).sort();
  assert.equal(new Set(manifestIds).size, 61);
  assert.equal(new Set(coverageIds).size, coverageIds.length);
  assert.deepEqual(coverageIds, manifestIds);
});

test('coverage vocabulary cannot overstate executable evidence', () => {
  const legal = new Set(['EXECUTABLE_CONTROL', 'ENCODING_VECTOR', 'DESIGN_ONLY']);
  for (const trace of coverage.traces) {
    assert.ok(legal.has(trace.status), `${trace.id}: illegal status`);
    assert.ok(Array.isArray(trace.evidence) && trace.evidence.length > 0, `${trace.id}: missing evidence/rationale`);
  }
  const executable = coverage.traces.filter((trace) => trace.status === 'EXECUTABLE_CONTROL');
  assert.ok(executable.length >= 20, `only ${executable.length} executable controls`);
  assert.equal(coverage.protocolConformance, false);
  assert.equal(coverage.allTraceVectorBundlesComplete, false);
});
