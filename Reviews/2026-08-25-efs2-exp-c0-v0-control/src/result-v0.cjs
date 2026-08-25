'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const ZERO = `0x${'00'.repeat(32)}`;
const DOMAIN_RESULT = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/RESULT'));

const codeMap = (names, notApplicable = false) => {
  const entries = names.map((name, index) => [name, index + 1]);
  if (notApplicable) entries.push(['NOT_APPLICABLE', 255]);
  return Object.freeze(Object.fromEntries(entries));
};

const ENUMS = Object.freeze({
  // Exact union of the 38 result-profile kinds in the sealed semantic manifest.
  kind: codeMap(['MUTATION', 'POINT', 'SCOPE', 'REQUEST', 'VERIFIER', 'AGGREGATE', 'BYTES', 'SUBMISSION', 'RECONSTRUCTION']),
  subjectKind: codeMap(['REALM', 'TYPE', 'RECORD', 'OCCURRENCE', 'ADMISSION', 'BINDING', 'QUERY', 'LENS', 'OPERATION', 'PROJECTION', 'COLLECTION_ENTRY']),
  observerSource: codeMap(['ONCHAIN_ATOMIC', 'AUTHENTICATED_OBSERVER', 'SOURCE_OBSERVED']),
  finality: codeMap(['UNPROVEN', 'OBSERVED_FINAL']),
  presence: codeMap(['FOUND', 'ABSENT_PROVEN', 'UNKNOWN', 'CONFLICT', 'OPAQUE', 'MASKED'], true),
  coverage: codeMap(['COMPLETE', 'PARTIAL'], true),
  support: codeMap(['SUPPORTED', 'UNSUPPORTED', 'LIMIT_EXCEEDED'], true),
  validation: codeMap(['STRUCTURALLY_VALID', 'SEMANTICALLY_VALID', 'INVALID', 'UNPROVEN'], true),
  authority: codeMap(['AUTHORIZED', 'DENIED', 'UNPROVEN'], true),
  lifecycle: codeMap(['ADMITTED', 'WITHDRAWN', 'CARRIED_ONLY', 'UNPROVEN'], true),
  selection: codeMap(['CURRENT', 'NOT_CURRENT', 'CONFLICT', 'UNKNOWN'], true),
  bytes: codeMap(['VERIFIED_AVAILABLE', 'PARTIAL', 'UNAVAILABLE', 'INTEGRITY_FAILED'], true),
  effect: codeMap(['COMMITTED', 'NOT_COMMITTED_PROVEN', 'UNKNOWN'], true),
  projectionIntegrity: codeMap(['MATCHED', 'MISSING_REQUIRED_ITEM', 'INTEGRITY_FAILED'], true),
  payloadKind: codeMap(['POINT', 'PAGE', 'MUTATION', 'SUBMISSION', 'BYTES', 'RECONSTRUCTION', 'REQUEST', 'VERIFIER', 'AGGREGATE']),
});

const RESULT_PAYLOAD = Object.freeze({
  [ENUMS.kind.MUTATION]: ENUMS.payloadKind.MUTATION,
  [ENUMS.kind.POINT]: ENUMS.payloadKind.POINT,
  [ENUMS.kind.SCOPE]: ENUMS.payloadKind.PAGE,
  [ENUMS.kind.REQUEST]: ENUMS.payloadKind.REQUEST,
  [ENUMS.kind.VERIFIER]: ENUMS.payloadKind.VERIFIER,
  [ENUMS.kind.AGGREGATE]: ENUMS.payloadKind.AGGREGATE,
  [ENUMS.kind.BYTES]: ENUMS.payloadKind.BYTES,
  [ENUMS.kind.SUBMISSION]: ENUMS.payloadKind.SUBMISSION,
  [ENUMS.kind.RECONSTRUCTION]: ENUMS.payloadKind.RECONSTRUCTION,
});

