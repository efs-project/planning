# Bounded metadata-only admission reads

> **For agentic workers:** use `superpowers:subagent-driven-development`; one bounded implementation, independent review, root verification. Fresh-genesis prototype only.

**Goal:** avoid loading unused Record bodies and Type caches at three admission sites while retaining all stored facts, validation inputs, references and indexes.

**Architecture:** two internal StateStore accessors replace full logical-row ABI round trips only for Record dedup, Record/Object reference metadata and Type dependency existence. Public reads, actual body preparation, Withdrawal and existing-group cache equality remain unchanged.

**Tech Stack:** existing Solidity0.8.30/optimizer200/via-IR/Cancun, Foundry, ethers and full-C0 paired runner. No new dependency.

**Spec:** [[2026-09-11-efs21-full-model-storage-preflight]], [[2026-09-11-efs21-overnight]]. Three-site source preflight independently reviewed at exact`ab13d89e4e6111efc5eea6fc61c3ac56181c9a70`. **Dispatched September12 06:50UTC** to the available native implementer after the Envelope task's independent/root gate and push. Clean base`ed49a6c1c5bc70ffac392c7767c560d26c726c10` retains the three sites and slot-backed Record/Type cells; read-only intake confirmed this before the sole implementation/build/world grant. This plan precedes any shared-Record-slab or dictionary packing if selected; do not transplant its storage-byte checks to a different Record backend. Initialization outlining/native authority remain separate tasks. Fresh-agent runtime exhaustion and bounded agent reuse are recorded in this task's ledger.

Independent read-only plan review approved the concrete snippets, three sites, corruption/failure scope and focused evidence. It clarified that an intentional error-ABI addition is not removal of the existing public function contract. No implementation or saving is established.

## Global constraints

- Authorized code only in `planning-efs21-direct` / `codex/efs21-direct-apply`; main-visible plans on planning/main. One implementation/build/new finite-world owner. Preserve latest native49966/RPC49941, old54154/RPC54148, Fable60731/RPC60726 and Fable's worktree.
- No production repository, migration, public chain/funds, adopted protocol or reduced Type grammar. Ordinary runtime24576/initcode49152/transaction16777216 and existing full-C0 block33554432 limits unchanged. Measure transactions/used block gas honestly; no traces, broad diagnostic test globs or large persistent nodes; stop heavy work below20GiB.
- Keep all mapping layouts/rows/body bytes, count semantics, all ten index families, authorization, helper runtime/configuration, IDs, bindings and Lens results. Do not combine cache compression, stored-body backend changes, mirror deletion or new authority.
- Preserve exact historical evidence. Current runner selects source-frozen control/candidate explicitly. Source/support commit before final exclusive receipts. Root owns review/push/main updates.

## Task 1: Three guarded metadata reads, priced against the full-row control

**Files:** `Reviews/2026-09-05-c0-core/src/StateStore.sol`, only three sites in `src/StateKernel.sol`, focused new `test/AdmissionMetadata.t.sol`, narrowly affected test harness methods, one isolated paired runner under `Reviews/2026-09-11-efs21-pragmatic/scripts/` and exclusive JSON/Markdown evidence there. Reuse the then-reviewed full-C0 source/control/runtime-selection machinery. Existing public function selectors, tuples and events remain unchanged; the new bounded error may add `ErrReadState` to a compiler-generated admission-library ABI. Record that intended error addition rather than require byte-identical ABI JSON.

**Internal interfaces:** add `RecordAdmissionMeta(bytes32 typeId,uint64 recordOrdinal)`, `recordAdmissionMeta(Store storage,bytes32)` and `typeDependencyOrdinal(Store storage,bytes32)`. Their names describe deliberately narrow authority, not a validated full Record/Type. Read immediately applied storage, never stale entry-count snapshots.

- [ ] **Freeze and RED.** Pin then-reviewed Envelope source/runtime/layout and exact full-row control before edits. Add a real test that fails because metadata access still reads body/cache payload: use a small target and a near8192-byte target with the same logical existence/reference outcome, inspect accessed slots with bounded Forge access recording (not full traces), and assert the intended candidate touches no Record payload slots. An absent method/compiler error alone is not the implementation RED. Preserve all existing assertions.

- [ ] **Minimal guarded accessors.** Use the following behavior, adapting only local declaration placement. The Record header is examined before ordinal/type decisions, like the old eager row load; `bytes.length` must still compile to Solidity's malformed-short/long-header check. The explicit8192 bound is new fail-fast handling of impossible stored lengths, not a pre-existing bound at these sites. Test compiler behavior and document error/gas differences for forced corruption.

