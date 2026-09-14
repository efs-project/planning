# One actual paid Files workflow — September 14

**Standing:** retained, independently reviewed receipt-economics evidence for a
tiny B-only Files experiment. Not architecture adoption, MUD parity, a full file
browser, or an affordability ruling. No experiment was rerun to make this packet.

The actual run exercised one stable File, three checked revisions, one hashed
folder/name placement, File and revision tags, genuine signed Alice and a native
Bob contract, and six independently priced reads through the real joined
consumer. Required indexing and forwarding are included in the outer receipts.

## What was measured

| Write | Whole outer gas | Calldata bytes |
| --- | ---: | ---: |
| W1: signed create F + publish R0 + HEAD + placement, no tags | 1,289,277 | 1,988 |
| W2: separate project_efs tag on F | 523,569 | 868 |
| W3: separate draft tag on R0 | 523,557 | 868 |
| W4: signed publish RA + Alice HEAD CAS expected1 | 708,640 | 1,316 |
| W5: native Bob Actor publishes RB + Bob HEAD expected0 | 777,820 | 932 |
| W6: separate approved tag on RA | 523,544 | 868 |

W1–W6 total: **4,346,407 gas**, excluding separately itemized setup. Nine
deployments and three configuration transactions cost **13,731,683 gas**;
the manifest and retained final review expose every setup row, including the
measurement-only wrapper. These are not six actions bundled into one transaction.

| Independent paid read | Whole outer gas | Calldata bytes | Verified result |
| --- | ---: | ---: | --- |
| P-A: point, Alice-first | 197,363 | 324 | F@RA; selected RA approved |
| P-B: point, Bob-first | 204,877 | 324 | F@RB; selected RB not approved |
| F-A: folder + File-project tag, Alice-first | 269,336 | 388 | COMPLETE singleton F@RA |
| F-B: folder + File-project tag, Bob-first | 284,384 | 388 | COMPLETE singleton F@RB |
| R-A: folder + selected-revision-approved, Alice-first | 269,360 | 388 | COMPLETE singleton F@RA |
| R-B: folder + selected-revision-approved, Bob-first | 280,014 | 388 | COMPLETE, exhausted, empty |

Reads are **alternative operations**, not a compulsory six-read bill. Each used a
separate transaction, with no shared warm-storage discount or intervening graph
write. Gas includes the wrapper's actual result-hash event. Local transactions
used a fixed 2 gwei; this is not a current network quote or a dollar estimate.

## Exact evidence and corrections

Source commit: `de56345e07863d46d656b4a1a077348de7d2c25d`.
Whole source-manifest digest:
`ac5481077ab59ad11131e861f6ed2722c27377d93b043a916aeae446a3e2360c`.
The paid snapshot predates any later withdrawal-characterization work.

There was **one refused preflight and one actual chain run**:

1. `files-paid-1` refused a compiler/preparation packet larger than its 64 MiB
   prelaunch cap, before spawning Anvil. Its complete report and log remain here.
   Compact machine JSON replaced pretty JSON, with identical parsed values and
   unchanged resource limits. The full preflight review retains the intermediate
   findings and focused approvals; its opening NeedsChanges verdict is historical.
2. `files-paid-2` ran on September 14 from 11:48:29.022Z to 11:48:31.566Z UTC.
   The gate exited zero, recorded its owned processes stopped, and released its
   slot. The 31,288,779-byte raw envelope is retained unchanged, SHA256
   `80f7b6ac5a81d44ce46c7d107bb4f332b341bbfde24512bcd1c368bbe7d5906a`.
3. A post-run audit comparison was corrected for JSON-RPC signature quantity
   padding. The original prelaunch oracle remains separately retained as
   `audit-files-paid.mjs.gz` (SHA256 `fd6b0212b6dc8f1d2294e5ce9b42b3a30141038b593666bdc4e2565e9cb3097e`).
   `audit-files-paid-quantities.mjs.gz` is the corrected audit source
   (SHA256 `848aea6291c05007b503af6f21d597a6df26dd3ab61e1d601a8f7326937d2b1e`).
   It compares r/s integer values rather than their padded string representation;
   it does not skip signatures. The exact diff was independently reviewed.
   The frozen preparation, all six expected full answers, and all 247 requested
   storage coordinates are unchanged. A changed signature integer still rejects.

The raw producer envelope still honestly says
`MEASURED_AWAITING_INDEPENDENT_AUDIT`. Its separate retained root audit says
`INDEPENDENT_FILES_RAW_AUDIT_PASS`; original evidence was not relabeled or rewritten
after review. The full final review is the reconciliation record.

