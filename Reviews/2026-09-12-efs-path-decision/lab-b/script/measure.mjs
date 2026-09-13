#!/usr/bin/env node
// Road B lab — INGRESS x MULTIPLICITY measurement. DISPOSABLE LAB, NO PROTOCOL CLAIM.
// DO NOT RUN without the coordinator's heavy-run lease (README.md, TODO.md).
//
// What this measures: {native, signed} ingress x {one, two} authors under a lens, on the
// matched 32-byte quote and 41-byte binary controls, each cell from the SAME sealed initial
// state (evm_snapshot after setup; evm_revert + re-snapshot before every cell), with the
// pre-state and post-state recorded per cell (exact control Record ids absent, author nonces,
// counters, relevant list heads). Plus the freshness controls (contract-fresh-body with a
// proved pre-absence, contract-existing-body with a proved pre-presence, exact-operation
// retry), the failure rows, the without-index-module pass and paid consumer reads.
// It is NOT the protocol's capability ablation (neither/authorship/selection/both); no such
// "interaction term" is computed here — that ablation is a later gate (MANIFEST.draft.json).
// Fresh-slot counts are NOT derived (no storage tracing): the JSON carries the design's
// ESTIMATED counts, labelled as such.
//
// Usage (after `forge build` into a run-owned FOUNDRY_OUT):
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --anvil          # spawns a finite-history Cancun Anvil, deploys, runs, kills it
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --rpc URL --deploy
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --rpc URL --addresses <scratch>/lab-addresses.json
// Options: --out <file.json> (default <scratch>/measure.json)  --mnemonic "<12 words>"  --skip-without-index
// Env: FOUNDRY_OUT (artifacts; fallback ./out for reading only), EFS_LAB_SCRATCH (run-owned root;
// default: parent of FOUNDRY_OUT, else the manifest's scratch path), EFS_ETHERS_PATH.
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
const { JsonRpcProvider, HDNodeWallet, ContractFactory, Contract, AbiCoder, keccak256, hexlify, toBeHex, zeroPadValue, toUtf8Bytes } =
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

