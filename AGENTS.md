# AGENTS.md

EFS planning vault. Cross-repo coordination point for the AI agent swarm building [Ethereum File System](https://github.com/efs-project). Filesystem-only contract — interact via reading and writing `.md` files; no GitHub API calls.

This file exists so tools that auto-detect `AGENTS.md` (Codex CLI, Cursor, Devin, Copilot, Claude Code, et al — [universal agent brief convention](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)) get a stable entry point. **The canonical agent docs are [README.md](./README.md) and [Onboarding/](./Onboarding/).**

> **Bootstrap state.** No designs have been promoted yet; the meta-design ([Designs/0001-design-system.md](./Designs/0001-design-system.md)) is itself a draft. Expect to be the first real user of most procedures. `/efs/<repo>/` paths in the docs are the target layout, not necessarily current reality — use relative paths from your worktree. See [README current-state preamble](./README.md) for details.

## Read on init

If your tooling does not auto-load `@`-imported files, read these in order before your first commit:

1. [`Onboarding/start-here.md`](./Onboarding/start-here.md) — decision tree from "I just arrived" to "I'm working on X."
2. [`Designs/owner-decision-inbox.md`](./Designs/owner-decision-inbox.md) — routing page for every live design choice James needs to make.
3. [`Onboarding/repo-map.md`](./Onboarding/repo-map.md) — `/efs/` layout and sibling repos.
4. [`Onboarding/conventions.md`](./Onboarding/conventions.md) — tri-sync invariant, tag vocabulary, commit-message format, link forms, Kanban rules.
5. [`Onboarding/escalation.md`](./Onboarding/escalation.md) — when to stop and ask vs. note-and-continue.
6. [`Designs/0001-design-system.md`](./Designs/0001-design-system.md) — canonical protocol for this vault.

### Finding the owner's needed design decisions

**Fastest answer: [`Open-Decisions.md`](./Open-Decisions.md)** — one generated page listing every open item across all queues, with active holds first. Regenerate with `./scripts/open-decisions.sh`. Never hand-edit it.

Then [`Designs/owner-decision-inbox.md`](./Designs/owner-decision-inbox.md), which routes to the one canonical owner inbox in each design folder. Those inboxes separate **decide now**, **decide after evidence**, **launch choices**, **settled**, and **delegated** work.

Three rules that have each already been violated once:

- **Do not infer an owner decision from an unchecked box in a source design.** A choice is live only when its folder's owner inbox says it is.
- **Per-folder READMEs may lag.** The owner inbox plus the folder's current-spine block are authoritative for what's live — not the README's doc table.
- **Check for a sequencing hold before preparing any decision packet.** A held queue is an *inventory*, not a list to work through; asking anyway pushes the owner through a gate the designers deliberately closed.

**After recording a ruling, add a row to [`Retirements.md`](./Retirements.md) naming the phrasing it kills, then run `./scripts/needs-integration.sh`** — that is the work order for propagating the decision into the docs that still contradict it. A decision is not done until that queue is clear.

Adopted EFS v2 rulings live in [`Designs/efsv2/owner-rulings.md`](./Designs/efsv2/owner-rulings.md); [`Owner-Inbox.md`](./Owner-Inbox.md) carries **non-design** attention only. A ruling is recorded in the history owned by the queue that owns the item — `Designs/<folder>/owner-rulings.md` where that file exists, [`Decisions.md`](./Decisions.md) otherwise — and never in both. Who may rule on what: [`Onboarding/authority.md`](./Onboarding/authority.md).

## Hard rules (load-bearing, don't violate without checking)

- **Pull before reading or writing.** `cd /efs/planning && git pull --rebase`. The vault is shared across multiple agents and machines.
- **DO NOT number your own design drafts.** Save as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony. Self-numbering bypasses review.
- **Tri-sync invariant.** Design status appears in three places: prose `**Status:** X`, tag `#status/X`, and (post-promotion) filename `NNNN-<slug>.md`. All three change in the same commit.
- **Promotion is human-only.** James writes the literal trust token `Promoted by @james on YYYY-MM-DD` in the design body. Agents may execute the `git mv` ceremony on his behalf but only after he has written that token.
- **Do not invent work.** If nothing in [`Onboarding/start-here.md`](./Onboarding/start-here.md)'s decision tree applies, stop and ask James in chat.

## Every commit

- Subject line: `<area>: <imperative summary>`. Areas: `design`, `kanban`, `docs`, `chore`, `promote`, `land`, `sync`.
- Include `Agent: <slug>` and `Co-authored-by: <Model Name> <noreply@<vendor>>` trailers. The `Agent:` slug is a stable identifier for agent + role (e.g., `claude-opus-4.7`, `codex-gpt-5`). Enables per-agent grep on `git log`.
- **Write the commit message to a file and use `git commit -F <file>` — never embed `\n` inside `git commit -m`.** Some harnesses pass the string through a shell that doesn't interpret the escape, so the trailers land as a literal `\n` on one physical line. That has already happened to six vault commits, all of which `scripts/agent-activity.sh` now buckets as "unknown." Verify yours with `git log -1 --format='%B'` after your first commit.
- **Write a subject a future agent can orient from.** The `git log` is the cheapest possible index of what happened — say the *outcome*, not the activity ("drop EAS as the record carrier", not "update design docs"). An agent should be able to read 20 subjects and know the state of the project without opening a file.

## Where to find things

| You need… | Look in… |
|---|---|
| Active work | [`Kanban.md`](./Kanban.md) |
| Live design choices James needs to make | [`Designs/owner-decision-inbox.md`](./Designs/owner-decision-inbox.md) |
| Other items needing James's attention | [`Owner-Inbox.md`](./Owner-Inbox.md) |
| Designs (proposals + landed history) | [`Designs/`](./Designs/) (see `README.md` for content map) |
| Cross-cutting terminology | [`Glossary.md`](./Glossary.md) |
| System overviews | [`Architecture/`](./Architecture/) |
| How-to-do-something | [`Onboarding/`](./Onboarding/) |
| Past one-line decisions | [`Decisions.md`](./Decisions.md) |
| Open questions across all designs | [`Tasks.md`](./Tasks.md) (Obsidian Tasks rollup) |
| ADR or spec in a dev repo | `../contracts/docs/adr/`, `../contracts/specs/` (etc. for client/sdk) |

## Sibling repos under /efs/

- `/efs/contracts/` — Solidity contracts, ADRs, specs ([efs-project/contracts](https://github.com/efs-project/contracts))
- `/efs/client/` — production web client (future)
- `/efs/sdk/` — JS/TS SDK (future)
- `/efs/planning/` — this vault

Cross-repo reads via sibling paths (`../contracts/docs/adr/0041-...`). Never use absolute `/efs/...` paths in committed files — bakes in a mount point.
