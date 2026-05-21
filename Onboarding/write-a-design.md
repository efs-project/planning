# Writing a design

Full lifecycle of an EFS design proposal — from "I have an idea" to landed code. The canonical rules live in [[design-system]]; this file is the walkthrough.

## The most important rule

> ⚠️ **DO NOT NUMBER YOUR OWN DRAFT.**
>
> Save your file as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony. If you self-number, you bypass the promotion process and the review gate. James will reject the design and ask you to re-do.

## Step-by-step

### 1. Check no one else is drafting the same thing

Before opening a new draft, look at:
- `Designs/_MOC.md` — what's in flight by topic
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

### 9. Land

When ALL PRs check, the design is `landed`. Replace the design body with a tombstone:

```markdown
# DESIGN-NNNN: <Title>

**Status:** landed
**Canonical references:**
- contracts/docs/adr/NNNN-<adr-slug>.md
- client/docs/adr/MM-<adr-slug>.md

Original design: see git history.
```

Update tag: `#status/landed`. Commit + push. Move the Kanban card to Done.

### 10. (If abandoned or rejected)

If the design is no longer being pursued:

- `abandoned` — we got bored, scope shifted, etc. May be revived later.
- `rejected` — hard veto from James. Do not revive without new argument addressing the veto.

In either case, leave the file in place (don't delete) so `[[<slug>]]` references stay resolvable. Update status, add a one-line explanation at the top.

## Common mistakes (top three)

1. **Numbering your own draft.** See the warning at the top. Never `0007-<slug>.md` yourself.
2. **Forgetting the tag when changing prose status** (or vice versa). The tri-sync invariant requires both in the same commit. The pre-promotion checklist catches this at promotion; catch it earlier yourself.
3. **Editing only the design without updating Kanban.** The Kanban card is the attention tracker; if it doesn't move, James doesn't see the state change.
