# Throwaway live-placement algorithm model

**CLOSED — root-observed GREEN 13/13; independently SpecCompliant / QualityApproved.** This is a bounded dependency-free Node model, not a contract index or gas benchmark. It retains lifetime replay as an independent reference. The [evidence ledger](evidence/README.md) links the immutable RED/GREEN reports, source snapshots, bounded runner, and full independent review.

From this directory, root may run:

```
node --check reference.mjs
node --check fixtures.mjs
node --check candidate.mjs
node --check model.test.mjs
node --max-old-space-size=128 --test --test-isolation=none --test-reporter=tap model.test.mjs
```

Preserved RED evidence: all four syntax checks passed; root observed 4/13 tests passing and 9 failing with the empty-result stub. The hand-pinned H9/L6/U4/S3 reference passed; the candidate returned `[]` instead of the three explicit authored tuples. Reference, fixtures and tests are unchanged for GREEN.

Actual root GREEN ran on Node v26.0.0 at 12:43:46.164–12:43:46.436 UTC on September 14, 2026: four syntax checks passed, 13 tests passed, 0 failed, 0 skipped, exit 0. The independent review approved this bounded representation experiment with no scoped Critical/Important findings. Only candidate source changed between RED and GREEN; its SHA-256 is `452703b70608ef53294a9f1ad4172b299f2798c71996b73d1bbbbeaecc77605e`.

The candidate applies each ordered effect to a dense live array/slot map, retaining raw tombstone heads separately. It then copies and sorts current membership by first-binding ordinal during explicit snapshot preparation. Preparation reports effects, logical membership updates, copied entries, sort comparisons and serialized snapshot bytes. This is not a claim that an onchain index maintains order cheaply. All queries consume the prepared view; pages do no query-time global materialization or sorting. Snapshot identity includes the event/configuration/coverage packet, in addition to admission/generation/Lens/scope cursor fields. Fault modes execute the named faulty reducer or actual index mutation; the stale-cursor fault uses dense swap-delete order and bypasses snapshot checks.

The model input cap is 1,024 events; the deterministic fixtures stay far below it. No optional 10,000-name fixture is included: the explicit 2→4 lifetime-name churn and H9/L6/U4/S3 case suffice to establish the narrow representation question without a scale campaign.

Placement identity is `(scope,name)`, not File target. Full authored tuples include revision/admission/first-binding ordinal. Snapshot reads cover every Lens author; stale continuations must reject. The model has no historical-query guarantee. All arrays are current-snapshot data; sorting/index preparation counters are distinct from read counters.

**Preconditions:** queries use an honestly maintained, frozen prepared snapshot and either a fresh request or a continuation actually issued by the preceding page. Exported maps are not authenticated against arbitrary mutation. Cursor context pinning does **not** authenticate traversal history or a forged offset: a fabricated end offset can skip entries. Coverage booleans likewise do not prove arbitrary index correctness. This is not a production public-cursor security result; duplicate-author/hostile-query normalization is outside the tested three-author corpus.

Candidate interface for the experiment: `prepare(events, options)`, `union(model, query)`, `page(model, query, candidateBudget, cursor)`, `tagged(model, query)`, and test-only `inspectMembership`/`withFault`. Preparation counters track effects, membership updates and sorting. Union counters charge all membership materialization, dedup checks, Core-like head probes and any sorting. Streaming charges candidate visits and higher-head probes, with no query-time sorting/union hidden behind its budget. Coverage checks are separate. These counters are heterogeneous logical operations, not equal gas units or storage-byte measurements.

Fault injection is test-only and alters the named reducer or membership. Extra membership need not alter selected results (a raw absent head may filter it); the independent membership comparison catches that corruption explicitly. Some negative assertions also passed with the empty RED stub; only GREEN's positive controls plus inspection of the genuine fault paths establish their intended meaning.

Selection and tag semantics follow the current disposable Files/Lens model. File HEAD masks do not become verified Files merely through File tags. Stable author/first-binding order is required here. An eventual onchain ordered index's updates, callback budget, storage and economics remain unimplemented and unpriced.
