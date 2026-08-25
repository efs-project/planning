'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  ENUMS,
  commitResultV0,
  decodeMutationPayload,
  decodeResultV0,
  encodeResultV0,
  validateResultV0,
} = require('../src/result-v0.cjs');

const controlRoot = path.resolve(__dirname, '..');
const vectorPath = path.resolve(controlRoot, 'vectors/result-v0.json');
const builderPath = path.resolve(controlRoot, 'scripts/build-result-vector.cjs');
const pinned = JSON.parse(fs.readFileSync(vectorPath, 'utf8'));
const MAX_U64 = (1n << 64n) - 1n;

test('independent ResultV0 builder reproduces the pinned three-vector bundle', () => {
  const emitted = execFileSync(process.execPath, [builderPath], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(emitted), pinned);
  assert.equal(pinned.protocolConformance, false);
  assert.equal(pinned.durable, false);
  assert.deepEqual(pinned.vectors.map(({ id }) => id), [
    'RESULT_POINT_FOUND_V0',
    'RESULT_MUTATION_REJECTED_SAME_ROOT_V0',
    'RESULT_BOOTSTRAP_COMMITTED_CHANGING_ROOT_V0',
  ]);
});

test('implementation decodes and byte-exactly reencodes every independently pinned ResultV0', () => {
  const expectedKinds = [ENUMS.kind.POINT, ENUMS.kind.MUTATION, ENUMS.kind.MUTATION];
  const expectedPayloadKinds = [ENUMS.payloadKind.POINT, ENUMS.payloadKind.MUTATION, ENUMS.payloadKind.MUTATION];
  for (let index = 0; index < pinned.vectors.length; index += 1) {
    const vector = pinned.vectors[index];
    const decoded = decodeResultV0(vector.encoded);
    assert.deepEqual(validateResultV0(decoded), [], vector.id);
    assert.equal(encodeResultV0(decoded), vector.encoded, vector.id);
    assert.equal(commitResultV0(decoded), vector.commitment, vector.id);
    assert.equal(decoded.kind, expectedKinds[index], vector.id);
    assert.equal(decoded.payload.payloadKind, expectedPayloadKinds[index], vector.id);
  }
});

test('pinned rejection and bootstrap vectors retain opposite root relations', () => {
  const rejected = pinned.vectors[1];
  assert.equal(rejected.receipt.beforeProjectionRoot, rejected.receipt.afterProjectionRoot);
  assert.equal(rejected.effect, 'NOT_COMMITTED_PROVEN');

  const bootstrap = pinned.vectors[2];
  assert.notEqual(bootstrap.receipt.beforeProjectionRoot, bootstrap.receipt.afterProjectionRoot);
  assert.equal(bootstrap.effect, 'COMMITTED');
});

test('pinned vectors exercise max uint64 and honest optional receipt operation identity', () => {
  assert.deepEqual(pinned.uint64Boundary, {
    jsonEncoding: 'CANONICAL_DECIMAL_STRING',
    max: MAX_U64.toString(),
  });
  const point = decodeResultV0(pinned.vectors[0].encoded);
  assert.equal(point.executionCoordinate.value, MAX_U64);
  assert.equal(point.observerBasis.value.freshnessCoordinate, MAX_U64);

  const rejected = decodeResultV0(pinned.vectors[1].encoded);
  assert.equal(rejected.executionCoordinate.value, MAX_U64);
  const rejectedMutation = decodeMutationPayload(rejected.payload.data);
  assert.equal(rejectedMutation.canonicalEffectReceipt.executionCoordinate, MAX_U64);
  assert.equal(rejectedMutation.canonicalEffectReceipt.operationPresent, true);
  assert.equal(rejectedMutation.canonicalEffectReceipt.operationId, rejectedMutation.operationId);

  const bootstrap = decodeResultV0(pinned.vectors[2].encoded);
  const bootstrapMutation = decodeMutationPayload(bootstrap.payload.data);
  assert.equal(bootstrapMutation.operationPresent, false);
  assert.equal(bootstrapMutation.operationId, `0x${'00'.repeat(32)}`);
  assert.equal(bootstrapMutation.canonicalEffectReceipt.operationPresent, false);
  assert.equal(bootstrapMutation.canonicalEffectReceipt.operationId, `0x${'00'.repeat(32)}`);
});
