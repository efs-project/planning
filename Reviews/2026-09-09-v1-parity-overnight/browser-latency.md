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

## Mobile and keyboard control, September 9

A separate read-only probe used the unchanged rehearsal sources at `aba0b4c`
(the following `c4098d4` changes only planning files). Before starting the
managed chain, both EfsLab artifacts' metadata source hashes were compared
with their actual Solidity source files. No rebuild or dependency install was
needed. Chromium and the eleven-file fixture were the same as above; these
are two functional observations, not timing samples or an accessibility audit.

| Check | Phone, 390 × 844 | Desktop, 1440 × 960 |
| --- | --- | --- |
| Document/body width | 390 / 390 px | 1440 / 1440 px |
| Files table / scroll-container width | 358 / 358 px | 732 / 732 px |
| Loaded rows | 8, then 11 | 8, then 11 |
| Focused first row + Enter | Opens sample-01.txt and its verified text | Same |
| New-folder dialog width / height | 354 / 808 px | 570 / 846.44 px |
| Initial dialog focus | Name input | Name input |
| Escape after entering an unsubmitted name | Closes; focus returns to New folder | Same |
| Wallet, relay or session calls | 0 | 0 |
| Page errors / external requests | 0 / 0 | 0 / 0 |

The test focused the row directly, then pressed Enter; it did **not** prove
the complete Tab order, screen-reader announcements, touch targets, zoom,
virtual-keyboard behavior or usability on physical phones. No signature or
write was attempted. The small fixture had no document-level horizontal
overflow. A tall, internally scrollable dialog still needs a physical-phone
check with the virtual keyboard open.

A further fresh 320 × 568 context reproduced a keyboard paging gap. After
focusing Load more and pressing Enter, all eleven rows appeared but focus
became `BODY`; the next Tab reached Copy evidence, not the new rows. In
`files-view.mjs`, `renderPage` disables the focused control during the read,
replaces the rows and hides that control at completion, with no focus handoff.
The new-folder dialog provides the useful contrasting behavior: explicit
initial Name focus, native modal Tab navigation and restored opener on Escape.
At this narrower viewport, Tab reached Cancel and scrolled it into view
(bottom526.94 px in a568 px viewport); document width remained320 px. No wallet,
relay/session calls or page errors occurred. Evidence was actually hidden.

The joined screen needs a regression for focus during and after asynchronous
paging, including a failed/retried page and route cancellation. Preserve the
user's list position when a continuation control disappears; do not steal
focus after the user has moved elsewhere. The observed defect is recorded,
not patched in this control browser, and no complete keyboard audit is claimed.

The other UX gap is that `web/styles.css` hides the Evidence pane
below 1100 px. `web/workflow-app.mjs` retains a Copy evidence export, but that
is not a readable mobile “Why this result?” view. The joined v2 screen should
provide an accessible inline disclosure or sheet for basis, completeness,
conflict and verification details. Keep the plain-language result visible;
raw IDs/JSON should be optional. This is a consumer acceptance item, not a
reason to redesign the Core or claim this control browser is already v2.

Reproduce by starting `startDemo({ compileFirst: false })` only after those
artifact source-hash checks, opening a fresh context at each viewport and the
exact fixture-directory route, then loading its second page. Focus the first
row, press Enter and wait for enabled verified download plus exact file text.
Return to the directory, focus New folder, press Enter, fill only Name and
press Escape. Check dialog closure, restored focus, geometry and read-only
channel counts; close browser contexts and the managed demo in `finally`.
