# OS research compass for Fable - EFS web OS

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[fable-client-v2-handoff]], [[agent-native-os-compass-for-fable]], [[sdk-vs-client-responsibilities]], [[mirror-scheme-policy]]
**Supersedes:** -
**Reviewers:** Codex research pass, 2026-07-07
**Last touched:** 2026-07-07 - codex-gpt-5

#status/draft #kind/research #repo/planning #repo/client #repo/sdk

## What this is

This is a research compass for Fable before designing the official client v2 as a true web OS. It is not a spec. It is a list of OS research traditions, modern systems, and web-native analogues that look fertile for EFS.

James's framing is important: the official client is an OS, not merely a website, not merely a file browser, and not merely an SDK demo. That might eventually deserve a separate product name such as "Ethereum Operating System," "EFS OS," or another name Fable invents. Do not assume "EOS" is available or wise; it is a useful shorthand during brainstorming, not a branding decision.

Fable should treat classic desktop OSes as old reference material, not as destiny. EFS has unusual primitives: content-addressed packages, blockchain-admitted records, signed user policy, static distribution, browser isolation, JS/WASM modules, IPFS-style storage, wallet checkpoints, and deep links that can carry precise system state. That combination may support a better design than a traditional desktop metaphor.

## Primary sources to start from

Use current primary sources and cite dates. This initial pass used:

- Nix content-addressed store paths: https://nix.dev/manual/nix/2.18/command-ref/new-cli/nix3-store-make-content-addressed
- Nix flakes and `flake.lock`: https://nix.dev/manual/nix/2.24/command-ref/new-cli/nix3-flake
- Nix generations, rollback, and garbage collection: https://nix.dev/manual/nix/2.24/command-ref/nix-env/rollback and https://nix.dev/manual/nix/2.26/package-management/garbage-collection
- Fuchsia components and capability routing: https://fuchsia.dev/fuchsia-src/concepts/components/v2/introduction
- Fuchsia session framework: https://fuchsia.googlesource.com/fuchsia/+/606a164efecde4265c0e486ef0e3113eb58243ad/docs/concepts/session/introduction.md
- Fuchsia package delivery: https://fuchsia.dev/fuchsia-src/get-started/learn/intro/packages
- Plan 9 namespaces: https://9p.io/sys/doc/names.html
- Genode OS framework: https://genode.org/
- seL4: https://sel4.systems/
- Capsicum: https://www.cl.cam.ac.uk/research/security/capsicum/
- CloudABI: https://papers.freebsd.org/2017/fosdem/ed-cloudabi-for-freebsd/
- Qubes OS security goals and architecture: https://doc.qubes-os.org/en/latest/developer/system/security-design-goals.html and https://doc.qubes-os.org/en/latest/developer/system/architecture.html
- WASI: https://wasi.dev/
- WebAssembly Component Model: https://github.com/WebAssembly/component-model
- Chrome Isolated Web Apps: https://developer.chrome.com/docs/iwa/introduction and https://github.com/WICG/isolated-web-apps
- Chromium IWA API launch principles: https://www.chromium.org/blink/launching-features/isolated-web-apps/
- IPFS content addressing: https://docs.ipfs.tech/concepts/content-addressing/
- W3C Subresource Integrity: https://www.w3.org/TR/sri-2/
- Content Security Policy `connect-src`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src
- Referrer Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy
- Fetch Metadata request headers: https://developer.mozilla.org/en-US/docs/Glossary/Fetch_metadata_request_header
- PrivacyCG storage partitioning: https://privacycg.github.io/storage-partitioning/
- W3C Internationalization Activity: https://www.w3.org/International/
- Unicode CLDR Project: https://cldr.unicode.org/
- ECMA-402 ECMAScript Internationalization API: https://ecma-international.org/publications-and-standards/standards/ecma-402/
- MDN `Intl` reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- IETF BCP 47 / RFC 5646 language tags: https://datatracker.ietf.org/doc/html/rfc5646
- IANA Language Subtag Registry: https://www.iana.org/assignments/language-subtag-registry
- W3C Strings on the Web: Language and Direction Metadata: https://w3c.github.io/string-meta/
- W3C WCAG overview: https://www.w3.org/WAI/standards-guidelines/wcag/
- Browser import maps: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap
- The Update Framework spec: https://theupdateframework.github.io/specification/latest/
- Bazel remote cache and CAS: https://bazel.build/remote/caching
- Android A/B updates: https://source.android.com/docs/core/ota/ab
- Android intents and intent filters: https://developer.android.com/guide/components/intents-filters
- GNOME Shell extension review guidelines: https://gjs.guide/extensions/review-guidelines/review-guidelines.html
- Linux kernel module signing: https://www.kernel.org/doc/html/v6.1/admin-guide/module-signing.html
- MirageOS: https://mirage.io/
- Unikraft: https://github.com/unikraft/unikraft
- Singularity research OS: https://www.microsoft.com/en-us/research/publication/singularity-rethinking-the-software-stack/
- Barrelfish research OS: https://barrelfish.org/documentation.html
- Biscuit research OS: https://pdos.csail.mit.edu/projects/biscuit.html

