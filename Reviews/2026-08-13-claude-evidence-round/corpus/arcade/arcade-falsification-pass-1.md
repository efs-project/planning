# Recovered Claude memo — Arcade differentiation falsification — pass 1

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:30:45.735Z
**Claude task:** `a681870a67a4a744a`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3441
**Original result length:** 24582 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
# EFS Arcade — falsification memo
**Date: 2026-08-12 · Read-only pass · No files created or edited anywhere under EFS_WORKSPACE**

---

## VERDICT (lead)

**The premise does not survive contact with the evidence. For the catalog the Arcade actually proposes, a static site + Git + ordinary replicated storage would suffice — and in several respects already outperforms what EFS has deployed.**

The uncomfortable version, in four sentences:

1. **Byte-durability and stable addressing protect against the *fourth*-most-common way game catalogs die.** The dominant historical killer is runtime obsolescence, where the bytes and the URLs both survived perfectly and the content still became unplayable.
2. **The Arcade's own architecture concedes the case.** `mvp-architecture.md` specifies a **chain-free portable manifest** ("No required chain values"), states "**manifest is the index; chain is provenance, not availability**," defines reconstruction (J13) as `git clone` → build, and notes "**deleting every receipt leaves a valid, re-seedable dataset**." That is a description of the conventional baseline with an optional adapter bolted on.
3. **The proposed catalog needs no rescuing, and the vault says so.** Every launch candidate in `catalog-plan.md` §2 is a public GitHub repo. I verified the js13kGames org has **2,503 public repos** (created 2013-09-22), and `js13kGames/games` — "The production code of all games on the js13kGames.com website" — is a single **162 MB repo with 42 forks**, last pushed 2025-11-13 (GitHub API, checked 2026-08-12). Those 42 forks *are* the mirrored tarball. Software Heritage additionally archives GitHub continuously with content-addressed persistent identifiers (SWHIDs), unpaid and un-asked.
4. **On its own signature property, EFS is currently behind the baseline.** `verifyContentHash` has zero callers; 67 durable Sepolia files carry non-canonical keccak hashes; pins sit on one VPS Kubo node (U16: "SPOF today (verified)"); public RPCs observably failed during the vault's own hands-on probe.

**The one property that is genuinely not baseline-replicable is narrower than claimed, and it is not blockchain-specific.** See classification.

**What the evidence *does* support:** a real, sharply-defined gap exists — but it is a **guest-UX and honest-metadata** gap, not a preservation gap. Every comparable I walked fails visitors in the same places. That gap is buildable on a static site and would be worth building. It just isn't an argument for EFS.

---

# (a) Six-flow guest UX comparison

Walked 2026-08-12 by direct HTTP fetch of pages, headers, sitemaps, data payloads, and client JS bundles. **Hard evidence limit: no JavaScript was executed and no game was actually played.** HTTP 200 + a real body + no external references is strong evidence a game still *loads*; it is not proof it renders or accepts input. No claim below about ad delivery, latency, or touch handling is verified.

## What a good one feels like today

Assembled from the parts that actually work, each observed on a real site:

- **Zero-cost entry.** CrazyGames writes it into its developer contract: "You should always allow the user to start playing as Guest, as main scenario." Poki: "All games on our website are available without registration or an account."
- **Local-first saves that promote to cloud.** CrazyGames: "Progress for guest users is automatically saved locally. When a guest logs in the progress is synced to their cloud."
- **Liveness as a browsable fact.** CrazyGames has an "Updated" badge *and* an "Updated" browse axis, and rates on a rolling six-month window. Poki shows "Latest update: March 2026" beside a 2022 release date. The visitor's real pre-click question is "does this still work."
- **Provenance that survives the maker.** Internet Archive item metadata (`creator: Sega`, `year: 1986`, `cpu: Z80`, cross-linked MobyGames records) is the standard.
- **Decade-stable URLs.** `archive.org/details/arcade_outrun`, public since 2014-08-30, still live 2026-08-12.
- **Ads are not load-bearing.** Newgrounds is reportedly ad-free on all non-adult pages since 2023, funded by Supporter subscriptions (rising to $5/mo, $36/yr effective 2026-04-06). *(medium confidence — Newgrounds 403s all non-browser traffic; entirely secondary evidence.)*

