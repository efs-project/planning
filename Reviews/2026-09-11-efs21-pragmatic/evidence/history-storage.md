# Same-profile history storage: measured prototype

**Standing:** disposable fresh-genesis experiment, not production, migration, semantic freeze, or full-v2 parity. This changes only the native experiment's internal history representation. Existing browser/benchmark evidence remains the earlier baseline checkpoint.

## Outcome

Actual paired transaction receipts show the contract-produced uint256 update falling from **284,631 to 237,597 gas**. The short-name 41-byte ABI-bytes edit falls from **350,271 to 303,237 gas** and therefore **still misses the 250k ambition**. Different body encodings are not interchangeable claims.

| Paired action | Original gas | History-sharing gas |
|---|---:|---:|
| Producer uint256 initial publication | 592,176 | 592,477 |
| Producer uint256 update | 284,631 | 237,597 |
| Separate consumer read transaction | 77,277 | 77,277 |
| 41-byte fresh-content edit, name length 1 or 31 | 350,271 | 303,237 |
| 41-byte fresh-content edit, name length 32 | 374,756 | 303,237 |
| 41-byte fresh-content edit, name length 64 | 399,136 | 303,237 |
| Same-content edit, name length 1 | 163,536 | 116,496 |
| Unlink, name length 1 | 134,942 | 107,781 |
| Create 41-byte file, name length 1 | 597,694 | 597,995 |
| Move/rename, name length 1 | 225,193 | 225,583 |
| Same-place move, name length 1 | 167,393 | 167,783 |
| Kernel deployment, including registry/navigation | 3,723,287 | 3,716,090 |

All five name lengths (1/31/32/33/64), full calldata, actual receipts including reverts, setup, canonical read-back, and source/fixture/runtime/support hashes are retained in [history-comparison.json](history-comparison.json). Each arm has 56 action receipts plus eight setup receipts. The 33-byte-name case has slightly different calldata gas; use its retained exact numbers rather than projecting from the table.

The producer publications use values 3000/3100 and expected revisions 0/1. A separate deployed consumer resolves the producer's namespace and returns 3100 at revision 2; the benchmark checks stable FileId, owner, live regular-file state, exact TypeId, independently derived RecordId, and exact uint256 body at the publication receipt block/hash. External raw SDK sends remain `MINED_UNVERIFIED` in the journal with a separate `benchmarkCanonicalCheck`; benchmark assertions do not silently relabel the SDK's result status.

## What changed and what did not

[NativeKernel](../contracts/src/NativeKernel.sol) now stores each revision as `(recordId, uint64 locationRevision, bool live)`. A file's immutable location table stores parent/name at creation revision 1 and at every move's new revision, including same-place moves. Edit/unlink reuse the preceding pointer. `revisionAt` joins immutable rows, never the mutable navigation location. There is no separate dense location counter.

The public ABI is byte-for-byte equal in the artifact comparison. Names, owner, per-file CAS, one revision per operation, events, history, record admission/validation, and index generations remain unchanged. `hasRecord`, the body representations, ExactTypeRegistry, and NavigationIndex are untouched. This is a fresh-genesis storage change, not an upgrade of a populated world.

Historical reads have extra hashing/indirection: all 20 measured `revisionAt` call inputs estimate **157 additional execution gas**, with unchanged 224/256-byte return lengths. For example, a one-byte name's historical read estimates 34,239 → 34,396 gas. These are pinned read calls plus `eth_estimateGas`, not paid receipts. The separate current-content consumer read remains 77,277 gas as both an estimate and a real transaction.

Runtime is 9,236 → 9,203 bytes; creation bytecode is 17,029 → 16,996 bytes. All runtime/transaction ceilings remain ordinary. Create/move retain location data and pay modest pointer/hash overhead; edit/unlink stop duplicating names. A focused storage test measures exactly two newly nonzero kernel words for a same-content edit with a 64-byte name. That instrumentation is separate from the actual receipt measurements and is not used to infer their gas savings.

## Provenance and reproduction

Candidate source/measurement commit: `d757d5cf7b55dfd02d903f867c3516dd013bec10` (implementation initially committed as `3dac3b539daa264b8afddc936d5bf0e1d21fc64c`).

Original kernel source: `aa6b1b62b733209aa5879743e81fd1f3a9143f8a`. Before editing the kernel, its clean compiled creation artifact was retained in [the immutable fixture](../contracts/test/fixtures/native-kernel-aa6b1b6.json), captured at `3269c9998d329b5f2c501414ec3b0ee6f2b395eb` after checking every included source against that original Git commit. No second maintained Solidity implementation was copied.

- Baseline creation-bytecode Keccak: `0x27858fb562828b76a3f90c5ebfef8c0e2a34cef593206221362c692bc507c760`.
- Fixture-file Keccak: `0xc2627f4b0eb558751225405b709969a3cd27f9a51dae8bf80a49aeec4c5ca9a8`.
- Candidate creation-bytecode Keccak: `0x0590ad9a9f80efea7584a827509b9dcdb742f2d097d44c00e66390cddef94bc5`.

`provenance.kernelArtifact` identifies the kernel actually deployed. Baseline `sourceCommit` there is the original source, not the candidate's working-tree source. Outer `sourceCommit/sourcePins` identify the current experiment/helper build; the remaining shared components are built from that source for both arms. Artifact selection is explicitly `baseline-aa6b1b6` or `current`, with ABI, creation hash, historical source hashes, and current artifact-source checks before measurement.

From the experiment directory:

```sh
node --test --test-concurrency=1 test/*.test.mjs
node scripts/history-benchmark.mjs
```

From `contracts/`:

```sh
forge test -v
forge build --sizes
forge fmt --check
```

No new dependencies. Solidity 0.8.30, Cancun, optimizer 200, via-IR; pinned ethers 6.15.0. Worlds run sequentially with fresh genesis, a finite watchdog, ordinary size/gas ceilings, no periodic mining, no full traces, and exact owned-cache cleanup. Both retained cleanup results are true. Existing persistent demos were untouched.

## Verification and TDD

RED before implementation:

```text
forge test --match-test testEditAllocatesOnlyTwoFreshHistoryWords -v
[FAIL: edit must allocate exactly two fresh kernel words]
0 passed; 1 failed
```

The failure was expected: the original edit allocates new immutable parent/name data. This is an optimization assertion, not merely an equivalence test that was already green.

GREEN: 56/56 Forge tests (47 original plus nine history tests); 128 bounded differential fuzz sequences; 7/7 serial Node/browser tests. Every operation in the history workload compares both arms' retained revisions, exact records, live state, listings/generations, inventories, and events. Explicit cases cover root and empty-directory history, names 1/31/32/33/64, zero uint256, empty logical bytes, Type changes, same-content edits/same-place moves, cross-file immutability, stale/auth/name/index failure rollback, dedup validator failure, uint64 overflow, and valid equal-generation foreign-scope cursor rejection.

The same SDK is used in both fresh worlds, with 50 after-operation snapshots checked equal. Solidity differential tests normalize only deployment-qualified FileIds and cursor scopes; portable Type/Record IDs remain exact. Browser tests exercise the current arm. A test-harness-only cursor failure was corrected by caching `navigation()` before `expectRevert`, so the expectation applies to `directoryPage`, not the successful getter.

Passing tests and local gas savings do not establish a production security review, fee quote, public-testnet readiness, or owner adoption. No old benchmark JSON was overwritten and no hasRecord/representation optimization is hidden in this result.