const PAYLOAD_LABEL = Object.freeze(Object.fromEntries(
  Object.entries(ENUMS.payloadKind).map(([name, code]) => [code, `${name[0]}${name.slice(1).toLowerCase()}PayloadV0`]),
));

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
const BYTES_PAYLOAD = 'tuple(bytes32,bytes32,bool,bytes)';
const CURSOR = 'tuple(bytes32,bytes32,bytes32,uint32,uint8,uint32,uint32,uint64,bytes32,uint32,bytes32)';
const PAGE_PAYLOAD = `tuple(bytes[],bool,${CURSOR},uint16,bytes32)`;
const ERROR = 'tuple(uint8,bytes)';
const PLAN_SIGNATURE_RECEIPT = 'tuple(bytes32,bytes32,bytes32,bytes32,bytes32,uint8)';
const CANONICAL_EFFECT_RECEIPT = 'tuple(bool,bytes32,bytes32,bytes32,uint64,bytes32,bytes32,uint8)';
const MUTATION_PAYLOAD = `tuple(bool,bytes32,bytes32[],bool,${PLAN_SIGNATURE_RECEIPT},bool,${CANONICAL_EFFECT_RECEIPT},bool,${ERROR})`;

const absentBytes32 = () => ({ present: false, value: ZERO });
const presentBytes32 = (value) => ({ present: true, value });
const commitBytes = (value) => keccak256(value);

function optB32Value(option) {
  return [Boolean(option?.present), option?.present ? option.value : (option?.value ?? ZERO)];
}

function optIntValue(option) {
  return [Boolean(option?.present), option?.value ?? 0];
}

function zeroObserver() {
  return [ZERO, ZERO, 0, 0, 0];
}

function zeroObserverObject() {
  return {
    blockHash: ZERO,
    stateRoot: ZERO,
    sourceKind: 0,
    finality: 0,
    freshnessCoordinate: 0n,
  };
}

function observerTuple(value) {
  if (!value) return zeroObserver();
  return [value.blockHash, value.stateRoot, value.sourceKind, value.finality, value.freshnessCoordinate];
}

function observerValue(option) {
  const value = option?.value;
  return [
    Boolean(option?.present),
    observerTuple(value),
  ];
}

function profilesValue(profiles) {
  return [
    optB32Value(profiles.typeSchemaId),
    optB32Value(profiles.queryProfileId),
    optIntValue(profiles.queryGeneration),
    optB32Value(profiles.policyId),
    optB32Value(profiles.verifierProfileId),
    optB32Value(profiles.codeCommitment),
    optB32Value(profiles.dependencyCommitment),
    optB32Value(profiles.resolutionPlanId),
  ];
}

function factsValue(facts) {
  return [
    facts.presence,
    facts.coverage,
    facts.support,
    facts.validation,
    facts.authority,
    facts.lifecycle,
    facts.selection,
    facts.bytes,
    facts.effect,
  ];
}

function resultValue(result) {
  return [
    result.kind,
    result.subjectKind,
    result.subject,
    optB32Value(result.realmId),
    optB32Value(result.realmRevisionId),
    optIntValue(result.executionCoordinate),
    optIntValue(result.admissionHighWater),
    observerValue(result.observerBasis),
    profilesValue(result.profileCommitments),
    factsValue(result.facts),
    [result.payload.payloadKind, result.payload.data],
    [result.rawRetention.present, result.rawRetention.canonicalBytes, result.rawRetention.commitment],
    result.projectionIntegrity,
  ];
}

function encodeResultV0(result) {
  return abi.encode([RESULT], [resultValue(result)]);
}

function commitResultV0(result) {
  return keccak256(abi.encode(['bytes32', 'uint16', RESULT], [DOMAIN_RESULT, VERSION, resultValue(result)]));
}

function decodeOptionalB32(value) {
  return { present: value[0], value: value[1] };
}

function decodeOptionalUint64(value) {
  return { present: value[0], value: value[1] };
}

function decodeOptionalUint32(value) {
  return { present: value[0], value: Number(value[1]) };
}

function decodeObserver(value) {
  return {
    present: value[0],
    value: {
      blockHash: value[1][0],
      stateRoot: value[1][1],
      sourceKind: Number(value[1][2]),
      finality: Number(value[1][3]),
      freshnessCoordinate: value[1][4],
    },
  };
}

