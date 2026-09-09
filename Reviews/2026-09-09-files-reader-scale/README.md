# Files reader: folder-size pressure

**Status:** initial six-shape measurement complete; exposes a consumer limit,
not v1 parity. No limit or SDK redesign adopted.

Question: does the successful eight-name/two-File workload hide repeated
charter work or a practical pagination limit? Use the unchanged qualified
[reader](../2026-09-09-files-reader/verification.md), actual local contracts and
independent full-state reconstruction. No server-side authoritative tree.

Measure 8 shared / 8 unique / 32 shared / 32 unique / 33 unique / 64 shared placements,
two agreeing claim sources, page size four, separate fresh chains per shape.
“Shared” alternates the same two File Objects; “unique” gives each name its
own properly chartered File Object. Run one fresh reader at 0 ms and one at
50 ms injected per RPC. This is exploratory scaling evidence, not a latency
percentile or matched v1 cost claim.

Keep source qualification, per-page work, cumulative requests/result bytes,
and terminal coverage explicit. Compare each returned row and complete
inventory to the independent oracle. If the scope's existing 512-request
budget is exhausted, retain and label the prior sealed prefix; never count
this as successful large-folder support. Do not relax the guard just to make
the benchmark pass. Setup, writes and oracle acquisition are outside timers.

Plan: run the falsifier, record the actual boundary, then route a narrow
continuation/lifecycle followup to the SDK/Files designs if needed. No new
public cursor format, cross-scope cache trust or permanent protocol choice.

## Initial observed boundary

The unchanged reader completed 32 distinct files with **exactly 512 requests**.
Adding one more name did not complete. A 64-name folder reusing two File
Objects stopped with 52 positions retained. In both refusals it reported
UNAVAILABLE/PARTIAL with PRIOR_SEALED rows and the explicit request-budget
reason; it did not invent empty or complete coverage.

| Names | Distinct visible Files | Sealed positions returned | Requests | Result | 50ms arm active read time |
| --- | --- | --- | --- | --- | --- |
| 8 | 2 | 8 | 128 | COMPLETE | 2.507 s |
| 8 | 8 | 8 | 164 | COMPLETE | 2.800 s |
| 32 | 2 | 32 | 332 | COMPLETE | 5.517 s |
| 32 | 32 | 32 | 512 | COMPLETE, no request headroom | 7.748 s |
| 33 | 33 | 32 | 512 | LIMIT, incomplete | 7.542 s |
| 64 | 2 | 52 | 512 | LIMIT, incomplete | 8.094 s |

These are one sample per shape/delay on the local machine, not averages or
percentiles. The measured time is source construction/qualification plus
the sum of actual page-acquisition intervals. Independent row comparison is
outside those intervals; the separately recorded wall time includes it.
First four positions in the 50ms arms took roughly 1.91–1.99 seconds.
Successful continuation pages cost 34 requests when reusing two nodes versus
58 for four new nodes. Accepted JSON-result bytes for a budget refusal do not
include late ignored transport results and are not total network wire bytes.

Evidence: [scale-evidence.json](scale-evidence.json), exact SHA-256 source
pins, all twelve run summaries with per-page counters, expected selected results, basis and
compiler/deployment resources. This is measurement evidence, not another full
raw-state proof artifact; full reconstruction ran locally for each chain.
Source Core/reader baseline: `200890c`; the then-uncommitted new benchmark is
identified by its own stored source hash. Fresh run: **7/7 tests**, 0 failures,
skips or cancellations, 75.166 s. A passing test here means truthful bounded
behavior, not that the large folder completed.

## Consequence for build readiness

The 512 cap is a disposable reader-scope guard, **not an EFS protocol folder
limit**. Nevertheless the current screen cannot claim general directory
pagination. A complete 32-file result has no spare budget for another sealed
lookup on that same scope. Restarting from the beginning repeats the limit.

Next consumer experiment: bounded acquisition lifetimes with explicit,
same-basis continuation and retained-prefix provenance; refuse changed
source/epoch, block hash, execution set, Lens, root or page scope. Do not trust
arbitrary caller-supplied cursors as proof of earlier coverage, clear a guard
counter without bounding retained evidence, or silently raise the constant.
This is an SDK/reader lifecycle followup, not a reason to replace the Type or
Binding model. Separately pressure historical-name churn: lifetime anchor
enumeration may cost more than today's visible folder.

Reproduce without overwriting retained evidence:

```sh
node --test --test-concurrency=1 Reviews/2026-09-09-files-reader-scale/scale.test.mjs
```

The optional `EFS_FILES_SCALE_EVIDENCE=1` exporter writes the named evidence
file; use it only in a fresh disposable copy or after preserving the old file.
