'use strict';

const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const test = require('node:test');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const {
  BASE_KINDS,
  COLLECTIONS,
  DESCRIPTOR_KINDS,
  POINT_SUBJECT_KIND_BY_COLLECTION,
  admissionPlanId,
  bindingScopeKey,
  buildPopulatedControlFixture,
  buildTerminalQueryControlFixture,
  descriptorCommitment,
  destinationWitnessId,
  encodeEntry,
  inspectProjection,
  positionKey,
  principalId,
  recordBodyCommitment,
  recordReferenceBaseKey,
  signatureDigest,
  sourceWitnessId,
  validateCursorCoordinates,
  validateRawPointRead,
  validateTerminalQueryCompletion,
  verifierProfileId,
} = require('../src/query-projection-v0.cjs');
const {
  encodeTypeSchemaEnvelope,
  typeSchemaIdFromEnvelope,
} = require('../src/type-interpreter-v0.cjs');
const {
  ENUMS,
  absentBytes32,
  commitBytes,
  encodeCollectionEntrySubject,
  encodePointPayload,
  presentBytes32,
} = require('../src/result-v0.cjs');

const b32 = (byte) => `0x${byte.repeat(32)}`;
const ZERO = b32('00');
const OPAQUE_TYPE_PROJECTION_ROOT = '0x705c50d6674920af85c03403a2a9e4c004fbcc424269a98d790319e8e394e091';

function projectionOrder(left, right) {
  if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
  const leftHash = keccak256(left.key);
  const rightHash = keccak256(right.key);
  if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
  return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
}

function literalProjectionRoot(entries) {
  const projectionBytes = abi.encode(
    ['tuple(uint8,bytes,bytes)[]'],
    [entries.map((entry) => [entry.collectionKind, entry.key, entry.value])],
  );
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes', 'uint32'],
    [keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/PROJECTION')), 0, projectionBytes, entries.length],
  ));
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

function literalPointResult(entry) {
  return {
    kind: ENUMS.kind.POINT,
    subjectKind: ENUMS.subjectKind.COLLECTION_ENTRY,
    subject: encodeCollectionEntrySubject(entry.collectionKind, entry.key),
    realmId: presentBytes32(b32('11')),
    realmRevisionId: presentBytes32(b32('12')),
    executionCoordinate: { present: true, value: 42 },
    admissionHighWater: { present: true, value: 7 },
    observerBasis: {
      present: true,
      value: {
        blockHash: b32('13'),
        stateRoot: b32('14'),
        sourceKind: ENUMS.observerSource.AUTHENTICATED_OBSERVER,
        finality: ENUMS.finality.UNPROVEN,
        freshnessCoordinate: 42,
      },
    },
    profileCommitments: profiles({ typeSchemaId: presentBytes32(b32('15')) }),
    facts: {
      presence: ENUMS.presence.FOUND,
      coverage: ENUMS.coverage.COMPLETE,
      support: ENUMS.support.SUPPORTED,
      validation: ENUMS.validation.STRUCTURALLY_VALID,
      authority: ENUMS.authority.UNPROVEN,
      lifecycle: ENUMS.lifecycle.UNPROVEN,
      selection: ENUMS.selection.UNKNOWN,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
      effect: ENUMS.effect.NOT_APPLICABLE,
    },
    payload: {
      payloadKind: ENUMS.payloadKind.POINT,
      data: encodePointPayload({
        key: entry.key,
        valuePresent: true,
        value: entry.value,
        proofOfLocalAbsence: false,
      }),
    },
    rawRetention: { present: true, canonicalBytes: entry.value, commitment: commitBytes(entry.value) },
    projectionIntegrity: ENUMS.projectionIntegrity.MATCHED,
  };
}

