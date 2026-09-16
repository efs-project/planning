# Core closeout: paid query progress and retained-origin joins

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Contracts can finish a paginated folder query despite unrelated Realm writes, without mixing old and new File revisions or forging a complete negative result.

**Architecture:** Keep the query's origin admission A. Prove the selected folder inventory has not changed using exact scope mutation admissions. Resolve File HEAD and tags at A using already-retained binding history. A caller-owned accumulator authenticates the page prefix. No new persistent snapshot tree, writer-side propagation to every folder, or global write lock.

**Tech Stack:** Solidity0.8.30, optimizer200, via-IR, Cancun; Foundry and a bounded independent Node paid-transaction runner.

**Spec:** [[core-design-audit-20260915]], A4 and packet4. Disposable core feasibility implementation, not a permanent ABI ruling. Execute after the reviewed ordered-acceptance repair.

## Global Constraints

- Existing compact prototype worktree only; one implementation/build/chain writer. Preserve the owner demo. No production repo, public deployment, package installation, Fable, unbounded logs or cap inflation. New Anvil worlds must have run-specific bounded history and be closed after evidence.
- Retain runtime24,576/initcode49,152; ordinary paid allowance15M and hard16,777,216 ceiling. Do not silently shrink filename, Type, Lens, tag or privacy goals.
- Existing strict point reads and SDK fixed-block `ReadContext` remain supported. Do not quietly turn a frozen context into a floating-current one. The new continuation guarantee must state both origin and observed-current bases.
- Execution identity, module attachment/code, registry epoch and index generation remain exact. Coverage must be COMPLETE from1 through actual current C. Missing history/metadata stays UNKNOWN, never negative evidence.
- Historical query completion is not authorization for a current mutation. Current effects independently validate their current dependency read-set in the same transaction. A stored `complete` flag is never a timeless current-absence oracle.

## Task 1: Local folder versions, historical joins and owned continuation

**Files:** `test/FilesLiveIndex.sol`, `src/LensReader.sol`, `test/FilesPageReader.sol`, `test/CoreReadCostAudit.t.sol`; new bounded paid accumulator and focused fixtures/runner. Avoid browser UI changes. Evidence in `core-closeout-query-20260915/`.

### Supported semantics

- Each selected `(principal,FOLDER,folder)` tracks its most recent mutation admission, including overwrite without membership change, tombstone, swap-removal and write-then-restore. Unselected authors and other folders do not invalidate the query.
- Continuation is allowed at current C>=A only if every selected scope's last change is <=A and all execution/coverage pins still match. This proves the dense candidate inventory and its masking heads equal the origin inventory.
- HEAD and stable/revision tags resolve at A, not C. If a current head's admission is <=A, use it directly; otherwise binary-search existing retained history for the last change <=A. Earlier removal masks; missing historical coverage cannot fall through to a lower-priority author. Revision tags refer to the historically selected revision.
- A start with empty continuation requires A==C unless it explicitly initializes every nested origin pin to A. Prefer the simple A==C start law. A resumed nested Lens cursor never silently takes C as its new origin.
- Immutable Name/Directory/selected-header existence is qualified at A. Later withdrawal of an occurrence does not erase valid retained data.
- Relevant selected-folder mutations still invalidate this fast profile. That limitation is explicit; it does not promise completion under continual selected-folder mutation. Evaluate the retained-inventory snapshot alternative below without claiming it is fast-live pagination.

### Implementation and checks

- [ ] Capture RED for the existing unrelated-publication continuation failure, then change A4 to require progress with unchanged selected folder inventory.
- [ ] Maintain exact folder last-mutation admissions in the separate required Files index. Add a protected Lens continuation-basis hook, strict by default and relaxed only for the guarded FOLDER profile. Preserve all scope/order/generation/query/execution checks. Legacy address APIs remain strict or get the identical guard, never a bypass.
  - At replay checkpoint7af2695, composed ProfiledFilesIndex has only58runtime bytes spare. First coherent fit candidate: move its existing dense folder arrays/offset maintenance into one constructor-created, fixed `FilesScopeState` companion, with mutation stamps beside that state. Only its exact index may write it; no admin setter, arbitrary effect ingress, delegatecall or independent coverage. Index's shared live/replay `_foldEffect` forwards every FOLDER BIND/UNBIND, even unchanged membership, and retains all inherited folds/final checks. Failed companion/later/final work reverts the whole transaction. Public index live-count/item getters remain the facade.
  - Keep semantic scope recipe/stamp meaning separate from per-deployment companion address/codehash. Declare split physical storage and verify actual companion ledger/writer/code pins in replacement and readers; preserve genesis/current coverage qualification. Measure actual composed runtime/initcode and added calls before claiming the split fits. If it loses, report the exact deficit before another extraction.
  - Check every selected principal scope on each continuation, including already-consumed, empty and terminal scopes; zero stamp is meaningful only with complete required coverage. Do not only guard the remaining suffix. Remove the stale pre-replay coverage comment in IndexModule while updating these semantics.
