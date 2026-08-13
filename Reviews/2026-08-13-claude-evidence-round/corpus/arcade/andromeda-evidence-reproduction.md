# Recovered Claude memo — Andromeda evidence reproduction

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:31:39.358Z
**Claude task:** `a117ae51d1ad0e2cb`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3470
**Original result length:** 21334 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
## Memo — Andromeda Invaders: independent verification for the EFS Arcade slice
**Date of checks:** 2026-08-12 (all network probes run today, 2026-08-13 UTC). Auditor: verification agent. No edits made anywhere under `EFS_WORKSPACE` (planning worktree was clean at start and at finish); all fetching, cloning and the runtime harness were confined to the scratchpad.

### Bottom line

**The artifact itself is in unusually good shape — probably the cleanest candidate this project has looked at — and the residual risk is not technical.** Published bytes are reproducible with no build step, the file is fully self-contained (zero external requests, zero storage), it runs inside the exact `sandbox="allow-scripts"` opaque-origin frame the Arcade plans to use, it is MIT, and two genuinely independent archives already hold the exact bytes.

Four things are unresolved, none of which I can rule on:

1. **Font glyph provenance** — the only third-party asset in the artifact. Susam's README credits a CC0 raster font that is itself extracted from IBM/Verite ROM fonts. The CC0 claim is downstream of an ambiguous chain. **OWNER-OR-COUNSEL.**
2. **Custody is one operator, four times over.** Every live locator (susam.net, susam.github.io, susam.codeberg.page, npm) is Susam Pal's. There is no independent serving custody today.
3. **"Version 0.9.0" maps to two different byte sequences.** The web-published file and the npm/tag 0.9.0 artifact are not the same bytes. An exact Project/Release/ArtifactManifest identity must pin the digest, not the version string.
4. **MIT notice completeness if you ship `invaders.html` alone** — that file carries the copyright line and the words "Licence: MIT" but *not* the permission notice text. **OWNER-OR-COUNSEL** (with an obvious cheap mitigation).

The trademark pass that the project's own policy requires (`rights-safety-and-operations.md` §2.3, ledger item U7) has **not** been run for this title. That is a MISSING gate, not a finding against the game.

---

## Step 1 — What the vault actually claims today

Searched `planning/` exhaustively (`Designs/`, `Reviews/`, `Brainstorms/`, `Daily Notes/`, Kanban, Open-Decisions) plus the sibling repos. **The claims are far thinner than the audit brief implies.** Andromeda appears in exactly six tracked files, and only two sentences are substantive:

- `EFS_WORKSPACE/planning/Designs/arcade/README.md:15` — "The current slice is one mobile-capable, rights-clean game (Andromeda Invaders)".
- `EFS_WORKSPACE/planning/Designs/arcade/README.md:43` — "…show the working artifact to Susam Pal and the HN Arcade operator."
- `EFS_WORKSPACE/planning/Kanban.md:10` — "Current slice: Andromeda Invaders; … exact Project/Release/ArtifactManifest identity; strict verified locator fallback; a versioned runner policy; and no durable chain write…"
- Correction banners only: `Designs/README.md:65`, `Open-Decisions.md:20`, `Designs/arcade/{owner-decision-inbox,unknowns-and-experiments,mvp-architecture}.md`.

**There is no upstream repo, revision, digest, size, license analysis, locator list, or build story recorded anywhere in the vault.** The 2026-08-07 corpus (`Reviews/2026-08-07-arcade-corpus/`) never evaluated this game — it graded a different candidate set (Norman, js13k medalists, the existing 15). Andromeda entered by direction on ~2026-08-08 and replaced Norman without an evidence pass. So the honest framing: **"mobile-capable, rights-clean" is currently an unevidenced assertion in the vault** — this memo is the first evidence behind it, and it largely holds up.

The relevant bar to judge against is the project's own: `Designs/arcade/rights-safety-and-operations.md` §1.2 "complete-artifact rule" (code, art, audio, fonts, level data, vendored deps each verified separately), §1.3 bright lines, §2 trademark, and the external-network rule at §98.

---

## Step 2 — Independent verification, from primary sources

### Canonical upstream

