// Disposable real-chain continuation pressure fixture. This is not a benchmark
// of WAN service, 10k directories, admission optimizations, or sustained memory.
import assert from 'node:assert/strict';
import { readFile, open, statfs } from 'node:fs/promises';
import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const stringify = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? String(v) : v);
const digest = value => createHash('sha256').update(value).digest('hex');
const tuple = row => ({ name: row.value.name, subject: row.value.subject, selectedId: row.selectedId, kind: row.value.kind });
const sortRows = rows => [...rows].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const GiB = 1024n ** 3n;
const exec = promisify(execFile);
const diskGuardReason = (sample, initial = false) => {
  if (initial && sample.freeBytes < 50n * GiB) return 'INITIAL_FREE_SPACE';
  if (sample.freeBytes < 40n * GiB) return 'FREE_SPACE_FLOOR';
  if (sample.cacheBytes >= 60n * GiB) return 'CACHE_CEILING';
  return null;
};

// Break caught: a COMPLETE count-only test accepts wrong identities, duplicated
// rows, unresolved candidates, or falsely complete work at a different basis.
function assertOracle(result, expected, basis, complete = false) {
  assert.deepEqual(result.basis, basis, 'every page belongs to the pinned observation');
  assert.equal(result.rowsEvidence, 'CURRENT_SEALED', 'only sealed current-acquisition rows qualify');
  assert.equal(result.qualification.status, 'QUALIFIED');
  assert.equal(result.qualification.coverage, result.coverage, 'value and qualification coverage agree');
  for (const key of ['unresolved', 'masked', 'absent']) assert.deepEqual(result[key], [], key + ' must not hide or fabricate a written child');
  const oracle = new Map(expected.map(row => [row.name, row]));
  const actual = result.rows.map(row => { assert.equal(row.outcome, 'FOUND'); return tuple(row); });
  assert.equal(new Set(actual.map(row => row.name)).size, actual.length, 'no duplicate names');
  for (const row of actual) assert.deepEqual(row, oracle.get(row.name), 'name, object and selected entry equal the accepted write');
  if (complete) {
    assert.equal(result.coverage, 'COMPLETE');
    assert.deepEqual(sortRows(actual), sortRows(expected), 'exact full oracle, not merely matching counts');
    assert.equal(result.progress.reduce((n, source) => n + source.scanned, 0n), BigInt(expected.length), 'every expected first-mutation anchor scanned once');
  }
}

function selfTest() {
  const basis = { blockNumber: 7n, blockHash: 'basis' };
  const expected = [
    { name: 'first', subject: 'object-one', selectedId: 'entry-one', kind: 'DIRECTORY' },
    { name: 'second', subject: 'object-two', selectedId: 'entry-two', kind: 'DIRECTORY' },
  ];
  const good = {
    basis, coverage: 'COMPLETE', rowsEvidence: 'CURRENT_SEALED',
    qualification: { status: 'QUALIFIED', coverage: 'COMPLETE' }, unresolved: [], masked: [], absent: [],
    rows: expected.map(({ name, subject, selectedId, kind }) => ({ outcome: 'FOUND', selectedId, value: { name, subject, kind } })),
    progress: [{ scanned: 2n }],
  };
  assertOracle(good, expected, basis, true);
  for (const mutate of [
    r => { r.rows[1].value.name = 'other'; },
    r => { r.rows[1].value.subject = 'wrong-object'; },
    r => { r.rows[1].selectedId = 'wrong-entry'; },
    r => { r.rows[1].value.kind = 'FILE'; },
    r => { r.rows[1] = structuredClone(r.rows[0]); },
    r => { r.rows.pop(); },
    r => { r.unresolved.push({ outcome: 'UNKNOWN' }); },
    r => { r.masked.push({ outcome: 'MASKED' }); },
    r => { r.basis.blockNumber++; },
    r => { r.coverage = 'PARTIAL'; },
    r => { r.qualification.coverage = 'PARTIAL'; },
    r => { r.rowsEvidence = 'PRIOR_SEALED'; },
    r => { r.progress[0].scanned++; },
  ]) {
    const changed = structuredClone(good); mutate(changed);
    assert.throws(() => assertOracle(changed, expected, basis, true));
  }
  console.log('oracle self-check: valid result accepted; 13 semantic falsifiers refused');
  assert.equal(diskGuardReason({ freeBytes: 50n * GiB, cacheBytes: 0n }, true), null);
  assert.equal(diskGuardReason({ freeBytes: 49n * GiB, cacheBytes: 0n }, true), 'INITIAL_FREE_SPACE');
  assert.equal(diskGuardReason({ freeBytes: 39n * GiB, cacheBytes: 0n }), 'FREE_SPACE_FLOOR');
  assert.equal(diskGuardReason({ freeBytes: 50n * GiB, cacheBytes: 60n * GiB }), 'CACHE_CEILING');
  assert.equal(diskGuardReason({ freeBytes: 40n * GiB, cacheBytes: 59n * GiB }), null);
  console.log('resource guard self-check: initial floor, ongoing floor and cache ceiling boundaries verified');
}

