#!/usr/bin/env node
// Disposable C matched-rollback supplement. It never launches a chain or compiles.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ethers = require(process.env.EFS_ETHERS_PATH ?? 'ethers');
const {
  AbiCoder, HDNodeWallet, Interface, Transaction, concat, getAddress, getCreateAddress, hexlify, keccak256,
  recoverAddress, toUtf8Bytes, zeroPadValue,
} = ethers;

const coder = AbiCoder.defaultAbiCoder();
const DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';
const CHAIN_ID = 31_337n;
const GENESIS_TIMESTAMP = 1_800_000_000n;
const DEADLINE = 2_000_000_000n;
const DEPLOY_GAS = 15_000_000n;
const SETUP_GAS = 8_000_000n;
const ATTEMPT_GAS = 5_000_000n;
const BLOCK_GAS_LIMIT = 30_000_000n;
const RPC_TIMEOUT_MS = 30_000;
const MAX_RAW_ENVELOPES = 4_096;
const MAX_RAW_BYTES = 16 * 1024 * 1024;
const ZERO = `0x${'00'.repeat(32)}`;
const id = (value) => keccak256(toUtf8Bytes(value));
const TYPE_META = id('efs2/lab-c/type-meta/2');
const PROFILE = id('efs2/lab-c/acceptance/2');
const OBLIGATIONS = id('efs2/lab-c/index-obligations/1');
const TAG_SUBJECT = id('efs2/subject/1');
const TAG_ORIGIN = id('efs2/origin/1');
const TAG_REALM = id('efs2/realm/1');
const PURPOSE = { HEAD: id('efs2/lab-c/purpose/head'), FOLDER: id('efs2/lab-c/purpose/folder'), TAG: id('efs2/lab-c/purpose/tag') };
const TAG_ASSERT = zeroPadValue('0x01', 32);
const ACTION_TYPE = 'tuple(uint8 kind,bytes32 typeId,uint8 digestKind,bytes32 digest,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
const DOMAIN_TYPEHASH = id('EIP712Domain(string name,string version)');
const INTENT_TYPEHASH = id('PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,bytes32 author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)');
const DOMAIN_SEPARATOR = keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOMAIN_TYPEHASH, id('EFS Lab C'), id('1')]));
const ARMS = [
  { name: 'scale7', deployerIndex: 2, authorNonce: 0, scale: 7, poison: ZERO, kind: 'refusal', preBlock: 8, postBlock: 9 },
  { name: 'lateIndex', deployerIndex: 3, authorNonce: 1, scale: 6, poison: id('market'), kind: 'refusal', preBlock: 17, postBlock: 18 },
  { name: 'calibration', deployerIndex: 4, authorNonce: 2, scale: 6, poison: ZERO, kind: 'calibration', preBlock: 26, postBlock: 27 },
];
const ARTIFACTS = {
  ImportLib: ['ImportLib.sol', 'ImportLib.json'], IndexModule: ['IndexModule.sol', 'IndexModule.json'],
  Ledger: ['Ledger.sol', 'Ledger.json'], PassAcceptor: ['FixtureActors.sol', 'PassAcceptor.json'],
  QuoteAcceptorV1: ['FixtureActors.sol', 'QuoteAcceptorV1.json'], Producer: ['FixtureActors.sol', 'Producer.json'],
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

export function validateRpcEnvelope(envelope, { allowError = false } = {}) {
  assert.equal(envelope?.httpStatus, 200, 'RPC HTTP status must be 200');
  const { request, response } = envelope;
  assert(response && typeof response === 'object' && !Array.isArray(response), 'RPC response must be an object');
  assert(Object.hasOwn(response, 'jsonrpc') && response.jsonrpc === '2.0', 'RPC JSON-RPC version');
  assert(Object.hasOwn(response, 'id') && response.id === request?.id, 'RPC response ID mismatch');
  const hasResult = Object.hasOwn(response, 'result');
  const hasError = Object.hasOwn(response, 'error');
  assert.notEqual(hasResult, hasError, 'RPC response must contain exactly one own result or error field');
  if (hasError) {
    const error = response.error;
    assert(error && typeof error === 'object' && !Array.isArray(error), 'RPC error must be an object');
    assert(Object.keys(error).every((key) => ['code', 'message', 'data'].includes(key)), 'RPC error fields');
    assert(Number.isInteger(error.code), 'RPC error code must be an integer');
    assert.equal(typeof error.message, 'string', 'RPC error message must be a string');
    assert(allowError, 'RPC error not allowed');
  }
  return response;
}

export function assertRawEqual(label, observed, expected) {
  const actual = normalizeHex(observed, `${label} observed`);
  assert.equal(actual, normalizeHex(expected, `${label} expected`), `${label} mismatch`);
  return actual;
}

export function assertExactError(observed, expected) {
  const actual = normalizeHex(observed, 'observed revert data');
  assert.equal(actual, normalizeHex(expected, 'expected revert data'), 'full revert bytes mismatch');
  return actual;
}

export function assertAttemptLink(staticCall, minedTransaction) {
  assert(staticCall && minedTransaction, 'attempt link missing');
  assert.equal(getAddress(staticCall.from), getAddress(minedTransaction.from), 'static/mined sender mismatch');
  assert.equal(getAddress(staticCall.to), getAddress(minedTransaction.to), 'static/mined destination mismatch');
  const data = normalizeHex(staticCall.data, 'static calldata');
  assert.equal(data, normalizeHex(minedTransaction.input, 'mined calldata'), 'static/mined calldata mismatch');
  assert.match(staticCall.gas ?? '', /^0x[0-9a-fA-F]+$/, 'static gas malformed');
  assert.match(minedTransaction.gas ?? '', /^0x[0-9a-fA-F]+$/, 'mined gas malformed');
  const gas = BigInt(staticCall.gas);
  assert.equal(gas, BigInt(minedTransaction.gas), 'static/mined gas mismatch');
  assert.equal(gas, ATTEMPT_GAS, 'attempt gas bound');
  return { from: staticCall.from, to: staticCall.to, data, gas: gas.toString(), transactionHash: minedTransaction.hash };
}

export function assertMinedTransaction(expected, mined, receipt, header) {
  assert(mined && receipt && header, 'mined transaction/receipt/header missing');
  assert.equal(getAddress(mined.from), getAddress(expected.from), 'mined sender mismatch');
  assert.equal(mined.to === null ? null : getAddress(mined.to), expected.to === null ? null : getAddress(expected.to), 'mined destination mismatch');
  assert.equal(BigInt(mined.nonce), BigInt(expected.nonce), 'mined nonce mismatch');
  assert.equal(normalizeHex(mined.input, 'mined calldata'), normalizeHex(expected.data, 'expected calldata'), 'mined calldata mismatch');
  assert.equal(BigInt(mined.gas), BigInt(expected.gas), 'mined gas mismatch');
  assert.equal(normalizeHex(mined.hash, 'mined hash'), normalizeHex(expected.hash, 'expected hash'), 'mined hash mismatch');
  const minedBlockHash = normalizeHex(mined.blockHash, 'mined block hash');
  assert.equal(minedBlockHash, normalizeHex(receipt.blockHash, 'receipt block hash'), 'mined/receipt block hash mismatch');
  assert.equal(minedBlockHash, normalizeHex(header.hash, 'header block hash'), 'mined/header block hash mismatch');
  const minedBlockNumber = BigInt(mined.blockNumber);
  assert.equal(minedBlockNumber, BigInt(receipt.blockNumber), 'mined/receipt block number mismatch');
  assert.equal(minedBlockNumber, BigInt(header.number), 'mined/header block number mismatch');
  assert.equal(minedBlockNumber, BigInt(expected.blockNumber), 'mined/expected block number mismatch');
  assert.equal(BigInt(mined.transactionIndex), 0n, 'mined transaction index must be zero');
  assert.equal(BigInt(receipt.transactionIndex), 0n, 'receipt transaction index must be zero');
  assert.equal(BigInt(header.gasLimit), BLOCK_GAS_LIMIT, 'header gas limit must be 30000000');
  return true;
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

export function assertExpectedReads(calls, expected, label) {
  assert(calls && typeof calls === 'object' && !Array.isArray(calls), `${label} calls missing`);
  assert(expected && typeof expected === 'object' && !Array.isArray(expected), `${label} expected map missing`);
  assert(Object.keys(calls).length > 0, `${label} calls empty`);
  exact(`${label} labels`, Object.keys(calls).sort(), Object.keys(expected).sort());
  return Object.keys(calls);
}

export function createGateState() {
  return { independentExpectations: false, exactRawReplies: false, staticMinedLinked: false, fullSuite: 'UNVERIFIED by this runner', bParity: 'NOT CLAIMED', stateProof: 'NOT PROVIDED' };
}

export function finalizeGateState(gates, completed) {
  assert.equal(typeof completed, 'boolean', 'gate completion must be boolean');
  if (!completed) return { ...gates };
  return { ...gates, independentExpectations: true, exactRawReplies: true, staticMinedLinked: true };
}

const action = (fields = {}) => ({
  kind: '0', typeId: ZERO, digestKind: '0', digest: ZERO, purpose: ZERO,
  subject: ZERO, role: ZERO, target: ZERO, expectedRevision: '0', salt: ZERO, ...fields,
});
const recordId = (typeId, bodyHash) => keccak256(coder.encode(['bytes32', 'bytes32'], [typeId, bodyHash]));
const recordBody = (refs, payload) => coder.encode(['bytes32[]', 'bytes'], [refs, payload]);
const typeBody = (shape, refs, mandatoryRuleId) => coder.encode(['bytes32', 'bytes32[]', 'bytes32'], [shape, refs, mandatoryRuleId]);
const eoaPrincipal = (address) => keccak256(coder.encode(['uint8', 'bytes32', 'address'], [1, ZERO, address]));
const realmOrigin = (ledger) => keccak256(coder.encode(['bytes32', 'uint256', 'address'], [TAG_ORIGIN, CHAIN_ID, ledger]));
const realmId = (ledger) => keccak256(coder.encode(['bytes32', 'uint256', 'address'], [TAG_REALM, CHAIN_ID, ledger]));
const contractPrincipal = (origin, address) => keccak256(coder.encode(['uint8', 'bytes32', 'address'], [2, origin, address]));
const subjectId = (author, salt) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [TAG_SUBJECT, author, salt]));
const bindingKey = (author, purpose, subject, role = ZERO) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [author, purpose, subject, role]));
const publicationId = (author, nonce, actionsHash) => keccak256(coder.encode(['bytes32', 'uint64', 'bytes32'], [author, nonce, actionsHash]));
const actionsHashOf = (actions) => keccak256(coder.encode([ACTION_TYPE], [actions]));
const intentDigest = (ledgerRealmId, coreCodeCommitment, intent, actionsHash) => {
  const structHash = keccak256(coder.encode(
    ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64', 'bytes32', 'bytes32', 'bytes32'],
    [INTENT_TYPEHASH, ledgerRealmId, coreCodeCommitment, intent.author, intent.nonce, intent.deadline, intent.acceptanceProfile, intent.indexObligations, actionsHash],
  ));
  return keccak256(concat(['0x1901', DOMAIN_SEPARATOR, structHash]));
};

