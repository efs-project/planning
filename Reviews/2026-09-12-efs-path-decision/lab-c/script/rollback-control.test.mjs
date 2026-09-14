import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAttemptLink,
  assertExactError,
  assertExpectedReads,
  assertMinedTransaction,
  assertRawEqual,
  classifyReceipt,
  createGateState,
  finalizeGateState,
  validateRpcEnvelope,
} from './rollback-control.mjs';

const A = '0x1111111111111111111111111111111111111111';
const L = '0x2222222222222222222222222222222222222222';
const BLOCK = `0x${'33'.repeat(32)}`;
const OTHER_BLOCK = `0x${'66'.repeat(32)}`;
const MINED_EXPECTED = {
  from: A,
  to: L,
  nonce: 3,
  data: '0x1234',
  gas: 8_000_000n,
  hash: `0x${'55'.repeat(32)}`,
  blockNumber: 9,
};
const MINED_TRANSACTION = {
  from: A,
  to: L,
  nonce: '0x3',
  input: '0x1234',
  gas: '0x7a1200',
  hash: MINED_EXPECTED.hash,
  blockHash: BLOCK,
  blockNumber: '0x9',
  transactionIndex: '0x0',
};
const MINED_RECEIPT = { blockHash: BLOCK, blockNumber: '0x9', transactionIndex: '0x0' };
const MINED_HEADER = { hash: BLOCK, number: '0x9', gasLimit: '0x1c9c380' };

test('strict RPC envelopes reject partial, swapped, duplicate and malformed result/error shapes', () => {
  const valid = { httpStatus: 200, request: { id: 4 }, response: { jsonrpc: '2.0', id: 4, result: '0x01' } };
  assert.equal(validateRpcEnvelope(valid), valid.response);
  assert.throws(() => validateRpcEnvelope({ ...valid, httpStatus: 500 }), /HTTP status/);
  assert.throws(() => validateRpcEnvelope({ ...valid, response: { id: 4, result: '0x01' } }), /JSON-RPC version/);
  assert.throws(() => validateRpcEnvelope({ ...valid, response: { jsonrpc: '2.0', id: 5, result: '0x01' } }), /response ID/);
  assert.throws(() => validateRpcEnvelope({ ...valid, response: { jsonrpc: '2.0', id: 4 } }), /exactly one own result or error/);
  assert.throws(() => validateRpcEnvelope({ ...valid, response: { jsonrpc: '2.0', id: 4, result: '0x01', error: { code: -1, message: 'bad' } } }), /exactly one own result or error/);
  const error = { ...valid, response: { jsonrpc: '2.0', id: 4, error: { code: -32000, message: 'reverted', data: '0xdead' } } };
  assert.equal(validateRpcEnvelope(error, { allowError: true }), error.response);
  assert.throws(() => validateRpcEnvelope(error), /error not allowed/);
  assert.throws(() => validateRpcEnvelope({ ...error, response: { ...error.response, error: { code: '-1', message: 'bad' } } }, { allowError: true }), /error code/);
});

test('full bytes and hidden backing words are compared without selector or logical-length shortcuts', () => {
  const zero = `0x${'00'.repeat(32)}`;
  assert.equal(assertRawEqual('empty scope word', zero, zero), zero);
  assert.throws(() => assertRawEqual('empty scope word', `0x${'00'.repeat(31)}01`, zero), /empty scope word mismatch/);
  const expectedError = `0x08c379a0${'00'.repeat(95)}01`;
  assert.equal(assertExactError(expectedError, expectedError), expectedError);
  assert.throws(() => assertExactError(expectedError.slice(0, 10), expectedError), /full revert bytes mismatch/);
});

test('static and mined attempts require identical sender, destination, calldata and configured 5M gas', () => {
  const linked = assertAttemptLink(
    { from: A, to: L, data: '0x1234', gas: '0x4c4b40' },
    { from: A, to: L, input: '0x1234', gas: '0x4c4b40', hash: `0x${'44'.repeat(32)}` },
  );
  assert.equal(linked.gas, '5000000');
  assert.throws(() => assertAttemptLink({ from: A, to: L, data: '0xabcd', gas: '0x4c4b40' }, { from: A, to: L, input: '0x1234', gas: '0x4c4b40' }), /calldata/);
  assert.throws(() => assertAttemptLink({ from: A, to: L, data: '0x1234', gas: '0x4c4b40' }, { from: A, to: L, input: '0x1234', gas: '0x2dc6c0' }), /gas/);
});