function decodeResultV0(bytes) {
  const value = abi.decode([RESULT], bytes)[0];
  const profiles = value[8];
  const facts = value[9];
  return {
    kind: Number(value[0]),
    subjectKind: Number(value[1]),
    subject: value[2],
    realmId: decodeOptionalB32(value[3]),
    realmRevisionId: decodeOptionalB32(value[4]),
    executionCoordinate: decodeOptionalUint64(value[5]),
    admissionHighWater: decodeOptionalUint32(value[6]),
    observerBasis: decodeObserver(value[7]),
    profileCommitments: {
      typeSchemaId: decodeOptionalB32(profiles[0]),
      queryProfileId: decodeOptionalB32(profiles[1]),
      queryGeneration: decodeOptionalUint32(profiles[2]),
      policyId: decodeOptionalB32(profiles[3]),
      verifierProfileId: decodeOptionalB32(profiles[4]),
      codeCommitment: decodeOptionalB32(profiles[5]),
      dependencyCommitment: decodeOptionalB32(profiles[6]),
      resolutionPlanId: decodeOptionalB32(profiles[7]),
    },
    facts: {
      presence: Number(facts[0]),
      coverage: Number(facts[1]),
      support: Number(facts[2]),
      validation: Number(facts[3]),
      authority: Number(facts[4]),
      lifecycle: Number(facts[5]),
      selection: Number(facts[6]),
      bytes: Number(facts[7]),
      effect: Number(facts[8]),
    },
    payload: { payloadKind: Number(value[10][0]), data: value[10][1] },
    rawRetention: { present: value[11][0], canonicalBytes: value[11][1], commitment: value[11][2] },
    projectionIntegrity: Number(value[12]),
  };
}

function encodePointPayload(payload) {
  return abi.encode([POINT_PAYLOAD], [[payload.key, payload.valuePresent, payload.value, payload.proofOfLocalAbsence]]);
}

function encodeBytesPayload(payload) {
  return abi.encode([BYTES_PAYLOAD], [[
    payload.recordId,
    payload.expectedDigest,
    Boolean(payload.bytesPresent),
    payload.availableBytes,
  ]]);
}

function decodeBytesPayload(bytes) {
  const value = abi.decode([BYTES_PAYLOAD], bytes)[0];
  const decoded = {
    recordId: value[0],
    expectedDigest: value[1],
    bytesPresent: value[2],
    availableBytes: value[3],
  };
  if (encodeBytesPayload(decoded).toLowerCase() !== bytes.toLowerCase()) {
    throw new Error('BytesPayloadV0 is not canonical ABI');
  }
  return decoded;
}

function encodeCollectionEntrySubject(collectionKind, canonicalKey) {
  return abi.encode(['uint8', 'bytes'], [collectionKind, canonicalKey]);
}

function zeroCursor() {
  return [ZERO, ZERO, ZERO, 0, 0, 0, 0, 0, ZERO, 0, ZERO];
}

function cursorValue(cursor) {
  if (!cursor) return zeroCursor();
  return [
    cursor.realmId,
    cursor.realmRevisionId,
    cursor.queryProfileId,
    cursor.generation,
    cursor.ordering,
    cursor.activationHighWater,
    cursor.coveredThroughHighWater,
    cursor.executionCoordinate,
    cursor.observerBlockHash,
    cursor.afterPostingOrdinal,
    cursor.declaredDomainRoot,
  ];
}

function encodePagePayload(payload) {
  return abi.encode([PAGE_PAYLOAD], [[
    payload.members ?? [],
    Boolean(payload.cursorPresent),
    cursorValue(payload.cursor),
    payload.pageOrdinal,
    payload.declaredDomainRoot,
  ]]);
}

