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
| `EAS-core` | native envelope kernel | 2026-07-07 carrier ruling (`Designs/efsv2/owner-rulings.md`) | 2026-07-07 |
| `EAS carrier` | native envelope kernel | 2026-07-07 carrier ruling | 2026-07-07 |
| `identity = EAS UID` | portable principal ID | 2026-07-07 carrier ruling | 2026-07-07 |

## Cleared

| Retired phrase | Ruling | Cleared |
|---|---|---|
| — | — | — |
