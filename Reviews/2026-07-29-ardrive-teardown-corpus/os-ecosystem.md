# The Arweave "OS" Analogue: AO, the Permaweb App Ecosystem, and Identity/Naming as an OS Layer

Lane report for the EFS ArDrive competitive teardown. Scope: product/UX/ecosystem view of the permaweb as an "OS-like" surface — the closest analogue Arweave has to the EFS web-OS client. Researched 2026-07-29; all live-page claims marked (accessed 2026-07-29).

## Summary

Arweave is the strongest possible natural experiment for the EFS web-OS thesis: a permanent-storage chain, seven-plus years old, with a compute layer (AO, mainnet since February 2025), a naming layer (ArNS), an identity layer (Wander wallet, ex-ArConnect), and hundreds of apps — and it still has **no OS**. Nothing composes these layers into a shell a user lives in. The "launcher" is a handful of stale directory sites (the best one last updated April 2025); the de facto session/identity layer is a browser-extension wallet with ~100k installs and a *lifetime* total of ~500k transactions — roughly five transactions per install, ever; ArNS, the naming layer, has on the order of 3,500 registered names after two-plus years. The one permaweb app with mass users (Odysee, ~7M MAU) was bought and grafted on, not grown. The retention loop that actually exists is yield farming ("fair launch" delegation), not daily utility. Meanwhile the genuinely impressive parts — permanent versioned app deployment with ArNS as a mutable pointer over immutable builds, permaweb-libs' composable profiles/assets, Wander Connect's 5-click email/passkey onboarding — are exactly the primitives an OS would be built from, sitting unassembled. The lesson for EFS is blunt: the primitives don't self-assemble into an OS, an organic third-party app ecosystem will not save you, and if the flagship first-party app (our Files) isn't a daily-utility retention loop by itself, token incentives will become the retention loop by default — and that loop attracts farmers, not users.

## Findings

### 1. AO: the compute layer exists, the applications mostly don't (yet)

