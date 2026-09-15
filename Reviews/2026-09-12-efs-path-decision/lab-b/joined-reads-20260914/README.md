# Task 5A — bounded joined Files reads

Review follow-up: [fix round 1](fix1/README.md) records I1–I5/M1–M3, fresh final-reader controls and separate source pins. The original campaign below remains historical at2975ba7; its receipts were not relabelled.

**Status:** implementation and local evidence complete; parent independent review and actual CUA remain separate.
**Scope:** disposable compact prototype; contracts-dev / codex / task5-joined-reads-20260914. No public deployment, push, Core policy change or production SDK claim.
**Source:** accepted parent `4dec0c9a5ea2e6a855613bb149181ce4660cf74e`; final working-source keccak pins and compiler metadata are recorded before deployment. The commit containing this report supplies the final source history.

## Outcome and architecture

One external `FilesPageReader` projects bounded live candidates through the existing `FilesLiveLens.listPrincipals` worker. Ordered placement/masking and ordered/diagnostic point HEAD resolution reuse the existing Lens implementation. No second Files engine, unordered folder-membership policy, Core getter, Core session or prefix rescan was added. Ledger and TypeRegistry creation/runtime bytecode exactly match the accepted carrier artifacts.

A page joins retained Name, stable target kind, selected HEAD/header, and requested stable/selected-revision tags. Headers authenticate retained admission/type/coordinates, not full revision-body digests. Full content bodies and external carriers are not fetched by listing. Directory descriptors are ordinary stable tag subjects, with NOT_APPLICABLE revision assessment and no synthetic HEAD. Diagnostic HEAD conflicts retain placement/Name/File provenance and independently known stable-tag results; revision assessment is UNKNOWN.

Unsupported, unavailable and invalid joined evidence remains qualified and retained rather than being filtered into an empty proof. The carried partial Name-coordinate failure preserves a successfully selected placement's target, author, revision and admission. Existing lowercase Name grammar stays unchanged; uppercase SDK search is normalized.

The stateless Solidity cursor is domain-bound to caller/reader/folder/principals/query/basis, not authenticated. `scanStatus` UNKNOWN/PARTIAL/EXHAUSTED means segment traversal; `startsAtOrigin` means empty input cursor. `completeFromOrigin` requires origin, exhaustion and scanned==rawTotal. `FilesPagePaid.queryAbsent` additionally requires zero retained rows. Forged terminal/skipped-prefix cursors cannot establish whole-query absence.

The new SDK API has a distinct shape:

```js
{
  kind: 'files-joined-page',
  basis, pageRows, queryKnowledge, queryCoverage,
  scanStatus, segmentStartsAtOrigin, segmentCompleteFromOrigin,
  completeFromOwnedOrigin, retainedSoFar, queryAbsent,
  scanned, scannedSoFar, rawTotal, selectedSoFar, hydrations,
  nameCoverage, kindCoverage, headerCoverage, tagCoverage,
  continuation // only when partial
}
```

Generic `value/knowledge/coverage` fields are absent on every branch, including UNKNOWN. `pageRows` contains only new rows. Query completion is composed only through the SDK's private origin-started contiguous chain, checked against the pinned raw total. `retainedSoFar` includes uncertain rows; queryAbsent requires full owned-origin coverage and zero accumulated retained rows. Empty filtered/masked terminal suffixes do not erase earlier matches. UNKNOWN cannot become an empty-query claim.

Continuations refuse a changed instance/context/Lens/folder/query/filter/HEAD mode. Exact canonical block hashes are rechecked on every call and cache hit. A cache is bounded to32 pages and8 selector domains per owned context; it is not a global Name/body cache. The UI explicitly accumulates pageRows before adapting to its folder-result presentation, does not filter the qualified rows a second time, and distinguishes a filtered empty query from an empty folder. Refresh/Continue requests one candidate-budget32 page. Only the selected inspector hydrates a full revision; external bytes still require Open verified bytes. Tiny verified PNGs have a bounded visible checker frame and intrinsic dimensions without changing decoder/pixel limits.

## Real-chain scale evidence

