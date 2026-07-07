# Deep-link boot, URL state, and cold start — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** boot-deeplinks. **Date:** 2026-07-07.

Scope: fragment-secret patterns in production, URL length reality, unfurl-bot behavior, capability/signed URLs, protocol & launch handlers, service-worker cold-start engineering, import-map boot, cache-first OS boot, and 2026 performance budgets — then an EFS v2 translation. All load-bearing claims fetched from primary sources; dates captured inline.

---

## 1. WHAT EXISTS TODAY

### 1.1 Fragment secrets in production (the `#` boundary)

The invariant everyone builds on: **browsers never send the URL fragment in HTTP requests** — not in the request line, not in `Referer`. It IS readable by any JavaScript on the page.

- **Excalidraw** (blog, 2020-03-21): share link `https://excalidraw.com/?scene={id}#key={base64}` — scene ID in query (server sees it), AES-GCM 128-bit key (Web Crypto, JWK export, base64) in fragment (server never sees it). Explicitly notes the caveat: fragment is "readable from the client-side JavaScript code." Server stores only ciphertext; "even a subpoena wouldn't produce readable drawing data."
- **CryptPad** (docs current as of 2026.5.0): the symmetric key is derived from the fragment; sharing the URL = sharing authorization. XChaCha20-Poly1305 content encryption + Ed25519 signatures; server stores undecryptable blobs. This is a decade of production zero-knowledge collaboration built entirely on fragment keys.
- **Firefox Send** (Wikipedia; ran 2017-08-01 → suspended 2020-07-07 → killed 2020-09-17): E2E-encrypted file sharing, key in fragment, expiry by time/download-count. Killed not by crypto failure but by **abuse economics**: no auth, no report-abuse mechanism, and the trusted `firefox.com` domain was allowlisted in corporate filters — so REvil, FIN7, Ursnif, Zloader used it as malware CDN. Mozilla suspended it to add mandatory accounts + abuse reporting, then layoffs killed it entirely.
- **Proton Drive** (proton.me security model pages, current): share links are `URL + password`; the URL-embedded random password variant lives after `#` — "this section of the URL isn't shared with Proton servers." Server returns encrypted payload; only the fragment password decrypts. Also offers *separate-channel* password delivery as the higher tier — treating "password in link" as explicitly equivalent to public.
- **The leak that keeps happening — analytics/crash reporting** (romain-clement.net, 2020-05-01): Sentry's default SDK captures `window.location.href` **including the fragment** into crash reports — silently exfiltrating E2E keys of exactly the Excalidraw/Send-style apps. Fix: `beforeSend` scrub (`event.request.url.split('#')[0]`). Generalizes to any third-party JS: the fragment boundary protects against the *network*, not against *code on the page*.
- **W3C TAG "Good Practices for Capability URLs"** (TAG finding, 2014-10-30 — still the canonical checklist): leak vectors = browser history, autocomplete, **browser sync services**, Referer to third parties, URL shorteners, server/proxy logs, third-party scripts, search indexing, accidental copy-paste. Practices = HTTPS only, ≥120 bits entropy, expiry (time or single-use), user-visible revocation + multiple URLs per resource, `rel="noreferrer"`/CSP referrer suppression, token **in fragment rather than path**, `robots.txt` on the URL-space, 404/410 after expiry, keep a canonical non-capability URL alongside.

**Service workers CAN see fragments.** Since the whatwg/fetch #214 resolution (implemented Firefox 52, Chrome 59, ~2017; see GoogleChrome/workbox#488 and Mozilla bug 1443850), `FetchEvent.request.url` **preserves the fragment**, including on navigation requests. Two consequences: (a) the SW is *inside* the secrecy boundary — same-origin trusted code, fine for a kernel, fatal if your SW logs URLs to telemetry; (b) fragments break naive `cache.match()` keying — normalize/strip fragments before cache lookups or identical pages miss the cache (this bug shipped in real sites; Mozilla 1443850).

