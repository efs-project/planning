# Browser Git + OPFS: feasibility evidence for a no-install EFS wiki client

**Lane:** Git in the browser + local persistence — researched 2026-08-07

Legend used throughout: **(a)** implemented/shipped behavior, **(b)** documented intent, **(c)** recommendation, **(d)** speculation/inference.

## 1. Verdict in one paragraph

A no-install, fully client-side Git wiki client is feasible in 2026 for *wiki-sized* repos (tens of MB, thousands of files), with two viable engines (isomorphic-git in JS; libgit2 via wasm-git on OPFS), durable-enough local storage (OPFS + `navigator.storage.persist()`), and standard mitigations (shallow/`depth:1` clone, server-prepared bundles, on-demand object fetch) for anything bigger. The design that does NOT work is "treat the browser like a workstation clone of a large repo": full history of large repos hits memory ceilings (especially iOS Safari), single-threaded pack parsing, and small-file I/O overheads. GitHub itself does not run Git client-side for its web editor — github.dev is a virtual FS over the GitHub API (see §4) — which is the strongest prior-art signal that a hosted-index + thin-client hybrid is the pragmatic default, with real client-side Git reserved for offline/verification/exit paths.

## 2. isomorphic-git — state August 2026

- **(a) Actively maintained.** v1.40.0 released 2026-07-23; a dense stream of July 2026 releases (v1.38.8–v1.40.0) covering symlink safety, binary-file preservation in conflicted worktrees, `disallowEmpty`, changed-file object ids. ~8.3k stars, semantic-release per merged PR. [Releases](https://github.com/isomorphic-git/isomorphic-git/releases)
- **(a) Pure JS, bring-your-own `fs` + HTTP client.** Recommended browser FS is [LightningFS](https://github.com/isomorphic-git/lightning-fs) (IndexedDB-backed, same author); ZenFS and Filer also work. [README](https://github.com/isomorphic-git/isomorphic-git)
- **(a) Shallow clone: yes.** `clone`/`fetch` support `depth`, `since` (mutually exclusive with `depth`), `exclude`, `relative` (deepen), `singleBranch`, `noCheckout`, `noTags`. [clone docs](https://isomorphic-git.org/docs/en/clone.html)
- **(a) Partial clone (`filter=blob:none`): no.** No `filter` parameter exists in the clone/fetch API docs; not mentioned anywhere in the documentation. [clone docs](https://isomorphic-git.org/docs/en/clone.html)
- **(a/d) SHA-256 object format: no.** Not mentioned in docs or API; no shipped support found. Note GitHub.com itself still does not host SHA-256 repos ([community discussion](https://github.com/orgs/community/discussions/154056)), so this gap is currently shared with the wider forge ecosystem. Inference flag: absence-of-evidence for isomorphic-git, but consistent across all sources checked.
- **(a) Protocol: smart HTTP only** (no ssh, no `git://` — [#665](https://github.com/isomorphic-git/isomorphic-git/issues/665) declined). Browser use against GitHub-style remotes requires a **CORS proxy** ([@isomorphic-git/cors-proxy](https://github.com/isomorphic-git/isomorphic-git), self-hostable; free instance at cors.isomorphic-git.org). An EFS gateway that serves smart-HTTP with permissive CORS eliminates this dependency. **(c)**
- **(a) Performance posture:** docs concede that "reading and parsing git packfiles during clone, fetch, pull and push … can take a significant amount of time for large git repositories" and push an explicit shared `cache` parameter as the mitigation. [cache docs](https://isomorphic-git.org/docs/en/cache)
- **(a) Corruption caveat:** LightningFS "may apply file operations out of order," which can corrupt a repo if the process dies mid-operation; mitigation is `fs.flush()` after Git ops. [lightning-fs](https://github.com/isomorphic-git/lightning-fs) No OPFS backend is official; LightningFS remains IndexedDB-based.
- **(a) Known users** (README list): Stoplight Studio, Clever Cloud, Next Editor, GIT Web Terminal, git-app-manager, nde. [README](https://github.com/isomorphic-git/isomorphic-git)

## 3. libgit2 → WASM (wasm-git)

- **(a) Alive and current:** [petersalomonsen/wasm-git](https://github.com/petersalomonsen/wasm-git) tracks **libgit2 v1.9.4** built with **Emscripten 6.0.3**; CI green, ~837 stars.
- **(a) OPFS is a first-class backend now**, in three build variants:
  - `lg2_opfs.js` — pthreads/WASMFS, fastest, **~920 KB**, requires cross-origin isolation (COOP+COEP) for SharedArrayBuffer;
  - `lg2_opfs_jspi.js` — SAB-free via **JSPI**, **~805 KB** (JSPI is flag-free in Chrome 137+, per [PowerSync May 2026](https://powersync.com/blog/sqlite-persistence-on-the-web));
  - `lg2_opfs_async.js` — SAB-free via Asyncify, **~1.5 MB**, universal fallback, stack-rewriting overhead.
  Plus non-OPFS variants: sync `lg2.js` (worker-only) and Asyncify `lg2_async.js` (main-thread capable). Other FS backends: MEMFS, IDBFS, NODEFS.
- **(a) Constraint:** OPFS variants must run in a Web Worker (OPFS sync access handles are worker-only); OPFS's async metadata ops are bridged to synchronous libgit2 via pthreads/JSPI/Asyncify. Known WASMFS `getcwd()` wart with workaround documented.
- **(d) Implication:** wasm-git gives real-libgit2 semantics (true packfile handling, merge machinery) at ~1 MB wasm cost; isomorphic-git gives a smaller, more hackable pure-JS stack with a documented plugin surface. Neither does partial clone in the browser.

## 4. Other approaches — and what GitHub itself does

- **(a) github.dev is NOT client-side Git.** Per GitHub's docs: "The editor doesn't clone the repository, but instead uses the GitHub Repositories extension" to create "a virtual file system in memory"; edits live "in the browser's local storage until you commit"; terminals/tasks/debugging are disabled because there are no local files. Commits are made through the GitHub API. [github.dev docs](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor)
- **(a) vscode.dev's Remote Repositories / [GitHub Repositories extension](https://marketplace.visualstudio.com/items?itemName=GitHub.remotehub)** is the same mechanism: a `FileSystemProvider`-backed virtual workspace, on-demand file fetch over the API, no full clone; "Continue Working On" escalates to a codespace/local clone when real Git is needed.
- **(a) es-git (browser, legacy):** the old TypeScript browser Git ([es-git/es-git](https://github.com/es-git/es-git)) has been inactive for years — dead end. **Do not confuse** with **(a)** [toss/es-git](https://github.com/toss/es-git) (2025): libgit2 via Rust/N-API — **Node-only native module, not browser-capable**.
- **(a/d) WASI git ports:** no production-quality port of canonical git to WASI/browser found; wasm-git (Emscripten, not WASI) remains the only maintained libgit2-in-browser lineage. [libgit2#5059](https://github.com/libgit2/libgit2/issues/5059) (upstream "publish a libgit2.wasm") never shipped an official artifact.

## 5. OPFS durability semantics — 2026

Source of truth: [MDN storage quotas & eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) (page last modified 2026-01-05).

- **(a) Two modes:** *best-effort* (default; evictable under storage pressure, LRU, without notice) and *persistent* (`navigator.storage.persist()`; evicted only by explicit user action). Eviction is **all-or-nothing per origin**: IndexedDB, Cache API, and OPFS are wiped together.
- **(a) Safari's 7-day rule:** with ITP enabled, an origin with no user interaction (click/tap) in the last 7 days of browser use gets ALL script-written storage deleted. Installed home-screen web apps are the practical escape hatch.
- **(a) Real-world loss vectors beyond spec eviction:** documented reports (SQLite forum, ongoing) of **Windows storage cleanup and Edge deleting OPFS data even with persistent permission granted**, and **CCleaner-class utilities wiping OPFS** as "temp files." [sqlite forum thread](https://sqlite.org/forum/info/542fba6a46cec787)
- **(a) Chrome team's own research:** browser-initiated eviction is rare for regularly-visited origins ([web.dev OPFS](https://web.dev/articles/origin-private-file-system)) — but "rare" is not a durability guarantee.
- **(c) Design consequence for EFS:** the browser store must be treated as a **cache of a remotely reconstructible state**, never the only copy. This aligns exactly with EFS's chain/Arweave-anchored model: local OPFS = working copy; canonical state = signed records on EFS. Loss of local state must be a re-clone, not data loss.

## 6. Quotas per browser (MDN, Jan 2026)

| Browser | Best-effort | Persistent |
|---|---|---|
| Chrome/Edge (Chromium) | 60% of disk per origin | same (60%) |
| Firefox | min(10% of disk, 10 GiB group limit) | up to 50% of disk (cap 8 TiB) |
| Safari (macOS 14+/iOS 17+) | ~60% of disk (browser); **~15% embedded WebView**; ~60% for installed web app | prompt-based legacy: 1 GiB then ask |

Cross-origin frames get ~1/10 of parent quota (Safari). `navigator.storage.estimate()` for runtime checks. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) **(a)** Quota is not the binding constraint for a wiki client — memory and eviction are. **(d)**

## 7. IndexedDB vs OPFS for many small files; pack-based layout

- **(a)** OPFS with sync access handles in a worker is **3–4× faster than IndexedDB** for bulk binary I/O ([RxDB OPFS storage](https://rxdb.info/rx-storage-opfs.html)); one measured datapoint: 100 MB ArrayBuffer write ≈ 90 ms via `createSyncAccessHandle` vs ≈ 850 ms IndexedDB ([dbushell](https://dbushell.com/2023/10/02/storage-apis-downloading-files-for-offline-access/)).
- **(a) But per-file overhead is real:** opening OPFS file handles is async and comparatively expensive; RxDB notes ~4 ms main-thread→worker latency per round-trip, and IndexedDB actually wins on small datasets (<10k docs) and cold-start. [RxDB benchmarks](https://rxdb.info/rx-storage-performance.html)
- **(d→c) Consequence for Git's loose-object layout:** a naive `.git/objects/ab/cdef…` mirror onto OPFS pays handle-open cost per object. The proven mitigation is the same one SQLite-on-OPFS uses — **few large files, byte-range access**: keep objects in **packfiles + midx-style indexes** (one or two large OPFS files), or store the object DB inside SQLite-WASM. Production precedent: Notion shipped WASM SQLite on OPFS for all browser users ([Notion blog](https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite)); PowerSync reports `OPFSCoopSyncVFS` "keeps performing well even for databases over 1GB" while IndexedDB-based VFS degrades past ~100 MB ([PowerSync May 2026](https://powersync.com/blog/sqlite-persistence-on-the-web)); Lumafield got 3× project-load speedups moving to OPFS ([Lumafield](https://barndoors.lumafield.com/3x-faster-project-loads-with-the-origin-private-file-system/)).

## 8. Web Locks / multi-tab coordination

- **(a)** [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_Api) is Baseline (all engines since 2022) and is "supported everywhere OPFS is supported"; SQLite's newer `opfs-wl` VFS uses Web Locks for cross-tab locking (needs `Atomics.waitAsync`, widespread since late 2025). [SQLite forum RFC](https://sqlite.org/forum/info/0d82f3fa26cb584a06561a9d1d4d3e17c10c82391a85cebeca2737a13926e20a)
- **(a)** SharedWorkers **cannot** access OPFS sync handles; the working pattern is one dedicated worker owning the repo + cross-tab messaging, with a held Web Lock marking the live owner (PowerSync uses a held lock to detect tab suspension). [PowerSync](https://powersync.com/blog/sqlite-persistence-on-the-web)
- **(a)** OPFS `readwrite-unsafe` concurrent-access mode: Chrome 121+ only; not in Firefox/Safari — so single-writer-worker remains the portable design. **(c)** For an EFS wiki: one repo-owner worker per origin, Web Lock `efs-repo:<id>` for writer election, BroadcastChannel for invalidation.

## 9. Phones (iOS Safari)

- **(a)** OPFS + `createSyncAccessHandle` work on iOS Safari, but only in dedicated workers; `createWritable` streams were long unsupported on Safari ([theia#16107](https://github.com/eclipse-theia/theia/issues/16107) shows real-world Safari OPFS write bugs as recently as filed). Incognito Safari has **no OPFS at all** ([PowerSync](https://powersync.com/blog/sqlite-persistence-on-the-web)).
- **(a)** Memory: iOS Safari refuses large `WebAssembly.Memory` maxima (2 GB max errors; [godot#70621](https://github.com/godotengine/godot/issues/70621)) and reloads pages around ~1.5–3 GB real usage. Parsing a multi-hundred-MB packfile in memory is the failure mode; range-based/pack-index access is mandatory. **(c)**
- **(a)** Eviction is most aggressive here: 7-day ITP rule (§5), `persist()` harder to obtain, background apps can have access handles closed (Capacitor case, PowerSync). Installed-to-home-screen PWA gets app-like quota (~60%) and escapes the 7-day rule. **(c)** Treat phones as read-mostly + small-working-set clients.

## 10. Practical ceiling and standard mitigations (2026)

- **(d, converging evidence)** Realistic fully-client-side comfort zone: repos whose **checked-out working set is ≤ ~100–200 MB and object count is low-thousands**, cloned shallow. Evidence base: isomorphic-git's own large-repo warning (§2), IndexedDB degradation >100 MB and OPFS-SQLite comfort >1 GB (§7), iOS memory ceiling (§9). A Markdown wiki (text-dominant, few binaries) sits comfortably inside this envelope even with years of history; a monorepo or media-heavy repo does not.
- Mitigation ladder, all shipped in the wider ecosystem:
  1. **Shallow + single-branch clone** (`depth:1`, `singleBranch`) — supported by isomorphic-git today (§2) and canonical git; deepen on demand via `relative` depth. **(a)**
  2. **Partial clone (`--filter=blob:none`)** — canonical-git feature ([GitHub blog](https://github.blog/open-source/git/get-up-to-speed-with-partial-clone-and-shallow-clone/)); **absent from both browser engines**, so an EFS design cannot lean on it client-side today; the equivalent must be provided by the transport (on-demand object fetch below). **(a/c)**
  3. **Server-prepared bundles (`bundle-uri`)** — Git can bootstrap the object DB from a CDN-hosted bundle before topping up from the remote; GitLab shipped Gitaly bundle-URI offload to object storage (June 2025, [GitLab blog](https://about.gitlab.com/blog/reduce-the-load-on-gitlab-gitaly-with-bundle-uri/)); community CDN clones exist (GitDelivr on Cloudflare R2, 2026, [HN](https://news.ycombinator.com/item?id=47216384)); mechanics deep-dive: [GitButler](https://blog.gitbutler.com/going-down-the-rabbit-hole-of-gits-new-bundle-uri). For EFS this maps beautifully onto **Arweave/EthStorage-hosted pack bundles**: immutable, content-addressed, CDN-cacheable, verifiable — the browser fetches a pre-built pack + index instead of speaking pack-negotiation. **(c)**
  4. **On-demand object fetch over a virtual FS** — the github.dev model (§4): don't clone at all for reading/light editing; fetch tree/blob objects lazily from an index (for EFS: lens-served records / EthStorage reads), and only materialize a real local Git repo when the user opts into offline/verification/exit. **(c)**

## 11. Implications for the EFS wiki client (recommendations)

1. **Two-tier client (c):** default tier = github.dev-style virtual FS reading EFS records lazily (anonymous-read friendly, zero storage commitment); opt-in tier = real local repo (wasm-git-on-OPFS or isomorphic-git) for offline editing, independent verification, and walk-away exit. GitHub's own architecture is precedent that the default tier needs no client-side Git at all.
2. **Local store = cache, never custody (c):** OPFS eviction semantics (§5) forbid treating the browser as a durable replica; EFS's chain-anchored canonical state makes this cheap to accept. Call `navigator.storage.persist()` and surface the result honestly in UI.
3. **Pack-not-loose on OPFS (c):** store the object DB as few large pack/index files (or inside SQLite-WASM) with byte-range reads; avoid mirroring `.git/objects` loose layout.
4. **Serve smart-HTTP with CORS from EFS gateways (c):** removes the isomorphic-git CORS-proxy trust hole; additionally publish **bundle-uri-style immutable pack bundles to Arweave/EthStorage** so clone bootstrap is verifiable and gateway-load-free.
5. **Single-writer worker + Web Locks (c):** portable multi-tab design today; don't depend on Chrome-only `readwrite-unsafe`.
6. **Phones are read-mostly (c):** shallow single-branch working sets, range-read packs, PWA install prompt for anyone editing seriously on iOS.
7. **SHA-256 is not a blocker but is unhosted everywhere (a/d):** neither browser engine nor GitHub supports SHA-256 repos; EFS record-level signing/hashing already provides the integrity upgrade Git's SHA-256 transition seeks, so pin repo format at SHA-1 for interop and rely on EFS-layer hashes for security claims.

## Sources

- https://github.com/isomorphic-git/isomorphic-git
- https://github.com/isomorphic-git/isomorphic-git/releases
- https://isomorphic-git.org/docs/en/clone.html
- https://isomorphic-git.org/docs/en/cache
- https://github.com/isomorphic-git/lightning-fs
- https://github.com/isomorphic-git/isomorphic-git/issues/665
- https://github.com/petersalomonsen/wasm-git
- https://github.com/libgit2/libgit2/issues/5059
- https://github.com/es-git/es-git
- https://github.com/toss/es-git
- https://docs.github.com/en/codespaces/the-githubdev-web-based-editor
- https://marketplace.visualstudio.com/items?itemName=GitHub.remotehub
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
- https://web.dev/articles/origin-private-file-system
- https://sqlite.org/forum/info/542fba6a46cec787
- https://sqlite.org/forum/info/0d82f3fa26cb584a06561a9d1d4d3e17c10c82391a85cebeca2737a13926e20a
- https://sqlite.org/wasm/doc/trunk/persistence.md
- https://powersync.com/blog/sqlite-persistence-on-the-web
- https://rxdb.info/rx-storage-opfs.html
- https://rxdb.info/rx-storage-performance.html
- https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite
- https://barndoors.lumafield.com/3x-faster-project-loads-with-the-origin-private-file-system/
- https://dbushell.com/2023/10/02/storage-apis-downloading-files-for-offline-access/
- https://github.com/eclipse-theia/theia/issues/16107
- https://github.com/godotengine/godot/issues/70621
- https://github.blog/open-source/git/get-up-to-speed-with-partial-clone-and-shallow-clone/
- https://about.gitlab.com/blog/reduce-the-load-on-gitlab-gitaly-with-bundle-uri/
- https://docs.gitlab.com/administration/gitaly/bundle_uris/
- https://blog.gitbutler.com/going-down-the-rabbit-hole-of-gits-new-bundle-uri
- https://news.ycombinator.com/item?id=47216384
- https://github.com/orgs/community/discussions/154056
