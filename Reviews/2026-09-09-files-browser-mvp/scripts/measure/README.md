# Gas measurement harness

Reproducible capture of per-transaction gas for the files-browser routed
operations, with every component reconciled to the receipt and every written
storage slot classified and attributed to its `StateStore` family. Written to
replace the ad-hoc scratchpad scripts (`slots.mjs`, `opcodes.mjs`,
`calltree.mjs`, `inside-lib.mjs`, `marginal.mjs`, `sstore-detail.mjs`,
`depth-cost.mjs`) whose numbers were reported in
[`gas-engineering-2026-09-10.md`](../../gas-engineering-2026-09-10.md)
without retained traces. The reconciled write-up is
[`gas-baseline-2026-09-10.md`](../../gas-baseline-2026-09-10.md).

Everything is relative to this review folder; no absolute paths.

## Commands

Run from `Reviews/2026-09-09-files-browser-mvp/`:

```sh
node scripts/measure/baseline.mjs --run 1 --sequence default
node scripts/measure/baseline.mjs --run 2 --sequence default      # determinism repeat
node scripts/measure/baseline.mjs --run 3 --sequence lead-marginal  # replay of scratchpad marginal.mjs order
node scripts/measure/baseline.mjs --run 4 --sequence lead-slots     # replay of scratchpad slots.mjs order
node scripts/measure/report.mjs                                     # tables.md + index.json (sha256 of every file)
```

Options: `--out <dir>` (default `evidence/gas-2026-09-10`), `--only id1,id2`,
`--skip-file`. Caveat for `--only`: chunk-store slot attribution derives its
key universe from the `ChunkTree` record, so a `--only` selection that omits
the dependent `createFile-*` operation reports `stageChunk` writes as
`UNATTRIBUTED` (6/6 in the verification run); include the file op or accept
that label. A run takes about a minute after compilation; each run spawns
its own anvil. The four retained runs occupy ~130 MB, almost all of it the
gzipped full traces (3–9 MB each). Do not run the harness concurrently with
the node suites: both call `forge build` into the same `contracts/out`.

The harness sets `EFS_LAB_ANVIL_STEPS=1` itself so the lab starts anvil with
`--steps-tracing` (without it `debug_traceTransaction` returns an empty
`structLogs`).

## What is measured, and how

Fixture path: exactly what the node suites use —
`startEnvironment(lab, { write: true, relay: false })` from
`scripts/environment.mjs`, i.e. `nestedFixture` → `routerFixture` (V1 router +
type group) → `authorityFixture` (U3 upgrade of the populated pair, FilesRouterV2,
principal claims). Operations are submitted with `authorityFixture.execute`
(one author signature, `FilesRouterV2.execute` → `Core U3.executeAuthorized`)
and `authorityFixture.stageChunks` (carrier `stageChunk`), the same calls
`test/authority.test.mjs` makes. Nothing is relayed; no browser.

Per transaction (`evidence/gas-2026-09-10/run<N>/<opId>/`):

| file | content |
| --- | --- |
| `receipt.json`, `tx.json` | `eth_getTransactionReceipt`, `eth_getTransactionByHash` (calldata, gas limit, access list) |
| `trace.json.gz` | the **complete, unmodified** `debug_traceTransaction` response, stack enabled, memory and storage snapshots disabled (`disableStack:false, disableMemory:true, disableStorage:true`). 0.5 MB (chunk staging) to 267 MB (createFile) raw, up to 8.5 MB gzipped. Streamed to disk while being scanned; never fully resident. |
| `prestate-diff.json` | `prestateTracer` in `diffMode` (independent pre/post storage view used as a cross-check) |
| `calltree.json` | `callTracer` (independent per-frame `gasUsed` used as a cross-check) |
| `storage-ops.json` | every SSTORE/SLOAD step: step index, depth, slot, value (SSTORE) |
| `analysis.json` | everything derived: reconciliation, opcode categories, per-contract self gas, each SSTORE classified and attributed, per-slot census, SLOAD by family, call overheads, checks |

Per run: `environment.json` (tool versions, node args, git revision and
dirty state, deployed addresses), `store-keys.json` (the `StateStore`
ordinal indexes read at the final block), `posting-key-labels.json`,
`summary.json`.

### Gas model (lib/gas.mjs)

* **Consumption per step** = `gas` of the step minus `gas` of the next step in
  the same frame. For a CALL-family step that delta includes the child frame;
  the step's own **call overhead** is the delta minus the child frame's
  consumption (the child's first step gas minus its remaining gas). The
  `gasCost` field of a CALL-family step is the gas *forwarded* and is never
  summed. The last step of every frame consumes its reported `gasCost`.
* **Categories**: SSTORE, SLOAD, KECCAK256, LOG, CALLDATA
  (`CALLDATALOAD/COPY/SIZE`), MEMORY (`MLOAD/MSTORE/MSTORE8/MCOPY/MSIZE/RETURNDATA*`),
  STACK (`PUSH/DUP/SWAP/POP`), CONTROL (`JUMP*/JUMPDEST/PC/STOP/RETURN/REVERT`),
  ARITH, CODE (`CODECOPY/EXTCODE*`), ENV, CALL_OVERHEAD (non-precompile call
  bases incl. cold-account 2,600 / warm 100 and memory expansion),
  PRECOMPILE (ecrecover: 3,000 + access). The sum of categories equals the
  trace's gross execution gas (first-step gas − remaining gas after the last
  step); the harness asserts this.
