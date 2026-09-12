# Full-C0 lazy journal allocation

**Standing:** disposable, same-semantics cost experiment. No owner adoption or production upgrade. This changes the fuller C0/Files arm, not the native-profile implementation or Fable's existing world.

The pinned Solidity compiler eagerly allocated a default five-word `Change` for every unused journal entry. A normal zeroed `uint256[]` now supplies the struct-pointer backing; `put` still installs each complete `Change`. Seven-leaf creation saves **998,043 receipt gas**. The admission runtime gains **84 bytes of headroom**, but remains close to EIP-170 and full-C0 writes remain expensive.

## Paired actual receipts

One completed fresh sequential world per arm; identical logical operations and world prefix. Source/identity/signature differences remain recorded. Intrinsic delta is candidate minus control and is **not** silently normalized out of receipt gas.

| Action | Control | Candidate | Intrinsic delta |
|---|---:|---:|---:|
| First two-leaf tag | 2,745,189 | 2,565,693 | -12 |
| Steady two-leaf tag | 2,503,157 | 2,324,116 | 0 |
| Ordinary same-label Binding rebind | 2,240,814 | 2,062,226 | -12 |
| Separate create chunk staging | 149,369 | 149,369 | 0 |
| Seven-leaf 41-byte create | 7,620,832 | 6,622,789 | 0 |
| Separate edit chunk staging | 149,381 | 149,381 | 0 |
| Three-leaf 41-byte edit | 3,610,796 | 3,313,533 | 0 |
| Direct-author partial setup | 1,225,200 | 1,149,615 | +12 |
| Mixed ACTIVE/fresh | 1,680,221 | 1,601,692 | -12 |
| Exact ACTIVE retry | 644,645 | 644,657 | -24 |
| Intended consumed-signature rejection | 367,106 | 367,082 | -24 |

Complete creation including staging: **7,770,201 → 6,772,158**. Exact ACTIVE retry has a **+12 receipt / +36 residual execution gas regression**, not a saving or solely calldata noise. The failed signature retry's -24 change is entirely intrinsic calldata variation. Deployment/setup costs are separate in the JSONs; `UpgradeAdmissionLibrary` deployment is **5,365,529 → 5,347,411**.

The ACTIVE fixture preserves one tag publication's header, envelope and full RecordId vector, admits only assertion leaf 0 directly from the real author account, then freshly authorizes the full publication twice through the router. Admissions advance **83 → 84 → 84**. Exact retry preserves kernel data but consumes a new authorization nonce/emits events. Reusing a consumed signature is separately mined and recorded as `ErrIntentNonce`, never mistaken for ACTIVE replay.

## Invariant and proof

Only [StateKernel.allocateJournal](../../2026-09-05-c0-core/src/StateKernel.sol) changed. Capacity remains `fresh * 256 + 5`; hash size/load, tuple equality, before/after values, append order, counters, replay, storage and public ABI are unchanged. Solidity allocates/zeros the backing and manages free memory. The memory-safe cast assigns a pointer without memory access.

Only entries below `plan.length` may be read. `put` installs a fully initialized struct **before** publishing its nonzero hash-table row; lookup dereferences only such rows; replay visits only the initialized prefix. Unused zero pointers are **not default structs** and must never be copied, encoded or exposed as a whole array.

The original allocator failed the new footprint assertion before production was edited. The original characterization passed. New allocation/differential tests then passed, including all capacities 0–64, all fresh-count bounds 0–64, full 16,389-entry last position, collisions/repeated/full-width tuples, dynamic/empty bytes, distinct initialized structs, dirty/interleaved memory, absent-storage fallback and stale-prestate rejection. The exact old allocator is test-only; all other kernel operations are shared production code.

Observed original/candidate free-memory deltas: fresh **0: 32/32; 1: 82,944/41,184; 2: 164,864/82,144; 7: 476,160/188,640; 64: 5,243,904/2,621,664 bytes**. Samples bracket only allocation after Plan initialization. These are memory observations, not gas savings inferred from arithmetic or Forge test gas.

## Source and runtime pins

[Control evidence](journal-control.json) and [candidate evidence](journal-candidate.json) both name checkpoint **31b7e72ec8c1f7e0666c3cd4117df9c8d5d0dc7a**. Control source diff is empty and its receipts were captured **before** editing StateKernel. Candidate retains the exact allocator diff and current source hash. All fixture/runner support hashes match; StateKernel is the sole differing production compiler source. JSONs retain exact compiler/artifact/source/runtime hashes, raw signed transactions/calldata, receipts/statuses, deployments/setup and receipt-basis read-back.

