const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  bootstrapRealm,
  createState,
  encodeCursor,
  ids,
  projectState,
  putPortableArtifacts,
} = require('../src/model.cjs');

const vectorPath = path.resolve(__dirname, '../vectors/essential-v0.json');
const vector = JSON.parse(fs.readFileSync(vectorPath, 'utf8'));

test('independently emitted ABI-v2 control vector matches the pure model', () => {
  const { inputs, expected } = vector;
  const principalId = ids.principal(inputs.alice);
  const realmId = ids.realm(inputs.bootstrap);
  const revisionId = ids.realmRevision(realmId, 0, inputs.bootstrap);
  const typeId = ids.type(inputs.typeNote);
  const recordAId = ids.record(typeId, inputs.recordA.body);
  const recordBId = ids.record(typeId, inputs.recordB.body);
  const publicationId = ids.publication(inputs.publication);

  assert.equal(principalId, expected.principalId);
  assert.equal(ids.initialRevision(inputs.bootstrap), expected.initialRevisionCommitment);
  assert.equal(realmId, expected.realmId);
  assert.equal(revisionId, expected.realmRevisionId);
  assert.equal(typeId, expected.typeSchemaId);
  assert.equal(recordAId, expected.recordAId);
  assert.equal(recordBId, expected.recordBId);
  assert.equal(publicationId, expected.publicationSetId);
  assert.equal(ids.occurrence(publicationId, 0), expected.occurrence0Id);
  assert.equal(ids.occurrence(publicationId, 1), expected.occurrence1Id);
  assert.equal(encodeCursor(inputs.cursor), expected.cursorBytes);
  assert.equal(ids.cursor(inputs.cursor), expected.cursorCommitment);

  let state = createState();
  ({ state } = bootstrapRealm(state, inputs.bootstrap));
  state = putPortableArtifacts(state, {
    typeId,
    typeSchema: inputs.typeNote,
    records: [
      { id: recordAId, typeId, body: inputs.recordA.body },
      { id: recordBId, typeId, body: inputs.recordB.body },
    ],
    publicationId,
    publication: inputs.publication,
  });
  const projection = projectState(state);
  assert.equal(projection.finiteInventoryCount.toString(), expected.finiteInventoryCount);
  assert.equal(projection.projectionRoot, expected.projectionRoot);
});

test('vector pins the exact disposable profile and never claims protocol conformance', () => {
  assert.equal(vector.format, 'efs2-exp-c0-v0-essential-vector/0');
  assert.equal(vector.profileVersion, 0);
  assert.equal(vector.protocolConformance, false);
  assert.equal(vector.durable, false);
  assert.equal(vector.codec, 'OUTER_ABI_UINT16_BYTES_PLUS_PAYLOAD_V0');
  assert.equal(vector.inputs.typeEnvelope.codecVersion, 0);
});

test('pinned vector is value-for-value current with the independent emitter', () => {
  const emitted = execFileSync(
    process.execPath,
    [path.resolve(__dirname, '../scripts/build-essential-vector.cjs')],
    { encoding: 'utf8' },
  );
  assert.deepEqual(JSON.parse(emitted), vector);
});
