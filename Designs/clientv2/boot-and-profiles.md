# Boot, profiles, and deep links
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[packages-and-updates]], [[fable-client-v2-handoff]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> Evidence: `Reviews/2026-07-07-clientv2-corpus/research/boot-deeplinks.md` (the F12 retry lane) and `Reviews/2026-07-07-clientv2-corpus/research/closures-generations.md`. Link grammar is ruled by [[read-lens-spec]] §1.2/§6 — this document **extends** it with OS link classes and a fragment carriage grammar; it never forks the web3:// derivation surface.

## What this rules

THE boot/profile/deep-link model for client v2: it elaborates thesis rulings **F11** (client self-trust) and **F12** (deep links) and the boot half of **F4** (the Bootstrapper's verification of the pinned generation, health gates, Rescue fallback). One requested amendment to the ruling layer: F12's boot-path sentence names "navigation preload," which the lane retry shows is a data-wasting footgun for a cache-first shell — this doc substitutes SW Static Routing + ServiceWorkerAutoPreload and asks F12 to adopt that wording (see Open questions). Everything else defers to [[web-os-thesis]].

---

## 1. The link layer

### 1.1 Canonical form and the two carriage rules — [research-grounded]

The canonical deep link is an **https URL on the client's origin with an empty path, an empty query, and everything EFS in the fragment**:

```
https://<client-origin>/#efs1.<class>.<segments…>[.k.<cap>]
```

- **Carriage rule 1 — path/query are unfurl-visible.** Server-side unfurl bots (Slack, Discord, LinkedIn — some executing page JS) fetch pasted links within seconds; path and query traverse servers, CDNs, logs, and the platform's own storage. The canonical link therefore carries **zero identifying data outside the fragment**: one static origin, one handsome generic unfurl card, nothing to leak. (boot-deeplinks §1.3, §3.3)
- **Carriage rule 2 — the fragment never traverses the network, but any JS on the page can read it.** The Sentry lesson: default crash SDKs capture `location.href` including the fragment. The fragment protects against the network, not against code on the page — hence the ingest-strip discipline of §2. (boot-deeplinks §1.1)
- **`web3://` is NOT browser-registrable** — the `registerProtocolHandler` safelist admits `ipfs`/`ipns`/`dweb` but not `web3`, and `web+` prefixes are the only escape. **`web+efs://` is an alias lane only** (manifest `protocol_handlers` + runtime registration, Chromium-side, never Baseline): the OS registers it where available and redirects into canonical https form. Alias ingress arrives via `%s` **query** substitution, so alias links MUST NOT carry capability sub-segments — the share UI only ever emits `web+efs://` for preview-safe links, and the shell rewrites query→fragment via `replaceState()` as its first act. Scheme links are never load-bearing: Safari/Firefox users lose nothing. **[research-grounded]**; the safelist gap is a protocol pressure item (§Open).

### 1.2 Link taxonomy — [research-grounded] classes, [reasoned] assignments

The web3:// grammar ([[read-lens-spec]] §6.3–6.5) is canonical for *what a link names*; OS classes say *what the OS does when one arrives*. Classes carried as the first fragment tag:

| Class | Tag | Payload (all per §6.5 grammar where applicable) | What boots | Resolution context |
|---|---|---|---|---|
| Path link | `p` | web3:// path form, recipient's-lens resolution | viewer or full Shell | INTERACTIVE |
| Citation link | `c` | `~claim:` + `?lenses=` chain + `deny=` + `asof=` + **hash-pin** (§1.2/§6.5 citation form, verbatim) | **minimal viewer closure** (§3.3) | INTERACTIVE, reproducible |
| App link | `a` | app identity (author word + app-root record) + optional in-app route | Shell + app; **zero-power install** if absent | INTERACTIVE; grants never ride links |
| Generation link (exact) | `gx` | closure-manifest CID (+ venue hint) — flake **`locked`** | that exact closure, as a guest session (§4.1) | GATE (verification), then consent |
| Generation link (follow) | `gf` | channel-pointer record id + lens context — flake **`original`** | channel resolved under *recipient's* lens → latest manifest | **GATE** (§3.3 consumption rules apply) |
| Permission-prompt link | `pr` | capability request descriptor (type-shaped, picker-routed) | System Chrome prompt; **never an auto-grant** | — |
| Sync-state link | `sy` | journal/outbox checkpoint ref (pending-state ladder position) | Sync Center view; never auto-merge | INTERACTIVE |
| Capability sub-segment | `k` | biscuit-style token or raw decryption key (§2.3) | consumed by Kernel; never a class of its own; always terminal | — |

Every class may carry an optional `g.<manifestCID>` **generation hint** — honored only for viewer selection inside the booted generation's compat range. A hint never switches generations; only `gx`/`gf` classes do, and only with consent (§4.2).

### 1.3 The fragment grammar `#efs1.` — [reasoned], grammar frozen small (the flakes lesson)

```
fragment  = "efs1" 1*( "." segment )
segment   = tag / payload
tag       = 1*3( base64url-char )                  ; class and modifier tags
payload   = enc-flag base64url-data
enc-flag  = "u" (raw UTF-8, b64url'd) / "z" (deflate-raw then b64url)
```

- **Alphabet invariant:** the entire fragment matches `[A-Za-z0-9._-]+`. Base64url plus dot means the browser's `:~:` fragment directive is **unconstructible** — no payload can ever be truncated by Text-Fragment stripping. This is a conformance test, not a hope.
- **Compression:** anything structured compresses with `deflate-raw` via native `CompressionStream`/`DecompressionStream` (Baseline 2023-05, worker-available) — the Mermaid `#pako:` pattern with platform primitives. **[research-grounded]**
- **Versioned:** `efs1` is load-bearing. Unknown versions render the resolver surface's "newer link than this OS" state with the raw string preserved; unknown *tags* within `efs1` are ignored-but-displayed. The grammar freezes tiny and versioned precisely because half-frozen pinning formats fork ecosystems (closures-generations §4.1).
- The `k` sub-segment is **always terminal**, so a preview-safe copy is the same string truncated before `.k.` — derivable by any holder, no re-encoding.

### 1.4 Size tiers — enforced in the share UI, not documented in a footnote — [research-grounded]

| Tier | Budget | Content discipline |
|---|---|---|
| QR | ≤ ~300 chars | by-reference only: class + venue + id + hash-pin. No embedded state, no lens chains. Past ~300 chars scan rates collapse |
| Chat | ≤ 2,000 chars | Discord floor. Citation links with lens+deny chains and pins live here; compress |
| Max | ≤ ~64 KB | Firefox practical floor. Embedded-state links (e.g. sync-state payloads); share UI warns and offers by-reference alternative |

The share UI computes the tier live and refuses to emit a link that overflows its declared medium. A link grammar not designed to a byte budget fails at the exact moment of sharing.

### 1.5 Preview-safe vs access copies; unfurl posture — [research-grounded]

Share UI always offers two copies: **"Copy link"** (preview-safe — no `k` segment) and **"Copy access link"** (capability-bearing), the latter with the honest disclosure: *"Anyone holding this link can open the content until it expires. Pasting it into a non-E2E channel (Slack, Discord) discloses it to that platform permanently."* The channel stores the message even though the fetch can't see the fragment. Minting an access link is a Kernel event (F7's export-is-a-security-event applies: expiry on by default, custody tracked, revocable at the token layer per §2.3). No per-link OG rendering exists or is wanted — static host, generic card, `focus-existing` routing (§5.1) makes shared links land in the running OS.

---

## 2. Fragment capabilities

### 2.1 Ingest, strip, hand off — before anything else runs — [research-grounded]

Order is normative:

1. The static shell's **inline first script** (Ring 0, first-party, the only code on the page) synchronously captures `location.hash` into a closure variable.
2. It immediately `history.replaceState()`s the `k` sub-segment away (the rest of the fragment survives for reload/bfcache semantics). This replicates, at the Bootstrapper boundary, what browsers themselves do to `:~:` directives — "part of the fragment hidden from later code" is shipped platform behavior, not an invention.
3. The captured token transfers to the Kernel worker via postMessage; the Bootstrapper's reference is dropped. The Kernel validates, mints a capability handle (F8 caretaker semantics), and never persists the raw token.
4. **Only then** does Session Shell load. Ring-3 apps run in Workers with no DOM: they can never read `location` at all — they receive capability objects or nothing.

Residual leaks stated honestly: the pre-strip URL touches browser history and history-sync services (the TAG leak list) for the milliseconds before step 2, and the *sending* channel stores it forever (§1.5). Strip narrows the window; it does not unshare a shared link — token expiry and revocation do.

**No third-party telemetry in Ring 0/1, ever.** The thesis already bans telemetry outright; this doc adds the mechanical rule: after step 2, no Ring-0/1 code path may read `location`. If any error capture is ever added (it should not be), fragment-scrubbing is a merge-blocking requirement, not a config option.

### 2.2 The service-worker fragment traps — [research-grounded]

Since the 2017 fetch-spec change, `FetchEvent.request.url` **preserves fragments**, including on navigations. Two mandatory disciplines: (a) the SW is inside the secrecy boundary — it must never log request URLs anywhere; (b) **normalize before caching**: strip fragments before every `cache.match()`/`cache.put()`, or fragment-bearing links fragment the cache key-space — a correctness bug (cache misses on identical pages) and a poisoning surface (attacker-chosen fragments minting duplicate entries and forcing network fetches). Both are conformance tests in the SW suite.

### 2.3 Token construction — [reasoned]

Two grades of link-borne capability:

- **Pure decryption caps** (the `#k=` salted-path key of [[read-lens-spec]] §6.5): random ≥128-bit keys, Excalidraw-grade. Fine as raw material; the bytes they unlock are already content-addressed and authenticated.
- **Authority-bearing caps**: adopt a **biscuit-style construction** — public-key signed blocks with offline attenuation, third-party verifiable with no shared secret and no server. A holder mints a *weaker* link (read-only, expiring, venue-pinned, single-target) with zero infrastructure — exactly EFS's chain-free envelope philosophy, and the W3C TAG capability-URL lifecycle (expiry, revocation, canonical-URL pairing) implemented in the token rather than in a server. This is unoccupied design space (boot-deeplinks §1.4); it is [reasoned], not shipped precedent — prototype before freeze, and mind the token's byte cost against §1.4 tiers.

### 2.4 What a link-borne capability may and may not do — [reasoned]

- A fragment capability is an **offer**, never a grant. Content-scoped read caps (decryption keys for bytes the link designates) open without a prompt — designation is authorization, the link *is* the picker — but the resolver surface labels their provenance.
- Anything conferring standing authority — endpoint capabilities, persona access, write scopes, agent budgets — routes through **System Chrome review** before entering the capability table. **Deep links never smuggle endpoints:** an endpoint named in a link is a rendered *proposal* carrying its privacy class (F5), requiring the same explicit grant as any picker flow. A link can propose; only the user (or a standing policy the user authored) disposes.
- `pr` permission-prompt links deep-link *to* a System Chrome prompt; they pre-fill nothing silently and are never satisfiable by an agent alone (F9/T3).

---

## 3. The boot pipeline

### 3.1 Stages — [research-grounded]

```
click → static shell → (SW thin router) → Bootstrapper verify → Kernel slice → route by class
```

| Stage | Ring | Budget | Does |
|---|---|---|---|
| Static shell | 0 | ≤15 KiB, inline CSS+JS, zero deps | paints honest "resolving…" from fragment data alone (§5.3); captures+strips `k` (§2.1); registers SW + spawns Kernel worker in parallel |
| SW thin router | — | route/cache/verify-hand-off ONLY | Static Routing API (`cache`, `race-network-and-cache`) so immutable CID assets skip SW wake entirely; ServiceWorkerAutoPreload accepted as a free Chromium win; **navigation preload OFF** for the cache-first shell (it re-downloads HTML you'll discard). The SW is **never the network boundary** — that is the Kernel's broker (F5); the SW is a cache-shaped optimization that must be assumed absent (first visit, Firefox variance) |
| Bootstrapper | 0 | no UI | loads the **pinned generation**: verifies Kernel CID, Shell CID, and the import map's per-module integrity against the closure manifest **before executing a byte of either** — the Bybit lesson: what runs must be what was signed, checked client-side, every boot |
| Kernel slice | 1 | minimal: capability table load, journal open, link classifier | ingests the stripped fragment, classifies the link, mints the boot route; venue reads and head/checkpoint fetches come *after* first paint |
| Route | 1½–3 | per §3.3 | minimal viewer closure or full Session Shell; System Chrome resolver surface throughout (§5.3) |

**Health gate + Rescue trigger:** a generation is marked `successful` only when Bootstrapper→Kernel→Shell reach a healthy checkpoint (the Android `markBootSuccessful` pattern). Keep current + previous always; on boot failure, auto-fall-back to last-successful — that fallback *is* the Rescue Shell trigger. Failing twice lands in Rescue Shell proper: recovery, rollback among locally verified generations, permission reset, export. (closures-generations §5.4)

### 3.2 The unikernel principle — [reasoned]

**A citation link boots Bootstrapper + a Kernel slice + exactly one viewer — not the whole OS.** The closure manifest partitions its import map into named slices (`boot`, `kernel-core`, `viewer-<type>`, `shell`, per-app); the link class selects the minimal slice set. A `c` link on a fresh device downloads the boot slice, one viewer, and the cited bytes — nothing else. The full Shell is a *promotion* the user can invoke from the viewer chrome ("Open in EFS OS"), warming the remaining slices in the background after first paint, never before it. `p` links to containers boot the file-manager viewer; `a` links boot Shell+app; only home/`gx`/`gf` links boot everything.

### 3.3 Cold-start budgets are product requirements — [research-grounded]

P75 device = Samsung Galaxy A24-class, 9 Mbps down / 100 ms RTT (Russell 2026). Budgets, enforced in CI against a throttled profile:

| Metric | Budget |
|---|---|
| First boot to interactive verified viewer (citation link, fresh device) | **≤ 3.0 s** |
| Critical-path weight to that state | **≤ 1.2 MiB total, ≤ 0.62 MiB JS** (JS-heavy row; JS is the coffin corner) |
| Serialized RTTs after the static shell | **≤ 2** — manifest+import-map arrive with the shell or in one round trip; `modulepreload` flattens the module graph; every serialized fetch is 100 ms gone |
| Repeat boot, healthy pinned generation | **< 1.0 s, zero network before render** (cache/OPFS only; the head/checkpoint fetch fires after paint) |
| SW wake cost when Static Routing unavailable | assume 250 ms mid-mobile; budgeted, not wished away |

**The first-visit cliff, stated honestly:** the first click on a fresh device has no SW, no cache, no pinned generation. That load is a **TOFU event** on whatever origin/gateway served the shell (F11's untrusted-root-bootstrap step): integrity checks on that boot verify internal consistency against the manifest *the gateway chose to serve*. The UI says so — "first load: trusting <origin> to introduce this OS" — and every subsequent boot verifies against the user's pin. The IPFS SW-gateway (inbrowser.link) documents the same structural asymmetry; we do not pretend otherwise, we engineer the cold path as its own product (§3.1 shell budget exists for exactly this path).

### 3.4 The import map is the generation's dependency manifest — [research-grounded]

One content-addressed import map per generation: every specifier maps to a CID URL with per-module `integrity` (native Chrome 127+/Safari 18+ — the enforcement layer, not a lint). The closure manifest embeds it; the manifest CID **is** the generation name and a shareable `gx` link; `@gen=` pinning is the `g` hint of §1.2. Upgrading = swapping one small JSON through the F4 channel machinery; rollback = swapping back; unreferenced modules cost nothing at boot. Multiple-import-map support (Chrome 133/Safari 18.4) permits app-scoped maps layered over the OS map — used for Ring-3 slices, feature-detected.

---

## 4. Profiles and generations at boot

### 4.1 What a generation link opens — [reasoned]

- **`gx` (open-exact, flake `locked`):** verify the manifest CID, fetch the closure, boot it **as a guest session** — sandboxed profile, empty capability table, the guest's journal is throwaway. A guest generation never touches the user's pin, journal, keys, or capability table. Banner: "Running a shared system — your data is not attached."
- **`gf` (follow-channel, flake `original`):** resolve the channel pointer under the **recipient's** lens with full read grades. Booting is a machine-acting consumption, so **§3.3 GATE rules apply mechanically**: only `LIVE @ HOME-LIVE` or `LIVE @ AS-OF(N), age ≤ H` with a clean deny pass may auto-proceed; STALE/UNKNOWN/EQUIVOCAL channels stop and present the grade. An expired **freshness beacon** on the channel ⇒ STALE ⇒ refuse auto-follow, offer the last verified manifest with an honest label (F4). The Guix fast-forward rule holds at boot: a backward-moving channel pointer renders the channel **suspect-backward** (client state, deliberately not a protocol grade word — [[packages-and-updates]] §6), never auto-followed.

### 4.2 Switching generations = explicit, consented, whole-document reload — [reasoned]

No hot-swapping the OS under a running session. Adopting a generation (from `gx` guest promotion, `gf` follow, or the update center) is: consent screen → journal checkpoint → full navigation reload → Bootstrapper verifies the new closure → health gate → `successful` or auto-fallback. The journal and user data are never touched by generation switches (the Android userdata wall); the data-schema-migration ledger of [[packages-and-updates]] governs the one-way doors.

### 4.3 Sharing a profile is sharing a Trojan vector — [research-grounded]

A profile/generation link is a link to *someone else's wiring*. Importing one (promoting a guest to your pin, or accepting a friend's "here's my setup") runs the **full install review**: the capability-table diff *is* the review surface (capability-table-as-data, F4/F8) — every app, every grant ceiling, every endpoint capability and its privacy class, every persona binding, rendered as a diff against your current generation. Same-author convenience shortcuts do not exist here; a shared Shell is the highest-value spoof target in the system.

### 4.4 Boot-time revocation posture — [open — protocol gap]

The closure manifest is a DATA **object**, and objects are unrevocable ([[codex-envelope]] domain disjointness) — what changes after the fact are the *claims around it*: the placement/head claims that made it "the channel's current release" can be REVOKED (the slot reads EMPTY), and deny facts can be published against its dataId/claimIds. A user pinned to a generation whose placement claims are later revoked, or which accumulates deny facts (vulnerable Kernel, malicious Shell), may boot offline forever without learning any of it. Policy sketch pending protocol support: (a) when any transport exists, the Bootstrapper's post-paint head check re-resolves the *generation's placement/head claims and deny status*, venue-qualified with "last checked" age; (b) a closure whose placement was revoked or which carries deny facts remains **user-bootable** (permanence; rollback is a right) but boots into a loud System Chrome interstitial ("withdrawn by its curator" / "N security sources advise against this generation") and disables auto-follow; (c) offline, the pin's last-checked age is displayed at boot past the trust/authorization horizon (7d default). What the protocol lacks: a composite grade for a multi-record closure resolution and a normative boot-artifact revocation-check rule — both filed in Open questions and the pressure report.

---

## 5. Launch handling

### 5.1 Focus-existing — [research-grounded]

Manifest `launch_handler: { client_mode: "focus-existing" }` + a `launchQueue` consumer in Ring 0: a deep link clicked while the OS runs routes the parsed link into the **live Kernel's classifier** — no second boot, no reload, the running Session Shell opens the target. Chromium-only, progressive; on Safari/Firefox a second instance boots and the journal's single-writer lock (Web Locks) makes the newer instance read-only with a "take over" affordance. bfcache covers back/forward warm paths for free.

### 5.2 File and share-target handlers are picker-shaped grants — [reasoned]

`file_handlers` ("Open with EFS OS") and `share_target` (OS share sheet) registrations ride the generation manifest like every other capability declaration. An arriving file handle or shared payload is a **designated capability**: the OS receives exactly those bytes/handles, System Chrome shows the app-chooser (a picker — designation is authorization), and the chosen Ring-3 app receives a scoped handle through the membrane. Nothing ambient is created; both APIs are Chromium-only and strictly additive.

### 5.3 The resolver surface: context before content — [reasoned]

Between click and content the user watches a System Chrome surface (not app-drawable, by F1 construction) that fills in, in order: **link class → target venue → lens context → grade → content**. Concretely: "Citation link · venue: <chain> · pinned to the sender's lens chain — reproducible" vs "Path link · resolving under **your** lens — the sender may see something different." Capability offers (§2.4) and generation consent (§4) render here. The surface is honest about *which* step is pending (fetching manifest / verifying closure / contacting venue / no transport), so a hang is diagnosable and a spoof has to fake process, not just a spinner.

---

## 6. Read-grade honesty at boot

Cold boots render from cache before any venue is contacted. Rules, using only the closed §2 vocabulary of [[read-lens-spec]]:

1. **Never plain LIVE before venue contact.** Every cache render is venue-qualified from the journal's last confirmed checkpoint: `AS-OF(N)` with age displayed, flipping to `UNKNOWN-CURRENCY` past the data-class horizon (§5.3 of the spec). The first network act of a session is the single jittered head/checkpoint fetch per venue (F5); grade upgrades ripple after first paint, visibly.
2. **"No transport" is not "not found" and not "network error."** The cage means `UNKNOWN because no transport capability` is a common, legitimate state. The presentation layer distinguishes *no-transport-yet* (boot, pre-beacon), *no-transport-ever* (no endpoint capability granted), and *transport-failed* — but the protocol's grade vocabulary is a CLOSED SET and has no qualifier for this; we render it as client-side presentation state over UNKNOWN/UNKNOWN-CURRENCY and file the **NO-TRANSPORT qualifier** as a pressure item rather than inventing a grade. The lane digest's "STALE-until-verified" name is rejected: STALE has a normative meaning (expired-not-revoked) and overloading it would slander cached-but-current data.
3. **Citation links verify offline.** Deterministic, client-computable record IDs + the link's hash-pin let a fully offline device authenticate cited bytes from cache with zero fetches and label them with the offline-bundle grade column ("A said this, unrevoked as of N") — exploit this loudly; it is a differentiator no gateway-trusting client can match.
4. **Deep links never upgrade grades.** A link's `asof`/hash-pin can *narrow* what is shown; it can never cause a render to claim more currency than the venue evidence supports.
5. **Eviction is an event.** A boot that finds its pinned generation partially evicted (browser storage is best-effort; origins are evicted LRU-wholesale) reports "the browser deleted local data" per the thesis honesty doctrine, degrades to re-fetch-and-verify, and never silently re-TOFUs.

### Honesty obligations

- First-visit TOFU stated in UI at the moment it happens, not in docs only (§3.3).
- Access-link copies carry the platform-disclosure warning verbatim (§1.5); preview-safe is the default copy action.
- The resolver surface always names the lens being used and whether the sender's view can differ (§5.3); "resolved under your lens" is never implied to be the sender's truth.
- Guest sessions are visibly guest (§4.1); a shared generation never silently becomes the pin (§4.3).
- Boot renders show checkpoint age before venue contact; no green anything on verification success — verification failure is loud, success is plain (negative-indicator doctrine).
- Rescue fallback announces *why* ("generation <name> failed its health gate; running last-successful").

### Agent lens

- Links are the agent-visible addressing model: the same `#efs1` grammar, the same classes, no agent-special URLs. An agent dereferencing a link is a **plan step** with declared venue/scope; a link arriving inside untrusted content is data — it can fill a declared data slot but can never add or reorder actions (CaMeL rule, F9).
- Agents may compose preview-safe links freely. Minting an access link requires holding the underlying capability handle and is a checkpoint-gated export (F7) — an agent alone cannot satisfy it.
- The unfurl channel is a zero-click exfiltration vector for injected agents (platform bots auto-GET what agents cause to be rendered): OS surfaces that emit agent-composed text lint outbound URLs — any URL carrying non-fragment payloads or unrecognized query keys is flagged before send. Kernel-side, the broker's normal endpoint capability rules already deny arbitrary GETs.
- `pr` and `gx`/`gf` consent surfaces are System Chrome checkpoints; agent sessions can *reach* them, never *pass* them (T3/T5).
- Dry-run honesty: because record IDs and manifest CIDs are client-computable, an agent's "this link will open X under generation Y" claim is verifiable before any fetch — receipts for link-opens cite the resolved grade.

---

## Open questions

- [ ] **[protocol gap] NO-TRANSPORT qualifier.** §2 of [[read-lens-spec]] is a closed set; boot needs a normative currency/flag for "no venue contact yet / no transport capability," or every client invents presentation dialects. Candidate: a flag, not a disposition. (Pressure report item.)
- [ ] **[protocol gap] Composite closure grade.** A generation resolves from many records (channel pointer, manifest, packages, byte sets); the protocol grades per-record only. Need a normative composition rule ("closure grade = worst of inputs, venue-qualified") — home: read-lens-spec or Codex. (closures-generations §6.1)
- [ ] **[protocol gap] Closure completeness over BYTES-\*.** "Bootable offline" is an all-or-nothing predicate over many byte sets; per-object BYTES-UNAVAILABLE doesn't compose into it. Needs a defined closure-completeness notion + partial-closure UX.
- [ ] **[protocol gap] Boot-time revocation policy for pinned closures** (§4.4): may a placement-revoked or deny-marked generation be user-booted (this doc says yes, loudly labeled)? What check cadence is normative for boot artifacts specifically?
- [ ] **[protocol gap] `web3://` has no browser on-ramp** — safelist excludes it; the `web+efs://` alias convention needs a normative home in the §6.5 URL-surface owner, or standards work to safelist `web3` as IPFS did.
- [ ] **[protocol gap] Lens-relative link portability.** A path link cannot pin what the recipient sees; citation form covers reproducibility, but a *sender-lens hint* segment (fallback lens / attestation-pin) for path links needs a §6.5 query-key extension ruling — plus the "your lens ≠ sender's" label this doc already mandates.
- [ ] Biscuit-style token construction: prototype the block format, measure byte cost against the chat tier, decide attenuation vocabulary (read-only / expiry / venue-pin / single-target) before freezing `k` semantics.
- [ ] `efs1` grammar freeze review: one round of hostile-input review (fragment fuzzing, `:~:` constructibility proof, alias-lane query rewriting) before any share UI ships.
- [ ] Safari/Firefox double-instance UX (§5.1): is read-only-second-instance + take-over sufficient, or does the journal need multi-writer leases?
- [x] F12 amendment: replace "navigation preload" with "Static Routing + auto-preload; navigation preload disallowed for the cache-first shell" in [[web-os-thesis]]. — resolved by [[web-os-thesis]] Amendment 12 (2026-07-07)

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Model docs in this folder reconciled against [[web-os-thesis]] rulings (no contradictions; F12 amendment landed or rejected)
- [ ] EFS v2 pressure report filed under `Designs/efsv2/` and cross-linked (the six [protocol gap] items above)
- [ ] At least one round of `#status/review` with another agent or human comment
