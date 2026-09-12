# Optional scalar discovery experiment

**Standing:** disposable Task 3 evidence, not adopted EFS architecture, a production index, image tags, or C0 family7/9 occurrence coverage.

## Implemented boundary

One immutable `DiscoveryIndex` is constructed after the existing navigation and Type registry. The kernel always authenticates its runtime and fixed 32-byte success marker. The namespace owner can attach one exact Type whose registry validator is the reviewed Uint256Validator, choose required/tolerated maintenance, restart, or detach. These operations apply only to `msg.sender`; an EOA cannot opt a producer contract into paid maintenance on its behalf.

The query universe is **currently linked non-directory files of exactly Type T in one native namespace**. Duplicate bytes at two FileIds are two results. Unplaced admitted records are outside this universe. Attachment captures the all-created file inventory high-water N, including root/directory/unlinked ordinals. Permissionless bounded backfill reads current state over `[0,N)`; hooks maintain later creates and edits/moves/unlinks anywhere. Exact frontier/epoch checks reject replayed or stale chunks. Per-file prior bucket/position makes edit-before-backfill and revisits idempotent without adding a mandatory file-to-ordinal storage slot.

Health values are `UNSUPPORTED=0`, `BUILDING=1`, `READY=2`, `DIRTY=3`. `probe` returns `UNKNOWN=0`, `PRESENT=1`, or `ABSENT=2`; BUILDING misses are always UNKNOWN. BUILDING pages are never COMPLETE, even at local exhaustion. DIRTY, unsupported and stale-epoch queries revert, never expose a stale positive or an authoritative empty result. Page cursors bind chain, index contract, namespace, epoch, value and mutation generation; end cursors are checked too. Reads during child processing are rejected.

The coordinator reserves 100,000 gas and supplies at most 350,000 to its onlySelf maintenance child. Required child failure reverts the operation. Tolerated child failure rolls back child writes and persists DIRTY in the successful outer frame. Normal later writes cannot heal it: restart increments epoch and rebuilds fresh private membership. Kernel-to-coordinator calls are capped at 600,000 gas and always fail closed; wrong code, revert, malformed return or insufficient outer gas cannot be tolerated. There is no production fault toggle or arbitrary worker.

## Matched actual receipt costs

[Complete four-arm receipt/provenance data](discovery-comparison.json) compares the reviewed history-optimized **bf566dc** kernel with current no-profile, required and tolerated profiles. Earlier history and baseline JSONs are unchanged. Required/tolerated success costs below are identical.

| Action | bf566dc, no coordinator | Current, no profile | Attached required/tolerated |
|---|---:|---:|---:|
| Kernel deployment, including children | 3,716,090 | 5,034,158 | 5,034,158 |
| Fresh direct scalar create, `new-2` | 531,529 | 539,475 | 645,298 |
| Same-record/same-value edit | 113,066 | 121,031 | 147,961 |
| Fresh cross-value edit | 233,252 | 241,218 | 344,661 |
| Cross-value edit to existing record | 115,878 | 123,843 | 187,386 |
| Move, unchanged membership | 208,499 | 216,457 | 245,387 |
| Cross-Type edit/removal | 297,206 | 305,171 | 339,797 |
| Unlink after backfill | 117,481 | 125,369 | 166,328 |
| Existing contract-producer scalar update, producer has no profile | 237,597 | 245,563 | 245,563 |

The no-profile producer update premium is **7,966 gas**, leaving only 4,437 below the provisional 250k ambition. Do not substitute the direct scalar edit's 241,218 for the contract-producer result. An attached fresh cross-value edit adds another **103,443** above the current direct no-profile edit. Attach-required costs 155,958; three bounded chunks `[0,2)`, `[2,4)`, `[4,5)` cost 109,024 / 139,797 / 149,152. Membership distribution, initialized storage, deduplication and zero/nonzero values matter; these are exact workload results, not universal constants. Every transaction starts with cold access sets.

## Qualified read benefit

At the required arm's pinned block `0x39`, the source has **37 created positions**: one root and 36 regular files; two files are unlinked and one remaining live file has another Type, leaving **33 eligible files**. Value 1 has eight matches. The complete source oracle is reconstructed at that same block/hash and compared to every queried result set. Chain/genesis/kernel/deployment/code/block identity is retained with each read in the JSON.

