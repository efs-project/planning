# Fable → Codex: v2 validation report after the files-browser integration

**Status:** synthesis of the Fable engagement's executed evidence for planning
the foundation build. Sources: the consumer tournament
(`experiments/efs2-consumer-tournament-2026-08-26`, oracle-vs-Solidity
119/119 + EVO-100), the freeze-seam tournament (`overnight2/` there), the two
type-system labs (2026-08-17, 2026-08-22), and the files-browser MVP
(`Reviews/2026-09-09-files-browser-mvp` on `fable/2026-09-09-files-browser`,
head `922ea0d`, pushed). Every claim below is backed by an executed test or a
measured number in those trees; nothing here is prose-only.

## What we found out

1. **The semantic core holds under independent attack.** Content-addressed
   author-neutral identity, canonical decode-or-reject, unknown preservation
   and offline reconstruction now agree across three independent
   implementations (clean-room Python 333/333; oracle-vs-Solidity 119/119;
   EVO-100 cold reconstruction 100/100 with one cross-runtime receipt).
2. **Evolution behaves.** Over a 50-year simulated event mix on real
   application spines: admitted Records re-mint **zero** times in every
   architecture arm; index and view additions don't rename data under the
   EXP-C0 shape; the current Files model has **no** directory-rename
   avalanche. The one churn that survives every arm is self-referential
   lineage across a Type revision (~120 breaks/50y): executable evidence now
   shows no self-class successor rule can fix it (hash fixed point
   infeasible) and that the cure is a **pair** — stable-Object anchor for
   continuity *plus* exact parent recordId for direction (anchor-only has
   precision 0.167).
   **Codex clarification (2026-09-11):** The 50-year duration describes that
   simulated event mix; it does not establish 100-year durability or availability.
3. **Consumer safety is a mechanism, not a hope.** Effectful consumers that
   pin exact TypeIds took zero hostile effects across the full attack matrix
   (byte-identical semantic twins, exactConstant forges, stolen-issuer
   bindings, callback grief). SEMANTIC_VIEW with an issuer gate is safe
   *mechanically* but concentrates century-scale authority in one key — fit
   for inert readers only. EAS-like callbacks fail portability (mutable-code
   reinterpretation, grief) and survive only as Realm-local policy. Address
   is never meaning.
4. **The completeness law needs five normative sentences.** The single-engine
   COMPLETE/PARTIAL/UNKNOWN machine survived all attacks, but adversaries
   broke its *composition*: a merge emitted absence from empty PARTIAL pages,
   and two shards differing only in domain closure collided on one basis.
   Also: UNVERIFIED links need their own admission bound, and traversal
   budgets must count work/stack, not visited nodes. All five fixes are
   scoped and written down; none is in Solidity or frozen text yet.
5. **The everyday Files product is real.** One joined path — contracts →
   five-seam SDK → static SPA — runs the full loop in real Chromium against
   real local v2 contracts: guest zero-wallet nested browse, verified bytes
   (re-hashed before display) with historical revisions, create/edit/rename/
   move/copy-vs-placement/remove-restore/attributed tags, Lens disagreement
   with explanations, offline-verifiable export *(WRONG — see the
   correction at the end of this file)*, and a **live U1→U2 upgrade
   of populated contracts followed by a new write**. Authority and all Files
   preconditions (NOREPLACE, stale CAS, cycles, restore collisions) are
   enforced **on-chain in FilesRouterV1** at ~0.7% gas overhead — tests
   submit around the UI to prove it. Acceptance: 11 of 16 rows PASS, 5
   COMPONENT, honestly ledgered.
6. **Measured costs.** Writes: create-file 8.73M gas, rename 5.39M, dir-move
   +witness 5.42M, edit 4.2M, remove 5.1M, restore 4.3M, tag 3.1M — all
   under the 16.77M profile; exactly one 7-leaf create fits per transaction.
   Reads: cold open 92 requests ≈1.85 s at 50 ms/RPC; **folder navigation on
   a shared pinned scope costs 28 requests vs 82 fresh** — the simple
   candidate beat segment machinery at ordinary folder sizes, as the
   correctness-first ruling hoped. Verified file open: 9 requests.
7. **Honest UX and calm UX are compatible.** After an independent 22-finding
   review and an ergonomic Chromium suite: drafts survive failed edits,
   success is claimed only after independent read-back, approvals are
   counted and labeled simulated, 320px/keyboard-only/200%-text all pass —
   without hiding PARTIAL/CONFLICT/UNKNOWN.
8. **Method finding worth keeping:** every stage's differential/adversarial
   setup caught real bugs prose review missed — an oracle pin-set bug, the
   completeness merge break, a scope-killing abort on navigation, and a
   wrong test expectation about object-level tags. Sealed hypotheses +
   independent implementations + adversarial verifiers should stay the house
   style for foundation work.

## Concerns (ranked by risk to viability)

1. **Folder enumeration at scale.** The 64-name/60-retraction control still
   exhausts the 512-request budget before yielding four live files — the one
   FAIL on the acceptance ledger, and it sits under every folder a user will
   ever open. Behind it looms the indexer question: developers will not
   tolerate raw-read APIs; we need a reconstruction-verified local-index
   stance before app developers arrive.
2. **All authority is still synthetic.** One operator key signs for every
   principal; my router's preconditions are real but bypassable by the
   bearer FixturePlan (honestly labeled NOT certified). Until EOA/ERC-1271
   admission with retained transcripts and RoutedAdmissionIntent consent
   binding are integrated into Core, nothing here is deployable even to a
   public testnet with meaning.
