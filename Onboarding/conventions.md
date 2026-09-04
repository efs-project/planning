# Conventions

Per-convention quick-lookup. Canonical rules: [[design-system]].

## Git sync

Before work, identify the assigned branch/revision and inspect dirty state, relevant cards/status/handoffs and visible related branches. Fetch when available to verify freshness. For ordinary main-based work, update only your owned clean worktree against the intended upstream; never rebase another worker's branch, change an assigned pinned review/experiment revision, or autostash unrelated edits. Distinct authorized scopes can use isolated worktrees; overlapping edits require an agreed split or handoff. No status note means no proof of an idle checkout.

Commit and push completed authorized changes unless the assignment restricts publication. A read-only report does not authorize these mutations. Offline independent work can continue locally within scope: state exact source commit and freshness/visibility gaps. Distinguish local committed, remote-reachable and merged results in the [shared handoff](../Agents/handoff-template.md).

On push rejection, inspect divergence and ownership first; reconcile only your own clean branch, preserving other work. If a rebase gets gnarly (>5 minutes of resolving), back off and surface in chat. Never force-push. The [shared launch contract](../Agents/launch.md) adds session collision/source-resolution details without changing authority.

## Commit-message style

`<area>: <imperative summary>`. Areas: `design`, `kanban`, `docs`, `chore`, `promote`, `land`, `status` (agent-status / activity-log commits), `sync` (bot-driven Reference/ mirror, if/when it ships), `pm` (PM-role coordination commits only).

**The subject prefix must reflect the authoring agent's role/area — it is NOT a free-form label.**

- **`pm:` is RESERVED for the PM role (slug `pm`).** A non-PM agent editing a PM-owned coordination file (`Owner-Inbox.md`, `Kanban.md`, `Daily Notes/agent-status.md`) uses its own area (`docs:` / `kanban:` / `design:`), never `pm:` — otherwise `git log --grep='^pm:'` falsely attributes work and phantom "second PMs" appear. (Happened 2026-05-28: `sdk-designer` used `pm:` subjects on For-James edits.)
- **Editing `Owner-Inbox.md` structure is PM work.** Other agents may *append a one-line surface entry* ("design X ready for review"), not restructure the decide-now framing or curate the queue; tag that commit with your own area.

Trailers on agent-authored commits — each on its own real line, never glued on with a literal `\n`. Write the message to a file and `git commit -F` it.

| Trailer | Value | Required? |
|---|---|---|
| `Co-authored-by:` | The actual model, `<Model> <noreply@vendor>` | Yes — enforced by `scripts/commit-msg-hook.sh` |
| `Agent:` | Stable [roster role ID](../Agents/README.md), not the model version or session — durable across model upgrades | Yes — trailer presence enforced by the hook |
| `Harness:` | The actual tool the agent runs inside: `claude-code`, `codex`, …; not session identity | Yes for agent-authored commits; presence not yet hook-enforced |

```
design: draft offline-sync — describe the offline sync proposal

Body paragraph or two.

Co-authored-by: Claude Opus 4.7 <noreply@anthropic.com>
Agent: web-client-os-pm
Harness: claude-code
```

Prospective examples: `Agent: pm`, `Agent: sdk-pm`, `Agent: contracts-dev`; use the roster's canonical ID even when launched by an alias. Historical slugs such as `codex-gpt-5`, `fable` and `claude-opus-*` served multiple roles: preserve them unchanged and do not silently reclassify their commits. James's manual Obsidian-UI commits (`vault backup: …`) remain exempt and the hook skips them.

**Role, harness, model and session are distinct.** Two simultaneous Codex sessions of one role have the same role/harness trailers. Give each a non-secret unique session label in its existing card/status/handoff and resume from its verified commit, not a harness-wide git-log watermark. Status is advisory, not a lock; overlap needs an agreed split/handoff. `Harness:` is also matched by the hook's literal-`\n` check, so a glued-on trailer fails the commit.

Vendor noreply emails: `noreply@anthropic.com`, `noreply@openai.com`, `noreply@google.com`; otherwise `noreply@<vendor-domain>`.

## Tag vocabulary

