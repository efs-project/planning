# Web Client / OS product constitution and roadmap

**Status:** draft — requirements and product horizons for iteration; mechanisms and release scope remain evidence-gated
**Target repos:** planning, client, sdk
**Depends on:** [[Designs/web-client-os/README]], [[Designs/efsv2/system-constitution]]
**Reviewers:** @current-v2-read-path (2026-08-14), @historical-client-architecture (2026-08-14), @web-platform-standards (2026-08-14)
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/requirements #topic/cypherpunk-os #topic/privacy #topic/app-model

## Problem

EFS needs a useful Web Client soon enough to exercise an evolving Core and
Files model, but the client is also intended to become the foundation of a
long-lived, user-owned Web OS. Optimizing only for the immediate debugger would
create a disposable UI and force later rewrites. Optimizing only for the grand
OS would make a public file link slow, fragile, and dependent on system state
that an ordinary guest neither has nor needs.

The design must preserve both truths: the smallest route should load quickly
and honestly, and every important boundary should leave room for replaceable
services, private state, identities, signing, apps, agents, additional
runtimes, and native projections.

## Product constitution

### 1. The user owns the system

The user can inspect, pin, replace, export, back up, reconstruct, and stop
using every optional service. Defaults are named policy, not hidden authority.
No EFS organization, catalog, gateway, indexer, Shell, or hosted account is
required to interpret exact public data.

### 2. A link is a first-class product entry

A person following a link to a file, folder, Project, citation, or other
resource gets a useful guest surface before accounts or OS ceremony. The route
loads the smallest trusted closure needed to resolve, verify, and present that
resource. Unrelated system state hydrates only after useful pixels appear.

### 3. The guest and OS share semantics, not startup cost

Guest, Files-write, full OS, recovery, agent, and native Drive consumers use
the same exact read context, outcome vocabulary, Files resolver, artifact
commitments, and action shapes. They may have different boot profiles and
presentation, but they may not fork truth.

### 4. Modularity is the normal case

A concern that can be replaced safely should be expressed as a versioned
interface with explicit dependencies, capabilities, lifecycle, health, and
fallback behavior. The default EFS implementation occupies a module slot; it
does not turn that slot into permanent first-party privilege.

The exception is the small conserved trust base needed to verify the boot
generation, enforce authority boundaries, render security-critical ceremony,
and recover from broken configuration. Even those components can change by
activating a new exact generation; they are not arbitrary hot-plug modules.

### 5. Authority is explicit and local

Discovery, recommendation, configuration, installation, verification,
activation, grant, execution, endorsement, and update are separate states.
Module metadata requests authority; it cannot award authority. Effective
authority is the intersection of the request, runner ceiling, client policy,
user/session grant, and current platform support.

### 6. Privacy has several independent axes

Cryptographic verification does not imply anonymity. Public records, encrypted
payloads, local-only state, capability links, identity unlinkability, network
interest privacy, telemetry, and inference-provider disclosure remain
separate. The client makes residual exposure visible and avoids architecture
that would preclude later private transports, encrypted/local profiles, or
selective disclosure.

### 7. Humans and agents are peer operators

Every official human action has a structured describe/plan/execute/receipt
path. Every structured action has an understandable human explanation.
Agents can receive any capability a human-controlled policy chooses to
delegate, including writes and administration; agents receive no ambient
authority and cannot manufacture missing approval. Human and agent sessions
observe the same basis, completeness, progress, errors, and receipts.

### 8. Reliability includes honest failure and exit

`UNKNOWN`, `PARTIAL`, stale, unavailable, conflict, policy denial, malformed
evidence, corrupt bytes, and proved absence remain distinct. Browser eviction,
module failure, upgrade failure, carrier loss, and operator death have visible
recovery paths. Immutable releases and retained data never require a forced
upgrade.

### 9. Accessibility and global use are foundations

