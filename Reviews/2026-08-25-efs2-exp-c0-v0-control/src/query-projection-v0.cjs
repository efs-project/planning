'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();
const {
  ABI: RESULT_ABI,
  ENUMS,
  encodeCollectionEntrySubject,
  validateResultV0,
} = require('./result-v0.cjs');
const {
  DOMAINS: PRINCIPAL_DOMAINS,
  signatureDigest,
} = require('./principal-comparator-v0.cjs');
const {
  DOMAINS: PLAN_DOMAINS,
  EFFECT_V0_ABI,
  operationId,
} = require('./plan-v0.cjs');
const {
  decodeCanonicalBodyV0,
  decodeCanonicalTypeSchemaV0,
  encodeTypeSchemaV0,
  inspectTypeSchemaEnvelope,
  typeSchemaIdV0,
} = require('./type-interpreter-v0.cjs');

const RAW_TYPE_SCHEMA_ENVELOPE = 'raw:type-schema-envelope';
const REALM_BOOTSTRAP = 'tuple(bytes,bytes32,bytes32,bytes32,bytes32,uint8[])';
const REALM_REVISION = 'tuple(bytes32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,uint64)';
const RECORD = 'tuple(bytes32,bytes)';
const PUBLICATION_SET = 'tuple(bytes32,bytes32,bytes32,uint32,uint32,uint64,uint64,uint8,uint8,bytes32[])';
const OCCURRENCE = 'tuple(bytes32,uint16)';
const SOURCE_WITNESS = 'tuple(bytes32,bytes32,bytes32,bytes32,bytes)';
const OPERATION = 'tuple(bytes32,bytes32,uint8,uint64)';
const ADMISSION_RECEIPT = 'tuple(bytes32,bytes32,bytes32,bytes32,uint32,uint32,bytes32,bytes32,bool)';
const VERIFIER_TRANSCRIPT = 'tuple(bytes32,bytes32,bytes32,address,bytes,bytes32,bytes32,bytes32,uint64,uint32,bytes,uint8)';
const BINDING_HEAD = 'tuple(uint32,bool,bytes32,bytes32)';
const QUERY_PROFILE = 'tuple(bytes32,tuple(uint8,uint16,uint8)[])';
const QUERY_ACTIVATION = 'tuple(bytes32,bytes32,bytes32,uint32,uint32,uint32,uint32,uint8,bytes32,bytes32,bytes32,bytes32,uint8,uint64,tuple(bool,uint32),tuple(bool,bytes32))';
const RESOLUTION_PLAN = 'tuple(bytes32,bytes32,bytes32[],uint8,uint8)';
const REQUIRED_POINT_INPUT = 'tuple(bytes32,bytes32,bytes32,bytes32[])';
const COST_COMMITMENT = 'tuple(bytes32,bytes32,bytes32,uint64,uint64)';
const PRINCIPAL = 'tuple(uint8,bytes,address)';
const VERIFIER_PROFILE = 'tuple(uint8,uint8,bytes4,uint32,uint16)';
const EFFECT_V0 = 'tuple(uint8,bytes32,bytes32,bytes32,bytes32,uint32,bytes32,uint32,uint32,uint32,bytes32)';
const ADMISSION_PLAN = `tuple(bytes32[],bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,uint64,uint64,bytes32,bytes32,bytes32,uint64,${EFFECT_V0}[])`;
const DESTINATION_WITNESS = 'tuple(bytes32,bytes32,bytes32,bytes)';
const POSTING = 'tuple(bytes32,uint32,bytes32)';
const PROFILE_VERSION = 0;
const domain = (name) => keccak256(toUtf8Bytes(name));
const DOMAIN_POSTINGS = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/POSTINGS'));
const DOMAIN_POSITION = domain('EFS2/EXP-C0/V0/POSITION');
const DOMAIN_BINDING = domain('EFS2/EXP-C0/V0/BINDING');
const DOMAIN_BINDING_SCOPE = domain('EFS2/EXP-C0/V0/BINDING_SCOPE');
const DOMAIN_DESCRIPTOR = domain('EFS2/EXP-C0/V0/DESCRIPTOR');
const DOMAIN_PRINCIPAL = domain('EFS2/EXP-C0/V0/PRINCIPAL');
const DOMAIN_VERIFIER = domain('EFS2/EXP-C0/V0/VERIFIER');
const DOMAIN_ADMISSION_PLAN = domain('EFS2/EXP-C0/V0/ADMISSION_PLAN');
const DOMAIN_SOURCE_WITNESS = domain('EFS2/EXP-C0/V0/SOURCE_WITNESS');
const DOMAIN_DESTINATION_WITNESS = domain('EFS2/EXP-C0/V0/DESTINATION_WITNESS');
const DOMAIN_ADMISSION = domain('EFS2/EXP-C0/V0/ADMISSION');
const DOMAIN_OCCURRENCE = domain('EFS2/EXP-C0/V0/OCCURRENCE');
const DOMAIN_RECORD_REFERENCE = domain('EFS2/EXP-C0/V0/BASE/RECORD_REFERENCE');
const DOMAIN_BODY = domain('EFS2/EXP-C0/V0/BODY');
const DOMAIN_EXACT_BYTES_INDEX = domain('EFS2/EXP-C0/V0/INDEX/EXACT_BYTES');
const DOMAIN_QUERY_PROFILE = domain('EFS2/EXP-C0/V0/QUERY_PROFILE');

const BASE_KINDS = Object.freeze({
  TYPE: 1,
  RECORD_REFERENCE: 2,
  AUTHOR: 3,
  DIGEST: 4,
});

const DESCRIPTOR_KINDS = Object.freeze({
  COMPONENT: 1,
  EXECUTION_PROFILE: 2,
  POLICY: 3,
  ADMINISTRATION: 4,
});

function positionKey({ purpose, subject, fieldRole }) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32'],
    [DOMAIN_POSITION, PROFILE_VERSION, purpose, subject, fieldRole],
  ));
}

function bindingScopeKey({ principalId, purpose, subject }) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32'],
    [DOMAIN_BINDING_SCOPE, PROFILE_VERSION, principalId, purpose, subject],
  ));
}

function bindingKey({ principalId, position }) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32'],
    [DOMAIN_BINDING, PROFILE_VERSION, principalId, position],
  ));
}

function descriptorCommitment(descriptorKind, canonicalDescriptor) {
  if (!Object.values(DESCRIPTOR_KINDS).includes(descriptorKind)) {
    throw new Error(`unknown DescriptorKind ${descriptorKind}`);
  }
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'uint8', 'bytes'],
    [DOMAIN_DESCRIPTOR, PROFILE_VERSION, descriptorKind, canonicalDescriptor],
  ));
}

function identityCommitment(identityDomain, abiType, value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', abiType],
    [identityDomain, PROFILE_VERSION, value],
  ));
}

function principalId(principal) {
  return identityCommitment(DOMAIN_PRINCIPAL, PRINCIPAL, principal);
}

function verifierProfileId(profile) {
  return identityCommitment(DOMAIN_VERIFIER, VERIFIER_PROFILE, profile);
}

function admissionPlanId(plan) {
  return identityCommitment(DOMAIN_ADMISSION_PLAN, ADMISSION_PLAN, plan);
}

function sourceWitnessId(witness) {
  return identityCommitment(DOMAIN_SOURCE_WITNESS, SOURCE_WITNESS, witness);
}

function destinationWitnessId(witness) {
  return identityCommitment(DOMAIN_DESTINATION_WITNESS, DESTINATION_WITNESS, witness);
}

function recordReferenceBaseKey({ typeSchemaId, fieldKey, targetRecordId }) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'uint16', 'bytes32'],
    [DOMAIN_RECORD_REFERENCE, PROFILE_VERSION, typeSchemaId, fieldKey, targetRecordId],
  ));
}

