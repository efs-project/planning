#!/usr/bin/env node
// Independent-of-candidate helper: standard ethers ABI/EIP-712 primitives only.
// Usage: NODE_PATH=<ethers-parent> node vectors/verify-profile-b.mjs [profile-b.json]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const {
  AbiCoder,
  Signature,
  SigningKey,
  TypedDataEncoder,
  Wallet,
  concat,
  id,
  keccak256,
  recoverAddress,
  toBeHex,
  toUtf8Bytes,
  version,
  zeroPadValue,
} = require('ethers');

const coder = AbiCoder.defaultAbiCoder();
const ZERO = zeroPadValue('0x00', 32);
if (version !== '6.15.0') throw new Error(`expected ethers 6.15.0, got ${version}`);
const hashText = (text) => keccak256(toUtf8Bytes(text));
const word = (value) => zeroPadValue(toBeHex(value), 32);
const encHash = (types, values) => keccak256(coder.encode(types, values));

const actionTuple =
  'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
const intentType =
  'PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)';
const domainType = 'EIP712Domain(string name,string version)';
const domain = { name: 'EFS2-RoadB-Lab', version: '1' };
const types = {
  PublicationIntent: [
    ['realmId', 'bytes32'],
    ['coreCodeCommitment', 'bytes32'],
    ['author', 'address'],
    ['nonce', 'uint64'],
    ['deadline', 'uint64'],
    ['acceptanceProfile', 'bytes32'],
    ['indexObligations', 'bytes32'],
    ['actionsHash', 'bytes32'],
  ].map(([name, type]) => ({ name, type })),
};

// Public, deterministic, throwaway test key. Never fund or reuse it.
const privateKey = hashText('efs2/road-b-lab/throwaway-vector-key/1');
const wallet = new Wallet(privateKey);
const author = wallet.address;
const principal = zeroPadValue(author, 32);

const domains = {
  record: { text: 'efs2/record/1', hash: hashText('efs2/record/1') },
  subject: { text: 'efs2/subject/1', hash: hashText('efs2/subject/1') },
  position: { text: 'efs2/position/1', hash: hashText('efs2/position/1') },
  binding: { text: 'efs2/binding/1', hash: hashText('efs2/binding/1') },
  scope: { text: 'efs2/vk/binding-scope/1', hash: hashText('efs2/vk/binding-scope/1') },
};
const constants = {
  quoteTypeId: hashText('lab/type/quote/1'),
  headPurpose: hashText('efs2/purpose/head/1'),
  folderPurpose: hashText('efs2/purpose/folder/1'),
  realmId: hashText('lab/realm/1'),
};
const body = word(3000n);
const bodyHash = keccak256(body);
const recordId = encHash(
  ['bytes32', 'bytes32', 'bytes32'],
  [domains.record.hash, constants.quoteTypeId, bodyHash],
);
const salt = word(1n);
const subjectId = encHash(['bytes32', 'bytes32', 'bytes32'], [domains.subject.hash, principal, salt]);
const folderId = hashText('/swaps');
const nameHash = hashText('eth-usdc');
const mutatedNameHash = hashText('eth-usdc-mutated');
const action = (overrides) => ({
  kind: 0,
  typeId: ZERO,
  bodyHashOrRecordId: ZERO,
  purpose: ZERO,
  subject: ZERO,
  role: ZERO,
  target: ZERO,
  expectedRevision: 0,
  salt: ZERO,
  ...overrides,
});
const actions = [
  action({ kind: 5, salt }),
  action({ kind: 1, typeId: constants.quoteTypeId, bodyHashOrRecordId: bodyHash }),
  action({ kind: 3, purpose: constants.headPurpose, subject: subjectId, target: recordId }),
  action({ kind: 3, purpose: constants.folderPurpose, subject: folderId, role: nameHash, target: subjectId }),
];
const bodies = ['0x', body, '0x', '0x'];
const actionsEncoded = coder.encode([actionTuple], [actions]);
const actionsHash = keccak256(actionsEncoded);