Official surfaces use semantic real DOM, complete keyboard operation, visible
focus, touch and alternative input, reduced motion, screen-reader semantics,
native IME, bidirectional text isolation, international names, locale-aware
display, and canonical raw values beneath localization. Agents receive the
same semantic structure rather than a visual-only shadow product.

### 10. Open Web standards are the durable surface, including forward ones

Use semantic HTML, modern CSS, JavaScript and browser standards as the public
application substrate. EFS may deliberately select a forward standard before
every browser ships it; the official TC39 Signals shape is selected now through
a compatible polyfill. One lagging engine does not force a legacy application
fork. Feature detection yields the same semantic baseline, a narrow polyfill,
an explicit reduced/unsupported outcome, or a rescue reader. A standards label
still does not replace a threat model, capability contract, conformance test,
or retained migration/recovery path. Existence detection alone never proves
support; WCOS-R42's exact measured profile does.

### 11. Exact systems are shareable; local authority remains local

People can publish, inspect, compare, fork, retain and reconstruct exact OS
profiles. Opening a profile is inert. Try, Adopt, Fork, attaching personal
resources and Activate are independent explicit actions. Shared profiles carry
exact public software/configuration and requested ceilings, never effective
grants, secrets, identities, wallets, private state, machine handles, sessions
or agent mandates. One trusted configuration manager stages and selects
coherent local activation generations while code, authority and mutable data
retain separate rollback and recovery laws.

## Requirements ledger

The mechanism examples are non-binding. Acceptance consequences are the
durable part.

### Product and performance

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R1 | Public deep links are first-class. | A clean browser opens useful file/folder data without wallet, account, Commons, hosted EFS indexer, catalog, or OS boot. |
| WCOS-R2 | Useful pixels precede optional hydration. | The guest critical path contains no wallet, package manager, private store, agent runtime, full Shell, or unrelated app code. |
| WCOS-R3 | Loading cost is budgeted by boot profile. | Every module declares critical/interactive/background/explicit phases; CI records compressed bytes, request waterfalls, main-thread blocking, and route milestones. |
| WCOS-R4 | Cached profile/account state may help but never block. | Known local state can improve presentation or offer actions after first paint; missing, locked, stale, or corrupt state cannot prevent guest reading. |
| WCOS-R5 | Background loading is privacy-aware. | Prefetch and warm-up obey data-saver, battery, network, privacy, and user policy; speculative requests never become hidden telemetry. |
| WCOS-R6 | UI remains responsive while resolving. | Parsing, verification, heavy indexing, inference, and large transformations run outside the main thread where the platform permits; progress and cancellation stay interactive. |

### Direct reads and Files

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R7 | Every read has explicit context. | Chain, Core, Realm, Realm/code/admission basis, route config, root Mount, mount-local namespace/content/metadata Plans, path, finality, freshness, transport, and read-purpose are distinguishable and inspectable. Contract Lens entries (the current `ResolutionPlan` candidate) are Principal IDs, not controller keys; 64 Principals is the target profile if measurement supports it. |
| WCOS-R8 | Results are qualified, not flattened. | Values carry authority, provenance, coverage, completeness, finality, freshness, verification, typed failure, and resumption data. |
| WCOS-R9 | Absence requires proof. | `UNKNOWN`, incomplete listing, unavailable history, missing bytes, denied access, and exhausted budgets never render or cache as not-found. |
| WCOS-R10 | Directory completeness is visible. | A listing is explicitly complete at one basis only after genesis/backfill scope coverage and terminal pages for every unique Principal in the active namespace Plan, or visibly partial/unsupported with reason and continuation. |
| WCOS-R11 | Content is verified before consumption. | Executable closures verify completely before execution; passive large content releases only verified consumed ranges. Corrupt Locators are rejected without poisoning semantic identity. |
| WCOS-R12 | Route identity and host presentation remain separate. | Rich Unicode/NFC Files names are permanent identity; friendly links, exact citations, URI-safe serialization, and reversible Linux/macOS/Windows aliases do not redefine them. |
| WCOS-R13 | Raw data survives View failure. | A missing, rejected, or crashed Presentation/App never makes the underlying Record, File, Project, Release, or Artifact unreachable through trusted raw/Files surfaces. |

