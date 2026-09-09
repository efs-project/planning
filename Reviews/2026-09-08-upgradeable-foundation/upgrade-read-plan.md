# Populated upgrade read façade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make bounded Point/Binding/audit/Lens reads execute truthfully on the existing populated upgradeable fixture, with independent equivalence and measured normal resources.

**Architecture:** Derived Core and two fixed read libraries over the existing Store. Preserve the21-word execution-set/1 format; its Core codehash transitively commits the source-verified read links and expected immutable hashes. Supply current execution basis to cursor context and result projection, never relabel original acceptance.

**Tech Stack:** Existing Solidity0.8.30/Cancun/optimizer200/viaIR, Foundry/Anvil and Node/ethers; no dependency installation.

**Spec:** [upgrade-read-design.md](upgrade-read-design.md); [consumer checkpoint](consumer-checkpoint.md); [current read handoff](../2026-09-09-v1-parity-overnight/directory-read-next.md).

## Global Constraints

- Existing isolated experiment worktree/branch only. No main merge, new product repository, public deployment, funds, durable publication or protocol freeze.
- Same namespaced StateStore, sole admission writer, original21-word execution-set/1 tuple/domain, controller, proxy/admin/activation semantics and old fixture behavior.
- Two fixed read libraries per new Core: PointReadLibrary and UpgradeQueryReadLibrary; no third Query deployment, mutable dispatch, registry, callback, hand-encoded storage pointer or new namespace.
- Runtime24,576 bytes, full initcode49,152 bytes and actual transaction16,777,216 gas are unchanged hard limits. Collection/history limits and previous saved controls remain unchanged.
- New read basis is checked active executionSetId (observedWith), never original acceptance. RPC block hash plus execution/H remains required. Old cursor rejects across activation even at unchanged H.
- Existing revision-one read APIs, request/error precedence and results remain controls. Do not expose its getReceipt on the new façade. Raw diagnostic batches and independent historical reader remain available, not mislabeled canonical receipt support.
- Synthetic operator author fixture only; no portable Principal authentication, session or full Files/SDK/SPA readiness claim.
- Parent owns design/status/evidence docs and the task/final reviews. Worker owns the eight enumerated source/test paths and sole Core+upgrade build window until report. No worker push or subagents.

## Task 1: Read-profile integration and actual populated-upgrade equivalence

**Files (paths relative to planning root):**

- Modify `Reviews/2026-09-05-c0-core/src/StateAuditPages.sol`: explicit observation-basis internal page entry points, shared algorithm; preserve old entry points.
- Modify `Reviews/2026-09-05-c0-core/reference/lens-resolver.mjs`: extract existing declarative combination to a named pure model export while original resolveLens continues to reverify its snapshot. Do not change parser/combiner semantics.
- Create `Reviews/2026-09-08-upgradeable-foundation/src/UpgradeQueryReadLibrary.sol`: link-free fixed query forwards with checked supplied basis projection and shared explicit-basis pages.
- Create `Reviews/2026-09-08-upgradeable-foundation/src/UpgradeableReadFixtureCore.sol`: derived U1/U2 read hosts, constructor-pinned dependencies, temporary read-context port and guarded existing-shaped read forwards.
- Modify `Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs`: closed base/reads profile, exact compiler/link/immutable/runtime inventories, separate full read ABI, explicit repeated-activation test support. Preserve default base behavior; do not copy the runner.
- Create `Reviews/2026-09-08-upgradeable-foundation/reference/upgrade-lens-resolver.mjs`: independently reverify complete upgrade evidence, then use the pure model with active execution basis.
- Create `Reviews/2026-09-08-upgradeable-foundation/test/UpgradeReads.t.sol`: bounded no-write/guard/cursor-context tests and a small deployed STATICCALL consumer if needed.
- Create `Reviews/2026-09-08-upgradeable-foundation/test/upgrade-reads.test.mjs`: managed actual admissions, U1/U2/repeated activation, adversarial observations, exact resources and cleanup.

All other runtime/reference/control paths are protected. In particular do not modify StateKernel, StateStore, StatePointReads, StateBindingReads, StateLensReads, StateReadPrimitives, QueryReadLibrary, UpgradeStorage, controller/factory source, original state/upgrade verifier, carrier, old test fixtures or benchmark JSON. If a truly necessary narrow supporting change is found, ask parent before expanding.

**Interfaces:**

