# Retained-origin paid Files query evidence

This closes the unrelated-publication restart failure for the guarded dense-folder profile and demonstrates a separate retained-inventory profile through bounded selected-folder churn. It does **not** establish an economical P64 default, compose all independent maxima, or authorize a current mutation from historical absence.

Base: `4c1098f3b13a36e057dd974d0351015e96f2b41e`. Local prototype evidence only; no public deployment or provider fees. Compiler Solidity0.8.30, optimizer200, viaIR, Cancun. Runtime24,576/initcode49,152 and ordinary15M/hard16,777,216 are unchanged.

## What is qualified

- Every selected `(principal,FOLDER,folder)` is checked, including consumed, empty and terminal scopes. Every bind/unbind advances its last-mutation admission. Other folders and unselected authors do not invalidate the fast profile.
- HEAD and stable/revision tags select at origin A, with current-head fast paths and packed-history bisection when needed. Historical UNKNOWN reverts into the existing unavailable path, never point ABSENT or lower-author fallback. Names, directories and headers are qualified at A despite later occurrence withdrawal.
- Starts require A==C. Continuations retain A and expose observed-current C; execution, epoch, generation, module/code pins and complete genesis-through-current coverage stay exact. Legacy Files address pagination stays strict.
- The disposable accumulator owns caller/session/query/basis/cursor, authenticates raw total and retained-length hash, enforces progress/exhaustion and retains unknown rows. Historical zero has no authority over a current effect's dependency read-set.
- The dense inventory and stamps live in one constructor-created fixed-writer companion. Shared live/replay folds and final Name/Directory validation remain in place. The semantic manifest excludes deployment addresses; physical readiness, replacement and readers check actual companion pins.

## Whole paid receipts

`paid.json.gz` contains 157 transactions, signed envelopes/receipts, deployed code facts, exact oracle rows, commitments and source hashes. All use gasLimit15,000,000. There are two intentional reverted attempts; neither advances the owned scan. Evidence classification is `LOCAL_RPC_OBSERVED_NOT_STATE_PROOF`.

The independent oracle reduces raw admissions/publication contexts, binding positions/cells and retained Records, not Lens/index/current-head answers. Exact complete Row ABI encodings and rolling commitments are compared. Its paid fixtures are bounded root-file fixtures; the focused Solidity tests cover additional unavailable/tombstone/conflict/header cases.

| Profile | Origin A → last C | Whole receipt gas |
| --- | --- | --- |
| Two selected principals, B1; unrelated write between eight pages | 42 → 57 | first682,637; later481,391–498,075 |
| Same query; unselected author writes same FOLDER/HEAD/TAG between eight pages | 57 → 78 | first667,955; later440,092–481,391 |
| P1; first B1, then seven candidates | 78 → 270 | first638,528; B7 1,478,365 |
| P8; first B1, then B4 | 270 → 462 | first937,988; four1,830,234; final three1,559,900 |
| P64; B1 | 462 → 654 | first3,186,237; later3,097,152; final historical candidate3,199,148 |
| P64; seven-candidate joint attempt | 462 → 654 | **reverted14,768,931**, scanned1→1; B1 retry sequence then completed |
| Separate retained P1/B1; seven selected-folder renames between eight pages | 654 → 675 | first734,809; later517,264–535,268 |
| Fast profile after16 selected-folder renames | 675 → 723 | initial660,782; guard refusal204,218, scanned1→1 |

For each P1/8/64 deep run, **one later candidate** receives64 additional changes to each of HEAD, stable tag and revision tag after the first page. This is not64-deep history for all principals/candidates. Selected HEAD/tag changes also affect an already-returned and later row in the unrelated run; all rows still match A. The high-cost joint failure is an observed15M-bounded revert, not an opcode-traced OOG attribution. P64/B1 is finite, expensive feasibility evidence—not a practical-default pass.

The retained profile discovers origin lengths by bisection over immutable first-binding admissions, hashes the lengths with A/principals/folder and checks that hash in the accumulator. Its P1/eight-origin-row fixture uses3–4 prefix comparisons/page and74,279–92,574 gas measured **inside the prefix section**. That diagnostic excludes earlier page qualification, row scans, joins, events and transaction overhead; warmed state may affect it. Only the table's receipts price whole calls. After23 total renames, a new origin sees31 lifetime candidates versus8 dense candidates (3.875× amplification); the measured completed scan pinned8, not31.

## Source-based cost explanation and follow-up seam

This is bounded source inspection, not a trace-based gas attribution:

1. Each paid call repeats page/Lens execution identity, layout, attachment, generation/epoch, history/scope coverage and companion checks. `Ledger.executionSet` reconstructs code identity and calls index generation. The fast continuation checks every selected scope; `_scan` sums all selected scope lengths and walks empty higher scopes before reaching the owner. This fixed O(P) work is paid again per page.
2. The measured P64 owner is last. Per candidate, placement plus higher-mask selection can make64 `Ledger.head` calls. `FilesPageReader` then calls the historical ordered reducer separately for HEAD, stable tag and revision tag, each scanning64 selectors: up to256 head getters total for that row. `head` reads packed metadata and target; the mostly distinct binding slots are cold again in each new transaction. This repeated selector/head work explains the dominant P-scaling even for ordinary rows; the final deeper row adds102k whole-call gas in this fixture, not the entire3.1M.
3. Each of those three external historical joins copies/decodes the principal array and repeats `_historicalBasis`. A head newer than A additionally checks binding history coverage, fetches posting length, bisects packed postings and reads the retained admission. Worst-case historical joins remain O(candidates × principals × joins × log history). The fixture deepens one candidate/owner, not that full product.
4. Name bytes and selected header fields are loaded/qualified separately; row structs cross Lens/reader/accumulator ABI boundaries. The accumulator copies rows into events and hashes each row. Filtering happens after joins, so a negative result does not avoid candidate/selector work. Logical `hydrations` are not total history/metadata/byte/ABI work.

