'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  ERRORS,
  TypeInterpreterV0Error,
  decodeCanonicalTypeSchemaV0,
  inspectTypeSchemaEnvelope,
  typeSchemaIdFromTypeBytes,
  validateFiniteTypeRecordInventoryV0,
} = require('../src/type-interpreter-v0.cjs');
const { encodeEntry, inspectProjection } = require('../src/query-projection-v0.cjs');

const vectorPath = path.resolve(__dirname, '../vectors/type-envelope-v0.json');
const vector = JSON.parse(fs.readFileSync(vectorPath, 'utf8'));

function expectCode(code, fn) {
  assert.throws(fn, (error) => error instanceof TypeInterpreterV0Error && error.code === code);
}

test('serialized envelope corpus pins only disposable/nondeployable evidence', () => {
  assert.equal(vector.format, 'efs2-exp-c0-v0-type-envelope-corpus/0');
  assert.equal(vector.protocolConformance, false);
  assert.equal(vector.durable, false);
  assert.equal(vector.deployable, false);
  assert.equal(vector.exactExecutableTraceReplayCountDelta, 0);
  assert.equal(vector.limits.wholeEnvelopeBytes, 2048);
});

test('independent reader preserves opaque codec-1 bytes and refuses semantic reconstruction', () => {
  const expected = vector.opaqueCodec1;
  const actual = inspectTypeSchemaEnvelope(expected.rawTypeBytes);
  assert.equal(actual.codecVersion, expected.codecVersion);
  assert.equal(actual.payloadBytes, expected.payloadBytes);
  assert.equal(actual.rawTypeBytes, expected.rawTypeBytes);
  assert.equal(actual.typeSchemaId, expected.typeSchemaId);
  assert.equal(actual.support, expected.expected.support);
  assert.equal(actual.validation, expected.expected.validation);
  assert.equal(actual.semanticReconstruction, expected.expected.semanticReconstruction);
  assert.equal(typeSchemaIdFromTypeBytes(expected.rawTypeBytes), expected.typeSchemaId);

  const entry = encodeEntry(3, expected.typeSchemaId, expected.rawTypeBytes);
  const projection = inspectProjection([entry], [entry]);
  assert.equal(projection.integrity, 'MATCHED');
  assert.equal(projection.semanticReconstruction, 'INCOMPLETE');
  assert.equal(projection.typeEnvelopeInspections[0].rawTypeBytes, expected.rawTypeBytes);
});

test('serialized malformed, noncanonical, limit, and wrong-key mutations fail in distinct buckets', () => {
  for (const name of ['malformedOuterOffset', 'nonzeroOuterPadding', 'trailingOuterWord']) {
    expectCode(ERRORS.MALFORMED_ABI, () => inspectTypeSchemaEnvelope(vector.mutations[name].rawTypeBytes));
  }
  expectCode(ERRORS.LIMIT_EXCEEDED, () => inspectTypeSchemaEnvelope(vector.mutations.oversizedOuter.rawTypeBytes));
  expectCode(
    ERRORS.MALFORMED_ABI,
    () => decodeCanonicalTypeSchemaV0(vector.mutations.malformedCodec0Payload.rawTypeBytes),
  );
  expectCode(
    ERRORS.NONCANONICAL,
    () => decodeCanonicalTypeSchemaV0(vector.mutations.unknownCodec0Coordinate.rawTypeBytes),
  );
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateFiniteTypeRecordInventoryV0({
    types: [{
      typeBytes: vector.mutations.wrongTypeKey.rawTypeBytes,
      expectedTypeSchemaId: vector.mutations.wrongTypeKey.suppliedTypeSchemaId,
    }],
    records: [],
  }));
});

test('opaque payload mutation changes identity without enabling old-reader semantics', () => {
  const mutation = vector.mutations.opaquePayloadByte;
  const inspected = inspectTypeSchemaEnvelope(mutation.rawTypeBytes);
  assert.notEqual(inspected.typeSchemaId, vector.opaqueCodec1.typeSchemaId);
  assert.equal(inspected.typeSchemaId, mutation.typeSchemaId);
  assert.equal(inspected.support, 'UNSUPPORTED');
  assert.equal(inspected.rawTypeBytes, mutation.rawTypeBytes);
});

test('serialized corpus is byte-for-byte current with its independent emitter', () => {
  const emitted = execFileSync(
    process.execPath,
    [path.resolve(__dirname, '../scripts/build-type-envelope-vector.cjs')],
    { encoding: 'utf8' },
  );
  assert.equal(emitted, fs.readFileSync(vectorPath, 'utf8'));
});
