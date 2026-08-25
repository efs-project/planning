'use strict';

// Early semantic transition control. This file deliberately is not the exact
// ResultV0, AdmissionPlanV0, query-terminal, or complete ProjectionV0 codec.
// Exact candidate codecs live in the focused *-v0 modules beside it. Keep this
// model only for state-transition invariants; never publish its flattened
// result objects or plan/operation commitments as C0/v0 ABI values.

const path = require('node:path');
const { createRequire } = require('node:module');

// This disposable control deliberately reuses the already-installed Ethereum
// toolchain from the sibling contracts repo. It is not a package or SDK seam.
const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();
const {
  encodeTypeSchemaV0,
  inspectTypeSchemaEnvelope,
  typeSchemaIdFromTypeBytes,
} = require('./type-interpreter-v0.cjs');

const PROFILE_VERSION = 0;
const domain = (name) => keccak256(toUtf8Bytes(name));

const DOMAINS = Object.freeze({
  realm: domain('EFS2/EXP-C0/V0/REALM'),
  initialRevision: domain('EFS2/EXP-C0/V0/INITIAL_REVISION'),
  realmRevision: domain('EFS2/EXP-C0/V0/REALM_REVISION'),
  principal: domain('EFS2/EXP-C0/V0/PRINCIPAL'),
  type: domain('EFS2/EXP-C0/V0/TYPE'),
  body: domain('EFS2/EXP-C0/V0/BODY'),
  record: domain('EFS2/EXP-C0/V0/RECORD'),
  publication: domain('EFS2/EXP-C0/V0/PUBLICATION'),
  occurrence: domain('EFS2/EXP-C0/V0/OCCURRENCE'),
  admissionPlan: domain('EFS2/EXP-C0/V0/ADMISSION_PLAN'),
  effectSet: domain('EFS2/EXP-C0/V0/EFFECT_SET'),
  operation: domain('EFS2/EXP-C0/V0/OPERATION'),
  admission: domain('EFS2/EXP-C0/V0/ADMISSION'),
  binding: domain('EFS2/EXP-C0/V0/BINDING'),
  withdrawal: domain('EFS2/EXP-C0/V0/WITHDRAWAL'),
  cursor: domain('EFS2/EXP-C0/V0/CURSOR'),
  postings: domain('EFS2/EXP-C0/V0/POSTINGS'),
  projection: domain('EFS2/EXP-C0/V0/PROJECTION'),
});

const LIMITS = Object.freeze({
  profileVersion: PROFILE_VERSION,
  maxRealmRevisions: 2,
  maxTypes: 16,
  maxTypeDescriptorBytes: 2048,
  maxRecords: 16,
  maxRecordBodyBytes: 4096,
  maxPublicationSets: 8,
  maxPublicationLeavesPerAdmission: 2,
  maxOperations: 32,
  maxAdmissions: 32,
  maxBindingsPerPrincipal: 8,
  maxQueryProfiles: 1,
  maxQueryPostings: 32,
  maxQueryPageMembers: 32,
  maxLensPrincipals: 64,
  maxLensProbes: 64,
  maxEffectsPerPlan: 4,
  maxSignatureBytes: 256,
});

const enumOf = (values) => Object.freeze(Object.fromEntries(values.map((value) => [value, value])));

const AXES = Object.freeze({
  kind: enumOf(['POINT', 'SCOPE', 'MUTATION', 'SUBMISSION', 'RECONSTRUCTION']),
  presence: enumOf(['FOUND', 'ABSENT_PROVEN', 'UNKNOWN', 'CONFLICT', 'OPAQUE', 'MASKED', 'NOT_APPLICABLE']),
  coverage: enumOf(['COMPLETE', 'PARTIAL', 'NOT_APPLICABLE']),
  support: enumOf(['SUPPORTED', 'UNSUPPORTED', 'LIMIT_EXCEEDED', 'NOT_APPLICABLE']),
  validation: enumOf(['STRUCTURALLY_VALID', 'SEMANTICALLY_VALID', 'INVALID', 'UNPROVEN', 'NOT_APPLICABLE']),
  authority: enumOf(['AUTHORIZED', 'DENIED', 'UNPROVEN', 'NOT_APPLICABLE']),
  lifecycle: enumOf(['ADMITTED', 'WITHDRAWN', 'CARRIED_ONLY', 'UNPROVEN', 'NOT_APPLICABLE']),
  selection: enumOf(['CURRENT', 'NOT_CURRENT', 'CONFLICT', 'UNKNOWN', 'NOT_APPLICABLE']),
  bytes: enumOf(['VERIFIED_AVAILABLE', 'PARTIAL', 'UNAVAILABLE', 'INTEGRITY_FAILED', 'NOT_APPLICABLE']),
  effect: enumOf(['COMMITTED', 'NOT_COMMITTED_PROVEN', 'UNKNOWN', 'NOT_APPLICABLE']),
  projectionIntegrity: enumOf(['MATCHED', 'MISSING_REQUIRED_ITEM', 'INTEGRITY_FAILED', 'NOT_APPLICABLE']),
});