function loadArtifacts(root) {
  return Object.fromEntries(Object.entries(ARTIFACTS).map(([role, parts]) => {
    const path = join(root, ...parts);
    assert(existsSync(path), `artifact missing: ${path}`);
    const bytes = readFileSync(path);
    const json = JSON.parse(bytes);
    assert(Array.isArray(json.abi), `${role}: ABI missing`);
    assert.equal(typeof json.bytecode?.object, 'string', `${role}: initcode missing`);
    assert.equal(typeof json.deployedBytecode?.object, 'string', `${role}: runtime missing`);
    return [role, { role, path, sha256: sha256(bytes), json, iface: new Interface(json.abi) }];
  }));
}

function verifyArtifactPins(root, artifacts, pins) {
  assert(pins && typeof pins === 'object' && !Array.isArray(pins), 'source.artifactSha256 missing');
  assert.equal(Object.keys(pins).length, 6, 'artifact pin count');
  for (const artifact of Object.values(artifacts)) {
    const expected = pins[artifact.path];
    assert.equal(typeof expected, 'string', `artifact pin missing: ${artifact.path}`);
    assert.equal(artifact.sha256, expected, `artifact SHA-256 mismatch: ${artifact.path}`);
    assert(artifact.path.startsWith(`${root}/`), `artifact outside supplied root: ${artifact.path}`);
  }
  exact('artifact pin paths', Object.keys(pins).sort(), Object.values(artifacts).map((item) => item.path).sort());
}