function decodePagePayload(bytes) {
  const value = abi.decode([PAGE_PAYLOAD], bytes)[0];
  const cursor = value[2];
  return {
    members: [...value[0]],
    cursorPresent: value[1],
    cursor: {
      realmId: cursor[0],
      realmRevisionId: cursor[1],
      queryProfileId: cursor[2],
      generation: Number(cursor[3]),
      ordering: Number(cursor[4]),
      activationHighWater: Number(cursor[5]),
      coveredThroughHighWater: Number(cursor[6]),
      executionCoordinate: cursor[7],
      observerBlockHash: cursor[8],
      afterPostingOrdinal: Number(cursor[9]),
      declaredDomainRoot: cursor[10],
    },
    pageOrdinal: Number(value[3]),
    declaredDomainRoot: value[4],
  };
}

function zeroPlanSignatureReceipt() {
  return [ZERO, ZERO, ZERO, ZERO, ZERO, 0];
}

function planSignatureReceiptValue(receipt) {
  if (!receipt) return zeroPlanSignatureReceipt();
  return [
    receipt.admissionPlanId,
    receipt.signer,
    receipt.verifierProfileId,
    receipt.signedDigest,
    receipt.verifierTranscriptCommitment,
    receipt.authority,
  ];
}

function zeroCanonicalEffectReceipt() {
  return [false, ZERO, ZERO, ZERO, 0n, ZERO, ZERO, 0];
}

function canonicalEffectReceiptValue(receipt) {
  if (!receipt) return zeroCanonicalEffectReceipt();
  return [
    Boolean(receipt.operationPresent),
    receipt.operationId,
    receipt.realmId,
    receipt.realmRevisionId,
    receipt.executionCoordinate,
    receipt.beforeProjectionRoot,
    receipt.afterProjectionRoot,
    receipt.effect,
  ];
}

function encodeMutationPayload(payload) {
  return abi.encode([MUTATION_PAYLOAD], [[
    payload.operationPresent,
    payload.operationId ?? ZERO,
    payload.admissionReceiptIds ?? [],
    payload.planSignatureReceiptPresent,
    planSignatureReceiptValue(payload.planSignatureReceipt),
    payload.canonicalEffectReceiptPresent,
    canonicalEffectReceiptValue(payload.canonicalEffectReceipt),
    payload.errorPresent,
    payload.error ? [payload.error.code, payload.error.subject] : [0, '0x'],
  ]]);
}

function decodeMutationPayload(bytes) {
  const value = abi.decode([MUTATION_PAYLOAD], bytes)[0];
  const signature = value[4];
  const canonical = value[6];
  return {
    operationPresent: value[0],
    operationId: value[1],
    admissionReceiptIds: [...value[2]],
    planSignatureReceiptPresent: value[3],
    planSignatureReceipt: {
      admissionPlanId: signature[0],
      signer: signature[1],
      verifierProfileId: signature[2],
      signedDigest: signature[3],
      verifierTranscriptCommitment: signature[4],
      authority: Number(signature[5]),
    },
    canonicalEffectReceiptPresent: value[5],
    canonicalEffectReceipt: {
      operationPresent: canonical[0],
      operationId: canonical[1],
      realmId: canonical[2],
      realmRevisionId: canonical[3],
      executionCoordinate: canonical[4],
      beforeProjectionRoot: canonical[5],
      afterProjectionRoot: canonical[6],
      effect: Number(canonical[7]),
    },
    errorPresent: value[7],
    error: { code: Number(value[8][0]), subject: value[8][1] },
  };
}

function validCode(value, enumObject) {
  return Number.isInteger(value) && Object.values(enumObject).includes(value);
}

function validateAbsentOption(name, option, zero = ZERO) {
  if (!option || typeof option.present !== 'boolean') return [`${name} missing optional presence bit`];
  const hasZeroValue = zero === ZERO
    ? option.value === ZERO
    : option.value === 0 || option.value === 0n;
  if (!option.present && !hasZeroValue) return [`${name} absent value must be zero`];
  if (option.present && zero === ZERO && option.value === ZERO) return [`${name} present value cannot be zero`];
  return [];
}


const PROFILE_OPTIONS = Object.freeze([
  ['typeSchemaId', ZERO],
  ['queryProfileId', ZERO],
  ['queryGeneration', 0],
  ['policyId', ZERO],
  ['verifierProfileId', ZERO],
  ['codeCommitment', ZERO],
  ['dependencyCommitment', ZERO],
  ['resolutionPlanId', ZERO],
]);

