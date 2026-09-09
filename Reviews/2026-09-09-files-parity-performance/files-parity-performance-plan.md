# Files parity and performance implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development task by task. This continues the owner's approved disposable prototype/performance work; it is not permission to create product repositories or freeze a protocol.

**Goal:** Exercise v1-style file lifecycle data on the real v2 Store, measure its costs, and remove avoidable admission overhead without weakening validation.

**Architecture:** Reuse the managed upgrade host and independent reader from September 8. Keep workflow construction in a small fixture helper and assertions/measurements in tests. Optimize only the in-memory admission journal if the measured baseline justifies it; preserve every persisted byte and external semantic rule.

**Tech Stack:** Existing Solidity 0.8.30/Cancun/via-IR/optimizer-200, Foundry/Anvil, Node and ethers dependencies; no new dependencies.

**Spec:** [Existing joined consumer checkpoint](../2026-09-08-upgradeable-foundation/consumer-checkpoint.md) and [Files MVP plan](../../Designs/efsv2/testnet-files-mvp-plan.md). This plan covers their prerequisite lifecycle/resource experiment, not the whole browser checkpoint.

## Global Constraints

- Work in the existing `codex/mvp-c0-coherence` worktree. Preserve all pre-existing dirty Binding/read-library files; do not stage them.
- No new product repository, public network, real wallet, main merge, permanent IDs or schema adoption. Synthetic operator authorization is not portable author proof.
- Reuse real admitted Types, Records, Bindings, upgrade host and independent reconstruction. Do not introduce a second authoritative file tree or claim contract Lens/router validation from a JavaScript projection.
- Keep runtime <=24,576 bytes, full initcode <=49,152 bytes and each actual transaction gas limit <=16,777,216. Never split a promised atomic operation to disguise failure.
- Gas reports distinguish setup, content staging, metadata, rejected writes and reads. Record source/compiler/input pins and receipt gas; no fiat estimate or v1/v2 multiplier without matched evidence.
- Generic structural admission is not Files profile validation. Report missing router, authority, complete listing and SDK/browser joins explicitly.
- Tests must prove real effects, exact rejections and unchanged retained state after rejection. New behavior is test-first; no source-text tests.

## Task 1: Real-state file lifecycle and resource baseline

**Files:** Create `workflow.mjs`, `workflow.test.mjs`, and `baseline.json` in this directory. A narrowly scoped shared-runner export may be added only if the existing callback API is insufficient; do not copy the runner. Do not change Core implementation.

**Interfaces:** Consume `compileUpgrade`, `withUpgrade`, `publication`, `groupLeaf`, `ordinaryRecord`, `readUpgradeState` and existing candidate Type inputs. Export `runFileLifecycle(lab)` returning `{ operations, checkpoints, ids }`; each operation records a name, receipt gas, calldata bytes, success/rejection and leaf count. Tests consume the returned verified checkpoints. Baseline generation is opt-in with `EFS_FILES_PERF_EVIDENCE=1`, bounded to 2 MiB and writes only this directory's `baseline.json`.

- [x] Read the existing seven-leaf fixture, tag fixture and actual candidate descriptors. Derive Files purposes and roles from the linked specification, not a new namespace. Keep fixture-only tag conventions explicitly labeled.
- [x] Write tests first for a missing `runFileLifecycle` export; then implement the lifecycle with actual onchain publications: root and destination directories with meaning/charters; seven-leaf file creation with separately staged small bytes; edit selecting a new immutable revision; rename and move using destination Entry/Binding plus source Whiteout/Binding; name-claim retraction via tombstone; two authors' tag/untag/re-tag current Bindings. Do not claim remove/restore Trash support without a removal marker profile.
- [x] Derive record IDs from real bodies. Reconstruct after each semantic checkpoint and assert old revisions persist, file ID stays stable across rename/move, source masks and destination heads are correct, A untag leaves B current, and re-tag retains history. Tests must independently assert expected authors, names and targets, not compare one helper with itself.
- [x] Include a stale edit/rename CAS rejection with exact decoded error/preflight and mined rejection, then independently compare retained inventory before and after (exclude observation pins only). Explicitly state that this is Core atomicity, not router NOREPLACE authorization.
- [x] Run the lifecycle before/after an upgrade and assert existing data/current heads survive. Add fresh-object batch scaling at 1, 2, 4 and 8 leaves, with distinct salts. Measure terminal reconstruction RPC/byte counts if supplied by the reader; otherwise label read measurements unavailable rather than inventing them.
- [x] Test report generation/refusal of incomplete evidence. Use this behavioral shape:

```js
assert.equal(report.checkpoints.every(c => c.outcome === 'VERIFIED'), true);
assert.equal(report.ids.createdFile, report.ids.movedFile);
assert(report.operations.every(op => BigInt(op.gasUsed) <= 16777216n));
```

- [x] Run `node --test Reviews/2026-09-09-files-parity-performance/workflow.test.mjs`, export the baseline, and rerun once to compare non-timing outcomes. Preserve original baseline when Task 2 changes code; its source hashes identify the old implementation.
- [x] Commit only this task's paths after `git diff --check`. Report real missing capabilities and observed gas failures, not a parity pass if a scenario cannot execute.

## Task 2: Bounded admission-journal lookup optimization

**Files:** Modify only `Reviews/2026-09-05-c0-core/src/StateKernel.sol` and, if needed for a focused memory-only unit, new `src/StateJournal.sol`; add focused tests under that Core test directory. Add `comparison.test.mjs`, `optimized.json` and `comparison.md` here. The new comparison test imports the unchanged Task 1 runner and uses a separate opt-in `EFS_FILES_PERF_OPTIMIZED=1` export that writes only `optimized.json`; it must never use the baseline-export flag. Do not modify `StateStore` layout, Type IDs, record encoding, Binding semantics or reference validation.

**Interfaces:** `admit` / `admitAtRevision` inputs and outputs, full replay ordering, errors and stored rows stay unchanged. Consume Task 1's same `runFileLifecycle` to compare actual operation receipts. Add no public production API.

- [x] Profile the existing file transaction and batch-scaling evidence before selecting an optimization. The known candidate is `get` linearly scanning `plan.changes` on every lookup. Report the evidence; do not claim all gas belongs to the journal without trace attribution.
- [x] Write focused red tests for the memory lookup: distinct `(Kind,key,index)` tuples never alias; repeated updates return the latest value while replay retains sequential before-values; an absent tuple reads original storage; collisions/probe exhaustion cannot silently select another row. Add a measurable regression bound derived from Task 1's baseline for a multi-leaf case, not a made-up universal gas guarantee.
- [x] Candidate implementation: an ephemeral open-addressed index to the latest journal row. Allocate a bounded power-of-two table with load <=1/2 for the existing journal capacity; keep zero as empty and store row-index-plus-one. Hash `(kind,key,index)` for placement but compare the full tuple for equality. Probe at most table length and fail loudly on exhaustion. `put` still appends the complete before/after change; `get` uses the index or storage. Allocate nothing extra on exact replay with zero fresh leaves. If this makes deployed components exceed normal limits or does not improve measured workload, retain baseline implementation and report the failed candidate instead of weakening safety or raising caps.
- [x] Re-run Core Forge tests, September 8 upgrade contract/managed tests, Type/tag canaries and the exact Task 1 lifecycle. Verify independent snapshots and negative outcomes, not gas alone. Recheck deployed runtime/initcode lengths.
- [x] Export `optimized.json` separately, with exact current source pins. Explain setup versus steady-state and any regressions. The comparison must use identical workflow/input/compiler settings; state observation hashes/timing differences rather than calling raw snapshots byte-identical across fresh chains.
- [x] Commit only tested task paths. Do not refresh historical `managed-upgrade.json` or baseline evidence to hide a source change. Leave promotion into the actual product implementation for the integrated handoff.

## Controller work alongside these tasks

**September 9 execution refinement:** the first high-level memory-index
candidate exceeded the runtime cap. Permit one bounded same-architecture
code-size iteration, keeping full-tuple equality, ordered replay and all caps.
If it still fails, retain the baseline and record the failed experiment;
do not broaden this into external-library factoring or a storage redesign.

Inspect and run the existing v1 E2E/whiteout/Lens tests with local gas reporting, keeping v1 source unchanged and public/fork RPC disabled. Document a feature-parity matrix and honest comparability limits. After task and final scoped reviews, publish this experimental branch only and identify the next actual Files/router/SDK/browser join.
