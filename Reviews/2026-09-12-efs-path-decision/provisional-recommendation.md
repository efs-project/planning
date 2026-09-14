# Provisional direction: compact EFS, with one cost-reversal challenge

**Standing:** provisional recommendation issued September 13 ahead of the
23:10 UTC owner checkpoint. Based on the 19:10 evidence cutoff plus separately
labelled validation supplements; not a final selection, waived
requirement, production authorization or permanent protocol decision.

## The recommendation in plain English

Use **compact EFS (B) as the primary engineering hypothesis**. Keep MUD Store
(C) as the specific fallback until the required reverse-discovery comparison
is priced. Keep fuller v2 (A) as a semantic/reference control, not a third
product to finish in parallel.

The representation hypothesis is **preserving EFS's promises with fewer
repeated facts**, not discarding portability, checked Types or independent
authors. It does not yet explain the entire measured cost difference.
The smaller candidate already combines meaningful typed writes, a real
contract author, two-author selection and checked consuming-contract reads.
It is cheaper than our current MUD-backed implementation for that joined
slice. Both still have important missing integration, so “B first” is a work
priority, not “B already meets every requirement.”

**Build posture:** choose B as the next engineering target, but do not call its
current prototype the finished foundation. No sacrifice of portability,
mandatory validation, Lenses or required discovery is approved. Today we have
a substantially cheaper useful implementation to pursue, not the unavoidable
price of the complete EFS promise. The next day is for the named comparison
and integration gates below, not another open-ended architecture search.

## What users would pay in the measured slice

| Whole transaction | Compact B | MUD-backed C |
| --- | ---: | ---: |
| Signed File + fresh Quote + head + placement + tag | 1,614,408 gas | 2,400,503 gas |
| Signed fresh revision + head update | 658,950 | 1,112,430 |
| Real contract's fresh competing revision + head | 796,542 | 1,275,405 |
| Checked paid point read | 167,281–167,513 | 252,457–252,517 |
| One-entry paid listing + selected graph | 269,617–277,278 | 391,043–405,632 |

These are local receipt-backed measurements, not live chain-dollar quotes,
large-directory prices or complete feature-normalized overhead. Setup is
separate. The fuller prototype's approximately 5.06M create performs a different
recipe; subtracting these numbers would not prove an equivalent saving.
Exact pins and qualifications: [[b-parity-paid-results-20260913]].

This is still substantial cost. A fresh retained revision on every swap/game
tick is not yet justified. A file exposing an app's existing live contract
state remains a separate useful profile; it avoids duplicating updates but
does not create immutable historical snapshots for free.

## What is earned, and what is not

| Capability | Current decision evidence |
| --- | --- |
| Exact typed records, checked references and mandatory acceptance | Exercised in the joined small graph; not every schema/resource boundary |
| Independent authors, history and Lens-selected contract reads | Exercised in both candidates with independently pinned expected outputs |
| Separate ingestion and mandatory indexing contracts | Present in both; actual required query families are not equivalent yet |
| Ordinary Files workflow and useful SDK | Both can express the four reviewed Files cases; end-to-end fixture and generated/runtime adapters remain work |
| Portable authored evidence | Existing import/replay paths are insufficient for independent evidence retention; native-contract historical proof remains unsupported |
| Full rollback, upgrade/recovery, private/carrier failures and scale | Specific gates remain; isolated prior tests are not one finalist integration |

No row is silently dropped to make the recommendation pass. A content hash
does not by itself prove authorship, real source-chain admission, availability
or current authority. An SDK cannot manufacture evidence absent from Core.

## The strongest reason B might be the wrong choice

B's cheap writes may defer required reverse-reference discovery to later
readers. C already maintains target-keyed Record references, although its raw
postings are not yet a fully qualified query. This is a more concrete challenge
than speculative savings from tooling we have not integrated.

Price **complete `incomingQuotes(Pair, basis, budget, cursor)` over unique
admitted Quote Records**, with the completion bound fixed before measurement.
Use A1, A2, B1, same-body reuse and unrelated traffic. Count publication/index maintenance,
storage and every page/hydration required to finish. Give B one bounded
selective-index implementation opportunity; comparing a deliberately naïve
scan to C is not a fair falsifier. Keep B's existing binding-target maintenance
charged. If C delivers the required result at lower complete workload cost,
or satisfies the named bounded-completion requirement when B's scoped repair
cannot, reconsider primacy. See [[required-index-gap-20260913]].

MUD also earns genuine storage/metadata reuse, but not a demonstrated complete
EFS SDK or lower maintenance bill: [[maintenance-and-reuse-20260913]].

## Work order before the final handoff

1. Complete the already specified matched mandatory-rule/late-index rollback
   controls; distinguish unit evidence from mined pre/post state evidence.
2. Run the required-query reversal test above, then carry only the primary
   candidate into the remaining joined journey.
3. Separate retained source evidence from replay/current destination effects;
   exercise the small Files/SDK journey against that same candidate, with
   explicit proof and historical-pagination limits.

The final September 14, 23:10 UTC handoff must state whether reversible testnet
implementation can begin and which exact gates remain. If the work is still
incomplete, name that condition instead of pretending the clock proved a
50-year foundation. No new owner question is needed just to do these tests.

Inputs: [[sdk-shortlist-review-20260913]], [[files-shortlist-review-20260913]],
[[paid-rollback-control]], [[portable-evidence-next-gate]], [[road-a]] and
[[overhead-and-selection]]. An independent challenge checked the cutoff
arithmetic and identified the reverse-query cost as the strongest reversal.

**Post-cutoff validation supplement, September 13, 22:39:** B's full-A1
mandatory-rule and late-index refusals now have independently checked mined
pre/post-state evidence, with a successful same-shape calibration. Matching C
controls and the required-query comparison remain open. This strengthens B's
bounded atomicity evidence, not the frozen cost table, proof level or final
feature eligibility. Exact packet and limits: [[paid-rollback-control]].

Independent owner-checkpoint review confirmed all five published cost rows and
ranges against the retained table, with no blocking overclaim. The concise
takeaway must say required reverse discovery and stronger portable evidence
still need **implementation and pricing**, not merely a price estimate. B's
current author-liveness dependency is a portability limitation to repair, not
an accepted sacrifice. The final/conditional checkpoint is September 14,
23:10 UTC (6:10pm Chicago).

**Post-cutoff validation supplement, September 14, 01:08:** matching C
mandatory-rule/late-index controls and the positive calibration are now mined,
independently checked and published. Both candidates pass that bounded atomicity
gate; the original cost table and remaining feature/portability qualifications
are unchanged. The next [[required-query-experiment-20260914|bounded query experiment]]
has passed source-plan review and entered test/source preparation, not measurement.
