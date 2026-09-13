# B paid-consumer parity review — 2026-09-13

Read-only independent source/spec review of the seven-file dirty patch in `/Users/james/Code/EFS/planning-warroom-b-run`, HEAD/base `ac37e91f880e9905713863a568b922a3b73130af`. Compared with Task 1 of `/tmp/efs-b-paid-parity-plan-20260913.md`, planning/main's `paid-read-parity-next-gate.md`, and its current `sdk-fixture.md` paid-slice appendix. Paths/lines below are relative to `Reviews/2026-09-12-efs-path-decision/lab-b/` and describe the initially paused patch.

## Findings

**Important — existing extra-placement negatives now fail for the wrong reason.** `test/JoinedConsumer.t.sol:498-502`: adding/removing B's placement advances the frontier to 13/14 while eA/eB retain basis 12. The new `src/JoinedConsumer.sol:544` check necessarily emits `BasisMismatch` before the expected `PlacementWindow`, so these tests no longer reach the duplicate/tombstone window branch. Keep a distinct stale-basis assertion, but update the expectations to the current frontier for the extra-placement/tombstone assertions. Do not weaken or remove the new basis check.

**Important — missing-Pair regression expects a superseded error.** `test/JoinedConsumer.t.sol:621`, with `test/FaultyReads.sol:58`: `MISSING_PAIR` returns zero firstAdmission as well as absent Type/body. `_boundedRecord` at `src/JoinedConsumer.sol:634` now rejects this as `RecordAdmissionBounds`, before `PairShape`. The test therefore fails rather than confirming its intended missing-Pair behavior. Either explicitly assert missing-record rejection by the new admission-bound error and add an independently focused nonzero-admission/bad-Pair-shape fault, or keep the shape fault's real admission ordinal so its existing assertion remains focused. Do not mask the failure with a generic revert assertion.

**Minor — wrapping regression does not exercise the wrap-to-zero acceptance case.** `test/JoinedConsumer.t.sol:586-587` sets the admission's prior revision to uint32 max but leaves selected revision 2. Even an erroneous unchecked uint32 addition would reject 0 != 2. Source line 491 correctly widens both sides to uint64, so this is a test-strength issue, not a discovered acceptance bug. A targeted placement reply with revision 0 and prior revision max would test wrap rejection without conflicting with the selected expected-revision gate.

No Critical findings. The two Important items were promptly sent to root; root owns execution and any corrective patch.

## Verified scope and behavior

- `Expect` appends exactly `uint32 expectedRevision` after `uint64 basisAdmission`; `Selection`, `Placement`, `PaidResult`, and their commitment encodings are unchanged. The runner consumes the rebuilt artifact ABI, not an old hand-written paid signature.
- Gate schema requires an own mandatory field, canonical decimal string, nonzero uint32 range, and exact A_FIRST=`2` / B_FIRST=`1`; it also cross-checks independent ordinal fields. Both runner input mirrors specify constants, and controller-supplied objects flow into all four paid calls without revision defaults or reply-derived values. Missing old fields fail schema validation.
- Shared `_select`/`_closure` enforce exact selected revision and all four Record admission bounds. Shared `_admittedBy` enforces nonzero/basis-bounded selected and placement admissions; reconstructs HEAD/File/zero-role or FOLDER/folder/name through existing ordinal → position → coordinates getters; preserves author/target/kind/withdrawn/publication-range/proof-category checks; requires widened prior-CAS + 1; and rejects imported publications. A1 placement publication remains exact.
- Lists check cursor basis, generation, epoch, Core, scope and B's actual packed-principal Lens hash. Existing COMPLETE/unmutated/ended/exact-one checks remain, with no duplicate coverage call or historical resolver. The Core getter has the verified existing bytes32 ABI and returns the Ledger runtime hash. No Ledger/index/Lens/schema/storage changes, runtime masks, source-proof implementation or universal signature-validity claim were introduced.
- Positive real-reader point/list checks cover both Lens orders. New forwarding faults hit point selection versus placement before content selection as intended; all four closure records and signed/native imported categories are covered. Cursor faults mutate one context field at a time. Except for the wrapping limitation above, the new source-level fault assertions correspond to their intended checks.

## Verdict and evidence boundary

**Not yet safe to seal this exact paused patch for independently pinned measurement:** resolve the two Important test regressions and obtain root's focused/full Forge and Node GREEN evidence. After those targeted corrections, no additional consumer/spec blocker was found to proceeding to independently prepared source/artifact/runtime/input pins and a fresh bounded run. This is not production approval, Core adoption, authenticated state proof, portability or rollback qualification, or permission to reuse old paid costs.

I launched no compiler, Forge, Anvil, or commits. `git diff --check` was clean. Root reported seven intended old-source runtime RED failures; I did not independently execute or verify those logs. Current runtime sizes and GREEN results remain root-owned evidence, not claims established by this read-only review.

## Targeted follow-up — supersedes the initial hold

Rechecked only returned test/fault fixes; consumer and runner were unchanged. Both Important findings are closed in source: `test/JoinedConsumer.t.sol:499-504` supplies bases 13/14 for duplicate/tombstone window assertions, retaining the explicit stale-12 assertion at line 506; line 630 now specifically expects `RecordAdmissionBounds` for the realistically absent Pair. This preserves fail-closed missing-record behavior without a generic revert mask; no separate Pair-shape fault is required to close this absent-record regression.

The Minor wrapping gap is also closed: `test/FaultyReads.sol:125,150` returns selected/placement revision zero while admission prior revision remains uint32 max. Test lines 589-596 separately reach the widened admission-revision guard. The point-only zero expectation intentionally isolates that guard; it does not weaken the canonical controller schema. Placement reaches its guard before content selection.

Updated verdict: **ready to proceed to independently pinned measurement after root verifies focused/full Forge, Node and deployable runtime-size evidence.** No open Critical/Important/Minor finding remains from this bounded review. Root reports the first full run had exactly the predicted two failures and 57 passes; GREEN2 is root-operated and pending at this follow-up. No production approval or old-cost reuse is implied.
