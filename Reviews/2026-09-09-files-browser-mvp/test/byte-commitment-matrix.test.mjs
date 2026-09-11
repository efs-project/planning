// byteCommitment classification matrix over EVERY FilesRouterV2 operation kind.
//
// The PM's concern (reconciliation-with-codex §1): a future content branch that
// forgets to set `expectedByteCommitment` would accept a ZERO commitment,
// because the router compares `intent.byteCommitment` with a local that
// defaults to zero. This suite pins today's classification per kind so that
// regression becomes a red row, not a silent acceptance:
//   content-carrying kinds (CREATE_FILE, EDIT): a signed ZERO commitment is
//     refused; a forged NONZERO is refused; "intent commits to tree X,
//     publication carries tree Y" is refused; a revision whose content ref
//     does not name the publication's own tree leaf is refused (ErrTemplate).
//   every other kind: a signed NONZERO commitment is refused; zero is accepted.
// Every refusal is a genuinely AUTHOR-SIGNED intent (not a post-signature
// patch), so the only thing refusing it is the router's classification; the
// two zero-on-content rows are also MINED to prove the on-chain rejection.
// Anything accepted that should be refused is reported as a FINDING in the
// retained matrix (evidence/byte-commitment-matrix.json), never fixed here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { nestedFixture } from './nested-fixture.mjs';
import { compileRouter, routerFixture } from './router-fixture.mjs';
import { authorityFixture } from './authority-fixture.mjs';
import {
  planOperation, authorizeIntentV3, encodeExecuteV2, decodeAuthorityError, contentLeaves, byteCommitmentOf,
  publicationIds, KINDS,
} from '../sdk/files-actions.mjs';
import { FIXTURE, bindingKey, nameRole, ordinaryRecord } from '../../2026-09-09-files-reader/index.mjs';

const ZERO = '0x' + '00'.repeat(32);
const FORGED = '0x' + '99'.repeat(32);
const KIND_NAMES = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [v, k]));
const CONTENT_KINDS = new Set(['createFile', 'edit']);
const hex = s => '0x' + Buffer.from(s).toString('hex');

/** Recompute publication ids after leaf patching so the only inconsistency is
 *  the one under test (Core derives recordIds/envelopeId from the leaves). */
function rebuild(plan, leaves) {
  const header = plan.publication.header;
  const recordIds = leaves.map(l => ordinaryRecord(l.typeId, l.body));
  const { envelopeId } = publicationIds(header, recordIds);
  return { ...plan, publication: { ...plan.publication, envelopeId, recordIds, leaves: leaves.map((l, i) => ({ leafIndex: i, typeId: l.typeId, body: l.body })) } };
}
// FileRevision body: node(32) content(32) ...; BindingSet body: purpose subject role 0x01 target ...
const withContentRef = (revBody, treeId) => '0x' + revBody.slice(2, 66) + treeId.slice(2) + revBody.slice(130);
const withTarget = (bindBody, target) => bindBody.slice(0, 2 + 97 * 2) + target.slice(2) + bindBody.slice(2 + 129 * 2);

