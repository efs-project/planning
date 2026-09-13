#!/usr/bin/env node
// Road B lab — INGRESS x MULTIPLICITY measurement. DISPOSABLE LAB, NO PROTOCOL CLAIM.
// DO NOT RUN without the coordinator's heavy-run lease (README.md, TODO.md).
//
// HONESTY: this run reports receipt diagnostics with explicit remaining gates. It is not a
// same-guarantee comparison and not the protocol's capability ablation. The joined QUOTE/Pair
// consumption (sdk-fixture steps 1–6 with ITEM/PAIR/QUOTE) is NOT in this script yet. The
// Reconstructor is a candidate self-check calling ledger.intentDigest, not independent.
//
// What it does: {native, signed} ingress x {one, two} authors under a lens, on the matched
// 32-byte quote and 41-byte binary controls. Every cell starts from the SAME sealed initial
// state (evm_snapshot after setup; evm_revert + re-snapshot before each cell) through a FRESH
// JsonRpcProvider with caching disabled and explicit block tags. Before any revert, the cell
// record persists every transaction (hash, from, to, nonce, calldata), its receipt (status,
// gasUsed, blockHash, blockNumber, logs) and the raw eth_call return bytes an independent
// checker needs (evidence, admission rows, heads, subjects, control records, posting heads
// and words, Consumer slots). measure.json is written after every cell and on failure.
//
// Usage (after `forge build` into a run-owned FOUNDRY_OUT):
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --anvil
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --rpc URL --deploy
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --rpc URL --addresses <scratch>/lab-addresses.json
// Options: --out <file.json> (default <scratch>/measure.json)  --mnemonic "<12 words>"  --skip-without-index
// Env: FOUNDRY_OUT (artifacts; fallback ./out, read-only), EFS_LAB_SCRATCH (run-owned root; default: parent
// of FOUNDRY_OUT, else the manifest's scratch path), EFS_ETHERS_PATH.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const ETHERS_CANDIDATES = [
  process.env.EFS_ETHERS_PATH,
  '/Users/james/Code/EFS/planning/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers',
  '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers',
].filter(Boolean);
const ethersPath = ETHERS_CANDIDATES.find((p) => existsSync(p));
if (!ethersPath) throw new Error('ethers v6 not found; set EFS_ETHERS_PATH to a node_modules/ethers directory');
const { JsonRpcProvider, HDNodeWallet, ContractFactory, Contract, Interface, AbiCoder, keccak256, hexlify, toBeHex, zeroPadValue, toUtf8Bytes } =
  require(ethersPath);

// ---------------------------------------------------------------- run-owned paths
const root = fileURLToPath(new URL('..', import.meta.url));
const DEFAULT_SCRATCH = '/private/tmp/claude-501/-Users-james-Code-EFS/089e21d8-6171-40d6-9cac-1d2e941506f9/scratchpad/build/lab-b';
const OUT_DIR = process.env.FOUNDRY_OUT ? resolve(process.env.FOUNDRY_OUT) : resolve(root, 'out');
const SCRATCH_ROOT = resolve(process.env.EFS_LAB_SCRATCH || (process.env.FOUNDRY_OUT ? dirname(OUT_DIR) : DEFAULT_SCRATCH));
if (SCRATCH_ROOT === resolve(root) || SCRATCH_ROOT.startsWith(resolve(root) + '/')) {
  throw new Error(`scratch root ${SCRATCH_ROOT} is inside the lab directory; set EFS_LAB_SCRATCH to the run-owned scratch root`);
}
mkdirSync(SCRATCH_ROOT, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]] : [])).filter((x) => x.length));
const MNEMONIC = args.mnemonic || process.env.EFS_LAB_MNEMONIC || 'test test test test test test test test test test test junk';
const OUT_JSON = args.out && args.out !== true ? resolve(args.out) : join(SCRATCH_ROOT, 'measure.json');
const WATCHDOG_MS = 20 * 60 * 1000;
const CAVEAT_JOINED = 'The joined QUOTE/Pair consumption (sdk-fixture steps 1–6 with ITEM/PAIR/QUOTE) is NOT in this script yet.';
const CAVEAT_RECON = 'The Reconstructor is a candidate self-check calling ledger.intentDigest, not independent.';

// ---------------------------------------------------------------- exact payload controls (run-manifest.md)
const FIX = {
  quote3000: { bytes: zeroPadValue(toBeHex(3000n), 32), keccak: '0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552', fixture: 'quote', value: 3000n },
  quote3100: { bytes: zeroPadValue(toBeHex(3100n), 32), keccak: '0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3', fixture: 'quote', value: 3100n },
  file41a: { bytes: hexlify(new Uint8Array(41).fill(0x61)), keccak: '0xe27c263ce61bca70e9ff7d3182fc124c8dcfee2a4656e5c746ceb433a2558911', fixture: 'binary' },
  file41b: { bytes: hexlify(new Uint8Array(41).fill(0x62)), keccak: '0x1882de08a178ebf3827d787e4086d8b2e14a81a8cf3b7b42f2e1458831646f3a', fixture: 'binary' },
};
for (const [label, f] of Object.entries(FIX)) assert.equal(keccak256(f.bytes), f.keccak, `fixture ${label} hash check`);