function isZeroObserver(value) {
  if (!value) return true;
  return value.blockHash === ZERO
    && value.stateRoot === ZERO
    && value.sourceKind === 0
    && value.finality === 0
    && (value.freshnessCoordinate === 0 || value.freshnessCoordinate === 0n);
}

function decodeCanonicalMutation(result, errors) {
  try {
    return decodeMutationPayload(result.payload.data);
  } catch (error) {
    errors.push(`invalid MutationPayloadV0: ${error.message}`);
    return null;
  }
}

function allZero(values) {
  return values.every((value) => value === ZERO
    || value === '0x'
    || value === 0
    || value === 0n
    || value === false);
}

function zeroPlanSignature(receipt) {
  return receipt.admissionPlanId === ZERO
    && receipt.signer === ZERO
    && receipt.verifierProfileId === ZERO
    && receipt.signedDigest === ZERO
    && receipt.verifierTranscriptCommitment === ZERO
    && receipt.authority === 0;
}

function zeroCanonicalEffect(receipt) {
  return receipt.operationPresent === false
    && receipt.operationId === ZERO
    && receipt.realmId === ZERO
    && receipt.realmRevisionId === ZERO
    && (receipt.executionCoordinate === 0 || receipt.executionCoordinate === 0n)
    && receipt.beforeProjectionRoot === ZERO
    && receipt.afterProjectionRoot === ZERO
    && receipt.effect === 0;
}