[Evidence index](evidence-index.json) lists SHA-256 checksums, raw/compressed sizes and original run paths. Each retained run includes gzip-compressed report, manifest and append-only signed-input/receipt journal. Source/compiler/profile/code hashes are in [live/churn](final-live-churn/joined-measurement.json.gz), [dense](final-dense/joined-measurement.json.gz), and [read diagnostics](read-diagnostic/joined-read-diagnostic.json.gz). The [final source/artifact snapshot](final-source-artifacts.tgz.gz) is double-packed (gunzip, then tar -xzf); historical reader artifacts are retained separately for the failed reserve replay. The bundle is approximately8 MB, not the uncompressed run directories.

Toolchain: solc0.8.30+commit.73712a01, optimizer200, viaIR, Cancun; Anvil1.7.1 commit4072e48705af9d93e3c0f6e29e93b5e9a40caed8; Node26.0.0; raw-sha256-aesgcm-v2; local chain31337. Manifests include exact Types, code hashes, contract bindings, constructor args and deployment transaction hashes.

Actual deployed sizes (creation calldata includes constructor args):

| Contract | Runtime bytes | Creation bytes |
|---|---:|---:|
| Ledger | 24,173 | 24,956 |
| FilesPageReader | 16,138 | 16,816 |
| FilesPagePaid | 3,135 | 3,161 |

Every real environment enforces24,576 runtime /49,152 initcode limits. [Artifact equality check](runtime-pins.json.gz) separately reports artifact creation bytes without constructor args. Ledger has403 runtime bytes of headroom, unchanged. A broad `forge build --sizes` also reports pre-existing intentionally oversized negative-test factories; it is not misrepresented as an all-contract size PASS.

### 1,000 live Files

Real250 setup transactions, four entries per batch, total1,371,442,622 gas; maximum5,565,215 gas. Each File has41 inline content bytes, retained Name, HEAD and placement; even selected revisions have the requested tag. Sparse domains put width-1 empty authors before Alice: this is deliberately not a64-contributor claim. Every traversal scans1,000 candidates, selects1,000 placements, and retains500 revision-tag matches.

| Width / budget | Pages | Cold full ms | Warm full ms | Cold HTTP | Warm HTTP | Cold response bytes | Paid first-page gas | Paid calldata bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 /32 |32|482.52|84.99|65|32|1,511,497|4,681,417|580|
| 8 /32 |32|405.88|67.83|72|32|1,511,752|11,366,129|804|
| 32 /8 |125|859.43|781.35|282|250|1,815,358|8,818,468|1,572|
| 64 /4 |250|1,420.73|1,459.50|564|500|2,223,420|8,600,879|2,596|

Cold first pages respectively take12.56/12.61/12.88/11.86 ms,3/10/34/66 HTTP calls, and return48,352/48,638/15,830/11,510 response bytes. They scan32/32/8/4 candidates and retain16/16/4/2 rows, all PARTIAL. Full cold request bytes are67,125/82,952/518,237/1,549,178. Logical RPC calls equal HTTP requests; HTTP batches=0 throughout.

Pinning is separate:88 calls, about257.7 KB response,23.46–34.24 ms for these live cases. The first cold page includes selector validation overhead; later pages do not repeat it. Warm caches save most reads only when the full traversal fits32 pages. Width32/64 traversals exceed that cache, so sequential rereads thrash it; width64 warm time is slightly slower, not claimed as a universal cache improvement. Full-revision payload bytes fetched by the list path=0; this is not a claim that Name/header response bytes are zero.

### 10,000 lifetime Names, one live placement

Real834 churn transactions,12 transitions per batch, total5,191,875,715 gas; maximum6,243,763 gas. Every prior positive Name remains retained while predecessor placements are unbound. This is actual chain history, not fabricated storage or a projection.

| Width / budget | Candidates / selected / rows | Cold ms | Warm ms | Cold HTTP | Response bytes | Paid gas |
|---|---|---:|---:|---:|---:|---:|
| 1 /32 |1 /1 /1|1.82|0.43|3|5,411|310,371|
| 8 /32 |1 /1 /1|2.09|0.46|10|5,703|561,846|
| 32 /8 |1 /1 /1|5.43|0.63|34|6,711|1,419,353|
| 64 /4 |1 /1 /1|9.13|0.85|66|8,056|2,576,475|

First page equals full traversal (COMPLETE). Warm reads use one canonical-block HTTP request. The mandatory live inventory avoids scanning10,000 lifetime names here; the larger retained Ledger state still costs real setup resources.

### Dense overlapping contributors

