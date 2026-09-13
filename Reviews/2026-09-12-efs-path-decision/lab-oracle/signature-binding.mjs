#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const {
  AbiCoder,
  concat,
  getAddress,
  hexlify,
  Interface,
  keccak256,
  recoverAddress,
  toUtf8Bytes,
} = require('ethers');

const HEX = /^0x[0-9a-fA-F]*$/;
const WORD = /^0x[0-9a-fA-F]{64}$/;
const ZERO_WORD = `0x${'00'.repeat(32)}`;
const RETAINED_EXPECTATIONS_GIT_BLOB = '12870aa95b8dd3b2b9f146f92c24034f12bbfea3';

function bytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.from(value);
}

export function gitBlobHash(value) {
  const content = bytes(value);
  return createHash('sha1')
    .update(Buffer.from(`blob ${content.length}\0`))
    .update(content)
    .digest('hex');
}

export function verifyPinnedPublicProfile(publicProfileBytes, profile) {
  const observed = gitBlobHash(publicProfileBytes);
  if (observed !== profile?.source?.publicProfile?.gitBlob) {
    throw new TypeError('PUBLIC_SIGNATURE_PROFILE_BLOB_MISMATCH');
  }
  return observed;
}

export function parsePinnedVector(publicVectorBytes, profile) {
  const observed = gitBlobHash(publicVectorBytes);
  if (observed !== profile?.source?.publicVector?.gitBlob) {
    throw new TypeError('PUBLIC_SIGNATURE_VECTOR_BLOB_MISMATCH');
  }
  let parsed;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes(publicVectorBytes));
    parsed = JSON.parse(text);
  } catch (error) {
    throw new TypeError(`MALFORMED_PUBLIC_SIGNATURE_VECTOR:${error.message}`);
  }
  if (parsed?.schema !== profile.source.publicVector.schema) {
    throw new TypeError('PUBLIC_SIGNATURE_VECTOR_SCHEMA_MISMATCH');
  }
  return parsed;
}

export function parsePinnedAbiProfile(abiProfileBytes, profile) {
  const observed = gitBlobHash(abiProfileBytes);
  if (observed !== profile?.source?.authorizedAbiProfile?.gitBlob) {
    throw new TypeError('AUTHORIZED_ABI_PROFILE_BLOB_MISMATCH');
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes(abiProfileBytes)));
  } catch (error) {
    throw new TypeError(`MALFORMED_AUTHORIZED_ABI_PROFILE:${error.message}`);
  }
}

export function parsePinnedRetainedPacket(retainedPacketBytes, profile) {
  const content = bytes(retainedPacketBytes);
  const observedGitBlob = gitBlobHash(content);
  const observedSha256 = createHash('sha256').update(content).digest('hex');
  if (observedGitBlob !== profile?.source?.retainedPacket?.gitBlob
    || observedSha256 !== profile?.source?.retainedPacket?.sha256) {
    throw new TypeError('RETAINED_SIGNATURE_PACKET_BLOB_MISMATCH');
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(content));
  } catch (error) {
    throw new TypeError(`MALFORMED_RETAINED_SIGNATURE_PACKET:${error.message}`);
  }
}

export function parsePinnedRetainedExpectations(retainedExpectationsBytes, profile) {
  if (gitBlobHash(retainedExpectationsBytes) !== RETAINED_EXPECTATIONS_GIT_BLOB) {
    throw new TypeError('RETAINED_SIGNATURE_EXPECTATIONS_BLOB_MISMATCH');
  }
  let parsed;
  try {
    const text = new TextDecoder('utf-8', { fatal: true })
      .decode(bytes(retainedExpectationsBytes));
    parsed = JSON.parse(text);
  } catch (error) {
    throw new TypeError(`MALFORMED_RETAINED_SIGNATURE_EXPECTATIONS:${error.message}`);
  }
  const packetSource = parsed?.source?.retainedPacket;
  const abiSource = parsed?.source?.authorizedAbiProfile;
  if (parsed?.kind !== 'EFS_INDEPENDENT_SIGNATURE_BINDING_RETAINED_EXPECTATIONS'
    || parsed.version !== 1
    || parsed.cell !== 'signed-one/quote'
    || parsed.function !== 'executeSigned'
    || parsed.expectedCount !== 2
    || !Array.isArray(parsed.orderedNonces)
    || parsed.orderedNonces.length !== 2
    || parsed.orderedNonces[0] !== '0'
    || parsed.orderedNonces[1] !== '1') {
    throw new TypeError('MALFORMED_RETAINED_SIGNATURE_EXPECTATIONS');
  }
  if (packetSource?.commit !== profile?.source?.retainedPacket?.commit
    || packetSource?.path !== profile?.source?.retainedPacket?.path
    || packetSource?.sha256 !== profile?.source?.retainedPacket?.sha256
    || packetSource?.gitBlob !== profile?.source?.retainedPacket?.gitBlob
    || abiSource?.path !== profile?.source?.authorizedAbiProfile?.path
    || abiSource?.gitBlob !== profile?.source?.authorizedAbiProfile?.gitBlob) {
    throw new TypeError('RETAINED_SIGNATURE_EXPECTATIONS_SOURCE_MISMATCH');
  }
  return parsed;
}

