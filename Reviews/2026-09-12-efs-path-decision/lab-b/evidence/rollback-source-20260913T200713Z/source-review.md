# B rollback supplement: source/spec and quality review

**Range:** `cbadc00..8ddd04c`, both changed files in full. Actual current file hashes match root's GREEN manifest. Reviewed task brief/report, published rollback control, complete diff and relevant inherited setup/signing helpers. No builds, RPC, Anvil, repository edits or Git mutations.

**Spec verdict: PASS for the source/test task.**

**Code-quality verdict: PASS; no Critical or Important finding.** One nonblocking test-strength suggestion below. Safe to retain/publish this bounded supplement and proceed to independently pinned mined controls; not evidence that those controls already ran.

## What the implementation actually establishes

- `src/IndexModule.sol:95` changes only `external` to `public virtual`. Caller guard, storage, maintenance and coverage logic are unchanged; no Ledger, authority, paid consumer or runner delta exists.
- `test/MatchedRollback.t.sol:21-30` calls `super` internally before inspecting the fault. Empty effects are safely guarded, zero poison disables refusal, and both final BIND kind and exact binding key are required. The internal call preserves Ledger as `msg.sender`; the unauthorized empty-vector test exercises the guard before any early return.
- `_scenario/_install` attach the fresh derived module before admission1, then execute the actual Items/Pair prefix. `_signedA1` recomputes the scale-dependent body, Record identity and HEAD target; inherited signing reads the current module-address/codehash obligation and actual action hash. No stale signature or mocked read supplies success.
- The two refusal tests compare complete 68-byte mandatory and 132-byte nested late-index errors. They assert literal S0 both before and after the attempted Ledger call, without restoring a snapshot: counters, A nonce, index frontiers/coverage, existing body/occurrence rows, absent File/Quote/evidence/source/retry key/admissions, heads/positions/binding ordinals, and every touched posting head plus packed word0.
- `_assertCalibration` checks the complete literal S1 `(8,4,3,2)`, A nonce1, File4/Quote5, bindings/admissions6–8, publication2 and retained authority commitments. It verifies all five COMPLETE frontiers through8, preserved prefix lists and exact scope/history/Quote/File backlink words. This is substantially stronger than receipt-success calibration.

## Nonblocking suggestion

**Minor — selective-poison mutation coverage:** tests at `MatchedRollback.t.sol:104-125` cover matching poison and zero poison, but not a nonzero nonmatching key or a matching earlier-but-not-final effect. The present branch is correct by inspection. A future accidental broadening to “any final BIND with nonzero poison” could pass the current suite. Before reusing this fixture more broadly, add one valid A1 calibration with HEAD-key poison (HEAD is earlier, final TAG differs), requiring success. This is not needed to validate the current exact implementation's intended refusal.

## Verification and boundary

Inspected RED log: 3 pass/1 intended failure, normal callback completed, Ledger returned `(2,4)`, then the test failed its missing-refusal assertion. GREEN logs show focused 4/4, full 63/63 and Node 42/42; size stage exit 0. Derived fixture runtime is 4,433 bytes, artifact creation code 5,837 before constructor arguments. Existing lint/test-harness warnings remain.

These are Forge state-transition tests and source verification. They do not supply fixed-block RPC pre/post manifests, mined status0 gas, independent runtime/constructor pins, historical signature proof, full-Files qualification, or a fresh paid-read result. Existing paid evidence retains its own earlier source pin.
