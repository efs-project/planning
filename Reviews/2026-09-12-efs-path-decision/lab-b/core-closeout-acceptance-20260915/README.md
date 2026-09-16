# Ordered acceptance packet 1 evidence

Disposable lab repair on top of `deb2d966223bcc54ecb1776c604213ebb1c10994`.
Historical negative reproduction `09e022f19bce9a8c1a13d668f6d2da07ac73c037`
is unchanged. This is not completion of the larger Core prototype.

## Reproduce

Use the repository's unchanged Solidity 0.8.30 / optimizer 200 / via-IR / Cancun
configuration. No linker substitution is required: the Ledger implementation
constructor creates its fixed, stateless `PublicationSupport` dependency.

```sh
forge test --out "$TASK_BUILD/out" --cache-path "$TASK_BUILD/cache" \
  --match-path 'test/{CoreAcceptanceAudit,CoreOrderedAcceptance,MatchedRollback,FilesNames,FilesDirectoryProfile,FilesJoined,FilesLiveIndex,FilesCarrierProfile,FilesBytework,CoreReadCostAudit,FoundationGuard,FoundationUpgrade,GuardedRecovery,IndexConfigExpectation,LedgerMatrix,IncomingQuotes,LedgerImport}.t.sol' -vv

FOUNDRY_OUT="$TASK_BUILD/out" EFS_ETHERS_PATH="$EXISTING_ETHERS_PACKAGE" \
  ANVIL_BIN="$EXISTING_ANVIL" node --test --test-concurrency=1 \
  script/core-ordered-acceptance.test.mjs
```

`TASK_BUILD` is a run-specific existing temporary build directory; ethers and
Anvil must already exist. The Node test starts only its own loopback Anvil with
bounded 256-state history, a 512-block transaction keeper, and a run-local cache.
It closes that process on success or failure. It never uses the demo ports,
installs dependencies, forks, disables contract-size limits, or publishes.

## Evidence interpretation

- `red-singleton.log`: expected second-singleton failure before the ordered-prefix repair.
- `red-final-abi.log`: expected failure proving a successful permissive fallback is not enough.
- `red-basis-and-return-bound.log`: expected failures for callback policy drift and oversized return data.
- `red-size.log` and intermediate `green-*` logs: semantic tests could pass while Ledger remained undeployably large. They are not deployability claims.
- `covering-final.log`: 223/224 passed; the added profile getter limit incorrectly refused a 65-action recovery candidate before admission. The fix preserves the previous getter domain while retaining Core's 64-action admission cap.
- `covering-final-compatible.log`: final source covering result, including that compatibility regression.
- `cold-name-red-receipt.json`, `cold-name-red-manifest.json.gz`, and `node-paid-cold-name-calltree-red.log.gz`: cold native Name255 failed in the final phase under the unchanged joint350k pool (prefix217008 gas, final130230 gas exhausted).
- `green-cold-name-grammar.log`:83/83 focused tests after equivalent constant-bitset Name grammar work, including exhaustive byte equivalence and boundaries. `node-paid.log` then passes68 transactions (64 success/four expected refusals), including cold Name255/punctuation/mixed255, signed matched6/7, eight-ref application and55CREATE.
- `node-paid.log` and `paid-report.json.gz`: normal artifact deployment, runtime/dependency identities, exact hash vectors, real signed/native/guarded transaction receipts, and application rollback checks. These are **LOCAL_RPC_OBSERVED_NOT_STATE_PROOF**, not public-network or verified-storage proof evidence.
- `paid-receipts.json.gz`: complete mined receipts/raw disposable transactions for the paid run.
- `artifact-sizes.json`: build-template byte counts/hashes; deployed addresses and immutable-patched runtime hashes belong to `paid-report.json.gz`.
- `source-sha256.txt`: exact source inputs for this evidence packet.

Large JSON evidence and raw failed-run logs use deterministic `gzip -n`. Inspect losslessly with
`gzip -dc paid-report.json.gz` (similarly for the receipts and RED manifest).
`compressed-evidence-manifest.json` and `compressed-logs-manifest.json` record each uncompressed byte count and
SHA-256; all seven decompression/hash round trips were verified. No paid rerun
was needed for this packaging change.

Foundry `gas:` lines include test harness/setup work and must not be reported as
transaction receipt costs. Named warm-call diagnostics exclude setup but remain
warm local measurements. Paid Node receipt costs are whole transactions with
15,000,000 gas limits, below the unchanged 16,777,216 hard ceiling.

## Compatibility and resource boundaries

`readSetHash` changes Solidity mutability from `pure` to `view`; selector and hash
encoding are unchanged. Its source interface is updated. Acceptance-profile
hashing preserves ordering, registry rows, unknown-Type behavior and the public
getter's oversized-candidate domain. Actual unknown-Type admission still fails.

Required index callbacks intentionally change execution dependency semantics:
each prefix segment is maintained once, then the final hook must return exactly
32 ABI bytes containing its selector acknowledgement under STATICCALL. The
acknowledgement is not a trust substitute for code/manifest identity.

The aggregate index allowance remains `200000 + 150000 * actionCount`, shared by
prefix and final dispatch including measured dispatch work. Return data is
limited to 4096 bytes before copying; oversized success or failure responses are
rejected with `E_INDEX_RETURNDATA(size)`. Ledger bounds helper error copies to
4164 bytes (largest `E_INDEX(bytes)` encoding). No arbitrary delegate target or
helper-owned canonical storage exists.

`lastPublication` is a staged-prefix maintenance marker, not a final receipt.
Coverage is prefix coverage. The namespaced Core lock distinguishes synchronous
active publication state; committed external observations follow transaction
success. Registry epoch and execution identity are rechecked after each prefix
callback, before another rule can run, and after the final check.

Full generic families, populated replacement/replay, busy-Realm read pressure,
live contract Files and proof/identity closure remain later packets. This packet
does not claim every Cartesian maximum workload fits the unchanged allowance.

Final Ledger runtime24,375 bytes leaves only201 bytes; constructor initcode with
arguments27,882. Support runtime2,563/init2,589. Actual Ledger deployment including
its helper costs5,958,151 gas. Cold native Name255 bind851,643;55CREATE5,485,372;
signed matched scale6 success1,796,750, scale7 refusal524,778 and final-index
refusal1,809,602. No budget increase was used to achieve those results.
