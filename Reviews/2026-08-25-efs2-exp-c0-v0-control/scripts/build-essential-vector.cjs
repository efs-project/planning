'use strict';

// Independent vector emitter. It intentionally duplicates the candidate ABI
// contract and imports no model/SUT helper. Its stdout is reviewed and pinned
// as vectors/essential-v0.json.
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, hexlify, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const ZERO_HASH = `0x${'00'.repeat(32)}`;
const b32 = (byte) => `0x${byte.repeat(32)}`;
const addr = (byte) => `0x${byte.repeat(20)}`;
const utf8Hex = (value) => hexlify(toUtf8Bytes(value));
const D = (name) => keccak256(toUtf8Bytes(name));

const domainNames = {
  REALM: 'EFS2/EXP-C0/V0/REALM',
  INITIAL_REVISION: 'EFS2/EXP-C0/V0/INITIAL_REVISION',
  REALM_REVISION: 'EFS2/EXP-C0/V0/REALM_REVISION',
  PRINCIPAL: 'EFS2/EXP-C0/V0/PRINCIPAL',
  TYPE: 'EFS2/EXP-C0/V0/TYPE',
  BODY: 'EFS2/EXP-C0/V0/BODY',
  RECORD: 'EFS2/EXP-C0/V0/RECORD',
  PUBLICATION: 'EFS2/EXP-C0/V0/PUBLICATION',
  OCCURRENCE: 'EFS2/EXP-C0/V0/OCCURRENCE',
  QUERY_PROFILE: 'EFS2/EXP-C0/V0/QUERY_PROFILE',
  CURSOR: 'EFS2/EXP-C0/V0/CURSOR',
  PROJECTION: 'EFS2/EXP-C0/V0/PROJECTION',
};
const domains = Object.fromEntries(Object.entries(domainNames).map(([key, value]) => [key, D(value)]));

const TYPE_SCHEMA_PAYLOAD_V0_ABI = 'tuple(bytes,tuple(tuple(uint16,uint8,bool,uint16)[]),tuple(uint8,uint8),tuple(uint16,uint8)[],tuple(uint16,uint8,bytes32)[])';
const REALM_BOOTSTRAP_ABI = 'tuple(bytes,bytes32,bytes32,bytes32,bytes32,uint8[])';
const REALM_REVISION_ABI = 'tuple(bytes32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,uint64)';
const PUBLICATION_ABI = 'tuple(bytes32,bytes32,bytes32,uint32,uint32,uint64,uint64,uint8,uint8,bytes32[])';
const CURSOR_ABI = 'tuple(bytes32,bytes32,bytes32,uint32,uint8,uint32,uint32,uint64,bytes32,uint32,bytes32)';

const alice = {
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
  activationStart: 0,
  activationEndExclusive: '18446744073709551615',
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
  referenceRoles: [{ fieldKey: 2, targetKind: 2, targetTypeSchemaId: ZERO_HASH }],
};

const typePayloadValue = [
  typeNote.semanticCommitment,
  [typeNote.fields.map((field) => [field.fieldKey, field.scalarKind, field.required, field.maxLengthOrCount])],
  [typeNote.fieldOrder, typeNote.encoding],
  typeNote.intrinsicConstraints.map((constraint) => [constraint.fieldKey, constraint.rule]),
  typeNote.referenceRoles.map((role) => [role.fieldKey, role.targetKind, role.targetTypeSchemaId]),
];
const typePayloadBytes = abi.encode([TYPE_SCHEMA_PAYLOAD_V0_ABI], [typePayloadValue]);
const typeBytes = abi.encode(['uint16', 'bytes'], [0, typePayloadBytes]);

const principalId = keccak256(abi.encode(
  ['bytes32', 'uint16', 'tuple(uint8,bytes,address)'],
  [domains.PRINCIPAL, VERSION, [alice.authorityKind, alice.originLineage, alice.account]],
));

