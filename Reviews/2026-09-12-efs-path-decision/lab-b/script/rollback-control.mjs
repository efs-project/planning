#!/usr/bin/env node
// Disposable B matched-rollback supplement. It never launches a chain or compiles.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const {
  AbiCoder, HDNodeWallet, Interface, concat, getAddress, getCreateAddress, hexlify, keccak256,
  toUtf8Bytes, version: ethersVersion, zeroPadValue,
} = require(process.env.EFS_ETHERS_PATH ?? 'ethers');

const DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';
const DEADLINE = 2_000_000_000n;
const GENESIS_TIMESTAMP = 1_800_000_000n;
const CHAIN_ID = 31_337n;
const DEPLOY_GAS = 15_000_000n;
const SETUP_GAS = 8_000_000n;
const ATTEMPT_GAS = 3_000_000n;
const RPC_TIMEOUT_MS = 30_000;
const MAX_RAW_ENVELOPES = 2_048;
const MAX_RAW_BYTES = 8 * 1024 * 1024;
const ZERO = zeroPadValue('0x00', 32);
const ZERO_ADDRESS = ZERO.slice(0, 42);
const coder = AbiCoder.defaultAbiCoder();
const dom = (value) => keccak256(toUtf8Bytes(value));
const REALM = dom('lab/realm/1');
const SHAPE = { ITEM: dom('lab/type/item/1'), PAIR: dom('lab/type/pair/1'), QUOTE_J: dom('lab/type/quote-joined/1') };
const PURPOSE = { HEAD: dom('efs2/purpose/head/1'), FOLDER: dom('efs2/purpose/folder/1'), TAG: dom('efs2/purpose/tag/1') };
const FILE_SALT = dom('joined/FILE_QUOTE');
const SWAPS = dom('/swaps');
const ETH_USDC = dom('eth-usdc');
const MARKET = dom('market');
const NOTE_BYTES = hexlify(toUtf8Bytes('reference quote'));
const NOTE_COMMITMENT = keccak256(NOTE_BYTES);
const ACTION_TYPE = 'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
const INTENT_TYPES = {
  PublicationIntent: [
    ['realmId', 'bytes32'], ['coreCodeCommitment', 'bytes32'], ['author', 'address'], ['nonce', 'uint64'],
    ['deadline', 'uint64'], ['acceptanceProfile', 'bytes32'], ['indexObligations', 'bytes32'], ['actionsHash', 'bytes32'],
  ].map(([name, type]) => ({ name, type })),
};
const ARMS = [
  { name: 'scale7', deployerIndex: 2, authorNonce: 0, scale: 7, poison: false, kind: 'refusal', preBlock: 11, postBlock: 12 },
  { name: 'lateIndex', deployerIndex: 3, authorNonce: 1, scale: 6, poison: true, kind: 'refusal', preBlock: 23, postBlock: 24 },
  { name: 'calibration', deployerIndex: 4, authorNonce: 2, scale: 6, poison: false, kind: 'calibration', preBlock: 35, postBlock: 36 },
];
const ARTIFACT_PATHS = {
  registry: ['TypeRegistry.sol', 'TypeRegistry.json'], quoteAcceptor: ['LabAcceptors.sol', 'QuoteAcceptor.json'],
  pairRule: ['LabAcceptors.sol', 'MinBodyAcceptor.json'], ledger: ['Ledger.sol', 'Ledger.json'],
  index: ['MatchedRollback.t.sol', 'LateRefusingIndexModule.json'], prefixActor: ['LabHarness.sol', 'Actor.json'],
};
const FAMILIES = ['FAMILY_SCOPE', 'FAMILY_HISTORY', 'FAMILY_BACKLINK', 'FAMILY_BY_TYPE', 'FAMILY_BY_AUTHOR'];
const FAMILY_IDS = {
  FAMILY_SCOPE: dom('efs2/family/scope/1'), FAMILY_HISTORY: dom('efs2/family/history/1'),
  FAMILY_BACKLINK: dom('efs2/family/backlink/1'), FAMILY_BY_TYPE: dom('efs2/family/by-type/1'),
  FAMILY_BY_AUTHOR: dom('efs2/family/by-author/1'),
};

const qty = (value) => `0x${BigInt(value).toString(16)}`;
const decimal = (value) => BigInt(value).toString();
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalizeHex = (value, label) => {
  assert.equal(typeof value, 'string', `${label}: expected hex string`);
  assert.match(value, /^0x[0-9a-fA-F]*$/, `${label}: malformed hex`);
  assert.equal(value.length % 2, 0, `${label}: odd-length hex`);
  return value.toLowerCase();
};
const normalize = (value) => {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value)) return value.toLowerCase();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  return value;
};
const exact = (label, observed, expected) => assert.deepEqual(normalize(observed), normalize(expected), label);

export function assertAttemptLink(staticEnvelope, minedTransaction) {
  const call = staticEnvelope?.request?.method === 'eth_call' ? staticEnvelope.request.params?.[0] : null;
  assert(call && minedTransaction, 'attempt link: missing static envelope or mined transaction');
  assert.equal(getAddress(call.from), getAddress(minedTransaction.from), 'static/mined sender mismatch');
  assert.equal(getAddress(call.to), getAddress(minedTransaction.to), 'static/mined destination mismatch');
  const staticData = normalizeHex(call.data, 'static calldata');
  assert.equal(staticData, normalizeHex(minedTransaction.input, 'mined calldata'), 'static/mined calldata mismatch');
  assert.match(call.gas ?? '', /^0x[0-9a-fA-F]+$/, 'static gas malformed');
  assert.match(minedTransaction.gas ?? '', /^0x[0-9a-fA-F]+$/, 'mined gas malformed');
  const staticGas = BigInt(call.gas);
  assert.equal(staticGas, BigInt(minedTransaction.gas), 'static/mined gas mismatch');
  assert.equal(staticGas, ATTEMPT_GAS, 'attempt gas bound');
  return { from: call.from, to: call.to, data: staticData, gas: decimal(staticGas), transactionHash: minedTransaction.hash };
}

