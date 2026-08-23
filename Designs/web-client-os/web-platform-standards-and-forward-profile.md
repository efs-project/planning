# Web platform standards census and forward EFS Web Profile

**Status:** draft — owner-directed forward-Web posture plus researched standards map for iteration; no browser matrix, package, polyfill, repository, build target, or product implementation is frozen or authorized
**Target repos:** planning, client, sdk
**Depends on:** [[Designs/web-client-os/README]], [[Designs/web-client-os/technology-foundation]], [[Designs/web-client-os/architecture-and-modules]], [[Designs/web-client-os/app-runtime-and-direct-launch]], [[Designs/web-client-os/privacy-and-agents]], [[Designs/web-client-os/system-profiles-and-generations]]
**Evidence:** [[Reviews/2026-08-23-web-platform-standards-screen/README]]
**Reviewers:** @web-platform-html-runtime (2026-08-23), @web-platform-css-a11y-i18n (2026-08-23), @web-platform-js-wasm-compute (2026-08-23)
**Last touched:** 2026-08-23

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/web-platform #topic/pwa #topic/accessibility #topic/i18n #topic/privacy #topic/security #topic/wasm #topic/agents

## Decision frame

James directed a broad Web-standards pass comparable to the EIP/ERC census and
explicitly rejected a lowest-common-browser posture. EFS should use modern and
emerging HTML, CSS, JavaScript, WebAssembly, PWA, accessibility, privacy,
internationalization, media, compute and agent standards when they materially
improve the product. A feature being new, incompletely shipped, or absent from
one present browser is not a reason to erase it from the architecture.

The resulting rule is **forward by design, qualified in execution**:

- product requirements may select a draft or proposal-shaped interface;
- the exact revision, implementation or polyfill is pinned behind an EFS-owned
  adapter until native implementations converge;
- support, standards maturity, product criticality and security authority are
  separate axes;
- each route declares full, reduced, unsupported and rescue behavior; and
- an engine gap may produce a deliberate reduced experience, but never silent
  corruption, false completeness, lost authority ceremony or a blank page.

This is deliberately more ambitious than “use Baseline features.” It is not
permission to make every incubation a dependency. New standards must still
solve a named problem, have a bounded profile, preserve privacy and
accessibility, and keep a removal or replacement path.

## Corpus outcome

The reproducible evidence pass uses the W3C-maintained `browser-specs` catalog
as its Web-wide umbrella, then adds proposal catalogs that intentionally sit
ahead of it. At the pinned revisions the generated corpus contains:

- 807 curated technical Web specifications across W3C, WHATWG, ECMA, IETF,
  Khronos, FIDO, AOMedia and related standards bodies;
- 329 TC39 ECMAScript and ECMA-402 proposal rows across active, Stage 0/1,
  finished and inactive catalogs;
- 61 WebAssembly proposal rows and 31 WASI proposal rows; and
- 1,228 indexed catalog rows overall, with duplicates across catalogs kept
  visible rather than laundered into one maturity claim.

The W3C Technical Reports index, WHATWG standards list, CSS Snapshot 2026,
Unicode technical-report index, CLDR releases, IETF/RFC/IANA material,
WebAssembly Component Model, Web Platform Tests, `web-features`, ARIA-AT and
Open UI/WICG incubations provide manual primary-family and implementation
backstops. Exact reproducibility state, revisions, counts, hashes, method and
limits are in the evidence review.

This is complete metadata ingestion over the four named catalogs plus a
high-recall product review, not a claim that every linked specification body or
paragraph of every unrelated graphics extension, ontology, codec registration
or historical W3C report was fetched and annotated. The machine-readable index
prevents silent omission inside those catalogs; a selected-feature status
ledger records product-reviewed families, their series URLs and exact dated
status evidence: [[Reviews/2026-08-23-web-platform-standards-screen/selected-status-ledger.tsv]].

## Disposition language

| Disposition | Meaning |
|---|---|
| **Durable baseline** | Standards-owned semantic surface that every supported EFS profile preserves. A reduced implementation may differ visually, but not in resource, action, reading order, authority or truth. |
| **Required forward** | Product-selected modern surface. The full profile uses it even if the exact API needs a polyfill, transform or adapter today. Missing native support invokes a named reduced/unsupported/rescue outcome. |
| **Enhancement** | Improves experience or performance but cannot carry unique state, reachability, focus, authority, accessibility or correctness. |
| **Specialized profile** | Required only for a named App/runtime/delivery profile whose user-visible effects and prerequisites are explicit. |
| **Watch / experiment** | Promising incubation requiring a pinned disposable fixture; no durable EFS contract yet. |
| **Negative evidence** | The standard exposes a requirement or hazard but must not be interpreted as EFS identity, verification, safety, completeness, authority or permission. |
| **Out of generic scope** | Legitimate Web capability that belongs to a later App or device adapter without changing the Web OS skeleton. |

“Universal fallback” means semantic equivalence, not pixel parity. “Required
forward” does not mean an unsupported parser may encounter unknown syntax in
the guest-critical bundle. Parse-level proposals use separate build outputs or
exact transforms until the selected profile can parse them.

## Product laws recovered from the standards

1. **Standards maturity is not product value.** A Living Standard, W3C
   Recommendation, Candidate Recommendation, Working Draft, Community Group
   draft, TC39 stage, Wasm phase and browser shipment report different facts.
   None alone decides EFS adoption.
2. **Support detection is not semantic conformance.** `@supports`, property
   existence, Baseline, BCD, a successful constructor and one WPT result do not
   prove focus, accessibility, privacy, lifecycle, storage, failure or
   cross-engine behavior.