function validateResultV0(result) {
  const errors = [];
  if (!validCode(result.kind, ENUMS.kind)) errors.push('ResultV0 kind is unknown');
  if (!validCode(result.subjectKind, ENUMS.subjectKind)) errors.push('ResultV0 subjectKind is unknown');
  if (result.subjectKind === ENUMS.subjectKind.COLLECTION_ENTRY) {
    try {
      const decoded = abi.decode(['uint8', 'bytes'], result.subject);
      const collectionKind = Number(decoded[0]);
      if (collectionKind < 1 || collectionKind > 28) {
        errors.push('COLLECTION_ENTRY collectionKind must be within 1..28');
      }
      if (encodeCollectionEntrySubject(collectionKind, decoded[1]).toLowerCase() !== result.subject.toLowerCase()) {
        errors.push('COLLECTION_ENTRY subject is not canonical ABI');
      }
    } catch (error) {
      errors.push(`COLLECTION_ENTRY subject is malformed: ${error.message}`);
    }
  }
  for (const [name, enumObject] of [
    ['presence', ENUMS.presence],
    ['coverage', ENUMS.coverage],
    ['support', ENUMS.support],
    ['validation', ENUMS.validation],
    ['authority', ENUMS.authority],
    ['lifecycle', ENUMS.lifecycle],
    ['selection', ENUMS.selection],
    ['bytes', ENUMS.bytes],
    ['effect', ENUMS.effect],
  ]) {
    if (!validCode(result.facts?.[name], enumObject)) errors.push(`FactsV0 ${name} is unknown`);
  }
  if (!validCode(result.projectionIntegrity, ENUMS.projectionIntegrity)) {
    errors.push('projectionIntegrity is unknown');
  }
  errors.push(...validateAbsentOption('realmId', result.realmId));
  errors.push(...validateAbsentOption('realmRevisionId', result.realmRevisionId));
  errors.push(...validateAbsentOption('executionCoordinate', result.executionCoordinate, 0));
  errors.push(...validateAbsentOption('admissionHighWater', result.admissionHighWater, 0));
  for (const [name, zero] of PROFILE_OPTIONS) {
    errors.push(...validateAbsentOption(`profileCommitments.${name}`, result.profileCommitments?.[name], zero));
  }
  if (result.rawRetention.present) {
    if (commitBytes(result.rawRetention.canonicalBytes) !== result.rawRetention.commitment) {
      errors.push('raw retention commitment does not match canonical bytes');
    }
  } else if (result.rawRetention.canonicalBytes !== '0x' || result.rawRetention.commitment !== ZERO) {
    errors.push('absent raw retention must use empty bytes and zero commitment');
  }
  if (!result.observerBasis || typeof result.observerBasis.present !== 'boolean') {
    errors.push('observerBasis missing optional presence bit');
  } else if (!result.observerBasis.present) {
    if (!isZeroObserver(result.observerBasis.value)) errors.push('absent observer basis must be all-zero');
  } else {
    const observer = result.observerBasis.value;
    if (!observer || !validCode(observer.sourceKind, ENUMS.observerSource)) {
      errors.push('observer basis sourceKind is unknown');
    }
    if (!observer || !validCode(observer.finality, ENUMS.finality)) {
      errors.push('observer basis finality is unknown');
    }
    if (observer.sourceKind === ENUMS.observerSource.AUTHENTICATED_OBSERVER
      && (observer.blockHash === ZERO || observer.stateRoot === ZERO)) {
      errors.push('authenticated observer basis requires block hash and state root');
    }
    if (observer.sourceKind === ENUMS.observerSource.ONCHAIN_ATOMIC
      && (observer.blockHash !== ZERO || observer.stateRoot !== ZERO)) {
      errors.push('onchain atomic basis cannot claim inclusion block hash/state root');
    }
    if (observer.sourceKind === ENUMS.observerSource.ONCHAIN_ATOMIC
      && observer.finality !== ENUMS.finality.UNPROVEN) {
      errors.push('onchain atomic basis finality must be UNPROVEN');
    }
    if (observer.sourceKind === ENUMS.observerSource.SOURCE_OBSERVED
      && (observer.blockHash === ZERO || observer.stateRoot === ZERO)) {
      errors.push('source observed basis requires block hash and state root');
    }
    if (observer.sourceKind === ENUMS.observerSource.SOURCE_OBSERVED
      && observer.finality !== ENUMS.finality.UNPROVEN) {
      errors.push('source observed basis finality must be UNPROVEN');
    }
  }
  if (result.facts.presence === ENUMS.presence.ABSENT_PROVEN
    && result.facts.coverage !== ENUMS.coverage.COMPLETE) {
    errors.push('ABSENT_PROVEN requires COMPLETE coverage');
  }
  if (result.facts.presence === ENUMS.presence.ABSENT_PROVEN
    && result.facts.support !== ENUMS.support.SUPPORTED) {
    errors.push('ABSENT_PROVEN requires support=SUPPORTED');
  }
  if ([ENUMS.kind.MUTATION, ENUMS.kind.SUBMISSION].includes(result.kind)
    && result.facts.coverage !== ENUMS.coverage.NOT_APPLICABLE) {
    errors.push(`${result.kind === ENUMS.kind.MUTATION ? 'MUTATION' : 'SUBMISSION'} requires coverage=NOT_APPLICABLE`);
  }
  if (result.facts.effect === ENUMS.effect.UNKNOWN
    && result.facts.coverage !== ENUMS.coverage.NOT_APPLICABLE) {
    errors.push('effect=UNKNOWN requires coverage=NOT_APPLICABLE');
  }
  if (result.facts.effect === ENUMS.effect.UNKNOWN && result.kind !== ENUMS.kind.SUBMISSION) {
    errors.push('effect=UNKNOWN is legal only for SUBMISSION');
  }
  if (result.facts.effect === ENUMS.effect.COMMITTED && result.kind !== ENUMS.kind.MUTATION) {
    const idempotentPoint = result.kind === ENUMS.kind.POINT
      && result.subjectKind === ENUMS.subjectKind.OPERATION
      && result.facts.presence === ENUMS.presence.FOUND
      && result.facts.coverage === ENUMS.coverage.COMPLETE;
    if (!idempotentPoint) errors.push('effect=COMMITTED requires MUTATION or exact OPERATION read-back');
  }
  if (result.facts.effect === ENUMS.effect.NOT_COMMITTED_PROVEN && result.kind !== ENUMS.kind.MUTATION) {
    errors.push('NOT_COMMITTED_PROVEN is legal only for MUTATION');
  }
  if (result.facts.presence === ENUMS.presence.ABSENT_PROVEN
    && [ENUMS.bytes.PARTIAL, ENUMS.bytes.UNAVAILABLE, ENUMS.bytes.INTEGRITY_FAILED].includes(result.facts.bytes)) {
    errors.push('byte availability cannot prove semantic absence');
  }
  if (result.facts.presence === ENUMS.presence.MASKED
    && (!result.profileCommitments?.policyId?.present || !result.observerBasis?.present)) {
    errors.push('MASKED requires retained mask policy and observer basis');
  }
  if (result.facts.authority === ENUMS.authority.AUTHORIZED
    && !result.profileCommitments?.verifierProfileId?.present) {
    errors.push('AUTHORIZED requires retained verifier profile');
  }
  if (result.facts.selection === ENUMS.selection.CURRENT
    && ![ENUMS.subjectKind.BINDING, ENUMS.subjectKind.LENS].includes(result.subjectKind)) {
    errors.push('CURRENT selection requires BINDING or LENS subject');
  }

  const expectedPayload = RESULT_PAYLOAD[result.kind];
  if (expectedPayload !== undefined && result.payload?.payloadKind !== expectedPayload) {
    errors.push(`${Object.keys(ENUMS.kind).find((name) => ENUMS.kind[name] === result.kind)} requires ${PAYLOAD_LABEL[expectedPayload]}`);
  }

  if (result.kind === ENUMS.kind.SCOPE && result.payload?.payloadKind === ENUMS.payloadKind.PAGE) {
    try {
      const page = decodePagePayload(result.payload.data);
      if (!page.cursorPresent && !allZero(Object.values(page.cursor))) errors.push('absent page cursor must be all-zero');
      if (page.members.length === 0 && result.facts.presence === ENUMS.presence.ABSENT_PROVEN
        && (result.facts.coverage !== ENUMS.coverage.COMPLETE
          || page.declaredDomainRoot === ZERO
          || (!result.observerBasis?.present && !result.executionCoordinate?.present))) {
        errors.push('empty SCOPE absence requires exact declared finite domain root and basis');
      }
    } catch (error) {
      errors.push(`invalid PagePayloadV0: ${error.message}`);
    }
  }

  if (result.kind === ENUMS.kind.BYTES && result.payload?.payloadKind === ENUMS.payloadKind.BYTES) {
    try {
      const bytesPayload = decodeBytesPayload(result.payload.data);
      const availableLength = (bytesPayload.availableBytes.length - 2) / 2;
      if (availableLength > 4096) errors.push('BytesPayloadV0 availableBytes exceeds 4096 bytes');
      if (!bytesPayload.bytesPresent && bytesPayload.availableBytes !== '0x') {
        errors.push('BytesPayloadV0 bytesPresent=false requires empty availableBytes');
      }
      if (result.facts.bytes === ENUMS.bytes.VERIFIED_AVAILABLE) {
        if (!bytesPayload.bytesPresent) errors.push('VERIFIED_AVAILABLE requires BytesPayloadV0 bytesPresent=true');
        if (commitBytes(bytesPayload.availableBytes) !== bytesPayload.expectedDigest) {
          errors.push('VERIFIED_AVAILABLE BytesPayloadV0 expectedDigest does not match availableBytes');
        }
      }
      if (result.facts.bytes === ENUMS.bytes.UNAVAILABLE && bytesPayload.bytesPresent) {
        errors.push('UNAVAILABLE requires BytesPayloadV0 bytesPresent=false');
      }
    } catch (error) {
      errors.push(`invalid BytesPayloadV0: ${error.message}`);
    }
  }

  let mutation = null;
  if (result.kind === ENUMS.kind.MUTATION && result.payload?.payloadKind === ENUMS.payloadKind.MUTATION) {
    mutation = decodeCanonicalMutation(result, errors);
  }
  if (mutation) {
    if (!mutation.operationPresent && mutation.operationId !== ZERO) errors.push('absent operationId must be zero');
    if (mutation.operationPresent && mutation.operationId === ZERO) errors.push('present operationId cannot be zero');
    if (!mutation.planSignatureReceiptPresent && !zeroPlanSignature(mutation.planSignatureReceipt)) {
      errors.push('absent plan signature receipt must be all-zero');
    }
    if (!mutation.canonicalEffectReceiptPresent && !zeroCanonicalEffect(mutation.canonicalEffectReceipt)) {
      errors.push('absent canonical effect receipt must be all-zero');
    }
    if (!mutation.errorPresent && (mutation.error.code !== 0 || mutation.error.subject !== '0x')) {
      errors.push('absent error must be all-zero');
    }
    if (mutation.errorPresent && (mutation.error.code < 1 || mutation.error.code > 11)) {
      errors.push('present error code must be in the declared 1..11 range');
    }
  }
  if (mutation && [ENUMS.effect.COMMITTED, ENUMS.effect.NOT_COMMITTED_PROVEN].includes(result.facts.effect)) {
    if (!mutation.canonicalEffectReceiptPresent) {
      errors.push(`${result.facts.effect === ENUMS.effect.NOT_COMMITTED_PROVEN ? 'NOT_COMMITTED_PROVEN' : 'COMMITTED'} requires a canonical effect receipt`);
    } else {
      const receipt = mutation.canonicalEffectReceipt;
      if (!receipt.operationPresent && receipt.operationId !== ZERO) {
        errors.push('effect receipt absent OperationId must be zero');
      }
      if (receipt.operationPresent && receipt.operationId === ZERO) {
        errors.push('effect receipt present OperationId cannot be zero');
      }
      if (receipt.effect !== result.facts.effect) errors.push('canonical effect receipt has wrong effect');
      if (result.realmId?.present && receipt.realmId !== result.realmId.value) {
        errors.push('effect receipt Realm does not match ResultV0');
      }
      if (result.realmRevisionId?.present && receipt.realmRevisionId !== result.realmRevisionId.value) {
        errors.push('effect receipt Realm revision does not match ResultV0');
      }
      if (result.executionCoordinate?.present
        && BigInt(receipt.executionCoordinate) !== BigInt(result.executionCoordinate.value)) {
        errors.push('effect receipt execution coordinate does not match ResultV0');
      }
      if (result.facts.effect === ENUMS.effect.NOT_COMMITTED_PROVEN
        && receipt.beforeProjectionRoot !== receipt.afterProjectionRoot) {
        errors.push('NOT_COMMITTED_PROVEN requires equal before/after projection roots');
      }
      const bootstrap = result.subjectKind === ENUMS.subjectKind.REALM
        && result.facts.effect === ENUMS.effect.COMMITTED;
      if (bootstrap && receipt.beforeProjectionRoot === receipt.afterProjectionRoot) {
        errors.push('bootstrap COMMITTED must change the projection root');
      }
      if (bootstrap && mutation.operationPresent) errors.push('bootstrap mutation cannot claim an OperationId');
      if (bootstrap && (receipt.operationPresent || receipt.operationId !== ZERO)) {
        errors.push('bootstrap effect receipt cannot claim an OperationId');
      }
      if (!bootstrap && !mutation.operationPresent) {
        errors.push('fresh mutation or rejection requires a present OperationId');
      }
      if (!bootstrap && !receipt.operationPresent) {
        errors.push('fresh mutation or rejection effect receipt requires a present OperationId');
      }
      if (!bootstrap && mutation.operationPresent && receipt.operationPresent
        && receipt.operationId !== mutation.operationId) {
        errors.push('effect receipt OperationId does not match MutationPayloadV0');
      }
    }
  }
  return errors;
}

module.exports = {
  ABI: Object.freeze({ RESULT, POINT_PAYLOAD, PAGE_PAYLOAD, MUTATION_PAYLOAD, BYTES_PAYLOAD }),
  ENUMS,
  RESULT_PAYLOAD,
  absentBytes32,
  commitBytes,
  commitResultV0,
  decodeBytesPayload,
  decodeMutationPayload,
  decodePagePayload,
  decodeResultV0,
  encodeCollectionEntrySubject,
  encodeBytesPayload,
  encodeMutationPayload,
  encodePagePayload,
  encodePointPayload,
  encodeResultV0,
  presentBytes32,
  validateResultV0,
};
