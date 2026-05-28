# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**SDK architecture — PROMOTE/REVISE** → [[Designs/sdk-architecture]] is promote-ready at `#status/review`. Q1–Q5 all resolved and folded in (Q3 include-but-throw + reference index example; Q4 lens defaults to connected wallet; Q5 batch() owns single-signature delivery via EIP-5792→4337→SDK-owned gateway→sequential). Also passed an expert subagent review (SDK-DX + contract-fidelity) — frame validated, within-frame refinements folded (verb contract codified, cursors, decode bridge, lists fidelity). See the Revision log at the doc's end. Fork:
- **(a) Promote to accepted** — assign a number; OnionDAO-subset implementation thread can start (gated on Lists→Sepolia for the schema freeze).
- **(b) Revise** — name what's wrong; I'll fix and re-surface.

PM rec: **promote**.

## 🕐 WHEN YOU HAVE TIME (not blocking OnionDAO)

- **Start the OnionDAO onboarding + flyers discussion** — you said you'll fork a chain for this; PM will keep reminding you each session until you do (you asked not to let it slip).
- Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]] (then I formalize it)
- Promote [[brainstorm-system]] when you're happy with it

## ℹ️ FYI (no action — details in [[Decisions]])

- SDK posture decided: **(a) bare-bones read/write SDK by end of next week** (gated on Lists→Sepolia). ADR-0043 collision **resolved by the dev** (renumbered to 0045). Lists has a GO; dev started. Typed-edge gap is NOT a blocker. Local `contracts/` checkout is ~30 commits stale — `git pull` when convenient.

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
