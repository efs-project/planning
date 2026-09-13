import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';

const require = createRequire(import.meta.url);
const {
  getAddress,
  keccak256,
  recoverAddress,
  toUtf8Bytes,
} = require('ethers');

const HEX = /^0x[0-9a-fA-F]*$/;
const FROZEN_INPUT_BLOBS = Object.freeze({
  profile: '06106fe3bc717ed4638612f2ef8b90d502c705b8',
  expectations: 'a9d6c9afb5f51d0f786e006b7b5df667ae69710e',
});

export function gitBlobHash(raw) {
  if (typeof raw !== 'string' && !Buffer.isBuffer(raw)) {
    throw new TypeError('MALFORMED_FROZEN_INPUT_BYTES');
  }
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8');
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
}

function exactHex(value, bytes, label) {
  if (typeof value !== 'string' || !HEX.test(value) || value.length !== 2 + (bytes * 2)) {
    throw new TypeError(`MALFORMED_${label}: expected ${bytes} bytes of 0x-prefixed hex`);
  }
  return value.toLowerCase();
}

function dynamicHex(value, label) {
  if (typeof value !== 'string' || !HEX.test(value) || value.length % 2 !== 0) {
    throw new TypeError(`MALFORMED_${label}: expected even-length 0x-prefixed hex`);
  }
  return value.toLowerCase();
}

function abiEncodeBytes32(words) {
  return `0x${words.map((word) => exactHex(word, 32, 'BYTES32').slice(2)).join('')}`;
}

function unsupported(profileAxis) {
  return {
    status: 'UNSUPPORTED',
    reason: profileAxis?.reason ?? 'profile does not declare this axis',
    evidence: [],
  };
}

export function reconstructCommitments(profile, input) {
  const body = dynamicHex(input.body, 'BODY');
  const bodyHash = keccak256(body);

  let typeIdentity;
  if (profile.typeIdentity?.support === 'SUPPORTED') {
    if (typeof input.typeDomainText !== 'string') {
      throw new TypeError('MALFORMED_TYPE_DOMAIN');
    }
    if (input.typeDomainText !== profile.typeIdentity.quoteDomainText) {
      throw new TypeError('TYPE_DOMAIN_MISMATCH');
    }
    typeIdentity = {
      status: profile.typeIdentity.support,
      value: keccak256(toUtf8Bytes(profile.typeIdentity.quoteDomainText)),
      evidence: [{ kind: 'UTF8_LITERAL', value: profile.typeIdentity.quoteDomainText }],
    };
  } else {
    typeIdentity = unsupported(profile.typeIdentity);
  }
  const bodyCommitment = {
      status: 'SUPPORTED',
      value: bodyHash,
      evidence: [{ kind: 'RAW_BYTES', value: body }],
  };

  let recordIdentity;
  if (profile.recordIdentity?.support !== 'SUPPORTED') {
    recordIdentity = unsupported(profile.recordIdentity);
  } else if (typeIdentity.status !== 'SUPPORTED') {
    recordIdentity = { status: 'UNSUPPORTED', reason: 'DEPENDENCY_UNSUPPORTED:typeIdentity', evidence: [] };
  } else {
    const recordDomain = keccak256(toUtf8Bytes(profile.recordIdentity.domainText));
    const preimage = abiEncodeBytes32([recordDomain, typeIdentity.value, bodyHash]);
    recordIdentity = {
      status: 'SUPPORTED',
      value: keccak256(preimage),
      preimage,
      evidence: [{ kind: 'PROFILE_DECLARATION', value: profile.recordIdentity.preimage }],
    };
  }

  let subjectIdentity;
  if (profile.subjectIdentity?.support !== 'SUPPORTED') {
    subjectIdentity = unsupported(profile.subjectIdentity);
  } else {
    const subjectDomain = keccak256(toUtf8Bytes(profile.subjectIdentity.domainText));
    const principalId = exactHex(input.principalId, 32, 'PRINCIPAL_ID');
    const salt = exactHex(input.salt, 32, 'SALT');
    const preimage = abiEncodeBytes32([subjectDomain, principalId, salt]);
    subjectIdentity = {
      status: 'SUPPORTED',
      value: keccak256(preimage),
      preimage,
      evidence: [
        { kind: 'RAW_PRINCIPAL_ID', value: principalId },
        { kind: 'RAW_SALT', value: salt },
      ],
    };
  }

  return {
    typeIdentity,
    bodyCommitment,
    recordIdentity,
    subjectIdentity,
    actionCommitment: unsupported(profile.actionCommitment),
    signedDigest: unsupported(profile.signedDigest),
  };
}

