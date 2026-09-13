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

  const typeIdentity = profile.typeIdentity?.support === 'SUPPORTED'
    ? {
      status: profile.typeIdentity.support,
      value: keccak256(toUtf8Bytes(String(input.typeDomainText))),
      evidence: [{ kind: 'UTF8_LITERAL', value: String(input.typeDomainText) }],
    }
    : unsupported(profile.typeIdentity);
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

  if (name === 'referenceValidation') {
    if (copied.targetFound === true && copied.targetTypeMatches === true) {
      return { status: 'VALID', proofGrade: copied.proofGrade, evidence: copied.evidence };
    }
    if (copied.targetFound === true && copied.targetTypeMatches === false) {
      return { status: 'INVALID', proofGrade: copied.proofGrade, evidence: copied.evidence };
    }
    if (copied.targetFound === false && copied.absenceProven === true) {
      return { status: 'ABSENT_PROVEN', proofGrade: copied.proofGrade, evidence: copied.evidence };
    }
  }

  if (name === 'sourceAcceptance' || name === 'destinationAdmission') {
    if (copied.rowPresent === true && copied.acceptanceProfileMatches === true) {
      return {
        status: name === 'sourceAcceptance' ? 'ACCEPTED' : 'ADMITTED',
        proofGrade: copied.proofGrade,
        evidence: copied.evidence,
      };
    }
    if (copied.rowPresent === true && copied.acceptanceProfileMatches === false) {
      return { status: 'REJECTED', proofGrade: copied.proofGrade, evidence: copied.evidence };
    }
    if (copied.rowPresent === false && copied.absenceProven === true) {
      return {
        status: name === 'sourceAcceptance' ? 'NOT_ACCEPTED_PROVEN' : 'NOT_ADMITTED_PROVEN',
        proofGrade: copied.proofGrade,
        evidence: copied.evidence,
      };
    }
  }

  if (name === 'submission' && typeof copied.transactionHash === 'string') {
    return {
      status: 'OBSERVED',
      transactionHash: exactHex(copied.transactionHash, 32, 'TRANSACTION_HASH'),
      proofGrade: copied.proofGrade,
      evidence: copied.evidence,
    };
  }

  if (name === 'receipt') {
    if (copied.statusHex === '0x1') {
      return { status: 'SUCCESS', proofGrade: copied.proofGrade, evidence: copied.evidence };
    }
    if (copied.statusHex === '0x0') {
      return { status: 'REVERTED', proofGrade: copied.proofGrade, evidence: copied.evidence };
    }
  }

  return {
    status: 'UNKNOWN',
    reason: `INSUFFICIENT_RAW_EVIDENCE:${name}`,
    evidence: copied.evidence,
  };
}

function evaluateCanonicalEffect(observations) {
  const effects = observations.requiredEffects;
  if (!Array.isArray(effects) || effects.length === 0) {
    return unknownAxis('requiredEffects');
  }

  const checked = effects.map((effect) => {
    if (!effect || typeof effect.name !== 'string') {
      throw new TypeError('MALFORMED_REQUIRED_EFFECT');
    }
    if (!Array.isArray(effect.evidence) || effect.evidence.length === 0) {
      return { ...structuredClone(effect), status: 'UNKNOWN', evidence: [] };
    }
    if (effect.absenceProven === true && effect.observed === null) {
      return { ...structuredClone(effect), status: 'NOT_COMMITTED_PROVEN' };
    }
    if (!Object.hasOwn(effect, 'expected') || !Object.hasOwn(effect, 'observed')) {
      return { ...structuredClone(effect), status: 'UNKNOWN' };
    }
    return {
      ...structuredClone(effect),
      status: isDeepStrictEqual(effect.expected, effect.observed) ? 'COMMITTED' : 'VIOLATED',
    };
  });

  if (checked.some(({ status }) => status === 'VIOLATED')) {
    return { status: 'VIOLATED', effects: checked };
  }
  if (checked.some(({ status }) => status === 'NOT_COMMITTED_PROVEN')) {
    return { status: 'NOT_COMMITTED_PROVEN', effects: checked };
  }
  if (checked.every(({ status }) => status === 'COMMITTED')) {
    return { status: 'COMMITTED', effects: checked };
  }
  return { status: 'UNKNOWN', reason: 'INCOMPLETE_EFFECT_EVIDENCE', effects: checked };
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
  const before = input?.recordPresentBefore;
  const after = input?.recordPresentAfter;
  const retried = input?.sameOperationAlreadyPresentBefore;
  const evidence = structuredClone(input ?? {});

  if (![before, after, retried].every((value) => typeof value === 'boolean')) {
    return { status: 'CLASSIFIED', value: 'INCONSISTENT', reason: 'MISSING_PRE_POST_FACTS', evidence };
  }
  if (!before && after && !retried) return { status: 'CLASSIFIED', value: 'FRESH', evidence };
  if (before && after && !retried) return { status: 'CLASSIFIED', value: 'EXISTING', evidence };
  if (before && after && retried && input.stateDelta === '0') {
    return { status: 'CLASSIFIED', value: 'RETRY', evidence };
  }
  return { status: 'CLASSIFIED', value: 'INCONSISTENT', reason: 'CONTRADICTORY_PRE_POST_FACTS', evidence };
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
  const blockHash = packet?.seal?.observationBasis?.blockHash;
  if (typeof blockHash !== 'string') {
    throw new TypeError('MISSING_OBSERVATION_BASIS');
  }
  try {
    exactHex(blockHash, 32, 'BLOCK_HASH');
  } catch {
    throw new TypeError('MALFORMED_OBSERVATION_BASIS');
  }
}

