# Task 2 — exact-Type incoming-quote coverage repair

2026-09-16 · session `query-coverage-repair-20260916` · contracts-dev / codex · Astra High (parent-confirmed GPT-6 Astra, high).

Status: implemented and self-reviewed, ready for the parent's independent scoped review. No push or canonical planning publication performed here. BASE is `5bc5f171c0dfe900d5121b19383382d24b7a14db`, branch `codex/efs-warroom-b-run`. All commands below ran from the disposable `lab-b` directory, not a production repository.

## Result and scope

The only executable production change is `index.coverage(family, quoteType)` in `src/IncomingQuotesReader.sol`. Type/reference-family coverage is scoped by exact registered source Type; the distinct `Keys.byTypeList(quoteType)` and pair-specific `Keys.referenceList(quoteType, 0, pair)` remain the physical identities for `postingHead` and `postingAt`. Pair Record ID, global zero scope, and posting-key hashes are not substitutes for exact-Type coverage. UNKNOWN still refuses, and exhausted PARTIAL never certifies complete absence.

`test/IncomingQuotes.t.sol` preserves the original 16 tests (one misleading gap-test name is corrected), fixes two obsolete assumptions, and adds two real-module controls:

- The new exact-scope control asserts both generic families COMPLETE/from1/through4 for `joinedType`; both posting keys and the Pair Record ID are UNKNOWN/from0/through0 for each family. Both readers must return the exact admitted Quote. Its pre-repair E_COVERAGE failure is the fresh RED.
- Required-family downgrade still demands exact E_MANDATORY_FAMILY and COMPLETE/from1/through4, now querying `joinedType`. The selective profile aliases the generic reference family; it does not maintain another independent reference family.
- The gap fixture explicitly uses diagnostic-only zero-index ablation, admits the missing Quote, and restores the original index. The next publication must return exactly `Ledger.E_INDEX(abi.encodeWithSelector(IndexModule.E_SEGMENT.selector))`. All four counters, author nonce, and index frontier remain unchanged; actual admissions4/frontier3 confirms a real gap. Both readers exhaust as PARTIAL, including zero-work terminal continuations and new queries after generation bump. Generation cannot heal missing history.
- A detached selective replacement begins with proven frontier0 despite `attachedFrom == 8`, canonically replays all seven publications (including a reused Quote), proves genesis frontier1..7 without changing attachment, passes checked cutover at admission7/publication7 with exact code/manifest/generation pins, then newly pinned readers recover the same three retained Quotes in order, without duplicates, COMPLETE. The existing unreplayed late-attachment test remains PARTIAL and now also checks terminal continuation.

Only the stale late-construction comment in `src/SelectiveReferenceIndexModule.sol` changes: unreplayed late state is PARTIAL, canonical replay plus checked cutover can establish COMPLETE, and deployment time alone is not proof.

Unchanged assertions cover profile/code/Type/Pair identity, cursor domain and each of 12 cursor-field mutations, cross-mode replay refusal, generation invalidation, attachment/runtime pins, first-admission filtering, retained membership despite withdrawals and rebinding, old-basis/current-tail filtering, ordered pagination, exact scan/header/body work counters, empty terminal continuation, 64-ID maximum page and its exact 2,688-byte encoding, 4,096-byte bound, and max64 callback control. No Ledger, index implementation/materialization/storage, SDK, carrier, profile, cap, or authority semantics changed. This is not Task3 selection-head work or a new continuation guarantee.

## TDD and exact test commands

Each logged test pipeline used `set -o pipefail` before execution. Build/cache were the dispatched existing scratch paths. Forge is 1.7.1 (`4072e48705af9d93e3c0f6e29e93b5e9a40caed8`); solc0.8.30, optimizer200, viaIR, Cancun are unchanged.

Initial attempt (exit0, zero tests, **not a pass or RED**):

```sh
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache /Users/james/.foundry/bin/forge test --offline --match-contract '^IncomingQuotesTest$' --match-test '^test_exact_type_coverage_not_posting_or_pair_scope_both_readers$' -vv 2>&1 | tee core-closeout-query-20260915/incoming-quotes/task2-red-20260916.log
```

Selection diagnosis (exit0; compiled one file and listed all 17 pre-repair tests, no tests executed):

```sh
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache /Users/james/.foundry/bin/forge test --root . --offline --match-path test/IncomingQuotes.t.sol --list
```

Adding explicit root while retaining anchored contract/test filters also selected zero tests (exit0, **not a pass or RED**):

```sh
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache /Users/james/.foundry/bin/forge test --root . --offline --match-contract '^IncomingQuotesTest$' --match-test '^test_exact_type_coverage_not_posting_or_pair_scope_both_readers$' -vv 2>&1 | tee core-closeout-query-20260915/incoming-quotes/task2-red-root-20260916.log
```

Actual focused RED, before the reader edit (exit1):

```sh
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache /Users/james/.foundry/bin/forge test --root . --offline --match-path test/IncomingQuotes.t.sol --match-test test_exact_type_coverage_not_posting_or_pair_scope_both_readers -vv 2>&1 | tee core-closeout-query-20260915/incoming-quotes/task2-red-path-20260916.log
```

