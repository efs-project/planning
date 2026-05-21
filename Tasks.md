# Tasks rollup

Global queries over `- [ ]` checkboxes across the vault. Powered by the Obsidian Tasks plugin. Updates live as you make changes.

If you're an agent reading this file via plain markdown (no Tasks plugin), the queries below render as code blocks rather than executing. Use the CLI fallbacks (also listed) for equivalent grep-based views.

---

## Open questions across all designs

What's unresolved in designs currently in `draft` or `review`. James scans this regularly.

````tasks
not done
path includes Designs
heading includes Open questions
sort by path
````

**CLI fallback:** `grep -rn "^- \[ \]" /efs/planning/Designs/ | grep -v _template`

---

## Pre-promotion checklist progress

Designs in `#status/ready-for-promotion` whose pre-promotion checklist isn't fully checked. Filter rows you read; promotion blocked until all boxes check.

````tasks
not done
heading includes Pre-promotion checklist
group by file.path
````

**CLI fallback:** `for f in /efs/planning/Designs/*.md; do echo "=== $f ==="; awk '/^## Pre-promotion checklist/,/^## /' "$f" | grep "^- \["; done`

---

## Blocked on a human decision

Anything tagged `#blocked-on/human-decision` across the vault.

````tasks
not done
description includes #blocked-on/human-decision
````

**CLI fallback:** `grep -rn "#blocked-on/human-decision" /efs/planning/ --include="*.md"`

---

## Drafts in flight (Kanban)

Cards in the Backlog or In Flight tagged `#kind/design` — drafts other agents have claimed. Check before starting a new draft on a similar topic.

````tasks
not done
path includes Kanban
description includes #kind/design
````

**CLI fallback:** `grep -A1 "#kind/design" /efs/planning/Kanban.md`

---

## Stale In Flight cards

Cards whose `expires` date is in the past. Reclaimable by any agent (with confirmation in chat for non-In-Flight cards per [[Onboarding/conventions]]).

(No good Tasks-plugin query for this without restructuring Kanban cards as files. CLI version below — once `scripts/stale-cards.sh` exists, use that.)

**CLI fallback:**
```bash
TODAY=$(date +%F)
grep -nE 'expires [0-9]{4}-[0-9]{2}-[0-9]{2}' /efs/planning/Kanban.md | \
  awk -v today="$TODAY" '{
    for (i=1; i<=NF; i++) if ($i == "expires") { d = $(i+1); gsub(",", "", d); if (d < today) print }
  }'
```

---

## Notes

- The Tasks plugin syntax above (`tasks` code fences) only works when this file is opened in Obsidian. Plain Markdown viewers render it as a fenced code block.
- Edit the queries in place if you find a new useful rollup. New queries should follow the same shape: heading + tasks block + CLI fallback.
- For per-agent activity views, see `scripts/agent-activity.sh` (Tier 3, planned). Tasks plugin can't filter by commit author.
