# Static read-only SPA proof

**Status:** disposable local `efs-lab/1` delivery evidence, not full C0, a
production client, a wallet integration or an M0 acceptance claim. Source
baseline: planning rehearsal at `1a51c5d`; active `web/bootstrap.mjs` and
`web/workflow-app.mjs` were inspected, not only the retained `web/app.mjs`.

The exporter reuses the active Files/Data/Arcade shell, view modules and SDK.
Only the exported bootstrap is replaced. Existing rehearsal source is unchanged.
The optional development gateway never serves pages, configuration, wallet,
relay or session endpoints. Stop it and static pages still load; reads become
UNKNOWN. No transaction was submitted by this browser proof.

```text
fresh browser -> static prefix/index.html, modules, config.json, manifest.json
             -> explicitly configured CORS JSON-RPC endpoint -> Ethereum reads
                    local proof only: read-only loopback gateway -> Anvil
```

## Build and serve

Run commands from the planning worktree root. Node 26 and the existing
rehearsal's installed dependencies are required. No new package installation
or bundler is needed. Output directories must not already exist; the exporter
will not overwrite an earlier export.

An unconfigured export is independently usable as an honest unavailable shell:

```sh
EFS_SPA_TMP=$(mktemp -d)
node Reviews/2026-09-05-mvp-build-start/spa/export.mjs "$EFS_SPA_TMP/site"
node Reviews/2026-09-05-mvp-build-start/spa/serve.mjs "$EFS_SPA_TMP/site" /ipfs/static-proof/ 43901
```

Open the printed URL. Configuration absence is UNKNOWN and makes no RPC,
wallet, account-discovery or signing requests. Stop the static server with Ctrl-C.

For a configured local proof, in terminal A choose a fresh temporary directory,
print it for terminal B, and start the optional read-only gateway:

```sh
EFS_SPA_TMP=$(mktemp -d)
echo "$EFS_SPA_TMP"
# Set EFS_LAB_SOLC to an installed solc 0.8.30+commit.73712a01 executable.
node Reviews/2026-09-05-mvp-build-start/spa/dev-gateway.mjs http://127.0.0.1:43901 "$EFS_SPA_TMP/manifest.json" 43902
```

The gateway compiles with the pinned compiler, seeds a new disposable lab and
prints readiness only after writing the public manifest. `EFS_SPA_COMPILE=0`
explicitly reuses existing compiled artifacts instead. Forge and Anvil must be
on PATH. The gateway expires after one hour; Ctrl-C also stops its child chain.
Signing used to seed the lab remains in that development process, never in
the export. The gateway checks the exact static Origin, Host, JSON method,
read method allowlist and Core/byte-store call targets. It grants no signing
or submission channel, even to the allowed origin.

In terminal B set `EFS_SPA_TMP` to the exact directory printed by terminal A,
then run:

```sh
node Reviews/2026-09-05-mvp-build-start/spa/export.mjs "$EFS_SPA_TMP/site" "$EFS_SPA_TMP/manifest.json" http://127.0.0.1:43902/rpc
node Reviews/2026-09-05-mvp-build-start/spa/serve.mjs "$EFS_SPA_TMP/site" /ipfs/static-proof/ 43901
```

The trailing slash is required. Navigate Files/Data and reload a selected file
hash route. Stop both servers with Ctrl-C when finished. Retained temporary
exports/manifests are public synthetic lab material, not durable deployments.

For another explicit compatible lab provider, pass its public JSON manifest
and CORS-capable HTTPS RPC URL to `export.mjs`. The development gateway is not
required by the bootstrap: it sends ordinary JSON-RPC 2.0 directly to the URL.
Non-loopback HTTP, URL credentials, query strings and fragments are rejected;
there is no environment-secret injection or privileged server API-key proxy.
Do not put private/API credentials in URL paths or public manifest values.

## Export contents and configuration boundary

The output contains `index.html`, two CSS files, unchanged active shell/view/model
modules, replacement `bootstrap.mjs`, `config.mjs`, `sdk/index.js`, local vendor
`ethers.js`, and inert `config.json`. Configured exports additionally contain
`manifest.json`. No Node dependencies directory, server scripts, Solidity
artifacts, seed script, synthetic account bundle or session grant is copied.