Concrete follow-up: replace the three per-row external historical calls in `FilesPageReader` with one **bounded batch-at-A read** that accepts the selectors once, qualifies exact current execution/coverage once inside that call, and shares internal ordered/no-tiebreak historical reducers across the requested rows/joins. Keep unqualified helpers internal; do not carry a qualification cache across transactions. A separately measured head-hydration batch or layout-pinned read facade could reduce getter/ABI overhead, but must retain all principal ordering, tombstone, UNKNOWN, history and code/layout guarantees. The remaining P×join head work cannot simply be declared free. This seam belongs in Lens/reader work, not the85-byte-margin Files index. No such optimization was implemented or claimed here.

Retained-prefix discovery remains separate from the row budget. P64 with deep lifetime inventories could exhaust15M before a row is scanned. That combination and arbitrary lifetime completion cost are **unmeasured**, not impossible. The implementation/integration seam for the bounded retained profile is now present; the remaining gap is economical wide/deep operation and bounded initialization.

## Exact bytecode fit

Creation bytecode is not initcode: constructor arguments are included below. `sizes-and-sources.json` checks artifact metadata source keccak against current files and records source SHA256 and compiler settings. Paid deployed-code sizes and actual deployment calldata independently agree for deployed components.

| Contract | Runtime | Creation | Constructor arguments | Actual initcode |
| --- | ---: | ---: | ---: | ---: |
| Ledger | 23,434 | 35,471 | 64 | 35,535 |
| PublicationSupport | 11,185 | 11,211 | 0 | 11,211 |
| IndexModule | 12,897 | 21,674 | 32 | 21,706 |
| ProfiledFilesIndex | 24,491 | 44,129 | 608 | 44,737 |
| FilesLiveNamesIndex | 18,147 | 31,561 | 224 | 31,785 |
| FilesScopeState | 1,527 | 1,686 | 32 | 1,718 |
| LensReader | 14,886 | 15,247 | 64 | 15,311 |
| FilesLiveLens | 16,914 | 17,324 | 64 | 17,388 |
| FilesRetainedLens | 16,900 | 17,331 | 64 | 17,395 |
| FilesPageReader | 16,966 | 17,576 | 96 | 17,672 |
| Accumulator P1 / P8 / P64 | 6,165 | 7,943 | 512 / 736 / 2,528 | 8,455 / 8,679 / 10,471 |

ProfiledFilesIndex fits with only85 runtime and4,415 initcode bytes spare; its paid deployment cost8,324,213 includes companion creation. Before this task it was24,518 runtime and42,369+608=42,977 actual initcode. Ledger runtime is unchanged; its base creation was35,116+64=35,180 actual initcode. Paid accumulator deployment costs are1,598,276 /1,755,685 /3,015,023 for the three deep profiles, additional to their step costs. Retained Lens/reader/session deployment costs are3,700,518 /3,721,954 /1,578,376. Per-scope stamps and disposable session storage are permanent state costs, not hidden by COMPLETE.

## Reproduction and retained checks

From this lab, with the assigned toolchain on PATH and existing `EFS_ETHERS_PATH`, `FOUNDRY_OUT`, `FOUNDRY_CACHE_PATH`, `ANVIL_BIN` configured:

```sh
forge test --match-contract '^(FilesRetainedQueryTest|FilesQueryOriginTest|FilesLiveIndexTest|FilesPageReaderTest|CoreReadCostAuditTest|CoreIndexReplayFilesTest|CoreIndexReplayTest|LensReviewTest|FilesByteworkTest|FilesNameByteBoundaryTest|RecordOccurrenceBoundsTest)$' --out "$FOUNDRY_OUT" --cache-path "$FOUNDRY_CACHE_PATH" -vv
node script/core-query-sizes.mjs
node --check script/core-query-origin.mjs
node --check script/core-query-sizes.mjs
node script/core-query-origin.mjs
git diff --check
```

Focused covering result:198/198 across11 selected suites; no repository-wide campaign. `focused-final.log` retains the actual compile warnings; final no-source-change recheck also passed198/198. `red-green.md`, `focused-initial.log` and `retained-and-amended.log` retain RED/GREEN and the initial stale-selector mock correction. Existing shadowing2519, test mutability2018 and oversized Foundry fixture initcode3860 remain; existing5740 suppression was unchanged. These are not oversized paid deployments.

The final paid run used disposable loopback57383, PID49582, history256/cache512 and finally cleanup. Process and listener absence were checked after completion. Owner UI60608/RPC60599 remained listening and were not mutated/restarted. A first successful identical bounded run preceded a runner-comment correction; the retained packet is the rerun matching the final runner SHA, with unchanged receipt gas/results. No opcode tracing, cap increase, package install or browser changes.

Still separate: practical wide/deep batching, retained-prefix initialization economics, generic index completeness, production Files/client integration, global Concept search and tag retraction/silence, live-provider observation context/fees, and current-effect authority. Historical joins do not solve those packets.
