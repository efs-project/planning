# B matched mined rollback controls

Three fresh control graphs ran on September 13, 2026, from22:27:46.830 to
22:27:48.589 UTC. This is a disposable **RPC_OBSERVED** result, not authenticated
chain-state proof, a matched C result, full Files integration or protocol adoption.

| Control transaction | Mined status | Gas used | Independently checked result |
| --- | ---: | ---: | --- |
| Complete signed A1 with mandatory Quote scale7 | 0 | 371,952 | Exact required-rule refusal; all prescribed EFS pre/post state unchanged |
| Complete valid A1 with final market-tag index poison | 0 | 1,612,461 | Exact nested late-index refusal; all prescribed EFS pre/post state unchanged |
| Complete valid A1 with zero poison | 1 | 1,614,558 | Exact expected records, bindings, publication, nonce, postings and coverage |

These are **control deployment** prices, not replacement normal product-cost
rows. Setup and all36 transaction receipts remain in the report/audit. The
sealed scope is `paid-rollback-control.md` on planning/main. Failed receipt plus
unchanged state is joined to the same static-call sender, destination, calldata
and gas; no snapshot restoration was used. The late internal mutation ordering
is established by reviewed source/test evidence, not an internal execution trace.

## Pins and checks

- Compiled Solidity source: `8ddd04cdb12506c663c421c3c588115ca38a93b5`.
- Runner and actual source checkout: `4345992ac4898aa23822f14900c25921db194b9c`.
- Independent runtime helper: `3dfd9758fd7be860faa2ebab178521965bd3b67e`.
- Prior source/test evidence: `4487d7bdc43be5749e340ccd36cd2d7e70689e4b`.
- Compiler: Solc0.8.30, Cancun, viaIR, optimizer200; retained verified artifacts
  reused without recompilation. Node26; Anvil1.7.1, chain31337, block gas30M,
  prune256 and run-owned cache. Exact versions/arguments are in launch-record.
- Independent expectations were generated before the run, separately from the
  candidate runner; Node26 reproduction matches Node24 except version metadata.
- Audit: 781 raw RPC envelopes, 528 literal fixed-block return comparisons,
  36 signed transaction/receipt/header joins, 18 exact deployment/runtime pins,
  three static/mined links and all37 headers, blocks0–36.
- Supplement: all43 retained header replies have30M gas limits; exact6-role
  artifact inventory matches the sealed inputs; all41 pinned files unchanged.
  Three negative checks reject a missing role, role substitution and wrong gas limit.

`audit.json` and `supplemental.json` are actual successful verifier outputs;
`result/report.json` is the candidate output and is not the independent authority.
Independent post-run `packet-review.md` found no blocking mismatch and reproduced
the auditor output exactly, including both rollback states and the calibration.
`SHA256.json` inventories every retained file except itself and this README.
Raw bytes are copied unchanged. No compiler output, Anvil state/cache or node
history is included. Only public deterministic local test accounts were used.
The original `anvil.log` contains trailing whitespace and is deliberately
excluded from the otherwise passing whitespace check; its exact hash is retained.

## Limits and reproduction

Fixed-number reads are linked to mutually consistent retained headers, not
EIP-1898 requireCanonical calls or state-root proofs. This cannot exclude a
dishonest RPC. Passing these finite raw observations does not establish every
storage slot, contract-account historical proof, portability or future queries.

`audit.mjs` accepts the `result/` directory and expectation JSON as arguments;
it is an offline raw-packet verifier. Its original local dependency path and
the preparation/launcher absolute paths are retained as historical provenance,
not portable installation instructions. Reproduction requires the pinned source,
compiler/dependencies and appropriate paths. Do not replay the expired launcher
lease; any fresh chain/build requires its own coordinator-owned bounded lease.
The run's owned process groups were stopped; source worktrees remain preserved.
