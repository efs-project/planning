// Executable regressions for the reported completeness-COMPOSITION failure
// class, at the actual integration boundary (the production reader against
// real local contracts, plus the browser's copy/export claim). The Python
// tournament evidence reported two composition breaks: a merge emitted
// absence from empty PARTIAL pages, and two shards differing only in domain
// closure collided on one basis. These tests pin the corresponding behavior
// where consumers actually read:
//   1. A budget-exhausted enumeration never claims COMPLETE and never
//      fabricates ABSENT for positions it did not finish proving.
//   2. A point lookup on an exhausted scope refuses (UNKNOWN); it does not
//      return ABSENT for a name that exists.
//   3. One scope, one basis, three domain closures (aFirst/bFirst/exact):
//      each lens derives its own outcome and repeated reads do not
//      contaminate each other through shared caches.
//   4. openRemoved on an exhausted scope is UNKNOWN — unreadable, not empty.
// The browser-side copy assertion (a PARTIAL listing must not export as a
// complete folder copy) lives in test/completeness.browser.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade, B } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { createFixtureReader, openDirectory, openRemoved, lookupName } from '../../2026-09-09-files-reader/index.mjs';

function nodeSource(lab) {
  return { identity: lab.expected.source, epoch: 1, request: (method, params, { maxBytes } = {}) => lab.rpc(method, params, maxBytes ? { maxBytes } : {}) };
}
async function drain(stream) {
  let s;
  do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED');
  return s;
}
const names = s => [...s.rows, ...s.unresolved, ...s.masked, ...s.absent].map(r => r.value?.name).filter(Boolean);

test('completeness composition regressions at the reader boundary', { timeout: 600000 }, async () => {
  compileUpgrade();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    // A real disagreement so the three lenses (domain closures) must differ:
    // B also claims note.txt, pointing at the OTHER file.
    await f.claim(B, 'note.txt', f.fileB);
    const LIVE = ['kept.txt', 'note.txt', 'photos'];

    // 3. Basis binds domain closure: one scope, one basis, three lenses,
    //    repeated in both directions with shared caches.
    {
      const reader = createFixtureReader({ source: nodeSource(lab), context: { expected: lab.expected } });
      const opened = await reader.open({});
      assert.equal(opened.status, 'READY', opened.reason);
      const scope = opened.scope;
      const under = async lens => drain(openDirectory(scope, { mountId: f.mounts[lens], pageSize: 8 }));
      const a1 = await under('aFirst'), x1 = await under('exact'), b1 = await under('bFirst'), a2 = await under('aFirst');
      for (const s of [a1, x1, b1, a2]) { assert.equal(s.coverage, 'COMPLETE'); assert.deepEqual(s.basis, a1.basis, 'one shared basis'); }
      const noteOf = s => [...s.rows, ...s.unresolved].find(r => (r.value?.name ?? r.name) === 'note.txt' || r.value?.name === 'note.txt');
      assert.equal(a1.rows.find(r => r.value.name === 'note.txt').value.nodeId, f.fileA, 'aFirst selects the A file');
      assert.equal(b1.rows.find(r => r.value.name === 'note.txt').value.nodeId, f.fileB, 'bFirst selects the B file');
      assert(!x1.rows.some(r => r.value.name === 'note.txt'), 'exact lens selects NO note.txt row');
      assert.equal(x1.unresolved.find(r => r.fieldRole === a1.rows.find(w => w.value.name === 'note.txt').fieldRole)?.outcome, 'CONFLICT', 'exact lens reports the disagreement as CONFLICT');
      assert.equal(a2.rows.find(r => r.value.name === 'note.txt').value.nodeId, f.fileA, 'repeat read under aFirst is NOT contaminated by bFirst/exact');
      assert(noteOf(a1) && noteOf(b1), 'both closures resolved the position');
      scope.close();
    }

    // 1 + 2 + 4. Exhausted budgets never manufacture completeness or absence.
    let sawPartialRefusal = false;
    for (const maxRequests of [40, 60, 80, 100, 120]) {
      const reader = createFixtureReader({ source: nodeSource(lab), context: { expected: lab.expected, limits: { maxRequests } } });
      const opened = await reader.open({});
      if (opened.status !== 'READY') continue; // qualification itself refused: honest, nothing claimed
      const scope = opened.scope;
      const s = await drain(openDirectory(scope, { mountId: f.mounts.aFirst, pageSize: 8 }));
      if (s.rowsEvidence === 'PRIOR_SEALED') {
        sawPartialRefusal = true;
        assert.notEqual(s.coverage, 'COMPLETE', 'refusal at budget ' + maxRequests + ' must not claim COMPLETE');
        assert(s.reason, 'refusal carries a reason');
        assert.equal(s.absent.length, 0, 'no fabricated ABSENT at budget ' + maxRequests + ' (absent: ' + names({ rows: [], unresolved: [], masked: [], absent: s.absent }) + ')');
        assert(names(s).length <= LIVE.length, 'no fabricated rows');
        // 2. Point lookup on the exhausted scope: refuses, never ABSENT.
        const point = await lookupName(scope, { mountId: f.mounts.aFirst, name: 'kept.txt' });
        assert.notEqual(point.outcome, 'ABSENT', 'existing name must not become ABSENT on an exhausted scope');
        assert.equal(point.outcome, 'UNKNOWN', 'exhausted point lookup is UNKNOWN');
        assert.notEqual(point.qualification.coverage, 'COMPLETE', 'no COMPLETE qualification from an exhausted lookup');
        // 4. Removed items on the exhausted scope: unreadable, NOT empty.
        const removed = await openRemoved(scope, { mountId: f.mounts.aFirst });
        assert.equal(removed.outcome, 'UNKNOWN', 'exhausted openRemoved is UNKNOWN, never an empty success');
      } else {
        // Budget happened to suffice: the result must then be exactly right.
        assert.equal(s.coverage, 'COMPLETE');
        assert(LIVE.every(n => s.rows.some(r => r.value.name === n)), 'complete result lists every live name');
      }
      scope.close();
    }
    assert(sawPartialRefusal, 'at least one budget arm exercised the refusal path');
  }, { profile: 'reads' });
});
