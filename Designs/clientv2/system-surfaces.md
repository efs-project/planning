# First-party apps and the system surface map
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[fable-client-v2-handoff]], [[read-lens-spec]], [[apps-cookbook]], [[persistence-and-sync]], [[agent-native]], [[locale-and-accessibility]], [[mirror-scheme-policy]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> Elaborates thesis F1/F3/F13 into THE surface map: every system surface named, assigned a trust class, given a capability set and a never-list, and made to own its slice of the honesty doctrine. Evidence: Reviews/2026-07-07-clientv2-corpus/research/secure-ui.md (prompt surface = attack surface; habituation), webos-precedents.md (retention-app mortality), capability-os.md (powerbox/picker discipline), local-first.md (sync-honesty patterns). The handoff's candidate-surface list is absorbed in full; where an item is dropped or re-classed, that is said explicitly.

## What this rules

Which surfaces exist in official client v2, what ring/trust class each runs in and *why*, what capabilities each holds, what each must never do, which ship at launch, and which surface owns which read-grade / truth-trap rendering obligation. A surface not in this map does not ship. The classing rule is one sentence: **a surface's trust class is set by who it can hurt when it lies, not by who wrote it** — "first-party" is a provenance fact, never a security boundary (handoff trap, adopted). [research-grounded]

## Trust classes and their duties

| Class | Ring | Pixels | Blast radius if compromised | Conservation posture | A11y baseline |
|---|---|---|---|---|---|
| **System Chrome** | 1½ | draws its own, compositor-top; apps cannot occlude it | total (it mints grants and runs ceremonies) | maximal: minimal deps, no third-party code, LavaMoat-policied, changes reviewed like Kernel changes | strictest: WCAG 2.2 AA + screen-reader-first prompts, focus-trapped ceremonies, activation delays tuned so interaction gating never defeats switch access, full `<efs-identifier>` readout (chunked, spelled) |
| **Session Shell** | 2 | holds placement/focus policy over the typed compositor API; the compositor (System Chrome, Ring 1½) owns the DOM and composites app surfaces | session presentation + local reads it renders | replaceable in principle (F3); contract-bound to OS SDK | WCAG 2.2 AA; landmarks/headings; all `prefers-*` wired; keyboard-complete window management |
| **System service** | 1-adjacent worker | none | scoped to its service capabilities | manifested + budgeted like apps; auditable; killable | n/a (no UI); its *state* must be renderable by Shell surfaces accessibly |
| **Ordinary Ring-3 app** | 3 | none (surface/canvas modes via render capabilities) | its grants, nothing more | zero-power install; everything named and revocable | surface mode accessible by construction; canvas mode requires semantic sidecar or it does not ship |
| **Render service** | sandboxed-iframe lane | inside a Shell-labeled frame | the frame's contents only | per [[mirror-scheme-policy]]; never same-origin, never capability-bearing | document a11y comes from the document; frame itself carries role, label, and "untrusted document" state |

## The surface map

| # | Surface | Class | v2 launch? | Why this class |
|---|---|---|---|---|
| 1 | Deep-link cold-start resolver | Kernel pipeline + System Chrome resolution card | **launch** (a perf budget, F12) | grades must exist before pixels; the first thing a stranger ever sees |
| 2 | Secure prompt surface | System Chrome | **launch** | the prompt surface *is* the attack surface (40 Snaps audits) |
| 3 | Permission center | System Chrome | **launch** | it renders and edits the capability table |
| 4 | Network privacy center | System Chrome | **launch** | endpoint grants are permissions; wildcard is a ceremony |
| 5 | Inference settings | System Chrome panel inside #4 | launch-lite | inference providers are endpoint capabilities with retention risk |
| 6 | App install/update ledger | System Chrome | **launch** | install review = the capability wiring diff (F4) |
| 7 | Lens/Trust manager | System Chrome | **launch** | edits resolution truth for every read; apps must not supervise trust |
| 8 | Shell/profile manager | System Chrome | launch-lite (generations, pin, rollback) | supervises the Session Shell; cannot be owned by it |
| 9 | Sync honesty events | System Chrome slice | **launch** | grenade custody, partial-admission alerts, storage-loss events |
| 10 | Approval queue (+ kill switch) | System Chrome | **launch** (with the agent principal) | T3/T5 checkpoints are never agent-satisfiable (F9) |
| 11 | First-run truth orientation | System Chrome flow | **launch** | the TOFU pin is a trust ceremony, not marketing |
| 12 | Sync center (dashboard) | Session Shell | **launch** | detail view over Kernel state; holds no authority |
| 13 | Share/Citation center | Session Shell | **launch** | composes links; the path-vs-citation education surface |
| 14 | Settings/Admin center | Session Shell | **launch** (basic) | preferences; admin-class acts route to chrome |
| 15 | Language & locale settings | Session Shell | **launch** (basic) | profile editing; Tier-2 grants via chrome ([[locale-and-accessibility]]) |
| 16 | Agent Center dashboards + Task queue | Session Shell | post-launch v2.x | reads receipts/budgets; approve/kill live in #10 |
| 17 | Developer/debug mode | Session Shell mode | launch-lite (trace + outbox; simulator later) | read-only introspection; dogfooding demands it early |
| 18 | Render service | render service | **launch** | untrusted document lane; mirror bytes never touch trusted origin |
| 19 | Background services: flush, courier, indexer, thumbnailer | system services | **launch** (thumbnailer may slip) | budgets and manifests, no UI, no prompts |
| 20 | Files | ordinary Ring-3 app | **launch** | the handoff's test case: prove the platform on our own flagship |
| 21 | Rescue Shell | System Chrome trust class (Ring 1½), conserved | **launch** | health-gate fallback + steward-mortality hedge (F3) |

Notes: the handoff's "telemetry import" background service is **dropped** — the thesis rules there is no telemetry, and no import service resurrects one. "Agent Memory Vault" is deferred past v2.x: it depends on the unsolved private-state-on-EFS gap (see efsv2 pressure below). The handoff's "system apps" middle class is **rejected**: a surface is chrome, shell, service, app, or renderer — a blessed-but-vague middle tier is exactly how ambient authority creeps back. [reasoned]

### 1. Deep-link cold-start resolver — the front door

Split implementation: the **Kernel resolution pipeline** (no UI) computes link class (F12), lens resolution, grade, currency, deny hits, and byte availability; the **resolution card** (System Chrome) renders that context *before* any destination surface paints. Human clicks resolve in INTERACTIVE context; agent/machine fetches through the same door run GATE and obey [[read-lens-spec]] §3.3 mechanically.

Card contents, in priority order: link class (**Path Link** vs **Citation Link**, visually distinct — commit vs branch); target identity via `<efs-identifier>` + petname if the viewer's lens knows the author; venue + currency ("as of checkpoint N" when not HOME-LIVE); deny hits; grade chip when not LIVE; fragment-carried capabilities *shown as a grant preview* (designation is authorization, but the user sees what the link designates). Fast path: a LIVE, un-denied, previously-visited target collapses the card to a 300ms transit chip — the card blocks only when something needs saying (negative indicators, F3). [reasoned]

Never: render destination bytes before the grade exists; treat UNKNOWN as absence and fall through (RR anti-fallthrough); auto-exercise fragment capabilities without preview; send anything sensitive in query strings (unfurl bots fetch pasted links).

### 2–11. The System Chrome family

Common law: one origin with the Kernel, zero third-party UI deps beyond the system component set, all strings from the **shared string catalog** (surfaces render, never rephrase), all events receipted into the local audit log, and the strictest a11y row above. System Chrome surfaces hold Kernel-internal interfaces that have *no Ring-3 path at all*: `policy.mutate`, `grant.mint`, `ceremony.run`, `generation.switch`, `bundle.export`. That absence-of-path is the security argument — there is nothing to confuse a deputy into. [research-grounded]

- **Secure prompt surface (2).** Owns every ceremony: signing checkpoints, grants, installs, exports, admin changes. Renders Kernel-derived app identity (never app-supplied strings), full addresses, per-record risk classes in batch previews (one dangerous record cannot hide among 312 harmless ones — F6), interaction gating (activation delay, no default-focus accept, ignore too-fast clicks), the user-configured **negative** indicator, and the T10 escalation: above the risk threshold, Shell-only confirmation is disallowed — route to wallet clear-signing (ERC-7730) or the passkey ceremony. Never: render app-supplied rich content inside a prompt (typed fields only — this is also the agent-injection firewall); show a green "safe" badge; auto-dismiss on timeout.
- **Permission center (3).** The capability table, live: per-app grants with printable scope descriptors, invocation audit trails, pause/sever/attenuate controls, storage quotas, background budgets, recent privileged operations. Restore of a persisted grant re-evaluates current policy (F8) and the UI says when policy changed underneath a grant. Education duty: **revocation does not erase prior signed writes** — the revoke receipt links to what remains public. Never: a bulk "allow all"; scope-free grant rows.
- **Network privacy center (4).** Every endpoint capability by privacy class (`self-hosted / relayed / trusted-paid / public-observed`), per-app endpoint grants, endpoint health, freshness-beacon status per channel, self-hosting onboarding (including Chrome 142 LNA prompt choreography), and a local-only recent-egress log. The two indicators — *data-verified* and *endpoint-privacy-class* — are never conflated (F5): the copy for public-observed reads "verified content; this operator can see what you request." Wildcard origin grants are a full ceremony with a red class. Never: represent verified as private; ship any default endpoint without first-run disclosure.
- **Inference settings (5).** Providers are endpoint capabilities plus retention/data-sharing disclosure, per-app/per-agent access, and day-one budget meters. Gate: **no model call can occur before this surface exists and the user has configured a provider** — there is no default inference endpoint. Never: hide provider data-sharing behind generic "AI" UX (handoff trap).
- **App install/update ledger (6).** Zero-power install framing up front ("running this grants nothing"); then the ledger: app identity (author word + app-root record, never key hash), package CIDs, capability/endpoint/signer diffs per update, cooldown age measured from chain admission, k-of-n curator quorum status, deny facts with rollback warnings ("rolling back into a version with a security advisory"). Auto-update refuses on STALE channel (expired freshness beacon) with an honest label. Never: auto-apply a capability-broadening update (Chrome disable-until-approved rule, F4); render curation as endorsement.
- **Lens/Trust manager (7).** User-facing **Trust Order** (petnames, drag-to-reorder), technical **lens chain** view one layer down. Pin-and-diff on every curator update; deny-source subscriptions with advisory-grade labels (STALE advisories labeled, EQUIVOCAL advisory authors surfaced, never obeyed — [[read-lens-spec]] §3.4); the persona-linking view ("your authors" — F6). Copy discipline: a subscribed lens is a **delegation order that can shadow paths**, and the UI never says "Carol's view." Local trust-order edits are kernel policy (immediate, receipted); *publishing* a lens is an ordinary write through the outbox and ceremony. Never: auto-follow a lens update outside the pinned diff policy; present a lens as its author's opinion of content it merely orders.
- **Shell/profile manager (8).** Generations as first-class objects: active/previous/pinned closures, health-gate status, closure diff between any two, channel follow-spec vs exact pin (flake-lock split), rollback (always allowed among locally verified generations) vs downgrade-following (never automatic). The switch path is Kernel-owned so a broken Session Shell cannot gate its own replacement. Third-party Shell *browsing* is post-launch; the contract ships at launch. Never: let generation switching depend on the active Shell's code.
- **Sync honesty events (9).** The chrome *slice* of sync: the signed-bundle export ceremony ("anyone holding this can publish it, now or years from now — expiry only ages what readers make of it; the pre-signed abort artifact is the kill switch"), partial-admission alerts, time-at-risk warnings for signed-unsubmitted bundles, and the boot-time storage-loss event ("your browser deleted local data; here is what that means") per [[persistence-and-sync]]. This is deliberately narrower than thesis F3's "sync honesty" phrase — the dashboard lives in the Session Shell (#12) to keep chrome's dependency diet minimal; only the moments that transfer authority or report loss are chrome. [reasoned — confirmed by thesis Amendment 11]
- **Approval queue + kill switch (10).** Agent checkpoints: plan-vs-frozen-plan diff, `sub`+`act` attribution on every row, batch legibility with per-record risk classes, budget context ("this approval spends 40% of the session's remaining mandate"). The kill switch severs a session's capability bundle Kernel-side. Never: approve-by-default or timeout-approve; render model-authored prose as the approval body — typed fields only (injection firewall, shared with #2).
- **First-run truth orientation (11).** See its own section below.

### 12–17. Session Shell surfaces

Session Shell surfaces hold **read-mostly Kernel capabilities** and route every authority-bearing act to chrome. They are ordinary code in Ring 2 — replaceable with the Shell in principle, which is *why* nothing here may be load-bearing for safety.

- **Sync center dashboard (12).** Caps: `journal.read(summary)`, `outbox.read`, `flush.control`, `venue.status`. Renders the full pending-state ladder per item (draft→…→replicated), outbox contents, flush/retry/park controls, sponsor/relayer status including `declined` ("sponsor refused; self-pay remains"), mirror upload progress with offset probes, and the **venue detail tab** (F13: venues invisible until they change an answer — this is where the answer-changers live: per-venue heads, checkpoint ages, completeness horizons). Storage health per protection tier (A–D) from [[persistence-and-sync]]. Mobile: collapses to a status pill + bottom sheet. Never: the word "synced" while any record of an envelope is unadmitted — the string catalog has no such string for partial states; export/sign buttons that don't route to chrome.
- **Share/Citation center (13).** Caps: `link.mint`, `record.cite`. Two artifacts, visually distinct: **Path Link** (path form per [[read-lens-spec]] §1.2 — "what's there now, through the reader's own trust") and **Citation Link** (claim form + as-of — "exactly what I saw, reproducible"). The composer teaches the difference in one line each, previews *what a recipient can learn* (including that citation links reveal the cited claim to any holder — they are not private), and enforces: capabilities and anything sensitive ride the fragment, never the query. Optional lens-context disclosure is an explicit toggle (efsv2 gap below). Mobile: OS share sheet + QR. Never: imply a citation link rots, or that a path link is a snapshot.
- **Settings/Admin center (14).** Three honestly-separated stores, labeled in the UI: **local preferences** (this device, dies with eviction — says so), **kernel policy** (roams via encrypted journal), **signed user policy** (public EFS records — carries the permanence warning). Every durable change emits a **settings receipt**; admin-capability grants (settings powers for third-party tools, post-launch) are chrome ceremonies with expiry defaults. Never: silently promote a local preference to a signed record.
- **Language & locale settings (15).** Fallback order, region/script/calendar/numbering/hour-cycle, collation, input methods, signed content-addressed language/font packs with per-generation pinning, per-app overrides, and the **fingerprint-budget meter** — which apps hold `locale.basic` and how much entropy they have spent ([[locale-and-accessibility]] Tier 1). Tier-2 full-profile grants render as high-sensitivity chrome prompts. Never: change canonical-track rendering when display locale changes (receipts keep raw values + formatter CIDs).
- **Agent Center dashboards + Task queue (16).** Caps: `agent.sessions.read`, `receipts.read`, `tasks.control(pause|resume|cancel)`. Sessions with goals, scopes, budget burn-down, artifacts, blocked approvals (deep-linking into #10), the audit trail. Post-launch v2.x; the *Kernel* agent principal, budgets, and approval queue ship at launch — only these dashboards wait. Never: render an agent's self-reported status as ground truth (receipts and Kernel state only).
- **Developer/debug mode (17).** A Session Shell mode (console-adjacent), desktop-first. Caps: `introspect.read` (read-only Kernel state), `simulate.fork` (capability-diff simulator runs against a *forked in-memory* table, never live). Four tools: **resolution trace** (per-lens-position grades, exactly the [[read-lens-spec]] state machine, replayable), **capability diff simulator** (what would this manifest/update change — post-launch), **outbox inspection** (raw envelopes, records, claimIds, admission state), **read-grade probes** (arbitrary path/claim under chosen lens + venue + ctx, GATE and INTERACTIVE side by side). Plus the local prompt-budget counter (below). Never: mutate anything; display private key material under any flag.

### 18–19. Render service and the background tier

- **Render service (18).** The sandboxed-iframe document lane per [[mirror-scheme-policy]]: HTML/SVG/PDF mirror bytes, always inside a Shell-drawn labeled frame ("untrusted document — rendered in isolation"), never same-origin with the OS, never capability-bearing; postMessage limited to viewport/print/find events. Frame chrome carries the source claim's grade chip. Never: promote document content to surface mode; relay a capability inward.
- **Background services (19).** Four at launch-shape: **flush engine** (the outbox's dumb resumable submitter — F7), **courier** (single jittered head/checkpoint fetch per venue per interval; the only component that talks to venues on a timer — F5 traffic discipline; its duties also include the client-side channel-monitor checks at launch: equivocation detection, backward-head detection, and deny-fact-flood alerting on the channels this user subscribes to, with alerts landing as Shell events — the **global first-party observatory** (cross-user monitoring, mass-publish detection, ecosystem alerting) is a deferred, uncommissioned workstream, not a launch service), **indexer** (search/discovery materializer over local records; its results always carry "found by discovery, not endorsed"), **thumbnailer** (derived previews in a decode-sandboxed worker; outputs tagged `derived`, never mistaken for source bytes). Each has a manifest, a budget (CPU wake, egress via granted endpoints only, storage stratum), appears in the Permission center, and is individually killable. They hold service-class capabilities apps cannot (`venue.poll`, `bytes.decode`), and hold **no** signing, lens-edit, or grant-minting paths. Never: UI, prompts, or unlabeled contributions to any view.

### 20. Files — the constitution of the app platform

Files is an **ordinary Ring-3 app**: SES-in-Worker, no DOM, no network, surface mode UI, writes through the journal/outbox like everyone else. It is the handoff's test case and this map treats it as the platform's forcing function: *every power Files needs must become a named, grantable, revocable capability that a third-party file manager could also request.* If Files needs a backdoor, the platform has failed. [research-grounded]

Its named capabilities beyond ordinary picker grants:

| Capability | Scope | Grant moment |
|---|---|---|
| `home.enumerate` | read/enumerate the user's own address container, including linked personas | first-run, one chrome prompt, revocable |
| `versions.read` | historical slot enumeration (SUPERSEDED claims) for items already visible to it | bundled with `home.enumerate`, separately severable |
| `overlay.read` | pending-state overlay (ladder states) for its visible scope — not the raw journal | same |
| `thumbnail.request` | ask the thumbnailer for derived previews of visible items | promptless (service-mediated, budgeted) |
| `handler.default` | receive path deep-links with no app hint | install review checkbox |
| `trash.local` | evict local cache copies — promptless Tier-A cache eviction, re-fetchable by construction; NOT the "destroy local data" ceremony (checkpoint 7, which owns the "only real delete" label) | promptless; every use receipted |

Files' UI duties: current-view vs **version history** (SUPERSEDED claims as first-class, "superseded at this venue as of its admitted set"); **unlist / withdraw placement** vocabulary with the permanence line ("the bytes and this name remain fetchable by anyone who has them"); local overlay items visibly pending (ladder chip per item); BYTES-UNAVAILABLE as "authentic pointer, bytes absent here" — which is also the honest answer to "offline available": catalog cached, bytes missing, say so; the U2 multi-claimant marker on shared-namespace keys; mirror content opened via the render service, never inline. Never: exercise a write without journal+outbox; touch another app's grants or storage; edit lenses (it may *propose*, which routes to #7); render its own confirmation dialogs for destructive acts (chrome owns those).

Other first-party apps (Notes, media viewer, archive importer) are the same class with smaller capability sets; none gets anything unnamed.

### 21. Rescue Shell

Minimal, conserved, first-party shell in the System Chrome trust class (Ring 1½), pinned as part of every generation pair, booted by the Kernel when a generation fails its health gate or by user chord at boot. Its capability set is the closed list in [[shell-and-sessions]] §The Rescue Shell (normative); illustratively — generation rollback among locally verified generations, capability-table pause/revoke, journal/bundle export ceremonies — and nothing beyond that list (this summary is non-normative). No app runtime, no render service, no discovery. Its dependency diet is the smallest in the system; changes to it get the same review class as the Kernel. Never: auto-update with any channel; load Ring-3 code; hold endpoints beyond the user's pinned venue set.

## Read-grade and truth-trap ownership

Each surface *owns* rendering obligations; the string catalog enforces one voice. This table is acceptance criteria — a surface ships when its row passes review. [research-grounded on the obligations; ownership assignments reasoned]

| Surface | Owns rendering of | Must never |
|---|---|---|
| Deep-link resolver | grade + currency before first paint; UNKNOWN ≠ absence; "not permitted to look" (no-transport) as its own state; Path vs Citation framing | fall through on UNKNOWN; strip the as-of |
| Files | SUPERSEDED / version display; unlist-not-delete; pending-overlay labels; BYTES-UNAVAILABLE; U2 markers | say "deleted"; show pending as canonical |
| Lens/Trust manager | delegation-order language; pin-and-diff; advisory grades (STALE labeled, EQUIVOCAL surfaced) | say "Carol's view"; silently follow |
| Share/Citation center | path-vs-citation education; citation = as-of snapshot; recipient-knowledge preview | imply citation privacy or live-link stability |
| Sync center (+9) | partial admission ("7 of 12 records admitted"); declined ≠ failed; ladder states; storage-loss and time-at-risk reporting | "synced" on partial; hide sponsor refusal |
| Permission center | revocation ≠ erasure; grant restore re-evaluation; invocation audit | imply prior writes disappeared |
| Network privacy center | verified ≠ unobserved (two indicators); privacy classes; wildcard gravity | conflate integrity with privacy |
| Install ledger | zero-power framing; capability diffs; cooldown age; STALE channel refusal; deny facts | green "safe" badges; curation as endorsement |
| Locale settings | canonical-under-localized for receipts; fingerprint budget | let display locale mutate signed artifacts |
| Secure prompts / Approval queue | full addresses; per-record risk classes; negative indicator; sub+act attribution | truncate addresses; free-text prompt bodies |
| Render service | "untrusted document" frame + source grade chip | mirror bytes in trusted origin |
| Background tier (via #3/#12) | budget receipts; "found by discovery, not endorsed"; `derived` tags | unlabeled contributions to views |
| Dev mode | raw grades and traces, truthfully ugly | mutate state; prettify EQUIVOCAL |
| Rescue Shell | what is lost and what survives, plainly | promise recovery it cannot verify |

## The prompt budget: ceremonies, banners, chips

Three escalation tiers, System Chrome-owned:

- **Ceremony** (blocking, full secure chrome, interaction-gated): reserved for **authority transfer or irreversible commitment** — sign/publish/spend, install grants, endpoint grants (any class above self-hosted first-use), persona linking, admin changes, bundle/key export, Tier-2 locale profile, wildcard anything. T10 adds the external surface above the risk threshold.
- **Banner** (persistent until acknowledged, non-blocking): degraded trust states that change what the user should believe — EQUIVOCAL/CONTESTED encountered, deny hit on something open, storage-loss event, STALE update channel, budget exhaustion.
- **Chip** (quiet, ambient, coalesced): state changes — ladder transitions, venue currency ("as of…"), STALE/UNKNOWN grade chips, background budget consumption, freshness beacon aging.

Budget rule: **a prompt is spent only when authority changes hands.** Target: median session ≤1 ceremony; a flow that provokes >3 is a design bug. Measured locally only (dev-mode counter — there is no telemetry). Habituation discipline: ceremonies never share a visual template with banners or chips, and no tier ever renders a positive trust badge. [research-grounded — SiteKey/habituation evidence]

## Mode variants that matter

| Surface | Desktop | Mobile |
|---|---|---|
| Pickers | windowed powerbox | full-screen sheet; grant summary above the fold |
| Ceremonies (#2) | centered chrome + wallet extension | bottom sheet + wallet-app round-trip; state survives the app switch (journal-backed) |
| Sync center | dock widget + full window | status pill → bottom sheet |
| Lens manager | dock-level entry | settings-level entry (trust edits are rarer on mobile; the ceremony is identical) |
| Share/Citation | composer window | OS share sheet + QR; citation composer one tap deeper |
| Dev mode | full mode | disabled at launch (read-only trace viewer later) |
| Kiosk/console modes | subset maps: kiosk = #1, #18, #20-readonly; console = #12, #17 + command surface | n/a |

## First-run: the truth-orientation flow

Owned by System Chrome; the handoff's open question is ruled: **truth orientation, not a marketing wizard.** Five beats, progressive — beats 3–5 fire contextually at the first relevant action, because a wall of orientation nobody reads is itself a truth trap: [reasoned]

1. **The pin** (at first boot): "You are trusting this origin once. Here is the fingerprint you just pinned; every future boot verifies against it." One screen, one action.
2. **Address home** (at identity setup): your address is the root; vanity names are petnames over it.
3. **Permanence** (at first write reaching `ready_to_sign`): unlist ≠ delete, said before the first signature, not after.
4. **The ladder** (at first pending item): saved-here vs published are different facts; the Sync center chip tour.
5. **Storage honesty** (at first Tier-B content): the browser can evict; export exists; install-to-home-screen is the real exemption.

Files hosts the guided first save→sign→share loop; the string catalog owns every sentence.

## The retention question — [open]

Every dead web OS lacked a daily-use reason to return (webos-precedents.md). The candidate retention loop this map bets on: **the permanent archive — save → organize → cite → share links that never rot.** The demand it places on priority order: resolver cold-start performance (#1), Files polish (#20), the Share/Citation center (#13), and sync honesty (#9/#12) outrank Agent Center dashboards, Shell plurality, and every developer surface. Its growth edge is the **zero-install citation view**: a citation link opens in the minimal viewer closure with the resolution card, no account, no install — the link *is* the demo. Counter-candidate: the agent workspace (budgeted agents over your own archive) as the retention hook instead. Unvalidated either way; this stays [open] and gates the v2.x ordering, not the launch set.

### Agent lens

- Every Session Shell dashboard is a rendering of typed Kernel state — agents read the *same state* through capabilities, never by scraping surfaces. If a surface shows something agents can't query, that's a bug in the OS SDK, not a feature of the UI.
- System Chrome surfaces are **terminal for agents**: an agent can enqueue into the outbox and the approval queue, and can *read* its own budgets/receipts, but no agent capability reaches `grant.mint`, `ceremony.run`, or `generation.switch`. The kill switch and approvals are human-only by construction.
- Agent-initiated resolution defaults to **GATE** context (fail-closed on STALE/EQUIVOCAL/DENIED); an agent asking to render for a human gets INTERACTIVE labels passed through, never stripped.
- The injection firewall is a chrome property: prompts and approval bodies render typed fields from the string catalog, so manifest text, file contents, and model output have no path into decision-bearing pixels.

### Honesty obligations

The truth-trap ownership table above is this doc's contract with the honesty doctrine: each surface owns a named slice of read-grade rendering (RR1–RR12 via the shared string catalog) and its named traps are per-surface acceptance criteria. Cross-cutting: negative indicators only; no surface invents grade wording; "not permitted to look" is rendered as its own state everywhere the cage denies transport (resolver, network center, Files' bytes column) — pending the vocabulary gap below.

## Open questions

- [x] **Sync honesty split (thesis friction):** F3 places "sync honesty" in System Chrome; this doc keeps only authority/loss *events* in chrome and puts the dashboard in the Session Shell. Confirm or amend the thesis wording. — resolved by [[web-os-thesis]] Amendment 11 (2026-07-07)
- [ ] **Venue detail placement:** folded into the Sync center as a tab (per F13's "Venue/Sync center"); read-side freshness and write-side flush are different mental models — does user testing want them apart?
- [ ] **Retention loop validation:** archive-loop vs agent-workspace as the daily driver; gates v2.x ordering. [open]
- [ ] **`home.enumerate` granularity:** one grant across all linked personas vs per-persona grants (interacts with the persona-doctrine open question in [[web-os-thesis]]).
- [ ] **Thumbnailer at launch:** decode sandbox cost vs Files feeling dead without previews.
- [ ] **No-transport vocabulary:** rendering "not permitted to look" needs a read-grade qualifier the protocol set doesn't define — filed as efsv2 pressure; resolve wording jointly with [[read-lens-spec]].
- [ ] **Citation lens-context disclosure:** the Share center wants to optionally disclose the resolving lens position without publishing the viewer's whole trust order — needs a protocol-side citation-context form.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain verified against current slugs
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