- [ ] Add explicit `resolvePrincipalsAt` and no-tiebreak historical reducers. Reuse packed binding history and exact existing ordered/tombstone/conflict semantics. Require current history coverage and asOf<=current. Keep current point-resolution APIs unchanged.
  - Existing history UNKNOWN and point ABSENT both encode0. Do not forward one vocabulary as the other: an unqualified historical reducer must revert into the existing Files unavailable catch path, not return a successful point ABSENT. Proven history H_NONE may become point ABSENT; H_FOUND must preserve live/mask polarity. Missing higher-priority history never falls through.
- [ ] Use historical HEAD/tag joins and origin-qualified immutable headers in `FilesPageReader`. Unknown rows survive filtering and prevent negative proofs. Keep metrics honest: inventory hydrations are not total historical probes or RPC bytes.
- [ ] Add a disposable accumulator that owns its caller/session, query parameters, origin, exact next cursor, counts and rolling result commitment. Start only at an empty prefix. `step` never accepts a caller-supplied suffix cursor. Require strict progress, fixed raw total, cumulative bounds and exact complete exhaustion. Reject foreign sessions, restarts, parameter/caller changes and forged suffixes. Retain unknown rows; cumulative zero only means absence when the owned origin scan fully completes with all required qualifications.
- [ ] Run an actual paid multi-transaction query with an unrelated write between every page. Repeat with unselected-author writes to the same folder/HEAD/tag. Finish with original A and compare exact rows to an independent raw-history reducer.
- [ ] Mutate selected HEADs and tags after page1, including already-returned and later rows: result stays the consistent A snapshot. Cover higher-priority tombstone, first head created after A, revision change followed by a tag on only the new revision, and diagnostic conflict selection.
- [ ] Selected-folder overwrite/mask/swap-remove/write-restore invalidates; changes to selected author's different folder do not. Index detach/gap, epoch/execution change and missing history refuse or remain UNKNOWN. An old completed negative query cannot authorize a current effect after relevant changes.
- [ ] Measure whole paid receipts for bounded P=1/8/64 profiles and deep historical joins, distinguishing candidate/selector/history bounds. Do not assume all independent maxima compose within15M. Select explicit feasible per-call work combinations or add an honest continuation work budget; never turn resource exhaustion into absence.
- [ ] Evaluate a separate retained-inventory query for continuous selected-folder mutation: pin origin lengths for append-only scope inventories, resolve placement/masks/HEAD/tags all at A, authenticate lengths/prefix in the accumulator. If it fits a bounded extension, implement one churn fixture. Otherwise report exact implementation/economic gap; do not describe the fast unchanged-folder profile as closing this stronger guarantee.
- [ ] Run focused Lens, Files, paid continuation and bytework regression checks; capture source/runtime sizes and paid evidence. Commit exact task files and return a report for independent review. Parent publishes; no broad suite, UI polish or production scaffold.

## Task 2: One bounded selection-head cost experiment

**Added September16 after the reviewed Task1 measurements.** This task does not reopen origin correctness or add a broad query engine. Run after reviewed SDK transport/read-set work and before final runtime/proof/resource pins; the head projection is independent of later Type/live/tag semantics. The parent used the writing-plans workflow and a read-only Astra High source preflight to select this smaller candidate instead of the initially proposed multi-row join batch.

**Files:** narrow additive view in `src/Ledger.sol`; one shared internal primitive and its selection-only callers in `src/LensReader.sol`; focused `test/SelectionHead.t.sol` and a test-only raw-getter Lens control; bounded `script/core-selection-head-cost.mjs` and evidence in `core-closeout-query-20260915/selection-head/`. Existing raw getters, snapshot/guard codecs, Files index and storage roots remain unchanged.

**Interfaces:** add `selectionHead(bytes32 key) external view returns(uint8 state,uint32 revision,uint64 admissionOrdinal,bytes32 target)`. The target is a selection projection, meaningful only for live state1, not a raw storage observation. Lens consumes this through an internal virtual `_selectionHead(bytes32 key)` for its current/historical selection paths. A test-only control overrides that internal primitive to obtain the same projection via old `head`; it must not add a production mode switch.

