# Shell, System Chrome, and sessions
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[fable-client-v2-handoff]], [[identity]], [[codex-envelope]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> Elaborates thesis ruling **F3** (split, then plural) and the prompt-surface halves of **F1/F2**. Evidence: Reviews/2026-07-07-clientv2-corpus/research/secure-ui.md, Reviews/2026-07-07-clientv2-corpus/research/fuchsia-components.md, Reviews/2026-07-07-clientv2-corpus/research/webos-precedents.md. Where this doc and [[web-os-thesis]] disagree, the thesis wins until amended; disagreements are listed in Open questions, not smuggled.

## What this rules

Who draws which pixels, who routes which input, and which decisions may never leave first-party conserved code. The Snaps audit record (40 audits: consent-UX and origin-display bugs, zero sandbox escapes) and the $2B+ display-vs-signed-bytes losses (Radiant, Bybit, Permit2) say the prompt surface *is* the attack surface. So this doc treats System Chrome as the most conserved component in the OS, the Session Shell as replaceable policy, and the seam between them as a versioned contract. **[research-grounded]**

## The split: two trust classes, one contract

| | **System Chrome (Ring 1½)** | **Session Shell (Ring 2)** |
|---|---|---|
| Trust class | Kernel-adjacent, first-party, conserved; ships in the closure manifest next to the Kernel | Product policy; ordinary package in principle; first-party-only in v2 |
| Replaceable? | **Never** by anything it supervises | Designed-later path (§Replaceability) |
| Owns | Ceremonies, pickers, permission/install review, wallet ceremony, sync authority & loss events (export ceremony, storage-loss events, bundle custody — thesis Amendment 11), Rescue Shell, first-run orientation, the **compositor mechanism** | Window/layout policy, launcher, workspaces, focus policy, modes, the Sync Center dashboard |
| Analog | UAC secure desktop; iOS out-of-process picker; Fuchsia platform "mechanism" | Fuchsia product session "policy" (RFC-0189 split) |

**Mechanism/policy re-cut [reasoned], flagged as a sharpening of F1 wording:** the thesis says "the Shell composites." This doc splits that: the *compositor mechanism* (DOM reconciliation of surface trees, window frames, input routing, z-order enforcement) lives in Ring 1½ and is conserved; the Session Shell is a client of a typed compositor API and decides *placement, focus order, and layout* — never raw DOM. Rationale: Fuchsia deprecated its element manager (RFC-0189) but survived because the platform kept mechanism; and a third-party Shell that owns raw same-origin DOM is a fatal principal under F2. In v2 both ship in one bundle and the boundary is contract + CI conformance, not hard isolation — stated honestly below.

### The delegated-duty list (normative)

Every Session Shell — first-party or future third-party — MUST delegate these to System Chrome and MUST NOT reimplement, restyle, wrap, occlude, or pre-fill them:

1. **Consent ceremonies** — all eight checkpoints (§Prompt budget) and every modal that grants, signs, spends, publishes, exports, or destroys.
2. **Pickers** — file/folder/lens/endpoint/persona/identity/locale pickers; designation = authorization (F8).
3. **Install and update review** — capability-table diffs, curator/quorum status, cooldown age, deny facts.
4. **Wallet and signing ceremony** — envelope preview, batch expansion, per-record risk classes, ERC-7730 routing.
5. **Permission center** — the live capability table: view, pause, attenuate, revoke, audit trails.
6. **Sync/Venue honesty — authority and loss events** — the export ceremony, storage-loss events, bundle custody; pending-state ladder truth. (The Sync Center *dashboard* — browsing panels, venue detail, storage gauges — is the Session Shell's, per thesis Amendment 11: the Shell renders the status chip and its dashboard detail over Kernel-derived data, while authority actions, loss events, and the ceremonies stay System Chrome.)
7. **Identity rendering** — `<efs-identifier>` and petname resolution inside any trust-bearing string; the shared grade string catalog (RR4 wording cannot fork per Shell).
8. **Recovery** — Rescue Shell entry, generation rollback, key custody status, journal export.
9. **Lock/unlock** — passkey ceremony (T12); no Shell-drawn PIN pad, ever (a fake Shell must have nothing phishable to harvest).
10. **Security advisories** — deny-fact interstitials and revocation warnings.
11. **First-run truth orientation** and every re-affirmation ceremony.
12. **Break-glass** — lethal-trifecta assembly, high-risk device capabilities, Shell-replacement activation.

Enforcement for v2 (same-origin, F2-honest): the Kernel only accepts ceremony-class requests over ports it minted to System Chrome's compartment; the Session Shell has no port that can open, answer, or dismiss a ceremony. A compromised first-party bundle defeats this — the defense budget for that is F4/F11 (reproducible builds, closure verification), not intra-origin theater. **[research-grounded]**

## The Shell contract (`shell-contract@1`)

Versioned against the OS SDK; the Kernel↔app contract stays frozen while this one may churn (Fuchsia lesson: shell APIs churned twice in three years; component manager held). SemVer; the closure manifest records the Shell's declared range; the Bootstrapper refuses to boot a Shell whose range excludes the running Kernel's contract version.

```ts
interface ShellContract1 {
  apps: {                       // hosting: dynamic instances in collections (F8)
    list(): InstalledApp[];                    // launcher data, grades included
    launch(app: AppId, intent?: TypedIntent): SessionInstance;
    lifecycle(i: SessionInstance): { suspend(); resume(); terminate(); onCrash: Stream<CrashInfo> };
  };
  compositor: {                 // mechanism in Ring 1½; Shell = policy client
    createWindow(spec: FrameSpec): WindowHandle;        // frame drawn by compositor
    attach(w: WindowHandle, s: SurfaceHandle): void;    // surface/canvas/document modes
    place(w: WindowHandle, layout: Rect | StackPos): void;
    setFocus(w: WindowHandle, reason: UserGesture | PolicyReason): void;  // gesture-bound
    onInput: never;             // Shell never sees app-directed input
  };
  status: {                     // read-only graded feeds
    sync: Stream<SyncSummary>;        // outbox depth, ladder stages, venue grades
    storage: Stream<StorageEvent>;    // eviction sentinels, tier pressure
  };
  chrome: {                     // one-way doors into System Chrome
    openCeremony: never;              // structurally absent — see duty list
    requestPicker(kind: PickerKind, ctx): Promise<CapabilityHandle>;  // Chrome draws it
    openCenter(which: 'permissions'|'sync'|'generations'): void;
  };
  a11y: {                       // Shell supplies layout semantics; compositor renders real DOM
    declareLandmarks(map: LandmarkMap): void;   // windows, launcher, workspace names
    focusOrder(order: WindowHandle[]): void;
  };
  health: { markSessionHealthy(): void };       // §Rescue Shell watchdog
}
```

- **App hosting:** launch = `CreateChild` in the `user-apps` transient collection with the reviewed grant set (F8); the Shell chooses *when/where*, the Kernel decides *what runs and with what*.
- **Surface compositing:** surface mode reconciled into system components; canvas mode composited inside a Chrome-drawn frame; document mode via the render service. The Shell can move and size frames, never reach inside them.
- **Sync status:** the Shell must render the `status.sync` summary somewhere always-visible per mode (taskbar chip, mobile status row). Copy comes from the shared catalog — e.g. `"3 drafts · 1 signed, unflushed · last venue check 2m"`. It may not invent "saved."
- **Accessibility:** compositor emits real DOM (screen readers see true semantics, F10); the Shell contributes landmarks/labels/focus order and MUST pass the contract's a11y conformance suite (WCAG 2.2 AA floor).
- **Launcher:** reads `apps.list()` including per-app read grades; STALE/EQUIVOCAL/denied states render per Honesty obligations.

## Shell modes (one Shell, five configurations) — v2 ships modes, not Shells

| Mode | Layout | Launcher | Distinctives |
|---|---|---|---|
| **desktop** | Overlapping windows, workspaces | Dock + command palette | Multi-window ceremonies queue |
| **mobile** | Single-surface stack, gestures | Sheet | Ceremonies full-screen takeover; chips collapse to status row |
| **kiosk** | One pinned app, no chrome | None | Exit requires ceremony; System Chrome still reachable via reserved chord; auto-relock |
| **console** | Command-palette-first, panes | Palette | Every OS action as typed command; transcript pane; keyboard-complete |
| **agent** | Headless surface tree + human oversight pane | Programmatic | Surface trees serialized for agent read; ceremonies render only in the human pane; the oversight pane is Shell-owned, rendering Chrome-owned approval/kill data — the kill switch itself lives in System Chrome ([[system-surfaces]] #10) |

Mode is structured config on the one first-party Shell package (`mutability: ["shell"]`), switchable at runtime, persisted per device profile in the encrypted local tier. Kiosk hard-locks `apps.launch` to a pinned set — but never disables ceremony delegation or the Rescue chord. **[reasoned]**

## The Rescue Shell

Minimal, first-party, part of the System Chrome trust class, pinned in **every** closure manifest.

**Triggers:**
- **Health-gate failure** (Android `markBootSuccessful` pattern): Bootstrapper boots generation N and arms a watchdog; the Session Shell must call `health.markSessionHealthy()` within 20s of Kernel handshake + first composited frame. Failure ⇒ reboot into N−1; failure of N−1 too ⇒ Rescue Shell.
- **Crash loop:** ≥3 Shell/Kernel crashes in 10 minutes.
- **Integrity mismatch:** closure verification failure at boot (the Bybit lesson, T11) — Rescue, never "proceed anyway."
- **Storage-loss sentinel:** generation sentinels/`persisted()` deltas show the browser evicted state.
- **User-invoked:** boot-time interstitial hold (2s hold on the boot mark), or `?rescue=1` boot param.

**Capability set (closed list):** read generations + switch/rollback among locally verified ones; capability table read + pause-all/revoke-all; journal + signed-bundle export (`.efs-bundle`); key custody status + export ceremony; deny-fact review; a single user-configured endpoint to fetch a known-good closure (minimal broker mode). **No** Ring-3 apps, no personas, no promptless signing, no launcher.

**What it can never lose [research-grounded]:** it must boot with zero network from cache (double-stored: inside the active and previous generation caches); zero dependence on the Session Shell, Shell config, mutable state, or any Ring-3 code; export must work even when every venue is unreachable. This is the hedge against browser eviction, bad generations, and *our own* organizational mortality (Urbit's users had no exit; ours do).

## Shell replaceability (designed later, contracted now)

- **Shell packages are ordinary packages** (F4): content-addressed, manifest with `program.runner: "shell"`, capability ceiling = the `shell-contract` capability set only. Zero-power install applies — installing a Shell is inert; *activating* it is checkpoint 4+8.
- **Capability diff:** activation review shows the Shell's grant set diffed against the incumbent's — a Shell requesting anything outside the contract set fails review structurally.
- **Compatibility receipts [reasoned]:** the Shell author (and independent curators) publish signed conformance records — `{shellPackage, contract: "shell-contract@1.x", suiteCID, result, ts}` — consumed as **GATE reads** at activation: STALE/EQUIVOCAL/denied receipts stop auto-activation per RR5/RR8; the user may still manually pin, labeled.
- **Fallback rules:** new Shell activates under the same watchdog; failure to mark healthy ⇒ auto-revert to the previous Shell without touching the rest of the generation. The incumbent Shell is retained keep-previous style. Rolling into a Shell carrying a deny fact warns explicitly (F4).
- **Hard floor:** no Shell package can replace, restyle, or interpose System Chrome or the Rescue Shell; a third-party Shell never sees ceremony contents or raw input during ceremonies. Third-party Shells ship only after the compositor mechanism/policy split is enforced by a real boundary (worker-hosted Shell speaking the compositor API), not before. **[reasoned]**

## Secure prompts: the System Chrome spec

### Threat model after F1

Apps own no pixels, no DOM, no fullscreen/PiP/pointer-lock/keyboard-lock — the classic in-page overlay spoof and the fullscreen repaint are **structurally gone**, not mitigated. What remains:

1. **Mimicry inside an app surface** — an app renders a *picture* of a ceremony inside its own frame (Qubes fake-border residual).
2. **Browser-level BitB** — a hostile ordinary website imitates the whole EFS OS or its wallet popup; no page-level fix exists.
3. **Compromised first-party bundle** — same-origin, fatal by F2; answered by F4/F11, out of scope here.
4. **Render-service documents** — sandboxed iframes; denied fullscreen/PiP/popups via sandbox flags + Permissions-Policy.

### Ceremony anatomy (T-map)

Every ceremony renders in the System Chrome layer — a top-level DOM region owned by Bootstrapper-loaded Chrome code that the compositor never places app surfaces into. During a modal ceremony the session layer gets `inert` + dim (UAC secure-desktop analog): input to apps and Shell is suspended — the closest a page gets to "suspend all applications." **[research-grounded]**

| Spec | Source |
|---|---|
| Ceremony surface never renders inside an app window frame; always anchored to the Chrome dock with session-dim | T1 |
| Pickers are the grant: selection returns the scoped handle; no follow-up yes/no | T2 |
| Quiet-deny default; ceremony budget below | T3 |
| Preview derived from the typed records themselves; batch aggregate + expandable + per-record risk class; envelope hash shown; ERC-7730 descriptors shipped | T4 |
| Interaction gating: no default-focused accept; confirm disabled 500ms (R2) / 3s (R3-preview); `InputEventActivationProtector` clone ignores too-fast clicks and early Enter/Space; long diffs require scroll-to-end before the confirm control mounts | T5 |
| **Chrome mark** — user-chosen word + accent color set at first-run, shown in every genuine ceremony. Negative indicator only. Setup copy: *"Real EFS ceremonies always show your mark. A missing or wrong mark doesn't mean 'unsafe site' — it means stop, this is a forgery."* Never rendered as a green-check trust signal (SiteKey 58/60) | T6 |
| All requester identity Kernel-derived: user-assigned petname, package CID, author identity word via verified manifest. App-supplied strings render quoted, visually distinct, labeled *"app-provided, unverified"* | T7 |
| Full identifiers via `<efs-identifier>` — full value, chunked, LTR-isolated, confusable-checked; paste of a recipient runs a poisoning check against journal history lookalikes: *"This address differs from one you've used in 4 middle characters. Poisoning is common. Pick from your address book instead?"* | T8 |
| Apps get no fullscreen/pointer-lock/keyboard-lock/PiP, ever; see §Window management for the attenuated substitutes | T9 |
| Risk-threshold routing: above R3 the Shell prompt is only the *preview*; authorization runs on a surface EFS doesn't draw | T10 |
| Boot-time closure verification; the About surface shows the running generation CID as a checkable fact | T11 |
| Passkey ceremony for unlock and step-up; origin-bound, unphishable by a fake OS copy — the structural BitB answer | T12 |

**BitB residual (G2, accepted):** no web secure-attention key exists. Inside our tab a reserved chord (default `Ctrl/⌘+Shift+Esc`) reliably opens System Chrome — apps never see raw input, so Ring-3 cannot intercept it — but a *copy of our OS on another origin* can fake everything except the passkey ceremony and the wallet's own screen. Mitigations: PWA install guidance (own OS window = real chrome boundary), T10/T12, and never giving the Shell a phishable secret. Documented, not solved. **[research-grounded]**

### Risk classes and routing

| Class | Examples | Surface |
|---|---|---|
| **R0 quiet** | Session-scoped trivia, already-granted use | None, or auditable chip |
| **R1 picker** | Open/save, share, pick lens/persona/endpoint | System Chrome picker; selection = grant |
| **R2 ceremony** | The eight checkpoints at ordinary stakes | Chrome modal, interaction-gated |
| **R3 external** | Primary-author signatures; spends ≥ user limit (default 0.05 ETH-equiv **[open]**); admin/root grants; key export; lens-root or deny-set changes | Wallet clear-signing (ERC-7730) or passkey step-up; Shell-only confirm **disallowed** |

### Prompt budget doctrine

Pickers > chips > modals. Modal ceremony is reserved for exactly **eight consequential checkpoints** — canonical per [[web-os-thesis]] Amendment 4:

1. **Sign/flush** an envelope (any author — envelope signing / flush authorization) 2. **Publish** (first placement to a public venue — the permanence ceremony) 3. **Spend** 4. **Install/update grant-broadening** (zero-power install itself is promptless) 5. **Admin grants** (including the identity/custody subclass: persona create/link/unlink, primary custody changes, `home`/checkpoint claims) 6. **Export** (keys, signed bundles, journal) 7. **Destroy local data** (the only real delete) 8. **Break-glass** (lethal-trifecta assembly, high-risk device capability, Shell activation).

Anything else that thinks it needs a modal is a design bug: route it to a picker, a chip, or nothing. Chips are quiet, non-blocking, collected in the permission center; an unrequested prompt defaults to the quiet path (Chrome quieter-permissions evidence: most prompts are noise). Budget review is a design-gate: no telemetry exists (thesis), so a local-only ceremony counter in the permission center is the user's own habituation mirror. **[research-grounded]**

## Window management, focus, and input routing

- **Frames are compositor-drawn.** Petname chip + (only when not plain LIVE) a grade qualifier. App-set window titles render inside the content region in quoted style — never in the frame's trust band.
- **Focus follows explicit user gesture** or Shell policy through `setFocus(_, reason)`; the compositor validates gesture-bound reasons. Keystrokes route only to the focused surface; apps cannot synthesize trusted input, steal focus, or read input directed elsewhere. Clipboard read is a capability with a chip; programmatic paste into ceremonies is ignored (anti-keyjacking).
- **Reserved chords** (`Ctrl/⌘+Shift+Esc`, the rescue hold) are filtered by the compositor before delivery — within-tab SAK, honestly scoped (see G2 note).
- **No app fullscreen/pointer-lock/keyboard-lock/PiP.** Substitutes: *focus mode* — the Session Shell (not the app) may maximize a frame while System Chrome keeps a persistent reveal edge and the escape chord; *pointer capture within surface* — canvas-mode games may request relative pointer deltas while the pointer is inside their surface, Esc always exits, a Chrome banner ("Esc releases the pointer") persists. Both are R2 grants, session-scoped, auto-expiring. Browser-level fullscreen may be used only by the Session Shell in kiosk mode, with the reveal edge retained. **[research-grounded]**

## First-run truth orientation

Three screens, then teach-at-the-checkpoint (not a wall of onboarding — orientation attaches to the first consequential act): **[reasoned]**

1. **Permanent ink.** *"EFS writes are permanent. Publishing is like carving, not typing — you can withdraw a listing, but not the carving. 'Delete' here means unlist; the only thing this device can truly delete is its own local copy."* Acknowledge to continue.
2. **Whose word counts.** *"There is no single truth feed. You read the network through lenses — ordered lists of authors you trust. We start you on the {first-party curation lens}; you can change it any time."*
3. **Your mark.** Chrome mark setup (copy above).

Deferred lessons, each a one-time inline card at the moment it matters: **address homes** at first non-HOME venue divergence ("your files live at your address; apps visit — this copy is 2 days behind its home"); **personas** at first app write ("this app writes as its own burner author under your name — here's how readers see it"); **permanence re-affirmation** inside the first Publish ceremony (typed confirmation of the word "publish"); **storage honesty** at first eviction-risk signal (Safari 7-day lease copy).

### Agent lens

- Agent sessions are the fourth principal (F9); the **agent mode** Shell projects the same declarative surface trees apps emit — the agent-visible UI *is* the accessible UI, no scraping lane to diverge.
- **Ceremonies are never agent-satisfiable.** The eight checkpoints require human input on the System Chrome surface; interaction gating (T5) doubles as a machine-presence filter. Agent-initiated actions queue as plans; the plan-review ceremony is its own ceremony type showing the frozen plan, budgets, and data slots.
- **Agents cannot read ceremonies.** Ceremony contents render outside every agent-visible surface tree — an agent can neither coach a user through ("just click confirm"), harvest addresses from, nor time its requests against a live ceremony. Chips announcing agent progress are visible to the human only.
- The Session Shell's oversight pane (agent mode) shows the plan, step receipts, and budget meters as first-class windows over Chrome-owned data; killing an agent session is R0 (always instant, never prompted — the kill switch itself is System Chrome's, [[system-surfaces]] #10).

### Honesty obligations

- **Sync truth:** the pending-state ladder renders verbatim; journal-only state is never "saved"; a signed, unflushed bundle is labeled *"signed — anyone holding this can publish it, now or years from now; expiry only ages what readers make of it. The pre-signed abort artifact is the kill switch."*
- **Grade discipline:** launcher and window frames follow RR2–RR6 — UNKNOWN never renders as absent; STALE is venue-qualified in RR4's catalog form (*"no renewal known to this venue (age 41d)"*), never conflated with REVOKED; EQUIVOCAL app channels never auto-launch (GATE semantics for the launcher's update path).
- **No positive trust chrome:** no green checkmarks, no "verified ✓" badges; warn loudly on bad states only. The chrome mark is framed exclusively as a tripwire.
- **Permission center states "not permitted to look" distinctly** — an app with no transport capability shows *"unknown: this app can't check"*, never "none found" (needs the NO-TRANSPORT qualifier, see gaps).
- **Storage loss is an event:** Rescue/Sync Center surfaces "your browser deleted local data" with what was lost relative to last export.

## Open questions

- [x] **Compositor split vs thesis wording** [conflict]: F1 says "the Shell composites"; this doc moves the compositing *mechanism* to Ring 1½ and leaves the Shell *policy*. Needs a thesis amendment or a reversal here before either promotes. — resolved by [[web-os-thesis]] Amendment 2 (2026-07-07)
- [x] **The eighth checkpoint** [conflict]: thesis T3/F9 enumerate seven ceremony checkpoints; this doc adds break-glass as the eighth. Confirm and amend the thesis list, or fold break-glass under admin grants. — resolved by [[web-os-thesis]] Amendment 4 (2026-07-07)
- [ ] R3 economic threshold default: owned by [[wallet-and-actions]]'s open question (T10 value threshold constant and denomination); this doc consumes whatever constant that ruling sets, and only keeps the sub-question of whether changing the threshold is itself R3-gated. [open — pointer]
- [ ] Ceremony queueing semantics in desktop mode: serialize all ceremonies globally, or per-app with a global cap? Habituation risk vs deadlock. [open]
- [ ] Does kiosk mode need a distinct closure profile (pinned generation + pinned app) rather than a Shell config, for venue/enterprise deployments? [open]
- [ ] Conformance-suite ownership for `shell-contract@1`: which repo hosts it, and is the a11y suite part of the same gate? [open]
- [ ] Chrome mark storage: encrypted local tier only, or escrowed in the user's encrypted roaming state so a new device shows it before first unlock? (Roaming makes it phishable-in-transit; local-only means new devices start markless.) [open]

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain checked ([[web-os-thesis]] amendments reconciled, [[read-lens-spec]] RR bindings unchanged)
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
