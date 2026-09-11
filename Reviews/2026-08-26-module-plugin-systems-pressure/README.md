# DeepSeek Harness, Cordis, and modular-system pressure for the EFS Web OS

**Status:** complete first evidence and architecture-pressure pass at commit-pinned or retrieval-dated 2026-08-26 sources; no runtime framework, module ABI, package schema, configuration language, runner, or implementation is adopted
**Scope:** DeepSeek Harness, the Cordis spatiotemporal-composability paper and implementation, and transferable lessons from OSGi, Eclipse, VS Code/LSP, WebExtensions, Nix/Guix, Kubernetes, systemd/D-Bus, WordPress, Figma, SES/Endo, and Wasm Component/WIT/WASI
**Feeds:** [[Designs/web-client-os/architecture-and-modules]], [[Designs/web-client-os/app-runtime-and-direct-launch]], [[Designs/web-client-os/system-profiles-and-generations]], [[Designs/open-web-app-store/architecture]]
**Reviewed:** 2026-08-26

#status/done #kind/review #repo/planning #repo/client #repo/sdk #topic/cypherpunk-os #topic/app-model #topic/security #topic/wasm

## Outcome

DeepSeek Harness and Cordis contain a genuinely valuable answer to one part of
the EFS module problem: components should declare the services they require,
every host-mediated registration or acquisition should be owned by one live
component instance, provider withdrawal should drain consumers before the
provider disappears, and desired configuration should reconcile to observed
runtime state without leaving a half-updated graph.

They do **not** supply the whole EFS answer. Cordis runs cooperating plugins in
one JavaScript/Node realm. Its service realms isolate lookup names, not globals,
memory, DOM, network, storage, CPU or imports. A dependency declaration is not
a permission grant. An author supplies cleanup code and Cordis does not prove
that it reverses the effect. Network sends, public writes, chain submissions
and other emissions remain outside rollback. Interface identity/versioning and
durable-state migration remain open problems in the paper itself.

The EFS direction should therefore be:

> **Adopt the spatiotemporal composition laws in the trusted host control
> plane; do not adopt Cordis as the EFS public ABI, package identity, security
> boundary, configuration language, or production runtime without separate
> measured evidence.**

The current EFS skeleton survives and becomes more precise:

- `PackageHandoff` remains inert package/evidence input;
- exact profile locks and activation generations remain the desired and
  accepted configurations;
- a trusted lifecycle/capability kernel resolves exact service bindings,
  owns instance/resource trees, fences generations and reconciles status;
- untrusted code still runs only in explicit SES-Worker, Wasm-Worker or
  opaque-iframe lanes, with WebExtension/native adapters optional;
- state branches, migrations, grants, retained bytes, health and external
  action receipts remain separate lifecycles; and
- the direct guest Reader/Data Explorer or named-App path consumes a compiled
  minimum graph and never boots the general plugin manager before useful data.

No EFS Core or Files change follows from this pass. The pressure is on the Web
Client/OS runtime SDK, system-profile evaluator, package/runtime handoff,
capability broker, lifecycle ledger and hostile execution fixtures.

## Source locks, retrieval bases and evidence boundary

