# Conventions

Deep reference for the vault's conventions. The canonical rules live in [[design-system]]; this file is the per-convention quick-lookup.

## Git sync

Before reading or writing in this vault:

```bash
cd /efs/planning
git pull --rebase
```

When a unit of work is done (a Kanban move, a finished draft, a status change, an answered question):

```bash
git add <files>
git commit -m "<area>: <imperative summary>"
git push
```

On push rejection (someone else pushed first):

```bash
git pull --rebase
# resolve conflicts (Kanban.md is the likely victim)
git push
```

If a rebase gets gnarly (>5 minutes of resolving), back off — surface in chat. Don't force-push.

## Commit-message style

`<area>: <imperative summary>`. Areas seen in the wild: `design`, `kanban`, `docs`, `chore`, `promote`, `sync` (for the bot-driven Reference/ mirror, if/when it ships).

Include a `Co-authored-by:` trailer naming the agent that wrote it:

```
design: draft offline-sync — describe the offline sync proposal

Body paragraph or two.

Co-authored-by: Claude Opus 4.7 <noreply@anthropic.com>
```

Vendor noreply emails: `noreply@anthropic.com`, `noreply@openai.com`, `noreply@google.com`. For others, use `noreply@<vendor-domain>`.

## Tag vocabulary

Plain `#kebab-case-text`. Obsidian indexes automatically; agents grep. Canonical set:

| Tag | Use |
|---|---|
| `#repo/contracts`, `#repo/client`, `#repo/sdk`, `#repo/planning` | Target codebase. Multi-repo work gets multiple tags. |
| `#kind/design`, `#kind/task`, `#kind/question`, `#kind/decision`, `#kind/note` | Artifact type. |
| `#status/draft`, `#status/review`, `#status/ready-for-promotion`, `#status/accepted`, `#status/landed`, `#status/abandoned`, `#status/rejected` | Lifecycle of a design. |
| `#blocked-on/<thing>` | Blocker (e.g. `#blocked-on/DESIGN-0007`, `#blocked-on/human-decision`, `#blocked-on/concrete-CI-need`). |
| `#depends-on/<thing>` | Soft dependency between designs or tasks. |

No spaces, kebab-case, lowercase. Obsidian treats whitespace as a tag terminator.

New tags are fine when nothing existing fits — add to this table in the same commit so other agents find them.

## Tri-sync invariant

Three places must agree for design status:

- [ ] Prose `**Status:** X`
- [ ] Tag `#status/X`
- [ ] Filename (`<slug>.md` pre-promotion, `NNNN-<slug>.md` post-promotion)

All three change in the same commit. Filename only changes at promotion.

## Path conventions

| Use case | Form | Example |
|---|---|---|
| In-vault references | `[[wiki-link]]` (no extension) | `[[design-system]]`, `[[Glossary#TAG]]` |
| Out-of-vault references in prose | repo-relative, no `/efs/` prefix | `contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md` |
| Out-of-vault links | vault-rooted relative path | `[ADR-0041](../contracts/docs/adr/0041-...)` |
| Shell commands | whatever `pwd` requires | `cd ../contracts && git status` |

**Never use absolute `/efs/...` paths in committed files.** Bakes in a mount point; breaks for any agent on a different layout.

## Wiki-link form

Inside the vault: `[[filename]]` (no extension).

- `[[design-system]]` — link to the design-system design.
- `[[Glossary#TAG]]` — link to a specific glossary anchor.
- `[[design-system|the meta-design]]` — alias form when prose reads better.

Obsidian auto-updates these when a file is renamed. This is why we use them inside the vault.

## Linking out of the vault

Use markdown form with a vault-rooted relative path:

```markdown
see [ADR-0041](../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)
```

These do NOT auto-update on file renames in the target repo. Rename-cleanup is a manual or scripted pass.

## Kanban entries

In Flight card format:

```markdown
- [ ] Implement [[0007-offline-sync]] #repo/client #repo/sdk
  — @claude-opus-4.7, branch claude/offline-sync, claimed 2026-05-21, expires 2026-05-24
```

3-day default expiry. After expiry, any agent (or James) can reclaim. Update the expiry whenever you touch the card.

Drafts-in-flight format (in Backlog):

```markdown
- [ ] Draft: offline-sync #kind/design #repo/client — @claude, started 2026-05-21
```

## Daily check-ins

Active agents append once per work-session to `Daily Notes/agent-status.md`:

```markdown
## 2026-05-21
- @claude-opus-4.7: offline-sync — finished proposal section, opening for review
- @codex-gpt-5: sdk-core — blocked on offline-sync acceptance
```

Lets James scan project state quickly.

## Pre-promotion checklist

Every design carries this section near the bottom (template includes it). Fill before requesting promotion:

```markdown
## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
```

## Promotion commit shape

Single commit:

- `git mv Designs/<slug>.md Designs/NNNN-<slug>.md`
- Tri-sync edit (prose Status, tag, Kanban entry)
- Commit message: `promote: DESIGN-NNNN — <title>`
- Commit body includes the literal trust token: `Promoted by @james on YYYY-MM-DD`

Any deviation = manual review.

## Open questions inline

Inside a design file:

```markdown
## Open questions

- [ ] Should we support both X and Y, or only X?
- [x] Is the foo limit per-user or global? — global, per ADR-0026 (resolved 2026-05-21).
```

The Obsidian Tasks plugin rolls these into a global view for James.

For Tier 1/2 questions about cross-cutting planning concerns (not tied to one design), open a new design with `#kind/question` if it deserves lifecycle. Otherwise `Daily Notes/`.

## When in doubt

Surface in chat with James before doing. Cost of asking is ~1 chat turn; cost of stomping a convention is hours of cleanup.
