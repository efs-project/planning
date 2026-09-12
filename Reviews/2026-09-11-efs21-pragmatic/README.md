# EFS 2.1 native Files experiment

**Standing:** isolated candidate / cost experiment, not adopted EFS v2 architecture or a production client. See [contract interface](contracts-interface.md) and [measurement boundaries](measurement.md). The original native-profile baseline below is retained separately from the [same-profile history-storage optimization](evidence/history-storage.md). A full-v2/control implementation is not included in this native browser arm.

## Run locally

From this experiment directory, with Forge/Anvil and Solidity 0.8.30 available:

```sh
node --test --test-concurrency=1 test/*.test.mjs
node scripts/demo.mjs
```

The canonical full-suite command uses `--test-concurrency=1`: only one new managed world / Forge build runs at a time. The original benchmark ran the same finite workload twice on separate owned nodes, saving compact [run 1](evidence/benchmark-1.json) and [run 2](evidence/benchmark-2.json), then closing each node and removing its exact cache directory. Historical benchmark scripts overwrite their named outputs; do not casually rerun them on a later checkpoint and replace the retained evidence. No full traces are retained. The demo prints a separate loopback URL; Ctrl-C/SIGTERM closes its server and managed node. An 18-hour watchdog keeps an evening launch available through the morning checkpoint, then terminates it. Finite native benchmark/test nodes retain their five-minute watchdog. No periodic mining is enabled: history grows only with local actions. The old Files demo/port is untouched. The demo process stays foreground; do not treat it as production hosting.

Dependencies reuse the installed pinned ethers 6.15.0 / Playwright bundle in `../2026-09-04-mvp-rehearsal/node_modules`; no new framework or installation. Forge builds this candidate's own project with ordinary EIP-170 size checks and 16,777,216 per-transaction/block gas ceiling. `NativeKernel` deploys its own navigation and registry internally; their costs are included in its setup receipt, not separately fabricated receipts.

## What the page does

Nested folder breadcrumbs, actual contract-backed file table, create text/file/folder, verified exact bytes, fatal UTF-8 detection, binary download, text revision, rename, unlink confirmation, retained revision history and page reload. Names are rendered as text, not HTML; printable ASCII percent sequences remain literal. Uploads cap at 4032 bytes; directories cannot move/rename; file move is measured in the benchmark but the page offers same-folder rename only. The page does not inline uploaded HTML or guess MIME types. Large-client bounds: 4096 listed entries and 128 history revisions, with visible errors on overflow.

The page signs directly against its owned loopback Anvil with a **fixed, public disposable development key**, never a real wallet. Never fund this signer on another network. Chain ID, genesis, kernel runtime hash and deployment block/hash are guarded. Config/JS/files are served through an exact allowlist; there is no backend signing API, proxy, authoritative database or public RPC option. A malicious local webpage/process can still reach this disposable developer node; this is not a security boundary for valuable assets. The server checks its exact loopback Host header.

Reads carry chain/genesis/kernel/code/deployment and block number/hash qualification. Lists pin one observation, retain checked index generation and reject stale cursors. SDK writes report `COMMITTED` only after effect-specific canonical state read-back at the receipt block/hash; raw external-example transactions remain `MINED_UNVERIFIED` until separately asserted by the benchmark. Reverted transactions remain in the gas journal. RPC failures never become empty folders. Trusted RPC observations are not cryptographic state proofs.

The floating gas drawer shows actual local receipt gas and **dated execution-price models**, reusing the 11 Sep 2026 cost preset. It excludes actual L2 posting/compression/sequencer/operator fees; no live RPC quote is fetched. The button and drawer show running known-receipt totals plus unresolved/unknown counts. Missing gas is unknown, never zero. Journal entries persist in this browser's local storage under the exact deployment identity, including across page reload. They are not authoritative chain state. The demo also seeds `/swaps/eth-usdc` in the producer contract's namespace; the diagnostics button invokes a separate deployed consumer.

