#!/usr/bin/env node
// Road B lab — measurement script, second source pass. DISPOSABLE LAB, NO PROTOCOL CLAIM.
// UNRUN: written under another worker's compiler lease (only `node --check` has been run on it).
// DO NOT RUN without the coordinator's heavy-run lease (README.md, TODO.md).
//
// HONESTY: this run reports receipt diagnostics with explicit remaining gates. It is not a
// same-guarantee comparison and not the protocol's capability ablation. No row here is a matched
// substitute for the fuller Files control: the 32-byte/41-byte cells are hash-placement diagnostics
// (names are hashes), the label cells are a client-convention retention baseline, and the joined
// cell is the first typed QUOTE/Pair journey (sdk-fixture steps 1–6) — steps 7–10 stay open.
// The Reconstructor is a candidate self-check calling ledger.intentDigest, not independent.
//
// EVIDENCE SHAPE (what an independent checker decodes; candidate summaries are kept apart):
//   raw observations  cells[*].baselineRaw[]  every eth_call taken at the sealed post-revert block BEFORE
//                                             the cell's first transaction (also present in raw[] with
//                                             stage "baseline" so a checker keyed on raw[] sees them)
//                     cells[*].raw[]          every eth_call of the cell: { rpcId, method, source, stage,
//                                             contract, fn, args, to, calldata, returnData, blockTag,
//                                             blockHash, request, response } — request/response are the
//                                             LITERAL JSON-RPC envelopes; request.params[0] is exactly
//                                             {to, data}; params[1] is the hex block number; blockHash is
//                                             the retained header's hash at that number, never inferred
//                     cells[*].transactions[] { label, hash, from, to, nonce, data, rawTransaction, receipt,
//                                             rpc: { sendRawTransaction, getTransactionReceipt,
//                                             getBlockByHash, getTransactionByHash } } — each a literal
//                                             request/response pair correlated by JSON-RPC id
//                     cells[*].blocks[]       eth_getBlockByNumber / eth_getBlockByHash envelopes
//                     cells[*].rpcOther[]     evm_revert, evm_snapshot, eth_gasPrice, eth_blockNumber,
//                                             eth_getTransactionCount, eth_estimateGas, anvil_getAutomine
//   candidate claims  cells[*].candidateDecoded (this script's decoding of the retained bytes),
//                     cells[*].rows, rowLog, consumerChecks — never expected answers.
// JSON-RPC ids are unique for the whole run (one counter). There is no ethers provider and no
// result cache: every request is one literal HTTP POST.
//
// Usage (after `forge build` into a run-owned FOUNDRY_OUT):
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --anvil
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --rpc URL --deploy
//   FOUNDRY_OUT=<scratch>/out node script/measure.mjs --rpc URL --addresses <scratch>/lab-addresses.json
// Options: --out <file.json> (default <scratch>/measure.json)  --mnemonic "<12 words>"  --skip-without-index
//          --only <substring> (run only cells whose name contains it; for repair cycles)
// Env: FOUNDRY_OUT (artifacts; fallback ./out, read-only), EFS_LAB_SCRATCH (run-owned root; default: parent
// of FOUNDRY_OUT, else the manifest's scratch path), EFS_ETHERS_PATH.
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
const { HDNodeWallet, Interface, AbiCoder, keccak256, hexlify, toBeHex, zeroPadValue, toUtf8Bytes, concat, getCreateAddress, getAddress } =
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
const ONLY = typeof args.only === 'string' ? args.only : null;
const WATCHDOG_MS = 25 * 60 * 1000;
const CAVEAT_JOINED = 'The joined QUOTE/Pair journey (sdk-fixture steps 1–6 with ITEM/PAIR/QUOTE_J) is scripted as cell joined/steps-1-6; steps 7 (partly: paid consumer), 8, 9 and 10 are NOT in this script.';
const CAVEAT_RECON = 'The Reconstructor is a candidate self-check calling ledger.intentDigest, not independent.';
const CAVEAT_MATCHED = 'No row is a matched substitute for the fuller Files control: hash-placement diagnostics (names are hashes) until labels and the joined journey are integrated into one matched guarantee profile.';
const CAVEAT_EXPECTED = 'Expected values, commitments and read-back comparisons are computed by this script from the fixture (candidate-side self-checks); they are not the independent oracle.';

// ---------------------------------------------------------------- exact payload controls (run-manifest.md)
const FIX = {
  quote3000: { bytes: zeroPadValue(toBeHex(3000n), 32), keccak: '0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552', fixture: 'quote', value: 3000n },
  quote3100: { bytes: zeroPadValue(toBeHex(3100n), 32), keccak: '0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3', fixture: 'quote', value: 3100n },
  file41a: { bytes: hexlify(new Uint8Array(41).fill(0x61)), keccak: '0xe27c263ce61bca70e9ff7d3182fc124c8dcfee2a4656e5c746ceb433a2558911', fixture: 'binary' },
  file41b: { bytes: hexlify(new Uint8Array(41).fill(0x62)), keccak: '0x1882de08a178ebf3827d787e4086d8b2e14a81a8cf3b7b42f2e1458831646f3a', fixture: 'binary' },
};
for (const [label, f] of Object.entries(FIX)) assert.equal(keccak256(f.bytes), f.keccak, `fixture ${label} hash check`);

// ---------------------------------------------------------------- joined fixture values (sdk-fixture.md, exact)
const J = {
  mantissaA1: 2_500_000_000n, mantissaA2: 2_502_000_000n, mantissaB1: 2_501_000_000n, scale: 6, observedAt: 1_800_000_000n,
  noteBytes: '0x7265666572656e63652071756f7465', // UTF-8 "reference quote"
};
assert.equal(hexlify(toUtf8Bytes('reference quote')), J.noteBytes, 'NOTE_BYTES are the UTF-8 bytes of "reference quote"');
const NOTE_COMMITMENT = keccak256(J.noteBytes);
const LABEL_ENTRY = hexlify(toUtf8Bytes('entry')); // exact ASCII "entry" (0x656e747279)

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
const T = { QUOTE: DOM('lab/type/quote/1'), BINARY: DOM('lab/type/binary/1'), ITEM: DOM('lab/type/item/1'), PAIR: DOM('lab/type/pair/1'), QUOTE_J: DOM('lab/type/quote-joined/1'), LABEL: DOM('lab/type/label/1') };
const P = { HEAD: DOM('efs2/purpose/head/1'), FOLDER: DOM('efs2/purpose/folder/1'), TAG: DOM('efs2/purpose/tag/1') };
const name = (s) => keccak256(toUtf8Bytes(s));
const REALM = DOM('lab/realm/1');
const ACTION_T = 'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
const ENTRY_T = 'tuple(bytes32 position,address author,bytes32 target,uint32 revision,uint64 admission)[]';
const act = (o) => ({ kind: 0, typeId: ZERO, bodyHashOrRecordId: ZERO, purpose: ZERO, subject: ZERO, role: ZERO, target: ZERO, expectedRevision: 0, salt: ZERO, ...o });
const aCreate = (salt) => act({ kind: 5, salt });
const aPublish = (typeId, body) => act({ kind: 1, typeId, bodyHashOrRecordId: keccak256(body) });
const aBind = (purpose, subject, role, target, rev) => act({ kind: 3, purpose, subject, role, target, expectedRevision: rev });
const aUnbind = (purpose, subject, role, rev) => act({ kind: 4, purpose, subject, role, expectedRevision: rev });
const actionsHash = (actions) => keccak256(coder.encode([ACTION_T], [actions]));
const quoteBody = (pairId, mantissa) => coder.encode(['bytes32', 'uint256', 'uint8', 'uint64', 'bytes32'], [pairId, mantissa, J.scale, J.observedAt, NOTE_COMMITMENT]);
const lensId = (lens) => keccak256(coder.encode(['address[]'], [lens]));
// JoinedConsumer commitments (see src/JoinedConsumer.sol NatSpec); recomputed here as candidate-side expectations
const pointCommitment = (pairId, mantissa, kind, lens, basis) => keccak256(coder.encode(['bytes32', 'uint256', 'uint8', 'uint8', 'bytes32', 'uint64'], [pairId, mantissa, J.scale, kind, lensId(lens), basis]));
const pointEvidence = (itemA, itemB, author, publication, admission, revision, target) => keccak256(coder.encode(['bytes32', 'bytes32', 'uint64', 'bytes32', 'address', 'uint64', 'uint64', 'uint32', 'bytes32'], [itemA, itemB, J.observedAt, NOTE_COMMITMENT, author, publication, admission, revision, target]));
const listCommitment = (items, selected, lens, basis) => keccak256(coder.encode(['bytes32', 'uint64', 'bytes32', 'uint64'], [keccak256(coder.encode([ENTRY_T], [items])), selected, lensId(lens), basis]));
const taggedCommitment = (targets, concept, lens, basis) => keccak256(coder.encode(['bytes32', 'uint256', 'bytes32', 'bytes32', 'uint64'], [keccak256(coder.encode(['bytes32[]'], [targets])), targets.length, concept, lensId(lens), basis]));
const historyCommitment = (live, target, revision, admission, asOf, author, basis) => keccak256(coder.encode(['bool', 'bytes32', 'uint32', 'uint64', 'uint64', 'address', 'uint64'], [live, target, revision, admission, asOf, author, basis]));
const historyEvidence = (pairId, mantissa, itemA, itemB) => keccak256(coder.encode(['bytes32', 'uint256', 'uint8', 'bytes32', 'bytes32'], [pairId, mantissa, J.scale, itemA, itemB]));
const labelCommitment = (pos, role, bytes) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes'], [pos, role, bytes]));
const labelEvidence = (folderId, id, firstAdmission, occurrences, length) => keccak256(coder.encode(['bytes32', 'bytes32', 'uint64', 'uint32', 'uint256'], [folderId, id, firstAdmission, occurrences, length]));
// StatelessConsumer commitments: exactly the tuple LabHarness.Consumer stores
const twinQuote = (status, target, revision, admission, value) => keccak256(coder.encode(['uint8', 'bytes32', 'uint32', 'uint64', 'uint256'], [status, target, revision, admission, value]));
const twinHead = (status, target, revision, admission) => keccak256(coder.encode(['uint8', 'bytes32', 'uint32', 'uint64'], [status, target, revision, admission]));
const twinList = (status, count, scanned) => keccak256(coder.encode(['uint8', 'uint64', 'uint64'], [status, count, scanned]));
const twinHistory = (liveFlag, target, revision, admission) => keccak256(coder.encode(['uint8', 'bytes32', 'uint32', 'uint64'], [liveFlag, target, revision, admission]));
const str = (v) => (typeof v === 'bigint' ? v.toString() : v);
const qty = (n) => '0x' + BigInt(n).toString(16); // JSON-RPC quantity: no leading zeros ("0x0" for zero)
const RPC_TIMEOUT_MS = 30_000; // any single RPC await, and any receipt wait, fails loudly after this
const CALL_GAS = 8_000_000n;
const DEPLOY_GAS = 15_000_000n;
const FAIL_GAS = 3_000_000n;
const T0 = Date.now();
const log = (line) => { process.stdout.write(`[${((Date.now() - T0) / 1000).toFixed(1).padStart(7)}s] ${line}\n`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- artifacts and interfaces
const ART_SOURCE = {
  Ledger: 'Ledger', IndexModule: 'IndexModule', LensReader: 'LensReader', TypeRegistry: 'TypeRegistry',
  MockAcceptor: 'LabHarness', FailingIndexModule: 'LabHarness', Actor: 'LabHarness', Consumer: 'LabHarness', Reconstructor: 'LabHarness',
  QuoteAcceptor: 'LabAcceptors', LabelAcceptor: 'LabAcceptors', JoinedConsumer: 'JoinedConsumer', StatelessConsumer: 'JoinedConsumer',
};
const ART = {};
const IFACES = {};
const artifactPath = (nameOf) => join(OUT_DIR, `${ART_SOURCE[nameOf]}.sol`, `${nameOf}.json`);
const artifact = (nameOf) => (ART[nameOf] ??= JSON.parse(readFileSync(artifactPath(nameOf), 'utf8')));
const iface = (nameOf) => (IFACES[nameOf] ??= new Interface(artifact(nameOf).abi));
const errorSelector = (nameOf, errName) => iface(nameOf).getError(errName)?.selector ?? null;
const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const sourceHashes = () => {
  const out = {};
  for (const dir of ['src', 'test', 'script']) {
    const d = join(root, dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).sort()) out[`${dir}/${f}`] = sha256File(join(d, f));
  }
  return out;
};

// ---------------------------------------------------------------- literal JSON-RPC (no provider, no cache, unique ids)
let rpcSerial = 0;
function makeRpc(url) {
  return async function rpc(method, params, { label = method, allowError = false } = {}) {
    const id = ++rpcSerial;
    const request = { jsonrpc: '2.0', id, method, params };
    const t = Date.now();
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(RPC_TIMEOUT_MS) })
      .catch((e) => { throw new Error(`${label}: ${method} transport failure: ${e.message}`); });
    const text = await res.text();
    let response;
    try { response = JSON.parse(text); } catch { throw new Error(`${label}: ${method} returned non-JSON (${res.status}): ${text.slice(0, 200)}`); }
    if (response.id !== id) throw new Error(`${label}: ${method} response id ${response.id} != request id ${id}`);
    const env = { request, response, httpStatus: res.status, ms: Date.now() - t, label };
    if ('error' in response && !allowError) throw new Error(`${label}: ${method} error ${JSON.stringify(response.error)}`);
    return env;
  };
}
const envOf = (e) => ({ rpcId: e.request.id, method: e.request.method, label: e.label, ms: e.ms, request: e.request, response: e.response });

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
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (anvil.exitCode !== null) throw new Error(`anvil exited early (code ${anvil.exitCode}); check --cache-path support`);
    try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(500) }); if ((await r.json()).result === '0x7a69') return url; } catch {} // id 0: never collides with the counted requests (which start at 1)
    await sleep(100);
  }
  throw new Error('anvil did not start');
}

