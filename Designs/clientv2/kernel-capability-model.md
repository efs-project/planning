# Kernel & capability model
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[codex-kinds]], [[codex-envelope]], [[identity]], [[apps-cookbook]]
**Reviewers:** —
**Last touched:** 2026-07-22 — codex-gpt-5 (app-model research correction; original fable-5)

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

## What this rules

This is THE component/capability architecture doc: it elaborates thesis rulings **F1** (the Ring-3 cage), **F2** (protection domains, honestly) and **F8** (ports, membranes, pickers) into buildable mechanism, and re-cuts the 2026-05-26 `efs.*` brainstorm (Brainstorms/2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface.md) into the capability-handle model. Where [[web-os-thesis]] and this doc disagree, the thesis wins until amended; disagreements are surfaced in Open questions, not smuggled. Evidence: Reviews/2026-07-07-clientv2-corpus/research/web-isolation.md, Reviews/2026-07-07-clientv2-corpus/research/capability-os.md, Reviews/2026-07-07-clientv2-corpus/research/fuchsia-components.md.

The one-sentence model: **a Ring-3 app is a SES compartment in a network-denied Worker whose entire world is a set of Kernel-minted MessagePorts; the Kernel is a Genode-shaped capability router whose routing table is content-addressed data; pickers mint grants; System Chrome mints ceremonies; nothing is ambient.**

### The three-layer cage (F1, mechanism)

Three independent layers, always, per app instance. Each covers what the others cannot; none is trusted alone. **[research-grounded]**

1. **SES / Hardened JS (in-language):** `lockdown()` in every app Worker; one `Compartment` per app whose `globalThis` is endowed with exactly `efs` (the typed veneer, below), `console` (Kernel-piped, rate-limited), and hardened intrinsics. No `fetch`, no `WebSocket`, no `importScripts`, no `Worker` constructor — denial by omission. LavaMoat-style per-package policy + `globalThis` scuttling applies to the OS's own bundles and to app bundles at package time. SES is hardening, not the boundary (lavapack `with()` bypass, 2024).
2. **The Worker boundary (structural):** app code runs in a **dedicated Worker created from a `blob:` URL**, which inherits the creating document's CSP — enforceable on static/IPFS hosting with zero server headers. A Worker has no DOM, no navigation, no `window.open`, and no `RTCPeerConnection` — the exact vectors CSP provably cannot close in DOM contexts (WebRTC uncovered by `connect-src`; `navigate-to` removed 2022; DNS-prefetch/prerender bypasses).
3. **Declarative denial (browser-enforced):** the baseline policy table below, designed to the Safari floor.

**The CSP asymmetry (load-bearing).** The OS page itself runs at `connect-src 'none'` — the Shell never fetches. The Kernel escapes by being a **real-URL same-origin Worker**: workers loaded from real URLs use their *own response's* CSP and do not inherit the page's, so on header-less static hosting the Kernel worker's network is ungoverned by page CSP (its discipline is its own broker code + LavaMoat), while every Ring-3 `blob:` worker inherits the page's total denial. On hosted-with-headers lanes we serve the Kernel worker an explicit permissive `connect-src` and keep the page at `'none'`. This is a refinement the thesis's F1 one-liner glosses (the page cannot be both `connect-src 'none'` and the Kernel's fetch context); it must be pinned with a cross-browser test matrix, and if any engine is found to inherit page CSP into real-URL workers, the fallback is the **cradle lane**: a per-app sandboxed iframe (opaque origin, `allow-scripts` only, ~50-line hash-pinned bootstrap) whose meta-CSP is the denial baseline and which spawns the app's blob worker inside itself. **[reasoned]** on the asymmetry; each half is individually research-grounded.

### Baseline policy table (Safari floor)