// ---------------------------------------------------------------- exact payload controls (run-manifest.md)
const FIX = {
  quote3000: { bytes: zeroPadValue(toBeHex(3000n), 32), keccak: '0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552', fixture: 'quote' },
  quote3100: { bytes: zeroPadValue(toBeHex(3100n), 32), keccak: '0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3', fixture: 'quote' },
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
const scopeKey = (principal, purpose, subject) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM('efs2/vk/binding-scope/1'), principal, purpose, subject]));
const posting = (typeId, kind, ordinal, valueKey) => keccak256(coder.encode(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [DOM('efs2/pk/1'), typeId, kind, ordinal, valueKey]));
const byTypeList = (typeId) => posting(typeId, 1, 0, ZERO);
const byAuthorList = (principal) => posting(ZERO, 4, 0, principal);
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
  // finite history, no steps tracing, loopback only, run-owned cache
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
const artifact = (file, nameOf) => JSON.parse(readFileSync(join(OUT_DIR, `${file}.sol`, `${nameOf}.json`), 'utf8'));
async function send(provider, txPromise, label, expectFail = false) {
  const tx = await txPromise;
  const rc = await provider.waitForTransaction(tx.hash);
  if (!expectFail) assert.equal(rc.status, 1, `${label}: reverted`);
  else assert.equal(rc.status, 0, `${label}: expected a revert`);
  return { label, gas: rc.gasUsed.toString(), status: rc.status, hash: tx.hash, block: rc.blockNumber };
}
const FAIL_GAS = { gasLimit: 3_000_000n };
async function deployAll(provider, deployer) {
  const dep = async (file, nameOf, ...ctor) => {
    const a = artifact(file, nameOf);
    const c = await new ContractFactory(a.abi, a.bytecode.object, deployer).deploy(...ctor);
    await c.waitForDeployment();
    const rc = await provider.getTransactionReceipt(c.deploymentTransaction().hash);
    return { c, gas: rc.gasUsed, runtimeBytes: ((await provider.getCode(await c.getAddress())).length - 2) / 2 };
  };
  const registry = await dep('TypeRegistry', 'TypeRegistry');
  const acceptor = await dep('LabHarness', 'MockAcceptor');
  const ledger = await dep('Ledger', 'Ledger', await registry.c.getAddress(), REALM);
  const index = await dep('IndexModule', 'IndexModule', await ledger.c.getAddress());
  const lens = await dep('LensReader', 'LensReader', await ledger.c.getAddress(), await index.c.getAddress());
  const actorA = await dep('LabHarness', 'Actor', await ledger.c.getAddress());
  const actorB = await dep('LabHarness', 'Actor', await ledger.c.getAddress());
  const consumer = await dep('LabHarness', 'Consumer', await lens.c.getAddress());
  const recon = await dep('LabHarness', 'Reconstructor');
  const setup = [];
  setup.push(await send(provider, ledger.c.setIndexModule(await index.c.getAddress()), 'setup: attach index module'));
  setup.push(await send(provider, registry.c.register(T.QUOTE, await acceptor.c.getAddress(), []), 'setup: register QUOTE'));
  setup.push(await send(provider, registry.c.register(T.BINARY, ZERO_ADDR, []), 'setup: register BINARY'));
  setup.push(await send(provider, registry.c.register(T.ITEM, ZERO_ADDR, []), 'setup: register ITEM'));
  setup.push(await send(provider, registry.c.register(T.PAIR, await acceptor.c.getAddress(), [T.ITEM, T.ITEM]), 'setup: register PAIR'));
  setup.push(await send(provider, registry.c.register(T.QUOTE_J, await acceptor.c.getAddress(), [T.PAIR]), 'setup: register QUOTE_J (one checked Pair ref)'));
  return { registry, acceptor, ledger, index, lens, actorA, actorB, consumer, recon, setup };
}

// ---------------------------------------------------------------- authors: native (Actor contract) and signed (EOA wallet)
async function signedCall(provider, ledger, wallet, actions, bodies, overrides = {}) {
  const block = await provider.getBlock('latest');
  const intent = {
    realmId: await ledger.realmId(), coreCodeCommitment: await ledger.coreCodeCommitment(), author: wallet.address,
    nonce: await ledger.nonces(wallet.address), deadline: BigInt(block.timestamp + 3600),
    acceptanceProfile: await ledger.acceptanceProfileOf(actions), indexObligations: await ledger.indexObligations(), ...overrides,
  };
  const types = { PublicationIntent: ['realmId:bytes32', 'coreCodeCommitment:bytes32', 'author:address', 'nonce:uint64', 'deadline:uint64', 'acceptanceProfile:bytes32', 'indexObligations:bytes32', 'actionsHash:bytes32'].map((f) => { const [n, t] = f.split(':'); return { name: n, type: t }; }) };
  const sig = await wallet.signTypedData({ name: 'EFS2-RoadB-Lab', version: '1' }, types, { ...intent, actionsHash: actionsHash(actions) });
  return ledger.executeSigned(intent, actions, bodies, sig);
}
function author(kind, who, ctx) {
  if (kind === 'native') return { address: null, kind, run: (actions, bodies, o = {}) => (o.nonce !== undefined ? who.executeWithNonce(actions, bodies, o.nonce, o.tx ?? {}) : who.execute(actions, bodies, o.tx ?? {})) };
  return { address: who.address, kind, run: (actions, bodies, o = {}) => signedCall(ctx.provider, ctx.ledger, who, actions, bodies, o) };
}

