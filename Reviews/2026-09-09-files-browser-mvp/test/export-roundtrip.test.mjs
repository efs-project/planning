// Authenticated-export round trip at the real boundary: a live world (with a
// genuine multichunk file) is exported through the SAME assembly the browser
// uses, verified OFFLINE by the clean-reader CLI, then attacked: every
// hostile mutation of the valid bundle must FAIL verification. This is the
// repair demanded by the 2026-09-10 reconciliation — the old verifier
// certified fabricated bundles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
import { createFixtureReader, openDirectory, openFile } from '../../2026-09-09-files-reader/index.mjs';
import { contentLeaves, byteCommitmentOf } from '../sdk/files-actions.mjs';
import { assembleExport, ordinaryRecord, TYPES } from '../sdk/export-bundle.mjs';
const ethersHelpers = { ordinaryRecord, TYPES };

const VERIFIER = new URL('../scripts/verify-export.mjs', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'efs-export-roundtrip-'));
test.after(() => rmSync(dir, { recursive: true, force: true }));

function verify(bundle, name) {
  const path = join(dir, name + '.json');
  writeFileSync(path, JSON.stringify(bundle, (_, v) => typeof v === 'bigint' ? String(v) : v));
  try { return { code: 0, stdout: execFileSync(process.execPath, [VERIFIER, path], { encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, stdout: (e.stdout ?? '') + (e.stderr ?? '') }; }
}
const clone = b => JSON.parse(JSON.stringify(b, (_, v) => typeof v === 'bigint' ? String(v) : v));

test('valid export verifies offline; every hostile mutation fails', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const { f, auth, config } = await startEnvironmentWorld(lab);
    // A REAL multichunk file (10 KiB, three chunks) through the routed path.
    const bytesHex = '0x' + 'a1b2c3d4'.repeat(2560);
    const content = contentLeaves(bytesHex);
    await auth.stageChunks(content);
    const create = await auth.execute({
      kind: 'createFile', mountId: config.mounts.aFirst, parent: f.root, name: 'multi.bin', principal: auth.A,
      bytesHex, byteCommitment: byteCommitmentOf(content.treeId, content.tree.body),
    });
    assert.equal(create.receipt.status, '0x1');
    // An EMPTY file too: the canonical zero-content tuple must verify.
    const empty = await auth.execute({
      kind: 'createFile', mountId: config.mounts.aFirst, parent: f.root, name: 'empty.txt', principal: auth.A,
      bytesHex: '0x', byteCommitment: byteCommitmentOf(contentLeaves('0x').treeId, contentLeaves('0x').tree.body),
    });
    assert.equal(empty.receipt.status, '0x1');

    // Read + assemble exactly the way the browser does.
    const reader = createFixtureReader({
      source: { identity: auth.expected.source, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) },
      context: { expected: auth.expected },
    });
    const opened = await reader.open({});
    assert.equal(opened.status, 'READY', opened.reason);
    const scope = opened.scope;
    const stream = openDirectory(scope, { mountId: config.mounts.aFirst, pageSize: 32 });
    let s; do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED');
    assert.equal(s.coverage, 'COMPLETE');
    const header = await lab.rpc('eth_getBlockByNumber', ['0x' + scope.basis.blockNumber.toString(16), false]);
    assert.equal(header.hash.toLowerCase(), scope.basis.blockHash.toLowerCase());
    const bundle = await assembleExport({
      acquireRecord: id => scope.call('getRecord', [id]),
      openFileById: id => openFile(scope, { mountId: config.mounts.aFirst, fileId: id }),
      sealScope: () => scope.seal(),
      rows: s.rows, listingCoverage: s.coverage,
      basis: scope.basis, header, chainId: 31337,
      expected: { core: lab.core, carrier: lab.expected.execution.carrier, source: auth.expected.source },
      mountId: config.mounts.aFirst, subject: f.root, pathLabel: 'trip', planId: config.plans.aFirst,
    });
    scope.close();

    // 1. The genuine bundle verifies offline, with the honest anchor language.
    const good = verify(bundle, 'valid');
    assert.equal(good.code, 0, 'valid bundle must verify:\n' + good.stdout);
    assert.match(good.stdout, /OFFLINE verification complete relative to the DECLARED anchor/);
    assert.match(good.stdout, /a fabricated coherent bundle also passes this tier/, 'self-consistency is labeled as such');
    assert.match(good.stdout, /SHALLOW: subdirectory contents are NOT covered/);
    assert.match(good.stdout, /re-chunk \(by the record's own geometry\) and fold to the committed root/);
    assert.match(good.stdout, /empty-content record is the exact canonical tuple/);
    assert.match(good.stdout, /CURRENT is transcript-attested only/, 'currency labeled per row');
    assert.match(good.stdout, /NOT-PROVABLE-OFFLINE/, 'authority axis present');
    assert(!/Clean offline verification/.test(good.stdout), 'the old unconditional claim is gone');

    // The recheck manifest emits the replayable pinned reads.
    const manifestPath = join(dir, 'recheck.json');
    execFileSync(process.execPath, [VERIFIER, join(dir, 'valid.json'), '--recheck-manifest', manifestPath], { encoding: 'utf8' });
    const manifest = JSON.parse((await import('node:fs')).readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.kind, 'EFS_EXPORT_RECHECK_V1');
    assert(manifest.requests.length > 0, 'replayable reads listed');
    assert(manifest.requests.every(r => JSON.stringify(r.params).includes(bundle.trust.blockHash)), 'every replay pinned to the anchor');

    // 2. Independent reopening: text content is displayed from re-verified bytes.
    assert.match(good.stdout, /text: /);

    // Hostile variants — every one must FAIL (exit 1), never re-certify.
    const attacks = [];
    const attack = (name, mutate) => { const b = clone(bundle); mutate(b); attacks.push([name, verify(b, name)]); };
    // Every mutation must fail for the reason it targets. A generic
    // "NOT verified" would also pass if the bundle died of an unrelated
    // shape error, which would prove nothing about the property under test.
    const EXPECTED = {
      'tampered-bytes': /fold to the committed root/,
      'substituted-record-body': /body does not hash to its id/,
      'missing-dependency': /required record missing from bundle/,
      'fabricated-basis': /re-hashes to the declared block hash/,
      'dummy-evidence': /pinned to the declared block/,
      'missing-content': /content bytes present/,
      'orphan-content': /orphan content/,
      'forged-header-field': /re-hashes to the declared block hash/,
      'contradictory-transcript': /contradicts the bundle/,
      'renamed-selection': /entry record binds this subject, name and object/,
      'retargeted-selection': /entry record binds this subject, name and object/,
      'foreign-core-transcript': /contradicts the bundle|witnessed by pinned reads/,
      'hidden-removal-marker': /RemovalMarker over the entry presented as live/,
      'case-duplicate-record-key': /duplicate key after case normalization/,
      'odd-length-content': /malformed bytes/,
    };

    attack('tampered-bytes', b => {
      const item = b.selection.find(i => i.name === 'multi.bin');
      b.content[item.treeId] = b.content[item.treeId].slice(0, 100) + 'ff' + b.content[item.treeId].slice(102);
    });
    attack('substituted-record-body', b => {
      const ids = Object.keys(b.records);
      const [x, y] = [ids[0], ids[ids.length - 1]];
      const t = b.records[x]; b.records[x] = b.records[y]; b.records[y] = t;
    });
    attack('missing-dependency', b => {
      const item = b.selection.find(i => i.name === 'multi.bin');
      delete b.records[item.revisionRecordId];
    });
    attack('fabricated-basis', b => { b.trust.blockHash = '0x' + '11'.repeat(32); });
    attack('dummy-evidence', b => { b.evidence = [{}, {}, {}]; });
    attack('missing-content', b => {
      const item = b.selection.find(i => i.name === 'multi.bin');
      delete b.content[item.treeId];
    });
    attack('orphan-content', b => { b.content['0x' + '22'.repeat(32)] = '0xdeadbeef'; });
    attack('forged-header-field', b => { b.trust.header.gasUsed = '0x' + (BigInt(b.trust.header.gasUsed) + 1n).toString(16); });
    attack('contradictory-transcript', b => {
      const wanted = Object.keys(b.records)[0].slice(2);
      const entry = b.evidence.find(e => e.method === 'eth_call' && e.params?.[0]?.data?.toLowerCase().endsWith(wanted) && typeof e.result === 'string');
      assert(entry, 'transcript must contain the getRecord read for a bundled record');
      entry.result = entry.result.slice(0, -2) + (entry.result.endsWith('aa') ? 'bb' : 'aa');
    });
    attack('renamed-selection', b => { b.selection.find(i => i.name === 'multi.bin').name = 'innocent.bin'; });
    attack('retargeted-selection', b => {
      const [a, z] = [b.selection[0], b.selection.at(-1)];
      const t = a.objectId; a.objectId = z.objectId; z.objectId = t;
    });
    attack('foreign-core-transcript', b => {
      for (const e of b.evidence) if (e.params?.[0]?.to) e.params[0].to = '0x' + '33'.repeat(20);
    });
    attack('hidden-removal-marker', b => {
      // The bundle's own records contradict the "live" story: a RemovalMarker
      // over a selected entry (content-addressed, so it hashes correctly).
      const { ordinaryRecord, TYPES } = ethersHelpers;
      const entryId = b.selection.find(i => i.name === 'multi.bin').entryRecordId;
      const typeId = TYPES['RemovalMarker/1'];
      const id = ordinaryRecord(typeId, entryId);
      b.records[id] = { typeId, body: entryId };
    });
    attack('case-duplicate-record-key', b => {
      const [id, r] = Object.entries(b.records)[0];
      b.records[id.toUpperCase().replace('0X', '0x')] = r;
    });
    attack('odd-length-content', b => {
      const item = b.selection.find(i => i.name === 'multi.bin');
      b.content[item.treeId] = b.content[item.treeId] + 'a';
    });
    for (const [name, r] of attacks) {
      assert.notEqual(r.code, 0, name + ' must FAIL verification but exited 0:\n' + r.stdout);
      assert.match(r.stdout, /NOT verified/, name + ' must print the refusal verdict');
      const expected = EXPECTED[name];
      assert(expected, 'every mutation needs a declared expected failure: ' + name);
      assert.match(r.stdout, expected, name + ' must fail for its OWN reason, not incidentally:\n' + r.stdout);
    }
    // A row whose bytes failed the fold must lose its "bytes proven" claim:
    // the verifier prints that line only after a successful fold, so counting
    // it isolates the tampered row from the others that still verify.
    const proven = out => (out.match(/\n {8}currency: bytes proven/g) ?? []).length;
    const tampered = attacks.find(([n]) => n === 'tampered-bytes')[1];
    assert(proven(tampered.stdout) === proven(good.stdout) - 1,
      'a failed fold must drop exactly that row\'s proven-bytes claim (valid ' + proven(good.stdout) + ', tampered ' + proven(tampered.stdout) + ')');
    console.log('valid bundle verified; ' + attacks.length + ' hostile mutations all refused');
  }, { profile: 'reads', watchdogMs: 600000 });
});

async function startEnvironmentWorld(lab) {
  const { f, auth, config } = await startEnvironment(lab, { write: true, relay: false });
  return { f, auth, config };
}