// Literal context from retained run 322b320, compiled source dcc7b94.
const ruleContext = {
  registryAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  registryEpoch: '5',
  acceptorAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  acceptorCodehash: '0x1a61860433c036adda04e35df85a7b9ce063f5a575653a4483c30705c3a2cca7',
  indexModuleAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  indexModuleCodehash: '0x10371a99cf35210c84c10599e43704ef1387fd159f5e4a18a91af5aac1f0d075',
};
let acceptanceProfile = ZERO;
for (const item of actions) {
  if (item.kind !== 1 && item.kind !== 2) continue;
  acceptanceProfile = encHash(
    ['bytes32', 'bytes32', 'bytes32', 'uint64'],
    [acceptanceProfile, item.typeId, ruleContext.acceptorCodehash, BigInt(ruleContext.registryEpoch)],
  );
}
const indexObligations = encHash(
  ['address', 'bytes32'],
  [ruleContext.indexModuleAddress, ruleContext.indexModuleCodehash],
);
const intent = {
  realmId: constants.realmId,
  coreCodeCommitment: '0xb2bbbd7b94f6398de8c783f7a3d2e6accc8e651d3302c404db1cd66e13195465',
  author,
  nonce: '0',
  deadline: '1800000000',
  acceptanceProfile,
  indexObligations,
};
const intentTypehash = hashText(intentType);
const domainTypehash = hashText(domainType);
const domainSeparator = keccak256(
  coder.encode(
    ['bytes32', 'bytes32', 'bytes32'],
    [domainTypehash, hashText(domain.name), hashText(domain.version)],
  ),
);
const structValues = [
  intentTypehash,
  intent.realmId,
  intent.coreCodeCommitment,
  intent.author,
  BigInt(intent.nonce),
  BigInt(intent.deadline),
  intent.acceptanceProfile,
  intent.indexObligations,
  actionsHash,
];
const structEncoded = coder.encode(
  ['bytes32', 'bytes32', 'bytes32', 'address', 'uint64', 'uint64', 'bytes32', 'bytes32', 'bytes32'],
  structValues,
);
const structHash = keccak256(structEncoded);
const digestPreimage = concat(['0x1901', domainSeparator, structHash]);
const digest = keccak256(digestPreimage);
const typedValue = { ...intent, nonce: BigInt(intent.nonce), deadline: BigInt(intent.deadline), actionsHash };
if (TypedDataEncoder.hashDomain(domain) !== domainSeparator) throw new Error('domain encoder mismatch');
if (TypedDataEncoder.hash(domain, types, typedValue) !== digest) throw new Error('typed-data encoder mismatch');
const signature = new SigningKey(privateKey).sign(digest);
const serialized = signature.serialized;
const secp256k1HalfN = BigInt('0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0');
if ((serialized.length - 2) / 2 !== 65) throw new Error('signature is not 65 bytes');
if (signature.v !== 27 && signature.v !== 28) throw new Error('signature v is not 27/28');
if (BigInt(signature.s) > secp256k1HalfN) throw new Error('signature is high-s');
const recovered = recoverAddress(digest, signature);
const signedViaWallet = await wallet.signTypedData(domain, types, typedValue);
if (Signature.from(signedViaWallet).serialized !== serialized) throw new Error('signTypedData mismatch');

const positionHead = encHash(
  ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
  [domains.position.hash, constants.headPurpose, subjectId, ZERO],
);
const bindingHead = encHash(['bytes32', 'bytes32', 'bytes32'], [domains.binding.hash, principal, positionHead]);
const scopeHead = encHash(
  ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
  [domains.scope.hash, principal, constants.headPurpose, subjectId],
);
const positionFolder = encHash(
  ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
  [domains.position.hash, constants.folderPurpose, folderId, nameHash],
);
const bindingFolder = encHash(['bytes32', 'bytes32', 'bytes32'], [domains.binding.hash, principal, positionFolder]);
const scopeFolder = encHash(
  ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
  [domains.scope.hash, principal, constants.folderPurpose, folderId],
);
const publicationId = encHash(['address', 'uint64', 'bytes32'], [author, BigInt(intent.nonce), actionsHash]);

