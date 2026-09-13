#!/usr/bin/env node
// Road B lab — measurement script, second source pass. DISPOSABLE LAB, NO PROTOCOL CLAIM.
// UNRUN: written under another worker's compiler lease (only `node --check` has been run on it).
// DO NOT RUN without the coordinator's heavy-run lease (README.md, TODO.md).
//
// AUTHORITY-REPAIR PASS (2026-09-13, source aaecfed; REPAIR.md): Type ids are DERIVED by the registry from
// (shape, refTypes, declared-rule codehash) and resolved here three ways (receipt log, typeIdOf raw reply, local
// Keys.typeId derivation) before any cell runs — the name hashes are shape commitments, never ids. JoinedConsumer is
// deployed after registration with the derived ids. Three cells were added, each its own sealed cell from the same
// snapshot: policy/activate, failure/refused-re-registration, failure/unsupported-native-import (new raw stages:
// type-resolution, policy, basis, registry-post, squat-probe). vectors/profile-b.json remains the dcc7b94 vector
// (name-hash ids); a new declared vector is owed after a build. Payload controls and fixture bodies are unchanged.
// F5 (mandatory rule vs additional policy): the fixtures' mandatory rules are MinBodyAcceptor(32)/(96) (immutable
// thresholds); the mutable MockAcceptor is installed as QUOTE's/PAIR's ADDITIONAL policy (row 2) at setup, so its
// refusals are E_POLICY_REJECTED; policy/activate also carries the in-cell strict Type and an above-cap body.
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
//          --cells <exact,comma,separated,cell,keys> (bounded run; unknown keys or an empty selection FAIL before any chain starts)
//          --only <substring> (legacy filter; resolved against the same plan and validated the same way)
//          --controller <path>:<sha256> --expectations <path>:<sha256> --arm-input <path>:<sha256> [--run-id <id>]
//          (all three pins together enable the disposable two-stage controller gate; otherwise the run is diagnostic)
// Env: FOUNDRY_OUT (artifacts; fallback ./out, read-only), EFS_LAB_SCRATCH (run-owned root; default: parent
// of FOUNDRY_OUT, else the manifest's scratch path), EFS_ETHERS_PATH.
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';
import { createControllerGate } from './controller-gate.mjs';

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
if (args.cells === true || args.only === true) throw new Error('--cells and --only require a value (an exact comma-separated cell list, or a substring); a bare flag would silently select every cell');
const ONLY = typeof args.only === 'string' ? args.only : null;
const WATCHDOG_MS = 25 * 60 * 1000;
const CAVEAT_JOINED = 'The joined QUOTE/Pair journey (sdk-fixture steps 1–6 with ITEM/PAIR/QUOTE_J) is scripted as cell joined/steps-1-6; steps 7 (partly: paid consumer), 8, 9 and 10 are NOT in this script.';
const CAVEAT_RECON = 'The Reconstructor is a candidate self-check calling ledger.intentDigest, not independent.';
const CAVEAT_MATCHED = 'No row is a matched substitute for the fuller Files control: hash-placement diagnostics (names are hashes) until labels and the joined journey are integrated into one matched guarantee profile.';
const CAVEAT_EXPECTED = 'Expected values, commitments and read-back comparisons are computed by this script from the fixture (candidate-side self-checks); they are not the independent oracle.';
const CAVEAT_NATIVE_IMPORT = 'Native-source (contract-author) import is UNSUPPORTED after the authority repair (Ledger.importPublication reverts E_SOURCE_UNSUPPORTED for src.v == 0): sdk-fixture step 9 for AUTHOR_B reports UNSUPPORTED, not success. A limit until a verifiable source witness exists, not a waiver.';
const CAVEAT_VECTOR = 'vectors/profile-b.json remains the dcc7b94 vector (name-hash Type ids). Type ids in this run are DERIVED (report.types: receipt log, typeIdOf raw reply and local Keys.typeId derivation agree); actionsHash / acceptanceProfile / digest for the same fixture therefore differ from that vector, and a new declared vector is owed after a build.';
const CAVEAT_MANDATORY = 'F5 (REPAIR.md): a Type\'s registration-time acceptor is its MANDATORY rule — it runs on every publish/reuse, its refusal (E_REJECTED) is final, and no activation can remove or replace it; activate() installs an ADDITIONAL policy acceptor (E_POLICY_REJECTED), activate(0) = no additional policy. A codehash pins the rule\'s CODE, not its mutable dependencies: every mandatory fixture rule is stateless or immutable-configured (MinBodyAcceptor, QuoteAcceptor, LabelAcceptor, StrictQuoteAcceptor); the mutable MockAcceptor is only ever an additional policy here. Stateful developer rules remain allowed in production when their dependency/basis semantics are explicit; nothing here proves statelessness.';

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
// Type SHAPES = the lab's Type name hashes. Since the authority repair (REPAIR.md R2) the registry DERIVES a Type id from
// (shape, refTypes, declared-rule codehash); T is filled by resolveType() from the register receipt / typeIdOf reply and
// throws if read before that, so no cell can silently run against a name hash.
const SHAPE = { QUOTE: DOM('lab/type/quote/1'), BINARY: DOM('lab/type/binary/1'), ITEM: DOM('lab/type/item/1'), PAIR: DOM('lab/type/pair/1'), QUOTE_J: DOM('lab/type/quote-joined/1'), LABEL: DOM('lab/type/label/1') };
const TYPE_KEYS = Object.keys(SHAPE);
const T = new Proxy({}, { get(o, k) { if (TYPE_KEYS.includes(k) && !(k in o)) throw new Error(`Type id T.${k} read before registration/resolution`); return o[k]; } });
// registration plan, in order (a reference Type must be resolved before the Type that references it): [key, acceptor deployment key, ref keys, note]
// The acceptor here is the Type's MANDATORY rule (F5): stateless or immutable-configured only. The mutable MockAcceptor is
// installed afterwards as the ADDITIONAL policy (row 2) of QUOTE and PAIR through TypeRegistry.activate (see deployAll).
const TYPE_PLAN = [
  ['QUOTE', 'quoteRule', [], 'mandatory MinBodyAcceptor(32): immutable threshold, part of the id'],
  ['BINARY', null, [], 'no acceptor'],
  ['ITEM', null, [], 'no acceptor'],
  ['PAIR', 'pairRule', ['ITEM', 'ITEM'], 'mandatory MinBodyAcceptor(96); refs [ITEM, ITEM]'],
  ['QUOTE_J', 'quoteAcceptor', ['PAIR'], 'QuoteAcceptor: 160-byte shape, scale 6, bounds; refs [PAIR]'],
  ['LABEL', 'labelAcceptor', [], 'LabelAcceptor: exact UTF-8, 1..255 bytes; no refs'],
];
const SHAPE_STRICT = DOM('lab/type/quote-strict/1'); // in-cell Type of policy/activate: StrictQuoteAcceptor as its MANDATORY rule
// byte-for-byte Keys.typeId: keccak256(abi.encode(DOM_TYPE, shape, keccak256(abi.encode(refTypes)), ruleId)); ruleId = acceptor runtime codehash (0 = none)
const DOM_TYPE = DOM('efs2/type/1');
const typeIdLocal = (shape, refTypeIds, ruleId) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM_TYPE, shape, keccak256(coder.encode(['bytes32[]'], [refTypeIds])), ruleId]));
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
  StrictQuoteAcceptor: 'Falsify.t', // fixture rule v2 (32-byte quote, value <= 2_500_000_000) from test/Falsify.t.sol: the ADDITIONAL QUOTE policy of cell policy/activate, and the MANDATORY rule of that cell's in-cell strict Type
  MinBodyAcceptor: 'LabAcceptors', // immutable-configuration mandatory rules of the fixtures: MinBodyAcceptor(32) for QUOTE, MinBodyAcceptor(96) for PAIR (F5 addendum: the mutable MockAcceptor is never a mandatory rule)
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
let activeReport = null;
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
    controllerGate: run.controllerGate, controllerInputs: run.controllerInputs,
    txs: [], raw: [], baselineRaw: [], blocks: [], rpcOther: [], rowLog: [], consumerChecks: [], mismatches: 0,
    persist: null, gasPrice: null, blockCache: new Map(), nonceCache: new Map(),
    // runtime codehashes of the contracts deployed by this run (null in --addresses mode): lets a cell compare a registry-reported codehash with the deployment record
    codehashes: run.report?.deployment ? Object.fromEntries(Object.entries(run.report.deployment).map(([k, v]) => [k, v.runtimeCodehash])) : null,
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
// `from` (runner review 1): a static probe of a caller-sensitive call (registry admin, msg.sender == author) must be simulated
// FROM the account that will actually send the transaction; it is retained in the envelope (params[0] = {from, to, data}).
async function observeRaw(ctx, sink, stage, meta, to, data, blockNumber, { allowError = false, from = null } = {}) {
  const blockHash = await ctx.blockHash(blockNumber);
  const callObject = from ? { from, to, data } : { to, data };
  const e = await ctx.rpc('eth_call', [callObject, qty(blockNumber)], { label: `${stage}:${meta.contract}.${meta.fn}`, allowError });
  const obs = {
    rpcId: e.request.id, method: 'eth_call', source: ctx.source, stage, contract: meta.contract, from, to, fn: meta.fn, args: meta.args ?? [],
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
// A PublicationIntent signed by `wallet` over `actions` under THIS Ledger's context at the latest block (sign-inputs
// raw replies retained). Used for executeSigned (signedCall) and as the destination authorization of importPublication.
async function signIntent(ctx, wallet, actions) {
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
  return { intent, sig, intentStr: Object.fromEntries(Object.entries(intent).map(([k, v]) => [k, str(v)])), signInputsBlock: block };
}
async function signedCall(ctx, wallet, actions, bodies) {
  const s = await signIntent(ctx, wallet, actions);
  return { ...call(ctx, 'Ledger', 'ledger', 'executeSigned', [s.intent, actions, bodies, s.sig]), intent: s.intentStr, sig: s.sig, signInputsBlock: s.signInputsBlock };
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
    const row = { kind: str(a[0]), leaf: str(a[1]), publication: str(a[2]), bindingOrdinal: str(a[3]), expectedRevision: str(a[4]), withdrawn: a[5], a: a[6], b: a[7], present: a[0] !== 0n };
    // runner review 3: for every present publish/reuse admission retain Type id <-> policy row <-> codehash <-> epoch as
    // raw replies (acceptanceBasis and the registry's activation row it names) so a checker can join them without trusting us
    if (row.present && (a[0] === 1n || a[0] === 2n)) {
      row.basis = basisOf(await ob('Ledger', 'ledger', 'acceptanceBasis', [ord]));
      row.policyRow = activationOf(await ob('TypeRegistry', 'registry', 'activation', [row.basis.typeId, Number(row.basis.activation)]));
      row.join = joinBasis(row.basis, row.policyRow);
      assert.equal(row.join.ok, true, `${stage}: admission ${ord} basis does not join its policy row: ${JSON.stringify(row.join)}`);
    }
    h.admissions[ord] = row;
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
  // selection is decided by selectCells() before the chain starts; a cell reaching here is planned
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
  const temp = `${OUT_JSON}.tmp-${process.pid}`;
  writeFileSync(temp, JSON.stringify(report, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
  renameSync(temp, OUT_JSON);
}
function markRunFailure(report, message) {
  if (!report) {
    console.error(`${message}; report not initialized, so no evidence packet is available`);
    return false;
  }
  report.failure = { message, at: new Date().toISOString() };
  persist(report);
  return true;
}
function terminateRun(message, exitCode) {
  console.error(message);
  try { markRunFailure(activeReport, message); } catch (e) { console.error(`${message}; failed to persist failure evidence: ${e.message}`); }
  stopAnvil();
  process.exit(exitCode);
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
// A failure row: capture the revert selector (and, when `args` is given, the decoded revert ARGUMENTS) with a static
// eth_call simulated FROM the actual transaction sender (retained), mine the reverting transaction from that same
// sender, and prove the state probe is unchanged across it. (runner review 1 and 2)
async function failureRow(ctx, label, c, expectedError, probe, { wallet = ctx.deployer, args = null } = {}) {
  const [errContract, errName] = Array.isArray(expectedError) ? expectedError : ['Ledger', expectedError];
  const from = wallet.address;
  const preBlock = await ctx.latestBlock();
  const pre = await stateProbe(ctx, `failure-pre:${label}`, probe, preBlock);
  const expectedSelector = errorSelector(errContract, errName);
  log(`  row  ${label}: static call for the revert selector (from ${from})`);
  const st = await observeRaw(ctx, ctx.raw, `failure-static:${label}`, c, c.to, c.data, preBlock, { allowError: true, from });
  let observedSelector = 'no-revert';
  let observedData = null;
  if (st.error) {
    observedData = typeof st.error.data === 'string' ? st.error.data : (st.error.data?.data ?? JSON.stringify(st.error.data ?? null));
    observedSelector = typeof observedData === 'string' && observedData.startsWith('0x') ? observedData.slice(0, 10) : String(observedData);
  }
  assert(expectedSelector, `${label}: expected selector unavailable for ${errContract}.${errName}`);
  const row = await send(ctx, () => c, label, { expectFail: true, gasLimit: FAIL_GAS, wallet });
  const post = await stateProbe(ctx, `failure-post:${label}`, probe, row.block);
  const unchanged = JSON.stringify(stripBlock(pre)) === JSON.stringify(stripBlock(post));
  assert.equal(observedSelector, expectedSelector, `${label}: revert selector mismatch for ${errContract}.${errName}`);
  assert.equal(unchanged, true, `${label}: state changed across expected revert`);
  const normArg = (v) => (typeof v === 'bigint' ? v.toString() : typeof v === 'number' ? String(v) : String(v).toLowerCase());
  let decodedArgs = null;
  let expectedArgs = null;
  if (args) {
    expectedArgs = Array.from(args, normArg);
    const parsed = typeof observedData === 'string' && observedData.startsWith('0x') ? iface(errContract).parseError(observedData) : null;
    assert(parsed && parsed.name === errName, `${label}: revert data does not decode as ${errContract}.${errName}`);
    decodedArgs = Array.from(parsed.args, normArg);
    assert.deepEqual(decodedArgs, expectedArgs, `${label}: revert arguments mismatch for ${errContract}.${errName}`);
  }
  return { ...row, from, expectedError: `${errContract}.${errName}`, expectedSelector, observedSelector, observedRevertData: observedData, expectedArgs, decodedArgs, selectorMatch: true, argsMatch: args ? true : null, stateUnchanged: true, standing: 'selector (and arguments when expectedArgs is set) from a retained static eth_call simulated from the actual transaction sender; the mined receipt establishes reversion, not the selector', pre, post };
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
    rows.push(await failureRow(ctx, 'failure/failed-acceptance (the mock is QUOTE\'s ADDITIONAL policy, row 2: E_POLICY_REJECTED; whole publication reverts)', call(ctx, 'Actor', 'actorA', 'publish', [T.QUOTE, zeroPadValue(toBeHex(5n), 32)]), 'E_POLICY_REJECTED', probe, { args: [0, T.QUOTE] }));
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

// ---------------------------------------------------------------- authority-repair cells (REPAIR.md), each its own sealed cell from the same snapshot
const lc = (v) => String(v).toLowerCase();
const NO_PROBE_FOLDER = name('/none');
// decoders of the F5-shaped registry/ledger views (candidate-side; the raw replies are what the checker interprets)
const typeInfoOf = (i) => ({ registered: i[0], mandatoryAcceptor: i[1], ruleId: i[2], policyAcceptor: i[3], policyCodehash: i[4], refCount: str(i[5]), activation: str(i[6]) });
const descriptorOf = (d) => ({ shape: d[0], ruleId: d[1], mandatoryAcceptor: d[2], refCount: str(d[3]), activations: str(d[4]), registeredAt: str(d[5]) });
const immutableOf = (desc) => { const { activations, ...rest } = desc; return rest; }; // the complete immutable descriptor (everything but the policy-row count)
const activationOf = (r) => ({ acceptor: r[0], codehash: r[1], epoch: str(r[2]), activatedAt: str(r[3]) });
const basisOf = (b) => ({ typeId: b[0], activation: str(b[1]), mandatoryAcceptor: b[2], ruleId: b[3], policyAcceptor: b[4], policyCodehash: b[5], epoch: str(b[6]), activatedAt: str(b[7]) });
// join an admission's acceptanceBasis with the registry activation row it names (key: typeId + activation index):
// the policy acceptor, its codehash and the epoch must agree — the checker can redo this from the raw replies
function joinBasis(basis, policyRow) {
  const lower = (v) => String(v).toLowerCase();
  const acceptorEqual = lower(basis.policyAcceptor) === lower(policyRow.acceptor);
  const codehashEqual = lower(basis.policyCodehash) === lower(policyRow.codehash);
  const epochEqual = String(basis.epoch) === String(policyRow.epoch);
  return { typeId: basis.typeId, activation: String(basis.activation), acceptorEqual, codehashEqual, epochEqual, ok: acceptorEqual && codehashEqual && epochEqual };
}
const QUOTE_HIGH = zeroPadValue(toBeHex(3_000_000_000n), 32); // uint256 3_000_000_000: ABOVE StrictQuoteAcceptor's cap. NOT a payload control (those are quote3000 = uint256 3000 and quote3100 = uint256 3100, both below the cap); published only to show a rejected body
// policy/activate (F5 shape): QUOTE's MANDATORY rule is MinBodyAcceptor(32) and its policy row 2 is the accept-all mock.
// StrictQuoteAcceptor is ADDED as policy row 3 after an admission; a signature made under the old epoch is refused; an
// above-cap body is refused by the added policy (E_POLICY_REJECTED) while the re-signed below-cap control succeeds;
// acceptanceBasis is joined with typeInfo and the activation rows by Type, codehash and epoch. Then an in-cell strict
// Type (StrictQuoteAcceptor as its MANDATORY rule) shows the rejected body stays rejected after activate(0) and under a
// permissive policy, and a compliant body is admitted with both bases recorded.
const policyCell = {
  standing: 'policy activation (REPAIR.md R2 + F5): mandatory rule always runs; policy rows only add constraints; receipt-bound activation (E.B.4); bases joined to the registry rows by Type, codehash and epoch',
  plan: async (ctx, a, block) => {
    const rOld = recordId(T.QUOTE, FIX.quote3000.bytes); const rNew = recordId(T.QUOTE, FIX.quote3100.bytes);
    const pidA = await principalOf(ctx, a.signedA.address, block, true);
    const pidOp = await principalOf(ctx, a.nativeA.address, block, true);
    const touched = emptyTouched();
    touched.records.push(rOld, rNew); touched.lists.push(byTypeList(T.QUOTE), byAuthorList(pidA), byAuthorList(pidOp));
    touched.plannedPublications = 3; touched.plannedAdmissions = 3;
    // registry state at the sealed baseline (baselineRaw, stage baseline)
    const info0 = typeInfoOf(await observeBoth(ctx, 'baseline', 'TypeRegistry', 'registry', 'typeInfo', [T.QUOTE], block));
    const desc0 = descriptorOf(await observeBoth(ctx, 'baseline', 'TypeRegistry', 'registry', 'descriptor', [T.QUOTE], block));
    const [epoch0] = await observeBoth(ctx, 'baseline', 'TypeRegistry', 'registry', 'epoch', [], block);
    const registry0 = { typeInfo: info0, descriptor: desc0, epoch: str(epoch0) };
    return {
      authors: [a.signedA, a.nativeA], touched, rOld, rNew, registry0,
      summary: {
        typeId: T.QUOTE, mandatoryRule: ctx.addrs.quoteRule, policyBefore: ctx.addrs.acceptor, policyAfter: ctx.addrs.strictAcceptor, rOld, rNew, registryAtBaseline: registry0,
        payloadControls: { quote3000: 'uint256 3000 (below StrictQuoteAcceptor\'s cap 2_500_000_000): admitted under policy row 2 before the activation', quote3100: 'uint256 3100 (below the cap): admitted under policy row 3 after re-signing' },
        aboveCapBody: { bytes: QUOTE_HIGH, value: '3000000000', standing: 'NOT a payload control; published only to show E_POLICY_REJECTED under QUOTE (mandatory rule accepts, added policy refuses) and E_REJECTED under the in-cell strict Type (mandatory rule refuses; activate(0) and a permissive policy change nothing)' },
        shape: 'signed publish quote3000 (row 2) -> sign quote3100 at epoch N and hold -> activate(QUOTE, StrictQuoteAcceptor) = row 3 -> held signature: E_INTENT -> above-cap body: E_POLICY_REJECTED -> re-signed quote3100 admitted (row 3) -> acceptanceBasis joins -> in-cell strict Type: E_REJECTED before, after activate(0), and under the permissive mock; compliant quote3000 admitted with both bases',
      },
    };
  },
  body: async (ctx, a, plan) => {
    const { rOld, rNew, registry0: R } = plan;
    const rows = [];
    const adm0 = baseCount(ctx, 'admissions'); const pub0 = baseCount(ctx, 'publications');
    const probe = [[a.signedA, a.nativeA], T.QUOTE, NO_PROBE_FOLDER];
    assert.equal(lc(R.typeInfo.mandatoryAcceptor), lc(ctx.addrs.quoteRule), 'policy/activate: QUOTE mandatory rule must be MinBodyAcceptor(32)');
    assert.equal(lc(R.typeInfo.policyAcceptor), lc(ctx.addrs.acceptor), 'policy/activate: QUOTE policy row 2 must be the mock');
    assert.equal(R.typeInfo.activation, '2', 'policy/activate: QUOTE must start at activation 2');
    assert.equal(lc(R.descriptor.ruleId), lc(R.typeInfo.ruleId), 'policy/activate: descriptor.ruleId == typeInfo.ruleId');
    assert.equal(lc(R.descriptor.mandatoryAcceptor), lc(R.typeInfo.mandatoryAcceptor), 'policy/activate: descriptor.mandatoryAcceptor == typeInfo.mandatoryAcceptor');
    if (ctx.codehashes) assert.equal(lc(R.typeInfo.ruleId), lc(ctx.codehashes.quoteRule), 'policy/activate: ruleId == deployed MinBodyAcceptor(32) runtime codehash');
    rows.push(await send(ctx, () => a.signedA.build([aPublish(T.QUOTE, FIX.quote3000.bytes)], [FIX.quote3000.bytes]), 'policy/activate/setup: signed publish quote3000 (payload control, uint256 3000, below the cap) under mandatory rule + policy row 2 (epoch N)'));
    plan.touched.publications.push(pub0 + 1);
    const held = await signedCall(ctx, ctx.wallets[1], [aPublish(T.QUOTE, FIX.quote3100.bytes)], [FIX.quote3100.bytes]); // signed at epoch N, deliberately held back
    rows.push({ label: 'policy/activate/held-signature (signed at epoch N, not yet sent)', status: 'signed-not-sent', intent: held.intent, signInputsBlock: held.signInputsBlock, standing: 'sign-inputs raw replies retained at signInputsBlock; the signature is sent only after the activation below' });
    rows.push(await send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'activate', [T.QUOTE, ctx.addrs.strictAcceptor]), 'policy/activate/activate (StrictQuoteAcceptor ADDED as QUOTE policy row 3; the mandatory rule, id and descriptor are untouched)', { extra: { standing: 'ESTIMATED 2 fresh slots (activation row) + 1 rewrite (activations) + epoch rewrite; every later QUOTE admission pays one extra bounded STATICCALL for the policy (ESTIMATED); see REPAIR.md cost table' } }));
    const after = await ctx.latestBlock();
    const info1 = typeInfoOf(await observe(ctx, ctx.raw, 'policy', 'TypeRegistry', 'registry', 'typeInfo', [T.QUOTE], after));
    const desc1 = descriptorOf(await observe(ctx, ctx.raw, 'policy', 'TypeRegistry', 'registry', 'descriptor', [T.QUOTE], after));
    const [epoch1] = await observe(ctx, ctx.raw, 'policy', 'TypeRegistry', 'registry', 'epoch', [], after);
    const act = {};
    for (const i of [1, 2, 3]) act[i] = activationOf(await observe(ctx, ctx.raw, 'policy', 'TypeRegistry', 'registry', 'activation', [T.QUOTE, i], after));
    // joins: active typeInfo <-> activation row 3 <-> deployment codehash; complete immutable descriptor unchanged
    assert.equal(lc(info1.mandatoryAcceptor), lc(ctx.addrs.quoteRule), 'policy/activate: the mandatory rule is untouched');
    assert.equal(lc(info1.ruleId), lc(R.typeInfo.ruleId), 'policy/activate: ruleId is untouched');
    assert.equal(lc(info1.policyAcceptor), lc(ctx.addrs.strictAcceptor), 'policy/activate: StrictQuoteAcceptor must be the active policy');
    assert.equal(info1.activation, '3', 'policy/activate: activation index must be 3');
    assert.equal(lc(info1.policyCodehash), lc(act[3].codehash), 'policy/activate: active policy codehash == activation row 3 codehash');
    if (ctx.codehashes) assert.equal(lc(info1.policyCodehash), lc(ctx.codehashes.strictAcceptor), 'policy/activate: policy codehash == deployed StrictQuoteAcceptor runtime codehash');
    assert.deepEqual(immutableOf(desc1), immutableOf(R.descriptor), 'policy/activate: the complete immutable descriptor (shape, ruleId, mandatoryAcceptor, refCount, registeredAt) must be unchanged');
    assert.equal(desc1.activations, '3', 'policy/activate: descriptor.activations == 3');
    assert.equal(str(epoch1), String(BigInt(R.epoch) + 1n), 'policy/activate: epoch must move by exactly one');
    assert.equal(act[3].epoch, str(epoch1), 'policy/activate: row 3 records the new epoch');
    assert.equal(lc(act[1].acceptor), lc(ZERO_ADDR), 'policy/activate: row 1 = no additional policy');
    assert.equal(lc(act[2].acceptor), lc(ctx.addrs.acceptor), 'policy/activate: row 2 = the mock');
    assert.equal(lc(act[2].codehash), lc(R.typeInfo.policyCodehash), 'policy/activate: row 2 codehash == baseline active policy codehash');
    rows.push({ label: 'policy/activate/registry-after', standing: 'retained raw replies (stage policy) at the block of the activation; joins asserted: typeInfo.policyCodehash == activation(3).codehash (== deployed runtime codehash when deployed here); immutable descriptor deep-equal to the baseline', typeInfo: info1, descriptor: desc1, epoch: str(epoch1), activationRows: act, immutableDescriptorUnchanged: true });
    rows.push(await failureRow(ctx, 'policy/activate/stale-signature (signed under epoch N, sent after activation N+1: E_INTENT(3), no write)', held, 'E_INTENT', probe, { args: [3] }));
    rows.push(await failureRow(ctx, 'policy/activate/policy-adds-a-constraint (above-cap body uint256 3_000_000_000: the mandatory rule accepts, the ADDED policy refuses: E_POLICY_REJECTED(0, QUOTE))', call(ctx, 'Actor', 'actorA', 'publish', [T.QUOTE, QUOTE_HIGH]), 'E_POLICY_REJECTED', probe, { args: [0, T.QUOTE] }));
    rows.push(await send(ctx, () => a.signedA.build([aPublish(T.QUOTE, FIX.quote3100.bytes)], [FIX.quote3100.bytes]), 'policy/activate/new-epoch-publish (quote3100, payload control, below the cap; re-signed under epoch N+1; admitted under mandatory rule + policy row 3)'));
    plan.touched.publications.push(pub0 + 2);
    const last = await ctx.latestBlock();
    const bOld = basisOf(await observe(ctx, ctx.raw, 'basis', 'Ledger', 'ledger', 'acceptanceBasis', [adm0 + 1], last));
    const bNew = basisOf(await observe(ctx, ctx.raw, 'basis', 'Ledger', 'ledger', 'acceptanceBasis', [adm0 + 2], last));
    // joins: each admission's basis <-> the registry rows, by Type, codehash and epoch
    assert.equal(lc(bOld.typeId), lc(T.QUOTE), 'basis old: typeId');
    assert.equal(bOld.activation, '2', 'basis old: the epoch-N admission must report policy row 2, not today\'s row');
    assert.equal(lc(bOld.mandatoryAcceptor), lc(ctx.addrs.quoteRule), 'basis old: mandatory rule');
    assert.equal(lc(bOld.ruleId), lc(desc1.ruleId), 'basis old: ruleId == descriptor.ruleId');
    assert.equal(lc(bOld.policyAcceptor), lc(act[2].acceptor), 'basis old: policy acceptor == row 2');
    assert.equal(lc(bOld.policyCodehash), lc(act[2].codehash), 'basis old: policy codehash == row 2');
    assert.equal(bOld.epoch, act[2].epoch, 'basis old: epoch == row 2 epoch');
    assert.equal(lc(bNew.typeId), lc(T.QUOTE), 'basis new: typeId');
    assert.equal(bNew.activation, '3', 'basis new: the epoch-N+1 admission must report policy row 3');
    assert.equal(lc(bNew.mandatoryAcceptor), lc(ctx.addrs.quoteRule), 'basis new: the same mandatory rule');
    assert.equal(lc(bNew.ruleId), lc(info1.ruleId), 'basis new: ruleId == typeInfo.ruleId');
    assert.equal(lc(bNew.policyAcceptor), lc(info1.policyAcceptor), 'basis new: policy acceptor == active typeInfo');
    assert.equal(lc(bNew.policyCodehash), lc(info1.policyCodehash), 'basis new: policy codehash == active typeInfo');
    assert.equal(lc(bNew.policyCodehash), lc(act[3].codehash), 'basis new: policy codehash == row 3');
    assert.equal(bNew.epoch, act[3].epoch, 'basis new: epoch == row 3 epoch');
    assert.equal(bNew.epoch, str(epoch1), 'basis new: epoch == registry epoch after the activation');
    rows.push({ label: 'policy/activate/acceptance-basis', standing: 'retained raw replies (stage basis) of Ledger.acceptanceBasis for both admissions; joins asserted by Type, mandatory rule, policy row, codehash and epoch against the stage-policy registry replies', oldAdmission: { ordinal: adm0 + 1, recordId: rOld, basis: bOld, joinedTo: 'activation row 2' }, newAdmission: { ordinal: adm0 + 2, recordId: rNew, basis: bNew, joinedTo: 'activation row 3 == active typeInfo' } });
    // ---- F5: an in-cell strict Type whose MANDATORY rule is StrictQuoteAcceptor: the rejected body stays rejected
    const strict = await registerInCell(ctx, 'STRICT', SHAPE_STRICT, 'strictAcceptor', [], 'policy/activate/strict/register (StrictQuoteAcceptor as the MANDATORY rule of an in-cell Type; id from log == typeIdOf == local derivation)');
    rows.push(strict.row);
    const probeS = [[a.nativeA], strict.typeId, NO_PROBE_FOLDER];
    const publishHigh = () => call(ctx, 'Actor', 'actorA', 'publish', [strict.typeId, QUOTE_HIGH]);
    const rejectedArgs = { args: [0, strict.typeId] }; // E_REJECTED(leaf 0, STRICT)
    rows.push(await failureRow(ctx, 'policy/activate/strict/rejected-before (above-cap body: E_REJECTED(0, STRICT) by the mandatory rule, no activation yet)', publishHigh(), 'E_REJECTED', probeS, rejectedArgs));
    rows.push(await send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'activate', [strict.typeId, ZERO_ADDR]), 'policy/activate/strict/activate-zero (row 2: no additional policy)'));
    rows.push(await failureRow(ctx, 'policy/activate/strict/still-rejected-after-activate-zero (E_REJECTED(0, STRICT): activate(0) never means no validation)', publishHigh(), 'E_REJECTED', probeS, rejectedArgs));
    rows.push(await send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'activate', [strict.typeId, ctx.addrs.acceptor]), 'policy/activate/strict/activate-permissive (row 3: the accept-all mock as ADDITIONAL policy)'));
    rows.push(await failureRow(ctx, 'policy/activate/strict/still-rejected-under-permissive-policy (E_REJECTED(0, STRICT): a policy cannot remove the mandatory rule)', publishHigh(), 'E_REJECTED', probeS, rejectedArgs));
    const rStrict = recordId(strict.typeId, FIX.quote3000.bytes);
    plan.touched.records.push(rStrict);
    rows.push(await send(ctx, () => call(ctx, 'Actor', 'actorA', 'publish', [strict.typeId, FIX.quote3000.bytes]), 'policy/activate/strict/compliant-publish (quote3000, below the cap: mandatory rule + policy accept; admitted under row 3)'));
    plan.touched.publications.push(pub0 + 3);
    const last2 = await ctx.latestBlock();
    const bS = basisOf(await observe(ctx, ctx.raw, 'basis', 'Ledger', 'ledger', 'acceptanceBasis', [adm0 + 3], last2));
    const infoS = typeInfoOf(await observe(ctx, ctx.raw, 'policy', 'TypeRegistry', 'registry', 'typeInfo', [strict.typeId], last2));
    const actS3 = activationOf(await observe(ctx, ctx.raw, 'policy', 'TypeRegistry', 'registry', 'activation', [strict.typeId, 3], last2));
    assert.equal(lc(bS.typeId), lc(strict.typeId), 'strict basis: typeId');
    assert.equal(lc(bS.mandatoryAcceptor), lc(ctx.addrs.strictAcceptor), 'strict basis: mandatory rule');
    assert.equal(lc(bS.ruleId), lc(infoS.ruleId), 'strict basis: ruleId == typeInfo.ruleId');
    assert.equal(bS.activation, '3', 'strict basis: policy row 3');
    assert.equal(lc(bS.policyAcceptor), lc(ctx.addrs.acceptor), 'strict basis: the mock policy');
    assert.equal(lc(bS.policyCodehash), lc(actS3.codehash), 'strict basis: policy codehash == row 3');
    assert.equal(bS.epoch, actS3.epoch, 'strict basis: epoch == row 3 epoch');
    rows.push({ label: 'policy/activate/strict/acceptance-basis', standing: 'retained raw replies (stages basis, policy): the compliant admission records the mandatory rule (StrictQuoteAcceptor) AND the additional policy row 3 (mock), joined by codehash and epoch', ordinal: adm0 + 3, recordId: rStrict, basis: bS, typeInfo: infoS, activationRow3: actS3 });
    return rows;
  },
};
// failure/refused-re-registration: the identical descriptor cannot be registered twice; a different descriptor under a
// colliding id is impossible by construction (statement, not a row)
const refusedRegistrationCell = {
  standing: 'exact Type identity (REPAIR.md R2): E_TYPE_EXISTS for an identical descriptor; registry state unchanged across the revert',
  plan: async (ctx, a, block) => {
    const touched = emptyTouched();
    const [derived] = await observeBoth(ctx, 'baseline', 'TypeRegistry', 'registry', 'typeIdOf', [SHAPE.QUOTE, ctx.addrs.quoteRule, []], block);
    const desc0 = descriptorOf(await observeBoth(ctx, 'baseline', 'TypeRegistry', 'registry', 'descriptor', [T.QUOTE], block));
    const [epoch0] = await observeBoth(ctx, 'baseline', 'TypeRegistry', 'registry', 'epoch', [], block);
    assert.equal(lc(derived), lc(T.QUOTE), 'refused-re-registration: typeIdOf(QUOTE descriptor) must equal the registered QUOTE id');
    const registry0 = { descriptor: desc0, epoch: str(epoch0) };
    return { authors: [a.nativeA, null], touched, derived, registry0, summary: { typeId: T.QUOTE, descriptor: { shape: SHAPE.QUOTE, mandatoryAcceptor: ctx.addrs.quoteRule, refs: [] }, collisionId: derived, registryAtBaseline: registry0 } };
  },
  body: async (ctx, a, plan) => {
    const { derived, registry0 } = plan;
    const rows = [];
    rows.push({ label: 'failure/refused-re-registration/collision-id', typeIdOf: derived, equalsRegisteredQuote: true, standing: 'retained baseline raw reply of TypeRegistry.typeIdOf(QUOTE_SHAPE, MinBodyAcceptor(32), []): the second registration targets exactly the existing id' });
    // simulated and sent FROM the deployer (the registry admin): without `from` the static probe would observe E_ADMIN (runner review 1)
    rows.push(await failureRow(ctx, 'failure/refused-re-registration (identical descriptor => the same derived id: E_TYPE_EXISTS(QUOTE); nothing rewritten)', call(ctx, 'TypeRegistry', 'registry', 'register', [SHAPE.QUOTE, ctx.addrs.quoteRule, []]), ['TypeRegistry', 'E_TYPE_EXISTS'], [[a.nativeA], T.QUOTE, NO_PROBE_FOLDER], { wallet: ctx.deployer, args: [T.QUOTE] }));
    const last = await ctx.latestBlock();
    const desc1 = descriptorOf(await observe(ctx, ctx.raw, 'registry-post', 'TypeRegistry', 'registry', 'descriptor', [T.QUOTE], last));
    const [epoch1] = await observe(ctx, ctx.raw, 'registry-post', 'TypeRegistry', 'registry', 'epoch', [], last);
    const registry1 = { descriptor: desc1, epoch: str(epoch1) };
    assert.deepEqual(registry1, registry0, 'refused-re-registration: the complete descriptor and the epoch must be unchanged across the refused registration');
    rows.push({ label: 'failure/refused-re-registration/registry-unchanged', standing: 'retained raw replies (stage registry-post) equal the baseline replies: descriptor, activations and epoch unchanged', registry: registry1 });
    rows.push({ label: 'failure/refused-re-registration/different-descriptor', status: 'statement', standing: 'NOT a transaction row. A different descriptor (shape, refTypes or declared rule) under the SAME id is impossible by construction: typeId = keccak256(abi.encode(DOM_TYPE, shape, keccak256(abi.encode(refTypes)), ruleId)), so a changed descriptor is a different id and an existing id is never rewritten (test/Falsify.t.sol test_F3_type_identity_is_exact_and_immutable registers changed descriptors and checks QUOTE is untouched).' });
    return rows;
  },
};
// failure/unsupported-native-import: a v == 0 packet claiming another principal is refused before any write (both destination paths)
const unsupportedImportCell = {
  standing: 'fail-closed native-source import (REPAIR.md R1): E_SOURCE_UNSUPPORTED, status 0, state unchanged; a temporary prototype limit (no verifiable source witness exists), not a portability waiver',
  plan: async (ctx, a, block) => {
    const salt = keccak256(toUtf8Bytes('failure/unsupported-native-import'));
    const pidA = await principalOf(ctx, a.signedA.address, block, true);
    const pidB = await principalOf(ctx, a.signedB.address, block, true);
    const pidOp = await principalOf(ctx, ctx.deployer.address, block, true);
    const victim = subjectId(pidA, salt); // the CLAIMED source principal's subject: must never be minted here
    const r1 = recordId(T.QUOTE, FIX.quote3000.bytes);
    const [realm] = await observeBoth(ctx, 'baseline', 'Ledger', 'ledger', 'realmId', [], block);
    const [core] = await observeBoth(ctx, 'baseline', 'Ledger', 'ledger', 'coreCodeCommitment', [], block);
    const touched = emptyTouched();
    touched.records.push(r1); touched.subjects.push(victim);
    touched.bindingKeys.push(binding(pidB, position(P.HEAD, victim, ZERO)), binding(pidOp, position(P.HEAD, victim, ZERO)));
    touched.lists.push(byTypeList(T.QUOTE), byAuthorList(pidA), byAuthorList(pidB), byAuthorList(pidOp));
    return { authors: [a.signedA, a.signedB], touched, salt, victim, r1, pidA, realm, core, summary: { claimedSourcePrincipal: pidA, claimedSourceRealm: realm, claimedSourceCode: core, victimSubject: victim, recordId: r1, packet: 'SourceEvidence with v == 0, r == s == 0, grade 0: every field is a bare claim', paths: ['signed destination authorization by AUTHOR_B (wallet 2)', 'msg.sender == claimed author (the relaying deployer EOA), empty destination signature'] } };
  },
  body: async (ctx, a, plan) => {
    const { salt, victim, r1, pidA, realm, core } = plan;
    const rows = [];
    const actions = [aCreate(salt), aPublish(T.QUOTE, FIX.quote3000.bytes), aBind(P.HEAD, victim, ZERO, r1, 0)];
    const bodies = ['0x', FIX.quote3000.bytes, '0x'];
    const header = await ctx.blockHeader(await ctx.latestBlock());
    const packet = (author) => ({ realmId: realm, coreCodeCommitment: core, acceptanceProfile: ZERO, indexObligations: ZERO, r: ZERO, s: ZERO, sourcePrincipal: pidA, author, nonce: 0, deadline: BigInt(header.timestamp) + 3600n, v: 0, grade: 0 });
    const probe = [[a.signedA, a.signedB], T.QUOTE, NO_PROBE_FOLDER];
    const pre = await observe(ctx, ctx.raw, 'squat-probe', 'Ledger', 'ledger', 'subjectCreatedAt', [victim], await ctx.latestBlock());
    assert.equal(pre[0], 0n, 'unsupported-native-import: the claimed subject must be absent at the start');
    // (a) signed destination path: AUTHOR_B authorizes itself at this Realm while the v == 0 packet claims AUTHOR_A's principal
    const dst = await signIntent(ctx, ctx.wallets[2], actions);
    rows.push(await failureRow(ctx, 'failure/unsupported-native-import/signed-destination (v == 0 packet claiming AUTHOR_A\'s principal, destination signature by AUTHOR_B: E_SOURCE_UNSUPPORTED)', { ...call(ctx, 'Ledger', 'ledger', 'importPublication', [packet(ctx.wallets[2].address), actions, bodies, dst.intent, dst.sig]), intent: dst.intentStr, sig: dst.sig }, 'E_SOURCE_UNSUPPORTED', probe, { args: [] }));
    // (b) msg.sender path: the relaying deployer EOA presents itself as the source author with an empty destination signature;
    // the static probe is simulated FROM the deployer so msg.sender == src.author holds in the simulation too (runner review 1)
    const none = { realmId: ZERO, coreCodeCommitment: ZERO, author: ZERO_ADDR, nonce: 0, deadline: 0, acceptanceProfile: ZERO, indexObligations: ZERO };
    rows.push(await failureRow(ctx, 'failure/unsupported-native-import/msg-sender (v == 0 packet, msg.sender == claimed author, empty destination signature: E_SOURCE_UNSUPPORTED)', call(ctx, 'Ledger', 'ledger', 'importPublication', [packet(ctx.deployer.address), actions, bodies, none, '0x']), 'E_SOURCE_UNSUPPORTED', probe, { wallet: ctx.deployer, args: [] }));
    const last = await ctx.latestBlock();
    const post = await observe(ctx, ctx.raw, 'squat-probe', 'Ledger', 'ledger', 'subjectCreatedAt', [victim], last);
    const src = await observe(ctx, ctx.raw, 'squat-probe', 'Ledger', 'ledger', 'sourceEvidence', [baseCount(ctx, 'publications') + 1], last);
    assert.equal(post[0], 0n, 'unsupported-native-import: the claimed subject must still be absent');
    assert.equal(lc(src[0].author), lc(ZERO_ADDR), 'unsupported-native-import: no source-evidence row may exist');
    rows.push({ label: 'failure/unsupported-native-import/nothing-minted', standing: 'retained raw replies (stage squat-probe): the claimed subject is absent before and after both refusals and no SourceEvidence row exists for the next publication ordinal', victimSubject: victim, subjectCreatedAtBefore: str(pre[0]), subjectCreatedAtAfter: str(post[0]), sourceEvidenceAuthor: src[0].author, sourceEvidenceGrade: str(src[0].grade) });
    rows.push({ label: 'failure/unsupported-native-import/limit-not-waiver', status: 'statement', standing: CAVEAT_NATIVE_IMPORT });
    return rows;
  },
};

