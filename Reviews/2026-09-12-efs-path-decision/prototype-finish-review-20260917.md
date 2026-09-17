# Finite Files completion pass — integration/final review

**Final disposition:** the single fix wave at `44db867` addressed findings1/2/4;
the scoped re-review is appended below. Finding3 remains disclosed/nonblocking.
See [[prototype-finish-results-20260917]] for the parent-run browser evidence,
source location and handoff limits. The initial review below remains historical
as written rather than being edited to imply the defects were never present.

Reviewed 2026-09-17, session `prototype-finish-final-review-20260917`, Codex.
Scope is **517d335..48d7ed4 only**, with HEAD independently read as
`48d7ed4aaa1f75ca540a65a9f1191b44a8087d95`. This is a bounded local prototype
review, not a historical protocol audit, universal v1 parity claim or production
security assessment. Paths/line numbers below are relative to
`Reviews/2026-09-12-efs-path-decision/lab-b/` at that head.

## Verdict

**Spec: PASS for the finite authorized pass. Quality: Approved with minor
follow-ups. Readiness: suitable for the bounded local prototype handoff.**

No Critical or Important issue was found in the reviewed integration. Task 4's
separate scoped gate is also PASS/Approved (`task-4-review.md`). Parent-owned
planning/main reconciliation is separate and not certified by this report.

### Critical

None found in scope.

### Important

None found in scope. Task 3's earlier false selected-revision stance under a
displayed HEAD conflict is addressed: `browser/compact-stance.mjs:53-64` retains
UNKNOWN/no subject until the displayed point has a qualified selected revision,
and rejects a subsequently different returned subject.

### Minor follow-ups

1. **Partial recursive-release outcome shape is inconsistent.**
   `browser/files-workflows.mjs:56` returns a non-verified reconciliation as
   PARTIAL without `atomic:false` or `retained`; complete and exception returns
   include them at lines 60-61. Reproduction: a preview executes its next plan
   but reconciliation returns anything other than EFFECTS_VERIFIED. The browser
   still displays the preview retention warning and the pending/current-plan
   evidence, so there is no false atomic deletion or completion claim. Normalize
   the result metadata when this helper is next touched. Carried from Task 1.

2. **A valid manually entered gas price can become Unknown unnecessarily.**
   `browser/fee-model.mjs:43-46`, input conversion at `browser/app.mjs:752`.
   Reproduction retained by Task 2's reviewer: enter `0.000000015` gwei; binary
   Number scaling yields `14.999999999999998`, failing the safe-integer check
   despite the intended 15 wei. Use decimal-string-to-wei parsing. Captured
   defaults are unaffected; this fails closed and cannot cause spending or a
   false cheap total. Carried from Task 2; not rerun here.

3. **An authenticated exact Concept still lacks a verified display label.**
   `browser/tag-stance-profile.mjs:81-83` authenticates the Concept but does not
   return its label; `browser/app.mjs:333-336` therefore says “Label not yet
   verified.” Reproduction reported by the parent: create a fresh exact label,
   ASSERT it and inspect after reconciliation/filtering. The valid stance and
   author order render, but the label remains conservatively unresolved. This
   is usability debt, not a false stance or authority claim. A later same-basis
   qualified Concept-label projection can close it without legacy migration.

4. **History should name its independent Lens/order more explicitly.**
   `browser/compact-sdk.mjs:419-428` intentionally obtains ordered selected
   ancestry; `browser/app.mjs:610-615` supplies no no-tiebreak policy, while
   `browser/app.mjs:322-324` retains history by File and labels only its block.
   Source-derived reproduction: read Alice-first history, switch that File to
   Bob-first or diagnostic conflict view; the saved Alice history remains until
   a fresh history read. Starting history in conflict view likewise selects
   Alice-first ancestry. The API result truthfully carries an ordered basis,
   the main File CONFLICT is not overwritten, and conflict-view writes stay
   disabled (`browser/app.mjs:94,147`), so this is not the repaired false stance
   claim or a write-safety defect. Label the stored history's actual Lens/order
   (and distinguish it from the current inspector), or require an explicit
   ordered view for history. No browser reproduction was run by this reviewer.

## Integration assessment

