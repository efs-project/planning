# Standards-first Web application technology foundation

**Status:** draft — owner-directed product posture plus dated implementation recommendations; no repository, dependency installation, or product implementation is authorized
**Target repos:** planning, client, sdk
**Depends on:** [[Designs/web-client-os/README]], [[Designs/web-client-os/product-constitution-and-roadmap]], [[Designs/web-client-os/architecture-and-modules]], [[Designs/web-client-os/system-profiles-and-generations]], [[Designs/web-client-os/privacy-and-agents]]
**Reviewers:** @web-platform-standards (2026-08-14), @historical-client-architecture (2026-08-14), @current-v2-read-path (2026-08-14)
**Last touched:** 2026-08-15

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/web-platform #topic/pwa #topic/i18n #topic/accessibility #topic/performance #topic/wasm #topic/wasi

## Decision frame

James supplied the following product direction on 2026-08-14:

- design for a roughly 50-year maintenance horizon by making open Web
  standards—not a fashionable application framework—the durable surface;
- use modern and forward Web standards even when a lagging browser has not yet
  implemented them; one current iOS/Safari limitation does not veto the
  architecture;
- treat the official TC39 JavaScript Signals proposal and its polyfill as the
  application state primitive now, on the expectation that the API becomes
  JavaScript;
- use Web Components and seriously evaluate Lit and Web Awesome rather than
  inheriting or rejecting either by taste;
- build one sophisticated dynamic SPA that is installable on desktop and
  mobile, works online and offline at explicitly qualified levels, adapts to
  screen/window/input conditions, and has internationalization and
  accessibility in its foundations; and
- preserve the static SPA and IPFS/static-host deployment requirement.

James additionally directed on 2026-08-15 that WebAssembly, WASI and related
standards be treated as foundational, safe and recommended tools for portable,
performant Web code where appropriate. EFS interprets that as selecting Core
Wasm and WIT-shaped explicit interfaces for portable non-DOM modules, targeting
the Component Model through replaceable adapters, and granting named WASI
interfaces selectively. It does not mean ambient POSIX, direct DOM authority,
or rewriting the native Web Shell and Files path in Wasm.

“Fifty years” is a dependency and interface strategy, not a promise that an
unchanged 2026 binary or toolchain will run everywhere in 2076. HTML, CSS,
ECMAScript, URLs, HTTP, accessibility semantics, and the Web's compatibility
contract are the longest-lived foundation available to this product. EFS must
still retain source, exact builds, migration paths, rescue artifacts, and the
ability to replace tooling.

This direction changes the earlier neutral mechanism inventory. The Web
platform boundary, Signals model, custom-element boundary, installability,
responsive behavior, offline/online state model, and global-use requirements
are now **product-selected direction**. Lit, Web Awesome, Vite, exact packages,
and exact versions remain **dated replaceable implementation recommendations**
until an authorized repository experiment and dependency review proves them.

## Recommended foundation at a glance

