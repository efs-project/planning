# Audit pages: implementation and performance checkpoint

**Status:** disposable source at `ae99e1a` passes independent task review and
fresh parent integration regression; final increment review pending. Not a full directory browser,
authenticated C0, upgrade-read integration or v1-parity claim.

## What this adds

The contract can enumerate real BindingScope anchors and Binding history in
bounded pages, with checked continuation tokens and a fixed historical
admission boundary H. Raw pages return admission ordinals; hydrated pages also
return checked occurrence metadata and lifecycle as of H. Current audit counts
are available separately. Other query families explicitly return UNSUPPORTED.

The [implementation plan](audit-pages-plan.md) uses the existing page ABI and
the existing Store. It adds three fixed QueryReadLibrary forwards and a derived
normal test host; it does not change storage, admission, candidate Types,
portable identities, the point reader or the existing Binding implementation.
The shared test deployment helper preserves closed compiler links, exact source
hashes, same-build immutable attribution and all five component runtime checks.
Its original raw-port ABI avoids ambiguity between `counts()` and the new
query-specific `counts(...)`; page calls still use the complete host ABI.

A Scope anchor is the **first assertion of a position**, possibly a tombstone,
not its current file value. It survives later replacement or withdrawal. The
Files consumer must decode that original position, resolve its Binding at the
same H and validate the selected Files claim before showing a row. Missing or
malformed selected data must remain unresolved, not disappear from the list.

Raw pages check retained head/packing, inspected order and canonical prefix
boundaries. They rely on the sole writer's mandatory index-membership invariant;
they do not independently reparse every body or audit all hidden Store rows.
Hydration adds checked occurrence joins, not Files-profile or author authority.

## Verification performed

- Genuine RED: after real candidate-group/Object/first-tombstone admissions,
  the compilable stub failed `first Scope anchor`. The completed implementation
  passes this same behavior, including historical withdrawal projection.
- Fresh parent forced AST/build-info build succeeded. Fresh parent Core Forge
  **190/190** and upgrade Forge **14/14** passed without skips or failures.
- The implementer ran **95/95** serial Core/admission/type-input Node checks
  and the original standalone Binding regression. Parent's broader serial
  Core/upgrade/Files regression passed **178/178**, with no failures or skips.
  It reproduced all eight page-gas/byte observations in the table below;
  ephemeral block/address pins differ normally. Earlier saved baselines remain
  unchanged, and this run did not publish or deploy beyond its local chains.
- Normal and static calls agree; ordinary calls leave retained Store/library
  state unchanged. Wrong read-library code refuses before request errors;
  absent/reverting Preparation code does not affect these reads.
- All sixteen ordered subsets of four real admission positions were compared
  with an independent JS linear oracle: seven H cuts, limits1/2/3, both modes,
  full cursor words and every returned lifecycle field. Dense real inventories
  independently verify at1/8/64/256; a real257 fixture verifies256+1 hydration.
- Cursor/query/mode/Realm/basis/end/range corruption and retained-state
  corruption refuse. Tests distinguish supported empty keys, unsupported tuples,
  invalid requested basis, uninitialized state and inconsistent known state.
- Source-neutral records do not collapse full-width authors: same-low160
  Principals stay isolated. Same-role churn and failed CAS add no Scope anchor;
  distinct roles grow the audit inventory. Later writes/withdrawals preserve
  the old-H prefix and projected lifecycle.

Build output contains warnings, including existing C0Request/packed-cast lint
and fixed-width version extraction in the new cursor. This is not a
warning-free build claim. Incremental development also exposed the already-known
stale AST/build-info provenance failure; a full forced build resolves it.
No immutable/link/source check was relaxed to make a stale build pass.

Independent task review found no Critical/Important issues and approved both
spec compliance and quality. It inspected the complete source diff and the
two unchanged load-bearing dependencies (posting checks and current lifecycle)
without rerunning the suite. Dense multi-statement JS test formatting remains
a nonblocking maintenance note for final review; warning provenance is explicit
above. The final whole-increment review also covers these evidence/UX documents.

## Measured resources

The retained [machine-readable observation](audit-pages-evidence-20260909.json)
is the worker's final managed run, labeled with source commit, source hashes,
ephemeral canonical block pins, exact deployment links and actual transaction
gas. Parent recomputed all19 compiler-source hashes before retaining it.
It is **not a saved complete Store snapshot** or a public-chain deployment.

Solc0.8.30, Cancun, optimizer200/viaIR; Forge/Anvil1.7.1, Node26, ethers6.15.
Normal limits stay24,576 runtime bytes,49,152 full initcode bytes and16,777,216
gas per actual transaction. Forge test-function totals include setup and many
calls; they are not individual transaction costs.