export function assertExactError(observed, expected) {
  const have = normalizeHex(observed, 'observed revert data');
  assert.equal(have, normalizeHex(expected, 'expected revert data'), 'full revert bytes mismatch');
  return have;
}

export function classifyReceipt(kind, receipt) {
  assert(receipt, 'receipt missing');
  assert(['refusal', 'calibration'].includes(kind), `unknown receipt class ${kind}`);
  assert.match(receipt.status ?? '', /^0x[01]$/, 'receipt status malformed');
  assert.match(receipt.gasUsed ?? '', /^0x[0-9a-fA-F]+$/, 'receipt gasUsed malformed');
  assert.match(receipt.blockHash ?? '', /^0x[0-9a-fA-F]{64}$/, 'receipt blockHash malformed');
  const status = Number(BigInt(receipt.status));
  assert.equal(status, kind === 'refusal' ? 0 : 1, `${kind} receipt status`);
  return { status, gasUsed: decimal(receipt.gasUsed), blockHash: receipt.blockHash.toLowerCase() };
}

export function createGateState() {
  return {
    independentExpectations: false, exactRawReplies: false, staticMinedLinked: false,
    fullSuite: 'UNVERIFIED by this runner', cParity: 'NOT CLAIMED', stateProof: 'NOT PROVIDED',
  };
}

export function finalizeGateState(gates, completed) {
  assert.equal(typeof completed, 'boolean', 'gate completion must be boolean');
  if (!completed) return { ...gates };
  return { ...gates, independentExpectations: true, exactRawReplies: true, staticMinedLinked: true };
}

function artifactSet(artifactRoot) {
  return Object.fromEntries(Object.entries(ARTIFACT_PATHS).map(([role, parts]) => {
    const path = join(artifactRoot, ...parts);
    assert(existsSync(path), `artifact missing: ${path}`);
    const bytes = readFileSync(path);
    const json = JSON.parse(bytes);
    assert.match(json.bytecode?.object ?? '', /^0x[0-9a-fA-F]+$/, `${role}: missing initcode`);
    assert(Array.isArray(json.abi), `${role}: missing ABI`);
    return [role, { role, path, sha256: sha256(bytes), json, iface: new Interface(json.abi) }];
  }));
}

function verifyArtifactPins(artifactRoot, pins) {
  assert(pins && typeof pins === 'object' && !Array.isArray(pins), 'source.artifactSha256 missing');
  assert.equal(Object.keys(pins).length, 8, 'source artifact pin count');
  const root = resolve(artifactRoot);
  for (const [path, expectedSha256] of Object.entries(pins)) {
    const absolute = resolve(path);
    assert(absolute.startsWith(`${root}/`), `artifact pin outside supplied root: ${absolute}`);
    assert(existsSync(absolute), `pinned artifact missing: ${absolute}`);
    assert.equal(sha256(readFileSync(absolute)), expectedSha256, `artifact SHA-256 mismatch: ${absolute}`);
  }
}

function makeRawRpc(url, raw) {
  let serial = 0;
  let bytes = 0;
  const rpc = async (method, params, { label = method, allowError = false } = {}) => {
    const request = { jsonrpc: '2.0', id: ++serial, method, params };
    const started = Date.now();
    const fetched = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    }).then(async (response) => ({ body: JSON.parse(await response.text()), httpStatus: response.status }));
    assert.equal(fetched.body.id, request.id, `${label}: RPC id mismatch`);
    const envelope = { label, ms: Date.now() - started, httpStatus: fetched.httpStatus, request, response: fetched.body };
    const size = Buffer.byteLength(JSON.stringify(envelope));
    assert(raw.length < MAX_RAW_ENVELOPES, `raw envelope bound exceeded (${MAX_RAW_ENVELOPES})`);
    assert(bytes + size <= MAX_RAW_BYTES, `raw byte bound exceeded (${MAX_RAW_BYTES})`);
    bytes += size;
    raw.push(envelope);
    if (fetched.body.error && !allowError) throw new Error(`${label}: RPC error ${JSON.stringify(fetched.body.error)}`);
    if (!fetched.body.error && fetched.body.result === undefined) throw new Error(`${label}: RPC result missing`);
    return envelope;
  };
  rpc.stats = () => ({ envelopes: raw.length, bytes, maxEnvelopes: MAX_RAW_ENVELOPES, maxBytes: MAX_RAW_BYTES });
  return rpc;
}

async function waitReceipt(rpc, hash, label) {
  const started = Date.now();
  while (Date.now() - started < RPC_TIMEOUT_MS) {
    const envelope = await rpc('eth_getTransactionReceipt', [hash], { label: `${label}:receipt` });
    if (envelope.response.result) return { receipt: envelope.response.result, envelope };
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`${label}: receipt timeout`);
}

const transactionPin = (record) => ({
  label: record.label, from: record.from.toLowerCase(), to: record.to?.toLowerCase() ?? null,
  nonce: record.nonce, data: record.data.toLowerCase(),
});

