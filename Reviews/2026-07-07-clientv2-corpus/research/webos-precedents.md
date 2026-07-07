# Web OS and dweb client precedents — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** webos-precedents. **Date:** 2026-07-07.

Autopsies of every serious attempt to ship a "web as OS" or decentralized app platform, with why each lived or died, and what the closest living relatives (MetaMask Snaps, Isolated Web Apps, ATProto) prove is possible for the EFS client v2.

---

## 1. WHAT EXISTS TODAY (shipped, with reality checks)

### 1.1 Firefox OS (2013–2016) — dead; KaiOS is the surviving fork

- Launched 2013 as a carrier-driven, ultra-low-cost "web is the platform" phone OS (Telefónica et al., Brazil/Spain/India). Mozilla announced end of smartphone development **Dec 2015**, end of the project **Sept 2016** (Wikipedia; howtogeek retrospective).
- Cause of death, in order: (1) **distribution partners with misaligned incentives** — carriers/OEMs treated it as an experiment, wanted incremental services revenue Mozilla could not offer, and abandoned it within a couple of product cycles; (2) **app gap** — web apps existed but felt like web apps; missing device APIs; (3) **cheap Android ate the price advantage**, sealed later by Android Go (512MB floor); (4) Mozilla's resources and strategy shifted.
- **KaiOS** (fork by TCL-backed KaiOS Technologies) shipped >170M cumulative devices by 2025 — proof the web-runtime OS can live where it owns a niche. But **WhatsApp ended KaiOS support July 2024**, and KaiOS 4.0 (2025) is defensive; a platform's life depends on one or two anchor apps it does not control.
- **Lesson:** a platform whose success depends on third parties (carriers, one anchor app) with different incentives dies when they defect. EFS's static, content-addressed distribution deliberately has no carrier; its "anchor app" risk is the wallet.

### 1.2 Chrome Apps (2013–2016 announced dead; enterprise tail to 2028)

- Google's packaged web apps (chrome.* APIs, offline, windowing). Deprecation announced **Aug 2016**: "approximately 1% of users on Windows, Mac and Linux actively use Chrome packaged apps." Store stopped new apps Mar 2020; general support ended June 2022; ChromeOS Enterprise/Education tail now phasing out **July 2025 → EOL Oct 2028** (Google support page, 2025).
- Cause of death: a **proprietary packaged-app format bound to one browser**, competing with the open web itself. As the open web gained service workers/PWA installability, the packaged format's only moat was its private API surface — and Google chose to fold those capabilities back into the web platform (leading eventually to Project Fugu and IWAs).
- **Lesson:** packaging must be a *delivery* format for standard web content, not a private API platform. EFS's plan (standard web tech in SES compartments, content-addressed bundles) is on the right side of this; an `efs.*`-only app model that can't share code with the ordinary web would be on the wrong side.

### 1.3 ChromeOS now — Lacros dead, Android absorption ("Aluminium OS")

- **Lacros** (decoupling the Chrome browser from ChromeOS for independent updates) was killed **July 2024** at M128 after 4 years of work (9to5Google 2024-07-12).
- Google confirmed at Snapdragon Summit **Sept 2025** (Sameer Samat): "combining ChromeOS and Android into a single platform." Nov 2025 leaks name it **Aluminium OS**, Android-based, "AI at the core," first devices expected 2026 (chromeunboxed, Nov 2025).
- ChromeOS's actual architecture legacy: verified boot, A/B seamless updates, user-data encryption, everything-is-a-web-app — and it still needed the Android app ecosystem to be viable, twice (ARC++, now full merge).
- **Lesson:** even Google, owning browser + OS + store, could not sustain a browser-only OS; ecosystem gravity beats architectural purity. Also positive: ChromeOS's **A/B generations + verified boot + rollback** is the closest shipped analog to EFS "OS profiles/generations," and it worked well enough that users never think about updates. EFS should copy the generation model while rejecting the forced-update part.

### 1.4 webOS / LG — survival by embedding

