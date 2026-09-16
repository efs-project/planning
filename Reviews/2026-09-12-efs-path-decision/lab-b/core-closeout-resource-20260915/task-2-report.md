# Resource Task 2 — final integrated handoff

Status: DONE_WITH_CONCERNS. Finite final-profile campaign and focused verification complete; parent independent review remains required. No contract/browser behavior changed or correctness defect found. Narrow runtime margin, finite-workload limits and public rate-limit gaps remain explicit.

## Source and evidence

Baseline/source: `86c364910994d343b1d8707a39a8d1c21695d9c6`. Paid runner SHA256 `f64c73583e767425aac09d918e007ba968faff41197104183fa8c86070afa2ce` is preserved in `attempt-4-runner.mjs.gz`. Final script adds only an offline audit branch. Main packet `attempt-4.json.gz` SHA256 `d7b25e8dd961e31f194d572314d8dfbb6959b2c8c3e9f66b01098dac476f051c`:214 raw signed transactions/receipts (211success/3expected reverts),45 compiler artifacts,47 source pins, exact constructors/runtimes/Types, manifest/execution pins, before/after block headers/counters, complete action/body/readsets, SDK reconciliation, bounded traces and exact slot reads. `final-audit.json` supplies offline joins/accounting. These are local RPC observations, not consensus/state-trie proofs.

One forced coherent Solc0.8.30/optimizer200/viaIR/Cancun build includes `src/libraries/=src/vendor/optimism/`; every artifact source closure/settings checked. Earlier native mixed-cache artifacts and old wallet/tag/SDK receipts are not relabelled.
- Ledger runtime hash `0xa04a446d8d8625cd95b3537438fceaa8b1a8de956bb98e329f6af08840a9c380`.
- TagStanceIndex runtime `0xe6484ea50b0203f412843c221e37e5fbe11c2fdf3ee8c07e7c3656d3e68a691b`; manifest `0x0690172991b2e246416a052528e93435df69767171e42ae33bb5a7d5e0537cc1`.
- SDK manifest `0xbfc06a3605a476e4b7b49d0def77312a780a3448444dbd028da21a2e3892207a`; stance profile `0xf24228ebcb9f8e518606805f6899a8bcb971ee2108575292919ae7ab5b7556c3`.
- Ordinary execution `0xa7089d4eea160ef5a9166f774288f6a3dcaeadf3076979f775fa2adaa8a6888f`.

Final TagStanceIndex attaches before admission1, preserving generic/carrier/live/stance validation. Actual SDK index/lens/files/joined aliases point to fresh FilesLiveLens, FilesJoinedConsumer and LiveFilesPageReader; typed Directory/content/live metadata and a retained Directory are explicit. Detached bootstrap readers remain setup-only. Custom4scalar stress uses a separately declared existing ProfiledIndexModule.

## Whole-operation receipts

Each SDK Files row is one outer transaction plus one EFS intent signature (and outer transaction signature), complete publication and canonical EFFECTS_VERIFIED readback. Native rows have no EFS intent signature. Sequential fresh/hot/dedup conditions are retained; rows are not independent matched-genesis savings comparisons. Setup excluded.

| Whole operation | Receipt gas | Qualification |
|---|---:|---|
| Named INLINE create41 / edit41 | 2,169,867 / 1,327,787 | 5/2 leaves;73/105B revision bodies |
| Fresh Concept + File / revision tag | 1,294,225 / 1,327,142 | 2leaves; revision guards HEAD |
| Existing Concept File / revision tag | 899,975 / 919,252 | 1leaf; File is not path-slot scope |
| Fresh rename | 1,535,870 | 3leaves, full2×2 source/destination guard |
| Remove / explicit restore | 869,189 / 1,010,840 | restore uses existing replace:true semantics |
| Legacy tag removal | 716,567 | mask/tombstone, not new-purpose SILENT |
| Descriptor-backed create41 | 2,881,507 | 7leaves, one atomic transaction |
| Actual Name255 create41 | 2,294,861 | 5leaves, normal complete2×1 guard |
| Exact known Note-v1 read | 123,525 | NotePointReader false/false |
| Mounted INLINE / descriptor byte read | 702,756 / 722,779 | path/Lens/HEAD selection plus bytes |
| Files native application adoption | 1,395,895 | app-side reads, then Ledger execute |
| Character+7Items+Equipment / update | 3,218,570 / 1,440,859 | 9leaves / withdraw+new Equipment |
| New-purpose ASSERT / DENY / SILENT | 1,080,507 / 929,998 / 913,101 | existing Concept, signed guarded actions |
| New Concept + selected-revision ASSERT | 1,415,372 | 2leaves; HEAD and stance guarded |

