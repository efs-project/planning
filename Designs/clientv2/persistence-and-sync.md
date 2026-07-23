# Client v2 — Persistence, cache, journal, and sync honesty
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[codex-envelope]], [[deterministic-ids]], [[large-file-uploads]], [[fable-client-v2-handoff]]
**Related research:** [[mountable-filesystem-semantics]]
**Reviewers:** —
**Last touched:** 2026-07-22

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> Elaborates thesis **F7** (write lifecycle), the **journal** and **outbox** adopted primitives, and honesty-doctrine item 2 ("storage loss is an event, not a mystery") into the **Client Persistence Layer**. Evidence: Reviews/2026-07-07-clientv2-corpus/research/storage-durability.md and Reviews/2026-07-07-clientv2-corpus/research/local-first.md.

## Problem

The browser gives us a large but **revocable** disk. Every byte lives under three deletion authorities we do not control — LRU eviction, platform privacy policy (Safari ITP's 7-day wipe), and the user's own "clear site data" — and **no API notifies us of loss**; we discover it only by looking. `persist()` is weaker than its name (Chrome silently denies new origins; Safari grants it and ITP deletes anyway — WebKit bug 209563, open since 2020). Meanwhile EFS makes the stakes uneven in a way no local-first framework models: most of our data is content-addressed and re-fetchable forever, but an unsigned draft is silently mortal, a signed-unsubmitted bundle is an irreplaceable *live grenade*, and a persona key is identity. One durability policy cannot serve all four. The design below is a tiered subsystem with per-tier engines, per-tier loss semantics, and a Shell surface (the **Sync Center**) that tells the truth about all of it. [research-grounded]

## The design

### D1. Protection tiers

| Tier | Contents | Engine | Durability | Encryption | Loss semantics |
|---|---|---|---|---|---|
| **A — re-fetchable** | record cache, byte cache, view cache, thumbnail cache, package cache | raw OPFS files (bytes/packages); wa-sqlite indexes (records/views); Cache API (app-shell only) | relaxed; best-effort bucket | none (public content-addressed bytes) | cache miss → re-fetch; **no drama, but freshness metadata dies too** (see D7) |
| **B — locally authored, unsigned** | journal, drafts, intents, materializer checkpoints, lens/trust config | append-only OPFS journal file + wa-sqlite mirror row with checksums | `durability:'strict'` commits only; persisted Storage Bucket on Chromium | K_journal (D6) | **silent work loss** if unexported; reported against last backup, never papered over |
| **C — signed, unsubmitted** | signed envelopes/bundles awaiting flush; partial-admission residue | same store as B, separate stratum + separate sentinel | strict; counted toward reserved headroom | K_journal; export is a security event | worst class: author committed, world has nothing; **time-at-risk** tracked per bundle |
| **D — keys** | persona secp256k1 keys (vaulted), K_journal wrapping material | never the sole copy in origin storage; non-extractable CryptoKey in IDB is a *convenience cache* of a re-derivable wrap secret; persona vault blobs ride the D8 backup lane | n/a | wrapped by K_wrap (D6) | loss = re-derive K_root via wallet/passkey ceremony + unwrap restored vault backup; **never** identity loss by design |

Tier A loss is an inconvenience; Tier B loss is destroyed work; Tier C loss is destroyed *commitment*; Tier D loss must be impossible because origin storage never holds the sole copy: wrap secrets re-derive, and persona-key vault blobs are backed up (D8). Eviction is origin-atomic — all tiers die together — so the tiers are not "what survives eviction" but **what we owe the user when everything dies at once**, plus independent protection against per-store corruption (WebKit ships storage-destroying bugs into stable: 14.1.1, 266559). [research-grounded]

### D2. Substrate picks

| Stratum | Pick | Why / fallback |
|---|---|---|
| Structured indexes (record cache, views, journal mirror, outbox queue) | **wa-sqlite `OPFSCoopSyncVFS`** in the Kernel storage worker | proven >1 GB on all engines (PowerSync 2026-05); retry on `SQLITE_BUSY`; fallback `IDBBatchAtomicVFS` (old browsers, Safari incognito — degrade honestly, it dies ~100 MB). Never require COOP/COEP for storage (Notion's lesson; breaks embedding). |
| Hash-addressed bytes, packages, chunk sets | **raw OPFS files**, directory-sharded by hash prefix, `FileSystemSyncAccessHandle` | random access, streaming, no structured-clone tax (100 MB ≈ 90 ms vs 850 ms IDB); invisible to SW fetch — the Kernel serves them itself |
| App-shell (Bootstrapper, Kernel, Shell closure of the active generation) | **Cache API**, same-origin/CORS-readable responses only | it is the SW boot path. **Never opaque responses** — unverifiable (violates verify-don't-trust) and quota-padded ~7 MB each |
| Journal + bundles | append-only OPFS file + SQLite mirror, `durability:'strict'` | relaxed is the default everywhere since Chrome 121 — "transaction complete" ≠ on disk. Strict is for Tier B/C commits **only**; Tier A stays relaxed for speed |
| Buckets | **Storage Buckets where available** (Chromium 122+): `journal` bucket `{persisted:true, durability:'strict'}`, `bytecache` bucket evictable | exactly the evict-cache-before-journal primitive we want, but Chromium-only — a progressive enhancement, **never a foundation** [research-grounded] |
| Sentinels | localStorage + one row/file in every store | 5 MiB stores are useless for data, perfect for generation sentinels (D7) |

**Quota citizenship.** `QuotaExceededError` is routine flow control, not an error dialog. Self-imposed Tier A budget = 80% of (`estimate().quota` − 512 MB safety margin), metered per stratum (`usageDetails` where present, own ledger elsewhere — estimate() lies at the edges). Watermarks: at 70% of budget, background trim; at 90% or on any `QuotaExceededError`, aggressive trim + Storage-health notice. Trim order: **thumbnails → view cache → non-pinned package generations → byte cache → record cache**. The active and previous generation closures and anything user-pinned are never trimmed (Rescue Shell depends on current+previous being bootable). Tier B/C hold a permanently reserved 64 MB headroom Tier A may never consume: running out of room for caches is normal; running out of room to *save the user's own work* is a bug. [reasoned] on the constants; the mechanism is grounded.

### D3. Single-writer discipline

One elected **Kernel storage worker** owns every OPFS sync handle and every SQLite/IDB write. Election via Web Locks: each tab's Kernel requests `efs-storage-owner`; the holder is the writer; on tab death the lock transfers automatically and the next Kernel replays recovery (torn-tail check, D4). Followers proxy writes over MessagePorts advertised via BroadcastChannel (`efs-storage-bus`); invalidations fan out on the same channel. Multi-writer IDB/OPFS demonstrably corrupts (Notion's production corruption; every serious system — LiveStore, Replicache, Linear — converged on elected single writers). [research-grounded]

- **Android Chrome degraded mode:** no SharedWorker below Chrome 148 (~May 2026 stable) — the Web-Locks-elected dedicated worker *is* the portable design, so Android costs us nothing structurally; follower tabs there may see marginally higher proxy latency, and the Sync Center labels "another tab is the writer." When Chrome 148+ is a safe floor, a SharedWorker may become the *router* (Notion topology — it can never hold OPFS sync handles).
- **The service worker is never a journal writer.** SW writes are small, idempotent, `waitUntil`-wrapped cache fills only; an SW killed mid-transaction with relaxed durability silently loses data.

### D4. The journal — event-sourced op log

The Kernel's canonical local truth is an ordered, append-only log. Everything else — slot tables, path trees, lens resolutions, the pending overlay — is a **materialized view, rebuildable by replay** (eg-walker/LiveStore rule: the op log is canonical, derived state is a disposable cache). [research-grounded]

The mount pressure test in [[mountable-filesystem-semantics]] makes this journal the writable upper layer for ordinary file operations: random writes and renames stage locally, `fsync` can mean local crash durability, and signing/publication remain explicit ladder transitions rather than side effects of `write(2)` or `close()`.

```ts
interface JournalEntry {
  localSeq: number;                 // monotonic per device; the journal's own order
  deviceId: Hex;                    // random per install — client-private, NOT protocol-visible (see OQ-2)
  kind: 'intent' | 'record_built' | 'signed' | 'submission' | 'admission' | 'loss_event' | 'meta';
  intent?: CanonicalIntent;         // deterministic app-level intent; replay regenerates byte-identical
                                    //   records and claimIds ([[deterministic-ids]]) — idempotent recovery
  recordBytes?: Uint8Array;         // protocol-canonical SIGNED bytes, verbatim, once they exist
  claimId?: Hex;                    // deterministic; the end-to-end idempotency key
  clientMeta: {                     // ALONGSIDE the signable payload, never inside it:
    appId?: string; persona?: Address; ladder: PendingState;   // draft…replicated
    venueTargets: VenueId[]; custody?: CustodyEvent[];          // Tier C: export/escrow trail
  };
  ts: number;                       // wall clock, advisory only
  checksum: Hex;                    // per-entry; torn-tail detection
}
```

Rules, all normative for the client and the OS SDK surface:

1. **Signed bytes are stored verbatim.** The journal never re-encodes a signed envelope; client metadata rides in sibling fields. A journal segment is therefore exportable as protocol truth without translation.
2. **Rebase discipline (PowerSync × Replicache).** Optimistic overlay = last confirmed venue checkpoint + pending journal ops replayed on top, per slot. The confirmed snapshot **never advances past a slot with pending local writes** (no "my write vanished then reappeared"). On admission, the speculative row is **dropped and replaced by the venue-derived record** — the venue's answer is canonical even when it differs. [research-grounded]
3. **Pending truth lives here, not in UI state.** No component-scoped optimistic caches; every pending indicator anywhere in the Shell derives from the journal (ephemeral optimistic state provably lies — Electric's own docs, TanStack's bug trail).
4. **Torn tail:** entries carry checksums + `localSeq`; a relaxed-crash tail truncates to last-good and the Shell reports exactly what rolled back — never silent.
5. **Compaction:** segments whose every entry is `replicated` (ladder top) compact into snapshots; **signed bytes are never pruned below `replicated`**. Append-only logs grow (LiveStore #136); compaction is scheduled, not hoped for.
6. **The ladder is the vocabulary.** `draft → planned → ready_to_sign → signed → queued → flushing → submitted → partially_admitted → complete_on_chain → chain_finalized → replicated`, exposed through the OS SDK so Ring-3 apps cannot invent dialects of "saved." Composition with read grades below (D8/Honesty).
7. **Flush engine = dumb resumable outbox.** Store-and-forward; at-least-once; idempotent on deterministic claimIds; per-record admission tracking; RUFH/tus offset-probe-then-append for chunk uploads ([[large-file-uploads]] bitmap); retry/backoff is data, not code. Background Sync is Chromium-only — flush on foreground and on explicit action, visible in the Sync Center; `navigator.onLine` is never consulted for truth, only venue probes.

### D5. Cache entry metadata — facts, not conclusions

Every Tier A entry carries provenance sufficient to re-grade it later:

```ts
interface CacheEntryMeta {
  cid: Hex;                                   // the key; verify-on-read, mismatch ⇒ quarantine + refetch
  byteStatus: 'verified' | 'partial(k,n)' | 'absent';          // BYTES-* aware ([[large-file-uploads]])
  fetchedFrom: { venue: VenueId; endpointClass: 'self-hosted'|'relayed'|'trusted-paid'|'public-observed' };
  lensPosition?: number;                      // which lens position produced this winner
  readCtx: 'GATE' | 'INTERACTIVE';
  gradeAtFetch: ReadGrade;                    // provenance only — never served
  currency: {kind:'HOME-LIVE'} | {kind:'AS-OF'; seq:number} | {kind:'UNKNOWN-CURRENCY'};
  denySetVersion: Hex;                        // deny snapshot consulted at fetch time
  provenance: 'trusted-lens' | 'discovery';   // DISCOVERY never silently promotes to trusted
  fetchedAt: number; lastAccess: number; pinned?: PinReason;
}
```

**Grades are never served from cache.** The cache stores facts and provenance; disposition is recomputed at every render against the current clock (STALE flips with time), the current deny snapshot, and any duplicity evidence learned since fetch. A cached LIVE is only a claim that it *was* LIVE at `fetchedAt` under `denySetVersion` — [[read-lens-spec]] §5's as-of humility applied to our own disk. Corruption is a cache miss: hash-check on read, mismatch → delete + refetch (R7 of the storage digest). [research-grounded]

### D6. Keys and re-openability (Tier D)

- **K_root** is derived outside origin storage: passkey-PRF (hardware-rooted, survives origin eviction; broadly dependable 2026) and/or a deterministic wallet signature over a fixed EIP-712 domain message → HKDF. Both paths are offered; PRF is default where available, wallet-derivation is the fallback and the recovery path. [research-grounded]
- **K_journal** = HKDF(K_root, "journal") encrypts Tiers B/C and backup mirrors. A non-extractable AES `CryptoKey` cached in IDB makes daily boots ceremony-free; after eviction the cache is gone but the state (if backed up) is **re-openable** by re-deriving K_root. Encrypted-but-unopenable backups are worse than no backups.
- **Persona keys are NOT derived from K_root.** [[wallet-and-actions]] owns persona minting: personas are vault-stored *independent* keys, and per the key-wrap coupling rule ([[identity]] G9) the at-rest wrap secret must not derive from the primary author account. K_root is strictly the at-rest encryption key — it wraps the vault, it mints nothing. A total wipe therefore costs no *access*: restore the encrypted vault blob (D8 backup/escrow lane), re-derive K_root via the passkey/wallet ceremony, unwrap.
- Origin storage never holds the *sole copy* of any non-derivable secret. If a flow wants one, the flow is wrong.

### D7. Eviction, loss detection, and honest messaging

**Detection is DIY because no eviction event exists.** Generation sentinels (install UUID + epoch counter) are written to every store (localStorage, SQLite meta, OPFS file, Cache entry, SW registration) at boot and clean shutdown. Boot classifies: all-present → clean; all-missing → origin wipe (eviction/ITP/user-clear); some-missing → **partial corruption, treat all local state as suspect**. Corroborate with `estimate().usage` delta vs last-known and re-check `persisted()` every boot — it can be true one day and the data gone the next on Safari. [research-grounded]

On wipe detection, in order: (1) emit a journal `loss_event` (the journal restarts with the event as entry zero — the loss is itself part of history); (2) Shell-visible event, never a silent rebuild: *"Your browser deleted this profile's local data (detected 7 Jul 2026). Cached content will re-download as you browse. 3 drafts and 1 signed bundle existed only on this device — last backup 1 Jul 2026."* Tier B/C losses are reported **against the last export/escrow record**, by name; (3) all freshness claims degrade to venue-qualified **UNKNOWN / UNKNOWN-CURRENCY until re-verified** — the possession ledger ("what did I have, as of when, from which venue") died with the disk, and fabricating continuity would be a truth-trap violation; (4) Tier A re-fetches lazily and silently.

**Per-platform durability messaging** (Storage health panel, never a scary modal):

| Detected class | Label | Nudge |
|---|---|---|
| Safari, in-tab | "Storage: **7-day lease** — Safari deletes site data after 7 days without a visit" | "Add to Home Screen / Dock for durable storage" (the only real ITP exemption; `persist()` does **not** exempt — bug 209563) |
| Installed web app (iOS/macOS Dock) | "Storage: durable (installed app)" | note: policy, not physics — Apple's Feb 2024 EU removal says so; backup still nudged |
| Chromium, persist() denied | "Storage: best-effort" | re-request after engagement; offer install; enable Storage Buckets path |
| Chromium, persist() granted | "Storage: protected from automatic cleanup" | still not proof against user clearing — backup nudged |
| Firefox | prompt at an **earned moment** (first signed bundle, first pin), never on first load — it is a real user prompt, spend it well | |
| WKWebView embed | "Storage: constrained (15% quota; suspends in background)" | steer to the real browser/PWA |

### D8. Backup — a capability-gated OS service

`efs.backup` is a System-Chrome-mediated service, granted like any endpoint capability — no ambient disk, no ambient network. **Chromium lane:** File System Access directory handle ("EFS backup folder"), persisted in IDB, re-validated via `requestPermission()` (persistent permissions, Chrome 122+); continuous mirroring of journal segments, Tier C bundles, lens/trust config, and sentinels — encrypted under K_journal. **Everywhere else:** manual `.efs-bundle` export (`<a download>`) and import, Web Share on mobile — Firefox flags pickers harmful; Safari has none. **Remote escrow** (user's own mirror or any venue) is an ordinary endpoint capability carrying its privacy class; escrowing an *encrypted* journal to a `public-observed` endpoint still leaks timing/size — label it. "Backed up" is asserted only after a verified round-trip (read back + hash check); a green backup badge that lies is worse than none. Exporting a Tier C bundle is always a Shell security event: *"Anyone holding this file can publish it, now or years from now — expiry only ages what readers make of it; the pre-signed abort artifact is the kill switch."* **Time-at-risk** (age × replica count) drives escalating nudges on unsubmitted signed bundles. [research-grounded]

### D9. Offline reads — what "available offline" means

Catalog and bytes are separate facts, so the UI never conflates them:

- **Available offline** — closure-complete: catalog entry + all bytes present and hash-verified locally. Only this earns the offline chip.
- **Listed only** — record/claim cached, bytes absent (`byteStatus:'absent'`). Renders as [[read-lens-spec]] RR12's authenticated-pointer-without-bytes: *"Known, not stored on this device."* A GATE read requiring bytes fails closed.
- **Partial (k/n)** — `BYTES-PARTIAL` surfaced as a progress fact, never truncated-as-complete ([[large-file-uploads]]).
- Closure-level completeness ("this app/generation is bootable offline") is a predicate over many byte sets — computed and displayed per closure, not inferred from spot checks.
- **NO-TRANSPORT is a client-side cause over UNKNOWN, not a separate grade.** The grade set is closed ([[boot-and-profiles]] §6 owns the formulation); NO-TRANSPORT is presentation state qualifying *why* a read is UNKNOWN — *we never asked* (no endpoint capability, or offline) vs a venue that was asked and could not answer. Copy: "Can't check — no network access granted / offline" vs "the venue can't answer for this author." Rendering either as "not found" is the cardinal sin (thesis honesty item 1; a protocol-level qualifier is pending pressure-report P3). Pins ("keep offline") are real byte-budgeted pins in the package/byte strata, exempt from trim.

### D10. The Sync Center — surface spec

Split per thesis Amendment 11: the **dashboard** — the five panels below — is a Session Shell surface rendering Kernel-derived pending/durability truth; **System Chrome keeps sync authority and loss events** (the export ceremony, storage-loss events, bundle-custody actions). Five panels:

1. **Journal** — pending ops grouped by app/persona, ladder chip per group, torn-tail rollback notices, replay/compaction status.
2. **Bundles (outbox)** — each signed-unsubmitted bundle: contents summary (records, kinds, targets), `expiresAt`, **time-at-risk badge**, custody trail (created/exported/escrowed), export action (security-event chrome).
3. **Submissions** — per-venue flush state (`queued/flushing/submitted`), **per-record admission**: "14 of 17 records admitted at <venue>; 3 pending" with per-claimId status; retry/backoff shown as data; chunk-upload bitmaps for large files.
4. **Venues** — per-venue head/checkpoint fetch age, head/checkpoint seq, currency bound, NO-TRANSPORT indicators; the single-jittered-head-fetch discipline (F5) makes this panel cheap and private.
5. **Storage health** — durability class + platform label (D7 table), persisted() state, per-stratum quota gauges and watermarks, sentinel status, last verified backup, loss-event history.

Badge grammar everywhere else in the OS: below `complete_on_chain`, content carries its ladder chip; the Sync Center is the detail view, inline chips are the summons. Negative indicators only — no green "all synced" habit-forming checkmark; quiet is the good state.

### Agent lens

Agents consume the same graded, laddered API — no privileged or degraded fork. Specifics: dry-runs read the **journal overlay** with pending state explicitly labeled, so a plan that depends on an unadmitted write knows it (and deterministic claimIds make the dry-run honest about what *will* exist); agent-initiated flushes and cache fills draw on session budgets (bytes fetched, records submitted); Tier C export, backup restore, and journal deletion are T3/T5-class checkpoints **never satisfiable by an agent alone**; storage-health and loss events are machine-readable facts an agent must ingest — a plan whose premises were wiped re-verifies rather than replaying stale assumptions; NO-TRANSPORT is a distinct machine state so agents don't retry-hammer what they are not permitted to reach.

### Honesty obligations

1. **Pending never renders as canonical.** Everything below `complete_on_chain` is labeled local/pending, composed with — never substituting for — read grades. The overlay is the client's assertion; the venue's answer wins on admission.
2. **Grades are recomputed, never replayed** from cache (D5). A cached conclusion is a stale conclusion.
3. **Loss is an event with a name and a date** (D7), reported against the last backup — never silent reconstruction, never fabricated continuity.
4. **STALE ≠ REVOKED**, on disk as on chain: cached-expired renders "no renewal known to this venue," from the shared string catalog.
5. **NO-TRANSPORT-qualified UNKNOWN ≠ venue-answered UNKNOWN ≠ PROVEN-ABSENT** (D9); only PROVEN-ABSENT yields, and only a venue can prove absence — a cache never can.
6. **"Backed up" requires a verified round-trip**; time-at-risk on Tier C is displayed, not hidden; export chrome states the grenade truth.
7. **Durability class is stated in platform-honest terms** (7-day lease, best-effort, installed-durable) — `persisted() === true` is never rendered as "safe."

## Open questions

- [ ] **[open — protocol gap]** Same-author two-device seq allocation: both devices journal offline, both mint seq N → self-EQUIVOCATION under admit-both. Client mitigations (per-device personas by default, journal `deviceId`, seq-range leases, "primary authoring device" handoff) are workarounds; the protocol needs a blessed answer (per-device actor discriminators in the envelope, or a normative one-journal-per-identity rule). → efsv2 pressure report.
- [ ] **[open — protocol gap]** No normative PENDING-LOCAL/overlay grade: read grades are venue-relative; composition of the pending ladder with LIVE/STALE/etc. (and what agents see) is client-invented here — [[read-lens-spec]] should own it or clients will fork exactly where honesty matters.
- [ ] **[open — protocol gap]** `.efs-bundle` needs a normative, venue-neutral portable encoding (header + signed records + submission progress) so any copy is replayable — a protocol artifact, not a client invention.
- [ ] **[open — protocol gap]** Pre-admission supersession is undefined, and F7's "default `expiresAt` on interactive bundles" is a **partial** mitigation: admission is clock-free, so a leaked bundle stays *admissible* forever (expiry only defangs the read); the expiry rides the user's actual claim, changing its meaning; and appendOnly entries require `expiresAt == 0` (envelope K1), so this defang is unavailable exactly where append-only history makes leaks stickiest. Needs a real protocol story.
- [ ] **[open — protocol gap]** Partial-admission honesty needs cheap batched per-claimId admission checks in the read ABI, or Sync Center panel 3 either lies or hammers RPCs.
- [ ] **[open]** Should lens/trust config live as EFS records under the user's address (restorable, attestable after wipe) rather than Tier B config? Eviction silently changing what the user *sees* is a truth bug, not just data loss.
- [ ] **[open]** Watermark constants (70/90%, 512 MB margin, 64 MB reserve) and PRF-vs-wallet default ordering for K_root — validate in the client repo against real quota telemetry-free testing.
- [ ] **[open]** Journal-encryption threat model: Tiers B/C encrypted at rest buys little against same-origin compromise (F2 says so honestly) — is the cost of the unlock path justified beyond the backup/escrow lane? Current call: yes, because backups and escrow *must* be encrypted and one codepath beats two. [reasoned]

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain verified against [[web-os-thesis]] and the efsv2 set (no contradictions)
- [ ] No AGENT-Q comments remaining
- [ ] At least one round of `#status/review` with another agent or human comment