- Solidity **0.8.30+commit.73712a01**, optimizer **200**, via-IR, Cancun; pinned compiler binary keccak **`0xc174782ebcf32f998bff338a35ddf88077593d84761a2b12151bd4e9487acc02`**. Forge/Anvil **1.7.1**, ethers **6.15.0**.
- Control **UpgradeAdmissionLibrary** runtime: **24,565 bytes**, hash **`0x216d86593b0a23d2a29ec390570de8ec5cd817724b678aee7f5f7d8f9adafb7e`**.
- Candidate **UpgradeAdmissionLibrary** runtime: **24,481 bytes**, hash **`0x35e1e056826837de699988bb10202467ab8941b7fb1ab56f353bc6faecce9327`**.
- EIP-170 headroom **11 → 95 bytes**. No code-size override; all actual receipts stay within the unchanged **16,777,216** transaction gas ceiling.

Independent IDs and each admitted leaf's record/occurrence are checked at the **receipt block and verified hash**, not latest. Selected tag/head/name bindings also receive exact revision/target/history and Lens checks there. Creation's third (charter) binding is covered by the final full-inventory comparison, not an additional per-operation Lens/history assertion. Full inventories agree: **80 records, 62 envelopes, 19 Types, 1 principal, 84 admissions/occurrences, 63 batches, 257 posting keys and all packed words, 22 bindings**. Only independently pinned execution-set/authority-codehash provenance is excluded across builds. Lens observation block is separately checked against each receipt. No Type/Record/Binding semantics are normalized away.

## Verification and reproduction

Final verification: **209/209 full-C0 Solidity**, **19/19 foundation Solidity**, **15/15 focused/original journal checks** (included in the 209), **6/6 paired-evidence checks**, and **140 Node passes with one intentionally skipped chain target** across the serial integration run and focused dependency-recovery rerun. The initial Node run had 127 passes, one failed-file import and one skip: `c0-bootstrap-codec.test.mjs` could not resolve the worktree's missing locked `ethers` dependency. `npm ci --offline --ignore-scripts` in `2026-09-04-mvp-c0-foundation` changed no tracked files; rerunning that file passed all 13 tests. This is an explicitly reported aggregate, not a claim that the initial command exited successfully.

The exact skipped test is `type-cache-boundary.test.mjs` → **“chain RED target: parser-valid 64-field Type remains admissible despite compiled representation size”**, disabled unless `EFS_TYPE_CACHE_CHAIN=1`. Its pure characterization passed. The known large-Type compiled-cache limitation is **still open**; the skip must not be counted as a passing admission test. The Node gate included all C0/foundation Node suites and Files authority, routed operations, independent effect read-back, byte-commitment matrix and reader extensions. The byte-commitment test rewrote its old evidence file; only that generated change was restored exactly, leaving its historical evidence unchanged.

The new Solidity test is formatted and its eight tests passed again afterward. A pre-existing `StateKernel.sol` formatting difference at the `writeType` call is left untouched so the measured production source remains exact; it is not an allocator formatting change. The existing `C0Request.prepare` compiler mutability warning also remains: the successful build output is not entirely warning-free. `git diff --check` and JavaScript syntax checks pass.

From the vault root, the retained offline comparison is:

```sh
node --test Reviews/2026-09-11-efs21-pragmatic/test/journal-comparison.test.mjs
```

Fresh measurement entry point: [journal-benchmark.mjs](../scripts/journal-benchmark.mjs) with `control` or `candidate`. The runner refuses to overwrite retained evidence; reproduce in a separate checkout, at the unchanged control source or retained candidate diff respectively. It uses `compileUpgrade`, `compileRouter`, `withUpgrade({profile:'reads'})`, and `startEnvironment({write:true,relay:false,sponsor:false})`. One isolated finite build/node at a time; no trace-baseline import, steps/opcode tracing, server, periodic mining, public RPC or funds. All **90 transactions per arm**, including failed receipts and claims outside `lab.send`, are retained.

The JSON `cleanup` fields were copied **inside the callback before teardown**; their false flags are not final teardown status. The managed runner awaits stop/cleanup before returning, and both exact recorded cache paths were independently checked absent afterward. The build directories are removed in `finally`. Existing integration lifecycle tests also exercise cleanup. No existing world was stopped or altered.

The legal-large-Type compiled-cache limitation is unchanged and is **not fixed by this allocation experiment**. No tighter capacity, journal coalescing, physical PostingStore extraction, Type-cache change, semantic simplification or production adoption is included. These local RPC observations are not cryptographic state proofs.
