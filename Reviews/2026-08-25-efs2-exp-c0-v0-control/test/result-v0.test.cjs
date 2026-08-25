const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENUMS,
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
} = require('../src/result-v0.cjs');

const b32 = (byte) => `0x${byte.repeat(32)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;
const ZERO = b32('00');
const MAX_U64 = (1n << 64n) - 1n;

function facts(overrides = {}) {
  return {
    presence: ENUMS.presence.FOUND,
    coverage: ENUMS.coverage.COMPLETE,
    support: ENUMS.support.SUPPORTED,
    validation: ENUMS.validation.SEMANTICALLY_VALID,
    authority: ENUMS.authority.AUTHORIZED,
    lifecycle: ENUMS.lifecycle.ADMITTED,
    selection: ENUMS.selection.CURRENT,
    bytes: ENUMS.bytes.VERIFIED_AVAILABLE,
    effect: ENUMS.effect.NOT_APPLICABLE,
    ...overrides,
  };
}

function profiles(overrides = {}) {
  return {
    typeSchemaId: absentBytes32(),
    queryProfileId: absentBytes32(),
    queryGeneration: { present: false, value: 0 },
    policyId: absentBytes32(),
    verifierProfileId: absentBytes32(),
    codeCommitment: absentBytes32(),
    dependencyCommitment: absentBytes32(),
    resolutionPlanId: absentBytes32(),
    ...overrides,
  };
}

function pointResult() {
  const raw = utf8Hex('canonical Record tuple bytes');
  return {
    kind: ENUMS.kind.POINT,
    subjectKind: ENUMS.subjectKind.RECORD,
    subject: utf8Hex('record-key'),
    realmId: presentBytes32(b32('11')),
    realmRevisionId: presentBytes32(b32('12')),
    executionCoordinate: { present: true, value: 42n },
    admissionHighWater: { present: true, value: 7 },
    observerBasis: {
      present: true,
      value: {
        blockHash: b32('13'),
        stateRoot: b32('14'),
        sourceKind: ENUMS.observerSource.AUTHENTICATED_OBSERVER,
        finality: ENUMS.finality.UNPROVEN,
        freshnessCoordinate: 42n,
      },
    },
    profileCommitments: profiles({
      typeSchemaId: presentBytes32(b32('15')),
      verifierProfileId: presentBytes32(b32('16')),
    }),
    facts: facts({ selection: ENUMS.selection.NOT_APPLICABLE }),
    payload: {
      payloadKind: ENUMS.payloadKind.POINT,
      data: encodePointPayload({
        key: utf8Hex('record-key'),
        valuePresent: true,
        value: raw,
        proofOfLocalAbsence: false,
      }),
    },
    rawRetention: { present: true, canonicalBytes: raw, commitment: commitBytes(raw) },
    projectionIntegrity: ENUMS.projectionIntegrity.MATCHED,
  };
}

function rejectedMutation(beforeRoot, afterRoot) {
  const operationId = b32('21');
  return {
    kind: ENUMS.kind.MUTATION,
    subjectKind: ENUMS.subjectKind.OPERATION,
    subject: utf8Hex('operation-key'),
    realmId: presentBytes32(b32('11')),
    realmRevisionId: presentBytes32(b32('12')),
    executionCoordinate: { present: true, value: 99n },
    admissionHighWater: { present: true, value: 7 },
    observerBasis: { present: false, value: null },
    profileCommitments: profiles({ verifierProfileId: presentBytes32(b32('16')) }),
    facts: facts({
      presence: ENUMS.presence.NOT_APPLICABLE,
      coverage: ENUMS.coverage.NOT_APPLICABLE,
      lifecycle: ENUMS.lifecycle.NOT_APPLICABLE,
      selection: ENUMS.selection.NOT_APPLICABLE,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
      effect: ENUMS.effect.NOT_COMMITTED_PROVEN,
    }),
    payload: {
      payloadKind: ENUMS.payloadKind.MUTATION,
      data: encodeMutationPayload({
        operationPresent: true,
        operationId,
        admissionReceiptIds: [],
        planSignatureReceiptPresent: false,
        planSignatureReceipt: null,
        canonicalEffectReceiptPresent: true,
        canonicalEffectReceipt: {
          operationPresent: true,
          operationId,
          realmId: b32('11'),
          realmRevisionId: b32('12'),
          executionCoordinate: 99n,
          beforeProjectionRoot: beforeRoot,
          afterProjectionRoot: afterRoot,
          effect: ENUMS.effect.NOT_COMMITTED_PROVEN,
        },
        errorPresent: true,
        error: { code: 10, subject: utf8Hex('binding-precondition') },
      }),
    },
    rawRetention: { present: false, canonicalBytes: '0x', commitment: ZERO },
    projectionIntegrity: ENUMS.projectionIntegrity.NOT_APPLICABLE,
  };
}

function replaceMutationReceipt(result, overrides = {}) {
  const bootstrap = result.subjectKind === ENUMS.subjectKind.REALM
    && result.facts.effect === ENUMS.effect.COMMITTED;
  const receipt = {
    operationPresent: !bootstrap,
    operationId: bootstrap ? ZERO : b32('21'),
    realmId: b32('11'),
    realmRevisionId: b32('12'),
    executionCoordinate: 99n,
    beforeProjectionRoot: b32('31'),
    afterProjectionRoot: b32('31'),
    effect: result.facts.effect,
    ...overrides,
  };
  result.payload.data = encodeMutationPayload({
    operationPresent: result.subjectKind !== ENUMS.subjectKind.REALM,
    operationId: result.subjectKind === ENUMS.subjectKind.REALM ? ZERO : receipt.operationId,
    admissionReceiptIds: [],
    planSignatureReceiptPresent: false,
    planSignatureReceipt: null,
    canonicalEffectReceiptPresent: true,
    canonicalEffectReceipt: receipt,
    errorPresent: result.facts.effect === ENUMS.effect.NOT_COMMITTED_PROVEN,
    error: result.facts.effect === ENUMS.effect.NOT_COMMITTED_PROVEN ? { code: 10, subject: '0x' } : null,
  });
}

function resultForKind(kindName) {
  if (kindName === 'MUTATION') return rejectedMutation(b32('31'), b32('31'));
  const result = pointResult();
  result.kind = ENUMS.kind[kindName];
  result.facts.selection = ENUMS.selection.NOT_APPLICABLE;
  result.facts.bytes = ENUMS.bytes.NOT_APPLICABLE;
  result.facts.effect = ENUMS.effect.NOT_APPLICABLE;
  result.projectionIntegrity = ENUMS.projectionIntegrity.NOT_APPLICABLE;

  if (kindName === 'POINT') return result;
  if (kindName === 'SCOPE') {
    result.subjectKind = ENUMS.subjectKind.QUERY;
    result.facts.presence = ENUMS.presence.FOUND;
    result.facts.coverage = ENUMS.coverage.PARTIAL;
    result.payload = {
      payloadKind: ENUMS.payloadKind.PAGE,
      data: encodePagePayload({
        members: [utf8Hex('member')],
        cursorPresent: false,
        pageOrdinal: 0,
        declaredDomainRoot: b32('41'),
      }),
    };
    return result;
  }
  if (kindName === 'REQUEST') {
    result.subjectKind = ENUMS.subjectKind.OPERATION;
    result.facts = facts({
      presence: ENUMS.presence.UNKNOWN,
      coverage: ENUMS.coverage.NOT_APPLICABLE,
      support: ENUMS.support.UNSUPPORTED,
      validation: ENUMS.validation.UNPROVEN,
      authority: ENUMS.authority.UNPROVEN,
      lifecycle: ENUMS.lifecycle.UNPROVEN,
      selection: ENUMS.selection.UNKNOWN,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
      effect: ENUMS.effect.NOT_APPLICABLE,
    });
  } else if (kindName === 'VERIFIER') {
    result.subjectKind = ENUMS.subjectKind.ADMISSION;
    result.facts = facts({
      presence: ENUMS.presence.NOT_APPLICABLE,
      coverage: ENUMS.coverage.NOT_APPLICABLE,
      authority: ENUMS.authority.DENIED,
      lifecycle: ENUMS.lifecycle.NOT_APPLICABLE,
      selection: ENUMS.selection.NOT_APPLICABLE,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
    });
  } else if (kindName === 'AGGREGATE') {
    result.subjectKind = ENUMS.subjectKind.PROJECTION;
    result.facts = facts({
      presence: ENUMS.presence.CONFLICT,
      authority: ENUMS.authority.UNPROVEN,
      validation: ENUMS.validation.UNPROVEN,
      lifecycle: ENUMS.lifecycle.UNPROVEN,
      selection: ENUMS.selection.CONFLICT,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
    });
  } else if (kindName === 'BYTES') {
    result.subjectKind = ENUMS.subjectKind.RECORD;
    result.facts.bytes = ENUMS.bytes.UNAVAILABLE;
    result.payload = {
      payloadKind: ENUMS.payloadKind.BYTES,
      data: encodeBytesPayload({
        recordId: b32('71'),
        expectedDigest: b32('72'),
        bytesPresent: false,
        availableBytes: '0x',
      }),
    };
  } else if (kindName === 'SUBMISSION') {
    result.subjectKind = ENUMS.subjectKind.OPERATION;
    result.facts = facts({
      presence: ENUMS.presence.NOT_APPLICABLE,
      coverage: ENUMS.coverage.NOT_APPLICABLE,
      validation: ENUMS.validation.UNPROVEN,
      authority: ENUMS.authority.UNPROVEN,
      lifecycle: ENUMS.lifecycle.UNPROVEN,
      selection: ENUMS.selection.NOT_APPLICABLE,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
      effect: ENUMS.effect.UNKNOWN,
    });
  } else if (kindName === 'RECONSTRUCTION') {
    result.subjectKind = ENUMS.subjectKind.PROJECTION;
    result.facts.validation = ENUMS.validation.STRUCTURALLY_VALID;
    result.facts.authority = ENUMS.authority.NOT_APPLICABLE;
    result.facts.lifecycle = ENUMS.lifecycle.NOT_APPLICABLE;
    result.facts.bytes = ENUMS.bytes.VERIFIED_AVAILABLE;
    result.projectionIntegrity = ENUMS.projectionIntegrity.MATCHED;
  }
  if (kindName !== 'BYTES') {
    result.payload = { payloadKind: ENUMS.payloadKind[kindName], data: '0x' };
  }
  return result;
}

test('BYTES Result data is exactly BytesPayloadV0 and preserves its semantic coordinates', () => {
  const value = resultForKind('BYTES');
  const availableBytes = utf8Hex('hello');
  const expectedDigest = commitBytes(availableBytes);
  value.facts.bytes = ENUMS.bytes.VERIFIED_AVAILABLE;
  value.payload.data = encodeBytesPayload({
    recordId: b32('71'),
    expectedDigest,
    bytesPresent: true,
    availableBytes,
  });
  assert.deepEqual(decodeBytesPayload(value.payload.data), {
    recordId: b32('71'),
    expectedDigest,
    bytesPresent: true,
    availableBytes,
  });
  assert.deepEqual(validateResultV0(value), []);

  value.payload.data = utf8Hex('hello');
  assert.match(validateResultV0(value).join('\n'), /invalid BytesPayloadV0/i);

  value.payload.data = encodeBytesPayload({
    recordId: b32('71'),
    expectedDigest: b32('72'),
    bytesPresent: false,
    availableBytes: utf8Hex('hidden'),
  });
  assert.match(validateResultV0(value).join('\n'), /absent.*bytes.*empty|bytesPresent=false/i);
});

test('literal ResultV0 point envelope round-trips byte-for-byte', () => {
  const value = pointResult();
  assert.deepEqual(validateResultV0(value), []);
  const encoded = encodeResultV0(value);
  const decoded = decodeResultV0(encoded);
  assert.equal(encodeResultV0(decoded), encoded);
  assert.equal(commitResultV0(decoded), commitResultV0(value));
});

test('every uint64 survives max-value decode and byte-exact re-encode without Number narrowing', () => {
  const point = pointResult();
  point.executionCoordinate.value = MAX_U64;
  point.observerBasis.value.freshnessCoordinate = MAX_U64;
  const encodedPoint = encodeResultV0(point);
  const decodedPoint = decodeResultV0(encodedPoint);
  assert.equal(decodedPoint.executionCoordinate.value, MAX_U64);
  assert.equal(decodedPoint.observerBasis.value.freshnessCoordinate, MAX_U64);
  assert.equal(encodeResultV0(decodedPoint), encodedPoint);
  decodedPoint.executionCoordinate.value = MAX_U64 - 1n;
  assert.notEqual(encodeResultV0(decodedPoint), encodedPoint);
  decodedPoint.executionCoordinate.value = MAX_U64;
  decodedPoint.observerBasis.value.freshnessCoordinate = MAX_U64 - 1n;
  assert.notEqual(encodeResultV0(decodedPoint), encodedPoint);

  const mutation = rejectedMutation(b32('31'), b32('31'));
  mutation.executionCoordinate.value = MAX_U64;
  replaceMutationReceipt(mutation, { executionCoordinate: MAX_U64 });
  const encodedMutation = encodeResultV0(mutation);
  const decodedMutation = decodeResultV0(encodedMutation);
  assert.equal(decodedMutation.executionCoordinate.value, MAX_U64);
  assert.equal(decodeMutationPayload(decodedMutation.payload.data).canonicalEffectReceipt.executionCoordinate, MAX_U64);
  assert.deepEqual(validateResultV0(decodedMutation), []);
  assert.equal(encodeResultV0(decodedMutation), encodedMutation);
  replaceMutationReceipt(decodedMutation, { executionCoordinate: MAX_U64 - 1n });
  assert.match(validateResultV0(decodedMutation).join('\n'), /effect receipt execution coordinate does not match ResultV0/);

  const encodedPage = encodePagePayload({
    members: [utf8Hex('member')],
    cursorPresent: true,
    cursor: {
      realmId: b32('41'), realmRevisionId: b32('42'), queryProfileId: b32('43'), generation: 1,
      ordering: 1, activationHighWater: 7, coveredThroughHighWater: 7,
      executionCoordinate: MAX_U64, observerBlockHash: b32('44'), afterPostingOrdinal: 9,
      declaredDomainRoot: b32('45'),
    },
    pageOrdinal: 1,
    declaredDomainRoot: b32('45'),
  });
  const decodedPage = decodePagePayload(encodedPage);
  assert.equal(decodedPage.cursor.executionCoordinate, MAX_U64);
  assert.equal(encodePagePayload(decodedPage), encodedPage);
  decodedPage.cursor.executionCoordinate = MAX_U64 - 1n;
  assert.notEqual(encodePagePayload(decodedPage), encodedPage);
});

test('generic COLLECTION_ENTRY subject binds one of the 28 exact projection keys', () => {
  const value = pointResult();
  value.subjectKind = ENUMS.subjectKind.COLLECTION_ENTRY;
  value.subject = encodeCollectionEntrySubject(5, utf8Hex('publication-key'));
  assert.deepEqual(validateResultV0(value), []);

  value.subject = encodeCollectionEntrySubject(28, utf8Hex('retained-authority-descriptor-key'));
  assert.deepEqual(validateResultV0(value), []);

  value.subject = encodeCollectionEntrySubject(29, utf8Hex('future-unknown-collection'));
  assert.match(validateResultV0(value).join('\n'), /1\.\.28/);
});

test('raw retention is binding and cannot be asserted with a wrong commitment', () => {
  const value = pointResult();
  value.rawRetention.commitment = b32('ff');
  assert.match(validateResultV0(value).join('\n'), /raw.*commitment/i);
});

test('NOT_COMMITTED_PROVEN requires a canonical same-root effect receipt', () => {
  const root = b32('31');
  assert.deepEqual(validateResultV0(rejectedMutation(root, root)), []);
  assert.match(validateResultV0(rejectedMutation(root, b32('32'))).join('\n'), /equal.*projection roots/i);

  const missing = rejectedMutation(root, root);
  missing.payload.data = encodeMutationPayload({
    operationPresent: false,
    operationId: ZERO,
    admissionReceiptIds: [],
    planSignatureReceiptPresent: false,
    planSignatureReceipt: null,
    canonicalEffectReceiptPresent: false,
    canonicalEffectReceipt: null,
    errorPresent: true,
    error: { code: 10, subject: '0x' },
  });
  assert.match(validateResultV0(missing).join('\n'), /canonical effect receipt/i);
});

test('canonical effect receipts carry an exact optional OperationId and bootstrap carries none', () => {
  const fresh = rejectedMutation(b32('31'), b32('31'));
  const decodedFresh = decodeMutationPayload(fresh.payload.data);
  assert.equal(decodedFresh.canonicalEffectReceipt.operationPresent, true);
  assert.equal(decodedFresh.canonicalEffectReceipt.operationId, b32('21'));

  const hiddenFreshIdentity = rejectedMutation(b32('31'), b32('31'));
  replaceMutationReceipt(hiddenFreshIdentity, { operationPresent: false, operationId: b32('21') });
  assert.match(validateResultV0(hiddenFreshIdentity).join('\n'), /effect receipt.*OperationId.*zero|fresh.*OperationId/i);

  const bootstrap = rejectedMutation(b32('31'), b32('31'));
  bootstrap.subjectKind = ENUMS.subjectKind.REALM;
  bootstrap.facts.effect = ENUMS.effect.COMMITTED;
  replaceMutationReceipt(bootstrap, {
    operationPresent: false,
    operationId: ZERO,
    beforeProjectionRoot: b32('31'),
    afterProjectionRoot: b32('32'),
    effect: ENUMS.effect.COMMITTED,
  });
  const decodedBootstrap = decodeMutationPayload(bootstrap.payload.data);
  assert.equal(decodedBootstrap.operationPresent, false);
  assert.equal(decodedBootstrap.operationId, ZERO);
  assert.equal(decodedBootstrap.canonicalEffectReceipt.operationPresent, false);
  assert.equal(decodedBootstrap.canonicalEffectReceipt.operationId, ZERO);
  assert.deepEqual(validateResultV0(bootstrap), []);
});

test('optional absence and mutation coverage cannot hide nonzero or COMPLETE values', () => {
  const value = rejectedMutation(b32('31'), b32('31'));
  value.realmRevisionId = { present: false, value: b32('99') };
  value.facts.coverage = ENUMS.coverage.COMPLETE;
  const errors = validateResultV0(value).join('\n');
  assert.match(errors, /absent.*zero/i);
  assert.match(errors, /MUTATION.*NOT_APPLICABLE/);
});

test('ResultV0 kind vocabulary exactly covers every sealed result-profile kind', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../2026-08-23-efs2-exp-c0-semantic-seal/trace-manifest.json'),
    'utf8',
  ));
  const sealedKinds = [...new Set(Object.values(manifest.resultProfiles).map((profile) => profile.kind))].sort();
  assert.deepEqual(Object.keys(ENUMS.kind).sort(), sealedKinds);
});

test('each sealed ResultV0 kind accepts only its literal payload kind', () => {
  const expectedPayload = {
    MUTATION: 'MUTATION',
    POINT: 'POINT',
    SCOPE: 'PAGE',
    REQUEST: 'REQUEST',
    VERIFIER: 'VERIFIER',
    AGGREGATE: 'AGGREGATE',
    BYTES: 'BYTES',
    SUBMISSION: 'SUBMISSION',
    RECONSTRUCTION: 'RECONSTRUCTION',
  };
  for (const [kindName, payloadName] of Object.entries(expectedPayload)) {
    const value = resultForKind(kindName);
    assert.equal(value.payload.payloadKind, ENUMS.payloadKind[payloadName], kindName);
    assert.deepEqual(validateResultV0(value), [], kindName);
    value.payload.payloadKind = ENUMS.payloadKind.POINT === value.payload.payloadKind
      ? ENUMS.payloadKind.REQUEST
      : ENUMS.payloadKind.POINT;
    assert.match(validateResultV0(value).join('\n'), /requires .*PayloadV0/, kindName);
  }
});

test('bootstrap is a REALM MUTATION with a committed changing-root receipt', () => {
  const value = rejectedMutation(b32('31'), b32('31'));
  value.subjectKind = ENUMS.subjectKind.REALM;
  value.facts = facts({
    presence: ENUMS.presence.NOT_APPLICABLE,
    coverage: ENUMS.coverage.NOT_APPLICABLE,
    validation: ENUMS.validation.STRUCTURALLY_VALID,
    authority: ENUMS.authority.NOT_APPLICABLE,
    lifecycle: ENUMS.lifecycle.NOT_APPLICABLE,
    selection: ENUMS.selection.NOT_APPLICABLE,
    bytes: ENUMS.bytes.NOT_APPLICABLE,
    effect: ENUMS.effect.COMMITTED,
  });
  replaceMutationReceipt(value, { beforeProjectionRoot: b32('31'), afterProjectionRoot: b32('32') });
  assert.deepEqual(validateResultV0(value), []);

  replaceMutationReceipt(value, { beforeProjectionRoot: b32('31'), afterProjectionRoot: b32('31') });
  assert.match(validateResultV0(value).join('\n'), /bootstrap.*change.*projection root/i);
});

test('present and absent values obey zero laws, including ObserverBasisV0', () => {
  const absentWithValue = pointResult();
  absentWithValue.realmId = { present: false, value: b32('91') };
  assert.match(validateResultV0(absentWithValue).join('\n'), /realmId absent value must be zero/);

  const presentZero = pointResult();
  presentZero.realmId = { present: true, value: ZERO };
  assert.match(validateResultV0(presentZero).join('\n'), /realmId present value cannot be zero/);

  const absentObserver = pointResult();
  absentObserver.observerBasis = {
    present: false,
    value: {
      blockHash: b32('91'), stateRoot: ZERO, sourceKind: 0, finality: 0, freshnessCoordinate: 0n,
    },
  };
  assert.match(validateResultV0(absentObserver).join('\n'), /absent observer basis must be all-zero/);

  const atomicFinal = pointResult();
  atomicFinal.observerBasis.value = {
    blockHash: ZERO,
    stateRoot: ZERO,
    sourceKind: ENUMS.observerSource.ONCHAIN_ATOMIC,
    finality: ENUMS.finality.OBSERVED_FINAL,
    freshnessCoordinate: 42n,
  };
  assert.match(validateResultV0(atomicFinal).join('\n'), /onchain atomic.*finality.*UNPROVEN/i);
});

test('SOURCE_OBSERVED keeps public-RPC block/state evidence distinct from authenticated proof and finality', () => {
  assert.equal(ENUMS.observerSource.ONCHAIN_ATOMIC, 1);
  assert.equal(ENUMS.observerSource.AUTHENTICATED_OBSERVER, 2);
  assert.equal(ENUMS.observerSource.SOURCE_OBSERVED, 3);

  const observed = pointResult();
  observed.observerBasis.value.sourceKind = ENUMS.observerSource.SOURCE_OBSERVED;
  observed.observerBasis.value.finality = ENUMS.finality.UNPROVEN;
  assert.deepEqual(validateResultV0(observed), []);

  observed.observerBasis.value.finality = ENUMS.finality.OBSERVED_FINAL;
  assert.match(validateResultV0(observed).join('\n'), /source observed.*finality.*UNPROVEN/i);

  observed.observerBasis.value.finality = ENUMS.finality.UNPROVEN;
  observed.observerBasis.value.stateRoot = ZERO;
  assert.match(validateResultV0(observed).join('\n'), /source observed.*block hash and state root/i);
});

test('sealed derivable no-collapse combinations are rejected', () => {
  const cases = [];

  const absentUnsupported = pointResult();
  absentUnsupported.facts.presence = ENUMS.presence.ABSENT_PROVEN;
  absentUnsupported.facts.support = ENUMS.support.UNSUPPORTED;
  cases.push([absentUnsupported, /ABSENT_PROVEN requires support=SUPPORTED/]);

  const maskedWithoutBasis = pointResult();
  maskedWithoutBasis.facts.presence = ENUMS.presence.MASKED;
  maskedWithoutBasis.profileCommitments.policyId = absentBytes32();
  maskedWithoutBasis.observerBasis = { present: false, value: null };
  cases.push([maskedWithoutBasis, /MASKED requires retained mask policy and observer basis/]);

  const authorizedWithoutProfile = pointResult();
  authorizedWithoutProfile.profileCommitments.verifierProfileId = absentBytes32();
  cases.push([authorizedWithoutProfile, /AUTHORIZED requires retained verifier profile/]);

  const currentRecord = pointResult();
  currentRecord.facts.selection = ENUMS.selection.CURRENT;
  cases.push([currentRecord, /CURRENT selection requires BINDING or LENS subject/]);

  const absentCorrupt = pointResult();
  absentCorrupt.facts.presence = ENUMS.presence.ABSENT_PROVEN;
  absentCorrupt.facts.bytes = ENUMS.bytes.INTEGRITY_FAILED;
  cases.push([absentCorrupt, /byte availability cannot prove semantic absence/]);

  const unknownWrongCoverage = resultForKind('SUBMISSION');
  unknownWrongCoverage.facts.coverage = ENUMS.coverage.PARTIAL;
  cases.push([unknownWrongCoverage, /effect=UNKNOWN requires coverage=NOT_APPLICABLE/]);

  const emptyScopeAbsence = resultForKind('SCOPE');
  emptyScopeAbsence.facts.presence = ENUMS.presence.ABSENT_PROVEN;
  emptyScopeAbsence.facts.coverage = ENUMS.coverage.COMPLETE;
  emptyScopeAbsence.payload.data = encodePagePayload({
    members: [], cursorPresent: false, pageOrdinal: 0, declaredDomainRoot: ZERO,
  });
  cases.push([emptyScopeAbsence, /empty SCOPE absence requires exact declared finite domain root and basis/]);

  for (const [value, pattern] of cases) assert.match(validateResultV0(value).join('\n'), pattern);
});

test('same-root rejection receipt must match ResultV0 Realm revision and coordinate', () => {
  const value = rejectedMutation(b32('31'), b32('31'));
  replaceMutationReceipt(value, { realmRevisionId: b32('99') });
  assert.match(validateResultV0(value).join('\n'), /effect receipt Realm revision does not match ResultV0/);

  replaceMutationReceipt(value, { executionCoordinate: 100n });
  assert.match(validateResultV0(value).join('\n'), /effect receipt execution coordinate does not match ResultV0/);
});

test('nested payload optionals cannot smuggle values behind absent bits', () => {
  const mutation = rejectedMutation(b32('31'), b32('31'));
  mutation.payload.data = encodeMutationPayload({
    operationPresent: false,
    operationId: b32('91'),
    admissionReceiptIds: [],
    planSignatureReceiptPresent: false,
    planSignatureReceipt: {
      admissionPlanId: b32('92'),
      signer: b32('93'),
      verifierProfileId: b32('94'),
      signedDigest: b32('95'),
      verifierTranscriptCommitment: b32('96'),
      authority: ENUMS.authority.DENIED,
    },
    canonicalEffectReceiptPresent: true,
    canonicalEffectReceipt: {
      operationPresent: true, operationId: b32('21'), realmId: b32('11'), realmRevisionId: b32('12'),
      executionCoordinate: 99n, beforeProjectionRoot: b32('31'), afterProjectionRoot: b32('31'),
      effect: ENUMS.effect.NOT_COMMITTED_PROVEN,
    },
    errorPresent: false,
    error: { code: 10, subject: utf8Hex('hidden-error') },
  });
  const errors = validateResultV0(mutation).join('\n');
  assert.match(errors, /absent operationId must be zero/);
  assert.match(errors, /absent plan signature receipt must be all-zero/);
  assert.match(errors, /absent error must be all-zero/);

  const scope = resultForKind('SCOPE');
  scope.payload.data = encodePagePayload({
    members: [utf8Hex('member')],
    cursorPresent: false,
    cursor: {
      realmId: b32('81'), realmRevisionId: ZERO, queryProfileId: ZERO, generation: 0, ordering: 0,
      activationHighWater: 0, coveredThroughHighWater: 0, executionCoordinate: 0n,
      observerBlockHash: ZERO, afterPostingOrdinal: 0, declaredDomainRoot: ZERO,
    },
    pageOrdinal: 0,
    declaredDomainRoot: b32('41'),
  });
  assert.match(validateResultV0(scope).join('\n'), /absent page cursor must be all-zero/);
});