test('a mined transaction must preserve the locally signed sender, target, nonce, data, gas and hash', () => {
  assert.equal(assertMinedTransaction(MINED_EXPECTED, MINED_TRANSACTION, MINED_RECEIPT, MINED_HEADER), true);
  assert.throws(() => assertMinedTransaction(MINED_EXPECTED, { ...MINED_TRANSACTION, input: '0xabcd' }, MINED_RECEIPT, MINED_HEADER), /mined calldata/);
  assert.throws(() => assertMinedTransaction(MINED_EXPECTED, { ...MINED_TRANSACTION, nonce: '0x4' }, MINED_RECEIPT, MINED_HEADER), /mined nonce/);
});

test('a mined transaction must agree directly with its receipt and header location', () => {
  assert.throws(
    () => assertMinedTransaction(MINED_EXPECTED, { ...MINED_TRANSACTION, blockHash: OTHER_BLOCK }, MINED_RECEIPT, MINED_HEADER),
    /mined\/receipt block hash/,
  );
  assert.throws(
    () => assertMinedTransaction(MINED_EXPECTED, { ...MINED_TRANSACTION, blockNumber: '0xa' }, MINED_RECEIPT, MINED_HEADER),
    /mined\/receipt block number/,
  );
  assert.throws(
    () => assertMinedTransaction(MINED_EXPECTED, MINED_TRANSACTION, MINED_RECEIPT, { ...MINED_HEADER, hash: OTHER_BLOCK }),
    /mined\/header block hash/,
  );
});

test('a mined transaction and receipt must both be first in the single-transaction block', () => {
  assert.throws(
    () => assertMinedTransaction(MINED_EXPECTED, { ...MINED_TRANSACTION, transactionIndex: '0x1' }, MINED_RECEIPT, MINED_HEADER),
    /mined transaction index/,
  );
  assert.throws(
    () => assertMinedTransaction(MINED_EXPECTED, MINED_TRANSACTION, { ...MINED_RECEIPT, transactionIndex: '0x1' }, MINED_HEADER),
    /receipt transaction index/,
  );
});

test('every observed mined header must retain the configured 30M gas limit', () => {
  assert.throws(
    () => assertMinedTransaction(MINED_EXPECTED, MINED_TRANSACTION, MINED_RECEIPT, { ...MINED_HEADER, gasLimit: '0x1c9c37f' }),
    /header gas limit/,
  );
});

test('refusal and calibration receipt classes fail closed', () => {
  const receipt = { status: '0x0', gasUsed: '0x5208', blockHash: BLOCK };
  assert.deepEqual(classifyReceipt('refusal', receipt), { status: 0, gasUsed: '21000', blockHash: BLOCK });
  assert.throws(() => classifyReceipt('refusal', { ...receipt, status: '0x1' }), /refusal receipt status/);
  assert.deepEqual(classifyReceipt('calibration', { ...receipt, status: '0x1' }), { status: 1, gasUsed: '21000', blockHash: BLOCK });
  assert.throws(() => classifyReceipt('calibration', receipt), /calibration receipt status/);
});

test('every declared logical and storage read needs one expected answer and exact labels', () => {
  const calls = { logical: { method: 'eth_call', params: [{ to: L, data: '0x1234' }] } };
  assert.deepEqual(assertExpectedReads(calls, { logical: '0x01' }, 'reads'), ['logical']);
  assert.throws(() => assertExpectedReads(calls, {}, 'reads'), /reads labels/);
  assert.throws(() => assertExpectedReads(calls, { logical: '0x01', extra: '0x02' }, 'reads'), /reads labels/);
});

test('incomplete and failed runs cannot publish green gates', () => {
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
