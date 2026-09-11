// Managed, disposable loopback fixture runner. Never accepts a public RPC URL.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { AbiCoder, Interface, Wallet, keccak256, toBeHex, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import { recordId, publicationIds } from '../../2026-09-05-c0-admission/codec.mjs';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const TX_GAS = 16777216n;
export const SOLC = process.platform === 'darwin' ? join(homedir(), 'Library/Caches/hardhat-nodejs/compilers-v2/macosx-amd64/solc-macosx-amd64-v0.8.30+commit.73712a01') : 'solc';
const abi = AbiCoder.defaultAbiCoder();
export const word = n => toBeHex(n, 32);
export const domain = s => keccak256(Buffer.from(s));
export function compileStateful() {
  const r = spawnSync('forge', ['build', '--ast', '--build-info', '--offline', '--use', SOLC], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 240000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
}
const artifact = name => JSON.parse(readFileSync(join(ROOT, 'out', name + '.sol', name + '.json'), 'utf8'));
function patch(template, refs, values) {
  let code = template.replace(/^0x/, '');
  for (const [name, positions] of Object.entries(refs)) {
    assert(values[name], 'unknown compiler patch ' + name);
    for (const p of positions) {
      const value = values[name].replace(/^0x/, '').padStart(p.length * 2, '0');
      assert.equal(value.length, p.length * 2); assert(p.start >= 0 && (p.start + p.length) * 2 <= code.length);
      code = code.slice(0, p.start * 2) + value + code.slice((p.start + p.length) * 2);
    }
  }
  assert(!code.includes('_'), 'unresolved compiler links'); return '0x' + code;
}
function links(bytecode, address) {
  const refs = {};
  for (const [file, libraries] of Object.entries(bytecode.linkReferences ?? {})) for (const [name, positions] of Object.entries(libraries)) {
    assert.equal(file, 'src/AdmissionLibrary.sol'); assert.equal(name, 'AdmissionLibrary'); refs[name] = positions;
  }
  return patch(bytecode.object, refs, { AdmissionLibrary: address });
}
function immutableNames(artifact) {
  for (const name of readdirSync(join(ROOT, 'out/build-info')).reverse()) {
    const info = JSON.parse(readFileSync(join(ROOT, 'out/build-info', name), 'utf8'));
    const compiled = info.output?.contracts?.['test/StatefulHarness.sol']?.StatefulHarness;
    if (compiled?.evm?.bytecode?.object !== artifact.bytecode.object.replace(/^0x/, '')) continue;
    if (compiled.evm.deployedBytecode.object !== artifact.deployedBytecode.object.replace(/^0x/, '')) continue;
    if (JSON.stringify(compiled.evm.deployedBytecode.immutableReferences) !== JSON.stringify(artifact.deployedBytecode.immutableReferences)) continue;
    const ast = info.output?.sources?.['test/StatefulHarness.sol']?.ast;
    if (ast) return Object.fromEntries(ast.nodes.find(n => n.name === 'StatefulHarness').nodes.filter(n => n.mutability === 'immutable').map(n => [String(n.id), n.name]));
  }
  throw Error('compiler AST missing: run forge build --ast --build-info --force');
}
export function fixtureInputs() {
  const candidateFile = readFileSync(new URL('../../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json', import.meta.url));
  const candidates = JSON.parse(candidateFile);
  const intrinsicDescriptor = { name: 'TypeSchemaGroup/1', meaning: '', specDigest: null, qualifier: '00'.repeat(32), fields: [{ name: 'groupBytes', kind: 'BYTES', max: 8190 }], roles: [], indexes: [], constraints: [] };
  const intrinsicGroupBytes = '0x' + encodeGroup([intrinsicDescriptor]).toString('hex');
  const init = { realmId: domain('task3/disposable/realm'), initialRevisionId: domain('task3/disposable/revision'), intrinsicGroupBytes, objectGroup1Bytes: '0x' + candidates.groups[0].groupHex, kernelGroup2Bytes: '0x' + candidates.groups[1].groupHex };
  return { candidates, candidateFileHash: keccak256(candidateFile), init, meta: derive(Buffer.from(intrinsicGroupBytes.slice(2), 'hex')).ids[0] };
}
export function publication(leaves, nonce, { principal = word(0xffffffffffffn), selected, revisions = [] } = {}) {
  const header = { profile: 1, principalId: principal, authorityRef: ZeroHash, authEpoch: 0, pubNonce: word(nonce), notAfter: 0 };
  const recordIds = leaves.map(x => recordId(x.typeId, x.body));
  const indices = selected ?? leaves.map((_, i) => i);
  return { envelopeId: publicationIds(header, recordIds).envelopeId, header, recordIds, leafMask: indices.reduce((n, i) => n | (1n << BigInt(i)), 0n), leaves: indices.map(i => ({ leafIndex: i, ...leaves[i] })), expectedRevisions: revisions.map(([leafIndex, revision]) => ({ leafIndex, revision })) };
}
export function groupLeaf(meta, raw) { return { typeId: meta, body: '0x' + ((raw.length - 2) / 2).toString(16).padStart(4, '0') + raw.slice(2) }; }

export async function withStateful(action) {
  const reservation = createServer(); await new Promise((ok, no) => { reservation.once('error', no); reservation.listen(0, '127.0.0.1', ok); });
  const port = reservation.address().port; await new Promise(ok => reservation.close(ok));
  // Block may hold the two-transaction race; EACH tx still uses the unchanged cap.
  const args = ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31337', '--hardfork', 'cancun', '--gas-limit', String(TX_GAS * 2n), '--accounts', '0', '--no-cors', '--silent'];
  const child = spawn('anvil', args, { stdio: 'ignore' }); let spawnError;
  child.on('error', e => { spawnError = e; });
  const url = 'http://127.0.0.1:' + port, source = 'managed-anvil:' + url;
  const kill = () => { if (child.exitCode === null) child.kill('SIGKILL'); };
  const signal = () => { kill(); process.exitCode = 130; };
  process.once('exit', kill); process.once('SIGINT', signal); process.once('SIGTERM', signal);
  const watchdog = setTimeout(kill, 600000);
  let automine = true, cleanup = {}, result;
  // Transport caps the streamed JSON body BEFORE JSON.parse/ABI allocation.
  async function rpc(method, params = [], { maxBytes = 262144 } = {}) {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(8000) });
    const length = response.headers.get('content-length');
    if (length && BigInt(length) > BigInt(maxBytes)) { await response.body.cancel(); throw Error('response byte budget'); }
    const chunks = []; let total = 0;
    for await (const chunk of response.body) { total += chunk.length; if (total > maxBytes) { throw Error('response byte budget'); } chunks.push(Buffer.from(chunk)); }
    const j = JSON.parse(Buffer.concat(chunks, total).toString()); if (j.error) throw Error(JSON.stringify(j.error)); return j.result;
  }
  try {
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) { if (spawnError || child.exitCode !== null) throw Error('managed node startup'); try { ready = await rpc('eth_chainId') === '0x7a69'; } catch {} if (!ready) await delay(50); }
    assert(ready, 'bounded readiness');
    const wallet = new Wallet(word(0xc003)); await rpc('anvil_setBalance', [wallet.address, '0x3635c9adc5dea00000']);
    async function send(data, to, { gas = TX_GAS, nonce } = {}) {
      assert(gas > 0n && gas <= TX_GAS, 'transaction gas ceiling');
      const n = nonce ?? BigInt(await rpc('eth_getTransactionCount', [wallet.address, 'pending']));
      const raw = await wallet.signTransaction({ chainId: 31337, nonce: Number(n), gasLimit: gas, gasPrice: 2000000000n, data, ...(to ? { to } : {}) });
      return { hash: await rpc('eth_sendRawTransaction', [raw]), raw, data, from: wallet.address.toLowerCase(), to: to?.toLowerCase() ?? null };
    }
    async function receipt(tx) { for (let i = 0; i < 300; i++) { const r = await rpc('eth_getTransactionReceipt', [tx.hash]); if (r) return r; await delay(25); } throw Error('bounded receipt wait'); }
    async function deploy(name) {
      const a = artifact(name); assert((a.bytecode.object.length - 2) / 2 <= 49152);
      const tx = await send(a.bytecode.object), r = await receipt(tx); assert.equal(r.status, '0x1', name + ' deployment');
      const address = r.contractAddress, code = await rpc('eth_getCode', [address, r.blockNumber]); assert((code.length - 2) / 2 <= 24576);
      const expectedCode = patch(a.deployedBytecode.object, a.deployedBytecode.immutableReferences ?? {}, { library_deploy_address: address });
      assert.equal(code, expectedCode); return { address, code: expectedCode, codehash: keccak256(expectedCode), receipt: r, artifact: a };
    }
    const helper = await deploy('PreparationHelper'), library = await deploy('AdmissionLibrary'), a = artifact('StatefulHarness'), inputs = fixtureInputs();
    const values = { preparationHelper: helper.address, preparationCodehash: helper.codehash, admissionLibrary: library.address, admissionCodehash: library.codehash };
    const names = immutableNames(a), immutableValues = Object.fromEntries(Object.entries(names).map(([id, name]) => [id, values[name]]));
    const coreCode = patch(links(a.deployedBytecode, library.address), a.deployedBytecode.immutableReferences, immutableValues);
    assert((coreCode.length - 2) / 2 <= 24576, 'Core EIP170 ceiling');
    const constructor = abi.encode(['tuple(bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes objectGroup1Bytes,bytes kernelGroup2Bytes)', 'address', 'bytes32', 'bytes32'], [inputs.init, helper.address, helper.codehash, library.codehash]);
    const creation = links(a.bytecode, library.address) + constructor.slice(2); assert((creation.length - 2) / 2 <= 49152);
    const tx = await send(creation), deploymentReceipt = await receipt(tx); assert.equal(deploymentReceipt.status, '0x1');
    const core = deploymentReceipt.contractAddress, iface = new Interface(a.abi); assert.equal(await rpc('eth_getCode', [core, deploymentReceipt.blockNumber]), coreCode);
    // This source-pinned harness always initializes the legacy layout.
    const expected = { core, chainId: '31337', source, scopeLayout: 0, scopeLayoutProfile: 'legacy-fixed-v0', init: inputs.init, components: { core: { address: core, code: coreCode }, helper: { address: helper.address, code: helper.code }, library: { address: library.address, code: library.code } }, getters: values };
    // Independently declared fixture expectation for every batch, not observed state.
    expected.syntheticBatchAuthority = { authorityBasis: '4660', authorityCodehash: word(0xabcd) };
    const context = principal => ({ authenticatedPrincipal: principal, revisionOrdinal: 1, authorityBasis: 4660, authorityCodehash: word(0xabcd) });
    const data = p => iface.encodeFunctionData('publishTrustedForTest', [context(p.header.principalId), p]);
    const transactions = [];
    const publish = async p => { const tx = await send(data(p), core), r = await receipt(tx), result = { tx, receipt: r }; assert(BigInt(r.gasUsed) <= TX_GAS, 'actual receipt gas ceiling'); transactions.push(result); return result; };
    const preview = async p => iface.decodeFunctionResult('publishTrustedForTest', await rpc('eth_call', [{ from: wallet.address, to: core, data: data(p), gas: toBeHex(TX_GAS) }, 'latest']))[0];
    const mine = async enabled => { await rpc('evm_setAutomine', [enabled]); automine = enabled; };
    const sourcePins = {};
    for (const compiled of [a, library.artifact, helper.artifact]) for (const [name, value] of Object.entries(compiled.metadata.sources)) {
      if (sourcePins[name]) assert.equal(sourcePins[name], value.keccak256, 'mixed compiler source artifacts'); sourcePins[name] = value.keccak256;
    }
    const resources = { txGasCeiling: String(TX_GAS), nodeArgs: args, compiler: a.metadata.compiler, settings: a.metadata.settings, sourcePins, inputPins: { candidateFile: inputs.candidateFileHash, groups: inputs.candidates.groups.map(g => keccak256('0x' + g.groupHex)), intrinsic: keccak256(inputs.init.intrinsicGroupBytes) }, deployment: { helper: { runtimeBytes: helper.code.length / 2 - 1, initcodeBytes: helper.artifact.bytecode.object.length / 2 - 1, gas: BigInt(helper.receipt.gasUsed).toString() }, library: { runtimeBytes: library.code.length / 2 - 1, initcodeBytes: library.artifact.bytecode.object.length / 2 - 1, gas: BigInt(library.receipt.gasUsed).toString(), ownAddressPatches: library.artifact.deployedBytecode.immutableReferences, methodIdentifiers: library.artifact.methodIdentifiers }, core: { runtimeBytes: coreCode.length / 2 - 1, initcodeBytes: creation.length / 2 - 1, gas: BigInt(deploymentReceipt.gasUsed).toString(), links: a.bytecode.linkReferences, immutables: names } } };
    result = await action({ rpc, core, iface, expected, inputs, context, data, send, receipt, publish, preview, mine, resources, cleanup, transactions });
  } finally {
    if (!automine && child.exitCode === null) { try { await rpc('evm_setAutomine', [true]); cleanup.automineRestored = true; } catch { cleanup.automineRestored = false; } }
    clearTimeout(watchdog);
    if (child.exitCode === null) { child.kill('SIGTERM'); for (let i = 0; i < 40 && child.exitCode === null; i++) await delay(25); kill(); for (let i = 0; i < 40 && child.exitCode === null && child.signalCode === null; i++) await delay(25); }
    Object.assign(cleanup, { pid: child.pid, exitCode: child.exitCode, signal: child.signalCode, stopped: child.exitCode !== null || child.signalCode !== null });
    process.removeListener('exit', kill); process.removeListener('SIGINT', signal); process.removeListener('SIGTERM', signal);
  }
  return result;
}
