'use strict';

// Disposable vertical composition control for the EXP-C0/v0 candidate.
// This is explicitly not a 62nd sealed trace, protocol conformance, or a
// production codec. It proves that the independently focused controls can
// carry one literal Files story without losing identity, basis, or raw bytes.

const crypto = require('node:crypto');
const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const {
  BASE_KINDS,
  COLLECTIONS,
  DESCRIPTOR_KINDS,
  bindingScopeKey,
  descriptorCommitment,
  destinationWitnessId,
  encodeEntry,
  exactBytesIndexKey,
  inspectProjection,
  positionKey,
  principalId,
  queryProfileId,
  recordBodyCommitment,
  recordReferenceBaseKey,
  signatureDigest,
  sourceWitnessId,
  terminalPostingsRoot,
  validateRawPointRead,
  validateTerminalQueryCompletion,
  verifierProfileId,
} = require('./query-projection-v0.cjs');
const {
  admissionPlanId,
  admissionPlanValue,
  effectSetId,
  effectTargetKey,
  operationId,
  validateAdmissionPlan,
} = require('./plan-v0.cjs');
const {
  PROBE_STATUS,
  resolutionPlanId,
  resolveFirstFoundAfterProvedAbsence,
  validateResolutionPlanV0,
} = require('./lens-v0.cjs');
const {
  ATTEMPT_OUTCOME,
  commitAcquisitionEvidencePacketV0,
  validateAcquisitionEvidencePacketV0,
} = require('./acquisition-evidence-v0.cjs');
const {
  ASSESSMENT,
  AVAILABILITY,
  PROOF_KIND,
  PROOF_SCOPE,
  commitSourceObservationEvidenceV0,
  encodeSourceObservationEvidenceV0,
  validateSourceObservationEvidenceV0,
} = require('./source-observation-evidence-v0.cjs');
const {
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  decodeByteReadRequestV0,
  decodeSourceDescriptorV0,
  encodeByteReadRequestV0,
  encodeSourceDescriptorV0,
  sourceIdentitiesV0,
  validateReadPreimagesV0,
} = require('./read-request-v0.cjs');
const {
  commitComponentDescriptorV0,
  commitOriginLineageV0,
  decodeComponentDescriptorV0,
  decodeOriginLineageV0,
  encodeComponentDescriptorV0,
  encodeOriginLineageV0,
  initialRevisionCommitmentV0,
  realmIdV0,
  realmRevisionIdV0,
  validateRealmLaunchV0,
} = require('./realm-launch-v0.cjs');
const {
  ENUMS,
  absentBytes32,
  commitBytes,
  commitResultV0,
  decodeBytesPayload,
  encodeBytesPayload,
  encodeCollectionEntrySubject,
  encodePointPayload,
  encodeResultV0,
  presentBytes32,
  validateResultV0,
} = require('./result-v0.cjs');
const { DOMAINS: PRINCIPAL_DOMAINS } = require('./principal-comparator-v0.cjs');
const {
  compileBodyTypesV0,
  decodeCanonicalBodyV0,
  encodeTypeSchemaV0,
  inspectTypeSchemaEnvelope,
  recordIdV0,
  typeSchemaIdV0,
  validateFiniteTypeRecordInventoryV0,
} = require('./type-interpreter-v0.cjs');
const { ids: transitionIds } = require('./model.cjs');

const ZERO = `0x${'00'.repeat(32)}`;
const MAX_U64 = (1n << 64n) - 1n;
const VERSION = 0;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;
const label = (value) => keccak256(toUtf8Bytes(value));
const address = (byte) => `0x${byte.repeat(20)}`;
const domain = (name) => keccak256(toUtf8Bytes(name));

const DOMAIN = Object.freeze({
  admission: domain('EFS2/EXP-C0/V0/ADMISSION'),
  binding: domain('EFS2/EXP-C0/V0/BINDING'),
  projection: domain('EFS2/EXP-C0/V0/PROJECTION'),
});

function exactType(semanticName, fields, intrinsicConstraints = [], referenceRoles = []) {
  const schema = {
    semanticCommitment: utf8Hex(semanticName),
    fields,
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints,
    referenceRoles,
  };
  // The generic compiler is the selected structural coordinate validator.
  compileBodyTypesV0(schema);
  const canonicalDescriptor = encodeTypeSchemaV0(schema);
  const inspected = inspectTypeSchemaEnvelope(canonicalDescriptor);
  return {
    schema,
    canonicalDescriptor,
    envelope: {
      codecVersion: inspected.codecVersion,
      payloadBytes: inspected.payloadBytes,
      rawTypeBytes: inspected.rawTypeBytes,
      typeSchemaId: inspected.typeSchemaId,
      support: inspected.support,
      validation: inspected.validation,
      semanticReconstruction: inspected.semanticReconstruction,
    },
    id: inspected.typeSchemaId,
  };
}

function rawTypeEnvelopeMap(types) {
  return Object.fromEntries(Object.entries(types).map(([name, type]) => [name, type.canonicalDescriptor]));
}

function exactRecord(type, values, decoded) {
  const canonicalBody = abi.encode(compileBodyTypesV0(type.schema), values);
  decodeCanonicalBodyV0(type.schema, canonicalBody);
  return {
    typeSchemaId: type.id,
    canonicalBody,
    id: recordIdV0(type.id, canonicalBody),
    decoded,
  };
}

function admissionId(occurrenceId, realmRevisionId, admittedOperationId, admissionOrdinal) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32', 'uint32'],
    [DOMAIN.admission, VERSION, occurrenceId, realmRevisionId, admittedOperationId, admissionOrdinal],
  ));
}

function bindingKey(principal, position) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32'],
    [DOMAIN.binding, VERSION, principal, position],
  ));
}

function projectionOrder(left, right) {
  if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
  const leftHash = keccak256(left.key);
  const rightHash = keccak256(right.key);
  if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
  return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
}

