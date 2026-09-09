# Browser latency control

**Status:** measured September 9 on the unchanged `efs-lab/1` browser at
`9b62c427e3f5d732bae16d2ba16c770473f22c3c`; not full-C0/v2 performance or parity.

## What was exercised

Three fresh Chromium contexts per arm opened the exact eleven-file fixture
directory, rendered eight rows, then loaded the remaining three. The delayed
arm added 50 ms before forwarding **each** browser `/rpc` request; static files
were not delayed. This models sensitivity to RPC round trips, not a real WAN,
provider service level, percentile distribution or chain confirmation time.
Node 26.0.0; Chromium 148.0.7778.96; desktop 1440 × 960; local managed Anvil.
Other local work was running, so these are diagnostic samples, not isolated CPU
benchmarks. Setup/deployment was excluded from the two interaction timings.

| Added per-request delay | First eight rows: samples (ms) | Next three rows: samples (ms) |
| --- | --- | --- |
| 0 ms | 1840, 1843, 1840 | 820, 821, 814 |
| 50 ms | 6881, 6876, 6888 | 2833, 2837, 2840 |

All six samples kept one displayed basis, transitioned PARTIAL to COMPLETE,
made zero wallet/relay/session calls, and had zero page errors or external
requests. These are functional passes; **6.88 seconds for eight rows is not a
good browsing result**. Three samples do not support a p95 claim.

RPC counts were identical across samples:

| Method | First eight rows | Next three rows |
| --- | ---: | ---: |
| eth_chainId | 10 | 4 |
| eth_getBlockByNumber | 1 | 0 |
| eth_getBlockByHash | 9 | 4 |
| eth_getCode | 20 | 8 |
| eth_call | 50 | 20 |
| **Total** | **90** | **36** |

## Cause and consequence for the v2 join

The [Files renderer](../2026-09-04-mvp-rehearsal/web/files-view.mjs) awaits
each row's exact read sequentially before replacing the table. The
[SDK read adapter](../2026-09-04-mvp-rehearsal/sdk/index.js) repeats chain/block,
two runtime hashes and four deployment-fact calls for every exact/page read.
The observations above match those source paths. Hash/contract validation
itself is not the measured cause of network latency; repeated serial requests
are the primary diagnosed round-trip cost.

The next SDK integration should test one scoped, evidence-retaining read
operation at a fixed source/block/deployment/profile, reuse its successfully
verified deployment evidence and hydrate a bounded number of rows concurrently.
Retain result ordering, exact-target checks and generation cancellation. Do not
remove checks, cache failed verification as success, share mutable observations
between bases/sources/upgrades, or infer complete listing from loaded rows.
Actual C0 hydrated pages may reduce row calls further; measure them instead of
copying the smaller laboratory's per-row API overhead.

This finding does not yet implement an SDK optimization or set a production
latency guarantee. It supplies an A/B control for the consumer work.

## SDK PM review: smallest existing-seam improvement

The SDK PM returned a read-only advisory in task
`01a02a24-01b3-7f12-9f2e-887aea66e9e8` on September 9. Its existing
`codex/sdkv2-pm` design branch was verified at
`e9536b7d97d3e3f8d135798458680686b034e892`; the source is
`Designs/sdkv2/exp-c0-mvp-packet.md`. That branch's packet is not present in this
worktree; this is attributed design input, not an implicit branch merge.

- Keep `createReader({ source, context })` and the pinned exact/page seams.
  A logical read scope owns one immutable evidence table, not a global
  deployment cache. Concurrent calls share one in-flight verification attempt;
  required checks must all succeed before any dependent data calls begin.
- Scope includes source instance/connection epoch, chain/block/finality,
  accepted artifact/profile/ABI/capabilities/limits, Realm/revision/H and the
  observed complete execution set. Proxy shell codehash alone is insufficient.
  Every data call keeps its exact block-hash/canonicality requirement.
- Prefer a verified, budget-compatible hydrated endpoint; otherwise test an
  ordered worker pool of four. Keep per-row failures and all failed attempts.
  Do not make good rows disappear because one row fails, or let incomplete
  hydration erase already proven enumeration coverage.
- Refresh, source/epoch/chain change, scope abort, route generation, deadline,
  profile or observation changes start a fresh scope. Later upgrades do not
  rewrite pinned historical evidence. Query/mode/order/limit changes invalidate
  their page stream, not necessarily still-matching deployment evidence.
- Stop scheduling on abort; uncancelable late reads belong only to the dead
  scope. Seal an aggregate with a final same-basis canonical/execution check
  before presenting its current/complete qualification. Test the actual seal
  ABI and cost; do not assume one call can verify an arbitrary dependency graph.

The suggested factorial comparison is A: existing serial/repeated verification;
B: scoped verification with serial hydration; C: same scope with concurrency
four. Use the same 0/50 ms arms, ordered rows, expanded evidence and outcome
axes. Source accounting predicts **19 versus 90** first-page requests and
**5 versus 36** continuation requests if the selected lab can seal with one
call; these are **unmeasured analytical targets**, not C0 performance promises.
Record response bytes and maximum in-flight requests as well as elapsed time.

Before adopting the optimization, test hydrated-array/target substitution,
over-budget success and revert data, one failed row among out-of-order siblings,
same-block U1 acceptance/U2 observation, reorg between pages and final seal,
abort/provider replacement, and failed single-flight verification followed by a
fresh successful scope. No Core/profile or production API changes are selected.

## Environment and reproducibility

The first run could not launch Playwright's default revision 1234 because that
browser binary was absent. No application test executed in that attempt. The
documented `EFS_LAB_CHROMIUM` override selected the already-installed revision
1223 instead; all nine `test/files-ui.browser.mjs` checks then passed in 2.61 s.
No dependency install, source patch or permanent environment change was needed.

From the rehearsal directory, run `node --test test/files-ui.browser.mjs` with
`EFS_LAB_CHROMIUM` set to an installed compatible Chromium executable. For the
probe, start `scripts/demo.mjs` through its exported `startDemo`, use fresh
Playwright contexts, and time the exact-directory route until `sample-08.txt`
is visible, then the Load more click until `sample-11.txt` is visible. Read
`demo.counts` before/after each stage. In the delayed arm, intercept `**/rpc`,
wait 50 ms and continue the unmodified request. Assert row counts 8/11,
PARTIAL/COMPLETE, unchanged basis, read-only channels, no page errors and no
external requests. Close every context, browser and managed demo in `finally`.
The initial six samples were an ad hoc read-only diagnostic; no new benchmark
framework or retained automated performance gate is claimed.
