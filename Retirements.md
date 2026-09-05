# Retirements

What rulings have **retired**, and what replaced it. Input to `./scripts/needs-integration.sh`, which greps the live vault and emits the "decided but not yet integrated" work order.

**Why:** a decision isn't done when it's recorded — it's done when the docs contradicting it stop saying the old thing. EAS was dropped as the record carrier on 2026-07-07 and 16 days later the Kanban card still said "EAS-core." Nothing tracked the gap.

**Two-model flow:** the deciding agent records the ruling and adds **one row here**; the script produces the work order; the integrating agent fixes the hits and the row clears itself. Derived, so it can't silently rot.

## Rules

- One row per retired **phrase** (searchable), not per ruling or per concept.
- **History is out of scope by design** — the scanner skips `Decisions.md`, `**/owner-rulings.md`, `Reviews/`, `Brainstorms/`, `Daily Notes/`. Retiring a term never means rewriting history.
- A line that legitimately keeps the old phrase gets a trailing `<!-- @historical -->` and is skipped.
- At zero live hits, move the row to **Cleared** with the date. Don't delete it.
- Rulings that can't reduce to a phrase (e.g. "split N1 along a new axis") aren't forced here — track them as normal design work.

## Active

| Retired phrase | Replacement | Ruling | Since |
|---|---|---|---|

## Cleared

| Retired phrase | Ruling | Cleared |
|---|---|---|
| `agent-role.sh` | 2026-09-03 owner-requested simplification: plain directory and optional profile notes | 2026-09-03 |
| `James promotes it via the usual ceremony` | 2026-09-03 portable-role process: name-stable living ops docs, no promotion | 2026-09-03 |
| `bash 4+` | 2026-09-03 portable-role process: preserve the existing macOS bash 3.2 script requirement | 2026-09-03 |
| `unauthenticated GitHub REST` | 2026-09-03 portable-role process: planning observation stays files/git-only | 2026-09-03 |
| `skip vault writes if another PM logged within the hour` | 2026-09-03 portable-role process: distinct sessions/scopes; status is advisory, overlap needs handoff | 2026-09-03 |
| `When James rules in chat, append to` | 2026-09-03 portable-role process: ruling history follows its owning queue, never duplicated | 2026-09-03 |
| `EAS-core` | 2026-07-07 carrier ruling | 2026-07-23 |
| `EAS carrier` | 2026-07-07 carrier ruling | 2026-07-23 |
| `identity = EAS UID` | 2026-07-07 carrier ruling | 2026-07-23 |
| `v1 is the supported product bridge` | 2026-08-08 greenfield-successor ruling | 2026-08-08 |
| `pre-v2 SDK design corpus` | 2026-08-08 greenfield-successor ruling | 2026-08-12 |
| `EAS-backed product bridge` | 2026-08-08 greenfield-successor ruling | 2026-08-12 |
| `EFS 1.5 bridge` | 2026-08-08 greenfield-successor ruling | 2026-08-12 |
| `v1 coexistence` | 2026-08-08 greenfield-successor ruling | 2026-08-12 |
| `additive sibling 1.5 EAS schemas` | 2026-08-08 greenfield-successor ruling | 2026-08-12 |
| `read-only-first product loop` | 2026-09-03 MVP-C0 scope ruling | 2026-09-03 |
| `in parallel, build the narrow direct Web Client/File Browser + one-game Arcade slice` | 2026-09-03 MVP-C0 scope ruling | 2026-09-03 |
| `two EIP-712 signatures / multiple wallet prompts per operation as an acceptable default MVP write ceremony` | 2026-09-03 one-approval write ruling | 2026-09-03 |
