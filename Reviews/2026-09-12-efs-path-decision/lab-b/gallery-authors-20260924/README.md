# Actual multi-author gallery scale probe — stopped safely at 250

**Status:** Disposable local evidence, not a protocol, public-RPC, or mainnet feasibility claim. The intended **full 1,000-File traversal** was not run: the measured 100→250 Node RSS trend crossed the predeclared 768 MiB stop/go projection. A separate [fresh 1,000-File first-page-only probe](first-page-1000/README.md) later tested seed and prefix costs without a warm or full traversal. Neither run exceeded its hard caps.

The [runner](../script/measure-gallery-authors.mjs) grew one loopback-Anvil fixture from 100 to 250 distinct live File IDs. Alice placed every File in a one-author folder; eight funded signers placed those same Files round-robin in a separate eight-author folder. Thus all eight are actual *placement* authors, not empty selectors. File 0 also has an additional same-name placement by signer 1 and competing HEAD revisions; Alice wins the ordered HEAD selection. Alice authored the initial HEAD and the positive tag on every even selected revision. The extra overlay makes the eight-author raw candidate count 101/251 while the selected File count stays 100/250. This tests selected-revision filtering, not just stable-File tags.

| Files | Authors | SDK cold full traversal | SDK warm full traversal | Selected-revision result |
|---:|---:|---|---|---|
| 100 | 1 | 4 pages, 100 candidates, 60 ms, 13 logical/HTTP RPCs, 161,152 response bytes | 4 pages, 37 ms, 8 RPCs, 13,944 bytes | 50/50 expected; all returned name, header, tag and match qualifications `PRESENT`/`MATCH` |
| 100 | 8 | 4 pages, 101 candidates, 67 ms, 20 RPCs, 161,424 bytes | 4 pages, 35 ms, 8 RPCs, 13,936 bytes | 50/50 expected; same complete qualifications |
| 250 | 1 | 8 pages, 250 candidates, 121 ms, 25 RPCs, 393,361 bytes | 8 pages, 92 ms, 16 RPCs, 27,872 bytes | 125/125 expected; same complete qualifications |
| 250 | 8 | 8 pages, 251 candidates, 190 ms, 32 RPCs, 393,632 bytes | 8 pages, 98 ms, 16 RPCs, 27,856 bytes | 125/125 expected; same complete qualifications |

All SDK reads used a single pinned basis per width and budget 32; full traversal checked exact File IDs, terminal `COMPLETE` coverage, and candidate counts. These are local loopback timings, not public-RPC latency estimates. The full [measurement JSON](measurement.json) records pin costs, first-page latency, HTTP request bytes, per-page qualification counts, source/artifact hashes, and checkpoints. It records zero fetched body bytes: header qualification does not verify content bodies.

The paid consumer made real signed transactions, with a maximum 16,777,216 gas limit per transaction. Its caller-bound continuation required reading the same pinned page with `eth_call.from` set to the paid contract; a direct-reader cursor demonstrably reverted on the second paid page because the reader includes `msg.sender` in its query hash. The corrected run had no paid reverts. **Historical paid-query limitation:** this 100/250 run encoded `tagScope=1` (stable File), not the SDK's selected-revision scope. No stable File tags were present; decoding all 28 paid `Observed` events confirms zero returned rows across 108 scanned candidates. Thus the paid gas below is a *negative-filter control*, not positive selected-revision gas. The separate [1,000-File first-page probe](first-page-1000/README.md) corrects the paid scope and requires a positive event.

| Files | Paid read | Pages / candidates | Gas total | First / max page gas |
|---:|---|---:|---:|---:|
| 100 | 1 author | 1 / 4 | 816,957 | 816,957 / 816,957 |
| 100 | 8 authors | 13 / 50 | 13,709,655 | 973,682 / 1,185,148 |
| 250 | 1 author | 1 / 4 | 816,957 | 816,957 / 816,957 |
| 250 | 8 authors | 13 / 50 | 13,317,731 | 973,682 / 1,152,533 |

Across both stages, 98 signed setup transactions consumed 456,323,279 gas (including funding, two directories, concept, Files, names, HEADs, tags and placements; excluding 29 environment deployment/bootstrap transactions). The 28 paid-read transactions consumed 28,661,300 gas. The [signed transaction/receipt log](transactions.jsonl.gz) and [manifest](manifest.json) preserve exact inputs and observed local receipts. The paid wrapper emits a digest and does not return a continuation; the offchain `eth_call` supplied each next cursor. Consequently the evidence proves bounded per-page contract execution, **not** a single autonomous onchain transaction consuming 50 or 1,000 gallery candidates.

## RSS stop/go

Values below are Node RSS MiB, sampled after each SDK operation. Forced GC after each traversal and after the SDK went out of scope did not restore RSS.

| Files | After seeding | 1-author pin / cold / warm / released | 8-author pin / cold / warm / released | Stage-end / peak |
|---:|---:|---:|---:|---:|
| 100 | 166 | 169 / 215 / 260 / 260 | 260 / 331 / 332 / 332 | 330 / 332 |
| 250 | 284 | 276 / 290 / 368 / 368 | 368 / 655 / 674 / 674 | 662 / 679 |

At 250 after releasing the eight-author SDK and forcing GC, the live V8 heap was ~16 MiB and external memory ~4 MiB, while RSS remained ~674 MiB; retained in-memory environment transaction JSON was ~1.8 MiB. This rules out retained receipt objects or a still-live SDK context cache as the dominant *live JS* memory. The RSS high-water growth appears tied to allocations during the SDK/transport traversal (the precise native allocator source is unproven). Extrapolating the observed 100→250 stage-end slope to 1,000 yields ~2,326 MiB, well above the 768 MiB cap. The maximum actual Node peak was 679 MiB. Anvil RSS, output bytes, transaction count and time were below their respective 1,536 MiB, 256 MiB, 650-transaction and 15-minute caps.

One bounded follow-up harness design would keep the owned Anvil fixture in a supervisor and run each width/temperature traversal in a short-lived **read-only child process**. Each child would receive the manifest, pinned basis and loopback URL, return only compact metrics/result IDs, then exit before the next traversal; the supervisor would still enforce aggregate transaction/output/time caps. This may release allocator high-water memory between traversals, but it is a proposal, not a tested 1,000-File result. It must not omit candidates or silently weaken the exact-context qualification checks.

Artifacts were compiled offline with solc 0.8.30 into a run-owned `FOUNDRY_OUT`; the full source hashes are in `measurement.json`. `node --check` and `--self-test` passed, and the integration runner verified the 100- and 250-File cells before its intentional `UNSAFE_1000_TREND` exit. The raw run report's machine-local scratch paths were removed from the committed copy; no GitHub push or owner protocol choice follows from this probe.