3. **The platform is the durable ABI.** HTML semantics, CSS, URLs, ES modules,
   DOM events, Web Components, Workers, Streams, structured data and versioned
   messages are public boundaries. Lit, Web Awesome, Vite, polyfills,
   transpilers and browser adapters remain replaceable realizations.
4. **Native first does not mean oldest first.** Use a new platform primitive
   when it removes product-owned machinery or expresses the behavior better.
   Preserve a standards-shaped adapter until it ships where required.
5. **Browser permission is not OS authority.** A permission prompt, successful
   API call, iframe `allow` token, CSP rule or `Permissions-Policy` entry never
   becomes an EFS capability grant, Principal authorization or App mandate.
6. **Isolation mechanisms compose but do not launder.** Origin isolation,
   opaque iframes, Workers, CSP, Trusted Types, Permissions Policy, COOP/COEP,
   SES, Wasm and termination each bound different effects. No row earns the
   label “safe third-party App” by itself.
7. **The mutable origin remains a trust boundary.** SRI, import-map integrity,
   a CID-looking URL, a Service Worker or cached bytes cannot protect a first
   visit when the mutable document supplying the trust root is compromised.
   A client-verified immutable release or separately trusted signed bootstrap
   remains the unresolved stronger path.
8. **Origin storage is not sovereign storage.** Cache API, IndexedDB, OPFS,
   Storage Buckets and non-extractable keys remain origin-scoped browser state,
   subject to policy, eviction, clearing, implementation limits and origin
   compromise.
9. **Acceleration is derived, never truth.** WebGPU, WebNN, WebCodecs, browser
   models, pressure hints, scheduling priorities and GPU/NN floating point may
   accelerate work. They do not decide EFS resolution, identities, signatures,
   hashes, completeness or consensus.
10. **Presentation never rewrites exact data.** CSS layout, `Intl`, CLDR,
    translations, fonts, bidi display, URL display, Unicode warnings, time
    zones and calendars cannot change canonical bytes or identity.
11. **Privacy requires fewer observations, not more feature probes.** Probe a
    capability only when a route or explicit action needs it. Record the
    network, entropy, storage and permission effects separately from whether
    the API exists.
12. **An App link is a route, not an install ceremony.** The Boot Core may
    route directly to a built-in or exact third-party App surface and load the
    minimum trusted Shell/runner slices. Discovery, fetch, verification,
    preparation, grant, activation and execution remain separate.

## EFS Web Profile contract

The project needs a versioned feature ledger rather than one global browser
support sentence. Illustrative names are not frozen:

```text
EfsWebProfileV0
  profileId + revision
  standardsSnapshot[]
    standardsBody + exact spec/proposal revision + maturity
  requiredFeatures[]
    featureId + product purpose + productCriticality
    syntax/build target + detection + semantic probe
    privacy/network/storage/permission effects
    required delivery headers or origin properties
    full + reduced + unsupported + rescue outcomes
    polyfill/adapter/toolchain realization and exit condition
    WPT references + EFS fixture result + review date
  optionalFeatures[]
  forbiddenFeatures[]
  browser/device/AT realization evidence
```

Maturity changes do not silently rewrite an accepted profile. Refreshing a
standard, polyfill, browser target or adapter is a reviewed generation change
with a diff, fixture results and rollback.

### Named product profiles

| Profile | Required outcome | Deliberate exclusions/prerequisites |
|---|---|---|
| **Guest Reader** | Fast static deep link; semantic HTML, modern CSS, ESM, Signals-compatible state, Fetch/Streams, dedicated Workers as needed, verified bytes, safe viewer and raw rescue | no wallet discovery, account, Service Worker control, cross-origin isolation, GPU/model download, OS boot or third-party App execution |
| **Forward Shell** | Full responsive OS shell, native overlays/navigation/lifecycle, richer controls and smooth transitions under current standards | every advanced visual/navigation feature independently reducible; no unique authority or truth in an animation or overlay |
| **Installed / Offline** | Manifest install affordances, accepted exact App/System generation, local shell/data availability and explicit upgrade/rollback | installability is not offline readiness; cache is not protocol truth; Service Worker update is not App acceptance |
| **Secure Worker App** | Exact verified package closure, dedicated Worker, SES/Compartment realization where selected, typed capability ports and host termination | no DOM; no ambient network/storage/wallet; SES is not CPU/memory/process isolation |
| **Opaque Full-Web App** | Exact verified closure in an opaque sandboxed iframe with construction-time policy, instance lease and Shell chrome | direct egress/renderer DoS remain named residuals; widening construction policy recreates the instance |
| **Parallel Compute** | Shared memory, Wasm threads and high-throughput compute | requires exact COOP/COEP response-header and dependency graph profile; direct guest never depends on it |
| **Media / GPU / ML** | WebCodecs, AudioWorklet, OffscreenCanvas, WebGPU, WebNN or opaque browser model provider as a measured realization | exact source/model/config closure remains separate; derived output and device support are qualified |
| **Agent** | EFS-owned structured resources/actions/plans/receipts projected to WebMCP or another Web agent surface | discovery and invocation never grant authority; WebMCP absence preserves the native EFS agent API |
| **Rescue** | Human- and agent-readable route, raw verified data, provenance, errors, export and recovery using tiny HTML/CSS/JS | no component library, experimental API, install state or network side effect required |

## Selected standards foundation

