# EFS Planning Vault

**Notice to autonomous agents (Claude, Codex, Cursor, Gemini, Antigravity, etc.).** This repository is the brain for the EFS agent swarm. It coordinates designs that span multiple repos, tracks cross-repo work, and holds system-level knowledge. **You interact strictly via file system I/O** — reading and writing `.md` files. No GitHub API calls.

Humans (specifically James, the project lead) interact via Obsidian. Preserve standard Markdown so Obsidian renders correctly.

> **Current state: bootstrap.** The vault's meta-design ([[design-system]]) is still in `#status/draft` — it codifies rules that are not yet promoted. No designs have been promoted yet (the Kanban has no In Flight cards as of writing). Most folders are scaffolding waiting for real content. Expect to be the first or second real user of any given procedure. If a documented path doesn't yet exist or a referenced script behaves unexpectedly, surface in chat — it's likely an unfilled-in path, not a bug.
>
> **Path reality check.** Docs in this vault describe a target `/efs/<repo>/` directory layout where all EFS repos are siblings. **This layout is aspirational.** The current physical paths may differ on James's machine (e.g. `/Users/james/Code/EFS/planning/`). Migrating clones to `/efs/` is on the Kanban Backlog as `#blocked-on/human-decision`. **When working today: use relative paths from your own worktree** rather than absolute `/efs/...` paths. The conventions in [[conventions#Linking out of the vault]] cover this.

## Quick start for a new agent

Read these in order:

1. [`Onboarding/start-here.md`](./Onboarding/start-here.md) — decision tree from "I just arrived" to "I'm working on X."
2. [`Onboarding/repo-map.md`](./Onboarding/repo-map.md) — the `/efs/` layout.
3. [`Onboarding/write-a-design.md`](./Onboarding/write-a-design.md) — if your task involves writing a design.
4. [`Onboarding/conventions.md`](./Onboarding/conventions.md) — tags, paths, tri-sync, commit messages.
5. [`Onboarding/escalation.md`](./Onboarding/escalation.md) — when to stop and ask vs. note and continue.

Then skim [`Glossary.md`](./Glossary.md) for terminology and [`Designs/README.md`](./Designs/README.md) for the design landscape.

The **canonical protocol** for this vault is [`Designs/design-system.md`](./Designs/design-system.md). This README is the entry point; the design-system file is the authority.

## Directory structure

| Path | Purpose |
|---|---|
| `README.md` | This file — entry point. |
| `AGENTS.md` | Universal agent brief (for tools that auto-detect this filename); redirects here. |
| `Kanban.md` | Cross-repo task board (Obsidian Kanban plugin). |
| `For-James.md` | Dashboard of items needing the human's attention right now. |
| `Decisions.md` | Append-only one-line decisions log. |
| `Ideas.md` | Parking lot for future "someday" ideas + things-to-account-for (PM-curated; graduate to Brainstorm/Design). |
| `Tasks.md` | Global rollups via the Obsidian Tasks plugin (open questions, blocked items, pre-promotion checklists). |
| `Milestones.md` | Cross-repo milestone tracking (devnet launch, mainnet, etc.). Currently scaffold; populate as scope solidifies. |
| `_Index.base` | Obsidian Bases queries (starter views shipped; tune in Obsidian). |
| `_Notes.canvas` | Obsidian Canvas — freeform whiteboard. |
| `Daily Notes/` | Human's per-day notes; also catch-all for uncategorized content. |
| `Designs/` | Design proposals. Name-first drafts; numbered at promotion. See [`Designs/README.md`](./Designs/README.md). |
| `Architecture/` | Descriptive: "how the system works today." See [`Architecture/README.md`](./Architecture/README.md). |
| `Glossary.md` | Single alphabetical file of EFS terms. |
| `Onboarding/` | Procedural: "how YOU do X." See [`Onboarding/README.md`](./Onboarding/README.md). |
| `Agents/` | Agent-specific institutional knowledge: launch prompts and SOUL files for each agent role (PM, future design-reviewer, etc.). See [`Agents/README.md`](./Agents/README.md). |