- Existing source readers are authoritative for the exact Point/Binding/Lens/page tuple shapes. New host exposes7 Point methods (schema, origin, intrinsic bytes, Record, Envelope, Occurrence and ordinal Occurrence),3 Binding methods,3 audit methods and4 Lens methods with the same caller-visible shapes as existing hosts; **no getReceipt**. Raw inherited ports remain diagnostic.
- `fixtureReadContext() external view returns (bytes32 executionSetId,uint32 revision,uint64 blockNumber,uint64 admissionHigh)` is a new temporary fixture port only.
- `UpgradeableReadFixtureCore` constructor `(address factory,address helper,bytes32 pointReadHash,bytes32 queryReadHash)` delegates the existing base constructor. U2 derives from it and exposes the same small migration/presentation behavior as the existing U2 control. Do not copy base Core/Endpoint logic.
- `withUpgrade(action, { profile = "base" } = {})` accepts exactly base/reads. `lab.iface` remains the old unambiguous raw interface in either profile; `lab.readIface` is the full new read interface only for reads. `lab.expected.components` includes independently expected read code; do not add getters the unchanged collector never collects. Explicit test reads check all4 new dependency getters.
- `lab.upgrade({before, migrate = true} = {})` preserves existing behavior; `migrate:false` sends empty migration calls, permitting a second activation at unchanged admission H without rerunning a one-time migration. Reject nonboolean migrate. Existing controller behavior is reused, not modified.
- Export `modelLens(parsedPlan, bindings, position, basis, { unavailableKeys = new Set() } = {})` from the old resolver: a plain B0 expected value, never an evidence VERIFIED claim. Retain malformed-plan and unknown-profile outcomes; the existing resolveLens still verifies/fetches/parses before using this model, preserving its current results.
- New `resolveUpgradeLens(state, expected, planId, position, options)` returns `{ outcome: "VERIFIED", value, basis: checked.basis, execution: checked.execution }` after unchanged verifyUpgradeState passes; `value` is the expected B0 tuple, including ordinary unknown/malformed Plan outcomes. Otherwise return the verifier's explicit UNKNOWN/INVALID result unchanged. A missing snapshot returns UNKNOWN with an explanatory reason. It calls verifyUpgradeState even when the input says VERIFIED or supplies a forged fold. The model receives only the freshly checked fold.

- [ ] **Step 1: Establish red with the actual profile.** Read the complete design and relevant current reader/upgrade sources. Start a focused test that requests the reads profile and calls fixtureReadContext, which the existing runner/host cannot support. Capture the failure before implementation. Add a focused old/new audit-basis token test with the existing state setup so merely changing returned basis after cursor creation cannot pass.

```js
await withUpgrade(async lab => {
  assert(lab.readIface, "new read profile ABI");
  const raw = await lab.rpc("eth_call", [{to:lab.core,
    data:lab.readIface.encodeFunctionData("fixtureReadContext",[])}, "latest"]);
  assert.equal(lab.readIface.decodeFunctionResult("fixtureReadContext",raw)[1], 1n);
}, {profile:"reads"});
```

- [ ] **Step 2: Add explicit audit context without changing old behavior.** Keep one page algorithm. Old entry points supply initialRevisionId; new named/internal overloads supply readBasis. Run original audit tests as the control. Nonzero basis checking follows initialized-state checking; unsupported tuples and cursor/basis precedence remain the old law.

```solidity
// Shape of the shared page change, retaining all existing checks:
(bytes32 initialBasis,,uint64 currentH) = StateReadPrimitives.basis(s,0,key);
// Old entry selects initialBasis; explicit entry must supply nonzero readBasis.
result.realmBasis = explicitBasis;
if (explicitBasis == bytes32(0)) revert StorageByteView.ErrReadState(key);
// Existing cursor context must use result.realmBasis before decode AND encode.
```

- [ ] **Step 3: Build the fixed upgrade query library and host.** Query forwards reuse unchanged checked state/Lens functions. Project their current observation basis only after exact result computation. Raw/hydrated pages use Step2 before token work. Preserve existing return and error ABI; declare delegated errors on the host where needed. Guard dependencies before request/state errors. No getReceipt selector or fabricated support manifest.

```solidity
function _readBasis() internal view returns (UpgradeStorage.ExecutionSet memory e) {
    // Check nonempty Point/Query and retained exact hashes first.
    e = _execution(currentRevision());
}
// Query wrapper: current execution identity is supplied only by that checked host.
LensPlan.ResolveResult memory r = StateLensReads.resolve(s,planId,position);
r.basis.realmRevisionId = readBasis;
```

For the current guard, check Point and Query together, even for a query-only call. Pure deriveBindingKey has no guard. For read context, prove block.number <=uint64 max before narrowing; admissionHigh comes from the same Store. State mutation, new basis storage, and altered accepted batches are forbidden.