| Mechanism | Baseline value | Delivery (header-less static lane) | Safari-floor note |
|---|---|---|---|
| CSP `default-src` | `'none'` | `<meta http-equiv>` | works in meta |
| CSP `script-src` | `'self' blob:` + import-map `integrity` on every module | meta + import map | integrity: Safari 18+ / Chromium 127+; single import map only (no multiple-map dependence) |
| CSP `worker-src` | `'self' blob:` | meta | `'self'` admits the Kernel real-URL worker; `blob:` admits Ring-3 |
| CSP `connect-src` | `'none'` (page-wide) | meta | the cage; Kernel escapes per asymmetry above |
| CSP `img-src` / `font-src` / `media-src` | `blob: data:` (Kernel-verified bytes only) | meta | no HTTP subresources, ever — verified bytes are re-minted as blob URLs |
| CSP `style-src` | `'self'` (+ hashes for the token sheet) | meta | no inline app CSS exists (apps own no pixels) |
| CSP `frame-src` | `blob:` (render service documents only) | meta | — |
| CSP `form-action` / `base-uri` / `object-src` | `'none'` / `'none'` / `'none'` | meta | NOT covered by `default-src`; set explicitly |
| Trusted Types | `require-trusted-types-for 'script'; trusted-types efs-shell-renderer` | meta | Baseline 2026 (Safari 26, Firefox 2026-02); on older Safari it degrades to hardening-absent — the reconciler still has exactly one sink |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=(), payment=(), display-capture=(), sync-xhr=(), idle-detection=(), clipboard-read=()` | **header-only** — on static lane enforced structurally (workers lack these APIs) + `allow=""` attribute on every render-service iframe | no network/WebRTC directive exists; that is CSP's + the Worker's job |
| COOP / COEP | `same-origin` / `require-corp` (+ CORP `same-origin` on own assets) | header-only; SW-injected on responses after first load (coi-serviceworker pattern) | **no `credentialless`** (Safari refuses); no `webrtc` CSP directive — Worker structure is the WebRTC answer |
| `X-DNS-Prefetch-Control` | `off` | header-only; moot in workers | relevant only to the render-service DOM lane |
| iframe `sandbox` (render service) | `sandbox="allow-scripts"` — **never** `allow-same-origin` | attribute | both together = no sandbox at all |

### Why iframes are demoted to the render service

A DOM context leaks by construction: WebRTC exfil (`connect-src` doesn't cover it; the `webrtc 'block'` directive is Chromium-partial and absent from the Safari floor), frame self-navigation (`location = evil?secret` — unfixable since `navigate-to` was removed), DNS-prefetch/speculation side channels, and subresource beacons needing a directive-perfect CSP. Workers close all of these structurally. So iframes hold exactly one job: the **render service** — the sandboxed, opaque-origin, `allow-scripts`-only lane for *untrusted documents* (HTML/SVG/PDF mirror bytes per [[mirror-scheme-policy]] / ADR-0056 logic), composited inside Shell-drawn frames, never receiving capabilities, never hosting app logic. An iframe is where untrusted bytes get *shown*; a Worker is where untrusted code gets *run*. **[research-grounded]**

### Render surface modes

Apps own no pixels; they hold render capabilities. Three modes, one per granted surface:

| Mode | Mechanism | For | Honesty/a11y posture |
|---|---|---|---|
| **surface** (default) | declarative UI tree over the render port; the compositor (System Chrome, thesis Amendment 2) reconciles into compositor-owned DOM built from the system catalog (Lit + Web Awesome); the Session Shell supplies placement/focus policy | ~90% of apps | the compositor owns real DOM: screen readers see true semantics; locale/direction/tokens uniform; the same tree is the agent-visible UI |
| **canvas** | transferred `OffscreenCanvas` the app paints, inside a compositor-drawn frame | editors, games, visualizers | mandatory semantic sidecar (surface-mode tree flagged non-visual) for anything interactive |
| **document** | render service iframe (above) | untrusted document bytes | never app logic; grades/venue labels drawn by the compositor-drawn frame, not the document |

### Surface-mode schema — first sketch (ADR before OS-SDK freeze)

```ts
// @efs/os-sdk render vocabulary v0 — [reasoned]; prototype ADR owns the freeze
type NodeId = number; type SignalId = number; type HandlerId = number;
type Scalar = string | number | boolean | null;

type SurfaceNode =
  | { k: 'text'; value: string | { signal: SignalId } }          // text is data, never markup
  | { k: 'el'; component: CatalogName;                            // CLOSED, versioned catalog
      props: Record<string, Scalar | { signal: SignalId }>;       // validated per-component schema
      children?: NodeId[];
      on?: Partial<Record<EventName, HandlerId>> }                // handlers are ids, not functions
  | { k: 'slot'; child: RenderChildCap };                         // nested surface (spawned workers, embeds)