// ---------------------------------------------------------------- identities (byte-for-byte Keys.sol)
const coder = AbiCoder.defaultAbiCoder();
const DOM = (s) => keccak256(toUtf8Bytes(s));
const ZERO = zeroPadValue('0x00', 32);
const ZERO_ADDR = ZERO.slice(0, 42);
const recordId = (typeId, body) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOM('efs2/record/1'), typeId, keccak256(body)]));
const subjectId = (creatorPrincipal, salt) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOM('efs2/subject/1'), creatorPrincipal, salt]));
const position = (p, s, r) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM('efs2/position/1'), p, s, r]));
const binding = (principal, pos) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOM('efs2/binding/1'), principal, pos]));
const scopeKey = (principal, purpose, subject) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM('efs2/vk/binding-scope/1'), principal, purpose, subject]));
const posting = (typeId, kind, ordinal, valueKey) => keccak256(coder.encode(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [DOM('efs2/pk/1'), typeId, kind, ordinal, valueKey]));
const byTypeList = (typeId) => posting(typeId, 1, 0, ZERO);
const byAuthorList = (principal) => posting(ZERO, 4, 0, principal);
const backlinkList = (target) => posting(ZERO, 5, 0, target);
const historyList = (key) => posting(ZERO, 8, 0, key);
const scopeList = (key) => posting(ZERO, 10, 0, key);
const T = { QUOTE: DOM('lab/type/quote/1'), BINARY: DOM('lab/type/binary/1'), ITEM: DOM('lab/type/item/1'), PAIR: DOM('lab/type/pair/1'), QUOTE_J: DOM('lab/type/quote-joined/1') };
const P = { HEAD: DOM('efs2/purpose/head/1'), FOLDER: DOM('efs2/purpose/folder/1'), TAG: DOM('efs2/purpose/tag/1') };
const name = (s) => keccak256(toUtf8Bytes(s));
const REALM = DOM('lab/realm/1');
const ACTION_T = 'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
const act = (o) => ({ kind: 0, typeId: ZERO, bodyHashOrRecordId: ZERO, purpose: ZERO, subject: ZERO, role: ZERO, target: ZERO, expectedRevision: 0, salt: ZERO, ...o });
const aCreate = (salt) => act({ kind: 5, salt });
const aPublish = (typeId, body) => act({ kind: 1, typeId, bodyHashOrRecordId: keccak256(body) });
const aBind = (purpose, subject, role, target, rev) => act({ kind: 3, purpose, subject, role, target, expectedRevision: rev });
const actionsHash = (actions) => keccak256(coder.encode([ACTION_T], [actions]));
const str = (v) => (typeof v === 'bigint' ? v.toString() : v);
const u256 = (body) => BigInt(body);
const RPC_TIMEOUT_MS = 30_000; // any single RPC await, and any receipt wait, fails loudly after this
const T0 = Date.now();
// Unbuffered progress lines: a hang must be visible in the log at the row it stopped on.
const log = (line) => { process.stdout.write(`[${((Date.now() - T0) / 1000).toFixed(1).padStart(7)}s] ${line}\n`); };
async function withTimeout(promise, ms, label) {
  let timer;
  const bomb = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: no response after ${ms} ms`)), ms); });
  try { return await Promise.race([promise, bomb]); } finally { clearTimeout(timer); }
}
// Poll the receipt ourselves. ethers' waitForTransaction subscribes to "block" events after a first
// receipt check; on an automining node the block can be mined between that check and the
// subscriber's baseline, and the wait then never resolves (the observed hang). On timeout, throw
// with the pending hash, the sender's latest/pending nonces and the node's txpool contents.
async function waitReceipt(provider, hash, label, from) {
  const started = Date.now();
  while (Date.now() - started < RPC_TIMEOUT_MS) {
    const rc = await withTimeout(provider.getTransactionReceipt(hash), RPC_TIMEOUT_MS, `${label}: getTransactionReceipt`);
    if (rc) return rc;
    await new Promise((r) => setTimeout(r, 100));
  }
  const diag = { hash, from };
  try { diag.latestNonce = await provider.getTransactionCount(from, 'latest'); diag.pendingNonce = await provider.getTransactionCount(from, 'pending'); } catch (e) { diag.nonceError = String(e.message); }
  try { diag.txpool = await withTimeout(provider.send('txpool_content', []), 5_000, 'txpool_content'); } catch (e) { diag.txpoolError = String(e.message); }
  try { diag.blockNumber = await provider.getBlockNumber(); } catch {}
  throw new Error(`${label}: receipt for ${hash} not found within ${RPC_TIMEOUT_MS} ms; diagnostics ${JSON.stringify(diag, (k, v) => (typeof v === 'bigint' ? v.toString() : v))}`);
}
// Explicit nonces per sender, re-read from the node ("latest") on first use after every revert
// (each cell has a fresh tracker), so no cached or "pending" nonce can outrun the reverted chain.
function nonceTracker(provider) {
  const cache = new Map();
  return {
    async next(addr) {
      if (!cache.has(addr)) cache.set(addr, await withTimeout(provider.getTransactionCount(addr, 'latest'), RPC_TIMEOUT_MS, 'getTransactionCount'));
      const n = cache.get(addr); cache.set(addr, n + 1); return n;
    },
    forget(addr) { cache.delete(addr); },
  };
}

// ---------------------------------------------------------------- artifacts and interfaces
const ART_SOURCE = { Ledger: 'Ledger', IndexModule: 'IndexModule', LensReader: 'LensReader', TypeRegistry: 'TypeRegistry', MockAcceptor: 'LabHarness', FailingIndexModule: 'LabHarness', Actor: 'LabHarness', Consumer: 'LabHarness', Reconstructor: 'LabHarness' };
const ART = {};
const IFACES = {};
const artifact = (nameOf) => (ART[nameOf] ??= JSON.parse(readFileSync(join(OUT_DIR, `${ART_SOURCE[nameOf]}.sol`, `${nameOf}.json`), 'utf8')));
const iface = (nameOf) => (IFACES[nameOf] ??= new Interface(artifact(nameOf).abi));
const errorSelector = (errName) => iface('Ledger').getError(errName)?.selector ?? null;

// ---------------------------------------------------------------- chain
async function freePort() {
  const srv = createServer();
  await new Promise((res, rej) => { srv.once('error', rej); srv.listen(0, '127.0.0.1', res); });
  const port = srv.address().port;
  await new Promise((res) => srv.close(res));
  return port;
}
let anvil;
const anvilInfo = { spawned: false, pid: null, port: null, cachePath: null, startedAt: null, stoppedAt: null, args: null };
function stopAnvil() {
  if (anvil && anvil.exitCode === null && !anvilInfo.stoppedAt) {
    anvilInfo.stoppedAt = new Date().toISOString();
    anvil.kill('SIGKILL');
  }
}
async function startAnvil() {
  const port = await freePort();
  const cachePath = join(SCRATCH_ROOT, 'anvil-cache'); // run-owned; if the installed anvil rejects --cache-path, record that and drop the flag
  mkdirSync(cachePath, { recursive: true });
  const argv = ['--host', '127.0.0.1', '--port', String(port), '--hardfork', 'cancun', '--chain-id', '31337',
    '--gas-limit', '30000000', '--accounts', '4', '--prune-history', '256', '--cache-path', cachePath, '--no-cors', '--quiet',
    '--mnemonic', MNEMONIC];
  anvil = spawn('anvil', argv, { stdio: 'ignore' });
  Object.assign(anvilInfo, { spawned: true, pid: anvil.pid, port, cachePath, startedAt: new Date().toISOString(), args: argv.filter((a) => a !== MNEMONIC) });
  process.once('exit', stopAnvil);
  process.once('SIGINT', () => { stopAnvil(); process.exit(130); });
  setTimeout(() => { console.error('watchdog: 20 minutes elapsed, killing anvil'); stopAnvil(); process.exit(124); }, WATCHDOG_MS).unref();
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (anvil.exitCode !== null) throw new Error(`anvil exited early (code ${anvil.exitCode}); check --cache-path support`);
    try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(500) }); if ((await r.json()).result === '0x7a69') return url; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('anvil did not start');
}

// A fresh provider per cell: no result cache (cacheTimeout -1), static network, one request per call.
function newProvider(rpc, chainId) {
  return new JsonRpcProvider(rpc, chainId, { staticNetwork: true, cacheTimeout: -1, batchMaxCount: 1 });
}
function makeCtx(rpc, chainId, addrs) {
  const provider = newProvider(rpc, chainId);
  const wallets = [0, 1, 2, 3].map((i) => HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0/${i}`).connect(provider));
  const deployer = wallets[0];
  const at = (nameOf, addr) => new Contract(addr, artifact(nameOf).abi, deployer);
  const ctx = { rpc, chainId, provider, wallets, deployer, addrs, txs: [], raw: [], rowLog: [], consumerChecks: [], mismatches: 0, nonces: nonceTracker(provider), persist: null };
  for (const [key, nameOf] of Object.entries({ ledger: 'Ledger', index: 'IndexModule', lens: 'LensReader', registry: 'TypeRegistry', acceptor: 'MockAcceptor', failingIndex: 'FailingIndexModule', actorA: 'Actor', actorB: 'Actor', consumer: 'Consumer', recon: 'Reconstructor' })) {
    ctx[key] = at(nameOf, addrs[key]);
  }
  return ctx;
}