function recordBodyCommitment(canonicalBody) {
  return identityCommitment(DOMAIN_BODY, 'bytes', canonicalBody);
}

function exactBytesIndexKey(typeSchemaId, fieldKey, canonicalBytesValue) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'uint16', 'bytes'],
    [DOMAIN_EXACT_BYTES_INDEX, PROFILE_VERSION, typeSchemaId, fieldKey, canonicalBytesValue],
  ));
}

function queryProfileId(profile) {
  return identityCommitment(DOMAIN_QUERY_PROFILE, QUERY_PROFILE, profile);
}

function occurrenceId(publicationSetId, leafIndex) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'uint16'],
    [DOMAIN_OCCURRENCE, PROFILE_VERSION, publicationSetId, leafIndex],
  ));
}

function admissionId(occurrence, realmRevisionId, operation, admissionOrdinal) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32', 'uint32'],
    [DOMAIN_ADMISSION, PROFILE_VERSION, occurrence, realmRevisionId, operation, admissionOrdinal],
  ));
}

function effectSetIdFromPlanTuple(plan) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', `${EFFECT_V0_ABI}[]`],
    [PLAN_DOMAINS.effectSet, PROFILE_VERSION, plan[14]],
  ));
}

const definitions = [
  [1, 'REALM_BOOTSTRAPS', 'bytes32', REALM_BOOTSTRAP],
  [2, 'REALM_REVISIONS', 'tuple(bytes32,uint32)', REALM_REVISION],
  [3, 'TYPES', 'bytes32', RAW_TYPE_SCHEMA_ENVELOPE],
  [4, 'RECORDS', 'bytes32', RECORD],
  [5, 'PUBLICATION_SETS', 'bytes32', PUBLICATION_SET],
  [6, 'OCCURRENCES', 'bytes32', OCCURRENCE],
  [7, 'SOURCE_WITNESSES', 'bytes32', SOURCE_WITNESS],
  [8, 'NONCE_PLANS', 'tuple(bytes32,bytes32,uint32,uint64)', 'tuple(bytes32,bytes32)'],
  [9, 'OPERATIONS', 'bytes32', OPERATION],
  [10, 'ADMISSIONS', 'bytes32', ADMISSION_RECEIPT],
  [11, 'VERIFIER_TRANSCRIPTS', 'bytes32', VERIFIER_TRANSCRIPT],
  [12, 'BASE_POSTINGS', 'tuple(uint8,bytes32,uint32)', 'tuple(bytes32,bytes32)'],
  [13, 'BINDING_HEADS', 'tuple(bytes32,bytes32)', BINDING_HEAD],
  [14, 'BINDING_HISTORY', 'tuple(bytes32,bytes32,uint32)', BINDING_HEAD],
  [15, 'BINDING_SCOPES', 'tuple(bytes32,bytes32,bytes32,uint32)', 'bytes32'],
  [16, 'WITHDRAWALS', 'tuple(bytes32,bytes32)', 'bytes32'],
  [17, 'QUERY_PROFILE_DEFINITIONS', 'bytes32', QUERY_PROFILE],
  [18, 'QUERY_PROFILE_ACTIVATIONS', 'tuple(bytes32,uint32)', QUERY_ACTIVATION],
  [19, 'INDEX_POSTINGS', 'tuple(bytes32,uint32,bytes32,uint32)', 'bytes32'],
  [20, 'RESOLUTION_PLANS', 'bytes32', RESOLUTION_PLAN],
  [21, 'REQUIRED_POINT_INPUTS', 'tuple(bytes32,bytes32)', REQUIRED_POINT_INPUT],
  [22, 'COST_COMMITMENTS', 'bytes32', COST_COMMITMENT],
  [23, 'COUNTERS', 'tuple(uint8,bytes32,bytes32,uint32)', 'uint32'],
  [24, 'PRINCIPALS', 'bytes32', PRINCIPAL],
  [25, 'VERIFIER_PROFILES', 'bytes32', VERIFIER_PROFILE],
  [26, 'ADMISSION_PLANS', 'bytes32', ADMISSION_PLAN],
  [27, 'DESTINATION_WITNESSES', 'bytes32', DESTINATION_WITNESS],
  [28, 'DESCRIPTORS', 'tuple(uint8,bytes32)', 'bytes'],
];

const COLLECTIONS = Object.freeze(definitions.map(([kind, name, keyAbi, valueAbi]) => Object.freeze({
  kind,
  name,
  keyAbi,
  valueAbi,
})));
const COLLECTION_BY_KIND = new Map(COLLECTIONS.map((definition) => [definition.kind, definition]));
const POINT_SUBJECT_KIND_BY_COLLECTION = Object.freeze(Object.fromEntries(
  COLLECTIONS.map(({ kind }) => [kind, ENUMS.subjectKind.COLLECTION_ENTRY]),
));

const b32 = (byte) => `0x${byte.toString(16).padStart(2, '0').repeat(32)}`;
const address = (byte) => `0x${byte.toString(16).padStart(2, '0').repeat(20)}`;

function encodeEntry(kind, keyValue, valueValue) {
  const definition = COLLECTION_BY_KIND.get(kind);
  if (!definition) throw new Error(`unknown projection collection kind ${kind}`);
  return {
    collectionKind: kind,
    key: abi.encode([definition.keyAbi], [keyValue]),
    value: definition.valueAbi === RAW_TYPE_SCHEMA_ENVELOPE
      ? valueValue
      : abi.encode([definition.valueAbi], [valueValue]),
  };
}

