# Web Client / OS Web-platform standards screen

**Status:** complete first evidence screen at pinned 2026-08-23 sources; this is not a frozen browser support matrix, implementation selection, or claim that every standard is adopted
**Scope:** HTML, DOM, URL, Fetch, CSS, ECMAScript, internationalization, accessibility, PWA, storage, security/privacy, Workers, media, devices, WebAssembly/WASI/Component, compute and agent-facing Web standards
**Feeds:** [[Designs/web-client-os/web-platform-standards-and-forward-profile]], [[Designs/web-client-os/technology-foundation]], [[Designs/web-client-os/architecture-and-modules]], [[Designs/web-client-os/mvp-and-acceptance]], [[Designs/web-client-os/privacy-and-agents]]
**Reviewed:** 2026-08-23

#status/done #kind/review #repo/planning #repo/client #repo/sdk #topic/web-platform #topic/pwa #topic/accessibility #topic/i18n #topic/privacy #topic/wasm #topic/agents

## Outcome

The broad Web corpus supports a modern, framework-light EFS Web Client/OS. It
does not support either extreme of “use only widely available features” or
“every incubation is safe to depend on.” The strongest direction is:

1. Keep the direct guest/rescue spine on semantic HTML, DOM/URL, modern CSS,
   ESM, dedicated Workers where useful, Fetch/Streams, structured clone,
   common WebCrypto, versioned data and a selected Core Wasm feature set.
2. Select valuable forward shapes now—TC39 Signals, Navigation API,
   URLPattern, current CSS, Temporal, explicit resource management, modern
   scheduling, install/offline APIs, WIT/Component/WASI, WebGPU/WebNN and
   WebMCP—behind versioned profiles and adapters.
3. Treat browser shipment, standards maturity, product criticality, privacy
   effect and authority as independent facts. A missing Safari implementation
   is not an architectural veto; a Chromium implementation is not a standard
   or a security proof.
4. Keep static/IPFS guest correctness independent of a Service Worker,
   cross-origin isolation, security response headers, installed-PWA state,
   wallet discovery, local cache, GPU/model, or third-party App runtime.
5. Use new native mechanisms where they remove private framework machinery,
   while retaining a semantic reduced/rescue path rather than a separate old-
   browser product.

The resulting product map is
[[Designs/web-client-os/web-platform-standards-and-forward-profile]]. No Web
standard found in this pass requires a new EFS Core or Files noun.

## Source inventory and reproducibility boundary

The generated TSV is reproducible over exactly four pinned catalog inputs:
`browser-specs`, TC39 proposals, WebAssembly proposals and WASI proposals.
The wider primary-family review uses additional pinned or versioned sources,
but those are not rows in the generator. [[source-lock.tsv]] records that
boundary for every claimed input; [[selected-status-ledger.tsv]] records the
decision-relevant maturity and EFS disposition for selected features. The W3C
TR response is hash-and-count evidence only: it was not retained in this vault,
so the dated 1,236/288 observation is not independently reconstructible from
this commit.