// ---------------------------------------------------------------- transactions: full evidence per tx
async function send(ctx, txFactory, label, expectFail = false) {
  const from = ctx.deployer.address;
  const nonce = await ctx.nonces.next(from);
  log(`  tx   ${label} (nonce ${nonce}) sending`);
  let tx;
  try {
    tx = await withTimeout(txFactory({ nonce }), RPC_TIMEOUT_MS, `${label}: sendTransaction`);
  } catch (e) {
    ctx.nonces.forget(from); // nothing reached the chain; re-read the nonce on the next use
    throw e;
  }
  const rc = await waitReceipt(ctx.provider, tx.hash, label, from);
  const full = await withTimeout(ctx.provider.getTransaction(tx.hash), RPC_TIMEOUT_MS, `${label}: getTransaction`);
  const record = {
    label, hash: tx.hash, from: full.from, to: full.to, nonce: full.nonce, data: full.data, gasLimit: str(full.gasLimit),
    receipt: { status: rc.status, gasUsed: str(rc.gasUsed), blockHash: rc.blockHash, blockNumber: rc.blockNumber, transactionIndex: rc.index,
      logs: rc.logs.map((l) => ({ address: l.address, topics: [...l.topics], data: l.data, index: l.index })) },
  };
  ctx.txs.push(record);
  const row = { label, gas: str(rc.gasUsed), status: rc.status, hash: tx.hash, block: rc.blockNumber, txIndex: ctx.txs.length - 1 };
  ctx.rowLog.push(row);
  log(`  tx   ${label}: block ${rc.blockNumber} gas ${rc.gasUsed} status ${rc.status}`);
  if (ctx.persist) ctx.persist();
  if (!expectFail) assert.equal(rc.status, 1, `${label}: reverted`);
  else assert.equal(rc.status, 0, `${label}: expected a revert`);
  return row;
}
const FAIL_GAS = { gasLimit: 3_000_000n };

// ---------------------------------------------------------------- raw getter bytes (what an independent checker replays)
async function raw(ctx, nameOf, key, fn, fnArgs, blockTag) {
  const to = ctx.addrs[key];
  const data = iface(nameOf).encodeFunctionData(fn, fnArgs);
  const returnData = await ctx.provider.call({ to, data, blockTag });
  ctx.raw.push({ contract: nameOf, to, fn, args: fnArgs.map(str), blockTag, calldata: data, returnData });
  return iface(nameOf).decodeFunctionResult(fn, returnData);
}
const CONSUMER_SLOTS = ['lastStatus', 'lastTarget', 'lastRevision', 'lastAdmission', 'lastCount', 'lastScanned', 'lastValue'];
async function consumerSlots(ctx, blockTag) {
  const out = {};
  for (const s of CONSUMER_SLOTS) out[s] = str((await raw(ctx, 'Consumer', 'consumer', s, [], blockTag))[0]);
  return out;
}
async function harvest(ctx, touched, blockTag) {
  const h = { blockTag, controls: {}, records: {}, publications: {}, subjects: {}, heads: {}, lists: {}, consumer: null, counts: null, nonces: {} };
  for (const [label, f] of Object.entries(FIX)) {
    const t = f.fixture === 'quote' ? T.QUOTE : T.BINARY;
    const id = recordId(t, f.bytes);
    const r = await raw(ctx, 'Ledger', 'ledger', 'record', [id], blockTag);
    h.controls[label] = { recordId: id, typeId: t, firstAdmission: str(r[1]), occurrences: str(r[2]), bodyLength: (r[3].length - 2) / 2 };
  }
  for (const id of new Set(touched.records)) {
    const r = await raw(ctx, 'Ledger', 'ledger', 'record', [id], blockTag);
    h.records[id] = { typeId: r[0], firstAdmission: str(r[1]), occurrences: str(r[2]) };
  }
  for (const pub of new Set(touched.publications.map(str))) {
    const e = await raw(ctx, 'Ledger', 'ledger', 'evidence', [pub], blockTag);
    const first = Number(e[4]); const leafCount = Number(e[3]);
    const admissions = [];
    for (let i = 0; i < leafCount; i++) {
      const a = await raw(ctx, 'Ledger', 'ledger', 'admission', [first + i], blockTag);
      admissions.push({ ordinal: first + i, kind: str(a[0]), leaf: str(a[1]), publication: str(a[2]), bindingOrdinal: str(a[3]), expectedRevision: str(a[4]), withdrawn: a[5], a: a[6], b: a[7] });
    }
    h.publications[pub] = { author: e[0], proofKind: str(e[1]), v: str(e[2]), leafCount, firstAdmission: first, r: e[5], s: e[6], nonce: str(e[7]), deadline: str(e[8]), basis: str(e[9]), acceptanceProfile: e[10], indexObligations: e[11], actionsHash: e[12], admissions };
  }
  for (const s of new Set(touched.subjects)) h.subjects[s] = str((await raw(ctx, 'Ledger', 'ledger', 'subjectCreatedAt', [s], blockTag))[0]);
  for (const k of new Set(touched.bindingKeys)) {
    const hd = await raw(ctx, 'Ledger', 'ledger', 'head', [k], blockTag);
    h.heads[k] = { state: str(hd[0]), revision: str(hd[1]), admission: str(hd[2]), previous: str(hd[3]), bindingOrdinal: str(hd[4]), target: hd[5] };
  }
  for (const k of new Set(touched.lists)) {
    const ph = await raw(ctx, 'IndexModule', 'index', 'postingHead', [k], blockTag);
    const count = Number(ph[0]);
    const words = [];
    for (let i = 0; i < Math.ceil(count / 5); i++) words.push(str((await raw(ctx, 'IndexModule', 'index', 'postingWord', [k, i], blockTag))[0]));
    h.lists[k] = { count, live: str(ph[1]), last: str(ph[2]), flags: str(ph[3]), words };
  }
  const c = await raw(ctx, 'Ledger', 'ledger', 'counts', [], blockTag);
  h.counts = { admissions: str(c[0]), records: str(c[1]), bindings: str(c[2]), publications: str(c[3]) };
  for (const a of new Set(touched.authors)) h.nonces[a] = str((await raw(ctx, 'Ledger', 'ledger', 'nonces', [a], blockTag))[0]);
  h.consumer = await consumerSlots(ctx, blockTag);
  return h;
}