Separate sequential fixture:64 actual funded author wallets, four shared names, competing placements/HEADs, even revision tags and a higher-author placement mask.132 setup transactions including funding/support setup,265,292,430 gas total, maximum4,603,845 gas. Width N sees4N-1 candidates; three placements survive ordered selection. This dimension is bounded independently from the1k seed.

| Width / budget | Candidates | Selected | Retained tag matches | Pages | Cold / warm ms | Cold / warm HTTP | Paid first gas |
|---|---:|---:|---:|---:|---|---|---:|
| 1 /32 |3|3|1|1|1.79 /0.46|3 /1|572,996|
| 8 /32 |31|3|1|1|3.26 /0.54|10 /1|1,342,667|
| 32 /8 |127|3|1|16|27.95 /7.15|64 /16|1,951,173|
| 64 /4 |255|3|1|64|128.58 /115.71|192 /128|3,219,838|
| 64 /4, HEAD conflict |255|3|3|64|132.53 /122.11|192 /128|4,067,477|

Dense64 cold response bytes212,928; conflict218,560. Conflict mode keeps the same ordered placements and retains all three uncertain revision-tag rows. Only HEAD assessment changes. All final traversals complete at their pinned basis; no mining occurs between their first/last pages. Paid consumer transactions run after the cold/warm traversals.

### Resource bounds and stopped attempts

Each fixture has15-minute wall,256 MiB output,768 MiB Node RSS and1.5 GiB Anvil RSS stop limits,15M setup gas,16,777,216 maximum signed transaction gasLimit and unchanged30M block budget. Action count is asserted against MAX_ACTIONS=64 before broadcast. Append-only benchmark journals avoid rewriting all prior signed inputs and drop raw transactions from the in-memory summary; this is harness I/O optimization, not chain gas savings.

Benchmark-only RPC history16 / transaction keeper32 is explicit; default demo behavior stays256/512. This shorter ephemeral RPC history does not shorten retained Ledger history. Each seeded phase is read/flushed before later writes, and dense setup uses another fixture. Node high-water RSS is measured by process.resourceUsage; Anvil RSS/output are sampled at bounded checkpoints, not continuously sampled instantaneous peaks.

Final live/churn fixture:110.36s,1,087 setup/support transactions,6,565,119,624 setup gas; Node high-water428,687,360 bytes, sampled Anvil peak658,653,184 bytes, output54,470,653 bytes. Dense fixture:4.94s, sampled Anvil90,636,288 bytes, output2,234,871 bytes; Node high-water remains process-wide across sequential fixtures. Build scratch approximately22 MiB; free disk262 GiB at final checks. Every owned fixture closed; owner browser60608/RPC60599 and processes77526/77561 stayed untouched.

Three failed attempts are retained rather than replaced by projections:

1. [Batch10 STOPPED](stopped-batch10/joined-measurement.json.gz):55 actions,15M signed gasLimit, receipt9,185,671 gas, no1k seed. Exact bounded pre-state replay at admission7 decodes `E_GAS()`, selector0x4a4b0108, not an unrelated callback failure. [Replay evidence](reserve-diagnostic/batch-reserve-diagnostic.json.gz) binds the old addresses/code hashes and failed signed input. The accepted reserve is200k+150k/action; no Core/reserve change. Approved live4/churn12 preflight passed on real batches.
2. [History256 STOPPED](stopped-history256/joined-measurement.json.gz):1k/live and10k/lifetime seeded, but no joined-read results before dense16 reached sampled Anvil1,779,171,328 bytes at130.9s. This is a benchmark retained-history/resource cliff, not a joined-read completion. Approved history16/keeper32 plus phase flushes/separate dense fixture resolved it.
3. [Page32 STOPPED](stopped-page32/joined-measurement.json.gz):1k read widths1/8 completed, width32/page32 became UNKNOWN and the runner stopped. The [small exact-width diagnostic](read-diagnostic/joined-read-diagnostic.json.gz) reproduces raw JSON-RPC -32603 `EVM error OutOfGas` with an explicit30M call bound, ruling out response size, pruning and SDK ownership as the cause.

Final diagnostics also show width64/page32 and16 OutOfGas at30M. Width32/page16 and width64/page8 succeed as direct calls but the paid wrapper simulation at16,777,216 reverts (code3, empty revert data); no higher signed cap is used. Actual successful small-control paid receipts: width32/page8=8,818,456; width64/page4=8,600,867 gas. Budget1 controls also succeed. The few-gas differences from full-scale receipts reflect actual calldata/basis differences, not projected values.

