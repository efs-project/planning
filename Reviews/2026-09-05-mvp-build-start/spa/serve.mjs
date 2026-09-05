import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function startStatic({ directory, prefix, port = 0 }) {
  if (!directory || !/^\/(?:[A-Za-z0-9_-]+\/)+$/.test(prefix ?? '')) throw new Error('Explicit directory and non-root trailing-slash prefix required');
  const root = await realpath(directory);
  let origin;
  const server = createServer(async (request, response) => {
    try {
      if (request.headers.host !== new URL(origin).host) { response.writeHead(403); return response.end(); }
      const pathname = decodeURIComponent(new URL(request.url, origin).pathname);
      if (!['GET', 'HEAD'].includes(request.method) || !pathname.startsWith(prefix)) { response.writeHead(404); return response.end(); }
      const file = await realpath(resolve(root, pathname.slice(prefix.length) || 'index.html'));
      if (!file.startsWith(root + sep)) { response.writeHead(403); return response.end(); }
      const bytes = await readFile(file);
      response.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' })[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
        'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'",
        'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(Number(port), '127.0.0.1', done); });
  origin = `http://127.0.0.1:${server.address().port}`;
  let closed = false;
  return { origin, url: origin + prefix, close: async () => {
    if (closed) return; closed = true; server.closeAllConnections(); await new Promise(done => server.close(done));
  } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [directory, prefix, port] = process.argv.slice(2);
  const host = await startStatic({ directory, prefix, port }); console.log(host.url);
  process.once('SIGINT', () => void host.close()); process.once('SIGTERM', () => void host.close());
}
