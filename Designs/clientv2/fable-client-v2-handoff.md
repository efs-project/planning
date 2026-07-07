# Fable handoff - official client v2

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[fable-handoff-v2-tag-core]], [[read-lens-spec]], [[apps-cookbook]], [[sdk-vs-client-responsibilities]], [[mirror-scheme-policy]], [[os-research-compass-for-fable]], [[agent-native-os-compass-for-fable]]
**Supersedes:** -
**Reviewers:** 6 expert brainstorm lanes, 2026-07-07
**Last touched:** 2026-07-07 - codex-gpt-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

## What this is

This is a handoff packet for Fable before starting official client v2 design. It is intentionally **not** a spec and not a checklist. Treat it as a tray of ingredients: prior notes, unresolved questions, sharp edges, product instincts, and expert-agent provocations.

Fable should feel free to overturn, reframe, merge, or ignore anything here. The goal is breadth and depth, not compliance.

The older `/client/` repo is out of date. The useful starting points are the planning-vault notes:

- [[2026-05-26-pm-client-os-architecture]] - target client OS architecture.
- [[2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface]] - Ring 3 `efs.*` capability surface brainstorm.
- [[fable-handoff-v2-tag-core]] and the `efsv2/` set - native kernel + tag-core v2 direction.
- [[read-lens-spec]] - read grades, lens resolution, venue/currency language.
- [[apps-cookbook]] - app-grounding pass.
- [[sdk-vs-client-responsibilities]] - what the official client owns.
- [[mirror-scheme-policy]] - render isolation boundary.
- [[agent-native-os-compass-for-fable]] - agent-first OS design questions and research leads.

## Research mandate for Fable 5

Fable should do real OS-level research before settling foundations. See [[os-research-compass-for-fable]] as the starting packet. Desktop OSes are useful precedent, but they were built around older assumptions: local disks, native processes, administrator accounts, bundled apps, mutable package managers, and mostly-online vendor services. EFS is a greenfield browser-native, wallet-mediated, content-addressed, local-first, user-sovereign web OS. It should not inherit old metaphors by default.

Ask Fable to search broadly and cite dated primary sources before proposing final patterns. Useful research lanes:

- NixOS/Guix-style immutable stores, lock graphs, generations, rollback, cache roots, and content-addressed closures.
- Fuchsia-style component manifests, component URLs, resolvers, runners, routed capabilities, and content-addressed packages.
- Plan 9-style per-process namespaces and network-transparent resource composition, treated as inspiration rather than nostalgia.
- Modern app sandboxing and permission models: browser permissions, WebExtensions, Android runtime permissions, iOS entitlements, macOS privacy/TCC, Windows app containers/UAC, Flatpak portals, ChromeOS/PWA patterns.
- Capability OS research and practice: seL4, Genode, Capsicum, CloudABI, Qubes, object-capability systems, powerbox patterns, and least-authority UI.
- Web isolation and secure UI: SES, LavaMoat, CSP, Trusted Types, sandboxed iframes, COOP/COEP, Permissions Policy, import maps, Web Workers, Service Workers, WebAssembly component/WASI directions.
- Local-first/offline systems: operation logs, CRDTs, sync engines, optimistic UI, conflict resolution, durable local journals, resumable upload/flush, background sync limits, IndexedDB/OPFS/Cache API patterns.
- Wallet and transaction UX: account abstraction, session keys, delegated permissions, EIP-712 signing, batch signing, sponsored transactions, human-readable transaction previews, passkeys, hardware wallets, recovery flows.
- Package and update trust: TUF-style update channels, Sigstore/SLSA ideas, content-addressed packages, signed manifests, dependency policy, app-store review vs user-owned install, capability-diff prompts.
- System settings and privileged access: admin/root models, mobile configuration profiles, enterprise policy, scoped settings APIs, audit logs, revocation, "open with" and file-picker grants, least-authority defaults.
- Network privacy and transport authority: HTTP privacy leakage, endpoint pinning, user-configured RPC/IPFS/Arweave gateways, no ambient fetch, CSP `connect-src`, network capability prompts, DNS/IP/referrer/timing leakage, Tor/I2P/privacy-proxy compatibility, and anti-telemetry OS policy.
- Globalization, locale, and language support: Unicode, CLDR, BCP 47 language tags, ECMA-402 `Intl`, W3C i18n guidance, language/direction metadata, input methods, fonts, collation, plural rules, calendars, time zones, measurement units, accessibility, and locale privacy/fingerprinting.
- Configurable Shells and sessions: Fuchsia sessions, Android launchers and intent resolution, Linux desktop environments, GNOME/KDE shell extension models, rescue shells, console shells, kiosk/mobile shells, and how shell customization affects API compatibility.
- Future web platform capabilities: File System Access API, Storage Buckets, Web Locks, Badging/Notifications, Background Sync limits, Isolated Web Apps, WebGPU/WebCodecs where relevant, and the practical browser-support tradeoffs.
- Agent-native OS work: MCP, A2A, AIOS, OSWorld, WebArena, VisualWebArena, WebDriver BiDi, OpenAPI, ARIA/accessibility mappings, llms.txt, policy cards, prompt/tool injection research, and modern computer-use safety guidance.