// ---------------------------------------------------------------- sealed state: snapshot/revert and pre/post probes
const headOf = (h) => ({ count: str(h[0]), live: str(h[1]), last: str(h[2]), flags: str(h[3]) });
async function stateProbe(ctx, authors, typeId, folder) {
  const { provider, ledger, index } = ctx;
  const probe = { block: await provider.getBlockNumber(), controls: {}, counts: {}, nonces: {}, scopeHeads: {}, byAuthorHeads: {}, byTypeHead: null };
  for (const [label, f] of Object.entries(FIX)) {
    const t = f.fixture === 'quote' ? T.QUOTE : T.BINARY;
    const id = recordId(t, f.bytes);
    const r = await ledger.record(id);
    probe.controls[label] = { recordId: id, typeId: t, firstAdmission: str(r[1]), occurrences: str(r[2]), present: r[1] !== 0n };
  }
  const c = await ledger.counts();
  probe.counts = { admissions: str(c[0]), records: str(c[1]), bindings: str(c[2]), publications: str(c[3]) };
  for (const a of authors) {
    if (!a) continue;
    const pid = await ledger.principalOf(a.address);
    probe.nonces[a.address] = str(await ledger.nonces(a.address));
    probe.scopeHeads[a.address] = headOf(await index.postingHead(scopeList(scopeKey(pid, P.FOLDER, folder))));
    probe.byAuthorHeads[a.address] = headOf(await index.postingHead(byAuthorList(pid)));
  }
  probe.byTypeHead = headOf(await index.postingHead(byTypeList(typeId)));
  return probe;
}
function assertSealed(probe, label) {
  for (const [k, v] of Object.entries(probe.controls)) assert.equal(v.present, false, `${label}: sealed state must not contain control record ${k}`);
}
async function sealedCell(ctx, label, authors, typeId, folder, fn) {
  const { provider } = ctx;
  assert.equal(await provider.send('evm_revert', [ctx.sealed]), true, `${label}: evm_revert failed`);
  ctx.sealed = await provider.send('evm_snapshot', []); // anvil snapshots are single-use: re-seal
  const pre = await stateProbe(ctx, authors, typeId, folder);
  assertSealed(pre, label);
  const rows = await fn();
  const post = await stateProbe(ctx, authors, typeId, folder);
  return { label, sealedSnapshot: ctx.sealed, pre, rows, post };
}

// ---------------------------------------------------------------- the ingress x multiplicity cells
async function runCell(ctx, cellName, fixture, primary, secondary, opts = {}) {
  const { provider, ledger, consumer, lens, recon } = ctx;
  const rows = [];
  const body1 = fixture === 'quote' ? FIX.quote3000.bytes : FIX.file41a.bytes;
  const body2 = fixture === 'quote' ? FIX.quote3100.bytes : FIX.file41b.bytes;
  const typeId = fixture === 'quote' ? T.QUOTE : T.BINARY;
  const salt = keccak256(toUtf8Bytes(`${cellName}/${fixture}`));
  const subj = subjectId(await ledger.principalOf(primary.address), salt); // origin-qualified for contract authors
  const folder = name(`/${cellName}/${fixture}`);
  const nameHash = name('entry');
  const r1 = recordId(typeId, body1); const r2 = recordId(typeId, body2);
  // create = one logical action: subject + record + head + placement
  rows.push(await send(provider, primary.run([aCreate(salt), aPublish(typeId, body1), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], ['0x', body1, '0x', '0x']), `${cellName}/${fixture}/create`));
  const pub = (await ledger.counts())[3];
  const rec = await recon.reconstruct(await ledger.getAddress(), pub);
  rows.push({ label: `${cellName}/${fixture}/reconstruct-create`, publication: str(pub), matches: rec[4], recovered: rec[3], status: 'eth_call' });
  // edit = fresh body + CAS head rebind
  rows.push(await send(provider, primary.run([aPublish(typeId, body2), aBind(P.HEAD, subj, ZERO, r2, 1)], [body2, '0x']), `${cellName}/${fixture}/edit`));
  let lensArr = [primary.address];
  if (secondary) {
    // competing author: own head on the shared subject and own placement under the same name
    rows.push(await send(provider, secondary.run([aPublish(typeId, body1), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], [body1, '0x', '0x']), `${cellName}/${fixture}/create-competing`));
    lensArr = [primary.address, secondary.address];
  }
  // paid consumer reads (receipt gas, not eth_call)
  if (fixture === 'quote') rows.push(await send(provider, consumer.readQuote(lensArr, P.HEAD, subj, ZERO), `${cellName}/${fixture}/read-resolve`));
  else rows.push(await send(provider, consumer.readHead(lensArr, P.HEAD, subj, ZERO), `${cellName}/${fixture}/read-resolve`));
  if (secondary) rows.push(await send(provider, consumer.readHead([secondary.address, primary.address], P.HEAD, subj, ZERO), `${cellName}/${fixture}/read-resolve-second-first`));
  const est = await lens.resolve.estimateGas(lensArr, P.HEAD, subj, ZERO);
  rows.push({ label: `${cellName}/${fixture}/eth_call-resolve-estimate`, gas: est.toString(), status: 'estimate' });
  if (opts.noIndex) return rows; // without the module, list/history are UNKNOWN by construction (not measured as reads)
  rows.push(await send(provider, consumer.readList(lensArr, P.FOLDER, folder, 16), `${cellName}/${fixture}/read-list`));
  rows.push(await send(provider, consumer.readHistory(primary.address, position(P.HEAD, subj, ZERO), 1_000_000), `${cellName}/${fixture}/read-history-asof`));
  return rows;
}

