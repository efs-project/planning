# EFS Arcade — Launch-Catalog Candidates & Rights Research

**Purpose:** Honest quality assessment of the existing 15-game corpus, plus a rights-graded ranked candidate list for a genuinely compelling public launch catalog (target 2026-09-11).

**Evidence-grade legend:** **A** = primary source directly observed (license file / GitHub API / local file read); **B** = reputable secondary (official winners posts, established press, project READMEs); **C** = uncertain / inferred, needs verification.
All web sources accessed **2026-08-07**. No game files were downloaded; all checks were API/README/metadata reads.

---

## 1. Honest assessment of the current 15 games

Local read of `content/datasets/web-games/` (README.md, manifest.json, snake.html full, doodle-jump.html, tiny-yurts.html, plus greps across all 15). [A]

**Structural findings [A]:**
- 11 of 15 are straker (Steven Lambert) "Basic X HTML Game" tutorial gists — deliberately minimal teaching demos. Verified in-file: page titles literally say "Basic Snake HTML Game"; snake/breakout/helicopter contain **zero score display**; no sound, no game-over screen, no restart UI, no difficulty curve.
- **Touch support: only `dante.html`** has any touch handlers (grep for touchstart/pointerdown across all 15). Mouse input exists only in dante, missile-command, pong. Everything else is keyboard-only → **12/15 games are unplayable on phones**, which is fatal for "ordinary person follows a link" (majority-mobile traffic).
- The 3 js13k entries (Dante, Tiny Yurts, Infernal Throne/Sigil) are real award-winning games (js13k 2022 winner; 2023 4th place; 2022 high placer) and visibly a different quality class (dante is a 37KB packed WebGL exploration game; tiny-yurts a polished pointer-driven cozy sim). [A local + B winners posts]

### Verdict table (current 15)

| File | Fun/appeal (honest) | Touch | Name/TM risk | Verdict |
|---|---|---|---|---|
| dante.html | High — js13k 2022 **winner**, atmospheric WebGL | Yes | none | **KEEP** (flagship) |
| tiny-yurts.html | High — cozy path-drawing sim, 4th js13k 2023 | Pointer (yes) | none | **KEEP** |
| infernal-throne.html | Good — metroidvania-ish action platformer | No | Local rename from upstream "Infernal Sigil" muddies provenance | **KEEP, restore name "Infernal Sigil"** |
| snake.html | Weak tutorial demo (no score!) | No | "Snake" generic — OK | Replace or demote to "study collection" |
| tetris.html | Weak demo | No | **SEVERE** — see §2 | **DROP/RENAME+REDESIGN** |
| breakout.html | Weak demo (no score) | No | "Breakout" = Atari mark | Drop or rename ("Brick Blast") |
| block-dude.html | Mediocre; actually a faithful TI-calculator game clone | No | Name from Brandon Sterner's TI-83 game | Rename if kept |
| helicopter.html | Weak demo | No | generic | Replace |
| puzzle-bobble.html | Weak demo | No | **"Puzzle Bobble" = Taito registered mark** | **DROP/RENAME** |
| doodle-jump.html | Weak demo | No | **"Doodle Jump" = Lima Sky mark + character-design mark; enforcement history** | **DROP/RENAME** |
| sokoban.html | OK — puzzle holds up | No | "Sokoban" widely used generically; level-pack provenance unchecked [C] | Keep-ish, verify levels |
| missile-command.html | Weak demo | Mouse | "Missile Command" = Atari mark | Rename |
| frogger.html | Weak demo | No | **"Frogger" = Konami mark** | **DROP/RENAME** |
| bomberman.html | Weak demo | No | **"Bomberman" = Konami mark** | **DROP/RENAME** |
| pong.html | Weak; optional-WS-multiplayer cruft | Mouse | "Pong" = Atari mark | Drop |

**Bottom line:** the owner's suspicion is confirmed. 3 of 15 belong in a public launch. The straker set is fine *as an EFS technical demo dataset* or a labeled "how games are made — study collection", but as launch catalog it undermines the "genuinely fun games" promise, and 5-7 filenames carry live trademark exposure.

---

## 2. Trademark / clone-name findings