### MVP creation and action handling

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R14 | The MVP includes official basic File Browser writes. | After an explicit action, a user can connect a supported wallet and use ordinary File Browser controls to create a folder, create a file from local bytes, and publish a new immutable file revision, then read each result back canonically. A debug-only page is not the product. |
| WCOS-R15 | Wallet access is explicit and lazy. | Guest navigation never probes a provider or loads wallet dependencies; connection begins only after the user invokes a write-related action or an explicitly trusted boot profile requests it. |
| WCOS-R16 | Read and write semantics remain separated by adapters. | Experimental contract/profile bytes are translated behind a quarantined adapter labelled `protocolConformance=false`; the stable UI/action model does not claim frozen Files semantics. |
| WCOS-R17 | Plans precede authority. | Before signing, the client shows exact Realm, roles, Records, IDs/digests, current-head/CAS preconditions, permanence/privacy effects, artifact/network effects, calldata, fees, and failure risks. |
| WCOS-R18 | Principal identity and actor roles do not collapse into connected wallet. | Public APIs use `PrincipalId`. A mutable default/main controller account is only a UX/routing preference; semantic Principal/author, actual signer and historical authorization basis, requester app/agent, submitter/relayer, and payer remain separate even when one EOA fills several roles in the first fixture. |
| WCOS-R19 | Pending truth is explicit. | Planned, authorized, signed, queued, submitted, admitted, finality-pending, finalized, reverted, rejected, and `UNKNOWN` are separate states; only canonical read-back establishes the new visible Files result. |

### Module system and applications

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R20 | Replaceable services use versioned interfaces. | Consumers bind by interface/profile and exact module release, not by first-party import path or mutable package name. |
| WCOS-R21 | Module graphs are exact and independently inspectable. | Activation pins a complete dependency graph, exact artifacts, interface versions, configuration, requested capabilities, and selected runner. Cycles and missing required dependencies fail before activation. |
| WCOS-R22 | A module may call other modules only through capabilities. | Dependency or service calls do not transitively inherit the caller's authority; every granted port/handle is scoped, revocable, auditable, and cancellable. |
| WCOS-R23 | Configuration is user-owned but bootstrap-safe. | Local and EFS-backed profiles may bind service slots, but an extension cannot be required to retrieve itself unless it is already present in the verified boot closure or local cache. |
| WCOS-R24 | Links may nominate but not activate. | Query/fragment/module/profile input from another person cannot persist configuration, install code, grant authority, expose private state, or force full-OS boot. |
| WCOS-R25 | Security-critical authority stays conserved. | Module pixels cannot supply or control the canonical signing, permission, recovery, install, update, or high-risk authorization result. Visual imitation remains a phishing residual; high-risk confirmation uses a recognizably isolated browser/wallet/native/external surface. Replacing the conserved logic requires an explicit base-generation change. |
| WCOS-R26 | Failure has bounded fallback. | Content, Presentation, module, generation, and independent-rescue failures have distinct outcomes. Fallback follows local policy, preserves provenance, and is never silent. |
| WCOS-R27 | Updates are optional exact generations. | A returning installed client launches the locally accepted exact App release while its persisted origin state and complete verified closure remain intact, even when its channel advertises a newer release. Discovery and staging never activate it: only explicit authorized acceptance may change `LocalSelectionState.currentSelection.app`. If a full System is active, the same transaction selects a newly derived exact local profile lock, newly authorized App-scoped grant/install bindings and a compatible successor System activation so App/System cannot skew, mutate the old shared lock or silently inherit authority. Refusal is durable, and a missing/corrupt accepted release produces recovery choices rather than silently falling forward. Old retained generations remain inspectable and rollbackable subject to explicit local execution and data-compatibility policy. Ordinary Web origin trust, storage eviction/clearing, and first-visit limits remain explicit; defeating a malicious same-origin bootstrap requires an external trust anchor. |

