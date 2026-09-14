# Live placement candidates preserve the tested Lens semantics

September14. **Finite model passed and independently reviewed.** This is an
algorithm result, not an implemented contract index or a paid cost reduction.

The current first-mutation inventory must retain old names for audit/history.
It need not be the only current-query inventory: maintain each author's live
placements separately, and still consult retained higher-author heads/masks
when selecting a result. Removing an item from a live candidate set must not
erase the higher removal mask and expose a lower author's old entry.

## Actual evidence

Thirteen tests ran on Node26.0.0 with a128MiB heap cap and bounded inputs.
The callable empty candidate produced real4PASS/9FAIL RED. With reference,
fixtures and assertions unchanged, the implemented candidate passed13/13.
Independent source/output/hash review is SpecCompliant and QualityApproved.

The reference replays lifetime effects independently; the candidate really
updates live arrays/slot maps per effect and retains raw heads separately.
Full authored tuples and order match across replacement, name reuse, move,
higher masks, multiple positions for one File, File/revision tags, HEAD whiteout,
and all27 absent/live/masked states across three authors for one position.
Genuine faulty reducers/index mutations fail the expected comparisons.

| Representation in the three-author snapshot | Candidate/member reads | Head probes |
| --- | ---: | ---: |
| Lifetime inventory | 9 | 14 |
| One-shot live union | 6 | 6 |
| Ordered live stream, all pages combined | 6 | 11 |

These are heterogeneous **logical operations**, not equal gas units or complete
CPU measurements. Union additionally materializes six memberships and performs
six deduplication checks. Streaming performs no hidden query-time sort/union;
each page still checks all three authors' coverage. A separate churn case grows
lifetime scans2→4 while live candidates stay1 for the same selected result.

## What still costs work

The candidate's snapshot preparation replays all supplied effects, copies/sorts
live memberships and hashes the snapshot. Its work is exposed, not free. A
real persistent ordered index, its writes, callback budget, storage growth,
coverage and economics are **unimplemented**. There is no10k-name test or
large-directory performance claim; inputs cap at1,024 events.

The current-query bound is all relevant authors' live placements plus higher-
head checks, **not visible files**. Many masked lower-author entries can still
be expensive. Retain historical heads and audit data; current live sets do not
provide historical queries or free cold reconstruction.

Missing any required author's coverage returns UNKNOWN. Empty pages before
exhaustion stay PARTIAL; stale basis/Lens/scope/generation/configuration cursors
reject. But matching context is not authentication of a fabricated traversal
offset: the model assumes a fresh query or a continuation it issued, and an
honestly maintained immutable snapshot. The complete SDK traversal must track
all its pages, not bless arbitrary caller-supplied terminal cursors.

## Handoff

Use this as a semantic oracle for one later **real** live-index experiment.
Preserve the lifetime control and charge the entire write/read/preparation bill.
It removes a reason to assume lifetime-only reads are inevitable; it does not
make the existing B browser/index fast. The cold-name Files adapter remains the
next product integration priority: [[sdk-explorer-build-boundary-20260914]].

Exact active candidate SHA256:
`452703b70608ef53294a9f1ad4172b299f2798c71996b73d1bbbbeaecc77605e`.
Retained manifest SHA256:
`201e2162bc451507f94fe2e18c4a687dbd9f833b6c6c589f141c3fdfadd1beb4`.
The compact evidence packet contains18files/128,580bytes, including complete
RED/GREEN sources/results and independent review; root verified every file.
Prototype source/evidence is pushed on `codex/efs-warroom-b-run` at
`3e8df4e597c9755a33bee9ed6ad725441d756147`, under
`lab-b/experiments/live-placement-model/`.
