# Browser storage durability, quota, eviction, and multi-context coordination — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** storage-durability. **Date:** 2026-07-07.

## Executive framing

The browser gives EFS a large but **revocable** disk. Quotas are generous (hundreds of GB on Chromium/Firefox/Safari-17+), but every byte lives under three independent deletion authorities: (1) browser eviction under storage pressure, (2) platform privacy policies (Safari ITP's 7-day wipe), and (3) the user's own "clear site data" — which no API can veto. There is **no eviction notification of any kind**: the app discovers loss only by looking. `navigator.storage.persist()` is real but weaker than its name (Chrome silently denies low-engagement origins; Safari grants it and then ITP deletes the data anyway, a bug open since 2020). The only strong durability signal on Apple platforms is *installed home-screen/Dock web app*. Consequence for EFS: the persistence layer must be designed around **protection tiers**, not around a hoped-for durable disk — everything content-addressed is disposable cache; the write journal, unreleased signed bundles, and non-derivable keys must either escape the browser (export, escrow, wallet-derived re-creation) or be honestly labeled as at-risk.

---

## 1. WHAT EXISTS TODAY (shipped, with support reality)

### 1.1 `StorageManager.persist()` — what it actually does

- Available in all engines since ~Dec 2021 (Safari 15.2+). Secure contexts only. (MDN, current 2026.)
- **Chrome/Chromium:** no prompt; auto-grant based on heuristics — site engagement score, installed/bookmarked, notification permission. "If a site is considered important, the permission is automatically granted, otherwise it is **silently denied**" (web.dev, *Persistent storage*). Denials can be re-evaluated later. A brand-new EFS user's origin will usually be denied on day one.
- **Firefox:** shows a real permission prompt to the user.
- **Safari/WebKit:** no prompt; grants "based on heuristics like whether the website is opened as a Home Screen Web App" (WebKit blog 14403, 2023-08-10).
- **What granted persistence buys:** exclusion from automatic LRU eviction under storage pressure. **What it does not buy:** protection from the user clearing site data, from profile deletion, or (critically) from Safari ITP's 7-day deletion — see 1.3.
- `persisted()` reports current mode; poll it at boot — it can be true one day and the data still gone the next on Safari.

### 1.2 Quota math, 2026 numbers (MDN *Storage quotas and eviction criteria*, current)

| Engine | Best-effort per-origin | Persistent per-origin | Browser-wide cap | Notes |
|---|---|---|---|---|
| Chrome/Chromium | 60% of **total** disk | same 60% | 80% of disk | Computed on total disk, not free space (anti-fingerprinting). |
| Firefox | min(10% of disk, **10 GiB** eTLD+1 group limit) | 50% of disk, cap 8 TiB, **no group limit** | — | persist() flips you out of the 10 GiB cage. |
| Safari 17+ (macOS 14/iOS 17+) | ~60% of disk (browser apps); **15%** in WKWebView-embedded apps | heuristic | 80% (browsers), 20% (WKWebView) | Home-screen/Dock web app gets the 60% class. Cross-origin frames get ~1/10 of the parent origin's quota. Safari 17 dropped the old "1 GiB then prompt" behavior. |

- `localStorage`/`sessionStorage`: ~5 MiB each — useless for data, useful for sentinels.
- `navigator.storage.estimate()` returns **estimates**: opaque (no-cors) cross-origin responses cached via Cache API are padded — in Chrome a few-KB opaque response bills ~**7 MB** against quota (Chrome Developers, *Estimating Available Storage Space*). Chrome-only `usageDetails` gives a per-mechanism breakdown.
- Storage partitioning (Chrome 115+, Firefox and Safari earlier): third-party-iframe contexts get a **separate partition** with its own quota. An EFS client iframed into someone else's site does not see the user's real EFS storage.

### 1.3 Eviction policies and Safari's 7-day rule

- **All engines:** under storage pressure, evict **whole origins, LRU order**, skipping persisted origins. Eviction is **atomic per origin** — IndexedDB, Cache API, OPFS, service-worker registrations all vanish together (MDN). This is a feature for consistency and a catastrophe for "at least the journal survived" hopes: nothing survives partially.
- **Safari proactive eviction (ITP):** after **7 days of Safari use** without user interaction on the site, all script-writable storage is deleted — IndexedDB, localStorage, media keys, SessionStorage, service-worker registrations and cache (WebKit blog 10218, 2020-03-24; still the documented policy on MDN in 2026). Days without opening Safari don't count; any tap/click on the site resets the counter.
- **Installed-PWA exemption (confirmed, still true 2026):** web apps added to the Home Screen (iOS, since 2020) or macOS Dock (Safari 17+, Oct 2023) keep their own days-of-use counter; WebKit calls first-party data deletion inside a home-screen web app "a serious bug."
- **persist() does NOT exempt from ITP:** WebKit bug 209563 (filed 2020-03-25, still **NEW** as of 2025-07-24) documents that Safari grants `persist()` yet ITP deletes the data anyway ("even though Safari seems to grant persistence through this API, ITP still blows away the site's data after 7 days" — comment, Nov 2023). Treat Safari-in-browser storage as a ~7-day lease.
- Chromium data point: actual storage-pressure eviction is rare for regularly-visited sites (web.dev), so on desktop Chrome the practical threats are user clearing and profile loss, not LRU.
- Platform risk lesson: Apple disabled EU home-screen web apps in the iOS 17.4 beta (Feb 2024) and reversed only after backlash and a European Commission inquiry (2024-03-01). Installed-PWA privileges are policy, not physics.

### 1.4 IndexedDB reliability record

- **Durability semantics:** Chrome 121 (early 2024) switched default transaction durability from `strict` to `relaxed`, matching Firefox/Safari. Relaxed = "complete" fires once data reaches the **OS buffer** (flushed "every couple seconds"); a crash/power failure in that window loses committed-looking transactions. Chrome saw 3–30× speedups. `{durability: "strict"}` still available per-transaction; Chrome's own guidance: use strict for migrations and anything where you must *know* it hit disk (Chrome Developers blog, 2023-11-03).
- **Corruption history (all engines, but Safari worst):**
  - Chrome's IDB sits on LevelDB; documented failure modes include "Corruption: checksum mismatch," recovery-failure loops, and corruption after unclean Windows shutdown or full disk (crbug 146284 et al.; Signal-Desktop #1144 hit full-disk corruption in production).
  - Safari 14.1.1 (June 2021) shipped with IDB failing to open on first load; Safari 15 (fixed 15.3, Jan 2022) leaked IDB database names cross-origin; Safari has a long wishlist of IDB bugs (Dexie maintainer's gist), including WAL files growing to gigabytes without GC.
  - **WebKit bug 266559:** Safari **periodically erased LocalStorage + IndexedDB for all websites** (`OriginStorageManager::deleteData()` mis-invoked; "vnode unlinked while in use"); fixed in Safari 17.4 (commit 2024-01-11), with lingering reports into mid-2024. Whole-profile data loss shipped in a stable browser.
  - Community post-mortems ("The pain and anguish of using IndexedDB," 2021; HN threads) consistently report: multi-tab concurrent writes corrupt databases without app-level locking; recovery = user manually clearing site data.
- Practical reading: IDB is fine as a **cache** index and small-object store; it is not trustworthy as the *sole* home of irreplaceable data, especially on WebKit.

### 1.5 OPFS and SQLite-WASM (maturity 2026)

- **Support:** OPFS (`navigator.storage.getDirectory()`) — Chrome 86+, Safari 15.2+, Firefox 111+ (Mar 2023). `FileSystemSyncAccessHandle` (sync, worker-only): Chrome 102+, Safari 15.2+ (all-sync methods since ~16.4), Firefox 111+. Not available on the main thread, not from a SharedWorker.
- **Performance:** community benchmark: writing a 100 MB ArrayBuffer ≈ **90 ms** via SyncAccessHandle vs ≈ **850 ms** via IndexedDB; wins come from skipping structured clone and event-loop overhead (renderlog, 2025; consistent with web.dev *The origin private file system*).
- **SQLite-on-OPFS, state of the art (PowerSync, "The Current State of SQLite Persistence on the Web," May 2026 update):**
  - `wa-sqlite` **OPFSCoopSyncVFS** = recommended general-purpose VFS; "excellent performance, even with large databases" — stays fast **>1 GB**; works on recent versions of all major browsers; needs dedicated workers (SharedWorkers can't hold OPFS sync handles, and Chrome/Safari can't spawn dedicated workers from a SharedWorker); can throw `SQLITE_BUSY` mid-transaction → retry logic required.
  - **IDBBatchAtomicVFS** = fallback for old browsers and Safari-incognito (no OPFS there); degrades at 100 MB+; large query results can stack-overflow on Safari.
  - **OPFSWriteAheadVFS** (added Apr 2026): concurrent reads during writes, Chrome 121+, **weak durability by default** (`PRAGMA synchronous` restores it at a cost).
  - Official sqlite3 WASM OPFS VFS still "not recommended over wa-sqlite" because it requires COOP/COEP (cross-origin isolation).
  - Chrome incognito: ~100 MB database limit with unexpected failures beyond it. Capacitor/WKWebView: access handles close when app is backgrounded.
- **Production proof:** Notion (blog, 2024-07-10) ships SQLite-WASM on **OPFS SyncAccessHandle Pool VFS** (chosen to avoid COOP/COEP, which was "an unrealistic ask" given third-party scripts). Architecture: **SharedWorker as query router → one "active tab's" dedicated worker owns the OPFS handles**; Web Locks detect tab death. Results: 20% faster page navigation overall (28–33% in AU/CN/IN). Failures they hit: multi-tab simultaneous writes **corrupted the database** (hence single-writer design), WASM download slowed first load (fixed by async load + racing SQLite vs API), slow devices regressed (disk reads slower than network!) → they keep a kill-switch/racing fallback.

### 1.6 Cache API vs IDB vs OPFS for large blobs

- **Cache API:** streams responses (render-before-fully-read), designed for the service-worker fetch path, fine for app-shell/package bytes. Trap: opaque responses' 7 MB quota padding — only cache same-origin or CORS-readable, integrity-verifiable responses (EFS should never cache opaque bytes anyway: can't hash-verify them).
- **IndexedDB:** structured data + small blobs; structured-clone cost on every read/write; Blob handling historically buggy on WebKit.
- **OPFS:** best for large mutable files and hash-verified byte caches; random access; sync handles in workers; an OPFS file is invisible to the SW fetch cache, so you serve it yourself.
- All three share one origin quota and die together on eviction. Eviction differences exist only via Storage Buckets (below) or persist().

### 1.7 Storage Buckets API

- Shipped **Chromium 122 (2024-02-20), Chromium-only**. WICG spec; Firefox position positive but unimplemented; **WebKit: no signal** (chromestatus 5739224579964928).
- `navigator.storageBuckets.open('drafts', {persisted: true, durability: 'strict'})` → named buckets, each with independent quota, persistence bit, durability default, expiry, and **independent eviction** ("the browser may choose to delete each bucket independently"). Today only IndexedDB (+Cache in spec) is exposed per-bucket (Chrome docs, *Storage Buckets*).
- Bonus: separate buckets = separate IDB backends = real write parallelism (Chrome blog, *Maximum IndexedDB performance with Storage Buckets*).
- Verdict: exactly the eviction-priority primitive EFS wants ("evict byte cache before journal"), but it's a Chromium progressive enhancement, not a foundation.

### 1.8 Multi-context coordination

- **Web Locks API:** universal since Safari 15.4/Firefox 96 (2022); origin-scoped named locks, held-lock auto-release on tab crash/close → the standard **leader election** primitive: every context requests `efs-kernel-leader`; whoever holds it is the single writer; next-in-queue takes over on death instantly (MDN; w3c/web-locks explainer). `steal` and `ifAvailable` options exist; locks are advisory only.
- **BroadcastChannel:** universal since Safari 15.4 (2022); fire-and-forget pub/sub between same-origin contexts; no state, no ordering guarantees; pairs with Web Locks (locks pick the leader, channel broadcasts state).
- **SharedWorker support reality:** Safari removed it years ago, reinstated in **Safari 16.0 (Sept 2022)**. **Chrome for Android: unsupported for a decade** — re-enabled in **Chrome 148** (beta 2026-04-08; stable ~May 2026), including new `extendedLifetime: true` to outlive its clients. Until 148 is the floor, any architecture requiring SharedWorker needs a Web-Locks-elected dedicated-worker fallback on Android (livestore #321 documents the pain).
- **Service worker + storage races:** the SW is killed and restarted aggressively (idle ~30 s); an in-flight IDB transaction in a killed worker simply aborts — with relaxed durability the data may never hit disk. Coordinate SW-vs-page writes with Web Locks; keep SW writes small, idempotent, `waitUntil`-wrapped; never let the SW be the journal's only writer.
- **Known corruption vector:** multi-tab IDB writes without locking (see 1.4, Notion's corruption in 1.5). Single-writer via Web Locks is the industry-converged answer (Notion, PowerSync, LiveStore all landed there).

### 1.9 Eviction notification and loss detection

- **There is no eviction event.** No API tells a page its origin data was evicted, ITP-wiped, or user-cleared. For *persistent* buckets the spec says browsers should ask the user before clearing — but best-effort data goes silently (MDN Storage API).
- Detection is DIY, and the ecosystem pattern is: write a **generation sentinel** (install UUID + epoch counter) into every store (localStorage, IDB meta row, OPFS file, Cache entry, SW-side) at each clean shutdown/boot; at boot, compare. All-missing → origin wipe (eviction/ITP/user-clear). Some-missing → partial corruption (worse; treat all local state as suspect). Also compare `navigator.storage.estimate().usage` against last-known and re-check `persisted()`.
- Because eviction is origin-atomic, "the cache survived but the journal didn't" cannot happen via eviction — but it **can** happen via corruption (1.4) and via app-level bugs, so per-store sentinels still pay.

### 1.10 Backup/export paths

- **File System Access API (real disk):** Chromium-only (Chrome/Edge 86+). Firefox: pickers flagged **harmful** in standards position; Safari: OPFS only, no pickers, no commitment (caniuse, MDN, 2025-2026). `showDirectoryPicker()` handles are structured-cloneable into IDB; since **Chrome 122** (persistent permissions) a stored handle + `requestPermission()` can be re-granted across restarts without re-picking, sometimes silently. This enables "EFS keeps a live mirror of journal + signed bundles in ~/EFS-backup" — on Chromium only.
- Everywhere else: classic `<a download>` blob export (user gesture, manual) and file-input re-import; Web Share API on mobile. No silent background write to user disk outside Chromium.

### 1.11 Encryption at rest

- **Nothing native.** Browser profile storage (IDB/OPFS/Cache) is plaintext-on-disk to the OS user account, modulo full-disk encryption. One meaningful exception: WebKit wraps stored WebCrypto keys with a master key in the **system keychain** (dchest.com, 2025-06-17, on WKWebView/Safari), so a `CryptoKey`-in-IDB on Apple platforms gets keychain-grade at-rest protection.
- **Non-extractable `CryptoKey` semantics:** `CryptoKey` participates in structured clone → storable in IDB and postMessage-able. `extractable: false` prevents *JS* from exporting the material (XSS can *use* the key but not exfiltrate it — rate-limitable, revocable); it does **not** mean hardware-backed on Chrome/Firefox, where the material sits (obfuscated) in profile files. W3C WebCrypto explicitly expects IDB as the CryptoKey store.
- **Passkey PRF extension (shipped, broadening):** derive a deterministic 32-byte secret from a passkey inside the authenticator during auth → symmetric key for local-data encryption; root secret never leaves hardware. Support: macOS 15 via iCloud Keychain across Safari 18+/Chrome 132+/Firefox 139; Windows Hello returns PRF since the Feb 2026 update; synced providers at ~100% PRF-on-create in Q1-2026 community testing (Corbado; Yubico dev guide; Bitwarden). This is the strongest browser-available "key that survives origin eviction" primitive: the *key* lives in the authenticator/passkey ecosystem, not in origin storage.

---

## 2. WHAT IS EMERGING (status + date)

- **Storage Buckets** standardization: WICG draft; Firefox positive/unimplemented; WebKit silent (2026). Chromium-only for the foreseeable future.
- **SharedWorker on Android** (Chrome 148, beta 2026-04-08) + `extendedLifetime` — closes the last big SharedWorker gap; still verify stable rollout and lifecycle behavior before depending on it.
- **OPFSWriteAheadVFS** (wa-sqlite, Apr 2026): concurrent-read WAL-style VFS, Chrome 121+, young.
- **WebKit bug 209563 activity** (PR referenced 2025-07-24): possible future persist()-vs-ITP fix; do not plan on it.
- **PRF ubiquity** (2025→2026): rapidly becoming dependable across platform authenticators.
- **QuotaExceededError** being respecified as a DOMException subclass with richer fields (WHATWG, 2025) — minor.

## 3. WHAT WOULD BE AN EFS-SPECIFIC INVENTION

- A **tiered protection model** for origin storage (disposable / re-creatable / irreplaceable) with per-tier homes, budgets, and honest UI states — no framework ships this.
- **Wallet-derived storage keys**: deriving the journal-encryption key from a deterministic wallet signature (EIP-712 over a fixed domain message → HKDF), making encrypted local state *re-openable after total eviction* as long as the user keeps their wallet. Nothing in the web platform offers key durability across origin wipes; PRF comes closest.
- A **freshness/possession ledger** ("what did I have, as of when, from which venue") that is itself evictable and therefore must degrade to honest `UNKNOWN` grades rather than fabricated confidence.
- **Time-at-risk accounting** for signed-but-unsubmitted bundles (age × replication count), driving export/escrow nudges.

---

## 4. LESSONS AND TRAPS (from deployed systems)

1. **persist() granted ≠ durable.** Chrome silently denies new origins (exactly the first-run EFS user); Safari grants it and ITP deletes anyway (bug 209563, open 2020→2025); nothing stops user clearing. Never gate the honesty UI on `persisted() === true`.
2. **Eviction is origin-atomic and silent.** All stores die together, including the service-worker registration — your offline boot path evaporates with your data. Bootstrapper must treat "no SW, no caches" as a first-class cold-start, not an error.
3. **Multi-writer IDB/OPFS corrupts.** Notion corrupted rows with concurrent tab writes; community post-mortems agree. Single elected writer (Web Locks) is the converged industry pattern.
4. **WebKit ships storage-destroying bugs into stable** (14.1.1 IDB-broken 2021; cross-origin DB-name leak 2022; whole-profile periodic erasure fixed 17.4/2024). Design as if any single store can be lost or corrupted on Safari at any time.
5. **Relaxed durability is now the default everywhere** (Chrome 121+ matching Firefox/Safari): "transaction complete" no longer means "on disk." Journal commits need `durability:'strict'` (and even strict has a residual window).
6. **Quota lies at the edges:** opaque-response 7 MB padding; estimate() is padded and partition-scoped; Chrome-incognito 100 MB SQLite ceiling; Safari-incognito has no OPFS; WKWebView origins get 15% not 60%. Probe, don't assume.
7. **Platform policy risk is real:** Apple's EU PWA removal (Feb 2024) was reversed only under regulatory pressure. An installed-PWA-only durability story is a single point of failure owned by a vendor.

---

## 5. EFS TRANSLATION — opinionated recommendations for client v2

**R1. Make the Client Persistence Layer a tiered subsystem with named protection classes.**
- **Tier A — re-fetchable (best-effort):** record cache, byte cache (hash-verified), view cache, thumbnail cache, package cache. Home: OPFS (bytes/packages, via SyncAccessHandle in the Kernel's storage worker) + IDB (records/views) + Cache API (app shell only, same-origin/CORS-verifiable responses only — never opaque). Self-imposed per-stratum budgets with own LRU, sized from `estimate()` minus safety margin. Loss = cache miss, re-fetch, no drama.
- **Tier B — locally authored, unsigned (journal/drafts):** `durability:'strict'` commits; on Chromium, a dedicated **persisted Storage Bucket** (`{persisted:true, durability:'strict'}`); duplicated small (journal is tiny) into a second store (IDB + OPFS file) with checksums to survive single-store corruption (not eviction — that's atomic).
- **Tier C — signed, unsubmitted bundles:** the most dangerous loss class (author committed, world has nothing). Treat as authored artifacts: immediately exportable `.efs-bundle`; track **time-at-risk**; nudge/automate off-device replication.
- **Tier D — keys:** never store a sole non-derivable key in origin storage. Prefer (a) wallet-derived via deterministic signature→HKDF (recoverable after total wipe), (b) passkey-PRF-derived (hardware-rooted, survives origin eviction), (c) non-extractable CryptoKey in IDB only as a *convenience cache* of (a)/(b).

**R2. Single-writer Kernel storage, elected with Web Locks.** One dedicated worker owns all OPFS sync handles and IDB writes; every tab's Kernel requests the `efs-storage-owner` lock; BroadcastChannel fans out invalidations. Do not build on SharedWorker until Chrome 148+ is a safe floor (Android shipped ~May 2026; check adoption); when available, use it only as a router (it cannot hold OPFS sync handles), i.e., the Notion topology.

**R3. Boot-time loss detection, wired into read grades.** Generation sentinels in every store + estimate()/persisted() deltas. On wipe detection: emit a Shell-visible "the browser deleted this profile's local data on <date-ish>" event; downgrade all freshness claims to venue-qualified UNKNOWN until re-synced; re-fetch Tier A silently; report Tier B/C losses explicitly against the last export/escrow record ("3 drafts and 1 signed bundle were only stored here"). Never reconstruct silently and pretend continuity.

**R4. Platform-honest durability messaging.** Detect the storage class the profile actually has: Safari-in-tab = "7-day lease" (recommend Add to Home Screen/Dock — the only real ITP exemption); Chromium = request persist() after meaningful engagement and installed-PWA prompt; Firefox = fire the persist() prompt at an earned moment (it's a real user prompt — don't waste it on first load). Surface the current tier in the Sync/Storage center, not as a scary modal.

**R5. Backup as a first-class OS service, capability-gated.** Chromium: FS-Access directory handle ("EFS backup folder"), persisted in IDB, re-validated via `requestPermission()` (Chrome 122+ persistent permissions) — continuous journal/bundle mirroring to real disk. Safari/Firefox: explicit `.efs-bundle` download/export flows + import. Optional encrypted remote escrow must be a user-granted endpoint capability (fits the no-ambient-HTTP rule) — e.g., the user's own mirror or any EFS venue.

**R6. Storage engine choices:** OPFS + wa-sqlite `OPFSCoopSyncVFS` for the record/view indexes if SQL is wanted (proven >1 GB, all engines, May 2026); `IDBBatchAtomicVFS` fallback (old browsers, Safari incognito); handle `SQLITE_BUSY` mid-transaction; keep raw hash-addressed bytes as plain OPFS files, not DB blobs. Never require COOP/COEP for storage (Notion's lesson; it also breaks EFS's embedding stories).

**R7. Verify-on-read everywhere.** All Tier A entries are content-addressed: hash-check on read; mismatch → delete + refetch (corruption becomes a cache miss). Journal entries carry per-record checksums + monotonic sequence; a torn tail (relaxed-durability crash) truncates to last-good, and the Shell shows what was rolled back.

**R8. Quota citizenship:** meter per-stratum usage with Chrome's `usageDetails` where present; degrade gracefully at self-imposed watermarks (shrink byte cache before view cache before record cache); handle `QuotaExceededError` as routine flow control on every write path.

## 6. Where EFS v2 protocol design conflicts or under-supports

1. **Signed-but-unsubmitted bundles need a normative portable format.** Browser storage cannot be the canonical home of a signed envelope awaiting flush. The envelope spec should define a self-contained, venue-neutral export encoding (header + records + signature + submission progress) so any copy is replayable — the client's `.efs-bundle` should be a protocol artifact, not a client invention. (Also the danger side: a signed bundle is submittable by anyone who holds it; the export/escrow path must say so.)
2. **"Sign early vs sign late" is a durability decision the protocol currently leaves to UX.** Unsigned journal loss = silent work loss; early signing protects against browser eviction but creates irrevocable artifacts. Envelope design could ease this with cheap incremental commitment (e.g., chained/extendable roots or session-key-signed micro-envelopes later aggregated) so "durable authored artifact" doesn't require a wallet ceremony per save.
3. **Read grades assume you know what you knew.** Post-eviction, the client loses the provenance/checkpoint metadata that venue-qualified freshness labels depend on. The read-grade model should explicitly define the degraded state after local-state loss (everything falls to UNKNOWN-at-this-client until re-verified) so Shells across implementations behave identically instead of inventing optimistic defaults.
4. **Deterministic client-computable IDs are a durability asset — keep them strict.** If journal *intents* (not just built records) are deterministic, replaying app-level intents after a wipe regenerates byte-identical records/IDs, enabling idempotent recovery and dedup against partially-admitted envelopes. Worth stating as a protocol-level property test.
5. **Lens/trust config is irreplaceable local state too.** If lens orders/deny lists are only local, eviction silently changes what the user sees (a truth bug, not just data loss). Protocol/SDK should make lens config exportable/attestable (or storable as EFS records under the user's address) so a wiped client can restore its viewing policy verifiably.

---

## Sources (fetched/verified 2026-07-07)

- MDN — Storage quotas and eviction criteria (current 2026): https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- MDN — StorageManager.persist(): https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- web.dev — Persistent storage (Chrome heuristics): https://web.dev/articles/persistent-storage
- WebKit blog 14403 — Updates to Storage Policy (2023-08-10): https://webkit.org/blog/14403/updates-to-storage-policy/
- WebKit blog 10218 — Full Third-Party Cookie Blocking and More / 7-day cap (2020-03-24): https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- WebKit bug 209563 — persist() vs ITP 7-day, still NEW (2020-03-25 → 2025-07-24): https://bugs.webkit.org/show_bug.cgi?id=209563
- WebKit bug 266559 — Safari periodically erasing LocalStorage/IndexedDB, fixed 17.4 (2024-01-11): https://bugs.webkit.org/show_bug.cgi?id=266559
- Chrome Developers — IndexedDB durability defaults to relaxed, Chrome 121 (2023-11-03): https://developer.chrome.com/blog/indexeddb-durability-mode-now-defaults-to-relaxed
- Chrome Developers — Storage Buckets (shipped Chromium 122, 2024-02-20): https://developer.chrome.com/docs/web-platform/storage-buckets
- chromestatus — Storage Buckets API (Firefox positive, WebKit no signal): https://chromestatus.com/feature/5739224579964928
- Chrome Developers — Maximum IndexedDB performance with Storage Buckets: https://developer.chrome.com/blog/maximum-idb-performance-with-storage-buckets
- Chrome Developers — Estimating Available Storage Space (opaque-response ~7 MB padding): https://developer.chrome.com/blog/estimating-available-storage-space
- Privacy Sandbox — Storage Partitioning (Chrome 115+): https://privacysandbox.google.com/cookies/storage-partitioning
- PowerSync — The Current State of SQLite Persistence on the Web (May 2026 update): https://powersync.com/blog/sqlite-persistence-on-the-web
- Notion — How we sped up Notion in the browser with WASM SQLite (2024-07-10): https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite
- web.dev — The origin private file system: https://web.dev/articles/origin-private-file-system
- renderlog — OPFS explained (100 MB write: ~90 ms OPFS vs ~850 ms IDB, 2025): https://renderlog.in/blog/origin-private-file-system-opfs/
- MDN — Web Locks API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
- w3c/web-locks explainer (leader election): https://github.com/w3c/web-locks/blob/main/EXPLAINER.md
- caniuse — Shared Web Workers (Safari 16.0 reinstated; Chrome Android gap): https://caniuse.com/sharedworkers
- chromestatus — SharedWorker on Android: https://chromestatus.com/feature/6265472244514816
- Notebookcheck — Chrome 148 Beta for Android adds SharedWorker + extendedLifetime (2026-04-08): https://www.notebookcheck.net/Chrome-148-Beta-for-Android-adds-Web-Serial-SharedWorker-support.1269721.0.html
- livestore #321 — SharedWorker-on-Android pain + fallbacks: https://github.com/livestorejs/livestore/issues/321
- pesterhazy — The pain and anguish of using IndexedDB (2021 catalog of failures): https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a
- Dexie maintainer — Safari IndexedDB bug wishlist: https://gist.github.com/dfahlander/b2098960575cba6827a80fdf260b9035
- The Register — Safari 14.1.1 IndexedDB broken (2021-06-16): https://www.theregister.com/2021/06/16/apple_safari_indexeddb_bug/
- The Register — Safari 15 IndexedDB cross-origin leak, fixed 15.3 (2022-01-21): https://www.theregister.com/2022/01/21/apple_safari_webkit_indexeddb/
- Chromium — IndexedDB LevelDB docs + corruption/recovery: https://chromium.googlesource.com/chromium/src/+/master/content/browser/indexed_db/docs/README.md
- Signal-Desktop #1144 — full disk → message store corruption: https://github.com/signalapp/Signal-Desktop/issues/1144
- Chrome Developers — Persistent permissions for the File System Access API (Chrome 122): https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api
- caniuse — File System Access API (Chromium-only pickers): https://caniuse.com/native-filesystem-api
- MDN — File System API (Firefox "harmful" position on pickers; OPFS-only in FF/Safari): https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
- dchest — How to store web app data in the system keychain (2025-06-17): https://dchest.com/2025/06/17/how-to-store-web-data-in-keychain/
- W3C — Web Cryptography Level 2 (CryptoKey structured clone/IDB): https://www.w3.org/TR/webcrypto-2/
- Corbado — Passkeys & WebAuthn PRF for E2E encryption (2026 support matrix): https://www.corbado.com/blog/passkeys-prf-webauthn
- Yubico — Developer's Guide to PRF: https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/Developers_Guide_to_PRF.html
- TechCrunch — Apple reverses EU home-screen web app removal (2024-03-01): https://techcrunch.com/2024/03/01/apple-reverses-decision-about-blocking-web-apps-on-iphones-in-the-eu/