- [ ] Write a focused absence/live/mask/history/projection control before implementation. Existing `head` and `headSnapshot` must retain their complete raw fields/hash, including injected malformed-state diagnostics. New getter is initially absent, so its ABI call fails; record the exact RED. Do not modify raw getters to manufacture the new contract.
- [ ] Implement the projection without reading target unless state1. The existing packing supplies the following bounded operation, with the existing `GUARD` width, no new storage and no low-width truncation before metadata extraction:

  ```solidity
  HeadRow storage h = _head[key];
  uint256 m = h.meta;
  state = uint8(m);
  revision = uint32(m >> 8);
  admissionOrdinal = uint64((m >> 40) & GUARD);
  if (state == 1) target = h.target;
  ```

- [ ] Route only the five current selection call sites (`_headAt`, `_scan`, `_masked`, `_resolve`, `_conflicts` at the reviewed source) through `_selectionHead`. Preserve raw Lens forwarding, SDK guard/CAS construction, publication `headSnapshot`, independent raw decoders and physical layout. Pass state/revision/admission unchanged, including unexpected state values; no new absent-on-error rule. The helper's default forwards to the new Ledger view; the test control uses `head` and projects its target only for state1.
- [ ] Keep all current execution/layout/attachment/coverage/owner/cursor checks. A newer tombstone must still consult historical state at A; metadata is always read. Do not skip history or fall through after unknown higher-priority history. Compare exact result fields on absent/live/masked/conflicting states, first HEAD after A, post-A overwrite/removal, retained withdrawal, and selected/unselected scope mutation. Do not turn this into a generic raw-storage decoder or change the supported Lens width.
- [ ] First measure actual deployable runtime and constructor-inclusive initcode under unchanged compiler/settings. The last Ledger checkpoint has1,142runtime bytes spare, but the preceding carrier experiment can change that. If the coherent small addition does not fit, retain the measured refusal and stop this candidate; no second extraction, cap increase or unrelated byte-golf in this task. New runtime means a new execution pin even though layout and raw ABI remain unchanged. Preserve old owner-demo source/SDK support; deploy only disposable fixtures.
- [ ] Measure matched separate paid transactions using the same actual Ledger/index/state and otherwise equivalent old-getter/new-getter Lens/page-reader/owning-accumulator stacks. Never warm the second arm by measuring both in one transaction. Use explicit P1/8/64 owner-last profiles, two candidates, B1 pages to owned exhaustion. Start both arms at the same A, then apply64later HEAD/stable-tag/revision-tag changes to the second candidate before completing at C. Compare full row ABI/qualifications and independent raw-history expectations, raw totals, unknowns and final absence. Reader-specific query/commitment domains are recomputed, not asserted identical across addresses. Add one positive-tag result control to expose output costs. Preserve refused receipts; this finite matrix replaces a duplicate full157-transaction origin campaign.
- [ ] Include first page, ordinary same-origin continuation (a separate no-churn control), historical continuation, total query/session deployment and actual reader sizes. No invented cold-slot gas allocation: report whole receipts and the count/type of avoided operations. Source inspection predicts up to256head getters for a64-author negative joined row, with mostly distinct metadata/target keys; the experiment measures savings, not a claim that all head reads disappear.
- [ ] Before running, use the following **experiment retention criterion**, not a permanent user-price requirement: at least10% lower matched P64 ordinary and historical B1 continuation and complete two-page query totals; no greater than5% P1/P8 whole-step regression; identical qualified outcomes and ordinary caps. Report additional deployment cost/amortization separately. If this one candidate fails correctness, fit or materiality, preserve negative evidence and the simpler selected path rather than rolling into batching or a storage rewrite. A passing reduction does not make the remaining64-author cost a practical default.
- [ ] Run focused origin/history/retained/Files read and raw-head/guard parity controls once, plus one actual SDK joined compatibility check. Preserve all warning diagnostics, exact source/receipt/compiler pins and current execution identities. Self-review, exact task commit/report and independent review; no UI changes, production repo or public transaction.

This experiment leaves genuine principal-by-position work, Name/header interpretation, retained-prefix discovery, lifetime churn and complete current-guard cost intact. Those remain in the final feasible/refused/practical table. The proposed broader join batch is not also authorized by this task.

## Remaining accounting

Historical joins are worst `O(candidates × principals × joins × log history)`; unchanged heads have a constant-time fast path. A64-principal negative query may require many paid calls. Exact scope versions add one permanent slot per new selected scope and rewrites thereafter; accumulator session storage is also priced. Retained-inventory snapshots trade progress during relevant churn for lifetime-inventory scan work. None of those costs may be hidden behind a COMPLETE label.

Live contract-backed Files, complete generic index/replay, Type/authority closure and real-provider fees remain separate master packets. This work closes a specific query liveness failure, not the whole prototype.
