# One-word Admission storage

> Staged experiment, not dispatched or adopted. Use `superpowers:subagent-driven-development`: one implementer, independent review and root reproduction. Freeze the then-reviewed full-C0 control after intervening tasks; do not use a preliminary source.

**Goal:** avoid repeating a full Envelope ID in every physical Admission while keeping the logical Admission API, exact IDs, all authored occurrences, lifecycle, indexes, Binding/CAS and Lens behavior. Measure whole operations and the added dictionary-read work. This is compression, not removal of publication history.

**Architecture:** retain the existing Envelope ordinal/dictionary and logical `AdmissionRow { envelopeId, packed }`. A physical one-word cell resolves its Envelope ID through that dictionary. The dictionary becomes a required decoding dependency; old raw corruption independence cannot be retained or described as equivalent.

**Stack and constraints:** existing full-C0 disposable worktree; Solidity0.8.30/optimizer200/viaIR/Cancun; ordinary runtime24,576/initcode49,152/transaction16,777,216/block33,554,432 limits. One serial build/new finite-world owner, managed watchdogs/exclusive evidence, no traces, stop below20GiB, preserve all demos/Fable work. No production, funds, migration or protocol freeze. No Record-Type packing, live counter, index removal, helper rewrite, Type-language or Files-profile change bundled. Root owns main, review and publication.

Independent source preflight and complete implementation-plan review: **Approved**. No implementation or gas saving is claimed; the active execution order remains in [[2026-09-11-efs21-overnight]].

## Exact proposed representation

| Bits | Meaning |
|---|---|
|0–15|Original leaf index|
|16–63|Original Type ordinal|
|64–111|Original Principal ordinal|
|112–159|Envelope ordinal|
|160–255|Reserved zero|

Keep the existing Admission mapping root. Logical `packed` remains exactly the low112bits; the global Envelope ID is not replaced in any logical identity. The former second word is reserved/unused in this fresh-genesis arm. Validate before narrowing and never alias a malformed ordinal to a valid one.

## Task 1: Pack, hydrate and price the actual path

**Files:** actual `StateStore` physical cell/codec, `StateKernel` fresh-admission writer and staged getter, direct `StatePointReads` consumers, actual Core/harness raw adapters and live fault harnesses. New named paired runner/source/artifact/evidence files in the pragmatic experiment. Update transitive same-basis source qualification only as required by changed runtimes. Preserve historical evidence and hashed support scripts.

- [ ] Freeze reviewed source/artifacts/layouts before edits. The intended RED admits a real occurrence, checks unchanged logical `admissionAt`, then asserts the packed first word and zero former second word at the actual mapping root. Existing two-word storage must fail the physical assertion; a missing symbol is not RED.
- [ ] Add an explicit physical `AdmissionCell` and bounded encode/decode helpers. Encode the existing logical112bits plus the Envelope ordinal. Preserve raw zero-cell diagnostics as the zero logical tuple; qualified in-range holes still fail. Nonzero cells require reserved-zero bits, valid nonzero Envelope ordinal below the u48 guard, a present dictionary ID and reverse Envelope-ordinal association.
- [ ] Keep **staged** and **committed** high-water validation separate. `StateKernel` installs the Envelope cell/dictionary before leaves and commits counts last. Fresh writes and same-publication Binding predecessors use `AdmissionContext.count`, not persisted counts. Encoding additionally verifies the dictionary ID equals the original logical Envelope ID. Do not call committed occurrence hydration inside admission.
- [ ] Committed checked reads bound the decoded Envelope ordinal against persisted Envelope counts and retain all existing Admission request/high-water, lifecycle, leaf, Type/Principal, Record and Envelope checks. Raw `admissionAt` retains its outer inventory bound and logical tuple; it does not fetch/authenticate Envelope bytes or become a complete occurrence proof.
- [ ] Audit the real access closure: `StateKernel.planLeaf/put/get/bindingEffect`; `StateStore.read/applyRow`; `StatePointReads._hydrateOrdinalChecked/getReceipt/_hydrate`; Core and StatefulHarness `admissionAt`; independent inventory reconstruction; OccurrenceReadHarness and BindingReadHarness. Retarget fault writers to live cells. Editing the reserved former word cannot masquerade as corrupting current admission state.
- [ ] Test same-publication Binding set→replacement with exact predecessor/CAS while counts are still old; partial Envelope completion; ACTIVE/mixed retry; duplicate Record leaves with distinct admissions; zero/reserved/guard/above-high-water cells; missing/swapped/aliased dictionary IDs and reverse mismatch. Check occurrence-by-ID/ordinal, receipt, hydrated postings, Binding history/withdrawal and Lens results against the control.
- [ ] State fault differences honestly: raw reads now depend on the Envelope dictionary and reject some malformed physical words that previously returned arbitrary tuples. Reverse checks catch simple mismatch, not coherent multi-row corruption; ordinal-only hydration no longer retains an independently stored Envelope ID. Exact content hashes and trusted writer/deployment assumptions are unchanged, not strengthened into chain-state proofs.
- [ ] A reached late failure after several packed writes must unwind cells, shared block CREATE/helper nonce, lifecycle, mandatory index state, Bindings, staged counts and authority nonces. ACTIVE retries write no new packed cell. Preserve same-carriage dependencies and existing provisional visibility limitations.
- [ ] Early actual U3/library/runtime/complete-initcode gate. No cap increase or unrelated outlining. If size fails, stop for a separately reviewed narrow change. Preserve declared ABI error differences without hiding failures behind broad normalization.
- [ ] Freeze source/support before exclusive serial paired worlds. Price full Files create including staging, edit/tag/rebind, partial/retry/withdrawal and late failures; paid occurrence/receipt/Binding/history/Lens readers and actual Files RPC work. Measure scalar cold and repeated warm dictionary accesses separately; include setup/deployment and regressions. If no routed receipt API exists, retain that pricing gap explicitly rather than inventing one.
- [ ] Retain all complete inventories and same qualified outcomes. The64-duplicate workload gives64 new cells; known64-unique cap refusals remain explicit unless a fresh ordinary-cap success is measured. No claim that packing fixes large-Type cache/output limits. Full applicable Core/foundation/explicit SDK/reader/Chromium/offline gates, strictTS/fmt, independent review, root reproduction/publication and exact owned-world cleanup.

## What is known before measuring

At shared-storage`24d7407`, the retained create has7 new admissions, edit3 and rebind2. This representation removes one newly occupied word per fresh admission:7/3/2words in those workloads,64 in the successful duplicate fixture, zero for an all-ACTIVE retry. The full retained world has178 admissions. These are source-derived storage counts, **not measured gas savings**, and must not be summed with unrelated index/mirror reductions.

This is a lower-risk option if James retains all current semantic promises. The separately proposed inline-value Files profile changes content reuse/representation and may offer a larger saving; F3/live-counter removal changes immediate history enumeration. Neither is silently selected by this plan. See [[2026-09-11-efs21-full-model-storage-preflight]], [[2026-09-12-efs21-smaller-files-profile-preflight]] and [[2026-09-11-efs21-overnight]].
