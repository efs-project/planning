import assert from 'node:assert/strict';
import test from 'node:test';
import { get } from 'node:http';
import { startDemo } from '../scripts/demo.mjs';

test('loopback gateway fails closed without exercising local signing or mutation', { timeout: 60000 }, async t => {
  const demo = await startDemo({ compileFirst: false, lifetimeMs: 90000 });
  try {
    const post = (path, request, origin = demo.origin) => fetch(`${demo.origin}/${path}`, {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(request),
    });
    await t.test('top-level document cannot be framed', async () => {
      const response = await fetch(demo.origin);
      assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.equal(response.headers.get('cache-control'), 'no-store');
    });
    await t.test('host and cross-origin JSON gates', async () => {
      const hostStatus = await new Promise((resolve, reject) => {
        get(demo.origin, { headers: { host: 'attacker.invalid' } }, response => {
          response.resume(); resolve(response.statusCode);
        }).on('error', reject);
      });
      assert.equal(hostStatus, 403);
      assert.equal((await post('wallet', { method: 'eth_accounts' }, 'https://attacker.invalid')).status, 403);
      assert.equal((await fetch(`${demo.origin}/wallet`, { method: 'POST', body: '{}' })).status, 403);
    });
    await t.test('read channel cannot mutate or target other contracts', async () => {
      assert.equal((await post('rpc', { method: 'eth_sendTransaction', params: [{}] })).status, 400);
      assert.equal((await post('rpc', { method: 'eth_getCode', params: [demo.config.accounts.owner, 'latest'] })).status, 400);
    });
    await t.test('wrong signer and foreign domain cannot be signed', async () => {
      assert.equal((await post('wallet', { method: 'eth_signTypedData_v4', params: [demo.config.accounts.relayer, {}] })).status, 400);
      assert.equal((await post('wallet', { method: 'eth_signTypedData_v4', params: [demo.config.accounts.owner,
        { domain: { name: 'foreign' }, primaryType: 'Operation' }] })).status, 400);
    });
    await t.test('transaction target, value and channel cannot be escalated', async () => {
      const tx = { from: demo.config.accounts.owner, to: demo.config.deployment.core, data: '0x' };
      for (const body of [{ ...tx, to: demo.config.accounts.relayer }, { ...tx, value: '0x1' }, tx]) {
        assert.equal((await post('wallet', { method: 'eth_sendTransaction', params: [body] })).status, 400);
      }
      assert.equal((await post('session', { method: 'eth_sendTransaction', params: [tx] })).status, 400);
    });
    await t.test('oversized JSON and unknown paths reject', async () => {
      assert.equal((await post('wallet', { padding: 'x'.repeat(262145) })).status, 400);
      assert.equal((await fetch(`${demo.origin}/src/EfsLab.sol`)).status, 404);
    });
    assert.deepEqual(demo.counts, {}, 'no rejected request reaches any local provider');
  } finally { await demo.close(); }
});
