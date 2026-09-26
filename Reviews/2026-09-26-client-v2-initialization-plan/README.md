# client-v2 — initialization and architecture plan

**Status:** **accepted by the Web Client/OS PM (2026-09-26) as the repository-foundation plan, revision 2.** That acceptance does not authorize implementing C0–C4, and does not confirm that the full Web Client/OS requirements are covered. Implementation proceeds one PM-scoped slice at a time, and needs James's G0 authorization first ([[Reviews/2026-09-26-client-v2-initialization-plan/c0-slice|C0 slice]]). Cross-repo asks are in [[Reviews/2026-09-26-client-v2-initialization-plan/handoff-contracts-sdk|the Contracts/SDK handoff]]. No repository content, dependency installation, build, chain or wallet action has been performed.
**Author:** web-client-dev (Claude Opus 5.5, Claude Code) for James, to forward to the Codex Web Client/OS PM
**Date:** 2026-09-26
**Inputs:**
- Planning `5a881a2` on `main`, fetched and equal to `origin/main`. The PM brief cites `909f7da`; the two later commits add the SDK and contracts repository designs.
- [[client-repository-and-development]] (PM proposal), [[technology-foundation]], [[web-platform-standards-and-forward-profile]], [[architecture-and-modules]], [[app-runtime-and-direct-launch]], [[system-profiles-and-generations]], [[mvp0-acceptance]], [[Designs/web-client-os/README|web-client-os README]].
- [[repository-and-distribution-plan]] (SDK), [[contracts-repository-and-development]], and the uncommitted sibling plans [[../2026-09-26-contracts-v2-initialization-plan/README|contracts-v2 initialization plan]] and [[../2026-09-26-sdk-v2-initialization-plan/README|sdk-v2 initialization plan]], re-read for revision 1.
- [[../2026-09-24-prototype-delivery/README|September 24–25 prototype closeout]], the lab-b browser at `4fbea63`, [[prototype-delivery-checklist]] and [[prototype-implementation-plan]].
- The v1 launchers `contracts/scripts/claude-preview-launch.mjs` and `devnet/scripts/start-anvil.sh`.
- Registry versions and primary tool documentation, checked 2026-09-26.
- GitHub state of `efs-project/client-v2`, checked 2026-09-26.

#kind/design #repo/client #repo/planning #repo/sdk #repo/contracts #topic/cypherpunk-os #topic/web-platform #topic/developer-experience

---

## Executive summary

**Start `client-v2` as a small pnpm workspace with two members.**
- `apps/web` is the static SPA.
- `tools` is the Node-only dev supervisor, build checks and static server.

There are **no `packages/` and no `apps/rescue` yet**. Each is created only when its first real consumer exists. The guest path is plain Web Components over the SDK reader. Lit and Web Awesome load only in lazy chunks that need them. Typecheck (TypeScript 7), lint/format (Biome), bundle (Vite 8/Rolldown), unit tests (Vitest) and browser tests (Playwright) are separate, fast, pinned steps.

A proof counts only when it is checked against the **built output**: its import graph, its bytes and its behaviour under a path prefix. Source conventions alone are not enough.

**One command.** After a one-time `pnpm install && pnpm setup`, `pnpm dev` does everything below. An agent or an editor button runs the same command.
- Starts or resumes this worktree's private seeded chain, through the **contracts-owned fixture package**.
- Puts a small **dev RPC gateway** in front of the chain. It enforces an exact JSON-RPC method allowlist that excludes signing, unlocked-account and admin methods, and it handles CORS, RPC metering and fault injection.
- Hosts Vite in-process.
- Prints JSON readiness events at two levels:
  - `infra-ready` once the chain, deployment and gateway are verified;
  - `files-ready` once a real SDK guest read of the seeded Files tree also passes. That second level requires artifacts the sibling repos haven't scheduled yet (§9.2).

Instances, ports, chain IDs and process ownership live in one small per-OS-user registry. The fixture package publishes that registry so contracts, SDK and client share it instead of building three launchers.

**Decisions this plan makes.** All are reversible engineering choices unless marked.

1. **Layout:** two workspace members and ordinary source directories organized by responsibility. Future OS slots are reserved in the **composition and import rules**, not in empty directories (§1).
2. **Authority:** there is no Kernel object. `ReaderSession` holds a pinned read context and has no wallet. `WriterSession` is created only by explicit promotion and carries its own account, chain, deployment and epoch. Structured `ActionDescriptor`s run through one conserved review path for both humans and agents (§2).
3. **Lit placement rule:** guest-critical views use native custom elements with Signals. Lit is used only in lazy chunks that already load Web Awesome. Web Awesome depends on Lit, so its marginal cost there is near zero. No decorators (§4.3).
4. **Toolchain:** Node 24 LTS, pnpm 12, TypeScript 7 (native `tsc`) for typechecking only, Vite 8, Biome 2, Vitest 5 and Playwright 1.63. Every version is exact. The Node tools are written in erasable TypeScript and run directly on Node 24 with no build step (§4).
5. **Dev environment:** the client supervisor composes chain (fixture package), gateway and UI.
   - The gateway takes the familiar `127.0.0.1:8545`. Anvil sits behind it on an unadvertised loopback port, runs with no unlocked accounts, and is explicitly qualified as **not** private from same-user local processes.
   - Assignments are sticky per worktree. Only a new, never-published assignment may be reallocated automatically.
   - Anvil ships through the fixture package's `@foundry-rs/anvil` dependency, so a client-only checkout needs no `foundryup`.
   - A reset is a fresh deployment with a new chain ID by default and a fresh `realmId` from existing initializer inputs. A resume happens automatically only from a clean checkpoint. Otherwise rollback is reported as uncertain and needs an explicit choice. Old raw transactions are proven refused after a reset (§5.5, §5.8).
6. **The lockfile is the integration lock.** The client pins exactly two sibling artifacts: the SDK package and the fixture package, which carries its contracts release bundle. `doctor` checks that the SDK's protocol-input digest equals the fixture's release digest. There is no separate `integration.lock.json` unless contracts keeps the bundle outside the fixture package (§7.1).
7. **First persistent store:** the pending-submission journal, because reconciliation after a reload needs it. The client **consumes the SDK's `indexedDbJournal`** (durable writes, a Web Lock per attempt) and its port conformance tests rather than writing its own. Cross-tab coordination of prompts, attempts and journal updates is C3 scope, not deferred (§6.4).
8. **Release evidence:** one content-addressed `release.json` per build. CI builds once, tests those bytes, and publishes those bytes. Evidence is graded E0–E4 so a dev build doesn't pay for an audit (§7.4).

**Where I push back on the PM proposal.** Each point is argued in its section.
- Defer `apps/rescue` and the empty `packages/` (§1.3).
- Replace `integration.lock.json` with the lockfile plus a compatibility check (§7.1).
- Add a dev RPC gateway. The proposal wants a private admin path but gives it no home. It also resolves CORS for multiple origins and makes lost-response testing possible (§5.4).
- Skip the three-way control-pack bakeoff in [[technology-foundation]] unless Web Awesome fails a fixture (§4.3).
- Keep `verify:web-evidence` as a review gate with a light CI parse check, not a per-path receipt gate (§8.3).
- Declare Windows unsupported for `pnpm dev` until a process-tree test exists (§5.7).
- Ask contracts to ship the fixture CLI with its **S1** bundle, not S3. Files readiness still waits on the Files profile and seed, and the three plans' milestones are reconciled by artifact in §9.2.

**What I need from James and the PMs** is in §11: six short items, each with a recommendation.

---

## 0. Established, recommended, unresolved