function sampleValues() {
  const realm = b32(1);
  const revision = b32(2);
  const typeSchema = {
    semanticCommitment: '0x01',
    fields: [{ fieldKey: 1, scalarKind: 3, required: true, maxLengthOrCount: 64 }],
    fieldOrder: 1,
    encoding: 1,
    intrinsicConstraints: [{ fieldKey: 1, rule: 2 }],
    referenceRoles: [],
  };
  const typeBytes = encodeTypeSchemaV0(typeSchema);
  const type = typeSchemaIdV0(typeSchema);
  const record = b32(4);
  const publication = b32(5);
  const occurrence = occurrenceId(publication, 0);
  const principalValue = [1, '0x', address(1)];
  const principal = principalId(principalValue);
  const verifierProfileValue = [1, 0, '0x00000000', 0, 0];
  const profile = verifierProfileId(verifierProfileValue);
  const queryProfileValue = [type, [[1, 1, 1]]];
  const query = queryProfileId(queryProfileValue);
  const recordBody = abi.encode(['bytes'], ['0x1234']);
  const indexKey = exactBytesIndexKey(type, 1, '0x1234');
  const resolution = b32(15);
  const purpose = b32(40);
  const directoryA = b32(41);
  const directoryB = b32(42);
  const fieldRoleA = b32(43);
  const fieldRoleB = b32(44);
  const position = positionKey({ purpose, subject: directoryA, fieldRole: fieldRoleA });
  const positionB = positionKey({ purpose, subject: directoryB, fieldRole: fieldRoleB });
  const scopeA = bindingScopeKey({ principalId: principal, purpose, subject: directoryA });
  const scopeB = bindingScopeKey({ principalId: principal, purpose, subject: directoryB });
  const descriptorBytes = Object.freeze({
    [DESCRIPTOR_KINDS.COMPONENT]: '0x636f6d706f6e656e742d7630',
    [DESCRIPTOR_KINDS.EXECUTION_PROFILE]: '0x657865637574696f6e2d70726f66696c652d7630',
    [DESCRIPTOR_KINDS.POLICY]: '0x706f6c6963792d7630',
    [DESCRIPTOR_KINDS.ADMINISTRATION]: '0x61646d696e697374726174696f6e2d7630',
  });
  const descriptors = Object.fromEntries(Object.entries(descriptorBytes).map(([kind, bytes]) => [
    kind,
    descriptorCommitment(Number(kind), bytes),
  ]));
  const componentCommitment = descriptors[DESCRIPTOR_KINDS.COMPONENT];
  const executionProfileId = descriptors[DESCRIPTOR_KINDS.EXECUTION_PROFILE];
  const policyId = descriptors[DESCRIPTOR_KINDS.POLICY];
  const administrationCommitment = descriptors[DESCRIPTOR_KINDS.ADMINISTRATION];
  const coreCommitment = componentCommitment;
  const zero = b32(0);
  const effects = [
    [1, principal, position, record, zero, 0, zero, 0, 0, 0, zero],
    [1, principal, positionB, record, zero, 0, zero, 0, 0, 0, zero],
    [3, principal, zero, zero, occurrence, 0, zero, 0, 0, 0, zero],
  ];
  const admissionPlan = [
    [occurrence], realm, revision, coreCommitment, principal, principal, profile,
    0, 1, 100, b32(45), b32(46), principal, 1000, effects,
  ];
  const plan = admissionPlanId(admissionPlan);
  const effectsId = effectSetIdFromPlanTuple(admissionPlan);
  const operation = operationId(plan, effectsId);
  const admission = admissionId(occurrence, revision, operation, 1);
  const sourceWitness = [
    publication,
    principal,
    profile,
    signatureDigest(publication, principal, profile),
    '0x1234',
  ];
  const destinationWitness = [
    plan,
    principal,
    signatureDigest(plan, principal, profile),
    '0x1234',
  ];
  const postingsRoot = terminalPostingsRoot([{ indexKey, postingOrdinal: 0, recordId: record }]);
  return [
    [1, realm, ['0x01', b32(20), coreCommitment, b32(22), revision, [1, 2]]],
    [2, [realm, 0], [realm, 0, componentCommitment, executionProfileId, policyId, profile, administrationCommitment, 0, 100]],
    [3, type, typeBytes],
    [4, record, [type, recordBody]],
    [5, publication, [principal, principal, profile, 0, 0, 7, 100, 1, 1, [record]]],
    [6, occurrence, [publication, 0]],
    [7, sourceWitnessId(sourceWitness), sourceWitness],
    [8, [realm, principal, 0, 1], [plan, operation]],
    [9, operation, [plan, effectsId, 1, 42]],
    [10, admission, [occurrence, realm, revision, operation, 1, 1, policyId, profile, true]],
    [11, admission, [
      admission,
      destinationWitness[2],
      PRINCIPAL_DOMAINS.sign,
      address(1),
      destinationWitness[3],
      profile,
      b32(31),
      b32(32),
      42,
      100000,
      '0x1626ba7e',
      1,
    ]],
    [12, [BASE_KINDS.TYPE, type, 1], [record, admission]],
    [12, [BASE_KINDS.RECORD_REFERENCE, recordReferenceBaseKey({
      typeSchemaId: type,
      fieldKey: 2,
      targetRecordId: b32(0x18),
    }), 1], [record, admission]],
    [12, [BASE_KINDS.AUTHOR, principal, 1], [record, admission]],
    [12, [BASE_KINDS.DIGEST, recordBodyCommitment(recordBody), 1], [record, admission]],
    [13, [principal, position], [1, false, record, operation]],
    [13, [principal, positionB], [1, false, record, operation]],
    [14, [principal, position, 1], [1, false, record, operation]],
    [14, [principal, positionB, 1], [1, false, record, operation]],
    [15, [principal, purpose, directoryA, 0], fieldRoleA],
    [15, [principal, purpose, directoryB, 0], fieldRoleB],
    [16, [principal, occurrence], operation],
    [17, query, queryProfileValue],
    [18, [query, 1], [realm, query, revision, 1, 1, 0, 1, 3, policyId, principal, b32(33), b32(34), 1, 1000, [true, 1], [true, postingsRoot]]],
    [19, [query, 1, indexKey, 0], record],
    [20, resolution, [purpose, directoryA, [principal], 1, 1]],
    [21, [resolution, position], [resolution, fieldRoleA, position, [principal]]],
    [22, operation, [operation, principal, b32(37), 1000, 1]],
    [23, [1, realm, zero, 0], 1],
    [23, [2, realm, bindingKey({ principalId: principal, position }), 0], 1],
    [23, [2, realm, bindingKey({ principalId: principal, position: positionB }), 0], 1],
    [23, [3, realm, scopeA, 0], 1],
    [23, [3, realm, scopeB, 0], 1],
    [23, [4, realm, query, 1], 1],
    [24, principal, principalValue],
    [25, profile, verifierProfileValue],
    [26, plan, admissionPlan],
    [27, destinationWitnessId(destinationWitness), destinationWitness],
    ...Object.entries(descriptorBytes).map(([kind, bytes]) => [
      28,
      [Number(kind), descriptors[kind]],
      bytes,
    ]),
  ];
}

function compareHex(left, right) {
  return left.toLowerCase() === right.toLowerCase();
}

function canonicalEntryErrors(entry) {
  const definition = COLLECTION_BY_KIND.get(entry.collectionKind);
  if (!definition) return [`unknown collection kind ${entry.collectionKind}`];
  const errors = [];
  const decodedFields = {};
  for (const [field, type] of [['key', definition.keyAbi], ['value', definition.valueAbi]]) {
    if (type === RAW_TYPE_SCHEMA_ENVELOPE) {
      try {
        const inspection = inspectTypeSchemaEnvelope(entry[field]);
        decodedFields[field] = inspection;
      } catch (error) {
        errors.push(`${definition.name} ${field} is not a canonical Type envelope: ${error.message}`);
      }
      continue;
    }
    try {
      const decoded = abi.decode([type], entry[field]);
      decodedFields[field] = decoded[0];
      const reencoded = abi.encode([type], [decoded[0]]);
      if (!compareHex(reencoded, entry[field])) errors.push(`${definition.name} ${field} is noncanonical ABI`);
    } catch (error) {
      errors.push(`${definition.name} ${field} is malformed ABI: ${error.message}`);
    }
  }
  if (errors.length > 0) return errors;

  if (entry.collectionKind === 3 && !compareHex(decodedFields.key, decodedFields.value.typeSchemaId)) {
    errors.push('TYPES key does not match the exact outer codec and payload bytes');
  }

  if (entry.collectionKind === 12) {
    const baseKind = Number(decodedFields.key[0]);
    if (!Object.values(BASE_KINDS).includes(baseKind)) errors.push(`BaseKind ${baseKind} is unknown`);
  }
  if (entry.collectionKind === 7 && !compareHex(decodedFields.key, sourceWitnessId(decodedFields.value))) {
    errors.push('SOURCE_WITNESSES identity key does not match its canonical value');
  }
  if (entry.collectionKind === 23) {
    const counterKind = Number(decodedFields.key[0]);
    if (counterKind < 1 || counterKind > 4) errors.push(`CounterKind ${counterKind} is unknown`);
  }
  if (entry.collectionKind === 24) {
    const authorityKind = Number(decodedFields.value[0]);
    if (authorityKind !== 1 && authorityKind !== 2) errors.push(`Principal authority kind ${authorityKind} is unknown`);
    if (!compareHex(decodedFields.key, principalId(decodedFields.value))) {
      errors.push('PRINCIPALS identity key does not match its canonical value');
    }
  }
  if (entry.collectionKind === 25) {
    const profileKind = Number(decodedFields.value[0]);
    if (profileKind !== 1 && profileKind !== 2) errors.push(`Verifier profile kind ${profileKind} is unknown`);
    if (!compareHex(decodedFields.key, verifierProfileId(decodedFields.value))) {
      errors.push('VERIFIER_PROFILES identity key does not match its canonical value');
    }
  }
  if (entry.collectionKind === 26 && !compareHex(decodedFields.key, admissionPlanId(decodedFields.value))) {
    errors.push('ADMISSION_PLANS identity key does not match its canonical value');
  }
  if (entry.collectionKind === 27 && !compareHex(decodedFields.key, destinationWitnessId(decodedFields.value))) {
    errors.push('DESTINATION_WITNESSES identity key does not match its canonical value');
  }
  if (entry.collectionKind === 28) {
    const descriptorKind = Number(decodedFields.key[0]);
    const commitment = decodedFields.key[1];
    const descriptorBytes = decodedFields.value;
    const descriptorLength = (descriptorBytes.length - 2) / 2;
    if (!Object.values(DESCRIPTOR_KINDS).includes(descriptorKind)) {
      errors.push(`DescriptorKind ${descriptorKind} is unknown`);
    } else if (!compareHex(commitment, descriptorCommitment(descriptorKind, descriptorBytes))) {
      errors.push('DESCRIPTORS key commitment does not match its canonical descriptor bytes');
    }
    if (descriptorLength < 1 || descriptorLength > 4096) {
      errors.push('DESCRIPTORS canonical descriptor must contain 1..4096 bytes');
    }
  }
  return errors;
}

