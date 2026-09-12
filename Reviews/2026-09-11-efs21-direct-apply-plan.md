# Full-C0 direct application experiment

2026-09-11 · v2 PM · disposable prototype implementation plan, not an adopted protocol change

Companion to [[2026-09-11-efs21-overnight]]. James authorized deeper EFS 2.1 cost experiments. This arm asks whether the fuller prototype needs a separate in-memory journal and replay pass to obtain atomic admission, given that an EVM transaction already rolls back failed writes. It does **not** remove records, indexes, authored authorization, history or Lenses. It must distinguish successful-effect parity from changed failure order and callback visibility.

## Scope and controls

- New isolated code worktree/branch from `e605fc9fb173d195960e41247ca270c074d5060c`, the reviewed lazy-allocation control. Do not change the native browser branch, its raw-byte work, Fable's checkout, existing worlds or historical receipt files. Results and proposed decisions return to planning/main; no hidden normative design fork.
- One implementation/build/new Anvil owner at a time. Start only after the raw-representation task and root's finite checks release that slot. Managed fresh local worlds only; no public deployment, funds, migration or new production repository.
- Keep Solidity 0.8.30, optimizer 200, via-IR, Cancun, ordinary EIP-170 and transaction ceilings. No full opcode/SSTORE traces. Bounded runner, exact owned-cache teardown; stop heavy work below 20 GiB free.
- The original full-C0 large-Type cache limitation remains a known limitation, not solved by this arm. The native Files profile is a separate comparison and must not supply missing full-C0 assertions.

### Task 1: Remove deferred journal machinery and test the actual boundary

Read the current C0 admission, StateStore dispatcher, preparation helper and tests before editing. This is a falsifiable experiment: preserve a clear negative result if the hypothesis fails, rather than broadening the change until a benchmark looks good.

**Production ownership:** only `Reviews/2026-09-05-c0-core/src/StateKernel.sol` and `src/StateStore.sol`. Replace the journal with a small admission context carrying configuration, staged counts and staged bootstrap Type IDs. Remove the changes array, pointer/hash table, allocation and replay machinery. Existing `get` reads the already-applied storage prefix. Existing `put` invokes an immediate `StateStore.apply` dispatcher using the original storage assignments and Type-cache deployment behavior. Remove `view` where mutation requires it. Do not simultaneously rewrite packed rows, coalesce effects, extract indexes, change Type caches or add a production strategy switch.

Preserve BindingFold, ordered postings, packed-word transitions, liveness, reference ordering, counters, CAS and duplicate/ACTIVE effect skipping. Earlier leaves become visible in order; future leaves must not be preinstalled. Capture persisted count/init prestate before writes, assert that it did not unexpectedly change, and assign the staged values once on success. Provisional rows therefore coexist with old persisted counts during admission. This is explicitly restricted to the currently pinned helper—not a guarantee for arbitrary state-observing callbacks.

The existing helper's preparation/compilation calls are pure and argument-driven. Its `deployCache` is **not pure**: it creates inert bytecode. Direct application moves that deployment before later validation. The claimed target is successful-effect/data parity under this helper, not universal failure or observer equivalence.

**Test ownership:** C0 `foundry.toml`, a narrow strategy-assertion adaptation in `test/StateKernel.t.sol`, and a new `test/DirectApply.t.sol`. Keep `StateJournal.t.sol` and `JournalAllocation.t.sol` unchanged as baseline-only tests, explicitly excluded from the candidate's compilation. Do not retain obsolete production journal code simply to compile them. Preserve all other public tests and record exact unchanged/adapted/baseline-only/new test counts.

The existing `reject()` helper demands exact error, final-state rollback **and zero attempted SSTOREs before rejection**. Direct application deliberately changes only the last condition for late failure. Preserve ordinary single-fault selectors and final-state assertions. Retain no-write assertions for early guards, carriage rejection, all-ACTIVE kernel admission and ordinary reads. Keep the mixed-retry resource/public-behavior test. Add explicit late-failure attempted-write evidence plus complete rollback of Core state, authorization nonce, helper nonce and new cache code. Never label an adapted suite "unchanged."

Required falsifiers:

1. Earlier record/Type reference succeeds; forward and same-envelope occurrence references still reject.
2. Exact ACTIVE retry, mixed ACTIVE/fresh, duplicates, repeated Binding keys, withdrawals/revival and tombstone/rebind preserve successful rows, history, inventory/order and selection.
3. Multiple Type groups preserve successful cache bytes, addresses, creation order and helper nonce. Existing Types do not create new caches; later rejection removes earlier new caches.
4. Compound faults: an early cache/deployment/index-transition fault followed by a later invalid reference/CAS. Capture both strategies' selectors and rollback. Explicitly allowlist explained precedence differences; do not replace all exact-error tests with "some revert."
5. Test-only state-observing preparation and callback-capable cache helpers demonstrate provisional-state visibility and reentrancy boundaries. These are counterexamples to a broader claim, not supported production extensions. The original journal also has partial state during replay; do not falsely present it as universal isolation.

**Measurement ownership:** new `Reviews/2026-09-11-efs21-pragmatic/scripts/direct-apply-benchmark.mjs`, `test/direct-apply-comparison.test.mjs`, `evidence/direct-apply-{control,candidate}.json` and `evidence/direct-apply.md`. Derive a bounded new runner from the prior journal workload; do not import the top-level executable or modify its source/evidence. Run identical new runner bytes in two fresh sequential arms, control before production edits. Retain source/support/compiler/runtime pins, complete receipts and calldata, independent IDs, receipt-block/hash checks and final inventories. Keep separate staging, setup, failed receipts, direct-author partial → routed mixed → fresh-authorized exact retry. Add cache pointer/code/helper-nonce observations and targeted compound-failure evidence. Record teardown status **after** managed return. No estimate-only claimed savings; failed experiments are useful evidence.

Use test-first implementation with a narrow structural/resource falsifier, then original public fixtures and new boundary tests. Capture current-control tests and receipts before edits. A baseline failure unrelated to this change must be named, not silently fixed in the arm. Commit exact owned paths only with `Agent: v2-pm`, actual model and `Harness: codex` trailers; no merge/push by the implementer. Report commit, TDD evidence, measurements, verification commands, failure differences, limits and exact cleanup. Fresh independent review and root verification precede publishing the result.

## Follow-on, not part of this task

If direct application works, compare it with physical PostingStore extraction later. External index calls widen the callback/observer boundary while counts are staged and need their own atomic cross-account tests. A smaller admission library may create useful room, but no size or gas improvement is assumed in advance. Contract-native fast writes, immutable bytecode storage, broader developer validation and full Lens integration remain separately measured tasks, not benefits claimed from removing the journal.
