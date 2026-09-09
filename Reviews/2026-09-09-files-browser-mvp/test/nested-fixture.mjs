// Nested-tree fixture for the files-browser everyday loop: child directories,
// staged verified bytes, revision history, a rename trail and authored tags.
// Test-only composer over the shared foundation runner; not a second resolver.
import assert from 'node:assert/strict';
import { mountedFixture, cat, hash, tag, string, option, A, B, C } from '../../2026-09-09-files-reader/test/fixture.mjs';

export const HEAD = tag('purpose', 'files/revision-head/1');
export const HEAD_ROLE = tag('fieldrole', 'files/current-revision/1');

export function content(f, text) {
  const data = cat(Buffer.from(text).toString('hex'));
  const size = BigInt((data.length - 2) / 2);
  const { keccak256 } = f.ethers;
  const tree = f.leaf('ChunkTree/1', cat('00001000', '00000001', size.toString(16).padStart(16, '0'), keccak256(cat('00', data))));
  return { data, tree, id: f.id(tree) };
}

export function revision(f, file, c, parents = []) {
  const body = cat(file, c.id, string('text/plain'), '01', string('utf-8'), '00',
    parents.length.toString(16).padStart(4, '0'), ...parents);
  const leaf = f.leaf('FileRevision/1', body);
  return { leaf, id: f.id(leaf) };
}

export async function nestedFixture(lab) {
  const { keccak256 } = await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
  const f = await mountedFixture(lab);
  f.ethers = { keccak256 };

  // photos/ child directory under the root, claimed by A.
  const photos = await f.object('photos', 'directory');
  await f.claim(A, 'photos', photos);

  // note.txt (fileA) gets real staged bytes and a revision head, then an edit.
  const c1 = content(f, 'trip original note\n');
  const c2 = content(f, 'trip edited note\n');
  assert.equal((await lab.stage(c1.id, c1.tree.body, c1.data)).receipt.status, '0x1');
  assert.equal((await lab.stage(c2.id, c2.tree.body, c2.data)).receipt.status, '0x1');
  const r1 = revision(f, f.fileA, c1);
  const r2 = revision(f, f.fileA, c2, [r1.id]);
  await f.admit([c1.tree, r1.leaf]);
  await f.mutate(A, HEAD, f.fileA, HEAD_ROLE, r1.id);
  await f.admit([c2.tree, r2.leaf]);
  await f.mutate(A, HEAD, f.fileA, HEAD_ROLE, r2.id);

  // pixel.png (fileB) inside photos/, with one revision but NO staged bytes yet
  // for the unavailable-bytes case; then draft.txt fully staged inside photos/.
  const cp = content(f, 'not-actually-a-png');
  const rp = revision(f, f.fileB, cp);
  await f.admit([cp.tree, rp.leaf]);
  await f.mutate(A, HEAD, f.fileB, HEAD_ROLE, rp.id);
  await f.claim(A, 'pixel.png', f.fileB, { parent: photos });

  const draft = await f.object('draft', 'file');
  const cd = content(f, 'photos folder draft\n');
  assert.equal((await lab.stage(cd.id, cd.tree.body, cd.data)).receipt.status, '0x1');
  const rd = revision(f, draft, cd);
  await f.admit([cd.tree, rd.leaf]);
  await f.mutate(A, HEAD, draft, HEAD_ROLE, rd.id);
  await f.claim(A, 'draft.txt', draft, { parent: photos });

  // Rename trail at the root: old.txt -> kept.txt leaves ENTRY then WHITEOUT.
  const extra = await f.object('extra', 'file');
  const ce = content(f, 'renamed file bytes\n');
  assert.equal((await lab.stage(ce.id, ce.tree.body, ce.data)).receipt.status, '0x1');
  const re = revision(f, extra, ce);
  await f.admit([ce.tree, re.leaf]);
  await f.mutate(A, HEAD, extra, HEAD_ROLE, re.id);
  await f.claim(A, 'old.txt', extra);
  await f.claim(A, 'kept.txt', extra);
  await f.claim(A, 'old.txt', extra, { whiteout: true });

  return { ...f, photos, draft, extra, c1, c2, cp, cd, r1, r2, rp, rd };
}
