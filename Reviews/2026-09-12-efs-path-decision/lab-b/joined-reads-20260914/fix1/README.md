# Task 5A review fix round 1 — 2026-09-14

Fix base: `2975ba76e392b627e8f3656cdadcbad60c8e5b6e`. Role contracts-dev, harness codex, session task5-joined-reads-fix1-20260914. This appendix supersedes the earlier claims of complete UNKNOWN shape and sufficient differential coverage. It does **not** relabel original 1k/10k/dense receipts as final-reader measurements.

## Findings addressed

- I1: joined search/scope changes invalidate the active read generation and coalesce into the latest query. Installation checks captured query identity plus navigation/generation. The deferred test holds old and latest reads, proves old rows never install, suppresses an intermediate query, and follows only the latest continuation/scope. Legacy listing is unchanged.
- I2: all work after successful environment creation, including report/source-pin initialization, is cleanup-protected. Both runners are independently callable without CLI work on import. Injected pin rejection uses real deployed environments and asserts their actual Anvil PIDs no longer exist. Test cleanup rescued the deliberately failing RED children.
- I3: UNKNOWN has stable page discriminant/origin flags, false completion flags, accumulated scan/selection/retained counters and known pinned total. Unavailable current scanned/hydrations are null; never-observed rawTotal is null. Generic value/knowledge/coverage remain absent.
- Adjacent knowledge clarification: a private owned-chain definite-MATCH flag is separate from retained count. PRESENT requires a definite match; ABSENT requires complete coverage and zero retained rows; otherwise UNKNOWN. Uncertain rows stay visible. Controls cover unknown-only conflict predicates, uncertain File followed by definite Directory match, empty terminal after a match, and unavailable suffix preserving known-prefix evidence. UI carries this query knowledge instead of upgrading any retained row to PRESENT.
- I4: stable/revision yes/known assessment is computed once. Requested uncertainty still returns before a negative search/tag can manufacture empty coverage. Unreachable repeated Name/tag UNKNOWN branches are removed. Core and selection workers are untouched.
- I5: a real-chain SDK table pins one context per case and independently reads placement, Name, File/Directory and tags. Eleven cases cover mixed entries, higher-author masks, all scopes, changed HEAD/tag semantics, both ordered Lenses, and diagnostic conflict. Comparisons include position/role/target/kind, selected author/revision/admission, Name preimage/record/admission, selected revision/type/parent/File/body length, independent tags and Directory NOT_APPLICABLE. A separate same-basis Solidity fault table calls independent FilesNameReader and full-body FilesJoinedConsumer for normal, unavailable Name and unavailable raw header. It compares surviving axes without upgrading an unavailable joined header when the independent full-body source remains available.
- M1/M2: count wording distinguishes retained query rows from cumulative selected placements. Header/basis JSON is collapsed; header qualification and open action stay visible.

## RED / GREEN commands and observed output

Commands ran from the lab root with existing ethers:
`EFS_ETHERS_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers`.
Initial Node REDs used read-only `FOUNDRY_OUT=/tmp/efs-joined-task5.dftfMo/out`.
All source-changing compilation and final gates used fresh `FOUNDRY_OUT=/tmp/efs-joined-fix1.3JIBq6/out` and `FOUNDRY_CACHE_PATH=/tmp/efs-joined-fix1.3JIBq6/cache`.

```sh
node --test --test-reporter=spec browser/directory-routing.test.mjs
# RED: 3 new failures: busy query, count wording, expanded details.
# GREEN: 24 passed, 0 failed; 1.242s.
node --test --test-reporter=spec browser/joined.integration.test.mjs
# RED: segmentStartsAtOrigin expected true, actual undefined.
# RED matrix: conflict/unknown-only predicates expected UNKNOWN, actual PRESENT.
node --test --test-reporter=spec script/joined-cleanup.test.mjs
# First RED: measurement lifecycle entrypoint not independently callable.
node --test --test-reporter=spec script/joined-cleanup.test.mjs browser/joined.integration.test.mjs
# After callable seams: both real cleanup cases RED, PID still existed.
# Joined/parity13 passed; cleanup3 suite/test failures.
node --test --test-reporter=spec script/joined-cleanup.test.mjs
# GREEN: 3 passed, 0 failed; 3.736s including teardown.
forge test --match-contract FilesPageReaderTest -vv
# GREEN: 24 passed, 0 failed, 0 skipped; execution28.12ms.
forge build
# Successful with warnings; Solc0.8.30,95.66s.
node --test --test-concurrency=1 --test-reporter=spec browser/joined.integration.test.mjs browser/directory-routing.test.mjs browser/files-view.test.mjs script/joined-harness.test.mjs script/joined-cleanup.test.mjs
# Final covering gate:59 passed,0 failed,0 skipped;15.495s.
/usr/bin/time -l node joined-reads-20260914/fix1/control.mjs
# FINAL_READER_CONTROL_PASS:4 actual paid receipts SUCCESS.
```

