# Whole-plan required-query source/unit review — 2026-09-14

## Verdict and scope

**PASS — the combined B+C source/unit delta is ready for exact-snapshot source publication and for implementation of the next paid experiment. No critical or important cross-task finding was identified.** This is not approval to execute a paid run, publish new prices, select/freeze an architecture, launch, or deploy production software.

Reviewed the complete two-task diff packages once, the implementation plan, source specification, accepted plan review, and both task reports/reviews. This final pass assesses the common ABI/result contract and preservation of prior obligations; it does not repeat the individual reviews' whole-dependency audit. No outside-diff product code was opened, because no new concrete integration risk required it. No compiler, test suite, Anvil, RPC, subagent, commit, push, or source modification was performed. The only write is this report.

Verified review identity with read-only Git and SHA-256 checks:

- B base `acbfaf70339b73cd03e937158dd015eb37491b21` → current HEAD `d547890e57fb0c1ba2ef4d9f8b18b519946197b8`; the range contains exactly the five planned files, the tracked worktree diff is empty, and all five current file hashes match task-1's package.
- C current HEAD `12dc73aeab4a0dc997024ccfead4070dd69b8d8b` plus the frozen three-file source/test delta; all three current hashes match task-2's package. Unrelated untracked files remain outside this review.

For the source references below, B means `lab-b/` at the pinned B experiment source, and C means `lab-c/` at the pinned C experiment source.

## Strengths and whole-plan alignment

- **One externally usable query contract.** B `src/IncomingQuotesReader.sol:14–28,71–73` and C `src/IncomingQuotesReader.sol:13–18,28–36,77–79` implement the same twelve-field Cursor, seven-field Page, names/types/order, view mutability and `incomingQuotes` call. I also independently compared the three retained compiled artifact ABIs, recursively retaining component names/types and ignoring only Solidity-internal contract type labels: all match, and each artifact exposes selector `0x9fe8fb7f`. Constants are UNKNOWN=0/PARTIAL=1/COMPLETE=2 and maximum candidate budget 64. Actual maximum-page tests assert 2,688 ABI bytes, below 4,096 (B `test/IncomingQuotes.t.sol:374–387`; C `test/IncomingQuotes.t.sol:154–161`).
- **Same retained result domain, different access paths.** B `src/IncomingQuotesReader.sol:96–117` removes reuse duplicates through first-admission identity in the scan arm; the selectively maintained first-admission family supplies that identity without candidate-body copies in the indexed arm (`src/SelectiveReferenceIndexModule.sol:58–69`). C `src/IncomingQuotesReader.sol:98–105` charges and filters fixed source headers over existing fresh-record target postings. Neither query consults a Lens/head or current occurrence count. Old-basis enumeration against the current tail preserves A1/A2/B1 and adds only A3 at the current basis (B tests `:90–175`; C tests `:53–104`).
- **The exact one-reference profile closes positional qualification without narrowing accepted C bytes.** B's shared profile check validates its one-Pair descriptor and mandatory 160-byte rule (`src/SelectiveReferenceIndexModule.sol:14–25`). C uses bounded Type metadata and two static Record fields (`src/tables/LedgerTables.sol:89–95,480–493`), not a canonical-body parser. Its real accepted trailing/noncanonical cases remain discoverable with whole-row/body reads blocked (`test/IncomingQuotes.t.sol:110–126`). Runtime pins, reciprocal attachments and the complete cursor domain remain explicit trust checks in both readers, not trust inferred from ABI compatibility.
- **Completion and continuation agree.** B `src/IncomingQuotesReader.sol:87–94,119–124` and C `src/IncomingQuotesReader.sol:68–75,108–114` bind reader identity, both instances/runtimes, realm, source/ordinal/target, basis and generation. COMPLETE requires exhausted-through-basis candidates plus adequate complete family coverage; only COMPLETE may move directly to current rawTotal. A partial future-sentinel page retains its next unexamined position. C's coverage and targeted regression tests concretely establish that distinction (`test/IncomingQuotes.t.sol:218–246`); B already uses the same COMPLETE-only cursor rule. A caller-chosen position is not proof of preceding page consumption.
- **Candidate obligations are preserved rather than normalized away.** B's original IndexModule delta is only two visibility changes, and its selective callback invokes `super.onAdmission` before extra maintenance. Rebind/unbind tests preserve existing binding backlink count/live values (`test/IncomingQuotes.t.sol:338–353`). The distinct-target 64-action callback case keeps the existing allowance (`:390–404`), without claiming its aggregate unit-test gas is one paid transaction. C changes no write path, IndexModule or table schema; legal non-Quote repeated references are filtered and charged even when rawTotal exceeds admission high-water (`test/IncomingQuotes.t.sol:130–151`). B's retained zero-occurrence test remains a B-only auxiliary (`:356–372`); C withdrawal remains **UNSUPPORTED**, not parity, a pass, or zero cost.
- **The accounting contract does not pretend the implementations cost the same.** B's future ordinal consumes scanned budget before any admission/body read; each other scan candidate adds one admission and one bounded record lookup, while B indexed adds only the admission lookup (`src/IncomingQuotesReader.sol:97–114`). C charges one logical header lookup for every examined candidate, including its sentinel; that helper makes two external static-field calls. C may prefetch bounded posting-slice entries past a sentinel (`src/IncomingQuotesReader.sol:92–105`), so prefetched bytes remain paid even when those entries do not enter the loop counters. B's whole-Pair preflight can separately return 8,352 ABI bytes. Neither bodyReads=0 nor a matching Page ABI equates preflight, external-call count, return bytes, or total gas.