// ---------------------------------------------------------------- the sealed paid point/list slice (sdk-fixture appendix; matched-cost-scope-review "Bounded C follow-through", B counterpart)
// Four paid rows (point A-first, list A-first, point B-first, list B-first) through JoinedConsumer.paidPoint / paidList,
// each the FIRST transaction after an evm_revert to the exact post-B1 seal, from a pinned unrelated caller, retained
// (receipt, PaidResult log, eth_call replay, abstractResult, persisted) BEFORE the next revert. B1 binds NO FOLDER
// placement; "no B placement" is proven by raw replies at the seal. This runner RECORDS observations (input evidence
// grade RPC_OBSERVED); the expectation, arm-input and basis seals are authored and hashed by the independent run
// controller (appendix "Practical pre-run pins" 1-5), never by this script. The expectations passed to the consumer
// here are this runner's local mirror of the fixture map (candidate-side); the sealed run replaces them with the
// independently authored vectors (pin 4).
// ---- paid-slice pure helpers (unit-tested in measure.test.mjs; self-contained: no module-scope references)
const PAID_CALLER_INDEX = 3; // wallets[3]: a fixed ephemeral account of the run mnemonic — not the deployer (0), not AUTHOR_A (1), not wallet 2 (signedB), not a producer contract
const PAID_CALLER_PATH = "m/44'/60'/0'/0/3";
const SELECTION_FIELDS = ['basisAdmission', 'indexGeneration', 'rulesEpoch', 'coreCodeCommitment', 'lensId', 'subject', 'selectedHead', 'selectedRevision', 'selectedAdmission', 'selectedPublication', 'selectedAuthor', 'selectedProofKind', 'pairId', 'itemA', 'itemB', 'mantissa', 'scale', 'observedAt', 'note'];
const PLACEMENT_FIELDS = ['position', 'actor', 'proofKind', 'revision', 'admission', 'publication', 'basisAdmission', 'pageStatus', 'rawTotal', 'scanned', 'hydrations', 'selectedSoFar', 'mutated', 'ended'];
// the arm-neutral "Common comparison row" (sdk-fixture appendix): every field required, none defaulted
const ABSTRACT_FIELDS = ['operation', 'lens', 'realm', 'execution', 'profile', 'observationBasis', 'executionBasis', 'queryCoordinate', 'presence', 'support', 'admission', 'selection', 'selectedFile', 'selectedHead', 'selectedRevision', 'selectedPhysical', 'selectedAuthor', 'selectedAuthorEvidenceCategory', 'placementCoordinate', 'placementProvenance', 'quoteCheck', 'pairCheck', 'itemChecks', 'candidateCoverage', 'pageCoverage', 'rawEvidence', 'paidExecution'];
// Ledger proof kinds -> experiment-local evidence categories; an unknown kind throws (never a default category)
function evidenceCategoryOf(proofKind, effect = false) {
  const categories = { 1: 'CONTRACT_ORIGINATED_PUBLICATION', 2: 'EOA_SIGNED_PUBLICATION' };
  const category = categories[String(proofKind)];
  if (!category) throw new Error(`unknown proof kind ${proofKind}: no evidence category (1 = contract-originated, 2 = EOA-signed)`);
  return effect ? `${category}_EFFECT` : category;
}
// The paid caller must be unrelated to every fixture role: not an author, not a producer contract, not the deployer, not a lab contract.
function assertUnrelatedCaller(caller, related) {
  const lower = (v) => String(v).toLowerCase();
  if (!caller || !/^0x[0-9a-fA-F]{40}$/.test(String(caller))) throw new Error(`paid caller ${caller} is not an address`);
  for (const [role, address] of Object.entries(related)) {
    if (address && lower(address) === lower(caller)) throw new Error(`paid caller ${caller} is not unrelated: it is the ${role}`);
  }
  return true;
}
// Build one abstract comparison row from retained observations only. A missing or unknown field throws, so an absent
// observation can never read as a passing row; selectedRevision must be the fixture LABEL (A2 / B1), never an ordinal;
// a PAID_POINT row must state that it charged no directory lookup.
function abstractRow(fields) {
  const missing = ABSTRACT_FIELDS.filter((k) => fields[k] === undefined || fields[k] === null);
  if (missing.length) throw new Error(`abstractResult: missing field(s) ${missing.join(', ')}`);
  const extra = Object.keys(fields).filter((k) => !ABSTRACT_FIELDS.includes(k));
  if (extra.length) throw new Error(`abstractResult: unknown field(s) ${extra.join(', ')}`);
  if (!['PAID_POINT', 'PAID_LIST'].includes(fields.operation)) throw new Error(`abstractResult: operation ${fields.operation} is not PAID_POINT | PAID_LIST`);
  if (!['LENS_A_FIRST', 'LENS_B_FIRST'].includes(fields.lens)) throw new Error(`abstractResult: lens ${fields.lens} is not LENS_A_FIRST | LENS_B_FIRST`);
  const selfCheck = fields.rawEvidence && fields.rawEvidence.selfCheck;
  if (!selfCheck || typeof selfCheck.match !== 'boolean') throw new Error('abstractResult: rawEvidence.selfCheck.match (boolean) is required');
  const isLabel = typeof fields.selectedRevision === 'string' && /^[A-Z][0-9]$/.test(fields.selectedRevision);
  if (!isLabel && fields.selectedRevision !== 'UNKNOWN') throw new Error(`abstractResult: selectedRevision ${fields.selectedRevision} must be the fixture label (A2 / B1) or UNKNOWN, not an ordinal`);
  if (fields.operation === 'PAID_POINT' && fields.placementCoordinate.lookedUpByThisRow !== false) throw new Error('abstractResult: a PAID_POINT row must not charge a directory lookup');
  if (fields.operation === 'PAID_LIST' && !['COMPLETE', 'UNKNOWN'].includes(fields.pageCoverage.status)) throw new Error(`abstractResult: a PAID_LIST row with pageCoverage ${fields.pageCoverage.status} is not a pass`);
  const outcomes = ['presence', 'support', 'admission', 'selection'].map((k) => fields[k].outcome);
  if (selfCheck.match) {
    if (outcomes.includes('UNKNOWN') || !isLabel || fields.candidateCoverage.status !== 'COMPLETE') throw new Error('abstractResult: a passing self-check must carry the established outcomes, labels and coverage');
  } else if (outcomes.some((o) => o !== 'UNKNOWN') || isLabel || fields.selectedHead !== 'UNKNOWN' || fields.selectedFile !== 'UNKNOWN' || fields.candidateCoverage.status !== 'UNKNOWN' || (fields.operation === 'PAID_LIST' && fields.pageCoverage.status !== 'UNKNOWN')) {
    throw new Error('abstractResult: a failed self-check may not carry a derived success claim');
  }
  const row = { inputEvidenceGrade: 'RPC_OBSERVED', standing: 'candidate-side observations retained by this runner, never expected answers; the expectation, arm-input and basis seals are authored and hashed by the independent run controller' };
  for (const k of ABSTRACT_FIELDS) row[k] = fields[k];
  return row;
}
// Seal/revert ordering of the paid rows. `events` is the ordered ledger the cell records:
//   {kind:'seal', block, hash} | {kind:'revert', block, hash} | {kind:'tx', label, block, parentHash} | {kind:'retained', label}
// Each paid row must be the FIRST transaction after a revert whose observed head IS the seal, mined at seal.block + 1 on
// seal.hash, and retained before the next revert. Returns the rows in order; any violation throws.
function checkPaidRowOrdering(events) {
  const seal = events[0];
  if (!seal || seal.kind !== 'seal') throw new Error('paid-row ordering: the first event must be the seal');
  if (typeof seal.timestamp !== 'number') throw new Error('paid-row ordering: the seal carries no timestamp');
  const expectedTimestamp = seal.timestamp + 1;
  const rows = [];
  let open = null;
  let armed = false;
  for (const ev of events.slice(1)) {
    if (ev.kind === 'seal') throw new Error('paid-row ordering: a second seal');
    if (ev.kind === 'revert') {
      if (open) throw new Error(`paid-row ordering: revert before row ${open.label} was retained`);
      if (ev.block !== seal.block || ev.hash !== seal.hash) throw new Error(`paid-row ordering: after the revert the head is ${ev.block} ${ev.hash}, not the seal ${seal.block} ${seal.hash}`);
      if (ev.nextTimestamp !== expectedTimestamp) throw new Error(`paid-row ordering: next block timestamp set to ${ev.nextTimestamp}, expected ${expectedTimestamp}`);
      armed = true;
    } else if (ev.kind === 'tx') {
      if (!armed) throw new Error(`paid-row ordering: row ${ev.label} is not the first transaction after a revert to the seal`);
      if (ev.block !== seal.block + 1 || ev.parentHash !== seal.hash) throw new Error(`paid-row ordering: row ${ev.label} mined at ${ev.block} on ${ev.parentHash}, expected ${seal.block + 1} on ${seal.hash}`);
      if (ev.timestamp !== expectedTimestamp) throw new Error(`paid-row ordering: row ${ev.label} executed at timestamp ${ev.timestamp}, expected ${expectedTimestamp}`);
      if (ev.txIndex !== 0) throw new Error(`paid-row ordering: row ${ev.label} has transactionIndex ${ev.txIndex}, not 0`);
      if (ev.txCount !== 1 || ev.onlyTx !== true) throw new Error(`paid-row ordering: row ${ev.label} is not the only transaction in its block (${ev.txCount} transactions)`);
      armed = false;
      open = { label: ev.label, block: ev.block, timestamp: ev.timestamp, txIndex: ev.txIndex, txCount: ev.txCount };
    } else if (ev.kind === 'retained') {
      if (!open || open.label !== ev.label) throw new Error(`paid-row ordering: retained ${ev.label} without that row open`);
      rows.push({ ...open, retained: true });
      open = null;
    } else {
      throw new Error(`paid-row ordering: unknown event kind ${ev.kind}`);
    }
  }
  if (open) throw new Error(`paid-row ordering: row ${open.label} was never retained`);
  if (rows.length === 0) throw new Error('paid-row ordering: no paid row');
  const timestamps = new Set(rows.map((r) => r.timestamp));
  if (timestamps.size !== 1) throw new Error(`paid-row ordering: the paid rows executed at different timestamps ${[...timestamps].join(', ')}`);
  return rows;
}
// Only an OWNED --anvil chain may run the sealing cells: they snapshot, revert, set block timestamps and touch automining,
// which must never be done to a supplied --rpc node. Checked before any chain call; the other cells keep their --rpc path.
const ANVIL_ONLY_CELLS = ['joined/paid-slice', 'joined/a1-without-placement'];
function assertAnvilOnlyCells(selected, anvil, anvilOnly = ANVIL_ONLY_CELLS) {
  const blocked = selected.filter((k) => anvilOnly.includes(k));
  if (blocked.length && !anvil) throw new Error(`cell(s) ${blocked.join(', ')} run only on an owned --anvil chain (they seal, revert, set block timestamps and change automining); refusing before any chain call — pass --anvil or deselect them`);
  return blocked;
}
function buildPaidCalls(inputs) {
  const isolated = JSON.parse(JSON.stringify(inputs));
  const { lenses, expect, placementExpect } = isolated;
  return [
    { key: 'point-a-first', operation: 'PAID_POINT', lens: 'LENS_A_FIRST', lensArr: lenses.LENS_A_FIRST, fn: 'paidPoint', fnArgs: [lenses.LENS_A_FIRST, expect.A_FIRST] },
    { key: 'list-a-first', operation: 'PAID_LIST', lens: 'LENS_A_FIRST', lensArr: lenses.LENS_A_FIRST, fn: 'paidList', fnArgs: [lenses.LENS_A_FIRST, expect.A_FIRST, placementExpect] },
    { key: 'point-b-first', operation: 'PAID_POINT', lens: 'LENS_B_FIRST', lensArr: lenses.LENS_B_FIRST, fn: 'paidPoint', fnArgs: [lenses.LENS_B_FIRST, expect.B_FIRST] },
    { key: 'list-b-first', operation: 'PAID_LIST', lens: 'LENS_B_FIRST', lensArr: lenses.LENS_B_FIRST, fn: 'paidList', fnArgs: [lenses.LENS_B_FIRST, expect.B_FIRST, placementExpect] },
  ];
}
function controllerFailureRow(label, error) {
  const failureCode = error?.code ?? 'CONTROLLER_ERROR';
  return { label, status: failureCode === 'CONTROLLER_TIMEOUT' ? 'CONTROLLER_TIMEOUT' : 'CONTROLLER_REFUSED', failureCode, error: error?.message ?? String(error), transactions: [] };
}
// Derive one abstract comparison row from a paid-result check, its replay observation and the row's retained context.
// PURE (unit-tested). No field derived from the PaidResult log may claim success unless the check passed entirely (one
// log, decodable replay, replay commitment == log commitment, every pinned field equal to the runner expectation).
// Otherwise every derived label, outcome and coverage is UNKNOWN with the reason, while the raw observations and the
// mismatch record stay retained; only fields a SEPARATE retained observation establishes keep values, each naming it.
function deriveAbstractResult({ check, replay, evidenceFor: ev }) {
  const lower = (v) => String(v).toLowerCase();
  const isList = ev.operation === 'PAID_LIST';
  const logPresent = !!check && check.logCount === 1 && !!check.fromLog;
  const replayDecoded = !!check && !!check.fromReplay && !check.fromReplay.error;
  const ok = logPresent && replayDecoded && check.commitmentsAgree === true && check.replayOk === true && check.match === true;
  const reason = ok ? null
    : !logPresent ? `no single PaidResult log in the receipt (logCount ${check ? check.logCount : 'unknown'})`
    : !replayDecoded ? 'the eth_call replay at the receipt block did not decode'
    : check.commitmentsAgree !== true ? 'the replay commitment differs from the log commitment'
    : check.replayOk !== true ? 'the replay observation differs from the runner expectation'
    : 'the log observation differs from the runner expectation';
  const consequence = 'row is not a pass; the mismatch is counted and fails the run; raw observations retained';
  const unknown = () => ({ outcome: 'UNKNOWN', reason, consequence });
  const s = ok ? check.fromLog.selection : null;
  const p = ok && isList ? check.fromLog.placement : null;
  const labelOf = (map, key, what) => { const v = map[lower(key)]; if (!v) throw new Error(`abstractResult: no fixture label for ${what} ${key}`); return v; };
  const [headLabel, revisionLabel] = ok ? labelOf(ev.headLabels, s.selectedHead, 'selected head') : ['UNKNOWN', 'UNKNOWN'];
  const [authorLabel, authorKind] = ok ? labelOf(ev.authorLabels, s.selectedAuthor, 'selected author') : ['UNKNOWN', 'UNKNOWN'];
  const sealPl = ev.placementAtSeal; // a SEPARATE retained observation (stage seal-placement raw replies), independent of this row's log
  const fromSeal = (why) => ({ sourceStep: 'A1', actor: 'AUTHOR_A', actorAddress: sealPl.author, evidenceCategory: evidenceCategoryOf(Number(sealPl.proofKind), true), publication: sealPl.publication, admission: sealPl.admission, revision: sealPl.revision, basis: ev.sealBasis.admissionFrontier, independentOfContentSelection: true, establishedBy: why });
  const outcome = (name, how) => (ok ? { outcome: name, establishedBy: `${how} AND a passing self-check (rawEvidence.selfCheck)` } : unknown());
  return abstractRow({
    operation: ev.operation, lens: ev.lens,
    realm: { chainId: ev.chainId, realmId: ev.sealBasis.realmId, ledger: ev.addrs.ledger, coreCodeCommitment: ev.sealBasis.coreCodeCommitment, establishedBy: 'raw replies at the seal (stage seal), a separate observation' },
    execution: { consumer: ev.addrs.consumer, consumerCodeCommitment: ev.consumerCodehash, lensReader: ev.addrs.lensReader, indexModule: ev.addrs.indexModule, registry: ev.addrs.registry, deploymentEvidence: 'report.deployment of this run; the sealed run uses the independently retained deployment facts (appendix pin 3)' },
    profile: 'road-b-lab/2 (PROFILE.md; F5 Core pinned at ca1a228); no commitment is treated as authority for another',
    observationBasis: { admissionFrontier: ev.sealBasis.admissionFrontier, indexGeneration: ev.sealBasis.indexGeneration, rulesEpoch: ev.sealBasis.rulesEpoch, coreCodeCommitment: ev.sealBasis.coreCodeCommitment, sealBlock: ev.seal.block, sealBlockHash: ev.seal.hash, sealTimestamp: ev.seal.timestamp, consumerObserved: ok ? { basisAdmission: s.basisAdmission, indexGeneration: s.indexGeneration, rulesEpoch: s.rulesEpoch, coreCodeCommitment: s.coreCodeCommitment } : unknown(), establishedBy: 'the seal raw replies (stage seal), a separate observation; consumerObserved is the log\'s view of the same basis (pinned by BasisMismatch); never an unqualified latest' },
    executionBasis: { block: ev.row.block, blockHash: ev.row.blockHash, parentHash: ev.executed.parentHash, timestamp: ev.executed.timestamp, transaction: ev.row.hash, txIndex: ev.executed.txIndex, txCount: ev.executed.txCount, establishedBy: 'the receipt and eth_getBlockByNumber(block, false) retained in transactions[] / blocks[]; separate from the observation basis; seal + 1 with the matched parent hash and timestamp across the four rows' },
    queryCoordinate: isList
      ? { labels: { parent: '/swaps', name: 'eth-usdc', page: 'one bounded page, budget 16, fresh cursor', endCondition: 'every lens principal\'s raw scope list exhausted (next.lensIndex == lens.length, rawIndex == 0)' }, physical: { folder: ev.coordinates.folder, nameRole: ev.coordinates.nameRole, subject: ev.coordinates.subject }, exactBytes: `transactions[${ev.row.txIndex}].data` }
      : { labels: { file: 'FILE_QUOTE' }, physical: { subject: ev.coordinates.subject }, exactBytes: `transactions[${ev.row.txIndex}].data` },
    presence: outcome('FOUND', 'LensReader.resolve status 1 inside the consumer (NoSelection otherwise)'),
    support: outcome('SUPPORTED', 'exact Types and shapes of Quote, Pair and both Items inside the consumer (QuoteShape / PairShape / ItemShape otherwise)'),
    admission: outcome('ADMITTED', 'live BIND admission inside its publication\'s range, author and proof category of the retained evidence (AdmissionShape / EvidenceBounds / AuthorMismatch / ProofCategory / ProofShape otherwise)'),
    selection: outcome('SELECTED', 'ordered-lens selection (the first principal with a binding decides) equal to the expected author and head id, with the sealed Quote fields equal (SelectionMismatch otherwise); a status-1 receipt cannot fill this field'),
    selectedFile: ok ? 'FILE_QUOTE' : 'UNKNOWN', selectedHead: headLabel, selectedRevision: revisionLabel,
    selectedPhysical: ok ? { subject: s.subject, head: s.selectedHead, revisionOrdinal: s.selectedRevision, admission: s.selectedAdmission, publication: s.selectedPublication, standing: 'physical ids/ordinals retained separately from the labels; the revision ordinal is arm-local, not a cross-arm ordinal' } : unknown(),
    selectedAuthor: ok ? { label: authorLabel, address: s.selectedAuthor, principalKind: authorKind } : unknown(),
    selectedAuthorEvidenceCategory: ok ? evidenceCategoryOf(Number(s.selectedProofKind)) : 'UNKNOWN',
    placementCoordinate: isList
      ? { lookedUpByThisRow: true, parent: '/swaps', name: 'eth-usdc', physical: ok ? { position: p.position, folder: ev.coordinates.folder, nameRole: ev.coordinates.nameRole } : unknown() }
      : { lookedUpByThisRow: false, parent: '/swaps', name: 'eth-usdc', physical: { position: ev.coordinates.position }, standing: 'not charged to the point transaction; retained and joined from the seal raw replies (row paid/seal/a-placement-provenance)' },
    placementProvenance: isList && ok
      ? { sourceStep: 'A1', actor: 'AUTHOR_A', actorAddress: p.actor, evidenceCategory: evidenceCategoryOf(Number(p.proofKind), true), publication: p.publication, admission: p.admission, revision: p.revision, basis: s.basisAdmission, independentOfContentSelection: true, establishedBy: 'paid: JoinedConsumer._placement (PlacementMismatch / ProofCategory / EvidenceBounds otherwise) AND a passing self-check' }
      : fromSeal(isList ? `this row's log failed its self-check (${reason}); these values are the SEPARATE seal raw replies (stage seal-placement, placementAtSeal.byLens.${ev.lens}), not this transaction` : `raw replies at the seal (stage seal-placement): LensReader.resolve under ${ev.lens} (placementAtSeal.byLens.${ev.lens}) + admission + evidence; not this transaction`),
    quoteCheck: ok ? { typeId: ev.types.QUOTE_J, bodyLength: 160, head: s.selectedHead, mantissa: s.mantissa, scale: s.scale, observedAt: s.observedAt, noteCommitment: s.note, establishedBy: 'exact Type + 160-byte shape + the sealed fixture fields (pair, ordered items, mantissa, scale, observedAt, note commitment) compared inside the consumer (QuoteShape / ClosureMismatch / SelectionMismatch otherwise)' } : unknown(),
    pairCheck: ok ? { typeId: ev.types.PAIR, pairId: s.pairId, orderedRefs: [s.itemA, s.itemB], establishedBy: 'PAIR Type and >= 64-byte body; the two leading words are the ordered references (PairShape / ClosureMismatch otherwise)' } : unknown(),
    itemChecks: ok ? [{ label: 'ITEM_ETH', typeId: ev.types.ITEM, id: s.itemA }, { label: 'ITEM_USDC', typeId: ev.types.ITEM, id: s.itemB }] : [unknown()],
    candidateCoverage: { status: ok ? 'COMPLETE' : 'UNKNOWN', ...(ok ? {} : { reason, consequence }), universe: 'HEAD bindings of the lens principals at (HEAD, FILE_QUOTE) at the observation basis; ordered-lens selection', lens: ev.lensArr, basis: ev.sealBasis.admissionFrontier, endCondition: `ordered lens of ${ev.lensArr.length} principals; the first principal with a HEAD binding decides (live -> FOUND, tombstone -> MASKED, never fall-through), so every candidate up to the deciding principal is visited by construction of LensReader.resolve`, sameForPointAndList: true, standing: 'point and list qualify the same candidate universe at the same basis; physical witnesses (hydrations, page bytes) may differ' },
    pageCoverage: isList
      ? (ok ? { status: 'COMPLETE', rawTotal: p.rawTotal, scanned: p.scanned, hydrations: p.hydrations, selectedSoFar: p.selectedSoFar, mutated: p.mutated, ended: p.ended, rows: 1, standing: 'fixture/profile-scoped coverage (IndexModule FAMILY_SCOPE COMPLETE + every raw list exhausted), not authenticated global completeness; PARTIAL / UNKNOWN revert (PlacementWindow)' } : { status: 'UNKNOWN', reason, consequence })
      : { status: 'NOT_APPLICABLE', standing: 'a File-keyed point read performs no directory lookup' },
    rawEvidence: { transaction: { txIndex: ev.row.txIndex, hash: ev.row.hash, rawTransaction: `transactions[${ev.row.txIndex}].rawTransaction`, calldata: `transactions[${ev.row.txIndex}].data`, receiptLogs: `transactions[${ev.row.txIndex}].receipt.logs`, blockTransactions: ev.executed.txHashes }, paidResultLog: logPresent ? check.fromLog : null, replay: { rpcId: replay.rpcId, from: replay.from, stage: replay.stage, blockTag: replay.blockTag, returnData: replay.returnData, error: replay.error }, selfCheck: { match: ok, ref: check ? check.label : null, reason, logCount: check ? check.logCount : null }, seal: { rows: ['paid/seal', 'paid/seal/a-placement-provenance', 'paid/seal/no-b-placement'], stages: ['seal', 'seal-placement', 'seal-no-b-placement'] }, bodiesAndIds: 'plan (fixture map: exact bodies, ids, positions, binding keys)' },
    paidExecution: { caller: ev.caller.address, callerDerivation: ev.caller.derivationPath, consumer: ev.addrs.consumer, targets: { ledger: ev.addrs.ledger, lensReader: ev.addrs.lensReader, indexModule: ev.addrs.indexModule, registry: ev.addrs.registry }, codeCommitments: { ledger: ev.sealBasis.coreCodeCommitment, consumer: ev.consumerCodehash }, transaction: ev.row.hash, receiptStatus: ev.row.status, gasUsed: ev.row.gas, returnData: { raw: replay.returnData, source: `eth_call replay at block ${replay.blockTag} (rpcId ${replay.rpcId})`, decoded: ok ? { commitment: check.fromReplay.commitment } : unknown() }, revertData: replay.error ? replay.error : null },
  });
}
// ---- paid-slice cells
const pickFields = (result, fields) => Object.fromEntries(fields.map((k) => [k, str(result[k])]));
// The fixture map of the paid slice is the joined cell's (same bodies, ids, positions, lenses); only the planned counts
// differ (no step 6 here) and the pinned paid caller is recorded with its derivation index (no secret retained).
function paidSlicePlan(plannedPublications, plannedAdmissions) {
  return async (ctx, a, block) => {
    const plan = await joinedCell.plan(ctx, a, block);
    plan.touched.plannedPublications = plannedPublications;
    plan.touched.plannedAdmissions = plannedAdmissions;
    const caller = ctx.wallets[PAID_CALLER_INDEX];
    plan.summary = { ...plan.summary, paidCaller: { address: caller.address, derivationPath: PAID_CALLER_PATH, mnemonicIndex: PAID_CALLER_INDEX, standing: 'fixed ephemeral account of the run mnemonic; unrelated to every fixture role (asserted before the first paid row); no secret retained' } };
    return plan;
  };
}
// step 1 and the A1 / A2 / B1 author steps as separate setup rows (their receipts are setup cost, never paid-read cost)
async function paidStep1(ctx, a, plan, rows) {
  const { iA, iB, pairBody } = plan;
  rows.push(await send(ctx, () => a.nativeA.build([aPublish(T.ITEM, iA), aPublish(T.ITEM, iB), aPublish(T.PAIR, pairBody)], [iA, iB, pairBody]), 'paid/setup/step1 (operator: ITEM_ETH, ITEM_USDC, PAIR_ETH_USDC in one native batch; identical to joined/step1)', { extra: { costClass: 'setup: fixture prerequisites, reported separately from the paid rows' } }));
  touchedPubs(ctx, plan);
}
async function paidA1(ctx, a, plan, rows, { placement }) {
  const { salt, subj, q1, a1, swaps, nameHash, market } = plan;
  const actions = [aCreate(salt), aPublish(T.QUOTE_J, q1), aBind(P.HEAD, subj, ZERO, a1, 0)];
  const bodies = ['0x', q1, '0x'];
  if (placement) { actions.push(aBind(P.FOLDER, swaps, nameHash, subj, 0)); bodies.push('0x'); }
  actions.push(aBind(P.TAG, subj, market, subj, 0));
  bodies.push('0x');
  const label = placement
    ? 'paid/setup/A1 (AUTHOR_A signed: create FILE_QUOTE + publish QUOTE_A1 + head + the ONE /swaps placement + market tag; one combined receipt)'
    : 'joined/a1-without-placement/A1-minus-placement (AUTHOR_A signed: the identical A1 batch minus the FOLDER bind; paired control)';
  const extra = placement
    ? { costClass: 'setup', actions: actions.length, placementCost: 'ESTIMATE: the single A placement is one of five actions in this combined receipt and is NOT separable from it; pin the optional paired control joined/a1-without-placement to measure it' }
    : { costClass: 'paired control', actions: actions.length, pairing: 'same sealed pre-A1 state (run snapshot + identical step 1), same author, nonce and bodies as paid/setup/A1; the only action difference is the absent FOLDER bind (signature/deadline calldata bytes differ per run: ESTIMATED tens of gas of noise)' };
  rows.push(await send(ctx, () => a.signedA.build(actions, bodies), label, { extra }));
  touchedPubs(ctx, plan);
}
async function paidA2B1(ctx, a, plan, rows) {
  const { subj, q2, q3, a2, b1 } = plan;
  rows.push(await send(ctx, () => a.signedA.build([aPublish(T.QUOTE_J, q2), aBind(P.HEAD, subj, ZERO, a2, 1)], [q2, '0x']), 'paid/setup/A2 (AUTHOR_A signed: publish QUOTE_A2 + CAS head rev 1 -> 2; A1 retained in history; the placement is untouched)', { extra: { costClass: 'setup', actions: 2 } }));
  touchedPubs(ctx, plan);
  rows.push(await send(ctx, () => a.nativeB.build([aPublish(T.QUOTE_J, q3), aBind(P.HEAD, subj, ZERO, b1, 0)], [q3, '0x']), 'paid/setup/B1 (AUTHOR_B, the producer contract: publish QUOTE_B1 + B head rev 1; NO FOLDER bind — a competing content head only, never a second placement)', { extra: { costClass: 'setup', actions: 2, folderBind: false } }));
  touchedPubs(ctx, plan);
}
// Seal the exact post-B1 state: snapshot id + block number / hash / timestamp (the header envelope is retained in blocks[]).
async function sealState(ctx, label) {
  const snap = await ctx.other('evm_snapshot', [], { label: `${label}: evm_snapshot` });
  const block = await ctx.latestBlock();
  const header = await ctx.blockHeader(block);
  return { snapshot: snap.response.result, block, hash: header.hash, parentHash: header.parentHash, timestamp: Number(header.timestamp), snapshotRpcId: snap.request.id };
}
// Restore the seal before a paid row: evm_revert (single-use id, so re-seal), drop cached headers above the seal and every
// cached nonce, re-read the head EXPLICITLY (not from the cache) and assert it is the sealed header with an empty pool.
async function restoreSeal(ctx, seal, label, ordering) {
  const reverted = seal.snapshot;
  const rev = await ctx.other('evm_revert', [reverted], { label: `${label}: evm_revert` });
  assert.equal(rev.response.result, true, `${label}: evm_revert(${reverted}) failed`);
  seal.snapshot = (await ctx.other('evm_snapshot', [], { label: `${label}: re-seal` })).response.result;
  const nextTimestamp = seal.timestamp + 1; // matched next-block TIME control: every paid row executes at seal + 1 with the same timestamp
  const tsEnv = await ctx.other('evm_setNextBlockTimestamp', [nextTimestamp], { label: `${label}: evm_setNextBlockTimestamp ${nextTimestamp}` });
  for (const k of [...ctx.blockCache.keys()]) if (k > seal.block) ctx.blockCache.delete(k);
  for (const w of ctx.wallets) ctx.nonces.forget(w.address);
  const latest = await ctx.latestBlock();
  const e = await ctx.rpc('eth_getBlockByNumber', [qty(latest), false], { label: `${label}: after-revert header` });
  ctx.blocks.push({ ...envOf(e), source: ctx.source, blockNumber: latest, blockHash: e.response.result.hash });
  const caller = ctx.wallets[PAID_CALLER_INDEX].address;
  const nonceLatest = Number((await ctx.other('eth_getTransactionCount', [caller, 'latest'], { label: `${label}: caller nonce latest` })).response.result);
  const noncePending = Number((await ctx.other('eth_getTransactionCount', [caller, 'pending'], { label: `${label}: caller nonce pending` })).response.result);
  assert.equal(latest, seal.block, `${label}: after the revert the head is block ${latest}, not the seal ${seal.block}`);
  assert.equal(e.response.result.hash, seal.hash, `${label}: after the revert the head hash ${e.response.result.hash} is not the sealed ${seal.hash}`);
  assert.equal(nonceLatest, noncePending, `${label}: pending pool is not empty after the revert`);
  ordering.push({ kind: 'revert', block: latest, hash: e.response.result.hash, snapshot: reverted, resealed: seal.snapshot, nextTimestamp, setTimestampRpcId: tsEnv.request.id });
  log(`  seal ${label}: evm_revert(${reverted}) -> block ${latest} ${seal.hash}; re-sealed as ${seal.snapshot}`);
}
// The PaidResult log of a paid row (parsed from the receipt) and an eth_call replay of the same calldata FROM the same
// caller at the receipt block, both compared field by field with this runner's recomputed expectation (candidate-side
// self-check). A log-count, decode, commitment or field mismatch counts as a cell mismatch, which fails the run at the end.
async function paidResultCheck(ctx, row, expectedSelection, expectedPlacement) {
  const tx = ctx.txs[row.txIndex];
  const ifc = iface('JoinedConsumer');
  const logs = tx.receipt.logs.filter((l) => l.address.toLowerCase() === ctx.addrs.joinedConsumer.toLowerCase()).map((l) => { try { return ifc.parseLog({ topics: l.topics, data: l.data }); } catch { return null; } }).filter((p) => p && p.name === 'PaidResult');
  const fromLog = logs.length === 1 ? { kind: logs[0].args.kind, commitment: logs[0].args.commitment, selection: pickFields(logs[0].args.selection, SELECTION_FIELDS), placement: pickFields(logs[0].args.placement, PLACEMENT_FIELDS) } : null;
  const replay = await observeRaw(ctx, ctx.raw, `paid-replay:${row.label}`, { contract: 'JoinedConsumer', fn: tx.candidateInputs.fn, args: tx.candidateInputs.args }, tx.to, tx.data, row.block, { from: tx.from }); // tx.from = the paid caller that sent the row (send() records it); retained in the envelope as params[0].from
  let fromReplay;
  try {
    const d = ifc.decodeFunctionResult(tx.candidateInputs.fn, replay.returnData);
    fromReplay = { commitment: d[0], selection: pickFields(d[1], SELECTION_FIELDS), placement: d.length > 2 ? pickFields(d[2], PLACEMENT_FIELDS) : null };
  } catch (e) {
    fromReplay = { error: String(e.message) };
  }
  const norm = (v) => (typeof v === 'boolean' ? String(v) : String(v).toLowerCase());
  const compare = (observed, expected) => {
    const fields = {};
    let ok = !!observed;
    for (const [k, v] of Object.entries(expected)) {
      const equal = !!observed && norm(observed[k]) === norm(v);
      fields[k] = { expected: norm(v), actual: observed ? norm(observed[k]) : null, equal };
      if (!equal) ok = false;
    }
    return { ok, fields };
  };
  const selectionFromLog = compare(fromLog ? fromLog.selection : null, expectedSelection);
  const placementFromLog = compare(fromLog ? fromLog.placement : null, expectedPlacement);
  const replayOk = !!fromReplay && !fromReplay.error && compare(fromReplay.selection, expectedSelection).ok && (fromReplay.placement === null || compare(fromReplay.placement, expectedPlacement).ok);
  const commitmentsAgree = !!fromLog && !!fromReplay && !fromReplay.error && norm(fromLog.commitment) === norm(fromReplay.commitment);
  const match = logs.length === 1 && selectionFromLog.ok && placementFromLog.ok && replayOk && commitmentsAgree;
  if (!match) ctx.mismatches++;
  const inputStanding = ctx.controllerGate.enabled ? `controller-supplied paid inputs (ack-beforeFixture inputsSha256 ${ctx.controllerGate.inputsSha256})` : CAVEAT_EXPECTED;
  const check = { label: `${row.label}/paid-result`, kind: 'paid-result', standing: inputStanding, block: row.block, logCount: logs.length, fromLog, fromReplay, replayRpcId: replay.rpcId, replayFrom: tx.from, replayObs: { rpcId: replay.rpcId, from: tx.from, stage: `paid-replay:${row.label}`, blockTag: replay.blockTag, returnData: replay.returnData, error: replay.error }, selectionFromLog, placementFromLog, replayOk, commitmentsAgree, match };
  ctx.consumerChecks.push(check);
  log(`  chk  ${check.label}: ${match ? 'match' : 'MISMATCH ' + JSON.stringify({ logCount: logs.length, selectionFromLog, placementFromLog, commitmentsAgree, replayError: fromReplay && fromReplay.error })}`);
  return check;
}
const paidSliceCell = {
  standing: 'the sealed paid point/list slice (sdk-fixture appendix): A1/A2/B1 setup rows, the exact post-B1 seal, four paid rows (point/list x A-first/B-first) each the first transaction after a revert to that seal from the pinned unrelated caller, with abstractResult rows (RPC_OBSERVED observations, never expected answers)',
  plan: paidSlicePlan(4, 12),
  body: async (ctx, a, plan) => {
    const { itemA, itemB, pairId, subj, a1, a2, b1, swaps, nameHash, swapsPos, pidB } = plan;
    const rows = [];
    const adm0 = baseCount(ctx, 'admissions'); const pub0 = baseCount(ctx, 'publications');
    const A = a.signedA.address, B = a.nativeB.address;
    const ab = [A, B], ba = [B, A];
    const caller = ctx.wallets[PAID_CALLER_INDEX];
    assertUnrelatedCaller(caller.address, { deployer: ctx.deployer.address, AUTHOR_A: A, AUTHOR_B: B, 'wallet 2 (signedB)': a.signedB.address, ...Object.fromEntries(Object.entries(ctx.addrs).map(([k, v]) => [`contract ${k}`, v])) });
    const keep = (r) => { ctx.rowLog.push(r); rows.push(r); if (ctx.persist) ctx.persist(); return r; }; // statement/seal rows land in rowLog (persisted) when created, not only when the body returns
    // funding pre-check of the paid caller at the current (after-revert) block, never 'latest'; on --anvil --accounts 4 funds index 3
    const fundingBlock = await ctx.latestBlock();
    const balanceEnv = await ctx.other('eth_getBalance', [caller.address, qty(fundingBlock)], { label: 'paid: caller balance' });
    const callerBalance = BigInt(balanceEnv.response.result);
    assert(callerBalance > 0n, `paid: the pinned caller ${caller.address} has no balance at block ${fundingBlock}; fund mnemonic index ${PAID_CALLER_INDEX} before the run`);
    keep({ label: 'paid/caller-funding', status: 'eth_getBalance', standing: 'retained rpcOther envelope: the pinned unrelated caller is funded at the explicit after-revert block (asserted > 0 before any setup or paid row)', caller: caller.address, derivationPath: PAID_CALLER_PATH, blockTag: fundingBlock, balanceWei: callerBalance.toString(), rpcId: balanceEnv.request.id });
    // ---- setup (four separate receipts; the A1 combined receipt is NOT a marginal placement cost)
    await paidStep1(ctx, a, plan, rows);
    await paidA1(ctx, a, plan, rows, { placement: true });
    await paidA2B1(ctx, a, plan, rows);
    // ---- the exact post-B1 seal, and the raw joins every paid row shares (retained BEFORE any paid row)
    const seal = await sealState(ctx, 'paid/seal');
    const basis = adm0 + 12;
    const at = seal.block;
    const countsAtSeal = await observe(ctx, ctx.raw, 'seal', 'Ledger', 'ledger', 'counts', [], at);
    const [admissionsAtSeal] = countsAtSeal;
    assert.equal(Number(admissionsAtSeal), basis, `paid/seal: admission frontier ${admissionsAtSeal} != expected ${basis}`);
    const [generation] = await observe(ctx, ctx.raw, 'seal', 'IndexModule', 'index', 'generation', [], at);
    const [epoch] = await observe(ctx, ctx.raw, 'seal', 'TypeRegistry', 'registry', 'epoch', [], at);
    const [core] = await observe(ctx, ctx.raw, 'seal', 'Ledger', 'ledger', 'coreCodeCommitment', [], at);
    const [realmId] = await observe(ctx, ctx.raw, 'seal', 'Ledger', 'ledger', 'realmId', [], at);
    keep({ label: 'paid/seal', standing: 'the exact post-B1 basis: evm_snapshot id (single-use; re-sealed after every revert), block number/hash/timestamp from the retained header, admission frontier / index generation / rules epoch / Core code commitment from raw replies (stage seal) at that block', snapshot: seal.snapshot, snapshotRpcId: seal.snapshotRpcId, blockNumber: seal.block, blockHash: seal.hash, timestamp: seal.timestamp, observationBasis: { admissionFrontier: basis, indexGeneration: str(generation), rulesEpoch: str(epoch), coreCodeCommitment: core, realmId } });
    if (ctx.controllerGate.enabled) {
      const [step1Tx, A1Tx, A2Tx, B1Tx] = ctx.txs;
      const receipt = (tx, publication, extra = {}) => ({ txHash: tx.hash.toLowerCase(), block: String(tx.receipt.blockNumber), status: tx.receipt.status, gasUsed: String(tx.receipt.gasUsed), publication: String(publication), ...extra });
      const checkpoint = {
        blockNumber: String(seal.block), blockHash: seal.hash.toLowerCase(), timestamp: String(seal.timestamp), snapshot: String(seal.snapshot),
        frontier: { admissions: str(countsAtSeal[0]), records: str(countsAtSeal[1]), bindings: str(countsAtSeal[2]), publications: str(countsAtSeal[3]) },
        indexGeneration: str(generation), registryEpoch: str(epoch), coreCodeCommitment: core.toLowerCase(), realmId: realmId.toLowerCase(),
      };
      const afterContext = {
        schema: 'efs-lab-b/controller-context/1', runId: ctx.controllerGate.runId, stage: 'afterB1', sentAtUtc: new Date().toISOString(), pins: ctx.controllerGate.pins,
        inputsSha256: ctx.controllerGate.inputsSha256,
        checkpoint,
        setupReceipts: {
          step1: receipt(step1Tx, pub0 + 1), A1: receipt(A1Tx, pub0 + 2), A2: receipt(A2Tx, pub0 + 3),
          B1: receipt(B1Tx, pub0 + 4, { actions: 2, folderBind: false }),
        },
        ackPath: join(SCRATCH_ROOT, 'controller', 'ack-afterB1.json'),
      };
      // Controller owns its independent raw reads here. Candidate placement/no-B diagnostics begin only after ACK.
      try {
        await ctx.controllerGate.invoke('afterB1', afterContext);
        if (ctx.persist) ctx.persist();
      } catch (error) {
        keep(controllerFailureRow('paid/controller-afterB1', error));
        throw error;
      }
    }
    // A placement provenance at the seal (joined here for the point rows, which do not look the directory up)
    const pl = await observe(ctx, ctx.raw, 'seal-placement', 'LensReader', 'lens', 'resolve', [ab, P.FOLDER, swaps, nameHash], at);
    assert.equal(str(pl[0]), '1', 'paid/seal: the A placement must be FOUND under LENS_A_FIRST');
    const plB = await observe(ctx, ctx.raw, 'seal-placement', 'LensReader', 'lens', 'resolve', [ba, P.FOLDER, swaps, nameHash], at); // the lens-matching reply for the B-first rows
    assert.equal(str(plB[0]), '1', 'paid/seal: the A placement must be FOUND under LENS_B_FIRST too (B has none, so the lens falls through to A)');
    assert.deepEqual([lc(plB[1]), str(plB[2]), lc(plB[3]), str(plB[4])], [lc(pl[1]), str(pl[2]), lc(pl[3]), str(pl[4])], 'paid/seal: both lenses discover the identical placement (target, revision, author, admission)');
    const plAdm = await observe(ctx, ctx.raw, 'seal-placement', 'Ledger', 'ledger', 'admission', [pl[4]], at);
    const plEv = await observe(ctx, ctx.raw, 'seal-placement', 'Ledger', 'ledger', 'evidence', [plAdm[2]], at);
    const placementAtSeal = { status: str(pl[0]), target: pl[1], revision: str(pl[2]), author: pl[3], admission: str(pl[4]), publication: str(plAdm[2]), admissionKind: str(plAdm[0]), evidenceAuthor: plEv[0], proofKind: str(plEv[1]), v: str(plEv[2]), firstAdmission: str(plEv[4]), leafCount: str(plEv[3]) };
    assert.equal(lc(placementAtSeal.author), lc(A), 'paid/seal: the placement is held by AUTHOR_A');
    assert.equal(lc(placementAtSeal.target), lc(subj), 'paid/seal: the placement targets FILE_QUOTE');
    assert.equal(placementAtSeal.publication, String(pub0 + 2), 'paid/seal: the placement was admitted by the A1 publication');
    assert.equal(placementAtSeal.proofKind, '2', 'paid/seal: the A1 publication is EOA-signed');
    placementAtSeal.byLens = { LENS_A_FIRST: { status: str(pl[0]), target: pl[1], revision: str(pl[2]), author: pl[3], admission: str(pl[4]) }, LENS_B_FIRST: { status: str(plB[0]), target: plB[1], revision: str(plB[2]), author: plB[3], admission: str(plB[4]) } };
    keep({ label: 'paid/seal/a-placement-provenance', standing: 'raw replies (stage seal-placement) at the seal block: LensReader.resolve(FOLDER, /swaps, eth-usdc) under LENS_A_FIRST and under LENS_B_FIRST (both retained; identical placement) + Ledger.admission + Ledger.evidence; sourceStep A1 = publication pub0+2; NOT charged to any paid row', sourceStep: 'A1', actor: 'AUTHOR_A', evidenceCategory: evidenceCategoryOf(Number(placementAtSeal.proofKind), true), basis, observed: placementAtSeal, position: swapsPos });
    // no B placement: B's binding at the position, B's /swaps scope list, and the B-only lens are all empty/absent
    const bHead = await observe(ctx, ctx.raw, 'seal-no-b-placement', 'Ledger', 'ledger', 'head', [binding(pidB, swapsPos)], at);
    const bScope = await observe(ctx, ctx.raw, 'seal-no-b-placement', 'IndexModule', 'index', 'postingHead', [scopeList(scopeKey(pidB, P.FOLDER, swaps))], at);
    const bOnly = await observe(ctx, ctx.raw, 'seal-no-b-placement', 'LensReader', 'lens', 'resolve', [[B], P.FOLDER, swaps, nameHash], at);
    assert.equal(str(bHead[0]), '0', 'paid/seal: B has no binding at /swaps/eth-usdc');
    assert.equal(str(bScope[0]), '0', 'paid/seal: B\'s /swaps scope list is empty');
    assert.equal(str(bOnly[0]), '0', 'paid/seal: the B-only lens finds no /swaps/eth-usdc placement');
    keep({ label: 'paid/seal/no-b-placement', standing: 'raw replies (stage seal-no-b-placement) at the seal block: Ledger.head(binding(B, /swaps/eth-usdc)) state 0, IndexModule.postingHead(B\'s /swaps scope list) count 0, LensReader.resolve([B], FOLDER, /swaps, eth-usdc) ABSENT; B1 bound no FOLDER placement (see the paid/setup/B1 calldata: two actions)', bHeadState: str(bHead[0]), bScopeCount: str(bScope[0]), bOnlyLensStatus: str(bOnly[0]), bBindingKey: binding(pidB, swapsPos) });
    // ---- the four paid rows
    const ordering = [{ kind: 'seal', block: seal.block, hash: seal.hash, timestamp: seal.timestamp }];
    const expectA = { subject: subj, expectedHead: a2, selectedAuthor: A, selectedProofKind: 2, pairId, itemA, itemB, mantissa: J.mantissaA2, scale: J.scale, observedAt: J.observedAt, noteCommitment: NOTE_COMMITMENT, basisAdmission: basis }; // expectedHead = the fixture record id of QUOTE_A2; observedAt / noteCommitment = the sealed fixture values J.* (this runner's candidate-side mirror)
    const expectB = { ...expectA, expectedHead: b1, selectedAuthor: B, selectedProofKind: 1, mantissa: J.mantissaB1 }; // QUOTE_B1
    const placementExpect = { folder: swaps, nameRole: nameHash, actor: A, proofKind: 2, publication: pub0 + 2, budget: 16 };
    const commonSelection = { basisAdmission: basis, indexGeneration: str(generation), rulesEpoch: str(epoch), coreCodeCommitment: core, subject: subj, pairId, itemA, itemB, scale: J.scale, observedAt: J.observedAt, note: NOTE_COMMITMENT };
    const selA = { ...commonSelection, selectedHead: a2, selectedRevision: 2, selectedAdmission: adm0 + 10, selectedPublication: pub0 + 3, selectedAuthor: A, selectedProofKind: 2, mantissa: J.mantissaA2 };
    const selB = { ...commonSelection, selectedHead: b1, selectedRevision: 1, selectedAdmission: adm0 + 12, selectedPublication: pub0 + 4, selectedAuthor: B, selectedProofKind: 1, mantissa: J.mantissaB1 };
    const placementNone = { position: ZERO, actor: ZERO_ADDR, proofKind: 0, revision: 0, admission: 0, publication: 0, basisAdmission: 0, pageStatus: 0, rawTotal: 0, scanned: 0, selectedSoFar: 0, mutated: false, ended: false };
    const placementOne = { position: swapsPos, actor: A, proofKind: 2, revision: 1, admission: adm0 + 7, publication: pub0 + 2, basisAdmission: basis, pageStatus: 2, rawTotal: 1, scanned: 1, selectedSoFar: 1, mutated: false, ended: true }; // hydrations are a physical witness (lens-order dependent), not pinned
    const headLabels = { [lc(a1)]: ['QUOTE_A1', 'A1'], [lc(a2)]: ['QUOTE_A2', 'A2'], [lc(b1)]: ['QUOTE_B1', 'B1'] };
    const authorLabels = { [lc(A)]: ['AUTHOR_A', 'EOA (wallet 1)'], [lc(B)]: ['AUTHOR_B', 'contract (Actor actorB)'] };
    const paidInputs = ctx.controllerInputs ?? { lenses: { LENS_A_FIRST: ab, LENS_B_FIRST: ba }, expect: { A_FIRST: expectA, B_FIRST: expectB }, placementExpect };
    const paidRows = buildPaidCalls(paidInputs).map((pr) => ({
      ...pr,
      selection: { ...(pr.lens === 'LENS_A_FIRST' ? selA : selB), lensId: lensId(pr.lensArr) },
      placement: pr.operation === 'PAID_LIST' ? placementOne : placementNone,
    }));
    const consumerCodehash = ctx.codehashes ? ctx.codehashes.joinedConsumer : { unknown: '--addresses mode: no deployment record in this run', consequence: 'consumer code commitment must come from the independently retained deployment facts' };
    for (const pr of paidRows) {
      const label = `paid/${pr.key}`;
      await restoreSeal(ctx, seal, label, ordering);
      const armStanding = ctx.controllerGate.enabled
        ? `controller-supplied (ack-beforeFixture inputsSha256 ${ctx.controllerGate.inputsSha256})`
        : 'diagnostic: this runner\'s local mirror of the fixture map (candidate-side); no controller gate was used';
      const row = await send(ctx, () => call(ctx, 'JoinedConsumer', 'joinedConsumer', pr.fn, pr.fnArgs), label, { wallet: caller, extra: { operation: pr.operation, lens: pr.lens, storage: STATELESS, consumer: `JoinedConsumer.${pr.fn} (stateless; one PaidResult log of ~34 data words carrying the concrete observations — ESTIMATED ~9-10k gas: the paid rows' consumer overhead, disclosed separately, never subtracted)`, armInputs: { standing: armStanding, expect: pr.fnArgs[1], placementExpect: pr.fnArgs.length > 2 ? pr.fnArgs[2] : null } } });
      // F3: the row must be the ONLY transaction of its block (index 0) at the matched timestamp; the block's transaction list is retained
      const tx = ctx.txs[row.txIndex];
      const blockEnv = await ctx.rpc('eth_getBlockByNumber', [qty(row.block), false], { label: `${label}: block transaction list` });
      const blk = blockEnv.response.result;
      assert(blk && lc(blk.hash) === lc(row.blockHash), `${label}: eth_getBlockByNumber(${row.block}) does not return the receipt's block`);
      ctx.blocks.push({ ...envOf(blockEnv), source: ctx.source, blockNumber: row.block, blockHash: blk.hash });
      const executed = { txIndex: tx.receipt.transactionIndex, txCount: blk.transactions.length, txHashes: [...blk.transactions], onlyTx: blk.transactions.length === 1 && lc(blk.transactions[0]) === lc(row.hash), timestamp: Number(blk.timestamp), parentHash: blk.parentHash, hash: blk.hash, blockRpcId: blockEnv.request.id };
      ordering.push({ kind: 'tx', label, block: row.block, parentHash: executed.parentHash, timestamp: executed.timestamp, txIndex: executed.txIndex, txCount: executed.txCount, onlyTx: executed.onlyTx });
      const check = await paidResultCheck(ctx, row, pr.selection, pr.placement);
      const evidenceFor = {
        operation: pr.operation, lens: pr.lens, lensArr: pr.lensArr, label,
        row: { txIndex: row.txIndex, hash: row.hash, block: row.block, blockHash: row.blockHash, status: row.status, gas: row.gas },
        executed, seal: { block: seal.block, hash: seal.hash, timestamp: seal.timestamp },
        sealBasis: { admissionFrontier: basis, indexGeneration: str(generation), rulesEpoch: str(epoch), coreCodeCommitment: core, realmId },
        chainId: ctx.chainId, addrs: { ledger: ctx.addrs.ledger, lensReader: ctx.addrs.lens, indexModule: ctx.addrs.index, registry: ctx.addrs.registry, consumer: ctx.addrs.joinedConsumer }, consumerCodehash,
        coordinates: { subject: subj, folder: swaps, nameRole: nameHash, position: swapsPos },
        placementAtSeal, types: { QUOTE_J: T.QUOTE_J, PAIR: T.PAIR, ITEM: T.ITEM }, headLabels, authorLabels,
        caller: { address: caller.address, derivationPath: PAID_CALLER_PATH },
      };
      row.abstractResult = deriveAbstractResult({ check, replay: check.replayObs, evidenceFor }); // pure; UNKNOWN throughout on a failed self-check
      rows.push(row);
      ctx.persist();
      ordering.push({ kind: 'retained', label });
      log(`  paid ${label}: retained (abstractResult ${row.abstractResult.rawEvidence.selfCheck.match ? 'built' : 'UNKNOWN: ' + row.abstractResult.rawEvidence.selfCheck.reason}) before the next revert`);
    }
    const orderedRows = checkPaidRowOrdering(ordering);
    rows.push({ label: 'paid/ordering', standing: 'each paid row is the first and ONLY transaction (index 0; block transaction list retained) after an evm_revert whose observed head is the seal, mined at seal + 1 on the sealed hash at the deterministic timestamp seal + 1 (evm_setNextBlockTimestamp after every revert, envelope in rpcOther), and retained (checked, abstractResult built, persisted) before the next revert; asserted by checkPaidRowOrdering', events: ordering, rows: orderedRows, timestamps: orderedRows.map((r) => r.timestamp), timestampsEqual: new Set(orderedRows.map((r) => r.timestamp)).size === 1, expectedTimestamp: seal.timestamp + 1 });
    rows.push({ label: 'paid/agreement', standing: 'point and list under the same lens observe the identical Selection (compared from the PaidResult logs); the placement provenance is identical across lenses', aFirst: agreement(rows, 'paid/point-a-first', 'paid/list-a-first'), bFirst: agreement(rows, 'paid/point-b-first', 'paid/list-b-first') });
    rows.push({
      label: 'paid/cost-disclosure', status: 'statement', standing: 'costs are reported in separate classes; this runner never subtracts, amortizes or normalizes them',
      classes: {
        deployment: 'report.deployment[*].gas per contract with runtime/initcode bytes — includes diagnostic/test consumers (Consumer, StatelessConsumer, Reconstructor, FailingIndexModule, MockAcceptor, StrictQuoteAcceptor) that these rows do not exercise; keep them apart from production prerequisites (TypeRegistry, Ledger, IndexModule, LensReader, the fixture rules)',
        code: 'report.deployment[*].runtimeBytes / initcodeBytes / runtimeCodehash; JoinedConsumer is the measurement consumer, not a production component',
        setup: 'rows paid/setup/step1, paid/setup/A1, paid/setup/A2, paid/setup/B1 (receipts of the fixture prerequisites and the three author steps)',
        placementOnceOnly: { standing: 'ESTIMATE unless the paired control is pinned: the single A placement is one of five actions inside the paid/setup/A1 combined receipt (create + publish + head + FOLDER bind + tag) and is not separable from that receipt alone', pairedControl: 'cell joined/a1-without-placement (optional, non-default: identical batch minus the FOLDER bind from the same sealed pre-A1 state); when the coordinator pins it the two receipts sit side by side and any difference is the coordinator\'s computation' },
        storage: 'ESTIMATED fresh slots only (report.estimatedFreshSlots); no storage tracing was run',
        paid: 'rows paid/point-a-first, paid/list-a-first, paid/point-b-first, paid/list-b-first: receipt gas of one transaction each from the pinned unrelated caller (STATELESS consumer: no SSTORE; one PaidResult log with the concrete observations)',
        matchedRollbackControl: 'UNIMPLEMENTED / UNRUN: the matched S0/A1 mandatory-acceptance and required-index refusal controls (plus positive calibration) specified in paid-rollback-control.md require separate fresh control deployments and pins; cell failure-rows remains diagnostic and is not a matched substitute',
      },
    });
    return rows;
  },
};
// point/list agreement from the retained PaidResult logs (a missing log is reported as unknown, never as agreement)
function agreement(rows, pointLabel, listLabel) {
  const find = (label) => rows.find((r) => r.label === label);
  const pt = find(pointLabel), ls = find(listLabel);
  const passed = (r) => !!(r && r.abstractResult && r.abstractResult.rawEvidence && r.abstractResult.rawEvidence.selfCheck && r.abstractResult.rawEvidence.selfCheck.match === true);
  const sel = (r) => (passed(r) && r.abstractResult.rawEvidence.paidResultLog ? r.abstractResult.rawEvidence.paidResultLog.selection : null);
  const sp = sel(pt), sl = sel(ls);
  if (!sp || !sl) return { unknown: 'a PaidResult log is missing or its self-check failed', consequence: 'no agreement claim' };
  const differing = SELECTION_FIELDS.filter((k) => k !== 'lensId' && String(sp[k]).toLowerCase() !== String(sl[k]).toLowerCase());
  return { identicalSelection: differing.length === 0, differingFields: differing, selectedHead: sp.selectedHead, selectedAuthor: sp.selectedAuthor };
}
// OPTIONAL paired control (non-default; selected only by its exact --cells key): the identical A1 batch minus the
// FOLDER bind, from the same sealed pre-A1 state, so the marginal placement cost can be a paired measurement instead of
// an estimate. Reported beside paid/setup/A1; nothing is subtracted here.
const a1WithoutPlacementCell = {
  standing: 'OPTIONAL paired control of the once-only placement cost: step 1 then the A1 batch WITHOUT the FOLDER bind, from the same run snapshot as joined/paid-slice (same pre-A1 state); the coordinator pins it explicitly; this runner subtracts nothing',
  plan: paidSlicePlan(2, 7),
  body: async (ctx, a, plan) => {
    const { subj, swaps, nameHash } = plan;
    const rows = [];
    const A = a.signedA.address;
    await paidStep1(ctx, a, plan, rows);
    await paidA1(ctx, a, plan, rows, { placement: false });
    const at = await ctx.latestBlock();
    const none = await observe(ctx, ctx.raw, 'no-placement', 'LensReader', 'lens', 'resolve', [[A], P.FOLDER, swaps, nameHash], at);
    assert.equal(str(none[0]), '0', 'a1-without-placement: no /swaps/eth-usdc placement may exist');
    const head = await observe(ctx, ctx.raw, 'no-placement', 'LensReader', 'lens', 'resolve', [[A], P.HEAD, subj, ZERO], at);
    assert.equal(str(head[0]), '1', 'a1-without-placement: the A head must exist');
    rows.push({ label: 'joined/a1-without-placement/pairing', status: 'statement', standing: 'pair with cell joined/paid-slice row paid/setup/A1: same run snapshot, identical step 1, same author/nonce/bodies; the only action difference is the absent FOLDER bind (signature and deadline calldata bytes differ per run: ESTIMATED tens of gas). The difference, if the coordinator computes it, is the once-only placement cost; this runner reports both receipts and subtracts nothing', placementAbsent: { lensStatus: str(none[0]), headStatus: str(head[0]), stage: 'no-placement' } });
    return rows;
  },
};

