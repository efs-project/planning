// Browser-only bounded JSON transport: same-origin read relay plus the
// labeled local write path (raw-transaction publish + latest planning reads).
export async function boundedJSON(response, maxBytes, signal) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1048576) throw Error('response bound');
  signal?.throwIfAborted(); const reader = response.body?.getReader(); if (!reader) throw Error('response body missing');
  const chunks = []; let size = 0;
  const abort = () => { reader.cancel(signal.reason).catch(() => {}); }; signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) { signal?.throwIfAborted(); const { done, value } = await reader.read(); signal?.throwIfAborted(); if (done) break; size += value.byteLength; if (size > maxBytes) throw Error('response limit'); chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { signal?.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
async function post(path, payload, maxBytes = 262144, signal) {
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal, credentials: 'omit', cache: 'no-store' });
  const body = await boundedJSON(response, maxBytes + 128, signal);
  if (!response.ok || !body || body.error !== undefined) { const e = Error(body?.error ?? 'relay refused'); e.data = body?.data ?? null; throw e; }
  return body.result;
}
export function createRPCSource({ identity }) {
  return Object.freeze({
    identity, epoch: 1,
    async request(method, params, { signal, maxBytes = 262144 } = {}) {
      if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 262144) throw Error('result bound');
      const result = await post('/rpc', { method, params }, maxBytes, signal);
      if (new TextEncoder().encode(JSON.stringify(result)).byteLength > maxBytes) throw Error('result limit');
      return result;
    },
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
