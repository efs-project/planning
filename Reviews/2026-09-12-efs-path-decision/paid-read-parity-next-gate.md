# Next paid-read gate: tighten the consumer, not Core

September 13, 2026 · source-derived experiment scope, not a protocol decision

**18:18 completion note:** this bounded consumer patch, negative tests,
independent preparation and fresh paid run are complete at source `c5561e2`;
see [[b-parity-paid-results-20260913]]. The original scope below is retained.
This closes these consumer-check gaps, not all B/C feature equivalence.
[[required-index-gap-20260913]] identifies remaining mandatory discovery
differences; rollback and portable-evidence gates remain open.

The next useful step is a **B consumer-only parity patch**, targeted negative
tests, then a newly pinned paid-read run. Its successful current answers have
not been shown wrong. The issue is that some qualification checks are weaker
than C's, so the published cost ratios are not yet assertion-matched.
The needed facts already exist in B's public getters; no new storage model or
Core write is indicated by this review.

Source pins: B `4b6154695c89976a7325cd0c51dc9591dee387c1`, C Solidity
`2ca7349e5d683c3ff10651c0fc106c10da946145`. Paths below are relative to the
respective `Reviews/2026-09-12-efs-path-decision/lab-{b,c}/` source root.
The common outcomes remain [[sdk-fixture#Appendix — criteria for the next sealed paid point/list slice]].

## Required checks, in priority order

1. **Exact revision and closure at the same basis.** B records selected revision
   without comparing a sealed expected revision. Compare it, bound selected
   and placement admissions to the basis, and require every Quote/Pair/Item
   `firstAdmission` to be nonzero and no later than that basis. B already reads
   these Record values but discards the admission ordinal. See
   `src/JoinedConsumer.sol:415` and `:531`, `src/Ledger.sol:834`.
   This is the current-frontier fixture, not a new historical resolver.
2. **Evidence for this coordinate.** `_admittedBy` checks target, author,
   category and publication range but drops `bindingOrdinal`. Follow the
   existing `admission -> bindingPosition -> positionCell` getters and compare
   HEAD/File/zero-role or FOLDER/folder/name as appropriate. The admission's
   expected revision plus one must agree with the observed revision. Keep
   placement tied to A1's publication. See `src/JoinedConsumer.sol:447`,
   `src/Ledger.sol:851` and `:920`. This is provenance reconstruction, not
   signature recovery or a source-state proof.
3. **Consistent list context and local publication category.** Compare the
   returned cursor's generation, rules epoch, Core commitment, scope and Lens
   hash with the row's context; preserve complete/unmutated/ended/exact-one
   checks. Use B's actual packed-principal cursor hash, not its different
   selection digest. For this explicitly non-imported fixture, check the
   existing `isImported(publication)` flag before assigning local signed/native
   evidence labels. See `src/LensReader.sol:141`,
   `src/JoinedConsumer.sol:496`, `src/Ledger.sol:825`.

Independently specified wrong revision, future/zero admission, wrong-coordinate
provenance and wrong cursor-context replies must reject. Keep positive output
meaning unchanged. A source/ABI/consumer-byte change requires new compilation,
independent preparation/runtime pins, fresh genesis and a newly qualified
receipt packet; do not relabel old receipts or alter expected answers to fit.
Root schedules any heavy run separately.

## What this does not require

Do not copy every C field/check into B. B's Lens already enforces mandatory
scope coverage; a duplicate consumer coverage call is not automatically needed.
C's canonical framing check belongs to C's encoding, not B's fixed bodies.
Larger event tuples, per-evidence Realm/Core/source-grade fields and different
by-author/backlink inventories are not automatically common requirements.
Keep those implementation obligations in the cost disclosure. Matched rollback,
the [[portable-evidence-next-gate|portable evidence challenge]], larger Files
and historical-change gates remain separate and unwaived.