test('projection registry is exact, consecutive, and populated across all 28 collection kinds', () => {
  assert.equal(COLLECTIONS.length, 28);
  assert.deepEqual(COLLECTIONS.map(({ kind }) => kind), Array.from({ length: 28 }, (_, index) => index + 1));

  const entries = buildPopulatedControlFixture();
  const inspection = inspectProjection(entries, entries, { claimFullState: true });
  assert.equal(inspection.integrity, 'MATCHED');
  assert.equal(inspection.fullStateReconstruction, true);
  assert.deepEqual(inspection.populatedKinds, Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(inspection.errors, []);
});

test('full matched projection retains opaque Type bytes and root but cannot claim complete semantics', () => {
  const payloadBytes = '0xdeadbeef0001';
  const rawTypeBytes = encodeTypeSchemaEnvelope(1, payloadBytes);
  const typeSchemaId = typeSchemaIdFromEnvelope(1, payloadBytes);
  const entries = [
    ...buildPopulatedControlFixture(),
    encodeEntry(3, typeSchemaId, rawTypeBytes),
  ].sort(projectionOrder);
  const inspection = inspectProjection(entries, structuredClone(entries), { claimFullState: true });

  assert.equal(inspection.integrity, 'MATCHED');
  assert.equal(inspection.semanticReconstruction, 'INCOMPLETE');
  assert.equal(inspection.fullStateReconstruction, false);
  assert.equal(literalProjectionRoot(entries), OPAQUE_TYPE_PROJECTION_ROOT);
  assert.deepEqual(inspection.errors, []);
  assert.deepEqual(
    inspection.typeEnvelopeInspections.find(({ typeSchemaId: id }) => id === typeSchemaId),
    {
      typeSchemaId,
      codecVersion: 1,
      payloadBytes,
      rawTypeBytes,
      support: 'UNSUPPORTED',
      validation: 'UNPROVEN',
      semanticReconstruction: 'INCOMPLETE',
    },
  );

  const mutated = structuredClone(entries);
  const opaque = mutated.find(({ collectionKind, key }) => (
    collectionKind === 3 && abi.decode(['bytes32'], key)[0] === typeSchemaId
  ));
  opaque.value = encodeTypeSchemaEnvelope(1, '0xdeadbeef0000');
  assert.notEqual(literalProjectionRoot(mutated), OPAQUE_TYPE_PROJECTION_ROOT);
});

test('wrong opaque Type key fails integrity while retaining the exact raw envelope for evidence', () => {
  const payloadBytes = '0xdeadbeef0001';
  const rawTypeBytes = encodeTypeSchemaEnvelope(1, payloadBytes);
  const typeSchemaId = typeSchemaIdFromEnvelope(1, payloadBytes);
  const expected = [encodeEntry(3, typeSchemaId, rawTypeBytes)];
  const supplied = [encodeEntry(3, b32('11'), rawTypeBytes)];
  const inspection = inspectProjection(expected, supplied);

  assert.equal(inspection.integrity, 'INTEGRITY_FAILED');
  assert.equal(inspection.semanticReconstruction, 'INCOMPLETE');
  assert.equal(inspection.fullStateReconstruction, false);
  assert.equal(inspection.typeEnvelopeInspections[0].rawTypeBytes, rawTypeBytes);
  assert.equal(inspection.typeEnvelopeInspections[0].typeSchemaId, typeSchemaId);
  assert.match(inspection.errors.join('\n'), /TYPES key.*exact outer codec and payload/i);
});

test('projection retains every authority preimage, the complete AdmissionPlan effects, and all Realm descriptors', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  assert.deepEqual(
    [24, 25, 26, 27, 28].map((kind) => byKind.get(kind)?.name),
    ['PRINCIPALS', 'VERIFIER_PROFILES', 'ADMISSION_PLANS', 'DESTINATION_WITNESSES', 'DESCRIPTORS'],
  );

  const entries = buildPopulatedControlFixture();
  for (const kind of [24, 25, 26, 27]) {
    assert.equal(entries.filter((entry) => entry.collectionKind === kind).length, 1, `kind ${kind}`);
  }

  const planEntry = entries.find((entry) => entry.collectionKind === 26);
  const plan = abi.decode([byKind.get(26).valueAbi], planEntry.value)[0];
  assert.equal(plan[14].length, 3, 'stored AdmissionPlan must retain the full effect list');
  assert.equal(abi.decode([byKind.get(26).keyAbi], planEntry.key)[0], admissionPlanId(plan));

  const principalEntry = entries.find((entry) => entry.collectionKind === 24);
  const principal = abi.decode([byKind.get(24).valueAbi], principalEntry.value)[0];
  assert.equal(abi.decode([byKind.get(24).keyAbi], principalEntry.key)[0], principalId(principal));

  const profileEntry = entries.find((entry) => entry.collectionKind === 25);
  const profile = abi.decode([byKind.get(25).valueAbi], profileEntry.value)[0];
  assert.equal(abi.decode([byKind.get(25).keyAbi], profileEntry.key)[0], verifierProfileId(profile));

  const destinationWitness = entries.find((entry) => entry.collectionKind === 27);
  const witness = abi.decode([byKind.get(27).valueAbi], destinationWitness.value)[0];
  assert.equal(witness[0].toLowerCase(), abi.decode([byKind.get(26).keyAbi], planEntry.key)[0].toLowerCase());
  assert.equal(abi.decode([byKind.get(27).keyAbi], destinationWitness.key)[0], destinationWitnessId(witness));
  assert.ok(witness[3].length > 2, 'destination signature bytes must be retained');
  assert.equal(witness[2], signatureDigest(witness[0], witness[1], plan[6]));

  const sourceWitness = entries.find((entry) => entry.collectionKind === 7);
  const source = abi.decode([byKind.get(7).valueAbi], sourceWitness.value)[0];
  assert.equal(abi.decode([byKind.get(7).keyAbi], sourceWitness.key)[0], sourceWitnessId(source));
  assert.equal(source[3], signatureDigest(source[0], source[1], source[2]));

  const descriptorEntries = entries.filter((entry) => entry.collectionKind === 28);
  assert.equal(descriptorEntries.length, 4);
  assert.deepEqual(
    descriptorEntries.map((entry) => Number(abi.decode([byKind.get(28).keyAbi], entry.key)[0][0])).sort((a, b) => a - b),
    Object.values(DESCRIPTOR_KINDS),
  );
  for (const entry of descriptorEntries) {
    const [descriptorKind, commitment] = abi.decode([byKind.get(28).keyAbi], entry.key)[0];
    const descriptorBytes = abi.decode([byKind.get(28).valueAbi], entry.value)[0];
    assert.equal(commitment.toLowerCase(), descriptorCommitment(Number(descriptorKind), descriptorBytes).toLowerCase());
  }

  const realmRevision = entries.find((entry) => entry.collectionKind === 2);
  const revision = abi.decode([byKind.get(2).valueAbi], realmRevision.value)[0];
  const retainedCommitments = new Set(descriptorEntries.map((entry) => (
    abi.decode([byKind.get(28).keyAbi], entry.key)[0][1].toLowerCase()
  )));
  for (const commitment of [revision[2], revision[3], revision[4], revision[6]]) {
    assert.ok(retainedCommitments.has(commitment.toLowerCase()), `${commitment} is not backed by DESCRIPTORS`);
  }
  const realmBootstrap = entries.find((entry) => entry.collectionKind === 1);
  const bootstrap = abi.decode([byKind.get(1).valueAbi], realmBootstrap.value)[0];
  assert.ok(retainedCommitments.has(bootstrap[2].toLowerCase()), 'RealmBootstrap.coreCommitment is orphaned');
});