export function verifyEoaSignature(digest, signature, expectedAuthor) {
  const checkedDigest = exactHex(digest, 32, 'DIGEST');
  const checkedSignature = exactHex(signature, 65, 'SIGNATURE');
  const checkedAuthor = getAddress(expectedAuthor);

  try {
    const recovered = recoverAddress(checkedDigest, checkedSignature);
    return {
      status: recovered === checkedAuthor ? 'VALID' : 'INVALID',
      ...(recovered === checkedAuthor ? {} : { reason: 'RECOVERED_AUTHOR_MISMATCH' }),
      recovered,
      expectedAuthor: checkedAuthor,
      evidence: { digest: checkedDigest, signature: checkedSignature },
      scope: 'generic supplied-digest recovery control; not candidate PublicationIntent evidence',
      authorizesCandidatePlan: false,
    };
  } catch (error) {
    return {
      status: 'INVALID',
      reason: error instanceof Error ? error.message : String(error),
      expectedAuthor: checkedAuthor,
      evidence: { digest: checkedDigest, signature: checkedSignature },
      scope: 'generic supplied-digest recovery control; not candidate PublicationIntent evidence',
      authorizesCandidatePlan: false,
    };
  }
}

function unknownAxis(name) {
  return {
    status: 'UNKNOWN',
    reason: `MISSING_EVIDENCE:${name}`,
    evidence: [],
  };
}

function evaluateObservedAxis(observations, name) {
  const observation = observations[name];
  if (!observation) return unknownAxis(name);
  const copied = structuredClone(observation);
  if (!Array.isArray(copied.evidence) || copied.evidence.length === 0) {
    return {
      status: 'UNKNOWN',
      reason: `MISSING_EVIDENCE:${name}`,
      evidence: [],
    };
  }
  return {
    status: 'UNKNOWN',
    reason: `UNAUTHENTICATED_OBSERVATION:${name}`,
    evidence: [],
    retainedEvidenceItems: copied.evidence.length,
  };
}

function evaluateCanonicalEffect(observations) {
  const effects = observations.requiredEffects;
  if (Array.isArray(effects)) {
    for (const effect of effects) {
      if (!effect || typeof effect.name !== 'string') {
        throw new TypeError('MALFORMED_REQUIRED_EFFECT');
      }
      if (Object.hasOwn(effect, 'expected')) {
        throw new TypeError(`CANDIDATE_EXPECTATION_FORBIDDEN:${effect.name}`);
      }
    }
  }
  return {
    status: 'UNSUPPORTED',
    reason: 'REQUIRED_EFFECT_CLOSURE_UNPINNED',
    evidence: [],
    retainedEffectCount: Array.isArray(effects) ? effects.length : 0,
  };
}

