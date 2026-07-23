# Conventions

Per-convention quick-lookup. Canonical rules: [[design-system]].

## Git sync

Pull before reading or writing: `cd <your planning checkout> && git fetch origin && git rebase --autostash origin/main` (plain `pull --rebase` fails whenever another agent has uncommitted work — the normal state). Commit and push when a unit of work is done (Kanban move, finished draft, status change, answered question).

On push rejection: `git pull --rebase`, resolve conflicts (`Kanban.md` is the likely victim), push again. If a rebase gets gnarly (>5 minutes of resolving), back off and surface in chat. Never force-push.

## Commit-message style

`<area>: <imperative summary>`. Areas: `design`, `kanban`, `docs`, `chore`, `promote`, `land`, `sync` (bot-driven Reference/ mirror, if/when it ships), `pm` (PM-role coordination commits only).

**The subject prefix must reflect the authoring agent's role/area — it is NOT a free-form label.**

- **`pm:` is RESERVED for the PM role (slug `pm`).** A non-PM agent editing a PM-owned coordination file (`Owner-Inbox.md`, `Kanban.md`, `Daily Notes/agent-status.md`) uses its own area (`docs:` / `kanban:` / `design:`), never `pm:` — otherwise `git log --grep='^pm:'` falsely attributes work and phantom "second PMs" appear. (Happened 2026-05-28: `sdk-designer` used `pm:` subjects on For-James edits.)
- **Editing `Owner-Inbox.md` structure is PM work.** Other agents may *append a one-line surface entry* ("design X ready for review"), not restructure the decide-now framing or curate the queue; tag that commit with your own area.

Two trailers on every agent-authored commit: `Co-authored-by:` naming the model, and `Agent: <slug>` — a stable agent+role identifier (not the model version), grep-friendly and durable across model upgrades. Write the message to a file and `git commit -F` it.

```
design: draft offline-sync — describe the offline sync proposal

Body paragraph or two.

Co-authored-by: Claude Opus 4.7 <noreply@anthropic.com>
Agent: claude-opus-4.7
```

Other slug forms: `Agent: codex-gpt-5`, `Agent: claude-haiku-3.5 (review)`. Unlocks `git log --grep='^Agent: claude'`. Required for agent commits; James's manual Obsidian-UI commits are exempt.

Vendor noreply emails: `noreply@anthropic.com`, `noreply@openai.com`, `noreply@google.com`; otherwise `noreply@<vendor-domain>`.

## Tag vocabulary

Plain `#kebab-case-text` — no spaces, lowercase (Obsidian treats whitespace as a tag terminator). Canonical set:

| Tag | Use |
|---|---|
| `#repo/contracts`, `#repo/client`, `#repo/sdk`, `#repo/planning` | Target codebase. Multi-repo work gets multiple tags. |
| `#kind/design`, `#kind/task`, `#kind/question`, `#kind/decision`, `#kind/note` | Artifact type. |
| `#status/draft`, `#status/review`, `#status/ready-for-promotion`, `#status/accepted`, `#status/landed`, `#status/abandoned`, `#status/rejected` | Lifecycle of a design. |
| `#blocked-on/<thing>` | Blocker (e.g. `#blocked-on/DESIGN-0007`, `#blocked-on/human-decision`). |
| `#depends-on/<thing>` | Soft dependency between designs or tasks. |
| `#needs/owner` | On a specific `- [ ]` Open Questions item or AGENT-Q comment needing an owner ruling. Surfaced via [[Open-Decisions]]. |
| `#needs/james` | **Deprecated alias of `#needs/owner`** (renamed 2026-07-23). Still surfaced; don't write new ones. Existing occurrences in dated history stay as written. |

New tags are fine when nothing existing fits — add to this table in the same commit.

## Naming the decision-maker: role vs. person

> **In durable design and process docs, write "the owner." In dated rulings, decision history, and status notes, name the person — attribution is the point.**

