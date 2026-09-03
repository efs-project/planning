# EFS 2.0 coherence and MVP-readiness review — errata

**Status:** correction record for a point-in-time review; preserves the review and its corpus as evidence, but governs the corrected readings below. This errata adopts no architecture, protocol bytes, repository, runtime ABI, venue, product scope, experiment, or implementation.
**Corrects:** [`2026-09-02-efs2-coherence-and-mvp-readiness-review.md`](./2026-09-02-efs2-coherence-and-mvp-readiness-review.md) and its [review corpus](./2026-09-02-efs2-coherence-review-corpus/README.md)
**Basis:** read-only audit findings, 2026-09-03, against the review's recorded tips and the current planning coordination surface.

#status/done #kind/review #repo/planning #topic/efsv2 #topic/coherence #topic/requirements #pass/2026-09-03-mvp-c0-contraction

## What this changes

The original review and corpus remain immutable historical evidence.  This file
does not retroactively amend their lane reports, allocate authority, or turn a
correction into a design decision.  When a reader relies on an affected
headline, table entry, or ledger row, this errata is the controlling
interpretation.

1. **Core experiment authorization.** The readiness branch's
   `RECOMMEND-GO-CODE` technical disposition, its control, and its V2-C1 packet
   are proposal/evidence, not an authorization to build, deploy, or run a Core
   experiment.  The review's “can you start” answer must be read as evidence
   that a disposable candidate had been exercised, not permission inherited
   from that evidence.  Review integration likewise grants no experiment,
   product, deployment, or freeze authority.

2. **Genesis and Type admission.** The review overstates the absence of a
   starting path when it says nobody admits Files Types.  Stage A's SR-17 and
   the Files proposal provide proposal-stage admission and candidate-Type
   material.  What is missing is the ordered, owner-scoped application/bootstrap
   manifest: which exact experiment commitments and capabilities initialize
   first; which candidate Types and indexes are activated in what order; who
   creates the bootstrap Principal, root, Plans, mount, and route; and which
   post-state roots must be checked.  That missing manifest remains a design
   and experiment gate, not evidence that Type admission is undesigned.

3. **Complete-listing scope.** `BindingScope` is a proposal-stage mechanism for
   certified complete directory enumeration and must be present at genesis if
   that claim is made.  It is not a claim that every read, point lookup, or
   disposable slice is impossible without it: the existing acceptance material
   permits explicitly labelled `PARTIAL` listing.  The review's blocker framing
   applies only to a complete-listing claim, not to all File Browser progress or
   to Core generally.

4. **Documented two-signature behavior.** The two typed-data signatures plus
   submission were already documented in the MVP acceptance material and are
   forced by the cited B0 branch for the described Files operations.  They were
   not an undocumented Core fact.  The remaining issue is product-facing:
   disclose and test the ceremony and its honest failure/cost behavior, and do
   not treat its existence as a missing authorization or a proof that a
   different permanent signature grammar is required.

5. **Placeholder-constant scope.** The pending ERC-1271 gas figure and policy
   encodings constrain the cited B0 candidate Codex/Realm construction.  They
   do not make every possible EFS RealmId, nor EFS in general, uncomputable.
   A disposable profile may supply bounded experiment values only with explicit
   non-adoption status; neither those values nor this correction freezes a
   permanent Codex or policy grammar.

6. **Branch count and coupling.** The review's evidence-window census is four
   remote branches: three source-locked product/design branches plus the
   separate Fable tournament lab.  The three coordinated branches and the lab
   must not be collapsed into one four-branch implementation state, and the
   count is not a live branch inventory after the review tip.  Its process
   conclusion remains: material evidence was outside `main`; any later count,
   merge status, or coupling claim needs a fresh ref check.

7. **Findings-ledger verification.** “Two-lens adversarial verification” was
   limited to the clusters the review lanes had rated blocking.  It tested
   textual accuracy/currentness and materiality/classification; it was not an
   independent re-execution of every experiment, a live-chain verification, or
   uniform independent verification of the ledger.  Rows marked “not separately
   verified” remain citations to inspect before acting, and even reviewed rows
   retain the corpus's point-in-time and source-availability limits.

## Conclusions that remain valid

Subject to the limits above, the following review conclusions remain useful
evidence rather than adopted direction:

- current-spine drift;
- the missing ordered Files bootstrap manifest;
- no selected byte carrier for the described write-capable profile;
- SDK and product integration gaps on the coordination surface;
- overgrown MVP acceptance scope; and
- authority-recording defects that leave material direction or evidence outside
  the vault's discoverable queues.

These are inputs to the appropriate owner and design processes.  They neither
select a Core arm nor authorize a deployment, durable data, product release,
or protocol freeze.
