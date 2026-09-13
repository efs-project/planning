# Independent paid-run gate — disposable prototype

This separate experiment does not alter the earlier oracle, its profiles or
its retained results. `paid-controller.mjs` is a self-contained Node-builtins
module implementing B's two awaited controller hooks. It consumes an
independently prepared **pre-run** arm file, not a candidate packet. Its default
export pins the separately authored seven-row neutral JSON by its exact SHA256.

The controller rechecks all three pinned files, expected source/build metadata,
the input bundle and selected cells. It makes its own read-only RPC requests
against the named block: chain/client, runtime bytes and explicit predeclared
state calls. Before each ACK it exclusively creates an observation/ack file in
the independent operator's directory, separate from the runner's files. It
checks the observation block again after the reads. A mismatch throws; no ACK
is returned. Runtime/state/RPC failures also retain an exclusive refusal file
containing partial observations, without an ACK; malformed parsed RPC envelopes
retain the request/response. Failures before trusted arm-file loading do not
use an unverified retention path. Runner timeout/no-downstream-send enforcement
belongs to the separately reviewed candidate integration.

## Operator arm-file shape

`schema = efs-paid-arm/1`; `runId`; `chainId`; `expectationsSha256`;
`retentionDir` (absolute run-local directory); `source` and `build` (the exact
objects expected in the first context); `plannedCells`; `firstCell`;
`inputs` (the physical bundle derived by the independent B vector module);
`targets` (`label -> {address, runtime}`); `initial.registryEpoch`;
`checkpoint` (the exact static post-B1 frontier/generation/epoch/Core/Realm
fields); `checks.beforeFixture` and `checks.afterB1`.

Each check is `{label, to, data, expected}`: destination, full ABI calldata,
and exact expected raw return bytes, all independently calculated and pinned
before fixture execution. Targets carry complete expected runtime bytes from
the independently verified compiler artifacts and constructor substitutions.
No candidate boolean, parsed reply or runtime hash defines these expectations.
All contract calls use a fixed numeric block tag, with the matching block hash
checked before and after. This is an RPC-observed consistency check, **not**
an authenticated Ethereum state proof.

The before-fixture checks require `counts`. The post-B1 checks require the
labels `counts`, `registryEpoch`, `indexGeneration`, `coreCodeCommitment`,
`realmId`, `aPlacement`, `bPlacementAbsent`, `aHead`, `bHead`, `scopeA`, and
`scopeB`. These labels prevent an accidentally empty check set; they do not
prove that the operator encoded each claim correctly. Exact raw-call mapping
and all arm-file bytes need independent review before a measurement is eligible.

The controller has **no local-module dependencies**. If the candidate runner
requires an explicit dependency list, use `localDependencies: []` in the arm
file. The separately run vector authoring tool is pinned when its output is
sealed; it is not imported or executed by the controller.

## Current standing and next step

The transport/pin gate has synthetic unit tests, including a real loopback HTTP
test for malformed JSON-RPC envelopes. It has not yet gated a deployed paid
slice. The B vector implementation is separate; a full arm manifest with fresh
source/artifact/runtime and exact public-read mappings remains to be prepared.
C needs its own native physical inputs; do not insert B's representation into
C. This module currently accepts only B's context/ack schema.

Run `node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-controller.test.mjs`.
No Anvil, compiler or package installation is used by these tests. Temporary
test directories are small, run-owned and retained; no global cleanup runs.
