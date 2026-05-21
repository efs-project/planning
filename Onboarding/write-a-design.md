# Writing a design

Full lifecycle of an EFS design proposal — from "I have an idea" to landed code. The canonical rules live in [[design-system]]; this file is the walkthrough.

## The most important rule

> ⚠️ **DO NOT NUMBER YOUR OWN DRAFT.**
>
> Save your file as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony. If you self-number, you bypass the promotion process and the review gate. James will reject the design and ask you to re-do.

## Step-by-step

### 1. Check no one else is drafting the same thing

Before opening a new draft, look at:
- `Designs/README.md` — curated map of what's in flight by topic and status
- `Kanban.md` — Backlog entries tagged `#kind/design`
- Recent commits to `Designs/`

If you find overlap, raise in chat before drafting. Two parallel drafts on the same topic are a waste of work.

### 2. Open a draft

```bash
cd /efs/planning
git pull --rebase
cp Designs/_template.md Designs/<descriptive-slug>.md
```

The slug is **descriptive** (`offline-sync`, `sdk-cache-eviction`), not generic (`design-v2`). Slugs can change later without breaking references (Obsidian auto-updates `[[wiki-links]]` on rename).

Add a Kanban entry under **Backlog** so other agents know:

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

#status/draft #kind/design #repo/<each-target>
```

The prose `**Status:**` and the `#status/` tag must agree. This is half of the [[Glossary#Tri-sync invariant]] (the third element, filename, only matters at promotion).

### 4. Write the design

Sections (from `_template.md`):

- **Problem** — what we're solving, why now
- **Proposal** — the design itself
- **Open questions** — `- [ ]` checkboxes for trackable unresolved items
- **Pre-promotion checklist** — leave the template version; fill before requesting promotion
- **Implementation notes** — optional, especially for multi-repo PR tracking

Use `[[wiki-links]]` for in-vault references and `[[Glossary#term]]` for terminology. Use markdown links with vault-rooted relative paths for cross-repo references: `[ADR-0041](../../contracts/docs/adr/0041-...)`.

Commit message: `design: draft <slug> — <short title>`.

### 5. Request review

When you think the design is ready for other eyes:

- Update prose `**Status:** review`
- Update tag `#status/review`
- Commit + push
- Mention in chat ("DESIGN-`<slug>` ready for review")

Other agents may comment by editing the file (their comments belong in the design's `## Open questions` or as inline `<!-- AGENT-Q: ... -->` markers). James may comment in chat or in the file.

Iterate. Respond to questions. Resolve `## Open questions` items (`- [ ]` → `- [x]` with a one-line resolution note).

### 6. Prepare for promotion

When all `## Open questions` are resolved or explicitly deferred:

- Fill the `## Pre-promotion checklist` — check every box you can; cite deferred items.
- Update status: prose `**Status:** ready-for-promotion`, tag `#status/ready-for-promotion`.
- Commit + push.
- Mention in chat ("DESIGN-`<slug>` ready for promotion").

Then **wait**. Promotion is human-only.

### 7. Promotion (James does this)

James:

1. Reads the design and the pre-promotion checklist.
2. Writes a trust token in the design body: `Promoted by @james on YYYY-MM-DD`.
3. Runs:
   ```bash
   git mv Designs/<slug>.md Designs/NNNN-<slug>.md
   # edit Status, tag, Kanban entry — all in same commit
   git commit -m "promote: DESIGN-NNNN — <title>"
   git push
   ```
4. The Obsidian wiki-link auto-rename feature handles `[[<slug>]]` references in-vault. Cross-repo references need a separate cleanup pass (rare at this stage).

James may delegate the `git mv` step to an agent — the trust token in the commit body is what makes the ceremony un-forgeable.

After promotion, status is `accepted`. Filename has the number. You can now start implementation work.

### 8. Implement

In each target repo, do the work. Add a Backlog Kanban entry per repo:

```markdown
- [ ] Implement [[NNNN-<slug>]] in contracts #repo/contracts
```

When you start, move to **In Flight** with the claim annotation. When the PR opens, move to **Under Review**. When merged, check off the PR in the design file's `## Implementation notes`:

```markdown
- [x] contracts#412 — merged 2026-05-19
- [ ] client#88 — in review
```

### 9. Land — the full ceremony

When ALL PRs in the `## Implementation notes` checklist are merged, the design is ready to land. The landing ceremony has six steps that happen in roughly this order:

**a) Confirm the design is truly done.** Every PR in the checklist is `merged`; no orphan TODOs in target-repo code; no `<!-- AGENT-Q: -->` markers anywhere; no `## Open questions` items still open (or all explicitly deferred to follow-up designs).

