# Fuchsia component framework, sessions, resolvers/runners; intent routing — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** fuchsia-components. **Date:** 2026-07-07.

## TL;DR

Fuchsia Component Framework v2 is the most complete deployed answer to exactly the problem EFS client v2 faces: describe every piece of software with a declarative manifest, give it *nothing* by default, route every capability explicitly through a tree of sandboxes, make "how do I find the code" (resolvers) and "how do I execute the code" (runners) pluggable capabilities themselves, and deliver everything as content-addressed blobs under signed TUF metadata. The architecture shipped and works — on three smart displays. The product ambition collapsed (16% layoffs Jan 2023, workstation and Chrome port killed, speakers abandoned), which is itself the most important lesson: capability purity survived contact with reality; a from-scratch OS as a *product* did not. Android intents are the deployed precedent for user-action routing at billions-of-devices scale, and their 15-year security retrofit (implicit intent hijacking → `exported` mandatory → verified App Links → Android 15/16 "Safer Intents") is a complete catalog of what happens when routing is open-world and insecure by default.

---

## 1. WHAT EXISTS TODAY (shipped)

### 1.1 Component Framework v2 core model

Source: fuchsia.dev components v2 intro + capabilities docs (live docs, fetched 2026-07-07).

- A **component** is "the common abstraction that defines how all software is described, sandboxed, and executed." Identity = component URL + manifest; instances live in a tree of **realms** (a component + its children = an encapsulation boundary), addressed by **monikers**.
- **Zero ambient authority is literal**: "When a program is initially created, it does not have the ability to do anything — not even to allocate memory." Everything arrives as a capability in the component's namespace, brokered by `component_manager`.
- **A component can interact with the system and other components only through the discoverable capabilities in its namespace.** This is the Fuchsia sentence to tattoo on the EFS Kernel.

### 1.2 CML manifests

- Source format: **CML**, JSON5 files (`.cml`), compiled by `cmc` into binary FIDL **`.cm`** declarations shipped inside the package. Manifest covers: `program` (runner + runner-specific args), `children` (static), `collections` (dynamic), `capabilities` (what this component provides), `use` / `offer` / `expose` (routing), `environments`, `facets` (freeform metadata), `config` (structured config schema). Shards/includes let platform teams publish reusable manifest fragments.
- Routing grammar: **`use`** = capabilities this instance needs in its namespace (from parent); **`offer`** = grant to a child or collection; **`expose`** = surface to parent. A parent may not `use` what a child merely `expose`s in a way that creates parent↔child cycles; `dependency: "weak"` exists for deliberate cycles, and weak-capability consumers "should be programmed to operate correctly if the weak capability… goes away."
- **Capability types** (all first-class, all routable): `protocol` (FIDL channel), `service` (directory of instances), `directory`, `storage` (isolated writable dir per component), `dictionary` (a capability that bundles other capabilities — capability structs), `runner`, `resolver`, event streams, config.

### 1.3 Environments: the resolver/runner distribution channel

Source: fuchsia.dev environments doc.

- Environments configure **runners and resolvers** (plus stop timeouts/debug). Unlike capability routing (explicit at every edge), **environments propagate down the tree automatically** — extend modes `REALM` (inherit + override) or `NONE` (start empty). Rationale stated in docs: "almost every component needs to use a runner," so per-edge routing would be noise; new runners are rare.
- The root environment comes from component_manager itself: bootstrap resolver + ELF runner.
- **This two-channel design is the key architectural idea to steal**: *infrastructure* (how to load/run code) flows implicitly through environments; *authority* (what the code may touch) flows explicitly through use/offer/expose. Fuchsia deliberately refused to blur them.

### 1.4 Resolvers

Source: fuchsia.dev resolver capability doc.

- A resolver is a component implementing `fuchsia.component.resolution.Resolver`, registered in an environment **against a URL scheme**. Component manager matches the scheme of a component URL to a resolver in the requesting realm's environment.
- A successful resolution returns **two things: the `ComponentDecl` (the manifest) and a `fuchsia.io.Directory` handle to the package contents**. Manifest and content root travel together — a resolved component is (declaration, content closure), not just bytes.
- Built-ins: `boot_resolver` (`fuchsia-boot://`, from the boot image, pre-networking), `base_resolver` (`fuchsia-pkg://` limited to on-device base set), `full-resolver` (`fuchsia-pkg://` with ephemeral/network resolution). Same scheme, different trust/availability tiers — the tier is chosen by which resolver your environment gives you, not by the URL.
- Security: components can only load code via resolvers their environment explicitly provides — code provenance is itself a routed capability.

