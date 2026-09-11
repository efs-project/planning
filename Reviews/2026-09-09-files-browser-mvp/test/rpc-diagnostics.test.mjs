import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDirectRPCSource } from '../web/rpc-source.mjs';
test('direct read source measures logical calls versus batches and rejects cancelled results', async () => {
  const server = http.createServer(async (req, res) => { let body = ''; for await (const chunk of req) body += chunk; const parsed = JSON.parse(body), rows = (Array.isArray(parsed) ? parsed : [parsed]).map(x => ({ jsonrpc: '2.0', id: x.id, result: '0x1' })); res.end(JSON.stringify(Array.isArray(parsed) ? rows : rows[0])); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const source = createDirectRPCSource({ identity: 'unique-source', url: `http://127.0.0.1:${server.address().port}` });
    await Promise.all([source.request('eth_chainId', []), source.request('eth_blockNumber', [])]);
    assert.equal(typeof source.metrics, 'function', 'RPC measurements available');
    assert.equal(source.identity, 'unique-source'); assert.equal(source.metrics().logicalCalls, 2); assert.equal(source.metrics().httpBatches, 1);
    assert(source.metrics().requestBytes > 20); assert(source.metrics().responseBytes > 20);
    const abort = new AbortController(); abort.abort();
    await assert.rejects(source.request('eth_chainId', [], { signal: abort.signal }), /abort/i);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