Related agent-native research is in [[agent-native-os-compass-for-fable]]. Fable should include that lane when researching OS foundations, not only when designing assistant UX.

Fable should expand this list, especially with recent SOSP/OSDI/HotOS papers, browser platform proposals, local-first systems, package/update-security systems, agent OS work, and high-assurance capability OS work.

## Big research thesis

The interesting direction is not "a desktop inside a browser." The interesting direction is:

```text
A static, content-addressed, capability-routed, local-first web OS
whose bootable system profile can be shared by hyperlink,
verified by hash/signature,
cached offline,
and upgraded or rolled back as a user-owned generation.
```

NixOS is the most obvious analogy, but the EFS version would be browser-native:

- A deep link points to an OS profile or app profile, not merely a route.
- The profile names exact Kernel, Shell, app, package, import-map, WASM, policy, lens, and cache roots.
- The Bootstrapper resolves the closure, verifies hashes and signatures, and starts only what the link needs.
- The Kernel/Shell route capabilities to apps according to a manifest and user policy.
- The cache stores content-addressed packages and records for offline reuse.
- The user can pin, share, fork, upgrade, or roll back an OS profile like a Nix generation.

This is pie in the sky, but it is native to blockchain/IPFS territory in a way that traditional desktop OSes are not.

## Agent-native OS research

See [[agent-native-os-compass-for-fable]] for the detailed packet. The short version: EFS should not make agents operate first-party workflows through screenshots, hidden DOM state, or brittle UI conventions. If the client is an OS, agents are part of the actor model.

Research lanes:

- **Agent OS papers:** AIOS and similar work on scheduling, context, memory, storage, access control, and tool use as kernel-level services.
- **Agent-computer benchmarks:** OSWorld, WebArena, and VisualWebArena, especially where agents fail because systems expose only human GUI affordances.
- **Agent protocols:** MCP for tool/resource/prompt discovery, A2A for cross-agent task collaboration, OpenAPI for machine-readable actions, and llms.txt for documentation handoff.
- **Automation infrastructure:** WebDriver BiDi, accessibility APIs, ARIA mappings, semantic UI, action schemas, and typed receipts.
- **Safety research:** prompt injection, tool injection, untrusted content, human-in-loop checkpoints, isolated browser/computer-use environments, policy cards, and budget/kill-switch models.

Possible EFS translation:

- Add agents to the OS security model as bounded sessions or principals with explicit capabilities, quotas, expiry, provenance, and audit logs.
- Make structured OS actions the preferred automation path: describe, plan, dry-run, approve, execute, journal, receipt, recover.
- Treat inference as an OS service mediated by user policy, not as a model API key hardcoded into every app.
- Require apps to publish agent-readable manifests and action catalogs, but keep Kernel/Shell capability routing as the authority source.
- Build agent-readiness tests: can an agent complete core workflows through structured actions, recover from partial flush, and explain its receipts?

Questions:

- Is an agent an app, a user, a service, a session, a delegated principal, or a separate OS actor?
- Can an agent hold wallet/session-key authority, or only ask the Shell to mediate signing?
- How are agent-drafted, agent-authored, human-approved, and human-authored records distinguished?
- Which workflows need structured action APIs on day one so the OS is not born GUI-only?
- What agent-specific surfaces belong in the Shell: Agent Center, Task Queue, Approval Queue, Memory Vault, Tool Registry, Audit Log, Inference Settings?

## NixOS and Guix: reproducible system closures

