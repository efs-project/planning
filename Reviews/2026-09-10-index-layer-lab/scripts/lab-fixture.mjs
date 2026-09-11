// Index-layer lab fixture: upgrades the POPULATED files-browser pair (U3,
// FilesRouterV2, claimed principals) to the lab's U4 core, whose only
// admission path is the hooked `executeAuthorized`, and exposes the
// index-layer surface (declare / backfill / probe / probeTolerated / page /
// announceDetach / detach) plus direct author-signed admissions for one-step
// rebinds the router does not offer. Managed anvil only; no public network.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { AbiCoder, Interface, Wallet, keccak256, toBeHex, ZeroHash, ZeroAddress, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { word, TX_GAS, SOLC, publication } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { FIXTURE, nameRole, bindingKey, bindingScopeKey, ordinaryRecord } from '../../2026-09-09-files-reader/index.mjs';
import { EXTENDED_TYPES, core3Interface, publicationHash, latestBindingState } from '../../2026-09-09-files-browser-mvp/sdk/files-actions.mjs';

export const LAB = fileURLToPath(new URL('..', import.meta.url));
const abi = AbiCoder.defaultAbiCoder();
export const cat = (...parts) => '0x' + parts.map(p => String(p).replace(/^0x/, '')).join('');
export const hash = s => keccak256(toUtf8Bytes(s));
const utf8hex = s => cat(Array.from(new TextEncoder().encode(s), b => b.toString(16).padStart(2, '0')).join(''));
export const str = s => { const h = utf8hex(s); return cat(((h.length - 2) / 2).toString(16).padStart(4, '0'), h); };
const u16 = n => n.toString(16).padStart(4, '0');
const DOM_SCALAR = hash('efs2/vk/scalar/1');
/** Bucket of a FIELD_EQ family = IndexKeys.scalar(fieldBytes). */
export const bucketOf = fieldBytes => keccak256(abi.encode(['bytes32', 'bytes32'], [DOM_SCALAR, keccak256(fieldBytes)]));
export const scopeOf = (principal, dir) => bindingScopeKey(principal, FIXTURE.namePurpose, dir);
export const NONE = (1n << 64n) - 1n;
export const js = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? v.toString() : v);
export const COV = Object.freeze({ NONE: 0, PARTIAL: 1, COMPLETE: 2, FROZEN: 3 });
export const TRI = Object.freeze({ HIT: 0, MISS_COVERED: 1, UNCOVERED: 2, UNSUPPORTED: 3, FROZEN: 4 });
export const COMPLETENESS = Object.freeze({ UNKNOWN: 0, COMPLETE: 1, PARTIAL: 2, UNSUPPORTED: 3 });
export const DE = EXTENDED_TYPES['DirectoryEntry/1'];
export const WHITEOUT = EXTENDED_TYPES['DirectoryWhiteout/1'];