### HTML, DOM, URLs and native controls

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| WHATWG HTML, DOM, URL, Encoding, MIME Sniffing, Fetch, Streams and Web IDL | **Durable baseline** | Browser semantics for documents, parsing, navigation, resource URLs, requests and byte/text pipelines. EFS protocol IDs, media types and filenames still name their own exact encoding/normalization profiles; transport and sniffed types never silently rewrite them. |
| Semantic landmarks, links, buttons, forms, native inputs, `<details>`, `<dialog>`, `inert` and the top layer | **Durable baseline / required forward where newer** | Build trusted Shell semantics from platform controls. Native semantics do not remove focus, AT, touch and failure testing. |
| Popover, declarative invokers/commands and `CloseWatcher` | **Required forward** | Standard overlay/open/close behavior for menus, inspectors and transient Shell surfaces. Keep route/in-page rescue, focus restoration and Escape/back behavior. Do not use tooltip-only content for essential status. |
| Custom Elements, Shadow DOM, slots, `ElementInternals`, form association, custom states and CSS Parts | **Durable component boundary; advanced pieces required forward** | EFS custom elements expose ordinary attributes/properties/events/slots/data. Shadow DOM is encapsulation, not security or automatic accessibility. Keep global landmarks, authority ceremony and complex cross-root relationships in light DOM where practical. |
| Declarative Shadow DOM and scoped custom-element registries | **Enhancement / watch by exact feature** | Useful for pre-rendered or collision-contained trusted modules. Neither is needed for guest correctness or third-party confinement. |
| HTML safe-method/sanitization work | **Required safe-DOM policy; exact API evidence-gated** | Prefer text nodes, attributes and EFS-owned templates. A native sanitizer may implement an allowlisted inert presentation adapter only after exact-spec and mutation-XSS fixtures; unknown active markup never enters trusted DOM. The discontinued standalone Sanitizer draft is not a dependency; `setHTMLUnsafe` is forbidden for untrusted App/File content. |
| Import maps and import-map integrity metadata | **Required forward for trusted release graphs** | Resolve the EFS-owned Shell graph and bind expected resources where supported. A module map is not Package identity, closure completeness, authorization or a safe third-party loader. |

### Navigation, loading and lifecycle

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| Hash URLs plus History/URL APIs | **Durable baseline** | Correct static-host/IPFS routing under unknown base paths and direct deep links. No server rewrite is required. |
| Navigation API and URLPattern | **Required forward through an adapter** | Model abortable route transactions, interception, focus/scroll restoration and direct-App navigation. Reduced profile uses hash/history routing with the same route contract. |
| Same-document View Transitions | **Enhancement** | Smooth Shell/App transitions after state is already committed. Honor reduced motion; no status, authority or focus exists only in the transition. Cross-document transitions remain experimental for this SPA. |
| `modulepreload`, preload, lazy loading, `fetchpriority`, Priority Hints and navigation preload | **Required performance toolbox** | Apply from a measured route graph. Preload never authorizes a fetch, defeats privacy policy, or executes a package before Play/Launch. |
| Speculation Rules | **Watch / local-only experiment** | May prepare exact same-origin public routes after privacy and bandwidth review. Never predict wallet, private, cross-origin, package-execution or authority-bearing routes by default. |
| AbortController/AbortSignal composition and task cancellation | **Durable baseline / modern methods required forward** | One cancellation tree spans route, fetch, verification, Worker/RPC and instance lease. Cancellation is not rollback of remote effects. |

Back/forward cache, prerender, session restore and a replayed navigation can
restore presentation state; they must not recreate an expired App instance,
grant, wallet session, transient activation or action plan. Every authority-
bearing generation is revalidated independently from route restoration.

### CSS and responsive application layout

EFS should write current CSS directly. A build transform may preserve a
reduced profile, but the source design is not restricted to the oldest engine.

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| Grid, subgrid, Flexbox, intrinsic sizing and normal flow | **Durable baseline** | Shell, pane and content layout. DOM reading/tab order remains authoritative; visual reordering cannot change it. |
| Container size queries | **Required forward** | Components respond to their allocated pane, not a hard-coded device class. Style and scroll-state queries remain enhancement/profile-specific until fixtures pass. |
| Logical properties, writing modes, `dir`, `bdi` and capability/preference media queries | **Durable baseline** | RTL, vertical-script, zoom, pointer/hover, installed display and user-preference adaptation. Do not infer device or input from width/user agent. |
| Cascade layers, `@scope`, nesting, custom properties, registered properties, `:has()` and custom-state selectors | **Required forward authoring/runtime profile** | EFS owns deterministic cascade and design tokens; adapters isolate component-library styles. Compile only where needed for the reduced profile. |
| CSS Color 4/5 facilities including OKLCH, relative color, `color-mix()` and light/dark adaptation | **Required forward with sRGB/forced-color fallback** | Generate accessible semantic tokens and wide-gamut themes. Forced colors and user contrast override decoration; color never carries the only meaning. |
| CSS Fonts 3, Font Loading, and selected Fonts 4/5 features | **Durable typography baseline plus exact forward features** | Script-complete system/local fonts, stable fallback metrics and lazy verified font sets. Font loading, variation, synthesis and metrics cannot change identity or block rescue; every retained font carries rights evidence. |
| CSS Text 3/4 | **Required global-text profile** | Script-aware line breaking, wrapping, hyphenation, emphasis and justification with native shaping/IME fixtures. Engine/font variation remains presentation, never canonical segmentation or order. |
| Selectors 4 `:focus-visible`, CSS UI, Color Adjustment, `accent-color`, `color-scheme` and forced-color behavior | **Required interaction/accessibility profile** | Visible focus and native-control adaptation across themes/high contrast. Browser defaults and user styles win where necessary; decoration never removes an operable state. |
| Scroll Snap, Overscroll Behavior, `scrollbar-gutter` and standardized scrollbar styling | **Forward pane-behavior profile** | Improve touch/desktop workspaces without trapping scroll, hiding content, stealing history navigation or changing DOM/focus order. Normal scrolling remains complete. |
| Anchor positioning | **Enhancement** | Position inspectors, menus and popovers without JS geometry loops. The overlay remains reachable and operable in normal flow without it. |
| Scroll-driven animation, advanced transitions and interpolated sizing | **Enhancement** | Use for polish where it improves comprehension. Static/reduced-motion behavior is complete. |
| CSS containment and `content-visibility` | **Required performance tool after a11y/search fixtures** | Bound expensive panes and large lists without hiding focused, searched or assistive-technology content. Virtualization preserves collection counts, positions and reachable items. |
| Customizable select / CSS Forms | **Watch in a version-locked fixture** | HTML/CSS/Open UI syntax and keyboard behavior are still moving. Ordinary native `<select>` remains the semantic fallback and durable contract. |
| Safe-area environment values, dynamic viewport units, VisualViewport and VirtualKeyboard | **Required forward / enhancement by feature** | Correct installed/mobile/windowed layout around notches, keyboards and overlays. Normal flow and native input remain usable when APIs are missing. |

