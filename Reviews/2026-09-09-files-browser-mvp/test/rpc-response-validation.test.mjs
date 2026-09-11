// Protocol correlation is necessary, not proof that an RPC provider is honest.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDirectRPCSource, directWritePath } from '../web/rpc-source.mjs';

async function withReply(reply, run, status = 200) {
  const server = http.createServer(async (req, res) => {
    let text = ''; for await (const chunk of req) text += chunk;
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(reply(JSON.parse(text))));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const good = (id, result = '0x1') => ({ jsonrpc: '2.0', id, result });

test('out-of-order batch replies correlate by exact ID, not array position', async () => {
  await withReply(rows => [good(rows[1].id, '0xbb'), good(rows[0].id, '0xaa')], async url => {
    const source = createDirectRPCSource({ identity: 'test', url });
    assert.deepEqual(await Promise.all([source.request('eth_chainId', []), source.request('eth_blockNumber', [])]), ['0xaa', '0xbb']);
  });
});

for (const [label, reply] of [
  ['foreign IDs', () => [good(100, '0xaa'), good(101, '0xbb')]],
  ['missing ID', () => [good(0, '0xaa')]],
  ['duplicate ID', () => [good(0, '0xaa'), good(0, '0xbb')]],
  ['extra unknown ID', () => [good(0), good(1), good(2)]],
  ['string ID', () => [good('0'), good(1)]],
  ['null row', () => [good(0), null]],
  ['missing version', () => [{ id: 0, result: '0xaa' }, good(1)]],
  ['wrong version', () => [{ jsonrpc: '1.0', id: 0, result: '0xaa' }, good(1)]],
  ['missing result and error', () => [{ jsonrpc: '2.0', id: 0 }, good(1)]],
  ['both result and error', () => [good(0), { ...good(1), error: { code: -32000, message: 'no' } }]],
  ['null error', () => [good(0), { jsonrpc: '2.0', id: 1, error: null }]],
  ['untyped error code', () => [good(0), { jsonrpc: '2.0', id: 1, error: { code: '-32000', message: 'no' } }]],
  ['object instead of batch', () => good(0)],
]) test(`malformed ${label} rejects the entire batch before any result is exposed`, async () => {
  await withReply(reply, async url => {
    const source = createDirectRPCSource({ identity: 'test', url });
    const results = await Promise.allSettled([source.request('eth_chainId', []), source.request('eth_blockNumber', [])]);
    assert.deepEqual(results.map(r => r.status), ['rejected', 'rejected']);
  });
});

test('well-formed per-item RPC error preserves sibling result and diagnostic data', async () => {
  await withReply(() => [good(1, null), { jsonrpc: '2.0', id: 0, error: { code: -32000, message: 'refused', data: '0xdead' } }], async url => {
    const source = createDirectRPCSource({ identity: 'test', url });
    const results = await Promise.allSettled([source.request('eth_call', []), source.request('eth_getTransactionReceipt', [])]);
    assert.equal(results[0].status, 'rejected'); assert.equal(results[0].reason.data, '0xdead');
    assert.deepEqual(results[1], { status: 'fulfilled', value: null });
  });
});

for (const [label, reply, status] of [
  ['wrong ID', () => good(999), 200],
  ['missing ID', () => ({ jsonrpc: '2.0', result: '0x1' }), 200],
  ['array for single request', r => [good(r.id)], 200],
  ['HTTP failure with result', r => good(r.id), 503],
  ['result and error', r => ({ ...good(r.id), error: { code: -32000, message: 'no' } }), 200],
]) test(`single direct read and write paths refuse ${label}`, async () => {
  await withReply(reply, async url => {
    const source = createDirectRPCSource({ identity: 'test', url });
    await assert.rejects(source.request('eth_chainId', []));
    await assert.rejects(directWritePath(url).publish('0x1234'));
  }, status);
});

test('single null receipt and exact successful write remain valid', async () => {
  await withReply(r => good(r.id, r.method === 'eth_getTransactionReceipt' ? null : '0xab'), async url => {
    const direct = directWritePath(url);
    assert.equal(await direct.receipt('0xcd'), null);
    assert.equal(await direct.publish('0x1234'), '0xab');
  });
});
