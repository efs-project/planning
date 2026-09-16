# Query Task 3 — bounded selection-head cost experiment

**Decision: retain this one candidate.** All predeclared correctness, fit and
materiality gates passed. This is a disposable prototype result, not protocol
adoption, a practical P64 default, or an owner-demo upgrade.

Base: `e35c575b9976288150f9f5b89a9b5923ff944f23` on
`codex/efs-warroom-b-run`. Role `contracts-dev`, harness `codex`, session
`query-selection-head-20260916`, dispatched model Astra Extra High.
One source/build/chain writer; no subagents, worker reviewer or push.

## Change and unchanged guarantees

Added `Ledger.selectionHead(bytes32) -> (uint8,uint32,uint64,bytes32)`. It reads
the full metadata word, extracts state/revision/48-bit admission using the
existing GUARD, and reads the target slot only for live state 1. This is a
selection projection, not a redefinition of raw storage observation.

Only `_headAt`, `_scan`, `_masked`, `_resolve`, `_conflicts` now use the internal
virtual `_selectionHead`. The test-only `RawHeadFilesLiveLens` overrides this
primitive with the previous six-field raw getter and projects its live target.
There is no production switch or public qualification bypass. The raw control
is otherwise the same current Lens/FilesPageReader/owning-accumulator stack,
sharing the **same actual new Ledger and index** with the candidate.

Raw `head`, Lens raw forwarding, `headSnapshot`, storage roots/layout, writes,
SDK guard/CAS code, codecs, publication, Types, coverage, selector ordering,
history fallback/refusal, owner/session/cursor checks and caps are unchanged.
Unexpected state 3 is preserved by the projection; injected absent/masked/
unexpected state targets remain visible in raw APIs and raw snapshot hashing.
High-bit revision/admission/previous/ordinal fixtures prevent premature
truncation. A current tombstone still recovers live history at A.

## Fit and deployment

Solc `0.8.30+commit.73712a01`, optimizer enabled/200, viaIR, Cancun unchanged.
`base-sizes.json` was captured from the exact BASE before implementation.
`paid/pins.json` verifies compiler source hashes before any fixture starts.
`final-verification.json` independently confirms that the final source and
compiler creation/runtime bytes still equal those actually measured.

| Artifact | Runtime bytes | Constructor-inclusive initcode bytes |
| --- | ---: | ---: |
| BASE Ledger | 24,126 | 36,227 |
| Candidate Ledger | 24,247 | 36,348 |
| Selection LensReader | 14,422 | 14,819 |
| Selection FilesLiveLens | 16,415 | 16,861 |
| Test-only raw FilesLiveLens | 16,389 | 16,835 |
| FilesPageReader, either arm | 16,966 | 17,672 |
| ProfiledFilesIndex | 24,491 | 44,737 |
| FilesQueryAccumulator P1 / P8 / P64 | 6,165 | 8,455 / 8,679 / 10,471 |

Ledger adds **121 runtime / 121 initcode bytes**, leaving **329 runtime bytes**.
No extraction, byte-golf, storage change, cap increase or second candidate.
The final index still has only 85 runtime bytes spare; it is unchanged here.
The raw control is not the old deployed Ledger or old Lens bytecode: its
explicit selection helper is the task's same-guarantee comparison control.

Actual whole deployment receipts: shared Ledger **7,797,173 gas**;
raw Lens **3,592,306**, selection Lens **3,597,910**;
each page reader **3,721,978**. Thus matched Lens+reader setup is
**7,314,284 raw / 7,319,888 selection**, an additional **5,604 gas**.
That measured reader-stack increment amortizes within one complete query in
every measured P1/P8/P64 cell. Session deployment is priced separately below.
The exact BASE-to-new **whole Ledger deployment gas delta was not measured**:
both paid arms intentionally share the new Ledger. The 121-byte Core increment
is not silently treated as free, and no whole rollout break-even is asserted
from a fabricated old-Ledger receipt. These are fresh disposable deployments,
not authority to replace an existing owner deployment.

## Predeclared gate and finite paid matrix

Gate fixed before implementation: at least 10% lower matched P64 ordinary and
historical B1 continuation **and complete two-page query totals**; no greater
than 5% P1/P8 whole-step regression; identical qualified outcomes and ordinary
15M allowance/hard 16,777,216 ceiling. Deployment accounting is separate.

Two live File candidates; explicit P=1/8/64 with the actual owner last. Negative
query uses an exact nonzero Concept and either-tag filter. Both arms start at
the same A, in separate paid transactions; neither warms the other's slots.
The ordinary control has no churn. The historical cell applies 64 HEAD,
64 stable-TAG and 64 revision-TAG writes to the second candidate after the
first page, then both complete at C. Eight 24-action fixture transactions
perform these 192 later admissions. No full 157-transaction origin campaign,
large-B stress tournament or public transaction was repeated.

All numbers are **whole receipt gas**, not attributed opcode/slot estimates.

