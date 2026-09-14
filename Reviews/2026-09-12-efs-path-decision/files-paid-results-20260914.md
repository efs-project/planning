# Actual compact Files receipt economics

September 14. **One bounded local run, independently reviewed and approved.**
This prices a real but small Files graph in compact B. It is not a new MUD
comparison, a complete browser or proof that the whole EFS feature set is cheap.

## Useful result

| Whole transaction | Gas | Calldata bytes |
| --- | ---: | ---: |
| Create File, publish root revision, set HEAD and folder placement | 1,289,277 | 1,988 |
| Add File-scoped project tag | 523,569 | 868 |
| Add root-revision draft tag | 523,557 | 868 |
| Signed fresh child revision and HEAD update | 708,640 | 1,316 |
| Genuine contract-authored competing revision and HEAD | 777,820 | 932 |
| Add selected-revision approval tag | 523,544 | 868 |
| Checked paid point read, Alice-first / Bob-first | 197,363 / 204,877 | 324 each |
| Complete folder with File-scoped tag, Alice-first / Bob-first | 269,336 / 284,384 | 388 each |
| Complete folder with selected-revision tag, Alice-first / Bob-first | 269,360 / 280,014 | 388 each |

The six writes total **4,346,407 gas**. Nine deployments and three configuration
transactions cost **13,731,683 gas**, reported separately rather than hidden or
charged to every file. The six read alternatives sum to 1,505,334 solely for
experiment accounting; an app does not need to buy all six. Each is a separate
outer transaction without cross-transaction warm-storage sharing. All rows
include required index callbacks and relevant forwarding/event costs.

These are still substantial costs, particularly a standalone tag at roughly
524k gas. The result makes compact Files worth pursuing; it does not justify
retaining a new revision for every swap or game tick. A live contract-backed
file remains a different useful profile, not free immutable history.

**Do not subtract these rows from the old 5.06M/7.7M richer file recipes or
the matched Quote/MUD table and call the difference feature-equivalent savings.**
This is the first price for this exact real Root/Child Files recipe. The
separately matched [[b-parity-paid-results-20260913|Quote comparison]] and
[[required-query-paid-results-20260914|required-query challenge]] remain intact.

## What actually ran

One File, three real 17-byte note revisions, one hashed folder/name placement,
two independent authors and both tag scopes. Alice signs real action vectors;
Bob is a contract calling native ingress. The mandatory parent rule checks
same-File ancestry; the required index retains the two children of R0 at their
first admissions. Six same-basis reads choose RA for Alice-first and RB for
Bob-first, then apply tags to the actual selected File or revision. Bob's
approved-revision folder is **COMPLETE and empty**, not missing coverage.

The independent oracle was prepared before the chain run. It derives all six
full result encodings, 247 modeled storage coordinates, identities and patched
runtime bytes from literal actions and pinned compiler output. The final audit
checks 24 signed outer transactions, exact logs/receipts, all nine runtimes and
the modeled cells at both the post-write and post-read seals. Four corruption
controls reject a missing transaction, altered signature integer, fabricated
read answer and wrong selected HEAD. Gas is derived from receipts, not a
candidate's cost summary. The 247 checked cells are **not** an exhaustive
storage-growth measurement.

The wrapper first failed its genuine expected-event test, then passed with the
same assertions. Lifecycle tests separately passed 120/120 and independent
task/final review: real rename, move, pathname reuse, whiteout and atomic
restore. Their receipts are **not priced by the table above**. The small churn
case still needs four retained-name scans for one live file; efficient churned
directory enumeration remains open.

## Provenance and honest repairs

Source commit: `de56345e07863d46d656b4a1a077348de7d2c25d`.
Frozen source digest: `ac5481077ab59ad11131e861f6ed2722c27377d93b043a916aeae446a3e2360c`.
Raw packet SHA256: `80f7b6ac5a81d44ce46c7d107bb4f332b341bbfde24512bcd1c368bbe7d5906a`.
Retained packet: [audited Files evidence](https://github.com/efs-project/planning/tree/f446bc6852a144c4795c3d229ccc5f205dadcb4d/Reviews/2026-09-12-efs-path-decision/lab-b/files-paid-20260914)
on the isolated B branch. Root verified all53 compressed payloads against
original hashes and decompression roundtrips before publication.

`files-paid-1` was a **pre-Anvil refusal**, not a failed or expensive chain run:
pretty-printed compiler evidence exceeded the prelaunch budget. Compact JSON
of the same values fit. `files-paid-2` is the sole actual run, from 11:48:29 to
11:48:31 UTC, followed by owned-process cleanup and slot release.

The original audit compared RPC signature r/s as padded strings, causing a
false failure for numerically equal values. A separately retained and reviewed
fork compares those quantities as integers and supplies a Node assertion
message. All expected IDs, state, signatures and full result structures remain
unchanged. The external frozen preparation is identical to both oracle versions
and the packet's preparation. No answer was adjusted to match the candidate,
and no chain rerun was needed. Original and corrected sources are retained.

Solidity 0.8.30, viaIR, optimizer runs200, Cancun; loopback Anvil chain31337,
30M block gas, bounded private history/cache. Actual deployed runtimes and
deployment initcode fit normal EVM limits. The largest measured candidate
runtime is Ledger at 17,280 bytes; the Files consumer is 15,896 and read wrapper
2,908. Oversized Foundry test orchestration is not deployed candidate evidence.

## Still unearned

- Current chain dollar affordability: 2 gwei was a fixed local parameter, not
  today's Ethereum/L2 fee quote or a DA-inclusive estimate.
- Persistent storage growth, lifetime cost, large directories, many-author
  Lenses, cold filename reconstruction, browser/SDK integration and complete
  Files lifecycle economics.
- Authenticated source-chain state proofs or historical native-contract
  authorship portability. These are joined local RPC observations, not trie
  proofs; retained build output is not independently reproduced compilation.
- Populated compact-testnet upgrades, privacy and carrier failure integration.

The separate [[files-withdrawal-probe-plan-20260914|withdrawal probe]] addresses
a reader semantics bug discovered after this frozen run. Its findings or any
fix must not be retroactively attributed to these costs or source pins.