function fullProjectionRelationshipErrors(entries) {
  const errors = [];
  const decoded = new Map();
  for (const entry of entries) {
    const definition = COLLECTION_BY_KIND.get(entry.collectionKind);
    if (!definition || canonicalEntryErrors(entry).length > 0) continue;
    const values = decoded.get(entry.collectionKind) ?? [];
    values.push({
      key: abi.decode([definition.keyAbi], entry.key)[0],
      value: definition.valueAbi === RAW_TYPE_SCHEMA_ENVELOPE
        ? entry.value
        : abi.decode([definition.valueAbi], entry.value)[0],
    });
    decoded.set(entry.collectionKind, values);
  }

  const rows = (kind) => decoded.get(kind) ?? [];
  const idSet = (kind) => new Set(rows(kind).map(({ key }) => key.toLowerCase()));
  const idMap = (kind) => new Map(rows(kind).map(({ key, value }) => [key.toLowerCase(), value]));

  const descriptorCommitmentsByKind = new Map(Object.values(DESCRIPTOR_KINDS).map((kind) => [kind, new Set()]));
  for (const { key } of rows(28)) {
    descriptorCommitmentsByKind.get(Number(key[0]))?.add(key[1].toLowerCase());
  }
  const requireDescriptor = (kind, commitment, context) => {
    if (!descriptorCommitmentsByKind.get(kind)?.has(commitment.toLowerCase())) {
      errors.push(`${context} commitment ${commitment} has no retained DESCRIPTORS preimage of kind ${kind}`);
    }
  };
  for (const { value: revision } of rows(2)) {
    requireDescriptor(DESCRIPTOR_KINDS.COMPONENT, revision[2], 'RealmRevision.component');
    requireDescriptor(DESCRIPTOR_KINDS.EXECUTION_PROFILE, revision[3], 'RealmRevision.executionProfile');
    requireDescriptor(DESCRIPTOR_KINDS.POLICY, revision[4], 'RealmRevision.policy');
    requireDescriptor(DESCRIPTOR_KINDS.ADMINISTRATION, revision[6], 'RealmRevision.administration');
  }
  for (const { value: bootstrap } of rows(1)) {
    requireDescriptor(DESCRIPTOR_KINDS.COMPONENT, bootstrap[2], 'RealmBootstrap.core');
  }

  const typeSchemas = idMap(3);
  const recordValues = idMap(4);
  const records = idSet(4);
  const publications = idMap(5);
  const occurrences = idMap(6);
  const operations = idMap(9);
  const admissions = idMap(10);
  const principals = idSet(24);
  const principalValues = idMap(24);
  const verifierProfiles = idSet(25);
  const admissionPlans = idMap(26);
  const queryProfiles = idMap(17);
  const resolutionPlans = idSet(20);
  const resolutionPlanValues = idMap(20);
  for (const { value: plan } of rows(20)) {
    if (/^0x0{64}$/i.test(plan[0])) errors.push('ResolutionPlan purpose must be nonzero bytes32');
    if (/^0x0{64}$/i.test(plan[1])) errors.push('ResolutionPlan subject must be nonzero bytes32');
  }
  const requirePrincipal = (value, context) => {
    if (!principals.has(value.toLowerCase())) errors.push(`${context} references an unretained Principal`);
  };
  const requireVerifier = (value, context) => {
    if (!verifierProfiles.has(value.toLowerCase())) errors.push(`${context} references an unretained VerifierProfile`);
  };
  const requireRecord = (value, context) => {
    if (!records.has(value.toLowerCase())) errors.push(`${context} references an unretained Record`);
  };
  const requireOperation = (value, context) => {
    if (!operations.has(value.toLowerCase())) errors.push(`${context} references an unretained Operation`);
  };

  for (const { value: publication } of rows(5)) {
    requirePrincipal(publication[0], 'PublicationSet.semanticAuthor');
    requirePrincipal(publication[1], 'PublicationSet.sourcePublicationActor');
    requireVerifier(publication[2], 'PublicationSet.sourceAuthorityProfileId');
    for (const leaf of publication[9]) requireRecord(leaf, 'PublicationSet leaf');
  }
  for (const { key, value: occurrence } of rows(6)) {
    const publication = publications.get(occurrence[0].toLowerCase());
    if (!publication) {
      errors.push('Occurrence references an unretained PublicationSet');
      continue;
    }
    const leafIndex = Number(occurrence[1]);
    if (leafIndex >= publication[9].length) errors.push('Occurrence leafIndex is outside its retained PublicationSet');
    if (!compareHex(key, occurrenceId(occurrence[0], leafIndex))) {
      errors.push('OccurrenceId does not match PublicationSetId and leafIndex');
    }
  }

  for (const { value: witness } of rows(7)) {
    requirePrincipal(witness[1], 'SourceWitness.signer');
    requireVerifier(witness[2], 'SourceWitness.verifierProfileId');
    const publication = publications.get(witness[0].toLowerCase());
    if (!publication) {
      errors.push('SourceWitness references an unretained PublicationSet');
    } else {
      if (!compareHex(witness[1], publication[1])) errors.push('SourceWitness signer differs from PublicationSet source actor');
      if (!compareHex(witness[2], publication[2])) errors.push('SourceWitness verifier profile differs from PublicationSet profile');
    }
    const exactDigest = signatureDigest(witness[0], witness[1], witness[2]);
    if (!compareHex(witness[3], exactDigest)) errors.push('SourceWitness signedDigest is not the exact SIGN digest');
  }
  for (const { value: revision } of rows(2)) {
    requireVerifier(revision[5], 'RealmRevision.verifierProfileId');
  }
  for (const { value: plan } of rows(26)) {
    requirePrincipal(plan[4], 'AdmissionPlan.semanticAuthor');
    requirePrincipal(plan[5], 'AdmissionPlan.actor');
    requireVerifier(plan[6], 'AdmissionPlan.verifierProfileId');
    requirePrincipal(plan[12], 'AdmissionPlan.payer');
    for (const occurrence of plan[0]) {
      if (!occurrences.has(occurrence.toLowerCase())) errors.push('AdmissionPlan references an unretained Occurrence');
    }
  }
  const destinationWitnessesByPlan = new Map();
  for (const { value: witness } of rows(27)) {
    const plan = admissionPlans.get(witness[0].toLowerCase());
    if (!plan) {
      errors.push('DestinationWitness references an unretained AdmissionPlan');
    }
    requirePrincipal(witness[1], 'DestinationWitness.signer');
    if (plan) {
      if (!compareHex(witness[1], plan[5])) errors.push('DestinationWitness signer differs from AdmissionPlan actor');
      const exactDigest = signatureDigest(witness[0], witness[1], plan[6]);
      if (!compareHex(witness[2], exactDigest)) errors.push('DestinationWitness signedDigest is not the exact SIGN digest');
    }
    const witnesses = destinationWitnessesByPlan.get(witness[0].toLowerCase()) ?? [];
    witnesses.push(witness);
    destinationWitnessesByPlan.set(witness[0].toLowerCase(), witnesses);
  }

  for (const { key: operationKey, value: operation } of rows(9)) {
    const plan = admissionPlans.get(operation[0].toLowerCase());
    if (!plan) {
      errors.push('Operation references an unretained AdmissionPlan');
      continue;
    }
    const exactEffectSetId = effectSetIdFromPlanTuple(plan);
    if (!compareHex(operation[1], exactEffectSetId)) {
      errors.push('Operation effectSetId does not match its retained AdmissionPlan effects');
    }
    const exactOperationId = operationId(operation[0], exactEffectSetId);
    if (!compareHex(operationKey, exactOperationId)) {
      errors.push('OperationId does not match its AdmissionPlan and exact effect set');
    }
    if (Number(operation[2]) !== 1) errors.push('retained Operation outcome must be COMMITTED');
  }

  for (const { key, value } of rows(8)) {
    const plan = admissionPlans.get(value[0].toLowerCase());
    const operation = operations.get(value[1].toLowerCase());
    if (!plan) errors.push('NoncePlan references an unretained AdmissionPlan');
    if (!operation) errors.push('NoncePlan references an unretained Operation');
    if (plan) {
      if (!compareHex(key[0], plan[1]) || !compareHex(key[1], plan[4])
          || Number(key[2]) !== Number(plan[7]) || BigInt(key[3]) !== BigInt(plan[8])) {
        errors.push('NoncePlan key does not match the retained AdmissionPlan Realm, author, lane, and nonce');
      }
    }
    if (operation && !compareHex(operation[0], value[0])) errors.push('NoncePlan Operation names a different AdmissionPlan');
  }

  for (const { key: admissionKey, value: receipt } of rows(10)) {
    const occurrence = occurrences.get(receipt[0].toLowerCase());
    const operation = operations.get(receipt[3].toLowerCase());
    if (!occurrence) errors.push('AdmissionReceipt references an unretained Occurrence');
    if (!operation) errors.push('AdmissionReceipt references an unretained Operation');
    if (!compareHex(admissionKey, admissionId(receipt[0], receipt[2], receipt[3], Number(receipt[4])))) {
      errors.push('AdmissionId does not match its exact receipt coordinates');
    }
    if (Number(receipt[4]) < 1 || Number(receipt[4]) > Number(receipt[5])) {
      errors.push('AdmissionReceipt admissionOrdinal must be within 1..admissionHighWater');
    }
    if (receipt[8] !== true) errors.push('retained AdmissionReceipt must be accepted');
    if (operation) {
      const plan = admissionPlans.get(operation[0].toLowerCase());
      if (plan) {
        const ordinal = Number(receipt[4]);
        if (!compareHex(receipt[1], plan[1]) || !compareHex(receipt[2], plan[2])) {
          errors.push('AdmissionReceipt Realm/revision differs from its AdmissionPlan');
        }
        if (!compareHex(receipt[7], plan[6])) errors.push('AdmissionReceipt verifier profile differs from its AdmissionPlan');
        if (ordinal > plan[0].length || !compareHex(plan[0][ordinal - 1], receipt[0])) {
          errors.push('AdmissionReceipt ordinal does not select its Occurrence in AdmissionPlan order');
        }
      }
    }
  }

  for (const { key, value: transcript } of rows(11)) {
    if (!compareHex(key, transcript[0])) errors.push('VerifierTranscript key differs from admissionId');
    const receipt = admissions.get(key.toLowerCase());
    if (!receipt) {
      errors.push('VerifierTranscript references an unretained AdmissionReceipt');
      continue;
    }
    const operation = operations.get(receipt[3].toLowerCase());
    const plan = operation && admissionPlans.get(operation[0].toLowerCase());
    const witnesses = plan ? destinationWitnessesByPlan.get(operation[0].toLowerCase()) ?? [] : [];
    const witness = witnesses.find((candidate) => compareHex(candidate[1], plan[5]));
    if (!witness) {
      errors.push('VerifierTranscript has no retained DestinationWitness for its AdmissionPlan');
      continue;
    }
    if (!compareHex(transcript[1], witness[2])) errors.push('VerifierTranscript digest differs from DestinationWitness signedDigest');
    if (!compareHex(transcript[2], PRINCIPAL_DOMAINS.sign)) errors.push('VerifierTranscript domain is not the exact SIGN domain');
    if (!compareHex(transcript[4], witness[3])) errors.push('VerifierTranscript signature differs from DestinationWitness signature');
    if (!compareHex(transcript[5], plan[6])) errors.push('VerifierTranscript verifier profile differs from AdmissionPlan');
    const signer = principalValues.get(witness[1].toLowerCase());
    if (signer && transcript[3].toLowerCase() !== signer[2].toLowerCase()) {
      errors.push('VerifierTranscript account differs from DestinationWitness signer Principal');
    }
    if (operation && BigInt(transcript[8]) !== BigInt(operation[3])) {
      errors.push('VerifierTranscript execution coordinate differs from Operation');
    }
  }

  for (const { key, value } of rows(12)) {
    const receipt = admissions.get(value[1].toLowerCase());
    if (!receipt) {
      errors.push('BasePosting references an unretained AdmissionReceipt');
      continue;
    }
    if (Number(key[2]) !== Number(receipt[4])) {
      errors.push('BasePosting admissionOrdinal differs from its AdmissionReceipt');
    }
    const occurrence = occurrences.get(receipt[0].toLowerCase());
    const publication = occurrence && publications.get(occurrence[0].toLowerCase());
    const leaf = publication?.[9]?.[Number(occurrence[1])];
    if (!leaf || !compareHex(value[0], leaf)) {
      errors.push('BasePosting RecordId differs from the referenced Occurrence leaf');
    }
  }

  const effectsForOperation = (operationKey) => {
    const operation = operations.get(operationKey.toLowerCase());
    const plan = operation && admissionPlans.get(operation[0].toLowerCase());
    return plan?.[14] ?? [];
  };
  for (const { key, value: head } of [...rows(13), ...rows(14)]) {
    requirePrincipal(key[0], 'Binding');
    requireOperation(head[3], 'Binding');
    if (!head[1]) requireRecord(head[2], 'Binding target');
    const matchingEffect = effectsForOperation(head[3]).some((effect) => (
      Number(effect[0]) === (head[1] ? 2 : 1)
      && compareHex(effect[1], key[0])
      && compareHex(effect[2], key[1])
      && (head[1] || compareHex(effect[3], head[2]))
    ));
    if (!matchingEffect) errors.push('Binding state has no matching effect in its retained Operation Plan');
  }

  for (const { key, value: operation } of rows(16)) {
    requirePrincipal(key[0], 'Withdrawal');
    if (!occurrences.has(key[1].toLowerCase())) errors.push('Withdrawal references an unretained Occurrence');
    requireOperation(operation, 'Withdrawal');
    const matchingEffect = effectsForOperation(operation).some((effect) => (
      Number(effect[0]) === 3 && compareHex(effect[1], key[0]) && compareHex(effect[4], key[1])
    ));
    if (operations.has(operation.toLowerCase()) && !matchingEffect) {
      errors.push('Withdrawal has no matching WITHDRAW effect in its retained Operation Plan');
    }
  }

  const activations = new Set();
  for (const { key, value: profile } of rows(17)) {
    if (!compareHex(key, queryProfileId(profile))) errors.push('QueryProfileId does not match its exact profile');
    const typeSchemaBytes = typeSchemas.get(profile[0].toLowerCase());
    if (!typeSchemaBytes) {
      errors.push('QueryProfile references an unretained Type');
      continue;
    }
    let typeSchema;
    try {
      typeSchema = decodeCanonicalTypeSchemaV0(typeSchemaBytes);
    } catch (error) {
      errors.push(`QueryProfile Type semantics are unavailable: ${error.message}`);
      continue;
    }
    const fields = typeSchema.fields;
    if (profile[1].length === 0) errors.push('QueryProfile requires at least one selector');
    for (const selector of profile[1]) {
      const indexKind = Number(selector[0]);
      const fieldKey = Number(selector[1]);
      if (indexKind !== 1) errors.push(`QueryProfile index kind ${indexKind} is unsupported`);
      if (Number(selector[2]) !== 1) errors.push('QueryProfile exact-bytes maxFanout must equal 1');
      const field = fields.find((candidate) => candidate.fieldKey === fieldKey);
      if (!field) errors.push('QueryProfile selector references an unknown Type field');
      else if (field.scalarKind !== 3) errors.push('EXACT_BYTES_FIELD QueryProfile selector must target a BYTES field');
    }
  }
  for (const { key, value: activation } of rows(18)) {
    const queryProfileIdValue = key[0];
    const generation = Number(key[1]);
    const activationKey = `${queryProfileIdValue.toLowerCase()}:${generation}`;
    activations.add(activationKey);
    if (!compareHex(queryProfileIdValue, activation[1])) errors.push('Query activation QueryProfile key/value mismatch');
    if (generation !== Number(activation[3])) errors.push('Query activation generation key/value mismatch');
    if (!queryProfiles.has(queryProfileIdValue.toLowerCase())) errors.push('Query activation references an unretained QueryProfile');
    requirePrincipal(activation[9], 'Query activation authority');
    requireDescriptor(DESCRIPTOR_KINDS.POLICY, activation[8], 'Query activation policy');
    const activationHighWater = Number(activation[4]);
    const historicalStart = Number(activation[5]);
    const coveredThrough = Number(activation[6]);
    if (historicalStart > coveredThrough) errors.push('Query activation historicalStart exceeds coveredThrough');
    if (coveredThrough > activationHighWater) errors.push('Query activation coveredThrough exceeds activationHighWater');

    const postings = rows(19)
      .filter(({ key: postingKey }) => (
        compareHex(postingKey[0], queryProfileIdValue) && Number(postingKey[1]) === generation
      ))
      .map(({ key: postingKey, value: recordId }) => ({
        indexKey: postingKey[2],
        postingOrdinal: Number(postingKey[3]),
        recordId,
      }))
      .sort((left, right) => left.postingOrdinal - right.postingOrdinal);
    for (const posting of postings) requireRecord(posting.recordId, 'IndexPosting');
    if (postings.some(({ postingOrdinal }, index) => postingOrdinal !== index)) {
      errors.push('Query activation postings ordinals are not the exact contiguous range [0,count)');
    }

    const terminal = Number(activation[7]) === 3;
    const countOption = activation[14];
    const rootOption = activation[15];
    if (terminal) {
      if (coveredThrough !== activationHighWater) {
        errors.push('terminal Query activation coveredThrough must equal activationHighWater');
      }
      if (!countOption[0] || !rootOption[0]) errors.push('terminal Query activation requires terminal count and root');
      if (countOption[0] && Number(countOption[1]) !== postings.length) {
        errors.push('Query activation terminalCount does not equal retained postings count');
      }
      if (rootOption[0] && !compareHex(rootOption[1], terminalPostingsRoot(postings))) {
        errors.push('Query activation terminalPostingsRoot does not match retained postings');
      }
    } else if (countOption[0] || rootOption[0]) {
      errors.push('nonterminal Query activation cannot carry terminal count or root');
    }

    const coverageCounters = rows(23).filter(({ key: counterKey }) => (
      Number(counterKey[0]) === 4
      && compareHex(counterKey[1], activation[0])
      && compareHex(counterKey[2], queryProfileIdValue)
      && Number(counterKey[3]) === generation
    ));
    if (coverageCounters.length !== 1 || Number(coverageCounters[0].value) !== coveredThrough) {
      errors.push('Query activation coverage counter does not equal coveredThrough');
    }
  }
  for (const { key, value: postingRecordId } of rows(19)) {
    if (!activations.has(`${key[0].toLowerCase()}:${Number(key[1])}`)) {
      errors.push('IndexPosting references an unretained Query activation');
    }
    const profile = queryProfiles.get(key[0].toLowerCase());
    if (!profile) continue;
    const typeSchemaId = profile[0];
    const typeSchemaBytes = typeSchemas.get(typeSchemaId.toLowerCase());
    if (!typeSchemaBytes) {
      errors.push('QueryProfile references an unretained Type');
      continue;
    }
    let typeSchema;
    try {
      typeSchema = decodeCanonicalTypeSchemaV0(typeSchemaBytes);
    } catch (error) {
      errors.push(`IndexPosting Type semantics are unavailable: ${error.message}`);
      continue;
    }
    const fields = typeSchema.fields;
    const record = recordValues.get(postingRecordId.toLowerCase());
    if (!record || !compareHex(record[0], typeSchemaId)) {
      errors.push('IndexPosting Record does not carry the QueryProfile exact Type');
      continue;
    }
    let decodedBody;
    try {
      decodedBody = decodeCanonicalBodyV0(typeSchema, record[1]);
    } catch (error) {
      errors.push(`IndexPosting Record body cannot be decoded by QueryProfile Type: ${error.message}`);
      continue;
    }
    let matched = false;
    for (const selector of profile[1]) {
      const indexKind = Number(selector[0]);
      const fieldKey = Number(selector[1]);
      if (indexKind !== 1) {
        errors.push(`QueryProfile index kind ${indexKind} is unsupported`);
        continue;
      }
      const fieldDefinition = fields.find((field) => field.fieldKey === fieldKey);
      if (!fieldDefinition) {
        errors.push('QueryProfile selector references an unknown Type field');
        continue;
      }
      if (fieldDefinition.scalarKind !== 3) {
        errors.push('EXACT_BYTES_FIELD QueryProfile selector must target a BYTES field');
        continue;
      }
      const field = decodedBody.fields.find((candidate) => candidate.fieldKey === fieldKey);
      if (!field || (!field.required && !field.present)) continue;
      if (compareHex(key[2], exactBytesIndexKey(typeSchemaId, fieldKey, field.value))) matched = true;
    }
    if (!matched) errors.push('IndexPosting indexKey does not match its exact Type, BYTES field, and value');
  }
  for (const { key } of rows(23)) {
    if (Number(key[0]) === 4 && !activations.has(`${key[2].toLowerCase()}:${Number(key[3])}`)) {
      errors.push('coverage counter references an unretained Query activation');
    }
  }

  for (const { key, value } of rows(21)) {
    if (!resolutionPlans.has(key[0].toLowerCase()) || !resolutionPlans.has(value[0].toLowerCase())) {
      errors.push('RequiredPointInput references an unretained ResolutionPlan');
    }
    if (!compareHex(key[0], value[0])) errors.push('RequiredPointInput Plan key/value mismatch');
    if (!compareHex(key[1], value[2])) errors.push('RequiredPointInput Position key/value mismatch');
    if (/^0x0{64}$/i.test(value[1])) errors.push('RequiredPointInput fieldRole must be nonzero bytes32');
    const plan = resolutionPlanValues.get(key[0].toLowerCase());
    if (plan) {
      const expectedPosition = positionKey({ purpose: plan[0], subject: plan[1], fieldRole: value[1] });
      if (!compareHex(key[1], expectedPosition) || !compareHex(value[2], expectedPosition)) {
        errors.push('RequiredPointInput PositionKey is outside its ResolutionPlan purpose/subject/fieldRole scope');
      }
      if (plan[2].length !== value[3].length
          || plan[2].some((principal, index) => !compareHex(principal, value[3][index]))) {
        errors.push('RequiredPointInput Principal order differs from its ResolutionPlan');
      }
    }
    for (const principal of value[3]) requirePrincipal(principal, 'RequiredPointInput');
  }
  for (const { key, value } of rows(22)) {
    if (!compareHex(key, value[0])) errors.push('CostCommitment key/value Operation mismatch');
    requireOperation(value[0], 'CostCommitment');
    requirePrincipal(value[1], 'CostCommitment payer');
  }

  const scopeMembers = new Map();
  for (const { key, value: fieldRole } of rows(15)) {
    const [principalId, purpose, subject, ordinalValue] = key;
    const scope = bindingScopeKey({ principalId, purpose, subject }).toLowerCase();
    const members = scopeMembers.get(scope) ?? [];
    members.push({ ordinal: Number(ordinalValue), fieldRole });
    scopeMembers.set(scope, members);
  }
  const scopeCounters = new Map();
  for (const { key, value } of rows(23)) {
    if (Number(key[0]) === 3) scopeCounters.set(key[2].toLowerCase(), Number(value));
  }
  for (const [scope, members] of scopeMembers) {
    members.sort((left, right) => left.ordinal - right.ordinal);
    if (members.some(({ ordinal }, index) => ordinal !== index)) {
      errors.push(`BindingScope ${scope} ordinals are not the exact contiguous range [0,count)`);
    }
    const roles = new Set(members.map(({ fieldRole }) => fieldRole.toLowerCase()));
    if (roles.size !== members.length) {
      errors.push(`BindingScope ${scope} contains a duplicate fieldRole`);
    }
    if (scopeCounters.get(scope) !== members.length) {
      errors.push(`BindingScope ${scope} counter does not equal its exact member count`);
    }
  }
  for (const scope of scopeCounters.keys()) {
    if (!scopeMembers.has(scope)) errors.push(`BindingScope counter ${scope} has no retained members`);
  }
  return errors;
}