// over the render port:
surface.mount(root: NodeId, nodes: Record<NodeId, SurfaceNode>): void;
surface.patch(ops: PatchOp[]): void;       // insert | remove | move | setProp | rebind
surface.signal(id: SignalId, value: Scalar): void;   // high-frequency lane — no tree diff
// inbound: { handler: HandlerId, event: SanitizedEvent }  — plain data, no DOM objects
```

Reconciliation: the compositor (System Chrome, per thesis Amendment 2 — the Session Shell supplies placement policy and never owns raw DOM) keeps a retained tree per surface; `patch` ops are schema-validated then applied to real DOM; **prop bindings compile to a per-surface signal graph** — `surface.signal()` updates flow signal→bound-property with no diffing (rAF-batched), so a slider or a progress meter costs one property assignment, which is how surface mode dodges the RemoteViews sluggishness complaint. All strings land via `textContent` under the single `efs-shell-renderer` Trusted Types policy. Limits are first-class: max nodes/surface (default 50 000), patch ops/s, signals/s — exceeding pauses the surface with a visible "app UI throttled" state, never silent drops. **Honesty chrome is unforgeable by construction:** `<efs-identifier>`, grade badges, venue labels, and pending-state indicators are catalog components that accept *refs* (claim id, venue id, outbox id) — the compositor resolves grade/state through the Kernel itself; an app literally cannot render a LIVE badge on STALE data or paint a fake ladder state. Component catalog versioning rides the closure manifest (a generation pins its catalog; apps declare a minimum).

### The Kernel as capability router

Model: Genode's init, not a permission database. One routing table, declarative, live; policy applied at grant time; use is direct and cheap (app↔Kernel port, no per-call prompt). **[research-grounded]**

**The capability table is content-addressed, diffable data:**

```ts
type CapTable = {
  v: number;                                  // monotone; canonical CBOR; hash = table version
  principals: Record<PrincipalId, {
    class: 'user-app' | 'system-service' | 'agent-session' | 'shell';
    appIdentity: AppId;                       // (author identity, app-root record)
    manifestHash: Hex; packageHash: Hex; persona?: PersonaRef;
  }>;
  grants: Record<GrantId, {
    holder: PrincipalId;
    type: CapType;                            // 'fs.file' | 'fs.subtree' | 'records.query' | 'endpoint.rpc'
                                              // | 'endpoint.gateway' | 'endpoint.http' | 'render.surface'
                                              // | 'render.canvas' | 'storage.kv' | 'outbox' | 'locale'
                                              // | 'lens.view' | 'channel' | 'worker.spawn' | ...
    scope: ScopeDescriptor;                   // PRINTABLE — this string IS the receipt line
    attenuations: Attenuation[];              // readOnly | kinds[] | subtree | rateLimit | byteBudget
                                              // | expiry | decay | gasBudget | privacyClassCeiling
    origin: 'manifest-floor' | 'picker' | 'chrome-ceremony' | 'delegation' | 'plan';
    parent?: GrantId;                         // delegation chain; revoking a parent severs the subtree
    state: 'live' | 'paused' | 'revoked' | 'expired';
    issuedAt: number; lastUsedAt: number; useCount: number;
  }>;
};
```

The wiring diff **is** the install/update review (Sculpt precedent); the table snapshots with each generation and rolls back with it — with the rule that a rolled-back table is *re-evaluated*, not resurrected: a grant revoked after the snapshot stays revoked (revocation state lives in a monotone overlay the rollback cannot erase). Permission-center copy comes straight from `scope`: *"Photos can read & write ‘Site redesign’ (picker, 2026-07-07, used 214×) — Pause · Revoke"*.

**MessagePorts as capability tokens.** The Kernel mints a port pair per grant; the app holds one end (unforgeable, transferable, severable); the Kernel end is a **caretaker proxy**: every message validated against scope + attenuations + meters, logged to the local receipt journal, then forwarded to the backing service (venue reads, journal, outbox, render, broker). Revoke = close the port + mark the grant; the app sees `{err:'REVOKED', grant: GrantId}` — a distinct state, never a spoofable generic failure. The `efs.*` object is a typed veneer over ports; TS types + runtime validators generated from one IDL.

**Deep attenuation membrane.** Any capability-bearing value returned *through* a grant is auto-minted as a child grant under the same scope and lifecycle: listing a picker-granted folder yields `FileHandle`s that are children of the folder grant; revoking the folder severs them all. Plain data crosses as structured clone, `harden()`ed at the veneer. Nothing crosses the boundary unwrapped — or confinement dies on the first nested object. **[research-grounded]**

**Persisted grants (Sandstorm rule).** At shutdown, live grants serialize to sealed tokens in the encrypted journal (Tier B). Restore **re-evaluates, never rehydrates**: same manifestHash (else the update ran under old grants or blocked per F4)? parent chain intact? policy/deny facts still permit? not expired/decayed? Only then is a fresh port minted. Decay is real: picker grants default to `session` or `30d` unless the user picks "keep"; Chrome's notification auto-revoke is the precedent that permissions must rot.

### App manifests — CML tri-partition

```jsonc
// efs-app.json5 → compiled to canonical CBOR → manifestHash (part of app identity)
{
  program: { runner: "ses-worker@1", entry: "app.js" },          // opaque to Kernel; owned by the runner
  use: [                                                          // capability CEILINGS, not grants
    { type: "fs.subtree", access: "rw", rationale: "your project files" },  // NO path — pickers supply designation
    { type: "endpoint.rpc", chains: ["eip155:1"], rationale: "reads ENS names" },
    { type: "render.surface" },
    { type: "storage.kv", quota: "50MB" },
    { type: "worker.spawn", max: 4 },
  ],
  config: {                                                       // typed, closed type set, validated pre-launch
    theme: { type: "string", maxSize: 32, mutability: ["shell"] },
  },
  facets: { locales: ["en","de"], actionCatalog: [/* agent actions */], handlesTypes: [/* open-with */] },
}
```

Rules: `use` is the ceiling — grants never exceed it, and most `use` entries are *dormant* until a picker or ceremony instantiates them (zero-power install: everything runnable with zero grants). `rationale` strings render verbatim in pickers — lying in them is a deny-fact offense. v1 deliberately **omits** `children`/`offer`/`expose` (Fuchsia's migration tax says get the manifest right once; sub-realm composition is additive later) — intra-app composition is `efs.worker.spawn`. App identity = (author identity, app-root record, **manifestHash**); version = package content hash; a manifest change is an identity-relevant event and always shows in the update wiring diff. **[research-grounded]**

### Resolvers and runners as Kernel capabilities

Fuchsia-shaped, exactly: `Resolver.resolve(url) → (manifestDecl, closureRootHandle)` — always the atomic **pair at one pinned root**, never bare bytes, never per-record lens resolution that could mix versions (a partial-upgrade app is a security hazard, not a freshness nuance — efsv2 gap flagged below).

| Resolver | Scheme | Trust posture |
|---|---|---|
| installed | `installed://<packageHash>` | local content store; offline; the only auto-executable tier |
| efs | `web3://…` per [[read-lens-spec]] §6.5 | lens-resolved discovery; GATE consumption rules (§3.3) apply mechanically; grade gates executability |
| ipfs | `ipfs://<cid>` | content-addressed fetch through the broker; verify-then-store |
| dev | `dev://localhost:<port>` | developer environment only; Shell banner "DEV APP — unverified, live-reloading" |

