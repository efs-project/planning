# Communities & Outreach — EFS Arcade Research Lane

**Purpose:** Map the community clusters EFS Arcade could recruit from (supply, curation labor, players), assess crypto-aversion risk with evidence, define persona jobs/incentives/anxieties, interview kits, measurable recruitment tests, and a ranked September outreach list.

**Evidence grades:** A = primary source directly observed (fetched page, official post) · B = reputable secondary source · C = uncertain / inferred / self-reported by vendor. Access dates in Source Index; all web access on **2026-08-07** unless noted.

---

## 1. Community cluster findings

### 1a. Game preservation & data hoarding

**Flashpoint Archive** (formerly BlueMaxima's Flashpoint)
- Scale: **220,590 games and animations preserved as of Aug 2026** (A — their FAQ); 100+ contributors (B); supports 100+ web technologies beyond Flash (A).
- How they work: Discord is the mandatory hub — "the majority of our work and communication happens" there. Curation is a formal apprenticeship: follow the curation tutorial, submit a **curator audition**, get approved, then submit freely (A — FAQ + Datahub pages: Curation_Format, Submitting_a_Curation). This is the single best existing model for the Arcade's "real curation workflow" promise — they've solved onboarding, format standards, metadata, and QA for *exactly* web games.
- Legal stance: archive broadly but "do not archive illegal or borderline illegal content"; honor takedowns (Nitrome removed all games at rights-holder request) (A). Funding via OpenCollective, "all proceeds go towards server costs" (A).
- Painful problem EFS honestly addresses: Flashpoint is a **downloadable desktop archive**, not a linkable, playable web catalog; and it is centrally hosted (single org, server-cost-funded). Permanent, stable, per-game URLs with on-chain provenance is complementary, not competitive.
- Refusal triggers: anything smelling of monetizing preserved games; "blockchain" as the headline (their world was burned by NFT-game grifting era); implying Flashpoint is inadequate. They care about *coverage and correctness*, not infrastructure ideology.
- Cheapest honest experiment: join Discord, complete one **curator audition yourself** (learn their norms first-hand — this is research, not outreach), then ask in an appropriate channel: "I'm building a small permanent web mirror for freely-licensed browser games with provenance records — what would make a mirror trustworthy to you?" Zero spam, real question.

**r/DataHoarder** — ~680k members (B). Ethos: redundancy, "keep multiple copies," suspicious of any single point of failure — including *your* startup. They would test the claim "permanent" adversarially. Refusal trigger: crypto marketing, or permanence claims that turn out to be a testnet (Sepolia! Be very careful — Sepolia is a testnet with no permanence guarantee against reset; hoarders will find this in minutes and it will define the thread). Cheapest experiment: a technical "how would you attack this?" post is high-risk pre-hardening; better to lurk + use their wiki norms as a QA checklist. **Do not pitch here in September** unless the permanence story survives the Sepolia objection.

**Internet Archive / Ruffle** — IA emulates Flash in-browser via Ruffle since Nov 2020; 1,000+ items initially, community can upload with `emulator=ruffle-swf` metadata (B — IA blog + forums). Emulation itself is out of Sept scope, but IA demonstrates the *pattern*: volunteers upload when the upload path is documented and the mission is legible. MAME/emulation preservationists: curation-labor norms = meticulous metadata, provenance, dump verification — the cultural ancestor of what Arcade curation should feel like. (B)

### 1b. Web-game & jam ecosystems

**js13kGames** — organizer **Andrzej Mazur** (end3r), 14th edition ran 2025 with **197 entries** (A — js13kgames.com blog); 2026 edition upcoming (A — site fetched, sparse). Rules require a **GitHub repo with readable, unmangled full source** for every entry (B — rules page via search). Licenses are author-chosen but source-available culture is universal; the js13kGames/games repo holds production code + metadata of all entries (A — repo exists).
- **Critical finding: js13k is NOT crypto-averse.** It ran a **"Decentralized" category in 2021–2022 sponsored by NEAR Protocol, Protocol Labs (IPFS/Filecoin), Flux, 4Everland**, explicitly framed as "taking Web 3, blockchain, crypto, NFTs... mixing them with game development" (A — Mazur's own Medium posts). Mazur also runs Gamedev.js Jam with the same category. This is the one place where "on-chain file system" is a *feature*, not a confession.
- Painful problem: 14 years of tiny games hosted on one person's infrastructure; entries are ideal Arcade corpus material (small, self-contained, source-public, author-findable).
- Why participate: distribution + permanence for their entries; jam sponsorship is an established, priced behavior here.
- Refusal triggers: scraping entries without asking authors (licenses vary per entry — must check each repo); misrepresenting sponsorship as endorsement.
- Cheapest experiment: **email Mazur directly** (public organizer, public role) proposing a small prize category or "permanent archive" partnership for js13k 2026, with a demo of 3 past entries (with author permission) served from EFS. One email, high information value.

**Ludum Dare** — organizer Mike Kasprzak announced wind-down: six more events, **ending 2028**, free since 2002, donation-funded (B — Aftermath, 2026). Community reaction shows legacy anxiety ("they are not Ludum Dare"). Tens of thousands of jam games on ldjam.com with an uncertain long-term home. This is a **preservation story with a deadline** — the moral story owner James wants, on a real clock. Cheapest experiment: one public forum/DM question to Kasprzak-type role (public figure): "what's the archive plan for ldjam.com entries, and would a permanent mirror help?" — but note LD games are NOT freely licensed by default; only a mirror-with-author-opt-in works.

**GMTK Game Jam** — **9,650 entries in 2025** (A — itch.io jam results page), audience of the largest gamedev YouTube channel. Massive but licenses default to all-rights-reserved; itch.io-native; Mark Brown (public figure) is heavily pitched. Low priority for September; long-term "opt in to permanent archive" checkbox concept only.

**itch.io jams generally** — the center of gravity for web-game supply, and also the source of the strongest crypto-aversion signal (see §2). Any Arcade↔itch.io positioning must be "we archive freely-licensed games with provenance," never "alternative to itch."

### 1c. FOSS / free-game developers

- **LibreGaming** — small libre-games community; chatrooms bridged across **Matrix (#libregaming-games:tchncs.de), XMPP, Libera.Chat IRC, FreeGameDev** (A/B — libregaming.org/join-us). Values: libre licenses, philosophy discussion welcome. Small (dozens, not thousands — C) but *exactly* the people who already relicense games freely. Refusal trigger: proprietary lock-in, crypto-as-speculation; a credibly-neutral public archive is ideologically legible to them if the client is open source.
- **OpenGameArt.org** — active, CC0/CC-BY culture, constant license-question forum traffic (B). Not a game-hosting site but the licensing brain trust; good place to *ask* (not pitch): "what's best practice for provenance records when mirroring freely-licensed games?"
- **r/opensourcegames** — **~17k members** (B — GummySearch); dominant post types are self-promotion and "find me a game" requests (B). Small but perfectly aligned: open-source browser games with real licenses are the only lawful September supply. Tolerant of new platforms if code is open.
- **F-Droid game maintainers** — ~3,000+ apps incl. games (B); Android-native, mostly not browser games; skip for September; relevant later as a "reproducible builds / provenance" norms reference.
- Why they participate: their games get players + permanence; FOSS devs chronically lack distribution. Refusal: closed-source Arcade client, CLA-style overreach, crypto speculation framing. Cheapest experiment: post in r/opensourcegames flaired appropriately ("I built a permanent mirror for freely-licensed browser games — here are 3 of yours [with provenance + attribution]; want yours added or removed?") — supply-side outreach that is itself a takedown-respect demo.

### 1d. AI-assisted game creators (2025–26)

- Where they are: **Rosebud AI** claims 2.3M community-created games (C — vendor self-report); websim.ai and successors; itch.io tags; and general "vibe coding" spaces on X/Discord (B/C). Publishing is platform-captive: games live inside Rosebud/websim URLs, exportability varies.
- Painful problem EFS addresses honestly: **platform-captivity of AI-made games** — creators who vibe-code a hit have no durable, portable home for it. A permanent, stable URL independent of the tool that made it is a real offer.
- Risks: flood of low-quality supply (curation workload!), unclear license/provenance of AI-generated assets, and communities that skew promotional. The Arcade's curation workflow is the filter — AI games are a *supply firehose to be gated*, not a target community to court broadly.
- Cheapest experiment: pick 3 standout AI-made browser games with clear licenses, ask their creators (public posts) if they want a permanent mirrored home with provenance; measure reply rate.

### 1e. Ordinary-player distribution

- **r/WebGames** — **141k members, +11%/yr** (B — GummySearch). Self-description: **"A community to find web games with no downloads, signups, or plugins required!"** (B). This sentence *is* the Arcade's product promise — and also its bar: any wallet prompt, boot screen, or signup on the play path violates the sub's core ethos. Self-promotion happens constantly (26 of recent sample posts) with genre tags ([HTML5], [PZL]...). One good game page that passes the "no signup" sniff test can be posted honestly by James as its curator.
- **r/incremental_games** — home sub for idle/incremental; weekly release + Friday self-promo norms (B — dinogame.gg roundup); described as "highest signal-to-noise for browser-game discovery" (B). Size several hundred thousand (C — subredditstats data broken post-API-changes, A-grade count unavailable). Community has strong historical hostility to crypto/"play-to-earn" idle games (C — widely observed, not verified against written rules this pass; verify sidebar before posting).
- **Hacker News** — best-documented appetite signal found this lane: **"Show HN: The HN Arcade" (Feb 2026, 352 points, 123 comments)** — a directory of HN browser games built because the creator "didn't want to forget any" (A — thread fetched). Commenters asked for: random ordering for discovery, thumbnails, popularity sort, date filters; flagged broken links/LLM-fabricated metadata as trust-killers; and one established commenter (susam) argued for **moving it to a community organization for longevity** (A). Read: HN demonstrably wants a curated, durable browser-game catalog and *already articulated the failure modes* (dead links, bad metadata, single-maintainer risk). HN norms: demanding, anti-promotional, rewards working demos + honest technical writeups (B).
- **TikTok / YouTube Shorts** — short-form is now a top game-discovery channel (36% of respondents; 75% of TikTok gamers discover games there — B), BUT organic reach collapsed in 2025–26, pushing indies toward paid (B). For a solo founder in September: not a lane. One HN post outperforms a month of shorts.

---

## 2. Crypto-aversion evidence base (the real risk, graded)

| Evidence | Grade | Implication |
| --- | --- | --- |
| itch.io official: "NFTs are a scam... reevaluate your life choices" (tweet, Feb 2022, still up) | A | The dominant indie-web-game platform is institutionally hostile; never position against or via itch.io |
| Valve/Steam ban on blockchain/NFT games (Oct 2021, still in force) | B | Mainstream distribution treats blockchain games as category-banned |
| GDC State of the Industry 2024: **77% of devs "wholly uninterested" in blockchain/web3**, +4% "used it and stopped"; 2023: 61% opposed vs 17% in favor | B | Developer-side aversion is majority and *growing*; leading with chain tech loses ~4 of 5 devs at hello |
| js13kGames ran NEAR/IPFS-sponsored "Decentralized" category 2021–22, organizer-authored posts | A | Aversion is not universal: web-tech jam culture treats decentralization as an experiment, not a sin — js13k is the beachhead |
| Flashpoint FAQ: zero mention of blockchain; funding = OpenCollective server costs | A | Preservationists frame everything as mission + costs; match that register |
| r/incremental_games hostility to crypto idle games | C | Verify sidebar rules before any post there |

**Synthesis:** The aversion is to *speculation, NFTs, and wallet-gating* — not to permanence, provenance, or decentralized infrastructure per se (js13k proves the distinction). The honest pitch that survives: **"permanent, credibly-neutral archive for freely-licensed web games — no wallet, no token, nothing for sale; the chain is the filing cabinet, not the product."** Sepolia-is-a-testnet is the soft underbelly of the permanence claim with technical audiences (r/DataHoarder, HN); have a straight answer ready before outreach.

---

## 3. Persona cards (job · incentives · anxieties)

1. **Linked guest visitor** — Job: click a shared link, be playing in seconds. Incentives: fun now, zero commitment. Anxieties: signup walls, wallet popups, sketchy-site vibes, slow loads. (r/WebGames' motto is this persona's contract.)
2. **Returning player** — Job: re-find "that game" and see what's new. Incentives: stable URLs, a small trustworthy catalog, maybe progress persistence. Anxieties: link rot, catalog churn, games silently changing under them (HN Arcade thread: broken links = instant trust loss).
3. **Creator / rights holder** — Job: get players + a durable home without losing control. Incentives: attribution, provenance record, traffic, permanence. Anxieties: being archived without consent, license misreading, association with crypto damaging their itch.io-native reputation, forks outcompeting their canonical version.
4. **Preservationist / collector** — Job: maximize coverage + correctness of the record. Incentives: mission, completeness, tooling that respects metadata. Anxieties: fake permanence (testnet resets, startup death), monetization of preserved works, duplicated effort vs Flashpoint/IA.
5. **Curator / moderator** — Job: decide what's in, keep quality and lawfulness. Incentives: taste recognition, formal role (Flashpoint's audition model shows curators *want* earned status), good tooling. Anxieties: AI-slop flood, license landmines, being the unpaid janitor, unclear authority.
6. **Submitter** — Job: get a game (theirs or found) into the catalog. Incentives: fast clear pipeline, visible status, credit. Anxieties: black-hole submissions, arbitrary rejection, provenance paperwork burden.
7. **Compat + safety tester** — Job: verify games run, are lawful, and are safe. Incentives: recognized QA role, checklists that make them effective. Anxieties: liability for misses, boring repeat work with no ladder (Flashpoint solves via Discord role progression).
8. **Commenter** — Job: react, tip, warn, recommend. Incentives: near-zero-friction identity, being read. Anxieties: identity flow that smells like a wallet signup; moderation vacuum; comments vanishing.
9. **Mirror operator** — Job: run an independent copy for resilience. Incentives: DataHoarder redundancy ethos, being infrastructure. Anxieties: legal exposure for mirrored content, unclear takedown flow, bandwidth costs with no support.
10. **Sponsor / donor** — Job: fund a legible public good. Incentives: preservation mission story (Flashpoint/IA precedent: OpenCollective, itemized server costs), grant-program fit (web3 public-goods funders would sponsor js13k-style prizes). Anxieties: funding a startup dressed as a charity; crypto-reputation contagion (from the *other* direction: crypto funders want the chain mentioned, communities don't — a messaging split to manage, not hide).
11. **Arcade operator (James)** — Job: keep the service up, lawful, and growing on solo bandwidth. Incentives: EFS thesis validation, real users. Anxieties: takedown handling alone, curation bottleneck (esp. away 2 weeks in late Aug), being defined by one bad thread.
12. **Successor operator** — Job: take over if James stops. Incentives: inheriting a working, documented, on-chain-portable system (the HN Arcade thread's susam comment is direct demand for this property). Anxieties: undocumented ops, keys/infrastructure that don't transfer, community that only trusted the founder.

---

## 4. Interview question sets (pick 5–7 per session; never lead with EFS/chain)

**Players (guest/returning):** When did you last follow a link to a browser game — what made you click? What made you stop playing or never start? Have you ever tried to re-find a web game and failed? What would make you comment on a game as a guest? What's the fastest a site has lost your trust?

**Creators / jam devs:** Where do your games live today and what happens to them in 5 years? Have you ever had a game die with a platform? What license do you ship under and why? What would a third party need to do for you to be *glad* they mirrored your game? What would make you demand removal? Does "stored on a blockchain" change your answer — why?

**Preservationists / curators (Flashpoint-style):** Walk me through your last curation — hours, tools, what was tedious? What makes an archive trustworthy to you? What's your test for "permanent"? What earned role/status matters in your community? What did the NFT era do to your tolerance for chain-adjacent projects?

**Mirror/infra people:** What do you mirror today and why that? What legal or cost line would you not cross? What would a takedown flow need to look like for you to sleep?

**Sponsors/donors:** What preservation or public-good projects have you funded? What made them fundable? What reporting do you need?

---

## 5. Measurable recruitment tests (September, solo-bandwidth-sized)

| # | Test | Method | Threshold (pass) |
| --- | --- | --- | --- |
| T1 | Creator opt-in rate | Contact 15 authors of freely-licensed browser games (js13k/open-source) asking permission to mirror with provenance | ≥5 yes (33%); any "remove me" handled <48h = process proof |
| T2 | js13k partnership | 1 email to organizer Mazur re: 2026 category/archive partnership | Any substantive reply = pass; sponsorship terms = strong pass |
| T3 | Curation labor exists | Post 1 honest "help curate 20 games" call in r/opensourcegames + LibreGaming Matrix | ≥3 people complete 1 full curation each within 2 weeks |
| T4 | Player pull, honest framing | 1 r/WebGames post of the single best game page (tagged, rule-compliant, no EFS jargon) | ≥60% median play-session start rate from clicks; comment sentiment not dominated by distrust |
| T5 | HN appetite + crypto-objection shape | 1 Show HN of the catalog with a technical writeup that names Sepolia up front | Front page not required; pass = objections are about features, not "this is a crypto grift" as top comment |
| T6 | Guest comment conversion | Instrument comment CTA on 5 game pages | ≥2% of guest readers attempt to comment; ≥50% of attempters complete identity flow |
| T7 | Preservationist trust probe | 3 structured interviews from Flashpoint/IA orbit (recruited via public asks, not DMs to privates) | ≥2 can restate the permanence model accurately after 10 min = story is legible |

Kill signal: if T1 <2/15 and T3 = 0, supply+labor both fail → the arcade needs a different first community before public MVP.

---

## 6. Ranked September outreach list (honest pitch per community)

1. **js13kGames (organizer + past entrants)** — Pitch: "Permanent archive + prize category for 13KB games; your entries already have public source; we add provenance and a stable home. Chain-backed storage stated plainly — this community ran a NEAR-sponsored category." Highest license-fit, lowest crypto-aversion, one email to start.
2. **r/opensourcegames + LibreGaming (Matrix/IRC)** — Pitch: "Open-source, credibly-neutral mirror for libre browser games; open client; takedown-respecting; here's yours, opt in or out." Small but supplies both games and curators.
3. **Hacker News (Show HN)** — Pitch: "Show HN: a permanent arcade for freely-licensed web games (with provenance, no accounts to play)" + honest technical writeup incl. Sepolia caveat. Proven appetite (HN Arcade: 352 pts) and the best free QA on the permanence claim.
4. **r/WebGames** — Pitch: no pitch — post one great game per their tag norms; the site must *embody* "no downloads, signups, or plugins." Distribution test, not community-building.
5. **Flashpoint Discord** — Pitch: none in September; join, curate one game their way, ask craft questions. Relationship + curation-workflow learning; formal collaboration is a 2027 conversation.
6. **Ludum Dare orbit** — Pitch (timed to wind-down news): "LD ends 2028 — opt-in permanent mirror for your LD entries, full provenance." Emotionally resonant; strictly opt-in per author since LD entries aren't freely licensed by default.
7. **r/incremental_games** — Only if the catalog includes a genuinely good incremental; follow Friday self-promo norms; verify sidebar crypto rules first (unverified this pass — grade C).
8. **AI-creator spaces (Rosebud/websim/X)** — Deferred probe only (3 direct asks per T1 pattern). Supply firehose with license risk; do not open a public channel to it before curation workflow is hardened.

**Do-not-approach (September):** r/DataHoarder (permanence claim not yet hardened vs testnet objection), itch.io-official anything (institutional NFT hostility, grade A), TikTok/Shorts (organic collapse; wrong effort/return for solo founder).

---

## Source index (all accessed 2026-08-07)

1. Flashpoint Archive FAQ — https://flashpointarchive.org/faq (A; 220,590 items, curation audition, Discord hub, OpenCollective, takedown practice)
2. Flashpoint Datahub: Curation Format / Submitting a Curation — https://flashpointarchive.org/datahub/Curation_Format , /datahub/Submitting_a_Curation (A/B via search)
3. Flashpoint Open Collective — https://opencollective.com/flashpointarchive (B)
4. js13kGames 2025 winners (197 entries) — https://js13kgames.com/2025/blog/winners-announced ; https://medium.com/js13kgames/js13kgames-2025-winners-announced-81bd2a9b5eb3 (A)
5. js13kGames 2025 rules (GitHub readable source) — https://js13kgames.com/2025/rules (B via search snippet)
6. js13kGames Decentralized category (NEAR, Protocol Labs, Flux) — https://medium.com/js13kgames/new-decentralized-category-in-js13kgames-2021-6a27a6a28270 ; https://medium.com/js13kgames/decentralized-category-intro-near-and-ipfs-7857e5f9631d (A)
7. itch.io NFT stance tweet, Feb 2022 — https://x.com/itchio/status/1490141815294414856 (A); coverage: https://www.videogameschronicle.com/news/indie-game-store-itch-io-calls-nfts-a-scam-in-fiery-statement/ (B)
8. Valve/Steam blockchain-game ban — https://www.axios.com/2021/10/18/valve-ban-nfts-blockchain-technology-video-games (B)
9. GDC State of the Game Industry 2023/2024 blockchain sentiment — https://www.businesswire.com/news/home/20230113005478/en ; https://massivelyop.com/2024/01/19/gdcs-2024-industry-survey-game-devs-weigh-in-on-ai-layoffs-unionization-rto-and-more/ (B)
10. "Show HN: The HN Arcade" thread (352 pts / 123 comments, ~Feb 2026) — https://news.ycombinator.com/item?id=46793693 (A — fetched)
11. Ludum Dare wind-down by 2028 — https://aftermath.site/after-20-years-influential-game-jam-ludum-dare-will-wind-down/ (B — fetched)
12. GMTK Game Jam 2025 results, 9,650 entries — https://itch.io/jam/gmtk-2025/results (A via search)
13. r/WebGames stats + self-description (141k, +11%/yr, "no downloads, signups, or plugins") — https://gummysearch.com/r/WebGames/ (B — fetched)
14. Browser-game subreddit norms roundup — https://dinogame.gg/blog/best-browser-game-subreddits/ (B — fetched)
15. r/opensourcegames stats (~17k) — https://gummysearch.com/r/opensourcegames/ (B via search)
16. r/DataHoarder scale (~680k) — search-surfaced secondary (B/C)
17. LibreGaming join page (Matrix/XMPP/IRC rooms) — https://libregaming.org/join-us/ (A/B via search)
18. OpenGameArt licensing culture — https://opengameart.org/content/faq and forum topics (B)
19. Internet Archive Flash/Ruffle program — https://blog.archive.org/2020/11/19/flash-animations-live-forever-at-the-internet-archive/ (B)
20. Rosebud AI community scale (2.3M games, self-reported) — https://rosebud.ai/ and lab.rosebud.ai pages (C)
21. Short-form discovery + 2025–26 organic collapse — https://metricusapp.com/blog/indie-game-distribution-user-acquisition-painpoints-2025-2026/ ; https://www.cloutboost.com/blog/tiktoks-changing-landscape-for-game-marketing-in-2026-what-developers-need-to-know (B)
22. subredditstats r/incremental_games (data broken post-API changes) — https://subredditstats.com/r/incremental_games (A that data is unavailable; member count therefore C)
