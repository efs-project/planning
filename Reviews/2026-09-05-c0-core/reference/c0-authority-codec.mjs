import { AbiCoder, concat, keccak256, toUtf8Bytes, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

export class UnsupportedCodecError extends Error {
  constructor(code) {
    super(code);
    this.name = 'UnsupportedCodecError';
    this.code = code;
  }
}

export class InvalidCodecError extends Error {
  constructor(code) {
    super(code);
    this.name = 'InvalidCodecError';
    this.code = code;
  }
}

const failFraming = () => { throw new InvalidCodecError('INVALID_FRAMING'); };
const failValue = () => { throw new InvalidCodecError('INVALID_VALUE'); };
const hex = bytes => '0x' + bytes.toString('hex');
const abi = AbiCoder.defaultAbiCoder();
const digest = text => keccak256(toUtf8Bytes(text));
const max = bits => (1n << BigInt(bits)) - 1n;
const PUBLICATION_DOMAIN = keccak256(abi.encode(
  ['bytes32', 'bytes32', 'bytes32'],
  [digest('EIP712Domain(string name,string version)'), digest('EFS2-Envelope'), digest('1')],
));
const PUBLICATION_TYPEHASH = digest('PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)');
const EXPECTED_REVISION_TYPEHASH = digest('ExpectedRevision(uint16 leafIndex,uint32 revision)');
const EFFECTS_TYPEHASH = digest('C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)');
const WRITE_DOMAIN_TYPEHASH = digest('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)');
const WRITE_DOMAIN_NAME_HASH = digest('EFS2-MVP-C0-WritePlan');
const VERSION_HASH = digest('1');
const WRITE_PLAN_TYPEHASH = digest('WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)');

function checked(action) {
  try {
    return action();
  } catch (error) {
    if (error instanceof InvalidCodecError) throw error;
    failValue();
  }
}

function object(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) failValue();
  return value;
}

function field(value, name) {
  object(value);
  if (!Object.hasOwn(value, name)) failValue();
  return value[name];
}

function fixedHex(value, bytes) {
  if (typeof value !== 'string' || !new RegExp(`^0x[0-9a-f]{${bytes * 2}}$`).test(value)) failValue();
  return value;
}

function unsigned(value, bits) {
  if (typeof value !== 'bigint' || value < 0n || value > max(bits)) failValue();
  return value;
}

function discriminator(value, maximum) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) failValue();
  return value;
}

function headerValues(header) {
  const values = [
    unsigned(field(header, 'profile'), 16),
    fixedHex(field(header, 'principalId'), 32),
    fixedHex(field(header, 'authorityRef'), 32),
    unsigned(field(header, 'authEpoch'), 64),
    fixedHex(field(header, 'pubNonce'), 32),
    unsigned(field(header, 'notAfter'), 64),
  ];
  if (values[0] !== 1n || values[2] !== ZeroHash || values[3] !== 0n) failValue();
  return values;
}

function revisionValues(rows) {
  if (!Array.isArray(rows) || rows.length > 64) failValue();
  let previous = -1;
  const values = [];
  for (let i = 0; i < rows.length; i++) {
    if (!Object.hasOwn(rows, i)) failValue();
    const row = rows[i];
    const leafIndex = discriminator(field(row, 'leafIndex'), 63);
    const revision = unsigned(field(row, 'revision'), 32);
    if (leafIndex <= previous) failValue();
    previous = leafIndex;
    values.push([leafIndex, revision]);
  }
  return values;
}

function effectsValues(effects) {
  return [
    fixedHex(field(effects, 'realmId'), 32),
    fixedHex(field(effects, 'core'), 20),
    fixedHex(field(effects, 'routeConfigId'), 32),
    fixedHex(field(effects, 'genesisReceiptHash'), 32),
    discriminator(field(effects, 'operationKind'), 255),
    fixedHex(field(effects, 'envelopeId'), 32),
    unsigned(field(effects, 'leafMask'), 64),
    fixedHex(field(effects, 'expectedRevisionsHash'), 32),
    fixedHex(field(effects, 'stateByteStore'), 20),
    fixedHex(field(effects, 'byteCommitment'), 32),
  ];
}

function planValues(plan) {
  return [
    fixedHex(field(plan, 'c0ProfileId'), 32),
    fixedHex(field(plan, 'publicationDigest'), 32),
    fixedHex(field(plan, 'realmId'), 32),
    fixedHex(field(plan, 'realmEffectsDigest'), 32),
    fixedHex(field(plan, 'executor'), 20),
    fixedHex(field(plan, 'executorCodeHash'), 32),
    unsigned(field(plan, 'nonceKey'), 192),
    unsigned(field(plan, 'nonceSeq'), 64),
    unsigned(field(plan, 'notAfter'), 64),
  ];
}

export function publicationDigest(header, recordIds) {
  return checked(() => {
    const values = headerValues(header);
    if (!Array.isArray(recordIds) || recordIds.length < 1 || recordIds.length > 64) failValue();
    const ids = [];
    for (let i = 0; i < recordIds.length; i++) {
      if (!Object.hasOwn(recordIds, i)) failValue();
      ids.push(fixedHex(recordIds[i], 32));
    }
    const recordIdsHash = keccak256(concat(ids));
    const structHash = keccak256(abi.encode(
      ['bytes32', 'uint16', 'bytes32', 'bytes32', 'uint64', 'bytes32', 'uint64', 'bytes32'],
      [PUBLICATION_TYPEHASH, ...values, recordIdsHash],
    ));
    return keccak256(concat(['0x1901', PUBLICATION_DOMAIN, structHash]));
  });
}

