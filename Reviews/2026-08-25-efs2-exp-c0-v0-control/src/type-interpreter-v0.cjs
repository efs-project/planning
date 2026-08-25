'use strict';

// Disposable closed interpreter for the EXP-C0/v0 T_NOTE fixture, plus a
// generic JavaScript component compiler for the selected ABI_TUPLE_V0 mapping.
// NON-DURABLE and NON-CONFORMANT: this is pressure evidence, not a production
// Type/Data ABI implementation or codec.

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const PROFILE_VERSION = 0;
const DOMAIN_TYPE = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/TYPE'));
const DOMAIN_BODY = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/BODY'));
const DOMAIN_RECORD = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/RECORD'));
const ZERO_BYTES32 = `0x${'00'.repeat(32)}`;

// The outer envelope is deliberately independent from every codec payload:
//   abi.encode(uint16 codecVersion, bytes payloadBytes)
// Codec 0 then uses the exact payload tuple below. An old reader can therefore
// canonicalize, identify, and retain a future codec without decoding it.
const TYPE_SCHEMA_ENVELOPE_ABI = Object.freeze(['uint16', 'bytes']);
const TYPE_SCHEMA_PAYLOAD_V0_ABI =
  'tuple(bytes,tuple(tuple(uint16,uint8,bool,uint16)[]),tuple(uint8,uint8),tuple(uint16,uint8)[],tuple(uint16,uint8,bytes32)[])';
const NOTE_BODY_ABI = Object.freeze(['bytes', 'tuple(bool,bytes32)']);

const ERRORS = Object.freeze({
  MALFORMED_ABI: 'MALFORMED_ABI',
  NONCANONICAL: 'NONCANONICAL',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  INVALID_TYPE_OR_RECORD: 'INVALID_TYPE_OR_RECORD',
  UNSUPPORTED_SCHEMA: 'UNSUPPORTED_SCHEMA',
});

const LIMITS = Object.freeze({
  typeDescriptorBytes: 2048,
  semanticCommitmentBytes: 512,
  fields: 16,
  constraints: 8,
  referenceRoles: 8,
  referenceExtraction: 8,
  recordBodyBytes: 4096,
  records: 16,
  noteBytes: 64,
});

class TypeInterpreterV0Error extends Error {
  constructor(code, message, evidence = undefined) {
    super(message);
    this.name = 'TypeInterpreterV0Error';
    this.code = code;
    if (evidence !== undefined) this.evidence = evidence;
  }
}

function fail(code, message, evidence = undefined) {
  throw new TypeInterpreterV0Error(code, message, evidence);
}

function bytesLength(value) {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) {
    fail(ERRORS.MALFORMED_ABI, 'expected canonical hex bytes');
  }
  return (value.length - 2) / 2;
}

function typePayloadValueV0(type) {
  return [
    type.semanticCommitment,
    [type.fields.map((field) => [field.fieldKey, field.scalarKind, field.required, field.maxLengthOrCount])],
    [type.fieldOrder, type.encoding],
    type.intrinsicConstraints.map((constraint) => [constraint.fieldKey, constraint.rule]),
    type.referenceRoles.map((role) => [role.fieldKey, role.targetKind, role.targetTypeSchemaId]),
  ];
}

function encodeTypeSchemaPayloadV0(type) {
  return abi.encode([TYPE_SCHEMA_PAYLOAD_V0_ABI], [typePayloadValueV0(type)]);
}

function encodeTypeSchemaEnvelope(codecVersion, payloadBytes) {
  bytesLength(payloadBytes);
  return abi.encode(TYPE_SCHEMA_ENVELOPE_ABI, [codecVersion, payloadBytes]);
}

function encodeTypeSchemaV0(type) {
  return encodeTypeSchemaEnvelope(0, encodeTypeSchemaPayloadV0(type));
}

