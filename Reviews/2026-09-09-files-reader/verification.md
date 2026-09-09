# Files reader: what this increment demonstrates

**Standing:** disposable prototype evidence, not v1 parity or a production SDK.
The experiment starts from published `31a4fbd`; its scope and Files adapter
are committed at `c581366` and `eb14059`. The matched scheduling follow-on at
`428249c` is also task-reviewed. Final whole-increment review approved
`31a4fbd..f21c5e3` for experimental branch publication, with no Critical or
Important findings. No main merge or permanent protocol adoption.

## Useful progress

An app can now ask for a mounted root folder through one executable reader,
without a wallet or a whole-database reconstruction. The reader validates its
configured contract deployment at a pinned block, asks the actual contracts
to select claims using the chosen Lens, checks the selected Files meaning,
and returns a bounded cumulative listing with inspectable evidence.

This exercises real admitted candidate Types, Directory/File charters,
Mounts, Plans, Entries, Whiteouts and attributed Bindings. The independent
test oracle reconstructs retained state separately; it is not the app's read
path. A malformed winning claim does not fall through to a convenient losing
file. Conflict selects no file. Historical validity and current maintenance
are separate. Missing evidence does not turn into an empty folder.

The tests also found two genuine implementation mistakes before publication:
an early-rejecting sibling join could begin sealing while another internal
read was still running, and complete enumeration could hide an unavailable
row behind an aggregate availability label. Regression tests now require
drained joins and separate enumeration/row-availability reporting.

## Verification and measured baseline

Independent task reviews approved both implementations, with no Critical or
Important findings. The parent freshly ran:

```sh
EFS_FILES_READER_EVIDENCE=1 node --test --test-concurrency=1 Reviews/2026-09-09-files-reader/test/*.test.mjs
```

At `eb14059`: **14/14 groups passed**, zero failures/cancellations/skips,
47,697.74 ms. This includes live managed-chain fixtures, the independent full
retained-state verifier, cancellation/budget/source faults, old U1 and new U2
observations, three Lens choices, mount/name/charter/selection errors, partial
and churned pages, failed continuation/recovery, browser-like module loading
without Node APIs, and a strict TypeScript consumer importing the actual
`.mjs` entrypoint. VM loading is not rendered-browser UX evidence.

All ten captured reader/test source pins matched exact Git source at
`eb14059`. The original Core, upgrade foundation, managed runner, independent
verifiers and earlier parity/performance directory remained byte-identical
to `31a4fbd`. Earlier broad Core/Forge results belong to the earlier increment;
they are not presented as newly rerun tests here.

The workload is eight names over **two distinct maintained File nodes** shared
across those placements; both authors bind the same Entry for each name.
Page size is four. It does not measure eight separate File/charter histories,
file revisions, bytes, browser paint, wallet consent or a public network.

| Phase | Actual RPC requests | JSON-result bytes | Parent 50ms-delay samples, ms |
| --- | ---: | ---: | --- |
| Cold source/deployment qualification | 36 | 298,022 | 1085.78 / 1088.24 / 1089.73 |
| First four sealed rows | 58 | 35,732 | 1465.09 / 1483.77 / 1485.16 |
| Remaining four rows | 34 | 23,860 | 646.39 / 646.81 / 667.05 |
| Same-scope point reuse | 4 | 2,492 | 219.74 / 210.95 / 220.72 |

Counts agree in every 0/50ms sample. Peak concurrency is four except sequential
point sealing, which peaks at one. Setup and independent reconstruction are
outside timing. The cold plus first-page result is about 2.6 seconds with
50ms added to each RPC: a concrete optimization target, not a finished UX
endorsement. No matched v1 cost or speed ratio is claimed.

Cold browser delivery is a further unmeasured cost: the current unminified
browser ethers module is 1,009,035 file bytes, and this fixture's compact
expected-manifest JSON is 412,052 bytes. Neither is included in the RPC-result
table. These are source/serialization sizes, not measured compressed wire
bytes. Production SDK bundling and manifest representation need deliberate
work; a fast already-imported Node phase cannot certify guest browser boot.

## Matched scheduling result

At `428249c`, independent review approved the concurrent qualification/seal
controls with no findings. A fresh parent run of all reader tests passed
**18/18**, zero failures/cancellations/skips, 71,176.20 ms. The added tests
withhold final replies, fail one concurrent control while others arrive late,
abort queued work, and compare the exact old scope source with the candidate
on one real fixture through the same adapter and independent oracle.

| 50ms-delay phase | Baseline median, ms | Candidate median, ms |
| --- | ---: | ---: |
| Cold qualification | 1088.33 | 663.91 |
| First four sealed rows | 1480.78 | 1315.52 |
| Continuation | 661.38 | 503.74 |
| Same-scope point reuse | 218.71 | 56.80 |

Three samples per arm, alternating order; descriptive medians, not percentiles.
Every successful phase retains identical request/response multisets, request
and byte counts, cache hits, basis and qualified results. The pool is still
four. Zero-delay cold/first-page medians are slightly higher in the candidate;
this is a demonstrated round-trip-latency improvement, not a universal CPU
speed claim. The first usable page still needs about two seconds in this
delayed Node fixture, before browser/module-delivery costs.