### ECMAScript, state, modules and time

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| ECMA-262 2026/living draft, native ESM, dynamic import, async iteration, modern collections and typed arrays | **Durable modern baseline** | Name the accepted syntax/built-in generation in each browser profile. Guest-critical output must parse in its selected profile. |
| ECMA-429 Minimum Common Web Platform API | **Portability floor, not browser ceiling** | Useful boundary for code shared with server/headless JavaScript runtimes. The Web Client/Shell still uses richer browser-native standards and never reduces itself to ECMA-429. |
| TC39 Signals Stage 1 plus exact compatible polyfill | **Owner-selected required forward** | One in-process reactive graph for state and derived UI. Signals never become persistence, RPC, capability, component or package ABI. |
| Temporal, now Stage 4 for ES2027 | **Required forward behind an EFS time adapter** | Correct instant/civil time/duration calculations and explicit time zones. Engine tzdb/locale output remains presentation and is recorded where reproducibility matters. |
| Explicit Resource Management, now Stage 4 for ES2027 | **Required forward for lease-owning internal code after a build fixture** | `DisposableStack`, `AsyncDisposableStack`, `using` and `await using` can make instance/resource teardown legible. Parser-level syntax uses a transformed or separate output until the profile supports it. It does not replace idempotent host teardown or remote cancellation receipts. |
| Structured clone, transferable `ArrayBuffer` and `MessagePort` | **Durable baseline** | Versioned, runtime-validated DTOs across realms/Workers. Cloneability is not semantic validity; transfers detach ownership and must not smuggle live Kernel authority. |
| Transferable Streams | **Required-forward pipeline optimization** | Preserve backpressure/cancellation/EOF semantics where the measured profile supports transfer. A bounded `Uint8Array`/transferable-buffer protocol remains the equivalent reduced path. |
| Decorators and Decorator Metadata Stage 2.7 | **Optional pinned build transform** | May reduce trusted internal boilerplate after toolchain evidence. Decorator evaluation/order/metadata cannot enter public manifests, custom-element contracts, stored data or App ABI. |
| Source Phase Imports, deferred evaluation, Import Text, Dynamic Code Brand Checks, ESM phase/import-bytes and module-expression work | **Watch / forward-loader experiments** | Potentially improve inspect-before-evaluate and remove transforms. Exact package closure, verifier and runner graph remain authoritative until hostile fixtures prove a simpler loader. |
| Async Context and related execution-context proposals | **Watch / forward observability experiment** | May propagate trusted route/action trace context through async work. Authority, Principal, grant and receipt identity still cross RPC/storage boundaries as explicit validated data rather than ambient context. |
| ShadowRealm | **Negative evidence / watch** | Convenience realm separation only. It provides no process, network, storage, CPU or memory isolation and cannot run a malicious App safely. |
| Compartments proposal and SES | **Standards-facing target plus runner realization** | Compartments shape virtualized module loading; SES is a pinned userland realization. The outer Worker/iframe, capability router and lease still own effects, budgets and termination. |

### Scheduling, Workers and performance observability

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| Dedicated module Workers | **Durable baseline for heavy/trusted service work** | Hashing, verification, parsing, search and portable modules leave the UI thread where measurements justify startup cost. A document import map is not assumed to configure a Worker. |
| Prioritized Task Scheduling (`scheduler.postTask`, `scheduler.yield`) | **Required forward adapter over current WICG work** | Yield long trusted tasks and prioritize user-visible work. Priorities remain hints and cannot affect correctness or starve a guest read; ordinary task/Worker fallback remains. |
| Performance Timeline, User/Resource/Navigation/Event timing, Long Tasks/Long Animation Frames and observers | **Required local release evidence by surface** | Measure useful content, input latency, long work, layout and resource graphs. Cross-origin and memory visibility may be `UNKNOWN`; telemetry export is opt-in capability. |
| Web Locks and BroadcastChannel | **Required forward for cooperative same storage-key/bucket coordination where exposed** | Coordinate a transaction guarded by an IDB-persisted generation/fencing token, single-writer migration or cache GC. The browser lock is never itself the fence and is not durable, security, cross-partition, cross-device or crash-proof; journals remain idempotent. |
| SharedWorker | **Enhancement** | May reduce duplicate same-origin services after lifecycle/availability evidence. No correctness-critical ownership depends on it. |
| Compute Pressure and device-memory-like hints | **Enhancement with privacy budget** | Adjust optional quality only. Never gate access, truth or security and never probe on cold guest boot without need. |

