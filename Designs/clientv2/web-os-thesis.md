# Client v2 — the web OS thesis

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[fable-client-v2-handoff]], [[os-research-compass-for-fable]], [[agent-native-os-compass-for-fable]], [[read-lens-spec]], [[codex-envelope]], [[codex-kinds]], [[codex-kernel]], [[identity]], [[ops-doctrine]], [[apps-cookbook]], [[mirror-scheme-policy]], [[sdk-vs-client-responsibilities]]
**Supersedes:** the 2026-05-26 ring-architecture sketch ([[2026-05-26-pm-client-os-architecture]]) as design truth — its instincts survive, its mechanisms are re-cut below
**Reviewers:** —
**Last touched:** 2026-07-22 — codex-gpt-5 (app-model research correction; original fable-5)

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> **Evidence base:** 14-lane research corpus at `Reviews/2026-07-07-clientv2-corpus/` (dated primary sources in every lane digest), plus the full EFS v2 design set. Confidence markers as in [[fable-handoff-v2-tag-core]]: **[research-grounded]** — supported by shipped-system evidence or the v2 rulings; **[reasoned]** — argued but untested; **[open]** — genuinely undecided.

> **Cross-cutting research frame:** [[ethereum-first-efs-and-os]] asks how this OS can remain a cypherpunk, local-first human environment while EFS remains proudly Ethereum-first and EVM-useful. Its architecture shapes and non-chain modes are research possibilities; they do not amend the rulings below.

## What this document is

The ruling layer for official client v2. It states the thesis, rejects the old-OS assumptions that don't survive contact with EFS's primitives, adopts the new ones, and closes the thirteen architectural forks enumerated in `Reviews/2026-07-07-clientv2-corpus/decision-framework.md`. The per-model design docs in this folder elaborate each ruling; where they and this document disagree, this document wins until amended.

## The thesis

```text
EFS OS is a static, content-addressed, capability-routed, local-first web OS.
Its kernel objects are EFS's primitives: signed records, lenses, venues, grades.
Its security boundary is the browser's, used honestly.
Its promise is fourfold:
  verify, don't trust    — unverified bytes never render;
  label, don't lie       — every answer carries its grade, venue, and age;
  grant, don't assume    — designation is authorization; nothing is ambient;
  keep, don't lock       — generations, rollback, export; no forced anything.
```

Two findings from the research make this more than a slogan:

1. **The entire dweb ecosystem admits it never shipped client-side verification.** IPFS documents gateway trust as an anti-pattern it hasn't closed; the Bybit frontend compromise ($1.5B) was a display-vs-signed-bytes divergence; EthStorage's Colibri is still a prototype. An EFS client where *no unverified byte ever renders* — envelope signatures, content hashes, and `eth_getProof` checked in the client, gateways demoted to dumb capability-chosen pipes — would be the first of its kind, and it is buildable today (Helios light client, verified-fetch, import-map integrity are all shipped). **[research-grounded]**
2. **Every failed web OS died of the same three causes** — distribution owned by misaligned partners (Firefox OS), proprietary packaging fighting the open web (Chrome Apps), or platform-first novelty with no retention app (Urbit, Solid). The living relatives (MetaMask Snaps, ATProto, Isolated Web Apps) prove the pieces EFS needs are individually production-real. The design below deliberately combines only proven pieces; the novelty is in the combination and in the honesty doctrine, not in inventing new sandbox physics. **[research-grounded]**

## Rejected old-OS assumptions