// ---------------------------------------------------------------- per-cell context: sinks for every retained envelope
function makeCtx(run) {
  const rpc = makeRpc(run.rpc);
  const wallets = [0, 1, 2, 3].map((i) => HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0/${i}`));
  const ctx = {
    rpc, url: run.rpc, chainId: run.chainId, source: run.source, wallets, deployer: wallets[0], addrs: run.addrs ?? {},
    txs: [], raw: [], baselineRaw: [], blocks: [], rpcOther: [], rowLog: [], consumerChecks: [], mismatches: 0,
    persist: null, gasPrice: null, blockCache: new Map(), nonceCache: new Map(),
  };
  ctx.other = async (method, params, opts) => { const e = await rpc(method, params, opts); ctx.rpcOther.push(envOf(e)); return e; };
  ctx.blockHeader = async (n) => {
    const key = Number(n);
    if (!ctx.blockCache.has(key)) {
      const e = await rpc('eth_getBlockByNumber', [qty(key), false], { label: `block ${key}` });
      if (!e.response.result) throw new Error(`block ${key} not available`);
      ctx.blocks.push({ ...envOf(e), source: ctx.source, blockNumber: key, blockHash: e.response.result.hash });
      ctx.blockCache.set(key, e.response.result);
    }
    return ctx.blockCache.get(key);
  };
  ctx.blockHash = async (n) => (await ctx.blockHeader(n)).hash;
  ctx.latestBlock = async () => Number((await ctx.other('eth_blockNumber', [], { label: 'latest' })).response.result);
  ctx.nonces = {
    async next(addr) {
      if (!ctx.nonceCache.has(addr)) ctx.nonceCache.set(addr, Number((await ctx.other('eth_getTransactionCount', [addr, 'latest'], { label: 'nonce' })).response.result));
      const n = ctx.nonceCache.get(addr); ctx.nonceCache.set(addr, n + 1); return n;
    },
    forget(addr) { ctx.nonceCache.delete(addr); },
  };
  ctx.setGasPrice = async () => {
    const e = await ctx.other('eth_gasPrice', [], { label: 'gasPrice' });
    ctx.gasPrice = 2n * BigInt(e.response.result) + 1n; // legacy tx; twice the node's suggestion covers base-fee drift within a cell
    return ctx.gasPrice;
  };
  return ctx;
}
const call = (ctx, nameOf, key, fn, fnArgs) => ({ to: ctx.addrs[key], data: iface(nameOf).encodeFunctionData(fn, fnArgs), contract: nameOf, fn, args: fnArgs });

// ---------------------------------------------------------------- raw observations: literal eth_call envelopes
async function observeRaw(ctx, sink, stage, meta, to, data, blockNumber, { allowError = false } = {}) {
  const blockHash = await ctx.blockHash(blockNumber);
  const e = await ctx.rpc('eth_call', [{ to, data }, qty(blockNumber)], { label: `${stage}:${meta.contract}.${meta.fn}`, allowError });
  const obs = {
    rpcId: e.request.id, method: 'eth_call', source: ctx.source, stage, contract: meta.contract, to, fn: meta.fn, args: meta.args ?? [],
    blockTag: Number(blockNumber), blockHash, calldata: data, returnData: e.response.result ?? null, error: e.response.error ?? null,
    request: e.request, response: e.response, ms: e.ms,
  };
  sink.push(obs);
  if (sink !== ctx.raw && sink !== ctx.baselineRaw) ctx.raw.push(obs);
  return obs;
}
async function observe(ctx, sink, stage, nameOf, key, fn, fnArgs, blockNumber) {
  const c = call(ctx, nameOf, key, fn, fnArgs);
  const obs = await observeRaw(ctx, sink, stage, c, c.to, c.data, blockNumber);
  return iface(nameOf).decodeFunctionResult(fn, obs.returnData);
}
// baseline observations go to baselineRaw AND raw (stage "baseline"); post-cell observations go to raw
async function observeBoth(ctx, stage, nameOf, key, fn, fnArgs, blockNumber) {
  const c = call(ctx, nameOf, key, fn, fnArgs);
  const obs = await observeRaw(ctx, ctx.baselineRaw, stage, c, c.to, c.data, blockNumber);
  ctx.raw.push(obs);
  return iface(nameOf).decodeFunctionResult(fn, obs.returnData);
}

// ---------------------------------------------------------------- transactions: signed locally, sent raw, fully correlated
async function waitReceipt(ctx, hash, label, from) {
  const started = Date.now();
  let polls = 0;
  while (Date.now() - started < RPC_TIMEOUT_MS) {
    const e = await ctx.rpc('eth_getTransactionReceipt', [hash], { label });
    polls++;
    if (e.response.result) return { receipt: e.response.result, env: e, polls };
    await sleep(100);
  }
  const diag = { hash, from };
  try { diag.latestNonce = (await ctx.rpc('eth_getTransactionCount', [from, 'latest'])).response.result; diag.pendingNonce = (await ctx.rpc('eth_getTransactionCount', [from, 'pending'])).response.result; } catch (e) { diag.nonceError = String(e.message); }
  try { diag.txpool = (await ctx.rpc('txpool_content', [])).response.result; } catch (e) { diag.txpoolError = String(e.message); }
  throw new Error(`${label}: receipt for ${hash} not found within ${RPC_TIMEOUT_MS} ms; diagnostics ${JSON.stringify(diag)}`);
}
async function send(ctx, build, label, { expectFail = false, gasLimit = CALL_GAS, wallet = ctx.deployer, extra = {} } = {}) {
  const from = wallet.address;
  const nonce = await ctx.nonces.next(from);
  const built = await build();
  const unsigned = { type: 0, to: built.to ?? null, data: built.data, nonce, gasLimit, gasPrice: ctx.gasPrice, chainId: ctx.chainId, value: 0 };
  const rawTransaction = await wallet.signTransaction(unsigned);
  const hash = keccak256(rawTransaction);
  log(`  tx   ${label} (nonce ${nonce}) sending ${hash}`);
  let sendEnv;
  try {
    sendEnv = await ctx.rpc('eth_sendRawTransaction', [rawTransaction], { label });
  } catch (e) {
    ctx.nonces.forget(from); // nothing reached the chain; re-read the nonce on the next use
    throw e;
  }
  assert.equal(sendEnv.response.result, hash, `${label}: node returned a different transaction hash`);
  const { receipt, env: receiptEnv, polls } = await waitReceipt(ctx, hash, label, from);
  const blockNumber = Number(receipt.blockNumber);
  const blockEnv = await ctx.rpc('eth_getBlockByHash', [receipt.blockHash, false], { label });
  assert.equal(blockEnv.response.result?.hash, receipt.blockHash, `${label}: eth_getBlockByHash(${receipt.blockHash}) did not return that header (stale receipt after a revert, or a re-sent byte-identical transaction)`);
  assert.equal(Number(blockEnv.response.result.number), blockNumber, `${label}: header number disagrees with the receipt`);
  ctx.blocks.push({ ...envOf(blockEnv), source: ctx.source, blockNumber, blockHash: receipt.blockHash });
  ctx.blockCache.set(blockNumber, blockEnv.response.result);
  const txEnv = await ctx.rpc('eth_getTransactionByHash', [hash], { label });
  const record = {
    label, hash, from, to: built.to ?? null, nonce, data: built.data, gasLimit: str(gasLimit), gasPrice: str(ctx.gasPrice), chainId: ctx.chainId, rawTransaction, source: ctx.source,
    candidateInputs: { contract: built.contract ?? null, fn: built.fn ?? null, args: built.args ?? null, intent: built.intent ?? null, sig: built.sig ?? null, ...extra },
    receipt: {
      status: Number(receipt.status), gasUsed: BigInt(receipt.gasUsed).toString(), cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed).toString(), effectiveGasPrice: receipt.effectiveGasPrice ? BigInt(receipt.effectiveGasPrice).toString() : null,
      blockHash: receipt.blockHash, blockNumber, transactionIndex: Number(receipt.transactionIndex), contractAddress: receipt.contractAddress ?? null,
      logs: (receipt.logs ?? []).map((l) => ({ address: l.address, topics: [...l.topics], data: l.data, logIndex: Number(l.logIndex) })),
    },
    rpc: { sendRawTransaction: envOf(sendEnv), getTransactionReceipt: { ...envOf(receiptEnv), polls }, getBlockByHash: envOf(blockEnv), getTransactionByHash: envOf(txEnv) },
  };
  ctx.txs.push(record);
  const row = { label, gas: record.receipt.gasUsed, status: record.receipt.status, hash, block: blockNumber, blockHash: receipt.blockHash, txIndex: ctx.txs.length - 1, ...extra };
  ctx.rowLog.push(row);
  log(`  tx   ${label}: block ${blockNumber} gas ${record.receipt.gasUsed} status ${record.receipt.status}`);
  if (ctx.persist) ctx.persist();
  if (!expectFail) assert.equal(record.receipt.status, 1, `${label}: reverted`);
  else assert.equal(record.receipt.status, 0, `${label}: expected a revert`);
  return row;
}
async function estimateRow(ctx, label, c, extra = {}) {
  const e = await ctx.other('eth_estimateGas', [{ to: c.to, data: c.data }], { label });
  return { label, gas: BigInt(e.response.result).toString(), status: 'estimate', standing: 'eth_estimateGas (browser-shaped), not a receipt; envelope in rpcOther', rpcId: e.request.id, ...extra };
}

// ---------------------------------------------------------------- authors: native (Actor contract) and signed (EOA wallet, relayed by the deployer)
const INTENT_TYPES = { PublicationIntent: ['realmId:bytes32', 'coreCodeCommitment:bytes32', 'author:address', 'nonce:uint64', 'deadline:uint64', 'acceptanceProfile:bytes32', 'indexObligations:bytes32', 'actionsHash:bytes32'].map((f) => { const [n, t] = f.split(':'); return { name: n, type: t }; }) };
async function signedCall(ctx, wallet, actions, bodies) {
  const block = await ctx.latestBlock();
  const header = await ctx.blockHeader(block);
  const stage = 'sign-inputs';
  const [realmId] = await observe(ctx, ctx.raw, stage, 'Ledger', 'ledger', 'realmId', [], block);
  const [core] = await observe(ctx, ctx.raw, stage, 'Ledger', 'ledger', 'coreCodeCommitment', [], block);
  const [nonce] = await observe(ctx, ctx.raw, stage, 'Ledger', 'ledger', 'nonces', [wallet.address], block);
  const [profile] = await observe(ctx, ctx.raw, stage, 'Ledger', 'ledger', 'acceptanceProfileOf', [actions], block);
  const [obligations] = await observe(ctx, ctx.raw, stage, 'Ledger', 'ledger', 'indexObligations', [], block);
  const intent = { realmId, coreCodeCommitment: core, author: wallet.address, nonce, deadline: BigInt(header.timestamp) + 3600n, acceptanceProfile: profile, indexObligations: obligations };
  const sig = await wallet.signTypedData({ name: 'EFS2-RoadB-Lab', version: '1' }, INTENT_TYPES, { ...intent, actionsHash: actionsHash(actions) });
  return { ...call(ctx, 'Ledger', 'ledger', 'executeSigned', [intent, actions, bodies, sig]), intent: Object.fromEntries(Object.entries(intent).map(([k, v]) => [k, str(v)])), sig, signInputsBlock: block };
}
function authorsFor(ctx) {
  const native = (key) => ({ address: ctx.addrs[key], key, kind: 'native', build: (actions, bodies) => call(ctx, 'Actor', key, 'execute', [actions, bodies]), buildWithNonce: (actions, bodies, nonce) => call(ctx, 'Actor', key, 'executeWithNonce', [actions, bodies, nonce]) });
  const signed = (wallet) => ({ address: wallet.address, key: null, kind: 'signed', build: (actions, bodies) => signedCall(ctx, wallet, actions, bodies) });
  return { nativeA: native('actorA'), nativeB: native('actorB'), signedA: signed(ctx.wallets[1]), signedB: signed(ctx.wallets[2]) };
}
async function principalOf(ctx, address, block, both = false) {
  const fn = both ? observeBoth : (c, stage, ...rest) => observe(c, c.raw, stage, ...rest);
  return (await fn(ctx, 'plan', 'Ledger', 'ledger', 'principalOf', [address], block))[0];
}

// ---------------------------------------------------------------- harvest: every getter an independent checker replays, decoded AFTER retention
const CONSUMER_SLOTS = ['lastStatus', 'lastTarget', 'lastRevision', 'lastAdmission', 'lastCount', 'lastScanned', 'lastValue'];
function emptyTouched() {
  return { records: [], publications: [], admissions: [], subjects: [], bindingKeys: [], lists: [], authors: [], plannedPublications: 0, plannedAdmissions: 0 };
}
async function harvest(ctx, stage, touched, blockNumber) {
  const both = stage === 'baseline';
  const ob = (nameOf, key, fn, fnArgs) => (both ? observeBoth(ctx, stage, nameOf, key, fn, fnArgs, blockNumber) : observe(ctx, ctx.raw, stage, nameOf, key, fn, fnArgs, blockNumber));
  const h = { standing: 'candidate-decoded summary of retained raw bytes; not evidence by itself', stage, blockTag: Number(blockNumber), blockHash: await ctx.blockHash(blockNumber), controls: {}, records: {}, publications: {}, admissions: {}, subjects: {}, heads: {}, lists: {}, counts: null, nonces: {}, principals: {}, consumer: null };
  const c = await ob('Ledger', 'ledger', 'counts', []);
  h.counts = { admissions: str(c[0]), records: str(c[1]), bindings: str(c[2]), publications: str(c[3]) };
  for (const [label, f] of Object.entries(FIX)) {
    const t = f.fixture === 'quote' ? T.QUOTE : T.BINARY;
    const id = recordId(t, f.bytes);
    const r = await ob('Ledger', 'ledger', 'record', [id]);
    h.controls[label] = { recordId: id, typeId: t, firstAdmission: str(r[1]), occurrences: str(r[2]), bodyLength: (r[3].length - 2) / 2, present: r[1] !== 0n };
  }
  for (const id of new Set(touched.records)) {
    const r = await ob('Ledger', 'ledger', 'record', [id]);
    h.records[id] = { typeId: r[0], firstAdmission: str(r[1]), occurrences: str(r[2]), bodyLength: (r[3].length - 2) / 2, present: r[1] !== 0n };
  }
  const pubs = new Set(touched.publications.map(Number));
  for (let i = 1; i <= touched.plannedPublications; i++) pubs.add(Number(c[3]) + i);
  const adms = new Set(touched.admissions.map(Number));
  for (let i = 1; i <= touched.plannedAdmissions; i++) adms.add(Number(c[0]) + i);
  for (const pub of [...pubs].sort((a, b) => a - b)) {
    const e = await ob('Ledger', 'ledger', 'evidence', [pub]);
    const first = Number(e[4]); const leafCount = Number(e[3]);
    for (let i = 0; i < leafCount; i++) adms.add(first + i);
    h.publications[pub] = { author: e[0], proofKind: str(e[1]), v: str(e[2]), leafCount, firstAdmission: first, r: e[5], s: e[6], nonce: str(e[7]), deadline: str(e[8]), basis: str(e[9]), acceptanceProfile: e[10], indexObligations: e[11], actionsHash: e[12], present: leafCount !== 0 };
  }
  for (const ord of [...adms].sort((a, b) => a - b)) {
    const a = await ob('Ledger', 'ledger', 'admission', [ord]);
    h.admissions[ord] = { kind: str(a[0]), leaf: str(a[1]), publication: str(a[2]), bindingOrdinal: str(a[3]), expectedRevision: str(a[4]), withdrawn: a[5], a: a[6], b: a[7], present: a[0] !== 0n };
  }
  for (const s of new Set(touched.subjects)) h.subjects[s] = str((await ob('Ledger', 'ledger', 'subjectCreatedAt', [s]))[0]);
  for (const k of new Set(touched.bindingKeys)) {
    const hd = await ob('Ledger', 'ledger', 'head', [k]);
    h.heads[k] = { state: str(hd[0]), revision: str(hd[1]), admission: str(hd[2]), previous: str(hd[3]), bindingOrdinal: str(hd[4]), target: hd[5] };
  }
  for (const k of new Set(touched.lists)) {
    const ph = await ob('IndexModule', 'index', 'postingHead', [k]);
    const count = Number(ph[0]);
    const words = [];
    for (let i = 0; i < Math.max(1, Math.ceil(count / 5)); i++) words.push(str((await ob('IndexModule', 'index', 'postingWord', [k, i]))[0]));
    h.lists[k] = { count, live: str(ph[1]), last: str(ph[2]), flags: str(ph[3]), words };
  }
  for (const a of new Set(touched.authors)) {
    h.nonces[a] = str((await ob('Ledger', 'ledger', 'nonces', [a]))[0]);
    h.principals[a] = (await ob('Ledger', 'ledger', 'principalOf', [a]))[0];
  }
  h.consumer = {};
  for (const s of CONSUMER_SLOTS) h.consumer[s] = str((await ob('Consumer', 'consumer', s, []))[0]);
  return h;
}
function assertSealed(baseline, label) {
  for (const [k, v] of Object.entries(baseline.controls)) assert.equal(v.present, false, `${label}: sealed state must not contain control record ${k}`);
  for (const [k, v] of Object.entries(baseline.records)) assert.equal(v.present, false, `${label}: sealed state must not contain the cell's record ${k}`);
  for (const [k, v] of Object.entries(baseline.publications)) assert.equal(v.present, false, `${label}: sealed state must not contain publication ${k}`);
  for (const [k, v] of Object.entries(baseline.consumer)) assert.equal(v, k === 'lastTarget' ? ZERO : '0', `${label}: sealed Consumer slot ${k} must be zero`);
}
// A light probe around a failing transaction (controls, counts, nonces, list heads, Consumer slots): all through observe()
async function stateProbe(ctx, stage, probe, blockNumber) {
  const [authors, typeId, folder] = probe;
  const ob = (nameOf, key, fn, fnArgs) => observe(ctx, ctx.raw, stage, nameOf, key, fn, fnArgs, blockNumber);
  const out = { blockTag: Number(blockNumber), controls: {}, counts: {}, nonces: {}, scopeHeads: {}, byAuthorHeads: {}, byTypeHead: null, consumer: {} };
  for (const [label, f] of Object.entries(FIX)) {
    const t = f.fixture === 'quote' ? T.QUOTE : T.BINARY;
    const r = await ob('Ledger', 'ledger', 'record', [recordId(t, f.bytes)]);
    out.controls[label] = { firstAdmission: str(r[1]), occurrences: str(r[2]) };
  }
  const c = await ob('Ledger', 'ledger', 'counts', []);
  out.counts = { admissions: str(c[0]), records: str(c[1]), bindings: str(c[2]), publications: str(c[3]) };
  const headOf = (h) => ({ count: str(h[0]), live: str(h[1]), last: str(h[2]), flags: str(h[3]) });
  for (const a of authors) {
    if (!a) continue;
    const pid = (await ob('Ledger', 'ledger', 'principalOf', [a.address]))[0];
    out.nonces[a.address] = str((await ob('Ledger', 'ledger', 'nonces', [a.address]))[0]);
    out.scopeHeads[a.address] = headOf(await ob('IndexModule', 'index', 'postingHead', [scopeList(scopeKey(pid, P.FOLDER, folder))]));
    out.byAuthorHeads[a.address] = headOf(await ob('IndexModule', 'index', 'postingHead', [byAuthorList(pid)]));
  }
  out.byTypeHead = headOf(await ob('IndexModule', 'index', 'postingHead', [byTypeList(typeId)]));
  for (const s of CONSUMER_SLOTS) out.consumer[s] = str((await ob('Consumer', 'consumer', s, []))[0]);
  return out;
}
const stripBlock = (probe) => { const { blockTag, ...rest } = probe; return rest; };

// ---------------------------------------------------------------- sealed cells
async function sealedCell(run, label, cell) {
  if (ONLY && !label.includes(ONLY)) { log(`cell ${label}: skipped (--only ${ONLY})`); run.report.skippedCells.push(label); return null; }
  const ctx = makeCtx(run);
  log(`cell ${label}: evm_revert to ${run.sealed}`);
  const rev = await ctx.other('evm_revert', [run.sealed], { label: `${label}: evm_revert` });
  assert.equal(rev.response.result, true, `${label}: evm_revert failed`);
  run.sealed = (await ctx.other('evm_snapshot', [], { label: `${label}: evm_snapshot` })).response.result; // single-use: re-seal
  const latest = await ctx.latestBlock();
  const header = await ctx.blockHeader(latest);
  const nonceLatest = Number((await ctx.other('eth_getTransactionCount', [ctx.deployer.address, 'latest'], { label: 'nonce latest' })).response.result);
  const noncePending = Number((await ctx.other('eth_getTransactionCount', [ctx.deployer.address, 'pending'], { label: 'nonce pending' })).response.result);
  let automine = null;
  try { automine = (await ctx.other('anvil_getAutomine', [], { label: 'automine', allowError: true })).response.result ?? 'unavailable'; } catch (e) { automine = `unavailable: ${e.message}`; }
  if (automine === false) { await ctx.other('evm_setAutomine', [true]); automine = 're-enabled'; }
  const gasPrice = await ctx.setGasPrice();
  log(`cell ${label}: after revert block ${latest} ${header.hash} nonce latest ${nonceLatest} pending ${noncePending} automine ${automine} gasPrice ${gasPrice}; re-sealed as ${run.sealed}`);
  assert.equal(nonceLatest, noncePending, `${label}: pending pool is not empty after revert`);
  const authors = authorsFor(ctx);
  const plan = await cell.plan(ctx, authors, latest);
  plan.touched.authors = [...new Set([...plan.touched.authors, ...plan.authors.filter(Boolean).map((a) => a.address)])];
  log(`cell ${label}: baseline raw harvest at block ${latest} (before the first transaction)`);
  const baseline = await harvest(ctx, 'baseline', plan.touched, latest);
  assertSealed(baseline, label);
  const rec = {
    label, standing: cell.standing ?? 'receipt diagnostic', sealedSnapshot: run.sealed,
    afterRevert: { blockNumber: latest, blockHash: header.hash, timestamp: Number(header.timestamp), nonceLatest, noncePending, automine, gasPrice: str(gasPrice) },
    plan: plan.summary ?? null,
    baselineRaw: ctx.baselineRaw, raw: ctx.raw, transactions: ctx.txs, blocks: ctx.blocks, rpcOther: ctx.rpcOther,
    candidateDecoded: { standing: 'decoded by this script from the retained bytes; candidate claims, never expected answers', baseline, post: null },
    rows: null, rowLog: ctx.rowLog, consumerChecks: ctx.consumerChecks, mismatches: 0, error: null,
  };
  run.report.cells[label] = rec;
  ctx.persist = () => persist(run.report); // every mined transaction lands on disk before the next step
  persist(run.report);
  try {
    log(`cell ${label}: body`);
    rec.rows = await cell.body(ctx, authors, plan);
    const last = await ctx.latestBlock();
    log(`cell ${label}: post raw harvest at block ${last}`);
    rec.candidateDecoded.post = await harvest(ctx, 'post', plan.touched, last); // persisted BEFORE the next cell's evm_revert
    log(`cell ${label}: done (${ctx.txs.length} txs, ${ctx.raw.length} raw reads incl. ${ctx.baselineRaw.length} baseline, ${ctx.mismatches} check mismatches)`);
  } catch (e) {
    log(`cell ${label}: FAILED ${e.message}`);
    rec.error = { message: String(e.message), stack: String(e.stack).split('\n').slice(0, 6) };
    throw e;
  } finally {
    rec.mismatches = ctx.mismatches;
    persist(run.report);
  }
  return rec;
}
function persist(report) {
  report.persistedAt = new Date().toISOString();
  report.anvil = { ...anvilInfo };
  writeFileSync(OUT_JSON, JSON.stringify(report, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
}

// ---------------------------------------------------------------- checks (candidate-side self-checks; never independent)
// Every stored Consumer slot is retained at the transaction's receipt block so all readback fields
// share one observation basis. Interpretation belongs to the independent checker, not this runner.
async function consumerCheck(ctx, row, expected) {
  const actual = {};
  for (const s of CONSUMER_SLOTS) actual[s] = str((await observe(ctx, ctx.raw, `readback:${row.label}`, 'Consumer', 'consumer', s, [], row.block))[0]);
  const compared = {};
  let match = true;
  const norm = (v) => (typeof v === 'string' ? v.toLowerCase() : String(v));
  for (const [k, v] of Object.entries(expected)) { const equal = norm(v) === norm(actual[k]); compared[k] = { expected: norm(v), actual: norm(actual[k]), equal }; if (!equal) match = false; }
  if (!match) ctx.mismatches++;
  const check = { label: `${row.label}/readback`, kind: 'stored-slots', standing: CAVEAT_EXPECTED, block: row.block, slotsAtReceiptBlock: CONSUMER_SLOTS, slotsOneBlockLater: [], laterBlock: null, expected: Object.fromEntries(Object.entries(expected).map(([k, v]) => [k, norm(v)])), actual, compared, match };
  ctx.consumerChecks.push(check);
  log(`  chk  ${check.label}: ${match ? 'match' : 'MISMATCH ' + JSON.stringify(compared)}`);
  return check;
}
// Stateless consumers: the commitment is read from the receipt log AND from an eth_call replay of the same calldata at the receipt block
async function commitmentCheck(ctx, row, nameOf, key, expected) {
  const tx = ctx.txs[row.txIndex];
  const ifc = iface(nameOf);
  const logs = tx.receipt.logs.filter((l) => l.address.toLowerCase() === ctx.addrs[key].toLowerCase()).map((l) => { try { return ifc.parseLog({ topics: l.topics, data: l.data }); } catch { return null; } }).filter(Boolean);
  const fromLog = logs.length === 1 ? { commitment: logs[0].args.commitment, evidence: logs[0].args.evidenceCommitment ?? null } : null;
  const replay = await observeRaw(ctx, ctx.raw, `consumer-replay:${row.label}`, { contract: nameOf, fn: tx.candidateInputs.fn, args: tx.candidateInputs.args }, tx.to, tx.data, row.block);
  let fromReplay = null;
  try { const d = ifc.decodeFunctionResult(tx.candidateInputs.fn, replay.returnData); fromReplay = { commitment: d[0], evidence: d.length > 1 ? d[1] : null }; } catch (e) { fromReplay = { error: String(e.message) }; }
  const norm = (v) => (v == null ? null : String(v).toLowerCase());
  const exp = { commitment: norm(expected.commitment), evidence: expected.evidence === undefined ? undefined : norm(expected.evidence) };
  const eq = (o) => !!o && norm(o.commitment) === exp.commitment && (exp.evidence === undefined || norm(o.evidence) === exp.evidence);
  const match = eq(fromLog) && eq(fromReplay);
  if (!match) ctx.mismatches++;
  const check = { label: `${row.label}/commitment`, kind: 'commitment', standing: CAVEAT_EXPECTED, block: row.block, expected: exp, fromLog, fromReplay, logCount: logs.length, replayRpcId: replay.rpcId, match };
  ctx.consumerChecks.push(check);
  log(`  chk  ${check.label}: ${match ? 'match' : 'MISMATCH ' + JSON.stringify({ exp, fromLog, fromReplay })}`);
  return check;
}
// A failure row: capture the revert selector with a static eth_call (retained), mine the reverting
// transaction, and prove the state probe is unchanged across it.
async function failureRow(ctx, label, c, expectedError, probe) {
  const [errContract, errName] = Array.isArray(expectedError) ? expectedError : ['Ledger', expectedError];
  const preBlock = await ctx.latestBlock();
  const pre = await stateProbe(ctx, `failure-pre:${label}`, probe, preBlock);
  const expectedSelector = errorSelector(errContract, errName);
  log(`  row  ${label}: static call for the revert selector`);
  const st = await observeRaw(ctx, ctx.raw, `failure-static:${label}`, c, c.to, c.data, preBlock, { allowError: true });
  let observedSelector = 'no-revert';
  let observedData = null;
  if (st.error) {
    observedData = typeof st.error.data === 'string' ? st.error.data : (st.error.data?.data ?? JSON.stringify(st.error.data ?? null));
    observedSelector = typeof observedData === 'string' && observedData.startsWith('0x') ? observedData.slice(0, 10) : String(observedData);
  }
  const row = await send(ctx, () => c, label, { expectFail: true, gasLimit: FAIL_GAS });
  const post = await stateProbe(ctx, `failure-post:${label}`, probe, row.block);
  const unchanged = JSON.stringify(stripBlock(pre)) === JSON.stringify(stripBlock(post));
  return { ...row, expectedError: `${errContract}.${errName}`, expectedSelector, observedSelector, observedRevertData: observedData, selectorMatch: observedSelector === expectedSelector, stateUnchanged: unchanged, standing: 'selector from a retained static eth_call; the mined receipt establishes reversion, not the selector', pre, post };
}
const baseCount = (ctx, k) => { assert(ctx.baselineCounts && ctx.baselineCounts[k] !== undefined, `${ctx.cellLabel}: baseline counts missing (${k}); the sealed baseline harvest must precede the body`); return Number(ctx.baselineCounts[k]); };
const baseNonce = (ctx, addr) => { assert(ctx.baselineNonces && ctx.baselineNonces[addr] !== undefined, `${ctx.cellLabel}: baseline nonce missing for ${addr}`); return Number(ctx.baselineNonces[addr]); };
const STORING = 'includes Consumer SSTOREs (first read of a slot: fresh; later reads: rewrites); not pure Lens overhead';
const STATELESS = 'stateless consumer: no storage writes; one LOG2 (ESTIMATED ~1.5–1.9k gas) is the only overhead beyond the read';
const pubsNow = async (ctx, stage) => Number((await observe(ctx, ctx.raw, stage, 'Ledger', 'ledger', 'counts', [], await ctx.latestBlock()))[3]);

// ---------------------------------------------------------------- the ingress x multiplicity cells (32-byte / 41-byte hash-placement diagnostics)
function matrixCell(cellName, fixture, pick, opts = {}) {
  return {
    standing: 'hash-placement diagnostic (names are hashes); NOT a matched Files create',
    plan: async (ctx, a, block) => matrixPlan(ctx, cellName, fixture, ...pick(a), block, opts),
    body: async (ctx, a, plan) => runCell(ctx, plan, opts),
  };
}
async function matrixPlan(ctx, cellName, fixture, primary, secondary, block, opts) {
  const f1 = fixture === 'quote' ? FIX.quote3000 : FIX.file41a;
  const f2 = fixture === 'quote' ? FIX.quote3100 : FIX.file41b;
  const typeId = fixture === 'quote' ? T.QUOTE : T.BINARY;
  const salt = keccak256(toUtf8Bytes(`${cellName}/${fixture}`));
  const pidP = await principalOf(ctx, primary.address, block, true);
  const pidS = secondary ? await principalOf(ctx, secondary.address, block, true) : null;
  const subj = subjectId(pidP, salt); // origin-qualified for contract authors
  const folder = name(`/${cellName}/${fixture}`);
  const nameHash = name('entry');
  const r1 = recordId(typeId, f1.bytes); const r2 = recordId(typeId, f2.bytes);
  const headPos = position(P.HEAD, subj, ZERO); const placePos = position(P.FOLDER, folder, nameHash);
  const touched = emptyTouched();
  touched.records.push(r1, r2); touched.subjects.push(subj);
  const keysOf = (pid) => [binding(pid, headPos), binding(pid, placePos)];
  const listsOf = (pid) => [historyList(binding(pid, headPos)), historyList(binding(pid, placePos)), scopeList(scopeKey(pid, P.FOLDER, folder)), scopeList(scopeKey(pid, P.HEAD, subj)), byAuthorList(pid)];
  touched.bindingKeys.push(...keysOf(pidP)); touched.lists.push(byTypeList(typeId), ...listsOf(pidP), backlinkList(r1), backlinkList(r2), backlinkList(subj));
  if (pidS) { touched.bindingKeys.push(...keysOf(pidS)); touched.lists.push(...listsOf(pidS)); }
  touched.plannedPublications = secondary ? 3 : 2;
  touched.plannedAdmissions = secondary ? 9 : 6;
  return {
    authors: [primary, secondary], touched, cellName, fixture, primary, secondary, typeId, f1, f2, salt, subj, folder, nameHash, r1, r2, headPos, placePos, pidP, pidS,
    summary: { cellName, fixture, typeId, subject: subj, folder, nameHash, r1, r2, headPos, placePos, primary: { address: primary.address, kind: primary.kind, principal: pidP }, secondary: secondary ? { address: secondary.address, kind: secondary.kind, principal: pidS } : null, noIndex: !!opts.noIndex },
  };
}
async function runCell(ctx, plan, opts = {}) {
  const { cellName, fixture, primary, secondary, typeId, f1, f2, salt, subj, folder, nameHash, r1, r2, headPos, touched } = plan;
  const rows = [];
  const adm0 = baseCount(ctx, 'admissions'); // from the retained baseline decode
  const tag = `${cellName}/${fixture}`;
  // create = one logical action: subject + record + head + placement
  rows.push(await send(ctx, () => primary.build([aCreate(salt), aPublish(typeId, f1.bytes), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], ['0x', f1.bytes, '0x', '0x']), `${tag}/create`, { extra: { standing: 'hash-placement diagnostic create (4 actions); name is a hash' } }));
  const pub1 = await pubsNow(ctx, 'progress');
  touched.publications.push(pub1);
  const rec = await observe(ctx, ctx.raw, 'reconstruct', 'Reconstructor', 'recon', 'reconstruct', [ctx.addrs.ledger, pub1], await ctx.latestBlock());
  rows.push({ label: `${tag}/reconstruct-create`, publication: pub1, matches: rec[4], recovered: rec[3], status: 'eth_call', note: CAVEAT_RECON });
  // edit = fresh body + CAS head rebind
  rows.push(await send(ctx, () => primary.build([aPublish(typeId, f2.bytes), aBind(P.HEAD, subj, ZERO, r2, 1)], [f2.bytes, '0x']), `${tag}/edit`));
  touched.publications.push(await pubsNow(ctx, 'progress'));
  let lensArr = [primary.address];
  if (secondary) {
    rows.push(await send(ctx, () => secondary.build([aPublish(typeId, f1.bytes), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], [f1.bytes, '0x', '0x']), `${tag}/create-competing`));
    touched.publications.push(await pubsNow(ctx, 'progress'));
    lensArr = [primary.address, secondary.address];
  }
  // admission ordinals of this cell (relative to the sealed frontier): create 1..4 (head bind = +3), edit 5,6 (head rebind = +6), competing 7,8,9 (head = +8)
  const headA1 = adm0 + 3, headA2 = adm0 + 6, headB = adm0 + 8;
  // ---- STATELESS paid reads first (untouched state; no storage component)
  let row;
  const sc = (fn, fnArgs) => () => call(ctx, 'StatelessConsumer', 'statelessConsumer', fn, fnArgs);
  if (fixture === 'quote') {
    row = await send(ctx, sc('commitQuote', [lensArr, P.HEAD, subj, ZERO]), `${tag}/read-resolve-stateless`, { extra: { storage: STATELESS } });
    await commitmentCheck(ctx, row, 'StatelessConsumer', 'statelessConsumer', { commitment: twinQuote(1, r2, 2, headA2, f2.value) });
  } else {
    row = await send(ctx, sc('commitHead', [lensArr, P.HEAD, subj, ZERO]), `${tag}/read-resolve-stateless`, { extra: { storage: STATELESS } });
    await commitmentCheck(ctx, row, 'StatelessConsumer', 'statelessConsumer', { commitment: twinHead(1, r2, 2, headA2) });
  }
  rows.push(row);
  if (secondary) {
    row = await send(ctx, sc('commitHead', [[secondary.address, primary.address], P.HEAD, subj, ZERO]), `${tag}/read-resolve-second-first-stateless`, { extra: { storage: STATELESS } });
    await commitmentCheck(ctx, row, 'StatelessConsumer', 'statelessConsumer', { commitment: twinHead(1, r1, 1, headB) });
    rows.push(row);
  }
  if (!opts.noIndex) {
    row = await send(ctx, sc('commitList', [lensArr, P.FOLDER, folder, 16]), `${tag}/read-list-stateless`, { extra: { storage: STATELESS } });
    await commitmentCheck(ctx, row, 'StatelessConsumer', 'statelessConsumer', { commitment: twinList(2, 1, secondary ? 2 : 1) });
    rows.push(row);
    row = await send(ctx, sc('commitHistory', [primary.address, headPos, headA1]), `${tag}/read-history-asof-older-stateless`, { extra: { storage: STATELESS, asOf: headA1, standing: 'as-of a STRICTLY OLDER basis (the first head bind) while the rebind exists: must return revision 1' } });
    await commitmentCheck(ctx, row, 'StatelessConsumer', 'statelessConsumer', { commitment: twinHistory(1, r1, 1, headA1) });
    rows.push(row);
    row = await send(ctx, sc('commitHistory', [primary.address, headPos, 1_000_000]), `${tag}/read-history-asof-latest-stateless`, { extra: { storage: STATELESS, asOf: 1_000_000, standing: 'as-of a basis beyond the frontier: the latest retained revision' } });
    await commitmentCheck(ctx, row, 'StatelessConsumer', 'statelessConsumer', { commitment: twinHistory(1, r2, 2, headA2) });
    rows.push(row);
  }
  // ---- STORING paid reads (LabHarness.Consumer): receipt gas INCLUDES the Consumer's own SSTOREs
  const cc = (fn, fnArgs) => () => call(ctx, 'Consumer', 'consumer', fn, fnArgs);
  if (fixture === 'quote') {
    row = await send(ctx, cc('readQuote', [lensArr, P.HEAD, subj, ZERO]), `${tag}/read-resolve`, { extra: { storage: STORING } });
    await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r2, lastRevision: 2, lastAdmission: headA2, lastValue: f2.value });
  } else {
    row = await send(ctx, cc('readHead', [lensArr, P.HEAD, subj, ZERO]), `${tag}/read-resolve`, { extra: { storage: STORING } });
    await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r2, lastRevision: 2, lastAdmission: headA2 });
  }
  rows.push(row);
  if (secondary) {
    row = await send(ctx, cc('readHead', [[secondary.address, primary.address], P.HEAD, subj, ZERO]), `${tag}/read-resolve-second-first`, { extra: { storage: STORING } });
    await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r1, lastRevision: 1, lastAdmission: headB });
    rows.push(row);
  }
  rows.push(await estimateRow(ctx, `${tag}/eth_call-resolve-estimate`, call(ctx, 'LensReader', 'lens', 'resolve', [lensArr, P.HEAD, subj, ZERO])));
  if (opts.noIndex) return rows; // without the module, list/history are UNKNOWN by construction (not measured as reads)
  row = await send(ctx, cc('readList', [lensArr, P.FOLDER, folder, 16]), `${tag}/read-list`, { extra: { storage: STORING } });
  await consumerCheck(ctx, row, { lastStatus: 2, lastCount: 1, lastScanned: secondary ? 2 : 1 }); // the shared name is ONE selected entry
  rows.push(row);
  row = await send(ctx, cc('readHistory', [primary.address, headPos, headA1]), `${tag}/read-history-asof-older`, { extra: { storage: STORING, asOf: headA1, standing: 'as-of a STRICTLY OLDER basis (the first head bind) while the rebind exists: must return revision 1' } });
  await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r1, lastRevision: 1, lastAdmission: headA1 });
  rows.push(row);
  row = await send(ctx, cc('readHistory', [primary.address, headPos, 1_000_000]), `${tag}/read-history-asof`, { extra: { storage: STORING, asOf: 1_000_000, standing: 'as-of a basis beyond the frontier: the latest retained revision, kept as a separate row' } });
  await consumerCheck(ctx, row, { lastStatus: 1, lastTarget: r2, lastRevision: 2, lastAdmission: headA2 });
  rows.push(row);
  return rows;
}

