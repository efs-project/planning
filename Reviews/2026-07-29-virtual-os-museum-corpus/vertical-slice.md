# Proposed minimal vertical slice + staged demonstration plan

**Status:** PROPOSED throughout — a demonstration plan for evaluation, not adopted scope; N5 remains undecided and this document does not change that
**Agent:** claude-fable-5 (main session synthesis), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/efsv2 #topic/clientv2 #topic/games

## Design constraints the slice must respect

- Legally clean end to end (no tolerated bytes anywhere in the demo).
- Generic primitives only — the slice is *evidence* for PAF's open questions, so it must not invent museum-specific protocol surface.
- Guest-link-first: the demo *is* a hyperlink; no wallet, no account.
- Explicit Play after preflight; grades before pixels.
- Every artifact independently reconstructible: manifest + bytes + claims exportable and re-servable by a stranger.

## The slice: three exhibits, one manifest convention, one player shell

Three exhibits chosen to span the runtime space while staying 100 % redistributable:

| Exhibit | Runtime | Why this one |
|---|---|---|
| **FreeDOS 1.3** | v86 (BSD-2, ~1.8 MB, no SAB/COOP-COEP needed) | The zero-friction case: embeds anywhere, boots in seconds, exercises keyboard input + save-state. |
| **Ancient UNIX (V5–V7) on PDP-11** | PCjs PDPjs (MIT) or a pdp11-js-class JS emulator (license unstated — resolve in Stage 0) | The *museum* case: 1970s timesharing Unix, Caldera-licensed freely redistributable (V1–V7/32V) OS + userland — the oldest fully-clean full stack in existence. pdp11-js has demonstrated in-browser V5/2.11BSD boots; a V7 boot is expected from the same class but must be demonstrated in Stage 0. Exercises terminal I/O and historical documentation/credentials metadata (root login, `learn`, the V7 manuals). |
| **ZX Spectrum 48K + a homebrew title** | JSSpeccy 3 (GPL-3, 190 KB) | The smallest-closure case: Amstrad-permitted ROM. JSSpeccy 3's mobile/touch quality is unverified — Stage 0 measures it (vc64web + MEGA65 open-roms is the touch-verified fallback, at a ROM-compatibility trade). Exercises input-method declarations. |

(Deliberately excluded from the slice: anything SAB-requiring, anything tolerated-media, anything needing the undecided iframe lane. Mac OS 7 — the emotional headline — enters at Stage 4 as a BYO-media exercise, not before.)

### The manifest closure (per exhibit — all ordinary EFS records)

1. **Runtime generation**: emulator wasm/js artifacts as DATA + FileManifest rows (content-hashed, small), plus a source bundle (the exact source tree the wasm was built from — the anti-"coming soon" discipline VOM teaches), plus a build-recipe file (OCI image reference as *build input*).
2. **Machine config**: one small config file (v86 profile / PDP-11 machine JSON / JSSpeccy model flags) — the VOM `Emulator-Version:` lesson expressed as content.
3. **Media**: disk/tape/ROM images as chunked DATA (256 KB-class chunks; sparse-aware), each with source, license, and provenance claims.
4. **Docs**: README, credentials ("login: root"), controls, screenshots — ordinary hashed files.
5. **Package manifest** (PAF-2 closure): entrypoint, complete file closure with per-entry byte commitments + roles — including the new **`streamable` vs execute-critical distinction** (F-4 in [`threats-and-failures.md`](./threats-and-failures.md)) — capability ceilings (canvas, audio, storage quota), and the exact runtime-generation reference.
6. **Release + channel**: immutable release placement + PIN channel head; a second release of one exhibit demonstrates upgrade + old-generation addressability.
7. **Claims**: curator attribution, rights status, smoke-test result `(client gen × runtime gen × browser × date × pass/fail)`.
8. **Collection**: one "Museum shelf" collection + a lens selecting it, with a second dissenting test-claim attester to prove claims compose without a global truth.

## Acceptance tests (falsification targets)

The slice **fails** — and produces a design handoff instead of a celebration — if any of these can't be met with generic primitives:

- **A1 (naming):** the exhibit's generation has one portable name that a second, independently-written resolver fetches and verifies byte-for-byte (PAF open question 1 made concrete).
- **A2 (bounded reads):** catalog card + item page + preflight complete within the bounded read budget from chain + one mirror, wallet-less.
- **A3 (streamed verification):** the PDP-11 disk (~50–150 MB class) boots with chunk-verified on-demand reads; a deliberately corrupted chunk on one mirror yields `CONTENT-MISMATCH` + transparent retry on a second mirror, not a crash or silent wrong bytes.
- **A4 (isolation):** the emulator worker runs with no ambient network; a hostile test package attempting fetch/WebSocket/parent-DOM access is contained and the attempt is visible.
- **A5 (saves):** save-state → close tab → guest link again → Continue restores; storage eviction simulation produces the honest loss event, not silent reset.
- **A6 (walk-away):** `efs export` of the three exhibits to a directory; a static file server + the exported closure boots all three with the EFS origin unreachable.
- **A7 (idempotent publish):** re-running the publisher against an unchanged repo sends zero transactions and re-pins nothing.
- **A8 (explicit play):** navigation renders card + grades; no emulator byte executes before Play.

## Staged demonstration plan

- **Stage 0 — static spike (no EFS, days).** The three exhibits on a plain static host with hand-written manifests; measure closure sizes, boot times, save behavior, and mobile input quality; resolve every runtime's license status (pdp11-js's is unstated — an unlicensed emulator cannot be archived and re-served as a verifiable EFS package) and demonstrate the V7 boot. Falsifies runtime assumptions before touching EFS machinery. (Half of Stage 0 already exists as public demos; the work is the manifest discipline.)
- **Stage 1 — EFS-published generations (devnet).** Publish closures via the PAF-8 toolchain pattern; A1/A2/A3/A7 run here. This is the first real pressure on FileManifest + range reads + release/channel conventions.
- **Stage 2 — player shell in client v2 (guest links).** `a`-class link → resolution card → explicit Play → canvas-mode worker adapter (screen/input/audio/save bridge v0); A4/A5/A8. This forces the runner-lane and capability decisions with working code as evidence for the owner inbox — still as *evidence*, not adopted surface.
- **Stage 3 — plural curation.** Second curator lens, dissenting smoke-test claims, one deny fact, exhibit collection with docs; demonstrates curation-without-authority and the claim tuple.
- **Stage 4 — the emotional headline, honestly.** BYO-media flow: user drops their own Mac OS 7 disk + ROM (never uploaded, hashed locally, matched against a metadata-only record) into an Infinite-Mac-class SAB runtime on an isolated origin. Proves the encumbered classes work *without* EFS distributing a single tolerated byte — and surfaces the COOP/COEP first-load answer.
- **Stage 5 (optional) — import proof.** Facts-only importer for one VOM installation record and one IA item (respecting CC BY-NC-SA by importing facts, not prose), demonstrating no-canonical-source ingestion.

## What the slice deliberately does not prove

Breadth (VOM's 250 platforms), tolerated-content hosting, server-stream fallbacks, mobile OS classes, economics at 10k-item scale (gas-snapshot-gated), and any protocol freeze implication. Those are later arguments, and three of them are owner decisions first.
