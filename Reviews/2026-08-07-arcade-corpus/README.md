# 2026-08-07 Arcade corpus

Evidence base for [`2026-08-07-arcade-deep-dive.md`](../2026-08-07-arcade-deep-dive.md) and the [`Designs/arcade/`](../../Designs/arcade/README.md) set. Thirteen lane reports, each self-contained with an evidence-grade legend (A = primary/directly observed · B = reputable secondary · C = uncertain/inferred) and a source index with 2026-08-07 access dates.

> **Point-in-time evidence:** preserve this corpus as the 2026-08-07 pass. Where its recommendations conflict with the post-pass correction in [`Designs/arcade/README`](../../Designs/arcade/README.md), the current spine wins; the observations and source records remain useful evidence.

## Verification lanes (local code + live-chain reads)

| File | One-line finding |
|---|---|
| [verification-contenthash-writers.md](./verification-contenthash-writers.md) | Three hash conventions in the wild, zero conformant writers; **67 durable Sepolia files carry 0x-keccak values** (verified on-chain); trustless remediation via CIDv1 mirrors; ordered smallest-safe fix plan |
| [verification-games-deployment.md](./verification-games-deployment.md) | `/games` live on real Sepolia (324 txs, 1,078 attestations, Jun 23–25); receipts 0/9 committed; seeder tooling never merged; content drift vs seeded copy; devnet 26001993 has no contracts |
| [verification-routes-and-links.md](./verification-routes-and-links.md) | Stable URLs exist through static export, but file deep links dead-end on an empty grid; guest boot gated on a 7-read serial storm; `/arcade` route is Ephemeral-tier work |
| [verification-execution-mirrors-enumeration.md](./verification-execution-mirrors-enumeration.md) | No render path verifies bytes (isolation yes, integrity no); no mirror fallback or timeout; enumeration solid; no multicall anywhere |
| [verification-sdk-pr1.md](./verification-sdk-pr1.md) | SDK PR #1: CI green, 5 unresolved threads; embeds bare-sha256 end-to-end; "arcade-pin patch" defined; stale Sepolia view addresses |
| [verification-write-costs-and-gasless.md](./verification-write-costs-and-gasless.md) | Measured 11.1M gas/game seed; `data:` transport absent on Sepolia; faucet built but not deployed; comments ≈ 0.9–1.2M gas; read scaling is the binding constraint |

## Research lanes (web + local docs)

| File | One-line finding |
|---|---|
| [research-alternatives-and-falsification.md](./research-alternatives-and-falsification.md) | Arcade was demoted by EFS's own red team as a community bet; it is the only demand-side/guest-UX probe; GO-AS-DEMO-ONLY default; 7-test validation bar |
| [research-communities-and-outreach.md](./research-communities-and-outreach.md) | js13k is the beachhead (ran a NEAR/IPFS category); crypto-aversion targets speculation, not provenance; HN Arcade thread proves demand shape; T1–T7 tests + kill signal |
| [research-competitors-and-precedents.md](./research-competitors-and-precedents.md) | 15-platform journey matrix; copy/avoid/integrate/concede; the four gaps nobody fills (rehostability, verifiable bytes, curator plurality, no-single-owner durability) |
| [research-catalog-candidates-and-rights.md](./research-catalog-candidates-and-rights.md) | 3 of the current 15 are launch-worthy; 7 trademark exposures incl. Tetris look-and-feel; Tier 1–3 candidate tables; single-file lane excludes every household-name open game |
| [research-comments-approaches.md](./research-comments-approaches.md) | Native comments credible as write path, not as primary loop by Sept 11; giscus hybrid + on-chain star + EFS archiver recommended; full cost/moderation tables |
| [research-sustainability-and-institutions.md](./research-sustainability-and-institutions.md) | Form B (separate brand, no entity) scores 39/45; grant envelope $5–40k; Ruffle $20k/yr is the niche ceiling; cost is founder-hours, not cash |

## First-hand

| File | One-line finding |
|---|---|
| [hands-on-browser-test-log.md](./hands-on-browser-test-log.md) | Deployed explorer: folder deep link works, file deep link broken, no game opened in-session (RPC 400s); Poki/itch/js13k journey benchmarks |