| Layer | Working selection | Permanence posture |
|---|---|---|
| Browser ABI | semantic HTML; modern CSS; ES modules; DOM events; Custom Elements, Shadow DOM, slots, CSS Parts and `ElementInternals`; Fetch, Streams, Workers and standard storage | durable standards-owned product surface |
| Reactive state | [TC39 Signals](https://github.com/tc39/proposal-signals) API and official-compatible polyfill until native | owner-directed future-standard surface; no home-grown global store |
| Component renderer | plain DOM for Boot/rescue and very small one-shot elements; [Lit](https://lit.dev/docs/) inside nontrivial EFS custom elements where the fixed benchmark earns it | private replaceable implementation, never public ABI |
| Control library | selectively imported, pinned, self-hosted [Web Awesome Core](https://webawesome.com/docs/) behind EFS components/tokens | replaceable control pack; no CDN, autoloader, ambient icon fetch, or Kernel dependency |
| Application layout | EFS-owned semantic light DOM and native CSS Grid/container-query shell | durable product-owned shell contract; `<wa-page>` remains a benchmark/optional Session Shell implementation |
| Design language | EFS semantic tokens in the [DTCG token format](https://www.designtokens.org/tr/2025.10/format/) compiled to `--efs-*`; native HTML semantics and EFS icons | product-owned; vendor adapters map inward |
| Authoring language | strict TypeScript constrained to erasable JavaScript syntax; runtime validation at every untrusted/cross-realm boundary | replaceable development evidence; emitted standards JavaScript is the runtime |
| Builder | [Vite 8](https://vite.dev/blog/announcing-vite8) with relative assets, explicit app/rescue/Worker entrypoints, capability-aligned splitting, minimal plugins and EFS-owned release manifests | replaceable build tool, absent from runtime/public contracts |
| Delivery | one static hash-routed build; ordinary HTTPS, stable-origin IPFS/DNSLink, exact CID-subdomain release, local loopback and independent rescue profiles | no application server required for correctness |
| Installed/offline profile | Web App Manifest plus a generation-safe Service Worker, Cache API, IndexedDB and optional OPFS when their separate acceptance gates pass | install/offline enhancement; guest read and foreground write never depend on it |
| Portable service modules | Core WebAssembly in dedicated Workers; WIT-shaped interfaces; Component Model target through pinned browser adapters; selectively granted WASI/EFS resources | owner-directed foundational lane; exact WIT worlds, feature/WASI profiles, adapters and toolchains remain evidence-gated |
| Global use | BCP 47, Unicode, ECMA-402 `Intl`, versioned message catalogs, logical CSS, bidi/IME discipline and WCAG 2.2 AA | foundation from the first slice, not later translation polish |

The intended engineering posture is **no application framework**, not **no
libraries**. EFS should not recreate a virtual DOM, template language,
component lifecycle, router, state store, form system, or design system as one
private framework. It should combine small replaceable libraries where they
lower total complexity while keeping every durable boundary in plain standards
and versioned data.

## Application state and data flow

### Signals are the in-process state primitive

Use the official proposal's `Signal.State`, `Signal.Computed`, and watcher
semantics. Until browsers implement them, load one exact audited polyfill that
matches the selected proposal revision. A proposal-revision adapter is allowed;
a second EFS-specific observable/store abstraction is not.

The state graph follows these rules:

1. `Signal.State` holds current in-memory facts such as the parsed route,
   selected resource, visible pane, locale, progress, and action state.
2. `Signal.Computed` derives pure values such as breadcrumbs, capability
   availability, localized view models, effective layout mode, and button
   enablement. A computation performs no fetch, storage write, signing, or DOM
   mutation.
3. Effects/watchers are owned adapters. They initiate cancellable I/O, render
   a bounded DOM surface, synchronize a permitted URL field, or checkpoint
   explicitly durable state.
4. Async work carries an `AbortSignal` and route/action generation. A late
   result from an obsolete route or plan cannot commit to the live graph.
5. Cycles, effect re-entry, unbounded fan-out, and per-row watcher explosions
   fail development diagnostics and stress fixtures.

Signals never cross a durable or authority boundary. URLs, Worker messages,
capability ports, module handoffs, storage, exports, action plans, receipts,
and Wasm imports use validated plain versioned data. Signal graphs, watchers,
DOM nodes, class instances, closures, wallet providers, and live handles are
not serialized as product truth.

### State classes remain distinct

| State class | Examples | Authority and lifetime |
|---|---|---|
| URL/session ingress | chain, Core, Realm, path, requested locale/view | hostile input; session-scoped until decoded and pinned; cannot persist grants/configuration |
| Resolved immutable snapshot | `Resolved<File>`, exact basis, provenance, byte verification | Reader-owned qualified fact; replace atomically when context changes |
| Volatile interaction | open pane, focus target, selection, draft form fields, progress | in-memory Signals; recoverable or deliberately ephemeral |
| Durable local | locale/theme choice, trusted route defaults, journal, grants, retained release metadata | versioned plain records with explicit migration/export/recovery |
| Public/synced | admitted Records, Bindings, artifacts and exact citations | protocol/artifact semantics; never inferred from local UI state |

An untrusted link may request a nonpersistent locale, layout, or presentation
hint after validation. It may not activate a module, open private state,
persist a profile, select a signer, broaden network access, or trigger a write.

### Navigation and lifecycle

The correctness router remains `URL`/`URLSearchParams` plus a hash route so the
same build works without server rewrites. Back, forward, copied links, refresh,
and a new clean browser reconstruct the same route inputs. History entries
store only small serializable navigation state; canonical resources remain in
the URL/read context.

The [Navigation API](https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigation-api)
and [View Transitions](https://www.w3.org/TR/css-view-transitions-1/) are
forward enhancement profiles. They may improve interception, focus/scroll
restoration, continuity, and motion, but a missing implementation preserves
the same hash-route result. Reduced-motion policy can remove every decorative
transition.

Do not rely on `unload` or an always-running page. Browsers freeze, discard,
restore from back/forward cache, terminate Workers, and kill installed windows.
Checkpoint valuable drafts and journals incrementally; respond to visibility,
pagehide, pageshow and storage lifecycle as hints, not sole commit points. A
restored document revalidates its generation, route, basis freshness, ports,
and action state before enabling authority-bearing controls.

Multiple tabs/windows coordinate update and journal ownership with
`BroadcastChannel` and, where available, Web Locks. Coordination is not the
transaction: IndexedDB transactions, action IDs, CAS/preconditions and
idempotent replay establish correctness when a tab crashes or an API is absent.

## Components, design language, and application shell

### Durable custom-element contract

EFS-owned reusable UI exposes autonomous custom elements with:

- versioned semantic properties/attributes containing plain data;
- composed, documented `CustomEvent`s for user intent and progress, never raw
  signer/storage/network objects;
- named slots for composition and CSS Parts only where stable external styling
  is intentional;
- form participation through native form semantics and `ElementInternals`
  where applicable;
- deterministic upgrade/disconnect behavior and no network work in a
  constructor; and
- semantic light DOM for page landmarks and security-relevant text that must
  remain intelligible to accessibility tools and rescue modes.

The interface is `efs-*`, ordinary HTML, DOM events and plain data. It never
mentions Lit controllers, `wa-*`, a Vite chunk name, Signals watcher objects,
or framework context. Replacing the internal renderer must not change Kernel,
route, storage, module, capability, or action schemas.

The custom-element registry is not a package/runtime authority: a definition
cannot be replaced within one JavaScript realm, and untrusted markup must never
cause registration or import. One exact BootGeneration owns the reserved
`efs-*` names. A breaking element contract receives a new explicit interface
version/name or a whole compatible generation, not an attempted live
redefinition. Third-party modules render in their selected runner or request
host-owned presentation surfaces; they cannot claim an `efs-*` name or inject
arbitrary definitions into trusted System Chrome.

Use native elements before creating a custom one: links, buttons, inputs,
selects, textareas, forms/constraint validation, progress, details/summary and
`<dialog>` carry durable semantics and input behavior. The
[Popover API](https://html.spec.whatwg.org/multipage/popover.html), `inert`,
invoker commands and
[CSS anchor positioning](https://www.w3.org/TR/css-anchor-position-1/) may
implement richer forward profiles when their exact interaction/accessibility
fixtures pass; a missing enhancement falls back to the same host-owned action,
not custom keyboard semantics invented in domain code.

CSS is a product runtime, not generated component JavaScript. Use cascade
layers for reset/tokens/base/components/overrides, native nesting and `@scope`
where the selected profile supports them, custom properties for themes, and
Shadow DOM only when encapsulation improves the component without hiding
necessary semantics. CSS-in-JS, runtime utility generation and vendor global
resets stay out of the initial foundation.

### Where Lit earns a place

Lit is small, standards-aligned, renders real DOM, and implements custom
elements rather than replacing them. Its [Signals integration](https://lit.dev/docs/data/signals/)
provides a contained bridge to the selected state model. It earns a default
place **inside nontrivial owned components** when the alternative would create
EFS-specific template escaping, keyed-list reconciliation, reactive lifecycle
or repetitive DOM bookkeeping.

It does not enter:

- the inline resolving frame or independent rescue baseline;
- Protocol/Reader/Files/action packages;
- public component or module interfaces;
- persistent state, URL grammar, messages or release manifests; or
- a simple component whose native implementation is smaller and clearer.

The Minimal Viewer is the decision fixture: implement the same custom-element
contract with direct Signals-to-DOM effects and with thin Lit/Signals. Choose
per entry chunk using transferred bytes, parse/evaluation and render cost,
focus/accessibility behavior, unsafe-HTML surface, code volume and maintenance
review. The architecture accepts either result without changing an interface.

### Web Awesome and EFS design ownership

[Web Awesome Core](https://webawesome.com/license) is MIT, Web
Component-based, self-hostable, broad enough to avoid rebuilding every menu,
dialog, form and tree control, and has an accessibility-oriented component
contract. It is the current best control-library candidate. It does not become
the EFS design language or an accessibility certification.

Rules for use:

- pin one reviewed release and import individual Core components; never use a
  CDN, runtime autoloader, remote theme kit, unbounded icon library, or remote
  font;
- replace the current default icon library before components load: Web
  Awesome's [icon guidance](https://webawesome.com/docs/components/icon/)
  allows self-hosting, while its default library may otherwise contact the Font
  Awesome CDN;
- wrap or directly consume a component only in presentation packages. Kernel,
  routes, manifests, configuration and modules know no `wa-*` name;
- EFS owns semantic tokens (`--efs-surface-*`, `--efs-text-*`,
  `--efs-accent-*`, spacing, type, focus, density, radii, elevation, motion,
  pane geometry and target size). One scoped adapter maps them to `--wa-*`;
- use native links/buttons and a small inline EFS icon set for resolving,
  recovery, open, download, close and other guest-critical controls;
- do not adopt Web Awesome Native Styles as the global document reset. EFS owns
  page typography, landmarks, layout, safe-area behavior and focus treatment;
- synchronize component `lang`/`dir` and Web Awesome's internal translations
  with EFS locale state, while retaining a separate application message system
  as its [localization documentation](https://webawesome.com/docs/localization/)
  requires;
- validate each component with EFS keyboard, accessibility-tree, touch, RTL,
  forced-colors, zoom and failure fixtures; and
- Pro-only assets/components, if ever considered, require a separate license,
  exit and fallback decision and cannot be required for direct reading.

#### Current control-pack comparison

Primary-source review on 2026-08-14 found no alternative that clearly beats
Web Awesome Core for EFS's provisional default, but it identified useful
challengers rather than granting Web Awesome incumbency:

| Candidate | Current evidence and EFS use |
|---|---|
| **Web Awesome Core** | Active MIT Lit-based project with per-component ESM/self-hosting and an explicit, non-binary accessibility posture. Best current balance of finished controls, selective use, EFS familiarity and styling freedom; remains provisional. |
| [Fluent Web Components v3 / FAST](https://github.com/microsoft/fast) | Strongest non-Lit challenger. Stable v3 supports direct/async definitions, extracted CSS, declarative-shadow templates and hydration, but the control release is young and brings Fluent visual/token coupling. Benchmark separately from the FAST runtime. |
| [Lion](https://github.com/ing-bank/lion) | Best white-label/forms/i18n/design-ownership benchmark. Active MIT/Lit, granular and behavior-focused, but intentionally leaves most finished visual design to EFS. |
| [Spectrum Web Components](https://github.com/adobe/spectrum-web-components), [UI5 Web Components](https://github.com/UI5/webcomponents), and [Vaadin](https://github.com/vaadin/web-components) | Serious accessibility/global/complex-control comparators. Their Adobe, SAP or Vaadin design/runtime ecosystems and, depending on the set, mobile or commercial-Pro constraints make them weaker default fits. |
| [Material Web](https://github.com/material-components/material-web) and [Shoelace](https://github.com/shoelace-style/shoelace) | Do not newly adopt: Material Web is maintenance-only, and Shoelace is archived in favor of Web Awesome. Retain as lineage/size/theming evidence. |

The default control-pack bakeoff is Web Awesome versus Fluent WC v3 versus
Lion on the same forms, dialog/drawer, menu, tabs/tree, tooltip/toast and Shell
fixture. Measure exact self-hosted transfer/module graph, parse/compile,
interaction, no-network behavior, form semantics, keyboard/AT, zoom, forced
colors, reduced motion, RTL/CJK/expansion and coarse-pointer mobile. Falsify Web
Awesome as default if a challenger passes without vendor leakage or correctness
loss and lowers cold transfer plus parse/compile cost by a provisional 25%, or
if Web Awesome requires Pro for a launch-critical control or fails a key
form/accessibility/mobile/globalization fixture.

#### EFS design-language contract

Author tokens as versioned semantic data using the DTCG format, then compile
deterministic CSS custom properties and any typed design tooling. Token families
cover at least surface/text/border/status color roles, typography, spacing,
density, target size, focus, radii, elevation, motion, pane geometry and
content measure. Components consume roles such as `--efs-text-danger`, never a
hard-coded palette value or a vendor token.

Theme packs are inert exact data/assets with schema, compatibility, provenance,
license and contrast/coverage evidence. They may select color, type, density,
motion and ordinary layout values within their declared profile; they do not
execute code, grant capabilities, replace semantic names, suppress visible
focus/status, change action meaning or control conserved authority ceremony.
System Chrome retains a recognizable protected focus/authority/error treatment
even when the surrounding Session Shell is highly customized.

The same logical component works in light/dark, forced-colors, increased
contrast, reduced motion, comfortable/compact density and RTL without branching
domain code. Brand and appearance are replaceable; component semantics and
action schemas are not.

Maintain a static, framework-independent component lab generated from the same
custom elements and tokens. Each component page records:

- purpose, semantic element/role and data/event API;
- empty/loading/partial/unknown/error/offline/disabled/read-only states;
- keyboard, focus, pointer/touch and assistive-technology behavior;
- localization, expansion, bidi, IME and writing-mode behavior;
- container-size, zoom, safe-area and installed-window behavior;
- token/part customization and protected invariants;
- privacy/network/storage side effects (normally none for a control); and
- visual, accessibility-tree, interaction and failure regression fixtures.

This lab is a static product artifact and conformance surface, not a requirement
to adopt Storybook or another documentation runtime.

#### Explicit `<wa-page>` assessment

`<wa-page>` is now a **stable Core/MIT component**; it
[moved from Pro to Core](https://webawesome.com/docs/resources/changelog) in
Web Awesome 3.5.0. Older pages describing it as Pro are stale. It offers a
useful header/navigation/main/aside/footer anatomy, a skip link, flexible
regions, and compact navigation. It is a serious reference—not a rejected
idea.

It should not own the EFS root or guest critical path. Its current
implementation statically brings Lit plus Web Awesome button, drawer and icon
dependencies; uses `ResizeObserver` and JavaScript to select mobile/desktop;
and requires JavaScript for its accessible compact drawer. Consumers must
still provide semantic landmarks, safe-area/fold/input policy, EFS tokens,
offline icon handling and OS-specific layout behavior. See the official
[Page documentation](https://webawesome.com/docs/components/page/) and
[reviewed implementation](https://github.com/shoelace-style/webawesome/blob/ecc6a94135d6d68d23fb59024be5cfdc0bd135ad/packages/webawesome/src/components/page/page.ts).

Use an EFS-owned `efs-shell-layout` contract backed first by semantic light DOM
and native CSS. Keep `<wa-page>` as:

1. a native-versus-library benchmark;
2. an optional implementation for a richer replaceable Session Shell; or
3. a source of proven interaction/anatomy requirements.

If later selected, it sits behind the EFS shell adapter. Stored user settings
say `navigation: auto|rail|drawer`, density, contrast and pane sizes—not Page
attributes, slots, CSS Parts or events.

### Responsive desktop, mobile, and installed layout

One semantic route and action model serves phone, tablet, desktop, installed
window, zoomed desktop, foldable and assistive technology. Do not branch the
product into “mobile” and “desktop” applications or infer input from width/UA.

The native shell uses:

- semantic `<header>`, named `<nav>`, one `<main>`, optional `<aside>` and
  `<footer>` plus a working skip link before optional components upgrade;
- CSS Grid/Subgrid for page and pane structure, with
  [container queries](https://www.w3.org/TR/css-contain-3/) for components
  placed in changing workspaces;
- logical properties and writing modes rather than left/right assumptions;
- `min()`, `max()`, `clamp()`, `minmax()`, intrinsic sizing and content-driven
  wrapping instead of fixed device breakpoints;
- stable/small/dynamic viewport units and
  [`env()` safe-area/viewport segments](https://www.w3.org/TR/css-env-1/)
  where relevant, without letting browser-chrome animation continuously reflow
  the reading document;
- pointer/hover capability queries and Pointer Events for mouse, touch, pen and
  hybrids; no essential hover-only or gesture-only action;
- `prefers-reduced-motion`, forced colors, contrast, color scheme and reduced
  data; and
- `display-mode` adaptation for installed windows without changing EFS
  semantics.

The baseline viewport preserves user zoom (`width=device-width,
initial-scale=1`; never `user-scalable=no` or a restrictive maximum scale) and
requests the tested
[`interactive-widget=resizes-content`](https://www.w3.org/TR/css-viewport-1/#interactive-widget-section)
profile where implemented. `VisualViewport` may keep focused fields and trusted
action controls visible when an engine resizes only the visual viewport. The
[VirtualKeyboard API](https://www.w3.org/TR/virtual-keyboard/) and
`keyboard-inset-*` environment variables are conditional installed/editor
enhancements, not the only keyboard-avoidance path. Opening, closing, floating
or splitting a software keyboard during rotation, zoom and active IME
composition must not hide the focused field, confirmation controls or errors.

Narrow contexts use one-pane drill-in and compact commands. Wide contexts may
show tree/list/detail panes and an inspector together. Both retain the same
route, selection, exact resource, action progress and inspectable provenance.
At 320 CSS px and 400% zoom, sticky regions may collapse and two-dimensional
scrolling remains local to media/tables—not the whole authority ceremony.

A selected modern standards profile is allowed to reject an inadequate engine
with `UNSUPPORTED_WEB_PROFILE` and a link to the basic/rescue reader. Use a
small semantic fallback when it is cheap; do not ship a legacy layout or
application-framework fork merely because one browser release lags. Current
Chromium, Gecko and WebKit plus real desktop/mobile assistive technology still
remain required evidence: a forward policy is not permission to ignore bugs.

## Installable PWA and static/IPFS delivery

### Four delivery profiles

| Profile | Required behavior |
|---|---|
| Static browser core | Relative assets and hash routes; guest read and supported foreground writes work without installation, Service Worker or retained state |
| Stable-origin PWA | Any qualifying exclusive ordinary HTTPS or stable DNSLink/custom origin; domain-neutral relative/scope-derived boot, manifest, optional offline shell, scope-namespaced origin-local accepted-release pointer, versioned stores and continuity across exact releases |
| Immutable-CID generation | Exact isolated origin and independently pinnable release; a new CID is a new origin with no implied storage, grant, install or Service Worker continuity |
| Independent rescue | Exact retained build/viewer outside the primary origin/update path, able to open/export its declared public/store compatibility without operator services |

An IPFS path gateway shares one origin across unrelated content and cannot host
the active client. CID-subdomain isolation or a carefully controlled stable
origin is required. The [IPFS gateway model](https://docs.ipfs.tech/concepts/ipfs-gateway/)
is a delivery/security input, never content authority.

### Manifest and installability

Ship a relative [Web App Manifest](https://www.w3.org/TR/appmanifest/) from the
first product build with an explicit same-origin fragment-free `id`, `name`,
`short_name`, hash-router `start_url`, bounded `scope`, `display: standalone`,
language/direction, colors and self-hosted maskable/ordinary icons. The manifest
is browser installation metadata; the EFS release manifest independently binds
exact executable artifacts.

Installation is never required to follow a link and is not proof of offline
readiness. User agents control install affordances, so
`beforeinstallprompt` and platform app-store packaging are optional adapters.
Shortcuts navigate to inert/read surfaces; no shortcut signs, submits, installs
or grants authority.

### Service Worker and exact generations

A Service Worker is a delivery/offline accelerator, not part of Realm, Files,
artifact, action or absence correctness. Removing it must restore the ordinary
online static client. Its [event-driven lifecycle](https://www.w3.org/TR/service-workers/)
allows termination at any time; correctness state cannot live only in memory.
The worker script itself is part of that deployment's bootstrap trust anchor:
it can verify staged child assets but cannot prove its own delivery after it is
already executing. Stable-origin TLS/release process, exact-CID selection and
independently retained rescue remain distinct trust profiles.

Do not map Service Worker lifecycle state to EFS application-release
acceptance. Browsers may check a registered worker script under user-agent
policy and automatically activate a waiting worker once the old registration
has no controlled clients, including after shutdown/restart. Separate:

- **`NetworkBootstrapGeneration`:** tiny release-neutral HTML/JavaScript at the
  deployment scope. It remains byte-identical across ordinary App releases and
  reads the `AcceptedAppState` projection of local `LocalSelectionState` before
  importing any App code or registering a Worker. It is the
  force-reload/missing-Worker path, but remains same-origin bootstrap trust.
  If the projection is `ACTIVATION_IN_PROGRESS`, ordinary navigation renders
  conserved progress/recovery UI and imports no candidate App; only the fenced
  coordinator resumes the frozen attempt.
- **`WorkerBootstrapGeneration`:** a small conserved, content-named scope-level
  worker script registered only after explicit PWA enablement or separate
  explicit Worker-bootstrap acceptance, and before any dependent App-selection
  change. Subsequent UA checks address that same immutable URL; its automatic
  activation cannot select a new app/module release or grant.
- **`AppReleaseGeneration`:** an inert exact manifest and complete asset closure
  staged under its own cache key. EFS verifies it and runs non-activating
  preflight before explicit acceptance. The tuple transaction then records it
  as `BOOTING`; post-start health later marks `HEALTHY` or restores the
  predecessor. Worker `install`/`waiting`/`activate` changes no selection field.

These generation names follow the single activation model in
[[architecture-and-modules#Configuration objects]]: an
`AppReleaseGeneration` contains exactly one `BootGeneration`; one
`LocalSelectionState` atomically coordinates its accepted App with an optional
active `SystemActivationGeneration`; `InstallBindingGeneration` remains separate
third-party/module identity; and neither bootstrap generation selects any of
them.

`ActivationHealthLease` is an enforceable pre-`HEALTHY` authority boundary for
broker-mediated runner code only. A candidate App/Boot release executing as
trusted same-origin ESM remains TCB with ambient Web APIs. Its isolated/static
preflight may fail before selection; after explicit base acceptance,
post-start health may restore the predecessor code/checkpointed state but
cannot claim to undo arbitrary origin, wallet, network or remote effects.

The installed boot is host-agnostic. It resolves relative assets and a
standards-derived registration scope from its current deployment rather than
testing for named EFS domains. An immutable `ReleaseClosure` manifest binds
every member's relative path, digest, length, media type and execution role.
IndexedDB databases, Cache names, OPFS directories, locks and channels are
namespaced by the canonical manifest ID plus normalized deployment scope, then
release members use the exact release commitment—never a mutable URL, slug or
channel name. Paths do not create Web security boundaries: the stateful PWA
profile requires an exclusive trusted origin, while a shared-origin project
path is a stateless mirror/rescue profile. Same-origin scope-relative
`releases/<ReleaseId>/...` paths are useful
rehydration locations only when the current static deployment or IPFS root DAG
actually retains them; a Worker-only synthetic path is local acceleration, not
evidence that another browser can retrieve the release. CID-subdomain copies
remain exact rescue/rehydration transports with separate origin state.

For the stable-origin offline profile:

1. the accepted Worker bootstrap stages, but does not select, a complete exact
   App release closure;
2. every staged child executable/static asset is checked against the EFS
   release manifest;
3. a partial/corrupt install leaves the accepted App generation untouched;
4. explicit App acceptance follows verification and non-activating preflight,
   then records one local selection tuple as `BOOTING` with a newly derived
   exact local lock, newly authorized App-scoped grant/install bindings and a
   compatible successor System activation when a full System is active;
   post-start health separately marks `HEALTHY` or restores the predecessor;
5. old documents remain pinned to matching assets until explicit safe reload;
   do not use `skipWaiting()`/`clients.claim()` to mix generations;
6. retain the prior healthy App generation and keep user-data migration
   separate;
7. failure, version skew and required reload are visible typed states; and
8. a rescue URL outside the worker scope/origin survives a bootstrap boot loop.

Ordinary App updates do not register a new Worker. Do not register a candidate
Worker merely to stage it. A waiting
Worker can activate automatically after the old clients close or the user
agent shuts down. Stage only inert App release bytes before acceptance. A
Worker-bootstrap change is a separate explicit transaction whose candidate
must serve the candidate and every App reachable from current, last-healthy,
pending, running-session and retained rollback selection tuples, and select no
App or System field when it installs or activates. Dropping an incompatible
rollback root requires separate disclosure, export/removal choice and
authorization. A stable scope-relative `sw.js` is acceptable only when it is
genuinely conserved and release-neutral, because changing its bytes invokes
browser-managed update and eventual activation. Content-looking filenames are
policy: browsers do not validate the advertised digest, so deployment
validation must reject changed bytes at an already published content-named
URL.

Application/channel update checks may discover exact candidates, but never
activate a release, inherit grants, delete the old release or force an upgrade.
After PWA enablement the browser may independently request the exact registered
Worker bootstrap URL under its lifecycle policy; that same-origin request and
the possibility of automatic waiting-worker activation are named installed-
profile network/trust residuals, not hidden EFS update semantics. Operator or
catalog death must not prevent launching a pinned retained App generation.

The resulting promise is deliberately precise: on a supported browser, while
that origin's persisted site data and complete verified accepted release
remain intact, ordinary launches and reloads keep running that release until
an explicit authorized acceptance selects another. A clean first visit, site-
data clearing, storage eviction/private mode, force reload behavior, or a
malicious same-origin loader may break that continuity. The client reports
those boundaries and never calls this an indefinite or cryptographic pin.

### Offline means several different things

The UI and action model distinguish:

- `SHELL_OFFLINE_READY`: one verified client generation can boot locally;
- `RESOURCE_RETAINED_VERIFIED`: exact bytes plus required semantic evidence are
  locally complete at a named basis;
- `RESOURCE_NOT_RETAINED`: the shell works but the requested bytes/evidence do
  not exist locally;
- `CACHED_STALE` or typed `UNKNOWN`: retained evidence cannot establish a
  current claim;
- `DRAFT_LOCAL`: work exists locally but has no admitted public effect;
- `SIGNED_QUEUED`: authorization is retained but submission/finality is
  unresolved; and
- `OFFLINE_ACTION_UNSUPPORTED`: the operation requires foreground network,
  fresh authority or a wallet ceremony.

`navigator.onLine` is only a hint. Each selected Realm/carrier operation
establishes availability through its own result. Cached 404/absence, stale
bindings, incomplete directory pages and missing transport never become proved
current absence merely because the shell is offline.

Storage responsibilities stay separate:

| Store | Appropriate use | Not a claim |
|---|---|---|
| Cache API | recoverable exact shell/public response bytes | authoritative journal, backup or current Realm truth |
| IndexedDB | versioned settings, receipts, indexes, journal/migration state and ordinary blobs | permanent custody merely because persistence was requested |
| OPFS | optional large local artifacts, staging and snapshots | EFS Files namespace, user-visible Drive or universally available primitive |

Irreplaceable local/private state requires checksums, versioned schemas,
copy-forward checkpointed migrations, explicit export/import, recovery tests,
quota/eviction health and a retained old-schema reader. No browser transaction
atomically spans all three stores; stage immutable data, verify it, and change
the local selection tuple in one IndexedDB transaction.
`navigator.storage.persist()` is a best-effort request, never backup.

Foreground replay on launch/focus and explicit retry is the baseline. Background
Sync, Periodic Sync, Push, notifications and badges are conditional attention
or replay adapters. They never choose a signer, request authority, guarantee a
time, create finality, or become the only submission/recovery route.

File/protocol/share/launch handlers and Window Controls Overlay are forward OS
integrations from the [manifest incubations](https://github.com/WICG/manifest-incubations).
They accept hostile inputs into an inert review screen and never become
required for HTTPS links, import/export, layout or authority.

## Global internationalization and accessibility foundation

### Locale and message contract

Use [BCP 47](https://datatracker.ietf.org/doc/html/rfc5646) locale tags,
[Unicode locale identifiers](https://www.unicode.org/reports/tr35/) and the
platform [ECMA-402 `Intl`](https://tc39.es/ecma402/) implementations. Store
structured preferences—`uiLanguage`, `formatLocale`, `timeZone`, `calendar`,
`numberingSystem`, `hourCycle`—rather than forcing every preference into one
regional language tag.

Locale precedence is field-scoped:

1. a validated URL may request a **nonpersistent session UI language**;
2. an explicit local user's choice, including “follow system,” controls future
   local sessions unless that session request is present;
3. an activated exact system profile may provide a default, never override a
   local explicit choice;
4. ordered `navigator.languages` informs “follow system” through a documented
   RFC 4647/pack fallback algorithm; and
5. an embedded minimal recovery pack always remains.

Do not upload the full language list for analytics. Set document `lang`, `dir`,
title, landmarks, accessible names and announcements together before useful
content. Embedded content can carry its own language/direction.

The durable message-pack contract contains stable semantic IDs/namespaces,
locale and explicit fallback, typed placeholders, permitted format operations,
full-message variants, allowlisted rich DOM parts, schema/runtime version,
source digest, translator/reviewer provenance and immutable pack hash.
Portable/downloaded packs are inert declarative MF2 data or a validated
non-executable IR with a bounded allowlist of host formatter functions.
Translator-provided HTML or JavaScript never executes, and a pack is never a
dynamic-import target merely because its digest verifies.

[Unicode MessageFormat 2](https://www.unicode.org/reports/tr35/tr35-78/tr35-messageFormat.html)
is the preferred forward authoring candidate. Freeze a tested stable subset and
interpret/compile it with pinned client-owned code backed by `Intl`; do not
expose a particular JavaScript MF2 runtime as the EFS ABI until its round-trip,
tooling and implementation evidence passes. Built-in catalogs may be
precompiled to JavaScript only as trusted App-release build output. Fluent/ICU
MF1 remain migration or tooling inputs, not public contracts.

### Exact content and localized presentation

- Verify signed/content-addressed text as exact bytes before decoding or
  translation. Never normalize or translate an authenticated value in place.
- A translated signed value is a distinct claim binding source digest, target
  locale, translator/issuer and translation rules. Unsigned/community
  translation is labeled and the authenticated original remains reachable.
- Protocol numbers, token base units, instants, canonical ordering, hashes,
  addresses, CIDs, permission scopes and link targets are locale-independent.
  `Intl` output is presentation and never feeds signing, IDs or equality.
- Use `Intl.NumberFormat`, `DateTimeFormat`, `RelativeTimeFormat`,
  `ListFormat`, `DisplayNames`, `PluralRules`, `Collator` and `Segmenter` for
  their presentation roles. Do not parse localized display back into truth.
- Preserve logical text order; use CSS logical properties, `dir`, `bdi` and
  bidi isolation. Reveal canonical ASCII host/action target for consequential
  links and apply [Unicode spoof guidance](https://www.unicode.org/reports/tr39/)
  to high-risk mixed-script/confusable identifiers.
- Canonical Files names follow the separate rich Unicode/NFC rule at their
  explicit schema boundary. Never normalize pre-existing signed bytes or a
  generic metadata field merely for display.
- Respect `compositionstart/update/end`, `beforeinput`, `input` and
  `KeyboardEvent.isComposing`. Do not validate/normalize every keystroke or let
  rerender/shortcuts corrupt an active IME composition.

Each immutable language-pack manifest binds locale, fallback graph,
catalog/schema/compiler version, hashes, translation authority, optional
font/license set and compatible client range. Ship a minimal complete pack with
the shell; load other packs lazily, verify fully, switch atomically and retain
last-known-good. Language-specific network requests disclose interest, so use
same-origin sources, no telemetry and no third-party fonts. The picker works
before authentication, labels languages with autonyms and does not use flags
as language identifiers.

The MVP production closure contains one complete built-in baseline/recovery
locale pack; `en` is the working content candidate, not a permanent language
privilege. Complete generated pseudo-locales and bounded real-script catalogs
are conformance fixtures, not claims that those languages are fully translated
for users. A locale appears in the user-facing supported list only when every
security, recovery, action and ordinary message in that release has reviewed
coverage. Independently fetched/updateable production locale generations remain
the near-term extension; the inert catalog and rendering architecture exist in
the MVP.

System font stacks are the baseline. An optional WOFF2 script/font pack is an
exact same-origin artifact with license, coverage tests and fallback; glyph
appearance never establishes identity or authority.

### Accessibility release floor

Official surfaces target [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/), native
HTML first and ARIA only where native semantics cannot express the control.
Custom elements and Web Awesome controls must pass actual accessibility-tree
and assistive-technology tests; markup or a library claim alone is not proof.

Every route preserves logical DOM/reading order, landmarks, headings, skip
navigation, keyboard completion, visible/restored focus, accessible names,
localized errors/status, 400% zoom/reflow, text spacing, forced colors,
contrast, color independence, reduced motion, touch target size and orientation
changes. Modal dialogs deliberately contain focus and restore it on close;
non-modal dialogs remain reachable without trapping focus. Route/locale updates
announce once without stealing focus. Shortcuts are remappable/disableable and
do not consume printable or composing input.

Release evidence includes automated checks on every change plus manual desktop
and mobile screen-reader/keyboard/switch/zoom passes across current Chromium,
Gecko and WebKit. Pseudo-locales cover expansion, synthetic RTL, mixed
addresses/numbers, CJK/Thai segmentation, long unbreakable terms, emoji,
combining marks, missing messages and missing glyphs. Real release fixtures
include Arabic/Hebrew, Japanese/Chinese/Korean IMEs, an Indic script, Thai,
Turkish casing, German expansion and locale-specific numbers/calendars/time
zones. Automated audits are never represented as WCAG conformance.

## Portable computation and service-module foundation

[[system-profiles-and-generations#WebAssembly, WIT, Component Model and WASI foundation]]
owns the complete runner/profile model. The technology baseline is:

1. Trusted Boot, Reader, System Chrome and Shell remain native HTML/CSS/ESM
   plus Web Components. Wasm adds no mandatory guest boot or DOM bridge.
2. Portable non-DOM services preferentially use exact Core Wasm in a dedicated
   Worker behind WIT-shaped, versioned, plain-data/resource interfaces.
3. The Component Model is the target cross-language composition ABI. Browsers
   currently need an exact generated representation such as pinned `jco`
   output; that adapter/glue is TCB and replaceable tooling rather than EFS
   public ABI.
4. WASI 0.2/0.3 interfaces are selected individually under a named runner
   profile. The baseline grants no filesystem preopens, sockets/HTTP,
   environment, clock, randomness, locale, device, storage, wallet, signer or
   EFS-write authority.
5. Rich/legacy DOM applications remain in an opaque-origin iframe lane.
   Untrusted Wasm cannot register executable custom elements in the trusted
   Shell realm; it may drive an OS-owned semantic UI protocol.

The browser realization is:

```text
verified component/Core closure
 -> feature/profile validation
 -> dedicated Worker
 -> exact trusted binding adapter
 -> typed MessagePort
 -> Kernel capability/resource table
```

Verify each executable member and generated-glue asset before that member
enters a compiler or module loader; `compileStreaming()` does not prove an EFS
commitment. Launch readiness still requires the complete selected executable
closure. Retain canonical Core/component bytes separately from each exact
derived platform realization, including its WIT digest, feature/WASI profile,
adapter/generator/shims, provenance and build closure. Compiled engine caches
are performance only and never release identity unless explicitly published
and selected as a realization.

A WIT `resource` is an ABI handle, not a grant. The Kernel maps it to an opaque
scoped capability and rechecks activation epoch, scope, basis, expiry, budget
and revocation on every call. Dependencies still cannot inherit authority.

Core Wasm provides bounds-checked isolated linear memory and explicit imports.
When the host supplies only declared imports, this is a narrower authority
surface than executing publisher JavaScript in the trusted same-origin realm;
it is not a universal Wasm-versus-JavaScript safety ranking. It does not prove
provenance, correctness, determinism, reproducible source, faster execution,
host secrecy or immunity to infinite loops, memory/output bombs, side channels
and browser runtime vulnerabilities. The runner rejects disallowed/unbounded
memory, tables, features and imports before instantiation, enforces host-broker
byte/request/storage/concurrency ceilings, terminates runaway Workers by a
named deadline, revokes their epoch/handles, aborts cancellable host work and
prevents late completions from committing effects.

Threads, SIMD, shared memory, JSPI, GPU and other advanced features use named
forward profiles. Static/IPFS guest correctness never requires
cross-origin-isolation headers merely to support an optional high-performance
module.

## Greenfield build and release posture

No repository action is authorized. If implementation is authorized, begin
with this dated baseline and require every dependency to justify its place:

- one pnpm workspace and frozen lockfile; no task-graph framework until measured
  repository work proves it necessary;
- current Active LTS Node and package manager pinned exactly for build/test;
- strict TypeScript with `erasableSyntaxOnly` and `verbatimModuleSyntax`; avoid
  enums, namespaces, parameter properties, decorator metadata, path-alias
  magic and other TypeScript runtime/module semantics that obscure portable JS;
- Vite 8/Rolldown as the initial dated static builder, with explicit JS/CSS
  targets derived from the selected WebProfile, verified relative URLs
  (`base: "./"`), standard `import()` and
  `new Worker(new URL(..., import.meta.url), { type: "module" })` source forms,
  explicit application/rescue/Worker entrypoints, capability-aligned split
  boundaries, `assetsInlineLimit: 0`, an explicit module-preload-polyfill
  decision and only allowlisted plugins;
- no application framework, global state framework, router framework,
  dependency-injection framework, CSS-in-JS runtime, SSR requirement,
  Storybook requirement or opaque PWA generator in the initial closure;
- Biome plus `tsc --noEmit`, adding narrowly justified type-aware ESLint rules
  only for gaps;
- Vitest as Vite-coupled unit-test convenience, a builder-neutral pure-test
  lane, and Playwright against exact static output for reproducible
  Chromium/Firefox/WebKit automation, supplemented by real Safari/iOS/Android
  and assistive-technology runs;
- checked-in Markdown/ADRs and generated TypeDoc only for exported APIs; and
- no production dependency install script unless explicitly allowlisted.

Vite's documented [build defaults](https://vite.dev/config/build-options.html)
include a selected Baseline target, a module-preload polyfill and small-asset
inlining. None may silently set EFS browser policy, inject an unreviewed runtime
helper, weaken CSP accounting or hide artifact identity.

Vite is selected because its [static build](https://vite.dev/guide/build)
owns HTML/CSS/JS asset-graph rewriting under unknown bases, standard dynamic
imports/Worker source forms, ESM code splitting and static multi-entry output.
EFS—not Vite—owns `index.html`, rescue output, Web App Manifest, Worker entries,
and any selected content-named Service Worker bootstrap entry and policy.

Only validated `dist/` is releasable. Vite, its dev/HMR clients, query imports,
environment substitutions, chunk names, module-preload helper and
`.vite/manifest.json` are neither runtime nor public ABI. Avoid Vite-specific
`?worker`/`?raw`/`?url`, `import.meta.glob`, `import.meta.env` and similar forms
at portable seams; isolate an unavoidable use in one build adapter. The Vite
manifest is intermediate. An EFS-owned deterministic post-build validator
binds every release path, digest/SRI value, size, media type, executable class
and provenance without making a plugin part of the release ABI.

A direct-Rolldown comparator may emit different bytes and chunk graphs; it must
emit the same EFS manifest schema/invariants and pass the same artifact,
static-host/IPFS and browser suites. Production conformance serves exact
`dist/` from a dumb static server with no Vite middleware, rewrite, dev client
or `vite preview` dependency.

### Builder comparison

| Candidate | 2026 assessment |
|---|---|
| **Vite 8 / Rolldown** | Best first experiment: one shipped tool for HTML entry processing, relative URL rewriting across HTML/CSS/JS, assets, CSS, standard-form Workers, multi-entry output and ESM splitting. Its target, preload helper, asset inlining and plugins must be explicit. |
| [Direct Rolldown](https://rolldown.rs/apis/cli) | Best replacement/conformance comparator. Strong TS/ESM, multiple inputs and hashed split output; EFS must own more HTML/CSS/base/PWA orchestration. |
| [esbuild](https://esbuild.github.io/api/#splitting) | Strong minimal/rescue or independent builder with TS/CSS/assets/metafile; main-build code splitting still carries documented limitations and EFS-owned HTML orchestration. |
| [Parcel](https://parceljs.org/features/production/) | Credible HTML-first all-in-one alternative, but brings more automatic transformation/optimizer/plugin behavior without a demonstrated durability advantage. |
| [Rollup](https://rollupjs.org/tutorial/) | Mature ESM fallback; direct Rolldown is the closer comparator to Vite 8's current production engine. |
| No-build native ESM | Correct for a tiny plain-JS rescue/Boot artifact with vendored relative modules, not the TypeScript application graph; browsers do not execute TypeScript and document import maps do not define Worker graphs. |

Every release retains source revision/patches, dependency lock, every exact
dependency archive, exact Node and standalone package-manager bytes, build-tool
and native binaries (or reproducible source), plugins, integrity map,
licenses/SBOM, bootstrap/build instructions, exact artifact manifest,
dependency/capability diff, build attestation and independent rebuild evidence.
It also retains a `BuildPlatformDescriptor` for architecture, OS/kernel
compatibility, libc/userland, filesystem assumptions, locale, timezone and all
relevant environment inputs, plus either an immutable complete base
image/VM/rootfs including every base layer or a reproducible source/bootstrap
path for it. A future host is an explicit compatibility requirement, not a
hidden build input.
Do not assume a registry, Corepack or a previously warm dependency cache still
exists. CI uses frozen installs, immutable actions and explicit lifecycle-script
allowlists. Two clean network-disabled rebuilds from only the retained closure
must succeed and compare outputs/invariants; at least one begins from that
retained environment on a fresh compatible host. Runtime has no CDN, mutable
`latest`, remote import, remote font/icon, build secret or hosted configuration
dependency.

## Critical-path and failure discipline

The static ingress document and a tiny Boot Core paint semantic resolving
chrome. Route decoding, Reader and selected safe renderer then load in explicit
chunks. Wallet, Web Awesome-rich controls, package/runtime host, private store,
general agent system, inference and full Session Shell remain outside the guest
closure until requested.

Code splitting follows capability/product boundaries, not one chunk per source
file. Lazy modules expose stable typed progress and reserve layout space; a
failed import, custom-element definition, locale pack or optional control never
turns the app blank. Each route/module has an error boundary with raw/safe
fallback, retry and diagnostics. Background preload is privacy/battery/data
policy, never an unconditional optimization.

Performance instrumentation is local by default. A release records transfer
bytes, module graph, parse/compile/evaluate/execute, main-thread long tasks,
layout shifts, memory, Worker startup, request waterfalls and useful-content
milestones by boot profile. Reporting those traces externally requires a named
telemetry capability and informed local opt-in.

## Maturity and commitment map

| Class | Examples | Design treatment |
|---|---|---|
| Product-selected standards surface | semantic HTML/CSS, Custom Elements/DOM events/plain data, ES modules, URL/hash routes, TC39 Signals shape, Core Wasm plus WIT-shaped portable-service interfaces, installable/responsive/offline/i18n/accessibility outcomes | architecture may depend on the interface/outcome; exact profile and conformance still measured |
| Broadly shipped platform foundation | Fetch/Streams, Workers/MessagePort, WebCrypto, Manifest core, Service Worker, Cache API, IndexedDB, CSS Grid/container queries/logical properties, ECMA-402 Intl | use directly with explicit storage/lifecycle/security limits |
| Forward/conditional Web profile | Navigation/View Transitions, OPFS, File/Protocol/Share/Launch handlers, Window Controls Overlay, WebGPU, Trusted Types enforcement | design and adapter now; feature-detect; provide honest reduced/unsupported result; never silent authority expansion |
| Replaceable libraries/tooling | Signals polyfill, Lit, Web Awesome/Fluent/Lion control-pack candidates, Vite/Rolldown, pnpm, TypeScript, Biome, Vitest, Playwright, MF2 compiler | pin/audit; keep behind standards/data boundaries; replacement must pass the same fixtures |
| Foundational forward module target | Component Model through replaceable browser adapters; selectively granted WASI 0.2/0.3 profiles; exact generated browser representations | design portable non-DOM modules toward it; pin every profile/adapter; never direct guest correctness or ambient authority |
| Experimental extension/runners | WebMCP, WebNN, SES, native Component browser APIs and stronger browser runner profiles | research/module lanes; never direct guest correctness or ambient authority |

The Signals row is intentionally unusual: its native implementation is still
a moving standards process, but James has directed EFS to treat its official
API/polyfill as the selected JavaScript future rather than waiting or inventing
an intermediate store.

## Required experiments before implementation selection

1. **Native-versus-Lit Minimal Viewer.** Same custom-element API, Signals
   graph, folder/file fixture and accessibility behavior. Measure Brotli bytes,
   requests, parse/evaluation, first useful content, update cost, focus, keyed
   lists, cancellation and maintenance/security surface.
2. **Control-pack bakeoff.** Run Web Awesome Core, Fluent WC v3 and Lion through
   the identical self-hosted controls/forms/accessibility/global/mobile/failure
   suite above; record adapter leakage and exact dependency/runtime cost.
3. **Native shell versus `<wa-page>`.** Same landmarks/panes across 320×568,
   390×844, 768×1024, 1280×720 and 2560×1440, RTL, 400% zoom and installed
   mode. Record dependency graph, observers, layout shift and focus during
   container resize. Block Web Awesome and icon sources; the native reader and
   recovery actions must survive.
4. **Static/PWA generation fixture.** Run one untouched `dist/` at origin root,
   a random nested prefix, ordinary static hosting, stable DNSLink/custom
   origin, CID-subdomain and loopback. Cold-test hash routes, lazy JS/CSS,
   module Workers, locale/assets, rescue, missing/corrupt chunks, full offline
   shell install, corrupt/partial App update refusal, automatic Worker
   activation without App selection, rollback and Service Worker removal. Scan
   for absolute `/assets`, Vite dev/HMR/WebSocket code, local filesystem paths,
   Node built-ins, remote imports/CDNs, undeclared output and unowned data URLs;
   run the same suite against direct Rolldown.
5. **Storage/recovery fixture.** Kill the page/Worker at every journal write and
   migration checkpoint; block an old tab on `versionchange`; exhaust quota;
   evict Cache/IDB/OPFS independently; export/import; verify no local loss is
   represented as protocol absence.
6. **Global-use fixture.** Atomic locale switching offline; MF2-subset catalog
   validation; pseudo-locales; real RTL/IME/script matrix; authenticated text
   versus translation provenance; bidi/confusable authority screens; no
   language/font third-party request.
7. **Forward-profile fixture.** Disable each conditional API independently.
   The selected action either works through its standard baseline or returns a
   typed unsupported/reduced result and reachable rescue. No lowest-common-
   denominator fork enters Kernel or domain packages.
8. **Cold reconstruction fixture.** On an air-gapped fresh compatible host with
   no package cache, registry, Corepack or original service, start from the
   retained immutable base image/VM/rootfs (including base layers) or
   reproducible environment bootstrap and its `BuildPlatformDescriptor`; use
   only retained source/dependency/toolchain/license/integrity inputs and
   bootstrap instructions to produce two clean builds and compare their
   declared release invariants.
9. **Core Wasm/WIT cross-runtime fixture.** Verify one exact module/component
   before compilation, then run the same WIT-shaped contract through a pinned
   browser Worker adapter and native runtime with canonical equivalent results
   and typed errors. Attack undeclared network/storage/env/clock/random imports,
   oversized memory/output/messages, infinite loop and stale handles; measure
   startup, transfers, memory, termination and revocation. Any publisher JS in
   generated glue or undeclared effect fails the lane. Before explicit run, an
   instrumented adapter top level and Wasm start function must record zero
   evaluation/instantiation through Inspect, Adopt, Keep Offline and Prepare.
10. **Component representation rebuild.** From only the retained exact
    toolchain closure, independently reproduce the canonical component and
    browser representation, WIT digest, adapter/shim graph and artifact
    manifest. A mismatch invalidates reproducibility evidence without changing
    the already verified deployment-byte identity.

The working selection is falsified if:

- a public link needs the full OS, install state, Service Worker, wallet, Web
  Awesome, remote icon/font or private store before useful content, or Lit
  enters Boot/rescue or the Minimal Viewer without passing its fixed fixture;
- Signals objects leak into durable/public boundaries or EFS grows a competing
  global store;
- replacing Lit, Web Awesome, Vite or the MF2 compiler changes a route, action,
  module, storage or component contract;
- a vendor shell/component failure removes raw Files access or authority
  ceremony;
- mobile/desktop/installed modes use divergent resource/action semantics;
- an unsupported browser is silently misrendered rather than supported,
  reduced explicitly or routed to rescue;
- installation implies offline readiness, cached data implies current truth,
  or a new CID implies local-state/grant continuity;
- an update mixes executable generations, forces activation, inherits grants,
  strands user data or cannot roll back after health failure;
- locale/`Intl`/font output changes canonical IDs, signatures or equality;
- English concatenation, physical-direction CSS, an IME-destroying rerender or
  inaccessible custom control enters the shared component foundation; or
- a 2026 package/tool is necessary to reconstruct the application after its
  maintainer or registry disappears;
- Wasm enters the direct guest critical path without a measured user-visible
  benefit, or a WIT/Component adapter becomes runtime/public ABI rather than a
  replaceable exact representation; or
- a module receives undeclared WASI/EFS resources, blocks the main UI, evades
  revocation/budgets, or treats WIT resource ownership as authorization.

## Open evidence questions

- Exact proposal revision and polyfill package/commit for the first Signals
  fixture, plus the cheapest stable Lit bridge.
- Minimal Viewer native-versus-Lit result and whether Lit enters that specific
  route's critical chunk.
- Which Web Awesome Core components survive the Fluent WC v3/Lion
  accessibility/size/privacy/global/mobile bakeoff; `<wa-page>` remains optional
  pending its separate shell comparator.
- Initial locale set, translation/review authorities, MF2 stable subset,
  catalog fallback rules and font coverage/byte budgets.
- Normative forward browser/device/assistive-technology profile and exact
  `UNSUPPORTED_WEB_PROFILE` rescue threshold.
- Whether the first MVP ships only manifest/install metadata or also a
  Service Worker after the exact-generation fixture. Guest and foreground
  writes remain Service-Worker-independent either way.
- Exact storage schema, export container and recovery UX before any offline
  authoring claim.
- Vite output/rebuild and alternative-builder conformance on the final
  authorized workspace graph.
- Initial Core Wasm feature profile, WIT worlds, Component adapter and minimal
  WASI imports after browser/native semantic, performance, quota and
  ambient-authority fixtures.
- Whether an OS-owned accessible semantic UI protocol is useful for portable
  Wasm components or whether nontrivial visual modules should remain native
  trusted Web Components/opaque iframes.

These are engineering evidence questions. None currently requires a new owner
product choice or a Core/Files mechanism change.
