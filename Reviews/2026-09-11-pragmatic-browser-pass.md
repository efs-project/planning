# Pragmatic Files browser implementation plan

> **For agentic workers:** Use subagent-driven development with task-scoped review. Checkboxes track implementation evidence, not protocol adoption.

**Goal:** Give James one clickable, instrumented Files browser and expose the contract/data-model changes needed before production implementation.

**Architecture:** Extend the existing Files prototype, not a second client/Core. Qualified reads, signed writes, semantic effect verification and economic accounting share immutable action context but retain separate outcomes. Fable owns one admission-cost experiment; Codex owns browser, reader, accounting and later routed operation completion.

**Tech stack:** Existing browser ES modules, ethers, Node tests, Playwright, local Anvil and Solidity fixtures.

**Spec:** James's approved September 11 pragmatic-browser request and “Engage”; [[../Designs/efsv2/data-model-readiness]], [[../Designs/efsv2/testnet-files-mvp-plan]], and the acceptance contract below.

**Source:** Existing `planning-fable-files-browser` worktree, `fable/2026-09-09-files-browser`, initial checkpoint `779c531f6a7615309cde4321bb70871b1e3b43b7`. Documentation stays on main. Runtime paths below are relative to that prototype worktree. `P` means `Reviews/2026-09-09-files-browser-mvp`; `R` means `Reviews/2026-09-09-files-reader`.

## Global constraints

- Preserve prototype workspaces, branches, retained evidence and unrelated edits. No broad staging, rebasing, force-pushing or source migration.
- No permanent protocol choice, public deployment, funded transaction, new product repo, or silently weakened guarantee.
- Fable owns admission/storage implementation; Codex changes require a new coordination checkpoint there.
- Child agents edit assigned files only; no staging/commits or child reviewers. Coordinator serializes Git and reviews exact-path diffs. Independent non-overlapping tasks may run concurrently; shared builds may not.
- Semantic success requires operation-specific independent read-back at a fresh qualified basis. Record existence or a receipt alone is insufficient.
- Never turn UNKNOWN/PARTIAL/unsupported into absence, a complete empty listing, or authorization. Preserve source, block hash, execution identity, high-water and Lens/domain boundaries.
- Actual costs come from identified receipts; foreign-chain projections are explicitly modeled/estimated. Missing receipt/fee/FX components stay unknown. Sponsored and reverted mined transactions count.
- Persistent public recovery metadata contains no private keys, author signatures or file contents. Resetting the cost display never clears unresolved authorization guards.
- Test real reader/router/contract behavior where relevant; pure arithmetic tests use hand-derived expectations. Retain red/green evidence before wider suites.

## Acceptance contract

First usable checkpoint: shareable guest nested folder → enumeration beyond an acquisition budget → multichunk upload → independently verified placement/head and byte download → reload/recovery, with expandable total-action gas/USD and separate read-work diagnostics.

Preserve existing create/edit/rename/move/copy/link/remove/restore/Lens flows. Subsequent gates complete atomic replacement, revision restore, tag subjects/filters, typed Note/custom validation, independent Solidity consumption and recovery. First-checkpoint success does not certify these later gates.

Expert review sharpened the plan: accounting needs a recoverable action journal; current browser success checks record existence rather than effect; sponsor partial errors lose submission evidence; mutable wallet/Lens state can contaminate an action. These precede UI polish.

## Task 1: Same-basis continuation and isolated build paths

**Files:** `R/files-reader.mjs`, `R/reader-scope.mjs`, `R/index.mjs` if needed; new `R/test/continuation.test.mjs`; artifact loaders in `Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs`, `P/test/router-fixture.mjs`, `P/test/authority-fixture.mjs` as needed. No Solidity edits.

**Interface:** `openDirectory(scope, options)` retains its methods and gains async `resume(nextScope)` returning `{status: 'RESUMED' | 'REFUSED', reason?}` for in-process acquisition rollover. Preserve sealed rows/frontier and fixed mount/subject; independently qualify and compare the entire basis/source context. Refuse mismatched, closed or in-flight handoffs without changing old state or closing shared scopes. No serialized public cursor format.