### 1.5 Runners

Source: fuchsia.dev runner capability doc.

- A runner implements `fuchsia.component.runner.ComponentRunner`; component manager sends `Start(ComponentStartInfo)` containing the **resolved URL, the `program` block (runner-specific, opaque to the framework), and the namespace derived from the component's `use` declarations**; lifecycle flows back over a `ComponentController` channel.
- The manifest's `program` block belongs to the runner: `runner: "elf", binary: "bin/example"` for ELF; a web runner interprets it differently. The framework is runtime-agnostic by construction.
- Shipped runners: **ELF** (built-in), **driver runner**, **web (Chromium) runner** (http(s) component URLs run in a web runner), and **Starnix** — a runner that executes **unmodified Linux binaries** by emulating the Linux ABI in a Fuchsia userspace process (RFC-0082 accepted 2021; still actively developed — starnix concepts page updated 2026-01-22, starnix containers page 2025-12-18; RFC-0261 "fast and efficient user space kernel emulation" continues the line). Starnix proves the runner abstraction is strong enough to host an entire foreign OS personality as "just another runner."

### 1.6 Component URLs

Source: fuchsia.dev component URL reference.

- `fuchsia-pkg://<repo-hostname>/<pkg-name>[/<variant>][?hash=<pkg-hash>]#meta/<component>.cm` — the `?hash=` pins an exact content-addressed package version; the fragment names the manifest inside it.
- `fuchsia-boot:///#meta/driver_manager.cm` for pre-package-system boot components.
- **Relative URLs**: `child#meta/default.cm` resolves a **subpackage** *in the context of the parent's package* (hash looked up in the parent's `meta/fuchsia.pkg/subpackages`), and `#meta/child.cm` names another manifest in the same package. Relative = hermetic: a parent ships its children's exact versions.

### 1.7 Realms and collections (dynamic apps)

Source: fuchsia.dev realms doc.

- Static `children` are declared in the manifest (auditable at build time). **`collections`** hold dynamic instances created at runtime via the `fuchsia.component.Realm` framework protocol — this is how "the user opened an app" is modeled. Collection durability: `transient` (destroyed when parent stops) or `single_run`.
- One `offer` to a collection grants the capability to *all* members — collections are the unit of "apps of this class get this capability set." Collections can also be assigned their own environment (own resolvers/runners).

### 1.8 Structured configuration

Source: fuchsia.dev structured config doc; RFC-0127 (accepted 2021), RFC-0146 (schemas in CML), RFC-0158 (accessors), RFC-0173 (CF APIs).

- Config schema is declared **in the manifest** (`config: { greeting: { type: "string", max_size: 512 } }`); types are closed (bool/ints/string+max_size/vector+max_count). Values are compiled to `.cvf` files, validated against the schema at build/assembly time, and delivered with the package; a field can declare `mutability: ["parent"]` to accept overrides from the parent at launch.
- Runtime access is one call (`Config::take_from_startup_handle()`); "Component Framework only starts components with valid configuration"; values are inspectable with `ffx`. Config is data with a schema and provenance, not a mutable settings file.

### 1.9 Package delivery: content-addressed blobs + TUF

Source: fuchsia.dev packages concept + software update system docs; RFC-0212.