function linkBytecode(object, references, links, role) {
  let code = object;
  const refs = [];
  for (const [source, libraries] of Object.entries(references ?? {})) {
    for (const [library, spans] of Object.entries(libraries)) {
      for (const span of spans) refs.push({ source, library, ...span });
    }
  }
  if (role === 'Ledger') {
    assert.equal(refs.length, 1, 'Ledger link count');
    assert.equal(refs[0].source, 'src/ImportLib.sol', 'Ledger link source');
    assert.equal(refs[0].library, 'ImportLib', 'Ledger link library');
    assert.equal(refs[0].length, 20, 'Ledger link length');
  } else assert.equal(refs.length, 0, `${role}: unexpected library links`);
  for (const ref of refs) {
    const address = links[`${ref.source}:${ref.library}`];
    assert(address, `${role}: link address missing`);
    const at = 2 + ref.start * 2;
    assert.match(code.slice(at, at + ref.length * 2), /^__\$[0-9a-f]{34}\$__$/, `${role}: link placeholder`);
    code = `${code.slice(0, at)}${address.slice(2).toLowerCase()}${code.slice(at + ref.length * 2)}`;
  }
  assert(!/__\$[0-9a-f]{34}\$__/.test(code), `${role}: unresolved link`);
  return code;
}

function createDeploymentPlans(artifactRoot, artifacts, deployer, poison) {
  const address = (nonce) => getCreateAddress({ from: deployer, nonce });
  const addresses = {
    ImportLib: address(0), IndexModule: address(1), Ledger: address(2),
    PassAcceptor: address(4), QuoteAcceptorV1: address(5), Producer: address(6),
  };
  const links = { 'src/ImportLib.sol:ImportLib': addresses.ImportLib };
  const specs = [
    ['ImportLib', 0, [], []], ['IndexModule', 1, ['bytes32'], [poison]], ['Ledger', 2, ['address'], [addresses.IndexModule]],
    ['PassAcceptor', 4, [], []], ['QuoteAcceptorV1', 5, [], []], ['Producer', 6, [], []],
  ];
  const plans = specs.map(([role, nonce, types, args]) => {
    const artifact = artifacts[role];
    const linked = linkBytecode(artifact.json.bytecode.object, artifact.json.bytecode.linkReferences, links, role);
    const constructorArgs = coder.encode(types, args);
    const initcode = `${linked}${constructorArgs.slice(2)}`;
    return {
      role, nonce, address: addresses[role].toLowerCase(), initcode,
      initcodeHash: keccak256(initcode), initcodeBytes: (initcode.length - 2) / 2,
    };
  });
  return { artifactRoot, addresses, plans };
}

const deploymentInputPins = (plans) => plans.map(({ role, nonce, address, initcodeHash, initcodeBytes }) => ({ role, nonce, address, initcodeHash, initcodeBytes }));
const expectedDeploymentInputs = (rows) => rows.map(({ role, nonce, address, initcodeHash, initcodeBytes }) => ({ role, nonce, address, initcodeHash, initcodeBytes }));

