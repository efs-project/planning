'use strict';

// Clean-room consumer test. This file intentionally imports no EXP-C0 source,
// generator, script, or test helper. Its only non-Node dependency is ethers;
// every EFS fact comes from serialized JSON artifacts.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');

const packetDir = path.resolve(__dirname, '..');
const planningRoot = path.resolve(packetDir, '../..');
const ethereumRequire = createRequire(path.join(planningRoot, '../contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const contractPath = path.join(packetDir, 'consumer-contract-v0.json');
const handoffPath = path.join(packetDir, 'handoff-v0.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));

const RESULT_ABI = 'tuple(uint8,uint8,bytes,tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,uint64),tuple(bool,uint32),tuple(bool,tuple(bytes32,bytes32,uint8,uint8,uint64)),tuple(tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,uint32),tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,bytes32)),tuple(uint8,uint8,uint8,uint8,uint8,uint8,uint8,uint8,uint8),tuple(uint8,bytes),tuple(bool,bytes,bytes32),uint8)';
const BYTES_PAYLOAD_ABI = 'tuple(bytes32,bytes32,bool,bytes)';
const TYPE_PAYLOAD_ABI = 'tuple(bytes,tuple(tuple(uint16,uint8,bool,uint16)[]),tuple(uint8,uint8),tuple(uint16,uint8)[],tuple(uint16,uint8,bytes32)[])';

const ENUMS = {
  kind: { MUTATION: 1, POINT: 2, SCOPE: 3, REQUEST: 4, VERIFIER: 5, AGGREGATE: 6, BYTES: 7, SUBMISSION: 8, RECONSTRUCTION: 9 },
  subjectKind: { REALM: 1, TYPE: 2, RECORD: 3, OCCURRENCE: 4, ADMISSION: 5, BINDING: 6, QUERY: 7, LENS: 8, OPERATION: 9, PROJECTION: 10, COLLECTION_ENTRY: 11 },
  observerSource: { ONCHAIN_ATOMIC: 1, AUTHENTICATED_OBSERVER: 2, SOURCE_OBSERVED: 3 },
  finality: { UNPROVEN: 1, OBSERVED_FINAL: 2 },
  presence: { FOUND: 1, ABSENT_PROVEN: 2, UNKNOWN: 3, CONFLICT: 4, OPAQUE: 5, MASKED: 6, NOT_APPLICABLE: 255 },
  coverage: { COMPLETE: 1, PARTIAL: 2, NOT_APPLICABLE: 255 },
  support: { SUPPORTED: 1, UNSUPPORTED: 2, LIMIT_EXCEEDED: 3, NOT_APPLICABLE: 255 },
  validation: { STRUCTURALLY_VALID: 1, SEMANTICALLY_VALID: 2, INVALID: 3, UNPROVEN: 4, NOT_APPLICABLE: 255 },
  authority: { AUTHORIZED: 1, DENIED: 2, UNPROVEN: 3, NOT_APPLICABLE: 255 },
  lifecycle: { ADMITTED: 1, WITHDRAWN: 2, CARRIED_ONLY: 3, UNPROVEN: 4, NOT_APPLICABLE: 255 },
  selection: { CURRENT: 1, NOT_CURRENT: 2, CONFLICT: 3, UNKNOWN: 4, NOT_APPLICABLE: 255 },
  bytes: { VERIFIED_AVAILABLE: 1, PARTIAL: 2, UNAVAILABLE: 3, INTEGRITY_FAILED: 4, NOT_APPLICABLE: 255 },
  effect: { COMMITTED: 1, NOT_COMMITTED_PROVEN: 2, UNKNOWN: 3, NOT_APPLICABLE: 255 },
  projectionIntegrity: { MATCHED: 1, MISSING_REQUIRED_ITEM: 2, INTEGRITY_FAILED: 3, NOT_APPLICABLE: 255 },
  payloadKind: { POINT: 1, PAGE: 2, MUTATION: 3, SUBMISSION: 4, BYTES: 5, RECONSTRUCTION: 6, REQUEST: 7, VERIFIER: 8, AGGREGATE: 9 },
};

const REQUIRED_POINTERS = {
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
};

const RECEIPT = {
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
};

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

function loadArtifact(relativePath) {
  const resolved = path.resolve(planningRoot, relativePath);
  assert.ok(resolved.startsWith(`${planningRoot}${path.sep}`), 'artifact path must remain below planning root');
  return { resolved, raw: fs.readFileSync(resolved) };
}

function resolvePointer(document, pointer) {
  assert.match(pointer, /^#\/(?:[^/]+(?:\/[^/]+)*)?$/);
  return pointer.slice(2).split('/').reduce((value, token) => {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
    assert.ok(!['__proto__', 'prototype', 'constructor'].includes(key), 'unsafe JSON pointer token');
    assert.ok(value !== null && typeof value === 'object' && Object.hasOwn(value, key), `missing pointer ${pointer}`);
    return value[key];
  }, document);
}

function optionalB32(value) {
  return { present: value[0], value: value[1] };
}

function optionalUint(value, wide = false) {
  return { present: value[0], value: wide ? value[1].toString() : Number(value[1]) };
}

function decodedResult(value) {
  const observer = value[7];
  const profiles = value[8];
  const facts = value[9];
  return {
    kind: Number(value[0]),
    subjectKind: Number(value[1]),
    subject: value[2],
    realmId: optionalB32(value[3]),
    realmRevisionId: optionalB32(value[4]),
    executionCoordinate: optionalUint(value[5], true),
    admissionHighWater: optionalUint(value[6]),
    observerBasis: {
      present: observer[0],
      value: {
        blockHash: observer[1][0],
        stateRoot: observer[1][1],
        sourceKind: Number(observer[1][2]),
        finality: Number(observer[1][3]),
        freshnessCoordinate: observer[1][4].toString(),
      },
    },
    profileCommitments: {
      typeSchemaId: optionalB32(profiles[0]),
      queryProfileId: optionalB32(profiles[1]),
      queryGeneration: optionalUint(profiles[2]),
      policyId: optionalB32(profiles[3]),
      verifierProfileId: optionalB32(profiles[4]),
      codeCommitment: optionalB32(profiles[5]),
      dependencyCommitment: optionalB32(profiles[6]),
      resolutionPlanId: optionalB32(profiles[7]),
    },
    facts: {
      presence: Number(facts[0]), coverage: Number(facts[1]), support: Number(facts[2]),
      validation: Number(facts[3]), authority: Number(facts[4]), lifecycle: Number(facts[5]),
      selection: Number(facts[6]), bytes: Number(facts[7]), effect: Number(facts[8]),
    },
    payload: { payloadKind: Number(value[10][0]), data: value[10][1] },
    rawRetention: { present: value[11][0], canonicalBytes: value[11][1], commitment: value[11][2] },
    projectionIntegrity: Number(value[12]),
  };
}

function enumName(table, code) {
  return Object.entries(table).find(([, value]) => value === code)?.[0];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoPlaceholders(value) {
  if (typeof value === 'string') {
    assert.doesNotMatch(value, /(?:<[^>]+>|\bTBD\b|\bTODO\b|PLACEHOLDER)/i);
  } else if (Array.isArray(value)) {
    value.forEach(assertNoPlaceholders);
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(assertNoPlaceholders);
  }
}

function validateConsumerContract(candidate) {
  assertNoPlaceholders(candidate);
  assert.equal(candidate.format, 'efs2-exp-c0-v0-consumer-contract/0');
  assert.equal(candidate.status, 'DISPOSABLE_CONSUMER_CONTRACT');
  assert.equal(candidate.profile, 'EXP-C0/v0');
  for (const key of ['protocolConformance', 'durable', 'productionReady', 'deploymentAuthorized', 'freezeAuthorized']) {
    assert.equal(candidate[key], false);
    assert.equal(candidate.nonadoption[key], false);
  }
  assert.equal(candidate.exactExecutableTraceReplayCount, 0);
  assert.equal(candidate.nonadoption.exactExecutableTraceReplayCount, 0);
  assert.equal(candidate.nonadoption.helloExactExecutableTraceReplayCountDelta, 0);
  assert.equal(candidate.nonadoption.typeEnvelopeExactExecutableTraceReplayCountDelta, 0);

  assert.deepEqual(candidate.canonicalJson, {
    id: 'EFS2_CANONICAL_JSON_V0',
    objectKeyOrder: 'ECMASCRIPT_DEFAULT_UTF16_CODE_UNIT_ASCENDING',
    arrayOrder: 'PRESERVE_INPUT_ORDER',
    primitiveEncoding: 'JSON.stringify',
    uint64Encoding: 'UNSIGNED_DECIMAL_STRING',
    whitespace: 'NONE',
    payloadSerialization: 'UTF-8(canonicalJson(value))',
    fileSerialization: 'UTF-8(canonicalJson(value) + LF)',
    trailingLineFeed: true,
  });

  assert.equal(candidate.resultV0.profileVersion, 0);
  assert.equal(candidate.resultV0.codec, 'SOLIDITY_ABI_V2_ABI_ENCODE');
  assert.equal(candidate.resultV0.domainText, 'EFS2/EXP-C0/V0/RESULT');
  assert.equal(candidate.resultV0.domain, keccak256(toUtf8Bytes(candidate.resultV0.domainText)));
  assert.equal(candidate.resultV0.abi, RESULT_ABI);
  assert.equal(candidate.resultV0.bytesPayloadAbi, BYTES_PAYLOAD_ABI);
  assert.deepEqual(candidate.resultV0.commitmentPreimage, {
    abiParameters: ['bytes32', 'uint16', RESULT_ABI],
    valueOrder: ['domain', 'profileVersion', 'resultV0'],
    hash: 'KECCAK256',
  });
  assert.deepEqual(candidate.resultV0.enums, ENUMS);

  assert.deepEqual(candidate.requiredJsonPointers, REQUIRED_POINTERS);
  const helloArtifact = loadArtifact(candidate.helloExpected.artifactPath);
  assert.equal(rawSha256(helloArtifact.raw), candidate.helloExpected.artifactSha256);
  const hello = JSON.parse(helloArtifact.raw);
  assert.equal(rawSha256(Buffer.from(canonicalJson(hello.payload))), hello.payloadSha256);
  assert.equal(candidate.helloExpected.payloadSha256, hello.payloadSha256);
  for (const pointers of Object.values(candidate.requiredJsonPointers)) {
    pointers.forEach((pointer) => resolvePointer(hello, pointer));
  }

  const resultBytes = resolvePointer(hello, '#/payload/result/encoded');
  const result = abi.decode([candidate.resultV0.abi], resultBytes)[0];
  assert.equal(abi.encode([candidate.resultV0.abi], [result]), resultBytes);
  const resultCommitment = keccak256(abi.encode(
    candidate.resultV0.commitmentPreimage.abiParameters,
    [candidate.resultV0.domain, candidate.resultV0.profileVersion, result],
  ));
  assert.equal(resultCommitment, resolvePointer(hello, '#/payload/result/commitment'));
  const plainResult = decodedResult(result);
  assert.deepEqual(plainResult, candidate.helloExpected.decodedResult);

  const bytesPayload = abi.decode([candidate.resultV0.bytesPayloadAbi], plainResult.payload.data)[0];
  assert.equal(abi.encode([candidate.resultV0.bytesPayloadAbi], [bytesPayload]), plainResult.payload.data);
  const plainBytesPayload = {
    recordId: bytesPayload[0],
    expectedDigest: bytesPayload[1],
    bytesPresent: bytesPayload[2],
    availableBytes: bytesPayload[3],
  };
  assert.deepEqual(plainBytesPayload, candidate.helloExpected.decodedBytesPayload);

  const named = candidate.helloExpected.namedResult;
  assert.equal(named.kind, enumName(ENUMS.kind, plainResult.kind));
  assert.equal(named.subjectKind, enumName(ENUMS.subjectKind, plainResult.subjectKind));
  assert.equal(named.payloadKind, enumName(ENUMS.payloadKind, plainResult.payload.payloadKind));
  for (const [axis, code] of Object.entries(plainResult.facts)) {
    assert.equal(named.facts[axis], enumName(ENUMS[axis], code));
  }
  assert.equal(named.projectionIntegrity, enumName(ENUMS.projectionIntegrity, plainResult.projectionIntegrity));

  const expected = candidate.helloExpected.semanticFacts;
  assert.deepEqual(expected.projection, {
    root: hello.payload.projection.root,
    entryCount: hello.payload.projection.entryCount,
    populatedKinds: hello.payload.projection.populatedKinds,
    declaredEmptyCollectionKinds: hello.payload.projection.declaredEmptyCollectionKinds,
  });
  assert.deepEqual(expected.cursor, hello.payload.query.cursor);
  const adapterReferences = {
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
  };
  assert.deepEqual(expected.adapterReferences, adapterReferences);
  assert.deepEqual(adapterReferences.sdk, adapterReferences.explorer);
  for (const pointer of Object.values(adapterReferences.sdk)) resolvePointer(hello, pointer);
  assert.deepEqual(expected.file, {
    digestAlgorithm: 'KECCAK256',
    bytes: hello.payload.portable.fileBytes,
    digest: hello.payload.portable.fileDigest,
    byteLength: hello.payload.adapter.sdk.filesFacade.byteLength,
    contentTypeBytes: hello.payload.adapter.sdk.filesFacade.contentTypeBytes,
    entryNameBytes: hello.payload.adapter.sdk.filesFacade.nameBytes,
    parentDirectoryRecordId: hello.payload.adapter.sdk.filesFacade.parentDirectoryRecordId,
    recordIds: hello.payload.portable.recordIds,
    typeSchemaIds: hello.payload.portable.typeSchemaIds,
  });
  assert.equal(keccak256(expected.file.bytes), expected.file.digest);
  assert.deepEqual(expected.acquisition, {
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
  });
  const observation = hello.payload.sourceObservation.evidence;
  assert.deepEqual(expected.sourceObservation, {
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
  });
  assert.equal(expected.sourceObservation.resultV0Commitment, resultCommitment);
  assert.equal(expected.acquisition.final.resultV0Commitment, resultCommitment);
  assert.equal(expected.acquisition.final.expectedDigest, expected.file.digest);

  assert.deepEqual(candidate.explorer.forbiddenDependencies, {
    requiresWallet: false,
    requiresAccount: false,
    requiresCommons: false,
    requiresHostedIndexer: false,
    requiresOsBoot: false,
  });
  for (const [key, value] of Object.entries(candidate.explorer.forbiddenDependencies)) {
    assert.equal(hello.payload.adapter.explorer[key], value);
  }
  assert.deepEqual(candidate.explorer.evidenceCeiling, {
    serializedDependencyClaimsOnly: true,
    runtimeDependencyTrace: 'NOT_RUN',
    e1a: 'NOT_PROVEN_BY_THIS_CONTRACT',
    e1b: 'NOT_RUN',
  });
  assert.deepEqual(candidate.explorer.forbiddenOwnership, [
    'CORE_CODEC', 'CORE_VERIFIER', 'CORE_RESOLVER', 'LENS_REDUCER',
  ]);

  const typeContract = candidate.typeSchemaEnvelopeV0;
  assert.equal(typeContract.profileVersion, 0);
  assert.equal(typeContract.domainText, 'EFS2/EXP-C0/V0/TYPE');
  assert.equal(typeContract.domain, keccak256(toUtf8Bytes(typeContract.domainText)));
  assert.deepEqual(typeContract.outerEnvelopeAbi, ['uint16', 'bytes']);
  assert.equal(typeContract.codec0PayloadAbi, TYPE_PAYLOAD_ABI);
  assert.equal(typeContract.wholeEnvelopeByteCap, 2048);
  assert.deepEqual(typeContract.identityPreimage, {
    abiParameters: ['bytes32', 'uint16', 'uint16', 'bytes'],
    valueOrder: ['domain', 'profileVersion', 'codecVersion', 'payloadBytes'],
    hash: 'KECCAK256',
  });

  const typeArtifact = loadArtifact(typeContract.vector.path);
  assert.equal(rawSha256(typeArtifact.raw), typeContract.vector.sha256);
  const vector = JSON.parse(typeArtifact.raw);
  assert.equal(vector.limits.wholeEnvelopeBytes, typeContract.wholeEnvelopeByteCap);
  for (const [name, grading] of [['codec0', typeContract.codec0], ['opaqueCodec1', typeContract.codec1]]) {
    const entry = vector[name];
    assert.ok((entry.rawTypeBytes.length - 2) / 2 <= typeContract.wholeEnvelopeByteCap);
    const envelope = abi.decode(typeContract.outerEnvelopeAbi, entry.rawTypeBytes);
    assert.equal(abi.encode(typeContract.outerEnvelopeAbi, envelope), entry.rawTypeBytes);
    assert.equal(Number(envelope[0]), entry.codecVersion);
    assert.equal(envelope[1], entry.payloadBytes);
    const typeId = keccak256(abi.encode(
      typeContract.identityPreimage.abiParameters,
      [typeContract.domain, typeContract.profileVersion, envelope[0], envelope[1]],
    ));
    assert.equal(typeId, entry.typeSchemaId);
    assert.deepEqual(grading, entry.expected);
    if (name === 'codec0') {
      const payload = abi.decode([typeContract.codec0PayloadAbi], envelope[1]);
      assert.equal(abi.encode([typeContract.codec0PayloadAbi], payload), envelope[1]);
    }
  }
  assert.deepEqual(typeContract.codec1, {
    support: 'UNSUPPORTED',
    validation: 'UNPROVEN',
    semanticReconstruction: 'INCOMPLETE',
    rawRetention: 'EXACT',
    c0Admission: 'ZERO_EFFECT_REJECT',
  });

  assert.deepEqual(candidate.sameSourceReceipt, RECEIPT);
  for (const pinned of handoff.pinnedVectors) {
    const artifact = loadArtifact(pinned.path);
    assert.equal(rawSha256(artifact.raw), pinned.sha256, pinned.path);
  }
  const selfPin = handoff.pinnedVectors.find(({ path: pinnedPath }) => pinnedPath === candidate.artifactPath);
  assert.ok(selfPin, 'handoff must pin the consumer contract');
  assert.equal(selfPin.sha256, rawSha256(fs.readFileSync(contractPath)));
}

test('serialized contract is sufficient for clean-room Result, Bytes, Type, HELLO, and lock validation', () => {
  validateConsumerContract(contract);
});

test('clean-room validation rejects placeholders and stale ABI, enum, domain, pointer, fact, grading, and receipt mutations', () => {
  const mutations = [
    (value) => { value.resultV0.abi += ' '; },
    (value) => { value.resultV0.enums.authority.UNPROVEN = 9; },
    (value) => { value.resultV0.domainText = 'EFS2/EXP-C0/V1/RESULT'; },
    (value) => { value.requiredJsonPointers.shared[0] = '#/payload/result/missing'; },
    (value) => { value.helloExpected.semanticFacts.adapterReferences.sdk.rawResultRef = '#/payload/result/commitment'; },
    (value) => { value.helloExpected.namedResult.facts.authority = 'AUTHORIZED'; },
    (value) => { value.helloExpected.semanticFacts.file.digest = `0x${'11'.repeat(32)}`; },
    (value) => { value.helloExpected.decodedResult.executionCoordinate.value = 'TBD'; },
    (value) => { value.canonicalJson.objectKeyOrder = 'LOCALE'; },
    (value) => { value.typeSchemaEnvelopeV0.domainText = 'EFS2/EXP-C0/V1/TYPE'; },
    (value) => { value.typeSchemaEnvelopeV0.vector.sha256 = '00'.repeat(32); },
    (value) => { value.typeSchemaEnvelopeV0.codec1.support = 'SUPPORTED'; },
    (value) => { value.explorer.forbiddenDependencies.requiresWallet = true; },
    (value) => { value.sameSourceReceipt.topLevelFieldOrder.push('timestamp'); },
    (value) => { value.sameSourceReceipt.additionalProperties = true; },
    (value) => { value.protocolConformance = true; },
  ];
  for (const mutate of mutations) {
    const changed = clone(contract);
    mutate(changed);
    assert.throws(() => validateConsumerContract(changed));
  }
});
