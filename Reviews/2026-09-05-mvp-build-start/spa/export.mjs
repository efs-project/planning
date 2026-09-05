import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publicManifest, publicRpcUrl } from './config.mjs';

const rehearsal = new URL('../../2026-09-04-mvp-rehearsal/', import.meta.url);
const serialize = value => JSON.stringify(value, (_, entry) => typeof entry === 'bigint' ? entry.toString() : entry, 2) + '\n';

export async function exportSpa({ outputDir, manifest, rpcUrl } = {}) {
  if (!outputDir) throw new Error('Explicit output directory required');
  if (Boolean(manifest) !== Boolean(rpcUrl)) throw new Error('Manifest and RPC must be configured together');
  const deployment = manifest ? publicManifest(manifest) : null;
  const endpoint = rpcUrl ? publicRpcUrl(rpcUrl) : null;
  const directory = resolve(outputDir);
  await mkdir(directory); // Intentionally refuse an existing output; never overwrite deployments.
  await mkdir(join(directory, 'sdk')); await mkdir(join(directory, 'vendor'));
  const assets = ['styles.css', 'workflow.css', 'workflow-app.mjs', 'model.mjs', 'files-view.mjs', 'data-view.mjs', 'arcade-view.mjs'];
  for (const asset of assets) await copyFile(new URL('web/' + asset, rehearsal), join(directory, asset));
  await copyFile(new URL('sdk/index.js', rehearsal), join(directory, 'sdk/index.js'));
  await copyFile(new URL('node_modules/ethers/dist/ethers.min.js', rehearsal), join(directory, 'vendor/ethers.js'));
  for (const asset of ['bootstrap.mjs', 'config.mjs']) await copyFile(new URL(asset, import.meta.url), join(directory, asset));
  const connect = endpoint ? "'self' " + new URL(endpoint).origin : "'self'";
  const csp = `object-src 'none'; base-uri 'none'; connect-src ${connect}; form-action 'none'`;
  let html = await readFile(new URL('web/index.html', rehearsal), 'utf8');
  html = html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`)
    .replace('</head>', '<style>.static-read-only [data-action],.static-read-only #write-dialog,.static-read-only #confirm-dialog{display:none!important}</style>\n</head>');
  await writeFile(join(directory, 'index.html'), html);
  await writeFile(join(directory, 'config.json'), serialize({ version: 1, manifestUrl: deployment ? './manifest.json' : null, rpcUrl: endpoint }));
  if (deployment) await writeFile(join(directory, 'manifest.json'), serialize(deployment));
  return { directory, files: ['index.html', 'config.json', ...(deployment ? ['manifest.json'] : []), ...assets, 'bootstrap.mjs', 'config.mjs', 'sdk/index.js', 'vendor/ethers.js'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [outputDir, manifestPath, rpcUrl] = process.argv.slice(2);
  const manifest = manifestPath ? JSON.parse(await readFile(resolve(manifestPath), 'utf8')) : undefined;
  console.log(serialize(await exportSpa({ outputDir, manifest, rpcUrl })));
}
