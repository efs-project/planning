# Local-first sync, op logs, CRDTs, offline truth — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** local-first. **Date:** 2026-07-07.

## 0. Frame: what EFS is and is not, in local-first terms

EFS is **not** collaborative-CRDT-shaped. It is per-author LWW slots with signed records and a
venue (chain) as the admission authority. In local-first taxonomy that makes it
**Figma/Linear-shaped** (authoritative venue orders writes; per-field last-writer-wins; conflicts
rare by construction), not Google-Docs/Automerge-shaped (peer merge of concurrent edits). The
transferable disciplines from a decade of local-first work are therefore:

1. **Journal/outbox discipline** — durable, ordered, idempotent, store-and-forward.
2. **Rebase discipline** — optimistic overlay = pending ops replayed on top of the last confirmed
   authoritative snapshot, never ad-hoc merging.
3. **Honest state labeling** — pending vs confirmed is a first-class, user-visible distinction.
4. **Single-writer coordination** — one journal writer per origin, elected, with follower tabs.
5. **Durability hygiene** — browser storage is evictable; unsigned drafts are the most fragile
   artifact in the whole system.

The merge-algorithm literature (CRDT internals) matters to EFS mainly as *negative* space — proof
that you don't need it for slot-shaped data — plus one deep philosophical confirmation (eg-walker:
the op log is canonical, CRDT state is a disposable cache).

---

## 1. WHAT EXISTS TODAY (shipped, with dates)

### 1.1 CRDT libraries — mature, but optional for EFS

- **Automerge 3.0** (2025-08, announced July/Aug 2025): re-implemented to use its on-disk columnar
  compression format *in memory*; >10x (up to ~100x) memory reduction — Moby-Dick-sized doc went
  from 700 MB (v2) to 1.3 MB (v3); one pathological doc went from 17-hour load to 9 s. Same file
  format as v2, nearly backward-compatible API. CRDTs are no longer disqualified in browsers on
  memory grounds. (automerge.org/blog/automerge-3/)
- **Yjs** — the production default (~920k weekly downloads; largest ecosystem of editor bindings
  and providers; y-indexeddb for offline persistence, y-websocket/Hocuspocus/y-sweet servers).
  Small bundle, no WASM. (docs.yjs.dev, 2025)
- **Loro 1.0** (2024-10-21): stable encoding format, fastest benchmarks, shallow snapshots,
  built-in version control concepts; youngest ecosystem. (loro.dev/changelog/v1.0.0-beta)
- **Eg-walker** (Gentle & Kleppmann, EuroSys, 2025-03; arXiv 2409.14252): collaborative text via a
  DAG **event graph of original operations**; CRDT metadata is derived transiently only when
  needed for merging. Order-of-magnitude less steady-state memory; loads are just "replay the
  log". **Load-bearing idea for EFS: store the original signed ops; treat every materialized view
  as a cache you can rebuild.**
- Consensus of 2025-2026 comparisons: pick Yjs for ecosystem, Automerge for history-as-a-feature,
  Loro for raw performance; "the algorithmic differences matter less than the ecosystem and
  feature model you need." (pkgpulse 2026 guide; crdt.tech)

### 1.2 Sync engines — who owns what

| Engine | Read path | Write path | Partial sync | Auth | Status (date) |
|---|---|---|---|---|---|
| **ElectricSQL** | Postgres→client "shapes" over HTTP | **Explicitly not owned** — 4 documented patterns | Shapes | Your API | Rewrote from scratch 2024-07 ("Electric Next"); beta 2024-12 |
| **PowerSync** | Postgres/MySQL/Mongo→SQLite, sync rules | Owned: FIFO upload queue → your `uploadData()` API | Sync rules/buckets | Your API | v1.0 2023; web SDKs mature 2025 |
| **Replicache** | Pull patches | Owned: mutators + push, server re-executes | Coarse | Your API | **Maintenance mode**, open-sourced; migrate to Zero (2025-01) |
| **Zero (Rocicorp)** | Query-driven ("synced queries") | Custom mutators run on client + server | **Query-driven partial sync** | Your server code | Alpha through 2025-2026 |
| **Jazz** | CoValue graph sync | Owned: signed transactions | Per-CoValue | Built-in (groups, E2EE) | Jazz 2.0 alpha 2025 |
| **LiveStore** | Event log pull | Owned: event push after rebase | Whole store | Your backend | 0.3.x 2025; Schickling |
| **Triplit** | WebSocket query sync | Owned | Query-driven | Built-in | Open source, active 2025 |
| **DXOS ECHO** | P2P replication (CRDT/Automerge) | Owned | Spaces | Built-in (HALO) | Active but "limited support," focused on their Composer app (2025) |