## Per-flow, per-target

| Flow | HN Arcade | js13kGames | itch.io | Poki / CrazyGames | Internet Archive |
|---|---|---|---|---|---|
| **Discover** | Front page shows **zero games**; one flat ~204-game list; 16 tags, 4 sorts | 2,482 games / 15 year archives, but data payload is **name + author only** | Richest anywhere: input, accessibility, session-length facets | Editorial mood rows; "Updated" axis (CG) | Search-and-sort over a flat pile; no editorial layer, no quality gradient |
| **Understand** | **Every entry misreports age** — "Date Added" shown as the date | Correct per-game head metadata; no health signal | Best game page: Updated, Status, Rating, Inputs, Avg session | Strongest: dev credit, release date, latest update, vote counts | Best provenance anywhere; **no per-item "does this work"** |
| **Launch** | Bare outbound link — hosts nothing | Instant desktop; **&lt;720px viewport ejects you off-site** | Click-to-play "Run game"; no account | No account, no download | Two clicks, no account, no ads |
| **Play** | N/A | **No iframe `sandbox`**; 15-feature `allow` incl. camera, mic, display-capture, USB | **No `sandbox`**; all games share one origin | Ad density is the dominant complaint | Sound **muted by default**, unmute-then-refresh; docs still name Internet Explorer; no mobile story |
| **Return** | Clean static URLs, no accounts | **`/entries/` → 301 preserved** across redesign | Stable while the dev cooperates | Poki saves progress **in cookies** | `access-restricted-item: true` — play but never keep |
| **Share** | Card declared, **image missing** | Correct cards; **`frame-ancestors` blocks all third-party embed** | Cards good but **no `og:title`**; **game origin sends no XFO/CSP — freely hot-linkable** | Clean slugs | Decade-stable URLs; `/details/` is a JS shell |

## Where each actually fails a visitor

- **HN Arcade** (hnarcade.com, real — `Show HN` item 46793693, 352 points, 123 comments, ~Feb 2026, single maintainer): of 20 sampled entries, **`time-pin` → HTTP 404**, `bugdom` has no Play URL and renders empty, and `circuit-artist`/`cursor-party`/`hedra`/`wordtrak` lead to Steam pages, GitHub repos, and a blog post. **Six of twenty do not produce play.** The operator's own "How It Works" page describes a 12-hour scraper that only ever adds, and **documents no link-checking or pruning at all**.
- **js13kGames** — the whole site is a JS-only SPA; `/`, `/games`, `/2012/games`, `/2015/games`, `/2019/games` all return the *identical* 23,978-byte shell. With JS off, **2,482 games are invisible**. Mobile visitors are ejected to a context-free raw game URL.
- **itch.io** — every browser game is served from one shared origin (`html-classic.itch.zone`), so localStorage is **not isolated per game**. Deleting a project produces hard 404s and **silently shrinks other people's collections**, leaving holes with no tombstone.
- **Poki** — "If you don't have a Poki account, your game progress is saved in your browser cookies," with no warning attached. Attribution links *off-site* ("by TinyDobbins" → `tinydobbins.com`), outsourcing credit durability to domain renewal.
- **CrazyGames** — names the maker as **plain text**; `/developer/tall-team` returns **404**. Ad policy permits a midroll **every 3 minutes** indefinitely.
- **Newgrounds** — a submission with 60 votes below 2.0/5 is **deleted by community vote**; an **Obituaries** tombstone preserves the reviews but not the work.
- **Internet Archive** — removed items show "**The item is not available due to issues with the item's content**," which distinguishes copyright removal from creator request from disk failure not at all. Fully offline then read-only for roughly a week after the October 2024 DDoS-plus-breach.

