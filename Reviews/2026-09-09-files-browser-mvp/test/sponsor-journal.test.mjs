// Real HTTP server, calldata construction and local transaction signing. The
// only fake is the external chain boundary, for deterministic response loss.
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { Transaction, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { startBrowserServer } from '../scripts/server.mjs';
import { planOperation, carrier3Interface, core3Interface } from '../sdk/files-actions.mjs';

const hooks = registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('/Reviews/')) return next(new URL('../../..' + specifier, import.meta.url).href, context);
  return next(specifier, context);
} });
const wallet = await import('../web/wallet.mjs');
hooks.deregister();
const ZERO = '0x' + '00'.repeat(32);
const sponsorKey = '0x' + '12'.repeat(32);
const signature = '0x' + '34'.repeat(65);
const router = '0x' + '11'.repeat(20), carrier = '0x' + '22'.repeat(20), core = '0x' + '33'.repeat(20);
const json = x => JSON.stringify(x, (_, value) => typeof value === 'bigint' ? String(value) : value);
const boundedJSON = response => response.json();

function request(withChunks = false) {
  const plan = planOperation({ kind: withChunks ? 'createFile' : 'createDir', mountId: ZERO,
    parent: ZERO, principal: ZERO, pubNonce: 1n, name: 'journal', bytesHex: '0x' + 'ab'.repeat(8192) });
  const content = plan.predicted.content;
  return JSON.parse(json({ op: plan.op, publication: plan.publication, expectedRevision: 0,
    intent: { opCommitment: ZERO, byteCommitment: ZERO, executor: router, executorCodehash: ZERO, nonce: '0', deadline: '9999999999' },
    signature, ...(content ? { content: { treeId: content.treeId, body: content.tree.body, leaves: content.leaves },
      chunks: content.chunks.map((chunkData, index) => ({ index, chunkData })) } : {}) }));
}

async function environment(t, { failSendAt = 0, receiptStatus = '0x1', holdSend = null, refusePreflight = false, echoSecrets = false } = {}) {
  const sends = [], receipts = new Map();
  const rpc = async (method, params) => {
    if (method === 'eth_call') {
      if (params[0].to === core) return core3Interface.encodeFunctionResult('principalAccount', ['0x' + '44'.repeat(20)]);
      if (params[0].to === router && refusePreflight) throw Error('author preflight refused');
      if (params[0].data.startsWith(carrier3Interface.getFunction('hasChunk').selector)) return carrier3Interface.encodeFunctionResult('hasChunk', [false]);
      return '0x';
    }
    if (method === 'eth_getTransactionCount') return '0x' + sends.length.toString(16);
    if (method === 'eth_sendRawTransaction') {
      const tx = Transaction.from(params[0]);
      sends.push({ hash: keccak256(params[0]), to: tx.to.toLowerCase(), nonce: tx.nonce });
      const receipt = { transactionHash: tx.hash, status: receiptStatus, gasUsed: '0x5208', effectiveGasPrice: '0x77359400', blockHash: '0x' + '56'.repeat(32), blockNumber: '0x1', from: tx.from, to: tx.to };
      receipts.set(tx.hash, receipt);
      if (holdSend) await holdSend;
      if (sends.length === failSendAt) {
        if (echoSecrets) throw Object.assign(Error('RPC error with raw ' + params[0] + ', signature ' + signature + ', key ' + sponsorKey), { data: { raw: params[0], signature, sponsorKey } });
        throw Error('RPC response lost after accepting transaction');
      }
      return tx.hash;
    }
    if (method === 'eth_getTransactionReceipt') return receipts.get(params[0]) ?? null;
    throw Error('unexpected RPC: ' + method);
  };
  const server = await startBrowserServer({ config: {}, addresses: [router, carrier, core], selectors: [], rpc,
    write: { sponsorKey, router, carrier, core } });
  t.after(() => server.close());
  const post = async (body, path = '/sponsor', origin = server.url) => {
    const response = await fetch(server.url + path, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: json(body) });
    return { status: response.status, body: await response.json() };
  };
  return { server, sends, receipts, post };
}

test('wallet preserves explicit true/false/null submission evidence and partial transactions on errors', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  for (const submitted of [true, false, null]) {
    const transactions = [{ phase: 'chunk', index: 0, hash: ZERO, status: 'confirmed', receipt: { gasUsed: '0x5208' } }];
    globalThis.fetch = async () => new Response(json({ error: 'later stage failed', submitted, transactions }), { status: 502 });
    await assert.rejects(wallet.sponsorSubmit('/sponsor', {}, boundedJSON), e => {
      assert.equal(e.submitted, submitted);
      assert.deepEqual(e.transactions, transactions);
      return true;
    });
  }
});