// ---------------------------------------------------------------- freshness cells: each its own sealed cell from the SAME post-setup snapshot; never subtracted
function freshPlan(variant) {
  return async (ctx, a, block) => {
    const body = FIX.quote3000.bytes;
    const id = recordId(T.QUOTE, body);
    const pidA = await principalOf(ctx, a.nativeA.address, block, true);
    const touched = emptyTouched();
    touched.records.push(id);
    touched.lists.push(byTypeList(T.QUOTE), byAuthorList(pidA));
    touched.plannedPublications = variant === 'contract-existing-body' ? 2 : 1;
    touched.plannedAdmissions = touched.plannedPublications;
    const authors = variant === 'contract-existing-body' ? [a.signedA, a.nativeA] : [a.nativeA, null];
    if (variant === 'contract-existing-body') touched.lists.push(byAuthorList(await principalOf(ctx, a.signedA.address, block, true)));
    return { authors, touched, variant, body, id, summary: { variant, recordId: id, body, shape: 'Actor.executeWithNonce([PUBLISH QUOTE quote3000]) — one publish action, explicit nonce, identical across the three fresh cells' } };
  };
}
async function freshBody(ctx, a, plan) {
  const { variant, body, id } = plan;
  const rows = [];
  const actions = [aPublish(T.QUOTE, body)];
  const probe = [[a.nativeA], T.QUOTE, name('/none')];
  const nonceA = baseNonce(ctx, a.nativeA.address);
  const preAbsence = { label: `fresh/${variant}/pre-absence`, recordId: id, standing: 'established by the retained baseline raw reply of Ledger.record(id) at the after-revert block (baselineRaw), not by this row', firstAdmission: ctx.baselineRecords[id].firstAdmission, occurrences: ctx.baselineRecords[id].occurrences };
  rows.push(preAbsence);
  if (variant === 'contract-fresh-body') {
    rows.push(await send(ctx, () => a.nativeA.buildWithNonce(actions, [body], nonceA), 'fresh/contract-fresh-body (producer contract publishes quote3000; Record absent at the sealed baseline)', { extra: { regime: 'cold access set; by-Type QUOTE list and the producer by-author list are EMPTY (sealed state)' } }));
    touchedPubs(ctx, plan);
  } else if (variant === 'contract-existing-body') {
    rows.push(await send(ctx, () => a.signedA.build(actions, [body]), 'fresh/contract-existing-body/setup: the EOA admits the identical bytes first (signed; its cost is NOT the measured row)'));
    touchedPubs(ctx, plan);
    const mid = await observe(ctx, ctx.raw, 'pre-presence', 'Ledger', 'ledger', 'record', [id], await ctx.latestBlock());
    assert.equal(str(mid[2]), '1', 'pre-presence: exactly one occurrence before the producer publishes');
    rows.push({ label: `fresh/${variant}/pre-presence`, recordId: id, firstAdmission: str(mid[1]), occurrences: str(mid[2]), standing: 'retained raw reply (stage pre-presence) of Ledger.record(id) at the block before the measured write' });
    rows.push(await send(ctx, () => a.nativeA.buildWithNonce(actions, [body], nonceA), 'fresh/contract-existing-body (producer contract publishes the same bytes: new occurrence and admission, no new Record)', { extra: { regime: 'cold access set; by-Type QUOTE list already has ONE entry (the EOA admission); the producer by-author list is EMPTY. Different initialized state from contract-fresh-body: report side by side, never subtract' } }));
    touchedPubs(ctx, plan);
    const post = await observe(ctx, ctx.raw, 'post-presence', 'Ledger', 'ledger', 'record', [id], await ctx.latestBlock());
    rows.push({ label: `fresh/${variant}/post-presence`, recordId: id, firstAdmission: str(post[1]), occurrences: str(post[2]) });
  } else if (variant === 'exact-retry') {
    rows.push(await send(ctx, () => a.nativeA.buildWithNonce(actions, [body], nonceA), 'fresh/exact-retry/setup: first admission under the explicit nonce (same shape as contract-fresh-body; not the measured row)'));
    touchedPubs(ctx, plan);
    rows.push(await failureRow(ctx, 'fresh/exact-retry (identical actions, bodies and nonce: reverts AlreadyAdmitted, no new rows)', a.nativeA.buildWithNonce(actions, [body], nonceA), 'AlreadyAdmitted', probe));
  }
  return rows;
}
function touchedPubs(ctx, plan) { plan.touched.publications.push(baseCount(ctx, 'publications') + plan.touched.publications.length + 1); }

