# Binding reads: runtime constraint and linked-reader checkpoint

**Current status, September 9:** the fixed-library implementation at `d95c358`
deploys under normal limits and passes its assigned matrix and parent regression
run. Independent task review approved; final increment review is underway. This is a synthetic
revision-one trusted-admission host, not authenticated C0 or a finished MVP.
The earlier failed checkpoint below is preserved as dated evidence.

The [design](binding-reads-design.md) and [single implementation task](binding-reads-plan.md)
started from `4ece846`. The partial implementation changes only seven named
source/test paths; retained storage and mutation rules are unchanged. The
worker stopped at the required size gate before expanding the full matrix.
No limit was raised, required getter removed or new dependency introduced.

## Evidence actually obtained

Worker behavioral RED compiled and failed `current head identity`; GREEN
passes the one real candidate-group/ObjectGenesis/BindingSet test, checking
the current head and one history entry. Worker ran the full existing regression
set:161/161 Forge;93/94 Node. The sole Node failure is the new normal-host size
gate. These aggregate runs are worker-reported, not an independent root rerun.

Root read the complete report, verified the immutable exact-seven-path commit,
then independently ran from the Core directory:

```sh
node --test test/binding-reads.test.mjs
```

It reproduced the intended failure before deployment: runtime26,736 exceeds
24,576. The output retains all compiler metadata/source pins and exact sizes:

| Combined BindingReadHarness | Bytes | Standing |
|---|---:|---|
| Runtime template | 26,736 | Exceeds24,576 by2,160 |
| Creation bytecode template | 29,064 | Not full transaction initcode |
| Actual fixture constructor arguments | 3,296 | Exact existing Init shape |
| Full transaction initcode | 32,360 | Below49,152 by16,792 |

Solc0.8.30/Cancun/optimizer200/viaIR, Node26, Forge/Anvil1.7.1 and the existing
AdmissionLibrary link are unchanged. No deployment, getter gas, canonical
retained-state comparison or new-host cleanup evidence is claimed. The large
Forge test's aggregate gas is not a normal transaction budget. Build warnings
include pre-existing diagnostics and new checked-narrowing lints; output is
not labeled pristine.

## What this taught us and the original next measured step

The18,664-byte predecessor already included raw inventory/inspection ports
and trusted publication. Its remaining headroom was not a final Core budget.
Adding Binding exposed that distinction early. A source module or abstract
base alone is not a bytecode-size boundary.

Next compare three otherwise unchanged compiled surfaces: the full oracle
host, a raw-free trusted host retaining all eleven implemented read forwards,
and a read-only sizing shell. Preserve exact constructor/dependency checks,
ABI outputs and compiler settings; separate creation from constructor bytes.
The latter two are **sizing inputs only**, not permission to remove required
Core reads or replace independent state evidence with submitted intent.

Only after those measurements may a layout refinement be selected. The
existing V2 deployment frame has four fixed components and only AdmissionLibrary
link windows. A new linked read module cannot silently enter that representation.
Its trust, source/runtime pins, deployment codec and static-consumer behavior
require explicit additional design and evidence. The size failure alone did
not select a new layout; the subsequent bounded comparison is recorded below.

## Completed compile-only comparison and selected refinement

At immutable source `ae9367d`, the original worker compiled source-identical
full-oracle, raw-free trusted and read-only shells. Root read the full report
and analyzer, then reran the analyzer: all eleven required ABI shapes and
forwarding bodies match; constructor and surface-inventory assertions pass.

| Shell | Runtime bytes | Full fixture initcode bytes |
|---|---:|---:|
| Full oracle control | 26,736 | 32,360 |
| Raw-free trusted | 23,855 | 29,478 |
| Read-only | 21,458 | 27,060 |

All use the same compiler/settings and 3,296 constructor-argument bytes.
These are compile-only bounds, not deployments or authenticated Core budgets.
Omitting raw inspection ports would save 2,881 bytes but remove the independent
oracle surface from this host; neither smaller shell implements authority.

