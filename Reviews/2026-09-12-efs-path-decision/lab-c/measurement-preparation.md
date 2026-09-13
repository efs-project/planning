# Road C measurement preparation — September 13

**Standing:** implementation checkpoint for a disposable engineering experiment. No Anvil or network run occurred, no gas result is claimed, and no protocol/production/freeze choice is implied.

**Scope and pins:** work began from branch `fable/2026-09-13-road-c-lab` at `7876477`; source/test semantics were pinned at `774dfcd`. The first preparation commit changed only `script/measure.mjs`, the new test-only `test/MeasurementConsumer.sol`, its test, and this report. A later pre-run correction adds only the runner's Node helper/test and updates this report. `src/Consumer.sol` remains byte-for-byte unchanged at SHA-256 `5f34e9ca9471f767d90f8f6149843ece97bdc99b036ab2005559fc3478048adb`; no Core or vendor file changed.

## Implemented boundary

- `MeasurementConsumer` is a stateless, test-only paid point/list consumer. It has no constructor arguments, owner, mutable answer slot, or privileged path. Its commitment events remain inside the measured transaction and therefore remain visible overhead.
- Point consumption validates selected status, expected record and Type, canonical `abi.encode(bytes32[],bytes)` framing, exact Pair reference (or zero references for the separately named c32 diagnostic), payload length/hash, selected author, the binding Admission tuple, and the retained Evidence author/first-admission context.
- List consumption additionally requires a complete page, the expected name → subject selection, mandatory scope coverage through the cursor basis, and then validates the selected subject's head at that same basis.
- The runner keeps the typed Pair/Quote A1/A2/B1 journey separate from supplemental framed c32 native and signed create/edit/paid-point/paid-list cells. Native and signed c32 cells use the same action/body shapes and each begins from the same post-setup snapshot.
- Fresh and reused one-Record cells are isolated. Each routes the native publication through the real Producer/contract principal B, first seeds exactly one same-sized dummy/target Record, then measures one action; pre/post first admission, occurrence, binding, accepted nonce, admission high-water and index generation are retained.
- Signing no longer delegates domain construction to a name/version-only `signTypedData` call. It reads chain ID, Ledger address, `realmId`, `realmOrigin`, code commitment and domain separator, obtains the exact digest from `Ledger.intentDigest` at a retained block basis, signs that digest directly, and checks recovery. Nonces are read from the live Nonces table and incremented according to the current source convention.
- RPC capture overrides the ethers transport boundary and retains the full raw JSON-RPC request/reply or error, including request ID, method, params and a source label. Every explicit getter is executed at its own retained block number/hash. Every transaction row retains the exact transaction, receipt and matching block header. Deployment rows also retain constructor arguments, constructor-inclusive linked initcode, runtime bytes, hashes and checked link references. Decoding happens only after the raw receipt is retained.
- Expected failure evidence is split: a block-pinned `eth_call` retains the revert data/selector, while a separately sent transaction must produce a receipt with mined status `0`. No selector is inferred from the receipt.
- The runner contains no trace, state-dump, Anvil-launch or network-install API.

### Pre-run correction after independent review — 04:48–05:12 UTC

No compiler or Anvil lease was active for this source-only repair.

- Runtime verification now reads each pinned artifact's `immutableReferences`, requires the exact reviewed identifier/range set, patches only those ranges with deterministic expected values, and compares every other byte exactly. The whitelist covers ImportLib's self library address; IndexModule's deployer and poison value; Ledger's index, index codehash and chain/deployment-derived Realm ID; and LensReader's Ledger/Index addresses. Constructor-inclusive initcode and the hash of actual deployed runtime remain retained separately.
- A Node helper regression was written failing-first and now covers accepted immutable patching, wrong immutable values, non-immutable drift, malformed/overlapping/unexpected ranges, MUD left-aligned uint64/uint32 decoding, and the exact immutable ranges in the pinned Forge artifacts.
- Record first-admission and occurrence counters now decode the high 8/high 4 bytes of MUD's left-aligned fixed-width return values; malformed field widths fail. The prior whole-`bytes32` conversion would have overflowed the second signed nonce and misreported state.
- The provider disables caching and batching. Every reset proves both the wallet's raw pending transaction nonce and Ledger admission high-water returned to the post-setup baseline before taking a new snapshot.
- Receipt handling uses bounded raw polling with every null/result retained. Transaction, receipt and header hashes/numbers are cross-joined explicitly; ethers `tx.wait()` is no longer in the runner.
- The expected failure path cannot catch its own unexpected-success exception: the block-pinned static call must actually revert with the exact `AlreadyAdmitted` selector before a separately mined status-0 receipt is accepted.
- Each successful publication asserts its decoded `Published` author, proof kind and leaf count. Paid point/list calls assert nonzero commitment events, subject/record/selected-author values and equal point/list basis; list coverage must reach that basis. The typed cell includes both A-first and B-first paid point/list calls.
- The framed c32 native cell now uses the real Producer/contract principal B; the signed cell retains the identical four-action create and two-action edit shapes. Each captures and asserts distinct pre/post create and edit transitions.
- The matched fresh/existing-body cells now both route through the real Producer/contract principal B and submit the exact same `BODY_HASH` action and body. Their isolated seed state differs only by same-sized dummy versus target content; assertions require `0→1` occurrence and new first-admission for fresh, versus `1→2` occurrence with preserved first-admission for existing-body. The different `RECORD_ID`/empty-body action is not used as the matched deduplication tax.
- Partial raw evidence is atomically persisted after setup and every reset/cell to the explicit absolute run-owned `EVIDENCE_PATH`, including on fatal exit. The runner will not choose or create an implicit workspace result path.
- Artifact lookup resolves `OUT_DIR` first, then `FOUNDRY_OUT`, then the retained `lab-c/out` fallback. The run coordinator may therefore pass a stable absolute `OUT_DIR` without changing the relative Forge build convention.

