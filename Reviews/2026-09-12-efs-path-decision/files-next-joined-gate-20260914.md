# Next Files gate: real revisions, checked parents and bounded reads

**Status:** cold full-body failure and bounded-read remedy both reproduced and
independently reviewed; actual joined Files journey still being implemented.

**September 14 supplement:** actual checked Root/Child/grandchild acceptance,
same-File rejection controls, competing signed/native revisions, retained
parent backlinks and required-index rollback now pass. Task 1 source `9fdee5e`
and [full evidence](https://github.com/efs-project/planning/tree/eda7a0c/Reviews/2026-09-12-efs-path-decision/lab-b/files-task1-20260914)
are pushed and independently approved: 110/110 full tests, 8 Files cases,
unchanged kernel. Task 2 is implementing qualified head-first tags and a
complete folder window. Later paragraphs below record the original motivation;
they are not a claim that completed parent validation remains unimplemented.

Basis: compact B `1d8356c9de86a488c950abcb3f9f4d17a6126510` (source
`b94b57c405ef18b7f259cbd636d685ff96738ce7`). The separate archive work does not
change these Ledger/TypeRegistry sources. This narrows the next
[[files-journey|Files journey]] gate; it does not replace that journey.

## What the current small tests do not yet earn

The Quote-shaped tests cover many generic head, placement, history and Lens
mechanics. They do not demonstrate actual `R0/RA/RB` FileRevision parents,
same-File validation, or a revision tag evaluated **after** choosing a head.
Do not repeat the existing move/restore analogue and call that gap closed.

A useful fixture permits arbitrary document bytes and later descendants:
RootRevision contains File ID and bytes; ChildRevision begins with a checked
parent reference, followed by File ID and bytes. Both require an existing File
Subject. The child rule must check that the parent is Root or the same Child
Type and belongs to the same File. No test-specific document content is built
into the rule. This is a two-Type experiment, not adoption of the production
FileRevision grammar or all future recursive Types.

The registry can declare the child's reference as any existing Record, then
the mandatory acceptor narrows it to Root or its incoming Child Type ID. That
avoids embedding a circular self-Type hash. The admitting Ledger is the
acceptor's caller; use that context, not an address supplied in the data.
Calling the acceptor directly is not an admission. Its dependency on the
Ledger's immutable-record semantics remains explicit; a rule codehash alone
does not authenticate a different Realm's behavior.

## The concrete gas risk to falsify first

`Ledger.record` and `body` load **every** body word. The validator has a fixed
300,000-gas call budget. An 8,192-byte cold parent needs 256 separate cold body
slot reads: 537,600 gas before overhead under the lab's Cancun schedule
([EIP-2929](https://eips.ethereum.org/EIPS/eip-2929)). Thus
a tiny child could fail solely because its valid parent is large. A parent
written earlier in the same transaction warms those slots and can hide it.
This is a source-derived lower bound, not an observed failing transaction.

Test a valid maximum-size parent retained beforehand and a small child that
needs only its Type and File ID. Compare explicit cold access with same-batch
warm access and a small-parent control. Assert the real rejection, unchanged
nonce/counts/head/index state, and exact successful controls. Do not shrink
the supported body limit or call the rejection invalid user data.

Preferred remedy to experiment with: a bounded Record metadata/body-range
getter, preserving storage, identity and existing full reads. A compact
revision header with separate content is another legitimate profile, but
adds representation/closure costs. Raising the validator budget is a control,
not an automatic fix for needlessly loading whole files. Any new getter changes
the Ledger runtime commitment; measure it as a new disposable source revision,
not a retroactive improvement to the frozen B/C cost rows.

## Joined acceptance criteria

- Admit `R0`, competing `RA/RB(parent R0)`, and a grandchild of `RA`, with
  arbitrary bytes. Missing, unrelated-Type and wrong-File parents reject
  atomically. Admission checks are mandatory, not reader-only lint.
- A separate exact Files reference-index profile supplies retained parent
  backlinks. Generic IndexModule does not index body references. Force that
  required callback to fail and require the Record and backlink to roll back.
  COMPLETE means the declared, gap-free retained-membership universe, not
  current validity after withdrawal.
- With `project_efs(File)` and `approved(RA)`, Alice-first selects approved RA;
  Bob-first selects RB without that revision tag; equal-priority disagreement
  remains conflict. Preserve exact bytes, authorship and both parents.
- Then compose the higher-priority whiteout/lower-priority placement case.
  All browser reads use one available block state; paid pagination must
  explicitly reject basis drift or perform historical reduction.

Source anchors: `lab-b/src/Ledger.sol:134-137,479-591,723-733,834-845,955-978`,
`TypeRegistry.sol:9-42,78-95`, `Interfaces.sol:6-38`, and
`SelectiveReferenceIndexModule.sol:31-69` at the pins above. The current
Quote-only index is precedent, not a Files implementation. No Core/storage
change was previously needed for the tiny analogue; that conclusion is now
**conditional on solving bounded parent reads** for realistic sizes.

## September 14, 09:56: the cold-read failure is now observed

The three-control diagnostic and independent review are retained on B
[`441f3cd`](https://github.com/efs-project/planning/tree/441f3cd/Reviews/2026-09-12-efs-path-decision/lab-b/files-parent-budget-20260914).
Warm 8,192-byte and cold 64-byte parents permit the valid child; a cold
8,192-byte parent causes exact mandatory-rule rejection with the tested nonce,
counts, Record and posting state rolled back. Solc 0.8.30 compiled successfully;
three tests passed with no failures/skips. No malformed-fixture false positive
was found in independent review. This is Foundry cold-access evidence, not a
paid transaction, a measured gas threshold, or a universal Files failure.

The kernel already has `extsload`. A test-only control can read just the
parent's File-ID word through that existing primitive, leaving storage and
kernel runtime unchanged. That raw-layout-coupled control is next; it is not
yet passing evidence or a recommended developer API.

For an eventual ergonomic API, compare a combined bounded metadata/header
getter (at most two metadata and two body slots) with general bounded range
reads. Distinguish a missing Record from admitted empty bytes; return length
and exact Type, and validate profile shape before interpreting zero words.
A separate compact header/content profile also avoids full reads but changes
the current inline-body Record IDs and adds content-availability handling.
No representation change or new permanent getter is adopted here.

## September 14: bounded remedy passes without a Core change

The six-control result is retained at B
[`c653f50`](https://github.com/efs-project/planning/tree/c653f50/Reviews/2026-09-12-efs-path-decision/lab-b/files-bounded-control-20260914).
The valid cold 8,192-byte parent accepts under the unchanged budget when its
exact Type, masked length and File-ID word are read through existing `extsload`.
Wrong-File and short-body cases still reject with tested rollback. All six
controls passed inside the 102/102 full suite; independent review found no
actionable issue. This is a pinned-layout Foundry diagnostic, not paid gas or a
stable public SDK contract. Executable assertions stayed unchanged across RED
and GREEN; one explanatory comment changed and is disclosed in the review.

The [[files-joined-implementation-plan-20260914|next joined implementation plan]]
uses that existing primitive only in its disposable profile. Preflight also
clarified exact index/Lens wiring, first-admission bit masking, family-wide
coverage and current-basis/status handling. It does not require another Core
getter to test real revision parentage and head-first revision tags.
