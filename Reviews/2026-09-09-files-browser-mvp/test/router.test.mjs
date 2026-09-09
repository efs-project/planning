// FilesRouterV1 integration gauntlet: every routed operation kind against the
// live populated fixture, plus the adversarial cases the UI cannot protect.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Wallet } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade, withUpgrade, A, B, C } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { compileRouter, routerFixture } from './router-fixture.mjs';
import { createFixtureReader, openDirectory, openFile, lookupName, FIXTURE, bindingKey, nameRole } from '../../2026-09-09-files-reader/index.mjs';

function nodeSource(lab) {
  return { identity: lab.expected.source, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) };
}
async function ready(lab) {
  const opened = await createFixtureReader({ source: nodeSource(lab), context: { expected: lab.expected } }).open({});
  assert.equal(opened.status, 'READY', opened.reason);
  return opened.scope;
}
async function drain(stream) { let s; do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED'); return s; }

test('routed everyday loop with contract-enforced authority and preconditions', { timeout: 600000 }, async () => {
  compileUpgrade();
  compileRouter();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    const r = await routerFixture(lab);
    const gas = {};

    // Binding prior via the read core (CAS revision + predecessor occurrence).
    async function prior(principal, purpose, subject, role) {
      const head = lab.readIface.decodeFunctionResult('getBindingHead', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getBindingHead', [bindingKey(principal, purpose, subject, role)]) }, 'latest']));
      const h = head[0];
      if (h[3] === 0n) return null;
      const occ = lab.readIface.decodeFunctionResult('getOccurrenceByOrdinal', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getOccurrenceByOrdinal', [h[4]]) }, 'latest']));
      return { revision: Number(h[3]), occurrence: { envelopeId: occ[0], leafIndex: Number(occ[1]) } };
    }

    const mountId = f.mounts.aFirst;

    // 1. Create docs/ under the root.
    const mkdir = await r.execute({ kind: 'createDir', mountId, parent: f.root, name: 'docs', principal: A });
    gas.createDir = mkdir.gasUsed;
    const docs = mkdir.plan.predicted.objectId;

    // 2. Create docs/readme.md with real bytes; stage them; read them back verified.
    const bytes1 = '0x' + Buffer.from('routed readme v1\n').toString('hex');
    const create = await r.execute({ kind: 'createFile', mountId, parent: docs, name: 'readme.md', principal: A, bytesHex: bytes1 });
    gas.createFile = create.gasUsed;
    const readme = create.plan.predicted.objectId;
    await lab.stage(create.plan.predicted.treeId, create.plan.publication.leaves[2].body, bytes1);
    let scope = await ready(lab);
    let content = await openFile(scope, { mountId, fileId: readme });
    assert.equal(content.value?.integrity, 'VERIFIED', content.detail ?? content.reason);
    assert.equal(content.value.bytes, bytes1);
    scope.close();

    // 3. Guest zero-authority and wrong-signer are refused BY THE CONTRACT.
    await r.execute({ kind: 'createDir', mountId, parent: f.root, name: 'evil', principal: A }, { authorWallet: new Wallet(word(0xdeadn)), expectError: 'ErrUnauthorizedAuthor', mine: true });
    const unclaimed = word(0xcccccccccccccn);
    await r.execute({ kind: 'createDir', mountId, parent: f.root, name: 'ghost', principal: unclaimed, authorWallet: new Wallet(word(0xdeadn)) }, { authorWallet: new Wallet(word(0xdeadn)), expectError: 'ErrUnauthorizedAuthor' });

    // 4. Name profile at the contract: unsupported is not invalid; traversal is malformed.
    await r.execute({ kind: 'createDir', mountId, parent: f.root, name: 'Trip', principal: A, unsafeSkipNameGate: true }, { expectError: 'ErrNameUnsupported' });
    // planOperation itself refuses malformed names before any signing:
    const malformed = (await import('../sdk/files-actions.mjs')).planOperation({ kind: 'createDir', mountId, parent: f.root, name: '..', principal: A, pubNonce: 1 });
    assert.equal(malformed.status, 'MALFORMED');

    // 5. NOREPLACE across the plan: creating over an occupied name is refused.
    await r.execute({ kind: 'createFile', mountId, parent: f.root, name: 'note.txt', principal: A, bytesHex: '0x00' }, { expectError: 'ErrDestinationOccupied' });

    // 6. Edit with draft-preserving stale refusal: correct edit, then replay of
    //    the OLD prior is refused by the router preflight (typed) and the UI
    //    keeps the draft; the Core CAS still guards the race itself.
    const bytes2 = '0x' + Buffer.from('routed readme v2\n').toString('hex');
    const headPrior = await prior(A, FIXTURE.headPurpose, readme, FIXTURE.headRole);
    const edit = await r.execute({ kind: 'edit', mountId, fileId: readme, principal: A, bytesHex: bytes2, priorRevisionId: create.plan.predicted.revisionId, priors: { head: headPrior } });
    gas.edit = edit.gasUsed;
    await lab.stage(edit.plan.predicted.treeId, edit.plan.publication.leaves[0].body, bytes2);
    await r.execute({ kind: 'edit', mountId, fileId: readme, principal: A, bytesHex: '0x1122', priorRevisionId: create.plan.predicted.revisionId, priors: { head: headPrior } }, { expectError: 'ErrStaleEdit', mine: true });
    scope = await ready(lab);
    content = await openFile(scope, { mountId, fileId: readme });
    assert.equal(content.value.bytes, bytes2);
    assert.deepEqual(content.value.parents, [create.plan.predicted.revisionId]);
    scope.close();

    // 7. Rename within docs/, then move docs/ under photos/ with a cycle witness;
    //    moving photos/ into its own subtree is refused.
    const srcPrior = await prior(A, FIXTURE.namePurpose, docs, nameRole('readme.md'));
    const rename = await r.execute({ kind: 'renameMove', mountId, parent: docs, name: 'guide.md', sourceParent: docs, sourceName: 'readme.md', object: readme, principal: A, priors: { source: srcPrior } });
    gas.rename = rename.gasUsed;
    const movePrior = await prior(A, FIXTURE.namePurpose, f.root, nameRole('docs'));
    const move = await r.execute({ kind: 'renameMove', mountId, parent: f.photos, name: 'docs', sourceParent: f.root, sourceName: 'docs', object: docs, principal: A, ancestorNames: ['photos'], priors: { source: movePrior } });
    gas.moveDir = move.gasUsed;
    const cyclePrior = await prior(A, FIXTURE.namePurpose, f.photos, nameRole('photos'));
    await r.execute({ kind: 'renameMove', mountId, parent: docs, name: 'photos', sourceParent: f.root, sourceName: 'photos', object: f.photos, principal: A, ancestorNames: ['photos', 'docs'], priors: { source: cyclePrior } }, { expectError: 'ErrCycle' });

    // Stable identity: guide.md is still the same File Object after rename+move.
    scope = await ready(lab);
    const listed = await drain(openDirectory(scope, { mountId, subject: docs }));
    const guide = listed.rows.find(x => x.value.name === 'guide.md');
    assert.equal(guide.value.nodeId, readme, 'file identity survives rename/move');
    scope.close();

    // 8. Copy vs second placement: a copy is a NEW File sharing exact bytes;
    //    a placement is the SAME File at another name.
    const copy = await r.execute({ kind: 'copy', mountId, parent: docs, name: 'copy.md', principal: A, treeId: edit.plan.predicted.treeId, mediaType: 'text/plain' });
    gas.copy = copy.gasUsed;
    assert.notEqual(copy.plan.predicted.objectId, readme, 'copy mints a new File identity');
    const place = await r.execute({ kind: 'placement', mountId, parent: f.root, name: 'guide-link.md', object: readme, principal: A });
    gas.placement = place.gasUsed;
    scope = await ready(lab);
    const linked = await lookupName(scope, { mountId, name: 'guide-link.md' });
    assert.equal(linked.value.nodeId, readme, 'placement points at the SAME File');
    const copied = await openFile(scope, { mountId, fileId: copy.plan.predicted.objectId });
    assert.equal(copied.value.bytes, bytes2, 'copy shares exact verified bytes');
    scope.close();

    // 9. Editing the copy leaves the original untouched.
    const bytes3 = '0x' + Buffer.from('copied then edited\n').toString('hex');
    const copyHeadPrior = await prior(A, FIXTURE.headPurpose, copy.plan.predicted.objectId, FIXTURE.headRole);
    const editCopy = await r.execute({ kind: 'edit', mountId, fileId: copy.plan.predicted.objectId, principal: A, bytesHex: bytes3, priorRevisionId: copy.plan.predicted.revisionId, priors: { head: copyHeadPrior } });
    await lab.stage(editCopy.plan.predicted.treeId, editCopy.plan.publication.leaves[0].body, bytes3);
    scope = await ready(lab);
    assert.equal((await openFile(scope, { mountId, fileId: readme })).value.bytes, bytes2, 'original unchanged');
    scope.close();

    // 10. Remove one placement; the other survives; restore brings it back and
    //     a restore collision demands an explicit choice.
    const removeSel = rename.plan.predicted.entryId;
    const removePrior = await prior(A, FIXTURE.namePurpose, docs, nameRole('guide.md'));
    const remove = await r.execute({ kind: 'remove', mountId, parent: docs, name: 'guide.md', object: readme, principal: A, selectedEntry: removeSel, priors: { source: removePrior } });
    gas.remove = remove.gasUsed;
    scope = await ready(lab);
    assert.equal((await lookupName(scope, { mountId, subject: docs, name: 'guide.md' })).outcome, 'MASKED');
    assert.equal((await lookupName(scope, { mountId, name: 'guide-link.md' })).value.nodeId, readme, 'other placement survives removal');
    scope.close();
    // occupy the name, restore collides, restore-as succeeds under a new name
    const occupy = await r.execute({ kind: 'createFile', mountId, parent: docs, name: 'guide.md', principal: A, bytesHex: '0x33', priors: { destination: await prior(A, FIXTURE.namePurpose, docs, nameRole('guide.md')) } });
    const markerPrior = await prior(A, FIXTURE.removedPurpose, docs, remove.plan.predicted.markerId);
    await r.execute({ kind: 'restore', mountId, parent: docs, name: 'guide.md', object: readme, markerId: remove.plan.predicted.markerId, principal: A, priors: { destination: await prior(A, FIXTURE.namePurpose, docs, nameRole('guide.md')), marker: markerPrior } }, { expectError: 'ErrRestoreCollision' });
    const restore = await r.execute({ kind: 'restore', mountId, parent: docs, name: 'guide-restored.md', object: readme, markerId: remove.plan.predicted.markerId, principal: A, priors: { marker: markerPrior } });
    gas.restore = restore.gasUsed;
    scope = await ready(lab);
    assert.equal((await lookupName(scope, { mountId, subject: docs, name: 'guide-restored.md' })).value.nodeId, readme);
    scope.close();
    // marker retired: restoring twice is refused
    await r.execute({ kind: 'restore', mountId, parent: docs, name: 'again.md', object: readme, markerId: remove.plan.predicted.markerId, principal: A, priors: { marker: await prior(A, FIXTURE.removedPurpose, docs, remove.plan.predicted.markerId) } }, { expectError: 'ErrMarkerInactive' });

    // 11. Attributed tags: A and B tag; A untags; B's tag stays current.
    const tagA = await r.execute({ kind: 'tag', mountId, object: readme, label: 'ocean', principal: A });
    gas.tag = tagA.gasUsed;
    await r.execute({ kind: 'tag', mountId, object: readme, label: 'ocean', principal: B });
    const tagPriorA = await prior(A, FIXTURE.tagPurpose, readme, tagA.plan.op.aux);
    await r.execute({ kind: 'untag', mountId, object: readme, label: 'ocean', principal: A, priors: { tag: tagPriorA } });
    const headA = await prior(A, FIXTURE.tagPurpose, readme, tagA.plan.op.aux);
    const headB = await prior(B, FIXTURE.tagPurpose, readme, tagA.plan.op.aux);
    assert.equal(headA.revision, 2, 'A tombstoned');
    assert.equal(headB.revision, 1, 'B unaffected');

    // 12. Template bypass around the UI: a publication whose entry parent does
    //     not match the authorized op is refused by the router itself.
    {
      const { planOperation } = await import('../sdk/files-actions.mjs');
      const honest = planOperation({ kind: 'createDir', mountId, parent: f.root, name: 'sneaky', principal: A, pubNonce: 90101 });
      const forged = structuredClone(honest);
      forged.op.parent = f.photos; // authorized op says photos, leaves write to root
      const prepared = await lab.prepare(forged.publication);
      const { authorizeAuthor, routerInterface } = await import('../sdk/files-actions.mjs');
      const nonce = await r.authorNonceOf(A);
      const sig = await authorizeAuthor(forged, { authorWallet: r.authors[A], router: r.router, chainId: 31337, authorNonce: nonce, deadline: prepared.deadline });
      const data = routerInterface.encodeFunctionData('execute', [forged.op, forged.publication, prepared.revision, prepared.nonce, prepared.deadline, prepared.signature, nonce, prepared.deadline, sig]);
      let error; try { await lab.rpc('eth_call', [{ to: r.router, data, gas: '0x1000000' }, 'latest']); } catch (e) { error = e; }
      assert(error?.data, 'forged template must revert');
    }

    console.log('routed gas:', Object.fromEntries(Object.entries(gas).map(([k, v]) => [k, String(v)])));
    assert(Object.values(gas).every(g => g <= 16777216n), 'all routed operations fit the transaction cap');
  }, { profile: 'reads' });
});