async function availableBytes(path) {
  const fs = await statfs(path, { bigint: true });
  return fs.bavail * fs.bsize;
}

// Operational protection of this laptop, not a semantic directory-size cap.
// A sampled ceiling is an abort trigger, not an OS-enforced hard disk quota.
async function monitorResources(lab, report) {
  assert(isAbsolute(lab.cachePath) && typeof lab.stopNode === 'function', 'managed owned-cache lifecycle is required before a scale run');
  report.cachePath = lab.cachePath; report.samples = [];
  let pending = null, timer, closed = false;
  async function sample() {
    if (closed || report.failure) return;
    const started = performance.now();
    try {
      const [freeBytes, usage] = await Promise.all([
        availableBytes(lab.cachePath), exec('du', ['-sk', lab.cachePath], { timeout: 10000, maxBuffer: 65536 }),
      ]);
      const match = /^([0-9]+)\s/.exec(usage.stdout);
      assert(match, 'cache footprint must be measured, never guessed as zero');
      const row = { at: new Date().toISOString(), freeBytes, cacheBytes: BigInt(match[1]) * 1024n, durationMs: performance.now() - started };
      report.samples.push(row);
      const reason = diskGuardReason(row);
      if (reason) report.failure = { reason, sample: row };
    } catch (error) { report.failure = { reason: 'RESOURCE_MEASUREMENT_UNAVAILABLE', message: error.message }; }
    if (report.failure) {
      try { report.stop = await lab.stopNode(); }
      catch (error) { report.stopFailure = error.message; }
    }
  }
  const check = () => pending ?? (pending = sample().finally(() => { pending = null; }));
  const throwIfFailed = () => { assert(!report.failure, 'RESOURCE_GUARD: ' + report.failure?.reason); };
  await check(); throwIfFailed();
  timer = setInterval(check, 2000);
  return {
    throwIfFailed,
    async close() { closed = true; clearInterval(timer); await pending; },
  };
}

function integerOption(name, fallback, min, max) {
  const raw = process.env[name] ?? String(fallback);
  assert(/^[0-9]+$/.test(raw), name + ' must be an integer');
  const value = Number(raw);
  assert(Number.isSafeInteger(value) && value >= min && value <= max, name + ' is outside the experiment range');
  return value;
}

// Measures the actual fetch boundary used by the exported browser transport.
// Payload bytes exclude HTTP headers, TCP/TLS and compression framing. Streaming
// counting preserves the transport's response bound and cancellation behavior.
function measureFetch(url) {
  const original = globalThis.fetch;
  const counts = { httpRequests: 0, batchedHttpRequests: 0, rpcEntriesOnWire: 0, widestBatch: 0, requestBodyBytes: 0, responseBodyBytes: 0, httpFailures: 0 };
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), url, 'only the managed local endpoint is measured');
    const body = JSON.parse(init.body), width = Array.isArray(body) ? body.length : 1;
    counts.httpRequests++; counts.batchedHttpRequests += width > 1 ? 1 : 0;
    counts.rpcEntriesOnWire += width; counts.widestBatch = Math.max(counts.widestBatch, width);
    counts.requestBodyBytes += Buffer.byteLength(init.body);
    try {
      const response = await original(input, init);
      if (!response.ok) counts.httpFailures++;
      return new Response(response.body.pipeThrough(new TransformStream({ transform(chunk, controller) { counts.responseBodyBytes += chunk.byteLength; controller.enqueue(chunk); } })), {
        status: response.status, statusText: response.statusText, headers: response.headers,
      });
    } catch (error) { counts.httpFailures++; throw error; }
  };
  return { snapshot: () => ({ ...counts }), restore: () => { globalThis.fetch = original; } };
}