- **Link/copy/history/release:** `browser/compact-sdk.mjs:893-970` keeps link
  identity separate from a new copy subject/root, retains destination guards,
  freezes source HEAD, reuses exact ciphertext/external descriptors and refuses
  implicit live-provider snapshots. History has a pinned basis, bounded page,
  instance-owned continuation and partial outcome; it is selected ancestry,
  not all branches. `browser/files-workflows.mjs:6-61` uses one-use complete
  previews, own audit-scope enumeration including masks, directory/coordinate
  cycle handling, root-last order and fresh checks before separate normal
  publications. An uncertain step stops with completed and pending work.
  Retained Records/HEADs/tags, other authors and outside aliases are not erased.
- **Signed lifecycle and exact stance:** `browser/compact-sdk.mjs:883-892`
  imports only validated planner actions into the engine's own retention,
  binding, guard, authorization and journal machinery. It does not inject a
  standalone planner receipt into the journal. Selected-revision and whole-Lens
  coordinates are guarded; pre-sign exact-stance preflight is additive. Pinned
  required-index/validator checks, live-head provenance and per-author reduction
  reside in `browser/compact-stance.mjs:5-44`. Unknown earlier authors block
  fallback; SILENT is not DENY or a blind interpretation of legacy MASK.
- **Folder filters:** `browser/app.mjs:190-199` bypasses the legacy joined tag
  predicate in exact mode and hydrates only enumerated rows at the page context.
  Unknown matches stay visible and folder coverage is not promoted to global
  inventory/history. The fixed conflict hydration preserves the displayed
  point and still allows independently qualified stable File stances.
- **Consent and focus:** `browser/app.mjs:471-491` binds inline replacement
  consent to the inspected destination, consumes it and requests renewed
  consent after drift. Create-to-edit retains a guarded placement dependency
  (`browser/compact-sdk.mjs:869-875`). Editor opening is nonmodal, without focus
  calls (`browser/app.mjs:549`). A fresh source search found no native
  alert/confirm/prompt/showModal/autofocus/focus call in app.mjs/index.html.
- **Fees and journal:** `browser/files-view.mjs:68-130` keeps unique receipt
  attribution, contradictory observations, unknown components, component
  subtotals and complete-action subtotals separate. Modeled L1/Base/Arbitrum
  prices are dated counterfactuals, not live paid-chain receipts or all-in
  storage charges. `browser/app.mjs:95-104,789-800` applies the genesis-qualified
  namespace consistently to journal and navigation hints without importing or
  deleting old unqualified storage. Reconciliation is read-only, not a retry
  signature/broadcast; delayed receipt cost can remain unknown after effect
  success until a later matched receipt arrives.
- **Local payer and static/carrier composition:**
  `browser/wallet-session.mjs:8-28` keeps author intent separate from a bounded
  zero-value local Anvil payment, whitelists the guarded signed entrypoint and
  checks loopback, chain/genesis, Ledger runtime and gas cap. App/dev gating and
  `vite.config.mjs:40` keep sponsor/faucet/demo signers and temporary carrier out
  of static operation. Ordinary static files plus the configured RPC suffice
  for guest metadata/retained-content reads; public gateway bytes are optional,
  permissioned transport. Task 4 preserves the bounded loader and exact EFS
  fingerprint verification, not CID/DAG or permanence proof. No source change
  to Core/Solidity, mandatory indexes, capacity policy or transaction cap is
  present in this pass; no public calldata estimator or paid uploader is added.

## Evidence used and remaining boundaries

Read the supplied whole-pass diff, task briefs/reports, prior task reviews and
Task 3 re-review, plus the progress ledger. Task 4 was reviewed first and its
already-assessed transport slice was not reopened as a new campaign. Narrow
current-source checks resolved call-site/line and policy questions. No suites,
builds, browser interactions, RPC/network calls or mutable service actions were
performed by this reviewer; only these two requested scratch reports were
written. Supplied execution evidence is attributed below, not independently
rerun or aggregated into an invented grand-total test count.

- Task 1 reports final 2/2 new workflow checks, earlier focused 13/13 chain
  regression and 66/66 SDK/view checks, including copies, aliases/cycles,
  retained/lower-author state and interrupted sequential release.
- Task 2 reports 29/29 focused checks, one real ephemeral-chain EIP-1193
  sponsored-intent test and static/key exclusion checks.
- Task 3 reports 72/72 focused checks, then 29/29 final covering checks after
  the conflict fix, including actual-app boundary and real-chain Lens/stance
  controls. Task 1's then-stale app host was subsequently repaired; its old
  failing-baseline warning is not the current Task 3/4 harness result.
- Task 4 reports 38/38 focused adapter/app checks and the latest static build,
  with one unchanged public IPFS sample retrieved by the actual bounded loader.
