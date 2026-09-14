# Independent C mined-control packet review — 2026-09-14

**Verdict: PASS_RPC_OBSERVED. No blocking packet inconsistency found.** This is observed local rollback/calibration evidence, not authenticated chain proof, B/C feature parity or a normal-product reprice.

Reviewed `/tmp/efs-c-controls-paid-20260914.MCwNJk` raw/report/audit, pins, launch record and retained supplement against the frozen independent expectations and earlier source/launcher reviews. Only offline Node reads and in-memory corruption checks were performed; no RPC, chain process, compiler, full suite, source or sealed-file mutation.

## Reproduced evidence

Invoked the frozen auditor independently: its returned audit exactly matches retained `audit.json` excluding its separately verified input-hash wrapper. It verifies 2,518 strict raw envelopes, 756 exact logical and 1,566 physical fixed-block replies, 27 signed transaction/receipt/header joins, 18 deployment initcodes and complete runtimes, three equal-from/to/data/5M static/mined links, and all 28 linked headers with 30M gas limits. Full 100-byte scale error and 36-byte lateIndex error are retained, not selector-only checks.

Separately reconstructed every state map directly by raw method/parameters/block, without using report success fields. Each state contains 126 logical and 261 physical observations. Both failed arms preserve all 387 observed values exactly from S0 to S1, including zero backing words and the existing prefix; highWater remains 6. Zero-poison calibration matches every literal S1 answer, highWater becomes 11, and 30 logical/89 physical values change. This makes unchanged failed state distinguishable from a fixture that never commits successfully.

Independently selected raw receipts by mined block:

| Arm | Pre → post | Status | Gas used |
|---|---|---:|---:|
| scale7 | 8 → 9 | 0 | 366,020 |
| lateIndex | 17 → 18 | 0 | 2,246,568 |
| calibration | 26 → 27 | 1 | 2,400,648 |

Both failed receipts have no logs. Signed attempts occupy their exact next blocks; static error attribution additionally depends on the reviewed fault source and identical pre-state/call parameters, not on a receipt carrying revert bytes.

In-memory corruptions were refused: lateIndex post-state orphan `Record.Quote.dynamic.0` (raw ID 1485), another zero backing word (1427), and a changed final byte of the full lateIndex error (1288). Original retained bytes were untouched.

## Pins, execution and qualifications

The exported supplement independently passes `PASS_RPC_OBSERVED_SUMMARIES`: 72 sealed files unchanged, six exact artifacts, 49 compiler-source files reconciled with metadata, and report gas/chain/source/gates/raw summaries checked. Sealed runner checkout is `84e1081e46163547e2928c12a4551233e8f07afc`; compiled Solidity attribution remains `2ca7349e5d683c3ff10651c0fc106c10da946145`, not the runner commit. Source/metadata checks do not independently reproduce compilation.

Launch-record pins equal the seal. The 01:08:48.307–01:08:51.569 UTC execution falls within its fresh lease, with loopback chain 31337/Cancun/30M, prune256/run-owned cache, exit zero and recorded owned-group termination. Final scratch was 131,914,010 bytes, free space 289,356,103,680 bytes. Root separately confirms no remaining heavy process; this review did not probe live processes.

Known tooling qualification retained: invoking the sealed supplement through `/tmp` can silently skip its CLI due to symlink entrypoint comparison. I used exported `checkPacket`; canonical `/private/tmp` is the other valid invocation. An empty output is not a passing audit. Retained `supplemental.json` now contains a populated passing result.

Raw SHA-256: `b04b3e018c968e71d584d46878d015acb08c9a190aaf83f81dcf874afdbf0658`; report: `31725c34d0c2869b9d28696657cf2f7b2dfeede529ade7734210234ac9bbfd8b`. These are number-qualified RPC observations joined to retained headers, not authenticated state proofs or EIP-1898 canonical calls. No internal-write trace, import/portability, full Files, adoption or normalized MUD-overhead conclusion follows.