Before submission, the client computes and journals the signed transaction hash. Lost submission or polling responses retain `SUBMISSION_UNKNOWN`; receipt-confirmed but unverified effects retain `VERIFICATION_UNKNOWN`. Either state blocks all new writes, even after page reload. **Reconcile unresolved action** only reads the same transaction's receipt and canonical receipt-block state; it never resends. An absent receipt keeps the hold because absence is not proof of non-submission. Failed path/list reads discard the writable folder; hash changes, Back/Forward and in-flight navigation cannot reuse an old target. Only a successful identity-qualified path/list read enables folder mutations.

## Original native baseline: observed receipt results

Both retained fresh-world runs returned the same gas numbers (different block/transaction identities are retained). Compiler/source/runtime and exact supporting-file hashes are in each JSON. The actual retained `sourceCommit` is **03e4696b1ecbcafc8cf3499c5477481bd2a7b83e**, with contract logic unchanged from reviewed **aa6b1b6**; support hashes pin the Task 2 working files used for that measurement. Those JSONs are the prior benchmark checkpoint, not a rerun of the later reconciliation/navigation fixes. No code-level slot-count trace was collected.

| Action | Receipt gas |
|---|---:|
| Kernel including navigation/registry deployment | 3,723,287 |
| Namespace initialization | 221,484 |
| Directory creation | 413,600 |
| First 41-byte regular file, cold caller/list use | 640,934 |
| Subsequent new 41-byte file, unique content | 604,894 |
| Second file, deduplicated 41-byte content | 424,638 |
| First and subsequent fresh-content 41-byte edits | 350,271 |
| Same-content 41-byte edit, new retained revision | 163,536 |
| File move + rename | 240,871 |
| Unlink file | 134,942 |
| Reverted tombstone edit | 26,528 |
| Contract producer initial uint256 quote | 592,176 |
| Contract producer new-value uint256 update | 284,631 |
| Separate consumer transaction | 77,277 |
| Plain mapping initial / later setter | 44,066 / 26,966 |

The complete new short-file action is under the provisional 1M ambition; **fresh-content steady edits miss the 250k ambition**. The cheaper same-content edit is deduplication, not the main steady-edit result. Byte-profile bodies include ABI framing (41 payload bytes → 128 body bytes); quote bodies are exact 32-byte uint256 encoding. Every transaction starts with cold EVM access sets; “steady” means previously initialized persistent state, not cross-transaction warm accesses. Type/validator deployment and registration receipts, fixture setup, all calldata sizes and named receipts are retained separately.

Payload creation gas: 0 bytes 537,742; 32 bytes 581,308; 41 bytes 605,814; 256 bytes 741,384; 4032 bytes 3,425,395. A 4096-byte payload is explicitly rejected (4096 is the encoded-body limit, not payload capacity).

Hydrated listing of 1 / 16 / 32 entries returns 544 / 5344 / 10464 ABI bytes and estimates 61,441 / 359,076 / 678,413 execution gas. Each page uses **one hydration eth_call**; the reported four HTTP/logical RPC calls include two block-hash checks and a separate estimateGas request. Acquiring the reusable identity-qualified basis happens before that per-page measurement. These reads are not paid transactions. Full same-basis 16+16 continuation is checked independently.

The plain mapping deliberately lacks Types, stable FileIds, paths, inventories, retained revision history and existence semantics: **not semantic parity**. The old full-v2 receipts in [measurement.md](measurement.md) remain historical context, not a newly matched comparison or percentage saving claim.

## History-sharing checkpoint

The history-only checkpoint shares immutable location snapshots between edits/unlinks instead of storing the same parent/name in every revision. At that checkpoint, public revision values and ABI, exact Types/Records, validation, authority, CAS, required indexes and history stayed unchanged. This is a fresh-genesis internal storage change, not migration of either existing demo. Subsequent discovery adds an API/hook and its separately measured cost below.

Paired receipts: contract-produced uint256 updates **284,631 → 237,597 gas**, short-name 41-byte fresh-content edits **350,271 → 303,237**, same-content edits **163,536 → 116,496**. The separate consumer transaction remains **77,277**. Creation increases by 301 gas; the measured historical read estimates increase by 157 gas. The uint256 example meets the provisional 250k update ambition; the ABI-framed 41-byte file edit still does not. [Complete matched inputs, receipts, provenance, differential checks and tradeoffs](evidence/history-storage.md).

