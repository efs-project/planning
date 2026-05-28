# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**1. SDK for OnionDAO?**
- (a) Bare-bones read/write SDK by end of next week (dev builds it right after Lists) — *PM rec if Lists dev is quick*
- (b) Soft-launch: entrants call contracts directly via ABI; SDK later
- (c) Drop the SDK track

**2. ADR-0043 renumber — which one moves?** (before Lists merges to main)
- (a) Renumber `custom-lists` "edge-constraint-callbacks" → 0045 — *PM rec (it's Deferred)*
- (b) Renumber main's "rename-editions-to-lenses"

**3. Flyers + entrant "start here" — want me to draft it?**
- (a) Yes — agent drafts entrant onboarding doc + flyer copy — *PM rec*
- (b) Just the onboarding doc
- (c) You'll handle it

## 🕐 WHEN YOU HAVE TIME (not blocking OnionDAO)

- Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]] (then I formalize it)
- Promote [[brainstorm-system]] when you're happy with it

## ℹ️ FYI (no action — details in [[Decisions]])

- Lists got a GO; dev started. Typed-edge gap is NOT a blocker. Local `contracts/` checkout is ~30 commits stale — `git pull` it when convenient.

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

This file exists to make James's decision queue **scannable in 10 seconds**. James found a flat list of 12 mixed bullets unreadable (2026-05-28) — so the file is now sorted by what it asks of him, not by date.

Place each item in the right section:

- **⚡ DECIDE NOW** — genuine forks only. Phrase as a numbered question with lettered options and a PM recommendation. James should be able to reply "1a, 2b" and be done. Keep this section SHORT; if it has more than ~4 items, the most important ones are getting buried.
- **🕐 WHEN YOU HAVE TIME** — reviews / promotions that aren't time-critical. One line each.
- **ℹ️ FYI** — things James should know but that need no action. Collapse aggressively; one or two lines total, pointing at [[Decisions]] for detail. Do NOT let FYIs accumulate as separate bullets.

Rules:

- **Prune ruthlessly.** When James acts on an item, delete it (git history is the archive). Stale items are the enemy — they're what made this file unreadable.
- **A decision is a fork James picks.** Status updates, things-in-progress, and PM observations are NOT decisions — they go in [[Decisions]] or `Daily Notes/`, not here.
- **Empty DECIDE NOW = James has nothing blocking him.** That's the goal state.
- **WIP limit:** if DECIDE NOW has 3 awaiting-promotion items, don't queue more promotions (per [[conventions#WIP limits]]).
