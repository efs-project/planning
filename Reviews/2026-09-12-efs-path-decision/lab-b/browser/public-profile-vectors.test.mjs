import test from 'node:test';
import assert from 'node:assert/strict';
import {getBytes, hexlify, keccak256, toUtf8Bytes} from 'ethers';

// Literals also appear in test/PublicProfileVectors.t.sol. Hex/Keccak outputs
// were independently checked with cast; neither side normalizes the name.
const vectors = [
  ['Report.TXT', '0x5265706f72742e545854', '0x36810084e09fd082065e1587a57a381b51c77bbb6ee74db5981e5b46b0fa4642'],
  ['report.txt', '0x7265706f72742e747874', '0x143801f1f10abf0e6876c8219bfd3c94b8a26e3b604b5ae3c46d383d7a864f70'],
  ['caf\u00e9.txt', '0x636166c3a92e747874', '0x51ca49ae9a12210906e1ab86ac1c8731e11cd86edf0df9dbbc4cfd13531de9d9'],
  ['cafe\u0301.txt', '0x63616665cc812e747874', '0x4674ddf120a1c4a844be00bf1c468c373a7faff9f25e6d8fe62fe13608d403be'],
  ['東京.txt', '0xe69db1e4baac2e747874', '0xc1d140dd028ebef7162124945fa2e9e82b6cf62c72cc60a250101139370c159d'],
  ['📁.png', '0xf09f93812e706e67', '0x5a1bc69c18b84a38befe5bbe3f361f8956cdfe7d76eb9e56562310a7d8c8bc38'],
  ['ملف.txt', '0xd985d984d9812e747874', '0xaf63a5b59dc2834bb6be59b295c8560db985ae2d6c92387a162229a9f980b4aa'],
];

test('browser UTF-8 bytes and local Keccak roles match the Solidity literals without an RPC', () => {
  for (const [name, bytes, role] of vectors) {
    assert.equal(hexlify(toUtf8Bytes(name)), bytes, `bytes for ${name}`);
    assert.equal(keccak256(bytes), role, `role for ${name}`);
  }
  assert.notEqual(vectors[0][2], vectors[1][2], 'case stays significant');
  assert.notEqual(vectors[2][2], vectors[3][2], 'composed and decomposed accents stay distinct');
});

test('255 UTF-8 bytes are a byte limit, not a character limit', () => {
  const name = '界'.repeat(85);
  const bytes = toUtf8Bytes(name);
  assert.equal(bytes.length, 255);
  assert.equal(hexlify(bytes), `0x${'e7958c'.repeat(85)}`);
  assert.equal(toUtf8Bytes(`${name}a`).length, 256);
  assert.equal(keccak256(bytes), keccak256(`0x${'e7958c'.repeat(85)}`));
});

test('malformed UTF-8 bytes cannot become a browser name by lossy decoding', () => {
  const fatal = new TextDecoder('utf-8', {fatal: true});
  for (const malformed of ['0xff', '0xc0af', '0xe282', '0xeda080', '0xf4908080']) {
    assert.throws(() => fatal.decode(getBytes(malformed)), TypeError, malformed);
  }
  assert.throws(() => toUtf8Bytes('\ud800'), /surrogate|invalid/i);
});
