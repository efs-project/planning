# Playable archive requirements for EFS v2

**Status:** draft
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[assumptions-and-requirements]], [[apps-cookbook]], [[large-file-uploads]], [[onchain-completeness]], [[read-lens-spec]], [[../clientv2/packages-and-updates]], [[../clientv2/kernel-capability-model]], [[../clientv2/shell-and-sessions]], [[../clientv2/persistence-and-sync]]
**Supersedes:** -
**Reviewers:** -
**Last touched:** 2026-07-23 - codex-gpt-5

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/requirements #topic/games #topic/content

## Mission

EFS should be pressure-tested against an open, crowdsourced archive of software that is pleasant to explore and easy to run. An ordinary user should be able to find an interesting app or game, understand what it is, click Play, and have it work without knowing about gateways, contracts, package layouts, or wallets.

This document is a product pressure test for EFS v2, not a proposal for a playable-archive subsystem. It deliberately avoids turning client behavior, archive taxonomy, or content policy into permanent protocol surface.

> **Owner status:** [[owner-decision-inbox]] N5 remains undecided. This document does not select the playable archive as the first joined-system reference app or make it a v2 launch requirement. If N5A is later adopted, the archive's first useful release should support a curated set of legally redistributable:

- Single-file and multi-file web apps and games.
- Runtime-backed packages, with one emulator path proven end to end.
- Documents, images, audio, and small videos that complement the software archive.

The long-term archive can include historical desktop software, richer emulators, bring-your-own media, and permissionless public contribution. Those are valuable pressure cases, but they are not all v2 launch requirements.

## Core Experience

The canonical journey is:

1. **Browse:** see a visual catalog with useful filters.
2. **Inspect:** open an item page with screenshots, controls, compatibility, source, and rights information.
3. **Preflight:** EFS checks the exact package generation, runtime, bytes, device support, and current policy.
4. **Play:** an explicit Play or Continue action starts the software in an EFS-owned player shell.
5. **Return:** exit cleanly to the same place in the catalog, with local progress preserved when the package supports saves.

Opening an archive item must not execute it automatically. Executable content starts only after an explicit user action.

The archive succeeds when this path feels ordinary. Verification and provenance should be available without forcing users through technical details during every launch.

## Requirement Summary

| ID | Requirement | Primary owner |
| --- | --- | --- |
| PAF-1 | Visual archive and useful item metadata | Client/content |
| PAF-2 | Reproducible package generations | Manifest/SDK; generic v2 primitives |
| PAF-3 | Verified, low-friction loading | Client/SDK |
| PAF-4 | Player shell, fullscreen, and input | Client |
| PAF-5 | Runtime isolation and capability policy | Client/security |
| PAF-6 | Saves and session continuity | Client/runtime |
| PAF-7 | Curation, rights, and playability evidence | Content/tooling/lenses |
| PAF-8 | Portable, repeatable publishing | SDK/content |

PAF-2 is the clearest known direct pressure on the frozen data model and should be satisfied with generic EFS identities, records, placement, and byte commitments. The other requirements should use versioned manifests, client behavior, tooling, and content policy unless the readiness checks demonstrate that an existing generic v2 primitive is insufficient.

## PAF-1: Visual Archive and Useful Item Metadata

The default archive view should be a visual catalog, not a raw directory listing. Folder navigation remains useful for inspection, but people should primarily discover software through cards, search, and filters.

Every published item needs enough metadata to render a useful card:

- Title and one-line description.
- Thumbnail, with a deliberate fallback when artwork is unavailable.
- A small set of useful tags.
- Package type or platform.
- Supported input methods.
- A simple availability or playability state.

The item page should add:

- Long description and optional screenshots.
- Controls and input instructions.
- Tested device, browser, runtime, and viewport compatibility.
- Author or publisher, source, version, package size, and license or redistribution status.
- Save support and known limitations.
- Current curator and playability-test information.

Thumbnails and screenshots are ordinary hashed archive files with their own source, license, and alt text. The client should render thumbnails at a consistent card aspect ratio, handle loading failure gracefully, and avoid layout shifts. Preview videos, manuals, packaging scans, and control diagrams are useful optional files, not MVP schema requirements.

