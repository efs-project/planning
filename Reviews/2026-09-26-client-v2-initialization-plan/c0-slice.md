# client-v2 C0: first bounded implementation slice (proposal)

**Status:** proposal from web-client-dev, awaiting the Web Client/OS PM's scoped go-ahead **and** James's G0 authorization. Nothing is implemented.
**Date:** 2026-09-26
**Parent:** [[Reviews/2026-09-26-client-v2-initialization-plan/README|client-v2 initialization plan]] (revision 2, accepted as the foundation plan). This slice adds no scope to that plan.

#kind/design #repo/client #repo/planning #topic/web-platform #topic/cypherpunk-os

## Scope

C0 turns the empty `client-v2` repo (MIT `LICENSE` only) into a buildable, statically hostable, accessible, localized **empty frame**. It proves the build and hosting foundations before any protocol, chain or wallet code exists.

**In scope**
- **Workspace and tooling.** Root config (`package.json`, `pnpm-workspace.yaml` with an empty `allowBuilds`, `biome.json`, `tsconfig.base.json`, `.node-version`) and the two members, `apps/web` and `tools`.
- **Runtime dependencies:** only `signal-polyfill` and `messageformat`. No Lit, Web Awesome, SDK, viem or fixture.
- **`apps/web`:**
  - `index.html`: meta CSP; `<meta name="viewport">`; `color-scheme`; an external **classic** `unsupported.js` probe and static fallback message.
  - `boot/`: `main.ts`, `profile.ts` (Guest Reader probe), `route.ts` (parses `#/…` into an internal, unfrozen route value).
  - `state/`: the Signals adapter and owned `effect`.
  - `platform/`: `scope.ts` (`OwnerScope`) and `locale.ts` (negotiation only, never persisted).
  - `shell/viewer-frame.ts`: a native `efs-viewer-frame` with landmarks, the raw route echo, and a diagnostics disclosure showing release identity and profile result.
  - `ui/`: tokens and base CSS (cascade layers, logical properties, light/dark, container queries); `messages/en.json`; generated pseudo-locales for tests only.
- **`tools/build`:** provenance plugin, `check-graph`, `scan-leaks`, `licenses`, `release-manifest`, `check-messages`, and the module-purity test.
- **`tools/serve`:** a static server with prefix mounts and a `plain` header profile.
- **Playwright static suite** against the **built** output (no chain).
- **CI:** `check`, `build`, `e2e-static` jobs, actions pinned by SHA, no secrets. Branch protection requires all three.
- **Docs:** `AGENTS.md` and `CLAUDE.md`, `README.md` (license scope and support matrix), `SECURITY.md`, `docs/architecture.md`, `docs/web-platform/{guidance.lock.json, feature-policy.md}`, ADR-0001, and the PR template.

**Out of scope**, each deferred to a named stage with the boundary that keeps it cheap:

| Deferred | Stage | Boundary kept in C0 |
|---|---|---|
| Dev supervisor, gateway, chain, registry | C1 | `tools` is a separate member; `apps/web` bans it, `node:*` and relative escapes (Biome); provenance proves nothing leaks |
| `efs.config.json`, SDK, `ReaderSession`, Files views, **any network request** | C2 | `boot/main.ts` has one marked seam where the reader session will be created. No config schema is written. C0 makes **zero** non-static requests. |
| Public link grammar | C2+ with the Files/App route owners | `route.ts` output is internal and unexported; links are echoed raw, labelled "not yet supported". No URL format is promised ([[app-runtime-and-direct-launch]]: route formats "deliberately unfrozen"). |
| Wallet, actions, `ActionDescriptor`, review, journal, Lit, Web Awesome | C3 | The Biome bans and startup-set rules already exist and are exercised against an empty lazy set. Web Awesome skills are documented in `AGENTS.md`, not loaded, because the package isn't installed. |
| `manifest.webmanifest`, Service Worker, offline, user-controlled upgrades, rescue app | R, or C2 for install metadata (see Flag 1) | No SW registration anywhere; relative base; `release.json` identity kept separate from the hosting CID; **no storage APIs used at all**, so no storage format is created |
| Locale preference persistence, second real locale | Later | Negotiation only; message IDs + MF2 source are the durable contract |
| Performance *gates* | C4 | Startup-set bytes are recorded against the provisional ≤ 250 KiB budget ([[mvp-and-acceptance#Provisional performance budgets]]) as a warning, not a gate |

## Requirements to tests

Tests run in the Playwright static suite against the built artifact unless marked **(build)** or **(CI)**.

| Behavior / interface C0 introduces | Controlling reference | Acceptance evidence |
|---|---|---|
| **Wallet-free, network-free guest boot** | README current recommendation (guest critical path); [[architecture-and-modules]] Boot Core "must not load accounts, query a wallet…"; [[mvp0-acceptance]] M0-01 | An init script installs a throwing `window.ethereum` proxy and an EIP-6963 request spy: **zero** touches. Request log = only same-origin static files from the startup set. |
| **Arbitrary-prefix static hosting** | 2026-08-12 greenfield boundary (static, self-hostable); owner direction #16; [[technology-foundation]] delivery profiles | Served by `tools/serve` at `/` and at `/ipfs/bafy…/deep/path/`: identical rendering, no 404s. **(build)** Output contains no root-absolute asset URLs. |
| **Startup-set discipline** | Plan §1.4, §4.4 | **(build)** `check-graph` from provenance: startup set has no forbidden module and exactly one `signal-polyfill` chunk. Bytes recorded. |
| **Boot / Shell separation; no ambient authority** (no Kernel object, no module-level mutable state) | [[architecture-and-modules]] layer model; plan §2 | **(CI)** Module-purity test with storage, network, SW, locks, `ethereum` and `customElements.define` trapped; only `define.ts` and entries are exempt. Biome import rules. |
| **SDK ownership** (no protocol code in the client) | Plan §3; [[Designs/sdkv2/web-client-os-boundary-pressure]] | **(CI)** Biome bans `viem`, `ethers` and any codec/ID libraries in `apps/web`. There are no protocol modules to review. |
| **Unsupported-browser fallback** (Rescue *profile* behaviour; no half-working app) | [[web-platform-standards-and-forward-profile]] Rescue profile; [[technology-foundation]] `UNSUPPORTED_WEB_PROFILE` | An init script deletes `AbortSignal.any`, and separately `customElements`: the static message shows, the frame doesn't, and no uncaught errors occur. |
| **Accessibility baseline** | Owner direction #17; [[technology-foundation]] WCAG 2.2 AA target | Landmarks and a heading are present. Keyboard-only traversal reaches every control with visible focus. axe smoke is clean (labelled "smoke", not conformance). Reflow at 320 CSS px with no horizontal scroll, and 200% zoom. `prefers-reduced-motion` and `forced-colors` screenshots are reviewed. |
| **Responsive and input** | Owner direction #16; [[technology-foundation]] Experiment 3 sizes | Viewports 320×568, 390×844, 768×1024, 1280×720, 2560×1440: no overflow, container-query layout switches. `hasTouch` context: targets ≥ 24 CSS px (WCAG 2.5.8). `dvh` and safe-area CSS are present. |
| **i18n foundation** (message IDs + MF2 subset) | Owner direction #17; [[technology-foundation]] MF2 / `Intl` / logical CSS | **(build)** `check-messages` parses every catalog with `messageformat` and rejects out-of-subset syntax. An `en-XA` run: every visible text node carries pseudo markers, so there are no hard-coded strings. An `ar-XB` run: `dir=rtl`, mirrored layout, and `lang`/`dir` on the root. |
| **Privacy: no storage, no telemetry, no third parties** | Owner direction #5; [[privacy-and-agents]] | After load: `localStorage` is empty, `indexedDB.databases()` is empty, there are no cookies, no SW registrations, and no cross-origin requests. |
| **CSP / Trusted Types** | [[web-platform-standards-and-forward-profile]] CSP3 "required defense-in-depth"; Trusted Types "required forward" | Meta CSP: `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; connect-src 'self'; require-trusted-types-for 'script'`. In Chromium, `el.innerHTML = '<b>'` throws. There is no inline script. The response-header-only directives (for example `frame-ancestors`) are recorded as hosting-profile items. |
| **Signals as the state primitive** | Owner direction #14 | **(CI)** Only `state/signals.ts` imports the polyfill (Biome), and the lockfile has one version. A unit test covers `effect` disposal via `OwnerScope`. |
| **Standards-first / guidance gate** | Owner directions #24 and #28; [[technology-foundation]] Modern Web guidance gate | **(CI)** `guidance.lock.json` (source, commit, digest, license) and one `feature-policy.md` row per feature C0 actually uses parse, with spec + status + profile disposition. The PR template carries the evidence line. |
| **Build-once release evidence** | Plan §7.4 (grades E0/E1) | **(CI)** Two builds are byte-identical. `release.json` validates and hashes every file except itself and `efs.config.json`. `THIRD_PARTY_LICENSES.txt` is present. `scan-leaks` is clean. The e2e job tests the downloaded `build` artifact, not a rebuild. |
| **Tool-only interfaces**: `release.json` and `provenance.json` schemas | Plan §4.4, §7.4 | Versioned as `efs-client-release/0-experimental`. Documented as **not** a public or stable format until the first user-facing release. |

**No public API, persistent storage format or security commitment is created.** `efs-viewer-frame`'s attributes and events are internal and undocumented. The only published formats are the experimental tool manifests above.

## Flags (need a decision, but don't block C0)

1. **Install metadata timing.** [[architecture-and-modules]] says the build carries install metadata "from the first product slice". C0 is bootstrap, not product, and a web manifest's `id`/`scope` is **durable installed-app identity** tied to the generation design in [[system-profiles-and-generations]]. **Recommendation:** add it in C2 (the first product slice) once the generation owner confirms `id`/`scope` derivation; don't ship a guess in C0.
2. **CSP versus runtime-configured RPC.** A static meta `connect-src` cannot know the operator's RPC endpoints in `efs.config.json` (C2). The options are `connect-src https:` plus loopback (broad), header-profile CSP only, or accepting that the CSP portably guards scripts but not egress, which [[web-platform-standards-and-forward-profile]] already concedes ("not … proof of no egress"). This must be decided before C2, and isn't needed for C0.
3. **Browser floor numbers.** The C0 build `target` and named engine minimums come from pinned web-features/BCD data for exactly the features listed in `feature-policy.md`. There's no engine matrix ruling yet ([[technology-foundation]] open question), so C0 records the derived floor and the PM confirms it.

## Blockers

- **G0 (owner).** The Web Client/OS spine's explicit non-authorizations forbid creating repository content and installing any dependency, including Signals, Vite, pnpm, TypeScript and test/i18n tools. [[prototype-delivery-checklist]] G0 ("real-code environment authorized", owner) is unchecked. A PM go-ahead scopes the slice; **James's G0 authorization for `client-v2` is still required** before the first commit.
- Nothing else. C0 depends on no contracts or SDK artifact.

## Size

About 2–3 days. The exit is §9 C0 of the plan, plus the table above, green in CI on Linux and locally on macOS.
