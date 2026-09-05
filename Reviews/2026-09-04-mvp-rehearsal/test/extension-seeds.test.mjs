import test from 'node:test';
import assert from 'node:assert/strict';
import { withLabChain } from '../scripts/local-chain.mjs';
import { seedLab } from '../scripts/bootstrap.mjs';
import { createLabSdk, deriveSchemaId, encodeTypedPayload } from '../sdk/index.js';

test('extension fixtures retain both game releases, exact typed challenges and a paginated directory', { timeout: 120000 }, async () => {
  await withLabChain(async lab => {
    const config = await seedLab(lab);
    assert.equal(config.game.revision, 2);
    assert.equal(config.game.legacy.revision, 1);
    assert.notEqual(config.game.contentId, config.game.legacy.contentId);
    assert.equal(config.game.challengeSchemaId, deriveSchemaId('0x03'));
    assert.equal(config.game.challengeIds.length, 2);
    const sdk = createLabSdk({ deployment: lab.deployment,
      readProvider: { request: ({ method, params = [] }) => lab.provider.send(method, params) } });
    const root = await sdk.readExact({ kind: 'node', id: lab.deployment.rootId });
    for (const [revision, contentId] of [[1, config.game.legacy.contentId], [2, config.game.contentId]]) {
      const read = await sdk.readExact({ kind: 'revision', file: config.game.fileId, revision, blockTag: root.basis });
      assert.equal(read.value.contentId, contentId);
      assert.equal((await sdk.readVerifiedBytes({ contentId, blockTag: root.basis })).qualification.integrity, 'VERIFIED');
    }
    for (const [index, id] of config.game.challengeIds.entries()) {
      const record = await sdk.readExact({ kind: 'record', id, blockTag: root.basis });
      assert.equal(record.value.schemaId, config.game.challengeSchemaId);
      const bytes = await sdk.readVerifiedBytes({ contentId: record.value.contentId, blockTag: root.basis });
      assert.equal(bytes.value.bytes, encodeTypedPayload('0x03', [`0x${index === 0 ? '11'.repeat(32) : '22'.repeat(32)}`]));
    }
    const page = await sdk.readPage({ kind: 'children', directory: config.pagination.directoryId, limit: 8, blockTag: root.basis });
    assert.equal(page.items.length, 8);
    assert.equal(page.qualification.coverage, 'PARTIAL');
    assert.equal(config.pagination.count, 11);
    for (const [index, number] of [42n, 9007199254740993n, 18446744073709551615n].entries()) {
      const record = await sdk.readExact({ kind: 'record', id: config.data.numericRecordIds[index], blockTag: root.basis });
      const bytes = await sdk.readVerifiedBytes({ contentId: record.value.contentId, blockTag: root.basis });
      const decoded = await sdk.validateTypedPayloadAtBasis({ schemaId: record.value.schemaId, data: bytes.value.bytes, blockTag: root.basis });
      assert.equal(decoded.valid, true);
      assert.equal(decoded.fields[1], number);
    }
  }, { compileFirst: false });
});
