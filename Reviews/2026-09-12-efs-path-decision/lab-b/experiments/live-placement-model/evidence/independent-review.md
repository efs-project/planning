# Independent review: live-placement algorithm model

2026-09-14. Reviewer `/root/files_paid_runner`, independent of the model's implementer. **SpecCompliant; QualityApproved for the bounded representation experiment.** No Critical or Important scoped defect identified. This is not approval of an onchain index, gas claim, production cursor API or EFS readiness.

I read the full approved main `live-placement-model-plan-20260914.md`, all four frozen GREEN source files, the original candidate stub, the current model README, and the actual root-owned RED/GREEN JSON reports including their complete test output. No tests, Forge/compiler, RPC, Git, source mutation or subagents were run by this reviewer. A lightweight file-hash/log check independently corroborated the retained outputs.

## Evidence and exact pins

Reports and frozen sources are under `/tmp/efs-b-archive-task1.OXPOfb/`.

- `live-placement-red.json`: Node v26.0.0, all four syntax checks exit 0; real test execution exit 1, **13 tests / 4 PASS / 9 FAIL / 0 skipped**, 12:33:45.611–12:33:45.890 UTC. The empty-result candidate fails concrete nonempty tuples, paging and continuation assertions. This is behavioral RED, not an import/syntax failure.
- `live-placement-green.json`: same Node and four successful syntax checks; real test execution exit 0, **13 PASS / 0 FAIL / 0 skipped**, 12:43:46.164–12:43:46.436 UTC. The test command uses a 128 MiB Node heap and the same test file.
- Independently verified byte lengths and SHA-256 for every source file in both frozen snapshots. Only `candidate.mjs` changed between them.
- GREEN candidate: `452703b70608ef53294a9f1ad4172b299f2798c71996b73d1bbbbeaecc77605e` (12,482 bytes).
- RED stub: `8e76ac7675cdaf3322b5cfd97b3f03a24c087641aadbcc9c65a9fbaab0efb8d6` (889 bytes).
- Unchanged reference: `407af262140a32aa1ac068353fea4c61620ce013e5f60b50fed0add1c0d4eaa5` (3,954 bytes).
- Unchanged fixtures: `f003a31b1cd770d5e39d20fd966005bd36582a5cb1519691b0c5fc019f619288` (3,248 bytes).
- Unchanged tests: `210e6226c43b8fc10b3cd82565eac2588c40b77862a42bdfeef4ce6dddc7c344` (12,111 bytes).

Three negative-control assertions also pass with the RED empty stub because they compare faulty output to nonempty expected output; that alone does not establish working fault injection. GREEN's positive baseline assertions plus direct source inspection of the implemented fault paths do establish that the named faults are exercised. I do not count the RED negative-control passes as independent proof of fault correctness.

## What is actually independent

`reference.mjs:7–26` replays the event stream into lifetime first-binding heads, with no candidate imports. Its listing at lines 39–67 scans lifetime author/scope memberships and applies retained higher heads. Expected live membership at lines 69–73 is derived from this reference state, never from the candidate's arrays. `fixtures.mjs:33–37` separately hand-pins all seven fields of the three expected winners: A/note→G, A/alias→G, C/later→H. The independent fixture also requires B/brief→F to be masked.

`candidate.mjs:13–70` separately processes every ordered effect. A bind from absent/masked inserts into an author's dense live array and slot map; a live replacement updates the raw head without duplicating membership; unbind really removes membership with swap-delete and repairs the moved slot. Retained raw heads, including masks, remain in a separate map. A later rebind recovers the old first-binding ordinal. The candidate does not manufacture membership by filtering the reference or by filtering all final heads after replay.

Both algorithms consume the same intentionally simple legal event grammar and construct equivalent raw head facts. Their agreement is bounded algorithm evidence, not independent reconstruction of EVM Records, signatures, storage or arbitrary malformed input.

## Selection, ordering and tag semantics

- **Higher masks survive removal from the candidate set.** Union first gathers live memberships, deduplicates positions, then resolves each position against retained raw heads (`candidate.mjs:113–140`). Streaming checks the own live head and every earlier author's retained head (`148–184`); a higher mask or live head suppresses the lower candidate. The live inventory is not incorrectly treated as the whole authority state.
- **Position identity is preserved.** Deduplication is by `(scope,name)`, never File target. Both A/note→G and A/alias→G survive as separate full tuples. The dedicated File-target-dedup fault removes one and disagrees with the hand-pinned answer.
- **Existing order is preserved deliberately.** Snapshot preparation copies/sorts each author's live members by immutable first-binding ordinal (`55–62`). Authors are visited in Lens order. The first live candidate for an emitted position must be its winner; if a higher mask exists, the position is omitted, not reordered. Union and concatenated pages both match the reference's author/first-binding order.
- **Tag filtering follows selection.** `joinPlacement`/`tagged` (`186–225`) selects placement first, then the File HEAD, then File/revision tag stance; only a selected revision can supply a revision-tag subject. Exact authored tag/head tuples are compared, not booleans alone. The File HEAD whiteout fixture keeps the namespace placement but removes it from both qualified tagged-File results.
- **Lifecycle work is real within the model.** The transitions cover live replacement/back, move out/back between two scopes, a higher alias mask, restoration, two new churned names, and several same-key effects in one modeled publication. Tests compare only after the complete group. This does not execute transactional rollback or prove mid-publication invisibility onchain.

All 27 absent/live/masked assignments across A/B/C are checked against an explicit first-non-absent rule plus reference/candidate tuple equality. This covers that finite one-position truth table, not every possible graph or Lens policy.