| Old assumption | Why EFS rejects it | Replacement |
|---|---|---|
| The OS owns the machine | The browser owns the machine; the OS is a guest with revocable storage | Protection **tiers** with honest loss labels (§F7-adjacent; persistence doc) |
| Install = trust decision | Content-addressed packages are inert bytes; running with zero grants is safe | **Zero-power install**; trust gates *grants*, not execution **[research-grounded]** |
| Update = replace in place | Permanence makes every version fetchable forever; mutation is a lie about history | **Generations** — append-only closure manifests, health-gated activation, rollback as a read |
| Delete = destroy | Protocol truth: revoke unlists, bytes persist | "Unlist / withdraw placement" vocabulary everywhere; local cache deletion is the only real delete |
| The filesystem is the truth | Truth is venue-relative, graded, lens-resolved | Read grades and venue qualifiers are *kernel state*, rendered by every surface |
| Permissions are booleans in a ledger | Booleans rot into ambient authority; prompts habituate to noise | **Live capability handles** — severable, attenuated, receipted; **pickers as the grant** |
| The app paints its window | Shared DOM = spoofable chrome, unfixable exfil channels | **Apps own no pixels**; they hold render capabilities the Shell composites (§F1) |
| One trusted vendor updates the OS | The steward can die (Urbit Foundation insolvency; Solid handed off; Mozilla's pivots) | User-pinned generations + Rescue Shell as a hedge against *our own* mortality **[research-grounded]** |
| Locale is a settings page | Locale shapes reading, sorting, input, receipts — and fingerprints users | Locale as a mediated OS service with a disclosure budget (§F10) |
| Agents are users with a keyboard | Prompt injection is vendor-admitted unsolvable; ambient authority is the kill chain in every real incident | Agents as a **fourth principal class** behind the same capability kernel, plan-frozen, budgeted (§F9) |

## Adopted primitives

- **The closure manifest** — one content-addressed record naming the whole bootable system: Kernel CID, Shell CID, import map (with per-module integrity — native in Chrome 127+/Safari 18+), app package CIDs, policy documents, locale/font pack CIDs, OS SDK range. The manifest CID *is* the generation name and a shareable hyperlink. flake.lock's `original`/`locked` split adopted verbatim: every entry carries both the follow-spec (channel/lens/constraint) and the exact pin. **[research-grounded]**
- **The capability table as data** — the Kernel's routing/grant state is a first-class, diffable, content-addressed artifact (Genode/Sculpt precedent; capDL as boot-state-as-checkable-graph). The wiring diff *is* the install review; the table snapshots with each generation and rolls back with it. **[research-grounded]**
- **The journal** — an event-sourced, append-only, encrypted local op log as the canonical pending truth; every materialized view (slot tables, path trees, lens resolutions) is a rebuildable cache. Optimistic overlay = last confirmed venue checkpoint + pending ops replayed on top; never advance the confirmed snapshot past a slot with pending local writes (PowerSync rule). **[research-grounded]**
- **The outbox and the checkpoint** — signing is EFS's natural powerbox moment: batch review = authority review. Draft-first by default; a signed bundle is treated like a PSBT — encrypted at rest, export is a security event, default expiry on interactive bundles. **[research-grounded]**
- **The pending-state ladder** — `draft → planned → ready_to_sign → signed → queued → flushing → submitted → partially_admitted → complete_on_chain → chain_finalized → replicated` as *normative OS SDK vocabulary*, composed with read grades, so apps cannot invent dialects of "saved". (Adopted from the handoff; the local-first lane confirmed every serious system converges here.)
- **Read grades as UI physics** — RR1–RR12 of [[read-lens-spec]] bind every surface. One shared string catalog so STALE-vs-REVOKED wording cannot fork per client. Negative indicators over positive: warn on REVOKED/EQUIVOCAL/UNKNOWN; never build a "green check = safe" habit (SiteKey evidence). **[research-grounded]**
- **Petnames over the lens graph** — trusted-author lists are petname directories; raw addresses and global nicknames are never trust signals; `<efs-identifier>` renders addresses LTR-isolated, chunked, confusable-checked. **[research-grounded]**

## The architecture ruling

```text
Ring 0  Bootstrapper     main thread; verifies + boots a pinned closure; no UI
Ring 1  Kernel           dedicated worker; capability router, journal, policy,
                         network broker, crypto, venue reads
Ring 1½ System Chrome    Kernel's rendering arm: prompts, pickers, permission
                         center, install review, wallet ceremony, Rescue Shell
Ring 2  Session Shell    window manager, launcher, workspaces, modes
                         (desktop/mobile/kiosk/console/agent) — replaceable in principle
Ring 3  Apps             SES compartments inside dedicated Workers;
                         no DOM, no network, no pixels — only capabilities
        Render service   sandboxed-iframe lane for untrusted *documents*
                         (HTML/SVG/PDF mirrors), per mirror-scheme-policy
```

The load-bearing change from the 2026-05-26 sketch: **apps do not live on the main thread and do not touch the DOM at all.** They live in Workers. Everything else follows from that.

## Fork rulings

### F1. The Ring-3 cage: SES-in-Worker, render as capability — **[research-grounded]**

Three independent layers, always, per app:

1. **SES/Hardened JS**: `lockdown()` + per-app Compartment endowed only with the attenuated `efs.*` object. Production-proven (Snaps, Agoric; LavaMoat demonstrably stopped the Dec 2023 Ledger supply-chain attack) — but treated as *hardening, not the boundary* (the 2024 lavapack `with()`-bypass says why).
2. **The Worker boundary**: app code runs in a dedicated Worker from a `blob:` URL, which **inherits the embedding page's CSP** — enforceable on a static/IPFS deployment with no server headers. A Worker structurally has no DOM, no navigation, no `window.open`, and **no `RTCPeerConnection`** — which closes exactly the exfiltration channels CSP cannot close (WebRTC is not covered by `connect-src`; `navigate-to` was removed from CSP in 2022; DNS-prefetch/prerender bypass CSP in DOM contexts).
3. **Declarative denial**: `default-src 'none'; connect-src 'none'; script-src 'self' blob:; worker-src blob:; form-action 'none'; base-uri 'none'; object-src 'none'` as the cage baseline, plus Permissions-Policy stripping of every device capability, plus Trusted Types (Baseline 2026) in the Shell's own renderer, plus COOP/COEP `require-corp` (Safari floor: no `credentialless`, no `webrtc` CSP directive — design to Safari).

A worker with `connect-src 'none'` whose only channel is postMessage to the Kernel is **the only configuration the research found that can be made airtight for network egress.** Sandboxed iframes are *demoted to the render service* — the lane for untrusted documents (mirror bytes), never for app logic; an iframe with both `allow-scripts` and `allow-same-origin` is no sandbox at all, and DOM contexts leak via navigation and WebRTC regardless of CSP.

**Consequence — apps own no pixels.** An app expresses UI through render capabilities:

- **Surface mode (default):** a declarative UI tree / command stream in an OS SDK schema, reconciled by the Shell into real DOM built from system components (Lit + Web Awesome). Precedents: MetaMask Snaps' JSX-returned UI, Figma's plugin split (logic sandbox + iframe UI), Android RemoteViews. This is where security, accessibility, i18n, and agent-readability all align: the Shell owns real DOM (screen readers see true semantics), locale/direction/theming apply uniformly, and the same declarative tree is the agent-visible UI. The known cost is expressiveness (the eternal RemoteViews complaint) — mitigated by a rich component set and the next two modes.
- **Canvas mode:** a transferred `OffscreenCanvas` the app paints, composited inside a Shell-drawn frame — for editors, games, visualizers. Requires a semantic sidecar (accessible tree) for anything interactive.
- **Document mode:** the render service (sandboxed iframe, separate lane) for rendering untrusted document content.

### F2. Protection domains, honestly — **[research-grounded]**

Bootstrapper, Kernel, System Chrome, and Session Shell share one origin (static, IPFS-distributable). The browser's real protection domain is the origin, so the design *says out loud*: the Kernel-in-a-Worker is modularity and crash isolation, **not** a cryptographic enclave. WebCrypto has no secp256k1, so EFS author keys are software keys in worker memory; at rest they are wrapped by non-extractable WebCrypto AES keys derived via **passkey PRF** (broadly supported 2025–26) and/or a wallet-derived secret, so encrypted state survives total origin eviction and is re-openable. Shell-origin compromise = local-state compromise; the defense budget therefore goes to the Shell's dependency diet, LavaMoat policy over our own supply chain, Trusted Types, and reproducible builds — not to pretending the worker boundary is more than it is. Where real key protection is wanted, route to an external signer (wallet, hardware, passkey ceremony) — see F6/T10.

### F3. Shell: split, then plural — **[research-grounded]** on the split; **[reasoned]** on plurality timing

What the handoff calls "Shell" is two trust classes fused. We split them:

- **System Chrome** (Ring 1½): secure prompts, pickers, permission/install review, wallet ceremony, sync honesty, recovery. Kernel-adjacent, first-party, *not replaceable by the thing it supervises*. The Snaps audit record is decisive: 40 audits found consent-UX and origin-display bugs, not sandbox escapes — **the prompt surface is the attack surface**, so it must be the most conserved component.
- **Session Shell** (Ring 2): windowing, launcher, workspaces, layout modes (desktop/mobile/kiosk/console/agent). v2 ships one first-party Session Shell with modes + a **Rescue Shell**; the Shell contract is written against the OS SDK so third-party Shells become possible later without forking app compatibility. Shell packages are ordinary packages: content-addressed, capability-diffed, health-gated.
- **Rescue Shell:** minimal, first-party, boots when a generation fails its health gate (Android `markBootSuccessful` pattern: keep current + previous, auto-fall-back on boot failure). Recovery, rollback, permission reset, export. This is also the hedge against steward mortality.

Secure-prompt reality check (the in-page "line of death" does not exist): because apps own no pixels (F1), an app cannot paint over System Chrome — the classic in-page spoof is structurally gone. What remains is *mimicry inside the app's own surface* and browser-level spoofs (BitB). Mitigations adopted from the research: interaction gating (activation delays, no default-focus accept, ignore too-fast clicks), user-configured **negative** indicator (absence is a tell; never a positive trust signal — SiteKey's 58/60 lesson), Kernel-derived identity in all prompts, full-address rendering (address-poisoning is a pure truncation failure; $83M+), and **T10**: above a defined risk threshold (large value, admin grants, key export), Shell-only confirmation is *disallowed* — authorization must run on a surface EFS doesn't draw (hardware wallet clear-signing via ERC-7730, or the origin-bound passkey ceremony).