| P / mode | A -> C | Raw first B1 | Selection first B1 | Raw continuation | Selection continuation | Continuation saving | Raw two-page total | Selection total | Total saving |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 ordinary | 12 -> 12 | 641,587 | 631,274 | 403,093 | 392,781 | 2.558% | 1,044,680 | 1,024,055 | 1.974% |
| 1 historical | 12 -> 204 | 641,575 | 631,274 | 531,341 | 525,310 | 1.135% | 1,172,916 | 1,156,584 | 1.392% |
| 8 ordinary | 204 -> 204 | 944,826 | 832,440 | 699,957 | 587,568 | 16.057% | 1,644,783 | 1,420,008 | 13.666% |
| 8 historical | 204 -> 396 | 944,826 | 832,440 | 833,099 | 724,971 | 12.979% | 1,777,925 | 1,557,411 | 12.403% |
| 64 ordinary | 396 -> 396 | 3,223,216 | 2,292,473 | 3,103,282 | 2,172,494 | 29.994% | 6,326,498 | 4,464,967 | 29.424% |
| 64 historical | 396 -> 588 | 3,223,204 | 2,292,473 | 3,236,682 | 2,310,131 | 28.627% | 6,459,886 | 4,602,604 | 28.751% |

| P / mode | Raw session deployment | Selection session deployment | Raw query+session | Selection query+session |
| --- | ---: | ---: | ---: | ---: |
| 1 ordinary | 1,598,276 | 1,598,276 | 2,642,956 | 2,622,331 |
| 1 historical | 1,598,264 | 1,598,276 | 2,771,180 | 2,754,860 |
| 8 ordinary | 1,755,685 | 1,755,685 | 3,400,468 | 3,175,693 |
| 8 historical | 1,755,685 | 1,755,685 | 3,533,610 | 3,313,096 |
| 64 ordinary | 3,015,023 | 3,015,023 | 9,341,521 | 7,479,990 |
| 64 historical | 3,015,023 | 3,015,035 | 9,474,909 | 7,617,639 |

The isolated 12-gas differences come with different address/session calldata
domains; raw calldata and receipts are preserved, not normalized away.
Every fixture receipt has effective gas price 2 gwei (local test configuration,
not a provider fee quote). At that configured price, the selection P64
ordinary query+session is 0.014959980 test ETH; historical is 0.015235278.

Positive P64 control returns both fully qualified matching rows: raw steps
**3,246,045 / 3,128,660**, selection **2,319,570 / 2,202,140**;
totals **6,374,705 / 4,521,710**, session deployment **3,015,035** each.
An unselected principal mutates the same folder between pages (A592 -> C593);
both still exhaust, with exact row ABI and zero unknowns.

Selected already-consumed scope mutation is deliberately refused: both arms
spend **204,771 gas**, revert, retain scanned=1 and their previous commitment,
and do not complete (A593 -> C594). Both refused receipts are retained. Their
different reader/session commitment roots are expected and independently
recomputed, not compared as if address-independent.

## Correctness and avoided work

All six negative pairs exhaust with rawTotal=2, selected=2, rows=0, unknowns=0
and final originAbsent=true. Each positive pair has rows=2, unknowns=0 and
originAbsent=false. Session query/result commitments are independently
recomputed using the actual accumulator/owner/session/reader address domain.

The raw-history oracle reduces canonical admissions, publication principals,
binding-position preimages and retained full Record bytes. It never consumes
Lens results, current heads, index postings or stored completion flags.
Separate unfiltered two-page calls expose **all Row ABI fields/qualifications**
for the negative cells; their rows exactly match both arms and that independent
oracle before and after the historical changes. Negative empty output alone
would not establish that parity. Raw oracle inputs are in the paid packet.

Source topology remains up to **256 head getters per P64 negative row**:
placement/masking 64 + HEAD 64 + stable TAG 64 + revision TAG 64. All metadata
reads remain. In this fixture the ordinary negative row skips 254 target-slot
loads (2 live heads), and the historical continuation skips 252 (4 currently
live heads, two later than A). Selection also avoids returning the unused
previous/ordinal fields and their ABI words. These are source-level operation
counts, **not a fabricated cold-slot gas allocation**; no trace was collected.
History qualification/postings/bisection, principal-by-position work, Name and
header interpretation, all scope guards and owned session storage remain.

## Verification and exact commands

Commands below ran from the lab directory with the assigned `FOUNDRY_OUT` and
`FOUNDRY_CACHE_PATH`; the paid run additionally supplied the existing ethers
package and Foundry Anvil binary paths. No install occurred. Tool paths/output
paths are environment configuration, not committed source dependencies.

- RED: `forge test --offline --match-path test/SelectionHead.t.sol --match-test test_selection -vv`.
  `red.log`: 2/2 fail; `red-history.log`: 3/3 fail, all exactly
  `selectionHead ABI unavailable`. The real Ledger lacked the selector; raw
  APIs were not modified to manufacture the new contract.
- GREEN, same command: `green.log`, 3/3 pass; expanded full-row controls
  `parity.log`, 4/4 pass.