function bytesLength(value) {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) throw new Error('expected canonical hex bytes');
  return (value.length - 2) / 2;
}

function assertBoundedBytes(value, limit, label) {
  if (bytesLength(value) > limit) throw new Error(`${label} exceeds disposable EXP-C0/v0 limit ${limit}`);
}

function principalId(principal) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'tuple(uint8,bytes,address)'],
    [DOMAINS.principal, PROFILE_VERSION, [principal.authorityKind, principal.originLineage, principal.account]],
  ));
}

function initialRevisionCommitment(bootstrap) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'uint32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64'],
    [
      DOMAINS.initialRevision,
      PROFILE_VERSION,
      0,
      bootstrap.componentCommitment,
      bootstrap.executionProfileId,
      bootstrap.policyId,
      bootstrap.verifierProfileSetId,
      bootstrap.administrationCommitment,
      bootstrap.activationStart,
      bootstrap.activationEndExclusive,
    ],
  ));
}

function realmId(bootstrap) {
  const initial = initialRevisionCommitment(bootstrap);
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes', 'bytes32', 'bytes32', 'bytes32', 'uint8[]'],
    [
      DOMAINS.realm,
      PROFILE_VERSION,
      bootstrap.originLineage,
      bootstrap.genesisCommitment,
      bootstrap.coreCommitment,
      initial,
      bootstrap.disclosedPowers,
    ],
  ));
}

function realmRevisionId(realm, generation, bootstrap) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'tuple(bytes32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,uint64)'],
    [
      DOMAINS.realmRevision,
      PROFILE_VERSION,
      [
        realm,
        generation,
        bootstrap.componentCommitment,
        bootstrap.executionProfileId,
        bootstrap.policyId,
        bootstrap.verifierProfileSetId,
        bootstrap.administrationCommitment,
        bootstrap.activationStart,
        bootstrap.activationEndExclusive,
      ],
    ],
  ));
}

function typeSchemaBytes(type) {
  const raw = type.rawTypeBytes ?? encodeTypeSchemaV0(type);
  assertBoundedBytes(raw, LIMITS.maxTypeDescriptorBytes, 'Type descriptor');
  return raw;
}

function typeId(type) {
  return typeSchemaIdFromTypeBytes(typeSchemaBytes(type));
}

function recordId(typeSchemaId, body) {
  assertBoundedBytes(body, LIMITS.maxRecordBodyBytes, 'Record body');
  const bodyHash = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes'],
    [DOMAINS.body, PROFILE_VERSION, body],
  ));
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32'],
    [DOMAINS.record, PROFILE_VERSION, typeSchemaId, bodyHash],
  ));
}

function publicationId(publication) {
  if (publication.recordIds.length > LIMITS.maxRecords) throw new Error('PublicationSet exceeds record limit');
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'tuple(bytes32,bytes32,bytes32,uint32,uint32,uint64,uint64,uint8,uint8,bytes32[])'],
    [DOMAINS.publication, PROFILE_VERSION, publicationValue(publication)],
  ));
}

function occurrenceId(publicationSetId, leafIndex) {
  if (!Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex > 0xffff) throw new Error('invalid leaf index');
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'uint16'],
    [DOMAINS.occurrence, PROFILE_VERSION, publicationSetId, leafIndex],
  ));
}

