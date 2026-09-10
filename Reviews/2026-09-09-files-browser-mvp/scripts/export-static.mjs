// Standalone static export: writes the browser as plain files that ANY
// generic static file server can host. The page then talks to an explicitly
// configured JSON-RPC endpoint directly (config.json's rpcUrl) — none of the
// EFS-specific relay endpoints (/config, /rpc, /rpc-batch, /publish) exist.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { BROWSER_FILES } from './server.mjs';

const json = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v);

export async function exportStatic({ config, rpcUrl, outDir }) {
  if (typeof rpcUrl !== 'string' || !/^https?:\/\//.test(rpcUrl)) throw Error('exportStatic requires an explicit rpcUrl');
  const written = [];
  for (const [urlPath, source] of BROWSER_FILES) {
    const target = join(outDir, urlPath === '/' ? 'index.html' : urlPath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await readFile(new URL(source, import.meta.url)));
    written.push(urlPath === '/' ? '/index.html' : urlPath);
  }
  // Same shape the relay's /config serves, plus the explicit transport target.
  const { writeConfig, ...rest } = config;
  await writeFile(join(outDir, 'config.json'), json({ ...rest, rpcUrl, write: writeConfig ?? null }));
  written.push('/config.json');
  return { outDir, written };
}
