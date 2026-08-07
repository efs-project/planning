# Competitors & Precedents: Web-Game Portals, Archives, and Curation Models

**Purpose:** Map the arrival→discovery→loading→play journey, account pressure, ads, comments, curation workflow, creator economics, and durability of every relevant precedent class, so EFS Arcade can copy what works, avoid what fails, and name the gap only EFS can fill.

**Evidence-grade legend:**
- **A** = primary source, directly observed (fetched the page 2026-08-07; quoted from markup/text)
- **B** = reputable secondary source (Wikipedia, press, search summaries of primary docs)
- **C** = uncertain / inferred / could not verify

All web access dates: **2026-08-07**. Research was read-only; no accounts created, nothing posted.

---

## 1. Platform profiles

### 1.1 Poki (instant-play portal) — grade A (homepage + game page fetched)

- **Journey:** Homepage → category/grid of ~"1500 free games" → game page. Game page shows "Preparing…" — the game auto-loads on page open (no intentional Play gate). "Play free online games instantly in your browser. No installs, no downloads."
- **Account pressure:** None to play. Soft nudge: "Your progress is saved automatically when you play at Poki with an account."
- **Ads:** Heavy and structural. Game page has multiple "Advertisement" slots; rewarded ads are woven into game design: "After 3 failed attempts, you can watch an ad to skip the level" (Drive Mad FAQ, observed).
- **Comments:** None. Like/dislike buttons and an aggregate star rating only (Drive Mad: 4.3 from 3,738,378 votes — huge scale signal).
- **Curation/submission:** Closed pipeline via developers.poki.com; editorial team picks; no public workflow.
- **Creator economics:** Ad rev-share via the Poki for Developers program (B — program exists; terms not on public page).
- **Mobile:** "All of the games are available to play on mobile, tablet and desktop" (A, claimed on page).
- **Durable/fragile:** Durable as a business (ad-funded, huge traffic); fragile as a commons — links live only as long as Poki's business does; games are Poki-exclusive builds (Sort the Court's mobile version is "exclusive to Poki").

### 1.2 CrazyGames (instant-play portal) — grade A (homepage fetched)

- Same shape as Poki: 14+ genre sidebar, grid, "load up your favorite games instantly in your web browser." No account to play. Claims play "without interruptions from downloads, intrusive ads, or pop-ups" — marketing claim; ad-funded in practice (C on actual ad load).
- Developer platform at developer.crazygames.com; closed editorial curation. No comments observed on homepage. Native apps on Android/iOS.
- **Takeaway:** the instant-play portal formula is standardized: zero-friction load, ad monetization, closed catalog, no community voice, no provenance.

### 1.3 Coolmath Games (instant-play portal, longevity case) — grade A

