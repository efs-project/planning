# Spike 2 — surface-mode: render-as-capability, in practice

**Status:** draft
**Target repos:** client
**Depends on:** [[web-os-thesis]], [[kernel-capability-model]]
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/spec #repo/client

## Goal

Find out whether **apps-own-no-pixels + declarative surface-mode** (F1; the v0 node/signal/handler schema in [[kernel-capability-model]]) is *tolerable to build a real app in* and *cheap enough to drive live UI*. This is the biggest UX bet in the thesis: if surface mode is too expressive-poor or too slow, either the component catalog must grow large, an escape hatch is needed, or canvas-mode must become first-class much sooner. The exit artifact settles the open question both docs carry — "surface-mode UI schema: bespoke tree vs subset-of-HTML vs existing IDL, prototype before the OS SDK render vocabulary freezes." We resolve it with one real app, measured, not argued.

## Method

Build the **Files list view** — a genuine system surface, not a toy — end to end through the real boundary: app logic in a Worker emitting the v0 `SurfaceNode` tree + `patch`/`signal` ops over a `MessagePort`; a Shell-side reconciler applying them to compositor-owned DOM built from the **system component catalog** (Lit + Web Awesome). No shortcuts through shared DOM; the worker never touches an element. Wire at least one **high-frequency interaction** to exercise the signals lane (the diff-free high-frequency channel): a **live-filter text box** (keystroke → filtered list, target path) and a **drag-reorder** (pointer-move → live row reflow). Instrument both the boundary and the reconciler. Compare against a **control**: the same Files view written as an ordinary in-thread Lit app, to price the boilerplate/latency delta honestly.

The Files view is chosen deliberately: it needs a virtualized/long list, per-row `<efs-identifier>` + grade badge + pending-state chips (the honesty components that resolve through the Kernel, not the app), selection, context actions, rename-in-place (a text input round-trip), sort, and the two high-frequency interactions above. If surface mode can express Files comfortably, it covers the ~90% of apps the kernel doc claims for it; where Files *strains*, that strain is the finding.

## Build

1. **Worker side (the app):** `files-app.worker.js`, SES-locked, endowed only with a mock `efs.fs` handle (canned tree of ~2,000 entries, each with grade/venue/pending fields) + `efs.surface`. Emits `surface.mount(root, nodes)`, then `surface.patch(...)` on model changes, and `surface.signal(id, value)` for the live-filter query string and the drag delta. Receives inbound `{handler, event}` plain-data events (click, input, pointermove, drop). No framework inside — hand-written against the v0 schema, so we feel the raw ergonomics.
2. **Shell side (the reconciler):** `surface-reconciler.ts` — retained tree per surface; `patch` ops schema-validated then applied to real DOM built from catalog components (`<wa-*>` / `<efs-*>`); **prop bindings compiled to a per-surface signal graph** so `signal()` updates flow signal→bound-property with no tree diff, rAF-batched. All strings via `textContent` under the single `efs-shell-renderer` Trusted Types policy. Enforce the first-class limits (max 50,000 nodes/surface, patch-ops/s, signals/s) and the visible "app UI throttled" state on overrun.
3. **Catalog slice:** implement only the components Files needs — `list`, `list-row`, `text`, `icon`, `badge` (grade), `identifier` (`<efs-identifier>`), `chip` (pending-state), `text-input`, `menu`/`menu-item`, `checkbox`, `spinner`. Honesty components accept **refs** (claimId/venueId/outboxId) and resolve grade/state through a mock Kernel — the app cannot pass a literal "LIVE" badge.
4. **Control app:** `files-control/` — same view, plain Lit, in-thread, direct DOM. Same visual output. Used only for the deltas.
5. **Harness:** drives scripted runs (type a 12-char filter char-by-char; drag a row across 30 positions) with `PerformanceObserver` + long-task + rAF timestamps captured on the Shell side; a11y snapshot via a real screen reader (VoiceOver + NVDA) and the accessibility tree.

## Build order

Time-box: ~1 week. Steps:

1. **Schema + wire (day 1):** implement the v0 `SurfaceNode` union, `mount`/`patch`/`signal` op codecs, and the inbound `{handler, event}` shape as plain TS over a `MessageChannel`. No app, no DOM yet — just prove the ops round-trip and validate against the per-component schema.
2. **Reconciler + catalog slice (days 2–3):** `surface-reconciler.ts` (retained tree, schema-validated apply, single Trusted Types sink) + the ~12 catalog components Files needs, honesty components resolving refs through a mock Kernel. Bench the signal-graph path in isolation (synthetic 10-signals/frame load) before wiring the real app.
3. **Files worker app (day 4):** hand-write `files-app.worker.js` against the raw schema (no helper) — this is the ergonomics-pain probe; log every friction point as it happens.
4. **Control app (day 4):** the plain in-thread Lit Files view, same output.
5. **Instrument + run (days 5–6):** scripted live-filter + drag runs with `PerformanceObserver`/long-task/rAF capture; VoiceOver + NVDA passes on both apps; LOC/concept-count diff.
6. **Write-up (day 7):** the defect list (categorized a/b/c/d), the perf percentiles, the a11y verdict, the ergonomics delta, and which of the six Decision rows fires.

## Measurements

- **Expressiveness pain (primary, qualitative-but-logged):** keep a running defect list — every thing the Files view *wants* that the v0 catalog/schema can't express. Categorize each as: (a) missing component, (b) missing prop/event on an existing component, (c) missing layout primitive, (d) a genuine schema-shape gap (something no catalog growth fixes — e.g. needs imperative measurement, needs a custom paint, needs synchronous read-back). Count and severity-rank. Category (d) items are the ones that argue for an escape hatch or canvas-mode.
- **Frame/latency budget on the signals lane:** for live-filter, **keystroke→painted filtered list** P50/P75/P95; for drag-reorder, **pointermove→row reflow paint** P50/P95 and dropped-frame count over a sustained 3s drag. Measure signal throughput ceiling (signals/s before the rAF-batched graph stalls or the throttle trips). Record boundary cost separately (postMessage serialize/deserialize per op) from reconcile cost (DOM apply). Instrument five timestamps per interaction: `t0` inbound event enters worker → `t1` op posted from worker → `t2` op received Shell-side → `t3` rAF batch applied → `t4` paint (via `requestAnimationFrame` after apply + a `PerformanceObserver` `event`/`paint` entry). The `t1→t2` gap is the boundary tax; `t2→t4` is the reconciler; splitting them tells us which half to fix if a budget misses. Confirm the signal path actually **skips the tree diff** — assert zero `patch` ops fire during a pure `signal()` update (a re-mount masquerading as a signal update is a silent failure mode).
- **Accessibility (does the Shell-owned DOM give it for free):** run VoiceOver + NVDA over the surface-mode Files view *and* the control. Does the compositor-owned DOM produce correct roles/names/relationships (list/row/selection state, rename input labeling, grade badge announced) **without app diligence**? Note anything the app would have had to do manually in the control that surface mode gives for free — and anything surface mode *breaks* (e.g. cross-root ARIA, since ARIA relationships must stay within one shadow root per F10).
- **Dev-ergonomics:** lines-of-code and concept-count for the surface-mode Files view vs the control Lit app; how much is boilerplate (id bookkeeping: NodeId/SignalId/HandlerId allocation, patch-op construction) vs domain logic. Time-to-first-render for a developer new to the schema (one observed build session). Note where the raw v0 schema *demands* a helper/reconciler-library layer to be usable (a likely finding — hand-writing NodeId maps is miserable).

## Pass-fail (thresholds)

- **Live-filter keystroke→paint P75 ≤ 50ms; P95 ≤ 100ms** on a mid-tier laptop, and **≤ 100ms P75 on a Galaxy-A24-class device.** Above that, typing feels laggy → signals lane insufficient for high-frequency text.
- **Drag-reorder: sustained ≥ 55fps (≤ 5 dropped frames over 3s)** on the laptop; **≥ 30fps** on the A24. Below → drag must be a canvas-mode/direct-manipulation escape, not surface mode.
- **Expressiveness: zero category-(d) blockers** for Files to be a PASS for "surface-mode-first." 1–3 category-(d) items = **conditional** (escape hatch needed). >3, or any single (d) that Files fundamentally can't ship without = surface-mode-first is too weak for system apps.
- **Accessibility: the surface-mode view is ≥ as accessible as the control with ≤ its manual ARIA effort.** A PASS means "the Shell owns real DOM ⇒ a11y by construction" (F1/F10 claim) holds empirically. If surface mode is *less* accessible than the hand-written control, the central a11y justification for surface mode is wrong.
- **Dev-ergonomics: surface-mode Files ≤ ~2× the control's domain-logic LOC** *after* a thin SDK helper layer is allowed. If raw-schema authoring is >3–4× and no helper closes it, the schema needs an ergonomic front-end before freeze.