### F4. Packages and updates: EFS is the registry; lenses are the channels — **[research-grounded]**

- **App identity** = (author identity word, app-root record), *never* the signing-key hash (IWA's key-as-identity has no rotation story) and never a vanity path.
- **Version identity** = package content hash; releases are immutable placements; names are petnames.
- **Map TUF onto EFS records instead of importing it:** targets → release manifests (DATA); snapshot → channel LIST head; timestamp → small **freshness-beacon** records exploiting `expiresAt` (expired beacon ⇒ channel STALE ⇒ refuse *auto*-update with an honest label); root → the user's lens entry. What TUF has that lenses lack — thresholds — becomes **k-of-n curator quorum** evaluated client-side: auto-install requires k independent curator attestations; 1-of-1 channels are manual-install-only. **[reasoned]** on the quorum constant; the mechanism is grounded.
- **Update semantics:** Chrome's disable-until-approved is the shipped precedent — any update that broadens capabilities, adds endpoints, or changes signer runs under old grants (attenuated) or blocks until the diff is approved. Same-authority updates may auto-apply per channel policy, after a **24–72h cooldown measured from chain admission** (EFS's unforgeable timestamps make cooldowns un-gameable — a genuine advantage over every existing registry).
- **Zero-power install is the headline**: running any content-addressed app with zero grants is always safe; curation, provenance, cooldown age, and deny facts gate *grants and auto-update*, not execution.
- **Rollback:** user rollback among locally verified generations is always allowed; auto-follow of a backward-moving channel pointer is never allowed (Guix fast-forward rule — downgrade-as-attack and rollback-as-right are different operations). Rolling back into a release carrying a deny fact warns explicitly.
- **The client's own distribution eats this dog food:** reproducible builds, provenance records on EFS, the Bootstrapper verifying Shell/Kernel CIDs against the pinned profile before boot (the Bybit lesson), TOFU + self-pinning service worker as default, IWA-convertible packaging as the hardened lane, WAICT/WEBCAT tracked as the standards path.

