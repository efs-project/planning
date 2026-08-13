# Recovered Claude memo — Six-flow UX: HN Arcade, js13k, itch

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:26:24.263Z
**Claude task:** `a60ae8bde3f275038`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3400
**Original result length:** 23308 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Findings below.

---

# Visitor-experience audit: three web-game showcases
**Checked 2026-08-12 (local) / 2026-08-13 UTC.** All evidence from direct HTTP fetches of pages, headers, sitemaps, data payloads, and client JS bundles.

## Limits of evidence (read first)
- **I did not execute JavaScript and did not drive a real browser.** No frames were rendered, no game was actually played.
- Consequently: HTTP 200 + a non-trivial HTML body + zero external asset references is *strong evidence a game still loads*. It is **not** proof it renders, accepts input, or plays correctly in a 2026 browser. I flag this everywhere it matters.
- Claims about what a JS-rendered gallery *displays* are bounded by what's in the data payload the client fetches — I read those payloads, which constrains what the UI can possibly show.
- I hit one **HTTP 429 from itch.io** during rapid automated fetching. That is a bot-rate-limit artifact of my method, not something a human visitor would normally trigger. Not counted as a failure.

---

# (a) "Hacker News Arcade"

## Existence verdict: REAL, but the name is not what you said — and a near-identical competitor is already dead

**VERIFIED (high):** There is no thing called "Hacker News Arcade." There *is* **The HN Arcade** at **https://hnarcade.com/** — live, HTTP 200, checked 2026-08-12.