The output should separate **what exists today**, **what is emerging**, and **what would be an EFS-specific invention**. The point is not to chase novelty; it is to avoid freezing a decades-old OS model into a protocol-adjacent client that will be hard to change later.

One especially fertile idea: a hyperlink could name an EFS OS or app closure, similar in spirit to a Nix flake/generation. The Bootstrapper could resolve hashed JS/WASM packages, import maps, app manifests, policies, Kernel/Shell versions, and app-specific resources into a static reusable system profile that can be verified, cached, shared, forked, upgraded, or rolled back.

Naming is also part of the research. "Ethereum Operating System" or "EOS" may be a useful thought experiment, but do not assume the acronym is available, ownable, or strategically correct. Fable should explore product names and developer names separately: the user-facing environment, the Shell, the OS SDK, and the underlying EFS protocol may need different names.

## Baseline to preserve in the exploration

The official client is not just a file explorer. The target shape is a sovereign, zero-trust, offline-capable web OS:

```text
Bootstrapper -> Kernel -> Shell -> Apps
```

- **Bootstrapper:** raw browser access, service worker registration, Kernel worker spawn, Shell compartment setup, no UI.
- **Kernel:** dedicated worker, no DOM, owns crypto, encrypted state, app permission ledger, wallet and network mediation.
- **Shell:** system UI, window manager, prompts, file pickers, app install/update UX, permission center.
- **Apps:** untrusted Ring 3 compartments that receive only an attenuated `efs.*` capability object.

Stack leanings already captured: static SPA, IPFS-compatible relative paths, Vite, Lit, Web Awesome, SES, possible LavaMoat-style policy, no heavyweight framework unless it earns its keep. Fast load matters because users will arrive from deep links directly into files, apps, citations, permissions, or sync states.

## Cypherpunk privacy and HTTP boundary

EFS OS should be cypherpunk: self-sovereign, user-first, privacy-focused, reliable, inspectable, and resistant to forced vendor control. No forced upgrades. No hidden telemetry. No mandatory vendor servers. Users should be able to control most of the stack, including update policy, package channels, RPC providers, storage gateways, cache retention, Shell choice, and app permissions.

HTTP must be treated as a security and privacy risk, not a harmless utility. Any web server contacted by the OS or an app can learn the user's IP address or proxy exit, timing, user agent, request path, referrer-like context, and often enough information to infer what the user is opening, reading, searching for, or syncing. For EFS, that can be extremely sensitive.

Hard requirement to test:

```text
No OS-level ambient HTTP.
No app-level HTTP by default.
Every network endpoint is a capability.
```

Onchain, IPFS, Arweave, and similar systems are safer only when the user can choose or run the endpoint. A public RPC, public IPFS gateway, public Arweave gateway, CDN, or HTTP mirror is still an observer. The OS should distinguish protocol trust from endpoint privacy.

Implications:

- The official OS should not make hidden HTTP calls for analytics, telemetry, remote config, fonts, avatars, update checks, crash reporting, package discovery, or convenience APIs.
- Apps should start with no HTTP/fetch/WebSocket/beacon/subresource network access beyond what the OS explicitly grants.
- If an app requests HTTP, the permission should be origin-scoped by default: exact websites or endpoint classes the user approves.
- Wildcard network access such as `https://*` or `*` should require a major warning, because it lets the app reveal user behavior to arbitrary servers.
- App manifests should declare all network origins and whether they are required, optional, user-configurable, or replaceable.
- The Shell should show network capability diffs during install/update and maintain a network-permission ledger.
- The Kernel/Shell should mediate transport through capability handles where possible: `RpcEndpointHandle`, `IpfsGatewayHandle`, `ArweaveGatewayHandle`, `MirrorFetchHandle`, `HttpOriginHandle`, or similar.
- Deep links and OS profiles should not smuggle in new HTTP endpoints without review.
- Package loading should prefer content-addressed, cached, signed packages. HTTP package fetches, if ever allowed, should be explicit endpoint choices with integrity checks and no silent upgrade behavior.
- Inference providers are HTTP-like privacy risks. `efs.inference` should route through user-configured providers and policies, with clear data-sharing and retention warnings.

Design prompt for Fable: What is the minimal network-permission model that preserves fast, useful apps without turning every app launch, file open, search, model call, or package update into a privacy leak?

## Global locale and language foundation

EFS OS is global. Locale, language, script, direction, accessibility, and cultural formatting should be foundation-level OS concerns, not late UI polish.

This is bigger than translated strings. The OS needs a locale subsystem that can shape how humans and agents read, write, search, sort, sign, review, and share data:

- **Language preferences:** primary language, fallback languages, per-app overrides, per-content language metadata, and multilingual users.
- **Locale identity:** BCP 47 language tags, region, script, numbering system, calendar, hour cycle, collation, measurement units, currency display, and time zone.
- **Text direction and scripts:** right-to-left, bidirectional text, vertical text where relevant, CJK layout, combining marks, grapheme clusters, emoji, Unicode normalization, and safe truncation.
- **Formatting:** dates, times, relative time, durations, numbers, currencies, file sizes, addresses, names, lists, plural rules, ordinals, and sort order.
- **Input:** IME support, keyboard layouts, composition events, spellcheck, autocorrect, transliteration, voice input, and mobile text entry.
- **Fonts and rendering:** bundled/offline font strategy, font fallback, user-installed fonts where safe, no hidden HTTP font loads, readable fallback for missing glyphs.
- **Search and indexing:** locale-aware tokenization, segmentation, collation, case folding, accent handling, transliteration, and language-specific search behavior.
- **Accessibility:** screen-reader language tags, accessible names in the active locale, captions/transcripts where relevant, contrast and motion preferences, and WCAG-aligned defaults.
- **Offline localization:** translation packs, locale data packs, and help/docs should be content-addressed, signed, cached, and usable offline.

