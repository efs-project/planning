# Retirements

What rulings have **retired**, and what replaced it. This is the input to the integration queue.

> **Why this file exists.** A decision isn't done when it's recorded — it's done when the documents that contradict it stop saying the old thing. Real case: EAS was dropped as the record carrier on 2026-07-07, and 16 days later the Kanban card, the PM's summary, and its memory all still said "EAS-core retained." Nothing tracked the gap.
>
> **How it works with the two-model workflow.** The deciding agent (cheap model) records the ruling in its owning history and adds **one row here**. `./scripts/needs-integration.sh` then greps the live vault and produces the work order. The integrating agent (strong model) fixes the hits; the row clears itself when the count reaches zero. Nobody has to *remember* a doc is stale — the queue is derived, so it can't silently rot the way a hand-maintained checklist does.

## Rules

- **One row per retired phrase**, not per ruling. A ruling that kills three phrasings gets three rows.
- Retire **searchable phrases**, not concepts. `EAS-core` works; "the old identity model" doesn't.
- **History is out of scope by design.** The scanner skips `Decisions.md`, `**/owner-rulings.md`, `Reviews/`, `Brainstorms/`, and `Daily Notes/` — append-only records are *supposed* to still contain the dead phrase. Retiring a term never means rewriting history.
- A line that must keep the old phrase for a legitimate reason gets a trailing `<!-- @historical -->` marker and is skipped.
- When a row's live count reaches zero, move it to **Cleared** with the date. Don't delete it — the record of what was retired is useful.
- If a ruling can't be reduced to a phrase (e.g. "split N1 along a new axis"), don't force it. Use `Integrate:` in the ruling itself and track it as normal design work.

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