Descriptor creation retains Bytes73B (SHA256+41bytes), Content352B, carrier revision64B and Name14B in the same7-leaf transaction. No backing-byte transaction omitted/preseeded. Cold read fetches bytes and checks digest, not just descriptor membership. This small onchain-carrier recipe does not prove external/chunked upload atomicity.

Known-Record Note verifies Type/body identity, admission/provenance and finite projection; it does not select path/Lens/HEAD, discover candidates or establish current write authority. Historical122,495 is not final pricing. Note rule/registration/reader/Record setup is separately3,535,307gas/8tx.

EquipmentApplication uses executeGuarded with empty readset plus mandatory rules/index; FilesApplication's Guarded-named method performs app-side selected HEAD/tag reads followed by native execute. Later rule rejection rolled back prefix withdrawal/new Item, app counter, nonce, canonical Record and index state.

## Measured attribution and unallocated work

Six bounded traces in successful campaign: tiny convention control plus five rows below;10s HTTP/5s tracer, streaming512KiB,256nodes. No opcode/prestate fallback, maximum-query tracing or raised limits. Tiny trace root equals receipt30,822 and includes intrinsic gas. Earlier failed attempts' repeated logical controls are retained separately.

Index callbacks are nested inside support fallback frames: inclusive columns overlap. **Receipt = support + separate acceptor + residual; never add index subsets again.**

| Operation | Support inclusive | Index-prefix subset | Index-final subset | Separate acceptors | Residual | Known slots |
|---|---:|---:|---:|---:|---:|---:|
| create41 | 838,431 | 557,484 | 79,235 | 5,376 | 1,326,060 | 136 |
| edit41 | 516,840 | 290,827 | 50,048 | 12,165 | 798,782 | 86 |
| fresh File Concept tag | 449,434 | 239,598 | 50,048 | 4,132 | 840,659 | 84 |
| fresh revision Concept tag | 448,678 | 222,665 | 50,048 | 2,656 | 875,808 | 84 |
| existing Concept File tag | 336,716 | 149,571 | 47,801 | 0 | 563,259 | 61 |

Callbacks include reads, extraction, validation and companion work, not exclusively index SSTORE. Residual includes intrinsic, Ledger body/authority/hash work, CREATE/carrier and unselected calls. No storage-gas estimate/pie chart or isolated quote-overhead claim.

Known keys derive from retained compiler layout, actions and posting keys:61–136/cap2048. Exact hash-pinned before/after reads classify new/changed/cleared/unchanged separately for Record/body, authority/history, guard pointer, current heads/nonces/counters and index. Create: Record/body9new; authority/history32new+17unchanged; guard1new; current5new+1changed; index buckets12new+6changed+47unchanged; index-current1changed+5unchanged. Other counts retained in audit. This is exact net change over enumerated keys only; live/scope companion internals, ref/field postings, transient/reverted writes omitted. Packed fields, warmth and refunds prevent slot-count gas precision.

## Joint workloads under unchanged15M

| Workload | Receipt gas | Outcome |
|---|---:|---|
| Record8192B+8refs+4scalar+digest, first/second/later shared keys | 6,845,849 / 6,922,559 / 6,685,664 | admitted; custom profile, not Files |
| Same fields448B, normal1×1guard | 1,302,576 | admitted |
| Final-index small mutation, fresh64×4 / dedup | 5,539,847 / 3,357,303 | admitted; full10,592B readset retained |
| Populated64×4 changed HEAD | 1,389,062 | reverted; counters/nonce unchanged |
| Joint8192B+8refs+4scalar+digest+fresh64×4 | 11,502,072 | admitted deliberate falsifier |
| Native later-rule/app rollback | 943,931 | reverted without prefix effects |
| Relevant-folder-change next page | 206,305 | refused; owned prefix unchanged |
| Actual55CREATE / whole replay | 5,740,634 / 1,127,941 | admitted; not64-leaf claim |
| Nine-leaf Equipment / first8192B replay | 1,201,343 / 570,697 | admitted |

