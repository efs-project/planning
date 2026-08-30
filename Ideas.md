# Ideas

A lightweight parking lot for future ideas, "we should do X someday" drops, and things-to-account-for that aren't decisions, work, or full explorations yet. Keep entries short. The PM curates this and surfaces items when they become relevant.

**Lifecycle:** raw idea here → when worth real exploration, spawn a [[Brainstorms/README|Brainstorm]] → when designed, a `Designs/` doc. Mark an idea `→ [[link]]` when it graduates, or strike it if dropped (with a why). This is NOT for decisions ([[Decisions]]), pending James-asks ([[For-James]]), or active work ([[Kanban]]).

---

## Open

### Curator-qualified Open Alternatives starter catalog
*(James, 2026-08-24; prompted by [debloat.dev](https://debloat.dev/) and its [HN discussion](https://news.ycombinator.com/item?id=49410362))*

Explore a Debloat-like **Open Alternatives catalog** as a candidate EFS demo
dataset or client-recommended catalog: fast guest browsing that answers "what
open-source project replaces X?", with stable project pages, exact releases,
feature gaps, license/platform evidence, discussion, plural rankings, and a
Wanted request-to-solution workflow. Its narrow task-shaped UX is more useful
than making one undifferentiated index answer every discovery question.

"Default" must mean a replaceable, curator-qualified recommendation over an
exact finite catalog edition—not an official bit, global Core truth, or required
intermediary for direct data links. The live directory is discovery evidence,
not an authorized seed: no reusable catalog-data license or complete immutable
export was found, its fields are mutable operator claims, and its anonymous
feedback and small rating samples do not establish quality or safety. Do not
mirror its descriptions, ratings, comments, or database without permission.

If this becomes a real fixture, independently verify roughly 10–20 projects
from primary repositories/releases/licenses and include competing curators, a
project family, partial replacement, moved/stale repository, disputed claim,
Wanted request, honest `UNKNOWN`/`PARTIAL`, direct guest links, and
reconstruction after the original directory/index disappears. It adds no new
Core primitive. Full intake: [[Reviews/2026-08-24-debloat-directory-intake]].

### Media lifecycle workload pressure-test portfolio
*(James, 2026-08-14)*

Park adjacent media workloads as **candidate fixtures for falsifying EFS media
requirements**, not as applications EFS has decided to build. The active
product tracks remain the shared media foundation, Booru/Sankaku-style public
gallery and Plex/Jellyfin-style private library in
[[Designs/media-library/README]]. Pull one of these workloads into an
experiment only when it exposes a materially different failure mode:

| Parked workload | Distinct pressure on the shared design | Smallest safe fixture |
|---|---|---|
| **Family legacy archive**, informed by [Immich's original/sidecar/backup boundary](https://docs.immich.app/administration/backup-and-restore/) | Private originals, XMP edits, RAW/JPEG or photo/video pairs, exact versus perceptual duplicates, revocable sharing and cold reconstruction. This is preservation and inheritance, not another Plex skin. | Twelve synthetic assets from two devices, including one sidecar correction, exact and near duplicates, a paired asset and one share/revoke cycle. |
| **Creator release capsule**, informed by [Podcasting 2.0](https://podcasting2.org/docs/podcast-namespace/1.0), [Faircamp](https://simonrepp.com/faircamp/) and [Pepper&Carrot's source/translation workflow](https://www.peppercarrot.com/en/webcomic-sources/ep34_The-Knighting-of-Shichimi__files.html) | Mutable channel or catalog head pointing to immutable episode, album or chapter releases; masters versus encodes; chapters, transcripts, credits, language layers and mirrors. | One creator-owned episode, two-track EP or comic page with two representations, credits, one timed/text layer and two mirrors. |
| **Scholarly or cultural viewer**, informed by [IIIF Presentation 3](https://iiif.io/api/presentation/3.0/) and [Chronicling America](https://www.loc.gov/apis/additional-apis/chronicling-america-api/) | Compound identity such as title → issue → page → region → OCR word; exact fragment citations; region annotations; later OCR or image corrections without citation drift. This is evidence navigation, not merely booru tagging. | One rights-reviewed four-page historical issue with page images, OCR/coordinates and three exact article-region citations. |
| **Production asset and review graph**, informed by [OpenUSD composition](https://openusd.org/release/glossary.html) and [Frame.io annotations](https://help.frame.io/en/articles/9105251-commenting-on-your-media) | Authored layer/dependency closure, variants and missing dependencies; proxy-first review followed by an original; comments anchored to an exact revision, frame or region rather than silently migrating across edits. | One tiny layered 3D scene plus a 12-second v1/v2 clip, one missing dependency, one proxy/original pair and three version-bound annotations. |
| **Offline field-media notebook**, informed by [ODK's offline Entity conflicts](https://docs.getodk.org/central-entities/) and [STAC](https://stacspec.org/) | Encrypted device-local capture, schema versions, parallel offline branches, interrupted attachment delivery, sensitive coordinates and deliberate local-to-public promotion. Connect this to [[#Persistent shared subjects + plural geospatial claims]], not a rival map authority. | A synthetic tree or river inspection with one photo, short audio clip and GPS point; two devices update the same subject offline and upload out of order. |
| **Live-to-archive channel**, informed by [PeerTube federation](https://docs.joinpeertube.org/api/activitypub) and [Owncast's non-archival live-storage boundary](https://owncast.online/docs/storage/) | Scheduled → live → ended → archived state; incomplete segment sets, outages and clock skew; exact final edition versus the live session; chat/moderation state kept separate from archived media. | A five-minute synthetic stream with one gap, a saved master, two final mirrors and no raw chat publication by default. |

Keep several deliberately awkward formats as **infrastructure-only torture
tests**, not presumed products: one Landsat/STAC scene for authenticated range
and spatial/time queries; one OME-NGFF microscopy image for N-dimensional chunk
verification; one multi-LOD 3D object for dependency closure and coordinate
annotations; one synthetic Frigate-shaped recording for retention and honest
gaps; and, only if needed, synthetic DICOM for withdrawal/privacy behavior.
Ordinary household surveillance and clinical media are not candidate public
corpora.

Rules for using this portfolio later:

1. Map every fixture to an existing `ML-*` requirement in
   [[Reviews/2026-08-14-media-library-intake/evidence-and-requirements]] and the
   shared `MEDIA-*` requirements in [[Designs/media-library/media-infrastructure]].
   If it creates no new trace, failure or measurement, do not build it.
2. Start with creator-owned, public-domain or wholly synthetic bytes. A project
   named above is a workload teacher, not an acquisition source, partner or
   adoption claim. Reuse the consent and steward boundaries in
   [[Reviews/2026-07-29-target-communities/opportunity-map]].
3. Do not infer a new application track, media-specific Core primitive,
   milestone, public Realm or canonical profile from a useful fixture. Route a
   Core gap only through an exact failing trace and falsifier, as in
   [[Reviews/2026-08-14-media-library-intake/fixture-pressure-map]].
4. Try bounded equality, backlink, bucket/tile and paginated onchain reads
   before using The Graph for a **public derived query**. The Graph is never the
   byte server, range verifier, transform worker or private household index.
5. Preserve `UNKNOWN`, partial availability, provenance, rights and derivation
   boundaries. A successful demo is not permission to claim interoperability,
   completeness, consent, deletion or independent reconstruction.

Revisit this parking-lot entry only when Stage B needs a distinct application
fixture, a current media requirement lacks a falsifier, or the owner explicitly
chooses one workload for product exploration. The existing
[[Designs/efsv2/playable-archive-requirements|playable archive]] remains a
separate already-documented pressure test and should not be duplicated here.

### Persistent shared subjects + plural geospatial claims
*(James, 2026-08-04; prompted by the [OpenStreetMap canoeability thread](https://news.ycombinator.com/item?id=49155521))*

Use EFS as a portable claim and continuity layer for real-world things whose
source-dataset identifiers and geometry evolve. The concrete example is a
canoe map: OpenStreetMap can record legal access, but practical navigability is
subjective, seasonal, conditional, and often inappropriate as one canonical
map fact. A third-party overlay can express it, but references to OSM nodes,
ways, and relations break when features are split, merged, replaced, or
repurposed.

Keep five concepts separate in any later pressure test:

1. an immutable citation to the exact source object and version, including a
   geometry/content digest and observation time;
2. a durable shared subject for the evolving real-world place or stream reach;
3. signed, scoped observations such as legal access, practical navigability,
   difficulty, season, water level, obstruction, footprint, and evidence;
4. authored continuity claims across source replacements, splits, and merges;
   and
5. lenses that select or aggregate which authors' claims a reader sees.

Prefer the domain-native [OSMPID proposal](https://2026.stateofthemap.org/sessions/CYVSG9/)
when available. EFS should bridge exact legacy OSM references, OSMPIDs, and
other identifiers while preserving provenance and history—not create a rival
canonical map ID merely to own the namespace. EFS can validate claim shape and
authorship; it cannot automatically decide whether two changed features remain
the same real-world thing or whether a canoeability assessment is true.

Later design pressure should cover duplicate subject creation, reversible
same-as decisions, one-to-many and many-to-one continuity, claims over only
part of a geometry, time/condition scope, geospatial indexing and discovery,
completeness/absence honesty, and OpenStreetMap licensing. Candidate EFS
connections are shared TAGDEF subjects, `sameAs` / `relatedVersion` /
`supersededBy` relations, portable schemas and validators, provenance, and
lenses; all remain candidates during v2 reconciliation, not an adopted design,
milestone, or flagship use case.

Revisit during the coordinated identity/kinds/lens recut or when EFS evaluates
real-world public datasets and third-party overlays.

### A per-read diagnostic channel — "why this file?" (from vfile's `messages`)
*(James asked about [vfile](https://github.com/vfile/vfile), 2026-07-29)*

vfile (the unified/remark file object) separates a file into `value` (bytes) · `path` (location) · `data` (metadata) · **`messages` (positioned diagnostics)**. The first three map cleanly onto EFS DATA / anchors / PROPERTY. **EFS has no equivalent of the fourth**, and it needs one: [[file-browser-requirements]] **J9** asks *"two people see different winners at the same path — why this file?"*, and the read model carries `UNKNOWN` vs proven-absent, basis pinning, and fail-closed reads that all have to be explained rather than silently applied.

vfile's message shape is a usable model: `reason` + `source` (which subsystem spoke) + `ruleId` (which rule fired) + `fatal` (did the read fail closed) + `place` (where). Mapped to EFS: **source = which lens/resolver, ruleId = whiteout / revoked / unknown-basis / cycle-cap, fatal = fail-closed, place = which record or redirect hop.** A read result would carry its own explanation, so a client can answer "why this file?" and surface read grades honestly instead of quietly.

**⚠️ The distinction that matters — do not collapse these two, and do NOT add a record kind.**

- **Derived diagnostics (what this idea is about).** "This file won because lens A outranked lens B." "This read is `UNKNOWN` because basis X was unavailable." **Computed by the reader** from (records + lens + basis). Two readers legitimately compute *different* diagnostics from the same records — that is viewer sovereignty working, not a bug. So these are **not portable, not signed, and must not become a record kind.** They belong in the read result / SDK surface.
- **Authored claims (already solved — don't route here).** "This is spam." "This supersedes that." "This translation is wrong." Those are *someone's signed opinion* and EFS already expresses them: **TAG, PROPERTY, REDIRECT, WHITEOUT**, resolved through lenses.

**Therefore portable signed data does NOT need a `messages` kind**, and adding one would be a mistake on three counts: it duplicates the existing signed-claim primitives; it fights v2's deliberate collapse of 9 record kinds → 5 by adding a sixth against the grain; and signing a *derived* value is a category error — it freezes one reader's computation whose inputs vary per reader. *(Recommendation, not a ruling — the design thread owns it.)*

**What the portable/frozen layer plausibly does need is smaller than a kind:**
1. **A stable diagnostic vocabulary.** Instances aren't portable, but the *names* should be. If one implementation emits `UNKNOWN: basis-unavailable` and another emits `unknown_basis`, no cross-implementation tooling can agree on why a read failed. That's a read-surface spec concern.
2. **Honest basis/unknown metadata in exports.** An export or checkpoint (`.efs-bundle`, per [[2026-07-21-codex-arfs-ardrive-competitive-architecture]] §4) legitimately needs to say "as of basis B, these entries were `UNKNOWN`" so a recipient understands the snapshot's limits rather than reading absence as proof. That's export metadata — the one place a diagnostic crosses a trust boundary, so the vocabulary matters there most.

Threads: [[file-browser-requirements]] J9 · the read-grade / `UNKNOWN` vocabulary in the lens work · the pending lens/read **replacement spec** · SDK receipt/error/progress design (flagged as worth harvesting).

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

### Native account abstraction: enshrine verification, keep EFS authority programmable
*(James lead, 2026-08-30; [Ben Adams on EIP-8141 vs EIP-8130](https://x.com/ben_a_adams/status/2093340730068496430); primary specs: [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141), [EIP-8130](https://eips.ethereum.org/EIPS/eip-8130))*

Ben Adams argues for EIP-8141's narrower native-AA boundary: Ethereum verifies
scheme-tagged signatures and execution/payment approvals, while each account
defines what those approvals mean. EIP-8130 instead makes actors, scopes,
administrative roles, expiry, locking, sequence/replay state, and a singleton
Keystore legible to consensus. His reason for changing position is not only
flexibility: Nethermind and ethrex implemented the revised 8141 design on a
devnet, and its sender-local public-validation dependency rule is intended to
bound mempool invalidation without freezing a wallet-authority vocabulary.

**What this means for EFS:**

- It strengthens the existing EFS split between durable authorship and live,
  chain-bound authorization. Native AA may transport and verify an EFS write;
  it must not become the identity of an EFS author, the meaning of a
  `PrincipalId`, or the authority by which readers accept claims.
- 8141's signature list and account-defined composition are a plausible future
  rail for main + burner + passkey/P-256 + recovery/PQ combinations, scoped
  agent/session credentials, sponsorship, batching, and execute-then-pay. EFS
  should preserve these as wallet-policy choices rather than encode one actor,
  scope-bit, admin, or singleton-keystore model into its own permanent bytes.
- EFS cannot assume 8141 shipment, uniform public-mempool propagation, or
  cross-chain support. The current EIP-712/ERC-1271/4337/7702 paths and a plain
  EOA fallback remain the compatibility floor; chain profiles must report
  exact support instead of treating EIP status as deployed capability.
- The article exposes one concrete pressure test: can one logical EFS write
  plan preserve the same record IDs, recovered authorship, effects preview,
  and receipt across (a) legacy EOA submission, (b) ERC-4337/7702 smart-account
  submission, and (c) a disposable 8141 frame-transaction adapter, including
  separate execution and payment approvers? Any semantic drift means the
  Submitter boundary is leaking transaction mechanics into EFS meaning.

**Tracking trigger:** carry this into the wallet/action and held authority
passes when either selects a native-AA adapter or freezes signer/principal
semantics. Before then it is dated pressure evidence, not a Core requirement,
dependency, supported-chain claim, or recommendation that EFS standardize an
authority schema. Related: [[Designs/clientv2/wallet-and-actions]],
[[Designs/clientv2/identity]], [[Designs/web-client-os/ethereum-standards-and-interop]],
and the burner/multi-wallet entry above.
