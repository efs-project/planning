'use strict';

// Generated clean-room contract for disposable EXP-C0/v0 consumers. This
// generator may read experiment implementation modules; consumers may not.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const packetDir = path.resolve(__dirname, '..');
const planningRoot = path.resolve(packetDir, '../..');
const ethereumRequire = createRequire(path.join(planningRoot, '../contracts/package.json'));
const { keccak256, toUtf8Bytes } = ethereumRequire('ethers');

const {
  ABI,
  ENUMS,
  commitResultV0,
  decodeBytesPayload,
  decodeResultV0,
  encodeBytesPayload,
  encodeResultV0,
} = require('../src/result-v0.cjs');
const {
  LIMITS,
  TYPE_SCHEMA_ENVELOPE_ABI,
  TYPE_SCHEMA_PAYLOAD_V0_ABI,
} = require('../src/type-interpreter-v0.cjs');

const VERSION = 0;
const ARTIFACT_PATH = 'Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json';
const HELLO_PATH = 'Reviews/2026-08-25-efs2-exp-c0-v0-control/hello-files-v0.json';
const TYPE_VECTOR_PATH = 'Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/type-envelope-v0.json';

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function rawSha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function load(relativePath) {
  const resolved = path.resolve(planningRoot, relativePath);
  assert.ok(resolved.startsWith(`${planningRoot}${path.sep}`));
  const raw = fs.readFileSync(resolved);
  return { raw, value: JSON.parse(raw) };
}

function jsonSafe(value) {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, jsonSafe(entry)]));
  }
  return value;
}

function enumName(table, code) {
  const entry = Object.entries(table).find(([, value]) => value === code);
  assert.ok(entry, `unknown enum code ${code}`);
  return entry[0];
}

const helloArtifact = load(HELLO_PATH);
const typeVectorArtifact = load(TYPE_VECTOR_PATH);
const hello = helloArtifact.value;
const typeVector = typeVectorArtifact.value;

assert.equal(hello.protocolConformance, false);
assert.equal(hello.exactExecutableTraceReplayCountDelta, 0);
assert.equal(typeVector.protocolConformance, false);
assert.equal(typeVector.durable, false);
assert.equal(typeVector.deployable, false);
assert.equal(typeVector.exactExecutableTraceReplayCountDelta, 0);
assert.equal(typeVector.limits.wholeEnvelopeBytes, LIMITS.typeDescriptorBytes);
assert.equal(
  rawSha256(Buffer.from(canonicalJson(hello.payload))),
  hello.payloadSha256,
  'HELLO canonical payload hash must be current before generating the consumer contract',
);

const decodedResult = decodeResultV0(hello.payload.result.encoded);
assert.equal(encodeResultV0(decodedResult), hello.payload.result.encoded);
assert.equal(commitResultV0(decodedResult), hello.payload.result.commitment);
const decodedBytesPayload = decodeBytesPayload(decodedResult.payload.data);
assert.equal(encodeBytesPayload(decodedBytesPayload), decodedResult.payload.data);
assert.equal(keccak256(hello.payload.portable.fileBytes), hello.payload.portable.fileDigest);

const namedResult = {
  kind: enumName(ENUMS.kind, decodedResult.kind),
  subjectKind: enumName(ENUMS.subjectKind, decodedResult.subjectKind),
  payloadKind: enumName(ENUMS.payloadKind, decodedResult.payload.payloadKind),
  facts: Object.fromEntries(
    Object.entries(decodedResult.facts).map(([axis, code]) => [axis, enumName(ENUMS[axis], code)]),
  ),
  projectionIntegrity: enumName(ENUMS.projectionIntegrity, decodedResult.projectionIntegrity),
};

