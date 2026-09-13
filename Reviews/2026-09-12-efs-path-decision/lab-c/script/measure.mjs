#!/usr/bin/env node
// Disposable Road C receipt runner. It requires an explicit chain lease; this file never starts Anvil.
import { readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readLeftUint, verifyPatchedRuntime } from "./measure-helpers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export function resolveArtifactRoot(env, fallback) { return path.resolve(env.OUT_DIR ?? env.FOUNDRY_OUT ?? fallback); }
const ETHERS = process.env.ETHERS_PATH ?? "/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
const ethers = await import(pathToFileURL(ETHERS).href);
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const PK = process.env.PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const PK_A = process.env.PK_A ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const OUT = resolveArtifactRoot(process.env, path.resolve(here, "../out"));
const EVIDENCE_PATH = process.env.EVIDENCE_PATH;
const RECEIPT_TIMEOUT_MS = Number(process.env.RECEIPT_TIMEOUT_MS ?? 120_000);
const coder = ethers.AbiCoder.defaultAbiCoder();
const ZERO = ethers.ZeroHash;
const id = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));
const K = { DECLARE_TYPE: 1, RECORD: 2, SUBJECT: 3, BIND: 4 };
const D = { BODY_HASH: 1, RECORD_ID: 2 };
const TYPE_META = id("efs2/lab-c/type-meta/2");
const PROFILE = id("efs2/lab-c/acceptance/2");
const OBLIGATIONS = id("efs2/lab-c/index-obligations/1");
const TAG_SUBJECT = id("efs2/subject/1");
const TAG_REALM = id("efs2/realm/1");
const PURPOSE = { FOLDER: id("efs2/lab-c/purpose/folder"), HEAD: id("efs2/lab-c/purpose/head"), TAG: id("efs2/lab-c/purpose/tag") };
const FAMILY_SCOPES = id("efs2/lab-c/index/scopes");
const TAG_ASSERT = ethers.zeroPadValue("0x01", 32);
const TABLE = {
  RECORDS: "0x746265667300000000000000000000005265636f726473000000000000000000",
  BINDINGS: "0x7462656673000000000000000000000042696e64696e67730000000000000000",
  NONCES: "0x746265667300000000000000000000004e6f6e63657300000000000000000000",
  OCCURRENCES: "0x746265667369647800000000000000004f6363757272656e6365730000000000",
};
const LAYOUT = {
  RECORDS: "0x0028020120080000000000000000000000000000000000000000000000000000",
  BINDINGS: "0x002c030020040800000000000000000000000000000000000000000000000000",
  NONCES: "0x0008010008000000000000000000000000000000000000000000000000000000",
  OCCURRENCES: "0x0004010004000000000000000000000000000000000000000000000000000000",
};
const C32 = { create: ethers.zeroPadValue(ethers.toBeHex(3000n), 32), edit: ethers.zeroPadValue(ethers.toBeHex(3100n), 32) };
const C32_HASH = { create: "0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552", edit: "0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3" };
for (const k of Object.keys(C32)) if (ethers.keccak256(C32[k]) !== C32_HASH[k]) throw new Error(`bad ${k} control`);

const action = (o) => ({ kind: 0, typeId: ZERO, digestKind: 0, digest: ZERO, purpose: ZERO, subject: ZERO, role: ZERO, target: ZERO, expectedRevision: 0, salt: ZERO, ...o });
const recordId = (typeId, bodyHash) => ethers.keccak256(coder.encode(["bytes32", "bytes32"], [typeId, bodyHash]));
const recordBody = (refs, payload) => coder.encode(["bytes32[]", "bytes"], [refs, payload]);
const typeBody = (shape, refs, mandatoryRuleId) => coder.encode(["bytes32", "bytes32[]", "bytes32"], [shape, refs, mandatoryRuleId]);
const quotePayload = (n) => coder.encode(["uint256", "uint8", "uint64", "bytes32"], [n, 6, 1_800_000_000n, id("reference quote")]);
const subjectId = (principal, salt) => ethers.keccak256(coder.encode(["bytes32", "bytes32", "bytes32"], [TAG_SUBJECT, principal, salt]));
const bindingKey = (author, purpose, subject, role = ZERO) => ethers.keccak256(coder.encode(["bytes32", "bytes32", "bytes32", "bytes32"], [author, purpose, subject, role]));
const eoaPrincipal = (a) => ethers.keccak256(coder.encode(["uint8", "bytes32", "address"], [1, ZERO, a]));
const contractPrincipal = (origin, a) => ethers.keccak256(coder.encode(["uint8", "bytes32", "address"], [2, origin, a]));
const key1 = (x) => [x];
const decodeBinding = (packed) => ({
  target: `0x${packed.slice(2, 66)}`,
  revision: BigInt(`0x${packed.slice(66, 74) || "0"}`).toString(),
  admission: BigInt(`0x${packed.slice(74, 90) || "0"}`).toString(),
});
const serialize = (v) => JSON.parse(JSON.stringify(v, (_, x) => typeof x === "bigint" ? x.toString() : x));

