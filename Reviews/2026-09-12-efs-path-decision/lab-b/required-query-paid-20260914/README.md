# Required-query retained evidence

Disposable local evidence, September14. No protocol adoption or authenticated
state-proof claim. Source B`b94b57c405ef18b7f259cbd636d685ff96738ce7`, C
`3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`.

`manifest.json` binds every retained file and uncompressed content. Inputs and
both journals are gzip-compressed losslessly; do not parse compressed bytes as
JSON. The account inventory contains only public deterministic test addresses,
not private keys. The successful journal has4510 entries/82transactions/25pages;
the failed-attempt journal has38 entries/six setup transactions and is not part
of successful workload totals.

Replay using the source-pinned `script/required-query.mjs` buildRunPlan and
`script/required-query-audit.mjs` auditTranscript functions: gunzip and parse the
exact inputs, gunzip the raw JSONL into ordered entries, and pass both to the
pure audit. This invokes no chain. `root-audit.json` is a convenience report,
not evidence that replaces replay. Full runtime/input source validation uses
the separately named original artifacts and dependency pins; this packet is
not a self-contained reproducible-build toolchain.

Successful attempt08:25:13.846–08:25:42.837UTC, Node26.0.0, chain31337/Cancun,
30M block gas, ordinary code/initcode limits; root-owned processes stopped.
Deployment/setup/Type-publication/common-write/older-query/latest-query costs
are separately retained. Audit RPC overhead is not browser discovery cost.

Coordinator interpretation and independent review are published on planning/main
in `Reviews/2026-09-12-efs-path-decision/required-query-paid-results-20260914.md`.
