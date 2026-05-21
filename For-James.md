# For James

- **Awaiting review: [[Agents/pm|pm.md]] SOUL file** — first PM session drafted it; status `#status/review`. Read, edit if needed, then promote per [[design-system#Promotion ceremony]] (or tell PM to revise). Added 2026-05-21.
- **Critical-path nudge: SDK architecture design has not started** — OnionDAO is T-11 days; SDK MVP requires this design to land before two implementation threads can begin. Backlog card: `Design: on-chain + off-chain SDK architecture`. Per [[Decisions]] 2026-05-21, this is a dedicated AI thread you initiate. Added 2026-05-21 by @pm.

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
