# Verification: routes, deep links, and the guest journey (EFS v1 explorer)

Purpose: verify whether EFS v1's nextjs explorer supports stable direct game links today, what a fresh guest actually experiences, whether opening a file executes it, and what the smallest v1 changes are to get `/arcade` + `/arcade/<slug>` deep links.

Evidence grades: **A** = verified from source/primary · **B** = strong inference · **C** = uncertain

---

## 1. URL structure: what link would a game have today?

**[A] The explorer is the app's only truly dynamic route, served as a single static shell + SPA fallback.**
- `output: "export"` (production builds only) + `trailingSlash: true` — [next.config.js:70-77](../../../contracts/packages/nextjs/next.config.js).
- `/explorer/[[...path]]` emits exactly one shell (`generateStaticParams` returns `[{ path: [] }]`) — [app/explorer/[[...path]]/page.tsx:26-28](../../../contracts/packages/nextjs/app/explorer/%5B%5B...path%5D%5D/page.tsx).
- `public/_redirects` rewrites `/explorer/*` → `/explorer/index.html` status 200 (honored by IPFS gateways ≥ Kubo 0.23, eth.limo/eth.link, Netlify/CF Pages, Caddy) — [public/_redirects](../../../contracts/packages/nextjs/public/_redirects), first rule. A final `/*` → `/index.html` 200 catch-all exists.
- The shell reads the real path from `usePathname()` at runtime (not `useParams()`, which returns the pre-rendered empty params under static export) — [ExplorerClient.tsx:84-112](../../../contracts/packages/nextjs/app/explorer/%5B%5B...path%5D%5D/ExplorerClient.tsx) and ADR-0040.

**[A] The web-games dataset targets anchor path `/games`** — [content/datasets/web-games/manifest.json:5](../../../content/datasets/web-games/manifest.json) (`"anchorPath": "/games"`). So once seeded, a game's URL today is:

```
https://app.efs.eth.limo/explorer/games/snake.html
```

**[A] The link is stable and shareable without `?lenses=`** *provided the games are attested by the EFS content account*: the default lens chain the explorer applies when no `?lenses=` param is present is `[connectedAddress?, EFS_CONTENT_LENS, SystemAccount]` — system lenses built at [ExplorerClient.tsx:164-180](../../../contracts/packages/nextjs/app/explorer/%5B%5B...path%5D%5D/ExplorerClient.tsx); `EFS_CONTENT_LENS = 0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912` at [utils/efs/containers.ts:314](../../../contracts/packages/nextjs/utils/efs/containers.ts). The URL carries no chain id; a deployed build resolves it against its default chain (Sepolia — §2).

**[A] BUT the deep link does not show (let alone run) the game.** Path resolution detects the last segment as a DATA-schema file leaf ([ExplorerClient.tsx:511-522](../../../contracts/packages/nextjs/app/explorer/%5B%5B...path%5D%5D/ExplorerClient.tsx), `resolveAnchor(currentUID, segment, dataSchemaUID)`) and sets `currentIsFileLeaf` (line 561). However:
- `FileBrowser` never receives `currentIsFileLeaf` and has **no auto-open**: `setSelectedFile(...)` fires only from a grid-card click ([FileBrowser.tsx:1903-1908](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx)) or gallery next/prev navigation (line 1457). No effect selects a file from the URL.
- The deep-linked file anchor is passed to `FileBrowser` as the *directory to list*; a file anchor has no child file/folder anchors, so the guest lands on an empty grid **[B]** (empty-state render; verified there is no file-leaf branch in FileBrowser — grep for `currentIsFileLeaf` in FileBrowser returns nothing **[A]**).
- The `OverviewPane` is explicitly skipped on file leaves ([ExplorerClient.tsx:808](../../../contracts/packages/nextjs/app/explorer/%5B%5B...path%5D%5D/ExplorerClient.tsx)).

**Net: the URL is stable and round-trips through the static export, but "share this game link" currently lands on a dead-end empty view.** The playable path is: open `/explorer/games/`, click the game card.

---

## 2. Guest first load (fresh visitor, no wallet, deployed build)

Step by step, with citations:

