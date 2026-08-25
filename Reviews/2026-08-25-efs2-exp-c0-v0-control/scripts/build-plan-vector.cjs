'use strict';

// Independent emitter: this duplicates the exact design tuple/domain contract
// and deliberately imports no implementation from src/.
const path = require('node:path');
const { createRequire } = require('node:module');

const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');

const abi = AbiCoder.defaultAbiCoder();
const version = 0;
const zero = `0x${'00'.repeat(32)}`;
const repeated = (byte) => `0x${byte.repeat(32)}`;
const domain = (name) => keccak256(toUtf8Bytes(name));

const effectAbi = 'tuple(uint8,bytes32,bytes32,bytes32,bytes32,uint32,bytes32,uint32,uint32,uint32,bytes32)';
const planAbi = `tuple(bytes32[],bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,uint64,uint64,bytes32,bytes32,bytes32,uint64,${effectAbi}[])`;

const effects = [
  {
    kind: 1,
    principalId: repeated('d2'),
    positionKey: repeated('c1'),
    recordId: '0x3fcaf90c6ed3c59d312f2179f4c7eac58c12f338b804c172ba706d003c0e36d3',
    occurrenceId: zero,
    expectedRevision: 0,
    queryProfileId: zero,
    generation: 0,
    coverageHighWater: '0',
    terminalCount: 0,
    terminalPostingsRoot: zero,
  },
  {
    kind: 5,
    principalId: zero,
    positionKey: zero,
    recordId: zero,
    occurrenceId: zero,
    expectedRevision: 0,
    queryProfileId: '0x7deb23272bc24a4c95f099885e1bdd0e26f665d9b6eb55c5a24120032a77b7e1',
    generation: 1,
    coverageHighWater: '2',
    terminalCount: 2,
    terminalPostingsRoot: repeated('cc'),
  },
];

const plan = {
  occurrenceIds: [
    '0xd4ef0b18b79a80d7794a0e9ab55b74da7a769ec134f5920e926c72a60e5dffb0',
    '0xd7666f18fc6fca4641654072f0dd4e780230b1f77d0e3dc33fbd3a67bee25829',
  ],
  realmId: '0x9e289671410f2b79594923c400395dd6196f90419c55b6fc1370ef5a08022633',
  realmRevisionId: '0x6f02a444ef364f0869c54fce0ea261c1d7c017419068d27cbadeb6d25c280ecd',
  coreCommitment: repeated('30'),
  semanticAuthor: '0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc',
  actor: '0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc',
  verifierProfileId: repeated('91'),
  nonceLane: 3,
  nonce: '7',
  expiryCoordinate: '100',
  executorCommitment: repeated('aa'),
  dependencyCommitment: repeated('bb'),
  payer: '0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc',
  maximumCost: '1000000',
  effects,
};

const effectValues = effects.map((effect) => [
  effect.kind,
  effect.principalId,
  effect.positionKey,
  effect.recordId,
  effect.occurrenceId,
  effect.expectedRevision,
  effect.queryProfileId,
  effect.generation,
  effect.coverageHighWater,
  effect.terminalCount,
  effect.terminalPostingsRoot,
]);
const planValue = [
  plan.occurrenceIds,
  plan.realmId,
  plan.realmRevisionId,
  plan.coreCommitment,
  plan.semanticAuthor,
  plan.actor,
  plan.verifierProfileId,
  plan.nonceLane,
  plan.nonce,
  plan.expiryCoordinate,
  plan.executorCommitment,
  plan.dependencyCommitment,
  plan.payer,
  plan.maximumCost,
  effectValues,
];

const admissionPlanId = keccak256(abi.encode(
  ['bytes32', 'uint16', planAbi],
  [domain('EFS2/EXP-C0/V0/ADMISSION_PLAN'), version, planValue],
));
const effectSetId = keccak256(abi.encode(
  ['bytes32', 'uint16', `${effectAbi}[]`],
  [domain('EFS2/EXP-C0/V0/EFFECT_SET'), version, effectValues],
));
const operationId = keccak256(abi.encode(
  ['bytes32', 'uint16', 'bytes32', 'bytes32'],
  [domain('EFS2/EXP-C0/V0/OPERATION'), version, admissionPlanId, effectSetId],
));

process.stdout.write(`${JSON.stringify({
  format: 'efs2-exp-c0-v0-plan-operation-vector/0',
  profileVersion: version,
  protocolConformance: false,
  durable: false,
  codec: 'SOLIDITY_ABI_V2_ABI_ENCODE',
  inputs: { plan },
  expected: { admissionPlanId, effectSetId, operationId },
}, null, 2)}\n`);
