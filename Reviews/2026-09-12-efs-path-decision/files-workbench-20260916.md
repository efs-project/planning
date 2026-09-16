# A clickable v2 Files workbench

September 16, 2026 · v2 PM · disposable integration prototype, not production or complete v1 parity.

> Latest September 16 checkpoint: **http://127.0.0.1:60627/** now runs Vite; RPC is **http://127.0.0.1:8545**, chain **31337**. The three older demo chains were retired with James's disposable-state authorization. See the final continuation for static-build and actual v1 comparison evidence; earlier ports below are historical.

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

## September 16 continuation — wallet and external files

Code checkpoint **`53e2e30`** on the same prototype branch. New local UI:
**http://127.0.0.1:60627/**; RPC **http://127.0.0.1:60615**, chain **31337**.
The older 57215 and 60608 runs were preserved. This remains temporary local data.

### James's wallet walkthrough

1. Open the new UI in the browser containing MetaMask, not the Codex embedded browser.
2. Unlock MetaMask yourself; click **Connect wallet** or **Connect & set up network**.
3. Approve the local network. If chain 31337 already points at another Anvil,
   edit its RPC to the exact URL above. The app checks the actual block and
   deployed Ledger code, not just the chain number.
4. Click **Get local test ETH**. This only changes a loopback Anvil balance;
   there is no real ETH payment and no demo-key import.
5. Create a folder/file, upload, edit, tag, rename, move, remove and restore.
   The wallet address is added first in the ordered Lens, ahead of Alice/Bob.

Each write still has **two approvals: typed data signature, then transaction**.
That product-UX gap is unchanged. Account/network changes invalidate the active
writer. A scoped independent review found and helped fix an asynchronous wallet
session-change race; explicit transaction chain IDs were added as defense in depth.

Chrome discovered MetaMask and opened its actual unlock prompt. Testing stopped
there for James; no actual MetaMask approval is claimed. Separately, a fresh
disposable signer through `ethers.BrowserProvider` and the EIP-1193 interface
completed eight real Anvil writes, each followed by canonical effect read-back:

| Action | Receipt gas |
|---|---:|
| Create directory | 1,868,680 |
| Create text file | 1,903,193 |
| Edit | 1,293,411 |
| Tag | 1,195,105 |
| Rename | 1,553,995 |
| Move | 1,546,564 |
| Remove placement | 901,060 |
| Restore placement | 999,177 |

This is wallet-protocol evidence, not a substitute for the owner's MetaMask UI journey.
Reproduce with `script/wallet-workflow.mjs <local-config-url>` and the existing
ethers dependency. It creates only disposable test data on the explicitly named local run.

### Arweave and IPFS now work as file links

New/edit file accepts `ar://transaction-id` and `ipfs://CID/path`. The browser
retrieves existing public bytes, saves their locator/length/SHA-256 in a new
exact content Type, and verifies future downloads against that authored fingerprint.
The old 352-byte descriptor Type/rule is not reinterpreted. This is not a native
Arweave inclusion proof or an IPFS DAG verifier, and contracts cannot fetch either
network themselves. Paid Arweave upload and IPFS pinning remain unimplemented.

Actual public Arweave (36,795 bytes) and IPFS (12,435 bytes) samples opened as
verified raster previews in the browser. The UI-created `docs/ar-link-test.bin`
survived a cold guest reload and reopened from its onchain locator. Its reused
content registration used 2,089,945 gas; do not mistake deduplication for the
fresh-file baseline. Public gateways require an explicit fetch choice; not yet
downloaded is no longer mislabeled unavailable. Unavailable and corrupt byte
fixtures stay distinct. Bounded fallback can try another gateway after corruption.

Matched fresh-state registration measurements with Arweave-shaped descriptors:

| Declared payload size | Gas | Transaction calldata |
|---|---:|---:|
| 1 KiB | 2,602,168 | 3,428 bytes |
| 1 MiB | 2,602,155 | 3,428 bytes |
| 16 MiB | 2,602,131 | 3,428 bytes |

These synthetic registration sizes do not claim newly uploaded Arweave objects.
Storage upload fees and L2 DA/operator costs are excluded. Payload size does not
drive EFS registration gas, but **the fixed roughly 2.60M gas cost remains**.

One useful design constraint emerged: the required scalar/digest index assumes
specific descriptor word offsets. A 71-byte packed candidate failed that index;
the working external profile keeps a 192-byte header (240 bytes with an AR locator).
This is an optimization/coupling issue for the clean-slate implementation, not
permission to weaken the required index or silently change an existing Type.

Final focused verification: **44 JS checks and 3 Solidity profile checks pass**,
plus the real-chain wallet journey, public-carrier integration and UI/cold-read
checks above. No broad new audit or v1 code reuse. Entry point remains
`script/workbench-browser.mjs`; coherent artifacts must include the new
`FilesExternalContentProfile.sol` alongside the final-closeout contracts.
`script/external-content-integration.mjs` reproduces the carrier/cost evidence.

Next gaps: owner MetaMask click-through; paid/durable upload workflow; one-approval
transport; static/IPFS-hosted packaging; remaining extra application tools from
the original list. Do not restart architecture research to polish this disposable UI.

## September 16 continuation — Vite, stable Hardhat RPC, static build

Code checkpoint: **`1d817a4`** on the existing `codex/efs-warroom-b-run` branch.

The existing prototype now has pinned Vite 8.3.0 and ethers 6.15.0 dependencies.
Vite serves UI 60627; a separate process owns the pruned Anvil chain on RPC 8545,
chain 31337. Restarting the UI no longer redeploys contracts or resets the chain.
Explicit alternate ports remain available for parallel runs. Vite refuses an
occupied requested port rather than silently changing the URL. The older owned
UI 57215/60608/60627 runners and their three chains were stopped; their volatile
test state is gone, but source and evidence files were not deleted.

