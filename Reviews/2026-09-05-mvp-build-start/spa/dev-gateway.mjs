// Optional loopback test transport. Never imported or copied into the SPA.
import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { compile, startLabChain } from '../../2026-09-04-mvp-rehearsal/scripts/local-chain.mjs';
import { seedLab } from '../../2026-09-04-mvp-rehearsal/scripts/bootstrap.mjs';
import { publicManifest, readMethods } from './config.mjs';

export async function startGateway({ allowedOrigin, port = 0, compileFirst = true, lifetimeMs = 3_600_000 }) {
  const allowed = new URL(allowedOrigin);
  if (allowed.origin !== allowedOrigin || allowed.protocol !== 'http:' || allowed.hostname !== '127.0.0.1') throw new Error('Explicit loopback static Origin required');
  if (compileFirst) compile();
  const lab = await startLabChain({ lifetimeMs });
  let server, timer;
  try {
    const manifest = publicManifest(await seedLab(lab));
    let origin;
    server = createServer(async (request, response) => {
      const reply = (code, body) => { response.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); response.end(JSON.stringify(body)); };
      try {
        if (request.headers.host !== new URL(origin).host) return reply(403, { error: 'HOST_NOT_ALLOWED' });
        if (request.url !== '/rpc') return reply(404, { error: 'NOT_FOUND' });
        if (request.headers.origin !== allowedOrigin) return reply(403, { error: 'EXPLICIT_ORIGIN_REQUIRED' });
        response.setHeader('access-control-allow-origin', allowedOrigin); response.setHeader('vary', 'Origin');
        if (request.method === 'OPTIONS') {
          response.setHeader('access-control-allow-methods', 'POST'); response.setHeader('access-control-allow-headers', 'content-type');
          response.writeHead(204); return response.end();
        }
        if (request.method !== 'POST' || !request.headers['content-type']?.startsWith('application/json')) return reply(400, { error: 'JSON_POST_REQUIRED' });
        const chunks = []; let size = 0;
        for await (const chunk of request) { size += chunk.length; if (size > 262144) throw new Error('BODY_LIMIT'); chunks.push(chunk); }
        const input = JSON.parse(Buffer.concat(chunks).toString());
        if (input.jsonrpc !== '2.0' || !Number.isSafeInteger(input.id) || !readMethods.has(input.method) || !Array.isArray(input.params)) throw new Error('READ_METHOD_REQUIRED');
        if (['eth_call', 'eth_getCode'].includes(input.method)) {
          const target = input.method === 'eth_call' ? input.params[0]?.to : input.params[0];
          if (![manifest.deployment.core, manifest.deployment.byteStore].some(address => address.toLowerCase() === String(target).toLowerCase())) throw new Error('UNKNOWN_READ_TARGET');
        }
        try { reply(200, { jsonrpc: '2.0', id: input.id, result: await lab.provider.send(input.method, input.params) }); }
        catch (error) { const nested = error?.info?.error ?? error; reply(200, { jsonrpc: '2.0', id: input.id,
          error: { code: typeof nested.code === 'number' ? nested.code : -32000, message: nested.message ?? 'Provider unavailable', ...(nested.data ? { data: nested.data } : {}) } }); }
      } catch (error) { reply(400, { error: { message: error.message } }); }
    });
    await new Promise((done, reject) => { server.once('error', reject); server.listen(Number(port), '127.0.0.1', done); });
    origin = `http://127.0.0.1:${server.address().port}`;
    let closed = false;
    const close = async () => { if (closed) return; closed = true; clearTimeout(timer); server.closeAllConnections(); await new Promise(done => server.close(done)); await lab.close(); };
    timer = setTimeout(() => void close(), lifetimeMs);
    return { rpcUrl: origin + '/rpc', manifest, close };
  } catch (error) { clearTimeout(timer); server?.closeAllConnections(); server?.close(); await lab.close(); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [allowedOrigin, manifestPath, port] = process.argv.slice(2);
  if (!manifestPath) throw new Error('Explicit manifest output file required');
  const gateway = await startGateway({ allowedOrigin, port, compileFirst: process.env.EFS_SPA_COMPILE !== '0' });
  try { await writeFile(manifestPath, JSON.stringify(gateway.manifest, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n', { flag: 'wx' }); }
  catch (error) { await gateway.close(); throw error; }
  console.log(`Development read-only gateway: ${gateway.rpcUrl}\nAllowed static origin: ${allowedOrigin}\nManifest: ${manifestPath}\nSynthetic signing remains in the local seed process only. No write endpoint. Expires in one hour.`);
  process.once('SIGINT', () => void gateway.close()); process.once('SIGTERM', () => void gateway.close());
}
