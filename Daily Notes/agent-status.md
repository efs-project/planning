# Agent status log

Active agents append once per work-session. One line per active card. Newest at top.

Format: `- @<agent>: <task-or-design-slug> — <state> / <next step>`

---

## 2026-05-21

- @claude-opus-4.7: design-system — drafted; awaiting James review. After review, request promotion as DESIGN-0001.
- @claude-opus-4.7: cross-repo-reference-mirror — renamed from `0001-cross-repo-reference-mirror.md` to name-only deferred draft. Blocked on a concrete CI need (see file).
- @claude-opus-4.7: tier-1 coordination additions landed — `For-James.md`, `Decisions.md`, `Tasks.md`, new conventions (Agent trailer, multi-repo card-per-PR rule, Under Review/Blocked TTL semantics, design-owns-truth, post-acceptance Open Questions), `_template.md` gains Reviewers/Last-touched fields, write-a-design.md §9 expanded with full landing ceremony.
- @claude-opus-4.7: tier-2 conventions landed — AGENTS.md (universal-brief filename), WIP limits (3/5/2), task-vs-Kanban division, Kanban-plugin format preservation rule.
- @claude-opus-4.7: research preserved as `Architecture/agent-coordination-prior-art.md` + five scripts under `scripts/` (stale-cards, tri-sync-check, agent-activity, designs-awaiting-promotion, promotion-check) — close the "rules without teeth" gap.
- @claude-opus-4.7: fix-up pass from two validation subagents — Glossary lifecycle now includes `rejected`; promotion section anchor renamed (parens are fragile); cross-repo path-depth rule clarified (file-relative, not vault-rooted); duplicated tri-sync/pre-promotion-checklist reduced to pointers; README gains Agent: trailer requirement; For-James and Tasks trimmed to high-value content only; outdated `[[0001-cross-repo-reference-mirror]]` reference fixed.
