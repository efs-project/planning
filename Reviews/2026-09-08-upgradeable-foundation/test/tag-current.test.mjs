// Ordinary application Types plus actual Core Bindings. No tag Core noun,
// browser reducer, portable-author proof or complete tag-query API is claimed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AbiCoder, Interface, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileStateful, withStateful, publication, groupLeaf, word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { readState, ordinaryRecord } from '../../2026-09-05-c0-core/reference/state-reader.mjs';
import { encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';

const abi = AbiCoder.defaultAbiCoder();
const D = s => keccak256(Buffer.from(s));
const H = (types, values) => keccak256(abi.encode(types, values));
const cat = (...parts) => '0x' + parts.map(p => p.replace(/^0x/, '')).join('');
const occurrence = (p, leaf) => cat(p.envelopeId, leaf.toString(16).padStart(4, '0'));
const currentKey = (author, purpose, subject, role) => H(['bytes32', 'bytes32', 'bytes32'], [D('efs2/binding/1'), author, H(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [D('efs2/position/1'), purpose, subject, role])]);
const retained = s => JSON.stringify(['bootstrap', 'counts', 'records', 'envelopes', 'types', 'principals', 'admissions', 'batches', 'occurrences', 'bindings', 'postings'].map(k => [k, Array.isArray(s.snapshot[k]) ? s.snapshot[k].map(x => typeof x === 'object' ? { ...x, pin: undefined } : x) : s.snapshot[k]]));

test('two authors can share one tag Record without sharing its currentness', { timeout: 240000 }, async t => {
  compileStateful(); let cleanup;
  await withStateful(async lab => {
    cleanup = lab.cleanup;
    let nonce = 9000;
    const A = word(0xaaaaaaaaaaaaaaaaaan), B = word(0xbbbbbbbbbbbbbbbbbbn);
    const p = (leaves, author = A, revisions = []) => publication(leaves, nonce++, { principal: author, revisions });
    const commit = async request => { assert.equal((await lab.publish(request)).receipt.status, '0x1'); return request; };
    const checked = async () => { const state = await readState(lab); assert.equal(state.outcome, 'VERIFIED', state.reason); return state; };
    for (const group of lab.inputs.candidates.groups.slice(0, 2)) await commit(p([groupLeaf(lab.inputs.meta, '0x' + group.groupHex)]));
    const types = Object.fromEntries(lab.inputs.candidates.groups.flatMap(g => g.members.map(m => [m.descriptor.name, m.temporaryTypeSchemaId])));
    const tagSchema = {
      name: 'FrontierTagAssertion/1', meaning: 'Disposable authored-current tag fixture; not a public tag profile.', specDigest: null, qualifier: '00'.repeat(32),
      fields: [{ name: 'tagId', kind: 'BYTES_FIXED', width: 32 }, { name: 'target', kind: 'REF' }],
      roles: [{ name: 'target', fieldIdx: 1, targetClass: 5, expectedType: types['ObjectGenesis/1'].slice(2) }],
      indexes: [{ kind: 1, target: 0 }, { kind: 2, target: 0 }], constraints: [],
    };
    const raw = encodeGroup([tagSchema]), tagType = derive(raw).ids[0];
    await commit(p([groupLeaf(lab.inputs.meta, '0x' + raw.toString('hex'))]));
    const object = { typeId: types['ObjectGenesis/1'], body: cat(A, word(9010), '00') };
    const objectId = ordinaryRecord(object.typeId, object.body);
    await commit(p([object]));
    const tag = D('efs.fixture.tag/ocean'), purpose = D('efs.fixture.tag-current/1');
    const assertion = { typeId: tagType, body: cat(tag, objectId) };
    const assertionId = ordinaryRecord(tagType, assertion.body);
    const set = predecessor => ({ typeId: types['BindingSet/1'], body: cat(purpose, objectId, tag, '01', assertionId, '00', predecessor ? cat('01', predecessor) : '00') });
    const tombstone = predecessor => ({ typeId: types['BindingTombstone/1'], body: cat(purpose, objectId, tag, '01', predecessor) });
    const aKey = currentKey(A, purpose, objectId, tag), bKey = currentKey(B, purpose, objectId, tag);
    const scalarValue = H(['bytes32', 'bytes32'], [D('efs2/vk/scalar/1'), keccak256(tag)]);
    const tagPosting = H(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [D('efs2/pk/1'), tagType, 7, 0, scalarValue]);
    const firstA = await commit(p([assertion, set()], A, [[1, 0]]));
    const firstB = await commit(p([assertion, set()], B, [[1, 0]]));

    await t.test('one immutable Record retains two distinct attributed occurrences and two current heads', async () => {
      const state = await checked();
      assert.equal(state.snapshot.records.filter(x => x.id === assertionId).length, 1);
      const rows = state.entries.filter(e => e.typeId === tagType);
      assert.deepEqual(rows.map(e => e.principal), [A, B]);
      assert.deepEqual(rows.map(e => e.recordId), [assertionId, assertionId]);
      assert.notEqual(rows[0].occurrenceId, rows[1].occurrenceId);
      assert.deepEqual([aKey, bKey].map(k => state.fold.bindings.get(k).target), [assertionId, assertionId]);
      assert.deepEqual([aKey, bKey].map(k => state.fold.bindings.get(k).revision), [1n, 1n]);
      assert.equal(state.fold.postings.get(tagPosting).live, 2n);
    });

    const untagA = await commit(p([tombstone(occurrence(firstA, 1))], A, [[0, 1]]));
    await t.test('untag A retains B and history; raw live assertion postings are NOT the current-tag count', async () => {
      const state = await checked();
      assert.equal(state.fold.bindings.get(aKey).state, 2);
      assert.equal(state.fold.bindings.get(bKey).state, 1);
      assert.equal(state.fold.bindings.get(bKey).source, firstB.envelopeId + ':1');
      assert.equal([aKey, bKey].filter(k => state.fold.bindings.get(k).state === 1).length, 1);
      assert.equal(state.fold.postings.get(tagPosting).live, 2n, 'assertion occurrences are still Core-ACTIVE after a separate Binding tombstone');
      assert.equal(state.fold.lifecycle.get(firstA.envelopeId + ':0').status, 1);
      assert.equal(state.fold.lifecycle.get(firstB.envelopeId + ':0').status, 1);
      assert.equal(state.fold.histories.get(aKey).length, 2);
      assert.equal(state.fold.histories.get(bKey).length, 1);
    });

    const retagA = await commit(p([assertion, set(occurrence(untagA, 0))], A, [[1, 2]]));
    await t.test('re-tag reuses exact content with fresh occurrence, while stale CAS cannot change either author', async () => {
      let state = await checked();
      assert.equal(state.snapshot.records.filter(x => x.id === assertionId).length, 1);
      assert.equal(state.entries.filter(e => e.typeId === tagType).length, 3);
      assert.equal(state.fold.bindings.get(aKey).source, retagA.envelopeId + ':1');
      assert.equal(state.fold.bindings.get(aKey).revision, 3n);
      assert.equal(state.fold.bindings.get(bKey).revision, 1n);
      assert.equal(state.fold.histories.get(aKey).length, 3);
      assert.equal(state.fold.postings.get(tagPosting).live, 3n);
      const before = retained(state);
      const stale = p([set(occurrence(retagA, 1))], A, [[0, 1]]);
      const errors = new Interface(['error ErrCasRevision(bytes32 bindingKey,uint32 expected,uint32 have)']);
      const expected = errors.encodeErrorResult('ErrCasRevision', [aKey, 1, 3]);
      await assert.rejects(() => lab.preview(stale), e => JSON.parse(e.message).data === expected);
      const rejected = await lab.publish(stale);
      assert.equal(rejected.receipt.status, '0x0');
      const trace = await lab.rpc('debug_traceTransaction', [rejected.tx.hash, { tracer: 'callTracer', tracerConfig: { onlyTopCall: true } }]);
      assert.equal(trace.output, expected);
      state = await checked(); assert.equal(retained(state), before);
    });
    t.diagnostic(JSON.stringify({ transactions: lab.transactions.length, maxTransactionGas: lab.transactions.reduce((m, x) => BigInt(x.receipt.gasUsed) > m ? BigInt(x.receipt.gasUsed) : m, 0n).toString(), evidence: 'legacy direct fixture; exact retained tag data and Binding state, not a Files query or author authentication' }));
  });
  assert(cleanup.stopped);
});
