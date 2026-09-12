# Full-C0 direct application: measured result

2026-09-11 · v2 PM · disposable experiment, not protocol adoption

**Result:** under the pinned helper, the direct candidate preserves the matched successful full-C0 state and cuts the 7-leaf create receipt by 13.13%. The admission library shrinks by 4,560 bytes. Late failed admissions become more expensive, and early cache failure now takes precedence over a later reference/CAS fault. Arbitrary observing helpers are explicitly outside the parity claim.

The controlling plan lives on planning/main at `85c0f91`, `Reviews/2026-09-11-efs21-direct-apply-plan.md`; this code branch is not a normative design fork. Control: `e605fc9fb173d195960e41247ca270c074d5060c`. Candidate source is exactly the two production-file patches retained in the candidate JSON; their hashes are checked against disk by the comparison test.

## Actual receipts

Identical new runner bytes, separate sequential fresh worlds, ordinary limits. These are mined receipt gas values, not estimates. Each arm retains all 95 raw transactions, calldata, receipts and compiler/source/support/runtime pins in [control](direct-apply-control.json) and [candidate](direct-apply-candidate.json).

| Workload | Control gas | Direct gas | Reduction |
|---|---:|---:|---:|
| First tag | 2,565,693 | 2,308,007 | 10.04% |
| Steady tag | 2,324,104 | 2,080,617 | 10.48% |
| Binding rebind | 2,062,226 | 1,839,258 | 10.81% |
| Separate create chunk staging | 149,369 | 149,369 | 0 |
| 7-leaf create, 41 bytes | 6,622,789 | 5,753,318 | 13.13% |
| Separate edit chunk staging | 149,381 | 149,381 | 0 |
| 3-leaf edit, 41 bytes | 3,313,533 | 2,957,568 | 10.74% |
| Direct-author partial setup | 1,149,603 | 1,041,034 | 9.44% |
| Routed mixed ACTIVE/fresh | 1,601,704 | 1,473,028 | 8.03% |
| Fresh-authorized exact ACTIVE retry | 644,669 | 643,747 | 0.14% |
| Old-signature rejection | 367,094 | 367,094 | 0 |
| Multiple Type groups | 2,636,266 | 2,449,079 | 7.10% |
| Existing Types, fresh envelope | 966,144 | 903,264 | 6.51% |
| Late reference rejection after small Type | 684,146 | 1,367,166 | **99.84% more** |
| Oversized cache then invalid reference | 8,749,191 | 12,081,802 | **38.09% more** |
| Oversized cache then invalid CAS | 8,865,031 | 12,071,347 | **36.17% more** |

Candidate calldata intrinsic gas is 12 gas higher for first tag, steady tag and partial setup because signed bytes differ; all other listed intrinsic deltas are zero. The raw receipts retain these differences. Setup/deployment, staging, successful operations and intended failures remain separate; no summed end-user cost quietly drops setup or failure gas.

`UpgradeAdmissionLibrary`: **24,481 → 19,921 runtime bytes**, leaving 4,655 bytes below EIP-170. Other measured component runtime lengths remain unchanged. That is room for a future experiment, not evidence that physical indexes, richer validation or full Lens integration are implemented.

## What matched, and what did not

The final complete inventories match: 82 Records, 64 Envelopes, 22 Types, 1 Principal, 87 Admissions, 65 Batches, 259 Posting keys and 22 Binding keys. Comparison includes all rows, ordered posting words, lifecycle, raw Binding history and receipt-basis Lens choices. Record/Envelope IDs are independently reconstructed. The only inventory normalization is Batch authority codehash, individually checked against each world's retained runtime; receipt read-basis execution-set IDs are separately checked against each world's authenticated execution set before comparison. Block numbers remain identical; block hashes are retained, not equated between worlds.

All 22 Type cache pointers, code bytes, CREATE addresses/order and helper nonce agree. The newly added two-group declaration creates three Types; a fresh-envelope repeat of an existing group creates none. Failed declarations leave the new Type/Record/Envelope/occurrence points absent, every predicted cache address empty, and Core counts, all prior cache data, helper CREATE nonce and actual Files principal authorization nonce unchanged. Full final inventory equality also catches leaked postings/Binding rows.

Exact allowlisted failure-order differences:

- Small Type then invalid reference: both `ReferenceUnproved(1,0)`, selector `0x07d1a975`; direct application performs and rolls back the earlier cache work.
- Small member + 24,960-byte compiled cache, then invalid reference: control `ReferenceUnproved(1,0)`; candidate `HelperDeploy()`, selector `0xb780bdf9`.
- The same early cache ceiling, then stale CAS: control `ErrCasRevision(key,99,0)`, selector `0xb7abcffb`; candidate `HelperDeploy()`.
- Test-only deliberately failing cache helper followed by unknown Type: control `E_UNKNOWN_TYPE(2)` (`0x7a83b66b`); candidate `HelperDeploy()`. The helper's custom failure remains wrapped by the unchanged preparation interface.

The parser-valid large-Type cache limitation remains **open**: 64 legal BOOL fields with long names compile to 24,960 bytes, exceeding the unchanged single-cache ceiling of 24,575. This experiment neither reduces the schema language nor repairs its representation. The intentionally-red separate large-Type chain target was not reclassified as passing; the present runner uses the limitation as a compound-fault fixture.

## Observer and reentrancy boundary

`DirectApply.t.sol` uses a test-only wrapper around the real preparation/parser and cache deployment logic:

- A later preparation callback can see an earlier provisional Record while persisted counts still describe entry state. An observer that rejects that condition succeeds under journal preparation but rejects the direct candidate with `ObservedProvisionalRecord()` (`0x194c0b0e`). This disproves universal helper equivalence.
- Both strategies expose provisional rows with old counts during a cache-deployment callback. The original journal is therefore **not** universal isolation: replay itself crosses that boundary.
- A callback that performs a nested successful mutating admission causes the enclosing admission to reject with exact `Panic(1)` and rolls back nested and outer Core/helper effects in both arms. The candidate's count/init prestate assertion detects the changed staged basis; the journal also has replay/prestate assertions. This is a tested counterexample boundary, not a general reentrancy policy or support for arbitrary callbacks.

The production helper's prepare/compile methods remain pure and argument-driven; `deployCache` remains an inert-code CREATE operation. No helper, authorization, reader, router, cache representation, physical index or native-profile production source changed.

## Test accounting and reproducibility

Root's fresh unchanged control suite passed 209/209 before dispatch. Before production edits this task ran the new comparison-boundary tests against that control: 11/11 passed (6 new tests + 5 inherited fixtures), then the direct attempted-write target failed as intended: **0 attempted write slots**, while demanding a positive number.

Candidate `forge test --summary`: **206 passed, 0 failed, 0 skipped**. The count is not a claim that 209 baseline tests passed unchanged:

| Category | Executions |
|---|---:|
| Original tests with unchanged assertions | 180 |
| Original tests using narrowly adapted `reject()` | 14 |
| Original journal-internal tests excluded from candidate compilation | 15 (7 StateJournal + 8 JournalAllocation) |
| New direct-boundary tests | 7 |
| Additional inherited fixture executions in DirectApplyTest | 5 |

Thus 194 original executions plus 12 new-suite executions = 206. The excluded files remain byte-for-byte unchanged at the baseline. Only the attempted-SSTORE condition in the existing shared rejection helper was adapted: ordinary exact error bytes and complete final-state assertions remain; explicit no-write checks survive for early guards, carriage rejection, all-ACTIVE admission and ordinary reads. The mixed-retry resource/public-behavior test remains. The original reference-order, duplicate/ACTIVE, repeated Binding, withdrawal/revival and tombstone/rebind fixtures all pass.

The new late-failure target passes on direct application with **66 attempted Core write slots**, exact `E_UNKNOWN_TYPE(2)` and complete rollback. Other recorded test-only counts: injected cache failure 24; observer refusal 42; reentrant outer/nested rollback 89 versus 81 under control. These are Forge accessed-write-slot observations, not opcode traces or production receipt gas.

Commands, from the C0 directory unless specified:

```sh
# Before production edits; test-only strategy expectation selects control.
EFS_DIRECT_APPLY=false forge test --match-contract DirectApplyTest --no-match-test testLateFailureAttemptsWritesButRollsBack -vv
forge test --match-contract DirectApplyTest --match-test testLateFailureAttemptsWritesButRollsBack -vv # expected RED on control
# Candidate
forge test --match-contract DirectApplyTest -vv
forge test --match-contract StateAcceptanceTest --summary
forge test --summary
# From vault root, in each fresh arm before/after the two production edits:
node Reviews/2026-09-11-efs21-pragmatic/scripts/direct-apply-benchmark.mjs control
node Reviews/2026-09-11-efs21-pragmatic/scripts/direct-apply-benchmark.mjs candidate
node --test Reviews/2026-09-11-efs21-pragmatic/test/direct-apply-comparison.test.mjs
```

The offline receipt comparison passes **8/8**. It checks runner/support equality, only the two authorized changed production hashes, compiler settings/binary, exact successful inventories and effects, authority/cache nonce behavior, allowlisted errors, transaction/raw/calldata/receipt pins, ceilings and post-return cleanup. The receipt runner refuses to overwrite retained evidence. Its keccak256 is `0x6d39d60840418c7fabffe7108dafc0fe56dabb3ee97a8a965e09252fe8182aa7`.

## Limits, source pins and cleanup

Solidity `0.8.30+commit.73712a01`, optimizer 200, via-IR, Cancun; Forge/Anvil 1.7.1 commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8`, Node v26.0.0, ethers 6.15.0. Ordinary 24,576-byte runtime and 16,777,216 transaction-gas ceilings; maximum retained receipt is 12,081,802 gas. No step/SSTORE trace, disabled code-size limit, public RPC, funds, persistent new world, native/browser changes or historical evidence overwrite. Forge fixture aggregate test gas is not a mined single-operation claim.

The production dispatcher is named `applyRow`: Solidity 0.8.30 reserves the plan's literal identifier `apply`. This is the only mechanical plan correction. The pre-existing `C0Request.prepare` pure-mutability warning remains; no unrelated warning cleanup was included.

Both evidence objects capture cleanup **after** managed return: control 34,350 ms/PID 96004/exit 0, candidate 33,564 ms/PID 96695/exit 0; both `stopped=true`, `cacheRemoved=true`, and isolated build removed. Exact temporary paths are retained in JSON and verified absent. The watchdog is 900,000 ms per world; neither approached it. Free disk was 282 GiB at the final check, above the 20 GiB stop threshold. The two pre-existing root/Fable Anvil processes remain untouched. No merge or push by the implementer; fresh review and root verification still precede publication.
