# Four visible placements can still be expensive to discover

**Status:** measured local pressure result; no new index, ABI, SDK contract or
larger reader budget selected. This is not a large-folder parity pass.

The user-visible problem is real: a folder can contain only four currently
asserted placements, yet discovery spends its whole scope budget checking old
names first. A direct read of a known surviving name still works. This is a
read/discovery problem, not evidence that the stored File Objects disappeared.

## Verified 64-name case

A and B once asserted 64 names and then both retracted the oldest 60. The
same two File Objects occupy the surviving final four names. Full independent
reconstruction verified all 64 positions, 60 ABSENT results and four FOUND
placements at one pinned observation. Both page-size arms read that same basis.

| Page size | Requests | Positions traversed/sealed | Visible placements returned | 50ms injected arm | Result |
| --- | --- | --- | --- | --- | --- |
| 4 | 512 | 60 | 0 | 8.085 s to refusal | UNAVAILABLE/PARTIAL; prior sealed prefix |
| 8 | 496 | 64 | 4 | 7.711 s to first visible rows and completion | COMPLETE |

One fresh 0ms and one fresh 50ms reader per page size. No percentile or v1
ratio is implied. Independent oracle comparisons are outside these summed
acquisition intervals. Full request/byte/phase counters and compiler/source
pins are retained in [churn-evidence.json](churn-evidence.json).

After every traversal, a **fresh scope at the same block** successfully read
the known final name `n62.txt`: 60 requests and about 1.64 s in the 50ms arms.
That distinguishes undiscovered data from absent data. Stopped-scope evidence
remained byte-identical after ignored-cancellation transport replies drained.

The current first-mutation inventory explains the work:
[StateKernel](../2026-09-05-c0-core/src/StateKernel.sol) appends the Binding
scope anchor only when `beforeHead.state == 0`; later changes update the head
without erasing that historical position. That is useful retained-history
behavior. It is **not by itself a cheap current-folder listing**. The read
adapter currently reconstructs each discovered role and resolves its current
value, including roles whose latest claims have both been retracted.

Increasing the page size rescued this particular case by reducing repeated
page/seal overhead. It did not make the first useful rows quick, establish a
general folder-size guarantee, or justify changing the screen's page size
without considering first-page latency and resource bounds.

## Larger arms: reference-verifier limit, not reader measurements

The 96- and 128-lifetime-name setups completed their fixture publications but
could not obtain a complete independent comparison snapshot under the
unchanged reference collector's finite limits:

- **96 names:** UNKNOWN, `posting word/remaining-work budget`.
- **128 names:** UNKNOWN, `inflated inventory/remaining-work budget`.

Their attempted block/source bases and exact refusals are retained, with
`ORACLE_LIMIT_NOT_A_READER_MEASUREMENT` and no invented samples. No complete
current-folder assertion or reader latency is made for these two arms.
The reference collector has a 4,096 aggregate-row accounting bound, separate
from the guest scope's 512-request bound. Neither is an EFS protocol maximum.

The first run exposed the oracle wrapper obscuring a collector refusal as
“incomplete snapshot.” The experiment now reads the collector outcome before
constructing the comparison oracle. It preserves the 96/128 refusals instead
of shrinking them away, trusting an incomplete oracle, or relaxing a guard.
Final run: **4/4 harness tests**, 74.387 s, zero skips/cancellations; only the
64-name arm supplied verified reader-performance evidence.

## Narrow next experiments

1. **SDK/reader lifecycle:** continue at the same exact basis using bounded
   acquisitions and retained-prefix provenance. Reject changed source/epoch,
   block hash, execution set, root, Lens or query scope. Bound total retained
   evidence and outstanding transports; do not merely reset counters or trust
   a supplied cursor as proof that earlier positions were traversed.
2. **Read-call shape under churn:** compare a bounded, fully checked hydrated
   read/batch helper against the current small getters before changing Store
   layout or the writer. Fewer round trips may help, but a filtered read must
   still prove its scanned coverage and distinguish tombstones, masks and
   unresolved required claims. Any new current-position index is a separate
   design/cost decision, not selected by this benchmark.
3. **Verification scalability:** obtain independently checkable larger fixtures
   through a deliberately scoped reference-collection design. Keep the present
   collector refusal visible. Do not label a larger fixture verified merely
   because its publications returned receipts.

No owner choice is needed to begin those reversible experiments. The results
do not reopen exact Types or require a Files-specific Core noun. They do make
general directory pagination and long-lived-folder UX concrete remaining MVP
work, alongside profile-checked writes and content reads.

The [SDK and Data Explorer consumer review](next-experiments.md) now turns
these into bounded acquisition-chain, read-helper and Files-first presentation
acceptance plans. The reference-collector ceiling stays a separate experiment.
