import test from 'node:test';
import assert from 'node:assert/strict';
const sdk = await import('../sdk/client.mjs').catch(() => ({}));
test('reject invalid names before signing; percent stays literal', () => {
  assert.equal(typeof sdk.validateName, 'function');
  for (const name of ['', '.', '..', '/', 'a/b', 'é', '\n', 'x'.repeat(65)]) assert.throws(() => sdk.validateName(name));
  assert.equal(sdk.validateName('%2F'), '%2F');
});
test('reject public endpoints and malformed IDs', () => {
  assert.equal(typeof sdk.validateConfig, 'function');
  assert.throws(() => sdk.validateConfig({rpc:'https://ethereum.example'}));
  assert.equal(typeof sdk.validateId, 'function');
  for (const id of ['0x12', '', '0x'+'z'.repeat(64)]) assert.throws(() => sdk.validateId(id));
});