## The common failure surface

**The exit path is broken everywhere.** All of them are good at getting a visitor into a game and uniformly bad at what happens when the game leaves. Only itch.io publishes takedowns at durable public URLs. **A shared link to a playable game is a promise every one of these portals routinely breaks, silently.**

**And the preservation/experience tradeoff is currently absolute.** The site with real metadata, real dates and decade-stable URLs has muted sound, stale docs, no mobile, no saves and no curation. The polished sites have cookie saves, unlinked authors, and no stated position on death. **Nobody has built the portal that is both.** That is the real gap — and note that nothing in it requires a chain.

---

# (b) Five operator-loss / dead-catalog case studies

Three premises in my own brief turned out to be wrong and were corrected against sources: Adobe killed the **Shockwave Player** (2019-04-09), not the shockwave.com portal, which it hadn't owned since 2001; the Adult Swim delisting wave is **2024**, not 2019–2022; Kongregate's ownership ends at Monumental (2024), not MTG.

### 1. Adobe Flash EOL — **format obsolescence** (high confidence)
Announced July 2017; EOL 2020-12-31; Adobe shipped a **killswitch into already-installed players on 2021-01-12**. Adobe's EOL page: "Adobe has removed Flash Player download pages from its site." **The critical shape: nobody's hosting went away. The `.swf` files were fine. URLs kept resolving. The interpreter was withdrawn and then remotely disabled.** Survived via a volunteer-written replacement runtime (Ruffle) plus volunteer-held copies. Adobe's contribution was purely destructive.

### 2. Adult Swim Games — **rights and corporate indifference** (high confidence)
Two deaths. The Flash portal games came down in 2020 (runtime). Then WBD sent legal notices in **March 2024** giving developers 60 days before ~19 Steam titles were "retired." **WBD refused to transfer the games back**, citing "logistical and resource constraints." Developers who saved their games had to re-release under their own accounts, **losing all wishlists and reviews**. Bitmap Bureau publicly disputed Adult Swim's claim that developers were unavailable, offering "We sold the IP to Adult Swim back in the day, but we're happy to buy it back if that's an option." Site shuttered **February 2026**. Only 2 of ~19 got rights returned. Meanwhile Robot Unicorn Attack survived because a stranger uploaded it to the Internet Archive on 2020-11-19, before the killswitch. **The rights-holder path saved 2 of 19; the volunteer-copy path saved the artifact outright.**

### 3. Neopets — **the controlled experiment** (high confidence)
Announced a Flash→HTML5 transition in 2019. April 2020: **seven** HTML5 conversions. October 2021: **three more**. Running total after ~18 months of funded first-party engineering: **10 games**, against a site housing over 100. **July 2023: "most of the original Flash games were restored via the site's integration with the Ruffle emulator."** First-party rewrite: 10 games in 18 months. Volunteer emulator: most of the catalog in one integration.