function typeSchemaIdFromEnvelope(codecVersion, payloadBytes) {
  bytesLength(payloadBytes);
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'uint16', 'bytes'],
    [DOMAIN_TYPE, PROFILE_VERSION, codecVersion, payloadBytes],
  ));
}

function typeSchemaIdV0(type) {
  return typeSchemaIdFromEnvelope(0, encodeTypeSchemaPayloadV0(type));
}

function recordIdV0(typeSchemaId, canonicalBody) {
  bytesLength(canonicalBody);
  const bodyHash = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes'],
    [DOMAIN_BODY, PROFILE_VERSION, canonicalBody],
  ));
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32'],
    [DOMAIN_RECORD, PROFILE_VERSION, typeSchemaId, bodyHash],
  ));
}

function decodeCanonicalTypeEnvelope(typeBytes) {
  if (bytesLength(typeBytes) > LIMITS.typeDescriptorBytes) {
    fail(ERRORS.LIMIT_EXCEEDED, 'Type descriptor exceeds 2048 bytes');
  }
  let decoded;
  try {
    decoded = abi.decode(TYPE_SCHEMA_ENVELOPE_ABI, typeBytes);
  } catch {
    fail(ERRORS.MALFORMED_ABI, 'TypeSchema envelope ABI decode failed');
  }

  let reencoded;
  try {
    reencoded = abi.encode(TYPE_SCHEMA_ENVELOPE_ABI, decoded);
  } catch {
    fail(ERRORS.MALFORMED_ABI, 'TypeSchema envelope ABI re-encode failed');
  }
  if (reencoded.toLowerCase() !== typeBytes.toLowerCase()) {
    fail(ERRORS.MALFORMED_ABI, 'TypeSchema envelope is not canonical ABI-v2');
  }
  return {
    codecVersion: Number(decoded[0]),
    payloadBytes: decoded[1],
    rawTypeBytes: typeBytes,
  };
}

function decodeCanonicalTypeSchemaPayloadV0(payloadBytes) {
  bytesLength(payloadBytes);
  let decoded;
  try {
    [decoded] = abi.decode([TYPE_SCHEMA_PAYLOAD_V0_ABI], payloadBytes);
  } catch {
    fail(ERRORS.MALFORMED_ABI, 'TypeSchema codec-0 payload ABI decode failed');
  }

  let reencoded;
  try {
    reencoded = abi.encode([TYPE_SCHEMA_PAYLOAD_V0_ABI], [decoded]);
  } catch {
    fail(ERRORS.MALFORMED_ABI, 'TypeSchema codec-0 payload ABI re-encode failed');
  }
  if (reencoded.toLowerCase() !== payloadBytes.toLowerCase()) {
    fail(ERRORS.MALFORMED_ABI, 'TypeSchema codec-0 payload is not canonical ABI-v2');
  }

  const fields = decoded[1][0].map((field) => ({
    fieldKey: Number(field[0]),
    scalarKind: Number(field[1]),
    required: field[2],
    maxLengthOrCount: Number(field[3]),
  }));
  const intrinsicConstraints = decoded[3].map((constraint) => ({
    fieldKey: Number(constraint[0]),
    rule: Number(constraint[1]),
  }));
  const referenceRoles = decoded[4].map((role) => ({
    fieldKey: Number(role[0]),
    targetKind: Number(role[1]),
    targetTypeSchemaId: role[2],
  }));
  const type = {
    semanticCommitment: decoded[0],
    fields,
    fieldOrder: Number(decoded[2][0]),
    encoding: Number(decoded[2][1]),
    intrinsicConstraints,
    referenceRoles,
  };
  validateTypeCoordinates(type);
  return type;
}

