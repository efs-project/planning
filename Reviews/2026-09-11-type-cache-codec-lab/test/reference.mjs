// Independent byte-layout oracle. No Solidity implementation or artifact reads.
import assert from 'node:assert/strict';
import { AbiCoder, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { CACHE } from '../../2026-09-05-c0-admission/reader.mjs';
import { encodeBlob, encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
export { CACHE };
export const abi = AbiCoder.defaultAbiCoder();
export const raw = x => Buffer.from(x.slice(2), 'hex');
export const hex = b => '0x' + b.toString('hex');
const word = n => Buffer.from(BigInt.asUintN(256, BigInt(n)).toString(16).padStart(64, '0'), 'hex');
export const smallDescriptor = { name: 'CodecSmall/1', meaning: '', qualifier: '00'.repeat(32), specDigest: null, fields: [{ name: 'flag', kind: 'BOOL' }], roles: [], indexes: [], constraints: [] };
export const boundaryDescriptor = { ...smallDescriptor, name: 'CacheBoundary/1', fields: Array.from({ length: 64 }, (_, i) => ({ name: `flag${String(i).padStart(2, '0')}${'a'.repeat(58)}`, kind: 'BOOL' })) };
export function booleanCache(s) {
  const id = derive(encodeGroup([s])).ids[0];
  const fs = s.fields.map(f => [1, 0, 0, 1, 0, 0, hex(Buffer.concat([Buffer.from([0, Buffer.byteLength(f.name)]), Buffer.from(f.name), Buffer.from([1])]))]);
  return abi.encode([CACHE], [[id, keccak256(encodeBlob(s)), fs.length, fs, [], [], []]]);
}
export const smallCache = booleanCache(smallDescriptor);
export const boundaryCache = booleanCache(boundaryDescriptor);

// Representation stress inputs, not valid Type declarations. Unknown semantic
// enum bytes deliberately survive; this codec is not the schema validator.
export function syntheticCaches() {
  const wide = abi.decode([CACHE], smallCache)[0].toArray(true);
  wide[2] = 0xffffffff;
  wide[3][0] = [255, 254, 65535, 0xffffffff, 0xffffffff, 0xffffffff, wide[3][0][6]];
  wide[4] = [[255, '0x' + 'fe'.repeat(32), 255]];
  wide[5] = [[255, 255]];
  wide[6] = [[255, 255, -(1n << 255n), (1n << 255n) - 1n]];
  const envelope = abi.decode([CACHE], smallCache)[0].toArray(true);
  envelope[3] = Array.from({ length: 64 }, (_, i) => [i, 255 - i, 65535, i, 0xffffffff, i, i === 0 ? hex(Buffer.from(Array.from({ length: 8190 }, (_, n) => n % 256))) : '0x']);
  envelope[4] = Array.from({ length: 16 }, (_, i) => [i, hex(word(i)), 63 - i]);
  envelope[5] = Array.from({ length: 8 }, (_, i) => [i, 7 - i]);
  envelope[6] = Array.from({ length: 32 }, (_, i) => [i, 63 - i, -(1n << 255n) + BigInt(i), (1n << 255n) - 1n - BigInt(i)]);
  return [
    { name: 'synthetic-full-widths', cache: abi.encode([CACHE], [wide]) },
    { name: 'synthetic-full-physical-envelope', cache: abi.encode([CACHE], [envelope]) },
  ].map(c => ({ ...c, classification: 'CODEC_VALID_ONLY_NOT_PARSER_VALID' }));
}

export function referencePack(cache) {
  const s = abi.decode([CACHE], cache)[0];
  assert.equal(abi.encode([CACHE], [s]), cache, 'canonical logical ABI');
  assert(s.fields.length >= 1 && s.fields.length <= 64 && s.roles.length <= 16 && s.indexes.length <= 8 && s.constraints.length <= 32);
  const fs = s.fields.map(f => {
    const desc = raw(f.descriptor), b = Buffer.alloc(18);
    b[0] = Number(f.kind); b[1] = Number(f.innerKind);
    b.writeUInt16BE(Number(f.widthOrMax), 2); b.writeUInt32BE(Number(f.maxBodyBytes), 4);
    b.writeUInt32BE(Number(f.references), 8); b.writeUInt32BE(Number(f.skipReads), 12); b.writeUInt16BE(desc.length, 16);
    return Buffer.concat([b, desc]);
  });
  const fieldBytes = fs.reduce((n, b) => n + b.length, 0);
  assert(fieldBytes - 18 * fs.length <= 8190, 'current descriptor envelope');
  const h = Buffer.alloc(96); h.write('EC01', 0, 'ascii');
  h[4] = fs.length; h[5] = s.roles.length; h[6] = s.indexes.length; h[7] = s.constraints.length;
  h.writeUInt32BE(Number(s.maxBodyBytes), 8); h.writeUInt16BE(fieldBytes, 12);
  raw(s.typeId).copy(h, 32); raw(s.blobHash).copy(h, 64);
  return hex(Buffer.concat([h, ...fs,
    ...s.roles.map(r => Buffer.concat([Buffer.from([Number(r.targetClass)]), raw(r.expectedType), Buffer.from([Number(r.fieldIdx)])])),
    ...s.indexes.map(x => Buffer.from([Number(x.kind), Number(x.target)])),
    ...s.constraints.map(c => Buffer.concat([Buffer.from([Number(c.kind), Number(c.fieldIdx)]), word(c.min), word(c.max)])),
  ]));
}

export function referenceUnpack(physical) {
  const b = raw(physical);
  assert(b.length >= 96 && b.length <= 12110 && b.subarray(0, 4).toString('ascii') === 'EC01');
  assert(b.subarray(14, 32).every(x => x === 0));
  const [f, r, x, c] = [...b.subarray(4, 8)];
  assert(f >= 1 && f <= 64 && r <= 16 && x <= 8 && c <= 32);
  const fieldBytes = b.readUInt16BE(12), fieldEnd = 96 + fieldBytes;
  assert(fieldBytes >= f * 18 && fieldBytes - f * 18 <= 8190);
  assert.equal(fieldEnd + 34 * r + 2 * x + 66 * c, b.length);
  let pos = 96;
  const take = n => { assert(pos + n <= b.length); const a = b.subarray(pos, pos + n); pos += n; return a; };
  const fs = Array.from({ length: f }, () => { const a = take(18), d = take(a.readUInt16BE(16)); assert(pos <= fieldEnd); return [a[0], a[1], a.readUInt16BE(2), a.readUInt32BE(4), a.readUInt32BE(8), a.readUInt32BE(12), hex(d)]; });
  assert.equal(pos, fieldEnd);
  const rs = Array.from({ length: r }, () => { const a = take(34); return [a[0], hex(a.subarray(1, 33)), a[33]]; });
  const xs = Array.from({ length: x }, () => [...take(2)]);
  const cs = Array.from({ length: c }, () => { const a = take(66); return [a[0], a[1], BigInt.asIntN(256, BigInt(hex(a.subarray(2, 34)))), BigInt.asIntN(256, BigInt(hex(a.subarray(34, 66))))]; });
  assert.equal(pos, b.length);
  return abi.encode([CACHE], [[hex(b.subarray(32, 64)), hex(b.subarray(64, 96)), b.readUInt32BE(8), fs, rs, xs, cs]]);
}

export function malformedPhysical(good) {
  const b = raw(good), variants = [];
  const change = (label, mutate) => { const a = Buffer.from(b); mutate(a); variants.push({ label, bytes: hex(a) }); };
  change('unknown format', a => { a[3] = 50; });
  change('nonzero reserved bits', a => { a[14] = 1; });
  for (const [label, offset, n] of [['zero fields', 4, 0], ['too many fields', 4, 65], ['too many roles', 5, 17], ['too many indexes', 6, 9], ['too many constraints', 7, 33]]) change(label, a => { a[offset] = n; });
  change('short field section', a => a.writeUInt16BE(a.readUInt16BE(12) - 1, 12));
  change('long field section', a => a.writeUInt16BE(a.readUInt16BE(12) + 1, 12));
  change('descriptor crosses section', a => a.writeUInt16BE(65535, 112));
  change('field section padding', a => a.writeUInt16BE(a.readUInt16BE(112) - 1, 112));
  variants.push({ label: 'short header', bytes: hex(b.subarray(0, 95)) }, { label: 'truncated payload', bytes: hex(b.subarray(0, b.length - 1)) }, { label: 'trailing payload', bytes: hex(Buffer.concat([b, Buffer.from([0])])) });
  return variants;
}

export const nestedDescriptor = {
  ...smallDescriptor, name: 'CodecNested/1', fields: [
    { name: 'count', kind: 'INT', width: 32 }, { name: 'label', kind: 'STRING', max: 32 },
    { name: 'refs', kind: 'ARRAY', max: 2, inner: { name: '', kind: 'REF' } },
    { name: 'detail', kind: 'STRUCT', members: [{ name: 'on', kind: 'BOOL' }, { name: 'map', kind: 'MAP', max: 2, key: { name: '', kind: 'UINT', width: 1 }, value: { name: '', kind: 'OPTION', inner: { name: '', kind: 'BOOL' } } }] },
    { name: 'digest', kind: 'DIGEST' },
  ], roles: [{ name: 'refs', fieldIdx: 2, targetClass: 1, expectedType: 'ANY' }],
  indexes: [{ kind: 1, target: 0 }, { kind: 2, target: 0 }, { kind: 3, target: 4 }],
  constraints: [{ kind: 1, fieldIdx: 0, min: '-2', max: '9' }, { kind: 2, fieldIdx: 1 }, { kind: 3, fieldIdx: 1 }],
};