function buildFixture(plan, artifacts, authorWallet, scale) {
  const passRuntime = linkBytecode(artifacts.PassAcceptor.json.deployedBytecode.object, artifacts.PassAcceptor.json.deployedBytecode.linkReferences, {}, 'PassAcceptor');
  const quoteRuntime = linkBytecode(artifacts.QuoteAcceptorV1.json.deployedBytecode.object, artifacts.QuoteAcceptorV1.json.deployedBytecode.linkReferences, {}, 'QuoteAcceptorV1');
  assert.equal(Object.keys(artifacts.PassAcceptor.json.deployedBytecode.immutableReferences ?? {}).length, 0, 'PassAcceptor immutables');
  assert.equal(Object.keys(artifacts.QuoteAcceptorV1.json.deployedBytecode.immutableReferences ?? {}).length, 0, 'QuoteAcceptorV1 immutables');
  const passRuleId = keccak256(passRuntime);
  const quoteRuleId = keccak256(quoteRuntime);
  const itemTypeBody = typeBody(id('Item'), [], passRuleId);
  const itemTypeId = recordId(TYPE_META, keccak256(itemTypeBody));
  const pairTypeBody = typeBody(id('Pair'), [itemTypeId, itemTypeId], passRuleId);
  const pairTypeId = recordId(TYPE_META, keccak256(pairTypeBody));
  const quoteTypeBody = typeBody(id('Quote'), [pairTypeId], quoteRuleId);
  const quoteTypeId = recordId(TYPE_META, keccak256(quoteTypeBody));
  const itemEthBody = recordBody([], hexlify(toUtf8Bytes('ETH')));
  const itemUsdcBody = recordBody([], hexlify(toUtf8Bytes('USDC')));
  const itemEthId = recordId(itemTypeId, keccak256(itemEthBody));
  const itemUsdcId = recordId(itemTypeId, keccak256(itemUsdcBody));
  const pairBody = recordBody([itemEthId, itemUsdcId], '0x');
  const pairId = recordId(pairTypeId, keccak256(pairBody));
  const origin = realmOrigin(plan.addresses.Ledger);
  const nativeAuthor = contractPrincipal(origin, plan.addresses.Producer);
  const author = eoaPrincipal(authorWallet.address);
  const fileSalt = id('typed-file');
  const fileId = subjectId(author, fileSalt);
  const folder = id('/swaps');
  const name = id('eth-usdc');
  const concept = id('market');
  const bindingKeys = {
    HEAD: bindingKey(author, PURPOSE.HEAD, fileId), FOLDER: bindingKey(author, PURPOSE.FOLDER, folder, name),
    TAG: bindingKey(author, PURPOSE.TAG, fileId, concept),
  };
  const types = {
    Item: { id: itemTypeId, shape: id('Item'), refTypes: [], mandatoryRuleId: passRuleId, acceptor: plan.addresses.PassAcceptor.toLowerCase(), body: itemTypeBody },
    Pair: { id: pairTypeId, shape: id('Pair'), refTypes: [itemTypeId, itemTypeId], mandatoryRuleId: passRuleId, acceptor: plan.addresses.PassAcceptor.toLowerCase(), body: pairTypeBody },
    Quote: { id: quoteTypeId, shape: id('Quote'), refTypes: [pairTypeId], mandatoryRuleId: quoteRuleId, acceptor: plan.addresses.QuoteAcceptorV1.toLowerCase(), body: quoteTypeBody },
  };
  const items = [
    { id: itemEthId, typeId: itemTypeId, refs: [], payload: hexlify(toUtf8Bytes('ETH')), body: itemEthBody },
    { id: itemUsdcId, typeId: itemTypeId, refs: [], payload: hexlify(toUtf8Bytes('USDC')), body: itemUsdcBody },
  ];
  const pair = { id: pairId, typeId: pairTypeId, refs: [itemEthId, itemUsdcId], payload: '0x', body: pairBody };
  const prefixActions = [
    action({ kind: '1', typeId: TYPE_META, digestKind: '1', digest: keccak256(itemTypeBody), target: zeroPadValue(plan.addresses.PassAcceptor, 32) }),
    action({ kind: '1', typeId: TYPE_META, digestKind: '1', digest: keccak256(pairTypeBody), target: zeroPadValue(plan.addresses.PassAcceptor, 32) }),
    action({ kind: '1', typeId: TYPE_META, digestKind: '1', digest: keccak256(quoteTypeBody), target: zeroPadValue(plan.addresses.QuoteAcceptorV1, 32) }),
    action({ kind: '2', typeId: itemTypeId, digestKind: '1', digest: keccak256(itemEthBody) }),
    action({ kind: '2', typeId: itemTypeId, digestKind: '1', digest: keccak256(itemUsdcBody) }),
    action({ kind: '2', typeId: pairTypeId, digestKind: '1', digest: keccak256(pairBody) }),
  ];
  const prefixBodies = [itemTypeBody, pairTypeBody, quoteTypeBody, itemEthBody, itemUsdcBody, pairBody];
  const prefixIntent = { author: nativeAuthor, nonce: '1', deadline: '0', acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS, actions: prefixActions };
  const prefixActionsHash = actionsHashOf(prefixActions);
  const prefixPublicationId = publicationId(nativeAuthor, 1, prefixActionsHash);
  const prefixCalldata = artifacts.Producer.iface.encodeFunctionData('publish', [plan.addresses.Ledger, prefixIntent, prefixBodies]);
  const quotePayload = coder.encode(['uint256', 'uint8', 'uint64', 'bytes32'], [2_500_000_000n, scale, 1_800_000_000n, id('reference quote')]);
  const quoteBody = recordBody([pairId], quotePayload);
  const quoteId = recordId(quoteTypeId, keccak256(quoteBody));
  const quote = { id: quoteId, typeId: quoteTypeId, refs: [pairId], payload: quotePayload, body: quoteBody };
  const a1Actions = [
    action({ kind: '3', subject: fileId, salt: fileSalt }),
    action({ kind: '2', typeId: quoteTypeId, digestKind: '1', digest: keccak256(quoteBody) }),
    action({ kind: '4', purpose: PURPOSE.HEAD, subject: fileId, target: quoteId }),
    action({ kind: '4', purpose: PURPOSE.FOLDER, subject: folder, role: name, target: fileId }),
    action({ kind: '4', purpose: PURPOSE.TAG, subject: fileId, role: concept, target: TAG_ASSERT }),
  ];
  const a1Bodies = ['0x', quoteBody, '0x', '0x', '0x'];
  const a1Intent = { author, nonce: '1', deadline: DEADLINE.toString(), acceptanceProfile: PROFILE, indexObligations: OBLIGATIONS, actions: a1Actions };
  const a1ActionsHash = actionsHashOf(a1Actions);
  const a1PublicationId = publicationId(author, 1, a1ActionsHash);
  const ledgerRealmId = realmId(plan.addresses.Ledger);
  return {
    types, internal: { a1Intent, a1Bodies, a1ActionsHash, a1PublicationId, ledgerRealmId, quote },
    fixture: {
      realmOrigin: origin, realmId: ledgerRealmId, author, nativeAuthor, fileSalt, folder, name, concept, tagAssert: TAG_ASSERT,
      items, pair, fileId, quote, bindingKeys,
      prefix: { intent: prefixIntent, bodies: prefixBodies, actionsHash: prefixActionsHash, publicationId: prefixPublicationId, calldata: prefixCalldata },
    },
  };
}