async function sourcePins(root) {
  const paths = execFileSync('git', ['ls-files', 'Reviews/2026-09-05-c0-core', 'Reviews/2026-09-08-upgradeable-foundation', 'Reviews/2026-09-09-files-reader', 'Reviews/2026-09-09-files-browser-mvp'], { cwd: root, encoding: 'utf8' }).trim().split('\n')
    .filter(path => /\.(?:mjs|sol|json|toml)$/.test(path) && !path.includes('/evidence/'));
  paths.push('Reviews/2026-09-09-files-browser-mvp/test/continuation-scale.perf.mjs');
  return Object.fromEntries(await Promise.all([...new Set(paths)].map(async path => [path, digest(await readFile(resolve(root, path)))])));
}

async function main() {
  const count = integerOption('EFS_SCALE_COUNT', 48, 1, 1000);
  const maxRequests = integerOption('EFS_SCALE_MAX_REQUESTS', count >= 1000 ? 4096 : 256, 100, 4096);
  const pageSize = integerOption('EFS_SCALE_PAGE_SIZE', count >= 1000 ? 32 : 4, 1, 32);
  const maxAcquisitions = integerOption('EFS_SCALE_MAX_ACQUISITIONS', 200, 1, 500);
  const output = process.env.EFS_SCALE_OUTPUT;
  assert(output && isAbsolute(output), 'EFS_SCALE_OUTPUT must be a NEW explicit absolute evidence path');
  assert(process.env.EFS_TEST_BUILD_ROOT, 'isolated EFS_TEST_BUILD_ROOT is required');
  const root = fileURLToPath(new URL('../../..', import.meta.url));
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(head, '4de8157e0a8eab769e6d8c8ff4a805bce1e561b8', 'run only in the fixed baseline verification checkout; integration on a new Solidity checkpoint is separate');
  const handle = await open(output, 'wx'); // Refuse to overwrite any retained run.
  const out = {
    kind: 'REAL_FILES_ROUTER_SAME_BASIS_CONTINUATION', status: 'RUNNING', startedAt: new Date().toISOString(),
    source: { head, node: process.version, buildRoot: process.env.EFS_TEST_BUILD_ROOT },
    knobs: { count, pageSize, maxRequests, maxAcquisitions, maxLoadMoreAttempts: count * 2 + 100, deadlineMs: 60000, maxBytes: 33554432, artificialDelayMs: 0 },
    exclusions: ['Fable admission optimization', '10k directories', 'churn-heavy or multi-Lens scale', 'WAN latency percentiles and production RPC SLA', 'sustained-memory behavior', 'cross-chain fees', 'cryptographic chain-state proofs'],
    notes: ['Read RPC consumes no transaction gas.', 'HTTP payload byte counts exclude headers, framing and TLS.', 'Repeated logical requests include requalification, failed-page replay and cache loss; they are not all retries.', 'Memory snapshots include test oracle and instrumentation; no forced GC.', 'Write gas excludes environment deployment/seed state and includes the experiment parent folder plus every child.'],
    resourceSafety: { initialFreeSpaceMinimumBytes: 50n * GiB, freeSpaceFloorBytes: 40n * GiB, cacheCeilingBytes: 60n * GiB, sampleIntervalMs: 2000, footprintMeasurementTimeoutMs: 10000, scope: 'Operational sampled abort thresholds, not semantic caps or an OS hard quota; du payload allocation and statfs available bytes. Monitor overhead is retained in samples and included in run times.' },
    writes: { receipts: [], totalGasUsed: '0' }, samples: [], acquisitions: [],
  };
  try {
    out.resourceSafety.initialFreeBytes = await availableBytes(root);
    assert.equal(diskGuardReason({ freeBytes: out.resourceSafety.initialFreeBytes, cacheBytes: 0n }, true), null, 'RESOURCE_GUARD: at least50GiB free is required before compile/deploy');
    out.source.pins = await sourcePins(root);
    const { compileUpgrade, withUpgrade } = await import('../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
    const { startEnvironment, compileRouter } = await import('../scripts/environment.mjs');
    const { createFixtureReader, openDirectory } = await import('../../2026-09-09-files-reader/index.mjs');
    const { createDirectRPCSource } = await import('../web/rpc-source.mjs');
    compileUpgrade(); compileRouter();
    await withUpgrade(async lab => {
      const resources = await monitorResources(lab, out.resourceSafety);
      try {
      out.compiler = { compiler: lab.resources.compiler, versions: lab.resources.versions, settings: lab.resources.settings, compilerInputHash: lab.resources.compilerInputHash, compilerOutputHash: lab.resources.compilerOutputHash, artifactPins: lab.resources.artifactPins };
      const { f, auth, config, rpcUrl } = await startEnvironment(lab, { write: true, relay: false });
      const mountId = config.mounts.aFirst;
      const writeStart = performance.now();
      async function create(parent, name) {
        resources.throwIfFailed();
        const made = await auth.execute({ kind: 'createDir', mountId, parent, name, principal: auth.A });
        assert.equal(made.receipt.status, '0x1');
        out.writes.receipts.push({ name, hash: made.receipt.transactionHash, blockNumber: made.receipt.blockNumber, gasUsed: made.gasUsed.toString() });
        out.writes.totalGasUsed = (BigInt(out.writes.totalGasUsed) + made.gasUsed).toString();
        resources.throwIfFailed();
        return { name, subject: made.plan.predicted.objectId, selectedId: made.plan.predicted.entryId, kind: 'DIRECTORY' };
      }
      const parent = await create(f.root, 'continuation-scale');
      const expected = [];
      for (let i = 0; i < count; i++) {
        expected.push(await create(parent.subject, 'child-' + String(i).padStart(4, '0')));
        if ((i + 1) % 100 === 0) console.log('accepted child writes: ' + (i + 1) + '/' + count);
      }
      out.writes.elapsedMs = performance.now() - writeStart;
      out.oracle = { parent, expected, expectedSha256: digest(stringify(sortRows(expected))) };
      const pinned = await lab.rpc('eth_getBlockByNumber', ['latest', false]);
      const fetchMetrics = measureFetch(rpcUrl);
      let scope, stream, acquisition = 0;
      const requestsSeen = new Map();
      const logical = { attempts: 0, rejected: 0, repeatedCalls: 0, repeatedAcrossAcquisitions: 0, automaticTransportRetries: 0 };
      const direct = createDirectRPCSource({ identity: auth.expected.source, url: rpcUrl });
      const source = {
        identity: direct.identity, epoch: direct.epoch,
        async request(method, params, options) {
          logical.attempts++;
          const key = stringify([method, params]), before = requestsSeen.get(key);
          if (before !== undefined) { logical.repeatedCalls++; if (before !== acquisition) logical.repeatedAcrossAcquisitions++; }
          requestsSeen.set(key, acquisition);
          try { return await direct.request(method, params, options); }
          catch (error) { logical.rejected++; throw error; }
        },
      };
      const reader = createFixtureReader({ source, context: { expected: auth.expected, limits: { maxRequests, deadlineMs: 60000 } } });
      const readStart = performance.now();
      let basis, previousSealed, last, firstUsefulMs = null, failures = 0, successfulPages = 0;
      async function acquire() {
        acquisition++;
        assert(acquisition <= maxAcquisitions, 'bounded acquisition count exceeded');
        const opened = await reader.open({ blockTag: pinned.number });
        assert.equal(opened.status, 'READY', 'independent acquisition: ' + opened.reason);
        return opened.scope;
      }
      try {
        scope = await acquire(); basis = scope.basis;
        assert.equal(basis.blockHash, pinned.hash);
        out.basis = basis; out.qualificationMs = performance.now() - readStart;
        stream = openDirectory(scope, { mountId, subject: parent.subject, pageSize });
        for (let attempt = 1; attempt <= out.knobs.maxLoadMoreAttempts; attempt++) {
          resources.throwIfFailed();
          last = await stream.loadMore();
          const sample = { attempt, acquisition, elapsedMs: performance.now() - readStart, rows: last.rows.length, coverage: last.coverage, rowsEvidence: last.rowsEvidence, reason: last.reason ?? null, detail: last.detail ?? null, progress: last.progress, logical: { ...logical }, http: fetchMetrics.snapshot(), memory: process.memoryUsage() };
          out.samples.push(sample);
          resources.throwIfFailed();
          if (last.qualification.status === 'UNAVAILABLE') {
            failures++;
            assert.match(last.detail ?? '', /request budget exceeded/, 'only explicit request-budget exhaustion is continued');
            assert(previousSealed, 'at least one sealed page must fit; cannot restart an unsealed frontier');
            assert.deepEqual(last.rows, previousSealed.rows, 'budget failure preserves the prior sealed rows');
            assert.deepEqual(last.progress, previousSealed.progress, 'budget failure preserves the prior sealed cursors');
            const next = await acquire();
            try { assert.equal((await stream.resume(next)).status, 'RESUMED', 'same stream, new qualified acquisition'); }
            catch (error) { next.close(); throw error; }
            out.acquisitions.push({ acquisition: acquisition - 1, stats: scope.stats() });
            scope.close(); scope = next;
          } else {
            assertOracle(last, expected, basis);
            successfulPages++; previousSealed = last;
            if (last.rows.length && firstUsefulMs === null) firstUsefulMs = performance.now() - readStart;
            if (last.coverage === 'COMPLETE') break;
          }
        }
        assertOracle(last, expected, basis, true);
        if (count >= 48) assert(acquisition >= 3, 'pressure arm crosses at least two acquisition boundaries');
        let predecessor = last.priorSealed, segments = 1;
        while (predecessor) {
          assert.deepEqual(predecessor.basis, basis); assert.equal(predecessor.rowsEvidence, 'CURRENT_SEALED');
          assert(predecessor.evidence.some(item => item.purpose === 'seal'));
          segments++; predecessor = predecessor.priorSealed;
          assert(segments <= maxAcquisitions, 'bounded evidence predecessor chain');
        }
        assert.equal(segments, acquisition, 'every acquisition predecessor retained');
        const actual = sortRows(last.rows.map(tuple));
        out.result = { coverage: last.coverage, exactOracle: true, actual, actualSha256: digest(stringify(actual)), rows: actual.length, scannedCandidates: last.progress.reduce((n, item) => n + item.scanned, 0n), successfulPages, failedPageAttempts: failures, acquisitions: acquisition, predecessorSegments: segments, firstUsefulPrefixMs: firstUsefulMs, completeMs: performance.now() - readStart };
        out.status = 'PASS';
      } finally {
        if (scope) out.acquisitions.push({ acquisition, stats: scope.stats() });
        out.readWork = { logical, distinctLogicalRequests: requestsSeen.size, http: fetchMetrics.snapshot(), memory: process.memoryUsage() };
        stream?.close(); scope?.close(); fetchMetrics.restore();
      }
      } finally { await resources.close(); if (out.status === 'PASS') resources.throwIfFailed(); }
    }, { profile: 'reads', watchdogMs: 1700000 });
  } catch (error) {
    out.status = 'FAIL'; out.failure = { name: error.name, message: error.message };
    throw error;
  } finally {
    out.finishedAt = new Date().toISOString();
    await handle.writeFile(JSON.stringify(out, (_, v) => typeof v === 'bigint' ? String(v) : v, 2) + '\n');
    await handle.close();
    console.log(stringify({ status: out.status, output, result: out.result && { ...out.result, actual: undefined }, writeGasUsed: out.writes.totalGasUsed, readWork: out.readWork, failure: out.failure }));
  }
}

if (process.argv.includes('--self-test')) selfTest();
else await main();