What to learn:

- Nix shows how software environments can be modeled as immutable store paths, dependency closures, profiles, generations, and garbage-collectable roots.
- Nix flakes add a lock-file graph for reproducible inputs.
- Content-addressed Nix paths make trust closer to "does the content match?" rather than "did a trusted cache sign this output?"
- Rollback/generation UX is an OS-level primitive, not an app setting.

Possible EFS translation:

- Define an **EFS OS profile**: a signed or cited manifest naming Kernel CID, Shell CID, import map, app package roots, package policies, default apps, initial lens/trust config, and required system services.
- Define an **EFS package closure**: all JS/WASM/assets/manifests/policies needed to boot a profile or app.
- Define **profile generations**: local and maybe signed history of OS/app configurations, with rollback and diff.
- Define **cache GC roots**: pinned profiles, recent deep links, installed apps, active drafts, signed bundles, and explicit user pins keep content alive; other cached blobs can be collected.
- Explore an **EFS flake-like link**: a URL or EFS record that names both unlocked intent and a locked closure, so users can choose "follow latest" vs "open exact version."

Questions:

- Is an EFS OS profile a local-only object, a signed EFS record, a content-addressed JSON manifest, or all three?
- Does a link to a file also name the OS/app closure needed to open it, or should the client choose the current installed app?
- How does a user distinguish "same app name, new package hash" from "same exact package closure"?
- What can be safely upgraded automatically, and what needs a capability/update diff prompt?
- Can an app publish "minimum OS SDK version" and "known good OS profile" separately?

## Fuchsia: components, resolvers, runners, and routed capabilities

What to learn:

- Fuchsia treats software as components described by manifests, sandboxed by default, and given capabilities by routing.
- Resolvers turn component URLs into manifests and package access.
- Runners execute different runtime types.
- Packages are content-addressed BLOB trees and distributed through TUF repositories.

Possible EFS translation:

- Apps are **components**, not global scripts.
- The OS SDK is the app-facing runtime API, analogous to a component library.
- The Kernel/Shell act as component manager: resolve app packages, route capabilities, own lifecycle, and audit granted powers.
- EFS can have multiple resolvers: installed package, IPFS CID, EFS package record, local dev package, trusted lens package channel.
- EFS can have multiple runners: JS module compartment, Web Worker, sandboxed iframe, WASM component, render-only viewer, background service.
- Capability routing can produce app-specific namespaces: `/app`, `/picked`, `/wallet`, `/lens`, `/cache`, `/outbox`, `/settings`, `/system`, each backed by attenuated handles.

Questions:

- What is the minimal component manifest that is future-proof enough?
- Should app packages expose multiple entry points, such as UI, worker, command, renderer, migration, and background sync?
- Can third-party resolvers/runners exist, or are they system services only?
- What capabilities are offered by install policy, runtime prompt, file picker, deep link, lens, or system service?

## Configurable Shells and sessions

What to learn:

- Fuchsia separates platform components from the product-specific session. A session is a component that encapsulates a product's user experience, while the session manager offers capabilities to it and helps standardize integration across sessions.
- Android's intent model shows how a platform can route user actions to different apps or launchers through manifest-declared filters, with chooser/default behavior and security caveats around implicit dispatch.
- Linux desktop environments show that multiple shells can support different workflows, but app/toolkit fragmentation is real unless common platform contracts stay stable.
- GNOME Shell extensions show the other side of customization: shell add-ons need lifecycle discipline, review, cleanup, and version compatibility, and still carry quality/security risk.
- Linux kernel modules show that below-the-trust-boundary extension points need signatures, trusted keys, compatibility rules, and strong operational discipline.

Possible EFS translation:

- Treat the Shell as a **session** over the EFS Kernel and OS SDK. A Shell is a package/profile that presents apps and OS services; it should not redefine core authority.
- Keep a stable **Shell contract**: app hosting, window/view lifecycle, secure prompt display, permission review, file pickers, wallet approval mediation, render isolation, sync status, app install/update, accessibility semantics, agent approvals, and recovery.
- Support Shell variants only if the Kernel can verify compatibility: OS SDK version, required system services, package hash, signer, policy, fallback Shell, migration hooks, and compatibility-test receipts.
- Make the default Shell first-party, but allow Fable to explore user-installed Shells as a future power-user path with scary capability diffs and easy rollback.
- Treat the mobile Shell, agent Shell, console Shell, and kiosk Shell as strong use cases for Shell plurality.
- Treat third-party Shells as high-risk packages, closer to system apps than ordinary apps.
- Treat "Kernel modules" as a separate bar. Start with system services, runners, resolvers, or WASM components with narrow capabilities; only consider true Kernel extension points if research finds a concrete blocker that cannot be solved above Kernel authority.

