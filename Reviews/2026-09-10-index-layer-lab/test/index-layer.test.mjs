// Index-layer lab: one declared FIELD_EQ family (DirectoryEntry/1.child) over
// the populated files-browser world. Every case of the 2026-09-10 test matrix
// runs against a managed anvil through the real hooked admission path.
//   node --test --test-force-exit test/index-layer.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade, withUpgrade } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { nestedFixture } from '../../2026-09-09-files-browser-mvp/test/nested-fixture.mjs';
import { compileRouter, routerFixture } from '../../2026-09-09-files-browser-mvp/test/router-fixture.mjs';
import { authorityFixture } from '../../2026-09-09-files-browser-mvp/test/authority-fixture.mjs';
import { EXTENDED_TYPES } from '../../2026-09-09-files-browser-mvp/sdk/files-actions.mjs';
import { FIXTURE, bindingScopeKey, nameRole, ordinaryRecord } from '../../2026-09-09-files-reader/index.mjs';
import { compileLab, indexLayerFixture, bucketOf, scopeOf, str, NONE, COV, TRI, COMPLETENESS, DE, WHITEOUT, LAB, js, DirectoryEntryLeaf, WhiteoutLeaf, BindLeaf } from '../scripts/lab-fixture.mjs';
import { withLabWorld } from '../scripts/lab-world.mjs';

const FILES = ['fileA', 'fileB', 'draft', 'extra'];

// Round 2: the SAME matrix runs on two worlds. Mode 0 = the populated files-browser
// pair on the genesis (legacy) kernel library, upgraded to U4 — the control.
// Mode 1 = a fresh pair deployed from the lab's K10-patched build whose U1 core
// selected scopeLayout = 1 before initialization, populated through the same
// fixtures and router; the lab's module and hook read the stored discriminator.
const WORLDS = [
  { name: 'mode 0 (populated pair, legacy layout, genesis kernel library)', layout: 0, run: (fn, o) => withUpgrade(fn, { ...o, profile: 'reads' }), evidence: 'evidence/functional-run.json' },
  { name: 'mode 1 (fresh pair, K10 layout selected before initialize, patched kernel)', layout: 1, run: (fn, o) => withLabWorld({ scopeLayout: 1 }, fn, o), evidence: 'evidence/functional-run-mode1.json' },
];
let compiled = false;

