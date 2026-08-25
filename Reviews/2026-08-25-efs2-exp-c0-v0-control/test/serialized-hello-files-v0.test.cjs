'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const domain = (name) => keccak256(toUtf8Bytes(name));
const OBSERVER = 'tuple(bytes32,bytes32,uint8,uint8,uint64)';
const ATTEMPT = `tuple(uint16,bytes32,bytes32,bool,bytes32,bytes32,uint32,uint32,uint32,uint8,${OBSERVER},bytes)`;
const PACKET = `tuple(bytes32,bytes,bytes32,bytes,bytes32,${ATTEMPT}[])`;
const OPT_B32 = 'tuple(bool,bytes32)';
const SOURCE_OBSERVATION = `tuple(bytes32,bytes32,bytes,bytes32,bytes,bytes,uint64,bytes32,bytes32,uint8,uint8,uint8,${OPT_B32},uint8,bytes)`;
const TYPE_SCHEMA_PAYLOAD_V0 = 'tuple(bytes,tuple(tuple(uint16,uint8,bool,uint16)[]),tuple(uint8,uint8),tuple(uint16,uint8)[],tuple(uint16,uint8,bytes32)[])';
const SOURCE_ENDPOINT = 'tuple(uint8,bytes,bytes32,bool)';
const SOURCE_DESCRIPTOR = `tuple(bytes,bytes,bytes32,bytes32,bytes32,bytes32,${SOURCE_ENDPOINT}[],bytes32)`;
const BYTE_READ_REQUEST = 'tuple(bytes32,bytes32,bytes32,uint8,bytes32,uint32,uint32,bytes32,bytes,uint8,uint8)';
const ORIGIN_LINEAGE = 'tuple(bytes,bytes,bytes32)';
const COMPONENT_DESCRIPTOR = 'tuple(address,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint8[])';
const REALM_BOOTSTRAP = 'tuple(bytes,bytes32,bytes32,bytes32,bytes32,uint8[])';
const REALM_REVISION = 'tuple(bytes32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,uint64)';
const REQUIRED_POINT_INPUT = 'tuple(bytes32,bytes32,bytes32,bytes32[])';
const QUERY_PROFILE = 'tuple(bytes32,tuple(uint8,uint16,uint8)[])';