async function sendTransaction(ctx, wallet, { to = null, data, gasLimit }, expectedNonce, label, expectedBlock) {
  const nonceEnvelope = await ctx.rpc('eth_getTransactionCount', [wallet.address, 'latest'], { label: `${label}:nonce` });
  const nonce = Number(BigInt(nonceEnvelope.response.result));
  assert.equal(nonce, expectedNonce, `${label}: unexpected sender nonce`);
  const rawTransaction = await wallet.signTransaction({ type: 0, to, data, nonce, gasLimit, gasPrice: ctx.gasPrice, chainId: ctx.chainId, value: 0 });
  const hash = keccak256(rawTransaction);
  const sent = await ctx.rpc('eth_sendRawTransaction', [rawTransaction], { label });
  assert.equal(sent.response.result?.toLowerCase(), hash.toLowerCase(), `${label}: transaction hash mismatch`);
  const waited = await waitReceipt(ctx.rpc, hash, label);
  const receipt = waited.receipt;
  assert.equal(Number(BigInt(receipt.blockNumber)), expectedBlock, `${label}: unexpected mined block`);
  const txEnvelope = await ctx.rpc('eth_getTransactionByHash', [hash], { label: `${label}:transaction` });
  const blockEnvelope = await ctx.rpc('eth_getBlockByHash', [receipt.blockHash, false], { label: `${label}:block` });
  const tx = txEnvelope.response.result;
  const block = blockEnvelope.response.result;
  assert(tx && block, `${label}: transaction/block join missing`);
  assert.equal(block.hash?.toLowerCase(), receipt.blockHash.toLowerCase(), `${label}: receipt/header hash mismatch`);
  assert.equal(Number(BigInt(block.number)), expectedBlock, `${label}: receipt/header number mismatch`);
  assert(block.transactions.map((item) => item.toLowerCase()).includes(hash.toLowerCase()), `${label}: transaction absent from block`);
  const record = {
    label, hash, from: wallet.address, to, nonce, data, rawTransaction, receipt, transaction: tx,
    block: { number: decimal(block.number), hash: block.hash, timestamp: decimal(block.timestamp) },
    rpcIds: { nonce: nonceEnvelope.request.id, send: sent.request.id, receipt: waited.envelope.request.id, transaction: txEnvelope.request.id, block: blockEnvelope.request.id },
  };
  ctx.transactions.push(record);
  return record;
}

async function deploy(ctx, artifacts, wallet, armIndex, role, constructorArgs, nonce) {
  const artifact = artifacts[role];
  const data = hexlify(concat([artifact.json.bytecode.object, artifact.iface.encodeDeploy(constructorArgs)]));
  const expectedBlock = armIndex * 12 + nonce + 1;
  const expectedAddress = getCreateAddress({ from: wallet.address, nonce });
  const tx = await sendTransaction(ctx, wallet, { data, gasLimit: DEPLOY_GAS }, nonce, `deploy-${role}`, expectedBlock);
  assert.equal(Number(BigInt(tx.receipt.status)), 1, `deploy-${role}: reverted`);
  assert.equal(getAddress(tx.receipt.contractAddress), getAddress(expectedAddress), `deploy-${role}: CREATE address`);
  const codeEnvelope = await ctx.rpc('eth_getCode', [expectedAddress, qty(expectedBlock)], { label: `deploy-${role}:code` });
  const code = normalizeHex(codeEnvelope.response.result, `${role} runtime`);
  assert(code.length > 2, `${role}: empty runtime`);
  return {
    role, nonce, address: expectedAddress.toLowerCase(), constructorArgs: normalize(constructorArgs),
    artifactPath: artifact.path, artifactSha256: artifact.sha256,
    initcodeHash: keccak256(data), initcodeBytes: (data.length - 2) / 2,
    runtimeCodehash: keccak256(code), runtimeBytes: (code.length - 2) / 2,
    gas: decimal(tx.receipt.gasUsed), transactionHash: tx.hash,
  };
}

function typeId(shape, refs, ruleId) {
  return keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [
    dom('efs2/type/1'), shape, keccak256(coder.encode(['bytes32[]'], [refs])), ruleId,
  ]));
}
const recordId = (type, body) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [dom('efs2/record/1'), type, keccak256(body)]));
const subjectId = (principal, salt) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [dom('efs2/subject/1'), principal, salt]));
const position = (purpose, subject, role) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [dom('efs2/position/1'), purpose, subject, role]));
const binding = (principal, positionKey) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [dom('efs2/binding/1'), principal, positionKey]));
const scope = (principal, purpose, subject) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [dom('efs2/vk/binding-scope/1'), principal, purpose, subject]));
const posting = (type, kind, value) => keccak256(coder.encode(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [dom('efs2/pk/1'), type, kind, 0, value]));
const byType = (type) => posting(type, 1, ZERO);
const byAuthor = (principal) => posting(ZERO, 4, principal);
const backlink = (target) => posting(ZERO, 5, target);
const history = (bindingKey) => posting(ZERO, 8, bindingKey);
const scopeList = (scopeKey) => posting(ZERO, 10, scopeKey);
const contractPrincipal = (coreCodeCommitment, account) => {
  const realmOrigin = keccak256(coder.encode(['uint256', 'bytes32'], [CHAIN_ID, coreCodeCommitment]));
  return keccak256(coder.encode(['bytes32', 'uint256', 'bytes32', 'address'], [dom('efs2/principal/1'), 2, realmOrigin, account]));
};
const action = (fields) => ({ kind: 0, typeId: ZERO, bodyHashOrRecordId: ZERO, purpose: ZERO, subject: ZERO, role: ZERO, target: ZERO, expectedRevision: 0, salt: ZERO, ...fields });
const publish = (type, body) => action({ kind: 1, typeId: type, bodyHashOrRecordId: keccak256(body) });
const create = (salt) => action({ kind: 5, salt });
const bind = (purpose, subject, role, target) => action({ kind: 3, purpose, subject, role, target });

function extractErrorData(error) {
  const candidates = [error?.data, error?.data?.data, error?.error?.data, error?.error?.data?.data];
  const found = candidates.find((value) => typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value));
  assert(found, `static refusal error data missing: ${JSON.stringify(error)}`);
  return found.toLowerCase();
}

