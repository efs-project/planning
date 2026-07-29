# Ideas

A lightweight parking lot for future ideas, "we should do X someday" drops, and things-to-account-for that aren't decisions, work, or full explorations yet. Keep entries short. The PM curates this and surfaces items when they become relevant.

**Lifecycle:** raw idea here → when worth real exploration, spawn a [[Brainstorms/README|Brainstorm]] → when designed, a `Designs/` doc. Mark an idea `→ [[link]]` when it graduates, or strike it if dropped (with a why). This is NOT for decisions ([[Decisions]]), pending James-asks ([[For-James]]), or active work ([[Kanban]]).

---

## Open

### A per-read diagnostic channel — "why this file?" (from vfile's `messages`)
*(James asked about [vfile](https://github.com/vfile/vfile), 2026-07-29)*

vfile (the unified/remark file object) separates a file into `value` (bytes) · `path` (location) · `data` (metadata) · **`messages` (positioned diagnostics)**. The first three map cleanly onto EFS DATA / anchors / PROPERTY. **EFS has no equivalent of the fourth**, and it needs one: [[file-browser-requirements]] **J9** asks *"two people see different winners at the same path — why this file?"*, and the read model carries `UNKNOWN` vs proven-absent, basis pinning, and fail-closed reads that all have to be explained rather than silently applied.

vfile's message shape is a usable model: `reason` + `source` (which subsystem spoke) + `ruleId` (which rule fired) + `fatal` (did the read fail closed) + `place` (where). Mapped to EFS: **source = which lens/resolver, ruleId = whiteout / revoked / unknown-basis / cycle-cap, fatal = fail-closed, place = which record or redirect hop.** A read result would carry its own explanation, so a client can answer "why this file?" and surface read grades honestly instead of quietly.

Threads: [[file-browser-requirements]] J9 · the read-grade / `UNKNOWN` vocabulary in the lens work · SDK receipt/error/progress design (flagged as worth harvesting). **Not protocol** — a read-result/SDK/client shape needing no frozen surface; but reserving the *vocabulary* early keeps clients consistent.

**Also validated, no action needed:** vfile's `history` is append-only with `path` a getter over its last entry — independently the same shape as EFS's move doctrine (permanent paths + `REDIRECT(kind=4 movedTo)` at every vacated path). Convergent design; treat as confirmation. And `rehype-sanitize` is this ecosystem's answer to the markdown-XSS requirement the README-pane work flagged — use it rather than hand-rolling.

### Instant guest deep links + two-mode applications
*(James, 2026-07-28)*

Make the first experience of EFS OS a **fast, unauthenticated guest path** for
people arriving through ordinary hyperlinks from Reddit, chats, search, and
other sites. A public file, folder, or app link should open directly into the
smallest useful viewer—typically the file browser or linked app—without account
creation, wallet connection, authentication, profile hydration, or a tour.
Most visitors will not have EFS accounts and should still get immediate value.

Keep only the minimum trustworthy link-classification, data-resolution, and
verification slice on the critical path. Defer the full Kernel, wallet and
identity systems, private stores, sync, package management, general Session
Shell, and unrelated OS services until after the linked content is interactive;
then warm them in the background or load them when the user asks for a
privileged/full-OS action. Preserve hyperlinks as a first-class product surface,
not an onboarding detour.

Require third-party applications to design two operational modes:

- **guest mode:** fast, useful, read-oriented, no identity assumption, and no
  ambient access to private data or authority; and
- **authenticated mode:** explicitly promoted after user intent, with the
  application's full authorized features, private data, writes, and security
  ceremonies.

Explore the universal edge case honestly: applications that cannot offer a
meaningful guest function should have to declare that limitation and must not
become the automatic handler for public hyperlinks. Promotion from guest to
authenticated mode must preserve the user's route/state without silently
granting capabilities.

Treat modularity as a performance and ownership requirement: Bootstrapper,
minimal verifier/resolver, viewers, Kernel services, authentication, Shell, and
individual apps should have explicit dependency boundaries, separately
loadable closures, budgets, lifecycle/restart behavior, and independently
manageable updates where security permits. "Modular" is not satisfied merely
by separate source files if opening one folder still downloads and initializes
the whole OS.

**Terminology:** James called this the anonymous path; use **guest /
unauthenticated path** in specifications. It means no account or login
prerequisite, not network or graph anonymity. Endpoint choice, public reads,
and public writes may still leak interest, authorship, timing, and graph
relationships.

**Existing foundation:** [[Designs/clientv2/boot-and-profiles]] already specifies
minimal viewer closures, guest generations, lazy full-Shell promotion, and cold
start budgets; this idea strengthens the product requirement and adds the
third-party dual-mode contract plus stricter auth/kernel deferral. Revisit in
the boot performance and app-model rounds. Related:
[[Designs/clientv2/web-os-thesis]],
[[Designs/clientv2/fable-third-party-app-model-handoff]],
[[Designs/clientv2/kernel-capability-model]], and
[[Designs/clientv2/packages-and-updates]].

### Open cross-app achievement standard
*(James, 2026-07-28)*

Explore an open achievement system for EFS OS that combines the motivation and
progress view of Steam/Xbox/PlayStation achievements with POAP-like durable
records of meaningful things a person has done. The OS should be able to show
one cross-app collection while each app owns a namespaced catalog of earnable
achievements. The likely user surface is a first-party Achievements app that
aggregates an open catalog-of-apps → per-app achievement catalogs → the user's
earned records and remaining goals; it is a viewer/index, not the universal
issuer.

A candidate app achievement manifest would publish stable achievement IDs,
human metadata and artwork, visibility/hidden status, version/supersession
relationships, and a configurable read-only eligibility function or validator:
given a principal and an achievement, can this principal earn or claim it now?
Keep **eligibility**, **claiming/issuance**, and **earned evidence** separate.
Some achievements may be derived live with no mint; some may be self-claimable
from a verifiable proof; others may require an app, event organizer, or trusted
issuer to attest. Hidden unearned achievements are desirable where technically
honest, but are not a hard requirement.

Do not pre-decide the earned-record carrier. Compare:

- a portable EFS achievement claim;
- a non-transferable or soulbound token;
- an ordinary transferable NFT where that meaning is intentional;
- an EAS/credential/POAP-compatible projection; and
- a derived, non-minted result computed from public state.

The open standard matters more than choosing one collection contract. A single
official contract or NFT collection should not become the authority over every
app's achievements. App identity, catalog authority, verifier identity/version,
evidence, recipient principal, issuance basis, revocation, transferability, and
privacy must remain explicit and independently inspectable.

Questions for the later exploration:

- Can the eligibility function be safely standardized as a bounded
  `view`/read-only interface across chains and off-chain evidence?
- How do portable achievements survive account/key rotation and multiple
  personas without making private personas linkable?
- Who may add, change, hide, revoke, or supersede an app's achievements?
- How are anti-cheat, snapshot/finality, replay, cross-chain state, and
  unverifiable local/off-chain actions represented honestly?
- Can hidden achievements conceal their criteria or existence on a public
  system, or are they only hidden in presentation?
- How does the OS distinguish an entertaining accomplishment, an
  organizer-issued attendance record, and a security-sensitive credential
  without turning any of them into a generic green trust badge?
- What is the simplest SDK flow for defining a catalog, checking eligibility,
  claiming, and displaying portable progress?

This is a strong future workload for
[[Designs/efsv2/fable-handoff-portable-schemas-and-validators]]: shared schemas,
portable identity, stateful admission/validation, receipts, discovery, and real
EAS projection all meet here. It also connects to [[Designs/efsv2/kel]],
[[Designs/efsv2/privacy-pass-synthesis]],
[[Designs/efsv2/apps-cookbook]], and the eventual EFS OS identity/app model.

### HyperCard/Decker-style end-user authoring
*(James, 2026-07-26)*

Explore a first-party EFS OS authoring app whose artifacts are both **editable documents and sandboxed apps**. Start with cards/pages, native fields/buttons/grids/canvases, links, and a direct **Edit ↔ Interact** switch; let users add small event scripts only when direct manipulation stops being enough. Visible objects should own their behavior, persistent state should live in the artifact, and reusable components should be copyable between projects.

The EFS-shaped version could make **use → inspect → edit → remix → script → publish** one continuous ladder: local drafts while making, a capability-confined app while running, a forkable package when shared, and an explicit content-addressed generation when published. This may be a stronger candidate for the Client v2 retention app than a platform-first demo, and a useful real workload for the surface-mode prototype.

Guardrails: System Chrome and security ceremonies remain uneditable; no ambient network/device authority; real DOM semantics instead of a canvas-only UI; responsive constraints instead of fixed-card-only layouts; local save is not permanent publication; the tool must remain useful before scripting. Preserve Decker's portable, diff-friendly artifact and reusable “contraption” ideas without copying its accessibility and fixed-layout costs.

**Evidence update (2026-07-26):** Itch lists [310 Decker-tagged projects](https://itch.io/games/tag-decker), including browser-playable puzzles, interactive fiction, visual novels, simulations, zines, sequencers, and design tools. That is evidence of a real creator/distribution loop, not merely affection for an old interface. [LiveCode](https://livecode.com/) is the higher-ceiling continuation to study: visual Edit/Run modes, stacks/cards/controls, object-local message scripts, and cross-platform publishing ([application structure](https://lessons.livecode.com/m/4603/l/565723-the-structure-of-a-livecode-application)). It validates the gradual authoring model, while its evolution toward a professional commercial app builder—and the [2021 archive of its former Community repository](https://github.com/livecode/livecode)—is a warning not to lose the sovereign, inspectable, remixable artifact along the way.

Other references: [Decker overview](https://beyondloom.com/decker/), [manual](https://www.beyondloom.com/decker/decker.html), [file-format rationale](https://www.beyondloom.com/decker/format.html), [HyperCard User's Guide](https://vintageapple.org/macmanuals/pdf/HyperCard_Users_Guide_1987.pdf), and Hacker News discussions on [Decker](https://news.ycombinator.com/item?id=33377964), [normal people making specific tools](https://news.ycombinator.com/item?id=4227698), and [tinkerable software](https://news.ycombinator.com/item?id=38961262). Related: [[Designs/clientv2/web-os-thesis]], [[Designs/clientv2/kernel-capability-model]], [[Designs/clientv2/system-surfaces]], and [[Designs/clientv2/open-questions]].

### Retro OS and playful shell themes
*(James, 2026-07-23)*

Explore optional nostalgic theme packs for the Client v2 **Session Shell**: old operating systems, consoles, games, terminal UIs, and early-web styles. Besides being fun and distinctive, radically different themes could stress-test whether the Shell's tokens and components are genuinely reusable.

Not active work. Revisit when the Client v2 Shell/theme layer is being specified or prototyped. Preserve the trust boundary: themes may change app and Session Shell presentation, but must not restyle security-critical **System Chrome** or weaken accessibility, readability, and trusted-surface cues. Related: [[Designs/clientv2/kernel-capability-model]], [[Designs/clientv2/shell-and-sessions]], and [[Designs/clientv2/locale-and-accessibility]].

<details>
<summary>Hacker News reference collection (deduplicated)</summary>

**Classic desktop/windowing**

- [98.css](https://jdan.github.io/98.css/) ([repo](https://github.com/jdan/98.css)) — Windows 98
- [win95.css](https://alexbsoft.github.io/win95.css/) ([repo](https://github.com/AlexBSoft/win95.css)) — Windows 95
- [XP.css](https://botoxparty.github.io/XP.css/) ([repo](https://github.com/botoxparty/XP.css)) — Windows XP
- [7.css](https://khang-nd.github.io/7.css/) ([repo](https://github.com/khang-nd/7.css)) — Windows 7
- [system.css](https://sakofchit.github.io/system.css/) ([repo](https://github.com/sakofchit/system.css)) — classic Apple System
- [os-gui](https://github.com/1j01/os-gui)
- [windows-95-ui-kit](https://github.com/themesberg/windows-95-ui-kit)
- [retro-css-shell-demo](https://github.com/andersevenrud/retro-css-shell-demo)
- [React95](https://github.com/arturbien/React95)
- [window98-html-css-js](https://github.com/lolstring/window98-html-css-js)
- [hackertosh.css](https://github.com/anthmn/hackertosh.css)
- [csswin10](https://github.com/jianzhongli/csswin10)
- [Renkbench](https://github.com/lachsfilet/Renkbench)
- [classic.css](https://github.com/npjg/classic.css)
- [platinum](https://github.com/robbiebyrd/platinum)
- [new-dawn](https://github.com/npjg/new-dawn)
- [retro-desktop](https://github.com/ritenv/retro-desktop)

**Consoles and games**

- [PSone.css](https://micah5.github.io/PSone.css/) ([repo](https://github.com/micah5/PSone.css)) — PlayStation
- [NES.css](https://nostalgic-css.github.io/NES.css/) ([repo](https://github.com/nostalgic-css/NES.css))
- [SNES.css](https://snes-css.sadlative.com/)
- [CS 1.6 UI](https://cs16.samke.me/)
- [The Sims CSS](https://thesimscss.inbn.dev/)
- [Xbox 360 UI](https://irv77.github.io/Xbox360UI/)
- [Dreamyard DS](https://css.ds.dreamyard.xyz/)

**Early web, terminal, and typography**

- [BOOTSTRA.386](https://bootstra386.com/) ([repo](https://github.com/kristopolous/BOOTSTRA.386))
- [Geo Bootstrap](https://code.divshot.com/geo-bootstrap/)
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/)
- [terminal.css](https://github.com/Gioni06/terminal.css)
- [TuiCss](https://github.com/vinibiavatti1/TuiCss)
- [C64CSS3](https://github.com/RoelN/c64css3)
- [After Dark CSS](https://github.com/bryanbraun/after-dark-css)

</details>

### Hardened HTMX for third-party OS apps
*(James, 2026-07-14; revised 2026-07-27)*

**Owner steering:** prefer adapting the existing HTMX library over inventing an
EFS UI framework. Preserve normal `data-hx-*` authoring wherever the security
boundary permits it.

**Revised leading hypothesis:** run a trusted, OS-supplied HTMX 4 instance in
the compositor; the confined Wasm/WASI app owns state and returns ordinary HTML
fragments. An EFS HTMX extension replaces `fetch()` with a `MessagePort` call to
that app's worker and returns a synthetic `Response`, allowing HTMX to retain
its triggers, form collection, request coordination, targeting, swapping, and
settling:

`click/input/submit → HTMX → MessagePort → Wasm handler → HTML Response → hardened surface-local HTMX swap`

HTMX 4 already exposes the transport replacement required for this through its
extension request context. Start with an extension, then make the smallest
auditable fork only where extension hooks cannot fail closed. The library's
Zero-Clause BSD license explicitly permits modification.

The remaining work is hardening, not inventing a framework:

- remove native-network fallback so every action must cross the app's port;
- scope every target, indicator, preserve, partial, and swap lookup to the
  app's root—never `document`, `body`, System Chrome, or another app;
- reject scripts, `hx-on`, `javascript:`, arbitrary extensions, active/custom
  elements, unsafe resource URLs/styles, history/boost, and unapproved
  response-control headers before insertion;
- enforce fragment/DOM/rate budgets, cancellation, sequencing, restart/resync,
  and focus/accessibility/IME/RTL behavior.

Try in this order: unmodified HTMX 4 plus an EFS extension; a minimal
security/scoping fork; only then a new typed Surface protocol if the adaptation
cannot be made safe or portable. Use literal unmodified HTMX inside an
opaque-origin iframe as the compatibility/control lane.

Primary-source starting points:
[HTMX 4 extension authoring](https://github.com/bigskysoftware/htmx/blob/four/src/skills/htmx-extension-authoring.md);
[HTMX security guidance](https://htmx.org/docs/#security);
[license](https://github.com/bigskysoftware/htmx/blob/four/LICENSE).

→ [[Designs/clientv2/fable-third-party-app-model-handoff]]

### Burner wallets for transactionless interactions + multi-wallet identity in lenses
*(James, 2026-06-21)*

People should be able to use **burner wallets for transactionless interactions** — browse, read, and curate without funding a wallet or sending gas. Reads are already gasless (view/`eth_call`); the harder part is letting a burner *participate* (curate, signal, intend-to-write) without on-chain txs — e.g. EIP-712 signed intent that's relayed/batched later (ties to the SDK's one-signature/batch + AA-ready Submitter seam).

**The structural requirement James flagged:** one user can have **multiple wallets** (main + burners), so the **Lens system must treat a set of wallets as one identity**. Concretely: **wallet *lists* as lens arguments** — functions that take a single lens/attester address should accept a list, so a user's combined view (all their addresses) resolves as one.

**Threads this connects to (for whoever designs it):**
- Lenses are *already* composable (`?lenses=alice.eth,bob.eth`) — "my wallets = the lenses I trust as myself" is partly expressible today; the gap is a first-class "these N addresses are ME" grouping.
- Holistic review **ARCH-9** (no lens key-rotation story; lost/rotated curator key freezes decades of curation) — same family: identity that spans keys over time.
- SDK on-chain identity model (`read(path)=address(this)`, `readAs(path,who)`, Aave-style `onBehalfOf`, EIP-712 + ERC-1271) — the multi-wallet-as-one-principal question lives here.
- Burner key custody / "share hex not ENS in archival URLs" (ARCH-9) — burners are ephemeral keys; how do they map to a durable user identity?

Not blocking. A candidate for a dedicated brainstorm/design (likely an SDK + lens-model concern). **Update 2026-07-01:** the *burner-session* half **shipped** — contracts **PR #39 "instant Sepolia burner session"** merged to `main` (chain-aware burner + network persistence). **Update 2026-07-05 — graduated into EFS v2 →** [[deterministic-ids]] + [[efs-v2-holistic-redesign]]. Fable's v2 identity work directly takes up both threads: the **identity crux** splits *authorization* (live, chain-bound — the B′ account, ERC-1271/4337/7702) from *authorship* (eternal, chain-free key signatures + key-event log), and **named lenses (lens-as-LIST)** give the "these addresses are ME / a curator I follow" grouping without editing URLs. Transactionless/one-popup writes fall out of v2's deterministic one-tx parents-first batches. Watch the v2 designs; this parking-lot entry is now tracked there.
