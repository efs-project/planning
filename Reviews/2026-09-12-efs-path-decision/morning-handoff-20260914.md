# Morning handoff: build toward compact EFS

September 14. Coordinator synthesis for James. Disposable evidence, not a
mainnet freeze, approval to waive features, or production-repository creation.
Final evidence/publication checkpoint is linked from the review README.

**Overnight run closed at 08:29 Chicago.** The recurring task was deleted after
the bounded work finished; no compiler/chain worker or new experiment is queued.
Final compact source passed 169 Solidity test executions (135 distinct cases)
and normal contract sizes, with independent review. Fable was quota-blocked;
the remaining work was completed by Codex and its scoped internal specialists.

## Recommendation

**Continue with compact EFS (B), not three competing implementations.** It is
now the best-supported candidate for the next reversible MVP implementation.
Keep MUD as a comparison/fallback and fuller v2 as a semantic reference. The
matched test did not show that adding our required selection and discovery on
top of MUD makes the complete workload cheaper. This is a result about the
tested adapters/workloads, not a claim that EFS universally beats MUD.

The important improvement is not simply a lower gas number: real File identity,
checked revision parents, independent authors, Lenses, explicit tag subjects,
rename/move, reused paths, removal masks and restore now work together in a
small tested contract fixture. We also found and fixed integration defects
that isolated primitive tests had missed. That is useful pre-build work.

## Actual small-Files economics

| Action | Receipt gas |
| --- | ---: |
| Create File + initial revision + HEAD + hashed-name placement | 1,289,277 |
| Signed fresh revision + HEAD change | 708,640 |
| Contract-authored competing fresh revision + HEAD | 777,820 |
| Standalone File/revision tag | 523,544–523,569 |
| Checked paid point read | 197,363–204,877 |
| Checked one-entry folder / selected-tag read | 269,336–284,384 |

The sole actual run has 24 transactions; setup/deployment 13,731,683 gas is
separate. These are local gas receipts, not current Ethereum/L2 dollar quotes.
The tiny 17-byte revisions and hashed placement do not price the full browser,
cold filename recovery, large parents, every lifecycle action or storage growth.
The old approximately 5.06M fuller create uses a different recipe: its difference
from 1.29M is not a feature-normalized saving. We have not proved an unavoidable
minimum overhead or a sensible per-swap/per-game-tick cost.

Exact [[files-paid-results-20260914|Files prices and independent evidence]] are
separate from the [[b-parity-paid-results-20260913|matched B/MUD Quote slice]]
and [[required-query-paid-results-20260914|required-query cost challenge]].

## What changed because we tested it

- **Withdrawal is not deletion or invalidity.** The reader wrongly rejected a
  retained selected revision when its active occurrence count reached zero;
  another author's reuse then made it visible again. The reviewed correction
  removes that false integrity condition and preserves HEAD, tags, history,
  provenance and all other validation. It does not change Core lifecycle rules.
- **Signed query promises cannot hide behind mutable settings.** The index
  admin could previously downgrade required coverage behind an unchanged
  address/codehash while a signature waited. The reviewed direct-deployment
  repair freezes required declarations at construction. Real module replacement
  requires a new signature; ordinary optional progress does not. Actual index
  coverage remains a separate read condition, not something a hash proves.
- **Listing need not inherently mean scanning all old names.** The finite
  live-placement model has actual RED/GREEN evidence with unchanged independent
  expectations. It maintains live candidates while retaining higher-author
  masks and history. Independent review and retained source/evidence are
  complete: [[live-placement-model-results-20260914|13/13 model tests]]. Its
  onchain implementation and cost remain open. Its bound is live placements
  across all selected authors, not visible file count.
- **Cold filenames need real retained bytes.** The paid graph had only name
  hashes. A new ordinary Name Type plus required callback now rejects missing
  names atomically and recovers exact bytes without a Core dictionary. Seven
  focused cases pass, including last-occurrence withdrawal and a review-found
  forged-admission response that now rejects. See the
  [[files-name-retention-results-20260914|named Files profile result]]. This
  closes a contract-side dependency, not the browser connection or its price.
- **A cheaper representation is not automatically the right default.** The
  signed-claim archive comparison kept packed storage: code storage helped the
  large vector and reads but lost the predeclared small-write gate. No additional
  architecture was adopted just to claim an optimization.

## The next concrete build step

**Connect compact B to a cold, small, useful Files journey.** The SDK and
Explorer PMs agree: recover exact filename bytes from declared public data,
then open a real revision with its selection provenance. Missing/corrupt names
must not erase known membership. Exercise Lens switches, File-versus-revision
tags, removal masks and restore, followed by canonical write reconciliation.
See [[sdk-explorer-build-boundary-20260914|the bounded product/API handoff]].

The tested ordinary Name profile provides the direct lookup: its pinned Type
and raw-hash role derive the Record ID. The paid Files run predates this profile
and did not publish those names. Start by mounting one explicit folder ID as
`/`; do not pretend its identifier proves nested ancestry. The new profile uses
an explicit narrow ASCII grammar, not final Unicode/path policy. The complete
cold browser adapter and a separately priced named write are the next gate.
No privileged Core filename noun has been demonstrated necessary.

The existing clickable browser is **not yet demonstrated B-backed**. Do not
spend another round polishing it while silently feeding names from test data.
First connect the real adapter and test the cold read/write path. A separate
live index is the next performance experiment, preserving audit/history and
charging its write/storage/preparation costs. Neither requires reopening the
completed three-way architecture comparison.

## What remains before permanent foundation claims

Native-contract historical authorship/source-state proof, identity recovery and
delegation, populated compact-testnet upgrades, private/encrypted/carrier failure
integration, larger schema/resource boundaries, and realistic scale still need
their named evidence. Label those limits; do not silently remove the goals or
hold all reversible product work hostage to perfect century-scale proofs.

No new James decision is needed to run the next disposable cold-Files vertical.
Choosing permanent authority, upgrade/immutability and supported guarantee
boundaries remains human-gated. The present recommendation authorizes no such
choice on James's behalf.