function operationPlanId(plan) {
  if (plan.occurrenceIndices.length > LIMITS.maxPublicationLeavesPerAdmission) {
    throw new Error('AdmissionPlan exceeds occurrence limit');
  }
  return keccak256(abi.encode(
    [
      'bytes32', 'uint16', 'bytes32', 'uint64', 'bytes32', 'bytes32', 'bytes32', 'bytes32',
      'uint64', 'uint64', 'uint64', 'uint64', 'bytes32', 'bytes32', 'uint32[]', 'bytes32', 'uint256',
    ],
    [
      DOMAINS.admissionPlan,
      PROFILE_VERSION,
      plan.realmId,
      plan.realmRevision,
      plan.coreCommitment,
      principalId(plan.semanticAuthor),
      principalId(plan.actor),
      principalId(plan.payer),
      plan.nonceLane,
      plan.nonce,
      plan.expiryCoordinate,
      plan.expectedBindingRevision,
      plan.position,
      plan.publicationId,
      plan.occurrenceIndices,
      plan.bindingTarget,
      plan.maximumCost,
    ],
  ));
}

const ids = Object.freeze({
  principal: principalId,
  realm: realmId,
  realmRevision: realmRevisionId,
  initialRevision: initialRevisionCommitment,
  type: typeId,
  record: recordId,
  publication: publicationId,
  occurrence: occurrenceId,
  operationPlan: operationPlanId,
  cursor: cursorCommitment,
});

function createState() {
  return {
    realmBootstraps: new Map(),
    realmRevisions: new Map(),
    types: new Map(),
    records: new Map(),
    publicationSets: new Map(),
    occurrences: new Map(),
    noncePlans: new Map(),
    operations: new Map(),
    admissions: new Map(),
    bindingHeads: new Map(),
    bindingHistory: new Map(),
    bindingScopes: new Map(),
    withdrawals: new Map(),
    queryProfileActivations: new Map(),
    counters: {
      admissionHighWater: 0n,
      bindingRevision: 0n,
      scopeCount: 0n,
      coverageHighWater: 0n,
    },
  };
}

function mutationResult(effect, overrides = {}) {
  return {
    kind: AXES.kind.MUTATION,
    presence: AXES.presence.NOT_APPLICABLE,
    coverage: AXES.coverage.NOT_APPLICABLE,
    support: AXES.support.SUPPORTED,
    validation: AXES.validation.SEMANTICALLY_VALID,
    authority: AXES.authority.AUTHORIZED,
    lifecycle: AXES.lifecycle.NOT_APPLICABLE,
    selection: AXES.selection.NOT_APPLICABLE,
    bytes: AXES.bytes.NOT_APPLICABLE,
    effect,
    projectionIntegrity: AXES.projectionIntegrity.NOT_APPLICABLE,
    ...overrides,
  };
}

function rejectedResult(overrides = {}) {
  // This early model has no independently reconstructed complete pre/post
  // ProjectionV0 receipt. An unchanged JS object is useful control evidence,
  // but it cannot upgrade the semantic fact to NOT_COMMITTED_PROVEN.
  return mutationResult(AXES.effect.UNKNOWN, overrides);
}

function bootstrapRealm(state, bootstrap) {
  const id = realmId(bootstrap);
  if (state.realmBootstraps.has(id)) return { state, realmId: id, idempotent: true, result: mutationResult(AXES.effect.COMMITTED) };
  const next = structuredClone(state);
  const revisionId = realmRevisionId(id, 0, bootstrap);
  next.realmBootstraps.set(id, {
    ...bootstrap,
    initialRevisionCommitment: initialRevisionCommitment(bootstrap),
    initialRevisionId: revisionId,
  });
  next.realmRevisions.set(`${id}:0`, {
    realmId: id,
    generation: 0,
    commitment: revisionId,
    componentCommitment: bootstrap.componentCommitment,
    executionProfileId: bootstrap.executionProfileId,
    policyId: bootstrap.policyId,
    verifierProfileSetId: bootstrap.verifierProfileSetId,
    administrationCommitment: bootstrap.administrationCommitment,
    activationStart: bootstrap.activationStart,
    activationEndExclusive: bootstrap.activationEndExclusive,
  });
  return { state: next, realmId: id, idempotent: false, result: mutationResult(AXES.effect.COMMITTED) };
}

