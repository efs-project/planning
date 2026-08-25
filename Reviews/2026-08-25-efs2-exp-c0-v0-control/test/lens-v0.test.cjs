'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PROBE_STATUS,
  positionKey,
  resolutionPlanId,
  resolveFirstFoundAfterProvedAbsence,
  validateResolutionPlanV0,
} = require('../src/lens-v0.cjs');

const b32 = (byte) => `0x${byte.repeat(32)}`;

function plan(count) {
  return {
    purpose: b32('20'),
    subject: b32('10'),
    principals: Array.from({ length: count }, (_, index) => b32((index + 1).toString(16).padStart(2, '0'))),
    combiner: 1,
    maximumProbes: count,
  };
}

function evidence(status, basis, recordId = b32('00')) {
  return { status, basisCommitment: basis, recordId };
}

test('ResolutionPlanV0 is exact, ordered, unique, and bounded at 1/8/32/64', () => {
  for (const count of [1, 8, 32, 64]) {
    const value = plan(count);
    assert.deepEqual(validateResolutionPlanV0(value), []);
    assert.match(resolutionPlanId(value), /^0x[0-9a-f]{64}$/);
  }
  assert.match(validateResolutionPlanV0(plan(0)).join('\n'), /1\.\.64/);
  assert.match(validateResolutionPlanV0(plan(65)).join('\n'), /1\.\.64/);
  const duplicate = plan(8);
  duplicate.principals[7] = duplicate.principals[0];
  assert.match(validateResolutionPlanV0(duplicate).join('\n'), /unique/i);
  const wrongMaximum = plan(8);
  wrongMaximum.maximumProbes = 7;
  assert.match(validateResolutionPlanV0(wrongMaximum).join('\n'), /maximumProbes/i);
});

test('first FOUND selects; proved absence alone permits fallback', () => {
  const value = plan(8);
  const basis = b32('70');
  const selected = b32('71');
  const result = resolveFirstFoundAfterProvedAbsence(value, b32('72'), basis, (_, index) => (
    index < 7
      ? evidence(PROBE_STATUS.ABSENT_PROVEN, basis)
      : evidence(PROBE_STATUS.FOUND, basis, selected)
  ));
  assert.equal(result.selectedPresent, true);
  assert.equal(result.selectedRecordId, selected);
  assert.equal(result.selectedPrincipalId, value.principals[7]);
  assert.equal(result.probes.length, 8);
});

test('resolver derives the exact PositionKey from the stored Plan scope and caller fieldRole', () => {
  const value = plan(1);
  const basis = b32('70');
  const fieldRole = b32('72');
  const expectedPosition = '0xd4328c02e1d8047ac04f421e28bf32f674a7aa7e3c25dca0bab332702bb0d59b';
  let probedPosition;
  const result = resolveFirstFoundAfterProvedAbsence(value, fieldRole, basis, (_principal, _index, position) => {
    probedPosition = position;
    return evidence(PROBE_STATUS.FOUND, basis, b32('71'));
  });

  assert.equal(probedPosition, expectedPosition);
  assert.equal(result.probes[0].positionKey, expectedPosition);
  assert.notEqual(result.probes[0].positionKey, fieldRole, 'fieldRole is not an arbitrary PositionKey escape hatch');
});

test('UNKNOWN, CONFLICT, UNSUPPORTED, and mixed basis stop without fallback', () => {
  for (const terminal of [PROBE_STATUS.UNKNOWN, PROBE_STATUS.CONFLICT, PROBE_STATUS.UNSUPPORTED]) {
    const value = plan(8);
    const basis = b32('70');
    const later = b32('71');
    const result = resolveFirstFoundAfterProvedAbsence(value, b32('72'), basis, (_, index) => {
      if (index === 0) return evidence(PROBE_STATUS.ABSENT_PROVEN, basis);
      if (index === 1) return evidence(terminal, basis);
      return evidence(PROBE_STATUS.FOUND, basis, later);
    });
    assert.equal(result.selectedPresent, false, terminal);
    assert.equal(result.probes.length, 2, terminal);
    assert.equal(result.terminalStatus, terminal);
  }

  const value = plan(8);
  const mixed = resolveFirstFoundAfterProvedAbsence(value, b32('72'), b32('70'), (_, index) => (
    index === 0
      ? evidence(PROBE_STATUS.ABSENT_PROVEN, b32('70'))
      : evidence(PROBE_STATUS.FOUND, b32('99'), b32('71'))
  ));
  assert.equal(mixed.selectedPresent, false);
  assert.equal(mixed.terminalStatus, PROBE_STATUS.BASIS_MISMATCH);
  assert.equal(mixed.probes.length, 2);
});

test('plan ID binds beneficiary-selected policy; order/substitution cannot be hidden', () => {
  const value = plan(8);
  const id = resolutionPlanId(value);
  const reversed = structuredClone(value);
  reversed.principals.reverse();
  assert.notEqual(resolutionPlanId(reversed), id);
  assert.notEqual(resolutionPlanId({ ...value, purpose: b32('21') }), id);
  assert.notEqual(resolutionPlanId({ ...value, subject: b32('99') }), id);
  assert.notEqual(resolutionPlanId({ ...value, combiner: 2 }), id);
});

test('purpose is a full-width semantic coordinate without low-bit aliasing', () => {
  const value = plan(1);
  const sameLowBits = `0x${'01'.padStart(64, '0')}`;
  const highBitsDiffer = `0x01${'00'.repeat(30)}01`;
  assert.deepEqual(validateResolutionPlanV0({ ...value, purpose: sameLowBits }), []);
  assert.deepEqual(validateResolutionPlanV0({ ...value, purpose: highBitsDiffer }), []);
  assert.notEqual(
    resolutionPlanId({ ...value, purpose: sameLowBits }),
    resolutionPlanId({ ...value, purpose: highBitsDiffer }),
  );
  assert.match(validateResolutionPlanV0({ ...value, purpose: 1 }).join('\n'), /bytes32/i);
  assert.match(validateResolutionPlanV0({ ...value, purpose: b32('00') }).join('\n'), /purpose.*nonzero/i);
  assert.match(validateResolutionPlanV0({ ...value, subject: b32('00') }).join('\n'), /subject.*nonzero/i);
  assert.throws(() => positionKey({ purpose: value.purpose, subject: value.subject, fieldRole: b32('00') }), /fieldRole.*nonzero/i);
  assert.throws(
    () => resolveFirstFoundAfterProvedAbsence(value, b32('00'), b32('70'), () => evidence(PROBE_STATUS.UNKNOWN, b32('70'))),
    /fieldRole.*nonzero/i,
  );
});

test('all proved absent is a terminal proved-absence result, not UNKNOWN', () => {
  const value = plan(64);
  const basis = b32('70');
  const result = resolveFirstFoundAfterProvedAbsence(
    value,
    b32('72'),
    basis,
    () => evidence(PROBE_STATUS.ABSENT_PROVEN, basis),
  );
  assert.equal(result.selectedPresent, false);
  assert.equal(result.terminalStatus, PROBE_STATUS.ABSENT_PROVEN);
  assert.equal(result.probes.length, 64);
});
