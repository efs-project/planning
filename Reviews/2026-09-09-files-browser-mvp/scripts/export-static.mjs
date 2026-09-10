// Standalone static export: writes the browser as plain files that ANY
// generic static file server can host. The page then talks to an explicitly
// configured JSON-RPC endpoint directly (config.json's rpcUrl) — none of the
// EFS-specific relay endpoints (/config, /rpc, /rpc-batch, /publish) exist.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { BROWSER_FILES } from './server.mjs';

const json = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v);

// A static build is a PUBLISHABLE artifact: by default it carries NO signer
// keys. The fixture's disposable local keys are included only on explicit
// opt-in, and the result is scanned either way — a published build must never
// contain a private key, even a disposable one.
export async function exportStatic({ config, rpcUrl, outDir, includeDisposableKeys = false }) {
  if (typeof rpcUrl !== 'string' || !/^https?:\/\//.test(rpcUrl)) throw Error('exportStatic requires an explicit rpcUrl');
  const written = [];
  for (const [urlPath, source] of BROWSER_FILES) {
    const target = join(outDir, urlPath === '/' ? 'index.html' : urlPath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await readFile(new URL(source, import.meta.url)));
    written.push(urlPath === '/' ? '/index.html' : urlPath);
  }
  // Same shape the relay's /config serves, plus the explicit transport
  // target — but assembled from a WHITELIST, never a spread, so a new field
  // in writeConfig can never silently become public.
  const { writeConfig, ...rest } = config;
  const write = !writeConfig ? null : {
    label: writeConfig.label, authorityVersion: writeConfig.authorityVersion,
    router: writeConfig.router, routerCodehash: writeConfig.routerCodehash,
    carrier: writeConfig.carrier, core: writeConfig.core,
    ...(writeConfig.sponsor ? { sponsor: writeConfig.sponsor } : {}),
    ...(writeConfig.walletPrincipal ? { walletPrincipal: writeConfig.walletPrincipal } : {}),
    authors: Object.fromEntries(Object.entries(writeConfig.authors ?? {}).map(([id, a]) => [id, {
      principal: a.principal, label: a.label,
      ...(includeDisposableKeys ? { key: a.key } : {}),
    }])),
    ...(includeDisposableKeys ? { disposableKeysIncluded: true } : {}),
  };
  const configJson = json({ ...rest, rpcUrl, write });
  if (!includeDisposableKeys) {
    const leak = configJson.match(/0x[0-9a-fA-F]{64}/g)?.filter(v => Object.values(writeConfig?.authors ?? {}).some(a => a.key?.toLowerCase() === v.toLowerCase()));
    if (leak?.length) throw Error('refusing to write a static build containing signer private keys');
  }
  await writeFile(join(outDir, 'config.json'), configJson);
  written.push('/config.json');
  return { outDir, written, disposableKeysIncluded: includeDisposableKeys };
}