- A package = `meta.far` (metadata archive: `meta/package` identity, `meta/contents` mapping human names → blob merkle roots, `meta/fuchsia.pkg/subpackages`) + content blobs. **Every blob is named by its Fuchsia Merkle root**; the package's identity is the merkle root of its `meta.far`. Blobs live in **blobfs**, a write-once content-addressed filesystem: automatic cross-package dedup + hash verification on read.
- **Package sets**: **base** (immutable-at-runtime OS foundation, version anchored to the product release, updated only via OTA), **cache** (on-device, evictable, being deprecated per RFC-0212), **universe** (on-demand from a repository; RFC-0212, accepted 2023-03-07, proposes renaming to "discoverable" and defines a 2-axis framework: version control {anchored/upgradable/discoverable} × availability {permanent/automatic/on-demand}). Critically: **today only base package contents are executable in production** — executability is a per-set policy decision.
- **Repositories are TUF** (The Update Framework v1.0) with Fuchsia extensions: each TUF target carries the package's **merkle root in custom metadata**, tying the signed-metadata freshness/role machinery of TUF to content addressing; targets are `PACKAGE/VARIANT` paths. TUF supplies what content addressing alone cannot: *freshness, rollback protection, and key-role separation*.
- **Subpackages** give hermetic nested dependency closures ("subpackages always accompany their parents"), isolated `/pkg` namespaces, no version skew.

### 1.10 Session framework

Source: RFC-0092 (accepted 2021-05-05), session roles-and-responsibilities doc, RFC-0189 (accepted 2022-09-20).

- The **session is the root component of the product's user experience** — "the most privileged non-platform component." Platform `session_manager` reads boot config, launches the session, offers it a fixed capability set (identical across products, so security audit is uniform). Restarting UX = destroy/recreate the session without touching platform services.
- Placement rule worth quoting: components live **outside** the session if their capabilities should be consistent across all products (Scenic, input pipeline); **inside** if they define this product's experience. Session responsibilities: launch/manage product components, view presentation via GraphicalPresenter, input handler chains, lifecycle.
- **Churn warning**: the "element" role (session-framework concept for a graphical component, managed by Element Manager) was **deprecated by RFC-0189**; "the current element manager functionality becomes the job of the product session," and window management got re-split as platform=mechanism (rendering/input) vs product=policy (placement/focus), with the compatibility goal "an application that works with one Fuchsia product should work with any other… that supports the same set of windowing capabilities." Fuchsia redesigned its shell-level app-hosting API *twice* in three years while the kernel-level component framework stayed stable.

### 1.11 Android intents: the deployed routing precedent

Source: developer.android.com intents-filters guide, implicit-intent-hijacking risk page, App Links verification guide (all live docs, fetched 2026-07-07).

- Intent = optional component name (explicit) or {action, data URI+MIME, categories} (implicit) + extras + flags. Implicit resolution = three sequential tests against manifest-declared `<intent-filter>`s: **action** (intent's action ∈ filter's actions), **category** (every intent category ⊆ filter categories; `CATEGORY_DEFAULT` mandatory to receive implicit activity intents), **data** (URI scheme/host/port/path patterns + MIME).
- Multiple matches → **disambiguation dialog** ("open with"), user may set a default. Sender can force a chooser (`Intent.createChooser`) for share-type actions.
- Security retrofit timeline (the trap catalog):
  - Services: implicit `bindService()` **throws** since Android 5.0 (2014) — you cannot let "any service that claims the action" win for privileged work.
  - **Android 12 (2021)**: `android:exported` must be explicitly declared for any component with an intent filter — installs are rejected otherwise; PendingIntents must declare FLAG_IMMUTABLE/MUTABLE; StrictMode detects unsafe nested-intent launches ("intent redirection").
  - **Verified App Links**: `autoVerify` intent filters are checked against `https://domain/.well-known/assetlinks.json` (Digital Asset Links, cryptographic proof of domain↔app binding). **Since Android 12, unverified web links go to the browser by default** — an app can no longer claim `https://bank.com` links just by declaring a filter. Android 15+ re-verifies in the background (~7-day propagation).
  - **Android 13**: incoming external intents must match a declared filter of the target or throw.
  - **Android 15 (2024)**: "Safer Intents" phase 1 — intents targeting a specific component must still match its filter; implicit intents must have an action; `UriRelativeFilterGroup` adds query/fragment-level matching rules.
  - **Android 16 (2025)**: receiver-side opt-in strict matching via `intentMatchingFlags` in the manifest; blocked intents log "Access blocked" (Google issue tracker 391169066 documents enable/disable).
