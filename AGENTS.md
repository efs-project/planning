# AGENTS.md

EFS planning vault. Cross-repo coordination point for the AI agent swarm building [Ethereum File System](https://github.com/efs-project). Filesystem-only contract — interact via reading and writing `.md` files; no GitHub API calls.

Stable entry point for tools that auto-detect `AGENTS.md` ([universal agent brief convention](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)). **The canonical agent docs are [README.md](./README.md) and [Onboarding/](./Onboarding/).**

> **State.** DESIGN-0001 (the meta-design) was promoted 2026-05-21 and is `accepted`; it is the canonical protocol. The vault is in active use, not bootstrap. `/efs/<repo>/` paths in docs describe a target layout, not necessarily your reality — discover your own paths and use relative ones.

## Read on init

If your tooling does not auto-load `@`-imported files, read these in order before your first commit:

1. [`Onboarding/start-here.md`](./Onboarding/start-here.md) — "I just arrived" → "I'm working on X" decision tree.
2. [`Designs/owner-decision-inbox.md`](./Designs/owner-decision-inbox.md) — every live design choice James needs to make.
3. [`Onboarding/repo-map.md`](./Onboarding/repo-map.md) — `/efs/` layout and sibling repos.
4. [`Onboarding/conventions.md`](./Onboarding/conventions.md) — tri-sync, tags, commit format, link forms, Kanban rules.
5. [`Onboarding/escalation.md`](./Onboarding/escalation.md) — stop-and-ask vs. note-and-continue.
6. [`Designs/0001-design-system.md`](./Designs/0001-design-system.md) — canonical protocol for this vault.

### Finding the owner's needed design decisions

**Fastest answer: [`Open-Decisions.md`](./Open-Decisions.md)** — generated page listing every open item across all queues, active holds first. Regenerate with `./scripts/open-decisions.sh`. Never hand-edit it.

Then [`Designs/owner-decision-inbox.md`](./Designs/owner-decision-inbox.md), which routes to the one canonical owner inbox per design folder. Those inboxes separate **decide now**, **decide after evidence**, **launch choices**, **settled**, and **delegated** work.

Three rules that have each already been violated once:

- **Do not infer an owner decision from an unchecked box in a source design.** A choice is live only when its folder's owner inbox says it is.
- **Per-folder READMEs may lag.** The owner inbox plus the folder's current-spine block are authoritative for what's live — not the README's doc table.
- **Check for a sequencing hold before preparing any decision packet.** A held queue is an *inventory*, not a list to work through; asking anyway pushes the owner through a gate the designers deliberately closed.

**After recording a ruling, add a row to [`Retirements.md`](./Retirements.md) naming the phrasing it kills, then run `./scripts/needs-integration.sh`** — that queue is the work order for propagating the decision into docs that still contradict it. A decision is not done until it's clear.

Adopted EFS v2 rulings live in [`Designs/efsv2/owner-rulings.md`](./Designs/efsv2/owner-rulings.md); [`Owner-Inbox.md`](./Owner-Inbox.md) carries **non-design** attention only. A ruling is recorded in the history owned by the queue that owns the item — `Designs/<folder>/owner-rulings.md` where that file exists, [`Decisions.md`](./Decisions.md) otherwise — and never in both. Who may rule on what: [`Onboarding/authority.md`](./Onboarding/authority.md).

## Hard rules (load-bearing, don't violate without checking)

- **Pull before reading or writing.** `cd <your planning checkout> && git fetch origin && git rebase --autostash origin/main`. The vault is shared across multiple agents and machines.
- **DO NOT number your own design drafts.** Save as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony; self-numbering bypasses review.
- **Tri-sync invariant.** Design status appears in three places: prose `**Status:** X`, tag `#status/X`, and (post-promotion) filename `NNNN-<slug>.md`. All three change in the same commit.
- **Promotion is human-only.** James writes the literal trust token `Promoted by @james on YYYY-MM-DD` in the design body. Agents may execute the `git mv` ceremony on his behalf only after he has written that token.
- **Do not invent work.** If nothing in [`Onboarding/start-here.md`](./Onboarding/start-here.md)'s decision tree applies, stop and ask James in chat.

## Every commit

- Subject line: `<area>: <imperative summary>`. Areas: `design`, `kanban`, `docs`, `chore`, `promote`, `land`, `sync`, `status`, `pm`. **`pm:` is RESERVED for the PM role** — a non-PM agent editing a PM-owned file uses its own area, or `git log --grep='^pm:'` falsely attributes the work (this produced a "phantom second PM" on 2026-05-28). Full list: [`Onboarding/conventions.md`](./Onboarding/conventions.md).
- Include `Agent: <slug>` and `Co-authored-by: <Model Name> <noreply@<vendor>>` trailers. The `Agent:` slug is a stable identifier for agent + role (e.g. `claude-opus-4.7`, `codex-gpt-5`), enabling per-agent grep on `git log`.
- **Run `./scripts/install-hooks.sh` once per clone.** Hooks are per-clone and not carried by git, so a fresh checkout has no commit validation.
- **Write the commit message to a file and use `git commit -F <file>` — never embed `\n` inside `git commit -m`.** Some harnesses don't interpret the escape, so trailers land as a literal `\n` on one physical line; six vault commits already did, and `scripts/agent-activity.sh` buckets them as "unknown." Verify with `git log -1 --format='%B'` after your first commit.
- **Write a subject a future agent can orient from** — the *outcome*, not the activity ("drop EAS as the record carrier", not "update design docs").

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

`contracts/` (Solidity, ADRs, specs — [efs-project/contracts](https://github.com/efs-project/contracts)), `client/` (web client, future), `sdk/` (JS/TS, future), `planning/` (this vault). Details: [`Onboarding/repo-map.md`](./Onboarding/repo-map.md).

Cross-repo reads via sibling paths (`../contracts/docs/adr/0041-...`). Never use absolute `/efs/...` paths in committed files — bakes in a mount point.
