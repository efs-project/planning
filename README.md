# EFS Planning & Architecture Vault

**Notice to Autonomous Agents (Codex, Claude, Antigravity):** This repository serves as the central brain, project tracker, and architectural source of truth for the Ethereum File System (EFS) project. You are to interact with this repository strictly via file system I/O (reading and writing `.md` files). 

Humans interact with these files via Obsidian. Note that for any syntax or file structure restrictions.

---

## 📂 Directory Structure

* `Kanban.md`: The central Kanban board tracking all project tasks. This is powered by the Kanban Obsidian plugin.
* `_Index.md`: A table of files in this project.
* `_Notes.md`: Random uncategorized notes.
* `Designs/`: Numbered proposals with lifecycle (draft → landed). See "Designs Protocol" below.
* `Architecture/`: Stable reference about how the system works today — overviews, layered models, diagrams. No lifecycle.
* `README.md`: This file (Standard Operating Procedures).

---

## 🤖 Agent Standard Operating Procedure (SOP)

When initialized to work on the EFS codebase (located in the sibling `contracts` repository), you must follow this workflow:

1.  **Sync State:** Run `git pull --rebase` (see Git Sync Protocol below), then read `Kanban.md` to understand the current priority and what is marked as "In Flight".
2.  **Verify Context:** If a task relates to a core system (e.g., File Semantics, Caching), search the `Architecture/` and `Designs/` directories for relevant constraints before writing code.
3.  **Document First:** When designing a new feature, write the proposal into `Designs/` (see Designs Protocol) *before* writing the Solidity or JS/TS code in the target repo.
4.  **Update State:** When a task or sub-task is completed, update the relevant files in this repository to reflect the new state, then commit and push.

---

## 🔄 Git Sync Protocol

This repo is shared across agents, branches, and machines. Stay synced.

**Before reading or writing**, pull latest:

```bash
git pull --rebase
```

**When a unit of work is done** — a Kanban move, a finished draft, an answered question — commit and push:

```bash
git add <files>
git commit -m "<area>: <imperative summary>"
git push
```

Small commits beat batched ones; planning state is read frequently and small commits make history scannable.

**On push rejection** (someone else pushed first):

```bash
git pull --rebase
# resolve conflicts (Kanban.md is the likely victim)
git push
```

If a rebase gets gnarly (>5 minutes of resolving), back off — surface in chat to the human rather than force-pushing.

**Note on auto-commits.** An Obsidian plugin in the vault may produce `vault backup: <timestamp>` commits when the human is editing locally. These are snapshots, not deliberate changes. Don't be surprised by sudden new commits during a session; just `git pull --rebase` and continue.

---

## 📋 The Kanban Protocol (`Kanban.md`)

The human project lead views `Kanban.md` using the Obsidian Kanban plugin. To prevent breaking the visual UI, **you must adhere strictly to standard Markdown list formatting** when updating this file. 

### Board Structure
The board is structured using Markdown Header 2 (`##`) for columns, and unordered checklists (`- [ ]`) for tasks. 

` ` `markdown
## Backlog
- [ ] Implement symlink logic

## In Flight
- [ ] Build attestation caching layer

## Done
- [x] Create EFS planning repo
` ` `

### Columns

| Column | Meaning |
|---|---|
| **Backlog** | Agreed-upon work, not yet started. |
| **In Flight** | Active. Tag with `#repo/<name>` and annotate ownership (e.g. `— @<agent>, branch <name>`). |
| **Blocked** | Waiting on a decision, dependency, or human. Tag with `#blocked-on/<thing>`. |
| **Under Review** | In PR review. |
| **Done** | Landed. |

Add the **Blocked** column to `Kanban.md` when an item first needs it (between In Flight and Under Review).

---

## 🏷️ Tag Vocabulary

Tags are plain `#kebab-case-text` and Obsidian indexes them automatically. Agents can grep them. Use the canonical set; don't invent variants.

