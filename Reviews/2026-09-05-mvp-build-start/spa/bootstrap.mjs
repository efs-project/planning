import * as sdkModule from './sdk/index.js';
import { publicRpcUrl, publicManifest, readMethods } from './config.mjs';

window.EFS_LAB_UTILS = sdkModule;
window.EFS_LAB_TRACE = [];
// No wallet is selected, requested, injected or simulated by this export.
document.body.classList.add('static-read-only');
document.addEventListener('click', event => {
  if (event.target.closest('[data-action], #plan-submit')) {
    event.preventDefault(); event.stopImmediatePropagation();
  }
}, true);
const badge = document.createElement('p');
badge.id = 'static-boundary'; badge.className = 'notice warning';
badge.textContent = 'Static read-only efs-lab/1 · explicit RPC required · no wallet, signing, relay or session transport configured · not full C0';
document.querySelector('#workspace').prepend(badge);

async function loadSdk() {
  const response = await fetch('./config.json', { cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('UNKNOWN: static configuration unavailable');
  const config = await response.json();
  if (config.version !== 1 || config.manifestUrl !== './manifest.json' || !config.rpcUrl) {
    throw new Error('UNKNOWN: explicit deployment manifest and RPC configuration required');
  }
  const rpcUrl = publicRpcUrl(config.rpcUrl);
  const manifestResponse = await fetch(config.manifestUrl, { cache: 'no-store', credentials: 'omit' });
  if (!manifestResponse.ok) throw new Error('UNKNOWN: deployment manifest unavailable');
  const manifest = publicManifest(await manifestResponse.json());
  let sequence = 0;
  const readProvider = { request: async ({ method, params = [] }) => {
    if (!readMethods.has(method)) throw new Error('READ_METHOD_REQUIRED');
    const id = ++sequence;
    window.EFS_LAB_TRACE.push({ channel: 'rpc', method, destination: rpcUrl });
    const result = await fetch(rpcUrl, { method: 'POST', credentials: 'omit',
      redirect: 'error', signal: AbortSignal.timeout(8000), headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }, (_, value) => typeof value === 'bigint' ? value.toString() : value) });
    if (!result.ok) throw new Error('RPC unavailable: HTTP ' + result.status);
    const body = await result.json();
    if (body.jsonrpc !== '2.0' || body.id !== id) throw new Error('RPC_RESPONSE_MISMATCH');
    if (body.error) throw Object.assign(new Error(body.error.message ?? 'RPC unavailable'), body.error);
    if (!Object.hasOwn(body, 'result')) throw new Error('RPC_RESULT_MISSING');
    return body.result;
  } };
  const bootstrap = { ...manifest, readProvider };
  window.EFS_LAB_BOOTSTRAP = bootstrap;
  return sdkModule.createLabSdk(bootstrap);
}
window.EfsLabSdk = loadSdk();
// Attach a rejection handler before module loading; the unchanged shell displays it.
window.EfsLabSdk.catch(() => {});
await import('./workflow-app.mjs');
