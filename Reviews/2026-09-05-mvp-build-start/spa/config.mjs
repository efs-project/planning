export const readMethods = new Set(['eth_chainId', 'eth_blockNumber', 'eth_call', 'eth_getCode',
  'eth_getBlockByNumber', 'eth_getBlockByHash', 'eth_getTransactionReceipt', 'eth_getTransactionByHash']);

export function publicRpcUrl(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) throw new Error('Credential-bearing RPC URLs are not exportable');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) {
    throw new Error('RPC must use HTTPS or explicit loopback HTTP');
  }
  return url.href;
}

export function publicManifest(manifest) {
  const inspect = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, entry] of Object.entries(value)) {
      if (/private.?key|secret|mnemonic|password|token|authorization|signing.?key/i.test(key)) {
        throw new Error('Secret or credential field is not exportable: ' + key);
      }
      inspect(entry);
    }
  };
  inspect(manifest);
  if (manifest?.lab !== true || manifest.deployment?.profile !== 'efs-lab/1') throw new Error('Explicit efs-lab/1 manifest required');
  // The UI's read path needs these public fields, never its simulated accounts/grants.
  return Object.fromEntries(['deployment', 'game', 'data', 'pagination', 'welcome', 'labels', 'lab']
    .filter(key => manifest[key] !== undefined).map(key => [key, manifest[key]]));
}