function compareEntries(left, right) {
  return left.collectionKind === right.collectionKind
    && compareHex(left.key, right.key)
    && compareHex(left.value, right.value);
}

function projectionOrder(left, right) {
  if (left.collectionKind !== right.collectionKind) return left.collectionKind - right.collectionKind;
  const leftHash = keccak256(left.key);
  const rightHash = keccak256(right.key);
  if (leftHash !== rightHash) return leftHash.localeCompare(rightHash);
  return left.key.toLowerCase().localeCompare(right.key.toLowerCase());
}

function buildPopulatedControlFixture() {
  return sampleValues().map(([kind, key, value]) => encodeEntry(kind, key, value)).sort(projectionOrder);
}

function inspectProjection(expectedEntries, suppliedEntries, {
  claimFullState = false,
  declaredEmptyCollectionKinds = [],
} = {}) {
  const expected = expectedEntries.map((entry) => ({ ...entry }));
  const supplied = suppliedEntries.map((entry) => ({ ...entry }));
  const errors = supplied.flatMap(canonicalEntryErrors);
  const declaredEmpty = Array.isArray(declaredEmptyCollectionKinds)
    ? [...declaredEmptyCollectionKinds]
    : [];
  if (!Array.isArray(declaredEmptyCollectionKinds)) {
    errors.push('declared-empty collection kinds must be an array');
  }
  const declaredSeen = new Set();
  for (const kind of declaredEmpty) {
    if (!Number.isInteger(kind) || !COLLECTION_BY_KIND.has(kind)) {
      errors.push(`declared-empty collection kind ${kind} is unknown`);
    } else if (declaredSeen.has(kind)) {
      errors.push(`declared-empty collection kind ${kind} is duplicated`);
    }
    declaredSeen.add(kind);
  }
  const identityOf = (entry) => `${entry.collectionKind}:${entry.key.toLowerCase()}`;
  const seen = new Set();
  for (const entry of supplied) {
    const identity = identityOf(entry);
    if (seen.has(identity)) errors.push(`duplicate projection entry ${identity}`);
    seen.add(identity);
  }
  for (let index = 1; index < supplied.length; index += 1) {
    if (projectionOrder(supplied[index - 1], supplied[index]) >= 0) {
      errors.push(`projection entries are reordered at index ${index}`);
      break;
    }
  }
  const suppliedCollectionKinds = new Set(supplied.map(({ collectionKind }) => collectionKind));
  for (const kind of declaredSeen) {
    if (suppliedCollectionKinds.has(kind)) errors.push(`declared-empty collection kind ${kind} is populated`);
  }
  const accountedCollectionKinds = COLLECTIONS
    .map(({ kind }) => kind)
    .filter((kind) => suppliedCollectionKinds.has(kind) || declaredSeen.has(kind));
  const hasEveryCollectionKind = accountedCollectionKinds.length === COLLECTIONS.length;
  if (claimFullState && hasEveryCollectionKind) errors.push(...fullProjectionRelationshipErrors(supplied));

  const expectedIdentities = new Set(expected.map(identityOf));
  const missingIdentities = [...expectedIdentities].filter((identity) => !seen.has(identity));
  const unexpectedIdentities = [...seen].filter((identity) => !expectedIdentities.has(identity));
  let integrity = 'MATCHED';
  if (missingIdentities.length > 0 && unexpectedIdentities.length === 0 && supplied.length < expected.length) {
    integrity = 'MISSING_REQUIRED_ITEM';
    errors.push('projection omits at least one required entry');
  } else if (missingIdentities.length > 0
    || unexpectedIdentities.length > 0
    || supplied.length !== expected.length
    || supplied.some((entry, index) => !compareEntries(entry, expected[index]))
    || errors.length > 0) {
    integrity = 'INTEGRITY_FAILED';
    errors.push('projection contains a substituted, duplicated, reordered, or unexpected entry');
  }

  const populatedKinds = [...new Set(supplied.map(({ collectionKind }) => collectionKind))].sort((a, b) => a - b);
  const everyCollectionPopulated = populatedKinds.length === COLLECTIONS.length && hasEveryCollectionKind;
  const normalizedDeclaredEmpty = [...declaredSeen]
    .filter((kind) => COLLECTION_BY_KIND.has(kind))
    .sort((a, b) => a - b);
  const typeEnvelopeInspections = supplied
    .filter(({ collectionKind }) => collectionKind === 3)
    .flatMap((entry) => {
      try {
        const inspected = inspectTypeSchemaEnvelope(entry.value);
        return [{
          typeSchemaId: inspected.typeSchemaId,
          codecVersion: inspected.codecVersion,
          payloadBytes: inspected.payloadBytes,
          rawTypeBytes: inspected.rawTypeBytes,
          support: inspected.support,
          validation: inspected.validation,
          semanticReconstruction: inspected.semanticReconstruction,
        }];
      } catch {
        return [];
      }
    });
  const semanticReconstruction = typeEnvelopeInspections.some(
    ({ semanticReconstruction: status }) => status !== 'COMPLETE',
  ) ? 'INCOMPLETE' : 'COMPLETE';
  return {
    integrity,
    populatedKinds,
    declaredEmptyCollectionKinds: normalizedDeclaredEmpty,
    accountedCollectionKinds,
    fullStateReconstruction: Boolean(
      claimFullState
      && integrity === 'MATCHED'
      && hasEveryCollectionKind
      && semanticReconstruction === 'COMPLETE'
    ),
    semanticReconstruction,
    typeEnvelopeInspections,
    scope: hasEveryCollectionKind
      ? (everyCollectionPopulated ? 'FULL_POPULATED_COLLECTION_CONTROL' : 'FULL_DECLARED_COLLECTION_CONTROL')
      : 'PARTIAL_INVARIANT_CONTROL',
    errors: [...new Set(errors)],
  };
}

