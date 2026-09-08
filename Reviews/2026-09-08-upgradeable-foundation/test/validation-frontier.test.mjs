// Boundary canaries against the EXISTING direct fixture host, not upgrade tests.
// No Files profile validator or compatibility View is implemented by these tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileStateful, withStateful, publication, groupLeaf, word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { readState, ordinaryRecord } from '../../2026-09-05-c0-core/reference/state-reader.mjs';
import { decodeBody } from '../../2026-09-05-c0-core/reference/record-body.mjs';
import { encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import { Interface } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const concat = (...xs) => '0x' + xs.map(x => x.replace(/^0x/, '')).join('');
const text = s => { const b = Buffer.from(s, 'utf8'); return b.length.toString(16).padStart(4, '0') + b.toString('hex'); };
const descriptor = (name, fields, roles = []) => ({ name, fields, roles, indexes: [], constraints: [], meaning: 'Disposable boundary fixture; not a published application profile.', specDigest: null, qualifier: '00'.repeat(32) });
const record = (typeId, body) => ({ typeId, body });
const id = r => ordinaryRecord(r.typeId, r.body);
const retained = s => JSON.stringify(['bootstrap', 'counts', 'records', 'envelopes', 'types', 'principals', 'admissions', 'batches', 'occurrences', 'bindings', 'postings'].map(k => [k, Array.isArray(s.snapshot[k]) ? s.snapshot[k].map(x => typeof x === 'object' ? { ...x, pin: undefined } : x) : s.snapshot[k]]));

test('real admission exposes the exact-Type and Files semantic validation frontier', { timeout: 240000 }, async t => {
  compileStateful();
  let cleanup;
  await withStateful(async lab => {
    cleanup = lab.cleanup;
    let nonce = 8000;
    const publish = leaves => lab.publish(publication(leaves, nonce++));
    const checked = async () => { const s = await readState(lab); assert.equal(s.outcome, 'VERIFIED', s.reason); return s; };
    const errors = new Interface(['error E_REF_UNSATISFIED(uint16 leafIndex,uint8 roleOrdinal)', 'error ReferenceUnproved(uint16 leaf,uint8 role)', 'error InvalidBody(uint16 code)']);
    const rejected = async (candidate, name, args) => {
      const p = publication([candidate], nonce++), expected = errors.encodeErrorResult(name, args);
      await assert.rejects(() => lab.preview(p), e => JSON.parse(e.message).data === expected, 'specific preflight rejection');
      const result = await lab.publish(p);
      assert.equal(result.receipt.status, '0x0');
      const trace = await lab.rpc('debug_traceTransaction', [result.tx.hash, { tracer: 'callTracer', tracerConfig: { onlyTopCall: true } }]);
      assert.equal(trace.output, expected, 'mined rejection must be the named validation error, not gas or an unrelated failure');
    };
    const install = async schema => {
      const raw = encodeGroup([schema]), typeId = derive(raw).ids[0];
      assert.equal((await publish([groupLeaf(lab.inputs.meta, '0x' + raw.toString('hex'))])).receipt.status, '0x1');
      return typeId;
    };

    const fields = [{ name: 'title', kind: 'STRING', max: 128 }, { name: 'body', kind: 'STRING', max: 512 }];
    const v1 = await install(descriptor('FrontierNote/1.0', fields));
    const old = record(v1, concat(text('Trip'), text('Meet at the ocean.')));
    assert.equal((await publish([old])).receipt.status, '0x1');
    const original = (await checked()).entries.find(e => e.recordId === id(old));

    await t.test('adding a field preserves old exact data but does not make the new bytes an old exact Type', async () => {
      const v11 = await install(descriptor('FrontierNote/1.1', [...fields, { name: 'color', kind: 'OPTION', inner: { name: '', kind: 'STRING', max: 16 } }]));
      assert.notEqual(v11, v1);
      const newer = record(v11, concat(old.body, '01', text('blue')));
      assert.equal((await publish([newer])).receipt.status, '0x1');
      const state = await checked(), entry = state.entries.find(e => e.recordId === id(newer));
      assert.deepEqual(decodeBody(original.schema, old.body).fields, [concat(text('Trip')), concat(text('Meet at the ocean.'))]);
      assert.equal(state.entries.find(e => e.recordId === id(old)).recordId, original.recordId);
      assert.deepEqual(decodeBody(entry.schema, newer.body).fields.slice(0, 2), original.fields);
      assert.throws(() => decodeBody(original.schema, newer.body), e => e.code === 1, 'exact old decoder rejects trailing new field');
      // A sanctioned compatibility projection could expose these two fields;
      // it is not implemented here, and must not relabel the original Type ID.
      const linkType = await install(descriptor('FrontierExactNoteLink/1', [{ name: 'note', kind: 'REF' }], [{ name: 'note', fieldIdx: 0, targetClass: 1, expectedType: v1.slice(2) }]));
      assert.equal((await publish([record(linkType, id(old))])).receipt.status, '0x1');
      const before = retained(await checked());
      await rejected(record(linkType, id(newer)), 'E_REF_UNSATISFIED', [0, 0]);
      assert.equal(retained(await checked()), before, 'wrong exact reference has no retained state effect');
    });

    for (const group of lab.inputs.candidates.groups) assert.equal((await publish([groupLeaf(lab.inputs.meta, '0x' + group.groupHex)])).receipt.status, '0x1');
    const members = Object.fromEntries(lab.inputs.candidates.groups.flatMap(g => g.members.map(m => [m.descriptor.name, m.temporaryTypeSchemaId])));
    const object = seed => record(members['ObjectGenesis/1'], concat(word(0xffffffffffffn), word(seed), '00'));
    const parent = object(8101), child = object(8102);
    assert.equal((await publish([parent, child])).receipt.status, '0x1');

    await t.test('valid MC/1 bytes and Object references do not prove a valid filename or Directory charter', async () => {
      const badNames = ['', '.', '..', 'nested/name', 'bad\u0000name', 'e\u0301.txt'];
      const canaries = badNames.map(name => record(members['DirectoryEntry/1'], concat(id(parent), text(name), id(child), '00')));
      for (const candidate of canaries) assert.equal((await publish([candidate])).receipt.status, '0x1', 'structural admission intentionally does not implement FilesName');
      const selfCycle = record(members['DirectoryEntry/1'], concat(id(parent), text('self'), id(parent), '00'));
      assert.equal((await publish([selfCycle])).receipt.status, '0x1', 'structural references do not prove acyclic file paths');
      const state = await checked();
      assert.equal(state.fold.bindings.size, 0, 'there are deliberately no Directory/File charter Bindings');
      for (const candidate of [...canaries, selfCycle]) assert(state.entries.some(e => e.recordId === id(candidate)));
      t.diagnostic('Seven retained DirectoryEntry canaries are STRUCTURALLY valid only; FilesName/charter/path validation remains an explicit application-profile gate.');
    });

    await t.test('invalid shape and a nonexistent exact Object reference really do revert atomically', async () => {
      const missing = record(members['DirectoryEntry/1'], concat(id(parent), text('valid.txt'), word(0xdeadbeef), '00'));
      const malformed = { ...old, body: old.body + 'ff' };
      const before = retained(await checked());
      for (const [candidate, name, args] of [[missing, 'ReferenceUnproved', [0, 1]], [malformed, 'InvalidBody', [1]]]) {
        await rejected(candidate, name, args);
        assert.equal(retained(await checked()), before);
      }
    });
    t.diagnostic(JSON.stringify({ host: 'legacy direct operator-trusted fixture; not upgrade or portable authentication evidence', maxTransactionGas: lab.transactions.reduce((m, x) => BigInt(x.receipt.gasUsed) > m ? BigInt(x.receipt.gasUsed) : m, 0n).toString(), transactions: lab.transactions.length }));
  });
  assert(cleanup.stopped, 'managed loopback node stopped');
});