async function readAt(ctx, label, artifact, address, fn, args, blockNumber) {
  const data = artifact.iface.encodeFunctionData(fn, args);
  const blockEnvelope = await ctx.header(blockNumber);
  const envelope = await ctx.rpc('eth_call', [{ to: address, data }, qty(blockNumber)], { label: `read:${label}` });
  return {
    label, to: address.toLowerCase(), data: data.toLowerCase(), returnData: normalizeHex(envelope.response.result, `${label} return`),
    blockNumber: String(blockNumber), blockHash: blockEnvelope.response.result.hash.toLowerCase(), rpcId: envelope.request.id,
  };
}

async function observeState(ctx, artifacts, deployed, types, fixture, a1, blockNumber, expectedCalls) {
  assert(expectedCalls && typeof expectedCalls === 'object' && !Array.isArray(expectedCalls), 'readCalls missing');
  assert.equal(Object.keys(expectedCalls).length, 69, 'readCalls count');
  const reads = {};
  const add = async (label, role, fn, args = []) => {
    const row = await readAt(ctx, label, artifacts[role], deployed[role].address, fn, args, blockNumber);
    exact(`${label}: independently prepared call`, { to: row.to, data: row.data }, expectedCalls[label]);
    reads[label] = row.returnData;
  };
  await add('ledger.counts', 'ledger', 'counts');
  await add('ledger.nonce.authorA', 'ledger', 'nonces', [ctx.author.address]);
  await add('ledger.indexModule', 'ledger', 'indexModule');
  await add('ledger.indexObligations', 'ledger', 'indexObligations');
  await add('ledger.evidence.2', 'ledger', 'evidence', [2]);
  await add('ledger.sourceEvidence.2', 'ledger', 'sourceEvidence', [2]);
  await add('ledger.publicationOf.a1', 'ledger', 'publicationOf', [a1.publicationId]);
  for (let ordinal = 4; ordinal <= 8; ordinal++) await add(`ledger.admission.${ordinal}`, 'ledger', 'admission', [ordinal]);
  for (const [name, id] of Object.entries({ itemA: fixture.itemA, itemB: fixture.itemB, pair: fixture.pairId, quote: a1.quoteId })) await add(`ledger.record.${name}`, 'ledger', 'record', [id]);
  await add('ledger.subject.file', 'ledger', 'subjectCreatedAt', [fixture.subject]);
  for (const [name, key] of Object.entries(fixture.bindingKeys)) await add(`ledger.head.${name}`, 'ledger', 'head', [key]);
  for (const [name, key] of Object.entries(fixture.positions)) await add(`ledger.position.${name}`, 'ledger', 'positionCell', [key]);
  for (let ordinal = 1; ordinal <= 3; ordinal++) await add(`ledger.bindingPosition.${ordinal}`, 'ledger', 'bindingPosition', [ordinal]);
  await add('registry.epoch', 'registry', 'epoch');
  for (const name of ['ITEM', 'PAIR', 'QUOTE_J']) {
    await add(`registry.typeInfo.${name}`, 'registry', 'typeInfo', [types[name]]);
    await add(`registry.descriptor.${name}`, 'registry', 'descriptor', [types[name]]);
  }
  for (const fn of ['attachedFrom', 'lastProcessed', 'lastPublication', 'generation', 'gapped']) await add(`index.${fn}`, 'index', fn);
  for (const family of FAMILIES) {
    await add(`index.coverage.${family}`, 'index', 'coverage', [FAMILY_IDS[family], ZERO]);
  }
  for (const [name, key] of Object.entries(fixture.lists(a1.quoteId))) {
    await add(`index.list.${name}.head`, 'index', 'postingHead', [key]);
    await add(`index.list.${name}.word0`, 'index', 'postingWord', [key, 0]);
  }
  exact('readCalls labels', Object.keys(reads).sort(), Object.keys(expectedCalls).sort());
  return reads;
}

async function observePreparedCalls(ctx, calls, blockNumber, expectedCount, label) {
  assert(calls && typeof calls === 'object' && !Array.isArray(calls), `${label} missing`);
  assert.equal(Object.keys(calls).length, expectedCount, `${label} count`);
  const reads = {};
  for (const [key, call] of Object.entries(calls)) {
    const to = getAddress(call.to);
    const data = normalizeHex(call.data, `${label}.${key} calldata`);
    const envelope = await ctx.rpc('eth_call', [{ to, data }, qty(blockNumber)], { label: `read:${key}` });
    reads[key] = normalizeHex(envelope.response.result, `${label}.${key} return`);
  }
  return reads;
}

function expectedReadMap(expectation, stage, field = 'reads') {
  const map = expectation?.[stage]?.[field];
  assert(map && typeof map === 'object' && !Array.isArray(map), `${stage}.${field} missing`);
  return map;
}

const deployedPins = (deployed) => Object.values(deployed).map(({
  role, nonce, address, initcodeHash, initcodeBytes, runtimeCodehash, runtimeBytes,
}) => ({ role, nonce, address, initcodeHash, initcodeBytes, runtimeCodehash, runtimeBytes }));