| Tag | Use |
|---|---|
| `#repo/contracts`, `#repo/client`, `#repo/sdk`, `#repo/planning` | Target codebase. Multi-repo work gets multiple tags. |
| `#kind/design`, `#kind/task`, `#kind/question`, `#kind/decision`, `#kind/note` | Artifact type. |
| `#status/draft`, `#status/review`, `#status/accepted`, `#status/in-implementation`, `#status/landed`, `#status/abandoned` | Lifecycle of a design. |
| `#blocked-on/<thing>` | Blocker (e.g. `#blocked-on/DESIGN-0007`, `#blocked-on/human-decision`). |
| `#depends-on/<thing>` | Soft dependency between designs or tasks. |

Conventions: no spaces, kebab-case, lowercase. Obsidian treats whitespace as a tag terminator. Nested tags like `#repo/contracts` roll up in the Obsidian tag pane.

New tags are fine when nothing existing fits — add them to the table in the same commit so other agents find them.

---

## ✅ The Sub-Task Protocol

For granular tasks that do not belong on the main Kanban board, you may drop standard Markdown checkboxes into _any_ file in this vault. The human lead uses a global Tasks rollup.

**Format:** `- [ ] Sub-task description here`

If you are working inside an architecture document (e.g., `Architecture/caching.md`) and discover a bug or missing feature, add a checklist item to the bottom of that specific document.

---

## 📐 Designs Protocol

Designs are dynamic proposals for features or significant changes. They live in `Designs/`, may span any number of repos, and retire once implementation lands in target repos.

### File naming

`Designs/NNNN-kebab-case-slug.md` — sequential numbering, never reused. The number is permanent; the slug can change without breaking references. Reference designs as `DESIGN-NNNN`.

### File structure

```markdown
# DESIGN-NNNN: Title

**Status:** draft | review | accepted | in-implementation | landed | abandoned
**Target repos:** contracts, client, sdk (any subset)
**Depends on:** DESIGN-NNNN (optional)
**Supersedes:** DESIGN-NNNN (optional)

## Problem
What we're solving, and why now.

## Proposal
The design itself. Hierarchical headers, tables for data structures, [[wiki-links]] to related designs.

## Open questions
Trackable items as `- [ ]` checkboxes.

## Implementation notes (optional)
Repo-specific guidance.
```

### Lifecycle

1. **draft** — author is writing; may be incomplete.
2. **review** — ready for other agents and the human to comment.
3. **accepted** — settled, ready for an implementing agent to pick up.
4. **in-implementation** — code is being written in one or more target repos.
5. **landed** — implementation merged. ADRs and/or specs in target repos now codify the decision.
6. **abandoned** — explicitly chosen against. Keep the file for reasoning.

**When a design lands**, replace its body with a short tombstone pointing at the canonical references:

```markdown
# DESIGN-NNNN: Title

**Status:** landed
**Canonical references:**
- <repo>/docs/adr/NNNN-...
- <repo>/specs/NN-...

Original design: see git history of this file.
```

Tombstoning (rather than deleting) keeps `DESIGN-NNNN` references resolvable when agents read old commits or other designs.

### Drift discipline

If implementation diverges from an accepted design, the implementing agent must either:

- update the design file in the same PR that lands the divergent code, OR
- open a new design that supersedes this one before that code merges.

Designs are "what we agreed to do." If that's no longer true, fix the design before the divergent code lands.

### ADR / spec coupling — deliberately loose

Designs are not 1:1 with ADRs. A landed design typically becomes one or more ADRs (and possibly spec updates) in each target repo — the implementing agent makes that call when codifying the decision in-repo. Multi-repo designs may produce ADRs across several repos.

### Cross-repo references

Reference ADRs and specs in target repos by path: `contracts/docs/adr/0041-...`, `contracts/specs/03-...`. Agents with local access to the target repo read directly. Agents without access fetch via `gh` or ask the human.

A future sync mechanism may mirror canonical references into this repo for direct access; tracked separately.

---

## 🏗️ Architecture Documentation Rules

When creating new `.md` files in the `Architecture/` directory:

1. Use clear, hierarchical headers (`#`, `##`, `###`).
    
2. When defining data structures (e.g., tens, tags, properties), use standard Markdown tables.
    
3. If a template exists in the vault for design docs, you must read and adhere to its structure.
    
4. Link related concepts by using Wiki-style links `[[Filename]]` to allow the human lead to navigate the vault easily.