function normalizeHex(value, label, exactBytes) {
  if (typeof value !== 'string' || !HEX.test(value) || value.length % 2 !== 0) {
    throw new TypeError(`MALFORMED_${label}: expected even-length 0x-prefixed hex`);
  }
  if (exactBytes !== undefined && value.length !== 2 + (exactBytes * 2)) {
    throw new TypeError(`MALFORMED_${label}: expected ${exactBytes} bytes`);
  }
  return value.toLowerCase();
}

function normalizeWord(value, label) {
  if (typeof value !== 'string' || !WORD.test(value)) {
    throw new TypeError(`MALFORMED_${label}: expected bytes32`);
  }
  return value.toLowerCase();
}

function normalizeAddress(value, label) {
  try {
    return getAddress(value).toLowerCase();
  } catch {
    throw new TypeError(`MALFORMED_${label}: expected address`);
  }
}

function unsigned(value, bits, label) {
  let parsed;
  try {
    if (typeof value === 'bigint') {
      parsed = value;
    } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
      parsed = BigInt(value);
    } else if (typeof value === 'string' && (/^(0|[1-9][0-9]*)$/.test(value)
      || /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value))) {
      parsed = BigInt(value);
    } else {
      throw new TypeError('not an integer');
    }
  } catch {
    throw new TypeError(`MALFORMED_${label}: expected uint${bits}`);
  }
  if (parsed < 0n || parsed >= (1n << BigInt(bits))) {
    throw new TypeError(`MALFORMED_${label}: outside uint${bits} range`);
  }
  return parsed;
}

function normalizeAction(action, index) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) {
    throw new TypeError(`MALFORMED_ACTIONS_${index}: expected object`);
  }
  const normalized = {
    kind: unsigned(action.kind, 8, `ACTIONS_${index}_KIND`),
    typeId: normalizeWord(action.typeId, `ACTIONS_${index}_TYPE_ID`),
    bodyHashOrRecordId: normalizeWord(action.bodyHashOrRecordId, `ACTIONS_${index}_BODY_HASH_OR_RECORD_ID`),
    purpose: normalizeWord(action.purpose, `ACTIONS_${index}_PURPOSE`),
    subject: normalizeWord(action.subject, `ACTIONS_${index}_SUBJECT`),
    role: normalizeWord(action.role, `ACTIONS_${index}_ROLE`),
    target: normalizeWord(action.target, `ACTIONS_${index}_TARGET`),
    expectedRevision: unsigned(action.expectedRevision, 32, `ACTIONS_${index}_EXPECTED_REVISION`),
    salt: normalizeWord(action.salt, `ACTIONS_${index}_SALT`),
  };
  normalized.tuple = [
    normalized.kind,
    normalized.typeId,
    normalized.bodyHashOrRecordId,
    normalized.purpose,
    normalized.subject,
    normalized.role,
    normalized.target,
    normalized.expectedRevision,
    normalized.salt,
  ];
  return normalized;
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) throw new TypeError('MALFORMED_ACTIONS_CONTAINER');
  return actions.map(normalizeAction);
}

function normalizeBodies(bodies) {
  if (!Array.isArray(bodies)) throw new TypeError('MALFORMED_BODIES_CONTAINER');
  return bodies.map((body, index) => normalizeHex(body, `BODIES_${index}`));
}

function normalizeIntent(intent) {
  if (!intent || typeof intent !== 'object' || Array.isArray(intent)) {
    throw new TypeError('MALFORMED_INTENT_CONTAINER');
  }
  return {
    realmId: normalizeWord(intent.realmId, 'INTENT_REALM_ID'),
    coreCodeCommitment: normalizeWord(intent.coreCodeCommitment, 'INTENT_CORE_CODE_COMMITMENT'),
    author: normalizeAddress(intent.author, 'INTENT_AUTHOR'),
    nonce: unsigned(intent.nonce, 64, 'INTENT_NONCE'),
    deadline: unsigned(intent.deadline, 64, 'INTENT_DEADLINE'),
    acceptanceProfile: normalizeWord(intent.acceptanceProfile, 'INTENT_ACCEPTANCE_PROFILE'),
    indexObligations: normalizeWord(intent.indexObligations, 'INTENT_INDEX_OBLIGATIONS'),
  };
}

