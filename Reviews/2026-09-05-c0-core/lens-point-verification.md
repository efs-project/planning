# Real-store Lens resolution: implementation and cost checkpoint

**Status:** source `29859b2` passes independent task review and fresh parent
integration regression; final whole-increment review is pending. Disposable revision-one host,
not authenticated C0, upgraded reads, a finished Files browser or v1 parity.

## What now executes

Ordinary admitted ResolutionPlan Records select checked current Binding heads
from the existing Store. EXACT requires all named sources to agree; PRIORITY
selects the first complete agreeing tier; THRESHOLD requires the declared
number of agreeing sources and reports conflict if multiple targets qualify.
Target equality includes Record versus Occurrence and the exact leaf. Full
32-byte Principals remain distinct even when their low160 bits match.

The [selected plan](lens-point-plan.md) adds no registration Store, writer or
linked dependency. Fixed QueryReadLibrary remains link-free and supplies the
four B0 methods through the derived LensReadHarness. The original Binding and
audit methods retain their ABI. Missing/substituted Query code refuses before
state access; Preparation is not called by the read path. The candidate exact
Plan Type is recomputed from the unchanged artifact, not selected by callers.

Generic Binding tombstones are absent to the Lens. A Files whiteout is instead
a selected Record interpreted by the Files layer. A selected invalid Files
claim cannot silently fall through to a different claimant. Raw Scope anchors
still need the [separate consumer join](../2026-09-09-v1-parity-overnight/directory-read-next.md).

