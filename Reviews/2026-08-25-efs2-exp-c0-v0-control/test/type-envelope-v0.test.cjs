'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const {
  ERRORS,
  TYPE_SCHEMA_PAYLOAD_V0_ABI,
  TypeInterpreterV0Error,
  decodeCanonicalTypeSchemaV0,
  encodeTypeSchemaEnvelope,
  encodeTypeSchemaPayloadV0,
  encodeTypeSchemaV0,
  inspectTypeSchemaEnvelope,
  typeSchemaIdFromEnvelope,
  typeSchemaIdFromTypeBytes,
  typeSchemaIdV0,
  validateFiniteTypeRecordInventoryV0,
} = require('../src/type-interpreter-v0.cjs');
const { createState, putPortableArtifacts } = require('../src/model.cjs');
const { encodeEntry, inspectProjection } = require('../src/query-projection-v0.cjs');

const ZERO = `0x${'00'.repeat(32)}`;

function noteType(overrides = {}) {
  return {
    semanticCommitment: '0x6578616374204e6f74652f7630',
    fields: [
      { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 64 },
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ],
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints: [{ fieldKey: 1, rule: 2 }],
    referenceRoles: [{ fieldKey: 2, targetKind: 2, targetTypeSchemaId: ZERO }],
    ...overrides,
  };
}

function expectCode(code, fn) {
  assert.throws(fn, (error) => error instanceof TypeInterpreterV0Error && error.code === code);
}

function replaceWord(bytes, index, word) {
  const body = bytes.slice(2);
  return `0x${body.slice(0, index * 64)}${word}${body.slice((index + 1) * 64)}`;
}

test('codec-0 Type wire is a canonical outer uint16+bytes envelope around a codec-free payload', () => {
  const type = noteType();
  const payloadBytes = encodeTypeSchemaPayloadV0(type);
  const typeBytes = encodeTypeSchemaV0(type);
  const decodedOuter = abi.decode(['uint16', 'bytes'], typeBytes);

  assert.equal(decodedOuter[0], 0n);
  assert.equal(decodedOuter[1], payloadBytes);
  assert.equal(abi.decode([TYPE_SCHEMA_PAYLOAD_V0_ABI], payloadBytes)[0][0], type.semanticCommitment);
  assert.equal(typeSchemaIdV0(type), typeSchemaIdFromEnvelope(0, payloadBytes));
  assert.equal(typeSchemaIdFromTypeBytes(typeBytes), typeSchemaIdV0(type));
  assert.deepEqual(decodeCanonicalTypeSchemaV0(typeBytes), type);
});

test('unknown outer codec remains exact raw evidence but never becomes v0 semantics', () => {
  const opaquePayload = '0xdeadbeef0001';
  const typeBytes = encodeTypeSchemaEnvelope(1, opaquePayload);
  const inspection = inspectTypeSchemaEnvelope(typeBytes);

  assert.deepEqual(inspection, {
    codecVersion: 1,
    payloadBytes: opaquePayload,
    rawTypeBytes: typeBytes,
    typeSchemaId: typeSchemaIdFromEnvelope(1, opaquePayload),
    support: 'UNSUPPORTED',
    validation: 'UNPROVEN',
    semanticReconstruction: 'INCOMPLETE',
  });
  expectCode(ERRORS.UNSUPPORTED_SCHEMA, () => decodeCanonicalTypeSchemaV0(typeBytes));
  expectCode(ERRORS.UNSUPPORTED_SCHEMA, () => validateFiniteTypeRecordInventoryV0({
    types: [{ typeBytes, expectedTypeSchemaId: inspection.typeSchemaId }],
    records: [],
  }));
});

test('opaque payload mutation changes identity while preserving exact mutated raw bytes', () => {
  const first = encodeTypeSchemaEnvelope(1, '0xdeadbeef');
  const second = encodeTypeSchemaEnvelope(1, '0xdeadbeee');
  const a = inspectTypeSchemaEnvelope(first);
  const b = inspectTypeSchemaEnvelope(second);

  assert.notEqual(a.typeSchemaId, b.typeSchemaId);
  assert.equal(b.rawTypeBytes, second);
  assert.equal(b.payloadBytes, '0xdeadbeee');
});

