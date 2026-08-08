# EFS Arcade — design set

**Status:** draft set — nothing here is adopted; [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]] is the queue
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #topic/games #topic/arcade

*Phone-readable summary first; the map is at the bottom.*

## Verdict (this pass's recommendation)

**Conditional go — build it, scoped as a labeled public demo and guest-UX probe.** Not yet a validated community, not the N5 reference-app decision, not a v2 dependency. Default framing: **GO-AS-DEMO-ONLY**, upgradeable to a product bet when 4 GO conditions are met with evidence (outside steward/creators, spike passes, 30-game license pipeline, live differentiator demo). Full reasoning: [[product-and-communities]]; evidence: [`Reviews/2026-08-07-arcade-deep-dive`](../../Reviews/2026-08-07-arcade-deep-dive.md).

> **Post-pass correction (2026-08-08 / @pm):** preserve the corpus, but do not implement this broad recommendation as written. James treats Arcade as a possible founding product/community pilot, not a disposable demo. Later validation narrowed the first slice to one mobile-capable, rights-clean game (Andromeda Invaders), no durable EFS write, strict verified fallback, and a portable application profile over EFS 1.5. The debug-client versus standalone/cypherpunk-OS placement and the runner/network permission model remain to be reconciled on `main`. The owner queue is under hold until that rewrite; Norman, 12–18 games, faucet/star, comment archiving, and a September durable seed are not current launch gates.

## The product promise being tested

An ordinary person follows a normal link → a fast, game-looking catalog/game page with **no account, no wallet, no boot** → genuinely fun games → one intentional **Play** click that fetches, **verifies**, and launches → guest-readable comments, minimal-identity writes → a real curation workflow → at least one visibly EFS-only behavior (a mirror dies live; the link keeps working).

## September MVP in one paragraph

12–18 rights-clean browser games (js13k medalists + the 3 keepers from the current 15; trademark-risk names dropped/renamed and dropped files unpinned; straker tutorials demoted to a study collection) on new `/arcade` + `/arcade/<slug>` static routes over live Sepolia — guest-fast, verify-before-execute against on-chain hashes, mirror-fallback (≥2 attested mirrors per title), sandboxed. Comments via the owner-chosen loop (recommended: pinned self-hosted giscus + one-click on-chain star + rights-gated EFS archiver). Curation via a GitHub-PR data repo publishing on-chain with committed receipts. Ships **2026-09-11** with a 3–4 min video whose centerpiece is the **EFS-only curator-plurality beat** (a second attester publishes a competing lens over the same game identities, live) plus the mirror-kill / tamper-rejection / stranger-rebuild sequence, honestly labeled as parity-plus-identity.

## Status right now (verified 2026-08-07)

- `/games` **is live on real Sepolia** (15 games, IPFS mirrors, curator lens `0x11Cb…9912`) — but file deep links dead-end, nothing verifies bytes, mirror failure breaks the UI, and the deployed app is a dev-tools explorer, not a product.
- **67 durable Sepolia files carry non-canonical keccak contentHash values**; the seeder fix is the gate before any further durable seeding; remediation is trustless via the on-chain CIDv1 mirrors.
- The June seed has **no committed receipts**; the seeder tooling of record was never merged; IPFS pins sit on a single VPS node; devnet 26001993 currently has **no contracts deployed**.
- The Sepolia faucet (needed for the on-chain star) is built and integrated but **not deployed**.

## Highest-leverage next action

**Finish the one-game Andromeda intake/play slice behind static/EFS adapters, then show the working artifact to Susam Pal and the HN Arcade operator.** Do not send outreach or seed durable records until James reviews the live slice and the held owner packet is recut.

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

External evidence corpus: [`Reviews/2026-08-07-arcade-corpus/`](../../Reviews/2026-08-07-arcade-corpus/README.md) (13 graded lane reports incl. live on-chain verification and a hands-on browser log). Review record: [`Reviews/2026-08-07-arcade-deep-dive.md`](../../Reviews/2026-08-07-arcade-deep-dive.md).