`Designs/**/owner-decision-inbox.md` and `owner-rulings.md` describe a **role** that could one day belong to more than one person. `Decisions.md`, `Daily Notes/`, `Reviews/`, and `Brainstorms/` are **append-only history**: rewriting "James corrected my EAS claim" to "the owner corrected…" destroys provenance — falsification, not renaming. Who currently holds authority: [[authority]].

- **Never bulk-rename "James" across the vault.** ~1113 occurrences, most of them history. Rename only where the sentence tells a future agent what to *do*, and only if substituting "whoever currently holds decision authority" keeps it true.
- **Never rewrite a signature.** `Promoted by @james on YYYY-MM-DD` trust tokens and `RULED (James)` markers name a specific person taking responsibility for an irreversible act. The role generalizes; the signature never does.

**Disambiguation:** EFS the product also uses "owner" (container owner, gate owner, owner-derived `DATA` IDs). Project-role usage is a bare noun-adjunct (`owner-decision-inbox`, "the owner ruled"); EFS-resource usage is always possessive-qualified ("the container's owner"). In documents discussing both, write **"project owner"** on first mention. See [[Glossary#Owner (project role)]].

## Tri-sync invariant

Design status lives in three places — prose `**Status:**`, tag `#status/`, and (post-promotion) filename — which must agree and change in the same commit. Filename only changes at promotion.

**Canonical definition: [[design-system#Tri-sync invariant]].** Check: `scripts/tri-sync-check.sh` (also catches self-numbered drafts).

## Paths and links

| Use case | Form | Example |
|---|---|---|
| In-vault references | `[[wiki-link]]` (no extension) | `[[design-system]]`, `[[Glossary#TAG]]`, `[[design-system\|the meta-design]]` (alias) |
| Out-of-vault references in prose | repo-relative, no `/efs/` prefix | `contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md` |
| Out-of-vault links | markdown link, path relative to the file you're writing in | `[ADR-0041](../contracts/docs/adr/0041-...)` |
| Shell commands | whatever `pwd` requires | `cd ../contracts && git status` |

**Never use absolute `/efs/...` paths in committed files** — bakes in a mount point.

Wiki-links auto-update on rename; that's why they're the in-vault form. Markdown links are file-relative: `../contracts/...` from a vault-root file, `../../contracts/...` from one level deep (`Designs/`, `Onboarding/`). If one doesn't resolve in Obsidian or on GitHub web, you miscounted. They do NOT auto-update on target-repo renames — cleanup is a manual pass.

## Task list vs Kanban vs design — three altitudes

| Altitude | Artifact | Tracks | Use for |
|---|---|---|---|
| Durable | `Designs/*.md` | Proposals → accepted → landed; the "why" of architectural decisions | Architectural history |
| Flow | `Kanban.md` columns | Backlog → In Flight → Blocked → Under Review → Done | Work needing flow tracking and one identifiable owner; a card is discipline-bearing (owner, claim TTL, WIP limit) |
| Detail | `- [ ]` checkboxes | Execution-level items, rolled up globally by the Obsidian Tasks plugin (see [[Tasks]]) | In a design's `## Open questions`: items bound to a decision, answered before promotion (or carried as `### Post-acceptance`). Elsewhere (`Daily Notes/`): personal/ephemeral, not project state |

If the same fact lands in two of these, pick one and reference it from the other. **State duplication is the bug; multiple artifacts is the feature.**

## WIP limits

Soft limits, agent-honored not mechanically enforced; the single human reviewer is the bottleneck.

| Limit | Where |
|---|---|
| **3** designs in `#status/ready-for-promotion` | Across all of `Designs/` — James's promotion-ceremony queue |
| **5** cards in **Under Review** | `Kanban.md` Under Review column, across all repos |
| **2** In Flight cards per agent | `Kanban.md` In Flight, by claim annotation |

At a limit: finish or unblock an existing card in that column first, or surface in chat ("ready-for-promotion is at 3; can we promote one before I add another?"). Don't break a limit silently.

## Kanban entries

In Flight card, and drafts-in-flight (in Backlog):

```markdown
- [ ] Implement [[0007-offline-sync]] #repo/client
  — @claude-opus-4.7, branch claude/offline-sync, claimed 2026-05-21, expires 2026-05-24
- [ ] Draft: offline-sync #kind/design #repo/client — @claude-opus-4.7, started 2026-05-21
```

3-day default expiry on In Flight cards; after expiry any agent (or James) can reclaim. Update the expiry whenever you touch the card.

**One card per PR per repo.** A design targeting multiple repos gets one card per repo — each with its own agent, branch, and `#repo/` tag — not one card for the whole design. Cards cross-link to `[[NNNN-design-slug]]`; the design file is the cross-cutting tracker.

**Under Review and Blocked cards do NOT auto-expire.** Only In Flight has the 3-day TTL; Under Review (PR open) and Blocked cards **cannot be reclaimed without asking in chat first**. If one looks stale (untouched 7+ days), surface in chat rather than reclaiming.

### Design file owns multi-repo truth

The design's `## Implementation notes` carries the PR checklist:

```markdown
- [x] contracts#412 — merged 2026-05-19
- [ ] client#88 — in review
```

**The commit that merges a PR for DESIGN-NNNN must also update DESIGN-NNNN's checklist in the same session.** Kanban tracks attention; the design file tracks truth, and drift makes the design's `landed` status wrong.

### Post-acceptance Open Questions

An `accepted` design's body is nominally frozen. For questions implementation raises, **append a dated subhead to the existing `## Open questions` section:**

```markdown
### Post-acceptance (2026-06-03 / @claude-opus-4.7)
- [ ] Tiebreaker needed for the foo-bar interaction. Proposed: lexicographic by attester address. #needs/owner
```

If such a question changes the design's substance, either update the design body (drift discipline, see [[design-system]]) or open a superseding design.

### Preserving the Obsidian Kanban plugin format

`Kanban.md` is parsed by the Obsidian Kanban plugin, which needs:

1. **YAML frontmatter** at the top: `kanban-plugin: board`.
2. **`## Column-name` H2 headers** per column. File order = board order.
3. **Settings footer** at the bottom, wrapped in `%% kanban:settings` … `%%`, containing a fenced `{"kanban-plugin":"board","list-collapse":[false,false,false,false,false]}`. The `list-collapse` array length **MUST equal the number of columns**.

Never strip the frontmatter, never delete the footer, always update `list-collapse` when the column count changes.

## Daily check-ins

Active agents append once per work-session to `Daily Notes/agent-status.md`:

```markdown
## 2026-05-21
- @claude-opus-4.7: offline-sync — finished proposal section, opening for review
```

## Pre-promotion checklist

Every design carries this section near the bottom. **Canonical form: [[_template#Pre-promotion checklist]].** Fill it before requesting promotion.

## Promotion commit shape

One commit: `git mv Designs/<slug>.md Designs/NNNN-<slug>.md` + tri-sync edit (prose Status, tag, Kanban entry), subject `promote: DESIGN-NNNN — <title>`, body containing the literal trust token `Promoted by @james on YYYY-MM-DD`. Any deviation = manual review. Full ceremony: [[write-a-design]] § 7. Check: `scripts/promotion-check.sh`.

## Open questions inline

Inside a design file; the Obsidian Tasks plugin rolls these into a global view for James:

```markdown
## Open questions

- [ ] Should we support both X and Y, or only X?
- [x] Is the foo limit per-user or global? — global, per ADR-0026 (resolved 2026-05-21).
```

Tier 1/2 questions about cross-cutting planning concerns (not tied to one design) get a new design with `#kind/question` if they deserve lifecycle; otherwise `Daily Notes/`.

## When in doubt

Surface in chat with James before doing.
