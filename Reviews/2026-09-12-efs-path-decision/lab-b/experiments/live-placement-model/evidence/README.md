# Closed live-placement model evidence

Standing: **CLOSED — actual GREEN 13/13; independent SpecCompliant / QualityApproved.**

This packet retains the finite algorithm experiment, not a contract/index deployment or performance benchmark. [RED](live-placement-red.json) records four passing syntax checks and 4 PASS / 9 FAIL / 0 skipped; [GREEN](live-placement-green.json) records four passing syntax checks and 13 PASS / 0 FAIL / 0 skipped. Both are actual root-owned Node v26.0.0 executions. Only candidate source differs between their four-file snapshots.

## Inventory / provenance

- `source-red/`: the original `candidate.mjs` empty stub plus unchanged `reference.mjs`, `fixtures.mjs`, and `model.test.mjs`.
- `source-green/`: all four actual GREEN files, including candidate SHA-256 `452703b70608ef53294a9f1ad4172b299f2798c71996b73d1bbbbeaecc77605e`.
- `live-placement-red.json`, `live-placement-green.json`: original reports, with complete test output and source pins.
- `run-live-placement-model.mjs`: original bounded root runner, retained as evidence with its historical paths/deadline unchanged. Do not execute it as part of packet verification.
- `main-plan.md`, `source-review.md`: complete authorized task and preceding feasibility investigation.
- `independent-review.md`: full actual independent review, SHA-256 `1999b72fe6ba4bfe15d38376b865f9e573bf52a38ddaafdb1e353651781aad61`.
- `task-1-report.md`: implementer chronology and closure, copied from the assigned task ledger.
- `retain-evidence.mjs`: file-only mechanical retention generator; no model imports or subprocesses.
- `manifest.json`: exact byte lengths and SHA-256 for the other 17 retained files. The packet contains 18 files including the manifest; the manifest does not hash itself.

Original JSON/review/runner text is preserved byte-for-byte, including original absolute temporary-path provenance. Hash checks establish copy identity, not a new test run. No independent-review slot is left pending: the actual approved review is included.

## Preconditions and narrow finding

The result assumes an honestly maintained frozen prepared snapshot and fresh or API-issued continuation cursors. Matching snapshot context does not authenticate a forged traversal offset; arbitrary mutation of exported maps or a claimed coverage flag is not a state proof. See the full review before reusing this model as a reference. It does not establish a secure public cursor API or duplicate-author/hostile-query normalization.

H9/L6/U4/S3 and the two-name 2→4 lifetime-scan fixture show only that some lifetime-only scans can be avoided while preserving the tested live placement, authored ordering, mask and tag semantics. Preparation replays history and copies/sorts/hashes snapshot data; its costs are not free. The relevant bound remains all Lens authors' live candidates plus head probes, not final visible Files. No onchain gas/storage/callback/ordered-index cost, large-folder readiness, historical completeness, cold-browser/name reconstruction or adopted production API is claimed.
