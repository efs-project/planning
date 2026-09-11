import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const reviewDir = path.dirname(fileURLToPath(import.meta.url));
const planningRoot = path.resolve(reviewDir, '../..');
const coreRoot = path.resolve(planningRoot, '../planning-v2-readiness');
const coreInputsDir = path.resolve(reviewDir, 'core-inputs');
const corePacketPath = 'Reviews/2026-08-25-efs2-exp-c0-v0-control';
const ethereumRequire = createRequire(path.resolve(planningRoot, '../contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const PENDING_CORE_COMMIT = 'PENDING_CORE_COMMIT_AFTER_FINAL_REPAIR';
const EXPECTED_CORE_COMMIT = 'b9088d6a24f4d40bcca6ba300523b25cc7c608d2';
const RECEIPT_PATH = 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-source-lock-v0.json';
const REPORT_PATH = 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/sdk-consumption-v0.json';
const EXPECTED_RESULT_ABI = 'tuple(uint8,uint8,bytes,tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,uint64),tuple(bool,uint32),tuple(bool,tuple(bytes32,bytes32,uint8,uint8,uint64)),tuple(tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,uint32),tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,bytes32),tuple(bool,bytes32)),tuple(uint8,uint8,uint8,uint8,uint8,uint8,uint8,uint8,uint8),tuple(uint8,bytes),tuple(bool,bytes,bytes32),uint8)';
const EXPECTED_BYTES_PAYLOAD_ABI = 'tuple(bytes32,bytes32,bool,bytes)';
const EXPECTED_CODEC0_PAYLOAD_ABI = 'tuple(bytes,tuple(tuple(uint16,uint8,bool,uint16)[]),tuple(uint8,uint8),tuple(uint16,uint8)[],tuple(uint16,uint8,bytes32)[])';
const EXPECTED_ENUMS = {
  authority: { AUTHORIZED: 1, DENIED: 2, NOT_APPLICABLE: 255, UNPROVEN: 3 },
  bytes: { INTEGRITY_FAILED: 4, NOT_APPLICABLE: 255, PARTIAL: 2, UNAVAILABLE: 3, VERIFIED_AVAILABLE: 1 },
  coverage: { COMPLETE: 1, NOT_APPLICABLE: 255, PARTIAL: 2 },
  effect: { COMMITTED: 1, NOT_APPLICABLE: 255, NOT_COMMITTED_PROVEN: 2, UNKNOWN: 3 },
  finality: { OBSERVED_FINAL: 2, UNPROVEN: 1 },
  kind: { AGGREGATE: 6, BYTES: 7, MUTATION: 1, POINT: 2, RECONSTRUCTION: 9, REQUEST: 4, SCOPE: 3, SUBMISSION: 8, VERIFIER: 5 },
  lifecycle: { ADMITTED: 1, CARRIED_ONLY: 3, NOT_APPLICABLE: 255, UNPROVEN: 4, WITHDRAWN: 2 },
  observerSource: { AUTHENTICATED_OBSERVER: 2, ONCHAIN_ATOMIC: 1, SOURCE_OBSERVED: 3 },
  payloadKind: { AGGREGATE: 9, BYTES: 5, MUTATION: 3, PAGE: 2, POINT: 1, RECONSTRUCTION: 6, REQUEST: 7, SUBMISSION: 4, VERIFIER: 8 },
  presence: { ABSENT_PROVEN: 2, CONFLICT: 4, FOUND: 1, MASKED: 6, NOT_APPLICABLE: 255, OPAQUE: 5, UNKNOWN: 3 },
  projectionIntegrity: { INTEGRITY_FAILED: 3, MATCHED: 1, MISSING_REQUIRED_ITEM: 2, NOT_APPLICABLE: 255 },
  selection: { CONFLICT: 3, CURRENT: 1, NOT_APPLICABLE: 255, NOT_CURRENT: 2, UNKNOWN: 4 },
  subjectKind: { ADMISSION: 5, BINDING: 6, COLLECTION_ENTRY: 11, LENS: 8, OCCURRENCE: 4, OPERATION: 9, PROJECTION: 10, QUERY: 7, REALM: 1, RECORD: 3, TYPE: 2 },
  support: { LIMIT_EXCEEDED: 3, NOT_APPLICABLE: 255, SUPPORTED: 1, UNSUPPORTED: 2 },
  validation: { INVALID: 3, NOT_APPLICABLE: 255, SEMANTICALLY_VALID: 2, STRUCTURALLY_VALID: 1, UNPROVEN: 4 },
};
const EXPECTED_REQUIRED_POINTERS = {
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

const allowedCoreInputs = [
  `${corePacketPath}/consumer-contract-v0.json`,
  `${corePacketPath}/handoff-v0.json`,
  `${corePacketPath}/hello-files-v0.json`,
  `${corePacketPath}/vectors/result-v0.json`,
  `${corePacketPath}/vectors/type-envelope-v0.json`,
];

const sourceFiles = Object.fromEntries(allowedCoreInputs.map((relativePath) => {
  const packetRelativePath = relativePath.slice(`${corePacketPath}/`.length);
  const raw = readFileSync(path.resolve(coreInputsDir, packetRelativePath));
  return [relativePath, { raw, json: JSON.parse(raw.toString('utf8')) }];
}));

const byName = (name) => sourceFiles[`${corePacketPath}/${name}`];
const contractFile = byName('consumer-contract-v0.json');
const handoffFile = byName('handoff-v0.json');
const helloFile = byName('hello-files-v0.json');
const resultVectorFile = byName('vectors/result-v0.json');
const typeVectorFile = byName('vectors/type-envelope-v0.json');
const contract = contractFile.json;
const handoff = handoffFile.json;
const hello = helloFile.json;
const resultVectors = resultVectorFile.json;
const typeVectors = typeVectorFile.json;

const receiptRaw = readFileSync(path.resolve(planningRoot, RECEIPT_PATH));
const reportRaw = readFileSync(path.resolve(planningRoot, REPORT_PATH));
const receipt = JSON.parse(receiptRaw.toString('utf8'));
const report = JSON.parse(reportRaw.toString('utf8'));

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const sha256HexBytes = (value) => sha256(Buffer.from(value.slice(2), 'hex'));
const asNumber = (value) => Number(value);
const asDecimalString = (value) => BigInt(value).toString(10);

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveJsonPointer(document, pointer) {
  assert.match(pointer, /^#(?:\/|$)/, `invalid JSON pointer ${pointer}`);
  if (pointer === '#') return document;
  return pointer.slice(2).split('/').reduce((value, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    assert(value !== null && typeof value === 'object' && key in value, `unresolved JSON pointer ${pointer}`);
    return value[key];
  }, document);
}

function optionBytes32(value) {
  return { present: Boolean(value[0]), value: value[1] };
}

function optionUint32(value) {
  return { present: Boolean(value[0]), value: asNumber(value[1]) };
}

function optionUint64(value) {
  return { present: Boolean(value[0]), value: asDecimalString(value[1]) };
}

function decodeResultPlain(encoded, resultAbi = contract.resultV0.abi) {
  const decoded = abi.decode([resultAbi], encoded)[0];
  assert.equal(abi.encode([resultAbi], [decoded]).toLowerCase(), encoded.toLowerCase(), 'ResultV0 is not canonical ABI');
  return {
    kind: asNumber(decoded[0]),
    subjectKind: asNumber(decoded[1]),
    subject: decoded[2],
    realmId: optionBytes32(decoded[3]),
    realmRevisionId: optionBytes32(decoded[4]),
    executionCoordinate: optionUint64(decoded[5]),
    admissionHighWater: optionUint32(decoded[6]),
    observerBasis: {
      present: Boolean(decoded[7][0]),
      value: {
        blockHash: decoded[7][1][0],
        stateRoot: decoded[7][1][1],
        sourceKind: asNumber(decoded[7][1][2]),
        finality: asNumber(decoded[7][1][3]),
        freshnessCoordinate: asDecimalString(decoded[7][1][4]),
      },
    },
    profileCommitments: {
      typeSchemaId: optionBytes32(decoded[8][0]),
      queryProfileId: optionBytes32(decoded[8][1]),
      queryGeneration: optionUint32(decoded[8][2]),
      policyId: optionBytes32(decoded[8][3]),
      verifierProfileId: optionBytes32(decoded[8][4]),
      codeCommitment: optionBytes32(decoded[8][5]),
      dependencyCommitment: optionBytes32(decoded[8][6]),
      resolutionPlanId: optionBytes32(decoded[8][7]),
    },
    facts: {
      presence: asNumber(decoded[9][0]),
      coverage: asNumber(decoded[9][1]),
      support: asNumber(decoded[9][2]),
      validation: asNumber(decoded[9][3]),
      authority: asNumber(decoded[9][4]),
      lifecycle: asNumber(decoded[9][5]),
      selection: asNumber(decoded[9][6]),
      bytes: asNumber(decoded[9][7]),
      effect: asNumber(decoded[9][8]),
    },
    payload: { payloadKind: asNumber(decoded[10][0]), data: decoded[10][1] },
    rawRetention: {
      present: Boolean(decoded[11][0]),
      canonicalBytes: decoded[11][1],
      commitment: decoded[11][2],
    },
    projectionIntegrity: asNumber(decoded[12]),
  };
}

function decodeBytesPayloadPlain(encoded, bytesPayloadAbi = contract.resultV0.bytesPayloadAbi) {
  const decoded = abi.decode([bytesPayloadAbi], encoded)[0];
  assert.equal(abi.encode([bytesPayloadAbi], [decoded]).toLowerCase(), encoded.toLowerCase(), 'BytesPayloadV0 is not canonical ABI');
  return {
    recordId: decoded[0],
    expectedDigest: decoded[1],
    bytesPresent: Boolean(decoded[2]),
    availableBytes: decoded[3],
  };
}

function resultCommitment(encoded, candidateContract = contract) {
  const decoded = abi.decode([candidateContract.resultV0.abi], encoded)[0];
  return keccak256(abi.encode(
    candidateContract.resultV0.commitmentPreimage.abiParameters,
    [candidateContract.resultV0.domain, candidateContract.resultV0.profileVersion, decoded],
  ));
}

function decodeTypeEnvelope(rawTypeBytes, candidateContract = contract) {
  const cap = candidateContract.typeSchemaEnvelopeV0.wholeEnvelopeByteCap;
  assert((rawTypeBytes.length - 2) / 2 <= cap, 'Type envelope exceeds whole-envelope cap');
  const outerTypes = candidateContract.typeSchemaEnvelopeV0.outerEnvelopeAbi;
  const decoded = abi.decode(outerTypes, rawTypeBytes);
  const reencoded = abi.encode(outerTypes, decoded);
  assert.equal(reencoded.toLowerCase(), rawTypeBytes.toLowerCase(), 'Type envelope is not canonical ABI');
  return { codecVersion: asNumber(decoded[0]), payloadBytes: decoded[1] };
}

function typeSchemaId(envelope, candidateContract = contract) {
  return keccak256(abi.encode(
    candidateContract.typeSchemaEnvelopeV0.identityPreimage.abiParameters,
    [
      candidateContract.typeSchemaEnvelopeV0.domain,
      candidateContract.typeSchemaEnvelopeV0.profileVersion,
      envelope.codecVersion,
      envelope.payloadBytes,
    ],
  ));
}

function decodeCodec0Payload(payloadBytes, candidateContract = contract) {
  const payloadAbi = candidateContract.typeSchemaEnvelopeV0.codec0PayloadAbi;
  const decoded = abi.decode([payloadAbi], payloadBytes)[0];
  assert.equal(abi.encode([payloadAbi], [decoded]).toLowerCase(), payloadBytes.toLowerCase(), 'codec0 payload is not canonical ABI');
  return decoded;
}

function enumName(group, numericValue, candidateContract = contract) {
  const found = Object.entries(candidateContract.resultV0.enums[group]).find(([, value]) => value === numericValue);
  assert(found, `missing ${group} enum value ${numericValue}`);
  return found[0];
}

function validateNamedResult(decoded, candidateContract = contract) {
  const actual = {
    kind: enumName('kind', decoded.kind, candidateContract),
    subjectKind: enumName('subjectKind', decoded.subjectKind, candidateContract),
    payloadKind: enumName('payloadKind', decoded.payload.payloadKind, candidateContract),
    projectionIntegrity: enumName('projectionIntegrity', decoded.projectionIntegrity, candidateContract),
    facts: Object.fromEntries(Object.entries(decoded.facts).map(([axis, value]) => [axis, enumName(axis, value, candidateContract)])),
  };
  assert.deepEqual(actual, candidateContract.helloExpected.namedResult, 'named Result axes do not match decoded bytes');
}

function validateContractStatic(candidateContract = contract, raw = contractFile.raw) {
  assert.equal(candidateContract.profile, 'EXP-C0/v0');
  assert.equal(candidateContract.resultV0.abi, EXPECTED_RESULT_ABI);
  assert.equal(candidateContract.resultV0.bytesPayloadAbi, EXPECTED_BYTES_PAYLOAD_ABI);
  assert.deepEqual(candidateContract.resultV0.enums, EXPECTED_ENUMS);
  assert.deepEqual(candidateContract.requiredJsonPointers, EXPECTED_REQUIRED_POINTERS);
  assert.deepEqual(candidateContract.typeSchemaEnvelopeV0.outerEnvelopeAbi, ['uint16', 'bytes']);
  assert.equal(candidateContract.typeSchemaEnvelopeV0.codec0PayloadAbi, EXPECTED_CODEC0_PAYLOAD_ABI);
  assert.equal(candidateContract.resultV0.codec, 'SOLIDITY_ABI_V2_ABI_ENCODE');
  assert.equal(candidateContract.resultV0.domain, keccak256(toUtf8Bytes(candidateContract.resultV0.domainText)));
  assert.equal(candidateContract.typeSchemaEnvelopeV0.domain, keccak256(toUtf8Bytes(candidateContract.typeSchemaEnvelopeV0.domainText)));
  assert.equal(candidateContract.resultV0.profileVersion, 0);
  assert.equal(candidateContract.typeSchemaEnvelopeV0.profileVersion, 0);
  assert.equal(candidateContract.typeSchemaEnvelopeV0.wholeEnvelopeByteCap, 2048);
  assert.deepEqual(candidateContract.resultV0.commitmentPreimage, {
    hash: 'KECCAK256',
    abiParameters: ['bytes32', 'uint16', EXPECTED_RESULT_ABI],
    valueOrder: ['domain', 'profileVersion', 'resultV0'],
  });
  assert.deepEqual(candidateContract.typeSchemaEnvelopeV0.identityPreimage, {
    hash: 'KECCAK256',
    abiParameters: ['bytes32', 'uint16', 'uint16', 'bytes'],
    valueOrder: ['domain', 'profileVersion', 'codecVersion', 'payloadBytes'],
  });
  assert.deepEqual(candidateContract.canonicalJson, {
    id: 'EFS2_CANONICAL_JSON_V0',
    objectKeyOrder: 'ECMASCRIPT_DEFAULT_UTF16_CODE_UNIT_ASCENDING',
    arrayOrder: 'PRESERVE_INPUT_ORDER',
    primitiveEncoding: 'JSON.stringify',
    whitespace: 'NONE',
    uint64Encoding: 'UNSIGNED_DECIMAL_STRING',
    payloadSerialization: 'UTF-8(canonicalJson(value))',
    fileSerialization: 'UTF-8(canonicalJson(value) + LF)',
    trailingLineFeed: true,
  });
  assert.equal(raw.toString('utf8'), `${canonicalJson(candidateContract)}\n`, 'consumer contract file is not canonical JSON + LF');
  for (const value of Object.values(candidateContract.nonadoption)) {
    if (typeof value === 'boolean') assert.equal(value, false, 'consumer contract overclaims adoption');
    else assert.equal(value, 0, 'consumer contract overclaims executable replay');
  }
  for (const flag of ['protocolConformance', 'durable', 'productionReady', 'deploymentAuthorized', 'freezeAuthorized']) {
    assert.equal(candidateContract[flag], false, `consumer contract ${flag} must stay false`);
  }
  assert.deepEqual(candidateContract.explorer.forbiddenDependencies, {
    requiresAccount: false,
    requiresCommons: false,
    requiresHostedIndexer: false,
    requiresOsBoot: false,
    requiresWallet: false,
  });
}

function validatePointers(candidateContract = contract, candidateHello = hello) {
  for (const lane of ['shared', 'sdk']) {
    for (const pointer of candidateContract.requiredJsonPointers[lane]) resolveJsonPointer(candidateHello, pointer);
  }
  for (const [name, pointer] of Object.entries(candidateHello.payload.adapter.sdk)) {
    if (name.endsWith('Ref')) resolveJsonPointer(candidateHello, pointer);
  }
}

function projectSemanticFacts(candidateHello = hello) {
  const payload = candidateHello.payload;
  const sdk = payload.adapter.sdk;
  const projectAttempt = (attempt) => ({
    eligible: attempt.eligible,
    expectedDigest: attempt.expectedDigest,
    observedDigest: attempt.observedDigest,
    observerBasis: attempt.observerBasis,
    ordinal: attempt.ordinal,
    outcome: attempt.outcome,
  });
  const sourceEvidence = payload.sourceObservation.evidence;
  return {
    projection: {
      declaredEmptyCollectionKinds: payload.projection.declaredEmptyCollectionKinds,
      entryCount: payload.projection.entryCount,
      populatedKinds: payload.projection.populatedKinds,
      root: payload.projection.root,
    },
    acquisition: {
      attempts: payload.acquisition.packet.attempts.map(projectAttempt),
      commitment: payload.acquisition.commitment,
      final: payload.acquisition.final,
    },
    sourceObservation: {
      canonicalityAssessment: sourceEvidence.canonicalityAssessment,
      causalAvailability: sourceEvidence.causalAvailability,
      commitment: payload.sourceObservation.commitment,
      observedBlockHash: sourceEvidence.observedBlockHash,
      observedBlockNumber: sourceEvidence.observedBlockNumber,
      observedStateRoot: sourceEvidence.observedStateRoot,
      proofKind: sourceEvidence.proofKind,
      proofScope: sourceEvidence.proofScope,
      proofScopeCommitment: sourceEvidence.proofScopeCommitment,
      requestCommitment: sourceEvidence.requestCommitment,
      resultV0Commitment: sourceEvidence.resultV0Commitment,
      sourceDescriptorCommitment: sourceEvidence.sourceDescriptorCommitment,
    },
    cursor: payload.query.cursor,
    file: {
      byteLength: sdk.filesFacade.byteLength,
      bytes: payload.portable.fileBytes,
      contentTypeBytes: sdk.filesFacade.contentTypeBytes,
      digest: payload.portable.fileDigest,
      digestAlgorithm: 'KECCAK256',
      entryNameBytes: sdk.filesFacade.nameBytes,
      parentDirectoryRecordId: sdk.filesFacade.parentDirectoryRecordId,
      recordIds: payload.portable.recordIds,
      typeSchemaIds: payload.portable.typeSchemaIds,
    },
    adapterReferences: {
      explorer: Object.fromEntries(Object.entries(payload.adapter.explorer.inspector).filter(([key]) => key.endsWith('Ref'))),
      sdk: Object.fromEntries(Object.entries(sdk).filter(([key]) => key.endsWith('Ref'))),
    },
  };
}

function validateHello(candidateContract = contract, candidateHello = hello) {
  assert.equal(sha256(helloFile.raw), candidateContract.helloExpected.artifactSha256);
  assert.equal(sha256(Buffer.from(canonicalJson(candidateHello.payload), 'utf8')), candidateHello.payloadSha256);
  assert.equal(candidateHello.payloadSha256, candidateContract.helloExpected.payloadSha256);
  validatePointers(candidateContract, candidateHello);

  const decoded = decodeResultPlain(candidateHello.payload.result.encoded, candidateContract.resultV0.abi);
  assert.deepEqual(decoded, candidateContract.helloExpected.decodedResult);
  validateNamedResult(decoded, candidateContract);
  assert.equal(resultCommitment(candidateHello.payload.result.encoded, candidateContract), candidateHello.payload.result.commitment);

  const bytesPayload = decodeBytesPayloadPlain(decoded.payload.data, candidateContract.resultV0.bytesPayloadAbi);
  assert.deepEqual(bytesPayload, candidateContract.helloExpected.decodedBytesPayload);
  assert.equal(keccak256(bytesPayload.availableBytes), bytesPayload.expectedDigest, 'available bytes do not match pinned Keccak-256 digest');
  assert.equal(bytesPayload.availableBytes, decoded.rawRetention.canonicalBytes);
  assert.equal(bytesPayload.expectedDigest, decoded.rawRetention.commitment);
  assert.equal(bytesPayload.recordId, decoded.subject);
  assert.deepEqual(projectSemanticFacts(candidateHello), candidateContract.helloExpected.semanticFacts);

  for (const envelope of Object.values(candidateHello.payload.portable.typeEnvelopes)) {
    const decodedEnvelope = decodeTypeEnvelope(envelope.rawTypeBytes, candidateContract);
    assert.equal(decodedEnvelope.codecVersion, envelope.codecVersion);
    assert.equal(decodedEnvelope.payloadBytes, envelope.payloadBytes);
    assert.equal(typeSchemaId(decodedEnvelope, candidateContract), envelope.typeSchemaId);
    assert.equal(decodedEnvelope.codecVersion, 0);
    decodeCodec0Payload(decodedEnvelope.payloadBytes, candidateContract);
  }
}

function validateResultVectors(candidateContract = contract, candidateVectors = resultVectors) {
  assert.equal(candidateVectors.domainResult, candidateContract.resultV0.domain);
  assert.equal(candidateVectors.profileVersion, candidateContract.resultV0.profileVersion);
  assert.equal(typeof candidateVectors.uint64Boundary.max, 'string');
  assert.equal(candidateVectors.uint64Boundary.max, '18446744073709551615');
  assert.equal(candidateVectors.uint64Boundary.jsonEncoding, 'CANONICAL_DECIMAL_STRING');
  for (const vector of candidateVectors.vectors) {
    const decoded = decodeResultPlain(vector.encoded, candidateContract.resultV0.abi);
    assert.equal(resultCommitment(vector.encoded, candidateContract), vector.commitment);
    assert.equal(typeof decoded.executionCoordinate.value, 'string');
    assert.equal(typeof decoded.observerBasis.value.freshnessCoordinate, 'string');
  }
  assert.equal(decodeResultPlain(candidateVectors.vectors[0].encoded).executionCoordinate.value, candidateVectors.uint64Boundary.max);
}

function validateTypeVectors(candidateContract = contract, candidateVectors = typeVectors) {
  assert.equal(candidateVectors.profileVersion, candidateContract.typeSchemaEnvelopeV0.profileVersion);
  assert.deepEqual(candidateVectors.outerWire, 'abi.encode(uint16 codecVersion, bytes payloadBytes)');
  assert.equal(candidateVectors.payloadV0Abi, candidateContract.typeSchemaEnvelopeV0.codec0PayloadAbi);
  assert.equal(candidateVectors.limits.wholeEnvelopeBytes, candidateContract.typeSchemaEnvelopeV0.wholeEnvelopeByteCap);

  const codec0 = decodeTypeEnvelope(candidateVectors.codec0.rawTypeBytes, candidateContract);
  assert.equal(codec0.codecVersion, 0);
  assert.equal(codec0.payloadBytes, candidateVectors.codec0.payloadBytes);
  assert.equal(typeSchemaId(codec0, candidateContract), candidateVectors.codec0.typeSchemaId);
  decodeCodec0Payload(codec0.payloadBytes, candidateContract);
  assert.deepEqual(candidateVectors.codec0.expected, candidateContract.typeSchemaEnvelopeV0.codec0);

  const codec1 = decodeTypeEnvelope(candidateVectors.opaqueCodec1.rawTypeBytes, candidateContract);
  assert.equal(codec1.codecVersion, 1);
  assert.equal(codec1.payloadBytes, candidateVectors.opaqueCodec1.payloadBytes);
  assert.equal(typeSchemaId(codec1, candidateContract), candidateVectors.opaqueCodec1.typeSchemaId);
  assert.deepEqual(candidateVectors.opaqueCodec1.expected, {
    support: candidateContract.typeSchemaEnvelopeV0.codec1.support,
    validation: candidateContract.typeSchemaEnvelopeV0.codec1.validation,
    semanticReconstruction: candidateContract.typeSchemaEnvelopeV0.codec1.semanticReconstruction,
    rawRetention: candidateContract.typeSchemaEnvelopeV0.codec1.rawRetention,
    c0Admission: candidateContract.typeSchemaEnvelopeV0.codec1.c0Admission,
  });

  const mutatedOpaque = decodeTypeEnvelope(candidateVectors.mutations.opaquePayloadByte.rawTypeBytes, candidateContract);
  assert.notEqual(typeSchemaId(mutatedOpaque, candidateContract), candidateVectors.opaqueCodec1.typeSchemaId);
  assert.equal(typeSchemaId(mutatedOpaque, candidateContract), candidateVectors.mutations.opaquePayloadByte.typeSchemaId);
  for (const name of ['malformedOuterOffset', 'nonzeroOuterPadding', 'trailingOuterWord', 'oversizedOuter']) {
    assert.throws(() => decodeTypeEnvelope(candidateVectors.mutations[name].rawTypeBytes, candidateContract), undefined, `${name} must reject`);
  }
}

function validateReceipt(candidateReceipt = receipt, { requireFinalCommit = false } = {}) {
  assert.deepEqual(Object.keys(candidateReceipt), contract.sameSourceReceipt.topLevelFieldOrder);
  assert.equal(candidateReceipt.format, contract.sameSourceReceipt.format);
  assert.equal(candidateReceipt.profile, contract.profile);
  assert.equal(candidateReceipt.handoffSha256, sha256(handoffFile.raw));
  assert.equal(candidateReceipt.consumerContractSha256, sha256(contractFile.raw));
  assert.equal(candidateReceipt.helloPayloadSha256, hello.payloadSha256);
  for (const field of contract.sameSourceReceipt.forbiddenEnvironmentFields) {
    assert(!(field in candidateReceipt), `receipt contains forbidden field ${field}`);
  }

  const expectedLocks = [...handoff.pinnedVectors].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  assert.deepEqual(candidateReceipt.artifactLocks, expectedLocks);
  for (const lock of candidateReceipt.artifactLocks) assert.deepEqual(Object.keys(lock), contract.sameSourceReceipt.artifactLockFieldOrder);
  for (const flag of ['protocolConformance', 'durable', 'productionReady', 'deploymentAuthorized', 'freezeAuthorized']) {
    assert.equal(candidateReceipt[flag], false);
  }

  const pending = candidateReceipt.corePacketCommit === PENDING_CORE_COMMIT;
  if (requireFinalCommit) assert(!pending, 'exact Core packet commit is still a placeholder');
  if (!pending) {
    assert.match(candidateReceipt.corePacketCommit, /^[0-9a-f]{40}$/);
    assert.equal(candidateReceipt.corePacketCommit, EXPECTED_CORE_COMMIT);
  }
  return pending;
}

function validateCoreRawLocks() {
  const locks = new Map(receipt.artifactLocks.map((lock) => [lock.path, lock.sha256]));
  for (const relativePath of allowedCoreInputs) {
    if (relativePath.endsWith('/handoff-v0.json')) continue;
    assert.equal(sha256(sourceFiles[relativePath].raw), locks.get(relativePath), `${relativePath} raw hash mismatch`);
  }
  assert.equal(receipt.handoffSha256, sha256(handoffFile.raw));
  assert.equal(receipt.consumerContractSha256, sha256(contractFile.raw));
  assert.equal(contract.typeSchemaEnvelopeV0.vector.sha256, sha256(typeVectorFile.raw));
  assert.equal(contract.helloExpected.artifactSha256, sha256(helloFile.raw));
}

function validateExactCommitIfPresent() {
  if (receipt.corePacketCommit === PENDING_CORE_COMMIT) return;
  execFileSync('git', ['-C', coreRoot, 'cat-file', '-e', `${receipt.corePacketCommit}^{commit}`], { stdio: 'pipe' });
  for (const relativePath of allowedCoreInputs) {
    const committedRaw = execFileSync('git', ['-C', coreRoot, 'show', `${receipt.corePacketCommit}:${relativePath}`], { maxBuffer: 4 * 1024 * 1024 });
    assert.equal(sha256(committedRaw), sha256(sourceFiles[relativePath].raw), `${relativePath} differs from exact Core commit`);
  }
}

function validateReceiptSeparation(candidateReport = report) {
  assert.deepEqual(candidateReport.receiptSeparation, {
    planAuthorization: 'EFS_PLAN_SIGNATURE_VERIFICATION_RECEIPT',
    accountSubmission: 'ACCOUNT_AUTHORIZATION_OR_SUBMISSION_RECEIPT',
    canonicalEffect: 'CANONICAL_EFFECT_READ_BACK_RECEIPT',
    conflated: false,
    transportAcknowledgementProvesCanonicalEffect: false,
  });
  const sourceFixture = JSON.parse(readFileSync(path.resolve(reviewDir, 'fixture.json'), 'utf8'));
  const dropped = sourceFixture.cases.find((item) => item.id === 'X1_DROPPED_SUBMISSION_CHANNEL');
  const noEffect = sourceFixture.cases.find((item) => item.id === 'B1_STALE_CAS_ZERO_EFFECT');
  assert(dropped && noEffect);
  assert.notEqual(dropped.payload.receipt.planSignature, dropped.payload.receipt.accountSubmission);
  assert.equal(dropped.profile.effect, 'UNKNOWN');
  assert.equal(noEffect.profile.effect, 'NOT_COMMITTED_PROVEN');
  assert.equal(noEffect.payload.receipt.canonicalEffect, 'pre-post-equal');
}

function validateReport(candidateReport = report) {
  assert.equal(candidateReport.format, 'efs2-sdkv2-exp-c0-consumption/0');
  assert.equal(candidateReport.verdict, 'PASS_DISPOSABLE_CONSUMPTION_ONLY');
  assert.equal(candidateReport.status, receipt.corePacketCommit === PENDING_CORE_COMMIT ? 'WORKING_DRAFT_BLOCKED_ON_CORE_COMMIT' : 'EXACT_SOURCE_LOCKED_DISPOSABLE_EVIDENCE');
  assert.equal(candidateReport.profile, contract.profile);
  assert.deepEqual(candidateReport.allowedCoreSerializedInputs, allowedCoreInputs);
  assert.equal(candidateReport.vendoredInputDirectory, 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs');
  assert.equal(candidateReport.coreSourceOrScriptImports, false);
  assert.equal(candidateReport.coreTestsImported, false);
  for (const value of Object.values(candidateReport.checks)) assert.equal(value, true);
  assert.equal(candidateReport.sourceReceipt.path, RECEIPT_PATH);
  assert.equal(candidateReport.sourceReceipt.sha256, sha256(receiptRaw));
  assert.equal(candidateReport.sourceReceipt.corePacketCommit, receipt.corePacketCommit);
  assert.equal(candidateReport.sourceReceipt.publicationBlocked, receipt.corePacketCommit === PENDING_CORE_COMMIT);
  assert.deepEqual(candidateReport.uint64Policy, {
    json: 'UNSIGNED_DECIMAL_STRING',
    javascriptNumberNarrowing: false,
    maxObserved: resultVectors.uint64Boundary.max,
  });
  assert.equal(candidateReport.rawRetention.resultEncodedSha256, sha256HexBytes(hello.payload.result.encoded));
  assert.equal(candidateReport.rawRetention.bytesPayloadSha256, sha256HexBytes(contract.helloExpected.decodedResult.payload.data));
  assert.equal(candidateReport.rawRetention.fileBytesSha256, sha256HexBytes(hello.payload.portable.fileBytes));
  assert.equal(candidateReport.rawRetention.codec1RawTypeBytesSha256, sha256HexBytes(typeVectors.opaqueCodec1.rawTypeBytes));
  assert.deepEqual(candidateReport.validatedCounts, {
    coreSerializedFiles: 5,
    requiredJsonPointers: contract.requiredJsonPointers.shared.length + contract.requiredJsonPointers.sdk.length,
    resultVectors: resultVectors.vectors.length + 1,
    typeEnvelopes: Object.keys(hello.payload.portable.typeEnvelopes).length + 2,
    adversarialMutations: 13,
  });
  for (const value of Object.values(candidateReport.nonadoption)) assert.equal(value, false);
  validateReceiptSeparation(candidateReport);
}

let mutationCount = 0;
function mustReject(label, action) {
  assert.throws(action, undefined, `${label} mutation must reject`);
  mutationCount += 1;
}

validateContractStatic();
validateReceipt(receipt, { requireFinalCommit: true });
validateCoreRawLocks();
validateExactCommitIfPresent();
validateHello();
validateResultVectors();
validateTypeVectors();
validateReport();
assert.equal(receiptRaw.toString('utf8'), `${JSON.stringify(receipt)}\n`, 'receipt bytes are not JSON.stringify + LF');

const badContractAbi = cloneJson(contract);
badContractAbi.resultV0.abi = badContractAbi.resultV0.abi.replace('tuple(uint8,uint8,bytes,', 'tuple(uint16,uint8,bytes,');
mustReject('Result ABI', () => validateContractStatic(badContractAbi, Buffer.from(`${canonicalJson(badContractAbi)}\n`)));

const badEnum = cloneJson(contract);
badEnum.resultV0.enums.presence.CONFLICT = 9;
mustReject('enum', () => validateContractStatic(badEnum, Buffer.from(`${canonicalJson(badEnum)}\n`)));

const badPointer = cloneJson(contract);
badPointer.requiredJsonPointers.sdk[0] = '#/payload/adapter/sdk/doesNotExist';
mustReject('JSON pointer', () => validatePointers(badPointer));

const badHello = cloneJson(hello);
badHello.payload.portable.fileDigest = `0x${'00'.repeat(32)}`;
mustReject('HELLO semantic fact', () => validateHello(contract, badHello));

const badResultVectors = cloneJson(resultVectors);
badResultVectors.uint64Boundary.max = Number(badResultVectors.uint64Boundary.max);
mustReject('uint64 narrowing', () => validateResultVectors(contract, badResultVectors));

const badResultBytes = cloneJson(hello);
badResultBytes.payload.result.encoded = `${badResultBytes.payload.result.encoded.slice(0, -1)}1`;
mustReject('Result bytes', () => validateHello(contract, badResultBytes));

const badCodec1Bytes = cloneJson(typeVectors);
badCodec1Bytes.opaqueCodec1.payloadBytes = '0xdeadbeef0000';
mustReject('codec1 raw retention', () => validateTypeVectors(contract, badCodec1Bytes));

const badCodec1Grade = cloneJson(typeVectors);
badCodec1Grade.opaqueCodec1.expected.support = 'SUPPORTED';
mustReject('codec1 support grade', () => validateTypeVectors(contract, badCodec1Grade));

const badReceiptOrder = { profile: receipt.profile, ...receipt };
mustReject('receipt field order', () => validateReceipt(badReceiptOrder));

const staleLockReceipt = cloneJson(receipt);
staleLockReceipt.artifactLocks[0].sha256 = '0'.repeat(64);
mustReject('stale artifact lock', () => validateReceipt(staleLockReceipt));

const roleBearingReceipt = cloneJson(receipt);
roleBearingReceipt.role = 'sdk';
mustReject('role-bearing receipt', () => validateReceipt(roleBearingReceipt));

const placeholderReceipt = cloneJson(receipt);
placeholderReceipt.corePacketCommit = PENDING_CORE_COMMIT;
mustReject('placeholder final commit', () => validateReceipt(placeholderReceipt, { requireFinalCommit: true }));

const conflatedReport = cloneJson(report);
conflatedReport.receiptSeparation.conflated = true;
mustReject('receipt conflation', () => validateReport(conflatedReport));

assert.equal(mutationCount, 13);
const status = receipt.corePacketCommit === PENDING_CORE_COMMIT ? 'PASS_WITH_BLOCKER' : 'PASS';
console.log(`${status} 5 Core artifacts, ${resultVectors.vectors.length + 1} Result encodings, ${Object.keys(hello.payload.portable.typeEnvelopes).length + 2} Type envelopes, ${mutationCount} mutations`);
if (status === 'PASS_WITH_BLOCKER') console.log(`BLOCKER replace ${PENDING_CORE_COMMIT} with the exact Core commit before staging or publication`);
