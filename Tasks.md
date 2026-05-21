# Tasks rollup

Two highest-value global queries over `- [ ]` checkboxes across the vault. Powered by the Obsidian Tasks plugin; updates live as you make changes.

If you're reading this in plain markdown (no Tasks plugin), the queries below render as code blocks. Use the CLI fallbacks for equivalent grep-based views, or the scripts under `scripts/` for richer rollups.

---

## Open questions across all designs

What's unresolved in designs currently in `draft`, `review`, or `accepted` (post-acceptance Open Questions per [[conventions#Post-acceptance Open Questions]]).

````tasks
not done
path includes Designs
heading includes Open questions
sort by path
````

**CLI fallback:** `grep -rn "^- \[ \]" /efs/planning/Designs/ | grep -v _template`

---

## Blocked on a human decision

Anything tagged `#blocked-on/human-decision` across the vault.

````tasks
not done
description includes #blocked-on/human-decision
````

**CLI fallback:** `grep -rn "#blocked-on/human-decision" /efs/planning/ --include="*.md"`

---

## Other observability tools

Beyond the two queries above, prefer the shell scripts for these views (richer output, no plugin dependency):

| Need | Tool |
|---|---|
| Designs awaiting promotion (with WIP-limit awareness) | `./scripts/designs-awaiting-promotion.sh` |
| Stale In Flight Kanban cards (past expiry) | `./scripts/stale-cards.sh` |
| Tri-sync invariant + self-numbered-draft detection | `./scripts/tri-sync-check.sh` |
| Per-agent activity, last N days | `./scripts/agent-activity.sh [days]` |
| Promotion-ceremony integrity (trust token, rename, subject) | `./scripts/promotion-check.sh` |
| Items waiting on James specifically | [[For-James]] |

The Tasks plugin only renders queries when this file is opened in Obsidian. Plain Markdown viewers (GitHub web) render the `tasks` fences as code blocks. That's acceptable — the queries are for James's Obsidian view; agents use grep or the scripts.