- [ ] **Step 4: Extend normal deployment provenance through a closed profile.** Read actual compiler source-target names; derive exact closed link maps for Admission/Point/UpgradeQuery, with no unknown, omitted, duplicate, overlapping or unresolved patch windows. Require exact same-build AST attribution and full deployed runtime equality. Verify new libraries are link-free, constructor hashes independently expected, and implementation runtime embeds their links/hash immutables. Base deployment order and API remain unchanged. Use the raw ABI for collection to avoid counts overload ambiguity; the full ABI serves new queries.

```js
assert.deepEqual(Object.keys(profileMap).sort(), ["base","reads"]);
assert.equal(actualCoreRuntime, sourcePatchedRuntime);
assert.equal(execution.coreCodehash, keccak256(sourcePatchedRuntime));
assert.equal(await readGetter("pointReadLibrary"), expectedPoint.address);
assert.equal(await readGetter("queryReadCodehash"), keccak256(expectedQuery.code));
```

- [ ] **Step 5: Share only the pure oracle model.** Extract the existing declarative tier/group model, preserving original resolveLens tests. The upgrade wrapper reverifies supplied snapshot/expected components/history, finds exact admitted Plan bytes, parses them and uses the verified current executionId and block/H. Wrong/missing history, forged VERIFIED/fold, wrong read code or mixed pin never yields a verified target. Do not normalize revision fields or mutate old snapshots to pass the old verifier.

```js
const checked = verifyUpgradeState(state.snapshot, expected);
if (checked.outcome !== "VERIFIED") return checked;
const observed = checked.execution.history.at(-1);
// Model input basis is {realmRevisionId:observed.id, blockNumber, admissionHigh, basisKind:0}.
// Use checked.fold, never state.fold. The returned model is expected ABI, not consensus proof.
```

- [ ] **Step 6: Run actual populated upgrade journeys.** Admit unchanged candidate groups, root/file facts, ordinary Plans and Binding sources. Compare exact full Point/Binding/Lens/page tuples with independent retained-state expectations at canonical pinned blocks. Use A-first/B-first/EXACT/THRESHOLD controls, exact kind/A/leaf and full-width authors. Save an initial partial raw and hydrated cursor over at least2 real anchors. After upgrade at unchanged H, the old cursor refuses on latest, new query reports new executionId, and old canonical block continuation reproduces U1. Repeat activation without new data and assert U3 differs at the same H. Admit U2 facts and verify original U1 batches remain original via unchanged verifyUpgradeState.

Measure normal runtimes/full initcodes/deployment gas and actual1/8/32/64-source agreement calls before/after upgrade, plus small raw/hydrated pages. Keep setup, marginal STATICCALL work, transaction gas, bytes and diagnostic collection counts separate. Avoid rerunning all24 old scenarios as substitute for the new upgrade evidence; old suite remains regression.

- [ ] **Step 7: Attack the new observation boundary.** Missing/substituted Point/Query code, wrong expected constructor hashes, incoherent peer/admin/controller configuration and partial upgrade must refuse new reads. Replacing Preparation code also invalidates this profile's existing execution check: unlike revision-one isolated reads, this is an explicit whole-fixture observation gate. Valid pure derivation remains available. Malformed requests cannot bypass dependency/context checks. Unknown/malformed Plan behavior and unsupported query metadata remain distinct. Check canonical historical receipts through the independent reader and assert absent getReceipt ABI; do not call that absent façade implemented.

Compare all retained Store observations before/after ordinary read txs and a real STATICCALL consumer; seeded corruption is separately labeled, never normal performance evidence. Persist/reuse old block pins only within the same managed chain; cleanup must stop every chain.

- [ ] **Step 8: Full regression, self-review, exact commit and handoff.** Worker owns Core+upgrade artifact build window. Force AST/build-info builds when necessary without weakening provenance. Run both Forge suites and all Core/upgrade/Files/admission/type-input Node tests serially with all saved-evidence exports0. Preserve old JSON. Read the exact staged diff, run whitespace checks and commit exact eight paths via git commit -F with v2-pm/Codex/Astra trailers; never push. Report red/green evidence, commands/results, warnings, codehash/context-chain proof, source SHA, actual measurements and machine-readable scratch evidence. Parent performs independent task review, fresh integration and separate whole-increment review before experiment push.

## Parent integration

Retain a separately named source-pinned read-upgrade report, update current consumer maps and log the getReceipt/Files/SDK/SPA followups. Recheck all source pins and original control hashes. No owner choice is needed for this reversible profile. If source size forces a different dependency layout or any state/history change, keep the failure and revise this bounded design explicitly before implementation continues.