| Category | Items |
|---|---|
| **Established** (not reopened) | Static, IPFS-hostable SPA with no required backend (2026-08-12 ruling). Guest reads without wallet discovery, Commons, indexer or OS boot. Wallet-backed Files writes in the official client. TC39 Signals and Web Components (owner direction #14, #18). Correctness before download size (2026-09-09 ruling). Owner prompt budgets (2026-09-03). Kernel → Shell → Apps with conserved System Chrome. Human/agent parity. SDK owns protocol semantics. Temporary `client-v2` naming (2026-09-21). MIT for EFS original software, per the PM brief; the repo already carries an MIT `LICENSE`, but no vault ruling records it for the client (see §11). |
| **Recommended here** | Layout, dependency rules, toolchain pins, build/entry structure, dev supervisor and registry, gateway, test/QA arrangement, CI jobs, release manifest and evidence grades, contributor instructions, staging. |
| **Unresolved, routed not decided** | Public Unicode name profile (M3; the client renders the SDK's verdict and never slugs input). Relayed-EOA writes, which need a relayer that the static profile doesn't include (§6.1). Real-wallet matrix. The Service Worker/PWA generation vertical. The third-party runner. |

---

## 1. Repository and runtime architecture

### 1.1 Layout at the end of the first proof

Directories appear when their first real module lands. The annotations say which stage creates each one (§9).

```text
client-v2/
  AGENTS.md                    C0  ≤120 lines, harness-neutral (§8.1)
  CLAUDE.md                    C0  one line: @AGENTS.md
  README.md  SECURITY.md       C0
  LICENSE                      exists (MIT, "The Ethereum File System (EFS)")
  package.json                 C0  private root: scripts, devEngines, packageManager
  pnpm-workspace.yaml          C0  members + pnpm policy (allowBuilds, minimumReleaseAge)
  pnpm-lock.yaml               C0
  biome.json                   C0  format + lint + per-path import restrictions
  tsconfig.base.json           C0  shared strict options
  .node-version                C0
  apps/web/                    C0  @efs-client/web (private)
    index.html                 C0  single HTML entry; inline unsupported-browser fallback
    vite.config.ts             C0  product build only; no dev-environment code
    tsconfig.json              C0  browser env (DOM libs, types: [])
    public/                    C0  manifest.webmanifest, reviewed icons; NO efs.config.json
    src/
      boot/                    C0  main.ts (entry), route.ts, profile.ts, config.ts
      state/                   C0  signals.ts (sole polyfill importer), effect.ts
      platform/                C0  scope.ts (lifecycle), locale.ts; C3 wallet/, storage/
      composition/             C2  reader-session.ts; C3 writer-session.ts, slots.ts
      shell/                   C2  viewer-frame.ts, navigation.ts, focus.ts; C3 action-review/
      features/files/          C2  entry.ts, routes.ts, controllers/, views/; C3 actions.ts, write/
      ui/                      C0  tokens.css, base.css, icons/, messages/, format.ts; C3 wa/
  tools/                       C0  @efs-client/tools (private, Node env)
    tsconfig.json              C0  Node types, no DOM
    build/                     C0  provenance plugin, check-graph.ts, scan-leaks.ts, licenses.ts,
                                   release-manifest.ts, check-messages.ts (MF2 subset check via messageformat)
    serve/                     C0  static-serve.ts (prefix mounting, header profiles)
    dev/                       C1  efs-dev.ts (CLI), supervisor.ts, gateway.ts, vite-host.ts,
                                   readiness.ts, qa-browser.ts
  tests/
    e2e/                       C2  playwright.config.ts, guest, static-prefix; C3 write, two-users,
                                   recovery; C4 concurrency
    support/                   C2  fixture.ts (per-worker instance); C3 controlled-wallet.ts, actors.ts
  docs/                        C0  architecture.md, dev-environment.md, releases.md,
                                   web-platform/feature-policy.md, web-platform/guidance.lock.json,
                                   adr/0001-initial-foundation.md
  .github/                     C0  workflows/ci.yml, pull_request_template.md, dependabot.yml;
                               C4  workflows/release.yml
```

Unit tests sit beside their source as `*.test.ts`. Supervisor tests live in `tools/dev/*.test.ts`.

**Environment separation is enforced by three layered mechanisms, not by workspace membership alone.** Membership only keeps `tools` out of `apps/web`'s declared dependencies. Two paths would still reach it:
- Node's parent-directory lookup can still find root-level `node_modules` packages from `apps/web`.
- A relative path like `../../tools/…` resolves no matter what the package declares.

So:
1. **Declared dependencies stay small.** The root `package.json` holds only toolchain devDependencies (TypeScript, Biome, Vitest, Playwright), never runtime or fixture code. `tools` alone depends on the fixture package and on the SDK's Node surfaces.
2. **Source rules.** Biome `noRestrictedImports` on `apps/web/src/**` bans:
   - `node:*` and Node builtins;
   - `@efs-client/tools`;
   - the fixture package and test runners;
   - `@efs/sdk/node` and `@efs/sdk/testing`;
   - relative specifiers that leave `apps/web/src`.

   `apps/web/tsconfig.json` has `types: []` and no Node lib, so Node globals fail to typecheck.
3. **Output provenance.** The build-output check (§4.4) inspects every module that contributed code to the shipped chunks. This is the gate that actually decides what shipped, whatever a source rule missed.

`tools` may depend on the SDK, which it uses for readiness reads and seeding in Node, and on the fixture package.

### 1.2 Composition roots and entrypoints

| Entry | Built as | Statically imports | Never reachable from it |
|---|---|---|---|
| `index.html` → `boot/main.ts` (guest) | the only HTML entry | `boot/*`, `state/*`, `platform/scope`, `composition/reader-session`, `shell/viewer-frame`, `@efs/sdk` (root: `createEfs`, `httpRpc`, `verifyDeployment`) and `@efs/sdk/files`, native `features/files/views` + their `define.ts` | wallet discovery, `@efs/sdk/actions`, the journal half of `@efs/sdk/web`, Lit, Web Awesome, `shell/action-review`, storage, anything in `tools/` |
| `features/files/write/entry.ts` (lazy) | dynamic import after an explicit write intent | `composition/writer-session`, `platform/wallet`, `shell/action-review`, Lit, `ui/wa`, `@efs/sdk/actions`, `indexedDbJournal` from `@efs/sdk/web` | the Session Shell and later OS services |
| Worker entries (when measured useful) | `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })` | explicit, bounded | the DOM and the main-thread state realm |
| `tools/dev/efs-dev.ts` | run directly by Node 24 | fixture package, SDK (Node), Vite API | anything the browser loads |

The dev-only config plugin is **injected by the supervisor** when it starts Vite programmatically. That keeps `vite.config.ts` product-only. Plain `vite` without the supervisor shows an honest "no EFS configuration" state instead of silently choosing a network.

### 1.3 Deviations from the proposed layout, and why

- **No `apps/rescue` in C0–C4.** Rescue exists to recover local state and escape a broken update path. Until the Service Worker and private stores land there is nothing to rescue. [[architecture-and-modules]] also wants rescue on a separate origin, which the first static profile can't exercise. A second build with no acceptance test would just rot.
  - Unsupported browsers are covered instead by an inline classic-script probe in `index.html` that reveals a static message, which is the Rescue *profile* behaviour.
  - `apps/rescue` arrives with the storage/Service Worker vertical (stage R, §9). The build tools accept multiple apps from C0, so adding it costs nothing structural.
- **No `packages/`.** Nothing has a second consumer yet. The design-token CSS and shared elements live in `apps/web/src/ui/`. Extraction happens only when there is a distinct consumer, execution environment or release boundary, as the PM proposal itself says.
- **No `features/settings/`.** The first proof has no settings. The wallet and network display belong to the write slice.
- **`tests/` has fewer subdirectories.** It is `e2e/` plus `support/`, with fixtures owned upstream (§7.1). Separate `scenarios/`, `browser/` and `static/` directories would split one Playwright suite three ways without a boundary to justify it.

### 1.4 Dependency rules

Imports point from wider modules toward narrower ones:

```text
boot → composition → shell → features/* → ui → state → platform
```

`features/*` never import each other. Biome's `noRestrictedImports` enforces this with per-path `overrides`, plus `noImportCycles`. The build-output graph check in §4.4 is the backstop, because it checks what actually ships.

| Rule | Enforced by |
|---|---|
| Only `state/signals.ts` imports `signal-polyfill`. Only Lit elements import `@lit-labs/signals`. | Biome restricted imports; a lockfile check that exactly one `signal-polyfill` version exists; a graph check that its code sits in exactly one main-thread chunk |
| Only `ui/wa/**` imports `@awesome.me/webawesome`. `wa-*` tags appear only in lazy write/settings views. | Biome; graph check (no Web Awesome in the guest startup set) |
| Only `features/files/write/**` and `composition/writer-session.ts` import `@efs/sdk/actions` and the journal. | Biome; provenance check |
| No `import()` with a non-literal specifier anywhere in `src/` (no remote or assembled module URLs). | `tools/build/check-graph.ts` source scan, plus Rolldown's own dynamic-import records in the provenance output |
| **Module evaluation does no I/O.** Apart from the two entries and the registration modules below, importing any `src/` module must not call `fetch`, `indexedDB`, `navigator.serviceWorker`, `navigator.locks`, `customElements.define`, `window.ethereum` or `localStorage`. The two entries are `boot/main.ts` and `features/files/write/entry.ts`. | Vitest "module purity" test: imports every non-exempt module with those globals trapped, and fails on any call |
| **Element registration is explicit and narrow.** Only files named `define.ts` may call `customElements.define`, and they may do nothing else at evaluation time. Each `define.ts` may be imported only by an entry module. `ui/wa/define.ts` is the one place that loads Web Awesome. It (1) registers the self-hosted icon library, then (2) imports only the component modules listed in `ui/wa/components.ts`; those modules self-register `wa-*` tags on import. | Purity test: in `define.ts` it permits only `customElements.define` of `efs-*` names; in `ui/wa/define.ts` it additionally permits the icon-library registration and exactly the `wa-*` tag names in `ui/wa/components.ts`, and fails on any other tag or side effect. Biome restricted-import overrides: `**/define.ts` is importable only from the entry files, and `ui/wa/define.ts` only from `features/files/write/entry.ts`. |
| Persisted records, worker messages and receipts are plain versioned data. No Signals, element instances, Lit or Web Awesome types in `platform/storage/**` or in `features/*/model`. | Biome restricted imports on those paths; review |

### 1.5 How later OS services, replaceable modules and confined apps fit

None of these enter guest startup. Each has a named seam from day one, and no implementation until its stage.

- **OS services** (storage, sync, agents, search, package install) become lazily loaded factories. `composition/slots.ts` maps service-slot IDs to loaders, not instances:

  ```ts
  { 'efs.wallet.connector': () => import('../platform/wallet/eip6963.ts') }
  ```

  A factory receives explicit handles from its caller's session. It never gets a global. The graph check proves that no loader target is in the guest startup set.
- **Replaceable first-party modules** are `FeatureEntry` objects (§2.4). Swapping one is a composition change. That is enough until an independently released module needs a versioned interface. At that point the existing entry/lifecycle seam is extracted into a package with a runtime binding, and installation never inherits first-party host privileges.
- **The Session Shell** is a later separate lazy entry, `shell/session/`, loaded only on an explicit OS route. The Minimal Viewer (`shell/viewer-frame.ts`) never imports it.
- **Confined third-party apps** run in a later `host/` slice with runner entries, starting with the SES Worker lane from [[app-runtime-and-direct-launch]]. Third-party code **never** comes in through `import()` into the host realm; the non-literal-import ban above makes that structural. The opaque iframe lane needs a separate origin, which is a delivery-profile decision and not a directory.
- **The conserved action review** (`shell/action-review/`) is the only place that shows plan content and asks for consent. It is the initial System Chrome authority surface. A later replaceable Session Shell can't host it.

---

## 2. Authority, sessions and lifecycle

There is **no Kernel object**. The v1 `export const Kernel = new KernelClass()` coupled wallet, provider, routing and constants through an import side effect. The responsibilities are split up instead: Boot Core is `boot/`, the Reader Kernel is the SDK reader plus `ReaderSession`, and the capability router is `composition/slots.ts` (later).

The shapes below are sketches. SDK type names are placeholders until the SDK's C0 exports exist. They show where authority lives, not a frozen API.

### 2.1 Guest boot

```ts
// apps/web/src/boot/main.ts — the only guest entry
const profile = probeWebProfile();                         // pure feature checks
if (!profile.guestReader) showUnsupported(profile);
else {
  const route = parseRoute(new URL(location.href));        // strips fragment secrets first
  const config = await loadPublicConfig(new URL('efs.config.json', document.baseURI));
  const session = createReaderSession({ config, route });  // pins chain + deployment; no wallet
  mountViewer(document.getElementById('app')!, session);
}
```

`efs.config.json` is public, validated configuration: RPC endpoints, the expected chain ID and deployment identity, and the profile. It sits beside `index.html` and is **not part of the release identity** (§7.4). An operator changes the RPC without rebuilding.

The reader verifies the configuration against the chain before it trusts it, using the SDK's `verifyDeployment`: chain ID, deployment code hashes and proxy slots through the contracts `describe()` view, and the Realm identity. A mismatch is a visible error. There is no fallback to another network.

The prototype's lesson applies directly: "chain ID alone does not distinguish two Anvil instances". So every cache and journal key includes `(chainId, realmId, deploymentId)`. The genesis hash is recorded as a **diagnostic, not an identity**, because an Anvil started with identical genesis parameters can reproduce it. What distinguishes a reset instance is the **new chain ID and fresh `realmId` of a fresh deployment (§5.8)**.

### 2.2 Sessions

```ts
interface ReaderSession {
  readonly context: ReadContext;   // SDK: chain, deployment, basis policy; immutable
  readonly files: FilesReader;     // SDK facade bound to this context
  readonly scope: OwnerScope;
  promote(intent: WriteIntent): Promise<WriterSession>;   // lazy-imports the write slice
}

interface WriterSession {
  readonly account: Address; readonly chainId: bigint; readonly deploymentId: Hex;
  readonly epoch: number;          // bumps on accountsChanged/chainChanged/disconnect
  readonly scope: OwnerScope;      // child of the ReaderSession scope
}
```

- **Promotion** creates a new authority context. It does not retroactively authorize the guest session.
- **The wallet's network is checked against the reader's context** by block hash plus code hash, the way the prototype's `verifyWalletEnvironment` did. A wallet on the wrong network is offered `wallet_switchEthereumChain` / `wallet_addEthereumChain`, and exact manual fields are shown if the wallet refuses.
- **An epoch change invalidates plans** built under the old epoch. Authorize/submit then refuse with a typed `STALE_AUTHORITY`. A queued action is never silently retargeted.
- **No module-level mutable account, network or provider exists.** The purity test and review enforce that.

### 2.3 Structured actions (human and agent parity)

```ts
interface ActionDescriptor<P> {
  id: `files.${string}`;           // stable, agent-addressable
  title: MessageId;
  params: ParamSchema<P>;          // plain data validator, no UI types
  availability(ctx: ActionContext): Availability;              // pure
  plan(ctx: ActionContext, params: P, signal: AbortSignal): Promise<PlannedWrite>; // SDK plan
}
```

C3 ships `files.createFolder`, `files.createFile` and `files.publishRevision`. A button and a future agent adapter both call `runAction(descriptor, params)`. That goes plan → `shell/action-review` (conserved) → authorize → submit → reconcile. Views never import SDK write APIs (§1.4).

Parity test: the same params through the UI path and through a direct descriptor call give the same plan digest. WebMCP and other agent transports are later adapters over the same descriptors.

### 2.4 Lifecycle convention

```ts
interface OwnerScope { readonly signal: AbortSignal; child(): OwnerScope; defer(fn: () => void): void; dispose(): void; }
interface FeatureEntry { id: string; mount(host: HTMLElement, session: ReaderSession, scope: OwnerScope): void | Promise<void>; }
```

Every route, session and later app instance owns one scope. The scope owns its effects, subscriptions, object URLs, workers and ports, and it fences late completions before releasing anything. Navigation disposes the route scope.

A submitted transaction is not undone by disposal. Its journal entry survives, and reconciliation can run later (§6.4). `using`/`DisposableStack` can replace `defer` once the browser profile supports them; for now it is plain methods.

---

## 3. SDK boundary as the client consumes it

The client owns routes, browser adapters (wallet discovery, locale, lifecycle), presentation, consent and cross-tab **UX**. The SDK owns IDs, codecs, verification, Files resolution, pagination and continuations, action planning, authorization verification, submission adapters, reconciliation, and the reference browser journal with its durability and per-attempt locking.

The client **never** decodes records, computes IDs, walks pages itself, or decides success from a wallet or provider acknowledgement.

This section is aligned with the [[../2026-09-26-sdk-v2-initialization-plan/README|sdk-v2 initialization plan]] in revision 1. That plan uses one `@efs/sdk` package with subpaths and takes EIP-1193 as the chain boundary, with no separate EVM adapter package. What the client needs from the SDK's first verticals, the cross-repo items in §10:

1. **Guest-safe subpaths:** `.` (`createEfs`, `httpRpc`, `verifyDeployment`) and `./files` for guest reads; `./actions` for plan/authorize/submit/reconcile. Each has `sideEffects: false` and no top-level work. `./web` currently mixes guest-useful stream helpers with the IndexedDB journal. The provenance check will show whether tree-shaking keeps the journal out of the guest startup set. If it doesn't, the ask is a separate `./web/journal` subpath.
2. **Operation-specific result families** that carry basis, coverage and unknowns: exact read, scoped page with bound continuation, verified bytes, planned/prepared/submitted write, canonical read-back. The client renders `PARTIAL` / `UNKNOWN` / `ABSENT_PROVEN` / `CONFLICT` distinctly. A provider failure never looks like an empty folder.
3. **The journal:** the SDK's `indexedDbJournal` with its port conformance suite, which the client consumes (§6.4). The client adds only a namespacing wrapper if needed, and any substitute must pass the same conformance suite.
4. **`verifyDeployment(manifest, rpc)`** from the SDK root, usable in both Node (`tools`) and the browser (`efs.config.json`), and **`guestProbe`** from `@efs/sdk/testing`, used by `tools` only for `files-ready`.
5. **`protocol-inputs.json` in the package**, naming the contracts release digest it was built against.
6. **A names-profile check** that returns *unsupported by this profile* separately from *invalid*.

Until the SDK's Files vertical exists, client UI work renders the SDK's published result *types* on static component pages. It uses the real, schema-valid result JSON that the SDK plan commits to writing to `conformance/results/` from its S1. It never uses a client-side fake reader. The PM proposal's "no divergent protocol implementation" rule applies to test doubles as well.

---

## 4. Tooling and compilation

### 4.1 Pins

Versions below were checked in the npm registry on 2026-09-26. Every one is exact in the lockfile. They are re-verified when C0 creates the lock; this document does not pin them.

| Tool | Version | Why this one, and the expensive-to-change consequence |
|---|---|---|
| Node | 24 LTS (exact patch at C0) | Active LTS. Node 26 becomes LTS in late October 2026; move then, as a single PR. Node 24 runs erasable TypeScript directly, so `tools/` needs no build step or `tsx`. |
| pnpm | 12.6.x via `packageManager` + `devEngines.packageManager` | pnpm 12 defers to the project pin. The pnpm 11 defaults are the supply-chain floor we want: `strictDepBuilds`, `blockExoticSubdeps`, `minimumReleaseAge` = 1 day. `allowBuilds` replaces `onlyBuiltDependencies`. Settings live in `pnpm-workspace.yaml`, not `.npmrc`. **The contracts plan says pnpm 10.** All three repos should use one major (§10). |
| TypeScript | 7.0.x (`tsc --noEmit` only) | The native compiler: faster typechecks on every agent loop. TS 7.0 has no stable programmatic API. Nothing in this stack needs one: Vite/Oxc strips types, Biome parses on its own, and Playwright transforms tests itself. Fallback if a needed tool requires the TS API: `@typescript/typescript6`. This rules out TS-API tools such as TypeDoc and ts-lit-plugin for now, which we don't need. |
| Vite | 8.3.x (Rolldown + Oxc) | Current. One plugin at C0: our own build-only provenance recorder (§4.4). No third-party plugins. |
| Biome | 2.5.x | Format and lint in one binary; per-path import restrictions and cycle detection. No ESLint unless a type-aware gap is demonstrated. |
| Vitest | 5.0.x | Pure logic, tools and the purity test, in the Node environment. No jsdom. DOM behaviour is tested in real browsers. |
| Playwright | 1.63.x | Real Chromium, Firefox and WebKit. Persistent contexts for extension wallets later. Browsers are installed by an explicit `pnpm setup` step, never a postinstall. |
| `signal-polyfill` | 0.2.2 | **Experimental.** The TC39 proposal is still Stage 1, and the polyfill's last release was January 2025. It is isolated behind `state/signals.ts` (≈60 lines: `State`, `Computed`, owned `effect`). A proposal revision changes one file. |
| `@lit-labs/signals` | 0.3.0 | **Experimental** bridge. Its peer dependency on `signal-polyfill ^0.2.2` dedupes to the same instance. |
| `lit` | 3.3.3 | Lazy chunks only (§4.3). |
| `@awesome.me/webawesome` | 3.14.0 (MIT Core only) | Lazy write/settings controls. Its own dependencies (`@lit/react`, `@lit-labs/ssr`, `marked`, …) install but must not be bundled; the graph check enforces that. |
| Anvil | via the fixture package's `@foundry-rs/anvil` pin (npm 1.7.1 today; GitHub release 1.8.3) | Avoids `foundryup` for client-only checkouts. Its **`postinstall` must be reviewed before it is added to `allowBuilds`**: if it downloads, that breaks offline frozen installs, and a pinned `foundryup` line becomes the fallback. |
| `@axe-core/playwright` | current at C0 | Accessibility smoke only, never acceptance. |
| `messageformat` | 4.0.0 (Unicode MF2 reference implementation) | Parses and validates message catalogs at build time. It is also the default runtime formatter unless its guest-closure cost is measured too high (§8.5). |

viem is **not** a direct client dependency. The SDK uses it internally and exposes an EIP-1193 boundary. The test-only controlled wallet (§6.2) prefers the SDK's `./testing` EIP-1193 wallet if the SDK exports one; otherwise it uses the viem version the SDK resolves.

### 4.2 TypeScript environments

`tsconfig.base.json` sets `strict`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `isolatedModules`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `module: "preserve"`, `moduleResolution: "bundler"`, `allowImportingTsExtensions`, `noEmit`, and an explicit `target`/`lib`.

| Config | `lib` / `types` | Covers |
|---|---|---|
| `apps/web/tsconfig.json` | `ES2024`, `DOM`, `DOM.Iterable`; `types: []` so `@types/node` can't leak | `src/**` except workers |
| `apps/web/tsconfig.worker.json` (when the first worker lands) | `ES2024`, `WebWorker` | `src/**/*.worker.ts` + env-neutral modules |
| `tools/tsconfig.json` | `ES2024`; `types: ["node"]`; `module: "nodenext"` | `tools/**`, `tests/**` |

`pnpm typecheck` runs `tsc -p` once per config. There are no project references until a package extraction needs them.

### 4.3 Making Lit and Web Awesome earn their roles

**Web Awesome declares `lit` as a runtime dependency.** Any chunk that loads a `wa-*` control has already paid for Lit. The useful question is therefore only whether *guest-critical* code uses Lit. The answer is no:

- **Guest chunk:** the folder list, file view, breadcrumbs and outcome/diagnostic display are native custom elements. Light DOM plus `@scope`d CSS is enough for them. Effects come from `state/effect.ts`. The prototype's 819-line plain-DOM `app.mjs` shows this surface is manageable without a library. Its flaws were structural (globals, no scopes), not rendering.
- **Lazy write/settings chunks:** Lit components with `static properties` and no decorators (erasable syntax), plus individually imported Web Awesome Core controls through `ui/wa/`. `ui/wa/` is the only Web Awesome importer:
  - it registers a self-hosted EFS icon library *before* any component loads, so there is no Font Awesome CDN request;
  - it maps `--efs-*` tokens to `--wa-*`;
  - it keeps component `lang`/`dir` in sync with the EFS locale.
- **Measurement that can overturn this.** In C2, build the folder row/list both ways: native vs Lit with `@lit-labs/signals`. Adopt Lit on the guest path only if the native version fails a keyed-reorder/focus-retention fixture that Lit passes, **or** costs more than it saves in guest bytes plus implementation lines. Half a day, recorded in an ADR.
- **`<wa-page>`** is not used. [[technology-foundation]] already found it pulls Lit, button, drawer and icon into the root. The EFS shell layout is native CSS.
- **No control-pack bakeoff** (Web Awesome vs Fluent vs Lion) before the first write UI. Web Awesome is the directed candidate, MIT, and ships release-matched agent skills. The bakeoff runs only if Web Awesome fails an accessibility or cost fixture in C3. This is a deviation from the Experiment 2 sequencing in [[technology-foundation]].

### 4.4 Build, entries and release output

`vite.config.ts` settings:
- `base: './'`, `build.assetsInlineLimit: 0` and `build.manifest: true`.
- `build.modulePreload: { polyfill: false }`.
- `build.sourcemap: 'hidden'`. Maps become a separate release artifact and are not deployed by default.
- `worker.format: 'es'`.
- Target derived from the browser profile (§4.5).
- Dev server: `server.strictPort: true`, `host: '127.0.0.1'`, `server.fs.strict` and no `server.proxy`.
- No `?worker`/`?raw`/`?url` suffixes or `import.meta.glob` at portable seams. No `import.meta.env` in `src/`.

**Module provenance.** Vite's `.vite/manifest.json` describes output *chunks* and their chunk-level imports. It does not list every source module or package that contributed code to a chunk, so it can't prove a forbidden package is absent. The build therefore adds one small build-only plugin, `tools/build/provenance.ts`, referenced from `vite.config.ts`. In `generateBundle` it writes `provenance.json` containing, for every output chunk:
- its file name;
- its contributing module IDs (the bundler's per-chunk module list);
- its static and dynamic chunk imports;
- whether it is an entry.

Module IDs resolve to packages by their `node_modules/.pnpm/<name>@<version>/node_modules/<name>/` path, and to first-party files by their `apps/web/src/` path. The exact Rolldown field names are verified at C0.

Two cross-checks keep the plugin honest:
- every chunk's source-map `sources` must be a subset of its recorded module IDs;
- every emitted JS file must appear in `provenance.json`.

`pnpm build` runs `vite build`, then four checks over the output. **Each check fails the build.**

1. **`check-graph`.**
   - Computes the **startup set**: the entry chunk, its static imports transitively, and every `<link rel="modulepreload">`/`<script>` in the emitted `index.html`. Lazy chunks are reached only through a dynamic import that runs later.
   - Fails if any module contributing to the startup set comes from a forbidden package or path: Lit, Web Awesome and its dependencies, `@efs/sdk/actions`, the SDK journal, `features/*/write`, `shell/action-review`, `platform/storage`, `tools/`, or any `node:` / Node builtin.
   - Fails if `signal-polyfill` contributes to more than one main-thread chunk.
   - Fails on a non-literal `import()` in source or output.
   - Records the startup set's brotli bytes and module count as a trend line (§4.6).
2. **`scan-leaks`.** Greps every emitted file for Anvil's default mnemonic and its default private keys, `anvil_`/`evm_`/`hardhat_` method names, `127.0.0.1:854`, `EFS_DEV`, and the fixture package's name.
3. **`licenses`.** Maps bundled modules (from `provenance.json`) to packages. It emits `THIRD_PARTY_LICENSES.txt` into the output and fails on an unknown or unallowlisted license. Initial allowlist: MIT, ISC, BSD-2/3, Apache-2.0, 0BSD; OFL for fonts. Legal comments are preserved, with the exact Rolldown/Oxc option verified at C0.
4. **`release-manifest`.** Writes `release.json` (§7.4).

Output: relative HTML/CSS/JS, `manifest.webmanifest` (`id`, `scope` and `start_url` all `./`), reviewed icons, `THIRD_PARTY_LICENSES.txt` and `release.json`. There is no Service Worker until stage R.

### 4.5 Browser profile and experimental features

`boot/profile.ts` probes only what the **Guest Reader** profile needs:
- ES modules and dynamic `import()`
- custom elements
- `AbortSignal.any`
- `structuredClone`
- CSS nesting, `@layer`, `@scope` and container queries (via `CSS.supports`)

Failure shows the static unsupported message. There is no half-working app. The build `target` and the named engine minimums are set at C0 from pinned web-features/BCD data for exactly these features, and recorded in `docs/web-platform/feature-policy.md` with the dispositions from [[web-platform-standards-and-forward-profile]]. This document doesn't invent version numbers.

Explicitly experimental or forward, each behind an adapter with named fallback behaviour:

| Feature | Disposition |
|---|---|
| TC39 Signals polyfill | required, experimental |
| Navigation API | enhancement over `URL` + History; not needed for guest |
| View Transitions | enhancement |
| Popover / `CloseWatcher` | used in the write slice with a fixture; `<dialog>` fallback |
| Web Locks / BroadcastChannel | C3: the submission lock (§6.4) inside the SDK journal plus client "in progress in another tab" UX; wider private-state ownership in stage R. Where Web Locks are absent, writes are **disabled with an explanation**, never run uncoordinated. |
| OPFS / Storage Buckets | later |
| Temporal | not used until a date surface needs it |

### 4.6 Performance evidence without invented budgets

From C2 on, CI records the following as trend lines:
- guest startup-set brotli bytes and module count;
- request count to first qualified row;
- **RPC calls to first qualified row**, metered by the gateway (the prototype's cold pin was 123 logical RPCs, and the contracts `describe()` exists to cut that);
- time to first qualified row on the CI runner.

Budgets become failing gates at C4, set from the first reference-device measurement. The only failing performance gate before C4 is the graph rule: no forbidden module in the guest startup set.

---

## 5. One-command development and concurrency

### 5.1 Commands

| Command | Behaviour |
|---|---|
| `pnpm setup` | One-time per worktree: verifies Node/pnpm, installs Playwright browsers, creates the worktree registration (§5.3), generates editor adapters (gitignored) and runs `doctor`. |
| `pnpm doctor [--json]` | Checks tools, the registry directory's writability, sibling artifact compatibility (SDK protocol inputs == fixture release digest), sticky port availability, and any stale leases. It prints fixes and changes nothing. |
| `pnpm dev` | Starts or resumes this worktree's **private** chain + gateway + UI. Prints the URLs and one JSON line per readiness level reached: `{"event":"infra-ready",…}`, then `{"event":"files-ready",…}` when the pinned artifacts support it (§5.2). Foreground by default; Ctrl-C stops the UI and gateway and stops the chain **with its state dumped**. `--detach` runs the same supervisor in the background with a log file, for agents. |
| `pnpm dev --attach <chain>` | UI instance only, on an existing named chain. Never deploys, resets or stops that chain. It registers the UI origin with the chain's gateway. |
| `pnpm dev:chain --name <chain>` | A shared chain + gateway under their own owner. Survives any UI. Stopped only by `dev:stop --name <chain>`. |
| `pnpm dev:status [--json] [--wait infra\|files --timeout 120]` | Every instance this OS user runs: endpoints, generation, readiness level, artifact identities, owner and state. `--wait files` fails fast with exit `4` and reason `FILES_UNSUPPORTED_BY_PINNED_ARTIFACTS` when the pinned fixture declares no Files seed, instead of timing out. |
| `pnpm dev:stop [--name X]` | Stops only the leases this command can prove it owns (§5.5). With no name, stops this worktree's own. |
| `pnpm dev:reset --name X [--same-chain-id]` | An explicit destructive reset: a fresh deployment on a new chain, generation+1, **a new chain ID by default** and a fresh `realmId` via the existing initializer input, redeployed and reseeded (§5.8). `--same-chain-id` keeps the wallet network but marks the instance `replay-unsafe` everywhere it is displayed. Warns every attached UI and prints wallet recovery steps. |
| `pnpm dev:fund --name X <address> [eth]`, `pnpm dev:actors --name X` | Funds a real wallet address; lists fixture actors. Keys stay in the private record. |
| `pnpm dev:fault --name X <mode>` | Gateway fault injection, e.g. `drop-next-send-response`, `delay-reads 2s`, `fail-reads 50%`. Goes over the private control socket. |
| `pnpm qa:browser --name X --actor alice` | Opens a persistent, per-actor Chromium profile at the instance's UI URL, with a controlled test wallet injected. Its state survives restarts. |
| `pnpm preview:static [--prefix /ipfs/bafy…/] [--headers plain\|isolated]` | Serves the **built** `dist/` through `tools/serve` at an allocated stable origin. No Vite. |
| `pnpm test` / `pnpm test:e2e` | Unit/tools/purity tests / Playwright. E2E starts an isolated fixture per Playwright worker, unless a scenario owns a shared chain. It never reuses a developer's running instance. |

`node tools/dev/efs-dev.ts <cmd>` is the direct path. pnpm is a convenience wrapper. The supervisor watches both `process.ppid` and stdin EOF, so a killed pnpm wrapper or editor still triggers cleanup. That is the v1 preview-launcher lesson.

### 5.2 What `pnpm dev` does

1. Resolve the worktree registration: its ID and sticky `uiPort`, `rpcPort`, `anvilPort` and `chainId`.
2. Take the registry lock. Allocate on first run only (§5.3), write the lease as `starting`, and release the lock.
3. Call the fixture package to start the chain: `up --name <wt>-chain --host 127.0.0.1 --port <anvilPort> --chain-id <chainId> --state-dir <instance dir> --load-state --no-unlocked-accounts` (the flag name is the fixture's; §5.4). Its `verify --json` must confirm the chain ID, code hashes, proxy slots, `describe()` and the seed witnesses its bundle declares.
4. Start the **gateway** in-process on `127.0.0.1:<rpcPort>` (§5.4).
5. Start **Vite in-process** with `strictPort` on `127.0.0.1:<uiPort>`. Inject the dev plugin that serves `efs.config.json` projected from the public instance manifest. That manifest embeds the contracts deployment manifest **by digest**, as the contracts plan specifies.
6. **Readiness has two levels.** Each is published as a JSON event and recorded in the lease. A startup frame may show progress earlier.

   | Level | Checks | Needs |
   |---|---|---|
   | `infra-ready` | Fixture `verify` passed. SDK `verifyDeployment(manifest, gatewayUrl)` passed from Node **through the gateway**. The gateway answers `eth_chainId` and **refuses** `anvil_setBalance`, `eth_sendTransaction` and `eth_accounts`. `GET /efs.config.json` returns the current generation and manifest digest. | contracts bundle with `describe()` + fixture CLI; SDK `verifyDeployment` |
   | `files-ready` | Everything above, plus SDK `guestProbe` through the gateway lists the seeded Files root with `COMPLETE` coverage and opens one seeded file with verified bytes. | contracts Files profile + Files seed; SDK Files reader |

   `--wait` defaults to the highest level the pinned fixture **declares** in its manifest capabilities. A missing capability is reported as unsupported, never as a timeout or a pass.
7. The supervisor polls the chain head every few seconds and records the last-seen block, so crash recovery can say what was lost.

UI/HMR restarts touch only step 5. Vite handles config restarts itself; element modules have no HMR accept handlers, so a changed element triggers an honest full reload; CSS hot-swaps. The chain is never restarted by a UI change.

### 5.3 Identities, allocation and the registry

These are the PM proposal's five identities, made concrete:

| Identity | Concrete form |
|---|---|
| Worktree | `<worktree>/.efs-dev/workspace.json` (gitignored) holding a random ID, created by `setup`. A moved checkout keeps it. A **copied** checkout is detected when the registry sees one ID at two live paths, and the newer copy is re-registered. |
| Devnet + generation | Instance name + `generation` integer, in the lease. This fences cooperating tools only. The genesis hash is recorded as a diagnostic but is **not** treated as unique: identical Anvil genesis parameters can reproduce it. |
| EVM chain + deployment | `chainId` + `realmId` + deployment ID from the fixture's manifest, verified live. After a reset they differ through the new chain ID and the fresh `realmId` (§5.8), not through the genesis hash. |
| Client origin | `http://127.0.0.1:<uiPort>`. Always `127.0.0.1`, never `localhost`: they are different origins, and loopback IP is a secure context. |
| Actor/profile | Named fixture actor + Playwright context or persistent profile directory. |

**Registry** lives at `$EFS_DEV_HOME` (default `~/.efs-dev/`):
- `lock/` is an atomic `mkdir` lock whose owner file holds pid + process start time; a dead owner's lock is broken.
- `worktrees/<id>.json` holds the sticky assignments.
- `instances/<name>/lease.json` holds kind, owner (pid, start time, boot token), children, listeners, generation and state.
- `manifest.public.json` holds endpoints, chain ID, deployment, artifact digests, seed version and UI URL.
- `private.json` (mode 0600) holds actor keys, the control-socket path and admin endpoints.

Every write is atomic (write, then rename). Sandboxed agents that can't write `~` set `EFS_DEV_HOME` to a shared writable path. `doctor` reports when cross-worktree coordination is unavailable.

**Who owns the registry code.** The registry and lease library ships **in the contracts fixture package** and is imported by the client supervisor. There is one implementation, which the fixture CLI also uses standalone. Lease `kind`s are `chain`, `gateway` and `ui`. This is the single most important cross-repo agreement (§10).

**Allocation:**
- **First uncontended worktree:** UI `5173`, gateway `8545`, chain ID `31337`, Anvil on an allocated private port. That's the familiar MetaMask "localhost 8545 / 31337" setup, pointing at the gateway.
- **Later worktrees:** the next free triple from bounded ranges. The proposal is UI `5174–5199`, RPC `8546–8599`, and chain ID `3133701–3133799`, checked against chainlist at C1. Values are recorded as **sticky**.
- **An assignment is either tentative or published.** A *tentative* assignment was chosen during a first allocation. It has never been written to the worktree registration and never been printed or reported ready. A *published* assignment has been written to the registration or reported to anyone.
- **Only tentative assignments may be reallocated automatically.** A published (sticky) assignment never moves silently. If an unknown process holds a sticky port, `pnpm dev` **fails with exit `3` and a diagnosis**: who holds it, if knowable, and the `--reallocate` command. Moving would change the origin (losing browser state) and the wallet network, so only an explicit `--reallocate` does it. That command then publishes a new assignment and says so.
- **Probing.** Sequential `::` then `0.0.0.0` then `127.0.0.1` bind probes (the v1 IPv6 lesson). **The child's actual bind is authoritative.**
  - During a first allocation, `EADDRINUSE` from a child leads to another tentative choice within bounds and a full configuration rebuild, before anything is published.
  - For a published assignment it leads to the exit-`3` failure above.

  Two concurrent `pnpm dev` runs can never both publish ready for one port.
- **Explicit `--port`** conflicts fail. Nothing ever attaches to a listener just because it answers.

### 5.4 The dev RPC gateway

A small in-process Node HTTP server of roughly 200 lines. It is the **only browser- and wallet-facing RPC endpoint** in development. Anvil binds its own unadvertised loopback port, and only the supervisor and fixture tooling use it.

**The allowlist is an exact method list, not a namespace prefix.** A prefix like `eth_*` would admit `eth_sendTransaction`, `eth_sign`, `eth_signTransaction` and `eth_signTypedData_v4`. Against a node with unlocked accounts, those let any page or QA script act as a funded account **without the wallet**, which is precisely the authority the client must never bypass.

Initial allowlist, reviewed at C1 against the SDK's actual calls and the gateway's own metering log:

| Group | Methods |
|---|---|
| Identity | `eth_chainId`, `net_version` |
| Reads | `eth_blockNumber`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_call`, `eth_getCode`, `eth_getStorageAt`, `eth_getBalance`, `eth_getTransactionCount`, `eth_getLogs`, `eth_getProof` (only if the SDK uses it) |
| Transactions and fees | `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_estimateGas`, `eth_gasPrice`, `eth_maxPriorityFeePerGas`, `eth_feeHistory` |
| Broadcast | `eth_sendRawTransaction`: an **already signed** transaction only |

**Everything else is refused** with JSON-RPC error `-32601` and the method name. That includes every signing and unlocked-account method (`eth_sendTransaction`, `eth_sign*`, `personal_*`), `eth_accounts` and `eth_coinbase`, filter and subscription methods, and `debug_*`, `trace_*`, `txpool_*`, `anvil_*`, `evm_*` and `hardhat_*`. A batch is refused whole if any element is refused. Adding a method is a reviewed change with a stated consumer.

**The upstream Anvil endpoint is qualified, not called private.** A second loopback port is not a security boundary. Here is what is actually guaranteed:
- **No unlocked accounts.** The fixture starts Anvil without dev accounts (or with them removed) and signs its own deploys and seeds locally. An unlocked-account transaction therefore fails even upstream. If the pinned Anvil can't run without unlocked accounts, the fixture must say so in its manifest capabilities, and `doctor` reports the upstream as **signer-capable**.
- **CORS is restricted.** The upstream `--allow-origin` is set to a value no page has. C1 tests that a page on another origin cannot cause a state change on the upstream port, with both a preflighted JSON request and a "simple" `text/plain` POST. If the simple POST gets through, that is recorded, and the qualification below is widened to say so.
- **Remaining exposure, stated plainly.** Any process running as the same OS user can call Anvil's admin methods. This is accepted for single-user local development, is documented in `docs/dev-environment.md`, and is shown by `dev:status`. The cross-user/LAN profile needs authentication and is out of scope.

| Job | Why it needs a home |
|---|---|
| The exact method allowlist above | The client can't come to depend on Anvil-only methods. QA can't bypass wallet authority through unlocked accounts. Drive-by pages can't reset QA state through the advertised endpoint. |
| Per-origin CORS for registered UI origins | Anvil accepts a single `--allow-origin`. A shared chain with Alice's and Bob's separate UI instances has several origins. |
| Metering: RPC calls by method, per UI session | The prototype's cold pin needed 123 logical RPCs. This makes that number a CI trend (§4.6). |
| Fault injection over the private control socket | A wallet submits through the network RPC URL, which is the gateway. That makes **lost submission responses** testable with real extension wallets as well as the controlled one. |

This is not the "hidden Vite RPC proxy" the PM proposal rules out. It is a separate endpoint with plain JSON-RPC semantics, and static-profile tests can point the built client at raw Anvil to prove the gateway isn't load-bearing (§7.3 static job). Cross-OS-user or LAN/phone access is a separate later profile with authentication and HTTPS. It is never switched on by binding to `0.0.0.0`.

### 5.5 Process ownership, shutdown and crash recovery

**Processes.** There are two per private instance: the supervisor (supervisor + gateway + Vite in one Node process) and Anvil, started by the fixture package in its own process group. Fewer processes means fewer orphans.

**Shutdown.** Stop the UI, then the gateway, then run fixture `down --dump-state`: SIGTERM to Anvil's group, a bounded 5-second grace, then SIGKILL of **that group only**. Each step is recorded in the lease, including any cleanup failure.

**Kill rule.** Signals are sent only to a pid whose **start time and argv hash** match the lease. Never by port, process name or a bare stale PID.

**Crash recovery.**

| Situation | Behaviour |
|---|---|
| Supervisor SIGKILLed, Anvil orphaned | The next `pnpm dev` in that worktree finds a live, verifiable chain lease with a dead owner. It **adopts** the chain after `verify`, and reports the adoption. |
| Clean checkpoint (gateway quiesced, then dump; marker recorded) | Resume only if the loaded head matches the marker's block and hash. Then verify and continue. |
| Anvil killed, or no clean checkpoint | Only a periodic dump (`--state-interval`) exists, and it can't prove no later write happened. Report `ROLLBACK_UNCERTAIN` with the dump's block and the last polled head. **Refuse to resume automatically.** Offer `--accept-rollback` (restore as-is, same chain ID and Realm, marked `replay-unsafe`) or `dev:reset` (fresh deployment) (§5.8). **Never** silently re-seed a fresh fixture. |
| Unreadable state | Refuse. Offer `dev:reset`. |

**Orphans from other worktrees** are reported by `doctor`/`status` and never auto-killed. `dev:stop --orphans` kills only leases whose identity verifies and whose owner is dead.

**Shared chains** have their own supervisor. An attached UI's `dev:stop` removes only its UI lease and its gateway origin registration.

### 5.6 Coordination with the contracts and SDK plans

The contracts plan (current text) specifies `efs-contracts-fixture up/seed/verify/status/down`, shipped inside the bundle and on npm. It adds a deployment manifest, a private supervisor record, and a Solidity-`Seeder` seed with signed-author seeds left to the SDK's fixture layer. That is the right owner for the chain. The SDK plan adopts the same package, the shared registry, a `reset` command and `guestProbe` readiness (its §7.2).

The client adds UI and gateway leases in the **same** registry, through the **same** library. The SDK's integration harness uses the same fixture package and registry, and injects its own faults at the EIP-1193 port, so it needs no gateway.

The result is one chain launcher (contracts), one registry (contracts' library), one manifest validator (SDK) and one contributor command (client). The contracts plan does not yet name the registry library or unlocked-account removal (§10 X1).

### 5.7 Platforms

`pnpm dev` supports macOS and Linux, tested in CI on both. Windows is **declared unsupported** for the supervisor (use WSL2) until a Windows process-tree strategy is tested. `pnpm build` and `pnpm test` are platform-neutral. This is an honest support matrix instead of an untested promise.

### 5.8 Reset, rollback and replay: the actual guarantee

A generation label or a changed genesis hash **does not invalidate anything already signed.** Two operations have different guarantees, and the plan keeps them separate.

**Fresh deployment (`dev:reset`).** This is a new chain with a new deployment.
- **New chain ID** by default, from the worktree's bounded range; a shared chain's range is recorded in its lease. That is what invalidates old raw transactions (EIP-155 binds chain ID + nonce, and nonces restart). The wallet sees a new network, and `dev:reset` prints its exact fields.
- **Fresh fixture identity from existing inputs.** The fixture passes a new `realmId` through the initializer input that already exists. This needs no protocol change.
- **`--same-chain-id`** keeps the wallet network. Raw transactions signed on the old chain may then be valid again, so the instance is marked `replay-unsafe` in the lease, `dev:status`, the UI dev banner and test reports.

**Restoring a snapshot.** This is a rollback of *populated* state, not a new deployment. Its Realm identity cannot be casually rotated, because the restored records were written under it.
- An automatic resume requires **evidence of a clean checkpoint**. On a clean `down`, the supervisor first stops the gateway from accepting writes, then dumps state. It records a checkpoint marker (block number, block hash, dump digest), and after load the chain head must match that marker.
- A periodic dump **never** qualifies, even if it matches the supervisor's last polled head, because a write can land after the poll.
- Without a clean checkpoint the result is `ROLLBACK_UNCERTAIN`. The only two ways forward are:
  - `--accept-rollback`: restore as-is, keeping the same chain ID and Realm, marked `replay-unsafe`;
  - `dev:reset`: a fresh deployment.

**Signed EFS intents are not an open protocol question.** At the prototype revision `4fbea63`, `IntentV2` binds `realmId`, `realmOrigin` and `executionSet` inside the signed message. `realmOrigin` derives from the genesis chain ID and the Ledger address, and `_guarded` refuses a mismatch. So a name + version-only EIP-712 domain does not mean the execution context is unbound: portable *evidence* and permission to *execute* are separate. The ask (§10 X7) is only to verify that the successor keeps sufficient signed execution-context binding. A protocol change is proposed only if a concrete replay test shows a gap.

**Tested, not asserted** (§9.1 item 4):
- **Foundation slice (C3).** Capture a raw signed transaction in generation N. After a default `dev:reset` it is refused on chain ID. With `--same-chain-id` the test **records** whether it is accepted, which confirms the `replay-unsafe` label is truthful.
- **When the signed lane exists** (contracts S2 / SDK S2, after this proof). Add the same test for an old signed EFS intent against a fresh deployment. It is not part of the direct-only foundation proof.

The generation integer and genesis-hash diagnostic only fence cooperating tools and caches. They are never presented as a replay guard.

---

## 6. Wallet and QA workflows

### 6.1 Scenarios

| Scenario | Arrangement | Evidence class |
|---|---|---|
| Alice and Bob collaborate | One shared chain (`dev:chain --name team`). Two Playwright BrowserContexts, or two `qa:browser` profiles. Distinct fixture actors leased from the registry, so no two writers share a nonce stream. | controlled provider |
| One user in two tabs | One context, two pages. The shared submission lock (§6.4) plus client UX: one prompt, one attempt, the other tab shows "in progress in another tab" and then the reconciled result. Also covers closing the prompting tab and reloading. | controlled provider |
| Independent developers | Two worktrees, two `pnpm dev`: separate chains, chain IDs, origins, registry entries and processes. | supervisor tests |
| Two client versions | Two worktrees at different commits, both `--attach team`. Two origins, one chain. (Old/new tabs at one origin arrive with the Service Worker in stage R.) | controlled provider |
| One Principal on two devices | Depends on the SDK/contracts device-author profile (contracts S4). Reserved; not in the first proof. | — |
| Real extension wallet | Manual or periodic: the user's own MetaMask (or another EIP-6963 wallet) against `http://127.0.0.1:8545` / `31337`, funded by `dev:fund`. Playwright persistent Chromium profile with a pinned extension later. | **extension:&lt;name&gt;@&lt;version&gt;**, recorded separately |

**Auth profile for the first proof.** The first proof writes with a **direct EOA transaction**: one wallet prompt per plan, as allowed by the 2026-09-03 prompt-budget ruling as the direct fallback. The ruling's normal path for an EOA is one EIP-712 signature through a relayer, but the static, no-backend client has no relayer. That path needs an optional relayer profile (§11 Q5).

**This is a foundation slice, not a reduced MVP.** The first proof establishes the repository, dev environment and write pipeline. It does not narrow the Files MVP, which the 2026-09-08 ruling defines to include Lenses, tags, filters, rename/move/delete and the relayed-signature and delegated-session authorization profiles. Each of those remains required and gets its own vertical after C4. Nothing in this plan's acceptance may be cited as MVP completion.

### 6.2 Controlled provider versus real wallet

**Controlled provider.** `tests/support/controlled-wallet.ts` is a test-only EIP-1193 provider, announced through EIP-6963 by a Playwright init script and backed by fixture actor keys. It supports scripted approve, reject, delay and wrong-chain behaviour. It exists only in `tests/` and `tools/dev/qa-browser.ts`, and the build's leak scan proves it never ships.

**Reporting.** Every write result is tagged `provider: controlled` or `provider: extension:<name>@<version>`. **A controlled pass is never reported as wallet UX evidence.** The prototype plan's rule stands: a simulated provider is not equivalent to James's own wallet.

### 6.3 Required cases (C3)

- **Stale plan.** Alice plans a revision at basis B. Bob commits a conflicting change. Alice's submit is refused by the SDK precondition. The UI shows the conflict and offers a re-plan. It never shows success.
- **Network or account change.** Switching account or chain mid-review bumps the `WriterSession` epoch. Authorize refuses with `STALE_AUTHORITY`. The queued action is not retargeted.
- **Lost submission response.** `dev:fault drop-next-send-response`: the transaction is mined but the client never receives the hash. After a reload, the journal plus SDK reconciliation find the effect, show it `COMMITTED` after canonical read-back, and **do not resubmit**.
- **Wallet nonce history after a reset.** A default `dev:reset` rotates the chain ID, so the wallet sees a new network and its old nonce history no longer applies. `dev:reset` prints the exact network fields. With `--same-chain-id`, it also prints the targeted recovery step (MetaMask: clear activity/nonce data for that network).
  - The client detects the changed `(chainId, realmId)` and discards basis-bound caches and plans.
  - An old raw transaction is refused after a default reset, **proven by the §5.8 test**. That is not assumed from a JSON field or a genesis hash. The signed-intent version of the test waits for the signed lane.
- **Two tabs, one attempt.** Tab A reaches the wallet prompt. Tab B requests the same action and gets no second prompt and no second attempt. It waits on the shared submission lock, then re-reads the journal and finds tab A's unresolved attempt. Tab B shows "in progress in another tab" and then the reconciled result.
  - Closing tab A mid-prompt releases the lock. The attempt stays `UNKNOWN` until reconciliation, and never becomes "failed" by assumption.
  - BroadcastChannel messages are **UX hints only**. Correctness rests on the lock and the journal, never on a message saying another tab stopped.
- **Canonical read-back.** Every write is confirmed only by an SDK read-back. A second guest context then independently re-opens the result.

### 6.4 First persistent store: the attempt journal

**The client consumes the SDK's reference `indexedDbJournal`** (`@efs/sdk/web`) and does not build a competing store. The SDK plan (its §5.3) specifies what makes it correct:
- a `readwrite` transaction with `durability: "strict"` that resolves only after `complete`;
- a Web Lock per attempt, so two tabs can't submit the same plan;
- a versioned JSON Schema record that preserves unknown future fields.

The SDK also ships the **port conformance suite**. The client runs it in CI against whatever journal it wires, so a wrapper or substitute is held to the same bar.

**Submission lock key.** A lock keyed by attempt ID can't deduplicate two *independently created* attempts for the same action, because each tab would lock its own new ID. So the lock is taken **before** an attempt exists, and it is keyed by what must not happen twice:
- **Key:** `efs-submit:<chainId>:<realmId>:<deploymentId>:<account>`. That is one in-flight submission per account per deployment, which matches how a direct EOA's nonces serialize anyway.
- **Order:** acquire the lock, **re-read** `journal.unresolved()` for that account, then decide. If an unresolved attempt has the same plan digest or overlapping write subjects, join or reconcile it instead of creating a new one; otherwise create the attempt and journal it before any prompt. Release only after the attempt reaches a durable post-submit state.
- **SDK ask** (X3): expose this lock derivation, or accept it as a parameter, rather than locking only by attempt ID. If the SDK's per-attempt lock remains, it nests inside this one.

What the client adds:
- **The database namespace.** One database per deployment, `efs:<chainId>:<realmId>:<deploymentId>`, matching the SDK plan's example. No shared database straddles a reset.
- **Cross-tab UX.** Lock status comes from `navigator.locks.query`, and BroadcastChannel hints update other tabs. There is one prompt per attempt, whichever tab initiated it.
- **Unresolved-attempt handling.** On load, the write slice lists `journal.unresolved()` and runs reconciliation before offering any new action on the same subject.
- **Export.** A JSON download from a diagnostics panel, carrying the SDK's export schema version. Storage versioning and migration seams therefore exist before the first irreversible local data.
- **No Web Locks, no writes.** A browser without Web Locks gets writes disabled with an explanation, because uncoordinated attempts are not an acceptable fallback.

`pnpm qa:browser` profiles make the journal persist across manual QA. Stage R broadens ownership to drafts, grants and other private state. The submission journal's coordination is **C3 scope**.

### 6.5 Keeping dev authority out of shipped artifacts

- Dev keys, the fund/reset/fault commands, admin RPC and the controlled wallet exist only in `tools/` and `tests/`.
- The product build has no dev signer and no test-key import.
- `efs.config.json` in production is operator-supplied public data.
- `scan-leaks` checks every artifact, and fails if any file contains a known dev key, an admin method name or the fixture package name.

---

## 7. CI, releases and collaboration

### 7.1 Cross-repo artifacts

- **SDK:** exact version dependency. Until it is on npm, this is a GitHub Release tarball URL whose integrity pnpm records in the lockfile.
- **Fixture package**: exact dev dependency, same mechanism.
  - It is contracts-owned. The contracts plan's working name is `efs-contracts-fixture`; the SDK plan uses `@efs/contracts-fixture`, pending the npm-scope decision.
  - It carries the CLI, the registry library, the pinned Anvil and **its contracts release bundle**.
  - The contracts and SDK plans' fallback is a self-contained CLI file inside the bundle (`fixture/efs-fixture.mjs`). The client accepts that fallback, with the bundle fetched and verified through the `integration.lock.json` fallback below.
- **Compatibility check:** `doctor`, readiness and CI assert that `@efs/sdk/protocol-inputs.json` names the same contracts release digest as the fixture package. A mismatched set fails before any test runs.
- **Explicit local co-development:** `pnpm link:sdk ../sdk-v2` writes a gitignored `.efs-dev/overrides.json`. The supervisor injects a Vite alias and generated TS `paths` to the local SDK's built output. **No lockfile or `package.json` change is made.** Status, the UI diagnostics and the dev banner show `SDK: LOCAL <commit>[+dirty]`. CI and `pnpm build:release` refuse to run while an override file exists. `pnpm link:contracts <bundle-dir>` works the same way for the fixture's release bundle.
- **Packed-package test:** CI always installs the pinned tarballs (never workspace links), so undeclared dependencies and export-map bugs surface.

If contracts prefers to keep the release bundle outside the fixture package, the fallback is a one-file `integration.lock.json` holding `{ contractsRelease: { url, sha256 } }`, fetched and verified by `setup` into a cache.

### 7.2 GitHub jobs

All jobs pin actions by commit, use frozen installs, and need **no secrets**. Fork PRs run the same jobs.

| Job | Runs on | Does |
|---|---|---|
| `check` | every PR, ubuntu | `biome ci`; `pnpm typecheck` (every env); Vitest (units, tools, module purity); feature-policy/guidance lock parse; lockfile policy (one `signal-polyfill`, exact pins, `allowBuilds` reviewed). |
| `build` | every PR, ubuntu | `pnpm build` **twice**, comparing file hashes (the cheap reproducibility tripwire); graph, leak and license checks; `release.json`; uploads `dist/` + `release.json` + source maps as the run's single artifact. |
| `e2e` | every PR, needs `build` | Downloads **that** artifact. A per-worker fixture from the pinned fixture package, then Playwright: guest journeys on Chromium, Firefox and WebKit; write/two-user/two-tab/recovery scenarios on Chromium (controlled provider); the SDK journal port conformance suite, run in a real browser against the wired journal; the §5.8 replay test after a reset; the gateway allowlist test, which checks that refused methods are refused and upstream CORS blocks a foreign-origin state change; a static-prefix run through `tools/serve` at `/ipfs/<fake-cid>/`; one run against raw Anvil without the gateway; axe smoke; one narrow + RTL pseudo-locale layout pass. Traces are kept on failure. |
| `dev` | PRs touching `tools/**` + nightly, ubuntu + macOS | Supervisor tests with fake children (group kill, ppid death, bind race, stale lease/lock, adopt-orphan). Then the real thing: two concurrent `pnpm dev --detach` in two temp worktrees, one `dev:chain` + two attaches, `kill -9` recovery, and a check that `dev:stop` leaves no owned pid alive. |
| `release` | tag, protected environment | **Does not build.** Finds the `build` artifact from the tagged commit's CI run, verifies its `release.json` digest, and attaches exactly those bytes to a GitHub Release. Optionally adds a GitHub artifact attestation, a computed IPFS CID as a recorded observation, and a second independent build (E2). |

Branch protection on `main`: require `check`, `build` and `e2e`; no force-push; no required approval count (a single maintainer must be able to merge). AI reviews are evidence, not approvals. Dependabot opens weekly grouped updates for npm and actions; the pnpm `minimumReleaseAge` floor stays on.

### 7.3 Development, production-static and PWA profiles stay distinct

| Profile | Served by | Characteristics |
|---|---|---|
| dev | Vite via the supervisor | HMR, the gateway, dev config plugin; **no Service Worker registration** |
| static | `tools/serve` from built bytes | Prefix and root mounts; `plain` or `isolated` (COOP/COEP) header profiles; nothing but files |
| pwa | stage R | A separately allocated stable origin; generation, offline and update tests. Never started by `pnpm dev`, and never silently unregisters another origin's workers |

### 7.4 Release manifest, notices and evidence grades

**`release.json`** (`efs-client-release/1`) is generated by the build and records:

| Field | Contents |
|---|---|
| `source` | repo, commit, tree hash, dirty flag (release builds refuse dirty) |
| `inputs` | `pnpm-lock.yaml` sha256, SDK and fixture package integrity, contracts release digest |
| `toolchain` | Node, pnpm, Vite and TypeScript versions, runner OS/arch |
| `recipe` | build command and env allowlist, including `SOURCE_DATE_EPOCH` |
| `profile` | `static-core`; relative base |
| `files[]` | path, sha256, size, role |
| `excluded` | `release.json`, `efs.config.json` |
| `sourcemaps` | archive sha256 (maps shipped separately) |
| `licenses` | `THIRD_PARTY_LICENSES.txt` hash |

Release identity is sha256 over the canonical (sorted-key) JSON. Nothing is circular: the manifest never hashes itself, its enclosing CID or the operator's config. The IPFS CID and the release identity are separate facts.

**Licensing.**
- `LICENSE` (MIT) covers EFS-authored code. The README states that it does not license user content, and that third-party components keep their own licenses.
- `THIRD_PARTY_LICENSES.txt` ships in every build and is reachable from the About/diagnostics view.
- Self-hosted icon/font assets carry their license files.
- SPDX headers go on original source files.

**Evidence grades.** These scale with the release, and are named so nobody over-claims.

| Grade | Meaning | Required for |
|---|---|---|
| E0 | Source published at a tag | every build |
| E1 | CI-built artifact + `release.json`, published as those exact bytes (optional attestation) | any build offered to users |
| E2 | An independent rebuild (second runner or maintainer machine) reproduces every file hash, recorded in a separate evidence file | releases users are asked to upgrade to |
| E3 | An audit or review record against a named `release.json` | an explicit later milestone |
| E4 | Air-gapped reconstruction from the archived closure | a stronger later milestone; not a prerequisite for any development build |

The UI shows its `release.json` identity and grade in diagnostics, labelled for what it is. **A client that displays its own hash proves nothing if its bootstrap is compromised.** Verification has to come from outside: a pinned CID, an independent rebuild, or a user-held expected digest. There is no mandatory verification provider, license enforcement or third-party approval gate.

---

## 8. Contributor and agent instructions

### 8.1 `AGENTS.md` (short, harness-neutral)

`AGENTS.md` covers, in about 120 lines:
- the setup/dev/status/stop commands and their exit codes;
- how to get the actual URL (`dev:status --json`, never guessed from a port);
- the source map and dependency rules from §1.4;
- the guest-closure rule and how `check-graph` reports it;
- the SDK boundary ("never decode, compute IDs or decide success here");
- where standards evidence lives (§8.3);
- how to stop what you own;
- what never to do: kill by port, reset a chain you didn't start, add a dependency without an `allowBuilds` decision, touch `efs.config.json` in `public/`.

`CLAUDE.md` is one line, `@AGENTS.md`. Editor launch adapters are **generated per worktree** by `pnpm setup` and gitignored, because they have to hold that worktree's sticky UI port. The Claude Code preview `launch.json` is one of them. Committed templates live in `docs/`.

Supervisor exit codes: `0` ok, `2` usage, `3` conflict (port or instance), `4` readiness failed, `5` stale or mismatched manifest, `6` ownership refused.

### 8.2 Web Awesome agent skills

Anyone doing UI work with Web Awesome must load **both** release-matched skills from the installed, pinned package:

- `apps/web/node_modules/@awesome.me/webawesome/dist/skills/webawesome/`
- `apps/web/node_modules/@awesome.me/webawesome/dist/skills/webawesome-design/`

`pnpm skills:check` verifies that both exist and match the locked version. `setup` can link them into harness-specific skill directories (gitignored). No copied skill text is committed. The publisher labels the skills experimental, and they are guidance, not authority: EFS rules win (no CDN, no autoloader, icon library replaced, no `wa-*` in guest chunks, no Web Awesome types in public or persistent contracts).

### 8.3 Modern-Web guidance gate, sized to the change

The owner-approved gate from 2026-08-21 applies. It is implemented as:
- `docs/web-platform/guidance.lock.json`, holding source, commit/package version, digest and license for the Google snapshot, with the Paul Irish CSS guide link-only;
- `docs/web-platform/feature-policy.md`, with a row **only for features actually used**;
- a PR template line: *guidance IDs or `NO_WEB_SURFACE_CHANGE`; primary spec + status; profile disposition; fixtures run*.

CI parses the lock and policy files. Reviewers enforce the trace. A per-path receipt gate (`verify:web-evidence` in [[technology-foundation]]) waits until review demonstrably misses things. That meets the "no giant checklist on every copy edit" requirement.

`pnpm guidance:fetch` pulls the pinned snapshot into a gitignored cache for offline agent use. Nothing from it enters the bundle.

### 8.4 Documentation and PRs

`docs/architecture.md` is one page, covering §1–§3. `docs/dev-environment.md` covers instances, wallet setup, reset recovery and troubleshooting. `docs/releases.md` covers evidence grades and the release procedure. The first ADR records this foundation. The PR template has four lines: intent, web evidence line, dependency effects, checks observed.

### 8.5 i18n and a11y from the first form

**i18n**
- Message IDs live in `ui/messages/en.json`. Each is an MF2 message restricted to a documented narrow contract: `{$var}`, `:number`, `:datetime`, and `.match` for plurals. The contract is ours; the parser is not.
- **Parsing and validation use the existing MF2 implementation**, `messageformat@4`, the Unicode MessageFormat 2 reference. `tools/build/check-messages.ts` runs its parser and data-model validation over every catalog, then does a short walk of the parsed model. The walk rejects anything outside the narrow contract and checks that each locale's variables match `en`. It adds no parser, grammar or compiler of our own.
- **Runtime formatting also uses `messageformat` by default**, backed by `Intl`. If C2's measurement shows its cost in the guest startup set is too high, the fallback is to precompile from its parsed data model at build time. That is decided by the measurement and recorded in an ADR, not assumed. Either way the catalog source and message IDs are the durable contract, and no MF2 library type appears in a public or persistent interface.
- Pseudo-locales `en-XA` (accents + expansion) and `ar-XB` (RTL) are generated.
- `Intl` handles formatting. CSS uses logical properties.
- Addresses and IDs render inside `<bdi dir="ltr">`.
- Names show the SDK's verdict and are never slugged.

**a11y**
- Semantic controls; focus moves to the main heading on route change; focus returns after dialogs; a live region reports load and outcome status; reduced motion and zoom/reflow are supported.
- Playwright covers keyboard-only journeys. axe is smoke.

---

## 9. Staged implementation

Every stage ends on observable acceptance, not on a green unit suite.

| Stage | Deliverable | Acceptance | Depends on |
|---|---|---|---|
| **C0 — bootstrap** (≈2–3 days) | Root config, `apps/web` with boot/profile/route, an "EFS" static frame with the unsupported fallback, tokens/messages/locale, `tools/build` + `tools/serve`, `check` + `build` jobs, AGENTS.md, docs skeleton | Fresh clone → `pnpm install && pnpm setup && pnpm build` green on macOS and Linux. Output passes graph, leak and license checks and produces a `release.json` whose two builds match. `preview:static --prefix /x/y/` renders at depth. The module purity test runs. | G0 authorization only |
| **C1 — dev environment** (≈4–5 days) | Supervisor, registry adoption, gateway with the exact allowlist, in-process Vite, `infra-ready`, status/stop/reset/fund/fault, `dev` job | Two worktrees run `pnpm dev` concurrently, each reaching **`infra-ready`**, with distinct stable URLs and chain IDs. A `kill -9` of the supervisor is followed by a clean adopt. A lossy restore is refused without `--accept-rollback`. `dev:stop` leaves no owned pids. A bind race never produces two ready events. The gateway allowlist test and the upstream CORS test pass, or their qualification is recorded. `--wait files` reports "unsupported by pinned artifacts" rather than timing out. | **J1** (§9.2) |
| **C2 — guest read vertical** | `ReaderSession`, viewer frame, Files folder/file views, outcome display, recorded-result component pages, `e2e` job, native-vs-Lit and `messageformat` runtime measurements | **`files-ready`** reached. From the built artifact under a prefix: a cold guest opens a nested folder and a verified small file with **zero** wallet or provider access (a throwing provider stub proves it) and no write/OS modules in the startup set. PARTIAL/UNKNOWN render distinctly. RPC-to-first-row is recorded. | **J2** |
| **C3 — write vertical** | Write slice (Lit + Web Awesome), EIP-6963 connect, `WriterSession`, action descriptors, conserved review, the SDK `indexedDbJournal` wired and namespaced + export, cross-tab UX, controlled wallet, `qa:browser` | Alice creates a folder and file and publishes a revision, each confirmed by canonical read-back. Bob sees them independently on the shared chain. Every §6.3 case passes: stale plan, network/account change, lost response + reload, two tabs/one attempt, reset. The journal conformance suite passes in a real browser, and so does the §5.8 replay test. One manual real-wallet run is recorded separately. | **J3** |
| **C4 — first-proof closeout** | Run §9.1 end to end. Set performance budgets from a reference device. `release` job rehearsal to a draft GitHub Release. ADR on Lit placement. | All §9.1 checks pass and their evidence is recorded in a planning `Reviews/` note | — |
| **Later, not scheduled here** | R: Service Worker + generations, rescue app, storage ownership across tabs. H: minimal app host + SES worker runner. S: Session Shell. Tags/Lenses/filters and rename/move/delete per the 2026-09-08 MVP ruling. | Each is its own vertical with its own acceptance | — |

Parallel work while C2/C3 wait on the siblings: shell layout, a11y/i18n foundations and outcome rendering against recorded SDK results. **No client-side protocol stand-in.**

### 9.2 Reconciling milestones across the three plans, by artifact

The three plans number their stages independently, and as written they do not line up. This table keys the client's needs to **artifacts**. It proposes three joint checkpoints (J1–J3) for the PMs to schedule, instead of mapping stage numbers onto each other.

| Artifact the client needs | Client use | Contracts plan (current text) | SDK plan (current text) | Status |
|---|---|---|---|---|
| Release bundle with deploy plan + minimal `describe()` | J1 → C1 `infra-ready` | S1 ("minimal `phase()` and `describe()`") | S1 consumes the contracts S1 RC bundle | Aligned |
| Fixture CLI (`up/verify/status/down`, plus `reset`), shared registry library, no unlocked accounts | J1 → C1 | CLI ships "inside the bundle and on npm", but its table lists "fixture CLI" under **S3**. No registry library, no `reset`, no unlocked-account statement. | Its S1 integration lane already runs `fixture up/seed/verify` from the S1 bundle; it adopts the registry and `reset` (§7.2) | **Conflict.** Both consumers need it with S1. Ask contracts to move it (X1). |
| SDK `verifyDeployment` | J1 → C1 | — | S1 | Aligned |
| Files/Directory/Name (ASCII) profiles + a Files seed | J2 → C2 `files-ready` | **S3** | Its S2 Files vertical "depends on contracts **S2** (Files profile, upgrade fixture)" | **Conflict.** The SDK expects Files profiles one stage earlier than contracts schedules them. |
| SDK Files reader, `guestProbe`, recorded results | J2 → C2 | — | S2 (recorded results from S1) | Depends on the row above |
| Direct-EOA write whose author is the EOA, with a Files precondition that refuses a stale revision | J3 → C3 | S1 native lane (`msg.sender` is the author; binds `expectedExecutionSet`, "no read sets yet"). Stale Files refusal is in S3's acceptance ("stale atomic move refused"). | S2 plan/authorize/submit/reconcile | **To confirm with contracts:** that an EOA calling `execute` directly is a supported native author, and that the Files profile's precondition works without S2 read sets. |
| SDK `./actions`, `indexedDbJournal`, journal conformance suite | J3 → C3 | — | S2 | Aligned |
| Fresh `realmId` per fresh deployment via the existing initializer input; successor intents keep execution-context binding | C3 raw-transaction replay test; the signed-intent test later | Realm id is an initializer input. The domain is name + version, but the prototype's `IntentV2` binds `realmId`/`realmOrigin`/`executionSet` in the message. | — | Verify only (X7) |
| EIP-712 signed lane, ERC-1271 | Not needed for the first proof | S2 | S2 | — |

**Recommendation for the PMs.**
- **J1** = contracts S1 bundle + fixture CLI + registry, with SDK S1.
- **J2** = contracts Files profiles + Files seed on the **native lane**, delivered right after S1 (an "S1b" ahead of the signed lanes, since neither the SDK's Files vertical nor the client's first proof needs the signed lane first), with SDK S2's reader.
- **J3** = SDK S2's actions and journal.

The contracts PM may prefer another order. The point is that J2 is the critical path for all three repos, and today it is scheduled differently in two of the plans.

### 9.1 First proof: measurable acceptance

Each check has a command, and its pass/fail is machine-checkable unless marked manual.

1. **Two worktrees.** `pnpm dev --detach` in worktrees A and B. `dev:status --json` shows two instances at **`files-ready`**, with distinct `uiPort`/`rpcPort`/`chainId`/`realmId` and both guest probes `COMPLETE`. A keeps `5173`/`8545`/`31337`. Restarting A keeps the same URLs. (Before J2, the same check at `infra-ready` is C1's exit.)
2. **Guest static read.** Serve the `build` artifact through `preview:static --prefix /ipfs/bafy…/`, with no Vite. A cold Playwright context opens `…/#/<nested folder>` and a small file whose bytes verify. The wallet stub records zero calls. The network log shows only files in the guest startup set plus RPC calls to the configured endpoint. It passes again with the gateway removed (raw Anvil).
3. **Two users, one chain.** `dev:chain --name team`, then two `--attach team` UI instances from A and B. Alice (controlled provider) creates a folder and a file and publishes a revision. Each step reaches `COMMITTED` only after read-back. Bob's separate context sees all three through his own read. A stale Alice plan after Bob's conflicting write is refused and shown.
4. **Restart and recovery.**
   - Restart A's UI: the chain block number is unchanged.
   - Restart A's supervisor: the chain state (including Alice's writes) is preserved.
   - `kill -9` A's supervisor, then `pnpm dev` adopts the chain and reports the adoption.
   - `dev:fault drop-next-send-response` during Alice's submit, then a reload: reconciled to `COMMITTED` with exactly one onchain effect.
   - **Uncertain rollback.** Kill Anvil, so there is no clean checkpoint. `pnpm dev` reports `ROLLBACK_UNCERTAIN` and refuses to resume, even if the periodic dump matches the last polled head. `--accept-rollback` restores as-is (same chain ID and Realm), marked `replay-unsafe`. After a clean stop, resume is automatic.
   - **Replay after reset** (§5.8). Before resetting B, capture one raw signed transaction. After a default `dev:reset` on B it is refused through the gateway on chain ID. With `--same-chain-id`, whether it is accepted is recorded and the `replay-unsafe` label is displayed. The signed-EFS-intent version of this test is added when the signed lane exists; it is not part of this proof.
   - `dev:reset` on B changes nothing observable in A or in `team`.
5. **Stale manifest refusal.** Edit a public manifest's deployment code hash, or its `realmId`, or point it at a chain with a different chain ID. Readiness exits `5`, and the client shows a visible configuration mismatch instead of loading data.
6. **Owned-process cleanup.** Stopping A's supervisor ends every pid in A's leases. `team`'s chain and gateway stay up and still serve B. Two simultaneous `pnpm dev` runs contending for one **published** sticky port produce exactly one ready event and one exit `3`. Two first-time runs contending for one **tentative** assignment both become ready, on different ports.
7. **Shipped-artifact hygiene.** The `check-graph` startup set, computed from module provenance, contains no Lit, Web Awesome, `@efs/sdk/actions`, SDK journal, action review, storage, `tools/` or Node-builtin modules. `scan-leaks` is clean. `THIRD_PARTY_LICENSES.txt` is present. Two builds are byte-identical. The module-purity test passes, including the `define.ts` restrictions.
8. **Gateway authority.** Through the gateway, `eth_sendTransaction`, `eth_sign`, `eth_accounts` and `anvil_setBalance` are refused, and a batch mixing an allowed with a refused method is refused whole. A foreign-origin page cannot change upstream state. If the pinned Anvil can't drop unlocked accounts, `dev:status` shows the upstream as signer-capable.
9. **Two tabs, one attempt.** The §6.3 case: exactly one wallet prompt and one onchain effect, and the second tab shows the reconciled result.
10. **Pattern and disposal.** One new small feature is added by following `docs/architecture.md` (for example a "copy link" action descriptor). Navigating away disposes its scope: the Playwright test asserts no live effects or subscriptions via a dev-only scope counter exposed by the test build profile.
11. **Manual.** James (or a maintainer) completes item 3 with a real extension wallet. The result is recorded separately as `extension:<name>@<version>`.

Passing all of these proves the **foundation slice** (§6.1). It is not Files MVP completion.

---

## 10. Cross-repo contracts needing agreement

| # | Contract | Owner, and my ask |
|---|---|---|
| X1 | **Fixture package** (`efs-contracts-fixture` / `@efs/contracts-fixture`) containing:<br>• the CLI: `up/seed/verify/status/down/reset`; explicit `--host/--port/--chain-id/--state-dir/--load-state/--dump-state`; a realm-salt input; JSON output; stable exit codes; manifest **capabilities**, including whether a Files seed is present;<br>• the **registry/lease library** (§5.3, with `chain`/`gateway`/`ui` kinds);<br>• the pinned `@foundry-rs/anvil`;<br>• Anvil started with **no unlocked accounts** (or declared signer-capable), with deploys and seeds signed locally;<br>• **its release bundle**.<br>Installable from a GitHub Release tarball, with the in-bundle single-file CLI as the fallback. | Contracts. **Ship it with the S1 bundle, not S3** (J1). The SDK plan already assumes this in its S1. |
| X2 | Public deployment manifest + `describe()` as the readiness truth; named fixture actors with distinct keys (alice, bob, carol, …) in the private record only | Contracts (schema); SDK (validator) |
| X3 | SDK surfaces, per the SDK plan: `.` (`createEfs`, `httpRpc`, `verifyDeployment`) and `./files` guest-safe; `./actions`; `indexedDbJournal` with its port conformance suite in `./web` (or `./web/journal` if the provenance check shows the journal leaking into the guest startup set); `guestProbe` in `./testing`; a submission-lock derivation keyed before attempt creation (§6.4); name-profile verdict; `protocol-inputs.json`; `sideEffects: false` | SDK |
| X4 | One compatible-set rule: the SDK's protocol-inputs digest == the fixture's release digest, checked by the client's `doctor` and CI and by the SDK's own integration tests | All three |
| X5 | One pnpm major (12) and Node 24 LTS across the three repos; move to Node 26 together after its LTS date | All three. The contracts plan still says pnpm 10. |
| X6 | SDK integration uses X1 and the registry rather than its own launcher. The SDK injects faults at its EIP-1193 port, as its plan says, and the gateway stays client-owned. | SDK, client (agreed in the SDK plan §7.2) |
| X7 | **Signed execution-context binding (verify, don't add).** Confirm that successor signed intents keep sufficient execution-context binding inside the signed message: the prototype's `IntentV2` binds `realmId`, `realmOrigin` (genesis chain ID + Ledger address) and `executionSet`, and the EIP-712 domain stays name + version for portable evidence. The fixture uses a fresh `realmId` through the existing initializer input for every fresh deployment. A protocol change is proposed only if a concrete replay test against a fresh deployment shows a gap. Portable evidence stays separate from permission to execute. | Contracts (confirm the binding); fixture (fresh `realmId`); SDK and client add the replay test when the signed lane lands |
| X8 | **Joint checkpoints J1–J3** (§9.2): schedule them by artifact. In particular, resolve whether Files profiles + seed land in contracts S2 (the SDK plan's assumption) or S3 (the contracts plan's), and confirm that direct-EOA native authorship plus the Files stale-revision precondition work before the S2 read sets. | Contracts PM + SDK PM, with the client PM |

---

## 11. Questions for James / the PM (each with a recommendation)

1. **G0 for `client-v2`.** The repo exists, public, with an MIT `LICENSE` and a correct description (created 2026-09-26 20:39 UTC). Authorize C0 as the first commit, with branch protection requiring `check`/`build`/`e2e` and no required approval count. **Recommendation:** yes, and record "MIT for EFS original software, including client and dev tools" in `Decisions.md`, since no vault ruling states it for the client yet.
2. **Fixture ownership (X1).** Contracts owns the chain launcher **and** the shared registry library, and ships them in S1. The client supervisor composes, and adds the gateway and UI. **Recommendation:** yes. This is what keeps it to one launcher.
3. **Web Awesome without the bakeoff; Lit only in lazy chunks.** **Recommendation:** yes. The C2 measurement and any C3 fixture failure can reopen it.
4. **Toolchain alignment.** TypeScript 7 (typecheck only) and pnpm 12 in all three repos. **Recommendation:** yes. The fallbacks are named in §4.1.
5. **First-proof write profile.** Direct EOA, one transaction prompt, no relayer, explicitly as a **foundation slice**. The relayed one-signature path, delegated sessions, and the rest of the 2026-09-08 Files MVP (Lenses, tags, filters, rename/move/delete) remain required and are not reduced by this proof. **Recommendation:** yes. Otherwise the "static, no backend" proof would need a backend.
6. **Windows.** `pnpm dev` is unsupported on native Windows until a process-tree test exists; WSL2 is documented. **Recommendation:** yes.

---

## 12. Stale or conflicting guidance found

- **Repo naming.** [[architecture-and-modules]] (the `webclient/` tree), the web-client-os README (owner #11: rename to `*-v1`) and [[product-constitution-and-roadmap]] are superseded by the 2026-09-21 temporary `client-v2` naming.
- **Data Explorer.** [[architecture-and-modules]] and [[app-runtime-and-direct-launch]] still call Data Explorer part of the MVP guest closure or the default for unqualified links. The September boundary reconciliation and [[mvp0-acceptance]] make it optional, and it never sits in front of Files/App routes. This plan follows September.
- **Package tree.** The package tree in [[architecture-and-modules]] puts browser-neutral Reader/Files packages in the client workspace. September puts them in the SDK. This plan follows September.
- **Lit status.** [[technology-foundation]] says Lit "earns a default place inside nontrivial owned components"; the PM proposal calls it a comparator. §4.3 resolves both with a placement rule plus one measurement.
- **Web evidence gate.** The per-path `verify:web-evidence` gate in [[technology-foundation]] conflicts with the PM proposal's "no giant checklist". §8.3 sizes it.
- **Rescue.** Placement differs between [[architecture-and-modules]] (off-origin, retained) and the PM proposal (`apps/rescue` from the start). §1.3 defers it to stage R.
- **Contracts plan, against its current text.**
  - Q3 now acknowledges that `sdk-v2` and `client-v2` exist.
  - It still pins pnpm 10.
  - It lists the fixture CLI under S3 while also shipping it in the bundle.
  - It schedules Files profiles for S3, whereas the SDK plan expects them in contracts S2 (§9.2).
  - Its name-and-version-only EIP-712 domain is deliberate. Revision 1 of this plan wrongly read that as "no execution-context binding": the prototype binds it in the signed message (§5.8).
- **This plan's own revision 0.** It treated the genesis hash as a reliable reset identity, allowlisted `eth_*` by prefix, deferred cross-tab coordination to stage R, and claimed workspace membership made Node modules unresolvable. Revision 1 corrects all four (§14).
- **MVP scope drift.** [[mvp0-acceptance]] excludes rename/move/delete, but the 2026-09-08 ruling puts them, plus Lenses, tags and filters, in the MVP. M0-06 assumes a relayer. None of this changes the repository foundation, but the MVP acceptance overlay needs a refresh before C3 scope is fixed.
- **Workspace notes.** The workspace-root `AGENTS.md` (local only) lists no `*-v2` repos and calls the legacy SDK unmerged. `Onboarding/repo-map.md` says it is merged.

---

## 13. What this plan does not do

It does not:
- create repository content, install dependencies, run Vite, Anvil or a browser, or touch a wallet;
- select protocol bytes, the public name profile, a relayer, a Service Worker policy or a third-party runner;
- change the sibling plans.

Version numbers are dated observations to be locked at C0, not locks.

Vault bookkeeping not done in this pass: no `Daily Notes/agent-status.md` line, no Kanban card and no commit. This draft is left uncommitted for the planned second-model pass and PM forwarding. Whoever publishes it should add the status line and commit with `Agent: web-client-dev`.

---

## 14. Revision log

**Revision 1 (2026-09-26): the Web Client/OS PM's first review.** Bounded corrections only; the architecture is unchanged.

| PM finding | Resolution | Sections |
|---|---|---|
| 1. The gateway's `eth_*` allowlist admits signing and unlocked-account methods; a second loopback port is not private | Exact method allowlist, everything else refused (including batches), `eth_accounts` refused. Fixture Anvil has no unlocked accounts (or is declared signer-capable). The upstream is explicitly qualified: CORS-restricted and tested against foreign-origin state changes, and reachable by same-user local processes, which is accepted and documented. | §5.2, §5.4, §9.1 (8), X1 |
| 2. The genesis hash is not a reliable reset identity and does not invalidate signed transactions; sticky ports | New §5.8. A default reset or lossy restore rotates the chain ID (EIP-155) and the realm salt (EFS intents, X7). *(The realm-salt ask and the rollback rule were superseded in revision 2.)* Same-chain-ID options are labelled `replay-unsafe`. Old signed material is tested against the reset instance. Lossy restores are no longer silently resumed. Automatic reallocation is limited to tentative, never-published assignments. | §2.1, §5.1, §5.3, §5.5, §5.8, §6.3, §9.1 (4–6), X7 |
| 3. Cross-tab write coordination can't wait for stage R | C3 consumes the SDK's `indexedDbJournal` (strict durability, per-attempt Web Lock) and runs its conformance suite. The client adds namespacing, cross-tab UX and unresolved-attempt handling. Writes are disabled without Web Locks. A two-tab case is added to acceptance. | §3, §4.5, §6.1, §6.3, §6.4, §9, §9.1 (9) |
| 4. Enforcement claims exceed their mechanisms | Environment separation is now three layered mechanisms, with no resolvability claim. A build-only provenance plugin records per-chunk contributing modules, and `check-graph` uses that plus the emitted `index.html` preloads, not the Vite manifest alone. The purity rule exempts the entries and narrowly constrained `define.ts` registration modules. | §1.1, §1.4, §4.1, §4.4, §9.1 (7) |
| 5. C1 readiness depends on later capabilities | Readiness is split into `infra-ready` (C1) and `files-ready` (C2), and the fixture declares its capabilities. New §9.2 reconciles the three plans by artifact into joint checkpoints J1–J3 and names the two scheduling conflicts. | §5.1, §5.2, §9, §9.2, X8 |
| MessageFormat: don't write our own compiler | `messageformat@4` parses and validates catalogs; a short walk enforces our narrow subset; the runtime is `messageformat` unless measurement says precompile from its data model. | §1.1, §4.1, §8.5 |
| Direct-wallet proof must stay a foundation slice | Stated explicitly; the Files MVP scope and later authorization profiles are unchanged. | §6.1, §9.1, Q5 |

**Revision 2 (2026-09-26): the PM's second review.** One bounded correction pass.

| PM finding | Resolution | Sections |
|---|---|---|
| X7 overlooked the signed-message fields | Verified at `4fbea63`: `IntentV2` binds `realmId`, `realmOrigin` and `executionSet`, and `_guarded` checks them. X7 is now a verification item using a fresh `realmId` through the existing initializer input, with no new Core requirement. | §5.8, §9.2, X7, §12 |
| Restore ≠ fresh deployment; a polled head doesn't prove no rollback | A snapshot restore keeps its Realm. Automatic resume requires a clean-checkpoint marker (gateway quiesced, then dump). Anything else is `ROLLBACK_UNCERTAIN` and needs `--accept-rollback` or `dev:reset`. | §5.5, §5.8, §9.1 (4) |
| Signed-intent test contradicted the direct-only proof | The foundation proof tests raw-transaction replay only. The signed-intent test is added with the signed lane. | §5.8, §6.3, §9, §9.1 (4) |
| A per-attempt lock can't dedupe independently created attempts | Account-scoped submission lock taken before attempt creation, re-reading the journal after acquisition; SDK ask added. | §6.3, §6.4, X3 |
| Registration exemption excluded Web Awesome | `ui/wa/define.ts` gets a narrow allowance: icon library first, then only the listed `wa-*` tags. | §1.4 |

Revision 1 also aligns the SDK surface names with the sdk-v2 initialization plan: one `@efs/sdk` with subpaths, EIP-1193 as the boundary, and no EVM adapter package (§1.2, §3, §4.1, X3).
