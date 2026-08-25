'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, getAddress, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const DOMAIN_DESCRIPTOR = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/DESCRIPTOR'));
const DOMAIN_ORIGIN_LINEAGE = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/ORIGIN_LINEAGE'));
const DOMAIN_REALM = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/REALM'));
const DOMAIN_INITIAL_REVISION = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/INITIAL_REVISION'));
const DOMAIN_REALM_REVISION = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/REALM_REVISION'));
const ORIGIN_LINEAGE = 'tuple(bytes,bytes,bytes32)';
const COMPONENT_DESCRIPTOR = 'tuple(address,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint8[])';
const REALM_REVISION = 'tuple(bytes32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint64,uint64)';
const COMPONENT_DESCRIPTOR_KIND = 1;
const ZERO = `0x${'00'.repeat(32)}`;
const ZERO_ADDRESS = `0x${'00'.repeat(20)}`;
const ORIGIN_FIELDS = Object.freeze(['chainNamespace', 'chainReference', 'genesisCommitment']);
const COMPONENT_FIELDS = Object.freeze([
  'coreAddress',
  'runtimeCodeCommitment',
  'executionProfileCommitment',
  'policyCommitment',
  'verifierProfileId',
  'dependencyCommitment',
  'routingCommitment',
  'administrationCommitment',
  'disclosedPowers',
]);
const BOOTSTRAP_FIELDS = Object.freeze([
  'originLineage',
  'genesisCommitment',
  'coreCommitment',
  'initialRevisionCommitment',
  'initialRevisionId',
  'disclosedPowers',
]);
const REVISION_FIELDS = Object.freeze([
  'realmId',
  'generation',
  'componentCommitment',
  'executionProfileId',
  'policyId',
  'verifierProfileId',
  'administrationCommitment',
  'activationStart',
  'activationEndExclusive',
]);

function originValue(value) {
  return [value.chainNamespace, value.chainReference, value.genesisCommitment];
}

function componentValue(value) {
  return [
    value.coreAddress,
    value.runtimeCodeCommitment,
    value.executionProfileCommitment,
    value.policyCommitment,
    value.verifierProfileId,
    value.dependencyCommitment,
    value.routingCommitment,
    value.administrationCommitment,
    value.disclosedPowers,
  ];
}

function revisionValue(value) {
  return [
    value.realmId,
    value.generation,
    value.componentCommitment,
    value.executionProfileId,
    value.policyId,
    value.verifierProfileId,
    value.administrationCommitment,
    value.activationStart,
    value.activationEndExclusive,
  ];
}

function encodeOriginLineageV0(value) {
  return abi.encode([ORIGIN_LINEAGE], [originValue(value)]);
}

function decodeOriginLineageV0(bytes) {
  const value = abi.decode([ORIGIN_LINEAGE], bytes)[0];
  const decoded = { chainNamespace: value[0], chainReference: value[1], genesisCommitment: value[2] };
  if (encodeOriginLineageV0(decoded).toLowerCase() !== bytes.toLowerCase()) {
    throw new Error('OriginLineageV0 is not canonical ABI');
  }
  return decoded;
}

function encodeComponentDescriptorV0(value) {
  return abi.encode([COMPONENT_DESCRIPTOR], [componentValue(value)]);
}

function decodeComponentDescriptorV0(bytes) {
  const value = abi.decode([COMPONENT_DESCRIPTOR], bytes)[0];
  const decoded = {
    coreAddress: value[0].toLowerCase(),
    runtimeCodeCommitment: value[1],
    executionProfileCommitment: value[2],
    policyCommitment: value[3],
    verifierProfileId: value[4],
    dependencyCommitment: value[5],
    routingCommitment: value[6],
    administrationCommitment: value[7],
    disclosedPowers: value[8].map(Number),
  };
  if (encodeComponentDescriptorV0(decoded).toLowerCase() !== bytes.toLowerCase()) {
    throw new Error('ComponentDescriptorV0 is not canonical ABI');
  }
  return decoded;
}

function commitOriginLineageV0(value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', ORIGIN_LINEAGE],
    [DOMAIN_ORIGIN_LINEAGE, VERSION, originValue(value)],
  ));
}

function commitComponentDescriptorV0(value) {
  const bytes = encodeComponentDescriptorV0(value);
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'uint8', 'bytes'],
    [DOMAIN_DESCRIPTOR, VERSION, COMPONENT_DESCRIPTOR_KIND, bytes],
  ));
}

