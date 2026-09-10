// The sponsor pays real gas on someone else's request, so it is a gas-drain
// target. These regressions prove the guards refuse BEFORE spending: staging
// is bound to a verified author intent, an unverifiable intent is refused by
// free simulation, and the sponsor's balance is unchanged after every abuse.
// It also pins what the endpoint can build at all — router.execute and
// carrier.stageChunk only, never a claimPrincipal (identity claims must come
// from the wallet account itself, or the sponsor would become the author).
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
import { planOperation, contentLeaves } from '../sdk/files-actions.mjs';

test('the sponsor refuses abusive requests without spending gas', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const { f, auth, config, server, sponsor } = await startEnvironment(lab, { write: true });
    const balance = async () => BigInt(await lab.rpc('eth_getBalance', [sponsor.address, 'latest']));
    const before = await balance();
    const { revision } = await auth.execution(); // the fixture's real current revision

    const ask = async body => {
      const response = await fetch(server.url + '/sponsor', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: server.url },
        body: JSON.stringify(body, (_, v) => typeof v === 'bigint' ? String(v) : v),
      });
      return { status: response.status, body: await response.json() };
    };

    // 1. Staging bytes nobody's signed intent ever named: the tree is
    //    self-consistent and would be accepted on-chain by the permissionless
    //    carrier — but the SPONSOR will not pay for it.
    const stranger = contentLeaves('0x' + 'ab'.repeat(4096));
    const uncovered = await ask({
      content: { treeId: stranger.treeId, body: stranger.tree.body, leaves: stranger.leaves },
      chunks: [{ index: 0, chunkData: stranger.chunks[0] }],
    });
    assert.equal(uncovered.status, 502);
    assert.match(uncovered.body.error, /not covered by a verified author intent/);
    assert.equal(await balance(), before, 'refused staging cost the sponsor nothing');

    // 1b. Chunks with no content tree at all are refused before anything else.
    const treeless = await ask({ chunks: [{ index: 0, chunkData: stranger.chunks[0] }] });
    assert.equal(treeless.status, 502);
    assert.match(treeless.body.error, /missing its content tree/);
    assert.equal(await balance(), before, 'a treeless chunk request cost the sponsor nothing');

    // 2. A real publication with a forged signature: free simulation refuses
    //    before any transaction is broadcast.
    const plan = planOperation({
      kind: 'createDir', mountId: config.mounts.aFirst, parent: f.root, name: 'sponsor-abuse',
      principal: auth.A, pubNonce: 987654321n,
    });
    assert.equal(plan.status, 'PLANNED', plan.reason);
    const forged = await ask({
      op: plan.op, publication: plan.publication, expectedRevision: revision,
      intent: { opCommitment: '0x' + '00'.repeat(32), byteCommitment: '0x' + '00'.repeat(32), executor: auth.router, executorCodehash: auth.routerCodehash, nonce: '0', deadline: '99999999999' },
      signature: '0x' + '11'.repeat(65),
    });
    assert.equal(forged.status, 502, 'a forged intent is refused');
    assert.equal(await balance(), before, 'a forged intent cost the sponsor nothing');

    // 3. An unclaimed principal is refused before simulation.
    const orphan = planOperation({
      kind: 'createDir', mountId: config.mounts.aFirst, parent: f.root, name: 'orphan-principal',
      principal: '0x' + 'de'.repeat(32), pubNonce: 987654322n,
    });
    const unclaimed = await ask({
      op: orphan.op, publication: orphan.publication, expectedRevision: revision,
      intent: { opCommitment: '0x' + '00'.repeat(32), byteCommitment: '0x' + '00'.repeat(32), executor: auth.router, executorCodehash: auth.routerCodehash, nonce: '0', deadline: '99999999999' },
      signature: '0x' + '11'.repeat(65),
    });
    assert.equal(unclaimed.status, 502);
    assert.match(unclaimed.body.error, /unclaimed principal/);
    assert.equal(await balance(), before, 'an unclaimed principal cost the sponsor nothing');

    // 4. An empty request buys nothing.
    const empty = await ask({});
    assert.equal(empty.status, 502);
    assert.match(empty.body.error, /nothing to submit/);
    assert.equal(await balance(), before, 'the sponsor spent nothing across every abusive request');

    await server.close();
  }, { profile: 'reads', watchdogMs: 600000 });
});
