// Disposable bootstrap framing only. Matching bytes do not authenticate an initializer or code provenance.
import { AbiCoder, keccak256, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeSeed as encodeSeedV1, decodeSeed as decodeSeedV1 } from '../../2026-09-04-mvp-c0-foundation/reference/run-codec.mjs';

const abi = AbiCoder.defaultAbiCoder();
const VERSION = 2;
const SEED_MIN = 712;
const SEED_MAX = 13690;
const DEPLOYMENT_BYTES = 498;
const SELECTION_BYTES = 288;
const INIT_CONFIG_BYTES = 224;
const GAS_FLOOR = 16777216n;
const RESERVED_LABEL = 'c0/init-selection/1';
const domain = value => keccak256(toUtf8Bytes(value));
const DOM_SEED = domain('efs2/mvp-c0/experiment-seed/2');
const DOM_DEPLOYMENT = domain('efs2/mvp-c0/experiment-deployment/2');
const DOM_PROFILE = domain('efs2/mvp-c0/profile/1');
const DOM_SELECTION = domain('efs2/mvp-c0/initialization-selection/1');
const DOM_NULL_POLICY = domain('efs2/mvp-c0/null-policy/1');
const DOM_INITIAL_POLICY = domain('efs2/mvp-c0/initial-policy/1');

function check(ok, reason) {
  if (!ok) throw new Error(`C0 bootstrap codec: ${reason}`);
}

function parseBytes(value, { exact, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  check(typeof value === 'string' && /^0x(?:[0-9a-fA-F]{2})*$/.test(value), 'hex bytes');
  const length = (value.length - 2) / 2;
  check(exact === undefined ? length >= min && length <= max : length === exact, 'byte length');
  return Buffer.from(value.slice(2), 'hex');
}

function fixedHex(value, width, allowZero = false) {
  check(typeof value === 'string' && new RegExp(`^0x[0-9a-fA-F]{${width * 2}}$`).test(value), 'hex width');
  const bytes = Buffer.from(value.slice(2), 'hex');
  check(allowZero || bytes.some(byte => byte !== 0), 'zero required field');
  return bytes;
}

function unsigned(value, width) {
  check(
    typeof value === 'bigint' || typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value),
    'integer must be BigInt or canonical decimal',
  );
  const result = BigInt(value);
  check(result >= 0n && result < (1n << BigInt(width * 8)), 'integer width');
  return result;
}

function small(value, max, name) {
  check(typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max, name);
  return value;
}

function hex(bytes) {
  return '0x' + bytes.toString('hex');
}

function denseOwnCommitments(base) {
  check(base && typeof base === 'object', 'base seed');
  for (const name of ['sourceCommitments', 'toolchainCommitments']) {
    const values = base[name];
    check(Array.isArray(values), `${name} array`);
    for (let index = 0; index < values.length; ++index) {
      check(Object.prototype.hasOwnProperty.call(values, index), `${name} own array index`);
    }
  }
}

function reservedDigest(base) {
  let digest;
  let matches = 0;
  for (const entry of base.sourceCommitments) {
    if (entry.label === RESERVED_LABEL) {
      ++matches;
      digest = entry.digest;
    }
  }
  check(matches === 1, 'reserved selection membership');
  fixedHex(digest, 32);
  return digest.toLowerCase();
}

function validateSeed(value) {
  check(value && typeof value === 'object', 'seed object');
  denseOwnCommitments(value.base);
  const base = parseBytes(encodeSeedV1(value.base));
  fixedHex(value.admissionLibraryCreate2Salt, 32, true);
  fixedHex(value.preparationHelperCreate2Salt, 32, true);
  fixedHex(value.admissionCreationCodeTemplateHash, 32);
  fixedHex(value.preparationCreationCodeTemplateHash, 32);
  fixedHex(value.coreLinkReferencesHash, 32);
  return { base, selection: reservedDigest(value.base) };
}

