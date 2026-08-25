const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AXES,
  DOMAINS,
  LIMITS,
  applyAdmissionPlan,
  applyBindingCas,
  bootstrapRealm,
  completeQueryProfile,
  createState,
  encodeCursor,
  ids,
  projectState,
  putPortableArtifacts,
  queryPage,
  validateCursor,
  withdrawOccurrence,
} = require('../src/model.cjs');

const b32 = (byte) => `0x${byte.repeat(32)}`;
const addr = (byte) => `0x${byte.repeat(20)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;

const ALICE = {
  authorityKind: 1,
  originLineage: '0x',
  account: addr('aa'),
};

const bootstrap = {
  originLineage: utf8Hex('evm:31337:genesis-A'),
  genesisCommitment: b32('10'),
  coreCommitment: b32('30'),
  componentCommitment: b32('40'),
  executionProfileId: b32('50'),
  policyId: b32('60'),
  verifierProfileSetId: b32('70'),
  administrationCommitment: b32('80'),
  activationStart: 0n,
  activationEndExclusive: (1n << 64n) - 1n,
  disclosedPowers: [1, 2],
};

const typeNote = {
  semanticCommitment: utf8Hex('exact Note/v0'),
  fields: [
    { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 64 },
    { fieldKey: 2, scalarKind: 4, required: false, maxLengthOrCount: 0 },
  ],
  fieldOrder: 1,
  encoding: 1,
  intrinsicConstraints: [{ fieldKey: 1, rule: 2 }],
  referenceRoles: [{ fieldKey: 2, targetKind: 2, targetTypeSchemaId: b32('00') }],
};

const recordA = { body: utf8Hex('alpha') };
const recordB = { body: utf8Hex('beta -> A') };

test('profile domains are unique and bounds are concrete but disposable', () => {
  assert.equal(new Set(Object.values(DOMAINS)).size, Object.values(DOMAINS).length);
  assert.equal(LIMITS.profileVersion, 0);
  assert.equal(LIMITS.maxLensPrincipals, 64);
  assert.equal(LIMITS.maxRecordBodyBytes, 4096);
  assert.equal(LIMITS.maxPublicationLeavesPerAdmission, 2);
  assert.equal(LIMITS.maxTypes, 16);
});

test('Realm-total Type cap accepts 16 and rejects the 17th without state change', () => {
  let state = createState();
  const publication = {
    author: ALICE,
    sourceActor: ALICE,
    verifierProfileId: b32('91'),
    nonce: 1n,
    expiryCoordinate: 100n,
    recordIds: [],
  };
  const publicationId = ids.publication(publication);
  for (let index = 0; index < 16; index += 1) {
    const typeSchema = {
      ...typeNote,
      semanticCommitment: utf8Hex(`bounded Type ${index}`),
    };
    const typeId = ids.type(typeSchema);
    state = putPortableArtifacts(state, {
      typeId,
      typeSchema,
      records: [],
      publicationId,
      publication,
    });
  }
  assert.equal(state.types.size, 16);
  const before = state;
  const seventeenth = { ...typeNote, semanticCommitment: utf8Hex('bounded Type 16') };
  assert.throws(() => putPortableArtifacts(state, {
    typeId: ids.type(seventeenth),
    typeSchema: seventeenth,
    records: [],
    publicationId,
    publication,
  }), /Type limit exceeded/);
  assert.equal(state, before);
  assert.equal(state.types.size, 16);
});

test('R0/R1/R2: Realm identity binds genesis, Core, and disclosed bootstrap powers', () => {
  const realmA = ids.realm(bootstrap);
  assert.notEqual(realmA, ids.realm({ ...bootstrap, coreCommitment: b32('31') }));
  assert.notEqual(realmA, ids.realm({ ...bootstrap, genesisCommitment: b32('13') }));
  assert.notEqual(realmA, ids.realm({ ...bootstrap, administrationCommitment: b32('81') }));
  assert.notEqual(realmA, ids.realm({ ...bootstrap, disclosedPowers: [1, 3] }));
  assert.equal(realmA, ids.realm({ ...bootstrap }));
});

test('T0 partial invariant: Type and Record IDs bind candidate canonical bytes without author identity', () => {
  const typeId = ids.type(typeNote);
  const recA = ids.record(typeId, recordA.body);
  assert.equal(typeId, ids.type({ ...typeNote }));
  assert.notEqual(typeId, ids.type({ ...typeNote, semanticCommitment: `${typeNote.semanticCommitment}00` }));
  assert.equal(recA, ids.record(typeId, recordA.body));
  assert.notEqual(recA, ids.record(typeId, `${recordA.body}00`));
  assert.notEqual(recA, ids.record(b32('ff'), recordA.body));
});

test('P0: PublicationSet preserves order and Occurrence binds the exact leaf index', () => {
  const typeId = ids.type(typeNote);
  const recA = ids.record(typeId, recordA.body);
  const recB = ids.record(typeId, recordB.body);
  const publication = {
    author: ALICE,
    sourceActor: ALICE,
    verifierProfileId: b32('91'),
    nonce: 7n,
    expiryCoordinate: 100n,
    recordIds: [recA, recB],
  };
  const publicationId = ids.publication(publication);
  assert.notEqual(publicationId, ids.publication({ ...publication, recordIds: [recB, recA] }));
  assert.notEqual(ids.occurrence(publicationId, 0), ids.occurrence(publicationId, 1));
});

test('Q4A partial invariant: cursor commitment is sensitive to every coordinate', () => {
  const cursorFields = {
    realmId: b32('a1'),
    realmRevisionId: b32('a0'),
    queryProfileId: b32('a2'),
    generation: 1,
    ordering: 1,
    activationHighWater: 19,
    coveredThroughHighWater: 17,
    executionCoordinate: 42n,
    observerBlockHash: b32('a5'),
    afterPostingOrdinal: 8,
    declaredDomainRoot: b32('a4'),
  };
  const cursor = encodeCursor(cursorFields);
  assert.equal(validateCursor(cursor, cursorFields).ok, true);
  const mutations = {
    realmId: b32('b1'),
    realmRevisionId: b32('b2'),
    queryProfileId: b32('b3'),
    generation: 2,
    ordering: 2,
    activationHighWater: 20,
    coveredThroughHighWater: 18,
    executionCoordinate: 43n,
    observerBlockHash: b32('b4'),
    afterPostingOrdinal: 9,
    declaredDomainRoot: b32('b5'),
  };
  for (const [coordinate, value] of Object.entries(mutations)) {
    assert.equal(validateCursor(cursor, { ...cursorFields, [coordinate]: value }).ok, false, coordinate);
  }
});

test('transition control: bootstrap -> artifacts -> atomic admission and Binding -> idempotent retry', () => {
  let state = createState();
  ({ state } = bootstrapRealm(state, bootstrap));

  const realmId = ids.realm(bootstrap);
  const typeId = ids.type(typeNote);
  const recA = ids.record(typeId, recordA.body);
  const recB = ids.record(typeId, recordB.body);
  const publication = {
    author: ALICE,
    sourceActor: ALICE,
    verifierProfileId: b32('91'),
    nonce: 7n,
    expiryCoordinate: 100n,
    recordIds: [recA, recB],
  };
  const publicationId = ids.publication(publication);
  state = putPortableArtifacts(state, {
    typeId,
    typeSchema: typeNote,
    records: [
      { id: recA, typeId, body: recordA.body },
      { id: recB, typeId, body: recordB.body },
    ],
    publicationId,
    publication,
  });

  const plan = {
    realmId,
    realmRevision: 0n,
    coreCommitment: bootstrap.coreCommitment,
    semanticAuthor: ALICE,
    actor: ALICE,
    payer: ALICE,
    verifierProfileId: publication.verifierProfileId,
    nonceLane: 0n,
    nonce: 1n,
    expiryCoordinate: 100n,
    expectedBindingRevision: 0n,
    position: b32('b1'),
    publicationId,
    occurrenceIndices: [0, 1],
    bindingTarget: recB,
    maximumCost: 1_000_000n,
  };

  const first = applyAdmissionPlan(state, plan, {
    executionCoordinate: 99n,
    signatureValid: true,
  });
  assert.equal(first.result.effect, AXES.effect.COMMITTED);
  assert.equal(first.state.counters.admissionHighWater, 2n);
  assert.equal(first.state.bindingHeads.get(`${ids.principal(ALICE)}:${plan.position}`).revision, 1n);

  const retry = applyAdmissionPlan(first.state, plan, {
    executionCoordinate: 99n,
    signatureValid: true,
  });
  assert.equal(retry.operationId, first.operationId);
  assert.equal(retry.idempotent, true);
  assert.equal(retry.state, first.state);

  const conflictingPlan = { ...plan, bindingTarget: recA };
  const conflict = applyAdmissionPlan(first.state, conflictingPlan, {
    executionCoordinate: 99n,
    signatureValid: true,
  });
  assert.equal(conflict.result.presence, AXES.presence.CONFLICT);
  assert.equal(conflict.result.effect, AXES.effect.UNKNOWN);
  assert.equal(conflict.state, first.state);
});

test('partial rejection controls: injected denial and exclusive expiry leave state object unchanged', () => {
  let state = createState();
  ({ state } = bootstrapRealm(state, bootstrap));
  const realmId = ids.realm(bootstrap);
  const plan = {
    realmId,
    realmRevision: 0n,
    coreCommitment: bootstrap.coreCommitment,
    semanticAuthor: ALICE,
    actor: ALICE,
    payer: ALICE,
    verifierProfileId: b32('91'),
    nonceLane: 0n,
    nonce: 2n,
    expiryCoordinate: 100n,
    expectedBindingRevision: 0n,
    position: b32('b1'),
    publicationId: b32('b2'),
    occurrenceIndices: [0],
    bindingTarget: b32('b3'),
    maximumCost: 1_000_000n,
  };
  for (const options of [
    { executionCoordinate: 99n, signatureValid: false },
    { executionCoordinate: 100n, signatureValid: true },
    { executionCoordinate: 101n, signatureValid: true },
  ]) {
    const outcome = applyAdmissionPlan(state, plan, options);
    assert.equal(outcome.state, state);
    assert.equal(outcome.result.effect, AXES.effect.UNKNOWN);
  }
});

test('B0/B1/B2/B3: Binding is CAS-only; tombstone and Withdrawal never resurrect data', () => {
  const principalId = ids.principal(ALICE);
  const position = b32('c1');
  const targetA = b32('c2');
  const targetB = b32('c3');
  let state = createState();

  let outcome = applyBindingCas(state, { principalId, position, expectedRevision: 0n, target: targetA });
  state = outcome.state;
  assert.equal(outcome.result.effect, AXES.effect.COMMITTED);

  outcome = applyBindingCas(state, { principalId, position, expectedRevision: 0n, target: targetB });
  assert.equal(outcome.state, state);
  assert.equal(outcome.result.effect, AXES.effect.UNKNOWN);

  outcome = applyBindingCas(state, { principalId, position, expectedRevision: 1n, tombstone: true });
  state = outcome.state;
  assert.equal(state.bindingHeads.get(`${principalId}:${position}`).tombstone, true);

  const withdrawn = withdrawOccurrence(state, { issuer: principalId, occurrenceId: b32('c4') });
  assert.equal(withdrawn.state.bindingHeads.get(`${principalId}:${position}`).tombstone, true);
  assert.equal(withdrawn.state.withdrawals.size, 1);
});

test('legacy query invariant: a nonterminal page stays PARTIAL', () => {
  const queryProfileId = b32('d1');
  const typeId = b32('d2');
  let state = createState();
  state.queryProfileActivations.set(queryProfileId, {
    generation: 1n,
    typeId,
    coveredThrough: 2n,
    activationHighWater: 4n,
    terminal: false,
    postings: [b32('d3')],
  });

  let page = queryPage(state, { queryProfileId, offset: 0, limit: 10, basisBlockHash: b32('d4') });
  assert.equal(page.result.coverage, AXES.coverage.PARTIAL);
  assert.notEqual(page.result.presence, AXES.presence.ABSENT_PROVEN);

  state = completeQueryProfile(state, {
    queryProfileId,
    expectedHighWater: 4n,
    expectedCount: 1n,
  }).state;
  page = queryPage(state, { queryProfileId, offset: 1, limit: 10, basisBlockHash: b32('d4') });
  assert.equal(page.items.length, 0);
  assert.equal(page.result.coverage, AXES.coverage.COMPLETE);
  assert.equal(page.result.presence, AXES.presence.ABSENT_PROVEN);
});

test('partial projection invariant: bootstrap subset is deterministic and detects one omission', () => {
  let state = createState();
  ({ state } = bootstrapRealm(state, bootstrap));
  const projectionA = projectState(state);
  const projectionB = projectState(state);
  assert.deepEqual(projectionB, projectionA);
  assert.equal(projectionA.integrity, AXES.projectionIntegrity.MATCHED);

  const missing = structuredClone(projectionA);
  missing.entries.pop();
  const checked = projectState(state, missing.entries);
  assert.equal(checked.integrity, AXES.projectionIntegrity.MISSING_REQUIRED_ITEM);
  assert.notEqual(checked.projectionRoot, projectionA.projectionRoot);
});