function putPortableArtifacts(state, artifacts) {
  const rawTypeBytes = artifacts.typeBytes ?? typeSchemaBytes(artifacts.typeSchema);
  const inspection = inspectTypeSchemaEnvelope(rawTypeBytes);
  if (inspection.support !== 'SUPPORTED') throw new Error('Unsupported Type codec');
  if (artifacts.typeId !== inspection.typeSchemaId) throw new Error('Type ID mismatch');
  if (state.types.size >= LIMITS.maxTypes && !state.types.has(artifacts.typeId)) throw new Error('Type limit exceeded');
  if (artifacts.records.length + state.records.size > LIMITS.maxRecords) throw new Error('Record limit exceeded');
  if (state.publicationSets.size >= LIMITS.maxPublicationSets && !state.publicationSets.has(artifacts.publicationId)) {
    throw new Error('PublicationSet limit exceeded');
  }
  for (const record of artifacts.records) {
    if (record.id !== recordId(record.typeId, record.body)) throw new Error('Record ID mismatch');
    if (record.typeId !== artifacts.typeId) throw new Error('Record Type mismatch');
  }
  if (artifacts.publicationId !== publicationId(artifacts.publication)) throw new Error('PublicationSet ID mismatch');
  const next = structuredClone(state);
  next.types.set(artifacts.typeId, { ...artifacts.typeSchema, rawTypeBytes });
  for (const record of artifacts.records) next.records.set(record.id, record);
  next.publicationSets.set(artifacts.publicationId, artifacts.publication);
  return next;
}

function bindingKey(principal, position) {
  return `${principal}:${position}`;
}

function applyBindingCas(state, change) {
  const key = bindingKey(change.principalId, change.position);
  const current = state.bindingHeads.get(key);
  const currentRevision = current ? current.revision : 0n;
  if (currentRevision !== change.expectedRevision || (current?.tombstone && !change.tombstone)) {
    return {
      state,
      result: rejectedResult({
        presence: AXES.presence.CONFLICT,
        selection: current ? AXES.selection.CURRENT : AXES.selection.NOT_APPLICABLE,
      }),
    };
  }
  const next = structuredClone(state);
  const revision = currentRevision + 1n;
  const head = {
    revision,
    target: change.tombstone ? null : change.target,
    tombstone: Boolean(change.tombstone),
  };
  next.bindingHeads.set(key, head);
  next.bindingHistory.set(`${key}:${revision}`, head);
  if (!current) {
    const scopeKey = `${change.principalId}:${next.counters.scopeCount}`;
    next.bindingScopes.set(scopeKey, change.position);
    next.counters.scopeCount += 1n;
  }
  next.counters.bindingRevision += 1n;
  return { state: next, result: mutationResult(AXES.effect.COMMITTED) };
}

