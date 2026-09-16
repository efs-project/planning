# Core closeout: coherent ordered acceptance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** A developer rule sees the same preceding batch actions through direct Ledger reads and required indexes. Preserve atomic Files publication with Name-after-placement ordering.

**Architecture:** Maintain required indexes after each staged leaf; run separate read-only publication-final Files checks. The EVM remains the rollback mechanism. No overlay database, new persistent journal, or repeated mandatory Type evaluation.

**Tech Stack:** Solidity0.8.30, optimizer200, via-IR, Cancun; existing Foundry prototype and bounded Node integration tools.

**Spec:** [[core-design-audit-20260915]], A1 and closeout packet1. James authorized implementation of the audit closeout. This is a disposable implementation decision, not permanent protocol adoption.

## Global Constraints

- Only the assigned worker edits/builds/runs the compact lab. Existing `planning-warroom-b-run` worktree; no owner-demo mutation, new production repo, public deployment, dependency installation, Fable, or unbounded trace/state dump. Canonical planning documents remain on main; parent owns status and publication.
- Build atop the reviewed bytework repair, preserving its long-name and linear-filter behavior. Keep runtime24,576/initcode49,152 and normal15M transaction allowance, with paid hard ceiling16,777,216. Never increase `ACCEPT_GAS`, Name255 domain limits, or the existing total index budget to obtain green tests.
- Required prefix and final callback failures revert every logical/index/application effect, nonce and evidence row. Unknown coverage is not absence. No silently optional final callback.
- One joint index allowance per publication: existing base plus per-action allowance, spent across all prefix and final dispatches, including measured dispatch overhead. Do not grant the base anew for each leaf. Report any newly unsupported combined workload instead of padding batches.
- No mutable execution/index change or nested publication during a staged publication, including through the proxy. Keep sequential storage roots unchanged; use a namespaced lock slot. Transient storage is an alternative only with explicit compiler/execution-profile accounting and covering tests.
- Preserve the public Type acceptance ABI and its pre-leaf interpretation. The new index callback phase is intentionally a changed execution dependency; old modules cannot silently qualify. Current rules may resolve `ledger.indexModule()`; rules deliberately pinning an old module retain that explicit meaning.
- Conditional bytecode extraction is allowed only after measuring need: a small fixed helper may perform bounded dispatch via DELEGATECALL to preserve Ledger as index caller. Prefer creating that stateless helper in the Ledger implementation constructor, with immutable address/codehash, if this avoids unresolved library links in existing Node deployments. A fixed linked library is also allowed with explicitly verified linking. Its address/code identity must be recoverable and pinned by execution identity, with dependency mismatch failing closed. No arbitrary delegate target, runtime helper creation during admission, or privileged shared storage helper; total implementation initcode must fit49,152.
- Measured extension of that extraction: the complete repair remained25,018 runtime bytes after bounded dispatch extraction. The same fixed publication-support module may also own read-set shape/hash and registry-only acceptance-profile calculation through bounded STATICCALL. Exact hash domains, encodings, errors and order stay unchanged; canonical storage, dependency head comparisons and actual Type-rule invocation stay in Ledger. `readSetHash` may change from Solidity `pure` to `view` while retaining selector/output; update its source interface and disclose that change. No mutable helper registry or new upgrade authority.
- Actual cold Name255 still refused under the shared350k allowance after warm covering passed. A semantic-equivalent `FilesNameLayout.valid` optimization is in scope: preserve every ASCII/length/dot rule, code/descriptor pin and earlier bulk-copy fix. Retain the cold RED receipt and independent equivalence controls; require the same cold transaction to pass without increasing caps or padding the batch.

## Task 1: Ordered prefix maintenance with final invariants

**Files:** `src/Interfaces.sol`, `src/Ledger.sol`, `src/ExecutionSlots.sol`, `src/IndexModule.sol`; callback overrides in `src/SelectiveReferenceIndexModule.sol`, Files profile/index files and fault fixtures; `test/UpgradeProxy.sol`; focused acceptance tests. Add a fixed `src/IndexDispatch.sol` or truthfully named `src/PublicationSupport.sol` only for measured runtime fit; update `test/FoundationABI.sol` if the read-set helper mutability changes. Evidence: `core-closeout-acceptance-20260915/`.