export function correlateRpcResponses(requests, responses) {
  if (!Array.isArray(requests) || !Array.isArray(responses)) {
    throw new TypeError('MALFORMED_RPC_SET');
  }

  const requestIds = new Set();
  for (const request of requests) {
    if (!request || !Object.hasOwn(request, 'id')) throw new TypeError('MISSING_RPC_REQUEST_ID');
    if (requestIds.has(request.id)) throw new TypeError(`DUPLICATE_RPC_REQUEST_ID:${request.id}`);
    requestIds.add(request.id);
  }

  const byId = new Map();
  for (const response of responses) {
    if (!response || !Object.hasOwn(response, 'id')) throw new TypeError('MISSING_RPC_RESPONSE_ID');
    if (byId.has(response.id)) throw new TypeError(`DUPLICATE_RPC_RESPONSE_ID:${response.id}`);
    if (!requestIds.has(response.id)) throw new TypeError(`UNEXPECTED_RPC_RESPONSE_ID:${response.id}`);
    byId.set(response.id, structuredClone(response));
  }

  return requests.map((request) => {
    if (!byId.has(request.id)) throw new TypeError(`MISSING_RPC_RESPONSE:${request.id}`);
    return { request: structuredClone(request), response: byId.get(request.id) };
  });
}

export function classifyCostState(input) {
  const evidence = structuredClone(input ?? {});
  const required = [
    ['control.actor', input?.control?.actor],
    ['control.actionShape', input?.control?.actionShape],
    ['control.bodySizeBytes', input?.control?.bodySizeBytes],
    ['control.initialStateRegime', input?.control?.initialStateRegime],
    ['basis.beforeBlockHash', input?.basis?.beforeBlockHash],
    ['basis.afterBlockHash', input?.basis?.afterBlockHash],
    ['provenance.kind', input?.provenance?.kind],
    ['provenance.source', input?.provenance?.source],
    ['recordPresentBefore', input?.recordPresentBefore],
    ['recordPresentAfter', input?.recordPresentAfter],
    ['sameOperationAlreadyPresentBefore', input?.sameOperationAlreadyPresentBefore],
    ['occurrenceCountBefore', input?.occurrenceCountBefore],
    ['occurrenceCountAfter', input?.occurrenceCountAfter],
    ['effectCommitmentBefore', input?.effectCommitmentBefore],
    ['effectCommitmentAfter', input?.effectCommitmentAfter],
    ['stateDelta', input?.stateDelta],
  ];
  const missing = required.find(([, value]) => value === undefined || value === null);
  if (missing) {
    return {
      status: 'UNKNOWN',
      reason: `MISSING_COST_EVIDENCE:${missing[0]}`,
      evidence,
    };
  }

  let normalized;
  try {
    if (typeof input.control.actionShape !== 'string' || input.control.actionShape.length === 0) {
      throw new TypeError('control.actionShape');
    }
    if (typeof input.control.initialStateRegime !== 'string'
      || input.control.initialStateRegime.length === 0) {
      throw new TypeError('control.initialStateRegime');
    }
    if (typeof input.provenance.kind !== 'string' || input.provenance.kind.length === 0
      || typeof input.provenance.source !== 'string' || input.provenance.source.length === 0) {
      throw new TypeError('provenance');
    }
    if (![input.recordPresentBefore, input.recordPresentAfter, input.sameOperationAlreadyPresentBefore]
      .every((value) => typeof value === 'boolean')) {
      throw new TypeError('prePostBooleans');
    }
    const bodySizeBytes = BigInt(input.control.bodySizeBytes);
    const occurrenceCountBefore = BigInt(input.occurrenceCountBefore);
    const occurrenceCountAfter = BigInt(input.occurrenceCountAfter);
    const stateDelta = BigInt(input.stateDelta);
    if ([bodySizeBytes, occurrenceCountBefore, occurrenceCountAfter, stateDelta]
      .some((value) => value < 0n)) {
      throw new TypeError('negativeInteger');
    }
    normalized = {
      actor: getAddress(input.control.actor),
      actionShape: input.control.actionShape,
      bodySizeBytes: bodySizeBytes.toString(),
      initialStateRegime: input.control.initialStateRegime,
      beforeBlockHash: exactHex(input.basis.beforeBlockHash, 32, 'BEFORE_BLOCK_HASH'),
      afterBlockHash: exactHex(input.basis.afterBlockHash, 32, 'AFTER_BLOCK_HASH'),
      occurrenceCountBefore,
      occurrenceCountAfter,
      stateDelta,
      effectCommitmentBefore: exactHex(input.effectCommitmentBefore, 32, 'EFFECT_COMMITMENT_BEFORE'),
      effectCommitmentAfter: exactHex(input.effectCommitmentAfter, 32, 'EFFECT_COMMITMENT_AFTER'),
    };
  } catch (error) {
    return {
      status: 'UNKNOWN',
      reason: `MALFORMED_COST_EVIDENCE:${error instanceof Error ? error.message : String(error)}`,
      evidence,
    };
  }

  const controlKey = keccak256(toUtf8Bytes(JSON.stringify([
    normalized.actor,
    normalized.actionShape,
    normalized.bodySizeBytes,
    normalized.initialStateRegime,
  ])));
  const occurrenceDelta = normalized.occurrenceCountAfter - normalized.occurrenceCountBefore;
  const effectChanged = normalized.effectCommitmentBefore !== normalized.effectCommitmentAfter;
  const before = input.recordPresentBefore;
  const after = input.recordPresentAfter;
  const retried = input.sameOperationAlreadyPresentBefore;

  let value = 'INCONSISTENT';
  if (!before && after && !retried && occurrenceDelta === 1n
    && effectChanged && normalized.stateDelta > 0n) {
    value = 'FRESH';
  } else if (before && after && !retried && occurrenceDelta === 1n
    && effectChanged && normalized.stateDelta > 0n) {
    value = 'EXISTING';
  } else if (before && after && retried && occurrenceDelta === 0n
    && !effectChanged && normalized.stateDelta === 0n) {
    value = 'RETRY';
  }

  return {
    status: 'CLASSIFIED_FROM_SUPPLIED_FACTS',
    value,
    ...(value === 'INCONSISTENT' ? { reason: 'CONTRADICTORY_PRE_POST_FACTS' } : {}),
    controlKey,
    evidenceGrade: 'UNAUTHENTICATED_INPUT',
    evidence,
  };
}