function postingValues(postings) {
  return postings.map(({ indexKey, postingOrdinal, recordId }) => [indexKey, postingOrdinal, recordId]);
}

function terminalPostingsRoot(postings) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', `${POSTING}[]`],
    [DOMAIN_POSTINGS, PROFILE_VERSION, postingValues(postings)],
  ));
}

const CURSOR_FIELDS = Object.freeze([
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
]);

function validateCursorCoordinates(cursor, expected) {
  const errors = [];
  for (const field of CURSOR_FIELDS) {
    if (cursor?.[field] !== expected?.[field]) errors.push(`CursorV0 ${field} mismatch`);
  }
  return errors;
}

function postingOrder(left, right) {
  if (left.indexKey !== right.indexKey) return left.indexKey.localeCompare(right.indexKey);
  if (left.postingOrdinal !== right.postingOrdinal) return left.postingOrdinal - right.postingOrdinal;
  return left.recordId.localeCompare(right.recordId);
}

function validateTerminalQueryCompletion(actual, expected) {
  const errors = [];
  if (!Number.isInteger(actual.requestedLimit) || actual.requestedLimit < 1 || actual.requestedLimit > 32) {
    errors.push('requested page limit must be between 1 and 32');
  }
  for (const field of [
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
  ]) {
    if (actual[field] !== expected[field]) errors.push(`terminal query ${field} mismatch`);
  }
  for (const field of ['blockHash', 'stateRoot', 'sourceKind', 'finality', 'freshnessCoordinate']) {
    if (actual.observerBasis?.[field] !== expected.observerBasis?.[field]) {
      errors.push(`terminal query observerBasis.${field} mismatch`);
    }
  }
  if (actual.coveredThroughHighWater !== actual.activationHighWater) {
    errors.push('terminal query coveredThroughHighWater must equal activationHighWater');
  }
  if (actual.terminalCount !== actual.postings.length) {
    errors.push('terminalCount must equal the exact postings length');
  }
  if (actual.terminalPostingsRoot !== terminalPostingsRoot(actual.postings)) {
    errors.push('terminalPostingsRoot does not match the independently recomputed postings root');
  }
  const postingIdentities = new Set();
  for (let index = 0; index < actual.postings.length; index += 1) {
    const posting = actual.postings[index];
    const identity = `${posting.indexKey}:${posting.postingOrdinal}:${posting.recordId}`;
    if (postingIdentities.has(identity)) errors.push(`duplicate PostingV0 at index ${index}`);
    postingIdentities.add(identity);
    if (index > 0 && postingOrder(actual.postings[index - 1], posting) >= 0) {
      errors.push(`PostingV0 order is noncanonical at index ${index}`);
    }
  }
  errors.push(...validateCursorCoordinates(actual.cursor, expected.cursor));
  return errors;
}