### Storage, installability and offline operation

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| IndexedDB | **Durable browser storage baseline** | Transactions, journals, configuration metadata, migrations and generation ledgers. Schema/runtime validation remains EFS-owned. |
| Cache API | **Durable response-cache baseline** | Exact shell and response bytes keyed by accepted generation/commitment. Request URL alone is not content identity and a cache hit is not current EFS truth. |
| OPFS / File System living standard | **Required forward for large exact local bytes and databases** | Worker-owned exact-byte store where measured. IDB/Cache/export rescue remains; quota/persistence does not promise sovereign durability. |
| Storage Buckets | **Required forward adapter over a Community Group report** | Separate App/system generation, temporary derivation and retained-byte eviction/expiry domains. IDB/Cache/OPFS namespaces remain the reduced path; bucket deletion or eviction is local status, never protocol deletion. |
| StorageManager estimate/persist | **Required storage UX evidence** | Expose best-effort/persisted observation and recovery/export. Permission or “persisted” result still does not guarantee survival. |
| Web App Manifest | **Product-required install packaging** | Same resource/action semantics in tab and installed display modes; explicit stable `id`, scope, icons, shortcuts and display override. Installation is not identity, trust or offline readiness; UA install UI is policy and `beforeinstallprompt` is not a standards contract. |
| Service Worker | **Product-required offline/update tool after the generation fixture** | Serve an already accepted exact App/System generation, offline shell and candidate bytes. Browser Worker update/activation and OS App acceptance remain separate transactions. Guest correctness and foreground writes never require control. |
| Launch Handler, File Handling, Protocol Handlers, Share Target, Badging and Window Controls Overlay | **Forward installed-App extensions** | Integrate with desktop/mobile OS affordances through explicit adapters and trusted Shell review. Inputs are untrusted routes/files; registration is not default-App authority. |
| Background Sync, Periodic Sync and Background Fetch | **Enhancement / specialized profile** | Resume explicit outbox or retained-byte tasks with honest status. User-agent scheduling is unreliable and privacy/battery sensitive; no semantic deadline or correctness depends on it. |
| File System Access picker APIs | **Optional adapter** | Explicit import/export/mirror and user-selected local directory workflows. Handles are local capabilities, never serialized into PackageHandoff, grants or public EFS state. Native Drive adapters remain the OS Drives PM's lane. |

The standard File API remains the baseline for user-supplied file/blob bytes;
the more privileged File System Access surface is only a gesture-bound portal.
`navigator.onLine`, a background callback, an installed window or an available
picker never proves useful connectivity, liveness or durable access.

Origin remains the browser's state-sharing boundary. A stable origin such as an
ENS/DNSLink site can retain accepted versions and local state across content
updates. Different origins—including immutable release subdomains—do not share
that state automatically. Export/import, user-authorized file transfer, an
explicitly reviewed cross-origin protocol or reconstruction from EFS are the
honest bridges; no domain is baked into product code.

### Security and privacy controls

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| Secure Contexts, mixed-content rules and HTTPS | **Durable baseline for privileged profiles** | Name unavailable capabilities honestly on delivery profiles that cannot satisfy them. HTTPS protects transport to the chosen origin; it does not authenticate an EFS Release. |
| CSP Level 3 | **Required defense-in-depth** | Strict release-owned scripts/resources and separately compiled iframe construction profiles. A portable meta policy cannot supply every response-header guarantee; record header-controlled versus portable-static profiles. CSP is not input validation or proof of no egress. |
| Trusted Types | **Required forward trusted-Shell profile** | Reduce DOM-XSS sinks and concentrate reviewed policies. It does not stop malicious authorized code, subresource exfiltration or iframe activity. |
| Subresource Integrity 2 and import-map integrity | **Required where the browser loading path supports an external commitment** | Detect unexpected subresource bytes. The mutable document choosing the hash remains the trust root, and dynamic/eager package closure still needs EFS verification. |
| Permissions Policy plus iframe `allow` | **Required construction-time runner compiler** | Disable/enable browser features for a particular document/frame profile. It does not grant EFS authority, preserve transient activation or mediate ordinary network/navigation/renderer behavior. |
| Referrer Policy, Fetch Metadata, CORP/COOP/COEP and document isolation | **Required by applicable delivery/runtime profiles** | Minimize request leakage and harden cross-origin boundaries. COOP/COEP response headers define the separate parallel-compute profile and cannot be synthesized by a static bundle. |
| Opaque-origin iframe sandbox | **Selected full-Web execution lane** | `allow-scripts` only in the smallest profile, never `allow-same-origin`; construction attributes freeze before creation. Sandbox does not prove no network, no renderer DoS or no browser exploit. |
| Credentialless iframe | **Optional construction profile** | May avoid sending ambient credentials and ease particular embedding graphs. It is not an opaque origin, no-egress proof, capability grant or substitute for sandbox/verification. |
| Web Cryptography Level 1 | **Durable cryptographic adapter** | Vector-tested SHA-2/HMAC/HKDF/AES-GCM and named Level 1 algorithms. A `CryptoKey`, including a non-extractable one, is origin state rather than hardware proof, Principal authority or protection from origin compromise. |
| Web Cryptography Level 2 and modern-algorithm incubations | **Required-forward by exact algorithm** | Probe and vector-test Ed25519/X25519 or other selected algorithms under a named engine profile. Ethereum Keccak/secp256k1, BLAKE3, Argon2 and missing needs use audited JS/Wasm adapters with no silent downgrade. |
| WebAuthn/passkeys and Credential Management | **Required-forward identity/reauthentication portal** | Invoke only after an explicit identity/action need. Verify RP ID, origin, challenge, authenticator data, client data, key and counter policy; an assertion becomes Principal/controller authority only through an explicit EFS binding and historical receipt. |
| FedCM and Digital Credentials | **Optional external-identity/credential profiles** | May import or present a named external claim without becoming mandatory login, wallet discovery, EFS Principal identity or ambient App authority. Issuer/verifier network and disclosure effects remain explicit. |
| Global Privacy Control and W3C Privacy Principles | **Required policy input/principles** | Respect a user-expressed GPC preference for applicable client-controlled external processing and keep EFS's stronger data-minimization defaults. Do not forge a browser-level legal signal. |
| Permissions API | **Observation only** | Browser permission state is live, incomplete and revocable. It never becomes an OS grant or Principal authority and is queried only for an explicit action. |

