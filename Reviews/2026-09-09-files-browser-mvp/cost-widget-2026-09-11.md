# Floating cost widget — September 11, 2026

**Status:** verified local-prototype UI update; no contract, protocol or economic-readiness claim.

James approved a compact floating gas/USD button with an expandable comparison
instead of a large diagnostic form above the files. This patch builds on
`992773642ad7275706fc7ee4f43671921e24c0fa` in the existing shared prototype.

## Everyday surface

- Bottom-right button shows measured receipt gas and the selected network's estimated USD total; Base is the initial comparison, not a deployment selection.
- Expanding it shows Ethereum, OP, Base and Arbitrum comparisons and the five latest actions. Each action shows gas and estimated USD; expansion reveals exact gas, per-network costs and optional receipt/verification detail.
- Advanced settings, source timestamps, local-chain fees, read transport metrics, export, hide-resolved and reconciliation remain under Details & assumptions. No cost or unresolved-action history is deleted.
- Mobile uses a bottom sheet; Escape/outside click dismiss, focus and disclosure state survive updates, and short landscape viewports remain usable.

## Defaults and their limits

The immutable, editable initial snapshots are retained in `web/cost-ledger.mjs`
as `COST_PRESET`. Existing snapshots, including deliberate zero/incomplete inputs,
win over defaults. Historical receipt FX is never silently reassigned.

| Network | Sampled gas price (gwei) | Public RPC source |
| --- | ---: | --- |
| Ethereum | 0.055176333 | `https://ethereum-rpc.publicnode.com` |
| OP | 0.001000499 | `https://mainnet.optimism.io` |
| Base | 0.006 | `https://mainnet.base.org` |
| Arbitrum | 0.02002 | `https://arb1.arbitrum.io/rpc` |

Samples were taken September 11 at 21:15 UTC using `eth_gasPrice`; exact
timestamps, accompanying block numbers and chain IDs survive ledger export.
They are not block-pinned transaction quotes. ETH/USD uses the web-finance tool's
21:14:11 UTC observation of **$2,537.34**; that tool supplied no upstream
vendor/public quote URL, so the source string explicitly says so.

Rollup posting uses an **illustrative, uncalibrated 0.000001 ETH per transaction**.
Operator fees are excluded (input zero), not proven free. Local Anvil receipt gas
is an execution-work proxy, not measured EFS gas on another network. Arbitrum
posting is added once in separate-execution mode. These comparisons are neither
additive spending nor precise bills; chain-specific payload-aware fee estimation
remains follow-up work. The app does not fetch live quotes or silently refresh
manual assumptions.

## Verification

Fresh runs passed **31/31** ledger/default/panel/widget tests and **11/11**
chain-backed economics, wallet-harness and static-hosting tests. The latter use
disposable local chains, not funded public networks or vendor wallet UIs.

The reviewer caught a startup race: another tab's writer lock could prevent
default persistence, then a later raw journal reread dropped snapshots while
leaving their selected IDs. A regression reproduced `Unknown FX snapshot`; all
locked rereads now reseed/select consistently and the regression passes.
Additional red-to-green cases cover recent-action gas, mobile focus, retained
nested receipt details and short-landscape containment. Independent re-review
approved the bounded patch with no remaining actionable findings.

Commands, from the worktree root (reuse a coherent compiled Solidity build with
`EFS_TEST_BUILD_ROOT` when available; do not run parallel chain suites against it):

```sh
node --test Reviews/2026-09-09-files-browser-mvp/test/cost-defaults.test.mjs Reviews/2026-09-09-files-browser-mvp/test/cost-ledger.test.mjs Reviews/2026-09-09-files-browser-mvp/test/economics-panel.test.mjs Reviews/2026-09-09-files-browser-mvp/test/cost-widget.browser.mjs
node --test --test-concurrency=1 Reviews/2026-09-09-files-browser-mvp/test/economics.browser.mjs Reviews/2026-09-09-files-browser-mvp/test/static-hosting.browser.mjs Reviews/2026-09-09-files-browser-mvp/test/economics-wallet.browser.mjs Reviews/2026-09-09-files-browser-mvp/test/wallet.browser.mjs
```

The already-running browser was refreshed and visually inspected: the same
three photos-folder files and three recorded actions remained, totaling
14,346,401 gas. No server/chain restart, contract replacement or user-data reset
was needed. This supersedes only the earlier blank/manual-only gas-widget UX.