- Origin: `Show HN: The HN Arcade`, https://news.ycombinator.com/item?id=46793693, by user **yuppiepuppie**, **352 points, 123 comments**, posted ~6 months before today (≈Feb 2026).
- The Show HN submitted **https://andrewgy8.github.io/hnarcade/**. That URL now **301s to hnarcade.com** (verified: `-L` resolves to `https://hnarcade.com/`, HTTP 200). Link durability across the domain move: good.
- Source: https://github.com/andrewgy8/hnarcade. Built on **Docusaurus v3.9.2** (`<meta name="generator">`).
- Operator: one person, "AGY" / Andrew Graham-Yooll (https://andrew.grahamyooll.com).

**VERIFIED (high) — the adversarial data point:** the *other* HN games directory that search engines still surface, **hackernews.games** (advertised as a "curated catalog of 528 games"), **no longer resolves. NXDOMAIN as of 2026-08-12** (`dig` → NXDOMAIN; `curl` → "Could not resolve host"). A community game directory of the same shape as HN Arcade has already fully evaporated, while still ranking in search. This is the single strongest piece of evidence in the whole audit about the durability of operator-owned game directories.

## Per-flow

**1. DISCOVER — thin, and the front door is empty**
- (VERIFIED, high) Front page https://hnarcade.com/ shows **zero games**. Total visible text is: "The HN Arcade / Discover games from Hacker News / Browse Games / Submit a Game." No featured game, no thumbnail, no ranking, no "new this week."
- (VERIFIED, high) The actual directory is one page: https://hnarcade.com/games/category/games — **~204 games** (205 `/games/` hrefs incl. the category link itself).
- (VERIFIED, high) Controls: tag filter over 16 tags (`ai-friendly, arcade, archive, browser, desktop, free, mobile, multiplayer, open-source, paid, platformer, puzzle, rpg, sandbox, simulation, strategy`) and **Sort by: Default / Most Recent / HN Ranking / A-Z**. Algolia DocSearch is wired in (`docsearch`, `searchBar` in markup).
- (VERIFIED, high) No editorial curation beyond a human PR merge. Per https://hnarcade.com/games/how-it-works: "A scraper runs every 12 hours and searches Hacker News for new **Show HN** game posts using the Algolia API," auto-generates a PR, "A human reviews the PR to make sure everything looks good."

**2. UNDERSTAND — the metadata actively misleads on age**
- (VERIFIED, high) A game page (https://hnarcade.com/games/games/sandspiel) shows: title, **Author**, **Play** (external link), **HN Thread** link, **HN Points** (1323), **Date Added**, **Tags**, and a hand/LLM-written About paragraph. One screenshot at `/img/games/sandspiel.png`.
- (VERIFIED, high) **The date field is "Date Added: 2026-01-28" — the date it entered the directory, not the date the game was made.** Sandspiel's own linked HN thread is `item?id=18696291`, which is **December 2018**. A visitor reading the page concludes the game is from January 2026. It is seven years older than that. This is a real, structural UNDERSTAND failure and it applies to every entry in the directory.
- (VERIFIED, high) Nothing on the page tells you whether the game **still works**. There is no last-checked timestamp, no health indicator. The "How It Works" page **says nothing about link checking or removing dead games** — I fetched it specifically to look.
- (VERIFIED, medium) Descriptions are partly LLM-generated: commenters on the Show HN questioned whether entries were LLM-written and "the author partially confirmed." Confidence medium because that's a summary of thread content, not a quote I re-read in full.

**3. LAUNCH — HN Arcade hosts nothing; "Play" is a bare outbound link**
- (VERIFIED, high) "Play" is an external hyperlink to a third-party site (sandspiel.club, lichess.org, holedown.com, …). No embed, no iframe, no player. HN Arcade never touches the game.
- Consequence (INFERRED, high): account/download/payment/permission requirements are **entirely whatever the destination imposes**, and HN Arcade neither knows nor discloses them.

**4. PLAY — out of scope for the operator.** Nothing to report; the visitor is on someone else's site.

**5. RETURN — the directory URLs are the best part**
- (VERIFIED, high) Clean, stable, human-readable: `hnarcade.com/games/games/<slug>`. Static Docusaurus output. The old GitHub Pages origin 301s correctly. No favorites/history feature (no accounts).

**6. SHARE — links work, preview cards are half-broken**
- (VERIFIED, high) Per-page `og:title` ("Sandspiel | The HN Arcade"), `og:description`, `og:url` are present and correct.
- (VERIFIED, high) **`twitter:card` is set to `summary_large_image` but there is no `og:image` on the game page.** The page has a screenshot at `/img/games/sandspiel.png` but never declares it as the share image. Every shared HN Arcade link renders a large-image card **with no image**.

## WHERE HN ARCADE FAILS A VISITOR
1. **~5% of "Play" links are already dead, and 15–20% don't lead to a playable browser game at all.** I resolved and HTTP-checked 20 sampled entries (VERIFIED, high):
   - `time-pin` → https://www.crazygames.com/game/time-pin → **HTTP 404**. Dead.
   - `bugdom` → **no Play URL at all**; the page body renders essentially empty (extracted visible text: `|`). A blank entry in the directory.
   - `circuit-artist` → a **Steam store page** for a paid desktop game.
   - `cursor-party` → a **GitHub repo**.
   - `hedra` → a **GitHub repo**.
   - `wordtrak` → a **blog post** (`/blog/2026-05-05-I-built-a-new-word-game`), not the game.
   The button says "Play." Six of twenty do not produce play.
2. **No link-rot process exists.** Confirmed by absence in the operator's own How It Works page. At a ~5%-dead rate after ~6 months, with a 12-hour scraper adding entries and nothing ever pruning, decay is monotonic.
3. **Every entry misreports the game's age** (Date Added presented as the date).
4. **Screenshot coverage is incomplete**: 7 of 9 sampled entries had a screenshot; `wolfers` and `bugdom` had zero.
5. **Broken share cards** (large-image card, no image).
6. **Single-maintainer, single-domain single point of failure** — and the directly comparable prior art (hackernews.games) is already NXDOMAIN.

---

# (b) js13kGames — https://js13kgames.com/

**The most durable of the three by a wide margin, with one severe self-inflicted wound.**

## Per-flow

**1. DISCOVER — the front door may currently be an empty room**
- (VERIFIED, high) Sitemap: **2,757 URLs, 2,482 of them games**, across **15 year archives 2012–2026**. Per-year counts I confirmed: 2012 → 62, 2015 → 160, 2019 → 245, 2025 → 197.
- (VERIFIED, high) `https://js13kgames.com/2026.js` returns **0 bytes**. The 2026 competition has no entries yet (js13k opens ~Aug 13; I checked Aug 12/13).
- (INFERRED, medium-high) `js13kgames.com/` is the 2026 edition (`<title>js13kGames 2026`, modulepreload `/2026/home.js`, preload `/2026.js`). With an empty 2026 dataset, **a first-time visitor arriving today at the front page sees no games** and must know to navigate to a past year. Medium-high rather than high because I could not render the page.
- (VERIFIED, high) Browse metadata is minimal by construction. The year payload is a compact binary format containing only **name + author + a one-byte category flag** per entry — e.g. `2025.js` (6,042 bytes for 197 games) decodes as `\x01\rCat Hop Cloud\x0fHélio Medeiros\x01\x05Catto\x07chewear…`. There is no description, tag, or rating field in the data, so the gallery cannot be showing any.

**2. UNDERSTAND — good identity, no health signal**
- (VERIFIED, high) Game pages carry correct per-game head metadata. https://js13kgames.com/2012/games/earth-destroyer serves `<title>Earth Destroyer | js13kGames 2012`, `og:title=Earth Destroyer`, `og:image=https://play.js13kgames.com/earth-destroyer/.c.jpg`. Year provenance is explicit and baked into the URL.
- (VERIFIED, high) **Legitimacy is structurally strong**: the 13KB limit means entries are self-contained. I downloaded five games spanning 2012–2019 and grepped for any external host reference: `earth-destroyer`, `catch13`, `gravity-control`, `desrever`, `backout` — **zero external `http(s)://` references in all five**. Nothing to rot, no third-party CDN, no tracker, no mixed content.
- No "does it still work" indicator anywhere.

**3. LAUNCH — instant on desktop; on mobile it ejects you**
- (VERIFIED, high) No account, no download, no plugin, no payment.
- (VERIFIED, high, from the app bundle) Clicking play creates an iframe: `_D.createElement("iframe"); y.id="play"; y.src=<play URL>`.
- (VERIFIED, high) **On small viewports the site gives up and dumps you off-site.** The handler reads: `if(a(l)<720||N<540) return open(v,"_blank").focus();` — below ~720px wide or ~540px tall, it opens the raw `play.js13kgames.com/<slug>/` URL in a new tab instead of embedding. The mobile visitor leaves js13kgames.com and lands on a bare game with no title, author, back-link, or context.

**4. PLAY — separate origin, but a startlingly permissive permission grant**
- (VERIFIED, high) Games are served from a distinct origin, **`play.js13kgames.com/<slug>/`** — good origin isolation from the main site.
- (VERIFIED, high) **The play iframe has NO `sandbox` attribute.** I grepped all five app JS chunks for `sandbox`: **0 matches** in every file.
- (VERIFIED, high) It ships a maximal permissions-policy delegation instead: `allow="accelerometer;autoplay;camera;display-capture;fullscreen;gamepad;geolocation;gyroscope;magnetometer;microphone;midi;picture-in-picture;usb;web-share;xr-spatial-tracking"`. A 13KB jam entry from 2013 is handed delegated authority to request **camera, microphone, geolocation, screen capture, USB, and MIDI**. Browsers still prompt the user, so this is a permission-prompt exposure rather than silent access — but a visitor can be prompted for their webcam by a game jam entry.
- (VERIFIED, high) Play pages set `content-security-policy: frame-ancestors 'self' https://js13kgames.com` and `cache-control: max-age=31536000`. Nobody but js13kgames.com can embed the games.
- Save state and controls: **not verifiable without executing the games.** No claim made.

**5. RETURN — the strongest result in this whole audit**
- (VERIFIED, high) **The redesign preserved old URLs via server-side redirects.** `https://js13kgames.com/entries/underrun` returns `HTTP/2 301, location: /games/underrun` (raw header verified). The legacy `/entries/<slug>` scheme still lands.
- (VERIFIED, high) Both `/games/<slug>` and `/<year>/games/<slug>` resolve.
- (VERIFIED, high) **Old games still return live content today.** All eight I fetched are HTTP 200 with real HTML bodies:

  | slug | year | bytes |
  |---|---|---|
  | earth-destroyer | 2012 | 21,805 |
  | catch13 | 2012 | 1,828 |
  | gravity-control | 2015 | 641 |
  | desrever | 2015 | 51,594 |
  | underrun | 2018 | 17,371 |
  | backout | 2019 | 336 |
  | meadow | 2019 | 380 |
  | spacebar-clicker | 2025 | 18,152 |

  Combined with the zero-external-reference finding, a **14-year-old entry is served intact with no dependencies**. I cannot confirm it *renders and plays* without a browser — but there is nothing present that could have rotted.

**6. SHARE — correct cards, but embedding is forbidden**
- (VERIFIED, high) Per-game `og:title` / `og:image` / `twitter:card=summary_large_image` are all correct. Shared game links preview properly.
- (VERIFIED, high) `frame-ancestors 'self' https://js13kgames.com` means **no third party can embed a js13k game.** You can share a link; you cannot put the game in your blog post or your own arcade.

## WHERE js13kGames FAILS A VISITOR
1. **The entire site is a JS-only SPA that server-renders zero content.** `js13kgames.com/`, `/games`, `/2012/games`, `/2015/games`, `/2019/games` **all return the identical 23,978-byte shell**. Stripping tags from the homepage yields exactly one string: `"js13kGames 2026"`. The 2012 game page yields exactly `"Earth Destroyer | js13kGames 2012"`. With JS off, broken, or slow, **2,482 games are invisible.** Head metadata is correctly per-page, so crawlers and share cards survive — the *human* with a degraded browser does not.
2. **Mobile visitors get thrown off the site** into a context-free raw game URL (<720px wide or <540px tall).
3. **No `sandbox` on the play iframe, plus a 15-feature `allow` grant** including camera/microphone/display-capture/USB to arbitrary jam code.
4. **Third-party embedding is blocked** by frame-ancestors — the games are shareable-by-link only, never portable.
5. **Metadata is name + author only.** No descriptions or tags exist in the data payload, so browsing 2,482 games offers almost nothing to choose on.
6. **Front page likely shows an empty gallery** during the pre-competition window (2026.js = 0 bytes).

---

# (c) itch.io — HTML5 games

## Per-flow

**1. DISCOVER — by far the richest, and it works without JS**
- (VERIFIED, high) https://itch.io/games/html5 is **server-rendered** (90,162 bytes of real HTML; `<title>Top HTML5 games - itch.io`). Filters, cards, and pagination are all in the initial response.
- (VERIFIED, high) Filter facets are clean shareable URLs: `/games/html5/platform-web`, `/games/html5/input-touchscreen`, `/games/html5/input-gamepad`, `/games/html5/in-jam`, and ~25 input facets alone (down to `input-dance-pad`, `input-light-gun`, `input-eye-tracker`).
- (VERIFIED, high) Facet dimensions: Platform, Price, Timing (last day/7/30), Genre (18+), Input (20+), Session Length, Multiplayer, Accessibility. Sorts: Popular / New & Popular / Top sellers / Top rated / Most Recent.
- (VERIFIED, high) Pagination via `?page=2` — a plain, linkable URL, no infinite-scroll trap.
- (VERIFIED, high) **No login wall to browse.** The 90KB browse page contains exactly one "Log in" and one "Register" occurrence (the site header), not a gate.
- (VERIFIED, medium) **"HTML5" ≠ browser-playable.** `/games/html5` is a made-with/tech tag; browser-playability requires the separate `platform-web` facet. The page carried 37 "Play in browser" strings against ~43 game URLs, so the listing is mixed. Medium confidence on the exact ratio.

**2. UNDERSTAND — the best game page of the three**
- (VERIFIED, high) https://khydra98.itch.io/pokepath renders a "More information" table: **Updated** ("10 hours ago"), **Status** ("Released"), **Platforms** (HTML5, Windows, macOS, Linux), **Rating** ("Rated 4.7 out of 5 stars (735 total ratings)"), **Author**, **Genre**, **Made with**, **Tags**, **Average session**, **Inputs**. Plus a Report link and description.
- **Recency, author identity, and social proof are all present and legible** — the three things HN Arcade and js13k both lack.

**3. LAUNCH — one extra click, no account, mobile handled**
- (VERIFIED, high) **Default is click-to-play.** Both pages I loaded fully (`pokepath`, `ex-libris`) ship an `iframe_placeholder` with a `load_iframe_btn` labeled **"Run game"**; the real `<iframe>` markup sits inert in a `data-iframe` attribute until clicked. Per https://itch.io/docs/creators/html5, this exists so the game "doesn't slow the viewer's browser when the itch.io page initially loads."
- (VERIFIED, high) Devs can disable it. https://ninja-muffin24.itch.io/funkin ships a live `<iframe id="game_drop">` with `class="game_frame game_loaded"` — auto-loaded.
- (VERIFIED, high) No account required to play. No download, no plugin. `Download Now` and `/purchase` are present but parallel to browser play, not gating it.
- (VERIFIED, high, from docs) Mobile: "When your itch.io page is loaded on a mobile device, it will use *Click to launch in fullscreen* mode regardless of how you've configured your embed for desktop."

**4. PLAY — the most consequential technical finding in this audit**
- (VERIFIED, high) **Every itch HTML5 game is served from one shared origin: `html-classic.itch.zone`.** Two unrelated games confirm it:
  - `https://html-classic.itch.zone/html/16944508-1877713/index.html` (Friday Night Funkin')
  - `https://html-classic.itch.zone/html/15902423/PokePath TD WEB/index.html` (PokéPath TD — note the **unencoded space** in the path)
- (INFERRED, high) Because localStorage/IndexedDB are **origin-scoped, not path-scoped**, all itch browser games share a single storage namespace. Save-key collisions between unrelated games are a structural property of this design, and a visitor clearing site data for one game clears it for all of them. High confidence as browser semantics; I did not execute the games to observe a collision.
- (VERIFIED, high) **No `sandbox` attribute** on itch's iframe either. Its allow list: `autoplay; fullscreen *; geolocation; microphone; camera; midi; monetization; xr-spatial-tracking; gamepad; gyroscope; accelerometer; xr; cross-origin-isolated; web-share`.
- (VERIFIED, high) A `fullscreen_btn` is provided alongside the frame.
- (VERIFIED, high) itch injects `<script defer src="https://static.itch.io/htmlgame.js">` into every hosted game.
- (VERIFIED, high) Upload IDs are opaque and version-bound (`15902423`, `16944508-1877713`) and change per build.

**5. RETURN — excellent while the dev cooperates**
- (VERIFIED, high) `https://<user>.itch.io/<slug>` is clean, stable, human-readable, and survives re-uploads (the volatile numeric ID lives only in the inner embed).
- Collections/favorites exist but require an account (not tested logged-in).

**6. SHARE — good cards, and the game is hot-linkable in a way itch didn't intend**
- (VERIFIED, high) Rich cards: `og:image`, `og:site_name`, `og:description`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:creator=@ninja_muffin99`, `twitter:url`. **But `og:title` is absent** — only `<title>` and `twitter:title` carry the name. Scrapers that read only `og:` will show a titleless card.
- (VERIFIED, high) **`html-classic.itch.zone` sends NO `X-Frame-Options` and NO `Content-Security-Policy`.** I checked the headers directly. Meanwhile `itch.io/games/html5` *does* send `x-frame-options: SAMEORIGIN`. So the storefront is protected and **the games are not**.
- (VERIFIED, high) The direct embed URL **loads standalone**: fetching `https://html-classic.itch.zone/html/15902423/PokePath%20TD%20WEB/index.html` returns the game's real `<!DOCTYPE html>` document, HTTP 200. **Anyone can iframe or deep-link an itch-hosted game, stripping the itch page, the developer's donate button, the ratings, and the attribution.** This is the exact inverse of js13k's `frame-ancestors` lock.

## WHERE ITCH.IO FAILS A VISITOR
1. **Deletion produces hard 404s and silent holes.** (VERIFIED, high, for the 404 mechanics: a missing project → `HTTP 404` at `https://ninja-muffin24.itch.io/this-game-does-not-exist-9999`; a missing user → `HTTP 404` at `https://zzz-no-such-user-9999.itch.io/foo`. Both terminal, no redirect, no tombstone.) Per itch.io's own community threads (MEDIUM confidence — operator-forum reports, not official docs): deleting a project means "everything related to it is gone forever"; the game "will be removed from all collections it is on"; ratings do not carry over; re-creating the project at the same URL yields "a new ID and will not replace the old one in collections," so it "silently disappear[s] from collections, leaving a hole in them." **Your saved collection quietly shrinks and never tells you.**
2. **Every browser game shares one storage origin** (`html-classic.itch.zone`) — save state is not isolated per game.
3. **Games are freely hot-linkable and embeddable by anyone** (no XFO, no CSP on the game origin), bypassing the developer's page entirely.
4. **No `sandbox`**, and camera/microphone/geolocation/MIDI are delegated to arbitrary uploaded code.
5. **`og:title` missing** on game pages.
6. **"HTML5" browse ≠ playable browse** — a visitor clicking the obvious entry point gets a mixed list and must find the `platform-web` facet.
7. **Continuity depends on one commercial operator.** Nothing in the URL, the embed, or the page is portable if itch changes policy or a dev pulls a project.

---

# Cross-cutting summary

| | HN Arcade | js13kGames | itch.io |
|---|---|---|---|
| Hosts the game? | **No** — outbound links only | Yes (`play.js13kgames.com`) | Yes (`html-classic.itch.zone`) |
| Content without JS | Full (static Docusaurus) | **None** — 2,482 games invisible | Full (server-rendered) |
| Old URLs survive redesign | Yes (GH Pages → 301) | **Yes (`/entries/` → 301)** | Yes (never changed) |
| Old games still load | **~5% already 404** | 8/8 tested, 2012–2025, HTTP 200 | Only while the dev keeps them up |
| External dependencies in games | N/A | **Zero** (13KB limit forces self-containment) | Unbounded |
| iframe `sandbox` | N/A | **None** | **None** |
| Third-party embed | N/A | **Blocked** (`frame-ancestors`) | **Wide open** (no XFO/CSP) |
| Share card | Card declared, **image missing** | Correct | Correct except **no `og:title`** |
| Per-game save isolation | N/A | Per-origin, one shared origin (`play.js13kgames.com`) | **One shared origin for all games** |
| Single point of failure | One person, one domain — **direct peer already NXDOMAIN** | One org, one domain | One company |

**The three sharpest evidence-backed points for an adversarial memo:**
1. **hackernews.games is NXDOMAIN today** while still ranking in search results. The community-directory model demonstrably evaporates, taking every link with it.
2. **js13kGames proves durability is a function of self-containment, not of the operator.** Zero external references in 2012-era entries is why they still serve intact 14 years later — but the operator then wrapped that durable content in a JS-only shell that renders nothing without scripts, and locked it behind `frame-ancestors` so nobody can carry it anywhere else.
3. **Neither surviving player sandboxes its games**, and both delegate camera/microphone/geolocation to arbitrary third-party code — js13k additionally grants `display-capture` and `usb`.