A final worker-only compile comparison removed history association decoding,
then also historical head association revalidation. Full-host runtimes were
26,713 and 26,115 bytes respectively (23/621 bytes saved). Exact ABI parity
passed in the retained analyzer; root read the complete report, but did not
rerun these candidate compilations. Those candidates deliberately change
synthetic-corruption refusal semantics and still exceed the normal cap.
Neither is selected and neither changed tracked implementation source.

Selected next: [two fixed read libraries](read-library-layout.md), retaining
the stronger specified reads, all eleven host ABIs and the sole existing
writer. This requires explicit new dependency/code-pin/deployment evidence
and a separately versioned actual C0 profile. A read-only source review found
no simpler established alternative and emphasized delegatecall privilege,
compiler-generated storage references, flat links and independently expected
runtime hashes. Those qualifications are included in the specification.
Implementation, deployment and the remaining Binding matrix are still pending.

Retrospective: measure executable component boundaries before accumulating
another large read family. Source-level factoring alone does not create a
deployable boundary. Measure every new library as well as Core; do not move
an oversized artifact out of one file and call the size constraint solved.

## Remaining task and owner followups

The task is still open. After resolving the measured layout boundary, finish
all transition/H/input/corruption/large-history cases in the plan; deploy under
normal limits; compare every field at pinned source blocks using the independent
reader; measure gas/returndata; rerun regressions; close task and whole-increment
reviews. One passing Binding scenario cannot replace that evidence.

No owner answer is needed for the current reversible diagnosis. No main merge,
public deployment, production repository, durable data or protocol freeze is
authorized or implied. Shared pages/Scope, actual initializer/authority and
Files/SDK/static-SPA integration remain the subsequent joined-MVP work.

## September 9: linked implementation and actual managed reads

The selected [fixed library boundary](read-library-layout.md) is implemented
at `d95c358ab2eee3ee1e26c52cedc54f04134a0d4b`, resuming the original task from
`4ece846` through partial `ae9367d`. All eleven public read shapes remain.
The exclusive admission writer, Store, Type/identity bytes and authority are
unchanged. Both read libraries are fixed, runtime-pinned trusted DELEGATECALL
dependencies; external-view does not make them a security sandbox.

The assigned matrix now covers actual SET/replace/tombstone/withdraw/rebind,
stale versus current withdrawal, first tombstone, Record/Occurrence targets,
full-width Principal isolation and all retained historical H cuts. Unchanged
`readState` and `foldAdmissions` independently reconstruct every head field
and history entry from retained source state. No expected answer comes from
the new read methods or submitted intent alone. Sixty-five real revisions
exercise the full 64-entry partial page and terminal continuation.

Synthetic corruptions additionally exercise packed heads/postings, Record and
occurrence joins, exact kernel Types/bodies, predecessors and withdrawal
association. A synthetic `2^31`-entry conceptual posting list observes exactly
35 search/boundary SLOADs, within48; this is not billions of real admissions.
Exact-Type rejection occurs before even loading body length. Ordinary read
transactions and a separately deployed STATICCALL consumer leave all retained
state unchanged; unavailable PreparationHelper does not affect reads.

Two new behavioral REDs found and corrected read-side defects: history-input
validation order after initialization, and a later-ordinal predecessor on a
withdrawal-only history page. The original size RED and already-dirty fixes
were not relabeled as freshly observed behavioral REDs. Compiler warnings
remain visible; this is not a warning-free build.

### Measured resource envelope

Worker measurements, with exact compiler, input, runtime, link/immutable and
source-block pins, are retained in [the machine-readable evidence](binding-reads-evidence-20260909.json).
These are actual normally deployed component/read transactions, not Forge
fixture aggregate gas. Node26, Forge/Anvil1.7.1, Solc0.8.30/Cancun/optimizer200/
viaIR; runtime24,576, full initcode49,152 and transaction gas16,777,216 caps
remain unchanged.

| Component | Runtime bytes | Full initcode bytes | Deployment gas |
| --- | ---: | ---: | ---: |
| BindingReadHarness | 10,738 | 16,649 | 3,236,061 |
| PointReadLibrary | 12,103 | 12,133 | 2,670,670 |
| QueryReadLibrary | 10,231 | 10,261 | 2,265,765 |
| Unchanged PreparationHelper | 18,805 | 18,831 | 4,120,023 |
| Unchanged AdmissionLibrary | 24,503 | 24,535 | 5,351,899 |