async function setupArm(ctx, artifacts, expectation, arm, armIndex) {
  const deployer = ctx.wallets[arm.deployerIndex];
  const principalA = zeroPadValue(ctx.author.address, 32);
  const subject = subjectId(principalA, FILE_SALT);
  const positions = {
    head: position(PURPOSE.HEAD, subject, ZERO), folder: position(PURPOSE.FOLDER, SWAPS, ETH_USDC),
    tag: position(PURPOSE.TAG, subject, MARKET),
  };
  const bindingKeys = Object.fromEntries(Object.entries(positions).map(([name, value]) => [name, binding(principalA, value)]));
  const poisonBindingKey = arm.poison ? bindingKeys.tag : ZERO;
  const deployed = {};
  deployed.registry = await deploy(ctx, artifacts, deployer, armIndex, 'registry', [], 0);
  deployed.quoteAcceptor = await deploy(ctx, artifacts, deployer, armIndex, 'quoteAcceptor', [], 1);
  deployed.pairRule = await deploy(ctx, artifacts, deployer, armIndex, 'pairRule', [96], 2);
  deployed.ledger = await deploy(ctx, artifacts, deployer, armIndex, 'ledger', [deployed.registry.address, REALM], 3);
  deployed.index = await deploy(ctx, artifacts, deployer, armIndex, 'index', [deployed.ledger.address, poisonBindingKey], 4);
  deployed.prefixActor = await deploy(ctx, artifacts, deployer, armIndex, 'prefixActor', [deployed.ledger.address], 5);
  exact(`${arm.name}: deployment pins`, deployedPins(deployed), expectation.deployment);

  const types = {};
  const register = async (name, shape, acceptor, refs, nonce) => {
    const data = artifacts.registry.iface.encodeFunctionData('register', [shape, acceptor, refs]);
    const expectedBlock = armIndex * 12 + nonce + 1;
    const label = name === 'QUOTE_J' ? 'register-quote' : `register-${name.toLowerCase()}`;
    const tx = await sendTransaction(ctx, deployer, { to: deployed.registry.address, data, gasLimit: SETUP_GAS }, nonce, label, expectedBlock);
    assert.equal(Number(BigInt(tx.receipt.status)), 1, `register ${name}: reverted`);
    const events = tx.receipt.logs.map((log) => {
      try { return artifacts.registry.iface.parseLog(log); } catch { return null; }
    }).filter((event) => event?.name === 'TypeRegistered');
    assert.equal(events.length, 1, `register ${name}: TypeRegistered count`);
    const ruleId = acceptor === ZERO_ADDRESS ? ZERO : (name === 'PAIR' ? deployed.pairRule.runtimeCodehash : deployed.quoteAcceptor.runtimeCodehash);
    const local = typeId(shape, refs, ruleId);
    assert.equal(events[0].args.typeId.toLowerCase(), local.toLowerCase(), `register ${name}: derived Type id`);
    const callData = artifacts.registry.iface.encodeFunctionData('typeIdOf', [shape, acceptor, refs]);
    const envelope = await ctx.rpc('eth_call', [{ to: deployed.registry.address, data: callData }, qty(expectedBlock)], { label: `typeIdOf-${name}` });
    const [chainType] = artifacts.registry.iface.decodeFunctionResult('typeIdOf', envelope.response.result);
    assert.equal(chainType.toLowerCase(), local.toLowerCase(), `register ${name}: chain Type id`);
    types[name] = local;
    return tx;
  };
  const setupRecords = [];
  setupRecords.push(await register('ITEM', SHAPE.ITEM, ZERO_ADDRESS, [], 6));
  setupRecords.push(await register('PAIR', SHAPE.PAIR, deployed.pairRule.address, [types.ITEM, types.ITEM], 7));
  setupRecords.push(await register('QUOTE_J', SHAPE.QUOTE_J, deployed.quoteAcceptor.address, [types.PAIR], 8));
  exact(`${arm.name}: Type ids`, types, expectation.types);

  const attachData = artifacts.ledger.iface.encodeFunctionData('setIndexModule', [deployed.index.address]);
  const attach = await sendTransaction(ctx, deployer, { to: deployed.ledger.address, data: attachData, gasLimit: SETUP_GAS }, 9, 'attach-index', armIndex * 12 + 10);
  assert.equal(Number(BigInt(attach.receipt.status)), 1, 'attach index reverted');
  setupRecords.push(attach);

  const itemABytes = coder.encode(['uint256'], [1]);
  const itemBBytes = coder.encode(['uint256'], [2]);
  const itemA = recordId(types.ITEM, itemABytes);
  const itemB = recordId(types.ITEM, itemBBytes);
  const pairBytes = coder.encode(['bytes32', 'bytes32', 'uint256'], [itemA, itemB, 1]);
  const pairId = recordId(types.PAIR, pairBytes);
  const prefixActions = [publish(types.ITEM, itemABytes), publish(types.ITEM, itemBBytes), publish(types.PAIR, pairBytes)];
  const prefixBodies = [itemABytes, itemBBytes, pairBytes];
  const prefixData = artifacts.prefixActor.iface.encodeFunctionData('execute', [prefixActions, prefixBodies]);
  const prefix = await sendTransaction(ctx, deployer, { to: deployed.prefixActor.address, data: prefixData, gasLimit: SETUP_GAS }, 10, 'prefix', armIndex * 12 + 11);
  assert.equal(Number(BigInt(prefix.receipt.status)), 1, 'prefix reverted');
  setupRecords.push(prefix);
  const setupTransactions = setupRecords.map(transactionPin);
  exact(`${arm.name}: setup transaction pins`, setupTransactions, expectation.setupTransactions);

  const fixture = {
    principalA, itemABytes, itemBBytes, pairBytes, itemA, itemB, pairId, subject, poisonBindingKey, positions, bindingKeys,
    lists: (quoteId) => ({
      itemByType: byType(types.ITEM), pairByType: byType(types.PAIR), quoteByType: byType(types.QUOTE_J),
      prefixProducerByAuthor: byAuthor(contractPrincipal(deployed.ledger.runtimeCodehash, deployed.prefixActor.address)), authorAByAuthor: byAuthor(principalA),
      headScope: scopeList(scope(principalA, PURPOSE.HEAD, subject)), folderScope: scopeList(scope(principalA, PURPOSE.FOLDER, SWAPS)), tagScope: scopeList(scope(principalA, PURPOSE.TAG, subject)),
      headHistory: history(bindingKeys.head), folderHistory: history(bindingKeys.folder), tagHistory: history(bindingKeys.tag),
      quoteBacklink: backlink(quoteId), fileBacklink: backlink(subject),
    }),
  };
  return { deployer, deployed, types, fixture, setupTransactions, setupGas: Object.fromEntries(setupRecords.map((tx) => [tx.label, decimal(tx.receipt.gasUsed)])) };
}

