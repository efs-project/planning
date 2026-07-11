# Spike 1 — the cross-browser cage matrix

**Status:** draft
**Target repos:** client
**Depends on:** [[web-os-thesis]], [[kernel-capability-model]]
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/spec #repo/client

## Goal

Prove — or disprove — that the **SES-in-Worker + CSP cage** denies network egress airtight across every engine we must ship on, and that the **Kernel CSP-asymmetry** (page at `connect-src 'none'`, Kernel as a real-URL worker with its own policy, Ring-3 apps as `blob:` workers that inherit the denial — thesis Amendment 1) is real and not a Chromium-only artifact. This is the single assumption F1 and F2 sit on: if a Ring-3 `blob:` worker can open *any* scripted network channel on *any* target engine, apps-own-no-pixels does not buy confinement and F1 must be re-cut (cradle-iframe primary, or Kernel-placement rethink). The exit artifact is a filled behavior table + a chosen per-engine lane + a go/no-go for F1/F2.

## Method

Build one tiny static harness (no server, no headers — the header-less IPFS lane is the hard case; if it holds, hosted-with-headers trivially holds too). Serve it three ways to cover delivery variance: (a) `file://`-adjacent local static server with **zero** CSP/COOP/COEP/Permissions-Policy headers, meta-only; (b) an IPFS gateway (real `web3://`/gateway fetch, no custom headers); (c) hosted-with-headers control, to confirm the asymmetry degrades correctly when real headers exist. Each cell is a scripted assertion that logs `DENIED` / `ALLOWED` / `ERROR` / `N/A` to an on-page results grid *and* to a copy-paste JSON blob (workers can't touch the DOM — they `postMessage` results to the page harness, which is also the point being tested). Run every cell on every engine; a human records the grid screenshot per engine because we do not trust a single self-report from code that is trying to prove a negative.

Egress is asserted **denied** three ways per vector, all required: (1) the call throws or the CSP violation event fires (`document`/`worker` `securitypolicyviolation`); (2) a co-located **listener endpoint** (a logging server on a distinct origin we control, plus a WebSocket echo, plus a STUN/TURN we run) records **zero** inbound hits after a 5s drain; (3) `performance.getEntriesByType('resource')` (page lane) / no network entry shows the request left. "Denied" means all three agree. A single inbound hit on the listener is a **hard fail** regardless of what the in-page assertion said — the listener is ground truth.

## Matrix

Rows = mechanisms/vectors; columns = engines. Engines: **Chrome desktop**, **Firefox desktop**, **Safari desktop**, **iOS WebKit** (real device or Simulator — iOS Safari + a WKWebView shell, both, since home-screen PWA is the persistence lane), **Chrome Android** (Galaxy-A24-class). Every cell asserts the denial/behavior and records `PASS` (denial holds) / `FAIL` (egress or wrong inheritance) / `N/A`.

| # | Mechanism / vector to test | Chrome | Firefox | Safari | iOS WebKit | Chrome Android |
|---|---|---|---|---|---|---|
| A | **blob-worker inherits page CSP** — spawn Ring-3 worker from `blob:`; page meta = `connect-src 'none'`; worker attempts `fetch(listener)` → must throw/violate | | | | | |
| B | **real-URL Kernel worker keeps OWN CSP** — Kernel worker served (meta-less on static lane) attempts `fetch(listener)` → must **succeed** (asymmetry confirmed: it did NOT inherit page `'none'`) | | | | | |
| C | **real-URL worker does NOT inherit page CSP** (the inverse of B, stated as the risk) — if C shows the Kernel worker *inheriting* page `'none'`, the asymmetry is false on this engine → cradle lane forced | | | | | |
| D | worker `fetch()` / `fetchLater()` denied under `connect-src 'none'` | | | | | |
| E | worker `XMLHttpRequest` (sync + async) denied | | | | | |
| F | worker `WebSocket` denied (note `'self'`≠ws in some engines — test with `'none'`) | | | | | |
| G | worker `EventSource` (SSE) denied | | | | | |
| H | worker `WebTransport` denied | | | | | |
| I | worker `navigator.sendBeacon` denied | | | | | |
| J | worker `importScripts(remote)` denied under `script-src 'self' blob:` | | | | | |
| K | worker nested `new Worker(remote)` denied under `worker-src 'self' blob:` | | | | | |
| L | **worker structurally lacks WebRTC** — `typeof RTCPeerConnection === 'undefined'` in worker scope | | | | | |
| M | **worker structurally lacks navigation/window** — `typeof location.assign`, `typeof window`, `open` all absent/inert | | | | | |
| N | **postMessage-to-Kernel is the ONLY channel** — with all above denied, worker→Kernel port still works; no other object reaches out | | | | | |
| O | **cradle-iframe fallback** — per-app `sandbox="allow-scripts"` (opaque origin, no `allow-same-origin`) iframe, meta-CSP denial, spawns the app blob-worker *inside itself*; repeat D–N from within the cradle | | | | | |
| P | **Permissions-Policy device strip** — `camera/microphone/geolocation/usb/serial/hid/display-capture` unavailable in worker + in render-service iframe (`allow=""`); assert getters throw/undefined | | | | | |
| Q | **COOP/COEP require-corp** — `self.crossOriginIsolated === true` achievable meta+SW-injected (coi-serviceworker); note Safari has **no `credentialless`** — confirm `require-corp`+CORP path works | | | | | |
| R | **Trusted Types single-sink** — `require-trusted-types-for 'script'` enforced in the Shell renderer; on older Safari confirm graceful degrade to hardening-absent (reconciler still one sink) | | | | | |
| S | **meta-tag directive limits** — confirm `connect-src`/`script-src`/`worker-src`/`img-src` enforce via `<meta>`; confirm `frame-ancestors`/`sandbox`/`report-uri` do **not** (must ride header/attribute) — so nothing security-load-bearing depends on a meta-only directive that no-ops | | | | | |
| T | **render-service iframe self-navigation leak** (control, expected FAIL-by-design) — a DOM iframe *can* `location = listener?secret`; confirms why app logic must never live in the iframe lane | | | | | |

## Harness spec

- `index.html` — the OS-page stand-in. Ships meta CSP `default-src 'none'; connect-src 'none'; script-src 'self' blob:; worker-src 'self' blob:; img-src blob: data:; style-src 'self'; frame-src blob:; form-action 'none'; base-uri 'none'; object-src 'none'`. Boots the harness runner, spawns workers, renders the results grid, emits the JSON blob.
- `kernel-worker.js` — a **real URL** worker (the asymmetry subject). Runs cell B/C. Its only legitimate job in prod is the broker; here it just attempts egress and reports.
- `app-blob-worker` — built from a `Blob([...],{type:'text/javascript'})` + `URL.createObjectURL`; runs cells A, D–N. Also reused inside the cradle for cell O.
- `cradle.html` — the fallback iframe document (opaque origin via `sandbox="allow-scripts"`), meta-CSP = denial baseline, spawns the app blob-worker.
- `listener/` — **out-of-band ground truth**, run on distinct origins we own: an HTTP logger (any method, logs + returns), a WS echo, an SSE endpoint, a WebTransport endpoint, and a STUN/TURN (coturn) for the WebRTC control. A cell is only `PASS` if the listener logs **zero** hits for that vector.
- Runner asserts each vector with a 5s drain before reading the listener; screenshots the grid per engine; exports JSON keyed `{engine, cell, verdict, evidence}`.

## Setup & run procedure

Time-box: ~3 days (1 build, 1.5 run-across-engines, 0.5 write-up). Steps:

1. Stand up the `listener/` origins (coturn for STUN/TURN; a Node/Deno logger for HTTP/WS/SSE/WebTransport) on a **different registrable domain** than the harness, so any hit is unambiguously cross-origin egress. Record their URLs into `listener-config.json` the harness imports.
2. Build the harness (`index.html`, `kernel-worker.js`, the blob-worker factory, `cradle.html`, runner). Verify locally on Chrome first — get a fully green/expected grid on one engine before fanning out, so a FAIL elsewhere is an engine difference, not a harness bug.
3. Serve three ways: (a) `python3 -m http.server` (zero headers, meta-only); (b) `ipfs add -r` the dir + open via a public gateway and via `web3://`; (c) a headered static host (the control). Run all cells on all three paths per engine.
4. Per engine: open, click **Run all**, wait for the 5s drain, screenshot the grid, export the JSON blob, then **cross-check every `PASS` against the listener logs** — the grid trusts in-page assertions; the listener is the arbiter. A grid `PASS` with a listener hit is overridden to `FAIL`.
5. Collate into one `results.json` keyed `{engine, version, deliveryPath, cell, verdict, evidence:{threw,violationEvent,listenerSilent}}`; the filled Matrix table + the chosen per-engine lane is the exit artifact.

## Measurements

Per cell: verdict (`PASS`/`FAIL`/`N/A`) + evidence triple (threw? violation event? listener-silent?). Plus two engine-level facts: does meta-only CSP enforce on this delivery path at all (kills the header-less lane if not), and does SW-injected COOP/COEP achieve cross-origin isolation without `credentialless` (Safari). Record engine + version + delivery path (a/b/c) for every run — blob semantics shift by version (Chrome 137 partitioned blob URLs), so the table is version-stamped, not evergreen.

## Pass-fail (per cell)

- **A, D–N PASS on all five engines** → the Worker cage is airtight for scripted egress on that engine. This is the core requirement.
- **L, M PASS everywhere** → the structural (non-CSP) closures hold; these should be invariant (worker scope has no such globals) — a FAIL here means an engine leaked a DOM/RTC API into worker scope and is a showstopper for that engine.
- **B PASS + C PASS everywhere** → the asymmetry is real: Kernel escapes, apps don't. This is the default-lane green light.
- **O PASS everywhere** → the cradle fallback works and is available if B/C fail on some engine.
- **Any listener hit on A or D–N = HARD FAIL** for that cell/engine regardless of in-page assertion.

## Decision-driven

| Outcome | Forces |
|---|---|
| A + D–N PASS all engines, B+C PASS all engines | **Default lane ships: `blob:`-worker apps + real-URL Kernel worker. F1/F2 GO.** No cradle needed at launch (keep O green as insurance). |
| B/C FAIL on engine X (real-URL worker *inherits* page `'none'`, so the Kernel can't fetch) | Kernel cannot live as a bare real-URL worker on X. **Options, in order:** (1) serve the Kernel worker an explicit permissive `connect-src` via header on X's delivery lane (drops the header-less guarantee for X only — acceptable if X is always hosted-with-headers); (2) move the Kernel's fetch into a **dedicated same-origin cradle** it controls; (3) if neither, **Kernel-placement rethink** — Kernel fetch moves to the main document (page can't be `connect-src 'none'` then; the whole cage model changes). Record which. |
| A FAIL on engine X (blob-worker does NOT inherit page denial → app has ambient network) | The `blob:`-worker lane is unsafe on X. **Cradle-iframe lane becomes mandatory on X** (cell O must PASS there). If O also fails on X, **X is unshippable for Ring-3 apps** until fixed — escalate; F1 is invalid on X. |
| D–N mixed FAILs (one vector leaks, e.g. WebTransport uncovered by an engine's `connect-src`) | Patch the baseline (add the missing directive / structural check) and re-run; if the vector is *structurally* uncoverable on X (as WebRTC is in DOM contexts), Ring-3 on X must use the Worker lane only (never the iframe) and we document the residual. |
| O FAIL broadly (cradle leaks) | We have **no fallback** if B/C or A fail anywhere — raises the stakes on the default lane and forces hosted-with-headers as the floor (no pure static/IPFS lane). |
| P FAIL (device capability reachable) | Permissions-Policy strip isn't holding; since the strip is header-only, confirm the structural fallback (workers lack these APIs) covers it; if a device API is reachable *from a worker* on X, that's a platform surprise — file + gate that capability behind explicit ceremony only. |
| Q FAIL on Safari/iOS (no cross-origin isolation without credentialless) | Accept: no `SharedArrayBuffer`/high-res timers on that engine (already the Safari-floor assumption); confirm nothing in the cage *depends* on `crossOriginIsolated` for its denial (it must not — denial is CSP+structure, not isolation). |
| S shows a load-bearing directive no-ops in meta on X | Anything security-critical that only rides meta must move to the header lane on X, shrinking the header-less/IPFS story for X — record it as an F11 self-trust-ladder caveat. |

### If Safari fails X (contingency column)

Safari/iOS is the declared floor, so a Safari-only failure is the likeliest and most consequential. Contingencies, per failing cell: **A/D–N fail on Safari** → cradle lane mandatory on WebKit (O must hold); if O also fails, WebKit Ring-3 apps ship only inside a hosted-with-headers origin (no static/IPFS lane on iOS) — a real product limit to surface to James. **B/C fail on Safari** → Kernel gets an explicit header lane on WebKit; the pure meta-less boot is Chromium/Firefox-only, WebKit needs one served header. **Q fail on Safari** → already expected (no `credentialless`); confirm-and-document, not a blocker. **R degrade on older Safari** → accept hardening-absent (single reconciler sink still holds). The rule: a Safari failure never silently downgrades other engines; it forks the delivery lane for WebKit only and is stated as an F11 residual.

## Contingencies

- **Listener sees a hit we can't attribute** — treat as FAIL, bisect vectors one-per-run until the leaking API is named; do not average it away.
- **Engine version skew** — re-run on the next stable of each engine before the ADR lands; blob/CSP behavior has shipped-then-changed (Chrome 137, navigate-to removal 2022). The table carries version stamps and an expiry ("re-verify each engine minor").
- **iOS home-screen PWA vs in-tab Safari differ** — run both; the persistence lane is home-screen, the first-load lane is in-tab, and their CSP/SW behavior can diverge.
- **coi-serviceworker COOP/COEP injection** conflicts with the content-addressed SW's integrity role — verify one SW can do both (inject isolation headers *and* fail-closed on non-CID bytes) or that they compose.

## Go / no-go for F1/F2

**GO** iff, on all five engines, at least one lane (default `blob:`-worker **or** cradle-iframe) makes cells A + D–N + L + M all PASS with zero listener hits, **and** the Kernel has a working egress placement (B/C green, or a header/cradle workaround recorded). Ship the per-engine lane table as the exit artifact; F1's "apps own no pixels, no ambient network" and F2's "worker boundary is modularity+crash-isolation, not an enclave" both stand on this result. **NO-GO** (and F1 re-cut required) iff any engine leaks scripted egress from Ring-3 in *both* lanes, or if the Kernel cannot be placed with page-level `connect-src 'none'` intact on an engine we must ship — either invalidates the airtight-cage claim the thesis calls "the only configuration the research found that can be made airtight."