- [x] Write a failing real-reader regression using a small request budget and a fixed real fixture; traverse multiple acquisitions, retain each expected row exactly once and reach COMPLETE.
- [x] Implement scope handoff; retain the original data error when sealing also fails. Test changed source/epoch, block/hash, execution/high-water and close/in-flight refusal.
- [x] Parameterize compiler outputs AND all artifact loaders under `EFS_TEST_BUILD_ROOT` with separate foundation/router paths. Unset preserves legacy behavior; coordinate exclusive chain tests. Do not set `FOUNDRY_OUT` while loading old hard-coded artifacts.
- [x] Run `node --test R/test/continuation.test.mjs` and existing relevant reader/completeness tests; record exact commands and outcomes.

```js
const stream = openDirectory(first.scope, { mountId, pageSize: 8 });
const partial = await stream.loadMore();
assert.equal((await stream.resume(next.scope)).status, 'RESUMED');
const continued = await stream.loadMore();
assert.deepEqual(continued.basis, partial.basis);
```

## Task 2: Pure action journal and four-chain cost model

**Files:** new `P/web/cost-ledger.mjs`, `P/test/cost-ledger.test.mjs`. No app/server/wallet/HTML/CSS edits.

**Interface:** `createLedger`, `reduceLedger`, `selectActionCosts`, `selectSessionCosts`, `exportLedger`, `restoreLedger`. JSON-safe decimal quantities and BigInt arithmetic; no DOM/fetch/storage. Document the event contract in the module for its browser consumer.

- [x] Write failing tests for successful/reverted receipts, duplicate hash ingestion, unknown attempts, multitransaction totals, payer split, separate environments sharing chainId 31337, and reset retaining unresolved state.
- [x] Stable action IDs and attempts; deduplicate fees by environment plus hash, not label/tree/index/nonce. Keep effect state separate from receipt state.
- [x] Ethereum: execution fee. OP/Base: execution plus explicit L1/operator components. Arbitrum: receipt-total gas with included-L1 marker OR execution plus posting, never both. Distinguish explicit zero, not-applicable and unknown.
- [x] Immutable fee/FX snapshot IDs/timestamps; missing FX leaves ETH known and USD unavailable. Four scenarios are alternatives, not additive spending. Export/restore validate fields/version and omit secrets/content.
- [x] Selectors report known subtotals and missing/unresolved counts. Run `node --test P/test/cost-ledger.test.mjs`.

```js
// Independently calculated numeric fixture, not computed by the SUT:
// 21000 gas * 2 gwei = 42000000000000 wei; at ETH/USD 2000 => USD 0.084.
assert.equal(cost.totalWei, '42000000000000');
```

## Task 3: Recoverable sponsor transport

**Files:** `P/web/wallet.mjs`, `P/scripts/server.mjs`, new `P/test/sponsor-journal.test.mjs`, existing focused wallet tests. No app edits.

**Interface:** stable request ID bound to the request commitment; success/errors include explicit `submitted` and per-attempt `transactions` (phase/index/hash/status/available receipt). A request-status operation retrieves the journal. Modified ID reuse refuses; retry cannot blindly rebroadcast.

- [x] Reproduce the lost `submitted` flag and partial-journal error in failing transport/server tests.
- [x] Only `submitted === false` proves prebroadcast refusal. Mark attempts before broadcast; derive signed tx hash before awaiting RPC. Preserve partial metadata/chunk results and prior costs on errors.
- [x] Recover status after response loss without weakening sponsor authority, same-origin checks or target allowlists. Missing sponsor process state remains UNKNOWN.
- [x] Test modified ID reuse, repeated status polls, partial chunks, lost responses and absence of private keys/signatures in journal responses; focused transport and joined wallet/economics tests passed with isolated artifacts.

## Task 4: Economics widget and safe browser action integration

**Files:** `P/web/app.mjs`, `P/web/index.html`, `P/web/files.css`, `P/web/rpc-source.mjs`, `P/sdk/files-actions.mjs` for its existing `readBackOperation` implementation, new `P/web/economics-panel.mjs`, `P/web/action-journal.mjs`, module serving/export maps after Task 3, focused browser tests.