### Privacy and local state

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R28 | No hidden telemetry. | Official modules make no analytics, crash, font, model, price, or update request unless locally enabled and inspectable. Useful operation does not require opting in. |
| WCOS-R29 | Network access is capability-scoped. | Modules receive named endpoint/transport capabilities rather than ambient fetch authority where the runner can enforce it; residual iframe/browser egress limitations remain disclosed. |
| WCOS-R30 | Guest use is identity-minimal. | Opening a public link does not access wallet providers, private profiles, local address books, credential stores, or agent memory. |
| WCOS-R31 | Private state need not become public EFS. | Drafts, journals, grants, private libraries, agent memory, prompts, model inputs, negative display choices, and imported credentials can remain local/encrypted. |
| WCOS-R32 | Browser persistence is treated as revocable. | Re-fetchable cache, unsigned work, signed-unsubmitted artifacts, grants, and keys have different protection and export requirements; storage loss is a named event. |
| WCOS-R33 | Interest privacy is stated honestly. | Integrity verification, endpoint trust, transport anonymity, request-shape leakage, public authorship, and graph linkability are displayed as separate facts. |

### Human and agent parity

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R34 | One domain action model serves UI and agents. | Every official action exposes versioned schema, description, dry-run/plan, progress, cancellation, structured errors, receipt, and recovery. UI calls the same action implementation. |
| WCOS-R35 | Agents can be delegated full product capability. | No feature is permanently UI-only; an agent with an explicit matching grant can read, create, organize, install, administer, and invoke services subject to the same policy and risk gates. |
| WCOS-R36 | Agent discovery is not authorization. | WebMCP, MCP, A2A, manifests, tool catalogs, or page metadata can advertise actions but cannot grant capabilities or alter trusted plans. |
| WCOS-R37 | Untrusted content cannot alter action structure. | Plans are compiled from trusted schemas and intent before untrusted content fills bounded data slots; content cannot add, reorder, or escalate effects. |
| WCOS-R38 | Agent sessions are observable and governable. | Sessions have named requester identity, capabilities, budgets, data taint, network/inference providers, pause/revoke, invocation log, and locally retained receipts. |
| WCOS-R39 | Local inference is possible without becoming mandatory. | Inference providers are replaceable; model weights are exact lazy artifacts; remote fallback is explicit; semantic correctness does not depend on WebNN/WebGPU availability. |

### Accessibility, compatibility, and exit

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R40 | Official surfaces target WCAG 2.2 AA. | Automated and manual keyboard, screen-reader, zoom, focus, target-size, contrast, reduced-motion, and alternative-input suites gate releases. |
| WCOS-R41 | International names remain exact and usable. | Strict UTF-8 and NFC canonical Files names, bidi isolation, native IME, RTL/CJK, combining characters, confusable warnings, URI-safe serialization, reversible host aliases, and locale-independent identity are tested. Exact Unicode tables/validators remain engineering evidence until frozen. |
| WCOS-R42 | Browser support is explicit. | Chromium, Firefox, Playwright/automation WebKit, real desktop Safari, real iOS Safari, Android and representative desktop/mobile behavior are distinct measured profiles. Automation WebKit supplements but never substitutes for a Safari/iOS product claim. Emerging APIs have a measured semantic fallback, reduced/rescue path or clear unsupported result; existence detection alone is not conformance. |
| WCOS-R43 | Rebuilds do not require original services. | Clearing all derived stores reconstructs exact public results from named Realms and carriers; local/private data has export/restore and migration checks. |
| WCOS-R44 | Organizational death is a fixture. | The client generation, exact modules, plain files/manifests, and documentation can be pinned and used after every EFS-operated domain, catalog, gateway, and update service disappears. |