async function freshnessControls(ctx, actor) {
  const { provider, ledger } = ctx;
  const rows = [];
  const body = FIX.quote3000.bytes;
  const id = recordId(T.QUOTE, body);
  const before = await ledger.record(id);
  assert.equal(before[1], 0n, 'pre-absence: the exact Record must not exist yet');
  rows.push({ label: 'pre-absence proof', recordId: id, firstAdmission: str(before[1]), occurrences: str(before[2]), block: await provider.getBlockNumber(), proof: 'eth_call record(id).firstAdmission == 0 at the block before the write' });
  rows.push(await send(provider, actor.publish(T.QUOTE, body), 'contract-fresh-body (Actor.publish quote3000, proved absent just before)'));
  const mid = await ledger.record(id);
  assert.notEqual(mid[1], 0n, 'pre-presence: the exact Record must exist now');
  rows.push({ label: 'pre-presence proof', recordId: id, firstAdmission: str(mid[1]), occurrences: str(mid[2]), block: await provider.getBlockNumber(), proof: 'eth_call record(id).firstAdmission != 0 and occurrences == 1 at the block before the write' });
  rows.push(await send(provider, actor.publish(T.QUOTE, body), 'contract-existing-body (same bytes: new occurrence, no new Record)'));
  const after = await ledger.record(id);
  rows.push({ label: 'post-presence', recordId: id, firstAdmission: str(after[1]), occurrences: str(after[2]) });
  const b777 = zeroPadValue(toBeHex(777n), 32);
  const actions = [aPublish(T.QUOTE, b777)];
  const nonce = await ledger.nonces(await actor.getAddress());
  rows.push(await send(provider, actor.executeWithNonce(actions, [b777], nonce), 'batch under explicit nonce'));
  rows.push(await send(provider, actor.executeWithNonce(actions, [b777], nonce, FAIL_GAS), 'exact-operation retry (reverts AlreadyAdmitted)', true));
  return rows;
}