**Consumes:** Tasks 1–3. Capture environment/Core/execution, principal/account/provider chain, mount/Lens, source/destination and expected effect before authorization. Propagate action ID/context through every stage.

- [x] Browser test expandable action rows and manually pinned four-chain scenarios against independently fetched receipts, including chunks/failures/payer and incomplete totals. Keyboard/mobile checks pass; this is not actual wallet-extension UI.
- [x] Persist public action/nonce/deadline/request metadata before broadcast; on reload reconcile known hashes and effect/nonce before conflicting authorization. Matching-byte recovery is demonstrated after metadata admission; pre-metadata DIRECT recovery remains an explicit hold.
- [x] Account/chain/navigation changes cannot swap payer/destination/verification Lens. Preserve explicit signature/transaction prompts; no silent fallback.
- [x] Replace record-existence success with qualified requested placement/head/mask/restore postconditions. Retain admitted-but-not-selected separately.
- [x] Integrate stream rollover without recursive busy guard; preserve sealed rows and navigation generation. Track RPC work separately from paid gas.
- [x] Provide Ethereum/OP/Base/Arbitrum scenario controls and fee/FX provenance. Missing DA/operator fees are not zero; no illustrative default is a live quote. Live fee acquisition is not implemented.
- [x] Static export serves the same modules and remains independent of EFS-specific server APIs for direct mode.

## Task 5: Ordinary file usability and first joined walkthrough

**Files:** browser files from Task 4; small route/download helpers; `P/sdk/files-actions.mjs` only for safe existing-operation composition; focused browser tests.

- [x] General file upload and verified byte download in Chromium, without executing arbitrary HTML/scripts in app origin. Manual Codex in-app download completion is still unconfirmed.
- [x] Hash routes for nested/history links, reload/back/forward and guest wallet-free boot; refuse invalid/out-of-root routes.
- [x] Restore historical content as a new authored revision using current CAS; preserve history. Clarify copy versus second placement. Unsupported executable metadata refuses; dedicated null-charset/metadata edge tests remain.
- [x] Run guest → nested folder → >4 KiB upload → effect/byte verification → download → reload/recovery. Leave a usable local instance with its exact source/build identity.

## Task 6: Scale and remaining foundation gates

- [x] Real 1,000-live-entry reader run crossing two acquisition boundaries; exact oracle agreement, complete enumeration without duplicates, useful/complete latency, logical RPC/HTTP and response bytes. Retained report at prototype checkpoint `8dcbb2b`; this is Node/Anvil reader evidence, not DOM/WAN performance or a complete simulated-read-gas inventory.
- [ ] Extend that run with browser/WAN-shaped transport, per-call/total simulated read gas and sustained memory behavior; compare bounded read aggregation without weakening qualifications.
- [ ] Controlled 10,000-entry and fixed-live/high-history sweeps. Distinguish repeated rebinds from distinct retired names; no unmeasured page-cost extrapolation or giant repeated traces.
- [ ] Lens 1/8/32/64 sources, conflict/unknown/last-winner; unrelated attesters with fixed selected Lens; synthetic nsfw positive/negative queries over a named universe.
- [ ] Atomic replacement and three tag subjects require a coordinated contract-interface checkpoint; preserve required indexing. Reduced guarantees are explicit marginal-cost/lost-behavior proposals.
- [ ] Check ordinary host-file naming against the fixture's ASCII restriction (case, spaces, Unicode, normalization collisions), name limits, deep folders and moving a directory below itself. Unsupported names are not malformed data; this prototype restriction is not silently the future file-system requirement.
- [ ] Join typed Note extension/safe old editing, mandatory custom validation and independent Solidity consumer; validate recovery's actual evidence tier and opaque private boundaries.
- [ ] Primitive and semantics-matched EAS/MUD comparisons use identical transaction/payload boundaries; internal MUD gas spans are not receipt comparisons.

## Task 7: Review and handoff

