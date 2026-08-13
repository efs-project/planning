# EFS Arcade — design set

**Status:** draft set — historical broad pass plus current correction; owner queue held
**Last touched:** 2026-08-13 — recovered evidence routed by @pm; no owner ruling

#status/draft #kind/design #repo/planning #topic/games #topic/arcade

*Phone-readable summary first; the map is at the bottom.*

## Current direction

**One-game pressure slice, not the broad launch below.** Preserve the corpus,
but do not implement its demo-only framing or 12–18-game September plan as
written. James treats Arcade as a possible founding product/community pilot.
The current candidate is Andromeda Invaders. Its exact desktop artifact/runtime
evidence is favorable, but “mobile-capable” and “rights-clean” remain targets,
not findings: glyph provenance, license-notice closure, name review, serving
custody, exact-release identity, and real mobile/browser/input testing are still
open. Keep the slice reversible behind a provisional adapter with no durable
EFS write. Client/OS placement and runner/network permissions remain open. The
owner queue is held.

### Historical 2026-08-07 pass recommendation

The pass recommended **GO-AS-DEMO-ONLY**, upgradeable after outside steward,
creator, spike, license-pipeline, and differentiator evidence. That is retained
for reasoning, not as current scope. Full reasoning: [[product-and-communities]].

## The product promise being tested

An ordinary person follows a normal link → a fast, game-looking catalog/game page with **no account, no wallet, no boot** → genuinely fun games → one intentional **Play** click that fetches, **verifies**, and launches → guest-readable comments, minimal-identity writes → a real curation workflow → at least one visibly EFS-only behavior (a mirror dies live; the link keeps working).

## Historical September MVP proposal — not current scope

12–18 rights-clean browser games (js13k medalists + the 3 keepers from the current 15; trademark-risk names dropped/renamed and dropped files unpinned; straker tutorials demoted to a study collection) on new `/arcade` + `/arcade/<slug>` static routes over live Sepolia — guest-fast, verify-before-execute against on-chain hashes, mirror-fallback (≥2 attested mirrors per title), sandboxed. Comments via the owner-chosen loop (recommended: pinned self-hosted giscus + one-click on-chain star + rights-gated EFS archiver). Curation via a GitHub-PR data repo publishing on-chain with committed receipts. Ships **2026-09-11** with a 3–4 min video whose centerpiece is the **EFS-only curator-plurality beat** (a second attester publishes a competing lens over the same game identities, live) plus the mirror-kill / tamper-rejection / stranger-rebuild sequence, honestly labeled as parity-plus-identity.

## Status right now (verified 2026-08-07)

- `/games` **is live on real Sepolia** (15 games, IPFS mirrors, curator lens `0x11Cb…9912`) — but file deep links dead-end, nothing verifies bytes, mirror failure breaks the UI, and the deployed app is a dev-tools explorer, not a product.
- **67 durable Sepolia files carry non-canonical keccak contentHash values**; the seeder fix is the gate before any further durable seeding; remediation is trustless via the on-chain CIDv1 mirrors.
- The June seed has **no committed receipts**; the seeder tooling of record was never merged; IPFS pins sit on a single VPS node; devnet 26001993 currently has **no contracts deployed**.
- The Sepolia faucet (needed for the on-chain star) is built and integrated but **not deployed**.

## Highest-leverage next action

**The owning Arcade thread should recut the one-game hypothesis against the recovered differentiation, Andromeda, and browser evidence before implementation or outreach.** This evidence creates no James decision now; do not send outreach or seed durable records until the held owner packet is deliberately reopened.

## Document map

| Doc | What it settles |
|---|---|
| [[product-and-communities]] | Verdict, falsification answers, personas, outreach plan, GO/RESIZE/PIVOT/STOP conditions, validation bar |
| [[mvp-architecture]] | v1 architecture, guest journeys, capability status table, manifests vs receipts, RPC budget, seeding plan |
| [[player-security-model]] | Threat model, sandbox truth, verify-before-execute, error taxonomy, compat-runner (not Ring-3) statement |
| [[catalog-plan]] | Quality bar, launch list, existing-15 disposition, inline-fork pipeline, outreach targets, cadence |
| [[curation-and-social]] | Comments owner-decision + star spec; curation workflow, lifecycle, migration path, Norman exercise |
| [[rights-safety-and-operations]] | Intake rights policy, trademark actions, permanence honesty, complaints, safety ops, labor budget |
| [[sustainability-and-institutions]] | Form B recommendation, boundary tests, funding plan, cost model, precedent warnings |
| [[v2-pressure-and-migration]] | v1→v2 mapping, pressure findings routed to owning designs, nothing canonical edited |
| [[september-plan]] | Calendar, scope tiers, gates G0–G3, contingencies, who-does-what |
| [[unknowns-and-experiments]] | U1–U18 ledger + T1–T7 experiments + the kill signal |
| [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]] | D1–D7 now · E1–E5 after evidence · L1–L3 launch · later · settled guidance |

External evidence corpora:

- [`Reviews/2026-08-07-arcade-corpus/`](../../Reviews/2026-08-07-arcade-corpus/README.md) — 13 graded lane reports including live on-chain verification and a hands-on browser log; review record: [`Reviews/2026-08-07-arcade-deep-dive.md`](../../Reviews/2026-08-07-arcade-deep-dive.md).
- [`Reviews/2026-08-13-claude-evidence-round/`](../../Reviews/2026-08-13-claude-evidence-round/README.md) — recovered Andromeda reproduction, one Arcade falsification workstream with two overlapping passes, catalog-loss cases, and browser-runner measurements; dated research only, with a correction register.