// ---------------------------------------------------------------- authors: native (Actor contract) and signed (EOA wallet)
async function signedCall(ctx, wallet, actions, bodies, txOverrides = {}, overrides = {}) {
  const block = await ctx.provider.getBlock('latest');
  const ledger = ctx.ledger;
  const intent = {
    realmId: await ledger.realmId(), coreCodeCommitment: await ledger.coreCodeCommitment(), author: wallet.address,
    nonce: await ledger.nonces(wallet.address), deadline: BigInt(block.timestamp + 3600),
    acceptanceProfile: await ledger.acceptanceProfileOf(actions), indexObligations: await ledger.indexObligations(), ...overrides,
  };
  const types = { PublicationIntent: ['realmId:bytes32', 'coreCodeCommitment:bytes32', 'author:address', 'nonce:uint64', 'deadline:uint64', 'acceptanceProfile:bytes32', 'indexObligations:bytes32', 'actionsHash:bytes32'].map((f) => { const [n, t] = f.split(':'); return { name: n, type: t }; }) };
  const sig = await wallet.signTypedData({ name: 'EFS2-RoadB-Lab', version: '1' }, types, { ...intent, actionsHash: actionsHash(actions) });
  return ledger.executeSigned(intent, actions, bodies, sig, txOverrides);
}
function authorsFor(ctx) {
  const native = (actor, address) => ({ address, kind: 'native', run: (actions, bodies, o = {}) => actor.execute(actions, bodies, o) });
  const signed = (wallet) => ({ address: wallet.address, kind: 'signed', run: (actions, bodies, o = {}) => signedCall(ctx, wallet, actions, bodies, o) });
  return { nativeA: native(ctx.actorA, ctx.addrs.actorA), nativeB: native(ctx.actorB, ctx.addrs.actorB), signedA: signed(ctx.wallets[1]), signedB: signed(ctx.wallets[2]) };
}

// ---------------------------------------------------------------- sealed state: snapshot/revert and pre/post probes
const headOf = (h) => ({ count: str(h[0]), live: str(h[1]), last: str(h[2]), flags: str(h[3]) });
async function stateProbe(ctx, authors, typeId, folder, blockTag) {
  const { ledger, index } = ctx;
  const probe = { blockTag, controls: {}, counts: {}, nonces: {}, scopeHeads: {}, byAuthorHeads: {}, byTypeHead: null, consumer: null };
  for (const [label, f] of Object.entries(FIX)) {
    const t = f.fixture === 'quote' ? T.QUOTE : T.BINARY;
    const id = recordId(t, f.bytes);
    const r = await ledger.record(id, { blockTag });
    probe.controls[label] = { recordId: id, typeId: t, firstAdmission: str(r[1]), occurrences: str(r[2]), present: r[1] !== 0n };
  }
  const c = await ledger.counts({ blockTag });
  probe.counts = { admissions: str(c[0]), records: str(c[1]), bindings: str(c[2]), publications: str(c[3]) };
  for (const a of authors) {
    if (!a) continue;
    const pid = await ledger.principalOf(a.address, { blockTag });
    probe.nonces[a.address] = str(await ledger.nonces(a.address, { blockTag }));
    probe.scopeHeads[a.address] = headOf(await index.postingHead(scopeList(scopeKey(pid, P.FOLDER, folder)), { blockTag }));
    probe.byAuthorHeads[a.address] = headOf(await index.postingHead(byAuthorList(pid), { blockTag }));
  }
  probe.byTypeHead = headOf(await index.postingHead(byTypeList(typeId), { blockTag }));
  probe.consumer = await consumerSlots(ctx, blockTag);
  return probe;
}
const stripBlock = (probe) => { const { blockTag, ...rest } = probe; return rest; };
function assertSealed(probe, label) {
  for (const [k, v] of Object.entries(probe.controls)) assert.equal(v.present, false, `${label}: sealed state must not contain control record ${k}`);
}
async function sealedCell(run, label, typeId, folder, fn) {
  // fresh provider per cell so no cached read survives the revert
  const ctx = makeCtx(run.rpc, run.chainId, run.addrs);
  log(`cell ${label}: evm_revert to ${run.sealed}`);
  assert.equal(await withTimeout(ctx.provider.send('evm_revert', [run.sealed]), RPC_TIMEOUT_MS, `${label}: evm_revert`), true, `${label}: evm_revert failed`);
  run.sealed = await withTimeout(ctx.provider.send('evm_snapshot', []), RPC_TIMEOUT_MS, `${label}: evm_snapshot`); // single-use: re-seal
  const afterRevert = await withTimeout(ctx.provider.getBlock('latest'), RPC_TIMEOUT_MS, `${label}: getBlock`);
  const nonceLatest = await ctx.provider.getTransactionCount(ctx.deployer.address, 'latest');
  const noncePending = await ctx.provider.getTransactionCount(ctx.deployer.address, 'pending');
  let automine = null;
  try { automine = await withTimeout(ctx.provider.send('anvil_getAutomine', []), 5_000, 'anvil_getAutomine'); } catch (e) { automine = `unavailable: ${e.message}`; }
  if (automine === false) { await ctx.provider.send('evm_setAutomine', [true]); automine = 're-enabled'; }
  log(`cell ${label}: after revert block ${afterRevert.number} ${afterRevert.hash} nonce latest ${nonceLatest} pending ${noncePending} automine ${automine}; re-sealed as ${run.sealed}`);
  assert.equal(nonceLatest, noncePending, `${label}: pending pool is not empty after revert`);
  const authors = authorsFor(ctx);
  const cellAuthors = fn.authors(authors);
  const pre = await stateProbe(ctx, cellAuthors, typeId, folder, afterRevert.number);
  assertSealed(pre, label);
  const touched = { records: [], publications: [], subjects: [], bindingKeys: [], lists: [byTypeList(typeId)], authors: cellAuthors.filter(Boolean).map((a) => a.address) };
  const cell = { label, sealedSnapshot: run.sealed, afterRevert: { blockNumber: afterRevert.number, blockHash: afterRevert.hash, nonceLatest, noncePending, automine }, pre, rows: null, rowLog: ctx.rowLog, post: null, harvest: null, transactions: ctx.txs, raw: ctx.raw, consumerChecks: ctx.consumerChecks, mismatches: 0, error: null };
  run.report.cells[label] = cell;
  ctx.persist = () => persist(run.report); // every mined transaction lands on disk before the next step
  persist(run.report);
  try {
    log(`cell ${label}: body`);
    cell.rows = await fn.body(ctx, authors, touched);
    const last = await withTimeout(ctx.provider.getBlock('latest'), RPC_TIMEOUT_MS, `${label}: getBlock`);
    log(`cell ${label}: post probe + raw harvest at block ${last.number}`);
    cell.post = await stateProbe(ctx, cellAuthors, typeId, folder, last.number);
    cell.harvest = await harvest(ctx, touched, last.number); // persisted BEFORE the next cell's evm_revert
    log(`cell ${label}: done (${ctx.txs.length} txs, ${ctx.raw.length} raw reads, ${ctx.mismatches} read-back mismatches)`);
  } catch (e) {
    log(`cell ${label}: FAILED ${e.message}`);
    cell.error = { message: String(e.message), stack: String(e.stack).split('\n').slice(0, 6) };
    throw e;
  } finally {
    cell.transactions = ctx.txs;
    cell.raw = ctx.raw;
    cell.consumerChecks = ctx.consumerChecks;
    cell.mismatches = ctx.mismatches;
    persist(run.report);
  }
  return cell;
}
function persist(report) {
  report.persistedAt = new Date().toISOString();
  report.anvil = { ...anvilInfo };
  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
}