// ---------------------------------------------------------------- failure rows (sealed cell)
const failureCell = {
  standing: 'expected-failure rows: selector from a static call, reversion from the receipt, rollback from an unchanged probe',
  plan: async (ctx, a, block) => {
    const touched = emptyTouched();
    const items = [zeroPadValue(toBeHex(1n), 32), zeroPadValue(toBeHex(2n), 32)];
    const ids = items.map((b) => recordId(T.ITEM, b));
    const pair = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], ids[1], 1n]);
    const q99 = zeroPadValue(toBeHex(99n), 32);
    const pidA = await principalOf(ctx, a.nativeA.address, block, true);
    const key = binding(pidA, position(P.HEAD, name('x'), ZERO));
    touched.records.push(...ids, recordId(T.PAIR, pair), recordId(T.QUOTE, q99));
    touched.bindingKeys.push(key);
    touched.lists.push(byTypeList(T.PAIR), byTypeList(T.ITEM), byTypeList(T.QUOTE), byAuthorList(pidA), historyList(key), backlinkList(ids[0]));
    touched.plannedPublications = 5; touched.plannedAdmissions = 5;
    return { authors: [a.nativeA, null], touched, items, ids, pair, q99, key, summary: { items: ids, pair: recordId(T.PAIR, pair), wrongTypeTarget: recordId(T.QUOTE, q99) } };
  },
  body: async (ctx, a, plan) => {
    const { items, ids, pair, q99 } = plan;
    const probe = [[a.nativeA], T.PAIR, name('/none')];
    const rows = [];
    const pubA = (fn, fnArgs) => () => call(ctx, 'Actor', 'actorA', fn, fnArgs);
    rows.push(await send(ctx, pubA('publish', [T.ITEM, items[0]]), 'failure/setup: ITEM_ETH'));
    rows.push(await send(ctx, pubA('publish', [T.ITEM, items[1]]), 'failure/setup: ITEM_USDC'));
    rows.push(await send(ctx, pubA('publish', [T.PAIR, pair]), 'failure/setup: PAIR_ETH_USDC (two checked refs)'));
    // a PRESENT wrong-Type target: admit a QUOTE record first and retain its presence
    const wrongId = recordId(T.QUOTE, q99);
    rows.push(await send(ctx, pubA('publish', [T.QUOTE, q99]), 'failure/setup: admit a QUOTE record as the present wrong-Type target'));
    const present = await observe(ctx, ctx.raw, 'wrong-type-presence', 'Ledger', 'ledger', 'record', [wrongId], await ctx.latestBlock());
    assert.notEqual(present[1], 0n, 'wrong-Type target must be present');
    rows.push({ label: 'failure/wrong-Type target presence', recordId: wrongId, typeId: T.QUOTE, firstAdmission: str(present[1]), standing: 'retained raw reply (stage wrong-type-presence)' });
    const wrong = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], wrongId, 1n]);
    rows.push(await failureRow(ctx, 'failure/checked-ref-wrong-Type (present target of another Type)', call(ctx, 'Actor', 'actorA', 'publish', [T.PAIR, wrong]), 'E_REF_TYPE', probe));
    const missing = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], name('nowhere'), 1n]);
    rows.push(await failureRow(ctx, 'failure/checked-ref-missing-target', call(ctx, 'Actor', 'actorA', 'publish', [T.PAIR, missing]), 'E_REF_MISSING', probe));
    rows.push(await send(ctx, pubA('bind', [P.HEAD, name('x'), ZERO, ids[0], 0]), 'failure/setup: bind (revision becomes 1)'));
    rows.push(await failureRow(ctx, 'failure/stale-CAS (expected 0, head is 1)', call(ctx, 'Actor', 'actorA', 'bind', [P.HEAD, name('x'), ZERO, ids[0], 0]), 'E_CAS', probe));
    rows.push(await send(ctx, () => call(ctx, 'MockAcceptor', 'acceptor', 'set', [1, 0]), 'failure/setup: acceptor rejects'));
    rows.push(await failureRow(ctx, 'failure/failed-acceptance (whole publication reverts)', call(ctx, 'Actor', 'actorA', 'publish', [T.QUOTE, zeroPadValue(toBeHex(5n), 32)]), 'E_REJECTED', probe));
    rows.push(await send(ctx, () => call(ctx, 'MockAcceptor', 'acceptor', 'set', [0, 0]), 'failure/setup: acceptor accepts'));
    rows.push(await send(ctx, () => call(ctx, 'Ledger', 'ledger', 'setIndexModule', [ctx.addrs.failingIndex]), 'failure/setup: attach the always-refusing index module'));
    rows.push(await failureRow(ctx, 'failure/failed-mandatory-index (whole publication reverts)', call(ctx, 'Actor', 'actorA', 'publish', [T.QUOTE, zeroPadValue(toBeHex(6n), 32)]), 'E_INDEX', probe));
    rows.push(await send(ctx, () => call(ctx, 'Ledger', 'ledger', 'setIndexModule', [ctx.addrs.index]), 'failure/setup: re-attach the index module'));
    return rows;
  },
};

