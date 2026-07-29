# ArDrive Teardown — Lane: Platform Split (Web, Desktop, Mobile, CLI, SDKs)

Research date: 2026-07-29. All live checks (npm registry, GitHub API, iTunes/Play lookups) performed on this date unless a source's own date is given.

## Summary

ArDrive is, as of mid-2026, effectively a **single-platform product**: an actively developed Flutter web app (app.ardrive.io, releases every 1–3 weeks, v2.85.0 in July 2026), with a power-user CLI on a slow cadence and two developer SDKs — one of which (Turbo SDK) has become the real center of developer gravity. Every other client is dead: the Electron desktop app never left alpha (last commit April 2021), the one-way sync CLI never left beta (last publish March 2022), the Android app was formally sunset on October 30, 2025 for lack of traction, and the iOS app **never shipped at all** because Apple rejected it in October 2022 for not implementing In-App Purchases. There is no Dropbox-style two-way folder sync anywhere in the lineup and never has been — "sync" in ArDrive vocabulary means refreshing the metadata index from the chain, and even that needed a "major overhaul" in July 2026 to get incremental syncs from 376 seconds to under 1 second. The platform story is one of ambitious expansion (4+ clients by 2022) followed by honest, well-communicated contraction back to "web + PWA + wallet-browser on mobile." That contraction, and the reasons for it, are the most instructive part of this teardown for EFS.

## Findings

### 1. Platform inventory, 2026 snapshot

| Client | Status (2026-07-29) | Last release/activity | Evidence |
|---|---|---|---|
| **Web app** (app.ardrive.io) | Active flagship | v2.85.0, Jul 3 2026; repo pushed 2026-07-29 | github.com/ardriveapp/ardrive-web releases; GitHub API |
| **Permaweb dapp mirror** (dapp.ardrive.io + versioned tx IDs) | Active, updated with releases | — | ardrive.io/dapp-history-of-ardrive (Wayback, snapshot 2025-06-02) |
| **Desktop app** (Electron, ardrive-desktop) | Abandoned in alpha | npm 0.1.12 published 2020-09-03; last commit 2021-04-02 | npm registry; GitHub commits |
| **Sync CLI** (ardrive-sync) | Abandoned in beta | npm 0.1.12 published 2022-03-25; last push 2022-11-18 | npm registry; GitHub API |
| **Android app** (io.ardrive.app) | **Sunset Oct 30 2025**, delisted from Play ~Oct 8 2025 | Last update 2025-09-24 (AppBrain) | ardrive.io/mobile (Wayback 2025-10-26); AppBrain |
| **iOS app** | **Never shipped** — Apple rejection, Oct 2022 | n/a | jonniesparkles.medium.com "wen ArDrive Mobile for iOS?" (2022-10-25) |
| **CLI** (ardrive-cli) | Maintained, slow cadence | v4.0.0 published 2026-02-26; ~196 npm downloads/week | npm registry + downloads API |
| **Core SDK** (ardrive-core-js) | Maintained | v4.0.0 published 2026-02-25; ~640 downloads/week; pushed 2026-07-15 | npm registry; GitHub API |
| **Turbo SDK** (@ardrive/turbo-sdk) | Very active | v1.42.0 published 2026-06-12; ~4,666 downloads/week; pushed 2026-07-24 | npm registry; GitHub API |

Weekly npm downloads (2026-07-22 → 2026-07-28): turbo-sdk 4,666; ardrive-core-js 640; ardrive-cli 196; ardrive-sync 11. The Turbo SDK out-downloads the ArFS-aware tooling roughly 6:1 — developers overwhelmingly consume ArDrive's *upload rail*, not its *filesystem*.

### 2. Web app: the sole survivor, and genuinely well-run