```solidity
struct RecordAdmissionMeta {
    bytes32 typeId;
    uint64 recordOrdinal;
}

function recordAdmissionMeta(Store storage s, bytes32 id)
    internal view returns (RecordAdmissionMeta memory result)
{
    RecordRow storage row = s.records[id];
    uint256 length = row.body.length;
    if (length > 8192) revert StorageByteView.ErrReadState(id);
    result = RecordAdmissionMeta(row.typeId, row.recordOrdinal);
}

function typeDependencyOrdinal(Store storage s, bytes32 id)
    internal view returns (uint64 ordinal)
{
    TypeCell storage cell = s.types[id];
    address pointer = cell.cacheCode;
    // Preserve cacheBytes(nonzero missing code)'s existing Panic(0x11),
    // even if the Type ordinal itself is zero. No payload copy is needed.
    if (pointer != address(0) && pointer.code.length == 0) {
        assembly ("memory-safe") {
            mstore(0, shl(224, 0x4e487b71))
            mstore(4, 0x11)
            revert(0, 36)
        }
    }
    ordinal = cell.typeOrdinal;
}
```

Import the existing `StorageByteView` in StateStore. A null cache pointer still returns the ordinal, as the original empty-byte path did; STOP-only code also remains allowed at this existence site. Do not add STOP/hash/schema validation or claim the original dependency test performed it. Record payload corruption of a valid-length body remains unauthenticated at these sites, exactly as before; incoming deduplicated bodies still undergo commitment and Type validation.

- [ ] **Replace only the three consumers.** In `planLeaf`, replace the eager old RecordRow load with `recordAdmissionMeta`; create the same new logical RecordRow from incoming `leaf.typeId/leaf.body`, next Record ordinal and current admission ordinal only when the observed ordinal is zero. In `references`, use the same metadata result and preserve `ReferenceUnproved` then exact-Type/ObjectGenesis checks in their current order. In `group`, use `typeDependencyOrdinal` for the dependency loop only. Preserve earlier-in-carriage visibility. Keep `checked`, existing-group row/cache equality, active Withdrawal preparation, actual Type creation and public getters on their current full-byte paths.

- [ ] **Falsifiers and layout checks.** Test empty/short31/long32/near8192 stored bodies; absent/wrong-Type/Object targets; repeated and same-carriage references; duplicate RecordIds in selected leaves; partial/mixed retries and reached late rollback. Test malformed short/long headers, body length8193 and inflated huge lengths without copying; valid-length fabricated payload remains outside this metadata guarantee. For Type dependencies test pointer0, nonzero missing code, STOP-only code, valid small/large supported cache, missing Type and earlier-in-carriage Type. Record exact original/candidate errors for compound forced faults. Verify layouts/helper runtime and existing public function selectors/tuples/events unchanged; explicitly list the intended bounded-error ABI addition if the compiler emits it.

- [ ] **Paid complete-operation comparison.** Two fresh serial worlds with exact frozen full-row control and candidate, same runner/calldata/compiler/external deployment order. Include new occurrence of existing tiny/near-limit Records; fresh Record control; small referring publication to existing tiny/large target, repeated refs and valid Object refs; group with small/large supported Type dependencies; same-carriage dependency; representative complete Files create/edit/tag and late rejection. Retain all setup/admission/failed receipts, code/runtime/profile pins, complete logical inventory and qualified Binding/Lens/Files readback. All-ACTIVE retry bypasses these three sites: include it as a no-improvement control, not a claimed saving. Existing paid public reads should remain unchanged; check representative occurrence/Record/Binding reads rather than assuming it. Required regressions are reported, not averaged away.

- [ ] **Final gate.** Full applicable Core/foundation Forge plus focused new cases; explicit bounded SDK/authority/independent-effect/browser list, touched formatting, ordinary sizes and strict TypeScript where applicable. Existing journal-only exclusions and legal large-Type unsupported case stay explicitly named; inspect actual counts. Commit source/support before final exclusive evidence; independent source/evidence review and root reproduction before push. Confirm only preserved demos remain, with owned temporary caches/builds removed after exit.

## Interpretation

This removes no persistent publication/index slots. It can improve repeated access to existing large bodies/caches, but is not by itself evidence that the recurring publication floor is cheap. New bounded refusal of impossible overlength stored Records is an explicit integrity difference from the old potentially expensive copy; do not claim universal behavioral equivalence under arbitrary storage corruption. If subsequent code-backed Record storage makes the benefit smaller, remeasure the combined implementation rather than adding independent savings arithmetically.