function observerValue(value) {
  return [value.blockHash, value.stateRoot, value.sourceKind, value.finality, value.freshnessCoordinate];
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

function sourceObservationValue(value) {
  return [
    value.resultV0Commitment,
    value.requestCommitment,
    value.requestBytes,
    value.sourceDescriptorCommitment,
    value.sourceDescriptorBytes,
    value.requestedBlockReference,
    value.observedBlockNumber,
    value.observedBlockHash,
    value.observedStateRoot,
    value.canonicalityAssessment,
    value.proofKind,
    value.proofScope,
    [value.proofScopeCommitment.present, value.proofScopeCommitment.value],
    value.causalAvailability,
    value.evidencePointer,
  ];
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

test('pinned HELLO_FILES JSON alone recomputes projection, acquisition, and source-observation commitments', () => {
  const fixture = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../hello-files-v0.json'), 'utf8'));
  const { payload } = fixture;

  assert.equal(
    crypto.createHash('sha256').update(canonicalJson(payload)).digest('hex'),
    fixture.payloadSha256,
  );

  const entries = payload.projection.entries;
  assert.equal(entries.length, payload.projection.entryCount);
  const populated = [...new Set(entries.map(({ collectionKind }) => collectionKind))].sort((a, b) => a - b);
  assert.deepEqual(populated, payload.projection.populatedKinds);
  assert.deepEqual(payload.projection.declaredEmptyCollectionKinds, [16]);
  assert.equal(entries.some(({ collectionKind }) => collectionKind === 16), false);
  assert.deepEqual(
    [...new Set([...populated, ...payload.projection.declaredEmptyCollectionKinds])].sort((a, b) => a - b),
    Array.from({ length: 28 }, (_, index) => index + 1),
  );
  const projectionBytes = abi.encode(
    ['tuple(uint8,bytes,bytes)[]'],
    [entries.map((entry) => [entry.collectionKind, entry.key, entry.value])],
  );
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', 'bytes', 'uint32'],
      [domain('EFS2/EXP-C0/V0/PROJECTION'), VERSION, projectionBytes, entries.length],
    )),
    payload.projection.root,
  );

  const packet = payload.acquisition.packet;
  const packetTuple = [
    packet.requestCommitment,
    packet.requestBytes,
    packet.sourceDescriptorCommitment,
    packet.sourceDescriptorBytes,
    packet.resultV0Commitment,
    packet.attempts.map(attemptValue),
  ];
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', PACKET],
      [domain('EFS2/EXP-C0/V0/ACQUISITION_EVIDENCE'), VERSION, packetTuple],
    )),
    payload.acquisition.commitment,
  );
  assert.equal(packet.resultV0Commitment, payload.result.commitment);
  assert.equal(packet.requestCommitment, payload.acquisition.final.requestCommitment);

  const origin = abi.decode([ORIGIN_LINEAGE], payload.launch.originLineageBytes)[0];
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', ORIGIN_LINEAGE],
      [domain('EFS2/EXP-C0/V0/ORIGIN_LINEAGE'), VERSION, origin],
    )),
    payload.launch.originLineageCommitment,
  );
  const component = abi.decode([COMPONENT_DESCRIPTOR], payload.launch.componentDescriptorBytes)[0];
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', 'uint8', 'bytes'],
      [domain('EFS2/EXP-C0/V0/DESCRIPTOR'), VERSION, 1, payload.launch.componentDescriptorBytes],
    )),
    payload.launch.componentDescriptorCommitment,
  );
  assert.equal(component[0].toLowerCase(), payload.launch.coreAddress.toLowerCase());
  assert.equal(component[1], keccak256(payload.launch.runtimeCodeBytes));
  assert.equal(component[1], payload.launch.coreRuntimeCodeCommitment);

  assert.deepEqual(Object.keys(payload.realm.bootstrap).sort(), [
    'coreCommitment',
    'disclosedPowers',
    'genesisCommitment',
    'initialRevisionCommitment',
    'initialRevisionId',
    'originLineage',
  ]);
  const revision = payload.realm.revision;
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', 'uint32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64'],
      [
        domain('EFS2/EXP-C0/V0/INITIAL_REVISION'),
        VERSION,
        revision.generation,
        revision.componentCommitment,
        revision.executionProfileId,
        revision.policyId,
        revision.verifierProfileId,
        revision.administrationCommitment,
        revision.activationStart,
        revision.activationEndExclusive,
      ],
    )),
    payload.realm.bootstrap.initialRevisionCommitment,
  );
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', 'bytes', 'bytes32', 'bytes32', 'bytes32', 'uint8[]'],
      [
        domain('EFS2/EXP-C0/V0/REALM'),
        VERSION,
        payload.realm.bootstrap.originLineage,
        payload.realm.bootstrap.genesisCommitment,
        payload.realm.bootstrap.coreCommitment,
        payload.realm.bootstrap.initialRevisionCommitment,
        payload.realm.bootstrap.disclosedPowers,
      ],
    )),
    payload.realm.id,
  );
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', REALM_REVISION],
      [domain('EFS2/EXP-C0/V0/REALM_REVISION'), VERSION, [
        revision.realmId,
        revision.generation,
        revision.componentCommitment,
        revision.executionProfileId,
        revision.policyId,
        revision.verifierProfileId,
        revision.administrationCommitment,
        revision.activationStart,
        revision.activationEndExclusive,
      ]],
    )),
    payload.realm.bootstrap.initialRevisionId,
  );
  const bootstrapEntry = entries.find(({ collectionKind }) => collectionKind === 1);
  const decodedBootstrap = abi.decode([REALM_BOOTSTRAP], bootstrapEntry.value)[0];
  assert.deepEqual(
    [...decodedBootstrap].map((item) => Array.isArray(item) ? item.map(Number) : item.toString()),
    [
      payload.realm.bootstrap.originLineage,
      payload.realm.bootstrap.genesisCommitment,
      payload.realm.bootstrap.coreCommitment,
      payload.realm.bootstrap.initialRevisionCommitment,
      payload.realm.bootstrap.initialRevisionId,
      payload.realm.bootstrap.disclosedPowers,
    ],
  );

  const sourceDescriptor = abi.decode([SOURCE_DESCRIPTOR], packet.sourceDescriptorBytes)[0];
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', SOURCE_DESCRIPTOR],
      [domain('EFS2/EXP-C0/V0/SOURCE_DESCRIPTOR'), VERSION, sourceDescriptor],
    )),
    packet.sourceDescriptorCommitment,
  );
  assert.equal(sourceDescriptor[2], payload.launch.originLineageCommitment);
  assert.equal(sourceDescriptor[3], payload.launch.componentDescriptorCommitment);
  assert.equal(sourceDescriptor[4], payload.launch.realmId);
  assert.equal(sourceDescriptor[5], payload.launch.realmRevisionId);
  for (const [index, endpoint] of sourceDescriptor[6].entries()) {
    assert.equal(endpoint[3], packet.attempts[index].eligible);
  }

  const request = abi.decode([BYTE_READ_REQUEST], packet.requestBytes)[0];
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', BYTE_READ_REQUEST],
      [domain('EFS2/EXP-C0/V0/BYTE_READ_REQUEST'), VERSION, request],
    )),
    packet.requestCommitment,
  );
  assert.equal(request[0], payload.launch.realmId);
  assert.equal(request[1], payload.launch.realmRevisionId);
  assert.equal(request[2], payload.portable.recordIds.fileRevision);
  assert.equal(request[3], 1n);
  assert.equal(request[4], payload.portable.fileDigest);
  assert.equal(request[7], packet.sourceDescriptorCommitment);
  assert.ok(request[5] + request[6] <= 0xffff_ffffn);

  const evidence = payload.sourceObservation.evidence;
  const encodedEvidence = abi.encode([SOURCE_OBSERVATION], [sourceObservationValue(evidence)]);
  assert.equal(encodedEvidence, payload.sourceObservation.encoded);
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', SOURCE_OBSERVATION],
      [domain('EFS2/EXP-C0/V0/SOURCE_OBSERVATION_EVIDENCE'), VERSION, sourceObservationValue(evidence)],
    )),
    payload.sourceObservation.commitment,
  );
  assert.equal(evidence.resultV0Commitment, payload.result.commitment);
  assert.equal(evidence.requestCommitment, packet.requestCommitment);
  assert.equal(evidence.sourceDescriptorCommitment, payload.launch.sourceDescriptorCommitment);
  assert.equal(evidence.requestBytes, payload.launch.requestBytes);
  assert.equal(evidence.sourceDescriptorBytes, payload.launch.sourceDescriptorBytes);
  assert.equal(evidence.observedBlockHash, payload.result.observerBasis.blockHash);
  assert.equal(evidence.observedStateRoot, payload.result.observerBasis.stateRoot);
  assert.equal(evidence.observedBlockNumber, payload.result.observerBasis.freshnessCoordinate);
  assert.equal(evidence.canonicalityAssessment, 2);
  assert.equal(evidence.proofKind, 1);
  assert.equal(evidence.proofScope, 1);
  assert.deepEqual(evidence.proofScopeCommitment, { present: false, value: `0x${'00'.repeat(32)}` });
  assert.equal(evidence.causalAvailability, 1);
  const selected = packet.attempts.find((attempt) => attempt.outcome === 1 && attempt.eligible);
  assert.deepEqual(selected.observerBasis, payload.acquisition.final.observerBasis);

  const fileEntryTypeId = payload.portable.typeSchemaIds.directoryEntry;
  const fileEntryRecordId = payload.portable.recordIds.directoryEntry;
  const typeEntry = entries.find(({ collectionKind, key }) => (
    collectionKind === 3 && key.toLowerCase() === fileEntryTypeId.toLowerCase()
  ));
  const typeEnvelope = abi.decode(['uint16', 'bytes'], typeEntry.value);
  assert.equal(typeEnvelope[0], 0n);
  const typeSchema = abi.decode([TYPE_SCHEMA_PAYLOAD_V0], typeEnvelope[1])[0];
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', 'uint16', 'bytes'],
      [domain('EFS2/EXP-C0/V0/TYPE'), VERSION, typeEnvelope[0], typeEnvelope[1]],
    )),
    fileEntryTypeId,
  );
  assert.equal(typeSchema[4][0][0], 1n);
  assert.equal(typeSchema[4][0][1], 1n);
  assert.equal(typeSchema[4][0][2], payload.portable.typeSchemaIds.directory);
  assert.equal(typeSchema[4][1][0], 3n);
  assert.equal(typeSchema[4][1][1], 1n);
  assert.equal(typeSchema[4][1][2], payload.portable.typeSchemaIds.file);
  assert.deepEqual(payload.portable.typeEnvelopes.directoryEntry, {
    codecVersion: 0,
    payloadBytes: typeEnvelope[1],
    rawTypeBytes: typeEntry.value,
    semanticReconstruction: 'COMPLETE',
    support: 'SUPPORTED',
    typeSchemaId: fileEntryTypeId,
    validation: 'SEMANTICALLY_VALID',
  });
  assert.equal(payload.adapter.sdk.rawTypeEnvelopesRef, '#/payload/portable/typeEnvelopes');
  assert.equal(payload.adapter.explorer.inspector.rawTypeEnvelopesRef, '#/payload/portable/typeEnvelopes');

  const recordEntry = entries.find(({ collectionKind, key }) => (
    collectionKind === 4 && key.toLowerCase() === fileEntryRecordId.toLowerCase()
  ));
  const record = abi.decode(['tuple(bytes32,bytes)'], recordEntry.value)[0];
  assert.equal(record[0], fileEntryTypeId);
  const bodyCommitment = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes'],
    [domain('EFS2/EXP-C0/V0/BODY'), VERSION, record[1]],
  ));
  assert.equal(
    keccak256(abi.encode(
      ['bytes32', 'uint16', 'bytes32', 'bytes32'],
      [domain('EFS2/EXP-C0/V0/RECORD'), VERSION, fileEntryTypeId, bodyCommitment],
    )),
    fileEntryRecordId,
  );
  const [, nameBytes, childRecordId, childIsDirectory] = abi.decode(
    ['bytes32', 'bytes', 'bytes32', 'bool'],
    record[1],
  );
  assert.equal(childRecordId, payload.portable.recordIds.file);
  assert.equal(childIsDirectory, false);

  const queryEntry = entries.find(({ collectionKind, key }) => (
    collectionKind === 17 && key.toLowerCase() === payload.query.profileId.toLowerCase()
  ));
  const queryProfile = abi.decode([QUERY_PROFILE], queryEntry.value)[0];
  assert.equal(queryProfile[0], fileEntryTypeId);
  assert.deepEqual([...queryProfile[1][0]], [1n, 2n, 1n]);
  const postingEntry = entries.find(({ collectionKind }) => collectionKind === 19);
  const postingKey = abi.decode(['tuple(bytes32,uint32,bytes32,uint32)'], postingEntry.key)[0];
  const exactNameIndexKey = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'uint16', 'bytes'],
    [domain('EFS2/EXP-C0/V0/INDEX/EXACT_BYTES'), VERSION, fileEntryTypeId, 2, nameBytes],
  ));
  assert.equal(postingKey[2], exactNameIndexKey);
  assert.equal(abi.decode(['bytes32'], postingEntry.value)[0], fileEntryRecordId);

  for (const backlink of payload.query.typedBacklinks) {
    const recomputed = keccak256(abi.encode(
      ['bytes32', 'uint16', 'bytes32', 'uint16', 'bytes32'],
      [
        domain('EFS2/EXP-C0/V0/BASE/RECORD_REFERENCE'),
        VERSION,
        backlink.typeSchemaId,
        backlink.fieldKey,
        backlink.targetRecordId,
      ],
    ));
    assert.equal(backlink.baseKey, recomputed);
    assert.notEqual(backlink.baseKey, exactNameIndexKey);
  }

  for (const entry of entries.filter(({ collectionKind }) => collectionKind === 21)) {
    const key = abi.decode(['tuple(bytes32,bytes32)'], entry.key)[0];
    const required = abi.decode([REQUIRED_POINT_INPUT], entry.value)[0];
    assert.equal(required[0], key[0]);
    assert.equal(required[2], key[1]);
  }
});