- [x] Independent spec/quality review of completed tasks, with important findings fixed. Task 6's unimplemented foundation gates are not certified.
- [x] Integrated browser/static/wallet/reader checks on the named control and fresh optimized candidate; preserve their distinct evidence.
- [x] Update this record and short readiness spine with commits, fresh measurements, blockers and actual browser URL.
- [x] Commit/push scoped verified paths only; preserve Fable's work and all source workspaces.

## Sequencing decisions

- First usable checkpoint precedes breadth; this does not remove later requested gates.
- Accounting and authorization recovery share action identity but keep effect and fee outcomes separate; a simple receipt counter would miss discovered ambiguity bugs.
- Four-chain comparisons may start as explicit manual/model scenarios. Missing quotes do not block file operations or turn into fabricated current prices.
- No storage layout, weakened index guarantee or atomic-replacement semantics are adopted by this execution plan.

## Progress

- 2026-09-11: approved scope extended by two current-source expert reviews. Fable admission lane and Codex first checkpoint are separate owned scopes in the same existing prototype.
- Reader checkpoint `2b505c0`: independent spec/quality review passed. Six real continuation tests passed; the existing suite passed 10/13 before three baseline-stale limit assertions were corrected and reran 3/3. No production limits changed. Additive private scope-brand helper passed its pure regression; genuine-brand integration assertion is assigned to the SDK suite. Retaining cumulative sealed predecessors still needs sustained-scale memory measurement.
- Economics checkpoint `5dd4011`: 18/18 pure tests and independent spec/quality review passed. This validates receipt accounting and explicit four-chain manual scenarios, **not** live fee acquisition or the browser widget.
- Sponsor checkpoint `8f64217`: 15/15 focused HTTP/RPC tests passed. Independent review found arbitrary RPC error messages could leak decoded content into the public journal; the fix is in progress. Real-chain sponsor/wallet regression remains pending.
- Task 4 is split into two non-overlapping implementers: SDK authored/selected effect read-back, and browser integration/recovery/economics. The discovered record-existence-only success path is not an acceptable handoff state.
- SDK PM and Data Explorer PM received bounded read-only feedback requests. No second prototype or production repository was created. No claim of completed browser, large-directory readiness, lower production costs or adopted protocol changes is made at this checkpoint.

### Subsequent reviewed checkpoints

- Sponsor journal now has independent review through `a3c5994`, with 23 focused tests passing. Public errors no longer expose arbitrary provider prose, and server responses must match the locally retained request ID and commitment before their transaction evidence is accepted. Real-chain/browser integration is still a separate gate.
- SDK authored-effect verification `94374ce` verifies exact occurrences, Binding revisions/targets and selected Files effects, not merely record presence. The browser then exposed an actual recovery bug: equivalent JSON object fields in a different order were refused. Fix `397fd3f` passed 14 real tests, including changed-value/type/missing/extra-field refusals, and independent review. Source order is not semantic; array order remains significant.
- Safe route/download helpers `34a2978` plus `f84ea41` passed 13 tests and independent review after sparse-array and Unicode bidi-filename findings were fixed. These helpers alone do not establish routed browser or historical-restore readiness.
- Browser integration has exercised multi-chunk receipt reconciliation, changed-context defenses, post-metadata interrupted-upload recovery and repeated listing acquisitions. Final candidate review and joined regression remain pending. Pre-metadata direct-wallet upload recovery and an actual wallet-extension walkthrough are not yet proven.
- Browser checkpoint `dd051a4` passed independent review after two P1 findings were reproduced and fixed: a sponsor refusal/wallet decline/reverted transaction does not revoke an already signed EFS authorization, and a resumed page may complete after navigation. Potentially signed intents now remain guarded against fresh nonce/chain-time observations, including reorg regression; stale resumed pages cannot repaint another directory. Seven actual wallet/economics browser tests passed. The ordinary upload/download/routes/history walkthrough and final combined static regression are still in progress.
- Verification uses a detached, fixed deployable contract checkpoint with exact Codex JavaScript/test changes. Fable's active admission/storage changes are not silently included: they need a fresh joined run when he hands off. A strict compiler-evidence selector now refuses mixed incremental artifact bundles; full-build verification is explicit.

### Disk-safety incident