- Exact stack build: `forge build --offline src/Ledger.sol src/LensReader.sol test/FilesLiveIndex.sol test/FilesPageReader.sol test/FilesQueryAccumulator.sol test/SelectionHeadControl.sol test/ProfiledFilesIndex.sol`.
  Exit 0; exact diagnostics retained in `build.raw.log.gz`; `build.log` is the
  readable copy with only trailing whitespace/extra terminal blank lines removed.
- One paid matrix: `EFS_SELECTION_HEAD_OUTPUT=core-closeout-query-20260915/selection-head/paid node script/core-selection-head-cost.mjs`.
  Exit 0, COMPLETE, retained=true, **108 signed transactions including setup;
  32 paid steps, two deliberately reverted**. Actual fixed-block
  `createFilesCompactSdk` joined positive read passed (two rows, PRESENT,
  COMPLETE) against the new execution identity.
- One covering run: `forge test --offline --match-path 'test/{SelectionHead,FilesQueryOrigin,FilesRetainedQuery,FilesPageReader,FoundationGuard,ReadSetCarrier,LensReview}.t.sol' -vv`.
  `covering.log`: **132/132 pass**, 8 suites. Includes inherited Files controls,
  selected empty/consumed/terminal scopes, retained-history/withdrawal,
  attachment/execution/epoch/generation/coverage checks and current-write guards.
- Self-review added explicit ordered withdrawn-header raw/new comparison
  alongside the diagnostic conflict comparison. Targeted command above reran:
  `self-review-parity.log`, **4/4 pass**. No measured source/runtime changed.
- Existing-output refusal: child invocation with the already-existing explicit
  output exits 1/EEXIST before starting a fixture. Packet SHA-256 unchanged:
  `no-overwrite.log`. Default output uses a fresh temporary directory; explicit
  outputs require a new directory, and output files use exclusive creation.
- `node --check script/core-selection-head-cost.mjs` passed. The staged diff
  check initially detected the compiler's decorative trailing whitespace in
  `build.log`; retaining the exact compressed original and formatting only that
  display whitespace resolved it. Final verification rechecked all 108 raw transaction hashes, receipts,
  gasLimit=15M and effective price=2 gwei, plus source/compiler-byte pins.

Warnings are **not pristine output**: retained Solc 2519 Keys shadowing; 2018
existing test mutability suggestions; 3860 oversized monolithic Forge test
harnesses; build lints for intentional packed-width casts and timestamp use.
The oversized harness warning is not a deployed-reader cap waiver. Every
actual deployed runtime/initcode and ordinary receipt was separately checked.
The existing configured ignored error code 5740 was not changed.

## Evidence, identities and handoff

`paid/paid.json.gz` contains actual constructor arguments, deployed codehashes,
signed transaction bytes/receipts, findings, full oracle inputs, rows, SDK
result, compiler/source pins and execution identity. `paid/summary.json` is the
compact price/contract view; `paid/pins.json` and `final-verification.json`
pin the exact measured/final compiler bytes. The paid packet SHA-256 is
`65570efed1ba7d61110493627c990e7e868b62ce20e56f1eb5b0b11f669805fa`.

Source SHA-256:

- Ledger: `ee313dc60386c64c925cc47ce5890b40b139fa81b2e86eba814cf28ae55c665a`
- LensReader: `9fa4b72e34bb3e873ea93a3f8dca4e7b08ce0d7268a79501d600612c119e1f30`
- Paid runner: `54ce65cff9e23ec116560919a01fd59519b0b7f1a23b352c792e9e63749e6e1f`

New disposable Ledger codehash:
`0xd01dc5f595e30bf38d1619d2449b4e4c971a82bedf2ce346885d69d372853497`.
Execution pin:
`0xb7cf314dc7843899c898c5b57fd2c1973e706a67f97dfd9d7d215818cf5a54f2`.
The bytecode change requires a new execution pin despite unchanged layout/raw
ABI. Old owner-demo artifacts, source serving/import allowlist, SDK support,
UI60608 and RPC60599 were not altered.

The run used loopback62251, PID81942, history256/transaction cache512, a fresh
run-specific Anvil cache, and closed in `finally`. Post-run process/socket
checks found neither PID nor listener. No public RPC, deployment, package
installation, trace, state restore/restart, owner browser mutation or push.

Self-review: exact five-call-site diff; raw APIs and all storage/writes unchanged;
full projection metadata including malformed raw diagnostics tested; ordered
and diagnostic historical row parity, retained withdrawal and UNKNOWN tested;
actual paid independent outcomes and domain roots checked; warnings and refused
receipts retained. The final test-only strengthening is pinned independently
without rerunning or overwriting the paid experiment.

Residual limits: 329 Ledger runtime bytes is a tight margin. P64 still costs
about 2.2–2.3M per negative B1 continuation, plus its 3.015M session setup.
Historical joins remain O(candidates × principals × joins × log history);
lifetime inventory/prefix discovery, current complete guard cost, selected
scope version storage and accumulator session storage are not removed. Wider
batching, joint maxima, live Files providers, Type/authority closure, replay
completeness, provider fees and final integrated resource/provenance gates are
not closed by this result. Parent owns canonical documentation/publication and
independent review. Source/build/bounded-chain lease released after task commit.
