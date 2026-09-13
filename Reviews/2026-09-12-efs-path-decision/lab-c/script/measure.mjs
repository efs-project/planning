#!/usr/bin/env node
// Disposable Road C receipt runner. It requires an explicit chain lease; this file never starts Anvil.
import { readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DEFAULT_CELLS, OPTIONAL_CELLS, PLACEMENT_FIELDS, SELECTION_FIELDS,
  assertAnvilClient, assertAnvilOnlyCells, assertUnrelatedCaller, checkAgreement, checkPaidRowOrdering,
  decodeAdmissionStatic, decodeBindingStatic, decodeEvidenceStatic, deriveAbstractResult, evidenceCategoryOf,
  paidObservationMatch, parseRunArgs, readLeftUint, selectCells, verifyPatchedRuntime,
} from "./measure-helpers.mjs";
import { assertManifestCall, assertPaidManifestOutcome, createControllerGate } from "./controller-gate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export function resolveArtifactRoot(env, fallback) { return path.resolve(env.OUT_DIR ?? env.FOUNDRY_OUT ?? fallback); }
const ETHERS = process.env.ETHERS_PATH ?? "/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
const ethers = await import(pathToFileURL(ETHERS).href);
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const PK = process.env.PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const OUT = resolveArtifactRoot(process.env, path.resolve(here, "../out"));
const EVIDENCE_PATH = process.env.EVIDENCE_PATH;
const RECEIPT_TIMEOUT_MS = Number(process.env.RECEIPT_TIMEOUT_MS ?? 120_000);
// Run flags: --anvil (owned chain; required by the sealing cells) and --cells a,b (exact keys; the paired control only by name).
const RUN_ARGS = parseRunArgs(process.argv.slice(2));
const SELECTED_CELLS = selectCells(RUN_ARGS.cells, { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS });
assertAnvilOnlyCells(SELECTED_CELLS, RUN_ARGS.anvil); // refuses BEFORE any chain call (the provider below is lazy)
const controllerGate = await createControllerGate({ env: process.env, selectedCells: SELECTED_CELLS, anvil: RUN_ARGS.anvil });
// The pinned unrelated paid caller: a fixed ephemeral account of the run mnemonic at a derivation index that is not the
// deployer (0), not AUTHOR_A (1) and not a producer/contract; only its address and derivation path are retained.
const RUN_MNEMONIC = process.env.RUN_MNEMONIC ?? "test test test test test test test test test test test junk";
const PAID_CALLER_INDEX = Number(process.env.PAID_CALLER_INDEX ?? 3);
const PAID_CALLER_PATH = `m/44'/60'/0'/0/${PAID_CALLER_INDEX}`;
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
  ADMISSIONS: "0x7462656673000000000000000000000041646d697373696f6e73000000000000",
  EVIDENCE: "0x7462656673000000000000000000000045766964656e63650000000000000000",
  SCOPES: "0x7462656673696478000000000000000053636f70657300000000000000000000",
  BINDING_HISTORY: "0x7462656673696478000000000000000042696e64696e67486973746f72790000",
};
const LAYOUT = {
  RECORDS: "0x0028020120080000000000000000000000000000000000000000000000000000",
  BINDINGS: "0x002c030020040800000000000000000000000000000000000000000000000000",
  NONCES: "0x0008010008000000000000000000000000000000000000000000000000000000",
  OCCURRENCES: "0x0004010004000000000000000000000000000000000000000000000000000000",
  ADMISSIONS: "0x01060b0020012001202020202004200000000000000000000000000000000000",
  EVIDENCE: "0x0145110020012020010808202020080208202020010000000000000000000000",
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
const scopeKey = (purpose, scope) => ethers.keccak256(coder.encode(["bytes32", "bytes32"], [purpose, scope]));
const lensHashOf = (l) => ethers.keccak256(coder.encode(["bytes32[]", "uint8"], [l.principals, l.mode]));
const str = (v) => (typeof v === "boolean" ? String(v) : String(v));
const pickFields = (result, fields) => Object.fromEntries(fields.map((k, i) => [k, str(result[k] ?? result[i])]));
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
const walletA = controllerGate.enabled ? null : new ethers.Wallet(process.env.PK_A ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
const paidCaller = ethers.HDNodeWallet.fromPhrase(RUN_MNEMONIC, undefined, PAID_CALLER_PATH).connect(provider);
const evidence = { metadata: {}, artifacts: [], operations: [], observations: [], resets: [], slices: {}, rpc };
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
/// A getter pinned to an already-retained block (the seal): the observation names that block's number and hash.
async function observeAt(source, block, fn) {
  const rawValue = await sourced(`${source}:call`, () => fn(block.number));
  evidence.observations.push({ source, block: { number: block.number, hash: block.hash }, rawValue: serialize(rawValue) });
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
  // With any sealing cell selected the chain must identify as Anvil BEFORE any state call (a non-Anvil chain fails here, not at the first evm_snapshot).
  const clientVersion = await raw("web3_clientVersion", [], "run:client-version");
  assertAnvilClient(clientVersion, assertAnvilOnlyCells(SELECTED_CELLS, RUN_ARGS.anvil));
  const network = await provider.getNetwork();
  evidence.metadata = { startedAt: new Date().toISOString(), chainId: network.chainId.toString(), rpcUrl: RPC_URL, artifactRootConfigured: OUT, artifactRootReal: realpathSync(OUT), evidencePath: EVIDENCE_PATH, ethersPath: ETHERS, provider: { cacheTimeout: -1, batchMaxCount: 1, receiptTimeoutMs: RECEIPT_TIMEOUT_MS }, framing: "supplemental c32 values are abi.encode(bytes32[],bytes), never bare bytes32", run: { anvil: RUN_ARGS.anvil, cells: SELECTED_CELLS, anvilOnlyCells: assertAnvilOnlyCells(SELECTED_CELLS, RUN_ARGS.anvil), clientVersion, controllerGate: controllerGate.report }, paidCaller: { address: paidCaller.address, derivationPath: PAID_CALLER_PATH, index: PAID_CALLER_INDEX, mnemonicSource: process.env.RUN_MNEMONIC ? "RUN_MNEMONIC (env)" : "anvil default mnemonic", standing: "fixed ephemeral account of the run mnemonic; unrelated to every fixture role, asserted after the global deployment and the shared setup:types-items-pair publication and before the sealed slice's A1/A2/B1 rows; no secret retained" } };
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
  const authorAAddress = controllerGate.enabled ? controllerGate.input.accounts?.authorA?.address : walletA.address;
  if (!authorAAddress) throw new Error("gated input has no accounts.authorA.address");
  const A = eoaPrincipal(authorAAddress);
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
  async function signIntent(value, label, manifestKey) {
    const digest = await observe(`${label}:intent-digest`, (b) => ledger.intentDigest(value, { blockTag: b }));
    const signature = controllerGate.enabled ? controllerGate.input.publications[manifestKey]?.signature : walletA.signingKey.sign(digest);
    if (!signature || ethers.recoverAddress(digest, signature) !== authorAAddress) throw new Error(`${label} signer mismatch`);
    return { v: signature.v, r: signature.r, s: signature.s };
  }
  async function manifestSend(cell, label, manifestKey, caller, target, calldata, fallback) {
    if (!controllerGate.enabled) return send(cell, label, fallback);
    const pinned = controllerGate.input.publications[manifestKey];
    assertManifestCall(manifestKey, { caller, target, calldata }, pinned);
    return send(cell, label, () => wallet.sendTransaction({ to: pinned.target, data: pinned.calldata }));
  }
  async function publishSigned(cell, label, actions, bodies, manifestKey) {
    const value = await intent(A, actions, label); const sig = await signIntent(value, label, manifestKey);
    const target = await ledger.getAddress(); const calldata = ledger.interface.encodeFunctionData("publishSigned", [value, bodies, sig]);
    const row = await manifestSend(cell, label, manifestKey, wallet.address, target, calldata, () => ledger.publishSigned(value, bodies, sig));
    assertPublished(row, A, 2, actions.length); return { value, sig, row };
  }
  async function publishNative(cell, label, author, actions, bodies, viaProducer = false, manifestKey) {
    const value = await intent(author, actions, label); const ledgerAddress = await ledger.getAddress();
    const target = viaProducer ? await producer.getAddress() : ledgerAddress;
    const calldata = viaProducer ? producer.interface.encodeFunctionData("publish", [ledgerAddress, value, bodies]) : ledger.interface.encodeFunctionData("publishNative", [value, bodies]);
    const row = await manifestSend(cell, label, manifestKey, wallet.address, target, calldata, () => viaProducer ? producer.publish(ledgerAddress, value, bodies) : ledger.publishNative(value, bodies));
    assertPublished(row, author, 1, actions.length); return { value, row };
  }

  const setupActions = [
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(itemBody), target: acceptorTarget(await pass.getAddress()) }),
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(pairTypeBody), target: acceptorTarget(await pass.getAddress()) }),
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(quoteTypeBody), target: acceptorTarget(await quoteAcceptor.getAddress()) }),
    action({ kind: K.DECLARE_TYPE, typeId: TYPE_META, digestKind: D.BODY_HASH, digest: ethers.keccak256(bytesTypeBody), target: acceptorTarget(await pass.getAddress()) }),
    action({ kind: K.RECORD, typeId: ITEM_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(ethBody) }), action({ kind: K.RECORD, typeId: ITEM_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(usdcBody) }), action({ kind: K.RECORD, typeId: PAIR_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(pairBody) }),
  ];
  if (controllerGate.enabled) {
    const beforeFixtureSnapshot = await raw("evm_snapshot", [], "controller:beforeFixture:snapshot");
    const beforeFixtureBlock = await fixedBlock("controller:beforeFixture");
    await controllerGate.guard("beforeFixture", { rpcUrl: RPC_URL, block: { number: beforeFixtureBlock.number, hash: beforeFixtureBlock.hash }, snapshot: beforeFixtureSnapshot }, () =>
      publishNative("setup", "types-items-pair", SELF, setupActions, [itemBody, pairTypeBody, quoteTypeBody, bytesTypeBody, ethBody, usdcBody, pairBody], false, "BOOTSTRAP"));
  } else {
    await publishNative("setup", "types-items-pair", SELF, setupActions, [itemBody, pairTypeBody, quoteTypeBody, bytesTypeBody, ethBody, usdcBody, pairBody]);
  }
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

  const has = (key) => SELECTED_CELLS.includes(key);
  const PROFILE_LABEL = "road-c-lab Store-only MUD probe (StoreRead + StoreCore composition), fresh genesis, type-meta /2, acceptance /2; MANIFEST.draft.json; no commitment is treated as authority for another";

  // ---------------------------------------------------------------------------------------------------------------
  // typed-joined: the sealed paid point/list slice (sdk-fixture appendix; matched-cost-scope-review "Bounded C
  // follow-through"). Setup rows A1 (with the ONE /swaps placement), A2 (CAS), B1 (record + HEAD only: a competing
  // content head, never a second placement); the exact post-B1 seal; four paid rows (point/list x A-first/B-first),
  // each the FIRST and ONLY transaction after an evm_revert to that seal at timestamp seal + 1 from the pinned
  // unrelated caller, retained (receipt, PaidObserved log, eth_call replay, block transaction list, abstractResult,
  // persisted) BEFORE the next revert. This runner RECORDS observations (inputEvidenceGrade RPC_OBSERVED); the
  // expectations it passes to the consumer are its own candidate-side mirror of the fixture map. The expectation,
  // arm-input and basis seals are authored and hashed by the independent run controller, never by this script.
  // ---------------------------------------------------------------------------------------------------------------
  const typedIds = () => {
    const salt = id("typed-file"), file = subjectId(A, salt), folder = id("/swaps"), name = id("eth-usdc");
    const a1Payload = quotePayload(2_500_000_000n), a2Payload = quotePayload(2_502_000_000n), b1Payload = quotePayload(2_501_000_000n);
    const a1Body = recordBody([PAIR], a1Payload), a2Body = recordBody([PAIR], a2Payload), b1Body = recordBody([PAIR], b1Payload);
    return { salt, file, folder, name, a1Payload, a2Payload, b1Payload, a1Body, a2Body, b1Body, A1: recordId(QUOTE_T, ethers.keccak256(a1Body)), A2: recordId(QUOTE_T, ethers.keccak256(a2Body)), B1: recordId(QUOTE_T, ethers.keccak256(b1Body)) };
  };
  const a1ActionsOf = (t, placement) => {
    const acts = [action({ kind: K.SUBJECT, subject: t.file, salt: t.salt }), action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(t.a1Body) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: t.file, target: t.A1 })];
    if (placement) acts.push(action({ kind: K.BIND, purpose: PURPOSE.FOLDER, subject: t.folder, role: t.name, target: t.file }));
    acts.push(action({ kind: K.BIND, purpose: PURPOSE.TAG, subject: t.file, role: id("market"), target: TAG_ASSERT }));
    return acts;
  };
  const a1BodiesOf = (t, placement) => (placement ? ["0x", t.a1Body, "0x", "0x", "0x"] : ["0x", t.a1Body, "0x", "0x"]);
  const getRecordRaw = (contract, table, key, layout) => (b) => contract["getRecord(bytes32,bytes32[],bytes32)"](table, key1(key), layout, { blockTag: b });
  const resolution = (r) => ({ status: str(r.status ?? r[0]), target: r.target ?? r[1], revision: str(r.revision ?? r[2]), selectedBy: r.selectedBy ?? r[3], selectedKey: r.selectedKey ?? r[4], admission: str(r.admission ?? r[5]), basis: str(r.basis ?? r[6]), reads: str(r.reads ?? r[7]) });
  const lc = (v) => String(v).toLowerCase();

  async function typedJoinedCell() {
    const cell = "typed-joined";
    const t = typedIds();
    const { file, folder, name } = t;
    const readerAddr = await reader.getAddress(), ledgerAddr = await ledger.getAddress(), consumerAddr = await consumer.getAddress();
    const slice = { cell, standing: "the sealed paid point/list slice: A1/A2/B1 setup rows, the exact post-B1 seal, four paid rows each the first transaction after a revert to that seal from the pinned unrelated caller, with abstractResult rows (RPC_OBSERVED observations, never expected answers)", mismatches: 0 };
    evidence.slices[cell] = slice;
    // ---- the pinned unrelated caller: unrelated to every fixture role (asserted BEFORE setup), funded at a pinned block
    assertUnrelatedCaller(paidCaller.address, { deployer: wallet.address, "AUTHOR_A wallet": authorAAddress, ...Object.fromEntries(Object.entries(evidence.metadata.addresses).map(([k, v]) => [`contract ${k}`, v])) });
    const fundingBlock = await fixedBlock(`${cell}:caller-funding`);
    const balanceWei = BigInt(await raw("eth_getBalance", [paidCaller.address, fundingBlock.number], `${cell}:caller-funding:balance`));
    if (balanceWei === 0n) throw new Error(`${cell}: the pinned paid caller ${paidCaller.address} has no balance at block ${fundingBlock.number}; fund mnemonic index ${PAID_CALLER_INDEX} before the run`);
    slice.caller = { address: paidCaller.address, derivationPath: PAID_CALLER_PATH, index: PAID_CALLER_INDEX, unrelatedTo: ["deployer", "AUTHOR_A wallet", ...Object.keys(evidence.metadata.addresses).map((k) => `contract ${k}`)], funding: { block: fundingBlock.number, blockHash: fundingBlock.hash, balanceWei: balanceWei.toString() } };
    // ---- setup rows (setup cost class; the A1 combined receipt is NOT a marginal placement cost)
    const preA1 = await capture(cell, "pre-A1", { record: t.A1, author: A, subject: file });
    const signedA1 = await publishSigned(cell, "A1-create", a1ActionsOf(t, true), a1BodiesOf(t, true), "A1");
    const a1Event = oneDecoded(signedA1.row, "Ledger", "Published");
    signedA1.row.costClass = "setup"; signedA1.row.placementCost = "ESTIMATE: the single A placement is one of five actions (subject + record + head + FOLDER bind + tag) in this combined receipt and is NOT separable from it; pin the optional paired control typed-joined/a1-without-placement to measure it";
    const postA1 = await capture(cell, "post-A1", { record: t.A1, author: A, subject: file });
    assertRecordTransition(`${cell}:A1`, preA1, postA1, "fresh");
    const preA2 = await capture(cell, "pre-A2", { record: t.A2, author: A, subject: file });
    const signedA2 = await publishSigned(cell, "A2-edit", [action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(t.a2Body) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: t.A2, expectedRevision: 1 })], [t.a2Body, "0x"], "A2");
    const a2Event = oneDecoded(signedA2.row, "Ledger", "Published");
    signedA2.row.costClass = "setup";
    const postA2 = await capture(cell, "post-A2", { record: t.A2, author: A, subject: file });
    assertRecordTransition(`${cell}:A2`, preA2, postA2, "fresh");
    const preB1 = await capture(cell, "pre-B1", { record: t.B1, author: B, subject: file });
    // B1: record + B's own HEAD. NO FOLDER bind: a competing content head only, never a second placement.
    const nativeB1 = await publishNative(cell, "B1-create", B, [action({ kind: K.RECORD, typeId: QUOTE_T, digestKind: D.BODY_HASH, digest: ethers.keccak256(t.b1Body) }), action({ kind: K.BIND, purpose: PURPOSE.HEAD, subject: file, target: t.B1 })], [t.b1Body, "0x"], true, "B1");
    const b1Event = oneDecoded(nativeB1.row, "Ledger", "Published");
    nativeB1.row.costClass = "setup"; nativeB1.row.folderBind = false;
    const postB1 = await capture(cell, "post-B1", { record: t.B1, author: B, subject: file });
    assertRecordTransition(`${cell}:B1`, preB1, postB1, "fresh");
    const b1Calldata = producer.interface.decodeFunctionData("publish", nativeB1.row.exact.transaction.input);
    const b1Purposes = Array.from(b1Calldata[1].actions, (a) => lc(a.purpose ?? a[4]));
    if (b1Calldata[1].actions.length !== 2 || b1Purposes.includes(lc(PURPOSE.FOLDER))) throw new Error(`${cell}: B1 calldata must carry exactly two actions and no FOLDER bind`);
    // ---- the exact post-B1 seal (BEFORE any paid read): snapshot id + block number/hash/timestamp + raw replies at that block
    const snapshot = await raw("evm_snapshot", [], `${cell}:seal:snapshot`);
    const sealBlock = await fixedBlock(`${cell}:seal`);
    const seal = { snapshot, number: Number(sealBlock.number), numberHex: sealBlock.number, hash: sealBlock.hash, parentHash: sealBlock.header.parentHash, timestamp: Number(sealBlock.header.timestamp) };
    await controllerGate.invoke("afterB1", { rpcUrl: RPC_URL, block: { number: seal.numberHex, hash: seal.hash }, snapshot });
    const basis = (await observeAt(`${cell}:seal:high-water`, sealBlock, (b) => ledger.highWater({ blockTag: b }))).toString();
    const hw0 = BigInt(baselineProof.highWater);
    if (BigInt(basis) !== hw0 + 9n) throw new Error(`${cell}: post-B1 admission frontier ${basis} != baseline ${hw0} + 9`);
    const generation = (await observeAt(`${cell}:seal:index-generation`, sealBlock, (b) => index.generation({ blockTag: b }))).toString();
    const rulesEpoch = (await observeAt(`${cell}:seal:rules-epoch`, sealBlock, (b) => ledger.rulesEpoch({ blockTag: b }))).toString();
    const core = await observeAt(`${cell}:seal:code-commitment`, sealBlock, (b) => ledger.coreCodeCommitment({ blockTag: b }));
    const realmId = await observeAt(`${cell}:seal:realm-id`, sealBlock, (b) => ledger.realmId({ blockTag: b }));
    const realmOrigin = await observeAt(`${cell}:seal:realm-origin`, sealBlock, (b) => ledger.realmOrigin({ blockTag: b }));
    const sealBasis = { admissionFrontier: basis, indexGeneration: generation, rulesEpoch, coreCodeCommitment: core, realmId, realmOrigin };
    slice.seal = { snapshot, block: seal.number, blockHex: seal.numberHex, blockHash: seal.hash, parentHash: seal.parentHash, timestamp: seal.timestamp, observationBasis: sealBasis, standing: "the exact post-B1 basis: evm_snapshot id (single-use; re-sealed after every revert), block number/hash/timestamp from the retained header, admission frontier / index generation / rules epoch / Core code commitment / Realm id from raw replies at that block" };
    // A placement provenance at the seal (joined here for the point rows, which do not look the directory up)
    const plA = resolution(await observeAt(`${cell}:seal:placement-resolve-a-first`, sealBlock, (b) => reader.resolveAt(lens(A, B), PURPOSE.FOLDER, folder, name, basis, { blockTag: b })));
    const plB = resolution(await observeAt(`${cell}:seal:placement-resolve-b-first`, sealBlock, (b) => reader.resolveAt(lens(B, A), PURPOSE.FOLDER, folder, name, basis, { blockTag: b })));
    if (plA.status !== "1" || lc(plA.target) !== lc(file) || lc(plA.selectedBy) !== lc(A) || plA.revision !== "1") throw new Error(`${cell}: the A placement must be FOUND under LENS_A_FIRST as A's revision 1 -> FILE`);
    if (plB.status !== "1" || lc(plB.target) !== lc(plA.target) || lc(plB.selectedBy) !== lc(plA.selectedBy) || plB.revision !== plA.revision || plB.admission !== plA.admission || lc(plB.selectedKey) !== lc(plA.selectedKey)) throw new Error(`${cell}: LENS_B_FIRST must fall through to the identical A placement`);
    const aPlacementKey = bindingKey(A, PURPOSE.FOLDER, folder, name);
    if (lc(plA.selectedKey) !== lc(aPlacementKey)) throw new Error(`${cell}: the placement binding key is not A's (FOLDER, /swaps, eth-usdc)`);
    const plAdm = decodeAdmissionStatic((await observeAt(`${cell}:seal:placement-admission`, sealBlock, getRecordRaw(ledger, TABLE.ADMISSIONS, ethers.toBeHex(BigInt(plA.admission), 32), LAYOUT.ADMISSIONS)))[0]);
    if (plAdm.kind !== 4n || lc(plAdm.purpose) !== lc(PURPOSE.FOLDER) || lc(plAdm.subject) !== lc(folder) || lc(plAdm.role) !== lc(name) || lc(plAdm.target) !== lc(file)) throw new Error(`${cell}: the placement admission is not a FOLDER bind of /swaps/eth-usdc -> FILE`);
    const plEv = decodeEvidenceStatic((await observeAt(`${cell}:seal:placement-evidence`, sealBlock, getRecordRaw(ledger, TABLE.EVIDENCE, plAdm.publicationId, LAYOUT.EVIDENCE)))[0]);
    if (lc(plEv.author) !== lc(A) || plEv.proofKind !== 2n || lc(plAdm.publicationId) !== lc(a1Event.publicationId) || BigInt(plA.admission) < plEv.firstAdmission || BigInt(plA.admission) >= plEv.firstAdmission + plEv.leafCount || plEv.importOf !== ZERO || plEv.sourceGrade !== 0n) throw new Error(`${cell}: the placement was not admitted by A1 (AUTHOR_A, EOA-signed, native at source)`);
    const sk = scopeKey(PURPOSE.FOLDER, folder);
    const scopeBytes = BigInt(await observeAt(`${cell}:seal:scope-length`, sealBlock, (b) => index["getDynamicFieldLength(bytes32,bytes32[],uint8)"](TABLE.SCOPES, key1(sk), 0, { blockTag: b })));
    if (scopeBytes !== 96n) throw new Error(`${cell}: the /swaps scope must hold exactly one (author, name, bindingKey) triple, got ${scopeBytes} bytes`);
    const scopeSlice = await observeAt(`${cell}:seal:scope-entries`, sealBlock, (b) => index["getDynamicFieldSlice(bytes32,bytes32[],uint8,uint256,uint256)"](TABLE.SCOPES, key1(sk), 0, 0, 96, { blockTag: b }));
    const triple = [0, 1, 2].map((i) => `0x${scopeSlice.slice(2 + i * 64, 2 + (i + 1) * 64)}`);
    if (lc(triple[0]) !== lc(A) || lc(triple[1]) !== lc(name) || lc(triple[2]) !== lc(aPlacementKey)) throw new Error(`${cell}: the one scope entry is not (A, eth-usdc, A's binding key)`);
    const placementAtSeal = { status: plA.status, target: plA.target, revision: plA.revision, author: plA.selectedBy, admission: plA.admission, bindingKey: plA.selectedKey, publicationId: plAdm.publicationId, admissionKind: plAdm.kind.toString(), proofKind: plEv.proofKind.toString(), v: plEv.v.toString(), firstAdmission: plEv.firstAdmission.toString(), leafCount: plEv.leafCount.toString(), scopeEntries: "1", scopeTriple: triple, byLens: { LENS_A_FIRST: plA, LENS_B_FIRST: plB } };
    slice.placementAtSeal = { standing: "raw replies at the seal block: LensReader.resolveAt(FOLDER, /swaps, eth-usdc, basis) under LENS_A_FIRST and LENS_B_FIRST (identical placement) + the Admissions and Evidence rows (public getRecord) + the Scopes entry; sourceStep A1 = the retained A1-create Published publicationId; NOT charged to any paid row", sourceStep: "A1", actor: "AUTHOR_A", evidenceCategory: evidenceCategoryOf(plEv.proofKind, true), basis, observed: placementAtSeal };
    // no B placement: B's binding row, B's binding history, the B-only lens and the single scope entry are all absent/empty
    const bKey = bindingKey(B, PURPOSE.FOLDER, folder, name);
    const bBinding = decodeBindingStatic((await observeAt(`${cell}:seal:no-b-placement-binding`, sealBlock, getRecordRaw(ledger, TABLE.BINDINGS, bKey, LAYOUT.BINDINGS)))[0]);
    const bHistory = BigInt(await observeAt(`${cell}:seal:no-b-placement-history`, sealBlock, (b) => index["getDynamicFieldLength(bytes32,bytes32[],uint8)"](TABLE.BINDING_HISTORY, key1(bKey), 0, { blockTag: b })));
    const bOnly = resolution(await observeAt(`${cell}:seal:no-b-placement-resolve`, sealBlock, (b) => reader.resolveAt({ principals: [B], mode: 0 }, PURPOSE.FOLDER, folder, name, basis, { blockTag: b })));
    if (bBinding.revision !== 0n || bBinding.admission !== 0n || bBinding.target !== ZERO) throw new Error(`${cell}: B has a /swaps/eth-usdc binding`);
    if (bHistory !== 0n) throw new Error(`${cell}: B's /swaps/eth-usdc binding history is not empty`);
    if (bOnly.status !== "2") throw new Error(`${cell}: the B-only lens must prove the placement ABSENT (status 2), got ${bOnly.status}`);
    slice.noBPlacement = { standing: "raw replies at the seal block: Bindings row of B's (FOLDER, /swaps, eth-usdc) key revision 0, BindingHistory length 0, LensReader.resolveAt([B]) ABSENT_PROVEN, the one Scopes triple is A's; B1 calldata carries two actions and no FOLDER purpose", bBindingKey: bKey, bBinding: { target: bBinding.target, revision: bBinding.revision.toString(), admission: bBinding.admission.toString() }, bHistoryLength: bHistory.toString(), bOnlyLensStatus: bOnly.status, b1Actions: b1Calldata[1].actions.length, b1Purposes };
    persist(`${cell}:seal`);
    // ---- the four paid rows: each the first and only transaction after a revert to the seal, from the pinned caller
    const ordering = [{ kind: "seal", block: seal.number, hash: seal.hash, timestamp: seal.timestamp }];
    async function restoreSeal(label) {
      const consumed = seal.snapshot;
      const reverted = await raw("evm_revert", [consumed], `${label}:revert`);
      if (reverted !== true) throw new Error(`${label}: evm_revert(${consumed}) failed`);
      seal.snapshot = await raw("evm_snapshot", [], `${label}:re-seal`); // Anvil consumes a snapshot id on revert
      const nextTimestamp = seal.timestamp + 1; // matched next-block TIME control: every paid row executes at seal + 1
      await raw("evm_setNextBlockTimestamp", [nextTimestamp], `${label}:next-timestamp`);
      const head = await fixedBlock(`${label}:after-revert`);
      if (Number(head.number) !== seal.number || head.hash !== seal.hash) throw new Error(`${label}: after the revert the head is ${head.number} ${head.hash}, not the seal ${seal.numberHex} ${seal.hash}`);
      const nonceLatest = await raw("eth_getTransactionCount", [paidCaller.address, "latest"], `${label}:caller-nonce-latest`);
      const noncePending = await raw("eth_getTransactionCount", [paidCaller.address, "pending"], `${label}:caller-nonce-pending`);
      if (nonceLatest !== noncePending) throw new Error(`${label}: the pending pool is not empty after the revert`);
      const txpool = await raw("txpool_status", [], `${label}:txpool-status`); // retained pool proof, beside the caller-nonce check
      if (!txpool || txpool.pending === undefined || txpool.queued === undefined) throw new Error(`${label}: txpool_status returned no pending/queued counts`);
      const pool = { pending: Number(BigInt(txpool.pending)), queued: Number(BigInt(txpool.queued)) };
      if (pool.pending !== 0 || pool.queued !== 0) throw new Error(`${label}: the transaction pool is not empty after the revert (pending ${pool.pending}, queued ${pool.queued})`);
      ordering.push({ kind: "revert", block: Number(head.number), hash: head.hash, nextTimestamp, snapshot: consumed, resealed: seal.snapshot, pool });
      evidence.resets.push({ label, kind: "seal-restore", reverted, snapshot: consumed, newSnapshot: seal.snapshot, head: head.number, hash: head.hash, nextTimestamp, callerNonce: nonceLatest, txpool, pool });
    }
    const noteCommitment = id("reference quote");
    // candidate-side fixture mirror (labelled): the expectations passed to the consumer; the sealed run supplies the controller's vectors
    const expectA = { subject: file, expectedHead: t.A2, selectedRevision: 2, selectedAuthor: A, selectedProofKind: 2, quoteType: QUOTE_T, pairType: PAIR_T, itemType: ITEM_T, pairId: PAIR, itemA: ITEM_ETH, itemB: ITEM_USDC, mantissa: 2_502_000_000n, scale: 6, observedAt: 1_800_000_000n, noteCommitment, basisAdmission: basis };
    const expectB = { ...expectA, expectedHead: t.B1, selectedRevision: 1, selectedAuthor: B, selectedProofKind: 1, mantissa: 2_501_000_000n };
    const placementExpect = { folder, name, actor: A, proofKind: 2, publicationId: a1Event.publicationId, revision: 1, budget: 10 };
    const commonSelection = { basisAdmission: basis, indexGeneration: generation, rulesEpoch, coreCodeCommitment: core, realmId, subject: file, selectedSourceGrade: 0, pairId: PAIR, itemA: ITEM_ETH, itemB: ITEM_USDC, scale: 6, observedAt: 1_800_000_000n, note: noteCommitment };
    const selA = { ...commonSelection, selectedHead: t.A2, selectedRevision: 2, selectedAdmission: hw0 + 7n, selectedBindingKey: bindingKey(A, PURPOSE.HEAD, file), selectedPublication: a2Event.publicationId, selectedAuthor: A, selectedProofKind: 2, quoteFirstAdmission: hw0 + 6n, mantissa: 2_502_000_000n };
    const selB = { ...commonSelection, selectedHead: t.B1, selectedRevision: 1, selectedAdmission: hw0 + 9n, selectedBindingKey: bindingKey(B, PURPOSE.HEAD, file), selectedPublication: b1Event.publicationId, selectedAuthor: B, selectedProofKind: 1, quoteFirstAdmission: hw0 + 8n, mantissa: 2_501_000_000n };
    const placementNone = Object.fromEntries(PLACEMENT_FIELDS.map((k) => [k, k === "ended" ? false : /^(folder|name|target|actor|bindingKey|publicationId)$/.test(k) ? ZERO : 0]));
    const placementOne = { folder, name, target: file, actor: A, revision: 1, admission: hw0 + 4n, bindingKey: aPlacementKey, publicationId: a1Event.publicationId, proofKind: 2, sourceGrade: 0, basisAdmission: basis, pageStatus: 1, rawTotal: 1, scanned: 1, selected: 1, endPosition: 1, ended: true, coverageStatus: 1, coverageThrough: basis }; // hydrated: a physical witness, not pinned
    const headLabels = { [lc(t.A1)]: ["QUOTE_A1", "A1"], [lc(t.A2)]: ["QUOTE_A2", "A2"], [lc(t.B1)]: ["QUOTE_B1", "B1"] };
    const authorLabels = { [lc(A)]: ["AUTHOR_A", "EOA principal (mnemonic index 1)"], [lc(B)]: ["AUTHOR_B", "contract principal (Producer)"] };
    const publicationLabels = { [lc(a1Event.publicationId)]: "A1", [lc(a2Event.publicationId)]: "A2", [lc(b1Event.publicationId)]: "B1" }; // sourceStep labels are derived from the observed publicationId, never assumed
    slice.fixtureMirror = { standing: "candidate-side mirror of the fixture map (this runner's inputs to the consumer), never the independent expectation manifest", ids: { file, folder, name, A1: t.A1, A2: t.A2, B1: t.B1, PAIR, ITEM_ETH, ITEM_USDC, QUOTE_T, PAIR_T, ITEM_T, aPlacementKey, aHeadKey: bindingKey(A, PURPOSE.HEAD, file), bHeadKey: bindingKey(B, PURPOSE.HEAD, file) }, bodies: { a1Body: t.a1Body, a2Body: t.a2Body, b1Body: t.b1Body }, publications: { A1: a1Event.publicationId, A2: a2Event.publicationId, B1: b1Event.publicationId }, expect: serialize({ expectA, expectB, placementExpect }), expectedObservations: serialize({ selA, selB, placementOne, placementNone }) };
    const ab = lens(A, B), ba = lens(B, A);
    const paidRows = [
      { key: "paid-point-A", manifestRow: "POINT_A_FIRST", operation: "PAID_POINT", lens: "LENS_A_FIRST", lensObj: ab, fn: "paidPoint", args: [readerAddr, ledgerAddr, ab, expectA], selection: { ...selA, lensHash: lensHashOf(ab) }, placement: placementNone },
      { key: "paid-list-A", manifestRow: "LIST_A_FIRST", operation: "PAID_LIST", lens: "LENS_A_FIRST", lensObj: ab, fn: "paidList", args: [readerAddr, ledgerAddr, ab, expectA, placementExpect], selection: { ...selA, lensHash: lensHashOf(ab) }, placement: placementOne },
      { key: "paid-point-B", manifestRow: "POINT_B_FIRST", operation: "PAID_POINT", lens: "LENS_B_FIRST", lensObj: ba, fn: "paidPoint", args: [readerAddr, ledgerAddr, ba, expectB], selection: { ...selB, lensHash: lensHashOf(ba) }, placement: placementNone },
      { key: "paid-list-B", manifestRow: "LIST_B_FIRST", operation: "PAID_LIST", lens: "LENS_B_FIRST", lensObj: ba, fn: "paidList", args: [readerAddr, ledgerAddr, ba, expectB, placementExpect], selection: { ...selB, lensHash: lensHashOf(ba) }, placement: placementOne },
    ];
    const consumerArtifact = evidence.artifacts.find((row) => row.operation === "deploy:MeasurementConsumer");
    const ledgerArtifact = evidence.artifacts.find((row) => row.operation === "deploy:Ledger");
    const rows = {};
    for (const pr of paidRows) {
      const label = `${cell}:${pr.key}`;
      await restoreSeal(label);
      const localCalldata = consumer.interface.encodeFunctionData(pr.fn, pr.args);
      const paidPin = controllerGate.enabled ? controllerGate.input.paid.find((candidate) => candidate.row === pr.manifestRow) : null;
      if (paidPin) assertManifestCall(pr.manifestRow, { caller: paidCaller.address, target: consumerAddr, calldata: localCalldata }, paidPin);
      const row = await send(cell, pr.key, () => paidPin ? paidCaller.sendTransaction({ to: paidPin.target, data: paidPin.calldata }) : consumer.connect(paidCaller)[pr.fn](...pr.args));
      const receipt = row.exact.receipt;
      const block = await raw("eth_getBlockByNumber", [receipt.blockNumber, false], `${label}:block-transactions`);
      if (!block || lc(block.hash) !== lc(receipt.blockHash)) throw new Error(`${label}: eth_getBlockByNumber(${receipt.blockNumber}) does not return the receipt's block`);
      const executed = { number: Number(block.number), hash: block.hash, parentHash: block.parentHash, timestamp: Number(block.timestamp), txIndex: Number(receipt.transactionIndex), txCount: block.transactions.length, txHashes: [...block.transactions], onlyTx: block.transactions.length === 1 && lc(block.transactions[0]) === lc(row.exact.transaction.hash) };
      ordering.push({ kind: "tx", label: pr.key, block: executed.number, parentHash: executed.parentHash, timestamp: executed.timestamp, txIndex: executed.txIndex, txCount: executed.txCount, onlyTx: executed.onlyTx });
      const check = await paidObservationCheck(cell, pr, row, consumerAddr);
      if (paidPin) {
        try {
          assertPaidManifestOutcome(pr.manifestRow, { returnData: check.replayObs.returnData, logs: receipt.logs }, paidPin);
          row.independentManifestCheck = { inputsSha256: controllerGate.report.inputsSha256, row: pr.manifestRow, match: true };
        } catch (error) {
          row.independentManifestCheck = { inputsSha256: controllerGate.report.inputsSha256, row: pr.manifestRow, match: false, error: error.message };
          persist(`${label}:independent-manifest-mismatch`);
          throw error;
        }
      }
      if (!check.match) slice.mismatches++;
      const evidenceFor = {
        operation: pr.operation, lens: pr.lens, lensArr: pr.lensObj.principals, label, budget: placementExpect.budget,
        row: { operation: pr.key, hash: row.exact.transaction.hash, block: executed.number, blockHash: receipt.blockHash, status: row.status, gas: row.gasUsed },
        executed, seal: { number: seal.number, hash: seal.hash, timestamp: seal.timestamp, snapshot: seal.snapshot }, sealBasis,
        chainId: evidence.metadata.chainId, addrs: { ledger: ledgerAddr, reader: readerAddr, index: await index.getAddress(), importLib: await importLib.getAddress(), consumer: consumerAddr },
        consumerCodehash: consumerArtifact ? consumerArtifact.runtimeHash : "UNKNOWN", ledgerCodehash: ledgerArtifact ? ledgerArtifact.runtimeHash : "UNKNOWN",
        coordinates: { subject: file, folder, name, placementBindingKey: aPlacementKey }, placementAtSeal, types: { QUOTE_T, PAIR_T, ITEM_T }, headLabels, authorLabels, publicationLabels,
        caller: { address: paidCaller.address, derivationPath: PAID_CALLER_PATH, index: PAID_CALLER_INDEX }, profile: PROFILE_LABEL,
      };
      row.paidRow = { operation: pr.operation, lens: pr.lens, caller: paidCaller.address, consumer: `MeasurementConsumer.${pr.fn} (stateless; one PaidObserved log with the concrete observations: the paid rows' instrumentation overhead, disclosed, never subtracted)`, armInputs: { standing: "this runner's candidate-side mirror of the fixture map, including the expected head record ids passed as Expect.expectedHead; the sealed run supplies the independently authored vectors (appendix pin 4)", expect: serialize(pr.args[3]), placementExpect: pr.args.length > 4 ? serialize(pr.args[4]) : null } };
      row.executed = executed;
      row.paidObservedCheck = check;
      row.abstractResult = deriveAbstractResult({ check, replay: check.replayObs, evidenceFor }); // pure; UNKNOWN throughout on a failed self-check
      rows[pr.key] = row;
      persist(label);
      ordering.push({ kind: "retained", label: pr.key });
    }
    const orderedRows = checkPaidRowOrdering(ordering);
    slice.ordering = { standing: "each paid row is the first and ONLY transaction (index 0; block transaction list retained) after an evm_revert whose observed head is the seal, mined at seal + 1 on the sealed hash at the deterministic timestamp seal + 1 (evm_setNextBlockTimestamp after every revert), and retained (checked, abstractResult built, persisted) before the next revert; asserted by checkPaidRowOrdering", events: ordering, rows: orderedRows, timestamps: orderedRows.map((r) => r.timestamp), timestampsEqual: new Set(orderedRows.map((r) => r.timestamp)).size === 1, expectedTimestamp: seal.timestamp + 1 };
    const selOf = (key) => (rows[key].abstractResult.rawEvidence.selfCheck.match ? rows[key].abstractResult.rawEvidence.paidObservedLog.selection : null);
    slice.agreement = { standing: "point and list under the same lens observe the identical Selection (compared from the PaidObserved logs; lensHash excluded); the placement provenance is identical across lenses", aFirst: checkAgreement(selOf("paid-point-A"), selOf("paid-list-A")), bFirst: checkAgreement(selOf("paid-point-B"), selOf("paid-list-B")) };
    slice.costDisclosure = {
      standing: "costs are reported in separate classes; this runner never subtracts, amortizes or normalizes them",
      classes: {
        deployment: "artifacts[] rows deploy:* (gas in exact.receipt.gasUsed with runtime/initcode bytes and hashes): production prerequisites (ImportLib, IndexModule, Ledger, setup:attach-index, LensReader, PassAcceptor, QuoteAcceptorV1) apart from the measurement consumer (MeasurementConsumer) and the fixture producer (Producer); ImportLib is linked but never called by these rows",
        code: "artifacts[].runtimeBytes / initcodeBytes / runtimeHash per contract; MeasurementConsumer is measurement instrumentation, not a production component",
        setup: "operations rows setup:types-items-pair and typed-joined A1-create / A2-edit / B1-create (fixture prerequisites and the three author steps; costClass setup)",
        placementOnceOnly: { standing: "ESTIMATE unless the paired control is pinned: the single A placement is one of five actions inside the A1-create combined receipt (subject + record + head + FOLDER bind + tag) and is not separable from that receipt alone", pairedControl: "cell typed-joined/a1-without-placement (optional, non-default; selected only by its exact --cells name): the identical A1 batch minus the FOLDER bind from the same post-setup snapshot; when the coordinator pins it the two receipts sit side by side and any difference is the coordinator's computation" },
        storage: "UNKNOWN: no slot diff or storage tracing in this runner; the capture rows retain decoded row transitions only",
        paid: "operations rows typed-joined paid-point-A / paid-list-A / paid-point-B / paid-list-B: receipt gas of one transaction each from the pinned unrelated caller (stateless consumer: no SSTORE; one PaidObserved log carrying 43 observation words plus ABI offsets, ESTIMATED ~12-14k gas of instrumentation, disclosed and never subtracted)",
        matchedFailureControl: "operation typed-joined exact-retry-A1 (AlreadyAdmitted: block-pinned static revert selector + separately mined status-0 receipt) retained in this cell; the failed-mandatory-index rollback is covered by the Forge suite only (poison lever zero in the measured deployment)",
      },
    };
    const alreadyAdmitted = ledger.interface.getError("AlreadyAdmitted").selector;
    await minedFailure(cell, "exact-retry-A1", ledger, "publishSigned", [signedA1.value, a1BodiesOf(t, true), signedA1.sig], alreadyAdmitted, "AlreadyAdmitted");
    persist(`${cell}:complete`);
    if (slice.mismatches) throw new Error(`${cell}: ${slice.mismatches} paid row(s) failed the candidate self-check; their abstractResult rows are UNKNOWN and retained`);
  }

  // The PaidObserved log of a paid row (parsed from the raw receipt; parse errors retained) and an eth_call replay of the
  // same calldata FROM the same caller at the receipt block. The pure verdict (paidObservationMatch) requires the row's
  // expected kind, a commitment RECOMPUTED as keccak256(abi.encode(kind, Selection, Placement)) from the decoded log fields
  // equal to the logged one, log == replay, and both equal to this runner's candidate-side expectation field by field.
  const PAID_KINDS = { PAID_POINT: id("road-c/measurement/paid-point/2"), PAID_LIST: id("road-c/measurement/paid-list/2") }; // MeasurementConsumer.KIND_PAID_POINT / KIND_PAID_LIST
  const paidObservedEvent = consumer.interface.getEvent("PaidObserved");
  if (!paidObservedEvent || paidObservedEvent.inputs.length !== 4) throw new Error("MeasurementConsumer artifact has no PaidObserved(kind, commitment, selection, placement) event");
  const coerceForAbi = (param, value) => (param.baseType === "tuple" ? param.components.map((c) => coerceForAbi(c, value[c.name])) : param.baseType === "bool" ? value === true || value === "true" : value);
  const recomputeCommitment = (kind, selection, placement) => ethers.keccak256(coder.encode(["bytes32", paidObservedEvent.inputs[2], paidObservedEvent.inputs[3]], [kind, coerceForAbi(paidObservedEvent.inputs[2], selection), coerceForAbi(paidObservedEvent.inputs[3], placement)]));
  async function paidObservationCheck(cell, pr, row, consumerAddr) {
    const label = `${cell}:${pr.key}`;
    const ifc = consumer.interface;
    const parseErrors = [];
    const parsed = (row.exact.receipt.logs ?? []).filter((l) => lc(l.address) === lc(consumerAddr)).map((l) => { try { return ifc.parseLog({ topics: l.topics, data: l.data }); } catch (error) { parseErrors.push(String(error?.message ?? error)); return null; } }).filter((p) => p && p.name === "PaidObserved");
    const fromLog = parsed.length === 1 ? { kind: parsed[0].args.kind, commitment: parsed[0].args.commitment, selection: pickFields(parsed[0].args.selection, SELECTION_FIELDS), placement: pickFields(parsed[0].args.placement, PLACEMENT_FIELDS) } : null;
    const replayObs = { rpcId: null, from: paidCaller.address, blockTag: row.exact.receipt.blockNumber, returnData: null, error: null, stage: `${label}:replay` };
    try {
      replayObs.returnData = await raw("eth_call", [{ from: paidCaller.address, to: row.exact.transaction.to, data: row.exact.transaction.input }, row.exact.receipt.blockNumber], `${label}:replay`);
    } catch (error) {
      replayObs.error = revertData(error) ?? error.message;
    }
    const last = rpc[rpc.length - 1];
    if (last && last.source === `${label}:replay`) replayObs.rpcId = last.request?.id ?? null;
    let fromReplay;
    try {
      const d = ifc.decodeFunctionResult(pr.fn, replayObs.returnData);
      fromReplay = { commitment: d[0], selection: pickFields(d[1], SELECTION_FIELDS), placement: d.length > 2 ? pickFields(d[2], PLACEMENT_FIELDS) : null };
    } catch (error) {
      fromReplay = { error: String(error?.message ?? error) };
    }
    const verdict = paidObservationMatch({ logCount: parsed.length, fromLog, fromReplay, operation: pr.operation, expectedKind: PAID_KINDS[pr.operation], expectedSelection: pr.selection, expectedPlacement: pr.placement, recompute: recomputeCommitment });
    return { label: `${label}/paid-observed`, kind: "paid-observed", standing: "candidate self-check: expected kind, recomputed commitment == logged commitment, log == replay, both == this runner's candidate-side expectation; never the independent oracle", block: row.exact.receipt.blockNumber, fromLog, fromReplay, replayObs, parseErrors, ...verdict };
  }

  // OPTIONAL paired control (non-default; selected only by its exact --cells key): the identical A1 batch minus the FOLDER
  // bind from the same post-setup snapshot (the same pre-A1 state as typed-joined), so the once-only placement cost can be a
  // paired measurement instead of an estimate. Reported beside typed-joined A1-create; nothing is subtracted here.
  async function a1WithoutPlacementCell() {
    const cell = "typed-joined/a1-without-placement";
    const t = typedIds();
    const { file, folder, name } = t;
    const pre = await capture(cell, "pre-A1-minus-placement", { record: t.A1, author: A, subject: file });
    const signed = await publishSigned(cell, "A1-minus-placement", a1ActionsOf(t, false), a1BodiesOf(t, false));
    signed.row.costClass = "paired control"; signed.row.pairing = "pair with typed-joined A1-create: same post-setup snapshot (pre-A1 state), same author A, nonce 1 and bodies; the only action difference is the absent FOLDER bind (signature calldata bytes differ per run: ESTIMATED tens of gas of noise)";
    const post = await capture(cell, "post-A1-minus-placement", { record: t.A1, author: A, subject: file });
    assertRecordTransition(`${cell}:A1-minus-placement`, pre, post, "fresh");
    const blk = await fixedBlock(`${cell}:no-placement`);
    const none = resolution(await observeAt(`${cell}:no-placement:resolve`, blk, (b) => reader.resolve(lens(A, B), PURPOSE.FOLDER, folder, name, { blockTag: b })));
    const aBinding = decodeBindingStatic((await observeAt(`${cell}:no-placement:binding`, blk, getRecordRaw(ledger, TABLE.BINDINGS, bindingKey(A, PURPOSE.FOLDER, folder, name), LAYOUT.BINDINGS)))[0]);
    const head = resolution(await observeAt(`${cell}:no-placement:head`, blk, (b) => reader.resolve(lens(A, B), PURPOSE.HEAD, file, ZERO, { blockTag: b })));
    if (none.status !== "2" || aBinding.revision !== 0n) throw new Error(`${cell}: no /swaps/eth-usdc placement may exist`);
    if (head.status !== "1" || lc(head.target) !== lc(t.A1)) throw new Error(`${cell}: the A head must exist`);
    evidence.slices[cell] = { cell, standing: "OPTIONAL paired control of the once-only placement cost: the A1 batch WITHOUT the FOLDER bind from the same post-setup snapshot as typed-joined (same pre-A1 state); the coordinator pins it explicitly; this runner subtracts nothing", pairing: signed.row.pairing, placementAbsent: { lensStatus: none.status, aBindingRevision: aBinding.revision.toString(), headStatus: head.status, headTarget: head.target, block: blk.number, blockHash: blk.hash } };
    persist(`${cell}:complete`);
  }

  if (has("typed-joined")) {
    await typedJoinedCell();
    await reset("after-typed");
  }
  if (has("typed-joined/a1-without-placement")) {
    await a1WithoutPlacementCell();
    await reset("after-a1-without-placement");
  }

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
    const point = commitmentEvent(await send(cell, "paid-point", async () => consumer.paidPointFramed(await reader.getAddress(), await ledger.getAddress(), l, PURPOSE.HEAD, file, ZERO, exp)), "PointCommitted", file, editId, author);
    const list = commitmentEvent(await send(cell, "paid-list", async () => consumer.paidListFramed(await reader.getAddress(), await ledger.getAddress(), l, folder, name, file, 10, exp)), "ListCommitted", file, editId, author);
    if (point.basis !== list.basis) throw new Error(`${cell} point/list basis mismatch`);
  }
  if (has("c32-native-producer-framed")) {
    await c32Cell("c32-native-producer-framed", B, false);
    await reset("after-c32-native");
  }
  if (has("c32-signed-framed")) {
    await c32Cell("c32-signed-framed", A, true);
    await reset("after-c32-signed");
  }

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
  if (has("record-fresh-isolated")) {
    await freshReuseCell("record-fresh-isolated", false);
    await reset("after-record-fresh");
  }
  if (has("record-reused-isolated")) await freshReuseCell("record-reused-isolated", true);
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