| Runner | Executes | Notes |
|---|---|---|
| `ses-worker@1` | default Ring-3 cage | receives Start(resolvedURL, program block, granted ports, controller) |
| `render-service@1` | document-mode bytes | never receives capability ports |
| `wasm-component` | candidate under research | test WIT/components and selective WASI against core Wasm, JS/SES, .NET, and compatibility lanes; no version or browser adapter selected |

Which resolvers/runners a collection sees is **environment policy** (auto-propagating, Fuchsia's two-channel insight: infrastructure flows implicitly, authority explicitly). Production collections get content-addressed resolvers only; `dev://` exists solely in the developer environment.

**Research status (2026-07-22; not a ruling).** This runner table is a candidate model. [[fable-third-party-app-model-handoff]] asks Fable to compare the present SES Worker and Surface IR assumptions with core Wasm, WebAssembly Components/WIT, .NET/Blazor variants, constrained hypermedia, iframe compatibility, and other models. No runner, IDL, WASI profile, framework, or rendering protocol is selected.

### Collections — instance classes and capability floors

| Collection | Durability | Environment | Floor (granted to every member) | Above the floor |
|---|---|---|---|---|
| `user-apps` | transient | installed + efs + ipfs | render.surface, storage.kv (quota), efs.meta, crypto pure fns, LocaleHandle (coarse), persona id | pickers + ceremonies only |
| `system-services` | persistent | installed only (rides the generation) | floor + **named admin capabilities** with loudest receipts | enumerated in the closure manifest; broadening shows in the generation wiring diff |
| `agent-sessions` | single-run | installed only | plan-scoped grants (`origin:'plan'`) + mandatory budget meters | never render.surface (agent UI is Chrome-owned); trifecta invariant checked statically |

### The `efs.*` re-cut — verdicts on the 2026-05-26 surface

Verdicts: **dies** (removed outright) · **→ handle** (becomes a method on a picker/manifest-granted handle) · **→ ceremony** (System Chrome, Ring 1½) · **survives**.

| v1-brainstorm call | Verdict | v2 shape |
|---|---|---|
| `fs.read/stat/list/resolve(path)` | **dies** as path+glob-scoped API | methods on `FileHandle`/`FolderHandle` from pickers; `efs.fs.read:/*` grants cannot exist; every result carries its read grade |
| `fs.watch` | → handle | `handle.watch()` under a background-wakeup budget |
| `fs.write/placeAt/unplace(path)` | → handle | writes on writable handles enqueue **journal drafts** (pending-state ladder); no per-write prompts; authority was the picker |
| `fs.mkdir` | → handle | TAGDEF creation is permanent → elevated per-record risk class at the signing checkpoint |
| `attestations.get/query` | → handle | `efs.records` on a `RecordsHandle` (kinds are TAGDEF/DATA/LIST/PIN/TAG now — EAS vocabulary dies); rate-limited; venue-graded |
| `attestations.write/multiWrite` | **dies** | no generic record writes; typed intents through handles into the outbox |
| `attestations.revoke` | → handle→outbox | "withdraw placement" op; own risk class; two-worlds copy mandatory |
| `attestations.subscribe` | → handle | watch on `RecordsHandle`, budgeted |
| `attestations.simulate` | survives | `efs.outbox.dryRun()` — local, free, honest via deterministic client-computable ids |
| `wallet.getAddress` | **dies** | `efs.persona.id()` returns the app's burner author; primary-identity disclosure = **ceremony** |
| `wallet.sign` | **dies** | no generic signing in Ring 3, ever; signing is the System Chrome checkpoint |
| `wallet.sendTransaction` | **dies** | thesis ruling: EFS-shaped writes only |
| `wallet.attest` / `getBalance` | **dies** | folded into outbox; `efs.outbox.budget()` reports persona budget, not wallet wealth |
| `wallet.switchIdentity` | **dies** | Shell-only, as the brainstorm suspected |
| `network.fetch:<origin>` | **dies** as manifest origin-allowlist | `EndpointHandle` from the **endpoint picker**, typed (rpc/gateway/http-origin), privacy-class labeled (self-hosted/relayed/trusted-paid/public-observed) |
| `network.fetchMirror/ipfsGet` | fold into read path | handles return bytes only after envelope/CID verification; unverified bytes never cross the membrane |
| `network.broadcastTx` | **dies** | the outbox owns submission |
| `network.subscribeChain` | → handle | attenuated subscription on `EndpointHandle`, budgeted |
| `network.estimateGas` | **dies** | outbox planning surfaces cost in the checkpoint preview |
| `storage.get/set/delete/list/quota` | survives | scoped KV; quota first-class; migrations = open question |
| `storage.openShared` | **dies** | replaced by the inter-app channel grant (below) |
| `ui.confirm` | **dies** | apps never invoke system-looking modals — the mimicry surface the Snaps audits warn about; in-surface confirmation is app UI; anything with authority is a ceremony |
| `ui.notify` | survives | Shell-mediated, rate-limited, app-attributed toast/notification |
| `ui.pickFile/pickSavePath` | **promoted** | pickers ARE the permission system; return handles, never path strings |
| `ui.openWindow` | → handle | `efs.surface.request({role})`; Shell owns placement |
| `ui.requestFocus` | survives | heavily rate-limited |
| `ui.theme` | **dies** as API | tokens flow through surface mode automatically |
| `ui.clipboard write / read` | gesture-gated handle / **ceremony** | read is a Shell paste-picker (user designates the paste), never ambient |
| `events.on/emit/poll` (generic bus) | **dies** | covert channel + telemetry; per-handle `watch` + a small system signal set (lifecycle freeze/resume, coarse locale change) |
| `events.onWalletChange` | **dies** | meaningless under personas in Ring 3 |
| `lens.current/resolveAt/compose/diff` | → handle | read facet on `LensHandle`, attenuated to the view the app was granted (full trust-list disclosure is fingerprint-budgeted) [open] |
| `lens.propose` | → **ceremony** | highest consent tier — a bad lens poisons every path (brainstorm Q10 answered: yes, own tier) |
| `crypto.hash/verify` | survives | endowed pure functions, no grant |
| `crypto.encryptFor` / `decryptFromMe` | handle / **ceremony** | decrypt asks the Kernel to wield the user's key — prompted, previewed |
| `efs.meta.*` | survives verbatim | `request()` is user-gesture-gated + rate-limited (prompt-spam kill) |
| — new | — | `efs.worker.spawn`, `efs.surface`, `efs.outbox`, `efs.locale` (LocaleHandle), `efs.persona` |

Net: the brainstorm's ~50 permission strings collapse to **zero string permissions**. What remains is handles (designation = authorization), ceremonies (signing checkpoint, identity disclosure, lens change, decrypt, clipboard read), and a floor small enough to audit on one screen. The brainstorm's own prediction — "30–50% collapse" — undershot. **[reasoned]**

### Workers within apps

`efs.worker.spawn(entryHash, { grants: GrantId[], attenuate?: Attenuation[] })` — the child is a new blob-Worker in the same cage class (same CSP inheritance, own Compartment), and receives **only the explicitly named, further-attenuated subset** of the parent's grants, minted as child grants (delegation chain in the table). Nothing is inherited implicitly. Child render access is only via a `slot` node in the parent's surface. Kill/revoke cascades down the chain; children count against the parent's quota and `use.worker.spawn.max`. This is the CML `children` block deferred into a runtime capability. **[research-grounded]**

### Inter-app communication

**Default-deny.** No shared storage, no broadcast bus, no direct ports. Establishment: app A calls `efs.channel.request({protocol: "efs.share.v1", to?: appId})`; the Shell mediates — explicit target (petname-rendered consent) or type-routed via the chooser with verified-handler policy (declaration ≠ default; type-author endorsement or user choice wins — the Android implicit-intent autopsy, done right from day one). The Kernel then mints a **relayed** channel: caretaker in the middle, both directions. We deliberately diverge from Genode's "policy at setup, direct at use" here: relaying is what makes capability *transfer* mediated — a capability port posted through a channel is intercepted and re-minted as a recorded delegation (or blocked by policy), never smuggled raw between principals. The relay hop is the price of a coherent capability ledger; app↔Kernel traffic stays direct. Channels are metered, pausable, and both apps' manifests must declare the channel ceiling. **[reasoned]** on always-relaying; the hijack evidence is grounded.

### Quota and rate limits — first-class

Every grant carries meters, not vibes: invocations/s, bytes in/out, storage bytes, background wakeups, watch subscriptions, surface nodes + patch/signal rates, outbox draft count, per-persona gas budget, channel messages/s. Defaults per collection class; ceilings in the manifest; overruns **pause the grant with a visible state** ("Photos hit its network budget — Resume / Raise / Revoke") and a receipt — never silent throttling, never silent kill. Quota state is queryable (`efs.meta.granted()` includes meter readings) so honest apps degrade before they're paused. Most of the brainstorm's per-call "Risk:" entries were quota problems; this section retires them as a class.

### The aggregation tier, named honestly

Some components legitimately need broad authority; pretending otherwise breeds unaudited super-apps. They are **system services** (their own collection), never peers with big grants:

| Service | Admin capabilities | Receipt posture |
|---|---|---|
| Files | `fs.root-rw` over the user's namespace | every cross-subtree op receipted; bulk ops summarized at checkpoint |
| Sync / venue courier | `outbox.flush`, all granted endpoints, freshness beacons | Sync Center is its receipt surface; flush events labeled per venue |
| Agent runner | spawn `agent-sessions`, plan compiler, budget enforcement | plans + receipts are its primary UI; loudest tier |
| Index/search | `records.query` unbounded, local index write | queries logged locally; no network capability at all |

Admin capabilities are enumerated in the closure manifest, snapshot with the capability table, and appear in a dedicated "System power" panel of the permission center. "First-party" is never a substitute for a named grant. **[research-grounded]** (Genode structure; capability-os lesson 4.)

### Agent lens

Agent sessions are ordinary principals in the same table with three deltas: (1) every grant has `origin:'plan'` — minted at plan approval, dying at session end (single-run collection); untrusted content can fill declared data slots but cannot mint, widen, or reorder grants (CaMeL shape). (2) The **lethal-trifecta check is a static query over the capability table**: no agent session may simultaneously hold private-data reads, untrusted-content ingestion, and an external endpoint without break-glass chrome — the Kernel refuses to mint the third leg. (3) Agents get no render surface; their visible existence is Chrome-owned (plan, dry-run, receipts). Because surface mode is declarative, an agent *reading* an app's UI reads the same tree users see — no scraping divergence, no hidden-DOM prompt injection surface. Action catalogs come from manifest `facets` (root authority); MCP/A2A surfaces are generated exhaust. Agents enqueue into the same outbox; T3/T5 checkpoints are never satisfiable by an agent alone.

### Honesty obligations

- **Grades ride the membrane.** Every read crossing a handle carries `{grade, venue, asOf}`; the veneer's types make grade-stripping a type error; grade-bearing UI components resolve through the Kernel, so apps cannot forge honesty chrome (truth-trap: no green checkmarks an app can paint).
- **"Not permitted to look" ≠ "not found."** A read failing for want of a transport capability returns `UNKNOWN` with a client-side `NO-TRANSPORT` cause attached ([[boot-and-profiles]] §6: a presentation state over the UNKNOWN grade — the grade set is closed, and a protocol-level qualifier is pending pressure-report P3, not an existing API) — distinct from venue-answered UNKNOWN and from `PROVEN-ABSENT`; pickers offer the fix ("grant an endpoint"), the grade never lies.
- **Revocation ≠ undo, ever, in copy.** Revoking a grant stops future use; it does not retract signed envelopes or chain records. Grant-revocation receipts state what was already durably written; REVOKE-the-record is "withdraw placement," a different verb on a different surface.
- **The table is the truth and the user can read it.** Permission center renders the live capability table (Sculpt's inspectable graph); the install/update diff is the same artifact; an opaque routing policy would be ACLs with extra steps.
- **Denials and pauses are events with receipts,** not silent failures apps can misnarrate to users.

## Open questions

- [ ] **CSP asymmetry pin:** verify real-URL same-origin workers do NOT inherit page CSP on Safari/Firefox/Chromium (wpt-grade tests); decide default lane vs cradle-iframe fallback per engine. [open]
- [ ] Surface-mode schema: this bespoke tree vs subset-of-HTML vs existing declarative IDL — shares the thesis's open question; prototype ADR in the client repo owns it. [open]
- [ ] Timing/covert channels: coarsen `performance.now`/`Date.now` endowments in Ring-3 compartments (and does COOP/COEP absence on the static lane change the calculus)? [open]
- [ ] `LensHandle` disclosure: view-scoped facet vs full trust-list read — interacts with the F10 fingerprint budget. [open]
- [ ] `storage.kv` schema migrations on app update (brainstorm Q13): app-owned with a version key, or OS-brokered? [reasoned] lean: app-owned + `configVersion` in manifest.
- [x] Conflict with thesis F1 wording: F1's baseline reads as one page-level CSP for Kernel and apps alike; this doc rules the asymmetry + `worker-src 'self'` addition. Amend F1 or adopt the cradle as primary? — resolved by [[web-os-thesis]] Amendment 1 (2026-07-07)
- [ ] Conflict with capability-os digest rec (Genode "direct at use"): this doc relays all inter-app channels through the Kernel forever. Accept the perf cost, or allow direct pairs for high-bandwidth same-user apps after explicit ceremony?
- [ ] efsv2 gaps (also filed for the pressure report): grant/receipt record reserved-key schema; handler-binding record shape lenses can grade; atomic resolve-closure-at-root operation; `NO-TRANSPORT` qualifier; grade→executability normative table; protocol-visible delegation credential (personas indistinguishable on-chain).

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain checked ([[web-os-thesis]] rulings unamended, or amendments cross-linked)
- [ ] No `AGENT-Q` comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
