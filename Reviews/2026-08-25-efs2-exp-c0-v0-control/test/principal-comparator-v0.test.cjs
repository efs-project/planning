'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const vector = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../principal-comparator-v0.json'), 'utf8'));
let comparator = {};
try {
  comparator = require('../src/principal-comparator-v0.cjs');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const b32 = (byte) => `0x${byte.repeat(32)}`;

test('both arms reproduce the frozen EOA and ERC1271 identity and signature bindings', () => {
  assert.equal(typeof comparator.uniformPrincipalId, 'function', 'principal comparator implementation must exist');
  const { inputs, expected } = vector;
  const uniformEoa = comparator.uniformPrincipalId(inputs.eoaPrincipal);
  const uniform1271 = comparator.uniformPrincipalId(inputs.erc1271Principal);
  const taggedEoa = comparator.taggedAuthorKey(inputs.taggedEoa);
  const tagged1271 = comparator.taggedAuthorKey(inputs.taggedErc1271);

  assert.equal(uniformEoa, expected.uniformEoaPrincipalId);
  assert.equal(uniform1271, expected.uniformErc1271PrincipalId);
  assert.equal(taggedEoa, expected.taggedEoaAuthorKey);
  assert.equal(tagged1271, expected.taggedErc1271AuthorKey);
  assert.equal(comparator.taggedAuthorKey(inputs.taggedManaged), expected.taggedManagedPrincipalKey);
  assert.equal(
    comparator.signatureDigest(inputs.messageId, uniformEoa, inputs.eoaVerifierProfileId),
    expected.uniformEoaSignatureDigest,
  );
  assert.equal(
    comparator.signatureDigest(inputs.messageId, uniform1271, inputs.erc1271VerifierProfileId),
    expected.uniformErc1271SignatureDigest,
  );
  assert.equal(
    comparator.signatureDigest(inputs.messageId, taggedEoa, inputs.eoaVerifierProfileId),
    expected.taggedEoaSignatureDigest,
  );
  assert.equal(
    comparator.signatureDigest(inputs.messageId, tagged1271, inputs.erc1271VerifierProfileId),
    expected.taggedErc1271SignatureDigest,
  );
});

test('exact ABI sizes expose descriptor/setup cost separately from steady-state author APIs', () => {
  const { inputs, expected } = vector;
  assert.deepEqual(comparator.abiSizes(inputs), expected.abiBytes);
  assert.equal(vector.comparison.uniform.firstWriteSetupTransactions, 0);
  assert.equal(vector.comparison.tagged.firstWriteSetupTransactions, 0);
  assert.equal(expected.abiBytes.uniformAuthorApiKey, 32);
  assert.equal(expected.abiBytes.taggedAuthorRef, 64);
});

test('uniform identity binds authority kind, origin, and account while tagged ACCOUNT does not bind authority class', () => {
  const { inputs, expected } = vector;
  const changedKind = { ...inputs.eoaPrincipal, authorityKind: 2 };
  const changedOrigin = { ...inputs.eoaPrincipal, originLineage: '0x01' };
  const changedAccount = { ...inputs.eoaPrincipal, account: '0x1212121212121212121212121212121212121212' };
  assert.notEqual(comparator.uniformPrincipalId(changedKind), expected.uniformEoaPrincipalId);
  assert.notEqual(comparator.uniformPrincipalId(changedOrigin), expected.uniformEoaPrincipalId);
  assert.notEqual(comparator.uniformPrincipalId(changedAccount), expected.uniformEoaPrincipalId);

  assert.equal(comparator.taggedAuthorKey(inputs.taggedEoa), expected.taggedEoaAuthorKey);
  assert.equal(vector.comparison.tagged.authorityClassBoundInIdentity, false);
  assert.notEqual(
    comparator.signatureDigest(inputs.messageId, expected.taggedEoaAuthorKey, inputs.erc1271VerifierProfileId),
    expected.taggedEoaSignatureDigest,
    'tagged authority class must be supplied and bound by the verifier profile receipt',
  );
});

test('tag and full-width value are both mapping and signature binding coordinates', () => {
  const { inputs, expected } = vector;
  const changedTag = { ...inputs.taggedEoa, kind: 1 };
  const changedValue = { ...inputs.taggedEoa, value: b32('13') };
  for (const changed of [changedTag, changedValue]) {
    const key = comparator.taggedAuthorKey(changed);
    assert.notEqual(key, expected.taggedEoaAuthorKey);
    assert.notEqual(
      comparator.signatureDigest(inputs.messageId, key, inputs.eoaVerifierProfileId),
      expected.taggedEoaSignatureDigest,
    );
  }
});

test('both arms preserve full-width keys with identical low 160 bits', () => {
  const low160 = 'abababababababababababababababababababab';
  const first = `0x${'11'.repeat(12)}${low160}`;
  const second = `0x${'22'.repeat(12)}${low160}`;
  assert.notEqual(comparator.uniformMappingKey(first), comparator.uniformMappingKey(second));
  assert.notEqual(
    comparator.taggedAuthorKey({ kind: 1, value: first }),
    comparator.taggedAuthorKey({ kind: 1, value: second }),
  );
});

test('historical verifier basis remains required for both arms and both authority kinds', () => {
  for (const arm of ['uniform', 'tagged']) {
    assert.equal(vector.comparison[arm].historicalVerifierBasisRequiredForEoa, true);
    assert.equal(vector.comparison[arm].historicalVerifierBasisRequiredForErc1271, true);
  }
});

test('EOA to managed association preserves old IDs but tagged history requires two keyspaces', () => {
  const { inputs, expected } = vector;
  const uniform = comparator.associateUniform(
    expected.uniformEoaPrincipalId,
    inputs.managedAuthorityRef,
    inputs.associationOrdinal,
  );
  assert.equal(uniform.identityKey, expected.uniformEoaPrincipalId);
  assert.deepEqual(uniform.queryKeys, [expected.uniformEoaPrincipalId]);
  assert.equal(uniform.rewrittenOldIds, 0);

  const tagged = comparator.associateTagged(
    inputs.taggedEoa,
    inputs.taggedManaged,
    inputs.associationOrdinal,
  );
  assert.deepEqual(tagged.queryKeys, [expected.taggedEoaAuthorKey, expected.taggedManagedPrincipalKey]);
  assert.equal(tagged.rewrittenOldIds, 0);
  assert.equal(tagged.queryKeys.length, 2);
});
