# Current Files first, with complete diagnostic accounting

**Status:** reviewed guest presentation at `84ef041`; not Files-write parity,
large-directory readiness or a new SDK/Core interface.

The actual SPA now presents qualified FOUND placements in **Files**;
CONFLICT/UNKNOWN in visible **Needs attention**; and ABSENT/MASKED in a
collapsed, keyboard/phone-reachable past/hidden-position disclosure. Every
returned position remains inspectable. A diagnostic position is not a phantom
file, and an unresolved row never borrows a losing filename or action target.
This applies the [Data Explorer PM's advice](../2026-09-09-files-reader-scale/next-experiments.md)
without changing the reader's result law or budgets.

## What was checked

- The pure presentation test accounts for all 67 **synthetic** positions:
  four Files, two attention rows, 61 past/hidden positions. It leaves evidence
  objects unchanged. This is a UI classifier/copy test, not a newly verified
  onchain or browser-scale workload.
- Actual Chromium checks all seven retained contract observations across all
  three Lenses. Every exact result still matches the independent oracle, and
  each primary/attention/history lane has the corresponding result count.
- A real selected mask stays out of Files but its explanation is reachable by
  keyboard at 320/390 px. Escape restores the actual opener. The existing
  conflict explanation, true 200% text, immediate context cancellation,
  missing-record and failed-prefix checks still pass.
- Independent review caught a small keyboard issue: a previously unresolved
  row that became usable was excluded from the “first new file” focus choice.
  Main reproduced the actual transient `n0.txt` Entry-read failure in a RED
  browser regression, then fixed the prior set to include only prior FOUND
  roles. Recovery now focuses that newly usable file before later new positions.
- Copy separates found Files and checked source positions. Partial zero means
  no current files found **yet**, not empty. Terminal zero with unresolved
  positions asks for attention. Failure keeps explicitly labeled prior sealed
  results and never upgrades the coverage to COMPLETE.

Main's combined corrected run passed **8/8** (live browser plus presentation,
server and transport), 21.798 s. Independent scoped re-review passed the full
browser **1/1**, about 21.8 s, and approved this experiment checkpoint with no
remaining finding. The subsequent exclusive evidence export passed **1/1** in
**22.276 s** at `84ef041`; zero failures, skips or cancellations.

## Inspectable evidence and timing

[Fresh report](evidence/files-lanes/browser.json) records eight screen source
pins, unchanged reader/compiler/runtime resources, seven observation bases,
eleven check groups and six timing samples. Main checked all eight source
hashes against disk after export. The new directory was exclusively created;
earlier screen and delivery evidence was not overwritten.

Actual screenshots: [current Files](evidence/files-lanes/desktop.png),
[explanation on phone](evidence/files-lanes/phone.png),
[Files plus attention](evidence/files-lanes/attention.png), and
[expanded history on phone](evidence/files-lanes/history-phone.png).
Main visually inspected the attention and phone-history results.

| Median phase | Local 0ms injection | 50ms per-RPC injection | Requests / JSON-result bytes |
| --- | --- | --- | --- |
| Navigate to first four current Files | 125.2 ms | 2,172.4 ms | 94 / 333,754 |
| Next four, terminal enumeration | 55.4 ms | 537.6 ms | 34 / 23,860 |

Three fresh contexts per arm, same eight-name/two-File dataset, one Chromium
process. Module/config and DOM-visible timing are included; oracle comparison
is outside timers. The updated identity-delivered non-RPC payload is 1,492,311
bytes (one extra decoded character for the 50ms config). The presentation adds
one small pure module. The [earlier compression comparison](delivery-verification.md)
retains its exact earlier source/byte count; its 73.4% claim is not silently
relabelled as a measurement of this later UI. A separate fresh, non-exporting
delivery regression also passed after lane integration, with eleven byte-exact
resources and unchanged RPC totals; it preceded the keyboard-only correction.

These are loopback measurements with synthetic RPC delay, not physical-phone,
bandwidth-limited WAN, finality or production SLA evidence. No real wallet is
accessed and there is no browser submission endpoint.

## Still not solved

The [64-lifetime-name/60-retraction pressure](../2026-09-09-files-reader-scale/churn-findings.md)
still exhausts the scope using the screen's page size four before yielding any
useful file. The separate page-eight control completes, but slowly. The new
presentation does not skip those required checks or make their acquisition
faster. Yield-oriented scanning and cross-scope same-observation continuation
remain the [next bounded experiments](../2026-09-09-files-reader-scale/next-experiments.md).
The live 64/60 browser acceptance has not been added yet.

No file contents, nested directory navigation, current tags/filters, Files
creation/edit/rename/move/remove/restore or wallet actions were connected in
this presentation change. All tested child nodes are Files; directory-child
rendering/navigation is not established by these screenshots. This remains
guest metadata browsing over real contract data, not a complete normal browser.

Re-run the [documented local browser commands](verification.md#reproduction)
plus `node --test Reviews/2026-09-09-files-screen/test/listing-presentation.test.mjs`.
Ordinary runs do not overwrite evidence. `EFS_FILES_LANES_EVIDENCE=1` refuses
if the retained files-lanes evidence directory already exists.