// ---------------------------------------------------------------- Type id resolution (derived ids; three-way agreement)
// typeIdOf + typeInfo + descriptor raw replies at `block` (stage type-resolution), checked against the local Keys.typeId
// derivation and, when given, the TypeRegistered receipt log; fills T[key] for the six fixture Types. The acceptor is the
// Type's MANDATORY rule: the registry must report it (address + ruleId == the derivation codehash); at the registration
// block (deploy mode, `evidence.fromLog` given) the initial activation row must be 1 with no additional policy.
async function resolveType(ctx, key, acceptorKey, refKeys, acceptorCodehash, block, evidence = {}, shape = SHAPE[key]) {
  const acceptor = acceptorKey ? ctx.addrs[acceptorKey] : ZERO_ADDR;
  const refs = refKeys.map((k) => T[k]);
  const [fromView] = await observe(ctx, ctx.raw, 'type-resolution', 'TypeRegistry', 'registry', 'typeIdOf', [shape, acceptor, refs], block);
  const local = typeIdLocal(shape, refs, acceptorCodehash);
  assert.equal(lc(fromView), lc(local), `${key}: typeIdOf disagrees with the local Keys.typeId derivation`);
  if (evidence.fromLog) assert.equal(lc(evidence.fromLog), lc(local), `${key}: the TypeRegistered log disagrees with the derivation`);
  const info = typeInfoOf(await observe(ctx, ctx.raw, 'type-resolution', 'TypeRegistry', 'registry', 'typeInfo', [fromView], block));
  const desc = descriptorOf(await observe(ctx, ctx.raw, 'type-resolution', 'TypeRegistry', 'registry', 'descriptor', [fromView], block));
  assert.equal(info.registered, true, `${key}: not registered at block ${block}`);
  assert.equal(lc(info.mandatoryAcceptor), lc(acceptor), `${key}: mandatory acceptor mismatch`);
  assert.equal(lc(info.ruleId), lc(acceptorCodehash), `${key}: ruleId must equal the derivation codehash`);
  assert.equal(lc(desc.ruleId), lc(acceptorCodehash), `${key}: descriptor.ruleId must equal the derivation codehash`);
  assert.equal(lc(desc.mandatoryAcceptor), lc(acceptor), `${key}: descriptor.mandatoryAcceptor mismatch`);
  assert.equal(desc.shape, shape, `${key}: descriptor.shape mismatch`);
  assert.equal(info.refCount, String(refs.length), `${key}: refCount mismatch`);
  if (evidence.fromLog) {
    assert.equal(info.activation, '1', `${key}: the initial activation row must be 1 at the registration block`);
    assert.equal(lc(info.policyAcceptor), lc(ZERO_ADDR), `${key}: no additional policy at registration`);
    assert.equal(lc(info.policyCodehash), lc(ZERO), `${key}: no additional policy codehash at registration`);
  }
  if (TYPE_KEYS.includes(key)) T[key] = fromView;
  return { typeId: fromView, shape, mandatoryAcceptor: acceptor, acceptorKey, ruleId: acceptorCodehash, refKeys, refTypeIds: refs, typeInfoAtResolution: info, descriptor: desc, localDerivation: local, ...evidence, standing: 'id = keccak256(abi.encode(DOM_TYPE, shape, keccak256(abi.encode(refTypeIds)), ruleId)); ruleId = the MANDATORY rule\'s runtime codehash; typeIdOf/typeInfo/descriptor raw replies at stage type-resolution; agreement of log (when deployed here), view, descriptor and local derivation asserted' };
}
// register a Type inside a sealed cell (reverted with the cell) and resolve it the same three ways; T is not touched
async function registerInCell(ctx, key, shape, acceptorKey, refKeys, label) {
  const acceptor = acceptorKey ? ctx.addrs[acceptorKey] : ZERO_ADDR;
  const refs = refKeys.map((k) => T[k]);
  const row = await send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'register', [shape, acceptor, refs]), label);
  const tx = ctx.txs[row.txIndex];
  const registered = tx.receipt.logs
    .filter((l) => l.address.toLowerCase() === ctx.addrs.registry.toLowerCase())
    .map((l) => { try { return iface('TypeRegistry').parseLog({ topics: l.topics, data: l.data }); } catch { return null; } })
    .filter((p) => p && p.name === 'TypeRegistered');
  assert.equal(registered.length, 1, `${label}: expected exactly one TypeRegistered log`);
  let codehash = ZERO;
  if (acceptorKey) {
    if (ctx.codehashes?.[acceptorKey]) codehash = ctx.codehashes[acceptorKey];
    else { const e = await ctx.rpc('eth_getCode', [acceptor, qty(row.block)], { label: `code ${acceptorKey}` }); ctx.rpcOther.push(envOf(e)); codehash = keccak256(e.response.result); }
  }
  const resolved = await resolveType(ctx, key, acceptorKey, refKeys, codehash, row.block, { fromLog: registered[0].args.typeId, registerTx: row.hash, registerBlock: row.block }, shape);
  return { typeId: resolved.typeId, row: { ...row, resolved }, resolved };
}
// --addresses mode: no registration receipts; acceptor codehashes from eth_getCode (envelopes in rpcOther)
async function resolveTypesFromChain(ctx) {
  const block = await ctx.latestBlock();
  const types = {};
  for (const [key, acceptorKey, refKeys] of TYPE_PLAN) {
    let codehash = ZERO;
    if (acceptorKey) {
      const e = await ctx.rpc('eth_getCode', [ctx.addrs[acceptorKey], qty(block)], { label: `code ${acceptorKey}` });
      ctx.rpcOther.push(envOf(e));
      codehash = keccak256(e.response.result);
    }
    types[key] = await resolveType(ctx, key, acceptorKey, refKeys, codehash, block);
  }
  return types;
}

