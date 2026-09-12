# Bounded hybrid body storage: measured result

**Standing:** fresh-genesis native Files experiment, pending independent task review/root verification. No protocol adoption, production migration, generic-Core extraction, network/USD claim, or live-demo replacement.

The selector improves tiny/sparse admissions and the uint256 producer, but is **not a universal write saving**. Dense bodies still use code and pay the new full scan; zero-heavy word storage makes paid reads substantially more expensive. No lifetime read-count assumption is used.

## Sources and controls

- Production policy/code was frozen at `064ea6465716a825c504481828f9f9c58a72ea9f`. Runner-only repairs followed; the actual successful final CLI/source-support freeze is `310c8b83ddd8b65f85d61fce41a6a74dcc078e04`.
- [Final four-arm signed transactions, receipt-basis readbacks, exact metadata/words, compiler layout, artifacts and cleanup](hybrid-body-final.json): 41 setup plus 143 actions per arm, **736 transactions** total. Nine actions per arm intentionally revert. Setup/action order and action calldata match exactly; action intrinsic deltas are zero. Kernel deployment differs and is accounted separately.
- Arms: exact frozen packed always-code `f43501a`, test-only forced code, test-only forced words, and actual hybrid `current`. All new paths retain bounded metadata/range/hash discipline; both forced controls compare complete physical paths under the final source, not an isolated selector-gas measurement or production configuration.
- [48-case pre-policy calibration](hybrid-calibration.md), [its actual receipts](hybrid-calibration.json), and [exact pre-policy source/support snapshots](hybrid-calibration-sources.json) remain separate. Dirty calibration source is never labelled final policy.
- The earlier dynamic-bytes `c088363-read-integrity` fixture only adds a post-copy hash; it does not prebound corrupted dynamic length and is **not** a safety-matched control here.

Solidity 0.8.30, optimizer 200, via-IR, Cancun; ordinary runtime 24,576 / initcode 49,152 / body 4,096 / transaction-and-block 16,777,216 ceilings. Native hybrid runtime/initcode is 11,592/26,112 bytes. Exact public ABI remains 43 fragments; all public selectors, Type/Record identities and helper/validator/index runtime identities remain unchanged. Kernel deployment costs 5,508,840 frozen versus5,657,401 hybrid (+148,561), separately from user actions. The highest retained transaction is that 5,657,401 deployment, not a limit increase.

## Paid operation receipts

| Operation | Frozen packed | Forced code | Forced words | Hybrid |
|---|---:|---:|---:|---:|
| Fresh raw 41 file create | 591,801 | 592,758 | 596,226 | 592,983 |
| Fresh-content raw 41 edit | 241,339 | 242,275 | 245,743 | 242,500 |
| Same-content raw 41 edit | 121,681 | 121,680 | 121,680 | 121,683 |
| Fresh-content dense raw 4032 edit | 1,110,375 | 1,152,608 | 3,151,553 | 1,152,848 |
| Quote producer first publish | 598,093 | 598,601 | 581,236 | 581,532 |
| Quote producer fresh update | 243,249 | 243,735 | 226,371 | 226,667 |
| Independent paid quote reader | 76,393 | 76,450 | 76,060 | 76,060 |
| Raw256, 3 occupied words, fresh | 200,697 | 203,088 | 187,180 | 187,476 |
| Raw256, 4 occupied words, fresh | 200,709 | 203,186 | 209,574 | 203,426 |
| Raw4096, all zero, fresh | 990,892 | 1,022,785 | 200,079 | 200,375 |
| One paid read, raw 4096 all zero | 85,373 | 85,430 | 396,952 | 396,952 |
| Two paid reads in one tx, raw 4096 all zero | 95,428 | 95,542 | 465,086 | 465,086 |
| One paid read, dense raw 4096 | 85,361 | 85,418 | 396,940 | 85,418 |

Every paid-read count uses a fresh independent consumer contract with empty effect slots. Repeated reads within one transaction have a different warm-access set; count-two is not two independent transactions. Separate `eth_estimateGas` readings in each arm are estimates, not paid receipts. Canonical41/256/4032 and raw 41/256/4032/4096 complete create/edit/same-content/rename/unlink/history workflows, payload consumers, first/update producer calls, and reached late failure receipts are retained, not replaced with standalone admission-only proxies.

All **143** comparison rows—including **80 regressions versus frozen packed**—remain in JSON. Raw 41 fresh edit regresses 1,161 gas; dense raw 4032 edit regresses 42,473. Quote update saves 16,582 and all-zero raw 4096 admission saves 790,517, but its single paid read costs 311,579 more. Renames/unlinks and dedup are separately labelled; they are not fresh storage wins.

## Policy, scan overhead and regret

The calibrated deterministic internal heuristic chooses words iff:

```text
22,300 * maskedNonzeroWords + 240 * ceil(exactBodyLength / 32)
  < 33,500 + 200 * exactBodyLength
```

Exact ties choose code. No mutable threshold, public switch or owner-selectable storage setting is introduced. Canonical ABI headers count; final partial words are masked before counting/storage. Equal-length/equal-nonzero-byte-count concentrated/dispersed cases distinguish storage-word occupancy from byte density.

The final matrix has 51 cases: lengths 0/1/20/31/32/33/41/63/64/65/256/4032/4096, representative 0/1/2/3/4/quarter/half/full occupancy, dense/dispersed/last/tail words, canonical headers, and exact tie/adjacent 636/637/638 at seven occupied words. The tie at 637 chooses code even though forced words is **5 gas cheaper** (284,962 versus284,957); this is the one observed physical-path misselection. Hybrid costs 285,187 there: 230 over the cheaper forced path. At 638 hybrid chooses words but its 285,253 total still exceeds forced code 285,162 because selector/dispatch overhead is not free.

