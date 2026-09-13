import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAttemptLink, assertExactError, classifyReceipt, createGateState, finalizeGateState,
} from './rollback-control.mjs';

const FROM = '0x00000000000000000000000000000000000000a1';
const TO = '0x00000000000000000000000000000000000000b2';
const CALLDATA = '0x8846f57e1234';

const staticEnvelope = (overrides = {}) => ({
  request: {
    method: 'eth_call',
    params: [{ from: FROM, to: TO, data: CALLDATA, gas: '0x2dc6c0', ...overrides }, '0x10'],
  },
});

const minedTransaction = (overrides = {}) => ({
  from: FROM,
  to: TO,
  input: CALLDATA,
  gas: '0x2dc6c0',
  hash: `0x${'11'.repeat(32)}`,
  ...overrides,
});

test('assertAttemptLink accepts only the identical static and mined sender, destination and calldata', () => {
  assert.deepEqual(assertAttemptLink(staticEnvelope(), minedTransaction()), {
    from: FROM,
    to: TO,
    data: CALLDATA,
    gas: '3000000',
    transactionHash: `0x${'11'.repeat(32)}`,
  });
  assert.throws(() => assertAttemptLink(staticEnvelope({ from: `0x${'22'.repeat(20)}` }), minedTransaction()), /sender mismatch/);
  assert.throws(() => assertAttemptLink(staticEnvelope({ to: `0x${'33'.repeat(20)}` }), minedTransaction()), /destination mismatch/);
  assert.throws(() => assertAttemptLink(staticEnvelope({ data: '0x8846f57edead' }), minedTransaction()), /calldata mismatch/);
  assert.throws(() => assertAttemptLink(staticEnvelope({ gas: '0x2dc6bf' }), minedTransaction()), /gas mismatch/);
});

test('assertExactError rejects a selector-only or wrong-argument error', () => {
  const expected = `0xfc504b78${'0'.repeat(63)}1${'ab'.repeat(32)}`;
  assert.equal(assertExactError(expected.toUpperCase().replace('0X', '0x'), expected), expected);
  assert.throws(() => assertExactError('0xfc504b78', expected), /full revert bytes mismatch/);
  assert.throws(() => assertExactError(`${expected.slice(0, -2)}cd`, expected), /full revert bytes mismatch/);
});

test('classifyReceipt fails closed on the wrong or malformed receipt status', () => {
  assert.deepEqual(classifyReceipt('refusal', { status: '0x0', gasUsed: '0x5208', blockHash: `0x${'44'.repeat(32)}` }), { status: 0, gasUsed: '21000', blockHash: `0x${'44'.repeat(32)}` });
  assert.deepEqual(classifyReceipt('calibration', { status: '0x1', gasUsed: '0x7530', blockHash: `0x${'55'.repeat(32)}` }), { status: 1, gasUsed: '30000', blockHash: `0x${'55'.repeat(32)}` });
  assert.throws(() => classifyReceipt('refusal', { status: '0x1', gasUsed: '0x1', blockHash: `0x${'66'.repeat(32)}` }), /refusal receipt status/);
  assert.throws(() => classifyReceipt('calibration', { status: '0x0', gasUsed: '0x1', blockHash: `0x${'66'.repeat(32)}` }), /calibration receipt status/);
  assert.throws(() => classifyReceipt('refusal', null), /receipt missing/);
  assert.throws(() => classifyReceipt('refusal', { status: '0x0', gasUsed: 'NaN', blockHash: '0x12' }), /malformed/);
});

test('a failed or incomplete run cannot publish green evaluated gates', () => {
  const pending = createGateState();
  assert.deepEqual(finalizeGateState(pending, false), pending);
  assert.equal(pending.independentExpectations, false);
  assert.equal(pending.exactRawReplies, false);
  assert.equal(pending.staticMinedLinked, false);

  const complete = finalizeGateState(pending, true);
  assert.equal(complete.independentExpectations, true);
  assert.equal(complete.exactRawReplies, true);
  assert.equal(complete.staticMinedLinked, true);
});
