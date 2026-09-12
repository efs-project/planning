# Full-C0 shared immutable byte-block experiment

> Staged plan, **not dispatched**. Use `superpowers:subagent-driven-development` for a later bounded implementation, fresh independent review and root verification. First finish the separate [[2026-09-11-efs21-envelope-storage-plan|Envelope-only experiment]] and pin its reviewed source/evidence. No gas saving or protocol choice is established here.

**Goal:** reduce the fuller model's physical byte-storage cost without deleting its seven Files facts, exact identities, validation, authority, history or posting families. Compare the reviewed Envelope-only arm to one shared immutable byte block containing a new Envelope and the unique new Record bodies of that admission call.

**Architecture:** a transaction-local slice plan, one pinned-helper CREATE when new bytes need storage, and unchanged ordered installation of logical rows. Record cells retain three metadata words; Envelope cells retain one by using the existing u48 ordinal domain physically. No global allocator, slab index, pointer migration, counter/index deletion or Type dictionary compression.

**Evidence basis:** root and independent read-only source review at full-C0 `ab13d89e4e6111efc5eea6fc61c3ac56181c9a70`. Envelope-only is not implemented yet: this plan must be rechecked against its actual reviewed result, especially view/cell accessors, helper inventory and execution-profile qualification. See [[2026-09-11-efs21-full-model-storage-preflight]].

A fresh implementation-plan reviewer approved after explicit records-only early-helper checks and checked Envelope offset-zero/unaligned Record tests were added. This is conditional plan approval, not implementation or measured savings.

## Constraints

- Disposable `planning-efs21-direct` / `codex/efs21-direct-apply` only; plans on main. Preserve Fable and native demos/workspaces. No populated-state migration, production repository, public funds/deployment, protocol freeze or simultaneous heavy worker.
- Keep existing logical limits: selected bodies8192 aggregate, canonical Envelope2304 maximum, hence shared payload10496 and STOP-prefixed runtime10497. Ordinary runtime24576/initcode49152/transaction16777216 remain. Do not shrink the Type language or claim its separate large-cache/output issue is solved.
- One finite managed world/build at a time, watchdogs, exact owned cleanup after process exit, no traces or broad diagnostic test globs, stop heavy work below20GiB. Source frozen before final paired receipts; root owns publication.
- Keep helper runtime, logical public ABIs/IDs and current integrity guarantees. A universally stronger read hash needs its own comparable control, not hidden attribution to storage placement.

## Task 1: Build slices, preserve ordered meaning, measure whole operations

**Source scope:** `Reviews/2026-09-05-c0-core/src/{StateKernel,StateStore,StatePointReads,StateBindingReads,StorageByteView,Preparation}.sol`, a narrowly scoped immutable-byte view/slice-planning library if needed, actual raw fixture getters and affected corruption harnesses. Existing Type reading and checked Record batches are consumers. Add a bounded source-pinned paired runner and exclusive evidence under `Reviews/2026-09-11-efs21-pragmatic/`. Minimal source-backed runtime/profile/replay qualification changes only.

### 1. Freeze and prove the physical opportunity

- [ ] Freeze the reviewed Envelope-only source/artifact/control bundle; both arms use one explicit runner/support revision. RED requires one block shared by a new Envelope and multiple new Records, exact logical read parity and no old dynamic Record body writes. Historical control selections stay exact or refuse before build/world creation.
- [ ] Measure/confirm compiler layout before broad integration. RecordCell: full TypeId word; byte-reference word; existing two uint64 ordinals word. No packed-counter/dictionary optimization in this task.

### 2. A bounded byte-reference encoding

- [ ] Reference word: address160, payloadOffset16, length16, wholePayloadExtent16; top48 reserved zero for Records. Envelope uses top48 for its physical ordinal, widening to logical uint64 on reads. Guard physical narrowing with the existing valid domain `1…2^48−2`; **address plus three uint16 ranges plus uint64 ordinal would not fit** one word. Existing Envelope-only layout is therefore an explicitly new fresh-genesis physical profile, not migration-compatible by coincidence.
- [ ] Before copy/allocation: nonzero pointer, extent≤10496, offset≤extent, length≤extent−offset, exact code extent+1, STOP prefix; then Record length≤8192 or Envelope length288…2304 and requested subrange containment. Checked Envelope reads must additionally require offset zero, preserving the Envelope-only guarantee while using total extent for code-size checking. Record offsets may be arbitrary byte positions. Present empty Records remain valid, including a records-only STOP block with extent zero. Absent ordinal requires zero metadata/residue; reserved bits must remain zero.
- [ ] Preserve existing semantic checks and error subjects. Same-sized, in-range pointer/slice swaps are not universally authenticated by shape alone: scalar Record reads currently do not universally hash RecordId, while Binding reads do. Retain those distinctions and explicit falsifiers, not a blanket corruption-proof claim.