// ---------------------------------------------------------------- cell selection (runner review 4): explicit, validated BEFORE any chain starts
// `planKeys` is the static ordered cell plan; `cells` an exact comma-separated list, `only` the legacy substring filter.
// Unknown keys or a zero selection throw (the run must not start a chain and exit 0 having done nothing).
// `optionalKeys` (non-default cells such as the paired control joined/a1-without-placement) are excluded from the default
// selection and from the legacy substring filter; only an exact `--cells` name selects them.
function selectCells(planKeys, { cells = null, only = null } = {}, optionalKeys = []) {
  const unknownOptional = optionalKeys.filter((k) => !planKeys.includes(k));
  if (unknownOptional.length) throw new Error(`optional cell(s) not in the plan: ${unknownOptional.join(', ')}`);
  const defaults = planKeys.filter((k) => !optionalKeys.includes(k));
  if (cells === null && only === null) return [...defaults];
  let selected;
  if (cells !== null) {
    const wanted = String(cells).split(',').map((s) => s.trim()).filter(Boolean);
    const unknown = wanted.filter((k) => !planKeys.includes(k));
    if (unknown.length) throw new Error(`--cells: unknown cell(s) ${unknown.join(', ')}; known cells: ${planKeys.join(', ')}`);
    selected = planKeys.filter((k) => wanted.includes(k)); // exact names may select an optional cell
  } else {
    selected = defaults.filter((k) => k.includes(String(only))); // the legacy substring filter never selects an optional cell
  }
  if (selected.length === 0) throw new Error(`cell filter selected zero cells (cells=${cells}, only=${only}); known cells: ${planKeys.join(', ')}`);
  return selected;
}

