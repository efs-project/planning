---
aliases: [For-James]
---

# Owner Inbox

> **Non-design** attention: operational forks, deadlines, FYI.
> **Design decisions live in the [owner decision inbox](./Designs/owner-decision-inbox.md)** and are never restated here — only pointed at. Duplicating one breaks answers: you'd reply "3a" against this page's numbering while design agents read `R1` in theirs.
> **For the full picture of what's open, see [Open-Decisions.md](./Open-Decisions.md)** (generated — one page, all queues, holds included).
>
> Items carry stable IDs (`FJ-n`). IDs are never reused. Reply with the ID.

*Renamed from `For-James.md` 2026-07-23. The `For-James` alias above keeps every existing `[[For-James]]` link resolving in Obsidian, including the ones in frozen history — so nothing had to be rewritten and no stub file is needed.*

## ⚡ DECIDE NOW — James

Nothing.

## 🕐 WHEN YOU HAVE TIME

- **EFS v2 packet is fully revalidated** — the joined authority/filesystem pass and dedicated lens pass both landed. The hold is liftable across P-1…P-23 and LP-1…LP-10; Q3/Q4 remain held. P-1 is the dependency root, so start there rather than treating the packet as 33 simultaneous asks. See [Open-Decisions.md](./Open-Decisions.md).
- **Other live design choices:** `OS1`/`OS2` (clientv2). Root `R1` conflicts with the captured v2-from-scratch / SDK-as-legacy ruling and awaits retirement by its owning design thread. See [Open-Decisions.md](./Open-Decisions.md).
- **Vault process changes landed 2026-07-23** — see [[Decisions]]. One thing needs your nod: whether to keep the structural SOUL edits (escalation dial re-keyed off the dead milestone, "ignore design bodies" inverted for a design phase). Say the word and I revert them.
- Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]] (then I formalize it)

## ℹ️ FYI (no action)

- **Audit scripts were blind to 77% of the design corpus** — `tri-sync-check.sh` and `designs-awaiting-promotion.sh` scanned `Designs/*.md` non-recursively, so all ~63 files in `efsv2/`/`clientv2/` were invisible and "promotion queue empty" was a false green. Fixed 2026-07-23; one metadata-only mismatch remains in the revalidated EFS v2 owner packet.
- **Entry-point docs pointed at a file that doesn't exist** — `Designs/design-system.md` (it's `0001-design-system.md`), referenced from `README.md`, `AGENTS.md`, and `repo-map.md`. Fixed.
- **Two items removed from this page as already-resolved:** the buildathon cancel-vs-lapse fork (the event's end date passed 07-08; [[Decisions]] records it wound down 07-01) and the SDK-corpus tombstone question (it *is* `R1` — answer it there, not here).

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

This file makes James's **non-design** queue scannable in 10 seconds. It is sorted by what it asks of him, not by date.

**Boundary (settled 2026-07-21, do not re-litigate):** design forks live in `Designs/**/owner-decision-inbox.md`; this file carries non-design operational forks + FYI, plus **one pointer line** per design queue. A question appears in exactly one live queue. If you catch an item here duplicating an inbox code, delete it here — the inbox wins.

**Multiple owners.** The file is role-named so it scales, but each owner gets their **own `## ⚡ DECIDE NOW — <name>` section** rather than a separate file. One file keeps the "exactly one live queue" invariant intact and keeps `Open-Decisions.md` able to see everything; per-owner sections keep each person's list short and personal. Route an item to the owner whose scope covers it per [[authority]]. Don't create `For-<person>.md` files — that's how you get four queues and answers landing on the wrong fork.

Place each item in the right section:

- **⚡ DECIDE NOW** — genuine non-design forks only. Stable ID, lettered options, a PM rec. James replies "FJ-1a" and is done. Keep it SHORT; past ~4 items the important ones are buried.
- **🕐 WHEN YOU HAVE TIME** — reviews/promotions that aren't time-critical, plus the design-queue pointer lines. One line each.
- **ℹ️ FYI** — no action needed. Collapse aggressively.

Rules:

- **Stable IDs, never bare ordinals.** Two PM harnesses share this file; renumbering while James composes an answer silently misroutes it. Never reuse a retired ID.
- **Prune ruthlessly.** When James acts, delete it (git history is the archive).
- **A decision is a fork James picks.** Status updates and observations go in [[Decisions]] or `Daily Notes/`.
- **Empty DECIDE NOW = nothing is blocking him.** That's the goal state.
- This file is **curated** by the PM, not owned by it — other agents (e.g. `@grants`) legitimately route items here. Prune, don't delete someone else's entry silently.
