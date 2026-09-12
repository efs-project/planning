# Moving index policy, not just index storage

September 12, 2026 · source-backed EFS2.1 proposal delta · not implemented or adopted

James's target is a kernel for ingestion with a separate contract owning index policy/configuration, some mandatory and others configurable. The staged [[2026-09-12-efs21-posting-store-plan|PostingStore experiment]] establishes physical separation, but deliberately does **not** finish that responsibility transfer. This note records the next boundary and protects existing meaning while exploring it.

## What the full prototype actually does

At reviewed`8688d52`, exact Type bytes contain up to eight `(kind,target)` index declarations. The parser validates targets/extraction limits and retains them in `SchemaCache.indexes`; the bytes participate in exact Type identity. Preparation validates bodies/references and returns opaque, already-derived occurrence keys. `IndexKeys` always emits families3/1/4, adds5/6 for references and realizes Type-declared7/9. A kind2 declaration adds nothing beyond the mandatory reference postings.

StateKernel applies those keys, maintains family2 from family3's first/live state, and separately handles Binding history8 and first-Binding anchors10. Withdrawal prepares the **original occurrence's** Record and principal. Putting those same heads/words in a second account leaves this policy in Core/helper code.

Source seams: `Reviews/2026-09-05-c0-admission/src/TypeGroupParser.sol` index parsing; `Reviews/2026-09-05-c0-core/src/{PreparationHelper,IndexKeys,StateKernel}.sol`. Independent responsibility audit used the frozen revision rather than the concurrently edited shared-storage worktree.

## Smallest policy transfer to test next

A mandatory coordinator could receive authenticated ingestion/effect facts and derive the index keys itself:

```text
registerType(typeId, authenticated extraction descriptors, declared indexes)
onOccurrence(admit/withdraw, operationOrdinal, originalAdmissionOrdinal,
             recordId, typeId, principalId, validated field/reference atoms)
onBinding(bindingKey, scope, operationOrdinal, firstBinding)
configureProfile(profileId, exactTypeId, extraction, activationBasis, required)
```

This is a responsibility sketch, not a fixed ABI. Core keeps validation, reference/lifecycle authority and Binding transitions. Preparation supplies bounded validated atoms instead of final posting keys. The coordinator owns mandatory-family rules, realization of legacy declarations, optional configuration, epochs, coverage and maintenance. Same-publication Type registration must reach it before a later Record uses that Type.

Start with **one additive scalar-equality profile** in a separate query namespace. Keep existing canonical Type/cache bytes, IDs and legacy Type-declared7/9 obligations unchanged. An optional profile is not permission to turn off or reinterpret a previously declared index. That would require an explicitly different execution/query profile with honest unsupported results, not a silent settings change.

Configuration authority remains a design item: a full-C0 Principal ID is not automatically an address-owned namespace. The first disposable implementation must name its authorized configuration actor and scope; it must not borrow native `msg.sender` ownership by accident.

## A live counter does not inherently belong in Core

Removing family3 while retaining family2 requires per-Record live multiplicity and first-ever evidence. Core already retains independent Record existence and occurrence lifecycle. `RecordRow.firstAdmissionOrdinal` can supply first-ever evidence; the mandatory coordinator can own live multiplicity. Core need not gain a new counter merely because an index lost its occurrence list.

The live counter must never depend on optional maintenance: failed mandatory maintenance rolls back ingestion. Core retains authoritative occurrence status, global admission/row counts and Binding revisions/CAS. Physical packing might make a Core-resident counter cheaper, but that is a separately priced engineering tradeoff, not a logical requirement or a placement ruling in this note.

## Late configuration still needs a real population law

An index attached later must either explicitly cover only data from activation onward, or backfill a pinned admission frontier while incorporating new admissions and withdrawals exactly once. Appending old backfill ordinals after new ones violates the current ordered-list structure. Whole-population COMPLETE and negative membership claims require the promised population actually be covered.

Withdrawal must remove only a contribution that was indexed in the relevant profile epoch. Looking only at current configuration can underflow a counter or erase another occurrence's contribution. Disabling/restarting a profile does not erase Core history or turn missing coverage into an empty result.

Native Discovery is useful precedent for attach/restart/detach, required versus tolerated maintenance and coverage states. Its population is **current live non-directory Files owned by one address**, using current content. Full-C0 indexes admitted occurrences, potentially competing principals and historical Binding membership. Native swap-pop membership and file-inventory backfill do not prove full-C0 correctness.

## Three decisive falsifiers

1. The same exact Type silently loses a declared index, or an incomplete optional profile receives legacy COMPLETE treatment.
2. Attach/backfill concurrent with admission → withdrawal → revival duplicates, loses or misorders contributions.
3. Two occurrences of one Record, withdrawn independently, corrupt family2's unique/live transitions after family3 removal.

The required/configurable set still needs James's final ruling. These experiments can establish concrete costs and failure behavior beforehand without changing normative designs or hiding the tradeoffs. Current work: [[2026-09-11-efs21-overnight]].