test('unknown structured replies cannot trigger the legacy prebroadcast-refusal guard', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  for (const submitted of [null, undefined, 'false', 0]) {
    globalThis.fetch = async () => new Response(json({ error: 'unconfirmed send', submitted }), { status: 502 });
    await assert.rejects(wallet.sponsorSubmit('/sponsor', {}, boundedJSON), error => {
      assert.equal(error.submitted, null);
      assert.equal(Boolean(error.structured && !error.submitted), false, 'old app cannot release its outstanding intent');
      return true;
    });
  }
});

test('request identity is stable across JSON key order and binds changed bytes', () => {
  assert.equal(typeof wallet.sponsorRequestIdentity, 'function');
  const first = wallet.sponsorRequestIdentity({ content: { bytes: '0xab', count: 2n }, signature });
  assert.deepEqual(wallet.sponsorRequestIdentity({ signature, content: { count: '2', bytes: '0xab' } }), first);
  assert.notEqual(wallet.sponsorRequestIdentity({ content: { bytes: '0xac', count: 2n }, signature }).requestCommitment, first.requestCommitment);
  assert.equal(wallet.sponsorRequestIdentity({ requestId: 'action-17', content: { bytes: '0xab', count: 2n }, signature }).requestId, 'action-17');
});

test('partial chunk RPC loss retains prior fee receipt and locally derived unknown hash; status recovers without rebroadcast', async t => {
  const env = await environment(t, { failSendAt: 2 });
  const body = { ...request(true), requestId: 'partial-chunks' };
  const failed = await env.post(body);
  assert.equal(failed.status, 502);
  assert.equal(failed.body.submitted, true, 'the first acknowledged chunk was submitted');
  assert.equal(failed.body.transactions?.length, 2, 'partial attempts survive the error');
  assert.equal(failed.body.transactions[0].receipt.effectiveGasPrice, '0x77359400');
  assert.equal(failed.body.transactions[1].hash, env.sends[1].hash);
  assert.equal(failed.body.transactions[1].status, 'broadcasting');
  const identity = { requestId: body.requestId, requestCommitment: failed.body.requestCommitment };
  for (let i = 0; i < 2; i++) {
    const status = await env.post(identity, '/sponsor/status');
    assert.equal(status.body.result.transactions[1].status, 'confirmed');
    assert.equal(status.body.result.transactions[1].receipt.gasUsed, '0x5208');
    assert.equal(status.body.result.execute, null, 'recovery never submits the unattempted admission');
  }
  await env.post(body);
  assert.equal(env.sends.length, 2, 'same request retries and status reads cannot spend again');
});

test('first RPC response loss is UNKNOWN, not a prebroadcast refusal', async t => {
  const env = await environment(t, { failSendAt: 1 });
  const failed = await env.post({ ...request(), requestId: 'lost-first' });
  assert.equal(failed.body.submitted, null);
  assert.equal(failed.body.transactions[0].hash, env.sends[0].hash);
});

test('same ID and changed commitment refuses without losing old transaction evidence', async t => {
  const env = await environment(t);
  const body = { ...request(), requestId: 'bound-id' };
  const first = await env.post(body);
  assert.equal(first.body.result.submitted, true);
  const changed = await env.post({ ...body, expectedRevision: 1 });
  assert.equal(changed.status, 409);
  assert.equal(changed.body.submitted, true);
  assert.equal(changed.body.transactions[0].hash, first.body.result.transactions[0].hash);
  assert.equal(env.sends.length, 1);
});

test('status polls observe an in-flight locally hashed attempt without queuing or rebroadcast', async t => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  t.after(() => release());
  const env = await environment(t, { holdSend: held });
  const body = { ...request(), requestId: 'in-flight' };
  // The identity is computed before network dispatch and contains no signature.
  assert.equal(typeof wallet.sponsorRequestIdentity, 'function');
  const identity = wallet.sponsorRequestIdentity(body);
  const pending = env.post({ ...body, ...identity });
  while (!env.sends.length) await new Promise(resolve => setImmediate(resolve));
  const status = await env.post(identity, '/sponsor/status');
  assert.equal(status.body.result.transactions[0].hash, env.sends[0].hash);
  assert.equal(env.sends.length, 1);
  release();
  await pending;
});

test('queued request cannot claim a prebroadcast refusal while it may still run; sends remain serialized', async t => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  t.after(() => release());
  const env = await environment(t, { holdSend: held });
  const first = env.post({ ...request(), requestId: 'queue-first' });
  while (!env.sends.length) await new Promise(resolve => setImmediate(resolve));
  const secondBody = { ...request(), requestId: 'queue-second' };
  const second = env.post(secondBody);
  const identity = wallet.sponsorRequestIdentity(secondBody);
  let snapshot;
  do { snapshot = (await env.post(identity, '/sponsor/status')).body.result; } while (snapshot.status === 'unknown');
  try {
    assert.equal(snapshot.submitted, null, 'queued work has not been terminally refused');
    assert.deepEqual(snapshot.transactions, []);
    assert.equal(env.sends.length, 1);
  } finally { release(); await Promise.all([first, second]); }
  assert.deepEqual(env.sends.map(send => send.nonce), [0, 1]);
});