function evaluateCostState(input) {
  const classification = classifyCostState(input);
  if (classification.status === 'UNKNOWN') return classification;
  return {
    status: 'UNKNOWN',
    reason: 'UNAUTHENTICATED_COST_EVIDENCE',
    evidence: [],
    provisionalClassification: classification.value,
    controlKey: classification.controlKey,
  };
}

function requireBasisArtifact(anchor, role, name) {
  const artifact = anchor?.[name];
  if (!artifact || typeof artifact !== 'object') {
    throw new TypeError(`MISSING_BASIS_ARTIFACT:${role}.${name}`);
  }
  if (artifact.availability === 'UNAVAILABLE') {
    if (typeof artifact.reason !== 'string' || artifact.reason.length === 0) {
      throw new TypeError(`MALFORMED_BASIS_ARTIFACT:${role}.${name}`);
    }
    return;
  }
  if (artifact.availability === 'AVAILABLE') {
    const raw = dynamicHex(artifact.raw, `${role.toUpperCase()}_${name.toUpperCase()}_RAW`);
    const commitment = exactHex(
      artifact.commitment,
      32,
      `${role.toUpperCase()}_${name.toUpperCase()}_COMMITMENT`,
    );
    if (keccak256(raw) !== commitment) {
      throw new TypeError(`BASIS_ARTIFACT_COMMITMENT_MISMATCH:${role}.${name}`);
    }
    return;
  }
  throw new TypeError(`MALFORMED_BASIS_ARTIFACT:${role}.${name}`);
}