The privacy default is zero third-party telemetry, analytics, remote fonts,
icons, localization, crash reporting, guidance, catalogs or inference calls.
Network access is named by purpose and recipient. Capability probing, GPU/NN
enumeration, device APIs, installed-wallet discovery and cache timing are
privacy events even if no account or file is read.

### WebAssembly, WIT, WASI and accelerated compute

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| WebAssembly 3.0 and selected Core Wasm features | **Foundational specialized baseline** | Verified portable service modules in dedicated Workers. Pin the exact feature set; Core Wasm supplies neither DOM/WASI authority, package semantics nor automatic safety. |
| Wasm streaming compilation | **Trusted-release optimization only** | Correct MIME is a delivery dependency. Never instantiate an unverified third-party member. Cache portable source bytes; compiled modules are engine-specific derivations. |
| WIT and Canonical ABI | **Selected portable-service interface direction** | Versioned records, variants, options/results, resources and worlds. Pin toolchain/revision and test Unicode, traps, ownership, destruction, cancellation and adapter skew. WIT describes slots, not grants. |
| Component Model | **Strategic forward target / exact browser adapter** | Still a WebAssembly proposal and not a native browser ABI. A transpiler/adapter is part of `RunnerRealization`, never Package identity. |
| WASI 0.3.x | **New forward profile** | Async component functions, streams/futures and selected named interfaces. Keep a distinct 0.2 realization for ecosystem compatibility. No ambient CLI/env/filesystem/clock/random/socket/DNS/HTTP. |
| JavaScript Promise Integration (Phase 5) | **Optional forward async bridge** | Let selected Wasm work suspend around host promises where exact engine/toolchain evidence passes. A transformed/state-machine realization remains available; JSPI does not add host authority or cancellation semantics by itself. |
| WebAssembly ESM Integration (Phase 3) | **Loader experiment** | May simplify trusted release-owned imports after exact closure/TOCTOU fixtures. It does not let a browser module graph establish Package identity, completeness or safe third-party evaluation. |
| WebAssembly Web CSP integration (Phase 5) | **Named security-policy fixture dependency** | Record compilation/evaluation behavior under exact `script-src`/Wasm policy and delivery headers. Proposal phase is not proof of merge into Core Wasm, browser shipment or a complete code-execution policy. |
| SIMD, GC, memory64, multiple memories, tail calls and JS string built-ins | **Named Wasm feature profiles** | Adopt where a route/module benefits and exact engine/toolchain evidence passes. No generic “supports Wasm 3” shortcut. |
| SharedArrayBuffer, Atomics and Wasm threads | **Parallel Compute profile only** | Requires COOP/COEP and explicit memory/thread/budget policy. Blocking waits remain off the UI thread; host owns spawn and termination. |
| WebGPU and WGSL | **Specialized forward profile** | Rendering and compute with recorded adapter/device/features/limits/loss. GPU results never become hashes, signatures or resolution truth. |
| WebNN | **Specialized forward profile** | Replaceable inference provider across available accelerators. Model/tokenizer/config identity, provenance and network effects remain EFS-owned evidence. |
| Browser Prompt/translation/writing model APIs | **Experimental opaque-provider adapters** | Useful local capability when explicitly selected. Hidden downloads, model identity, output variability and privacy remain visible; no authority or verified-provenance claim. |
| WebCodecs, OffscreenCanvas, AudioWorklet and transferable media objects | **Specialized media profile** | Verified-source decoding/rendering outside the main UI where possible. Exact codec support is measured and decoded output is derived. |

### Agents and Web-facing tool standards

