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

### Agent identity trailer

In addition to `Co-authored-by:`, **include an `Agent: <slug>` trailer** in every agent-authored commit. The slug is a stable identifier for the agent + role (not the model version), so it's grep-friendly across `git log` and survives model upgrades:

```
Agent: claude-opus-4.7
Agent: codex-gpt-5
Agent: claude-haiku-3.5 (review)
```

This unlocks per-agent activity views via `git log --grep='^Agent: claude'` without parsing vendor noreply emails. The trailer is required for agent-authored commits; James's manual commits via the Obsidian UI don't need it.

## Tag vocabulary

Plain `#kebab-case-text`. Obsidian indexes automatically; agents grep. Canonical set:

| Tag | Use |
|---|---|
| `#repo/contracts`, `#repo/client`, `#repo/sdk`, `#repo/planning` | Target codebase. Multi-repo work gets multiple tags. |
| `#kind/design`, `#kind/task`, `#kind/question`, `#kind/decision`, `#kind/note` | Artifact type. |
| `#status/draft`, `#status/review`, `#status/ready-for-promotion`, `#status/accepted`, `#status/landed`, `#status/abandoned`, `#status/rejected` | Lifecycle of a design. |
| `#blocked-on/<thing>` | Blocker (e.g. `#blocked-on/DESIGN-0007`, `#blocked-on/human-decision`, `#blocked-on/concrete-CI-need`). |
| `#depends-on/<thing>` | Soft dependency between designs or tasks. |
| `#needs/james` | Tag on a specific `- [ ]` Open Questions item or AGENT-Q comment that requires James's input. Surfaced via [[For-James]]. |

No spaces, kebab-case, lowercase. Obsidian treats whitespace as a tag terminator.

New tags are fine when nothing existing fits — add to this table in the same commit so other agents find them.

## Tri-sync invariant

Three places must agree for design status: prose `**Status:**`, tag `#status/`, and (post-promotion) filename. All three change in the same commit. Filename only changes at promotion.