- **Tetris:** The Tetris Company enforces both the **name** and (uniquely) **look-and-feel copyright** — *Tetris Holding, LLC v. Xio Interactive* (D.N.J. 2012) held an unlicensed tetromino clone infringed copyright (playfield dimensions, piece shapes/colors, next-piece preview). Renaming alone does NOT clear a faithful clone. History of mass C&Ds against freeware clones. **Recommendation: remove tetris.html from any public catalog** (or replace with a mechanically-differentiated falling-block game). [A: Wikipedia case page + case coverage; accessed 2026-08-07]
- **Doodle Jump:** Lima Sky holds the "Doodle Jump" mark and a character-design mark; 2011 enforcement wave against "Doodle"-named apps (later partially withdrawn as "overreach", but marks stand). [B: TouchArcade/Destructoid/Justia trademark listing]
- **Frogger, Bomberman** (Konami), **Puzzle Bobble** (Taito), **Breakout / Pong / Missile Command** (Atari): all live registered marks; using the exact names on a public arcade invites C&Ds even where the underlying mechanics are free. [B: trademark registries/common knowledge; not individually pulled — grade B/C, do a registry pass before launch]
- Generic-safe names: Snake, Sokoban (used generically; original 1982 levels are Thinking Rabbit copyright — verify straker's level data isn't the original pack [C]), 2048 (Cirulli's own name, MIT).

---

## 3. Candidate research — ranked table

License column = SPDX from GitHub API `license` endpoint or license file read [A] unless noted. "Artifact" = committed playable build in repo (no build step). Classifications: **CR** clearly-redistributable-as-is · **RN** redistributable-with-notices · **MF** modifiable/forkable · **LE** link-embed-only · **PR** permission-required · **U** unclear · **X** unsuitable.

### Tier 1 — recommended for launch (license clean, real fun)

| # | Game | Author | License | Class | Files/artifact | Input | Notes (what I verified) |
|---|---|---|---|---|---|---|---|
| 1 | **2048** | Gabriele Cirulli | MIT [A] | CR/RN | Folder (index+js/+style/), no build, no CDN | Keys + swipe | Iconic, evergreen, mobile-perfect. THE anchor title. ~<1MB. |
| 2 | **Dante** (have) | S. Previti | MIT [A local] | CR | Single file, committed | Keys+touch | js13k 2022 winner. Keep. |
| 3 | **Tiny Yurts** (have) | burntcustard | MIT [A] | CR | Single file (dist committed) | Pointer/touch | Cozy sim; mobile-friendly. |
| 4 | **Norman the Necromancer** | Dan Prince | **Unlicense** [A] | CR | Vite build needed; **no committed dist in author repo** (js13kGames org mirror has dist) [A contents API] | Mouse+keys | js13k 2022 2nd; gorgeous pixel art. Public domain! |
| 5 | **13th Floor** | Rob Louie | MIT [A: roblouie/js13k-2024] | CR | Build (dist likely in org mirror) | Keys/mouse | js13k 2024 **winner**, 3D horror-ish; desktop-leaning. |
| 6 | **Casual Crusade** | Antti Haavikko | MIT [A: LICENSE read] | CR/RN | Build | Mouse/touch | js13k 2023 3rd; card deckbuilder, touch-friendly. |
| 7 | **Witchcat** | Jonathan Vallet | MIT [A: jonathan-vallet/js13k-2025] | CR | Build | Keys | js13k 2025 3rd. |
| 8 | **13 Steps to Escape** | Jonathan Vallet | MIT [A: js13k-2024] | CR | Build | Keys | js13k 2024 4th; puzzle-platformer. |
| 9 | **Q1K3** | phoboslab | MIT (+zlib Sonant-X) [A: README+API] | CR/RN | Build | Keys+mouse | Quake-in-13KB, viral fame; desktop-only. |
| 10 | **Underrun** | phoboslab | MIT (+zlib) [A] | CR/RN | Repo root playable, multi-file | Keys (touch controls exist on mobile [C]) | Twin-stick shooter, distinctive look. |
| 11 | **A Dark Room** | Doublespeak Games | **MPL-2.0** [A] | RN | Folder, no build [C verify] | All (text) | Cult classic, huge organic draw, perfect on mobile. File-level MPL notices required. |
| 12 | **Sandspiel** | Max Bittker | MIT [A] | RN/MF | WASM folder build; optional upload-gallery backend must be stubbed [C] | Touch/mouse | Famous falling-sand toy; enormous casual appeal. |
| 13 | **Orb.farm** | Max Bittker | MIT [A] | RN/MF | WASM folder build | Touch/mouse | Zen aquarium ecosystem; last pushed 2022 (stable). |
| 14 | **HexGL** | Thibaut Despoulain | MIT ("code and resources... MIT" — README read [A]) | CR/RN | Folder, large assets (tens of MB) | Keys/touch | Marquee WebGL racer; the visual "wow" for the catalog. |
| 15 | **Astray** | Rye Terrell | Unlicense [A] | CR | Folder (vendored Three.js/Box2D) | Keys | 3D marble maze; solid filler. |

### Tier 2 — usable with work or notices

| # | Game | License | Class | Notes |
|---|---|---|---|---|
| 16 | Infernal Sigil (have) | MIT [A] | CR | Keep; restore upstream name. |
| 17 | Hextris | GPL-3.0 (API: NOASSERTION custom file [A]; README GPL [B]) | RN/MF | Must fork to strip Google Fonts/Analytics CDN calls (verified claim in local README [B]). Name is its own. |
| 18 | Super Castle Game (mvasilkov) | GPL-3.0 [A] | RN | js13k 2023 7th; polished puzzle. GPL = ship with license + source link. |
| 19 | Slay the Web | AGPL-3.0 [A] | RN | Browser StS-like, active upstream (pushed 2026-05). AGPL fine for static rehost w/ source link. |
| 20 | hello wordl (lynn/hello) | MIT [A] | RN/MF | Daily-word evergreen traffic magnet. React build. Never market as "Wordle" (NYT mark). |
| 21 | Clumsy Bird | GPL-3.0 [A] | RN/MF | Flappy-like; needs build; own name (safe). |
| 22 | Knight Dreams (jani-nykanen) | **no license** [A] | PR | js13k 2023 9th; endless runner. |

### Tier 3 — permission-required outreach targets (no license granted; authors plausibly amenable)

| Game | Author | Why worth outreach |
|---|---|---|
| **CLAWSTRIKE** (js13k 2025 winner) | Rémi Vansteelandt (remvst) | repo `remvst/clawstrike` has **no license** [A]; author is a serial js13k winner, community-friendly. |
| **DR1V3N WILD** | Frank Force (KilledByAPixel/Drive13K, no license [A]) | His other games are GPL/MIT (BounceBack GPL-2.0 [A]); very likely to grant. High-value arcade racer. |
| Cat Survivors (2025 2nd) | eliasku | no license [A]. |
| Ghosted (2024 3rd) | Jani Nykänen | no license [A]. |
| The Way of the Dodo (2024 5th) | Jesper Rasmussen | no license in org mirror [A]. |
| Coup Ahoo (2024 2nd) | Antti Haavikko | custom/NOASSERTION [C — his 2023 entry is MIT, so ask]. |
| Onslaught Arena | Lost Decade Games | historic HTML5 arcade hit; repo has no license [A]; dormant since 2017. |

### Link/embed-only (list, never rehost)

- **Path to Glory** (js13k 2023 **winner**) — author asks no-redistribution [B: local README rejection log]. Link to js13kgames.com entry.
- **Dying Dreams**, **Edge Not Found** — restrictive custom/charity terms [B: local README].
- **Untrusted** — CC-BY-NC + CDN deps [B].
- **PICO-8 BBS games incl. Celeste Classic** — BBS default license CC BY-NC-SA [B/C]; embed/link only.
- **GMTK jam winners** — spot-check shows itch jam entries almost never carry redistribution licenses [B: itch collection pages]; treat entire class as LE/PR, not a sourcing channel.
- BrowserQuest — multiplayer + deprecated + MPL/CC mixed [A API NOASSERTION]: **X** for September.

---

## 4. The multi-file problem, quantified

Of the ~22 Tier-1/Tier-2 games above:
- **Single-file as-committed: ~4-5** (Dante, Tiny Yurts, Infernal Sigil, and a minority of js13k dist builds) ≈ **20%**.
- **js13k class (12 of 22): all ≤13KB zipped**, typically index.html + 1-3 sibling files in `dist/`; **trivially inlineable into one file** (a license-permitted "small fork with provenance"). Effective single-file coverage rises to ~70% *if* a light inlining step is allowed.
- **The marquee non-js13k titles — 2048, A Dark Room, HexGL, Sandspiel, Orb.farm, Slay the Web, hello wordl, Hextris, Astray, Clumsy Bird — are ALL multi-file folder bundles (10/10).** No inlining hand-wave fixes HexGL's texture folders or Sandspiel's WASM.

**Verdict: the single-file-only lane is viable for a September js13k-centric catalog but excludes essentially every household-name open web game.** Folder/bundle anchoring (or a documented inline-build fork pipeline) is the single highest-leverage unlock for catalog quality. Recommend: ship September on single-file js13k winners + an inlining pipeline, and treat folder-bundle support as the #1 post-launch content feature (2048 + A Dark Room alone likely outdraw everything else combined).

## 5. Recommended quality bar & catalog size

**Bar (all must hold):** (1) a stranger plays ≥2 minutes unprompted; (2) comprehensible in ≤10 seconds without instructions; (3) has score/goal/failure state and restart; (4) works on touch OR is explicitly badged "desktop"; (5) license permits rehosting (CR/RN) with notices preserved; (6) name clears a trademark sniff test; (7) loads <5s on 4G.

**Size: 12-18 games at launch.** Rationale: below ~10 the catalog page looks like a demo; above ~20 curation quality dilutes and the September clock breaks. Mix: 2-3 marquee (2048-class, pending folder support or inline forks), 8-10 js13k medalists, 2-3 toys (sandspiel-class), ≥40% touch-playable. This also gives the curation-workflow story real material (Tier-3 outreach = the first community-curation campaign).

## 6. Suggested actions (for orchestrator)

1. Drop/quarantine tetris.html now (name + look-and-feel exposure); rename or drop the other 6 TM-risk files before anything is public.
2. Rebrand straker set as a labeled "study collection" dataset, out of the arcade catalog.
3. Build the inline-fork pipeline for js13k dist builds (MIT/Unlicense ones only), full provenance in manifest.
4. Queue outreach list (Tier 3) as the launch community-curation campaign — but James sends, post-validation.
5. Registry-check the final launch names (USPTO TESS pass) — graded B/C above, 1 hour of work.

---

## Source index (all accessed 2026-08-07)

**Local [A]:** [`../../../content/datasets/web-games/`](../../../content/datasets/web-games/) — README.md, manifest.json, snake.html, doodle-jump.html, tiny-yurts.html, greps across all 15 files.

**GitHub API license/contents endpoints [A]:** gabrielecirulli/2048 (MIT) · Hextris/hextris (NOASSERTION) · wwwtyro/Astray (Unlicense) · BKcore/HexGL (MIT) · ellisonleao/clumsy-bird (GPL-3.0) · phoboslab/underrun (MIT) · phoboslab/q1k3 (MIT) · KilledByAPixel/SpaceHuggers (GPL-3.0) · KilledByAPixel/Drive13K (none) · KilledByAPixel/BounceBack (GPL-2.0) · jonathan-vallet/js13k-2025, js13k-2024 (MIT) · roblouie/js13k-2024 (MIT) · danprince/norman-the-necromancer (Unlicense) · anttihaavikko/casual-crusade (custom MIT text, read) · mvasilkov/super2023 (GPL-3.0) · jani-nykanen/ghosted, knight-dreams (none) · remvst/clawstrike (none) · eliasku/js13k-2025-cat-survivors (none) · doublespeakgames/adarkroom (MPL-2.0) · maxbittker/sandspiel (MIT) · MaxBittker/orb.farm (MIT) · oskarrough/slaytheweb (AGPL-3.0) · lynn/hello (MIT) · mozilla/BrowserQuest (NOASSERTION) · lostdecade/onslaught_arena (none) · js13kGames org mirrors (tiny-yurts, the-way-of-the-dodo — dist layout).

**README/license raw reads [A]:** BKcore/HexGL README (MIT incl. resources) · phoboslab/underrun + q1k3 READMEs (MIT + zlib Sonant-X) · anttihaavikko/casual-crusade LICENSE (MIT).

**Web [B]:** js13kGames winners posts — [2024](https://js13kgames.com/2024/blog/winners-announced), [2025](https://medium.com/js13kgames/js13kgames-2025-winners-announced-81bd2a9b5eb3), [2023](https://medium.com/js13kgames/js13kgames-2023-winners-announced-d4e87593be5d) · [Tetris Holding v. Xio Interactive (Wikipedia)](https://en.wikipedia.org/wiki/Tetris_Holding,_LLC_v._Xio_Interactive,_Inc.) · [Cole Schotz case note](https://www.coleschotz.com/tetris-defeats-the-clones-in-copyright-infringement-battle/) · Lima Sky Doodle Jump enforcement — [TouchArcade](https://toucharcade.com/2011/01/12/lima-sky-flexes-legal-muscle-claims-trademark-on-the-word-doodle/), [Destructoid](https://www.destructoid.com/lima-sky-backs-down-from-doodle-jump-copyright-claim/), [Justia TM listing](https://trademarks.justia.com/owners/lima-sky-llc-1727008) · [GMTK winners collections on itch.io](https://itch.io/c/4752911/gmtk-game-jam-2024-winners).