**b) Write the ADR(s) in each target repo.** Each repo that received code from this design typically gets one ADR codifying the now-implemented decision. The ADR sits in `<repo>/docs/adr/NNNN-<slug>.md`, gets the next free number in that repo's ADR sequence (not the design's number — repos number independently), and links back to the planning design:

```markdown
# ADR-NNNN: <Title scoped to this repo's slice>

**Status:** Accepted
**Date:** YYYY-MM-DD
**Related:** [[DESIGN-NNNN]] (`../../planning/Designs/NNNN-<slug>.md`), PR #<num>

## Context
…

## Decision
…
```

The implementing agent who landed this repo's PR is usually the one to write that repo's ADR — they have the freshest context. If the design landed across 3 repos, you may end up writing 3 ADRs (potentially across different sessions if the merges were staggered).

**c) Tombstone the planning design.** Once all per-repo ADRs are written, replace the design body in `planning/Designs/NNNN-<slug>.md` with the tombstone form:

```markdown
# DESIGN-NNNN: <Title>

**Status:** landed
**Canonical references:**
- `contracts/docs/adr/0044-<adr-slug>.md`
- `client/docs/adr/0007-<adr-slug>.md`
- `sdk/docs/adr/0002-<adr-slug>.md`

Landed YYYY-MM-DD. Original design: see git history.
```

Update tag: `#status/landed`. Commit message: `land: DESIGN-NNNN — <title>`.

**d) Cross-repo back-link cleanup.** If your design's slug changed at any point (or if back-references in other designs use the old name), grep `../*/` for the old slug:

```bash
grep -rn "DESIGN-NNNN-old-slug\|old-slug.md" /efs/
```

Update any hits to point at the new tombstone path. Until `scripts/rename-design.sh` exists (deferred per [[design-system]]), this is a manual pass.

**e) Kanban sweep.** Move all per-repo cards for this design to **Done**. If you had a meta-card tracking the design itself (rare; most designs are tracked via the per-repo cards), move that to Done too.

**f) Update For-James.md and Decisions.md if relevant.** If the design's resolution should be discoverable as a one-line decision (e.g., "we now use lexicographic-by-attester-address as the tiebreaker"), add a line to `Decisions.md`. If the landing freed up a `#needs/james` item in `For-James.md`, check it off.

**Single commit for the planning side** (steps c-f). The per-repo ADR writes (step b) live in those repos' own commits. The order matters: ADRs go in first (they're what the tombstone points at), then the tombstone references them. If you tombstone before writing the ADRs, the tombstone has broken links.

### 10. (If abandoned or rejected)

If the design is no longer being pursued:

- `abandoned` — we got bored, scope shifted, etc. May be revived later.
- `rejected` — hard veto from James. Do not revive without new argument addressing the veto.

In either case, leave the file in place (don't delete) so `[[<slug>]]` references stay resolvable. Update status, add a one-line explanation at the top.

## Common mistakes (top three)

1. **Numbering your own draft.** See the warning at the top. Never `0007-<slug>.md` yourself.
2. **Forgetting the tag when changing prose status** (or vice versa). The tri-sync invariant requires both in the same commit. The pre-promotion checklist catches this at promotion; catch it earlier yourself.
3. **Editing only the design without updating Kanban.** The Kanban card is the attention tracker; if it doesn't move, James doesn't see the state change.