Locale data is also privacy-sensitive. A full locale stack can fingerprint users, especially when combined with time zone, fonts, language list, region, and input method. The OS should let apps format data for the user without automatically exposing every locale detail. Consider a `LocaleHandle` or formatting service: apps can ask the OS to format dates/numbers/lists/collation/search tokens without receiving the full user profile unless explicitly granted.

Design questions:

- Is locale state local-private, encrypted sync state, signed user policy, or a mix?
- What locale data is app-visible by default, and what requires a capability?
- Can an app request "format for user" without learning the user's full language list, region, time zone, and fonts?
- How are language packs, locale data, and fonts packaged, signed, cached, updated, and rolled back without forced upgrades?
- How does EFS represent content language/direction metadata for files, records, comments, app manifests, package descriptions, and citations?
- How does the Shell prevent layout bugs from translated text expansion, right-to-left UI, mixed-direction identifiers, long words, and CJK density?
- What is the fallback path when a locale pack, font, or translation is missing offline?
- How does a user switch language or time zone in a privacy-preserving way without breaking signed receipts, audit logs, citations, or chain timestamps?
- Should agents receive locale/language preferences as task context, and how much of that context is safe to reveal to models or external services?

## Configurable Shell gut check

James raised an important question: should the Shell itself be configurable or replaceable?

The interesting version is not "themes and plugins." It is whether EFS can support multiple Shell implementations over the same Kernel and OS SDK contract:

- **Human desktop Shell:** default multi-window workspace, files, trust/lens, sync, app install, settings.
- **Mobile Shell:** phone-first navigation, touch gestures, share sheet, mobile wallet constraints, smaller deep-link flows.
- **Console Shell:** power-user command surface, scriptable inspection, recovery, and bulk operations.
- **Agent Shell:** optimized for structured actions, task queues, audit, approvals, and machine-first navigation.
- **Kiosk/domain Shell:** narrowed experience for events, archives, publishing, school/company workflows, or embedded views.
- **Rescue Shell:** minimal trusted fallback for broken Shell profiles, bad packages, bad permissions, or failed migrations.

Gut-check thesis:

```text
Kernel is the stable trust base.
OS SDK is the compatibility contract.
Shell is a replaceable session only if core app hosting, prompts, permissions,
wallet mediation, render isolation, sync, and recovery remain reliable.
```

This could be valuable. A single Shell may force awkward compromises across desktop, mobile, agents, and power users. A configurable Shell also fits the content-addressed profile idea: an OS profile could name `Kernel CID + OS SDK version + Shell CID + Shell policy + app closures`, making Shells shareable, cacheable, reversible, and inspectable.

It could also be dangerous. If Shells own prompts, app hosting, wallet approvals, and permission UI, then a malicious or sloppy Shell can confuse users, hide risk, break app compatibility, or strand the user after an upgrade. GNOME-style shell extensions are a warning: customizing the thing that presents the OS can create quality, lifecycle, and security pressure. Linux-style kernel modules are an even stronger warning: extension points below the trust boundary need signing, compatibility rules, and a very high bar.

Possible design line:

- The **Kernel is EFS-owned and not casually configurable**. A technical user could manually install a custom Kernel profile, but that is a power-user fork path, not normal UX.
- The **official OS SDK is the Shell/app contract**. Shells should not invent private app APIs that fragment the ecosystem.
- The **Shell may be replaceable as a signed/capability-routed session** if it passes compatibility and safety tests.
- Shell packages should declare supported OS SDK versions, required system services, prompt/render responsibilities, migration policy, and fallback Shell.
- The Kernel should reserve a small set of unforgeable recovery and safety surfaces, or at least be able to boot the Rescue Shell when the configured Shell fails.
- "Kernel modules" should probably start as **system services or runners** with narrow capabilities, not arbitrary code injected into Kernel authority. True Kernel plugins need a separate research pass and a presumption against v2 unless they solve a concrete blocker.

Design prompt for Fable: Can EFS support Shell plurality without fragmenting app compatibility or weakening secure prompts? If yes, what is the minimal Shell contract and recovery model? If no, can the default Shell still support mode-specific layouts, command surfaces, mobile views, and agent views without becoming a rigid monolith?

## Agent-native design axis

See [[agent-native-os-compass-for-fable]]. Agent-first should not mean agent-themed UI, and it should not drown the product in agent vocabulary. It means the OS foundations treat agents as real actors that can safely discover, plan, dry-run, execute, audit, and recover actions through structured capabilities.

Principle to preserve:

```text
Every action should be humane for people and structured for agents.
```

Humans should get excellent Shell UI. Agents should get typed OS actions, stable resource IDs, app manifests, dry runs, receipts, progress events, cancellation, budgets, and approval queues. Visual computer-use should exist as a fallback for legacy apps and visual verification, not as the normal interface for first-party OS workflows.