James reported disk pressure during this pass. Eighteen completed Anvil historical-state cache directories occupied about 285 GiB. At the cleanup checkpoint there were no running Anvil processes or open handles into those directories; their latest modification was over 15 hours old. The exact disposable directories were permanently removed under James's explicit authorization, leaving about 288 GiB free. No source, reports, design files or workspaces were removed.

Managed Files test-node cleanup is now implemented at `e4b82b7`: a unique owned cache is deleted only after confirmed process exit. Independent review and 32 lifecycle/compiler tests passed. A real Anvil smoke retained the genesis balance across a transfer and 512 further blocks, wrote 26 cache files inside the owned directory, and removed it after exit. Abrupt termination or unconfirmed child exit can still leave a reported cache; this does not retrofit every unrelated Anvil runner on the machine. No historical pruning was added.

Scale runs now require at least 50 GiB initially free, sample actual free space/cache allocation, and abort below 40 GiB free or at 60 GiB cache use. These are sampled operational guards for this laptop, not schema/directory limits or hard filesystem quotas. Failed runs retain partial reports.

### Fable admission candidate intake

Fable handed off `2182cb0`, with the detailed prototype report at `P/type-cache-2026-09-11.md`. His matched full-receipt evidence reports steady tag 2,804,520 → 2,503,133 gas, directory creation 5,136,899 → 4,622,839, and file creation 8,624,205 → 7,688,694. The candidate keeps compiled Type-cache bytes in inert code and avoids repeated cold storage loads. This is roughly a 10% repeated-admission improvement, **not** lower per-admission state growth or a fix for browsing RPC amplification.

Independent source review supports fresh-genesis browser experimentation, not adoption of the layout or new cache limit. Important boundaries:

- A single code-backed cache is capped at 24,575 bytes. An actual compile→admit test now demonstrates a valid 64-boolean-field schema with distinct 64-byte names whose cache is 24,960 bytes: compilation agrees byte-for-byte with an independent encoder, but admission reverts with `HelperDeploy`. A neighboring 65-field schema correctly fails earlier as invalid. Preserve larger-schema support through a compact derived representation or measured fallback rather than quietly shrinking the Type language.
- The stored Type row changes from a bytes head to a code pointer. New-layout upgrade tests do not establish migration of populated old-layout worlds. Use fresh disposable genesis now; require explicit layout refusal or a separately tested migration before adopting it.
- The admission library has only 11 bytes of runtime headroom in Fable's measurement. Module decomposition is a prerequisite for further kernel work; repeated safety-check trimming is not the plan.
- The helper must create cache contracts from its own account, not the Core proxy's account, whose deployment nonce is already used by proxy tooling. Exact helper behavior/pinning and returned code integrity require explicit tests at the declaration seam.

Codex owns these follow-ups; no further major Fable run is requested. No index guarantee or ordinal mirror is removed based on the cost report alone.

The retained `P/type-cache-boundary-2026-09-11.md` and test at `8dcbb2b` distinguish the desired **RED** support target from passing diagnostics. In a fresh candidate base-Core world, a small Type declaration costs 1,679,410 gas and a two-small-Type group 1,878,190. The oversized single and small-then-oversized group revert at 11,796,852 and 12,248,985 gas. Candidate Type rows, records, counts, authorization nonce and helper CREATE nonce all roll back; no orphan cache survives. These are operator `executeFixture` receipts, not FilesRouter costs. Simply splitting the large ABI cache may still exceed the transaction budget; compact encoding must be measured, not assumed free. The actual support test intentionally stays red until that implementation exists.

At `ca8635e`, a separate standalone Solidity codec now demonstrates lossless compression: the boundary cache becomes 5,536 bytes, with exact logical ABI/descriptors/IDs preserved across 19 helper/parser-valid Types and two explicitly synthetic width/envelope cases. Nineteen malformed inputs reject. Runtime is 7,700 bytes. Boundary pack/unpack/header transaction receipts are 756,051 / 366,714 / 129,113 gas, including intrinsic/calldata; these are **not** internal costs or full admission costs. Independent review approved the codec-only checkpoint. No compact cache was deployed into Core, so the integrated support test remains RED. Evidence: prototype `Reviews/2026-09-11-type-cache-codec-lab/README.md` and `evidence/candidate-run2.json`.