test('full projection rejects source and destination witnesses over any non-SIGN digest', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  for (const kind of [7, 27]) {
    const supplied = buildPopulatedControlFixture();
    const entry = supplied.find((candidate) => candidate.collectionKind === kind);
    const definition = byKind.get(kind);
    const witness = abi.decode([definition.valueAbi], entry.value)[0].toArray(true);
    const digestIndex = kind === 7 ? 3 : 2;
    witness[digestIndex] = b32('f1');
    entry.value = abi.encode([definition.valueAbi], [witness]);
    const witnessId = kind === 7 ? sourceWitnessId(witness) : destinationWitnessId(witness);
    entry.key = abi.encode([definition.keyAbi], [witnessId]);
    supplied.sort((left, right) => {
      if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
      const leftHash = keccak256(left.key);
      const rightHash = keccak256(right.key);
      if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
      return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
    });

    const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
    assert.equal(inspection.integrity, 'INTEGRITY_FAILED', `kind ${kind}`);
    assert.match(inspection.errors.join('\n'), /signedDigest.*SIGN|SIGN.*signedDigest/i, `kind ${kind}`);
  }
});

test('query activation relationships reject skewed keys, coverage intervals, terminal commitments, and counters', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  const activationDefinition = byKind.get(18);
  const counterDefinition = byKind.get(23);
  const cases = [
    {
      label: 'query key/value',
      mutate(entries) {
        const entry = entries.find(({ collectionKind }) => collectionKind === 18);
        const value = abi.decode([activationDefinition.valueAbi], entry.value)[0].toArray(true);
        value[1] = b32('a1');
        entry.value = abi.encode([activationDefinition.valueAbi], [value]);
      },
      pattern: /activation.*query.*key|key.*QueryProfile/i,
    },
    {
      label: 'unretained profile',
      mutate(entries) {
        const entry = entries.find(({ collectionKind }) => collectionKind === 18);
        const key = abi.decode([activationDefinition.keyAbi], entry.key)[0].toArray(true);
        const value = abi.decode([activationDefinition.valueAbi], entry.value)[0].toArray(true);
        key[0] = b32('a2');
        value[1] = key[0];
        entry.key = abi.encode([activationDefinition.keyAbi], [key]);
        entry.value = abi.encode([activationDefinition.valueAbi], [value]);
      },
      pattern: /unretained QueryProfile/i,
    },
    {
      label: 'historical interval',
      mutate(entries) {
        const entry = entries.find(({ collectionKind }) => collectionKind === 18);
        const value = abi.decode([activationDefinition.valueAbi], entry.value)[0].toArray(true);
        value[5] = 2;
        value[6] = 1;
        entry.value = abi.encode([activationDefinition.valueAbi], [value]);
      },
      pattern: /historicalStart.*coveredThrough/i,
    },
    {
      label: 'terminal high-water',
      mutate(entries) {
        const entry = entries.find(({ collectionKind }) => collectionKind === 18);
        const value = abi.decode([activationDefinition.valueAbi], entry.value)[0].toArray(true);
        value[4] = 2;
        value[6] = 1;
        entry.value = abi.encode([activationDefinition.valueAbi], [value]);
      },
      pattern: /terminal.*coveredThrough.*activationHighWater/i,
    },
    {
      label: 'terminal count',
      mutate(entries) {
        const entry = entries.find(({ collectionKind }) => collectionKind === 18);
        const value = abi.decode([activationDefinition.valueAbi], entry.value)[0].toArray(true);
        value[14] = [true, 2];
        entry.value = abi.encode([activationDefinition.valueAbi], [value]);
      },
      pattern: /terminalCount.*postings/i,
    },
    {
      label: 'terminal root',
      mutate(entries) {
        const entry = entries.find(({ collectionKind }) => collectionKind === 18);
        const value = abi.decode([activationDefinition.valueAbi], entry.value)[0].toArray(true);
        value[15] = [true, b32('a3')];
        entry.value = abi.encode([activationDefinition.valueAbi], [value]);
      },
      pattern: /terminalPostingsRoot.*postings/i,
    },
    {
      label: 'coverage counter',
      mutate(entries) {
        const entry = entries.find((candidate) => {
          const { collectionKind } = candidate;
          if (collectionKind !== 23) return false;
          const key = abi.decode([counterDefinition.keyAbi], candidate.key)[0];
          return Number(key[0]) === 4;
        });
        entry.value = abi.encode([counterDefinition.valueAbi], [2]);
      },
      pattern: /coverage counter.*coveredThrough/i,
    },
  ];

  for (const { label, mutate, pattern } of cases) {
    const supplied = buildPopulatedControlFixture();
    mutate(supplied);
    supplied.sort((left, right) => {
      if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
      const leftHash = keccak256(left.key);
      const rightHash = keccak256(right.key);
      if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
      return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
    });
    const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
    assert.equal(inspection.integrity, 'INTEGRITY_FAILED', label);
    assert.match(inspection.errors.join('\n'), pattern, label);
  }
});