Key mechanics worth stealing:

- **ElectricSQL write patterns** (electric.ax/docs/guides/writes, 2024-11): (1) online writes;
  (2) ephemeral optimistic state (`useOptimistic`) — flagged as fragile: component-scoped, lost on
  refresh; (3) **shared persistent optimistic state** — durable local store of pending mutations,
  rebased over immutable synced state; (4) through-the-DB sync (PGlite + shadow tables +
  triggers) — most transparent, but loses write context needed for good error handling. Explicit
  guidance: **keep immutable synced state separate from mutable optimistic state**; conflicts are
  "extremely rare" in real apps; a blunt rollback (clear local state on failure) is usually fine.
- **PowerSync checkpoints** (docs.powersync.com/architecture/client-architecture): every local
  write goes to SQLite *and* a persistent FIFO upload queue; **the client refuses to advance to a
  new server checkpoint while local writes are pending**, so the app never sees its own writes
  regress; once the backend acks and the new checkpoint downloads, local state converges. Also:
  synced data is stored **schemaless as JSON** (`ps_data__*`), and the "schema" is just SQLite
  *views* with CAST expressions — client schema evolves with **no migrations**.
- **Replicache rebase** (doc.replicache.dev/concepts/how-it-works): mutations get sequential IDs;
  pending mutations are speculative; on pull, the client **rewinds to the last server state,
  applies the server patch, replays unconfirmed mutations on top** (git rebase). Server is
  authoritative and may compute a different result; once confirmed, the speculative result is
  discarded in favor of the canonical one. Multi-tab via "client groups" sharing one cache.