### Standards-first application foundation

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R45 | Durable application boundaries are Web standards and plain data. | Routes, component APIs, actions, Worker/module messages, storage and release metadata do not expose Lit, Web Awesome, Vite, package-manager, Signals-watcher or framework objects. Replacing a tool/library leaves those contracts intact. |
| WCOS-R46 | TC39 Signals are the one in-process reactive state model. | Use the official proposal shape through an exact compatible polyfill until native. Computed state is pure; effects own cancellable I/O/render/checkpoint work; only validated plain data crosses persistence, Worker, capability, Wasm or authority boundaries. No competing EFS global store is introduced. |
| WCOS-R47 | Web Components are the reusable UI boundary. | EFS components expose semantic custom-element properties, attributes, events, slots/parts and native form/accessibility behavior. Plain DOM or Lit may implement an element internally without changing consumers. |
| WCOS-R48 | EFS owns its design language and critical shell. | Semantic `--efs-*` tokens, native landmarks, responsive layout, icons, focus and security chrome remain usable without a vendor design system. Web Awesome Core is a replaceable control pack; `<wa-page>` is a benchmark or optional Session Shell behind an EFS adapter, not Kernel/root ABI. |
| WCOS-R49 | One adaptive product serves desktop, mobile and installed windows. | Native Grid/container queries, logical properties, intrinsic/dynamic sizing, safe areas, input-capability queries and preference media features adapt one route/action model. Width or user-agent labels never imply authority or input capability; 320 CSS px/400% zoom remains operable. |
| WCOS-R50 | The static client is installable but never install-dependent. | A standards manifest gives stable-origin desktop/mobile installation metadata. Guest reading and supported foreground writes pass with no installation, Service Worker or retained browser state. Exact-CID releases do not pretend to share origin identity, grants or stores. |
| WCOS-R51 | Online and offline outcomes are explicit. | Offline-ready shell, complete verified retained resource, stale/partial cached evidence, local draft, signed queued action and unsupported network operation remain distinct. Service Worker/cache are acceleration; journal/private stores have versioned migration, export and recovery before an offline-authoring claim. |
| WCOS-R52 | Internationalization is an application contract. | BCP 47/Unicode/ECMA-402 locale preferences, document `lang`/`dir`, versioned full-message catalogs, immutable locale packs, bidi/IME discipline and authenticated-text provenance exist from the first slice. Locale output never changes protocol IDs, signatures, canonical order or equality. |
| WCOS-R53 | Browser/app lifecycle interruption is normal. | Late async results cannot overwrite a newer route/action; useful drafts checkpoint incrementally; multi-tab update/journal coordination survives termination; no correctness depends on `unload`, Worker memory or an exact background schedule. |
| WCOS-R54 | Forward capabilities fail honestly. | Modern standards can be required without designing down to the slowest engine. Each conditional API has measured support and a contained fallback, explicit `UNSUPPORTED_WEB_PROFILE`/reduced result, or reachable rescue; no silent misrender or authority weakening is accepted. |

### Shareable systems and portable execution