Plain `#kebab-case-text` — no spaces, lowercase (Obsidian treats whitespace as a tag terminator). Write tags **inline**, on a tag line directly under the header block. Obsidian also honours YAML `tags: [status/review, …]` frontmatter, but the `scripts/` checks only read inline tags, so a frontmatter-only file is invisible to them — if you use frontmatter, still write the inline line.

**Closed vs. open families.** This distinction is what [[escalation]] Tier 2 actually means by "introducing a new tag":

- **Closed families — `#kind/`, `#status/`, `#repo/`.** The values below are the whole set. Inventing a new one *is* a Tier-2 stop-and-ask, and updates this table in the same commit.
- **Open families — `#topic/`, `#pass/`, `#blocked-on/`, `#depends-on/`, `#needs/`.** The *family* is canonical; individual values are coined as needed. **Coining a value in an open family is NOT an escalation** — keep it lowercase kebab-case, and reuse an existing value when one fits rather than minting a synonym.

| Tag | Use |
|---|---|
| `#repo/contracts`, `#repo/client`, `#repo/sdk`, `#repo/planning` | Target codebase. Multi-repo work gets multiple tags. |
| `#kind/…` | Artifact type — closed set, table below. |
| `#status/…` | Lifecycle — closed set, table below. |
| `#topic/<subject>` | Subject-matter facet, orthogonal to repo/kind/status. **Open vocabulary.** In use: `privacy`, `efsv2`, `clientv2`, `requirements`, `lenses`, `read-path`, `onchain`, `onchain-completeness`, `graph-queries`, `trust`, `coherence`, `assumptions`, `app-model`, `content`, `cypherpunk-os`, `games`, `human-overview`, `wasm`, `wasi`. Use it to gather one subject across `Designs/`, `Reviews/`, and subfolders — that is the whole point, so prefer an existing value over a near-synonym. |
| `#pass/<round-slug>` | Membership in one named, dated **work round** (a batch of parallel-agent lanes). In use: `#pass/deep-privacy`, `#pass/1-filesystem`. `#topic/` says what a doc is *about*; `#pass/` says which run *produced* it. **Open vocabulary.** |
| `#blocked-on/<thing>` | Blocker (e.g. `#blocked-on/DESIGN-0007`, `#blocked-on/human-decision`, `#blocked-on/concrete-CI-need`). Also how you park a design that is alive but dormant — see "shelved" under *Not vocabulary* below. |
| `#depends-on/<thing>` | Soft dependency between designs or tasks. |
| `#needs/owner` | On a specific `- [ ]` Open Questions item or AGENT-Q comment needing an owner ruling. Surfaced via [[Open-Decisions]]. |
| `#needs/james` | **Deprecated alias of `#needs/owner`** (renamed 2026-07-23). Still surfaced; don't write new ones. Existing occurrences in dated history stay as written. |

### `#kind/` — artifact type (closed)

| Tag | Artifact |
|---|---|
| `#kind/design` | A proposal that argues for a change and rides the design lifecycle. The default. |
| `#kind/spec` | A normative statement of shape rather than an argument for one (e.g. a spike spec). |
| `#kind/research` | A landscape scan, digest, or compass. Evidence and options; binds no one. |
| `#kind/review` | A review, audit, or adversarial record *of* another artifact. Most of `Reviews/`. |
| `#kind/decision` | A decision packet or owner inbox. |
| `#kind/question` | A cross-cutting open question given its own lifecycle (see *Open questions inline* below). |
| `#kind/task` | A bounded unit of execution work with a finish line. |
| `#kind/ops` | Continuous operational work that has no "done" (trackers, submission pipelines). Use `#kind/task` if it can actually complete. |
| `#kind/prompt` | An agent launch / kickoff prompt. |
| `#kind/note` | Durable material that is none of the above. **Singular.** |

### `#status/` — lifecycle (closed)

