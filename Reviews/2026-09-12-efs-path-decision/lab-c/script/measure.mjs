#!/usr/bin/env node
// Disposable Road C lab — receipt printer for the run-manifest rows. NOT RUN YET (no lease).
// Requires: forge artifacts in ../out (forge build with foundry.toml), an Anvil RPC, ethers v6.
// Usage: RPC_URL=http://127.0.0.1:8545 PRIVATE_KEY=0x... ETHERS_PATH=<path to ethers/lib.esm/index.js> node script/measure.mjs
// Prints one JSON document: rows (per-operation receipts), reads (eth_call vs paid), rpc accounting, unknowns.
// Every gas number printed here is a RECEIPT once run; until then everything in MANIFEST.draft.json stays ESTIMATED/UNKNOWN.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// The coordinator's path (Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers) does not exist on this machine;
// nearest ethers v6 found: /Users/james/Code/EFS/client/node_modules/ethers (6.13.5). Override with ETHERS_PATH.
const ETHERS = process.env.ETHERS_PATH ?? "/Users/james/Code/EFS/client/node_modules/ethers/lib.esm/index.js";
const ethers = await import(pathToFileURL(ETHERS).href);

const RPC = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const PK = process.env.PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // anvil #0
const PK_A = process.env.PK_A ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // anvil #1 = AUTHOR_A
const OUT = process.env.OUT_DIR ?? path.resolve(here, "../out");

// ---- exact supplemental cost controls (run-manifest.md) --------------------------------------
const CONTROLS = {
  quote3000: { bytes: ethers.zeroPadValue(ethers.toBeHex(3000n), 32), keccak: "0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552" },
  quote3100: { bytes: ethers.zeroPadValue(ethers.toBeHex(3100n), 32), keccak: "0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3" },
  file41a: { bytes: "0x" + "61".repeat(41), keccak: "0xe27c263ce61bca70e9ff7d3182fc124c8dcfee2a4656e5c746ceb433a2558911" },
  file41b: { bytes: "0x" + "62".repeat(41), keccak: "0x1882de08a178ebf3827d787e4086d8b2e14a81a8cf3b7b42f2e1458831646f3a" },
};
for (const [k, v] of Object.entries(CONTROLS)) {
  if (ethers.keccak256(v.bytes) !== v.keccak) throw new Error(`control ${k} hash mismatch`);
}

// ---- constants mirrored from src/EfsTypes.sol -----------------------------------------------
const id = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));
const K = { DECLARE_TYPE: 1, RECORD: 2, SUBJECT: 3, BIND: 4, IMPORT: 5 };
const D = { BODY_HASH: 1, RECORD_ID: 2, PACKET: 3 };
const TAG_SUBJECT = id("efs2/subject/1");
const TYPE_META = id("efs2/lab-c/type-meta/1");
const PROFILE = id("efs2/lab-c/acceptance/1");
const OBLIGATIONS = id("efs2/lab-c/index-obligations/1");
const PURPOSE = { FOLDER: id("efs2/lab-c/purpose/folder"), HEAD: id("efs2/lab-c/purpose/head"), TAG: id("efs2/lab-c/purpose/tag") };
const TAG_ASSERT = ethers.zeroPadValue("0x01", 32);
const ZERO = ethers.ZeroHash;
const coder = ethers.AbiCoder.defaultAbiCoder();
const ACTION_T = "tuple(uint8 kind,bytes32 typeId,uint8 digestKind,bytes32 digest,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)";

