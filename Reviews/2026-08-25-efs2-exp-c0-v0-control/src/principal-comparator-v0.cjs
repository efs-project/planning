'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');

const abi = AbiCoder.defaultAbiCoder();
const PROFILE_VERSION = 0;
const PRINCIPAL_ABI = 'tuple(uint8,bytes,address)';
const AUTHOR_REF_ABI = 'tuple(uint8,bytes32)';
const domain = (name) => keccak256(toUtf8Bytes(name));

const DOMAINS = Object.freeze({
  principal: domain('EFS2/EXP-C0/V0/PRINCIPAL'),
  taggedAuthorKey: domain('efs2/bakeoff/author-key/1'),
  sign: domain('EFS2/EXP-C0/V0/SIGN'),
});

function principalValue(principal) {
  return [principal.authorityKind, principal.originLineage, principal.account];
}

function authorRefValue(authorRef) {
  return [authorRef.kind, authorRef.value];
}

function uniformPrincipalId(principal) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', PRINCIPAL_ABI],
    [DOMAINS.principal, PROFILE_VERSION, principalValue(principal)],
  ));
}

function taggedAuthorKey(authorRef) {
  return keccak256(abi.encode(
    ['bytes32', 'uint256', 'bytes32'],
    [DOMAINS.taggedAuthorKey, authorRef.kind, authorRef.value],
  ));
}

function signatureDigest(messageId, authorKey, verifierProfileId) {
  return keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32'],
    [DOMAINS.sign, PROFILE_VERSION, messageId, authorKey, verifierProfileId],
  ));
}

function encodedBytes(types, values) {
  return (abi.encode(types, values).length - 2) / 2;
}

function abiSizes(inputs) {
  const uniformEoa = uniformPrincipalId(inputs.eoaPrincipal);
  const taggedEoa = taggedAuthorKey(inputs.taggedEoa);
  return {
    uniformEoaDescriptor: encodedBytes([PRINCIPAL_ABI], [principalValue(inputs.eoaPrincipal)]),
    uniformErc1271Descriptor: encodedBytes([PRINCIPAL_ABI], [principalValue(inputs.erc1271Principal)]),
    uniformAuthorApiKey: encodedBytes(['bytes32'], [uniformEoa]),
    taggedAuthorRef: encodedBytes([AUTHOR_REF_ABI], [authorRefValue(inputs.taggedEoa)]),
    uniformSignaturePreimage: encodedBytes(
      ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32'],
      [DOMAINS.sign, PROFILE_VERSION, inputs.messageId, uniformEoa, inputs.eoaVerifierProfileId],
    ),
    taggedSignaturePreimage: encodedBytes(
      ['bytes32', 'uint16', 'bytes32', 'bytes32', 'bytes32'],
      [DOMAINS.sign, PROFILE_VERSION, inputs.messageId, taggedEoa, inputs.eoaVerifierProfileId],
    ),
  };
}

function uniformMappingKey(principalId) {
  return principalId;
}

function associateUniform(principalId, managedAuthorityRef, sinceOrdinal) {
  return {
    identityKey: principalId,
    currentAuthorityRef: managedAuthorityRef,
    sinceOrdinal,
    rewrittenOldIds: 0,
    queryKeys: [principalId],
  };
}

function associateTagged(accountRef, managedPrincipalRef, sinceOrdinal) {
  const accountKey = taggedAuthorKey(accountRef);
  const managedKey = taggedAuthorKey(managedPrincipalRef);
  return {
    identityKey: managedKey,
    priorAccountKey: accountKey,
    sinceOrdinal,
    rewrittenOldIds: 0,
    queryKeys: [accountKey, managedKey],
  };
}

module.exports = {
  AUTHOR_REF_ABI,
  DOMAINS,
  PRINCIPAL_ABI,
  PROFILE_VERSION,
  abiSizes,
  associateTagged,
  associateUniform,
  signatureDigest,
  taggedAuthorKey,
  uniformMappingKey,
  uniformPrincipalId,
};