[DeepSeek's launch page](https://www.deepseek.com/harness/en/) calls the linked
work the **Cordis paper** and says Harness is built on Cordis. The paper is by
Yifan Shi, Wei Zhang and Tianyi Cui, with Peking University and DeepSeek-AI
affiliations; it is a Cordis design paper rather than an evaluation paper about
Harness. Treat the paper's model, Cordis upstream, and DeepSeek's separately
hardened vendored implementation as three related but distinct evidence layers.

| Source | Exact source or retrieval basis | Use and caveat |
|---|---|---|
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e) | `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`, tag line `dsh-v0.1.1-rc.2`, 2026-08-21 | Product/code evidence. DeepSeek calls it a developer preview and says core plugins/APIs will evolve. |
| [Harness architecture](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md) and [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-primer.md) | same Harness commit | Primary description of profiles, bundles, layered patches, services/events, reversible effects and durable session logs. |
| [Harness vendored-framework log](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md) | same Harness commit | Enumerates 18 local divergences, including behavior-changing lifecycle, reconciliation, watcher, persistence and config fixes. The table still names older Cordis `4.0.0-rc.7`, loader `1.0.0-rc.5`, include `1.0.4`, group `1.0.0` and HMR `1.0.15`, while checked-in manifests report `4.0.1`, `1.0.2`, `1.0.6`, `1.0.1` and `1.0.16`; use the Harness commit as the source lock and treat the table's finer upstream provenance as stale pending repair. |
| [Cordis upstream](https://github.com/cordiverse/cordis/tree/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4) | `8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4`, core `4.0.0-rc.8`, 2026-08-13 | Current upstream implementation inspected for the same-realm lifecycle/security boundary. Upstream labels the API unstable. |
| [*A Programming Paradigm for Spatiotemporal Composability*](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf), Yifan Shi, Wei Zhang and Tianyi Cui | repository `13f28585668a28106b2f53bedada36e45bc1ed3e`; PDF SHA-256 `4d48478dc0b6222d9f74d7db10ee776449b1209eb112632336544d32a49db97f`; 88 pages; Draft of 2026-08-13 | Formal-model and discussion evidence. The repository calls it a preprint under active revision. The PDF, not a mechanized proof, is the retained result. |
| OSGi Core R8 and Java 24 | [module](https://docs.osgi.org/specification/osgi.core/8.0.0/framework.module.html), [service](https://docs.osgi.org/specification/osgi.core/8.0.0/framework.service.html), [lifecycle](https://docs.osgi.org/specification/osgi.core/8.0.0/framework.lifecycle.html), [resolver](https://docs.osgi.org/specification/osgi.core/8.0.0/service.resolver.html) and [security](https://docs.osgi.org/specification/osgi.core/8.0.0/framework.security.html) specifications; [JEP 486](https://openjdk.org/jeps/486) | Versioned mature dynamic-service precedent. OSGi R8's Java permission/security design is not a modern hostile-code boundary: JEP 486 permanently disabled the Security Manager in JDK 24. |
| Eclipse Platform 4.40 | [extension registry](https://help.eclipse.org/latest/topic/org.eclipse.platform.doc.isv/reference/api/org/eclipse/core/runtime/IExtensionRegistry.html) and [declarative registry](https://help.eclipse.org/latest/topic/org.eclipse.platform.doc.isv/guide/runtime_registry.htm), retrieved 2026-08-26 | Host-owned declarative contribution-point and lazy-instantiation precedent; same-process code is not confinement. |
| VS Code and LSP | [extension manifest](https://code.visualstudio.com/api/references/extension-manifest), [extension hosts](https://code.visualstudio.com/api/advanced-topics/extension-host), [contribution points](https://code.visualstudio.com/api/references/contribution-points), and [LSP 3.17](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/), retrieved 2026-08-26 | Lazy activation, execution-location and versioned RPC precedent; shared extension hosts and advisory workspace trust are not hostile-code isolation. |
| WebExtensions | [W3C Community Group draft](https://w3c.github.io/webextensions/specification/), 2026-08-24; [Chrome permission warnings](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings); [Firefox permission guidance](https://extensionworkshop.com/documentation/develop/request-the-right-permissions/), retrieved 2026-08-26 | Required/optional/host permission and browser-managed-principal precedent. The CG report is not yet a W3C Standard; an installed extension can receive powerful browser/host privileges unavailable to an ordinary SPA, but update and re-consent behavior is browser-specific. |
| Nix/NixOS and Guix | [NixOS manual](https://nixos.org/manual/nixos/stable/), [Nix profiles](https://nix.dev/manual/nix/2.32/package-management/profiles), [Guix manual](https://guix.gnu.org/manual/devel/en/guix.pdf), retrieved 2026-08-26 | Store-closure, generation, retention, composition and rollback precedent; an input/derivation-addressed path does not prove exact output bytes, and executable configuration/code rollback do not prove data/external-effect rollback. |
| Kubernetes v1.36 | [controllers](https://kubernetes.io/docs/concepts/architecture/controller/), [objects/spec and status](https://kubernetes.io/docs/concepts/overview/working-with-objects/), [probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/), and [CRD versioning](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/), retrieved 2026-08-26 | Desired-versus-observed state, reasoned conditions, served/storage version and explicit conversion/migration precedent; eventual control loops are not package-resolution or activation transactions. |
| systemd v260.2 and D-Bus | [unit semantics](https://github.com/systemd/systemd/blob/v260.2/man/systemd.unit.xml), [service semantics](https://github.com/systemd/systemd/blob/v260.2/man/systemd.service.xml), [D-Bus specification](https://dbus.freedesktop.org/doc/dbus-specification.html), retrieved 2026-08-26 | Distinct dependency-edge meanings and stable interface name versus live provider-connection identity. |
| WordPress | [hooks](https://developer.wordpress.org/plugins/hooks/), [lifecycle](https://developer.wordpress.org/plugins/plugin-basics/activation-deactivation-hooks/), [plugin dependencies](https://make.wordpress.org/core/2024/03/05/introducing-plugin-dependencies-in-wordpress-6-5/), [schema upgrades](https://developer.wordpress.org/plugins/creating-tables-with-plugins/), and [failed-update rollback](https://make.wordpress.org/core/2023/07/11/new-in-6-3-rollback-for-failed-manual-plugin-and-theme-updates/), retrieved 2026-08-26 | Long-lived open-extension evidence and warning case for ambient authority, slug-only dependency identity, incomplete dependency semantics and code-only recovery. |
| Figma plugins | [execution model](https://developers.figma.com/docs/plugins/how-plugins-run/) and [manifest](https://developers.figma.com/docs/plugins/manifest/), retrieved 2026-08-26 | Useful split between privileged semantic API and browser-capable iframe UI; its own docs retain subresource/network residuals. |
| Web capability lanes | [SES](https://docs.endojs.org/modules/ses.html), [WIT](https://component-model.bytecodealliance.org/design/wit.html), [WASI design principles](https://github.com/WebAssembly/WASI/blob/main/docs/DesignPrinciples.md), [HTML sandbox](https://html.spec.whatwg.org/multipage/iframe-embed-object.html), [message-port object capabilities](https://html.spec.whatwg.org/multipage/web-messaging.html#ports-as-the-basis-of-an-object-capability-model), retrieved 2026-08-26 | Current confinement/interface mechanisms. Exact realization, adapter and cross-browser behavior remain profile evidence, not a standards-name guarantee. |

The Web and browser maturity findings route through
[[Reviews/2026-08-23-web-platform-standards-screen/README]] and
[[Designs/web-client-os/web-platform-standards-and-forward-profile]]. This
review does not substitute a plugin-system document for those exact standards
ledgers.

## What DeepSeek Harness actually built

DeepSeek describes Harness as “everything is a plugin.” At the checked commit,
models, tools, skills, session storage, sandbox providers, approval policy,
agent loops, schedulers and UI are composed as Cordis plugins. A running
profile is an ordered plugin tree built from bundles, a profile patch, a home
patch and command-line overlays. Stable row IDs let later layers replace
configuration or insert/disable rows.

The practical seams are:

- a `Context` holding named services such as `ctx.tools`, `ctx.llm` and
  `ctx.sessions`;
- required `inject` dependencies that leave consumers pending until providers
  exist and restart them when a provider identity changes;
- typed-in-TypeScript events with explicit dispatch modes such as emit,
  waterfall, parallel and serial;
- `ctx.effect()` ownership for listeners, child plugins, timers, watchers and
  other registrations, with cleanup on unload;
- a fiber per mounted component, carrying lifecycle and a committed view of
  the exact providers resolved for that activation;
- an append-only session event log as the reconstruction source for the model
  context, resume, fork, UI, telemetry and persistence; and
- an HMR/config reconciler that attempts candidate replacement and restores a
  prior tree when application fails.

This is more serious than a normal callback registry. In particular, service
withdrawal stops new provision and retains the committed service binding until
affected consumers settle, then removes that binding. It is not a universal
resource-drain barrier: Harness reverses the top-level disposer list but awaits
asynchronous disposer bodies concurrently, and other provider-owned effects may
already be tearing down. EFS can reuse the committed-binding idea only through
the stronger, explicitly attenuated consumer-first barrier below.

It is also a Node-centric trusted-plugin system. Loading/importing a plugin can
execute its top-level JavaScript. Direct access to Node/global objects is not
mediated by `Context`. `ctx.get(name)` supports optional lookup outside a hard
`inject` edge. The Harness's dynamic plugin runner documents its own `node:vm`
mechanism as cooperative rather than containment. None of these mechanisms may
be reused as EFS untrusted-App authority.

## What the paper contributes

### Temporal composability

In the paper's formal model, every context-mediated effect returns or yields an
inverse and the calculus composes inverses in reverse order. This makes creation
and cleanup local to one operation rather than splitting them across unrelated
`activate()` and `deactivate()` functions. The inspected Harness runtime owns
the disposer records but is weaker than a sequential LIFO transaction: it
reverses their top-level list and awaits asynchronous disposer bodies
concurrently.

For EFS, the transferable formulation is narrower and more operational:

> Every live host resource that the OS claims it can revoke or reclaim must be
> created through a lease-owning host operation, attributed to an exact
> instance/generation, and have idempotent fenced teardown.

The runtime does not prove that an author-provided inverse is correct. The
paper's arbitrary interleaving results additionally require independence or
commutation of effects. EFS must turn those assumptions into mediation,
serialization, instance fences and adversarial tests rather than relying on
the theorem's name.

### Spatial composability

Components declare required services. The runtime continuously resolves those
requirements against active providers, keeps one committed provider view for
the lifetime of an activation, and deactivates/reloads a consumer when that
view changes.

For EFS, the transferable formulation is:

> A module instance runs against one exact, inspectable dependency-binding
> view. A stable service contract, a user-configurable slot, an exact provider
> binding, and a live consumer handle are different identities.

Equal return values do not make two providers the same generation. Conversely,
backend churn behind a stable broker need not restart every consumer. The
service topology must say which behavior applies.

### Reconciliation and failure

The paper distinguishes a target dependency view from the view committed to a
running fiber. It models retirement as a request, not instant deletion, and
lets an in-flight asynchronous transition land and then roll back if the
target changed meanwhile. DeepSeek adds transactional candidate reconciliation
and last-good reconstruction around this model.

For EFS, the transferable formulation is:

> Desired profile, exact resolved lock, accepted activation generation,
> observed runtime status and last-healthy selection remain separate.
> Reconciliation is generation-fenced and idempotent; it never re-resolves a
> mutable range during launch or reports rollback until the predecessor is
> actually restored.

### System boundary and emissions

The paper's most important security/recovery caveat is its acquisition-versus-
emission boundary. Opening a port, creating a Worker or registering a listener
can be reversed locally. Bytes already sent to a remote peer, a chain
submission, an exported file another program read, an email, payment or public
EFS write cannot be made nonexistent by disposing the plugin.

EFS already has the better abstraction: external dispatch belongs in a typed
action/operation receipt with `NOT_DISPATCHED`, `DISPATCHED`,
`REMOTE_STATUS_UNKNOWN`, confirmed and rejected outcomes. A disposer may close
the channel and prevent future sends; it does not rewrite history.

## What is formal, and what is not

The paper proves useful conditional properties, not blanket safety:

- LIFO recovery applies when each supplied inverse is actually an inverse.
- Removing one component amid others requires the relevant transformations to
  commute or otherwise be serialized.
- consumer-before-provider withdrawal and committed-view stability are useful
  formal results;
- progress assumes an acyclic dependency/precedence relation, finite component
  names, bounded effect iteration and lifecycle scheduling;
- confluence additionally assumes no failed fiber, pairwise independence and
  total provision; and
- confluence compares internal final state, not the history of external
  emissions.

The runtime does not verify inverse witnesses, complete mediation,
commutativity, acyclicity, boundedness, total provision or absence of ambient
effects. The paper repository contains the PDF, not a machine-checked proof.

The Koishi case study is meaningful existence evidence—an open ecosystem with
more than 4,000 community plugins over four years—but the paper says Koishi
currently uses Cordis v3 while the paper presents v4. It is one TypeScript
ecosystem, observational rather than controlled, and supplies no quantitative
overhead or developer-productivity comparison. That is enough to take the
model seriously and not enough to select it for EFS.

## DeepSeek's production-hardening evidence

The vendored-framework log is especially valuable because it records where a
clean abstraction met real loader/runtime failure. Its 18 listed divergences
include packaging/rescoping/documentation changes and these behavior-changing
controls:

- publish effect ownership before setup runs, close reentrant-disposal gaps,
  retain partial cleanup after setup failure and reject new effects while a
  fiber is unloading;
- import/validate candidates before destructive replacement where possible,
  await lifecycle settlement, and restore the former plugin/config when
  candidate application fails;
- reconcile group changes as a unit and undo sibling additions/changes after
  failure;
- parse and patch included configuration on a detached clone, commit cached
  data only after successful reconciliation and serialize child-tree mutation;
- coalesce exact-path configuration watching and drain watcher work on
  teardown;
- serialize durable config writes, retry transient rename failures, surface
  terminal errors and drain writes during shutdown;
- use one exported pure patch implementation for live mounting and offline
  `--dump-config`, avoiding evaluator drift; and
- resolve config expressions only after declared dependencies are active.

The specific deadlock, reentrant teardown, Windows rename, stale-patch and
partial-reconciliation failures are reusable acceptance fixtures. They also
show why a module kernel cannot be “a small map of callbacks” once it owns
live updates.

One local provenance flaw is itself instructive: the exhaustive vendor table
at the checked commit names older upstream/package versions than the checked-in
package manifests. EFS provenance, SBOM and exact adapter/runtime identity
must be generated and verified from the retained closure, not maintained only
as prose next to it.

## Cross-system comparison

| System | Keep | Do not copy |
|---|---|---|
| Cordis / DeepSeek Harness | owned effects, declared dependencies, committed provider view, consumer-first withdrawal, stable config node IDs, last-good reconciliation, inspectable lifecycle | same-realm execution as security, flat string service keys, optional lookup as authority, arbitrary executable config, production HMR as an update guarantee |
| OSGi | qualified requirements/capabilities, dynamic provider wiring, lifecycle states, deterministic service-registry ranking and usage tracking | treating `ResolveContext` candidate order as canonical dependency resolution—the resolver cannot guarantee a preference under all constraints; SecurityManager-era or shared-JVM containment; stale wired revisions; code rollback as data rollback |
| Eclipse | host-owned namespaced contribution points, schema-first inert declarations, lazy executable instantiation, version metadata | stale registry handles, same-process trust, extension-point-specific hidden conflict law |
| VS Code / LSP | declarative contributions, activation triggers, browser/remote execution locations, versioned RPC, initialization capability negotiation, cancellation/progress/tracing | ID-only dependencies, one shared host as isolation, advisory trust, untyped inter-extension exports |
| WebExtensions | required versus optional permissions, runtime requests, gesture-scoped `activeTab`-like authority, restart-safe background logic and browser-specific warning-triggering update ceremony | browser store/signature as EFS package identity, optional grants collapsed into required-update consent, isolated DOM world as hostile-code containment, privileged extension principal as direct-client prerequisite |
| Nix / Guix | explicit store closures, coexisting versions, atomic profile generations, retained rollback roots, typed merge algebra, source-visible conflicts and reproducibility discipline | input/derivation-addressed paths as proof of exact output bytes, executable configuration as canonical public data, forced overrides hiding conflicts, GC without visible rollback loss, code rollback standing in for state recovery |
| Kubernetes | desired/spec versus observed/status, generation-qualified conditions, reasoned `True/False/Unknown`, idempotent controllers, readiness distinct from liveness, served versus storage versions and explicit conversion/old-object migration | eventual convergence as activation atomicity, assuming old stored objects migrate automatically, multiple reconcilers fighting over one field, unavailable conversion service as silent success |
| systemd / D-Bus | distinct `Requires/Wants/Before/After/Conflicts` meanings, stable interface name versus unique live connection, leased ownership and disconnect revocation | mutable path/name activation, ambient machine privileges, process restart as state migration |
| WordPress | named extension points, explicit activation/deactivation/uninstall phases, schema-version markers, visible dependency/recovery UI and third-party-free recovery need | slug-only dependency identity, no minimum/maximum versions or load-order semantics, update leaving an active dependent with a newly missing dependency, global callback priority/order, ambient filesystem/database privilege, cleanup hooks or code-file rollback as full recovery |
| Figma | split privileged semantic API from browser-capable iframe UI, message boundary, lazy document access, host cancel/close affordance | iframe subresource allowlist as complete no-egress, fetched/eval'd remote code, plugin self-close as the only kill path |
| SES / Wasm / browser lanes | least-authority endowments/imports, WIT-shaped interfaces, resource handles, Worker/frame termination, MessagePort capabilities | standards/library name as proof of confinement, same-realm Compartment as CPU/memory isolation, Worker placement alone as denial of fetch/storage, iframe sandbox as no-egress |

The synthesis is deliberately a hybrid. No precedent covers exact package
identity, deterministic shareable configuration, hostile browser execution,
user-owned grants/private state, static-IPFS delivery, fast direct links,
agent parity and honest external-effect receipts together.

## EFS module constitution — working recommendation

These are design laws for iteration, not frozen interface names or bytes.

### 1. Preserve a non-plugin trusted substrate

“Everything is a plugin” is useful product shorthand and false as a security
claim. At least these roles remain conserved and independently recoverable:

- deployment/Boot-generation verification;
- the direct Reader result law and safe raw rescue;
- exact package/closure verification;
- lifecycle, capability and generation fencing;
- conserved install, permission, signing and recovery ceremony; and
- the audit/status ledger and last-known-good selector.

A different trusted base is possible only as an explicit exact base-generation
activation or separately isolated Try. An ordinary module cannot replace the
verifier that admits it.

### 2. Separate four service identities

```text
ServiceContract
  semantic interface + exact version/profile + conformance obligations

ServiceSlot
  a user/system role requiring one ServiceContract under a selection law

ProviderBinding
  exact Release/Set + RunnerRealization + configuration/grant/state binding
  selected for one activation generation

ServiceLease
  one consumer's scoped, revocable live handle to one provider generation
```

A bare string, TypeScript declaration merge, package name, URL or mutable path
cannot stand in for these identities. WIT-shaped contracts are the leading
language-neutral shape, with semantic RPC bindings for MessagePort, SES,
trusted calls and native IPC. The exact IDL and compatibility calculus remain
evidence questions.

### 3. Make every dependency edge explicit

At least these meanings must not collapse into one `dependsOn` list:

- required for preparation versus required for live execution;
- optional fixed-at-activation versus optional live/discoverable;
- membership/want versus startup/teardown order;
- exclusive singleton selection versus brokered many-provider service;
- conflict/exclusion;
- UI/list contribution with a deterministic merge law; and
- integration adapter connecting otherwise independent services.

The resolved graph records exact providers, interface versions, edge kinds,
cardinality, selection rationale and every conflict. Input order, import order,
callback registration timing and mutable catalog ordering cannot decide the
result. Cycles unsupported by an explicit protocol fail before code runs and
remain visible, rather than silently pending forever.

### 4. Dependency satisfaction is not authority

Resolution may make an instance `PREPARED` or `AWAITING_GRANT`. It never grants
or launches untrusted code on its own.

```text
effective authority
  = requested ceiling
  ∩ runner/profile ceiling
  ∩ client/root policy
  ∩ explicit user/admin/session grant
  ∩ current platform support
```

Unknown required dimensions yield `UNSUPPORTED` with zero grant. Dependencies
do not inherit one another's capabilities. Provider replacement, fork,
reinstall, identical bytes or update does not inherit a prior grant silently.

### 5. Own host resources by instance lease

Every listener, route, timer, Worker/frame, port, object URL, closure mount,
pending request, focus/fullscreen attachment, ephemeral namespace and child
instance belongs to one exact instance/generation lease. Host creation APIs
register ownership before guest setup can re-enter teardown. New resources are
rejected after revocation begins. Cleanup is idempotent, fenced and ledgered.

Module-authored cleanup is cooperative optimization. The host must still be
able to revoke ports, abort brokered work, remove frames, terminate Workers,
release host handles and reject late messages if guest cleanup throws or
hangs.

### 6. Withdraw consumers before providers

Provider retirement follows an explicit barrier sequence:

1. fence the provider generation and issue no new leases/calls;
2. mark the provider unavailable for new dependency resolution;
3. notify dependent instances and revoke, drain or restart them according to
   the service contract;
4. keep only the exact committed teardown view needed for bounded cleanup;
5. close dependent handles and child leases;
6. release provider-owned host resources; and
7. record quiescent, failed, timed-out or leaked status with the observed
   generation.

Equal-valued replacement is still a new provider identity. A stable broker may
hide backend rolling transitions only when the broker contract, selection
policy, in-flight behavior and failure semantics explicitly permit it.

### 7. Keep reversible host effects separate from external effects

Host-reversible acquisition includes listener registration, a timer, a local
temporary handle or an execution surface. External emission includes a chain
submission, public EFS write, network request already sent, payment, message to
another Principal or exported bytes another program consumed.

External effects use action plans/receipts, commit withholding where possible,
or an explicit compensation operation. Cancellation means no new dispatch or
best-effort interruption; it never manufactures rollback after dispatch.

### 8. Reconcile exact desired state transactionally

The canonical shared profile is finite inert data, not executable JavaScript,
YAML tags, `eval` or arbitrary expressions. Authoring tools may be powerful,
but they compile to one exact inspectable lock with field provenance and typed
local holes.

The manager:

1. resolves and verifies a detached exact candidate;
2. computes dependency, capability, privacy, state and migration diffs;
3. prepares and preflights without moving the active selector;
4. obtains explicit authority where required;
5. stages state branches and exact install bindings;
6. changes one coherent selection tuple;
7. health-gates the accepted generation; and
8. restores the predecessor or reports explicit recovery/`UNKNOWN`.

Desired, resolved, retained, installed, granted, selected, active, ready,
healthy, degraded, failed and current remain distinct conditions. Each status
names its observed generation, reason, basis and responsible component.

### 9. Keep durable state outside disposable code

Hot reload or provider restart cannot silently carry arbitrary heap state.
Durable state binds an exact schema, attachment contract, branch and migration
receipt. Migrations use source-read/new-branch-write handles and receive no
ambient network/signing/public-write authority. Code rollback and data rollback
are separate claims.

Append-only ledgers are useful where reconstruction matters, as in Harness's
session log, but EFS must not turn logs into a privacy leak. Persist minimum
typed lifecycle/action facts, redact or encrypt private values, and derive
views from versioned events. A live effect inspector is not by itself a
tamper-resistant durable receipt.

### 10. Keep execution lanes explicit

| Lane | Trust and use |
|---|---|
| Inert descriptor / host-rendered contribution | Default for menus, commands, metadata, folder views and semantic presentation where code is unnecessary. Discovery executes zero package bytes. |
| Trusted in-process ESM and Web Components | EFS-owned or explicitly base-trusted hot-path UI only. Same realm/DOM/global means one TCB; Web Components provide composition, not confinement. |
| SES Compartment inside Dedicated Worker | Leading untrusted-JavaScript service lane. SES restricts ambient language authority; Worker termination supplies a kill boundary. The verified outer worker/bootstrap remains trusted and must not expose raw fetch/storage. |
| Wasm Component/WIT inside Dedicated Worker | Leading portable non-DOM service/compute lane. Exact imports/exports and resource handles shape authority; browser adapters/runtime remain pinned trusted realization. |
| Opaque-origin sandboxed iframe plus `MessagePort` | Full-Web UI lane. Construction policy is frozen before creation; port revocation and frame removal are the host's best-effort teardown path, not proof of a separate renderer/process. Sandbox does not imply no network/DoS. |
| MV3 extension/native bridge | Optional installed high-privilege adapter with separately reviewed grants. Never required for direct guest correctness. |

Cordis-like lifecycle orchestration sits above these lanes. It may manage the
host-side bridge as a trusted component, but it does not turn a same-realm
plugin into confined code.

### 11. Treat HMR as development tooling

HMR may shorten development feedback and is a good stress test for teardown.
It is not the production update protocol. Production accepts exact Releases,
complete closures, grant/state diffs and activation generations. It must not
depend on ESM cache eviction, arbitrary live import replacement, filesystem
watchers or developer-only rollback assumptions.

### 12. Keep critical policy out of generic middleware

Typed event modes and interceptors are useful for telemetry, transformations
and ordinary extension points. Generic waterfall/AOP ordering must not control
package verification, effective-grant computation, signing meaning, recovery,
or the canonical action digest. Critical policy has one conserved computation
and inspectable plan/receipt; modules may supply typed inputs, reducers and
evidence but cannot short-circuit the root law.

## Direct-link and performance consequences

The general module manager must not become the tax every public hyperlink
pays. A guest file/folder or named-App route uses a precomputed minimum graph:

```text
Boot Core
  -> route and exact accepted generation
  -> Reader / artifact verifier
  -> Minimal Viewer or Minimal App Host
  -> exact built-in Data Explorer entry or exact named guestEntry
  -> first qualified data / inert App surface
  -> optional background profile/status warm-up
```

Requirements:

- no general dependency solver, catalog query, wallet, private store, Session
  Shell, HMR engine or configuration evaluator before first useful data;
- no plugin code merely to discover contributions or render inert metadata;
- accepted exact locks compile to a small derived boot index/manifest bound to
  `{SystemActivationGeneration, lock/root digest, evaluator/conformance
  version, platform profile, route key}` and authenticated by an expected
  whole-index digest in trusted local evidence or per-entry proof against the
  accepted lock root; Boot validates bytes, tuple and entry membership rather
  than letting self-declared metadata become a second selector, and mismatch
  falls back to the conserved Reader/minimal route;
- route-required packages load in parallel from one exact closure graph;
- modules not on the selected route stay absent, not merely initialized but
  hidden; and
- any failure reaches trusted raw/Data Explorer or independent rescue without
  loading the broken module manager.

The later rich Shell can inspect, enable, swap, profile and debug thousands of
modules. That flexibility is built on the same contracts and is not present in
the guest critical closure.

## User-mod experience consequences

RimWorld-like freedom comes from visible, stable extension points and user
control, not from letting every mod patch every global in undefined order.
The configuration manager should provide:

- one understandable on/off switch per exact contribution/provider binding;
- exact dependency, compatibility, conflict, capability, privacy and state
  impact before activation;
- deterministic ordering or an explicit conflict instead of “last callback
  happened to win”;
- selectable implementations for named slots, including resource-typed
  retrieval such as torrent/magnet handlers;
- reusable bundles/recipes that resolve to exact locks;
- `Inspect`, disposable `Try`, `Adopt`, `Fork` and `Activate` as distinct
  operations;
- profiles that are hyperlink-shareable and inert/read-only by default;
- per-profile state attachments and grants chosen by the recipient rather
  than copied from the publisher; and
- a conserved safe mode that can disable every ordinary third-party module
  without losing Reader/recovery access.

An advanced author may compose modules that call other modules. Those calls
still cross declared service contracts and scoped handles. The host does not
need to prohibit rich composition; it needs to make the resulting graph,
authority and failure domains inspectable.

## Human and agent parity

Humans and agents use the same structured module operations:

```text
inspectGraph
explainResolution
compareGeneration
planTry
planGrant
planActivate
executePlan
inspectLifecycle
disableBinding
restartInstance
rollbackSelection
exportClosure
repairGeneration
```

An agent can inspect dependency/conflict causes, effective grants, pending
status, live resource ownership and rollback feasibility without scraping
pixels. Authority-bearing operations still require an explicit user mandate or
conserved ceremony. A plugin/agent cannot self-register a tool and thereby
self-grant the authority behind it.

## Retain, revise, and reject

### Retain from the current EFS spine

- one module graph with guest and full boot profiles;
- conserved Boot/Reader/System Chrome and independent rescue;
- inert `PackageHandoff` and separate OS-local installation/runtime state;
- exact locks, immutable generations, last healthy selection and retained
  closure roots;
- `AppInstanceLease`/child resource tree and common capability protocol;
- SES-Worker, opaque-iframe and Wasm/WIT lane gradient;
- deterministic shareable profiles with recipient-owned grants/private state;
- lazy route-shaped loading and direct Data Explorer/named-App paths; and
- typed external action receipts rather than fictional rollback.

### Revise or make explicit

- distinguish contract, slot, provider binding and live service lease;
- type dependency edge meaning, topology and cardinality;
- freeze one committed provider view per activation/instance;
- add consumer-first provider withdrawal and a bounded teardown view;
- make every lifecycle condition generation-qualified and reasoned;
- require all claimed-reversible host resources to be lease-mediated;
- reject new host effects after revocation begins;
- treat missing dependencies/cycles as visible typed status;
- require permutation-invariant resolution or provenance-rich conflict;
- define one versioned pure configuration/provenance semantics, reuse one
  implementation within each product path to prevent live/offline drift, and
  retain independent conforming evaluators as freeze evidence; and
- test reentrant setup/disposal, concurrent mutation, durable writes and
  rollback failure.

### Reject

- Cordis or another plugin framework as an adopted public EFS ABI today;
- “everything is a plugin” as removal of the trusted base;
- service presence, dependency declaration or catalog membership as a grant;
- bare string service keys and semver convention as independent-package
  compatibility;
- same-realm ESM, Web Components, Workers, VM contexts or isolated worlds as
  hostile-code confinement by themselves;
- executable shared profile configuration;
- import/registration order as selection or conflict law;
- arbitrary production HMR as user update/rollback;
- module cleanup callbacks as the enforcement mechanism;
- code rollback as proof of state or external-effect rollback; and
- silent indefinitely pending modules as a healthy system.

## Acceptance and falsifier queue

No product implementation is authorized by this review. The following are
small disposable experiments once James authorizes them.

### A. Direct-route zero-tax fixture

Open a cold exact file/folder link and an exact named-App link. Assert that the
general profile evaluator, package catalog, wallet, private store, Session
Shell and unrelated modules execute zero code before first qualified data or
the inert App surface. Record bytes, imports, main-thread work and request/RPC
waterfalls. Replay a stale index, swap route entries and tamper each bound field;
then alter `guestEntry`/provider mappings while keeping the tuple unchanged.
Every mismatch must reject before package fetch/evaluation and reach the
independent minimal Reader/App route without accepting another provider or
generation.

### B. Lifecycle ownership and reentrancy fixture

A module registers listeners, timers, ports, a Worker, object URLs, pending
requests and child instances, then triggers disposal during setup. Inject a
throw/hang in one cleanup. Assert ownership is visible before setup re-enters,
new effects are rejected while revoking, every host-owned resource is still
reclaimed, repeated teardown is harmless and late messages cannot resurrect
authority.

### C. Provider withdrawal fixture

Use `A -> B -> C`, an equal-valued replacement provider, a stable broker and
in-flight calls. Assert no new leases after fencing, consumers drain before
provider teardown, and the retained teardown view contains only host metadata
and close/cancel handles. Ordinary invoke/subscribe, new acquisition and a
malicious external send fail after the fence. Any separately declared drain RPC
is attenuated, deadline/budget bounded and incapable of new external dispatch.
Stale generations fail, direct replacement restarts affected consumers, and
brokered backend replacement follows its declared policy.

### D. Dependency and conflict fixture

Model required/optional-live/optional-snapshot edges, wants, order, conflicts,
singletons, registries and a cycle. Shuffle catalog/input/activation order
1,000 times. Require the same resolved-lock digest or the same provenance-rich
conflict. A cycle and missing provider are visible `UNRESOLVED/PENDING` causes,
not success or silent process exit.

### E. Transactional reconciliation and crash fixture

Fault candidate parse, import, verification, preparation, old teardown, new
start, health, rollback start, state write and process/browser termination at
every boundary. Require either the exact last-good tuple restored or durable
explicit `ROLLBACK_FAILED/UNKNOWN` with the graph fenced and unaccepted; never
expose or report a mixed graph as accepted/healthy. Transient partial resources
must remain owned and visible to cleanup. Reproduce the DeepSeek concurrent-
include and delayed-write failure classes.

### F. External-effect fixture

Acquire a local network handle, dispatch one mock remote request or chain
submission, then revoke and roll back the instance. Assert the handle closes
and no future request can dispatch, while the prior emission remains recorded
as `DISPATCHED/REMOTE_STATUS_UNKNOWN` until reconciled. Never report it as
undone by plugin teardown.

### G. Cross-lane service conformance fixture

Implement one versioned retrieval/transform contract as trusted ESM, SES in a
Dedicated Worker and Wasm/WIT in a Dedicated Worker. Exercise identical typed
inputs/outcomes, cancellation, deadlines, revocation and conformance vectors.
Measure direct-call versus RPC cost without making transport the semantic API.

### H. Hostile lane fixture

Attempt fetch, WebSocket, storage, nested Worker, dynamic import, primordial
mutation, CPU/memory exhaustion and stale-handle reuse in SES/Wasm Workers;
attempt every network/navigation/storage/fullscreen/popup channel in an opaque
iframe. Record `FULL/REDUCED/UNSUPPORTED` per browser. Any reachable channel
falsifies a no-egress claim. For the frame bootstrap, try a sibling `null`-
origin spoof, wrong nonce/epoch, replay, navigation before and after one-shot
port transfer, and a later document in the surviving `WindowProxy`; none may
receive or retain authority, and each load/navigation revokes the former port.

### I. State and rollback fixture

Use generations G1 schema A, G2 dual A/B and G3 B-only. Fail before migration,
after copy, after activation, after health and after an external dispatch.
Assert exact code/config/grant/state/external-effect outcomes separately and
retain necessary roots until an explicit rollback horizon expires.

### J. Thousand-module and safe-mode fixture

Resolve and inspect a deterministic thousand-node graph, then activate only a
small route subgraph. Measure resolution/reconciliation/status projection and
ensure route cost follows the selected graph, not total library size. Crash,
spin and corrupt modules; conserved Reader/recovery must remain available with
all third-party bindings disabled.

### K. Interface evolution fixture

Define `/1` and `/2` of one service contract plus an explicit adapter. Test old
host/new provider, new host/old provider, unknown optional field, unknown
required capability and parallel versions. Discovery executes no package code;
incompatibility is `UNSUPPORTED`; telemetry never becomes authority to remove
an old version.

### L. Provenance-ledger fixture

Generate retained framework/package provenance from the exact closure and
compare it to human documentation. Deliberately stale a prose version table as
seen in the checked Harness commit. The machine gate must fail or mark the
fine-grained upstream claim `UNKNOWN`, never silently certify it.

## Evidence and decision queue

### No owner choice yet

- Do not choose Cordis, OSGi, another DI container or a custom runtime now.
- Do not freeze service/slot/lease names or WIT bytes.
- Do not choose a general executable profile/configuration language.
- Do not claim enforced iframe no-egress or universal SES/Wasm isolation.
- Do not move package, grant, activation, state or runtime authority into EFS
  Core.

### Engineering research that can proceed reversibly

1. Specify the smallest language-neutral service contract and the four
   contract/slot/provider/lease identities as fixture-only shapes.
2. Run fixtures A-D first; they test the hot path and lifecycle skeleton
   without selecting a public ABI.
3. Compare a tiny custom owner-tree/reconciler with Cordis and one OSGi-like
   reference implementation in disposable tests. Selection requires measured
   browser bytes, main-thread work, failure behavior and auditability.
4. Run SES/Wasm/iframe hostile conformance before promising a third-party lane.
5. Reconcile the generic shapes with the SDK PM, Data Explorer, Arcade, Media,
   Forge and App Store pressure journeys.

### Mature escalation rule

Bring James a choice only if experiments reveal an irreducible product or
permanence fork—for example, whether ordinary users may activate a third-party
provider into a privileged conserved slot, or whether one service contract
must promise hot provider replacement rather than restart. Library choice,
teardown algorithms and adapter mechanics remain engineering decisions until
evidence makes them permanent.

## Final pressure verdict

The EFS Web OS should be more modular than conventional web applications and
more explicit than conventional mod platforms. Cordis validates that deep
runtime recomposition can be made coherent and ergonomic. Nix/Guix demonstrate
compositional store closures and rollbackable profile generations without, by
themselves, proving exact output bytes. OSGi/D-Bus validate service/provider
identity and dynamic withdrawal. Eclipse/VS Code validate inert contribution
points and lazy activation. WebExtensions validate permission deltas.
Kubernetes validates desired/observed state. SES, Wasm and browser isolation
mechanisms provide different execution boundaries.

EFS's distinctive synthesis is a hyperlinkable, content-addressed, user-owned
system whose configuration is inspectable before code runs, whose authority is
recipient-owned, whose modules occupy explicit failure domains, whose guest
Reader remains fast and independent, and whose updates never rewrite the
user's accepted generation. The current skeleton is capable of that result.
The next work is to make its lifecycle laws executable in disposable fixtures,
not to replace it with a plugin framework prematurely.