Possible agent-specific surfaces:

- **Agent Center:** active agents, goals, scopes, budgets, tools, recent actions, blocked approvals, and kill switch.
- **Task Queue:** long-running jobs, checkpoints, retries, handoff, artifacts, and cancellation.
- **Approval Queue:** high-impact actions awaiting human review: signing, publishing, spending, app install, admin grants, export, or local data deletion.
- **Agent Audit Log:** plans, tool calls, capability use, file reads/writes, prompts, approvals, signed receipts, errors, and recovery.
- **Agent Memory Vault:** user-owned memories and task state, scoped separately from public EFS records and ordinary app storage.
- **Agent Tool Registry:** OS-native actions and optional MCP/OpenAPI/A2A bridges exposed to approved agents.
- **Inference Settings:** user-configured web inference APIs, local/cloud models, budgets, privacy policy, retention, and per-app/agent access.

Design prompt for Fable: Where do agents fit in the Kernel/Shell/App model: apps, principals, sessions, services, delegates, or a separate actor class? What is the smallest agent model that lets the system be powerful without giving agents ambient human authority?

## EFS SDK vs EFS OS SDK

Fable should keep two SDK layers distinct:

- **EFS SDK:** the general-purpose protocol/data SDK for third-party apps, scripts, services, and the official client itself. It handles deterministic EFS busy work: building records and bundles, encoding and decoding, hashing, reading, verifying, resolving, preparing signing payloads, selecting submission strategies, and talking to a provided chain/RPC/storage seam. It should stay dependency-light and usable anywhere, including non-OS apps.
- **EFS OS SDK:** the official-client app-runtime SDK for apps running inside the EFS web OS. It handles app-to-Shell and app-to-Kernel communication: capability objects, permission requests, secure prompts, file/app pickers, wallet request mediation, local storage quotas, background task grants, outbox/checkpoint APIs, cache/offline hints, render-surface requests, lifecycle events, and app-visible system settings where allowed.

A useful mental split:

```text
EFS SDK = how to make, read, verify, and submit EFS data.
EFS OS SDK = how an app lives inside the official EFS client.
```

The OS SDK may use the EFS SDK internally, but the EFS SDK should not depend on the Shell, DOM, wallet UI, permissions UI, app manifests, or official-client runtime. Third-party apps outside the OS should be able to use the EFS SDK without adopting the EFS OS. Apps inside the OS, including first-party apps such as a file browser if it is modeled as a normal app, can use both: the EFS SDK for data work and the EFS OS SDK for user-mediated powers.

The file browser is a useful test case. It may feel like a built-in system feature, but it should probably start life as a normal app unless there is a specific reason to privilege it. If it needs broader powers, those powers should be named capabilities granted by the Shell/Kernel, not ambient access because it shipped with the client.

Design prompt for Fable: Where is the boundary between a portable protocol SDK and a sovereign client OS runtime, and what naming keeps app developers from confusing them?

## Privileged apps, admin powers, and system config

The OS design should not assume only first-party apps can ever touch system-level user config. It also should not expose "root" as a casual app API.

Fable should explore a modern access-control model for privileged powers:

- **Ordinary apps:** untrusted Ring 3 apps, including likely first-party apps such as Files, Notes, or media viewers. They receive user-mediated capabilities through the EFS OS SDK.
- **System apps:** apps that have stronger default integration with Shell surfaces but still use explicit capabilities and can be audited.
- **System services:** Kernel/Shell-owned services such as sync, wallet bridge, resolver, package manager, render service, and permission manager. These may hold powers ordinary apps cannot hold directly.
- **Admin capabilities:** explicit, high-risk handles for settings, app installation, trust/lens defaults, background services, wallet policy, storage quotas, and maybe system-level user config.
- **Root/kernel powers:** internal authorities that should be narrowed into attenuated handles before any app sees them.

Potential future: third-party apps might request access to system-level user config, similar to modern OS privacy controls, enterprise policy, configuration profiles, or portal APIs. That could enable power-user tools and alternate shells without making every app omnipotent.

Design questions:

- What is a "system setting" in EFS: local-only preference, signed user policy, lens/default-trust config, wallet policy, app permission ledger, or protocol-visible record?
- Can a third-party app request a scoped settings handle, such as "read theme and locale," "propose a lens default," or "manage background sync policies for files it owns"?
- Are admin capabilities grantable, time-limited, revocable, delegated by app install, or only activated per action?
- What system config changes require Shell-owned secure chrome and a user-visible receipt?
- Can privileged apps be installed from outside the official distribution, or are they first-party only for v2?
- How does revocation work when a privileged app already changed durable config or wrote signed EFS records?
- Is there an audit log for system-level changes, and can it be exported or itself written to EFS?
- What is the minimum "root" surface that must exist, and how can it be kept out of app code?

## New axis from James: persistence as an OS subsystem

The design should probably not "add caching" as a bolt-on. It should ask whether client v2 needs a named OS subsystem:

```text
Client Persistence Layer = cache + local write journal + signed checkpoints + flush engine
```

This should stay browser-side: service worker, Cache API, IndexedDB or OPFS, and in-memory hot caches. Do not assume server middleware, backend cache invalidation, or a web server. The app should work offline as best it honestly can.