export function encodeSeedV2(value) {
  const validated = validateSeed(value);
  const encoded = Buffer.concat([
    Buffer.from('0002', 'hex'), validated.base,
    fixedHex(value.admissionLibraryCreate2Salt, 32, true),
    fixedHex(value.preparationHelperCreate2Salt, 32, true),
    fixedHex(value.admissionCreationCodeTemplateHash, 32),
    fixedHex(value.preparationCreationCodeTemplateHash, 32),
    fixedHex(value.coreLinkReferencesHash, 32),
  ]);
  check(encoded.length >= SEED_MIN && encoded.length <= SEED_MAX, 'seed length');
  return hex(encoded);
}

export function decodeSeedV2(encoded) {
  const bytes = parseBytes(encoded, { min: SEED_MIN, max: SEED_MAX });
  check(bytes.readUInt16BE(0) === VERSION, 'seed version');
  const end = bytes.length - 160;
  const value = {
    base: decodeSeedV1(hex(bytes.subarray(2, end))),
    admissionLibraryCreate2Salt: hex(bytes.subarray(end, end + 32)),
    preparationHelperCreate2Salt: hex(bytes.subarray(end + 32, end + 64)),
    admissionCreationCodeTemplateHash: hex(bytes.subarray(end + 64, end + 96)),
    preparationCreationCodeTemplateHash: hex(bytes.subarray(end + 96, end + 128)),
    coreLinkReferencesHash: hex(bytes.subarray(end + 128, end + 160)),
  };
  fixedHex(value.admissionCreationCodeTemplateHash, 32);
  fixedHex(value.preparationCreationCodeTemplateHash, 32);
  fixedHex(value.coreLinkReferencesHash, 32);
  reservedDigest(value.base);
  return value;
}

function abiDomainHash(domainWord, values) {
  return keccak256(abi.encode(Array(values.length + 1).fill('bytes32'), [domainWord, ...values]));
}

export function experimentSeedV2(value) {
  return abiDomainHash(DOM_SEED, [keccak256(encodeSeedV2(value))]);
}

const componentNames = ['core', 'byteStore', 'admissionLibrary', 'preparationHelper'];

function validateComponent(value) {
  check(value && typeof value === 'object', 'component object');
  fixedHex(value.account, 20);
  fixedHex(value.create2Salt, 32, true);
  fixedHex(value.initCodeHash, 32);
  fixedHex(value.runtimeCodeHash, 32);
}

function validateDeployment(value) {
  check(value && typeof value === 'object', 'deployment object');
  fixedHex(value.experimentSeed, 32);
  for (const name of componentNames) validateComponent(value[name]);
  const accounts = componentNames.map(name => value[name].account.toLowerCase());
  check(new Set(accounts).size === accounts.length, 'duplicate component account');
}

function encodeComponent(value) {
  return Buffer.concat([
    fixedHex(value.account, 20), fixedHex(value.create2Salt, 32, true),
    fixedHex(value.initCodeHash, 32), fixedHex(value.runtimeCodeHash, 32),
  ]);
}

export function encodeDeploymentV2(value) {
  validateDeployment(value);
  const encoded = Buffer.concat([
    Buffer.from('0002', 'hex'), fixedHex(value.experimentSeed, 32),
    ...componentNames.map(name => encodeComponent(value[name])),
  ]);
  check(encoded.length === DEPLOYMENT_BYTES, 'deployment length');
  return hex(encoded);
}

function decodeComponent(bytes, position) {
  return {
    account: hex(bytes.subarray(position, position + 20)),
    create2Salt: hex(bytes.subarray(position + 20, position + 52)),
    initCodeHash: hex(bytes.subarray(position + 52, position + 84)),
    runtimeCodeHash: hex(bytes.subarray(position + 84, position + 116)),
  };
}

export function decodeDeploymentV2(encoded) {
  const bytes = parseBytes(encoded, { exact: DEPLOYMENT_BYTES });
  check(bytes.readUInt16BE(0) === VERSION, 'deployment version');
  const value = { experimentSeed: hex(bytes.subarray(2, 34)) };
  for (const [index, name] of componentNames.entries()) value[name] = decodeComponent(bytes, 34 + index * 116);
  validateDeployment(value);
  check(encodeDeploymentV2(value) === hex(bytes), 'noncanonical deployment');
  return value;
}

export function experimentCommitmentV2(value) {
  return abiDomainHash(DOM_DEPLOYMENT, [value.experimentSeed, keccak256(encodeDeploymentV2(value))]);
}