function verifyBasisAnchor(anchor, role) {
  if (!anchor || typeof anchor !== 'object') {
    throw new TypeError(`MISSING_OBSERVATION_BASIS:${role}`);
  }
  if (typeof anchor.chainId !== 'string' || !/^(0|[1-9][0-9]*)$/.test(anchor.chainId)
    || typeof anchor.blockNumber !== 'string' || !/^(0|[1-9][0-9]*)$/.test(anchor.blockNumber)
    || typeof anchor.provenance !== 'string' || anchor.provenance.length === 0) {
    throw new TypeError(`MALFORMED_OBSERVATION_BASIS:${role}`);
  }
  let blockHash;
  let realmAddress;
  try {
    blockHash = exactHex(anchor.blockHash, 32, `${role.toUpperCase()}_BLOCK_HASH`);
    realmAddress = getAddress(anchor.realmAddress);
  } catch {
    throw new TypeError(`MALFORMED_OBSERVATION_BASIS:${role}`);
  }
  for (const name of ['header', 'runtime', 'accountProof', 'storageProof']) {
    requireBasisArtifact(anchor, role, name);
  }
  return {
    chainId: anchor.chainId,
    blockNumber: anchor.blockNumber,
    blockHash,
    realmAddress,
    provenance: anchor.provenance,
  };
}

function verifyObservationBinding(observation, label, role, anchor) {
  if (!observation) return;
  if (observation.basisRole !== role || observation.blockHash !== anchor.blockHash) {
    throw new TypeError(`MIXED_OBSERVATION_BASIS:${label}`);
  }
  if (typeof observation.source !== 'string' || observation.source.length === 0
    || typeof observation.proofGrade !== 'string' || observation.proofGrade.length === 0) {
    throw new TypeError(`MISSING_OBSERVATION_PROVENANCE:${label}`);
  }
}

function verifySeal(packet, profile, expectations) {
  if (packet?.seal?.candidateSourceCommit !== profile?.candidate?.sourceCommit) {
    throw new TypeError('PROFILE_SOURCE_COMMIT_MISMATCH');
  }
  for (const [name, value] of Object.entries(expectations.source)) {
    if (packet?.seal?.neutralSource?.[name] !== value) {
      throw new TypeError(`NEUTRAL_SOURCE_MISMATCH:${name}`);
    }
  }
  const source = verifyBasisAnchor(packet?.seal?.observationBasis?.source, 'source');
  const destination = verifyBasisAnchor(packet?.seal?.observationBasis?.destination, 'destination');
  const observations = packet.observations ?? {};
  for (const [name, role] of [
    ['referenceValidation', 'source'],
    ['sourceAcceptance', 'source'],
    ['destinationAdmission', 'destination'],
    ['submission', 'destination'],
    ['receipt', 'destination'],
  ]) {
    verifyObservationBinding(observations[name], name, role, role === 'source' ? source : destination);
  }
  if (Array.isArray(observations.requiredEffects)) {
    observations.requiredEffects.forEach((effect, index) => {
      verifyObservationBinding(effect, `requiredEffects[${index}]`, 'destination', destination);
    });
  }
  return {
    status: 'STRUCTURALLY_BOUND_UNAUTHENTICATED',
    reason: 'NO_INDEPENDENT_HEADER_ACCOUNT_STORAGE_PROOF_VERIFIER',
    source,
    destination,
  };
}

export function compareCommitmentClaim(commitment, claimed) {
  if (commitment.status !== 'SUPPORTED') {
    return { ...commitment, claimed };
  }
  return {
    ...commitment,
    status: claimed === commitment.value ? 'MATCH' : 'MISMATCH',
    claimed,
  };
}

function comparisonValue(axis, evaluated) {
  if (!Object.hasOwn(evaluated, axis)) return 'UNSUPPORTED_CLAIM_AXIS';
  if (axis === 'recordIdentity' || axis === 'subjectIdentity' || axis === 'costState') {
    return Object.hasOwn(evaluated[axis], 'value')
      ? evaluated[axis].value
      : evaluated[axis].status;
  }
  return evaluated[axis].status;
}