const action = (o) => ({ kind: 0, typeId: ZERO, digestKind: 0, digest: ZERO, purpose: ZERO, subject: ZERO, role: ZERO, target: ZERO, expectedRevision: 0, salt: ZERO, ...o });
const recordId = (typeId, bodyHash) => ethers.keccak256(coder.encode(["bytes32", "bytes32"], [typeId, bodyHash]));
const subjectId = (principal, salt) => ethers.keccak256(coder.encode(["bytes32", "bytes32", "bytes32"], [TAG_SUBJECT, principal, salt]));
const eoaPrincipal = (addr) => ethers.keccak256(coder.encode(["uint8", "bytes32", "address"], [1, ZERO, addr]));
const contractPrincipal = (origin, addr) => ethers.keccak256(coder.encode(["uint8", "bytes32", "address"], [2, origin, addr]));
const actionsHash = (actions) => ethers.keccak256(coder.encode([`${ACTION_T}[]`], [actions]));
const typeBody = (shape, refTypes) => coder.encode(["bytes32", "bytes32[]"], [shape, refTypes]);
const recordBody = (refs, payload) => coder.encode(["bytes32[]", "bytes"], [refs, payload]);
const quotePayload = (mantissa) => coder.encode(["uint256", "uint8", "uint64", "bytes32"], [mantissa, 6, 1_800_000_000n, ethers.keccak256(ethers.toUtf8Bytes("reference quote"))]);

// ---- rpc accounting ---------------------------------------------------------------------------
const rpcLog = [];
const provider = new ethers.JsonRpcProvider(RPC);
const origSend = provider.send.bind(provider);
provider.send = async (method, params) => {
  const t0 = Date.now();
  const res = await origSend(method, params);
  rpcLog.push({ method, ms: Date.now() - t0, bytes: JSON.stringify(res ?? null).length });
  return res;
};
const wallet = new ethers.Wallet(PK, provider);
const walletA = new ethers.Wallet(PK_A, provider);

const artifact = (name) => JSON.parse(readFileSync(path.join(OUT, `${name}.sol`, `${name}.json`), "utf8"));
const rows = [];
const unknown = [];

async function deploy(name, ...args) {
  const a = artifact(name);
  const f = new ethers.ContractFactory(a.abi, a.bytecode.object, wallet);
  const c = await f.deploy(...args);
  const rc = await c.deploymentTransaction().wait();
  const addr = await c.getAddress();
  const code = await provider.getCode(addr);
  rows.push({ op: `deploy:${name}`, tx: rc.hash, gasUsed: rc.gasUsed.toString(), status: rc.status, runtimeBytes: (code.length - 2) / 2, initcodeBytes: (a.bytecode.object.length - 2) / 2 });
  return c;
}

async function send(op, promise, expectRevert = false) {
  try {
    const tx = await promise;
    const rc = await tx.wait();
    rows.push({ op, tx: rc.hash, gasUsed: rc.gasUsed.toString(), status: rc.status, expectRevert, logs: rc.logs.length });
    return rc;
  } catch (e) {
    const rc = e.receipt ?? null;
    rows.push({ op, tx: rc?.hash ?? null, gasUsed: rc?.gasUsed?.toString() ?? null, status: 0, expectRevert, revert: (e.shortMessage ?? e.message ?? "").slice(0, 200) });
    if (!expectRevert) throw e;
    return null;
  }
}

