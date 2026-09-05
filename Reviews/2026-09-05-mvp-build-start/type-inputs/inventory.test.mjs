import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArtifacts } from './materialize.mjs';
import { parseGroup } from './parser.mjs';
import { readFileSync } from 'node:fs';
const input = () => JSON.parse(readFileSync(new URL('./inputs.v1.json', import.meta.url), 'utf8'));
test('source-pinned inventory materializes sixteen members in four independently parsed ordered groups', () => {
    const out = buildArtifacts();
    assert.deepEqual(out.groups.map(g => g.members.length), [6, 3, 6, 1]);
    assert.equal(out.groups[0].members[2].descriptor.fields.length, 1); // ByteDigest has no size.
    assert.equal(out.groups[2].members[2].descriptor.fields[5].max, 8); // Parent fanout.
    const known = [];
    for (const g of out.groups) {
        const parsed = parseGroup(Buffer.from(g.groupHex, 'hex'), { knownTypes: known, expectedIds: g.members.map(m => m.temporaryTypeSchemaId) });
        assert.ok(parsed.bodyBytes <= 8192);
        assert.deepEqual(parsed.members, g.members.map(m => m.descriptor));
        known.push(...parsed.ids);
    }
    assert.equal(out.admissionExecuted, false);
    assert.equal(out.fullC0, false);
});
test('source drift, reordered inventory, and missing exact dependencies cannot produce an artifact', () => {
    const changed = input();
    changed.sources.files.sha256 = '00'.repeat(32);
    assert.throws(() => buildArtifacts(changed), /source/);
    const reordered = input();
    reordered.groups[0].reverse();
    assert.throws(() => buildArtifacts(reordered), /inventory/);
    const absent = input();
    absent.groups[2][0].roles[0].expectedType = 'TYPE:Missing/1';
    assert.throws(() => buildArtifacts(absent), /closure/);
});
