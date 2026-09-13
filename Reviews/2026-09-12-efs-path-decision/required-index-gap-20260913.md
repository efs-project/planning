# Required-index gap: what the current cost table does not buy equally

September 13, 2026 · source-derived comparison; no requirement waiver or new
protocol mechanism is adopted

**Typed reverse-reference discovery is retained, not merely an optional MUD
extra.** The greenfield [[../../Designs/efsv2/owner-rulings#EFS 2.0 greenfield system boundary|owner ruling]]
preserves typed backlinks/reverse membership, revocation-aware current counts
and bounded contract reads. September's engineering delegation does not waive
automatic indexing while its exact mandatory/configurable split is pending.
The [[README|war-room outcome ledger]] also forbids silently dropping required
discovery. Physical indexes, roles and precise query profiles remain engineering
choices; this finding does not require James to answer the same question again.

Concrete contract query: **which admitted Quote Records directly reference this
Pair?** It cannot require knowing every Quote beforehand or trusting an off-chain
search service. Unique Records, authored occurrences and current Lens-selected
heads are different answers; choose one exact result domain before pricing it.
Admission at a named basis does not mean today's rules revalidated old data.
Quotes about an Item require Pair→Item then Quote→Pair traversal; arbitrary
transitive graph closure is not automatically promised.

## The actual difference

Paths below are relative to each candidate's
`Reviews/2026-09-12-efs-path-decision/lab-{b,c}/`. B source is `c5561e2`, C
Solidity `2ca7349`. Independent bounded review accompanies the source analysis.

| Obligation or mechanism | B compact | C MUD-backed |
| --- | --- | --- |
| Record-body reverse references | No target-keyed posting demonstrated. Type/admission pages permit a bounded scan, with total work proportional to unrelated Quote traffic. | Appends source Record IDs per reference target on fresh Record admission. Not yet role-, occurrence- or Lens-qualified query results. |
| Binding-target reverse membership | Keeps binding-target postings and releases old live counts on rebind/unbind. | Keeps binding history/scopes, but no equivalent target reverse-list/live-count demonstration. |
| Complete typed query | Must hydrate/filter/deduplicate and remain PARTIAL until exhaustive completion. | Must hydrate/filter Type, reference role and basis; repeated references may require deduplication. Target postings alone are not full conformance. |

Source: B `src/IndexModule.sol:101–115,142–175`, `src/Ledger.sol:834–865`,
`src/Keys.sol:73–79`; C `src/IndexModule.sol:110–129`,
`src/tables/IndexTables.sol:163–194`. Neither implementation strictly subsumes
the other's indexes. No broad “backlinks COMPLETE” label establishes the
required outcome. B's counters likewise do not automatically implement every
endorsement or revocation policy.

## One discriminating test

Pin `incomingQuotes(Pair, basis, budget, cursor)` to **unique admitted Records**.
Require historical A1, A2 and B1; add same-body reuse and unrelated Quote traffic.
An independent expected set checks no duplicates/loss, basis consistency and
PARTIAL until exhaustive completion. Charge automatic write maintenance,
setup/storage and total page/hydration cost—not just one cheap first page.
Then separately test current reverse-membership changes on rebind/unbind.

This can price a B scan versus added selective index and C's existing postings
plus missing qualification. It does not itself prove every typed-reference
profile, and it is not a fourth architecture or permission for an unscheduled
heavy run. Keep the current measured ordering qualified; do not extend the
19:10 evidence cutoff or 23:10 provisional recommendation to chase perfection.