export function expectedRevisionsHash(rows) {
  return checked(() => keccak256(concat(revisionValues(rows).map(([leafIndex, revision]) =>
    keccak256(abi.encode(['bytes32', 'uint16', 'uint32'], [EXPECTED_REVISION_TYPEHASH, leafIndex, revision]))))));
}

export function effectsHash(effects) {
  return checked(() => keccak256(abi.encode(
    ['bytes32', 'bytes32', 'address', 'bytes32', 'bytes32', 'uint8', 'bytes32', 'uint64', 'bytes32', 'address', 'bytes32'],
    [EFFECTS_TYPEHASH, ...effectsValues(effects)],
  )));
}

export function domainSeparator(chainId, core) {
  return checked(() => keccak256(abi.encode(
    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    [WRITE_DOMAIN_TYPEHASH, WRITE_DOMAIN_NAME_HASH, VERSION_HASH, unsigned(chainId, 256), fixedHex(core, 20)],
  )));
}

export function planStructHash(plan) {
  return checked(() => keccak256(abi.encode(
    ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'address', 'bytes32', 'uint192', 'uint64', 'uint64'],
    [WRITE_PLAN_TYPEHASH, ...planValues(plan)],
  )));
}

export function planDigest(plan, chainId, core) {
  return checked(() => keccak256(concat([
    '0x1901', domainSeparator(chainId, core), planStructHash(plan),
  ])));
}

class Cursor {
  constructor(bytes) {
    this.bytes = bytes;
    this.offset = 0;
  }

  take(length) {
    if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > this.bytes.length) failFraming();
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  number(length) {
    const value = this.bigint(length);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) failFraming();
    return Number(value);
  }

  bigint(length) {
    const value = this.take(length);
    return value.length === 0 ? 0n : BigInt(hex(value));
  }
}

function readPlan(cursor) {
  return {
    c0ProfileId: hex(cursor.take(32)),
    publicationDigest: hex(cursor.take(32)),
    realmId: hex(cursor.take(32)),
    realmEffectsDigest: hex(cursor.take(32)),
    executor: hex(cursor.take(20)),
    executorCodeHash: hex(cursor.take(32)),
    nonceKey: cursor.bigint(24),
    nonceSeq: cursor.bigint(8),
    notAfter: cursor.bigint(8),
  };
}

function readEffects(cursor) {
  return {
    realmId: hex(cursor.take(32)),
    core: hex(cursor.take(20)),
    routeConfigId: hex(cursor.take(32)),
    genesisReceiptHash: hex(cursor.take(32)),
    operationKind: cursor.number(1),
    envelopeId: hex(cursor.take(32)),
    leafMask: cursor.bigint(8),
    expectedRevisionsHash: hex(cursor.take(32)),
    stateByteStore: hex(cursor.take(20)),
    byteCommitment: hex(cursor.take(32)),
  };
}

export function decodeBatchEvidence(input) {
  if (typeof input !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(input)) failFraming();
  const byteLength = (input.length - 2) / 2;
  if (byteLength > 1036) failFraming();
  const cursor = new Cursor(Buffer.from(input.slice(2), 'hex'));
  const evidenceVersion = cursor.number(2);
  if (evidenceVersion !== 1) throw new UnsupportedCodecError('UNSUPPORTED_VERSION');
  const branch = cursor.number(1);
  if (branch !== 1 && branch !== 2) throw new UnsupportedCodecError('UNSUPPORTED_BRANCH');
  const descriptorBytes = cursor.take(22);
  if (descriptorBytes[0] !== 1 || descriptorBytes[1] !== 0) failFraming();
  const descriptor = hex(descriptorBytes);
  const plan = readPlan(cursor);
  const effects = readEffects(cursor);
  const count = cursor.number(1);
  if (count > 64) failFraming();
  const expectedRevisions = [];
  let previousLeaf = -1;
  for (let i = 0; i < count; i++) {
    const leafIndex = cursor.number(2);
    const revision = cursor.bigint(4);
    if (leafIndex >= 64 || leafIndex <= previousLeaf) failFraming();
    previousLeaf = leafIndex;
    expectedRevisions.push({ leafIndex, revision });
  }
  const witness = hex(cursor.take(branch === 1 ? 65 : 0));
  const actualSigner = hex(cursor.take(20));
  const submittingCaller = hex(cursor.take(20));
  const transactionOrigin = hex(cursor.take(20));
  const observedCodeLength = cursor.number(1);
  if ((observedCodeLength !== 0 && observedCodeLength !== 23) || (branch === 2 && observedCodeLength !== 0)) failFraming();
  const observedCodeBytes = cursor.take(observedCodeLength);
  if (observedCodeLength === 23 && (observedCodeBytes[0] !== 0xef || observedCodeBytes[1] !== 1 || observedCodeBytes[2] !== 0)) failFraming();
  const observedAccountCode = hex(observedCodeBytes);
  const admittedAtTimestamp = cursor.bigint(8);
  const previousSequence = cursor.bigint(8);
  if (cursor.offset !== cursor.bytes.length) failFraming();
  return {
    evidenceVersion,
    branch,
    descriptor,
    plan,
    effects,
    expectedRevisions,
    witness,
    actualSigner,
    submittingCaller,
    transactionOrigin,
    observedAccountCode,
    admittedAtTimestamp,
    previousSequence,
  };
}
