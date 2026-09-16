# A clickable v2 Files workbench

September 16, 2026 · v2 PM · disposable integration prototype, not production or complete v1 parity.

James asked for a quick working browser before a clean-slate engineering pass.
V1 was inspected for behavior only. No v1 code, components or contracts were copied.

## What to try

Current local run: **http://127.0.0.1:57215/**. The older demo at port 60608 remains running.

- Browse as a guest. Open `docs/meeting.txt`; switch Alice → Bob to Bob → Alice.
- Open `docs/alice-only.txt` under Bob → Alice to see fallback.
- Open `photos/red.png`: the stored image now really renders.
- Open `docs/live-quote`: it reads `42 / true` from a separate contract at the displayed block.
- Enable **Try as Alice / Bob**. Create a directory and text file; upload; edit;
  rename; move; remove a placement and restore it; add File/revision tags;
  filter **with** or **without** a tag.
- The encrypted sample opens with `11` repeated 32 times. A wrong key is refused.
- Open the floating cost widget for actual local receipt gas and clearly dated
  illustrative network estimates. It now also shows logical RPC calls versus HTTP requests/batches.

Local test keys are public. No real funds, public deployment, Claude access, or
production repository was used. Stopping this run loses its temporary chain and
external byte fixture; it does not affect the older demo.

## What changed

The browser now uses the final compact Ledger/required `TagStanceIndex` deployment,
the typed Directory/carrier/live profiles, `FilesLiveLens`, `FilesJoinedConsumer`
and `LiveFilesPageReader`. These are existing v2 implementations from the core
closeout, newly connected into one browser. No kernel extension was necessary.

The reusable bounded read transport now works in browsers as well as Node. It
batches pinned read-only requests while leaving writes/preflight separate. The
old running server retains a compatible nonbatched path without a restart.

Browser additions: editable paths and file deep links; directory double-click;
URL-persisted ordered address Lenses; automatic verified inline opening; ordinary
PNG/JPEG preview with byte/pixel bounds; actual file upload and replacement;
same-filename update preserving File identity; with/without-tag filtering;
live-value display; explicit injected EOA wallet adapter. New text files can
use the cheaper direct inline v2 profile rather than always paying for carrier
descriptors. Carrier edits retain their original family.

The injected-wallet adapter is **implemented but not exercised with MetaMask**.
It uses the SDK's exact EIP-712 digest, checks account/network and preserves the
submission journal. It currently asks for a data signature and a transaction;
this does not satisfy the intended one-approval product UX.

## What the actual click-through established

Ten real local-chain writes from the browser: directory creation, file creation,
tagging, rename, move, remove, restore, external upload, same-name revision update,
and a larger upload. The journey retained File identity and its tag across rename
and move. The 64,026-byte upload opened with a checked digest; a 31-byte download
was found in Downloads with the expected contents. Browser automation did not
receive its download event, so the actual local file—not that event—was checked.

Guest reload recovered names/contents without a wallet. Direct file paths,
ordered Lens selection, lower-priority fallback, positive and negative tag
filters, real PNG preview, live contract observation and wrong/correct encryption
keys were exercised. The old port-60608 browser still loaded its existing files.

One measured cold/read navigation session used **175 logical RPC calls in 93 HTTP
requests, including 19 batches**, with zero reported transport errors. This is a
specific local sequence, not a public-provider latency or scalability benchmark.
The ten user actions totaled **17,845,438 local receipt gas**, excluding deployments
and seed setup. The 64 KB external upload used **2,604,293 gas** for EFS metadata;
its byte-store costs are not represented by that gas figure.

Focused verification: 28 existing transport/content/presentation checks pass;
syntax/whitespace checks pass; one small exclusion check confirms UNKNOWN tags
remain visible. No new unit-test framework or broad audit campaign. An Astra High
source review found two integration bugs—file deep links and accidental blank
replacement of unopened content—both fixed and rechecked. Clicking exposed and
fixed double-click loss from rerendering and removal leaving a stale file route.

## Remaining work before calling it a v1 replacement

1. **Real storage drivers and carrier links.** The larger-file store is an honest
   temporary fixture, not IPFS/Arweave or a durable onchain chunk carrier. Paste-URI
   files, durable locators/mirrors and larger multimedia remain unwired. Do not
   represent browser-local hints as portable authored storage metadata.
2. **Wallet/static hosting journey.** Exercise a normal wallet on a selected
   testnet, resolve the one-approval transport and export/test under an IPFS-style
   path prefix. This server serves generated configuration and optional local
   demo keys; it is not already a standalone public IPFS package.
3. **Extra application tools.** Properties, curated lists, persisted sorts,
   recursive own-placement deletion, full history and copy/link/export controls
   are not in this integrated UI. Public normalized Names/Commons identities and
   path-slot tags remain production-profile work, not silently waived requirements.
4. **New stance UX.** The required index supports the newer stance profile, but
   these browser buttons still use the separately tested generic File/revision
   tag semantics. ASSERT/DENY/SILENT controls and inverse/global tag search are not
   implied by this folder-filter demonstration.

These are concrete implementation gaps. The exercised basic folder/file loop did
not require redesigning the core. The broader closeout's expensive query/proof
limits still apply; this integration does not make them disappear.

## Reproduce / hand off

Code stays in the authorized existing prototype worktree on
`codex/efs-warroom-b-run` at **`414fe0e`**, under `Reviews/2026-09-12-efs-path-decision/lab-b/`.
Entry point: `script/workbench-browser.mjs`. Run with the existing ethers v6
package path (`EFS_ETHERS_PATH`), the coherent final-closeout Forge artifacts
(`FOUNDRY_OUT`) and Anvil (`ANVIL_BIN`). It starts a fresh pruned local chain and
prints its chosen ports. SIGINT/SIGTERM closes only that run's owned services.

For a clean-slate engineer, keep the tested **contract → SDK → browser** boundaries
and user journeys, not this DOM code. Start with [[compact-mvp-build-plan-20260914]]
and [[core-closeout-results-20260915]], then use this workbench to challenge the
replacement implementation. It is evidence and a usability reference, not the
production implementation to polish indefinitely.
