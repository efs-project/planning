# For James

- **Lists merge ETA still unknown** — In Flight card claimed by @james (custom-lists branch). PM needs at minimum a days/weeks bracket to plan around. T-11 days to OnionDAO; everything downstream (schema freeze, .sol freeze, Sepolia deploy, SDK implementation) stalls without this number. Added 2026-05-21 by @pm.
- **Spin up the SDK architecture design thread** — full prompt drafted in chat 2026-05-21 (per [[Decisions]]). Paste into a new agent session whenever ready.
- **OK to expand Milestones.md OnionDAO section with sub-decisions checklist?** (venue, prizes, judging, onboarding docs, comms plan) — PM-proposed in chat 2026-05-21; awaiting your nod before editing milestone scope per [[Agents/pm|SOUL § Autonomy boundaries]].
- **Review/promote [[Agents/pm|pm.md]] SOUL** when you have a few minutes.

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

When you produce something James needs to look at, append a bullet at the **top of this file** (above the `---` separator). One line, clearly actionable:

```markdown
- **Awaiting promotion: [[design-slug]]** — read & promote per [[design-system#Promotion ceremony]]. Added 2026-05-21.
- **Blocked on decision: [[some-design]]** — needs your call on X (see `## Open questions` in the design). Added 2026-05-21.
- **#needs/james flag in [[some-design]]** — quick question about Y. Added 2026-05-21.
```

Conventions:

- **Top of file = most recently added.** James scans top-down.
- **One line each.** Description + link + date. No nested bullets.
- **Remove your item** when James has acted on it (don't archive; the commit history is the archive).
- **Empty file is the goal state** — anything above the `---` separator means James has work waiting.
- **WIP limit:** 3 ready-for-promotion items at any time (per [[conventions#WIP limits]]). If this file has 3 awaiting-promotion items, stop queuing new ones until James clears one.

Don't put low-priority observations here. Use [[Decisions]] for one-line decisions you made yourself, `Daily Notes/` for ephemeral notes, design-file `## Open questions` for trackable items inside a design.