The full masked occupancy scan remains on **all new Records, even code winners**. Forced fixtures override only selection; actual compiled calibration receipts retain scan cost. Dense 4096 forced code costs 42,901 more than frozen packed. Final `regretVsBestForced` includes compiler/dispatch differences, not a pure selector-gas counter. No early-exit optimization was pursued.

The fixture's comment saying pure overrides “allow” compiler elimination is permissive wording, **not observed elimination**. Root retained the measured fixture source unchanged for this gate and deferred that nonfunctional wording cleanup to a later artifact freeze. This is the sole known wording follow-up, not a correctness or provenance exception.

## Storage, integrity and semantics

Compiler layout confirms two-word `StoredRecord`: Type word, then pointer bytes 0–19, length 20–21, presence 22, backend 23. Records root 3, reserved old presence root 4, locations root 5 stay fixed; `mapping(bytes32 => bytes32[128])` is appended at root 6. No dynamic-bytes header, third inline format, word sharing or relocation on duplicate exists.

There are 67 distinct successful Records in each final arm (16 whole-workload plus 51 matrix). Frozen/forced code use 67 children, forced words uses 0, hybrid uses 25; final helper nonces are 68/68/1/26. BodyWriter remains the fourth constructor child with unchanged runtime and is identity-checked on **every new admission**, including words. Validation still precedes dedup; duplicate admission neither rescans nor relocates.

Presence false yields `MissingRecord` first. Present records bound length<=4096 and backend before copying. Code mode verifies pointer, exact size, STOP prefix and exact RecordId hash. Words require zero pointer, load exactly the authoritative rounded word range, reject nonzero tail padding and rehash the unchanged Type/body identity. Empty words remain explicitly present. Clearing presence is indistinguishable from absence; garbage beyond the authoritative range is deliberately not claimed detectable.

Tests cover unknown tags, length 65535 with bounded gas, words pointers, changed/deleted words, wrong Type, tail corruption, nonzero calldata padding, missing/same-length/malformed code, duplicate validation/helper outage, cross-Type isolation, both chosen backends' late name/index rollback, and 128 seeded mixed/duplicate history sequences against exact frozen packed. No validator, indexing, Files, SDK/browser API or identity behavior was changed.

## Harness failures and evidence preservation

The first actual CLI attempt at 064ea64 deadlocked after 10 setup transactions, before measured actions, because a workload dynamically imported its awaiting parent module. Parent 71048 and Anvil 71205 were stopped; cache woyZWH was removed; no final JSON was produced. `0105ce3` moved the observer into shared world support. A subsequent real CLI completed and emitted [initial raw evidence](hybrid-body.json), kept unchanged. Its raw arm actions/receipts are valid, but its derived comparison let payload labels overwrite paid-matrix operation labels; **do not use that derived summary**.

`310c8b83` fixes label precedence, adds a bounded real CLI `--probe` (one namespace action, no evidence file), and emits the corrected [final evidence](hybrid-body-final.json) to a separate exclusive path. That actual CLI completed exit 0. The final report above uses only the corrected final output. Historical body/packed JSON was not rewritten.

Legacy body/packed defaults now refuse hybrid `current` **before build/world creation**. Explicit `--frozen-replay` uses exact 58e61c4 body or f43501a packed artifacts, never forced-code hybrid, and writes separate exclusive replay paths. Helper presence is no longer treated as proof that every Record uses code. The old packed measurement test freshly replays the exact frozen pair; historical three-arm evidence checks remain labelled historical.

## Verification and cleanup

Full Forge 117 passed, 0 failed, including 10 BodyStorage tests repeated in both PackedPresence and HybridBody, and four 128-run fuzz tests. This is 97 unique test definitions plus 20 inherited repetitions. Ordinary Native/Raw/Types/Discovery/History/Examples/production-browser tests still use actual hybrid. Six individual code-object/CREATE faults use forced code; one packed tag-zero assertion does too; empty event/presence assertions now explicitly check hybrid no-child semantics. No wholesale test-file replacement or deleted fault assertion.

Final serial Node/browser gate passed **33/33**, including actual hybrid browser actions, real CLI startup, exact frozen packed replay, and current/forced integrity tests. Five focused world/layout checks and the actual CLI probe passed before final receipts. Touched Solidity formatting, ordinary sizes and exact ABI are checked separately.

The first complete Node run was 32/33: the new evidence test compared in-memory `undefined` optionals to serialized JSON, which omits them. A test-only correction compares the exact serialized derivation and avoids dumping large body arrays on mismatch; it does not alter benchmark source, contracts or retained receipts. Thus that post-receipt test file differs from the final run's correctly pinned support source at `310c8b83`. Standalone matrix actions retain the generic client's `MINED_UNVERIFIED` status string; the separate `independentEffect` and metadata/body observations record the benchmark's successful receipt-basis exact read-back. No low-level client status was silently rewritten.

Final Anvil PIDs 72344/72400/72463/72516 exited0; each exact cache path is in final JSON with `stopped:true` and `cacheRemoved:true`. Initial successful PIDs 71711/71770/71837/71888 and calibration PIDs 67252/67308/67367 also exited/cleaned. Existing native 54154/RPC 54148 Anvil 91971 and Fable 60731/RPC 60726 Anvil 65638 were preserved. Free disk remained about 282 GiB, above 20 GiB. No traces, public funds, production deployment, limit raise or populated-state migration.