8192B bodies contain8,007nonzero bytes (97.74%). Eight target Records are separately priced setup5,303,988gas; Type registration separate. Shared reference/scalar/digest keys remain fixed across three distinct bodies. Specs:scalar words8/11/12/13; digest10/algorithm9=1. Final64×4 has Alice last after63untouched principals, one populated HEAD and3empty coordinates; custom joint64×4 is fresh/all-empty, not dense64-author history.

All58 replay transactions succeeded (13custom/45final-profile), total22,233,464; each below15M.55CREATE is largest admitted control used, not theoretical maximum;64-action archive retention is not64-leaf admission. No new cutover performed. Source writes, replay, setup and historical SDK upgrade/cutover remain distinct. No natural OOG refusal occurred in selected joint cases; semantic refusals are not OOG evidence.

Historical native recovery remains separate:11.6–13.4M for small proof retention, joint maximum refused under15M. Not charged to ordinary writes; no proof campaign repeated.

## Every scan page and cold journey

Folder queries use real selected HEADs, short/255B Names, Concept C, stable/revision tags,2negative candidates and1matching File. P64 means one occupied Alice last after63untouched IDs. Offline joins check returned File/Name/selected revision/parent and stable-positive/revision-negative tags.

- Folder P1/B1:691,932+451,270+546,732 =1,689,934;3scanned/1row, unrelated writes interleaved.
- Folder P1/B4:934,517;3scanned/1row.
- Folder P64/B1:2,358,535+2,239,743+2,333,385 =6,931,663;3scanned/1row, unrelated writes interleaved.
- Folder P64/B4:4,608,827;3scanned/1row.
- Amended stance inverse P1/B1,B4:460,923/461,732; P64/B1,B4:2,689,018/2,689,981. Each exhausts1 SILENT candidate,1qualified NOT_PRESENT row, no unknowns. Exact closed-Lens Concept lookup, not all-author discovery.
- Relevant folder mutation: first691,932 then refused206,305;898,237 total is not complete. Interleaved rename1,501,379 separate. Prefix stays1/3.

Fresh SDK/journal cold INLINE+descriptor open:142 logical RPC calls/142HTTP,36,219request/382,141response bytes, separate from paid gas/setup. Actual unbatched transport retained. Operation coldWork excludes slot probes and surrounding state probes but includes sender/receipt workflow. INLINE create297calls/297HTTP,88,036/791,638bytes; descriptor create185/185,65,951/438,432. Initial identity-cache probing differs; no matched performance saving claimed. Timing includes harness overhead, not Internet latency.

Transport wiring: runner passes `createTagEnvironment().rpc` unchanged to `createFilesCompactSdk`; that fixture calls `createEnvironment` without `transportOptions`, so the reviewed `createReadTransport` retains its default `batch:false`. SDK `createCompactEngine.rawRead` uses its `.read` path with canonical block-hash pins, default-enabled exact-read cache and bounded16-wide read groups; transport queue/concurrency limits remain active. Thus HTTP batching is disabled, not the reviewed transport bypassed, and these counts are post-cache RPC requests rather than all SDK cache attempts. This inherited fixture configuration integrates final-index semantics and receipt costs but does **not** demonstrate the opt-in `transportOptions:{batch:true}` HTTP savings against the final TagStanceIndex. Earlier matched SDK transport evidence is separate (`core-closeout-sdk-20260915/README.md`); no assertion that the owner-served browser/default adapter enables batching. No additional batching campaign was run.

## Setup, fit and historical reuse

Final Ledger24,538runtime/39,310actual initcode: **38B runtime margin**. TagStanceIndex21,723/45,843; FilesLiveLens16,415/16,861; FilesJoinedConsumer15,356/19,585; LiveFilesPageReader19,012/19,731; mounted5,986/6,889; amended tag reader15,160/19,052; tag Lens18,971/19,674. All deployed normally below24,576/49,152 and15M.

Ledger deployment8,438,528 includes nested support/store CREATE once (support11,880/13,882; store1,824/1,850). Validator+stance-validator+index1,289,407+3,061,747+8,049,898=12,401,052 across3setup tx. Tag Lens4,159,280 and reader4,167,921 are2separate setups.