Questions:

- Is Shell plurality worth the compatibility and security cost, or should the official Shell support modes instead?
- What is the minimal Shell API that lets apps work across desktop, mobile, console, and agent Shells?
- Can the Kernel reserve unforgeable safety/recovery surfaces, or is the Rescue Shell the practical fallback?
- What must happen if a configured Shell fails to load, loses network/package bytes, fails migration, or requests an OS SDK version the Kernel no longer supports?
- Can users share Shell profiles safely as content-addressed closures, and can recipients inspect signer, package hash, required capabilities, and app compatibility before switching?
- Are Shell extensions allowed, or should customization happen through ordinary apps, widgets, command providers, and full Shell profiles?
- If Kernel modules ever exist, are they signed by EFS, user-installed by local trust root, content-addressed, capability-routed, revocable, and test-gated?

## Plan 9: namespaces over global APIs

What to learn:

- Plan 9's per-process namespaces let each process see its own coherent world.
- Devices, networks, windows, and processes can appear as file-like services in the local namespace.
- Remote namespaces can be imported and composed.
- The trick is not "everything must literally be a file"; it is that resources are named, mounted, replaced, and composed uniformly.

Possible EFS translation:

- Do not give apps a global EFS root by default. Give them a **personal namespace** assembled from capabilities.
- A file picker does not return a path string; it mounts a FileHandle or directory capability into the app namespace.
- Wallet, sync, network, render surfaces, and system settings can be "mounted" as explicit capability services.
- Lens order and trust policy can act like namespace composition: the app sees a resolved view assembled from selected sources, not the entire world.
- A deep link can construct a temporary namespace: exact citation, app package closure, required bytes, lens view, and allowed actions.

Questions:

- Should EFS expose namespace-like paths to apps for ergonomics, while keeping the real security primitive as capabilities?
- Can a "mount table" be inspected in dev mode so app authority is explainable?
- Is a lens more like a namespace overlay, a package channel, a trust policy, or all three depending on context?

## Capability OS lineage: seL4, Genode, Capsicum, CloudABI

What to learn:

- seL4 and Genode emphasize small trusted bases, strong isolation, explicit communication, and least authority.
- Capsicum and CloudABI show how capability ideas can be retrofit into more familiar environments by removing ambient global namespace access and passing file-descriptor-like rights.
- Powerbox-style flows matter: user selection can grant authority without broad prior permission.

Possible EFS translation:

- The Kernel should hold root authority; apps should receive only attenuated capability objects.
- Permissions are not just labels. They should correspond to actual handles: file handle, directory handle, wallet prompt handle, package channel handle, render surface handle, settings handle.
- The most humane permission flow may be **capability by selection**: "open this file," "use this folder," "install this app," "sign this batch," not "grant all files forever."
- High-risk system access can be shaped as admin capabilities with receipts, rate limits, expiry, and audit logs.

Questions:

- Which EFS powers can be represented as handles rather than boolean permissions?
- Can capability handles be serialized into signed receipts or only held in local Kernel state?
- How do we revoke a handle when the app already used it to write a durable record?
- Is "root" a real surface, or only an internal construction used to mint narrower handles?

## Qubes: visible security domains

What to learn:

- Qubes treats the desktop as multiple security domains with mediated transfer across boundaries.
- GUI integration hides some friction, but the domain boundary remains visible enough for users to reason about risk.
- Copy/paste and file transfer are system-mediated events.

Possible EFS translation:

- EFS may need visible **contexts**: wallet/persona, lens/trust order, app package trust, online/offline state, data sensitivity, and citation/browse mode.
- Risky renderers can live in low-trust compartments with explicit copy/export boundaries.
- Cross-context transfer should be an OS event: move file from local private draft to public EFS write, export signed bundle, copy from untrusted renderer, grant app access to a folder.

Questions:

- What is the EFS equivalent of a colored Qubes window border: lens badge, wallet badge, package hash badge, offline/as-of badge, trust-domain label?
- Should users create named workspaces or compartments, such as Personal, Publish, Research, Anonymous, Archive?
- Does each compartment have separate wallet policy, lens defaults, cache roots, and installed apps?

## Web-native app packaging: IWA, SRI, import maps, IPFS, WASI

What to learn:

- Isolated Web Apps package web resources into signed bundles instead of trusting a live server.
- Subresource Integrity lets browsers verify fetched resources against expected hashes.
- Import maps let a document control module specifier resolution, including scoped dependency versions.
- IPFS gives a content-addressed naming model.
- WASI and the Component Model point toward language-neutral, typed, capability-shaped modules.

Possible EFS translation:

- App packages can be signed/content-addressed bundles with an import map, SRI/CID table, LavaMoat/SES policy, OS SDK version, and capability ceiling.
- Package links can be reusable static closures, not server locations.
- WASM components may be a plugin/runtime lane for compute-heavy or cross-language EFS apps, especially when paired with explicit imported capabilities.
- JS modules can be resolved by import maps over content-addressed URLs, but the OS needs a package-level lock and integrity policy so import-map flexibility does not become supply-chain chaos.

Questions:

- Should EFS app packages be Web Bundles, plain EFS directories, CAR files, npm-style tarballs, custom manifests over IPFS, or multiple accepted package formats normalized into one package graph?
- What is the role of browser-native SRI if EFS already uses CIDs or content hashes?
- Can the OS boot a minimal Shell immediately and lazy-load app closures, while still preserving deterministic package identity?
- Should WASM components be first-class app packages, worker plugins, or only internal implementation detail at first?

## Network privacy and HTTP authority

What to learn:

- Web fetches leak metadata by design: destination server, IP/proxy exit, timing, user agent, path/query, cache behavior, referrer policy effects, and sometimes enough surrounding context to infer user activity.
- CSP, Permissions Policy, Fetch Metadata, Referrer Policy, storage partitioning, sandboxed iframes, and service workers are useful controls, but they do not make arbitrary HTTP private.
- Browser extension and app permission systems show the danger of broad origin grants such as all websites.
- Tor Browser, I2P, privacy proxies, local gateways, and self-hosted RPC/IPFS/Arweave endpoints are relevant user-sovereignty research lanes.
- Static content-addressed packages and local caches can reduce network contact, but update channels and package discovery can reintroduce centralization if they phone home.

Possible EFS translation:

- Treat network destinations as explicit capabilities, not ambient browser powers.
- Give apps no HTTP/fetch/WebSocket/beacon/subresource authority by default.
- Model origin grants as exact endpoints or endpoint classes: RPC provider, IPFS gateway, Arweave gateway, mirror, inference provider, app-specific API.
- Make wildcard network access a high-risk permission with a large warning and a visible receipt.
- Let users choose or self-host endpoints, and make endpoint choice part of OS setup, app install, and profile migration.
- Do not let OS updates, package discovery, fonts, avatars, analytics, telemetry, crash reports, model calls, or link previews make hidden HTTP requests.
- Cache package closures and content-addressed bytes locally so opening known content does not contact a server unless the user asks for freshness or missing bytes.
- Treat inference APIs as network endpoints with special privacy warnings: prompts, selected files, search context, embeddings, and outputs may leak.

Questions:

- How can the Kernel enforce no ambient network access in Ring 3 apps: CSP, sandboxed iframes, SES membranes, service-worker broker, static import policy, or some combination?
- Is network permission one capability family, or separate handles such as `RpcEndpointHandle`, `IpfsGatewayHandle`, `ArweaveGatewayHandle`, `MirrorFetchHandle`, `InferenceHandle`, and `HttpOriginHandle`?
- What is the default endpoint story for a new user who does not run their own RPC/IPFS/Arweave services?
- Can OS profiles carry endpoint preferences without revealing them when shared?
- How does a Shell show "this app wants to talk to these servers" without exhausting users?
- How does the OS stop passive leaks from images, fonts, CSS, scripts, iframes, favicons, preloads, preconnects, link previews, and imported modules?
- What is the recovery path when an app requires an endpoint the user refuses?

## Internationalization, locale, and language as OS services

What to learn:

- W3C i18n frames language, script, and culture as web-wide requirements, not app-specific decoration.
- Unicode CLDR provides the locale data modern systems use for calendars, date/time patterns, number systems, units, plural rules, territories, collation, and more.
- ECMA-402 and the JavaScript `Intl` APIs give browser-native primitives for locale-sensitive formatting, collation, segmentation, display names, plural rules, lists, dates, numbers, and relative time.
- BCP 47 language tags and the IANA Language Subtag Registry are the standard way to identify languages, scripts, regions, variants, and extensions.
- W3C language/direction metadata guidance matters for signed data formats, manifests, citations, and any EFS record that may carry human language.
- WCAG and accessibility practices intersect with i18n: screen readers need language metadata, labels need localization, and UI must survive translated text, direction changes, and user preferences.

Possible EFS translation:

- Treat locale as an OS service, not a per-app library choice.
- Give the Shell and OS SDK a `LocaleHandle` or equivalent service for formatting, collation, segmentation, language fallback, direction, and display names.
- Keep canonical data canonical. Signed records, receipts, timestamps, amounts, and citations should have stable machine representations plus localized presentation.
- Package language packs, locale data, dictionaries, help docs, and fonts as signed, content-addressed, offline-capable resources with fallback and rollback.
- Let apps declare supported locales, translation packs, direction support, text expansion tolerance, font needs, and locale-data dependencies in manifests.
- Make locale privacy explicit. Full language lists, time zone, region, installed fonts, input methods, and numbering/calendar preferences can fingerprint users.
- Support per-app and per-Shell locale overrides without fragmenting signed receipts, search indexes, or app compatibility.
- Design search/indexing around Unicode normalization, grapheme clusters, segmentation, collation, case/accent handling, transliteration, and language-specific tokenization.
- Include input methods, keyboard layouts, composition events, spellcheck, autocorrect, voice input, and mobile text entry in the foundation.

Questions:

- Which locale facts are available to apps by default, and which require capability grants?
- Can apps ask the OS to format values without learning the user's full locale profile?
- Is locale state local-private, encrypted sync state, signed user policy, or a layered mix?
- How does a shared OS profile avoid leaking the user's language, region, time zone, fonts, or input methods?
- What is the fallback behavior when a language pack, locale data pack, font, dictionary, or translation is missing offline?
- How are right-to-left, mixed-direction, CJK, long-word, and text-expansion layouts tested across Shells?
- How are content language and direction attached to files, app metadata, comments, records, citations, search results, and agent outputs?
- How does locale interact with agent tasks, inference prompts, translation, summaries, and human approval text?

## Package trust and update trust: TUF, Fuchsia, A/B, atomic desktops

What to learn:

- TUF separates target metadata, roles, threshold trust, and key compromise containment from the package format itself.
- Fuchsia combines content-addressed package blobs with signed repository metadata.
- Android/ChromeOS A/B updates keep an old working slot while preparing a new one.
- Nix-style and A/B or atomic-update systems treat system versions as switchable generations/images rather than in-place mutable piles.

Possible EFS translation:

- Separate **package identity** from **update channel** from **installed generation**.
- A package hash can prove exact bytes; a signed/lens-curated channel can say which bytes are recommended.
- Updates should create a new generation, not mutate the current one.
- First boot into a new OS profile should be reversible.
- Failure to load a new Kernel/Shell/app package should fall back to a previous known-good generation.

Questions:

- Are app update channels EFS lenses, TUF-like signed metadata, package-author records, curator lists, or user-selected policies?
- Does the Shell show capability diffs, endpoint diffs, package hash diffs, and dependency graph diffs?
- Can a package be installed from an untrusted source but run with no powers until the user grants handles?
- What is the recovery story if the user's default Shell profile points to broken package bytes?

## Unikernels and library OSes: specialize the runtime

What to learn:

- MirageOS and Unikraft specialize the OS/runtime around the app's actual needs, reducing size and attack surface.
- The lesson for EFS is not "compile a VM." It is "do not boot the whole world for a tiny task."

Possible EFS translation:

- Deep links should boot the smallest viable closure: Bootstrapper, Kernel slice, Shell prompt layer, resolver, one app/viewer, required bytes.
- Apps declare their runtime shape so the OS can spawn minimal compartments.
- The OS SDK can expose high-level powers while the Kernel provides only the backing handles actually needed by that app instance.

