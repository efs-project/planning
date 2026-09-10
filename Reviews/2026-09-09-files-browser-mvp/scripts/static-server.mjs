// A GENERIC static file server: serves the files under a root directory and
// nothing else. It knows nothing about EFS — no config endpoint, no RPC relay,
// no validation, no state. Exists to prove the exported browser needs only
// ordinary static hosting plus an explicitly configured JSON-RPC endpoint.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

export async function startStaticServer({ root }) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET') { res.writeHead(405); return res.end('method not allowed'); }
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const relative = normalize(pathname).replace(/^([/\\]|\.\.)+/, '');
      const target = join(root, relative === '' ? 'index.html' : relative);
      if (!target.startsWith(normalize(root))) { res.writeHead(403); return res.end('forbidden'); }
      const body = await readFile(target);
      res.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream', 'content-length': body.length, 'cache-control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  server.requestTimeout = 15000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = 'http://127.0.0.1:' + server.address().port;
  return {
    url,
    async close() { server.closeAllConnections(); await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve())); },
  };
}
