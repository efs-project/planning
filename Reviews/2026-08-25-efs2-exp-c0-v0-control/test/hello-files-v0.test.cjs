'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildHelloFilesScenario,
  fixtureDocument,
  validateHelloFilesScenario,
} = require('../src/hello-files-v0.cjs');
const {
  decodeBytesPayload,
} = require('../src/result-v0.cjs');
const {
  exactBytesIndexKey,
  queryProfileId,
  recordReferenceBaseKey,
} = require('../src/query-projection-v0.cjs');
const {
  recordIdV0,
  typeSchemaIdV0,
} = require('../src/type-interpreter-v0.cjs');

const fixturePath = path.resolve(__dirname, '../hello-files-v0.json');

function errorsAfter(mutator) {
  const value = buildHelloFilesScenario();
  mutator(value);
  return validateHelloFilesScenario(value).join('\n');
}

test('HELLO_FILES is deterministic, checksum-declared, and explicitly nonconformant', () => {
  const scenario = buildHelloFilesScenario();
  const first = fixtureDocument(scenario);
  const second = fixtureDocument(buildHelloFilesScenario());
  const retained = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  assert.deepEqual(first, second);
  assert.deepEqual(retained, first);
  assert.match(first.payloadSha256, /^[0-9a-f]{64}$/);
  assert.equal(first.status, 'DISPOSABLE_INTEGRATION_CONTROL');
  assert.equal(first.protocolConformance, false);
  assert.equal(first.exactExecutableTraceReplayCountDelta, 0);
  assert.deepEqual(validateHelloFilesScenario(scenario), []);
});

test('one story spans four exact Types/Records, two leaves/effects, Lens, bytes, and all 28 accounted collections', () => {
  const scenario = buildHelloFilesScenario();

  assert.deepEqual(Object.keys(scenario.portable.types).sort(), [
    'directory',
    'directoryEntry',
    'file',
    'fileRevision',
  ]);
  assert.deepEqual(Object.keys(scenario.portable.records).sort(), [
    'directory',
    'directoryEntry',
    'file',
    'fileRevision',
  ]);
  assert.equal(scenario.publication.leaves.length, 2);
  assert.equal(scenario.admission.plan.occurrenceIds.length, 2);
  assert.equal(scenario.admission.plan.effects.length, 2);
  assert.equal(scenario.bindings.name.scope.subject, scenario.portable.records.directory.id);
  assert.equal(scenario.query.typedBacklink.baseKind, 2);
  assert.deepEqual(scenario.query.typedBacklinks.map(({ fieldKey }) => fieldKey), [1, 3]);
  assert.notEqual(scenario.query.typedBacklinks[0].baseKey, scenario.query.typedBacklinks[1].baseKey);
  assert.notEqual(scenario.query.postings[0].indexKey, scenario.query.typedBacklinks[0].baseKey);
  assert.notEqual(scenario.query.postings[0].indexKey, scenario.query.typedBacklinks[1].baseKey);
  assert.equal(scenario.lens.nameResolution.selectedRecordId, scenario.portable.records.directoryEntry.id);
  assert.equal(scenario.acquisition.packet.attempts[0].outcome, 2);
  assert.equal(scenario.acquisition.packet.attempts[1].outcome, 1);
  assert.deepEqual(scenario.projection.populatedKinds, [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  ]);
  assert.deepEqual(scenario.projection.declaredEmptyCollectionKinds, [16]);
  assert.equal(scenario.projection.entries.some(({ collectionKind }) => collectionKind === 16), false);
  assert.equal(scenario.projection.entries.length, 57);
  assert.equal(scenario.adapter.sdk.rawResultV0, scenario.result.encoded);
  assert.equal(scenario.adapter.explorer.inspector.rawResultV0, scenario.result.encoded);
  assert.deepEqual(
    scenario.adapter.sdk.rawTypeEnvelopes,
    Object.fromEntries(Object.entries(scenario.portable.types).map(([name, type]) => [name, type.canonicalDescriptor])),
  );
  assert.deepEqual(scenario.adapter.explorer.inspector.rawTypeEnvelopes, scenario.adapter.sdk.rawTypeEnvelopes);
  assert.equal(scenario.portable.types.directory.schema.semanticCommitment.includes('4f626a65637447656e65736973'), true);
  assert.equal(scenario.portable.types.file.schema.semanticCommitment.includes('4f626a65637447656e65736973'), true);
});

