# Milestones

Cross-repo milestone tracking for EFS. Each section names a target with a date and the designs / Kanban items that must land for it to be hit.

**How to use this file** (for agents and James):

- Add a section per milestone. `## Milestone name (YYYY-MM-DD)`.
- Under each, list the designs (`[[NNNN-slug]]`) and the Backlog Kanban items required for that milestone.
- When a design or item lands, check it off rather than removing it (keeps history visible).
- A milestone is "hit" when all checkboxes check. Move closed milestones to the bottom under `## History`.

**Owners**: James adds/edits scope. Agents may check off completed items as part of their landing-ceremony commit but should not edit a milestone's scope without James's say-so (it's a Tier 1 action — see [[escalation]]).

---

## Devnet launch (2026-04-19)

*(empty — populate as launch checklist solidifies)*

### Required

*(designs and Backlog items that must land)*

### Stretch

*(nice-to-have)*

### Out of scope (deferred to mainnet or later)

*(items explicitly NOT blocking devnet)*

---

## Mainnet (date TBD)

*(populate when devnet is closer)*

---

## History

*(closed milestones go here as one-line summaries with their landing date)*

---

## Notes

- The contracts repo has `LAUNCH_CHECKLIST.md` covering contract-specific launch blockers. That file is authoritative for contracts-side blockers; this file is the cross-repo rollup.
- Until populated, agents working on devnet-blocking items should still tag `#blocked-on/<thing>` if blocked and the `#repo/<name>` tag, but don't need to update this file. Milestone-scope discussion happens with James in chat.