// ---------------------------------------------------------------- the joined QUOTE/Pair journey (sdk-fixture steps 1–6), one sealed cell
const joinedCell = {
  standing: 'typed joined journey (sdk-fixture steps 1–6): checked references, mandatory acceptance, signed + native authorship, three lenses, stateless consumer, move/replace/remove/restore. Steps 7 (partly), 8, 9, 10 NOT run.',
  plan: async (ctx, a, block) => {
    const iA = coder.encode(['uint256'], [1n]); const iB = coder.encode(['uint256'], [2n]);
    const itemA = recordId(T.ITEM, iA); const itemB = recordId(T.ITEM, iB);
    const pairBody = coder.encode(['bytes32', 'bytes32', 'uint256'], [itemA, itemB, 1n]);
    const pairId = recordId(T.PAIR, pairBody);
    const pidA = await principalOf(ctx, a.signedA.address, block, true);
    const pidB = await principalOf(ctx, a.nativeB.address, block, true);
    const pidOp = await principalOf(ctx, a.nativeA.address, block, true);
    const salt = keccak256(toUtf8Bytes('joined/FILE_QUOTE')); const saltG = keccak256(toUtf8Bytes('joined/FILE_REPLACEMENT'));
    const subj = subjectId(pidA, salt); const subjG = subjectId(pidA, saltG);
    const gBody = hexlify(toUtf8Bytes('replacement')); const rg = recordId(T.BINARY, gBody);
    const q1 = quoteBody(pairId, J.mantissaA1), q2 = quoteBody(pairId, J.mantissaA2), q3 = quoteBody(pairId, J.mantissaB1);
    const a1 = recordId(T.QUOTE_J, q1), a2 = recordId(T.QUOTE_J, q2), b1 = recordId(T.QUOTE_J, q3);
    const swaps = name('/swaps'), markets = name('/markets'), nameHash = name('eth-usdc'), market = name('market');
    const headPos = position(P.HEAD, subj, ZERO), swapsPos = position(P.FOLDER, swaps, nameHash), marketsPos = position(P.FOLDER, markets, nameHash), tagPos = position(P.TAG, subj, market), headPosG = position(P.HEAD, subjG, ZERO);
    const keys = { aHead: binding(pidA, headPos), aSwaps: binding(pidA, swapsPos), aMarkets: binding(pidA, marketsPos), aTag: binding(pidA, tagPos), bHead: binding(pidB, headPos), aHeadG: binding(pidA, headPosG) };
    const touched = emptyTouched();
    touched.records.push(itemA, itemB, pairId, a1, a2, b1, rg);
    touched.subjects.push(subj, subjG);
    touched.bindingKeys.push(...Object.values(keys));
    touched.lists.push(byTypeList(T.ITEM), byTypeList(T.PAIR), byTypeList(T.QUOTE_J), byTypeList(T.BINARY), byAuthorList(pidA), byAuthorList(pidB), byAuthorList(pidOp),
      scopeList(scopeKey(pidA, P.FOLDER, swaps)), scopeList(scopeKey(pidA, P.FOLDER, markets)), scopeList(scopeKey(pidA, P.TAG, subj)), scopeList(scopeKey(pidA, P.HEAD, subj)), scopeList(scopeKey(pidB, P.HEAD, subj)), scopeList(scopeKey(pidA, P.HEAD, subjG)),
      ...Object.values(keys).map(historyList), ...[a1, a2, b1, subj, subjG, rg, pairId, itemA, itemB].map(backlinkList));
    touched.plannedPublications = 8; touched.plannedAdmissions = 20;
    const fixtureMap = { ITEM_ETH: { body: iA, id: itemA }, ITEM_USDC: { body: iB, id: itemB }, PAIR_ETH_USDC: { body: pairBody, id: pairId }, FILE_QUOTE: { salt, subject: subj, creator: pidA }, FILE_REPLACEMENT: { salt: saltG, subject: subjG, body: gBody, record: rg }, QUOTE_A1: { body: q1, id: a1 }, QUOTE_A2: { body: q2, id: a2 }, QUOTE_B1: { body: q3, id: b1 }, NOTE_BYTES: J.noteBytes, noteCommitment: NOTE_COMMITMENT, AUTHOR_A: { address: a.signedA.address, kind: 'signed', principal: pidA }, AUTHOR_B: { address: a.nativeB.address, kind: 'native (Actor contract)', principal: pidB }, operator: { address: a.nativeA.address, principal: pidOp, role: 'admits ITEM/PAIR in step 1' }, TAG_MARKET: { purpose: P.TAG, subject: subj, concept: market, target: subj }, positions: { headPos, swapsPos, marketsPos, tagPos, headPosG }, bindingKeys: keys, lenses: { LENS_A_FIRST: [a.signedA.address, a.nativeB.address], LENS_B_FIRST: [a.nativeB.address, a.signedA.address], LENS_NO_TIEBREAK: 'resolveNoTiebreak([A, B])' } };
    return { authors: [a.signedA, a.nativeB, a.nativeA], touched, iA, iB, itemA, itemB, pairBody, pairId, pidA, pidB, salt, saltG, subj, subjG, gBody, rg, q1, q2, q3, a1, a2, b1, swaps, markets, nameHash, market, headPos, swapsPos, marketsPos, tagPos, keys, summary: fixtureMap };
  },
  body: async (ctx, a, plan) => {
    const { iA, iB, itemA, itemB, pairBody, pairId, salt, saltG, subj, subjG, gBody, rg, q1, q2, q3, a1, a2, b1, swaps, markets, nameHash, market, headPos, swapsPos, marketsPos, touched } = plan;
    const rows = [];
    const adm0 = baseCount(ctx, 'admissions'); const pub0 = baseCount(ctx, 'publications');
    const A = a.signedA.address, B = a.nativeB.address;
    const ab = [A, B], ba = [B, A];
    const jc = (fn, fnArgs) => () => call(ctx, 'JoinedConsumer', 'joinedConsumer', fn, fnArgs);
    const consumerRow = async (label, fn, fnArgs, expected, extra = {}) => {
      const row = await send(ctx, jc(fn, fnArgs), label, { extra: { consumer: 'JoinedConsumer (stateless; one LOG2 ESTIMATED ~1.9k gas; verifies Type/shape, Pair -> two ITEMs, author/evidence kind)', ...extra } });
      await commitmentCheck(ctx, row, 'JoinedConsumer', 'joinedConsumer', expected);
      rows.push(row);
      return row;
    };
    // step 1
    rows.push(await send(ctx, () => a.nativeA.build([aPublish(T.ITEM, iA), aPublish(T.ITEM, iB), aPublish(T.PAIR, pairBody)], [iA, iB, pairBody]), 'joined/step1/admit-items-and-pair (native batch by the operator; I -> O ordered prefix; PAIR refs checked at admission)'));
    touched.publications.push(pub0 + 1);
    // step 2: AUTHOR_A signed — create FILE_QUOTE, QUOTE_A1, head, /swaps placement, market tag
    rows.push(await send(ctx, () => a.signedA.build([aCreate(salt), aPublish(T.QUOTE_J, q1), aBind(P.HEAD, subj, ZERO, a1, 0), aBind(P.FOLDER, swaps, nameHash, subj, 0), aBind(P.TAG, subj, market, subj, 0)], ['0x', q1, '0x', '0x', '0x']), 'joined/step2/QUOTE_A1 (signed: create FILE_QUOTE + publish + head + /swaps placement + market tag)'));
    touched.publications.push(pub0 + 2);
    const rec = await observe(ctx, ctx.raw, 'reconstruct', 'Reconstructor', 'recon', 'reconstruct', [ctx.addrs.ledger, pub0 + 2], await ctx.latestBlock());
    rows.push({ label: 'joined/step2/reconstruct-A1', publication: pub0 + 2, matches: rec[4], recovered: rec[3], status: 'eth_call', note: CAVEAT_RECON });
    // step 3: QUOTE_A2 with CAS against revision 1
    rows.push(await send(ctx, () => a.signedA.build([aPublish(T.QUOTE_J, q2), aBind(P.HEAD, subj, ZERO, a2, 1)], [q2, '0x']), 'joined/step3/QUOTE_A2 (signed, CAS against revision 1)'));
    touched.publications.push(pub0 + 3);
    // step 4: QUOTE_B1 from the real producer contract (no EOA signature exists)
    rows.push(await send(ctx, () => a.nativeB.build([aPublish(T.QUOTE_J, q3), aBind(P.HEAD, subj, ZERO, b1, 0)], [q3, '0x']), 'joined/step4/QUOTE_B1 (native: the producer contract originates it; evidence proofKind 1)'));
    touched.publications.push(pub0 + 4);
    // step 5: three lenses at one sealed basis, paid through the stateless consumer; browser-shaped eth_calls retained
    const basis1 = adm0 + 12;
    await consumerRow('joined/step5/consumer/point-a-first (paid, stateless)', 'readPoint', [ab, subj], { commitment: pointCommitment(pairId, J.mantissaA2, 2, ab, basis1), evidence: pointEvidence(itemA, itemB, A, pub0 + 3, adm0 + 10, 2, a2) }, { lens: 'LENS_A_FIRST', expects: 'QUOTE_A2, author kind 2 (signed)' });
    await consumerRow('joined/step5/consumer/point-b-first (paid, stateless)', 'readPoint', [ba, subj], { commitment: pointCommitment(pairId, J.mantissaB1, 1, ba, basis1), evidence: pointEvidence(itemA, itemB, B, pub0 + 4, adm0 + 12, 1, b1) }, { lens: 'LENS_B_FIRST', expects: 'QUOTE_B1, author kind 1 (native contract)' });
    rows.push(await failureRow(ctx, 'joined/step5/consumer/point-no-tiebreak (CONFLICT: reverts, exposes no quote)', call(ctx, 'JoinedConsumer', 'joinedConsumer', 'readPointNoTiebreak', [ab, subj]), ['JoinedConsumer', 'Conflict'], [[a.signedA, a.nativeB], T.QUOTE_J, swaps]));
    const nt = await observe(ctx, ctx.raw, 'browser', 'LensReader', 'lens', 'resolveNoTiebreak', [ab, P.HEAD, subj, ZERO], await ctx.latestBlock());
    rows.push({ label: 'joined/step5/eth_call/resolveNoTiebreak', status: str(nt[0]), candidates: nt[1].length, standing: 'browser-shaped eth_call, retained; expected status 3 (CONFLICT) with 2 candidates', expected: { status: '3', candidates: 2 } });
    rows.push(await estimateRow(ctx, 'joined/step5/eth_call-resolve-estimate-a-first', call(ctx, 'LensReader', 'lens', 'resolve', [ab, P.HEAD, subj, ZERO]), { standing: 'lens-only figure beside the consumer receipt; the difference is the consumer overhead — reported, never subtracted' }));
    await consumerRow('joined/step5/consumer/list-swaps (paid, stateless)', 'readList', [ab, swaps, 16], { commitment: listCommitment([{ position: swapsPos, author: A, target: subj, revision: 1, admission: adm0 + 7 }], 1, ab, basis1) }, { lens: 'LENS_A_FIRST', expects: 'one selected entry: FILE_QUOTE' });
    await consumerRow('joined/step5/consumer/list-swaps-tagged-market (paid, stateless)', 'readListTagged', [ab, swaps, market, 16], { commitment: taggedCommitment([subj], market, ab, basis1) }, { lens: 'LENS_A_FIRST', expects: 'FILE_QUOTE kept by the market tag' });
    await consumerRow('joined/step5/consumer/history-a-older (paid, stateless; as-of the A1 head bind while A2 exists)', 'readHistoryAsOf', [A, P.HEAD, subj, ZERO, adm0 + 6], { commitment: historyCommitment(true, a1, 1, adm0 + 6, adm0 + 6, A, basis1), evidence: historyEvidence(pairId, J.mantissaA1, itemA, itemB) }, { asOf: adm0 + 6, expects: 'QUOTE_A1 at revision 1 (strictly older basis)' });
    await consumerRow('joined/step5/consumer/history-a-latest (paid, stateless)', 'readHistoryAsOf', [A, P.HEAD, subj, ZERO, 1_000_000], { commitment: historyCommitment(true, a2, 2, adm0 + 10, 1_000_000, A, basis1), evidence: historyEvidence(pairId, J.mantissaA2, itemA, itemB) }, { asOf: 1_000_000, expects: 'QUOTE_A2 at revision 2 (latest)' });
    // step 6: move, replacement at the vacated path, remove, restore (each transition atomic with its index effects)
    rows.push(await send(ctx, () => a.signedA.build([aUnbind(P.FOLDER, swaps, nameHash, 1), aBind(P.FOLDER, markets, nameHash, subj, 0)], ['0x', '0x']), 'joined/step6a/move FILE_QUOTE to /markets (unbind /swaps rev 1 + bind /markets rev 0)'));
    touched.publications.push(pub0 + 5);
    rows.push(await send(ctx, () => a.signedA.build([aCreate(saltG), aPublish(T.BINARY, gBody), aBind(P.HEAD, subjG, ZERO, rg, 0), aBind(P.FOLDER, swaps, nameHash, subjG, 2)], ['0x', gBody, '0x', '0x']), 'joined/step6b/FILE_REPLACEMENT at the vacated /swaps path (create + publish + head + bind rev 2)'));
    touched.publications.push(pub0 + 6);
    rows.push(await send(ctx, () => a.signedA.build([aUnbind(P.FOLDER, markets, nameHash, 1)], ['0x']), 'joined/step6c/remove the /markets placement (unbind rev 1)'));
    touched.publications.push(pub0 + 7);
    rows.push(await send(ctx, () => a.signedA.build([aBind(P.FOLDER, markets, nameHash, subj, 2)], ['0x']), 'joined/step6d/restore the /markets placement (bind rev 2 -> FILE_QUOTE)'));
    touched.publications.push(pub0 + 8);
    const basis2 = adm0 + 20;
    await consumerRow('joined/step6/consumer/point-a-first-after-step6 (paid, stateless)', 'readPoint', [ab, subj], { commitment: pointCommitment(pairId, J.mantissaA2, 2, ab, basis2), evidence: pointEvidence(itemA, itemB, A, pub0 + 3, adm0 + 10, 2, a2) }, { expects: 'FILE_QUOTE identity and head unchanged by move/replace/remove/restore' });
    await consumerRow('joined/step6/consumer/list-markets (paid, stateless)', 'readList', [ab, markets, 16], { commitment: listCommitment([{ position: marketsPos, author: A, target: subj, revision: 3, admission: adm0 + 20 }], 1, ab, basis2) }, { expects: 'the restored FILE_QUOTE at revision 3' });
    await consumerRow('joined/step6/consumer/list-swaps-after-replacement (paid, stateless)', 'readList', [ab, swaps, 16], { commitment: listCommitment([{ position: swapsPos, author: A, target: subjG, revision: 3, admission: adm0 + 18 }], 1, ab, basis2) }, { expects: 'only FILE_REPLACEMENT' });
    await consumerRow('joined/step6/consumer/list-markets-tagged-market (paid, stateless)', 'readListTagged', [ab, markets, market, 16], { commitment: taggedCommitment([subj], market, ab, basis2) }, { expects: 'the tag followed FILE_QUOTE' });
    await consumerRow('joined/step6/consumer/list-swaps-tagged-market-after-replacement (paid, stateless)', 'readListTagged', [ab, swaps, market, 16], { commitment: taggedCommitment([], market, ab, basis2) }, { expects: 'the replacement inherits no tag' });
    await consumerRow('joined/step6/consumer/history-a-markets-removed (paid, stateless; as-of the unbind)', 'readHistoryAsOf', [A, P.FOLDER, markets, nameHash, adm0 + 19], { commitment: historyCommitment(false, ZERO, 2, adm0 + 19, adm0 + 19, A, basis2), evidence: ZERO }, { asOf: adm0 + 19, expects: 'the removal retained as revision 2' });
    await consumerRow('joined/step6/consumer/history-a-head-older-after-step6 (paid, stateless)', 'readHistoryAsOf', [A, P.HEAD, subj, ZERO, adm0 + 6], { commitment: historyCommitment(true, a1, 1, adm0 + 6, adm0 + 6, A, basis2), evidence: historyEvidence(pairId, J.mantissaA1, itemA, itemB) }, { asOf: adm0 + 6, expects: 'QUOTE_A1 history survives' });
    const stG = await observe(ctx, ctx.raw, 'browser', 'LensReader', 'lens', 'resolve', [ab, P.TAG, subjG, market], await ctx.latestBlock());
    rows.push({ label: 'joined/step6/eth_call/tag-on-replacement', status: str(stG[0]), standing: 'retained; expected 0 (ABSENT): the replacement receives no tag', expected: { status: '0' } });
    return rows;
  },
};

