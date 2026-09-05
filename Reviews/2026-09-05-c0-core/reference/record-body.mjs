// Independent descriptor-tree reader. No Solidity cache bytes or producer decoder.
// STRUCT-EVM only: UTF-8 is checked, NFC/assigned codepoints/Files semantics are not.
export class InvalidBody extends Error {
  constructor(code) { super(`Invalid MC/1 body (${code})`); this.name = 'InvalidBody'; this.code = code; }
}

const fail = code => { throw new InvalidBody(code); };
const hex = bytes => '0x' + bytes.toString('hex');
const integer = bytes => BigInt(hex(bytes));
const utf8 = bytes => {
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { fail(4); }
};
const digestLengths = new Map([[17, 20], [18, 32], [19, 64], [27, 32], [61185, 20]]);

// Reject unsupported tree shapes even when OPTION is absent or ARRAY is empty.
function inspect(f, depth = 1) {
  if (depth > 4) fail(11);
  if (!f || typeof f.kind !== 'string') fail(13);
  if (['BOOL', 'PRINCIPAL', 'DIGEST'].includes(f.kind)) return false;
  if (['REF', 'OCCREF'].includes(f.kind)) return true;
  if (['UINT', 'INT', 'BYTES_FIXED'].includes(f.kind)) {
    if (f.kind === 'BYTES_FIXED' ? !Number.isInteger(f.width) || f.width < 1 || f.width > 32 : ![1, 2, 4, 8, 16, 32].includes(f.width)) fail(13);
    return false;
  }
  if (['BYTES', 'STRING', 'ARRAY', 'MAP'].includes(f.kind)) {
    const limit = { BYTES: 8192, STRING: 4096, ARRAY: 1024, MAP: 256 }[f.kind];
    if (!Number.isInteger(f.max) || f.max < 0 || f.max > limit) fail(13);
    if (f.kind === 'ARRAY') return inspect(f.inner, depth + 1);
    if (f.kind === 'MAP') {
      if (!['UINT', 'INT', 'BYTES_FIXED', 'BYTES', 'STRING'].includes(f.key?.kind)) fail(13);
      const keyRefs = inspect(f.key, depth + 1), valueRefs = inspect(f.value, depth + 1);
      return keyRefs || valueRefs;
    }
    return false;
  }
  if (f.kind === 'OPTION') return inspect(f.inner, depth + 1);
  if (f.kind === 'STRUCT') {
    if (!Array.isArray(f.members) || !f.members.length || f.members.length > 64) fail(13);
    return f.members.map(m => inspect(m, depth + 1)).some(Boolean);
  }
  fail(13);
}

/** schema must be a member returned by the independent parseGroup(). */
export function decodeBody(schema, bodyHex) {
  if (typeof bodyHex !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(bodyHex)) fail(13);
  const body = Buffer.from(bodyHex.slice(2), 'hex');
  if (body.length > 8192) fail(3);
  if (!schema || !Array.isArray(schema.fields) || !Array.isArray(schema.roles) || !Array.isArray(schema.constraints)) fail(13);
  let position = 0;
  const references = [];
  const take = n => {
    if (position + n > body.length) fail(2);
    const bytes = body.subarray(position, position + n); position += n; return bytes;
  };
  const u16 = () => take(2).readUInt16BE();
  const roleByField = new Map();
  schema.roles.forEach((role, index) => {
    if (index >= 16 || role.selectorKind || role.memberIdx || !Number.isInteger(role.fieldIdx) || role.fieldIdx < 0 || role.fieldIdx >= schema.fields.length || roleByField.has(role.fieldIdx)) fail(16);
    roleByField.set(role.fieldIdx, index);
  });

  function read(f, roleIndex) {
    switch (f.kind) {
      case 'BOOL': if (take(1)[0] > 1) fail(7); break;
      case 'UINT': case 'INT': case 'BYTES_FIXED': take(f.width); break;
      case 'PRINCIPAL': take(32); break;
      case 'BYTES': case 'STRING': {
        const n = u16(); if (n > f.max) fail(3);
        const value = take(n); if (f.kind === 'STRING') utf8(value); break;
      }
      case 'REF': case 'OCCREF': {
        const value = take(f.kind === 'REF' ? 32 : 34);
        const target = value.subarray(0, 32);
        if (f.kind === 'REF' && integer(target) < 65536n) fail(8);
        if (references.length === 16) fail(15);
        references.push({ roleIndex, targetId: hex(target), leafIndex: f.kind === 'OCCREF' ? value.readUInt16BE(32) : 0 }); break;
      }
      case 'DIGEST': {
        const header = take(4), algorithm = header.readUInt16BE(), n = header.readUInt16BE(2);
        if (digestLengths.get(algorithm) !== n) fail(9);
        take(n); break;
      }
      case 'OPTION': {
        const flag = take(1)[0]; if (flag > 1) fail(6);
        if (flag) read(f.inner, roleIndex); break;
      }
      case 'ARRAY': {
        const n = u16(); if (n > f.max) fail(12);
        for (let i = 0; i < n; i++) read(f.inner, roleIndex); break;
      }
      case 'MAP': {
        const n = u16(); if (n > f.max) fail(12);
        let previous;
        for (let i = 0; i < n; i++) {
          const start = position; read(f.key, roleIndex);
          const key = body.subarray(start, position);
          if (previous && Buffer.compare(previous, key) >= 0) fail(5);
          previous = key; read(f.value, roleIndex);
        }
        break;
      }
      case 'STRUCT': for (const member of f.members) read(member, roleIndex); break;
      default: fail(13);
    }
  }

  const slices = schema.fields.map((f, i) => {
    const hasRefs = inspect(f), roleIndex = roleByField.get(i);
    if (hasRefs || roleIndex !== undefined) {
      const leaf = ['OPTION', 'ARRAY'].includes(f.kind) ? f.inner : f;
      const role = schema.roles[roleIndex];
      if (!role || !['REF', 'OCCREF', 'OPTION', 'ARRAY'].includes(f.kind) || !['REF', 'OCCREF'].includes(leaf.kind) || (f.kind === 'ARRAY' && leaf.kind !== 'REF') || ![1, 2, 3, 4, 5].includes(role.targetClass) || (leaf.kind === 'OCCREF') !== (role.targetClass === 4)) fail(16);
    }
    const start = position; read(f, roleIndex); return body.subarray(start, position);
  });
  if (position !== body.length) fail(1);
  for (const c of schema.constraints) {
    const f = schema.fields[c.fieldIdx], bytes = slices[c.fieldIdx];
    if (!f || !bytes) fail(13);
    if (c.kind === 1) {
      if (!['UINT', 'INT'].includes(f.kind)) fail(13);
      const min = BigInt(c.min), max = BigInt(c.max); if (min > max) fail(13);
      const raw = integer(bytes), value = f.kind === 'INT' ? BigInt.asIntN(bytes.length * 8, raw) : raw;
      if (value < min || value > max) fail(14);
    } else if (c.kind === 2) {
      if (!['BYTES', 'STRING', 'ARRAY', 'MAP'].includes(f.kind)) fail(13);
      if (bytes.readUInt16BE() === 0) fail(14);
    } else if (c.kind === 3) {
      if (f.kind !== 'STRING') fail(13);
      const text = utf8(bytes.subarray(2));
      if (!text || /[\u0000-\u001f\u007f-\u009f]/u.test(text)) fail(14);
    } else fail(13);
  }
  return { fields: slices.map(hex), references };
}
