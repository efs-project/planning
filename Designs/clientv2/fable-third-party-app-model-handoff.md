# Fable handoff — future-proof third-party app model

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[kernel-capability-model]], [[sdk-boundaries]], [[fable-client-v2-handoff]]
**Supersedes:** —
**Reviewers:** 3 expert critique lanes, 2026-07-22
**Last touched:** 2026-07-22 — codex-gpt-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/clientv2 #topic/app-model #topic/wasm #topic/wasi

## What this is

This is a deep-research handoff for Fable, not an architecture ruling. James explicitly does **not** want EFS to choose a runner, ABI, UI system, framework, or WASI version yet. The job is to find the safest, most durable, most useful third-party application model for EFS OS and to show the evidence behind that recommendation.

The current Worker/capability/Surface-IR model is a hypothesis too. Fable may preserve it, recut it, combine it with another model, or reject it if the evidence supports that result.

## The product problem

EFS OS needs third-party apps that can be useful, expressive, offline-capable, inspectable, and safe around user data and signing authority. It would be valuable if apps could be written in more than JavaScript and later run outside a browser, but those are benefits to measure rather than assumptions to encode prematurely.

The research must distinguish requirements from candidate mechanisms.

### Requirements to validate

- Third-party code is untrusted and receives no ambient EFS data, identity, wallet, signing, or network authority.
- Apps and their full dependency closures can be content-addressed, verified, cached, reproduced, used offline, rolled back, and inspected.
- The OS can revoke capabilities, stop runaway work, recover crashed apps, bound resources, and explain failures honestly.
- App UI can meet accessibility, localization, input/IME, focus, mobile, and performance needs.
- The model is pleasant enough that developers will actually build good apps.
- Versioning and migration do not make today's browser/toolchain adapter tomorrow's permanent ABI.
- Future native or non-browser hosting is desirable, but not at the cost of an unusable browser product.

Fable should challenge any requirement that accidentally encodes a proposed implementation.

## Separate the layers before comparing stacks

Do not compare “Blazor vs HTMX vs WASI” as if they occupy the same layer. Every candidate architecture must state its choice for:

1. **Authoring model:** Razor, TypeScript components, Rust, C#, declarative hypermedia, generated DSL, or another developer-facing model.
2. **Execution runtime:** SES/JavaScript Worker, core Wasm, Component Model host, .NET Wasm, isolated iframe, native host, or a combination.
3. **Semantic app API:** capability handles, lifecycle, errors, streams, storage, actions, and revocation rules.
4. **Interface/wire description:** TypeScript schema, WIT, JSON Schema, Smithy-like IDL, EFS-owned schema, or generated adapters.
5. **Rendering ownership:** app-owned DOM, OS-owned DOM from typed operations, constrained hypermedia, component catalog, canvas/display list, or multiple lanes.
6. **Security boundary:** what actually prevents DOM, network, storage, identity, and wallet access; what merely improves portability or typing.
7. **Packaging and compatibility:** closure format, shared runtimes, version negotiation, adapters, migration, and deprecation.

## Candidate families — none selected

Fable should research broadly, then narrow to three to five coherent architectures. At minimum compare:

| Candidate family | Strongest case | Main concern to investigate |
|---|---|---|
| SES/JavaScript Worker + typed OS surface | Mature browser path, small apps, natural MessagePort capabilities | JavaScript focus; SES/CSP/browser limits; ambient Worker APIs must still be removed or mediated |
| Core Wasm + small EFS-owned ABI | Mature browser execution and tight host control | EFS must invent async, resources, bindings, evolution, and good multi-language ergonomics |
| WebAssembly Components + WIT, with selective or no generic WASI | Typed language-neutral boundaries and resource handles may fit object capabilities | Component Model/browser tooling maturity, adapter churn, size, copies, interruption, and language support are unproven |
| Dual JS and Component runners over one semantic contract | Practical JS path now with a credible component future | Two implementations can drift and double conformance/security work |
| Sandboxed opaque-origin iframe compatibility lane | Existing web frameworks, DOM, accessibility ecosystem, and complex UI | Much broader attack/privacy surface and weaker OS control over trusted rendering |
| Blazor/Razor custom adapter | Productive C# component model and mature .NET tooling | Ordinary Blazor owns the DOM/UI thread; a custom renderer relies on unstable internals and adds runtime cost |
| Plain .NET Worker + EFS-native C# UI DSL | Reuses C# logic/tooling without pretending ordinary Blazor fits | Still ships a .NET runtime; EFS owns another framework and bindings surface |
| C# NativeAOT component | C# without a full interactive Blazor runtime | Young component toolchain and reduced framework/library compatibility |
| HTMX-inspired constrained hypermedia → OS renderer | Simple event/action/fragment mental model with OS-owned pixels | EFS must define a safe closed vocabulary, state/resync rules, and component catalog |
| Literal HTMX/HTML swaps | Huge open-web familiarity and low authoring ceremony | DOM, CSS selectors, URLs, HTML parsing, scripts, and swaps conflict with a Worker and trusted compositor; use mainly as a control/adversarial baseline |
| Local LiveView-style Worker loop | Clear event → state → patch model without a server | Patch protocol, latency, recovery, focus, and client-local state ownership need proof |
| RemoteViews/A2UI-style component catalog | Strong host control, a11y, and predictable rendering | Catalog ossification and limited app expressiveness |
| Canvas/display-list lane | Appropriate for games, visualization, and custom graphics | Accessibility, text/input, battery, and spoofing make it unsuitable as the only UI lane |
| WebContainers or embedded language runtimes | Familiar ecosystems and strong developer tooling | Excessive authority/complexity, vendor or browser constraints, large closures, and hard containment |

Also investigate relevant models we missed: browser extension sandboxes, Isolated Web Apps, Web Components, Fuchsia runners, Android RemoteViews/Glance, Apple App Extensions, Flatpak portals, Sandstorm powerboxes, Extism, Spin, Fermyon, Wasmtime, WasmEdge, WAMR, QuickJS, and emerging agent UI protocols. Inclusion here is not endorsement.

## Promising hypotheses to test, not conclusions

- WIT resources may map cleanly to EFS capability handles, but a resource type is not an implementation of external revocation, leases, crash cleanup, or idempotency.
- The Component Model may become a durable multi-language boundary, but it has no native browser implementation today and its 1.0 path still includes ABI work. `jco` is useful experiment tooling, not a permanent dependency assumption.
- WASI 0.3 native async/streams/futures may solve real composition problems, but its June 2026 release is too new to declare the EFS compatibility floor.
- A Worker removes DOM access, but it still has ambient browser APIs such as network and storage unless the cage actually denies or replaces them. “Worker” is not synonymous with least authority.
- Ordinary Blazor WebAssembly renders on the browser UI thread. Running .NET compute in a Worker is supported; running Razor against a custom non-DOM renderer is a separate experimental architecture that must earn its maintenance and payload cost.
- Literal HTMX is DOM-, selector-, URL-, and HTML-swap-oriented. Its hypermedia ideas may still inspire a closed local protocol using action handles, typed nodes, opaque resources, and validated revisioned patches.
- OS-owned rendering may improve security, accessibility, and consistency, but a home-grown Surface IR or component catalog can become an inflexible lowest common denominator.
- A compatibility iframe may be strategically valuable even if it is never the high-trust lane.
- Multiple runners may preserve optionality, or may create permanent complexity and semantic drift. Compare that cost with choosing one narrow substrate.

## Required research method

Use current primary sources, shipped code, and reproducible experiments. For every important claim, label:

- **Exists now:** interoperable enough to depend on in target browsers and toolchains.
- **Emerging:** credible direction with material compatibility or stability risk.
- **EFS invention:** something we would own, secure, document, and maintain.

For each candidate provide its strongest case, strongest objection, hidden centralization/vendor dependency, funding or business-model pressure where relevant, open-source/governance posture, likely five-year failure mode, and explicit evidence that would change the conclusion.

Do not optimize for standards elegance alone. Evaluate developer adoption, useful applications, operational burden, and the cypherpunk requirement that the user can verify, fork, cache, and run the system without a mandatory operator.

## One comparable prototype workload

Build or precisely specify the same **playable archive** app across the finalists. It must be demanding enough to expose false simplicity:

- asynchronous archive/package loading and cancellation;
- search, forms, validation, selection, and keyboard navigation;
- a large virtualized list/tree with thumbnails or media;
- drag/drop or an equivalent complex interaction;
- capability grant, active-call revocation, and denied/revoked states;
- suspend, terminate, restart, restore, offline boot, and protocol resync;
- errors, backpressure, localization, bidirectional identifiers, mobile input, and screen-reader behavior;
- at least 15–20 ordinary components plus one graphics-heavy surface.