| Read | eth_call count | ABI return bytes | Execution estimate |
|---|---:|---:|---:|
| Full all-created inventory plus independent file/record point reads | 72 | 12,832 | 2,197,693, summed independent estimates |
| Qualified value-1 page, eight FileIds, COMPLETE | 1 | 480 | 56,387 |
| Qualified value-9 page, one FileId, COMPLETE | 1 | 256 | 38,311 |
| Qualified value-999 page, no FileIds, COMPLETE | 1 | 224 | 35,740 |

The scan number is the **sum of independent `eth_estimateGas` calls**, each including intrinsic gas and cold starts. It is not one equivalent onchain scan transaction and not paid gas. This straightforward uncached point-read scan is a control, not the best possible batched/cached reader. HTTP totals additionally include per-read before/after block-hash checks and estimate requests: 288 for the scan and four per index page; observation acquisition precedes these totals. Query pages return IDs, not hydrated file bodies. RPC-observed qualification is not a cryptographic state proof.

## Actual failure receipts, separately qualified

[Failure evidence](discovery-failures.json) deploys a **test-only source driver and coordinator subclass**, which forwards reads to real native kernel state and performs real membership writes before injecting a revert or exhausting the child gas. It does not replace the production kernel's immutable coordinator, and these receipts are not production hook premiums.

| Fault | Required receipt | Tolerated receipt |
|---|---:|---:|
| Child partial-write then revert | 364,988, reverted | 348,586, source commits / DIRTY |
| Actual child OOG | 631,347, reverted | 614,945, source commits / DIRTY |
| Actual outer OOG in 1,000-gas fail-closed driver call | 251,785, reverted | 251,785, reverted |
| Fresh epoch rebuild following child fault | 191,700 | 194,500 |

The driver verifies kernel metadata, navigation continuation and profile status before/after required/outer failure, child sentinel rollback, DIRTY positive/negative refusal, and fresh-epoch recovery. Production-kernel integration is separately checked with Foundry call interception for child/outer failures and malformed fixed markers, code substitution, low supplied gas and all-three-contract rollback. Arbitrary dishonest workers are intentionally not supported. External test-driver success actions retain SDK `MINED_UNVERIFIED` plus explicit `benchmarkCanonicalCheck` rather than pretending the general SDK knows this fixture's semantics.

## Reproduce and provenance

From the experiment directory:

```sh
node --test --test-concurrency=1 test/*.test.mjs
node scripts/discovery-benchmark.mjs
node scripts/discovery-failures.mjs
```

From `contracts/`: `forge test -vv` and `forge build --sizes`. Do not run finite worlds/builds concurrently. Scripts terminate their owned nodes and remove exact owned caches; all five retained worlds confirm cleanup. No persistent server or existing demo world is changed. These commands replace only the two new discovery JSONs, not earlier evidence.

The pre-change artifact was captured before any contract edits, with every metadata source verified against `bf566dc0e26f486364947f82fadcd87149c01d59`. Its creation hash is `0x0590ad9a9f80efea7584a827509b9dcdb742f2d097d44c00e66390cddef94bc5`; current creation hash is `0x47348a246e469409904e5a1f4583fd7665d13519ded54744d1ffda171c62df39`. Historical API fragments remain byte-for-byte ABI entries in the additive current API. Solidity 0.8.30, optimizer 200, via-IR, Cancun and the existing 16,777,216 transaction ceiling remain unchanged. Runtime sizes: kernel 9,549 bytes, discovery 5,435, navigation 5,117; kernel initcode 23,269, all below ordinary limits.

The measured checkout context was `8a4b029d2216dde73bd702d347d6d7cecc5851d0` **with this implementation uncommitted at measurement time**. Exact compiler metadata/source hashes and runtime/creation hashes, not that context commit alone, pin the measured implementation. Failure fixtures additionally pin their exact test source and artifact hashes.

Verification checkpoint: **68 Solidity tests passed**, including 12 discovery tests and all retained history/Type/native/example tests; **10 serial Node/browser tests passed**, including all seven pre-existing tests. A subsequent focused three-test discovery run also verified successful 1+1 pagination and an empty valid end cursor. Fixed gas caps, single-profile policy, retained old epoch storage and swap-pop ordering are prototype choices. No bitmap crossover, wider scale claim, image-tag join, browser discovery UI, production readiness or architecture adoption is asserted.