function applyAdmissionPlan(state, plan, options) {
  const planId = operationPlanId(plan);
  const operationId = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32'],
    [DOMAINS.operation, PROFILE_VERSION, planId],
  ));
  const authorId = principalId(plan.semanticAuthor);
  const nonceKey = `${plan.realmId}:${authorId}:${plan.nonceLane}:${plan.nonce}`;
  const previous = state.noncePlans.get(nonceKey);
  if (previous) {
    if (previous.planId === planId) {
      return { state, operationId: previous.operationId, idempotent: true, result: mutationResult(AXES.effect.COMMITTED) };
    }
    return {
      state,
      operationId,
      idempotent: false,
      result: rejectedResult({ presence: AXES.presence.CONFLICT }),
    };
  }

  const bootstrap = state.realmBootstraps.get(plan.realmId);
  const realmRevision = state.realmRevisions.get(`${plan.realmId}:${plan.realmRevision}`);
  if (!bootstrap || !realmRevision || bootstrap.coreCommitment !== plan.coreCommitment) {
    return { state, operationId, idempotent: false, result: rejectedResult({ authority: AXES.authority.DENIED }) };
  }
  if (!options.signatureValid) {
    return { state, operationId, idempotent: false, result: rejectedResult({ authority: AXES.authority.DENIED }) };
  }
  if (BigInt(options.executionCoordinate) >= BigInt(plan.expiryCoordinate)) {
    return { state, operationId, idempotent: false, result: rejectedResult({ validation: AXES.validation.INVALID }) };
  }
  const publication = state.publicationSets.get(plan.publicationId);
  if (!publication) {
    return { state, operationId, idempotent: false, result: rejectedResult({ validation: AXES.validation.INVALID }) };
  }
  if (plan.occurrenceIndices.length === 0 || plan.occurrenceIndices.length > LIMITS.maxPublicationLeavesPerAdmission) {
    return { state, operationId, idempotent: false, result: rejectedResult({ support: AXES.support.LIMIT_EXCEEDED }) };
  }
  if (plan.occurrenceIndices.some((index) => index < 0 || index >= publication.recordIds.length)) {
    return { state, operationId, idempotent: false, result: rejectedResult({ validation: AXES.validation.INVALID }) };
  }
  const headKey = bindingKey(authorId, plan.position);
  const currentRevision = state.bindingHeads.get(headKey)?.revision ?? 0n;
  if (currentRevision !== plan.expectedBindingRevision) {
    return { state, operationId, idempotent: false, result: rejectedResult({ presence: AXES.presence.CONFLICT }) };
  }
  if (state.operations.size >= LIMITS.maxOperations || state.admissions.size + plan.occurrenceIndices.length > LIMITS.maxAdmissions) {
    return { state, operationId, idempotent: false, result: rejectedResult({ support: AXES.support.LIMIT_EXCEEDED }) };
  }

  const next = structuredClone(state);
  next.noncePlans.set(nonceKey, { planId, operationId });
  next.operations.set(operationId, { planId, effect: AXES.effect.COMMITTED });
  for (const index of plan.occurrenceIndices) {
    const occurrence = occurrenceId(plan.publicationId, index);
    next.occurrences.set(occurrence, { publicationId: plan.publicationId, leafIndex: index });
    next.counters.admissionHighWater += 1n;
    const admissionId = keccak256(abi.encode(
      ['bytes32', 'uint16', 'bytes32', 'bytes32', 'uint64'],
      [DOMAINS.admission, PROFILE_VERSION, operationId, occurrence, next.counters.admissionHighWater],
    ));
    next.admissions.set(admissionId, {
      operationId,
      occurrenceId: occurrence,
      ordinal: next.counters.admissionHighWater,
      realmId: plan.realmId,
      realmRevision: plan.realmRevision,
    });
  }
  const revision = currentRevision + 1n;
  const newHead = { revision, target: plan.bindingTarget, tombstone: false, operationId };
  next.bindingHeads.set(headKey, newHead);
  next.bindingHistory.set(`${headKey}:${revision}`, newHead);
  if (currentRevision === 0n) {
    next.bindingScopes.set(`${authorId}:${next.counters.scopeCount}`, plan.position);
    next.counters.scopeCount += 1n;
  }
  next.counters.bindingRevision += 1n;
  return { state: next, operationId, idempotent: false, result: mutationResult(AXES.effect.COMMITTED) };
}

function withdrawOccurrence(state, withdrawal) {
  const id = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32'],
    [DOMAINS.withdrawal, PROFILE_VERSION, withdrawal.issuer, withdrawal.occurrenceId],
  ));
  if (state.withdrawals.has(id)) return { state, withdrawalId: id, idempotent: true, result: mutationResult(AXES.effect.COMMITTED) };
  const next = structuredClone(state);
  next.withdrawals.set(id, withdrawal);
  return { state: next, withdrawalId: id, idempotent: false, result: mutationResult(AXES.effect.COMMITTED) };
}

const CURSOR_ABI = 'tuple(bytes32,bytes32,bytes32,uint32,uint8,uint32,uint32,uint64,bytes32,uint32,bytes32)';

function cursorValues(fields) {
  return [
    fields.realmId,
    fields.realmRevisionId,
    fields.queryProfileId,
    fields.generation,
    fields.ordering,
    fields.activationHighWater,
    fields.coveredThroughHighWater,
    fields.executionCoordinate,
    fields.observerBlockHash,
    fields.afterPostingOrdinal,
    fields.declaredDomainRoot,
  ];
}

