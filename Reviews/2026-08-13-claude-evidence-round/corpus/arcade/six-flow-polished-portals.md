# Recovered Claude memo — Six-flow UX: polished portals

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:26:20.101Z
**Claude task:** `ab75d10f3d5bf554c`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3395
**Original result length:** 29546 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Here are the findings.

---

# Playable web-game portals: six-flow visitor walk
**All fetches performed 2026-08-12.** Everything below is either VERIFIED (I fetched the page and am quoting/paraphrasing what came back) or INFERRED/SECONDARY (search-summarizer output, wikis, third-party reporting). Confidence labels are per-claim.

## Verification limits you must carry into the memo
- **A text fetch cannot verify runtime behavior.** No claim below about actual ad playback, interstitial timing, time-to-playable, frame rate, mobile touch handling, or offline behavior is verified. Where I say something about ads I am quoting the portal's own *policy docs* or *user complaints*, not observed ad delivery.
- **Newgrounds blocked every fetch attempt.** HTTP 403 on `https://www.newgrounds.com/`, `https://newgrounds.com/`, `https://www.newgrounds.com/portal/view/59593`, and through a text-extraction proxy. Every Newgrounds claim here is secondary (Wikigrounds `newgrounds.wiki.gg`, search summaries). Treat Newgrounds as the weakest-evidence target and re-walk it in a real browser before the memo ships.
- **Trustpilot blocked fetches** for both `poki.com` and `crazygames.com` (403), so complaint quotes are search-summarizer relay, not first-hand.
- **archive.org `/details/` pages are a JS shell to a non-JS client.** Fetching `https://archive.org/details/internetarcade` returned only the site-wide title "Internet Archive: Digital Library of Free & Borrowable Texts, Movies, Music & Wayback Machine" — no collection description, no item list. I had to go around it via the metadata and advancedsearch APIs. That is itself a finding (see SHARE).
- WebSearch budget was exhausted mid-research; several complaint-side questions (Poki's 2026 redesign backlash, Newgrounds ad complaints) are thinner than I wanted.

---

# 1. POKI (poki.com)

**Fetched:** `https://poki.com/`, `https://poki.com/en/g/subway-surfers`, `https://poki.com/en/g/monkey-mart`, `https://poki.com/en/c/faq`, `https://developers.poki.com/`, `https://sdk.poki.com/`

**DISCOVER** — VERIFIED (high). Front page leads with a search prompt, "What are you playing today?", and a category rail (2 Player Games, Shooting Games, Car Games, Minecraft Games). Rows are editorially named and mood-shaped, not just algorithmic: "Popular this week", "Top free games" (with 4.3–4.4 star aggregates inline), "Poki web exclusive & licensed games", "Play with friends and others", "Challenge yourself", "Games to relax". A flame glyph marks trending titles. The pitch is on-page: "No installs, no downloads, just click and play." No sign-in prompt appears in the homepage markup, and no cookie banner text was present in the fetched content (banners are usually JS-injected — cannot verify by fetch).

**UNDERSTAND** — VERIFIED (high). This is the strongest pre-launch page of any target. `monkey-mart` shows: developer credit "by TinyDobbins" as a hyperlink to `https://www.tinydobbins.com/`; Release Date November 2022; "Latest update: March 2026"; rating 4.6 from **3,794,504 votes**. `subway-surfers` shows "by SYBO", original release February 2012, on Poki since 2018, latest update August 2026, 4.4 from 21.15M votes, plus separate desktop and mobile control lists. Both carry a real FAQ block ("No downloads are required. You can play Monkey Mart online directly in your browser", fullscreen instructions, multiplayer yes/no). A visitor gets what it is, who made it, how old it is, that it's still maintained, and that it's free — before clicking.

**LAUNCH** — VERIFIED (policy) / cannot verify (runtime). FAQ: "All games on our website are available without registration or an account." and "Yes, all the games on Poki are 100% free to play." No download. Mobile is a first-class path (control lists are written for touch). Ads before play: Poki's own line, relayed via search, is that it runs no pre-roll — I could **not** confirm this in Poki's developer docs (`developers.poki.com` returned only a page title; `sdk.poki.com` returned overview text without the ad-frequency rules). Confidence on "no pre-roll": low-medium, and I'd flag it as unverified in the memo.

**PLAY** — Mixed. Fullscreen is documented per-game (FAQ). Mid-play ad density is the single most common complaint: search-relayed user reviews include "can't go 1 second into a game without getting ads ontop of ads ontop of ads" (medium confidence — Trustpilot fetch blocked). Poki's answer to "can I remove ads?" is verbatim: "No, ads are part of the Poki experience. They make it possible for you to play for free." There is a walled-off alternative: "kids.poki.com, an ad-free, child-friendly space." Offline: not supported, no evidence either way (low).

**RETURN** — VERIFIED (high) and this is where it gets ugly. Verbatim FAQ: "If you don't have a Poki account, your game progress is saved in your browser cookies." With an account, "your progress is safely stored online." Cookies as the default save substrate in 2026 is a real durability problem — cookie clearing, ITP/ETP 7-day caps, and cross-device use all silently destroy progress, and the FAQ does not warn the visitor. URLs are clean and stable-looking (`/en/g/<slug>`).

**SHARE** — Slug URLs are clean and human-readable. Link durability across the 2026 redesign: not verified. Preview cards: cannot verify by fetch.

**Curation quality note:** "Yes, all games and ads are reviewed by our team to give you a high-quality, curated experience." Poki explicitly claims to review the *ads*, not just the games — that's a differentiator worth citing.

---

# 2. CRAZYGAMES (crazygames.com)

**Fetched:** `https://www.crazygames.com/`, `https://www.crazygames.com/game/smash-karts`, `https://docs.crazygames.com/requirements/ads/`, `https://docs.crazygames.com/requirements/account-integration/`, `https://docs.crazygames.com/faq/`, `https://www.crazygames.com/developer/tall-team` (404)

**DISCOVER** — VERIFIED (high). Persistent left sidebar: Home, **Recently played**, New, Popular Games, Updated, then ~16 genre categories (Action, Adventure, Arcade, Board, Card, Clicker, Driving, .io, Puzzle, Shooting, Simulation, Sports, Strategy, Trivia, Word). Rows: "Featured games" with Hot / Top / **Updated** badges, "CrazyGames Originals", "Can't stop playing", "New games", plus a "Leaderboards" module (showing "0 ranked" to a signed-out visitor). The "Updated" badge and an "Updated" browse axis are the best *liveness* signals I saw anywhere — CrazyGames treats "is this still maintained" as a first-class facet. "Recently played" in the sidebar is a return-path affordance offered to signed-out users.

**UNDERSTAND** — VERIFIED (high), with one sharp failure. Smash Karts page: Released May 2020, **Last Updated August 2026**, rating 9.0/10 explicitly scoped "based on last 6 months" (a rolling-window rating — a freshness signal, not a lifetime score; unusually honest). FAQ block answers "Who made Smash Karts? Smash Karts was made by Tall Team." **But the developer name is plain text, not a link** — and `https://www.crazygames.com/developer/tall-team` returns 404. The visitor is told who made it and given no route to them or their other work.

**LAUNCH** — VERIFIED (docs, high). Guest play is mandated by CrazyGames' own developer rules: "Guests can also play the games" and "You should always allow the user to start playing as Guest, as main scenario." Homepage copy promises play "without interruptions from downloads, intrusive ads, or pop-ups". Time-to-playable and pre-roll behavior: cannot verify by fetch.

**PLAY** — VERIFIED (policy) / cannot verify (runtime). The ad rules are the most explicit of any target and worth quoting in the memo: "Video ads can not interrupt gameplay and shouldn't come as a surprise"; the platform enforces midroll frequency at "max 1 every 3 minutes"; rewarded rules include "Do not chain multiple ads", "Do not offer a rewarded ad too often", and "When our rewarded ad returns with an `adError` callback, do NOT reward the player"; banners are capped: "A maximum of 2 in-game banners may be displayed on the same screen/view" and "only allowed on useful screens with content that are open for at least 5 seconds on average". Note the gap: an ad every three minutes is *policy-compliant* and still feels relentless, which is exactly what users report.

**RETURN** — VERIFIED (docs, high). "Progress for guest users is automatically saved locally. When a guest logs in the progress is synced to their cloud." Signing in gets "save progress, play on multiple devices, customize their username and avatar and play with their friends." This is the best-designed save model of the four: local-first, no wall, promotable to cloud. Counter-evidence (search-relayed, medium): documented cases of progress loss, including a user who "lost all their progress" after about two weeks playing signed out — i.e., the local-first promise breaks in practice.

**SHARE** — `/game/<slug>` URLs are clean. What happens when a game is unpublished: **the CrazyGames FAQ does not address game removal, URL stability, or developer credit at all** (verified absence in `docs.crazygames.com/faq/`). Cannot verify the 404 experience.

---

# 3. NEWGROUNDS (newgrounds.com) — SECONDARY EVIDENCE ONLY

**Direct fetch impossible: 403 on all four attempts, 2026-08-12.** Sources below: `https://newgrounds.wiki.gg/wiki/Newgrounds`, `https://newgrounds.wiki.gg/wiki/Under_Judgment`, `https://newgrounds.wiki.gg/wiki/Ruffle`, search relay.

**DISCOVER** — SECONDARY (medium). Four author-facing portals: Movies, Games, Audio, Art, plus the BBS. Curation is community-vote-driven rather than editorial.

**UNDERSTAND** — SECONDARY (medium). Attribution is structurally the strongest model of any target: submissions are attached to author accounts on the same host, and the platform supports "users to split their earnings between authors" — multi-author credit as a first-class concept, which none of the commercial portals have.

**LAUNCH** — SECONDARY (medium). No account needed for general content. **Exception, and it's a real gate:** since 2022, viewing A-rated (Adult) submissions requires a logged-in account with a listed age of 18+; users with no birthday configured are redirected to configure one. That's a hard account wall on a slice of the catalog.

**PLAY** — SECONDARY (medium). The important, genuinely good news: Newgrounds is reportedly **"ad-free on all pages except on Adult Content pages since 2023,"** with Supporter-status banners in place of ads. Funding is subscription: Supporter was $3/mo / $25/yr; Tom Fulp announced on 2026-03-02 a rise to **$5/mo / $36/yr effective 2026-04-06**, with existing subscribers grandfathered. If accurate, Newgrounds in 2026 is the only major playable portal that is not ad-monetized — a direct rebuttal to "ads are the only way to make free play work."

**Flash back-catalog:** Ruffle is integrated site-wide; Tom Fulp founded a "Ruffle Testing / Flash Preservation Crew" in early 2021 to "weed out old flash entries that were missing features"; a "Flash Forward 2025" game jam ran in 2025 with Flash entries playable via Ruffle. Coverage is described as "most AS3 games" — i.e. **substantial but not complete**, with a human crew doing per-item triage. Confidence medium; the wiki page is a stub and I could not confirm playability first-hand.

**RETURN / SHARE** — SECONDARY (high confidence on the mechanism, it's well documented). This is Newgrounds' defining failure and the most interesting finding in the whole sweep: **new submissions can be auto-deleted by community vote.** Under Judgment thresholds as of 2024-12-06: at 40 votes a submission needs 1.0/5 to survive, at 50 votes 1.5/5, at 60 votes 2.0/5. Below threshold it is "blammed" — deleted from the platform. What survives is an **Obituaries** listing: "a deleted or 'blammed' entry in The Portal will generate a new listing in the Obituaries", preserving the reviews and vote history but not the work. Submissions that pass judgment remain "susceptible to author deletion or mod-deletion due to valid flagging", and works are also unpublished when an account is deleted with no co-author to inherit, or when a licensed song is removed.

So Newgrounds has a *tombstone* where other portals have a 404 — the community's reaction to a game outlives the game. That is a design pattern worth stealing and an availability model worth attacking, in the same breath.

---

# 4. INTERNET ARCHIVE — Internet Arcade + Software Library: Flash

**Fetched:** `https://archive.org/advancedsearch.php` (several queries), `https://archive.org/metadata/softwarelibrary_flash`, `https://archive.org/metadata/arcade_outrun/metadata`, `https://archive.org/embed/arcade_outrun`, `https://help.archive.org/help/the-internet-arcade/`, `https://help.archive.org/help/rights/`, `https://help.archive.org/help/removing-your-item-pages-from-archive-org/`, `https://blog.archive.org/2020/11/19/flash-animations-live-forever-at-the-internet-archive/`, `https://archive.org/post/386283/...`, `https://archive.org/post/1124280/...`

This is the most important comparable and it fails visitors in ways the commercial portals do not — and succeeds in ways they cannot.

**Scale, VERIFIED (high), as of 2026-08-12:** Internet Arcade = **2,663 items**. Software Library: Flash = **20,207 items** across subcollections; `softwarelibrary_flash_games` alone = **6,503 items**. Top Flash items by downloads all carry `emulator: ruffle-swf` and real creator metadata: "The Binding Of Isaac: Wrath of the Lamb (Flash)" / Edmund McMillen (207,556), "Stick RPG Complete" / XGen Studios (160,316), "Cannibals & Missioneries" / Plastelina Logic Games, チーズクエスト / Cartoon Network Japan.

**DISCOVER** — Partly VERIFIED, and bad. Browse/sort/facet work (I drove them via API: sort by downloads, filter by collection). But the human-facing `/details/` page is a client-rendered app: a non-JS fetch gets nothing but the generic site title. There is no editorial curation layer, no "trending", no "still works" signal, no thematic rows. Discovery is search-and-sort over a flat 2,663-item pile with no quality gradient. The collection blurb is itself the ranking disclaimer, verbatim: **"Most games are playable in some form, although some are useful more for verification of behavior or programming due to the intensity and requirements of their systems."**

**UNDERSTAND** — VERIFIED (high), and it's genuinely excellent on provenance, terrible on expectation-setting. `arcade_outrun` item metadata: `creator: Sega`, `year: 1986`, `cpu: Z80`, `genre: "Driving / Race (chase view)"`, `publicdate: 2014-08-30`, `uploader: softwarelibrary@textfiles.com`, `emulator: outrun`, `emulator_ext: zip`, plus cross-referenced `mobygames_released: Sep 25, 1986`, `mobygames_developed_by: SEGA-AM2 Co., LTD.`, `mobygames_published_by: SEGA Enterprises Ltd.` No commercial portal comes close to this on authorship, dating, or technical lineage. What is *missing* is any per-item statement of whether **this** item actually works, how big the download is, or whether sound functions. The collection-level hedge is the only warning, and the visitor sees it once at most.

Rights posture, VERIFIED and load-bearing: `collection: internetarcade, stream_only, emulation` and **`access-restricted-item: true`**. The ROM is playable in-browser but not downloadable. The Archive's legal position rests on stream-only access, which means preservation here is *contingent on the Archive's servers being up* — you cannot take the artifact with you.

**LAUNCH** — VERIFIED (high). `https://archive.org/embed/arcade_outrun` is a minimal page: a screenshot, a start graphic, "Click to Begin". Two clicks from item page to running. No account, no ads, no download prompt. And no size disclosure, no loading estimate, no control legend on the embed itself. Help page: "Every arcade game can be played using your keyboard; no gamepad or joysticks are needed." **Mobile: the help page says nothing at all** — a keyboard-only, coin-insert-key emulator is effectively unusable on a phone (INFERRED, high).

**PLAY** — VERIFIED (docs, high), and this is the worst-quality play experience of the four. From `help.archive.org/help/the-internet-arcade/`: sound is **muted by default**, requires clicking Unmute *and then refreshing* to persist, and "The sound can easily distort, even when doing something like switching between tabs or moving the mouse!" Browser guidance still names Internet Explorer — the doc is stale by roughly a decade. No save states surfaced to visitors, no progress persistence, no favorites integrated with play. For Flash, the Archive's own 2020 post is candid: Ruffle "compatibility with Flash is less than 100%", it is "a developing emulator, and compatibility with SWF files is continually improving but is not perfect", and "The emulator only works with a single SWF file at the moment, which should have no spaces in it" — which structurally excludes multi-SWF games, i.e. a lot of the ambitious Flash canon.

**RETURN** — This is the Archive's real exposure. Two documented failure modes:

1. **Item-level removal.** The visitor-facing string, verified verbatim from the forum thread: **"The item is not available due to issues with the item's content. If you would like to report this problem as an error report, you may do so here."** Staff explanation is that this normally means the item was removed for copyright, or by creator request. The URL survives; the content does not; the message never tells you *why*, and uploaders report not being notified. `help.archive.org/help/rights/` states only "If the Internet Archive is made aware of content that infringes someone's copyright, we will remove it per our Copyright Policy," with a counter-notice path and a 10–14 day restoration window. Neither the rights page nor the item-removal help page says whether removal is deletion or darkening, or what the URL shows afterward (verified absence — the Archive does not document the visitor experience of a dead item).
2. **Site-level outage.** October 2024: DDoS campaign plus a breach exposing 31 million accounts; the Archive went fully offline, then came back partially and read-only over roughly a week or more (SECONDARY, medium-high — multiple outlets). For a preservation arcade, "the whole library is down for a week" is the availability story that matters most, and it has already happened once in living memory.

I could **not** find documentation of a specific mass removal of *emulated games* by publisher request. Jason Scott's forum post on emulated-item policy (`archive.org/post/1124280`) is about quality control and subcollection organization, not takedowns — it contains no removal-procedure or rightsholder-complaint policy (verified absence). Related but distinct, and worth not conflating in the memo: the 2024 Nintendo/Sega/Sony takedown wave hit *other* ROM sites (Vimm's Lair), and the 2024 US Copyright Office ruling **declined** to grant the broader preservation exemption libraries sought for remote access to out-of-print games (SECONDARY, medium). Confidence that IA emulated games have suffered *no* removals: low — absence of found evidence, not evidence of absence.

**SHARE** — `/details/<identifier>` URLs have been stable since 2014 (`arcade_outrun` public since 2014-08-30 and still live in 2026) — **the best URL durability of any target, by a decade.** Against that: the `/details/` page renders client-side, so a plain fetch sees only the generic site-wide title, which suggests shared-link preview cards may be generic rather than game-specific (INFERRED, medium — I could not verify og: tag emission by fetch).

---

# 5. Secondary comparables (lighter walk)

**itch.io** — VERIFIED via `https://itch.io/games/html5` (high). **712,769** HTML5 results. Filter set is the richest of anyone: Platform ("Play in browser"), Price (Free / On Sale / Paid / $5 or less / $15 or less), recency (Last Day / 7 / 30), 18 genres, **Input Methods** (Keyboard, Mouse, Gamepad, Touchscreen, and oddities like racing wheel), and a full **Accessibility** facet — Color-blind friendly, Subtitles, Configurable controls, High-contrast, Tutorial, One button, Blind friendly, Textless. Sorts: Popular, New & Popular, Top sellers, Top rated, Most Recent. Every card shows the developer name and a "Play in browser" tag. Header offers "Log in" / "Register" but browsing and browser-play do not require it. Notably, itch publishes takedown notices at **durable public URLs** (`itch.io/takedowns/<id>` — I saw two in search results but did not fetch them; medium confidence). That is the only transparent-removal pattern I found anywhere, and it's the direct answer to the Archive's silent "issues with the item's content."

**Kongregate** — VERIFIED via Wikipedia (medium). "On July 1, 2020, Kongregate announced the discontinuation of submissions"; "The portal was closed to new user submissions in 2020, though previously submitted games remain"; forums halted at the same time. The article, last updated 2026-07-16, **does not state whether the web portal's games are actually playable in 2026**. I could not confirm current playability (search budget exhausted). Treat as: a portal in indefinite caretaker mode, unverified whether anything still runs. This is the cautionary tale — a decade-defining portal whose current playable status a determined researcher cannot establish in an afternoon.

---

# WHERE EACH ACTUALLY FAILS A VISITOR

**Poki** — *Progress is stored in cookies.* Verbatim from their FAQ, no warning attached. The visitor who plays for a month signed-out and then clears cookies or switches devices loses everything, and nothing on the site told them that would happen. Secondary failure: attribution links *off-site* ("by TinyDobbins" → `tinydobbins.com`), so credit durability is outsourced to whether an indie dev renews a domain. Third: ad density is the dominant user complaint and Poki's official answer is a flat refusal ("No, ads are part of the Poki experience"), with an ad-free experience available only to children at a separate domain.

**CrazyGames** — *Names the maker, links nowhere.* "Smash Karts was made by Tall Team" as dead text, and `/developer/tall-team` is a 404. The visitor cannot get from a game they liked to anything else that team made. Second: their own rules permit a midroll every three minutes indefinitely — compliant and still exhausting, which matches the complaint record. Third: the local-first save promise demonstrably breaks (reported total progress loss after ~2 weeks signed out), and the FAQ documents nothing about removal, URL stability, or what a visitor hits when a game is unpublished.

**Newgrounds** — *The portal can delete a game because strangers voted it down.* At 60 votes and under 2.0/5, the work is gone; the reviews survive in Obituaries. A visitor following a shared link to a blammed submission gets a dead page and a tombstone of complaints about a thing they can no longer see. Plus an 18+ account wall on A-rated content, and — for the researcher and for any automated client — the site 403s non-browser traffic outright, which is its own kind of unavailability.

**Internet Archive** — *Best metadata, worst play.* Sound muted by default requiring an unmute-then-refresh dance, distortion "even when... moving the mouse", help docs still recommending Internet Explorer, no per-item statement of whether this particular item works, no size or load-time disclosure, no save state, and no mobile story at all for a keyboard-only emulator. Then the availability layer: `access-restricted-item: true` means you can play but never keep, so preservation depends entirely on IA's servers — which were fully down and then read-only for about a week in October 2024. And when an item does go, the visitor gets "The item is not available due to issues with the item's content," which explains nothing, distinguishes copyright removal from creator request from disk failure not at all, and (per uploader complaints) arrives with no notification.

**Kongregate** — *Fails by ambiguity.* You cannot tell from the public record whether the games still run. A portal whose liveness is unknowable has already failed the RETURN flow.

---

# SYNTHESIS

## What a genuinely good playable portal feels like in 2026
Assembled from the parts that actually work, each observed on a real site:

1. **Zero-click-cost entry.** No account, no download, no pre-roll. CrazyGames writes this into its developer contract — "You should always allow the user to start playing as Guest, as main scenario" — and Poki states it flatly: "All games on our website are available without registration or an account." Account is a *promotion*, never a gate.
2. **Local-first saves that promote to cloud.** CrazyGames' model is the reference: "Progress for guest users is automatically saved locally. When a guest logs in the progress is synced to their cloud." Poki's cookie-based version is the same idea implemented on the wrong substrate.
3. **Liveness as a first-class, browsable fact.** CrazyGames has an "Updated" badge *and* an "Updated" browse axis, and rates games on a rolling six-month window. Poki shows "Latest update: March 2026" next to a 2022 release date. The visitor's real question before clicking is "does this still work," and good portals answer it in the card, not the page.
4. **Provenance that survives the maker.** The Archive's item metadata (creator, year, publisher, CPU, cross-linked MobyGames records) is what durable attribution looks like. Newgrounds' author-account model, with revenue splits across co-authors, is what durable *credit* looks like. Nobody does both.
5. **Discovery with an editorial voice.** Poki's mood rows ("Games to relax", "Challenge yourself") and itch's accessibility and input-method facets both beat relevance-ranking, in opposite directions — one is taste, the other is fit. The Archive has neither and it shows.
6. **Decade-stable URLs.** `archive.org/details/arcade_outrun`, live and unchanged since 2014-08-30, is the standard.
7. **Ads are not actually load-bearing.** Newgrounds has reportedly been ad-free on all non-adult pages since 2023, funded by Supporter subscriptions ($5/mo, $36/yr as of 2026-04-06). The free-play-requires-ads premise is an assumption, not a law.

## The common failure surface
Every portal in this sweep fails on the same axis, in the same order:

**First, the exit path is always broken.** All four are excellent at getting a visitor *into* a game and uniformly bad at what happens when the game leaves. The Archive shows "issues with the item's content" and explains nothing. Newgrounds deletes on a vote and leaves reviews of an absent work. CrazyGames documents removal nowhere. Poki's FAQ is silent on it. Only itch.io publishes takedowns at durable public URLs. **A shared link to a playable game is a promise every one of these portals routinely breaks, silently.**

**Second, save state is the weakest link everywhere.** Cookies (Poki), local storage with reported data loss (CrazyGames), or nothing at all (Internet Arcade). The thing a returning visitor cares most about is the thing least engineered.

**Third, attribution decays in a different way at each portal, but it always decays.** Off-site links that rot (Poki), unlinked plain text (CrazyGames), author accounts that take their submissions with them when deleted (Newgrounds), and uploader-email-as-provenance (`softwarelibrary@textfiles.com`) at the Archive.

**Fourth, single points of failure.** Stream-only rights posture plus one organization's uptime (Archive, October 2024). One company's ad economics (Poki, CrazyGames). One community's voting mood (Newgrounds). One acquirer's indifference (Kongregate). There is no portal in this set where a game's continued playability does not depend on exactly one party continuing to care.

**Fifth, the preservation-quality/experience-quality tradeoff is currently absolute.** The site with real metadata, real dates, real provenance and decade-stable URLs (Archive) has muted sound, stale docs, no mobile, no saves and no curation. The sites with polish (Poki, CrazyGames) have rolling ratings, cookie saves, unlinked authors, and no stated position on what happens when a game dies. **Nobody has built the portal that is both.** That gap is the memo's opening.

## Confidence summary
- **High, first-hand verified:** Poki homepage/game-page/FAQ content and exact quotes; CrazyGames homepage/game-page structure and all developer-doc ad and account rules; Internet Arcade and Flash library item counts, item metadata, `access-restricted-item: true`, embed page, help-page limitations, Ruffle caveats, the exact removed-item error string; itch.io filter/sort inventory; archive.org `/details/` pages being JS shells; CrazyGames `/developer/tall-team` 404.
- **Medium, secondary:** Newgrounds' entire six-flow account (site never fetchable); Newgrounds ad-free-since-2023 and Supporter pricing; Under Judgment thresholds and Obituaries; Ruffle coverage claims; Poki and CrazyGames user complaints about ads and lost progress; October 2024 Archive outage/breach; 2024 Copyright Office exemption denial.
- **Low / explicitly unverified:** Poki's "no pre-roll ads" claim; all runtime behavior anywhere (actual ad delivery, latency, mobile play, offline); link-preview card behavior on any portal; Kongregate's 2026 playability; whether Internet Archive emulated games have been removed by publisher request.