test('withdrawal relationships require retained principal, occurrence, and operation', () => {
  const supplied = buildPopulatedControlFixture();
  const definition = COLLECTIONS.find(({ kind }) => kind === 16);
  const withdrawal = supplied.find(({ collectionKind }) => collectionKind === 16);
  withdrawal.value = abi.encode([definition.valueAbi], [b32('f2')]);
  const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
  assert.equal(inspection.integrity, 'INTEGRITY_FAILED');
  assert.match(inspection.errors.join('\n'), /Withdrawal.*unretained Operation/i);
});

test('base postings bind their admission ordinal and exact Occurrence leaf Record', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  const baseDefinition = byKind.get(12);
  const cases = [
    {
      label: 'ordinal',
      mutate(key, value) { key[2] = Number(key[2]) + 1; },
      pattern: /BasePosting.*admissionOrdinal/i,
    },
    {
      label: 'leaf',
      mutate(key, value) { value[0] = b32('f3'); },
      pattern: /BasePosting.*Occurrence leaf/i,
    },
  ];
  for (const { label, mutate, pattern } of cases) {
    const supplied = buildPopulatedControlFixture();
    const entry = supplied.find(({ collectionKind }) => collectionKind === 12);
    const key = abi.decode([baseDefinition.keyAbi], entry.key)[0].toArray(true);
    const value = abi.decode([baseDefinition.valueAbi], entry.value)[0].toArray(true);
    mutate(key, value);
    entry.key = abi.encode([baseDefinition.keyAbi], [key]);
    entry.value = abi.encode([baseDefinition.valueAbi], [value]);
    supplied.sort((left, right) => {
      if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
      const leftHash = keccak256(left.key);
      const rightHash = keccak256(right.key);
      if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
      return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
    });
    const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
    assert.equal(inspection.integrity, 'INTEGRITY_FAILED', label);
    assert.match(inspection.errors.join('\n'), pattern, label);
  }
});