Canonical meanings live in [[design-system#Designs lifecycle]]; this is the tag surface.

> The canonical taxonomy lives in [[design-system]]; this table and `scripts/tri-sync-check.sh` mirror it. All three change in the same commit.

| Tag | Meaning |
|---|---|
| `#status/draft` | Author is writing; may be incomplete. |
| `#status/review` | Author thinks it's ready; soliciting comment. |
| `#status/ready-for-promotion` | Reviewed and converged; awaiting the human promotion ceremony. |
| `#status/accepted` | Promoted by the owner. Numbered. |
| `#status/landed` | Implementation merged in all target repos. |
| `#status/abandoned` | Explicitly chosen against. May be revisited freely. |
| `#status/rejected` | Hard-vetoed by the owner. Needs a new argument to revive. |
| `#status/superseded` | A newer design replaced it; the successor names it in its `**Supersedes:**` field. Read the successor — don't revive this one. Distinct from `abandoned` (nobody replaced it, we just chose against it) and `rejected` (vetoed). Fills the gap where `**Supersedes:**` already existed as a header field with no matching status. |
| `#status/handoff` | Planning work is finished and the doc is a self-contained packet for another repo's agent. Terminal **in this vault**: it never gets numbered, because implementation lands elsewhere. **One word.** |
| `#status/reference` | A permanent **non-design** artifact that lives inside `Designs/` — **every `owner-decision-inbox.md` and `owner-rulings.md`**, plus kickoff-context docs and round maps. Has no design lifecycle and is never promoted or numbered. Use this instead of inventing a prose status like `running`, `informational`, or `revalidated`. |
| `#status/done` | Terminal state of a **non-design** artifact — a finished `Reviews/` pass, an ops card. **Never valid inside `Designs/`**, where a design ends `landed` / `abandoned` / `rejected` / `superseded`. |

**Not vocabulary — do not copy these if you see them:**

| Seen | Verdict |
|---|---|
| `#kind/notes` | Typo for `#kind/note`. Normalize on sight. |
| `#status/notes` | Category error — "notes" is an artifact *type*, not a lifecycle state. A running-notes ledger is `#kind/note` plus a real status. |
| prose `hand-off` | Spelling drift for `handoff`. One word, in both prose and tag. |
| `revalidated` | **Not a lifecycle state — it's freshness.** An agent reached for `**Status:**` to say "this packet was re-derived" and broke tri-sync for four days (2026-07-25→29). A decision inbox is `reference` *permanently*; how current it is belongs in its `**Last reconciled:**` field, which those files already carry. Descriptive detail goes in the prose tail after the lifecycle token — `**Status:** reference — revalidated packet + held remainder` — which tri-sync reads past. |
| `#status/shelved`, `#status/hibernating` | **Proposed 2026-05-26 by the rot audit; never adopted, zero real uses** — every occurrence in the vault is the proposal quoting itself. The need was met instead by `#blocked-on/<unblock-trigger>` on a `draft` (see [[cross-repo-reference-mirror]]), which records *why* it is asleep and *what* wakes it. Don't add these. |

Adding to a closed family is fine when nothing existing fits — update this table, [[design-system]], and `scripts/tri-sync-check.sh`'s accepted lists in the same commit, and flag it in chat.

## Naming the decision-maker: role vs. person

> **In durable design and process docs, write "the owner." In dated rulings, decision history, and status notes, name the person — attribution is the point.**

`Designs/**/owner-decision-inbox.md` and `owner-rulings.md` describe a **role** that could one day belong to more than one person. `Decisions.md`, `Daily Notes/`, `Reviews/`, and `Brainstorms/` are **append-only history**: rewriting "James corrected my EAS claim" to "the owner corrected…" destroys provenance — falsification, not renaming. Who currently holds authority: [[authority]].

- **Never bulk-rename "James" across the vault.** ~1113 occurrences, most of them history. Rename only where the sentence tells a future agent what to *do*, and only if substituting "whoever currently holds decision authority" keeps it true.
- **Never rewrite a signature.** `Promoted by @james on YYYY-MM-DD` trust tokens and `RULED (James)` markers name a specific person taking responsibility for an irreversible act. The role generalizes; the signature never does.

**Disambiguation:** EFS the product also uses "owner" (container owner, gate owner, owner-derived `DATA` IDs). Project-role usage is a bare noun-adjunct (`owner-decision-inbox`, "the owner ruled"); EFS-resource usage is always possessive-qualified ("the container's owner"). In documents discussing both, write **"project owner"** on first mention. See [[Glossary#Owner (project role)]].

## Tri-sync invariant

Design status lives in three places — prose `**Status:**`, tag `#status/`, and (post-promotion) filename — which must agree and change in the same commit. Filename only changes at promotion.

**Canonical definition: [[design-system#Tri-sync invariant]].** Check: `scripts/tri-sync-check.sh` (also catches self-numbered drafts).

### What the prose `**Status:**` line may say

**Inside `Designs/` (recursively)** the line must **begin with exactly one `#status/` token**, equal to the tag. A trailing qualifier after the token is welcome — the checker reads only the first word:

```markdown
**Status:** draft decision packet; no choice is adopted until James answers
**Status:** handoff (ready for `@efs/sdk`)
```

What is *not* allowed inside `Designs/` is a sentence whose first word isn't a lifecycle token (`**Status:** informational kickoff …`, `**Status:** running notes …`). Lowercase, always.

**Outside `Designs/`** — `Reviews/`, `Brainstorms/`, `Agents/` — the `Status:` line is a free-form sentence describing the artifact's **evidential standing**, not a lifecycle token, and is not tri-synced. This is a good habit and these are all valid:

> "point-in-time architecture review; input to the next revision, not canon" · "design-pass output — normative where marked" · "lane report for Pass 1 synthesis" · "candidate-normative draft for external review" · "integrated review record" · "complete architecture for adversarial review" · "proposal for the freeze bundle" · "design input for the v2 large-upload spec"

If such a file *also* carries a `#status/` tag, **the tag is the machine-readable status** and the sentence is commentary. They do not have to match.

**Don't reuse the bold `Status:` label for domain fields.** `Brainstorms/2026-05-26-bs-schema-freeze-recommendation-*` uses it inside body sections for values like `freeze-for-sepolia`, `hold-for-shape-freeze`, and `new-schema-needed` — those describe *a schema's* freeze disposition, not the document's lifecycle. Existing history stays as written; in new docs pick a distinct label (`Freeze:`, `Disposition:`) so the two never collide.

## Paths and links

| Use case | Form | Example |
|---|---|---|
| In-vault references | `[[wiki-link]]` (no extension) | `[[design-system]]`, `[[Glossary#TAG]]`, `[[design-system\|the meta-design]]` (alias) |
| Out-of-vault references in prose | repo-relative, no `/efs/` prefix | `contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md` |
| Out-of-vault links — from a vault-root file (`Kanban.md`, `Glossary.md`) | markdown link, path relative to the file you're writing in | `[ADR-0041](../contracts/docs/adr/0041-...)` |
| Out-of-vault links — from depth 1 (`Designs/`, `Onboarding/`, `Reviews/`) | one more `../` | `[ADR-0041](../../contracts/docs/adr/0041-...)` |
| Out-of-vault links — from depth 2 (`Designs/efsv2/`, `Designs/clientv2/`, corpus subfolders) | one more `../` again | `[ADR-0041](../../../contracts/docs/adr/0041-...)` |
| Shell commands | whatever `pwd` requires | `cd ../contracts && git status` |

**Never use absolute `/efs/...` paths in committed files** — bakes in a mount point.

Wiki-links auto-update on rename; that's why they're the in-vault form. Markdown links are file-relative — **count the `../` from the file, not from the vault root**: `../contracts/...` from a vault-root file, `../../contracts/...` from one level deep (`Designs/`, `Onboarding/`), `../../../contracts/...` from two levels deep (`Designs/efsv2/`, `Designs/clientv2/`), where most design files now live. This off-by-one is the single most common broken link in the vault. Note that `../../Reviews/...` from a depth-2 design file is *in-vault* and correct — only sibling-repo paths (`contracts/`, `sdk/`, `client/`) need the extra hop out of `planning/`. If one doesn't resolve in Obsidian or on GitHub web, you miscounted. They do NOT auto-update on target-repo renames — cleanup is a manual pass.

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
  — @web-client-dev (harness claude-code, session offline-sync-20260903-a), branch example/offline-sync, claimed 2026-09-03, expires 2026-09-06
- [ ] Draft: offline-sync #kind/design #repo/client — @web-client-os-pm (session offline-design-20260903-a), started 2026-09-03
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

Active agents append once per authorized write session to `Daily Notes/agent-status.md`; read-only/unassigned starts report in chat instead. Include role, actual harness, unique session label, scope and next action:

```markdown
## 2026-09-03
- @web-client-os-pm (harness claude-code, session offline-design-20260903-a): offline-sync — finished the assigned proposal section / next: bounded review
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