1. **Chain default = Sepolia.** Production build with `NEXT_PUBLIC_TARGET_CHAIN` unset: `LOCAL_AVAILABLE = false` (no hardhat in prod without an explicit RPC, [scaffold.config.ts:113](../../../contracts/packages/nextjs/scaffold.config.ts)), `resolveDefaultTargetChain` falls to `sepoliaChain` ([scaffold.config.ts:39-47, 135-143](../../../contracts/packages/nextjs/scaffold.config.ts)). Local (31337) is not even in the chain list on a deployed build (line 130-131), so the memory-noted "stale burner hijacks build to Local" **cannot occur on a deployed build** — the chain isn't configured **[A]**. Additionally, stored hardhat dev private keys are actively cleared when the default chain is non-hardhat ([wagmiConnectors.tsx:85-101](../../../contracts/packages/nextjs/services/web3/wagmiConnectors.tsx)).
2. **No burner auto-creation, no signing prompt.** The burner connector is *offered* (`onlyLocalBurnerWallet: false`, [scaffold.config.ts:172](../../../contracts/packages/nextjs/scaffold.config.ts); connector list [wagmiConnectors.tsx:103-119](../../../contracts/packages/nextjs/services/web3/wagmiConnectors.tsx)) but a burner PK is only pre-seeded into localStorage when the default chain is hardhat ([`shouldSeedHardhatBurner`, instantBurner.ts:221-231](../../../contracts/packages/nextjs/utils/scaffold-eth/instantBurner.ts)) — never on a Sepolia-default deploy. `reconnectOnMount` is true only when the instant-burner session feature is off; instant burner itself requires `NEXT_PUBLIC_FAUCET_URL` to be set and is opt-in via an "editing session" request ([ScaffoldEthAppWithProviders.tsx:22-28, 69](../../../contracts/packages/nextjs/components/ScaffoldEthAppWithProviders.tsx); [instantBurner.ts:11-20, 49-78, 80-86](../../../contracts/packages/nextjs/utils/scaffold-eth/instantBurner.ts)). A fresh guest is simply `disconnected`; all reads go through the wagmi `publicClient` — **wallet-free reads work by construction [A]**.
3. **Boot gate: the whole explorer blocks on 7 contract reads.** `rootUID` + 6 schema-UID reads via `useScaffoldReadContract` ([ExplorerClient.tsx:182-211](../../../contracts/packages/nextjs/app/explorer/%5B%5B...path%5D%5D/ExplorerClient.tsx)); until all land the page renders `Loading System...` (lines 648-676). A 12-second timer flips to a "Can't reach {network}" error with a switch hint (lines 383-387, 657-675).
4. **Path resolution: 1-2 sequential `readContract` calls per URL segment** (`resolveAnchor` DATA-probe on the last segment, `resolvePath` otherwise — lines 501-532), plus top-level classifier + optional alias-anchor lookup.
5. **Directory load:** FileBrowser resolves `/tags` root, exclude-tag definitions, then a lens-scoped `getDirectoryPageFiltered` walk + a LIST-schema walk, deduped ([FileBrowser.tsx:401-446, 1205-1219](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx)). The exclude gate deliberately *holds* the listing rather than falling back to an unfiltered read.
6. **RPC path:** wagmi transport is `fallback([http(), http(alchemyDefaultKeyUrl)])` when using the shipped shared Alchemy key — i.e. **viem's public default Sepolia RPC first**, shared-key Alchemy second ([wagmiConfig.tsx:26-35](../../../contracts/packages/nextjs/services/web3/wagmiConfig.tsx); `DEFAULT_ALCHEMY_API_KEY` at [scaffold.config.ts:13](../../../contracts/packages/nextjs/scaffold.config.ts)). A build-time `NEXT_PUBLIC_SEPOLIA_RPC_URL` overrides the chain's default RPC ([scaffold.config.ts:79-87](../../../contracts/packages/nextjs/scaffold.config.ts)).

**What blocks a fast guest read path [A/B]:** the serial gate (steps 3→4→5) on a public RPC paying CORS preflights per call; dozens of `useScaffoldReadContract` hooks (many `watch`-invalidated per block) contending for the browser's ~6-connections-per-host cap. This is the documented "Loading System… hang" (memory: live Sepolia needs a dedicated RPC; the code's own remedy is the 12s timeout + advice string, and the RPC override env). No multicall/batching layer exists in this path **[A]**. `pollingInterval` is 30s (scaffold.config.ts:157) which softens but does not remove the burst at load.