3. **Economics are unpriced.** 8.7M gas per file creation makes the venue
   choice a viability parameter, not a launch detail. No $/op numbers exist
   for any candidate chain; block-gas and calldata/blob pricing assumptions
   are unchecked (V2-E7 matrix is empty).
4. **The completeness composition law exists only as Python evidence.**
   Until the T4/G2 Solidity state machine lands with
   `testMergeRefusesAbsenceUnlessAllComplete` and
   `testBasisBindsDomainClosure` as acceptance tests, the silent-absence bug
   class remains open at the layer every consumer trusts.
5. **Unmeasured environments.** All latency is loopback (+50 ms injection);
   no WAN, no real device, no real wallet prompt counts, no reorgs (anvil
   never reorgs — the canonicality law is untested under one), no
   multi-writer concurrency beyond two contexts.
6. **Bytes stop at 16 KiB single-chunk**; the carrier/DA strategy
   (state vs calldata vs external + locators) and alternate-provider
   recovery are designed, unexecuted.
7. **The SDK is lab-grade**, and one standing epistemic caveat spans the
   whole engagement: all "independent" implementations were written by one
   agent. The generated-validator second-implementation equality check (a
   named kill criterion) has never run, and there is no packaged TypeScript
   surface or bundle-size reality check.
8. **Byte-pin drift:** my compatible reader extensions supersede the
   2026-09-09 screen/delivery checkpoints' source pins at this revision
   (documented, evidence untouched). Reviewers should treat those old
   byte-pin regressions as checkpoint-scoped, not live gates.

## What we still need to look into

**Gate experiments (order matters; each could force design changes):**
1. Enumeration at scale: yield-oriented scanning + same-observation
   continuation on the 64/60 control, a 500-entry folder benchmark, and the
   verified-local-index decision packet.
2. Real authority: EOA/ERC-1271 admission joined into Core (the V2-E1
   comparator exists, unintegrated), RoutedAdmissionIntent consent binding,
   and the session-grant path executed with prompt counts.
3. The T4/G2 mutation+query Solidity SUT carrying the two seam-tournament
   acceptance tests plus QueryProfile activation/backfill/coverage.

**Cheap parallel starts:** venue cost sheet from existing gas numbers; one
manual real-wallet session on the running prototype; WAN/device runs of the
existing journey suite.

**Then:** multi-chunk bytes + carrier strategy; SDK productization with a
genuinely second implementation; a second application vertical (Git or chat)
through the same reader to test "no app-specific Core nouns"; the Lane-7 red
team + reorg/concurrency harness; and the pre-freeze type leftovers —
lineage pair rule and ANY-link bounds promoted to normative text, the
generic Solidity tuple interpreter's gas, and nested-struct-list caps if any
production Type ships them (the 9/64 collapse applies).

## Also relevant

- **Deliverable inventory:** everything is on `fable/2026-09-09-files-browser`
  (pushed): `Reviews/2026-09-09-files-browser-mvp/{README,walkthrough,
  acceptance,plan}.md`, contracts/sdk/web/scripts/test, evidence with
  screenshots and perf JSON. Drive it: `node scripts/run.mjs --upgrade`.
  The consumer/seam tournaments live under `experiments/` (local branches,
  per overnight protocol).
- **No new owner decisions are required** to proceed on any of the above;
  the genuinely-James items remain the standing ones: graduating this build
  direction into real product repositories, and (later, evidence-gated)
  venue selection and freeze ceremonies.
- **Tooling notes for whoever picks this up:** run Playwright suites with
  `node --test --test-force-exit` (open handles otherwise hang the runner
  with buffered output); the pinned solc 0.8.30 and rehearsal node_modules
  are the shared toolchain; `withUpgrade` now takes `watchdogMs` for
  long-lived environments.

---

## Correction — 2026-09-10: the export claim above was wrong

"Offline-verifiable export" did not hold when this report was written, and
the error was mine, not a misreading.

**What was actually true at `92f2d6b`:** the browser emitted
`EFS_FILES_EXPORT_V0`, and `scripts/verify-export.mjs` hashed the bundle's own
inputs without ever comparing them to an authenticated expected commitment.
It checked that a revision id was 66 characters long and that the evidence
array was non-empty. A bundle of fabricated bytes with zeroed ids, a zeroed
basis and `evidence: [{}]` therefore printed **"Clean offline verification:
no RPC, no cache, no index"** and exited 0. Hashing an input without
comparing it establishes nothing.

**Who caught it:** the data-readiness reconciliation
(`Reviews/2026-09-10-data-readiness-reconciliation.md`, PM worktree
`codex/mvp-c0-coherence` at `cf352ed`), which reproduced the counterexample
directly rather than taking the report's word for it. That was the right call
and it is the reason the repair exists.

**What was done about it:** the counterexample was first pinned as a failing
regression (`test/export-verifier.test.mjs`), then the exporter and verifier
were rebuilt as `EFS_FILES_EXPORT_V1` with tiered trust language — see
[integration-notes.md](integration-notes.md) and the Evidence section of
[README.md](README.md). Fifteen hostile bundle variants are now refused, and
V0 bundles are rejected as unverifiable rather than silently re-certified.

**What still is not true, stated plainly:** a fabricated-but-internally-
coherent bundle still passes the self-consistency tier; record existence and
revision currency are *transcript-attested*, not proven offline; and the
trust anchor is *declared*, not proven. Closing that last gap needs
`eth_getProof` state proofs, which are not built. Read the verifier's tier
labels, not its exit code.

Everything else in this report predates that repair; treat any other claim
about export or offline recovery here as superseded by the README and
acceptance ledger at the current checkpoint.