function encodeCursor(fields) {
  return abi.encode([CURSOR_ABI], [cursorValues(fields)]);
}

function cursorCommitment(fields) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', CURSOR_ABI],
    [DOMAINS.cursor, PROFILE_VERSION, cursorValues(fields)],
  ));
}

function validateCursor(cursor, expectedFields) {
  const expected = encodeCursor(expectedFields);
  return { ok: cursor.toLowerCase() === expected.toLowerCase(), expected };
}

function queryPage(state, request) {
  const activation = state.queryProfileActivations.get(request.queryProfileId);
  if (!activation) {
    return {
      items: [],
      cursor: null,
      result: {
        kind: AXES.kind.SCOPE,
        presence: AXES.presence.UNKNOWN,
        coverage: AXES.coverage.PARTIAL,
        support: AXES.support.UNSUPPORTED,
        validation: AXES.validation.UNPROVEN,
        authority: AXES.authority.NOT_APPLICABLE,
        lifecycle: AXES.lifecycle.NOT_APPLICABLE,
        selection: AXES.selection.UNKNOWN,
        bytes: AXES.bytes.NOT_APPLICABLE,
        effect: AXES.effect.NOT_APPLICABLE,
        projectionIntegrity: AXES.projectionIntegrity.NOT_APPLICABLE,
      },
    };
  }
  const limit = Math.min(Number(request.limit), LIMITS.maxQueryPageMembers);
  const items = activation.postings.slice(Number(request.offset), Number(request.offset) + limit);
  const complete = activation.terminal;
  const presence = items.length > 0
    ? AXES.presence.FOUND
    : complete
      ? AXES.presence.ABSENT_PROVEN
      : AXES.presence.UNKNOWN;
  return {
    items,
    cursor: encodeCursor({
      realmId: activation.realmId ?? `0x${'00'.repeat(32)}`,
      realmRevisionId: activation.realmRevisionId ?? `0x${'00'.repeat(32)}`,
      queryProfileId: request.queryProfileId,
      generation: activation.generation,
      ordering: 1,
      activationHighWater: activation.activationHighWater,
      coveredThroughHighWater: activation.coveredThrough,
      executionCoordinate: activation.executionCoordinate ?? 0n,
      observerBlockHash: request.basisBlockHash,
      afterPostingOrdinal: Number(request.offset) + items.length,
      declaredDomainRoot: activation.declaredDomainRoot ?? `0x${'00'.repeat(32)}`,
    }),
    result: {
      kind: AXES.kind.SCOPE,
      presence,
      coverage: complete ? AXES.coverage.COMPLETE : AXES.coverage.PARTIAL,
      support: AXES.support.SUPPORTED,
      validation: AXES.validation.SEMANTICALLY_VALID,
      authority: AXES.authority.NOT_APPLICABLE,
      lifecycle: AXES.lifecycle.ADMITTED,
      selection: AXES.selection.NOT_APPLICABLE,
      bytes: AXES.bytes.NOT_APPLICABLE,
      effect: AXES.effect.NOT_APPLICABLE,
      projectionIntegrity: AXES.projectionIntegrity.MATCHED,
    },
  };
}

function completeQueryProfile(state, completion) {
  const activation = state.queryProfileActivations.get(completion.queryProfileId);
  if (!activation
    || activation.activationHighWater !== completion.expectedHighWater
    || BigInt(activation.postings.length) !== completion.expectedCount) {
    return { state, result: rejectedResult({ validation: AXES.validation.INVALID }) };
  }
  const next = structuredClone(state);
  const completed = next.queryProfileActivations.get(completion.queryProfileId);
  completed.terminal = true;
  completed.coveredThrough = completion.expectedHighWater;
  next.counters.coverageHighWater = completion.expectedHighWater;
  return { state: next, result: mutationResult(AXES.effect.COMMITTED) };
}

const ZERO_HASH = `0x${'00'.repeat(32)}`;
const REALM_BOOTSTRAP_ABI = 'tuple(bytes,bytes32,bytes32,bytes32,bytes32,uint8[])';
const REALM_REVISION_ABI = 'tuple(bytes32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,uint64)';
const PUBLICATION_ABI = 'tuple(bytes32,bytes32,bytes32,uint32,uint32,uint64,uint64,uint8,uint8,bytes32[])';