| Component | Runtime bytes | Full initcode bytes | Deployment gas |
| --- | ---: | ---: | ---: |
| AuditPageReadHarness | 12,485 | 18,396 | 3,614,018 |
| QueryReadLibrary | 14,811 | 14,841 | 3,255,809 |
| PointReadLibrary | 12,103 | 12,133 | 2,670,670 |
| AdmissionLibrary, unchanged | 24,503 | 24,535 | 5,351,899 |
| PreparationHelper, unchanged | 18,805 | 18,831 | 4,120,023 |

The audit host's constructor arguments occupy3,360 bytes. Its runtime leaves
12,091 bytes of room; QueryReadLibrary leaves9,765. These are not guarantees
that the remaining authority/query/Lens joins fit. The unchanged admission
library still has only73 runtime bytes free; future writer changes remain
size-sensitive. The existing fixture also deploys a base StatefulHarness as
setup overhead; the audit host's own Store receives all tested publications.

| Real anchors | Raw page gas | Raw bytes | Hydrated page gas | Hydrated bytes |
| --- | ---: | ---: | ---: | ---: |
| 1 | 60,589 | 288 | 121,725 | 576 |
| 8 | 79,371 | 512 | 481,142 | 2,368 |
| 64 | 201,028 | 2,304 | 2,609,016 | 16,704 |
| 256 | 619,679 | 8,448 | 10,240,801 | 65,856 |

Each row is one page request per mode. Actual receipt gas and estimates are
retained separately; they agree in this sample. These are fresh-transaction
costs, **not paired cold/warm benchmarks**, complete proof-collection counts,
RPC calls to usable Files rows, paid-chain fees or browser latency. Query
`counts` costs49,181 gas/160 bytes at8/64/256; it reports current maintained
audit counts, not historical-H live-file counts. Eight-wide setup admissions
fit; the largest retained setup transaction costs9,481,612 gas.

The hydrated maximum fits but is costly and exceeds a uint16 byte allowance.
The existing [SDK resource rule](read-overlay.md#sdk-projection-not-additional-public-seams)
is now backed by a real65,856-byte response: bound returned success **and revert**
data before copying, use a sufficiently wide byte budget and budget forwarded
gas separately. Do not automatically use256 as a UI page size. Measure the
small-page Files/Lens join and scoped SDK reads before setting defaults.

## Scale boundaries, not hidden passes

The sparse synthetic list reaches count `(2^48)-2` without allocating that many
admissions. It records48 bisection probes, two physical boundary checks and
one resumed predecessor check: **51 boundary-only posting SLOADs**, plus one
consumed item,52 total. Repeated packed-word reads count too. Coverage remains1;
search work is not consumed-query coverage. This verifies the derived bound,
not a billion-row real dataset or an exhaustive Store audit.

The optional real513 setup admits within normal transaction limits, but the
unchanged independent whole-state collector returns `UNKNOWN: posting
word/remaining-work budget` at its4,096-row work bound. The test records that
outcome and reverts its local fixture branch. No collector limit was raised.
**513 is not a verified real density.** The separate synthetic513 fixture
tests raw clamp/traversal geometry only. Real257 supplies the hydrated boundary.

The optional synthetic10,303-anchor geometry was not added. Resolved
10,240-dead-name/63-live-name Files behavior remains a next-consumer test:
raw audit pages include old anchors and do not represent visible rows.

## Retrospective and next step

Reusing the shared ABI, Store, posting checks and fixed read-library boundary
worked without another storage model or library. Extracting one closed test
deployer preserved the older Binding regression and avoided a second linker.
The useful pressures are now concrete: large checked responses cost real gas,
full-inventory diagnostics hit a work budget, and raw inventory is not Files
resolution. Increasing limits or calling this a completed folder browser would
hide those distinctions rather than improve the design.

Next: [join this inventory to revision-aware reads and actual Lens/Files
resolution](../2026-09-09-v1-parity-overnight/directory-read-next.md), then one
shared SDK/SPA screen. Preserve the old browser's [latency and UX control](../2026-09-09-v1-parity-overnight/browser-latency.md):
ninety first-page RPCs, hidden mobile evidence, and lost focus at page completion
are measured/source-backed consumer followups. No new owner decision is needed
for these reversible joins. Full v1 parity, actual-wallet evidence and all
remaining query families are not completed by this component checkpoint.

## Reproduce

In this Core review directory, use the installed Solc0.8.30 executable:

```sh
forge build --ast --build-info --force --offline --use <solc-0.8.30>
forge test --offline --use <solc-0.8.30>
node --test --test-concurrency=1 test/*.test.mjs \
  ../2026-09-05-c0-admission/integration.test.mjs \
  ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

Run the existing upgrade Forge suite separately. From the vault root, the
broader serial Node command additionally includes
`Reviews/2026-09-08-upgradeable-foundation/test/*.test.mjs` and
`Reviews/2026-09-09-files-parity-performance/*.test.mjs`; keep
`EFS_FILES_PERF_EVIDENCE=0 EFS_FILES_PERF_OPTIMIZED=0 EFS_UPGRADE_EVIDENCE=0`
to avoid overwriting older saved observations. The managed tests close their
loopback chains; no account, external RPC or new dependency is required.