### Phase contract

1. A mandatory Type rule runs before its proposed leaf. Earlier successfully staged Records, binding heads, occurrence counts, admission frontier and all prefix-maintained indexes agree. Checked references may target earlier leaves, not future ones.
2. After each successful leaf, commit staged counters and synchronously maintain that effect in the required index before the next rule. `onAdmission` may receive repeated contiguous segments of one publication; no effect is appended twice.
3. After all leaves, mandatory `afterPublication(publication,effects)` is a bounded STATICCALL. It validates final Name/Directory obligations, including Name-after-BIND. It does not append indexes or rerun Type rules. Require its exact versioned acknowledgement, not merely a successful low-level call: an old module's permissive fallback cannot silently stand in for the missing mandatory final hook. The full publication commits only if this succeeds.
4. `counts()` inside callbacks denotes the staged prefix. A proposed publication evidence row is not a completion receipt. Other transactions never observe intermediate state. Coverage correctly describes the staged prefix after maintenance; final metadata/Names can remain unavailable before final checks.
5. A publication lock covers all mutable ingress and mutable execution/index setters; proxy upgrade checks the same slot. Failure rolls back the lock. Normal next publication succeeds after a successful or reverted one. Capture registry epoch and execution identity at the start and check them immediately after every external prefix callback and before final commit: a registry/index administrator invoked through a callback must not change the signed policy or execution basis between leaves. Drift rejects the entire transaction, including the attempted configuration change. Ordinary coverage progress is not execution drift.

### Implementation and decisive evidence

- [ ] Preserve the historical A1 reproduction at09e022f. Change its expectation to reject the second singleton in a batch and prove complete rollback. A first singleton separately succeeds and a later one fails. Capture expected RED before runtime changes.
- [ ] Split the entire Files inheritance chain: parent/live/carrier/selective-reference maintenance stays prefix; Names and Directory obligations both move to final. Explicit prefix and final failure fixtures must remain distinct.
- [ ] Implement prefix counters, dispatch, final phase and lock under the shared allowance. Reject malformed/noncontiguous required processing. Keep final-completion bookkeeping distinct from prefix coverage; do not let a replay gap become COMPLETE.
- [ ] Add compact agreement controls for duplicate publish/reuse/withdraw and binding overwrite/unbind. A live quota distinguishes lifetime count from live count and checks withdrawal-before-publish versus the reverse order. Include a mandatory rule following the active index, not only a permanently pinned fixture pointer.
- [ ] Exercise native single/batch and guarded native/signed pathways using existing harnesses. Keep unsupported guarded import explicit. Earlier same-batch reference succeeds; future reference fails; placement-before-Name still succeeds. Standalone maximum legal Name binding remains inside its original allowance.
- [ ] Exercise a realistic eight-reference equipment rule: checked character/item dependencies plus a mutable external eligibility condition. New admission/reuse respects changed eligibility; existing historical admission is not retroactively invalidated. Index-based quota cannot be bypassed by batching. A wrapping application's state commits or rolls back with the full operation.
- [ ] Use malicious callback fixtures to attempt nested publication, index replacement, proxy upgrade, registry policy/role changes and index-generation changes. Type rules remain STATICCALL and cannot mutate through descendants. Verify both prefix and final refusal restore complete state, not just return an expected error.
- [ ] Run focused acceptance, rollback, Names/Directory, guarded ingress, execution-upgrade and bytework covering tests; capture actual whole transaction/diagnostic gas separately and all changed deployed runtime sizes. If library extraction is necessary, check deployment and execution dependency identity with normal venue limits.
- [ ] Self-review, commit exact task files with required trailers, and return source range, report, commands/outcomes, new costs and remaining limitations. Do not push. Independent task review precedes integration.

## Deliberately subsequent work

Full generic index families and populated replacement/replay are still required by packet2; this task must not foreclose them. Reconstruct replay from canonical ordered admissions and a shadow historical binding fold, never current heads or current withdrawal flags. Use whole-publication replay chunks for final invariants. Immutable family semantics belong in the obligation identity; mutable coverage/progress does not.

Busy-Realm reads, live contract Files, Type/identity interpretation/proof closure and final real-network cost/access measurements remain open. Passing this task is not whole-prototype completion.