async function buildA1(ctx, artifacts, setup, arm) {
  const { deployed, types, fixture } = setup;
  const quoteBody = coder.encode(['bytes32', 'uint256', 'uint8', 'uint64', 'bytes32'], [fixture.pairId, 2_500_000_000n, arm.scale, 1_800_000_000n, NOTE_COMMITMENT]);
  const quoteId = recordId(types.QUOTE_J, quoteBody);
  const actions = [
    create(FILE_SALT), publish(types.QUOTE_J, quoteBody), bind(PURPOSE.HEAD, fixture.subject, ZERO, quoteId),
    bind(PURPOSE.FOLDER, SWAPS, ETH_USDC, fixture.subject), bind(PURPOSE.TAG, fixture.subject, MARKET, fixture.subject),
  ];
  const bodies = ['0x', quoteBody, '0x', '0x', '0x'];
  const actionsHash = keccak256(coder.encode([ACTION_TYPE], [actions]));
  const callAt = async (fn, args = []) => {
    const data = artifacts.ledger.iface.encodeFunctionData(fn, args);
    const envelope = await ctx.rpc('eth_call', [{ to: deployed.ledger.address, data }, qty(arm.preBlock)], { label: `sign-${arm.name}:${fn}` });
    return artifacts.ledger.iface.decodeFunctionResult(fn, envelope.response.result)[0];
  };
  const realmId = await callAt('realmId');
  const coreCodeCommitment = await callAt('coreCodeCommitment');
  const protocolNonce = await callAt('nonces', [ctx.author.address]);
  assert.equal(BigInt(protocolNonce), 0n, `${arm.name}: protocol nonce at S0`);
  const acceptanceProfile = await callAt('acceptanceProfileOf', [actions]);
  const indexObligations = await callAt('indexObligations');
  const intent = { realmId, coreCodeCommitment, author: ctx.author.address, nonce: 0, deadline: Number(DEADLINE), acceptanceProfile, indexObligations };
  const signature = await ctx.author.signTypedData({ name: 'EFS2-RoadB-Lab', version: '1' }, INTENT_TYPES, { ...intent, actionsHash });
  const calldata = artifacts.ledger.iface.encodeFunctionData('executeSigned', [intent, actions, bodies, signature]);
  const publicationId = keccak256(coder.encode(['address', 'uint64', 'bytes32'], [ctx.author.address, 0, actionsHash]));
  const actionRows = actions.map((item) => [
    item.kind, item.typeId, item.bodyHashOrRecordId, item.purpose, item.subject,
    item.role, item.target, item.expectedRevision, item.salt,
  ]);
  return normalize({ scale: arm.scale, quoteBody, quoteId, actions: actionRows, bodies, actionsHash, acceptanceProfile, indexObligations, publicationId, intent, signature, calldata });
}

function validateExpectationShape(expectations) {
  assert.equal(expectations?.schema, 'efs-lab-b/rollback-expectations/1', 'expectation schema');
  assert.equal(expectations.source?.nodeVersion, process.version, 'independent preparation Node version');
  assert.equal(expectations.source?.ethersVersion, ethersVersion, 'independent preparation ethers version');
  assert.match(expectations.source?.commit ?? '', /^[0-9a-f]{40}$/, 'source commit pin');
  assert.match(expectations.source?.evidenceCommit ?? '', /^[0-9a-f]{40}$/, 'evidence commit pin');
  assert.equal(String(expectations.chain?.chainId), CHAIN_ID.toString(), 'expected chainId');
  assert.equal(String(expectations.chain?.initialBlockNumber), '0', 'expected initial block');
  assert.equal(String(expectations.chain?.deadline), DEADLINE.toString(), 'expected deadline');
  for (const arm of ARMS) {
    const expected = expectations.arms?.[arm.name];
    assert(expected, `expectations missing arm ${arm.name}`);
    assert.equal(Object.keys(expected.readCalls ?? {}).length, 69, `${arm.name}: readCalls count`);
    assert.equal(Object.keys(expected.auxiliaryReadCalls ?? {}).length, 19, `${arm.name}: auxiliaryReadCalls count`);
    for (const stage of ['pre', 'post']) {
      exact(`${arm.name}.${stage}: main read labels`, Object.keys(expected[stage]?.reads ?? {}).sort(), Object.keys(expected.readCalls).sort());
      exact(`${arm.name}.${stage}: auxiliary read labels`, Object.keys(expected[stage]?.auxiliaryReads ?? {}).sort(), Object.keys(expected.auxiliaryReadCalls).sort());
    }
  }
}

function writeOutputs(runDir, report, raw) {
  const reportPath = join(runDir, 'report.json');
  const rawPath = join(runDir, 'raw.jsonl');
  assert(!existsSync(reportPath) && !existsSync(rawPath), 'output exists');
  writeFileSync(rawPath, raw.map((row) => JSON.stringify(row)).join('\n') + '\n');
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  return { reportPath, rawPath };
}