- Palm/HP webOS died as a phone OS, but LG's webOS lives as the runtime for TVs and now automotive (Hyundai/Genesis 2023; Xbox Cloud Gaming in cars, Sept 2025). webOS OSE 2.28.0 released **2025-03-27** (Qt 6.8.1, Yocto 5.0).
- **Lesson:** a web-app OS survives where the platform owner controls distribution and the app catalog is small and curated. Its Luna Service Bus (JSON message bus between web apps and system services) prefigures the Kernel/Shell postMessage capability RPC — the pattern is proven in hundreds of millions of TVs.

### 1.5 PWA reality, 2026

- **DMA drama:** Apple removed Home Screen web apps in the EU in iOS 17.4 beta (**Feb 2024**), citing security of alternative engines; reversed **Mar 1, 2024** after Open Web Advocacy / European Commission pressure (TechCrunch 2024-03-01). Net change since: iOS 26 defaults every Add-to-Home-Screen site to open as a web app; iOS 18.2 technically allows alternative engines in the EU but with so much friction that **zero browsers have shipped one as of early 2026** (mobiloud 2026 guide).
- **What PWAs still lack (2026):** on iOS — no Web Bluetooth/USB/NFC/Serial/MIDI (Apple's June 2020 refusal of 16 APIs on fingerprinting grounds still stands), no Background Sync / Periodic Sync / Background Fetch, File System Access only as origin-private sandbox; push finally arrived iOS 16.4 (2023), Declarative Web Push in Safari 18.4 (magicbell 2026 guide). Storage remains evictable; installability is browser-dependent everywhere.
- **Lesson for EFS:** a browser-delivered OS on iOS is a second-class citizen: no true background sync (the flush engine must run opportunistically while open), evictable storage (journal durability needs export paths + on-chain checkpoints), and WebKit-only quirks. Treat iOS as a degraded-but-honest tier, not as the design baseline; desktop Chromium is where the full OS can exist.

### 1.6 Electron / Tauri — the desktop escape hatch

- Tauri v2 (stable **late 2024**) brought mobile targets and a **capability-based permission system, default-deny**, with Rust command allowlisting per window — a mainstream validation of exactly the EFS attenuated-capability posture. Tauri apps ~10MB / 30–50MB RAM vs Electron 150–300MB.
- Tauri's biggest real-world pain: **system-webview fragmentation** (WebView2/WebKitGTK/WebKit render differently); Electron ships its own Chromium for consistency but then owns the patch cadence. Bishop Fox ("Beyond Electron," 2024): switching frameworks *changes* the attack surface rather than removing it; misconfiguration (IPC exposure) is the dominant risk in both.
- **Lesson:** if EFS ever ships a desktop wrapper, Tauri's model (deny-all, per-window capability grants, OS webview) is the philosophical match; but the browser-first plan avoids the whole webview-fragmentation tax. The IPC-misconfiguration finding is a direct warning for the Kernel↔Ring-3 postMessage surface: the boundary's *configuration* will be attacked, not SES itself.

### 1.7 Browser "web desktops": daedalOS, Puter, OS.js

- **daedalOS** (DustinBrett, MIT): one developer's personal-site-as-desktop; window manager, file explorer, terminal, Monaco, Ruffle, v86 emulation — proves the *rendering* of a desktop in a browser is a solved problem and a great demo.
- **OS.js**: long-lived open-source web desktop *platform* — window manager, GUI toolkit, VFS abstraction, application APIs, server-backed multi-user. Teachs that the abstractions that matter are the **VFS and the app API contract**, not the chrome.
- **Puter** (HeyPuter, AGPL, self-hostable, pre-seed VC incl. Accel Starters): the most serious current "Internet OS." Notable inventions: an app store; **puter.js SDK with a "user pays" model** — developers pay zero infrastructure; the user's Puter account is billed for the storage/AI/compute their use consumes, and "your app operates within the permissions granted by the user" (docs.puter.com). This is the centralized-account version of exactly EFS's economics (user pays gas/storage; apps hold no infrastructure).
- **Lesson:** window-manager UX earns attention, not retention; nobody lives in these desktops. What retains is a resource model + identity + one indispensable app. Puter independently converged on user-pays + user-granted per-app permissions — EFS's wallet-mediated version is the trust-minimized upgrade of a shape that already has product traction. Also: all three are **deep-linkable web pages**; EFS's "arrive from a deep link into a file" instinct matches how these actually get used.

### 1.8 Urbit — the cautionary maximal precedent

- Timeline: code 2010, network 2013, ~$1.1M from Founders Fund/a16z; OS1 April 2020; adoption "a few thousand" active users (The Point, Sept 2022); Tlon layoffs early 2023; Foundation ED dismissed and **Yarvin returned as "wartime CEO" Aug 2024** (CoinDesk 2024-08-21); Foundation discovered near-insolvency late 2024; June–July 2025: ED fires Yarvin, board fires ED, Senate recall motion, galaxy-holder vote deadline **July 26, 2025**; Tlon pivoted its Landscape suite down to a simple messenger.
- Why adoption stalled: (1) **clean-slate everything** — Nock/Hoon meant a developer pool of dozens, permanent doc/tooling debt (Yarvin's own 2019 farewell listed "opacity" as a top weakness); (2) **identity as scarce speculative asset** — galaxies/stars fused governance with token politics, producing the 2024–2025 board wars; (3) **immutable-core purity without a product** — 15 years to reach "bare-bones messaging comparable to 1990s Usenet" (Wikipedia); (4) personal-server hosting friction pushed users to Tlon-hosted ships, recentralizing the sovereignty pitch.
- **Lesson:** the strongest single precedent *against* novelty budget misallocation. EFS's choice of ordinary web tech + standard signatures is correct; spend all weirdness on the capability/trust model. Also: **the steward org's finances/governance are a platform risk** — user-controlled content-addressed generations and a Rescue Shell are the mechanism that protects users from steward failure; Urbit users had no such exit.

### 1.9 Solid — spec without gravity

- Solid Protocol 1.0 remains a **W3C Community Group** spec (not a Recommendation). Stewardship moved from Inrupt to the **Open Data Institute, Oct 2024** (theodi.org); Inrupt refocused on enterprise; Berners-Lee's Sept 2025 book re-pitches pods as the substrate for personal AI agents.
- Why thin: pods are a *place to put data* with no reason to visit; RDF/LDP stack imposed semantic-web complexity on app developers; no killer app; consent-UX unsolved; no economic story for pod hosting.
- **Lesson:** "your data in your pod" does not sell; an *experience* does. Data-layer sovereignty (EFS records) must be invisible plumbing under an app someone wants daily. Also, the ODI handoff shows what a graceful stall looks like — governance handoff as substitute for adoption.

### 1.10 ATProto / Bluesky — the deployed schema-first platform

- Architecture: **PDS** (user data repo, signed Merkle trees) / **relay** (firehose aggregation) / **appview** (application indexes), all bound by **lexicons** — a global schema language with NSIDs; apps define their own lexicons; lexicon *resolution* had to be retrofitted (RFC Discussion #3074, late 2024) because nothing initially resolved an NSID to its schema.
- 2025 roadmap (docs.bsky.app, Mar 2025): Sync v1.1 (relays become non-archival — a hobbyist full-network relay now ≈ **$34/month**, down from ~$150/mo in July 2024), OAuth **auth scopes** for granular per-app permissions, PDS web account management, group-private data then E2EE DMs (MLS).
- Reality check: ~38M users (late 2025) but **one true relay** (Bluesky's), the default appview/PDS/moderation all Bluesky-run; "architecture is decentralized, user control isn't automatic" (mackuba.eu, 2025-08-20; HN threads 2025).
- **Lessons:** (1) schema-first works — lexicons are the closest living analog to EFS TAGDEF-namespaced records, and their retrofit pain says *ship schema resolution day one*; (2) make the sovereign unit (PDS ≈ EFS address home) cheap and boring and people actually run it; (3) the **expensive aggregation layer recentralizes** — EFS's analog is discovery/indexing services and lens curation at scale; (4) granular auth scopes arrived *after* apps shipped, painfully — EFS should not repeat "all-or-nothing app auth."

### 1.11 Farcaster mini-apps — distribution inside a feed

- Frames launched **Jan 2024** (+400% DAU in a week); Frames v2 rebranded **Mini Apps** (Jan 2025; v1 frames deprecated end of March 2025). Spec (miniapps.farcaster.xyz): manifest at `/.well-known/farcaster.json` with a **signed domain↔account association** (JSON Farcaster Signature from the custody address), postMessage SDK across iframes/WebViews, EIP-1193 wallet provider, token-based rate-limited notifications, capability/chain declaration up front — and **no formal security sandbox in the spec** (host trust).
- The paradox (blockeden.xyz, 2025-10-28): Snapchain (Apr 2025) delivers 10k+ TPS while registrations collapsed 95.7% from peak, ~4,360 truly engaged accounts, protocol revenue ~$10k/mo against **$180M raised**. Mini-app spikes (40k DAU, Mar 2025) were "not sticky."
- **Lessons:** (1) the signed-domain manifest is a cheap, deployed pattern for app identity EFS can adapt (replace DNS with EFS records + package CID); (2) app distribution embedded in a social surface produces spikes, not retention; (3) infrastructure excellence does not create product-market fit — a warning aimed precisely at protocol-first projects like EFS.

### 1.12 MetaMask Snaps — DEEP DIVE (the production SES app platform)

The single most load-bearing precedent: **untrusted third-party JavaScript running inside a wallet, in SES compartments, in production since 2023, at MetaMask scale, with no publicized compartment-escape incident.**

- **Execution environment** (docs.metamask.io): Snaps run in an iframe-hosted **SES (Hardened JavaScript) compartment** — "a more severe form of strict mode." No DOM, no Node built-ins; only vetted globals (`Promise`, `SubtleCrypto`, `WebAssembly`, `TextEncoder`, permission-gated `fetch`); two capability globals: `snap` (Snaps API) and `ethereum` (gated by `endowment:ethereum-provider`). Long-running execution is bounded (`maxRequestTime` 5s–180s per handler).
- **Permission model:** manifest `initialPermissions` declares everything up front. Endowments include: `network-access` (exposes `fetch` — the *only* network path), `rpc` (accept JSON-RPC from dapps/other snaps, origin-allowlisted), `transaction-insight` and `signature-insight` (read-only pre-signing payload access), `keyring` (custom account types), `cronjob`, `page-home`, `name-lookup`, `lifecycle-hooks`, `webassembly`. State via `snap_manageState` (encrypted at rest). This is a real, shipped catalog of "what does a wallet-OS app need" — EFS's `efs.*` surface should be checked against it item by item.
- **Three-tier trust:** *open* permissions (UI, storage) → installable by anyone; *protected* (network access, dapp communication) → **manual MetaMask review for allowlist**; *key management* → **mandatory third-party audit** (approved firms: Consensys Diligence, Cure53, Hacken, Kudelski, OtterSec, Sayfer, SlowMist) + team review + two approvals.
- **What audits actually find** (Consensys Diligence meta-analysis of **40 audited Snaps across 9 firms**, Dec 2023): input validation failures, consent/UX violations (acting without adequate user confirmation), vulnerable dependencies, permission overreach. Explicitly acknowledged residual risk: **Snaps UI does not display the origin of a request** — UI deception, not sandbox escape, is the live threat class. Markdown injection in snap-rendered dialogs was a real bug class.
- **Developer friction:** audit cost + allowlist latency were the top complaints; MetaMask responded (2024–2025) by letting non-key-management Snaps skip audits, opening a subset to fully permissionless install, and standing up an experimental community directory (permissionless.snaps.metamask.io) — "our first step on the road to becoming fully permissionless" (metamask.io news). Result 2026: **hundreds** of Snaps (not thousands); Snaps became the mechanism for MetaMask's own multichain expansion (Solana/Bitcoin support are Snaps) — the platform is load-bearing for first-party features even though third-party volume is modest.
- **Lessons:** (1) SES compartments + manifest permissions + tiered review **works in production**; (2) the failure mode moves up the stack to consent UX and origin display — Shell-owned secure chrome with mandatory app identity is not optional polish, it is *the* defense; (3) gatekeeping kills third-party volume, permissionless kills safety — Snaps' trajectory (start gated, publish criteria, open tiers gradually, let community curation grow) is the tested middle path, and **EFS lenses are structurally a better version of the community directory they are trying to build**; (4) platform pays its way when first-party features dogfood it.

### 1.13 web3:// (ERC-4804 / 6860) + gateways

- **ERC-4804** (Web3 URL → EVM call translation) finalized 2023 (Qi Zhou/EthStorage); **ERC-6860** is the corrective revision; **ERC-6821** maps ENS names. Ecosystem: `web3://` gateways (w3link), evm-browser, OCWebsites; EthStorage L2 targets the cost problem (blobs, ~1000x cheaper). Post-Bybit-hack (Feb 2025, $1.5B, compromised Safe *frontend*), EthStorage pitches on-chain frontends as the fix and shipped a **client-side verification prototype** (Colibri stateless client verifying gateway bytes against on-chain commitments at ~0.45x download-time overhead; blog.ethstorage.io, 2025).
- **eth.limo** (the de facto ENS/IPFS gateway): 65–77M requests/month, 99.999% uptime in Q3 2025; ENS-DAO funded; operator gave **federal trial testimony July 2025** and needed DAO reimbursement for legal costs — gateway operators are legal chokepoints (discuss.ens.domains, Q3 2025 update).
- **Lesson:** web3:// is real but pre-adoption; its whole value collapses to the gateway's honesty unless clients verify. The Bybit frontend hack is the strongest recent argument for EFS's content-addressed, signature-verified app distribution. EFS memory note: web3:// is already the blessed zero-infra write default — fine, but every gateway is an observer and a subpoena target; endpoint choice must stay a user capability.

### 1.14 IPFS dapp distribution reality

- The canonical pattern (Uniswap, blog.uniswap.org): every release built by CI, pinned (Pinata), addressed by CID, `app.uniswap.org` = DNSLink → Cloudflare gateway; daily deploys. Aave, Spark (MakerDAO) similar.
- The IPFS blog's own verdict ("State of Dapps on IPFS," 2024): **"users cannot benefit from the integrity IPFS provides without running their own node"** — in practice everyone trusts a centralized gateway; DNSLink reintroduces DNS trust; ENS resolution still runs through eth.limo-class intermediaries. Fixes in flight: **Helia + @helia/verified-fetch** (browser-side verified retrieval from trustless gateways), **service-worker gateways** that verify CIDs locally, and a **"local app installer" PWA that caches verified dapps** (Liquity proposal, IPFS Dapps WG, formed Jan 2024) — the last one is, almost verbatim, the EFS Bootstrapper.
- Pinning economics: pinning is cheap (free tiers to ~$20/mo for app-sized bundles); the cost center is *gateway bandwidth*, which is why gateways centralize. Content-addressed app bundles are economically trivial to replicate; serving them fast is not.
- **Lesson:** verification-by-default in the client (service worker + verified fetch) is the one thing nobody shipped and everybody now agrees on. EFS client v2 should be the first OS where **unverified bytes never render** — the ecosystem has already written the design documents for us.

---

## 2. WHAT IS EMERGING (status + date)

- **Isolated Web Apps (IWA)** — Chromium's "bundled, versioned, signed" app model: `.swbn` Signed Web Bundles (Ed25519/ECDSA-P256, integrity block), identity = public key → `isolated-app://` scheme, **default-deny permissions** via manifest `permissions_policy`, unlocks Direct Sockets/Controlled Frame, updates via polled Update Manifest (4–6h) with channels. Status: Chrome/ChromeOS 120+, **ChromeOS-only, enterprise-managed, allowlisted from Chrome 143**; other platforms "later" (developer.chrome.com/docs/iwa, 2025–2026). *The closest architectural relative to the EFS client; not consumer-shippable, but its packaging/identity/update design is copyable today.*
- **Aluminium OS** — Android-based ChromeOS successor, announced Sept 2025, expected at I/O May 2026, devices H2 2026. Confirms the browser-OS era is closing at Google; the web-app-OS torch passes to IWAs and independent projects.
- **ATProto auth scopes + lexicon resolution + private data** — granular per-app OAuth and schema resolution shipping through 2025–2026; group-private data and MLS-based E2EE DMs designed but not shipped (docs.bsky.app roadmap, Mar 2025).
- **Snaps permissionless path** — community-curated directory experiment live; audit requirement already dropped for non-custodial Snaps (metamask.io, 2024–2025). Watch as the live experiment in decentralizing an app allowlist.
- **Helia verified-fetch / service-worker IPFS verification / dapp local installer** — IPFS Dapps WG output, 2024–2026; verified retrieval in browsers is becoming a library problem, not a research problem.
- **EthStorage client-side gateway verification (Colibri)** — stateless-client proof checking of web3:// gateway responses, prototype 2025.

## 3. WHAT WOULD BE AN EFS-SPECIFIC INVENTION

- **Lens-curated app distribution:** every precedent uses a central allowlist (MetaMask), a store (Chrome/Puter), or nothing (Farcaster). Per-viewer trusted-curator lenses with first-attester-wins and honest read grades as the *app store replacement* has no deployed precedent — closest analogs are the Snaps community directory (centralized fallback) and F-Droid repos.
- **Read-grade-labeled offline OS state** (LIVE/STALE/EQUIVOCAL... venue-qualified) — no shipped OS labels freshness honestly; everything else silently serves cache.
- **One-signature journaled batch writes with portable signed bundles** — wallets sign per-action; nothing ships an OS write-journal → Merkle-envelope flush pipeline.
- **No-ambient-HTTP as an OS invariant** — IWAs get closest (default-deny permissions policy) but still assume the app can be granted broad fetch; per-endpoint network capabilities with capability-diff prompts is unshipped anywhere.
- **User-pinned content-addressed OS generations with rollback** — ChromeOS has A/B generations (vendor-controlled); Nix has user generations (not a browser OS); the combination in-browser is new.

---

## 4. LESSONS AND TRAPS (cross-cutting)

1. **Partner-dependent distribution kills platforms** (Firefox OS carriers; KaiOS/WhatsApp). Never let a third party own the reason users stay.
2. **Proprietary packaged formats on one runtime die at ~1% adoption** (Chrome Apps). Package standard web content; keep apps portable to the plain web.
3. **Infrastructure excellence ≠ retention** (Farcaster: 10k TPS + 95.7% registration collapse; Urbit: 15 years to Usenet parity; Solid: pods nobody visits). One daily-use app outweighs any protocol property.
4. **Decentralized architectures recentralize at the expensive layer** (Bluesky's single relay; IPFS gateways; eth.limo as ENS chokepoint and legal target). Design so the *user-facing* trust doesn't silently route through the expensive layer; make verification client-side.
5. **Sandboxes hold; consent UX breaks** (Snaps: 40 audits' findings are input validation and consent violations, origin-display gap, markdown injection — not SES escapes; Demonic CVE-2022-32969 was a browser-feature leak outside the sandbox entirely). Budget security effort accordingly: secure chrome, origin display, prompt integrity.
6. **Steward-organization failure is a user-facing risk** (Urbit Foundation insolvency + 2025 board wars; Solid's handoff to ODI; Mozilla's strategy shifts). Content-addressed generations, rollback, and a Rescue Shell are the *technical* answer to *organizational* mortality.

---

## 5. EFS TRANSLATION — opinionated recommendations

1. **Clone the Snaps permission architecture, fix its known hole.** Manifest = authority ceiling (`initialPermissions`-style), runtime grants below it, tiered trust (open / reviewed / audited classes) — but make Shell-owned secure chrome *always* display requesting app identity + origin + risk class. Snaps' own security team names origin-nondisplay as the top residual risk. Bounded per-request execution time (Snaps' `maxRequestTime`) is worth copying for Ring-3 handlers.
2. **Adopt IWA packaging semantics now, inside the browser.** Signed content-addressed bundle, identity derived from signing key + package CID, default-deny permissions policy, channelized update manifests with capability diffs, standalone scheme-like isolation via SES + service worker. Keep the format convertible to a real `.swbn` so EFS apps become genuine IWAs when the platform opens up.
3. **Make lenses the app store.** Snaps is groping toward community-curated allowlists from a centralized start; EFS already has the primitive. App install policy = "packages attested by curators in my lens order," with deny facts as malware response. Ship a first-party curation lens as the default, expect users to never change it (Bluesky lesson: defaults are the product).
4. **Unverified bytes never render.** Service-worker + verified-fetch pattern (Helia WG design, EthStorage Colibri direction): every app bundle, record, and mirror byte is hash/signature-verified client-side before use; gateways are dumb pipes chosen by capability. This is the one thing the entire dweb ecosystem agrees it failed to ship — being first is a real differentiator, and it collapses the gateway-trust and Bybit-frontend attack classes.
5. **Spend zero novelty on developer stack** (Urbit's corpse marks the spot). Ring-3 apps are ordinary Lit/JS/WASM web apps consuming `efs.*`; an EFS app with the OS SDK removed should still be a runnable web page. Publish lexicon-style typed schemas for OS actions from day one (ATProto's retrofit pain).
6. **Design the flush engine for hostile platform limits.** iOS gives no background sync and evictable storage: journal durability needs explicit export (`.efs-bundle`), visible "unflushed work" state at Shell level, and opportunistic-foreground flushing. Treat "browser evicted my journal" as a first-class recovery flow, not an edge case.
7. **Copy ChromeOS generations, reject vendor control.** A/B profile generations, verified (signature+CID) boot chain via Bootstrapper, one-tap rollback, Rescue Shell always reachable — user-pinned, never auto-advanced without consent. This is also the org-failure insurance (lesson 6).
8. **Pick the retention app before freezing the platform.** Every dead precedent shipped platform-first. The client v2 design should name its Uniswap-equivalent — the one flow (likely: permanent archive + citation links that never rot) that a real user does weekly — and let that app's needs drive which OS surfaces ship first.

## 6. WHERE EFS v2 PROTOCOL MAY UNDER-SUPPORT THE CLIENT

1. **No app-package primitive.** TAGDEF/DATA/LIST/PIN/TAG can encode "app package + version + manifest + channel" only by convention. ATProto's lexicon-resolution retrofit shows what happens when schema/identity conventions are left implicit — clients improvise incompatibly. Needs a blessed, versioned app-manifest convention (and probably reserved keys) in `Designs/efsv2/`.
2. **Security response runs through lens deny composition.** Permanent records mean a malicious app is never deleted, only denied/unlisted. Is deny propagation fast and authoritative enough to be a malware kill switch? Who publishes emergency deny facts, and does UNKNOWN fall through to a still-installable grade? A "security advisory" read-path with defined latency seems required.
3. **Curator key compromise = supply-chain incident with no rotation story until KEL succession lands** (identity doc reserves succession to ~2030). App-curation lenses concentrate exactly the risk the reservation defers; client v2 needs an interim curator-key-rotation or multi-curator-quorum convention.
4. **Update discovery under no-ambient-HTTP.** IWA updates poll an HTTP manifest; EFS updates must be discovered via venue reads through granted endpoint capabilities. Read grades express staleness but there is no "update channel" primitive binding package lineage + channel + freshness expectations; the client will have to invent one on top of LIST/TAG.
5. **Envelopes carry no per-record risk classes.** The journal batches heterogeneous intents under one signature; the listed UX trap ("bundled prompt hides one dangerous action") has no protocol support — preflight display must classify records client-side. A small, standardized record-risk taxonomy (even purely conventional) would let any wallet/Shell render honest batch prompts.

---

## Sources (dated)

- https://en.wikipedia.org/wiki/Firefox_OS (accessed 2026-07)
- https://www.howtogeek.com/whatever-happened-to-firefox-os-mozillas-android-alternative/ (2024)
- https://en.wikipedia.org/wiki/KaiOS ; https://kaios.dev/2024/12/whats-coming-in-kaios-4.0/ (2024-12)
- https://blog.chromium.org/2016/08/from-chrome-apps-to-web.html (2016-08-19)
- https://9to5google.com/2020/01/15/google-killing-chrome-apps/ (2020-01-15)
- https://support.google.com/chrome/a/answer/15950395 (2025; July 2025 → Oct 2028 EOL)
- https://9to5google.com/2024/07/12/chromeos-lacros-ending/ (2024-07-12)
- https://chromeunboxed.com/googles-new-aluminium-os-is-the-android-based-future-of-chromeos-and-we-have-the-first-details/ (2025-11)
- https://en.wikipedia.org/wiki/WebOS ; https://www.webosose.org/ (OSE 2.28.0, 2025-03-27)
- https://techcrunch.com/2024/03/01/apple-reverses-decision-about-blocking-web-apps-on-iphones-in-the-eu/ (2024-03-01)
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide (2026)
- https://www.mobiloud.com/blog/progressive-web-apps-ios (2026)
- https://developer.chrome.com/docs/iwa/introduction (2025–2026)
- https://chromestatus.com/feature/5146307550248960 (IWA status)
- https://github.com/WICG/isolated-web-apps (ongoing)
- https://www.buildmvpfast.com/blog/tauri-v2-vs-electron-desktop-apps-2026 (2026)
- https://bishopfox.com/blog/beyond-electron-attacking-alternative-desktop-application-frameworks (2024)
- https://github.com/DustinBrett/daedalOS ; https://www.os-js.org/ ; https://github.com/HeyPuter/puter
- https://docs.puter.com/user-pays-model/ (2025–2026)
- https://en.wikipedia.org/wiki/Urbit (2024–2025 events)
- https://urbit.org/blog/a-founders-farewell (2019-01-13)
- https://www.coindesk.com/tech/2024/08/21/wartime-ceo-urbits-founder-returns-in-shakeup-at-moonshot-software-project (2024-08-21)
- https://www.jeremytunnell.com/post/urbit-at-a-crossroads (2025-07-14; UF insolvency + governance vote)
- https://theodi.org/news-and-events/news/odi-and-solid-come-together-to-give-individuals-greater-control-over-personal-data/ (2024-10)
- https://en.wikipedia.org/wiki/Solid_(web_decentralization_project)
- https://docs.bsky.app/blog/2025-protocol-roadmap-spring (2025-03)
- https://github.com/bluesky-social/atproto/discussions/3074 (Lexicon Resolution RFC, 2024)
- https://mackuba.eu/2025/08/20/introduction-to-atproto/ (2025-08-20)
- https://atproto.com/guides/self-hosting ; https://lobste.rs/s/z4bimm/full_network_atproto_relay_for_34_month (2025)
- https://docs.farcaster.xyz/reference/frames-redirect (2025); https://miniapps.farcaster.xyz/docs/specification (2025)
- https://danromero.org/frames-now-mini-apps.html (2025-01)
- https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/ (2025-10-28)
- https://docs.metamask.io/snaps/learn/about-snaps/execution-environment/ (2025)
- https://docs.metamask.io/snaps/reference/permissions/ (2025)
- https://docs.metamask.io/snaps/how-to/get-allowlisted/ (2025)
- https://metamask.io/news/navigating-the-security-landscape-of-metamask-snaps (2023-12-12)
- https://metamask.io/news/metamask-snaps-our-first-step-on-the-road-to-becoming-fully-permissionless (2023–2024)
- https://github.com/MetaMask/snaps/wiki/Audits ; https://diligence.security/audits/2025/08/metamask-eip-7715-permissions-snap/ (2025-08)
- https://www.halborn.com/disclosures/demonic-vulnerability (CVE-2022-32969, 2022-06-15; pre-Snaps extension bug, sandbox-external)
- https://eips.ethereum.org/EIPS/eip-4804 (final 2023); https://eips.ethereum.org/EIPS/eip-6860 ; https://eips.ethereum.org/EIPS/eip-6821
- https://blog.ethstorage.io/avoiding-the-1-5-billion-bybit-attack-with-web3-access-protocol-web3/ (2025)
- https://blog.ethstorage.io/client-side-verification-for-on-chain-frontends/ (2025)
- https://discuss.ens.domains/t/eth-limo-q3-2025-update/21577 (2025-10)
- https://blog.ipfs.tech/dapps-ipfs/ (2024)
- https://blog.uniswap.org/uniswap-interface-ipfs (2020, pattern still current)
