import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArtifacts } from './materialize.mjs';
import { parseGroup } from './parser.mjs';
import { readFileSync } from 'node:fs';
const input = () => JSON.parse(readFileSync(new URL('./inputs.v1.json', import.meta.url), 'utf8'));
const retainedArtifact = () => readFileSync(new URL('./artifacts.v1.json', import.meta.url), 'utf8');
const currentGenesisSha256 = '5ff293fbaa66f786a59d77d9b64a137c03e4dbe42c76350e785c9f742b7a1be6';
test('default historical replay exactly reproduces the retained artifact', () => {
    const out = buildArtifacts();
    assert.equal(JSON.stringify(out, null, 2) + '\n', retainedArtifact());
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
test('explicit working-tree mode refuses drift from the pinned source hashes', () => {
    assert.throws(() => buildArtifacts(input(), { sourceMode: 'working-tree' }), /source commitment mismatch.*genesis-manifest/);
});
test('working-tree mode reads current bytes when their exact hash is supplied', () => {
    const current = input();
    current.sources.genesis.sha256 = currentGenesisSha256;
    current.groups[0].reverse();
    assert.throws(() => buildArtifacts(current, { sourceMode: 'working-tree' }), /ordered inventory mismatch/);
});
test('revision mode refuses a substituted live-source hash', () => {
    const changed = input();
    changed.sources.genesis.sha256 = currentGenesisSha256;
    assert.throws(() => buildArtifacts(changed), /source commitment mismatch.*genesis-manifest/);
});
test('revision mode rejects unavailable commits and blobs without a live-source fallback', () => {
    const unavailableRevision = input();
    unavailableRevision.sourceRevision = 'ff'.repeat(20);
    assert.throws(() => buildArtifacts(unavailableRevision), /source revision unavailable/);
    const unavailableBlob = input();
    unavailableBlob.sources.genesis.path = 'Reviews/2026-09-05-c0-core/src/StateKernel.sol';
    assert.throws(() => buildArtifacts(unavailableBlob), /source blob unavailable/);
});
test('source revision, path, hash, mode, and work bounds reject malformed inputs', () => {
    for (const revision of ['main', 'a'.repeat(39), 'A'.repeat(40)]) {
        const malformed = input();
        malformed.sourceRevision = revision;
        assert.throws(() => buildArtifacts(malformed), /invalid source revision/);
    }
    for (const path of ['', '../outside', '/absolute', 'Designs//file', 'Designs/./file', 'Designs\\file', 'Designs/file:part']) {
        const malformed = input();
        malformed.sources.genesis.path = path;
        assert.throws(() => buildArtifacts(malformed), /invalid source path/);
    }
    const malformedHash = input();
    malformedHash.sources.genesis.sha256 = 'not-a-sha256';
    assert.throws(() => buildArtifacts(malformedHash), /invalid source sha256/);
    assert.throws(() => buildArtifacts(input(), { sourceMode: 'fallback' }), /invalid source mode/);
    const excessive = input();
    for (let i = 0; i < 28; ++i) excessive.sources[`extra-${i}`] = { ...excessive.sources.genesis };
    assert.throws(() => buildArtifacts(excessive), /source count limit/);
});
test('reordered inventory and missing exact dependencies reach their intended failures', () => {
    const reordered = input();
    reordered.groups[0].reverse();
    assert.throws(() => buildArtifacts(reordered), /inventory/);
    const absent = input();
    absent.groups[2][0].roles[0].expectedType = 'TYPE:Missing/1';
    assert.throws(() => buildArtifacts(absent), /closure/);
});
