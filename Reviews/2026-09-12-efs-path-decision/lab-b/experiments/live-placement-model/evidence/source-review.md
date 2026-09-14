# Live-placement candidate index — bounded source/design review

## Verdict

**Feasible in principle; not implemented or measured.** Lifetime-name scans are a cost of the present append-only scope audit list, not an unavoidable cost of current Lens selection semantics. A separate, complete index of currently live placements can supply candidates while retained Core heads—including tombstones—continue to decide selection. This is not a drop-in change to `postingHead.live`, an onchain savings claim, or a recommendation to discard history.

The useful bound is **all live per-author placements in the chosen Lens**, not the visible selected folder size. Many lower-author live placements may all be hidden, so a complete empty result can still require substantial candidate work. Author probes, index maintenance, ordering, coverage, and cursor costs remain.

## Actual-source basis

Read only the current B lab sources and recent lifecycle/churn fixture:

- `src/IndexModule.sol:16–21,95–120,124–139,157–175`: scope is an audit list of binding ordinals appended only for fresh binding keys. UNBIND changes history/backlinks, not scope membership or its `live` count. Coverage currently ignores the scope parameter and is family-wide; COMPLETE requires mandatory coverage from admission 1, current processing, and no gap.
- `src/LensReader.sol:90–104,134–218`: first non-absent author decides; either live or tombstone masks lower authors. Listing scans each author's entire scope count, hydrates its head, skips non-live entries, then probes higher heads. Budget exhaustion is PARTIAL even with zero output. Missing complete coverage produces UNKNOWN.
- `src/Interfaces.sol:17–35`; `src/Ledger.sol:600–670`: the existing ordered index effects already identify scope/binding/ordinal, BIND vs UNBIND and `oldLive`. Rebinding an old position preserves its binding ordinal; UNBIND retains a state-2 head and increments the exact CAS revision. The index is invoked transactionally after Core writes, with publication rollback on index failure.
- `test/FilesJoined.t.sol:812–890`: two added bind/unbind names increase the audit count 2→4 with unchanged selected G. Budget 2 is honestly incomplete; budget 4 complete. This proves the present representation's cost, not a semantic lower bound for every index.
- `test/FilesJoinedConsumer.sol:213–247`: complete placement enumeration precedes exact HEAD selection and File/revision-tag filtering. A File tag cannot make a masked/absent HEAD a selected verified File.

SHA-256: LensReader `7d0a167b684d700642fd1510bb237bc4ae59b630696603e94f08dd7c3dda0d2e`; IndexModule `43618a994095f3d73902f23521c055c8950cdc043f8d8ca74e9b83aef67f1592`; FilesJoined tests `65d4dc7514cc026d7879aec158fd562953b63135161730af0290f3d25be00b18`. No lab source was edited for this investigation.

## Why the proposed union works

At one exact basis, let `L[a]` be precisely the live placement positions for author `a` in the requested purpose/folder scope. Form `U = union L[a]` over every author in the ordered Lens. For each unique position, resolve the ordered Core heads, stopping at the first non-absent head; emit only a live winner, with its exact author/target/revision/admission. Then perform the existing File HEAD and tag joins.

Completeness: every live selected position has a live winner and therefore belongs to that winner's complete `L[a]`, hence to `U`. Soundness: resolving all preceding heads prevents both higher live bindings and higher tombstones from leaking lower candidates. A position that is tombstoned everywhere need not be enumerated: it cannot yield a live placement. Its tombstone remains available for exact path reads and future lower-author candidates. This argument is about live folder enumeration, not an API that promises to enumerate every mask.

Deduplicate **position**, not File identity or target. The same File at two names must still give two placements; the same position from several authors yields one selected placement. For this scope the position includes purpose/folder/role, not a pathname string assumed globally unique. Validate index membership against the corresponding Core position cell/head; do not trust a purported candidate to redefine scope.

The proposal fails if it means “enumerate only the highest author's live set,” “omit higher tombstone probes,” “filter tags before resolving placement,” or “stop after enough visible matches.” A missing later-author index can hide a later-only file even when earlier authors are completely indexed.

## Coverage, pagination, and order are real obligations

All selected authors' candidate coverage must be qualified at the same admission/index generation/rules epoch/Core-and-index binding. This could be one gap-free family-wide certificate, as the current lab uses, or real per-author/scope certificates; the latter do not exist merely because today's API accepts a scope argument. A late, gapped, stale, unsupported, or unverified candidate index cannot establish complete emptiness. Follow current listing's conservative UNKNOWN when required coverage is not COMPLETE; use PARTIAL for an otherwise valid enumeration whose candidate work budget is not exhausted. Keep coverage incompleteness distinguishable in diagnostics.

The smallest model should freeze one snapshot for a complete read. For a continuation, bind Lens, scope, basis, generation, epoch, code/module identity and a well-defined traversal position; reject/restart if any relevant snapshot changes. A mutable dense set with swap-delete can skip or repeat candidates between pages even if the next surviving head's admission looks old. The current append-list cursor cannot be transplanted unchanged. No claim of historical snapshot enumeration follows from a current live set. Candidate, head-probe, deduplication and tag work need explicit bounds; an unbounded union build hidden before a small output budget is not bounded pagination.

