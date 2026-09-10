// Local files-browser relay. Guest reads stay pinned and wallet-free; the
// OPTIONAL write support relays raw transactions to the local disposable chain
// after strict validation (router/carrier targets only) and answers a small
// latest-state allowlist that planning needs. It holds no keys and signs
// nothing: all signing happens in the page with clearly labeled disposable
// local test keys. Correctness never depends on this relay — it is a dumb,
// validated pipe to the local anvil node.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Transaction } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const json = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v);
// URL path -> module-relative source. Exported so the static export ships the
// EXACT same page the relay serves (no second copy of the module graph).
export const BROWSER_FILES = new Map([
  ['/', '../web/index.html'],
  ['/screen/app.mjs', '../web/app.mjs'],
  ['/screen/files.css', '../web/files.css'],
  ['/screen/rpc-source.mjs', '../web/rpc-source.mjs'],
  ['/screen/listing-presentation.mjs', '../../2026-09-09-files-screen/web/listing-presentation.mjs'],
  ['/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs', '../sdk/files-actions.mjs'],
  ...['index.mjs', 'reader-scope.mjs', 'files-reader.mjs', 'files-profile.mjs'].map(p => ['/Reviews/2026-09-09-files-reader/' + p, '../../2026-09-09-files-reader/' + p]),
  ['/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js', '../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'],
]);
const quantity = x => typeof x === 'string' && /^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(x);
const hex = (x, n) => typeof x === 'string' && new RegExp('^0x[0-9a-fA-F]{' + n + '}$').test(x);
const block = x => x && Object.keys(x).length === 2 && hex(x.blockHash, 64) && x.requireCanonical === true;

