# For James

- **CRITICAL FINDING: EFS Lists is the schema freeze and the .sol freeze** — branch `custom-lists` on contracts changes schema count 6→7, reworks PROPERTY semantics, adds `EdgeResolver.sol`, removes `TagResolver.sol`. The three Backlog items (Lists merge, schema freeze, .sol freeze) collapse into one keystone. Sepolia deploy is blocked on this. T-11 days. Added 2026-05-21 by @pm.
- **Need from you (4 threads or decisions):** (1) Lists merge ETA — drives the whole calendar. (2) Spin up SDK architecture design thread. (3) Hackathon logistics — see [[Kanban]] new "Plan OnionDAO hackathon logistics" card; many sub-decisions only you can make (prize amount, venue confirmation, judging, onboarding docs, comms). (4) Review/promote [[Agents/pm|pm.md]] SOUL.

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
