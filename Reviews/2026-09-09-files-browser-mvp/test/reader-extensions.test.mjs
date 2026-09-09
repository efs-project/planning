// Nested navigation, verified content, revision and name history over the
// extended shared reader — against real local contracts via the managed runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade, A } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { createFixtureReader, openDirectory, openFile, openHistory, openRevisions, lookupName } from '../../2026-09-09-files-reader/index.mjs';

function nodeSource(lab) {
  return { identity: lab.expected.source, epoch: 1, request: (method, params, { maxBytes } = {}) => lab.rpc(method, params, maxBytes ? { maxBytes } : {}) };
}
async function ready(lab) {
  const reader = createFixtureReader({ source: nodeSource(lab), context: { expected: lab.expected } });
  const opened = await reader.open({});
  assert.equal(opened.status, 'READY', opened.reason);
  return opened.scope;
}
async function drain(stream) {
  let s;
  do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED');
  return s;
}

test('nested navigation, verified bytes, history and revisions', { timeout: 300000 }, async () => {
  compileUpgrade();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);

    // Root listing: photos/ is a DIRECTORY row carrying its navigation subject.
    let scope = await ready(lab);
    const root = await drain(openDirectory(scope, { mountId: f.mounts.aFirst }));
    assert.equal(root.coverage, 'COMPLETE');
    const names = root.rows.map(r => r.value.name);
    assert.deepEqual(names, ['kept.txt', 'note.txt', 'photos']);
    const photosRow = root.rows.find(r => r.value.name === 'photos');
    assert.equal(photosRow.value.kind, 'DIRECTORY');
    assert.equal(photosRow.value.subject, f.photos);
    assert.equal(root.domain, 'FIXTURE_ROOT_DIRECTORY_ONLY');
    // old.txt is masked at the root, not listed and not a Removed item.
    assert.equal(root.masked.length, 1);
    scope.close();

    // Child listing under the SAME mount by subject: only the photos content.
    scope = await ready(lab);
    const child = await drain(openDirectory(scope, { mountId: f.mounts.aFirst, subject: f.photos }));
    assert.equal(child.coverage, 'COMPLETE');
    assert.deepEqual(child.rows.map(r => r.value.name), ['draft.txt', 'pixel.png']);
    assert.equal(child.domain, 'FIXTURE_DIRECTORY_SUBTREE');
    assert(child.rows.every(r => r.value.subject !== undefined));
    scope.close();

    // Point lookup inside the child directory.
    scope = await ready(lab);
    const point = await lookupName(scope, { mountId: f.mounts.aFirst, subject: f.photos, name: 'draft.txt' });
    assert.equal(point.outcome, 'FOUND');
    assert.equal(point.value.name, 'draft.txt');
    scope.close();

    // Verified content: note.txt currently reads the EDITED bytes.
    scope = await ready(lab);
    const note = await openFile(scope, { mountId: f.mounts.aFirst, fileId: f.fileA });
    assert.equal(note.outcome, 'FOUND', note.detail);
    assert.equal(note.value.integrity, 'VERIFIED');
    assert.equal(note.value.bytes, f.c2.data);
    assert.equal(note.value.mediaType, 'text/plain');
    assert.equal(note.value.revisionId, f.r2.id);
    assert.deepEqual(note.value.parents, [f.r1.id]);
    scope.close();

    // Unavailable bytes are BYTES_UNAVAILABLE, never absent or invalid.
    scope = await ready(lab);
    const pixel = await openFile(scope, { mountId: f.mounts.aFirst, fileId: f.fileB });
    assert.equal(pixel.outcome, 'FOUND', pixel.detail);
    assert.equal(pixel.value.integrity, 'BYTES_UNAVAILABLE');
    assert.equal(pixel.value.bytes, null);
    scope.close();

    // Revision chain of note.txt: r1 then r2, r2 current, parent link intact.
    scope = await ready(lab);
    const revs = await openRevisions(scope, { mountId: f.mounts.aFirst, fileId: f.fileA });
    assert.equal(revs.outcome, 'FOUND', revs.detail);
    const ids = revs.value.revisions.map(r => r.revisionId);
    assert.deepEqual(ids, [f.r1.id, f.r2.id]);
    assert.equal(revs.value.revisions.at(-1).current, true);
    scope.close();

    // Name history of the renamed old.txt: ENTRY then WHITEOUT, oldest first.
    scope = await ready(lab);
    const hist = await openHistory(scope, { mountId: f.mounts.aFirst, name: 'old.txt' });
    assert.equal(hist.outcome, 'FOUND', hist.detail);
    const kinds = hist.value.timeline.filter(t => t.principal === A).map(t => t.kind);
    assert.deepEqual(kinds, ['ENTRY', 'WHITEOUT']);
    scope.close();

    // A FILE subject refuses directory listing.
    scope = await ready(lab);
    const notDir = await drain(openDirectory(scope, { mountId: f.mounts.aFirst, subject: f.fileA }));
    assert.equal(notDir.rowsEvidence, 'PRIOR_SEALED');
    assert.equal(notDir.reason, 'NOT_A_DIRECTORY');
    scope.close();
  }, { profile: 'reads' });
});