The measurement consumer is candidate-coupled test instrumentation, not an independent oracle or full joined-proof verifier: it imports the candidate's table decoders and receives expected values from the caller. It validates the exact Pair ID and retained Evidence author, but it does not independently reconstruct proof kind, signature/domain/profile or the complete evidence closure. Any future result must retain that ceiling.

## Test-first and compiler evidence

Compiler lease: September 13 03:53–04:35 UTC, compiler-only. Start checks at 03:54 UTC found no Forge, solc or Anvil process, 265 GiB free, and 10 MiB in the retained run-owned C scratch directory. The existing `lab-c/out` symlink remained pointed at `repair-20260913T0219Z/out-rel`; `FOUNDRY_OUT=out` remained relative and the cache path remained `repair-20260913T0219Z/cache-rel`.

Compiler: `/Users/james/Library/Application Support/svm/0.8.30/solc-0.8.30`, SHA-256 `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`. Forge: `/Users/james/.foundry/bin/forge` 1.7.1. All Forge commands used `FOUNDRY_OUT=out`, the retained absolute cache, offline mode, two threads and a Perl `alarm` watchdog.

Failing-first sequence:

1. PID `91381`, targeted test, exit 1: the first draft used Solidity's reserved word `reference`; this was a test-authoring error and did not count as the intended red result.
2. PID `91428`, targeted test, exit 1: `test/MeasurementConsumer.sol` was absent. Forge failed with `Source "test/MeasurementConsumer.sol" not found`. This is the expected missing-feature red result.
3. PID `91485`, targeted test after the minimal consumer implementation, exit 0: 6 passed, 0 failed. This compiled two new files with the pinned compiler.

Fresh verification:

```text
PID 91770
forge build --sizes --threads 2 --use <pinned solc>
exit 0; unchanged inputs skipped recompilation; normal-limit size table emitted

PID 91817
forge test --threads 2 --use <pinned solc> -vv
exit 0; 43 passed, 0 failed, 0 skipped

PID 92150 (pre-commit rerun)
forge test --threads 2 --use <pinned solc> -vv
exit 0; 43 passed, 0 failed, 0 skipped; `node --check` and `git diff --check` also exited 0

PID 92335 (post-commit verification)
forge test --threads 2 --use <pinned solc> -vv
exit 0; 43 passed, 0 failed, 0 skipped; `node --check` also exited 0
```

The 43 total are the existing 37 regressions plus 6 new consumer tests. The new tests cover joined success for paid point/list and falsify wrong Pair reference, wrong author context, wrong payload length, wrong payload hash and incomplete list selection. Forge emitted the pre-existing lint warnings recorded in earlier runs; it emitted no new compiler error.

Relevant normal-limit sizes:

| Artifact | Runtime bytes | Initcode bytes |
|---|---:|---:|
| ImportLib | 19,861 | 19,893 |
| IndexModule | 10,303 | 22,790 |
| Ledger | 23,145 | 37,892 |
| LensReader | 10,585 | 10,843 |
| MeasurementConsumer | 6,459 | 6,485 |
| Producer | 2,644 | 2,681 |

A separate read-only scan covered 94 compiled artifacts and found zero EIP-170/EIP-3860 violations. At 04:09 UTC the retained run-owned scratch was 11 MiB, the root still had 265 GiB free, and no Forge/solc/Anvil process remained. The compiler lease is returned early; it does not become an Anvil lease.

Current SHA-256 values:

- `script/measure.mjs`: `b9764bfb5ff9ec1af451904ef7145fbe02bb3cd682c3e8bfe119d95bd11ecd36`
- `script/measure-helpers.mjs`: `99ea48521d131447d053825f406b31e6e7263a1bdc72491b0f2b820a1eaa1e27`
- `script/measure-helpers.test.mjs`: `797ba39fd16defdb6eafb4e3578c6af5869318b4e5ce03702af211bfb6b97b68`
- `test/MeasurementConsumer.sol`: `7928a49650598b8d5da5a5de9c617eec0481d4f6bc5e71075d2003a5ab28bb4f`
- `test/MeasurementConsumer.t.sol`: `0e2722b0630f48c4e3be29c927594bd0b3ed268406bdfbac688a3ace760a5e80`

## Remaining gates

First live runner preflight, root at September 13 05:07 UTC: ImportLib,
IndexModule and Ledger deployed and passed the repaired runtime checks, but
the setup call used `index.attach`, which resolves to ethers' local
`BaseContract.attach` helper rather than the Solidity method. Its returned
Contract object had no transaction hash. The raw failure packet is retained
in run-owned temporary scratch; this was not a failed contract transaction.
Root inspected the installed helper, then called `getFunction("attach")`
against the same test deployment: receipt status 1, gas 69,974. The one-line
runner fix selects that explicit ABI method. A fresh chain run must follow;
the diagnostic attachment is not merged into the benchmark's setup totals.

`node --check script/measure.mjs` exits 0 with the coordinator-pinned Node, but the runner has not been connected to a chain. Before any receipt claim: independently review the runner and expected action cells; grant a new bounded Anvil lease; execute it under normal chain limits; confirm raw RPC/receipt completeness and decoded commitments; and compare against the matched Road B evidence. Cold-readable labels, browser RPC, export/import, populated upgrade and independent reconstruction remain outside this bounded preparation task.