### F5. Network: the broker owns every packet — **[research-grounded]**

The cage (F1) makes "no ambient network" *enforceable*: apps have no network path at all; the Kernel's broker is the only egress. Policy on top:

- **Endpoint capabilities with privacy classes:** every endpoint handle carries operator, class (`self-hosted / relayed / trusted-paid / public-observed`), and relay policy. Two independent UI indicators — *data-verified* and *endpoint-privacy-class* — never conflated: verification does not remove observation.
- **Three properties, never conflated:** integrity (solved: envelopes + CIDs + Helios/`eth_getProof`), identity privacy (partial: OHTTP RFC 9458 is boring shipped infrastructure — but no OHTTP-fronted RPC/IPFS gateway exists yet; wiring one is an EFS-specific assembly), interest privacy (unsolved in production; stated, not promised).
- **Traffic discipline as an OS invariant:** derive venue freshness for *all* cached records from a single jittered head/checkpoint fetch per venue per interval (passive timing correlation deanonymizes >95% of per-record pollers); distribute hot indexes (lens lists, deny sets, discovery, checkpoints) as content-addressed signed snapshots queried locally — the OCSP→CRLite pattern; normalize request shapes so app identity and user configuration aren't recoverable from traffic shape (Tor's uniformity-beats-configurability lesson, which directly tensions with user-sovereign profiles — resolved by keeping profile diversity out of network-observable behavior).
- **Self-hosting first-class:** localhost endpoints must handle Chrome 142's Local Network Access prompt; consider shipping a one-container "EFS home endpoint" (getProof-capable RPC + trustless gateway + optional OHTTP gateway) as the sovereign tier. **[reasoned]** on the container; the LNA handling is grounded.

### F6. Keys, personas, and the signing ceremony — **[research-grounded]** mechanics; **[reasoned]** persona doctrine

Protocol facts bind us: author = recovered secp256k1 signer; no session keys; no ERC-1271, ever. So:

- **Attenuation via personas:** per-app or per-workspace burner authors held by the Kernel sign scoped writes promptlessly under Kernel-enforced policy (budgets, kinds, subtrees); the **primary author** signs only at explicit System Chrome checkpoints. Lenses stitch personas into coherent views; a linking convention (persona TAGged under the primary, revocable) makes them one identity to readers who follow it. This *replaces* the v1-era B′ smart-account/session-key account system, which cannot author v2 envelopes at all — see the pressure report.
- **The ceremony is EFS's strength:** wallets cannot expand a Merkle root — so legibility lives in System Chrome (every record kind/target/count + computed root), and the wallet cross-checks a digest (ERC-8213 shape). The preview is *derived from the typed records themselves* and provably equal to what is signed — a strictly stronger position than calldata-guessing wallets. Ship **ERC-7730 descriptors** for the envelope schema to the EF-stewarded clear-signing registry. Note the envelope pattern now has a standards twin: **ERC-7920** (composite EIP-712, Draft 2025-03) and ERC-7964 — align leaf construction where cheap, document divergence where not.
- **Batch legibility over batch hiding:** aggregate ("312 files into /photos/2026, 4 folders, 1 lens update"), expandable, with **per-record risk classes** so one dangerous record can't hide among harmless ones (the 7702 drainer wave — >97% of early delegations were sweepers — is the memento mori).
- **Key custody ladder:** connected wallet (EOA signs envelopes; 7702/AA useful only as *submission* rails) → Kernel software keys wrapped via passkey PRF → future: P-256 passkey signers when 0x02 un-reserves (EIP-7951 precompile is live on L1 as of Fusaka 2025-12; the pressure report asks the protocol to re-examine the "KEL-era" gating).

### F7. Write lifecycle: draft-first, ratified — **[research-grounded]**

PSBT practice and Safe's front-runnable public queue settle the handoff's open question: a signed artifact is a live grenade, not a draft. Ordinary "save" = encrypted journal. Signing = explicit checkpoint. Signed bundles: encrypted at rest, default `expiresAt` on interactive-session bundles, custody tracked, export = a Shell security event ("anyone holding this can publish it, now or years from now — expiry only ages what readers make of it"; see Amendment 6 — the pre-signed abort artifact, not expiry, is the kill switch). "Sign now, submit later" and offline `.efs-bundle` export are first-class *user actions*. The flush engine is a dumb resumable outbox: at-least-once, idempotent on deterministic claimIds, per-record admission tracking, offset-probe-then-append for chunk uploads; Background Sync is Chromium-only so flush-on-foreground with a visible Sync Center is the portable pattern; `navigator.onLine` is never trusted.

### F8. The OS SDK transport: ports, membranes, pickers — **[research-grounded]**