## Issues by severity

### Critical — none identified

No cross-task source defect that prevents the bounded retained-Quote query was found.

### Important — none identified in this source/unit scope

No missing required result behavior, old-obligation regression, ABI incompatibility, or newly introduced source-publication blocker was found.

### Known nonblocking limitation — fresh C legacy-helper run is not green

The retained fresh Node log records **93 tests, 92 passes, one failure**, with the failure at the old immutable-range snapshot assertion (`/tmp/efs-required-query-c-build-20260914.sKwCIN/fresh-node-after-full.log:12,94–97,106`). Fresh compiler AST keys are 4622/4624 versus the old pinned 3835/3837. Do not describe this as 93/93 or substitute the separately root-reported retained-artifact 72/72 run.

The root's reconciliation artifact records identical complete initcode/runtime templates, link ranges and physical immutable ranges for all four old executable artifacts (`/tmp/efs-required-query-c-build-20260914.sKwCIN/artifact-reconciliation.json:7–12,31–36,83–88,171–176`). I read that retained evidence; I did not rerun the bytecode reconciliation. This explains why the metadata-key failure is nonblocking for the reviewed source/unit publication, but does not validate a fresh deployment runner. It is a firm prerequisite for the next paid run, not an instruction to weaken the old snapshot pins. The coordinator's separately prepared metadata-only AST output is outside this source review.

After this source pass, the coordinator reported completion of metadata-only AST export with no source change: `/tmp/efs-required-query-ast-20260914.hrHCoQ/reconciliation.json` reportedly matches 16 relevant artifact executable templates/link spans/physical immutable ranges and 71 source hashes to the tested set. That supplemental result was not independently inspected in this review and does not change the fresh Node 92/93 result or remove the requirement to implement and verify the fresh named-immutable resolver.

## Verification evidence and publication boundary

Read retained root log summaries without rerunning tests:

- B focused **16/16** (`/tmp/efs-required-query-b-green-20260914.G8M9Z4/focused.log:74`) and full Forge **79/79** (`full.log:217`), zero skips/failures. B Node **47/47** remains explicitly root-reported rather than independently rerun here.
- C semantic cursor RED **10 passes/1 failure** (`/tmp/efs-required-query-c-build-20260914.sKwCIN/red-2.log:22,36`), final focused **11/11** (`focused-2.log:22,36`) and full Forge **91/91** (`full.log:149`), zero skips/failures in the final Forge runs. Fresh Node qualification is retained above.

**Gate before exact-snapshot source publication:** no further source correction is identified. Publish only the reviewed exact files/pins with the known fresh-Node limitation and source/unit-only status intact; do not fold unreviewed runner/metadata changes or existing untracked files into this approval. Publication remains the coordinator's action and authority, not performed or authorized by this report itself.

## Next-stage recommendations and readiness

**Ready for next paid-experiment implementation: Yes.** The two-task reader/unit plan is fulfilled sufficiently to build the narrow independent oracle and signed-page runner. The broader specification's runner/economic phase is not yet fulfilled merely because these readers exist.

Before executing or reporting that later experiment:

1. Seal literal fixture bytes, per-candidate posting/admission order and old/current bases, expected unique IDs, per-page outputs/statuses, callers/deadline/signatures and runtime identities independently. B and C setup admissions need not have equal numeric bases. Keep the fixed budget-2, at-most-8-page/16-candidate/4-result measurement separate from larger auxiliary unit cases.
2. Resolve named immutables and linked runtime templates from the fresh source/artifact set plus independently expected deployment values, then verify the exact resulting runtime bytes. Old compiler AST keys and a codehash learned from an arbitrary deployed address are not substitute trust inputs.
3. Retain every paid page/publication receipt and exact reply/commitment, execute to terminal status, reconcile the independent output oracle, and charge full maintenance plus all page/preflight/prefetch/call/byte work. Keep deployment/setup separate and keep C withdrawal UNSUPPORTED explicit.

**Ready for a paid run, new price claim, launch or production: Not established.** No paid-run evidence or approval, production/finality audit, owner SLA, affordability threshold, block-fit conclusion or permanent protocol choice follows from this source/unit review.

## Coordinator disposition

The exact reviewed C three-file delta was committed and pushed as `3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`; B remains `d547890e57fb0c1ba2ef4d9f8b18b519946197b8`. No prototype code was merged into planning/main, no worktree was removed and no unrelated untracked file was committed. The review's source/unit-only boundary and fresh Node limitation are retained. Both metadata-only AST exports completed and their full executable templates were reconciled before offline paid-fixture work resumed; actual signed paid-query execution remains unrun.