function projectionRoot(entries) {
  const payload = abi.encode(
    ['tuple(uint8,bytes,bytes)[]'],
    [entries.map((entry) => [entry.collectionKind, entry.key, entry.value])],
  );
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes', 'uint32'],
    [DOMAIN.projection, VERSION, payload, entries.length],
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

function exactSourceObservedBasis() {
  return {
    blockHash: label('HELLO_FILES/source-observed/block-42'),
    stateRoot: label('HELLO_FILES/source-observed/state-42'),
    sourceKind: ENUMS.observerSource.SOURCE_OBSERVED,
    finality: ENUMS.finality.UNPROVEN,
    freshnessCoordinate: 42n,
  };
}

function buildHelloFilesScenario() {
  const fileBytes = utf8Hex('hello efs v2\n');
  const fileDigest = keccak256(fileBytes);
  const publisherValue = [1, '0x', address('11')];
  const publisherObject = { authorityKind: 1, originLineage: '0x', account: address('11') };
  const publisher = principalId(publisherValue);
  if (publisher !== transitionIds.principal(publisherObject)) throw new Error('Principal control disagreement');
  const verifierValue = [1, 0, '0x00000000', 0, 0];
  const verifier = verifierProfileId(verifierValue);

  const genesisCommitment = label('HELLO_FILES/genesis');
  const originLineage = {
    chainNamespace: utf8Hex('eip155'),
    chainReference: utf8Hex('31337'),
    genesisCommitment,
  };
  const originLineageBytes = encodeOriginLineageV0(originLineage);
  const originLineageCommitment = commitOriginLineageV0(originLineage);
  const coreAddress = address('22');
  const runtimeCodeBytes = '0x60006000f3';
  const runtimeCodeCommitment = keccak256(runtimeCodeBytes);
  const dependencyCommitment = label('HELLO_FILES/dependencies');
  const routingCommitment = label('HELLO_FILES/routing');
  const disclosedPowers = [1, 2];

  const descriptorBytes = {
    executionProfile: utf8Hex('HELLO_FILES EVM execution profile v0'),
    policy: utf8Hex('HELLO_FILES admission policy v0'),
    administration: utf8Hex('HELLO_FILES administration v0'),
  };
  const descriptors = {
    executionProfile: {
      kind: DESCRIPTOR_KINDS.EXECUTION_PROFILE,
      bytes: descriptorBytes.executionProfile,
      commitment: descriptorCommitment(DESCRIPTOR_KINDS.EXECUTION_PROFILE, descriptorBytes.executionProfile),
    },
    policy: {
      kind: DESCRIPTOR_KINDS.POLICY,
      bytes: descriptorBytes.policy,
      commitment: descriptorCommitment(DESCRIPTOR_KINDS.POLICY, descriptorBytes.policy),
    },
    administration: {
      kind: DESCRIPTOR_KINDS.ADMINISTRATION,
      bytes: descriptorBytes.administration,
      commitment: descriptorCommitment(DESCRIPTOR_KINDS.ADMINISTRATION, descriptorBytes.administration),
    },
  };
  const componentDescriptor = {
    coreAddress,
    runtimeCodeCommitment,
    executionProfileCommitment: descriptors.executionProfile.commitment,
    policyCommitment: descriptors.policy.commitment,
    verifierProfileId: verifier,
    dependencyCommitment,
    routingCommitment,
    administrationCommitment: descriptors.administration.commitment,
    disclosedPowers,
  };
  descriptorBytes.component = encodeComponentDescriptorV0(componentDescriptor);
  descriptors.component = {
    kind: DESCRIPTOR_KINDS.COMPONENT,
    bytes: descriptorBytes.component,
    commitment: commitComponentDescriptorV0(componentDescriptor),
  };
  if (descriptors.component.commitment !== descriptorCommitment(
    DESCRIPTOR_KINDS.COMPONENT,
    descriptorBytes.component,
  )) throw new Error('Component descriptor commitment disagreement');

  // This derivation-only shape is retained solely as an independent control
  // against the earlier state-transition model. It is never exported as the
  // canonical RealmBootstrap preimage.
  const bootstrapDerivationInput = {
    originLineage: originLineageBytes,
    genesisCommitment,
    coreCommitment: descriptors.component.commitment,
    componentCommitment: descriptors.component.commitment,
    executionProfileId: descriptors.executionProfile.commitment,
    policyId: descriptors.policy.commitment,
    verifierProfileSetId: verifier,
    administrationCommitment: descriptors.administration.commitment,
    activationStart: 0n,
    activationEndExclusive: MAX_U64,
    disclosedPowers,
  };
  const initialRevisionCoordinates = {
    generation: 0,
    componentCommitment: descriptors.component.commitment,
    executionProfileId: descriptors.executionProfile.commitment,
    policyId: descriptors.policy.commitment,
    verifierProfileId: verifier,
    administrationCommitment: descriptors.administration.commitment,
    activationStart: 0n,
    activationEndExclusive: MAX_U64,
  };
  const initialRevisionCommitment = initialRevisionCommitmentV0(initialRevisionCoordinates);
  const realmBootstrapCoordinates = {
    originLineage: originLineageBytes,
    genesisCommitment,
    coreCommitment: descriptors.component.commitment,
    initialRevisionCommitment,
    disclosedPowers,
  };
  const realmId = realmIdV0(realmBootstrapCoordinates);
  const realmRevision = { realmId, ...initialRevisionCoordinates };
  const realmRevisionId = realmRevisionIdV0(realmRevision);
  const realmBootstrap = { ...realmBootstrapCoordinates, initialRevisionId: realmRevisionId };
  if (initialRevisionCommitment !== transitionIds.initialRevision(bootstrapDerivationInput)
      || realmId !== transitionIds.realm(bootstrapDerivationInput)
      || realmRevisionId !== transitionIds.realmRevision(realmId, 0, bootstrapDerivationInput)) {
    throw new Error('Realm preimage control disagreement');
  }
  const observerBasis = exactSourceObservedBasis();

  const types = {
    directory: exactType(
      'EFS Files DirectoryObjectGenesisC0/1',
      [
        { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 32 },
        { fieldKey: 2, scalarKind: 3, required: true, maxLengthOrCount: 64 },
        { fieldKey: 3, scalarKind: 3, required: true, maxLengthOrCount: 128 },
      ],
      [{ fieldKey: 1, rule: 2 }, { fieldKey: 2, rule: 2 }, { fieldKey: 3, rule: 2 }],
    ),
    file: exactType(
      'EFS Files FileObjectGenesisC0/1',
      [
        { fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 32 },
        { fieldKey: 2, scalarKind: 3, required: true, maxLengthOrCount: 64 },
        { fieldKey: 3, scalarKind: 3, required: true, maxLengthOrCount: 128 },
      ],
      [{ fieldKey: 1, rule: 2 }, { fieldKey: 2, rule: 2 }, { fieldKey: 3, rule: 2 }],
    ),
  };
  types.directoryEntry = exactType(
      'EFS Files DirectoryFileEntryC0/1',
      [
        { fieldKey: 1, scalarKind: 4, required: true, maxLengthOrCount: 0 },
        { fieldKey: 2, scalarKind: 3, required: true, maxLengthOrCount: 255 },
        { fieldKey: 3, scalarKind: 4, required: true, maxLengthOrCount: 0 },
        { fieldKey: 4, scalarKind: 2, required: true, maxLengthOrCount: 0 },
      ],
      [{ fieldKey: 2, rule: 2 }],
      [
        { fieldKey: 1, targetKind: 1, targetTypeSchemaId: types.directory.id },
        { fieldKey: 3, targetKind: 1, targetTypeSchemaId: types.file.id },
      ],
    );
  types.fileRevision = exactType(
      'EFS Files FileRevisionC0/1',
      [
        { fieldKey: 1, scalarKind: 4, required: true, maxLengthOrCount: 0 },
        { fieldKey: 2, scalarKind: 3, required: true, maxLengthOrCount: 64 },
        { fieldKey: 3, scalarKind: 1, required: true, maxLengthOrCount: 0 },
        { fieldKey: 4, scalarKind: 3, required: true, maxLengthOrCount: 128 },
      ],
      [{ fieldKey: 2, rule: 2 }, { fieldKey: 4, rule: 2 }],
      [{ fieldKey: 1, targetKind: 1, targetTypeSchemaId: types.file.id }],
    );

  const directorySalt = utf8Hex('root-directory-1');
  const fileSalt = utf8Hex('hello-file-1');
  const directoryCharter = utf8Hex('portable-directory-object');
  const fileCharter = utf8Hex('portable-file-object');
  const directory = exactRecord(
    types.directory,
    [publisher, directorySalt, directoryCharter],
    { creatorPrincipalId: publisher, salt: directorySalt, charter: directoryCharter },
  );
  const file = exactRecord(
    types.file,
    [publisher, fileSalt, fileCharter],
    { creatorPrincipalId: publisher, salt: fileSalt, charter: fileCharter },
  );
  const directoryEntry = exactRecord(
    types.directoryEntry,
    [directory.id, utf8Hex('hello.txt'), file.id, false],
    { parent: directory.id, name: utf8Hex('hello.txt'), child: file.id, childIsDirectory: false },
  );
  const fileRevision = exactRecord(
    types.fileRevision,
    [file.id, fileDigest, BigInt((fileBytes.length - 2) / 2), utf8Hex('text/plain')],
    {
      file: file.id,
      contentDigest: fileDigest,
      byteLength: BigInt((fileBytes.length - 2) / 2),
      contentType: utf8Hex('text/plain'),
    },
  );
  const records = { directory, file, directoryEntry, fileRevision };
  const otherPublisherValue = [1, '0x', address('33')];
  const otherPublisher = principalId(otherPublisherValue);
  const sameNameOtherCreatorFile = exactRecord(
    types.file,
    [otherPublisher, fileSalt, fileCharter],
    { creatorPrincipalId: otherPublisher, salt: fileSalt, charter: fileCharter },
  );
  const sameCreatorSaltRetryFile = exactRecord(
    types.file,
    [publisher, fileSalt, fileCharter],
    { creatorPrincipalId: publisher, salt: fileSalt, charter: fileCharter },
  );
  const renamedEntry = exactRecord(
    types.directoryEntry,
    [directory.id, utf8Hex('renamed.txt'), file.id, false],
    { parent: directory.id, name: utf8Hex('renamed.txt'), child: file.id, childIsDirectory: false },
  );
  const objectGenesisControls = {
    sameNameOtherCreatorFileId: sameNameOtherCreatorFile.id,
    sameCreatorSaltRetryFileId: sameCreatorSaltRetryFile.id,
    crossRealmCopyFileId: recordIdV0(types.file.id, file.canonicalBody),
    renamedEntryRecordId: renamedEntry.id,
    renamedEntryChildId: renamedEntry.decoded.child,
  };

  const publicationValue = [
    publisher,
    publisher,
    verifier,
    0,
    0,
    1n,
    MAX_U64,
    1,
    1,
    [directoryEntry.id, fileRevision.id],
  ];
  const publicationInput = {
    author: publisherObject,
    sourceActor: publisherObject,
    verifierProfileId: verifier,
    sourceAuthorityEpoch: 0,
    nonceLane: 0,
    nonce: 1n,
    expiryCoordinate: MAX_U64,
    visibility: 1,
    suites: 1,
    recordIds: [directoryEntry.id, fileRevision.id],
  };
  const publicationId = transitionIds.publication(publicationInput);
  const occurrenceIds = [
    transitionIds.occurrence(publicationId, 0),
    transitionIds.occurrence(publicationId, 1),
  ];

  const purposeName = label('EFS Files/PURPOSE_FILES_NAME_SLOT_V1');
  const purposeRevision = label('EFS Files/PURPOSE_FILES_REVISION_HEAD_V1');
  const nameRole = keccak256(abi.encode(['bytes'], [utf8Hex('hello.txt')]));
  const revisionRole = label('EFS Files/FILE_REVISION_ROLE_V1');
  const namePosition = positionKey({ purpose: purposeName, subject: directory.id, fieldRole: nameRole });
  const revisionPosition = positionKey({ purpose: purposeRevision, subject: file.id, fieldRole: revisionRole });
  const nameScopeKey = bindingScopeKey({ principalId: publisher, purpose: purposeName, subject: directory.id });
  const revisionScopeKey = bindingScopeKey({ principalId: publisher, purpose: purposeRevision, subject: file.id });

  const zeroEffectFields = {
    occurrenceId: ZERO,
    queryProfileId: ZERO,
    generation: 0,
    coverageHighWater: 0,
    terminalCount: 0,
    terminalPostingsRoot: ZERO,
  };
  const effects = [
    {
      kind: 1,
      principalId: publisher,
      positionKey: namePosition,
      recordId: directoryEntry.id,
      expectedRevision: 0,
      ...zeroEffectFields,
    },
    {
      kind: 1,
      principalId: publisher,
      positionKey: revisionPosition,
      recordId: fileRevision.id,
      expectedRevision: 0,
      ...zeroEffectFields,
    },
  ].sort((left, right) => effectTargetKey(left).localeCompare(effectTargetKey(right)));

  const plan = {
    occurrenceIds,
    realmId,
    realmRevisionId,
    coreCommitment: descriptors.component.commitment,
    semanticAuthor: publisher,
    actor: publisher,
    verifierProfileId: verifier,
    nonceLane: 0,
    nonce: 1n,
    expiryCoordinate: MAX_U64,
    executorCommitment: label('HELLO_FILES/executor'),
    dependencyCommitment,
    payer: publisher,
    maximumCost: 1_000_000n,
    effects,
  };
  validateAdmissionPlan(plan);
  const planId = admissionPlanId(plan);
  const effectsId = effectSetId(effects);
  const admittedOperationId = operationId(planId, effectsId);
  const admissionIds = [
    admissionId(occurrenceIds[0], realmRevisionId, admittedOperationId, 1),
    admissionId(occurrenceIds[1], realmRevisionId, admittedOperationId, 2),
  ];

  const sourceWitnessValue = [
    publicationId,
    publisher,
    verifier,
    signatureDigest(publicationId, publisher, verifier),
    utf8Hex('source signature'),
  ];
  const destinationWitnessValue = [
    planId,
    publisher,
    signatureDigest(planId, publisher, verifier),
    utf8Hex('destination signature'),
  ];

  const nameResolutionPlan = {
    purpose: purposeName,
    subject: directory.id,
    principals: [publisher],
    combiner: 1,
    maximumProbes: 1,
  };
  const revisionResolutionPlan = {
    purpose: purposeRevision,
    subject: file.id,
    principals: [publisher],
    combiner: 1,
    maximumProbes: 1,
  };
  const nameResolutionPlanId = resolutionPlanId(nameResolutionPlan);
  const revisionResolutionPlanId = resolutionPlanId(revisionResolutionPlan);
  const nameRequiredPointInput = {
    resolutionPlanId: nameResolutionPlanId,
    fieldRole: nameRole,
    positionKey: namePosition,
    principalIds: [publisher],
  };
  const revisionRequiredPointInput = {
    resolutionPlanId: revisionResolutionPlanId,
    fieldRole: revisionRole,
    positionKey: revisionPosition,
    principalIds: [publisher],
  };
  const basisCommitment = keccak256(abi.encode(
    ['bytes32', 'bytes32', 'uint8', 'uint8', 'uint64'],
    [
      observerBasis.blockHash,
      observerBasis.stateRoot,
      observerBasis.sourceKind,
      observerBasis.finality,
      observerBasis.freshnessCoordinate,
    ],
  ));
  const nameResolution = resolveFirstFoundAfterProvedAbsence(
    nameResolutionPlan,
    nameRole,
    basisCommitment,
    () => ({
      status: PROBE_STATUS.FOUND,
      basisCommitment,
      recordId: directoryEntry.id,
    }),
  );
  const revisionResolution = resolveFirstFoundAfterProvedAbsence(
    revisionResolutionPlan,
    revisionRole,
    basisCommitment,
    () => ({
      status: PROBE_STATUS.FOUND,
      basisCommitment,
      recordId: fileRevision.id,
    }),
  );

  const queryValue = [types.directoryEntry.id, [[1, 2, 1]]];
  const queryId = queryProfileId(queryValue);
  const indexKey = exactBytesIndexKey(types.directoryEntry.id, 2, utf8Hex('hello.txt'));
  const postings = [{ indexKey, postingOrdinal: 0, recordId: directoryEntry.id }];
  const postingsRoot = terminalPostingsRoot(postings);
  const declaredDomainRoot = label('HELLO_FILES/query/domain');
  const cursor = {
    realmId,
    realmRevisionId,
    queryProfileId: queryId,
    generation: 1,
    ordering: 1,
    activationHighWater: 2,
    coveredThroughHighWater: 2,
    executionCoordinate: observerBasis.freshnessCoordinate,
    observerBlockHash: observerBasis.blockHash,
    afterPostingOrdinal: 1,
    declaredDomainRoot,
  };
  const queryCompletion = {
    realmId,
    realmRevisionId,
    queryProfileId: queryId,
    generation: 1,
    ordering: 1,
    activationHighWater: 2,
    coveredThroughHighWater: 2,
    terminalCount: 1,
    terminalPostingsRoot: postingsRoot,
    declaredDomainRoot,
    observerBasis,
    requestedLimit: 32,
    postings,
    cursor,
  };
  const parentTypedBacklink = {
    baseKind: BASE_KINDS.RECORD_REFERENCE,
    typeSchemaId: types.directoryEntry.id,
    fieldKey: 1,
    targetRecordId: directory.id,
    baseKey: recordReferenceBaseKey({
      typeSchemaId: types.directoryEntry.id,
      fieldKey: 1,
      targetRecordId: directory.id,
    }),
    postingRecordId: directoryEntry.id,
  };
  const typedBacklink = {
    baseKind: BASE_KINDS.RECORD_REFERENCE,
    typeSchemaId: types.directoryEntry.id,
    fieldKey: 3,
    targetRecordId: file.id,
    baseKey: recordReferenceBaseKey({
      typeSchemaId: types.directoryEntry.id,
      fieldKey: 3,
      targetRecordId: file.id,
    }),
    postingRecordId: directoryEntry.id,
  };

  const projectionEntries = [];
  const push = (kind, key, value) => projectionEntries.push(encodeEntry(kind, key, value));
  push(1, realmId, [
    realmBootstrap.originLineage,
    realmBootstrap.genesisCommitment,
    realmBootstrap.coreCommitment,
    realmBootstrap.initialRevisionCommitment,
    realmBootstrap.initialRevisionId,
    realmBootstrap.disclosedPowers,
  ]);
  push(2, [realmId, 0], [
    realmId,
    0,
    descriptors.component.commitment,
    descriptors.executionProfile.commitment,
    descriptors.policy.commitment,
    verifier,
    descriptors.administration.commitment,
    0n,
    MAX_U64,
  ]);
  for (const type of Object.values(types)) push(3, type.id, type.canonicalDescriptor);
  for (const record of Object.values(records)) push(4, record.id, [record.typeSchemaId, record.canonicalBody]);
  push(5, publicationId, publicationValue);
  push(6, occurrenceIds[0], [publicationId, 0]);
  push(6, occurrenceIds[1], [publicationId, 1]);
  push(7, sourceWitnessId(sourceWitnessValue), sourceWitnessValue);
  push(8, [realmId, publisher, 0, 1n], [planId, admittedOperationId]);
  push(9, admittedOperationId, [planId, effectsId, 1, 42n]);
  push(10, admissionIds[0], [occurrenceIds[0], realmId, realmRevisionId, admittedOperationId, 1, 1, descriptors.policy.commitment, verifier, true]);
  push(10, admissionIds[1], [occurrenceIds[1], realmId, realmRevisionId, admittedOperationId, 2, 2, descriptors.policy.commitment, verifier, true]);
  for (const [index, admittedId] of admissionIds.entries()) {
    push(11, admittedId, [
      admittedId,
      destinationWitnessValue[2],
      PRINCIPAL_DOMAINS.sign,
      publisherValue[2],
      destinationWitnessValue[3],
      verifier,
      ZERO,
      ZERO,
      42n,
      100_000,
      '0x',
      1,
    ]);
  }
  push(12, [BASE_KINDS.TYPE, types.directoryEntry.id, 1], [directoryEntry.id, admissionIds[0]]);
  push(12, [BASE_KINDS.TYPE, types.fileRevision.id, 2], [fileRevision.id, admissionIds[1]]);
  push(12, [BASE_KINDS.RECORD_REFERENCE, recordReferenceBaseKey({
    typeSchemaId: types.directoryEntry.id,
    fieldKey: 1,
    targetRecordId: directory.id,
  }), 1], [directoryEntry.id, admissionIds[0]]);
  push(12, [typedBacklink.baseKind, typedBacklink.baseKey, 1], [directoryEntry.id, admissionIds[0]]);
  push(12, [BASE_KINDS.RECORD_REFERENCE, recordReferenceBaseKey({
    typeSchemaId: types.fileRevision.id,
    fieldKey: 1,
    targetRecordId: file.id,
  }), 2], [fileRevision.id, admissionIds[1]]);
  push(12, [BASE_KINDS.AUTHOR, publisher, 1], [directoryEntry.id, admissionIds[0]]);
  push(12, [BASE_KINDS.AUTHOR, publisher, 2], [fileRevision.id, admissionIds[1]]);
  push(12, [BASE_KINDS.DIGEST, recordBodyCommitment(directoryEntry.canonicalBody), 1], [directoryEntry.id, admissionIds[0]]);
  push(12, [BASE_KINDS.DIGEST, recordBodyCommitment(fileRevision.canonicalBody), 2], [fileRevision.id, admissionIds[1]]);
  push(13, [publisher, namePosition], [1, false, directoryEntry.id, admittedOperationId]);
  push(13, [publisher, revisionPosition], [1, false, fileRevision.id, admittedOperationId]);
  push(14, [publisher, namePosition, 1], [1, false, directoryEntry.id, admittedOperationId]);
  push(14, [publisher, revisionPosition, 1], [1, false, fileRevision.id, admittedOperationId]);
  push(15, [publisher, purposeName, directory.id, 0], nameRole);
  push(15, [publisher, purposeRevision, file.id, 0], revisionRole);
  push(17, queryId, queryValue);
  push(18, [queryId, 1], [
    realmId,
    queryId,
    realmRevisionId,
    1,
    2,
    0,
    2,
    3,
    descriptors.policy.commitment,
    publisher,
    label('HELLO_FILES/backfill-consent'),
    label('HELLO_FILES/future-write-cost'),
    1,
    1_000n,
    [true, 1],
    [true, postingsRoot],
  ]);
  push(19, [queryId, 1, indexKey, 0], directoryEntry.id);
  push(20, nameResolutionPlanId, [purposeName, directory.id, [publisher], 1, 1]);
  push(20, revisionResolutionPlanId, [purposeRevision, file.id, [publisher], 1, 1]);
  push(21, [nameResolutionPlanId, namePosition], [
    nameResolutionPlanId,
    nameRole,
    namePosition,
    [publisher],
  ]);
  push(21, [revisionResolutionPlanId, revisionPosition], [
    revisionResolutionPlanId,
    revisionRole,
    revisionPosition,
    [publisher],
  ]);
  push(22, admittedOperationId, [admittedOperationId, publisher, label('HELLO_FILES/cost-rule'), 1_000_000n, 1n]);
  push(23, [1, realmId, ZERO, 0], 2);
  push(23, [2, realmId, bindingKey(publisher, namePosition), 0], 1);
  push(23, [2, realmId, bindingKey(publisher, revisionPosition), 0], 1);
  push(23, [3, realmId, nameScopeKey, 0], 1);
  push(23, [3, realmId, revisionScopeKey, 0], 1);
  push(23, [4, realmId, queryId, 1], 2);
  push(24, publisher, publisherValue);
  push(25, verifier, verifierValue);
  push(26, planId, admissionPlanValue(plan));
  push(27, destinationWitnessId(destinationWitnessValue), destinationWitnessValue);
  for (const descriptor of Object.values(descriptors)) {
    push(28, [descriptor.kind, descriptor.commitment], descriptor.bytes);
  }
  projectionEntries.sort(projectionOrder);
  const populatedKinds = [...new Set(projectionEntries.map((entry) => entry.collectionKind))].sort((a, b) => a - b);
  const declaredEmptyCollectionKinds = [16];

  const rawRecordEntry = projectionEntries.find((entry) => (
    entry.collectionKind === 4
    && abi.decode(['bytes32'], entry.key)[0].toLowerCase() === fileRevision.id.toLowerCase()
  ));
  const pointResult = {
    kind: ENUMS.kind.POINT,
    subjectKind: ENUMS.subjectKind.COLLECTION_ENTRY,
    subject: encodeCollectionEntrySubject(4, rawRecordEntry.key),
    realmId: presentBytes32(realmId),
    realmRevisionId: presentBytes32(realmRevisionId),
    executionCoordinate: { present: true, value: 42n },
    admissionHighWater: { present: true, value: 2 },
    observerBasis: { present: true, value: observerBasis },
    profileCommitments: profiles({
      typeSchemaId: presentBytes32(types.fileRevision.id),
      verifierProfileId: presentBytes32(verifier),
      codeCommitment: presentBytes32(descriptors.component.commitment),
    }),
    facts: {
      presence: ENUMS.presence.FOUND,
      coverage: ENUMS.coverage.COMPLETE,
      support: ENUMS.support.SUPPORTED,
      validation: ENUMS.validation.STRUCTURALLY_VALID,
      authority: ENUMS.authority.UNPROVEN,
      lifecycle: ENUMS.lifecycle.ADMITTED,
      selection: ENUMS.selection.NOT_APPLICABLE,
      bytes: ENUMS.bytes.NOT_APPLICABLE,
      effect: ENUMS.effect.NOT_APPLICABLE,
    },
    payload: {
      payloadKind: ENUMS.payloadKind.POINT,
      data: encodePointPayload({
        key: rawRecordEntry.key,
        valuePresent: true,
        value: rawRecordEntry.value,
        proofOfLocalAbsence: false,
      }),
    },
    rawRetention: {
      present: true,
      canonicalBytes: rawRecordEntry.value,
      commitment: commitBytes(rawRecordEntry.value),
    },
    projectionIntegrity: ENUMS.projectionIntegrity.MATCHED,
  };

  const bytesResultValue = {
    kind: ENUMS.kind.BYTES,
    subjectKind: ENUMS.subjectKind.RECORD,
    subject: abi.encode(['bytes32'], [fileRevision.id]),
    realmId: presentBytes32(realmId),
    realmRevisionId: presentBytes32(realmRevisionId),
    executionCoordinate: { present: true, value: 42n },
    admissionHighWater: { present: true, value: 2 },
    observerBasis: { present: true, value: observerBasis },
    profileCommitments: profiles({
      typeSchemaId: presentBytes32(types.fileRevision.id),
      verifierProfileId: presentBytes32(verifier),
      codeCommitment: presentBytes32(descriptors.component.commitment),
      resolutionPlanId: presentBytes32(revisionResolutionPlanId),
    }),
    facts: {
      presence: ENUMS.presence.FOUND,
      coverage: ENUMS.coverage.COMPLETE,
      support: ENUMS.support.SUPPORTED,
      validation: ENUMS.validation.SEMANTICALLY_VALID,
      authority: ENUMS.authority.UNPROVEN,
      lifecycle: ENUMS.lifecycle.ADMITTED,
      selection: ENUMS.selection.NOT_APPLICABLE,
      bytes: ENUMS.bytes.VERIFIED_AVAILABLE,
      effect: ENUMS.effect.NOT_APPLICABLE,
    },
    payload: {
      payloadKind: ENUMS.payloadKind.BYTES,
      data: encodeBytesPayload({
        recordId: fileRevision.id,
        expectedDigest: fileDigest,
        bytesPresent: true,
        availableBytes: fileBytes,
      }),
    },
    rawRetention: { present: true, canonicalBytes: fileBytes, commitment: commitBytes(fileBytes) },
    projectionIntegrity: ENUMS.projectionIntegrity.MATCHED,
  };
  const encodedResult = encodeResultV0(bytesResultValue);
  const resultCommitment = commitResultV0(bytesResultValue);
  const requestedBlockReference = utf8Hex('0x2a');
  const sourceDescriptor = {
    chainNamespace: originLineage.chainNamespace,
    chainReference: originLineage.chainReference,
    originLineageCommitment,
    componentDescriptorCommitment: descriptors.component.commitment,
    realmId,
    realmRevisionId,
    endpoints: [
      {
        transportKind: 1,
        locator: utf8Hex('fixture://public-rpc/primary'),
        interfaceCommitment: label('HELLO_FILES/rpc-interface-v0'),
        eligible: true,
      },
      {
        transportKind: 1,
        locator: utf8Hex('fixture://public-rpc/fallback'),
        interfaceCommitment: label('HELLO_FILES/rpc-interface-v0'),
        eligible: true,
      },
    ],
    selectionPolicyCommitment: label('HELLO_FILES/source-selection/ordered-fallback'),
  };
  const sourceDescriptorBytes = encodeSourceDescriptorV0(sourceDescriptor);
  const sourceDescriptorCommitment = commitSourceDescriptorV0(sourceDescriptor);
  const readRequest = {
    realmId,
    realmRevisionId,
    recordId: fileRevision.id,
    digestAlgorithm: 1,
    expectedDigest: fileDigest,
    start: 0,
    length: 13,
    sourceDescriptorCommitment,
    requestedBlockReference,
    requestedSourceKind: ENUMS.observerSource.SOURCE_OBSERVED,
    requestedFinality: ENUMS.finality.UNPROVEN,
  };
  const requestBytes = encodeByteReadRequestV0(readRequest);
  const requestCommitment = commitByteReadRequestV0(readRequest);
  const sourceIdentities = sourceIdentitiesV0(sourceDescriptor);
  const acquisitionPacket = {
    requestCommitment,
    requestBytes,
    sourceDescriptorCommitment,
    sourceDescriptorBytes,
    resultV0Commitment: resultCommitment,
    attempts: [
      {
        ordinal: 0,
        locatorCommitment: sourceIdentities[0].locatorCommitment,
        sourceCommitment: sourceIdentities[0].sourceCommitment,
        eligible: true,
        expectedDigest: fileDigest,
        observedDigest: keccak256(utf8Hex('corrupt payload')),
        requestedStart: 0,
        requestedLength: 13,
        observedLength: 13,
        outcome: ATTEMPT_OUTCOME.INTEGRITY_FAILED,
        observerBasis: structuredClone(observerBasis),
        evidencePointer: utf8Hex('primary corrupt response'),
      },
      {
        ordinal: 1,
        locatorCommitment: sourceIdentities[1].locatorCommitment,
        sourceCommitment: sourceIdentities[1].sourceCommitment,
        eligible: true,
        expectedDigest: fileDigest,
        observedDigest: fileDigest,
        requestedStart: 0,
        requestedLength: 13,
        observedLength: 13,
        outcome: ATTEMPT_OUTCOME.VERIFIED,
        observerBasis: structuredClone(observerBasis),
        evidencePointer: utf8Hex('fallback verified response'),
      },
    ],
  };
  const acquisitionFinal = {
    requestCommitment,
    resultV0Commitment: resultCommitment,
    presence: 'FOUND',
    bytes: 'VERIFIED_AVAILABLE',
    expectedDigest: fileDigest,
    requestedStart: 0,
    requestedLength: 13,
    observerBasis: structuredClone(observerBasis),
  };
  const acquisitionCommitment = commitAcquisitionEvidencePacketV0(acquisitionPacket);
  const sourceObservationEvidence = {
    resultV0Commitment: resultCommitment,
    requestCommitment,
    requestBytes,
    sourceDescriptorCommitment,
    sourceDescriptorBytes,
    requestedBlockReference,
    observedBlockNumber: observerBasis.freshnessCoordinate,
    observedBlockHash: observerBasis.blockHash,
    observedStateRoot: observerBasis.stateRoot,
    canonicalityAssessment: ASSESSMENT.SOURCE_REPORTED,
    proofKind: PROOF_KIND.NONE,
    proofScope: PROOF_SCOPE.NONE,
    proofScopeCommitment: { present: false, value: ZERO },
    causalAvailability: AVAILABILITY.AVAILABLE,
    evidencePointer: utf8Hex('public RPC response transcript'),
  };
  const encodedSourceObservation = encodeSourceObservationEvidenceV0(sourceObservationEvidence);
  const sourceObservationCommitment = commitSourceObservationEvidenceV0(sourceObservationEvidence);

  const launch = {
    originLineageBytes,
    originLineageCommitment,
    componentDescriptorBytes: descriptorBytes.component,
    componentDescriptorCommitment: descriptors.component.commitment,
    chainNamespace: originLineage.chainNamespace,
    chainReference: originLineage.chainReference,
    genesisCommitment,
    coreAddress,
    runtimeCodeBytes,
    coreRuntimeCodeCommitment: runtimeCodeCommitment,
    dependencyCommitment,
    routingCommitment,
    administrationCommitment: descriptors.administration.commitment,
    disclosedPowers,
    realmId,
    realmRevisionId,
    readMode: 'SOURCE_OBSERVED',
    sourceDescriptorBytes,
    sourceDescriptorCommitment,
    requestBytes,
    requestCommitment,
    requestedBasis: observerBasis,
  };
  const adapterInspector = {
    observerBasis: structuredClone(observerBasis),
    authority: 'UNPROVEN',
    coverage: 'COMPLETE',
    validation: 'SEMANTICALLY_VALID',
    effect: 'NOT_APPLICABLE',
    projectionIntegrity: 'MATCHED',
    acquisitionAttempts: structuredClone(acquisitionPacket.attempts),
    canonicalFileBytes: fileBytes,
    rawResultV0: encodedResult,
    rawTypeEnvelopes: rawTypeEnvelopeMap(types),
  };

  return {
    profile: 'EFS2/EXP-C0/V0/HELLO_FILES_V0',
    ids: { unrelated: label('HELLO_FILES/unrelated') },
    launch,
    realm: {
      id: realmId,
      revisionId: realmRevisionId,
      initialRevisionCommitment,
      originLineage,
      componentDescriptor,
      bootstrap: realmBootstrap,
      revision: realmRevision,
      descriptors,
      principal: { id: publisher, value: publisherValue },
      verifierProfile: { id: verifier, value: verifierValue },
    },
    portable: { types, records, fileBytes, fileDigest, objectGenesisControls },
    publication: {
      id: publicationId,
      value: publicationValue,
      leaves: [directoryEntry.id, fileRevision.id],
      occurrenceIds,
      sourceWitness: { id: sourceWitnessId(sourceWitnessValue), value: sourceWitnessValue },
    },
    admission: {
      plan,
      planId,
      effectSetId: effectsId,
      operationId: admittedOperationId,
      admissionIds,
      destinationWitness: {
        id: destinationWitnessId(destinationWitnessValue),
        value: destinationWitnessValue,
      },
    },
    bindings: {
      name: {
        purpose: purposeName,
        subject: directory.id,
        fieldRole: nameRole,
        positionKey: namePosition,
        targetRecordId: directoryEntry.id,
        scope: { key: nameScopeKey, subject: directory.id, ordinal: 0, fieldRole: nameRole },
      },
      revision: {
        purpose: purposeRevision,
        subject: file.id,
        fieldRole: revisionRole,
        positionKey: revisionPosition,
        targetRecordId: fileRevision.id,
        scope: { key: revisionScopeKey, subject: file.id, ordinal: 0, fieldRole: revisionRole },
      },
    },
    query: {
      profileId: queryId,
      value: queryValue,
      postings,
      typedBacklinks: [parentTypedBacklink, typedBacklink],
      typedBacklink,
      completion: queryCompletion,
    },
    lens: {
      basisCommitment,
      namePlan: nameResolutionPlan,
      namePlanId: nameResolutionPlanId,
      nameRequiredPointInput,
      nameResolution,
      revisionPlan: revisionResolutionPlan,
      revisionPlanId: revisionResolutionPlanId,
      revisionRequiredPointInput,
      revisionResolution,
    },
    projection: {
      entries: projectionEntries,
      root: projectionRoot(projectionEntries),
      populatedKinds,
      declaredEmptyCollectionKinds,
      pointRead: { entry: rawRecordEntry, resultV0: pointResult },
    },
    result: {
      value: bytesResultValue,
      encoded: encodedResult,
      commitment: resultCommitment,
      observerBasis: structuredClone(observerBasis),
    },
    acquisition: {
      packet: acquisitionPacket,
      final: acquisitionFinal,
      commitment: acquisitionCommitment,
    },
    sourceObservation: {
      evidence: sourceObservationEvidence,
      encoded: encodedSourceObservation,
      commitment: sourceObservationCommitment,
    },
    adapter: {
      sdk: {
        rawResultV0: encodedResult,
        rawResultCommitment: resultCommitment,
        canonicalFileBytes: fileBytes,
        acquisitionEvidenceCommitment: acquisitionCommitment,
        observerBasis: structuredClone(observerBasis),
        rawTypeEnvelopes: rawTypeEnvelopeMap(types),
        queryCursor: structuredClone(cursor),
        filesFacade: {
          parentDirectoryRecordId: directory.id,
          nameBytes: utf8Hex('hello.txt'),
          fileRecordId: file.id,
          revisionRecordId: fileRevision.id,
          byteLength: 13,
          contentTypeBytes: utf8Hex('text/plain'),
        },
      },
      explorer: {
        directGuest: true,
        requiresWallet: false,
        requiresAccount: false,
        requiresCommons: false,
        requiresHostedIndexer: false,
        requiresOsBoot: false,
        listRow: {
          nameBytes: utf8Hex('hello.txt'),
          fileRecordId: file.id,
          revisionRecordId: fileRevision.id,
        },
        inspector: adapterInspector,
      },
    },
  };
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function validateHelloFilesScenario(value) {
  const errors = [];
  const expected = buildHelloFilesScenario();
  const capture = (labelText, action) => {
    try {
      action();
    } catch (error) {
      errors.push(`${labelText}: ${error.message}`);
    }
  };
  const requireSame = (actual, wanted, message) => {
    if (!same(actual, wanted)) errors.push(message);
  };

  requireSame(value.launch, expected.launch, 'launch configuration or SOURCE_OBSERVED observer basis mismatch');
  if (value.launch?.readMode !== 'SOURCE_OBSERVED'
      || value.launch?.requestedBasis?.sourceKind !== ENUMS.observerSource.SOURCE_OBSERVED
      || value.launch?.requestedBasis?.finality !== ENUMS.finality.UNPROVEN) {
    errors.push('launch observer basis must be SOURCE_OBSERVED with unproven finality');
  }
  errors.push(...validateRealmLaunchV0({
    originLineage: value.realm?.originLineage,
    component: value.realm?.componentDescriptor,
    bootstrap: value.realm?.bootstrap,
    revision: value.realm?.revision,
    launch: value.launch,
    admissionPlan: value.admission?.plan,
  }).map((error) => `Realm launch: ${error}`));
  errors.push(...validateReadPreimagesV0({
    requestBytes: value.launch?.requestBytes,
    sourceDescriptorBytes: value.launch?.sourceDescriptorBytes,
  }).map((error) => `read launch: ${error}`));
  capture('launch preimage chain', () => {
    const origin = decodeOriginLineageV0(value.launch.originLineageBytes);
    const component = decodeComponentDescriptorV0(value.launch.componentDescriptorBytes);
    const source = decodeSourceDescriptorV0(value.launch.sourceDescriptorBytes);
    const request = decodeByteReadRequestV0(value.launch.requestBytes);
    if (commitOriginLineageV0(origin) !== value.launch.originLineageCommitment) {
      errors.push('launch OriginLineageV0 commitment mismatch');
    }
    if (commitComponentDescriptorV0(component) !== value.launch.componentDescriptorCommitment) {
      errors.push('launch ComponentDescriptorV0 commitment mismatch');
    }
    if (commitSourceDescriptorV0(source) !== value.launch.sourceDescriptorCommitment) {
      errors.push('launch SourceDescriptorV0 commitment mismatch');
    }
    if (commitByteReadRequestV0(request) !== value.launch.requestCommitment) {
      errors.push('launch ByteReadRequestV0 commitment mismatch');
    }
    if (source.originLineageCommitment !== value.launch.originLineageCommitment
        || source.componentDescriptorCommitment !== value.launch.componentDescriptorCommitment
        || source.realmId !== value.launch.realmId
        || source.realmRevisionId !== value.launch.realmRevisionId) {
      errors.push('SourceDescriptorV0 does not bind the exact Realm lineage and component');
    }
    if (source.chainNamespace !== origin.chainNamespace || source.chainReference !== origin.chainReference) {
      errors.push('SourceDescriptorV0 chain namespace/reference differ from retained OriginLineageV0');
    }
    if (request.realmId !== value.launch.realmId
        || request.realmRevisionId !== value.launch.realmRevisionId
        || request.sourceDescriptorCommitment !== value.launch.sourceDescriptorCommitment) {
      errors.push('ByteReadRequestV0 does not bind the exact Realm and source descriptor');
    }
    if (request.recordId !== value.portable?.records?.fileRevision?.id
        || request.digestAlgorithm !== 1
        || request.expectedDigest !== value.portable?.fileDigest
        || request.start !== 0
        || request.length !== 13) {
      errors.push('ByteReadRequestV0 does not bind the exact FileRevision, C0 Keccak digest, and byte range');
    }
  });

  const canonicalRecordFields = {};
  for (const name of ['directory', 'file', 'directoryEntry', 'fileRevision']) {
    const type = value.portable?.types?.[name];
    const record = value.portable?.records?.[name];
    capture(`${name} Type`, () => {
      compileBodyTypesV0(type.schema);
      if (typeSchemaIdV0(type.schema) !== type.id) errors.push(`${name} TypeSchemaId mismatch`);
      if (encodeTypeSchemaV0(type.schema) !== type.canonicalDescriptor) errors.push(`${name} Type descriptor mismatch`);
      const inspected = inspectTypeSchemaEnvelope(type.canonicalDescriptor);
      if (inspected.typeSchemaId !== type.id) errors.push(`${name} raw Type envelope ID mismatch`);
      if (inspected.codecVersion !== 0 || inspected.support !== 'SUPPORTED'
          || inspected.validation !== 'SEMANTICALLY_VALID'
          || inspected.semanticReconstruction !== 'COMPLETE') {
        errors.push(`${name} raw Type envelope support grading mismatch`);
      }
      requireSame(type.envelope, {
        codecVersion: inspected.codecVersion,
        payloadBytes: inspected.payloadBytes,
        rawTypeBytes: inspected.rawTypeBytes,
        typeSchemaId: inspected.typeSchemaId,
        support: inspected.support,
        validation: inspected.validation,
        semanticReconstruction: inspected.semanticReconstruction,
      }, `${name} raw Type envelope facts mismatch`);
    });
    capture(`${name} Record`, () => {
      const decodedBody = decodeCanonicalBodyV0(type.schema, record.canonicalBody);
      canonicalRecordFields[name] = new Map(decodedBody.fields.map((field) => [field.fieldKey, field.value]));
      if (record.typeSchemaId !== type.id) errors.push(`${name} Record names the wrong exact Type`);
      if (recordIdV0(record.typeSchemaId, record.canonicalBody) !== record.id) errors.push(`${name} RecordId mismatch`);
    });
  }
  capture('finite exact Type/Record reference closure', () => {
    validateFiniteTypeRecordInventoryV0({
      types: Object.values(value.portable.types).map((type) => ({
        typeBytes: type.canonicalDescriptor,
        expectedTypeSchemaId: type.id,
      })),
      records: Object.values(value.portable.records).map((record) => ({
        typeSchemaId: record.typeSchemaId,
        canonicalBody: record.canonicalBody,
        expectedRecordId: record.id,
      })),
    });
  });
  const records = value.portable?.records ?? {};
  const field = (recordName, fieldKey) => canonicalRecordFields[recordName]?.get(fieldKey);
  if (records.directory?.decoded?.creatorPrincipalId !== field('directory', 1)
      || records.directory?.decoded?.salt !== field('directory', 2)
      || records.directory?.decoded?.charter !== field('directory', 3)) {
    errors.push('DirectoryObjectGenesis decoded view differs from canonical body');
  }
  if (records.file?.decoded?.creatorPrincipalId !== field('file', 1)
      || records.file?.decoded?.salt !== field('file', 2)
      || records.file?.decoded?.charter !== field('file', 3)) {
    errors.push('FileObjectGenesis decoded view differs from canonical body');
  }
  if (records.directoryEntry?.decoded?.parent !== field('directoryEntry', 1)
      || records.directoryEntry?.decoded?.name !== field('directoryEntry', 2)
      || records.directoryEntry?.decoded?.child !== field('directoryEntry', 3)
      || records.directoryEntry?.decoded?.childIsDirectory !== field('directoryEntry', 4)) {
    errors.push('DirectoryFileEntryC0 decoded view differs from canonical body');
  }
  if (records.fileRevision?.decoded?.file !== field('fileRevision', 1)
      || records.fileRevision?.decoded?.contentDigest !== field('fileRevision', 2)
      || BigInt(records.fileRevision?.decoded?.byteLength ?? -1) !== BigInt(field('fileRevision', 3) ?? -2)
      || records.fileRevision?.decoded?.contentType !== field('fileRevision', 4)) {
    errors.push('FileRevisionC0 decoded view differs from canonical body');
  }
  if (records.directoryEntry?.decoded?.parent !== records.directory?.id) errors.push('DirectoryEntry parent cross-link mismatch');
  if (records.directoryEntry?.decoded?.child !== records.file?.id) errors.push('DirectoryEntry child cross-link mismatch');
  if (records.directoryEntry?.decoded?.name !== utf8Hex('hello.txt')) errors.push('DirectoryEntry name bytes mismatch');
  if (records.directoryEntry?.decoded?.childIsDirectory !== false) errors.push('DirectoryEntry child kind mismatch');
  if (records.fileRevision?.decoded?.file !== records.file?.id) errors.push('FileRevision file cross-link mismatch');
  if (records.fileRevision?.decoded?.contentDigest !== value.portable?.fileDigest) errors.push('FileRevision digest mismatch');
  if (BigInt(records.fileRevision?.decoded?.byteLength ?? -1) !== 13n) errors.push('FileRevision byte length mismatch');
  if (keccak256(value.portable?.fileBytes ?? '0x') !== value.portable?.fileDigest) errors.push('literal file bytes digest mismatch');

  const publicationAuthor = value.publication?.value?.[0];
  const publicationSourceActor = value.publication?.value?.[1];
  for (const name of ['directory', 'file']) {
    const creator = field(name, 1);
    if (creator !== publicationAuthor || creator !== publicationSourceActor) {
      errors.push(`${name} ObjectGenesis creator claim is not authenticated by the signed Publication author/source actor`);
    }
  }

  requireSame(value.publication?.leaves, [records.directoryEntry?.id, records.fileRevision?.id], 'PublicationSet leaves cross-link mismatch');
  if (value.publication?.occurrenceIds?.length !== 2) errors.push('PublicationSet must have two OccurrenceIds');
  for (let index = 0; index < 2; index += 1) {
    capture(`OccurrenceId ${index}`, () => {
      if (transitionIds.occurrence(value.publication.id, index) !== value.publication.occurrenceIds[index]) {
        errors.push(`OccurrenceId ${index} mismatch`);
      }
    });
  }
  capture('SourceWitness signedDigest', () => {
    const witness = value.publication.sourceWitness.value;
    if (sourceWitnessId(witness) !== value.publication.sourceWitness.id) errors.push('SourceWitnessId mismatch');
    if (witness[3] !== signatureDigest(witness[0], witness[1], witness[2])) {
      errors.push('SourceWitness signedDigest is not the exact SIGN digest');
    }
  });

  capture('AdmissionPlan', () => {
    validateAdmissionPlan(value.admission.plan);
    if (admissionPlanId(value.admission.plan) !== value.admission.planId) errors.push('AdmissionPlanId mismatch');
    if (effectSetId(value.admission.plan.effects) !== value.admission.effectSetId) errors.push('EffectSetId mismatch');
    if (operationId(value.admission.planId, value.admission.effectSetId) !== value.admission.operationId) {
      errors.push('OperationId mismatch');
    }
  });
  requireSame(value.admission?.plan?.occurrenceIds, value.publication?.occurrenceIds, 'AdmissionPlan occurrence cross-link mismatch');
  if (value.admission?.plan?.effects?.length !== 2) errors.push('AdmissionPlan must contain two BIND effects');
  capture('DestinationWitness signedDigest', () => {
    const witness = value.admission.destinationWitness.value;
    if (destinationWitnessId(witness) !== value.admission.destinationWitness.id) errors.push('DestinationWitnessId mismatch');
    if (witness[2] !== signatureDigest(witness[0], witness[1], value.admission.plan.verifierProfileId)) {
      errors.push('DestinationWitness signedDigest is not the exact SIGN digest');
    }
  });
  for (const bindingName of ['name', 'revision']) {
    const binding = value.bindings?.[bindingName];
    if (!binding) {
      errors.push(`missing ${bindingName} Binding`);
      continue;
    }
    const expectedPosition = positionKey({
      purpose: binding.purpose,
      subject: binding.subject,
      fieldRole: binding.fieldRole,
    });
    if (expectedPosition !== binding.positionKey) errors.push(`${bindingName} PositionKey mismatch`);
    const expectedScope = bindingScopeKey({
      principalId: value.realm.principal.id,
      purpose: binding.purpose,
      subject: binding.subject,
    });
    if (expectedScope !== binding.scope.key) errors.push(`${bindingName} BindingScope key mismatch`);
    if (binding.scope.subject !== binding.subject) errors.push(`${bindingName} scope subject mismatch`);
    if (binding.scope.fieldRole !== binding.fieldRole) errors.push(`${bindingName} scope role mismatch`);
  }
  if (value.bindings?.name?.scope?.subject !== records.directory?.id) errors.push('name Binding must remain directory-scoped');
  if (value.bindings?.name?.fieldRole !== expected.bindings.name.fieldRole) errors.push('name role or PositionKey meaning mismatch');
  const effectTargets = new Map((value.admission?.plan?.effects ?? []).map((effect) => [effect.positionKey, effect.recordId]));
  if (effectTargets.get(value.bindings?.name?.positionKey) !== records.directoryEntry?.id) errors.push('name BIND effect cross-link mismatch');
  if (effectTargets.get(value.bindings?.revision?.positionKey) !== records.fileRevision?.id) errors.push('revision BIND effect cross-link mismatch');

  const [parentBacklink, backlink] = value.query?.typedBacklinks ?? [];
  for (const [name, candidate] of [['parent', parentBacklink], ['child', backlink]]) {
    if (candidate?.baseKind !== BASE_KINDS.RECORD_REFERENCE) errors.push(`${name} typed backlink must use closed BaseKind RECORD_REFERENCE`);
    capture(`${name} typed backlink`, () => {
      const recomputed = recordReferenceBaseKey({
        typeSchemaId: candidate.typeSchemaId,
        fieldKey: candidate.fieldKey,
        targetRecordId: candidate.targetRecordId,
      });
      if (recomputed !== candidate.baseKey) errors.push(`${name} typed backlink base key mismatch`);
    });
  }
  if (parentBacklink?.fieldKey !== 1 || parentBacklink?.targetRecordId !== records.directory?.id
      || parentBacklink?.postingRecordId !== records.directoryEntry?.id) {
    errors.push('parent typed backlink Record cross-link mismatch');
  }
  if (backlink?.fieldKey !== 3 || backlink?.targetRecordId !== records.file?.id
      || backlink?.postingRecordId !== records.directoryEntry?.id) {
    errors.push('child typed backlink Record cross-link mismatch');
  }
  if (value.query?.typedBacklink?.baseKey !== backlink?.baseKey) {
    errors.push('legacy child typedBacklink alias differs from exact child backlink');
  }
  const queryProfile = value.query?.value;
  if (queryProfile?.[0] !== value.portable?.types?.directoryEntry?.id
      || queryProfile?.[1]?.length !== 1
      || Number(queryProfile?.[1]?.[0]?.[0]) !== 1
      || Number(queryProfile?.[1]?.[0]?.[1]) !== 2
      || Number(queryProfile?.[1]?.[0]?.[2]) !== 1) {
    errors.push('QueryProfile must retain the exact DirectoryFileEntryC0 Type and name BYTES field 2');
  }
  capture('QueryProfileId', () => {
    if (queryProfileId(queryProfile) !== value.query.profileId) errors.push('QueryProfileId mismatch');
  });
  const expectedNameIndexKey = exactBytesIndexKey(
    value.portable.types.directoryEntry.id,
    2,
    field('directoryEntry', 2),
  );
  const queryPosting = value.query?.postings?.[0];
  if (queryPosting?.indexKey !== expectedNameIndexKey
      || queryPosting?.recordId !== records.directoryEntry?.id) {
    errors.push('Query posting indexKey does not link the exact name BYTES value to DirectoryFileEntryC0');
  }
  if (queryPosting?.indexKey === backlink?.baseKey) errors.push('name exact-bytes index and typed-reference backlink must remain distinct');
  errors.push(...validateTerminalQueryCompletion(value.query?.completion ?? {}, expected.query.completion));

  for (const prefix of ['name', 'revision']) {
    const plan = value.lens?.[`${prefix}Plan`];
    errors.push(...validateResolutionPlanV0(plan).map((error) => `${prefix} Lens Plan: ${error}`));
    capture(`${prefix} Lens`, () => {
      if (resolutionPlanId(plan) !== value.lens[`${prefix}PlanId`]) errors.push(`${prefix} ResolutionPlanId mismatch`);
      const expectedResolution = expected.lens[`${prefix}Resolution`];
      requireSame(value.lens[`${prefix}Resolution`], expectedResolution, `${prefix} Lens resolution mismatch`);
      const required = value.lens[`${prefix}RequiredPointInput`];
      const binding = value.bindings?.[prefix];
      if (required?.resolutionPlanId !== value.lens[`${prefix}PlanId`]
          || required?.fieldRole !== binding?.fieldRole
          || required?.positionKey !== binding?.positionKey
          || !same(required?.principalIds, plan?.principals)) {
        errors.push(`${prefix} RequiredPointInput is outside its ResolutionPlan purpose/subject/fieldRole scope`);
      }
      if (value.lens[`${prefix}Resolution`]?.probes?.some((probe) => probe.positionKey !== required?.positionKey)) {
        errors.push(`${prefix} Lens probe does not retain the derived RequiredPointInput PositionKey`);
      }
    });
  }

  errors.push(...validateResultV0(value.result?.value ?? {}).map((error) => `ResultV0: ${error}`));
  capture('ResultV0', () => {
    if (encodeResultV0(value.result.value) !== value.result.encoded) errors.push('encoded ResultV0 mismatch');
    if (commitResultV0(value.result.value) !== value.result.commitment) errors.push('ResultV0 commitment mismatch');
    const bytesPayload = decodeBytesPayload(value.result.value.payload.data);
    if (bytesPayload.recordId !== records.fileRevision.id
        || bytesPayload.expectedDigest !== value.portable.fileDigest
        || bytesPayload.bytesPresent !== true
        || bytesPayload.availableBytes !== value.portable.fileBytes) {
      errors.push('BytesPayloadV0 does not bind the exact FileRevision, digest, and available bytes');
    }
  });
  requireSame(value.result?.observerBasis, value.launch?.requestedBasis, 'Result observer basis differs from launch observer basis');

  errors.push(...validateAcquisitionEvidencePacketV0(
    value.acquisition?.packet,
    value.acquisition?.final,
  ).map((error) => `acquisition: ${error}`));
  capture('acquisition commitment', () => {
    if (commitAcquisitionEvidencePacketV0(value.acquisition.packet) !== value.acquisition.commitment) {
      errors.push('acquisition evidence commitment mismatch');
    }
  });
  if (value.acquisition?.packet?.requestBytes !== value.launch?.requestBytes
      || value.acquisition?.packet?.sourceDescriptorBytes !== value.launch?.sourceDescriptorBytes
      || value.acquisition?.packet?.sourceDescriptorCommitment !== value.launch?.sourceDescriptorCommitment) {
    errors.push('acquisition dropped or substituted the launch request/source preimages');
  }
  capture('source observation', () => {
    const sourceObservationExpected = {
      resultV0Commitment: value.result.commitment,
      requestCommitment: value.acquisition.packet.requestCommitment,
      sourceDescriptorCommitment: value.launch.sourceDescriptorCommitment,
      requestBytes: value.launch.requestBytes,
      sourceDescriptorBytes: value.launch.sourceDescriptorBytes,
      observerBasis: value.result.observerBasis,
      canonicalityAssessment: ASSESSMENT.SOURCE_REPORTED,
      proofKind: PROOF_KIND.NONE,
      proofScope: PROOF_SCOPE.NONE,
      proofScopeCommitment: { present: false, value: ZERO },
      causalAvailability: AVAILABILITY.AVAILABLE,
    };
    errors.push(...validateSourceObservationEvidenceV0(
      value.sourceObservation.evidence,
      sourceObservationExpected,
    ).map((error) => `source observation: ${error}`));
    if (encodeSourceObservationEvidenceV0(value.sourceObservation.evidence) !== value.sourceObservation.encoded) {
      errors.push('source observation encoded bytes mismatch');
    }
    if (commitSourceObservationEvidenceV0(value.sourceObservation.evidence) !== value.sourceObservation.commitment) {
      errors.push('source observation commitment mismatch');
    }
  });
  if (value.sourceObservation?.evidence?.requestBytes !== value.launch?.requestBytes
      || value.sourceObservation?.evidence?.sourceDescriptorBytes !== value.launch?.sourceDescriptorBytes) {
    errors.push('source observation dropped or substituted the launch request/source preimages');
  }
  const attempts = value.acquisition?.packet?.attempts ?? [];
  if (attempts[0]?.outcome !== ATTEMPT_OUTCOME.INTEGRITY_FAILED
      || attempts[1]?.outcome !== ATTEMPT_OUTCOME.VERIFIED) {
    errors.push('acquisition must retain corrupt primary first and verified fallback second');
  }

  const expectedEntries = expected.projection.entries;
  const suppliedEntries = value.projection?.entries ?? [];
  const inspection = inspectProjection(expectedEntries, suppliedEntries, {
    claimFullState: true,
    declaredEmptyCollectionKinds: value.projection?.declaredEmptyCollectionKinds,
  });
  errors.push(...inspection.errors.map((error) => `projection: ${error}`));
  if (!inspection.fullStateReconstruction) errors.push('projection does not reconstruct every required collection');
  requireSame(
    inspection.declaredEmptyCollectionKinds,
    expected.projection.declaredEmptyCollectionKinds,
    'projection declared-empty collection inventory mismatch',
  );
  requireSame(
    inspection.accountedCollectionKinds,
    Array.from({ length: 28 }, (_, index) => index + 1),
    'projection accounted collection inventory is not exact 1..28',
  );
  capture('projection root', () => {
    if (projectionRoot(suppliedEntries) !== value.projection.root) errors.push('projection root mismatch');
  });
  capture('raw projection point', () => {
    errors.push(...validateRawPointRead({
      entries: suppliedEntries,
      collectionKind: value.projection.pointRead.entry.collectionKind,
      key: value.projection.pointRead.entry.key,
      resultV0: value.projection.pointRead.resultV0,
    }).map((error) => `raw projection point: ${error}`));
  });

  if (value.adapter?.sdk?.rawResultV0 !== value.result?.encoded) errors.push('SDK dropped or replaced raw ResultV0');
  const expectedRawTypeEnvelopes = rawTypeEnvelopeMap(value.portable?.types ?? {});
  requireSame(value.adapter?.sdk?.rawTypeEnvelopes, expectedRawTypeEnvelopes, 'SDK dropped or replaced raw Type envelopes');
  if (value.adapter?.sdk?.canonicalFileBytes !== value.portable?.fileBytes) errors.push('SDK dropped canonical file bytes');
  if (value.adapter?.sdk?.acquisitionEvidenceCommitment !== value.acquisition?.commitment) errors.push('SDK dropped acquisition evidence');
  requireSame(value.adapter?.sdk?.observerBasis, value.result?.observerBasis, 'SDK observer basis mismatch');
  if (value.adapter?.explorer?.directGuest !== true
      || value.adapter?.explorer?.requiresWallet !== false
      || value.adapter?.explorer?.requiresAccount !== false
      || value.adapter?.explorer?.requiresCommons !== false
      || value.adapter?.explorer?.requiresHostedIndexer !== false
      || value.adapter?.explorer?.requiresOsBoot !== false) {
    errors.push('Explorer direct guest dependencies are not explicit and wallet-free');
  }
  if (!value.adapter?.explorer?.inspector?.observerBasis) errors.push('Explorer dropped observer basis');
  else requireSame(value.adapter.explorer.inspector.observerBasis, value.result?.observerBasis, 'Explorer observer basis mismatch');
  if (value.adapter?.explorer?.inspector?.canonicalFileBytes !== value.portable?.fileBytes) errors.push('Explorer dropped canonical file bytes');
  if (value.adapter?.explorer?.inspector?.rawResultV0 !== value.result?.encoded) errors.push('Explorer dropped raw ResultV0');
  requireSame(
    value.adapter?.explorer?.inspector?.rawTypeEnvelopes,
    expectedRawTypeEnvelopes,
    'Explorer dropped or replaced raw Type envelopes',
  );
  requireSame(value.adapter?.explorer?.inspector?.acquisitionAttempts, attempts, 'Explorer dropped acquisition attempts');

  return [...new Set(errors)];
}

function normalize(value) {
  if (typeof value === 'bigint') return value.toString(10);
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

function fixturePayload(scenario) {
  return normalize({
    profile: scenario.profile,
    launch: scenario.launch,
    realm: {
      id: scenario.realm.id,
      revisionId: scenario.realm.revisionId,
      bootstrap: scenario.realm.bootstrap,
      revision: scenario.realm.revision,
      descriptorCommitments: Object.fromEntries(Object.entries(scenario.realm.descriptors).map(([name, value]) => [name, value.commitment])),
      principalId: scenario.realm.principal.id,
      verifierProfileId: scenario.realm.verifierProfile.id,
    },
    portable: {
      fileBytes: scenario.portable.fileBytes,
      fileDigest: scenario.portable.fileDigest,
      typeEnvelopes: Object.fromEntries(Object.entries(scenario.portable.types).map(([name, value]) => [name, value.envelope])),
      typeSchemaIds: Object.fromEntries(Object.entries(scenario.portable.types).map(([name, value]) => [name, value.id])),
      recordIds: Object.fromEntries(Object.entries(scenario.portable.records).map(([name, value]) => [name, value.id])),
    },
    publication: {
      id: scenario.publication.id,
      leaves: scenario.publication.leaves,
      occurrenceIds: scenario.publication.occurrenceIds,
      sourceWitnessId: scenario.publication.sourceWitness.id,
    },
    admission: {
      planId: scenario.admission.planId,
      effectSetId: scenario.admission.effectSetId,
      operationId: scenario.admission.operationId,
      admissionIds: scenario.admission.admissionIds,
      destinationWitnessId: scenario.admission.destinationWitness.id,
      effects: scenario.admission.plan.effects,
    },
    bindings: scenario.bindings,
    query: {
      profileId: scenario.query.profileId,
      typedBacklinks: scenario.query.typedBacklinks,
      typedBacklink: scenario.query.typedBacklink,
      cursor: scenario.query.completion.cursor,
      terminalPostingsRoot: scenario.query.completion.terminalPostingsRoot,
    },
    lens: {
      basisCommitment: scenario.lens.basisCommitment,
      namePlanId: scenario.lens.namePlanId,
      nameRequiredPointInput: scenario.lens.nameRequiredPointInput,
      nameResolution: scenario.lens.nameResolution,
      revisionPlanId: scenario.lens.revisionPlanId,
      revisionRequiredPointInput: scenario.lens.revisionRequiredPointInput,
      revisionResolution: scenario.lens.revisionResolution,
    },
    acquisition: {
      commitment: scenario.acquisition.commitment,
      packet: scenario.acquisition.packet,
      final: scenario.acquisition.final,
    },
    sourceObservation: scenario.sourceObservation,
    projection: {
      entryCount: scenario.projection.entries.length,
      entries: scenario.projection.entries,
      populatedKinds: scenario.projection.populatedKinds,
      declaredEmptyCollectionKinds: scenario.projection.declaredEmptyCollectionKinds,
      root: scenario.projection.root,
      authorityPreimages: {
        principalId: scenario.realm.principal.id,
        verifierProfileId: scenario.realm.verifierProfile.id,
        admissionPlanId: scenario.admission.planId,
        destinationWitnessId: scenario.admission.destinationWitness.id,
      },
      descriptorCommitments: Object.fromEntries(Object.entries(scenario.realm.descriptors).map(([name, value]) => [name, value.commitment])),
    },
    result: {
      commitment: scenario.result.commitment,
      encoded: scenario.result.encoded,
      observerBasis: scenario.result.observerBasis,
    },
    adapter: {
      sdk: {
        rawResultRef: '#/payload/result/encoded',
        observerBasisRef: '#/payload/result/observerBasis',
        acquisitionAttemptsRef: '#/payload/acquisition/packet/attempts',
        canonicalFileBytesRef: '#/payload/portable/fileBytes',
        rawTypeEnvelopesRef: '#/payload/portable/typeEnvelopes',
        rawResultCommitment: scenario.adapter.sdk.rawResultCommitment,
        acquisitionEvidenceCommitment: scenario.adapter.sdk.acquisitionEvidenceCommitment,
        filesFacade: scenario.adapter.sdk.filesFacade,
        queryCursor: scenario.adapter.sdk.queryCursor,
      },
      explorer: {
        directGuest: scenario.adapter.explorer.directGuest,
        requiresWallet: scenario.adapter.explorer.requiresWallet,
        requiresAccount: scenario.adapter.explorer.requiresAccount,
        requiresCommons: scenario.adapter.explorer.requiresCommons,
        requiresHostedIndexer: scenario.adapter.explorer.requiresHostedIndexer,
        requiresOsBoot: scenario.adapter.explorer.requiresOsBoot,
        listRow: scenario.adapter.explorer.listRow,
        inspector: {
          rawResultRef: '#/payload/result/encoded',
          observerBasisRef: '#/payload/result/observerBasis',
          acquisitionAttemptsRef: '#/payload/acquisition/packet/attempts',
          canonicalFileBytesRef: '#/payload/portable/fileBytes',
          rawTypeEnvelopesRef: '#/payload/portable/typeEnvelopes',
          authority: scenario.adapter.explorer.inspector.authority,
          coverage: scenario.adapter.explorer.inspector.coverage,
          validation: scenario.adapter.explorer.inspector.validation,
          effect: scenario.adapter.explorer.inspector.effect,
          projectionIntegrity: scenario.adapter.explorer.inspector.projectionIntegrity,
        },
      },
    },
  });
}

function fixtureDocument(scenario = buildHelloFilesScenario()) {
  const payload = fixturePayload(scenario);
  return {
    status: 'DISPOSABLE_INTEGRATION_CONTROL',
    protocolConformance: false,
    exactExecutableTraceReplayCountDelta: 0,
    deterministic: true,
    timestampOrMeasurementFields: false,
    payloadSha256Algorithm: 'SHA-256(canonical-json(payload))',
    payloadSha256: crypto.createHash('sha256').update(canonicalJson(payload)).digest('hex'),
    payload,
  };
}

module.exports = {
  buildHelloFilesScenario,
  canonicalJson,
  fixtureDocument,
  fixturePayload,
  validateHelloFilesScenario,
};
