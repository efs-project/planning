import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFilesRoute, validateFileInput, createDirectoryPager, verifiedFileBytes, revisionWindow } from '../web/files-view.mjs';

const id = `0x${'a'.repeat(64)}`;
const contentId = `0x${'c'.repeat(64)}`;
const basis = { blockHash: `0x${'b'.repeat(64)}`, blockNumber: 10n };
const domain = { chainId: 31337n, runId: id, realmId: id, profile: 'efs-lab/1', operation: 'page:children', subject: id };
const q = { coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE', authority: 'CHAIN_AT_BASIS', integrity: 'NOT_APPLICABLE', bytes: 'RETURNED' };
const itemId = n => `0x${n.toString(16).padStart(64, '0')}`;
const page = (cursor, total, overrides = {}) => {
  const next = Math.min(cursor + 8, total);
  return { outcome: 'FOUND', basis, domain, cursor: BigInt(cursor), next: BigInt(next), total: BigInt(total),
    items: Array.from({ length: next - cursor }, (_, index) => itemId(cursor + index + 1)),
    continuation: next < total ? { cursor: BigInt(next), basis, domain, total: BigInt(total) } : null,
    qualification: { ...q, coverage: next < total || cursor > 0 ? 'PARTIAL' : 'COMPLETE' }, ...overrides };
};

test('strict Files routes retain uint64 revision precision and reject ambiguous or foreign routes', () => {
  assert.deepEqual(parseFilesRoute('#files'), { kind: 'directory', id: null });
  assert.deepEqual(parseFilesRoute(`#files/dir/${id}`), { kind: 'directory', id });
  assert.deepEqual(parseFilesRoute(`#files/file/${id}?revision=18446744073709551615`), { kind: 'file', id, revision: 18446744073709551615n });
  assert.deepEqual(parseFilesRoute(`#files/file/${id}`), { kind: 'file', id, revision: null });
  for (const bad of ['#file', '#files/', '#files?x=1', '#files/dir/root', `#files/dir/${id}?revision=1`,
    `#files/file/${id}?revision=0`, `#files/file/${id}?revision=01`, `#files/file/${id}?revision=1.0`,
    `#files/file/${id}?revision=18446744073709551616`, `#files/file/${id}?revision=1&revision=2`,
    `#files/file/${id}?revision=1&extra=x`, `#files/file/${id}/more`, `#files/file/${id}%3Frevision=1`]) {
    assert.throws(() => parseFilesRoute(bad), /route|revision/i, bad);
  }
});

test('write input enforces exact lab names and binary/text byte limits before any caller can plan', () => {
  assert.equal(validateFileInput({ name: 'a'.repeat(64), text: 'hello' }).data.length, 5);
  assert.equal(validateFileInput({ name: 'empty.txt', text: '' }).data.length, 0);
  const bytes = new Uint8Array([0, 255, 128, 1]);
  const validated = validateFileInput({ name: 'binary.dat', bytes });
  assert.deepEqual(validated.data, bytes);
  bytes[0] = 14;
  assert.equal(validated.data[0], 0, 'freeze the selected upload by copying bytes');
  assert.equal(validateFileInput({ name: 'limit.bin', bytes: new Uint8Array(16384) }).data.length, 16384);
  for (const name of ['', '.', '..', 'a'.repeat(65), '../escape', 'hello world', 'é.txt', 'name\u0000', '<svg>']) {
    assert.throws(() => validateFileInput({ name, text: '' }), /name/i, name);
  }
  assert.throws(() => validateFileInput({ name: 'oversize.bin', bytes: new Uint8Array(16385) }), /16 KiB/i);
  assert.throws(() => validateFileInput({ name: 'utf8.txt', text: '€'.repeat(5462) }), /16 KiB/i);
  assert.throws(() => validateFileInput({ name: 'bad.bin', bytes: '0x00' }), /Uint8Array/i);
  assert.deepEqual(validateFileInput({ name: 'folder', action: 'folder', text: 'ignored' }).data, new Uint8Array());
});

test('pagination retains pages at one basis with bounded 8-row requests and aggregated coverage', async () => {
  const requests = [];
  const pager = createDirectoryPager({ sdk: { readPage: async request => { requests.push(request); return page(Number(request.cursor), 10); } }, directory: id });
  const first = await pager.loadMore();
  assert.equal(first.items.length, 8); assert.equal(first.complete, false);
  const second = await pager.loadMore();
  assert.equal(second.items.length, 10); assert.equal(second.complete, true);
  assert.equal(second.pages.length, 2); assert.equal(second.qualification.coverage, 'COMPLETE');
  assert.deepEqual(requests.map(r => ({ cursor: r.cursor, limit: r.limit })), [{ cursor: 0n, limit: 8 }, { cursor: 8n, limit: 8 }]);
  assert.deepEqual(requests[1].blockTag, basis);
  await pager.loadMore(); assert.equal(requests.length, 2, 'completed listings issue no extra calls');
});

test('pagination rejects mixed basis, changed total/domain, missing progress and duplicate rows without dropping prior pages', async () => {
  const badPages = [
    page(8, 10, { basis: { ...basis, blockHash: id } }),
    page(8, 10, { basis: { ...basis, blockNumber: 11n } }),
    page(8, 10, { basis: { ...basis, chainId: 31338n } }),
    page(8, 11),
    page(8, 10, { domain: { ...domain, subject: contentId } }),
    page(8, 10, { items: [], next: 8n }),
    page(8, 10, { items: [itemId(1), itemId(10)] }),
    page(8, 10, { cursor: 0n }),
  ];
  for (const bad of badPages) {
    let calls = 0;
    const pager = createDirectoryPager({ sdk: { readPage: async () => ++calls === 1 ? page(0, 10) : bad }, directory: id });
    await pager.loadMore();
    await assert.rejects(pager.loadMore(), /basis|total|domain|progress|duplicate|cursor/i);
    assert.equal(pager.snapshot().items.length, 8);
    assert.equal(pager.snapshot().complete, false);
  }
});

test('unavailable continuation remains retryable UNKNOWN evidence and cannot prove directory completion', async () => {
  let calls = 0;
  const unavailable = { outcome: 'UNKNOWN', basis, domain, qualification: { ...q, coverage: 'UNKNOWN', availability: 'UNKNOWN' }, reasonCode: 'PAGE_UNAVAILABLE' };
  const pager = createDirectoryPager({ sdk: { readPage: async () => ++calls === 1 ? page(0, 10) : calls === 2 ? unavailable : page(8, 10) }, directory: id });
  await pager.loadMore();
  const failed = await pager.loadMore();
  assert.equal(failed.items.length, 8); assert.equal(failed.complete, false); assert.equal(failed.lastResult, unavailable);
  assert.equal((await pager.loadMore()).items.length, 10);
});

test('an unavailable first page keeps UNKNOWN coverage instead of inventing partial enumeration', async () => {
  const unknown = { outcome: 'UNKNOWN', basis, domain, qualification: { ...q, coverage: 'UNKNOWN', availability: 'UNKNOWN' }, reasonCode: 'PAGE_UNAVAILABLE' };
  const pager = createDirectoryPager({ sdk: { readPage: async () => unknown }, directory: id });
  const result = await pager.loadMore();
  assert.equal(result.qualification.coverage, 'UNKNOWN');
  assert.equal(result.items.length, 0); assert.equal(result.complete, false);
});

test('binary download admission requires an exact matching revision and verified returned bytes at one basis', () => {
  const revision = { outcome: 'FOUND', basis, qualification: q, value: { contentId } };
  const result = { outcome: 'FOUND', basis, domain: { subject: contentId }, qualification: { ...q, integrity: 'VERIFIED' }, value: { bytes: '0x00ff8001' } };
  assert.deepEqual(verifiedFileBytes({ revision, result }), new Uint8Array([0, 255, 128, 1]));
  for (const bad of [
    { ...result, qualification: { ...result.qualification, integrity: 'FAILED' } },
    { ...result, qualification: { ...result.qualification, availability: 'UNAVAILABLE' } },
    { ...result, qualification: { ...result.qualification, support: 'UNSUPPORTED' } },
    { ...result, basis: { blockHash: id } },
    { ...result, basis: { ...basis, blockNumber: 11n } },
    { ...result, basis: { ...basis, chainId: 31338n } },
    { ...result, domain: { subject: id } },
    { ...result, value: { bytes: '0x0z' } },
    { ...result, value: { bytes: '0x0' } },
  ]) assert.throws(() => verifiedFileBytes({ revision, result: bad }), /verified|basis|content|bytes/i);
  assert.throws(() => verifiedFileBytes({ revision: { ...revision, outcome: 'UNKNOWN' }, result }), /revision|qualified/i);
});

test('history windows retain uint64 precision and request at most eight exact revisions at once', () => {
  assert.deepEqual(revisionWindow(10n), [10n, 9n, 8n, 7n, 6n, 5n, 4n, 3n]);
  assert.deepEqual(revisionWindow(2n), [2n, 1n]);
  assert.deepEqual(revisionWindow(0n), []);
  assert.deepEqual(revisionWindow(18446744073709551615n).slice(0, 2), [18446744073709551615n, 18446744073709551614n]);
  assert.throws(() => revisionWindow(-1n), /revision/i);
});
