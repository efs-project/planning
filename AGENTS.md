# AGENTS.md

EFS planning vault. Cross-repo coordination point for the AI agent swarm building [Ethereum File System](https://github.com/efs-project). Filesystem-only contract — interact via reading and writing `.md` files; no GitHub API calls.

Stable entry point for tools that auto-detect `AGENTS.md` ([universal agent brief convention](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)). **The canonical agent docs are [README.md](./README.md) and [Onboarding/](./Onboarding/).**

> **State.** DESIGN-0001 (the meta-design) was promoted 2026-05-21 and is `accepted`; it is the canonical protocol. The vault is in active use, not bootstrap. `/efs/<repo>/` paths in docs describe a target layout, not necessarily your reality — discover your own paths and use relative ones.

## Start here

**This file is enough to start working safely.** It carries the gotchas and hard rules; everything below is one hop away when you need it. Don't read the whole `Onboarding/` set up front — it's ~7,400 words of procedure, most of which won't apply to your task.

Then read **current state** for whatever you're touching: [`Open-Decisions.md`](./Open-Decisions.md) (what needs the owner), [`Kanban.md`](./Kanban.md) (what's in flight), and your task's design-folder `README.md` (the map of current vs. historical vs. blocked — it changes fast).

**Named role?** Find your short profile in [Agents](./Agents/README.md). Read only that profile; use its optional `NOTES.md` for cross-harness IDs and handoffs when needed. No startup script or extra launch guide. Verify assigned source revisions; missing v2 maps aren't permission to substitute v1.

Load the rest **when it's relevant**:

Rows are keyed to **what you are doing**, not to whether you feel unsure — if the action matches, open the file even if you think you already know the rule.

| When you're… | Read |
|---|---|
| picking what to work on, or claiming a Kanban card | [`Onboarding/start-here.md`](./Onboarding/start-here.md) |
| writing, reviewing, or promoting a design | [`Onboarding/write-a-design.md`](./Onboarding/write-a-design.md) |
| **committing, pushing, claiming, tagging, or linking across files/repos** | [`Onboarding/conventions.md`](./Onboarding/conventions.md) |
| **about to delete or rewrite a large section, edit a landed tombstone, add a value to a closed tag family (`#status/`, `#kind/`, `#repo/`), change `_template.md`, or deviate from any documented convention** | [`Onboarding/escalation.md`](./Onboarding/escalation.md) |
| working across sibling repos | [`Onboarding/repo-map.md`](./Onboarding/repo-map.md) |
| changing the vault's own protocol | [`Designs/0001-design-system.md`](./Designs/0001-design-system.md) |
| recording a ruling, or checking who may decide | [`Onboarding/authority.md`](./Onboarding/authority.md) |
| debugging a CI/tooling breakage in a *code* repo | [`Onboarding/known-issues.md`](./Onboarding/known-issues.md) |

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

- **Verify source and ownership before syncing.** Inspect branch, revision, dirty state, relevant cards/status and visible related branches. Fetch when available; update only your own safe checkout when the assignment calls for it. Never rebase another worker's branch or autostash unrelated changes. Pinned review/experiment revisions stay pinned; offline work labels freshness and remote visibility gaps. See [Git sync](./Onboarding/conventions.md#git-sync).
- **DO NOT number your own design drafts.** Save as `<slug>.md`, not `0007-<slug>.md`. Numbers are allocated only at the human-gated promotion ceremony; self-numbering bypasses review.
- **Tri-sync invariant.** Design status appears in three places: prose `**Status:** X`, tag `#status/X`, and (post-promotion) filename `NNNN-<slug>.md`. All three change in the same commit.
- **Promotion is human-only.** James writes the literal trust token `Promoted by @james on YYYY-MM-DD` in the design body. Agents may execute the `git mv` ceremony on his behalf only after he has written that token.
- **Never force-push.** On push rejection, inspect remote divergence and ownership before reconciling in your own clean worktree; do not blindly rebase shared/dirty work. Force-pushing past a rebase conflict is a **Tier-1 stop-and-ask** — this vault is shared across agents and machines, and a force-push destroys work you can't see.
- **Do not invent work.** If nothing in [`Onboarding/start-here.md`](./Onboarding/start-here.md)'s decision tree applies, stop and ask James in chat.
- **Respect card TTLs.** In Flight cards expire (3-day default) and can be reclaimed; **Under Review and Blocked cards have no TTL and cannot be reclaimed without asking in chat.** WIP limits: 3 ready-for-promotion / 5 Under Review / 2 In Flight per agent.
- **Append one dated line to `Daily Notes/agent-status.md` per authorized write session**, including role, harness, distinct non-secret session label and scope. Read-only/unassigned sessions report in chat. Status is advisory, not a cross-machine lock; overlapping writers need an agreed split/handoff even when they use the same harness. Preserve others' edits and stage exact paths.

## Every commit

- Subject line: `<area>: <imperative summary>`. Areas: `design`, `kanban`, `docs`, `chore`, `promote`, `land`, `sync`, `status`, `pm`. **`pm:` is RESERVED for the PM role** — a non-PM agent editing a PM-owned file uses its own area, or `git log --grep='^pm:'` falsely attributes the work (this produced a "phantom second PM" on 2026-05-28). Full list: [`Onboarding/conventions.md`](./Onboarding/conventions.md).
- Include `Agent: <role-id>`, `Co-authored-by: <actual known Model Name> <noreply@<vendor>>`, and `Harness: <actual harness>` trailers. Use the [roster](./Agents/README.md) role ID prospectively (e.g. `v2-pm`, `contracts-dev`); model and harness are separate, and neither identifies a session. Preserve historical model-shaped slugs unchanged; never guess their role.
- **Before pushing, run `./scripts/open-decisions.sh --check`** — it fails if the generated decision roll-up no longer matches its sources.
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
| Agent profiles, cross-harness IDs and notes | [`Agents/`](./Agents/) |
| Milestones, ideas, research corpora | [`Milestones.md`](./Milestones.md), [`Ideas.md`](./Ideas.md), [`Reviews/`](./Reviews/), [`Brainstorms/`](./Brainstorms/) |
| The audit + generation tools | [`scripts/README.md`](./scripts/README.md) |
| Past one-line decisions | [`Decisions.md`](./Decisions.md) |
| Open questions across all designs | [`Tasks.md`](./Tasks.md) (Obsidian Tasks rollup) |
| ADR or spec in a dev repo | `../contracts/docs/adr/`, `../contracts/specs/` (etc. for client/sdk) |

## Sibling repos under /efs/

`contracts/` (Solidity, ADRs, specs — also hosts the live nextjs explorer), `sdk/` (JS/TS — **exists and is in flight**, branch `chore/scaffold`), `client/` (v1 Vite/Lit client, **hibernating**), `planning/` (this vault). Details: [`Onboarding/repo-map.md`](./Onboarding/repo-map.md).

Cross-repo reads via sibling paths — **count `../` from the file you are writing in**: `../contracts/…` from vault root, `../../` from `Designs/`, `../../../` from `Designs/efsv2/`. Getting this wrong is the most common broken link in the vault. Never use absolute `/efs/...` paths in committed files — bakes in a mount point.