export function freshReusePlan({ author, dummyBody, targetBody, reuse }) {
  return { author, viaProducer: true, seedBody: reuse ? targetBody : dummyBody, targetBody };
}

const rpc = [];
let rpcSource = "bootstrap";
class EvidenceProvider extends ethers.JsonRpcProvider {
  async _send(payload) {
    const source = rpcSource;
    const startedAt = new Date().toISOString();
    try {
      const reply = await super._send(payload);
      rpc.push({ source, startedAt, finishedAt: new Date().toISOString(), request: serialize(payload), reply: serialize(reply) });
      return reply;
    } catch (error) {
      rpc.push({ source, startedAt, finishedAt: new Date().toISOString(), request: serialize(payload), error: serialize({ code: error.code, message: error.message, data: error.data, info: error.info }) });
      throw error;
    }
  }
}
const provider = new EvidenceProvider(RPC_URL, undefined, { cacheTimeout: -1, batchMaxCount: 1 });
const wallet = new ethers.Wallet(PK, provider);
const walletA = new ethers.Wallet(PK_A, provider);
const evidence = { metadata: {}, artifacts: [], operations: [], observations: [], resets: [], rpc };
const decoders = new Map();
async function sourced(source, fn) { const prior = rpcSource; rpcSource = source; try { return await fn(); } finally { rpcSource = prior; } }
async function raw(method, params, source) { return sourced(source, () => provider.send(method, params)); }
async function fixedBlock(source) {
  const number = await raw("eth_blockNumber", [], `${source}:block-number`);
  const header = await raw("eth_getBlockByNumber", [number, false], `${source}:block-header`);
  if (!header?.hash || header.number !== number) throw new Error(`missing or mismatched block header for ${source}`);
  return { number, hash: header.hash, header };
}
async function observe(source, fn) {
  const block = await fixedBlock(source);
  const rawValue = await sourced(`${source}:call`, () => fn(block.number));
  evidence.observations.push({ source, block, rawValue: serialize(rawValue) });
  return rawValue;
}
function persist(stage) {
  if (!EVIDENCE_PATH || !path.isAbsolute(EVIDENCE_PATH)) throw new Error("EVIDENCE_PATH must be an explicit absolute run-owned path");
  const tmp = `${EVIDENCE_PATH}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(serialize({ ...evidence, partialStage: stage }), null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, EVIDENCE_PATH);
}

const artifactSpec = {
  ImportLib: ["ImportLib.sol", "ImportLib"], IndexModule: ["IndexModule.sol", "IndexModule"], Ledger: ["Ledger.sol", "Ledger"],
  LensReader: ["LensReader.sol", "LensReader"], PassAcceptor: ["FixtureActors.sol", "PassAcceptor"],
  QuoteAcceptorV1: ["FixtureActors.sol", "QuoteAcceptorV1"], Producer: ["FixtureActors.sol", "Producer"],
  MeasurementConsumer: ["MeasurementConsumer.sol", "MeasurementConsumer"],
};
function artifact(name) { const [source, contract] = artifactSpec[name]; return JSON.parse(readFileSync(path.join(OUT, source, `${contract}.json`), "utf8")); }
const links = new Map();
function linkObject(object, references, label) {
  let code = object;
  const entries = [];
  for (const [source, libraries] of Object.entries(references ?? {})) for (const [library, positions] of Object.entries(libraries)) for (const position of positions) entries.push({ source, library, ...position });
  if (label === "Ledger") {
    if (entries.length !== 1 || entries[0].source !== "src/ImportLib.sol" || entries[0].library !== "ImportLib" || entries[0].length !== 20) throw new Error(`unexpected Ledger links: ${JSON.stringify(entries)}`);
  } else if (entries.length !== 0) throw new Error(`unexpected links in ${label}`);
  for (const ref of entries) {
    const address = links.get(`${ref.source}:${ref.library}`);
    if (!address) throw new Error(`missing link ${ref.source}:${ref.library}`);
    const at = 2 + ref.start * 2;
    const placeholder = code.slice(at, at + ref.length * 2);
    if (!/^__\$[0-9a-f]{34}\$__$/.test(placeholder)) throw new Error(`unexpected placeholder ${placeholder}`);
    code = code.slice(0, at) + address.slice(2).toLowerCase() + code.slice(at + ref.length * 2);
  }
  if (/__\$[0-9a-f]{34}\$__/.test(code)) throw new Error(`unresolved placeholder in ${label}`);
  return { code, entries };
}
async function pollReceipt(hash, source) {
  const deadline = Date.now() + RECEIPT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const receipt = await raw("eth_getTransactionReceipt", [hash], `${source}:receipt-poll`);
    if (receipt) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${source} receipt timeout after ${RECEIPT_TIMEOUT_MS}ms for ${hash}`);
}
async function exactTransaction(hash, source, knownReceipt) {
  const transaction = await raw("eth_getTransactionByHash", [hash], `${source}:transaction`);
  const receipt = knownReceipt ?? await pollReceipt(hash, source);
  if (!receipt?.blockHash || !receipt?.blockNumber) throw new Error(`missing receipt basis for ${source}`);
  const header = await raw("eth_getBlockByHash", [receipt.blockHash, false], `${source}:header`);
  if (transaction?.hash !== hash || receipt.transactionHash !== hash || header?.hash !== receipt.blockHash || header?.number !== receipt.blockNumber) throw new Error(`transaction/receipt/header mismatch for ${source}`);
  return { transaction, receipt, header };
}
function expectedImmutables(name, address, args, chainId) {
  // Fresh /2 compiler AST identities, cross-checked by name and artifact-range tests.
  const wordAddress = (value) => ethers.zeroPadValue(value, 32);
  if (name === "ImportLib") return { library_deploy_address: { name: "self library address", value: wordAddress(address) } };
  if (name === "IndexModule") return {
    "3835": { name: "deployer", value: wordAddress(wallet.address) },
    "3837": { name: "poisonConcept", value: args[0] },
  };
  if (name === "Ledger") {
    const indexArtifact = evidence.artifacts.find((item) => item.operation === "deploy:IndexModule");
    if (!indexArtifact) throw new Error("Ledger immutable check requires verified IndexModule");
    return {
      "4429": { name: "index", value: wordAddress(args[0]) },
      "4431": { name: "indexCodehash", value: indexArtifact.runtimeHash },
      "4433": { name: "realmId", value: ethers.keccak256(coder.encode(["bytes32", "uint256", "address"], [TAG_REALM, chainId, address])) },
    };
  }
  if (name === "LensReader") return {
    "5090": { name: "ledger", value: wordAddress(args[0]) },
    "5093": { name: "index", value: wordAddress(args[1]) },
  };
  return {};
}
async function deploy(name, types = [], args = []) {
  const a = artifact(name);
  const linkedInit = linkObject(a.bytecode.object, a.bytecode.linkReferences, name);
  const linkedRuntime = linkObject(a.deployedBytecode.object, a.deployedBytecode.linkReferences, name);
  const constructorArgs = coder.encode(types, args);
  const expectedInitcode = linkedInit.code + constructorArgs.slice(2);
  const factory = new ethers.ContractFactory(a.abi, linkedInit.code, wallet);
  const contract = await sourced(`deploy:${name}:send`, () => factory.deploy(...args));
  const tx = contract.deploymentTransaction();
  if (tx.data.toLowerCase() !== expectedInitcode.toLowerCase()) throw new Error(`${name} initcode mismatch`);
  const mined = await pollReceipt(tx.hash, `deploy:${name}`);
  if (Number(mined.status) !== 1) throw new Error(`${name} deployment mined with status ${Number(mined.status)}`);
  const address = await contract.getAddress();
  if (mined.contractAddress?.toLowerCase() !== address.toLowerCase()) throw new Error(`${name} receipt contract address mismatch`);
  decoders.set(address.toLowerCase(), { name, interface: contract.interface });
  const code = await raw("eth_getCode", [address, mined.blockNumber], `deploy:${name}:code`);
  const chainId = BigInt(await raw("eth_chainId", [], `deploy:${name}:chain-id`));
  const runtimeCheck = verifyPatchedRuntime({ artifactRuntime: linkedRuntime.code, actualRuntime: code, immutableReferences: a.deployedBytecode.immutableReferences, expected: expectedImmutables(name, address, args, chainId) });
  const exact = await exactTransaction(tx.hash, `deploy:${name}`, mined);
  const row = { cell: "setup", operation: `deploy:${name}`, address, constructorArgs, initcode: expectedInitcode, initcodeBytes: (expectedInitcode.length - 2) / 2, initcodeHash: ethers.keccak256(expectedInitcode), artifactRuntimeTemplate: linkedRuntime.code, runtime: code, runtimeBytes: (code.length - 2) / 2, runtimeHash: ethers.keccak256(code), immutableRanges: runtimeCheck.ranges, links: linkedInit.entries, exact };
  if (row.initcodeBytes > 49152 || row.runtimeBytes > 24576) throw new Error(`${name} exceeds standard size limit`);
  evidence.artifacts.push(row);
  return contract;
}
async function send(cell, operation, makeTransaction) {
  const tx = await sourced(`${cell}:${operation}:send`, makeTransaction);
  const receipt = await pollReceipt(tx.hash, `${cell}:${operation}`);
  const exact = await exactTransaction(tx.hash, `${cell}:${operation}`, receipt);
  const decodedLogs = [];
  for (const log of exact.receipt.logs ?? []) {
    const decoder = decoders.get(log.address.toLowerCase());
    if (!decoder) continue;
    try {
      const parsed = decoder.interface.parseLog({ topics: log.topics, data: log.data });
      decodedLogs.push({ address: log.address, contract: decoder.name, name: parsed.name, args: Object.fromEntries(parsed.fragment.inputs.map((input, i) => [input.name, serialize(parsed.args[i])])) });
    } catch {}
  }
  const row = { cell, operation, status: Number(receipt.status), gasUsed: BigInt(receipt.gasUsed).toString(), exact, decodedLogs };
  if (row.status !== 1) throw new Error(`${cell}:${operation} mined with status ${row.status}`);
  evidence.operations.push(row);
  return row;
}
function oneDecoded(row, contract, name) {
  const matches = row.decodedLogs.filter((log) => log.contract === contract && log.name === name);
  if (matches.length !== 1) throw new Error(`${row.cell}:${row.operation} expected one ${contract}.${name}, got ${matches.length}`);
  return matches[0].args;
}
function assertPublished(row, author, proofKind, leafCount) {
  const event = oneDecoded(row, "Ledger", "Published");
  if (event.author !== author || BigInt(event.proofKind) !== BigInt(proofKind) || BigInt(event.leafCount) !== BigInt(leafCount)) {
    throw new Error(`${row.cell}:${row.operation} Published context mismatch`);
  }
  return event;
}
function commitmentEvent(row, name, subject, recordId, author) {
  const event = oneDecoded(row, "MeasurementConsumer", name);
  if (event.commitment === ZERO || event.subject !== subject || event.recordId !== recordId || event.selectedBy !== author) throw new Error(`${row.cell}:${row.operation} commitment mismatch`);
  if (name === "ListCommitted" && BigInt(event.coverageThrough) < BigInt(event.basis)) throw new Error(`${row.cell}:${row.operation} event coverage is behind basis`);
  return event;
}
function revertData(error) { return [error?.data, error?.info?.error?.data, error?.error?.data].find((x) => typeof x === "string" && x.startsWith("0x")) ?? null; }
async function minedFailure(cell, operation, contract, functionName, args, expectedSelector, expectedReason) {
  const block = await fixedBlock(`${cell}:${operation}:static`);
  const data = contract.interface.encodeFunctionData(functionName, args);
  let staticError;
  let callSucceeded = false;
  try {
    await raw("eth_call", [{ from: wallet.address, to: await contract.getAddress(), data }, block.number], `${cell}:${operation}:static-call`);
    callSucceeded = true;
  } catch (error) {
    const dataHex = revertData(error);
    staticError = { block, data: dataHex, selector: dataHex?.slice(0, 10) ?? null, error: serialize({ code: error.code, message: error.message }) };
  }
  if (callSucceeded) throw new Error(`${operation} static call unexpectedly succeeded`);
  if (!staticError?.data || staticError.selector !== expectedSelector) throw new Error(`${operation} expected ${expectedReason} ${expectedSelector}, got ${staticError?.selector}`);
  let hash;
  try {
    const to = await contract.getAddress();
    const tx = await sourced(`${cell}:${operation}:send`, () => wallet.sendTransaction({ to, data, gasLimit: 30_000_000 }));
    hash = tx.hash;
  } catch (error) { hash = hash ?? error?.receipt?.hash ?? error?.transactionHash; }
  if (!hash) throw new Error(`${operation} has no mined transaction hash`);
  const exact = await exactTransaction(hash, `${cell}:${operation}`);
  if (Number(exact.receipt.status) !== 0) throw new Error(`${operation} did not mine status 0`);
  evidence.operations.push({ cell, operation, status: 0, expectedReason, expectedSelector, staticError, exact });
}