function compare(computed, supplied) {
  const left = typeof computed === 'string' ? computed.toLowerCase() : computed;
  const right = typeof supplied === 'string' ? supplied.toLowerCase() : supplied;
  return {
    status: left === right ? 'MATCH' : 'MISMATCH',
    computed,
    supplied: supplied ?? 'UNAVAILABLE',
  };
}

function bodyCommitment(actions, bodies, profile) {
  const mismatches = [];
  if (bodies.length !== actions.length) {
    mismatches.push({
      reason: 'BODIES_LENGTH_DIFFERS_FROM_ACTIONS_LENGTH',
      actionCount: actions.length,
      bodyCount: bodies.length,
    });
  }
  for (let index = 0; index < Math.min(actions.length, bodies.length); index += 1) {
    const action = actions[index];
    const body = bodies[index];
    const rule = profile.actionRules[action.kind.toString()];
    if (!rule) {
      mismatches.push({ index, reason: 'ACTION_KIND_OUTSIDE_DECLARED_RANGE', kind: action.kind.toString() });
    } else if (rule.bodyRule === 'HASH_EQUALS_BODY_HASH_OR_RECORD_ID') {
      const computedBodyHash = keccak256(body);
      if (computedBodyHash !== action.bodyHashOrRecordId) {
        mismatches.push({
          index,
          reason: 'PUBLISH_BODY_HASH_MISMATCH',
          computedBodyHash,
          signedBodyHash: action.bodyHashOrRecordId,
        });
      }
    } else if (body !== '0x') {
      mismatches.push({ index, reason: 'NON_PUBLISH_BODY_MUST_BE_EMPTY', kind: rule.name });
    }
  }
  return {
    status: mismatches.length === 0 ? 'MATCH' : 'MISMATCH',
    reason: mismatches.length === 0
      ? 'EVERY_BODY_MATCHES_ITS_SIGNED_ACTION_RULE'
      : 'AT_LEAST_ONE_BODY_DIFFERS_FROM_ITS_SIGNED_ACTION_RULE',
    mismatches,
  };
}

function fieldIsZero(action, field) {
  return field === 'expectedRevision' ? action[field] === 0n : action[field] === ZERO_WORD;
}

function declaredActionShape(actions, bodies, commitment, profile) {
  const mismatches = [...commitment.mismatches];
  if (actions.length < profile.limits.actionsMin || actions.length > profile.limits.actionsMax) {
    mismatches.push({
      reason: 'ACTION_COUNT_OUTSIDE_DECLARED_RANGE',
      observed: actions.length,
      minimum: profile.limits.actionsMin,
      maximum: profile.limits.actionsMax,
    });
  }
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    const rule = profile.actionRules[action.kind.toString()];
    if (!rule) continue;
    for (const field of rule.zeroFields ?? []) {
      if (!fieldIsZero(action, field)) {
        mismatches.push({ index, reason: 'FIELD_MUST_BE_ZERO', kind: rule.name, field });
      }
    }
    for (const field of rule.nonzeroFields ?? []) {
      if (fieldIsZero(action, field)) {
        mismatches.push({ index, reason: 'FIELD_MUST_BE_NONZERO', kind: rule.name, field });
      }
    }
    if (rule.name === 'PUBLISH' && bodies[index] !== undefined
      && ((bodies[index].length - 2) / 2) > profile.limits.publishBodyMaxBytes) {
      mismatches.push({
        index,
        reason: 'PUBLISH_BODY_EXCEEDS_DECLARED_LIMIT',
        observedBytes: (bodies[index].length - 2) / 2,
        maximumBytes: profile.limits.publishBodyMaxBytes,
      });
    }
  }
  return {
    status: mismatches.length === 0 ? 'MATCH' : 'MISMATCH',
    reason: mismatches.length === 0
      ? 'DECLARED_STATIC_ACTION_AND_BODY_SHAPES_MATCH'
      : 'DECLARED_STATIC_ACTION_OR_BODY_SHAPE_MISMATCH',
    mismatches,
  };
}

