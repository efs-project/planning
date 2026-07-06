# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**1. Merge SDK PR #1.** You said you want to merge it soon. Heads-up before you do: the PR head is **22 commits behind the live `chore/scaffold` branch** (which is 141 ahead of `main`). So merging PR #1 as-is lands a stale snapshot. **(a)** Repoint PR #1 at `chore/scaffold` (or force-update its head) so the merge captures the current SDK, then merge — *PM rec*. **(b)** Merge PR #1 as-is and open a follow-up PR for the newer commits. **(c)** Just merge `chore/scaffold` → `main` directly and close PR #1.

**2. Buildathon — formally cancel or let it lapse?** "The Forever Files" ran Jun 23 → Jul 8 with cash prizes; you say interest was low. It's Jul 1. **(a)** Post a short "we're winding this down, thanks for looking" note in Discord + mark it cancelled — *PM rec if anyone actually joined* (clean close, no one left hanging on a Jul 10 winners date). **(b)** Just let it lapse silently (fine if effectively no one engaged). Either way the kit + datasets stay reusable for a future event. Tell me which and I'll square the vault + Decisions to match.

**3. SDK architecture — promote, revise, or hold for v2** → [[Designs/sdk-architecture]] at `#status/review`. Its API surface (fs/graph/props/lists/lenses) is sound and the SDK is built against it — BUT [[Designs/deterministic-ids]] (v2) supersedes the identity substrate underneath it ("identity = EAS UID" → deterministic portable IDs). So promoting it now enshrines an identity model v2 is replacing. **(a)** Hold until the v2 freeze bundle lands, then promote the reconciled version — *PM rec now that v2 is live*. **(b)** Promote the API surface now, flag the identity section as v2-pending. **(c)** Revise.

**4. Milestones wording (your OK to edit).** [[Milestones]] still frames the event as the old **two-track OnionDAO hackathon (Jun 1–30)** — stale on every axis now (single track, dropped OnionDAO co-branding, wound down, and ".sol file list freeze" contradicts "set stays flexible"). Want me to update the OnionDAO/Milestones section to reflect what actually happened? (Milestone scope = your call, so I won't touch it unasked.)

## 🕐 WHEN YOU HAVE TIME

- **EFS v2 is heading toward your frame-review → sign-the-bundle gate** — the biggest call on the board. Fable's v2 corpus (deterministic/portable IDs, substrate decision, transition plan, umbrella) is drafted and adversarially reviewed, but not yet ripe: the transition plan wants your **frame-review at round 1**, and several gap workstreams (Architecture E, endowment, liability, privacy/HNDL, governance) are still to be written before the freeze bundle closes. Nothing for me to queue as a fork yet — flagging that when Fable brings it to the gate, it reframes item 3 above and reopens the v1 freeze. I'm tracking it as the tallest In-Flight pole. See [[Kanban]] + [[deterministic-ids]].
- **Designs folder needs a tombstone pass.** Most of the `sdk-*` design corpus (minimal-clicks, one-signature-writes, read-surface, wallet-architecture, write-ux, web3-bytesstore-followup, etc.) has now **landed in code** (contracts `main` + SDK `chore/scaffold`). They're owned by the design/SDK agents, so I've left their bodies alone — but say the word and I'll mark the shipped ones `#status/landed` with a pointer to what merged, so the folder reflects reality. (List + my read of each in chat.)
- Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]] (then I formalize it)
- Promote [[brainstorm-system]] when you're happy with it

## ℹ️ FYI (no action)

- **Board reconciled to reality (2026-07-01).** Kanban Backlog pruned of everything that shipped (holistic-review→freeze→Sepolia, Lists, hackathon logistics, onboarding/flyers, Sepolia deploy all done). In Flight is now just the SDK build + the holistic-review tracker. Recent `main` landings moved to Done: WHITEOUT/FS-deletion (10th schema, additive), burner session (#39), easy-edits (#41), post-seal retry (#40). Detail in [[Decisions]].
- **Contracts branch hygiene:** ~25+ merged `codex/*` + old feature branches (custom-lists, markdown-for-items, onchain-*, editions-to-lenses, various codex/sepolia-*) can be pruned on GitHub whenever. Cosmetic, not blocking.

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

This file exists to make James's decision queue **scannable in 10 seconds**. James found a flat list of 12 mixed bullets unreadable (2026-05-28) — so the file is sorted by what it asks of him, not by date.

Place each item in the right section:

- **⚡ DECIDE NOW** — genuine forks only. Phrase as a numbered question with lettered options and a PM recommendation. James should be able to reply "1a, 2b" and be done. Keep this section SHORT; if it has more than ~4 items, the most important ones are getting buried.
- **🕐 WHEN YOU HAVE TIME** — reviews / promotions that aren't time-critical. One line each.
- **ℹ️ FYI** — things James should know but that need no action. Collapse aggressively; one or two lines total, pointing at [[Decisions]] for detail. Do NOT let FYIs accumulate as separate bullets.

Rules:

- **Prune ruthlessly.** When James acts on an item, delete it (git history is the archive). Stale items are the enemy — they're what made this file unreadable.
- **A decision is a fork James picks.** Status updates, things-in-progress, and PM observations are NOT decisions — they go in [[Decisions]] or `Daily Notes/`, not here.
- **Empty DECIDE NOW = James has nothing blocking him.** That's the goal state.
- **WIP limit:** if DECIDE NOW has 3 awaiting-promotion items, don't queue more promotions (per [[conventions#WIP limits]]).
