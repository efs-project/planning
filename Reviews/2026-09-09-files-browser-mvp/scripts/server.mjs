// Local files-browser relay. Guest reads stay pinned and wallet-free; the
// OPTIONAL write support relays raw transactions to the local disposable chain
// after strict validation (router/carrier targets only) and answers a small
// latest-state allowlist that planning needs. The raw-transaction relay signs
// nothing; an explicitly configured sponsor holds its disposable payer key
// only server-side and accepts author-signed operations, never identity claims.
// Correctness still requires independent canonical read-back, not this relay.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Transaction, Wallet, keccak256, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { router2Interface, carrier3Interface, core3Interface } from '../sdk/files-actions.mjs';
import { ordinaryRecord } from '../../2026-09-09-files-reader/files-profile.mjs';

const json = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v);
// URL path -> module-relative source. Exported so the static export ships the
// EXACT same page the relay serves (no second copy of the module graph).
export const BROWSER_FILES = new Map([
  ['/', '../web/index.html'],
  ['/screen/app.mjs', '../web/app.mjs'],
  ['/screen/files.css', '../web/files.css'],
  ['/screen/rpc-source.mjs', '../web/rpc-source.mjs'],
  ['/screen/wallet.mjs', '../web/wallet.mjs'],
  ['/screen/cost-ledger.mjs', '../web/cost-ledger.mjs'],
  ['/screen/action-journal.mjs', '../web/action-journal.mjs'],
  ['/screen/economics-panel.mjs', '../web/economics-panel.mjs'],
  ['/screen/listing-presentation.mjs', '../../2026-09-09-files-screen/web/listing-presentation.mjs'],
  ['/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs', '../sdk/files-actions.mjs'],
  ['/Reviews/2026-09-09-files-browser-mvp/sdk/export-bundle.mjs', '../sdk/export-bundle.mjs'],
  ...['index.mjs', 'reader-scope.mjs', 'files-reader.mjs', 'files-profile.mjs'].map(p => ['/Reviews/2026-09-09-files-reader/' + p, '../../2026-09-09-files-reader/' + p]),
  ['/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js', '../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'],
]);
const quantity = x => typeof x === 'string' && /^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(x);
const hex = (x, n) => typeof x === 'string' && new RegExp('^0x[0-9a-fA-F]{' + n + '}$').test(x);
const block = x => x && Object.keys(x).length === 2 && hex(x.blockHash, 64) && x.requireCanonical === true;
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const validRequestId = id => typeof id === 'string' && /^[a-zA-Z0-9:_-]{1,128}$/.test(id);
// Provider errors may contain decoded plaintext, short hex, or signed calldata.
// Never copy their prose. Only this private class marks messages constructed
// by our own validation branches; matching an error's text/name is not trust.
class SponsorRefusal extends Error {}
const sponsorMessage = error => error instanceof SponsorRefusal ? error.message
  : 'sponsor request failed; check the transaction journal before retrying';
const sponsorErrorSelectors = new Set([router2Interface, carrier3Interface, core3Interface]
  .flatMap(iface => iface.fragments.filter(fragment => fragment.type === 'error')
    .map(fragment => iface.getError(fragment.format()).selector)));
const sponsorData = data => typeof data === 'string' && sponsorErrorSelectors.has(data.toLowerCase()) ? data.toLowerCase() : null;
const sponsorEncode = encode => {
  try { return encode(); }
  catch { throw new SponsorRefusal('sponsor refused: malformed typed request'); } // ABI errors can echo file contents/signatures
};
const publicReceipt = receipt => Object.fromEntries([
  'transactionHash', 'transactionIndex', 'blockHash', 'blockNumber', 'from', 'to', 'status',
  'gasUsed', 'effectiveGasPrice', 'cumulativeGasUsed', 'type',
].filter(key => typeof receipt[key] === 'string').map(key => [key, receipt[key]]));