- Canonical deployed exploit: **implicit intent hijacking** — malicious app registers a matching filter and silently receives the intent + extras (session tokens, PII); documented first-party at developer.android.com/privacy-and-security/risks/implicit-intent-hijacking, with the stated rule "intent filters are not a security boundary." Real-world case: **TikTok CVE-2022-28799** (Microsoft, disclosed 2022-08-31) — deeplink verification bypass let one click load an attacker URL into a WebView with ~70 exposed JS-bridge methods → one-click account takeover on an app with 1.5B installs. Deep-link routing + powerful in-app bridge = account takeover.

---

## 2. HONEST FUCHSIA TRAJECTORY 2024–2026

- **Shipping reality**: Fuchsia runs on Nest Hub (1st gen, since May 2021), Nest Hub Max (Aug 2022), Nest Hub 2nd gen (May 2023). That's it for consumer devices.
- **Contraction**: Jan 2023 Google layoffs hit **16% of the Fuchsia team** (Wikipedia; osnews contemporaneous). Workstation builds discontinued (2023). Smart-speaker migration (Nest Mini/Audio SoCs) abandoned July 2023, hardware marked unsupported and code removed. **Full Chrome browser port formally ceased January 2024** (9to5Google guide) after being demoed working in Feb 2022.
- **But not dead**: release cadence continues — F27 (2025-07-15, invgate/9to5), **F29 release notes January 2026**, **F30 published April 2026** (fuchsia.dev release-notes index, last updated 2026-04-14; Wikipedia). Nest Hubs still receive updates (Bluetooth/Matter/Thread improvements).
- **Strategic salvage — microfuchsia**: since ~April 2024, AOSP carries `com.android.microfuchsia` APEX work: a trimmed Fuchsia build **booting inside pKVM under the Android Virtualization Framework** as "an experimental solution for running trusted applications" (AOSP README; androidauthority 2024-07). Fuchsia's second life is as a hardened guest for security-critical workloads *inside* Android, not as an OS product.
- **Starnix inversion**: heavy ongoing investment in running Linux/Android binaries *on* Fuchsia (docs updated through Jan 2026) — the compatibility bridge became a headline feature, tacit admission that a greenfield OS cannot demand a greenfield app ecosystem.
- **Migration tax**: Components v1 (CMX/appmgr, peak 2018) → v2 (CML) migration began 2019 and ran for years, with appmgr wrapped as a v2 component parenting all v1 components. Even with Google's resources, changing the component model after software exists is a multi-year slog.
- **Net lesson for EFS**: the *architecture* (capabilities, manifests, resolvers/runners, content-addressed TUF delivery) is validated and stable across the entire contraction — nothing about the layoffs discredits the component framework. What failed was the product strategy of replacing incumbent OSes wholesale. EFS client v2 should copy the architecture and refuse the strategy: ship value app-by-app on the existing web platform, never require the whole world to move in first.

---

## 3. WHAT IS EMERGING (status + date)

- **RFC-0212 package-set redesign** (accepted 2023-03; ongoing follow-on RFCs): 2-axis version-control × availability framework, cache deprecation, per-set executability policy. Directly reusable vocabulary for EFS OS profiles vs user apps.
- **Dictionary capabilities** (in current capability docs): bundling many capabilities into one routable object — the manifest-level analog of handing an app one attenuated `efs.*` object.
- **Android Safer Intents**: Android 15 sender-side (2024, shipped), Android 16 receiver-side opt-in strict matching (2025, shipped as opt-in) — the endgame of intent routing is *closed-world, declaration-checked matching on both sides*, arrived at only after a decade of exploits.
- **microfuchsia / AVF trusted apps** (experimental, AOSP, 2024→): OS-as-isolated-capability-guest.
- **Fuchsia session/window-management API** still in flux post-RFC-0189 (element role deprecated 2022; docs being rewritten) — shell-layer APIs churn even when the component layer is frozen.

## What would be an EFS-specific invention (nothing above covers it)

- Resolver trust decided by **lens** (per-viewer ordered author trust) rather than by repository key hierarchy — no deployed OS resolves *code* through subjective, user-chosen attestation orderings.
- **Read-grade-labeled code loading** (LIVE/STALE/EQUIVOCAL app packages) — TUF has freshness, but no deployed system surfaces venue-qualified staleness of *the app itself* to the user.
- Handler/default-app registry as **signed portable records** (survives device loss, replayable cross-chain) rather than device-local PackageManager state.
- **Chain-verifiable intent receipts** — Android has no audit trail of who handled an intent and what they were handed.

