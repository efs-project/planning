'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const {
  ERRORS,
  NOTE_BODY_ABI,
  TYPE_SCHEMA_PAYLOAD_V0_ABI,
  decodeCanonicalBodyV0,
  encodeTypeSchemaV0,
  recordIdV0,
  typeSchemaIdV0,
  validateClosedTypeInventoryV0,
  validateFiniteTypeRecordInventoryV0,
} = require('../src/type-interpreter-v0.cjs');

const essential = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vectors/essential-v0.json'), 'utf8'));
const corpus = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../type-interpreter-v0.json'), 'utf8'));
const ZERO = `0x${'00'.repeat(32)}`;
const UNKNOWN = `0x${'ff'.repeat(32)}`;

function canonicalType(overrides = {}) {
  const type = structuredClone(essential.inputs.typeNote);
  Object.assign(type, overrides);
  return type;
}

function record(expectedRecordId, canonicalBody, typeSchemaId = essential.expected.typeSchemaId) {
  return { expectedRecordId, typeSchemaId, canonicalBody };
}

function exactInventory() {
  return {
    typeBytes: encodeTypeSchemaV0(canonicalType()),
    expectedTypeSchemaId: essential.expected.typeSchemaId,
    records: [
      record(essential.expected.recordAId, essential.inputs.recordA.body),
      record(essential.expected.recordBId, essential.inputs.recordB.body),
    ],
  };
}

function expectCode(code, fn) {
  assert.throws(fn, (error) => error && error.code === code);
}

function encodeType(type) {
  return encodeTypeSchemaV0(type);
}

test('accepts the exact essential T_NOTE bytes and closes Record B SELF_TYPE_RECORD to Record A', () => {
  const result = validateClosedTypeInventoryV0(exactInventory());

  assert.equal(result.typeSchemaId, essential.expected.typeSchemaId);
  assert.deepEqual(result.recordIds, [essential.expected.recordAId, essential.expected.recordBId]);
  assert.deepEqual(result.references, [{
    fromRecordId: essential.expected.recordBId,
    fieldKey: 2,
    targetRecordId: essential.expected.recordAId,
    targetTypeSchemaId: essential.expected.typeSchemaId,
  }]);
  assert.equal(result.passes, 2);
});

test('pins the hostile corpus and its non-durable boundary', () => {
  assert.equal(corpus.format, 'efs2-exp-c0-v0-type-interpreter-corpus/0');
  assert.equal(corpus.profileVersion, 0);
  assert.equal(corpus.protocolConformance, false);
  assert.equal(corpus.durable, false);
  assert.equal(corpus.typeSchemaId, essential.expected.typeSchemaId);
  assert.equal(corpus.recordAId, essential.expected.recordAId);
  assert.equal(corpus.recordBId, essential.expected.recordBId);
  assert.equal(corpus.typeBytes, encodeTypeSchemaV0(canonicalType()));
  assert.equal(corpus.recordABody, essential.inputs.recordA.body);
  assert.equal(corpus.recordBBody, essential.inputs.recordB.body);
  assert.deepEqual(corpus.acceptedReference, {
    fromRecordId: essential.expected.recordBId,
    fieldKey: 2,
    targetRecordId: essential.expected.recordAId,
    targetTypeSchemaId: essential.expected.typeSchemaId,
  });
  assert.deepEqual(corpus.hostileCaseIds, [
    'NONCANONICAL_OFFSET',
    'NONCANONICAL_FIELD_ORDER',
    'ABSENT_OPTIONAL_HIDDEN_VALUE',
    'MALFORMED_BODY',
    'UNKNOWN_RECORD_REFERENCE',
    'WRONG_SELF_TYPE_RECORD_TYPE',
    'OVERSIZE_BYTES',
    'DUPLICATE_FIELD',
    'RESERVED_FIELD_ZERO',
    'UNKNOWN_SCALAR',
    'UNKNOWN_FIELD_ORDER',
    'UNKNOWN_ENCODING',
    'TRAILING_BYTES',
    'MALFORMED_REFERENCE_ROLE',
    'UNKNOWN_REFERENCE_TARGET',
    'RESERVED_CONSTRAINT',
    'MAX_BYTES_WRONG_SCALAR',
    'OVERSIZE_BYTES_DECLARATION',
  ]);
});

