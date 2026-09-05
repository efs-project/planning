import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeBody, InvalidBody } from '../reference/record-body.mjs';

const schema = (fields, roles = [], constraints = []) => ({ fields, roles, constraints });
const field = (kind, extra = {}) => ({ name: 'value', kind, ...extra });
const invalid = (s, hex, code) => assert.throws(() => decodeBody(s, '0x' + hex), e => e instanceof InvalidBody && e.code === code);

test('BOOL preserves exact literals and rejects flags, truncation and trailing data', () => {
  const s = schema([field('BOOL')]);
  for (const hex of ['00', '01']) assert.deepEqual(decodeBody(s, '0x' + hex), { fields: ['0x' + hex], references: [] });
  invalid(s, '02', 7); invalid(s, '', 2); invalid(s, '0100', 1);
});

test('fixed-width integers, raw Principal and bytes keep every byte', () => {
  const fields = [field('UINT', { width: 32 }), field('INT', { width: 2 }), field('BYTES_FIXED', { width: 3 }), field('PRINCIPAL')];
  const enc = ['ff'.repeat(32), 'fffe', 'abcdef', '00'.repeat(32)];
  assert.deepEqual(decodeBody(schema(fields), '0x' + enc.join('')).fields, enc.map(x => '0x' + x));
  invalid(schema(fields), enc.join('').slice(0, -2), 2);
});

test('length bounds, fatal RFC 3629 UTF-8 and exact top-level framing', () => {
  const s = schema([field('BYTES', { max: 2 }), field('STRING', { max: 8 })]);
  assert.deepEqual(decodeBody(s, '0x0002ff000006c3a9f09f9880').fields, ['0x0002ff00', '0x0006c3a9f09f9880']);
  invalid(s, '00030000000000', 3); invalid(s, '0002ff', 2);
  const str = schema([field('STRING', { max: 8 })]);
  for (const hex of ['0002c080', '0003eda080', '0004f4908080', '00028080', '0002e282', '0001ff']) invalid(str, hex, 4);
  invalid(str, '0003c3a9', 2);
  // NFC and BOM are intentionally outside STRUCT-EVM, not accidentally normalized.
  assert.deepEqual(decodeBody(str, '0x000365cc81').fields, ['0x000365cc81']);
  assert.deepEqual(decodeBody(str, '0x0003efbbbf').fields, ['0x0003efbbbf']);
  invalid(str, '00'.repeat(8193), 3);
});

test('all DIGEST algorithms require their exact lengths and available bytes', () => {
  const s = schema([field('DIGEST')]);
  for (const [head, n] of [['00110014', 20], ['00120020', 32], ['00130040', 64], ['001b0020', 32], ['ef010014', 20]]) {
    const hex = head + 'ab'.repeat(n);
    assert.deepEqual(decodeBody(s, '0x' + hex).fields, ['0x' + hex]);
    invalid(s, hex.slice(0, -2), 2);
  }
  invalid(s, '00120014' + 'ab'.repeat(20), 9); invalid(s, 'ffff0000', 9); invalid(s, '001200', 2);
});

test('OPTION and ARRAY references preserve role order, full OCCREF and absent values', () => {
  const a = '11'.repeat(32), b = '22'.repeat(32);
  const s = schema([field('OPTION', { inner: field('REF') }), field('OCCREF'), field('ARRAY', { max: 2, inner: field('REF') })],
    [{ fieldIdx: 2, targetClass: 1 }, { fieldIdx: 0, targetClass: 5 }, { fieldIdx: 1, targetClass: 4 }]);
  const enc = ['01' + a, b + 'fedc', '0002' + b + a];
  assert.deepEqual(decodeBody(s, '0x' + enc.join('')), { fields: enc.map(x => '0x' + x), references: [
    { roleIndex: 1, targetId: '0x' + a, leafIndex: 0 }, { roleIndex: 2, targetId: '0x' + b, leafIndex: 65244 },
    { roleIndex: 0, targetId: '0x' + b, leafIndex: 0 }, { roleIndex: 0, targetId: '0x' + a, leafIndex: 0 }] });
  assert.equal(decodeBody(s, '0x00' + b + '00000000').references.length, 1);
  invalid(s, '02', 6); invalid(s, '01' + '00'.repeat(32), 8);
  invalid(s, '00' + b + '00000003', 12);
  // Defensive forged-tree fixture: an admitted descriptor cannot have max=17 references.
  invalid(schema([field('ARRAY', { max: 17, inner: field('REF') })], [{ fieldIdx: 0, targetClass: 1 }]), '0011' + a.repeat(17), 15);
});

test('MAP compares complete encoded keys, including length prefixes; STRUCT and empty containers parse', () => {
  const map = field('MAP', { max: 2, key: field('STRING', { max: 3 }), value: field('BOOL') });
  const s = schema([map, field('STRUCT', { members: [field('UINT', { width: 1 }), field('OPTION', { inner: field('BYTES', { max: 2 }) })] })]);
  assert.deepEqual(decodeBody(s, '0x000200017a01000261610007010002abcd').fields,
    ['0x000200017a010002616100', '0x07010002abcd']);
  assert.deepEqual(decodeBody(s, '0x00000700').fields, ['0x0000', '0x0700']);
  invalid(schema([map]), '0002000261610000017a01', 5);
  invalid(schema([map]), '000200017a0100017a00', 5);
  invalid(schema([map]), '0003', 12);
});

test('constraints distinguish signed and full-width unsigned values and enforce NONEMPTY and names', () => {
  const range = (kind, width, min, max) => schema([field(kind, { width })], [], [{ kind: 1, fieldIdx: 0, min, max }]);
  const signed = range('INT', 1, '-2', '2');
  for (const hex of ['fe', 'ff', '00', '02']) assert.equal(decodeBody(signed, '0x' + hex).fields[0], '0x' + hex);
  invalid(signed, 'fd', 14); invalid(signed, '03', 14);
  invalid(range('UINT', 32, '-2', '2'), 'ff'.repeat(32), 14);
  assert.equal(decodeBody(range('UINT', 32, '-2', '2'), '0x' + '00'.repeat(32)).fields.length, 1);
  for (const f of [field('BYTES', { max: 2 }), field('STRING', { max: 2 }), field('ARRAY', { max: 2, inner: field('BOOL') }), field('MAP', { max: 2, key: field('UINT', { width: 1 }), value: field('BOOL') })]) {
    invalid(schema([f], [], [{ kind: 2, fieldIdx: 0 }]), '0000', 14);
  }
  const name = schema([field('STRING', { max: 8 })], [], [{ kind: 3, fieldIdx: 0 }]);
  for (const hex of ['0000', '000100', '00011f', '00017f', '0002c280', '0002c29f']) invalid(name, hex, 14);
  assert.deepEqual(decodeBody(name, '0x0002c3a9').fields, ['0x0002c3a9']);
});

test('untrusted tree misuse fails closed for selectors, depth and malformed transport', () => {
  invalid(schema([field('REF')], [{ fieldIdx: 0, targetClass: 1, selectorKind: 1 }]), '11'.repeat(32), 16);
  let f = field('BOOL'); for (let i = 0; i < 4; i++) f = field('OPTION', { inner: f });
  invalid(schema([f]), '00', 11);
  for (const hex of ['0x0', '0xzz', '00', null]) assert.throws(() => decodeBody(schema([field('BOOL')]), hex), e => e instanceof InvalidBody && e.code === 13);
});