* **Intrinsic** = 21,000 + 4 gas per zero calldata byte + 16 per nonzero byte
  (+ access-list cost, always empty here). Cross-checked against
  `gasLimit − first-step gas`. The EIP-7623 floor (21,000 + 10 × tokens) is
  reported but not applied: the lab runs `--hardfork cancun`.
* **Refund**: recomputed per SSTORE from EIP-3529 and compared with anvil's
  cumulative `refund` field; applied refund = min(refund, gasUsed / 5).
* **Reconciliation**: `intrinsic + gross − refund == receipt.gasUsed`, residual
  reported per transaction (0 in every retained run).
* **SSTORE classification** (per write): original value = `eth_getStorageAt`
  at the previous block (automine: one transaction per block, asserted);
  current value = tracked through the ordered writes; warm/cold = whether the
  (context address, slot) was already SLOADed/SSTOREd in the transaction
  (EIP-2929). Classes: `FRESH` (original 0, first write, nonzero),
  `COLD_REWRITE` (original nonzero, first write in the tx, different nonzero
  value — "cold" in the EIP-2200 clean/dirty sense; the access itself is
  usually already warm because the kernel replay reads the slot first),
  `WARM_REWRITE` (slot already written in this tx), `NOOP` (same value —
  includes writing zero to a zero slot), `CLEAR` (nonzero → 0), `RESTORE`
  (dirty slot back to original). Every write's charged gas is compared with
  the EIP-2200/2929 model; mismatches are counted (0 in every retained run).
  Per-slot final classes: `FRESH`, `REWRITE`, `CLEARED`, `UNCHANGED`,
  `UNCHANGED_ZERO`.
* **Storage context**: DELEGATECALL frames inherit the caller's storage
  address; CALL/STATICCALL frames use the callee. Slots are keyed by
  `address:slot`.

### Slot attribution (lib/slots.mjs) — preimage derivation

No kernel instrumentation. The Core keeps `StateStore.Store` under the
ERC-7201 namespace `efs.fixture.store` (`namespaceRoots()` on the Core returns
the same slot). Member offsets follow the Solidity layout of `StateStore.Store`
(Counts 0–1, Bootstrap 2–11, mappings 12–27) and are verified at runtime by
decoding `Counts` from slot 0. The key universe of every bytes32-keyed mapping
is read from the ordinal index mappings (`recordIds`, `envelopeIds`, `typeIds`,
`principalIds`, `postingKeys`, `bindingKeys`) at the final block, occurrence
keys are `keccak256(abi.encode("efs2/occurrence/1", envelopeId, leaf))`, and
dynamic `bytes` data slots are `keccak256(headSlot) + i`. Authority
(`efs.fixture.authority.v3`), Control, Presentation, ERC-1967, ProxyAdmin,
router (`typeIds`/`purposes` at slots 0–16) and the carrier chunk store
(`efs.fixture.chunks.v3`) are mapped the same way. Anything unmatched is
reported as `UNATTRIBUTED` (0 writes in every retained run; reads of the
factory/controller's own storage are labelled by contract only).

Posting keys are additionally labelled by `IndexKeys` family (1–10) by
recomputing every preimage the kernel can produce from the key universe
(`posting(typeId, kind, ordinal, valueKey)` with the scope/scalar/occurrence
derivations); keys without a found preimage are shown as `?`.

## Versions and flags (recorded per run in `environment.json`)

* anvil 1.7.1 (commit 4072e48705af9d93e3c0f6e29e93b5e9a40caed8), forge 1.7.1
* solc 0.8.30+commit.73712a01 (the pinned binary from `2026-09-05-c0-core/scripts/local-stateful.mjs`)
* node v24.11.0, ethers 6.15.0
* anvil args: `--host 127.0.0.1 --port <free> --chain-id 31337 --hardfork cancun --gas-limit 33554432 --accounts 0 --no-cors --steps-tracing --silent`; transaction gas limit 16,777,216 (`TX_GAS`), legacy gas price 2 gwei, no access list
* compiler settings: `evm_version = cancun`, optimizer on, 200 runs, `via_ir = true` (foundation `foundry.toml` and `contracts/foundry.toml`)
* git revision: see `environment.json` (`git.commit`, `git.branch`, `git.dirty`, `git.statusPorcelain`); the retained runs were captured at `e6de414` on `fable/2026-09-09-files-browser`

## Caveats

* `callTracer` reports a precompile frame's cost as that frame's `gasUsed`;
  this harness books it as the caller's PRECOMPILE overhead (3,000 + 100
  warm / 2,600 cold access). The frame cross-check accounts for that.
* Transactions are signed with a deadline derived from the block timestamp,
  so calldata (and the ECDSA signature bytes) can differ between runs; the
  determinism table therefore shows calldata zero/nonzero byte counts next to
  the receipts. Execution gas does not depend on them.
* A run's "first" operations are also the first routed V3 operations by
  principal A in that world (the `principalNonce` slot is fresh once per
  principal), which is stated in each operation's note.
