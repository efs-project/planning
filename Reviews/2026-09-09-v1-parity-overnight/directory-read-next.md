# Next executable directory-read checkpoint

**Status:** consumer handoff for the already-selected read surface. The
[raw/hydrated audit-page prerequisite](../2026-09-05-c0-core/audit-pages-verification.md)
is implemented at `ae99e1a`; current Files resolution and upgrade-aware reads
remain next. Not a new public ABI or a second directory model.

The Binding task's tests and review are closed. Reuse its
checked Store/posting/occurrence primitives and fixed read-library boundary.
The authority is [read-overlay.md](../2026-09-05-c0-core/read-overlay.md),
[B0 INDEX §5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md#5-the-page-result-abi-every-enumeration)
and [Files Scope semantics](../../Designs/efsv2/hierarchical-files-and-folders.md#5-complete-directory-enumeration-bindingscope).
Write a task-sized implementation plan from these interfaces before coding;
this handoff identifies the user-facing proof and its likely falsifier.

The [real-store B0 point checkpoint](../2026-09-05-c0-core/lens-point-verification.md)
is implemented at `29859b2` and task-reviewed, with fresh integration checks
tracked there. It supplies the existing generic combiners, not Files
interpretation or upgraded reads. Keep those completion claims separate.

## Build the discovery prerequisite, then resolve it

The first useful result is a contract-readable bounded page of actual
BindingScope anchors. Use `pagePostings` / `pagePostingsHydrated` and their
existing request/result/cursor grammar, not a convenience endpoint exposing
an unrelated private array. Keep the exact classifier and raw/hydrated mode
distinctions from the read overlay. Explicitly mark every unfinished family
unsupported in the experimental facade; do not advertise an all-enabled
capability manifest until all eighteen obligations exist.

A Scope anchor establishes that a position was first asserted, **not its
current name or value**. Recover its role from the original kernel body,
resolve that position under the namespace Plan at the same basis, then validate
the selected Files claim. Do not display old anchor targets after
a rename, rebind or withdrawal. The authoritative source remains one Store.

Keep the initial revision-one host separate from the populated-upgrade host.
The consumer join must add actual revision-at-H qualification from retained
activation history; returning the initial revision for every H cannot certify
post-upgrade observations. Preserve `acceptedUnder` versus `observedWith`.

### Concrete upgrade-join checks from the current source

The September 9 source pass identified three specific seams, not a reason to
reopen the data model:

- `StateReadPrimitives.basis` currently returns `initialRevisionId`, and
  `StatePointReads.getReceipt` has a revision-one-only accepting-batch policy.
  Merely attaching these read forwards to the upgrade proxy would not produce
  truthful upgraded receipts. Preserve the revision-one control; test an
  explicit historical policy against the existing independent upgrade reader.
- The upgrade fixture's execution commitment currently names its helper and
  admission library, not the two new read libraries. The next joined fixture
  must source-pin their exact linked runtimes and qualify them in its observed
  execution evidence. A correct proxy-shell hash does not cover delegated
  read code, and an observed hash is not an independently expected hash.
- `activationAdmissionHigh` may repeat across upgrades with no intervening
  admissions. Test U1 data at H, U2 activation at that same H, and a second
  activation without new data, including an old cursor and an old receipt.
  Pin the source block/execution observation as well as H. Make the selected
  page-basis rule explicit and check B0's same-H/different-realmBasis cursor
  refusal. Do not infer original acceptance from the latest implementation or
  silently reinterpret the cursor because the admission count did not change.

These are bounded next-increment obligations. They change neither the current
audit-page task nor the older upgrade evidence, and do not establish a new
permanent Realm revision or deployment format.

## Discriminating fixtures

1. A truly empty supported scope produces initial COMPLETE with no anchors.
2. First bind and first tombstone each create one anchor; later same-role
   rebind/tombstone/withdrawal creates none. Failed CAS creates none.
3. Two full-width Principals with identical low address bits remain isolated.
4. Start at H, then add a new name and withdraw an old producer; continuation
   at H reproduces the original prefix and lifecycle. Fresh H sees the changes.
5. Corrupt mode/version/reserved/context/end/position/basis tokens refuse;
   raw tokens cannot become hydrated tokens. Unsupported-query precedence
   remains distinct from invalid requested-basis handling.
6. A resumed terminal suffix does not erase earlier observed anchors or prove
   the whole scope empty. Client completeness requires the entire chain.
7. An unreadable anchor leaves enumeration coverage unresolved; a malformed
   selected target leaves its row unresolved. Neither disappearance nor a
   lower-Lens winner may conceal that selected failure. Losing values cannot
   override an independently proven higher-tier point answer.
8. All three public Lens modes agree between a deployed Solidity consumer and
   the SDK at the same basis before a browser claims the row is usable.

Use actual admissions for the small lifecycle. Label sparse synthetic packed
stores separately when testing enormous bounds or hostile corruption; they
do not prove that billions of records were admitted. The independent oracle
reads retained state; it must not call the getter under test to make expected
answers. Measure full linked host/libraries, not only a Forge test contract.

## Performance questions to settle before polishing the UI

- Dense directories: measure 1/8/64/256 live roles, the selected raw/hydrated
  page sizes, exact returned bytes, cold/warm gas and RPC count to usable rows.
- Same-name churn versus distinct-name churn: the former must keep one anchor;
  the latter deliberately grows the audit inventory. Measure both.
- Retain the existing 10,240 dead-role + 63 live-role falsifier. Core's raw
  Scope pages still contain audit anchors; it is the **resolved Files** layer
  that may show ten empty partial windows. Do not call raw pages empty or
  equate scan coverage with current visible file count.
- Record boundary probes separately from charged consumed postings. The
  Binding head's 48-probe law is not automatically a proof for a general
  posting list with a wider physical count.
- Neither `maxItems` nor bounded return bytes alone controls dead-item scan
  gas. Refuse or qualify an exhausted call honestly; do not manufacture a
  successful partial result after an EVM failure.
- Compare the joined SDK with the [ninety-request browser control](browser-latency.md).
  Reuse verified evidence within its exact context and keep concurrency
  bounded; no cross-basis cache or unverified shortcut may win the benchmark.

The likely design pressure is lifetime distinct-name churn: a nearly empty
folder can have a large audit history. Bounded/eventually complete is not
answer-proportional or necessarily pleasant. If measured user journeys are
poor, return the concrete tradeoff between write/index cost and read cost.
Optional validated snapshots may accelerate views, but cannot silently replace
the current per-name authority or prove completeness from unverified hints.

## Concrete consumer dataflow and replay control

A fresh offline replay of the unchanged [optimized lifecycle evidence](../2026-09-09-files-parity-performance/optimized.json)
passed `verifyUpgradeState` on September 9. Its original source is
`41276dc9cd06842d2ffc275f6d07f3379f393bbe`; file keccak is
`f0bb38f17713e8d83ff51868de2862e1da404712a838fae0c8e116131f6edd4c`.
This reuses retained evidence, not a new transaction run or Files certification.

| Terminal directory | Retained name anchors | Current heads | Rows a single-author Files view should show |
| --- | ---: | --- | --- |
| U1 root | 2, ordinals 16/21 | note.txt retracted at 28; field-notes.txt masked at 27 | 0 |
| U1 destination | 1, ordinal 25 | field-notes.txt Entry at 25 | 1 |
| U2 root | 2, ordinals 61/66 | note.txt retracted at 73; field-notes.txt masked at 72 | 0 |
| U2 destination | 1, ordinal 70 | field-notes.txt Entry at 70 | 1 |

Both root anchors originally selected Entries. Rendering their original targets
would resurrect two moved/retracted names in each root. This supplies a small,
actual retained-state regression before the large churn experiment. The row
column is a specification expectation, not an already implemented Files resolver.

The consumer's shared-reader operation should keep this dependency order:

1. Validate the exact view/Mount/Plan context and pin source block/execution/H.
2. Fetch bounded Scope pages for each unique Plan Principal. Hydrated pages
   identify anchor RecordIds but still do **not** contain Binding bodies or names.
3. Fetch/check each anchor Record and recover purpose/subject/role. Check that
   the anchor belongs to the requested Principal/scope. Union positions, not
   labels supplied by competing authors; dedupe only exact positions.
4. Resolve each position under the Plan. Fetch/check a selected Entry/Whiteout
   only after selection, and validate the exact parent, canonical name/role,
   child meaning/historical charter and Mount requirements before enabling
   file actions.
   Inspection of losing evidence is separate from choosing the displayed row.
5. Keep Scope-chain coverage separate from row interpretation, child metadata,
   bytes and tag-filter coverage. One failed child does not erase other rows or
   turn a terminal enumeration into proof that all rows are usable. Unresolved
   positions remain visible without claimant-selected presentation.
6. Seal the aggregate's pinned observation; preserve each raw page/cursor and
   per-row evidence. Sorting incomplete discoveries is local presentation only,
   not proof that this is the globally first alphabetical page.

Historical charter validity and current maintenance are also separate. A
withdrawn/rebound publisher charter does not erase the File Object. Use an
exact historical charter witness/read when needed and report the current
maintenance grade independently; a first tombstone with no prior matching
charter is insufficient. If historical proof cannot be obtained within budget,
qualify that row as unresolved rather than hiding it or declaring the node
invalid merely because its publisher stopped maintaining it.

This ordering preserves point-lookup equivalence: an unrelated malformed
lower-tier value must not override a valid higher-tier selected value. An
unreadable Scope anchor can still make *enumeration coverage* unknown; it is
not license to change an independently proven point answer. Test both axes.

At eight unique anchors, one hydrated page is not one RPC to usable rows:
anchor bodies, selected values and child/profile checks remain dependencies.
Count the actual DAG and use scope-local exact-Record deduplication plus an
ordered, bounded hydration pool. Do not compare page-only gas/latency with the
old browser's fully interpreted rows. Give rows stable position keys so sorted
partial discoveries and asynchronous updates cannot move focus to a different
file. If Load more disappears, restore focus deliberately without stealing it
from a user who already moved elsewhere; expose Why-this-result on phones.
