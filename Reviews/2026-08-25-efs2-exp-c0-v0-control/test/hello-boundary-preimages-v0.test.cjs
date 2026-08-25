'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256 } = ethereumRequire('ethers');
const abi = AbiCoder.defaultAbiCoder();

const {
  buildHelloFilesScenario,
  validateHelloFilesScenario,
} = require('../src/hello-files-v0.cjs');
const {
  commitByteReadRequestV0,
  commitSourceDescriptorV0,
  decodeByteReadRequestV0,
  decodeSourceDescriptorV0,
  encodeSourceDescriptorV0,
} = require('../src/read-request-v0.cjs');
const {
  commitComponentDescriptorV0,
  commitOriginLineageV0,
  decodeComponentDescriptorV0,
  decodeOriginLineageV0,
} = require('../src/realm-launch-v0.cjs');

test('HELLO launch, source, and byte read retain a self-authenticating transitive preimage chain', () => {
  const scenario = buildHelloFilesScenario();
  const { launch } = scenario;
  assert.ok(launch.originLineageBytes, 'launch must retain OriginLineageV0 bytes');
  assert.ok(launch.componentDescriptorBytes, 'launch must retain ComponentDescriptorV0 bytes');
  assert.ok(launch.sourceDescriptorBytes, 'launch must retain SourceDescriptorV0 bytes');
  assert.ok(launch.requestBytes, 'launch must retain ByteReadRequestV0 bytes');

  const origin = decodeOriginLineageV0(launch.originLineageBytes);
  const component = decodeComponentDescriptorV0(launch.componentDescriptorBytes);
  const source = decodeSourceDescriptorV0(launch.sourceDescriptorBytes);
  const request = decodeByteReadRequestV0(launch.requestBytes);
  assert.equal(commitOriginLineageV0(origin), launch.originLineageCommitment);
  assert.equal(commitComponentDescriptorV0(component), launch.componentDescriptorCommitment);
  assert.equal(commitSourceDescriptorV0(source), launch.sourceDescriptorCommitment);
  assert.equal(commitByteReadRequestV0(request), launch.requestCommitment);
  assert.equal(keccak256(launch.runtimeCodeBytes), launch.coreRuntimeCodeCommitment);
  assert.equal(source.originLineageCommitment, launch.originLineageCommitment);
  assert.equal(source.componentDescriptorCommitment, launch.componentDescriptorCommitment);
  assert.equal(source.realmId, launch.realmId);
  assert.equal(source.realmRevisionId, launch.realmRevisionId);
  assert.equal(request.realmId, launch.realmId);
  assert.equal(request.realmRevisionId, launch.realmRevisionId);
  assert.equal(request.recordId, scenario.portable.records.fileRevision.id);
  assert.equal(request.expectedDigest, scenario.portable.fileDigest);
  assert.deepEqual(Object.keys(scenario.realm.bootstrap).sort(), [
    'coreCommitment',
    'disclosedPowers',
    'genesisCommitment',
    'initialRevisionCommitment',
    'initialRevisionId',
    'originLineage',
  ]);
  assert.equal(scenario.realm.bootstrap.initialRevisionCommitment, scenario.realm.initialRevisionCommitment);
  assert.equal(scenario.realm.bootstrap.initialRevisionId, scenario.realm.revisionId);
  assert.deepEqual(validateHelloFilesScenario(scenario), []);
});

test('HELLO RequiredPointInput binds fieldRole and cannot carry an unrelated PositionKey', () => {
  const scenario = buildHelloFilesScenario();
  for (const prefix of ['name', 'revision']) {
    const binding = scenario.bindings[prefix];
    const resolution = scenario.lens[`${prefix}Resolution`];
    assert.equal(resolution.probes[0].positionKey, binding.positionKey);
    assert.equal(scenario.lens[`${prefix}RequiredPointInput`].fieldRole, binding.fieldRole);
    assert.equal(scenario.lens[`${prefix}RequiredPointInput`].positionKey, binding.positionKey);
  }

  const requiredRows = scenario.projection.entries.filter(({ collectionKind }) => collectionKind === 21);
  assert.equal(requiredRows.length, 2);
  for (const row of requiredRows) {
    const key = abi.decode(['tuple(bytes32,bytes32)'], row.key)[0];
    const value = abi.decode(['tuple(bytes32,bytes32,bytes32,bytes32[])'], row.value)[0];
    assert.equal(value[0], key[0]);
    assert.equal(value[2], key[1]);
  }
});

test('HELLO rejects each independently substituted request, source, Realm, code, and Lens-scope preimage', () => {
  const mutations = [
    ['request bytes', (copy) => { copy.launch.requestBytes = `${copy.launch.requestBytes}00`; }],
    ['source bytes', (copy) => { copy.launch.sourceDescriptorBytes = `${copy.launch.sourceDescriptorBytes}00`; }],
    ['source chain namespace', (copy) => {
      const source = decodeSourceDescriptorV0(copy.launch.sourceDescriptorBytes);
      source.chainNamespace = '0x6f74686572';
      copy.launch.sourceDescriptorBytes = encodeSourceDescriptorV0(source);
    }],
    ['component bytes', (copy) => { copy.launch.componentDescriptorBytes = `${copy.launch.componentDescriptorBytes}00`; }],
    ['origin bytes', (copy) => { copy.launch.originLineageBytes = `${copy.launch.originLineageBytes}00`; }],
    ['core address', (copy) => { copy.launch.coreAddress = `0x${'99'.repeat(20)}`; }],
    ['runtime code', (copy) => { copy.launch.coreRuntimeCodeCommitment = `0x${'99'.repeat(32)}`; }],
    ['dependency', (copy) => { copy.launch.dependencyCommitment = `0x${'99'.repeat(32)}`; }],
    ['routing', (copy) => { copy.launch.routingCommitment = `0x${'99'.repeat(32)}`; }],
    ['administration', (copy) => { copy.launch.administrationCommitment = `0x${'99'.repeat(32)}`; }],
    ['powers', (copy) => { copy.launch.disclosedPowers = [1, 3]; }],
    ['initial revision commitment', (copy) => { copy.realm.bootstrap.initialRevisionCommitment = `0x${'97'.repeat(32)}`; }],
    ['initial revision id', (copy) => { copy.realm.bootstrap.initialRevisionId = `0x${'96'.repeat(32)}`; }],
    ['hidden bootstrap coordinate', (copy) => { copy.realm.bootstrap.componentCommitment = `0x${'95'.repeat(32)}`; }],
    ['endpoint eligibility', (copy) => { copy.acquisition.packet.attempts[0].eligible = false; }],
    ['Lens fieldRole', (copy) => { copy.lens.nameRequiredPointInput.fieldRole = copy.bindings.revision.fieldRole; }],
    ['zero Lens fieldRole', (copy) => { copy.lens.nameRequiredPointInput.fieldRole = `0x${'00'.repeat(32)}`; }],
    ['stronger canonicality grade', (copy) => { copy.sourceObservation.evidence.canonicalityAssessment = 3; }],
    ['invented proof', (copy) => {
      copy.sourceObservation.evidence.proofKind = 2;
      copy.sourceObservation.evidence.proofScope = 2;
      copy.sourceObservation.evidence.proofScopeCommitment = { present: true, value: `0x${'98'.repeat(32)}` };
    }],
    ['stronger causal availability', (copy) => { copy.sourceObservation.evidence.causalAvailability = 2; }],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(buildHelloFilesScenario());
    mutate(copy);
    assert.notDeepEqual(validateHelloFilesScenario(copy), [], label);
  }
});
