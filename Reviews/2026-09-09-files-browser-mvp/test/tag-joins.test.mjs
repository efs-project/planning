// Tag joins on the CURRENT reader/SDK, which keys tags by OBJECT (the stable
// File node id), not by directory position. The PM's two counterexamples
// (tag-system-2026-09-10.md §5b) run against real local contracts through
// FilesRouterV2 with author-signed intents:
//   (a) K attesters tag File A placed at name N in directory D; the placer
//       rebinds N to File B. Through the reader, B carries none of A's tags
//       and A still carries all of them — repeated after a second placement
//       of A, a move, remove + restore, and one attester's untag.
//   (b) Lens masking: a higher-priority whiteout above a tagged lower-priority
//       file, and an untagged higher-priority file above a tagged one; the
//       tag-filtered listing under the lens must NOT show either name.
//   (c) The PRICE of the join: for a directory of n entries under a
//       2-principal lens, the reader's calls, bytes and eth_call gas to produce
//       the tag-filtered listing (lens-resolved listing, then tags per entry)
//       versus the unfiltered listing; per-entry cost by RPC method, which is
//       also the measured cost of today's scope-position -> binding walk.
// Every number in evidence/tag-joins.json is MEASURED on a managed anvil
// (loopback, no WAN); eth_call gas is debug_traceCall callTracer top-frame
// gasUsed (includes the 21,000 base + calldata intrinsic; execution-only is
// reported alongside). Knobs: EFS_TAG_K (attesters, default 1000),
// EFS_TAG_N (comma list, default 100,200,1000).
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { Wallet, Interface } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade, withUpgrade, A, B, C, planBody, purposeScope, option, cat } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { compileRouter, routerFixture } from './router-fixture.mjs';
import { authorityFixture } from './authority-fixture.mjs';
import { core3Interface, contentLeaves, byteCommitmentOf } from '../sdk/files-actions.mjs';
import { createFixtureReader, openDirectory, openTags, FIXTURE, bindingKey, nameRole, tagId } from '../../2026-09-09-files-reader/index.mjs';

const K = Number(process.env.EFS_TAG_K ?? 1000);
const N_LIST = (process.env.EFS_TAG_N ?? '100,200,1000').split(',').map(Number);
const LENS_CAP = 64; // LensPlan.sol:73 — a plan carries at most 64 sources
const hex = s => '0x' + Buffer.from(s).toString('hex');

// ---- reader plumbing ---------------------------------------------------------
const HEAD = '(uint8 state,uint8 targetKind,uint8 tombstoneCause,uint32 revision,uint64 admissionOrdinal,bytes32 targetA,uint16 targetLeaf)';
const SELECTORS = new Interface([
  'function getRecord(bytes32 recordId) view returns (bytes32,bytes,uint64)',
  'function getOccurrence(bytes32 envelopeId,uint16 leafIndex) view returns (uint8,uint64,bytes32,bytes32,bytes32,uint64)',
  'function getOccurrenceByOrdinal(uint64 ordinal) view returns (bytes32,uint16,bytes32,bytes32,bytes32,uint8,uint64)',
  'function getBindingHead(bytes32 bindingKey) view returns (' + HEAD + ',bytes32,uint64)',
  'function getBindingAtBasis(bytes32 bindingKey,uint64 basisOrdinal) view returns (' + HEAD + ',bytes32,uint64)',
  'function readHistory(bytes32 bindingKey,uint32 fromRevision,uint16 limit) view returns ((uint32,uint64,bytes32,uint16,uint8,uint64)[],uint32,uint8)',
  'function pagePostingsHydrated(bytes32 T,uint8 kind,uint8 indexOrdinal,bytes32 valueKey,(uint256 cursor,uint16 maxItems,uint64 basisOrdinal) req) view returns ((bytes32,uint64,uint256,bytes32[],uint32,uint8),(uint64,bytes32,uint16,bytes32,bytes32,uint8,uint64)[])',
  'function resolve(bytes32 planRecordId,bytes32 positionKey) view returns ((uint8,uint8,(uint8,bytes32,uint16),uint16,uint16,uint64,uint16,uint16,(bytes32,uint64,uint64,uint8)))',
  'function validatePlan(bytes32 planRecordId) view returns (bool,uint8)',
  'function currentRevision() view returns (uint32)', 'function revisionAt(uint32) view returns (bytes)', 'function fixtureReadContext() view returns (bytes)',
  'function counts() view returns (bytes)', 'function configuration() view returns (bytes32)', 'function owner() view returns (address)', 'function bootstrap() view returns (bytes)',
  'function preparationHelper() view returns (address)', 'function preparationCodehash() view returns (bytes32)', 'function admissionLibrary() view returns (address)', 'function admissionCodehash() view returns (bytes32)',
]);
const nameOf = data => { try { return SELECTORS.getFunction(data.slice(0, 10)).name; } catch { return 'other:' + data.slice(0, 10); } };
const intrinsic = data => { const b = Buffer.from(data.slice(2), 'hex'); let z = 0; for (const x of b) if (x === 0) z++; return 21000 + 4 * z + 16 * (b.length - z); };

