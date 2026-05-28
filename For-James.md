# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**SDK design ([[Designs/sdk-architecture]]) — ONE decision left (Q5), then a quick revise → promote.** You've answered: Q1 = single `sdk/` repo ✅; Q2 = domain namespaces ✅; **Q3 = include-but-throw ✅**; **Q4 = lens defaults to the connected wallet; require explicit lens only if no wallet is connected ✅** (better than the designer's "always require" — it keeps hello-world easy AND avoids the deployer-default bug, since it defaults to the *user's own* wallet, not the deployer). Q3+Q4 go to the SDK designer for a small revise pass.

**Q5 — the last one (and it's minor):** Writing one logical thing today (e.g. place a file) pops ~8 wallet signatures. A future `EFSUploadGateway` contract could bundle them into ONE transaction = ONE signature — but it's not built yet. Should the SDK's `batch()` already include a labeled switch like `batch({ gateway: true })` for that future feature (does nothing until the contract ships)?
- (a) Reserve it now — no API change when the gateway later ships — *PM rec (cheap insurance)*
- (b) Skip it — cleaner API now, add the option when the gateway exists

Answer Q5 → SDK designer folds Q3/Q4/Q5 in one revise pass → comes back to you as a final promote.

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