Possible cache strata:

- **Shell/module cache:** first-load app shell, lazy app chunks, app packages, viewer modules.
- **Record cache:** EFS claims, slots, envelopes, lens lists, deny/advisory facts, checkpoints.
- **Byte cache:** mirror bytes keyed by `contentHash`, dataId, claimId, transport, and verification status.
- **View cache:** materialized path/lens/deny/venue resolutions, with read grade and provenance.
- **Thumbnail/media cache:** derived previews, never mistaken for source bytes.
- **Package cache:** content-addressed app bundles and dependency graphs.
- **Local overlay:** pending writes shown above cached chain state, clearly labeled as local or pending.

Cache entries may need to carry more than a key and value: venue, chain, lens, deny set, read context (`GATE` vs `INTERACTIVE`), read grade, currency qualifier, checkpoint/as-of bound, source claims, byte verification status, and whether the result came from trusted resolution or discovery.

Design prompt for Fable: What is the smallest cache model that makes the client feel instant without lying about freshness, completeness, or trust?

## Local write journal and flush engine

James's disk-write analogy seems important. The client should explore an OS-style writeback system:

1. Apps create local actions: make folders, write files, pin data, add tags, update lenses, revoke placements.
2. Kernel records these as local intents in an encrypted journal.
3. Shell shows local/pending changes immediately, but labels them as not yet canonical.
4. The Kernel composes compatible intents into plans and batches.
5. At a checkpoint, the user reviews a human-readable preflight summary.
6. The user signs one EIP-712/Merkle-root bundle where possible.
7. The flush engine submits the signed bundle now or later, as full batch or chunks.
8. Progress is resumable and idempotent.

Suggested vocabulary to test:

| State | Meaning |
|---|---|
| `draft` | Local editable intent; no author commitment. |
| `planned` | Deterministic records built; IDs, dependencies, estimates, and summary are known. |
| `ready_to_sign` | Envelope/root/count prepared; preflight summary should be stable. |
| `signed` | Author committed; the bundle is replayable, but not necessarily submitted. |
| `queued` | Waiting for network, relayer, policy, or user action. |
| `flushing` | Active submission through tx, UserOp, relayer, or chunk worker. |
| `submitted` | Transaction/job accepted somewhere; admission not proven yet. |
| `partially_admitted` | Some records landed; resumable; never silent. |
| `complete_on_chain` | All records for that envelope admitted on a named chain. |
| `chain_finalized` | Final enough for a specific chain policy. |
| `replicated` | Admitted or archived in additional target venues. |
| `declined` | Sponsor/relayer refused; self-pay or another route may remain. |

Open design question: Should ordinary "save" create only unsigned local drafts until a checkpoint, or should the client encourage early signing so a portable authored artifact exists even before chain admission?

## Wallet actions, batching, and checkpoints

The v2 envelope direction already supports the shape James is asking for: one signature over many records; independent records extractable; partial submission visible; idempotent resume.

Fable should explore:

- **Action outbox:** a user-visible OS panel for pending write-like actions.
- **Batch composer:** accumulate small actions into named batches with "sign now" vs "keep collecting."
- **Flush center:** queued signed bundles, relayer jobs, txs, retries, partial admission, mirror uploads.
- **One-signature bulk import:** photo archives, migrations, package registries, and app installs can sign one root and submit chunks over time.
- **Offline signed bundle export:** a `.efs-bundle`-like artifact containing header, records, signature, summary, and progress metadata.
- **Sponsor/self-pay switchboard:** relayer/paymaster can pay gas, but must be presented honestly: it can see content, can decline, and is not the author.
- **Persona wallets:** main identity, per-app burner, offline signer, connected wallet, app-held hot key. Each has different convenience and permanence risks.

Big warning: once signed, a bundle is no longer a private draft. Anyone holding it may submit it later or elsewhere, depending on the envelope rules. That is the feature and the danger.

## Product surfaces to consider

These are not required screens. They are candidate system surfaces that kept recurring across the expert lanes.

- **Deep-link cold start resolver:** before rendering content, show enough of the resolution context: path vs citation, venue, lens chain, deny set, freshness, byte availability.
- **Files / archive browser:** current view, versions, claims, mirrors, provenance, local overlay, write history.
- **Lens / trust manager:** perhaps dock-level, not buried. Lens chains, pin-and-diff, deny sources, curator updates, domain-scoped trust later.
- **Share / citation center:** path link for browsing, citation/proof link for reproducible references.
- **Sync center:** local journal, signed bundles, submissions, relayers, mirror uploads, partial admission, replay/export.
- **Permission center:** installed apps, grants, runtime requests, revoked permissions, storage quotas, background subscriptions, recent privileged operations.
- **Network privacy center:** approved endpoints, denied endpoints, per-app HTTP grants, wildcard warnings, endpoint health, self-hosting instructions, and recent network use.
- **Language and locale settings:** language fallback order, region, script, time zone, calendar, numbering, units, collation, input methods, translation packs, fonts, and per-app overrides.
- **App install/update ledger:** app identity, package hash/CID, signer, update channel, capability diffs, endpoint diffs, storage migrations.
- **System settings / admin center:** local preferences, signed user policies, app grants, default lenses, trusted package channels, wallet policies, storage quotas, and audit history.
- **Secure prompt surface:** Shell-owned prompt chrome apps cannot imitate, with app identity, requested authority, effect summary, prior grant context, risk class, and receipt.
- **Render service:** active content viewers for HTML/SVG/PDF/JS/mirrors, always isolated from trusted origin.
- **Developer/debug mode:** resolution trace, slot probes, read grades, raw records, app manifest simulator, capability diff, outbox inspection.
- **Background services tier:** sync, courier, index/watch, media thumbnailing, offline capture, telemetry import. These may not fit as ordinary Ring 3 UI apps.
- **Agent Center / Task Queue:** scoped automation, approvals, budgets, progress, recovery, receipts, and kill switch.
- **Inference settings:** provider accounts, local/cloud policy, budgets, privacy, retention, and which apps/agents may invoke models.
- **Shell / profile manager:** installed Shells, active Shell profile, compatibility status, capability diffs, fallback Rescue Shell, rollback, and update history.
- **Rescue Shell:** minimal first-party fallback for recovery, permissions reset, app/package rollback, Shell switch, and export.