test('operations and verifier transcripts remain linked to the exact retained Plan and destination witness', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  const cases = [
    {
      label: 'effect set',
      kind: 9,
      mutate(value) { value[1] = b32('f4'); },
      pattern: /Operation.*effectSet.*AdmissionPlan/i,
    },
    {
      label: 'transcript digest',
      kind: 11,
      mutate(value) { value[1] = b32('f5'); },
      pattern: /VerifierTranscript.*digest.*DestinationWitness/i,
    },
    {
      label: 'transcript signature',
      kind: 11,
      mutate(value) { value[4] = '0xf6'; },
      pattern: /VerifierTranscript.*signature.*DestinationWitness/i,
    },
  ];
  for (const { label, kind, mutate, pattern } of cases) {
    const supplied = buildPopulatedControlFixture();
    const definition = byKind.get(kind);
    const entry = supplied.find(({ collectionKind }) => collectionKind === kind);
    const value = abi.decode([definition.valueAbi], entry.value)[0].toArray(true);
    mutate(value);
    entry.value = abi.encode([definition.valueAbi], [value]);
    const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
    assert.equal(inspection.integrity, 'INTEGRITY_FAILED', label);
    assert.match(inspection.errors.join('\n'), pattern, label);
  }
});

test('an explicitly empty collection can complete the exact 28-kind inventory without an invented row', () => {
  const entries = buildPopulatedControlFixture().filter(({ collectionKind }) => collectionKind !== 16);
  const inspection = inspectProjection(entries, entries, {
    claimFullState: true,
    declaredEmptyCollectionKinds: [16],
  });
  assert.equal(inspection.integrity, 'MATCHED');
  assert.equal(inspection.fullStateReconstruction, true);
  assert.equal(inspection.scope, 'FULL_DECLARED_COLLECTION_CONTROL');
  assert.deepEqual(inspection.declaredEmptyCollectionKinds, [16]);
  assert.deepEqual(inspection.accountedCollectionKinds, Array.from({ length: 28 }, (_, index) => index + 1));

  for (const declaredEmptyCollectionKinds of [[16, 16], [29], [15]]) {
    const invalid = inspectProjection(entries, entries, { claimFullState: true, declaredEmptyCollectionKinds });
    assert.equal(invalid.integrity, 'INTEGRITY_FAILED');
    assert.equal(invalid.fullStateReconstruction, false);
    assert.match(invalid.errors.join('\n'), /declared-empty/i);
  }
});

test('full projection rejects canonical new authority values whose identity keys were not recomputed', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  const mutations = new Map([
    [24, (value) => { value[1] = '0x01'; }],
    [25, (value) => { value[1] = 1; }],
    [26, (value) => { value[13] += 1n; }],
    [27, (value) => { value[3] = '0xabcd'; }],
  ]);
  for (const [kind, mutate] of mutations) {
    const supplied = buildPopulatedControlFixture();
    const entry = supplied.find((candidate) => candidate.collectionKind === kind);
    const definition = byKind.get(kind);
    const value = abi.decode([definition.valueAbi], entry.value)[0].toArray(true);
    mutate(value);
    entry.value = abi.encode([definition.valueAbi], [value]);
    const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
    assert.equal(inspection.integrity, 'INTEGRITY_FAILED', `kind ${kind}`);
    assert.match(inspection.errors.join('\n'), /identity key does not match|key commitment does not match/i, `kind ${kind}`);
  }
});

test('PositionKey and BindingScope preserve full-width words and separate Files-style directory subjects', () => {
  const principalId = b32('91');
  const sameLowPurposeA = `0x01${'00'.repeat(29)}1234`;
  const sameLowPurposeB = `0x02${'00'.repeat(29)}1234`;
  const directoryA = b32('a1');
  const directoryB = b32('a2');
  const sameLowRoleA = `0x03${'00'.repeat(29)}beef`;
  const sameLowRoleB = `0x04${'00'.repeat(29)}beef`;

  const base = positionKey({ purpose: sameLowPurposeA, subject: directoryA, fieldRole: sameLowRoleA });
  assert.notEqual(
    positionKey({ purpose: sameLowPurposeB, subject: directoryA, fieldRole: sameLowRoleA }),
    base,
    'high purpose bits must bind PositionKey',
  );
  assert.notEqual(
    positionKey({ purpose: sameLowPurposeA, subject: directoryA, fieldRole: sameLowRoleB }),
    base,
    'high role bits must bind PositionKey',
  );
  assert.notEqual(
    bindingScopeKey({ principalId, purpose: sameLowPurposeA, subject: directoryA }),
    bindingScopeKey({ principalId, purpose: sameLowPurposeA, subject: directoryB }),
    'two Files directories must have distinct complete-enumeration scopes',
  );
  assert.equal(
    bindingScopeKey({ principalId, purpose: sameLowPurposeA, subject: directoryA }),
    bindingScopeKey({ principalId, purpose: sameLowPurposeA, subject: directoryA, fieldRole: sameLowRoleB }),
    'fieldRole is a member of a scope, not part of scope identity',
  );

  const scopeDefinition = COLLECTIONS.find(({ kind }) => kind === 15);
  assert.equal(scopeDefinition.keyAbi, 'tuple(bytes32,bytes32,bytes32,uint32)');
  assert.equal(scopeDefinition.valueAbi, 'bytes32');
});

