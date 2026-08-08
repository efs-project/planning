# EFS Arcade — player and security model

**Status:** draft
**Target repos:** planning, contracts
**Depends on:** [[playable-archive-requirements]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #repo/contracts #topic/games #topic/arcade

Defines how the Arcade runs untrusted game code for the 2026-09-11 demo: the threat model, the exact execution container, verify-before-execute, shell-owned session controls, and the honest error taxonomy. Everything here is Ephemeral-tier client work in `contracts/packages/nextjs` — no contract changes ([verification](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md), grade A: all gaps close in the client/SDK fetch layer).

> **Post-pass correction (2026-08-08):** `sandbox="allow-scripts"` is a useful authority boundary, not a complete hostile-code or no-network container. It permits outbound requests and self-navigation, and a tight loop can hang the parent renderer before an Exit control responds. Treat iframe `sandbox`/`allow` values as runner-generated grants constrained by a versioned host policy, never raw publisher authority; model network separately because iframe permissions cannot express HTTP egress. The first release may allow network for compatibility, while a later dedicated-origin/CSP profile can make no-network the privacy default.

## 1. Scope and position

**This is a deliberately isolated v1 compatibility runner — NOT a v2 Ring-3 app.** In PAF-5 terms it is the **legacy-direct profile** with its documented weaker guarantees, labeled as such ([playable-archive-requirements — PAF-5](../efsv2/playable-archive-requirements.md)). The clientv2 kernel's "no iframe-hosted app logic" rule and whether v2 approves a legacy-direct lane are routed to the v2 pressure report ([client-os-pressure-report](../efsv2/client-os-pressure-report.md)) — **not decided here**. Nothing in this doc creates a precedent for v2 app execution.

Two structural facts anchor the design (proposals of this pass unless marked verified):

- **Isolation exists today, integrity does not** (verified, grade A): the explorer already renders HTML in `sandbox="allow-scripts"` srcDoc iframes ([FileBrowser.tsx:2135-2141](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx)), but `verifyContentHash` has zero callers and no render path hashes fetched bytes ([verification §1.1-1.2](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md)). A tampered gateway's bytes execute in the sandbox today.
- **Curation is a security control**: the September catalog is 12-18 curator-reviewed single-file games. The container assumes hostile code anyway, but curation is why residual risks (tab-freeze loops, unblocked egress) are acceptable at demo scope.

## 2. Threat model

| # | Threat | Vector | September control | Residual risk (stated honestly) |
|---|---|---|---|---|
| T1 | Hostile game code | Game JS attacks parent page, cookies, storage, wallet | Opaque-origin sandboxed iframe, `allow-scripts` only (§3) | Outbound network egress NOT blocked (§3); curation is the compensating control |
| T2 | Tampered mirror | Gateway/host serves bytes ≠ attested content | Verify-before-execute: sha-256 vs `f1220` claim BEFORE render; reject + next mirror (§4) | None for execution; a lying **RPC** is out of scope for v1 (§4) |
| T3 | Lying gateway | HTTP 200 with wrong/injected body (CDN MITM, dead-link squatting) | Same as T2 — verification makes gateway choice trust-irrelevant | Availability only: all mirrors lying/down = unavailable error, never wrong bytes |
| T4 | Phishing inside game pixels | Game draws fake wallet prompt / fake Arcade UI, harvests clicks or seeds | No wallet, signing, or write control EVER inside the frame; all EFS chrome (star, comments, provenance) outside game pixels; visible frame boundary (§5). Frame cannot navigate top-level or open popups (no `allow-top-navigation`, no `allow-popups`) | Game can still *draw* lookalikes; mitigation is behavioral (nothing real ever appears there) + labeling, not technical |
| T5 | Nuisance / resource exhaustion | Tight loops, memory balloons, audio spam | `alert`/`confirm`/`prompt` are inert without `allow-modals`; Exit control tears down the iframe; audio needs user gesture | srcDoc frames typically share the parent renderer process — a hostile tight loop **can hang the tab**; recovery is tab reload. Accepted at demo scope; curation gates entry |
| T6 | Clickjacking of Arcade chrome | Third-party site frames the Arcade to skin its Play/star buttons | `frame-ancestors` / `X-Frame-Options` via hosting headers where the host permits | IPFS gateways / eth.limo may not honor custom headers — flagged, not solved (open question) |
| T7 | Parent-page third-party script (giscus) | A compromised/malicious `client.js` runs in the arcade's own origin — beside the burner private key in localStorage (`burnerWallet.pk`): it could sign attestations as the visitor and harvest drips | **Self-host a pinned copy of giscus `client.js`** (MIT, self-hostable); lazy-load below the fold; it is the ONLY third-party-origin script permitted on the site, and that fact is itself the audit rule | Any same-origin script can reach the burner key — the mitigation is pinning + minimizing that set to one (or zero, if D2 chooses differently); stated plainly rather than assumed away |

Not in the September model: multi-file packages (rejected outright, §6), package service workers (impossible from an opaque srcDoc origin), save-data attacks (no storage exists, §3).

## 3. The execution container — today and for September

**Container: `<iframe sandbox="allow-scripts" srcDoc={verifiedBytes}>` — exactly what ships in FileBrowser today** (verified at [FileBrowser.tsx:2135-2141](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx); fullscreen variant 2277-2280), reused by the Arcade shell. `allow-same-origin` is **never** added — that is the client half of [ADR-0056](../../../contracts/docs/adr/0056-remove-mirror-scheme-gate.md)'s render-isolation mandate, and combining it with `allow-scripts` on same-process content would let the game reach the embedding page.

**What the opaque origin gives (grade A, from the sandbox spec + verified attribute set):**

- No parent DOM access, no Arcade cookies, no Arcade localStorage/sessionStorage.
- No wallet objects, no EFS write path, no signing surface — there is nothing to steal because nothing is injected.
- No top-level navigation, no popups, no form submission to external endpoints (`allow-forms` absent), no modals.
- Mirror URIs are rendered as bytes, never as live links or navigations (ADR-0056's navigable-URI guard).

**What it does NOT give — state these honestly in the UI and docs:**

- **Outbound network is NOT blocked.** `fetch`/XHR/WebSocket/image beacons from the frame work. This is PAF-5's legacy-direct "weaker network isolation," and we label it rather than pretend. A `<meta>` CSP injected into srcDoc was considered and rejected for September: it mutates the verified bytes before render (undermining the "we render exactly the attested bytes" claim) and meta-CSP cannot express `frame-ancestors`/reporting anyway. Post-September option: serve from a dedicated sandbox origin with response-header CSP (PAF-3's package-serving-topology question).
- **No storage inside the frame** — opaque origins get no persistent localStorage. **High scores and saves do not persist.** UX copy owns this: "Games run in a clean sandbox each time — progress isn't saved." Games that touch `localStorage` without try/catch will throw; that surfaces as a runtime-crash error (§6), and curation should smoke-test for it (PAF-7-shaped test tuple).
- **No pointer-lock, no fullscreen-from-inside, no gamepad** — the current attribute set omits `allow-pointer-lock` and any `allow` permissions list. The content repo's guidance to add `allow-pointer-lock` ([web-games README §Rendering & safety](../../../content/datasets/web-games/README.md)) is **deferred**: any such grant is a per-game, explicit allow decision recorded in catalog metadata (a PAF-5 capability ceiling), not a blanket widening. The September 12-18 games are keyboard/canvas titles that need none of it (grade B, [routes verification §3](../../Reviews/2026-08-07-arcade-corpus/verification-routes-and-links.md)).

**Play gate (proposal, this pass — firm):** opening `/arcade` or `/arcade/<slug>` executes **zero** game code. Exactly one explicit Play click starts fetch → verify → render. Poki auto-executes because it is the publisher; a neutral substrate must not ([browser test log §5.3](../../Reviews/2026-08-07-arcade-corpus/hands-on-browser-test-log.md); PAF-3 "browse and launch do not require a wallet" + explicit-action launch).

**Internal abstraction:** the shell consumes a `PlayablePackage`; **profile 1 = single `index.html`** is the only profile implemented for September. Anything else fails closed (§6). This keeps the door open for the post-September folder-bundle lane without widening the runner now.

## 4. Verify-before-execute

The pipeline, per Play click (proposal of this pass; insertion points verified):

1. **Resolve `(dataUID, attester)`** via `EFSFileView.getFilesAtPath` ([EFSFileView.sol:1091](../../../contracts/packages/hardhat/contracts/EFSFileView.sol)) — required because `EFSRouter.request()` discards both (verified, [§1.3](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md)). Lens list is the build-baked `[EFS_CONTENT_LENS 0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912, SystemAccount]`.
2. **Read the `contentHash` PROPERTY** for that (dataUID, attester) — the same 3-read pattern the router uses for contentType. ~+4 eth_calls per game open (verified budget, [§3.4](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md)).
3. **Enumerate mirrors** via lens-scoped `EFSFileView.getDataMirrors(dataUID, attester, …)` ([EFSFileView.sol:1267](../../../contracts/packages/hardhat/contracts/EFSFileView.sol)); order by the router's priority ladder; try each with a per-mirror `AbortSignal` timeout. Never use `getDataMirrorsAllAttesters` on the fetch path (ADR-0056 lens-scoping rule).
4. **Fetch + hash**: assemble bytes (SSTORE2 chunk loop, `data:` inline, or gateway fetch), compute sha-256, compare to the decoded claim. **Insertion point: inside `fetchFileContent()` post-assembly, pre-cache** (~[fetchFileContent.ts:293](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts), before the 60s cache write) so the cache only ever holds verified bytes and both render surfaces inherit the check.
5. **Mismatch ⇒ reject BEFORE any iframe mount**, surface which mirror failed, try the next mirror. Only bytes that pass reach `srcDoc`.

**Hash-format stance** (canonical per contracts specs/10 + ADR-0064, James-ratified):

- `f1220<sha256>` — canonical; verify with sha-256.
- `f1b20<keccak>` — spec's keccak alternate; verify with keccak-256 (accept, cheap).
- Bare `0x…` keccak — **unverifiable-legacy** (not classifiable under specs/10). 67 such files exist on real Sepolia today (verified, [contentHash writers](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md)). **Arcade policy: fail closed.** A catalog entry whose contentHash is missing or unclassifiable is not playable in the Arcade — no "verify skipped" soft path. **Post-review precision:** digest-equivalent idempotence means *unchanged* keepers (dante, tiny-yurts) would skip re-seeding and keep their legacy keccak PROPERTYs — so fail-closed is affordable only if the Week-3 seed run **also re-binds canonical `f1220` values for every launch-catalog title, including unchanged keepers** (a handful of re-PINs, riding the same run; now part of M5 in [[september-plan]]). The full 67-file remediation stays optional; the launch titles are not optional.
- **SSTORE2 scope decision:** on-chain bytes come from chain consensus, and a lying RPC is explicitly out of scope for v1 — but **verify them anyway whenever a contentHash claim exists**. It costs one sha-256 over bytes already in memory, keeps the invariant simple ("no bytes render unverified"), makes acceptance test 20 (§7) a single sweep, and incidentally converts some RPC-corruption cases from silent to loud.

## 5. Session controls owned by the Arcade shell

Per PAF-4, EFS-owned controls live **outside game pixels**, in chrome the game cannot draw over:

- **Exit** — tears down the iframe (removes it from the DOM; the only reliable kill switch for T5) and returns to the game page. **Restart** — full teardown + fresh verified render (which, given no storage, is also the honest "reset state").
- **Focus**: legacy-direct means the game receives keyboard input directly when focused (PAF-5); the shell indicates focus state, and clicking Arcade chrome always works because the frame cannot capture the parent's input. Reserved-shortcut interception inside the frame is **not promised** — browser escape behavior plus outside-the-frame controls is the whole guarantee, said plainly.
- **Audio**: browser user-gesture rules apply; the Play click is the gesture. If audio is still blocked post-load, show a normal "Start audio" state, not a silently muted game (PAF-4).
- **Fullscreen**: shell-owned (`requestFullscreen` on the iframe's container, after user gesture), **deferred if not landed by September** — the 60vh-style embedded frame is acceptable for keyboard/canvas titles. Never granted to the game itself.

## 6. Error taxonomy — honest, distinguishable, PAF-3-aligned

Every failure is one of these; copy intent is stated so the UI never collapses them into "something went wrong":

| Error | Trigger | User-facing copy intent |
|---|---|---|
| **Unavailable bytes** | All mirrors down/timed out | "None of this game's mirrors responded." List mirrors tried; offer Retry. Availability failure, not integrity |
| **Hash mismatch** | Mirror bytes ≠ attested hash | "Mirror X served bytes that don't match this game's on-chain fingerprint — rejected without running them. Trying the next mirror." **Name the mirror**; frame as the system working |
| **Unverifiable record** | contentHash missing / bare-0x legacy | "This item has no verifiable content fingerprint, so the Arcade won't run it." (Should never occur for the curated catalog; exists for honesty) |
| **Unsupported package** | Multi-file / non-profile-1 | "This game is a multi-file package — not supported by the Arcade yet." No partial execution, ever |
| **Unsupported input device** | Catalog metadata says e.g. keyboard-only, user on touch | Pre-Play badge + "This game needs a keyboard" — before fetch, not after |
| **Blocked capability** | Game needs pointer-lock/fullscreen/gamepad not granted | "This game needs [capability], which the Arcade doesn't currently allow for this title" |
| **Runtime crash** | Game loads verified, then throws (e.g. localStorage access) | "The game's own code hit an error" + expandable diagnostics. Explicitly distinct from mismatch/unavailable — the archive did its job; the game is buggy |

## 7. Acceptance tests

Mapping to the canonical 20-item suite (published in [[september-plan]] §8 — that numbering is authoritative):

| Item | Test | Pass condition |
|---|---|---|
| 4 | **Play gate**: load `/arcade` and a game page with network + console capture | Zero game bytes fetched, zero game JS executed before the Play click |
| 5 | **Verified Play**: one Play click on a healthy title | Fetch → logged passing digest verification → launch, in that order |
| 6 | **Tamper + fallback**: serve altered bytes from the primary mirror, keep a valid alternate up; separately, kill the primary outright | Tampered bytes rejected BEFORE any iframe mount, error names the mirror; per-mirror timeout fires on the dead mirror; the valid alternate's verified bytes render (demo differentiators #1/#2) |
| 7 | **Sandbox probes**: run a hostile fixture attempting `window.parent`, `document.cookie`, `localStorage`, wallet globals, top-navigation, popup, `alert()` | All fail/inert; the fixture's own scripts still run (proves `allow-scripts` without `allow-same-origin`) |
| 8 | **Shell controls**: during play, use Exit and Restart; attempt to reach them while the game holds focus | Both work from Arcade-owned chrome outside game pixels; teardown completes |
| 20 | **Unsupported package**: Play a multi-file entry | Clean unsupported-package error; no partial fetch-and-render of `index.html` alone |
| A1 *(extra, this doc)* | **Integrity sweep**: full instrumented session across ≥3 games incl. SSTORE2- and gateway-sourced titles, with frame-originated network requests captured | Every `srcDoc` mount preceded by a logged passing hash verification; cache never returns unverified bytes; **zero subresource/script fetches or in-frame navigations originate from any catalog game** (the runtime enforcement of the no-external-request curation rule) |

**Invariant, stated honestly (post-review):** "no unverified bytes" covers what is *mounted as the document*. A sandboxed frame with open egress could still `<script src>`, `fetch`+eval, or navigate itself to remote content — unverified code inclusion the hash check cannot see. The controls for that are the curation no-external-request rule plus test A1's runtime capture, not hashing; a game that loads any runtime subresource fails intake and fails A1.

## Open questions

- [ ] Can eth.limo / the chosen host set `frame-ancestors` (or `X-Frame-Options`) response headers for the Arcade origin, or is T6 clickjacking accepted-unmitigated for September?
- [ ] Per-mirror timeout value (proposal: 8-10s per mirror, ~30s total budget before "unavailable") — tune against real Sepolia gateway latency before launch.
- [ ] Do any of the final 12-18 catalog titles touch `localStorage`/pointer-lock in smoke tests, forcing either a per-game capability decision or a catalog swap?
- [ ] Post-September: dedicated sandbox origin + response-header CSP for real egress restriction (PAF-3 topology question) — where does that land relative to the folder-bundle lane?
- [ ] Does the shared 20-item suite's numbering match §7's mapping (items 4-8, 20)?

## Pre-promotion checklist

- [ ] All Open questions resolved or deferred
- [ ] Target repos confirmed
- [ ] Depends on chain accepted
- [ ] No AGENT-Q comments remain
- [ ] One review round completed