## OS platform questions

Questions Fable should explore rather than answer too early:

- Is the official client best framed as a file OS, a trust browser, or an archive workstation?
- Is the first-run flow a marketing wizard, or a truth-orientation flow that teaches permanence, lenses, address homes, and "delete means unlist"?
- Should "Lens Manager" be a first-class OS app alongside Files and Apps?
- What is the default lens story if the protocol ships no default lens?
- Is the default app-permission flow manifest review, capability-by-selection, or a hybrid?
- What gets secure Shell chrome: wallet signs, lens proposals, app installs, permission changes, citation export, file pickers?
- What gets network/privacy chrome: first HTTP grant, wildcard access, new endpoint introduced by update, inference provider use, package fetch, mirror fetch, or deep-link endpoint?
- What gets locale/privacy chrome: full locale profile access, time zone access, installed font probing, input method access, or language-list access?
- How much read-grade vocabulary is visible in normal mode versus debug mode?
- Should citation mode look visually different from browse mode, like a commit versus a branch?
- Are background services installable apps, OS daemons, or a third "service grant" class?
- Are first-party apps like Files normal apps, privileged apps, or Shell surfaces?
- What is the smallest admin/root model that still allows future third-party power tools?
- What does "offline available" mean if the path catalog is cached but bytes are missing?
- Are agents apps, users, services, sessions, principals, delegated actors, or some combination?
- What actions need structured schemas, dry-run previews, receipts, and recovery paths so agents do not depend on screenshots?
- Where does the human approve agent work: per action, per batch, per policy, per session, or only for high-risk checkpoints?
- Should Shells be replaceable sessions, mode-specific layouts inside one Shell, or first-party-only variants?
- Which duties must every Shell implement: app hosting, prompt display, permission review, file pickers, wallet approvals, render isolation, sync status, app install, accessibility, agent approvals, recovery?
- What surfaces must remain Kernel-owned or Rescue-Shell-owned so a broken or malicious Shell cannot strand the user?
- Can a user share a Shell profile safely, and does opening one require a scary install/update/capability-diff flow?
- How are Shell compatibility, OS SDK versions, app feature upgrades, and fallback/rollback tested before a Shell becomes selectable?
- Should there be Shell extensions at all, or only full Shell packages plus ordinary apps/system services?

## App platform questions

The Ring 3 platform deserves its own pass:

App manifest ingredients to explore:

- App identity, package hash/CID, signer, update channel, OS SDK version range, dependency policy, and migration hooks.
- Requested capabilities with scopes, optional vs required powers, background task declarations, storage quota, network origins, render needs, and wallet/signing classes.
- Agent-visible action catalog, risk classes, human approval requirements, test fixtures, and optional bridge outputs such as MCP, OpenAPI, llms.txt, or A2A metadata.
- Install/update diff fields: capability expansion, endpoint changes, signer changes, package hash changes, background budget changes, and storage migration effects.

- What is canonical app identity: package CID, manifest UID, reverse-DNS path, signer address, ENS, or a tuple?
- Are app packages signed or attested on EFS, web-signed, lens-curated, or merely content-addressed?
- Is LavaMoat for the official client's own dependency graph, third-party app bundles, or both?
- Are app manifests maximum authority ceilings, with runtime grants and picker grants below them?
- What update policy is acceptable: silent same-permission updates, trust-channel updates, or every update reviewed?
- How does app storage migrate across versions?
- Can failed migrations roll back?
- Do Ring 3 apps get Workers? If so, does `efs.worker.spawn` clone only explicit attenuated capabilities?
- How are background subscriptions budgeted and suspended?
- What is the OS-level story for inter-app events without covert channels?
- Should generic `wallet.sendTransaction` exist in Ring 3 at all, or should v1 expose only EFS-shaped writes?
- What belongs in `@efs/sdk`, what belongs in a possible `@efs/os-sdk`, and what is private Kernel/Shell implementation detail?
- Is the EFS OS SDK just a small typed bridge over postMessage/capability RPC, or should it expose higher-level app primitives like `openFilePicker`, `requestWriteCheckpoint`, and `showSystemPrompt`?
- How do third-party app authors know when they are building a normal EFS app with the EFS SDK versus an in-client Ring 3 app with the EFS OS SDK?
- Can an app request system-level user config through a capability, and what proof/prompt/audit trail makes that safe enough?
- What app capabilities are allowed only for first-party apps in v2, and which are merely sensitive but potentially grantable later?
- Is HTTP represented as one permission, per-origin capabilities, protocol-specific handles, or a network broker with strict manifests and CSP enforcement?
- How does the OS prevent passive subresource leakage, such as images, fonts, scripts, CSS, iframes, link previews, favicons, and preconnects?
- How does an app declare supported locales, translation packs, direction support, text expansion tolerance, font needs, and locale-data dependencies?
- How does an app expose an agent-readable action catalog without turning every method into a tool with dangerous ambient authority?
- What belongs in an OS-native agent bridge versus optional MCP, OpenAPI, llms.txt, or A2A adapters?