Practical measured starting budgets are32 for widths1/8,8 for32,4 for64; the ordinary two-author UI stays32. Input bounds1–256 candidates and1–64 principals are not universal gas guarantees. Wider selectors cost more EVM work even when aggregation reduces HTTP round trips. No automatic heroic gas increase or silent default change was made.

## Matched ordinary Files cost control

[Legacy](cost-legacy/joined-cost-control.json.gz), [guarded direct](cost-guarded/joined-cost-control.json.gz), and [nonmatched proxy inline](cost-proxy-inline/joined-cost-control.json.gz) retain fresh deployments and real receipts/inputs. The legacy11 artifact /12 source metadata pins are checked against67f92c5b000e63569eb0011a3688eb59ccb51893, using only its own ABIs and explicit legacy SDK branch.

The matched direct recipe is Alice→Bob, create gas-note.txt with salt id(measurement-primary) and41 x bytes, edit41 y bytes, File tag id(efs), selected-revision tag id(approved), application adoption, then fresh-name rename to renamed.txt. Old/new action kinds and body lengths are asserted equal; create bodies include73-byte Root and12-byte Name, edit105-byte Child. Actual reconciliation must be EFFECTS_VERIFIED.

| Operation | Legacy gas | Guarded direct gas | Legacy / guarded calldata bytes |
|---|---:|---:|---|
| Named create41B |1,626,220|2,259,447|2,404 /2,852|
| Edit41B |761,091|1,191,659|1,348 /1,796|
| File tag |544,718|812,657|868 /1,156|
| Selected-revision tag |544,706|998,511|868 /1,316|
| Fresh-name rename |818,464|1,324,819|1,604 /2,148|

All signed gasLimits are15M, below16,777,216 and the30M block limit. These are ordinary SDK operations, not bulk setup batches.

The separate proxy typed-Directory/Concept setup is **inline-only Files**, with create/edit gas2,080,582/1,225,947, File/revision Concept tag1,086,087/1,239,078, rename1,393,684. It adds retained Concept bodies35/40 bytes and omits the old inline-only application adoption. The profile is carrier-capable, but this recipe publishes NO352-byte Content descriptor and is not a fresh descriptor-backed upload journey. It is explicitly NONMATCHED, not a savings percentage against the direct recipe or full carrier journey.

All gas is local execution evidence, not total Ethereum/Base fees or ZKsync gas. No public fee quote or network/wallet receipt is inferred.

## RED, GREEN and final verification

Run from lab-b with existing ethers6, Anvil and the fresh bounded FOUNDRY_OUT/cache. No dependency installation was performed. Original absolute artifact/run paths and source hashes remain in the machine reports.

```sh
export EFS_ETHERS_PATH=/path/to/existing/node_modules/ethers
export FOUNDRY_OUT=/path/to/fresh-bounded-scratch/out
forge test --offline --out "$FOUNDRY_OUT" --cache-path "${FOUNDRY_OUT%/out}/cache" --match-test test_page_
node --test --test-concurrency=1 browser/joined.integration.test.mjs browser/directory-routing.test.mjs browser/files-view.test.mjs script/joined-harness.test.mjs
forge test --offline --out "$FOUNDRY_OUT" --cache-path "${FOUNDRY_OUT%/out}/cache" --summary
node --test --test-concurrency=1 browser/*.test.mjs script/joined-harness.test.mjs
node script/measure-joined.mjs
node script/diagnose-joined-read.mjs
EFS_BASELINE_FOUNDRY_OUT=/path/to/pinned-67f92c5/out node script/measure-joined-cost-control.mjs
```

The actual fresh build path was the owned scratch named in evidence-index/sourcePins; accepted carrier and legacy artifact directories remained read-only. Reserve replay additionally takes the failed run directory and requires its historical exact reader artifact, retained in this bundle; current reader bytecode deliberately fails that replay's old-codehash assertion.

