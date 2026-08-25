'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const VERSION = 0;
const DOMAIN_ENDPOINT = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/SOURCE_ENDPOINT'));
const DOMAIN_LOCATOR = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/SOURCE_LOCATOR'));
const DOMAIN_DESCRIPTOR = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/SOURCE_DESCRIPTOR'));
const DOMAIN_REQUEST = keccak256(toUtf8Bytes('EFS2/EXP-C0/V0/BYTE_READ_REQUEST'));

const SOURCE_ENDPOINT = 'tuple(uint8,bytes,bytes32,bool)';
const SOURCE_DESCRIPTOR = `tuple(bytes,bytes,bytes32,bytes32,bytes32,bytes32,${SOURCE_ENDPOINT}[],bytes32)`;
const BYTE_READ_REQUEST = 'tuple(bytes32,bytes32,bytes32,uint8,bytes32,uint32,uint32,bytes32,bytes,uint8,uint8)';

const TRANSPORT_KIND = Object.freeze({ RPC_HTTP: 1, ARCHIVE_EXPORT: 2, DECLARED_OTHER: 3 });
const DIGEST_ALGORITHM = Object.freeze({ KECCAK_256: 1 });

const ENDPOINT_FIELDS = Object.freeze(['transportKind', 'locator', 'interfaceCommitment', 'eligible']);
const DESCRIPTOR_FIELDS = Object.freeze([
  'chainNamespace',
  'chainReference',
  'originLineageCommitment',
  'componentDescriptorCommitment',
  'realmId',
  'realmRevisionId',
  'endpoints',
  'selectionPolicyCommitment',
]);
const REQUEST_FIELDS = Object.freeze([
  'realmId',
  'realmRevisionId',
  'recordId',
  'digestAlgorithm',
  'expectedDigest',
  'start',
  'length',
  'sourceDescriptorCommitment',
  'requestedBlockReference',
  'requestedSourceKind',
  'requestedFinality',
]);

function isHexBytes(value) {
  return typeof value === 'string' && /^0x(?:[0-9a-fA-F]{2})*$/.test(value);
}

function isB32(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function byteLength(value) {
  return isHexBytes(value) ? (value.length - 2) / 2 : null;
}

function endpointValue(value) {
  return [value.transportKind, value.locator, value.interfaceCommitment, value.eligible];
}

function descriptorValue(value) {
  return [
    value.chainNamespace,
    value.chainReference,
    value.originLineageCommitment,
    value.componentDescriptorCommitment,
    value.realmId,
    value.realmRevisionId,
    value.endpoints.map(endpointValue),
    value.selectionPolicyCommitment,
  ];
}

function requestValue(value) {
  return [
    value.realmId,
    value.realmRevisionId,
    value.recordId,
    value.digestAlgorithm,
    value.expectedDigest,
    value.start,
    value.length,
    value.sourceDescriptorCommitment,
    value.requestedBlockReference,
    value.requestedSourceKind,
    value.requestedFinality,
  ];
}

function encodeSourceDescriptorV0(value) {
  return abi.encode([SOURCE_DESCRIPTOR], [descriptorValue(value)]);
}

function decodeSourceDescriptorV0(bytes) {
  const value = abi.decode([SOURCE_DESCRIPTOR], bytes)[0];
  const decoded = {
    chainNamespace: value[0],
    chainReference: value[1],
    originLineageCommitment: value[2],
    componentDescriptorCommitment: value[3],
    realmId: value[4],
    realmRevisionId: value[5],
    endpoints: value[6].map((endpoint) => ({
      transportKind: Number(endpoint[0]),
      locator: endpoint[1],
      interfaceCommitment: endpoint[2],
      eligible: endpoint[3],
    })),
    selectionPolicyCommitment: value[7],
  };
  if (encodeSourceDescriptorV0(decoded).toLowerCase() !== bytes.toLowerCase()) {
    throw new Error('SourceDescriptorV0 is not canonical ABI');
  }
  return decoded;
}

function encodeByteReadRequestV0(value) {
  return abi.encode([BYTE_READ_REQUEST], [requestValue(value)]);
}

function decodeByteReadRequestV0(bytes) {
  const value = abi.decode([BYTE_READ_REQUEST], bytes)[0];
  const decoded = {
    realmId: value[0],
    realmRevisionId: value[1],
    recordId: value[2],
    digestAlgorithm: Number(value[3]),
    expectedDigest: value[4],
    start: Number(value[5]),
    length: Number(value[6]),
    sourceDescriptorCommitment: value[7],
    requestedBlockReference: value[8],
    requestedSourceKind: Number(value[9]),
    requestedFinality: Number(value[10]),
  };
  if (encodeByteReadRequestV0(decoded).toLowerCase() !== bytes.toLowerCase()) {
    throw new Error('ByteReadRequestV0 is not canonical ABI');
  }
  return decoded;
}

function commitSourceEndpointV0(value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', SOURCE_ENDPOINT],
    [DOMAIN_ENDPOINT, VERSION, endpointValue(value)],
  ));
}