Questions:

- Can each app window be a specialized compartment with only the runner, modules, and capabilities it needs?
- Is there a separate "viewer unikernel" path for opening a citation or static file without loading the full Files app?
- What is the minimum boot profile that can still verify trust, show prompts, and recover from package failure?

## Singularity, Barrelfish, and modern research OS lessons

What to learn:

- Singularity emphasized software-isolated processes, contract-based channels, and manifest-based programs.
- Barrelfish treated the machine as a distributed system with explicit communication and replicated state.
- Biscuit explored whether high-level languages can safely implement OS-like kernels without unacceptable performance loss.

Possible EFS translation:

- Treat Kernel, Shell, service workers, app workers, render iframes, and WASM modules as a distributed actor system, not as one shared mutable JS heap.
- Make channels typed and explicit. Apps communicate with Shell/Kernel through OS SDK contracts, not ad hoc global APIs.
- Prefer memory-safe, structured, verifiable code boundaries where possible. For EFS this means TypeScript types are not enough; runtime validation, message schemas, capability membranes, and test fixtures matter.

Questions:

- What are the typed contracts for Shell-to-Kernel, app-to-Shell, app-to-Kernel, service-to-service, and renderer-to-Shell?
- Should the OS SDK generate both TypeScript types and runtime validators from one interface definition?
- Is shared state ever allowed across compartments, or is everything message passing plus content-addressed storage?

## Naming and product-frame questions

Fable should explore naming without committing early.

Candidate frames:

- **EFS OS:** clear, project-owned, probably safest.
- **Ethereum File System OS:** literal, maybe too long.
- **Ethereum Operating System:** ambitious, but broad and likely to imply ecosystem ownership EFS may not want to claim.
- **EOS:** tempting shorthand, but overloaded and not assumed ownable.
- **EtherFS OS / EFS Workbench / EFS Shell / EFS Station:** possible alternatives if "OS" becomes too grand or confusing.

Questions:

- Does "OS" help users understand the app/platform boundary, or does it sound like an overclaim?
- Is the user-facing thing the OS, the Shell, the Station, the Workbench, or a named environment?
- Does the developer-facing platform use "EFS OS SDK" even if the product name is not "EFS OS"?

## Design outputs to ask Fable for

Ask Fable to produce more than screens:

- A **research digest** with primary-source links and dates.
- A **web OS thesis**: what old OS assumptions EFS rejects and what new primitives it adopts.
- A **boot/profile model**: how a hyperlink becomes a verified, cached, runnable OS/app closure.
- A **package and update model**: content address, signatures, channels, generations, rollback, cache roots.
- A **component/capability model**: apps, system apps, services, runners, resolvers, Shell prompts, admin capabilities.
- A **Shell/session model**: fixed Shell, Shell modes, replaceable Shell profiles, Rescue Shell, Shell compatibility, and extension/module policy.
- A **network privacy model**: no ambient HTTP, endpoint capabilities, gateway/RPC choice, wildcard warnings, passive subresource blocking, inference-provider risk, and self-hosting/proxy paths.
- A **global locale model**: language packs, locale service, BCP 47 metadata, CLDR/Intl use, direction, input methods, fonts, search/collation, accessibility, and locale privacy.
- An **agent-native model**: agent actors, structured actions, inference service, approval queue, receipts, audit log, memory vault, and evaluation tasks.
- An **offline/sync model**: cache, journal, signed bundles, flush, partial admission, and truth labels.
- A **UI/system surface map**: Shell, Files, Settings/Admin, Sync, Lens/Trust, App Install, Permission Center, Devtools.
- A **threat model**: untrusted app, malicious package update, stale cache, broken link, compromised relayer, browser extension, malicious mirror content, confusing prompt, and first-party app overreach.
- An **EFS v2 pressure report**: any client OS feature that current EFS v2 designs do not support, make awkward, or have not considered, with a proposed section/file to add under `Designs/efsv2/`.

Fable should stay creative. The right answer may not look like macOS, Windows, Linux, mobile OSes, or ChromeOS. The most interesting EFS design may combine the best parts of a Nix profile, a Fuchsia component topology, a Plan 9 namespace, a Qubes trust domain, a WASI component graph, and a browser PWA without copying any one of them whole.