**Browser-owned fragment sub-syntax exists:** the fragment directive `#:~:text=...` (Text Fragments, WICG scroll-to-text spec; Chrome since 80, Safari 16.1, Firefox 131 — web.dev) is **stripped from `location.hash` before page script runs**, for compatibility and privacy. Two lessons: (1) precedent that "part of the fragment hidden from the page" is a shippable browser behavior — the platform already did what an OS kernel wants to do to its apps; (2) trap: any fragment payload containing a literal `:~:` will be truncated by the browser. Base64url alphabets (`A-Za-z0-9-_`) can never collide; ad-hoc fragment grammars can.

### 1.2 URL length in practice

Key structural fact for EFS: **fragments never traverse servers**, so the usual binding constraints (CDN 8KB header caps, server request-line limits, the classic "2,083 IE limit") do not apply to fragment payloads. What actually binds:

- **Browsers** (baeldung.com, urleditor.online, GeeksforGeeks, 2024–2025): Chrome ~2MB internal cap; Firefox ~64KB practical (longer URLs load but display truncates ~65,536); Safari ~80K chars. The "2,048 chars" figure is the *server-traversal interop* ceiling, not a fragment ceiling.
- **Chat apps**: Discord message limit 2,000 chars (4,000 with Nitro) — a hard paste ceiling (lettercounter.org, 2026 guide). Slack truncates messages >40,000 chars (Slack changelog, 2018-04). SMS/RCS fallback ~160 chars/segment.
- **QR codes** (qrcode.com/DENSO WAVE, qrcodechimp.com): theoretical max version 40 = 2,953 bytes binary / 4,296 alphanumeric at ECC-L; **practical scanning guidance is ≤ version 6 (~200–300 chars)** for print at normal sizes — beyond that, scan failure rates climb. QR is the tightest real budget a link format must fit.
- Production mitigation for state-in-URL: **compress**. Mermaid Live Editor `#pako:...` = deflate(JSON) → base64url with `+/`→`-_` (mermaid-live-editor serde.ts, current). TypeScript Playground uses lz-string similarly. The platform now has native primitives: **CompressionStream/DecompressionStream (`deflate`, `deflate-raw`, `gzip`) — Baseline since May 2023, all engines, worker-available** (MDN; web.dev 2023).

### 1.3 Unfurl / preview bots — what actually leaks when a link is pasted

Canonical study: **Mysk & Bakry, "Link Previews" (mysk.blog, 2020-10-25)**, plus Slack docs and 2024–2026 follow-ups:

- **Three architectures**: sender-device generates preview (iMessage, Signal [opt-in], WhatsApp, Viber); receiver-device fetch (two apps, fixed pre-publication — leaked receiver IP zero-click); **server-side bots** (Slack, Discord, Facebook Messenger, Instagram, LINE, LinkedIn, Twitter/X, Zoom, Google Hangouts).
- Server bots **fetch the pasted URL within seconds**, from platform IPs. Download limits observed: Slack 50MB (caches ~30 min), Discord 15MB, Twitter 25MB, LinkedIn 50MB, Facebook/Instagram unlimited (fetched 24.7GB re-downloading a 2.6GB file); Instagram/LinkedIn **executed page JavaScript** (~20s budget).
- LINE forwarded links from E2E chats to its unfurl servers — silently voiding E2E ("defeats the purpose of end-to-end encryption").
- **Fragment nuance**: bots issue HTTP GETs, so the fragment is *not sent to the target host* — but the **messaging platform itself stores the full message text including the fragment** (any non-E2E platform: Slack, Discord, etc.). Fragment secrecy protects against the fetch, not against the channel.
- 2024–2026 escalation: unfurling is now a **zero-click exfiltration channel for AI agents** — prompt-injected agents render attacker URLs with secrets in query params; Slack/Teams/Telegram unfurlers auto-GET them (embracethered.com 2024; The Register 2026-02-10). Two-sided lesson for EFS: never emit user data into any URL an agent/app can cause to be rendered; and expect *your* links to be fetched by third-party infrastructure the instant they're shared.
- Slack lets pages opt out of unfurl (`<meta name="slack-no-unfurl">`) and documents its bot behavior (docs.slack.dev, current).

### 1.4 Capability tokens beyond random strings