Tags are an extensible content vocabulary, not a protocol enum. The initial filters should cover category, platform/runtime, input method, and whether an item is expected to work on the current device. Search, ranking, and recommendations may use an index; the underlying item, collection membership, and metadata remain independently verifiable.

The catalog must also handle its own failure states: initial loading, offline without cached data, unavailable index, empty collection, no filter results, and retry. An index failure should not become an unexplained blank screen or prevent bounded folder browsing when the underlying EFS records are available.

## PAF-2: Reproducible Package Generations

A launch must resolve to one exact, immutable package generation. That generation is described by a versioned manifest containing:

- Package identity and manifest schema version.
- Entrypoint.
- Complete normalized file closure, including one unique canonical package-relative path plus each file's identity, byte commitment, size, and content type.
- Exact runtime generation when a separate runtime is required.
- Declared capability ceilings and compatibility requirements.

The client resolves the manifest once under the active lens and policy, verifies the required closure, and launches only those locked files. It must not re-resolve live placement or channel state for individual assets during launch. This prevents mixed generations of JavaScript, WASM, runtime code, and game data.

Follow the existing package convention for releases and channels: immutable release placement plus an append-only release or channel ledger, with a PIN channel head selecting the currently recommended manifest. Older generations remain addressable, but current safety, rights, and compatibility policy may still warn or block their execution.

The generic v2 model currently describes DATA as pure identity while the package draft describes canonical manifest bytes inside DATA. This archive does not choose between those formulations, but v2 must reconcile them: a generation needs one portable name for exact canonical manifest bytes, with those bytes located and verified through generic EFS record or byte-commitment machinery.

Packages are expressed with the existing EFS kind model. This requirement does not justify a new package kind, launch row, package ABI, runtime enum, or protocol-level executability grade.

## PAF-3: Verified, Low-Friction Loading

Users should not need to know whether bytes came from IPFS, on-chain storage, or another mirror.

Required behavior:

- Single-file packages and multi-file packages both work.
- Relative scripts, styles, images, fonts, audio, video, workers, WASM, and data files resolve within the locked package generation.
- Root-relative and encoded paths cannot escape the package namespace.
- Retrieved bytes are checked against the package's commitments before use, or incrementally as defined by the generic large-file model.
- Large files can use streaming or byte ranges when the selected transport supports them.
- A failed mirror can be retried or replaced without changing package identity.
- Browse and launch do not require a connected wallet.

Before the first playable client ships, its runtime design must choose and document a package-serving topology: how a package generation receives a dedicated runtime origin, how paths map to its closed manifest, which component verifies bytes, and what works offline. A static client may need an EFS-controlled package gateway or a dedicated local/runtime host. Package code must never be served from the EFS client origin.

Path behavior must be deterministic across supported browsers. The versioned manifest format must define case sensitivity, UTF-8 and percent-decoding behavior, query and fragment treatment, dot segments, encoded separators, and directory indexes, rejecting ambiguous paths. For the first release, packages with root-relative assets should either be mounted at the root of their dedicated runtime origin or rejected during validation. Launch-critical executable bytes must verify before execution; large streamed data may verify incrementally under the generic large-file rules.

The launch UI should expose a small, truthful state model: checking, downloading, verifying, starting, waiting for input, running, blocked, or failed. It should show useful progress when known and offer cancel, retry, and expandable diagnostics.

Failures must distinguish at least unavailable bytes, integrity mismatch, unsupported runtime or device, denied capability, rights or policy block, and a package that starts but crashes. Exact HTTP headers, gateway behavior, cache layout, and transport recipes belong to the client and SDK implementations rather than the EFS protocol.

## PAF-4: Player Shell, Fullscreen, and Input

Playable software runs inside an EFS-owned shell that remains visibly distinct from app-controlled pixels.

The shell should provide stable controls for:

- Exit and return to the previous archive location.
- Restart.
- Mute or audio status when the runtime adapter supports it; legacy-direct packages may expose only their own controls or require session exit.
- Fullscreen or focused presentation.
- Controls/help when the item declares them.
- Release of captured input.