### 4. Glitch — **the hard limit no storage scheme touches** (high confidence)
Closed 2012-12-09. In November 2013 Tiny Speck released **10,000+ works of art, animations, and code under CC0**, including the Android and Flash client source. **Total, unencumbered, public-domain release of every artifact did not make the game playable.** Volunteers still had to rebuild the server from scratch and were still in alpha years later. Companion cases: **FarmVille** (closed 2020-12-31, peak 80M+ players, **nothing survives**); **Club Penguin** (Disney closed 2017; the volunteer rebuild *Club Penguin Rewritten* reached 11M+ registered users and was then killed by **three arrests on 2022-04-12** and site seizure by City of London Police at Disney's request). **Toontown Rewritten** survives on identical technical footing — the only difference is that Disney chose not to enforce.

### 5. hackernews.games — **the operator-owned directory evaporating in real time** (high confidence)
A curated catalog advertised as **528 games**, still ranking in search results, **returns NXDOMAIN as of 2026-08-12** (`dig` → NXDOMAIN; `curl` → could not resolve host). A community game directory of exactly the HN Arcade's shape has already fully evaporated, taking every link with it. **This is the closest real-world analogue to the Arcade's own failure mode — and note that it is a domain/DNS failure, which content-addressing does address, and which a GitHub Pages URL under an org account also largely avoids.**

### Supporting: what actually saved things
**Flashpoint Archive** — 220,579 entries, 1.68 TB (live FAQ counter, checked 2026-08-12), unpaid contributors, founder's own legal posture: *"nobody knows and really, nobody should care."* Crucially it is **opt-out** — **Nitrome exercised removal in 2020 and had its games pulled**. The volunteer archive inherits the rights problem it was built to route around. Its documented hard limits: **"Flashpoint does not provide capabilities for online multiplayer,"** plus sitelock and multi-asset games.

**Ruffle** — begun by one person in 2016, MIT/Apache. It is what the Internet Archive runs (Nov 2020), what Kongregate runs (Aug 2022), what Neopets runs (Jul 2023). **Every commercial operator that "saved its catalog" saved it by installing volunteer software.** And after seven years, ActionScript 3 sits at ~90% of the language / 82% of the API. Coverage is still not complete.

### Cross-case synthesis — ranked by observed body count
1. **Runtime/format obsolescence** — by far the largest killer, and the files were never lost.
2. **Rights and corporate indifference** — resists technical fixes entirely, and reaches *into* the preservation layer (Nitrome, Club Penguin Rewritten).
3. **Operator churn** — rarely the proximate cause; frequently why nobody has a copy when the proximate cause hits.
4. **Link rot / single-server hosting** — where long-tail titles go permanently lost.

**The mechanism that actually saved things: volunteers who kept copies, plus a re-implemented runtime someone wrote for free. Not one catalog in this set was saved by its rights holder acting alone.**

---

# Classification of each claimed Arcade benefit

Test applied to each: *what would a static site on GitHub Pages plus a mirrored tarball fail to do?*

| # | Claimed benefit | Classification | Reasoning |
|---|---|---|---|
| 1 | **Verified bytes / verify-before-execute** | **CONVENTIONAL-BASELINE-SUFFICIENT** | A signed manifest with sha256 per file does this exactly. The vault's own manifest already carries `"sha256": "808a2772…"`. EFS is currently *worse*: `verifyContentHash` has zero callers, 67 files carry wrong-format hashes. Also note the threat model is thin — the historical attack is malicious *original* content, which verified bytes faithfully preserve. |
| 2 | **Operator-independent link identity** | **CONVENTIONAL-BASELINE-SUFFICIENT** | EFS does not remove the operator; it *multiplies* intermediaries — chain liveness + RPC provider + IPFS gateway + an EFS-aware client, versus one DNS name. All four need someone to keep paying. Evidence: public RPCs failed in the vault's own probe; js13k's `/entries/ → 301` shows a plain static site preserving link identity across a full redesign for over a decade. |
| 3 | **Mirror-fallback durability** | **CONVENTIONAL-BASELINE-SUFFICIENT** | Multiple hosts, or a CID, or 42 GitHub forks. The vault labels this "parity beats plus on-chain identity" itself. Current reality: one VPS Kubo node (U16, "SPOF today"). |
| 4 | **Walk-away reconstruction** | **CONVENTIONAL-BASELINE-SUFFICIENT** — baseline is strictly better | `git clone` *is* the walk-away primitive, and J13 literally specifies `git clone` as step one. Meanwhile the June seed left **zero committed receipts** and a second operator "must re-derive everything from chain scans." |
| 5 | **Permissionless curator plurality** | **UNRESOLVED**, and narrower than claimed | Forking a data repo is already permissionless second-party curation (osgameclones, awesome-lists). The genuine residue is *claim discoverability anchored to the object rather than the curator*. But (i) **this is not blockchain-specific — Nostr NIP-54 + NIP-51 ship exactly this**: multiple authors publishing competing articles under the same normalized `d` tag, with curation sets over them, no chain, no gas; (ii) it only becomes user-visible if a **neutral aggregating client** exists, which the Arcade's single-operator site is not — the vault's own risk note is "plurality theater with one curator wearing two hats"; (iii) evidence-bar test 4 (unprompted second party) is UNVALIDATED at zero instances. |
| 6 | **Creator-attributable, opt-in publishing** | **CONVENTIONAL-BASELINE-SUFFICIENT** | Signed commits, signed tags, or Sigstore/Rekor — a public transparency log run by a nonprofit — do this today. Signing with an Ethereum key rather than a GPG key is the same cryptographic fact. Note the v2 ruling in project memory removes ERC-1271 authorship, weakening this further. Portals get attribution wrong through *product* choices (unlinked plain text, off-site links), not missing cryptography. |
| 7 | **Permanence / no-single-owner durability** | **CONVENTIONAL-BASELINE-SUFFICIENT** — and the substrate is the weak link | Software Heritage archives GitHub continuously with content-addressed SWHIDs, Inria/UNESCO-backed, free, no opt-in. Against that, EFS's substrate is a **testnet with a permissioned validator set** (ethereum.org, checked 2026-08-12) on a chain family with a documented kill cadence: Ropsten/Rinkeby/Kiln deprecated 2022-06-21, Goerli 2023 (LTS sunset ~April 2024), **Holesky deprecated September 2025**. A Sepolia replacement is in active naming discussion with an agreed parallel-run grace period (ACDC #165, Sept 2025); no confirmed EOL date — the widely-repeated "2026-09-30" figure is **not** primary-sourced and I could not confirm it. |
| 8 | **Replaceable / correct-without-erasing** | **CONVENTIONAL-BASELINE-SUFFICIENT** | Git is immutable objects behind mutable refs — this is precisely the property. EFS's version is *worse* on the failure mode that actually matters: rights. Flashpoint survives 220k unlicensed games because it **can** remove; Nitrome made it do so. The vault states plainly that "EFS cannot offer that compromise." Even Software Heritage implements takedown and masking. **Irreversibility is a liability here, not a feature.** |
| 9 | **Guest-fast, no-account, no-wallet play** | **CONVENTIONAL-BASELINE-SUFFICIENT** — EFS makes it harder | This is a client property. The stock explorer costs ~45 block-watchers per visitor and 7 serial reads before first paint; the plan is explicitly to "**never serve the explorer to arcade guests**" and bypass the stack with a build-baked manifest. That bypass is a static site. |
| 10 | **Idempotent re-publication proof** | **CONVENTIONAL-BASELINE-SUFFICIENT** | An engineering hygiene property of the seeder, not a user benefit. A no-op `git push` is the baseline equivalent. |
| 11 | **Preserving the runtime** — *not claimed, and that is the finding* | **UNRESOLVED / unaddressed by any party** | The dominant historical killer is entirely outside the scope of everything above. itch.io's own devlogs record games hanging on load after Chrome's SharedArrayBuffer change and audio breaking under Chrome 71's autoplay policy. Perfect byte preservation yields an unplayable game. Nothing in the Arcade design touches this. |

**Net: 8 of 10 claimed benefits are CONVENTIONAL-BASELINE-SUFFICIENT, 1 is UNRESOLVED and not blockchain-specific, 0 are EFS-SPECIFIC.** The honest answer to "what would a static site plus a mirrored tarball fail to do" is, for eight of these, **nothing**.

---

## Recommendations (separated from evidence above)

1. **Retire "preservation" as the Arcade's rationale for this catalog.** The corpus is 2,503 GitHub repos with 42 forks on the aggregate repo and automatic Software Heritage coverage. The vault's own pitch-framing rule already half-concedes this ("games that need no rescuing"); the evidence says go further and drop the frame entirely for this content class.
2. **If the Arcade proceeds, promote it on the gap the evidence actually found**: nobody has built a playable portal that is both well-preserved and pleasant, and every comparable breaks the same way — dead Play links with no health signal, misreported ages, broken exit paths, unlinked creators, fragile saves. HN Arcade's 6-of-20 non-playable sample and its documented absence of any link-checking process is the sharpest opening. **None of that needs a chain.**
3. **Treat the curator-plurality beat as unproven rather than as the answer to the baseline question.** Before building it, answer why Nostr's shipped equivalent has not produced the behavior, and note that a single-operator site cannot express the property regardless.
4. **Do not put permanence language in public copy while the substrate is a permissioned testnet on a chain family with three prior shutdowns, hashes are wrong on 67 durable files, and pins sit on one VPS.** The vault's D7 draft is already more honest than most; the evidence says it is still ahead of the facts.
5. **If preservation stays in scope anywhere, budget for the runtime, not the bytes.** Ruffle took seven years to reach ~90%/82% on ActionScript 3, and Glitch proves that even total public-domain release does not recover server-dependent content.

## Evidence gaps — stated rather than filled

- The **indie/jam/platform lane did not return** (agent stalled). So the **itch.io September 2024 registrar takedown**, the **2025 payment-processor deindexing**, **Desura**, **Ludum Dare link rot**, and — importantly — **GitHub/GitHub Pages' own documented failure modes (DMCA repo takedowns, account deletion killing Pages sites)** are **unverified in this pass**. That last one is the baseline's weak spot and my classification is correspondingly under-tested against it. It should be closed before this memo is relied on.
- No JavaScript was executed anywhere; no game was actually played. All runtime claims (ads, latency, mobile, rendering) are unverified.
- Newgrounds 403s all non-browser traffic — its entire six-flow account is secondary.
- Kongregate's 2026 catalog state could not be established: the site advertises "thousands of games" while `/en/flash-games` rendered "Showing games 1 - 0 of 0." Needs a human with a browser.
- The Sepolia EOL date is **not** established. Treat "September 2026" as unsourced rumor; what *is* sourced is the replacement process and the three-testnet shutdown precedent.

## Key sources (all checked 2026-08-12)
ethereum.org/en/developers/docs/networks · blog.ethereum.org/2022/06/21/testnet-deprecation · blog.ethereum.org/2025/09/01/holesky-shutdown-announcement · ethereum-magicians.org/t/testnet-name-needed-for-sepolia-replacement/23221 · api.github.com/orgs/js13kGames · api.github.com/repos/js13kGames/games · docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html · softwareheritage.org/legal/content-policy · github.com/nostr-protocol/nips/blob/master/54.md and /51.md · hnarcade.com · news.ycombinator.com/item?id=46793693 · hackernews.games (NXDOMAIN) · js13kgames.com · itch.io/games/html5 · html-classic.itch.zone · poki.com/en/c/faq · docs.crazygames.com/requirements/ads · archive.org/metadata/softwarelibrary_flash · help.archive.org/help/the-internet-arcade · blog.archive.org/2020/11/19/flash-animations-live-forever-at-the-internet-archive · adobe.com/products/flashplayer/end-of-life.html · flashpointarchive.org/faq · kotaku.com/adult-swim-wb-discovery-delist-deleted-games-steam-ps4-1851320858 · gamedeveloper.com/business/adult-swim-delists-further-games-casts-doubt-on-developers-re-acquiring-rights · en.wikipedia.org/wiki/Glitch_(video_game) · en.wikipedia.org/wiki/Neopets · en.wikipedia.org/wiki/Club_Penguin_Rewritten · medium.com/@kongregate/unlocking-kongregates-flash-games-65cca6805e6d

Vault material read read-only: `Designs/arcade/*` (11 docs), `Reviews/2026-08-07-arcade-deep-dive.md`, `Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md`, `hands-on-browser-test-log.md`. The prior falsification lane was explicitly local-docs-only with no web research, so this pass is delta rather than duplication; I deliberately did not re-run the 15-platform competitor matrix.