test('RequiredPointInput retains fieldRole and rejects any key/value outside its ResolutionPlan scope', () => {
  const byKind = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
  const requiredDefinition = byKind.get(21);
  assert.equal(requiredDefinition.valueAbi, 'tuple(bytes32,bytes32,bytes32,bytes32[])');
  const base = buildPopulatedControlFixture();
  const entry = base.find(({ collectionKind }) => collectionKind === 21);
  const key = abi.decode([requiredDefinition.keyAbi], entry.key)[0];
  const value = abi.decode([requiredDefinition.valueAbi], entry.value)[0];
  assert.equal(value[0], key[0]);
  assert.equal(value[2], key[1]);

  for (const [label, mutate] of [
    ['fieldRole', (copy) => { copy[1] = b32('f8'); }],
    ['zero fieldRole', (copy) => { copy[1] = b32('00'); }],
    ['position', (copy) => { copy[2] = b32('f9'); }],
    ['principal order', (copy) => { copy[3] = [b32('fa')]; }],
  ]) {
    const supplied = structuredClone(base);
    const row = supplied.find(({ collectionKind }) => collectionKind === 21);
    const decoded = abi.decode([requiredDefinition.valueAbi], row.value)[0].toArray(true);
    mutate(decoded);
    row.value = abi.encode([requiredDefinition.valueAbi], [decoded]);
    const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
    assert.equal(inspection.integrity, 'INTEGRITY_FAILED', label);
    assert.match(inspection.errors.join('\n'), /RequiredPointInput/i, label);
  }
});

test('BindingScope full-state validation rejects a duplicate role hidden at another ordinal', () => {
  const supplied = buildPopulatedControlFixture();
  const scopeDefinition = COLLECTIONS.find(({ kind }) => kind === 15);
  const counterDefinition = COLLECTIONS.find(({ kind }) => kind === 23);
  const scopeEntries = supplied.filter(({ collectionKind }) => collectionKind === 15);
  const firstScopeKey = abi.decode([scopeDefinition.keyAbi], scopeEntries[0].key)[0];
  const firstRole = abi.decode([scopeDefinition.valueAbi], scopeEntries[0].value)[0];
  const firstScopeHash = bindingScopeKey({
    principalId: firstScopeKey[0],
    purpose: firstScopeKey[1],
    subject: firstScopeKey[2],
  });
  scopeEntries[1].key = abi.encode([scopeDefinition.keyAbi], [[
    firstScopeKey[0], firstScopeKey[1], firstScopeKey[2], 1,
  ]]);
  scopeEntries[1].value = abi.encode([scopeDefinition.valueAbi], [firstRole]);

  const secondScopeHash = [...new Set(supplied
    .filter(({ collectionKind }) => collectionKind === 23)
    .map((entry) => abi.decode([counterDefinition.keyAbi], entry.key)[0])
    .filter((key) => Number(key[0]) === 3)
    .map((key) => key[2].toLowerCase()))]
    .find((scope) => scope !== firstScopeHash.toLowerCase());
  const secondCounterIndex = supplied.findIndex((entry) => {
    if (entry.collectionKind !== 23) return false;
    const key = abi.decode([counterDefinition.keyAbi], entry.key)[0];
    return Number(key[0]) === 3 && key[2].toLowerCase() === secondScopeHash;
  });
  supplied.splice(secondCounterIndex, 1);
  const firstCounter = supplied.find((entry) => {
    if (entry.collectionKind !== 23) return false;
    const key = abi.decode([counterDefinition.keyAbi], entry.key)[0];
    return Number(key[0]) === 3 && key[2].toLowerCase() === firstScopeHash.toLowerCase();
  });
  firstCounter.value = abi.encode([counterDefinition.valueAbi], [2]);
  supplied.sort((left, right) => {
    if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
    const leftHash = keccak256(left.key);
    const rightHash = keccak256(right.key);
    if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
    return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
  });

  const inspection = inspectProjection(supplied, supplied, { claimFullState: true });
  assert.equal(inspection.integrity, 'INTEGRITY_FAILED');
  assert.match(inspection.errors.join('\n'), /BindingScope.*duplicate fieldRole/i);
});

