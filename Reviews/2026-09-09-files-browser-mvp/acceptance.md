# Acceptance ledger — sixteen-journey walkthrough

**Status:** honest per-row record for THIS local prototype at the commit named
in the README. Vocabulary: `PASS` (joined automated test + inspectable browser
result), `COMPONENT` (proven at contract/SDK level, browser join partial or
untested), `FAIL` (attempted, does not meet the row), `NOT_RUN`.
Profile: local managed anvil, upgradeable fixture Core/carrier (profile
`reads`) + FilesRouterV1, disposable local test signers, synthetic operator.
This table claims nothing about public testnets, real wallets or production.

| # | Journey (testnet-files-mvp-plan) | Status | Evidence / honest gaps |
|---|---|---|---|
| 1 | Guest browse | PASS | `journeys.browser.mjs` step 1: nested browse + breadcrumbs, throwing `window.ethereum` proves zero wallet touches; only configured transports (relay allowlists in `scripts/server.mjs`); no `/wallet` `/relay` `/session` endpoints exist |
| 2 | Directory listings | PASS (small folders) / FAIL (deep churn) | Honest coverage badge + lanes; **the retained 64-name/60-retraction churn limit is NOT fixed** — deep-churn folders still exhaust the request budget before yielding files (`files-reader-scale/churn-findings.md`) |
| 3 | Create and upload | PASS | Folder, note and image with staged verified bytes; duplicate name refused on-chain (`ErrDestinationOccupied`), atomic multi-leaf admission (no half-published file: `router.test.mjs`) |
| 4 | Edit and history | PASS | Two revisions, old revision opens; stale edit loses the CAS race with a typed refusal and the draft preserved (router preflight + Core `ErrCasRevision`) |
| 5 | Rename and move | PASS | Atomic 4-leaf routed op; File Object id asserted unchanged; on-chain source/destination preconditions; folder-move cycle witness refuses `ErrCycle` |
| 6 | Copy and second placement | PASS | Copy mints a NEW File sharing exact bytes; Link adds a placement of the SAME File; editing the copy leaves the original (asserted) |
| 7 | Remove and restore | PASS | RemovalMarker + mask, Removed items list, restore with collision choice; no erasure claim; other placements survive; rename masks create no Removed item (`router.test.mjs` templates) |
| 8 | Lens switching | PASS | A-first/B-first/Both-agree over real disagreement history; Why? drawer explains selection, basis and coverage; conflict rows borrow nothing |
| 9 | Tags | PASS | Attributed assertions; A's untag preserves B's (asserted at binding level and in UI); identity unchanged |
| 10 | Filters and tables | COMPONENT | Positive name/tag filter over loaded rows with honest "hidden by filters / zero is not proof" copy; **no negative filters, no typed-record table** — tracked v1-parity gaps |
| 11 | Bytes and failures | COMPONENT | Verified-before-preview (digest re-check), unavailable-bytes ≠ absent (pixel.png demo), ≤16 KiB single-chunk only; **multi-chunk and alternate-provider recovery NOT built** |
| 12 | Wallet and cancellation | COMPONENT | One counted simulated approval per routine op (+1 labeled staging approval for uploads); cancel/Escape before submit has no semantic effect and is asserted; **real wallet prompts NOT tested — manual test left for James** |
| 13 | Permissions and races | PASS | Contract-side: unauthorized signer and unclaimed principal refused (mined rejections), stale CAS race guarded at Core, template forgery around the UI refused (`router.test.mjs`); guest UI exposes no write controls |
| 14 | Export and recovery | PASS (folder scope) | Export bundle (files+evidence+basis) re-verified fully offline by `verify-export.mjs` in a clean process; **subtree recursion not included** — single folder per bundle |
| 15 | Upgrade populated state | PASS | Live U1→U2 upgrade mid-journey: same addresses, rows and old revisions survive, host revision 2 visible, new write succeeds (`journeys.browser.mjs` step 12; foundation suite covers stale-plan refusal + rollback) |
| 16 | Independent use | COMPONENT | FilesRouterV1 is itself an on-chain consumer of `resolve` (plan-wide preconditions), and `UpgradeStaticConsumer` covers static reads; **a dedicated standalone Solidity Lens-consumer fixture comparing FOUND/ABSENT/CONFLICT/UNKNOWN against the browser was not rebuilt tonight** |

Ergonomics (`ux.browser.mjs`, PASS + screenshots in `evidence/browser/`):
320px reachability without horizontal scroll, keyboard-only create flow,
Escape-restores-opener, cancel-is-not-approval, 200% text without clipping.
Real-device and WAN behavior untested.

Read-path measurements (`evidence/read-path-perf.json`, loopback, 0/50 ms
injected per-RPC delay): qualify 36 requests (653 ms at 50 ms), full root
listing 56 requests (1,193 ms), **folder navigation on the shared pinned
scope 28 requests / 712 ms vs 82 requests for a fresh scope** (the simple
candidate the correctness-first ruling asked to compare — no segment
machinery needed at ordinary folder sizes), verified file open 9 requests /
322 ms. Deep-churn behavior unchanged (row 2).

Rows 2/10/11/12/16's gaps are the honest remainder; none is hidden behind a
green summary. The churn row (2) is the standing engineering priority from
the scale experiments, unchanged by this prototype.