The content surface should fit its container without accidental scrollbars, preserve its intended aspect ratio, and use letterboxing when necessary. The item metadata should say whether desktop, mobile, landscape, portrait, keyboard, pointer, touch, or gamepad use has been tested.

Fullscreen is controlled by the EFS shell and entered after a user gesture. Keyboard focus and pointer lock are also explicit session transitions: the player indicates when input is captured, preserves an obvious escape path, and releases capture on exit or focus loss. In controlled and adapter-backed runtimes, EFS-owned exit and release controls remain reachable even when package input is broken, and reserved system shortcuts remain reserved. A legacy-direct frame can only promise browser escape behavior plus EFS controls outside the frame; it cannot guarantee that the parent intercepts a custom shortcut while the child owns focus.

Audio activation follows browser user-gesture rules and has a clear muted or blocked state. Player-shell controls must remain keyboard accessible, and captured input must not trap a user who cannot use a pointer.

"One click to play" means one explicit action begins preflight and launch. Browser user activation may expire while a package downloads, so a loaded game may still need a clear Start Audio, Enter Fullscreen, or Capture Pointer action. The client must present that as a normal state rather than leaving a silently muted or unfocused game.

Capability prompts should appear in context when the user reaches the action that needs them, not as an upfront permission wall. The preflight distinguishes mandatory from optional capabilities, and denying an optional capability should let the package continue when a tested fallback exists.

## PAF-5: Runtime Isolation and Capability Policy

Archive packages are untrusted executable content. They must not run on the EFS client origin or inherit ambient authority.

At minimum, executable packages have no ambient access to:

- Wallets or signing.
- EFS writes or user secrets.
- Local files other than files explicitly imported for that session.
- Undeclared external network endpoints in controlled and adapter-backed runtimes.
- Other packages' storage or the EFS client's storage.

The client uses a generation-specific isolated execution origin or an equivalent stronger sandbox. Generations do not share origin storage or service-worker authority; intentional save sharing happens only through a runtime adapter. Static previews and executable packages use different policies. Package service workers are denied by default. Trusted EFS provenance, warning, wallet, and navigation chrome remains outside package-controlled pixels; package-drawn lookalikes never receive EFS authority or trusted-chrome treatment.

The client should distinguish three practical host profiles without freezing their names into protocol:

- Controlled worker/canvas software, where input and capabilities can be mediated closely.
- Adapter-backed web or emulator runtimes, which cooperate through a versioned bridge.
- Legacy direct packages, which run in an isolated iframe with weaker guarantees.

Arbitrary legacy packages receive keyboard input directly when focused, and the parent cannot promise to mediate every browser API or reserve every custom shortcut. Their UI must say when the weaker profile is in use, keep browser/EFS escape controls outside the frame, and never expose secrets or authority to the frame.

Legacy direct execution is a compatibility runner, not a Ring-3 EFS app. The current client v2 kernel forbids iframe-hosted app logic, so v2 must either approve this isolated compatibility lane explicitly or defer legacy-direct launch. It must not silently route legacy games through the Ring-3 app cage.

Runtime profiles and capabilities are versioned client/content vocabulary. A package may declare that it needs scripts, WASM, WebGL, audio, fullscreen, pointer lock, gamepad, storage, workers, external endpoints, or local-file import, but declarations are ceilings rather than grants. The current client, user action, and policy decide what is allowed.

External network denial is structural for controlled runtimes and best-effort for arbitrary browser-native packages. The legacy-direct profile is therefore labeled as having weaker network isolation. It still receives no secrets, wallet handles, or EFS capabilities; common egress paths are blocked where practical; residual channels are reported; and attempted top-level navigation ends or suspends the session with an EFS-owned warning.

Adapter-backed runtimes need a small versioned bridge: authenticated session and version handshake, ready or structured failure, resize and focus/visibility lifecycle, pause/resume, activation-needed, shutdown, and optional save operations. Browser messaging must validate the expected origin, window or port, and session identifier on every message.

