# Client repository, build and development environment

**Status:** draft — client PM input to Claude's repository initialization and architecture plans
**Target repos:** planning, client, sdk, contracts
**Depends on:** [[README]], [[technology-foundation]], [[architecture-and-modules]], [[app-runtime-and-direct-launch]], [[system-profiles-and-generations]], [[../sdkv2/web-client-os-boundary-pressure]], [[../efsv2/prototype-implementation-plan]]
**Last touched:** 2026-09-26

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #repo/contracts #topic/cypherpunk-os #topic/web-platform #topic/performance

## Problem

The client repository will grow from a fast Files SPA into an intricate, modular Web OS. Its first structure must preserve that direction while remaining easy to understand, run and change. James specifically asks for compilation boundaries, tooling, layout, workflows, concurrent development and realistic multi-user testing. Claude will draft initialization plans for PM review before creation. This document is design input; it creates no product repository, dependency installation or implementation authorization.

The desired contributor experience is a fresh checkout with one documented setup step, then one launch command or editor button. A second checkout, developer or agent must be able to run concurrently without editing port constants, resetting someone else's chain or taking over their browser. QA must also be able to run several independent users against the same chain deliberately.

Here, `client/` means the successor product repository, independent of its eventual public name. The September naming sequence in [[Onboarding/repo-map#Successor repository naming]] uses temporary `client-v2`, `sdk-v2` and `contracts-v2`; older proposals to rename/reclaim immediately do not control initialization.

## Proposal

### 1. Decision frame and smallest useful structure

**Established requirements:** static and IPFS hosting; fast guest file/folder and later exact-App links; explicit wallet promotion; shared SDK semantics; Web Components and TC39 Signals; modern browser capabilities with named support profiles; accessible, internationalized desktop/mobile/PWA behavior; private state and human/agent parity; user-controlled accepted releases. Full OS services must remain absent from guest startup. See [[README#Direct owner direction recorded for this round]] and its later reconciliation.

**Recommendation:** one private pnpm workspace inside the client repository, one principal SPA and a small independently buildable rescue entry. Organize source by responsibility first. Extract workspace packages only when they have a distinct consumer, execution environment or test/release boundary. Contracts and SDK stay separate repositories and are consumed through pinned artifacts.

| Approach | Judgment |
|---|---|
| One flat SPA with a global Kernel singleton | Initially easy, but authority, account state and UI dependencies spread together; unsuitable for concurrent sessions and later confined apps. |
| One client workspace, a few explicit entrypoints, ordinary source modules | Recommended. Makes loading and ownership inspectable without prematurely creating a package for each future service. |
| A separate package, build and version for every planned OS slot | Defer. Creates release/configuration overhead before independent consumers justify it. Service interfaces do not require npm-package boundaries. |

The existing large logical package tree in [[architecture-and-modules#Greenfield repository and tooling recommendation]] describes future responsibilities. It is not the initial scaffold checklist. Use this smaller layout to translate those responsibilities into the first repository:

```text
client/
  apps/web/
    index.html
    src/
      boot/                 # route ingress, public config, feature profile
      composition/          # explicit trusted service construction
      platform/             # browser adapters: lifecycle, storage, workers
      shell/                # small viewer frame, navigation, trusted actions
      features/files/       # Files UI/controllers over SDK facade
      features/settings/    # route/session settings; no universal OS settings yet
      workers/              # explicit worker entrypoints when measured useful
      ui/                   # EFS tokens, shared elements, formatting, messages
    public/                 # only reviewed public static assets
  apps/rescue/               # minimal independent read/export/recovery entry
  packages/                 # initially empty or one justified shared UI package
  tools/dev/                # supervisor, manifests, status/doctor, QA launch
  tools/build/              # entry/import checks and release manifests
  tests/
    scenarios/              # guest, writes, two users, faults, upgrades
    browser/                # browser fixtures and product acceptance
    fixtures/               # versioned synthetic data and contract artifact locks
    static/                 # built-artifact hosting and offline/release checks
  docs/                     # architecture, contributing, ADRs, troubleshooting
  .github/workflows/
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  tsconfig.base.json
  integration.lock.json     # illustrative name; exact cross-repo fixture inputs
```

Create a directory when its first real module exists. Do not initialize empty app-runtime, catalog, synchronization, agent, media or window-manager packages. Rescue is initially the smallest independently testable read/inspect/export surface; it grows only as recoverable state actually exists. The native Drive repository remains separately owned.

### 2. Boundaries that matter more than directory names

Data flows from SDK results and operations through client controllers into custom-element views; imports point back toward those narrower contracts. The composition root injects narrow services into a route/session. Browser transports and local state implement those services. Shared UI imports neither wallet nor protocol internals. A small checked import policy enforces these directions; it is not a dependency-injection framework.

| Boundary | Concrete requirement and reason |
|---|---|
| SDK / client | IDs, codecs, verification, pagination, Files resolution, action planning and reconciliation belong in the SDK. The client owns routes, browser adapters, presentation and consent. Otherwise every app becomes a divergent protocol implementation. |
| Reader / account session | Opening a resource takes an explicit read context and cancellation scope. No ambient connected account or mutable global network changes its meaning. This supports guest use and multiple sessions. |
| Shell / feature | Files controllers express user intent and render qualified SDK outcomes. The initial trusted viewer owns navigation/focus and hosts conserved action review; a later replaceable Session Shell cannot own System Chrome authority. Features do not import one another's internals. |
| Trusted client / extensions | First-party modules may use trusted in-process interfaces. Third-party code crosses a measured runner and capability interface; ordinary dynamic import into the host would grant the host's authority. Web Components and Workers alone are not that boundary. |
| Package discovery / runtime | Preserve inert `PackageHandoff`, explicit preparation, grants, activation and instance leases. Do not implement the catalog or full module manager just to make the initial UI modular. |
| UI / persistence | Signals and element instances are live objects. Storage, worker messages, receipts and package interfaces use versioned plain data, exact byte values and validated handles. This prevents a rendering library from becoming the storage ABI. |
| Development / product | Devnet control, test wallets, funding, fault injection and process orchestration live outside shipped entries. A production build has no dev signer, admin RPC client, test-key import or debug bypass. |

The generic reader remains Record-capable, with Files as one consumer. A later Data Explorer gets its own feature/package entry over the same SDK; direct Files and named-App routes do not boot it as an intermediary. Keep the current reconciled split in [[../sdkv2/web-client-os-boundary-pressure]]; some older Shell paragraphs still describe Explorer as mandatory.

Public component surfaces are properties, events, slots, CSS parts and semantic tokens. Use typed command/action descriptors for human and agent paths; the DOM is not the only way to invoke a Files action. A small feature entry exposes its dependencies, mount/start and dispose behavior. Avoid a universal service locator, global event bus, custom renderer or generic plugin container in the first slice.

Trusted modules may call narrow interfaces directly: no mandatory RPC/MessagePort hop for a local Files read. Version and validate contracts where independently released code, persistent state or an execution boundary requires it; ordinary internal functions need not become a public OS ABI. When a feature becomes independently activated, extract its existing entry/lifecycle seam into a package and supply the appropriate runtime binding. Do not let its former first-party location silently entitle an installed replacement to host privileges.

Every route, session and later app instance owns its AbortControllers, subscriptions, effects, ports, object URLs and child work. Dispose fences late completions before releasing resources. Browser cancellation does not undo an already submitted transaction; receipt reconciliation remains possible after navigation. This is a useful shared lifecycle convention from day one, not an excuse to build the full capability runtime.

### 3. Tooling and compilation

| Choice | Recommendation and reason |
|---|---|
| Authoring | Strict TypeScript with erasable syntax, explicit type imports and runtime checks at untrusted boundaries. Avoid legacy decorators and TS runtime constructs. The emitted runtime is standards JavaScript. |
| State | One pinned TC39 Signals-compatible polyfill per trusted JS realm, deduplicated across UI dependencies. Use computed values for derivation and owned effects for side effects; do not introduce a second global state/query framework. Proposal/polyfill changes remain an explicit adapter update. |
| Components | Native HTML/DOM for boot and rescue; Web Components for reusable UI. Thin Lit is the recommended comparator for complex forms/lists where it measurably reduces lifecycle/rendering work. If selected, keep it private to component implementations. |
| Design language | EFS-owned semantic tokens, native CSS layout and individually imported, self-hosted Web Awesome controls where selected. Benchmark `wa-page` for richer Shell layout. Do not wrap every native control mechanically or load the complete component catalogue. |
| Build | Pinned Vite with relative base/assets and minimal plugins. Separate typechecking (`tsc --noEmit`) from bundling so a successful transform cannot masquerade as type safety. |
| Local tooling | Pinned supported Node and pnpm, frozen lockfile, Biome plus TypeScript; add type-aware lint rules only for a demonstrated gap. No Nx/Turbo, SSR framework, CSS-in-JS, runtime CDN or mandatory Docker. |
| Tests | Vitest for pure client logic, Playwright for real DOM/browser journeys. Browser tests consume the same packed SDK and deployed fixture used by the running client. Small native component examples double as component test pages; a separate component-explorer framework can wait. |
| Ethereum | Consume the SDK's transport/account adapters. Prefer one SDK-selected EVM stack; viem is a reasonable candidate, not a new parallel client dependency. Do not copy v1's mixture of direct viem, EAS, wallet framework and contract constants. |

Primary evidence: [TypeScript erasable syntax](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html), [Vite features](https://vite.dev/guide/features), [Vite static build](https://vite.dev/guide/build), [Lit Signals](https://lit.dev/docs/data/signals/). Signals remain selected product direction; the polyfill and `@lit-labs/signals` integration are evolving dependencies. Lit's guidance explicitly warns about duplicate polyfill instances. Confined SES/LavaMoat, Component Model/WIT adapters and WebMCP integration remain separately tested future adapters.

Maintain distinct TypeScript environments for browser, Worker, Service Worker and Node tools so accidental Node/DOM globals fail locally. Keep public interfaces environment-neutral. Use TypeScript project references only when extracted packages justify them. No Node polyfill bundle may quietly enter guest output.

Build entries and lazy imports follow use, not file-extension or vendor categories:

1. Native boot/profile check and route parsing.
2. Direct Files/read/viewer slice.
3. Explicit write/wallet slice.
4. Worker entries for measured heavy work.
5. Separate rescue and, once its fixture passes, Service Worker.
6. Later: exact-App host and each selected runner; full Session Shell; optional system services.

Test the output import graph, not just source conventions. A barrel export, automatic custom-element registration, shared vendor chunk or bundler preload must not drag wallet, whole icon/font packs, app runtimes or OS services into guest startup. Self-host icons/fonts/locale assets. Distinguish startup bytes, time to first qualified row, RPC requests, main-thread work and retained memory; set budgets from the first reference device rather than invented universal numbers. Large listings need bounded pages and memory; add virtualization with accessible navigation when measurement justifies it.

Module evaluation should define code without contacting a network, opening storage or connecting a wallet. Custom-element registration belongs in the selected UI entry. For development, prefer an honest full-page reload when a registered element class or authority context changes; do not make a fragile HMR patcher foundational. CSS and safe pure-module HMR can stay fast. Reload must preserve eligible drafts and existing devnet state, never an obsolete authority handle.

### 4. Development environments: ports, chains and ownership

**Recommended everyday contract:** after the one-time pinned tool/dependency setup, `pnpm dev` brings up a usable seeded local chain plus client. An editor Preview button invokes that exact command. A fresh client checkout uses published/pinned contract fixture artifacts and the SDK package; it does not require guessing sibling checkout paths or silently compiling a sibling's uncommitted contracts. Contract source development is an explicit alternate input.

These proposed command names are UX examples, not an implemented CLI:

| Command | Expected behavior |
|---|---|
| `pnpm setup` / `pnpm doctor` | Documented setup and diagnostic path for pinned Node/pnpm/Anvil, artifacts, ports, permissions and browser prerequisites. No API keys or public-chain fork are required for the default fixture. |
| `pnpm dev` | Start/resume this workspace's named local fixture and client, print the actual URL and read/write readiness. No automatic wallet prompt or main browser focus change. Editor integration may open its preview. |
| `pnpm dev -- --name alice-ui --attach team` | New UI instance over the explicitly named running chain, independently owned client origin/state. Never redeploy or reset the attached chain. |
| `pnpm dev:chain -- --name team` | Explicit independently supervised shared chain for multi-client/manual QA. It survives client/HMR restarts and stops through its own owner command. |
| `pnpm dev:status -- --json` / `pnpm dev:stop -- --name X` | Show concrete endpoints, source/artifact identities, processes and ownership; stop only the selected owned instance. |
| `pnpm test:e2e` | Disposable isolated fixture per scenario/worker unless the scenario explicitly tests shared-chain users. No reuse of a developer's running node. |
| `pnpm preview:static` / `pnpm preview:pwa` | Serve the built artifact at a distinct recorded origin; PWA mode runs generation/offline/update tests. No hidden Vite RPC proxy. |

Keep the supervisor a small Node tool. Contracts own deployment/seeding and state format; SDK owns manifest validation and adapters; client owns the contributor command, UI launch and QA sessions. Reuse one contracts-published dev fixture protocol/CLI rather than three custom chain managers. In early implementation a pinned local command may supply that seam; the client still invokes it via explicit paths/arguments and validates its output.

#### Distinguish five identities

| Identity | Why it cannot be inferred from another |
|---|---|
| Workspace/worktree ID | Owns build caches, logs and task state; a branch name or basename is not unique. Moving a checkout needs a recoverable local registration. |
| Devnet ID plus reset generation | Names a particular local chain lifecycle; two nodes can have identical chain IDs, genesis and deterministic addresses. Reset/reseed must change the generation. |
| EVM chain ID plus verified Realm/deployment | Used by wallets and SDK checks; a URL/port is only the endpoint. A local manifest is coordination evidence, not cryptographic chain authentication. |
| Client origin/instance | Scopes browser storage and service workers. `localhost`, `127.0.0.1` and different ports must not be switched casually. |
| Actor/browser profile | Separates Alice, Bob and guest wallet permissions and local state. Two tabs do not provide independent users. |

On the first uncontended local launch, prefer `127.0.0.1:8545` with Anvil's conventional `31337` chain ID and a client URL at `127.0.0.1:5173`. Keep assigned URLs stable across restarts. These are developer defaults, not product hosts or chain assumptions.

If occupied, identify a matching registered instance; never treat a listening port as permission to attach. A different workspace automatically gets another bounded port allocation and a distinct local chain ID, with the chosen settings displayed. The same logical shared devnet retains its chain ID across UI instances. Explicit `--port` conflicts fail clearly. Independent wallet-facing chains must not all reuse `31337`; an allocator only prevents known local collisions and makes no claim of globally unique development IDs.

Use a small OS-user runtime registry with atomic allocation locks and per-instance manifests, not a permanent machine-wide daemon. A lease records owner, workspace, boot token, process identity/start time, listener addresses and instance generation. Probe the actual IPv4/IPv6 binding footprint. The child bind is authoritative: handle a bind race by bounded reallocation and regenerate the entire configuration before declaring ready. Vite uses strict-port behavior under the supervisor, so it cannot silently disagree with the recorded URL.

The public development manifest contains schema version, workspace/devnet labels, chain ID as an exact value, reset generation, RPC URLs, Realm/deployment/profile and artifact hashes, verified checkpoint/code information, fixture seed version, client URL and supported capabilities. Keep PIDs, private control tokens, credentials and test key material in a separate private supervisor record. Write manifests atomically; pin each client operation to one complete generation. Browser-consumed configuration is always public and validated.

Readiness requires more than an open TCP socket: RPC chain identity, expected deployment code/profile, successful seed verification and an SDK guest read must match. Publish one machine-readable ready event only then. A startup frame may show progress earlier. A mismatch fails visibly; no fallback to Sepolia, default contract constants or another nearby node.

Manage process lifetime directly, without layers of shell/package-manager children when avoidable. On macOS/Linux use owned process groups; Windows needs an equivalent tested process-tree strategy. Bound shutdown, record cleanup failures and detect parent death. Never kill by port, broad process name or stale PID alone. UI restart/HMR cannot reset the chain. The default private supervisor stops its children on exit and retains resumable state; shared-chain mode has an independent explicit owner and attached clients cannot stop it. Crash recovery reports whether exact state was restored; it must never silently replace it with a fresh fixture.

Ports are not a security boundary between people sharing an OS account. Keep default listeners loopback-only with explicit Vite host/CORS policy and narrow filesystem access. Keep administrative devnet methods on a private control path; a browser-facing RPC allowlist permits normal reads and submissions without exposing reset, impersonation or arbitrary funding. Cross-OS-user sharing or phone/LAN access is a separate explicit profile with authenticated access, permitted origins, trusted HTTPS and reachable endpoints; a phone's `localhost` names the phone. It must not be enabled just by binding every service to `0.0.0.0`.

#### Wallet first run and reset behavior

Guest startup performs no provider discovery. The first Connect action selects a provider using EIP-6963 and an EIP-1193 adapter, displays the actual local network and offers add/switch through wallet-supported methods. Provide the exact manual network fields if the wallet rejects a localhost URL or cannot add the network. Do not assume MetaMask ships with a particular enabled localhost entry. Browser-wallet prompts and account access still require the user's interaction.

Fund the selected public address from the local fixture through an explicit development command/action, or use named synthetic test accounts in a dedicated QA browser. Never ask for a real seed phrase. Known dev keys stay in developer/test tooling and out of product bundles, public manifests, logs and released artifacts. A guest automatic test needs no wallet at all.

Keep long-lived manual QA chains persistent to reduce nonce/cache confusion. A reset is explicit and names the affected instance, invalidates pending plans and local result caches, advances the devnet generation, and warns attached users. Never automatically clear a person's extension history. Document targeted wallet nonce/activity recovery; a fresh isolated QA profile or new local chain ID may be appropriate after a destructive reset. The application still verifies deployment and basis because changing chain ID alone cannot repair stale app state.

A local reset-generation label only fences cooperating tools; it does not revoke an already signed transaction cryptographically. Where reset fixtures must reject old signatures, change the actual replay domain (for example chain/deployment identity under the supported contract profile) and test rejection. Never treat a JSON field as an onchain replay guard.

Primary evidence: [Vite server options](https://vite.dev/config/server-options), [Foundry Anvil](https://www.getfoundry.sh/anvil/index.html), [local Foundry setup](https://docs.openzeppelin.com/monitor/local-evm-testing), [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963), [MetaMask network handling](https://docs.metamask.io/metamask-connect/evm/guides/manage-networks/), [MetaMask nonce/activity recovery](https://support.metamask.io/configure/accounts/how-to-clear-your-account-activity-reset-account). Exact option names and supported wallet/browser versions are pinned at implementation.

### 5. Multi-user, multi-tab and collaboration tests

Treat these as different scenarios:

| Scenario | Fixture arrangement |
|---|---|
| Alice and Bob collaborate | One shared devnet; separate principals and browser contexts/profiles; each has independently chosen Lens/policy and local state. |
| One user in two tabs | Same origin/profile, same chain and intentional shared local state; test write coordination, reload, lock loss and duplicate-submission prevention. |
| One Principal on two devices | Separate state/browser profiles and controller keys; test historical attribution and revocation through supported SDK/account fixtures. |
| Independent developers | Separate worktrees, devnets, chain IDs, origins, manifests, caches and process ownership. |
| Two client versions | Two builds and independent UI origins/profiles against one compatible devnet; additionally test old/new tabs at a stable origin for release/worker skew. |
| Two Realms/chains | Explicit endpoint and basis per resource; an account/network change must not silently retarget a queued action. |

Use Playwright BrowserContexts for ordinary independent browser state; two pages in the same context are intentionally the same user. For actual extension wallets, use separate persistent Chromium profile directories and pinned extension fixtures. Playwright documents that extension automation requires persistent Chromium contexts, and its bundled Chromium is the supported sideloading path; an injected fake provider is a useful protocol fixture but not MetaMask UX evidence. See [browser isolation](https://playwright.dev/docs/browser-contexts) and [extension testing](https://playwright.dev/docs/chrome-extensions).

Share a chain only inside a scenario that owns all writers. Each parallel worker otherwise has its own devnet, fixture actors, seed and manifest. Allocate separate actors/nonces even where sharing is intentional; do not let two tests spend from the same default deployer. Avoid global snapshot/revert while other users are active. Put dependencies on ordering, block advancement and fake time in the scenario, never incidental sleeps.

Multi-tab local writes need an explicit ownership protocol once outbox/private state exists: transactional state, a single current writer where required, fencing after reload and recovery after lock loss. Web Locks/BroadcastChannel are useful browser adapters; message notification is not proof that another tab has stopped. Record the selected behavior in the storage profile rather than assuming every browser grants permanent background execution.

### 6. Static delivery, persistence and user-controlled upgrades

Keep three things separate: immutable application build identity; a runtime-selected chain/Realm/transport configuration; and private local user state. Never rebuild the JS bundle to change an RPC URL or bake credentialed endpoints into `VITE_*`. Public initial configuration can be a static validated file or explicit local selection; it is input, not a trusted deployment directory service. No live `/config`, `/rpc`, `/wallet` or `/session` backend is needed for product correctness.

A build outputs relative HTML/CSS/JS, workers, approved fonts/icons/locales, PWA manifest, license material and a deterministic file-integrity manifest. Define the manifest hash boundary explicitly so it does not require hashing itself or its enclosing IPFS CID recursively. App release identity and the hosting CID are separate. Source maps are retained as release/debug artifacts under an explicit publication policy. Runtime executable imports must be included in the declared closure; no missing lazy chunks, CDN fallback or arbitrary module URL assembled from remote metadata.

Use HMR development with Service Worker registration disabled by default. Run PWA/offline/upgrade acceptance against built releases on a separately allocated stable origin. Do not silently unregister unrelated workers or delete stores on developer startup. A dedicated reset tool targets one named test origin/profile. Stable manifest ID/scope/start URL and worker scope must be derived from the deployment prefix and tested; a release-specific filename must not accidentally turn each update into a different installed app.

Browser release acceptance and worker activation remain distinct. No blanket `skipWaiting`/`clients.claim` update plugin should decide product upgrade policy. Test v12 retained while v13 is advertised, interrupted download, old tabs with a new worker, explicit upgrade, rollback and incompatible state migrations. This repo implements [[system-profiles-and-generations]] incrementally; full shared-OS configuration is later.

Build recovery and storage-version seams before irreversible local data accumulates. Cache exact verified bytes separately from basis-qualified query results, drafts, outbox, private state and grants. Cache eviction must not delete the only draft or be reported as protocol absence. Migration requires a recoverable old state/export; rolling back code may not roll back a destructive data migration. Browser storage is evictable, and grants/private data do not follow automatically across origins or CID releases.

Header-dependent capabilities need explicit delivery profiles. The basic static-host build cannot assume COOP/COEP, arbitrary Permissions Policy or a dedicated runtime origin; richer runner and shared-memory profiles may require them. Test both restrictive/plain static hosting and the stronger HTTPS profile. Secure-context APIs work differently on LAN HTTP than on loopback. A checked output folder must work at an arbitrary path prefix, without Vite, and from retained local hosting.

### 7. CI, releases and everyday human/AI workflow

Start with a few outcome-based GitHub jobs, each runnable locally:

- **Check:** formatting/types, public import boundaries, one Signals implementation, no Node/dev/key leakage into browser output, locale message and generated-artifact drift.
- **Behavior:** focused pure logic plus browser component behavior; one deployed Files integration with canonical read-back and an independent guest reopen. Keep controlled-provider and real-wallet results visibly distinct.
- **Static:** production artifact under a non-root prefix, no useful application backend, corrupt/missing transport fixtures, browser-engine coverage, keyboard/focus and representative narrow/RTL layouts. Inspect actual startup imports and requests.
- **Release/periodic:** retained/current client compatibility, populated contract upgrade, real wallet/device smoke, offline/generation/storage migration, long-list memory and dependency closure/build reconstruction. Run heavier checks when the changed boundary or release requires them.

Use an exact integration lock with contracts artifact/deployment profile, SDK tarball/version/digest and fixture schema/seed. Normal client PRs consume published pinned artifacts. Coordinated three-repo changes exchange immutable candidate artifacts and pin them explicitly; local sibling paths never become the CI contract. A developer opt-in may consume a locally packed SDK candidate; record its source/dirty status and hash. Run at least one packed-package test to catch undeclared dependencies/export-map bugs that symlinks can hide. ABI generation and codec tests remain SDK ownership.

Pin Actions by commit and tool/dependency versions, require frozen installs, and allow dependency build scripts explicitly. Fork PR jobs have no publish/deploy credentials. Separate build/test from release publication with narrowly scoped credentials. Produce one static artifact and promote those exact bytes to the authorized host/IPFS channel; don't rebuild per destination or assume a PR merge permits an onchain transaction. Hash-addressed releases and user opt-in updates are separate from mutable deployment pointers.

Keep `AGENTS.md` short and harness-neutral: entry commands, ownership, current source map, guest/import rules, how to get instance status, how to stop owned resources, and where standards evidence lives. Editor/Claude/Codex launch configuration is a thin adapter to the same commands. Avoid maintaining separate instruction manuals for each model. A feature PR records relevant primary standards, selected support profile, dependency effects and observed checks in a short template; no giant checklist on every copy edit.

Use the existing [[technology-foundation#Modern Web guidance and evidence gate]] rather than a new parallel research process. Retain the selected broad guidance snapshot and its license evidence; consult applicable primary references. When Web Awesome is used, load both release-matched `webawesome` and `webawesome-design` skills from the pinned package. [The publisher](https://webawesome.com/docs/ai/agent-skills) labels the skills experimental and ships them with its package. They are contributor guidance, not runtime authority. Unsupported emerging features receive explicit profile behavior, rather than silently downgrading the whole architecture.

Each task gets its own worktree/run ID, bounded logs and exact evidence path. Tools expose human-readable status plus JSON readiness/status, stable exit codes, cancellation and timeouts. Never let an agent infer the URL from the first port it sees or automatically kill other listeners. Long-running watch/chain ownership is documented at handoff. Redact provider credentials, private content and signatures from general logs; browser-to-terminal logging and traces are explicit local diagnostics with bounded retention, never silent analytics.

### 8. Frequently missed foundations

| Concern | Initial commitment; later work |
|---|---|
| International use | Message IDs, locale negotiation, `Intl`, logical CSS, IME-safe inputs, bidi-safe identifiers, UTC/domain time separation and NFC-aware display/validation boundaries from the first Files form. Translation packs load independently. The public filename profile remains Core/Files-owned. |
| Accessibility | Semantic controls and keyboard/focus behavior through routing and dialogs; reduced motion, zoom/reflow, touch targets, live status and correct focus return. A component library does not complete accessibility acceptance. |
| Input and viewport | Container-based layouts, dynamic viewport/safe areas, virtual keyboard, coarse/fine pointer changes, installed-window mode and mobile back navigation. Test touch devices, not only a narrow desktop window. |
| Draft and task survival | Refresh, offline transition, rejected wallet prompt, route change and background-tab suspension have explicit states. Autosave is private until publication is authorized; an upload that succeeded before a transaction failed is recoverable. |
| Hostile data and load | Limit name/text/range/decode/preview work, reject active content in trusted origin, preserve raw inspection/download and paginate/stream with backpressure. No remote metadata automatically loads a module, font or URL. |
| Web3 diagnostics | Display chain, Realm, app/build and operation status in a development inspector; distinguish SDK basis, wallet network, RPC endpoint and contract version. Provider success does not imply canonical effect. |
| Testing clock and randomness | Explicit injectable time/random/network boundaries in tools and adapters; retain deterministic seeds and fixture IDs. Never let test clocks/signers reach product entries. |
| Extensions | Reserve versioned descriptors, execution lane, capability requests, verified closure and disposable instance scope. Exercise one small confined app later before freezing public plugin interfaces; defer a universal DI/service framework. |
| Exit and support | Export exact diagnostics/evidence and user-owned data with privacy review. Release/version/capability information must be inspectable without a wallet. Preserve independent rescue when settings or optional modules fail. |
| Resource costs | Bound workers, connections, hash/decode buffers, watchers, logs and disk retention. A dozen worktrees must not launch a dozen whole-history benchmarks or recursively watch each other's output. |

### 9. Lessons retained and contradictions to reconcile

The [v1 preview launcher](../../../contracts/scripts/claude-preview-launch.mjs) records IPv4/IPv6 bind errors, orphan process trees and parent-death cleanup. Preserve those requirements; replace free-port scanning without durable identity/ownership with the small supervisor contract above. The [v1 devnet launcher](../../../devnet/scripts/start-anvil.sh) already distinguishes its chain ID from local development and warns that loading state under a different identity can corrupt assumptions. Its public-network fork and legacy schema dependence do not belong in the new default fixture.

The current [prototype closeout](../../Reviews/2026-09-24-prototype-delivery/README.md) supports a static direct-RPC client, atomic saves and qualified results, while exposing cold-read RPC cost and memory pressure. Carry the cases and limits into tests; do not copy the lab reader, proxy, generated IDs or benchmark settings. Preserve the later prototype's separation of chain lifecycle from Vite restarts.

The existing [v1 client](../../../client/CLAUDE.md) couples wallet/provider and routing through a Kernel singleton and synchronizes ABIs from a sibling checkout. Its `package.json` also carries React-oriented wallet/query dependencies despite the Lit UI. None of this establishes v2 necessity. Replace it with SDK release inputs, explicit service construction and guest-safe imports. Old README claims about lint/test availability also lag actual files: inspect commands, not prose alone.

Specific reconciliation for Claude's plan: September repository naming precedes older rename-now text; the September Web/SDK boundary keeps Data Explorer optional, despite earlier Shell wording; operation-specific SDK result families supersede a mandatory universal wrapper; and public Unicode/NFC requirements are not fulfilled by the lab's ASCII Name profile. No scaffold should accidentally settle these by copying old constants.

### 10. First proof of the repository design

Implement this only after the initialization plan is reviewed and authorized:

1. From a client-only checkout with documented prerequisites, launch a pinned seeded fixture and guest SPA through one command. A second worktree starts concurrently; both report correct stable URLs and distinct devnet identities.
2. Serve the production output under a path prefix without Vite. Cold guest opens a nested folder and verified small file through the SDK with no wallet activity or OS startup imports.
3. Two isolated browser users attach to one shared devnet. Alice explicitly connects a supported wallet, creates a folder/file and publishes a revision; Bob independently reads the canonical result through his selected policy. A conflicting stale plan fails visibly.
4. Restart the UI and supervisor, preserving supported devnet state. Interrupt submission and reconcile without duplication. Restart/reset another instance; no other client, wallet fixture or chain is changed. Inject a stale manifest and refuse it.
5. Close the owner tool and verify owned process trees stop; a separately owned shared chain remains. Concurrent bind attempts never produce two false ready manifests.
6. Check guest output excludes dev keys/admin tools and optional OS/wallet dependencies; create one small feature via the documented component/controller pattern and demonstrate disposal on navigation.

Those controls validate the repo structure and development ergonomics. PWA generations, storage migrations and an untrusted app each get their own next vertical as they become implementation scope; the directories and interfaces must accommodate them without implementing them prematurely.

## Open questions

- [ ] Claude and Contracts/SDK PMs confirm ownership and minimal artifact/manifest/CLI contract for the shared dev fixture. Decide distribution and supported development platforms before writing three launchers.
- [ ] Confirm the initial real-wallet matrix and measure one clean MetaMask setup on the selected local-network profile; command startup can be one click, wallet approvals cannot be promised away.
- [ ] Compare native DOM/Signals with thin Lit for the same realistic Files row/form; decide its critical-chunk placement and Web Awesome Page usage from measured behavior. Do not reopen the selected standards/state direction.
- [ ] Pin exact tools, Signals integration, feature-profile targets and guidance snapshots at initialization; dated recommendations are not version locks.
- [ ] Resolve the public Name profile through the Files/Core lane before a public release; the client must neither silently slug Unicode input nor claim validation it does not perform.
- [ ] Choose the first persistent-state/outbox and installed-PWA vertical before those stores or update paths ship; retain existing generation/privacy requirements and avoid freezing their implementation in the first scaffold.

These are engineering/review inputs, not a new immediate owner questionnaire or authorization to implement.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

Planning baseline inspected: `a5b0137` on 2026-09-26, fetched and equal to `origin/main` before drafting. Existing v1 and prototype sources were read as evidence only. Primary upstream pages were checked on that date; no dependencies were installed, repository scaffolded, browser/wallet changed or devnet started for this proposal.