Totals reconcile214tx/268,576,960gas:51deployments118,184,929;22Type registrations3,710,146;34other setup/interleaving20,979,989;35named operations82,103,600;14query steps21,364,832;58replays22,233,464. Registrations are classified by retained signed destination and decoded registry function, not labels. First operation follows60tx/72,051,322 bootstrap including obsolete detached readers, seeds/tokens/Concepts and actual Directory. Not minimal deployment quote. Every Directory/Type/target/setup receipt has retained labels.

Historical Tags2 query-paid-final2 remains1a49b74 old-reader evidence; query-fix1-diagnostic remains a3ec1f0 amended evidence. Compared sources: only original reader differs from final2; amended compared sources equal. All6 compared artifact templates/creation bytes differ under coherent metadata/build identities, so fresh representative rows above replace no historical receipts. Original wide/deep prices stay in their packet/QUERY-README; no default-profile/UI adoption.

SDK3 old-mapping→carrier historical receipts reused, not rerun. Ordered empty/1×1/8×4/64×4:
- first943,752→928,447;826,908→704,593;2,015,063→1,246,580;10,620,239→5,441,882.
- same-preimage repeat573,789→576,284;584,279→586,808;862,205→865,379;3,251,089→3,259,203.
- changed-head fresh-preimage/carrier miss1×1:826,908→704,593;8×4:2,015,063→1,246,568;64×4:10,620,202→5,441,845 (not stale guard refusal).
- readback94,555→86,177;67,023→52,178;158,174→54,997;782,251→77,941.
- exact-repeat refusal162,937→163,047;173,407→173,539;451,216→452,030;2,839,400→2,845,142.
- calldata bytes/nonzero1156/331,1252/420,2564/1517,11524/8740. Carrier runtime/initcode225/532,321/628,1633/1940,10593/10900; whole receipt includes CREATE/pointer costs once.
Retained packet includes populated proxy upgrade, old readbacks, rollback/downgrade and6offline archives. Current Ledger/support/adapter/environment differ: logical guarantee comparison, not identical signatures/addresses/execution/transactions. Detailed historical source comparisons and upgrade/archive results in final-audit.json.

## Fresh public inputs

2026-09-16T14:07:28Z Base0x31022de/hash `0x87370c81d4a4fd5119883b24fd8e2a8f77f84ba85c4ae688ff9deb47dd8d0dd5`; execution6,012,195wei/gas:
- INLINE:13,045,663,528,065execution +15,862,027,320L1 +0operator =0.000013061525555385ETH.
- Descriptor:17,324,181,977,865execution +20,667,785,547L1 +0operator =0.000017344849763412ETH.
- Existing-Concept L1 returned8,994,392,627wei; operator and subsequent Equipment/8192B oracle calls hit-32016 over rate limit. All-in totals unavailable, not zero.

