# For James

Single dashboard of items currently needing your attention. Agents append items when they need you; remove (or check off) once you've acted.

Empty file = nothing needs you. If this file grows beyond ~10 items, that's a signal agents are over-pinging or actions are accumulating — surface in chat.

---

## How to use this file (for agents)

At the end of any work session in which you produced something James needs to look at, append a bullet under one of these headings (create the heading if it doesn't exist):

- **Awaiting promotion** — a design moved to `#status/ready-for-promotion`. WIP limit 3 per [[conventions#WIP limits]]. Quick view: `./scripts/designs-awaiting-promotion.sh`.
- **Blocked on a decision** — an item tagged `#blocked-on/human-decision`.
- **Open questions flagged `#needs/james`** — design-bound questions explicitly waiting on James (vs. agent-resolvable).

Format: `- [[<source-file>]] — short description (added YYYY-MM-DD)`.

Commit + push as part of your session's final commit.

**Do not** put low-priority observations here. Use `Decisions.md` for one-line decisions you made yourself, `Daily Notes/` for ephemeral notes, and design-file `## Open questions` for trackable items inside a specific design.
