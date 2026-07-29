# ArDrive Teardown — Lane: Publishing (manifests, static sites, ArNS)

Researched 2026-07-29. All live-source claims marked (accessed 2026-07-29) unless the source carries its own date. Layer discipline: Arweave = byte carrier, ArFS = protocol, ArDrive = product; ArNS and the deploy tooling sit in the AR.IO product ecosystem that ArDrive is now part of.

## Summary

Publishing on ArDrive/Arweave is a genuinely working but badly fragmented story. The "share this folder as a website" primitive exists — Arweave path manifests, creatable from a folder in the ArDrive web app in a few clicks — and the developer path (permaweb-deploy CLI + GitHub Action, Turbo CLI) is a legitimately good CI/CD story: deploy folder → auto-manifest with SPA fallback → atomically repoint an ArNS name, with undernames giving staging/version URLs and instant rollback. Fiat onboarding via Turbo (Stripe in 190+ countries, giftable credits by email, just-in-time top-ups) is best-in-class for web3. But the end-user GUI flow is a TX-ID scavenger hunt (copy a "Data TX ID", hand-assemble a gateway URL), updating a published site from the GUI means re-creating the manifest every time, and the whole stack has churned violently: the mobile app was sunset (Oct 2025), the help-center domain is dead, docs moved to docs.ar.io, the Turbo app repo moved twice and became "AR.IO Console", and — the headline event — the entire naming layer (ArNS registry, $ARIO token, ANT name-ownership tokens) migrated from AO to **Solana** in 2026, its third execution layer in roughly four years, with registration windows and claim deadlines that can strand name owners. $ARIO has collapsed to a ~$0.83M market cap (−97% from ATH), so the naming economy is priced in a near-illiquid token. Reaching a published site still depends on gateway subdomains or the Wayfinder browser extension; no browser resolves ar:// natively. Adoption is modest (~2,800 names as of Jan 2025) and the ecosystem's own news site domain has expired — an irony for the permanent web.

## Findings

### 1. The product landscape (who publishes with what, mid-2026)

The publishing surface is spread across at least four first-party products:

- **ArDrive web app** (app.ardrive.io) — the file-manager; manifests are created here from folders. Homepage still markets "Site and app hosting directly from drives" and NFT metadata use (ardrive.io, accessed 2026-07-29).
- **Turbo app / AR.IO Console** — a unified upload + deploy + domains + credits app. The repo history tells the churn story: `ardriveapp/turbo-app` (archived 2026-02-12) → `ardriveapp/turbo-gateway-app` → now `ar-io/ar-io-console`, live at console.ar.io and turbo.ar.io / turbo.ardrive.net (GitHub repos + turbo.ar.io, accessed 2026-07-29). It offers "deploy site" with folder upload, automatic manifest generation, homepage/404 selection, and assignment to an owned ArNS name.
- **permaweb-deploy** — CLI + GitHub Action for CI/CD deploys (github.com/permaweb/permaweb-deploy, accessed 2026-07-29).
- **Turbo CLI** — `turbo upload-folder -f ./my-website --index-file index.html --fallback-file 404.html` produces a manifest-backed site upload (docs, accessed 2026-07-29).

Context signals: the ArDrive **mobile app was sunset October 30, 2025** ("we're focusing our energy on improving the web experience," ardrive.io/mobile; @ardriveapp on X, 2025-10). help.ardrive.io **no longer resolves** (DNS NXDOMAIN, checked 2026-07-29); docs.ardrive.io now redirects to docs.ar.io. So the "shipped product" is consolidating into AR.IO Console while ArDrive-the-app remains for drive management.

### 2. "Share this folder as a website" in the ArDrive UI — manifests

The flow, per AR.IO's own guide "Deploy a dApp with ArDrive Web" (docs.ar.io/build/guides/hosting-decentralised-apps/hosting-with-ardrive/, accessed 2026-07-29):

1. Sign in at app.ardrive.io; create a drive and **set it public** — a silent prerequisite; a manifest over a private drive simply won't serve.
2. "New" → "Upload Folder", upload the built site; review cost; "Confirm".
3. Enter the folder; "New" → **"New Manifest"** (under an "Advanced" section); name it; pay (a small fee — manifests are themselves Arweave files).
4. Open the manifest's **"Details" tab**, find the **"Data TX ID"**, and hand-construct the URL: `https://turbo-gateway.com/YOUR-TX-ID`. "It may take a few minutes for files to propagate through the network."
5. If you own an ArNS name, "you'll be prompted during manifest creation"; otherwise you can later use the three-dots menu → **"Assign ArNS name"** on the manifest file.

