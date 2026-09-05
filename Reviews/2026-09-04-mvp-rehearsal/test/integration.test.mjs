import test from 'node:test';
import assert from 'node:assert/strict';
import { AbiCoder, Interface, ZeroHash, hexlify, keccak256, randomBytes, toUtf8Bytes } from 'ethers';
import { withLabChain, send, TX_GAS } from '../scripts/local-chain.mjs';
import { createLabSdk, encodeSchema, encodeTypedPayload } from '../sdk/index.js';

const abi = AbiCoder.defaultAbiCoder();
const domain = text => keccak256(toUtf8Bytes(text));
// Independent formulas: this integration oracle does not call SDK or Core hash helpers.
const contentId = data => keccak256(abi.encode(['bytes32', 'bytes32'], [domain('efs-lab/bytes/1'), keccak256(data)]));
const schemaId = data => keccak256(abi.encode(['bytes32', 'bytes32'], [domain('efs-lab/schema/1'), keccak256(data)]));
const nodeId = (d, op) => keccak256(abi.encode(['bytes32', 'bytes32', 'address', 'uint8', 'bytes32', 'bytes32', 'bytes32'],
  [domain('efs-lab/node/1'), d.runId, d.owner, op.kind, op.target, keccak256(toUtf8Bytes(op.name)), op.salt]));
const revisionId = (id, rev, content, previous = ZeroHash) => keccak256(abi.encode(
  ['bytes32', 'bytes32', 'uint64', 'bytes32', 'bytes32'], [domain('efs-lab/revision/1'), id, rev, content, previous]));
const rpc = (lab, trace, channel) => ({ request: ({ method, params = [] }) => {
  trace.push({ channel, method });
  const actual = method === 'eth_sendTransaction' ? [{ ...params[0], gas: `0x${TX_GAS.toString(16)}` }] : params;
  return lab.provider.send(method, actual);
} });

