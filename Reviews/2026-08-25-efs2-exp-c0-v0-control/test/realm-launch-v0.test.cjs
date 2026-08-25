'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

let realmCodec;
try {
  realmCodec = require('../src/realm-launch-v0.cjs');
} catch {
  realmCodec = null;
}

const b32 = (byte) => `0x${byte.repeat(32)}`;
const addr = (byte) => `0x${byte.repeat(20)}`;
const utf8Hex = (value) => `0x${Buffer.from(value, 'utf8').toString('hex')}`;

function fixture() {
  const originLineage = {
    chainNamespace: utf8Hex('eip155'),
    chainReference: utf8Hex('31337'),
    genesisCommitment: b32('10'),
  };
  const component = {
    coreAddress: addr('22'),
    runtimeCodeCommitment: '0xd003426e799329b8dca093f3bbab55a5e4e9f3c40160fc942068eef712ae88ad',
    executionProfileCommitment: b32('30'),
    policyCommitment: b32('40'),
    verifierProfileId: b32('50'),
    dependencyCommitment: b32('60'),
    routingCommitment: b32('70'),
    administrationCommitment: b32('80'),
    disclosedPowers: [1, 2],
  };
  const originLineageBytes = realmCodec.encodeOriginLineageV0(originLineage);
  const componentDescriptorBytes = realmCodec.encodeComponentDescriptorV0(component);
  const componentCommitment = realmCodec.commitComponentDescriptorV0(component);
  const revisionCoordinates = {
    generation: 0,
    componentCommitment,
    executionProfileId: component.executionProfileCommitment,
    policyId: component.policyCommitment,
    verifierProfileId: component.verifierProfileId,
    administrationCommitment: component.administrationCommitment,
    activationStart: 0n,
    activationEndExclusive: (1n << 64n) - 1n,
  };
  const initialRevisionCommitment = realmCodec.initialRevisionCommitmentV0(revisionCoordinates);
  const bootstrapCoordinates = {
    originLineage: originLineageBytes,
    genesisCommitment: originLineage.genesisCommitment,
    coreCommitment: componentCommitment,
    initialRevisionCommitment,
    disclosedPowers: component.disclosedPowers,
  };
  const realmId = realmCodec.realmIdV0(bootstrapCoordinates);
  const revision = {
    realmId,
    ...revisionCoordinates,
  };
  const realmRevisionId = realmCodec.realmRevisionIdV0(revision);
  const bootstrap = {
    ...bootstrapCoordinates,
    initialRevisionId: realmRevisionId,
  };
  const launch = {
    originLineageBytes,
    componentDescriptorBytes,
    chainNamespace: originLineage.chainNamespace,
    chainReference: originLineage.chainReference,
    genesisCommitment: originLineage.genesisCommitment,
    coreAddress: component.coreAddress,
    runtimeCodeBytes: '0x60006000f3',
    coreRuntimeCodeCommitment: component.runtimeCodeCommitment,
    componentDescriptorCommitment: componentCommitment,
    dependencyCommitment: component.dependencyCommitment,
    routingCommitment: component.routingCommitment,
    administrationCommitment: component.administrationCommitment,
    disclosedPowers: component.disclosedPowers,
    realmId,
    realmRevisionId,
  };
  const admissionPlan = {
    realmId,
    realmRevisionId: launch.realmRevisionId,
    coreCommitment: componentCommitment,
    dependencyCommitment: component.dependencyCommitment,
  };
  return { originLineage, component, bootstrap, revision, launch, admissionPlan };
}

test('Realm launch raw preimages self-authenticate every launch and revision cross-link', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  assert.deepEqual(realmCodec.decodeOriginLineageV0(value.launch.originLineageBytes), value.originLineage);
  assert.deepEqual(realmCodec.decodeComponentDescriptorV0(value.launch.componentDescriptorBytes), value.component);
  assert.deepEqual(realmCodec.validateRealmLaunchV0(value), []);
});

test('retained RealmBootstrap is the exact six-field preimage and binds the exact initial revision', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  assert.deepEqual(Object.keys(value.bootstrap).sort(), [
    'coreCommitment',
    'disclosedPowers',
    'genesisCommitment',
    'initialRevisionCommitment',
    'initialRevisionId',
    'originLineage',
  ]);
  assert.equal(
    value.bootstrap.initialRevisionCommitment,
    realmCodec.initialRevisionCommitmentV0(value.revision),
  );
  assert.equal(value.bootstrap.initialRevisionId, realmCodec.realmRevisionIdV0(value.revision));

  for (const [label, mutate] of [
    ['initial revision commitment', (copy) => { copy.bootstrap.initialRevisionCommitment = b32('91'); }],
    ['initial revision id', (copy) => { copy.bootstrap.initialRevisionId = b32('92'); }],
    ['revision policy', (copy) => { copy.revision.policyId = b32('93'); }],
    ['hidden bootstrap field', (copy) => { copy.bootstrap.componentCommitment = b32('94'); }],
    ['missing initial revision commitment', (copy) => { delete copy.bootstrap.initialRevisionCommitment; }],
    ['missing initial revision id', (copy) => { delete copy.bootstrap.initialRevisionId; }],
    ['hidden revision field', (copy) => { copy.revision.proxyAdmin = addr('95'); }],
  ]) {
    const copy = structuredClone(value);
    mutate(copy);
    assert.notDeepEqual(realmCodec.validateRealmLaunchV0(copy), [], label);
  }
});