function initialRevisionCommitmentV0(revision) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'uint32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64'],
    [
      DOMAIN_INITIAL_REVISION,
      VERSION,
      revision.generation,
      revision.componentCommitment,
      revision.executionProfileId,
      revision.policyId,
      revision.verifierProfileId,
      revision.administrationCommitment,
      revision.activationStart,
      revision.activationEndExclusive,
    ],
  ));
}

function realmIdV0(bootstrap) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes', 'bytes32', 'bytes32', 'bytes32', 'uint8[]'],
    [
      DOMAIN_REALM,
      VERSION,
      bootstrap.originLineage,
      bootstrap.genesisCommitment,
      bootstrap.coreCommitment,
      bootstrap.initialRevisionCommitment,
      bootstrap.disclosedPowers,
    ],
  ));
}

function realmRevisionIdV0(revision) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', REALM_REVISION],
    [DOMAIN_REALM_REVISION, VERSION, revisionValue(revision)],
  ));
}

function sameHex(left, right) {
  return typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase();
}

function sameArray(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((value, index) => value === right[index]);
}

function unknownFields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${label} must be an object`];
  const allowedSet = new Set(allowed);
  return Object.keys(value).filter((field) => !allowedSet.has(field)).map((field) => `${label} unknown field ${field}`);
}

function validateOriginLineageV0(value) {
  const errors = unknownFields(value, ORIGIN_FIELDS, 'OriginLineageV0');
  for (const field of ['chainNamespace', 'chainReference']) {
    if (typeof value?.[field] !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(value[field])
        || (value[field].length - 2) / 2 > 64) errors.push(`${field} must contain 1..64 bytes`);
  }
  if (typeof value?.genesisCommitment !== 'string'
      || !/^0x[0-9a-fA-F]{64}$/.test(value.genesisCommitment)
      || /^0x0{64}$/i.test(value.genesisCommitment)) {
    errors.push('genesisCommitment must be nonzero bytes32');
  }
  return errors;
}

function validateComponentDescriptorV0(value) {
  const errors = unknownFields(value, COMPONENT_FIELDS, 'ComponentDescriptorV0');
  try {
    const address = getAddress(value?.coreAddress);
    if (address.toLowerCase() === ZERO_ADDRESS) errors.push('coreAddress must be a nonzero address');
  } catch { errors.push('coreAddress must be an address'); }
  for (const field of [
    'runtimeCodeCommitment',
    'executionProfileCommitment',
    'policyCommitment',
    'verifierProfileId',
    'dependencyCommitment',
    'routingCommitment',
    'administrationCommitment',
  ]) {
    if (typeof value?.[field] !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value[field]) || /^0x0{64}$/i.test(value[field])) {
      errors.push(`${field} must be nonzero bytes32`);
    }
  }
  if (!Array.isArray(value?.disclosedPowers) || value.disclosedPowers.length > 8
      || value.disclosedPowers.some((power, index) => !Number.isInteger(power) || power < 1 || power > 255
        || (index > 0 && value.disclosedPowers[index - 1] >= power))) {
    errors.push('disclosedPowers must be a strictly ordered unique uint8 list with 0..8 entries');
  }
  return errors;
}

function validateRealmBootstrapV0(value) {
  const errors = unknownFields(value, BOOTSTRAP_FIELDS, 'RealmBootstrap');
  if (typeof value?.originLineage !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(value.originLineage)
      || (value.originLineage.length - 2) / 2 > 320) {
    errors.push('RealmBootstrap originLineage must contain 1..320 canonical bytes');
  }
  for (const field of [
    'genesisCommitment',
    'coreCommitment',
    'initialRevisionCommitment',
    'initialRevisionId',
  ]) {
    if (typeof value?.[field] !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value[field])
        || /^0x0{64}$/i.test(value[field])) {
      errors.push(`RealmBootstrap ${field} must be nonzero bytes32`);
    }
  }
  if (!Array.isArray(value?.disclosedPowers) || value.disclosedPowers.length > 8
      || value.disclosedPowers.some((power, index) => !Number.isInteger(power) || power < 1 || power > 255
        || (index > 0 && value.disclosedPowers[index - 1] >= power))) {
    errors.push('RealmBootstrap disclosedPowers must be a strictly ordered unique uint8 list with 0..8 entries');
  }
  return errors;
}

function isCanonicalUint(value, maximum) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return false;
  if (typeof value === 'string' && !/^(?:0|[1-9][0-9]*)$/.test(value)) return false;
  if (!['bigint', 'number', 'string'].includes(typeof value)) return false;
  try {
    const integer = BigInt(value);
    return integer >= 0n && integer <= maximum;
  } catch {
    return false;
  }
}

function validateRealmRevisionV0(value) {
  const errors = unknownFields(value, REVISION_FIELDS, 'RealmRevision');
  for (const field of [
    'realmId',
    'componentCommitment',
    'executionProfileId',
    'policyId',
    'verifierProfileId',
    'administrationCommitment',
  ]) {
    if (typeof value?.[field] !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value[field])
        || /^0x0{64}$/i.test(value[field])) {
      errors.push(`RealmRevision ${field} must be nonzero bytes32`);
    }
  }
  if (!isCanonicalUint(value?.generation, (1n << 32n) - 1n)) {
    errors.push('RealmRevision generation must be uint32');
  }
  if (!isCanonicalUint(value?.activationStart, (1n << 64n) - 1n)
      || !isCanonicalUint(value?.activationEndExclusive, (1n << 64n) - 1n)) {
    errors.push('RealmRevision activation coordinates must be uint64');
  } else if (BigInt(value.activationStart) >= BigInt(value.activationEndExclusive)) {
    errors.push('RealmRevision activation range must be nonempty');
  }
  return errors;
}

function runtimeCodeCommitmentV0(runtimeCodeBytes) {
  return keccak256(runtimeCodeBytes);
}

function validateRuntimeCodeEvidenceV0(runtimeCodeBytes, runtimeCodeCommitment) {
  const errors = [];
  if (typeof runtimeCodeBytes !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(runtimeCodeBytes)
      || (runtimeCodeBytes.length - 2) / 2 > 24_576) {
    errors.push('runtimeCodeBytes must contain 1..24576 canonical bytes');
  } else if (!sameHex(runtimeCodeCommitmentV0(runtimeCodeBytes), runtimeCodeCommitment)) {
    errors.push('runtime code commitment does not match retained runtimeCodeBytes');
  }
  return errors;
}

function validateRealmLaunchV0({ originLineage, component, bootstrap, revision, launch, admissionPlan } = {}) {
  const errors = [];
  let decodedOrigin;
  let decodedComponent;
  try { decodedOrigin = decodeOriginLineageV0(launch?.originLineageBytes); } catch (error) { errors.push(error.message); }
  try { decodedComponent = decodeComponentDescriptorV0(launch?.componentDescriptorBytes); } catch (error) { errors.push(error.message); }
  if (originLineage) errors.push(...validateOriginLineageV0(originLineage));
  if (component) errors.push(...validateComponentDescriptorV0(component));
  errors.push(...validateRealmBootstrapV0(bootstrap));
  errors.push(...validateRealmRevisionV0(revision));
  errors.push(...validateRuntimeCodeEvidenceV0(
    launch?.runtimeCodeBytes,
    decodedComponent?.runtimeCodeCommitment,
  ));
  if (decodedOrigin && originLineage && JSON.stringify(decodedOrigin) !== JSON.stringify(originLineage)) {
    errors.push('retained OriginLineageV0 differs from supplied canonical preimage');
  }
  if (decodedComponent && component && JSON.stringify(decodedComponent) !== JSON.stringify(component)) {
    errors.push('retained ComponentDescriptorV0 differs from supplied canonical preimage');
  }
  if (!decodedOrigin || !decodedComponent) return errors;

  const componentCommitment = commitComponentDescriptorV0(decodedComponent);
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(sameHex(bootstrap?.originLineage, launch.originLineageBytes), 'RealmBootstrap origin lineage preimage mismatch');
  check(sameHex(bootstrap?.genesisCommitment, decodedOrigin.genesisCommitment), 'RealmBootstrap genesis mismatch');
  check(sameHex(bootstrap?.coreCommitment, componentCommitment), 'RealmBootstrap Core descriptor mismatch');
  check(sameArray(bootstrap?.disclosedPowers, decodedComponent.disclosedPowers), 'bootstrap disclosed powers mismatch');

  let realmId;
  let initialRevisionCommitment;
  let revisionId;
  try { realmId = realmIdV0(bootstrap); } catch (error) { errors.push(`RealmBootstrap identity preimage invalid: ${error.message}`); }
  try { initialRevisionCommitment = initialRevisionCommitmentV0(revision); } catch (error) { errors.push(`initial RealmRevision preimage invalid: ${error.message}`); }
  try { revisionId = realmRevisionIdV0(revision); } catch (error) { errors.push(`RealmRevision identity preimage invalid: ${error.message}`); }
  check(sameHex(bootstrap?.initialRevisionCommitment, initialRevisionCommitment), 'RealmBootstrap initial revision commitment mismatch');
  check(sameHex(bootstrap?.initialRevisionId, revisionId), 'RealmBootstrap initial revision ID mismatch');
  check(sameHex(revision?.realmId, realmId), 'RealmRevision RealmId mismatch');
  check(revision?.generation === 0, 'initial RealmRevision generation must be zero');
  check(sameHex(revision?.componentCommitment, componentCommitment), 'RealmRevision component mismatch');
  check(sameHex(revision?.executionProfileId, decodedComponent.executionProfileCommitment), 'RealmRevision execution profile mismatch');
  check(sameHex(revision?.policyId, decodedComponent.policyCommitment), 'RealmRevision policy mismatch');
  check(sameHex(revision?.verifierProfileId, decodedComponent.verifierProfileId), 'RealmRevision verifier mismatch');
  check(sameHex(revision?.administrationCommitment, decodedComponent.administrationCommitment), 'RealmRevision administration mismatch');

  check(sameHex(launch.chainNamespace, decodedOrigin.chainNamespace), 'launch chain namespace mismatch');
  check(sameHex(launch.chainReference, decodedOrigin.chainReference), 'launch chain reference mismatch');
  check(sameHex(launch.genesisCommitment, decodedOrigin.genesisCommitment), 'launch genesis mismatch');
  check(String(launch.coreAddress).toLowerCase() === decodedComponent.coreAddress, 'launch Core address mismatch');
  check(sameHex(launch.coreRuntimeCodeCommitment, decodedComponent.runtimeCodeCommitment), 'launch runtime code mismatch');
  check(sameHex(launch.componentDescriptorCommitment, componentCommitment), 'launch component descriptor commitment mismatch');
  check(sameHex(launch.dependencyCommitment, decodedComponent.dependencyCommitment), 'launch dependency mismatch');
  check(sameHex(launch.routingCommitment, decodedComponent.routingCommitment), 'launch routing mismatch');
  check(sameHex(launch.administrationCommitment, decodedComponent.administrationCommitment), 'launch administration mismatch');
  check(sameArray(launch.disclosedPowers, decodedComponent.disclosedPowers), 'launch disclosed powers mismatch');
  check(sameHex(launch.realmId, realmId), 'launch RealmId mismatch');
  check(sameHex(launch.realmRevisionId, revisionId), 'launch RealmRevisionId mismatch');

  check(sameHex(admissionPlan?.realmId, realmId), 'AdmissionPlan RealmId mismatch');
  check(sameHex(admissionPlan?.realmRevisionId, revisionId), 'AdmissionPlan RealmRevisionId mismatch');
  check(sameHex(admissionPlan?.coreCommitment, componentCommitment), 'AdmissionPlan Core descriptor mismatch');
  check(sameHex(admissionPlan?.dependencyCommitment, decodedComponent.dependencyCommitment), 'AdmissionPlan dependency mismatch');
  return errors;
}

module.exports = {
  ABI: Object.freeze({ ORIGIN_LINEAGE, COMPONENT_DESCRIPTOR, REALM_REVISION }),
  commitComponentDescriptorV0,
  commitOriginLineageV0,
  decodeComponentDescriptorV0,
  decodeOriginLineageV0,
  encodeComponentDescriptorV0,
  encodeOriginLineageV0,
  initialRevisionCommitmentV0,
  realmIdV0,
  realmRevisionIdV0,
  runtimeCodeCommitmentV0,
  validateComponentDescriptorV0,
  validateOriginLineageV0,
  validateRealmBootstrapV0,
  validateRealmLaunchV0,
  validateRealmRevisionV0,
  validateRuntimeCodeEvidenceV0,
};
