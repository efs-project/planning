// Index-layer lab, round 2: the FRESH-WORLD deployer. A managed anvil and a
// foundation pair deployed from the LAB's own `out/` (compiled against the
// lab's PATCHED `src/`, i.e. Codex's K10 kernel + readers), whose U1 core
// (`UpgradeableReadFixtureCoreK10`) calls `StateKernel.selectScopeLayout(mode)`
// BEFORE `StateKernel.initialize` — the seam Codex's K10ScopeHarness
// constructor demonstrates. `mode` 0 gives the legacy layout on the same
// kernel bytes (a second control); `mode` 1 gives the K10 layout.
//
// Exposes the same surface `withUpgrade` (foundation scripts/local-upgrade.mjs)
// gives the fixtures the lab reuses (nestedFixture -> routerFixture ->
// authorityFixture -> indexLayerFixture): rpc / send / receipt / publish /
// prepare / stage / core / carrier / iface / readIface / expected / inputs /
// resources. The compiler-evidence and installed-runtime cross-checks of the
// foundation runner are NOT reproduced; artifact sha256s are recorded instead.
// Managed disposable node ONLY. No RPC URL input, public network or real keys.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { AbiCoder, Interface, Wallet, keccak256, toBeHex, getCreateAddress } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { fixtureInputs, TX_GAS, word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { LAB } from './lab-fixture.mjs';

const abi = AbiCoder.defaultAbiCoder();
const lower = x => x.toLowerCase();
const bytes = x => (x.length - 2) / 2;
const artifact = name => JSON.parse(readFileSync(join(LAB, 'out', name + '.json'), 'utf8'));

function linked(a, libraries) {
  let code = a.bytecode.object.replace(/^0x/, '');
  for (const refs of Object.values(a.bytecode.linkReferences ?? {})) {
    for (const [name, positions] of Object.entries(refs)) {
      const address = libraries[name];
      assert(address, 'unknown link ' + name);
      for (const p of positions) {
        const value = address.replace(/^0x/, '').toLowerCase().padStart(p.length * 2, '0');
        code = code.slice(0, p.start * 2) + value + code.slice((p.start + p.length) * 2);
      }
    }
  }
  assert(!code.includes('_'), 'unresolved link references');
  return '0x' + code;
}