/** A source that also prices every eth_call by debug_traceCall (callTracer,
 *  top frame) at the SAME pinned block, attributed to the current phase.
 *  Tracing calls are outside the reader's own accounting. */
function tracingSource(lab, identity, log) {
  return {
    identity, epoch: 1,
    async request(method, params, { maxBytes } = {}) {
      const result = await lab.rpc(method, params, maxBytes ? { maxBytes } : {});
      if (log.enabled && method === 'eth_call') {
        const tr = await lab.rpc('debug_traceCall', [params[0], params[1], { tracer: 'callTracer', tracerConfig: { onlyTopCall: true } }]);
        const total = Number(tr.gasUsed), base = intrinsic(params[0].data);
        const bucket = log.phases[log.phase] ??= {};
        const m = bucket[nameOf(params[0].data)] ??= { calls: 0, gasTotal: 0, gasExecution: 0, responseBytes: 0 };
        m.calls++; m.gasTotal += total; m.gasExecution += total - base; m.responseBytes += Buffer.byteLength(JSON.stringify(result));
      }
      return result;
    },
  };
}
const plainSource = (lab, identity) => ({ identity, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) });
async function openScope(expected, source) {
  const opened = await createFixtureReader({ source, context: { expected } }).open({});
  assert.equal(opened.status, 'READY', opened.reason);
  return opened.scope;
}
async function drain(stream) { let s; do { s = await stream.loadMore(); } while (s.continuation && s.rowsEvidence === 'CURRENT_SEALED'); return s; }
const sumPhase = p => Object.values(p ?? {}).reduce((a, m) => ({ calls: a.calls + m.calls, gasTotal: a.gasTotal + m.gasTotal, gasExecution: a.gasExecution + m.gasExecution, responseBytes: a.responseBytes + m.responseBytes }), { calls: 0, gasTotal: 0, gasExecution: 0, responseBytes: 0 });

/** The browser's tag-filtered listing shape: resolve the listing under the
 *  lens FIRST, then read the tags of each selected row's OBJECT. An UNKNOWN
 *  tag read is never collapsed into "untagged" (silent-absence rule). */
async function taggedListing(scope, { mountId, subject, tagIds, log }) {
  if (log) log.phase = 'listing';
  const listing = await drain(openDirectory(scope, { mountId, subject, pageSize: 32 }));
  if (log) log.phase = 'tags';
  const tagged = [], untagged = [], unknown = [];
  if (listing.rowsEvidence === 'CURRENT_SEALED') {
    for (const row of listing.rows) {
      const t = await openTags(scope, { mountId, nodeId: row.value.nodeId, tagIds });
      if (t.outcome !== 'FOUND') { unknown.push({ name: row.value.name, reason: t.reason }); continue; }
      (t.value.current.some(c => c.active) ? tagged : untagged).push(row.value.name);
    }
  }
  if (log) log.phase = 'other';
  return { listing, tagged: tagged.sort(), untagged: untagged.sort(), unknown };
}