One initial Solidity test compile needed an explicit cast from the inherited generic IndexModule handle to the existing Files index interface; fixed before runtime tests. The first covering Node attempt after focused Forge compilation stopped on absent FilesApplication.json: only the selected dependency graph had been compiled. Those fixtures closed on deployment failure. A fresh full **build**, not a full-suite rerun, supplied missing artifacts. The failed setup output remains in incomplete-artifacts-node.log.gz and is not counted as a pass.

Reducer simplification was a semantics-preserving refactor gated by existing combined-filter/uncertain-origin tests plus expanded differential coverage; no artificial source-text duplication test. Historical323 Forge/152 Node full-suite results remain historical.

## Fresh final-reader paid/eth_call control

Run `/var/folders/xj/wwg7k2z54psbr2f_jb8xpytr0000gn/T/efs-compact-demo-p467Df`:32 actual live inline entries,16 revision-tagged, empty authors before Alice. No churn/dense seed or mining during a pinned read. Profile raw-sha256-aesgcm-v2; optimizer200/viaIR/Cancun; benchmark history16/keeper32 unchanged. This is a new cold **first-page** headroom control, not a repeated scale/warm/full-traversal campaign.

| Width/budget | Scan/retained | Coverage | Paid gas | Signed-cap headroom | Page ms | RPC/HTTP | Request/response bytes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1/32 | 32/16 | COMPLETE | 4,656,828 | 12,120,388 | 10.685 | 3/3 | 1,618/47,647 |
| 8/32 | 32/16 | COMPLETE | 11,341,540 | 5,435,676 | 11.663 | 10/10 | 3,550/47,928 |
| 32/8 | 8/4 | PARTIAL | 8,812,720 | 7,964,496 | 10.308 | 34/34 | 10,174/15,800 |
| 64/4 | 4/2 | PARTIAL | 8,597,999 | 8,179,217 | 17.955 | 66/66 | 19,006/11,448 |

All direct SDK reads succeeded. Counts include cold principal classification and canonical-block checking, exclude the separately completed pin, and include zero HTTP batches. Paid wrappers were simulated at exactly16,777,216 gas before signing at that same cap. Setup still uses15M signed gas,30M blocks, live4 and pre-broadcast MAX_ACTIONS checks. No limit was raised. Wide PARTIAL means intentionally smaller first pages; historical full traversal remains separately pinned.

Command wall4.16s including teardown; diagnostic work after environment construction724.768ms. Highest checkpoint values:1,084,828 output bytes,191,086,592 Node RSS,62,193,664 Anvil RSS,1,093ms since control start. Node command maximum RSS191,266,816 bytes; zero swaps. Checks retain15min/256MiB output/768MiB Node/1.5GiB Anvil caps. Checkpoints are sampled, not continuous peak-Anvil evidence. Run directory remains; owned child closed. Only protected owner Anvil remained in process inventory.

Final reader runtime15,791/actual initcode16,469 bytes (runtime347 bytes smaller). Paid artifact runtime3,135/creation3,161 unchanged; signed deployment input is in the journal. Ledger runtime24,173/actual initcode24,956, still403 runtime headroom. Source-artifact-pins.json asserts exact Ledger/TypeRegistry ABI/creation/runtime equality against read-only prior artifacts. Normal deployment-size assertions stay active. Machine report includes new reader code hash, source Keccak/compiler pins, contexts, four tx hashes, receipt gas and raw RPC metrics. Journal retains real signed inputs and receipts.

## Evidence, warning triage and handoff

Evidence-index.json contains15 compressed artifacts totaling164,271 bytes, with verified raw/compressed SHA-256. New control report, manifest, journal, RED/GREEN/build/control logs are separate from the original68 unchanged indexed artifacts. Adjacent control.mjs/archive.mjs reproduce the bounded control and archive; source-artifact-pins.json identifies working source on base2975ba7 and the exact fix commit supplies its contents.

M3: unchanged shadowing warnings include Core Keys.sol and prior test sources; unchanged unused-variable/mutability and broad-build lint warnings remain visible, not claimed fixed. Oversized initcode warnings concern disposable test factories, not deployed readers: the original page test factory174,337 bytes becomes203,790 with embedded independent oracle deployments. Inherited factories also exceed normal deployment limits. Actual reader/paid/Ledger remain within enforced normal limits. No Core warning cleanup or limit relaxation.

Self-review checked all changed source/tests, generation/query installation, owned continuation knowledge/counters, single uncertainty reducer, independently qualified fault axes, post-environment cleanup, source pins, resources/gas, exact-file scope and whitespace. Receiving-review/TDD skills required observed falsifiers before fixes; verification-before-completion required final gates and actual paid control before handoff.

No full-suite repeat, large seed, subagent, reviewer, push, owner endpoint mutation or browser CUA by this agent. Parent owns independent review and actual CUA. Source/heavy-run ownership releases after exact-file commit. Remaining limits: local timings and this small recipe are not public-RPC or universal gas guarantees; historical wide-selector cliffs remain real; headers are not full-body digest proofs; retained UNKNOWN is not a definite match; arbitrary cursor prefixes remain unauthenticated.