test('rejects noncanonical dynamic offsets even when ABI decoding yields the same values', () => {
  const inventory = exactInventory();
  const canonical = inventory.records[0].canonicalBody;
  const words = canonical.slice(2).match(/.{64}/g);
  words[0] = BigInt(`0x${words[0]}`) === 0x60n ? `${'0'.repeat(62)}80` : words[0];
  words.splice(3, 0, '0'.repeat(64));
  inventory.records[0].canonicalBody = `0x${words.join('')}`;
  inventory.records[0].expectedRecordId = recordIdV0(inventory.expectedTypeSchemaId, inventory.records[0].canonicalBody);

  expectCode(ERRORS.MALFORMED_ABI, () => validateClosedTypeInventoryV0(inventory));
});

test('rejects noncanonical field order, duplicate fields, and reserved field zero', () => {
  for (const [type, expectedCode] of [
    [canonicalType({ fields: [
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
      { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 64 },
    ] }), ERRORS.NONCANONICAL],
    [canonicalType({ fields: [
      { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 64 },
      { fieldKey: 1, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ] }), ERRORS.NONCANONICAL],
    [canonicalType({ fields: [
      { fieldKey: 0, scalarKind: 3, required: true, maxLengthOrCount: 64 },
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ] }), ERRORS.NONCANONICAL],
  ]) {
    const inventory = exactInventory();
    inventory.typeBytes = encodeType(type);
    inventory.expectedTypeSchemaId = typeSchemaIdV0(type);
    inventory.records = [];
    expectCode(expectedCode, () => validateClosedTypeInventoryV0(inventory));
  }
});

test('rejects hidden values in absent optionals, malformed bodies, oversize bytes, and trailing bytes', () => {
  const cases = [];

  const hidden = exactInventory();
  hidden.records[0].canonicalBody = abi.encode(NOTE_BODY_ABI, [Buffer.from('alpha'), [false, UNKNOWN]]);
  hidden.records[0].expectedRecordId = recordIdV0(hidden.expectedTypeSchemaId, hidden.records[0].canonicalBody);
  cases.push([ERRORS.NONCANONICAL, hidden]);

  const malformed = exactInventory();
  malformed.records[0].canonicalBody = malformed.records[0].canonicalBody.slice(0, -2);
  malformed.records[0].expectedRecordId = recordIdV0(malformed.expectedTypeSchemaId, malformed.records[0].canonicalBody);
  cases.push([ERRORS.MALFORMED_ABI, malformed]);

  const oversize = exactInventory();
  oversize.records[0].canonicalBody = abi.encode(NOTE_BODY_ABI, [new Uint8Array(65), [false, ZERO]]);
  oversize.records[0].expectedRecordId = recordIdV0(oversize.expectedTypeSchemaId, oversize.records[0].canonicalBody);
  cases.push([ERRORS.LIMIT_EXCEEDED, oversize]);

  const trailing = exactInventory();
  trailing.records[0].canonicalBody += '00'.repeat(32);
  trailing.records[0].expectedRecordId = recordIdV0(trailing.expectedTypeSchemaId, trailing.records[0].canonicalBody);
  cases.push([ERRORS.MALFORMED_ABI, trailing]);

  for (const [code, inventory] of cases) {
    expectCode(code, () => validateClosedTypeInventoryV0(inventory));
  }
});

test('rejects unknown references and unknown or wrong-Type records after finite pass one', () => {
  const unknownRef = exactInventory();
  unknownRef.records[1].canonicalBody = abi.encode(NOTE_BODY_ABI, [Buffer.from('beta'), [true, UNKNOWN]]);
  unknownRef.records[1].expectedRecordId = recordIdV0(unknownRef.expectedTypeSchemaId, unknownRef.records[1].canonicalBody);
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateClosedTypeInventoryV0(unknownRef));

  const wrongType = exactInventory();
  wrongType.records[0].typeSchemaId = UNKNOWN;
  wrongType.records[0].expectedRecordId = recordIdV0(UNKNOWN, wrongType.records[0].canonicalBody);
  wrongType.records[1].canonicalBody = abi.encode(
    NOTE_BODY_ABI,
    [Buffer.from('beta'), [true, wrongType.records[0].expectedRecordId]],
  );
  wrongType.records[1].expectedRecordId = recordIdV0(wrongType.expectedTypeSchemaId, wrongType.records[1].canonicalBody);
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateClosedTypeInventoryV0(wrongType));
});

