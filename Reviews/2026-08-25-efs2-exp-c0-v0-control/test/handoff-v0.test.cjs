'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const controlRoot = path.resolve(__dirname, '..');
const planningRoot = path.resolve(controlRoot, '../..');
const handoff = JSON.parse(fs.readFileSync(path.join(controlRoot, 'handoff-v0.json'), 'utf8'));
const coverage = JSON.parse(fs.readFileSync(path.join(controlRoot, 'trace-coverage.json'), 'utf8'));

test('build handoff is explicitly disposable and cannot imply freeze or deployment authority', () => {
  assert.equal(handoff.format, 'efs2-exp-c0-v0-build-handoff/0');
  assert.equal(handoff.protocolConformance, false);
  assert.equal(handoff.durable, false);
  assert.equal(handoff.productionReady, false);
  assert.equal(handoff.deploymentAuthorized, false);
  assert.equal(handoff.freezeAuthorized, false);
  assert.equal(handoff.exactExecutableTraceReplayCount, 0);
  assert.equal(handoff.exactExecutableTraceReplayCount, coverage.exactExecutableTraceReplayCount);
});

test('every pinned handoff vector exists and matches its independent SHA-256 lock', () => {
  for (const vector of handoff.pinnedVectors) {
    const bytes = fs.readFileSync(path.resolve(planningRoot, vector.path));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), vector.sha256, vector.path);
  }
});

test('handoff names the sealed corpus, complete raw collection surface, and one owner choice', () => {
  const seal = JSON.parse(fs.readFileSync(path.resolve(planningRoot, handoff.semanticSeal.path), 'utf8'));
  const traceCount = seal.traceGroups.flatMap((group) => group.traces).length;
  assert.equal(traceCount, handoff.semanticSeal.traceCount);
  assert.equal(handoff.selectedCandidateLaws.collectionCount, 28);
  assert.equal(
    handoff.selectedCandidateLaws.typeEnvelope,
    'RAW_PRESERVING_UINT16_CODEC_BYTES_PAYLOAD',
  );
  assert.ok(
    handoff.pinnedVectors.some(({ path: vectorPath }) => (
      vectorPath === 'Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/type-envelope-v0.json'
    )),
    'raw-preserving Type envelope corpus is not pinned',
  );
  assert.ok(
    handoff.verificationCommands.includes('node --check scripts/build-type-envelope-vector.cjs'),
    'Type envelope corpus generator is not part of the handoff verification',
  );
  assert.ok(
    handoff.verificationCommands.includes('node --test test/type-interpreter-vector-generator.test.cjs'),
    'Type-interpreter independent regeneration control is not part of the handoff verification',
  );
  assert.ok(
    handoff.pinnedVectors.some(({ path: vectorPath }) => (
      vectorPath === 'Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json'
    )),
    'clean-room consumer contract is not pinned',
  );
  assert.ok(
    handoff.verificationCommands.includes('node --test test/consumer-contract-v0.test.cjs'),
    'clean-room consumer test is not part of the handoff verification',
  );
  assert.ok(
    handoff.verificationCommands.includes('node --check scripts/build-consumer-contract.cjs'),
    'clean-room consumer generator is not part of the handoff verification',
  );
  assert.deepEqual(handoff.ownerDecisionsBeforeCandidateCode, [
    'GO_CODE_NONDEPLOYABLE_REPLACEABLE_CANDIDATE',
  ]);
  assert.deepEqual(handoff.delegatedCandidateDefaults, [
    'FIRST_PRODUCT_RAW_GUEST_EXPLORER_PLUS_MINIMUM_FILES',
  ]);
});

test('serialized clean-room consumer contract is byte-for-byte current with its generator', () => {
  const generated = execFileSync(
    process.execPath,
    [path.join(controlRoot, 'scripts/build-consumer-contract.cjs')],
    { encoding: 'utf8' },
  );
  assert.equal(generated, fs.readFileSync(path.join(controlRoot, 'consumer-contract-v0.json'), 'utf8'));
});