test('real Solidity, independent SDK, three approval paths and cold recovery', { timeout: 120000 }, async t => {
  await withLabChain(async lab => {
    const trace = [];
    const readProvider = rpc(lab, trace, 'read');
    const transports = { deployment: lab.deployment, readProvider,
      walletProvider: rpc(lab, trace, 'wallet'), relayProvider: rpc(lab, trace, 'relay'), sessionProvider: rpc(lab, trace, 'session') };
    const sdk = createLabSdk(transports);
    const owner = await lab.owner.getAddress(), relay = await lab.relay.getAddress(), session = await lab.session.getAddress();
    const now = BigInt((await lab.provider.getBlock('latest')).timestamp);
    const deadline = now + 600n;
    const options = async (overrides = {}) => ({ target: lab.deployment.rootId, name: 'example', salt: hexlify(randomBytes(32)),
      nonce: await lab.core.ownerNonce(), deadline, ...overrides });
    const apply = async (operation, mode, extra = {}) => {
      const plan = sdk.planWrite({ operation, previousRevisionId: extra.previousRevisionId });
      const prepared = await sdk.prepareWrite(plan, { mode, account: mode === 'session' ? session : owner, grant: extra.grant });
      const submitted = await sdk.submitWrite(prepared, { from: relay });
      assert.equal(submitted.qualification.effect, 'UNKNOWN', 'inclusion alone must not report semantic success');
      const readBack = await sdk.readBack(submitted);
      assert.equal(readBack.stage, 'READ_BACK_VERIFIED', JSON.stringify(readBack.checks));
      assert.equal(readBack.effect, 'COMMITTED');
      return { plan, prepared, submitted, readBack };
    };
    let created, directory, revised, grant, grantId, oldRevision;

    await t.test('guest reads never touch wallet and independent root formula agrees', async () => {
      const root = await sdk.readExact({ kind: 'node', id: lab.deployment.rootId });
      assert.equal(root.outcome, 'FOUND'); assert.equal(Number(root.value.kind), 1);
      const expected = keccak256(abi.encode(['bytes32', 'bytes32', 'address'], [domain('efs-lab/root/1'), lab.deployment.runId, owner]));
      assert.equal(lab.deployment.rootId, expected);
      const missing = await sdk.readExact({ kind: 'child', parent: expected, name: 'missing' });
      assert.equal(missing.outcome, 'ABSENT_PROVEN');
      assert.equal(trace.filter(x => x.channel !== 'read').length, 0);
    });

    await t.test('relayed file stores exact bytes atomically with one message approval', async () => {
      trace.length = 0;
      const operation = sdk.operations.createFile(await options({ name: 'readme.txt', data: toUtf8Bytes('First exact revision') }));
      created = await apply(operation, 'relayed');
      const expected = nodeId(lab.deployment, operation);
      assert.equal(created.plan.predicted.resultId, expected);
      assert.equal(created.plan.predicted.contentId, contentId(operation.data));
      oldRevision = revisionId(expected, 1n, contentId(operation.data));
      assert.equal(created.plan.predicted.revisionId, oldRevision);
      assert.deepEqual(trace.filter(x => x.channel === 'wallet').map(x => x.method), ['eth_signTypedData_v4']);
      assert.deepEqual(trace.filter(x => x.channel === 'relay').map(x => x.method), ['eth_sendTransaction']);
    });

    await t.test('direct directory uses one transaction approval and no message', async () => {
      trace.length = 0;
      directory = await apply(sdk.operations.mkdir(await options({ name: 'Notes' })), 'direct');
      assert.deepEqual(trace.filter(x => x.channel === 'wallet').map(x => x.method), ['eth_sendTransaction']);
      assert.equal(trace.filter(x => x.channel === 'relay').length, 0);
      const page = await sdk.readPage({ kind: 'children', directory: directory.plan.predicted.resultId, limit: 64 });
      assert.equal(page.qualification.coverage, 'COMPLETE'); assert.deepEqual(page.items, []);
    });

    await t.test('session setup is recorded separately and one routine revision has zero wallet calls', async () => {
      trace.length = 0;
      grant = { key: session, scope: created.plan.predicted.resultId, operations: 4, expiry: deadline,
        maxWrites: 2, maxBytes: 128n, nonce: 7n };
      const registered = await sdk.registerGrant({ grant, owner, from: relay }); grantId = registered.grantId;
      assert.deepEqual(trace.filter(x => x.channel === 'wallet').map(x => x.method), ['eth_signTypedData_v4']);
      const observed = await sdk.readExact({ kind: 'grant', id: grantId }); assert.equal(observed.outcome, 'FOUND');
      trace.length = 0;
      const operation = sdk.operations.reviseFile({ target: created.plan.predicted.resultId, data: toUtf8Bytes('Second exact revision'),
        expectedRevision: 1n, nonce: 0n, deadline, grantId });
      revised = await apply(operation, 'session', { grant, previousRevisionId: oldRevision });
      assert.equal(trace.filter(x => x.channel === 'wallet').length, 0);
      assert.deepEqual(trace.filter(x => x.channel === 'session').map(x => x.method), ['eth_signTypedData_v4']);
      assert.equal(revised.plan.predicted.resultId, created.plan.predicted.resultId);
    });

    await t.test('later revision and revocation preserve earlier accepted-effect recovery', async () => {
      await send(lab.core.revokeGrant, grantId);
      const old = await sdk.readBack(created.submitted);
      assert.equal(old.effect, 'COMMITTED', 'superseded does not erase an earlier accepted write');
      const pastSession = await sdk.readBack(revised.submitted);
      assert.equal(pastSession.effect, 'COMMITTED', 'later grant revocation cannot rewrite admission authority');
      const before = await lab.core.receiptCount();
      const op = sdk.operations.reviseFile({ target: created.plan.predicted.resultId, data: '0x01', expectedRevision: 2n,
        nonce: 1n, deadline, grantId });
      const plan = sdk.planWrite({ operation: op, previousRevisionId: revised.plan.predicted.revisionId });
      try {
        const prepared = await sdk.prepareWrite(plan, { mode: 'session', account: session, grant });
        const rejected = await sdk.submitWrite(prepared, { from: relay });
        assert.notEqual(rejected.stage, 'INCLUDED');
      } catch { /* SDK refusal or EVM rejection are both acceptable */ }
      assert.equal(await lab.core.receiptCount(), before);
    });

    await t.test('cold independent reader recovers current and historical bytes without original input buffers', async () => {
      const cold = createLabSdk({ deployment: lab.deployment, readProvider,
        walletProvider: { request() { throw new Error('Wallet touched during cold read'); } } });
      const current = await cold.readExact({ kind: 'node', id: created.plan.predicted.resultId });
      assert.equal(BigInt(current.value.revision), 2n);
      for (const [number, expected] of [[1n, 'First exact revision'], [2n, 'Second exact revision']]) {
        const revision = await cold.readExact({ kind: 'revision', file: created.plan.predicted.resultId, revision: number, blockTag: current.basis });
        const bytes = await cold.readVerifiedBytes({ contentId: revision.value.contentId, blockTag: current.basis,
          range: { offset: 2n, length: 5 } });
        assert.equal(bytes.qualification.integrity, 'VERIFIED');
        assert.equal(new TextDecoder().decode(Uint8Array.from(Buffer.from(bytes.value.bytes.slice(2), 'hex'))), expected);
        assert.equal(bytes.value.range, hexlify(toUtf8Bytes(expected).slice(2, 7)));
      }
    });

    await t.test('typed schemas and exact-schema references reject incompatible data', async () => {
      const note = encodeSchema([4, 2]);
      await send(lab.core.registerSchema, note);
      assert.equal(schemaId(note), await lab.core.registerSchema.staticCall(note));
      const op = sdk.operations.publishRecord(await options({ schemaId: schemaId(note), data: encodeTypedPayload(note, ['A typed note', true]) }));
      const record = await apply(op, 'relayed');
      const ref = `0x05${schemaId(note).slice(2)}`;
      await send(lab.core.registerSchema, ref);
      const referenced = sdk.operations.publishRecord(await options({ schemaId: schemaId(ref), data: record.plan.predicted.resultId }));
      await apply(referenced, 'relayed');
      const before = await lab.core.receiptCount();
      const bad = sdk.operations.publishRecord(await options({ schemaId: schemaId(ref), data: created.plan.predicted.resultId }));
      await assert.rejects(() => send(lab.core.executeDirect, bad));
      assert.equal(await lab.core.receiptCount(), before);
      const validation = await sdk.validateTypedPayloadAtBasis({ schemaId: schemaId(ref), data: created.plan.predicted.resultId });
      assert.notEqual(validation.qualification.validation, 'VALID');
    });

    await t.test('stale CAS and signature substitution leave no changes', async () => {
      const before = { receipt: await lab.core.receiptCount(), nonce: await lab.core.ownerNonce() };
      const stale = sdk.operations.reviseFile(await options({ target: created.plan.predicted.resultId, expectedRevision: 1n, data: '0x01' }));
      await assert.rejects(() => send(lab.core.executeDirect, stale));
      const original = sdk.operations.mkdir(await options({ name: 'untampered' }));
      const prepared = await sdk.prepareWrite(sdk.planWrite({ operation: original }), { mode: 'relayed', account: owner });
      await assert.rejects(() => send(lab.core.connect(lab.relay).execute, { ...original, name: 'substituted' }, prepared.witness));
      assert.equal(await lab.core.receiptCount(), before.receipt); assert.equal(await lab.core.ownerNonce(), before.nonce);
    });

    await t.test('corrupt bytes and provider failures cannot become valid data or absence', async () => {
      const carrier = new Interface(lab.deployment.byteStoreAbi);
      const readSelector = carrier.getFunction('read').selector;
      const faulty = { request(request) {
        if (request.method === 'eth_call' && request.params[0].data.startsWith(readSelector)) return carrier.encodeFunctionResult('read', ['0xdeadbeef']);
        return readProvider.request(request);
      } };
      const corrupt = await createLabSdk({ deployment: lab.deployment, readProvider: faulty }).readVerifiedBytes({ contentId: revised.plan.predicted.contentId });
      assert.equal(corrupt.qualification.integrity, 'FAILED'); assert.equal(corrupt.qualification.availability, 'AVAILABLE');
      assert.equal(corrupt.value, undefined);
      const broken = { request(request) {
        if (request.method === 'eth_call') throw Object.assign(new Error('execution reverted: out of gas'), { code: 'CALL_EXCEPTION', data: '0x' });
        return readProvider.request(request);
      } };
      const unavailable = await createLabSdk({ deployment: lab.deployment, readProvider: broken }).readExact({ kind: 'node', id: created.plan.predicted.resultId });
      assert.equal(unavailable.outcome, 'UNKNOWN');
    });

    await t.test('partial pages retain basis and an unavailable page does not erase prior entries', async () => {
      const first = await sdk.readPage({ kind: 'children', directory: lab.deployment.rootId, limit: 1 });
      assert.equal(first.items.length, 1); assert.equal(first.qualification.coverage, 'PARTIAL');
      const failing = createLabSdk({ deployment: lab.deployment, readProvider: { request() { throw new Error('Provider disappeared'); } } });
      const later = await failing.readPage({ kind: 'children', directory: lab.deployment.rootId, cursor: first.next, limit: 1, blockTag: first.basis });
      assert.equal(later.outcome, 'UNKNOWN'); assert.equal(first.items.length, 1);
    });
  });
});