**Update workflow (GUI):** rebuild, upload the changed files to the same folder, then **create a new manifest with the same name** — "the new manifest generates a new TX ID for the updated dApp" — then repoint the ArNS name (via the assignment prompt or arns.ar.io). Old versions stay reachable at their old TX IDs forever. There is no "sync"/"republish" verb; every update is a manual re-create-and-repoint. (Same guide; also ArDrive help-center article "Create an Arweave Manifest," now offline — the flow matched: +NEW → Create Manifest → name → pick Target Folder → pay.)

The manifest itself surfaces in the product experience in one more way: it's a plain JSON file sitting in your drive that maps paths → TX IDs, and it's the unit ArNS names point at. ArDrive marketed manifests explicitly for **NFT collections and static sites** (blog posts "Arweave Manifests 101" and "How to get your NFT Project, Static Website, or dApp onto Arweave" — both URLs now 404 on the restructured ardrive.io, titles verified via search, accessed 2026-07-29).

### 3. The console/Turbo "deploy site" flow — the newer, better GUI

The Turbo app product guide (github.com/ardriveapp/turbo-app TURBO-APP-PRODUCT-GUIDE.md, last updated Oct 2025) describes what the AR.IO Console now ships: "Deploy complete websites with folder uploads, automatic manifest generation, and homepage/404 configuration"; "Assign deployed sites to owned ArNS names with automatic updates"; **just-in-time payment** (auto top-up mid-upload); credits purchasable **via Stripe in 190+ countries** or 11 crypto tokens (AR, ARIO, ETH, Base-ETH, SOL, USDC variants); credits **shareable wallet-to-wallet and giftable via email — recipient needs no wallet**. This is the closest thing in the ecosystem to a Netlify-style publish, and it exists because the ArDrive-app manifest flow above was too clunky.

### 4. Developer publishing: permaweb-deploy, GitHub Actions, undername versioning

- **permaweb-deploy** (README, accessed 2026-07-29): `export DEPLOY_KEY=$(base64 -i wallet.json)`, then deploy a folder; it creates an **Arweave manifest v0.2.0 with SPA fallback detection** (auto-detects 404.html), dedupes unchanged files via a local transaction cache, tags deploys with git commit hashes, and **updates the ArNS record (ANT) to the new manifest TX ID** in the same run. GitHub Action: `uses: permaweb/permaweb-deploy@v1` with `deploy-key`, `name`, `deploy-folder`. Multi-chain signing exists for uploads (arweave/ethereum/polygon/kyve), but name updates have required an Arweave signature. Caveat: the README as fetched shows newer flags (`--use-names`, `--reference-id`) that differ from docs.ar.io's guide (`--arns-name`, `--undername`, `--ttl-seconds`) — the tool's interface is in flux mid-2026; I could not fully reconcile the two, and the Solana migration presumably forces another signing change. Flagging rather than guessing.
- **Undername versioning pattern** (docs.ar.io guide "ArNS Undernames for Versioning", accessed 2026-07-29): `staging_your-name.ar.io`, `v2-1-0_your-name.ar.io`, each pointing at a different immutable deploy; promote to production by pasting a TX ID into the `@` base record in the ArNS app; recommended TTLs 60s (dev) to 3600s+ (prod). "All versions remain permanently accessible" and rollbacks are "just updating a pointer to existing data." This is genuinely elegant: immutable deploys + one mutable pointer.

### 5. ArNS: purchase UX and pricing

Names are bought at **arns.ar.io**. Rules and economics (AR.IO whitepaper v3.0.0, whitepaper.ar.io, accessed 2026-07-29; docs.ar.io/learn/arns/pricing-model):

- Names: a–z, 0–9, dashes; 1–51 chars; 43-char names banned (TX-ID collision).
- **Lease** 1–5 years (2-week renewal grace) or **permabuy**. Lease price = ARF + 20%×ARF per year; permabuy = ARF + 20 years of annual fee (≈5× the adjusted base fee). Genesis base fees in ARIO: 1-char 500,000; 4-char 5,000; 8-char 500; 12-char 250; **13–51 chars 200**. A global **Demand Factor** (floor 0.5, unbounded top) multiplies everything; expired/returned names carry a **Returned Name Premium starting at 50×** declining over 14 days; gateway operators get 20% off.
- **10 undernames included** per name; extra undernames cost 0.1% (lease) / 0.5% (permabuy) of the adjusted base fee. Undernames can be individually owner-delegated. Max total name string 63 chars.
- At today's token price (ARIO = **$0.001227**, market cap **$827.7K**, 24h volume ~$1,119, −97.4% from its March 2025 ATH, all-time low June 19 2026 — CoinGecko, accessed 2026-07-29) and DF=1, a long-name permabuy ≈ 1,000 ARIO ≈ **$1.23**; a 4-char permabuy ≈ 25,000 ARIO ≈ **$31**; a 1-char ≈ 2.5M ARIO ≈ $3,068. Dirt cheap in USD — but only because the token collapsed. The whitepaper explicitly rejects a price oracle, so USD pricing floats freely with the token; the docs tell integrators "rely on the live ArNS app or SDK cost simulation" rather than the formulas.
- Payment requires ARIO (stake can also fund purchases); the console shows dynamic pricing in its domain search.