Capabilities are **MessagePorts minted by the Kernel** — unforgeable, transferable (delegation), severable (revocation), web-native (Fuchsia's channel model in browser primitives). Every grant is a Kernel-side caretaker proxy carrying a printable scope descriptor, expiry/decay, pause/revoke, and an invocation audit trail; persisted grants are Sandstorm-style tokens whose *restore re-evaluates current policy* — never rehydrated raw. Deep attenuation at the postMessage membrane: any object returned through a granted capability is wrapped in the same membrane. The `efs.*` object apps see is a typed veneer over ports, with TypeScript types and runtime validators generated from one IDL. **Pickers are the permission system**: apps request by *type* (Sandstorm descriptor model); Shell-owned file/folder/lens/endpoint/persona pickers return scoped handles; designation = authorization; yes/no resource dialogs are reserved for the signing checkpoint. App manifests adopt the CML tri-partition — `program` (runner + opaque block), `use` (capability ceilings), `config` (typed schema validated pre-launch), `facets` — compiled to a canonical hashed form so the manifest hash is part of app identity; resolvers (installed / IPFS / EFS-record / dev) and runners (SES-worker / iframe-renderer / WASM-later) are Kernel capabilities in the Fuchsia shape.

### F9. Agents: the fourth principal — **[research-grounded]**

User, app, system service, **agent session**. The typed plan → dry-run → approve → execute → receipt pipeline is the load-bearing security boundary, CaMeL-shaped: the plan is compiled from trusted intent *before* untrusted content is read; untrusted data fills declared data slots but can never add or reorder actions; the Kernel — not the model — validates each step. The **lethal trifecta** (private-data reads + untrusted-content ingestion + external network) is a *static Kernel invariant* no agent session may hold in full without break-glass chrome. Budgets are day-one meters (AP2 open/closed-mandate vocabulary; every deployed system retrofitted them after blowouts). Agents never hold signing keys; they enqueue into the same outbox humans use, and the T3/T5 checkpoints (sign/publish/spend/install/grant/export/delete) are **never satisfiable by an agent alone**. App-manifest action catalogs are root authority; MCP servers / A2A cards / WebMCP / llms.txt are generated exhaust. Receipts are local-first, signed, structured; publishing one to EFS is an explicit previewed write. Deterministic client-computable IDs make dry-runs unusually honest — exploit that as a differentiator.

### F10. Locale and accessibility: mediated, canonical, budgeted — **[research-grounded]**

- **`LocaleHandle` exposes methods, not data** — format/collate/segment/pluralize/translate without disclosing the profile; full-profile access is a separate, prompted, high-sensitivity capability; default app-visible locale = coarsened primary language tag only. A per-app **locale entropy budget** mirrors the network privacy model.
- **Two-track rendering:** display track = engine `Intl` (fast, offline); canonical track = pinned **ICU4X-WASM + hash-pinned CLDR pack** for anything reproducible — receipts, citations, audit entries — always storing the raw machine value under the localized surface, tagged `(cldrVersion, tzVersion, formatterCID)`. Rendering locale is a lens too, and is labeled.
- **Signed content-addressed language packs and tiered font packs** ride generations (core pack ~few MB; CJK/full-emoji on demand; `unicode-range` subsets; honest tofu on missing glyphs; no HTTP font loads, ever).
- **A11y floor:** WCAG 2.2 AA; `ElementInternals` semantics in every component; ARIA relationships kept within one shadow root (cross-root ARIA is not Baseline); mandatory manual screen-reader testing; all `prefers-*` queries wired into tokens day one. Surface mode (F1) is the a11y strategy: the Shell owns real DOM, so app UI is accessible by construction rather than by app diligence.
- **`<efs-identifier>`** renders addresses/hashes/paths LTR-isolated, chunked, UTS-39 confusable-checked, bidi-control-stripped — one primitive kills the mixed-direction spoofing class.

### F11. Client self-trust — **[research-grounded]**, residual risk stated

Ladder: plain web origin (trust the gateway every load) → **default: PWA + self-pinning SW + reproducible builds + provenance on EFS + generation verification at boot** → IWA signed bundle (Chromium/enterprise; kept format-convertible) → native wrapper (last resort). The residual truth is stated loudly: the *first* load of the Bootstrapper is a TOFU event on whatever origin/gateway served it — exactly TUF's untrusted-root-bootstrap step. After first pin, every subsequent boot verifies the closure. G2 from the secure-ui lane is accepted as residual: the web has no secure attention key; we document it and design the negative-indicator + passkey stack around it.

### F12. Deep links — **[reasoned]**, awaiting the boot-deeplinks lane retry

web3:// grammar stays owned by [[read-lens-spec]] §6.5. The OS adds link classes as query/fragment extensions, never new derivation surface: app links, generation/closure links (open exact system vs follow channel), permission-prompt links, sync-state links. Capabilities ride the fragment (never sent to servers); unfurl bots fetch pasted links, so nothing sensitive may ride the query string. Boot path: cache-first app-shell served by a thin-router SW (Static Routing API + auto-preload where available; navigation preload is a data-wasting footgun for cache-first shells — amended per [[boot-and-profiles]]), minimal viewer closure for citation links — the deep-link cold start is a first-class performance budget, not a page load. Cache-rendered content before venue contact presents as AS-OF/UNKNOWN-CURRENCY with a presentation state, never as a new grade word.

### F13. Venues: invisible until they change an answer — **[reasoned]**

Grades and "as of" labels surface only when not HOME-LIVE; a Venue/Sync center owns the detail; one-head-per-venue freshness polling (F5) makes the honest default cheap and private. GATE consumers inside the OS (installers, agents, auto-update) obey [[read-lens-spec]] §3.3 consumption rules mechanically.

## The honesty doctrine (cross-cutting)

The truth-traps list in [[fable-client-v2-handoff]] is adopted wholesale as acceptance criteria. Three additions from the research:

1. **"Not permitted to look" ≠ "not found."** The cage denies network by default, so `UNKNOWN because no transport capability` is a distinct, common state — never rendered as absence (pressure item for a NO-TRANSPORT qualifier in the read-grade vocabulary).
2. **Storage loss is an event, not a mystery.** Boot-time wipe detection (generation sentinels + `estimate()`/`persisted()` deltas) emits a Shell-visible "browser deleted local data" event; freshness degrades to venue-qualified UNKNOWN until re-verified; Tier B/C losses (journal, signed bundles) are reported against the last export/escrow record. Safari-in-tab is honestly labeled a 7-day lease; install-to-Home-Screen is the real exemption.
3. **Positive trust chrome habituates; negative indicators inform.** Warn loudly on the bad states; never train a green checkmark.
4. **Privacy-possible, not private-by-default, never anonymous** (validated 2026-07-07). The OS is genuinely cypherpunk — and arguably ahead of the ecosystem — on the **read/custody** side: verified reads over untrusted endpoints, OHTTP identity-unlinking, no ambient network, interest-privacy honestly labeled *unsolved* rather than faked. On the **write/graph** side it can do nothing, because permanence, verify-don't-trust, censorship-resistance, and lens resolution *all require public claims with publicly-recovered-signer authors* — so who-authored-what, author↔author edges, and timing are public by construction. Payload encryption is opt-in and real; graph anonymity is not offered. The persona system makes this concrete: separate personas *un*-correlate you, but publishing the link *re*-correlates them, so the OS ships a **private-link variant** (encrypted body at a salted fragment-capability anchor) and states the irreducible residual (public author word + timestamp) plainly. The client must never let a privacy affordance imply anonymity it can't deliver — see [[wallet-and-actions]] §Persona privacy and pressure item P9.

## Amendments (2026-07-07, post model-doc fan-out — normative; they win over the F-sections above)

The thirteen model docs were written against this thesis in parallel and surfaced conflicts through a structured channel rather than diverging silently. These are the accepted corrections:

1. **F1 — the CSP asymmetry (from [[kernel-capability-model]]):** "the worker inherits the page's CSP" glossed how the Kernel itself escapes the cage. Ruling: the *page* runs `connect-src 'none'`-class CSP; the **Kernel is a real-URL same-origin worker carrying its own CSP** (real-URL workers get their own policy; `blob:` workers inherit); Ring-3 apps are `blob:` workers that inherit the page's denial. Cradle-iframe fallback lane pending a cross-browser test matrix.
2. **F1/F3 — who composites (from [[shell-and-sessions]]):** the compositing *mechanism* moves into System Chrome (Ring 1½); the Session Shell holds only placement/focus *policy* over a typed API and never owns raw DOM. This is the enforcement precondition for any future third-party Shell.
3. **F3 — Shell plurality is contingent, not merely deferred (from [[threat-model]]):** under the one-origin ruling (F2) a Session Shell package still executes in the trusted origin, so a third-party Shell is a fatal principal *on the current architecture*. The Chrome/Shell boundary in v2 is port discipline plus contract, **not a hard security boundary**; true Shell plurality requires a protection-domain split (cross-origin or equivalent) that v2 does not budget. Stated as an unbounded residual, not a roadmap item.
4. **The ceremony count is eight:** the seven consequential checkpoints (sign/flush, publish, spend, install, admin grants — including identity/custody ceremonies: persona create/link/unlink, primary custody changes, `home`/checkpoint claims —, export, local-data deletion) plus **break-glass** (lethal-trifecta assembly, high-risk device capabilities, Shell activation) as its own ceremony class.
5. **F9 — the amortization reading (from [[agent-native]]):** "never satisfiable by an agent alone" means every ceremony consumes a *human-satisfied* checkpoint — and an approved **open persona mandate** may amortize one such checkpoint over N bounded actions within its caps. The human approves the mandate on the trusted surface; the agent spends it.
6. **F7 — bundle expiry defangs reads, not admission (from [[wallet-and-actions]] / [[persistence-and-sync]]):** admission is clock-free by the master invariant, so a leaked signed bundle stays *admissible* forever; `expiresAt` decays its currency at read time only, and appendOnly entries cannot carry expiry at all (codex-kinds amendment 1). Default-expiry stays, re-scoped as currency decay; the real kill switch is the **pre-signed revoke-all abort artifact** minted alongside interactive bundles. UI copy must never claim expiry prevents publication.
7. **F4 — cooldown anchoring and the beacon split (from [[packages-and-updates]]):** envelope TIDs are past-datable without bound, so cooldowns anchor to **admission-event block time**, never `tidTime` — which exposes a read-surface gap (admission time is not in the frozen read ABI; pressure report). And "channel = LIST head + freshness beacons" conflates records the Codex forbids fusing: appendOnly ledger entries carry `expiresAt = 0`, so the freshness beacon is a **separate expiring head PIN**, not a property of the ledger entries.
8. **F5 — brokered policy, not per-endpoint CSP (from [[network-privacy]]):** a document's CSP is immutable after load, so "granted endpoint = narrower CSP" is not directly implementable; the Kernel broker's policy engine is the primary enforcement, with rebuildable egress-document mechanics as hardening.
9. **F5/honesty — data-verified is negative-space:** no green "verified" badge (it would train the habit SiteKey disproved); the data-verified indicator is loud only on `UNVERIFIED-LANE` / `VERIFY-FAILED`; endpoint-privacy-class remains a neutral factual chip.
10. **F10 — LocaleHandle disclosure honesty (from [[locale-and-accessibility]]):** string-returning formatting *necessarily* leaks locale bits through its outputs; true zero-disclosure exists only for Shell-side formatting of typed semantic values. Tier-1 formatting calls are therefore metered against the per-app locale entropy budget rather than advertised as disclosure-free.
11. **F3 — sync surface split (from [[system-surfaces]]):** System Chrome owns sync *authority and loss events* (what happened to your data); the Session Shell owns the sync *dashboard* (browsing detail) — protecting Chrome's dependency diet.
12. **F12 — closed (boot-deeplinks retry landed):** the amendments in [[boot-and-profiles]] govern (Static Routing over navigation preload; AS-OF/UNKNOWN-CURRENCY presentation for cache-first renders; fragment grammar and size tiers; the `web3://` safelist gap).
13. **F4 — transparency needs a funded monitor (from [[packages-and-updates]] via the package-trust lane):** chain admission is a free transparency log, but CT/Firefox-BT history says unmonitored transparency protects no one. The **channel-monitor role** (equivocation, mass-publish, revocation-flood watching) is hereby named as an uncommissioned workstream — see open questions.

## Third-party app model research directive (2026-07-22 — not a ruling)

James withheld the exact platform shape and requested a deep Fable research round, while identifying open web standards and WebAssembly/WASI as a strong likely foundation that EFS can follow while both evolve. The probable shape has multiple deliberately different lanes: a confined Wasm/WASI-style app that asks an OS-owned renderer to update UI; a full-web sandboxed iframe that owns everything inside its frame and sends typed messages/opcodes to EFS; and possibly one or two specialist lanes if evidence earns their cost. WIT, the Component Model, Blazor/.NET, HTMX-inspired UI, JavaScript/SES, iframe profiles, and other mechanisms remain possibilities to investigate and validate. The current Worker/capability/Surface-IR architecture must be challenged in the same comparison; it is not protected from revision merely because it appears in F1/F8.

Every lane uses one permission system. Packages may declare requested security tags/profiles, imports, capabilities, budgets, and options, but the Kernel and user policy determine effective authority. For Wasm this selects instantiated host/WASI interfaces; for iframes it selects sandbox/origin/CSP/Permissions-Policy features and message capabilities. The research must separate authoring model, execution runtime, semantic app API, IDL/wire format, rendering ownership, security boundary, and packaging/versioning. It should compare coherent end-to-end architectures with the same prototype workload and explicit threat, accessibility, performance, portability, and developer-experience evidence. See [[fable-third-party-app-model-handoff]].

## What v2 deliberately does not do

- No third-party Session Shells at launch (contract designed for them; shipping deferred).
- No true Kernel modules/plugins; extension = system services with narrow capabilities, or additional app runners only after the app-model research establishes their boundary.
- No generic `wallet.sendTransaction` in Ring 3; EFS-shaped writes only, wallet interactions Kernel-mediated.
- No CRDT merge machinery in the Kernel (slots are per-author LWW by protocol; CRDT libs are app-layer SDK helpers).
- No ambient HTTP anywhere, including fonts, avatars, telemetry, crash reports, update checks. There is no telemetry.
- No positive-trust badges; no silent fallthrough; no un-graded render of anything fetched.

## Naming — **[open]**

Working frame: the protocol is **EFS**; the product is the **EFS OS** (or a to-be-chosen name); the replaceable presentation layer is the **Shell**; developer surfaces are **`@efs/sdk`** (protocol) and **`@efs/os-sdk`** (app runtime). "EOS" is rejected (collision-rich, overclaiming). Candidate product names to explore with taste later: *Etherea*, *Archive OS*, *Meridian*, *Everfile*, *the Commons*. Naming is not a blocker for any design in this set; it is a launch decision.

## Open questions

- [ ] Surface-mode UI schema: bespoke minimal tree vs subset-of-HTML vs adopting an existing declarative UI IDL — needs a prototype ADR (client repo) before the OS SDK freezes its render vocabulary.
- [ ] Persona doctrine details: default persona-per-app vs persona-per-workspace; linking convention; how lenses present "one user, many authors" without confusing readers. (Shares the pressure-report item.)
- [ ] k-of-n curator quorum defaults for auto-update channels; who the launch curators are.
- [ ] The boot-deeplinks lane (retry in flight) may adjust F12 budgets and the fragment-capability grammar.
- [ ] Simulation for economic side effects (F6/T10): user-configured simulation endpoint vs local light-client vs preview-from-records-only with an honest label.
- [ ] The channel monitor (Amendment 13): client-side checks (equivocation, backward-head, deny-flood on subscribed channels) ship as courier duties at launch; the **global observatory** (cross-user monitoring, mass-publish detection, ecosystem alerting) is an uncommissioned, unfunded workstream — commission or explicitly accept the CT-gossip fate.
- [ ] Naming.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Model docs in this folder reconciled against these rulings (no contradictions)
- [ ] EFS v2 pressure report filed under `Designs/efsv2/` and cross-linked
- [ ] At least one round of `#status/review` with another agent or human comment