async function failureRows(ctx, actor) {
  const { provider, acceptor } = ctx;
  const rows = [];
  const items = [zeroPadValue(toBeHex(1n), 32), zeroPadValue(toBeHex(2n), 32)];
  rows.push(await send(provider, actor.publish(T.ITEM, items[0]), 'ITEM_ETH'));
  rows.push(await send(provider, actor.publish(T.ITEM, items[1]), 'ITEM_USDC'));
  const ids = items.map((b) => recordId(T.ITEM, b));
  const pair = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], ids[1], 1n]);
  rows.push(await send(provider, actor.publish(T.PAIR, pair), 'PAIR_ETH_USDC (two checked refs)'));
  const wrong = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], recordId(T.QUOTE, FIX.quote3000.bytes), 1n]);
  rows.push(await send(provider, actor.publish(T.PAIR, wrong, FAIL_GAS), 'checked ref: wrong Type (reverts)', true));
  const missing = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], name('nowhere'), 1n]);
  rows.push(await send(provider, actor.publish(T.PAIR, missing, FAIL_GAS), 'checked ref: missing target (reverts)', true));
  rows.push(await send(provider, actor.bind(P.HEAD, name('x'), ZERO, ids[0], 7, FAIL_GAS), 'stale CAS (reverts)', true));
  rows.push(await send(provider, acceptor.set(1, 0), 'setup: acceptor rejects'));
  rows.push(await send(provider, actor.publish(T.QUOTE, zeroPadValue(toBeHex(5n), 32), FAIL_GAS), 'failed acceptance (whole publication reverts)', true));
  rows.push(await send(provider, acceptor.set(0, 0), 'setup: acceptor accepts'));
  return rows;
}