- **Macaroons** (Birgisson et al., Google, NDSS 2014): bearer tokens as chained HMACs; **anyone holding one can attenuate it offline** by appending caveats (expiry, audience, purpose, third-party discharge requirements) — verification needs only the root key holder. Deployed shape: "share a weaker link than the one you hold" without a server round-trip.
- **Biscuit** (Clever Cloud, biscuitsec.org; intro blog 2021-04-12, active through v2/v3 2023+): public-key (Ed25519) signed blocks + embedded **Datalog policy**; offline attenuation like macaroons but third parties can verify with the public key alone — no shared secret. Fits content-addressed/serverless verification much better than macaroons.
- W3C TAG capability-URL guidance (1.1) is the UX/lifecycle wrapper: expiry, revocation lists, canonical-URL pairing.
- These remain **niche in URLs** today; production "signed URLs" are mostly S3-style HMAC query strings (leak via logs/referer — exactly what TAG warns about). Putting an attenuable token in a *fragment* is essentially unoccupied design space.

### 1.5 OS integration surfaces (how a link reaches your app)

- **`registerProtocolHandler()`** (MDN, current): https-only handler on same origin; scheme must be on the **safelist** — `bitcoin, dat, dweb, ftp, geo, im, ipfs, ipns, irc(s), magnet, mailto, matrix, mms, news, nntp, sip, sms(to), ssb, ssh, tel, urn, webcal, wtai, xmpp` — **or `web+`/`ext+` + lowercase ASCII**. Note: `ipfs`/`ipns`/`dweb`/`dat`/`ssb` made the safelist; **`web3` did not**.
- **Manifest `protocol_handlers`** (MDN, current; Edge docs): installed-PWA OS-level registration, `%s` substitution into an in-scope https URL. **Experimental, not Baseline** — Chromium desktop/Android only; no Safari, no Firefox.
- **Launch Handler API / `launch_handler.client_mode`** (MDN; Chrome docs): `navigate-new | focus-existing | navigate-existing | auto`, with `window.launchQueue.setConsumer()` receiving `targetURL`. Chrome 110+ (more useful with 2024's navigation-capturing update). Experimental; Chromium-only. This is *the* API for "deep link into already-running OS instance instead of booting a second one."
- **File Handling API (`file_handlers`)** (Chrome blog "New in Chrome 102", 2022-05): installed PWA appears in OS "Open with…"; Chrome/Edge 102+ **desktop only**; not Safari/Firefox.
- **Web Share Target (`share_target`)** (MDN, current): installed PWA appears in OS share sheet; GET query params or POST multipart (files), SW-interceptable. **Not Baseline / experimental** — effectively Chrome-on-Android/ChromeOS + Edge; not Safari, not Firefox.
- **Speculation Rules API** (Chrome docs; perfplanet 2024-12; MDN): prerender/prefetch next navigations; Chrome 105/110+, `eagerness`+`where` from 121; Safari 26.2 ships it **disabled by default** (late 2025); Firefox absent. Progressive enhancement only — and it's for *in-site* nav, not cross-origin cold starts.

### 1.6 Service worker cold start — the numbers and the machinery

- **Startup cost**: ~50ms desktop, ~250ms mid-mobile, 500ms+ on slow devices/CPU contention (web.dev "Speed up service worker with navigation preloads", Archibald, 2017 — still the canonical figures). Field confirmation 2026: 200–500ms blank gap on mid-range Android/4G; enabling navigation preload cut LCP ~300ms (loke.dev, 2026-02-21). Large sites report SW-startup-serialized requests as "10s to 100+ ms" regressions (w3c/ServiceWorker#920).
- **Navigation preload** (web.dev 2017; MDN; Workbox docs): browser starts the GET navigation fetch *in parallel* with SW boot; SW consumes `event.preloadResponse`. GET-only. **Anti-pattern for cache-first shells** — it fires a network request you'll discard, burning data. Use only for network-first HTML.
- **Service Worker Static Routing API** (Chrome 123, 2024; developer.chrome.com blog; WICG repo; MDN `InstallEvent.addRoutes()`): declarative routes evaluated **without waking the SW** — sources `network`, `cache` (named cache + `cacheName`), `fetch-event`, `race-network-and-fetch-handler`, `race-network-and-cache`; conditions on urlPattern/request/running-status; `not` condition added later. This is the "bypass the SW for immutable content-addressed assets" primitive. Chromium-only today.
- **ServiceWorkerAutoPreload** (explainers-by-googlers repo, 2024–2025; Chrome enterprise policy shipped): browser auto-dispatches the navigation request while booting the SW when heuristics say the fetch handler mostly falls back — navigation-preload semantics with zero developer code; opt out via Static Routing API. Rolling out via eligibility heuristics.
- **App shell + streams** (Chrome Workbox docs "Faster multipage applications with streams"; philipwalton.com 2020): respond to navigations by **streaming** cached header partial instantly, then body (cache or network), then cached footer — `workbox-streams` stitches ReadableStreams; first paint starts before the network resolves. Requires HTML-partial discipline and must degrade to a normal MPA without the SW.
- **The one production "browser OS boot from SW" comparable — IPFS Service Worker Gateway / inbrowser.link** (ipfs/service-worker-gateway; blog.ipfs.tech 2024-11-25): registers a SW that intercepts `/ipfs/*`/`/ipns/*`, uses `@helia/verified-fetch` to retrieve + **hash-verify content client-side**, runs **exclusively in subdomain mode for origin isolation** (each content root gets its own origin per the Subdomain Gateway spec). Openly documented trade-off: "inherent … upfront cost of fetching and installing the Service Worker … first load may be slower than using a trusted gateway." Also: WebRTC unavailable *inside* SWs; Chrome ~500-connection/window limits. First-visit-vs-repeat-visit asymmetry is structural, not incidental.
- **bfcache + `focus-existing`** cover the warm paths: back/forward restores are near-instant and SW-free; Launch Handler routes repeat deep links into the live instance.

### 1.7 Import-map-driven lazy boot

- **Import maps: Baseline** — Chrome/Edge 89, Firefox 108, Safari 16.4; ~95% global (caniuse, 2025). **Multiple import maps + maps-after-modules-start: Chrome 133, Safari 18.4** (2025; caniuse/testmu). Shopify ships import-map-first storefront theming with `es-module-shims` fallback ("Resilient Import Maps", shopify.engineering, 2025).
- Pattern that matters for EFS: an import map **is a manifest of module-specifier → content-addressed URL**. Swapping one small JSON blob re-pins an entire dependency closure without rebundling — i.e., import maps are the browser-native representation of an "OS generation." Combine with `<link rel="modulepreload">` for the critical slice and dynamic `import()` for everything else; unreferenced modules cost nothing at boot.

### 1.8 What "fast" must mean in 2026

**Alex Russell, "The Performance Inequality Gap, 2026" (infrequently.org, 2025-11-24)**: P75 baseline device = Samsung Galaxy A24 4G-class (Helio G99/Exynos 1330), HP 14 Celeron/eMMC desktop; network 9Mbps down / 3Mbps up / **100ms RTT**. Critical-path budgets (2 TLS connections):

| Target | JS-light (15% JS) | JS-heavy (50% JS) |
|---|---|---|
| 3.0s first load | 2.0 MiB total (0.30 MiB JS) | 1.2 MiB total (0.62 MiB JS) |
| 5.0s first load | 3.7 MiB total (0.57 MiB JS) | 2.3 MiB total (1.15 MiB JS) |

JS costs more per byte than any other resource ("coffin corner"); each extra pre-render connection burns ~3×RTT+TLS out of the time budget. On 100ms RTT, **every serialized round trip is 100ms gone** — a deep-link boot chain of manifest → import map → kernel → viewer → content that serializes 5 fetches has spent 500ms before executing a byte.

---

## 2. WHAT IS EMERGING (status snapshots, 2026-07)

| Thing | Status | Date |
|---|---|---|
| SW Static Routing API (`addRoutes`, race sources, `not`) | Shipped Chrome 123+; Chromium-only; WICG | 2024→ |
| ServiceWorkerAutoPreload | Chrome rollout by heuristic + enterprise policy; explainer stage | 2024–2025 |
| Multiple import maps | Chrome 133, Safari 18.4 | early 2025 |
| Launch Handler / navigation capturing | Chrome 110+/128+; experimental, Chromium-only | 2023–2024 |
| Speculation Rules | Chrome stable; Safari 26.2 behind flag; no Firefox | 2024–2025 |
| Web Share Target, File Handling, manifest protocol_handlers | All "not Baseline", Chromium-centric; Safari/iOS still missing them (magicbell iOS-PWA survey, 2026) | ongoing |
| Fragment Directive API (page-readable `:~:` parsing) | WICG proposal (eligrey polyfill); only browser-stripping shipped | 2024→ |
| Biscuit tokens v3 | Active OSS, niche adoption | 2023→ |
| Compression Streams | **Baseline everywhere** — use freely | since 2023-05 |

An EFS-specific invention would be: fragment-carried, offline-attenuable capability tokens (biscuit-style) bound to lens/venue context; import-map-as-OS-generation pinning; kernel-side fragment stripping before ring-3 boot; venue-qualified deep-link grammar. None of these exist off the shelf.

---

## 3. LESSONS AND TRAPS from deployed systems

1. **Fragment ≠ secret from the page.** Sentry/analytics SDKs capture `location.href` with fragment (2020, still default-on in many SDKs). Any third-party or ring-3 code that can read `location` reads the key. Strip-and-replaceState immediately after ingest; scrub telemetry.
2. **The SW sees fragments** (post-2017 spec) — and fragments poison cache keys. Normalize URLs before `cache.match()`.
3. **The channel stores the link even when the fetch can't see it.** Slack/Discord persist full message text; unfurl bots fetch within seconds, execute JS (Instagram/LinkedIn), and cache results. A capability URL pasted into a non-E2E channel is disclosed to the platform forever.
4. **Trusted-domain + anonymous + encrypted = malware CDN** (Firefox Send). Unfurl-proof, scanner-proof capability links invite abuse; design report/revoke paths before launch, not after.
5. **Navigation preload with a cache-first shell is a footgun** — it re-downloads HTML you'll throw away, on every navigation, on metered connections.
6. **First-visit vs repeat-visit is a structural cliff** for SW-gateway architectures (IPFS inbrowser.link admits it). The first deep-link click on a fresh device gets *no* SW, *no* cache, *no* verified fetch — engineer that path separately instead of pretending the SW is always there.
7. **QR truncates ambition**: past ~300 chars scanning degrades; past 2,953 bytes it's impossible. Chat clamps at 2,000 (Discord). A link grammar not designed to a byte budget will fail at the exact moment of sharing.
8. **`:~:` is reserved** — browsers strip fragment directives before script sees them. Fragment encodings must be `:~:`-proof (base64url is).

---

## 4. EFS TRANSLATION — opinionated recommendations for client v2

**R1. One canonical link form: `https://` first, scheme second.** The canonical deep link is an https URL on the client's origin; `web+efs://…` (manifest `protocol_handlers` + runtime `registerProtocolHandler` as progressive enhancement, Chromium-only) is an alias that redirects into it. Never make scheme-links load-bearing: Safari/Firefox users must lose nothing.

**R2. Strict fragment grammar, versioned and byte-budgeted.** All EFS state rides the fragment: `#efs1.<venue>.<target>[.<cap>]` where every segment is base64url (immune to `:~:` stripping and server logs). Targets name files, apps, `~claim:` citations, OS profiles/generations, permission prompts, sync states. Define three size tiers and enforce them in the share UI: **QR tier ≤ ~300 chars** (target by reference only), **chat tier ≤ 2,000 chars** (Discord floor), **max tier ≤ 64KB** (Firefox floor) for embedded state; compress anything structured with `deflate-raw` via native DecompressionStream (Baseline 2023), Mermaid-style.

**R3. Secrets only in the fragment, and the kernel eats them.** Capability material lives in a marked sub-segment. The Bootstrapper reads it, hands it to the Kernel worker, then `history.replaceState()`s it out of the address bar **before Shell or any Ring-3 app boots** — replicating browsers' own `:~:` stripping, at the kernel boundary. Ring-3 apps never see `location`-borne secrets (they get capability objects). Ban third-party telemetry in Ring-0/1; if any error reporting exists, fragment-scrub in `beforeSend`.

**R4. Capabilities as offline-attenuable tokens, not naked random keys.** Adopt a biscuit-style construction (public-key blocks, offline attenuation, third-party verifiable) so a holder can mint a weaker share-link (read-only, expiring, venue-pinned) with zero infrastructure — this matches EFS's chain-free envelope philosophy and the TAG lifecycle guidance (expiry, revocation, canonical-URL pairing). Random-128-bit keys remain fine for pure decryption caps (Excalidraw-grade).

**R5. Engineer the cold path as its own product.** First-click-on-fresh-device sequence: tiny static HTML shell (inline CSS+boot JS, target <15KiB) renders instantly and paints an honest "resolving…" state from fragment data alone → registers SW + kernel worker in parallel → fetches the minimal verified closure (Bootstrapper → kernel slice → exactly one viewer) via import-map-declared, content-addressed, `modulepreload`-hinted modules, **≤2 serialized round trips** (100ms each at P75). Budget hard against Russell 2026: ≤1.2MiB / ≤0.62MiB JS critical path for 3s first boot on a Galaxy A24; repeat-visit boot fully cache-served <1s with zero network.

**R6. SW = thin router, kernel = dedicated worker.** SW startup cost scales with what it does; keep the fetch handler to route + cache + verify-hand-off, nothing else. Use Static Routing (`race-network-and-cache` / `cache`) where available so immutable content-addressed assets skip SW wake-up entirely; treat it and ServiceWorkerAutoPreload as free Chromium wins, feature-detected. Do NOT enable navigation preload for the cache-first shell (data waste); the shell is always cache/static.

**R7. Import maps ARE the OS generation.** An OS profile/generation = one content-addressed import map (plus asset manifest). Upgrading = swapping a small pinned JSON; rollback = swapping back; "no forced upgrades" falls out naturally, and deep links can carry `@gen=<hash>` to boot a specific generation. Multiple-import-map support (Chrome 133/Safari 18.4) even permits app-scoped maps layered over the OS map; ship `es-module-shims`-style fallback only if pre-16.4 Safari matters.

**R8. Unfurl posture: accept the generic card, never leak.** With a static content-addressed host there is no per-link server-side OG rendering — accept one handsome generic unfurl card for the origin; put zero identifying data in path/query (bots and platforms see those); document that fragment-bearing links pasted into Slack/Discord are disclosed to that platform; offer "copy preview-safe link" (no capability segment) alongside "copy access link." Route repeat launches through Launch Handler `focus-existing` so shared links land in the running OS.

### Where EFS v2 protocol design conflicts with / under-supports the client OS

- **`web3://` has no browser on-ramp.** The registerProtocolHandler safelist includes `ipfs`/`ipns`/`dweb` but not `web3`; ADR-0056's universal write default can't be claimed by any web client on any browser. Needs a `web+efs`/`web+web3` alias convention in the protocol docs, or standards work to safelist `web3` (as IPFS did).
- **Lens-relative resolution vs link portability.** A deep link resolves per-viewer (lens = viewer's trusted-author list), so a link cannot pin what the recipient will see. The URL grammar needs an explicit choice the protocol doesn't yet make: links carry *venue + optional author-hint/attestation-pin* (sender's resolution as a fallback lens), and the read-grade UI must label "resolved under your lens ≠ sender's." Otherwise citations (`~claim:`) are not reproducible across viewers.
- **Origin economics are unaddressed.** IPFS solved app sandboxing with one-origin-per-content-root (subdomain gateways); EFS wants one OS origin with Ring-3 capability sandboxing. SW, Cache Storage, OPFS, and permissions are all per-origin — a single-origin OS means all apps share the browser-level storage/permission pool, and true iframe-origin sandboxing of apps would fragment the cache and re-pay SW cold start per app origin. The protocol/client split should state which isolation model is normative; nothing in v2 currently does.
- **Freshness grades need a boot-time story.** LIVE/STALE/etc. are defined against venue-qualified reads, but a cold-boot deep link renders entirely from cache before any venue is reachable; the client needs a normative "grade shown before first venue contact" (e.g., STALE-until-verified) — currently under-specified, and it's the exact honest-freshness label the no-ambient-HTTP principle requires.
- **Envelope IDs are deterministic and client-computable — exploit that in links.** A link carrying `(venue, record-ID, expected-hash)` lets the booting client verify the citation closure offline and label grades honestly with zero fetches. The protocol supports this implicitly; the link grammar should make the hash-pin segment first-class rather than optional garnish.

---

## Sources (dated)

- https://plus.excalidraw.com/blog/end-to-end-encryption — Excalidraw E2E share links (2020-03-21)
- https://docs.cryptpad.org/en/dev_guide/general.html — CryptPad security model (docs, 2026.5.0)
- https://en.wikipedia.org/wiki/Firefox_Send — Send timeline/abuse post-mortem (accessed 2026-07-07)
- https://proton.me/blog/protondrive-security ; https://proton.me/support/password-protect-files-proton-drive — Proton Drive share-URL model (accessed 2026-07-07)
- https://romain-clement.net/articles/sentry-url-fragments/ — Sentry captures fragments (2020-05-01)
- https://www.w3.org/2001/tag/doc/capability-urls/ — W3C TAG capability-URL practices (2014-10-30)
- https://github.com/GoogleChrome/workbox/issues/488 ; https://github.com/whatwg/fetch/issues/214 ; https://bugzilla.mozilla.org/show_bug.cgi?id=1443850 — fragments exposed in SW request.url (2017)
- https://github.com/WICG/scroll-to-text-fragment/blob/main/fragment-directive-api.md ; https://web.dev/articles/text-fragments — `:~:` stripping (2020→)
- https://www.baeldung.com/cs/max-url-length ; https://urleditor.online/docs/parameters/max-length — browser URL caps (2024–2025)
- https://lettercounter.org/blog/discord-character-limit/ (2026) ; https://api.slack.com/changelog/2018-04-truncating-really-long-messages (2018-04)
- https://www.qrcode.com/en/about/version.html ; https://www.qrcodechimp.com/qr-code-storage-capacity-guide/ — QR capacity/practical limits
- https://mysk.blog/2020/10/25/link-previews/ — unfurl architectures, limits, leaks (2020-10-25)
- https://embracethered.com/blog/posts/2024/the-dangers-of-unfurling-and-what-you-can-do-about-it/ (2024) ; https://www.theregister.com/2026/02/10/ai_agents_messaging_apps_data_leak/ (2026-02-10)
- https://docs.slack.dev/messaging/unfurling-links-in-messages/ — Slack unfurl mechanics (current)
- https://theory.stanford.edu/~ataly/Papers/macaroons.pdf — Macaroons, NDSS (2014)
- https://www.clever.cloud/blog/engineering/2021/04/12/introduction-to-biscuit/ — Biscuit tokens (2021-04-12)
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler — scheme safelist (current)
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers — manifest handlers, not Baseline (current)
- https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API ; https://developer.chrome.com/docs/web-platform/launch-handler/ — Chrome 110+ (2023→)
- https://developer.chrome.com/blog/new-in-chrome-102 — File Handling ships Chrome/Edge 102 (2022-05)
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target — not Baseline (current)
- https://web.dev/blog/navigation-preload — SW startup 50/250/500ms + preload (2017)
- https://loke.dev/blog/service-worker-navigation-preload-performance — field numbers, 300ms LCP win (2026-02-21)
- https://developer.chrome.com/blog/service-worker-static-routing ; https://github.com/WICG/service-worker-static-routing-api — Chrome 123 (2024)
- https://github.com/explainers-by-googlers/service-worker-auto-preload ; https://chromeenterprise.google/policies/service-worker-auto-preload-enabled/ — auto preload (2024–2025)
- https://developer.chrome.com/docs/workbox/faster-multipage-applications-with-streams ; https://philipwalton.com/articles/smaller-html-payloads-with-service-workers/ — streaming shells
- https://github.com/ipfs/service-worker-gateway ; https://blog.ipfs.tech/2024-shipyard-improving-ipfs-on-the-web/ — SW gateway, inbrowser.link, first-load trade-off (2024-11-25)
- https://caniuse.com/import-maps ; https://shopify.engineering/resilient-import-maps (2025) — import maps Baseline; multiple maps Chrome 133/Safari 18.4
- https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API ; https://web.dev/blog/compressionstreams — Baseline 2023-05
- https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/util/serde.ts — `#pako:` compressed-fragment pattern (current)
- https://developer.chrome.com/docs/web-platform/prerender-pages ; https://calendar.perfplanet.com/2024/speculative-loading-and-the-speculation-rules-api/ — Speculation Rules (2024–2025)
- https://infrequently.org/2025/11/performance-inequality-gap-2026/ — 2026 budgets, Galaxy A24 baseline (2025-11-24)
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide — iOS PWA gaps (2026)
