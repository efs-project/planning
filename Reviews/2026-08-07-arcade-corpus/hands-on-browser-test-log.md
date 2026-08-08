# Hands-on browser test log — deployed EFS explorer + competitor journeys

One first-hand browser session (Claude in-app browser, desktop viewport, 2026-08-07) probing the *deployed* v1 explorer's guest journey against representative competitor journeys. All observations grade **A (directly observed)** unless noted. Screenshots were taken live; observations recorded immediately.

## 1. Deployed EFS explorer — `app.efs.eth.limo` (2026-08-07)

**The single most important verification result of this pass:** `/games` IS live on real Sepolia, and the deployed explorer can list it — but a guest cannot deep-link to a game, and in this session could not open one at all.

| Step | Observation | Verdict for Arcade |
|---|---|---|
| Load `https://app.efs.eth.limo/` | Renders "Welcome to **EFS Dev Tools**" — terminal-green dev aesthetic, CONNECT WALLET button, Debug Contracts / Debug Schemas nav, burner balance chip. Network tab: WalletConnect explorer API (wallet images), Google Fonts, `sepolia.drpc.org`, and an Alchemy key baked into the build all load on first paint | Guest page boots the full wallet stack before showing content — the exact anti-pattern the guest-link idea (Ideas.md) names. Branding says "dev tools", not a product |
| Navigate `https://app.efs.eth.limo/explorer/games` | Works. Sidebar shows Topics → cypherpunk / **games** / standards / whitepapers on **Sepolia**. All 15 games render as a file grid: filename + generic file icon only. No titles, descriptions, artwork, or tags visible. Every card exposes Tags / Properties / Debug Info / **Delete file** buttons | **Folder deep link works today** (the IPFS `_redirects` SPA fallback does its job). Catalog looks like a debug file manager, not a game catalog. "Delete file" shown to guests is a trust-destroying affordance |
| Navigate `https://app.efs.eth.limo/explorer/games/snake.html` | **Broken.** Title updates to "snake.html - EFS" (route resolves) but the view renders the file path as an empty folder: *"All items hidden by active exclusion filter."* Console: repeated RPC `400` errors + `ERR_CONNECTION_CLOSED` | **File deep links — the Arcade's core promise — do not work on the deployed build.** Either the path-classifier treats files as containers on direct load, or RPC failures break resolution; both must be fixed for `/arcade/<slug>` |
| Double-click `snake.html` in the folder grid | Nothing visible happens. No modal, no navigation, no iframe. Console shows RPC 400s from `sepolia.drpc.org` | In this session a guest **could not play any game at all**. Read-path reliability on a public RPC is a real launch blocker, matching the memory that live Sepolia needs a dedicated RPC |

Evidence note: the double-click failure is graded **A for this session** but the root cause (UI handler vs RPC failure) was not isolated in-browser; the code-level lane (`verification-routes-and-links.md`) carries the from-source analysis.

## 2. Poki — `poki.com` and `poki.com/en/g/subway-surfers`

| Step | Observation |
|---|---|
| Load homepage | Instant art-first thumbnail mosaic. No account, no visible cookie wall, no perceptible delay. Every tile is artwork — zero filenames |
| Deep link to a game page | **Stable shareable URL works.** Page auto-loads the game: big progress bar "100% — 6.4/6.4 MB", then the game runs. Like/dislike counts (18.0M / 3.2M), report flag, fullscreen button. Side/below ad slots present but not blocking |
| Model notes | Poki **auto-executes** game code on page open — viable only because Poki reviews/publishes every game itself and fronts it with an ad business. A permissionless-substrate arcade cannot copy auto-execution; the explicit-Play gate is the right EFS divergence. 6.4 MB for a mainstream casual game calibrates size expectations: good games are MB-scale, not 13 KB |

## 3. itch.io — `itch.io/games/free/platform-web`

| Step | Observation |
|---|---|
| Load browse page | "**Top free games for Web (711,932 results)**" — headline number, grade A. Tag browse, jam calendar, Upload Game in top nav. Playing needs no account; publishing does |
| Model notes | The world does not lack browser-game hosting, discovery, or creator publishing. itch also already offers pay-what-you-want economics and jam infrastructure. Any EFS Arcade value claim must survive "why not itch.io?" — the honest answers are durability (itch pages die when devs delete them), byte verification, plural curation, and rehostability, none of which itch offers or wants to offer |

## 4. js13kGames — `js13kgames.com/2024/games`

| Step | Observation |
|---|---|
| Load 2024 entries | 100+ entries, each with named author(s). Entries are playable on the site; source on GitHub per entry; the 13 KB constraint means every entry is small and self-contained by construction |
| Model notes | This is the strongest single supply pipeline for the Arcade's September constraint (small, self-contained, author-reachable, many already MIT). Licenses vary **per entry** — each needs individual verification. One 2022 author (Ryan Malm, *Six And Seven* 2024) already appears in the existing EFS 15 (Dante music credit) — the community overlap is real, and author outreach is plausible |

## 5. Cross-cutting conclusions for the Arcade design

1. **The gap between the deployed EFS experience and the product promise is the whole project.** Poki's journey (link → art → progress bar → playing in seconds) is the consumer bar; the deployed explorer meets none of it and today cannot even open a game reliably.
2. **Folder-level SPA fallback already works on eth.limo** — stable `/arcade` URLs are structurally possible today; the file-level deep link and the RPC dependency are the two broken legs.
3. **Explicit Play is a defensible differentiator, not a UX tax** — Poki auto-executes because it is the publisher; a neutral substrate must not, and PAF-3/PAF-5 already say so.
4. **Supply is not scarce; *trustworthy, durable, rehostable* supply is.** 711,932 free web games exist one click away. The Arcade's claim has to be about what happens to a game *after* upload: verification, mirrors, plural curation, and outliving its host.
5. **RPC reliability is a launch-critical dependency** — a public Arcade on a flaky free RPC will look exactly like the broken session observed here.