test('same runtime code at another address and same address with changed code or routing produce distinct Realms', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  const baseId = value.launch.realmId;
  for (const mutation of [
    { coreAddress: addr('23') },
    { runtimeCodeCommitment: b32('21') },
    { routingCommitment: b32('71') },
  ]) {
    const component = { ...value.component, ...mutation };
    const componentCommitment = realmCodec.commitComponentDescriptorV0(component);
    assert.notEqual(realmCodec.realmIdV0({
      ...value.bootstrap,
      coreCommitment: componentCommitment,
    }), baseId);
  }
});

test('chain namespace, reference, and genesis drift produce distinct Realm identity', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  for (const mutation of [
    { chainNamespace: utf8Hex('solana') },
    { chainReference: utf8Hex('31338') },
    { genesisCommitment: b32('11') },
  ]) {
    const origin = { ...value.originLineage, ...mutation };
    const bootstrap = {
      ...value.bootstrap,
      originLineage: realmCodec.encodeOriginLineageV0(origin),
      genesisCommitment: origin.genesisCommitment,
    };
    assert.notEqual(realmCodec.realmIdV0(bootstrap), value.launch.realmId);
  }
});

test('origin genesis and retained runtime code bytes are exact, nonzero, and self-checking', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  assert.deepEqual(realmCodec.validateOriginLineageV0({ ...value.originLineage, genesisCommitment: 'not-bytes32' }), [
    'genesisCommitment must be nonzero bytes32',
  ]);
  assert.deepEqual(realmCodec.validateOriginLineageV0({
    ...value.originLineage,
    genesisCommitment: `0x${'00'.repeat(32)}`.toUpperCase().replace('0X', '0x'),
  }), ['genesisCommitment must be nonzero bytes32']);
  assert.match(
    realmCodec.validateRuntimeCodeEvidenceV0('0x6001', value.component.runtimeCodeCommitment).join('\n'),
    /runtime code.*commitment/i,
  );
});

test('runtime code evidence may exceed 4KiB while ComponentDescriptorV0 remains within its descriptor cap', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  const runtimeCodeBytes = `0x${'60'.repeat(5_000)}`;
  const runtimeCodeCommitment = realmCodec.runtimeCodeCommitmentV0(runtimeCodeBytes);
  const descriptorBytes = realmCodec.encodeComponentDescriptorV0({
    ...value.component,
    runtimeCodeCommitment,
  });
  assert.ok((descriptorBytes.length - 2) / 2 <= 4_096);
  assert.deepEqual(realmCodec.validateRuntimeCodeEvidenceV0(runtimeCodeBytes, runtimeCodeCommitment), []);
});

test('descriptor substitution and hidden dependency/admin/power drift fail closed', () => {
  assert.ok(realmCodec, 'realm-launch-v0 codec must exist');
  const value = fixture();
  for (const mutate of [
    (copy) => { copy.launch.coreAddress = addr('99'); },
    (copy) => { copy.launch.coreRuntimeCodeCommitment = b32('99'); },
    (copy) => { copy.launch.dependencyCommitment = b32('99'); },
    (copy) => { copy.launch.routingCommitment = b32('99'); },
    (copy) => { copy.launch.administrationCommitment = b32('99'); },
    (copy) => { copy.launch.disclosedPowers = [1, 3]; },
    (copy) => { copy.admissionPlan.coreCommitment = b32('99'); },
    (copy) => { copy.admissionPlan.dependencyCommitment = b32('99'); },
  ]) {
    const copy = structuredClone(value);
    mutate(copy);
    assert.notDeepEqual(realmCodec.validateRealmLaunchV0(copy), []);
  }

  assert.match(realmCodec.validateOriginLineageV0({ ...value.originLineage, chainIdAlias: '31337' }).join('\n'), /unknown field.*chainIdAlias/i);
  assert.match(realmCodec.validateComponentDescriptorV0({ ...value.component, proxyAdmin: addr('98') }).join('\n'), /unknown field.*proxyAdmin/i);
  assert.match(realmCodec.validateComponentDescriptorV0({ ...value.component, hiddenDependencies: [b32('98')] }).join('\n'), /unknown field.*hiddenDependencies/i);
  assert.match(realmCodec.validateComponentDescriptorV0({ ...value.component, coreAddress: addr('00') }).join('\n'), /nonzero.*coreAddress|coreAddress.*nonzero/i);
  assert.match(realmCodec.validateComponentDescriptorV0({ ...value.component, disclosedPowers: [1, 2, 3, 4, 5, 6, 7, 8, 9] }).join('\n'), /0\.\.8/i);
});