### Run it

From `Reviews/2026-09-12-efs-path-decision/lab-b/` in the existing prototype checkout:

```sh
npm ci
# First prepare coherent artifacts for the current source; requires Foundry.
forge build --skip test --skip script
# Terminal 1: owns the disposable local chain, deployment and seed.
npm run chain
# Terminal 2: Vite only; safe to restart without resetting the chain.
npm run dev
```

`FOUNDRY_OUT` can point to an already-built coherent artifact directory;
`ANVIL_BIN` selects Anvil when it is not on PATH. The current run reuses the
coherent final-closeout plus external-profile artifacts from the preceding
session; no Solidity source changed in this pass. `EFS_RPC_PORT=0` asks the
chain runner for an ephemeral port, or set an explicit alternate. For another
UI, set the same `EFS_UI_PORT` in both terminals so the optional raw-byte test
fixture permits that UI origin. Defaults stay 8545 and 60627.

For MetaMask use the existing Hardhat network if it points to
`http://localhost:8545` or `http://127.0.0.1:8545`, chain 31337. The app's explicit
add-network button and copy-RPC fallback remain. The browser still checks actual
deployment identity, not merely the chain ID. Do not import demo keys into a
real wallet. A reset local chain may require clearing stale wallet activity if
the wallet reports an old nonce; this pass did not change wallet settings.

### Static-SPA evidence

`npm run build` emits `dist/`: HTML/CSS/JS plus an ordinary deployment
`config.json`. Relative assets/config and hash routes support path-prefix
hosting. The build excludes demo keys, disables the local faucet/demo signers,
and omits the temporary raw-byte store origin. There is no application API,
RPC proxy, server-side file listing, signing service or backend cache.

With Vite actually stopped, `npm run static` served only these files under
`http://127.0.0.1:4173/ipfs/local-workbench/`. A cold deep link opened
`docs/meeting.txt`; reversing the Lens changed Alice's 10:00 text to Bob's 11:00;
`photos/red.png` rendered from 70 verified onchain bytes. Static assets/config
returned 200; demo-wallet and traversal probes returned 404. The static test
caught a production-only entrypoint omission: Vite's HTML transform now runs
before module-graph extraction. The corrected build was browser-retested.

An EIP-1193 harness using this static manifest completed eight real local-chain
writes (directory/file/edit/tag/rename/move/remove/restore), all with independent
effect reconciliation. This is not an actual MetaMask extension approval test.
Vite then restarted on 60627; the original block 79 hash remained unchanged.
CSS hot reload was observed without losing the open folder. 34 focused existing
JS checks passed. An independent Astra High review found no remaining
Critical/Important issue in this migration.

**Boundary:** this proves static packaging against a local RPC, not a public
IPFS deployment or public-network wallet journey. Existing wallet setup helpers
deliberately require an HTTP loopback origin; HTTPS/public-network setup remains
follow-up work. Paid Arweave uploads and IPFS pinning still need storage drivers.
Minor runner follow-up: install cleanup earlier so a direct termination during
initial deployment cannot orphan Anvil. Some static-build help copy still
describes the development-only raw-byte fixture; it is not shipped as a service.

### V1 was now run, not just inspected

A separate Astra High worker used an isolated snapshot of canonical
`contracts/packages/nextjs` at `c6b4075308dd37bb36665eabecb66ec8b47fc7dd`, with
RPC 59680/UI 59681. No v1 code entered v2 and canonical v1 checkouts were unchanged.
The worker reported 153 fresh contract checks and 34 client utility checks
passing, and verified relevant artifacts against current-source build-info.
This reused matching compiled artifacts; it was not a fresh v1 compilation or
the full v1 suite. Output is retained in the review task transcript, not a new
checked-in log bundle. Contract coverage comprised PIN/TAG/filtered FileView/
WHITEOUT (128), selected FileView fallback/placement/empty-folder cases (5),
and duplicate/canonical-name cases (20); the four client utility suites cover
upload, transports, fetchFileContent and excludeFilter.
In the real browser, explicit seed-author Lenses recovered `docs/images/shared`,
`shared/photo.png` rendered, and Lens reversal changed its mirror author. Both
comparison services were then shut down. Client utility checks use mocked
clients; this is not evidence of paid storage or public-chain writes.

The v1 launcher already supports dynamic per-run ports. We followed that
operational separation without copying it; the user-facing v2 run keeps the
standard wallet endpoint. Avoid root v1 `yarn preview` in a read-only checkout:
its deploy chain can rewrite sibling client ABI files.

| Hidden behavior | Concrete v2 follow-up |
|---|---|
| V1 revoking one's PIN permits lower-author fallback; WHITEOUT separately blocks fallback | V2's current remove is a mask. Distinguish withdrawal from masking in controls; run both Lens orders and restore. |
| V1 folder removal recursively revokes own placements/tags | V2 currently removes only the directory placement. Test nonempty folders and direct descendant routes; do not call it recursive deletion. |
| V1 checks canonical names, collisions and replacement | V2 lowercase ASCII is still a prototype limit. Test file/folder collision and stale replacement confirmation. |
| V1 negative/cross-author tags and empty continuation pages have specific behavior | Exercise revision replacement and cross-author tag filtering without treating UNKNOWN as absent; newer stance semantics are not the same as weighted v1 labels. |
| Shared DATA can have distinct placement authors; mirrors are attributed | Keep File identity, selected revision and placement author separate. Copy/link and multiple-mirror UI remain unwired. |

Highest-leverage next parity check: a small **withdraw / mask / nonempty-folder /
restore** matrix under both Lens orders, rather than another broad UI rewrite.