AO ("the hyper-parallel computer") launched mainnet on 2025-02-08 after a year of "legacynet" testing, with the AO token becoming transferable at launch ([The Block](https://www.theblock.co/post/339450/arweaves-computing-platform-ao-goes-live-on-mainnet), 2025-02-08; [BusinessWire](https://www.businesswire.com/news/home/20250208125254/en/AO-Mainnet-Launches-Ushering-in-a-New-Era-of-Decentralized-Computing-and-Permissionless-Ecosystem-Growth), 2025-02-08). Its relationship to storage is the interesting part for EFS: AO processes are actor-model programs whose full message history is stored on Arweave — storage is the shared state substrate, compute reads/writes it. The 2025 "HyperBEAM" re-implementation cut balance-query latency from ~12s to ~100ms ([arweavehub year in review 2025](https://arweavehub.com/weekly/arweave-year-in-review-2025)), which tells you what the baseline UX was for AO apps in year one: seconds-long reads.

Adoption is the sore point. ChainCatcher's February 2025 analysis ([link](https://www.chaincatcher.com/en/article/2167095)) is the bluntest primary-adjacent source found: total Arweave addresses reported stuck at 211,366 since June 2024; daily active addresses ~3,366 (up from ~1,000 pre-2023 — growth, but three-digit-thousands); AO TVL down from ~$700M during testnet farming to ~$315M at mainnet; top-100 AO addresses holding ~70% of supply; "no dedicated browser, no official ecosystem map" at launch. Nansen's teardown was literally titled "AO Computer — Keep Calm and Farm" ([research.nansen.ai](https://research.nansen.ai/articles/ao-computer-keep-calm-and-farm); page has since been retired into their blog — accessed 2026-07-29, redirect only), which captures the dominant usage pattern: assets were bridged to farm the token distribution, not to use apps. I could not find credible 2026 DAU figures for AO itself; the absence of a widely-cited public dashboard is itself a finding. The [2025 year-in-review](https://arweavehub.com/weekly/arweave-year-in-review-2025) (ecosystem-friendly source) counts 24B cumulative Arweave transactions, ~700 AR.IO gateways, and "hundreds of millions in cross-chain assets bridged" — note that it measures ecosystem health in infrastructure and bridged capital, not in users of applications.

### 2. Is there an OS shell or launcher? No — and the directories are rotting

There is no OS-like shell for the permaweb. What exists:

- **Directory sites**: [ArweaveLists](https://list.weavescan.com/) indexes 157 projects across 16 categories — last updated **April 2025** (v1.5.6) (accessed 2026-07-29). [arweaveapps.com](https://arweaveapps.com/) (a permaweb-hosted index) and [apps.arweave.net](https://apps.arweave.net/) exist; arweaveapps.com failed to load twice during this research (accessed 2026-07-29, "socket closed" — possibly gateway flakiness, itself telling). These are link lists, not launchers: no identity, no state, no install/update concept, no cross-app anything.
- **aos** ([github.com/permaweb/aos](https://github.com/permaweb/aos)) is marketed as "an operating system for AO" — but it is a *developer CLI*: a Lua REPL for spawning and messaging AO processes. The one thing on the permaweb actually named an OS is a terminal for developers, not a user surface. (Accessed 2026-07-29.)
- **"Permaweb Index" (PI)** sounds like an app index but is a *token* — Autonomous Finance's fair-launch yield index ([autonomous.finance](https://www.autonomous.finance/research/en-US/permaweb-index), launched 2025-03-14). The naming collision is symptomatic: the ecosystem's "index" primitives got built for capital allocation, not app discovery.

So after 7 years of permaweb and 1.5 years of AO mainnet, discovery = word of mouth plus stale link lists. The wallet's "connected apps" list (below) is arguably the closest thing to a real launcher, because it's the only surface every permaweb user passes through.

### 3. Wander (ex-ArConnect): the wallet *is* the identity/OS layer, and the numbers are brutal

ArConnect rebranded to Wander and expanded from a Chrome extension to iOS/Android plus an embedded-wallet SDK ([wander.app](https://www.wander.app/), accessed 2026-07-29). What it gates: effectively everything — every permaweb app's sign-in, every AO token action, every ArDrive upload signature. It is the session layer of the permaweb.

- **Scale (self-reported, accessed 2026-07-29)**: "100k+ installations, 100+ connected apps, **500k transactions**" — lifetime. Five transactions per install, ever. For comparison purposes inside this teardown: that is not an OS-scale identity layer, it's a niche tool. They publish it as a *brag*.
- **UX quality**: genuinely above web3 average. [Wander Connect](https://docs.wander.app/wander-connect/intro) (accessed 2026-07-29) is an embedded wallet with email/password, passkey, and social (Apple/X/Facebook) sign-in; "5 clicks" to a functional wallet; **seed-phrase backup deferred as an optional later step**; Shamir-split key custody so neither Wander nor the app holds the key; white-label theming via an npm SDK ([@wanderapp/connect](https://www.npmjs.com/package/@wanderapp/connect)). This is the current best practice for promptless-ish onboarding in the Arweave world and is directly comparable to what EFS personas/native-carrier work is trying to achieve.
- **User sentiment**: Chrome-store aggregate all-time ~4.6 but **recent average ~3.67** ([chrome-stats.com](https://chrome-stats.com/d/io.arconnect.app), accessed 2026-07-29 — review detail page 403'd; figures from search snapshot). Recurring complaint found: discomfort typing a seed phrase into a browser extension. The rating decay through the rebrand/feature-expansion period suggests the pivot from "simple Arweave signer" to "AO super-app wallet with yield agents and recurring swaps" cost them trust with the base.
- Security posture is publicized: annual third-party audits (Open Security, 2023 and 2024 published) ([wander.app](https://www.wander.app/), accessed 2026-07-29).

### 4. ArNS: the naming layer users actually see — technically sound, adoption tiny

ArNS names (`ardrive.arweave.net`, or `ardrive.ar.io` on any gateway) are AO-based name tokens (ANTs) resolving to Arweave transaction IDs, resolvable by every AR.IO gateway under its own domain ([docs.ar.io/learn/arns](https://docs.ar.io/learn/arns), accessed 2026-07-29). Pricing is dynamic (name length + a network "Demand Factor"), denominated in ARIO, with 1–5 year leases or a "permabuy"; re-released names carry a decaying "Returned Name Premium"; docs explicitly say to check the live app for real prices ([pricing model](https://docs.ar.io/learn/arns/pricing-model), accessed 2026-07-29). Undernames (`dapp_name` style subnames) are purchasable per-name.

Adoption: the AR.IO network portal reported **~3,474 registered ArNS names** ([gateways.ar.io](https://gateways.ar.io/) snapshot via search, accessed 2026-07-29). After 2+ years of ArNS and a full token launch (ARIO), that is three orders of magnitude below ENS. The product insight: a naming system priced and marketed to *publishers* (apps, sites) rather than *people* stays a developer tool. Nobody's grandmother has an ArNS name; plenty of deploy scripts do.

One genuinely good UX property: because every gateway resolves every name under its own domain, names are gateway-portable (`ardrive.arweave.net` ≈ `ardrive.ar.io` ≈ `ardrive.permagate.io`). Names survive any single gateway's death. That's a real decentralization win surfaced *in the URL bar*, something ENS+IPFS never quite shipped as cleanly.

### 5. The notable apps — and whether they compose

- **Odysee** (video, ~7M MAU at acquisition): rescued from LBRY's collapse by Forward Research in June 2024 explicitly to "re-build it pixel-for-pixel on Arweave and AO" ([BusinessWire](https://www.businesswire.com/news/home/20240606839450/en/Arweave-Adds-Over-7M-Users-As-Forward-Research-Acquires-Odysee-and-Solarplex), 2024-06-06; [The Block](https://www.theblock.co/post/298888/decentralized-youtube-alternative-odysee-acquired-by-forward-research-despite-content-concerns), 2024). Two years later the migration is still in progress; 2026 commentary still frames it as facing "technical migration hurdles, economic sustainability questions, and user adoption challenges" ([indodax academy overview](https://indodax.com/academy/en/odysee-blockchain-based-video-platform/), 2026). Its team shipped **Portal**, a decentralized publishing system, in May 2025 ([BusinessWire](https://www.businesswire.com/news/home/20250527428788/en/Odysee-Unveils-Portal-with-Independent-Media-Alliance-as-Flagship-Partner-for-New-Decentralized-Publishing-Platform)). Key fact: the permaweb's entire mass-user base was *acquired*, not grown, and integrating it is a multi-year project.
- **BazAR** ([bazar.arweave.net](https://bazar.arweave.net/)) — atomic-asset marketplace on UCM/UDL; added ebooks in 2025. The most composability-relevant app (see §7).
- **Botega** ([botega.arweave.net](https://botega.arweave.net/)) — AO DEX by Autonomous Finance with agent-driven features (DCA, stop-loss); 50% of its token minted via AO yield delegation ([docs.autonomous.finance](https://docs.autonomous.finance/products/platforms/botega/botega-tokenomics), accessed 2026-07-29). This is the retention loop made flesh: the app's growth mechanic is yield delegation, not usage.
- **Protocol.Land** (decentralized git) — alive but barely: main repo last pushed 2025-11-27, **9 GitHub stars** (gh API, accessed 2026-07-29), X activity thinning after March 2025. The "unbannable GitHub" pitch ([PermaDAO](https://medium.com/@perma_dao/with-protocol-land-developers-no-longer-need-to-worry-about-github-being-banned-54bf57b682d0), 2023) found no audience — even permaweb projects host on GitHub, including Protocol.Land itself. (Ironic; also a warning about "decentralized X" pitches with no daily-use advantage.)
- **Weavemail/permamail** — dead. Repo untouched ~6 years, app link broken, archived by ArweaveLists ([list.weavescan.com/project/weavemail](https://list.weavescan.com/project/weavemail), accessed 2026-07-29). Permanent mail on permanent storage was one of the original 2019 demos; nobody wanted it.
- **Llama Land** (AI-agent MMO) — the 2024 AI-on-AO showcase; still doing token events into early 2025 ([@LlamaLandAO](https://x.com/LlamaLandAO/status/1884820951818534942), 2025-01-29); no evidence found of sustained 2026 traction.
- 2025 additions per the [year in review](https://arweavehub.com/weekly/arweave-year-in-review-2025): LiquidOps (lending), Stargrid Battle Tactics (onchain game), Apus Network (AI), Wuzzy Search. Note the composition: DeFi, a game, AI infra — not productivity, not files, not anything OS-shaped.

Do they compose into an OS-like experience? **No.** The composition that exists is: shared wallet (Wander), shared naming (ArNS), shared asset/profile schemas (permaweb-libs, §7). There is no shared shell, no shared file layer (ArDrive drives are not the storage backend of BazAR or Odysee), no inter-app navigation beyond hyperlinks, no notion of "my stuff" that travels between apps except tokens and (partially) BazAR profiles.

### 6. App distribution and updates: the one genuinely OS-grade mechanism

This is the permaweb's best product idea and EFS should copy it aggressively. The stack ([permaweb-deploy](https://github.com/permaweb/permaweb-deploy); [docs.ar.io/build/guides/permaweb-deploy](https://docs.ar.io/build/guides/permaweb-deploy); [ArLink](https://ar.io/case-studies/arlink/), all accessed 2026-07-29):

- Every build is uploaded as an immutable Arweave manifest (a tx ID). **Every version of every app that ever shipped remains permanently addressable.**
- An ArNS name is a *mutable pointer* to the current build's tx ID. "Updating the app" = repointing the name (an AO message updating the ANT record). Users get the update on next load via gateway resolution (subject to record TTL).
- **Undernames give you channels/environments for free**: `staging_myapp`, `v2_myapp` — permaweb-deploy has a literal `--undername` flag for this.
- ArLink wraps it in push-to-deploy CI/CD with a Vercel-like UX.

What this means as product policy: version pinning is trivially available (link the tx ID, get that exact build forever — perfect auditability, perfect rollback), but **no consumer surface exposes it**. There's no "you're on version X, changelog, pin/unpin" UI anywhere; users just get whatever the name points at, which also means a compromised deploy key silently updates the app for everyone — the same trust problem as web2, with the twist that the malicious version *also* becomes permanent. The primitive is superb; the product around it was never built.

### 7. Composability: what actually emerged after 5+ years

- **Emerged**: [permaweb-libs](https://github.com/permaweb/permaweb-libs) — Zones (composable user profiles as AO processes), Atomic Assets, Collections, with the explicit design goal that new apps integrate existing Profiles/Assets rather than reinventing them ([permaweb-journal](https://permaweb-journal.arweave.net/article/permaweb-libs-explained.html), accessed 2026-07-29). UCM + Universal Data License gave assets portable, machine-readable usage rights. BazAR profiles are the reference implementation. This is real, but it emerged *only after* a first-party team (Forward/permaweb org) shipped an SDK and a flagship app enforcing the schemas — not organically from third parties.
- **Emerged**: the fair-launch/yield-delegation pattern (AO yield → app tokens) as a shared economic primitive (Botega FLP, PI token). Composability of *capital*, not of *user experience*.
- **Never materialized**: the app directory as a living surface; user-facing version control; cross-app file/media reuse (the ArFS layer and the atomic-asset layer never merged — your ArDrive files don't appear in BazAR); permaweb-native email/messaging; any daily-driver productivity app; an actual OS shell. The 2019-era pitch — "apps compose on shared permanent data" — produced, in practice, apps that share a wallet, a token, and a naming system, and nothing else.

### 8. Retention reality

Direct retention data is unpublished everywhere, so triangulating: Wander's ~5 lifetime transactions per install (accessed 2026-07-29); Arweave daily active addresses ~3.3k in Feb 2025 ([ChainCatcher](https://www.chaincatcher.com/en/article/2167095)); AO TVL halving when testnet farming ended; the ecosystem's own flagship analytics framing ("Keep Calm and Farm"). The honest conclusion: **people do not return to permaweb apps daily**. The loops that exist are (a) yield/points/fair-launch farming, (b) trading on Botega/Permaswap, (c) Odysee's imported web2 video habit — which predates and is independent of the permaweb. Permanence, it turns out, is a *publishing* motive (write once, cite forever) and publishing motives generate archive traffic, not daily sessions. Nothing on the permaweb has the "my files/my feed/my inbox changed since yesterday" property that drives daily return — which is precisely the property a file browser can have.

## Strengths (what the Arweave stack does genuinely well here)

1. **Deploy/update model.** Immutable versioned builds + mutable name pointer + undername channels + one-command CI/CD is a better app-distribution primitive than anything in Ethereum land today. It's real, shipped, and pleasant ([permaweb-deploy](https://github.com/permaweb/permaweb-deploy), [ArLink](https://ar.io/case-studies/arlink/)).
2. **Gateway-portable naming.** Any ArNS name resolves on any of ~700 gateways under that gateway's domain — decentralization a user can verify by editing the URL. Clean, legible, no browser extension needed for *reading*.
3. **Wander Connect onboarding.** Email/passkey/social login, five clicks to a working wallet, seed backup deferred, keys Shamir-split so the app never sees them ([docs.wander.app](https://docs.wander.app/wander-connect/intro)). Far above typical web3; this is the onboarding bar EFS personas must beat.
4. **First-party schema-driven composability.** permaweb-libs Zones/Atomic Assets prove that shared profile/asset schemas plus a flagship app (BazAR) get real cross-app reuse — where a mere "standard" would have died.
5. **Institutional persistence.** Weavemail died, yet its messages and app builds are still fetchable years later. The floor under a permaweb app's death is remarkably high: the artifact survives its team. That's a real, demonstrated policy virtue EFS shares via Arweave mirrors.

## Weaknesses / user pain

1. **No OS ever emerged, and nobody is building one.** Seven years, all the primitives, zero shell. The "permaweb as OS" story exists only in journal articles ([permaweb-journal](https://permaweb-journal.arweave.net/reference/permaweb.html)). The only thing named an OS (aos) is a Lua REPL for developers.
2. **Discovery is dead.** Directories stale (Apr 2025) or unreachable; no ranking, no reviews, no install concept; the wallet's connect list is the de facto app registry.
3. **Retention is farming.** The measurable engagement loops are token distribution mechanics. When the farm dries up (AO TVL: $700M → $315M), engagement leaves with it.
4. **The identity layer is a bottleneck with eroding trust.** One extension gates the ecosystem; its recent ratings slid to ~3.7 as it super-app-ified; seed-in-browser fears persist.
5. **Update trust is unsolved and un-surfaced.** Names silently repoint; no version UI, no pinning UX, no signed-release story users can see. Permanence even cuts against you: malicious builds are permanent too.
6. **Ecosystem measured in capital, not users.** Every celebratory metric found (bridged assets, gateways, cumulative txs, endowment) is supply-side. Address counts reportedly flat since mid-2024 ([ChainCatcher](https://www.chaincatcher.com/en/article/2167095)); the one mass-user property was bought.
7. **Flagship "decentralized X" apps found no audience.** Protocol.Land (9 stars), Weavemail (dead), Llama Land (fading) — apps whose only differentiator was decentralization lost to their centralized incumbents even *within this ecosystem's own community*.

## Implications for the EFS file browser

1. **Ship the OS as first-party product, not as primitives.** The permaweb proves conclusively that storage + compute + naming + wallet ≠ OS. Someone must build the shell, the session model, and the flagship app, and it will be us. Do not budget for organic third-party apps carrying the ecosystem in years 1–3; budget for Files being good enough alone.
2. **Make Files the daily-return loop, without tokens.** The permaweb's retention vacuum was filled by farming because no app had a "changed since yesterday" surface. A file browser naturally has one: shared folders, incoming files, attestation activity, sync state. Build the activity/recency surface into Files v1 — it is the retention mechanism, not a nice-to-have.
3. **Steal the deploy/update model and finish it.** ArNS's immutable-versions + mutable-pointer scheme is the right architecture for distributing apps *and* for EFS file/folder versions — but build the consumer surface Arweave never did: visible version history, one-click pin-to-version, "this app updated since your last visit" notices, and a signed-release policy. That's differentiation, not parity.
4. **Identity: the wallet must not be the OS shell.** Wander shows what happens when a browser extension becomes the session layer: single bottleneck, trust erosion, ~5 lifetime transactions per user. EFS's persona/native-carrier direction (OS-owned sessions, promptless reads, embedded onboarding at Wander Connect quality — email/passkey, deferred backup) is validated; treat Wander Connect's 5-click flow as the minimum bar to beat.
5. **Naming must be for people and files, not just publishers.** ArNS priced/marketed itself to app deployers and got ~3.5k names. If EFS naming is attached to things users already make (folders, shares, personas) with near-zero marginal cost, it becomes the visible OS layer ArNS never became. Also copy the gateway-portability property: names that resolve identically across independent front-ends are a demonstrable trust win.
6. **Composability = SDK + schemas + a flagship app that enforces them.** permaweb-libs worked only because BazAR shipped on it. The EFS SDK plus Files playing the BazAR role — the reference consumer of the file/profile schemas — is the proven pattern; publishing schemas alone is the disproven one.

## Sources

- https://www.theblock.co/post/339450/arweaves-computing-platform-ao-goes-live-on-mainnet (2025-02-08)
- https://www.businesswire.com/news/home/20250208125254/en/AO-Mainnet-Launches-Ushering-in-a-New-Era-of-Decentralized-Computing-and-Permissionless-Ecosystem-Growth (2025-02-08)
- https://www.chaincatcher.com/en/article/2167095 — "AO airdrop weakness and ecological stagnation" (2025-02, fetched 2026-07-29)
- https://research.nansen.ai/articles/ao-computer-keep-calm-and-farm (retired/redirects as of 2026-07-29; title and framing per index)
- https://arweavehub.com/weekly/arweave-year-in-review-2025 (fetched 2026-07-29)
- https://www.wander.app/ (accessed 2026-07-29)
- https://docs.wander.app/wander-connect/intro (accessed 2026-07-29)
- https://www.npmjs.com/package/@wanderapp/connect (accessed 2026-07-29)
- https://chrome-stats.com/d/io.arconnect.app (ratings snapshot via search, 2026-07-29; reviews page 403)
- https://docs.ar.io/learn/arns and https://docs.ar.io/learn/arns/pricing-model (accessed 2026-07-29)
- https://gateways.ar.io/ (ArNS name count snapshot via search, accessed 2026-07-29)
- https://github.com/permaweb/permaweb-deploy (accessed 2026-07-29)
- https://ar.io/case-studies/arlink/ (accessed 2026-07-29)
- https://github.com/permaweb/aos (accessed 2026-07-29)
- https://github.com/permaweb/permaweb-libs and https://permaweb-journal.arweave.net/article/permaweb-libs-explained.html (accessed 2026-07-29)
- https://www.businesswire.com/news/home/20240606839450/en/Arweave-Adds-Over-7M-Users-As-Forward-Research-Acquires-Odysee-and-Solarplex (2024-06-06)
- https://www.theblock.co/post/298888/decentralized-youtube-alternative-odysee-acquired-by-forward-research-despite-content-concerns (2024)
- https://www.businesswire.com/news/home/20250527428788/en/Odysee-Unveils-Portal-with-Independent-Media-Alliance-as-Flagship-Partner-for-New-Decentralized-Publishing-Platform (2025-05-27)
- https://indodax.com/academy/en/odysee-blockchain-based-video-platform/ (2026, exact date unverified)
- https://docs.autonomous.finance/products/platforms/botega/botega-tokenomics (accessed 2026-07-29)
- https://www.autonomous.finance/research/en-US/permaweb-index (2025-03-14)
- https://list.weavescan.com/ (accessed 2026-07-29; index last updated 2025-04-20) and https://list.weavescan.com/project/weavemail
- https://github.com/ArweaveTeam/weavemail (dormant ~6 years, accessed 2026-07-29)
- GitHub API: labscommunity/protocol-land (pushed_at 2025-11-27, 9 stars, accessed 2026-07-29)
- https://x.com/LlamaLandAO/status/1884820951818534942 (2025-01-29)
- https://cryptorank.io/news/feed/616f7-arweave-block-production-halted-outage and https://www.cryptopolitan.com/arweave-dismisses-rumors-network-stopped/ (2026-02 explorer-outage scare; team attributed it to a Viewblock caching bug — noted, disputed)

**Verification notes / conflicts**: Wander's 100k installs / 500k transactions are self-reported marketing figures (accessed 2026-07-29); the derived "~5 tx/install" is my arithmetic on their numbers. The 211,366-flat-addresses claim is ChainCatcher's and I could not independently verify it. The ArNS ~3,474 count is a search-time snapshot of gateways.ar.io, not a fetched page. 2026 AO usage data is essentially unpublished; treat "no credible public DAU" as the finding. The Feb 2026 "24-hour outage" is disputed — the team says it was an explorer caching bug; both versions are cited above.