test('rejects unknown scalar and representation codes before body interpretation', () => {
  const variants = [
    canonicalType({ fields: [
      { fieldKey: 1, scalarKind: 99, required: true, maxLengthOrCount: 64 },
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ] }),
    canonicalType({ fieldOrder: 99 }),
    canonicalType({ encoding: 99 }),
  ];

  for (const type of variants) {
    const inventory = exactInventory();
    inventory.typeBytes = encodeType(type);
    inventory.expectedTypeSchemaId = typeSchemaIdV0(type);
    inventory.records = [];
    expectCode(ERRORS.NONCANONICAL, () => validateClosedTypeInventoryV0(inventory));
  }
});

test('rejects reserved or inconsistent intrinsic constraints and oversized BYTES declarations', () => {
  const variants = [
    canonicalType({ intrinsicConstraints: [{ fieldKey: 1, rule: 1 }] }),
    canonicalType({ intrinsicConstraints: [{ fieldKey: 1, rule: 3 }] }),
    canonicalType({ intrinsicConstraints: [{ fieldKey: 2, rule: 2 }] }),
  ];

  for (const type of variants) {
    const inventory = exactInventory();
    inventory.typeBytes = encodeType(type);
    inventory.expectedTypeSchemaId = typeSchemaIdV0(type);
    inventory.records = [];
    expectCode(ERRORS.NONCANONICAL, () => validateClosedTypeInventoryV0(inventory));
  }

  const oversized = canonicalType({
    fields: [
      { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 4097 },
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ],
  });
  const inventory = exactInventory();
  inventory.typeBytes = encodeType(oversized);
  inventory.expectedTypeSchemaId = typeSchemaIdV0(oversized);
  inventory.records = [];
  expectCode(ERRORS.LIMIT_EXCEEDED, () => validateClosedTypeInventoryV0(inventory));
});

test('compiles the selected generic ascending-field ABI mapping and preserves present empty values', () => {
  const type = {
    semanticCommitment: '0x01',
    fields: [
      { fieldKey: 1, scalarKind: 1, required: true, maxLengthOrCount: 0 },
      { fieldKey: 2, scalarKind: 2, required: false, maxLengthOrCount: 0 },
      { fieldKey: 3, scalarKind: 3, required: false, maxLengthOrCount: 3 },
      { fieldKey: 4, scalarKind: 4, required: true, maxLengthOrCount: 0 },
    ],
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints: [],
    referenceRoles: [{ fieldKey: 4, targetKind: 1, targetTypeSchemaId: UNKNOWN }],
  };
  const types = ['uint64', 'tuple(bool,bool)', 'tuple(bool,bytes)', 'bytes32'];
  const body = abi.encode(types, [7, [false, false], [true, '0x'], ZERO]);

  const decoded = decodeCanonicalBodyV0(type, body);
  assert.deepEqual(decoded.abiTypes, types);
  assert.equal(decoded.fields[0].value, 7n);
  assert.deepEqual(decoded.fields[1], { fieldKey: 2, scalarKind: 2, required: false, present: false, value: false });
  assert.deepEqual(decoded.fields[2], { fieldKey: 3, scalarKind: 3, required: false, present: true, value: '0x' });
  assert.equal(decoded.fields[3].value, ZERO);

  const hidden = abi.encode(types, [7, [false, true], [true, '0x'], ZERO]);
  expectCode(ERRORS.NONCANONICAL, () => decodeCanonicalBodyV0(type, hidden));
});

test('rejects malformed and unknown reference-role coordinates before exact T_NOTE matching', () => {
  const malformedRole = canonicalType({ referenceRoles: [{ fieldKey: 1, targetKind: 2, targetTypeSchemaId: ZERO }] });
  const unknownTarget = canonicalType({ referenceRoles: [{ fieldKey: 2, targetKind: 99, targetTypeSchemaId: ZERO }] });

  const malformedInventory = exactInventory();
  malformedInventory.typeBytes = encodeType(malformedRole);
  malformedInventory.expectedTypeSchemaId = typeSchemaIdV0(malformedRole);
  malformedInventory.records = [];
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateClosedTypeInventoryV0(malformedInventory));

  const unknownInventory = exactInventory();
  unknownInventory.typeBytes = encodeType(unknownTarget);
  unknownInventory.expectedTypeSchemaId = typeSchemaIdV0(unknownTarget);
  unknownInventory.records = [];
  expectCode(ERRORS.NONCANONICAL, () => validateClosedTypeInventoryV0(unknownInventory));
});