const mutatedActions = actions.map((item) => ({ ...item }));
mutatedActions[3].role = mutatedNameHash;
const mutatedActionsHash = keccak256(coder.encode([actionTuple], [mutatedActions]));
const mutatedStructValues = [...structValues];
mutatedStructValues[8] = mutatedActionsHash;
const mutatedStructHash = encHash(
  ['bytes32', 'bytes32', 'bytes32', 'address', 'uint64', 'uint64', 'bytes32', 'bytes32', 'bytes32'],
  mutatedStructValues,
);
const mutatedDigest = keccak256(concat(['0x1901', domainSeparator, mutatedStructHash]));
const mutationRecovered = recoverAddress(mutatedDigest, signature);

const vector = {
  schema: 'efs2-road-b-public-profile-vector/1',
  standing: 'candidate-authored deterministic positive signature vector; not an observed transaction or independent system proof',
  provenance: {
    sourceCommit: 'dcc7b946d2ac8dfcf22103069127a9d1809df974',
    ledgerGitBlob: 'c454e2699b9335c0a23bbfb6ed72e1ba0e5c7a14',
    keysGitBlob: 'a291be9446ed1e4c2cb9bb14608ae7ca06a1c238',
    interfacesGitBlob: '3155357f6d3e58c910828df2eb798ecb53ea24f9',
    typeRegistryGitBlob: '235174fb951ba28084723448bd89ecfda340a6ec',
    indexModuleGitBlob: '3c624e7b91fd61c09accc916bbf6edadc36e3c69',
    retainedRunCommit: '322b320',
    retainedPacketSha256: '7bd5409a4b306d8e0705187094fa482b31efcad471260ae93f57eebd0b22fcce',
    compiler: '0.8.30+commit.73712a01',
    optimizerRuns: 200,
    viaIR: true,
    evmVersion: 'cancun',
    chainId: '31337',
    ledgerAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  },
  publicThrowawayKey: { warning: 'DO NOT FUND OR REUSE', derivation: 'keccak256(utf8(efs2/road-b-lab/throwaway-vector-key/1))', privateKey },
  author,
  principal,
  actionTuple,
  actionKinds: { PUBLISH: 1, REUSE: 2, BIND: 3, UNBIND: 4, CREATE: 5, WITHDRAW: 6 },
  domains,
  constants,
  inputs: { body, bodies, bodyHash, recordId, salt, subjectId, folderId, nameHash },
  actions,
  actionCommitment: { actionsEncoded, actionsHash },
  ruleContext,
  intent,
  eip712: {
    domainType,
    domain,
    domainTypehash,
    domainSeparator,
    intentType,
    intentTypehash,
    structEncoded,
    structHash,
    digestPreimage,
    digest,
  },
  signature: {
    encoding: 'r[32] || s[32] || v[1]',
    r: signature.r,
    s: signature.s,
    v: signature.v,
    yParity: signature.yParity,
    serialized,
    signedViaWallet,
    recovered,
    recoveredMatchesAuthor: recovered === author,
  },
  derivedKeys: { positionHead, bindingHead, scopeHead, positionFolder, bindingFolder, scopeFolder, publicationId },
  mutationExpectation: {
    change: 'actions[3].role: keccak256(utf8(eth-usdc)) -> keccak256(utf8(eth-usdc-mutated))',
    mutatedNameHash,
    mutatedActionsHash,
    mutatedStructHash,
    mutatedDigest,
    recoveredWithOriginalSignature: mutationRecovered,
    recoveredMatchesAuthor: mutationRecovered === author,
    candidateExpectedResult: 'executeSigned recomputes actionsHash and reverts E_SIGNATURE()',
    errorSelector: id('E_SIGNATURE()').slice(0, 10),
  },
};

const normalize = (value) => JSON.parse(JSON.stringify(value));
if (process.argv[2]) {
  const supplied = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const expected = normalize(vector);
  if (JSON.stringify(supplied) !== JSON.stringify(expected)) throw new Error('profile-b.json differs from deterministic recomputation');
  console.log(`PASS profile-b.json ethers=${version} digest=${digest} signer=${recovered}`);
} else {
  console.log(JSON.stringify(normalize(vector), null, 2));
}
