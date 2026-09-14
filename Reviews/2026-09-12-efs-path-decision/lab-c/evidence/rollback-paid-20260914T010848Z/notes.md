# C control execution notes

One fresh root-owned run succeeded September14 01:08:48.307–01:08:51.569UTC.
Source84e1081e46163547e2928c12a4551233e8f07afc; unchanged compiled source2ca7349.
No compiler invoked. Owned process groups were stopped; subsequent ps check found no Anvil/Forge/solc. The01:05–01:25 lease is released after this run.

Frozen independent audit: PASS_RPC_OBSERVED,2518 raw envelopes,756 logical and1566 physical observations,27 signed transactions,18 deployments,3static/mined links,28 unique headers. Attempts: scale7366020gas; lateIndex2246568gas; calibration2400648gas. These control prices do not change frozen normal product-price rows.

Supplement: PASS_RPC_OBSERVED_SUMMARIES,72 file pins,6 artifacts,49 transitive compiler-source files. Actual-packet and summary-mutation tests61/61 with no skips. Before-run source tests had60 passes/1 deliberately skipped actual-packet case; that gap is now executed.

Invocation caveat preserved: supplemental-check.mjs uses path.resolve for its CLI guard, while Node resolves macOS /tmp to /private/tmp for import.meta.url. Invoking its /tmp alias exits with no output; root refused to count that as a check. Canonical /private/tmp invocation and the exported checkPacket test both ran and passed. No sealed file was edited to hide the issue, and no chain rerun was needed. Use the canonical path or exported function when repeating this exact checker. The main frozen audit uses realpathSync and does not have this alias issue.

The prepared input/raw/report SHAs and exact commands/child PIDs are in audit.json, supplemental.json, pins.json and launch-record.json. This is observed state consistency, not authenticated chain proof or a complete Files/portability gate. Source/compiler provenance is checked through prior artifacts/metadata, not independently reproduced compilation.
