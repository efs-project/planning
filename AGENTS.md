# AGENTS.md

EFS planning vault. Cross-repo coordination point for the AI agent swarm building [Ethereum File System](https://github.com/efs-project). Filesystem-only contract — interact via reading and writing `.md` files; no GitHub API calls.

This file exists so tools that auto-detect `AGENTS.md` (Codex CLI, Cursor, Devin, Copilot, Claude Code, et al — [universal agent brief convention](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)) get a stable entry point. **The canonical agent docs are [README.md](./README.md) and [Onboarding/](./Onboarding/).**

## Read on init

If your tooling does not auto-load `@`-imported files, read these in order before your first commit:

1. [`Onboarding/start-here.md`](./Onboarding/start-here.md) — decision tree from "I just arrived" to "I'm working on X."
2. [`Onboarding/repo-map.md`](./Onboarding/repo-map.md) — `/efs/` layout and sibling repos.
3. [`Onboarding/conventions.md`](./Onboarding/conventions.md) — tri-sync invariant, tag vocabulary, commit-message format, link forms, Kanban rules.
4. [`Onboarding/escalation.md`](./Onboarding/escalation.md) — when to stop and ask vs. note-and-continue.
5. [`Designs/design-system.md`](./Designs/design-system.md) — canonical protocol for this vault.

## Hard rules (load-bearing, don't violate without checking)

- **Pull before reading or writing.** `cd /efs/planning && git pull --rebase`. The vault is shared across multiple agents and machines.
- **DO NOT number your own design drafts.** Save as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony. Self-numbering bypasses review.
- **Tri-sync invariant.** Design status appears in three places: prose `**Status:** X`, tag `#status/X`, and (post-promotion) filename `NNNN-<slug>.md`. All three change in the same commit.
- **Promotion is human-only.** James writes the literal trust token `Promoted by @james on YYYY-MM-DD` in the design body. Agents may execute the `git mv` ceremony on his behalf but only after he has written that token.
- **Do not invent work.** If nothing in [`Onboarding/start-here.md`](./Onboarding/start-here.md)'s decision tree applies, stop and ask James in chat.

## Every commit

- Subject line: `<area>: <imperative summary>`. Areas: `design`, `kanban`, `docs`, `chore`, `promote`, `land`, `sync`.
- Include `Agent: <slug>` and `Co-authored-by: <Model Name> <noreply@<vendor>>` trailers. The `Agent:` slug is a stable identifier for agent + role (e.g., `claude-opus-4.7`, `codex-gpt-5`). Enables per-agent grep on `git log`.

## Where to find things

| You need… | Look in… |
|---|---|
| Active work | [`Kanban.md`](./Kanban.md) |
| Items needing James's attention | [`For-James.md`](./For-James.md) |
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