async function main() {
  const net = await provider.getNetwork();
  // ---- setup -------------------------------------------------------------------------------
  const index = await deploy("IndexModule", id("poison"));
  const ledger = await deploy("Ledger", await index.getAddress());
  await send("setup:attach", index.attach(await ledger.getAddress()));
  const reader = await deploy("LensReader", await ledger.getAddress(), await index.getAddress());
  const pass = await deploy("PassAcceptor");
  const quoteAcc = await deploy("QuoteAcceptorV1");
  const producer = await deploy("Producer");
  const consumer = await deploy("QuoteConsumer");

  const realmOrigin = await ledger.realmOrigin();
  const realmId = await ledger.realmId();
  const codeCommitment = await ledger.coreCodeCommitment();
  const SELF = contractPrincipal(realmOrigin, wallet.address); // NB: an EOA sending publishNative is treated as a contract principal of its address
  const A = eoaPrincipal(walletA.address);
  const B = contractPrincipal(realmOrigin, await producer.getAddress());

  // types + items + pair (native from deployer EOA via publishNative is NOT allowed for EOAs? it is: principal is origin-qualified to the address)
  const itemT = typeBody(id("Item"), []);
  const ITEM_T = recordId(TYPE_META, ethers.keccak256(itemT));
  const pairT = typeBody(id("Pair"), [ITEM_T, ITEM_T]);
  const PAIR_T = recordId(TYPE_META, ethers.keccak256(pairT));
  const quoteT = typeBody(id("Quote"), [PAIR_T]);
  const QUOTE_T = recordId(TYPE_META, ethers.keccak256(quoteT));
  const bytesT = typeBody(id("Bytes"), []);
  const BYTES_T = recordId(TYPE_META, ethers.keccak256(bytesT));
  const eth = recordBody([], ethers.toUtf8Bytes("ETH"));
  const usdc = recordBody([], ethers.toUtf8Bytes("USDC"));
  const ITEM_ETH = recordId(ITEM_T, ethers.keccak256(eth));
  const ITEM_USDC = recordId(ITEM_T, ethers.keccak256(usdc));
  const pairB = recordBody([ITEM_ETH, ITEM_USDC], "0x");
  const PAIR = recordId(PAIR_T, ethers.keccak256(pairB));
  const acceptorTarget = (addr) => ethers.zeroPadValue(addr, 32);
  let nonceSelf = 0n;
  const seed = {
    author: SELF, nonce: ++nonceSelf, deadline: 0, acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS,
    actions: [
      action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(itemT), target: acceptorTarget(await pass.getAddress()) }),
      action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(pairT), target: acceptorTarget(await pass.getAddress()) }),
      action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(quoteT), target: acceptorTarget(await quoteAcc.getAddress()) }),
      action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(bytesT), target: acceptorTarget(await pass.getAddress()) }),
      action({ kind: K.RECORD, typeId: ITEM_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(eth) }),
      action({ kind: K.RECORD, typeId: ITEM_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(usdc) }),
      action({ kind: K.RECORD, typeId: PAIR_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(pairB) }),
    ],
  };
  await send("setup:types+items+pair (native, 7 actions)", ledger.publishNative(seed, [itemT, pairT, quoteT, bytesT, eth, usdc, pairB]));

  // ---- signed publication helper ------------------------------------------------------------
  const domain = { name: "EFS Lab C", version: "1" };
  const types = { PublicationIntent: [
    { name: "realmId", type: "bytes32" }, { name: "coreCodeCommitment", type: "bytes32" }, { name: "author", type: "bytes32" },
    { name: "nonce", type: "uint64" }, { name: "deadline", type: "uint64" }, { name: "acceptanceProfile", type: "bytes32" },
    { name: "indexObligations", type: "bytes32" }, { name: "actionsHash", type: "bytes32" } ] };
  let nonceA = 0n;
  async function signedA(actions) {
    const intent = { author: A, nonce: ++nonceA, deadline: 0, acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS, actions };
    const sig = ethers.Signature.from(await walletA.signTypedData(domain, types, { realmId, coreCodeCommitment: codeCommitment, author: A, nonce: intent.nonce, deadline: 0, acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS, actionsHash: actionsHash(actions) }));
    return { intent, sig: { v: sig.v, r: sig.r, s: sig.s } };
  }
  const key1 = (k) => [k];
  const RECORDS_TABLE = "0x746265667300000000000000000000005265636f726473000000000000000000";
  const RECORDS_LAYOUT = "0x0028020120080000000000000000000000000000000000000000000000000000";
  const recordPresent = async (rid) => (await ledger["getStaticField(bytes32,bytes32[],uint8,bytes32)"](RECORDS_TABLE, key1(rid), 1, RECORDS_LAYOUT)) !== ZERO;

  // ---- step 2: A1 fresh body (signed) --------------------------------------------------------
  const SALT_F = id("F");
  const FILE = subjectId(A, SALT_F);
  const a1Body = recordBody([PAIR], quotePayload(2_500_000_000n));
  const QUOTE_A1 = recordId(QUOTE_T, ethers.keccak256(a1Body));
  rows.push({ op: "pre:QUOTE_A1 absent", value: !(await recordPresent(QUOTE_A1)) });
  let { intent, sig } = await signedA([
    action({ kind: K.SUBJECT, subject: FILE, salt: SALT_F }),
    action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(a1Body) }),
    action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: FILE, target: QUOTE_A1 }),
    action({ kind: K.BIND, purpose: PURPOSE.FOLDER, subject: id("/swaps"), role: id("eth-usdc"), target: FILE }),
    action({ kind: K.BIND, purpose: PURPOSE.TAG, subject: FILE, role: id("market"), target: TAG_ASSERT }),
  ]);
  const a1 = { intent, sig };
  await send("signed-fresh-body-create (A1: subject+record+head+placement+tag)", ledger.publishSigned(intent, ["0x", a1Body, "0x", "0x", "0x"], sig));

  // ---- step 3: A2 edit with CAS ---------------------------------------------------------------
  const a2Body = recordBody([PAIR], quotePayload(2_502_000_000n));
  const QUOTE_A2 = recordId(QUOTE_T, ethers.keccak256(a2Body));
  ({ intent, sig } = await signedA([
    action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(a2Body) }),
    action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: FILE, target: QUOTE_A2, expectedRevision: 1 }),
  ]));
  await send("signed-edit (A2 record + head CAS)", ledger.publishSigned(intent, [a2Body, "0x"], sig));

  // ---- step 4: B1 from the producer contract, fresh body -------------------------------------
  const b1Body = recordBody([PAIR], quotePayload(2_501_000_000n));
  const QUOTE_B1 = recordId(QUOTE_T, ethers.keccak256(b1Body));
  rows.push({ op: "pre:QUOTE_B1 absent", value: !(await recordPresent(QUOTE_B1)) });
  let nonceB = 0n;
  const bIntent = (actions) => ({ author: B, nonce: ++nonceB, deadline: 0, acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS, actions });
  await send("contract-fresh-body (B1 record + own head + own placement)", producer.publish(await ledger.getAddress(), bIntent([
    action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(b1Body) }),
    action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: FILE, target: QUOTE_B1 }),
    action({ kind: K.BIND, purpose: PURPOSE.FOLDER, subject: id("/swaps"), role: id("eth-usdc"), target: FILE }),
  ]), [b1Body, "0x", "0x"]));
  rows.push({ op: "pre:QUOTE_A1 present (for existing-body)", value: await recordPresent(QUOTE_A1) });
  await send("contract-existing-body (B republishes A1 bytes; new occurrence, reused content)", producer.publish(await ledger.getAddress(), bIntent([
    action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(a1Body) }),
  ]), [a1Body]));
  await send("contract-existing-body-by-recordId (digestKind=RECORD_ID, empty body)", producer.publish(await ledger.getAddress(), bIntent([
    action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.RECORD_ID, digest: QUOTE_A1 }),
  ]), ["0x"]));

  // ---- failures ------------------------------------------------------------------------------
  await send("exact-retry (A1 again) -> AlreadyAdmitted", ledger.publishSigned(a1.intent, ["0x", a1Body, "0x", "0x", "0x"], a1.sig), true);
  ({ intent, sig } = await signedA([action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: FILE, target: QUOTE_A1, expectedRevision: 0 })]));
  await send("stale-cas -> StaleCas", ledger.publishSigned(intent, ["0x"], sig), true);
  nonceA--; // the rejected nonce was not consumed
  ({ intent, sig } = await signedA([action({ kind: K.BIND, purpose: PURPOSE.TAG, subject: FILE, role: id("poison"), target: TAG_ASSERT })]));
  await send("failed-mandatory-index -> IndexPoisoned (whole publication reverts)", ledger.publishSigned(intent, ["0x"], sig), true);
  nonceA--;

  // ---- supplemental controls (32-byte quotes, 41-byte binaries) under the Bytes type -----------
  for (const [label, c] of Object.entries(CONTROLS)) {
    const body = recordBody([], c.bytes);
    const rid = recordId(BYTES_T, ethers.keccak256(body));
    rows.push({ op: `pre:${label} absent`, value: !(await recordPresent(rid)) });
    ({ intent, sig } = await signedA([action({ kind: K.RECORD, typeId: BYTES_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(body) })]));
    await send(`control-${label}-fresh (signed, record only; framing = abi.encode([], payload))`, ledger.publishSigned(intent, [body], sig));
  }

  // ---- reads ---------------------------------------------------------------------------------
  const lensA = { principals: [A, B], mode: 0 };
  const lensB = { principals: [B, A], mode: 0 };
  const lensEq = { principals: [A, B], mode: 1 };
  const reads = {};
  reads.resolve_A_first = await reader.resolve(lensA, PURPOSE.HEAD, FILE, ZERO);
  reads.resolve_B_first = await reader.resolve(lensB, PURPOSE.HEAD, FILE, ZERO);
  reads.resolve_no_tiebreak = await reader.resolve(lensEq, PURPOSE.HEAD, FILE, ZERO);
  const zeroCursor = { basisAdmission: 0, indexGeneration: 0, rulesEpoch: 0, coreCodeCommitment: ZERO, scopeKey: ZERO, lensHash: ZERO, position: 0, selectedSoFar: 0 };
  reads.list_swaps_A_first = await reader.list(lensA, PURPOSE.FOLDER, id("/swaps"), zeroCursor, 10);
  reads.listTagged_swaps_market_A_first = await reader.listTagged(lensA, id("/swaps"), id("market"), zeroCursor, 10);
  reads.eth_call_gas_resolve = (await reader.resolve.estimateGas(lensA, PURPOSE.HEAD, FILE, ZERO)).toString();
  reads.eth_call_gas_list = (await reader.list.estimateGas(lensA, PURPOSE.FOLDER, id("/swaps"), zeroCursor, 10)).toString();
  await send("paid-consumer-read A-first (unrelated contract tx)", consumer.consume(await reader.getAddress(), await ledger.getAddress(), lensA, FILE));
  await send("paid-consumer-read B-first", consumer.consume(await reader.getAddress(), await ledger.getAddress(), lensB, FILE));
  await send("paid-consumer-read no-tiebreak -> NotSelected(CONFLICT)", consumer.consume(await reader.getAddress(), await ledger.getAddress(), lensEq, FILE), true);

  unknown.push({ field: "evidence.storageGrowth", reason: "no storage-slot diff is taken by this script (no debug RPC)", consequence: "persistent words per operation stay UNKNOWN until a lease-holder adds anvil_dumpState or a slot-diff pass" });
  unknown.push({ field: "reads.browserRpc", reason: "no static Files SPA in this lab; rpcLog below covers this script's own calls only", consequence: "clean-reader RPC counts are not the browser's" });
  const serialize = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x)));
  console.log(JSON.stringify({ chainId: net.chainId.toString(), addresses: { ledger: await ledger.getAddress(), index: await index.getAddress(), reader: await reader.getAddress(), producer: await producer.getAddress(), consumer: await consumer.getAddress() }, rows, reads: serialize(reads), rpc: { calls: rpcLog.length, bytes: rpcLog.reduce((a, r) => a + r.bytes, 0), byMethod: rpcLog.reduce((m, r) => ((m[r.method] = (m[r.method] ?? 0) + 1), m), {}) }, unknown }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