Actual output: `Ran 1 test for test/IncomingQuotes.t.sol:IncomingQuotesTest`; `[FAIL: E_COVERAGE()] test_exact_type_coverage_not_posting_or_pair_scope_both_readers()`; `0 passed; 1 failed; 0 skipped`. The real-module coverage assertions execute before the query. No production source had been changed; the first query refuses the wrong coverage identity as expected. The class/path filter issue was bypassed with observed exact path selection, not interpreted as passing evidence.

GREEN IncomingQuotes, once after repair (exit0):

```sh
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache /Users/james/.foundry/bin/forge test --root . --offline --match-path test/IncomingQuotes.t.sol -vv 2>&1 | tee core-closeout-query-20260915/incoming-quotes/task2-green-20260916.log
```

Output: compiled3 files in9.28s, `Ran 18 tests for test/IncomingQuotes.t.sol:IncomingQuotesTest`; `18 passed; 0 failed; 0 skipped`. Full names/results/gas and warnings retained in the log. Compiler warnings: four existing Keys.sol declaration-shadowing warnings2519 at lines92,97,117,121; test-only IncomingQuotesTest initcode187,200 bytes warning3860. The selection/list compile similarly warned on test-only182,761-byte initcode. These fixtures embed multiple deployments and are not proposed deployable contracts. Output is not warning-free; no warning was suppressed for this task.

Three specified covering classes, each once (exit0):

```sh
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache /Users/james/.foundry/bin/forge test --root . --offline --match-path 'test/{IndexConfigExpectation,CoreIndexMaterialization,CoreIndexReplay}.t.sol' -vv 2>&1 | tee core-closeout-query-20260915/incoming-quotes/task2-covering-20260916.log
```

Output: compilation skipped, no warnings emitted; CoreIndexMaterializationTest13/13, CoreIndexReplayTest9/9, IndexConfigExpectationTest5/5. `27 tests passed, 0 failed, 0 skipped (27 total tests)`. Combined GREEN45/45 in four named classes. No whole-Forge run, no new paid gas matrix, no Anvil/public endpoint/package install, no demo UI60608 or RPC60599 interaction. Forge test gas values cover fixture/setup work and are not paid transaction estimates or proof of a new15M paid row.

## Provenance and fit

Retained SDK3 baseline `core-closeout-sdk-20260915/carrier-baseline-incoming.log:55-74` and candidate `carrier-covering-forge.log:1061-1078` were read, not rerun or overwritten: each has original16 tests, 5 passes, 11 failures (nine E_COVERAGE, stale direct-coverage assertion, stale gap-ingress E_INDEX). Those failures reproduce at historical exactBASE `6869e2680d75521de851eaa67631cc05a1eb35a9`; this task begins at reviewed post-SDK3 BASE5bc5f1. These are different evidence checkpoints, not interchangeable source pins.

New outputs all use `task2-*-20260916` labels in this fresh evidence subdirectory; no pinned historical artifacts were overwritten. `task2-sizes-and-sources-20260916.json` retains source SHA256 for the reader, selective module, test, Ledger and IndexModule, plus compiler settings, artifact hashes and runtime-template hashes. Node read the existing generated artifact JSONs; no second full build was run. Runtime template hashes are explicitly **not deployed runtime codehashes**: constructor immutables require per-instance pinning.

| Deployable reader | Runtime bytes | Creation bytecode bytes | Initcode including seven32-byte constructor arguments |
|---|---:|---:|---:|
| BScanIncomingQuotesReader | 8,986 | 11,646 | 11,870 |
| BIndexedIncomingQuotesReader | 8,986 | 11,647 | 11,871 |

Both fit unchanged runtime24,576/initcode49,152 ceilings. Source SHA256 for the actual executable change is `36a63bbfb7549f7d15616c97ac7bde7ad5e6ca2e75b54ef2d0f315da09a852c7`. Ledger hash `074b7eb414a940e439b9adfd8a2746ffef0a013fd36a10201c4408d9967d346e` and IndexModule hash `9e4051f424e695fb0e928383040434e2d0894fe45f84fdbf97407bf22f6dae06` are unchanged task inputs.

## Self-review and handoff

Reviewed the complete three-file source diff and ran `git diff --check` successfully (no output). Exact behavioral production diff is one argument; all enumeration/profile/cursor/refusal logic remains untouched. No remaining failures in required scope. Test expectations exercise real Ledger/index/readers; no mock, patched frontier, broad unknown-to-empty coercion, or cap increase. The replay fixture is deliberately seven canonical publications with literal current cutover basis7/7; it is not an arbitrary-history guarantee or a proof against dishonest administrator-pinned modules.

`./scripts/install-hooks.sh` from worktree root exited2 because it assumes `.git/hooks` is a directory; the worktree uses a `.git` file. Read-only inspection and parent confirmation establish shared `planning/.git/hooks/commit-msg -> ../../scripts/commit-msg-hook.sh` already installed. No shared hook/config mutation was made. The unrelated pre-existing untracked message files remain untouched. Parent owns the canonical session line, planning docs and publication; this worker commits exact source/evidence only with required trailers and `git commit -F`.

Files changed: the three source/test files listed above; this report; five newly labelled test/diagnostic logs; the size/source JSON. Local orchestration report points here. The source/build/bounded-chain ownership is released to the parent with the final commit handoff; no subprocess or chain remains running. Independent review is the parent's next gate, not claimed by this self-review.