export function compileLab() {
  const r = spawnSync('forge', ['build', '--offline', '--use', SOLC], { cwd: LAB, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
}
export const artifact = name => JSON.parse(readFileSync(join(LAB, 'out', name + '.json'), 'utf8'));

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

const FACTORY = new Interface(['function upgradePair(address nextCore,address nextCarrier,bytes coreMigration,bytes carrierMigration)']);
export const DirectoryEntryLeaf = (parent, name, child) => ({ typeId: DE, body: cat(parent, str(name), child, '00') });
export const WhiteoutLeaf = (parent, name) => ({ typeId: WHITEOUT, body: cat(parent, str(name)) });
/** BindingSet leaf with CAS row; prior = {revision, occurrence:{envelopeId, leafIndex}} | null. */
export const BindLeaf = (purpose, subject, role, target, prior) => ({
  leaf: { typeId: EXTENDED_TYPES['BindingSet/1'], body: cat(purpose, subject, role, '01', target, '00', prior ? cat('01', prior.occurrence.envelopeId, u16(prior.occurrence.leafIndex)) : '0x00') },
  revision: prior?.revision ?? 0,
});

export async function indexLayerFixture(lab, auth) {
  const controller = lab.expected.execution.controller;
  const helper = lab.expected.execution.helper;
  const components = lab.expected.components;
  const libraries = {
    UpgradeAdmissionLibrary: lab.expected.execution.admissionLibrary, // the PINNED kernel library (controller-enforced)
    PointReadLibrary: components.PointReadLibrary.address,
    UpgradeQueryReadLibrary: components.UpgradeQueryReadLibrary.address,
  };
  async function deploy(name, ctor = '0x', libs = libraries) {
    const a = artifact(name);
    const receipt = await lab.receipt(await lab.send(linked(a, libs) + ctor.slice(2)), name + ' deployment');
    assert.equal(receipt.status, '0x1', name + ' deployment');
    const code = await lab.rpc('eth_getCode', [receipt.contractAddress, receipt.blockNumber]);
    assert((code.length - 2) / 2 <= 24576, name + ' EIP-170');
    return { address: receipt.contractAddress, codehash: keccak256(code), runtimeBytes: (code.length - 2) / 2, gas: BigInt(receipt.gasUsed), abi: a.abi };
  }
  const hook = await deploy('IndexedAdmission.sol/IndexedAdmission');
  const module = await deploy('IndexLayerModule.sol/IndexLayerModule');
  const coreCtor = abi.encode(['address', 'address', 'bytes32', 'bytes32', 'address'],
    [controller, helper, keccak256(components.PointReadLibrary.code), keccak256(components.UpgradeQueryReadLibrary.code), module.address]);
  const core4 = await deploy('LabCoreU4.sol/UpgradeableFixtureCoreU4', coreCtor, { ...libraries, IndexedAdmission: hook.address });
  const upgraded = await lab.receipt(await lab.send(FACTORY.encodeFunctionData('upgradePair', [core4.address, auth.carrier3.address, '0x', '0x']), controller), 'index-layer upgrade');
  assert.equal(upgraded.status, '0x1', 'index-layer upgrade');

  const iface = new Interface([...module.abi.filter(f => f.type !== 'constructor'), ...core4.abi.filter(f => f.type === 'error' && !module.abi.some(g => g.type === 'error' && g.name === f.name))]);
  const readIface = lab.readIface;
  const call = async (data, to = lab.core, block = 'latest', from = undefined) => lab.rpc('eth_call', [{ to, data, gas: toBeHex(TX_GAS), ...(from ? { from } : {}) }, block]);
  const decodeError = data => { for (const i of [iface, core3Interface, readIface]) { try { const e = i.parseError(data); if (e) return { name: e.name, args: [...e.args].map(x => typeof x === 'bigint' ? x : String(x)) }; } catch {} } return null; };
  /** eth_call a module/core function; never throws: {ok, values} | {ok:false, error:{name,args}, raw}. */
  async function view(name, args, block = 'latest') {
    const data = iface.encodeFunctionData(name, args);
    try { return { ok: true, values: iface.decodeFunctionResult(name, await call(data, lab.core, block)) }; } catch (e) { return { ok: false, error: decodeError(e.data), raw: e.data ?? e.message }; }
  }
  async function read(name, args, block = 'latest') {
    return readIface.decodeFunctionResult(name, await call(readIface.encodeFunctionData(name, args), lab.core, block));
  }
  /** Preflight-decode then mine a module transaction from the lab wallet (or a given raw sender). */
  async function tx(name, args, { sender, expectError } = {}) {
    const data = iface.encodeFunctionData(name, args);
    let values = null, preflight = null;
    try { values = iface.decodeFunctionResult(name, await call(data)); } catch (e) { preflight = decodeError(e.data) ?? { name: 'raw', args: [e.data ?? e.message] }; }
    if (expectError) {
      assert.equal(preflight?.name, expectError, name + ' expected ' + expectError + ' got ' + js(preflight));
      const rejected = await send(data, sender);
      assert.equal(rejected.receipt.status, '0x0', name + ' mined rejection');
      return { rejected: preflight, receipt: rejected.receipt, gasUsed: BigInt(rejected.receipt.gasUsed) };
    }
    assert.equal(preflight, null, name + ' preflight revert: ' + js(preflight));
    const mined = await send(data, sender);
    assert.equal(mined.receipt.status, '0x1', name + ' failed');
    return { values, receipt: mined.receipt, gasUsed: BigInt(mined.receipt.gasUsed), hash: mined.receipt.transactionHash };
  }
  async function send(data, sender, { to = lab.core, gas = TX_GAS, wait = true } = {}) {
    if (!sender) { const t = await lab.send(data, to); return { hash: t.hash, receipt: wait ? await lab.receipt(t, 'index-layer tx') : null }; }
    const n = BigInt(await lab.rpc('eth_getTransactionCount', [sender.address, 'pending']));
    const raw = await sender.signTransaction({ chainId: 31337, nonce: Number(n), gasLimit: gas, gasPrice: 2000000000n, to, data });
    const hash = await lab.rpc('eth_sendRawTransaction', [raw]);
    return { hash, receipt: wait ? await waitReceipt(hash) : null };
  }
  async function waitReceipt(hash) {
    for (let i = 0; i < 400; i++) { const r = await lab.rpc('eth_getTransactionReceipt', [hash]); if (r) return r; await new Promise(ok => setTimeout(ok, 25)); }
    throw new Error('bounded receipt wait');
  }
  async function fundedWallet(seed) { const w = new Wallet(word(seed)); await lab.rpc('anvil_setBalance', [w.address, '0x3635c9adc5dea00000']); return w; }

  const AUTHOR_TYPES = { AuthorIntent: [
    { name: 'publicationHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' },
    { name: 'opCommitment', type: 'bytes32' }, { name: 'byteCommitment', type: 'bytes32' },
    { name: 'executor', type: 'address' }, { name: 'executorCodehash', type: 'bytes32' },
    { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' },
  ] };
  /** Direct author-signed admission (executor = 0): the author's own account
   *  submits any publication straight to Core, bypassing the router's Files
   *  preconditions but NOT the hook (it is inside executeAuthorized). */
  async function directAdmit({ principal, leaves, revisions = [], expectError, pubNonce }) {
    const wallet = auth.authors[principal];
    const pub = publication(leaves, pubNonce ?? auth.pubNonceRef(), { principal, revisions });
    const e = await auth.execution();
    const intent = { opCommitment: ZeroHash, byteCommitment: ZeroHash, executor: ZeroAddress, executorCodehash: ZeroHash, nonce: await auth.authorNonceOf(principal), deadline: await auth.deadline() };
    const signature = await wallet.signTypedData({ name: 'EFS Files Authority', version: '3', chainId: 31337, verifyingContract: lab.core }, AUTHOR_TYPES, { publicationHash: publicationHash(pub), executionSetId: e.executionSetId, ...intent });
    const data = core3Interface.encodeFunctionData('executeAuthorized', [pub, e.revision, intent, signature]);
    let preflight = null;
    try { await call(data, lab.core, 'latest', wallet.address); } catch (err) { preflight = decodeError(err.data) ?? { name: 'raw', args: [err.data ?? err.message] }; }
    if (expectError) { assert.equal(preflight?.name, expectError, 'direct admit expected ' + expectError + ' got ' + js(preflight)); return { rejected: preflight }; }
    assert.equal(preflight, null, 'direct admit preflight revert: ' + js(preflight));
    const mined = await send(data, wallet);
    assert.equal(mined.receipt.status, '0x1', 'direct admit failed');
    return { publication: pub, receipt: mined.receipt, gasUsed: BigInt(mined.receipt.gasUsed), hash: mined.receipt.transactionHash, recordIds: pub.recordIds };
  }
  const callLatest = (to, data) => call(data, to);
  const priors = (principal, dir, name) => latestBindingState(callLatest, lab.core, { principal, purpose: FIXTURE.namePurpose, subject: dir, fieldRole: nameRole(name) });
  /** One-step rebind of a name position to a NEW DirectoryEntry (child may differ): the field-changing rebind. */
  async function rebindName({ principal, dir, name, child, whiteout = false }) {
    const prior = await priors(principal, dir, name);
    const entry = whiteout ? WhiteoutLeaf(dir, name) : DirectoryEntryLeaf(dir, name, child);
    const entryId = ordinaryRecord(entry.typeId, entry.body);
    const b = BindLeaf(FIXTURE.namePurpose, dir, nameRole(name), entryId, prior.prior);
    return { entryId, ...(await directAdmit({ principal, leaves: [entry, b.leaf], revisions: [[1, b.revision]] })) };
  }

  /** Off-chain oracle: for every kind-10 position of a name scope, the bucket
   *  the family SHOULD carry now (null when the head is not a live
   *  DirectoryEntry record). Walks the same rows the contract walks, through the
   *  qualified read surface, so it is independent of the index-layer code. */
  async function oracle(principal, dir, { fieldIndex = 2, limit = Infinity } = {}) {
    const scopeKey = scopeOf(principal, dir);
    const items = [];
    let cursor = 0n, basisOrdinal = 0n;
    for (;;) {
      const [pageResult] = await read('pagePostings', [ZeroHash, 10, 0, scopeKey, { cursor, maxItems: 512, basisOrdinal }]);
      items.push(...pageResult.items);
      if (items.length >= limit) { items.length = Math.min(items.length, limit); break; }
      if (Number(pageResult.completeness) === 1) break;
      assert.equal(Number(pageResult.completeness), 2, 'oracle: kind-10 page PARTIAL with a cursor');
      cursor = pageResult.cursor; basisOrdinal = pageResult.highWaterOrdinal;
    }
    const out = [];
    for (const item of items) {
      const ordinal = BigInt(item);
      const occ = await read('getOccurrenceByOrdinal', [ordinal]);
      const [, body] = await read('getRecord', [occ[2]]);
      const purpose = '0x' + body.slice(2, 66), subject = '0x' + body.slice(66, 130), role = '0x' + body.slice(130, 194);
      const key = bindingKey(principal, purpose, subject, role);
      const [head] = await read('getBindingHead', [key]);
      let bucket = null, targetType = null;
      if (Number(head[0]) === 1 && Number(head[1]) === 1) {
        const [t, tbody] = await read('getRecord', [head[5]]);
        targetType = t;
        if (t === DE) {
          // DirectoryEntry/1: parent REF(32) | name STRING(2+n) | child REF(32) | mountOverride OPTION
          const n = parseInt(tbody.slice(66, 70), 16);
          const fields = ['0x' + tbody.slice(2, 66), '0x' + tbody.slice(66, 70 + 2 * n), '0x' + tbody.slice(70 + 2 * n, 134 + 2 * n)];
          bucket = bucketOf(fields[fieldIndex]);
        }
      }
      out.push({ position: out.length, ordinal, key, headState: Number(head[0]), targetType, bucket });
    }
    return { scopeKey, positions: out };
  }

  return { hook, module, core4, iface, view, read, tx, send, waitReceipt, fundedWallet, directAdmit, rebindName, priors, oracle, call, decodeError, upgradeReceipt: upgraded };
}