// ---------------------------------------------------------------- consumer read-back: actual stored values vs expected
async function consumerCheck(ctx, row, expected) {
  const actual = await consumerSlots(ctx, row.block);
  const compared = {};
  let match = true;
  const norm = (v) => (typeof v === 'string' ? v.toLowerCase() : String(v));
  for (const [k, v] of Object.entries(expected)) { const equal = norm(v) === norm(actual[k]); compared[k] = { expected: norm(v), actual: norm(actual[k]), equal }; if (!equal) match = false; }
  if (!match) ctx.mismatches++;
  const check = { label: `${row.label}/readback`, block: row.block, expected: Object.fromEntries(Object.entries(expected).map(([k, v]) => [k, norm(v)])), actual, compared, match };
  ctx.consumerChecks.push(check);
  log(`  chk  ${check.label}: ${match ? 'match' : 'MISMATCH ' + JSON.stringify(compared)}`);
  return check;
}

// ---------------------------------------------------------------- the ingress x multiplicity cells
function matrixCell(cellName, fixture, pick) {
  return {
    authors: (a) => pick(a),
    body: async (ctx, a, touched) => {
      const [primary, secondary] = pick(a);
      return runCell(ctx, cellName, fixture, primary, secondary, touched);
    },
  };
}
async function runCell(ctx, cellName, fixture, primary, secondary, touched, opts = {}) {
  const { ledger, consumer, lens, recon } = ctx;
  const rows = [];
  const f1 = fixture === 'quote' ? FIX.quote3000 : FIX.file41a;
  const f2 = fixture === 'quote' ? FIX.quote3100 : FIX.file41b;
  const typeId = fixture === 'quote' ? T.QUOTE : T.BINARY;
  const salt = keccak256(toUtf8Bytes(`${cellName}/${fixture}`));
  const pidP = await ledger.principalOf(primary.address);
  const subj = subjectId(pidP, salt); // origin-qualified for contract authors
  const folder = name(`/${cellName}/${fixture}`);
  const nameHash = name('entry');
  const r1 = recordId(typeId, f1.bytes); const r2 = recordId(typeId, f2.bytes);
  const headPos = position(P.HEAD, subj, ZERO); const placePos = position(P.FOLDER, folder, nameHash);
  touched.records.push(r1, r2); touched.subjects.push(subj);
  const track = async (a) => {
    const pid = await ledger.principalOf(a.address);
    touched.bindingKeys.push(binding(pid, headPos), binding(pid, placePos));
    touched.lists.push(historyList(binding(pid, headPos)), historyList(binding(pid, placePos)), scopeList(scopeKey(pid, P.FOLDER, folder)), byAuthorList(pid));
  };
  await track(primary);
  touched.lists.push(backlinkList(r1), backlinkList(r2), backlinkList(subj));
  // create = one logical action: subject + record + head + placement
  rows.push(await send(ctx, (o) => primary.run([aCreate(salt), aPublish(typeId, f1.bytes), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], ['0x', f1.bytes, '0x', '0x'], o), `${cellName}/${fixture}/create`));
  const pub = (await ledger.counts())[3];
  touched.publications.push(pub);
  const rec = await recon.reconstruct(ctx.addrs.ledger, pub);
  rows.push({ label: `${cellName}/${fixture}/reconstruct-create`, publication: str(pub), matches: rec[4], recovered: rec[3], status: 'eth_call', note: CAVEAT_RECON });
  // edit = fresh body + CAS head rebind
  rows.push(await send(ctx, (o) => primary.run([aPublish(typeId, f2.bytes), aBind(P.HEAD, subj, ZERO, r2, 1)], [f2.bytes, '0x'], o), `${cellName}/${fixture}/edit`));
  touched.publications.push((await ledger.counts())[3]);
  let lensArr = [primary.address];
  if (secondary) {
    await track(secondary);
    rows.push(await send(ctx, (o) => secondary.run([aPublish(typeId, f1.bytes), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], [f1.bytes, '0x', '0x'], o), `${cellName}/${fixture}/create-competing`));
    touched.publications.push((await ledger.counts())[3]);
    lensArr = [primary.address, secondary.address];
  }
  // paid consumer reads (receipt gas, not eth_call), each read back and compared
  let row;
  if (fixture === 'quote') {
    row = await send(ctx, (o) => consumer.readQuote(lensArr, P.HEAD, subj, ZERO, o), `${cellName}/${fixture}/read-resolve`);
    await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r2, lastRevision: 2, lastValue: f2.value });
  } else {
    row = await send(ctx, (o) => consumer.readHead(lensArr, P.HEAD, subj, ZERO, o), `${cellName}/${fixture}/read-resolve`);
    await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r2, lastRevision: 2 });
  }
  rows.push(row);
  if (secondary) {
    row = await send(ctx, (o) => consumer.readHead([secondary.address, primary.address], P.HEAD, subj, ZERO, o), `${cellName}/${fixture}/read-resolve-second-first`);
    await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r1, lastRevision: 1 });
    rows.push(row);
  }
  const est = await lens.resolve.estimateGas(lensArr, P.HEAD, subj, ZERO);
  rows.push({ label: `${cellName}/${fixture}/eth_call-resolve-estimate`, gas: est.toString(), status: 'estimate' });
  if (opts.noIndex) return rows; // without the module, list/history are UNKNOWN by construction (not measured as reads)
  row = await send(ctx, (o) => consumer.readList(lensArr, P.FOLDER, folder, 16, o), `${cellName}/${fixture}/read-list`);
  await consumerCheck(ctx, row, { lastStatus: 2, lastCount: 1, lastScanned: secondary ? 2 : 1 }); // the shared name is ONE selected entry
  rows.push(row);
  row = await send(ctx, (o) => consumer.readHistory(primary.address, headPos, 1_000_000, o), `${cellName}/${fixture}/read-history-asof`);
  await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r2, lastRevision: 2 });
  rows.push(row);
  return rows;
}