function derive(actions, intent, vector, profile) {
  if (vector.actionTuple !== profile.encoding.actionTuple) {
    throw new TypeError('PUBLIC_ACTION_TUPLE_DIFFERS_FROM_FROZEN_PROFILE');
  }
  if (vector?.eip712?.domainType !== profile.encoding.domainType) {
    throw new TypeError('PUBLIC_DOMAIN_TYPE_DIFFERS_FROM_FROZEN_PROFILE');
  }
  if (vector?.eip712?.intentType !== profile.encoding.intentType) {
    throw new TypeError('PUBLIC_INTENT_TYPE_DIFFERS_FROM_FROZEN_PROFILE');
  }
  if (vector?.eip712?.domain?.name !== profile.encoding.domain.name
    || vector?.eip712?.domain?.version !== profile.encoding.domain.version) {
    throw new TypeError('PUBLIC_DOMAIN_VALUES_DIFFER_FROM_FROZEN_PROFILE');
  }

  const abi = AbiCoder.defaultAbiCoder();
  const actionsEncoded = abi.encode(
    [profile.encoding.actionTuple],
    [actions.map((action) => action.tuple)],
  ).toLowerCase();
  const actionsHash = keccak256(actionsEncoded);

  const domainTypehash = keccak256(toUtf8Bytes(vector.eip712.domainType));
  const domainSeparator = keccak256(abi.encode(
    ['bytes32', 'bytes32', 'bytes32'],
    [
      domainTypehash,
      keccak256(toUtf8Bytes(vector.eip712.domain.name)),
      keccak256(toUtf8Bytes(vector.eip712.domain.version)),
    ],
  ));

  const intentTypehash = keccak256(toUtf8Bytes(vector.eip712.intentType));
  const structEncoded = abi.encode(
    ['bytes32', ...profile.encoding.intentFields.map(({ type }) => type)],
    [
      intentTypehash,
      intent.realmId,
      intent.coreCodeCommitment,
      intent.author,
      intent.nonce,
      intent.deadline,
      intent.acceptanceProfile,
      intent.indexObligations,
      actionsHash,
    ],
  ).toLowerCase();
  const structHash = keccak256(structEncoded);
  const digestPreimage = hexlify(concat(['0x1901', domainSeparator, structHash])).toLowerCase();
  const digest = keccak256(digestPreimage);

  return {
    actionsEncoded,
    actionsHash,
    domainTypehash,
    domainSeparator,
    intentTypehash,
    structEncoded,
    structHash,
    digestPreimage,
    digest,
  };
}

function malformedSignature(reason, extra = {}) {
  return { status: 'MALFORMED', reason, ...extra };
}

function signatureBinding(signature, digest, expectedAuthor, profile) {
  if (typeof signature !== 'string' || !HEX.test(signature) || signature.length % 2 !== 0) {
    return malformedSignature('SIGNATURE_MUST_BE_EVEN_LENGTH_HEX');
  }
  if (signature.length !== 2 + (profile.limits.signatureBytes * 2)) {
    return malformedSignature('SIGNATURE_MUST_BE_EXACTLY_65_BYTES');
  }
  const r = `0x${signature.slice(2, 66)}`.toLowerCase();
  const s = `0x${signature.slice(66, 130)}`.toLowerCase();
  const v = Number.parseInt(signature.slice(130, 132), 16);
  if (!profile.limits.allowedV.includes(v)) {
    return malformedSignature('SIGNATURE_V_MUST_BE_27_OR_28', { r, s, v });
  }
  if (BigInt(s) > BigInt(profile.limits.lowSMax)) {
    return malformedSignature('SIGNATURE_S_EXCEEDS_LOW_S_MAXIMUM', { r, s, v });
  }
  let recovered;
  try {
    recovered = recoverAddress(digest, { r, s, v });
  } catch (error) {
    return malformedSignature('SIGNATURE_RECOVERY_FAILED', { r, s, v, error: error.message });
  }
  const valid = recovered.toLowerCase() === expectedAuthor.toLowerCase();
  return {
    status: valid ? 'VALID' : 'INVALID',
    reason: valid
      ? 'RECOVERED_SIGNER_MATCHES_INTENT_AUTHOR'
      : 'RECOVERED_SIGNER_DIFFERS_FROM_INTENT_AUTHOR',
    r,
    s,
    v,
    recovered,
    expectedAuthor,
    scope: 'cryptographic digest binding only',
  };
}

