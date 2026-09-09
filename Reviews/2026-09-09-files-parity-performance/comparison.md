# Bounded admission-journal source A/B

**Status:** disposable local optimization evidence; not product integration, protocol approval or an entire-branch review.

The final candidate reduces the measured seven-leaf file creation by **38.89% (U1)** and **38.01% (U2)** while preserving the same independent lifecycle outcomes. The admission library fits at **24,533 runtime bytes**, leaving only **43 bytes** below EIP-170. That narrow margin is a material integration constraint, not permission to raise the limit.

## Evidence and scope

Both reports run the unchanged [Task 1 workflow](workflow.mjs) through the real managed upgrade host: 50 mined transactions, 40 independently reconstructed checkpoints, real admitted Types/Records/Bindings, separately staged small content, stale-CAS rejection, and populated U1-to-U2 upgrade. [comparison.test.mjs](comparison.test.mjs) compares non-timing outcomes, identical workflow/input/compiler settings, compiler binary and dependency lock, all support source pins, and every compiler source pin except the intentionally changed `StateKernel.sol`.

The frozen [baseline.json](baseline.json) hash remains `0x398c1abc743952f3e41d60585d07456b31dcc63630f7df459de994a78f68fa49`. Its original source pin is authoritative; the historical September 8 `managed-upgrade.json` was not refreshed. [optimized.json](optimized.json) is a separate opt-in export, not a replacement baseline.

The optimized report was collected at local HEAD `41276dc9cd06842d2ffc275f6d07f3379f393bbe` with the tested journal diff and pre-existing dirty Binding/read-library sources present. Exact source pins and the relevant tracked-diff hash identify that working state. This does not claim that the entire branch or those other edits have been reviewed. No new dependency, Store layout, persisted encoding, Type ID, reference validation, Binding rule, public network or public API was introduced.

| Pin | Optimized evidence |
| --- | --- |
| StateKernel source | `0x09964761aa0fed1f2ba5ca673b2d6ffad41c8e92cc4bb513783e539415dc215a` |
| Compiler input | `0x1e4fd1089411e78b06f3f2fde03ffbf9023170424b050ddff34254f1436b96a2` |
| Compiler output | `0x3337531e8833c56944db8cbacbfbeb6c1e5dcea84f132e2100d7b72b85fff3b2` |
| Relevant tracked diff | `0x776db3095aee0dcf8302d4421cb4b8c6bc6c1932e9eac7a3c0cef3e78859a7c3` |
| Comparison test source | `0x10da1ab4b867389e7fa49dd68d19984ba0cc16508fbe61a9d8f6479b63340418` |
| Optimized report | `0xf0bb38f17713e8d83ff51868de2862e1da404712a838fae0c8e116131f6edd4c` |

Compiler settings remain Solidity 0.8.30, Cancun, via-IR, optimizer enabled with 200 runs, IPFS metadata, unchanged remappings and linked-library settings. Every actual transaction retains the 16,777,216 gas ceiling, every runtime the 24,576-byte ceiling, and full transaction initcode the 49,152-byte ceiling.

## Why this candidate

The baseline fresh-object 1/2/4/8-leaf U1 sweep measured 1,190,565 / 1,913,218 / 3,288,449 / 7,235,296 gas. Source inspection identified repeated backward scans of the growing journal on every row lookup. The separate [call-tree probe](admission-profile.md) measured 14,150,093 receipt gas, 13,928,262 inclusive admission-frame gas and 703,653 across seven preparation-helper frames. The remainder includes persistent writes, references, encoding and indexing; **it is not all journal gas**. The unchanged-semantics A/B, not subtraction of those frames, supports the savings claim.

The ephemeral table maps a full `(Kind, key, index)` tuple to its latest appended row. A zero slot is empty; nonzero slots store row index plus one. Hashes select a starting slot only; equality compares all tuple fields. Linear probing is bounded by table length and exhaustion asserts loudly. Every `put` still appends the full before/after change, and replay still visits every change in original order with the original storage prestate assertion.

The table is power-of-two and at most half full relative to the existing conservative journal capacity. For at most 64 fresh leaves, capacity is at most 16,389 changes and table length at most 65,536 slots. Zero-fresh exact replay allocates no table. This is **bounded lookup, not worst-case constant time**: adversarial collisions can lengthen probes, and transaction gas failure with atomic rollback remains possible.

The first high-level candidate compiled to **25,673 runtime / 25,705 initcode bytes** and was not deployable under the normal cap. One controller-approved same-architecture refinement shared the storage-fallback read path and hashed three canonical words in temporary free memory. The intermediate runtime was 24,530 bytes; explicit enum cleanup added three bytes, yielding the final **24,533 / 24,565**. The hash masks narrow enum and `uint64` words, does not overwrite the zero slot and does not return temporary memory. No further factoring or cap change was attempted.