---

## 4. LESSONS AND TRAPS (from deployed systems)

1. **Get the manifest right before shipping apps** — Fuchsia's v1→v2 (CMX→CML) migration consumed years and required running appmgr-as-a-v2-component shims. A manifest format is a protocol freeze; EFS gets exactly one cheap chance.
2. **Implicit routing is a standing invitation to hijack.** Android's entire 2014–2025 security arc (implicit service bind ban → exported mandatory → App Links verification → Safer Intents) is one long retreat from "any app that claims the action can receive it." TikTok CVE-2022-28799 shows deeplink + in-app bridge = one-click account takeover at 1.5B-install scale.
3. **"Intent filters are not a security boundary"** (Google's own words). A declaration that you *can* handle something must never be an authorization that you *do*.
4. **Don't blur infrastructure and authority.** Fuchsia routes runners/resolvers via auto-propagating environments but authority via explicit per-edge routing. Systems that let authority propagate implicitly (Android's exported-by-default era) pay for it in CVEs; systems that force per-edge routing of infrastructure drown in boilerplate.
5. **Shell-layer APIs churn; kernel-layer contracts must not.** Fuchsia's element manager was designed, shipped, and deprecated (RFC-0189, 2022) while component manager's contract held. Keep the EFS Kernel↔app contract minimal and stable; let Shell app-hosting APIs version freely.
6. **Architecture ≠ product.** Fuchsia is the best-engineered capability OS ever shipped and it runs on three smart displays. Adoption comes from riding an existing ecosystem (starnix, microfuchsia both concede this). EFS client v2 must be useful on day one inside ordinary browsers.

---

## 5. EFS TRANSLATION (opinionated)

