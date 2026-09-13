# Provisional B parity economics — 2026-09-13

**Inference:** B's lower measured cost survives adding the identified paid-read assertions. The observed parity-version premium is about 9% over previous B reads, not enough to erase the retained C/B gap. This strengthens B as a cost baseline for the bounded fixture, subject to the independent review still underway; it does not select an architecture or establish full-v2 savings.

Inputs: new B source `c5561e2b27c48ca2938695cce7784f1e78564116`, `/tmp/efs-b-parity-paid-20260913.KJ23qU/{audit,measure}.json`; old B and retained C costs in `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/c-gated-paid-results-20260913.md`. Audit reports exact calldata/return/event matches; this note reads those results but does not independently repeat packet validation.

| Paid row | Previous B | Parity B | B increase (arithmetic) | Retained C | C/parity B (arithmetic) |
|---|---:|---:|---:|---:|---:|
| Point A-first | 153,636 | 167,281 | 13,645 / 8.88% | 252,517 | 1.510 |
| Point B-first | 153,884 | 167,513 | 13,629 / 8.86% | 252,457 | 1.507 |
| List A-first | 246,606 | 269,617 | 23,011 / 9.33% | 391,043 | 1.450 |
| List B-first | 254,283 | 277,278 | 22,995 / 9.04% | 405,632 | 1.463 |

This closes approximately **14–16% of the previous absolute read gap** (arithmetic). C still costs approximately **45–51% more than parity B** for these paid rows. These are whole-transaction measurements: the same-B increment includes added checks, interfaces/calldata and compiler effects, not separately metered prices for individual assertions.

## What improved, what remains qualified

`B` below means `/Users/james/Code/EFS/planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b`; `C` means the corresponding `planning-warroom-c-run/.../lab-c`, Solidity `2ca7349`.

The only changed production-source file between old B `4b615469` and new B is `JoinedConsumer.sol`. It now compares revision, bounds admission/closure basis, reconstructs binding coordinates, refuses imported publication evidence and checks list cursor context (`B/src/JoinedConsumer.sol:434–506,537–579,611–635`). Earlier wording that B omits those checks is stale.

Residual differences remain substantive: B packs/share-reconstructs admissions/coordinates while C stores generic action/evidence rows; C frames and canonicality-checks reference/payload bodies; C emits a larger observation tuple and checks explicit per-evidence Realm/Core/source-grade context (`B/src/Ledger.sol:95–102`; `C/src/tables/LedgerTables.sol:101–185,190–255`; `C/test/MeasurementConsumer.sol:188–257,360–437,727–730`). Index obligations still differ: C indexes all actions by author and fresh Record-reference backlinks; B has publish/reuse author postings and binding-target backlinks/live releases (`C/src/IndexModule.sol:110–132`; `B/src/IndexModule.sol:95–120`). Neither index is simply a superset. Their costs are not isolated by these receipts. No inherent “MUD tax” follows.

New B writes are A1 **1,614,408**, A2 **658,950**, B1 **796,542**; Items/Pair **921,085**. The tiny changes are **A1 −25**, **A2 +37**, **B1 unchanged**—not B1 −25. Ledger/index source is unchanged. I have not isolated signature/deadline/calldata effects, so no causal attribution is warranted. B setup is **17,333,852** across the reported 26 transactions, including unused diagnostics; not a minimum production bill or directly comparable to C's differently grouped setup.

## Strongest decision-changing question before 19:10

**Does the next approved scope actually require C's Record-reference backlink query (rather than B's binding-target backlinks), and, if so, where is its equivalent cost in B?** Require a concrete required query/outcome, not an argument that every C feature is mandatory. This could invalidate a cheap-but-incomplete comparison; further small consumer optimization alone would not settle it. If no such requirement is established by cutoff, retain the qualified measured ordering and shared open gates—do not manufacture an optimizer loop. Root owns scope and selection; rollback, portability and full-Files qualification remain open.