| Read | Actual transaction gas | Returndata bytes |
| --- | ---: | ---: |
| Current head | 51,823 | 288 |
| Historical head at H4 | 149,351 | 288 |
| Complete five-entry history | 548,097 | 1,088 |
| Partial one-entry history | 144,252 | 320 |
| Partial 64-entry history of65 | 6,377,148 | 12,416 |

History return size is `128 + 192N`. The host has substantial runtime headroom,
but its unchanged AdmissionLibrary has only73 bytes. Do not conflate this
standalone compiler artifact with the separate populated-upgrade fixture's
24,533-byte admission artifact/43-byte headroom. Both remain tight. Required
pages, authority, actual initialization and wider consumer workloads must be
measured on their joined compiled boundaries.

### Verification and review record

Worker: focused Binding14/14, complete Core Forge181/181, Node94/94 covering
Core, admission integration and Type-input checks; format/diff checks pass.
Parent independently rebuilt the complete Core AST/build-info with `--force`
and the cached exact compiler, then ran Core Forge:181 passed,0 failed,0 skipped.
Parent's broader serial Node run passed177/177,0 failed/cancelled/skipped, in
73.39s. It includes all Core Node tests, independent admission integration,
Type-input comparisons, upgrade-foundation Node tests and Files lifecycle/
performance tests. Binding measurements reproduced the table above; populated
upgrade/lifecycle readback retained50 operations/40 verified checkpoints. Their
full-inventory diagnostic1337 RPC calls remain distinct from folder browsing.
Evidence-export flags were0; no historical measurement files were overwritten.
Parent also ran the separate upgrade-foundation Forge suite:14/14 passed,
0 failed/0 skipped. Its fixture aggregate gas is not the operation-cost table.

Reproduce with the cached exact Solc0.8.30 path supplied to Forge `--use`:

```sh
# From this Core directory:
forge build --ast --build-info --force --offline --use <cached-solc-0.8.30>
forge test --offline --use <cached-solc-0.8.30>
# From the planning worktree root:
EFS_FILES_PERF_EVIDENCE=0 EFS_FILES_PERF_OPTIMIZED=0 EFS_UPGRADE_EVIDENCE=0 \
node --test --test-concurrency=1 \
  Reviews/2026-09-05-c0-core/test/*.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/*.test.mjs \
  Reviews/2026-09-09-files-parity-performance/*.test.mjs \
  Reviews/2026-09-05-c0-admission/integration.test.mjs \
  Reviews/2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

The independent task reviewer examined the complete nine-path source change
from original pretask `4ece846` through `d95c358`, not only the latest incremental
diff. Verdict: spec compliant and approved, no Critical/Important finding.
Its one Minor item is scoped safety explanations for narrowing lint notices.
Keep this as cleanup before product extraction; don't alter validated runtime
metadata merely to hide warnings or imply the output is pristine. Final
whole-increment review is pending at this editing checkpoint.

### Retrospective and remaining work

The fixed split resolves the measured oversized host without removing required
reads, at the cost of two additional trusted deployments and per-family guards.
If the chosen packaging proves unsuitable, change the disposable read/deployment
layout and repeat joined costs; no application identity or durable data must be
rewritten. The [explicit V3 specification](dependency-deployment-v3.md) describes
the six-component successor needed for actual authenticated C0; it is not
implemented V3 codec/constructor/seal evidence. V1/V2 controls remain unchanged.

Preserve the earlier page-design ruling: a historical unique-prefix predicate
with separately counted boundary-only reads, rather than new cursor storage.
If it fails actual storage/gas testing, rework the page accounting and tests;
the finite model is not deployment evidence. The [next directory task handoff](../2026-09-09-v1-parity-overnight/directory-read-next.md)
tests that boundary plus lifetime distinct-name churn before browser polish.
These are reversible engineering rulings, not owner-ratified permanent choices.

No owner decision is required for that next local experiment. Still missing:
ordinary bounded pages/Scope, actual Lens/Files/SDK/SPA join, authenticated
initialization and remaining v1 features. This checkpoint does not validate
post-upgrade revision selection or establish complete v1 parity.