export async function startBrowserServer({ config, rpc, addresses, selectors, write = null }) {
  const sponsorWallet = write?.sponsorKey ? new Wallet(write.sponsorKey) : null;
  // Trees the sponsor will pay to stage: ONLY those named as leaves of an
  // author intent it has verified this session. Permissionless staging stays
  // permissionless on-chain; the sponsor's GAS is not permissionless.
  const sponsorApprovedTrees = new Set();
  // Process-local and deliberately public-only. Losing this map means UNKNOWN
  // to status readers; neither status nor duplicate submit resumes execution.
  const sponsorJournal = new Map();
  // Sponsor submissions are serialized: two overlapping requests would read
  // the same `pending` transaction count and sign colliding nonces.
  let sponsorQueue = Promise.resolve();
  const serialize = work => { const run = sponsorQueue.then(work, work); sponsorQueue = run.then(() => {}, () => {}); return run; };
  function recordReceipt(entry, attempt, receipt) {
    if (receipt?.transactionHash?.toLowerCase() !== attempt.hash || !['0x0', '0x1'].includes(receipt.status)) return false;
    attempt.receipt = publicReceipt(receipt);
    attempt.status = receipt.status === '0x1' ? 'confirmed' : 'reverted';
    entry.submitted = true;
    const summary = { hash: attempt.hash, status: receipt.status, gasUsed: receipt.gasUsed === undefined ? null : String(BigInt(receipt.gasUsed)) };
    if (attempt.phase === 'execute') entry.execute = summary;
    else entry.chunks[attempt.position] = { index: attempt.index, ...summary, status: receipt.status === '0x1' ? 'staged' : 'rejected' };
    return true;
  }
  async function refreshJournal(entry) {
    // Outside the submission queue: status remains usable during a held send.
    for (const attempt of entry.transactions) {
      if (!attempt.hash || attempt.receipt) continue;
      try { recordReceipt(entry, attempt, await rpc('eth_getTransactionReceipt', [attempt.hash])); }
      catch { /* unavailable is still unknown/pending, never a refusal */ }
    }
    return entry;
  }
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
      if (req.method !== 'POST' || !['/rpc', '/rpc-batch', '/publish', '/sponsor', '/sponsor/status'].includes(path)) return send(404, json({ error: 'not found' }));
      if (req.headers.origin !== url || req.headers['content-type'] !== 'application/json') return send(403, json({ error: 'same-origin JSON required' }));
      const bodyLimit = path === '/sponsor' ? 4194304 : 262144; // sponsored content writes carry up to 1 MiB of chunk bytes
      let size = 0; const chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > bodyLimit) { send(413, json({ error: 'request too large' })); req.resume(); return; } chunks.push(chunk); }
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

      if (path === '/sponsor/status') {
        if (!body || Object.keys(body).sort().join(',') !== 'requestCommitment,requestId' || !validRequestId(body.requestId) || !hex(body.requestCommitment, 64)) {
          return send(400, json({ error: 'request identity required', submitted: null, transactions: [] }));
        }
        const entry = sponsorJournal.get(body.requestId);
        if (!entry) return send(200, json({ result: { ...body, status: 'unknown', submitted: null, transactions: [], execute: null, chunks: [] } }));
        if (entry.requestCommitment !== body.requestCommitment) return send(409, json({ error: 'request ID is bound to a different commitment', submitted: null, transactions: [] }));
        return send(200, json({ result: await refreshJournal(entry) }));
      }

      if (path === '/sponsor') {
        // EXPLICIT sponsor: submits and PAYS for a wallet-author-signed
        // operation. It cannot alter what was signed (the Core verifies the
        // author intent); it can only decline to submit. The sponsor key
        // lives here, server-side, and is never served to the page.
        if (!write?.sponsorKey) return send(403, json({ error: 'no sponsor configured', submitted: false, transactions: [] }));
        if (!body || typeof body !== 'object' || Array.isArray(body)) return send(400, json({ error: 'sponsor request refused', submitted: false, transactions: [] }));
        const { requestId: suppliedId, requestCommitment: suppliedCommitment, ...request } = body;
        const requestCommitment = keccak256(toUtf8Bytes(json(canonical(request))));
        const requestId = suppliedId ?? requestCommitment;
        if (!validRequestId(requestId)) return send(400, json({ error: 'request ID refused', submitted: false, transactions: [] }));
        const previous = sponsorJournal.get(requestId);
        if ((previous && previous.requestCommitment !== requestCommitment) || (suppliedCommitment !== undefined && suppliedCommitment !== requestCommitment)) {
          return send(409, json({ ...(previous ?? { requestId, requestCommitment, submitted: false, transactions: [] }), error: 'request ID is bound to a different commitment' }));
        }
        if (previous) {
          await refreshJournal(previous);
          return previous.error ? send(502, json(previous)) : send(200, json({ result: previous }));
        }
        // Bound retained state without evicting unresolved identities. A full
        // process journal refuses new work, rather than forgetting old sends.
        if (sponsorJournal.size >= 4096) return send(429, json({ requestId, requestCommitment, error: 'sponsor journal full', submitted: false, transactions: [] }));
        const entry = { requestId, requestCommitment, payer: sponsorWallet.address,
          status: 'processing', submitted: null, transactions: [], execute: null, chunks: [] };
        sponsorJournal.set(requestId, entry); // register BEFORE any asynchronous work
        const { op, publication, expectedRevision, intent, signature, content: tree, chunks: chunkStages } = body;
        return await serialize(async () => { try {
          // Rebuild ALL calldata server-side from the typed pieces (named
          // tuples encode from plain objects): the client cannot smuggle
          // arbitrary targets or calldata through the sponsor, and the
          // sponsor NEVER builds a claimPrincipal — identity claims must come
          // from the wallet account itself.
          const executeData = !publication ? null : sponsorEncode(() => router2Interface.encodeFunctionData('execute', [op, publication, Number(expectedRevision), intent, signature]));
          // The tree (body + leaves) arrives ONCE for the whole request; a
          // per-chunk copy made a large upload O(N^2) and exceeded the body
          // limit before it could ever be sponsored.
          const list = Array.isArray(chunkStages) ? chunkStages.slice(0, 256) : [];
          if (list.length && (!tree || typeof tree.treeId !== 'string')) throw new SponsorRefusal('sponsor refused: chunk request is missing its content tree');
          const stages = sponsorEncode(() => list.map(c => ({ index: Number(c.index),
            data: carrier3Interface.encodeFunctionData('stageChunk', [tree.treeId, tree.body, Number(c.index), c.chunkData, tree.leaves]) })));
          const leafIds = publication ? publication.leaves.map(l => ordinaryRecord(l.typeId, l.body)) : null;
          if (executeData) {
            // Author authenticity preflight: the principal must be a claimed
            // account BEFORE the sponsor spends anything, and the free
            // simulation catches bad signatures, stale nonces and every
            // router precondition.
            const account = await rpc('eth_call', [{ to: write.core, data: core3Interface.encodeFunctionData('principalAccount', [publication.header.principalId]), gas: '0x100000' }, 'latest']);
            if (BigInt('0x' + account.slice(26)) === 0n) throw new SponsorRefusal('sponsor refused: unclaimed principal');
            await rpc('eth_call', [{ to: write.router, data: executeData, from: sponsorWallet.address, gas: '0x1000000' }, 'latest']);
            for (const id of leafIds) sponsorApprovedTrees.add(id);
          } else if (!stages.length) throw new SponsorRefusal('sponsor refused: nothing to submit');
          // The sponsor pays only for staging bound to a verified intent —
          // either a leaf of THIS publication or one approved earlier.
          if (list.length) {
            const treeId = String(tree.treeId).toLowerCase();
            const covered = (leafIds && leafIds.includes(treeId)) || sponsorApprovedTrees.has(treeId);
            if (!covered) throw new SponsorRefusal('sponsor refused: chunk tree is not covered by a verified author intent this session');
          }
          const submit = async (to, data, gasLimit, attempt) => {
            const nonce = Number(BigInt(await rpc('eth_getTransactionCount', [sponsorWallet.address, 'pending'])));
            const raw = await sponsorWallet.signTransaction({ chainId: 31337, nonce, gasLimit, gasPrice: 2000000000n, to, data });
            attempt.hash = keccak256(raw); // available even if RPC accepts then loses its response
            attempt.status = 'broadcasting';
            if (entry.submitted === false) entry.submitted = null;
            const hash = await rpc('eth_sendRawTransaction', [raw]);
            if (hash?.toLowerCase() !== attempt.hash) throw new SponsorRefusal('sponsor RPC returned a different transaction hash');
            entry.submitted = true;
            if (!attempt.receipt) attempt.status = 'pending';
            for (let i = 0; i < 400; i++) {
              const r = await rpc('eth_getTransactionReceipt', [attempt.hash]);
              if (r && recordReceipt(entry, attempt, r)) return r;
              await new Promise(ok => setTimeout(ok, 25));
            }
            throw new SponsorRefusal('sponsor transaction not confirmed in time');
          };
          // STAGE FIRST, admit second: if the sponsor dies mid-staging the
          // author has lost nothing — no admission exists yet and staged
          // bytes are inert. Admitting before staging risks a confirmed
          // record whose bytes cannot be read.
          const staged = entry.chunks;
          let stagedOk = 0;
          for (const { index, data } of stages) {
            const attempt = { phase: 'chunk', index, position: staged.length, hash: null, status: 'preparing', receipt: null };
            entry.transactions.push(attempt);
            staged.push({ index, status: 'pending' });
            // Already-present chunks are free: write-once staging makes a
            // repeat a no-op, so paying for it again is pure waste (and this
            // is exactly what resume needs).
            try {
              const present = await rpc('eth_call', [{ to: write.carrier, data: carrier3Interface.encodeFunctionData('hasChunk', [tree.treeId, index]), gas: '0x100000' }, 'latest']);
              if (BigInt(present) === 1n) {
                attempt.status = 'already-present';
                staged[attempt.position] = { index, status: 'staged', alreadyPresent: true }; stagedOk++; continue;
              }
            } catch { /* fall through and let the normal path decide */ }
            try { await rpc('eth_call', [{ to: write.carrier, data, from: sponsorWallet.address, gas: '0x400000' }, 'latest']); }
            catch (e) {
              attempt.status = 'refused'; attempt.error = sponsorMessage(e);
              staged[attempt.position] = { index, status: 'refused', error: attempt.error, data: sponsorData(e.data) }; continue;
            }
            const r = await submit(write.carrier, data, 4000000n, attempt);
            if (r.status === '0x1') stagedOk++;
          }
          if (executeData && stagedOk < stages.length) throw new SponsorRefusal('sponsor refused: staging incomplete (' + stagedOk + '/' + stages.length + ' chunks); the admission was NOT submitted, nothing is half-published');
          // (staging and admission run inside the serialized section above)
          if (executeData) {
            const attempt = { phase: 'execute', index: null, hash: null, status: 'preparing', receipt: null };
            entry.transactions.push(attempt);
            await submit(write.router, executeData, 16777216n, attempt);
          }
          trace.push({ method: 'sponsor', to: write.router.toLowerCase(), bytes: size });
          entry.status = 'completed';
          if (!entry.transactions.some(attempt => attempt.hash)) entry.submitted = false;
          return send(200, json({ result: entry }));
        } catch (e) {
          // Only false proves no send was attempted. null is an unacknowledged
          // send; true retains ANY previous acknowledged send, including a
          // reverted chunk. The whole partial journal survives either case.
          entry.status = 'failed'; entry.error = sponsorMessage(e); entry.data = sponsorData(e.data);
          if (!entry.transactions.some(attempt => attempt.hash)) entry.submitted = false;
          for (const attempt of entry.transactions) if (attempt.status === 'preparing') attempt.status = 'refused';
          return send(502, json(entry));
        } });
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