function inspectTypeSchemaEnvelope(typeBytes) {
  const envelope = decodeCanonicalTypeEnvelope(typeBytes);
  const typeSchemaId = typeSchemaIdFromEnvelope(envelope.codecVersion, envelope.payloadBytes);
  if (envelope.codecVersion !== 0) {
    return {
      ...envelope,
      typeSchemaId,
      support: 'UNSUPPORTED',
      validation: 'UNPROVEN',
      semanticReconstruction: 'INCOMPLETE',
    };
  }
  const schema = decodeCanonicalTypeSchemaPayloadV0(envelope.payloadBytes);
  return {
    ...envelope,
    typeSchemaId,
    support: 'SUPPORTED',
    validation: 'SEMANTICALLY_VALID',
    semanticReconstruction: 'COMPLETE',
    schema,
  };
}

function typeSchemaIdFromTypeBytes(typeBytes) {
  const envelope = decodeCanonicalTypeEnvelope(typeBytes);
  return typeSchemaIdFromEnvelope(envelope.codecVersion, envelope.payloadBytes);
}

function decodeCanonicalTypeSchemaV0(typeBytes) {
  const envelope = decodeCanonicalTypeEnvelope(typeBytes);
  if (envelope.codecVersion !== 0) {
    fail(ERRORS.UNSUPPORTED_SCHEMA, 'TypeSchema outer codec is unsupported', {
      ...envelope,
      typeSchemaId: typeSchemaIdFromEnvelope(envelope.codecVersion, envelope.payloadBytes),
      support: 'UNSUPPORTED',
      validation: 'UNPROVEN',
      semanticReconstruction: 'INCOMPLETE',
    });
  }
  return decodeCanonicalTypeSchemaPayloadV0(envelope.payloadBytes);
}

function validateTypeCoordinates(type) {
  const semanticBytes = bytesLength(type.semanticCommitment);
  if (semanticBytes === 0 || semanticBytes > LIMITS.semanticCommitmentBytes) {
    fail(ERRORS.LIMIT_EXCEEDED, 'semantic commitment outside 1..512 bytes');
  }
  if (type.fields.length === 0 || type.fields.length > LIMITS.fields) {
    fail(ERRORS.LIMIT_EXCEEDED, 'field count outside 1..16');
  }
  if (type.intrinsicConstraints.length > LIMITS.constraints) {
    fail(ERRORS.LIMIT_EXCEEDED, 'constraint count exceeds 8');
  }
  if (type.referenceRoles.length > LIMITS.referenceRoles) {
    fail(ERRORS.LIMIT_EXCEEDED, 'reference-role count exceeds 8');
  }
  if (type.fieldOrder !== 1 || type.encoding !== 1) {
    fail(ERRORS.NONCANONICAL, 'unknown representation coordinate');
  }

  let previous = 0;
  for (const field of type.fields) {
    if (field.fieldKey === 0 || field.fieldKey <= previous) {
      fail(ERRORS.NONCANONICAL, 'field keys must be nonzero and strictly ascending');
    }
    if (field.scalarKind < 1 || field.scalarKind > 4) {
      fail(ERRORS.NONCANONICAL, 'unknown scalar kind');
    }
    if ((field.scalarKind === 1 || field.scalarKind === 2 || field.scalarKind === 4)
        && field.maxLengthOrCount !== 0) {
      fail(ERRORS.NONCANONICAL, 'fixed scalar must have zero bound');
    }
    if (field.scalarKind === 3 && field.maxLengthOrCount === 0) {
      fail(ERRORS.NONCANONICAL, 'BYTES field must declare a nonzero bound');
    }
    if (field.scalarKind === 3 && field.maxLengthOrCount > LIMITS.recordBodyBytes) {
      fail(ERRORS.LIMIT_EXCEEDED, 'BYTES field bound exceeds 4096');
    }
    previous = field.fieldKey;
  }

  const fieldByKey = new Map(type.fields.map((field) => [field.fieldKey, field]));
  previous = 0;
  for (const constraint of type.intrinsicConstraints) {
    if (constraint.fieldKey <= previous || !fieldByKey.has(constraint.fieldKey)) {
      fail(ERRORS.NONCANONICAL, 'constraint keys must be known and strictly ascending');
    }
    if (constraint.rule !== 2) {
      fail(ERRORS.NONCANONICAL, 'constraint rule is reserved or unsupported');
    }
    if (fieldByKey.get(constraint.fieldKey).scalarKind !== 3) {
      fail(ERRORS.NONCANONICAL, 'MAX_BYTES constraint must target BYTES');
    }
    previous = constraint.fieldKey;
  }

  previous = 0;
  for (const role of type.referenceRoles) {
    if (role.fieldKey <= previous || !fieldByKey.has(role.fieldKey)) {
      fail(ERRORS.NONCANONICAL, 'reference-role keys must be known and strictly ascending');
    }
    if (role.targetKind < 1 || role.targetKind > 2) {
      fail(ERRORS.NONCANONICAL, 'unknown reference target');
    }
    if (role.targetKind === 1 && role.targetTypeSchemaId.toLowerCase() === ZERO_BYTES32) {
      fail(ERRORS.NONCANONICAL, 'EXACT_TYPE_RECORD requires a nonzero target TypeSchemaId');
    }
    if (role.targetKind === 2 && role.targetTypeSchemaId.toLowerCase() !== ZERO_BYTES32) {
      fail(ERRORS.NONCANONICAL, 'SELF_TYPE_RECORD requires a zero target TypeSchemaId');
    }
    if (fieldByKey.get(role.fieldKey).scalarKind !== 4) {
      fail(ERRORS.INVALID_TYPE_OR_RECORD, 'reference role is not attached to RECORD_ID');
    }
    previous = role.fieldKey;
  }
}

