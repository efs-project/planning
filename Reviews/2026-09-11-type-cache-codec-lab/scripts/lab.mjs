// Standalone codec/helper only. Managed loopback node; no public RPC option.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { Interface, Wallet, keccak256, toBeHex } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { withManagedAnvil } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { SOLC, TX_GAS, word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const size = hex => (hex.length - 2) / 2;
export function compile() {
  const build = process.env.EFS_CACHE_CODEC_BUILD;
  assert(build && isAbsolute(build) && build !== '/', 'explicit isolated absolute build root required');
  const r = spawnSync('forge', ['build', '--offline', '--use', SOLC, '--force', '--build-info', '--out', join(build, 'out'), '--cache-path', join(build, 'cache'), '--build-info-path', join(build, 'out/build-info')], { cwd: ROOT, encoding: 'utf8', timeout: 240000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return Object.fromEntries(['CompactCacheCodec', 'PreparationHelper'].map(name => [name, JSON.parse(readFileSync(join(build, 'out', name + '.sol', name + '.json'), 'utf8'))]));
}

export async function withCodecLab(artifacts, run, report) {
  report.executionProfile = { chainId: 31337, hardfork: 'cancun', transactionGasLimit: TX_GAS.toString(), blockGasLimit: (TX_GAS * 2n).toString(), network: 'managed local Anvil only', tracing: false };
  const reservation = createServer();
  await new Promise((ok, no) => { reservation.once('error', no); reservation.listen(0, '127.0.0.1', ok); });
  const port = reservation.address().port; await new Promise(ok => reservation.close(ok));
  const args = ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31337', '--hardfork', 'cancun', '--gas-limit', String(TX_GAS * 2n), '--accounts', '0', '--no-cors', '--silent'];
  await withManagedAnvil(args, async node => {
    report.cleanup = node.cleanup;
    const url = `http://127.0.0.1:${port}`;
    async function rpc(method, params = []) {
      const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(15000) });
      const chunks = []; let total = 0;
      for await (const chunk of response.body) { total += chunk.length; assert(total <= 524288, 'bounded codec RPC response'); chunks.push(Buffer.from(chunk)); }
      const j = JSON.parse(Buffer.concat(chunks).toString());
      if (j.error) { const e = Error(j.error.message); e.data = j.error.data; throw e; }
      return j.result;
    }
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) { if (node.spawnError || node.child.exitCode !== null) throw Error('managed node startup'); try { ready = await rpc('eth_chainId') === '0x7a69'; } catch {} if (!ready) await delay(25); }
    assert(ready, 'bounded managed node readiness');
    const wallet = new Wallet(word(0xc0dec));
    await rpc('anvil_setBalance', [wallet.address, '0x3635c9adc5dea00000']);
    async function transact(data, to) {
      const nonce = BigInt(await rpc('eth_getTransactionCount', [wallet.address, 'pending']));
      const signed = await wallet.signTransaction({ chainId: 31337, nonce: Number(nonce), gasLimit: TX_GAS, gasPrice: 2000000000n, data, ...(to ? { to } : {}) });
      const hash = await rpc('eth_sendRawTransaction', [signed]);
      for (let i = 0; i < 200; i++) { const receipt = await rpc('eth_getTransactionReceipt', [hash]); if (receipt) return receipt; await delay(25); }
      throw Error('bounded receipt wait');
    }
    async function deploy(name) {
      const a = artifacts[name], receipt = await transact(a.bytecode.object);
      assert.equal(receipt.status, '0x1', name + ' deployment');
      const code = await rpc('eth_getCode', [receipt.contractAddress, receipt.blockNumber]);
      assert.equal(code, a.deployedBytecode.object, 'exact compiler runtime');
      assert(size(code) <= 24576 && size(a.bytecode.object) <= 49152, 'ordinary runtime/initcode limits');
      const iface = new Interface(a.abi), address = receipt.contractAddress;
      report.deployments[name] = { address, runtimeBytes: size(code), initcodeBytes: size(a.bytecode.object), runtimeHash: keccak256(code), gasUsed: BigInt(receipt.gasUsed).toString(), transactionHash: receipt.transactionHash };
      const sourcePins = Object.fromEntries(Object.entries(a.metadata.sources).map(([path, info]) => [path, info.keccak256]));
      for (const [path, pin] of Object.entries(sourcePins)) assert.equal(keccak256(readFileSync(resolve(ROOT, path))), pin, 'current compiler source pin');
      report.sources[name] = { compiler: a.metadata.compiler, settings: a.metadata.settings, sourcePins };
      const call = async (name, params, at = 'latest') => iface.decodeFunctionResult(name, await rpc('eth_call', [{ to: address, data: iface.encodeFunctionData(name, params), gas: toBeHex(TX_GAS) }, at]));
      const measure = async (name, params) => {
        const data = iface.encodeFunctionData(name, params), r = await transact(data, address);
        assert.equal(r.status, '0x1', name + ' receipt');
        return { gasUsed: BigInt(r.gasUsed).toString(), effectiveGasPrice: BigInt(r.effectiveGasPrice).toString(), transactionHash: r.transactionHash, blockHash: r.blockHash, blockNumber: BigInt(r.blockNumber).toString(), calldataBytes: size(data), calldataHash: keccak256(data), status: r.status };
      };
      return { iface, address, call, measure };
    }
    const codec = await deploy('CompactCacheCodec'), helper = await deploy('PreparationHelper');
    report.basis = await rpc('eth_getBlockByNumber', ['latest', false]).then(b => ({ hash: b.hash, number: BigInt(b.number).toString() }));
    await run({ codec, helper, rpc });
  }, { watchdogMs: 240000 });
}