### 6. The Solana migration — the naming layer changed chains mid-product

This is the single most important policy/ecosystem finding (ar.io/solana-migration/, accessed 2026-07-29; whitepaper v3.0.0 revision notes):

- The $ARIO token, the ArNS registry (now run by the `ario-arns` Solana program), and ANTs (name-ownership tokens, now **Metaplex Core NFTs** tradeable on Tensor/Magic Eden) migrated from AO to **Solana**. Arweave stays as the data layer only. Rationale: "Solana gives ar.io a faster, more mature execution layer with a robust ecosystem, strong wallet support, liquidity, and developer tooling."
- Timeline: registration window closed **April 24, 2026**; final AO snapshot **June 1, 2026**; Solana mainnet live now; retroactive claim tool "coming soon." "Once the claim window closes, any unclaimed $ARIO will be sent to the Protocol Balance"; unregistered names eventually go to "an ownerless wallet."
- **"All interactions now require Solana wallets. Arweave wallet support ended."** (A Base bridge remains for EVM users.) Gateways now resolve names from the Solana contract, not the AO legacy state.
- Historical framing: ArNS state has now lived on SmartWeave (Arweave-native), then AO (2024–2026, "AR.IO Migrates to AO," ar.io/articles/ar-io-on-ao), now Solana. Three execution layers in ~4 years for the pointer system underneath "permanent" websites. Every migration imposed registration/claim deadlines on users of a product whose core promise is that you never have to do maintenance.

### 7. How a published site is actually reached

- **Gateway subdomains**: every AR.IO gateway serves every name — `ardrive.ar.io`, `ardrive.arweave.net`, `ardrive.permagate.io`, etc. (~276 gateways across 43 TLDs as of Jan 2025 — paragraph.com "ArNS: The 'Dot Nothing'...", 2025-01-24). Raw manifests are reached as `https://<gateway>/<txid>`. Cross-gateway redundancy is real: no single host can take a site down, and there is no canonical URL — which is both the feature and the UX problem.
- **ar:// protocol**: resolved only by the **Wayfinder** Chrome extension (v1.0.17, 2025-10-30; routes ar://name and ar://txid to a healthy gateway, with client-side verification) and by the **Wander** wallet (ex-ArConnect; extension + mobile; uses the Wayfinder protocol for gateway selection) (docs.ar.io/learn/wayfinder; wander.app; accessed 2026-07-29). No mainstream browser resolves ar:// natively. A non-crypto visitor just gets an https gateway URL and never knows ar:// exists.
- Propagation: the official guide warns of minutes-level delay before a fresh manifest serves.

### 8. Who uses this in practice