| ID | Requirement | Acceptance consequence |
|---|---|---|
| WCOS-R55 | Exact and follow system-profile links are different products. | An exact link pins one publisher-qualified authored profile occurrence and canonical `SystemProfileLockId` containing the nominated exact App/Boot, complete dependency/realization graph and platform mapping. Mutable Locator/advisory/availability evidence stays in non-laundering snapshots. A follow read returns either a resolved receipt with exact candidate or an unresolved partial/equivocal/backward/unknown result. Paging and later plans pin a resolved candidate; a changed head requires a new diff only when the plan explicitly carries a currentness precondition. Neither link silently changes class or candidate. |
| WCOS-R56 | Shared profiles enter inert inspection. | Opening a profile fetches only bounded trusted metadata/evidence pages through selected Reader policy. Passive showcase assets auto-load only from retained bytes or policy-approved carriers; contacting a profile-nominated carrier requires explicit privacy/size disclosure and `Load media`. Inspection executes no profile code, probes no wallet/private store, grants nothing and does not fetch a full executable closure merely to paint. |
| WCOS-R57 | Inspect, Try, Adopt, Fork, resource attachment and Activate are separate operations. | Every transition has its own typed plan, effects, progress, receipt, cancellation and recovery. No button, URL, catalog or agent suggestion implicitly performs the next transition. |
| WCOS-R58 | Configuration resolution is deterministic and inspectable. | Typed inert recipes consume exact `ResolvedPackageSetId`s and package-owned receipt values/references (or digests only after canonical receipt bytes exist), then resolve under exact lock schema/composition semantics, platform and Realm/basis inputs. Evaluator implementation/toolchain stays receipt evidence rather than lock identity. Every effective field preserves definition/merge provenance; two conforming evaluators produce the same canonical `SystemProfileLockId` or the format cannot freeze. Package catalog/source policy remains owned by its package resolver receipt. |
| WCOS-R59 | One local coordinator selects a coherent system. | Activation stages complete exact closures and new state/migration outputs, then one installation-scoped IndexedDB `LocalSelectionState` atomically records the accepted App and optional exact System activation/install-binding/handler graph as `BOOTING`. Broker-mediated runners receive only bounded read/COW health leases and ordinary leases begin after `HEALTHY`; trusted same-origin App/Boot code is TCB and remains ambient-effect-unconfined unless a separately proven isolation profile is used. New navigations see activation progress, not the candidate. Post-start failure restores predecessor selection when possible but never claims to undo remote effects. App and System views are projections, not separately committed pointers. Crash recovery yields old coherent, new coherent or explicit recovery—never mixed slots or App/System skew. |
| WCOS-R60 | Shared software, effective authority and mutable state have different identities. | Public profiles and `PackageHandoff`s exclude grants, secrets and private state. A recipient begins with empty `GrantDecisionGeneration` and fresh state; identical bytes, same publisher, update or fork never causes silent inheritance. A local exact profile lock may be tried and activated without publication; only a separate Publish plan creates public authored identity. Expiry/revocation is monotonic and checked live, so rollback cannot resurrect old authority or handles. |
| WCOS-R61 | The configuration manager survives candidate failure. | Inspect, diff, permission/migration ceremony, activation, rollback, GC, repair and export remain reachable from conserved System Chrome/recovery even when the candidate Shell/profile cannot boot. |
| WCOS-R62 | Rollback and retention are user-owned. | Current, last-healthy, every rollback candidate, both pending tuples, session, migration, outbox, revocation tombstone and user-pinned roots remain explicit with their transitive closures. A Worker update supports every rooted App or separately discloses removal/export. Code/config rollback never silently reverses data; complete exports reconstruct without publisher, catalog or EFS-operated domains. |
| WCOS-R63 | Core Wasm and WIT-shaped interfaces are foundational for portable non-DOM modules. | The preferred service lane verifies exact Wasm/component bytes, runs off-main-thread with explicit imports/budgets, targets the Component Model through a replaceable adapter, and grants only named WASI/EFS resources. Native Web Shell/Files paths incur no mandatory Wasm boot cost. |
| WCOS-R64 | Wasm portability and safety claims remain scoped. | Each exact `RunnerRealization` pins canonical component, WIT world, feature/WASI profile, platform adapter and derived representation closure without confusing canonical and generated bytes. Wasm supplies bounded module memory access and explicit imports but does not claim provenance, universal determinism/performance, DoS immunity, host-origin protection or automatic authority. |
| WCOS-R65 | Modern-Web guidance is a pinned implementation gate, not product authority or runtime. | Every applicable Web contribution records the exact accepted guidance identity and match/no-match, primary spec/proposal, feature-policy and measured profile result, native-before-library decision, overrides and relevant accessibility/performance/privacy evidence. The EFS forward Web Profile—not a guide's Baseline default—selects standard, limited or experimental capabilities and their full/reduced/unsupported/rescue behavior. The required guidance/evidence closure is retained offline, telemetry-disabled, deliberately refreshed and absent from shipped bytes, runtime correctness and guest network traffic; external discovery references remain non-gating. |