test('stable File/Directory object genesis is creator-and-salt based, portable, and name independent', () => {
  const scenario = buildHelloFilesScenario();
  const { objectGenesisControls } = scenario.portable;

  assert.notEqual(objectGenesisControls.sameNameOtherCreatorFileId, scenario.portable.records.file.id);
  assert.equal(objectGenesisControls.sameCreatorSaltRetryFileId, scenario.portable.records.file.id);
  assert.equal(objectGenesisControls.crossRealmCopyFileId, scenario.portable.records.file.id);
  assert.equal(objectGenesisControls.renamedEntryChildId, scenario.portable.records.file.id);
  assert.notEqual(objectGenesisControls.renamedEntryRecordId, scenario.portable.records.directoryEntry.id);
  assert.equal(Object.hasOwn(scenario.portable.records.directory.decoded, 'label'), false);
  assert.equal(Object.hasOwn(scenario.portable.records.file.decoded, 'label'), false);
});

test('file-entry exact roles reject swapped Directory/File targets and name index drift', () => {
  assert.match(errorsAfter((value) => {
    value.portable.records.directoryEntry.decoded.parent = value.portable.records.file.id;
  }), /parent|exact Type/i);

  assert.match(errorsAfter((value) => {
    value.portable.records.directoryEntry.decoded.child = value.portable.records.directory.id;
  }), /child|exact Type/i);

  assert.match(errorsAfter((value) => {
    value.query.value[1][0][1] = 1;
  }), /QueryProfile|BYTES|field/i);

  assert.match(errorsAfter((value) => {
    value.query.postings[0].indexKey = value.ids.unrelated;
  }), /indexKey|exact bytes/i);

  assert.match(errorsAfter((value) => {
    value.query.value[0] = value.portable.types.file.id;
  }), /QueryProfile|DirectoryFileEntry/i);

  assert.match(errorsAfter((value) => {
    value.portable.records.directoryEntry.decoded.name = '0x72656e616d65642e747874';
  }), /indexKey|name BYTES|name bytes/i);
});

test('mutating an exact role target changes Type, Record, query, index, and backlink identities', () => {
  const scenario = buildHelloFilesScenario();
  const mutated = structuredClone(scenario.portable.types.directoryEntry.schema);
  mutated.referenceRoles[1].targetTypeSchemaId = scenario.portable.types.directory.id;
  const mutatedTypeId = typeSchemaIdV0(mutated);
  const mutatedRecordId = recordIdV0(mutatedTypeId, scenario.portable.records.directoryEntry.canonicalBody);
  const mutatedQueryId = queryProfileId([mutatedTypeId, [[1, 2, 1]]]);
  const mutatedIndexKey = exactBytesIndexKey(mutatedTypeId, 2, scenario.portable.records.directoryEntry.decoded.name);
  const mutatedBacklink = recordReferenceBaseKey({
    typeSchemaId: mutatedTypeId,
    fieldKey: 3,
    targetRecordId: scenario.portable.records.file.id,
  });

  assert.notEqual(mutatedTypeId, scenario.portable.types.directoryEntry.id);
  assert.notEqual(mutatedRecordId, scenario.portable.records.directoryEntry.id);
  assert.notEqual(mutatedQueryId, scenario.query.profileId);
  assert.notEqual(mutatedIndexKey, scenario.query.postings[0].indexKey);
  assert.notEqual(mutatedBacklink, scenario.query.typedBacklink.baseKey);
});

test('source and destination witnesses retain their exact SIGN digest', () => {
  assert.match(errorsAfter((value) => {
    value.publication.sourceWitness.value[3] = value.ids.unrelated;
  }), /SourceWitness.*signedDigest|signedDigest.*SourceWitness/i);

  assert.match(errorsAfter((value) => {
    value.admission.destinationWitness.value[2] = value.ids.unrelated;
  }), /DestinationWitness.*signedDigest|signedDigest.*DestinationWitness/i);
});

test('ObjectGenesis creator claims require the signed Publication author/source actor', () => {
  assert.match(errorsAfter((value) => {
    value.publication.value[0] = value.ids.unrelated;
    value.publication.value[1] = value.ids.unrelated;
  }), /creator claim|Publication author/i);
});

test('HELLO_FILES pins reconstructible projection bytes and a canonical BytesPayloadV0', () => {
  const scenario = buildHelloFilesScenario();
  const document = fixtureDocument(scenario);
  assert.deepEqual(document.payload.projection.entries, scenario.projection.entries);
  assert.deepEqual(document.payload.projection.declaredEmptyCollectionKinds, [16]);
  assert.deepEqual(decodeBytesPayload(scenario.result.value.payload.data), {
    recordId: scenario.portable.records.fileRevision.id,
    expectedDigest: scenario.portable.fileDigest,
    bytesPresent: true,
    availableBytes: scenario.portable.fileBytes,
  });

  assert.match(errorsAfter((value) => {
    value.result.value.payload.data = value.portable.fileBytes;
  }), /BytesPayloadV0/i);
});