function buildA1(artifacts, fixtureBuild, authorWallet, coreCodeCommitment) {
  const { a1Intent: intent, a1Bodies: bodies, a1ActionsHash: actionsHash, a1PublicationId: publicationId, ledgerRealmId } = fixtureBuild.internal;
  const digest = intentDigest(ledgerRealmId, coreCodeCommitment, intent, actionsHash);
  const signed = authorWallet.signingKey.sign(digest);
  assert.equal(getAddress(recoverAddress(digest, signed)), getAddress(authorWallet.address), 'A1 recovered signer');
  const signature = { v: signed.v, r: signed.r, s: signed.s };
  const calldata = artifacts.Ledger.iface.encodeFunctionData('publishSigned', [intent, bodies, signature]);
  return normalize({ intent, bodies, signature, actionsHash, publicationId, digest, calldata });
}

function makeRawRpc(url, raw) {
  let serial = 0;
  let bytes = 0;
  const rpc = async (method, params, { label = method, allowError = false } = {}) => {
    const request = { jsonrpc: '2.0', id: ++serial, method, params };
    const fetched = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    }).then(async (response) => ({ text: await response.text(), httpStatus: response.status }));
    let response;
    try { response = JSON.parse(fetched.text); } catch { response = fetched.text; }
    const envelope = { label, httpStatus: fetched.httpStatus, request, response };
    const size = Buffer.byteLength(JSON.stringify(envelope));
    assert(raw.length < MAX_RAW_ENVELOPES, `raw envelope bound exceeded (${MAX_RAW_ENVELOPES})`);
    assert(bytes + size <= MAX_RAW_BYTES, `raw byte bound exceeded (${MAX_RAW_BYTES})`);
    bytes += size;
    raw.push(envelope);
    validateRpcEnvelope(envelope, { allowError });
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

async function sendTransaction(ctx, wallet, input, expectedNonce, expectedBlock, label) {
  const nonceEnvelope = await ctx.rpc('eth_getTransactionCount', [wallet.address, 'latest'], { label: `${label}:nonce` });
  assert.equal(Number(BigInt(nonceEnvelope.response.result)), expectedNonce, `${label}: sender nonce`);
  const rawTransaction = await wallet.signTransaction({
    type: 0, to: input.to ?? null, data: input.data, nonce: expectedNonce, gasLimit: input.gasLimit,
    gasPrice: ctx.gasPrice, chainId: CHAIN_ID, value: 0,
  });
  const hash = keccak256(rawTransaction);
  const signed = Transaction.from(rawTransaction);
  assert(signed.isSigned(), `${label}: unsigned transaction`);
  assert.equal(getAddress(signed.from), getAddress(wallet.address), `${label}: recovered sender`);
  assert.equal(signed.serialized.toLowerCase(), rawTransaction.toLowerCase(), `${label}: signed bytes`);
  assert.equal(signed.hash.toLowerCase(), hash.toLowerCase(), `${label}: signed hash`);
  const sent = await ctx.rpc('eth_sendRawTransaction', [rawTransaction], { label });
  assert.equal(sent.response.result.toLowerCase(), hash.toLowerCase(), `${label}: sent hash`);
  const waited = await waitReceipt(ctx.rpc, hash, label);
  const receipt = waited.receipt;
  assert.equal(Number(BigInt(receipt.blockNumber)), expectedBlock, `${label}: mined block`);
  const txEnvelope = await ctx.rpc('eth_getTransactionByHash', [hash], { label: `${label}:transaction` });
  const headerEnvelope = await ctx.rpc('eth_getBlockByHash', [receipt.blockHash, false], { label: `${label}:header` });
  const transaction = txEnvelope.response.result;
  const header = headerEnvelope.response.result;
  assert(transaction && header, `${label}: transaction/header missing`);
  assertMinedTransaction({ from: wallet.address, to: input.to ?? null, nonce: expectedNonce, data: input.data, gas: input.gasLimit, hash, blockNumber: expectedBlock }, transaction, receipt, header);
  assert.equal(receipt.transactionHash.toLowerCase(), hash.toLowerCase(), `${label}: receipt hash`);
  assert.equal(header.hash.toLowerCase(), receipt.blockHash.toLowerCase(), `${label}: receipt/header hash`);
  assert.equal(Number(BigInt(header.number)), expectedBlock, `${label}: header number`);
  assert.equal(header.parentHash.toLowerCase(), ctx.lastBlockHash.toLowerCase(), `${label}: parent hash`);
  assert.equal(header.transactions.length, 1, `${label}: block transaction count`);
  assert.equal(header.transactions[0].toLowerCase(), hash.toLowerCase(), `${label}: block transaction`);
  ctx.lastBlockHash = header.hash;
  return { hash, rawTransaction, receipt, transaction, header, receiptId: waited.envelope.request.id };
}

