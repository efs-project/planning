// Browser-only bounded JSON transport: same-origin read relay plus the
// labeled local write path (raw-transaction publish + latest planning reads).
export async function boundedJSON(response, maxBytes, signal, measured) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1048576) throw Error('response bound');
  signal?.throwIfAborted(); const reader = response.body?.getReader(); if (!reader) throw Error('response body missing');
  const chunks = []; let size = 0;
  const abort = () => { reader.cancel(signal.reason).catch(() => {}); }; signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) { signal?.throwIfAborted(); const { done, value } = await reader.read(); signal?.throwIfAborted(); if (done) break; size += value.byteLength; measured?.(value.byteLength); if (size > maxBytes) throw Error('response limit'); chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { signal?.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
async function post(path, payload, maxBytes = 262144, signal, metrics) {
  if (metrics) { metrics.httpBatches++; metrics.requestBytes += new TextEncoder().encode(JSON.stringify(payload)).byteLength; }
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal, credentials: 'omit', cache: 'no-store' });
  const body = await boundedJSON(response, maxBytes + 128, signal, n => { if (metrics) metrics.responseBytes += n; });
  if (!response.ok || !body || body.error !== undefined) { const e = Error(body?.error ?? 'relay refused'); e.data = body?.data ?? null; throw e; }
  return body.result;
}
// Microtask-window transport batching: logical requests (and their budgets)
// are unchanged; concurrent calls coalesce into one HTTP round trip.
function batching(flush) {
  let queue = [];
  return entry => new Promise((resolve, reject) => {
    queue.push({ entry, resolve, reject });
    if (queue.length === 1) queueMicrotask(async () => {
      const batch = queue; queue = [];
      try { await flush(batch); } catch (e) { for (const item of batch) item.reject(e); }
    });
  });
}
export function createRPCSource({ identity }) {
  const metrics = { logicalCalls: 0, httpBatches: 0, requestBytes: 0, responseBytes: 0 };
  const enqueue = batching(async batch => {
    if (batch.length === 1) {
      const { entry, resolve, reject } = batch[0];
      try { resolve(await post('/rpc', { method: entry.method, params: entry.params }, entry.maxBytes, entry.signal, metrics)); }
      catch (e) { reject(e); }
      return;
    }
    const body = batch.map((item, i) => ({ id: i, method: item.entry.method, params: item.entry.params }));
    const maxBytes = Math.min(1048576 - 128, batch.reduce((n, item) => n + item.entry.maxBytes, 0));
    const results = await post('/rpc-batch', { batch: body }, maxBytes, undefined, metrics);
    for (const [i, item] of batch.entries()) {
      const r = results[i];
      if (r && r.error === undefined) item.resolve(r.result);
      else { const e = Error(r?.error ?? 'batch entry failed'); e.data = r?.data ?? null; item.reject(e); }
    }
  });
  return Object.freeze({
    identity, epoch: 1, metrics: () => ({ ...metrics }),
    async request(method, params, { signal, maxBytes = 262144 } = {}) {
      if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 262144) throw Error('result bound');
      signal?.throwIfAborted(); metrics.logicalCalls++;
      const result = await cancellable(enqueue({ method, params, maxBytes, signal }), signal);
      signal?.throwIfAborted();
      if (new TextEncoder().encode(JSON.stringify(result)).byteLength > maxBytes) throw Error('result limit');
      return result;
    },
  });
}
// Direct JSON-RPC source for STANDALONE STATIC HOSTING: talks straight to an
// explicitly configured chain endpoint; no EFS-specific server involved.
export function createDirectRPCSource({ identity, url }) {
  const metrics = { logicalCalls: 0, httpBatches: 0, requestBytes: 0, responseBytes: 0 };
  const enqueue = batching(async batch => {
    const body = batch.map((item, i) => ({ jsonrpc: '2.0', id: i, method: item.entry.method, params: item.entry.params }));
    const payload = JSON.stringify(batch.length === 1 ? body[0] : body);
    metrics.httpBatches++; metrics.requestBytes += new TextEncoder().encode(payload).byteLength;
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, cache: 'no-store', signal: batch.length === 1 ? batch[0].entry.signal : undefined });
    const parsed = await boundedJSON(response, 1048576, undefined, n => { metrics.responseBytes += n; });
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of batch) {
      const row = rows.find(x => x.id === batch.indexOf(item)) ?? rows[batch.indexOf(item)];
      if (row && row.error === undefined) item.resolve(row.result);
      else { const e = Error(row?.error?.message ?? 'rpc error'); e.data = row?.error?.data ?? null; item.reject(e); }
    }
  });
  return Object.freeze({
    identity, epoch: 1, metrics: () => ({ ...metrics }),
    async request(method, params, { maxBytes = 262144, signal } = {}) {
      if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 262144) throw Error('result bound');
      signal?.throwIfAborted(); metrics.logicalCalls++;
      const result = await cancellable(enqueue({ method, params, maxBytes, signal }), signal);
      signal?.throwIfAborted();
      if (new TextEncoder().encode(JSON.stringify(result)).byteLength > maxBytes) throw Error('result limit');
      return result;
    },
  });
}
function cancellable(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
export function directWritePath(url) {
  const one = async (method, params) => {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), cache: 'no-store' });
    const body = await boundedJSON(response, 1048576);
    if (body.error) { const e = Error(body.error.message ?? 'rpc error'); e.data = body.error.data ?? null; throw e; }
    return body.result;
  };
  return Object.freeze({
    callLatest: (to, data) => one('eth_call', [{ to, data, gas: '0x1000000' }, 'latest']),
    transactionCount: address => one('eth_getTransactionCount', [address, 'pending']),
    receipt: hash => one('eth_getTransactionReceipt', [hash]),
    latestBlock: () => one('eth_getBlockByNumber', ['latest', false]),
    publish: raw => one('eth_sendRawTransaction', [raw]),
  });
}
// Labeled write path: latest planning reads and raw-transaction publication.
export const writePath = Object.freeze({
  callLatest: (to, data) => post('/rpc', { method: 'eth_call', params: [{ to, data, gas: '0x1000000' }, 'latest'] }),
  transactionCount: address => post('/rpc', { method: 'eth_getTransactionCount', params: [address, 'pending'] }),
  receipt: hash => post('/rpc', { method: 'eth_getTransactionReceipt', params: [hash] }),
  latestBlock: () => post('/rpc', { method: 'eth_getBlockByNumber', params: ['latest', false] }),
  publish: raw => post('/publish', { raw }),
});
