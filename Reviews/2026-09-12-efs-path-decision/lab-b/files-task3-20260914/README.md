# Real Files lifecycle and small retained-name churn

Source `c85e5ba`, independently reviewed and approved. Two additive tests
exercise the actual contracts; all prior15 Files tests and implementation
sources remain unchanged. The full suite passes120/120, including17 Files
tests, with normal candidate sizes at the same frozen compiler input.

The lifecycle covers genuine signed rename/move, contract-authored competing
placement, reused pathname with exact stale-CAS rollback and successful control,
whiteout without lower-priority fall-through, atomic three-action restore,
retained bytes/parents/history, and correctly scoped File/revision tags.

The churn case deliberately keeps one live file while two new names are added
and masked. Required scans rise from2 to4. Budget2 stays PARTIAL; budget4 proves
the unchanged live set. This demonstrates the cost problem and honest status
handling, not a scalable live-only index solution.

The14 gzip files retain compiler input/output, run reports/logs, brief/report,
review/diff, and the optional test's original reserved-keyword compile failure.
Only that local identifier was renamed before successful execution; compilation
failure is not behavioral RED. SHA256/lengths and exact decompression are checked
in `manifest.json`. Test orchestration gas is not paid transaction pricing.

Names/folders remain hashed coordinates. Cold name recovery, nested-directory
validation, browser UX, historical pagination, global tag search, last-occurrence
WITHDRAW behavior, large-directory economics and native historical proof are
not established here. Namespace removal is UNBIND, not admission withdrawal.