function compileBodyTypesV0(type) {
  validateTypeCoordinates(type);
  const scalarTypes = new Map([
    [1, 'uint64'],
    [2, 'bool'],
    [3, 'bytes'],
    [4, 'bytes32'],
  ]);
  return type.fields.map((field) => {
    const scalar = scalarTypes.get(field.scalarKind);
    return field.required ? scalar : `tuple(bool,${scalar})`;
  });
}

function isZeroScalar(scalarKind, value) {
  if (scalarKind === 1) return value === 0n;
  if (scalarKind === 2) return value === false;
  if (scalarKind === 3) return value === '0x';
  if (scalarKind === 4) return value.toLowerCase() === ZERO_BYTES32;
  return false;
}

function decodeCanonicalBodyV0(type, canonicalBody) {
  bytesLength(canonicalBody);
  const abiTypes = compileBodyTypesV0(type);
  let decoded;
  try {
    decoded = abi.decode(abiTypes, canonicalBody);
  } catch {
    fail(ERRORS.MALFORMED_ABI, 'record body ABI decode failed');
  }
  let reencoded;
  try {
    reencoded = abi.encode(abiTypes, decoded);
  } catch {
    fail(ERRORS.MALFORMED_ABI, 'record body ABI re-encode failed');
  }
  if (reencoded.toLowerCase() !== canonicalBody.toLowerCase()) {
    fail(ERRORS.MALFORMED_ABI, 'record body is not canonical ABI-v2');
  }
  if (bytesLength(canonicalBody) > LIMITS.recordBodyBytes) {
    fail(ERRORS.LIMIT_EXCEEDED, 'record body exceeds 4096 bytes');
  }

  const fields = type.fields.map((field, index) => {
    const raw = decoded[index];
    const present = field.required ? true : raw[0];
    const value = field.required ? raw : raw[1];
    if (!present && !isZeroScalar(field.scalarKind, value)) {
      fail(ERRORS.NONCANONICAL, `absent field ${field.fieldKey} contains a hidden nonzero value`);
    }
    if (field.scalarKind === 3 && bytesLength(value) > field.maxLengthOrCount) {
      fail(ERRORS.LIMIT_EXCEEDED, `BYTES field ${field.fieldKey} exceeds its declared bound`);
    }
    return field.required
      ? { fieldKey: field.fieldKey, scalarKind: field.scalarKind, required: true, value }
      : { fieldKey: field.fieldKey, scalarKind: field.scalarKind, required: false, present, value };
  });
  return { abiTypes, fields };
}

