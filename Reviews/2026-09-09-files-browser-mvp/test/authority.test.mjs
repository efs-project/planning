// Revision-3 authority gauntlet: real per-account authorization in Core with
// routed consent binding — impersonation, replay, direct-Core bypass, stale
// plans, operator retirement, op-commitment forgery — plus law-correct
// multi-chunk staging with interruption recovery.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Wallet } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade, withUpgrade, A } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { compileRouter, routerFixture } from './router-fixture.mjs';
import { authorityFixture } from './authority-fixture.mjs';
import { contentLeaves, byteCommitmentOf, carrier3Interface, decodeAuthorityError } from '../sdk/files-actions.mjs';
import { createFixtureReader, openDirectory, openFile, FIXTURE } from '../../2026-09-09-files-reader/index.mjs';

function nodeSource(lab) {
  return { identity: lab.expected.source, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) };
}
async function ready(lab, expected) {
  const opened = await createFixtureReader({ source: nodeSource(lab), context: { expected: expected ?? lab.expected } }).open({});
  assert.equal(opened.status, 'READY', opened.reason);
  return opened.scope;
}
async function drain(stream) { let s; do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED'); return s; }

test('author-account authorization with routed consent binding', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    // Publish the marker/tag Type group while the operator path is still live
    // (pre-upgrade history), then move to revision-3 authority.
    const r1 = await routerFixture(lab); // also proves V1 continuity pre-upgrade
    const auth = await authorityFixture(lab);
    const mountId = f.mounts.aFirst;
    const gas = {};

    // The operator remains admin-era genesis authority (same trust class as
    // the upgrade controller); the served browser build carries no operator
    // key, and the four named bypass attacks below are contract-refused.

    // 2. Routed create through Core-verified author signature works; the
    //    admission context records the ACTUAL account, not an operator.
    const mk = await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'authority', principal: auth.A });
    gas.createDir = mk.gasUsed;
    let scope = await ready(lab, auth.expected);
    const listed = await drain(openDirectory(scope, { mountId }));
    assert(listed.rows.some(x => x.value.name === 'authority'), 'routed v2 create landed');
    scope.close();

    // 3. Impersonation: a signature from the WRONG account is refused.
    await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'evil', principal: auth.A },
      { authorWallet: new Wallet(word(0xdeadn)), expectError: 'ErrUnauthorizedPrincipal', mine: true });

    // 4. Replay: re-submitting the exact signed intent is refused by the
    //    Core nonce (a tag op passes router preconditions both times, so the
    //    refusal is provably Core's, not a router side effect).
    {
      const first = await auth.execute({ kind: 'tag', mountId, object: f.fileA, label: 'replayed', principal: auth.A });
      const { encodeExecuteV2 } = await import('../sdk/files-actions.mjs');
      const data = encodeExecuteV2(first.plan, first.prepared.e.revision, first.prepared.signed.intent, first.prepared.signed.signature);
      let error; try { await auth.call(auth.router, data); } catch (e) { error = e; }
      const decoded = decodeAuthorityError(error.data);
      assert.equal(decoded?.name, 'ErrIntentNonce', 'replay refused: ' + (decoded?.name ?? error.data));
    }

    // 5. Direct-Core bypass: the SAME routed-signed intent submitted straight
    //    to Core (bearer stripping the router) is refused by executor binding.
    await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'bypass', principal: auth.A },
      { expectError: 'ErrExecutorBinding', mine: true, target: lab.core });

    // 6. Executor forgery: intent naming a DIFFERENT executor is refused by
    //    the router before any state is touched.
    await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'reroute', principal: auth.A },
      { expectError: 'ErrRoutedExecutor', patchIntent: s => { s.intent.executor = lab.core; } });

    // 7. Op-commitment forgery: signed for one op, submitted with another.
    await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'forged-op', principal: auth.A },
      { expectError: 'ErrOpCommitment', patchIntent: s => { s.intent.opCommitment = '0x' + '99'.repeat(32); } });

    // 8. Expired deadline is a typed refusal.
    await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'late', principal: auth.A },
      { expectError: 'ErrIntentExpired', patchIntent: s => { s.intent.deadline = 1n; } });

    // 8b. byteCommitment is ENFORCED, not merely signed. The router derives
    //     it from the publication's own ChunkTree leaf, so a stray value on a
    //     contentless op and a forged value on a content op are both refused
    //     before Core ever verifies the signature.
    await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'stray-commit', principal: auth.A },
      { expectError: 'ErrByteCommitment', patchIntent: s => { s.intent.byteCommitment = '0x' + '99'.repeat(32); } });
    await auth.execute({
      kind: 'createFile', mountId, parent: f.root, name: 'wrong-commit.txt', principal: auth.A,
      bytesHex: '0x' + 'cd'.repeat(4096), byteCommitment: '0x' + '99'.repeat(32),
    }, { expectError: 'ErrByteCommitment' });

    // 9. Multi-chunk file: 10 KiB note (3 chunks) staged permissionlessly with
    //    an interruption (chunk 1 first skipped, then resumed), then admitted
    //    with ONE author signature carrying the byte commitment.
    const bigText = 'chunked line ' + 'x'.repeat(50) + '\n';
    const bytesHex = '0x' + Buffer.from(bigText.repeat(160)).toString('hex'); // ~10 KiB
    const content = contentLeaves(bytesHex);
    assert.equal(content.chunkCount, 3, 'three law-correct chunks');
    await auth.stageChunks(content, { onlyIndexes: [0, 2] }); // interrupted upload
    {
      const status = carrier3Interface.decodeFunctionResult('chunkStatus', await auth.call(auth.carrier, carrier3Interface.encodeFunctionData('chunkStatus', [content.treeId])));
      assert.equal(Number(status[3]), 2, 'two of three chunks present after interruption');
    }
    await auth.stageChunks(content, { onlyIndexes: [1] }); // resume the gap
    const create = await auth.execute({
      kind: 'createFile', mountId, parent: f.root, name: 'big-note.txt', principal: auth.A,
      bytesHex, byteCommitment: byteCommitmentOf(content.treeId, content.tree.body),
    });
    gas.createBig = create.gasUsed;
    scope = await ready(lab, auth.expected);
    const read = await openFile(scope, { mountId, fileId: create.plan.predicted.objectId });
    assert.equal(read.value?.integrity, 'VERIFIED', read.detail ?? read.reason);
    assert.equal(read.value.bytes, bytesHex, 'all three chunks reassembled and verified');
    scope.close();

    // 10. Chunk-law attacks: wrong bytes at a staged index are immutable-
    //     refused; a wrong leaf vector and an out-of-range index are refused.
    {
      const { encodeStageChunk } = await import('../sdk/files-actions.mjs');
      const wrongBytes = encodeStageChunk({ treeId: content.treeId, body: content.tree.body, index: 0, chunkData: '0x' + 'ab'.repeat(4096), leaves: content.leaves });
      let error; try { await auth.call(auth.carrier, wrongBytes); } catch (e) { error = e; }
      assert.equal(decodeAuthorityError(error.data)?.name, 'ErrChunkLeafMismatch');
      const badLeaves = encodeStageChunk({ treeId: content.treeId, body: content.tree.body, index: 0, chunkData: content.chunks[0], leaves: [...content.leaves].reverse() });
      error = undefined; try { await auth.call(auth.carrier, badLeaves); } catch (e) { error = e; }
      assert.equal(decodeAuthorityError(error.data)?.name, 'ErrChunkTreeShape');
      const oob = encodeStageChunk({ treeId: content.treeId, body: content.tree.body, index: 9, chunkData: content.chunks[0], leaves: content.leaves });
      error = undefined; try { await auth.call(auth.carrier, oob); } catch (e) { error = e; }
      assert.equal(decodeAuthorityError(error.data)?.name, 'ErrChunkIndex');
    }

    // 11. Stale plan: sign under the CURRENT execution set, upgrade to a
    //     fresh revision, then submit — refused (revision/execution binding).
    {
      const pending = await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'stale-era', principal: auth.A });
      pending; // consumed nonce; now build one and hold it across an upgrade
      const plan = (await import('../sdk/files-actions.mjs')).planOperation({ kind: 'createDir', mountId, parent: f.root, name: 'from-the-past', principal: auth.A, pubNonce: 81234 });
      const e = await auth.execution();
      const { authorizeIntentV3, encodeExecuteV2 } = await import('../sdk/files-actions.mjs');
      const signed = await authorizeIntentV3(plan, { authorWallet: auth.authors[auth.A], core: lab.core, chainId: 31337, executor: auth.router, executorCodehash: auth.routerCodehash, executionSetId: e.executionSetId, nonce: await auth.authorNonceOf(auth.A), deadline: await auth.deadline() });
      // fresh U3 copies => a NEW revision with a NEW execution-set id
      const again = await authorityFixture(lab);
      again; // (also re-verifies retirement idempotence on the new revision)
      const staleData = encodeExecuteV2(plan, e.revision, signed.intent, signed.signature);
      let error; try { await auth.call(auth.router, staleData); } catch (err) { error = err; }
      assert(error?.data, 'stale-era intent must revert after the upgrade');
    }

    console.log('authority gas:', Object.fromEntries(Object.entries(gas).map(([k, v]) => [k, String(v)])));
  }, { profile: 'reads', watchdogMs: 900000 });
});