test('malformed outer offset, padding, and trailing words fail before codec dispatch', () => {
  const canonical = encodeTypeSchemaEnvelope(1, '0xab');
  const offset80 = replaceWord(canonical, 1, `${'0'.repeat(62)}80`);
  const nonzeroPadding = `${canonical.slice(0, -2)}01`;
  const trailing = `${canonical}${'00'.repeat(32)}`;

  for (const value of [offset80, nonzeroPadding, trailing, '0x00']) {
    expectCode(ERRORS.MALFORMED_ABI, () => inspectTypeSchemaEnvelope(value));
  }
});

test('whole-envelope cap is checked before opaque payload dispatch', () => {
  const oversized = encodeTypeSchemaEnvelope(1, `0x${'ab'.repeat(2000)}`);
  expectCode(ERRORS.LIMIT_EXCEEDED, () => inspectTypeSchemaEnvelope(oversized));
});

test('known codec-0 malformed payload and unknown coordinates are different failures', () => {
  const malformedPayload = encodeTypeSchemaEnvelope(0, '0x1234');
  expectCode(ERRORS.MALFORMED_ABI, () => decodeCanonicalTypeSchemaV0(malformedPayload));

  const unknownScalar = noteType({
    fields: [
      { fieldKey: 1, scalarKind: 99, required: true, maxLengthOrCount: 64 },
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ],
  });
  expectCode(ERRORS.NONCANONICAL, () => decodeCanonicalTypeSchemaV0(encodeTypeSchemaV0(unknownScalar)));
});

test('wrong Type key is an integrity failure even when the raw envelope is valid', () => {
  const typeBytes = encodeTypeSchemaV0(noteType());
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateFiniteTypeRecordInventoryV0({
    types: [{ typeBytes, expectedTypeSchemaId: `0x${'11'.repeat(32)}` }],
    records: [],
  }));
});

test('C0 transition rejects an unknown Type codec before any state effect', () => {
  const state = createState();
  const payloadBytes = '0xdeadbeef';
  const typeBytes = encodeTypeSchemaEnvelope(1, payloadBytes);
  const before = structuredClone(state);

  assert.throws(() => putPortableArtifacts(state, {
    typeId: typeSchemaIdFromEnvelope(1, payloadBytes),
    typeBytes,
    typeSchema: {},
    records: [],
    publicationId: ZERO,
    publication: { recordIds: [] },
  }), /Unsupported Type codec/);
  assert.deepEqual(state, before);
});

test('projection retains an unknown Type envelope exactly and grades semantic reconstruction incomplete', () => {
  const payloadBytes = '0xdeadbeef0001';
  const rawTypeBytes = encodeTypeSchemaEnvelope(1, payloadBytes);
  const typeSchemaId = typeSchemaIdFromEnvelope(1, payloadBytes);
  const entry = encodeEntry(3, typeSchemaId, rawTypeBytes);
  const inspection = inspectProjection([entry], [entry], { claimFullState: false });

  assert.equal(entry.value, rawTypeBytes);
  assert.equal(inspection.integrity, 'MATCHED');
  assert.equal(inspection.semanticReconstruction, 'INCOMPLETE');
  assert.equal(inspection.fullStateReconstruction, false);
  assert.deepEqual(inspection.typeEnvelopeInspections, [{
    typeSchemaId,
    codecVersion: 1,
    payloadBytes,
    rawTypeBytes,
    support: 'UNSUPPORTED',
    validation: 'UNPROVEN',
    semanticReconstruction: 'INCOMPLETE',
  }]);

  const mutated = structuredClone(entry);
  mutated.value = encodeTypeSchemaEnvelope(1, '0xdeadbeef0000');
  const mismatch = inspectProjection([entry], [mutated], { claimFullState: false });
  assert.equal(mismatch.integrity, 'INTEGRITY_FAILED');
  assert.match(mismatch.errors.join('\n'), /TYPES key.*exact outer codec and payload/i);
});