for (const WORLD of WORLDS) test('FIELD_EQ family over DirectoryEntry.child — ' + WORLD.name + ': declare after data, delayed backfill, convergence, coverage, detach', { timeout: 1200000 }, async () => {
  if (!compiled) { compileUpgrade(); compileRouter(); compileLab(); compiled = true; }
  const evidence = { date: new Date().toISOString(), world: WORLD.name, scopeLayout: WORLD.layout, steps: [], gas: {} };
  const note = (step, extra = {}) => evidence.steps.push({ step, ...extra });
  await WORLD.run(async lab => {
    const f = await nestedFixture(lab);
    await routerFixture(lab);
    const auth = await authorityFixture(lab);
    const mountId = f.mounts.aFirst;
    const A = auth.A;
    const objects = { fileA: f.fileA, fileB: f.fileB, draft: f.draft, extra: f.extra };
    const B = Object.fromEntries(FILES.map(k => [k, bucketOf(objects[k])]));
    const bucketName = b => FILES.find(k => B[k] === b) ?? null;
    const place = (dir, name, key) => auth.execute({ kind: 'placement', mountId, parent: dir, name, object: objects[key], principal: A });

    // ---- data that predates the index layer entirely (U3 era) --------------
    const idx = (await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'idx', principal: A })).plan.predicted.objectId;
    const names = [];
    for (let i = 0; i < 14; i++) { const name = 'p' + String(i).padStart(2, '0'); names.push(name); await place(idx, name, FILES[i % 4]); }
    const scope = scopeOf(A, idx);

    // ---- U4: the hooked core replaces U3 on the POPULATED pair --------------
    const ix = await indexLayerFixture(lab, auth);
    assert.equal(ix.layout, WORLD.layout, 'the stored scopeLayout is the one this world selected');
    note('upgrade', { core4: ix.core4.address, runtimeBytes: ix.core4.runtimeBytes, gas: String(BigInt(ix.upgradeReceipt.gasUsed)), scopeLayout: ix.layout });
    // Retired operator path: the only admission path is the hooked one.
    {
      const retired = await lab.publish({ envelopeId: ZeroHash, header: { profile: 1, principalId: A, authorityRef: ZeroHash, authEpoch: 0, pubNonce: ZeroHash, notAfter: 0 }, recordIds: [], leafMask: 0n, leaves: [], expectedRevisions: [] });
      assert.equal(retired.receipt.status, '0x0', 'operator path must be retired on U4');
    }
    // Two more pre-declaration positions, admitted through U4 but BEFORE any family exists.
    for (let i = 14; i < 16; i++) { const name = 'p' + String(i).padStart(2, '0'); names.push(name); await place(idx, name, FILES[i % 4]); }
    const N_PRE = 16;

    // ---- declare after data exists: attach at declaration -------------------
    const unattached = await place(idx, 'q00', 'fileA'); names.push('q00'); // position 16, before declaration: no family, nothing indexed
    const declared = await ix.tx('declare', [DE, 2]);
    const [familyId, familyOrdinal, d] = declared.values;
    evidence.gas.declare = String(declared.gasUsed);
    const fam = (await ix.view('family', [familyId])).values[0];
    assert.equal(fam.typeId, DE); assert.equal(Number(fam.packed & 0xffn), 2, 'fieldIndex');
    // program: skip 32 (parent REF) | skip var (name STRING) | target 32 (child REF)
    assert.equal(fam.program.toString(16), ((3n << 24n | 32n) << 64n | (2n << 24n) << 32n | (1n << 24n | 32n)).toString(16), 'compiled field-walk program');
    note('declare', { familyId, ordinal: String(familyOrdinal), declaredAt: String(d), gas: String(declared.gasUsed) });
    const pre = await ix.oracle(A, idx);
    assert.equal(pre.positions.length, N_PRE + 1);
    assert(pre.positions[N_PRE].ordinal <= d, 'q00 predates d');
    // Three ordinal domains (§11a): in mode 1 the raw kind-10 lane is a binding-key
    // ordinal and must NOT equal the admission ordinal the hydrated row recovers.
    if (WORLD.layout === 1) assert(pre.positions.every(p => p.lane < p.ordinal), 'mode 1: lanes are key ordinals, strictly below their first admission ordinal');
    else assert(pre.positions.every(p => p.lane === p.ordinal), 'mode 0: lanes ARE first admission ordinals');

    // A scope that predates d has no coverage slot yet; the gap [0, liveFrom) is explicit.
    {
      const c = (await ix.view('coverageOf', [familyId, scope])).values[0];
      assert.equal(c.slot, false); assert.equal(Number(c.state), COV.NONE); assert.equal(Number(c.liveFrom), N_PRE + 1); assert.equal(Number(c.through), 0);
    }

    // ---- delayed first backfill: writes land first ---------------------------
    const born = await place(idx, 'q01', 'fileA'); names.push('q01'); // position 17, born after d: hook-maintained
    evidence.gas.placementHookFreshWord = String(born.gasUsed);
    assert.equal((await ix.view('probe', [familyId, scope, B.fileA, 17])).values[0], true, 'hook set the bit at a born-after-d position');
    assert.equal((await ix.view('probe', [familyId, scope, B.fileB, 17])).values[0], false, 'born after d: a clear bit is a covered miss without any slot');
    {
      const u = await ix.view('probe', [familyId, scope, B.fileA, 1]);
      assert.equal(u.ok, false); assert.equal(u.error.name, 'Uncovered'); assert.deepEqual(u.error.args.map(Number), [1, 0, N_PRE + 1], 'uncovered clear bit reverts with the gap');
      const na = await ix.view('probe', [familyId, scope, B.fileA, 99]);
      assert.equal(na.error.name, 'NotAPosition');
      const un = await ix.view('probe', ['0x' + '11'.repeat(32), scope, B.fileA, 0]);
      assert.equal(un.error.name, 'Unsupported');
      const t1 = (await ix.view('probeTolerated', [familyId, scope, B.fileA, 1])).values; assert.equal(Number(t1[0]), TRI.UNCOVERED);
      const t2 = (await ix.view('probeTolerated', [familyId, scope, B.fileB, 17])).values; assert.equal(Number(t2[0]), TRI.MISS_COVERED);
      const t3 = (await ix.view('probeTolerated', [familyId, scope, B.fileA, 17])).values; assert.equal(Number(t3[0]), TRI.HIT);
      const t4 = await ix.view('probeTolerated', ['0x' + '11'.repeat(32), scope, B.fileA, 0]); assert.equal(Number(t4.values[0]), TRI.UNSUPPORTED);
    }
    // A rebind of an UNBACKFILLED pre-d position before any backfill: the hook
    // locates the position (kind-8 first ordinal + binary search over kind-10)
    // and sets the bit; a set bit in the gap is authoritative.
    {
      const r = await ix.rebindName({ principal: A, dir: idx, name: 'p05', child: objects.extra }); // p05 was fileB
      evidence.gas.directRebindFieldChangeUncovered = String(r.gasUsed);
      assert.equal((await ix.view('probe', [familyId, scope, B.extra, 5])).values[0], true, 'set bit in the gap -> true');
      const u = await ix.view('probe', [familyId, scope, B.fileB, 5]); assert.equal(u.error?.name, 'Uncovered', 'the old bucket was never set (uncovered) and stays unknown');
    }

    // ---- chunked backfill, writes during the build ----------------------------
    const c1 = await ix.tx('backfill', [familyId, scope, NONE, 6]);
    evidence.gas.backfillChunk6WithSlotInit = String(c1.gasUsed);
    assert.deepEqual(c1.values.map(Number), [6, N_PRE + 1, COV.PARTIAL]);
    {
      const c = (await ix.view('coverageOf', [familyId, scope])).values[0];
      assert.equal(c.slot, true); assert.equal(Number(c.revision), 1);
      const [pg, cov] = (await ix.view('page', [familyId, scope, B.fileA, 0, 512, 0])).values;
      assert.equal(Number(pg.completeness), COMPLETENESS.PARTIAL, 'page is PARTIAL while the gap exists');
      assert.deepEqual(pg.items.map(Number), [0, 4, 17], 'covered prefix hits plus the hook-maintained tail; the gap [6,17) is explicit');
      assert.deepEqual([Number(cov.through), Number(cov.liveFrom)], [6, N_PRE + 1]);
      assert.equal((await ix.view('probe', [familyId, scope, B.fileB, 0])).values[0], false, 'covered clear bit -> false');
    }
    // during: a placement (tail), a whiteout rebind inside the covered prefix, a
    // one-step field-changing rebind inside the prefix, and one inside the gap.
    const during = await place(idx, 'q02', 'fileB'); names.push('q02'); // position 18
    evidence.gas.placementHookWarmWord = String(during.gasUsed);
    {
      const p0 = await ix.priors(A, idx, 'p00');
      const rm = await auth.execute({ kind: 'remove', mountId, parent: idx, name: 'p00', object: objects.fileA, principal: A, selectedEntry: p0.targetA, priors: { source: p0.prior } });
      evidence.gas.removeRebindClear = String(rm.gasUsed);
      assert.equal((await ix.view('probe', [familyId, scope, B.fileA, 0])).values[0], false, 'whiteout rebind cleared the covered bit');
      const r2 = await ix.rebindName({ principal: A, dir: idx, name: 'p02', child: objects.fileB }); // draft -> fileB inside the covered prefix
      evidence.gas.directRebindFieldChangeCovered = String(r2.gasUsed);
      assert.equal((await ix.view('probe', [familyId, scope, B.fileB, 2])).values[0], true);
      assert.equal((await ix.view('probe', [familyId, scope, B.draft, 2])).values[0], false, 'old bucket cleared');
      await ix.rebindName({ principal: A, dir: idx, name: 'p09', child: objects.extra }); // fileB -> extra inside the gap
      assert.equal((await ix.view('probe', [familyId, scope, B.extra, 9])).values[0], true);
    }
    // guarded chunk lands; a stale guard is refused with the current frontier.
    const c2 = await ix.tx('backfill', [familyId, scope, 6, 6]);
    assert.deepEqual(c2.values.map(Number), [12, N_PRE + 1, COV.PARTIAL]);
    evidence.gas.backfillChunk6Guarded = String(c2.gasUsed);
    const stale = await ix.tx('backfill', [familyId, scope, 6, 6], { expectError: 'Guard' });
    assert.deepEqual(stale.rejected.args.map(Number), [12, 6]);
    evidence.gas.backfillGuardLoser = String(stale.gasUsed);
    // The backfill of position 9 ORed the hook's bit (extra) and did NOT set fileB: it reads the current head.
    assert.equal((await ix.view('probe', [familyId, scope, B.extra, 9])).values[0], true);
    assert.equal((await ix.view('probe', [familyId, scope, B.fileB, 9])).values[0], false);

    // ---- two builders racing, no guard: consecutive chunks both land ----------
    const builder2 = await ix.fundedWallet(0xb17dn);
    {
      await lab.rpc('evm_setAutomine', [false]);
      const data = ix.iface.encodeFunctionData('backfill', [familyId, scope, NONE, 2]);
      const t1 = await lab.send(data, lab.core);
      const t2 = await ix.send(data, builder2, { wait: false });
      await lab.rpc('evm_mine'); await lab.rpc('evm_setAutomine', [true]);
      const [r1, r2] = [await lab.receipt(t1, 'race 1'), await ix.waitReceipt(t2.hash)];
      assert.equal(r1.blockNumber, r2.blockNumber, 'same block');
      assert.equal(r1.status, '0x1'); assert.equal(r2.status, '0x1');
      const c = (await ix.view('coverageOf', [familyId, scope])).values[0];
      assert.deepEqual([Number(c.through), Number(c.liveFrom), Number(c.state)], [16, 17, COV.PARTIAL], 'both chunks landed consecutively');
      evidence.gas.raceNoGuard = [String(BigInt(r1.gasUsed)), String(BigInt(r2.gasUsed))];
    }
    // ---- two builders racing, with guard: the loser reverts -------------------
    const photosScope = scopeOf(A, f.photos); // predates d with 2 positions (pixel.png, draft.txt)
    {
      await lab.rpc('evm_setAutomine', [false]);
      const data = ix.iface.encodeFunctionData('backfill', [familyId, photosScope, 0, 1]);
      const t1 = await lab.send(data, lab.core);
      const t2 = await ix.send(data, builder2, { wait: false });
      await lab.rpc('evm_mine'); await lab.rpc('evm_setAutomine', [true]);
      const [r1, r2] = [await lab.receipt(t1, 'guard race 1'), await ix.waitReceipt(t2.hash)];
      assert.equal(r1.status, '0x1'); assert.equal(r2.status, '0x0', 'guarded loser reverts');
      const c = (await ix.view('coverageOf', [familyId, photosScope])).values[0];
      assert.deepEqual([Number(c.through), Number(c.liveFrom)], [1, 2]);
      evidence.gas.raceGuardWinnerLoser = [String(BigInt(r1.gasUsed)), String(BigInt(r2.gasUsed))];
      const fin = await ix.tx('backfill', [familyId, photosScope, NONE, 64]);
      assert.deepEqual(fin.values.map(Number), [2, 2, COV.COMPLETE]);
    }
    // finish the idx scope: COMPLETE, then the page is COMPLETE.
    const c3 = await ix.tx('backfill', [familyId, scope, NONE, 64]);
    assert.deepEqual(c3.values.map(Number), [17, 17, COV.COMPLETE]);
    const done = await ix.tx('backfill', [familyId, scope, NONE, 64]);
    assert.deepEqual(done.values.map(Number), [17, 17, COV.COMPLETE], 'idempotent after completion');
    {
      const [pg] = (await ix.view('page', [familyId, scope, B.fileA, 0, 512, 0])).values;
      assert.equal(Number(pg.completeness), COMPLETENESS.COMPLETE);
      assert.deepEqual(pg.items.map(Number), [4, 8, 12, 16, 17], 'p00 whiteout cleared; q00 (pre-d, no hook) backfilled; q01 hook');
      assert.equal(pg.cursor, (1n << 256n) - 1n, 'cursor END');
    }
    // writes after completion stay maintained
    const after = await place(idx, 'q03', 'draft'); names.push('q03'); // position 19
    assert.equal((await ix.view('probe', [familyId, scope, B.draft, 19])).values[0], true);

    // ---- differential oracle: every position, every bucket ----------------------
    async function differential(label) {
      const o = await ix.oracle(A, idx);
      let checked = 0;
      for (const p of o.positions) {
        for (const k of FILES) {
          const expected = p.bucket === B[k];
          const got = await ix.view('probe', [familyId, scope, B[k], p.position]);
          assert.equal(got.ok, true, label + ': probe must not revert once complete (' + js(got.error) + ')');
          assert.equal(got.values[0], expected, label + ': position ' + p.position + ' bucket ' + k + ' (head ' + (p.targetType === DE ? 'entry:' + bucketName(p.bucket) : p.targetType === WHITEOUT ? 'whiteout' : p.targetType) + ')');
          checked++;
        }
      }
      return { positions: o.positions.length, checked };
    }
    note('differential-complete', await differential('complete'));

    // ---- page cursor across a rebind between pages: refused, never spliced -------
    {
      const [p1] = (await ix.view('page', [familyId, scope, B.fileA, 0, 1, 0])).values;
      assert.equal(Number(p1.completeness), COMPLETENESS.PARTIAL); assert.deepEqual(p1.items.map(Number), [4]);
      const p4 = await ix.priors(A, idx, 'p04');
      await auth.execute({ kind: 'remove', mountId, parent: idx, name: 'p04', object: objects.fileA, principal: A, selectedEntry: p4.targetA, priors: { source: p4.prior } });
      const p2 = await ix.view('page', [familyId, scope, B.fileA, p1.cursor, 1, 0]);
      assert.equal(p2.ok, false); assert.equal(p2.error.name, 'ErrPageCursor', 'a cursor across an admission is refused');
      const basis = await ix.view('page', [familyId, scope, B.fileA, 0, 512, Number(p1.highWaterOrdinal)]);
      assert.equal(basis.error?.name, 'ErrPageBasis', 'a stale requested basis is refused');
      const [re] = (await ix.view('page', [familyId, scope, B.fileA, 0, 512, 0])).values;
      assert.deepEqual(re.items.map(Number), [8, 12, 16, 17], 're-based listing reflects the rebind, nothing spliced');
    }

    // ---- a scope born after d needs no coverage slot -----------------------------
    {
      const late = (await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'late', principal: A })).plan.predicted.objectId;
      const lateScope = scopeOf(A, late);
      await place(late, 'first', 'fileB');
      assert.equal((await ix.view('probe', [familyId, lateScope, B.fileB, 0])).values[0], true);
      assert.equal((await ix.view('probe', [familyId, lateScope, B.fileA, 0])).values[0], false);
      const bf = await ix.tx('backfill', [familyId, lateScope, NONE, 64]);
      assert.deepEqual(bf.values.map(Number), [0, 0, COV.COMPLETE]);
      evidence.gas.backfillBornAfterDNoSlot = String(bf.gasUsed);
      const c = (await ix.view('coverageOf', [familyId, lateScope])).values[0];
      assert.equal(c.slot, false); assert.equal(Number(c.state), COV.COMPLETE);
      const [pg] = (await ix.view('page', [familyId, lateScope, B.fileB, 0, 512, 0])).values;
      assert.equal(Number(pg.completeness), COMPLETENESS.COMPLETE);
      // ---- THREE first-time bindings of the same scope in ONE publication (§8 item 1) ----
      // leaf order: entry(fileA) | bind | whiteout | bind | entry(draft) | bind. The whiteout
      // is a first binding with NO family (no bit) and must still consume a position, so
      // positions are before+0 (fileA), before+1 (whiteout), before+2 (draft).
      const before = Number((await ix.view('coverageOf', [familyId, lateScope])).values[0].scopeCount);
      assert.equal(before, 1);
      const e1 = DirectoryEntryLeaf(late, 'multi-a', objects.fileA), w = WhiteoutLeaf(late, 'multi-w'), e2 = DirectoryEntryLeaf(late, 'multi-b', objects.draft);
      const b1 = BindLeaf(FIXTURE.namePurpose, late, nameRole('multi-a'), ordinaryRecord(e1.typeId, e1.body), null);
      const bw = BindLeaf(FIXTURE.namePurpose, late, nameRole('multi-w'), ordinaryRecord(w.typeId, w.body), null);
      const b2 = BindLeaf(FIXTURE.namePurpose, late, nameRole('multi-b'), ordinaryRecord(e2.typeId, e2.body), null);
      const multi = await ix.directAdmit({ principal: A, leaves: [e1, b1.leaf, w, bw.leaf, e2, b2.leaf], revisions: [[1, 0], [3, 0], [5, 0]] });
      evidence.gas.threeFirstBindingsOnePublication = String(multi.gasUsed);
      const o = await ix.oracle(A, late);
      assert.equal(o.positions.length, before + 3, 'three new positions');
      assert.deepEqual([o.positions[before].bucket, o.positions[before + 1].bucket, o.positions[before + 2].bucket], [B.fileA, null, B.draft], 'oracle: leaf order');
      assert.equal(o.positions[before + 1].targetType, WHITEOUT);
      for (const [pos, k] of [[before, 'fileA'], [before + 1, null], [before + 2, 'draft']]) for (const kk of FILES) {
        const got = await ix.view('probe', [familyId, lateScope, B[kk], pos]);
        assert.equal(got.ok, true, 'multi: probe ' + pos + ' ' + kk + ' ' + js(got.error));
        assert.equal(got.values[0], kk === k, 'multi-first-bindings: position ' + pos + ' bucket ' + kk);
      }
      const [pgA] = (await ix.view('page', [familyId, lateScope, B.fileA, 0, 512, 0])).values;
      assert.deepEqual(pgA.items.map(Number), [before], 'fileA at before+0 only');
      const [pgD] = (await ix.view('page', [familyId, lateScope, B.draft, 0, 512, 0])).values;
      assert.deepEqual(pgD.items.map(Number), [before + 2], 'draft at before+2 only');
      note('three-first-bindings-one-publication', { before, positions: before + 3, gas: String(multi.gasUsed) });
    }

    // ---- generic field walk: a STRING field (name) and a cross-Type family (FileRevision.mediaType) ----
    {
      const nameFam = (await ix.tx('declare', [DE, 1])).values[0];
      assert.equal((await ix.tx('backfill', [nameFam, scope, NONE, 64])).values.map(Number)[2], COV.COMPLETE);
      assert.equal((await ix.view('probe', [nameFam, scope, bucketOf(str('p08')), 8])).values[0], true, 'STRING field bucket = scalar(len2 + bytes)');
      assert.equal((await ix.view('probe', [nameFam, scope, bucketOf(str('p08')), 9])).values[0], false);
      const revFam = (await ix.tx('declare', [EXTENDED_TYPES['FileRevision/1'], 2])).values[0];
      const headScope = bindingScopeKey(A, FIXTURE.headPurpose, f.fileA);
      assert.equal((await ix.tx('backfill', [revFam, headScope, NONE, 8])).values.map(Number)[2], COV.COMPLETE);
      assert.equal((await ix.view('probe', [revFam, headScope, bucketOf(str('text/plain')), 0])).values[0], true, 'mediaType FIELD_EQ on the revision-head scope');
      const bad1 = await ix.tx('declare', [DE, 3], { expectError: 'UnsupportedField' }); // OPTION target
      const bad2 = await ix.tx('declare', [EXTENDED_TYPES['FileRevision/1'], 4], { expectError: 'UnsupportedField' }); // behind an OPTION
      assert.deepEqual([Number(bad1.rejected.args[0]), Number(bad2.rejected.args[0])], [3, 2]);
      const bad3 = await ix.tx('declare', ['0x' + '22'.repeat(32), 0], { expectError: 'Unsupported' });
      bad3;
    }

    // ---- detach: two-step, freezes, bits never cleared -------------------------------
    {
      const ann = await ix.tx('announceDetach', [familyId]);
      const detachAt = Number(ann.values[0]);
      const early = await ix.tx('detach', [familyId], { expectError: 'DetachState' });
      assert.equal(Number(early.rejected.args[0]), 3, 'too early');
      await auth.execute({ kind: 'tag', mountId, object: f.fileA, label: 'idx-one', principal: A });
      await auth.execute({ kind: 'tag', mountId, object: f.fileA, label: 'idx-two', principal: A });
      const ret = await ix.tx('detach', [familyId]);
      evidence.gas.detach = String(ret.gasUsed);
      assert(Number(ret.values[0]) >= detachAt);
      const fr = await ix.view('probe', [familyId, scope, B.fileA, 8]);
      assert.equal(fr.error?.name, 'Frozen');
      const [tri, cov] = (await ix.view('probeTolerated', [familyId, scope, B.fileA, 8])).values;
      assert.equal(Number(tri), TRI.FROZEN); assert.equal(Number(cov.state), COV.FROZEN);
      assert.deepEqual([Number(cov.through), Number(cov.liveFrom)], [17, 17], 'frozen interval kept');
      const [pg, pc] = (await ix.view('page', [familyId, scope, B.fileA, 0, 512, 0])).values;
      assert.equal(Number(pg.completeness), COMPLETENESS.PARTIAL, 'a retired family never reads complete');
      assert.equal(Number(pc.state), COV.FROZEN);
      assert.deepEqual(pg.items.map(Number), [8, 12, 16, 17], 'bits never cleared');
      const bf = await ix.tx('backfill', [familyId, scope, NONE, 8], { expectError: 'Frozen' });
      bf;
      const post = await place(idx, 'q04', 'fileA'); // position 20: the hook skips a retired family
      evidence.gas.placementAfterRetire = String(post.gasUsed);
      const [pg2] = (await ix.view('page', [familyId, scope, B.fileA, 0, 512, 0])).values;
      assert.deepEqual(pg2.items.map(Number), [8, 12, 16, 17], 'no maintenance after retirement');
      // re-attach is a NEW family id with fresh coverage
      const again = (await ix.tx('declare', [DE, 2])).values[0];
      assert.notEqual(again, familyId);
      const c = (await ix.view('coverageOf', [again, scope])).values[0];
      assert.equal(c.slot, false); assert.equal(Number(c.state), COV.NONE);
      const fresh = await ix.view('probe', [again, scope, B.fileA, 20]);
      assert.equal(fresh.error?.name, 'Uncovered', 'for the NEW family every existing position (q04 included) predates its declaration');
      assert.equal(Number((await ix.view('probeTolerated', [again, scope, B.fileA, 20])).values[0]), TRI.UNCOVERED);
    }
    evidence.gas.unattachedPlacementU4 = String(unattached.gasUsed);
    evidence.gas.placementAfterComplete = String(after.gasUsed);
    note('done', { names: names.length });
  }, { watchdogMs: 1200000 });
  mkdirSync(LAB + 'evidence', { recursive: true });
  writeFileSync(LAB + WORLD.evidence, JSON.stringify(evidence, null, 2) + '\n');
  console.log('[' + WORLD.name + '] index-layer gas (receipts, MEASURED, not retained as traces):', evidence.gas);
});
