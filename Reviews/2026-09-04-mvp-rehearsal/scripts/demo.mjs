import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Interface } from 'ethers';
import { compile, startLabChain, TX_GAS } from './local-chain.mjs';
import { seedLab } from './bootstrap.mjs';

const serialize = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
const readMethods = new Set(['eth_chainId', 'eth_blockNumber', 'eth_call', 'eth_getCode', 'eth_getBlockByNumber',
  'eth_getBlockByHash', 'eth_getTransactionReceipt', 'eth_getTransactionByHash']);
const staticFiles = new Map([
  ['/', ['web/index.html', 'text/html']], ['/index.html', ['web/index.html', 'text/html']],
  ['/styles.css', ['web/styles.css', 'text/css']], ['/app.mjs', ['web/app.mjs', 'text/javascript']],
  ['/model.mjs', ['web/model.mjs', 'text/javascript']], ['/bootstrap.mjs', ['web/bootstrap.mjs', 'text/javascript']],
  ['/files-view.mjs', ['web/files-view.mjs', 'text/javascript']],
  ['/workflow-app.mjs', ['web/workflow-app.mjs', 'text/javascript']],
  ['/workflow.css', ['web/workflow.css', 'text/css']],
  ['/data-view.mjs', ['web/data-view.mjs', 'text/javascript']],
  ['/arcade-view.mjs', ['web/arcade-view.mjs', 'text/javascript']],
  ['/game-source.mjs', ['web/game-source.mjs', 'text/javascript']],
  ['/sdk/index.js', ['sdk/index.js', 'text/javascript']], ['/sdk/index.mjs', ['sdk/index.js', 'text/javascript']],
  ['/vendor/ethers.js', ['node_modules/ethers/dist/ethers.min.js', 'text/javascript']],
]);

