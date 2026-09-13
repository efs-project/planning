# Independent inherited-immutable review — 2026-09-13

Scope: oracle `600b1e8..5a16023`, the entire two-file delta, against Task 2 of `/tmp/efs-b-paid-rollback-plan-20260913.md`. Read-only source review and one tiny hand-authored Node probe; no compiler, RPC, chain, suite rerun, repository changes, or subagents.

## Verdict

**Spec: one narrow correction required. Quality: otherwise sound and suitably bounded.** No incorrect runtime was demonstrated for valid pinned compiler artifacts. Do not claim complete rejection of duplicate/malformed ancestry, or unconditional Task 2 completion, until the finding below is closed. This is not a production or paid-rollback approval.

## Finding

**Minor — duplicate immediate bases are accepted.** `Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-runtime-b.mjs:43–46` traverses each immediate reference, but the global `reached` shortcut at line 39 silently accepts a repeated reference within the same contract. A hand-authored target with `baseContracts=[20,20]`, `linearizedBaseContracts=[10,20]`, and a valid base 20 returned a runtime successfully. Task 2 explicitly requires rejection of duplicate bases; the existing duplicate-contract-ID and duplicate-linearization tests do not exercise this case. This does not alter the substituted words in the example, but weakens the advertised fail-closed input contract.

Smallest correction: track immediate base IDs separately for each visited contract and reject a duplicate before recursion. Keep the global reached set: shared ancestors reached through different parents are a legitimate diamond. Add one negative test duplicating an immediate reference, and retain the diamond positive test.

## Confirmed properties

The optional source map confines collection to the exact target's reachable ancestry by numeric AST IDs; source-name mismatches, conflicting target units, duplicate contract IDs, invalid/rootless/duplicate target linearization, missing bases, cycles, and graph/linearization-set disagreement fail. Interfaces with no immutables still have to be supplied. Unrelated same-named immutable declarations are excluded; inherited duplicate names or declaration IDs fail instead of being guessed.

The unchanged substitution path still requires exact declaration/value/reference correspondence, bytes32 values, nonempty reference lists, bounded word-sized offsets, no overlapping substitutions, zero compiler placeholders, and no linked libraries. It copies complete words into a fresh byte buffer and hashes the entire resulting runtime; no runtime masks, RPC-derived expected words, or candidate execution answers were introduced.

Omitting `sourceAsts` retains the original exact-contract behavior. The existing 17-target caller does not opt in accidentally. Tests add literal multi-source runtime bytes, input immutability, a valid diamond, ancestry refusals, and the real inherited Index fixture with independently supplied constructor words. The real fixture checks inherited ledger/admin/attachedFrom plus poisonBindingKey, and refuses a missing interface AST.

Root reports two intended RED failures and an artifact-enabled 274/274 full Node pass, with no skips. These suite results were not independently rerun; source inspection supports their intended coverage, except the explicit missing negative case above.

## Follow-up — oracle `3dfd975`

Reviewed the complete `5a16023..3dfd975` delta. The sole finding is **closed**: `runtimeContracts` now allocates `directBaseIds` within each contract visit, rejects a repeated immediate base ID before recursion, and retains the global reached set for valid diamond ancestry. The added negative case duplicates the actual immediate reference and asserts an ancestry refusal. No substitution, legacy-call, or other runtime behavior changed.

Root reports that the new negative test first failed with “Missing expected exception,” followed by all 275 artifact-enabled Node tests passing and clean whitespace. No tests were rerun for this follow-up.

**Final source verdict: spec PASS; quality PASS; no remaining blocker for independent preparation to use this helper with pinned compiler artifacts and independently derived immutable values.** Original review history is preserved above. This does not itself validate a prepared packet, chain execution, or rollback claim.