// ---------------------------------------------------------------- freshness controls (sealed cell)
const freshnessCell = {
  authors: (a) => [a.nativeA, null],
  body: async (ctx, a, touched) => {
    const { ledger, actorA } = ctx;
    const rows = [];
    const body = FIX.quote3000.bytes;
    const id = recordId(T.QUOTE, body);
    touched.records.push(id);
    const pid = await ledger.principalOf(a.nativeA.address);
    touched.lists.push(byAuthorList(pid));
    const before = await ledger.record(id);
    assert.equal(before[1], 0n, 'pre-absence: the exact Record must not exist yet');
    rows.push({ label: 'pre-absence proof', recordId: id, firstAdmission: str(before[1]), occurrences: str(before[2]), block: await ctx.provider.getBlockNumber(), proof: 'eth_call record(id).firstAdmission == 0 at the block before the write' });
    rows.push(await send(ctx, (o) => actorA.publish(T.QUOTE, body, o), 'contract-fresh-body (Actor.publish quote3000, proved absent just before)'));
    touched.publications.push((await ledger.counts())[3]);
    const mid = await ledger.record(id);
    assert.notEqual(mid[1], 0n, 'pre-presence: the exact Record must exist now');
    rows.push({ label: 'pre-presence proof', recordId: id, firstAdmission: str(mid[1]), occurrences: str(mid[2]), block: await ctx.provider.getBlockNumber(), proof: 'eth_call record(id).firstAdmission != 0 and occurrences == 1 at the block before the write' });
    rows.push(await send(ctx, (o) => actorA.publish(T.QUOTE, body, o), 'contract-existing-body (same bytes: new occurrence, no new Record)'));
    touched.publications.push((await ledger.counts())[3]);
    const after = await ledger.record(id);
    rows.push({ label: 'post-presence', recordId: id, firstAdmission: str(after[1]), occurrences: str(after[2]) });
    const b777 = zeroPadValue(toBeHex(777n), 32);
    touched.records.push(recordId(T.QUOTE, b777));
    const actions = [aPublish(T.QUOTE, b777)];
    const nonce = await ledger.nonces(a.nativeA.address);
    rows.push(await send(ctx, (o) => actorA.executeWithNonce(actions, [b777], nonce, o), 'batch under explicit nonce'));
    touched.publications.push((await ledger.counts())[3]);
    rows.push(await failureRow(ctx, 'exact-operation retry (reverts AlreadyAdmitted)', actorA, 'executeWithNonce', [actions, [b777], nonce], 'AlreadyAdmitted', [[a.nativeA], T.QUOTE, name('/none')]));
    return rows;
  },
};

// A failure row: capture the revert selector with a static call, mine the reverting transaction,
// and prove the state probe is unchanged across it.
async function failureRow(ctx, label, contract, fn, fnArgs, expectedErrorName, probeArgs) {
  const [authors, typeId, folder] = probeArgs;
  const preBlock = await ctx.provider.getBlockNumber();
  const pre = await stateProbe(ctx, authors, typeId, folder, preBlock);
  const expectedSelector = errorSelector(expectedErrorName);
  let observedSelector = null;
  let observedData = null;
  log(`  row  ${label}: static call for the revert selector`);
  try {
    await withTimeout(contract[fn].staticCall(...fnArgs), RPC_TIMEOUT_MS, `${label}: staticCall`);
    observedSelector = 'no-revert';
  } catch (e) {
    observedData = e.data ?? e.info?.error?.data ?? null;
    observedSelector = typeof observedData === 'string' ? observedData.slice(0, 10) : String(observedData);
  }
  const row = await send(ctx, (o) => contract[fn](...fnArgs, { ...o, ...FAIL_GAS }), label, true);
  const post = await stateProbe(ctx, authors, typeId, folder, row.block);
  const unchanged = JSON.stringify(stripBlock(pre)) === JSON.stringify(stripBlock(post));
  return { ...row, expectedError: expectedErrorName, expectedSelector, observedSelector, observedRevertData: observedData, selectorMatch: observedSelector === expectedSelector, stateUnchanged: unchanged, pre, post };
}

