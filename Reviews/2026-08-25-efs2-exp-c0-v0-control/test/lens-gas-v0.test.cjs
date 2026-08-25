'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const controlRoot = path.resolve(__dirname, '..');
const evidence = JSON.parse(fs.readFileSync(path.join(controlRoot, 'lens-gas-v0.json'), 'utf8'));

function framedInputsSha256(inputPaths) {
  const hash = crypto.createHash('sha256');
  for (const inputPath of inputPaths) {
    const bytes = fs.readFileSync(path.join(controlRoot, inputPath));
    hash.update(Buffer.from(inputPath, 'utf8'));
    hash.update(Buffer.from([0]));
    hash.update(Buffer.from(String(bytes.length), 'utf8'));
    hash.update(Buffer.from([0]));
    hash.update(bytes);
  }
  return hash.digest('hex');
}

test('Lens gas evidence is date-free, disposable, and pinned to the exact measured control inputs', () => {
  assert.equal(evidence.protocolConformance, false);
  assert.equal(evidence.durable, false);
  assert.equal(evidence.measurementProvenance.measuredAt, undefined);
  assert.equal(
    evidence.measurementProvenance.inputHashAlgorithm,
    'SHA256_EACH_UTF8_PATH_NUL_DECIMAL_BYTE_LENGTH_NUL_RAW_BYTES_IN_ORDER',
  );
  assert.equal(
    framedInputsSha256(evidence.measurementProvenance.inputPaths),
    evidence.measurementProvenance.inputsSha256,
  );
  assert.deepEqual(evidence.measurements, [
    { principalCount: 1, coldGas: 30504, warmGas: 7699 },
    { principalCount: 8, coldGas: 92369, warmGas: 30113 },
    { principalCount: 32, coldGas: 314759, warmGas: 108979 },
    { principalCount: 64, coldGas: 616577, warmGas: 220280 },
  ]);
});
