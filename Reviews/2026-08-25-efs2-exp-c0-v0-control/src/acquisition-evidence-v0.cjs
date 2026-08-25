'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();
const {
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  decodeByteReadRequestV0,
  decodeSourceDescriptorV0,
  sourceIdentitiesV0,
  validateReadPreimagesV0,
} = require('./read-request-v0.cjs');

const VERSION = 0;
const ZERO = `0x${'00'.repeat(32)}`;
const DOMAIN = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/ACQUISITION_EVIDENCE'));

const ATTEMPT_OUTCOME = Object.freeze({
  VERIFIED: 1,
  INTEGRITY_FAILED: 2,
  UNAVAILABLE: 3,
  PARTIAL: 4,
});

const OBSERVER = 'tuple(bytes32,bytes32,uint8,uint8,uint64)';
const ATTEMPT = `tuple(uint16,bytes32,bytes32,bool,bytes32,bytes32,uint32,uint32,uint32,uint8,${OBSERVER},bytes)`;
const PACKET = `tuple(bytes32,bytes,bytes32,bytes,bytes32,${ATTEMPT}[])`;

function observerValue(value) {
  return [
    value.blockHash,
    value.stateRoot,
    value.sourceKind,
    value.finality,
    value.freshnessCoordinate,
  ];
}

function attemptValue(value) {
  return [
    value.ordinal,
    value.locatorCommitment,
    value.sourceCommitment,
    value.eligible,
    value.expectedDigest,
    value.observedDigest,
    value.requestedStart,
    value.requestedLength,
    value.observedLength,
    value.outcome,
    observerValue(value.observerBasis),
    value.evidencePointer,
  ];
}

function packetValue(value) {
  return [
    value.requestCommitment,
    value.requestBytes,
    value.sourceDescriptorCommitment,
    value.sourceDescriptorBytes,
    value.resultV0Commitment,
    value.attempts.map(attemptValue),
  ];
}

function encodeAcquisitionEvidencePacketV0(value) {
  return abi.encode([PACKET], [packetValue(value)]);
}

function commitAcquisitionEvidencePacketV0(value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', PACKET],
    [DOMAIN, VERSION, packetValue(value)],
  ));
}

function byteLength(value) {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) return null;
  return (value.length - 2) / 2;
}

function isB32(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function sameHex(left, right) {
  return typeof left === 'string' && typeof right === 'string'
    && left.toLowerCase() === right.toLowerCase();
}

function uint64Value(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) return BigInt(value);
  return null;
}

function validateObserver(observer, ordinal) {
  const errors = [];
  if (!observer || !isB32(observer.blockHash) || !isB32(observer.stateRoot)) {
    errors.push(`attempt ${ordinal} observer basis requires bytes32 block hash and state root`);
    return errors;
  }
  if (observer.sourceKind === 2 && (observer.blockHash === ZERO || observer.stateRoot === ZERO)) {
    errors.push(`attempt ${ordinal} authenticated observer basis requires nonzero block hash and state root`);
  } else if (observer.sourceKind === 1 && (observer.blockHash !== ZERO || observer.stateRoot !== ZERO)) {
    errors.push(`attempt ${ordinal} atomic observer basis requires zero block hash and state root`);
  } else if (observer.sourceKind === 3 && (observer.blockHash === ZERO || observer.stateRoot === ZERO)) {
    errors.push(`attempt ${ordinal} source observed basis requires nonzero block hash and state root`);
  } else if (![1, 2, 3].includes(observer.sourceKind)) {
    errors.push(`attempt ${ordinal} observer sourceKind is unknown`);
  }
  if (![1, 2].includes(observer.finality)) errors.push(`attempt ${ordinal} observer finality is unknown`);
  if (observer.sourceKind === 3 && observer.finality !== 1) {
    errors.push(`attempt ${ordinal} source observed basis finality must be UNPROVEN`);
  }
  const freshness = uint64Value(observer.freshnessCoordinate);
  if (freshness === null || freshness < 0n || freshness >= (1n << 64n)) {
    errors.push(`attempt ${ordinal} observer freshness coordinate is invalid`);
  }
  return errors;
}

