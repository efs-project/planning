# Retained compact Files evidence — September 14

Source [67f92c5](https://github.com/efs-project/planning/tree/67f92c5b000e63569eb0011a3688eb59ccb51893/Reviews/2026-09-12-efs-path-decision/lab-b).
See [[../compact-prototype-results-20260914|results]] and
[[../compact-mvp-build-plan-20260914|build plan]]. All files are generated
observations from local experiments, not authenticated source-state proofs.

- `audit.json` and `live.json`: fresh deployments, exact named receipt rows,
  all 163 transaction summaries per run, runtime/code hashes, constructor inputs,
  128-rename checkpoints, RPC counts and separate application source/reviewer/output
  provenance. ABI copies and machine-specific temporary paths are omitted.
- `integration.json`: final fresh-chain Files journey, cold reads and lifecycle,
  native application proof kind and its actual transactions. Same-block
  supersession is a separate test recorded in the Node log, not this JSON journey.
- `verification.json`: all 217 Solidity execution names/statuses, compiler settings,
  source commitments/artifact hashes and 41-test Node breakdown. Inherited tests
  are executions, not distinct additional claims. No test-runtime size warning
  was used to waive the actual deployed contract-size checks.
- `node-tests.txt`: final test output. The machine-specific report location is
  replaced by the retained relative artifact name; test results are unchanged.

These are compact receipts and observations, not a full RPC transcript, stored
chain image or complete state-proof bundle. Reproduction uses the pinned source
and normal local toolchain; hashes/addresses bind this particular run. Block times
and signature bytes can change small gas amounts. The final source adds stricter
receipt quantity parsing after the paired measurement; final integration reran.
No Solidity change followed the measurement. No public network was mutated.

Manual browser evidence (separate from automated tests): cold guest Alice/Bob
and conflict display; created `browser-test.txt`; reloaded; edited to
`Browser edit verified after reload.`; renamed to `checked.txt`; moved to Archive;
removed/restored placement; reopened the exact 35-byte edit; expanded the floating
cost drawer showing six unique receipts / 4,439,651 gas. Those local test actions
are not substituted for the separately pinned economic workload.

Independent review: Astra Extra High contract/SDK reviewer found no important
live-index defect and accepted the placement/same-block/conflict/app fixes. UI
review caught latch/filter issues and a malformed cost hash; root reproduced and
fixed them. Receipt attribution was strengthened afterward. A proposed null
quantity repro was already rejected; a boolean quantity did reproduce and is now
rejected by explicit RPC quantity validation. Final regressions passed.