const initialRevisionCommitment = keccak256(abi.encode(
  ['bytes32', 'uint16', 'uint32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64'],
  [
    domains.INITIAL_REVISION,
    VERSION,
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

const realmId = keccak256(abi.encode(
  ['bytes32', 'uint16', 'bytes', 'bytes32', 'bytes32', 'bytes32', 'uint8[]'],
  [
    domains.REALM,
    VERSION,
    bootstrap.originLineage,
    bootstrap.genesisCommitment,
    bootstrap.coreCommitment,
    initialRevisionCommitment,
    bootstrap.disclosedPowers,
  ],
));

const revisionValue = [
  realmId,
  0,
  bootstrap.componentCommitment,
  bootstrap.executionProfileId,
  bootstrap.policyId,
  bootstrap.verifierProfileSetId,
  bootstrap.administrationCommitment,
  bootstrap.activationStart,
  bootstrap.activationEndExclusive,
];
const realmRevisionId = keccak256(abi.encode(
  ['bytes32', 'uint16', REALM_REVISION_ABI],
  [domains.REALM_REVISION, VERSION, revisionValue],
));

const typeSchemaId = keccak256(abi.encode(
  ['bytes32', 'uint16', 'uint16', 'bytes'],
  [domains.TYPE, VERSION, 0, typePayloadBytes],
));

const recordABody = abi.encode(['bytes', 'tuple(bool,bytes32)'], [utf8Hex('alpha'), [false, ZERO_HASH]]);
const recordAId = recordId(typeSchemaId, recordABody);
const recordBBody = abi.encode(['bytes', 'tuple(bool,bytes32)'], [utf8Hex('beta'), [true, recordAId]]);
const recordBId = recordId(typeSchemaId, recordBBody);

function recordId(schemaId, body) {
  const bodyHash = keccak256(abi.encode(['bytes32', 'uint16', 'bytes'], [domains.BODY, VERSION, body]));
  return keccak256(abi.encode(['bytes32', 'uint16', 'bytes32', 'bytes32'], [domains.RECORD, VERSION, schemaId, bodyHash]));
}

const publication = {
  author: alice,
  sourceActor: alice,
  verifierProfileId: b32('91'),
  sourceAuthorityEpoch: 0,
  nonceLane: 0,
  nonce: 7,
  expiryCoordinate: 100,
  visibility: 1,
  suites: 1,
  recordIds: [recordAId, recordBId],
};
const publicationValue = [
  principalId,
  principalId,
  publication.verifierProfileId,
  publication.sourceAuthorityEpoch,
  publication.nonceLane,
  publication.nonce,
  publication.expiryCoordinate,
  publication.visibility,
  publication.suites,
  publication.recordIds,
];
const publicationSetId = keccak256(abi.encode(
  ['bytes32', 'uint16', PUBLICATION_ABI],
  [domains.PUBLICATION, VERSION, publicationValue],
));
const occurrence0Id = keccak256(abi.encode(
  ['bytes32', 'uint16', 'bytes32', 'uint16'],
  [domains.OCCURRENCE, VERSION, publicationSetId, 0],
));
const occurrence1Id = keccak256(abi.encode(
  ['bytes32', 'uint16', 'bytes32', 'uint16'],
  [domains.OCCURRENCE, VERSION, publicationSetId, 1],
));

const queryProfileValue = [typeSchemaId, [[1, 1, 1]]];
const queryProfileId = keccak256(abi.encode(
  ['bytes32', 'uint16', 'tuple(bytes32,tuple(uint8,uint16,uint8)[])'],
  [domains.QUERY_PROFILE, VERSION, queryProfileValue],
));
const cursor = {
  realmId,
  realmRevisionId,
  queryProfileId,
  generation: 1,
  ordering: 1,
  activationHighWater: 2,
  coveredThroughHighWater: 1,
  executionCoordinate: 42,
  observerBlockHash: b32('a5'),
  afterPostingOrdinal: 1,
  declaredDomainRoot: keccak256(toUtf8Bytes('T_NOTE/admissions/0..2')),
};
const cursorValue = [
  cursor.realmId,
  cursor.realmRevisionId,
  cursor.queryProfileId,
  cursor.generation,
  cursor.ordering,
  cursor.activationHighWater,
  cursor.coveredThroughHighWater,
  cursor.executionCoordinate,
  cursor.observerBlockHash,
  cursor.afterPostingOrdinal,
  cursor.declaredDomainRoot,
];
const cursorBytes = abi.encode([CURSOR_ABI], [cursorValue]);
const cursorCommitment = keccak256(abi.encode(
  ['bytes32', 'uint16', CURSOR_ABI],
  [domains.CURSOR, VERSION, cursorValue],
));

const bootstrapValue = [
  bootstrap.originLineage,
  bootstrap.genesisCommitment,
  bootstrap.coreCommitment,
  initialRevisionCommitment,
  realmRevisionId,
  bootstrap.disclosedPowers,
];

const entries = [
  [1, abi.encode(['bytes32'], [realmId]), abi.encode([REALM_BOOTSTRAP_ABI], [bootstrapValue])],
  [2, abi.encode(['bytes32', 'uint32'], [realmId, 0]), abi.encode([REALM_REVISION_ABI], [revisionValue])],
  [3, abi.encode(['bytes32'], [typeSchemaId]), typeBytes],
  [4, abi.encode(['bytes32'], [recordAId]), abi.encode(['tuple(bytes32,bytes)'], [[typeSchemaId, recordABody]])],
  [4, abi.encode(['bytes32'], [recordBId]), abi.encode(['tuple(bytes32,bytes)'], [[typeSchemaId, recordBBody]])],
  [5, abi.encode(['bytes32'], [publicationSetId]), abi.encode([PUBLICATION_ABI], [publicationValue])],
  [23, abi.encode([], []), abi.encode(['uint32', 'uint32', 'uint32', 'uint32'], [0, 0, 0, 0])],
];
entries.sort((a, b) => {
  if (a[0] !== b[0]) return a[0] - b[0];
  const ah = keccak256(a[1]);
  const bh = keccak256(b[1]);
  if (ah !== bh) return ah.localeCompare(bh);
  return a[1].localeCompare(b[1]);
});
const projectionPayload = abi.encode(['tuple(uint8,bytes,bytes)[]'], [entries]);
const finiteInventoryCount = entries.length;
const projectionRoot = keccak256(abi.encode(
  ['bytes32', 'uint16', 'bytes', 'uint32'],
  [domains.PROJECTION, VERSION, projectionPayload, finiteInventoryCount],
));

const vector = {
  format: 'efs2-exp-c0-v0-essential-vector/0',
  profileVersion: VERSION,
  protocolConformance: false,
  durable: false,
  codec: 'OUTER_ABI_UINT16_BYTES_PLUS_PAYLOAD_V0',
  domains,
  inputs: {
    alice,
    bootstrap,
    typeNote,
    typeEnvelope: { codecVersion: 0, payloadBytes: typePayloadBytes, typeBytes },
    recordA: { body: recordABody },
    recordB: { body: recordBBody },
    publication,
    cursor,
  },
  expected: {
    principalId,
    initialRevisionCommitment,
    realmId,
    realmRevisionId,
    typeSchemaId,
    recordAId,
    recordBId,
    publicationSetId,
    occurrence0Id,
    occurrence1Id,
    queryProfileId,
    cursorBytes,
    cursorCommitment,
    finiteInventoryCount: String(finiteInventoryCount),
    projectionRoot,
  },
};

const serialized = `${JSON.stringify(vector, null, 2)}\n`;
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.resolve(__dirname, '../vectors/essential-v0.json'), serialized);
} else {
  process.stdout.write(serialized);
}
