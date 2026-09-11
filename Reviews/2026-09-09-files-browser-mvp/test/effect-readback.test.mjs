import test from 'node:test';
import assert from 'node:assert/strict';
import * as actions from '../sdk/files-actions.mjs';
import { createFixtureReader, FIXTURE, nameRole, tagId } from '../../2026-09-09-files-reader/index.mjs';
import { compileUpgrade, withUpgrade, A } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { compileRouter, routerFixture } from './router-fixture.mjs';
import { authorityFixture } from './authority-fixture.mjs';
import { isQualifiedScope } from '../../2026-09-09-files-reader/reader-scope.mjs';

const id = n => '0x' + n.toString(16).padStart(64, '0');
test('recovery descriptor excludes content and authority secrets and rejects inconsistent plans', () => {
  const plan = actions.planOperation({ kind: 'createFile', mountId: id(100000), parent: id(100001), principal: A, name: 'note.txt', bytesHex: '0xdeadbeef', pubNonce: 1 });
  const before = structuredClone(plan);
  const descriptor = actions.recoveryDescriptor({ ...plan, signature: 'SECRET', privateKey: 'SECRET' });
  assert.equal(descriptor.version, 'EFS_FILES_EFFECT_V1');
  assert.equal(descriptor.expectedBindings.length, 3);
  assert(!JSON.stringify(descriptor).includes('deadbeef'));
  assert(!JSON.stringify(descriptor).includes('SECRET'));
  assert.deepEqual(plan, before);
  const bad = structuredClone(plan); bad.publication.leaves[0].body = '0x';
  assert.throws(() => actions.recoveryDescriptor(bad));
  const wrongPrediction = structuredClone(plan); wrongPrediction.predicted.revisionId = id(123456);
  assert.throws(() => actions.recoveryDescriptor(wrongPrediction));
});

test('a plain object scope cannot assert canonical commitment', async () => {
  const plan = actions.planOperation({ kind: 'createDir', mountId: id(100000), parent: id(100001), principal: A, name: 'dir', pubNonce: 1 });
  const fake = { basis: {}, call: async () => ({ status: 'OK', values: [id(1), '0x', 1n] }), seal: async () => ({ status: 'SEALED' }) };
  const result = await actions.readBackOperation(fake, plan);
  assert.equal(result.effect, 'UNKNOWN');
  assert.equal(result.reason, 'UNQUALIFIED_SCOPE');
});