function evaluateSignature(observations, commitments) {
  const observation = observations.signature;
  if (!observation) return unknownAxis('signature');
  if (!Array.isArray(observation.evidence) || observation.evidence.length === 0) {
    return unknownAxis('signature');
  }
  if (observation.bindsAxis !== 'recordIdentity') {
    return { status: 'UNSUPPORTED', reason: 'UNSUPPORTED_SIGNATURE_BINDING_AXIS', evidence: observation.evidence };
  }

  const suppliedDigest = exactHex(observation.digest, 32, 'DIGEST');
  const expectedDigest = commitments.recordIdentity.value;
  if (suppliedDigest !== expectedDigest) {
    return {
      status: 'INVALID',
      reason: 'DIGEST_BINDING_MISMATCH',
      suppliedDigest,
      expectedDigest,
      evidence: structuredClone(observation.evidence),
      authorizesCandidatePlan: false,
    };
  }
  return verifyEoaSignature(expectedDigest, observation.signature, observation.expectedAuthor);
}

function comparisonValue(axis, evaluated) {
  if (!Object.hasOwn(evaluated, axis)) return undefined;
  if (axis === 'recordIdentity' || axis === 'subjectIdentity' || axis === 'costState') {
    return evaluated[axis].value;
  }
  return evaluated[axis].status;
}

export function checkSealedPacket(packet, profile, expectations) {
  verifySeal(packet, profile, expectations);
  const rawObservations = structuredClone(packet.observations ?? {});
  const claims = structuredClone(packet.claims ?? {});
  const commitments = reconstructCommitments(profile, packet.inputs ?? {});

  const claimedRecord = claims.recordIdentity;
  const claimedSubject = claims.subjectIdentity;
  const evaluated = {
    recordIdentity: {
      ...commitments.recordIdentity,
      status: claimedRecord === commitments.recordIdentity.value ? 'MATCH' : 'MISMATCH',
      claimed: claimedRecord,
    },
    subjectIdentity: {
      ...commitments.subjectIdentity,
      status: claimedSubject === commitments.subjectIdentity.value ? 'MATCH' : 'MISMATCH',
      claimed: claimedSubject,
    },
    actionCommitment: commitments.actionCommitment,
    signedDigest: commitments.signedDigest,
    signatureValidity: evaluateSignature(rawObservations, commitments),
    referenceValidation: evaluateObservedAxis(rawObservations, 'referenceValidation'),
    sourceAcceptance: evaluateObservedAxis(rawObservations, 'sourceAcceptance'),
    destinationAdmission: evaluateObservedAxis(rawObservations, 'destinationAdmission'),
    submission: evaluateObservedAxis(rawObservations, 'submission'),
    receipt: evaluateObservedAxis(rawObservations, 'receipt'),
    canonicalEffect: evaluateCanonicalEffect(rawObservations),
    costState: classifyCostState(rawObservations.costState),
  };
  evaluated.retryAllowed = evaluated.submission.status === 'UNKNOWN' ? false : null;

  const discrepancies = [];
  for (const [axis, claimed] of Object.entries(claims)) {
    const value = comparisonValue(axis, evaluated);
    if (value !== undefined && claimed !== value) {
      discrepancies.push({ axis, claimed, evaluated: value });
    }
  }

  return {
    profileSourceCommit: profile.candidate.sourceCommit,
    observationBasis: structuredClone(packet.seal.observationBasis),
    rawObservations,
    claims,
    evaluated,
    discrepancies,
  };
}