// ---------------------------------------------------------------- failure rows (sealed cell)
const failureCell = {
  authors: (a) => [a.nativeA, null],
  body: async (ctx, a, touched) => {
    const { ledger, actorA, acceptor } = ctx;
    const probe = [[a.nativeA], T.PAIR, name('/none')];
    const rows = [];
    const items = [zeroPadValue(toBeHex(1n), 32), zeroPadValue(toBeHex(2n), 32)];
    rows.push(await send(ctx, (o) => actorA.publish(T.ITEM, items[0], o), 'ITEM_ETH'));
    rows.push(await send(ctx, (o) => actorA.publish(T.ITEM, items[1], o), 'ITEM_USDC'));
    const ids = items.map((b) => recordId(T.ITEM, b));
    touched.records.push(...ids);
    const pair = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], ids[1], 1n]);
    rows.push(await send(ctx, (o) => actorA.publish(T.PAIR, pair, o), 'PAIR_ETH_USDC (two checked refs)'));
    touched.records.push(recordId(T.PAIR, pair));
    // a PRESENT wrong-Type target: admit a QUOTE record first and assert it exists
    const q99 = zeroPadValue(toBeHex(99n), 32);
    const wrongId = recordId(T.QUOTE, q99);
    rows.push(await send(ctx, (o) => actorA.publish(T.QUOTE, q99, o), 'setup: admit a QUOTE record as the present wrong-Type target'));
    const present = await ledger.record(wrongId);
    assert.notEqual(present[1], 0n, 'wrong-Type target must be present');
    rows.push({ label: 'wrong-Type target presence', recordId: wrongId, typeId: T.QUOTE, firstAdmission: str(present[1]) });
    touched.records.push(wrongId);
    const wrong = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], wrongId, 1n]);
    rows.push(await failureRow(ctx, 'checked ref: wrong Type (present target of another Type)', actorA, 'publish', [T.PAIR, wrong], 'E_REF_TYPE', probe));
    const missing = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], name('nowhere'), 1n]);
    rows.push(await failureRow(ctx, 'checked ref: missing target', actorA, 'publish', [T.PAIR, missing], 'E_REF_MISSING', probe));
    const pid = await ledger.principalOf(a.nativeA.address);
    const key = binding(pid, position(P.HEAD, name('x'), ZERO));
    touched.bindingKeys.push(key); touched.lists.push(historyList(key), backlinkList(ids[0]));
    rows.push(await send(ctx, (o) => actorA.bind(P.HEAD, name('x'), ZERO, ids[0], 0, o), 'setup: bind (revision becomes 1)'));
    rows.push(await failureRow(ctx, 'stale CAS (expected 0, head is 1)', actorA, 'bind', [P.HEAD, name('x'), ZERO, ids[0], 0], 'E_CAS', probe));
    rows.push(await send(ctx, (o) => acceptor.set(1, 0, o), 'setup: acceptor rejects'));
    rows.push(await failureRow(ctx, 'failed acceptance (whole publication reverts)', actorA, 'publish', [T.QUOTE, zeroPadValue(toBeHex(5n), 32)], 'E_REJECTED', probe));
    rows.push(await send(ctx, (o) => acceptor.set(0, 0, o), 'setup: acceptor accepts'));
    rows.push(await send(ctx, (o) => ledger.setIndexModule(ctx.addrs.failingIndex, o), 'setup: attach the always-refusing index module'));
    rows.push(await failureRow(ctx, 'failed mandatory index (whole publication reverts)', actorA, 'publish', [T.QUOTE, zeroPadValue(toBeHex(6n), 32)], 'E_INDEX', probe));
    rows.push(await send(ctx, (o) => ledger.setIndexModule(ctx.addrs.index, o), 'setup: re-attach the index module'));
    for (const pubN of [1, 2, 3, 4, 5]) touched.publications.push(pubN);
    return rows;
  },
};

// ---------------------------------------------------------------- deployment (once, then addresses only)
async function deployAll(ctx0) {
  const { provider, deployer } = ctx0;
  const nonces = nonceTracker(provider);
  const dep = async (nameOf, ...ctor) => {
    const a = artifact(nameOf);
    const nonce = await nonces.next(deployer.address);
    log(`deploy ${nameOf} (nonce ${nonce})`);
    const c = await withTimeout(new ContractFactory(a.abi, a.bytecode.object, deployer).deploy(...ctor, { nonce }), RPC_TIMEOUT_MS, `deploy ${nameOf}`);
    const rc = await waitReceipt(provider, c.deploymentTransaction().hash, `deploy ${nameOf}`, deployer.address);
    assert.equal(rc.status, 1, `deploy ${nameOf}: reverted`);
    log(`deploy ${nameOf}: ${await c.getAddress()} block ${rc.blockNumber} gas ${rc.gasUsed}`);
    return { c, address: await c.getAddress(), gas: str(rc.gasUsed), runtimeBytes: ((await provider.getCode(await c.getAddress())).length - 2) / 2 };
  };
  const d = {};
  d.registry = await dep('TypeRegistry');
  d.acceptor = await dep('MockAcceptor');
  d.ledger = await dep('Ledger', d.registry.address, REALM);
  d.index = await dep('IndexModule', d.ledger.address);
  d.failingIndex = await dep('FailingIndexModule');
  d.lens = await dep('LensReader', d.ledger.address, d.index.address);
  d.actorA = await dep('Actor', d.ledger.address);
  d.actorB = await dep('Actor', d.ledger.address);
  d.consumer = await dep('Consumer', d.lens.address);
  d.recon = await dep('Reconstructor');
  const addrs = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.address]));
  const ctx = makeCtx(ctx0.rpc, ctx0.chainId, addrs);
  const setup = [];
  setup.push(await send(ctx, (o) => ctx.ledger.setIndexModule(addrs.index, o), 'setup: attach index module'));
  setup.push(await send(ctx, (o) => ctx.registry.register(T.QUOTE, addrs.acceptor, [], o), 'setup: register QUOTE'));
  setup.push(await send(ctx, (o) => ctx.registry.register(T.BINARY, ZERO_ADDR, [], o), 'setup: register BINARY'));
  setup.push(await send(ctx, (o) => ctx.registry.register(T.ITEM, ZERO_ADDR, [], o), 'setup: register ITEM'));
  setup.push(await send(ctx, (o) => ctx.registry.register(T.PAIR, addrs.acceptor, [T.ITEM, T.ITEM], o), 'setup: register PAIR'));
  setup.push(await send(ctx, (o) => ctx.registry.register(T.QUOTE_J, addrs.acceptor, [T.PAIR], o), 'setup: register QUOTE_J (one checked Pair ref)'));
  return { addrs, deployment: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, { address: v.address, gas: v.gas, runtimeBytes: v.runtimeBytes }])), setup, setupTransactions: ctx.txs };
}