## Work accounting and the useful result

The hand-pinned snapshot has **H=9 lifetime memberships, L=6 live memberships, U=4 unique positions, S=3 selected placements**. The actual passing assertions distinguish these work counts:

| Query representation | Membership/candidate reads | Head probes | Other separately reported work |
|---|---:|---:|---|
| Lifetime reference | 9 | 14 | 3 author coverage checks |
| Complete live union | 6 | 6 | 6 materializations, 6 position-dedup checks, 3 coverage checks |
| Live ordered stream, all pages combined | 6 | 11 | 3 coverage checks per page; no query-time union, sort or dedup |

The tests at `model.test.mjs:113–125` also show lifetime membership scans increasing 2→4 while the live candidate count stays 1 for the same selected tuple. This supports avoiding some dead-history scanning without changing Lens semantics.

The saving is **not free preprocessing**. `prepare` replays all supplied events, maintains live membership, copies and sorts every current author/scope index, serializes the event/configuration/coverage snapshot and hashes it. It exposes effect count, logical membership updates, copied entries, sort comparisons and serialized snapshot bytes. Its inputs include other scopes, HEADs and tags; preparation is not just a free query-scope operation. The preparation phase is rerun for each supplied snapshot in the tests, not demonstrated as a persistent onchain incremental service.

Streaming consumes this prepared order; it does not rebuild/sort it at each page, and the test verifies unchanged preparation counters after reads. Candidate budget bounds membership visits, **not total EVM gas**: coverage/scope access and up to multiple higher-author head probes still cost work. The reference's counters model relevant author/scope candidate loads rather than every JavaScript Map iteration; neither side's counters is total JavaScript CPU time or a directly comparable gas unit. Snapshot hashing/copying, Map allocation, transport, writes and actual storage growth are not priced.

The optional 10,000-old-name scale fixture was intentionally not implemented; both reference and candidate cap inputs at 1,024 events. The plan made that large case conditional on usefulness, and the README honestly reports the smaller discriminator. This approval makes no 10k, large-directory or general scalability claim.

## Coverage, paging and actual negative controls

- Coverage is checked for every Lens author before answering, including later authors that might be missed by an early winner. Missing C coverage produces UNKNOWN in union, stream and tagged queries. This is a model assumption of complete per-author candidate data, not a state proof or a per-family/per-scope repair mechanism.
- A page consuming only a masked lower-author candidate returns an empty PARTIAL result with a cursor. Exhausting the following later-author entry returns COMPLETE. Budgets 0/1/2/6 are exercised, with complete concatenated output preserving exact order.
- Cursor context commits event-snapshot hash, basis, generation, configuration, scope and ordered Lens. Actual mutation, move, reversed Lens, scope, generation and configuration changes refuse stale continuation. Snapshot identity includes the full event/configuration/coverage packet, so ordinary context fields are not the only comparison.
- **Ignored masks, omitted later coverage, File-target dedup and filter-before-selection** are actual altered reducers (`candidate.mjs:83–103,136–137,200–216`), not a renamed expected fixture. Each disagrees with the independent expectation in the corresponding test.
- **Missing/extra membership** actually mutates only the candidate index while keeping raw heads and claimed COMPLETE coverage (`228–256`). The reference independently exposes membership mismatch. The missing-member fault removes a visible C entry and also changes selected output. An extra membership can be filtered by its absent raw head and leave selected output unchanged; the membership comparison, not a false claim about result divergence, catches it.
- **Stale swap-delete continuation** truly uses the dense reordered set after removing the first A entry and bypasses context refusal. Concatenating the old first page with this new-state tail disagrees with replay of the current state. It demonstrates a mixed-basis/lost-entry failure; it does not claim that a legitimate same-snapshot ordered cursor uses dense offsets.

## Preconditions and nonclaims to retain at publication

1. Prepared model maps are trusted immutable snapshot inputs except for explicit test faults. A truthful coverage boolean does not prove correct maintenance, and arbitrary mutation of exported model state is not authenticated.
2. `page` assumes a fresh query or a continuation actually issued by the previous page. Context matching and numeric bounds **do not authenticate traversal history**: a fabricated offset at the end can skip entries. Duplicate-author/hostile-query normalization is outside the tested three-author corpus. These are prototype API preconditions, not a universal public-cursor security proof. No production SDK should accept a caller-supplied COMPLETE claim merely because these fields match.
3. The eventual work bound is all relevant authors' live placements plus higher-head probes, not visible files. A heavily masked lower author still has many candidates. Retained masks and lifetime audit/history remain necessary; cold reconstruction still has history/index preparation costs.
4. No onchain live-index writes, stable-order data structure, callback allowance, gas/storage/RPC measurements, authenticated coverage, historical live-set query, or browser integration was built here. The existing B contracts and paid packet remain unchanged and cannot inherit this model's operation counts as gas savings.
5. Scope, Lens policy, File kinds, exact name bytes, acceptance rules and provenance are abstract strings/events here. This does not close the separate cold-name Files vertical or prove Core's whole data model.

## Verdict and handoff

**Approved for the narrow model question:** a maintained current live candidate set can preserve this fixture's selection, ordering and tag semantics while avoiding some lifetime-only scans, provided retained higher heads and honest coverage remain available. A real index experiment may now use this model as a semantic reference, but needs its own implementation, maintenance/cursor/coverage validation and economics.

Critical: none identified. Important: none identified within the approved scope. Minor publication housekeeping: README still says GREEN/review pending; root can append the actual source-pinned outcomes without changing frozen fixtures or implying onchain readiness. No implementation repair or additional test run is requested by this review.