**No `Misc/` folder.** Uncategorized notes go in `Daily Notes/`.

A `Reference/` folder is **planned but not built** — read-only mirrors of ADRs from dev repos. Deferred pending a concrete CI need; see [`Designs/cross-repo-reference-mirror.md`](./Designs/cross-repo-reference-mirror.md).

## Agent SOP (TL;DR)

1. **Sync.** `cd /efs/planning && git pull --rebase`.
2. **Orient.** Read `Kanban.md`. Pick up an In Flight card you own, claim a Backlog item, or review a `#status/review` design. **Do not invent work** — if nothing matches, ask in chat.
3. **Work.** Stay surgical. Match existing patterns. Don't refactor things unrelated to your task.
4. **Document.** If you're making a non-trivial change, draft a design in `Designs/` *before* writing target-repo code. See [`Onboarding/write-a-design.md`](./Onboarding/write-a-design.md).
5. **Commit & push.** Small commits. Use [`Onboarding/conventions.md`](./Onboarding/conventions.md) commit-message style with `Co-authored-by:` agent attribution.

## Git Sync Protocol

This repo is shared across agents and machines.

```bash
# before any read or write
git pull --rebase

# when a unit of work is done
git add <files>
git commit -m "<area>: <imperative summary>"
git push
```

Every agent-authored commit MUST include both an `Agent: <slug>` trailer and a `Co-authored-by:` trailer. Together they enable per-agent grep on `git log` (see `scripts/agent-activity.sh`). Full convention: [`Onboarding/conventions.md`](./Onboarding/conventions.md#agent-identity-trailer).

On push rejection: `git pull --rebase`, resolve any conflicts (Kanban.md is the likely victim), `git push`. If a rebase gets gnarly (>5 minutes of resolving), back off — surface in chat rather than force-pushing.

**Note on `vault backup: <date>` commits.** The Obsidian Git plugin uses that message template for manual commits via its UI. Those are James's edits, not auto-commits. Agents use semantic CLI commits and won't produce that prefix.

## Kanban basics

`Kanban.md` is the cross-repo task board with five columns:

| Column | Meaning |
|---|---|
| **Backlog** | Agreed-upon work, not yet started. |
| **In Flight** | Active. Card includes claim annotation: `— @<agent>, branch <name>, claimed YYYY-MM-DD, expires YYYY-MM-DD`. |
| **Blocked** | Waiting on a decision, dependency, or human. Tag `#blocked-on/<thing>`. |
| **Under Review** | In PR review. |
| **Done** | Landed. |

In Flight cards have a 3-day default expiry; any agent or James can reclaim an expired card. Update the expiry whenever you touch a card.

Active agents append once per work-session to `Daily Notes/agent-status.md` so James can scan project state without `git log`.

Full Kanban rules in [`Onboarding/conventions.md`](./Onboarding/conventions.md) § Kanban entries.

## Where the detailed rules live

This README is intentionally short. The detailed rules — design lifecycle, status taxonomy, promotion ceremony, tri-sync invariant, link conventions, escalation tiers — all live in:

- **[`Designs/design-system.md`](./Designs/design-system.md)** — the canonical meta-design.
- **[`Onboarding/`](./Onboarding/)** — procedural how-tos.

If this README and `design-system.md` disagree, `design-system.md` wins. Surface the discrepancy as a Tier 2 escalation per [`Onboarding/escalation.md`](./Onboarding/escalation.md).

## Sub-task protocol

Granular tasks that don't belong on the Kanban can be dropped as standard Markdown checkboxes into _any_ file in the vault. The Obsidian Tasks plugin rolls them up globally for James.

**Format:** `- [ ] Sub-task description here`

For trackable open questions inside a design, use the design's `## Open questions` section. For ephemeral notes, use `Daily Notes/`.
