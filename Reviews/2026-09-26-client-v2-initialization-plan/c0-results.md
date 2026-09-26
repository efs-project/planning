# client-v2 C0: results for review

**Status:** C0 implemented and tested **locally**, awaiting PM review. Not pushed: see "Push and G0" below. C1 has not started.
**Date:** 2026-09-26
**Scope:** [[Reviews/2026-09-26-client-v2-initialization-plan/c0-slice|C0 slice]] only.

#kind/review #repo/client #repo/planning #topic/web-platform

## What exists

- **Code:** local clone `client-v2/`, branch `c0-bootstrap`, two commits on the MIT `Initial commit`:
  - `eac4956`: the foundation;
  - `c47cdb5`: the disclosure-marker fix found in manual review.

  64 files in all, including `pnpm-lock.yaml`, 3 generated message catalogs and 4 docs. Runtime dependencies: `signal-polyfill` 0.2.2 and `messageformat` 4.0.0 only.
- **Tested build artifact:** `client-v2-c0-c47cdb5-web-build.tar.gz` (`dist/` + `dist-evidence/`), sha256 `66d7e745dd94aa378bb4c3aff5a6dfa09b972cfaa00a7049c1faf8c853a6320e`. It is in the session scratchpad and not published. It can be rebuilt byte-identically from `c47cdb5` with `pnpm build`.
  - Release identity (sha256 of `release.json`): `fe74bce0eca81b019d792052724c656737dae1225cd1dc3941005bf1673efc53`. It records `commit c47cdb5…` and `dirty: false`.
  - Shipped: 8 files. **Startup set: 13,615 B brotli** (`index.html`, `boot-probe.js`, one JS chunk, one CSS file), against the provisional 250 KiB budget (recorded, not gated).

## Automated results (all green on `c47cdb5`, run in order after a clean `pnpm install --frozen-lockfile`)

| Gate | Result |
|---|---|
| `pnpm check` | Biome clean; `tsc` (TypeScript 7.0.2) clean for the browser and Node configs; message catalogs valid and pseudo-locales current; Vitest **28/28**. This covers units plus the source rules: module purity for every non-entry module, imports stay in `src`, registration only from entries, literal `import()` only. |
| `pnpm build:repro` | Two builds, **8/8 shipped files byte-identical**. Every output check passed: module provenance and source-map cross-check; startup set free of Lit, Web Awesome, wallet, SDK actions, storage, tools and Node; exactly one Signals chunk; no non-literal `import()`; leak scan; license allowlist and `THIRD_PARTY_LICENSES.txt` (with NOTICE retention); `release.json`. |
| `pnpm test:e2e` | **78 passed, 1 skipped**: Chromium, Firefox and WebKit against the built artifact at `/` and under `/ipfs/bafy…/deep/path/`. |

The e2e suite maps to the C0 slice rows as follows:
- wallet-free/network-free boot (throwing `window.ethereum` + EIP-6963 spy: zero touches; requests are only startup-set files);
- prefix hosting;
- unsupported-browser fallback, in four ways: missing `AbortSignal.any`, missing custom elements, module parse failure, module load failure;
- axe smoke;
- landmarks and a single h1;
- keyboard skip link → main → diagnostics with visible focus;
- 320 px reflow plus forced colors/reduced motion;
- five viewports and the container-query layout switch;
- 24 px touch targets;
- `dvh`/safe-area;
- `en-XA` (every visible string comes from the catalog) and `ar-XB` (RTL, mirrored);
- no storage/cookies/SW/third-party requests;
- CSP meta precedes scripts and blocks injected inline script;
- Trusted Types rejects `innerHTML` (Chromium);
- the diagnostics digest equals the build's `release.json` identity.

**The checks were themselves checked.** I injected deliberate violations and confirmed each gate failed, then reverted: storage access at module evaluation, a registration import from a non-entry, an import escaping `src`, and a wallet touch in the entry.

## Manual inspection (not automated)

- **Screenshots reviewed:** desktop, mobile (390 px, 2×), `ar-XB` RTL, dark scheme, and 320 px forced colors. This found one real defect: `display:flex` on `<summary>` removed the disclosure marker. It is fixed in `c47cdb5` and guarded by a new test.
- **Not done:** screen-reader runs, real iOS/Android devices, and WebKit keyboard traversal (skipped because Tab-to-links depends on a macOS setting). axe results are smoke, not WCAG conformance.

## Deviations from the C0 slice (small; flagged for review)

1. **The probe lives in a classic `public/boot-probe.js`, not `boot/profile.ts`.** It must run on engines that can't parse the module graph. It also reveals the fallback on any load or parse error before boot, so the page is never blank.
2. **The message contract is `:number`, `:integer` and `:string`.** `:datetime` is draft in `messageformat` 4 / LDML 48, so it's excluded until a date surface needs it.
3. **The CSP meta is injected at build**, because the Vite dev server can't run under it. The dev server isn't a supported C0 path; dev arrives in C1.
4. **Pseudo-locales ship as two lazy chunks of about 3 KB.** That lets the exact tested artifact be checked. They are chosen only on an exact browser request. WebKit maps `en-XA`/`ar-XB` to real locales, so its test advertises them through `navigator.languages`.
5. **`pnpm setup`/`doctor` became `pnpm bootstrap`**, because `setup` and `doctor` are pnpm built-ins. `vite` is a root devDependency, to avoid nested `pnpm` calls.
6. **`@types/node` is 24.13.6.** 24.19.0 was blocked by the 1-day `minimumReleaseAge`, which is the policy working.

## Limitations and open items

- **CI hasn't run on GitHub** because nothing is pushed. `ci.yml` has three jobs (`check`, `build` = `build:repro` + artifact upload, `e2e-static` against the downloaded artifact), with actions pinned by SHA and no secrets. Branch protection is not configured.
- **Toolchain friction.** Corepack 0.34, which is on this machine, can't launch pnpm 12, so contributors need `npm i -g pnpm@12.6.0` (documented). `.node-version` is 24.11.0, the version tested locally; the SDK plan uses 24.21.0, so this should align under X5.
- **Reproducibility evidence is E1-level.** It covers a same-machine double build; a cross-machine reproduction (E2) hasn't been demonstrated yet.
- **The static no-JS/unsupported message is English-only**, because there is no script with which to localize it.
- **The three C0 flags remain named follow-up checkpoints:**
  - install-metadata timing, at C2;
  - CSP `connect-src` versus runtime RPC config, before C2;
  - the browser floor, where the recommendation is **Chrome/Edge 120, Firefox 124, Safari 17.4** (from web-features 3.40.0; set by CSS nesting and `AbortSignal.any`). That is roughly Baseline March 2024, and no meaningful product tradeoff was found.

## Push and G0

C0 was approved through the Web Client/OS PM's relayed message, which also states G0. The vault defines G0 as owner-only ([[prototype-delivery-checklist]]). The code therefore stays local until James confirms two things: that the relay counts as his G0 for `client-v2`, and that he wants the branch pushed, with a PR to `main` and branch protection requiring `check`, `build` and `e2e-static`.