test('independent authored occurrences and requested Files effects at one qualified basis', { timeout: 900000 }, async t => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    await f.claim(A, 'hidden', f.fileA, { whiteout: true });
    await routerFixture(lab);
    const auth = await authorityFixture(lab);
    const mountId = f.mounts.aFirst;
    const source = { identity: auth.expected.source, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) };
    async function scopeFor(request = source.request) {
      const opened = await createFixtureReader({ source: { ...source, request }, context: { expected: auth.expected } }).open({});
      assert.equal(opened.status, 'READY', opened.reason);
      assert.equal(isQualifiedScope(opened.scope), true);
      assert.equal(isQualifiedScope({ ...opened.scope }), false);
      return opened.scope;
    }
    async function read(plan, request) {
      const scope = await scopeFor(request);
      try { return await actions.readBackOperation(scope, plan); } finally { scope.close(); }
    }
    async function prior(purpose, subject, fieldRole, principal = A) {
      const scope = await scopeFor();
      try {
        const r = await actions.readBindingState(scope, { principal, purpose, subject, fieldRole });
        assert.equal(r.status, 'OK'); return r.prior;
      } finally { scope.close(); }
    }
    async function execute(intent) {
      const r = await auth.execute({ mountId, principal: A, ...intent });
      const result = await read(r.plan);
      assert.equal(result.effect, 'COMMITTED', JSON.stringify(result, (_, v) => typeof v === 'bigint' ? String(v) : v));
      assert.equal(result.admission, 'ADMITTED'); assert.equal(result.selection, 'SELECTED');
      assert.equal(result.contentAvailability, 'NOT_CHECKED');
      return r.plan;
    }
    let dir, file, edit, renamed, removed;
    await t.test('create directory and metadata-only file verification; public descriptor roundtrip', async () => {
      dir = await execute({ kind: 'createDir', parent: f.root, name: 'verified' });
      const content = actions.contentLeaves('0xdeadbeef');
      // Do not stage content: missing bytes must not erase metadata commitment.
      file = await execute({ kind: 'createFile', parent: dir.op.object, name: 'note.txt', bytesHex: content.data, byteCommitment: actions.byteCommitmentOf(content.treeId, content.tree.body) });
      assert.equal((await read(JSON.parse(JSON.stringify(actions.recoveryDescriptor(file))))).effect, 'COMMITTED');
    });
    await t.test('record bytes exist but this publication occurrence does not', async () => {
      const reused = structuredClone(dir);
      reused.publication.header.pubNonce = id(987654);
      reused.publication.envelopeId = actions.publicationIds(reused.publication.header, reused.publication.recordIds).envelopeId;
      delete reused.predicted;
      const result = await read(reused);
      assert.equal(result.effect, 'UNKNOWN'); assert.equal(result.admission, 'UNKNOWN');
      assert.equal(result.reason, 'OCCURRENCE_UNAVAILABLE');
    });
    await t.test('admitted author hidden by higher-priority Lens is not selected', async () => {
      const hidden = await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'hidden', principal: auth.B });
      const result = await read(hidden.plan);
      assert.equal(result.admission, 'ADMITTED'); assert.equal(result.selection, 'NOT_SELECTED');
      assert.equal(result.effect, 'UNKNOWN');
    });
    await t.test('edit selects predicted revision; old admitted head becomes superseded', async () => {
      const content = actions.contentLeaves('0xcafef00d');
      edit = await execute({ kind: 'edit', fileId: file.op.object, bytesHex: content.data, priorRevisionId: file.predicted.revisionId, priors: { head: await prior(FIXTURE.headPurpose, file.op.object, FIXTURE.headRole) }, byteCommitment: actions.byteCommitmentOf(content.treeId, content.tree.body) });
      const old = await read(file);
      assert.equal(old.admission, 'ADMITTED'); assert.equal(old.selection, 'NOT_SELECTED');
      assert.equal(old.effect, 'UNKNOWN'); assert(old.checks.some(c => c.reason === 'SUPERSEDED'));
    });
    await t.test('rename selects destination and source mask; copy and second placement verify', async () => {
      renamed = await execute({ kind: 'renameMove', parent: dir.op.object, name: 'renamed.txt', sourceParent: dir.op.object, sourceName: 'note.txt', object: file.op.object, priors: { source: await prior(FIXTURE.namePurpose, dir.op.object, nameRole('note.txt')) } });
      await execute({ kind: 'copy', parent: dir.op.object, name: 'copy.txt', treeId: edit.predicted.treeId });
      await execute({ kind: 'placement', parent: dir.op.object, name: 'linked.txt', object: file.op.object });
    });
    await t.test('recovery ignores object key insertion order but retains exact structural expectations', async () => {
      const reorder = value => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).reverse().map(([key, child]) => [key, reorder(child)])) : value;
      const descriptor = actions.recoveryDescriptor(edit);
      assert(descriptor.expectedBindings[0].predecessor, 'edit includes a nested predecessor occurrence');
      const reordered = JSON.parse(JSON.stringify(reorder(descriptor)));
      const before = structuredClone(reordered);
      assert.equal((await read(reordered)).effect, 'COMMITTED');
      assert.deepEqual(reordered, before, 'read-back must not normalize caller-owned state in place');
      for (const mutate of [
        d => { d.expectedBindings[0].targetRecord = f.fileB; },
        d => { d.expectedBindings[0].revision = String(d.expectedBindings[0].revision); },
        d => { delete d.expectedBindings[0].targetOccurrence; },
        d => { d.expectedBindings[0].extra = true; },
        d => { d.expectedBindings[0].predecessor.leafIndex = String(d.expectedBindings[0].predecessor.leafIndex); },
        d => { delete d.expectedBindings[0].predecessor.envelopeId; },
        d => { d.expectedBindings[0].predecessor.extra = true; },
      ]) {
        const changed = structuredClone(descriptor); mutate(changed);
        const result = await read(changed);
        assert.equal(result.effect, 'UNKNOWN');
        assert.equal(result.reason, 'BINDING_EXPECTATION_MISMATCH');
      }
      const swapped = actions.recoveryDescriptor(dir);
      swapped.expectedBindings.reverse();
      const result = await read(swapped);
      assert.equal(result.effect, 'UNKNOWN');
      assert.equal(result.reason, 'BINDING_EXPECTATION_MISMATCH');
    });
    await t.test('remove verifies mask plus active marker; restore retires the marker', async () => {
      removed = await execute({ kind: 'remove', parent: dir.op.object, name: 'renamed.txt', object: file.op.object, selectedEntry: renamed.predicted.entryId, priors: { source: await prior(FIXTURE.namePurpose, dir.op.object, nameRole('renamed.txt')) } });
      await execute({ kind: 'restore', parent: dir.op.object, name: 'renamed.txt', object: file.op.object, markerId: removed.predicted.markerId, priors: { destination: await prior(FIXTURE.namePurpose, dir.op.object, nameRole('renamed.txt')), marker: await prior(FIXTURE.removedPurpose, dir.op.object, removed.predicted.markerId) } });
      assert.equal((await read(removed)).selection, 'NOT_SELECTED');
    });
    await t.test('tag and untag concern this author even when another author still tags', async () => {
      await execute({ kind: 'tag', object: file.op.object, label: 'shared' });
      await auth.execute({ kind: 'tag', mountId, object: file.op.object, label: 'shared', principal: auth.B });
      await execute({ kind: 'untag', object: file.op.object, label: 'shared', priors: { tag: await prior(FIXTURE.tagPurpose, file.op.object, tagId('shared')) } });
    });
    await t.test('malformed, wrong-target and inconsistent recovery expectations fail closed', async () => {
      for (const mutate of [d => { d.op.object = f.fileB; }, d => { d.expectedBindings = []; }, d => { d.publication.recordIds = []; }, d => { d.op.kind = 999; }]) {
        const d = actions.recoveryDescriptor(dir); mutate(d);
        assert.equal((await read(d)).effect, 'UNKNOWN');
      }
    });
    await t.test('tampered identity, Binding targets, and resolution bases are UNKNOWN', async () => {
      const { Interface } = await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
      for (const fault of [
        { fragment: 'function getOccurrence(bytes32,uint16) view returns(uint8,uint64,bytes32,bytes32,bytes32,uint64)', change: v => { v[4] = auth.B; }, plan: dir },
        { fragment: 'function getBindingAtBasis(bytes32,uint64) view returns((uint8,uint8,uint8,uint32,uint64,bytes32,uint16),bytes32,uint64)', change: v => { v[0][5] = f.fileB; }, plan: dir },
        { fragment: 'function getBindingAtBasis(bytes32,uint64) view returns((uint8,uint8,uint8,uint32,uint64,bytes32,uint16),bytes32,uint64)', change: v => { v[0][2] = 1n; }, plan: dir },
        { fragment: 'function resolve(bytes32,bytes32) view returns((uint8,uint8,(uint8,bytes32,uint16),uint16,uint16,uint64,uint16,uint16,(bytes32,uint64,uint64,uint8)))', change: v => { v[0][8][0] = id(123456); }, plan: edit },
      ]) {
        const iface = new Interface([fault.fragment]), fn = iface.fragments[0];
        const request = async (m, p, options) => {
          const raw = await source.request(m, p, options);
          if (m !== 'eth_call' || !p[0].data.startsWith(iface.getFunction(fn.name).selector)) return raw;
          const values = iface.decodeFunctionResult(fn.name, raw).toArray(true); fault.change(values);
          return iface.encodeFunctionResult(fn.name, values);
        };
        const result = await read(fault.plan, request);
        assert.equal(result.effect, 'UNKNOWN'); assert.equal(result.selection, 'UNKNOWN');
      }
    });
    await t.test('missing occurrence reads and failed final seal never commit', async () => {
      const { Interface } = await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
      const iface = new Interface(['function getOccurrence(bytes32,uint16) view returns(uint8,uint64,bytes32,bytes32,bytes32,uint64)']);
      const broken = async (m, p, options) => {
        if (m === 'eth_call' && p[0].data.startsWith(iface.getFunction('getOccurrence').selector)) throw Error('injected missing occurrence');
        return source.request(m, p, options);
      };
      assert.equal((await read(dir, broken)).effect, 'UNKNOWN');
      let failSeal = false;
      const scope = await scopeFor(async (m, p, options) => {
        if (failSeal && m === 'eth_getBlockByNumber') throw Error('injected seal failure');
        return source.request(m, p, options);
      });
      failSeal = true;
      const result = await actions.readBackOperation(scope, dir); scope.close();
      assert.equal(result.effect, 'UNKNOWN'); assert.equal(result.admission, 'UNKNOWN');
    });
  }, { profile: 'reads' });
});
