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

## Post-cutoff source seam: B need not hardcode Quote

Independent source inspection found a small generic route **within B's current
positional-reference profile**, not an arbitrary nested schema language.
The index already receives Record/Type/admission coordinates. Existing Ledger
`record` and registry `typeInfo`/`refTypes` getters expose the retained body,
first admission and declared leading reference words. A target index can key
postings by `(sourceType, referenceOrdinal, targetRecord)` and append only on
the Record's first admission, avoiding reuse duplicates. No new Ledger storage
or authority mechanism is needed for this bounded experiment.

Semantic role names and arbitrary nested reference locations are not exposed;
pin the positional role as part of the comparison. Retain all current mandatory
families, price extra getter/decoding/storage work and the existing callback
gas budget, then regenerate index-obligation signatures. C already receives
checked `refs`/freshness, but drops reference ordinal from its target postings.
Both still need basis, coverage and consumer qualification. This is a feasible
implementation seam, not a measured saving or a closed index gap.

Checked source: B `src/Interfaces.sol:22–38`, `src/Ledger.sol:526–543,834–840`,
`src/TypeRegistry.sol:85–100,143–185`; C `src/IndexModule.sol:110–118` at the
pins above. Raw references outside the registered profile are not indexed by
this proposal and must not be advertised as covered.

## September 14: qualification need not copy the whole Record

The [[required-query-experiment-20260914|source-reviewed experiment]] returns
Record IDs, not full Quotes. Under pinned, reciprocally attached mandatory
Ledger/index code, C's checked target posting plus a source-Type/first-admission
header proves ordinal-0 membership for the exact one-reference Quote Type.
B's proposed type/ordinal/target-keyed family can similarly use the immutable
first-admission tuple without rehydrating the body at query time. Its write-side
validation/index cost remains charged; B's unindexed scan still reads bodies.

This matters for both simplicity and safety: C legitimately admits some
noncanonical/trailing outer ABI encodings, so demanding a canonical 288-byte
body at read time would exclude accepted data and copying before checking
length would not be bounded. The IDs-only access path avoids that unnecessary
parser. Exact code/profile/coverage checks remain required; an arbitrary
ABI-compatible index is not trusted. Source review is not a passing executable
test or a new measured saving. No withdrawal or binding-live-count gap is waived.
