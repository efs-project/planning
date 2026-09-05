// Independent reader: no encoder import, no shared framing/validation/hash-preimage helpers.
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const names = ['', 'BOOL', 'UINT', 'INT', 'BYTES_FIXED', 'BYTES', 'STRING', 'REF', 'OCCREF', 'PRINCIPAL', 'DIGEST', 'ARRAY', 'MAP', 'STRUCT', 'OPTION'];
const digestLengths = { 17: 20, 18: 32, 19: 64, 27: 32, 61185: 20 };
const fail = m => { throw Error(m); };
class Reader {
    constructor(b) {
        this.b = Buffer.from(b);
        this.p = 0;
    }
    take(n) {
        if (n < 0 || this.p + n > this.b.length) fail('truncated');
        const b = this.b.subarray(this.p, this.p + n);
        this.p += n;
        return b;
    }
    n(w) {
        return Number(BigInt('0x' + this.take(w).toString('hex')));
    }
    str(max, empty = false) {
        const b = this.take(this.n(2));
        if (b.length > max || (!empty && !b.length)) fail('text bound');
        if (b.some(x => x > 127)) fail('unsupported Unicode: ASCII subset only');
        const s = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(b);
        if (!empty && /[\u0000-\u001f\u007f]/.test(s)) fail('name profile');
        return s;
    }
    end() {
        if (this.p !== this.b.length) fail('trailing');
    }
}
function readField(r, anonymous = false, depth = 1) {
    if (depth > 4)
        fail('depth');
    const name = r.str(64, anonymous);
    if (anonymous && name !== '')
        fail('anonymous name');
    const kind = names[r.n(1)];
    if (!kind)
        fail('field kind');
    const f = { name, kind };
    if (['UINT', 'INT', 'BYTES_FIXED'].includes(kind)) {
        f.width = r.n(1);
        if (kind === 'BYTES_FIXED' ? (f.width < 1 || f.width > 32) : ![1, 2, 4, 8, 16, 32].includes(f.width))
            fail('width');
    }
    else if (['BYTES', 'STRING', 'ARRAY', 'MAP'].includes(kind)) {
        f.max = r.n(2);
        if (f.max > ({ BYTES: 8192, STRING: 4096, ARRAY: 1024, MAP: 256 }[kind]))
            fail('field bound');
        if (kind === 'ARRAY')
            f.inner = readField(r, true, depth + 1);
        if (kind === 'MAP') {
            f.key = readField(r, true, depth + 1);
            f.value = readField(r, true, depth + 1);
            if (!['UINT', 'INT', 'BYTES_FIXED', 'STRING', 'BYTES'].includes(f.key.kind))
                fail('map key');
        }
    }
    else if (kind === 'OPTION')
        f.inner = readField(r, true, depth + 1);
    else if (kind === 'STRUCT') {
        const n = r.n(2);
        if (!n || n > 64)
            fail('members');
        f.members = Array.from({ length: n }, () => readField(r, false, depth + 1));
        if (new Set(f.members.map(member => member.name)).size !== f.members.length)
            fail('duplicate STRUCT member name');
    }
    return f;
}
function signed(b) {
    const n = BigInt('0x' + b.toString('hex'));
    return BigInt.asIntN(256, n).toString();
}
function blob(b) {
    if (b.length > 8192)
        fail('schema bound');
    const r = new Reader(b);
    if (r.n(2) !== 1)
        fail('version');
    const s = { name: r.str(128), meaning: r.str(2048, true) };
    const flag = r.n(1);
    if (flag > 1)
        fail('digest flag');
    s.specDigest = null;
    if (flag) {
        const algCode = r.n(2), len = r.n(2);
        if (digestLengths[algCode] !== len)
            fail('digest');
        s.specDigest = { algCode, hex: r.take(len).toString('hex') };
    }
    s.qualifier = r.take(32).toString('hex');
    const n = r.n(2);
    if (n < 1 || n > 64)
        fail('field count');
    s.fields = Array.from({ length: n }, () => readField(r));
    const rc = r.n(2);
    if (rc > 16)
        fail('role count');
    s.roles = Array.from({ length: rc }, (_, i) => {
        if (r.n(1) !== i)
            fail('role id');
        const name = r.str(64), targetClass = r.n(1), w = r.take(32).toString('hex'), num = BigInt('0x' + w);
        const expectedType = num === 0n ? 'ANY' : num === 1n ? 'SELF' : num >= 256n && num < 272n ? 'GROUP_REF:' + String(num - 256n) : w;
        const fieldIdx = r.n(1), selectorKind = r.n(1), memberIdx = r.n(1);
        return { name, targetClass, expectedType, fieldIdx, ...(selectorKind ? { selectorKind } : {}), ...(memberIdx ? { memberIdx } : {}) };
    });
    const ic = r.n(2);
    if (ic > 8)
        fail('index count');
    s.indexes = Array.from({ length: ic }, () => ({ kind: r.n(1), target: r.n(1) }));
    if (r.n(2) !== 0)
        fail('validation profile');
    const cc = r.n(2);
    if (cc > 32)
        fail('constraint count');
    s.constraints = Array.from({ length: cc }, () => {
        const kind = r.n(1), fieldIdx = r.n(1);
        if (![1, 2, 3].includes(kind)) fail('constraint kind');
        return {
            kind, fieldIdx,
            ...(kind === 1 ? { min: signed(r.take(32)), max: signed(r.take(32)) } : {})
        };
    });
    r.end();
    return s;
}
function refs(f) {
    if (['REF', 'OCCREF'].includes(f.kind)) return 1;
    if (f.kind === 'OPTION') return refs(f.inner);
    if (f.kind === 'ARRAY') return f.max * refs(f.inner);
    if (f.kind === 'STRUCT') return f.members.reduce((a, x) => a + refs(x), 0);
    if (f.kind === 'MAP') return f.max * (refs(f.key) + refs(f.value));
    return 0;
}
// Conservative upper bound on prefix/branch reads to skip a preceding field.
// OPTION's flag is counted too; this may reject a valid generic schema but
// cannot undercount C0's direct-role extraction. Not a general E1 compiler.
function skipReads(f) {
    if (['BYTES', 'STRING', 'DIGEST'].includes(f.kind))
        return 1;
    if (f.kind === 'OPTION')
        return 1 + skipReads(f.inner);
    if (f.kind === 'ARRAY')
        return 1 + f.max * skipReads(f.inner);
    if (f.kind === 'MAP')
        return 1 + f.max * (skipReads(f.key) + skipReads(f.value));
    if (f.kind === 'STRUCT')
        return f.members.reduce((sum, m) => sum + skipReads(m), 0);
    return 0;
}
function validate(s, own, count, known) {
    if (new Set(s.fields.map(f => f.name)).size !== s.fields.length)
        fail('field names');
    if (s.fields.reduce((a, f) => a + refs(f), 0) > 16)
        fail('reference budget');
    const covered = new Map();
    const extractionOK = i => { if (s.fields.slice(0, i).reduce((sum, f) => sum + skipReads(f), 0) > 16)
        fail('extraction bound'); };
    for (const role of s.roles) {
        extractionOK(role.fieldIdx);
        const f = s.fields[role.fieldIdx];
        if (!f || role.selectorKind || role.memberIdx)
            fail('role selector unsupported by C0 descriptor subset');
        let leaf = f;
        if (f.kind === 'OPTION' || f.kind === 'ARRAY')
            leaf = f.inner;
        if (!['REF', 'OCCREF'].includes(leaf.kind) || (f.kind === 'ARRAY' && leaf.kind !== 'REF'))
            fail('role shape');
        if (role.targetClass < 1 || role.targetClass > 5 || (leaf.kind === 'OCCREF') !== (role.targetClass === 4))
            fail('role class');
        if (covered.has(role.fieldIdx))
            fail('role duplicate');
        covered.set(role.fieldIdx, 1);
        const e = role.expectedType;
        if (![1, 5].includes(role.targetClass) && e !== 'ANY')
            fail('role expected type unused');
        if (e.startsWith('GROUP_REF:')) {
            const k = Number(e.split(':')[1]);
            if (k === own || k >= count || count === 1)
                fail('reference group index');
        }
        else if (e !== 'SELF' && e !== 'ANY') {
            if (BigInt('0x' + e) < 65536n)
                fail('reference sentinel');
            if (!known.has('0x' + e))
                fail('reference closure');
        }
    }
    s.fields.forEach((f, i) => { if (refs(f) && !covered.has(i))
        fail('unbound reference'); });
    const seen = new Set();
    for (const x of s.indexes) {
        const key = x.kind + ':' + x.target;
        if (seen.has(key))
            fail('duplicate index');
        seen.add(key);
        if (x.kind === 2) {
            if (!s.roles[x.target])
                fail('index role');
        }
        else {
            const f = s.fields[x.target];
            if (!f || !(x.kind === 1 ? ['BOOL', 'UINT', 'INT', 'BYTES_FIXED', 'PRINCIPAL'].includes(f.kind) : x.kind === 3 && f.kind === 'DIGEST'))
                fail('index field');
            extractionOK(x.target);
        }
    }
    for (const c of s.constraints) {
        const f = s.fields[c.fieldIdx];
        if (!f)
            fail('constraint field');
        if (c.kind === 1 && (!['UINT', 'INT'].includes(f.kind) || BigInt(c.min) > BigInt(c.max)))
            fail('constraint range');
        if (c.kind === 2 && !['BYTES', 'STRING', 'ARRAY', 'MAP'].includes(f.kind))
            fail('constraint nonempty');
        if (c.kind === 3 && f.kind !== 'STRING')
            fail('constraint name');
    }
}
export function parseGroup(bytes, { knownTypes = [], expectedBytes, expectedIds } = {}) {
    const b = Buffer.from(bytes);
    if (b.length > 8190)
        fail('carriage bound');
    if (expectedBytes && !b.equals(Buffer.from(expectedBytes)))
        fail('inventory mismatch');
    const r = new Reader(b), count = r.n(2);
    if (count < 1 || count > 16)
        fail('group count');
    const members = Array.from({ length: count }, () => blob(r.take(r.n(2))));
    r.end();
    const known = new Set(knownTypes.map(x => '0x' + x.replace(/^0x/, '')));
    members.forEach((s, k) => validate(s, k, count, known));
    // ABI fixed words constructed directly here, without ethers' AbiCoder.
    const hash = b => Buffer.from(keccak256(b).slice(2), 'hex');
    const groupHash = hash(Buffer.concat([hash(Buffer.from('efs2/typeschema-group/1')), hash(b)]));
    const ids = members.map((_, k) => '0x' + hash(Buffer.concat([hash(Buffer.from('efs2/typeschema/1')), groupHash, Buffer.from(k.toString(16).padStart(64, '0'), 'hex')])).toString('hex'));
    if (expectedIds && (expectedIds.length !== ids.length || expectedIds.some((x, i) => x !== ids[i])))
        fail('member id mismatch');
    return { members, groupHash: '0x' + groupHash.toString('hex'), ids, groupBytes: b.length, bodyBytes: b.length + 2 };
}