test('reference roles pin exact target Types and obey exact/self zero laws', () => {
  const leafType = {
    semanticCommitment: '0x6c656166',
    fields: [{ fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 8 }],
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints: [{ fieldKey: 1, rule: 2 }],
    referenceRoles: [],
  };
  const leafTypeId = typeSchemaIdV0(leafType);
  const edgeType = {
    semanticCommitment: '0x65646765',
    fields: [{ fieldKey: 1, scalarKind: 4, required: true, maxLengthOrCount: 0 }],
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints: [],
    referenceRoles: [{ fieldKey: 1, targetKind: 1, targetTypeSchemaId: leafTypeId }],
  };
  const edgeTypeId = typeSchemaIdV0(edgeType);
  const leafBody = abi.encode(['bytes'], ['0x01']);
  const leafId = recordIdV0(leafTypeId, leafBody);
  const edgeBody = abi.encode(['bytes32'], [leafId]);
  const edgeId = recordIdV0(edgeTypeId, edgeBody);
  const inventory = {
    types: [
      { typeBytes: encodeType(edgeType), expectedTypeSchemaId: edgeTypeId },
      { typeBytes: encodeType(leafType), expectedTypeSchemaId: leafTypeId },
    ],
    records: [
      record(edgeId, edgeBody, edgeTypeId),
      record(leafId, leafBody, leafTypeId),
    ],
  };

  const accepted = validateFiniteTypeRecordInventoryV0(inventory);
  assert.deepEqual(accepted.references, [{
    fromRecordId: edgeId,
    fieldKey: 1,
    targetRecordId: leafId,
    targetTypeSchemaId: leafTypeId,
  }]);

  const wrongRecordType = structuredClone(inventory);
  const wrongBody = abi.encode(['bytes32'], [edgeId]);
  wrongRecordType.records.unshift(record(recordIdV0(edgeTypeId, wrongBody), wrongBody, edgeTypeId));
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateFiniteTypeRecordInventoryV0(wrongRecordType));

  const missingTargetType = structuredClone(inventory);
  missingTargetType.types = missingTargetType.types.filter(({ expectedTypeSchemaId }) => expectedTypeSchemaId !== leafTypeId);
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateFiniteTypeRecordInventoryV0(missingTargetType));

  const missingTargetRecord = structuredClone(inventory);
  missingTargetRecord.records = missingTargetRecord.records.filter(({ expectedRecordId }) => expectedRecordId !== leafId);
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateFiniteTypeRecordInventoryV0(missingTargetRecord));

  for (const role of [
    { fieldKey: 1, targetKind: 1, targetTypeSchemaId: ZERO },
    { fieldKey: 1, targetKind: 2, targetTypeSchemaId: UNKNOWN },
    { fieldKey: 1, targetKind: 99, targetTypeSchemaId: ZERO },
  ]) {
    const bad = { ...edgeType, referenceRoles: [role] };
    const badInventory = {
      types: [{ typeBytes: encodeType(bad), expectedTypeSchemaId: typeSchemaIdV0(bad) }],
      records: [],
    };
    expectCode(ERRORS.NONCANONICAL, () => validateFiniteTypeRecordInventoryV0(badInventory));
  }
});

test('EXACT targets are literal prior Type IDs; cross-Type mutual recursion has no v0 group escape hatch', () => {
  const prior = canonicalType();
  const priorId = typeSchemaIdV0(prior);
  const successor = {
    ...canonicalType(),
    semanticCommitment: '0x737563636573736f72',
    referenceRoles: [{ fieldKey: 2, targetKind: 1, targetTypeSchemaId: priorId }],
  };
  const successorId = typeSchemaIdV0(successor);
  assert.doesNotThrow(() => validateFiniteTypeRecordInventoryV0({
    types: [
      { typeBytes: encodeType(successor), expectedTypeSchemaId: successorId },
      { typeBytes: encodeType(prior), expectedTypeSchemaId: priorId },
    ],
    records: [],
  }));
  expectCode(ERRORS.INVALID_TYPE_OR_RECORD, () => validateFiniteTypeRecordInventoryV0({
    types: [{ typeBytes: encodeType(successor), expectedTypeSchemaId: successorId }],
    records: [],
  }));

  // Replacing SELF with EXACT(priorId) changes the descriptor and therefore
  // changes its ID. A<->B cannot be authored because each exact ID requires
  // the other's already-final descriptor. C0/v0 defines no placeholders,
  // normalization, or group codec to break that fixed-point dependency.
  assert.notEqual(successorId, priorId);
  assert.equal(TYPE_SCHEMA_PAYLOAD_V0_ABI.includes('group'), false);
});
