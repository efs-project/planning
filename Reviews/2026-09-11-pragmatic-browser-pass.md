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

- [ ] Reproduce the lost `submitted` flag and partial-journal error in failing transport/server tests.
- [ ] Only `submitted === false` proves prebroadcast refusal. Mark attempts before broadcast; derive signed tx hash before awaiting RPC. Preserve partial metadata/chunk results and prior costs on errors.
- [ ] Recover status after response loss without weakening sponsor authority, same-origin checks or target allowlists. Missing sponsor process state remains UNKNOWN.
- [ ] Test modified ID reuse, repeated status polls, partial chunks, lost responses and absence of private keys/signatures in journal responses; run focused tests with exclusive isolated builds.

## Task 4: Economics widget and safe browser action integration

**Files:** `P/web/app.mjs`, `P/web/index.html`, `P/web/files.css`, `P/web/rpc-source.mjs`, `P/sdk/files-actions.mjs` for its existing `readBackOperation` implementation, new `P/web/economics-panel.mjs`, `P/web/action-journal.mjs`, module serving/export maps after Task 3, focused browser tests.

**Consumes:** Tasks 1–3. Capture environment/Core/execution, principal/account/provider chain, mount/Lens, source/destination and expected effect before authorization. Propagate action ID/context through every stage.

- [ ] Browser test expandable action rows and manually pinned four-chain scenarios against independently fetched receipts, including chunks/failures/payer and incomplete totals. Keyboard/mobile must remain usable.
- [ ] Persist public action/nonce/deadline/request metadata before broadcast; on reload reconcile known hashes and effect/nonce before conflicting authorization. Reselected files must match the original content commitment.
- [ ] Account/chain/navigation changes cannot swap payer/destination/verification Lens. Preserve explicit signature/transaction prompts; no silent fallback.
- [ ] Replace record-existence success with qualified requested placement/head/mask/restore postconditions. Retain admitted-but-not-selected separately.
- [ ] Integrate stream rollover without recursive busy guard; preserve sealed rows and navigation generation. Track RPC work separately from paid gas.
- [ ] Provide Ethereum/OP/Base/Arbitrum scenario controls and fee/FX provenance. Missing DA/operator fees are not zero; no illustrative default is a live quote. Live read-only acquisition is optional and separately tested.
- [ ] Static export serves the same modules and remains independent of EFS-specific server APIs for direct mode.

## Task 5: Ordinary file usability and first joined walkthrough

**Files:** browser files from Task 4; small route/download helpers; `P/sdk/files-actions.mjs` only for safe existing-operation composition; focused browser tests.

- [ ] General file upload and verified byte download, without executing arbitrary HTML/scripts in app origin.
- [ ] Hash routes for nested/history links, reload/back/forward and guest wallet-free boot; refuse invalid/out-of-root routes.
- [ ] Restore historical content as a new authored revision using current CAS; preserve history. Clarify copy versus second placement.
- [ ] Run guest → nested folder → >4 KiB upload → effect/byte verification → download → reload/recovery. Leave a usable local instance with its exact source/build identity.

## Task 6: Scale and remaining foundation gates

- [ ] Joined 1,000-live-entry run crossing at least two acquisition boundaries, oracle agreement, complete enumeration without duplicates; measure useful/complete latency, logical RPC/HTTP, bytes, per-call/total simulated read gas, candidates, concurrency and retry duplication.
- [ ] Controlled 10,000-entry and fixed-live/high-history sweeps. Distinguish repeated rebinds from distinct retired names; no unmeasured page-cost extrapolation or giant repeated traces.
- [ ] Lens 1/8/32/64 sources, conflict/unknown/last-winner; unrelated attesters with fixed selected Lens; synthetic nsfw positive/negative queries over a named universe.
- [ ] Atomic replacement and three tag subjects require a coordinated contract-interface checkpoint; preserve required indexing. Reduced guarantees are explicit marginal-cost/lost-behavior proposals.
- [ ] Check ordinary host-file naming against the fixture's ASCII restriction (case, spaces, Unicode, normalization collisions), name limits, deep folders and moving a directory below itself. Unsupported names are not malformed data; this prototype restriction is not silently the future file-system requirement.
- [ ] Join typed Note extension/safe old editing, mandatory custom validation and independent Solidity consumer; validate recovery's actual evidence tier and opaque private boundaries.
- [ ] Primitive and semantics-matched EAS/MUD comparisons use identical transaction/payload boundaries; internal MUD gas spans are not receipt comparisons.

## Task 7: Review and handoff

- [ ] Independent spec/quality review of each task, with important findings fixed before completion claims.
- [ ] Integrated browser/static/wallet/reader checks on the exact candidate; preserve control evidence.
- [ ] Update this record and short readiness spine with commits, fresh measurements, blockers and actual browser URL.
- [ ] Commit/push scoped verified paths only; preserve Fable's work and all source workspaces.

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