## Decision-driven

| Outcome | Drives |
|---|---|
| All thresholds PASS; ≤ small catalog gaps (cat a/b/c) | **OS SDK render vocabulary stays surface-mode-first.** Freeze the v0 node/signal/handler schema (with the measured catalog additions folded in). Canvas/document modes stay secondary. The thesis + kernel-doc open question closes: bespoke tree wins. |
| Perf PASS but many cat-(a/b/c) gaps | Surface-mode-first **with a materially bigger component catalog** — enumerate the missing components/props/layout primitives from the defect list as the v1 catalog spec. Schema shape stands; vocabulary grows. |
| 1–3 cat-(d) gaps (schema-shape misses) | Surface-mode-first **+ a scoped escape hatch** — most likely a `canvas` slot for the specific interaction that failed (e.g. drag), or a narrow imperative-measurement channel. Document the escape as first-class, not a workaround. |
| Live-filter and/or drag miss the frame budget | **Signals lane is not enough for high-frequency UI** → either the reconciler's signal-graph compilation needs rework (measure whether the cost is boundary serialize vs DOM apply — the fix differs), or **canvas-mode moves up to first-class sooner** for interaction-heavy apps. Records which half of the pipeline is the bottleneck. |
| A11y worse than control | The "Shell-owned DOM = a11y for free" pillar (F1, F10) is **not automatic** — surface mode needs explicit a11y obligations in the catalog components and the schema (roles/relationships as required props). Feeds an a11y-contract addendum before freeze. |
| Dev-ergonomics >3–4× control, uncloseable | The v0 schema is an unusable authoring surface as-is → **the SDK must ship a reconciler/VDOM-style helper as the real developer API**, and the raw port schema is an internal wire format only. Changes what "the render vocabulary" even means for app devs. |

## Contingencies

- **Boundary cost dominates (postMessage serialize/deserialize is the bottleneck, not DOM)** → measure `structuredClone` cost per patch batch; consider a compact binary op encoding or coalescing before blaming the DOM path. The signals lane exists precisely to avoid per-frame tree diffs — confirm it's actually bypassing the diff and not silently re-mounting.
- **Throttle trips during normal drag** (limits too tight) → the 50k-node / ops-per-s defaults are guesses; if a legitimate Files interaction hits them, the finding is "recalibrate the defaults," recorded with the observed rates, not "surface mode fails."
- **Honesty-component ref resolution adds latency** (grade/state resolved through the Kernel per row on a 2,000-row list) → measure it; if per-row Kernel round-trips are the cost, the finding pushes a batched/cached grade-resolution path into the kernel-capability design (an efsv2-adjacent gap: bulk grade resolution).
- **Web Awesome / Lit component set can't express a needed row layout** → note whether it's the catalog wrapper or the underlying library; don't attribute a Web Awesome limitation to the surface-mode model.
- **Screen-reader behavior differs VoiceOver vs NVDA** on the same compositor DOM → report both; the a11y verdict is the *worse* of the two, since F10's floor is WCAG 2.2 AA across engines.

## Open question this resolves

Closes the shared open question in [[web-os-thesis]] (§Open questions) and [[kernel-capability-model]] (§Open questions): **the surface-mode UI schema — bespoke minimal tree vs subset-of-HTML vs adopting an existing declarative IDL — settled by prototype before the OS SDK freezes its render vocabulary.** The measured defect list + perf + a11y + ergonomics deltas are the ADR's evidence base; whichever of the six decision rows fires is the ruling the OS SDK render-vocabulary freeze adopts.