This uses the compiler version's documented [temporary free-memory allowance](https://docs.soliditylang.org/en/v0.8.30/assembly.html#memory-safety) and explicit [narrow-value cleanup requirement](https://docs.soliditylang.org/en/v0.8.30/assembly.html#access-to-external-variables-functions-and-libraries), both checked against the Solidity 0.8.30 documentation.

## Matched receipt gas

These are the saved report values, not gas estimates. Other operations and all calldata sizes are in the JSON reports.

| Operation | Baseline | Optimized | Reduction |
| --- | ---: | ---: | ---: |
| U1 seven-leaf creation | 14,210,653 | 8,683,440 | 38.89% |
| U2 seven-leaf creation | 13,502,984 | 8,370,083 | 38.01% |
| U1 edit | 5,122,289 | 3,972,388 | 22.45% |
| U2 edit | 5,117,755 | 3,961,131 | 22.60% |
| U1 rename | 6,958,480 | 5,009,580 | 28.01% |
| U1 move | 6,941,335 | 4,985,819 | 28.17% |
| U1 stale rename, rejected | 4,041,574 | 2,483,230 | 38.56% |
| U1 scale 1 | 1,190,565 | 1,167,414 | 1.94% |
| U1 scale 2 | 1,913,218 | 1,814,150 | 5.18% |
| U1 scale 4 | 3,288,449 | 3,019,429 | 8.18% |
| U1 scale 8 | 7,235,296 | 6,146,010 | 15.06% |
| U2 scale 8 | 7,342,233 | 6,161,429 | 16.08% |

The automated regression bound requires both seven-leaf creation and eight-leaf scaling in both phases to use no more than `floor(baselineGas * 99 / 100)`. This 1% baseline-derived margin is far above the observed 12/24-gas signature/calldata jitter. It is a regression gate for these fixed inputs, not a general guarantee for arbitrary records or colliding tuples.

Setup is separate: deploying the larger admission library costs **5,358,594** versus **5,296,455** gas (+62,139, +1.17%). Type-group setup improves by roughly 0.47–1.72%; it is not eliminated. Content staging and the upgrade operation do not use the journal optimization; staging changes of 12/24 gas are signature/calldata variation, while upgrade gas remains 689,859. None is counted as journal savings.

Terminal reconstruction still needs **1,337 RPC calls**. JSON result size rises from **481,664 to 482,238 bytes** (+574), matching the larger library's 287 extra code bytes in hex. These are JSON result bytes, not transport bandwidth or a read-speed benchmark.

Observation hashes differ: both terminal observations are block 50, but baseline hash is `0x5a82b7e9b46b6a867e793bc84a074fa5ff1971c146c3a60a66649e37f54c9010` and optimized hash is `0x78c316ac122d329cfc74c0ee2e4137ab4cf3c64c3a4ed0847250277415a2cfd4`. Fresh-chain timestamps, signatures, transaction hashes, source/code pins, and local ports are not byte-identical. The compared semantic projections are equal; each checkpoint is independently verified, and retained digests are compared within each rejected transaction and the upgrade.

## Reproduction and limits

Run from the planning worktree. The existing Node runners explicitly use the `SOLC` binary exported by `local-stateful.mjs` (the Hardhat-cached 0.8.30 binary on this machine), not an assumed Foundry offline compiler installation. That binary must already exist. Before a broad run after source changes or ordinary Forge tests, build complete AST evidence in each Solidity experiment with that same binary:

```sh
TASK_SOLC="$(node --input-type=module -e 'import { SOLC } from "./Reviews/2026-09-05-c0-core/scripts/local-stateful.mjs"; process.stdout.write(SOLC)')"
cd Reviews/2026-09-05-c0-core
forge build --offline --ast --build-info --force --use "$TASK_SOLC"
cd ../2026-09-08-upgradeable-foundation
forge build --offline --ast --build-info --force --use "$TASK_SOLC"
cd ../..
node --test --test-concurrency=1 Reviews/2026-09-09-files-parity-performance/comparison.test.mjs
```

To replace only the optimized evidence, explicitly set `EFS_FILES_PERF_OPTIMIZED=1` for the comparison test. Do not enable the Task 1 baseline-export flag. Incremental artifacts can otherwise leave missing AST data or old build-info records whose unchanged host bytecode matches but whose immutable AST IDs differ. Those observed setup refusals were resolved by complete rebuilds; no runner checks were weakened.

The scoped tests cover tuple separation, colliding keys, latest values, original-storage fallback, every append's sequential before-value, actual replay, zero-fresh allocation and loud probe exhaustion. Existing Core and upgrade tests cover reference rejection, same-key CAS, mixed/all-active retry, withdrawals, selected-group visibility and upgrade rollback. High aggregate Forge test gas is not presented as an individual transaction receipt.

This remains raw Core lifecycle/performance evidence. FilesRouter authorization, router-level name/profile validation, NOREPLACE semantics, complete Files listing, removal/Trash profile, real-wallet author proof, SDK/browser joins, hostile collision resource characterization and a real product packaging decision remain open. There is no v1/v2 cost multiplier, public deployment or full Files parity claim here.