test('HELLO_FILES source observation evidence and projection activation cannot drift from the Result basis', () => {
  const scenario = buildHelloFilesScenario();
  assert.equal(scenario.query.completion.activationHighWater, 2);
  assert.equal(scenario.query.completion.coveredThroughHighWater, 2);
  assert.equal(scenario.sourceObservation.evidence.observedBlockNumber, 42n);
  assert.equal(scenario.sourceObservation.evidence.observedBlockHash, scenario.result.observerBasis.blockHash);

  assert.match(errorsAfter((value) => {
    value.sourceObservation.evidence.observedBlockHash = value.ids.unrelated;
  }), /source observation.*block hash|block hash.*Result/i);
});

test('cross-link substitutions cannot retain a valid vertical trace', () => {
  assert.match(errorsAfter((value) => {
    value.portable.records.directoryEntry.decoded.child = value.portable.records.directory.id;
  }), /DirectoryEntry child/i);

  assert.match(errorsAfter((value) => {
    value.publication.occurrenceIds[1] = value.publication.occurrenceIds[0];
  }), /OccurrenceId|occurrence/i);

  assert.match(errorsAfter((value) => {
    value.admission.operationId = value.ids.unrelated;
  }), /OperationId/i);

  assert.match(errorsAfter((value) => {
    value.result.observerBasis.stateRoot = value.ids.unrelated;
  }), /observer basis|state root/i);
});

test('missing authority or interpretation preimages fail full reconstruction', () => {
  assert.match(errorsAfter((value) => {
    value.projection.entries = value.projection.entries.filter((entry) => entry.collectionKind !== 24);
  }), /Principal|projection|collection 24/i);

  assert.match(errorsAfter((value) => {
    const component = value.realm.descriptors.component.commitment;
    value.projection.entries = value.projection.entries.filter((entry) => (
      entry.collectionKind !== 28 || !entry.key.toLowerCase().includes(component.slice(2).toLowerCase())
    ));
  }), /descriptor|projection/i);
});

test('full-width directory scope cannot collide with another subject or role', () => {
  assert.match(errorsAfter((value) => {
    value.bindings.name.scope.subject = value.portable.records.file.id;
  }), /directory-scoped|scope subject/i);

  assert.match(errorsAfter((value) => {
    value.bindings.name.fieldRole = value.bindings.revision.fieldRole;
  }), /name role|PositionKey/i);
});

test('typed backlink rejects the wrong closed BaseKind', () => {
  assert.match(errorsAfter((value) => {
    value.query.typedBacklink.baseKind = 1;
  }), /BaseKind|typed backlink/i);
});

test('corrupt-primary/fallback evidence cannot lie about eligibility, digest, or order', () => {
  assert.match(errorsAfter((value) => {
    value.acquisition.packet.attempts[1].eligible = false;
  }), /VERIFIED.*eligible|verified eligible/i);

  assert.match(errorsAfter((value) => {
    value.acquisition.packet.attempts[0].outcome = 1;
  }), /VERIFIED.*digest|primary/i);

  assert.match(errorsAfter((value) => {
    value.acquisition.packet.attempts.reverse();
  }), /ordinal|primary.*first|attempt/i);
});

test('incomplete projection remains visibly incomplete', () => {
  assert.match(errorsAfter((value) => {
    value.projection.entries.splice(7, 1);
  }), /projection omits|projection.*required|collection/i);
});

test('SDK and Explorer adapters cannot replace or drop retained raw truth', () => {
  assert.match(errorsAfter((value) => {
    value.adapter.sdk.rawResultV0 = '0x';
  }), /SDK.*raw ResultV0/i);

  assert.match(errorsAfter((value) => {
    delete value.adapter.explorer.inspector.observerBasis;
  }), /Explorer.*observer basis/i);

  assert.match(errorsAfter((value) => {
    value.adapter.explorer.inspector.canonicalFileBytes = '0x';
  }), /Explorer.*canonical file bytes/i);

  assert.match(errorsAfter((value) => {
    value.adapter.sdk.rawTypeEnvelopes.directoryEntry = '0x';
  }), /SDK.*raw Type envelope/i);

  assert.match(errorsAfter((value) => {
    delete value.adapter.explorer.inspector.rawTypeEnvelopes.fileRevision;
  }), /Explorer.*raw Type envelope/i);
});
