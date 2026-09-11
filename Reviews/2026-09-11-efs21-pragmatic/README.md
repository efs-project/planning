# EFS 2.1 native Files experiment

**Standing:** isolated candidate / cost experiment, not adopted EFS v2 architecture or a production client. See [contract interface](contracts-interface.md) and [measurement boundaries](measurement.md). No Solidity optimization or full-v2/control implementation is included in this browser/benchmark arm.

## Run locally

From this experiment directory, with Forge/Anvil and Solidity 0.8.30 available:

```sh
node --test test/*.test.mjs
node scripts/benchmark.mjs
node scripts/demo.mjs
```

The benchmark command runs the same finite workload twice on separate owned nodes, saves compact [run 1](evidence/benchmark-1.json) and [run 2](evidence/benchmark-2.json), then closes each node and removes its exact cache directory. No full traces are retained. The demo prints a separate loopback URL; Ctrl-C/SIGTERM closes its server and managed node. A 12-hour watchdog also terminates it. The old Files demo/port is untouched. The demo process stays foreground; do not treat it as production hosting.

Dependencies reuse the installed pinned ethers 6.15.0 / Playwright bundle in `../2026-09-04-mvp-rehearsal/node_modules`; no new framework or installation. Forge builds this candidate's own project with ordinary EIP-170 size checks and 16,777,216 per-transaction/block gas ceiling. `NativeKernel` deploys its own navigation and registry internally; their costs are included in its setup receipt, not separately fabricated receipts.

## What the page does

Nested folder breadcrumbs, actual contract-backed file table, create text/file/folder, verified exact bytes, fatal UTF-8 detection, binary download, text revision, rename, unlink confirmation, retained revision history and page reload. Names are rendered as text, not HTML; printable ASCII percent sequences remain literal. Uploads cap at 4032 bytes; directories cannot move/rename; file move is measured in the benchmark but the page offers same-folder rename only. The page does not inline uploaded HTML or guess MIME types. Large-client bounds: 4096 listed entries and 128 history revisions, with visible errors on overflow.

The page signs directly against its owned loopback Anvil with a **fixed, public disposable development key**, never a real wallet. Never fund this signer on another network. Chain ID, genesis, kernel runtime hash and deployment block/hash are guarded. Config/JS/files are served through an exact allowlist; there is no backend signing API, proxy, authoritative database or public RPC option. A malicious local webpage/process can still reach this disposable developer node; this is not a security boundary for valuable assets. The server checks its exact loopback Host header.

Reads carry chain/genesis/kernel/code/deployment and block number/hash qualification. Lists pin one observation, retain checked index generation and reject stale cursors. SDK writes report `COMMITTED` only after effect-specific canonical state read-back at the receipt block/hash; raw external-example transactions remain `MINED_UNVERIFIED` until separately asserted by the benchmark. Reverted transactions remain in the gas journal. RPC failures never become empty folders. Trusted RPC observations are not cryptographic state proofs.

The floating gas drawer shows actual local receipt gas and **dated execution-price models**, reusing the 11 Sep 2026 cost preset. It excludes actual L2 posting/compression/sequencer/operator fees; no live RPC quote is fetched. Journal entries are page-session-only and clear on browser reload; on-chain files/history do not. The demo also seeds `/swaps/eth-usdc` in the producer contract's namespace; the diagnostics button invokes a separate deployed consumer.

## Observed receipt results

Both retained fresh-world runs returned the same gas numbers (different block/transaction identities are retained). Compiler/source/runtime and exact supporting-file hashes are in each JSON. `sourceCommit` names the reviewed contract base; support hashes pin the Task 2 working files used for measurement. No code-level slot-count trace was collected.

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

## Verification / limitations

The Node suite exercises actual contracts and a real Chromium browser, including create → open → edit → rename → full page reload → historical bytes, nested binary upload → unlink, and forced RPC failure. It checks independent record-ID derivation, retained history, wrong identity, malformed IDs, stale block observation/cursor, bounded pages, transaction ceiling and owned-cache cleanup. [Test-first record](evidence/tdd.md), [browser](evidence/browser.png), [gas drawer](evidence/gas-drawer.png).

Missing full-v2 semantics remain missing: portable signed authorship/Principals, plural Lenses, tags/discovery, generic binding/occurrence families, arbitrary validator programs, delegation, restore/multi-placement, mounts, Unicode names, external carriers/chunking, encryption and upgrades. All names/bytes are public and permanent. This is a native filesystem profile, not unchanged full-v2 functionality at lower gas.