## What supports the result

The independent checker derived the literal workload, Type/File/Record identities,
exact bytes, author-qualified heads, tag tiers, parent sets, coverage, and six
complete result/cursor encodings from pinned source/compiler inputs. The wrapper
accepts no caller-expected answer and hashes the actual consumer result.

The reviewed packet joins all 24 signed outer transactions to raw RPC
transactions, successful receipts, headers, logs, block ancestry, and nine exact
immutable-patched deployed runtimes. At post-W6 and final seals it checks 247
modeled cells: 11 admissions, three Records, six bindings and six publications.
Retained R0 child postings are admissions 7 and 9. R-B's empty result is COMPLETE
and exhausted, with selectedSoFar1 before tag filtering, not UNKNOWN-as-empty.

Four retained corruptions reject: missing transaction, changed signature integer,
fabricated paid answer, and changed selected-HEAD raw target. A candidate cost-row
mutation does not replace receipt-derived gas. Their original code and reports
are kept; retention did not rerun the checker or corruption suite.

The focused wrapper test was observed compiling RED, with the missing actual
result event, then GREEN with the same test bytes. It checks six complete results,
stale-basis rejection, and storage-free reads at the stated seven addresses.
The test inherits existing Files tests; running the derived contract unfiltered
would duplicate them. The retained paid RED/GREEN gates select only the new test,
so this is one focused passing test, not another full-suite result.

The normal-size build uses Solidity 0.8.30, viaIR, optimizer runs200 and Cancun.
Actual chain settings use normal 24,576-byte runtime / 49,152-byte initcode limits
and a 30M block gas limit. All nine deployed runtimes and actual constructor
initcodes fit. Oversized *test harness* warnings remain in the unabridged logs;
those harnesses are not the nine deployed instruments. The short actual run
finished before its five-second recurring resource-monitor interval; prelaunch
checks and cleanup are evidence, not a fabricated resource time series.

## Retention inventory and use

`manifest.json` lists all **53 gzip payloads**, original and compressed byte
counts, SHA256 values, and byte-for-byte decompression verification. Payloads total
**87,190,247 raw bytes / 11,239,348 gzip bytes**, excluding this README and manifest.
Unique names preserve:

- Both preflight/run reports and logs; exact raw envelope, checkpoint and summary.
- External pre-run preparation, original and corrected oracle, root audit,
  corruption controls, final gate/driver, and mechanical retention script.
- RED/GREEN/normal-size reports, pin manifests and complete logs, and each full
  compiler input/output including AST, metadata and immutable references.
- Exact frozen source inventories including scripts/configuration, nine original
  deployment artifacts, and convenient RED stub / GREEN wrapper / unchanged
  focused-test / frozen-runner copies. No changing live-worktree source was used.
- Full runner/oracle reports, source/preflight/final reviews, earlier scope proposal
  and the approved bounded plan. The approved plan explicitly narrows the earlier
  proposal's exhaustive-storage requirement; UNKNOWN slot growth is not hidden.

Gzip payloads are byte-preserving originals. The three source-inventory JSON files
are clearly labeled mechanical UTF-8 escrows, with every member checked against
its original source manifest. Executable payloads retain original machine paths
as historical evidence; do not run the gate/driver to inspect this packet.

For an optional *offline* audit, extract the corrected oracle and raw envelope
into a separate scratch directory, verify their manifest hashes, and use the
oracle's `--audit RAW_ENVELOPE_PATH` interface with Node and ethers 6.15.0 supplied
through `EFS_ETHERS_PATH`. This needs no RPC, chain, compiler, or launcher. The
retained root audit additionally checks outer-gate cleanup and source digest;
the oracle CLI alone is not a substitute for those joins. No replay is needed to
read the already retained final review, and another benchmark is not authorized.

## Limits that remain

Persistent storage growth is **UNKNOWN**: 247 semantic cells are not exhaustive
slot diffs, state-bloat measurements, or future gas-repricing evidence. Owned-local
RPC observations, headers and receipts are **not authenticated state proofs**.
Compiler provenance is retained and checked, not independently recompiled into a
reproducible-build proof. The known fixture keys are deterministic local test keys.

No MUD-parity conclusion, full lifecycle price, cold filename recovery, browser,
large-directory/RPC scale result, historical paging, portable native historical
authority, dollar affordability, total lifetime-overhead claim, or production
readiness follows. Separate move/reuse/whiteout tests are not priced by this run.