// ---------------------------------------------------------------- deployment (once; code identity retained)
async function deployAll(run) {
  const ctx = makeCtx(run);
  const d = {};
  const setup = [];
  Object.assign(run.report, { deployment: d, setup, setupTransactions: ctx.txs, setupRaw: ctx.raw, setupBlocks: ctx.blocks, setupRpcOther: ctx.rpcOther });
  ctx.persist = () => persist(run.report);
  await ctx.setGasPrice();
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
      address, nonce, gas: row.gas, txHash: row.hash, block: row.block, blockHash: row.blockHash, constructorArgs: ctorArgs.map(str),
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
  d.strictAcceptor = await dep('StrictQuoteAcceptor'); // fixture rule v2 (artifact from test/Falsify.t.sol): QUOTE's added policy and the in-cell strict Type's mandatory rule in cell policy/activate
  d.quoteRule = await dep('MinBodyAcceptor', [32]); // QUOTE's MANDATORY rule: immutable threshold, part of the runtime code and therefore of the id
  d.pairRule = await dep('MinBodyAcceptor', [96]); // PAIR's MANDATORY rule (two checked refs + one payload word)
  d.statelessConsumer = await dep('StatelessConsumer', [d.lens.address]);
  const addrsOf = () => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.address]));
  ctx.addrs = addrsOf();
  setup.push(await send(ctx, () => call(ctx, 'Ledger', 'ledger', 'setIndexModule', [ctx.addrs.index]), 'setup: attach index module'));
  // registration: register(shape, acceptor, refs) RETURNS the derived id. Each id is taken from the TypeRegistered receipt
  // log and cross-checked against typeIdOf (raw reply) and the local Keys.typeId derivation before the next registration
  // can reference it (PAIR needs ITEM, QUOTE_J needs PAIR). The name hashes are shapes, never ids.
  const types = {};
  for (const [key, acceptorKey, refKeys, note] of TYPE_PLAN) {
    const acceptor = acceptorKey ? ctx.addrs[acceptorKey] : ZERO_ADDR;
    const refs = refKeys.map((k) => T[k]);
    const row = await send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'register', [SHAPE[key], acceptor, refs]), `setup: register ${key} (${note}; id derived by the registry)`);
    setup.push(row);
    const tx = ctx.txs[row.txIndex];
    const registered = tx.receipt.logs
      .filter((l) => l.address.toLowerCase() === ctx.addrs.registry.toLowerCase())
      .map((l) => { try { return iface('TypeRegistry').parseLog({ topics: l.topics, data: l.data }); } catch { return null; } })
      .filter((p) => p && p.name === 'TypeRegistered');
    assert.equal(registered.length, 1, `register ${key}: expected exactly one TypeRegistered log`);
    types[key] = await resolveType(ctx, key, acceptorKey, refKeys, acceptorKey ? d[acceptorKey].runtimeCodehash : ZERO, row.block, { fromLog: registered[0].args.typeId, registerTx: row.hash, registerBlock: row.block, logIndex: tx.receipt.logs.findIndex((l) => l.address.toLowerCase() === ctx.addrs.registry.toLowerCase()) });
    log(`  type ${key}: ${T[key]} (log == typeIdOf == local derivation)`);
  }
  // the mutable MockAcceptor is installed as the ADDITIONAL policy (row 2) of QUOTE and PAIR — never a mandatory rule (F5 addendum)
  for (const key of ['QUOTE', 'PAIR']) {
    const row = await send(ctx, () => call(ctx, 'TypeRegistry', 'registry', 'activate', [T[key], ctx.addrs.acceptor]), `setup: activate MockAcceptor (mode 0) as ${key} ADDITIONAL policy row 2 (mutable test double; its refusal is E_POLICY_REJECTED)`);
    setup.push(row);
    const info = typeInfoOf(await observe(ctx, ctx.raw, 'setup', 'TypeRegistry', 'registry', 'typeInfo', [T[key]], row.block));
    assert.equal(lc(info.policyAcceptor), lc(ctx.addrs.acceptor), `${key}: mock must be the active policy after setup`);
    assert.equal(info.activation, '2', `${key}: activation row 2 after setup`);
    assert.equal(lc(info.mandatoryAcceptor), lc(types[key].mandatoryAcceptor), `${key}: the mandatory rule is untouched by the activation`);
    types[key].policyAfterSetup = { acceptor: info.policyAcceptor, codehash: info.policyCodehash, activation: info.activation, activateTx: row.hash };
  }
  d.joinedConsumer = await dep('JoinedConsumer', [d.ledger.address, d.lens.address, T.QUOTE_J, T.PAIR, T.ITEM, T.LABEL]); // after registration: constructed with the DERIVED ids
  ctx.addrs = addrsOf();
  const addrs = ctx.addrs;
  const latest = await ctx.latestBlock();
  const epoch = str((await observe(ctx, ctx.raw, 'setup', 'TypeRegistry', 'registry', 'epoch', [], latest))[0]);
  const principals = {};
  for (const k of ['actorA', 'actorB']) principals[k] = (await observe(ctx, ctx.raw, 'setup', 'Ledger', 'ledger', 'principalOf', [addrs[k]], latest))[0];
  for (const w of ctx.wallets.slice(1, 3)) principals[w.address] = (await observe(ctx, ctx.raw, 'setup', 'Ledger', 'ledger', 'principalOf', [w.address], latest))[0];
  return { addrs, deployment: d, setup, setupTransactions: ctx.txs, setupRaw: ctx.raw, setupBlocks: ctx.blocks, setupRpcOther: ctx.rpcOther, registryEpoch: epoch, principals, types };
}