Minimum implementations after research narrows the field:

1. the best lightweight JavaScript/Worker design;
2. core Wasm or Component Model/WIT, whichever is most credible;
3. the best C#/.NET path, separating Blazor from plain .NET or NativeAOT where necessary;
4. the best OS-rendered hypermedia/Surface approach;
5. an opaque-origin iframe compatibility control if it survives threat review.

Fable may reduce implementation count if it supplies strong kill evidence and a cheaper experiment that answers the same question.

## Measurements and adversarial tests

Measure raw and Brotli closure size; shared versus per-app storage; cold/warm start; first surface and interactive time; 1/5/10-app memory; event/patch latency and bytes; CPU/battery; boundary throughput and copying; deterministic builds; update/migration cost; and Chromium, Firefox, desktop Safari, and real iOS Safari behavior.

Test termination and recovery under infinite loops, memory/table growth, compile bombs, handle leaks, patch floods, oversized/deep trees, stream backpressure, runtime crashes, and capability revocation during active calls.

Attempt to reach every ungranted ambient power: DOM, fetch/XHR/WebSocket, origin storage, service workers, dynamic imports, timers/high-resolution clocks, randomness, clipboard, device APIs, identity, wallet, and cross-app state.

For rendered protocols test XSS/mXSS, SVG/MathML, script/event attributes, URL loads, CSS/selector escape, out-of-bounds targets, replayed/out-of-order patches, focus theft, deceptive system prompts, ARIA spam, forged user gestures, excessive event data, and version-skew resync. Test screen readers, keyboard-only use, zoom, reduced motion, high contrast, IME, RTL, and mobile touch as product behavior, not just schema validity.

## Deliverables for the design round

Fable should return:

1. A dated landscape/evidence matrix separating current, emerging, and EFS-invented pieces.
2. Three to five complete candidate architectures, each covering all seven layers above.
3. A threat model and ambient-authority audit for each finalist.
4. Prototype and benchmark results, or a precise executable experiment plan where tooling blocks implementation.
5. A developer-experience comparison using the same app and common debugging/update workflows.
6. A decision tree with kill criteria, confidence levels, reversible choices, and choices that would become expensive ABI commitments.
7. A recommendation, a fallback, and a migration story—plus the strongest argument against the recommendation.
8. A short “do not decide yet” list for volatile standards and tooling.

## Explicit non-decisions

This handoff does **not** select:

- WASM-first or WASM-only;
- WIT or any other canonical IDL;
- WASI 0.2, WASI 0.3, or generic WASI imports;
- `jco`, a browser component engine, or a native runtime;
- Blazor, Razor, .NET Worker, NativeAOT, HTMX, or another framework;
- Surface IR, hypermedia fragments, a component catalog, app-owned DOM, or iframe rendering;
- one runner or multiple runners;
- a promise that the same binary will run unchanged in future native hosts.

These are research questions for Fable and evidence spikes, not choices James needs to answer now.

## Seed evidence, not the research corpus

- Official .NET documentation distinguishes ordinary Blazor WebAssembly rendering on the UI thread from .NET compute running in a Web Worker.
- Official HTMX documentation defines its model around DOM elements, HTTP/AJAX, HTML responses, selectors, and swaps.
- WASI 0.3 shipped native async/streams/futures in June 2026, while the Component Model's path to 1.0 still requires native support from at least two browser engines.
- `jco` can transpile components for JavaScript environments, but its documentation still labels the project experimental without stability, security, or support guarantees.

Fable should verify these and all other material claims against current primary sources when the round begins.

The earlier [[2026-07-10-cypherpunk-os-state-of-art-and-coherence-audit]] recommends a canonical WIT/WASI app ABI. Treat that recommendation as valuable historical input, not an adopted EFS decision; this round must retest its assumptions against the alternatives and newer evidence.

## Pre-promotion checklist

- [ ] Fable research completed and linked
- [ ] Candidate architectures compared with the same workload
- [ ] Threat and accessibility tests completed or blocked with named evidence
- [ ] Recommendation separates reversible implementation from durable ABI commitments
- [ ] James has reviewed any resulting owner-level choice