- **Linear's sync engine** (reverse-engineered with CTO endorsement,
  github.com/wzhudev/reverse-linear-sync-engine): object pool of models hydrated from IndexedDB;
  every user action creates a reversible **transaction** appended to a durable IndexedDB
  `__transactions` queue; batched to server; removed on ack; **`lastSyncId` is a monotonically
  increasing server-assigned total order**; server broadcasts *delta packets* (which may differ
  from the client's transaction because of side effects); failed transactions are rolled back via
  their stored inverse; partial bootstrap + lazy hydration via SyncGroups. Linear's local DB "is a
  subset of the server DB and cannot contain changes not approved by the server" — pending changes
  live in the queue, not in the store.
- **Figma multiplayer** (madebyevan.com / figma.com blog, 2019-10-16; reliability follow-up 2024):
  server-authoritative **per-property last-writer-wins**; no timestamps needed because the server
  orders events; rejected OT ("unnecessarily complex") and full CRDTs ("unavoidable performance
  and memory overhead… we have a server"); **offline reconnect = download fresh document, reapply
  offline edits on top, resume**; multiplayer undo carefully rewrites redo/undo history.
- **Jazz / CoJSON** (jazz.tools docs, 2025): everything is a **CoValue** — a header + per-session
  **append-only logs of Ed25519-signed transactions** with BLAKE3 incremental hash chaining;
  transactions are either encrypted ("private") or plaintext ("trusting"); permissions via signed
  group/role CoValues. **This is the closest shipped analog to EFS's per-author signed records** —
  a verifiable multi-writer store where every write is attributable, and sync servers are
  untrusted relays.
- **LiveStore** (docs.livestore.dev, 0.3.x, 2025): **the eventlog is canonical**; SQLite state is
  derived via materializers; git-inspired pull-rebase-push (must pull upstream events, rebase
  unpushed local events on top, then push); default LWW conflict policy with optional custom
  merge; web adapter elects a **leader worker via Web Locks**, persists **only to OPFS**, and
  **falls back to single-tab mode on Android Chrome** (no SharedWorker, Chromium bug 40290702).
  Open issue: eventlog compaction (#136) — append-only logs grow.

### 1.3 Browser journaling substrate (the WAL-over-IndexedDB/OPFS reality)

- **OPFS + SQLite WASM** is the 2025-2026 workhorse: official SQLite WASM OPFS VFS
  (developer.chrome.com, 2023-01; sqlite.org/wasm persistence docs); **wa-sqlite
  `OPFSCoopSyncVFS`** performs well past 1 GB, whereas **`IDBBatchAtomicVFS` degrades above
  ~100 MB** (PowerSync "SQLite persistence on the web," updated 2026-05). WAL-style VFSes over
  OPFS exist (`OPFSWriteAheadVFS`) because OPFS `SyncAccessHandle` gives exclusive, synchronous,
  offset-addressed file I/O in workers — real fsync-ish semantics browsers never gave IndexedDB
  (IndexedDB commits are `durability: "relaxed"` by default in Chromium).
- **OPFS SyncAccessHandle is worker-only and exclusive-lock** — which conveniently *forces* the
  single-writer pattern EFS wants anyway (Kernel dedicated worker owns the journal file).
- **Eviction is real and all-or-nothing**: Safari ITP deletes *all* script-writable storage for an
  origin after **7 days of browser use without user interaction** (webkit.org storage policy;
  MDN storage quotas & eviction). `navigator.storage.persist()` exempts an origin from eviction
  (Chromium grants silently on heuristics; Firefox prompts; Safari ties it to home-screen
  install). Installed PWAs are exempt from the 7-day cap. When eviction happens, **IndexedDB,
  OPFS, and Cache API are wiped together**.
- **Background Sync API is Chromium-only** (caniuse: Chrome/Edge/Samsung; **Safari and Firefox
  never shipped it**, ~76% global support). Periodic Background Sync is even narrower (installed
  PWAs on Chromium). The portable pattern is: **durable queue in IndexedDB/OPFS + replay on next
  app open/foreground**, with Background Sync as progressive enhancement.
- **`navigator.onLine` is unreliable** (widely documented; DIY sync tutorials converge on probe
  requests). Reachability of *a specific venue/endpoint* is the only honest signal — which aligns
  with EFS's venue-qualified freshness.
- **Multi-tab coordination**: **Web Locks API** (W3C standard, all modern browsers) is the blessed
  leader-election primitive — first tab/worker to acquire the named lock is leader; when it dies
  the lock transfers automatically. Combine with BroadcastChannel for follower messaging.
  SharedWorker works on desktop but not Android Chrome. Replicache client groups, LiveStore's
  leader worker, and tab-election libraries all converge on this.

### 1.4 Resumable transfer & outbox patterns

- **tus v1** (2013→) is the de-facto resumable upload protocol;
  **IETF "Resumable Uploads for HTTP" (RUFH), draft-ietf-httpbis-resumable-upload-12
  (2026-07-06)** is its standards-track successor: upload resources, `Upload-Offset` HEAD probe,
  PATCH append, `104 Upload Resumption Supported` interim response. **Apple ships it in
  URLSession since iOS 17/macOS 14 (WWDC23)**. The offset-probe → append-from-offset → idempotent
  completion loop is the canonical shape for any resumable flush (bytes or records).
- **Transactional outbox** (server literature, AWS prescriptive guidance et al.): write the state
  change and the outgoing message in one transaction; a separate dumb dispatcher forwards with
  at-least-once delivery; consumers must be idempotent via unique IDs. Survival guide lesson:
  **keep the dispatcher dumb — store-and-forward only; every layer of "smartness" in the flusher
  becomes operational pain.** Client-side translation = Linear's `__transactions` table,
  PowerSync's upload queue, Replicache's pending mutations. EFS's deterministic claimIds are a
  gift here: natural idempotency keys end-to-end.

### 1.5 "Signed but not yet submitted" precedents

- **Bitcoin PSBT (BIP-174)**: an explicit interchange format for not-yet-broadcast transactions
  with **six roles** (Creator, Updater, Signer, Combiner, Finalizer, Extractor) — signing is
  separated from construction and from broadcast; signed artifacts move across air gaps on SD
  cards/QR codes; wallets treat them as sensitive material.
- **Safe (Gnosis) transaction service**: off-chain signature collection for multisigs. Trap
  demonstrated in production: **the queue is a public API — anyone can watch pending signed
  transactions and front-run them**; once threshold signatures exist, execution is permissionless.
- **Nostr outbox model (NIP-65)**: signed events are venue-independent; authors advertise write
  relays; any relay can carry an event but none can alter it (signature breaks). Clients maintain
  routing tables of author→relay. This is structurally identical to EFS records being
  independently extractable and replayable cross-venue.

---

## 2. WHAT IS EMERGING (proposals, betas — with status)

- **Keyhive + Beelay** (Ink & Switch, notebook essay 2025-03-13; pre-alpha open source, Rust):
  local-first **access control** (delegation-based, CGKA group encryption) plus an auth-aware sync
  protocol; the **sedimentree** structure compacts old history into progressively larger chunks
  whose boundaries are chosen by hash-trailing-zeros so peers agree without coordination; servers
  sync ciphertext they cannot read. Status: explicitly "bugs, unstable APIs, no security audit."
- **Zero synced queries** (zero.rocicorp.dev, alpha through 2025-2026): query-driven partial sync
  with server-controlled permissions; the strongest emerging answer to "sync exactly what the
  viewport needs."
- **Automerge post-3.0 ecosystem**: hosted sync servers, automerge-repo v2 (storage + network
  adapters, batteries-included repo model).
- **RUFH** finishing standards track (draft-12, 2026-07); expect browser-fetch integration
  discussions next.
- **Patchwork / universal version control** (Ink & Switch notebooks 2024-2026): drafts as
  lightweight branches, diff-first UX, "chat-like history"; follows **Upwelling** (2023-03) which
  found writers need *private drafts* + deliberate merge moments, not always-on merge. Directly
  relevant to EFS's "signing is a checkpoint" UX.
- **LiveStore + durable streams** (2025-12): append-only event logs as a first-class backend
  primitive.
- **TanStack DB** (2025): reactive client store designed to sit on sync engines (differential
  dataflow over collections) — sign the ecosystem is converging on "local store + pluggable sync."
- **SE Radio 716 with Kleppmann (2026-04)** and localfirst.fm ecosystem: local-first framing now
  explicitly includes human-AI collaboration (agent edits merged like collaborator edits).

---

## 3. LESSONS AND TRAPS from deployed systems

1. **Vendor-hosted sync engines die.** MongoDB **Atlas Device Sync/Realm**: deprecated 2024-09,
   sync shutdown 2025-09-30 — apps coupled to it had 12 months to rip out their sync layer.
   Rocicorp **Reflect** shut down 2024-11-01; **Replicache** in maintenance mode. Even good
   engines are business-mortal. EFS's protocol-first design dodges this *if* the client never
   hard-depends on one relayer/indexer/sync service.
2. **Generic bidirectional sync is a tarpit.** ElectricSQL v1 (active-active Postgres⇄SQLite
   replication) was abandoned for a from-scratch rewrite (2024-07) that owns **only the read
   path** and pushes writes to explicit app-owned patterns. Owning both paths generically was too
   hard even for a well-funded team of experts.
3. **Ephemeral optimistic state lies.** Component-scoped optimistic hooks lose pending writes on
   refresh and desync sibling components (Electric's own docs). TanStack Query's persisted
   mutations show the failure modes in the wild: mutation *functions* can't be serialized, only
   *paused* mutations dehydrate by default, and resume-after-restart has a bug trail
   (#4170, #5847, #7044). **The journal must be the durable source of pending truth, not the UI
   layer's cache.**
4. **Browser storage is a leaky bucket.** Safari's 7-day script-storage eviction (all storage
   types wiped together), quota pressure eviction elsewhere, and eviction being invisible to the
   app. Anything unsigned and unexported can vanish. `persist()` + installed-PWA + export paths
   are mitigations, not guarantees.
5. **Multi-tab double-writers corrupt journals and double-flush.** Every serious system (LiveStore,
   Replicache, Linear) funnels writes through one elected writer (Web Locks); Android Chrome's
   missing SharedWorker forces an explicit degraded mode. Design leader election in from day one.
6. **A signed artifact is a live grenade, not a draft.** Safe's public tx queue enables
   front-running; PSBT treats partially signed transactions as sensitive material moved across air
   gaps. Once signed, an EFS bundle is submittable by anyone who holds it, on any venue the
   envelope admits, potentially years later (bounded only by `expiresAt`).
7. **Conflicts are rarer than architects fear — but self-conflict is real.** Figma, Linear, and
   Electric all report per-field LWW + server ordering handles real workloads; Dropbox's
   "conflicted copy" shows the fallback UX (preserve both, never silently drop). For EFS the
   residual conflict is **the same author on two offline devices writing one slot** — an
   equivocation-shaped problem, not a merge problem.

---

## 4. EFS TRANSLATION — opinionated recommendations for client v2

1. **Journal = event-sourced op log; everything else is a cache.** Adopt the LiveStore/eg-walker
   shape: the Kernel's canonical local truth is an ordered, append-only log of intents/records
   (protocol-canonical signed bytes once signed, plus client-private metadata rows alongside —
   never inside — the signable payload). All materialized views (path trees, slot tables, lens
   resolutions) are derived and rebuildable by replay. This also makes crash recovery and audit
   trivial and matches EFS's "records are independently extractable" ethos.
2. **Per-slot rebase discipline (PowerSync × Replicache).** The optimistic overlay is: last
   confirmed venue checkpoint + pending journal ops replayed on top, per slot. Never advance the
   confirmed snapshot past a slot with pending local writes (no "my write disappeared then
   reappeared"). On confirmation, drop the speculative row and adopt the venue-derived one.
3. **Single-writer Kernel via Web Locks.** One elected leader (Web Locks named lock) owns the OPFS
   journal via SyncAccessHandle (exclusive by design); follower tabs proxy through
   BroadcastChannel/MessagePorts. Ship an explicit Android-Chrome degraded mode. Use SQLite WASM
   (wa-sqlite OPFSCoopSyncVFS) or a hand-rolled append-only log + periodic snapshot; both are
   proven at >1 GB in 2025-2026 browsers.
4. **Bless the pending-state vocabulary in the OS SDK.** The handoff's
   draft→planned→ready_to_sign→signed→queued→flushing→submitted→partially_admitted→complete→
   finalized→replicated ladder is exactly what shipped systems converged on (Linear's queue
   states, PowerSync queue, RUFH offsets) — but make it **normative and app-visible via the OS
   SDK**, composed with read grades, so Ring-3 apps can't invent their own dialects of "saved."
5. **Treat signed bundles like PSBTs.** Encrypt at rest; never render them as shareable by
   default; exporting one is a security event with Shell chrome ("anyone holding this can publish
   it until it expires"); default `expiresAt` on interactive-session bundles; track custody in the
   audit log. Sign-late by default (at checkpoint), offer sign-early as an explicit
   "author a portable artifact" action.
6. **Flush engine = dumb resumable outbox.** Store-and-forward only; no business logic in the
   dispatcher; at-least-once submission with claimId-keyed idempotence; per-record admission
   tracking; RUFH/tus-style offset-probe-then-append semantics for mirror byte uploads and the
   EFSBytes chunk bitmap. Retry/backoff policy is data, not code.
7. **Do not depend on Background Sync.** Flush on foreground, on explicit user action, and via the
   visible Sync Center; Background Sync is a Chromium-only progressive enhancement. Call
   `navigator.storage.persist()` during onboarding, surface its result honestly in the Sync
   Center, and push PWA install as a durability upgrade. Probe venue reachability directly;
   never trust `navigator.onLine`.
8. **Keep merge CRDTs out of the Kernel.** Slots are LWW; that's the protocol. Offer Automerge 3 /
   Loro / Yjs as an *app-layer* library (via SDK helpers) for genuinely collaborative documents
   whose merged state is periodically checkpointed into DATA records — the Figma lesson (central
   authority ⇒ skip CRDT overhead) applies at the kernel; the Automerge-3 lesson (CRDTs are now
   cheap) applies to apps that truly need merge.

## 5. Where EFS v2 protocol design may under-support the client

1. **Same-author multi-device seq/slot coordination is unspecified.** Two offline devices of one
   identity can both write slot S (or allocate the same seq); under admit-both the author
   self-equivocates and lenses read EQUIVOCAL against their own key. Local-first systems solve
   this with per-device session logs (Jazz sessions, Automerge actor IDs). EFS needs a blessed
   answer: per-device sub-sessions/actor discriminators inside the envelope, seq-range leases, or
   a normative "one journal per identity; devices hand off" client rule. Record this into
   Designs/efsv2/.
2. **No normative grade for local/pending overlay state.** Read grades are venue-relative;
   the client must invent PENDING-LOCAL/DRAFT grades and their composition with LIVE/STALE/etc.
   If the read-lens-spec doesn't define how pending overlays compose (and what agents see), every
   client/SDK will diverge exactly where honesty matters most.
3. **Pre-admission supersession is undefined.** Once signed, a bundle can be submitted by any
   holder until `expiresAt`; but there is no "supersede my own unsubmitted bundle" story — the
   G-set REVOKE acts on admitted records. The protocol should state whether a later-signed bundle
   with same slots+higher seq safely defangs a leaked earlier one, and recommend client-side
   default expiry policy.
4. **Partial-admission observability must be cheap.** The Sync Center's honesty
   (partially_admitted, per-record status) requires querying "which of this envelope's N records
   are admitted at venue V" efficiently — verify the kernel read ABI/enumeration spine supports
   batched per-claimId admission checks, or clients will either lie or hammer RPCs.
5. **Payload schema evolution for permanent records.** Records never migrate; clients will render
   DATA/TAGDEF payloads written under old schema versions forever, offline. Nothing yet specifies
   version negotiation or Cambria-style lens migration for payload schemas (DATA_SCHEMA_UID
   versioning), or how a client labels "payload schema newer than this OS profile understands."

---

## Sources (fetched/verified 2026-07-07)

- https://automerge.org/blog/automerge-3/ (Automerge 3.0, 2025)
- https://arxiv.org/abs/2409.14252 (Eg-walker, EuroSys 2025-03)
- https://loro.dev/changelog/v1.0.0-beta (Loro 1.0, 2024-10-21)
- https://www.pkgpulse.com/guides/yjs-vs-automerge-vs-loro-crdt-libraries-2026 (comparison, 2026)
- https://docs.yjs.dev/getting-started/allowing-offline-editing (y-indexeddb offline)
- https://electric-sql.com/blog/2024/07/17/electric-next (rewrite, 2024-07-17)
- https://electric-sql.com/blog/2024/12/10/electric-beta-release (beta, 2024-12-10)
- https://electric.ax/docs/guides/writes (write patterns; fetched 2026-07)
- https://docs.powersync.com/architecture/client-architecture (upload queue, checkpoints, views)
- https://powersync.com/blog/sqlite-persistence-on-the-web (SQLite-on-web state, 2026-05 update)
- https://doc.replicache.dev/concepts/how-it-works (rebase model)
- https://replicache.dev/ (maintenance mode notice, 2025)
- https://rocicorp.dev/blog/retiring-reflect (Reflect shutdown 2024-11-01)
- https://zero.rocicorp.dev/docs/synced-queries (Zero synced queries, alpha)
- https://jazz.tools/docs/react/reference/encryption (CoJSON signed transaction logs)
- https://docs.livestore.dev/evaluation/event-sourcing/ and
  https://docs.livestore.dev/reference/platform-adapters/web-adapter/ (eventlog, leader election, OPFS)
- https://www.triplit.dev/docs (Triplit, 2025)
- https://docs.dxos.org/guide/echo/ (DXOS ECHO status)
- https://github.com/wzhudev/reverse-linear-sync-engine (Linear sync engine, CTO-endorsed)
- https://madebyevan.com/figma/how-figmas-multiplayer-technology-works/ (2019-10-16)
- https://www.figma.com/blog/making-multiplayer-more-reliable/ (2024)
- https://www.inkandswitch.com/keyhive/notebook/05/ (Beelay/sedimentree, 2025-03-13)
- https://github.com/inkandswitch/keyhive (pre-alpha)
- https://www.inkandswitch.com/upwelling/ (2023-03) and https://www.inkandswitch.com/patchwork/notebook/ (2024-2026)
- https://martin.kleppmann.com/2024/05/30/local-first-conference.html (2024-05-30)
- https://se-radio.net/2026/04/se-radio-716-martin-kleppmann-local-first-software/ (2026-04)
- https://datatracker.ietf.org/doc/draft-ietf-httpbis-resumable-upload/ (draft-12, 2026-07-06)
- https://tus.io/blog/2023/08/09/resumable-uploads-ietf and https://github.com/tus/rufh-implementations (Apple URLSession iOS 17)
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API (leader election)
- https://caniuse.com/background-sync (Chromium-only)
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://webkit.org/blog/14403/updates-to-storage-policy/ (Safari 7-day eviction)
- https://web.dev/articles/persistent-storage (persist())
- https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system (2023-01)
- https://github.com/rhashimoto/wa-sqlite (OPFSCoopSyncVFS)
- https://www.mongodb.com/community/forums/t/atlas-device-sync-end-of-life-and-deprecation/296687 (2024-09; EOL 2025-09-30)
- https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
- https://medium.com/@tpierrain/outbox-pattern-survival-guide-6ad4b57ef189 (dumb dispatcher lesson)
- https://bips.dev/174/ (PSBT roles)
- https://docs.safe.global/core-api/transaction-service-reference/gnosis-chain (Safe tx service; public queue/front-running noted in ecosystem analyses)
- https://nostrify.dev/relay/outbox (Nostr outbox model, NIP-65)
- https://github.com/TanStack/query/issues/4170, /issues/5847, /discussions/7044 (persisted mutation pitfalls)
- https://help.dropbox.com/organize/conflicted-copy (conflicted-copy UX)