- **Cadence**: roughly one release every 1–3 weeks over the last 12 months, with clusters of 5 releases in 7 days (June–July 2026). Public GitHub release notes are specific and include performance numbers (github.com/ardriveapp/ardrive-web/releases, accessed 2026-07-29).
- **Recent feature direction** (last ~9 months of release notes): Solana wallet login and a cross-chain identity/profile redesign showing .sol/.eth names (v2.82, Jun 2026); crypto payment for Turbo credits in 8 tokens (v2.78, Feb 2026); a Snapshots tab (v2.79, Mar 2026); per-drive sync control and auto-sync disable (v2.80, May 2026); .eml preview (v2.75, Oct 2025); markdown note creation (PR PE-8691). Login also supports MetaMask by deriving an Arweave wallet from an Ethereum signature (help-center article "Log Into ArDrive: MetaMask Wallet", via search snippet — the article itself is now offline, see Finding 6).
- **The sync-performance saga**: v2.77 (Jan 2026) "sync performance improvements for large drives," v2.80 adds the ability to *turn auto-sync off*, and v2.85 (Jul 2026) is titled "Sync Performance — Major Overhaul," claiming incremental syncs dropped from **376 seconds to under 1 second** via GraphQL query optimization. Reading between the lines: for years, opening a large drive meant a multi-minute metadata crawl. This is the single most instructive UX datum in the lane — chain-indexed file listing was the bottleneck, badly enough that they shipped an "off switch" before they shipped the fix.
- **Upload limits** pushed power users off the web app: help-center guidance (now offline; via search snippet, accessed 2026-07-29) said public-drive web uploads are limited by browser memory, private uploads to 100 MB, Turbo uploads to 500 MB public / 100 MB private, while the CLI handles files up to 2 GB and bulk bundling. Figures may be stale; notably, a GitHub issue asking "what is the maximum file size on app.ardrive.io?" (ardrive-web #2098, Nov 2025) has sat **unanswered for eight months** — current limits are not documented anywhere findable.
- **PWA is the official desktop/mobile answer**: the mobile sunset FAQ explicitly directs users to "ArDrive Web… can also be saved as PWA." Third parties fill the desktop gap — WebCatalog sells an Electron wrapper of the web app (webcatalog.io/en/apps/ardrive) — there is no first-party desktop client of any kind.
- **Permaweb self-hosting as a feature**: ArDrive publishes every web-app version to Arweave itself (dapp.ardrive.io, plus versioned tx IDs and gateway mirrors like ardrive.ar-io.dev), marketed as "if the ArDrive team disappears, nothing happens to your data or the app" (dapp-history post, Wayback 2025-06-02). Real dogfooding, and a genuinely distinctive resilience story.
- **Domain sprawl confuses users**: app.ardrive.io (hosted app), dapp.ardrive.io (permaweb version), ardrive.net (their AR.IO gateway domain — CLI v4.0.0's headline change was rewriting hardcoded arweave.net references to ardrive.net), staging.ardrive.io. A user filed a GitHub issue in April 2026 asking, verbatim, what the difference between app.ardrive.io and ardrive.net is (ardrive-web #2143 area; open, unanswered as of 2026-07-29).

### 3. Desktop: died in alpha, quietly, six years ago

The original ArDrive product (2020) was a desktop sync concept: `ardrive-desktop` (Electron/React, README self-describes as "data synchronization application," warns "this is currently an alpha version, so do not store anything sensitive just yet!!") and `ardrive-sync` (Node CLI, "basic public and private drive synchronization," beta). Hard numbers: ardrive-desktop npm 0.1.12 published **2020-09-03**, last commit **2021-04-02**, 9 GitHub stars; ardrive-sync npm 0.1.12 published **2022-03-25**, last push 2022-11-18, 4 stars, 11 npm downloads/week. Neither repo is archived and neither README carries a deprecation notice — they're just dead, discoverable, and still advertised nowhere. There was never a formal desktop retirement announcement equivalent to the mobile one; the pivot to the Flutter web app (2021) simply absorbed all effort. Verdict: ArDrive attempted Dropbox-style desktop presence exactly once, at the very start, and abandoned it before it ever reached beta quality.

### 4. Mobile: Android shipped and died; iOS was killed by Apple policy

- **Android**: launched on Google Play October 2022 with CoinDesk coverage (coindesk.com, 2022-10-06). Final stats per AppBrain (accessed via search 2026-07-29): **4.4 stars from just 39 ratings** — three years on a store and fewer than 40 reviews is the traction verdict in one number. Representative review complaints: "pressing the back key in any screen closes the app," files not saving to the download folder on Xiaomi second-space, requests for dark mode; positive reviews of the "store data permanently, super cool" variety. Last updated 2025-09-24; removed from Play on 2025-10-08 (AppBrain "unavailable since").
- **The sunset** (primary source: ardrive.io/mobile FAQ, Wayback snapshot 2025-10-26): discontinued as of **October 30, 2025**. Stated reason, verbatim theme: "We haven't seen the level of usage and traction needed to justify ongoing maintenance… resources can be better focused on improving and expanding the web version… which serve[s] the bulk of our community." Users told to export their keyfile, switch to ArDrive Web/PWA, or access ArDrive through the **Wander Mobile** wallet app (Wander = rebranded ArConnect; it *is* on the iOS App Store and Google Play — so ArDrive's mobile strategy is now "ride inside someone else's wallet app"). The final APK was archived on Arweave "for historical, audit, or experimental purposes." Notably graceful: data unaffected, clear dates, clear migration path.
- **iOS never existed**: after initial approval and a planned Oct 5, 2022 launch, Apple rejected ArDrive at the last minute for not implementing In-App Purchases, arguing that paying to upload was "unlocking functionality" that must go through Apple's payment rails; ArDrive countered that the app is fully functional without purchases, lost the appeal, and gave up ("the Apple iOS version will no longer be Available Soon™" — JonnieSparkles, Medium, 2022-10-25). This is a structural hazard for *any* pay-per-upload crypto storage app on iOS, not an ArDrive-specific stumble.
- **Residual stale marketing**: the current ardrive.io homepage (accessed 2026-07-29) still shows the app on phone/tablet hero imagery nine months after the mobile sunset.

### 5. CLI: the genuine power-user product

`ardrive-cli` (96 stars, v4.0.0 Feb 2026) is explicitly aimed, per its own README, at "ArDrive power users with advanced workflows and resource efficiency in mind: bulk uploaders, those with larger storage demand, game developers, nft creators, storage/db admins" plus automation/services. Capabilities the web app doesn't match (README, accessed 2026-07-29):

- Bulk folder upload with hierarchy reconstruction and automatic multi-bundle splitting (bundles capped near 500 items / 500 MiB for gateway reliability); files up to 2 GB.
- **Arweave path manifest creation** from public folders — the web-app-hosting workflow (their React-app example) that made ArDrive a site-deploy tool.
- Dry-run cost estimation before committing irreversible spends; retry of failed transactions; fee-boost multipliers against congestion.
- Cold-wallet support: sign AR transfers on an air-gapped machine.
- Custom metadata attachment, remote-URL ingestion, custom content types.
- JSON output designed for `jq` piping — the docs teach share-link extraction and storage-total pipelines.
- `--turbo` flag (beta) to pay uploads with Turbo Credits instead of AR.

Cadence is slow but alive: 3.0.x through 2025 (ArFS v0.15 drive-privacy support), 3.1.0 Oct 2025, 4.0.0 Feb 2026 (core 4.0.0 + the arweave.net → ardrive.net gateway rewrite). ~196 npm downloads/week and 5 open issues — a small, stable power-user niche, not a growth surface. The CLI's *feature* release notes trail the web app by months (no Solana, no crypto-topup parity visible).

### 6. SDKs: two products with opposite trajectories

- **ardrive-core-js** (58 stars, v4.0.0 Feb 2026, ~640 downloads/week): the ArFS-aware engine under the CLI. It is the only supported way to *programmatically* manipulate drives/folders/files as a filesystem. Maintained (pushed Jul 2026) but clearly a dependency, not a promoted developer product.
- **@ardrive/turbo-sdk** (59 stars, v1.42.0 Jun 2026, ~4,666 downloads/week, 1,729 commits): uploads (files/folders/raw data), Winston-credit purchase and sharing, Stripe fiat top-ups, and payment in AR/ARIO, ETH, SOL, POL, base-ETH/USDC/ARIO, KYVE. Browser + Node, CDN build. Crucially, **it is not ArFS-aware** — it does raw uploads and manifest generation only. The 6:1 download ratio over core-js says developers want ArDrive's payment/upload rail without its filesystem.
- **Ecosystem confirmation**: AR.IO's own docs steer site deployment to `permaweb-deploy` (a Forward Research tool built on Turbo + ArNS), not ardrive-cli (docs.ar.io/build/guides/permaweb-deploy, accessed 2026-07-29). Even within its own ecosystem, the ArFS toolchain is being routed around for the most common developer job.

### 7. Support and docs surface: consolidated into AR.IO, with decay

- docs.ardrive.io now serves only a redirect page to **docs.ar.io/build/advanced/arfs** — ArDrive's documentation identity has been folded into AR.IO's docs as an "advanced" subsection (verified by direct fetch, 2026-07-29).
- **help.ardrive.io (Zendesk) no longer resolves at all** (DNS failure, 2026-07-29); a merged ardrive-web PR "PE-8655: remove zendesk help links" confirms deliberate retirement. Years of how-to articles (upload limits, MetaMask login, gateway switching, manifests) are now reachable only through search caches and the Wayback Machine.
- Support is Discord-first. GitHub community questions go unanswered (the max-file-size and ardrive.net-confusion issues, both open, both zero responses).
- Corporate arc for context: Permanent Data Solutions → ArDrive raised $17.2M (Decrypt, 2022) → company/brand consolidated under **AR.IO** (gateway network + ARIO token); ArDrive is now positioned as AR.IO's flagship consumer app. The ardrive.io footer links docs to docs.ar.io.

### 8. Sync: there is no sync

Full stop: ArDrive has never shipped two-way, Dropbox-style folder sync on any platform. The 2020 desktop/sync tools were one-way "upload watcher" designs that died pre-GA (Finding 3). In the current product, "sync" exclusively means *refreshing the client's index of on-chain metadata* — and that operation was slow enough to need an off-switch (v2.80) and then a rearchitecture (v2.85). Nothing in the docs, repos, or announcements suggests a sync client is planned; the mobile sunset FAQ doubles down on web-only. I could not find a high-signal public thread of users demanding sync (searches for ArDrive + sync-client complaints surface other products; ArDrive's community lives in Discord, which I cannot search from here) — the honest read is that ArDrive's user base is too small and too archive-oriented to generate loud sync demand, and that permanent immutable storage makes true sync semantically awkward anyway (every save is a new permanent revision you paid for). Flag: absence of complaints is evidence of a small community, not of user satisfaction.

## Strengths

- **The web app is run like a real product.** Weekly-ish releases, public changelogs with actual performance numbers, visible responsiveness to pain (sync overhaul, per-drive sync control). By web3 standards this is top-decile release hygiene.
- **The CLI is genuinely excellent** — dry-run cost estimates before irreversible spends, cold-wallet signing, JSON-pipeable output, manifest hosting, automatic bundle management. It treats the terminal as a first-class product, not an afterthought.
- **Permaweb-hosted version history of their own client** (dapp.ardrive.io + every prior version at a permanent tx ID) is a unique, credible resilience claim almost no competitor can make: "if we disappear, the app and your data both keep working."
- **Turbo SDK's payment abstraction is the best onboarding move in the lineup**: fiat via Stripe, payment in eight-plus tokens across four chains, credit sharing. Its 4.7k weekly downloads are the strongest adoption signal anywhere in ArDrive's stack.
- **They kill products well.** The mobile sunset FAQ is a model: clear date, clear reason (no traction), data-safety reassurance, keyfile export instructions, migration paths, and the APK archived permanently on Arweave. Compare with the silent desktop abandonment five years earlier — they learned.

## Weaknesses / user pain

- **Platform contraction to web-only.** Four client lines in 2022 → one in 2026. Desktop never got past alpha; Android got 39 ratings in three years; iOS never launched. Users wanting native experiences are handed a PWA and a third-party wallet's in-app browser.
- **Apple's IAP wall was never solved** — pay-per-upload storage was ruled "unlockable content." ArDrive appealed, lost, and exited iOS permanently. Structural risk for the whole category.
- **No folder sync, ever** — the one workflow that defines consumer cloud storage (drop a folder, it stays backed up) has never existed here, and the tools that gestured at it are six-years dead but still publicly listed without deprecation notices.
- **Chain-index performance was allowed to be terrible for years**: 376-second incremental syncs on large drives until July 2026. The web app's usability on big drives was gated on a GraphQL rearchitecture that arrived very late.
- **Docs/support decay**: the entire Zendesk help center was deleted (dead DNS, not even redirects), docs demoted to a subsection of another product's site, and GitHub questions — including "what's the max file size?" — go unanswered for months. Institutional knowledge now lives in Discord and the Wayback Machine.
- **Naming and domain sprawl** (app.ardrive.io / dapp.ardrive.io / ardrive.net / ar-io.dev mirrors) demonstrably confuses users, per their own issue tracker.
- **Capability fragmentation**: web can't do big/bulk uploads, CLI can't do the new payment/login features, Turbo SDK can't do ArFS. No single client exposes the full product.
- **Stale marketing**: homepage still sells mobile imagery nine months after the mobile app was killed.

## Implications for the EFS file browser

1. **One excellent web client first; resist platform sprawl.** ArDrive built four clients before product-market fit and spent 2021–2025 walking three of them back. EFS's web-OS "Files" app matches the survivor strategy — treat desktop/mobile shells as post-traction bets, and if the web app must be installable, make the PWA path first-class rather than an FAQ consolation prize.
2. **Index/sync performance is the product.** The defining UX failure of a chain-backed file browser is slow listing/refresh — ArDrive lived with 6-minute syncs on large drives and had to ship an "off switch" before the fix. The EFS SDK's resolution/caching layer should budget for sub-second incremental drive refresh from day one, and the Files app should render instantly from cache with background reconciliation (correct → easy → fast still holds; this is a correctness-of-experience issue, not premature perf).
3. **Mobile: plan for wallet-browser distribution, not app stores.** Apple's IAP policy killed ArDrive iOS outright, and Android traction (39 ratings, then sunset) never justified the maintenance. EFS "Files" reaching mobile users through a good responsive PWA plus existing wallet apps' browsers is the evidence-backed path; a native app that triggers pay-per-upload flows is walking into the same Apple wall.
4. **Ship the power-user lane (SDK/CLI) deliberately — it's the stickiest surface.** ArDrive's CLI patterns worth copying into the EFS SDK/tooling: dry-run cost estimation before any irreversible on-chain spend, JSON-pipeable output, bulk folder operations with automatic batching, and manifest-style "deploy a folder as a site" workflows. Also note the cautionary split: ArDrive's raw-upload SDK out-downloads its filesystem SDK 6:1 because the FS layer wasn't what developers wanted to integrate — EFS's SDK should make the filesystem itself the easy path, not a layer people route around.
5. **Two-way sync is an open, unclaimed differentiator.** Nobody in permanent-storage land has Dropbox-style sync, partly because immutable storage makes "sync" mean "pay for every revision forever." EFS's mutable on-chain anchors don't have that semantic problem — a watch-folder/one-way publish in the file browser (with clear cost preview per change) would exceed anything ArDrive ever shipped, without committing to full bidirectional sync.
6. **Self-hostable client versions are a credibility feature worth stealing.** ArDrive publishing every client build to the permaweb ("if we vanish, the app still works") is the strongest trust story in their product. EFS should dogfood equivalently: the Files app (and web OS shell) deployable/pinned via EFS's own mirror mechanisms, with historic versions addressable.
7. **Don't let the support surface rot, and keep naming unified.** Deleting a help center without redirects and splitting identity across four domains measurably confused ArDrive's users. For EFS: one canonical app origin, docs that survive re-orgs, and answered issue trackers are cheap differentiation.

## Sources

- https://github.com/ardriveapp — org repo listing (accessed 2026-07-29)
- https://github.com/ardriveapp/ardrive-web/releases — web app release notes, v2.75–v2.85 (accessed 2026-07-29)
- https://github.com/ardriveapp/ardrive-cli — CLI README and capabilities (accessed 2026-07-29)
- https://github.com/ardriveapp/ardrive-cli/releases — CLI release history incl. v4.0.0 (accessed 2026-07-29)
- https://github.com/ardriveapp/ardrive-desktop — desktop alpha README; last commit 2021-04-02 (accessed 2026-07-29)
- https://github.com/ardriveapp/ardrive-sync — beta sync CLI README (accessed 2026-07-29)
- https://github.com/ardriveapp/turbo-sdk — Turbo SDK README (accessed 2026-07-29)
- npm registry API — publish timestamps and weekly downloads for ardrive-cli, ardrive-core-js, @ardrive/turbo-sdk, ardrive-desktop, ardrive-sync (queried 2026-07-29)
- GitHub REST API — repo metadata (stars, pushed_at, archived flags) and issues #2098 etc. (queried 2026-07-29)
- https://ardrive.io/mobile — "FAQ: Sunsetting ArDrive Android App" (via Wayback snapshot 2025-10-26; original now 404)
- https://ardrive.io/dapp-history-of-ardrive — permaweb-hosted app versions (via Wayback snapshot 2025-06-02; original now 404)
- https://www.appbrain.com/app/ardrive/io.ardrive.app — Play Store stats: 4.4★/39 ratings, removed 2025-10-08 (via search snippet, accessed 2026-07-29; direct fetch blocked)
- https://play.google.com/store/apps/details?id=io.ardrive.app — returns 404 (verified 2026-07-29)
- iTunes Search/Lookup API — no ArDrive iOS app exists; Wander Mobile (io.arconnect.app) present (queried 2026-07-29)
- https://jonniesparkles.medium.com/wen-ardrive-mobile-for-ios-c1f9153c875a — iOS Apple rejection post (2022-10-25)
- https://www.coindesk.com/business/2022/10/06/ardrive-mobile-goes-live-on-google-play-store-bringing-decentralized-data-storage-to-android-devices — Android launch (2022-10-06)
- https://docs.ardrive.io/ — redirect to https://docs.ar.io/build/advanced/arfs (verified 2026-07-29)
- https://docs.ar.io/build/guides/permaweb-deploy — AR.IO's recommended deploy tool (accessed 2026-07-29)
- https://ardrive.io/ — current homepage (accessed 2026-07-29)
- help.ardrive.io — DNS no longer resolves (verified 2026-07-29); former articles (upload limits, MetaMask login) cited via search snippets
- https://cryptoadventure.com/ardrive-review-2026-permanent-storage-on-arweave-arfs-and-turbo-uploads/ — third-party review (2026-02-21)
- https://www.wander.app/ and App Store listing "Wander Mobile" — ArConnect rebrand, the recommended mobile access path (accessed 2026-07-29)
- https://webcatalog.io/en/apps/ardrive — third-party Electron wrapper of the web app (accessed 2026-07-29)
- https://decrypt.co/93953/blockchain-based-storage-app-ardrive-raises-17-2-million — funding context (2022)