async function main() {
  if (!EVIDENCE_PATH || !path.isAbsolute(EVIDENCE_PATH)) throw new Error("EVIDENCE_PATH must be an explicit absolute run-owned path");
  const network = await provider.getNetwork();
  evidence.metadata = { startedAt: new Date().toISOString(), chainId: network.chainId.toString(), rpcUrl: RPC_URL, artifactRootConfigured: OUT, artifactRootReal: realpathSync(OUT), evidencePath: EVIDENCE_PATH, ethersPath: ETHERS, provider: { cacheTimeout: -1, batchMaxCount: 1, receiptTimeoutMs: RECEIPT_TIMEOUT_MS }, framing: "supplemental c32 values are abi.encode(bytes32[],bytes), never bare bytes32" };
  const importLib = await deploy("ImportLib");
  links.set("src/ImportLib.sol:ImportLib", await importLib.getAddress());
  const index = await deploy("IndexModule", ["bytes32"], [ZERO]);
  const ledger = await deploy("Ledger", ["address"], [await index.getAddress()]);
  await send("setup", "attach-index", async () => index.getFunction("attach")(await ledger.getAddress()));
  const reader = await deploy("LensReader", ["address", "address"], [await ledger.getAddress(), await index.getAddress()]);
  const pass = await deploy("PassAcceptor");
  const quoteAcceptor = await deploy("QuoteAcceptorV1");
  const producer = await deploy("Producer");
  const consumer = await deploy("MeasurementConsumer");
  const contracts = { importLib, index, ledger, reader, pass, quoteAcceptor, producer, consumer };
  evidence.metadata.addresses = Object.fromEntries(await Promise.all(Object.entries(contracts).map(async ([k, v]) => [k, await v.getAddress()])));
  evidence.metadata.ledgerDomain = {
    chainId: network.chainId.toString(), ledger: await ledger.getAddress(),
    realmId: await observe("setup:realm-id", (b) => ledger.realmId({ blockTag: b })),
    realmOrigin: await observe("setup:realm-origin", (b) => ledger.realmOrigin({ blockTag: b })),
    coreCodeCommitment: await observe("setup:code-commitment", (b) => ledger.coreCodeCommitment({ blockTag: b })),
    domainSeparator: await observe("setup:domain-separator", (b) => ledger.domainSeparator({ blockTag: b })),
    signingMethod: "exact Ledger.intentDigest at a retained block basis; wallet signs that digest directly",
  };
  const domain = evidence.metadata.ledgerDomain;
  const SELF = contractPrincipal(domain.realmOrigin, wallet.address);
  const A = eoaPrincipal(walletA.address);
  const B = contractPrincipal(domain.realmOrigin, await producer.getAddress());
  // Candidate declaration inputs, derived from retained runtime-verified deployments;
  // these are not the independent comparison oracle's expectations.
  const passRuleId = evidence.artifacts.find((row) => row.operation === "deploy:PassAcceptor")?.runtimeHash;
  const quoteRuleId = evidence.artifacts.find((row) => row.operation === "deploy:QuoteAcceptorV1")?.runtimeHash;
  if (!passRuleId || !quoteRuleId) throw new Error("missing retained mandatory-rule runtime commitments");
  const itemBody = typeBody(id("Item"), [], passRuleId), ITEM_T = recordId(TYPE_META, ethers.keccak256(itemBody));
  const pairTypeBody = typeBody(id("Pair"), [ITEM_T, ITEM_T], passRuleId), PAIR_T = recordId(TYPE_META, ethers.keccak256(pairTypeBody));
  const quoteTypeBody = typeBody(id("Quote"), [PAIR_T], quoteRuleId), QUOTE_T = recordId(TYPE_META, ethers.keccak256(quoteTypeBody));
  const bytesTypeBody = typeBody(id("Bytes"), [], passRuleId), BYTES_T = recordId(TYPE_META, ethers.keccak256(bytesTypeBody));
  const ethBody = recordBody([], ethers.toUtf8Bytes("ETH")), usdcBody = recordBody([], ethers.toUtf8Bytes("USDC"));
  const ITEM_ETH = recordId(ITEM_T, ethers.keccak256(ethBody)), ITEM_USDC = recordId(ITEM_T, ethers.keccak256(usdcBody));
  const pairBody = recordBody([ITEM_ETH, ITEM_USDC], "0x"), PAIR = recordId(PAIR_T, ethers.keccak256(pairBody));
  const acceptorTarget = (a) => ethers.zeroPadValue(a, 32);

  async function nonceOf(author, label) { return readLeftUint(await observe(label, (b) => ledger["getStaticField(bytes32,bytes32[],uint8,bytes32)"](TABLE.NONCES, key1(author), 0, LAYOUT.NONCES, { blockTag: b })), 8); }
  async function intent(author, actions, label) { return { author, nonce: await nonceOf(author, `${label}:nonce`) + 1n, deadline: 0, acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS, actions }; }
  async function signIntent(value, label) {
    const digest = await observe(`${label}:intent-digest`, (b) => ledger.intentDigest(value, { blockTag: b }));
    const signature = walletA.signingKey.sign(digest);
    if (ethers.recoverAddress(digest, signature) !== walletA.address) throw new Error(`${label} signer mismatch`);
    return { v: signature.v, r: signature.r, s: signature.s };
  }
  async function publishSigned(cell, label, actions, bodies) { const value = await intent(A, actions, label); const sig = await signIntent(value, label); const row = await send(cell, label, async () => ledger.publishSigned(value, bodies, sig)); assertPublished(row, A, 2, actions.length); return { value, sig, row }; }
  async function publishNative(cell, label, author, actions, bodies, viaProducer = false) { const value = await intent(author, actions, label); const row = await send(cell, label, async () => viaProducer ? producer.publish(await ledger.getAddress(), value, bodies) : ledger.publishNative(value, bodies)); assertPublished(row, author, 1, actions.length); return { value, row }; }

  const setupActions = [
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(itemBody), target: acceptorTarget(await pass.getAddress()) }),
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(pairTypeBody), target: acceptorTarget(await pass.getAddress()) }),
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(quoteTypeBody), target: acceptorTarget(await quoteAcceptor.getAddress()) }),
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(bytesTypeBody), target: acceptorTarget(await pass.getAddress()) }),
    action({ kind: K.RECORD, typeId: ITEM_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(ethBody) }), action({ kind: K.RECORD, typeId: ITEM_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(usdcBody) }), action({ kind: K.RECORD, typeId: PAIR_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(pairBody) }),
  ];
  await publishNative("setup", "types-items-pair", SELF, setupActions, [itemBody, pairTypeBody, quoteTypeBody, bytesTypeBody, ethBody, usdcBody, pairBody]);
  const baselineProof = {
    walletPendingNonce: await raw("eth_getTransactionCount", [wallet.address, "pending"], "setup:baseline-wallet-nonce"),
    highWater: (await observe("setup:baseline-high-water", (b) => ledger.highWater({ blockTag: b }))).toString(),
  };
  let baseline = await raw("evm_snapshot", [], "setup:snapshot");
  persist("post-setup");
  async function reset(label) {
    const reverted = await raw("evm_revert", [baseline], `${label}:revert`);
    if (!reverted) throw new Error(`${label} reset failed`);
    const walletPendingNonce = await raw("eth_getTransactionCount", [wallet.address, "pending"], `${label}:wallet-nonce-proof`);
    const highWater = (await observe(`${label}:high-water-proof`, (b) => ledger.highWater({ blockTag: b }))).toString();
    if (walletPendingNonce !== baselineProof.walletPendingNonce || highWater !== baselineProof.highWater) throw new Error(`${label} did not restore post-setup nonce/basis`);
    baseline = await raw("evm_snapshot", [], `${label}:snapshot`);
    evidence.resets.push({ label, reverted, newSnapshot: baseline, walletPendingNonce, highWater });
    persist(label);
  }
  async function capture(cell, phase, { record, author, subject }) {
    const key = bindingKey(author, PURPOSE.HEAD, subject);
    const recordFirst = await observe(`${cell}:${phase}:record-first`, (b) => ledger["getStaticField(bytes32,bytes32[],uint8,bytes32)"](TABLE.RECORDS, key1(record), 1, LAYOUT.RECORDS, { blockTag: b }));
    const occurrences = await observe(`${cell}:${phase}:occurrences`, (b) => index["getStaticField(bytes32,bytes32[],uint8,bytes32)"](TABLE.OCCURRENCES, key1(record), 0, LAYOUT.OCCURRENCES, { blockTag: b }));
    const binding = await observe(`${cell}:${phase}:binding`, (b) => ledger["getRecord(bytes32,bytes32[],bytes32)"](TABLE.BINDINGS, key1(key), LAYOUT.BINDINGS, { blockTag: b }));
    const nonce = await nonceOf(author, `${cell}:${phase}:accepted-nonce`);
    const highWater = await observe(`${cell}:${phase}:high-water`, (b) => ledger.highWater({ blockTag: b }));
    const generation = await observe(`${cell}:${phase}:index-generation`, (b) => index.generation({ blockTag: b }));
    const coverage = await observe(`${cell}:${phase}:index-coverage`, (b) => index.coverage(FAMILY_SCOPES, ZERO, { blockTag: b }));
    const decoded = { recordFirstAdmission: readLeftUint(recordFirst, 8).toString(), occurrences: readLeftUint(occurrences, 4).toString(), binding: decodeBinding(binding[0]), nonce: nonce.toString(), highWater: highWater.toString(), indexBasis: { generation: generation.toString(), coverageStatus: coverage[0].toString(), coverageThrough: coverage[1].toString() } };
    evidence.observations.push({ source: `${cell}:${phase}:decoded-state`, decoded });
    return decoded;
  }
  function assertRecordTransition(label, pre, post, mode) {
    if (mode === "fresh") {
      if (pre.recordFirstAdmission !== "0" || pre.occurrences !== "0" || BigInt(post.recordFirstAdmission) === 0n || post.occurrences !== "1") throw new Error(`${label} fresh transition mismatch`);
    } else if (mode === "existing") {
      if (BigInt(pre.recordFirstAdmission) === 0n || pre.occurrences !== "1" || post.recordFirstAdmission !== pre.recordFirstAdmission || post.occurrences !== "2") throw new Error(`${label} existing-body transition mismatch`);
    } else throw new Error(`${label} unknown transition mode ${mode}`);
  }
  const expected = (author, typeId, rid, expectedRef, payload) => ({ author, typeId, recordId: rid, expectedRef, payloadLength: ethers.getBytes(payload).length, payloadHash: ethers.keccak256(payload) });
  const lens = (author, other) => ({ principals: [author, other], mode: 0 });

  {
    const cell = "typed-joined", salt = id("typed-file"), file = subjectId(A, salt), folder = id("/swaps"), name = id("eth-usdc");
    const a1Payload = quotePayload(2_500_000_000n), a2Payload = quotePayload(2_502_000_000n), b1Payload = quotePayload(2_501_000_000n);
    const a1Body = recordBody([PAIR], a1Payload), a2Body = recordBody([PAIR], a2Payload), b1Body = recordBody([PAIR], b1Payload);
    const A1 = recordId(QUOTE_T, ethers.keccak256(a1Body)), A2 = recordId(QUOTE_T, ethers.keccak256(a2Body)), B1 = recordId(QUOTE_T, ethers.keccak256(b1Body));
    const a1Actions = [action({ kind: K.SUBJECT, subject: file, salt }), action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(a1Body) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: A1 }), action({ kind: K.BIND, purpose: PURPOSE.FOLDER, subject: folder, role: name, target: file }), action({ kind: K.BIND, purpose: PURPOSE.TAG, subject: file, role: id("market"), target: TAG_ASSERT })];
    const preA1 = await capture(cell, "pre-A1", { record: A1, author: A, subject: file });
    const signedA1 = await publishSigned(cell, "A1-create", a1Actions, ["0x", a1Body, "0x", "0x", "0x"]);
    const postA1 = await capture(cell, "post-A1", { record: A1, author: A, subject: file });
    assertRecordTransition(`${cell}:A1`, preA1, postA1, "fresh");
    const preA2 = await capture(cell, "pre-A2", { record: A2, author: A, subject: file });
    await publishSigned(cell, "A2-edit", [action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(a2Body) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: A2, expectedRevision: 1 })], [a2Body, "0x"]);
    const postA2 = await capture(cell, "post-A2", { record: A2, author: A, subject: file });
    assertRecordTransition(`${cell}:A2`, preA2, postA2, "fresh");
    const preB1 = await capture(cell, "pre-B1", { record: B1, author: B, subject: file });
    await publishNative(cell, "B1-create", B, [action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(b1Body) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: B1 }), action({ kind: K.BIND, purpose: PURPOSE.FOLDER, subject: folder, role: name, target: file })], [b1Body, "0x", "0x"], true);
    const postB1 = await capture(cell, "post-B1", { record: B1, author: B, subject: file });
    assertRecordTransition(`${cell}:B1`, preB1, postB1, "fresh");
    const pointA = commitmentEvent(await send(cell, "paid-point-A", async () => consumer.paidPoint(await reader.getAddress(), await ledger.getAddress(), lens(A, B), PURPOSE.HEAD, file, ZERO, expected(A, QUOTE_T, A2, PAIR, a2Payload))), "PointCommitted", file, A2, A);
    const listA = commitmentEvent(await send(cell, "paid-list-A", async () => consumer.paidList(await reader.getAddress(), await ledger.getAddress(), lens(A, B), folder, name, file, 10, expected(A, QUOTE_T, A2, PAIR, a2Payload))), "ListCommitted", file, A2, A);
    if (pointA.basis !== listA.basis) throw new Error(`${cell} A point/list basis mismatch`);
    const pointB = commitmentEvent(await send(cell, "paid-point-B", async () => consumer.paidPoint(await reader.getAddress(), await ledger.getAddress(), lens(B, A), PURPOSE.HEAD, file, ZERO, expected(B, QUOTE_T, B1, PAIR, b1Payload))), "PointCommitted", file, B1, B);
    const listB = commitmentEvent(await send(cell, "paid-list-B", async () => consumer.paidList(await reader.getAddress(), await ledger.getAddress(), lens(B, A), folder, name, file, 10, expected(B, QUOTE_T, B1, PAIR, b1Payload))), "ListCommitted", file, B1, B);
    if (pointB.basis !== listB.basis) throw new Error(`${cell} B point/list basis mismatch`);
    const alreadyAdmitted = ledger.interface.getError("AlreadyAdmitted").selector;
    await minedFailure(cell, "exact-retry-A1", ledger, "publishSigned", [signedA1.value, ["0x", a1Body, "0x", "0x", "0x"], signedA1.sig], alreadyAdmitted, "AlreadyAdmitted");
  }
  await reset("after-typed");

  async function c32Cell(cell, author, signed) {
    const salt = id("c32-file"), file = subjectId(author, salt), folder = id("/c32"), name = id("quote");
    const createBody = recordBody([], C32.create), editBody = recordBody([], C32.edit);
    const createId = recordId(BYTES_T, ethers.keccak256(createBody)), editId = recordId(BYTES_T, ethers.keccak256(editBody));
    const createActions = [action({ kind: K.SUBJECT, subject: file, salt }), action({ kind: K.RECORD, typeId: BYTES_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(createBody) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: createId }), action({ kind: K.BIND, purpose: PURPOSE.FOLDER, subject: folder, role: name, target: file })];
    const editActions = [action({ kind: K.RECORD, typeId: BYTES_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(editBody) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: editId, expectedRevision: 1 })];
    const preCreate = await capture(cell, "pre-create", { record: createId, author, subject: file });
    if (signed) await publishSigned(cell, "create", createActions, ["0x", createBody, "0x", "0x"]); else await publishNative(cell, "create", author, createActions, ["0x", createBody, "0x", "0x"], true);
    const postCreate = await capture(cell, "post-create", { record: createId, author, subject: file });
    assertRecordTransition(`${cell}:create`, preCreate, postCreate, "fresh");
    if (postCreate.binding.revision !== "1" || postCreate.binding.target !== createId) throw new Error(`${cell} create binding transition mismatch`);
    const preEdit = await capture(cell, "pre-edit", { record: editId, author, subject: file });
    if (signed) await publishSigned(cell, "edit", editActions, [editBody, "0x"]); else await publishNative(cell, "edit", author, editActions, [editBody, "0x"], true);
    const postEdit = await capture(cell, "post-edit", { record: editId, author, subject: file });
    assertRecordTransition(`${cell}:edit`, preEdit, postEdit, "fresh");
    if (preEdit.binding.revision !== "1" || postEdit.binding.revision !== "2" || postEdit.binding.target !== editId) throw new Error(`${cell} edit binding transition mismatch`);
    const l = { principals: [author], mode: 0 }, exp = expected(author, BYTES_T, editId, ZERO, C32.edit);
    const point = commitmentEvent(await send(cell, "paid-point", async () => consumer.paidPoint(await reader.getAddress(), await ledger.getAddress(), l, PURPOSE.HEAD, file, ZERO, exp)), "PointCommitted", file, editId, author);
    const list = commitmentEvent(await send(cell, "paid-list", async () => consumer.paidList(await reader.getAddress(), await ledger.getAddress(), l, folder, name, file, 10, exp)), "ListCommitted", file, editId, author);
    if (point.basis !== list.basis) throw new Error(`${cell} point/list basis mismatch`);
  }
  await c32Cell("c32-native-producer-framed", B, false);
  await reset("after-c32-native");
  await c32Cell("c32-signed-framed", A, true);
  await reset("after-c32-signed");

  async function freshReuseCell(cell, reuse) {
    const dummyBody = recordBody([], C32.create), targetBody = recordBody([], C32.edit);
    const plan = freshReusePlan({ author: B, dummyBody, targetBody, reuse });
    const targetId = recordId(BYTES_T, ethers.keccak256(plan.targetBody));
    const seedId = recordId(BYTES_T, ethers.keccak256(plan.seedBody));
    await publishNative(cell, "matched-seed", plan.author, [action({ kind: K.RECORD, typeId: BYTES_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(plan.seedBody) })], [plan.seedBody], plan.viaProducer);
    const pre = await capture(cell, "pre", { record: targetId, author: plan.author, subject: ZERO });
    const measured = action({ kind: K.RECORD, typeId: BYTES_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(plan.targetBody) });
    await publishNative(cell, "measured-record", plan.author, [measured], [plan.targetBody], plan.viaProducer);
    const post = await capture(cell, "post", { record: targetId, author: plan.author, subject: ZERO });
    assertRecordTransition(`${cell}:measured-record`, pre, post, reuse ? "existing" : "fresh");
    evidence.observations.push({ source: `${cell}:matched-seeding`, decoded: { author: plan.author, viaProducer: plan.viaProducer, seedId, targetId, seedBodyBytes: ethers.getBytes(plan.seedBody).length, measuredDigestKind: D.BODY_HASH, measuredActionCount: 1, measuredBodyBytes: ethers.getBytes(plan.targetBody).length } });
  }
  await freshReuseCell("record-fresh-isolated", false);
  await reset("after-record-fresh");
  await freshReuseCell("record-reused-isolated", true);
  evidence.metadata.finishedAt = new Date().toISOString();
  persist("complete");
  process.stdout.write(`${JSON.stringify(serialize(evidence), null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => {
  try {
    if (EVIDENCE_PATH && path.isAbsolute(EVIDENCE_PATH)) persist("fatal");
  } catch (persistError) {
    evidence.metadata.persistError = persistError.message;
  }
  process.stderr.write(`${JSON.stringify({ fatal: serialize({ message: error.message, stack: error.stack, code: error.code, data: error.data, info: error.info }), partialEvidence: serialize(evidence) }, null, 2)}\n`);
  process.exitCode = 1;
});