function buildTerminalQueryControlFixture() {
  const postings = [
    { indexKey: b32(40), postingOrdinal: 0, recordId: b32(41) },
    { indexKey: b32(40), postingOrdinal: 1, recordId: b32(42) },
  ];
  const observerBasis = {
    blockHash: b32(43),
    stateRoot: b32(44),
    sourceKind: 2,
    finality: 1,
    freshnessCoordinate: 77,
  };
  const completion = {
    realmId: b32(45),
    realmRevisionId: b32(46),
    queryProfileId: b32(47),
    generation: 1,
    ordering: 1,
    activationHighWater: 2,
    coveredThroughHighWater: 2,
    terminalCount: postings.length,
    terminalPostingsRoot: terminalPostingsRoot(postings),
    declaredDomainRoot: keccak256('0x1234'),
    observerBasis,
    requestedLimit: 32,
    postings,
  };
  completion.cursor = {
    realmId: completion.realmId,
    realmRevisionId: completion.realmRevisionId,
    queryProfileId: completion.queryProfileId,
    generation: completion.generation,
    ordering: completion.ordering,
    activationHighWater: completion.activationHighWater,
    coveredThroughHighWater: completion.coveredThroughHighWater,
    executionCoordinate: observerBasis.freshnessCoordinate,
    observerBlockHash: observerBasis.blockHash,
    afterPostingOrdinal: postings.length,
    declaredDomainRoot: completion.declaredDomainRoot,
  };
  return { actual: structuredClone(completion), expected: structuredClone(completion) };
}