This B0 host uses its proposal-stage result enum and current executing basis.
The [C0 result law](../../Designs/efsv2/disposable-mvp-profile.md#6-canonical-point-result-law)
still requires separately qualified support, validation, coverage and authority.
These measured ABI tuples are not automatically the production SDK interface.

## Evidence and review

The implementer ran200 distinct Core Forge tests and102 serial
Core/admission/type-input Node tests passing, including7 new Lens Node tests
and24 real-admission measurement scenarios. Parent's fresh forced build,
Core200/200 plus upgrade14/14 Forge runs and broader185/185 serial Node tests
also pass, with no failures or skips. The broader set includes Core,
admission/type inputs, upgrade and Files lifecycle/comparison/gate tests. All
saved-evidence export flags were disabled. Parent reproduced all24 outcomes,
fixed response sizes, separate transaction gas and marginal consumer gas
exactly; ephemeral block hashes differ normally.
Ten new Forge tests cover all13
parser reject codes and precedence, T1–T10 semantics, hostile retained state,
guard ordering and no-write behavior. Parent review/verification is recorded
here rather than inferred from those reports.

Independent task review approves spec compliance and quality, with no
Critical/Important findings. It checked the unchanged point/head/basis and
deployment-provenance dependencies as named risks without rerunning the suite.
Its one nonblocking note is six intentional test-only cast diagnostics; they
remain visible and explained below. No production source fix was requested.

The independent JavaScript oracle reparses exact body bytes and reverifies the
retained snapshot through the original reader. It does not use the getter under
test as expected truth. Every result field matches at one pinned block. Missing
required/high-priority coverage remains UNKNOWN; an unconsulted lower tier
cannot disturb a valid priority winner. Retained inventories agree before and
after ordinary read transactions and deployed static-consumer calls.

A normally deployed consumer stores an admin-approved Plan and purpose/scope;
its action takes no caller-selected Plan. An attacker's self-approving Plan may
resolve FOUND as data but cannot authorize the consumer. Wrong scope, target
class, non-FOUND state and unauthorized Plan replacement refuse. Trusted test
publication does not prove real Principal authentication or session authority.

The retained [measurement report](lens-point-evidence-20260909.json) contains
source/compiler/input pins, normal deployment/link/immutable observations and
all24 rows. It is an observation record, not an embedded full Store snapshot,
public-chain deployment or exhaustive worst-case proof. Original controls are
unchanged. Each managed chain is closed by the existing runner.
Parent recomputed all62 compiler-source entries across the recorded component
metadata against current disk before retaining this separately named report.

## Actual resources

Solc0.8.30, Cancun, optimizer200/viaIR. Runtime24,576 bytes, full initcode49,152
bytes and actual transaction16,777,216 gas remain unchanged hard limits.

| Component | Runtime bytes | Full initcode bytes | Deployment gas |
| --- | ---: | ---: | ---: |
| LensReadHarness | 14,010 | 19,921 | 3,943,579 |
| QueryReadLibrary | 19,181 | 19,211 | 4,200,956 |
| PointReadLibrary | 12,103 | 12,133 | 2,670,670 |
| AdmissionLibrary, unchanged revision-one fixture | 24,503 | 24,535 | 5,351,899 |
| PreparationHelper, unchanged | 18,805 | 18,831 | 4,120,023 |
| StaticLensConsumer | 1,477 | 1,503 | 372,682 |
| AdminPinnedLensGate | 1,889 | 2,142 | 462,591 |

Host constructor arguments occupy3,360 bytes, included above. Query has5,395
runtime bytes spare; the unchanged admission library has only73. That is not a
promise the remaining authenticated/upgrade/Files joins fit. The separate
upgrade fixture has different admission code and must retain its own size pins.

Resolve returns448 bytes, resolveStrict544 and validatePlan64. Setup is
separate: the first two Type-group admissions cost10,229,885/6,498,467 gas;
the largest N64 Plan publication costs3,874,365. The table below measures
actual single resolve transactions, not setup or paid-chain fees.

| Sources | EXACT agreement | Priority first | Priority last | Priority absent | Threshold two groups |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 92,377 | 92,361 | 92,361 | 91,411 | 93,083 (FOUND) |
| 8 | 221,967 | 150,470 | 221,207 | 220,254 | 237,437 |
| 32 | 726,633 | 407,274 | 723,281 | 722,317 | 888,252 |
| 64 | 1,544,897 | 890,244 | 1,538,089 | 1,537,110 | 2,127,621 |

One source cannot produce two qualifying groups; that boundary returns FOUND,
not a pretend conflict. All other two-group rows return CONFLICT. Threshold
winner rows, strict/validation costs and individual setup receipts are in JSON.

## What the measurements change

The [older B0 arithmetic](../2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md#9-gas-budget-arithmetic--1--8--32--64)
estimated551.1k cold and31.1k warm at64. It was explicitly a schedule model,
not a full checked implementation. Do not use its96.72% remaining-budget or
five-resolve estimates as current MVP capacity claims. Actual N64 threshold
resolution uses2.128m transaction gas, about12.7% of the unchanged cap.

The same deployed consumer measures marginal first/second STATICCALL work of
2,109,822/1,560,786 gas for that case, and3,696,838 gas for the entire two-call
transaction. Warm storage helps, but repeated parsing/checks and combination
remain expensive. Marginal deltas include call/ABI handling; they are not
transaction totals. The implementation contains bounded quadratic duplicate
checking and threshold grouping at N<=64. Checked Record identity, basis and
head validation also add work absent from the old storage-only model; these
observations do not isolate the exact cost of each component.

No limit or validation was weakened. The next useful optimization experiment
can compare semantics-preserving parser/grouping or immutable Plan-body
loading after this source baseline is retained. It must preserve all reject
precedence, exact targets and malicious-state controls and measure the complete
normal host. Do not silently adopt a code-carrier, cache, smaller source cap or
new deployment dependency. Offchain readers may reuse exact same-basis evidence;
the whole-inventory diagnostic oracle is not the SDK per-row algorithm.

## Reproduce and continue

From this review directory, use the installed compiler with
`forge build --ast --build-info --force --offline --use <compiler>`, then
`forge test --offline --use <compiler>` and
`EFS_TASK3_EVIDENCE=0 node --test --test-concurrency=1 test/*.test.mjs`.
Full matching AST/build-info is required; no source/link/immutable provenance
guard may be disabled to accept a stale incremental artifact.

Parent's broad check, from the worktree root:

```sh
EFS_TASK3_EVIDENCE=0 EFS_FILES_PERF_EVIDENCE=0 \
EFS_FILES_PERF_OPTIMIZED=0 EFS_UPGRADE_EVIDENCE=0 \
node --test --test-concurrency=1 \
  Reviews/2026-09-05-c0-core/test/*.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/*.test.mjs \
  Reviews/2026-09-09-files-parity-performance/*.test.mjs \
  Reviews/2026-09-05-c0-admission/integration.test.mjs \
  Reviews/2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

Build warnings remain explicit: existing C0Request mutability and existing
packed-cast/arithmetic lint, plus six intentional test-only uint16-byte/revert
selector casts in LensReads.t.sol. None originate in new production Lens code.
This is not a warning-free build claim.

Next: combine these point reads with real Scope enumeration and Files
interpretation at one basis, then qualify revision-aware upgrade reads and
feed that same reader into the static SPA. Measure first useful rows and
dependency/RPC counts, not just contract gas. Actual byte ranges, mirrors,
collections, restore/Trash, real wallet consent and the remaining parity rows
still require their own observable journeys.