### 3. Plan bytes early, install facts at their existing points

- [ ] Build the memory slice plan only after carriage/lifecycle preflight, the all-ACTIVE checked-return and fresh-admission guard. Include Envelope bytes only if absent. Among fresh selected leaves, include each unique absent Record once, using its ordinal for presence rather than body length. Consult only metadata while planning; do not pre-prepare all leaves or make unvalidated Types/Records exist.
- [ ] Recommended deterministic dedup is a bounded scratch-index bottom-up merge sort by full RecordId, grouping equal IDs and checking persistent metadata once per group. Assign byte offsets in original first-selected-leaf order. Admission/effect order is never sorted. Price sorting/code/memory at64 leaves, including unique/reverse/duplicate arrangements. A first-seen scan is an explicit alternative with up to2016 comparisons, not a silently linear implementation; an adversarially colliding memory hash table is not automatically better.
- [ ] Deploy exactly once if a new Envelope or at least one absent Record needs a slice, even when the latter's bodies are empty. Before **every** early deployment, including an existing-Envelope/records-only block, require nonempty configured helper code and its exact configured codehash. Do not inherit an Envelope-only check located solely inside new-Envelope installation; leaf preparation has not happened yet. Use its returned pointer and verify actual block code; its public nonce is not reserved. No allocation on all-ACTIVE retry, or an existing Envelope with only existing Records. Global dedup leaves existing Record cells/pointers untouched. Disclose changed early-failure precedence/gas.
- [ ] Keep Record installation after its existing `checked`/reference stage and before Type-group installation, occurrence postings and effects. Earlier leaves must still establish Types/Records for later leaves. Shared bytes existing early are not admission. Existing Envelope pointers are not rewritten during partial admission; new Records can occupy a records-only block. Preserve counts/bootstrap staging and native EVM rollback.

### 4. All consumers and real failures

- [ ] Redirect actual Store/kernel accessors, scalar Records, occurrence hydration, ordinary Type-member traversal through its group Record, Binding decoding, raw getters and corruption harnesses. Checked eight-Record batches retain ordering, duplicates, bounds and whole-result refusal. Do not mutate abandoned dynamic-body storage in tests and count it as a live fault.
- [ ] Cases: new Envelope/all existing Records; existing Envelope/new Records; duplicate new RecordId with distinct admissions/effects; empty Record; earlier TypeGroup then dependent leaf; partial reuse/retry; withdrawals/revival; exact and mixed ACTIVE cases. No duplicate body/cell allocation, dropped occurrence or premature admission.
- [ ] Corrupt real offset/length/extent/reserved/ordinal/pointer/code fields; test malformed code size/STOP, out-of-range and contained-wrong slices, nonzero Envelope offset, absent residue, same-size swaps and Type/Record association. Test valid unaligned Record starts/subranges, particularly Type-group member parsing, and wrong/empty helper on a records-only allocation. Reach a late invalid reference/CAS/cache or later effect failure after CREATE and earlier row writes. Verify rollback of helper nonce/code, Records/Envelope, counts, authorization and all indexes.

### 5. Paired economics and release gate

- [ ] Two explicit serial worlds, source-frozen Envelope-only versus shared candidate, same admitted data/action order and deployment provenance where possible. Measure complete seven-fact file create including content staging, edit/tag/rebind, dedup/partial/retry, minimum/max64-leaf carriage, tiny/dense/zero/empty bodies and late failures. Separate setup, action and rejected-action costs.
- [ ] Real paid scalar/eight-Record/Envelope/occurrence/receipt/Type/Binding reads plus actual qualified Files anchor browsing. Sharing a code account can change cold/warm access; report that rather than inventing per-record isolated savings. Preserve all logical inventories, posting families and Lens outcomes, and enumerate actual runtime/configuration/helper-child changes.
- [ ] Record actual chronological block and Type-cache creations/pointers, including a public helper deployment before the run. Never infer child inventory from Type ordinal or relabel old evidence. Explicit new runtime/view profile, same-basis qualification and historical refusal/replay tests.
- [ ] Full applicable C0/foundation and explicit bounded Node/browser regressions, strict TS, ABI/layout/source checks, ordinary sizes; fresh independent review, root reproduction and publication. Recheck actual baseline counts at dispatch. Known large-Type failures remain qualified, not silently skipped away.

## What this does not establish

This changes byte placement, not how many logical admissions/index updates are required. Savings can be negative for tiny/zero-heavy data; current scalar integrity is not automatically improved. Shared bytes do not provide independent availability outside chain state, portable author proofs or retained-history pruning. Kernel/index separation and configurable full-model query families remain distinct work. A future implementation report must show actual complete-operation prices before recommending this physical representation.