export async function withLabWorld({ scopeLayout }, action, { watchdogMs = 300000 } = {}) {
  assert(scopeLayout === 0 || scopeLayout === 1, 'explicit scope layout 0 | 1');
  const reservation = createServer(); await new Promise((ok, no) => { reservation.once('error', no); reservation.listen(0, '127.0.0.1', ok); });
  const port = reservation.address().port; await new Promise(ok => reservation.close(ok));
  const args = ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31337', '--hardfork', 'cancun', '--gas-limit', String(TX_GAS * 2n), '--accounts', '0', '--no-cors', '--silent'];
  const child = spawn('anvil', args, { stdio: 'ignore' }); let spawnError;
  child.on('error', e => { spawnError = e; });
  const url = 'http://127.0.0.1:' + port, source = 'managed-anvil:' + url;
  const kill = () => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); };
  const signal = () => { kill(); process.exitCode = 130; };
  process.once('exit', kill); process.once('SIGINT', signal); process.once('SIGTERM', signal);
  const watchdog = setTimeout(kill, watchdogMs), cleanup = {}, transactions = [];
  let automine = true, result;
  async function rpc(method, params = []) {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(30000) });
    const j = await response.json(); if (j.error) { const e = Error(j.error.message); e.data = j.error.data; throw e; } return j.result;
  }
  try {
    let ready = false; for (let i = 0; i < 100 && !ready; i++) { if (spawnError || child.exitCode !== null) throw Error('managed node startup'); try { ready = await rpc('eth_chainId') === '0x7a69'; } catch {} if (!ready) await delay(50); } assert(ready, 'bounded readiness');
    const wallet = new Wallet(word(0xc008)), operator = new Wallet(word(0xc009)); await rpc('anvil_setBalance', [wallet.address, '0x3635c9adc5dea00000']);
    async function send(data, to) {
      const n = BigInt(await rpc('eth_getTransactionCount', [wallet.address, 'pending']));
      const raw = await wallet.signTransaction({ chainId: 31337, nonce: Number(n), gasLimit: TX_GAS, gasPrice: 2000000000n, data, ...(to ? { to } : {}) });
      return { hash: await rpc('eth_sendRawTransaction', [raw]), data, to: to ?? null, from: wallet.address };
    }
    async function receipt(tx, label) {
      for (let i = 0; i < 300; i++) { const r = await rpc('eth_getTransactionReceipt', [tx.hash]); if (r) { assert(BigInt(r.gasUsed) <= TX_GAS); transactions.push({ label, hash: tx.hash, status: r.status, gasUsed: BigInt(r.gasUsed).toString() }); return r; } await delay(25); }
      throw Error('bounded receipt wait');
    }
    const resources = { txGasCeiling: String(TX_GAS), runtimeCeiling: 24576, initcodeCeiling: 49152, nodeArgs: args, deployment: {}, artifactPins: {}, world: 'lab-fresh', scopeLayout };
    const components = {}, implementations = {};
    async function deploy(name, file, constructorTypes = [], constructorArgs = [], links = {}) {
      const a = artifact(file + '.sol/' + name);
      const creation = linked(a, links) + (constructorTypes.length ? abi.encode(constructorTypes, constructorArgs).slice(2) : '');
      assert(bytes(creation) <= 49152, name + ' initcode ceiling');
      const r = await receipt(await send(creation), name); assert.equal(r.status, '0x1', name + ' deployment');
      const address = lower(r.contractAddress);
      const code = await rpc('eth_getCode', [address, r.blockNumber]);
      assert(bytes(code) <= 24576, name + ' runtime ceiling');
      resources.artifactPins[name] = keccak256(Buffer.from(JSON.stringify(a)));
      resources.deployment[name] = { address, runtimeBytes: bytes(code), initcodeBytes: bytes(creation), gas: BigInt(r.gasUsed).toString(), codehash: keccak256(code) };
      components[name] = { address, code };
      return { address, code, codehash: keccak256(code), iface: new Interface(a.abi), artifact: a };
    }
    const factory = await deploy('FixtureDeployment', 'FixtureDeployment');
    const helper = await deploy('PreparationHelper', 'PreparationHelper');
    const library = await deploy('UpgradeAdmissionLibrary', 'UpgradeAdmissionLibrary');
    const point = await deploy('PointReadLibrary', 'PointReadLibrary');
    const query = await deploy('UpgradeQueryReadLibrary', 'UpgradeQueryReadLibrary');
    const links = { UpgradeAdmissionLibrary: library.address, PointReadLibrary: point.address, UpgradeQueryReadLibrary: query.address };
    const core1 = await deploy('UpgradeableReadFixtureCoreK10', 'LabWorld', ['address', 'address', 'bytes32', 'bytes32', 'uint256'], [factory.address, helper.address, point.codehash, query.codehash, scopeLayout], links);
    const carrier1 = await deploy('UpgradeableFixtureCarrier', 'UpgradeableFixtureCarrier', ['address', 'address'], [factory.address, helper.address], links);
    for (const d of [core1, carrier1]) implementations[d.address] = { code: d.code };
    const inputs = fixtureInputs(), m = Object.fromEntries(inputs.candidates.groups.flatMap(g => g.members.map(x => [x.descriptor.name, x.temporaryTypeSchemaId]))), treeType = m['ChunkTree/1'];
    const core = lower(getCreateAddress({ from: factory.address, nonce: 1 })), carrier = lower(getCreateAddress({ from: factory.address, nonce: 2 }));
    const coreAdmin = lower(getCreateAddress({ from: core, nonce: 1 })), carrierAdmin = lower(getCreateAddress({ from: carrier, nonce: 1 }));
    const boot = await receipt(await send(factory.iface.encodeFunctionData('deployPair', [core1.address, carrier1.address, operator.address, treeType, inputs.init]), factory.address), 'atomic pair bootstrap');
    assert.equal(boot.status, '0x1', 'deployPair');
    for (const [kind, address] of [['core', core], ['carrier', carrier], ['coreAdmin', coreAdmin], ['carrierAdmin', carrierAdmin]]) components[kind] = { address, code: await rpc('eth_getCode', [address, 'latest']) };
    const iface = new Interface(artifact('UpgradeableFixtureCore.sol/UpgradeableFixtureCoreU2').abi), readIface = core1.iface, carrierIface = carrier1.iface;
    // The stored discriminator must read back as selected (full word, never inferred).
    const stored = BigInt(await rpc('eth_call', [{ to: core, data: readIface.encodeFunctionData('scopeLayout', []) }, 'latest']));
    assert.equal(stored, BigInt(scopeLayout), 'stored scopeLayout');
    const expected = { core, chainId: '31337', source, scopeLayout, init: inputs.init, components, implementations, getters: { preparationHelper: helper.address, preparationCodehash: helper.codehash, admissionLibrary: library.address, admissionCodehash: library.codehash }, execution: { core, carrier, coreAdmin, carrierAdmin, controller: factory.address, operator: operator.address, helper: helper.address, helperCodehash: helper.codehash, admissionLibrary: library.address, admissionCodehash: library.codehash, treeType } };
    resources.compiler = core1.artifact.metadata.compiler;
    resources.versions = { node: process.version, ethers: JSON.parse(readFileSync(join(LAB, '../2026-09-04-mvp-rehearsal/node_modules/ethers/package.json'), 'utf8')).version };
    async function call(address, codec, name, args = [], pin = 'latest') {
      const data = await rpc('eth_call', [{ to: address, data: codec.encodeFunctionData(name, args), gas: toBeHex(TX_GAS) }, pin]);
      return codec.decodeFunctionResult(name, data)[0];
    }
    let nonce = 1n, byteNonce = 1n;
    const typedDomain = address => ({ name: 'EFS Upgrade Foundation', version: '1', chainId: 31337, verifyingContract: address });
    async function prepare(publication) {
      const revision = await call(core, iface, 'currentRevision'), execution = await call(core, iface, 'revisionAt', [revision]);
      const deadline = BigInt((await rpc('eth_getBlockByNumber', ['latest', false])).timestamp) + 3600n, n = nonce++;
      const publicationHash = keccak256(abi.encode([iface.getFunction('executeFixture').inputs[0]], [publication]));
      const signature = await operator.signTypedData(typedDomain(core), { FixturePlan: [{ name: 'publicationHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' }, { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' }] }, { publicationHash, executionSetId: execution.id, nonce: n, deadline });
      return { publication, revision, nonce: n, deadline, signature };
    }
    const data = p => iface.encodeFunctionData('executeFixture', [p.publication, p.revision, p.nonce, p.deadline, p.signature]);
    const submit = async p => { const tx = await send(data(p), core); return { tx, receipt: await receipt(tx, 'publication') }; };
    const publish = async p => submit(await prepare(p));
    async function stage(treeId, body, bytesData) {
      const revision = await call(carrier, carrierIface, 'currentRevision'), e = await call(carrier, carrierIface, 'revisionAt', [revision]), n = byteNonce++, deadline = BigInt((await rpc('eth_getBlockByNumber', ['latest', false])).timestamp) + 3600n;
      const signature = await operator.signTypedData(typedDomain(carrier), { FixtureBytes: [{ name: 'treeId', type: 'bytes32' }, { name: 'bodyHash', type: 'bytes32' }, { name: 'dataHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' }, { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' }] }, { treeId, bodyHash: keccak256(body), dataHash: keccak256(bytesData), executionSetId: e.id, nonce: n, deadline });
      const tx = await send(carrierIface.encodeFunctionData('stageFixtureBytes', [treeId, body, bytesData, revision, n, deadline, signature]), carrier); return { tx, receipt: await receipt(tx, 'separate byte staging') };
    }
    const mine = async enabled => { await rpc('evm_setAutomine', [enabled]); automine = enabled; };
    result = await action({ rpc, core, carrier, operator: operator.address, iface, readIface, expected, inputs, resources, cleanup, transactions, prepare, publish, submit, stage, mine, send, receipt, data, scopeLayout });
  } finally {
    if (!automine && child.exitCode === null) { try { await rpc('evm_setAutomine', [true]); cleanup.automineRestored = true; } catch { cleanup.automineRestored = false; } }
    clearTimeout(watchdog);
    if (child.exitCode === null) { child.kill('SIGTERM'); for (let i = 0; i < 40 && child.exitCode === null && child.signalCode === null; i++) await delay(25); kill(); for (let i = 0; i < 40 && child.exitCode === null && child.signalCode === null; i++) await delay(25); }
    Object.assign(cleanup, { pid: child.pid, exitCode: child.exitCode, signal: child.signalCode, stopped: child.exitCode !== null || child.signalCode !== null });
    process.removeListener('exit', kill); process.removeListener('SIGINT', signal); process.removeListener('SIGTERM', signal);
  }
  return result;
}
