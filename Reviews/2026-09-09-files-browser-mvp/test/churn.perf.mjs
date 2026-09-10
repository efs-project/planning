// Churn-heavy and larger-folder enumeration at the ACTUAL integration
// boundary: names are created and removed through FilesRouterV2 with signed
// author intents (the browser's exact write path), then enumerated by the
// production reader under the raised budgets, page-size 32, and a transport
// that coalesces concurrent requests into round trips exactly like the
// relay's /rpc-batch and the direct JSON-RPC batch (ONE injected delay per
// round trip). Retained baseline for the 64-name/60-removed shape:
// ../2026-09-09-files-reader-scale/churn-evidence.json (sequential transport,
// page 8: 496 requests, 7.7 s at 50 ms; page 4: budget refusal at 512).
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
import { createFixtureReader, openDirectory, FIXTURE, bindingKey, nameRole } from '../../2026-09-09-files-reader/index.mjs';

// Concurrent requests inside one microtask window share ONE round trip (and
// one injected delay), mirroring web/rpc-source.mjs batching + /rpc-batch.
function coalescingSource(lab, identity, delayMs, counters) {
  let queue = [];
  const flush = async batch => {
    counters.roundTrips++;
    counters.widest = Math.max(counters.widest, batch.length);
    if (delayMs) await new Promise(ok => setTimeout(ok, delayMs));
    await Promise.all(batch.map(async ({ entry, resolve, reject }) => {
      try { resolve(await lab.rpc(entry.method, entry.params, entry.maxBytes ? { maxBytes: entry.maxBytes } : {})); } catch (e) { reject(e); }
    }));
  };
  return {
    identity, epoch: 1,
    request(method, params, { maxBytes } = {}) {
      return new Promise((resolve, reject) => {
        queue.push({ entry: { method, params, maxBytes }, resolve, reject });
        if (queue.length === 1) queueMicrotask(() => { const batch = queue; queue = []; flush(batch); });
      });
    },
  };
}

test('churn-heavy and larger folders through router + reader', { timeout: 1800000 }, async () => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const { f, auth, config } = await startEnvironment(lab, { write: true, relay: false });
    const mountId = config.mounts.aFirst;
    async function prior(principal, purpose, subject, role) {
      const head = lab.readIface.decodeFunctionResult('getBindingHead', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getBindingHead', [bindingKey(principal, purpose, subject, role)]) }, 'latest']));
      const h = head[0];
      if (h[3] === 0n) return null;
      const occ = lab.readIface.decodeFunctionResult('getOccurrenceByOrdinal', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getOccurrenceByOrdinal', [h[4]]) }, 'latest']));
      return { revision: Number(h[3]), occurrence: { envelopeId: occ[0], leafIndex: Number(occ[1]) } };
    }

    // Build one folder per arm through the REAL routed write path.
    async function buildArm(label, lifetimeNames, removed) {
      const t0 = performance.now();
      const folder = await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: label, principal: auth.A });
      const subject = folder.plan.predicted.objectId;
      const children = [];
      for (let i = 0; i < lifetimeNames; i++) {
        const name = 'd' + String(i).padStart(3, '0');
        const made = await auth.execute({ kind: 'createDir', mountId, parent: subject, name, principal: auth.A });
        children.push({ name, entryId: made.plan.predicted.entryId, objectId: made.plan.predicted.objectId });
      }
      for (let i = 0; i < removed; i++) { // oldest first, matching the retained baseline shape
        const child = children[i];
        await auth.execute({
          kind: 'remove', mountId, parent: subject, name: child.name, object: child.objectId,
          principal: auth.A, selectedEntry: child.entryId,
          priors: { source: await prior(auth.A, FIXTURE.namePurpose, subject, nameRole(child.name)) },
        });
      }
      console.log(label + ': built ' + lifetimeNames + ' names, removed ' + removed + ' in ' + ((performance.now() - t0) / 1000).toFixed(1) + 's');
      return { label, subject, lifetimeNames, removed, live: lifetimeNames - removed };
    }
    const arms = [
      await buildArm('churn64', 64, 60),   // the retained-baseline shape
      await buildArm('churn512', 512, 464), // representative churn-heavy larger folder
      await buildArm('wide300', 300, 0),   // representative large live folder
    ];

    async function measure(arm, pageSize, delayMs) {
      const counters = { roundTrips: 0, widest: 0 };
      const reader = createFixtureReader({ source: coalescingSource(lab, auth.expected.source, delayMs, counters), context: { expected: auth.expected } });
      const opened = await reader.open({});
      assert.equal(opened.status, 'READY');
      const scope = opened.scope;
      const qualifyTrips = counters.roundTrips;
      const t0 = performance.now();
      const stream = openDirectory(scope, { mountId, subject: arm.subject, pageSize });
      let s; do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED');
      const elapsedMs = +(performance.now() - t0).toFixed(1);
      const stats = scope.stats();
      scope.close();
      const sample = {
        arm: arm.label, lifetimeNames: arm.lifetimeNames, live: arm.live, pageSize, delayMs,
        coverage: s.coverage, rowsVisible: s.rows.length,
        requests: stats.requests, bytes: stats.bytes,
        roundTrips: counters.roundTrips - qualifyTrips, widestBatch: counters.widest, elapsedMs,
      };
      assert.equal(s.coverage, 'COMPLETE', arm.label + ' page ' + pageSize + ': enumeration must COMPLETE within budget');
      assert.equal(s.rows.length, arm.live, arm.label + ': exactly the live placements are visible');
      console.log(JSON.stringify(sample));
      return sample;
    }

    const out = {
      kind: 'CHURN_AND_SCALE_AT_ROUTER_BOUNDARY',
      baseline: '../2026-09-09-files-reader-scale/churn-evidence.json (64 lifetime names, sequential transport: page 8 = 496 requests / 7.7 s at 50 ms; page 4 = 512-request budget refusal)',
      limits: 'DEFAULT_LIMITS raised to maxRequests 4096 / maxBytes 32 MiB / maxInFlight 16; page-size cap 32; transport coalesces concurrent requests per round trip',
      exclusions: ['WAN percentiles', 'finality', 'production SLA', 'folders beyond 512 lifetime names'],
      samples: [],
    };
    for (const arm of arms) {
      for (const pageSize of arm.label === 'churn64' ? [8, 32] : [32]) {
        for (const delayMs of [0, 50]) out.samples.push(await measure(arm, pageSize, delayMs));
      }
    }
    await writeFile(new URL('../evidence/churn-perf.json', import.meta.url), JSON.stringify(out, null, 1));
    console.log('evidence/churn-perf.json written');
  }, { profile: 'reads', watchdogMs: 1700000 });
});