async function deployPlan(ctx, wallet, plan, expected, expectedBlock) {
  const sent = await sendTransaction(ctx, wallet, { data: plan.initcode, gasLimit: DEPLOY_GAS }, plan.nonce, expectedBlock, `deploy:${plan.role}`);
  assert.equal(Number(BigInt(sent.receipt.status)), 1, `${plan.role}: deployment status`);
  assert.equal(getAddress(sent.receipt.contractAddress), getAddress(plan.address), `${plan.role}: contract address`);
  const codeEnvelope = await ctx.rpc('eth_getCode', [plan.address, qty(expectedBlock)], { label: `deploy:${plan.role}:code` });
  const runtime = normalizeHex(codeEnvelope.response.result, `${plan.role}: runtime`);
  assert(runtime.length > 2, `${plan.role}: empty runtime`);
  const result = {
    role: plan.role, nonce: plan.nonce, address: plan.address,
    initcodeHash: plan.initcodeHash, initcodeBytes: plan.initcodeBytes,
    runtimeCodehash: keccak256(runtime), runtimeBytes: (runtime.length - 2) / 2,
  };
  exact(`${plan.role}: deployment pins`, result, expected);
  return { result, gasUsed: decimal(sent.receipt.gasUsed), transaction: sent };
}

function transactionPin(label, from, to, nonce, data) {
  return { label, from: from.toLowerCase(), to: to.toLowerCase(), nonce, data: data.toLowerCase() };
}

function extractErrorData(error) {
  const candidates = [error?.data, error?.data?.data, error?.error?.data, error?.error?.data?.data];
  const found = candidates.find((value) => typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value));
  assert(found, 'static error data missing');
  return found.toLowerCase();
}

async function observeMap(ctx, calls, expected, blockNumber, kind) {
  const labels = assertExpectedReads(calls, expected, kind);
  const output = {};
  for (const label of labels) {
    const call = calls[label];
    assert.equal(call.method, kind === 'storage' ? 'eth_getStorageAt' : 'eth_call', `${kind}.${label}: method`);
    assert(Array.isArray(call.params), `${kind}.${label}: params`);
    if (kind === 'reads') {
      assert.equal(call.params.length, 1, `${kind}.${label}: params length`);
      const request = call.params[0];
      assert.equal(Object.keys(request).sort().join(','), 'data,to', `${kind}.${label}: call fields`);
      getAddress(request.to);
      normalizeHex(request.data, `${kind}.${label}: calldata`);
    } else {
      assert.equal(call.params.length, 2, `${kind}.${label}: params length`);
      getAddress(call.params[0]);
      assert.match(call.params[1], /^0x[0-9a-fA-F]{64}$/, `${kind}.${label}: slot`);
    }
    const envelope = await ctx.rpc(call.method, [...call.params, qty(blockNumber)], { label: `${kind}:${label}` });
    const result = assertRawEqual(`${kind}.${label}`, envelope.response.result, expected[label]);
    if (kind === 'storage') assert.equal(result.length, 66, `${kind}.${label}: storage word length`);
    output[label] = result;
  }
  return output;
}

function validateExpectationShape(expectations) {
  assert.equal(expectations?.schema, 'efs-lab-c/rollback-expectations/1', 'expectation schema');
  assert.equal(expectations.source?.commit, '2ca7349e5d683c3ff10651c0fc106c10da946145', 'source commit pin');
  exact('arm labels', Object.keys(expectations.arms ?? {}).sort(), ARMS.map((arm) => arm.name).sort());
  for (const arm of ARMS) {
    const expected = expectations.arms[arm.name];
    assert.equal(expected.deployerIndex, arm.deployerIndex, `${arm.name}: deployer index`);
    assert.equal(expected.authorIndex, 1, `${arm.name}: author index`);
    assert.equal(expected.deployment?.length, 6, `${arm.name}: deployment count`);
    assert.equal(expected.setupTransactions?.length, 2, `${arm.name}: setup transaction count`);
    assertExpectedReads(expected.readCalls, expected.pre?.reads, `${arm.name}.pre.reads`);
    assertExpectedReads(expected.readCalls, expected.post?.reads, `${arm.name}.post.reads`);
    assertExpectedReads(expected.storageCalls, expected.pre?.storage, `${arm.name}.pre.storage`);
    assertExpectedReads(expected.storageCalls, expected.post?.storage, `${arm.name}.post.storage`);
    assert.equal(String(expected.pre.blockNumber), String(arm.preBlock), `${arm.name}: pre block`);
    assert.equal(String(expected.post.blockNumber), String(arm.postBlock), `${arm.name}: post block`);
    assert.equal(expected.attempt.expectedStatus, arm.kind === 'refusal' ? 0 : 1, `${arm.name}: attempt status`);
    assert.equal(expected.attempt.errorData === null, arm.kind === 'calibration', `${arm.name}: errorData sentinel`);
    assert.equal(expected.attempt.returnData === null, arm.kind === 'refusal', `${arm.name}: returnData sentinel`);
  }
}

function writeOutputs(runDir, report, raw) {
  const reportPath = join(runDir, 'report.json');
  const rawPath = join(runDir, 'raw.jsonl');
  assert(!existsSync(reportPath) && !existsSync(rawPath), 'output exists');
  writeFileSync(rawPath, raw.length ? `${raw.map((row) => JSON.stringify(row)).join('\n')}\n` : '');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { reportPath, rawPath };
}

