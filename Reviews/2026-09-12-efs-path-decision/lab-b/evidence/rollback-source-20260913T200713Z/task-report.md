# Task 1 report — B late-index rollback fixture

## Current stage

**GREEN READY; root execution pending.** Root observed the intended runtime RED, after which the single reviewed post-`super` poison branch was enabled. No compiler, Forge, RPC, Anvil, commit, or push was run by this worker.

Base inspected: `cbadc00e3a96cdcd76a988fbd07f94cce4ad8f85`.

## Changed files

- `Reviews/2026-09-12-efs-path-decision/lab-b/src/IndexModule.sol`: behavior-preserving `external` → `public virtual` on `onAdmission`; caller guard and body unchanged.
- `Reviews/2026-09-12-efs-path-decision/lab-b/test/MatchedRollback.t.sol`: test-only derived fixture and four focused tests.
- This report only.

The paid runner, consumer, Ledger, storage layout, and frozen measured packet are unchanged.

## Root RED evidence and GREEN command

From `Reviews/2026-09-12-efs-path-decision/lab-b`:

```sh
forge test --match-path test/MatchedRollback.t.sol -vvv
```

Root ran the focused command at 20:05:44–20:05:50 UTC. Retained log: `/tmp/efs-b-rollback-build-20260913.Ps480X/red-focused.log`. Result: 3 pass, 1 fail. Only `MatchedRollbackTest.test_scale_six_complete_a1_late_tag_refusal_rolls_back_full_prefix` failed with `late market poison must refuse after normal maintenance`. The trace reached normal index maintenance and Ledger returned `(2,4)`, excluding compile, setup, signature, authorization, or early-index failure. `red.json` pins source hashes/compiler and records that source was unchanged during the run.

This proves the test catches removal/omission of the final poison refusal. After that observation, the fixture gained only the prescribed branch: after `super`, require a nonempty vector, nonzero poison, final kind 3, and exact final binding key, then revert `E_LATE_INDEX(poisonBindingKey)`.

Root GREEN should rerun:

```sh
forge test --match-path test/MatchedRollback.t.sol -vvv
```

The RED run observed the scale-7 mandatory refusal, zero-poison success calibration, and unauthorized direct-callback tests passing. Full-suite and post-fix focused results remain unclaimed until root reports them.

## Coverage staged

- Fresh early-attached module (`attachedFrom=1`) for each A1 configuration and a newly signed intent committing its address/codehash.
- Five-action signed A1: File, Quote, HEAD, FOLDER, final market TAG.
- Exact 68-byte `E_REJECTED(1, QUOTE_J)` after scale 6→7 with recomputed Quote id and HEAD target.
- Exact 132-byte nested `E_INDEX(E_LATE_INDEX(tagBindingKey))` expectation for valid scale 6.
- S0 literals `(3,3,0,1)`, nonce 0, frontier/publication `3/1`, no gap, all five families COMPLETE `(2,1,3)`.
- Refusal rollback inventory: evidence/source evidence/retry key, admissions 4–8, File/Quote, three heads/positions/binding ordinals, existing Item/Pair bodies and occurrences, every touched posting head and `postingWord(key,0)`.
- Calibration literals `(8,4,3,2)`, nonce 1, admissions 4–8, revisions/binding ordinals, evidence/publication 2, frontier `8/2`, COMPLETE `(2,1,8)`, scope/history/backlink contents and packed words.
- Direct callback still returns the exact Ledger-only error.

## Concerns / next gate

The final guarded branch is source-staged but has not been compiled by this worker. Root must now run focused GREEN and the existing full suite before publication.

Independent runtime/constructor and mined paid rollback manifests remain later work; these Forge tests do not create RPC-observed rollback evidence.

## Coordinator execution — 20:07 UTC

Root ran the frozen GREEN source from20:07:13 through20:07:39 using the same
offline compiler/configuration and guarded lease. Focused4/4, full63/63 Forge,
build --sizes exit0 and Node26 42/42 passed. Source hashes remained unchanged.
Logs and exact commands: /tmp/efs-b-rollback-build-20260913.Ps480X/green.json,
green-focused.log, green-full.log, green-sizes.log, green-node.log.
Pre-existing shadow/cast lints and oversized Foundry-only test-harness warnings
are retained; no warning-free or production-harness claim. No Anvil ran.
Source committed locally at8ddd04c; independent changed-range review pending.