## Security and truth traps

These are failure modes where the UI can accidentally lie:

- Treating `UNKNOWN` as absence and falling through to lower-trust authors.
- Rendering stale or copied-chain data as plain live truth.
- Conflating `STALE` with `REVOKED`: "lapsed" and "withdrawn" mean different things.
- Showing discovery results, counts, comments, or likes as complete trusted truth.
- Calling something "synced" when only part of an envelope was admitted.
- Saying "deleted" when bytes or names remain permanently available and only a placement was withdrawn.
- Saying a vanity path is owned like DNS when address containers are the self-certifying root.
- Saying "Carol's lens" as if it is Carol's view; it is really a delegation order that can shadow paths.
- Treating app permission revocation as if prior writes disappeared.
- Allowing a bundled write prompt to hide one dangerous action among harmless ones.
- Showing a signed bundle as private or revocable intent.
- Letting active mirror content render in the trusted origin.
- Letting OS or app HTTP calls reveal what a user opened, searched, installed, synced, asked a model, or viewed.
- Treating IPFS/Arweave/onchain as private while silently using a centralized public gateway or RPC endpoint.
- Allowing wildcard HTTP/network access as a routine app permission.
- Loading fonts, images, avatars, scripts, link previews, or package metadata from HTTP without explicit endpoint review.
- Letting deep links or app updates add new network endpoints without a capability diff.
- Hiding inference-provider data sharing behind generic "AI" UX.
- Treating locale as harmless settings while leaking language list, region, time zone, fonts, input methods, or collation as fingerprinting data.
- Hard-coding US English assumptions into dates, numbers, currencies, file sizes, names, addresses, sort order, keyboard flows, or warning text.
- Breaking Shell layouts under translated text expansion, right-to-left UI, mixed-direction labels, long words, or CJK density.
- Showing signed receipts, timestamps, or citations in localized form without a stable canonical representation underneath.
- Letting app modals look like Shell prompts.
- Letting extension-risk warnings imply SES can defeat a high-privilege browser extension.
- Treating "first-party" as a security boundary instead of a distribution/provenance fact.
- Giving privileged apps ambient system access instead of narrow, logged, revocable capabilities.
- Making system config local when it needs to roam, or signed/public when it should stay private.
- Letting configurable Shells fork the app API so apps work only in one Shell.
- Letting third-party Shells imitate secure prompts without an unforgeable Kernel/Shell boundary.
- Letting a bad Shell update remove the user's ability to switch Shells, revoke permissions, inspect wallet prompts, or boot a recovery surface.
- Treating Shell extensions like harmless UI tweaks when they can affect prompts, app hosting, input, clipboard, window focus, or wallet mediation.
- Treating Kernel modules as normal plugins instead of signed, compatibility-checked, highly privileged extensions.
- Letting agents inherit the human's ambient login, wallet, clipboard, file, model, or network authority.
- Letting tool descriptions, app manifests, mirror content, package metadata, comments, or files prompt-inject agents.
- Making core OS actions GUI-only so agents must scrape pixels or infer hidden state.
- Letting an agent publish, spend, export, install, grant admin powers, or flush signed bundles without human-readable review.
- Letting agent memory become stale, cross-contaminated, or silently written to public EFS.

## Possible vocabulary to test

- **Address Home** for self-certifying roots.
- **Live Link** and **Citation Link**.
- **Trust Order** for user-facing lens order; **lens chain** for technical/debug surfaces.
- **Delegation order** for subscribed lenses, not "view."
- **Unlist** or **withdraw placement**, not "delete," except for local cache deletion.
- **Lapsed** for STALE; **Withdrawn** for REVOKED.
- **As of checkpoint N**, **freshness unknown**, **browsing snapshot**, **bytes unavailable**.
- **Found by discovery, not endorsed**.
- **Capability receipt** for app install/update grants.
- **Endpoint capability** for any network destination an app or OS service may contact.
- **Network privacy receipt** for approved, denied, changed, or wildcard network access.
- **LocaleHandle** for OS-mediated formatting, collation, segmentation, and language fallback without unnecessary locale disclosure.
- **Language pack** for signed, content-addressed, offline translations and locale resources.
- **System request** for Shell-owned prompts.
- **Action outbox** or **Sync center** for journal and flush state.
- **Admin capability** for high-risk user-granted settings powers.
- **System service** for Kernel/Shell-owned daemons, not ordinary apps with extra privilege.
- **Settings receipt** for durable config changes.
- **Agent session** for a bounded automation run with goal, scope, model/provider, budget, expiry, and capabilities.
- **Action receipt** for agent/human-visible proof of planned, approved, executed, failed, or recovered actions.
- **Memory Vault** for scoped local agent memory that is not automatically public EFS content.
- **Shell profile** for a selected Shell package, OS SDK compatibility range, app/default-service mapping, policy, fallback, and generation.
- **Rescue Shell** for a minimal trusted recovery session.
- **System module** for a privileged service/runner loaded below ordinary apps; avoid "Kernel module" unless it truly extends Kernel authority.