export async function startBrowserServer({ config, rpc, addresses, selectors, write = null }) {
  const targets = new Set(addresses.map(a => a.toLowerCase()));
  const methods = new Set(selectors);
  // write: {router, carrier, core, latestSelectors:[...]} enables the labeled write path.
  const writeTargets = write ? new Set([write.router.toLowerCase(), write.carrier.toLowerCase()]) : new Set();
  const latestCallTargets = write ? new Set([write.core.toLowerCase(), write.router.toLowerCase(), write.carrier.toLowerCase()]) : new Set();
  const latestSelectors = new Set(write?.latestSelectors ?? []);
  const trace = [];
  let url, delayMs = 0, closed = false;

  function valid({ method, params: p }) {
    if (!Array.isArray(p)) return false;
    if (method === 'eth_chainId') return p.length === 0;
    if (method === 'eth_getBlockByNumber') return p.length === 2 && (p[0] === 'latest' || quantity(p[0])) && p[1] === false;
    if (method === 'eth_getCode') return p.length === 2 && targets.has(p[0]?.toLowerCase?.()) && block(p[1]);
    if (method === 'eth_getStorageAt') return p.length === 3 && targets.has(p[0]?.toLowerCase?.()) && hex(p[1], 64) && block(p[2]);
    if (method === 'eth_call') {
      if (p.length !== 2 || !p[0] || typeof p[0].data !== 'string' || !/^0x(?:[0-9a-fA-F]{2}){4,16384}$/.test(p[0].data)) return false;
      const to = p[0].to?.toLowerCase?.(), selector = p[0].data.slice(0, 10);
      if (Object.keys(p[0]).length === 2 && targets.has(to) && methods.has(selector) && block(p[1])) return true;
      // write-support: latest-state planning reads and router preflights
      if (write && p[1] === 'latest' && latestCallTargets.has(to) && latestSelectors.has(selector) && Object.keys(p[0]).every(k => ['to', 'data', 'gas'].includes(k))) return true;
      return false;
    }
    if (!write) return false;
    if (method === 'eth_getTransactionReceipt') return p.length === 1 && hex(p[0], 64);
    if (method === 'eth_getTransactionCount') return p.length === 2 && hex(p[0], 40) && (p[1] === 'latest' || p[1] === 'pending');
    return false;
  }

  const server = http.createServer(async (req, res) => {
    const send = (status, body, type = 'application/json') => {
      if (res.destroyed) return;
      const raw = Buffer.isBuffer(body) ? body : Buffer.from(body);
      res.writeHead(status, {
        'content-type': type, 'cache-control': 'no-store', 'content-length': raw.length,
        'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      });
      res.end(raw);
    };
    try {
      if (closed || req.headers.host !== new URL(url).host) return send(403, json({ error: 'host refused' }));
      const path = new URL(req.url, url).pathname;
      if (req.method === 'GET' && path === '/config') return send(200, json({ ...config, injectedDelayMs: delayMs, write: write ? config.writeConfig : null }));
      if (req.method === 'GET' && BROWSER_FILES.has(path)) {
        const body = await readFile(new URL(BROWSER_FILES.get(path), import.meta.url));
        return send(200, body, path === '/' ? 'text/html; charset=utf-8' : path.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8');
      }
      if (req.method !== 'POST' || !['/rpc', '/rpc-batch', '/publish'].includes(path)) return send(404, json({ error: 'not found' }));
      if (req.headers.origin !== url || req.headers['content-type'] !== 'application/json') return send(403, json({ error: 'same-origin JSON required' }));
      let size = 0; const chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > 262144) { send(413, json({ error: 'request too large' })); req.resume(); return; } chunks.push(chunk); }
      let body; try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); } catch { return send(400, json({ error: 'malformed JSON' })); }

      if (path === '/publish') {
        if (!write) return send(403, json({ error: 'write path disabled' }));
        if (!body || Object.keys(body).join(',') !== 'raw' || typeof body.raw !== 'string' || !/^0x(?:[0-9a-fA-F]{2}){1,131072}$/.test(body.raw)) return send(400, json({ error: 'raw transaction required' }));
        let parsed;
        try { parsed = Transaction.from(body.raw); } catch { return send(400, json({ error: 'unparseable transaction' })); }
        if (!parsed.to || !writeTargets.has(parsed.to.toLowerCase()) || parsed.chainId !== 31337n) {
          return send(403, json({ error: 'transaction target refused' }));
        }
        try {
          const hash = await rpc('eth_sendRawTransaction', [body.raw]);
          trace.push({ method: 'eth_sendRawTransaction', to: parsed.to.toLowerCase(), bytes: (body.raw.length - 2) / 2 });
          return send(200, json({ result: hash }));
        } catch (e) { return send(502, json({ error: e.message, data: e.data ?? null })); }
      }

      if (path === '/rpc-batch') {
        if (!body || !Array.isArray(body.batch) || body.batch.length === 0 || body.batch.length > 64) return send(400, json({ error: 'batch shape refused' }));
        for (const entry of body.batch) {
          if (!entry || !Number.isSafeInteger(entry.id) || !valid(entry)) return send(400, json({ error: 'batch entry refused' }));
        }
        if (trace.length >= 16384) return send(429, json({ error: 'session request limit' }));
        if (delayMs) await new Promise(r => setTimeout(r, delayMs)); // one delay per ROUND TRIP, matching real transport
        const results = await Promise.all(body.batch.map(async entry => {
          const attempt = { method: entry.method, params: entry.params, bytes: 0, batched: true };
          trace.push(attempt);
          try {
            const result = await rpc(entry.method, entry.params);
            attempt.bytes = Buffer.byteLength(json(result));
            if (attempt.bytes > 262144) throw Error('response limit');
            return { id: entry.id, result };
          } catch (e) { attempt.error = e.message; return { id: entry.id, error: e.message, data: e.data ?? null }; }
        }));
        return send(200, json({ result: results }));
      }
      if (!body || Object.keys(body).sort().join(',') !== 'method,params' || !valid(body)) return send(400, json({ error: 'request refused' }));
      if (trace.length >= 16384) return send(429, json({ error: 'session request limit' }));
      const attempt = { method: body.method, params: body.params, bytes: 0 };
      trace.push(attempt);
      try {
        if (delayMs) await new Promise(r => setTimeout(r, delayMs));
        const result = await rpc(body.method, body.params);
        attempt.bytes = Buffer.byteLength(json(result));
        if (attempt.bytes > 262144) throw Error('response limit');
        return send(200, json({ result }));
      } catch (e) { attempt.error = e.message; return send(502, json({ error: e.message, data: e.data ?? null })); }
    } catch { send(500, json({ error: 'fixture unavailable' })); }
  });
  server.requestTimeout = 15000; server.headersTimeout = 15000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  url = 'http://127.0.0.1:' + server.address().port;
  return {
    url, trace,
    setDelay(ms) { if (ms !== 0 && ms !== 50) throw Error('fixture delay'); delayMs = ms; },
    async close() { closed = true; server.closeAllConnections(); await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve())); },
  };
}
