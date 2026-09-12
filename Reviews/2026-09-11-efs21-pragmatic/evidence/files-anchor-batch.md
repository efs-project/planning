# Files anchor batching: fewer acquisitions, no default-profile latency gain

**Standing:** measured disposable FullC0 Files consumer experiment; source/evidence handoff for independent review. No protocol/read-ABI freeze, production rollout, public deployment, paid-gas saving or one-call listing claim.

The real directory consumer now batches independently source-checked, unique uncached anchor Records, at most eight per acquisition. It retains Record ID/Type/body assessment, admission bounds, historical first-mutation/target checks, duplicate-role checks, real Lens selection, child/charter/mount checks, and aggregate sealing. It saves RPC calls in these fixtures, but returned bytes increase and default-profile delayed latency is slightly worse.

**Fewer RPC requests, no demonstrated default-latency improvement:** observed delayed medians are approximately 1.5% slower with larger responses. There are only three samples per condition; this is not a claim of universal slowdown. Keep the source-qualified batch an experimental candidate, not a normative SDK-default recommendation.

## Source and method

- Reviewed scalar source: `8f101f1f94fe46a6ac90b6287443929427fa9b23`, `Reviews/2026-09-09-files-reader/files-reader.mjs`, SHA-256 `b1d507a4d7e6284b9993835758a85fa3e7f963da42a8d6c14190c360b3911b97`.
- Implementation source: `dad1b27bad8b0897efc7c57c4531cc5a01baf518`. Primary runner freeze: `a68315f4fcd561ce9cf36be911a99e8ecfd8735b`. Files/scope implementation did not change between them.
- Primary evidence: [files-anchor-batch.json](files-anchor-batch.json), 24 paired samples / 48 fresh scopes. Both arms use actual `DEFAULT_LIMITS`: 4096 requests, 32 MiB cumulative result bytes, 262144 response bytes, 16 concurrent requests, 60000 ms active-window deadline. No ceiling was raised.
- Separate sensitivity: [files-anchor-batch-sensitivity.json](files-anchor-batch-sensitivity.json), another 24 pairs at explicit 512-request/four-wide bounds, source `dad1b27`. This is **not** default browse performance. Its originally exclusive output was moved byte-for-byte to this distinct retained path before the primary run.
- Frozen scalar and candidate import the **same** current `reader-scope.mjs` singleton. Only frozen Files imports are resolved to absolute module URLs in the test-only harness; no scope/continuation brand is duplicated.
- Each pair reads the same deployment, source manifest and exact block with fresh scopes, in alternating order across three samples at 0/50 ms injected per-request delay. Eight names and then 17 names share two authors and two maintained File nodes. Both authors reference the same Entry per name, so their anchor Record IDs deduplicate; other multi-author workloads can have fewer cache hits.
- The eight-name/page8 case is one sealed page, not a continuation experiment. Eight/page4 has two pages; 17/page4 has five and 17/page8 has three. Same-scope full rebrowse is separately labelled reuse.
- Deployment/publications and independent retained-state oracle construction are outside all read timers. Every returned row, full final inventory, source progress and qualification matches the independent oracle and frozen scalar consumer. Each completed phase asserts exact actual-transport/evidence digest multiset, request count and result-byte sum equality.
- Retained JSON includes exact source/compiler/artifact/runtime/manifest/header pins, independent oracle snapshots, per-phase timing/selectors/counts/bytes/concurrency, compact evidence hashes, and real checked-batch calldata/decoded responses. Full runtime scope evidence is unchanged. Serialized JSON request/response bodies exclude HTTP framing, TLS and UI/module delivery; result bytes are the existing scope budget metric.

Primary exact blocks:

| Names | Number | Block hash |
|---|---|---|
| 8 | 53 | `0x32ea249978aa7eafe1114c87f1562e034ea942ba46d2519ce8c6c9919540f09d` |
| 17 | 80 | `0x3826b78286cbbd3a43ded96d5c1abb14e9c593cf40ada487aacc78856bb13956` |

## Primary result

All counts below cover the entire browse, including every four-request page seal but **excluding** the separate 36-request cold qualification. Times are median total browse milliseconds across three samples. The two timing columns show scalar → candidate, not a confidence interval or production SLA.