1. **Adopt the CML tri-partition for the EFS app manifest.** A minimal future-proof manifest = `program` (runner name + runner-specific opaque block), `use` (requested capabilities with scopes; the ceiling, not the grant), `config` (typed schema, closed type set, values validated before launch), `facets` (freeform: locale support, agent action catalog, i18n metadata). Deliberately *omit* `children`/`offer`/`expose` from Ring-3 app manifests in v1 — apps that want workers get an `efs.worker.spawn` capability that clones explicit attenuated subsets; full sub-realm composition can be added later without breaking the format. Compile the JSON5 source to a canonical hashed form (EFS's `.cm` analog) so the manifest hash is part of app identity.
2. **Resolvers as scheme-keyed capabilities in the Kernel, exactly Fuchsia-shaped.** `Resolver.resolve(url) → (manifestDecl, contentRootHandle)` — always return the *pair*, never bare bytes. Schemes: installed-package (local content store = EFS "base"), `ipfs://`/CID, EFS-record (lens-resolved), `dev://localhost` (dev server, dev-mode only, loudly labeled). Which resolvers an app collection gets is environment policy: production apps get only content-addressed resolvers; the dev resolver exists only in a developer environment. Copy Fuchsia's base/full split: same scheme can map to an offline-local resolver or a network resolver depending on environment, so offline behavior is a routing decision, not an app decision.
3. **Runners as capabilities with runner-owned `program` blocks.** Ship four: SES-compartment runner (default), dedicated-worker runner, sandboxed-iframe runner (for DOM/render apps and mirror content), WASM runner (later). The Kernel's `Start(startInfo)`-equivalent hands the runner: resolved URL, program block, and the attenuated capability object built from granted `use` entries — and takes back a controller for stop/kill. This makes "new execution technology" (WASM components, future ShadowRealms) additive instead of architectural.
4. **Model running apps as dynamic instances in collections with per-collection environments** (Fuchsia `fuchsia.component.Realm` + collections): `user-apps` (transient), `system-services` (persistent), `agent-sessions` (single-run, budgeted). One offer-to-collection defines the capability floor per class; the Shell's install/launch flow is just `CreateChild` with a reviewed grant set.
5. **Component URLs: hash-pinned for code, lens-resolved for discovery.** Copy `?hash=` semantics — an OS profile or app closure references packages by exact content hash (Fuchsia base-set / Nix-generation equivalence), giving rollback and no forced upgrades for free. EFS-path/lens resolution is how users *find* apps; the moment one is installed, the ledger records the pinned hash + signer, and updates are explicit hash transitions with capability diffs. Support subpackage-style relative references so an app ships its exact dependency closure (no version skew inside one app).
6. **Intent routing: explicit-first, verified-handler, Shell-owned chooser.** (a) Typed OS actions name their handler by pinned app identity (explicit intent) wherever the caller knows it. (b) For open "open-with / share / handle-type" routing, apps declare handled types in their manifest, but *declaration ≠ default*: defaults are user policy set through the Shell chooser, stored in the permission ledger. (c) For claims like "I am the handler for author X's schema/type," require an App-Links-style proof: an attestation by the type's author (resolved through the viewer's lens) binding the type to the app identity — unverified claims never auto-win, they fall to the chooser (Android 12's "unverified → browser" move, done right from day one). (d) Never place secrets in broadcast/implicit payloads; capability handles, not tokens-in-extras.
7. **Structured config over settings files.** App config schema lives in the manifest; values are validated pre-launch; `mutability: ["shell"]` marks which fields the user/Shell may override; config provenance (package default vs user override vs profile) is inspectable in the debug surface. This kills an entire class of "app broke because of a stale local setting" bugs and makes config diffs part of update review.
8. **Package delivery = content-addressed blobs + a freshness layer, and be explicit that EFS envelopes replace TUF's *signing* but not TUF's *freshness*.** Blob store keyed by content hash with cross-app dedup (blobfs precedent); "base" = the pinned OS profile generation (only set that's executable without prompts, per Fuchsia's executability policy); "universe/discoverable" = everything fetched on demand with per-set trust policy. For update channels, EFS records give signed, portable, replayable metadata — but see gaps below for what TUF has that EFS lenses don't yet.

---

## 6. WHERE EFS v2 MAY UNDER-SUPPORT THE CLIENT (gaps to feed back)

1. **Rollback/freeze protection for code (TUF timestamp/snapshot roles).** EFS records are permanent and replayable — an attacker who controls a venue or an offline cache can serve an *old, genuinely-signed* app manifest (known-vulnerable version) forever. `SUPERSEDED`/`STALE` grades only trigger if the client *sees* the newer record; TUF solves this with short-lived signed timestamp metadata. EFS v2 needs an explicit freshness-commitment primitive for update channels (e.g., author-signed "latest as of checkpoint N" heartbeat records with client-side max-age policy), or the client must treat every offline app launch as potentially frozen and label it.
2. **Handler-registry equivocation.** If "app A handles type T" is an EFS record resolved first-attester-wins through a lens, early or squatting attesters can claim popular types (the implicit-intent-hijack analog, but permanent). The protocol offers no native "type author endorses handler" binding akin to assetlinks.json; the client must synthesize it (attestation by the type's defining author + user confirmation), and the protocol should consider making handler-binding a recognized record shape so lenses can grade it.
3. **Manifest+content atomicity.** Fuchsia resolvers return (decl, package dir) as one resolution against one merkle root. An EFS app referenced as a LIST + DATA records must resolve to a *single consistent closure* — the SDK needs an atomic "resolve closure at pinned root hash" operation; lens resolution per-record could otherwise mix versions across records (a partial-upgrade app is a security hazard, not a freshness nuance).
4. **Private, mutable, local state has no protocol home.** Structured-config user overrides, default-handler choices, and permission ledgers are device-local, mutable, and often privacy-sensitive — the anti-shape of permanent public EFS records. Fine — but v2 should explicitly bless an encrypted-local/roaming-policy tier so client designers stop trying to force these into records (or awkwardly around them).
5. **Read grades don't currently qualify *executability*.** Grades describe truth of data; the client needs a policy mapping grade → run permission (e.g., LIVE/pinned-hash = runnable; STALE = runnable with label; EQUIVOCAL = never auto-run, require user pin). Worth recording as a protocol-adjacent normative table so all shells behave identically.

---

## Sources (fetched 2026-07-07)

- https://fuchsia.dev/fuchsia-src/concepts/components/v2/introduction — CF v2 intro (live docs)
- https://fuchsia.dev/fuchsia-src/concepts/components/v2/component_manifests — CML/`.cm` manifests
- https://fuchsia.dev/fuchsia-src/concepts/components/v2/capabilities — capability types, use/offer/expose, weak deps, dictionaries
- https://fuchsia.dev/fuchsia-src/concepts/components/v2/capabilities/resolver — resolvers, built-in boot/base/full resolvers
- https://fuchsia.dev/fuchsia-src/concepts/components/v2/capabilities/runner — runners, ComponentRunner.Start, program block
- https://fuchsia.dev/fuchsia-src/concepts/components/v2/environments — environments, REALM/NONE inheritance
- https://fuchsia.dev/fuchsia-src/reference/components/url — component URL syntax, ?hash= pinning, relative/subpackage URLs
- https://fuchsia.dev/fuchsia-src/concepts/components/v2/realms — realms, collections, fuchsia.component.Realm
- https://fuchsia.dev/fuchsia-src/development/components/configuration/structured_config — structured config (RFC-0127/0146/0158/0173)
- https://fuchsia.dev/fuchsia-src/concepts/packages/package — meta.far, merkle roots, blobfs, base/cache/universe, subpackages
- https://fuchsia.dev/fuchsia-src/concepts/packages/software_update_system — TUF v1.0 + merkle-in-targets extensions
- https://fuchsia.dev/fuchsia-src/contribute/governance/rfcs/0212_package_sets — package sets redesign (accepted 2023-03-07)
- https://fuchsia.dev/fuchsia-src/contribute/governance/rfcs/0092_sessions — sessions RFC (accepted 2021-05-05)
- https://fuchsia.dev/fuchsia-src/development/sessions/roles-and-responsibilities — session roles
- https://fuchsia.dev/fuchsia-src/contribute/governance/rfcs/0189_window_management — element role deprecation (accepted 2022-09-20)
- https://fuchsia.dev/fuchsia-src/contribute/governance/rfcs/0082_starnix — starnix RFC; concepts pages updated 2025-12/2026-01
- https://fuchsia.dev/whats-new/release-notes — F1–F30 index (last updated 2026-04-14); https://fuchsia.dev/whats-new/release-notes/f29 (Jan 2026)
- https://en.wikipedia.org/wiki/Fuchsia_(operating_system) — timeline: Nest Hub 2021-05, layoffs 2023-01 (16%), F30 2026-04
- https://9to5google.com/guides/fuchsia/ — Chrome port ceased 2024-01; speaker plans abandoned 2023-07; F16 rollout 2024-03
- https://www.osnews.com/story/135778/googles-fuchsia-and-area-120-see-significant-cuts-in-layoffs/ — Jan 2023 layoffs
- https://android.googlesource.com/platform/packages/modules/Virtualization/+/043dfb7369c0e4c5161b153a1685c9f68e1ad152/microfuchsia/README.md — microfuchsia on pKVM/AVF (AOSP, 2024)
- https://www.androidauthority.com/microfuchsia-on-android-3457788/ — microfuchsia reporting (2024-07)
- https://developer.android.com/guide/components/intents-filters — intents, filters, resolution tests, chooser, exported, Android 13 matching
- https://developer.android.com/privacy-and-security/risks/implicit-intent-hijacking — first-party hijack risk doc
- https://developer.android.com/training/app-links/verify-android-applinks — autoVerify, assetlinks.json, Android 12 unverified→browser, Android 15 re-verification
- https://www.microsoft.com/en-us/security/blog/2022/08/31/vulnerability-in-tiktok-android-app-could-lead-to-one-click-account-hijacking/ — CVE-2022-28799 (2022-08-31)
- https://developer.android.com/about/versions/16/behavior-changes-16 — Android 16 intentMatchingFlags strict matching (2025)
- https://www.nowsecure.com/blog/2024/07/31/comprehensive-guide-to-android-15-security-and-privacy-improvements/ — Android 15 Safer Intents (2024-07-31)
- https://fuchsia.googlesource.com/fuchsia/+/32e8d4dd81dce9c6cbc9d38989c7ca00dc4ead8a/docs/concepts/components/v2/migration.md — v1→v2 migration state (appmgr as v2 component)
- https://arxiv.org/abs/2108.04183 — "Understanding Fuchsia Security" (2021-08-09)
