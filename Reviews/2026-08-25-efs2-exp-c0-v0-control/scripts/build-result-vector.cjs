'use strict';

// Independent emitter: duplicates the disposable ABI contract and imports no
// model, ResultV0 implementation, Solidity source, or generated helper.
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const ZERO = `0x${'00'.repeat(32)}`;
const b32 = (byte) => `0x${byte.repeat(32)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;
const DOMAIN_RESULT = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/RESULT'));
const MAX_U64 = (1n << 64n) - 1n;

const OPT_B32 = 'tuple(bool,bytes32)';
const OPT_U64 = 'tuple(bool,uint64)';
const OPT_U32 = 'tuple(bool,uint32)';
const OBSERVER = 'tuple(bytes32,bytes32,uint8,uint8,uint64)';
const OPT_OBSERVER = `tuple(bool,${OBSERVER})`;
const PROFILES = `tuple(${OPT_B32},${OPT_B32},${OPT_U32},${OPT_B32},${OPT_B32},${OPT_B32},${OPT_B32},${OPT_B32})`;
const FACTS = 'tuple(uint8,uint8,uint8,uint8,uint8,uint8,uint8,uint8,uint8)';
const PAYLOAD = 'tuple(uint8,bytes)';
const RAW = 'tuple(bool,bytes,bytes32)';
const RESULT = `tuple(uint8,uint8,bytes,${OPT_B32},${OPT_B32},${OPT_U64},${OPT_U32},${OPT_OBSERVER},${PROFILES},${FACTS},${PAYLOAD},${RAW},uint8)`;
const POINT_PAYLOAD = 'tuple(bytes,bool,bytes,bool)';
const ERROR = 'tuple(uint8,bytes)';
const PLAN_SIGNATURE_RECEIPT = 'tuple(bytes32,bytes32,bytes32,bytes32,bytes32,uint8)';
const CANONICAL_EFFECT_RECEIPT = 'tuple(bool,bytes32,bytes32,bytes32,uint64,bytes32,bytes32,uint8)';
const MUTATION_PAYLOAD = `tuple(bool,bytes32,bytes32[],bool,${PLAN_SIGNATURE_RECEIPT},bool,${CANONICAL_EFFECT_RECEIPT},bool,${ERROR})`;

const absentB32 = [false, ZERO];
const absentU32 = [false, 0];
const absentObserver = [false, [ZERO, ZERO, 0, 0, 0]];
const absentProfiles = () => [absentB32, absentB32, absentU32, absentB32, absentB32, absentB32, absentB32, absentB32];
const zeroSignature = [ZERO, ZERO, ZERO, ZERO, ZERO, 0];

function encodeAndCommit(value) {
  const encoded = abi.encode([RESULT], [value]);
  const commitment = keccak256(abi.encode(['bytes32', 'uint16', RESULT], [DOMAIN_RESULT, VERSION, value]));
  return { encoded, commitment };
}

const realm = b32('11');
const revision = b32('12');
const executionCoordinate = MAX_U64;

const pointRaw = utf8Hex('exact record bytes');
const pointPayload = abi.encode([POINT_PAYLOAD], [[utf8Hex('record-key'), true, pointRaw, false]]);
const pointProfiles = absentProfiles();
pointProfiles[0] = [true, b32('15')];
const pointValue = [
  2, 3, utf8Hex('record-key'),
  [true, realm], [true, revision], [true, MAX_U64], [true, 7],
  [true, [b32('13'), b32('14'), 2, 1, MAX_U64]],
  pointProfiles,
  [1, 1, 1, 2, 3, 1, 255, 1, 255],
  [1, pointPayload],
  [true, pointRaw, keccak256(pointRaw)],
  255,
];

const rejectedRoot = b32('31');
const rejectedOperation = b32('21');
const rejectedReceipt = [true, rejectedOperation, realm, revision, executionCoordinate, rejectedRoot, rejectedRoot, 2];
const rejectedPayload = abi.encode([MUTATION_PAYLOAD], [[
  true, rejectedOperation, [], false, zeroSignature, true, rejectedReceipt, true, [8, utf8Hex('verifier-denied')],
]]);
const rejectedProfiles = absentProfiles();
rejectedProfiles[4] = [true, b32('16')];
const rejectedValue = [
  1, 9, utf8Hex('operation-key'),
  [true, realm], [true, revision], [true, executionCoordinate], [true, 7],
  absentObserver,
  rejectedProfiles,
  [255, 255, 1, 2, 2, 255, 255, 255, 2],
  [3, rejectedPayload],
  [false, '0x', ZERO],
  255,
];

const beforeBootstrapRoot = b32('41');
const afterBootstrapRoot = b32('42');
const bootstrapReceipt = [false, ZERO, realm, revision, 1n, beforeBootstrapRoot, afterBootstrapRoot, 1];
const bootstrapPayload = abi.encode([MUTATION_PAYLOAD], [[
  false, ZERO, [], false, zeroSignature, true, bootstrapReceipt, false, [0, '0x'],
]]);
const bootstrapValue = [
  1, 1, utf8Hex('realm-bootstrap'),
  [true, realm], [true, revision], [true, 1], [true, 0],
  absentObserver,
  absentProfiles(),
  [255, 255, 1, 1, 255, 255, 255, 255, 1],
  [3, bootstrapPayload],
  [false, '0x', ZERO],
  255,
];

const point = encodeAndCommit(pointValue);
const rejected = encodeAndCommit(rejectedValue);
const bootstrap = encodeAndCommit(bootstrapValue);

const bundle = {
  format: 'efs2-exp-c0-v0-result-vector/0',
  profileVersion: VERSION,
  protocolConformance: false,
  durable: false,
  codec: 'SOLIDITY_ABI_V2_ABI_ENCODE',
  uint64Boundary: {
    jsonEncoding: 'CANONICAL_DECIMAL_STRING',
    max: MAX_U64.toString(),
  },
  domainResult: DOMAIN_RESULT,
  vectors: [
    {
      id: 'RESULT_POINT_FOUND_V0',
      kind: 'POINT',
      effect: 'NOT_APPLICABLE',
      encoded: point.encoded,
      commitment: point.commitment,
    },
    {
      id: 'RESULT_MUTATION_REJECTED_SAME_ROOT_V0',
      kind: 'MUTATION',
      effect: 'NOT_COMMITTED_PROVEN',
      receipt: {
        operationPresent: true,
        operationId: rejectedOperation,
        beforeProjectionRoot: rejectedRoot,
        afterProjectionRoot: rejectedRoot,
      },
      encoded: rejected.encoded,
      commitment: rejected.commitment,
    },
    {
      id: 'RESULT_BOOTSTRAP_COMMITTED_CHANGING_ROOT_V0',
      kind: 'MUTATION',
      subjectKind: 'REALM',
      effect: 'COMMITTED',
      receipt: {
        operationPresent: false,
        operationId: ZERO,
        beforeProjectionRoot: beforeBootstrapRoot,
        afterProjectionRoot: afterBootstrapRoot,
      },
      encoded: bootstrap.encoded,
      commitment: bootstrap.commitment,
    },
  ],
};

const serialized = `${JSON.stringify(bundle, null, 2)}\n`;
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.resolve(__dirname, '../vectors/result-v0.json'), serialized);
  const solidityTestPath = path.resolve(__dirname, '../test-sol/ExpC0ResultCodec.t.sol');
  const solidityTest = fs.readFileSync(solidityTestPath, 'utf8');
  const [pointVector, rejectedVector, bootstrapVector] = bundle.vectors;
  const generated = [
    '    // GENERATED_RESULT_VECTORS_START',
    '    function _pointVector() internal pure returns (bytes memory, bytes32) {',
    '        return (',
    `            hex"${pointVector.encoded.slice(2)}",`,
    `            ${pointVector.commitment}`,
    '        );',
    '    }',
    '',
    '    function _rejectedVector() internal pure returns (bytes memory, bytes32) {',
    '        return (',
    `            hex"${rejectedVector.encoded.slice(2)}",`,
    `            ${rejectedVector.commitment}`,
    '        );',
    '    }',
    '',
    '    function _bootstrapVector() internal pure returns (bytes memory, bytes32) {',
    '        return (',
    `            hex"${bootstrapVector.encoded.slice(2)}",`,
    `            ${bootstrapVector.commitment}`,
    '        );',
    '    }',
    '    // GENERATED_RESULT_VECTORS_END',
  ].join('\n');
  const solidityMarkerPattern = /    \/\/ GENERATED_RESULT_VECTORS_START[\s\S]*?    \/\/ GENERATED_RESULT_VECTORS_END/;
  if (!solidityMarkerPattern.test(solidityTest)) throw new Error('Solidity vector fixture markers not found');
  const updatedSolidityTest = solidityTest.replace(solidityMarkerPattern, generated);
  fs.writeFileSync(solidityTestPath, updatedSolidityTest);
} else {
  process.stdout.write(serialized);
}
