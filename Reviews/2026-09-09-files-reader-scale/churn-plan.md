# Historical names versus visible folder size

**Status:** bounded follow-on experiment; initial scale report stays unchanged.

Pressure the design with a simple long-lived folder: A and B once asserted
64, 96 or 128 names; both now retract all but the final four. The immutable File
Objects remain. These are Binding tombstones, not Files removal markers or
proof of deleted bytes. Only two distinct File Objects remain visible.

Use actual deployed state, its full independent oracle, the unchanged reader,
and page sizes four and eight at 0/50ms per RPC. Report lifetime positions,
visible placements, time to first visible placement, complete versus refused
traversal, requests and accepted result bytes. Compare page-size arms at the
same basis. A fresh exact-name read of the final name checks whether a listing
failure is a discovery/lifecycle limit rather than missing underlying data.

Do not implement or select a new index, cursor format or source-trust model in
this experiment. Do not raise the 512-request guard. Test whether a bigger
page merely shifts the boundary and whether historical-name cost grows while
the useful visible folder stays at four placements. This informs the next
SDK/reader/Core discussion; it does not prove the current Type model is wrong
or certify v1 parity.

The first 128-name attempt failed before measurement: the full-retained-state
oracle returned UNKNOWN, but its test wrapper obscured the collection reason
as “incomplete snapshot.” The follow-on reads the collector outcome directly,
preserves its exact refusal and performs no performance/row-completeness claim
for an arm without a verified oracle. The intermediate 96-name attempt also
hit the collector budget, so it is retained as a separate verification-limit
result rather than silently shrinking the dataset or relaxing the collector.
Only arms with a complete independently verified comparator may enter the
reader-performance loop. Neither collector nor reader limits are relaxed.

Run `node --test --test-concurrency=1 Reviews/2026-09-09-files-reader-scale/churn.test.mjs`.
First build the ignored foundation artifacts using the initial scale README's
`compileUpgrade()` prerequisite and the installed pinned offline toolchain.
The optional `EFS_FILES_CHURN_EVIDENCE=1` exporter creates a separate
`churn-evidence.json` exclusively and refuses to overwrite an existing report.