// ---------------------------------------------------------------- label probe (client-convention filename-retention baseline; NOT mandatory Files semantics)
function labelCell(variant) {
  const withPublish = variant === 'create+label-fresh' || variant === 'create+label-existing-republished';
  const preExisting = variant === 'create+label-existing-republished' || variant === 'create+label-existing-omitted';
  return {
    standing: 'label probe: client-convention filename-retention baseline (FOLDER-role body supplies the entry name; HEAD bodies stay empty); NOT mandatory Files semantics',
    plan: async (ctx, a, block) => {
      const f1 = FIX.quote3000;
      const salt = keccak256(toUtf8Bytes(`label/${variant}`));
      const pidA = await principalOf(ctx, a.nativeA.address, block, true);
      const pidB = await principalOf(ctx, a.nativeB.address, block, true);
      const subj = subjectId(pidA, salt);
      const folder = name(`/label/${variant}`);
      const role = name('entry'); // == keccak256(LABEL_ENTRY): the placement role IS the label commitment
      assert.equal(role, keccak256(LABEL_ENTRY), 'placement role == keccak256(label bytes)');
      const labelId = recordId(T.LABEL, LABEL_ENTRY);
      const r1 = recordId(T.QUOTE, f1.bytes);
      const headPos = position(P.HEAD, subj, ZERO); const placePos = position(P.FOLDER, folder, role);
      const touched = emptyTouched();
      touched.records.push(r1, labelId); touched.subjects.push(subj);
      touched.bindingKeys.push(binding(pidA, headPos), binding(pidA, placePos));
      touched.lists.push(byTypeList(T.QUOTE), byTypeList(T.LABEL), byAuthorList(pidA), byAuthorList(pidB), scopeList(scopeKey(pidA, P.FOLDER, folder)), historyList(binding(pidA, headPos)), historyList(binding(pidA, placePos)), backlinkList(r1), backlinkList(subj));
      touched.plannedPublications = preExisting ? 2 : 1;
      touched.plannedAdmissions = (preExisting ? 1 : 0) + (withPublish ? 5 : 4);
      return { authors: [a.nativeA, preExisting ? a.nativeB : null], touched, variant, withPublish, preExisting, f1, salt, subj, folder, role, labelId, r1, headPos, placePos, summary: { variant, labelType: T.LABEL, labelBytes: LABEL_ENTRY, labelRecordId: labelId, role, folder, subject: subj, placementPosition: placePos, displayMapping: 'FOLDER-role body supplies the entry name (role == keccak256(bytes)); HEAD bodies stay empty; tag concepts and folder ids are not labelled in this probe' } };
    },
    body: async (ctx, a, plan) => {
      const { withPublish, preExisting, f1, salt, subj, folder, role, labelId, r1, placePos } = plan;
      const rows = [];
      const adm0 = baseCount(ctx, 'admissions'); const pub0 = baseCount(ctx, 'publications');
      const tag = `label/${variant}`;
      rows.push({ label: `${tag}/pre-absence`, recordId: labelId, standing: 'label Record absent at the sealed baseline: retained baseline raw reply of Ledger.record(labelId)', firstAdmission: ctx.baselineRecords[labelId].firstAdmission });
      let labelFirst = adm0 + 5; let occurrences = 1;
      if (preExisting) {
        rows.push(await send(ctx, () => a.nativeB.build([aPublish(T.LABEL, LABEL_ENTRY)], [LABEL_ENTRY]), `${tag}/setup: AUTHOR_B admits LABEL "entry" first (its cost is NOT part of the create row)`));
        plan.touched.publications.push(pub0 + 1);
        const mid = await observe(ctx, ctx.raw, 'pre-presence', 'Ledger', 'ledger', 'record', [labelId], await ctx.latestBlock());
        assert.equal(str(mid[2]), '1', 'pre-presence: the label Record exists once before the create');
        rows.push({ label: `${tag}/pre-presence`, recordId: labelId, firstAdmission: str(mid[1]), occurrences: str(mid[2]), standing: 'retained raw reply (stage pre-presence) before the measured create' });
        labelFirst = adm0 + 1; occurrences = withPublish ? 2 : 1;
      }
      const actions = [aCreate(salt), aPublish(T.QUOTE, f1.bytes), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, role, subj, 0)];
      const bodies = ['0x', f1.bytes, '0x', '0x'];
      if (withPublish) { actions.push(aPublish(T.LABEL, LABEL_ENTRY)); bodies.push(LABEL_ENTRY); }
      rows.push(await send(ctx, () => a.nativeA.build(actions, bodies), `${tag}/create`, { extra: { actions: actions.length, standing: withPublish ? 'the hash-only create batch PLUS one LABEL PUBLISH of exact ASCII "entry"' : 'the hash-only create batch (4 actions); the name is a hash' } }));
      plan.touched.publications.push(pub0 + (preExisting ? 2 : 1));
      const post = await observe(ctx, ctx.raw, 'post-presence', 'Ledger', 'ledger', 'record', [labelId], await ctx.latestBlock());
      rows.push({ label: `${tag}/post-presence`, recordId: labelId, firstAdmission: str(post[1]), occurrences: str(post[2]), present: post[1] !== 0n });
      if (variant === 'hash-only-create') {
        rows.push(await failureRow(ctx, `${tag}/consumer/readLabel (LABEL_UNAVAILABLE: the name is not retrievable from state)`, call(ctx, 'JoinedConsumer', 'joinedConsumer', 'readLabel', [placePos, labelId]), ['JoinedConsumer', 'LabelUnavailable'], [[a.nativeA], T.QUOTE, folder]));
      } else {
        const row = await send(ctx, () => call(ctx, 'JoinedConsumer', 'joinedConsumer', 'readLabel', [placePos, labelId]), `${tag}/consumer/readLabel (paid, stateless; hash-checked exact bytes; the label record id is a call argument derived by this script, not by the consumer)`, { extra: { consumer: 'JoinedConsumer (stateless; one LOG2 ESTIMATED ~1.9k gas)' } });
        await commitmentCheck(ctx, row, 'JoinedConsumer', 'joinedConsumer', { commitment: labelCommitment(placePos, role, LABEL_ENTRY), evidence: labelEvidence(folder, labelId, labelFirst, occurrences, 5) });
        rows.push(row);
      }
      // the placement itself resolves in every variant (hash-keyed): the label only adds the printable name
      const row2 = await send(ctx, () => call(ctx, 'StatelessConsumer', 'statelessConsumer', 'commitHead', [[a.nativeA.address], P.FOLDER, folder, role]), `${tag}/consumer/placement-resolves-stateless`, { extra: { storage: STATELESS } });
      await commitmentCheck(ctx, row2, 'StatelessConsumer', 'statelessConsumer', { commitment: twinHead(1, subj, 1, adm0 + (preExisting ? 1 : 0) + 4) });
      rows.push(row2);
      return rows;
    },
  };
}

