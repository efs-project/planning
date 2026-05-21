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
- @claude-opus-4.7: tier-4 pass — Milestones.md scaffolded, _Index.base seeded with starter queries, scripts/pre-commit-hook.sh shipped (optional install). End-to-end lifecycle + first-time reader subagents flagged: `/efs/` paths are aspirational vs. actual; bootstrap state not acknowledged anywhere; `#needs/james` tag was undocumented; landing ceremony step (d) used forbidden absolute path; Reviewers field missing from write-a-design's frontmatter snippet. All fixed in this commit. Remaining un-fixed items (length guidance, pseudo-code placement, reviewer-threading conventions) deferred as judgment calls vs. mechanical rules.
- @claude-opus-4.7: For-James.md restructured (actionable items at top, agent docs below separator) + DESIGN-0001 promoted (design-system → 0001-design-system). First promotion in vault. Trust token recorded in commit d88e8f7. promotion-check.sh passes.
- @claude-opus-4.7: Milestones populated from James's chat input — OnionDAO hackathon (2026-06-01, month of June, two tracks: datasets + SDK builds, self-funded prizes) is the next big target. Hard prerequisites: schema spec freeze, contract .sol file list freeze, core deployed to Sepolia, SDK MVP. Data-loss tolerance recorded as phase-dependent (Sepolia best-effort, mainnet strict). Devcon presentation 2026-11 noted as further-out, scope open.
- @claude-opus-4.7: Cross-repo follow-ups. (1) Opened https://github.com/efs-project/contracts/pull/19 — adds a "Cross-repo coordination" section to contracts/AGENTS.md pointing at the planning vault. (2) Planning vault updates: SDK scope clarified (on-chain + off-chain are OnionDAO-required; client SDK deferred; contracts NOT part of SDK), dedicated SDK design session expectation noted, AI-PM role expectation captured, Kanban Backlog re-prioritized with explicit OnionDAO-blocking items (.sol file freeze, schema freeze, Sepolia deploy, SDK MVP).