- The parent reports independent actual-browser guest/navigation/ordered
  fallback; create/edit/restore; link same-ID/copy new-ID; rename/move/hide/
  unhide; two-step own-placement release; public AR bytes, encrypted sample and
  live contract value; exact Alice ASSERT/Bob DENY/SILENT and 1/9 versus 0/9
  filtered rows. A delayed receipt was recovered by manual reconciliation
  without another signature. Static-prefix port 4173 retrieval verified the
  12,435-byte IPFS PNG through displayed Pinata with demo/faucet/sponsor/
  temporary-carrier disabled and key/API paths returning 404.

**Not closed or implied:** actual MetaMask-extension UX; funded/payment or paid
Arweave upload execution (the adapter itself is not implemented); durable IPFS
pinning/storage; global stance inventory/history; exhaustive all-author revision
history; global recursive deletion; public deployment, production readiness or
protocol adoption. These are honestly bounded exclusions, not reasons to reopen
this finite prototype pass. Parent should preserve them in the owner handoff.

---

# Scoped final fix re-review

Reviewed 2026-09-17, Codex, session `prototype-finish-final-review-20260917`.
Exact scope: `48d7ed4..44db8677f85232e72dd97ffaef4ffed91d905cc9`.
HEAD independently matches the assigned final commit; tracked diff was empty.
Read the final fix brief/report and complete supplied 506-line diff once.
Paths below are relative to `Reviews/2026-09-12-efs-path-decision/lab-b/`.

## Verdict

**Spec: PASS. Quality: Approved. Findings 1, 2 and 4: ADDRESSED.**
No new Critical/Important or other consequential breakage found in this diff.
This closes the requested final fix wave; it does not expand the earlier
bounded prototype verdict into a production or full-protocol audit.

- **Finding 1 — ADDRESSED:** `browser/files-workflows.mjs:56` now includes
  `atomic:false` and `retained:preview.retained` for non-verified reconciliation,
  matching complete/exception outcomes. The new helper test covers all three
  return paths and preserves pending work on uncertainty/interruption.
- **Finding 2 — ADDRESSED:** `browser/fee-model.mjs:43-69` parses bounded decimal
  digits/exponents into integer wei rather than multiplying a binary Number.
  Input length, exponent magnitude and uint256 output are bounded; malformed,
  negative, nonfinite and nonzero sub-wei inputs remain Unknown. The raw gas
  field string survives `browser/app.mjs:758-763`, including invalid edits, so
  no previous price is silently reused. Tests cover 15 wei in decimal, exponent
  and numeric-default form, trailing-zero precision, large exact values and
  invalid cases; the actual-app host covers the field boundary.
- **Finding 4 — ADDRESSED:** `browser/compact-sdk.mjs:419-431` validates policy,
  uses it in both selection and returned basis, and binds it to continuation
  ownership alongside File/Lens/context. No-tiebreak conflict returns qualified
  CONFLICT with no chosen ancestry; unavailable selection remains UNKNOWN/
  PARTIAL. `browser/app.mjs:91-93,325-327,613-620` keys and labels history by its
  actual order/policy/block and rejects superseded in-flight results using route,
  read generation, Lens key and selected File. Built-in/custom Lens changes
  invalidate saved history (`browser/app.mjs:735,748`); continuation keeps its
  original context/order/policy. SDK, app-boundary and bounded chain controls
  exercise both ordered selections, conflict/unavailable behavior, stale
  hydration and continuation rejection for policy/order/context drift.

Finding 3 is intentionally unchanged: a valid exact Concept can still display
“Label not yet verified.” It remains the previously disclosed nonblocking
display-projection follow-up, with no Concept identity/indexing redesign.

## Evidence and boundaries

The worker reports 38/38 focused app/fee/workflow checks, 4/4 selected SDK checks,
one independently owned/pruned/dynamic-port chain workflow and static build.
The parent separately reports 37/37 app+fee checks on the final source. These
are attributed execution evidence, not tests rerun by this reviewer.

The diff introduces no Core/ABI/manifest/dependency changes, native dialogs or
focus calls, public transaction/payment path, static sponsor/faucet/demo-key
dependency, or reinterpretation of legacy tags. Earlier static/carrier and
signed lifecycle boundaries are not modified by this closure patch. No browser,
RPC, suite, build, source edit or nested agent was used during this re-review;
only this requested ignored report was written. Earlier production/MetaMask/
paid-storage exclusions remain in force.
