// Read-path measurements over the seeded world: cold open, navigation with a
// shared scope (no re-qualification), file open, and the same journeys at
// 0 ms / 50 ms injected per-RPC delay. Labeled loopback measurements only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { createFixtureReader, openDirectory, openFile } from '../../2026-09-09-files-reader/index.mjs';

function delayedSource(lab, delayMs) {
  return { identity: lab.expected.source, epoch: 1, async request(m, p, { maxBytes } = {}) { if (delayMs) await new Promise(ok => setTimeout(ok, delayMs)); return lab.rpc(m, p, maxBytes ? { maxBytes } : {}); } };
}
async function drain(stream) { let s; do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED'); return s; }

test('navigation and content read costs, shared scope vs fresh scope', { timeout: 600000 }, async () => {
  compileUpgrade();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    const out = { samples: [], exclusions: ['WAN percentiles', 'finality', 'production SLA', 'large-folder churn (retained control in files-reader-scale)'] };
    for (const delayMs of [0, 50]) {
      const reader = createFixtureReader({ source: delayedSource(lab, delayMs), context: { expected: lab.expected } });
      const t0 = performance.now();
      const opened = await reader.open({});
      assert.equal(opened.status, 'READY');
      const scope = opened.scope;
      const afterQualify = performance.now();
      const qualifyRequests = scope.stats().requests;
      const root = await drain(openDirectory(scope, { mountId: f.mounts.aFirst, pageSize: 8 }));
      assert.equal(root.coverage, 'COMPLETE');
      const afterRoot = performance.now();
      const rootRequests = scope.stats().requests - qualifyRequests;
      // navigation WITHOUT re-qualification: same scope, child subject
      const child = await drain(openDirectory(scope, { mountId: f.mounts.aFirst, subject: f.photos, pageSize: 8 }));
      assert.equal(child.coverage, 'COMPLETE');
      const afterChild = performance.now();
      const childRequests = scope.stats().requests - qualifyRequests - rootRequests;
      const content = await openFile(scope, { mountId: f.mounts.aFirst, fileId: f.fileA });
      assert.equal(content.value?.integrity, 'VERIFIED');
      const afterContent = performance.now();
      const contentRequests = scope.stats().requests - qualifyRequests - rootRequests - childRequests;
      // the comparison arm: a FRESH scope for the same child listing
      const opened2 = await reader.open({ blockTag: '0x' + scope.basis.blockNumber.toString(16) });
      const scope2 = opened2.scope;
      const t2 = performance.now();
      await drain(openDirectory(scope2, { mountId: f.mounts.aFirst, subject: f.photos, pageSize: 8 }));
      const freshNav = { elapsedMs: +(performance.now() - t2).toFixed(1), requests: scope2.stats().requests };
      out.samples.push({
        delayMs,
        qualify: { elapsedMs: +(afterQualify - t0).toFixed(1), requests: qualifyRequests },
        rootListing: { elapsedMs: +(afterRoot - afterQualify).toFixed(1), requests: rootRequests },
        childNavigationSharedScope: { elapsedMs: +(afterChild - afterRoot).toFixed(1), requests: childRequests },
        openVerifiedFile: { elapsedMs: +(afterContent - afterChild).toFixed(1), requests: contentRequests },
        childNavigationFreshScope: freshNav,
        totalBytes: scope.stats().bytes,
      });
      scope.close(); scope2.close();
    }
    console.log(JSON.stringify(out, null, 1));
  }, { profile: 'reads' });
});