export async function runRollbackControl({ rpcUrl, artifactRoot, expectations, expectationsPath = null, expectationsSha256 = null, runDir, mnemonic = DEFAULT_MNEMONIC }) {
  assert(isAbsolute(runDir), 'runDir must be absolute');
  assert(!existsSync(runDir), `runDir already exists: ${runDir}`);
  const parsed = new URL(rpcUrl);
  assert.equal(parsed.protocol, 'http:', 'RPC must use http');
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname), 'RPC must be loopback');
  validateExpectationShape(expectations);
  mkdirSync(runDir);
  const raw = [];
  const rpc = makeRawRpc(rpcUrl, raw);
  const resolvedArtifactRoot = resolve(artifactRoot);
  verifyArtifactPins(resolvedArtifactRoot, expectations.source?.artifactSha256);
  const artifacts = artifactSet(resolvedArtifactRoot);
  const wallets = Array.from({ length: 5 }, (_, index) => HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`));
  const ctx = {
    rpc, wallets, author: wallets[1], chainId: CHAIN_ID, gasPrice: null, transactions: [], headerCache: new Map(),
    async header(block) {
      if (!this.headerCache.has(block)) {
        const envelope = await rpc('eth_getBlockByNumber', [qty(block), false], { label: `header-${block}` });
        assert(envelope.response.result, `header ${block} missing`);
        assert.equal(Number(BigInt(envelope.response.result.number)), block, `header ${block} number`);
        this.headerCache.set(block, envelope);
      }
      return this.headerCache.get(block);
    },
  };
  const report = {
    schema: 'efs-lab-b/rollback-report/1', standing: 'RPC_OBSERVED disposable B control; no C parity or authenticated state-proof claim',
    startedAt: new Date().toISOString(), source: { expectedCommit: expectations.source?.commit ?? null, runner: import.meta.url },
    paths: { artifactRoot: resolvedArtifactRoot, expectations: expectationsPath, expectationsSha256, runDir }, schedule: ARMS,
    artifactInputs: Object.fromEntries(Object.entries(artifacts).map(([role, value]) => [role, { path: value.path, sha256: value.sha256 }])),
    chain: null, arms: {}, gas: { deployment: {}, setup: {}, control: {} },
    gates: createGateState(),
    failure: null,
  };
  try {
    const chainEnvelope = await rpc('eth_chainId', [], { label: 'chainId' });
    assert.equal(BigInt(chainEnvelope.response.result), CHAIN_ID, 'fresh chain id');
    const blockEnvelope = await rpc('eth_blockNumber', [], { label: 'initial block' });
    assert.equal(BigInt(blockEnvelope.response.result), 0n, 'fresh chain must start at block 0');
    const genesis = await ctx.header(0);
    assert.equal(BigInt(genesis.response.result.timestamp), GENESIS_TIMESTAMP, 'genesis timestamp');
    assert(BigInt(genesis.response.result.timestamp) < DEADLINE, 'genesis must precede deadline');
    const accountsEnvelope = await rpc('eth_accounts', [], { label: 'deterministic accounts' });
    const nodeAccounts = accountsEnvelope.response.result.map(getAddress);
    for (const wallet of wallets) assert(nodeAccounts.includes(getAddress(wallet.address)), `deterministic account absent: ${wallet.address}`);
    for (const wallet of wallets.slice(1)) {
      const nonce = await rpc('eth_getTransactionCount', [wallet.address, 'latest'], { label: `start nonce ${wallet.address}` });
      assert.equal(BigInt(nonce.response.result), 0n, `account must start at nonce 0: ${wallet.address}`);
    }
    const gasEnvelope = await rpc('eth_gasPrice', [], { label: 'gas price' });
    ctx.gasPrice = 2n * BigInt(gasEnvelope.response.result) + 1n;
    report.chain = {
      chainId: CHAIN_ID.toString(), genesisBlock: '0', genesisHash: genesis.response.result.hash,
      genesisTimestamp: GENESIS_TIMESTAMP.toString(), author: wallets[1].address.toLowerCase(), gasPrice: ctx.gasPrice.toString(),
    };

    for (let armIndex = 0; armIndex < ARMS.length; armIndex++) {
      const arm = ARMS[armIndex];
      const expected = expectations.arms[arm.name];
      assert.equal(expected.deployerIndex, arm.deployerIndex, `${arm.name}: deployer index`);
      assert.equal(expected.authorIndex, 1, `${arm.name}: author index`);
      const setup = await setupArm(ctx, artifacts, expected, arm, armIndex);
      const latest = await rpc('eth_blockNumber', [], { label: `${arm.name}:pre block` });
      assert.equal(Number(BigInt(latest.response.result)), arm.preBlock, `${arm.name}: unexpected pre block`);
      const preHeader = await ctx.header(arm.preBlock);
      assert(BigInt(preHeader.response.result.timestamp) < DEADLINE, `${arm.name}: pre timestamp past deadline`);
      const a1 = await buildA1(ctx, artifacts, setup, arm);
      const fixturePin = normalize({
        itemA: setup.fixture.itemA, itemB: setup.fixture.itemB, pairId: setup.fixture.pairId,
        subject: setup.fixture.subject, poisonBindingKey: setup.fixture.poisonBindingKey,
        quoteBody: a1.quoteBody, quoteId: a1.quoteId, publicationId: a1.publicationId,
      });
      exact(`${arm.name}: fixture`, fixturePin, expected.fixture);
      exact(`${arm.name}: A1`, a1, expected.a1);
      const pre = await observeState(ctx, artifacts, setup.deployed, setup.types, setup.fixture, a1, arm.preBlock, expected.readCalls);
      const preAuxiliary = await observePreparedCalls(ctx, expected.auxiliaryReadCalls, arm.preBlock, 19, `${arm.name}.auxiliaryReadCalls`);
      exact(`${arm.name}: pre block`, String(arm.preBlock), expected.pre.blockNumber);
      exact(`${arm.name}: pre raw replies`, pre, expectedReadMap(expected, 'pre'));
      exact(`${arm.name}: pre auxiliary raw replies`, preAuxiliary, expectedReadMap(expected, 'pre', 'auxiliaryReads'));

      const callObject = { from: ctx.author.address, to: setup.deployed.ledger.address, data: a1.calldata, gas: qty(ATTEMPT_GAS) };
      const staticEnvelope = await rpc('eth_call', [callObject, qty(arm.preBlock)], { label: `${arm.name}:static`, allowError: arm.kind === 'refusal' });
      let staticObservation;
      if (arm.kind === 'refusal') {
        assert(staticEnvelope.response.error, `${arm.name}: static call unexpectedly succeeded`);
        const errorData = extractErrorData(staticEnvelope.response.error);
        assertExactError(errorData, expected.attempt.errorData);
        const localError = arm.name === 'scale7'
          ? artifacts.ledger.iface.encodeErrorResult('E_REJECTED', [1, setup.types.QUOTE_J])
          : artifacts.ledger.iface.encodeErrorResult('E_INDEX', [artifacts.index.iface.encodeErrorResult('E_LATE_INDEX', [setup.fixture.poisonBindingKey])]);
        assertExactError(errorData, localError);
        staticObservation = { errorData, rpcId: staticEnvelope.request.id };
      } else {
        assert(!staticEnvelope.response.error, 'calibration static call failed');
        assert.equal(expected.attempt.errorData, null, 'calibration errorData sentinel');
        const returnData = normalizeHex(staticEnvelope.response.result, 'calibration static return');
        const localReturn = artifacts.ledger.iface.encodeFunctionResult('executeSigned', [2, 4]);
        exact('calibration static return', returnData, localReturn);
        staticObservation = { returnData, rpcId: staticEnvelope.request.id };
      }
      const attemptInput = normalize({ from: ctx.author.address, to: setup.deployed.ledger.address, nonce: arm.authorNonce, data: a1.calldata, expectedStatus: arm.kind === 'refusal' ? 0 : 1 });
      exact(`${arm.name}: attempt input`, attemptInput, {
        from: expected.attempt.from, to: expected.attempt.to, nonce: expected.attempt.nonce,
        data: expected.attempt.data, expectedStatus: expected.attempt.expectedStatus,
      });
      const attempt = await sendTransaction(ctx, ctx.author, { to: setup.deployed.ledger.address, data: a1.calldata, gasLimit: ATTEMPT_GAS }, arm.authorNonce, `${arm.name}:attempt`, arm.postBlock);
      const classification = classifyReceipt(arm.kind, attempt.receipt);
      const link = assertAttemptLink(staticEnvelope, attempt.transaction);
      const post = await observeState(ctx, artifacts, setup.deployed, setup.types, setup.fixture, a1, arm.postBlock, expected.readCalls);
      const postAuxiliary = await observePreparedCalls(ctx, expected.auxiliaryReadCalls, arm.postBlock, 19, `${arm.name}.auxiliaryReadCalls`);
      exact(`${arm.name}: post block`, String(arm.postBlock), expected.post.blockNumber);
      exact(`${arm.name}: post raw replies`, post, expectedReadMap(expected, 'post'));
      exact(`${arm.name}: post auxiliary raw replies`, postAuxiliary, expectedReadMap(expected, 'post', 'auxiliaryReads'));
      if (arm.kind === 'refusal') {
        exact(`${arm.name}: rollback main pre/post`, post, pre);
        exact(`${arm.name}: rollback auxiliary pre/post`, postAuxiliary, preAuxiliary);
      }
      report.arms[arm.name] = {
        kind: arm.kind, deployerIndex: arm.deployerIndex, authorIndex: 1, deployment: deployedPins(setup.deployed),
        setupTransactions: setup.setupTransactions, types: setup.types, fixture: fixturePin, a1,
        pre: { blockNumber: String(arm.preBlock), blockHash: preHeader.response.result.hash, reads: pre, auxiliaryReads: preAuxiliary },
        static: staticObservation, mined: { classification, link, transactionHash: attempt.hash },
        post: { blockNumber: String(arm.postBlock), blockHash: attempt.receipt.blockHash, reads: post, auxiliaryReads: postAuxiliary },
      };
      report.gas.deployment[arm.name] = Object.fromEntries(Object.values(setup.deployed).map((value) => [value.role, value.gas]));
      report.gas.setup[arm.name] = setup.setupGas;
      report.gas.control[arm.name] = classification.gasUsed;
    }
    report.gates = finalizeGateState(report.gates, true);
    report.finishedAt = new Date().toISOString();
    report.raw = rpc.stats();
    const outputs = writeOutputs(runDir, report, raw);
    return { report, raw, outputs };
  } catch (error) {
    report.gates = finalizeGateState(report.gates, false);
    report.failure = { message: error.message, at: new Date().toISOString() };
    report.raw = rpc.stats();
    writeOutputs(runDir, report, raw);
    throw error;
  }
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    assert(key.startsWith('--'), `unexpected argument ${key}`);
    const value = argv[++index];
    assert(value && !value.startsWith('--'), `${key} requires a value`);
    result[key.slice(2)] = value;
  }
  for (const key of ['rpc', 'artifacts', 'expectations', 'run-dir']) assert(result[key], `--${key} is required`);
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const expectationsPath = resolve(args.expectations);
  const expectationsBytes = readFileSync(expectationsPath);
  const expectations = JSON.parse(expectationsBytes);
  const result = await runRollbackControl({
    rpcUrl: args.rpc, artifactRoot: resolve(args.artifacts), expectations, expectationsPath, expectationsSha256: sha256(expectationsBytes),
    runDir: resolve(args['run-dir']), mnemonic: args.mnemonic ?? DEFAULT_MNEMONIC,
  });
  process.stdout.write(`${result.outputs.reportPath}\n${result.outputs.rawPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