function verifyFrozenInputs(profile, expectations, inputBytes) {
  if (!inputBytes || !Object.hasOwn(inputBytes, 'profileRaw')
    || !Object.hasOwn(inputBytes, 'expectationsRaw')) {
    throw new TypeError('MISSING_FROZEN_INPUT_BYTES');
  }
  const profileBlob = gitBlobHash(inputBytes.profileRaw);
  const expectationsBlob = gitBlobHash(inputBytes.expectationsRaw);
  if (profileBlob !== FROZEN_INPUT_BLOBS.profile) throw new TypeError('PROFILE_BLOB_MISMATCH');
  if (expectationsBlob !== FROZEN_INPUT_BLOBS.expectations) {
    throw new TypeError('EXPECTATIONS_BLOB_MISMATCH');
  }

  let parsedProfile;
  let parsedExpectations;
  try {
    parsedProfile = JSON.parse(inputBytes.profileRaw.toString());
    parsedExpectations = JSON.parse(inputBytes.expectationsRaw.toString());
  } catch {
    throw new TypeError('MALFORMED_FROZEN_INPUT_JSON');
  }
  if (!isDeepStrictEqual(profile, parsedProfile)) throw new TypeError('PROFILE_OBJECT_MISMATCH');
  if (!isDeepStrictEqual(expectations, parsedExpectations)) {
    throw new TypeError('EXPECTATIONS_OBJECT_MISMATCH');
  }
  return {
    status: 'VERIFIED_FROZEN_FILES',
    profileBlob,
    expectationsBlob,
  };
}

export function checkSealedPacket(packet, profile, expectations, inputBytes) {
  const inputIntegrity = verifyFrozenInputs(profile, expectations, inputBytes);
  const observationIntegrity = verifySeal(packet, profile, expectations);
  const rawObservations = structuredClone(packet.observations ?? {});
  const claims = structuredClone(packet.claims ?? {});
  const commitments = reconstructCommitments(profile, packet.inputs ?? {});

  const claimedRecord = claims.recordIdentity;
  const claimedSubject = claims.subjectIdentity;
  const evaluated = {
    recordIdentity: compareCommitmentClaim(commitments.recordIdentity, claimedRecord),
    subjectIdentity: compareCommitmentClaim(commitments.subjectIdentity, claimedSubject),
    actionCommitment: commitments.actionCommitment,
    signedDigest: commitments.signedDigest,
    signatureValidity: {
      ...unsupported(profile.signedDigest),
      reason: profile.signedDigest?.reason
        ?? 'candidate signed-plan digest is not reconstructable from the public profile',
      authorizesCandidatePlan: false,
    },
    referenceValidation: evaluateObservedAxis(rawObservations, 'referenceValidation'),
    sourceAcceptance: evaluateObservedAxis(rawObservations, 'sourceAcceptance'),
    destinationAdmission: evaluateObservedAxis(rawObservations, 'destinationAdmission'),
    submission: evaluateObservedAxis(rawObservations, 'submission'),
    receipt: evaluateObservedAxis(rawObservations, 'receipt'),
    canonicalEffect: evaluateCanonicalEffect(rawObservations),
    queryCoverage: {
      status: 'UNSUPPORTED',
      reason: 'QUERY_PROFILE_AND_COVERAGE_PROOF_UNPINNED',
      evidence: [],
    },
    destinationSelection: {
      status: 'UNSUPPORTED',
      reason: 'DESTINATION_SELECTION_RULE_UNPINNED',
      evidence: [],
    },
    costState: evaluateCostState(rawObservations.costState),
  };
  evaluated.retryAllowed = evaluated.submission.status === 'UNKNOWN' ? false : null;

  const discrepancies = [];
  for (const [axis, claimed] of Object.entries(claims)) {
    const value = comparisonValue(axis, evaluated);
    if (claimed !== value) {
      discrepancies.push({ axis, claimed, evaluated: value });
    }
  }

  return {
    inputIntegrity,
    observationIntegrity,
    profileSourceCommit: profile.candidate.sourceCommit,
    observationBasis: structuredClone(packet.seal.observationBasis),
    rawObservations,
    claims,
    evaluated,
    discrepancies,
  };
}