function validateExactNoteSchema(type) {
  const exact = type.semanticCommitment.toLowerCase() === '0x6578616374204e6f74652f7630'
    && type.fields.length === 2
    && type.fields[0].fieldKey === 1
    && type.fields[0].scalarKind === 3
    && type.fields[0].required === true
    && type.fields[0].maxLengthOrCount === 64
    && type.fields[1].fieldKey === 2
    && type.fields[1].scalarKind === 4
    && type.fields[1].required === false
    && type.fields[1].maxLengthOrCount === 0
    && type.fieldOrder === 1
    && type.encoding === 1
    && type.intrinsicConstraints.length === 1
    && type.intrinsicConstraints[0].fieldKey === 1
    && type.intrinsicConstraints[0].rule === 2
    && type.referenceRoles.length === 1
    && type.referenceRoles[0].fieldKey === 2
    && type.referenceRoles[0].targetKind === 2
    && type.referenceRoles[0].targetTypeSchemaId.toLowerCase() === ZERO_BYTES32;
  if (!exact) {
    fail(
      ERRORS.UNSUPPORTED_SCHEMA,
      'only exact T_NOTE is interpretable; arbitrary ABI_TUPLE_V0 optional/dynamic layout is unresolved',
    );
  }
}

function decodeCanonicalNoteBodyV0(canonicalBody) {
  const noteType = {
    semanticCommitment: '0x6578616374204e6f74652f7630',
    fields: [
      { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: LIMITS.noteBytes },
      { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
    ],
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints: [{ fieldKey: 1, rule: 2 }],
    referenceRoles: [{ fieldKey: 2, targetKind: 2, targetTypeSchemaId: ZERO_BYTES32 }],
  };
  const decoded = decodeCanonicalBodyV0(noteType, canonicalBody);
  return {
    noteBytes: decoded.fields[0].value,
    reference: {
      present: decoded.fields[1].present,
      value: decoded.fields[1].value,
    },
  };
}

function validateFiniteTypeRecordInventoryV0({ types, records }) {
  if (!Array.isArray(types) || types.length === 0 || types.length > 16) {
    fail(ERRORS.LIMIT_EXCEEDED, 'Type inventory outside 1..16');
  }
  if (!Array.isArray(records) || records.length > LIMITS.records) {
    fail(ERRORS.LIMIT_EXCEEDED, 'record inventory exceeds 16');
  }

  // Pass one closes both finite identity inventories without following any
  // reference. Exact roles are resolved only after every Type and Record ID is
  // independently recomputed.
  const typeInventory = new Map();
  for (const input of types) {
    const type = decodeCanonicalTypeSchemaV0(input.typeBytes);
    const computedTypeSchemaId = typeSchemaIdFromTypeBytes(input.typeBytes);
    if (computedTypeSchemaId.toLowerCase() !== input.expectedTypeSchemaId.toLowerCase()) {
      fail(ERRORS.INVALID_TYPE_OR_RECORD, 'TypeSchemaId mismatch');
    }
    const key = computedTypeSchemaId.toLowerCase();
    if (typeInventory.has(key)) fail(ERRORS.NONCANONICAL, 'duplicate Type in finite inventory');
    typeInventory.set(key, type);
  }

  for (const [containingTypeSchemaId, type] of typeInventory) {
    for (const role of type.referenceRoles) {
      if (role.targetKind === 1) {
        if (role.targetTypeSchemaId.toLowerCase() === containingTypeSchemaId) {
          fail(ERRORS.NONCANONICAL, 'EXACT_TYPE_RECORD targeting the containing Type must use SELF_TYPE_RECORD');
        }
        if (!typeInventory.has(role.targetTypeSchemaId.toLowerCase())) {
          fail(ERRORS.INVALID_TYPE_OR_RECORD, 'EXACT_TYPE_RECORD target Type is absent');
        }
      }
    }
  }

  const recordInventory = new Map();
  const bodies = [];
  for (const record of records) {
    const recordType = typeInventory.get(record.typeSchemaId.toLowerCase());
    if (!recordType) fail(ERRORS.INVALID_TYPE_OR_RECORD, 'record names an unknown Type');
    const computed = recordIdV0(record.typeSchemaId, record.canonicalBody);
    if (computed.toLowerCase() !== record.expectedRecordId.toLowerCase()) {
      fail(ERRORS.INVALID_TYPE_OR_RECORD, 'RecordId mismatch');
    }
    if (recordInventory.has(computed.toLowerCase())) {
      fail(ERRORS.NONCANONICAL, 'duplicate record in finite inventory');
    }
    recordInventory.set(computed.toLowerCase(), { typeSchemaId: record.typeSchemaId });
    bodies.push({ ...record, type: recordType });
  }

  // Pass two interprets every body through its exact Type, then resolves each
  // present role to the role-pinned exact target Type.
  const references = [];
  for (const record of bodies) {
    const body = decodeCanonicalBodyV0(record.type, record.canonicalBody);
    const fieldByKey = new Map(body.fields.map((field) => [field.fieldKey, field]));
    for (const role of record.type.referenceRoles) {
      const field = fieldByKey.get(role.fieldKey);
      if (!field.required && !field.present) continue;
      if (references.length >= LIMITS.referenceExtraction) {
        fail(ERRORS.LIMIT_EXCEEDED, 'reference extraction exceeds 8');
      }
      const target = recordInventory.get(field.value.toLowerCase());
      const expectedTargetType = role.targetKind === 2
        ? record.typeSchemaId
        : role.targetTypeSchemaId;
      if (!target || target.typeSchemaId.toLowerCase() !== expectedTargetType.toLowerCase()) {
        fail(ERRORS.INVALID_TYPE_OR_RECORD, 'reference target is absent or has the wrong exact Type');
      }
      references.push({
        fromRecordId: record.expectedRecordId,
        fieldKey: role.fieldKey,
        targetRecordId: field.value,
        targetTypeSchemaId: target.typeSchemaId,
      });
    }
  }

  return {
    typeSchemaIds: types.map(({ expectedTypeSchemaId: id }) => id),
    recordIds: records.map(({ expectedRecordId: id }) => id),
    references,
    passes: 2,
  };
}

function validateClosedTypeInventoryV0({ typeBytes, expectedTypeSchemaId, records }) {
  const type = decodeCanonicalTypeSchemaV0(typeBytes);
  validateExactNoteSchema(type);
  const result = validateFiniteTypeRecordInventoryV0({
    types: [{ typeBytes, expectedTypeSchemaId }],
    records,
  });
  return { typeSchemaId: expectedTypeSchemaId, ...result };
}

module.exports = {
  ERRORS,
  LIMITS,
  NOTE_BODY_ABI,
  TYPE_SCHEMA_ENVELOPE_ABI,
  TYPE_SCHEMA_PAYLOAD_V0_ABI,
  TypeInterpreterV0Error,
  compileBodyTypesV0,
  decodeCanonicalBodyV0,
  decodeCanonicalNoteBodyV0,
  decodeCanonicalTypeSchemaV0,
  encodeTypeSchemaEnvelope,
  encodeTypeSchemaPayloadV0,
  encodeTypeSchemaV0,
  inspectTypeSchemaEnvelope,
  recordIdV0,
  typeSchemaIdFromEnvelope,
  typeSchemaIdFromTypeBytes,
  typeSchemaIdV0,
  validateClosedTypeInventoryV0,
  validateFiniteTypeRecordInventoryV0,
};