[WebMCP](https://webmachinelearning.github.io/webmcp/) is useful and early. It
is a Draft Community Group Report, not a W3C Recommendation or an OS security
model. EFS should implement it as a projection over an EFS-owned agent contract:

```text
EfsAgentSurface
  inspect structured resource + provenance + completeness
  enumerate available typed actions
  explain/dry-run exact ActionPlan
  request mandate/gesture/authority through trusted Shell
  dispatch under scope + expiry + generation fence
  observe ActionReceipt and typed UNKNOWN
```

WebMCP registration, declarative metadata, annotations, arguments and outputs
are untrusted discovery/invocation data. Registration never grants authority;
annotations never prove an action read-only or safe; cancellation never rolls
back remote effects. The native EFS surface remains usable by agents when
WebMCP is absent. WebNN, browser models and WebGPU may realize an agent's local
compute but never identify the agent, authorize it, or make probabilistic output
protocol truth.

### Accessibility, input and global use

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| WCAG 2.2 AA | **Durable release floor** | Automated checks plus knowledgeable human and real browser/AT evaluation. WCAG 3 remains watch evidence. |
| Native HTML, ARIA in HTML and WAI-ARIA 1.2 | **Durable semantics baseline** | Prefer native semantics. ARIA supplies semantics, not focus, behavior or keyboard interaction; ARIA 1.3 remains a separately pinned forward profile. |
| Accessible Name, Core AAM and HTML AAM | **Required diagnostic/evidence authorities** | Verify names/descriptions and platform accessibility mappings for native/custom elements. They do not replace real browser/AT tests; APG remains informative and ARIA-AT remains implementation evidence. |
| Pointer Events 3 | **Durable pointer foundation** | Unified pointer/touch/pen event model with exact capture, cancellation and `touch-action` behavior. Keyboard and assistive paths remain peer inputs. |
| UI Events, Input Events 2 and composition events | **Required-forward input/editing profile** | Use native editing first and evidence-gate `beforeinput`/advanced operations. Never rerender/normalize during IME composition or steal browser/AT/text-entry shortcuts. |
| Unicode 17, UAX 9/15/29, UTS 39/46 | **Durable versioned text foundation** | Bidi, normalization, grapheme segmentation, confusable risk and host IDNA each have separate roles. Normalize only at declared schema boundaries and never rewrite signed/generic bytes. |
| BCP 47 plus IANA language registry, CLDR 48.2/UTS 35 and ECMA-402 | **Durable global presentation foundation** | Structured locale/language/calendar/numbering/time-zone preferences and explicit fallback. Engine/CLDR output is presentation. |
| MessageFormat 2 in UTS 35 Part 9 | **Stable format; implementation evidence-gated** | Inert typed catalogs, typed placeholders, allowlisted markup/functions, exact catalog provenance and offline fallback. No translator-authored HTML/JS. |
| WHATWG URL, RFC URI/IRI, IDNA and EFS path/name profiles | **Separate exact adapters** | Browser navigation uses WHATWG URL. Protocol citations, human IRI display, host labels and EFS rich Unicode names do not share one normalization/equality algorithm. |

Accessibility and i18n are not reduced-profile extras. DOM/reading order,
resource identity, action meaning, error/provenance, keyboard paths and raw
rescue remain available even if advanced controls, fonts, motion or locale
packs fail.

## Network and data-format standards

The Web Client should use HTTP semantics rather than inventing a server
protocol, while remembering that ordinary static hosting is optional transport:

- WHATWG Fetch/Streams/URL define the browser request pipeline;
- HTTP Semantics/Caching plus immutable responses, ranges, content codings and
  Digest Fields inform transport and cache evidence;
- HTTP Message Signatures and signature-based integrity are optional external
  transport-evidence adapters, not EFS Release or Principal authority;
- Compression Streams normatively cover Brotli, deflate, deflate-raw and gzip;
  native Brotli remains profile-probed while zstd and archive/media formats
  need explicit adapters and decompression-bomb limits;
- WebSocket is the interoperable realtime adapter but has no Streams-style
  backpressure, so queues and `bufferedAmount` are bounded;
- WebTransport is a required-forward low-latency transport profile and WebRTC
  is an optional peer/media adapter; both name endpoints/peers, privacy,
  teardown and resource limits and neither enters guest correctness;
- WebSocket, WebTransport, WebRTC and direct HTTP are separately disclosed
  live-network profiles, never ambient App authority; and
- BCP 47, IANA registries, Unicode data, MIME registrations and codec
  registries are pinned or observed inputs whose drift is explicit.

Static/IPFS correctness cannot require response rewriting, middleware, API
routes or a reverse proxy. Capabilities that require headers or a cooperating
origin enter only the delivery profiles that can actually supply them.

Verified reads also require readable bytes. A `no-cors` request yields an
opaque response whose status, headers and body cannot establish EFS byte
integrity. A browser carrier therefore supplies readable CORS bytes or fails
with a typed transport result. Verify bytes before decoding. The accepted EFS
representation/profile—not a gateway charset or browser sniff—selects the
canonical text encoding; new canonical text formats use UTF-8 with fatal
decoding unless they explicitly specify otherwise. Preserve raw bytes,
protocol media type, transport `Content-Type` and computed/sniffed presentation
type separately, and keep HTML/SVG/unknown active types inert.

## Device and host-OS portals

The browser already exposes a large hardware and host-integration surface. EFS
should not hide it behind generic ambient “device access.” Each family is a
typed, revocable module service with an exact purpose, gesture/permission and
construction profile:

| Surface | Disposition | EFS use and boundary |
|---|---|---|
| Clipboard, Web Share, local file pickers and drag/drop | **Required host-portal family** | Copy/export/import/share only after a trusted Shell action. Untrusted content never writes the clipboard, opens a picker or converts a local handle into public/package state by itself. |
| Fullscreen, Pointer Lock, Screen Orientation, Wake Lock and Gamepad | **Required forward for named media/game profiles** | Shell-owned controls and runner construction declare eligibility, transient activation, focus and teardown. They are not transferable capabilities and ordinary Files browsing needs none. |
| Media Capture/Streams, Screen Capture, Web Audio/AudioWorklet and WebRTC | **Specialized communication/media profiles** | Typed microphone/camera/screen/audio/peer services with visible recording state, exact device/privacy policy, resource budgets and teardown. Permission never becomes an App's permanent OS grant. |
| WebHID, WebUSB, Web Serial, Web Bluetooth, Web NFC and Web MIDI | **Specialized forward device profiles** | Valuable for owner-selected hardware Apps and future native bridges. Every operation remains chooser/permission/capability scoped; unsupported platforms return a named profile result rather than shrinking the generic architecture. |
| Geolocation, Generic Sensor APIs, device orientation and WebXR | **Specialized spatial/context profiles** | Explicit high-privacy capabilities with sampling, lifetime, background and disclosure limits. No cold guest probe and no inferred identity or admission fact. |
| Notifications, Push, Badging and related background affordances | **Optional installed-App services** | User-controlled reminders and explicit subscribed events. Delivery is unreliable, endpoint-bearing and not semantic completeness, authorization or an action receipt. |

Third-party Apps receive these only through the runner/profile ceiling and
effective-grant calculation. Browser permission state is observed again at
use; revocation fences future host calls, while already released external
effects remain receipt-visible and cannot be undone by deleting a grant.

## Negative selections and non-solutions

- Do not build a private virtual DOM, application framework, router, design
  system runtime, state store or permission API merely because old platform
  advice assumed one was necessary.
- Do not expose Signals, Lit, Web Awesome, a CSS syntax revision, import maps,
  Wasm/Component/WASI adapters, WebMCP, WebGPU or WebNN in durable EFS data or
  public capability contracts.
- Do not treat Shadow DOM, ShadowRealm, SES, Wasm, a Worker, an opaque iframe,
  CSP, Trusted Types or Permissions Policy as complete malicious-code isolation.
- Do not use Fenced Frames, attribution APIs, private state tokens, FedCM,
  identity credentials, client hints or device sensors in the generic guest
  path merely because they are Web standards. They need a named product need,
  privacy analysis and explicit action.
- Do not make browser installability, a Service Worker, a cache hit, persistent
  permission, non-extractable key, app handler registration or stable origin
  into identity, durability, authority or acceptance.
- Do not use current browser support as the sole reason to reject a product-
  useful standard, and do not use proposal status as the sole reason to ship it.

## Acceptance program

1. **Corpus refresh.** Re-pin the umbrella/proposal catalogs, reproduce the
   index, diff added/removed/status-changed rows and review every selected or
   security-relevant change before a Web Profile release.
2. **Forward-feature kill matrix.** Disable each required-forward/enhancement
   feature independently. Preserve the journey or return its exact
   reduced/unsupported/rescue result; no blanket “old browser” fork.
3. **Cold guest performance.** Test no cache/Worker/account, stable HTTPS,
   nested-prefix static host, CID-subdomain and loopback. Record transferred
   critical bytes, requests, parse/evaluate, Worker startup, layout and first
   trustworthy data. No route imports the whole OS or unrelated App graph.
4. **Parse/build matrix.** Load every output in the declared engine profile.
   Signals, `using`, new imports, CSS syntax and component proposals cannot
   break parsing before profile selection/fallback.
5. **Security-header matrix.** Run portable static/meta-only and cooperating
   header-controlled profiles. Prove CSP/Trusted Types/SRI/COOP/COEP/
   Permissions-Policy claims exactly and label unavailable controls.
6. **Storage/update recovery.** Evict Cache/IDB/OPFS/buckets independently;
   crash every journal/migration/Service Worker/App acceptance step; exercise
   update refusal, rollback, export/import and cross-origin reconstruction.
7. **Input/a11y/global matrix.** Real keyboard, touch, pen, IME, RTL, mixed
   bidi, CJK/Indic/emoji, 400% zoom, text spacing, forced colors, reduced
   motion and native AT/browser pairings. `@supports` and automation alone do
   not pass.
8. **App isolation matrix.** Hostile Worker/SES, opaque iframe and Wasm fixtures
   attack egress, storage, DOM, late messages, CPU/memory, teardown, closure
   TOCTOU, CSP and grant widening. Labels match measured residuals.
9. **Compute/media/device/agent matrix.** GPU loss and nondeterminism, NN/model
   unavailability, codec absence, stream/backpressure errors, Component/WASI
   adapter skew, denied/revoked device portals, capture/permission teardown and
   WebMCP injection/cancellation all preserve typed outcomes and EFS authority.
10. **Independent standards review.** A reviewer verifies primary source,
    exact revision/status, product disposition, library cost, privacy effects,
    fallback and measured fixtures. A tool or guidance recommendation is never
    accepted by default.

## Pressure findings and open research

The census did not find a Web standard that forces a new EFS Core or Files
noun. It did expose product work that must be completed before implementation
freeze:

- exact first `EfsWebProfileV0` feature and engine/AT matrix;
- exact Signals proposal/polyfill revision and native-versus-Lit benchmark;
- browser-header delivery matrix for stable origins, IPFS gateways, GitHub
  Pages and loopback, including cross-origin isolation and full CSP;
- trusted-bootstrap experiment for a mutable stable origin versus a
  client-verified immutable release or separately signed bootstrap manifest;
- exact import-map/SRI/module-graph integrity experiment for release-owned code;
- Navigation API, Popover/commands, `@scope`, container query, anchor,
  customizable-select and safe-HTML hostile fixtures;
- Storage Buckets/OPFS/Service Worker generation and recovery experiment;
- initial Wasm 3 feature set, Component/WIT adapter, WASI 0.3/0.2 profiles and
  Cross-Origin-Isolated Compute target;
- WebMCP projection over EFS Actions/Plans/Receipts plus injection and
  cancellation fixtures; and
- real global-use/browser/AT matrices, pinned Unicode/CLDR/MF2 data and exact
  supported message-function subset.

These are mechanism and engineering-evidence questions. The owner-level
product direction—standards-first, forward, global, accessible, private,
installable, modular and agent-first—is already clear.