// ---------------------------------------------------------------- deployment (once; code identity retained)
async function deployAll(run) {
  const ctx = makeCtx(run);
  await ctx.setGasPrice();
  const d = {};
  const dep = async (nameOf, ctorArgs = []) => {
    const a = artifact(nameOf);
    const data = concat([a.bytecode.object, iface(nameOf).encodeDeploy(ctorArgs)]);
    const nonce = Number((await ctx.other('eth_getTransactionCount', [ctx.deployer.address, 'latest'], { label: `deploy ${nameOf}: nonce` })).response.result);
    const address = getCreateAddress({ from: ctx.deployer.address, nonce });
    const row = await send(ctx, () => ({ to: null, data, contract: nameOf, fn: 'constructor', args: ctorArgs }), `deploy ${nameOf}`, { gasLimit: DEPLOY_GAS });
    const tx = ctx.txs[row.txIndex];
    assert.equal(getAddress(tx.receipt.contractAddress), getAddress(address), `deploy ${nameOf}: address`);
    const codeEnv = await ctx.rpc('eth_getCode', [address, qty(row.block)], { label: `code ${nameOf}` });
    ctx.rpcOther.push(envOf(codeEnv));
    const code = codeEnv.response.result;
    log(`deploy ${nameOf}: ${address} block ${row.block} gas ${row.gas} runtime ${(code.length - 2) / 2} B`);
    return {
      address, gas: row.gas, txHash: row.hash, block: row.block, blockHash: row.blockHash, constructorArgs: ctorArgs.map(str),
      runtimeBytes: (code.length - 2) / 2, runtimeCodehash: keccak256(code), initcodeBytes: (data.length - 2) / 2, initcodeHash: keccak256(data),
      artifact: { path: artifactPath(nameOf), sha256: sha256File(artifactPath(nameOf)), deployedBytecodeHash: keccak256(a.deployedBytecode.object), immutableReferences: Object.keys(a.deployedBytecode.immutableReferences ?? {}).length, compiler: a.metadata?.compiler?.version ?? null, note: 'runtimeCodehash == deployedBytecodeHash only when immutableReferences == 0; otherwise the deployed code embeds immutable values' },
      getCodeRpcId: codeEnv.request.id,
    };
  };
  d.registry = await dep('TypeRegistry');
  d.acceptor = await dep('MockAcceptor');
  d.quoteAcceptor = await dep('QuoteAcceptor');
  d.labelAcceptor = await dep('LabelAcceptor');
  d.ledger = await dep('Ledger', [d.registry.address, REALM]);
  d.index = await dep('IndexModule', [d.ledger.address]);
  d.failingIndex = await dep('FailingIndexModule');
  d.lens = await dep('LensReader', [d.ledger.address, d.index.address]);
  d.actorA = await dep('Actor', [d.ledger.address]);
  d.actorB = await dep('Actor', [d.ledger.address]);
  d.consumer = await dep('Consumer', [d.lens.address]);
  d.recon = await dep('Reconstructor');
  d.joinedConsumer = await dep('JoinedConsumer', [d.ledger.address, d.lens.address, T.QUOTE_J, T.PAIR, T.ITEM, T.LABEL]);
  d.statelessConsumer = await dep('StatelessConsumer', [d.lens.address]);
  const addrs = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.address]));
  ctx.addrs = addrs;
  const setup = [];
  const reg = (typeId, acceptorKey, refs, label) => send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'register', [typeId, acceptorKey ? addrs[acceptorKey] : ZERO_ADDR, refs]), label);
  setup.push(await send(ctx, () => call(ctx, 'Ledger', 'ledger', 'setIndexModule', [addrs.index]), 'setup: attach index module'));
  setup.push(await reg(T.QUOTE, 'acceptor', [], 'setup: register QUOTE (MockAcceptor mode 0)'));
  setup.push(await reg(T.BINARY, null, [], 'setup: register BINARY (no acceptor)'));
  setup.push(await reg(T.ITEM, null, [], 'setup: register ITEM (no acceptor)'));
  setup.push(await reg(T.PAIR, 'acceptor', [T.ITEM, T.ITEM], 'setup: register PAIR (MockAcceptor; refs [ITEM, ITEM])'));
  setup.push(await reg(T.QUOTE_J, 'quoteAcceptor', [T.PAIR], 'setup: register QUOTE_J (QuoteAcceptor: 160-byte shape, scale 6, bounds; refs [PAIR])'));
  setup.push(await reg(T.LABEL, 'labelAcceptor', [], 'setup: register LABEL (LabelAcceptor: exact UTF-8, 1..255 bytes; no refs)'));
  const latest = await ctx.latestBlock();
  const epoch = str((await observe(ctx, ctx.raw, 'setup', 'TypeRegistry', 'registry', 'epoch', [], latest))[0]);
  const principals = {};
  for (const k of ['actorA', 'actorB']) principals[k] = (await observe(ctx, ctx.raw, 'setup', 'Ledger', 'ledger', 'principalOf', [addrs[k]], latest))[0];
  for (const w of ctx.wallets.slice(1, 3)) principals[w.address] = (await observe(ctx, ctx.raw, 'setup', 'Ledger', 'ledger', 'principalOf', [w.address], latest))[0];
  return { addrs, deployment: d, setup, setupTransactions: ctx.txs, setupRaw: ctx.raw, setupBlocks: ctx.blocks, setupRpcOther: ctx.rpcOther, registryEpoch: epoch, principals };
}