test('BaseKind is a closed four-code registry and unknown base postings reject', () => {
  assert.deepEqual(BASE_KINDS, {
    TYPE: 1,
    RECORD_REFERENCE: 2,
    AUTHOR: 3,
    DIGEST: 4,
  });
  const expected = buildPopulatedControlFixture();
  const baseEntries = expected.filter((entry) => entry.collectionKind === 12);
  assert.equal(baseEntries.length, 4);
  const baseDefinition = COLLECTIONS.find(({ kind }) => kind === 12);
  const baseKeys = new Map(baseEntries.map((entry) => {
    const key = abi.decode([baseDefinition.keyAbi], entry.key)[0];
    return [Number(key[0]), key[1]];
  }));
  const typeEntry = expected.find((entry) => entry.collectionKind === 3);
  const typeSchemaId = abi.decode([COLLECTIONS.find(({ kind }) => kind === 3).keyAbi], typeEntry.key)[0];
  assert.equal(
    baseKeys.get(BASE_KINDS.RECORD_REFERENCE),
    recordReferenceBaseKey({ typeSchemaId, fieldKey: 2, targetRecordId: b32('18') }),
  );
  const recordEntry = expected.find((entry) => entry.collectionKind === 4);
  const recordDefinition = COLLECTIONS.find(({ kind }) => kind === 4);
  const canonicalBody = abi.decode([recordDefinition.valueAbi], recordEntry.value)[0][1];
  assert.equal(baseKeys.get(BASE_KINDS.DIGEST), recordBodyCommitment(canonicalBody));

  const supplied = structuredClone(expected);
  const baseIndex = supplied.findIndex((entry) => entry.collectionKind === 12);
  supplied[baseIndex] = encodeEntry(12, [5, b32('66'), 1], [b32('67'), b32('68')]);
  supplied.sort((left, right) => {
    if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
    return left.key.localeCompare(right.key);
  });
  const inspection = inspectProjection(expected, supplied, { claimFullState: true });
  assert.equal(inspection.integrity, 'INTEGRITY_FAILED');
  assert.match(inspection.errors.join('\n'), /BaseKind.*unknown|unknown.*BaseKind/i);
});

test('projection comparison distinguishes omission from substitution, duplication, and reordering', () => {
  const expected = buildPopulatedControlFixture();

  const omitted = inspectProjection(expected, expected.slice(0, -1), { claimFullState: true });
  assert.equal(omitted.integrity, 'MISSING_REQUIRED_ITEM');
  assert.equal(omitted.fullStateReconstruction, false);

  const substitutedEntries = structuredClone(expected);
  substitutedEntries[0].value = substitutedEntries[1].value;
  const substituted = inspectProjection(expected, substitutedEntries, { claimFullState: true });
  assert.equal(substituted.integrity, 'INTEGRITY_FAILED');
  assert.match(substituted.errors.join('\n'), /substitut/i);

  const substitutedKeyEntries = structuredClone(expected);
  substitutedKeyEntries[0].key = substitutedKeyEntries[1].key;
  const substitutedKey = inspectProjection(expected, substitutedKeyEntries, { claimFullState: true });
  assert.equal(substitutedKey.integrity, 'INTEGRITY_FAILED');
  assert.match(substitutedKey.errors.join('\n'), /substitut/i);

  const duplicatedEntries = [...expected, structuredClone(expected[0])];
  const duplicated = inspectProjection(expected, duplicatedEntries, { claimFullState: true });
  assert.equal(duplicated.integrity, 'INTEGRITY_FAILED');
  assert.match(duplicated.errors.join('\n'), /duplicate/i);

  const reorderedEntries = structuredClone(expected);
  [reorderedEntries[0], reorderedEntries[1]] = [reorderedEntries[1], reorderedEntries[0]];
  const reordered = inspectProjection(expected, reorderedEntries, { claimFullState: true });
  assert.equal(reordered.integrity, 'INTEGRITY_FAILED');
  assert.match(reordered.errors.join('\n'), /reorder/i);
});

test('a matched subset remains PARTIAL_INVARIANT_CONTROL and cannot claim full-state reconstruction', () => {
  const subset = buildPopulatedControlFixture().slice(0, 6);
  const inspection = inspectProjection(subset, subset, { claimFullState: true });
  assert.equal(inspection.integrity, 'MATCHED');
  assert.equal(inspection.scope, 'PARTIAL_INVARIANT_CONTROL');
  assert.equal(inspection.fullStateReconstruction, false);
});

test('terminal query completion accepts only the exact populated terminal commitment', () => {
  const fixture = buildTerminalQueryControlFixture();
  assert.deepEqual(validateTerminalQueryCompletion(fixture.actual, fixture.expected), []);
});