function commitSourceLocatorV0(locator) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes'],
    [DOMAIN_LOCATOR, VERSION, locator],
  ));
}

function commitSourceDescriptorV0(value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', SOURCE_DESCRIPTOR],
    [DOMAIN_DESCRIPTOR, VERSION, descriptorValue(value)],
  ));
}

function commitByteReadRequestV0(value) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', BYTE_READ_REQUEST],
    [DOMAIN_REQUEST, VERSION, requestValue(value)],
  ));
}

function unknownFields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${label} must be an object`];
  const allowedSet = new Set(allowed);
  return Object.keys(value).filter((field) => !allowedSet.has(field)).map((field) => `${label} unknown field ${field}`);
}

function validateSourceEndpointV0(value, index = 0) {
  const errors = unknownFields(value, ENDPOINT_FIELDS, `endpoint ${index}`);
  if (!Object.values(TRANSPORT_KIND).includes(value?.transportKind)) errors.push(`endpoint ${index} transportKind is unknown`);
  const locatorLength = byteLength(value?.locator);
  if (locatorLength === null || locatorLength < 1 || locatorLength > 256) {
    errors.push(`endpoint ${index} locator must contain 1..256 bytes`);
  }
  if (!isB32(value?.interfaceCommitment) || /^0x0{64}$/i.test(value.interfaceCommitment)) {
    errors.push(`endpoint ${index} interfaceCommitment must be nonzero bytes32`);
  }
  if (typeof value?.eligible !== 'boolean') errors.push(`endpoint ${index} eligible must be bool`);
  return errors;
}

function validateSourceDescriptorV0(value) {
  const errors = unknownFields(value, DESCRIPTOR_FIELDS, 'SourceDescriptorV0');
  for (const field of ['chainNamespace', 'chainReference']) {
    const length = byteLength(value?.[field]);
    if (length === null || length < 1 || length > 64) errors.push(`${field} must contain 1..64 bytes`);
  }
  for (const field of [
    'originLineageCommitment',
    'componentDescriptorCommitment',
    'realmId',
    'realmRevisionId',
  ]) {
    if (!isB32(value?.[field]) || /^0x0{64}$/i.test(value[field])) errors.push(`${field} must be nonzero bytes32`);
  }
  if (!Array.isArray(value?.endpoints) || value.endpoints.length < 1 || value.endpoints.length > 8) {
    errors.push('SourceDescriptorV0 endpoints must contain 1..8 entries');
  } else {
    value.endpoints.forEach((endpoint, index) => errors.push(...validateSourceEndpointV0(endpoint, index)));
    const ids = value.endpoints.map((endpoint) => {
      try { return commitSourceEndpointV0(endpoint).toLowerCase(); } catch { return null; }
    });
    if (new Set(ids).size !== ids.length) errors.push('SourceDescriptorV0 contains a duplicate endpoint');
  }
  if (!isB32(value?.selectionPolicyCommitment) || /^0x0{64}$/i.test(value.selectionPolicyCommitment)) {
    errors.push('selectionPolicyCommitment must be nonzero bytes32');
  }
  return errors;
}

function validateByteReadRequestV0(value) {
  const errors = unknownFields(value, REQUEST_FIELDS, 'ByteReadRequestV0');
  for (const field of ['realmId', 'realmRevisionId', 'recordId', 'expectedDigest', 'sourceDescriptorCommitment']) {
    if (!isB32(value?.[field]) || /^0x0{64}$/i.test(value[field])) errors.push(`${field} must be nonzero bytes32`);
  }
  if (value?.digestAlgorithm !== DIGEST_ALGORITHM.KECCAK_256) {
    errors.push('digestAlgorithm must be exact C0 KECCAK_256');
  }
  for (const field of ['start', 'length']) {
    if (!Number.isInteger(value?.[field]) || value[field] < 0 || value[field] > 0xffff_ffff) {
      errors.push(`${field} must fit uint32`);
    }
  }
  if (value?.length === 0) errors.push('length must be nonzero');
  if (Number.isInteger(value?.start) && Number.isInteger(value?.length)
      && value.start >= 0 && value.length >= 0 && value.start + value.length > 0xffff_ffff) {
    errors.push('requested range end must fit uint32');
  }
  const blockLength = byteLength(value?.requestedBlockReference);
  if (blockLength === null || blockLength < 1 || blockLength > 128) {
    errors.push('requestedBlockReference must contain 1..128 bytes');
  }
  if (![1, 2, 3].includes(value?.requestedSourceKind)) errors.push('requestedSourceKind is unknown');
  if (![1, 2].includes(value?.requestedFinality)) errors.push('requestedFinality is unknown');
  return errors;
}

function validateReadPreimagesV0({ requestBytes, sourceDescriptorBytes } = {}) {
  const errors = [];
  let request;
  let descriptor;
  try { request = decodeByteReadRequestV0(requestBytes); } catch (error) { errors.push(`request preimage: ${error.message}`); }
  try { descriptor = decodeSourceDescriptorV0(sourceDescriptorBytes); } catch (error) { errors.push(`source descriptor preimage: ${error.message}`); }
  if (request) errors.push(...validateByteReadRequestV0(request));
  if (descriptor) errors.push(...validateSourceDescriptorV0(descriptor));
  if (request && descriptor && request.sourceDescriptorCommitment.toLowerCase() !== commitSourceDescriptorV0(descriptor).toLowerCase()) {
    errors.push('request source descriptor commitment does not match retained SourceDescriptorV0 preimage');
  }
  if (request && descriptor && request.realmId.toLowerCase() !== descriptor.realmId.toLowerCase()) {
    errors.push('ByteReadRequestV0 RealmId differs from SourceDescriptorV0');
  }
  if (request && descriptor && request.realmRevisionId.toLowerCase() !== descriptor.realmRevisionId.toLowerCase()) {
    errors.push('ByteReadRequestV0 RealmRevisionId differs from SourceDescriptorV0');
  }
  return errors;
}

function sourceIdentitiesV0(descriptor) {
  return descriptor.endpoints.map((endpoint) => ({
    sourceCommitment: commitSourceEndpointV0(endpoint),
    locatorCommitment: commitSourceLocatorV0(endpoint.locator),
    eligible: endpoint.eligible,
  }));
}

module.exports = {
  ABI: Object.freeze({ SOURCE_ENDPOINT, SOURCE_DESCRIPTOR, BYTE_READ_REQUEST }),
  DIGEST_ALGORITHM,
  TRANSPORT_KIND,
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  commitSourceEndpointV0,
  commitSourceLocatorV0,
  decodeByteReadRequestV0,
  decodeSourceDescriptorV0,
  encodeByteReadRequestV0,
  encodeSourceDescriptorV0,
  sourceIdentitiesV0,
  validateByteReadRequestV0,
  validateReadPreimagesV0,
  validateSourceDescriptorV0,
  validateSourceEndpointV0,
};