const observation = hello.payload.sourceObservation.evidence;
const contract = {
  format: 'efs2-exp-c0-v0-consumer-contract/0',
  status: 'DISPOSABLE_CONSUMER_CONTRACT',
  profile: 'EXP-C0/v0',
  protocolConformance: false,
  durable: false,
  productionReady: false,
  deploymentAuthorized: false,
  freezeAuthorized: false,
  exactExecutableTraceReplayCount: 0,
  artifactPath: ARTIFACT_PATH,
  nonadoption: {
    protocolConformance: false,
    durable: false,
    productionReady: false,
    deploymentAuthorized: false,
    freezeAuthorized: false,
    exactExecutableTraceReplayCount: 0,
    helloExactExecutableTraceReplayCountDelta: hello.exactExecutableTraceReplayCountDelta,
    typeEnvelopeExactExecutableTraceReplayCountDelta: typeVector.exactExecutableTraceReplayCountDelta,
  },
  canonicalJson: {
    id: 'EFS2_CANONICAL_JSON_V0',
    objectKeyOrder: 'ECMASCRIPT_DEFAULT_UTF16_CODE_UNIT_ASCENDING',
    arrayOrder: 'PRESERVE_INPUT_ORDER',
    primitiveEncoding: 'JSON.stringify',
    uint64Encoding: 'UNSIGNED_DECIMAL_STRING',
    whitespace: 'NONE',
    payloadSerialization: 'UTF-8(canonicalJson(value))',
    fileSerialization: 'UTF-8(canonicalJson(value) + LF)',
    trailingLineFeed: true,
  },
  resultV0: {
    profileVersion: VERSION,
    codec: 'SOLIDITY_ABI_V2_ABI_ENCODE',
    domainText: 'EFS2/EXP-C0/V0/RESULT',
    domain: keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/RESULT')),
    abi: ABI.RESULT,
    bytesPayloadAbi: ABI.BYTES_PAYLOAD,
    commitmentPreimage: {
      abiParameters: ['bytes32', 'uint16', ABI.RESULT],
      valueOrder: ['domain', 'profileVersion', 'resultV0'],
      hash: 'KECCAK256',
    },
    enums: ENUMS,
  },
  requiredJsonPointers: {
    shared: [
      '#/payload/result/encoded',
      '#/payload/result/commitment',
      '#/payload/result/observerBasis',
      '#/payload/portable/fileBytes',
      '#/payload/portable/fileDigest',
      '#/payload/portable/typeEnvelopes',
      '#/payload/projection/entries',
      '#/payload/projection/root',
      '#/payload/acquisition/packet/attempts',
      '#/payload/acquisition/commitment',
      '#/payload/sourceObservation/evidence',
      '#/payload/sourceObservation/commitment',
      '#/payload/query/cursor',
    ],
    sdk: [
      '#/payload/adapter/sdk/filesFacade',
      '#/payload/adapter/sdk/queryCursor',
      '#/payload/adapter/sdk/rawResultRef',
      '#/payload/adapter/sdk/rawResultCommitment',
      '#/payload/adapter/sdk/rawTypeEnvelopesRef',
      '#/payload/adapter/sdk/canonicalFileBytesRef',
      '#/payload/adapter/sdk/acquisitionAttemptsRef',
      '#/payload/adapter/sdk/observerBasisRef',
    ],
    explorer: [
      '#/payload/adapter/explorer/directGuest',
      '#/payload/adapter/explorer/listRow',
      '#/payload/adapter/explorer/inspector',
      '#/payload/adapter/explorer/requiresWallet',
      '#/payload/adapter/explorer/requiresAccount',
      '#/payload/adapter/explorer/requiresCommons',
      '#/payload/adapter/explorer/requiresHostedIndexer',
      '#/payload/adapter/explorer/requiresOsBoot',
    ],
  },
  helloExpected: {
    artifactPath: HELLO_PATH,
    artifactSha256: rawSha256(helloArtifact.raw),
    payloadSha256: hello.payloadSha256,
    decodedResult: jsonSafe(decodedResult),
    decodedBytesPayload: jsonSafe(decodedBytesPayload),
    namedResult,
    semanticFacts: {
      projection: {
        root: hello.payload.projection.root,
        entryCount: hello.payload.projection.entryCount,
        populatedKinds: hello.payload.projection.populatedKinds,
        declaredEmptyCollectionKinds: hello.payload.projection.declaredEmptyCollectionKinds,
      },
      acquisition: {
        commitment: hello.payload.acquisition.commitment,
        final: hello.payload.acquisition.final,
        attempts: hello.payload.acquisition.packet.attempts.map((attempt) => ({
          ordinal: attempt.ordinal,
          eligible: attempt.eligible,
          outcome: attempt.outcome,
          expectedDigest: attempt.expectedDigest,
          observedDigest: attempt.observedDigest,
          observerBasis: attempt.observerBasis,
        })),
      },
      sourceObservation: {
        commitment: hello.payload.sourceObservation.commitment,
        resultV0Commitment: observation.resultV0Commitment,
        requestCommitment: observation.requestCommitment,
        sourceDescriptorCommitment: observation.sourceDescriptorCommitment,
        observedBlockNumber: observation.observedBlockNumber,
        observedBlockHash: observation.observedBlockHash,
        observedStateRoot: observation.observedStateRoot,
        canonicalityAssessment: observation.canonicalityAssessment,
        proofKind: observation.proofKind,
        proofScope: observation.proofScope,
        proofScopeCommitment: observation.proofScopeCommitment,
        causalAvailability: observation.causalAvailability,
      },
      cursor: hello.payload.query.cursor,
      adapterReferences: {
        sdk: {
          acquisitionAttemptsRef: hello.payload.adapter.sdk.acquisitionAttemptsRef,
          canonicalFileBytesRef: hello.payload.adapter.sdk.canonicalFileBytesRef,
          observerBasisRef: hello.payload.adapter.sdk.observerBasisRef,
          rawResultRef: hello.payload.adapter.sdk.rawResultRef,
          rawTypeEnvelopesRef: hello.payload.adapter.sdk.rawTypeEnvelopesRef,
        },
        explorer: {
          acquisitionAttemptsRef: hello.payload.adapter.explorer.inspector.acquisitionAttemptsRef,
          canonicalFileBytesRef: hello.payload.adapter.explorer.inspector.canonicalFileBytesRef,
          observerBasisRef: hello.payload.adapter.explorer.inspector.observerBasisRef,
          rawResultRef: hello.payload.adapter.explorer.inspector.rawResultRef,
          rawTypeEnvelopesRef: hello.payload.adapter.explorer.inspector.rawTypeEnvelopesRef,
        },
      },
      file: {
        digestAlgorithm: 'KECCAK256',
        bytes: hello.payload.portable.fileBytes,
        digest: hello.payload.portable.fileDigest,
        byteLength: hello.payload.adapter.sdk.filesFacade.byteLength,
        contentTypeBytes: hello.payload.adapter.sdk.filesFacade.contentTypeBytes,
        entryNameBytes: hello.payload.adapter.sdk.filesFacade.nameBytes,
        parentDirectoryRecordId: hello.payload.adapter.sdk.filesFacade.parentDirectoryRecordId,
        recordIds: hello.payload.portable.recordIds,
        typeSchemaIds: hello.payload.portable.typeSchemaIds,
      },
    },
  },
  explorer: {
    forbiddenDependencies: {
      requiresWallet: false,
      requiresAccount: false,
      requiresCommons: false,
      requiresHostedIndexer: false,
      requiresOsBoot: false,
    },
    evidenceCeiling: {
      serializedDependencyClaimsOnly: true,
      runtimeDependencyTrace: 'NOT_RUN',
      e1a: 'NOT_PROVEN_BY_THIS_CONTRACT',
      e1b: 'NOT_RUN',
    },
    forbiddenOwnership: ['CORE_CODEC', 'CORE_VERIFIER', 'CORE_RESOLVER', 'LENS_REDUCER'],
  },
  typeSchemaEnvelopeV0: {
    profileVersion: VERSION,
    domainText: 'EFS2/EXP-C0/V0/TYPE',
    domain: keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/TYPE')),
    outerEnvelopeAbi: TYPE_SCHEMA_ENVELOPE_ABI,
    codec0PayloadAbi: TYPE_SCHEMA_PAYLOAD_V0_ABI,
    identityPreimage: {
      abiParameters: ['bytes32', 'uint16', 'uint16', 'bytes'],
      valueOrder: ['domain', 'profileVersion', 'codecVersion', 'payloadBytes'],
      hash: 'KECCAK256',
    },
    wholeEnvelopeByteCap: LIMITS.typeDescriptorBytes,
    codec0: typeVector.codec0.expected,
    codec1: typeVector.opaqueCodec1.expected,
    vector: {
      path: TYPE_VECTOR_PATH,
      sha256: rawSha256(typeVectorArtifact.raw),
    },
  },
  sameSourceReceipt: {
    format: 'efs2-exp-c0-v0-same-source-lock-receipt/0',
    serialization: 'UTF-8(JSON.stringify(receipt) + LF)',
    topLevelFieldOrder: [
      'format', 'profile', 'corePacketCommit', 'handoffSha256',
      'consumerContractSha256', 'artifactLocks', 'helloPayloadSha256',
      'protocolConformance', 'durable', 'productionReady',
      'deploymentAuthorized', 'freezeAuthorized',
    ],
    artifactLockFieldOrder: ['path', 'sha256'],
    artifactOrder: 'LEXICOGRAPHIC_PATH_ASCENDING',
    artifactSet: 'EXACT_HANDOFF_PINNED_VECTORS',
    additionalProperties: false,
    roleSpecificFieldsForbidden: true,
    forbiddenEnvironmentFields: [
      'consumer', 'lane', 'role', 'timestamp', 'generatedAt', 'environment',
      'nodeVersion', 'platform', 'architecture', 'cwd', 'absolutePath',
    ],
    fieldTypes: {
      format: 'literal:efs2-exp-c0-v0-same-source-lock-receipt/0',
      profile: 'literal:EXP-C0/v0',
      corePacketCommit: 'lowercase-hex-40',
      handoffSha256: 'lowercase-hex-64',
      consumerContractSha256: 'lowercase-hex-64',
      artifactLocks: 'array:{path=repo-relative-string,sha256=lowercase-hex-64}',
      helloPayloadSha256: 'lowercase-hex-64',
      protocolConformance: 'literal:false',
      durable: 'literal:false',
      productionReady: 'literal:false',
      deploymentAuthorized: 'literal:false',
      freezeAuthorized: 'literal:false',
    },
  },
};

process.stdout.write(`${canonicalJson(contract)}\n`);