## Feature horizons

| Horizon | Included | Explicitly excluded or deferred |
|---|---|---|
| **MVP vertical** | Fast static guest file/folder links; explicit route/basis; honest complete-or-qualified listing; exact file detail; verified byte fallback; trusted safe preview/download; raw provenance; explicit lazy wallet connection; uniform `PrincipalId` plus separate actual signer; ordinary controls to create a folder, create a file from local bytes, and publish a new immutable revision; plan/sign/submit/read-back; human and structured-agent invocation; standards-first Signals/Web Component application skeleton; semantic native responsive shell; WCAG 2.2 AA/global-i18n architecture with one complete built-in baseline/recovery locale plus conformance packs; static manifest/install metadata; correctness with Service Worker and retained state absent | General accounts, automatic wallet detection, production/frozen write guarantees while contracts remain candidate-stage, certified arbitrary multi-Principal FilesRouter semantics, rename/move/copy/delete, global search, private folders, offline authoring/sync claims, production translations beyond reviewed complete packs, package install, third-party executable modules, Arcade Play, full Shell, native mounts |
| **Near-term Web Client** | Rename/move and delete/whiteout after semantics mature; wallet and smart-account adapters; generation-safe PWA offline shell and exact retained-resource replay; first complete additional production translations plus verified inert installable/updateable language-pack generations; verified media ranges; folder Presentations; Arcade detail/Play; package consumption; local settings and handler bindings; first private overlays; read-only exact/follow system-profile Inspector and metadata adoption/export | General-purpose multi-user OS, automatic/forced updates, background sync without proven recovery, unconstrained runners, shared-profile execution |
| **Personal OS foundation** | Journal/outbox; encrypted local/private state; identities and recovery; signer broker; permission center; exact profile recipes/locks; disposable Try; System Configuration Manager; state branches; install and system-activation generations; rollback/GC/export; Session Shell; themes/locales/fonts; storage/sync/retrieval modules; structured agent sessions; first Core-Wasm/WIT service worlds | Claims that browser storage is durable, that one browser sandbox solves every adversary, or that another person's profile can supply local authority |
| **Long-term extensible OS** | Plural Shells/modes; mature catalog-installed modules; Component Model/WASI browser and native adapters; additional iframe/native/service runners; local inference; agents/automation; private credentials; Git/Forge, Media, Arcade, Nanda, EAP applications; Linux/macOS/Windows Drive adapters; public exact/follow profile galleries and format-compatible hardened launchers | A canonical operator, forced catalog, forced upgrade, universal safety badge, ambient POSIX/WASI, or one permanent implementation language/runtime |

## Staged roadmap

The sequence is designed to learn without freezing temporary Core or browser
mechanisms.

### Slice A — fixed guest read fixture

Prove clean-browser nested navigation, exact route/basis, complete directory
enumeration or honest qualification, corrupt-primary rejection, verified
fallback, safe rendering, provenance, accessibility, Unicode, and cache-free
reconstruction. This is the performance and semantic baseline.

### Slice B — contract bring-up inside the official File Browser

Add the ordinary `New folder` control against one same-Realm,
single-Principal development fixture. Start with an empty directory so the
first disposable test exercises Object, authorship, admission, charter/name
Bindings, CAS, selection, indexing, and read-back before byte upload. The
debug inspector may expose raw plans, but it is not a separate substitute UI.

The first adapter may publish valid generic Core state without claiming
Files-level routed precondition certification. Its UI and receipts must say
`EXPERIMENTAL_DIRECT_CORE`, `protocolConformance=false`, and
`filesPreconditionCertified=false`. A fresh browser then opens the exact link
with no wallet and sees the same canonical result.

### Slice C — official basic File Browser writes

Add `New file`/upload and `Publish revision` after one explicit content carrier,
Locator, commitment, cleanup boundary, and verified read-back profile passes.
Use the uniform `PrincipalId` action surface, keep the mutable default account
separate from the actual signer, and accept canonical rich Unicode/NFC names.
This slice, together with A and B, is the MVP floor.

