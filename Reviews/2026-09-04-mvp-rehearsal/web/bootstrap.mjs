import * as sdkModule from './sdk/index.js';

window.EFS_LAB_UTILS = sdkModule;

window.EFS_LAB_TRACE = [];
window.EfsLabSdk = (async () => {
  const response = await fetch('./config', { cache: 'no-store' });
  if (!response.ok) throw new Error('Local lab configuration unavailable');
  const config = await response.json();
  const provider = channel => ({ request: async request => {
    window.EFS_LAB_TRACE.push({ channel, method: request.method });
    const result = await fetch(`./${channel}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request, (_, value) => typeof value === 'bigint' ? value.toString() : value) });
    const body = await result.json();
    if (!result.ok || body.error) throw Object.assign(new Error(body.error?.message ?? 'Local RPC unavailable'), body.error);
    return body.result;
  } });
  const bootstrap = { ...config, readProvider: provider('rpc'), walletProvider: provider('wallet'),
    relayProvider: provider('relay'), sessionProvider: provider('session') };
  window.EFS_LAB_BOOTSTRAP = bootstrap;
  return sdkModule.createLabSdk(bootstrap);
})();
await import('./app.mjs');