| Names / page size | Browse + seal RPC | 0 ms delay, ms | 50 ms delay, ms | JSON result bytes |
|---|---:|---:|---:|---:|
| 8 / 4 | 92 → 86 | 24.3 → 25.5 | 1592.9 → 1611.9 | 59590 → 61358 |
| 8 / 8 | 86 → 79 | 21.6 → 20.4 | 1219.0 → 1237.2 | 55811 → 57191 |
| 17 / 4 | 173 → 161 | 47.0 → 48.6 | 2775.3 → 2811.8 | 116102 → 120150 |
| 17 / 8 | 161 → 147 | 41.9 → 41.7 | 2008.5 → 2038.6 | 108546 → 111818 |

Thus browse/seal calls fall 6.5–8.7%, while delayed medians rise about 1.2–1.5% and returned JSON bytes rise 2.5–3.5%. Tiny loopback differences are not evidence of a reliable speedup. At four-wide sensitivity, page8 delayed medians improve (eight names 1690.4 → 1655.1 ms; 17 names 2959.1 → 2873.0 ms), while page4 still slightly regresses. That narrower configuration cannot establish a current-default latency gain.

For eight/page8, scalar `getRecord` acquisitions fall 26 → 18 and one real `getRecordsChecked` replaces the eight anchor acquisitions. **Still present:** 19 `getOccurrenceByOrdinal`, 19 `getBindingAtBasis`, 3 `getBindingHead`, 3 `getOccurrence`, 2 `validatePlan`, 2 posting pages, 8 real `resolve`, and 4 seal controls. Including qualification, the complete cold observation is 122 → 115 requests, not one call. For 17/page8, scalar Record reads fall 44 → 27 plus three batches; the other source/Lens obligations remain.

Default first-sealed-page delayed medians: eight/page4 1198.9 → 1217.1 ms; eight/page8 1219.0 → 1237.2 ms; 17/page4 1206.6 → 1221.0 ms; 17/page8 1221.7 → 1233.6 ms. Qualification stays 36 requests (roughly 342–354 ms at injected delay in these samples), every seal stays four, and peak observed concurrency is at most 16. Same-scope full rebrowse needs exactly four fresh seal controls per page, with no repeated batch acquisition.

## Failure and compatibility boundary

Capability is optional exact implementation metadata, `readCapabilities.checkedRecords = "v1"`. Unsupported values/shapes refuse configuration without transport. The scope exposes immutable `capabilities.checkedRecords` selected from the qualified **active** implementation at the pinned block; capability metadata participates in the existing manifest/continuation context. This source declaration does not independently prove arbitrary deployment correctness. Legacy manifests stay scalar and make no selector probe.

Cache ownership remains per-scope `WeakMap`. Scalar and batch reads retain the existing assessment result for callers plus internal real acquisition identity. Batch siblings share one actual evidence ID and have distinct evidence indexes. Wrong count/order/ID/basis/noncanonical ABI never creates a successful prefix. Valid assessed siblings may survive an individually bad Record; failed outcomes belong only to the drained attempt and can be reacquired by an explicit later `loadMore`. Terminal scopes still require a fresh independently qualified acquisition. No claimed-batch failure triggers a scalar retry.

Focused coverage includes scalar/oracle equivalence, legacy/no probe, false capability/no fallback, shared/cached IDs, empty/1/8/9/32-row pages, malformed/absent/future eighth Record, altered Type/ID, genuinely unsupported content-addressed Type, occurrence disagreement, wrong basis/order, close/abort/source switch, reorg at seal, request/byte exhaustion, identical-ID recovery, prior sealed frontier retention/resume, capability-context drift, and active historical implementation selection. Closing mid-group prevents further groups and downstream data without closing the caller-owned scope.

## Verification and reproducible commands

Commands ran serially from the worktree root with owned `EFS_TEST_BUILD_ROOT=/tmp/efs-files-anchor-build.z8yXEi`. Initial build additionally used `EFS_TEST_FULL_BUILD=1`. That test build is now removed. Paths below are repository-relative.

Behavioral RED: the initial `node --test --test-concurrency=1 Reviews/2026-09-09-files-reader/test/anchor-batch.test.mjs` failed at **real checked anchor acquisition**, after already matching the scalar's actual eight qualified rows. The first implementation turned this green. A later closure falsifier caught unwanted downstream acquisition after the final batch; the seam check fixed that before final verification.

Full reader command: **66/66 pass**, zero skipped, before the last two focused cases were appended. Those two cases passed in the subsequent full bounded affected run.

```sh
EFS_TEST_BUILD_ROOT=/tmp/efs-files-anchor-build.z8yXEi node --test --test-concurrency=1 Reviews/2026-09-09-files-reader/test/{abi-shapes,anchor-batch,checked-record-batch,continuation,files-profile,files-reader,reader-scheduling,reader-scope-live,reader-scope}.test.mjs
```

