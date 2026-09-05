// Ephemeral loopback-only test chain. This module accepts no external RPC.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { ContractFactory, FetchRequest, JsonRpcProvider, keccak256, randomBytes, hexlify } from 'ethers';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const TX_GAS = 29_000_000n;
export function compile({ tests = false } = {}) {
  const compiler = process.env.EFS_LAB_SOLC || process.env.EFS_C0_SOLC || 'solc';
  const version = spawnSync(compiler, ['--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0, 'Set EFS_LAB_SOLC to the local solc 0.8.30 executable');
  assert.match(version.stdout, /0\.8\.30\+commit\.73712a01/);
  const command = tests ? ['test', '-v'] : ['build'];
  const result = spawnSync('forge', [...command, '--use', compiler, '--offline'], { cwd: root, stdio: 'inherit' });
  assert.equal(result.status, 0, 'Solidity compilation/tests failed');
}
export async function artifact(name, source = name) {
  return JSON.parse(await readFile(new URL(`../out/${source}.sol/${name}.json`, import.meta.url), 'utf8'));
}
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
export async function startLabChain({ lifetimeMs = 900_000 } = {}) {
  assert(Number.isSafeInteger(lifetimeMs) && lifetimeMs > 0 && lifetimeMs <= 14_400_000);
  const port = await freePort();
  const child = spawn('anvil', [
    '--host', '127.0.0.1', '--port', String(port), '--hardfork', 'cancun',
    '--chain-id', '31337', '--gas-limit', '30000000', '--accounts', '4', '--no-cors', '--quiet',
  ], { stdio: 'ignore' });
  let spawnError;
  child.on('error', error => { spawnError = error; });
  const alive = () => child.exitCode === null && child.signalCode === null && !spawnError;
  const kill = () => { if (alive()) child.kill('SIGKILL'); };
  const onSignal = () => { kill(); process.exitCode = 130; };
  process.once('exit', kill);
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  const watchdog = setTimeout(kill, lifetimeMs);
  const url = `http://127.0.0.1:${port}`;
  let provider;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100 && !ready; attempt++) {
      if (!alive()) throw new Error('Local Anvil failed to start');
      try {
        const r = await fetch(url, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
          signal: AbortSignal.timeout(500),
        });
        ready = (await r.json()).result === '0x7a69';
      } catch { /* bounded loopback readiness probe */ }
      if (!ready) await delay(100);
    }
    assert(ready, 'Local Anvil readiness timeout');
    const request = new FetchRequest(url); request.timeout = 8000;
    provider = new JsonRpcProvider(request, 31337, { staticNetwork: true, cacheTimeout: -1 });
    provider.pollingInterval = 50;
    const owner = await provider.getSigner(0);
    const relay = await provider.getSigner(1);
    const session = await provider.getSigner(2);
    const stranger = await provider.getSigner(3);
    const compiled = await artifact('EfsLab');
    const runId = hexlify(randomBytes(32));
    const core = await new ContractFactory(compiled.abi, compiled.bytecode.object, owner)
      .deploy(await owner.getAddress(), runId, { gasLimit: TX_GAS });
    const deploymentReceipt = await core.deploymentTransaction().wait(1, 15000);
    assert.equal(deploymentReceipt.status, 1);
    const coreAddress = await core.getAddress();
    const byteStore = await core.byteStore();
    const code = await provider.getCode(coreAddress), carrierCode = await provider.getCode(byteStore);
    assert((code.length - 2) / 2 <= 24576 && (carrierCode.length - 2) / 2 <= 24576, 'EIP170 size');
    const carrierArtifact = await artifact('EfsLabBytes');
    const deployment = {
      chainId: 31337n, core: coreAddress, byteStore, rootId: await core.rootId(), runId,
      owner: await owner.getAddress(), coreAbi: compiled.abi, byteStoreAbi: carrierArtifact.abi,
      profile: 'efs-lab/1', runtimeCodeHashes: { core: keccak256(code), byteStore: keccak256(carrierCode) },
    };
    let closed = false;
    const close = async () => {
      if (closed) return; closed = true;
      clearTimeout(watchdog); provider.destroy();
      if (alive()) {
        child.kill('SIGTERM');
        for (let n = 0; n < 20 && alive(); n++) await delay(25);
        kill();
      }
      process.removeListener('exit', kill);
      process.removeListener('SIGINT', onSignal);
      process.removeListener('SIGTERM', onSignal);
    };
    return { provider, owner, relay, session, stranger, core, deployment, deploymentReceipt,
      runtimeBytes: { core: (code.length - 2) / 2, byteStore: (carrierCode.length - 2) / 2 }, close };
  } catch (error) {
    clearTimeout(watchdog); provider?.destroy(); kill();
    process.removeListener('exit', kill); process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal);
    throw error;
  }
}

export async function withLabChain(action, options) {
  const lab = await startLabChain(options);
  try { return await action(lab); } finally { await lab.close(); }
}

export async function send(method, ...args) {
  const tx = await method.send(...args, { gasLimit: TX_GAS });
  const receipt = await tx.wait(1, 15000);
  assert.equal(receipt.status, 1); return receipt;
}
