'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const essential = JSON.parse(fs.readFileSync(path.join(root, 'vectors/essential-v0.json'), 'utf8'));

const HOSTILE_CASE_IDS = [
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
];

const ACCEPTED_GENERIC_CASES = [
  'OPTIONAL_BOOL_ABSENT_ZERO',
  'OPTIONAL_BYTES_PRESENT_EMPTY',
];

const UNRESOLVED = [
  'Generic runtime ABI_TUPLE_V0 parser is not implemented in Solidity by this literal T_NOTE control',
  'Production malformed-input precedence beyond the disposable C0/v0 error classes',
];

const vector = {
  format: 'efs2-exp-c0-v0-type-interpreter-corpus/0',
  profileVersion: 0,
  protocolConformance: false,
  durable: false,
  scope: 'EXACT_T_NOTE_ONLY',
  fixtureSource: 'vectors/essential-v0.json',
  typeSchemaId: essential.expected.typeSchemaId,
  recordAId: essential.expected.recordAId,
  recordBId: essential.expected.recordBId,
  typeBytes: essential.inputs.typeEnvelope.typeBytes,
  recordABody: essential.inputs.recordA.body,
  recordBBody: essential.inputs.recordB.body,
  acceptedReference: {
    fromRecordId: essential.expected.recordBId,
    fieldKey: 2,
    targetRecordId: essential.expected.recordAId,
    targetTypeSchemaId: essential.expected.typeSchemaId,
  },
  hostileCaseIds: HOSTILE_CASE_IDS,
  acceptedGenericCases: ACCEPTED_GENERIC_CASES,
  unresolved: UNRESOLVED,
};

const serialized = `${JSON.stringify(vector, null, 2)}\n`;
if (process.argv.includes('--write')) fs.writeFileSync(path.join(root, 'type-interpreter-v0.json'), serialized);
else process.stdout.write(serialized);