Full evidence is retained as
[reader-scheduling-evidence-20260909.json.gz](reader-scheduling-evidence-20260909.json.gz).
This compresses the original JSON without changing its content. Decompressed
size: 10,825,008 bytes; SHA-256:
`47991bcba3934a2060fc4623487c911015ff1eba16010ac01a372378240e2e25`.
It includes all twelve arm scopes/48 phases, actual raw evidence, source pins,
compiler/deployment metadata, accepted manifest and full oracle snapshot.
The parent independently checked every source pin, reran the full retained
verifier (VERIFIED), and checked all twelve arm scopes for matching bases,
normalized results, request/raw-result multisets, counted bytes and limits.
The table uses those retained worker samples; the independent parent live
run is separate and reproduces the result, not pooled into its medians.

```sh
gzip -dc Reviews/2026-09-09-files-reader/reader-scheduling-evidence-20260909.json.gz | shasum -a 256
node --test --test-concurrency=1 Reviews/2026-09-09-files-reader/test/*.test.mjs
```

Fresh optional export uses `EFS_FILES_SCHEDULING_EVIDENCE=1` and writes only
the plan's ignored scratch path, never this retained report. Create that
directory first after review scratch is archived:

```sh
mkdir -p .superpowers/sdd/files-reader-plan
EFS_FILES_SCHEDULING_EVIDENCE=1 node --test --test-concurrency=1 Reviews/2026-09-09-files-reader/test/reader-scheduling.test.mjs
```

The comparison
loads exact baseline `eb14059` read-only from Git into a test-only module;
there is no second committed runtime implementation.

## Prototype choices made in this pass

These are reversible experiment choices, not project-owner protocol rulings.

1. Use explicit fixture-only public-profile and Plan-scope domains where
   permanent values remain unassigned. If wrong, revise fixture and adapter;
   no durable IDs or user data need migration.
2. Give every open an independent cancellation/budget lifetime and cap the
   fixture manifest at 32 components/32 implementations. If too restrictive,
   revise the experiment limits rather than silently certify larger inputs.
3. Apply the 30-second deadline to active acquisition windows, not human idle
   time between sealed pages. If wrong, rework the fixture lifecycle; lifetime
   request/byte budgets and failure handling still apply.
4. Pair `index.mjs` with `index.d.mts` so the strict TypeScript sample imports
   a real executable entrypoint. If wrong, change the fixture export layout;
   no production SDK package is adopted.
5. Reuse the installed ethers browser ESM bundle because the attempted
   `lib.esm` graph required Node APIs. If unsuitable, rework bundling/imports
   or accept its download cost; no dependency/version was changed.
6. Make `snapshot()` return the latest failed observation while retaining the
   internal last-sealed prefix separately. If wrong, adapt disposable callers;
   no committed source state changes. Returning stale COMPLETE after a failed
   recheck is not allowed.

## Remaining gaps and next checks

The [guest Files screen](../2026-09-09-files-screen/verification.md) now uses
this same unchanged reader. Real Chromium checks cover seven observations
across all three Lenses, phone/keyboard behavior and 0/50ms browser timing;
independent re-review approved the corrected UI at `48338b0`. The separate
[folder-size pressure](../2026-09-09-files-reader-scale/README.md) exposes the
512-request lifetime cap: 32 unique Files use all of it, and larger examples
stop with labeled prior prefixes. No general directory-size claim follows.
Profile-checked onchain writes,
FileRevision/head/byte traversal, current attributed tags/filters, and the
full [v1 inventory](../2026-09-09-files-parity-performance/parity.md) remain open.
The raw publication fixture is not a FilesRouter validation certificate.

The manifest and RPC are explicitly trusted local configuration, authority is
synthetic operator only, and finality is provisional. Complete same-source
agreement is not independent consensus proof. Names are root-only ASCII;
rich names are unsupported, not automatically invalid. Charter history and
scope work are finite. Unique-node size is now measured above; wider-author
folders and resumable acquisition lifetimes still need their own evidence.

The managed runner deploys U1/U2 code before initialization. It therefore
does not prove correct historical-manifest selection for an implementation
deployed later; that is an explicit followup, not evidence of data loss.

The final reviewer independently confirmed all 20 current scope codec
input/output shapes against compiled Core/Admin artifacts. The follow-on
[`abi-shapes.test.mjs`](test/abi-shapes.test.mjs) now retains that comparison
against both U1/U2 and Admin. Its same-selector, wrong-output-width negative
control catches an error that small numeric round trips could miss. The new
isolated regression passes (1/1); independent review reproduced 1/1 and
approved this test for the experiment branch. This is static shape evidence,
not large-value runtime execution proof. No runtime code or public export changed.

Declaration accuracy for integer epochs and pending evidence timestamps was
fixed at `3b396d9`, with strict sample RED/GREEN evidence. A fresh parent run
of all 18 groups on the corrected source passed, with zero failures,
cancellations or skips (71,032.08 ms). Runtime and retained performance-source
pins are unchanged. The scoped final re-review confirms the mismatch is
addressed with no new breakage. No blocking finding is being silently discarded.

At the final guest-screen checkpoint `84ef041`, main freshly ran
`node --test Reviews/2026-09-09-files-reader/test/*.test.mjs`: **19/19** pass,
36,539.15 ms, zero failures/skips/cancellations. This includes the new static
ABI regression and the unchanged live reader/scheduling controls; it does not
turn the separate directory-size or oracle-limit refusals into passes.
