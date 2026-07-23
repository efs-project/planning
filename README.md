# EFS Planning Vault

**This README is for humans. Agents start at [`AGENTS.md`](./AGENTS.md).**

This is the planning vault for [Ethereum File System](https://github.com/efs-project) — the shared brain for a swarm of AI agents building it. It coordinates designs spanning multiple repos, tracks cross-repo work, and holds system-level knowledge. It's a plain folder of Markdown: read in Obsidian, versioned in git. No database, no SaaS, no tickets.

## Where do I look?

| I want to… | Go to |
|---|---|
| **See what needs my decision** | [`Open-Decisions.md`](./Open-Decisions.md) — generated; every open decision across all queues, active holds first |
| Answer a **design** decision | [`Designs/owner-decision-inbox.md`](./Designs/owner-decision-inbox.md) → the folder queue it routes to |
| See **everything else** needing me | [`Owner-Inbox.md`](./Owner-Inbox.md) — operational forks, deadlines, FYI |
| See what's **being worked on** | [`Kanban.md`](./Kanban.md) |
| Check **which rulings haven't landed in the docs yet** | `./scripts/needs-integration.sh` |
| Remember **what we decided and why** | [`Decisions.md`](./Decisions.md), plus `Designs/<folder>/owner-rulings.md` for design-set history |
| Look up a **term** | [`Glossary.md`](./Glossary.md) |
| Know **who may decide what** | [`Onboarding/authority.md`](./Onboarding/authority.md) |

Answer a decision by replying with its code (`R1A`, `FJ-1a`) — in chat to an agent, or by editing the queue directly. An agent then records the ruling in the owning history and propagates it into the affected designs.

## How the agent side works (the short version)

Agents read `AGENTS.md`, work in `Designs/`, and route anything needing your judgment into a decision queue. They never promote a design, edit milestone scope, or rule on your behalf — those are yours. The vault is the only coordination surface: if it isn't written down here, it didn't happen.

The full protocol, conventions, and hard rules live in [`AGENTS.md`](./AGENTS.md) and [`Onboarding/`](./Onboarding/). You don't need to read them to use this vault.

## Directory structure

| Path | Purpose |
|---|---|
| `README.md` | This file — entry point. |
| `AGENTS.md` | Universal agent brief (for tools that auto-detect this filename); redirects here. |
| `Kanban.md` | Cross-repo task board (Obsidian Kanban plugin). |
| `Owner-Inbox.md` | Broader cross-project attention dashboard, including deadlines and operational items; live design choices route through the Designs owner inbox. |
| `Retirements.md` | What rulings retired, and what replaced it. Input to `./scripts/needs-integration.sh` — the "decided but not yet integrated" work order. |
| `Open-Decisions.md` | **Generated** roll-up of every open owner decision across all queues, holds first. Regenerate with `./scripts/open-decisions.sh`; never hand-edit. |
| `Decisions.md` | Append-only one-line decisions log. |
| `Ideas.md` | Parking lot for future "someday" ideas + things-to-account-for (PM-curated; graduate to Brainstorm/Design). |
| `Tasks.md` | Global rollups via the Obsidian Tasks plugin (open questions, blocked items, pre-promotion checklists). |
| `Milestones.md` | Cross-repo milestone tracking (devnet launch, mainnet, etc.). Currently scaffold; populate as scope solidifies. |
| `_Index.base` | Obsidian Bases queries (starter views shipped; tune in Obsidian). |
| `_Notes.canvas` | Obsidian Canvas — freeform whiteboard. |
| `Daily Notes/` | Human's per-day notes; also catch-all for uncategorized content. |
| `Designs/` | Design proposals plus the canonical [owner decision routing inbox](./Designs/owner-decision-inbox.md). Name-first drafts; numbered at promotion. See [`Designs/README.md`](./Designs/README.md). |
| `Architecture/` | Descriptive: "how the system works today." See [`Architecture/README.md`](./Architecture/README.md). |
| `Glossary.md` | Single alphabetical file of EFS terms. |
| `Onboarding/authority.md` | Who may decide what — the authority roster. A roster plus attribution, deliberately not an ACL. |
| `Onboarding/` | Procedural: "how YOU do X." See [`Onboarding/README.md`](./Onboarding/README.md). |
| `Brainstorms/` | Agent-generated explorations and research dossiers. Deliberate-only pruning. See [`Brainstorms/README.md`](./Brainstorms/README.md). |
| `Reviews/` | Dated review passes and research corpora — the reason trail behind decisions. |
| `scripts/` | Vault audit + generation tools. See [`scripts/README.md`](./scripts/README.md). |
| `Agents/` | Agent-specific institutional knowledge: launch prompts and SOUL files for each agent role (PM, future design-reviewer, etc.). See [`Agents/README.md`](./Agents/README.md). |
| `Grants/` | Operational grant tracking — funder landscape, proposal status table, reusable EFS pitch packet, research log. Owned by @grants; PM keeps it integrated with the board. Not a design. See [`Grants/README.md`](./Grants/README.md). |

**No `Misc/` folder.** Uncategorized notes go in `Daily Notes/`.

A `Reference/` folder is **planned but not built** — read-only mirrors of ADRs from dev repos. Deferred pending a concrete CI need; see [`Designs/cross-repo-reference-mirror.md`](./Designs/cross-repo-reference-mirror.md).

---

*Agent protocol, conventions, and hard rules: [`AGENTS.md`](./AGENTS.md) and [`Onboarding/`](./Onboarding/).*