test('terminal query completion rejects every required coordinate mismatch', () => {
  const fixture = buildTerminalQueryControlFixture();
  const fields = [
    'realmId',
    'realmRevisionId',
    'queryProfileId',
    'generation',
    'ordering',
    'activationHighWater',
    'coveredThroughHighWater',
    'terminalCount',
    'terminalPostingsRoot',
    'declaredDomainRoot',
  ];
  for (const field of fields) {
    const actual = structuredClone(fixture.actual);
    actual[field] = typeof actual[field] === 'number' ? actual[field] + 1 : `0x${'ff'.repeat(32)}`;
    assert.match(validateTerminalQueryCompletion(actual, fixture.expected).join('\n'), new RegExp(field, 'i'), field);
  }

  for (const field of ['blockHash', 'stateRoot', 'sourceKind', 'finality', 'freshnessCoordinate']) {
    const actual = structuredClone(fixture.actual);
    actual.observerBasis[field] = typeof actual.observerBasis[field] === 'number'
      ? actual.observerBasis[field] + 1
      : `0x${'ee'.repeat(32)}`;
    assert.match(validateTerminalQueryCompletion(actual, fixture.expected).join('\n'), new RegExp(`observerBasis.${field}`, 'i'), field);
  }
});

test('terminal query completion rejects page limit above 32 and independently recomputes count and postings root', () => {
  const fixture = buildTerminalQueryControlFixture();
  const actual = structuredClone(fixture.actual);
  actual.requestedLimit = 33;
  actual.terminalCount += 1;
  actual.terminalPostingsRoot = `0x${'dd'.repeat(32)}`;
  const errors = validateTerminalQueryCompletion(actual, fixture.expected).join('\n');
  assert.match(errors, /limit.*32/i);
  assert.match(errors, /terminalCount.*postings/i);
  assert.match(errors, /terminalPostingsRoot.*recomputed/i);
});

test('cursor continuation rejects each of the 11 exact CursorV0 coordinate mismatches', () => {
  const { actual } = buildTerminalQueryControlFixture();
  const expected = actual.cursor;
  const fields = [
    'realmId',
    'realmRevisionId',
    'queryProfileId',
    'generation',
    'ordering',
    'activationHighWater',
    'coveredThroughHighWater',
    'executionCoordinate',
    'observerBlockHash',
    'afterPostingOrdinal',
    'declaredDomainRoot',
  ];
  assert.deepEqual(validateCursorCoordinates(expected, expected), []);
  for (const field of fields) {
    const cursor = structuredClone(expected);
    cursor[field] = typeof cursor[field] === 'number' ? cursor[field] + 1 : `0x${'cc'.repeat(32)}`;
    assert.match(validateCursorCoordinates(cursor, expected).join('\n'), new RegExp(field, 'i'), field);
  }
});

test('raw getPoint validates an exact registry key against a literal ResultV0 without rebuilding it', () => {
  const entries = buildPopulatedControlFixture();
  const recordEntry = entries.find(({ collectionKind }) => collectionKind === 4);
  assert.equal(POINT_SUBJECT_KIND_BY_COLLECTION[4], ENUMS.subjectKind.COLLECTION_ENTRY);
  assert.deepEqual(validateRawPointRead({
    entries,
    collectionKind: 4,
    key: recordEntry.key,
    resultV0: literalPointResult(recordEntry),
  }), []);

  const substituted = literalPointResult(recordEntry);
  substituted.rawRetention.canonicalBytes = '0x1234';
  assert.match(validateRawPointRead({
    entries,
    collectionKind: 4,
    key: recordEntry.key,
    resultV0: substituted,
  }).join('\n'), /raw|value/i);
});

test('generic COLLECTION_ENTRY binds every collection kind and exact canonical key', () => {
  const entries = buildPopulatedControlFixture();
  assert.deepEqual(
    Object.keys(POINT_SUBJECT_KIND_BY_COLLECTION).map(Number),
    Array.from({ length: 28 }, (_, index) => index + 1),
  );
  for (const entry of entries) {
    assert.equal(POINT_SUBJECT_KIND_BY_COLLECTION[entry.collectionKind], ENUMS.subjectKind.COLLECTION_ENTRY);
    assert.deepEqual(validateRawPointRead({
      entries,
      collectionKind: entry.collectionKind,
      key: entry.key,
      resultV0: literalPointResult(entry),
    }), [], `collection kind ${entry.collectionKind}`);
  }

  const publicationEntry = entries.find(({ collectionKind }) => collectionKind === 5);
  const substituted = literalPointResult(publicationEntry);
  substituted.subject = encodeCollectionEntrySubject(6, publicationEntry.key);
  assert.match(validateRawPointRead({
    entries,
    collectionKind: 5,
    key: publicationEntry.key,
    resultV0: substituted,
  }).join('\n'), /subject.*exact collection entry/i);
});