async function main() {
  const t0 = Date.now();
  const rpc = args.anvil ? await startAnvil() : args.rpc || 'http://127.0.0.1:8545';
  const provider = new JsonRpcProvider(rpc, undefined, { staticNetwork: true });
  const wallets = [0, 1, 2, 3].map((i) => HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0/${i}`).connect(provider));
  const deployer = wallets[0];
  const report = {
    profile: 'road-b-lab/1', claim: 'disposable lab, no protocol claim',
    experiment: 'ingress x multiplicity: {native, signed} x {one, two authors under a lens}. NOT the protocol capability ablation (neither/authorship/selection/both), which is a later gate.',
    capabilityAblation: { unknown: 'not run: the neither/authorship/selection/both counterfactuals need same-guarantee arms that remove one capability each; this lab has one arm', consequence: 'no representation-vs-feature attribution and no interaction term can be claimed from this run' },
    rpc, chainId: (await provider.getNetwork()).chainId.toString(), node: process.version, evm: 'cancun', compiler: '0.8.30 (verify from out/ metadata)', optimizerRuns: 200, viaIR: true,
    paths: { artifacts: OUT_DIR, scratchRoot: SCRATCH_ROOT, outJson: OUT_JSON },
    startedAt: new Date(t0).toISOString(), anvil: anvilInfo, setup: [], sealedInitialState: null, cells: {}, controls: null, failures: null, withoutIndex: null, estimatedFreshSlots: {},
  };
  let d;
  if (args.addresses) {
    const addrs = JSON.parse(readFileSync(args.addresses, 'utf8'));
    const at = (file, nameOf, addr) => ({ c: new Contract(addr, artifact(file, nameOf).abi, deployer) });
    d = { registry: at('TypeRegistry', 'TypeRegistry', addrs.registry), acceptor: at('LabHarness', 'MockAcceptor', addrs.acceptor), ledger: at('Ledger', 'Ledger', addrs.ledger), index: at('IndexModule', 'IndexModule', addrs.index), lens: at('LensReader', 'LensReader', addrs.lens), actorA: at('LabHarness', 'Actor', addrs.actorA), actorB: at('LabHarness', 'Actor', addrs.actorB), consumer: at('LabHarness', 'Consumer', addrs.consumer), recon: at('LabHarness', 'Reconstructor', addrs.recon), setup: [] };
  } else {
    d = await deployAll(provider, deployer);
    report.deployment = Object.fromEntries(await Promise.all(Object.entries(d).filter(([k]) => k !== 'setup').map(async ([k, v]) => [k, { address: await v.c.getAddress(), gas: v.gas?.toString(), runtimeBytes: v.runtimeBytes }])));
    report.setup = d.setup;
    const addressesPath = join(SCRATCH_ROOT, 'lab-addresses.json'); // run-owned, never inside the lab directory
    writeFileSync(addressesPath, JSON.stringify(Object.fromEntries(Object.entries(report.deployment).map(([k, v]) => [k, v.address])), null, 2));
    report.paths.addresses = addressesPath;
  }
  const ctx = { provider, ledger: d.ledger.c, acceptor: d.acceptor.c, consumer: d.consumer.c, lens: d.lens.c, index: d.index.c, recon: d.recon.c, sealed: null };
  const nativeA = author('native', d.actorA.c); nativeA.address = await d.actorA.c.getAddress();
  const nativeB = author('native', d.actorB.c); nativeB.address = await d.actorB.c.getAddress();
  const signedA = author('signed', wallets[1], ctx);
  const signedB = author('signed', wallets[2], ctx);
  // seal the initial state after setup; every cell starts by reverting to it
  ctx.sealed = await provider.send('evm_snapshot', []);
  report.sealedInitialState = { snapshot: ctx.sealed, block: await provider.getBlockNumber(), rule: 'evm_revert to the sealed snapshot, then re-snapshot, before every cell; pre/post probes recorded per cell' };
  const cells = { 'native-one': [nativeA, null], 'signed-one': [signedA, null], 'native-two': [nativeA, nativeB], 'signed-two': [signedA, signedB] };
  for (const fixture of ['quote', 'binary']) {
    for (const [cell, [p, s]] of Object.entries(cells)) {
      const typeId = fixture === 'quote' ? T.QUOTE : T.BINARY;
      report.cells[`${cell}/${fixture}`] = await sealedCell(ctx, `${cell}/${fixture}`, [p, s], typeId, name(`/${cell}/${fixture}`), () => runCell(ctx, cell, fixture, p, s));
    }
  }
  report.controls = await sealedCell(ctx, 'freshness-controls', [nativeA], T.QUOTE, name('/none'), () => freshnessControls(ctx, d.actorA.c));
  report.failures = await sealedCell(ctx, 'failure-rows', [nativeA], T.PAIR, name('/none'), () => failureRows(ctx, d.actorA.c));
  if (!args['skip-without-index']) {
    report.withoutIndex = await sealedCell(ctx, 'native-one-noindex/quote', [nativeA], T.QUOTE, name('/native-one-noindex/quote'), async () => {
      const rows = [await send(provider, d.ledger.c.setIndexModule(ZERO_ADDR), 'setup: detach index module')];
      rows.push(...(await runCell(ctx, 'native-one-noindex', 'quote', nativeA, null, { noIndex: true })));
      return rows;
    });
  }
  assert.equal(await provider.send('evm_revert', [ctx.sealed]), true, 'final evm_revert');
  report.estimatedFreshSlots = { label: 'ESTIMATED from the design table, not traced', 'create (native, 4 actions)': '5 evidence + 1 pubId + 2..3 record + 1 subject + 4..6 admission + 2x(2 head + 1 bindingPosition + 3 positionCell) + index appends', 'create (signed)': 'as native + 2 (r, s)', 'edit': '3 record + 2..3 admission + head rewrite + index appends' };
  report.finishedAt = new Date().toISOString();
  report.caveats = [
    'Local Anvil receipts under the lab profile; not an L2 fee quote and not an equivalent-guarantee comparison until the coordinator\'s fixture map is applied.',
    'Ingress x multiplicity only; no capability ablation and no interaction term are claimed.',
    'Fresh-slot counts are estimates; no storage tracing was run.',
    'Every cell starts from the sealed post-setup state (cold transaction access sets; lists empty except setup); "steady" list regimes are not measured here.',
    'A listing page with mutated == true is a mixed-basis page and must not be treated as COMPLETE by any caller.',
  ];
  stopAnvil();
  report.anvil = { ...anvilInfo };
  const text = Object.entries(report.cells).flatMap(([cell, c]) => c.rows.map((r) => `${cell.padEnd(20)} ${r.label.padEnd(64)} ${String(r.gas ?? '').padStart(10)} ${r.status}`)).join('\n');
  console.log(text);
  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  console.log(`wrote ${OUT_JSON}`);
}
main().catch((e) => { console.error(e); stopAnvil(); process.exit(1); });