function publicationValue(publication) {
  return [
    principalId(publication.author),
    principalId(publication.sourceActor),
    publication.verifierProfileId,
    publication.sourceAuthorityEpoch ?? 0,
    publication.nonceLane ?? 0,
    publication.nonce,
    publication.expiryCoordinate,
    publication.visibility ?? 1,
    publication.suites ?? 1,
    publication.recordIds,
  ];
}

function splitKey(key) {
  return String(key).split(':');
}

function projectionEntry(collectionKind, key, value) {
  return { collectionKind, key, value };
}

function projectionEntries(state) {
  const entries = [];
  for (const [key, value] of state.realmBootstraps) {
    entries.push(projectionEntry(1, abi.encode(['bytes32'], [key]), abi.encode([REALM_BOOTSTRAP_ABI], [[
      value.originLineage,
      value.genesisCommitment,
      value.coreCommitment,
      value.initialRevisionCommitment,
      value.initialRevisionId,
      value.disclosedPowers,
    ]])));
  }
  for (const [key, value] of state.realmRevisions) {
    entries.push(projectionEntry(2, abi.encode(['bytes32', 'uint32'], [value.realmId, value.generation]), abi.encode([REALM_REVISION_ABI], [[
      value.realmId,
      value.generation,
      value.componentCommitment,
      value.executionProfileId,
      value.policyId,
      value.verifierProfileSetId,
      value.administrationCommitment,
      value.activationStart,
      value.activationEndExclusive,
    ]])));
  }
  for (const [key, value] of state.types) {
    // Kind 3 is the exact canonical outer Type envelope bytes. Projection does
    // not unwrap, normalize, or discard an unsupported future codec payload.
    entries.push(projectionEntry(3, abi.encode(['bytes32'], [key]), typeSchemaBytes(value)));
  }
  for (const [key, value] of state.records) {
    entries.push(projectionEntry(4, abi.encode(['bytes32'], [key]), abi.encode(['tuple(bytes32,bytes)'], [[value.typeId, value.body]])));
  }
  for (const [key, value] of state.publicationSets) {
    entries.push(projectionEntry(5, abi.encode(['bytes32'], [key]), abi.encode([PUBLICATION_ABI], [publicationValue(value)])));
  }
  for (const [key, value] of state.occurrences) {
    entries.push(projectionEntry(6, abi.encode(['bytes32'], [key]), abi.encode(['tuple(bytes32,uint16)'], [[value.publicationId, value.leafIndex]])));
  }
  for (const [key, value] of state.noncePlans) {
    const [realm, author, lane, nonce] = splitKey(key);
    entries.push(projectionEntry(8, abi.encode(['bytes32', 'bytes32', 'uint32', 'uint64'], [realm, author, lane, nonce]), abi.encode(['bytes32', 'bytes32'], [value.planId, value.operationId])));
  }
  for (const [key, value] of state.operations) {
    entries.push(projectionEntry(9, abi.encode(['bytes32'], [key]), abi.encode(
      ['tuple(bytes32,bytes32,uint8,uint64)'],
      [[value.planId, value.effectSetId ?? ZERO_HASH, 1, value.executionCoordinate ?? 0]],
    )));
  }
  for (const [key, value] of state.admissions) {
    entries.push(projectionEntry(10, abi.encode(['bytes32'], [key]), abi.encode(
      ['tuple(bytes32,bytes32,bytes32,bytes32,uint32,uint32,bytes32,bytes32,bool)'],
      [[
        value.occurrenceId,
        value.realmId,
        value.realmRevisionId ?? ZERO_HASH,
        value.operationId,
        value.ordinal,
        value.admissionHighWater ?? value.ordinal,
        value.policyId ?? ZERO_HASH,
        value.verifierProfileId ?? ZERO_HASH,
        true,
      ]],
    )));
  }
  for (const [key, value] of state.bindingHeads) {
    const [principal, position] = splitKey(key);
    entries.push(projectionEntry(13, abi.encode(['bytes32', 'bytes32'], [principal, position]), abi.encode(
      ['tuple(uint32,bool,bytes32,bytes32)'],
      [[value.revision, !value.tombstone, value.target ?? ZERO_HASH, value.operationId ?? ZERO_HASH]],
    )));
  }
  for (const [key, value] of state.bindingHistory) {
    const parts = splitKey(key);
    entries.push(projectionEntry(14, abi.encode(['bytes32', 'bytes32', 'uint32'], [parts[0], parts[1], parts[2]]), abi.encode(
      ['tuple(uint32,bool,bytes32,bytes32)'],
      [[value.revision, !value.tombstone, value.target ?? ZERO_HASH, value.operationId ?? ZERO_HASH]],
    )));
  }
  for (const [key, value] of state.bindingScopes) {
    const [principal, ordinal] = splitKey(key);
    entries.push(projectionEntry(15, abi.encode(['bytes32', 'uint32'], [principal, ordinal]), abi.encode(['bytes32'], [value])));
  }
  for (const [key, value] of state.withdrawals) {
    entries.push(projectionEntry(16, abi.encode(['bytes32', 'bytes32'], [value.issuer, value.occurrenceId]), abi.encode(['bytes32'], [value.operationId ?? ZERO_HASH])));
  }
  for (const [key, value] of state.queryProfileActivations) {
    entries.push(projectionEntry(18, abi.encode(['bytes32', 'uint32'], [key, value.generation]), abi.encode(
      ['tuple(bytes32,bytes32,bytes32,uint32,uint32,uint32,uint8,bytes32,bytes32,bytes32,bytes32,uint8,uint64,bool,uint32,bytes32)'],
      [[
        value.realmId ?? ZERO_HASH,
        key,
        value.realmRevisionId ?? ZERO_HASH,
        value.generation,
        value.activationHighWater,
        value.coveredThrough ?? 0,
        value.terminal ? 3 : 2,
        value.policyId ?? ZERO_HASH,
        value.backfillPayer ?? ZERO_HASH,
        value.backfillConsent ?? ZERO_HASH,
        value.futureWriteCostRule ?? ZERO_HASH,
        value.maximumFanout ?? 1,
        value.maximumCost ?? 0,
        Boolean(value.terminal),
        value.terminal ? value.postings.length : 0,
        value.terminalPostingsRoot ?? ZERO_HASH,
      ]],
    )));
  }
  entries.push(projectionEntry(23, abi.encode([], []), abi.encode(
    ['uint32', 'uint32', 'uint32', 'uint32'],
    [state.counters.admissionHighWater, state.counters.bindingRevision, state.counters.scopeCount, state.counters.coverageHighWater],
  )));
  entries.sort((a, b) => {
    if (a.collectionKind !== b.collectionKind) return a.collectionKind - b.collectionKind;
    const ah = keccak256(a.key);
    const bh = keccak256(b.key);
    if (ah !== bh) return ah.localeCompare(bh);
    return a.key.localeCompare(b.key);
  });
  return entries;
}

function projectionRoot(entries) {
  const payload = abi.encode(
    ['tuple(uint8,bytes,bytes)[]'],
    [entries.map((entry) => [entry.collectionKind, entry.key, entry.value])],
  );
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes', 'uint32'],
    [DOMAINS.projection, PROFILE_VERSION, payload, entries.length],
  ));
}

function projectState(state, suppliedEntries) {
  const expected = projectionEntries(state);
  const entries = suppliedEntries ?? expected;
  const root = projectionRoot(entries);
  let integrity = AXES.projectionIntegrity.MATCHED;
  if (entries.length < expected.length) integrity = AXES.projectionIntegrity.MISSING_REQUIRED_ITEM;
  else if (entries.length !== expected.length
    || entries.some((entry, index) => entry.collectionKind !== expected[index].collectionKind
      || entry.key !== expected[index].key
      || entry.value !== expected[index].value)) {
    integrity = AXES.projectionIntegrity.INTEGRITY_FAILED;
  }
  return {
    profileVersion: PROFILE_VERSION,
    finiteInventoryCount: BigInt(entries.length),
    projectionRoot: root,
    entries,
    integrity,
  };
}

module.exports = {
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
};