---

## 3. Does opening a file EXECUTE it?

**[A] Yes — rendering is executing, but only after an explicit click, and inside a strict sandbox.**

- Click on a file card → `setSelectedFile(item)` + `fetchFileContent(item)` ([FileBrowser.tsx:1903-1908](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx)).
- `fetchFileContent` (component wrapper lines 780-874) calls the pure util [utils/efs/fetchFileContent.ts:148-301](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts): `EFSRouter.request([...path], [{lenses},{chunk}])` via `publicClient.readContract`, reassembling SSTORE2 chunks through EIP-7617 `web3-next-chunk` pagination, or following `message/external-body` → gateway fetch (IPFS/Arweave gateways from `NEXT_PUBLIC_IPFS_GATEWAY`/`NEXT_PUBLIC_ARWEAVE_GATEWAY`, defaults dweb.link/arweave.net — [transports.ts:53-54](../../../contracts/packages/nextjs/utils/efs/transports.ts)).
- For `text/html` / `application/xhtml+xml` the preview pane renders:
  ```tsx
  <iframe sandbox="allow-scripts" srcDoc={fileContent} ... style={{ height: "60vh" }} />
  ```
  [FileBrowser.tsx:2135-2141](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx); fullscreen variant identical at lines 2277-2280. **Exact sandbox: `allow-scripts` only** — no `allow-same-origin` (deliberate, comment lines 2130-2134: opaque origin, no parent DOM/cookies/storage), and notably **no `allow-pointer-lock`, no `allow-popups`, no `allow-forms`, no `allow` attribute (fullscreen/gamepad)**. This matches ADR-0056's client render-isolation mandate. Consequence for games **[B]**: pointer-lock or `requestFullscreen`-dependent games will degrade; keyboard/canvas games (the 15 curated ones) run fine. `srcDoc` (not `blob:`+`src`) means localStorage inside the frame is unavailable/ephemeral (opaque origin) — high-score persistence won't survive **[B]**.
  - PDFs: `blob:` URL in `sandbox="allow-scripts"` iframe (lines 2100-2116). SVG is neutered to an `<img>` data-URI (2083-2091).
- **Render-on-open is automatic once a file is selected** — there is no "click to run" interstitial; `srcDoc` mounts and scripts execute immediately **[A]**. But since deep links never auto-select (§1), *navigating to a game URL today runs nothing*.

Side observation **[A]**: `computeContentHash` in [transports.ts:106-108](../../../contracts/packages/nextjs/utils/efs/transports.ts) is keccak256 (the known 3-way contentHash conflict); it has no callers in this render path — hash verification is absent from the preview flow entirely.

---

## 4. Could a static-export `/arcade` route be added?

**[A] Yes — no structural blocker.** The pattern is already established three times over (explorer, blockexplorer, lists):

1. `app/arcade/page.tsx` — plain static page, exported as `/arcade/index.html` automatically.
2. `app/arcade/[slug]/page.tsx` — dummy `generateStaticParams` (one placeholder slug), client component reads the real slug from `usePathname()` (per ADR-0040), exactly like [blockexplorer/address/[address]](../../../contracts/packages/nextjs/app/blockexplorer/address/%5Baddress%5D/page.tsx) does with its zero-address dummy.
3. One `_redirects` line above the `/*` catch-all: `/arcade/*  /arcade/<dummy-slug>/index.html  200` (or route `/arcade/:slug` client-side from a single `/arcade` shell and skip the dynamic segment entirely — fewer moving parts).