// the static, ordered cell plan (23 keys: 22 default cells + the optional paired control; the no-index diagnostic is
// dropped by --skip-without-index; `optional: true` cells run only when named exactly by --cells)
function buildCellPlan() {
  const plan = [];
  const picks = { 'native-one': (a) => [a.nativeA, null], 'signed-one': (a) => [a.signedA, null], 'native-two': (a) => [a.nativeA, a.nativeB], 'signed-two': (a) => [a.signedA, a.signedB] };
  for (const fixture of ['quote', 'binary']) {
    for (const [cell, pick] of Object.entries(picks)) plan.push({ key: `${cell}/${fixture}`, cell: matrixCell(cell, fixture, pick) });
  }
  for (const variant of ['contract-fresh-body', 'contract-existing-body', 'exact-retry']) plan.push({ key: `fresh/${variant}`, cell: { standing: 'freshness control: its own sealed cell from the same post-setup snapshot; report side by side, never subtract', plan: freshPlan(variant), body: freshBody } });
  plan.push({ key: 'failure-rows', cell: failureCell });
  plan.push({ key: 'joined/steps-1-6', cell: joinedCell });
  plan.push({ key: 'joined/paid-slice', cell: paidSliceCell });
  plan.push({ key: 'joined/a1-without-placement', cell: a1WithoutPlacementCell, optional: true });
  for (const variant of ['hash-only-create', 'create+label-fresh', 'create+label-existing-republished', 'create+label-existing-omitted']) plan.push({ key: `label/${variant}`, cell: labelCell(variant) });
  plan.push({ key: 'policy/activate', cell: policyCell });
  plan.push({ key: 'failure/refused-re-registration', cell: refusedRegistrationCell });
  plan.push({ key: 'failure/unsupported-native-import', cell: unsupportedImportCell });
  if (!args['skip-without-index']) {
    plan.push({
      key: 'native-one-noindex/quote',
      cell: {
        standing: 'NOT EQUIVALENT: the mandatory index is detached (a named guarantee omitted); diagnostic only',
        plan: async (ctx, a, block) => matrixPlan(ctx, 'native-one-noindex', 'quote', a.nativeA, null, block, { noIndex: true }),
        body: async (ctx, a, plan) => {
          const rows = [await send(ctx, () => call(ctx, 'Ledger', 'ledger', 'setIndexModule', [ZERO_ADDR]), 'setup: detach index module')];
          rows.push(...(await runCell(ctx, plan, { noIndex: true })));
          return rows;
        },
      },
    });
  }
  return plan;
}