## Ingredients from the expert brainstorm

Six specialist lanes informed this handoff:

- Offline/cache/local-first OS.
- Wallet actions, batching, flushing, and signed bundles.
- Security/capability OS architecture.
- Product/UX operating-system surface.
- Ring 3 app platform and developer experience.
- Agent-native OS surfaces and structured action APIs.

Common convergence:

- Caching is not just performance. It is a trust surface.
- Offline is not binary. It has grades, venues, checkpoints, byte availability, and local overlays.
- Signing is a checkpoint, not just a wallet popup.
- A signed bundle is an authored artifact, not a private draft.
- Sync/flush deserves visible OS treatment.
- The Shell must own prompts, pickers, permissions, app installation, and render isolation.
- HTTP/network access is a privacy-sensitive capability. Default deny, exact endpoint grants, no hidden OS HTTP, and loud wildcard warnings.
- Locale/i18n is foundational OS plumbing. Language, direction, formatting, input, search, fonts, accessibility, and locale privacy need to work across Shells and apps.
- The EFS SDK and EFS OS SDK need separate identities: protocol/data helpers are not the same thing as app-runtime powers.
- First-party apps should not automatically be root. Privilege should come from explicit capabilities, system-service boundaries, and visible receipts.
- The foundations deserve current research before design freeze; use old OS metaphors as references, not defaults.
- Agent-first design should be structural: typed actions, capabilities, approvals, receipts, budgets, and tests, not marketing copy.
- Configurable Shells are promising only if the OS SDK, secure prompts, recovery, and app compatibility stay stable across Shells.
- Fable should design the client as a creative OS, not as a thin SDK demo.

## Feedback into EFS v2 designs

Fable should treat official client v2 design as a pressure test for the EFS v2 design set, not as a layer that silently papers over protocol or SDK gaps.

If Fable finds an OS feature, app-platform need, privacy requirement, agent capability, Shell model, locale need, cache/journal behavior, wallet batching flow, package/update model, or permission primitive that the EFS v2 designs do not support, make hard to implement, or simply did not consider, Fable should record that back into the EFS v2 design work.

Preferred handling:

- Add a section to the relevant existing `Designs/efsv2/` file if there is an obvious home.
- Otherwise create a focused note in `Designs/efsv2/`, with a name that makes the pressure clear.
- Cross-link the new note from the client v2 handoff/design thread if the client design depends on it.

The note or section should include:

- **Problem:** what client OS feature or guarantee exposed the gap.
- **Why it matters:** user impact, safety impact, privacy impact, app-platform impact, or implementation risk.
- **Current mismatch:** what the current EFS v2 design appears to support, block, complicate, or leave undefined.
- **Possible solution paths:** protocol/kernel change, SDK change, OS SDK change, Shell/service design, app-layer workaround, or explicit "needs research."
- **Risk of deferring:** what breaks or becomes harder if the foundation ships without answering it.
- **Open questions:** crisp questions for the next EFS v2 design pass.

Do not force a full solution if Fable is not sure. A clear "this needs to be looked into" note is better than burying the issue inside a beautiful client mockup.

## Open questions

- [ ] What should be the default local-write lifecycle: unsigned draft first, or early signed bundle?
- [ ] How much signed-bundle and partial-admission detail should normal users see?
- [ ] What is the first-run truth-orientation flow?
- [ ] What is the app identity and update model?
- [ ] What is the default network privacy model: no HTTP, exact-origin grants, endpoint classes, privacy proxies, self-hosted endpoints, and wildcard warnings?
- [ ] What is the OS locale model: language packs, `LocaleHandle`, app-visible locale, locale privacy, text direction, input methods, fonts, search, and accessibility?
- [ ] What belongs in Kernel, Shell, system service, Ring 3 app, SDK, or protocol?
- [ ] What is the clean product and package boundary between the EFS SDK and the EFS OS SDK?
- [ ] Which first-party apps are ordinary apps, which are system apps, and which are Shell/Kernel services?
- [ ] What modern OS/web/local-first/security patterns should Fable adopt, reject, or reinvent?
- [ ] Which OS surfaces are first-class for v2 design versus later app-layer work?
- [ ] What agent-specific actor model, SDK surface, inference service, audit trail, and safety tests belong in client v2 foundations?
- [ ] Is the Shell configurable, replaceable, extension-capable, first-party variant-only, or deliberately fixed for v2?
- [ ] What Shell contract, Rescue Shell, profile rollback, and compatibility tests protect users if Shell plurality exists?

## Pre-promotion checklist

This file is a handoff packet, not a candidate for promotion as-is.

- [ ] Fable reads this before drafting client v2.
- [ ] Fable either absorbs, revises, or explicitly discards these ingredients in the client v2 design thread.