test('missing process journal stays UNKNOWN and status enforces same-origin', async t => {
  const env = await environment(t);
  const identity = { requestId: 'missing', requestCommitment: ZERO };
  const missing = await env.post(identity, '/sponsor/status');
  assert.equal(missing.status, 200);
  assert.equal(missing.body.result.submitted, null);
  assert.equal(missing.body.result.status, 'unknown');
  assert.deepEqual(missing.body.result.transactions, []);
  assert.equal((await env.post(identity, '/sponsor/status', 'https://other.example')).status, 403);
  assert.equal(env.sends.length, 0);
});

test('preflight refusal is explicitly false; mined reverts and public receipts are preserved without secrets', async t => {
  const refused = await environment(t, { refusePreflight: true });
  const response = await refused.post(request());
  assert.equal(response.body.submitted, false);
  assert.deepEqual(response.body.transactions, []);
  assert.equal(refused.sends.length, 0);
  const reverted = await environment(t, { receiptStatus: '0x0' });
  const success = await reverted.post({ ...request(), requestId: 'reverted' });
  assert.equal(success.body.result.transactions[0].status, 'reverted');
  assert.equal(success.body.result.execute.status, '0x0', 'legacy fields remain available');
  const text = json(success.body);
  assert(!text.includes(signature));
  assert(!text.includes(sponsorKey));
  assert(!text.includes('serialized'));
});

test('wallet recovers a lost HTTP response via status, never posting the signed request twice', async t => {
  const env = await environment(t);
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push(String(url));
    const response = await original(url, { ...options, headers: { ...options.headers, origin: env.server.url } });
    if (String(url).endsWith('/sponsor')) { await response.text(); throw Error('HTTP response lost'); }
    return response;
  };
  const result = await wallet.sponsorSubmit(env.server.url + '/sponsor', request(), boundedJSON);
  assert.equal(result.submitted, true);
  assert.equal(result.transactions.length, 1);
  assert.deepEqual(requests, [env.server.url + '/sponsor', env.server.url + '/sponsor/status']);
  assert.equal(env.sends.length, 1);
});

test('admission send loss preserves all chunk costs and strips RPC debug secrets from error and status', async t => {
  const env = await environment(t, { failSendAt: 3, echoSecrets: true });
  const body = { ...request(true), requestId: 'admission-loss' };
  const failed = await env.post(body);
  assert.equal(failed.body.transactions.length, 3);
  assert.deepEqual(failed.body.transactions.map(attempt => attempt.phase), ['chunk', 'chunk', 'execute']);
  assert.equal(failed.body.chunks.length, 2);
  assert.equal(failed.body.transactions[0].receipt.gasUsed, '0x5208');
  assert.equal(failed.body.transactions[1].receipt.gasUsed, '0x5208');
  const recovered = await env.post(wallet.sponsorRequestIdentity(body), '/sponsor/status');
  assert.equal(recovered.body.result.execute.hash, env.sends[2].hash);
  assert.equal(recovered.body.result.transactions[2].receipt.effectiveGasPrice, '0x77359400');
  for (const value of [failed.body, recovered.body]) {
    assert(!json(value).includes(signature));
    assert(!json(value).includes(sponsorKey));
    assert(!json(value).includes('raw\":'));
  }
  assert.equal(env.sends.length, 3);
});

test('completed duplicate requests return the same receipt without spending again', async t => {
  const env = await environment(t);
  const body = request(); // legacy caller: server derives a stable ID itself
  const first = await env.post(body);
  const second = await env.post(body);
  assert.deepEqual(second.body.result, first.body.result);
  assert.equal(env.sends.length, 1);
});

test('wallet response loss with unavailable recovery remains UNKNOWN with stable identity', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); throw Error('offline'); };
  const body = request();
  const identity = wallet.sponsorRequestIdentity(body);
  await assert.rejects(wallet.sponsorSubmit('/sponsor', body, boundedJSON), error => {
    assert.equal(error.submitted, null);
    assert.equal(error.requestId, identity.requestId);
    assert.equal(error.requestCommitment, identity.requestCommitment);
    return true;
  });
  assert.deepEqual(calls.map(call => call.url), ['/sponsor', '/sponsor/status']);
  assert.deepEqual(calls[1].body, identity, 'status transmits public identity only');
});

test('malformed typed payload errors never echo supplied content into public recovery metadata', async t => {
  const env = await environment(t);
  const body = { ...request(true), requestId: 'malformed-content' };
  body.chunks[0].chunkData = 'private-file-content';
  const failed = await env.post(body);
  assert.equal(failed.body.submitted, false);
  assert(!json(failed.body).includes('private-file-content'));
  const recovered = await env.post(wallet.sponsorRequestIdentity(body), '/sponsor/status');
  assert(!json(recovered.body).includes('private-file-content'));
  assert.equal(env.sends.length, 0);
});