### Thousand-entry continuation result

Reviewed checkpoint `8dcbb2b` retains `P/evidence/continuation-2026-09-11/{README.md,48.json,1000.json}` and the reproduction script. The controlled 1,000-entry run reached COMPLETE with exact name/object/selected-entry/kind agreement, 32 sealed pages and three same-basis acquisitions (4,096 / 4,096 / 3,368 logical calls). It observed 11,560 logical RPC calls, 838 HTTP requests and 8,372,489 response bytes. First useful prefix was 115.6 ms and complete reader time 2.78 s on local Node/Anvil; these are single local observations, not browser/WAN percentiles.

Fixture creation used 1,001 separate signed transactions, totaling 5,169,088,831 gas; the maximum transaction was 5,279,773. That uses the fixed pre-optimization Solidity verification baseline, **not** Fable's new candidate. Peak owned Anvil cache was 6.53 GiB and was removed after confirmed exit. No giant traces or history-pruning flags were used. This proves correct continuation at 1,000 live names, not economical bulk seeding, low remote RPC load, 10,000-entry/high-churn behavior, broad Lenses or authenticated recovery. The next reader experiment should reduce round trips at the same qualified basis rather than remove completeness checks.

The source/call-graph audit attributes an ordinary new child to about 11 distinct getters. Only 470 of the 11,560 observed attempts repeat; caching alone cannot address the dominant work. The recommended next experiment is an optional, exact-code-pinned, bounded STATICCALL aggregator behind the current qualified reader, retaining the same getters and final seal. Then compare a read-only Core facade that checks the execution basis once and batches records/resolutions. Neither removes lifetime-name scanning, and neither permits incomplete/failed items to become empty results. Measure inner work, outer RPC, HTTP, bytes, simulated gas and dependency-round latency separately. This is a design recommendation, not an installed ABI or measured speedup.

### Clickable checkpoint and immediate next work

`0e25194` joins ordinary routes/uploads/downloads/history with independent review. The final control suite passed 17/17 actual Chromium/chain checks and 68/68 pure tests. On the fresh Fable candidate, SDK semantic read-back passed 14/14; the four new file journeys, economics/continuation, everyday populated upgrade and standalone static path passed. A stale legacy expiry-text assertion was replaced by stronger independent expiry/nonce/payer checks, then both wallet cases and all four signed-guard/economics-wallet cases passed. Full details and source hashes: prototype `P/browser-integration-2026-09-11.md`. Strict direct-RPC identity validation is at `b898f62` with 22/22 tests and independent review.

The current local demo is [http://127.0.0.1:60731](http://127.0.0.1:60731), started from a fresh coherent build of candidate Solidity and the final app hash `47175da9602dada97db5ce901f19a8cf99356feffac52b8c351f50e9efb8816d`. It is disposable, localhost-only, and lasts only while its process runs. The manual walkthrough created `photos/try-me.txt`, verified its bytes/effect, and displayed two actual receipts totaling 7,921,285 gas. Four-chain USD scenarios require manual assumptions; no current market quote is implied. The in-app browser's download-event observation timed out, although the exact Chromium download journeys pass; completed downloads in that host are not claimed. All test worlds have been disposed; the interactive demo intentionally remains running.

Next bounded sequence, with no new owner choice required yet:

1. Extract cache operations from the near-full admission library, then integrate the compact-large/raw-small comparison. Turn the retained large-Type admission RED green under the unchanged transaction cap; verify exact read/replay parity, valid/invalid records and late group failure rollback. Preserve the small-Type gas control and explicit old-layout migration hold.
2. Run the bounded read-aggregation comparison on the same exact 48/1,000 controls with injected transport delay. Then extend churn, Lens width and finite-universe tag/filter coverage. Do not add an authoritative indexer or remove required indexes to make a benchmark pass.
3. Improve safe public error-name diagnostics and pre-metadata DIRECT recovery; keep actual wallet, private opacity, authenticated state recovery and joined custom-Type acceptance visible as separate gates. The clickable first checkpoint does not certify all of Task 6.
