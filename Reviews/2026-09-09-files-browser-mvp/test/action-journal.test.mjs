import test from 'node:test';
import assert from 'node:assert/strict';
const api = await import('../web/action-journal.mjs').catch(() => ({}));
const context = { environmentId: 'source/deploy-1', chainId: '31337', core: 'core', executionId: 'exec', principal: 'alice', account: '0xabc', mountId: 'mount', lensId: 'aFirst', destinationId: 'folder' };
const memory = () => { let value = null; return { getItem: () => value, setItem: (_, v) => { value = v; } }; };
test('reload preserves unresolved nonce guard; expiration needs chain time, reset cannot clear it', () => {
  assert.equal(typeof api.createActionJournal, 'function', 'public recovery journal is available');
  const storage = memory(); const journal = api.createActionJournal(storage);
  journal.begin({ actionId: 'a', label: 'create', context, nonce: '7', deadline: '100', signature: 'SECRET', bytes: 'PRIVATE' });
  journal.mark('a', { authorization: 'unknown' }); journal.resetDisplay();
  const restored = api.createActionJournal(storage);
  assert.equal(restored.conflict(context, '7', '99').actionId, 'a');
  assert.equal(restored.conflict(context, '7', '101'), null);
  assert.equal(restored.conflict({ ...context, environmentId: 'source/deploy-2' }, '7', '99'), null);
  assert(!restored.export().includes('SECRET')); assert(!restored.export().includes('PRIVATE'));
});
test('context is deeply captured, storage failure refuses begin, byte metadata has no bytes', () => {
  assert.equal(typeof api.createActionJournal, 'function');
  const storage = memory(), journal = api.createActionJournal(storage), mutable = { ...context };
  journal.begin({ actionId: 'a', label: 'upload', context: mutable, nonce: '1', deadline: '2', content: { treeId: 'tree', size: '3', chunkCount: 1, data: 'PRIVATE', chunks: ['PRIVATE'] } });
  mutable.account = 'swapped'; assert.equal(journal.entries()[0].context.account, '0xabc');
  assert.deepEqual(journal.entries()[0].content, { treeId: 'tree', size: '3', chunkCount: 1 });
  assert.throws(() => journal.mark('a', { context: mutable }), /immutable/);
  assert.throws(() => api.createActionJournal({ getItem: () => null, setItem: () => { throw Error('quota'); } }).begin({ actionId: 'a', label: 'x', context, nonce: '1', deadline: '2' }), /Recovery storage/);
});
test('provider account and chain guards reject swaps before a wallet prompt', async () => {
  assert.equal(typeof api.assertWalletContext, 'function');
  const provider = { request: async ({ method }) => method === 'eth_accounts' ? ['0xabc'] : '0x7a69' };
  await api.assertWalletContext(provider, context);
  await assert.rejects(api.assertWalletContext(provider, { ...context, account: '0xdef' }), /account changed/);
  await assert.rejects(api.assertWalletContext(provider, { ...context, chainId: '1' }), /chain changed/);
});
test('exclusive writer fence refuses unavailable locks or another tab before callback', async () => {
  assert.equal(typeof api.withAuthorizationFence, 'function');
  let writes = 0;
  await assert.rejects(api.withAuthorizationFence(null, () => writes++), /writer lock/);
  await assert.rejects(api.withAuthorizationFence({ request: async (_, options, work) => { assert.equal(options.ifAvailable, true); return work(null); } }, () => writes++), /another tab/);
  assert.equal(writes, 0);
  assert.equal(await api.withAuthorizationFence({ request: async (_, options, work) => work({ name: 'efs' }) }, () => ++writes), 1);
});
test('recovery descriptor export strips nested bytes, signatures and unknown status content', () => {
  const journal = api.createActionJournal(memory());
  journal.begin({ actionId: 'x', label: 'x', context, nonce: '1', deadline: '10', descriptor: { version: 'EFS_FILES_EFFECT_V1', op: { kind: 1, signature: 'SECRET' }, publication: { header: { principalId: 'alice', signature: 'SECRET' }, leaves: [{ body: 'PRIVATE' }], expectedRevisions: [] }, expectedBindings: [] } });
  assert(!journal.export().includes('SECRET')); assert(!journal.export().includes('PRIVATE'));
  assert.throws(() => journal.mark('x', { bytes: 'PRIVATE CONTENT' }), /Invalid/);
});
test('SDK descriptor Binding field order survives sanitized persistence', () => {
  const journal = api.createActionJournal(memory());
  const binding = { leafIndex: 1, recordId: 'record', typeId: 'type', purpose: 'purpose', subject: 'subject', fieldRole: 'role', targetRecord: 'target', targetOccurrence: null, predecessor: null, revision: 1 };
  journal.begin({ actionId: 'x', label: 'x', context, nonce: '1', deadline: '10', descriptor: { version: 'EFS_FILES_EFFECT_V1', op: {}, publication: { header: {}, expectedRevisions: [] }, expectedBindings: [binding] } });
  assert.equal(JSON.stringify(journal.entries()[0].descriptor.expectedBindings), JSON.stringify([binding]));
});
test('copy recovery retains the file whose bytes must be checked, without retaining content', () => {
  const journal = api.createActionJournal(memory());
  journal.begin({ actionId: 'copy', label: 'copy', context, nonce: '1', deadline: '10', requestedFileId: 'file-copy' });
  assert.equal(journal.entries()[0].requestedFileId, 'file-copy'); assert.equal(journal.entries()[0].content, null);
});
test('source deployment cannot silently reset under the same chain ID and URL', async () => {
  assert.equal(typeof api.assertDeploymentContext, 'function');
  const source = { identity: 'source', request() { assert.equal(this, source); return { hash: 'deployment-1' }; } };
  await api.assertDeploymentContext(source, { sourceId: 'source', environmentId: 'source/core/deployment-1' });
  await assert.rejects(api.assertDeploymentContext(source, { sourceId: 'source', environmentId: 'source/core/deployment-2' }), /deployment changed/);
});