**Canonical definition: [[design-system#Tri-sync invariant]].** Mechanical check: `scripts/tri-sync-check.sh` (also catches self-numbered drafts).

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

Use markdown form with a path **relative to the file you're writing in.** Markdown links are file-relative, not vault-rooted.

From a vault-root file (`planning/Tasks.md` etc.):

```markdown
see [ADR-0041](../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)
```

From a file one level deep (`planning/Designs/foo.md`, `planning/Onboarding/foo.md`):

```markdown
see [ADR-0041](../../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)
```

The `../` count varies by file depth. If a link doesn't resolve when you click it in Obsidian or follow it on GitHub web, you've miscounted.

Out-of-vault links do NOT auto-update on file renames in the target repo. Rename-cleanup is a manual or scripted pass.

## Task list vs Kanban vs design — three altitudes

These three artifacts coexist on purpose. They're not redundant; they're at different altitudes. The single biggest failure mode is letting the same fact live in two places and drift.

| Altitude | Artifact | What it tracks |
|---|---|---|
| Durable | `Designs/*.md` | Proposals → accepted → landed history. The "why" of architectural decisions. |
| Flow | `Kanban.md` columns | Work-stream state right now: Backlog → In Flight → Blocked → Under Review → Done. WIP-disciplined. |
| Detail | `- [ ]` task checkboxes | Execution-level items inside a design (`## Open questions`), inside a Daily Note, or inside any file. Rolled up globally by the Obsidian Tasks plugin (see [[Tasks]]). |

Rules of thumb:

- **A Kanban card is a discipline-bearing object** — has an owner, a claim with TTL, a WIP-limited column. Use it for things that need flow tracking and one identifiable owner.
- **A design `## Open questions` checkbox** is for trackable items bound to a specific decision. They get answered before the design promotes (or carried forward as `### Post-acceptance`).
- **A `- [ ]` in `Daily Notes/` or another file** is a personal/ephemeral todo. Useful but uncoordinated; not visible as project state.

If you find yourself recording the same fact in two of these places, pick one and reference it from the other. **State duplication is the bug; multiple artifacts is the feature.**

## WIP limits

Kanban only works with WIP limits. The single human reviewer is the bottleneck; left unlimited, agents will accumulate work-in-progress faster than James can review it. Three soft limits, agent-honored not mechanically enforced:

| Limit | Where | Why |
|---|---|---|
| **3** designs in `#status/ready-for-promotion` | Across all of `Designs/` | James's promotion-ceremony queue. Hitting 3 means agents must wait or help James promote before adding more. |
| **5** cards in **Under Review** | `Kanban.md` Under Review column | James reviews PRs too. 5 PRs in review across all repos is already a lot. |
| **2** In Flight cards per agent | `Kanban.md` In Flight, by claim annotation | Keeps each agent focused on something they can finish. |

When a limit is hit, an agent that wants to add to that column must either:

- finish or unblock an existing card in that column first, OR
- surface in chat ("ready-for-promotion is at 3; can we promote one before I add another?")

Limits exist to make the bottleneck visible, not to block work — but breaking them without acknowledging the bottleneck just hides it.

## Kanban entries

In Flight card format:

```markdown
- [ ] Implement [[0007-offline-sync]] #repo/client
  — @claude-opus-4.7, branch claude/offline-sync, claimed 2026-05-21, expires 2026-05-24
```

3-day default expiry on In Flight cards. After expiry, any agent (or James) can reclaim. Update the expiry whenever you touch the card.

Drafts-in-flight format (in Backlog):

```markdown
- [ ] Draft: offline-sync #kind/design #repo/client — @claude-opus-4.7, started 2026-05-21
```

### One card per PR per repo

A design that targets multiple repos gets **one card per repo**, not one card for the whole design. The cards cross-link to `[[NNNN-design-slug]]`; the design file itself is the cross-cutting tracker (see `Design file owns multi-repo truth` below).

Example: `[[0007-offline-sync]]` targets `client` and `sdk`. Two cards in flight:

```markdown
- [ ] Implement [[0007-offline-sync]] in client #repo/client
  — @claude-opus-4.7, branch claude/offline-sync-client, claimed 2026-05-21, expires 2026-05-24
- [ ] Implement [[0007-offline-sync]] in sdk #repo/sdk
  — @codex-gpt-5, branch codex/offline-sync-sdk, claimed 2026-05-21, expires 2026-05-24
```

### Under Review and Blocked cards do NOT auto-expire

Only **In Flight** cards have the 3-day TTL. Cards in **Under Review** (PR open) and **Blocked** (waiting on something) have no expiry and **cannot be reclaimed without asking in chat first**. PRs can legitimately sit in review for weeks; blockers can persist for days. The expiry semantics exist specifically to surface silently-abandoned active work.

If an Under Review card looks stale (e.g., PR untouched for 7+ days), surface in chat rather than reclaiming.

### Design file owns multi-repo truth

For multi-repo designs, the design file's `## Implementation notes` carries the PR checklist:

```markdown
- [x] contracts#412 — merged 2026-05-19
- [ ] client#88 — in review
- [ ] sdk#15 — not started
```

**The commit that merges a PR for DESIGN-NNNN must also update DESIGN-NNNN's checklist in the same session.** Kanban tracks attention (what work-stream is active); the design file tracks truth (where the whole design stands). If the checklist drifts from PR reality, the design's `landed` status will be wrong.

Until a PR-sync bot exists, this convention is the only thing keeping design state honest.

### Post-acceptance Open Questions

Once a design is `accepted`, the body is nominally frozen. But implementation reveals new questions that need recording. **Append a dated subhead to the existing `## Open questions` section:**

```markdown
## Open questions

(pre-acceptance questions, all resolved)
- [x] Should we support both X and Y? — only X, resolved 2026-05-15.

### Post-acceptance (2026-06-03 / @claude-opus-4.7)
- [ ] Discovered during implementation: the foo-bar interaction needs a tiebreaker. Proposed: lexicographic by attester address. Awaiting confirmation. #needs/james
```

Questions surfaced post-acceptance feed the same Tasks plugin rollup and reach James the same way. If a post-acceptance question changes the design's substance, the implementing agent must either update the design body (drift discipline, see [[design-system]]) or open a new design that supersedes.

### Preserving the Obsidian Kanban plugin format

`Kanban.md` is parsed by the Obsidian Kanban plugin, which needs three things to render correctly:

1. **YAML frontmatter** at the top:
   ```yaml
   ---
   kanban-plugin: board
   ---
   ```
2. **`## Column-name` H2 headers** for each column. Order in the file = order on the board.
3. **Settings footer** at the bottom:
   ```markdown
   %% kanban:settings
   ```
   {"kanban-plugin":"board","list-collapse":[false,false,false,false,false]}
   ```
   %%
   ```
   The `list-collapse` array length **MUST equal the number of columns**. Adding a column means adding a `false` entry; removing means removing one.

When editing `Kanban.md`, never strip the frontmatter, never delete the footer, and always update `list-collapse` if you change the column count. Plain-markdown viewers (GitHub web) render this fine; it only matters to Obsidian's board view, which is what James uses.

## Daily check-ins

Active agents append once per work-session to `Daily Notes/agent-status.md`:

```markdown
## 2026-05-21
- @claude-opus-4.7: offline-sync — finished proposal section, opening for review
- @codex-gpt-5: sdk-core — blocked on offline-sync acceptance
```

Lets James scan project state quickly.

## Pre-promotion checklist

Every design carries this section near the bottom. **Canonical form: [[_template#Pre-promotion checklist]].** Fill it before requesting promotion; James scans rather than re-reads the whole design.

## Promotion commit shape

Single commit:

- `git mv Designs/<slug>.md Designs/NNNN-<slug>.md`
- Tri-sync edit (prose Status, tag, Kanban entry)
- Commit message: `promote: DESIGN-NNNN — <title>`
- Commit body includes the literal trust token: `Promoted by @james on YYYY-MM-DD`

Any deviation = manual review. Mechanical check: `scripts/promotion-check.sh` audits recent `promote:` commits for the trust token, atomic rename, and subject format.

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