function comparisons(derived, bodyHash, binding, vector) {
  return {
    bodyHash: compare(bodyHash, vector?.inputs?.bodyHash),
    actionsEncoded: compare(derived.actionsEncoded, vector?.actionCommitment?.actionsEncoded),
    actionsHash: compare(derived.actionsHash, vector?.actionCommitment?.actionsHash),
    domainTypehash: compare(derived.domainTypehash, vector?.eip712?.domainTypehash),
    domainSeparator: compare(derived.domainSeparator, vector?.eip712?.domainSeparator),
    intentTypehash: compare(derived.intentTypehash, vector?.eip712?.intentTypehash),
    structEncoded: compare(derived.structEncoded, vector?.eip712?.structEncoded),
    structHash: compare(derived.structHash, vector?.eip712?.structHash),
    digestPreimage: compare(derived.digestPreimage, vector?.eip712?.digestPreimage),
    digest: compare(derived.digest, vector?.eip712?.digest),
    signatureR: compare(binding.r, vector?.signature?.r),
    signatureS: compare(binding.s, vector?.signature?.s),
    signatureV: compare(binding.v, vector?.signature?.v),
    recovered: compare(binding.recovered, vector?.signature?.recovered),
  };
}

export function analyzeSignatureBinding(vector, profile, input = {}) {
  if (!vector || typeof vector !== 'object' || Array.isArray(vector)) {
    throw new TypeError('MALFORMED_SIGNATURE_VECTOR_CONTAINER');
  }
  if (profile?.kind !== 'EFS_INDEPENDENT_SIGNATURE_BINDING_PROFILE') {
    throw new TypeError('MISSING_INDEPENDENT_SIGNATURE_BINDING_PROFILE');
  }

  const actions = normalizeActions(vector.actions);
  const bodies = normalizeBodies(vector?.inputs?.bodies);
  const intent = normalizeIntent(vector.intent);
  const derived = derive(actions, intent, vector, profile);
  const bodyHash = keccak256(normalizeHex(vector?.inputs?.body, 'INPUT_BODY'));
  const commitment = bodyCommitment(actions, bodies, profile);
  const actionShape = declaredActionShape(actions, bodies, commitment, profile);
  const binding = signatureBinding(
    vector?.signature?.serialized,
    derived.digest,
    intent.author,
    profile,
  );
  const compared = comparisons(derived, bodyHash, binding, vector);
  const comparisonCounts = Object.values(compared).reduce((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { MATCH: 0, MISMATCH: 0 });

  return {
    kind: 'EFS_INDEPENDENT_SIGNATURE_BINDING_REPORT',
    version: 1,
    standing: 'candidate-specific byte and signature interpretation; not authenticated state or a candidate verdict',
    input: {
      publicProfile: {
        publishedCommit: profile.source.publicProfile.publishedCommit,
        path: profile.source.publicProfile.path,
        expectedGitBlob: profile.source.publicProfile.gitBlob,
        observedGitBlob: input.publicProfileGitBlob ?? 'UNAVAILABLE',
      },
      publicVector: {
        publishedCommit: profile.source.publicVector.publishedCommit,
        path: profile.source.publicVector.path,
        expectedGitBlob: profile.source.publicVector.gitBlob,
        observedGitBlob: input.publicVectorGitBlob ?? 'UNAVAILABLE',
      },
      interpretationProfileGitBlob: input.interpretationProfileGitBlob ?? 'UNAVAILABLE',
      candidateSourceAssociation: profile.source.candidateSourceCommit,
      vectorStanding: vector.standing,
    },
    derivationInputs: profile.independence.derivationInputs,
    comparisonOnlyFields: profile.independence.comparisonOnly,
    ignoredFields: profile.independence.ignored,
    derived,
    comparisons: compared,
    comparisonCounts,
    bodyCommitment: commitment,
    declaredActionShape: actionShape,
    signatureBinding: binding,
    replayDomain: profile.replayDomain,
    runtimeAcceptance: {
      status: 'UNKNOWN',
      reason: 'NO_RUNTIME_EXECUTION_OR_STATE_OBSERVATION',
    },
    stateAuthorization: {
      status: 'UNKNOWN',
      reason: 'SIGNATURE_VALIDITY_DOES_NOT_ESTABLISH_NONCE_PERMISSION_ADMISSION_OR_CURRENT_STATE',
    },
    authenticatedProvenance: {
      status: 'UNKNOWN',
      reason: 'PINNED_PUBLIC_BYTES_ARE_NOT_AUTHENTICATED_CHAIN_OR_DEPLOYMENT_EVIDENCE',
    },
    canonicalSemanticEffect: {
      status: 'UNKNOWN',
      reason: 'NO_PINNED_CANONICAL_READ_BACK',
    },
    unproven: profile.unproven,
    candidatePass: 'NOT_EVALUATED',
  };
}

function abiDeclarations(abiProfile, surface) {
  const declarations = abiProfile?.artifacts?.[surface]?.abi;
  if (!Array.isArray(declarations)) throw new TypeError(`MISSING_AUTHORIZED_ABI_SURFACE:${surface}`);
  return declarations.map(({ selector: _selector, ...declaration }) => declaration);
}

function decodedVector(decoded, profile) {
  const intent = decoded[0];
  const actions = [...decoded[1]].map((action) => ({
    kind: Number(action[0]),
    typeId: action[1],
    bodyHashOrRecordId: action[2],
    purpose: action[3],
    subject: action[4],
    role: action[5],
    target: action[6],
    expectedRevision: action[7].toString(),
    salt: action[8],
  }));
  const bodies = [...decoded[2]];
  return {
    actionTuple: profile.encoding.actionTuple,
    actions,
    inputs: {
      body: bodies.find((body) => body !== '0x') ?? '0x',
      bodies,
    },
    intent: {
      realmId: intent[0],
      coreCodeCommitment: intent[1],
      author: intent[2],
      nonce: intent[3].toString(),
      deadline: intent[4].toString(),
      acceptanceProfile: intent[5],
      indexObligations: intent[6],
    },
    eip712: {
      domainType: profile.encoding.domainType,
      domain: profile.encoding.domain,
      intentType: profile.encoding.intentType,
    },
    signature: { serialized: decoded[3] },
  };
}

function isObjectContainer(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function analyzeRetainedSignedTransactions(packet, abiProfile, profile, expectations) {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    throw new TypeError('MALFORMED_RETAINED_SIGNATURE_PACKET_CONTAINER');
  }
  if (expectations?.kind !== 'EFS_INDEPENDENT_SIGNATURE_BINDING_RETAINED_EXPECTATIONS'
    || expectations.version !== 1
    || expectations.cell !== 'signed-one/quote'
    || expectations.function !== 'executeSigned'
    || expectations.expectedCount !== 2
    || !Array.isArray(expectations.orderedNonces)
    || expectations.orderedNonces.length !== 2
    || expectations.orderedNonces[0] !== '0'
    || expectations.orderedNonces[1] !== '1') {
    throw new TypeError('MALFORMED_RETAINED_SIGNATURE_EXPECTATIONS');
  }
  if (!Object.hasOwn(packet, 'cells')) {
    return {
      status: 'UNKNOWN',
      reason: 'RETAINED_SIGNED_CELL_OR_TRANSACTIONS_UNAVAILABLE',
      transactions: [],
    };
  }
  if (!isObjectContainer(packet.cells)) {
    throw new TypeError('MALFORMED_RETAINED_SIGNATURE_CELLS_CONTAINER');
  }
  if (!Object.hasOwn(packet.cells, expectations.cell)) {
    return {
      status: 'UNKNOWN',
      reason: 'RETAINED_SIGNED_CELL_OR_TRANSACTIONS_UNAVAILABLE',
      transactions: [],
    };
  }
  const cell = packet.cells[expectations.cell];
  if (!isObjectContainer(cell)) {
    throw new TypeError('MALFORMED_RETAINED_SIGNATURE_CELL_CONTAINER');
  }
  if (!Object.hasOwn(cell, 'transactions')) {
    return {
      status: 'UNKNOWN',
      reason: 'RETAINED_SIGNED_CELL_OR_TRANSACTIONS_UNAVAILABLE',
      transactions: [],
    };
  }
  const transactions = cell.transactions;
  if (!Array.isArray(transactions)) {
    throw new TypeError('MALFORMED_RETAINED_SIGNATURE_TRANSACTIONS_CONTAINER');
  }
  const ledger = new Interface(abiDeclarations(abiProfile, 'Ledger'));
  const selector = ledger.getFunction(expectations.function).selector.toLowerCase();
  const validated = transactions.map((transaction, transactionIndex) => {
    if (!isObjectContainer(transaction)) {
      throw new TypeError(`MALFORMED_RETAINED_TRANSACTION_${transactionIndex}_CONTAINER`);
    }
    if (!Object.hasOwn(transaction, 'data')) {
      throw new TypeError(`MISSING_RETAINED_TRANSACTION_${transactionIndex}_CALLDATA`);
    }
    const supplied = normalizeHex(
      transaction.data,
      `RETAINED_TRANSACTION_${transactionIndex}_CALLDATA`,
    );
    return { transaction, transactionIndex, supplied };
  });
  const selected = validated.filter(({ supplied }) => supplied.slice(0, 10) === selector);
  if (selected.length === 0) {
    return {
      status: 'UNKNOWN',
      reason: 'NO_RETAINED_EXECUTE_SIGNED_CALLDATA',
      transactions: [],
    };
  }

  const examined = selected.map(({ transaction, transactionIndex, supplied }) => {
    let decoded;
    let canonical;
    try {
      decoded = ledger.decodeFunctionData('executeSigned', supplied);
      canonical = ledger.encodeFunctionData('executeSigned', [...decoded]).toLowerCase();
    } catch (error) {
      return {
        transactionIndex,
        calldata: { status: 'MISMATCH', reason: 'AUTHORIZED_ABI_DECODE_FAILED', error: error.message },
        signatureBinding: { status: 'UNKNOWN', reason: 'CALLDATA_NOT_DECODED' },
      };
    }
    const vector = decodedVector(decoded, profile);
    const analyzed = analyzeSignatureBinding(vector, profile);
    return {
      transactionIndex,
      to: transaction.to ?? 'UNAVAILABLE',
      nonce: vector.intent.nonce,
      actionCount: vector.actions.length,
      bodyCount: vector.inputs.bodies.length,
      calldata: compare(canonical, supplied),
      derived: analyzed.derived,
      bodyCommitment: analyzed.bodyCommitment,
      declaredActionShape: analyzed.declaredActionShape,
      signatureBinding: analyzed.signatureBinding,
      replayDomain: analyzed.replayDomain,
      receiptReference: {
        standing: 'retained candidate packet field; not independently authenticated',
        blockNumber: transaction?.receipt?.blockNumber ?? 'UNAVAILABLE',
        blockHash: transaction?.receipt?.blockHash ?? 'UNAVAILABLE',
        status: transaction?.receipt?.status ?? 'UNAVAILABLE',
      },
      runtimeAcceptance: analyzed.runtimeAcceptance,
      stateAuthorization: analyzed.stateAuthorization,
      canonicalSemanticEffect: analyzed.canonicalSemanticEffect,
    };
  });
  const nonceOrderMatches = examined.length === expectations.orderedNonces.length
    && examined.every((item, index) => item.nonce === expectations.orderedNonces[index]);
  const mismatch = selected.length !== expectations.expectedCount
    || !nonceOrderMatches
    || examined.some((item) => (
    item.calldata.status === 'MISMATCH'
    || item.bodyCommitment?.status === 'MISMATCH'
    || item.declaredActionShape?.status === 'MISMATCH'
    || item.signatureBinding.status === 'INVALID'
    || item.signatureBinding.status === 'MALFORMED'
  ));

  return {
    status: mismatch ? 'OBSERVED_MISMATCH' : 'OBSERVED_MATCH',
    reason: mismatch
      ? 'RETAINED_SIGNED_CALLDATA_COUNT_NONCE_ORDER_OR_BINDING_MISMATCH'
      : 'TWO_RETAINED_CALLDATA_VALUES_CANONICALLY_DECODE_AND_BIND_TO_THEIR_AUTHORS',
    expectedCount: expectations.expectedCount,
    observedCount: selected.length,
    selector,
    transactions: examined,
    authenticatedPacketProvenance: {
      status: 'UNKNOWN',
      reason: 'RETAINED_PACKET_HASH_IS_NOT_AN_AUTHENTICATED_CHAIN_OBSERVATION',
    },
    runtimeAcceptance: {
      status: 'UNKNOWN',
      reason: 'RECEIPT_FIELDS_DO_NOT_PROVE_CURRENT_OR_CANONICAL_RUNTIME_ACCEPTANCE',
    },
    canonicalSemanticEffect: {
      status: 'UNKNOWN',
      reason: 'NO_INDEPENDENT_PINNED_STATE_READ_BACK_FOR_RETAINED_CALLDATA',
    },
  };
}

export function shortSignatureReport(report) {
  const retained = report.retainedSignedTransactions;
  return {
    kind: report.kind,
    version: report.version,
    standing: report.standing,
    input: report.input,
    positiveVector: {
      derived: {
        bodyHash: report.comparisons.bodyHash.computed,
        actionsEncodedBytes: (report.derived.actionsEncoded.length - 2) / 2,
        actionsHash: report.derived.actionsHash,
        domainTypehash: report.derived.domainTypehash,
        domainSeparator: report.derived.domainSeparator,
        intentTypehash: report.derived.intentTypehash,
        structHash: report.derived.structHash,
        digestPreimage: report.derived.digestPreimage,
        digest: report.derived.digest,
      },
      comparisons: Object.fromEntries(Object.entries(report.comparisons)
        .map(([name, result]) => [name, result.status])),
      comparisonCounts: report.comparisonCounts,
      bodyCommitment: report.bodyCommitment,
      declaredActionShape: report.declaredActionShape,
      signatureBinding: report.signatureBinding,
    },
    replayDomain: report.replayDomain,
    retainedSignedTransactions: retained && {
      status: retained.status,
      reason: retained.reason,
      expectedCount: retained.expectedCount,
      observedCount: retained.observedCount,
      selector: retained.selector,
      transactions: retained.transactions.map((item) => ({
        transactionIndex: item.transactionIndex,
        to: item.to,
        nonce: item.nonce,
        actionCount: item.actionCount,
        bodyCount: item.bodyCount,
        calldata: {
          status: item.calldata.status,
          encodedBytes: typeof item.calldata.computed === 'string'
            ? (item.calldata.computed.length - 2) / 2
            : 'UNAVAILABLE',
        },
        actionsHash: item.derived?.actionsHash ?? 'UNAVAILABLE',
        digest: item.derived?.digest ?? 'UNAVAILABLE',
        bodyCommitment: item.bodyCommitment,
        declaredActionShape: item.declaredActionShape,
        signatureBinding: item.signatureBinding,
        receiptReference: item.receiptReference,
        runtimeAcceptance: item.runtimeAcceptance,
        stateAuthorization: item.stateAuthorization,
        canonicalSemanticEffect: item.canonicalSemanticEffect,
      })),
      authenticatedPacketProvenance: retained.authenticatedPacketProvenance,
      runtimeAcceptance: retained.runtimeAcceptance,
      canonicalSemanticEffect: retained.canonicalSemanticEffect,
    },
    runtimeAcceptance: report.runtimeAcceptance,
    stateAuthorization: report.stateAuthorization,
    authenticatedProvenance: report.authenticatedProvenance,
    canonicalSemanticEffect: report.canonicalSemanticEffect,
    unproven: report.unproven,
    candidatePass: report.candidatePass,
  };
}

function gitObjectBytes(source) {
  const revision = source.publishedCommit ?? source.commit;
  return execFileSync('git', [
    'show',
    `${revision}:${source.path}`,
  ]);
}

async function main() {
  const [profilePath] = process.argv.slice(2);
  if (!profilePath) throw new TypeError('USAGE: signature-binding.mjs PROFILE_JSON');
  const profileBytes = await readFile(profilePath);
  const profile = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(profileBytes));
  const publicProfileBytes = gitObjectBytes(profile.source.publicProfile);
  const publicVectorBytes = gitObjectBytes(profile.source.publicVector);
  const publicProfileGitBlob = verifyPinnedPublicProfile(publicProfileBytes, profile);
  const vector = parsePinnedVector(publicVectorBytes, profile);
  const report = analyzeSignatureBinding(vector, profile, {
    publicProfileGitBlob,
    publicVectorGitBlob: gitBlobHash(publicVectorBytes),
    interpretationProfileGitBlob: gitBlobHash(profileBytes),
  });
  const abiProfileBytes = await readFile(profile.source.authorizedAbiProfile.path);
  const abiProfile = parsePinnedAbiProfile(abiProfileBytes, profile);
  const retainedExpectationsBytes = await readFile(new URL(
    'signature-binding-retained-expectations-dcc7b94.json',
    import.meta.url,
  ));
  const retainedExpectations = parsePinnedRetainedExpectations(
    retainedExpectationsBytes,
    profile,
  );
  const retainedPacketBytes = gitObjectBytes(profile.source.retainedPacket);
  const retainedPacket = parsePinnedRetainedPacket(retainedPacketBytes, profile);
  report.retainedSignedTransactions = analyzeRetainedSignedTransactions(
    retainedPacket,
    abiProfile,
    profile,
    retainedExpectations,
  );
  report.input.authorizedAbiProfile = {
    path: profile.source.authorizedAbiProfile.path,
    expectedGitBlob: profile.source.authorizedAbiProfile.gitBlob,
    observedGitBlob: gitBlobHash(abiProfileBytes),
  };
  report.input.retainedPacket = {
    commit: profile.source.retainedPacket.commit,
    path: profile.source.retainedPacket.path,
    expectedGitBlob: profile.source.retainedPacket.gitBlob,
    observedGitBlob: gitBlobHash(retainedPacketBytes),
    expectedSha256: profile.source.retainedPacket.sha256,
    observedSha256: createHash('sha256').update(retainedPacketBytes).digest('hex'),
  };
  process.stdout.write(`${JSON.stringify(shortSignatureReport(report), null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`SIGNATURE_BINDING_ERROR:${error.message}\n`);
    process.exitCode = 2;
  });
}