async function main() {
  const t0 = Date.now();
  // ---- cell selection is computed and validated BEFORE any chain starts (runner review 4)
  const cellPlan = buildCellPlan();
  const planKeys = cellPlan.map((c) => c.key);
  const optionalCells = cellPlan.filter((c) => c.optional).map((c) => c.key);
  const selectedCells = selectCells(planKeys, { cells: typeof args.cells === 'string' ? args.cells : null, only: ONLY }, optionalCells);
  assertAnvilOnlyCells(selectedCells, !!args.anvil); // the sealing cells run only on an owned --anvil chain; refused before any chain call
  // Read and hash all three operator-pinned files, then load the already-hashed module, before Anvil or any RPC starts.
  // The expectation and arm-input bytes are never parsed by this runner.
  const controllerGate = await createControllerGate({ args, scratchRoot: SCRATCH_ROOT });
  if (controllerGate.enabled && args.addresses) {
    const error = new Error('CONTROLLER_REQUIRES_DEPLOY: a gated run must deploy and retain all role-keyed initcode/runtime facts');
    error.exitCode = 2;
    throw error;
  }
  log(`cell plan: ${planKeys.length} keys (${optionalCells.length} optional: ${optionalCells.join(', ')}); selected ${selectedCells.length}: ${selectedCells.join(', ')}`);
  setTimeout(() => terminateRun('watchdog: 25 minutes elapsed, stopping the run', 124), WATCHDOG_MS).unref(); // applies with and without --anvil
  process.once('SIGINT', () => terminateRun('SIGINT: interrupted run', 130));
  process.once('SIGTERM', () => terminateRun('SIGTERM: terminated run', 143));
  const rpcUrl = args.anvil ? await startAnvil() : args.rpc || 'http://127.0.0.1:8545';
  const source = `RPC_OBSERVED:${args.anvil ? `anvil-local pid ${anvilInfo.pid}` : 'external-rpc'}:${rpcUrl}`;
  log(`rpc ${rpcUrl}; artifacts ${OUT_DIR}; scratch ${SCRATCH_ROOT}; report ${OUT_JSON}`);
  const rpc0 = makeRpc(rpcUrl);
  const chainIdEnv = await rpc0('eth_chainId', []);
  const chainId = Number(chainIdEnv.response.result);
  const inputCaveat = controllerGate.enabled
    ? 'The gated paid slice consumes only the controller-supplied lenses, Expect and PlacementExpect after strict field comparison with the candidate mirror; the separate controller retention binds inputsSha256.'
    : CAVEAT_EXPECTED;
  const report = {
    profile: 'road-b-lab/2', claim: 'disposable lab, no protocol claim', gating: controllerGate.gating, controller: controllerGate.report,
    honesty: 'This run reports receipt diagnostics with explicit remaining gates. It is not a same-guarantee comparison and not the capability ablation.',
    experiment: 'ingress x multiplicity (hash-placement diagnostics) + separate freshness cells + failure rows + the typed joined journey (steps 1–6) + the label-retention probe. NOT the protocol capability ablation (neither/authorship/selection/both), which is a later gate.',
    remainingGates: [CAVEAT_JOINED, CAVEAT_RECON, CAVEAT_MATCHED, ...(controllerGate.enabled ? [] : [CAVEAT_EXPECTED]), CAVEAT_NATIVE_IMPORT, CAVEAT_VECTOR, CAVEAT_MANDATORY],
    sourceProfile: 'post-authority-repair source (REPAIR.md; PROFILE.md "Changed after dcc7b94"): derived Type ids, registry policy rows, per-admission acceptance basis, fail-closed native import. NOT the dcc7b94 profile of vectors/profile-b.json.',
    capabilityAblation: { unknown: 'not run: the neither/authorship/selection/both counterfactuals need same-guarantee arms that remove one capability each; this lab has one arm', consequence: 'no representation-vs-feature attribution and no interaction term can be claimed from this run' },
    evidenceShape: {
      rawObservations: 'cells[*].baselineRaw[] (sealed-state getters before the first transaction; also in raw[] with stage "baseline"), cells[*].raw[] (every eth_call: literal JSON-RPC request/response, rpcId, method, source, stage, to, calldata, returnData, blockTag, blockHash), cells[*].transactions[] (rawTransaction + literal envelopes of eth_sendRawTransaction / eth_getTransactionReceipt / eth_getBlockByHash / eth_getTransactionByHash + the receipt), cells[*].blocks[] (block-header envelopes), cells[*].rpcOther[] (evm_revert, evm_snapshot, eth_gasPrice, eth_blockNumber, eth_getTransactionCount, eth_estimateGas, anvil_getAutomine)',
      candidateClaims: 'cells[*].candidateDecoded.{baseline,post} (this script decoding the retained bytes), cells[*].rows, rowLog, consumerChecks, plan — candidate-native summaries, never expected answers',
      correlation: 'every observation carries the JSON-RPC id of its request; ids are unique across the run; request.params[0] is exactly {to, data} for reads and exactly {from, to, data} for failure-static probes (from = the account that then sends the reverting transaction; retained as obs.from); params[1] is the hex block number; blockHash is the retained header hash at that number (blocks[]), never inferred from a receipt at the same number',
      failureRows: 'rows carry expectedSelector/observedSelector/observedRevertData and, where expectedArgs is set, the decoded revert arguments (decodedArgs) asserted equal — e.g. E_INTENT(3), E_TYPE_EXISTS(typeId), E_POLICY_REJECTED(leaf, typeId), E_REJECTED(leaf, typeId)',
      admissionJoins: 'candidateDecoded.{baseline,post}.admissions[ord] of every present publish/reuse admission carries basis (Ledger.acceptanceBasis raw reply) and policyRow (TypeRegistry.activation(typeId, activation) raw reply) plus join {acceptorEqual, codehashEqual, epochEqual, ok}: Type id <-> policy row <-> codehash <-> epoch are joinable from the raw replies alone',
      selection: 'report.cellPlan (all keys, in order), optionalCells (non-default keys: run only when named exactly by --cells), plannedCells (validated before chain startup: unknown or zero selection aborts) and executedCells (asserted equal to plannedCells at the end); skippedCells lists unselected keys',
      paidSlice: 'cell joined/paid-slice: rows paid/setup/{step1,A1,A2,B1} (setup receipts), paid/seal (+ /a-placement-provenance, /no-b-placement: raw replies at the seal block, stages seal / seal-placement / seal-no-b-placement), the four paid rows paid/{point,list}-{a,b}-first (each: receipt from wallet index 3, PaidResult log parsed from the receipt, eth_call replay at the receipt block from the same caller (stage paid-replay), consumerChecks kind paid-result, abstractResult = the arm-neutral Common comparison row with inputEvidenceGrade RPC_OBSERVED), paid/ordering (seal -> revert -> evm_setNextBlockTimestamp(seal + 1) -> the only tx of block seal + 1 at index 0 -> retained, asserted incl. equal timestamps; each row\'s block transaction list retained in blocks[]), paid/agreement, paid/cost-disclosure; abstractResult is derived by the pure deriveAbstractResult: on a failed self-check (missing/undecodable log, replay != log, field mismatch) every derived label/outcome/coverage is UNKNOWN with the reason and only separately retained observations (seal replies, receipt/block) keep values; optional cell joined/a1-without-placement = the paired control of the once-only placement cost. Both cells run only on an owned --anvil chain (assertAnvilOnlyCells, before any chain call)',
      freshness: 'pre-absence / pre-presence are retained bytes: baselineRaw Ledger.record(id) replies at the after-revert block, and stage "pre-presence" replies taken after an in-cell setup transaction',
      storage: 'rows carry `storage`: STATELESS (JoinedConsumer / StatelessConsumer: no SSTORE, one LOG2) or STORING (LabHarness.Consumer: receipt includes its own SSTOREs)',
      typeIds: 'report.types[key] = { typeId, shape, mandatoryAcceptor, ruleId, refTypeIds, typeInfoAtResolution, descriptor, localDerivation, fromLog, registerTx, policyAfterSetup } — the id from the TypeRegistered receipt log, the typeIdOf/typeInfo/descriptor raw replies (setupRaw stage type-resolution) and the local Keys.typeId derivation are asserted equal; ruleId == the mandatory rule\'s runtime codehash; every Action.typeId in every cell is one of these',
      acceptance: 'F5 shape: typeInfo = (registered, mandatoryAcceptor, ruleId, policyAcceptor, policyCodehash, refCount, activation); descriptor = (shape, ruleId, mandatoryAcceptor, refCount, activations, registeredAt); acceptanceBasis = (typeId, activation, mandatoryAcceptor, ruleId, policyAcceptor, policyCodehash, epoch, activatedAt); E_REJECTED = mandatory rule refused (final), E_POLICY_REJECTED = additional policy refused',
      authorityRepairCells: 'policy/activate (stages policy, basis; failure rows E_INTENT, E_POLICY_REJECTED, E_REJECTED x3; in-cell strict Type registered and resolved three ways), failure/refused-re-registration (stage registry-post; failure row TypeRegistry.E_TYPE_EXISTS; one statement row), failure/unsupported-native-import (stage squat-probe; two failure rows E_SOURCE_UNSUPPORTED)',
    },
    rpc: rpcUrl, chainId, source, node: process.version, evm: 'cancun', compiler: 'read from out/ artifact metadata per contract (deployment[*].artifact.compiler)', optimizerRuns: 200, viaIR: true,
    paths: { artifacts: OUT_DIR, scratchRoot: SCRATCH_ROOT, outJson: OUT_JSON, ethers: ethersPath },
    build: { sourceHashes: sourceHashes(), note: 'sha256 of every file under src/, test/, script/ at run time; artifact hashes per contract under deployment' },
    providerPolicy: 'no ethers provider: literal JSON-RPC over fetch, one request per call, unique ids, no result cache; every eth_call passes an explicit hex block number',
    startedAt: new Date(t0).toISOString(), anvil: anvilInfo, chainIdRpc: envOf(chainIdEnv), deployment: null, setup: [], setupTransactions: [], setupRaw: [], setupBlocks: [], setupRpcOther: [], registryEpoch: null, principals: null, types: null,
    sealedInitialState: null, cellPlan: planKeys, optionalCells, anvilOnlyCells: ANVIL_ONLY_CELLS, plannedCells: selectedCells, executedCells: null, cells: {}, cellOrder: [], skippedCells: [], estimatedFreshSlots: {}, failure: null,
    caveats: [
      'Local Anvil receipts under the lab profile; not an L2 fee quote and not an equivalent-guarantee comparison until the coordinator\'s fixture map is applied.',
      'Ingress x multiplicity only; no capability ablation and no interaction term are claimed.',
      CAVEAT_JOINED, CAVEAT_RECON, CAVEAT_MATCHED, inputCaveat,
      'Fresh-slot counts are estimates; no storage tracing was run.',
      'Every cell starts from the sealed post-setup state (cold transaction access sets; lists empty except setup); "steady" list regimes are not measured here.',
      'The three fresh/* cells run from the SAME sealed snapshot with the same action shape (one PUBLISH under an explicit nonce) but contract-existing-body has a different initialized state (one prior EOA admission); their figures are reported side by side and must never be subtracted into a "deduplication premium".',
      'Paid-read rows labelled STORING include the storing Consumer\'s own SSTOREs; STATELESS rows do not. Only STATELESS rows approximate pure read cost (plus one LOG2).',
      'read-history-asof rows test the latest retained revision; read-history-asof-older rows read a strictly older basis and must return revision 1.',
      'A listing page with mutated == true is a mixed-basis page and must not be treated as COMPLETE by any caller.',
      'Label cells are a client-convention filename-retention baseline (FOLDER-role bodies name entries; HEAD bodies stay empty), not mandatory Files semantics; the registry epoch differs from the retained vectors/profile-b.json run (one more Type registered).',
      CAVEAT_NATIVE_IMPORT, CAVEAT_VECTOR,
      'policy/activate ADDS StrictQuoteAcceptor (test/Falsify.t.sol artifact; fixture rule v2) as QUOTE policy row 3 on top of the mandatory MinBodyAcceptor(32) (row 2 is the accept-all mock): the Type id and descriptor are untouched, unsent epoch-N signatures are refused (E_INTENT), an above-cap body (uint256 3_000_000_000, not a payload control) is refused by the added policy (E_POLICY_REJECTED), and acceptanceBasis reports row 2 for the earlier admission. Its in-cell strict Type shows a rejected body stays rejected after activate(0) and under a permissive policy (E_REJECTED). A policy activation is a Realm fact, not a Type change.',
      CAVEAT_MANDATORY,
      'failure/refused-re-registration covers the identical-descriptor case only; a different descriptor under a colliding id is impossible by construction (derived ids) and is recorded as a statement row, not a transaction.',
      `joined/paid-slice records observations only (inputEvidenceGrade RPC_OBSERVED). ${inputCaveat} The expectation manifest, arm-input manifest and basis seal are authored and hashed independently before this packet is opened; this packet cannot define or repair them. The A1 combined receipt is not a marginal placement cost (ESTIMATE) unless the optional paired control joined/a1-without-placement is pinned; even then this runner subtracts nothing.`,
    ],
  };
  activeReport = report;
  const run = { rpc: rpcUrl, chainId, source, addrs: null, sealed: null, report, controllerGate, controllerInputs: null };
  try {
    if (args.addresses) {
      run.addrs = JSON.parse(readFileSync(args.addresses, 'utf8'));
      assert(run.addrs.strictAcceptor && run.addrs.registry && run.addrs.quoteRule && run.addrs.pairRule, '--addresses: the address file must come from this script version (needs registry, strictAcceptor, quoteRule, pairRule)');
      const rctx = makeCtx(run); // derived ids must be resolved from the chain before any cell (T throws otherwise)
      report.types = await resolveTypesFromChain(rctx);
      Object.assign(report, { typeResolutionRaw: rctx.raw, typeResolutionBlocks: rctx.blocks, typeResolutionRpcOther: rctx.rpcOther });
    } else {
      const d = await deployAll(run);
      run.addrs = d.addrs;
      Object.assign(report, { deployment: d.deployment, setup: d.setup, setupTransactions: d.setupTransactions, setupRaw: d.setupRaw, setupBlocks: d.setupBlocks, setupRpcOther: d.setupRpcOther, registryEpoch: d.registryEpoch, principals: d.principals, types: d.types });
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
    if (controllerGate.enabled) {
      // Derive the candidate mirror through the same fixture-plan code as the paid cell. Its preparatory reads are
      // read-only; the mirror is sent only to the controller and is never used as independent evidence.
      const prepCtx = makeCtx(run);
      const prepPlan = await paidSliceCell.plan(prepCtx, authorsFor(prepCtx), Number(sealedHeader.number));
      const A = prepCtx.wallets[1].address.toLowerCase();
      const B = run.addrs.actorB.toLowerCase();
      const paidCaller = prepCtx.wallets[PAID_CALLER_INDEX].address.toLowerCase();
      const roles = {
        deployer: { address: prepCtx.deployer.address.toLowerCase(), derivationIndex: 0 },
        AUTHOR_A: { address: A, derivationIndex: 1 },
        actorB: { address: B, deploymentNonce: report.deployment.actorB.nonce },
        paidCaller: { address: paidCaller, derivationIndex: PAID_CALLER_INDEX },
      };
      const basis = '12';
      const mirror = {
        types: Object.fromEntries(TYPE_KEYS.map((key) => [key, T[key].toLowerCase()])),
        fixture: {
          ITEM_ETH: { typeId: T.ITEM.toLowerCase(), body: prepPlan.iA.toLowerCase(), id: prepPlan.itemA.toLowerCase() },
          ITEM_USDC: { typeId: T.ITEM.toLowerCase(), body: prepPlan.iB.toLowerCase(), id: prepPlan.itemB.toLowerCase() },
          PAIR_ETH_USDC: { typeId: T.PAIR.toLowerCase(), body: prepPlan.pairBody.toLowerCase(), id: prepPlan.pairId.toLowerCase() },
          QUOTE_A1: { typeId: T.QUOTE_J.toLowerCase(), body: prepPlan.q1.toLowerCase(), id: prepPlan.a1.toLowerCase() },
          QUOTE_A2: { typeId: T.QUOTE_J.toLowerCase(), body: prepPlan.q2.toLowerCase(), id: prepPlan.a2.toLowerCase() },
          QUOTE_B1: { typeId: T.QUOTE_J.toLowerCase(), body: prepPlan.q3.toLowerCase(), id: prepPlan.b1.toLowerCase() },
        },
        subject: { FILE_QUOTE: prepPlan.subj.toLowerCase(), salt: prepPlan.salt.toLowerCase(), creatorPrincipal: prepPlan.pidA.toLowerCase() },
        roles,
        lenses: { LENS_A_FIRST: [A, B], LENS_B_FIRST: [B, A] },
        expect: {
          A_FIRST: { subject: prepPlan.subj.toLowerCase(), expectedHead: prepPlan.a2.toLowerCase(), selectedAuthor: A, selectedProofKind: '2', pairId: prepPlan.pairId.toLowerCase(), itemA: prepPlan.itemA.toLowerCase(), itemB: prepPlan.itemB.toLowerCase(), mantissa: String(J.mantissaA2), scale: String(J.scale), observedAt: String(J.observedAt), noteCommitment: NOTE_COMMITMENT.toLowerCase(), basisAdmission: basis },
          B_FIRST: { subject: prepPlan.subj.toLowerCase(), expectedHead: prepPlan.b1.toLowerCase(), selectedAuthor: B, selectedProofKind: '1', pairId: prepPlan.pairId.toLowerCase(), itemA: prepPlan.itemA.toLowerCase(), itemB: prepPlan.itemB.toLowerCase(), mantissa: String(J.mantissaB1), scale: String(J.scale), observedAt: String(J.observedAt), noteCommitment: NOTE_COMMITMENT.toLowerCase(), basisAdmission: basis },
        },
        placementExpect: { folder: prepPlan.swaps.toLowerCase(), nameRole: prepPlan.nameHash.toLowerCase(), actor: A, proofKind: '2', publication: '2', budget: '16' },
        ordinals: { placementAdmission: '7', placementPublication: '2', placementRevision: '1', aHeadAdmission: '10', aHeadRevision: '2', bHeadAdmission: '12', bHeadRevision: '1', postB1Frontier: basis, registryEpoch: String(report.registryEpoch), indexGeneration: '0' },
      };
      const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim();
      const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
      const dirtyDiff = execFileSync('git', ['diff', '--binary', 'HEAD', '--', '.'], { cwd: repoRoot });
      const sourcePin = { commit, dirtyDiffSha256: createHash('sha256').update(dirtyDiff).digest('hex'), sourceHashes: sourceHashes() };
      const artifacts = Object.fromEntries(Object.entries(report.deployment).map(([role, deployed]) => [role, {
        artifactSha256: deployed.artifact.sha256,
        initcodeHash: deployed.initcodeHash.toLowerCase(),
        runtimeCodehash: deployed.runtimeCodehash.toLowerCase(),
        runtimeBytes: deployed.runtimeBytes,
      }]));
      const build = { solc: report.deployment.registry.artifact.compiler, viaIR: true, optimizerRuns: 200, evm: 'cancun', artifacts };
      const deployment = Object.fromEntries(Object.entries(report.deployment).map(([role, deployed]) => [role, { address: deployed.address.toLowerCase(), nonce: deployed.nonce, runtimeCodehash: deployed.runtimeCodehash.toLowerCase() }]));
      const beforeContext = {
        schema: 'efs-lab-b/controller-context/1', runId: controllerGate.runId, stage: 'beforeFixture', sentAtUtc: new Date().toISOString(), pins: controllerGate.pins,
        chain: { chainId, rpc: rpcUrl, source: run.source, anvilArgv: [...(anvilInfo.args ?? [])] }, source: sourcePin, build, roles, deployment,
        typesObserved: mirror.types, registry: { epochAfterSetup: String(report.registryEpoch) },
        sealedInitialState: { blockNumber: String(Number(sealedHeader.number)), blockHash: sealedHeader.hash.toLowerCase(), snapshot: String(run.sealed) },
        plannedCells: [...selectedCells], firstCell: selectedCells[0], mirror,
        ackPath: join(SCRATCH_ROOT, 'controller', 'ack-beforeFixture.json'),
      };
      try {
        run.controllerInputs = await controllerGate.invoke('beforeFixture', beforeContext);
        persist(report); // summary is durable before the first selected cell can send
      } catch (error) {
        report.cells[selectedCells[0]] = controllerFailureRow(selectedCells[0], error);
        report.cellOrder.push(selectedCells[0]);
        persist(report);
        throw error;
      }
    }
    // decode-once helpers the cell bodies use for relative ordinals (from the retained baseline)
    const wrap = (cell) => ({ ...cell, body: async (ctx, a, plan) => { const b = run.report.cells[ctx.cellLabel]?.candidateDecoded?.baseline; assert(b && b.counts && b.records && b.nonces, `${ctx.cellLabel}: baseline harvest missing before the body`); ctx.baselineCounts = b.counts; ctx.baselineRecords = b.records; ctx.baselineNonces = b.nonces; return cell.body(ctx, a, plan); } });
    const runCellNamed = async (label, cell) => { const c = wrap(cell); const orig = c.plan; c.plan = async (ctx, a, block) => { ctx.cellLabel = label; return orig(ctx, a, block); }; const r = await sealedCell(run, label, c); if (r) report.cellOrder.push(label); };
    // execute exactly the validated selection, in plan order; unselected cells are recorded as skipped
    for (const { key, cell } of cellPlan) {
      if (!selectedCells.includes(key)) { log(`cell ${key}: skipped (not selected)`); report.skippedCells.push(key); continue; }
      await runCellNamed(key, cell);
    }
    report.executedCells = [...report.cellOrder];
    assert.deepEqual(report.executedCells, selectedCells, `planned cells != executed cells: planned ${JSON.stringify(selectedCells)} executed ${JSON.stringify(report.executedCells)}`);
    const finalEnv = await rpc0('evm_revert', [run.sealed]);
    assert.equal(finalEnv.response.result, true, 'final evm_revert');
    report.estimatedFreshSlots = { label: 'ESTIMATED from the design table, not traced', 'create (native, 4 actions)': '5 evidence + 1 pubId + 2..3 record + 1 subject + 4..6 admission + 2x(2 head + 1 bindingPosition + 3 positionCell) + index appends', 'create (signed)': 'as native + 2 (r, s)', 'edit': '3 record + 2..3 admission + head rewrite + index appends', 'create + label fresh': 'create + 3 record (typeId, meta, one word) + 2 admission + by-Type/by-author appends', 'create + label existing republished': 'create + 1 occurrence rewrite + 2 admission + appends', 'create + label existing omitted': 'create + 0', 'register (per Type)': '3 descriptor (incl. the pinned mandatory acceptor in the header slot) + (1 + refs) refTypes + 2 policy row + epoch rewrite', 'policy activate': '2 policy row + 1 rewrite (activations) + epoch rewrite', 'admission basis': '0 (packed into the existing AdmissionRow.meta word)', 'admission with an active policy': '0 slots; +1 bounded STATICCALL to the policy acceptor after the mandatory rule (ESTIMATED)' };
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
main().catch((e) => { console.error(e); process.exit(e?.exitCode ?? 1); });