| Source | Exact revision/snapshot | Role in the screen |
|---|---|---|
| [`w3c/browser-specs`](https://github.com/w3c/browser-specs) | [`ed32e90`](https://github.com/w3c/browser-specs/commit/ed32e90108908ce4f3c886cb343dc4e4f87c360c), 2026-08-21 | Curated machine-readable umbrella of technical Web specifications, current series, organizations, standing, source repositories and WPT paths |
| [W3C Technical Reports](https://www.w3.org/TR/) | downloaded 2026-08-23; SHA-256 `3fd7f1cd20bcfae2c5444aca92d6b5668d350701450d14f80760765a2a0b2a52` | Publication-history/backstop: 1,236 reports across 288 families at retrieval |
| [`tc39/proposals`](https://github.com/tc39/proposals) | [`600a427`](https://github.com/tc39/proposals/commit/600a4278a7cabcb53915fa97296b5688529ddd07), 2026-07-23 | ECMAScript and ECMA-402 active Stage 0–3, finished and inactive proposal inventory, including Signals and Compartments |
| [`WebAssembly/proposals`](https://github.com/WebAssembly/proposals) | [`f0db14a`](https://github.com/WebAssembly/proposals/commit/f0db14a5555abf7b931667fd289755124a3bf37e), 2026-08-10 | Core/JS/Web API proposal phase and finished/inactive inventory |
| [`WebAssembly/WASI`](https://github.com/WebAssembly/WASI) | [`3071db0`](https://github.com/WebAssembly/WASI/commit/3071db04c857b3a2c047d3d1ac694bc41f021796), 2026-08-18 | WASI proposal phases, 0.3.1 specifications and release process |
| [`WebAssembly/component-model`](https://github.com/WebAssembly/component-model) | [`1af0b35`](https://github.com/WebAssembly/component-model/commit/1af0b35e1bfc03bd4ad9603be2f676316ff9f420), 2026-08-22 | WIT, Canonical ABI, concurrency, resource and browser-adapter target evidence |
| [`web-platform-dx/web-features`](https://github.com/web-platform-dx/web-features) | [`7a18cb4`](https://github.com/web-platform-dx/web-features/commit/7a18cb476688e853b3e82938a33782497ec89a0c), package `3.35.1`, 2026-08-21 | 1,189 source feature definitions and Baseline implementation evidence; never normative/product authority |
| [`mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data) | [`493cef4`](https://github.com/mdn/browser-compat-data/commit/493cef41d0f0de67c5eafe2cf84413850cd4de90), package `8.0.12`, 2026-08-21 | Shipping-discovery and drift evidence; never sufficient conformance evidence |

The W3C catalog describes its `standing` field as a rough maintenance/scope
signal, not standards maturity. Its `nightly.status` often reports “Editor's
Draft” even when the same series has a Recommendation or Candidate
Recommendation snapshot. The generated corpus therefore exposes separate
`editor_status`, `published_status`, `published_date`, `published_url` and
proposal-stage columns. Missing catalog publication data is `UNKNOWN`, and the
manually verified selected-feature status lives in
[[selected-status-ledger.tsv]] rather than being inferred from editor status.
That ledger keeps a stable W3C series URL separate from the exact dated `This
Version` snapshot and status date. Its regression test rejects a
`PRODUCT_REVIEWED` W3C row without both pieces.

### Exact WHATWG anchors used for the core

| Living Standard | Repository HEAD on 2026-08-23 |
|---|---|
| HTML | [`508a037`](https://github.com/whatwg/html/commit/508a037333d8a1806504303aeb489d931fabbef6) |
| DOM | [`94d41b3`](https://github.com/whatwg/dom/commit/94d41b30c97fe086c76be8a692ff74ed4db08407) |
| URL | [`55d6699`](https://github.com/whatwg/url/commit/55d6699373ba68a16ec182f34222a74ed8bc3dac) |
| Encoding | [`a985b62`](https://github.com/whatwg/encoding/commit/a985b62a9b45c17da3e17a9f0a0b4e30c34c4a8a) |
| MIME Sniffing | [`39aa535`](https://github.com/whatwg/mimesniff/commit/39aa53511b13953d84fef8d4131d6f61d0ccbde6) |
| Fetch | [`4a2b67d`](https://github.com/whatwg/fetch/commit/4a2b67d0d5ea7942ff80f6fcc3da3d587c03d0ce) |
| Streams | [`b9ba9f4`](https://github.com/whatwg/streams/commit/b9ba9f49d95b4280be0dc2372377a006c3a91c18) |
| WebSockets | [`9879e5c`](https://github.com/whatwg/websockets/commit/9879e5cf0d66c66af6990e4c75f72dda794e1b87) |
| Storage | [`1933f42`](https://github.com/whatwg/storage/commit/1933f424de8d0b2d1073e10f3fb77bd12b11efca) |
| File System | [`cd55e55`](https://github.com/whatwg/fs/commit/cd55e5582e9c915c6341479bceaa4216f7a05413) |
| Fullscreen | [`7c38d77`](https://github.com/whatwg/fullscreen/commit/7c38d773117aa1e6bfa13754afe77483f40c908f) |
| URLPattern | [`aeb2019`](https://github.com/whatwg/urlpattern/commit/aeb2019cf3aa1fb31af134a682c0255302a41297) |

## Corpus coverage

The generated [[corpus-index.tsv]] contains 1,228 rows:

| Catalog lane | Rows |
|---|---:|
| W3C `browser-specs` umbrella | 807 |
| TC39 ECMAScript proposals | 294 |
| TC39 ECMA-402 proposals | 35 |
| WebAssembly proposals | 61 |
| WASI proposals | 31 |

The 807 umbrella specifications break down by owner as follows:

| Organization | Count |
|---|---:|
| W3C | 607 |
| Ecma International | 56 |
| IETF | 54 |
| Khronos Group | 47 |
| WHATWG | 22 |
| Alliance for Open Media | 7 |
| W3C/OGC | 7 |
| FIDO Alliance | 3 |
| ISO/IEC | 3 |
| CompuServe Incorporated | 1 |

The umbrella marks 736 entries `good`, 7 `pending`, and 64 `discontinued` at
the pinned revision. The supplemental catalogs contribute 421 rows, including
115 finished/standardized proposals, 57 inactive/withdrawn rows, 187 active
TC39 Stage 0–3 rows and 62 active Wasm/WASI Phase 0–5 rows.

The index records catalog, ID, umbrella/supplement relation, canonical URL,
title, separate editor/proposal/published maturity fields, standing,
organization, browser-target flag, series, repository, test paths,
high-recall discovery tags, explicit `CATALOG_INGESTED` review state, source
file and a hash of the source catalog object
or proposal-table row. It does not hash the linked specification body. Two
source proposals have genuine unresolved/TBD links and carry `UNKNOWN_URL`
rather than a false blank canonical URL. Its SHA-256 in this review is:

```text
f5a7bd453d10a2f1fe21066ac628e0080ed31465a704bce2f300b3e558eecf1b
```

Supplemental rows deliberately overlap the umbrella. For example, a TC39
proposal may appear once as a current spec and again in the committee's stage
table. The review preserves both observations instead of manufacturing one
“unique standard” count with ambiguous maturity.

## Reading method

The Web corpus is more decentralized and much larger than the EIP/ERC source
tree. This pass used five stages:

1. **Complete catalog ingestion.** Every entry in the pinned umbrella and
   proposal registries was ingested, normalized, tagged and hashed into the
   index. Discontinued and inactive work stayed visible.
2. **High-recall family screen.** Titles, shortnames, groups, owners, source
   repositories, statuses, WPT paths and proposal rows were screened for
   document/UI, loading/navigation, storage/files, security/privacy,
   accessibility/i18n, modules/execution, graphics/media, network/realtime,
   device/input, performance, installed/offline, agent and ML relevance.
3. **Primary-specification review.** Independent domain passes reviewed the
   current normative or proposal text for HTML/runtime/storage/network;
   CSS/accessibility/input/Unicode/i18n; and ECMAScript/Wasm/WASI/compute/
   agents. Security/privacy/IETF implications were reconciled across them.
4. **Forward-value pass.** Newness did not suppress a candidate. Stage 1
   Signals, WICG scheduling/storage, current CSS, Navigation API, Component
   Model/WASI, WebGPU/WebNN and WebMCP were evaluated for product value and an
   honest adapter/profile, not rejected by age or Baseline.
5. **Negative-evidence pass.** Service Workers, caches, install state,
   permissions, origins, import maps, integrity, Workers, realms, sandboxes,
   Wasm, GPU/NN and WebMCP were checked specifically for false identity,
   authority, safety, durability, completeness and privacy claims.

This is complete metadata ingestion for the four named catalogs plus a
high-recall, manually selected primary-family review. It is not a claim that
every linked specification body was fetched, hashed or read paragraph by
paragraph, nor that all 1,236 W3C publication snapshots received equal manual
commentary. Product-relevant families received semantic and security review;
the retained index makes omissions inside the four catalogs auditable, while
the selected ledger makes reviewed product dispositions explicit.

## Candidate families reviewed

The high-value review covered at least these families and their linked levels,
registries or proposals:

- WHATWG HTML/DOM/URL/Encoding/MIME/Fetch/Streams/Storage/File System,
  navigation/history, module/import maps, Workers, structured clone,
  messaging, forms, custom elements, shadow DOM, dialog/popover, safe HTML,
  canvas/media and user activation;
- CSS Snapshot 2026, Cascade 5/6, Grid 1/2/3, Flexbox, Conditional 5,
  Container Queries, Nesting, Scoping, Logical Properties, Writing Modes,
  Media Queries 4/5, Anchor Positioning, View Transitions, Scroll Animations,
  Color 4/5, Fonts/Text, Shadow Parts, Forms, environment/viewport and
  containment;
- ECMA-262/402, Signals, Temporal, explicit resource management, decorators,
  ShadowRealm, Compartments/SES, module phase/import/evaluation work,
  MessageFormat-related proposals, clone/transfer and scheduling;
- Manifest, Service Workers, IndexedDB, Cache, OPFS, StorageManager, Storage
  Buckets, Web Locks, Background Fetch/Sync, install/launch/file/protocol/share
  handlers and Window Controls Overlay;
- CSP, Trusted Types, SRI, Permissions Policy, Secure Contexts, mixed content,
  Referrer Policy, Fetch Metadata, CORP/COOP/COEP, sandbox/credentialless
  iframes, WebCrypto, GPC, Privacy Principles and fingerprinting guidance;
- WebAssembly 3.0 features/proposals, WIT, Canonical ABI, Component Model, WASI
  0.2/0.3, shared memory/threads, WebGPU/WGSL, WebNN, browser model APIs,
  WebCodecs, OffscreenCanvas and AudioWorklet;
- WCAG 2.2/3, ARIA 1.2/1.3, ARIA in HTML, APG, ARIA-AT, Pointer/UI/Input
  Events, IME/composition and real AT evaluation requirements;
- Unicode 17, UAX 9/15/29, UTS 35/39/46, CLDR 48.2, BCP 47/IANA language
  registry, RFC URI/IRI/IDNA and WHATWG URL; and
- WebSocket/WebTransport/WebRTC, HTTP semantics/cache/range/digest/integrity,
  Compression Streams, device portals and WebMCP.

## Material status corrections and discoveries

### Modern JavaScript and portable computation

- [Temporal](https://tc39.es/proposal-temporal/) and
  [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management)
  reached TC39 Stage 4 in May 2026 and are expected in ECMAScript 2027. EFS can
  use their standard shapes now through exact build/profile adapters.
- Signals and Compartments remain Stage 1. Signals are still owner-selected as
  the state shape; proposal objects do not become public state ABI. SES remains
  one runner realization, not native process isolation.
- Source Phase Imports, deferred module evaluation, Import Text and Dynamic
  Code Brand Checks are Stage 3; related phase/import-bytes/module work remains
  earlier. They are useful loader experiments, not a reason to postpone the
  verified exact-closure loader.
- WebAssembly 3.0 completed in September 2025, but product profiles still name
  individual features. Component Model remains a Phase 1 strategic target and
  a browser adapter is part of `RunnerRealization`.
- WASI 0.3.1 is now released. Its async/stream/future and WIT evolution deserve
  a first-class forward profile while 0.2 remains a separate compatibility
  realization. Neither implies ambient POSIX authority.

### CSS, controls and global presentation

- Current CSS supplies enough native layout, scoping, responsive behavior,
  overlays and animation to avoid a JS layout framework. Grid/subgrid,
  container queries, cascade layers, `@scope`, nesting, logical properties,
  current color and preference queries should shape the source architecture.
- Anchor positioning and view/scroll transitions are valuable enhancements,
  not unique carriers of state or focus.
- Customizable select remains version-sensitive: the HTML/CSS Forms and Open
  UI syntax/behavior have not fully converged. Keep an ordinary native
  `<select>` contract while running the modern form in an exact profile.
- [MessageFormat 2](https://www.unicode.org/reports/tr35/tr35-78/tr35-messageFormat.html)
  is now normatively stable in UTS 35 Part 9. The implementation, compiler,
  function subset, catalog provenance and locale data still need EFS fixtures.
- Unicode 17, CLDR 48.2, UAX/UTS data and ECMA-402 drift independently. Pin
  data where output is cached or receipted and keep every result presentation-
  only.

### HTML, navigation, install and storage

- Navigation API and URLPattern now have meaningful multi-engine evidence and
  are appropriate required-forward adapters. Hash/History routes remain the
  static-host correctness contract.
- Declarative Shadow DOM, OPFS, Web Locks, autonomous custom elements and many
  core Worker/storage facilities have strong shipping evidence. Their support
  does not make Shadow DOM a security boundary, Web Locks a durable fence, or
  OPFS sovereign custody.
- Manifest installation remains UA-controlled and the spec remains a Working
  Draft. `beforeinstallprompt` is not a standard install contract.
- A Service Worker can terminate at any time and cannot atomically accept an
  EFS App/System generation by itself. The direct guest and foreground write
  lanes must pass without control.
- Storage Buckets, scheduling APIs and several OS-integration handlers remain
  WICG/draft work. Their semantics are still valuable enough for named forward
  adapters with IDB/Cache/OPFS/ordinary-task reduced paths.

### Security, privacy and verified reads

- A `no-cors` fetch returns an opaque response whose status, headers and bytes
  cannot support EFS verification. Verified carriers need readable CORS or
  another reader capable of exposing exact bytes.
- Verify bytes before text decoding. Signed/canonical text profiles require a
  declared encoding and fatal decode; replacement characters cannot silently
  alter authenticated data.
- A static bundle cannot synthesize all top-level CSP, COOP/COEP/CORP or other
  response headers. Header-controlled and portable-static delivery profiles
  must make different claims.
- CSP, Trusted Types, SRI, import-map integrity, sandbox and Permissions Policy
  provide distinct defenses. None supplies EFS authority or repairs a
  compromised mutable first document.
- Feature enumeration, permission queries, high-resolution timing, WebRTC,
  GPU/NN and device APIs add fingerprinting/network surface. Probe only for a
  route or explicit action and keep telemetry local by default.

## Architecture implications

1. **A profile ledger is mandatory.** Each selected feature records exact
   source/status, purpose, syntax/build requirement, detection plus semantic
   probe, privacy/permission/header prerequisites, full/reduced/unsupported/
   rescue behavior and measured engine/device/AT evidence.
2. **The source can be modern without breaking boot.** Polyfills and build
   transforms preserve standards-shaped source/interfaces. Unsupported parse-
   level syntax stays out of the guest-critical target until its output profile
   can parse it.
3. **Navigation is transactional but authority is not restorable state.**
   Back/forward cache, prerender, session restore and Navigation API replay do
   not recreate App execution, grants, wallet authority or stale action plans.
4. **Workers are topology, not confinement.** Dedicated Workers are the main
   service/compute lane, but host capability boundaries, budgets, termination,
   generation fences and exact package verification remain required.
5. **Cross-origin isolation is a separate product profile.** Shared memory and
   Wasm threads require real response headers across the graph. Direct guest
   and ordinary static/IPFS deployments do not depend on it.
6. **PWA state is local realization.** Manifest, Service Worker, cache, IDB,
   OPFS, bucket, file-handler and installed-window state never become EFS
   identity, completeness, authority or package acceptance.
7. **Media/device/network APIs are typed portals.** Clipboard, share, files,
   fullscreen, pointer lock, gamepad, sensors, WebSocket/WebTransport/WebRTC,
   capture and hardware APIs require explicit host policy, gesture/permission,
   resource limits, teardown and privacy evidence.
8. **Accessibility and global use constrain every profile.** Native semantics,
   DOM order, keyboard/touch/IME, real AT, zoom, forced colors, reduced motion,
   RTL/bidi, grapheme and locale/message fixtures are release evidence, not a
   post-MVP polish pass.

## Catalog-index reproduction

Using Node.js `v26.0.0` (the verified generation environment) and checkouts at
the four pinned generator-input revisions above:

```sh
node build-index.mjs \
  /path/to/w3c-browser-specs \
  /path/to/tc39-proposals \
  /path/to/webassembly-proposals \
  /path/to/webassembly-wasi \
  corpus-index.tsv
shasum -a 256 corpus-index.tsv
```

The generator has no package dependency and uses deterministic code-point
ordering. Run `node --test build-index.test.mjs` before regeneration. Its
title/group tags are coarse discovery aids, never product dispositions. Exact
adoption comes from [[selected-status-ledger.tsv]], the design map and EFS
fixtures. This procedure does not reproduce the wider manual primary-family
review; [[source-lock.tsv]] labels each supplemental input accordingly.

## Limits and refresh rule

- Specification status and catalog standing do not prove implementation.
  Baseline/BCD/web-features do not prove focus, AT, privacy, delivery-header,
  storage, permission, failure or security behavior.
- Browser releases, WICG and TC39/Wasm stages, Unicode/CLDR data, Wasm/WASI
  features, app-install policy and device APIs move quickly. Re-pin before a
  repository/public API/storage/runtime freeze.
- This pass did not authorize a product repository, package, polyfill, App
  runner, Service Worker, storage schema, browser target or security-header
  claim.
- Real browser/device/AT and hostile runtime/storage/network fixtures remain
  the implementation gate. The first generated profile must name concrete
  engines/builds and negative outcomes rather than saying “modern browser.”
- Stronger trusted bootstrap for a mutable stable origin remains unsolved by
  the standards corpus. This deserves a focused experiment, not a hidden
  assumption.