async function main() {
  const t0 = Date.now();
  setTimeout(() => { console.error('watchdog: 25 minutes elapsed, stopping the run'); stopAnvil(); process.exit(124); }, WATCHDOG_MS).unref(); // applies with and without --anvil
  const rpcUrl = args.anvil ? await startAnvil() : args.rpc || 'http://127.0.0.1:8545';
  const source = `RPC_OBSERVED:${args.anvil ? `anvil-local pid ${anvilInfo.pid}` : 'external-rpc'}:${rpcUrl}`;
  log(`rpc ${rpcUrl}; artifacts ${OUT_DIR}; scratch ${SCRATCH_ROOT}; report ${OUT_JSON}`);
  const rpc0 = makeRpc(rpcUrl);
  const chainIdEnv = await rpc0('eth_chainId', []);
  const chainId = Number(chainIdEnv.response.result);
  const report = {
    profile: 'road-b-lab/2', claim: 'disposable lab, no protocol claim',
    honesty: 'This run reports receipt diagnostics with explicit remaining gates. It is not a same-guarantee comparison and not the capability ablation.',
    experiment: 'ingress x multiplicity (hash-placement diagnostics) + separate freshness cells + failure rows + the typed joined journey (steps 1–6) + the label-retention probe. NOT the protocol capability ablation (neither/authorship/selection/both), which is a later gate.',
    remainingGates: [CAVEAT_JOINED, CAVEAT_RECON, CAVEAT_MATCHED, CAVEAT_EXPECTED],
    capabilityAblation: { unknown: 'not run: the neither/authorship/selection/both counterfactuals need same-guarantee arms that remove one capability each; this lab has one arm', consequence: 'no representation-vs-feature attribution and no interaction term can be claimed from this run' },
    evidenceShape: {
      rawObservations: 'cells[*].baselineRaw[] (sealed-state getters before the first transaction; also in raw[] with stage "baseline"), cells[*].raw[] (every eth_call: literal JSON-RPC request/response, rpcId, method, source, stage, to, calldata, returnData, blockTag, blockHash), cells[*].transactions[] (rawTransaction + literal envelopes of eth_sendRawTransaction / eth_getTransactionReceipt / eth_getBlockByHash / eth_getTransactionByHash + the receipt), cells[*].blocks[] (block-header envelopes), cells[*].rpcOther[] (evm_revert, evm_snapshot, eth_gasPrice, eth_blockNumber, eth_getTransactionCount, eth_estimateGas, anvil_getAutomine)',
      candidateClaims: 'cells[*].candidateDecoded.{baseline,post} (this script decoding the retained bytes), cells[*].rows, rowLog, consumerChecks, plan — candidate-native summaries, never expected answers',
      correlation: 'every observation carries the JSON-RPC id of its request; ids are unique across the run; request.params[0] is exactly {to, data}; params[1] is the hex block number; blockHash is the retained header hash at that number (blocks[]), never inferred from a receipt at the same number',
      freshness: 'pre-absence / pre-presence are retained bytes: baselineRaw Ledger.record(id) replies at the after-revert block, and stage "pre-presence" replies taken after an in-cell setup transaction',
      storage: 'rows carry `storage`: STATELESS (JoinedConsumer / StatelessConsumer: no SSTORE, one LOG2) or STORING (LabHarness.Consumer: receipt includes its own SSTOREs)',
    },
    rpc: rpcUrl, chainId, source, node: process.version, evm: 'cancun', compiler: 'read from out/ artifact metadata per contract (deployment[*].artifact.compiler)', optimizerRuns: 200, viaIR: true,
    paths: { artifacts: OUT_DIR, scratchRoot: SCRATCH_ROOT, outJson: OUT_JSON, ethers: ethersPath },
    build: { sourceHashes: sourceHashes(), note: 'sha256 of every file under src/, test/, script/ at run time; artifact hashes per contract under deployment' },
    providerPolicy: 'no ethers provider: literal JSON-RPC over fetch, one request per call, unique ids, no result cache; every eth_call passes an explicit hex block number',
    startedAt: new Date(t0).toISOString(), anvil: anvilInfo, chainIdRpc: envOf(chainIdEnv), deployment: null, setup: [], setupTransactions: [], setupRaw: [], setupBlocks: [], setupRpcOther: [], registryEpoch: null, principals: null,
    sealedInitialState: null, cells: {}, cellOrder: [], skippedCells: [], estimatedFreshSlots: {}, failure: null,
    caveats: [
      'Local Anvil receipts under the lab profile; not an L2 fee quote and not an equivalent-guarantee comparison until the coordinator\'s fixture map is applied.',
      'Ingress x multiplicity only; no capability ablation and no interaction term are claimed.',
      CAVEAT_JOINED, CAVEAT_RECON, CAVEAT_MATCHED, CAVEAT_EXPECTED,
      'Fresh-slot counts are estimates; no storage tracing was run.',
      'Every cell starts from the sealed post-setup state (cold transaction access sets; lists empty except setup); "steady" list regimes are not measured here.',
      'The three fresh/* cells run from the SAME sealed snapshot with the same action shape (one PUBLISH under an explicit nonce) but contract-existing-body has a different initialized state (one prior EOA admission); their figures are reported side by side and must never be subtracted into a "deduplication premium".',
      'Paid-read rows labelled STORING include the storing Consumer\'s own SSTOREs; STATELESS rows do not. Only STATELESS rows approximate pure read cost (plus one LOG2).',
      'read-history-asof rows test the latest retained revision; read-history-asof-older rows read a strictly older basis and must return revision 1.',
      'A listing page with mutated == true is a mixed-basis page and must not be treated as COMPLETE by any caller.',
      'Label cells are a client-convention filename-retention baseline (FOLDER-role bodies name entries; HEAD bodies stay empty), not mandatory Files semantics; the registry epoch differs from the retained vectors/profile-b.json run (one more Type registered).',
    ],
  };
  const run = { rpc: rpcUrl, chainId, source, addrs: null, sealed: null, report };
  try {
    if (args.addresses) {
      run.addrs = JSON.parse(readFileSync(args.addresses, 'utf8'));
    } else {
      const d = await deployAll(run);
      run.addrs = d.addrs;
      Object.assign(report, { deployment: d.deployment, setup: d.setup, setupTransactions: d.setupTransactions, setupRaw: d.setupRaw, setupBlocks: d.setupBlocks, setupRpcOther: d.setupRpcOther, registryEpoch: d.registryEpoch, principals: d.principals });
      const addressesPath = join(SCRATCH_ROOT, 'lab-addresses.json'); // run-owned, never inside the lab directory
      writeFileSync(addressesPath, JSON.stringify(run.addrs, null, 2));
      report.paths.addresses = addressesPath;
    }
    const sealEnv = await rpc0('evm_snapshot', []);
    run.sealed = sealEnv.response.result;
    const sealedHeader = (await rpc0('eth_getBlockByNumber', ['latest', false])).response.result;
    log(`sealed initial state: snapshot ${run.sealed} at block ${Number(sealedHeader.number)} ${sealedHeader.hash}`);
    report.sealedInitialState = { snapshot: run.sealed, blockNumber: Number(sealedHeader.number), blockHash: sealedHeader.hash, rpc: envOf(sealEnv), rule: 'evm_revert to the sealed snapshot, then re-snapshot, before every cell through a fresh context; baseline raw harvest at the after-revert block before the first transaction; post harvest recorded per cell before the next revert' };
    persist(report);
    // decode-once helpers the cell bodies use for relative ordinals (from the retained baseline)
    const wrap = (cell) => ({ ...cell, body: async (ctx, a, plan) => { const b = run.report.cells[ctx.cellLabel]?.candidateDecoded?.baseline; assert(b && b.counts && b.records && b.nonces, `${ctx.cellLabel}: baseline harvest missing before the body`); ctx.baselineCounts = b.counts; ctx.baselineRecords = b.records; ctx.baselineNonces = b.nonces; return cell.body(ctx, a, plan); } });
    const runCellNamed = async (label, cell) => { const c = wrap(cell); const orig = c.plan; c.plan = async (ctx, a, block) => { ctx.cellLabel = label; return orig(ctx, a, block); }; const r = await sealedCell(run, label, c); if (r) report.cellOrder.push(label); };
    const cells = { 'native-one': (a) => [a.nativeA, null], 'signed-one': (a) => [a.signedA, null], 'native-two': (a) => [a.nativeA, a.nativeB], 'signed-two': (a) => [a.signedA, a.signedB] };
    for (const fixture of ['quote', 'binary']) {
      for (const [cell, pick] of Object.entries(cells)) await runCellNamed(`${cell}/${fixture}`, matrixCell(cell, fixture, pick));
    }
    for (const variant of ['contract-fresh-body', 'contract-existing-body', 'exact-retry']) await runCellNamed(`fresh/${variant}`, { standing: 'freshness control: its own sealed cell from the same post-setup snapshot; report side by side, never subtract', plan: freshPlan(variant), body: freshBody });
    await runCellNamed('failure-rows', failureCell);
    await runCellNamed('joined/steps-1-6', joinedCell);
    for (const variant of ['hash-only-create', 'create+label-fresh', 'create+label-existing-republished', 'create+label-existing-omitted']) await runCellNamed(`label/${variant}`, labelCell(variant));
    if (!args['skip-without-index']) {
      await runCellNamed('native-one-noindex/quote', {
        standing: 'NOT EQUIVALENT: the mandatory index is detached (a named guarantee omitted); diagnostic only',
        plan: async (ctx, a, block) => matrixPlan(ctx, 'native-one-noindex', 'quote', a.nativeA, null, block, { noIndex: true }),
        body: async (ctx, a, plan) => {
          const rows = [await send(ctx, () => call(ctx, 'Ledger', 'ledger', 'setIndexModule', [ZERO_ADDR]), 'setup: detach index module')];
          rows.push(...(await runCell(ctx, plan, { noIndex: true })));
          return rows;
        },
      });
    }
    const finalEnv = await rpc0('evm_revert', [run.sealed]);
    assert.equal(finalEnv.response.result, true, 'final evm_revert');
    report.estimatedFreshSlots = { label: 'ESTIMATED from the design table, not traced', 'create (native, 4 actions)': '5 evidence + 1 pubId + 2..3 record + 1 subject + 4..6 admission + 2x(2 head + 1 bindingPosition + 3 positionCell) + index appends', 'create (signed)': 'as native + 2 (r, s)', 'edit': '3 record + 2..3 admission + head rewrite + index appends', 'create + label fresh': 'create + 3 record (typeId, meta, one word) + 2 admission + by-Type/by-author appends', 'create + label existing republished': 'create + 1 occurrence rewrite + 2 admission + appends', 'create + label existing omitted': 'create + 0' };
    report.consumerMismatches = Object.values(report.cells).reduce((n, c) => n + (c.mismatches || 0), 0);
    assert.equal(report.consumerMismatches, 0, `consumer/commitment self-check mismatches: ${report.consumerMismatches}`);
    report.finishedAt = new Date().toISOString();
  } catch (e) {
    log(`FAILED: ${e.message}`);
    report.failure = { message: String(e.message), stack: String(e.stack).split('\n').slice(0, 12), at: new Date().toISOString() };
    throw e;
  } finally {
    stopAnvil();
    persist(report);
    const text = Object.entries(report.cells).flatMap(([cell, c]) => (c.rows || []).map((r) => `${cell.padEnd(40)} ${String(r.label).padEnd(96)} ${String(r.gas ?? '').padStart(10)} ${r.status ?? ''} ${r.storage ? '[' + r.storage.split(':')[0] + ']' : ''}`)).join('\n');
    process.stdout.write(text + '\n');
    log(`wrote ${OUT_JSON}${report.failure ? ' (FAILED: ' + report.failure.message + ')' : ''}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