Some runtimes require browser features such as cross-origin isolation or WASM threads. The preflight should either establish the required environment or report the package as unsupported with a useful explanation. The archive requirement does not freeze a particular runtime taxonomy or browser-header matrix.

## PAF-6: Saves and Session Continuity

Save support is optional for a package, but it should be reliable and understandable when offered.

- Saves and settings are local by default and isolated by package identity, generation, runtime, and user.
- Cooperative runtimes can offer Continue or New Session, show the most recent save time, and indicate active writes.
- The player warns when known browser storage is temporary or under pressure.
- A user can reset state. Import and export should be available for runtimes where portable save files are practical.
- A package update does not silently reinterpret or destroy an older generation's save.

Portable saves require a cooperative, versioned runtime adapter. Unmodified legacy packages may only have generation-specific browser-origin storage; the client should promise only the local-data presence and clearing behavior it can observe, and must label that state as local and revocable rather than promise timestamps, export, or durability it cannot provide.

Cloud sync, on-chain saves, encrypted multi-device saves, and general save migration are later features. EFS v2 only needs to avoid preventing a clean local save namespace.

## PAF-7: Curation, Rights, and Playability Evidence

The default user should see a curated collection rather than an unreviewed firehose. EFS's lens model can select collection placement, curation, rights warnings, safety advisories, and blocks without making any curator globally authoritative.

Every byte-bearing item published in the default collection needs:

- Source and author or publisher when known.
- License or redistribution status.
- Curator attribution.
- A verified content commitment.
- A smoke-test result tied to a client/runtime version and test date.

Playability, availability, safety, and rights are separate facts. The client may derive a simple call to action from them, but EFS should not collapse them into one permanent score or protocol grade.

The content tooling should refuse to pin or deploy unreviewed or non-redistributable bytes. Metadata-only and link-only records may still describe software that EFS cannot mirror. Bring-your-own proprietary media is a future launch flow; local imports must never be silently pinned or published.

Contributors should be able to propose software, metadata corrections, artwork, mirrors, compatibility notes, and playability reports without taking ownership of the original package. For the first release, normal repository contributions plus trusted deployment are sufficient. Public review queues, duplicate resolution, moderation workflows, and contribution-state taxonomies can evolve later as content conventions and lens-filtered facts.

## PAF-8: Portable, Repeatable Publishing

The same content repository should be publishable to devnet, Sepolia, and future EFS deployments without rebuilding unchanged packages.

The publishing toolchain should:

- Validate manifests, file closure, byte commitments, content types, required card metadata, rights status, and source information.
- Pin or verify package bytes on IPFS and reuse existing valid pins when practical.
- Compare desired content with the target chain and skip unchanged records.
- Default to a read-only plan when run without arguments; transaction execution is explicit.
- Never delete or revoke content during normal sync.
- Record chain-specific deployment receipts sufficient to verify what was published.
- Run browser smoke tests for launchable items, including visible output, unexpected network requests, console failures, responsive fit, and basic input where feasible.

Stable EFS identities and manifests should survive chain redeployment; deployment receipts and current placement remain chain-specific. Deterministic CAR production, multiple mirror backends, archive export formats, and elaborate cross-chain freshness UI are useful follow-on tooling, not protocol-freeze requirements.

## Protocol Boundary

This archive should validate generic EFS v2 capabilities rather than create archive-specific permanent surface.

The existing v2 design must be sufficient for:

- Stable DATA identities and exact immutable records.
- Generic file metadata and byte commitments, including large bytes and opaque mirror references.
- Bounded folder or collection membership, placement resolution, and point reads.
- Immutable release placement, append-only channel history, and recommended-generation selection through the existing PIN channel-head and lens conventions.
- Attributable facts that lenses can select, warn on, or block.

The following remain versioned manifest, SDK, client, index, or content conventions:

- Package manifests and runtime profiles.
- Thumbnail roles, tag vocabularies, compatibility fields, controls, and rights statuses.
- Browser capabilities, player states, sandbox policy, and HTTP serving details.
- Search indexes, recommendations, and derived playability indicators.
- Seeder receipts, IPFS production recipes, and smoke-test formats.

