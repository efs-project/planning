# Road C test-harness repair — September 13, 2026

**Standing:** bounded test/config repair at source pin `731200d1d4f52b77e985049b5ebfa6b3ff9950b8`; no Anvil, measurement script, vendor edit, or Core semantic edit was made by this repair. The pre-existing `src/LedgerErrors.sol` parameter rename and the interrupted helper split are Claude Fable 5.1 work preserved from the quota handoff.

## Outcome

- Fresh verification: **37/37 tests pass**, including 13 Publish (9 `PublishTest` + 4 `PublishAuthTest`), 7 Import, 6 Selection and 11 raw-denial tests. Exit 0; no failures remain.
- Normal EIP-170/EIP-3860 gate: all test contracts, helpers and deployables fit. Tightest deployable is Ledger, runtime 23,145 B (1,431 B margin); largest test is ImportTest, runtime 19,119 B. OpenStore initcode is 25,292 B, now deployed from its artifact rather than embedded.
- `Deploy.sol` uses the single `FOUNDRY_OUT` artifact root for `getCode` and Ledger JSON. It consumes the artifact's sole scalar `linkReferences` location, validates the expected source and exact placeholder, refuses missing/multiple/unexpected references, and checks the deployed Ledger contains the actual deployed ImportLib address. CREATE continues to bubble constructor revert data.
- `DenialProbe` and `OpenStore` are artifact-deployed. The actual FixtureRealm deployer remains the caller for attach checks. The 37 behavioral tests, typed acceptance/import, raw-writer positive controls and constructor-revert expectations remain present.
- An additional red run exposed memory aliasing in the test's `_clone`: the allegedly untouched signed intent accumulated earlier mutations. Field-by-field copying repaired the harness without relaxing the final original-intent acceptance assertion.

## Lease, environment and exact runs

Lease: `/root/c_harness_repair`, 02:17–02:45 UTC. Work ran 02:19:58–02:33:06 UTC. Scratch is `/private/tmp/claude-501/-Users-james-Code-EFS/089e21d8-6171-40d6-9cac-1d2e941506f9/scratchpad/build/lab-c/repair-20260913T0219Z` (10 MiB); prior build-3 material was untouched. The configured `out` path was a temporary symlink to `repair-20260913T0219Z/out-rel`, so Forge, `getCode`, linked JSON and `fs_permissions = read ./out` resolved to one run-owned artifact tree. Cache was `cache-rel`; logs are `logs/`.

Compiler: Forge 1.7.1 (`4072e48`); `/Users/james/Library/Application Support/svm/0.8.30/solc-0.8.30`, SHA-256 `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`; offline, Cancun, optimizer 200, via-IR, two threads, normal limits. `effective-config.json` records the effective config. Exact commands (each wrapped in Perl `alarm`, 480 s build / 300 s tests):

```text
FOUNDRY_OUT=<repair-out> forge build --sizes --offline --threads 2 --use <cached-solc> --out <repair-out> --cache-path <repair-cache>
FOUNDRY_OUT=<repair-out> forge test -vvv --offline --threads 2 --use <cached-solc> --out <repair-out> --cache-path <repair-cache>
FOUNDRY_OUT=out FOUNDRY_CACHE_PATH=<repair-cache-rel> forge build --force --sizes --offline --threads 2 --use <cached-solc>
FOUNDRY_OUT=out FOUNDRY_CACHE_PATH=<repair-cache-rel> forge test -vv --offline --threads 2 --use <cached-solc>
```

Red: build PID 56059, 02:19:58–02:20:12, exit 0; test PID 56357 at 02:20:28, exit 1, four suites failed in `setUp` because the linker read missing local `out/Ledger.sol/Ledger.json` while Forge wrote scratch artifacts. After the artifact/deployer repair, 36/37 passed and the clone-aliasing red was recorded. Green: final build PID 63629, 02:32:53–02:33:06, exit 0; final test PID 63670 at 02:33:06, exit 0, 37 passed / 0 failed / 0 skipped. Exact-name PID checks found no `forge`, `solc`, or `solc-0.8.30` process before or after final verification.

## Full normal-limit size report (runtime / initcode bytes)

| Artifact | Runtime | Initcode |
|---|---:|---:|
| PublishTest / PublishAuthTest | 19,074 / 13,902 | 19,100 / 13,928 |
| ImportTest / SelectionTest / RawWriteDenialTest | 19,119 / 18,027 / 16,917 | 19,145 / 18,053 / 16,943 |
| DenialProbe / OpenStore | 7,560 / 15,757 | 7,586 / 25,292 |
| FixtureActors / FixtureBuilders / FixtureExport | 938 / 4,645 / 11,507 | 4,749 / 4,671 / 11,727 |
| EvidenceReconstructor / FixtureRealm / FixtureSeeder | 4,962 / 4,703 / 12,071 | 4,988 / 4,729 / 14,577 |
| Ledger / ImportLib / IndexModule | 23,145 / 19,861 / 10,303 | 37,892 / 19,893 / 22,790 |
| LensReader / QuoteConsumer | 10,585 / 1,386 | 10,843 / 1,412 |

Machine-readable report: `logs/final-full-size-report.tsv`, SHA-256 `8bb256d7e41aff25091dcbeb99892e13e05d9cf83a223005e1091b4f02e8211e`.

## Hashes and retained evidence

- Source-hash manifest: `logs/source-sha256.txt`, SHA-256 `b346573e0c2092817907a824a8972143ce74072fcaf6268f47b8a11ddb0d3aed`. Key repaired sources: `test/Deploy.sol` `6b2aef30…cb58`; `test/Publish.t.sol` `00d9bd7e…92bc`; `test/RawWriteDenial.t.sol` `bfa1c33b…e7d0`; `test/FixtureRealm.sol` `4565be1b…a970`; `test/Vm.sol` `cff6e3efeed41fc317d5107cc4d3d770038626703b3f4ddff7cdeee070c0724b`; `foundry.toml` `9c794800…d0c7`.
- Artifact-hash manifest: `logs/artifact-sha256.txt`, SHA-256 `6ed6b355d640c017d26a65f4cb056e3667d4d104767f8dcf9240b34b854addc1`. Key artifacts: Ledger `c731ca5a…3844`; ImportLib `7f935762…2953`; IndexModule `b7040edf…2fba`; PublishTest `791a74ce…e727`; PublishAuthTest `e08472fc…356c`.
- Final build log SHA-256 `62bdb68e274f7f30b32aa2098fb9e26e078dc00f3078878b959af56eba841743`; final test log SHA-256 `4ba6bdede690681be0a632d1ce93d58366dab0cd098093f0c83cdef11a18e7e6`.

These are local Forge test results, not Anvil, browser, deployment, authenticated-chain, cost, or architectural-adoption evidence.