function validateAcquisitionEvidencePacketV0(packet, final) {
  const errors = [];
  if (!packet || !isB32(packet.requestCommitment) || /^0x0{64}$/i.test(packet.requestCommitment)
      || !isB32(packet.sourceDescriptorCommitment) || /^0x0{64}$/i.test(packet.sourceDescriptorCommitment)
      || !isB32(packet.resultV0Commitment) || /^0x0{64}$/i.test(packet.resultV0Commitment)) {
    errors.push('packet commitments must be nonzero bytes32');
    return errors;
  }
  errors.push(...validateReadPreimagesV0({
    requestBytes: packet.requestBytes,
    sourceDescriptorBytes: packet.sourceDescriptorBytes,
  }).map((error) => `read preimage: ${error}`));
  let request;
  let descriptor;
  try { request = decodeByteReadRequestV0(packet.requestBytes); } catch {}
  try { descriptor = decodeSourceDescriptorV0(packet.sourceDescriptorBytes); } catch {}
  if (request && commitByteReadRequestV0(request) !== packet.requestCommitment) {
    errors.push('request commitment does not match retained ByteReadRequestV0 preimage');
  }
  if (descriptor && commitSourceDescriptorV0(descriptor) !== packet.sourceDescriptorCommitment) {
    errors.push('source descriptor commitment does not match retained SourceDescriptorV0 preimage');
  }
  if (request && request.sourceDescriptorCommitment !== packet.sourceDescriptorCommitment) {
    errors.push('request and packet source descriptor commitments differ');
  }
  if (packet.requestCommitment !== final.requestCommitment) errors.push('request commitment belongs to a different read');
  if (packet.resultV0Commitment !== final.resultV0Commitment) errors.push('result commitment belongs to a different read');
  if (!Array.isArray(packet.attempts) || packet.attempts.length < 1 || packet.attempts.length > 8) {
    errors.push('attempt count must be within 1..8');
    return errors;
  }

  const sourceIdentities = descriptor ? sourceIdentitiesV0(descriptor) : [];
  let verifiedEligible = 0;
  for (const [index, attempt] of packet.attempts.entries()) {
    if (attempt.ordinal !== index) errors.push(`attempt ordinal ${attempt.ordinal} must equal ${index}`);
    if (!isB32(attempt.locatorCommitment) || !isB32(attempt.sourceCommitment)) {
      errors.push(`attempt ${index} locator/source commitments must be bytes32`);
    }
    const declaredSource = sourceIdentities[index];
    if (!declaredSource || attempt.sourceCommitment !== declaredSource.sourceCommitment
        || attempt.locatorCommitment !== declaredSource.locatorCommitment) {
      errors.push(`attempt ${index} does not name the exact ordered SourceEndpointV0 and locator`);
    }
    if (declaredSource && attempt.eligible !== declaredSource.eligible) {
      errors.push(`attempt ${index} eligibility differs from retained SourceEndpointV0`);
    }
    if (!isB32(attempt.expectedDigest) || !isB32(attempt.observedDigest)) {
      errors.push(`attempt ${index} digests must be bytes32`);
    }
    if (attempt.expectedDigest !== final.expectedDigest) errors.push(`attempt ${index} expected digest differs from final ResultV0`);
    if (attempt.requestedStart !== final.requestedStart || attempt.requestedLength !== final.requestedLength) {
      errors.push(`attempt ${index} requested range differs from final ResultV0 request`);
    }
    for (const name of ['requestedStart', 'requestedLength', 'observedLength']) {
      if (!Number.isSafeInteger(attempt[name]) || attempt[name] < 0 || attempt[name] > 0xffff_ffff) {
        errors.push(`attempt ${index} ${name} is outside uint32`);
      }
    }
    if (!Object.values(ATTEMPT_OUTCOME).includes(attempt.outcome)) errors.push(`attempt ${index} outcome is unknown`);
    const evidenceLength = byteLength(attempt.evidencePointer);
    if (evidenceLength === null || evidenceLength > 256) errors.push(`attempt ${index} evidence pointer exceeds 256 bytes or is malformed`);
    errors.push(...validateObserver(attempt.observerBasis, index));
    if (request && (attempt.expectedDigest !== request.expectedDigest
        || attempt.requestedStart !== request.start || attempt.requestedLength !== request.length)) {
      errors.push(`attempt ${index} digest/range differs from retained ByteReadRequestV0`);
    }
    if (request && (attempt.observerBasis?.sourceKind !== request.requestedSourceKind
        || attempt.observerBasis?.finality !== request.requestedFinality)) {
      errors.push(`attempt ${index} observer kind/finality differs from retained ByteReadRequestV0`);
    }
    if (attempt.outcome === ATTEMPT_OUTCOME.VERIFIED) {
      if (!attempt.eligible) errors.push(`attempt ${index} VERIFIED outcome requires an eligible source`);
      if (attempt.observedDigest !== attempt.expectedDigest) errors.push(`attempt ${index} VERIFIED outcome requires matching digest`);
      if (attempt.observedLength !== attempt.requestedLength) errors.push(`attempt ${index} VERIFIED outcome requires complete requested range`);
      if (attempt.eligible && attempt.observedDigest === attempt.expectedDigest
        && attempt.observedLength === attempt.requestedLength) {
        verifiedEligible += 1;
        if (!final.observerBasis) {
          errors.push(`VERIFIED attempt ${index} requires final ResultV0 observer basis`);
        } else {
          for (const field of ['blockHash', 'stateRoot']) {
            if (!sameHex(attempt.observerBasis?.[field], final.observerBasis[field])) {
              errors.push(`VERIFIED attempt ${index} ${field} differs from final ResultV0 observer basis`);
            }
          }
          for (const field of ['sourceKind', 'finality']) {
            if (attempt.observerBasis?.[field] !== final.observerBasis[field]) {
              errors.push(`VERIFIED attempt ${index} ${field} differs from final ResultV0 observer basis`);
            }
          }
          const attemptFreshness = uint64Value(attempt.observerBasis?.freshnessCoordinate);
          const resultFreshness = uint64Value(final.observerBasis.freshnessCoordinate);
          if (attemptFreshness === null || resultFreshness === null || attemptFreshness !== resultFreshness) {
            errors.push(`VERIFIED attempt ${index} freshnessCoordinate differs from final ResultV0 observer basis`);
          }
        }
      }
    }
    if (attempt.outcome === ATTEMPT_OUTCOME.INTEGRITY_FAILED
      && attempt.observedDigest === attempt.expectedDigest) {
      errors.push(`attempt ${index} INTEGRITY_FAILED outcome cannot report the expected digest`);
    }
    if (attempt.outcome === ATTEMPT_OUTCOME.PARTIAL
      && attempt.observedLength >= attempt.requestedLength) {
      errors.push(`attempt ${index} PARTIAL outcome must be shorter than the requested range`);
    }
  }

  if (final.presence === 'FOUND' && final.bytes === 'VERIFIED_AVAILABLE' && verifiedEligible === 0) {
    errors.push('final VERIFIED_AVAILABLE result requires at least one verified eligible attempt');
  }
  if (final.bytes !== 'VERIFIED_AVAILABLE' && verifiedEligible > 0) {
    errors.push('final non-verified byte fact conflicts with a verified eligible attempt');
  }
  return errors;
}

module.exports = {
  ABI: Object.freeze({ OBSERVER, ATTEMPT, PACKET }),
  ATTEMPT_OUTCOME,
  commitAcquisitionEvidencePacketV0,
  encodeAcquisitionEvidencePacketV0,
  validateAcquisitionEvidencePacketV0,
};