export function c0ProfileId(commitment) {
  fixedHex(commitment, 32);
  return abiDomainHash(DOM_PROFILE, [commitment]);
}

export function selectionDigest(value) {
  return validateSeed(value).selection;
}

export function nullPolicyBytes() {
  return abi.encode(['bytes32'], [DOM_NULL_POLICY]);
}

function validateSelection(value) {
  check(value && typeof value === 'object', 'selection object');
  small(value.initConfigVersion, 0xffff, 'init config version width');
  small(value.finalityRuleKind, 0xff, 'finality kind width');
  small(value.finalityParam, 0xffffffff, 'finality parameter width');
  small(value.upgradeAuthorityKind, 0xff, 'upgrade kind width');
  const gas = unsigned(value.declaredTxGasLimit, 8);
  fixedHex(value.upgradeAuthorityRef, 32, true);
  fixedHex(value.nullPolicyHash, 32);
  fixedHex(value.bootstrapExecutor, 20);
  check(value.initConfigVersion === 1, 'selection version');
  check(value.finalityRuleKind <= 3, 'finality kind');
  check(value.finalityRuleKind === 2 ? value.finalityParam > 0 : value.finalityParam === 0, 'finality parameter');
  check(value.upgradeAuthorityKind === 0 && /^0x0{64}$/i.test(value.upgradeAuthorityRef), 'immutable upgrade authority');
  check(gas >= GAS_FLOOR, 'declared gas floor');
  check(value.nullPolicyHash.toLowerCase() === keccak256(nullPolicyBytes()).toLowerCase(), 'null policy');
  return gas;
}

export function encodeSelection(value) {
  const gas = validateSelection(value);
  return abi.encode(
    ['bytes32','uint16','uint8','uint32','uint8','bytes32','uint64','bytes32','address'],
    [DOM_SELECTION, value.initConfigVersion, value.finalityRuleKind, value.finalityParam,
      value.upgradeAuthorityKind, value.upgradeAuthorityRef, gas, value.nullPolicyHash, value.bootstrapExecutor],
  ).toLowerCase();
}

export function decodeSelection(encoded) {
  const bytes = parseBytes(encoded, { exact: SELECTION_BYTES });
  let decoded;
  try {
    decoded = abi.decode(['bytes32','uint16','uint8','uint32','uint8','bytes32','uint64','bytes32','address'], hex(bytes));
  } catch {
    throw new Error('C0 bootstrap codec: selection ABI');
  }
  const value = {
    initConfigVersion: Number(decoded[1]), finalityRuleKind: Number(decoded[2]), finalityParam: Number(decoded[3]),
    upgradeAuthorityKind: Number(decoded[4]), upgradeAuthorityRef: decoded[5].toLowerCase(),
    declaredTxGasLimit: decoded[6], nullPolicyHash: decoded[7].toLowerCase(), bootstrapExecutor: decoded[8].toLowerCase(),
  };
  check(decoded[0].toLowerCase() === DOM_SELECTION.toLowerCase(), 'selection domain');
  validateSelection(value);
  check(encodeSelection(value) === hex(bytes), 'noncanonical selection');
  return value;
}

export function openSelection(encoded, expectedDigest) {
  const value = decodeSelection(encoded);
  fixedHex(expectedDigest, 32);
  check(keccak256(encoded).toLowerCase() === expectedDigest.toLowerCase(), 'selection opening');
  return value;
}

export function initConfig(value, experimentCommitment) {
  const gas = validateSelection(value);
  fixedHex(experimentCommitment, 32);
  const policy = abiDomainHash(DOM_INITIAL_POLICY, [value.nullPolicyHash, experimentCommitment]);
  return abi.encode(
    ['uint16','uint8','uint32','uint8','bytes32','uint64','bytes32'],
    [value.initConfigVersion, value.finalityRuleKind, value.finalityParam,
      value.upgradeAuthorityKind, value.upgradeAuthorityRef, gas, policy],
  ).toLowerCase();
}

export function requireInitConfig(encoded, value, experimentCommitment) {
  const bytes = parseBytes(encoded, { exact: INIT_CONFIG_BYTES });
  check(hex(bytes) === initConfig(value, experimentCommitment), 'InitConfig opening');
}