- **VERIFIED** — Upstream is `susam/invaders`, present identically at `https://codeberg.org/susam/invaders` and `https://github.com/susam/invaders`. Both are at the same HEAD: `a8830218e7a9034ac7d671f436abd4d6e30e8066` ("Use Codeberg links for project artefacts", 2026-04-09, Susam Pal `<susam@susam.net>`). Commit is **unsigned** (GitHub verification: `unsigned`) — there is no cryptographic authorship proof anywhere in this chain.
- **VERIFIED** — **Codeberg is origin, GitHub is a pushed mirror.** The repo's own `Makefile` `push` target sets `origin` to the Codeberg URL and pushes `cb` then `gh`. Treat Codeberg as canonical and GitHub as a co-equal replica by the same hand.
- **VERIFIED** — Latest tag/release is `0.9.0` (2023-12-20); HEAD is 3 commits past it. GitHub releases carry **no binary assets** after 0.3.0 — only auto-generated source tarballs.

### Exact published bytes

- **VERIFIED** — `https://susam.net/invaders.html` (the README's "current stable version"):
  - size **45,248 bytes**, `Content-Type: text/html`, `Last-Modified: Fri, 05 Jun 2026 02:55:20 GMT`
  - **sha256 `61916fb06fa0dd710325dbe291cb01b4f186e81a4c91feb48b28b6acfff84418`**
  - git blob sha1 `d64cf669b4ca9e798935fcd5f54ee23181c41f9a`
  - CIDv1 (raw, sha2-256) `bafkreidbsfx3a35a3vyqgjo34ki4wanu6gdoqgsmsh7ljcziw2wp76ceda` (computed locally, not published anywhere)
- **VERIFIED** — `susam.github.io/invaders.html` and `susam.codeberg.page/invaders.html` return **byte-identical** files (same sha256).
- **VERIFIED** — The published file is **byte-identical to `invaders.html` at repo HEAD**. `diff` clean; `git hash-object` on the downloaded file reproduces the tracked blob hash.
- **VERIFIED — identity hazard.** The npm package `invaders@0.9.0` ships a **different** `invaders.html`: sha256 `52d7156768026cad5c72e37b6cd831fff8f1a4569e4d7658acc904da74ea62fb`. The tag `0.9.0` predates three cosmetic commits (British spellings, header wording) that are in the web-published file. Additionally the in-file header says `0.9.0` while the in-game info screen constant is `VERSION = '0.8.0'` — an upstream bug. **One version label, three artifacts.**

### Build or no-build provenance

- **VERIFIED — no build.** `invaders.html` is hand-authored source and is itself the shipped artifact. The `Makefile` only lints (`tidy`, `npm run lint` → `standard --plugin html`), copies the file into the author's site tree, and pushes to the two forges. `package.json` has **no runtime dependencies**; devDeps are `standard` + `eslint-plugin-html` only.
- **VERIFIED — reproduction is trivial and I performed it:** `curl` the published URL, `git clone` either forge, `cmp`. Identical. There is no toolchain to reproduce, no minifier, no bundler, no transpile step. This is the strongest provenance story available short of signed releases.

### Complete closure — asset by asset (the §1.2 test)

| Asset class | Finding | Label |
|---|---|---|
| Code | Single file, all original, MIT header in-file (`Copyright (c) 2022-2023 Susam Pal`, `Licence: MIT`) | **VERIFIED** |
| Art / sprites | **No image assets at all.** Every visual is `fillRect` calls on `<canvas>`. Zero `data:` URIs (grep count: 0), zero image files in the repo | **VERIFIED** |
| Audio | **No audio files.** All sound is `OscillatorNode` sine waves through a `DynamicsCompressor`, C-major chords generated in code | **VERIFIED** |
| Fonts | **No font files, no `@font-face`, no webfont.** Text is drawn from a hardcoded `FONTMAP` of 8×16 bitmap integer arrays. README credits **Modern DOS 8x16 v20190101.02 by Jayvee Enaguas, stated CC0 1.0**, itself "based on the IBM VGA 8x16 and Verite 8x16 OEM fonts" | **CLAIMED**, see below |
| Level data | None — levels are parametric (formula-driven), no third-party level packs (contrast with the corpus's sokoban flag) | **VERIFIED** |
| Vendored deps | None | **VERIFIED** |
| Repo license file | `LICENSE.md` = verbatim MIT, `Copyright (c) 2022-2023 Susam Pal`. GitHub API license endpoint: `mit` | **VERIFIED** |

**The font is the one open link, and it is a real one.** Primary-source checks:
- dafont's page for Modern DOS lists the license category as **"Public domain / GPL / OFL"** (a coarse dafont bucket, *not* a CC0 statement) and describes the font as "extracted from ROM fonts part of various computers". I could not reach Enaguas's own distribution to read his license text directly (GitLab returned 403; web-search budget for this session was exhausted). **Susam's specific "CC0 1.0" attribution is CLAIMED, corroborated only at the category level.**
- The upstream-of-upstream position is documented by int10h (VileR), whose oldschool-PC-font project Susam links: he claims **no rights to the original raster data**, states that US law does not treat typefaces as copyrightable, and licenses **his own remakes CC BY-SA 4.0**. So the chain terminates in either (a) uncopyrightable ROM glyph data, or (b) a CC BY-SA remake if Enaguas derived from int10h rather than from ROMs. **Which branch applies is unresolved.**
- Practical scale: roughly 40 glyphs of 8×16 bitmap data, redrawable from scratch in an hour if the owner wants the question gone. **OWNER-OR-COUNSEL** — I am flagging, not ruling.

**Second rights item, concrete and cheap:** `invaders.html` alone carries the copyright notice and the string "Licence: MIT" but **not the MIT permission notice text**. MIT conditions redistribution on including "the above copyright notice **and this permission notice**". If the Arcade seeds only the single HTML file, that condition is arguably unmet. Mitigation is obvious (include `LICENSE.md` in the ArtifactManifest closure) but the call is the owner's. **OWNER-OR-COUNSEL.**

**Third item — homage, not clone.** README states plainly: "inspired by Space Invaders, the 1978 arcade game developed by Tomohiro Nishikado. However, the game characters, gameplay and some technical aspects … are very different." My own play-testing corroborates the distinctness: the player is a green trapezoid, enemies are orange lozenge-shaped ships (not Taito's crab/squid/octopus), projectiles are falling "boulders", there are no bunkers, and mechanics differ substantially (three-grade health, ship descent/collision, regeneration, 1000 levels). This is materially unlike the *Tetris Holding v. Xio* look-and-feel fact pattern the corpus cites. **Evidence supports low similarity risk; the legal conclusion is counsel's.** The name check the project's own policy mandates (USPTO pass on the shipped name) is **MISSING**.

### Runtime dependencies and outbound network

- **VERIFIED** — Static analysis: the only external URL anywhere in the file is the string constant `SOURCE_URL = 'https://github.com/susam/invaders'`. No `<script src>`, no `<link>`, no `@import`, no `url()`, no `fetch`, no `XMLHttpRequest`, no WebSocket, no service worker, no CDN, no analytics.
- **VERIFIED** — Runtime: I ran it locally for ~70 seconds of autoplay through the Claude browser and recorded **zero outbound requests** and **zero console messages** (errors or warnings). It satisfies the Arcade's §98 "no external requests" bar without a label.
- **VERIFIED** — No `localStorage`, `sessionStorage`, `indexedDB`, or `document.cookie`. Nothing persists; nothing breaks in an opaque origin. No high-score storage to lose.
- **VERIFIED (behavioral flag)** — Two host-affecting APIs exist: `canvas.requestFullscreen()` (bound to `f`), and, on the info screen, `window.location = SOURCE_URL` when the user clicks the displayed URL line. **The game will try to navigate its own frame to github.com.** In a sandboxed frame without `allow="fullscreen"`, fullscreen will silently fail; the self-navigation needs an explicit decision in the versioned runner policy — allow it, block it via frame CSP, or fork the line out (which makes the Arcade a §3 "modifier" with provenance duties).

### Touch / mobile

- **VERIFIED** — Explicit touch support: `touchstart`/`touchend` handlers on five on-screen buttons (←, →, ↵, ▶/■, ♪), plus `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">`.
- **VERIFIED** — Rendered at 375×812 with mobile UA and touch emulation: canvas fits the width, buttons are large touch targets (~160×60 CSS px, two rows), game ran cleanly, no console errors. **Honest caveat:** in portrait, the canvas occupies only the top third and the lower ~45% of the viewport is dead space. The author's own framing is "rudimentary support … best enjoyed on a laptop/desktop with a physical keyboard". "Mobile-capable" is fair; "mobile-first" would not be.

### Iframe and browser-tuple compatibility

- **VERIFIED** — **Runs inside `sandbox="allow-scripts"` srcdoc at an opaque origin.** I built that exact harness in the scratchpad and watched autoplay reach level 4 / 1,600+ points with no errors. This directly answers ledger item **U5** for this title.
- **VERIFIED** — Code is conservative: no arrow functions, no classes, no optional chaining; `webkitAudioContext` fallback present; `setTimeout`-driven loop (not rAF) at 50 fps; `webkit`/`ms` fullscreen fallbacks. Broad-compat by construction.
- **MISSING** — I tested **one** browser tuple (Chromium-family desktop + emulated mobile). **No Safari/iOS WebKit or Firefox verification.** iOS Safari is the one worth a real device pass: Web Audio unlock behavior and the `user-scalable=no` viewport interact badly there more often than elsewhere.
- **Harness limitation, stated honestly:** this browser environment returned `net::ERR_BLOCKED_BY_CLIENT` for iframe `src` subresource loads, so (a) the `src`-based iframe test was invalid (the blank frame was the harness, not the game — the srcdoc test is the valid one), and (b) my probe of external navigation *out of* a sandboxed frame was **INCONCLUSIVE**: the frame blanked without a recorded github.com request. Do not read that as "the browser blocks it" — the code path is unambiguous and the runner should decide the policy explicitly.

### Locators and custody

- **VERIFIED — no independent serving custody exists today.** Every live locator is the same operator: `susam.net` (his nginx VPS), `susam.github.io` (his GitHub Pages), `susam.codeberg.page` (his Codeberg Pages), `registry.npmjs.org/invaders` (maintainer `susam`), plus both git remotes. One person's decision (or one lapsed domain) removes all of them.
- **VERIFIED — independent *archival* custody does exist, for the exact bytes:**
  - **Software Heritage** holds the exact blob: content `sha1_git:d64cf669…`, sha256 matches `61916fb0…4418` exactly; origin `https://github.com/susam/invaders` last visited 2026-05-07 (post-HEAD), revision `a8830218…` present. SWHIDs: `swh:1:cnt:d64cf669b4ca9e798935fcd5f54ee23181c41f9a`, `swh:1:rev:a8830218e7a9034ac7d671f436abd4d6e30e8066`.
  - **Internet Archive** holds the exact published page: capture `20260625163211` of `susam.net/invaders.html`, which gunzips to **exactly** sha256 `61916fb0…4418`. 54 captures on record.
  - 6 GitHub forks exist; the most recent (`Gamf/invaders`) is current with HEAD as of 2026-04-09.
- **VERIFIED — drift profile is low.** `invaders.html` has 45 commits lifetime but only **one** since the 0.9.0 tag of 2023-12-20 (2025-11-06, cosmetic spelling). Published bytes have been stable ~9 months; no release in ~20 months; repo not archived, author still active.

---

## Step 3 — Table-top scenarios

**A. Artifact corruption (a locator serves wrong bytes).**
Well covered *if* the runner is built as designed. The digest is stable and independently attested at two archives, so tamper detection is real and recovery is real: verify-before-execute rejects the bad copy, strict fallback moves to the next locator, and Software Heritage or the Wayback capture can re-supply the true bytes. **Residual risk:** every *live* locator is one operator, so a compromise of Susam's publishing pipeline could poison susam.net, both Pages hosts and both forges near-simultaneously — the archives, not the mirrors, are what actually save you. Pinning the digest in the manifest is what converts this from a scary scenario to a boring one; do that before any demo.

**B. Upstream drift (the source changes after publication).**
Low likelihood, low consequence, but it will *look* bad if unhandled. The realistic drift is exactly what already happened: a cosmetic commit that changes bytes without changing the version label. If the Arcade pins by digest, the pinned release keeps working and simply diverges from susam.net — at which point the catalog is showing "0.9.0" while upstream also shows "0.9.0" with different bytes. **This is already true today** (npm/tag vs. web). Mitigation is a manifest that records revision + digest + capture date and a UI that never claims to be "the current version" — call it "Release: main@a883021, 2026-04-09, sha256 6191…".

**C. Upstream disappearance.**
The best-case version of this scenario. Because there is no build and the artifact is one self-contained file, disappearance costs nothing operationally: the pinned bytes still run offline forever, and provenance remains independently checkable at Software Heritage (source, with SWHID) and the Internet Archive (the published page). Even the "prove it was really his" story survives, though only as archive testimony — **there is no signed release or signed commit anywhere in this chain**, so authorship rests on GitHub/Codeberg account control plus archive timestamps.

**D. A later rights objection (author or third party).**
Split the cases honestly:
- *From Susam Pal:* he cannot revoke MIT for bytes already distributed, but he can ask you to stop, and the EFS permanence property means you can only unlist, not delete. The reputational shape of that — "the preservation project that wouldn't take my game down" — is worse than the legal shape, and it lands with exactly the HN/preservationist audience this pilot is courting. Note also that MIT does not waive moral rights; the author appears UK-based (commit timezone +01:00), a jurisdiction with a paternity right. **Practical read: the §1.4 informed-permanence conversation is not legally required for a CR-class MIT work, but it is cheap and it is the difference between a supporter and an aggrieved author.** The README's plan to show him the working artifact first is the right instinct — and per your hard boundary, that outreach is not mine to initiate.
- *From a font-chain claimant:* the weakest and least likely vector, but it is the one asset you did not originate. Worst case is a demand to swap ~40 glyph bitmaps — hours of work, and only if you have already published.
- *From Taito or similar:* name and sprite evidence is favorable (distinct title, distinct characters, distinct mechanics, documented homage). The unrun USPTO pass is the gap, not the substance.
- *Structural point that matters more than any of the above:* the first three scenarios are recoverable; scenario D is the only one where publication is irreversible. That asymmetry argues for running the two cheap gates (name pass, owner ruling on the font chain) **before** the first durable write — which the current "no durable chain write" posture already gives you room to do.

---

## Recommendations (separated from the evidence above; none of these are decisions I made)

1. **Safe to build the demo slice on — yes, with the durable-write hold kept in place.** Nothing I found argues against implementing intake/play against this artifact today.
2. **Pin identity by digest, not version.** Record: `codeberg.org/susam/invaders` @ `a8830218e7a9034ac7d671f436abd4d6e30e8066`, `invaders.html`, 45,248 bytes, sha256 `61916fb0…4418`, blob `d64cf669…`, CIDv1 `bafkreidbsfx3a35a3vyqgjo34ki4wanu6gdoqgsmsh7ljcziw2wp76ceda`, plus the two SWHIDs and the Wayback capture id. Note in the manifest that npm 0.9.0 is a *different* artifact.
3. **Put `LICENSE.md` inside the artifact closure**, not just `invaders.html` (addresses the permission-notice gap without a fork).
4. **Runner policy needs two explicit lines** before demo: fullscreen (grant `allow="fullscreen"` or accept silent failure) and the info-screen self-navigation to github.com (allow / CSP-block / fork out — forking triggers §3 modifier duties).
5. **Two owner/counsel items to route:** the font-chain CC0 question, and whether shipping the file alone satisfies MIT. Both are flags, not blockers to local implementation.
6. **Two cheap gates before any durable write:** the USPTO name pass your own §2.3 requires, and one real iOS Safari + Firefox tuple check.

## Scope notes

Hard boundaries observed: no contact with the author or any community; no fork, patch, rehost, or pin; no legal ruling; no canonical-release decision; no alternate-game search; nothing published anywhere; no edits under `EFS_WORKSPACE`. Everything downloaded (both clones, the npm tarball, the published page, the Wayback capture) lives only in `…/scratchpad/andromeda/`; the local static server used for the sandbox harness has been stopped.

One environment note worth flagging: the shared Browser pane contained a second tab I did not create (`tab-1`, "sandbox capability matrix", `127.0.0.1:8710`) — apparently another concurrent session. One `Return` keypress of mine landed in it before I noticed and re-selected my own tab; I took no other action there and did not read its contents.