Full unsigned serialized local inputs and exact-hash getL1Fee/getOperatorFee calls retained. These are cross-venue local-gas/data models, not Base receipts or deployment proof. Base hash controls partly rate-limited; no complete3method success claimed. Era hash reads succeeded/nonexistent-hash reads errored; header state root zero. Era execution/ergs/pubdata/deployment unmeasured; no Anvil×Era-price estimate. No retry campaign or public write. Primary checks: [Base fees](https://docs.base.org/specifications/transactions/network-fees), [OP estimation](https://docs.optimism.io/app-developers/guides/transactions/estimates), [Era gas](https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/evm-gas-interpretation).

## Verification, retained diagnostics and handoff

Cwd lab-b; explicit Node/Forge/Anvil and existing ethers only. Commands:
```sh
/Users/james/.foundry/bin/forge build src/Ledger.sol src/ProfiledIndexModule.sol test/TagStanceProfile.sol test/FilesLiveIndex.sol test/FilesJoinedConsumer.sol test/FilesNamesProfile.sol test/FilesApplication.sol test/LiveFilesReader.sol test/TagStanceReader.sol test/TagStanceQueryAccumulator.sol test/FilesQueryAccumulator.sol test/CoreOrderedAcceptance.t.sol test/NoteProfile.sol --offline --force --out /tmp/efs-recovery-build-wPDyNv/out --cache-path /tmp/efs-recovery-build-wPDyNv/cache --extra-output storageLayout
EFS_ETHERS_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache ANVIL_BIN=/Users/james/.foundry/bin/anvil EFS_RESOURCE_RUN=attempt-4 /opt/homebrew/opt/node/bin/node script/core-final-resource.mjs
/Users/james/.foundry/bin/forge test --offline --out /tmp/efs-recovery-build-wPDyNv/out --cache-path /tmp/efs-recovery-build-wPDyNv/cache --match-contract '^(CoreOrderedAcceptanceTest|TagStanceQueryTest|FilesQueryOriginTest|RecordOccurrenceBoundsTest|PublicationPreparationTest)$' -vv
EFS_ETHERS_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out EFS_RESOURCE_AUDIT=1 /opt/homebrew/opt/node/bin/node script/core-final-resource.mjs
```

Build41files/35.60s exit0. Paid PASS/214tx/closed. One covering run97passed/0failed/0skipped,5suites, exit0. Offline audit214raw joins/49deployment-alias identities/9queries/5attribution rows PASS with fetch disabled. It verifies receipt/source/constructor/template/known-slot/query-row joins, not remote consensus.

No contract/SDK behavior added/fixed, hence no new contract RED/GREEN. Runner failures retained: invalid initial Forge option order (no compile); attempt1 address checksum comparison; attempt2 queue-cap (fixed16-wide reads, no raised limit); attempt3 zero-submission restore refusal corrected with existing replace:true after parent confirmation; attempt4 PASS. Attempt2 finalizer encountered pending reads: original partial packet kept, all61 raw journal tx recovered separately by matching final block hash. Attempt1/3 exact60/69tx packets retained. Offline attribution exposed nested callback overlap and now explicitly reports nonadditive inclusive subsets; no new traces.

Logs compressed in task-2-logs.json.gz retain Keys2519,2018mutability, timestamp/typecast lints and oversized test-harness-only3860 warnings. No normal deployable overflow or suppression. A read-only audit inspection lacking EFS_ETHERS_PATH refused before work and was rerun with the existing dependency. Systematic-debugging guided runner-only fixes; verification-before-completion required fresh paid/covering/offline evidence.

Self-review: aliases/complete recipes, descriptor fetched-byte boundary, readsets/rollback, typed-Record versus selected-path distinction, build/source separation, overlapping attribution, bounded inventories, setup/replay totals and unavailable-not-zero fees checked. Practical only for these finite fixtures; arbitrary dense histories/maxima, public deployment/Era economics, universal recovery affordability and permanent adoption remain unproven. Native recovery joint refusal remains separate. Six-packet/whole-branch review is not declared complete.

All4 disposable children closed; owner Node77526/UI60608 and Anvil77561/RPC60599 untouched/present. No production writes, installs, Fable, subagent, push or broad cleanup. Exact source/evidence commit and explicit lease release follow in task handoff.

## Review fix round1 — Type-registration accounting

Fix base: `a321ba3f30cff39c9c05306ef759ec7f33c855ee`. Important finding verified: the label classifier missed actual registry `register` calls `setup/note/NoteV1Rule`, `NoteV11Rule`, `NoteV2Rule` (131,793gas each). The offline audit now joins each accounted receipt to retained signed input, checks its gas, and identifies registrations by registry destination plus decoded `register`/`registerDescribed`. Derived totals above and `final-audit.json` are corrected; no paid packet, runner snapshot, receipt, source pin, or packet hash changed.

One targeted offline regression asserts all three Note categories, corrected category counts/gas, and the unchanged214tx/268,576,960gas reconciliation. Review-reception/TDD skills led to verifying the finding and adding this assertion before the classifier fix; verification-before-completion required the fresh GREEN result. From lab-b, the same command was used for RED then GREEN:

```sh
EFS_ETHERS_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out EFS_RESOURCE_AUDIT=1 /opt/homebrew/opt/node/bin/node script/core-final-resource.mjs
```

RED exit1: `AssertionError [ERR_ASSERTION]: Note Type registration classification: NoteV1Rule`; actual `other-setup-and-interleaving`, expected `type-registration`. GREEN exit0: `{"status":"PASS","transactions":214,"artifacts":49,"queries":9,"attribution":5}`. Fetch is disabled in this audit. No chain, build, paid/public work or Solidity suite rerun. Review Minor1 trace-unavailable handling, Minor2 future mounted-event assertions, and Minor3 inherited warnings remain deferred to parent final review; current retained measurements are not changed.
