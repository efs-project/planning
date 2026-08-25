'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

let codec;
try {
  codec = require('../src/read-request-v0.cjs');
} catch {
  codec = null;
}

const b32 = (byte) => `0x${byte.repeat(32)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;

function fixture() {
  const endpoints = [
    { transportKind: 1, locator: utf8Hex('fixture://rpc/primary'), interfaceCommitment: b32('11'), eligible: true },
    { transportKind: 1, locator: utf8Hex('fixture://rpc/fallback'), interfaceCommitment: b32('11'), eligible: true },
  ];
  const descriptor = {
    chainNamespace: utf8Hex('eip155'),
    chainReference: utf8Hex('31337'),
    originLineageCommitment: b32('29'),
    componentDescriptorCommitment: b32('2a'),
    realmId: b32('31'),
    realmRevisionId: b32('32'),
    endpoints,
    selectionPolicyCommitment: b32('22'),
  };
  const sourceDescriptorBytes = codec.encodeSourceDescriptorV0(descriptor);
  const sourceDescriptorCommitment = codec.commitSourceDescriptorV0(descriptor);
  const request = {
    realmId: b32('31'),
    realmRevisionId: b32('32'),
    recordId: b32('33'),
    digestAlgorithm: 1,
    expectedDigest: b32('34'),
    start: 0,
    length: 13,
    sourceDescriptorCommitment,
    requestedBlockReference: utf8Hex('0x2a'),
    requestedSourceKind: 3,
    requestedFinality: 1,
  };
  return { descriptor, request, sourceDescriptorBytes };
}

test('canonical source and read-request preimages round-trip and commitments bind every coordinate', () => {
  assert.ok(codec, 'read-request-v0 codec must exist');
  const { descriptor, request, sourceDescriptorBytes } = fixture();
  const requestBytes = codec.encodeByteReadRequestV0(request);
  assert.deepEqual(codec.decodeSourceDescriptorV0(sourceDescriptorBytes), descriptor);
  assert.deepEqual(codec.decodeByteReadRequestV0(requestBytes), request);

  const descriptorCommitment = codec.commitSourceDescriptorV0(descriptor);
  for (const mutated of [
    { ...descriptor, chainNamespace: utf8Hex('other') },
    { ...descriptor, chainReference: utf8Hex('31338') },
    { ...descriptor, originLineageCommitment: b32('2b') },
    { ...descriptor, componentDescriptorCommitment: b32('2c') },
    { ...descriptor, realmId: b32('35') },
    { ...descriptor, realmRevisionId: b32('36') },
    { ...descriptor, endpoints: [{ ...descriptor.endpoints[0], eligible: false }, descriptor.endpoints[1]] },
    { ...descriptor, endpoints: descriptor.endpoints.slice().reverse() },
    { ...descriptor, selectionPolicyCommitment: b32('23') },
  ]) assert.notEqual(codec.commitSourceDescriptorV0(mutated), descriptorCommitment);

  const requestCommitment = codec.commitByteReadRequestV0(request);
  for (const [field, value] of Object.entries({
    realmId: b32('41'),
    realmRevisionId: b32('42'),
    recordId: b32('43'),
    digestAlgorithm: 2,
    expectedDigest: b32('44'),
    start: 1,
    length: 12,
    sourceDescriptorCommitment: b32('45'),
    requestedBlockReference: utf8Hex('latest'),
    requestedSourceKind: 2,
    requestedFinality: 2,
  })) assert.notEqual(codec.commitByteReadRequestV0({ ...request, [field]: value }), requestCommitment, field);
});

test('read preimage linker rejects unknown observed facts, duplicate sources, and request/source substitution', () => {
  assert.ok(codec, 'read-request-v0 codec must exist');
  const { descriptor, request, sourceDescriptorBytes } = fixture();
  const requestBytes = codec.encodeByteReadRequestV0(request);
  assert.deepEqual(codec.validateReadPreimagesV0({ requestBytes, sourceDescriptorBytes }), []);

  const observedOnly = { ...request, observedStateRoot: b32('99') };
  assert.match(codec.validateByteReadRequestV0(observedOnly).join('\n'), /unknown field.*observedStateRoot/i);
  const duplicate = { ...descriptor, endpoints: [descriptor.endpoints[0], descriptor.endpoints[0]] };
  assert.match(codec.validateSourceDescriptorV0(duplicate).join('\n'), /duplicate/i);
  const substituted = codec.encodeSourceDescriptorV0({ ...descriptor, chainReference: utf8Hex('1') });
  assert.match(
    codec.validateReadPreimagesV0({ requestBytes, sourceDescriptorBytes: substituted }).join('\n'),
    /source descriptor commitment/i,
  );

  const wrongRealm = codec.encodeSourceDescriptorV0({ ...descriptor, realmId: b32('99') });
  assert.match(
    codec.validateReadPreimagesV0({ requestBytes, sourceDescriptorBytes: wrongRealm }).join('\n'),
    /RealmId|source descriptor commitment/i,
  );

  assert.match(codec.validateByteReadRequestV0({
    ...request,
    start: 0xffff_ffff,
    length: 1,
  }).join('\n'), /range end.*uint32/i);
});

test('endpoint and locator commitments give acquisition attempts exact ordered source identities', () => {
  assert.ok(codec, 'read-request-v0 codec must exist');
  const { descriptor } = fixture();
  const identities = descriptor.endpoints.map((endpoint) => ({
    sourceCommitment: codec.commitSourceEndpointV0(endpoint),
    locatorCommitment: codec.commitSourceLocatorV0(endpoint.locator),
    eligible: endpoint.eligible,
  }));
  assert.notEqual(identities[0].sourceCommitment, identities[1].sourceCommitment);
  assert.notEqual(identities[0].locatorCommitment, identities[1].locatorCommitment);
  assert.deepEqual(codec.sourceIdentitiesV0(descriptor), identities);
});