async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 262144) throw new Error('BODY_LIMIT'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function reply(res, code, value) {
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(serialize(value));
}
function rpcError(error) {
  const nested = error?.info?.error ?? error;
  return { code: typeof nested.code === 'number' ? nested.code : -32000,
    message: nested.message ?? 'Local test RPC failed', data: nested.data ?? error.data };
}

export async function startDemo({ port = 0, compileFirst = true, lifetimeMs = 3_600_000 } = {}) {
  if (compileFirst) compile();
  const lab = await startLabChain({ lifetimeMs });
  let server;
  try {
    const config = await seedLab(lab);
    const iface = new Interface(config.deployment.coreAbi);
    const trace = [], counts = {};
    let origin;
    const traceCall = (channel, method) => {
      const key = `${channel}:${method}`; counts[key] = (counts[key] ?? 0) + 1;
      if (trace.length < 2000) trace.push({ channel, method, sequence: Object.values(counts).reduce((a, b) => a + b, 0) });
    };
    server = createServer(async (req, res) => {
      try {
        if (req.headers.host !== new URL(origin).host) return reply(res, 403, { error: 'HOST_NOT_ALLOWED' });
        const path = new URL(req.url, origin).pathname;
        if (req.method === 'GET' && path === '/config') return reply(res, 200, config);
        if (req.method === 'GET' && path === '/trace') return reply(res, 200, { counts, trace, truncated: trace.length >= 2000 });
        if (req.method === 'GET' && path === '/favicon.ico') { res.writeHead(204); return res.end(); }
        if (req.method === 'GET' && staticFiles.has(path)) {
          const [file, mime] = staticFiles.get(path);
          const bytes = await readFile(new URL(`../${file}`, import.meta.url));
          res.writeHead(200, { 'content-type': mime, 'cache-control': 'no-store',
            'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
            'x-frame-options': 'DENY',
            // The verified Blob game has its own deny-by-default CSP. Do not
            // grant inline script execution to the parent to accommodate it.
            'content-security-policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'none'; connect-src 'self'; form-action 'none'",
            'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' });
          return res.end(bytes);
        }
        const channel = path.slice(1);
        if (req.method !== 'POST' || !['rpc', 'wallet', 'relay', 'session'].includes(channel)) return reply(res, 404, { error: 'NOT_FOUND' });
        if (req.headers.origin !== origin || !req.headers['content-type']?.startsWith('application/json')) return reply(res, 403, { error: 'SAME_ORIGIN_JSON_REQUIRED' });
        const request = await body(req);
        const { method, params = [] } = request;
        assert(typeof method === 'string' && Array.isArray(params), 'INVALID_RPC');
        if (channel === 'rpc') {
          assert(readMethods.has(method), 'READ_METHOD_REQUIRED');
          if (method === 'eth_call' || method === 'eth_getCode') {
            const target = method === 'eth_call' ? params[0]?.to : params[0];
            assert([config.deployment.core, config.deployment.byteStore].some(a => a.toLowerCase() === String(target).toLowerCase()), 'UNKNOWN_READ_TARGET');
          }
        } else if (method === 'eth_signTypedData_v4') {
          assert(channel === 'wallet' || channel === 'session', 'SIGNING_CHANNEL');
          const account = channel === 'wallet' ? config.accounts.owner : config.accounts.session;
          assert(String(params[0]).toLowerCase() === account.toLowerCase(), 'SIGNER_MISMATCH');
          const typed = typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1];
          assert(typed.domain.name === 'efs-lab' && typed.domain.version === '1' && BigInt(typed.domain.chainId) === 31337n
            && typed.domain.verifyingContract.toLowerCase() === config.deployment.core.toLowerCase(), 'LAB_DOMAIN_REQUIRED');
          assert(typed.primaryType === 'Operation' || (channel === 'wallet' && typed.primaryType === 'Grant'), 'LAB_MESSAGE_REQUIRED');
        } else if (method === 'eth_sendTransaction') {
          assert(channel === 'wallet' || channel === 'relay', 'TRANSACTION_CHANNEL');
          const tx = { ...params[0] }, account = channel === 'wallet' ? config.accounts.owner : config.accounts.relayer;
          assert(String(tx.from).toLowerCase() === account.toLowerCase() && String(tx.to).toLowerCase() === config.deployment.core.toLowerCase(), 'TRANSACTION_SCOPE');
          assert(tx.value == null || BigInt(tx.value) === 0n, 'NO_VALUE');
          const decoded = iface.parseTransaction({ data: tx.data });
          assert((channel === 'wallet' ? ['executeDirect', 'revokeGrant', 'registerSchema'] : ['execute', 'registerGrant']).includes(decoded?.name), 'FUNCTION_SCOPE');
          params[0] = { from: account, to: config.deployment.core, data: tx.data, gas: `0x${TX_GAS.toString(16)}` };
        } else throw new Error('CHANNEL_METHOD_NOT_ALLOWED');
        traceCall(channel, method);
        try { return reply(res, 200, { result: await lab.provider.send(method, params) }); }
        catch (error) { return reply(res, 200, { error: rpcError(error) }); }
      } catch (error) { reply(res, 400, { error: rpcError(error) }); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    origin = `http://127.0.0.1:${server.address().port}`;
    let closed = false;
    const close = async () => { if (closed) return; closed = true; clearTimeout(timer); server.closeAllConnections();
      await new Promise(resolve => server.close(resolve)); await lab.close(); };
    const timer = setTimeout(() => { void close(); }, lifetimeMs);
    return { origin, config, lab, counts, trace, close };
  } catch (error) { server?.closeAllConnections(); server?.close(); await lab.close(); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const value = process.env.EFS_LAB_PORT ?? '0';
  const port = Number(value);
  assert(Number.isSafeInteger(port) && port >= 0 && port <= 65535, 'EFS_LAB_PORT must be 0..65535');
  const demo = await startDemo({ port });
  console.log(`EFS local workflow lab: ${demo.origin}`);
  console.log('Synthetic local chain and wallet simulation. This run expires after one hour. Ctrl-C stops it.');
  const stop = async () => { await demo.close(); process.exitCode = 0; };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