`config.json` version 1 names exactly `./manifest.json` and an explicit absolute
RPC URL. There is no query-string, localStorage, wallet-discovery, executable
module-URL, account, chain-selection, signer, submission or retry fallback.
Module URLs are fixed by the artifact; config cannot nominate executable code.
The manifest must declare `lab: true` and `deployment.profile: "efs-lab/1"`;
it provides the existing deployment identity, ABI, runtime hashes and public
read targets. SDK basis/runtime verification remains active. Exporting does
not authenticate the publisher of that manifest or promote its authority.
The public projection omits account/session configuration and rejects
secret-like property names recursively. This check is not a general secret
scanner: the operator must not conceal secrets in ordinary public values.

Fetches omit credentials, RPC redirects are refused, and each RPC attempt has
an 8-second timeout with no automatic transport retry. Exported HTML carries
the original object/base/form restrictions plus `connect-src` limited to
self and the selected RPC origin. The included loopback host adds the prior
frame-ancestor, permissions and response headers. A dumb host does **not**
automatically acquire those header-only protections merely by copying files.

## Capability boundary and limitations

- Direct browser JSON-RPC: qualified Files, exact revisions, verified-byte
  preview/download, bounded directory pages, Data inventory and typed reads.
  `PARTIAL`, `UNKNOWN`, basis and evidence are not upgraded by static delivery.
- Arcade browsing remains inert; the original explicit-Play opaque iframe,
  verified-content and deny-by-default guest policy source is unchanged.
  This proof asserts no iframe on browse; it does not rerun the full guest
  Play/CSP/lease regression suite or claim equivalent security on every host.
- Writes are deliberately unavailable. Controls are hidden and click-fenced;
  no wallet/relay/session provider is installed in the SDK. The read adapter
  rejects signing/submission methods. A real write deployment still needs
  explicit injected-wallet selection/authorization and separate relay/session
  integration as applicable; the simulated local confirmation UI is not a
  substitute. Write/cancellation logic is unchanged, not re-certified here.
- Current shell and SDK module loading is eager. Production lazy wallet/action,
  Data and Arcade bundles remain engineering debt. No service worker,
  lifecycle expansion, public deployment, SSR or bundler migration was added.
- This is an arbitrary-prefix transport/reload proof, **not** proof that an
  IPFS path gateway is a safe shared active-OS origin. Real gateway origin
  isolation, trust, CSP headers and deployment integrity need separate review.
- The existing SDK correctly rejects wrong-chain reads but collapses the
  specific mismatch into `UNKNOWN / PAGE_UNAVAILABLE` with empty nested
  evidence. The test separately verifies manifest chain 1 against observed
  chain 31337. Improving this diagnosis is outside this source-read-only lane.

## Test commands and observed evidence

Set `EFS_LAB_CHROMIUM` to an installed Chromium executable (or use Playwright's
installed default). Then run from the worktree root:

```sh
node --test Reviews/2026-09-05-mvp-build-start/spa/test.mjs
```

That command explicitly reuses the existing Solidity artifacts. To include
compiler/version verification and `forge build --offline` first:

```sh
EFS_SPA_COMPILE=1 node --test Reviews/2026-09-05-mvp-build-start/spa/test.mjs
```

Observed 2026-09-05: **9 tests passed, 0 failed** (one parent and eight browser/
export cases) with the pinned compiler and real Chromium/Anvil. Forge confirmed
unchanged compilation inputs; existing timestamp/typecast lint warnings remain.
The test creates fresh temporary exports and browser contexts, runs static and
gateway servers on separate ephemeral origins, and closes browsers, both
servers and child Anvil in cleanup, including failed assertions.

The proof checks missing config; credential rejection; prefixed asset destinations;
same-origin `/config`, `/rpc`, `/wallet`, `/relay`, `/session` all returning 404;
real qualified Files bytes and hash reload; Data navigation/reload with four-row
PARTIAL inventory; zero signing/account calls and no browse execution; no gateway
page/wallet surface; denied CORS; wrong chain; gateway loss remaining UNKNOWN;
public export shape, unchanged view bytes and refusing output overwrite.

RED was observed before implementation: the same command failed with
`Static exporter must exist; the application server is not a static export`.
During integration, the test's provider-loss case initially used a same-hash
navigation rather than a document reload, and assumed the exact-read error
label for a page read. Both test assumptions were corrected after observing
the real browser/SDK behavior; no shared production source was changed.