test('byteCommitment classification matrix: every FilesRouterV2 op kind', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  await withUpgrade(async lab => {
    const f = await nestedFixture(lab);
    await routerFixture(lab);
    const auth = await authorityFixture(lab);
    const mountId = f.mounts.aFirst;
    const A = auth.A;
    const matrix = [];
    const findings = [];
    let pubNonce = 71000;

    async function prior(principal, purpose, subject, role) {
      const head = lab.readIface.decodeFunctionResult('getBindingHead', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getBindingHead', [bindingKey(principal, purpose, subject, role)]) }, 'latest']));
      const h = head[0];
      if (h[3] === 0n) return null;
      const occ = lab.readIface.decodeFunctionResult('getOccurrenceByOrdinal', await lab.rpc('eth_call', [{ to: lab.core, data: lab.readIface.encodeFunctionData('getOccurrenceByOrdinal', [h[4]]) }, 'latest']));
      return { revision: Number(h[3]), occurrence: { envelopeId: occ[0], leafIndex: Number(occ[1]) } };
    }
    const plan = spec => { const p = planOperation({ ...spec, pubNonce: pubNonce++ }); assert.equal(p.status, 'PLANNED', p.reason); return p; };

    /** Sign the intent for `plan` with the given byteCommitment and submit it
     *  routed. Returns the decoded refusal (or the receipt when accepted). */
    async function submit(p, { byteCommitment = ZERO, mine = false, swapPublication } = {}) {
      const e = await auth.execution();
      const principal = p.publication.header.principalId;
      const signed = await authorizeIntentV3(p, {
        authorWallet: auth.authors[principal], core: lab.core, chainId: 31337,
        executor: auth.router, executorCodehash: auth.routerCodehash,
        executionSetId: e.executionSetId, nonce: await auth.authorNonceOf(principal), deadline: await auth.deadline(),
        byteCommitment,
      });
      const submitted = swapPublication ? swapPublication(p) : p;
      const data = encodeExecuteV2(submitted, e.revision, signed.intent, signed.signature);
      let error; try { await auth.call(auth.router, data); } catch (err) { error = err; }
      if (error) {
        assert(error.data, 'revert must carry data: ' + error.message);
        const decoded = decodeAuthorityError(error.data);
        let minedStatus = null;
        if (mine) { const r = await lab.receipt(await lab.send(data, auth.router), 'matrix mined rejection'); minedStatus = r.status; }
        return { accepted: false, error: decoded ?? { name: 'UNDECODED', args: [error.data] }, minedStatus };
      }
      const receipt = await lab.receipt(await lab.send(data, auth.router), 'matrix accepted operation');
      assert.equal(receipt.status, '0x1');
      return { accepted: true, gasUsed: String(BigInt(receipt.gasUsed)), plan: submitted };
    }

    /** One matrix row. `expect` is the error name that SHOULD refuse (null =
     *  should be accepted). A mismatch is recorded as a FINDING and fails. */
    async function row(kind, arm, p, opts, expect, note) {
      const r = await submit(p, opts);
      const kindCode = p.op.kind;
      const entry = {
        kind: KIND_NAMES[kindCode] ?? 'unknown', kindCode, classification: CONTENT_KINDS.has(KIND_NAMES[kindCode]) ? 'CONTENT' : 'NON_CONTENT',
        arm, signedByteCommitment: opts.byteCommitment ?? ZERO,
        expected: expect ? { refusedBy: expect } : { accepted: true },
        actual: r.accepted ? { accepted: true, gasUsed: r.gasUsed } : { refusedBy: r.error.name, args: r.error.args, ...(r.minedStatus ? { minedStatus: r.minedStatus } : {}) },
        note,
      };
      const ok = expect ? (!r.accepted && r.error.name === expect) : r.accepted;
      entry.verdict = ok ? 'AS_CLASSIFIED' : 'FINDING';
      if (!ok) findings.push(entry);
      matrix.push(entry);
      console.log([entry.kind, arm, entry.verdict, r.accepted ? 'ACCEPTED gas=' + r.gasUsed : r.error.name + '(' + r.error.args.join(',') + ')' + (r.minedStatus ? ' mined=' + r.minedStatus : '')].join(' | '));
      return r;
    }

    // ---- CREATE_DIR --------------------------------------------------------
    await row('createDir', 'nonzero-signed', plan({ kind: 'createDir', mountId, parent: f.root, name: 'bcm', principal: A }), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: a stray signed commitment is refused (expected 0)');
    const mk = await row('createDir', 'zero (positive control)', plan({ kind: 'createDir', mountId, parent: f.root, name: 'bcm', principal: A }), {}, null, 'non-content accepts zero');
    const D = mk.plan.predicted.objectId;

    // ---- CREATE_FILE -------------------------------------------------------
    const b1 = hex('matrix file v1\n'), b2 = hex('matrix file v2\n'), b3 = hex('an unrelated tree\n');
    const c1 = contentLeaves(b1), c2 = contentLeaves(b2), c3 = contentLeaves(b3);
    const C = c => byteCommitmentOf(c.treeId, c.tree.body);
    const cf = () => plan({ kind: 'createFile', mountId, parent: D, name: 'file.txt', principal: A, bytesHex: b1 });
    await row('createFile', 'zero-signed (mined)', cf(), { byteCommitment: ZERO, mine: true }, 'ErrByteCommitment', 'CONTENT: the author signed a ZERO commitment (a client that forgot to set it); router derives the expected value from the publication\'s own ChunkTree leaf and refuses; mined rejection proven');
    await row('createFile', 'nonzero-forged-signed', cf(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'CONTENT: a signed commitment over no tree is refused');
    await row('createFile', 'substitution: intent=tree X, publication=tree Y (signed)', cf(), { byteCommitment: C(c3) }, 'ErrByteCommitment', 'CONTENT: author signed the commitment of another tree (c3) while the publication carries c1');
    {
      // Bearer swap AFTER signing: the signature covers publication c1 with
      // commitment C(c1); the bearer submits leaves rebuilt around c2. The
      // router refuses on the byte commitment BEFORE Core sees the signature.
      const honest = cf();
      const swapped = p => {
        const L = p.publication.leaves.map(l => ({ typeId: l.typeId, body: l.body }));
        const revBody = withContentRef(L[3].body, c2.treeId);
        const revId = ordinaryRecord(L[3].typeId, revBody);
        return rebuild(p, [L[0], L[1], c2.tree, { typeId: L[3].typeId, body: revBody }, { typeId: L[4].typeId, body: withTarget(L[4].body, revId) }, L[5], L[6]]);
      };
      await row('createFile', 'bearer swaps tree leaf after signing (X signed, Y submitted)', honest, { byteCommitment: C(c1), swapPublication: swapped }, 'ErrByteCommitment', 'CONTENT: expected=commitment(c2) from the submitted leaves, got=commitment(c1) from the signature; refused at the router, before Core\'s signature check');
    }
    {
      // Mismatched revision -> tree link: the publication carries tree leaf c1
      // but the FileRevision names c3 (head binding rebuilt to stay consistent
      // so the ONLY inconsistency is the link).
      const p0 = cf();
      const L = p0.publication.leaves.map(l => ({ typeId: l.typeId, body: l.body }));
      const revBody = withContentRef(L[3].body, c3.treeId);
      const revId = ordinaryRecord(L[3].typeId, revBody);
      const p = rebuild(p0, [L[0], L[1], L[2], { typeId: L[3].typeId, body: revBody }, { typeId: L[4].typeId, body: withTarget(L[4].body, revId) }, L[5], L[6]]);
      await row('createFile', 'mismatched revision->tree link (signed)', p, { byteCommitment: C(c1) }, 'ErrTemplate', 'CONTENT: revision.content != publication tree leaf id -> ErrTemplate(3,8) fires before the byte-commitment comparison');
      const last = matrix.at(-1);
      assert.deepEqual(last.actual.args, ['3', '8'], 'createFile link mismatch is ErrTemplate(3,8)');
    }
    const created = await row('createFile', 'derived commitment (positive control)', cf(), { byteCommitment: C(c1) }, null, 'CONTENT: keccak(abi.encode(treeId, keccak(treeBody))) accepted');
    const F = created.plan.predicted.objectId, R1 = created.plan.predicted.revisionId;

    // ---- EDIT ---------------------------------------------------------------
    const ed = async () => plan({ kind: 'edit', mountId, fileId: F, principal: A, bytesHex: b2, priorRevisionId: R1, priors: { head: await prior(A, FIXTURE.headPurpose, F, FIXTURE.headRole) } });
    await row('edit', 'zero-signed (mined)', await ed(), { byteCommitment: ZERO, mine: true }, 'ErrByteCommitment', 'CONTENT: signed zero commitment refused; mined rejection proven');
    await row('edit', 'nonzero-forged-signed', await ed(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'CONTENT: forged commitment refused');
    await row('edit', 'substitution: intent=tree X, publication=tree Y (signed)', await ed(), { byteCommitment: C(c3) }, 'ErrByteCommitment', 'CONTENT: intent commits to c3, publication carries c2');
    {
      const honest = await ed();
      const swapped = p => {
        const L = p.publication.leaves.map(l => ({ typeId: l.typeId, body: l.body }));
        const revBody = withContentRef(L[1].body, c3.treeId);
        const revId = ordinaryRecord(L[1].typeId, revBody);
        return rebuild(p, [c3.tree, { typeId: L[1].typeId, body: revBody }, { typeId: L[2].typeId, body: withTarget(L[2].body, revId) }]);
      };
      await row('edit', 'bearer swaps tree leaf after signing (X signed, Y submitted)', honest, { byteCommitment: C(c2), swapPublication: swapped }, 'ErrByteCommitment', 'CONTENT: expected=commitment(c3) from submitted leaves, got=commitment(c2) from the signature');
    }
    {
      const p0 = await ed();
      const L = p0.publication.leaves.map(l => ({ typeId: l.typeId, body: l.body }));
      const revBody = withContentRef(L[1].body, c3.treeId);
      const revId = ordinaryRecord(L[1].typeId, revBody);
      const p = rebuild(p0, [L[0], { typeId: L[1].typeId, body: revBody }, { typeId: L[2].typeId, body: withTarget(L[2].body, revId) }]);
      await row('edit', 'mismatched revision->tree link (signed)', p, { byteCommitment: C(c2) }, 'ErrTemplate', 'CONTENT: revision.content != publication tree leaf id -> ErrTemplate(1,8)');
      assert.deepEqual(matrix.at(-1).actual.args, ['1', '8'], 'edit link mismatch is ErrTemplate(1,8)');
    }
    const edited = await row('edit', 'derived commitment (positive control)', await ed(), { byteCommitment: C(c2) }, null, 'CONTENT: derived commitment accepted');
    const R2 = edited.plan.predicted.revisionId, T2 = edited.plan.predicted.treeId;

    // ---- RENAME_MOVE -------------------------------------------------------
    const rn = async () => plan({ kind: 'renameMove', mountId, parent: D, name: 'renamed.txt', sourceParent: D, sourceName: 'file.txt', object: F, principal: A, priors: { source: await prior(A, FIXTURE.namePurpose, D, nameRole('file.txt')) } });
    await row('renameMove', 'nonzero-signed', await rn(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: refused (expected 0)');
    const renamed = await row('renameMove', 'zero (positive control)', await rn(), {}, null, 'non-content accepts zero');

    // ---- COPY ---------------------------------------------------------------
    const cp = () => plan({ kind: 'copy', mountId, parent: D, name: 'copy.txt', principal: A, treeId: T2, mediaType: 'text/plain' });
    await row('copy', 'nonzero-signed', cp(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'COPY is content-BY-REFERENCE (FileRevision names an already-admitted tree; no tree leaf in the publication) and the router classifies it NON-CONTENT: expected 0');
    {
      // The referenced tree is bound only through publicationHash in the
      // signed digest, never through byteCommitment: a bearer that swaps the
      // referenced tree after signing is refused by CORE's signature check,
      // not by the router.
      const honest = cp();
      const swapped = p => {
        const L = p.publication.leaves.map(l => ({ typeId: l.typeId, body: l.body }));
        const revBody = withContentRef(L[2].body, c3.treeId);
        const revId = ordinaryRecord(L[2].typeId, revBody);
        return rebuild(p, [L[0], L[1], { typeId: L[2].typeId, body: revBody }, { typeId: L[3].typeId, body: withTarget(L[3].body, revId) }, L[4], L[5]]);
      };
      await row('copy', 'bearer swaps referenced tree after signing', honest, { byteCommitment: ZERO, swapPublication: swapped }, 'ErrUnauthorizedPrincipal', 'COPY: the router accepts (0 == 0); only Core\'s publicationHash-bound signature refuses. The byte commitment carries NO content binding for a copy');
    }
    await row('copy', 'zero (positive control)', cp(), {}, null, 'non-content accepts zero');

    // ---- PLACEMENT ---------------------------------------------------------
    const pl = () => plan({ kind: 'placement', mountId, parent: D, name: 'link.txt', object: F, principal: A });
    await row('placement', 'nonzero-signed', pl(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: refused');
    await row('placement', 'zero (positive control)', pl(), {}, null, 'non-content accepts zero');

    // ---- REMOVE -------------------------------------------------------------
    const rm = async () => plan({ kind: 'remove', mountId, parent: D, name: 'renamed.txt', object: F, principal: A, selectedEntry: renamed.plan.predicted.entryId, priors: { source: await prior(A, FIXTURE.namePurpose, D, nameRole('renamed.txt')) } });
    await row('remove', 'nonzero-signed', await rm(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: refused');
    const removed = await row('remove', 'zero (positive control)', await rm(), {}, null, 'non-content accepts zero');
    const markerId = removed.plan.predicted.markerId;

    // ---- RESTORE ------------------------------------------------------------
    const rs = async () => plan({ kind: 'restore', mountId, parent: D, name: 'renamed.txt', object: F, markerId, principal: A, priors: { destination: await prior(A, FIXTURE.namePurpose, D, nameRole('renamed.txt')), marker: await prior(A, FIXTURE.removedPurpose, D, markerId) } });
    await row('restore', 'nonzero-signed', await rs(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: refused');
    await row('restore', 'zero (positive control)', await rs(), {}, null, 'non-content accepts zero');

    // ---- TAG / UNTAG --------------------------------------------------------
    const tg = () => plan({ kind: 'tag', mountId, object: F, label: 'matrix', principal: A });
    await row('tag', 'nonzero-signed', tg(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: refused');
    const tagged = await row('tag', 'zero (positive control)', tg(), {}, null, 'non-content accepts zero');
    const ut = async () => plan({ kind: 'untag', mountId, object: F, label: 'matrix', principal: A, priors: { tag: await prior(A, FIXTURE.tagPurpose, F, tagged.plan.op.aux) } });
    await row('untag', 'nonzero-signed', await ut(), { byteCommitment: FORGED }, 'ErrByteCommitment', 'non-content: refused');
    await row('untag', 'zero (positive control)', await ut(), {}, null, 'non-content accepts zero');

    // ---- unknown kind (the router's else branch) ---------------------------
    {
      const p = tg(); p.op = { ...p.op, kind: 11 };
      await row('unknown-11', 'zero-signed', p, {}, 'ErrUnknownKind', 'an unsupported kind reverts before the byte-commitment comparison');
      const p2 = tg(); p2.op = { ...p2.op, kind: 11 };
      await row('unknown-11', 'nonzero-signed', p2, { byteCommitment: FORGED }, 'ErrUnknownKind', 'same: ErrUnknownKind wins over ErrByteCommitment');
    }

    // ---- coverage: every kind the router declares has rows -----------------
    const declared = Object.keys(KINDS);
    const covered = new Set(matrix.map(r => r.kind));
    for (const k of declared) assert(covered.has(k), 'matrix row missing for kind ' + k);
    assert.equal(declared.length, 10, 'router declares ten kinds');

    const out = {
      kind: 'BYTE_COMMITMENT_CLASSIFICATION_MATRIX',
      date: '2026-09-10',
      router: 'FilesRouterV2 (contracts/src/FilesRouterV2.sol) via Core U3 executeAuthorized; one author signature per row; refusals observed by eth_call preflight, two zero-on-content rows also mined',
      classification: { CONTENT: ['createFile', 'edit'], NON_CONTENT: ['createDir', 'renameMove', 'copy', 'placement', 'remove', 'restore', 'tag', 'untag'] },
      rows: matrix,
      findings,
      observations: [
        'COPY carries content by reference (FileRevision.content names an admitted ChunkTree; the publication has no tree leaf) and is classified NON_CONTENT: the referenced tree is bound only by publicationHash inside the signed AuthorIntent digest, not by byteCommitment. A bearer that swaps the referenced tree is refused by Core (ErrUnauthorizedPrincipal), not by the router.',
        'The classification is a local variable defaulting to zero (FilesRouterV2.sol:407); a future content-carrying branch that forgets to assign it would accept a zero commitment. This matrix is the regression that turns that into a red row for CREATE_FILE and EDIT; any NEW content kind must add a zero-signed row here.',
        'ErrTemplate(3,8) / ErrTemplate(1,8) (revision.content != own tree leaf) fire BEFORE the byte-commitment comparison, so a mismatched link never reaches the commitment check.',
      ],
    };
    writeFileSync(new URL('../evidence/byte-commitment-matrix.json', import.meta.url), JSON.stringify(out, null, 1));
    console.log('evidence/byte-commitment-matrix.json written; rows=' + matrix.length + ' findings=' + findings.length);
    assert.deepEqual(findings, [], 'every op kind behaves as classified; findings: ' + JSON.stringify(findings, null, 1));
  }, { profile: 'reads', watchdogMs: 900000 });
});