- "Since 1997" — 27+ years of operation; ~2,500 curated titles; Top 10 / New This Week editorial merchandising.
- Ads confirmed ("About Our Ads", "Adblock FAQ" links) plus optional subscription tier (ad-free). Login optional.
- **No comments/community sections at all** — pure curation play.
- Longevity signals: active blog (posts dated Aug 2026), Ruffle sponsorship (per Wikipedia's Newgrounds article, Coolmath co-sponsors Ruffle — B).
- **Takeaway:** a curated, trusted, brand-safe catalog can survive decades on ads+subscription without any community features. Trust + curation is the product.

### 1.4 itch.io (creator publishing) — grade A (creator FAQ + HTML5 catalog + game page fetched)

- **Scale:** "710,578 results" for HTML5 games alone (observed on /games/html5). Discovery is the crisis, not supply.
- **Journey:** catalog → game page → explicit "Run game" click for browser games (intentional play gate — matches EFS's planned UX). Free/paid/PWYW filters; accessibility filters (color-blind friendly, configurable controls).
- **Account pressure:** none to play or download; login needed to comment/rate.
- **Economics:** "open revenue sharing" — "You get to decide … what percentage of your sales should go towards our operational costs," 0% allowed. **No DRM: "itch.io lets users download the games exactly as you uploaded them. No modifications are made to the files you upload."** (Closest existing promise to verified bytes — but unverifiable by the user; you trust itch's servers.)
- **Moderation:** open publishing with soft limits on new accounts (20 project pages, liftable by request); policy enforcement is centralized and severe ("Violations that result in administrative action are permanent with no chance of appeal").
- **Comments:** per-game community boards (Sort the Court: 312+ posts on one thread; 10,891 ratings). Creator-controlled comment settings (B).
- **Fragility observed:** Sort the Court's own page warns downloads may not run on newer systems and its mobile/browser-updated version is "exclusive to Poki" — even on itch, the canonical playable copy drifts off-platform and rots.
- **Takeaway:** itch solved open publishing and creator-friendly economics; it did NOT solve discovery (700k undifferentiated entries), verification, or durability of any given build.

### 1.5 Newgrounds (historical + current) — grade B (site blocked 403; Wikipedia + press)

- Still alive and culturally relevant: Flash Forward jam ran again in 2025 (5th annual, $100–$1,000 prizes); May 2025 shipped controller mapping for Flash games; Ruffle emulator is "sponsored by Newgrounds along with … Cool Math Games and Armor Games."
- **The Portal judgment system is the canonical community-curation precedent:** every submission enters judgment; users vote 0–5; content gets "saved" or "blammed" (deleted, reviews preserved). Crowdsourced gatekeeping at intake, not editorial. Art/Audio use "scouting" (trusted-user curation) — a second, reputational curation model on the same site.
- March 2024: community reporting extended to flag AI-generated content — community as ongoing policy enforcer, not just intake filter.
- Scale: 180k+ games/movies by 2010; FNF's 2021 update overloaded servers.
- **Durable/fragile:** survived Flash's death by funding an open-source emulator (preservation as survival strategy — the moral story James wants, proven commercially relevant). Fragile: single company, ad+supporter funded, one server farm.

### 1.6 js13kGames (jam catalog) — grade A for GitHub org, B for rules

- 13×1024-byte zip limit; no external requests allowed ("Google Fonts are not permitted") — **entries are self-contained by rule**, which is why they're trivially rehostable and a perfect EFS supply source.
- **Hosting model (A):** GitHub org shows "10 of 2503 repositories" — one repo per entry, forked into the org; MIT license visible on sampled entries. Entrants also grant the organizer a perpetual, irrevocable, royalty-free license to reproduce/distribute submissions (B, from rules) — so the catalog itself is redistribution-safe.
- Played in-browser on js13kgames.com; community + judge voting (2025: voting 14 Sep–4 Oct).
- **Fragile:** the playable site is one maintainer's infrastructure; the GitHub org is the real archive. Nobody serves "verified" builds.

### 1.7 osgameclones.com (open-source directory) — grade A

- Catalogs "open-source or source-available remakes of great old games"; entry schema: original title, remake/clone status ("Playable/Semi-Playable/Unplayable"), repo links + star counts, language, **explicit license per entry**, activity level.
- **Curation model — the most relevant precedent for EFS:** the site is generated from data files in a GitHub repo; contribute via "create an issue or even a pull request," plus an "Add Game" form that pre-fills a PR. Curation = code review. Transparent, versioned, forkable, multi-maintainer.
- Games are **linked, not playable** — it's a directory, not an arcade. No comments, no accounts, no ads.
- **Durable:** the data outlives the site (anyone can rebuild from the repo). **Fragile:** links rot; no hosting of the games themselves; playability status is manually asserted, not verified.

### 1.8 LibreGameWiki (free-game directory) — grade A

- "The free gaming encyclopedia" — 1,395 articles, 75k edits by Jan 2024, recent-release entries dated July 2026 (alive but small). MediaWiki model, anonymous edits allowed. Inclusion requires libre licensing (criteria page exists; not fetched — C on exact asset rules).
- **Takeaway:** proof there's a persistent (if niche) community that cares specifically about *freely-licensed* games — a supply-side and curator-recruitment pool. Wiki curation is lower-integrity than PR-based curation (no review gate).

### 1.9 Internet Archive software library (in-browser emulation) — grade A (item page), B (scale)

- Item page (Prince of Persia): **click-to-begin splash → DOSBox boots in browser** ("Emulator: dosbox"; "Click to Begin"). No account. 2.16M views, 2,264 favorites, "Reviews (50)" section — comments exist and get used at low volume.
- Rich provenance metadata per item (year, creator, publisher) — but no byte-level verifiability for the user, and emulation UX is slow/clunky (boot screens, keyboard mapping) vs native HTML5.
- **Durable:** nonprofit mission, massive collections. **Fragile:** single institution under active legal pressure (Hachette v. IA fallout — B/C, not re-verified today); items get taken down; URLs stable-ish but contents mutable by admins.

### 1.10 Flashpoint Archive (preservation) — grade A (homepage + FAQ)

- **Scale (A, observed 2026-08-07): "220,590" games and animations** across "more than a hundred" web technologies. Nonprofit "through Open Collective Europe, with 100% of proceeds … infrastructure costs."
- **Distribution:** NOT browser-based — requires the downloadable launcher (Infinity = on-demand download per game; Ultimate = everything pre-downloaded). Windows-first; macOS/Linux second-class; "Android: Not feasible." This is the #1 reach limiter and the gap EFS's browser-native scope avoids.
- **Curation workflow (A):** tutorial → **audition approval process** → unlimited curations after; submissions via the Flashpoint Submission System (Discord-gated), human curator review with approval pings. A working apprenticeship model for volunteer curation at 200k-item scale.
- **Legal posture (A):** informal opt-out: "Alert us … We might try to convince you to let us keep your game … but we aren't unreasonable." Honored Nitrome's full removal. Preservation-with-consent, not license-clean — EFS's permanence makes this exact posture impossible (can't un-publish), which is why EFS must be license-clean at intake.
- **Durable:** open-source tools, distributed community. **Fragile:** central metadata DB + download infra; legally unresolvable long-tail.

### 1.11 DOS Zone — grade A

- Browser-based DOS play via js-dos; ~2,049+ titles; A–Z + 67 genre categories; "We support Mobile and offline games!"
- **Ad-free + donation/subscription:** "Enjoy classic games completely free and without ads on dos.zone! Support us to keep these ad-free, timeless experiences open for everyone." Accepts cards, BTC/ETH, Buy Me A Coffee. Community on Discord/Telegram/forum. Has a DMCA page (same gray-zone posture as Flashpoint, thinner process).
- **Takeaway:** proof that a donation-funded, ad-free, browser-native retro arcade with community channels is operable by a tiny team — the closest existing shape to EFS Arcade's sustainability hypothesis, minus verifiability/permanence.

### 1.12 Decentralized / on-chain precedents — grade B (search-based) + A (fxhash docs indirectly)

- **fxhash / ONCHFS (B→A):** fxhash default storage is IPFS, but it built **ONCHFS — "a permissionless Unix-like content-addressable file system fully stored on-chain designed to be delivered through HTTP"** — explicitly because artists wanted full permanence ("Art permanence on Ethereum and on Tezos"). Direct conceptual sibling of EFS: content-addressed on-chain files served over HTTP. Validates demand for the primitive among *creators of durable interactive works*; fxhash pivoted to a token ("$FXH art coins," July 2025) — financialization pressure is the recurring failure mode to avoid.
- **Treasure DAO (B, multi-source):** Treasure Chain mainnet launched and was **shut down within ~5 months (May 30, 2025)** — burn rate unsustainable, ~$450k/yr chain costs; assets migrated back to Ethereum/Arbitrum. On-chain "game ecosystems" die of infra cost + token dependence, and when the chain dies the links die. Cautionary, not aspirational.
- **Games on IPFS (B):** Gamedev.js Jam had an IPFS/Filecoin-sponsored "Decentralization" category ($5k prizes, 2021); scattered demos (IPFS-FPS). No durable IPFS arcade with a catalog/community exists — pinning economics and no curation layer. Gap confirmed: decentralized *storage* precedents exist; a decentralized *arcade product* does not.

### 1.13 GitHub awesome-lists (curation baseline) — grade A

- leereilly/games: 24.9k stars, 100+ contributors, PR-based curation, CC BY-NC-SA list license — **and "archived by the owner on Sep 14, 2025. It is now read-only."**
- **Takeaway:** the single-maintainer PR-list model produces real curation value and then dies with its maintainer's attention. Durability requires either institution (Flashpoint) or protocol (EFS's bet). This is the sharpest "no-single-owner" evidence found today.

### 1.14 F-Droid inclusion policy (curation precedent) — grade A

- Hard criteria: "All applications in the repository must be Free, Libre and Open Source Software (FLOSS)"; proprietary tracking/ads "strictly forbidden"; reproducible-ish builds from public source; trusted-source-only prebuilt binaries.
- **Anti-Features labeling:** flag concerns (tracking, non-free assets) **without exclusion** — label, don't ban. Directly adoptable for EFS (e.g., "non-free assets," "modified fork," "network-dependent").
- Workflow: automated checks (license, buildability, anti-feature detection) + human reviewer discretion; metadata requirements incl. fork attribution (name/icon must change) and verified donation links.
- **Takeaway:** the most complete written inclusion policy in this corpus; EFS's curation charter should crib its structure: objective criteria → automated checks → human review → labeled warnings.

---

## 2. Comparison matrix

Legend: ✓ yes/strong, ~ partial/weak, ✗ no. Grades per §1.

| Platform | Instant guest play | Stable/shareable game URLs | Intentional Play click | Account pressure | Ads | Comments | Open submission | Curation model | Creator economics | Mobile | Verifiable bytes | Survives owner loss |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Poki | ✓ (auto-loads) | ✓ while co. lives | ✗ auto-load | ~ (save nudge) | ✓ heavy, in-game | ✗ | ✗ | closed editorial | ad rev-share | ✓ | ✗ | ✗ |
| CrazyGames | ✓ | ✓ while co. lives | ~ | ~ | ✓ | ✗ | ~ dev portal | closed editorial | ad rev-share | ✓ | ✗ | ✗ |
| Coolmath | ✓ | ✓ (27 yrs!) | ~ | ~ optional sub | ✓ + sub tier | ✗ | ✗ | closed editorial | licensing deals | ✓ apps | ✗ | ✗ |
| itch.io | ✓ | ✓ per-creator subdomain | ✓ "Run game" | ~ (login to comment) | ✗ | ✓ boards | ✓ fully open | none (open firehose) | ✓ open rev-share, 0% ok, no DRM | ~ | ~ (no-modification promise, unverifiable) | ✗ |
| Newgrounds | ✓ | ✓ (25+ yrs) | ~ | ~ (vote/review needs acct) | ✓ + supporter | ✓✓ reviews culture | ✓ | **community judgment (blam/save) + scouting** | jam prizes, ad share | ~ | ✗ | ✗ |
| js13kGames | ✓ | ✓ + GitHub repos | ~ | ✗ | ✗ | ✗ | ✓ annual jam | judges + community vote | prizes | ✓ (small builds) | ~ (repo = source of truth) | ~ (org on GitHub) |
| osgameclones | n/a (links out) | ✓ data in repo | n/a | ✗ | ✗ | ✗ | ✓ **PR-based** | **GitHub code review** | n/a | n/a | ✗ | ✓ (forkable data) |
| LibreGameWiki | n/a | ✓ wiki | n/a | ✗ | ✗ | ~ talk pages | ✓ wiki edit | wiki (no gate) | n/a | n/a | ✗ | ~ (dumps exist) |
| Internet Archive | ✓ emulated | ✓ item IDs | ✓ click-to-begin | ✗ | ✗ | ✓ reviews (low vol) | ~ upload w/ rules | institutional | n/a | ✗ poor | ✗ (admin-mutable) | ~ (single nonprofit, legal risk) |
| Flashpoint | ✗ (app req'd) | ✗ (no web URLs) | n/a | ✗ | ✗ | ✗ in-app | ✓ after audition | **audition + curator review** | n/a | ✗ no Android | ✗ | ~ (open tools, central DB) |
| DOS Zone | ✓ js-dos | ✓ | ✓ | ✗ | ✗ (donation) | ~ forum/Discord | ~ | small-team | n/a | ✓ | ✗ | ✗ |
| fxhash/ONCHFS | ✓ view | ✓ content-addressed | n/a | ~ wallet to mint | ✗ | ✗ | ✓ mint | market + token | mint/royalties | ~ | **✓ on-chain** | **✓ protocol** |
| Treasure Chain | dead | ✗ (chain shut down) | — | wallet | ✗ | ✗ | — | token-gated | token | — | ~ | **✗ proven dead 5mo** |
| awesome-lists | n/a | ✓ repo | n/a | ✗ | ✗ | ✗ | ✓ PR | maintainer review | n/a | n/a | ✗ | ✗ **archived 2025** |
| F-Droid | n/a (apps) | ✓ | n/a | ✗ | ✗ | ✗ | ✓ MR/RFP | **policy + automated checks + human review** | donations passthrough | ✓ | ~ (reproducible builds aspiration) | ~ |

---

## 3. For EFS: copy / avoid / integrate / concede

### Copy
1. **itch.io's "Run game" gate** — intentional single Play click is already a respected pattern; EFS's verify-then-play click is a strict upgrade, not friction weirdness.
2. **F-Droid's inclusion policy structure** — objective FLOSS criteria + automated checks + human review + **Anti-Features labels** (label concerns, don't ban). Write EFS's curation charter in this shape.
3. **osgameclones' PR-based catalog** — data-as-repo, curation-as-code-review, add-game form that generates a PR. EFS's on-chain equivalent (attestation-based catalog entries) is this model with better provenance; keep a low-friction "propose a game" form.
4. **Flashpoint's curator apprenticeship** — tutorial → audition → trusted curator. Solves quality without editorial bottleneck; works with volunteers at 200k scale.
5. **DOS Zone's tone and funding** — ad-free, "support us to keep these ad-free, timeless experiences open for everyone," donations + optional sub. Closest proven sustainability match to grants/donations preference.
6. **Newgrounds' preservation-as-identity** — funding/adopting open tooling (Ruffle) became its moral brand and survival strategy. EFS Arcade's game-preservation story has a proven audience.
7. **Poki/CrazyGames surface polish** — grid catalog, category chips, aggregate rating, "related games" — the visual grammar players expect. Don't innovate on catalog UX.

### Avoid
1. **Auto-loading games on page open** (Poki) — conflicts with EFS's intentional-Play promise and wastes bandwidth; also ad-tech-driven.
2. **Ads woven into gameplay** (rewarded ads) — poisons the trust story.
3. **Preservation-without-permission posture** (Flashpoint/DOS Zone gray zone) — EFS permanence means no takedown safety valve; intake must be license-clean, every game with full provenance. This is a hard constraint the archives never had.
4. **Token/financialization pivots** (fxhash art coins, Treasure) — Treasure Chain died in 5 months at ~$450k/yr chain cost; tokens repel the target player and killed the precedent arcades.
5. **Open firehose with no curation gate** (itch's 710k games) — discovery collapse; EFS's small curated catalog is a feature.
6. **App-download distribution** (Flashpoint) — instantly loses mobile and the casual link-follower.
7. **Judgment-by-deletion** (Newgrounds blamming) — deletion is impossible on EFS anyway; curation must be inclusion/labeling, not removal.

### Integrate (partner or ingest, don't compete)
1. **js13kGames back-catalog** — 2,500+ self-contained ≤13KB MIT-licensed games, one repo each, redistribution-licensed to the organizer. Ideal permanent-storage showcase (tiny bytes, license-clean, provenance = git history). Ingest respectfully with attribution; possibly approach organizer post-MVP (no contact now).
2. **osgameclones + LibreGameWiki data** — supply-side discovery source for license-clean browser games and for finding maintainers/curators.
3. **itch.io as creator home** — don't compete for creators; EFS is the *permanent verified mirror* with provenance pointing back to the creator's itch page (respecting licenses).
4. **Ruffle** (self-contained wasm) — post-September path to licensed Flash-era works; Newgrounds/Coolmath co-funding shows it's industry-standard.

### Concede (already solved better — don't fight)
1. **Mass-market casual reach & ad-funded scale** — Poki/CrazyGames own the "bored at school" firehose with 3.7M-vote games and dev pipelines. EFS cannot and shouldn't out-Poki Poki.
2. **Creator monetization** — itch's open rev-share + no-DRM is beloved; EFS shouldn't build payments for September (grants/donations lane only).
3. **Comprehensive preservation of unlicensed works** — Flashpoint's 220,590 items required a legal gray zone EFS can never occupy. EFS's archive will be smaller and clean, not bigger.
4. **Emulation breadth** — Internet Archive/Flashpoint/DOS Zone own it; out of September scope by ruling anyway.

---

## 4. The gap: what ALL of these fail to provide, and who feels it

Tested against every row above:

1. **Rehostability-by-strangers** — ✗ everywhere except osgameclones' data files and js13k's GitHub org (data only, not the playable experience). No platform lets an unrelated third party stand up the *same playable game at verifiably the same bytes* if the platform dies. **Who feels it:** preservationists and open-game maintainers (they watched Flash die, leereilly/games archive, Treasure Chain vanish); players only feel it as grief afterwards ("my game is gone"). Strong story, weak day-one player pull.
2. **Verifiable bytes** — ✗ everywhere in the player-facing web-game world. itch promises no modification but can't prove it; IA items are admin-mutable; portals wrap games in ad SDKs. Only fxhash/ONCHFS delivers it, for generative art, to a crypto-native audience. **Who feels it:** curators/testers (is this build the one I reviewed?), security-conscious players (rare), and *forkers* (provenance of what they forked). Mostly felt by the supply side, not players — frame it as "what you play is exactly what the curator approved," not as cryptography.
3. **Curator plurality** — ✗ everywhere. Every catalog has exactly one curatorial authority (editorial team, maintainer, wiki mob, or judgment mob). None supports *competing named catalogs over the same game corpus* (F-Droid repos come closest in structure but there's effectively one main repo). **Who feels it:** curators and communities with taste (speedrunners, edu, retro niches) who today must fork a whole site or start a list that dies (leereilly). This is EFS's most differentiated, most testable claim for the arcade — comments + attestation-backed catalog entries are its seed.
4. **No-single-owner durability of the playable experience** — ✗ everywhere. Evidence collected today: leereilly/games archived Sep 2025; Treasure Chain dead May 2025 (5 months); Flashpoint's Nitrome removals; Sort the Court's canonical mobile build locked inside Poki; IA under legal pressure. Every durable thing in this corpus is durable because one org keeps paying. **Who feels it:** everyone eventually, no one at signup. Sell it through the preservation story and through stable share links ("this link will outlive us — and here's why that's not a slogan").

**Net position:** EFS Arcade's credible wedge is not "better portal" (conceded) but **"the first arcade where the catalog, the bytes, and the right to re-serve them all survive the operator"** — with F-Droid-style clean intake, osgameclones-style PR/attestation curation, Flashpoint-style curator apprenticeship, itch-style Run-game UX, and DOS Zone-style donation sustainability. The users who feel the gaps *today* are supply-side (preservationists, curators, open-game maintainers) — consistent with owner guidance that players come for fun/convenience and the moral story is preservation.

---

## 5. Source index (all accessed 2026-08-07)

Primary (grade A observations):
1. https://poki.com/ — homepage
2. https://poki.com/en/g/drive-mad — game page journey
3. https://www.crazygames.com/ — homepage
4. https://www.coolmathgames.com/ — homepage
5. https://itch.io/docs/creators/faq — creator FAQ (rev share, no-DRM)
6. https://itch.io/games/html5 — HTML5 catalog (710,578 results)
7. https://graebor.itch.io/sort-the-court — game page (comments, Poki exclusivity, rot warning)
8. https://js13kgames.com/ — SPA shell only (title verified; content required JS — limitations noted)
9. https://github.com/js13kGames — org: 2,503 repos, per-entry repos, MIT pattern
10. https://osgameclones.com/ — catalog + PR contribution model
11. https://libregamewiki.org/Main_Page — 1,395 articles, activity
12. https://archive.org/details/msdos_Prince_of_Persia_1990 — emulation UX, reviews section
13. https://flashpointarchive.org/ — mission, 200k+ scale, Open Collective
14. https://flashpointarchive.org/faq — 220,590 count, Infinity/Ultimate, takedown posture, audition workflow
15. https://dos.zone/ — js-dos, ad-free/donation model, DMCA page
16. https://f-droid.org/en/docs/Inclusion_Policy/ — FLOSS criteria, anti-features
17. https://github.com/leereilly/games — 24.9k stars, archived 2025-09-14

Secondary (grade B):
18. https://en.wikipedia.org/wiki/Newgrounds — judgment/blam system, Ruffle sponsorship, 2024–2025 updates
19. WebSearch: Newgrounds Flash Forward 2025 (80.lv, creativebloq.com, news.ycombinator.com/item?id=44945730)
20. WebSearch: js13kGames rules — https://js13kgames.com/2025/rules, https://en.wikipedia.org/wiki/Js13kGames
21. WebSearch: Flashpoint curation — flashpointarchive.org/datahub/Curation_Tutorial, /datahub/Submitting_a_Curation (datahub pages themselves 403/429'd; content via search summaries)
22. WebSearch: Treasure Chain shutdown — gam3s.gg, crypto.news, ccn.com, playtoearn.com (May 30, 2025; ~$450k/yr; 5 months)
23. WebSearch: fxhash/ONCHFS — docs.fxhash.xyz/onchfs/what-is-onchfs, fxhash.xyz/article/art-permanence-on-ethereum-and-on-tezos, bankless.com $FXH (July 2025)
24. WebSearch: IPFS games — blog.ipfs.tech Gamedev.js JAM 2021 recap, pinata.cloud, apillon blog

Fetch failures (recorded): newgrounds.com (403), flashpointarchive.org/datahub/Extended_FAQ (403/429), archive.org/details/softwarelibrary and softwarelibrary_msdos_games (title-only responses), libregamewiki.org/Libregamewiki:Main_Page (404 → Main_Page worked), fxhash.xyz (429 → covered via docs/search).
