# September 11 joined Files browser checkpoint

Status: reviewed local prototype evidence, not production readiness or a protocol freeze.

## What is usable

The same browser/SDK path now supports root-qualified guest links, nested folders,
binary and empty uploads, verified inert downloads, independent copies, shared
names, removal/restoration, old-version inspection and restoration as a **new**
version. Renamed/rebound links cannot silently open another File. A navigation
requested during approval cannot retarget the write or be overwritten when the
old edit finishes. See [walkthrough](walkthrough.md).

The expandable Gas & cost panel records actual local receipts for each action,
including staging, sponsored payment and mined reverts. Data-effect verification
is separate. Four manual Ethereum/OP/Base/Arbitrum scenarios retain explicit fee
and FX assumptions; they are not live quotes. Missing components remain unknown.
Read RPC/HTTP/byte measurements are separate from paid transaction gas.

## Exact evidence, not one undifferentiated test total

| Layer | Fresh result | Scope |
| --- | --- | --- |
| Complete browser control | 17/17 actual Chromium/chain checks | Solidity control `4de8157` plus explicitly mirrored final JavaScript; ordinary journeys, static hosting, wallet harness, recovery, continuation, phone/keyboard/layout, export and populated same-layout upgrade. |
| Pure browser/recovery/transport checks | 68/68 | Exact final app and helpers; not a wallet or chain claim. |
| Fable candidate SDK integration | 14/14 | Fresh candidate world using `2182cb0` Solidity; all ten operation kinds and exact authored/selected read-back. |
| Fable candidate browser integration | All four new journeys, three economics/continuation cases, everyday populated upgrade and static-hosting case pass | Same actual candidate, not just the control. The first combined run had one stale expected-error-text assertion; after its strengthened test-only repair, both wallet cases and all four signed-guard/economics-wallet cases passed. |
| Strict direct RPC transport | 22/22 | Out-of-order responses are allowed; missing/duplicate/foreign IDs, malformed envelopes and HTTP failures refuse before exposing a batch result. |

The candidate and control are separate sources. Candidate-layout U1→U2/U3 tests
do **not** establish migration from the old storage-bytes layout into code pointers.
The important final JavaScript SHA-256 pins are:

| File | SHA-256 |
| --- | --- |
| `web/app.mjs` | `47175da9602dada97db5ce901f19a8cf99356feffac52b8c351f50e9efb8816d` |
| `test/file-journey.browser.mjs` | `b536ff91b624fbffe22038c471fe7aa4fd57a43481bd26bd5e476a1381a34b01` |
| `test/wallet.browser.mjs` | `077da3c2de66cd43d89e48b911a7d322b5ac0cacedd11cb0cf2485f7a4c4e561` |
| `web/rpc-source.mjs` | `9024ec2ee3edc78eb775bb18434340f682f6fde192973bad2dfd34a8b0d35b1d` |

Run the named `.browser.mjs` files under `test/` with `node --test
--test-concurrency=1`, using an isolated `EFS_TEST_BUILD_ROOT`. First build should
set `EFS_TEST_FULL_BUILD=1` to produce a coherent foundation artifact bundle.
The older control remains reproducible only with its recorded Solidity basis;
running today's branch exercises the candidate instead.

## Defects caught and repaired

- JSON object key order incorrectly invalidated persisted semantic recovery.
- A transport refusal or reverted transaction was mistaken for revocation of an
  already-signed intent. Guards now use fresh nonce/chain-time observations and
  can reactivate if those observations regress.
- Late resumed pages could repaint another directory.
- Refused routes could leave an old folder's mutation toolbar available.
- Cancelled consent could ignore deferred navigation; completing an edit or
  restore could close a newly opened different File.
- Direct JSON-RPC could accept foreign response IDs by array position.

Legacy test repairs preserve their semantic assertions: route-close waits for a
settled listing; the wallet harness retains a genuinely approved account; expiry
checks use the exact captured signed operation, independently require the matching
`ErrIntentExpired` deadline, and require no admission/nonce/payment effect. Public
provider prose and parameterized revert bytes remain withheld. Failed browser
tests now close their own HTTP servers in `finally`.

## Still open

- A safe known error-name/selector channel would improve the generic sanitized
  sponsor refusal message without exposing argument bytes.
- Pre-metadata DIRECT upload recovery, dedicated null-charset/executable-metadata
  restore regressions, actual wallet-extension UI and provider failover remain.
- Real-browser downloads pass in Chromium. The Codex in-app browser exposed the
  verified download control without errors, but its download-event observation
  timed out during the manual walkthrough; that host's completed download is
  not independently confirmed here.
- The [1,000-entry control](evidence/continuation-2026-09-11/README.md) is complete
  but still uses 838 HTTP requests. WAN behavior, 10k/high-churn scans, broad
  Lenses and finite-universe negative/global tag filtering need further work.
- Fable's [large-Type cache failure](type-cache-boundary-2026-09-11.md), full
  declaration transaction fit, cache-module decomposition, and old-layout
  migration are not fixed by the browser. A standalone compact-codec experiment
  is separate evidence, not installed in this Core.
- Joined arbitrary Type acceptance, additive Note/old-editor behavior,
  authenticated selected-state recovery, private opacity, and real identity
  recovery/delegation remain foundation gates. No full v1 parity or 50-year
  hyperstructure certification is claimed.

## Disk safety

Under the owner's explicit authorization, 18 inactive disposable Anvil caches
occupying approximately 285 GiB were permanently removed after process/open-handle
checks. Source workspaces and retained reports were preserved. Managed Files runs
now use a unique owned cache and remove it after confirmed process exit; other
unrelated Anvil runners are not automatically covered. The live demo keeps its
own cache while running and deletes it when shut down normally.