async function main() {
  const t0 = Date.now();
  const rpc = args.anvil ? await startAnvil() : args.rpc || 'http://127.0.0.1:8545';
  log(`rpc ${rpc}; artifacts ${OUT_DIR}; scratch ${SCRATCH_ROOT}; report ${OUT_JSON}`);
  const probeProvider = new JsonRpcProvider(rpc, undefined, { staticNetwork: true, cacheTimeout: -1 });
  const chainId = Number((await probeProvider.getNetwork()).chainId);
  const report = {
    profile: 'road-b-lab/1', claim: 'disposable lab, no protocol claim',
    honesty: 'This run reports receipt diagnostics with explicit remaining gates. It is not a same-guarantee comparison and not the capability ablation.',
    experiment: 'ingress x multiplicity: {native, signed} x {one, two authors under a lens}. NOT the protocol capability ablation (neither/authorship/selection/both), which is a later gate.',
    remainingGates: [CAVEAT_JOINED, CAVEAT_RECON],
    capabilityAblation: { unknown: 'not run: the neither/authorship/selection/both counterfactuals need same-guarantee arms that remove one capability each; this lab has one arm', consequence: 'no representation-vs-feature attribution and no interaction term can be claimed from this run' },
    rpc, chainId, node: process.version, evm: 'cancun', compiler: '0.8.30 (verify from out/ metadata)', optimizerRuns: 200, viaIR: true,
    paths: { artifacts: OUT_DIR, scratchRoot: SCRATCH_ROOT, outJson: OUT_JSON },
    providerPolicy: 'fresh JsonRpcProvider per cell (cacheTimeout -1, staticNetwork, batchMaxCount 1); probes and raw harvests pass explicit block tags',
    startedAt: new Date(t0).toISOString(), anvil: anvilInfo, deployment: null, setup: [], setupTransactions: [], sealedInitialState: null, cells: {}, estimatedFreshSlots: {}, failure: null,
    caveats: [
      'Local Anvil receipts under the lab profile; not an L2 fee quote and not an equivalent-guarantee comparison until the coordinator\'s fixture map is applied.',
      'Ingress x multiplicity only; no capability ablation and no interaction term are claimed.',
      CAVEAT_JOINED,
      CAVEAT_RECON,
      'Fresh-slot counts are estimates; no storage tracing was run.',
      'Every cell starts from the sealed post-setup state (cold transaction access sets; lists empty except setup); "steady" list regimes are not measured here.',
      'A listing page with mutated == true is a mixed-basis page and must not be treated as COMPLETE by any caller.',
    ],
  };
  const run = { rpc, chainId, addrs: null, sealed: null, report };
  try {
    if (args.addresses) {
      run.addrs = JSON.parse(readFileSync(args.addresses, 'utf8'));
    } else {
      const wallets0 = [0].map((i) => HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0/${i}`).connect(probeProvider));
      const d = await deployAll({ rpc, chainId, provider: probeProvider, deployer: wallets0[0] });
      run.addrs = d.addrs;
      report.deployment = d.deployment;
      report.setup = d.setup;
      report.setupTransactions = d.setupTransactions;
      const addressesPath = join(SCRATCH_ROOT, 'lab-addresses.json'); // run-owned, never inside the lab directory
      writeFileSync(addressesPath, JSON.stringify(run.addrs, null, 2));
      report.paths.addresses = addressesPath;
    }
    run.sealed = await withTimeout(probeProvider.send('evm_snapshot', []), RPC_TIMEOUT_MS, 'evm_snapshot');
    const sealedBlock = await probeProvider.getBlock('latest');
    log(`sealed initial state: snapshot ${run.sealed} at block ${sealedBlock.number} ${sealedBlock.hash}`);
    report.sealedInitialState = { snapshot: run.sealed, blockNumber: sealedBlock.number, blockHash: sealedBlock.hash, rule: 'evm_revert to the sealed snapshot, then re-snapshot, before every cell through a fresh provider; pre/post probes and raw harvests recorded per cell before the next revert' };
    persist(report);
    const cells = { 'native-one': (a) => [a.nativeA, null], 'signed-one': (a) => [a.signedA, null], 'native-two': (a) => [a.nativeA, a.nativeB], 'signed-two': (a) => [a.signedA, a.signedB] };
    for (const fixture of ['quote', 'binary']) {
      for (const [cell, pick] of Object.entries(cells)) {
        const typeId = fixture === 'quote' ? T.QUOTE : T.BINARY;
        await sealedCell(run, `${cell}/${fixture}`, typeId, name(`/${cell}/${fixture}`), matrixCell(cell, fixture, pick));
      }
    }
    await sealedCell(run, 'freshness-controls', T.QUOTE, name('/none'), freshnessCell);
    await sealedCell(run, 'failure-rows', T.PAIR, name('/none'), failureCell);
    if (!args['skip-without-index']) {
      await sealedCell(run, 'native-one-noindex/quote', T.QUOTE, name('/native-one-noindex/quote'), {
        authors: (a) => [a.nativeA, null],
        body: async (ctx, a, touched) => {
          const rows = [await send(ctx, (o) => ctx.ledger.setIndexModule(ZERO_ADDR, o), 'setup: detach index module')];
          rows.push(...(await runCell(ctx, 'native-one-noindex', 'quote', a.nativeA, null, touched, { noIndex: true })));
          return rows;
        },
      });
    }
    const finalCtx = makeCtx(rpc, chainId, run.addrs);
    assert.equal(await finalCtx.provider.send('evm_revert', [run.sealed]), true, 'final evm_revert');
    report.estimatedFreshSlots = { label: 'ESTIMATED from the design table, not traced', 'create (native, 4 actions)': '5 evidence + 1 pubId + 2..3 record + 1 subject + 4..6 admission + 2x(2 head + 1 bindingPosition + 3 positionCell) + index appends', 'create (signed)': 'as native + 2 (r, s)', 'edit': '3 record + 2..3 admission + head rewrite + index appends' };
    report.consumerMismatches = Object.values(report.cells).reduce((n, c) => n + (c.mismatches || 0), 0);
    report.finishedAt = new Date().toISOString();
  } catch (e) {
    log(`FAILED: ${e.message}`);
    report.failure = { message: String(e.message), stack: String(e.stack).split('\n').slice(0, 12), at: new Date().toISOString() };
    throw e;
  } finally {
    stopAnvil();
    persist(report);
    const text = Object.entries(report.cells).flatMap(([cell, c]) => (c.rows || []).map((r) => `${cell.padEnd(26)} ${String(r.label).padEnd(64)} ${String(r.gas ?? '').padStart(10)} ${r.status ?? ''}`)).join('\n');
    process.stdout.write(text + '\n');
    log(`wrote ${OUT_JSON}${report.failure ? ' (FAILED: ' + report.failure.message + ')' : ''}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
