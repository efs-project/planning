'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const vector = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vectors/plan-operation-v0.json'), 'utf8'));
let planCodec = {};
try {
  planCodec = require('../src/plan-v0.cjs');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const b32 = (byte) => `0x${byte.repeat(32)}`;
const ZERO = b32('00');
const clonePlan = () => structuredClone(vector.inputs.plan);

function effect(kind, overrides = {}) {
  const base = {
    kind,
    principalId: ZERO,
    positionKey: ZERO,
    recordId: ZERO,
    occurrenceId: ZERO,
    expectedRevision: 0,
    queryProfileId: ZERO,
    generation: 0,
    coverageHighWater: '0',
    terminalCount: 0,
    terminalPostingsRoot: ZERO,
  };

  const active = {
    1: { principalId: b32('01'), positionKey: b32('11'), recordId: b32('21') },
    2: { principalId: b32('03'), positionKey: b32('33') },
    3: { principalId: b32('04'), occurrenceId: b32('44') },
    4: { queryProfileId: b32('05'), generation: 1 },
    5: { queryProfileId: b32('06'), generation: 1, coverageHighWater: '7' },
  };

  return { ...base, ...(active[kind] ?? {}), ...overrides };
}

function assertEffectRejected(candidate, label) {
  const plan = clonePlan();
  plan.effects = [candidate];
  assert.throws(() => planCodec.admissionPlanId(plan), undefined, `${label}: AdmissionPlanId must reject`);
  assert.throws(() => planCodec.effectSetId([candidate]), undefined, `${label}: EffectSetId must reject`);
}

function ids(plan) {
  return {
    admissionPlanId: planCodec.admissionPlanId(plan),
    effectSetId: planCodec.effectSetId(plan.effects),
    operationId: planCodec.operationId(
      planCodec.admissionPlanId(plan),
      planCodec.effectSetId(plan.effects),
    ),
  };
}

test('JS implementation reproduces the independently frozen plan and operation IDs', () => {
  assert.equal(typeof planCodec.admissionPlanId, 'function', 'plan-v0 implementation must exist');
  assert.deepEqual(ids(clonePlan()), vector.expected);
});

test('every non-effect AdmissionPlan coordinate binds AdmissionPlanId and OperationId only', () => {
  const baseline = ids(clonePlan());
  const mutations = {
    occurrenceIds: (plan) => { plan.occurrenceIds[0] = b32('01'); },
    realmId: (plan) => { plan.realmId = b32('02'); },
    realmRevisionId: (plan) => { plan.realmRevisionId = b32('03'); },
    coreCommitment: (plan) => { plan.coreCommitment = b32('04'); },
    semanticAuthor: (plan) => { plan.semanticAuthor = b32('05'); },
    actor: (plan) => { plan.actor = b32('06'); },
    verifierProfileId: (plan) => { plan.verifierProfileId = b32('07'); },
    nonceLane: (plan) => { plan.nonceLane += 1; },
    nonce: (plan) => { plan.nonce = String(BigInt(plan.nonce) + 1n); },
    expiryCoordinate: (plan) => { plan.expiryCoordinate = String(BigInt(plan.expiryCoordinate) + 1n); },
    executorCommitment: (plan) => { plan.executorCommitment = b32('08'); },
    dependencyCommitment: (plan) => { plan.dependencyCommitment = b32('09'); },
    payer: (plan) => { plan.payer = b32('0a'); },
    maximumCost: (plan) => { plan.maximumCost = String(BigInt(plan.maximumCost) + 1n); },
  };

  for (const [coordinate, mutate] of Object.entries(mutations)) {
    const plan = clonePlan();
    mutate(plan);
    const changed = ids(plan);
    assert.notEqual(changed.admissionPlanId, baseline.admissionPlanId, `${coordinate} must bind AdmissionPlanId`);
    assert.equal(changed.effectSetId, baseline.effectSetId, `${coordinate} must not alter EffectSetId`);
    assert.notEqual(changed.operationId, baseline.operationId, `${coordinate} must bind OperationId`);
  }
});

test('every semantically active EffectV0 coordinate binds all derived IDs', () => {
  const baseline = ids(clonePlan());
  const mutations = {
    kind: (effect) => {
      effect.kind = 2;
      effect.recordId = ZERO;
    },
    principalId: (effect) => { effect.principalId = b32('11'); },
    positionKey: (effect) => { effect.positionKey = b32('12'); },
    recordId: (effect) => { effect.recordId = b32('13'); },
    expectedRevision: (effect) => { effect.expectedRevision += 1; },
    queryProfileId: (_effect, plan) => { plan.effects[1].queryProfileId = b32('15'); },
    generation: (_effect, plan) => { plan.effects[1].generation += 1; },
    coverageHighWater: (_effect, plan) => { plan.effects[1].coverageHighWater = '3'; },
    terminalCount: (_effect, plan) => { plan.effects[1].terminalCount += 1; },
    terminalPostingsRoot: (_effect, plan) => { plan.effects[1].terminalPostingsRoot = b32('16'); },
  };

  for (const [coordinate, mutate] of Object.entries(mutations)) {
    const plan = clonePlan();
    mutate(plan.effects[0], plan);
    const changed = ids(plan);
    assert.notEqual(changed.admissionPlanId, baseline.admissionPlanId, `${coordinate} must bind AdmissionPlanId`);
    assert.notEqual(changed.effectSetId, baseline.effectSetId, `${coordinate} must bind EffectSetId`);
    assert.notEqual(changed.operationId, baseline.operationId, `${coordinate} must bind OperationId`);
  }
});

test('caller-supplied occurrence and effect order are committed without silent normalization', () => {
  const baseline = ids(clonePlan());
  const occurrenceSwap = clonePlan();
  occurrenceSwap.occurrenceIds.reverse();
  assert.notEqual(ids(occurrenceSwap).admissionPlanId, baseline.admissionPlanId);

  const effectSwap = clonePlan();
  effectSwap.effects.reverse();
  assert.throws(() => ids(effectSwap), /effect order/i);
});

test('each EffectV0 kind rejects every inactive coordinate', () => {
  const inactive = {
    1: ['occurrenceId', 'queryProfileId', 'generation', 'coverageHighWater', 'terminalCount', 'terminalPostingsRoot'],
    2: ['recordId', 'occurrenceId', 'queryProfileId', 'generation', 'coverageHighWater', 'terminalCount', 'terminalPostingsRoot'],
    3: ['positionKey', 'recordId', 'expectedRevision', 'queryProfileId', 'generation', 'coverageHighWater', 'terminalCount', 'terminalPostingsRoot'],
    4: ['principalId', 'positionKey', 'recordId', 'occurrenceId', 'expectedRevision', 'coverageHighWater', 'terminalCount', 'terminalPostingsRoot'],
    5: ['principalId', 'positionKey', 'recordId', 'occurrenceId', 'expectedRevision'],
  };
  const bytes32Coordinates = new Set([
    'principalId', 'positionKey', 'recordId', 'occurrenceId', 'queryProfileId', 'terminalPostingsRoot',
  ]);

  for (const [kindText, coordinates] of Object.entries(inactive)) {
    const kind = Number(kindText);
    for (const coordinate of coordinates) {
      const candidate = effect(kind);
      candidate[coordinate] = bytes32Coordinates.has(coordinate) ? b32('fe') : 1;
      assertEffectRejected(candidate, `kind ${kind} hidden ${coordinate}`);
    }
  }
});

test('required EffectV0 targets and generations reject zero, and unknown kinds reject', () => {
  for (const [kind, coordinate] of [
    [1, 'principalId'], [1, 'positionKey'], [1, 'recordId'],
    [2, 'principalId'], [2, 'positionKey'],
    [3, 'principalId'], [3, 'occurrenceId'],
    [4, 'queryProfileId'], [5, 'queryProfileId'],
  ]) {
    const candidate = effect(kind);
    candidate[coordinate] = ZERO;
    assertEffectRejected(candidate, `kind ${kind} zero ${coordinate}`);
  }

  assertEffectRejected(effect(4, { generation: 0 }), 'ACTIVATE_QUERY zero generation');
  assertEffectRejected(effect(5, { generation: 0 }), 'ADVANCE_COVERAGE zero generation');
  assertEffectRejected(effect(99), 'unknown effect kind');
});

test('ADVANCE_COVERAGE enforces u32 high water and terminal root/count coupling', () => {
  assertEffectRejected(
    effect(5, { coverageHighWater: String(2n ** 32n) }),
    'coverage high water wider than u32',
  );
  assertEffectRejected(
    effect(5, { terminalCount: 1, terminalPostingsRoot: ZERO }),
    'nonterminal advance with terminal count',
  );

  assert.doesNotThrow(() => planCodec.effectSetId([
    effect(5, { terminalCount: 0, terminalPostingsRoot: b32('cc') }),
  ]), 'terminal empty postings set is valid');
});

test('effect target keys are exact kind-specific tuple hashes', () => {
  const literals = [
    [effect(1), '0x541a7b9370cba0017c8c0da4eb2dd857b679bce10cc581ceb868605ecca89f0c'],
    [effect(2), '0xe52d03041c5858d6103e7ac333fac79a70490ae4f4d56394928ddce1d6819e39'],
    [effect(3), '0x82a5a797f201f77aee89a506893f431e36c0ba9c1a7785854b1d8a040a3405ee'],
    [effect(4), '0x62af3ed2ee7d7de0f50f662ea2b255bcdabc185898000a6637488a07abb85b78'],
    [effect(5), '0x1e9fb52756a981cdaceb2664fc884573708429dccf744d07aaf9ccc11513dbfb'],
  ];

  for (const [candidate, expected] of literals) {
    assert.equal(planCodec.effectTargetKey(candidate), expected);
  }
});

test('effect arrays require kind then target-key order and reject duplicate kind+target', () => {
  const bindA = effect(1);
  const bindB = effect(1, { principalId: b32('02'), positionKey: b32('22') });
  assert.doesNotThrow(() => planCodec.effectSetId([bindA, bindB]));
  assert.throws(() => planCodec.effectSetId([bindB, bindA]), /effect order/i);
  assert.throws(() => planCodec.effectSetId([bindA, structuredClone(bindA)]), /duplicate effect target/i);
  assert.throws(() => planCodec.effectSetId([effect(2), bindA]), /effect order/i);

  const generationOne = effect(5);
  const generationTwo = effect(5, { generation: 2 });
  assert.doesNotThrow(
    () => planCodec.effectSetId([generationOne, generationTwo]),
    'query target key must distinguish generations of the same profile',
  );
  assert.throws(() => planCodec.effectSetId([generationTwo, generationOne]), /effect order/i);
});

test('AdmissionPlan requires one or two unique nonzero occurrence IDs but does not infer leaf order from IDs', () => {
  const one = clonePlan();
  one.occurrenceIds = [one.occurrenceIds[0]];
  assert.doesNotThrow(() => planCodec.admissionPlanId(one));

  const zero = clonePlan();
  zero.occurrenceIds = [];
  assert.throws(() => planCodec.admissionPlanId(zero), /occurrence count/i);

  const three = clonePlan();
  three.occurrenceIds.push(b32('ef'));
  assert.throws(() => planCodec.admissionPlanId(three), /occurrence count/i);

  const nullId = clonePlan();
  nullId.occurrenceIds[0] = ZERO;
  assert.throws(() => planCodec.admissionPlanId(nullId), /occurrence id/i);

  const duplicate = clonePlan();
  duplicate.occurrenceIds[1] = duplicate.occurrenceIds[0];
  assert.throws(() => planCodec.admissionPlanId(duplicate), /duplicate occurrence/i);

  const reversed = clonePlan();
  reversed.occurrenceIds.reverse();
  assert.doesNotThrow(() => planCodec.admissionPlanId(reversed));
});

test('independent builder reproduces the frozen vector without importing implementation', () => {
  const emitted = execFileSync(
    process.execPath,
    [path.resolve(__dirname, '../scripts/build-plan-vector.cjs')],
    { encoding: 'utf8' },
  );
  assert.deepEqual(JSON.parse(emitted), vector);
});