test('tag joins on the object-keyed reader: rebinding, lens masking, and the price of the join', { timeout: 3600000 }, async t => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    const out = { kind: 'TAG_JOINS_OBJECT_KEYED_READER', date: '2026-09-10', K, lensCap: LENS_CAP, labels: 'every number MEASURED on a managed anvil (loopback); eth_call gas = debug_traceCall callTracer top-frame gasUsed at the reader\'s pinned block (includes 21,000 base + calldata intrinsic; gasExecution subtracts it)', sections: {} };

    // ---- custom mounts (admitted pre-upgrade through the operator path) ----
    async function mountWith(label, sources) {
      const sorted = [...sources].sort((x, y) => x.tier - y.tier || (BigInt(x.principal) < BigInt(y.principal) ? -1 : 1));
      const ns = f.leaf('ResolutionPlan/1', planBody(sorted, { purpose: purposeScope('namespace', f.root) }));
      const content = f.leaf('ResolutionPlan/1', planBody([{ principal: A, tier: 0 }], { purpose: purposeScope('content', f.root) }));
      await f.admit([ns, content]);
      const config = f.leaf('PublicFilesMountConfig/1', cat(option(f.id(ns)), f.id(content), option(null), option(null)));
      await f.admit([config]);
      const descriptor = f.leaf('MountDescriptor/1', cat(f.root, C.profile, f.id(config)));
      await f.admit([descriptor]);
      const v = lab.readIface.decodeFunctionResult('validatePlan', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('validatePlan', [f.id(ns)]) }, 'latest']));
      assert(v[0] === true && v[1] === 0n, label + ' plan validates on-chain');
      return { id: f.id(descriptor), plan: f.id(ns), label, sources: sorted.length };
    }
    const attesters = Array.from({ length: K }, (_, i) => ({ principal: word(0x0a77e57e00000000n + BigInt(i)), wallet: new Wallet(word(0x0a77e5a000000000n + BigInt(i))) }));
    const groupSize = LENS_CAP - 1; // placer A at tier 0 + up to 63 attesters at tier 1
    const groups = []; for (let i = 0; i < K; i += groupSize) groups.push(attesters.slice(i, i + groupSize));
    const lensK = []; for (const [gi, g] of groups.entries()) lensK.push(await mountWith('lensK' + gi, [{ principal: A, tier: 0 }, ...g.map(a => ({ principal: a.principal, tier: 1 }))]));
    const lensA = await mountWith('lensA', [{ principal: A, tier: 0 }]);
    const lensB = await mountWith('lensB', [{ principal: B, tier: 0 }]);
    const lensAB = await mountWith('lensAB', [{ principal: A, tier: 0 }, { principal: B, tier: 1 }]);
    const lensBA = await mountWith('lensBA', [{ principal: B, tier: 0 }, { principal: A, tier: 1 }]);
    out.lenses = { attesterLenses: lensK.map(l => ({ label: l.label, sources: l.sources })), lensAB: lensAB.sources, lensBA: lensBA.sources };

    await routerFixture(lab);
    const auth = await authorityFixture(lab);
    const expected = auth.expected;
    assert.equal(auth.A, A); assert.equal(auth.B, B);

    // ---- claim K attester principals in Core (one tx each, from its wallet) --
    {
      const t0 = performance.now();
      const hashes = [];
      for (const a of attesters) {
        await lab.rpc('anvil_setBalance', [a.wallet.address, '0x3635c9adc5dea00000']);
        const raw = await a.wallet.signTransaction({ chainId: 31337, nonce: 0, gasLimit: 300000n, gasPrice: 2000000000n, to: lab.core, data: core3Interface.encodeFunctionData('claimPrincipal', [a.principal]) });
        hashes.push(await lab.rpc('eth_sendRawTransaction', [raw]));
      }
      for (const h of hashes) { let r; for (let i = 0; i < 400 && !r; i++) { r = await lab.rpc('eth_getTransactionReceipt', [h]); if (!r) await new Promise(ok => setTimeout(ok, 25)); } assert.equal(r?.status, '0x1', 'claimPrincipal'); }
      out.claims = { count: K, elapsedMs: +(performance.now() - t0).toFixed(0) };
      console.log('claimed ' + K + ' attester principals in ' + out.claims.elapsedMs + 'ms');
    }

    async function prior(principal, purpose, subject, role) {
      const head = lab.readIface.decodeFunctionResult('getBindingHead', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getBindingHead', [bindingKey(principal, purpose, subject, role)]) }, 'latest']));
      const h = head[0];
      if (h[3] === 0n) return null;
      const occ = lab.readIface.decodeFunctionResult('getOccurrenceByOrdinal', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getOccurrenceByOrdinal', [h[4]]) }, 'latest']));
      return { revision: Number(h[3]), occurrence: { envelopeId: occ[0], leafIndex: Number(occ[1]) } };
    }
    const headRevision = async (principal, purpose, subject, role) => Number(lab.readIface.decodeFunctionResult('getBindingHead', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getBindingHead', [bindingKey(principal, purpose, subject, role)]) }, 'latest']))[0][3]);
    const createFile = async (mountId, parent, name, principal, text) => {
      const bytesHex = hex(text); const c = contentLeaves(bytesHex);
      return auth.execute({ kind: 'createFile', mountId, parent, name, principal, bytesHex, byteCommitment: byteCommitmentOf(c.treeId, c.tree.body) });
    };
    const mountAB = lensAB.id, T = tagId('crowd');

    /** Union over the attester lenses of what the reader says about nodeId. */
    async function attesterView(nodeId, tagIds = [T]) {
      const scope = await openScope(expected, plainSource(lab, expected.source));
      const active = new Set(), inactive = new Set(); let entries = 0;
      for (const lens of lensK) {
        const r = await openTags(scope, { mountId: lens.id, nodeId, tagIds });
        assert.equal(r.outcome, 'FOUND', lens.label + ' openTags: ' + r.reason + ' ' + r.detail);
        for (const c of r.value.current) { entries++; (c.active ? active : inactive).add(c.principal); }
      }
      const requests = scope.stats().requests; scope.close();
      return { active: active.size, inactive: inactive.size, entries, requests, activeSet: active, inactiveSet: inactive };
    }
    async function listingView(mountId, subject, tagIds = [T]) {
      const scope = await openScope(expected, plainSource(lab, expected.source));
      const r = await taggedListing(scope, { mountId, subject, tagIds });
      assert.equal(r.listing.coverage, 'COMPLETE', 'listing COMPLETE: ' + r.listing.reason);
      assert.deepEqual(r.unknown, [], 'no UNKNOWN tag reads');
      const rows = Object.fromEntries(r.listing.rows.map(x => [x.value.name, x.value.nodeId]));
      const masked = r.listing.masked.length;
      scope.close();
      return { rows, masked, tagged: r.tagged, untagged: r.untagged };
    }

    // =========================================================================
    // (a) K attesters, one placer, one rebound name
    // =========================================================================
    await t.test('(a) K attesters tag File A; the placer rebinds N to File B; tags follow the object through every reshuffle', async () => {
      const stages = [];
      const D = (await auth.execute({ kind: 'createDir', mountId: mountAB, parent: f.root, name: 'joins', principal: A })).plan.predicted.objectId;
      const madeA = await createFile(mountAB, D, 'n.txt', A, 'file A, the tagged one\n');
      const fileA = madeA.plan.predicted.objectId;
      const madeB = await createFile(mountAB, D, 'b.txt', A, 'file B, never tagged\n');
      const fileB = madeB.plan.predicted.objectId;
      const nKey = [A, FIXTURE.namePurpose, D, nameRole('n.txt')];

      // K attesters tag File A (each a routed, author-signed TAG by its own principal).
      const t0 = performance.now(); let gasSum = 0n;
      for (const a of attesters) gasSum += (await auth.execute({ kind: 'tag', mountId: mountAB, object: fileA, label: 'crowd', principal: a.principal }, { authorWallet: a.wallet })).gasUsed;
      const tagging = { count: K, elapsedMs: +(performance.now() - t0).toFixed(0), meanGasPerTag: String(gasSum / BigInt(K)) };
      console.log(K + ' attester tags in ' + tagging.elapsedMs + 'ms, mean gas ' + tagging.meanGasPerTag);

      // Listings are joined under lensK[0] (placer A at tier 0 + the first
      // attester group): tags count only for the LENS's principals, so a
      // 2-principal lens that excludes the attesters would (correctly) show
      // nothing tagged — the join is "tagged by whom the lens trusts".
      async function stage(label, expectA, expectB, listings) {
        const a = await attesterView(fileA), b = await attesterView(fileB);
        const s = { stage: label, nameBindingRevision: await headRevision(...nKey), fileA: { active: a.active, inactive: a.inactive, entries: a.entries, readerRequests: a.requests }, fileB: { active: b.active, inactive: b.inactive, entries: b.entries, readerRequests: b.requests }, listings: {} };
        assert.equal(a.active, expectA.active, label + ': File A active tags'); assert.equal(a.inactive, expectA.inactive, label + ': File A inactive (withdrawn) tags');
        assert.equal(b.active, 0, label + ': File B carries NONE of A\'s tags'); assert.equal(b.entries, 0, label + ': File B has no tag entry from any attester at all');
        for (const [name, { mountId, subject, tagged, untagged, rows }] of Object.entries(listings)) {
          const v = await listingView(mountId, subject);
          s.listings[name] = v;
          assert.deepEqual(v.tagged, tagged, label + ' ' + name + ': tag-filtered listing');
          if (untagged) assert.deepEqual(v.untagged, untagged, label + ' ' + name + ': untagged rows');
          if (rows) for (const [n, id] of Object.entries(rows)) assert.equal(v.rows[n], id, label + ' ' + name + ': ' + n + ' resolves to the expected object');
        }
        stages.push(s); console.log('stage ' + label + ': A active=' + a.active + ' inactive=' + a.inactive + ' | B entries=' + b.entries + ' | ' + JSON.stringify(Object.fromEntries(Object.entries(s.listings).map(([k, v]) => [k, v.tagged]))));
      }
      await stage('tagged', { active: K, inactive: 0 }, {}, { D: { mountId: lensK[0].id, subject: D, tagged: ['n.txt'], untagged: ['b.txt'], rows: { 'n.txt': fileA, 'b.txt': fileB } } });

      // The placer rebinds N: (A, name, D, n.txt) goes entry(A) -> whiteout -> entry(B); same binding key, revision 1 -> 2 -> 3.
      await auth.execute({ kind: 'remove', mountId: mountAB, parent: D, name: 'n.txt', object: fileA, principal: A, selectedEntry: madeA.plan.predicted.entryId, priors: { source: await prior(...nKey) } });
      await auth.execute({ kind: 'placement', mountId: mountAB, parent: D, name: 'n.txt', object: fileB, principal: A, priors: { destination: await prior(...nKey) } });
      assert.equal(await headRevision(...nKey), 3, 'the same name binding was rebound twice');
      await stage('rebound N -> File B', { active: K, inactive: 0 }, {}, { D: { mountId: lensK[0].id, subject: D, tagged: [], untagged: ['b.txt', 'n.txt'], rows: { 'n.txt': fileB, 'b.txt': fileB } } });

      // Second placement of A elsewhere in D.
      await auth.execute({ kind: 'placement', mountId: mountAB, parent: D, name: 'a-again.txt', object: fileA, principal: A });
      await stage('second placement of A', { active: K, inactive: 0 }, {}, { D: { mountId: lensK[0].id, subject: D, tagged: ['a-again.txt'], untagged: ['b.txt', 'n.txt'], rows: { 'a-again.txt': fileA, 'n.txt': fileB } } });

      // Move A into a child directory under a new name.
      const D2 = (await auth.execute({ kind: 'createDir', mountId: mountAB, parent: D, name: 'moved', principal: A })).plan.predicted.objectId;
      const moved = await auth.execute({ kind: 'renameMove', mountId: mountAB, parent: D2, name: 'a-moved.txt', sourceParent: D, sourceName: 'a-again.txt', object: fileA, principal: A, priors: { source: await prior(A, FIXTURE.namePurpose, D, nameRole('a-again.txt')) } });
      await stage('move A to moved/a-moved.txt', { active: K, inactive: 0 }, {}, {
        D: { mountId: lensK[0].id, subject: D, tagged: [], untagged: ['b.txt', 'moved', 'n.txt'] },
        D2: { mountId: lensK[0].id, subject: D2, tagged: ['a-moved.txt'], untagged: [], rows: { 'a-moved.txt': fileA } },
      });

      // Remove, then restore.
      const removed = await auth.execute({ kind: 'remove', mountId: mountAB, parent: D2, name: 'a-moved.txt', object: fileA, principal: A, selectedEntry: moved.plan.predicted.entryId, priors: { source: await prior(A, FIXTURE.namePurpose, D2, nameRole('a-moved.txt')) } });
      await stage('remove A (unplaced)', { active: K, inactive: 0 }, {}, { D2: { mountId: lensK[0].id, subject: D2, tagged: [], untagged: [] } });
      const markerId = removed.plan.predicted.markerId;
      await auth.execute({ kind: 'restore', mountId: mountAB, parent: D2, name: 'a-moved.txt', object: fileA, markerId, principal: A, priors: { destination: await prior(A, FIXTURE.namePurpose, D2, nameRole('a-moved.txt')), marker: await prior(A, FIXTURE.removedPurpose, D2, markerId) } });
      await stage('restore A', { active: K, inactive: 0 }, {}, { D2: { mountId: lensK[0].id, subject: D2, tagged: ['a-moved.txt'], untagged: [], rows: { 'a-moved.txt': fileA } } });

      // One attester withdraws.
      const a0 = attesters[0];
      await auth.execute({ kind: 'untag', mountId: mountAB, object: fileA, label: 'crowd', principal: a0.principal, priors: { tag: await prior(a0.principal, FIXTURE.tagPurpose, fileA, T) } }, { authorWallet: a0.wallet });
      await stage('attester 0 untags', { active: K - 1, inactive: 1 }, {}, { D2: { mountId: lensK[0].id, subject: D2, tagged: ['a-moved.txt'], untagged: [] }, D: { mountId: lensK[0].id, subject: D, tagged: [], untagged: ['b.txt', 'moved', 'n.txt'] } });
      const last = await attesterView(fileA);
      assert(last.inactiveSet.has(a0.principal) && !last.activeSet.has(a0.principal), 'exactly attester 0 is withdrawn');

      out.sections.rebinding = { directory: D, fileA, fileB, tagging, stages,
        conclusion: 'On the object-keyed reader, File B (the new occupant of N) never carries any attester\'s tag at any stage, and File A keeps all K (then K-1) through rebinding, a second placement, a move, remove, restore and one withdrawal. A position-keyed bitmap at (D, n.txt) would have carried K stale bits after the rebind (and no bit at a-again.txt / moved/a-moved.txt).' };
    });

    // =========================================================================
    // (b) lens masking: filtering runs AFTER lens selection
    // =========================================================================
    await t.test('(b) lens masking: a higher-priority whiteout, and an untagged higher-priority file, hide a tagged lower-priority file at the same name', async () => {
      const M = (await auth.execute({ kind: 'createDir', mountId: mountAB, parent: f.root, name: 'mask', principal: A })).plan.predicted.objectId;
      const TM = tagId('mask-tag');
      // b1: B's tagged file at w.txt; A creates its own w.txt (A-only lens) then removes it -> A whiteout at w.txt.
      const fb = (await createFile(lensB.id, M, 'w.txt', B, 'B\'s file at w.txt\n')).plan.predicted.objectId;
      await auth.execute({ kind: 'tag', mountId: lensB.id, object: fb, label: 'mask-tag', principal: B });
      const x = await createFile(lensA.id, M, 'w.txt', A, 'A\'s file at w.txt, to be removed\n');
      await auth.execute({ kind: 'remove', mountId: lensA.id, parent: M, name: 'w.txt', object: x.plan.predicted.objectId, principal: A, selectedEntry: x.plan.predicted.entryId, priors: { source: await prior(A, FIXTURE.namePurpose, M, nameRole('w.txt')) } });
      // b2: B's tagged file at u.txt; A's UNTAGGED file at u.txt (A-only lens).
      const fb2 = (await createFile(lensB.id, M, 'u.txt', B, 'B\'s file at u.txt\n')).plan.predicted.objectId;
      await auth.execute({ kind: 'tag', mountId: lensB.id, object: fb2, label: 'mask-tag', principal: B });
      const y = (await createFile(lensA.id, M, 'u.txt', A, 'A\'s untagged file at u.txt\n')).plan.predicted.objectId;

      const under = async lens => listingView(lens.id, M, [TM]);
      const ab = await under(lensAB), ba = await under(lensBA);
      // Under [A > B]: w.txt is MASKED by A's whiteout (not a row); u.txt resolves to A's untagged y.
      assert.equal(ab.rows['w.txt'], undefined, 'lensAB: w.txt is not a row'); assert.equal(ab.masked, 1, 'lensAB: exactly one masked name (w.txt)');
      assert.equal(ab.rows['u.txt'], y, 'lensAB: u.txt resolves to A\'s untagged file');
      assert.deepEqual(ab.tagged, [], 'lensAB: the tag-filtered listing shows NEITHER w.txt nor u.txt');
      assert.deepEqual(ab.untagged, ['u.txt'], 'lensAB: u.txt is listed, untagged');
      // Under [B > A]: both are B's tagged files.
      assert.equal(ba.rows['w.txt'], fb); assert.equal(ba.rows['u.txt'], fb2);
      assert.deepEqual(ba.tagged, ['u.txt', 'w.txt'], 'lensBA: both names show as tagged');
      // The tags themselves are real and readable on B's objects under the same lensAB: masking is a listing property, applied after selection.
      const scope = await openScope(expected, plainSource(lab, expected.source));
      for (const id of [fb, fb2]) { const r = await openTags(scope, { mountId: lensAB.id, nodeId: id, tagIds: [TM] }); assert.equal(r.outcome, 'FOUND'); assert(r.value.current.some(c => c.active && c.principal === B), 'B\'s tag on its own object is current under lensAB'); }
      scope.close();
      // Positional counterfactual: in B's column the position (M, u.txt) / (M, w.txt) holds a tagged occupant.
      const bOcc = async name => headRevision(B, FIXTURE.namePurpose, M, nameRole(name));
      out.sections.masking = {
        directory: M, files: { bTagged_w: fb, aWhiteout_w: x.plan.predicted.objectId, bTagged_u: fb2, aUntagged_u: y },
        lensAB: { rows: ab.rows, masked: ab.masked, tagged: ab.tagged, untagged: ab.untagged },
        lensBA: { rows: ba.rows, tagged: ba.tagged, untagged: ba.untagged },
        positionalCounterfactual: { 'B name binding revision at (M,w.txt)': await bOcc('w.txt'), 'B name binding revision at (M,u.txt)': await bOcc('u.txt'), note: 'a bitmap keyed by position would carry a set bit in B\'s column at both names; the lens-selected occupant is A\'s whiteout / A\'s untagged file, so the object-keyed join correctly shows neither' },
      };
      console.log('masking lensAB tagged=' + JSON.stringify(ab.tagged) + ' untagged=' + JSON.stringify(ab.untagged) + ' masked=' + ab.masked + ' | lensBA tagged=' + JSON.stringify(ba.tagged));
    });

    // =========================================================================
    // (c) price of the join under a 2-principal lens
    // =========================================================================
    await t.test('(c) price of the tag-filtered listing vs the unfiltered listing, per entry, by RPC method', async () => {
      const TP = tagId('pricing');
      const arms = [];
      for (const n of N_LIST) {
        const t0 = performance.now();
        const Dn = (await auth.execute({ kind: 'createDir', mountId: mountAB, parent: f.root, name: 'price-' + n, principal: A })).plan.predicted.objectId;
        const ids = [];
        let createGas = 0n, firstCreateGas = 0n, lastCreateGas = 0n;
        for (let i = 0; i < n; i++) {
          const made = await createFile(mountAB, Dn, 'e' + String(i).padStart(4, '0') + '.txt', A, 'entry ' + i + ' of ' + n + '\n');
          ids.push(made.plan.predicted.objectId); createGas += made.gasUsed; if (i === 0) firstCreateGas = made.gasUsed; lastCreateGas = made.gasUsed;
        }
        const buildFilesMs = +(performance.now() - t0).toFixed(0);
        let tagsA = 0, tagsB = 0;
        for (let i = 0; i < n; i++) {
          if (i % 4 === 0) { await auth.execute({ kind: 'tag', mountId: mountAB, object: ids[i], label: 'pricing', principal: A }); tagsA++; }
          if (i % 10 === 0) { await auth.execute({ kind: 'tag', mountId: mountAB, object: ids[i], label: 'pricing', principal: B }); tagsB++; }
        }
        const expectedTagged = ids.filter((_, i) => i % 4 === 0 || i % 10 === 0).length;
        const build = { n, tagsA, tagsB, buildFilesMs, buildTotalMs: +(performance.now() - t0).toFixed(0), createFileGas: { mean: String(createGas / BigInt(n)), first: String(firstCreateGas), last: String(lastCreateGas) } };
        console.log('price-' + n + ': built ' + n + ' files in ' + (buildFilesMs / 1000).toFixed(1) + 's (createFile gas first=' + firstCreateGas + ' last=' + lastCreateGas + '), ' + tagsA + ' A-tags, ' + tagsB + ' B-tags; total ' + (build.buildTotalMs / 1000).toFixed(1) + 's');

        async function measure(filtered) {
          const log = { enabled: false, phase: 'qualify', phases: {} };
          const scope = await openScope(expected, tracingSource(lab, expected.source, log));
          const q = scope.stats();
          log.enabled = true; log.phase = 'listing';
          const t1 = performance.now();
          let listing, tagged = [], untagged = [], unknown = [];
          if (filtered) ({ listing, tagged, untagged, unknown } = await taggedListing(scope, { mountId: mountAB, subject: Dn, tagIds: [TP], log }));
          else listing = await drain(openDirectory(scope, { mountId: mountAB, subject: Dn, pageSize: 32 }));
          const elapsedMs = +(performance.now() - t1).toFixed(1);
          const s = scope.stats(); scope.close();
          const L = sumPhase(log.phases.listing), G = sumPhase(log.phases.tags);
          const arm = {
            n, arm: filtered ? 'tag-filtered' : 'unfiltered', lens: 'lensAB (A tier 0, B tier 1)', pageSize: 32, build,
            coverage: listing.coverage, rowsEvidence: listing.rowsEvidence, reason: listing.reason ?? null, detail: listing.detail ?? null, rowsVisible: listing.rows.length,
            tagged: filtered ? tagged.length : null, untagged: filtered ? untagged.length : null, unknown: filtered ? unknown.length : null,
            reader: { requests: s.requests - q.requests, bytes: s.bytes - q.bytes, cacheHits: s.cacheHits - q.cacheHits, elapsedMs, qualifyRequests: q.requests, qualifyBytes: q.bytes },
            traced: { listing: L, tags: G, total: sumPhase({ ...log.phases.listing, ...Object.fromEntries(Object.entries(log.phases.tags ?? {}).map(([k, v]) => ['tags:' + k, v])) }) },
            byMethod: { listing: log.phases.listing ?? {}, tags: log.phases.tags ?? {} },
          };
          const rows = listing.rows.length;
          // Per-entry figures only on a COMPLETE arm: a budget-refused PARTIAL
          // listing has traced work for rows it never finished resolving.
          arm.perEntry = listing.coverage !== 'COMPLETE' ? null : {
            // reader-accounted (scope.stats): every RPC the reader made, incl. the
            // non-eth_call canonical checks of each seal; traced figures below
            // cover eth_calls only.
            readerRequests: +((s.requests - q.requests) / rows).toFixed(2), readerBytes: Math.round((s.bytes - q.bytes) / rows),
            listingRequests: +(L.calls / rows).toFixed(2), listingGasTotal: Math.round(L.gasTotal / rows), listingGasExecution: Math.round(L.gasExecution / rows), listingBytes: Math.round(L.responseBytes / rows),
            ...(filtered ? { tagRequests: +(G.calls / rows).toFixed(2), tagGasTotal: Math.round(G.gasTotal / rows), tagGasExecution: Math.round(G.gasExecution / rows), tagBytes: Math.round(G.responseBytes / rows) } : {}),
            totalRequests: +((L.calls + G.calls) / rows).toFixed(2), totalGasTotal: Math.round((L.gasTotal + G.gasTotal) / rows), totalGasExecution: Math.round((L.gasExecution + G.gasExecution) / rows),
          };
          if (listing.coverage === 'COMPLETE') {
            assert.equal(listing.rows.length, n, 'all ' + n + ' entries listed');
            if (filtered) { assert.equal(tagged.length, expectedTagged, 'exactly the tagged entries pass the filter'); assert.deepEqual(unknown, [], 'no UNKNOWN tag reads'); }
          }
          console.log(JSON.stringify({ n, arm: arm.arm, coverage: arm.coverage, reason: arm.reason, rows: arm.rowsVisible, tagged: arm.tagged, requests: arm.reader.requests, bytes: arm.reader.bytes, gasTotal: arm.traced.total.gasTotal, perEntry: arm.perEntry, elapsedMs }));
          arms.push(arm);
          return arm;
        }
        const u = await measure(false), fl = await measure(true);
        // n=100 must complete both arms; larger n records whatever the
        // reader's per-scope budget allows (a refusal is a measured result).
        if (n <= 100) { assert.equal(u.coverage, 'COMPLETE', 'unfiltered COMPLETE at n=' + n); assert.equal(fl.coverage, 'COMPLETE', 'filtered COMPLETE at n=' + n); }
      }
      out.sections.pricing = {
        arms,
        method: 'listing = openDirectory(lensAB, Dn, pageSize 32) drained; filtered = the same listing then openTags(nodeId, [tagId("pricing")]) per row (the browser\'s file-panel shape, applied to every row); reader.requests/bytes from scope.stats() minus qualification; gas from debug_traceCall per eth_call at the same pin; per-entry = phase totals / rows listed',
        tagDensity: 'A tags every 4th entry, B every 10th (both principals of the lens)',
        readerLimits: 'DEFAULT_LIMITS maxRequests 4096 / maxBytes 32 MiB per scope (reader-scope.mjs:8; limits() cannot be raised above the default)',
      };
    });

    out.exclusions = ['WAN latency', 'finality', 'production SLA', 'a positional-accelerator arm (no bitmap family exists in the MVP; §5b demoted it to a candidate generator, unmeasured here)', 'the three tag subjects (REVISION/LOCATION carriers do not exist in the MVP TagAssertion)'];
    writeFileSync(new URL('../evidence/tag-joins.json', import.meta.url), JSON.stringify(out, (_, v) => v instanceof Set ? [...v] : typeof v === 'bigint' ? String(v) : v, 1));
    console.log('evidence/tag-joins.json written');
  }, { profile: 'reads', watchdogMs: 3500000 });
});
