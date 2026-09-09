# Next executable directory-read checkpoint

**Status:** implementation handoff for the already-selected read surface;
not implemented pages, a new public ABI or a second directory model.

**Start only after the Binding task's tests and review close.** Reuse its
checked Store/posting/occurrence primitives and fixed read-library boundary.
The authority is [read-overlay.md](../2026-09-05-c0-core/read-overlay.md),
[B0 INDEX §5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md#5-the-page-result-abi-every-enumeration)
and [Files Scope semantics](../../Designs/efsv2/hierarchical-files-and-folders.md#5-complete-directory-enumeration-bindingscope).
Write a task-sized implementation plan from these interfaces before coding;
this handoff identifies the user-facing proof and its likely falsifier.

## Build the discovery prerequisite, then resolve it

The first useful result is a contract-readable bounded page of actual
BindingScope anchors. Use `pagePostings` / `pagePostingsHydrated` and their
existing request/result/cursor grammar, not a convenience endpoint exposing
an unrelated private array. Keep the exact classifier and raw/hydrated mode
distinctions from the read overlay. Explicitly mark every unfinished family
unsupported in the experimental facade; do not advertise an all-enabled
capability manifest until all eighteen obligations exist.

A Scope anchor establishes that a position was first asserted, **not its
current name or value**. Recover its role from the original kernel body, read
the current/historical Binding at the same H, validate the selected Files
claim, then apply the namespace Plan. Do not display old anchor targets after
a rename, rebind or withdrawal. The authoritative source remains one Store.

Keep the initial revision-one host separate from the populated-upgrade host.
The consumer join must add actual revision-at-H qualification from retained
activation history; returning the initial revision for every H cannot certify
post-upgrade observations. Preserve `acceptedUnder` versus `observedWith`.

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
7. A malformed retained anchor/current target remains an unresolved row;
   neither disappearance nor a lower-Lens winner may conceal it.
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