Current output order is author priority, then retained first-binding ordinal within that author. An unordered live set/union changes observable array order. For the reference experiment compare the complete **placement set** first, then separately require old order by sorting winners by `(winner Lens index, winner binding ordinal)`. Such sorting has its own cost and complicates streaming. If eventual compatibility requires that order without full materialization, the live index needs ordered traversal (or another measured ordering mechanism). Do not silently call changed order/cursors API-equivalent.

A smaller equivalent selection algorithm is to enumerate each author's live set and retain today's higher-head masking check. That check itself prevents duplicate output, so a global seen-position set is unnecessary. It still consumes duplicate live candidates across authors. This is attractive for a later bounded implementation comparison, but does not remove the index/order/cursor obligations.

## Same path, moves, and maintenance tradeoff

A live index inserts on BIND from absent or tombstoned state, does not duplicate membership on live→live replacement, and removes on UNBIND. Reuse of the same name changes its target/revision without allocating a second simultaneous candidate. A move updates old and new scope membership atomically with the publication. Higher masks remain Core heads even after removal from live membership. Process the ordered effects—not just each binding's final Core head—when a publication binds and unbinds the same position more than once.

A possible dense live array plus slot map permits bounded membership updates, but adds writes, reads and mutable-order complications. Preserving ordinal order may instead need ordered insertion/traversal or query-time sorting. Existing audit/history/Core rows remain retained; this does not establish lower total state growth. Additional live-index storage may track current membership, while historical data and maintenance overhead remain. The existing effect API appears sufficient for a prototype without new Core semantics; gas feasibility under the bounded callback is unmeasured. Merely reading the current audit list's `live` field is a dead end: it is not a live-only enumerable structure.

## One deterministic throwaway model plan — not implemented

Use three authors A>B>C, six fixed names, two folders and three File identities. Maintain an independent event-replay oracle with first-seen scope names plus current heads; it exhaustively resolves lifetime names. Separately model live membership updates from ordered effects, build the complete union, resolve raw heads, and compare exact placement tuples. Freeze snapshots; never take expected results from the proposed index itself. No chain, contracts, framework, benchmark or random generator is needed.

One adversarial final snapshot (dash is absent):

| Name | A | B | C | Selected |
| --- | --- | --- | --- | --- |
| note | G live | F live | — | A:G |
| brief | mask | F live | — | none |
| temporary-a | mask | — | — | none |
| temporary-b | mask | — | — | none |
| later | — | — | H live | C:H |
| alias | G live | — | H live | A:G |

Construct each mask via a genuine modeled live→UNBIND transition. Exact abstract counts for this snapshot: lifetime memberships `H=9`; live memberships `L=6`; unique live-candidate positions `U=4`; selected placements `S=3`. Today's traversal performs 9 candidate scans and 14 head loads (9 own + 5 higher probes). Union enumeration consumes 6 memberships, removes 2 duplicate positions, and its ordered resolver performs 6 head probes (1 note, 1 brief, 3 later, 1 alias). These are hand-derived model-operation expectations, **not measured gas or an assertion that the different operations have equal costs**. The live-per-author variant would consume 6 candidates and 11 head loads without a global union.

Replay a short fixed sequence covering: repeated live→live replacement; same-name G reuse after F; move G to the second folder and back; higher mask/unmask over lower F; the two-name churn with unchanged visible set; and multiple effects for the same key in one publication. At each snapshot compare exact winners, membership uniqueness, and ordering separately. Give G no project tag and H a project tag: project filtering must leave only `later`, never lower tagged F or a duplicated File collapse. Add an H HEAD whiteout to check that File tags do not bypass revision selection.

For pagination, try budgets 0,1,2 and full membership count on frozen snapshots; concatenated accepted pages must equal the reference without omission/duplication. Keep candidate and head-probe counters separate. An empty page before exhaustion stays PARTIAL. Remove C's coverage: the result must not claim COMPLETE even if all A/B work is done. Between pages mutate/delete an earlier dense-set member, move a placement, reverse the Lens, and bump generation: stale continuations must reject/restart, not produce a mixed-basis complete result.

Required negative controls deliberately ignore higher masks, skip C coverage, deduplicate by File, filter lower tags first, and continue a swap-deleted set with the old cursor. Each must be caught by the explicit snapshot or page assertions. A tiny exhaustive supplement of the 27 absent/live/masked state assignments for one position across three authors checks the union-selection proof without scale work.

Stop after this model establishes semantic equivalence or finds a counterexample. Only then consider a separately authorized data-structure prototype and measurements of writes, reads, storage and exact ordering. The conclusion today is limited: **lifetime scans are avoidable in principle for this current live-placement query, but the proposed index has not earned a cost claim.**