Final bounded affected command: **202 tests: 201 pass, 0 fail, 1 pre-existing skip**. This includes the final **26/26 anchor tests**, four upgrade test files and 21 browser-consumer test files. Do not add these counts to the earlier reader count: anchor coverage overlaps.

```sh
EFS_TEST_BUILD_ROOT=/tmp/efs-files-anchor-build.z8yXEi node --test --test-concurrency=1 \
  Reviews/2026-09-09-files-reader/test/anchor-batch.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/{anvil-cache-lifecycle,compiler-evidence,upgrade-chain,upgrade-reads}.test.mjs \
  Reviews/2026-09-09-files-browser-mvp/test/{action-journal,authority,browser-lifecycle,byte-commitment-matrix,completeness-regressions,cost-defaults,cost-ledger,economics-panel,effect-readback,export-roundtrip,export-verifier,file-routes,reader-extensions,router,rpc-diagnostics,rpc-response-validation,silent-absence,sponsor-abuse,sponsor-journal,type-cache-boundary,verified-download}.test.mjs
```

The existing 64-field compiled-Type chain canary is skipped by its source; its pure test passes. No assertion was weakened to change this. Root approved a narrow historical scheduling fixture correction: both `eb14059`/current scheduling arms use the same cloned manifest without capability metadata, retaining every exact request/result/byte/cache assertion and four-wide bound. The new anchor comparison uses real advertised support.

Additional checks passed: `git diff --check`; `node --check` on the benchmark; strict public declaration consumer:

```sh
node Reviews/2026-09-04-mvp-rehearsal/node_modules/typescript/bin/tsc --strict --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 Reviews/2026-09-09-files-reader/test/sample.ts
node Reviews/2026-09-11-efs21-pragmatic/scripts/files-anchor-batch-benchmark.mjs
```

The benchmark owns its isolated full build and finite Anvil, refuses dirty source and an existing output, and asserts cleanup before writing evidence. Replays need a separately authorized exclusive evidence path; do not overwrite either retained file.

Contract/write/profile source is unchanged from `8f101f1`: `git diff --exit-code` was clean for Core/upgrade Solidity sources, browser contracts and SDK, native contracts/SDK, `files-profile.mjs`, and historical browser evidence. No new Forge-test claim is made; the source-pinned managed deployments enforce existing ordinary runtime/initcode/transaction bounds. The worktree hook installer is not worktree-aware and refused its local `.git/hooks` path; the existing shared commit hook was verified present and validated message-file commits.

## Operational exception and cleanup

An initial overly broad regression glob accidentally launched three trace diagnostics: upgrade `tag-current.test.mjs`, upgrade `validation-frontier.test.mjs`, and browser `tag-joins.test.mjs`. The first two had already used `debug_traceTransaction`; the tag diagnostic had already traced its 100/200-entry pricing after its 1000-attester phase when detected. Its exact child PID 52559 was interrupted with SIGINT; its owned Anvil PID 52758 exited and cache suffix `efs-anvil-cache-dSksC2` was verified removed. That interrupted run is **not** task evidence or an all-browser-pass claim. These three files were excluded from the clean bounded rerun; their source was not changed. This was an execution-scope mistake, not a protocol result.

After process exit, the only attributable historical JSON rewrites (`byte-commitment-matrix.json`, `tag-joins.json`) were restored byte-for-byte from the clean base. The bounded rerun again regenerated the byte-commitment receipt, which was restored after exit. No old receipt was promoted to this new run. Legacy `withStateful` diagnostics do not expose unique cache ownership; no shared/default cache was broadly removed or claimed cleaned.

The owned 76 MiB test build was deleted only after its tests exited. Primary benchmark PID 60946 exited 0, cache suffix `efs-anvil-cache-2EqGSX` and its build were removed. Sensitivity PID 60652 exited 0, cache suffix `efs-anvil-cache-L9QqnN` and its build were removed. Both JSONs retain exact cleanup paths. Final source/evidence hashes match. Free disk remained over 282 GiB (about 283 GiB at final check), well above the 20 GiB stop threshold.

Native UI 54154 / RPC 54148 and Fable UI 60731 / RPC 60726 remain listening, untouched; no restart, migration, funds, production deployment, new public service or raised limit. The implementation/build/new finite-world slot is released for root's independent review and publication decision.