No contract field or read method should be added for this archive unless a named acceptance test cannot be completed with the generic primitives above.

## Deferred Scope

These are important follow-on goals, not EFS v2 launch blockers:

- Broad emulator and machine-profile catalogs, including Classic Mac and other historical desktop environments.
- Bring-your-own ROM, BIOS, operating-system, installer, or proprietary game-data workflows.
- Public moderation and contribution-review applications.
- Synced saves, cloud storage, achievements, social features, and multiplayer hosting.
- Popularity rankings, recommendations, and a global full-text index as core truth.
- Required preview videos, scanned packaging, manuals, or derivative-generation provenance schemas.
- A universal archive export format or deterministic recipe for every storage backend.

EFS does not need to host every old game or application. Old, unavailable, or commonly called abandonware does not automatically mean redistributable. The archive can preserve metadata and lawful links without mirroring restricted bytes.

## Open questions

Before using this archive to justify an EFS v2 freeze or adopting N5A, answer these as tests of the generic design rather than invitations to add archive-specific features:

- [ ] Can the five-kind model give exact canonical manifest bytes one portable generation name, reconciling pure DATA identity with the body-bearing package draft?
- [ ] Can the client perform bounded reads for collection membership, ordinary file facts, mirror facts, and the exact manifest selected by the active lens?
- [ ] Can the generic large-file model verify and reconstruct every required package file, while distinguishing unavailable bytes from mismatched bytes?
- [ ] Can the general lens design select a recommended collection and generation while composing curation, warning, and block facts?
- [ ] Will v2 explicitly permit an isolated legacy compatibility runner, or defer direct iframe-hosted games to preserve the current rule that Ring-3 app logic never runs in an iframe?

If the answer is yes, the playable archive requires no additional protocol surface.

## Acceptance Tests

- A new user with no wallet sees a responsive catalog of cards with titles, descriptions, thumbnails, tags, platform/runtime, input support, and a useful playability state; loading, empty, offline, and unavailable-index states are understandable and recoverable.
- Search and filters find a keyboard-friendly web game and an emulator-backed game expected to work on the current device.
- Opening an item shows details and does not execute it; Play starts only after an explicit action and preflight.
- A multi-file web game loads relative JavaScript, CSS, images, audio, and WASM from one locked generation with verified bytes; ambiguous, escaping, encoded-traversal, and unlisted paths are rejected without touching the EFS client origin.
- During a slow or failed fetch, the player shows progress, retries another valid mirror when available, and explains the blocking problem when launch cannot continue.
- A canvas game fits its container without accidental scrollbars; fullscreen, focus, keyboard input, pointer lock, mute, and exit work; controlled runtimes have an EFS release path, while legacy frames preserve browser escape behavior and outside-frame controls.
- A slow-loading game reaches a clear activation-needed state for audio or pointer capture instead of appearing silently broken.
- An adapter-backed save-capable game can save, exit, return to the same catalog location, and continue later without sharing state with another package generation; a legacy package makes no unsupported save guarantees.
- An emulator-backed package launches a legally redistributable game with an exact runtime generation and game-data generation.
- A hostile controlled-runtime package cannot access the wallet, EFS writes, client storage, undeclared network endpoints, or trusted EFS chrome. A hostile legacy-direct fixture receives no secrets or capabilities, has common egress blocked, suspends on navigation, and reports its residual isolation limits.
- The publisher rejects unreviewed or non-redistributable bytes, while allowing a metadata-only record to remain discoverable.
- Publishing the same unchanged content twice reuses valid pins where practical and sends no second-chain transactions.

## Implementation Ownership

- **Contracts:** provide only the generic identity, record, placement, byte, and read primitives justified by the broader v2 design.
- **SDK:** parse and validate manifests, verify closures and bytes, plan idempotent publication, and produce receipts.
- **Client:** own browse/detail/player UX, package serving, preflight, runtime isolation, capabilities, input/fullscreen behavior, saves, and actionable failure states.
- **Content:** own curated manifests, thumbnails, tags, descriptions, source and rights notes, compatibility, controls, playability tests, IPFS pins, and deployment receipts.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