function validateRawPointRead({ entries, collectionKind, key, resultV0 }) {
  const errors = [];
  const definition = COLLECTION_BY_KIND.get(collectionKind);
  if (!definition) return [`unknown projection collection kind ${collectionKind}`];
  try {
    const decodedKey = abi.decode([definition.keyAbi], key);
    if (!compareHex(abi.encode([definition.keyAbi], [decodedKey[0]]), key)) {
      errors.push(`${definition.name} point key is noncanonical ABI`);
    }
  } catch (error) {
    return [`${definition.name} point key is malformed ABI: ${error.message}`];
  }

  const expectedSubjectKind = POINT_SUBJECT_KIND_BY_COLLECTION[collectionKind];
  const expectedSubject = encodeCollectionEntrySubject(collectionKind, key);
  errors.push(...validateResultV0(resultV0));
  if (resultV0.kind !== ENUMS.kind.POINT) errors.push('raw getPoint requires ResultV0 kind POINT');
  if (resultV0.subjectKind !== expectedSubjectKind) {
    errors.push(`${definition.name} ResultV0 subjectKind mismatch`);
  }
  if (!compareHex(resultV0.subject, expectedSubject)) {
    errors.push('ResultV0 subject does not equal the exact collection entry subject');
  }

  const entry = entries.find((candidate) => candidate.collectionKind === collectionKind && compareHex(candidate.key, key));
  if (!entry) {
    errors.push('raw getPoint key is not present in the supplied projection');
    return errors;
  }
  try {
    const payload = abi.decode([RESULT_ABI.POINT_PAYLOAD], resultV0.payload.data)[0];
    if (!compareHex(payload[0], key)) errors.push('PointPayloadV0 key does not equal the exact point key');
    if (!payload[1]) errors.push('present projection entry requires PointPayloadV0 valuePresent=true');
    if (!compareHex(payload[2], entry.value)) errors.push('PointPayloadV0 value does not equal canonical projection value bytes');
    if (payload[3]) errors.push('present projection entry cannot claim proofOfLocalAbsence');
  } catch (error) {
    errors.push(`invalid PointPayloadV0: ${error.message}`);
  }
  if (!resultV0.rawRetention.present || !compareHex(resultV0.rawRetention.canonicalBytes, entry.value)) {
    errors.push('raw retention does not preserve the canonical projection value bytes');
  }
  return errors;
}

module.exports = {
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
  validateCursorCoordinates,
  validateRawPointRead,
  validateTerminalQueryCompletion,
  verifierProfileId,
};
