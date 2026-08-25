'use strict';

// Independent emitter: duplicates the disposable envelope contract and imports
// no SUT/model helper. The serialized corpus is a consumer handoff, not a
// protocol vector, stable ID, or codec freeze.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const PROFILE_VERSION = 0;
const DOMAIN_TYPE = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/TYPE'));
const ZERO = `0x${'00'.repeat(32)}`;
const PAYLOAD_V0_ABI =
  'tuple(bytes,tuple(tuple(uint16,uint8,bool,uint16)[]),tuple(uint8,uint8),tuple(uint16,uint8)[],tuple(uint16,uint8,bytes32)[])';

const payloadValue = ({ scalarKind = 3 } = {}) => [
  '0x6578616374204e6f74652f7630',
  [[
    [1, scalarKind, true, 64],
    [2, 4, false, 0],
  ]],
  [1, 1],
  [[1, 2]],
  [[2, 2, ZERO]],
];
const envelope = (codecVersion, payloadBytes) => abi.encode(['uint16', 'bytes'], [codecVersion, payloadBytes]);
const typeId = (codecVersion, payloadBytes) => keccak256(abi.encode(
  ['bytes32', 'uint16', 'uint16', 'bytes'],
  [DOMAIN_TYPE, PROFILE_VERSION, codecVersion, payloadBytes],
));
const replaceWord = (bytes, index, word) => {
  const body = bytes.slice(2);
  return `0x${body.slice(0, index * 64)}${word}${body.slice((index + 1) * 64)}`;
};

const payload0 = abi.encode([PAYLOAD_V0_ABI], [payloadValue()]);
const raw0 = envelope(0, payload0);
const opaquePayload = '0xdeadbeef0001';
const opaqueRaw = envelope(1, opaquePayload);
const opaqueMutatedPayload = '0xdeadbeef0000';
const opaqueMutatedRaw = envelope(1, opaqueMutatedPayload);
const unknownCoordinatePayload = abi.encode([PAYLOAD_V0_ABI], [payloadValue({ scalarKind: 99 })]);
const canonicalShort = envelope(1, '0xab');

const vector = {
  format: 'efs2-exp-c0-v0-type-envelope-corpus/0',
  profileVersion: PROFILE_VERSION,
  protocolConformance: false,
  durable: false,
  deployable: false,
  exactExecutableTraceReplayCountDelta: 0,
  outerWire: 'abi.encode(uint16 codecVersion, bytes payloadBytes)',
  payloadV0Abi: PAYLOAD_V0_ABI,
  identity: 'keccak256(abi.encode(DOMAIN_TYPE,uint16(0),codecVersion,payloadBytes))',
  limits: { wholeEnvelopeBytes: 2048 },
  codec0: {
    codecVersion: 0,
    payloadBytes: payload0,
    rawTypeBytes: raw0,
    typeSchemaId: typeId(0, payload0),
    expected: {
      support: 'SUPPORTED',
      validation: 'SEMANTICALLY_VALID',
      semanticReconstruction: 'COMPLETE',
      c0Admission: 'ACCEPT_IF_ALL_OTHER_GATES_PASS',
    },
  },
  opaqueCodec1: {
    codecVersion: 1,
    payloadBytes: opaquePayload,
    rawTypeBytes: opaqueRaw,
    typeSchemaId: typeId(1, opaquePayload),
    expected: {
      support: 'UNSUPPORTED',
      validation: 'UNPROVEN',
      semanticReconstruction: 'INCOMPLETE',
      rawRetention: 'EXACT',
      c0Admission: 'ZERO_EFFECT_REJECT',
    },
  },
  mutations: {
    opaquePayloadByte: {
      rawTypeBytes: opaqueMutatedRaw,
      typeSchemaId: typeId(1, opaqueMutatedPayload),
      expected: 'DISTINCT_ID_RAW_RETAINED_UNSUPPORTED',
    },
    malformedOuterOffset: {
      rawTypeBytes: replaceWord(canonicalShort, 1, `${'0'.repeat(62)}80`),
      expectedError: 'MALFORMED_ABI',
    },
    nonzeroOuterPadding: {
      rawTypeBytes: `${canonicalShort.slice(0, -2)}01`,
      expectedError: 'MALFORMED_ABI',
    },
    trailingOuterWord: {
      rawTypeBytes: `${canonicalShort}${'00'.repeat(32)}`,
      expectedError: 'MALFORMED_ABI',
    },
    oversizedOuter: {
      rawTypeBytes: envelope(1, `0x${'ab'.repeat(2000)}`),
      expectedError: 'LIMIT_EXCEEDED',
    },
    malformedCodec0Payload: {
      rawTypeBytes: envelope(0, '0x1234'),
      expectedError: 'MALFORMED_ABI',
    },
    unknownCodec0Coordinate: {
      rawTypeBytes: envelope(0, unknownCoordinatePayload),
      typeSchemaId: typeId(0, unknownCoordinatePayload),
      expectedError: 'NONCANONICAL',
    },
    wrongTypeKey: {
      rawTypeBytes: raw0,
      suppliedTypeSchemaId: `0x${'11'.repeat(32)}`,
      expectedError: 'INVALID_TYPE_OR_RECORD',
    },
  },
};

const serialized = `${JSON.stringify(vector, null, 2)}\n`;
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.resolve(__dirname, '../vectors/type-envelope-v0.json'), serialized);
} else {
  process.stdout.write(serialized);
}
