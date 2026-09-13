# Road C measurement preparation — September 13

**Standing:** implementation checkpoint for a disposable engineering experiment. No Anvil or network run occurred, no gas result is claimed, and no protocol/production/freeze choice is implied.

**Scope and pins:** work began from branch `fable/2026-09-13-road-c-lab` at `7876477`; source/test semantics were pinned at `774dfcd`. Only `script/measure.mjs`, the new test-only `test/MeasurementConsumer.sol`, its test, and this report changed. `src/Consumer.sol` remains byte-for-byte unchanged at SHA-256 `5f34e9ca9471f767d90f8f6149843ece97bdc99b036ab2005559fc3478048adb`; no Core or vendor file changed.

## Implemented boundary

- `MeasurementConsumer` is a stateless, test-only paid point/list consumer. It has no constructor arguments, owner, mutable answer slot, or privileged path. Its commitment events remain inside the measured transaction and therefore remain visible overhead.
- Point consumption validates selected status, expected record and Type, canonical `abi.encode(bytes32[],bytes)` framing, exact Pair reference (or zero references for the separately named c32 diagnostic), payload length/hash, selected author, the binding Admission tuple, and the retained Evidence author/first-admission context.
- List consumption additionally requires a complete page, the expected name → subject selection, mandatory scope coverage through the cursor basis, and then validates the selected subject's head at that same basis.
- The runner keeps the typed Pair/Quote A1/A2/B1 journey separate from supplemental framed c32 native and signed create/edit/paid-point/paid-list cells. Native and signed c32 cells use the same action/body shapes and each begins from the same post-setup snapshot.
- Fresh and reused one-Record cells are isolated. Each first seeds exactly one same-sized dummy/target Record, then measures one action; pre/post first admission, occurrence, binding, accepted nonce, admission high-water and index generation are retained.
- Signing no longer delegates domain construction to a name/version-only `signTypedData` call. It reads chain ID, Ledger address, `realmId`, `realmOrigin`, code commitment and domain separator, obtains the exact digest from `Ledger.intentDigest` at a retained block basis, signs that digest directly, and checks recovery. Nonces are read from the live Nonces table and incremented according to the current source convention.
- RPC capture overrides the ethers transport boundary and retains the full raw JSON-RPC request/reply or error, including request ID, method, params and a source label. Every explicit getter is executed at its own retained block number/hash. Every transaction row retains the exact transaction, receipt and matching block header. Deployment rows also retain constructor arguments, constructor-inclusive linked initcode, runtime bytes, hashes and checked link references. Decoding happens only after the raw receipt is retained.
- Expected failure evidence is split: a block-pinned `eth_call` retains the revert data/selector, while a separately sent transaction must produce a receipt with mined status `0`. No selector is inferred from the receipt.
- The runner contains no trace, state-dump, Anvil-launch or network-install API.

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

- `script/measure.mjs`: `d3e5c1d2ec9a1a785fa3358d01ce834c3671396e9be1d9c9973620d7b510b981`
- `test/MeasurementConsumer.sol`: `7928a49650598b8d5da5a5de9c617eec0481d4f6bc5e71075d2003a5ab28bb4f`
- `test/MeasurementConsumer.t.sol`: `0e2722b0630f48c4e3be29c927594bd0b3ed268406bdfbac688a3ace760a5e80`

## Remaining gates

`node --check script/measure.mjs` exits 0 with the coordinator-pinned Node, but the runner has not been connected to a chain. Before any receipt claim: independently review the runner and expected action cells; grant a new bounded Anvil lease; execute it under normal chain limits; confirm raw RPC/receipt completeness and decoded commitments; and compare against the matched Road B evidence. Cold-readable labels, browser RPC, export/import, populated upgrade and independent reconstruction remain outside this bounded preparation task.