| Focused invocation / failure | RED evidence | GREEN evidence |
|---|---|---|
| Node joined integration: missing page API, Name-coordinate failure erased target | [red-sdk](logs/red-sdk.log) | [green-sdk](logs/green-sdk.log) |
| Node routing: joined UI used point bodies; tiny PNG lacked visible frame | [red-ui](logs/red-ui.log) | [green-harness-ui](logs/green-harness-ui.log) |
| Node routing/harness: frozen SDK rows mutated; append mode missing | [red-harness](logs/red-harness-frozen.log) | [green-harness-ui](logs/green-harness-ui.log) |
| Forge page filter: unsupported row disappeared | [red-forge](logs/red-forge.log) | [green-forge](logs/green-forge.log) |
| Node joined warm page repeated all selector classification | [red-cache](logs/red-cache.log) | [green-focused](logs/green-focused.log) |
| Node small scale seed / benchmark history policy | [red-seed](logs/red-seed.log), [red-history](logs/red-history-policy.log) | [preflight](batch-preflight/joined-batch-preflight.json.gz) |
| Directory had synthetic HEAD; header helper unguarded | [red-directory](logs/red-directory-head.log), [red-helper](logs/red-helper.log) | [final focused](logs/green-final-page.log), [page-shaped](logs/green-page-shaped.log) |
| Forged terminal cursor claimed whole coverage | [red-forged](logs/red-forged-cursor.log) | [final focused](logs/green-final-page.log) |
| Conflict/HEAD failure erased independently known row axes | [red-head](logs/red-head-qualification.log) | [final focused](logs/green-final-page.log) |
| Missing Name/header + combined filter manufactured empty proof | [red-filter](logs/red-final-filter.log) | [final focused](logs/green-final-page.log) |
| UI re-filtered retained uncertainty; empty query called folder empty | [red-view](logs/red-final-view.log) | [page-shaped](logs/green-page-shaped.log) |
| Empty terminal suffix erased an earlier query match | [red-suffix](logs/red-sdk-empty-suffix.log) | [final Node](logs/full-node-page-shaped.log) |

The attempted mixed-case Name fixture in red-final-filter fails at the accepted Name rule, not search; that invalid fixture was removed, the unchanged lowercase grammar was confirmed, and valid uppercase-search normalization was tested in SDK integration. It is not counted as a fixed contract defect.

Final full [Forge log](logs/full-forge.log):323 passed,0 failed,0 skipped; compilation92.48s. Final full [Node log](logs/full-node-page-shaped.log):152 passed,0 failed,0 skipped,46.30s. Focused Forge final file has10 page tests (plus one matching existing test); focused Node page-shaped gate41 passed before the extra masked completion controls, which pass in the final full Node run. Tests cover unsupported/missing joins, selected-revision HEAD changes, Directory tags, actual pinned continuation after mutation, stale-basis/swap removal, hostile cursor prefixes, zero/finite budgets, continued/fully empty filtered and masked chains, and UNKNOWN page shape. Old Core/Files/SDK/carrier regressions remain in the full suites.

Self-review checked every new API caller, unchanged legacy imports/allowlist, exact-file scope, contract helper guarding, independent qualification axes, full/segment result naming, bounded cache semantics, setup versus normal operations, resource stop evidence, actual source/artifact pins and whitespace. No unaddressed implementation issue is claimed away: the measured wide-selector gas cliff, bounded cache thrash, partial-header assurance and local-RPC trust limits remain visible.

## Remaining limitations / handoff

This is prototype periphery/API evidence, not protocol adoption or production readiness. Contract reads are current-execution-basis checks, not portable state proofs; arbitrary supplied cursor domains are not authenticated. SDK EIP-1898 observations depend on the provider retaining the pinned block; pruning/reorgs are explicit failures, never silent latest-block continuations. A paid multi-transaction consumer must own its own chain/coverage state; the stateless consumer here licenses whole-query absence only in an origin-complete single call.

The read gas cliff is real and selectors are still an EVM-cost dimension. The accepted input maximum is not a safe default across every profile, query density, name length or RPC. Measurements are localhost latency and finite named recipes, not public-RPC SLAs, universal scale guarantees, total chain fees or ZKsync extrapolation. No full carrier-upload cost is established by the nonmatched inline control.

Parent owns independent review and actual browser CUA; this agent ran boundary/DOM tests, not visual CUA. No owner endpoint writes/reset/cleanup, reverse legacy imports, public deployment, push or new subagent was performed. The next safe step is parent review/CUA against these exact source/artifact pins.
