/** Read-only loopback child for the bounded gallery RSS discriminator. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadEthers} from './compact-environment.mjs';
import {createReadTransport} from './compact-read-transport.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';

const [inputPath, sequence] = process.argv.slice(2);
assert(inputPath && ['eight', 'one-then-eight', 'eight-1000'].includes(sequence), 'bounded read sequence');
const input = JSON.parse(await readFile(inputPath, 'utf8'));
const fileCount = sequence === 'eight-1000' ? 1000 : 250;
assert(input.files.length === fileCount && input.authors.length === 8, 'exact File/eight-author fixture');
assert(input.rpcUrl.startsWith('http://127.0.0.1:'), 'owned loopback RPC only');
const cap = {nodeRss: (sequence === 'eight-1000' ? 640 : 768) * 2**20,
  wallMs: 60_000, pages: sequence === 'eight-1000' ? 40 : 16};
const started = Date.now(), e = await loadEthers();
const rpc = createReadTransport({url: input.rpcUrl});
const memory = () => ({...process.memoryUsage(), peakRss: process.resourceUsage().maxRSS * 1024});
const emit = row => process.stdout.write(JSON.stringify(row) + '\n');
const expected = new Set(input.files.filter((_, i) => i % 2 === 0).map(row => row.file.toLowerCase()));
const check = () => {
  const now = memory();
  assert(now.rss <= cap.nodeRss && now.peakRss <= cap.nodeRss && Date.now() - started <= cap.wallMs,
    'CHILD_SAFETY_STOP');
  return now;
};

async function walk(width) {
  const sdk = createFilesCompactSdk({ethers: e, manifest: input.manifest, rpc});
  const authors = input.authors.slice(0, width), folder = input.folders[width === 1 ? 'one' : 'eight'];
  const pinStart = performance.now(), context = await sdk.pin();
  emit({kind: 'pin', width, elapsedMs: performance.now() - pinStart, memory: check(), cache: sdk.readMetrics()});
  let page, pages = 0, scanned = 0, rows = 0;
  const seen = new Set();
  do {
    const start = performance.now(), before = {...rpc.metrics};
    page = await sdk.listFolderPage({folder, authors, context, budget: 32, concept: input.concept,
      tagScope: 'revision', policy: 'ordered', continuation: page?.continuation});
    const pageMs = performance.now() - start;
    assert(['PARTIAL', 'COMPLETE'].includes(page.queryCoverage), 'joined page unavailable');
    pages++; scanned += Number(page.scanned); rows += page.pageRows.length;
    for (const row of page.pageRows) {
      const id = row.file.toLowerCase();
      assert(expected.has(id) && !seen.has(id), 'wrong or duplicate selected File');
      assert(row.name.knowledge === 'PRESENT' && row.point.value.revision?.knowledge === 'PRESENT'
        && row.point.value.revisionTag.assessment === 'PRESENT' && row.match === 'MATCH',
      'page qualification');
      seen.add(id);
    }
    emit({kind: 'page', width, page: pages, elapsedMs: pageMs, scanned: Number(page.scanned),
      scannedSoFar: scanned, rawTotal: Number(page.rawTotal), rows: page.pageRows.length,
      rowsSoFar: rows, coverage: page.queryCoverage,
      rpcCalls: rpc.metrics.calls - before.calls,
      httpRequests: rpc.metrics.httpRequests - before.httpRequests,
      responseBytes: rpc.metrics.responseBytes - before.responseBytes,
      memory: check(), cache: sdk.readMetrics()});
    assert(pages <= cap.pages, 'bounded full traversal');
  } while (page.continuation);
  assert.equal(page.queryCoverage, 'COMPLETE');
  assert.equal(scanned, Number(page.rawTotal));
  assert.equal(rows, fileCount / 2);
  assert.equal(seen.size, expected.size);
  return {width, pages, scanned, rows, memory: check(), cache: sdk.readMetrics()};
}

const results = [];
for (const width of sequence === 'one-then-eight' ? [1, 8] : [8]) {
  results.push(await walk(width));
  global.gc?.();
  emit({kind: 'released', width, memory: check()});
}
emit({kind: 'complete', sequence, results, memory: check(), transport: rpc.snapshot()});
