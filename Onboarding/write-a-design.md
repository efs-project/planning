# Writing a design

Walkthrough from idea to landed code. Canonical rules: [[design-system]].

## The most important rule

> ⚠️ **DO NOT NUMBER YOUR OWN DRAFT.**
>
> Save as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony; self-numbering bypasses the review gate and James will reject the design.

## Step-by-step

### 1. Check no one else is drafting the same thing

Check `Designs/README.md` (curated map by topic and status), `Kanban.md` Backlog entries tagged `#kind/design`, and recent commits to `Designs/`. On overlap, raise in chat before drafting.

### 2. Open a draft

After `git fetch origin && git rebase --autostash origin/main`: `cp Designs/_template.md Designs/<descriptive-slug>.md`. The slug is **descriptive** (`offline-sync`, `sdk-cache-eviction`), not generic (`design-v2`); it can change later, since Obsidian auto-updates `[[wiki-links]]` on rename.

Add a Kanban entry under **Backlog**:

```markdown
- [ ] Draft: <slug> #kind/design #repo/<each-target> — @<agent>, started YYYY-MM-DD
```

### 3. Fill the front-matter and tags

```markdown
# <Title>

**Status:** draft
**Target repos:** (any subset of: planning, contracts, client, sdk)
**Depends on:** — (optional)
**Supersedes:** — (optional)
**Reviewers:** — (filled in by reviewing agents as `@<agent> (YYYY-MM-DD)` when they finish a review pass)
**Last touched:** YYYY-MM-DD — (optional; Obsidian Bases derives this from file mtime)

#status/draft #kind/design #repo/<each-target>
```

Prose `**Status:**` and the `#status/` tag must agree — half of the [[Glossary#Tri-sync invariant]] (filename, the third element, only matters at promotion).

### 4. Write the design

Sections (from `_template.md`): **Problem** (what we're solving, why now), **Proposal**, **Open questions** (`- [ ]` checkboxes for trackable unresolved items), **Pre-promotion checklist** (leave the template version), **Implementation notes** (optional; multi-repo PR tracking).

Link forms — wiki-links in-vault, `[[Glossary#term]]` for terminology, relative markdown links out: [[conventions]]. Commit message: `design: draft <slug> — <short title>`.

### 5. Request review

Set prose `**Status:** review` + tag `#status/review`, commit + push, mention in chat ("DESIGN-`<slug>` ready for review").

Other agents comment by editing the file — in `## Open questions` or as inline `<!-- AGENT-Q: ... -->` markers. Iterate; resolve open questions (`- [ ]` → `- [x]` with a one-line resolution note).

### 6. Prepare for promotion

When all `## Open questions` are resolved or explicitly deferred: fill the `## Pre-promotion checklist` (check every box you can; cite deferred items), set prose `**Status:** ready-for-promotion` + tag `#status/ready-for-promotion`, commit + push, mention in chat. Then **wait** — promotion is human-only.

### 7. Promotion ceremony

James (or an agent acting on his explicit trust token):

1. Reads the design and the pre-promotion checklist.
2. Writes the trust token in the design body: `Promoted by @james on YYYY-MM-DD`.
3. In a **single** commit: `git mv Designs/<slug>.md Designs/NNNN-<slug>.md`; prose `**Status:**` → `accepted`; tag → `#status/accepted`; `Designs/README.md` content map moves the entry from "Ready for promotion" to "Accepted (numbered, in effect)"; Kanban drops the `Draft: <slug>` Backlog entry and gains per-repo implementation cards. Subject: `promote: DESIGN-NNNN — <title>`. Push.
4. Obsidian auto-renames in-vault `[[<slug>]]` references; cross-repo references need a separate cleanup pass.
5. Audit with `./scripts/promotion-check.sh` (trust token, atomic rename, subject format).

James may delegate the `git mv` to an agent — the trust token in the commit body is what makes the ceremony un-forgeable.

### 8. Implement

Per target repo, add a Backlog Kanban entry:

```markdown
- [ ] Implement [[NNNN-<slug>]] in contracts #repo/contracts
```

Move to **In Flight** with the claim annotation when you start, **Under Review** when the PR opens. On merge, check off the PR in the design's `## Implementation notes` (`- [x] contracts#412 — merged 2026-05-19`) in the same session.

### 9. Land — the full ceremony

When ALL PRs in `## Implementation notes` are merged:

**a) Confirm the design is truly done.** Every PR merged; no orphan TODOs in target-repo code; no `<!-- AGENT-Q: -->` markers anywhere; no `## Open questions` still open (or all explicitly deferred to follow-up designs).

**b) Write the ADR(s) in each target repo.** Each repo that received code typically gets one ADR at `<repo>/docs/adr/NNNN-<slug>.md`, numbered from **that repo's** ADR sequence (repos number independently — not the design's number), linking back to the planning design:

```markdown
# ADR-NNNN: <Title scoped to this repo's slice>

**Status:** accepted
**Date:** YYYY-MM-DD
**Related:** [[DESIGN-NNNN]] (`../../planning/Designs/NNNN-<slug>.md`), PR #<num>

## Context
## Decision
```

The agent who landed that repo's PR normally writes that repo's ADR — a 3-repo design means 3 ADRs, possibly across sessions.

**c) Tombstone the planning design.** Once all per-repo ADRs exist, replace the body of `planning/Designs/NNNN-<slug>.md` with:

```markdown
# DESIGN-NNNN: <Title>

**Status:** landed
**Canonical references:**
- `contracts/docs/adr/0044-<adr-slug>.md`

Landed YYYY-MM-DD. Original design: see git history.
```

Update tag: `#status/landed`. Commit message: `land: DESIGN-NNNN — <title>`.

**d) Cross-repo back-link cleanup.** If the slug ever changed, grep siblings for the old name and repoint hits at the new tombstone path. From inside `planning/`:

```bash
grep -rn "DESIGN-NNNN-old-slug\|old-slug.md" . ../contracts ../client ../sdk 2>/dev/null
```

Manual until `scripts/rename-design.sh` exists (planned).

**e) Kanban sweep.** Move all per-repo cards (and any meta-card) for this design to **Done**.

**f) Update `Owner-Inbox.md` and `Decisions.md` if relevant.** Add a line to `Decisions.md` if the resolution is worth a one-line decision; check off any `#needs/owner` item the landing freed up.

**Single commit for the planning side** (steps c–f); per-repo ADR writes (step b) live in those repos' own commits. ADRs go first — tombstoning before they exist leaves broken links.

### 10. (If abandoned or rejected)

- `abandoned` — scope shifted, etc. May be revived later.
- `rejected` — hard veto from James. Do not revive without a new argument addressing the veto.

Either way leave the file in place (don't delete) so `[[<slug>]]` references stay resolvable; update status and add a one-line explanation at the top.

## Common mistakes (top three)

1. **Numbering your own draft.** Never `0007-<slug>.md` yourself.
2. **Forgetting the tag when changing prose status** (or vice versa). Tri-sync requires both in the same commit.
3. **Editing only the design without updating Kanban.** If the card doesn't move, James doesn't see the state change.