- **Dogfooding**: ArDrive publishes its own app permanently — dapp.ardrive.io serves the latest permanent version and every historical version stays accessible from any AR.IO gateway (permaweb.news article, via search; the article's own domain now redirects to an expired-domain parking page — permaweb.news lapsed, accessed 2026-07-29).
- **Permaweb apps and docs**: AR.IO's guides push "Application Distribution with ArNS + Manifests" (multi-platform distribution, CI/CD via GitHub Actions, manifest-based routing); the Arweave Cookbook and AR.IO docs ecosystem are themselves ArNS/gateway-hosted; Protocol.Land (git-on-Arweave) documents "Assign an ArNS name" for repo deployments (docs.protocol.land, accessed 2026-07-29); community examples like `rewind_jonniesparkles.arweave.net` show undername publishing in the wild.
- **NFT metadata**: manifests were ArDrive's explicit pitch for NFT collections (path-based `baseURI`-style addressing over immutable assets); this remains a real, if commoditized, use (much NFT traffic goes through Irys/Turbo bundlers directly rather than the ArDrive UI).
- **Scale**: ~2,800 registered names as of Jan 2025 (testnet era; same paragraph.com article — "these numbers may seem modest compared to traditional DNS"). I could not find a verified post-mainnet/post-Solana registration count; treat adoption as small. The $827K token market cap corroborates a tiny economy.

### 9. Discoverability and the non-crypto user

End-to-end for a normie: create wallet (or social login on ArDrive) → buy Turbo credits with a card (genuinely easy, Stripe) → upload folder (easy) → create manifest (findable but under "Advanced") → copy a TX ID and build a URL by hand (bad) → want a nice URL? Go to a different app (arns.ar.io), acquire a different token (ARIO, now on Solana, needing a Solana wallet) and learn lease-vs-permabuy (bad). The console collapses some of this into one flow, but the name-purchase leg still crosses apps, tokens, and now chains. There is no meaningful site directory or discovery layer; sites are found via shared gateway links. Documentation is currently mid-migration (dead help domain, redirected docs), which compounds discoverability for exactly the users a GUI flow targets.

## Strengths

- **The folder→website primitive exists in a GUI.** Almost no other storage-chain product lets a non-developer turn a folder into a served website in ~4 clicks. EFS should treat this as table stakes proven viable, not an exotic feature.
- **Immutable deploys + one mutable pointer** is a genuinely excellent publishing model: every version permanently addressable, promotion/rollback is a pointer swap with TTL control, staging via undernames (`staging_name`). Better auditability than mainstream web2 deploy platforms.
- **permaweb-deploy is real CI/CD parity**: one GitHub Action step gives manifest creation, SPA fallback, dedupe, commit tagging, and atomic name repointing. The developer story is stronger than the end-user story.
- **Fiat and gasless-feeling payments are best-in-class web3**: Stripe in 190+ countries, JIT top-ups mid-upload, credits giftable by email to people with no wallet. This is the part every web3 file product should copy.
- **Resolution redundancy**: any of hundreds of gateways serves every name; no single point of takedown, and Wayfinder adds client-side verification for the paranoid.

## Weaknesses / user pain

- **Platform churn is the defining trait.** Mobile app killed (Oct 2025); help center domain dead; docs domain migrated; Turbo app repo moved twice in months; the naming layer changed chains for the third time, with hard registration/claim deadlines ("unclaimed $ARIO will be sent to the Protocol Balance"). For a brand whose promise is permanence, the product shell around the permanent bytes is conspicuously impermanent.
- **The naming economy is on life support**: ARIO at $0.0012, ~$828K market cap, ~$1.1K daily volume, ATL set June 2026. Names are cheap in USD only as a side effect of collapse; the whitepaper's oracle-free design means USD prices are unmanaged by construction.
- **Solana migration breaks the mental model**: your website's bytes are on Arweave, but your website's *name* is a Solana NFT you manage with a Solana wallet, bought with an SPL token — while uploads are paid in Turbo credits from any chain. Three ledgers, two wallets, one static site.
- **GUI update loop is manual and lossy**: re-upload → re-create manifest (new TX ID every time, each a paid action) → re-assign name. No "republish" verb, no diff awareness in the ArDrive app (permaweb-deploy's dedupe exists only in the CLI).
- **TX-ID-in-your-face UX**: the official happy path ends with "locate the Data TX ID on the bottom right" and hand-assembling a gateway URL. The public-drive prerequisite is easy to miss and fails silently. Propagation delay is unexplained in-product.
- **No canonical URL and ugly subdomain grammar**: the same site is `name.ar.io`, `name.arweave.net`, `name.permagate.io`...; undernames render as `staging_name.gateway.tld`, and underscores in hostnames look broken to civilians (and can trip TLS/cookie edge cases on some tooling).
- **ar:// is aspirational**: without the Wayfinder extension or Wander, ar:// links are dead strings. Publishing tutorials print them anyway.
- **Fragmented docs/support** during exactly the period a confused user would search: dead help.ardrive.io links persist across the web (and in search results), and guides straddle old (AO) and new (Solana) reality.

## Implications for the EFS file browser

1. **Make "Publish folder as site" a first-class verb with a canonical, copyable URL as the output.** ArDrive proves demand for GUI folder→website, and proves that ending the flow at a raw TX ID + hand-built gateway URL kills it for normal users. EFS Files should return one shareable link (web3:// / eth-style resolution with an https gateway fallback), never a hash the user must assemble into a URL.
2. **Republish must be one action, atomic, and diff-aware.** permaweb-deploy (CLI) already does upload+manifest+repoint atomically with dedupe; ArDrive's GUI does none of it. The EFS browser should own the whole loop: detect changes, write new content, update the anchor/pointer in a single confirm — with the CLI/CI parity as a separate SDK deliverable.
3. **Keep names/pointers on the same chain as the filesystem.** ArNS's AO→Solana migration — deadlines, wallet swaps, stranded names — is the canonical failure mode of a naming layer whose home is a business decision. EFS's pointer layer living on Ethereum next to the data commitments (with ENS as the naming surface) is a durable differentiator worth stating loudly; ar:// mirrors remain byte carriers untouched by this.
4. **Adopt the immutable-versions + mutable-pointer publishing model, and surface it.** Undername staging (`staging_x`), permanent version history, and instant pointer rollback are the best ideas in this stack; EFS anchors already fit this shape — the file browser should expose "versions" and "promote/rollback" natively rather than leaving them as chain trivia.
5. **Copy the payment onboarding, not the token.** Stripe fiat→credits, just-in-time top-ups, and email-giftable credits (recipient needs no wallet) are the strongest web3 onboarding pattern observed anywhere in this teardown; it aligns with EFS's gasless faucet-drip priority. Conversely: never price a durable primitive (names, anchors) in a thin app token — ArNS pricing is now economically meaningless because ARIO collapsed.
6. **One app, not three.** ArDrive fragments publish/pay/name across app.ardrive.io, console.ar.io, and arns.ar.io — with docs scattered mid-migration. EFS's web-OS thesis (Files + system chrome in one shell) is the direct answer; keep name purchase/assignment inside the publish flow.
7. **Explain propagation and prerequisites in-product.** Silent failures (private drive, minutes-long propagation) are cheap to pre-empt with copy; ArDrive doesn't.

## Sources

- https://docs.ar.io/build/guides/hosting-decentralised-apps/hosting-with-ardrive/ — ArDrive web deploy guide (accessed 2026-07-29)
- https://docs.ar.io/build/guides/hosting-decentralised-apps/using-undernames-for-versioning/ — undername versioning (accessed 2026-07-29)
- https://docs.ar.io/build/guides — guide index incl. Application Distribution with ArNS + Manifests (accessed 2026-07-29)
- https://github.com/permaweb/permaweb-deploy — CLI/GitHub Action README (accessed 2026-07-29)
- https://github.com/ardriveapp/turbo-app (TURBO-APP-PRODUCT-GUIDE.md, updated Oct 2025; repo archived 2026-02-12) and https://github.com/ar-io/ar-io-console (accessed 2026-07-29)
- https://turbo.ar.io/ and https://turbo.ardrive.net/ — live Turbo app (accessed 2026-07-29)
- https://docs.ar.io/learn/arns and https://docs.ar.io/learn/arns/pricing-model — ArNS mechanics/pricing (accessed 2026-07-29)
- https://whitepaper.ar.io/ — AR.IO whitepaper v3.0.0: genesis fee table, lease/permabuy/undername formulas, Solana contract architecture, revision log (accessed 2026-07-29)
- https://ar.io/solana-migration/ — migration phases, wallet requirements, claim deadlines (accessed 2026-07-29)
- https://ar.io/articles/ar-io-on-ao — prior AO migration (2024)
- https://www.coingecko.com/en/coins/ar-io-network — ARIO price/market cap (accessed 2026-07-29)
- https://ardrive.io/ and https://ardrive.io/mobile — positioning; mobile sunset (Oct 2025)
- https://x.com/ardriveapp/status/1976697325369311485 — mobile sunset announcement (2025-10)
- https://docs.ar.io/learn/wayfinder, https://chromewebstore.google.com/detail/ario-wayfinder/hnhmeknhajanolcoihhkkaaimapnmgil — ar:// resolution, Wayfinder v1.0.17 (2025-10-30)
- https://www.wander.app/ and https://ar.io/case-studies/arconnect — Wander wallet, Wayfinder integration (accessed 2026-07-29)
- https://paragraph.com/@big-permanence-energy/arns-the-dot-nothing-domain-name-system-disrupting-a-multi-billion-dollar-industry — adoption (~2,800 names; ~276 gateways/43 TLDs), 2025-01-24
- https://docs.protocol.land/working-with-deployments/assign-an-arns-name — ecosystem ArNS usage (accessed 2026-07-29)
- https://cookbook.ar-io.dev/guides/deploying-manifests/ardrive.html — cookbook manifest guide (accessed 2026-07-29)
- Dead/moved sources observed directly: help.ardrive.io (NXDOMAIN), docs.ardrive.io (redirects to docs.ar.io), permaweb.news (expired-domain redirect), ardrive.io/manifests and /manifest-demo (404) — all checked 2026-07-29
