# Required discovery: the selective-index challenge

September14 · **root-replayed local receipt evidence; independent output review PASS**

## Decision in plain English

The compact implementation's inexpensive writes did **not** depend on making
this required query prohibitively expensive. A small mandatory selective index
cost more to maintain, but reduced complete query gas enough to pay for itself
within this workload. **B remains the primary engineering direction; this test
does not reverse the recommendation in favor of the tested MUD adapter.**

This is a named comparison, not proof that custom storage always beats MUD or
that the complete EFS foundation has no remaining gates. No portability, Lens,
acceptance or discovery requirement is waived.

## Actual complete-work costs

Each arm received the same eight common publications, then completed both an
older and a latest admission-frontier query. Each query returned unique retained
Quote Records referring to the named Pair, including historical revisions—not
Lens-selected current files. All pages, not just the first, are charged.

| Receipt gas | B scan | B selective | MUD-backed C |
| --- | ---: | ---: | ---: |
| Eight common publications, including index maintenance | 7,793,360 | 8,070,429 | 13,794,689 |
| Complete older-frontier query | 1,105,688 | 253,969 | 411,269 |
| Complete latest-frontier query | 1,299,715 | 263,263 | 411,924 |
| **Common writes plus both complete queries** | **10,198,763** | **8,587,661** | **14,617,882** |
| Deployment transactions, separately | 8,434,366 | 8,734,865 | 25,714,831 |
| Other setup, separately | 715,591 | 715,591 | 69,974 |
| C's initial Type publication, separately | 0 | 0 | 2,476,850 |
| Entire isolated arm, including deployment/setup | 19,348,720 | 18,038,117 | 42,879,537 |

These rows sum multiple transactions. They are not one transaction's block-fit
requirement, per-file averages, mainnet-dollar quotes or replacement prices for
the frozen [[provisional-recommendation|normal Files workload]]. Deployment and
initialization costs amortize differently; do not hide them or amortize them
without a declared workload.

B selective adds277,069 gas of common-write maintenance and300,499 deployment
gas over B scan. It saves851,719 gas on the older query and1,036,452 on the
latest query. The entire tested arm therefore saves1,310,603 gas **even including
that extra deployment**. Against C, common writes plus both complete queries are
41.25% lower in this implementation/workload.

## What actually executed

Source B`b94b57c405ef18b7f259cbd636d685ff96738ce7`; source C
`3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`. One fresh chain31337, Cancun,
30M block limit, ordinary code/initcode limits, fixed2gwei signed transactions.
The successful run lasted08:25:13.846–08:25:42.837UTC.

- 82 transactions,25 paid pages,83 parent-joined headers and21 exact runtime checks.
- B scan needed7/8 pages, B selective2/2, and C3/3 for older/latest frontiers.
- All returned IDs, complete Page fields/cursors/statuses, publication evidence
  and current raw-state snapshots matched the presealed expectations.
- Root replayed the complete retained raw journal in a fresh process without
  using the runner's result.json. 4510 RPC envelopes,4,908,201 raw request/response
  bytes. The4100 independent state-audit calls and50 Page-validation calls are
  harness verification overhead—not the browser's discovery workload.
- B-selective and C loop body reads are0; B scan reads12/15 bodies. These are explicit
  logical loop operations, not all physical internal calls. Pair/preflight
  hydration remains charged in receipt gas; it is not a body-free whole call.

The earlier attempt stopped after six setup transactions because the runner
misclassified RPC signature integers as fixed-width bytes. Its38-entry failure
journal is retained separately; those abandoned setup costs are not silently
inserted into or substituted for the successful matched arms. The narrow parser
repair, regression and review are in [[required-query-runner-review-20260914]].

## Limits that remain visible

This tests18 named data Records and a particular checked reference position,
not1,000-file browsing, arbitrary predicates or an index backfill algorithm.
Older-frontier pages execute against the later retained graph; no historical RPC
state service is substituted. Current occurrence counts and selected heads are
not this query's membership rule.

C's coverage API still synthesizes its processed frontier; its raw stored
through-value remains0. Its Record backlinks are not B's binding-target live
counters. Those schema differences remain explicit, not repaired by a passing
comparison. Native-contract source portability, authenticated source-state
proof, the joined Files journey and private/carrier failures remain separate
gates. RPC observations are **not authenticated state proofs**.

## Evidence and next action

Preserved [successor evidence packet](https://github.com/efs-project/planning/tree/1d8356c9de86a488c950abcb3f9f4d17a6126510/Reviews/2026-09-12-efs-path-decision/lab-b/required-query-paid-20260914),
including the full independent output review, at B`1d8356c`.
It contains compressed exact inputs and both raw journals, root audit, permits,
runtime/source pins, process/resource records and a hash manifest. The complete
packet is about1.27MB; originals remain in owned temporary directories.

- Input SHA256: `077f59b735d2ddb3fbd9c3d432f306b0f919929b20e9a6d5402459790e96788c`.
- Successful raw journal SHA256: `38c13c643d625d2f998172c22428a62839959243c6acfba4fbae55a4354cdcfb`.
- All owned processes stopped; after-run owned scratch236,875,936 bytes,
  free disk293,146,730,496 bytes. No cleanup deletion was needed.

Independent output review reconstructed every receipt/cost partition, deployed
runtime and paid Page/commitment/cursor chain from raw bytes and passed without
a blocking finding. The bounded cost-reversal gate is closed. Carry only
compact B into the [[b-portable-evidence-seam-20260914|joined evidence-retention
and destination-admission experiment]], then the small Files/SDK journey. Keep
C and fuller A as retained comparison evidence, not parallel products to finish.
The morning14:00UTC deadline is a handoff deadline, not permission to call these
remaining requirements complete.