export async function runRollbackControl({ rpcUrl, artifactRoot, expectations, expectationsPath = null, expectationsSha256 = null, runDir, mnemonic = DEFAULT_MNEMONIC }) {
  assert(isAbsolute(runDir), 'runDir must be absolute');
  assert(!existsSync(runDir), `runDir already exists: ${runDir}`);
  const url = new URL(rpcUrl);
  assert.equal(url.protocol, 'http:', 'RPC must use http');
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'RPC must be loopback');
  mkdirSync(runDir);
  const raw = [];
  const rpc = makeRawRpc(rpcUrl, raw);
  const resolvedArtifactRoot = resolve(artifactRoot);
  const wallets = Array.from({ length: 5 }, (_, index) => HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`));
  const ctx = {
    rpc, gasPrice: null, lastBlockHash: null, headers: new Map(),
    async header(blockNumber) {
      if (!this.headers.has(blockNumber)) {
        const envelope = await rpc('eth_getBlockByNumber', [qty(blockNumber), false], { label: `header:${blockNumber}` });
        const header = envelope.response.result;
        assert(header, `header ${blockNumber} missing`);
        assert.equal(Number(BigInt(header.number)), blockNumber, `header ${blockNumber} number`);
        assert.equal(BigInt(header.gasLimit), BLOCK_GAS_LIMIT, `header ${blockNumber} gas limit`);
        this.headers.set(blockNumber, envelope);
      }
      return this.headers.get(blockNumber);
    },
  };
  const report = {
    schema: 'efs-lab-c/rollback-report/1',
    source: { expectedCommit: expectations?.source?.commit ?? null, runner: import.meta.url, artifactRoot: resolvedArtifactRoot, expectationsPath, expectationsSha256 },
    chain: null, arms: {}, gas: { deployment: {}, setup: {}, control: {} }, gates: createGateState(), failure: null,
    startedAt: new Date().toISOString(), finishedAt: null, raw: null,
  };
  try {
    validateExpectationShape(expectations);
    assert.equal(ethers.version, '6.15.0', 'ethers version');
    const artifacts = loadArtifacts(resolvedArtifactRoot);
    verifyArtifactPins(resolvedArtifactRoot, artifacts, expectations.source.artifactSha256);
    const chainEnvelope = await rpc('eth_chainId', [], { label: 'chainId' });
    assert.equal(BigInt(chainEnvelope.response.result), CHAIN_ID, 'chain id');
    const blockEnvelope = await rpc('eth_blockNumber', [], { label: 'initial block' });
    assert.equal(BigInt(blockEnvelope.response.result), 0n, 'fresh chain block');
    const genesisEnvelope = await ctx.header(0);
    assert.equal(BigInt(genesisEnvelope.response.result.timestamp), GENESIS_TIMESTAMP, 'genesis timestamp');
    ctx.lastBlockHash = genesisEnvelope.response.result.hash;
    const accountEnvelope = await rpc('eth_accounts', [], { label: 'deterministic accounts' });
    const accounts = accountEnvelope.response.result.map((address) => getAddress(address));
    for (const wallet of wallets.slice(1)) {
      assert(accounts.includes(getAddress(wallet.address)), `deterministic account missing: ${wallet.address}`);
      const nonce = await rpc('eth_getTransactionCount', [wallet.address, 'latest'], { label: `start-nonce:${wallet.address}` });
      assert.equal(BigInt(nonce.response.result), 0n, `account nonce not fresh: ${wallet.address}`);
    }
    const gasEnvelope = await rpc('eth_gasPrice', [], { label: 'gas-price' });
    ctx.gasPrice = BigInt(gasEnvelope.response.result) * 2n + 1n;
    report.chain = { chainId: CHAIN_ID.toString(), genesisBlock: '0', genesisHash: genesisEnvelope.response.result.hash, genesisTimestamp: GENESIS_TIMESTAMP.toString(), gasPrice: ctx.gasPrice.toString(), author: wallets[1].address.toLowerCase() };

    for (let armIndex = 0; armIndex < ARMS.length; armIndex++) {
      const arm = ARMS[armIndex];
      const expected = expectations.arms[arm.name];
      const deployer = wallets[arm.deployerIndex];
      const plan = createDeploymentPlans(resolvedArtifactRoot, artifacts, deployer.address, arm.poison);
      exact(`${arm.name}: deployment inputs`, deploymentInputPins(plan.plans), expectedDeploymentInputs(expected.deployment));
      const fixtureBuild = buildFixture(plan, artifacts, wallets[1], arm.scale);
      exact(`${arm.name}: types`, fixtureBuild.types, expected.types);
      exact(`${arm.name}: fixture`, fixtureBuild.fixture, expected.fixture);
      const attachData = artifacts.IndexModule.iface.encodeFunctionData('attach', [plan.addresses.Ledger]);
      const setupTransactions = [
        transactionPin('attach', deployer.address, plan.addresses.IndexModule, 3, attachData),
        transactionPin('prefix', deployer.address, plan.addresses.Producer, 7, fixtureBuild.fixture.prefix.calldata),
      ];
      exact(`${arm.name}: setup transactions`, setupTransactions, expected.setupTransactions);

      const armBase = armIndex * 9;
      const deployed = [];
      for (const candidate of plan.plans.slice(0, 3)) deployed.push(await deployPlan(ctx, deployer, candidate, expected.deployment[deployed.length], armBase + candidate.nonce + 1));
      const attach = await sendTransaction(ctx, deployer, { to: plan.addresses.IndexModule, data: attachData, gasLimit: SETUP_GAS }, 3, armBase + 4, `${arm.name}:attach`);
      assert.equal(Number(BigInt(attach.receipt.status)), 1, `${arm.name}: attach status`);
      for (const candidate of plan.plans.slice(3)) deployed.push(await deployPlan(ctx, deployer, candidate, expected.deployment[deployed.length], armBase + candidate.nonce + 1));
      const prefix = await sendTransaction(ctx, deployer, { to: plan.addresses.Producer, data: fixtureBuild.fixture.prefix.calldata, gasLimit: SETUP_GAS }, 7, arm.preBlock, `${arm.name}:prefix`);
      assert.equal(Number(BigInt(prefix.receipt.status)), 1, `${arm.name}: prefix status`);
      const latest = await rpc('eth_blockNumber', [], { label: `${arm.name}:pre-block` });
      assert.equal(Number(BigInt(latest.response.result)), arm.preBlock, `${arm.name}: pre block drift`);
      const preHeader = await ctx.header(arm.preBlock);
      assert.equal(preHeader.response.result.hash.toLowerCase(), ctx.lastBlockHash.toLowerCase(), `${arm.name}: pre header hash`);
      assert(BigInt(preHeader.response.result.timestamp) < DEADLINE, `${arm.name}: pre deadline`);

      const ledgerDeployment = deployed.find((row) => row.result.role === 'Ledger');
      const a1 = buildA1(artifacts, fixtureBuild, wallets[1], ledgerDeployment.result.runtimeCodehash);
      exact(`${arm.name}: A1`, a1, expected.a1);
      const attemptInput = { from: wallets[1].address.toLowerCase(), to: plan.addresses.Ledger.toLowerCase(), nonce: arm.authorNonce, data: a1.calldata, expectedStatus: arm.kind === 'refusal' ? 0 : 1 };
      exact(`${arm.name}: attempt input`, attemptInput, {
        from: expected.attempt.from, to: expected.attempt.to, nonce: expected.attempt.nonce,
        data: expected.attempt.data, expectedStatus: expected.attempt.expectedStatus,
      });

      const preReads = await observeMap(ctx, expected.readCalls, expected.pre.reads, arm.preBlock, 'reads');
      const preStorage = await observeMap(ctx, expected.storageCalls, expected.pre.storage, arm.preBlock, 'storage');
      const staticCall = { from: wallets[1].address, to: plan.addresses.Ledger, data: a1.calldata, gas: qty(ATTEMPT_GAS) };
      const staticEnvelope = await rpc('eth_call', [staticCall, qty(arm.preBlock)], { label: `${arm.name}:static`, allowError: arm.kind === 'refusal' });
      let staticResult;
      if (arm.kind === 'refusal') {
        assert(staticEnvelope.response.error, `${arm.name}: static refusal succeeded`);
        const errorData = extractErrorData(staticEnvelope.response.error);
        assertExactError(errorData, expected.attempt.errorData);
        const localError = arm.name === 'scale7'
          ? '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001671756f74653a207363616c65206d757374206265203600000000000000000000'
          : artifacts.IndexModule.iface.encodeErrorResult('IndexPoisoned', [fixtureBuild.fixture.concept]);
        assertExactError(errorData, localError);
        staticResult = { rpcId: staticEnvelope.request.id, errorData, returnData: null };
      } else {
        assert(!staticEnvelope.response.error, 'calibration static call failed');
        const returnData = normalizeHex(staticEnvelope.response.result, 'calibration return');
        const localReturn = artifacts.Ledger.iface.encodeFunctionResult('publishSigned', [a1.publicationId, 7]);
        assertRawEqual('calibration return', returnData, expected.attempt.returnData);
        assertRawEqual('calibration local return', returnData, localReturn);
        staticResult = { rpcId: staticEnvelope.request.id, errorData: null, returnData };
      }

      const attempt = await sendTransaction(ctx, wallets[1], { to: plan.addresses.Ledger, data: a1.calldata, gasLimit: ATTEMPT_GAS }, arm.authorNonce, arm.postBlock, `${arm.name}:attempt`);
      const classification = classifyReceipt(arm.kind, attempt.receipt);
      assertAttemptLink(staticCall, attempt.transaction);
      assert(BigInt(attempt.header.timestamp) < DEADLINE, `${arm.name}: attempt deadline`);
      const postReads = await observeMap(ctx, expected.readCalls, expected.post.reads, arm.postBlock, 'reads');
      const postStorage = await observeMap(ctx, expected.storageCalls, expected.post.storage, arm.postBlock, 'storage');
      if (arm.kind === 'refusal') {
        exact(`${arm.name}: logical rollback`, postReads, preReads);
        exact(`${arm.name}: storage rollback`, postStorage, preStorage);
      }
      report.arms[arm.name] = {
        deployment: deployed.map((row) => row.result), setupTransactions, types: fixtureBuild.types, fixture: fixtureBuild.fixture, a1,
        pre: { blockNumber: String(arm.preBlock), blockHash: preHeader.response.result.hash, reads: preReads, storage: preStorage },
        static: staticResult,
        mined: { transactionHash: attempt.hash, receiptId: attempt.receiptId, status: classification.status, gasUsed: classification.gasUsed, blockHash: classification.blockHash },
        post: { blockNumber: String(arm.postBlock), blockHash: attempt.receipt.blockHash, reads: postReads, storage: postStorage },
      };
      report.gas.deployment[arm.name] = Object.fromEntries(deployed.map((row) => [row.result.role, row.gasUsed]));
      report.gas.setup[arm.name] = { attach: decimal(attach.receipt.gasUsed), prefix: decimal(prefix.receipt.gasUsed) };
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
    report.finishedAt = new Date().toISOString();
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
  const result = await runRollbackControl({
    rpcUrl: args.rpc, artifactRoot: resolve(args.artifacts), expectations: JSON.parse(expectationsBytes),
    expectationsPath, expectationsSha256: sha256(expectationsBytes), runDir: resolve(args['run-dir']), mnemonic: args.mnemonic ?? DEFAULT_MNEMONIC,
  });
  process.stdout.write(`${result.outputs.reportPath}\n${result.outputs.rawPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
