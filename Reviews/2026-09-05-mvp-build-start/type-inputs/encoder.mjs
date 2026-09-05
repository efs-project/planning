import { AbiCoder, keccak256, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const codes = { BOOL: 1, UINT: 2, INT: 3, BYTES_FIXED: 4, BYTES: 5, STRING: 6, REF: 7, OCCREF: 8, PRINCIPAL: 9, DIGEST: 10, ARRAY: 11, MAP: 12, STRUCT: 13, OPTION: 14 };
function uint(n, width) {
    n = BigInt(n);
    if (n < 0n || n >= (1n << BigInt(width * 8)))
        throw Error('integer bound');
    return Buffer.from(n.toString(16).padStart(width * 2, '0'), 'hex');
}
const u8 = n => uint(n, 1), u16 = n => uint(n, 2);
function text(s) { const b = Buffer.from(s, 'utf8'); return Buffer.concat([u16(b.length), b]); }
function word(s) { if (!/^[0-9a-f]{64}$/.test(s))
    throw Error('word'); return Buffer.from(s, 'hex'); }
function expected(s) { return s === 'ANY' ? uint(0, 32) : s === 'SELF' ? uint(1, 32) : s.startsWith('GROUP_REF:') ? uint(256 + Number(s.split(':')[1]), 32) : word(s); }
function field(f) {
    const p = [text(f.name), u8(codes[f.kind])];
    if (['UINT', 'INT', 'BYTES_FIXED'].includes(f.kind))
        p.push(u8(f.width));
    else if (['BYTES', 'STRING'].includes(f.kind))
        p.push(u16(f.max));
    else if (f.kind === 'ARRAY')
        p.push(u16(f.max), field(f.inner));
    else if (f.kind === 'OPTION')
        p.push(field(f.inner));
    else if (f.kind === 'STRUCT')
        p.push(u16(f.members.length), ...f.members.map(field));
    else if (f.kind === 'MAP')
        p.push(u16(f.max), field(f.key), field(f.value));
    return Buffer.concat(p);
}
export function encodeBlob(s) {
    const d = s.specDigest;
    const p = [u16(1), text(s.name), text(s.meaning), u8(d ? 1 : 0)];
    if (d)
        p.push(u16(d.algCode), u16(d.hex.length / 2), Buffer.from(d.hex, 'hex'));
    p.push(word(s.qualifier), u16(s.fields.length), ...s.fields.map(field), u16(s.roles.length));
    s.roles.forEach((r, i) => p.push(u8(i), text(r.name), u8(r.targetClass), expected(r.expectedType), u8(r.fieldIdx), u8(r.selectorKind ?? 0), u8(r.memberIdx ?? 0)));
    p.push(u16(s.indexes.length));
    s.indexes.forEach(x => p.push(u8(x.kind), u8(x.target)));
    p.push(u16(0), u16(s.constraints.length));
    s.constraints.forEach(c => { p.push(u8(c.kind), u8(c.fieldIdx)); if (c.kind === 1)
        p.push(uint(BigInt.asUintN(256, BigInt(c.min)), 32), uint(BigInt.asUintN(256, BigInt(c.max)), 32)); });
    const b = Buffer.concat(p);
    if (b.length > 8192)
        throw Error('schema bound');
    return b;
}
export function encodeGroup(members) {
    if (members.length < 1 || members.length > 16)
        throw Error('group bound');
    const blobs = members.map(encodeBlob);
    const b = Buffer.concat([u16(blobs.length), ...blobs.flatMap(x => [u16(x.length), x])]);
    if (b.length > 8190)
        throw Error('carriage bound');
    return b;
}
export function derive(bytes) {
    const abi = AbiCoder.defaultAbiCoder();
    const domain = s => keccak256(toUtf8Bytes(s));
    const groupHash = keccak256(abi.encode(['bytes32', 'bytes32'], [domain('efs2/typeschema-group/1'), keccak256(bytes)]));
    return { groupHash, ids: Array.from({ length: bytes.readUInt16BE(0) }, (_, k) => keccak256(abi.encode(['bytes32', 'bytes32', 'uint256'], [domain('efs2/typeschema/1'), groupHash, k]))) };
}
