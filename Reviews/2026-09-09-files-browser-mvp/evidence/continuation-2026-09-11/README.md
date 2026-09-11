# Same-basis directory continuation — retained real-chain runs

Both reports exercise the actual FilesRouter, exported reader and browser direct-RPC transport. They run on the fixed deployable Solidity baseline `4de8157` plus explicitly pinned Codex reader/transport/compiler/cache-lifecycle changes, **not** Fable's later code-backed Type-cache candidate. Reports retain exact source/build hashes, receipt hashes, expected and observed entries, qualifications, resource samples and measurement boundaries.

| Run | Reader settings | Result | Actual read work |
| --- | --- | --- | --- |
| [48 names](48.json) | page4 / request budget256 | exact48 COMPLETE,12 pages,4 acquisitions | 928 logical RPC entries,269 HTTP requests,1,955,080 response payload bytes |
| [1,000 names](1000.json) | page32 / request budget4096 | exact1000 COMPLETE,32 pages,3 acquisitions | 11,560 logical RPC entries,838 HTTP requests,8,372,489 response payload bytes |

The 1,000-name arm had an exclusive local test slot: qualification18.5ms, first useful sealed prefix115.6ms, full reader result2,778.8ms. These are one local Node/Anvil run, **not** browser paint time, WAN latency, percentiles or a production RPC service guarantee. HTTP payload bytes exclude headers/framing/TLS. The smaller correctness run could overlap other correctness work; it is not a controlled timing comparison.

The large arm used1,001 separate signed directory-creation transactions (parent plus children), total5,169,088,831 receipt gas, maximum5,279,773 per transaction. This is not one atomic import or one user approval. Read RPC work is not paid transaction gas. No cross-chain prices are inferred.

Two budget failures were resumed at the same observation; exact names, object IDs, selected-entry IDs and kinds match the write oracle without duplicates.13 deliberately corrupted oracle cases and disk-guard boundaries have separate pure checks in [the experiment](../../test/continuation-scale.perf.mjs).

The large run's sampled Anvil cache peaked at7,015,542,784 bytes (~6.53GiB) and was removed after confirmed node exit. Sampling overhead is included in timing. The report retains the diagnostic cache path even though that disposable directory no longer exists. The small run's cache was also removed. Neither deletion removed these retained evidence files.

## Reproduction

The experiment intentionally requires the fixed verification checkout at `4de8157` with its pinned JavaScript changes; a new Solidity checkpoint needs a separately labeled arm. Set `EFS_TEST_BUILD_ROOT` to an isolated artifact root and `EFS_SCALE_OUTPUT` to a new absolute report path; an existing output refuses. `EFS_SCALE_COUNT=1000` selects the large arm. Compiler dependency allow paths are environment-specific. `--self-test` runs only the oracle and resource-guard checks.

The script checks50GiB initial free space,40GiB ongoing free-space floor, and60GiB owned-cache ceiling. These are sampled operational abort guards, not protocol limits or hard quotas. No history pruning or traces were used.

## Limits and next engineering target

Continuation at1,000 live names is proven by this arm.10k, fixed-live/high-history churn, broad Lenses, tag-filter universes, sustained memory and proof-based recovery are not.838 HTTP requests and11,560 logical calls remain material remote-RPC pressure: next compare a bounded same-basis bulk-read path and realistic transport delay before claiming comfortable remote browsing. The first-page and complete-result measurements must remain separate.

Exact retained SHA256:48.json `0bde20a1fed6b892fe8091057206b857b72d7eb90d6325fa747b4dcfaf58a128`;1000.json `3593d6f0eec400bc46bbe46efa67bb58300656610bf7f89b9b83a77a670ab45f`.
