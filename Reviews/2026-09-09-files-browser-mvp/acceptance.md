# Acceptance ledger — sixteen-journey walkthrough

**Status:** honest per-row record for THIS local prototype at the commit named
in the README. Vocabulary: `PASS` (joined automated test + inspectable browser
result), `COMPONENT` (proven at contract/SDK level, browser join partial or
untested), `FAIL` (attempted, does not meet the row), `NOT_RUN`.
Profile: local managed anvil, upgradeable fixture Core/carrier upgraded in
place to the revision-3 authority pair (U3) + FilesRouterV2, disposable local
test signers; author intents are verified on-chain (EIP-712, per-account
nonces, executor binding) and the operator key is never served to the browser.
This table claims nothing about public testnets, real wallets or production.

| # | Journey (testnet-files-mvp-plan) | Status | Evidence / honest gaps |
|---|---|---|---|
| 1 | Guest browse | PASS | `journeys.browser.mjs` step 1: nested browse + breadcrumbs, throwing `window.ethereum` proves zero wallet touches; only configured transports (relay allowlists in `scripts/server.mjs`); no `/wallet` `/relay` `/session` endpoints exist |
| 2 | Directory listings | PASS (measured to 512 lifetime names) | Honest coverage badge + lanes; budgets raised (4,096 requests / 32 MiB) + page 32 + transport batching: the retained 64/60-churn shape now completes in 414 requests (2.43 s at 50 ms; was 7.7 s / refusal at page 4), 512-lifetime/48-live (2,988 requests) and 300-live (3,410 requests) folders enumerate COMPLETE through the ROUTED world (`test/churn.perf.mjs`, `evidence/churn-perf.json`); per-position cost is protocol-shaped (first-mutation inventory) — folders far beyond 512 lifetime names remain unmeasured |
| 3 | Create and upload | PASS | Folder, note and image with staged verified bytes; duplicate name refused on-chain (`ErrDestinationOccupied`), atomic multi-leaf admission (no half-published file: `router.test.mjs`) |
| 4 | Edit and history | PASS | Two revisions, old revision opens; stale edit loses the CAS race with a typed refusal and the draft preserved (router preflight + Core `ErrCasRevision`) |
| 5 | Rename and move | PASS | Atomic 4-leaf routed op; File Object id asserted unchanged; on-chain source/destination preconditions; folder-move cycle witness refuses `ErrCycle` |
| 6 | Copy and second placement | PASS | Copy mints a NEW File sharing exact bytes; Link adds a placement of the SAME File; editing the copy leaves the original (asserted) |
| 7 | Remove and restore | PASS | RemovalMarker + mask, Removed items list, restore with collision choice; no erasure claim; other placements survive; rename masks create no Removed item (`router.test.mjs` templates) |
| 8 | Lens switching | PASS | A-first/B-first/Both-agree over real disagreement history; Why? drawer explains selection, basis and coverage; conflict rows borrow nothing |
| 9 | Tags | PASS | Attributed assertions; A's untag preserves B's (asserted at binding level and in UI); identity unchanged |
| 10 | Filters and tables | COMPONENT | Positive name/tag filter over loaded rows with honest "hidden by filters / zero is not proof" copy; **no negative filters, no typed-record table** — tracked v1-parity gaps |
| 11 | Bytes and failures | PASS (≤1 MiB) | Verified-before-preview (digest re-check), unavailable-bytes ≠ absent (pixel.png demo); law-correct multi-chunk trees to 1 MiB: 22.5 KiB/6-chunk note in-browser (`journeys.browser.mjs` 5b), 10 KiB/3-chunk with interruption + out-of-order resume and single-signature admission (`authority.test.mjs`); partial staging is resumable from the file panel (missing chunks only); **alternate-provider recovery NOT built** |
| 12 | Wallet and cancellation | PASS (harness) / COMPONENT (real wallet software) | **Real EIP-1193 path** (`wallet.browser.mjs`): sponsored mode = exactly ONE `eth_signTypedData_v4` request per change (asserted against the provider's own request log), wallet balance unchanged and sponsor balance reduced — author/signer/submitter/payer separated; direct mode = 1 signature + 1 prompt per transaction, counted, never a silent fallback; connect + one-time claim counted separately; wallet-rejection, expired-intent and ambiguous-submission paths asserted. Simulated-signer mode retains **ONE approval per operation, content writes included** — the single EIP-712 author intent covers records + byte commitment, and chunk staging is permissionless (no second dialog exists to hide); cancel/Escape before submit has no semantic effect and is asserted; **real wallet prompts NOT tested — simulated dialogs are not real-wallet evidence; manual test left for James** |
| 13 | Permissions and races | PASS | Core-enforced author authority (`authority.test.mjs`): impersonation refused with a mined rejection, replay refused by per-account nonce (`ErrIntentNonce` at Core, proven on an op with no destination precondition), direct-Core bypass refused (`ErrExecutorBinding`), router forgery (`ErrRoutedExecutor`) and op tampering (`ErrOpCommitment`) refused, expired deadline refused, stale-era intent refused after a further upgrade; guest UI exposes no write controls |
| 14 | Export and recovery | PASS (folder scope, tiered trust) | **Authenticated** `EFS_FILES_EXPORT_V1`: record graph, selection, content keyed by ChunkTree id, block header, mount-root path chain and the full pinned transcript, re-derived offline by `verify-export.mjs` in a clean process. Claims are separated into SELF-CONSISTENT / TRANSCRIPT-ATTESTED / ANCHOR-DECLARED / NOT-PROVABLE-OFFLINE, with a `--recheck-manifest` for replay against an RPC you trust. 15 hostile mutations refused (`export-roundtrip.test.mjs`); the previously-certified fabricated bundle is refused (`export-verifier.test.mjs`). **Honest limits:** a fabricated-but-coherent bundle still passes the self-consistency tier — only the anchor check plus manifest replay closes that; listing completeness and revision currency are transcript-attested, not proven offline; **shallow** (one folder, no subtree recursion) |
| 15 | Upgrade populated state | PASS | Live in-place upgrade of the POPULATED authority pair mid-journey: same addresses, rows and old revisions survive, host revision 3 visible, new one-approval write succeeds (`journeys.browser.mjs` step 12; foundation suite covers stale-plan refusal + rollback) |
| 16 | Independent use | COMPONENT | FilesRouterV1 is itself an on-chain consumer of `resolve` (plan-wide preconditions), and `UpgradeStaticConsumer` covers static reads; **a dedicated standalone Solidity Lens-consumer fixture comparing FOUND/ABSENT/CONFLICT/UNKNOWN against the browser was not rebuilt tonight** |

Ergonomics (`ux.browser.mjs`, PASS + screenshots in `evidence/browser/`):
320px reachability without horizontal scroll, keyboard-only create flow,
Escape-restores-opener, cancel-is-not-approval, 200% text without clipping.
Real-device and WAN behavior untested.

Read-path measurements (`evidence/read-path-perf.json`, loopback, 0/50 ms
injected per-RPC delay, re-measured 2026-09-10): qualify 36 requests (325 ms
at 50 ms), full root listing 57 requests (1169 ms), **folder navigation on the
shared pinned scope 29 requests / 718.6 ms vs 83 requests for a fresh scope**
(the simple candidate the correctness-first ruling asked to compare — no
segment machinery needed at ordinary folder sizes), verified file open 9
requests / 333.9 ms. Each listing step costs one page read more than the
2026-09-09 baseline: that is the reserved wallet principal being enumerated
as a third namespace source. Deep-churn behavior unchanged (row 2).

Static builds withhold signer keys by default (`export-static.mjs` whitelists
config fields and refuses to write a build containing a disposable author
key); the local write journey opts in explicitly. Asserted in
`static-hosting.browser.mjs`.

Standalone static hosting (`test/static-hosting.browser.mjs`): the exported
browser (`scripts/export-static.mjs`) served by a GENERIC file server talks
directly to the explicitly configured JSON-RPC endpoint — read AND
one-approval write journeys pass with zero EFS-specific endpoints, and every
network request is asserted to touch only the two configured origins.

Completeness composition (`test/completeness-regressions.test.mjs` +
`test/completeness.browser.mjs`): budget-exhausted enumeration never claims
COMPLETE or fabricates ABSENT; exhausted point lookups are UNKNOWN, never
ABSENT; one scope at one basis keeps aFirst/bFirst/exact closures isolated
under repeated cached reads; exhausted openRemoved is UNKNOWN (the browser
now renders it "currently unreadable", never as an empty list — a live bug
this pass fixed); the Export control is withheld until the listing is
COMPLETE and the bundle carries the claim.

Rows 10/12/16's gaps are the honest remainder; none is hidden behind a green
summary. Row 2 beyond 512 lifetime names and alternate-provider byte
recovery (row 11) are the standing engineering priorities.