### Slice D — passive media and first optional executable module

First add verified ranges for large passive content without weakening
whole-closure verification for executable artifacts. Then use Arcade as the
first concrete runtime pressure test: inert Project detail, exact Release and
closure, explicit Play, complete verification, one bounded legacy HTML
profile, teardown, and no ambient wallet/EFS capability. Do not make Arcade
part of Files correctness.

### Slice E — personal OS promotion

Promote the pinned guest context into local/private state, journal/outbox,
identity/signing, package generations, Session Shell, and agents. Introduce the
trusted System Configuration Manager, exact profile generations, fresh
state/grant attachments, one coherent local selection tuple and rollback/export.
Add each service behind a measured interface rather than replacing the guest
stack. A read-only profile Inspector may arrive earlier, but Try/Activate are
not prerequisites for the Files MVP.

## Development venue and repository direction

Sepolia is the first development Commons because it is the active, near-free
shared venue. No guest-read or Core-correctness path may require it, and this
choice does not select a permanent or canonical Commons venue.

The later repository transition is to rename legacy repositories to `*-v1`
and reclaim `contracts`, `sdk`, `webclient`, and `drive` for active v2. That is
direction, not authorization. Repository creation/renaming and import moves
wait for an explicit, collision-safe plan coordinated with active SDK work.

## Product success measures

- A stranger can open an exact public folder, understand whether it is
  complete, and download a verified file without learning EFS ceremony.
- A user can create one folder, one file, and one immutable revision through
  ordinary File Browser controls, inspect every exact effect and signature,
  observe admission, and reproduce the result from a clean guest browser.
- Optional services contribute zero code and zero network requests to routes
  that do not request them.
- Replacing one retrieval or Presentation module does not change the pinned
  semantic result or effective grant decisions.
- A human and an authorized agent can complete the same supported operation
  through one action implementation and receive equivalent receipts.
- Turning off every EFS-operated service leaves exact public reads and retained
  modules reconstructable through named replacements.

## Explicit non-goals

- Shipping a conventional cloud Drive backed by a mandatory EFS server.
- Treating the initial proposal-bound wallet adapter as a stable or
  Files-certified product write API.
- Loading a full desktop metaphor before showing linked content.
- Making every internal helper independently hot-swappable.
- Allowing a public EFS configuration path or query string to execute code or
  expose private state without local review.
- Claiming anonymity, durable browser storage, network denial, or universal
  sandbox safety without measured evidence.
- Giving agents ambient authority or forcing them to operate by screenshots
  and brittle DOM automation.
- Selecting a permanent repository name, package manager, UI library, runner,
  inference API, wallet connector, or module schema before evidence and
  authorization.

## Open questions

- [ ] Determine the smallest wallet-owned route provisioning flow that makes
      official writes visible under immutable namespace/content Plans without
      a client-only ambient Lens.
- [ ] Decide whether rename/move/delete belongs in the first release after
      create folder, create file, and publish revision are measured.
- [ ] Determine where a Principal's mutable default/main account preference is
      stored and synchronized without making it identity or leaking a private
      controller set.
- [ ] Define evidence for moving from `EXPERIMENTAL_DIRECT_CORE` to a
      Files-certified routed write profile.
- [ ] Validate which human risk checkpoints an owner may safely delegate to an
      agent mandate without creating an ambient automation path.
- [ ] Establish measured release targets for critical-path bytes and time on
      the agreed device, carrier, and Realm matrix.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred with links.
- [ ] `**Target repos:**` confirmed.
- [ ] `**Depends on:**` designs promoted or the dependency risk explicitly
      accepted.
- [ ] No `<!-- AGENT-Q: -->` markers remain.
- [ ] Each WCOS requirement has a fixed acceptance test or named follow-up
      evidence gate.
- [ ] At least one `#status/review` round receives another agent or human
      comment.
