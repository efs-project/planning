# Bounded hybrid-body calibration

Fresh-genesis native experiment, not a protocol decision or final-source receipt run.

[Calibration receipts](hybrid-calibration.json) retain 48 matched admissions per arm: exact reviewed packed `f43501a`, test-only forced code, and test-only forced words. [Exact candidate/support source snapshots](hybrid-calibration-sources.json) are hash-checked against the calibration pins. The candidate was dirty atop `03f0160`, with a provisional all-words selector; it is **not** final policy source `064ea64`. The immutable frozen control retains its own source/compiler/artifact identity.

All three arms use identical setup order and admission calldata. Type validation, exact RecordId hashing, explicit existence, helper identity checks and navigation inventory remain. The two new paths share bounded metadata/read/hash discipline. The old `c088363-read-integrity` dynamic-body fixture is not a bounded-reader safety control and is not an arm here.

| Fresh raw admission | Frozen packed | Forced code | Forced words |
|---|---:|---:|---:|
| Empty, first Type inventory use | 165,110 | 165,262 | 131,763 |
| 1 byte, nonzero | 148,401 | 149,003 | 137,936 |
| 33 bytes, 2 occupied words | 155,363 | 156,300 | 161,367 |
| 256 bytes, 3 occupied words | 200,697 | 203,088 | 187,180 |
| 256 bytes, 4 occupied words | 200,709 | 203,186 | 209,574 |
| 4,096 bytes, all zero | 990,892 | 1,022,785 | 200,079 |
| 4,096 bytes, 128 occupied dense words | 1,040,044 | 1,082,945 | 3,114,127 |

These are paid transaction receipts, including intrinsic calldata gas. They are not Forge test gas, estimates, network fees or USD projections. Each row names actual fresh/dedup membership rather than assuming its label proves freshness. Kernel/helper deployments and common setup are retained separately in JSON.

## Derivation and fixed policy

At zero length, forced-code minus forced-words is 33,499 gas. At 256 bytes, each extra occupied word adds 22,296 gas to the words-minus-code difference, excluding the common changing calldata cost. The difference between the 256- and 4,096-byte all-zero rows corresponds to roughly 234 gas of additional words-path work per 32-byte word after the 200-gas code-deposit byte term. These are observed end-to-end deltas, not exact isolated opcode prices.

Rounded transparent proxy, fixed only after these measurements:

```text
words = 22,300 * maskedNonzeroWordCount + 240 * ceil(bodyLength / 32)
code  = 33,500 + 200 * bodyLength
choose words iff words < code; ties choose code
```

Canonical ABI headers count as storage words. The final partial word is masked before counting and storing. Length and nonzero-byte count alone are insufficient: four nonzero bytes concentrated in one word cost 142,428 with forced words, versus 209,574 when dispersed across four words at the same 256-byte length.

Reachable exact arithmetic ties include `(length,occupied) = (637,7), (1101,11), (3186,29), (3650,33)`. The bounded final matrix adds 636/637/638 bytes at seven occupied words, with an explicit tie-rule unit test. Selection is an experimental write-oriented heuristic, not an owner-selected profile, opcode oracle, or lifetime optimum.

The full occupancy scan remains on new admissions. Forced selectors override only the choice, and the calibration receipts show retained scan work: dense 4,096-byte forced code is 42,901 gas more than the frozen packed implementation. Compiler/dispatch differences are included; the delta is **not** an exact isolated selector-gas measurement. No early-exit optimization is included.

Paid reads remain a separate final-evidence axis: zero words can avoid fresh writes but still require every authoritative word to be loaded on read. No assumed future read count is used to hide that tradeoff. Final reporting must include misselections and regressions.

## Bounds and cleanup

Solidity 0.8.30, optimizer 200, via-IR, Cancun; ordinary 24,576 runtime / 49,152 initcode / 4,096 body / 16,777,216 transaction-and-block gas ceilings. No full traces, public funds, deployment or live-demo replacement. Calibration processes 67252/67308/67367 exited0; each exact owned cache path is in JSON with `cacheRemoved:true` and `stopped:true`. Available disk was approximately 282.7 GiB, above the 20 GiB stop threshold.