**Caveats, not blockers:**
- **[A] The root layout unconditionally wraps every route in `ScaffoldEthAppWithProviders`** ([app/layout.tsx:13-23](../../../contracts/packages/nextjs/app/layout.tsx)): WagmiProvider + RainbowKit + `Header` + `Footer` + `DevnetBanner` + toasters ([ScaffoldEthAppWithProviders.tsx:30-49](../../../contracts/packages/nextjs/components/ScaffoldEthAppWithProviders.tsx)). Provider *init* is prompt-free and does not force wallet interaction (connectors instantiate; nothing connects — §2), so this does not block a guest path. But an `/arcade` page with "its own design" inherits EFS chrome; escaping it means either pathname-conditional rendering in Header/Footer, or accepting the chrome. Next.js route groups cannot escape the root layout.
- **[B] The arcade page should NOT reuse the explorer's hook stack.** `fetchFileContent` is already a pure util (no React, no scaffold hooks) taking `{routerAddress, routerAbi, publicClient, lensAddresses, resourcePath}` — an arcade page can call it with a single viem client + the committed `deployedContracts.ts` 11155111 addresses and a hardcoded lens list `[EFS_CONTENT_LENS, SystemAccount]`, bypassing the 7-read boot gate and the watch-hook storm entirely. The util even self-describes as "shaped toward the planned SDK `fetch(ref, opts)`" ([fetchFileContent.ts:141-147](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts)).

---

## 5. Reads, RPC, and what "dedicated RPC" implies for a public Arcade

- **[A]** Deployed-build reads: viem default public Sepolia RPC first, shared default Alchemy key as fallback ([wagmiConfig.tsx:26-35](../../../contracts/packages/nextjs/services/web3/wagmiConfig.tsx)). Both are shared/rate-limited endpoints; every guest of a public Arcade page hits them cold.
- **[A]** Per game load: 1 `router.request` read per SSTORE2 chunk (~24KB each; a 100KB game ≈ 5 sequential `eth_call`s), body hex-decoded byte-by-byte into a JS array ([fetchFileContent.ts:168-291](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts)). In-memory cache only: 50 entries / 50MB / **60s TTL** (lines 64-67) — no persistent caching; a returning guest re-pays full chain reads.
- **[B]** Implication: a public Arcade must ship with `NEXT_PUBLIC_SEPOLIA_RPC_URL` baked to a dedicated key (the memory-verified fix for the Loading-System starvation), keep the catalog to O(1-2) reads (one `getDirectoryPageFiltered` page, or a build-time-baked manifest), and treat per-game chunk reads as the dominant load cost. Rate-limit exposure scales with visitors × chunks; a shared default key on a launch-day page is the predictable failure.

---

## Gaps vs "fast guest catalog load with no boot" + smallest v1 changes

| # | Gap today | Smallest v1 change |
|---|---|---|
| 1 | Deep link to a game (`/explorer/games/x.html`) resolves but shows an **empty grid**, never the game | **Option a (smallest overall):** auto-open the preview on file-leaf deep links — pass `currentIsFileLeaf` (already computed, ExplorerClient.tsx:561) into FileBrowser and auto-`setSelectedFile`+`fetchFileContent` for the leaf. Makes every existing explorer URL playable. **Option b:** dedicated `/arcade` (below). |
| 2 | No `/arcade` identity/design; explorer chrome + debug affordances (delete buttons, tag modals) surround games | Add `app/arcade/page.tsx` + slug shell + one `_redirects` line (§4). Render games via the pure `fetchFileContent` util in the same `sandbox="allow-scripts"` iframe. No contract changes, no export-config changes. |
| 3 | Boot gate: 7 serial contract reads before anything renders; watch-hooks storm on public RPC | Arcade page skips scaffold hooks: one viem `publicClient` + addresses from committed `deployedContracts.ts`; catalog = one `getDirectoryPageFiltered` call (or a build-baked game list, zero RPC for the catalog). |
| 4 | Public/shared RPC; 60s-only cache | Bake `NEXT_PUBLIC_SEPOLIA_RPC_URL` (dedicated key) into the Arcade build; optionally lengthen the fetch cache TTL for immutable game bytes (contents are content-addressed-immutable in practice — cache invalidation risk is low **[B]**). |
| 5 | Sandbox omits pointer-lock/fullscreen/persistence | Acceptable for the 15 curated keyboard/canvas games **[B]**; revisit per-game if a future title needs `allow-pointer-lock`. Do not add `allow-same-origin` (ADR-0056). |

**Bottom line:** stable, shareable game URLs already exist at the routing layer (`/explorer/games/<file>` survives static export + `_redirects`, needs no `?lenses=` if seeded by the content account) — what's missing is purely client behavior: nothing auto-plays on deep link, and the guest boot path is gated on a serial read storm against a shared RPC. Both are Ephemeral-tier (`packages/nextjs/`) fixes; no Etched or Durable surface is touched by an `/arcade` route.