The original `benchmark-1/2.json` files above have not been overwritten. Running `scripts/benchmark.mjs` again would replace those outputs with the current source's workload. The history script also replaces its comparison output; reproduce it only with deliberately separated output/source provenance, not as an ordinary demo startup step.

## Optional scalar discovery checkpoint

The current kernel also deploys a separate `DiscoveryIndex`. Namespace owners can attach one exact uint256 equality profile, choose required or tolerated maintenance, backfill old files in bounded chunks, restart or detach. Basic navigation remains mandatory. This is a contract/test surface; the Files page does not yet expose search controls.

Compared with the history-only checkpoint, no-profile producer updates cost **237,597 → 245,563 gas**. An attached profile costs more: the direct fresh scalar edit is **241,218 without a profile / 344,661 with one**. In the 37-position source fixture, a qualified eight-match query needs **one eth_call instead of 72** for the straightforward uncached source scan; results are FileIds, not hydrated bodies. It is not a comparison against an optimized batched reader or a single onchain scan transaction. [Actual receipts, read qualification, failure isolation and limits](evidence/discovery.md).

Required-index failure rolls back the file operation. Tolerated maintenance failure preserves the file operation but marks the profile DIRTY; its queries cannot claim stale positives or complete empty results. BUILDING remains partial until the pinned source prefix is covered and concurrent changes have been maintained. These are bounded current-file semantics, not full-C0 occurrence coverage or an image-tag relationship implementation.

The prior `history-comparison.json` remains its pure-history source checkpoint. Re-running the history script now compares the original kernel against the current history-plus-discovery source; do not label that rerun a pure history ablation.

## Verification / limitations

### Separate full-C0 allocation experiment

This worktree also contains a narrowly changed **fuller C0/Files control**, not used by the native browser above. It avoids eagerly allocating unused journal structs; all existing records, validation, indexes and history stay in place. Independent review approved; root reproduced 209 C0 Solidity tests and six paired-evidence checks. The measured production source matches the retained candidate source hash.

Matched seven-record 41-byte creation is **7,620,832 → 6,622,789 gas**, plus unchanged 149,369 staging (**7,770,201 → 6,772,158 total**). Three-record edit is **3,610,796 → 3,313,533**, plus separate staging. Exact ACTIVE retry has a 12-gas receipt regression; it is not presented as a saving. Admission-library runtime is 24,481 bytes, only 95 bytes below EIP-170. [Exact results, source/runtime pins, verification coverage and limits](evidence/journal-allocation.md).

This is a same-semantics implementation saving, unlike comparing the reduced native profile wholesale with full v2. It does not resolve expensive retained storage, the known legal-large-Type cache limitation, or full protocol readiness.

### Native browser scope

The Node suite exercises actual contracts and a real Chromium browser, including create → open → edit → rename → full page reload → historical bytes, nested binary upload → unlink, and forced RPC failure. It checks independent record-ID derivation, retained history, wrong identity, malformed IDs, stale block observation/cursor, bounded pages, transaction ceiling and owned-cache cleanup. Review regressions cover committed transactions with dropped submission/poll responses, read-only reconciliation without nonce increase/resend, persisted write holds, failed-navigation write attempts, manual hash navigation and a hash change during a paused read. [Test-first record](evidence/tdd.md), [prior-checkpoint browser](evidence/browser.png), [prior-checkpoint gas drawer](evidence/gas-drawer.png). Screenshots are refreshed only with `EFS21_CAPTURE_SCREENSHOTS=1`; routine tests preserve the existing evidence files.

Missing full-v2 semantics remain missing: portable signed authorship/Principals, plural Lenses, relational tags/general discovery, generic binding/occurrence families, arbitrary validator programs, delegation, restore/multi-placement, mounts, Unicode names, external carriers/chunking, encryption and upgrades. All names/bytes are public and permanent. This is a native filesystem profile, not unchanged full-v2 functionality at lower gas.
