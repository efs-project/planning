import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeBlob, encodeGroup, derive } from './encoder.mjs';
import { parseGroup } from './parser.mjs';
const word = n => BigInt(n).toString(16).padStart(64, '0');
const mini = { name: 'T', meaning: '', specDigest: null, qualifier: word(0), fields: [{ name: 'x', kind: 'BOOL' }], roles: [], indexes: [], constraints: [] };
// Hand-written MC/1: v1, T, empty meaning, absent digest, zero qualifier,
// one BOOL x, zero roles/indexes, profile 0, zero constraints. Not encoder output.
const literal = '0001000154000000' + '0000000000000000000000000000000000000000000000000000000000000000' + '0001000178010000000000000000';
test('emits the independent literal minimal descriptor and consumes every byte', () => {
    assert.equal(encodeBlob(mini).toString('hex'), literal);
    const group = Buffer.from('00010036' + literal, 'hex');
    assert.equal(encodeGroup([mini]).toString('hex'), group.toString('hex'));
    assert.deepEqual(parseGroup(group).members[0], mini);
    assert.throws(() => parseGroup(Buffer.concat([group, Buffer.from([0])])), /trailing/);
    assert.throws(() => parseGroup(group.subarray(0, -1)), /truncated/);
});
test('group IDs preserve order and member index; pinned inventory rejects substitution', () => {
    const second = { ...mini, name: 'U' };
    const bytes = encodeGroup([mini, second]);
    const reversed = encodeGroup([second, mini]);
    assert.notEqual(derive(bytes).groupHash, derive(reversed).groupHash);
    assert.notEqual(derive(bytes).ids[0], derive(bytes).ids[1]);
    assert.deepEqual(parseGroup(bytes).ids, derive(bytes).ids);
    assert.throws(() => parseGroup(reversed, { expectedBytes: bytes }), /inventory/);
    assert.throws(() => parseGroup(bytes, { expectedIds: derive(bytes).ids.toReversed() }), /member/);
});
const ref = expectedType => ({ ...mini, fields: [{ name: 'x', kind: 'REF' }], roles: [{ name: 'x', targetClass: 1, expectedType, fieldIdx: 0 }], indexes: [{ kind: 2, target: 0 }] });
test('hand-written SELF role and backlink vector fixes role word and index byte offsets', () => {
    const s = ref('SELF');
    s.roles[0].name = 'r';
    const hex = '0001000154000000' + '00'.repeat(32) + '0001000178070001' + '0000017201' + '00'.repeat(31) + '01' + '000000' + '00010200' + '00000000';
    assert.equal(encodeBlob(s).toString('hex'), hex);
    assert.deepEqual(parseGroup(Buffer.from('00010060' + hex, 'hex')).members[0], s);
});
test('reference closure rejects unbound refs, wrong selector/class, bad indexes and sentinels', () => {
    const invalid = [
        { ...ref('SELF'), roles: [] },
        ref('GROUP_REF:0'), ref('GROUP_REF:1'), ref(word(2)), ref('ab'.repeat(32)),
        { ...ref('SELF'), indexes: [{ kind: 2, target: 1 }] },
        { ...ref('SELF'), roles: [{ ...ref('SELF').roles[0], memberIdx: 1 }] },
        { ...ref('SELF'), roles: [{ ...ref('SELF').roles[0], targetClass: 4 }] },
    ];
    for (const value of invalid)
        assert.throws(() => parseGroup(encodeGroup([value])), /role|reference|index|sentinel|closure/);
    assert.equal(parseGroup(encodeGroup([ref('SELF')])).members.length, 1);
    assert.equal(parseGroup(encodeGroup([ref('GROUP_REF:1'), mini])).members.length, 2);
    assert.equal(parseGroup(encodeGroup([ref('ab'.repeat(32))]), { knownTypes: ['ab'.repeat(32)] }).members.length, 1);
});
test('schema max reference fanout is 16, not role count', () => {
    const r = ref('SELF');
    r.fields = [{ name: 'x', kind: 'ARRAY', max: 16, inner: { name: '', kind: 'REF' } }];
    assert.equal(parseGroup(encodeGroup([r])).members.length, 1);
    r.fields[0].max = 17;
    assert.throws(() => parseGroup(encodeGroup([r])), /budget/);
});
test('SR-17 carriage includes group framing and the outer BYTES prefix', () => {
    // Valid 15-member groups: 15 * (54-byte minimal blob + 2 framing) + 2 = 842.
    const members = Array.from({ length: 15 }, () => structuredClone(mini));
    for (let i = 0; i < 3; i++)
        members[i].meaning = 'a'.repeat(2048);
    members[3].meaning = 'a'.repeat(1204); // 842 + 6144 + 1204 = 8190.
    const max = encodeGroup(members);
    assert.equal(max.length, 8190);
    assert.equal(parseGroup(max).bodyBytes, 8192);
    members[3].meaning += 'a';
    assert.throws(() => encodeGroup(members), /carriage/);
    assert.throws(() => parseGroup(Buffer.alloc(8191)), /carriage/);
});
test('independent checker refuses extraction walks exceeding 16 prefixes', () => {
    const s = ref('SELF');
    s.fields = [...Array.from({ length: 17 }, (_, i) => ({ name: 'b' + i, kind: 'BYTES', max: 1 })), { name: 'x', kind: 'REF' }];
    s.roles[0].fieldIdx = 17;
    assert.throws(() => parseGroup(encodeGroup([s])), /extraction/);
    s.fields.splice(0, 1);
    s.roles[0].fieldIdx = 16;
    assert.equal(parseGroup(encodeGroup([s])).members.length, 1);
});
test('unimplemented Unicode profile cannot pass as verified STRUCT-FULL', () => {
    assert.throws(() => parseGroup(encodeGroup([{ ...mini, name: 'é' }])), /ASCII subset/);
});
for (const nested of [false, true]) {
    test(`STRUCT rejects duplicate sibling names ${nested ? 'recursively' : 'directly'}`, () => {
        const struct = {
            name: 'pair', kind: 'STRUCT',
            members: [{ name: 'x', kind: 'BOOL' }, { name: 'x', kind: 'BOOL' }]
        };
        const field = nested ? { name: 'outer', kind: 'STRUCT', members: [struct] } : struct;
        const schema = { ...mini, fields: [field] };
        assert.throws(() => parseGroup(encodeGroup([schema])), /duplicate STRUCT member name/);
        // Distinct siblings remain accepted; this is not blanket STRUCT refusal.
        struct.members[1].name = 'y';
        assert.deepEqual(parseGroup(encodeGroup([schema])).members[0], schema);
    });
}
