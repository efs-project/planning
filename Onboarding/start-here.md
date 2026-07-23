# Start here

New agent in the EFS planning vault — the brain for the EFS agent swarm. From "I just arrived" to "I'm working on X."

> **You may not actually be in `/efs/`.** The docs describe a target sibling-repo layout under `/efs/`; your working copy may sit elsewhere. Conventions are identical — substitute your real path for `/efs/planning/` below.

## First five minutes

1. `cd <your planning checkout> && git fetch origin && git rebase --autostash origin/main`. Always sync before reading or writing.
2. Open [[Kanban]]. Read columns in order: **In Flight**, **Blocked**, **Backlog**.
3. Open the [Designs owner decision inbox](../Designs/owner-decision-inbox.md) if your work touches design, prioritization, or a question for James; follow it to the owning folder's single live queue.
4. If you have a specific task from James (chat or a previous turn), go do that. Stop reading this file.

> **Decision rule:** unchecked boxes and "open questions" in source designs are not automatically James decisions. The owning folder's owner inbox says whether a choice is live now, evidence-gated, launch-only, settled, delegated, or superseded. Record adopted EFS v2 answers in [owner rulings](../Designs/efsv2/owner-rulings.md); use [[Owner-Inbox]] for broader non-design attention.

## Decision tree (if no task assigned)

```
Is there an In Flight card claimed by you?
├─ Yes → continue your work. Update the claim's "expires" date.
└─ No → keep going

Is there an In Flight card expired (today > expires) and unclaimed?
├─ Yes → check with James in chat before reclaiming.
└─ No → keep going

Is there a design in #status/review that needs another agent's eyes?
├─ Yes → read it, comment inline, update its review state.
└─ No → keep going

Is there a Backlog item that matches your capabilities?
├─ Yes → claim it: move to In Flight with annotation
│        (`— @<agent>, branch <name>, claimed YYYY-MM-DD, expires YYYY-MM-DD`).
└─ No → ask James in chat. DO NOT invent work.
```

## What "claim a card" looks like

Move the card from **Backlog** to **In Flight** in `Kanban.md` and add the annotation line beneath it:

```markdown
- [ ] Implement [[0007-offline-sync]] #repo/client #repo/sdk
  — @claude-opus-4.7, branch claude/offline-sync, claimed 2026-05-21, expires 2026-05-24
```

3-day expiry by default; update it whenever you check in.

## What "do not invent work" means

If nothing in the decision tree applies, **stop and ask in chat**. Unprompted designs, refactoring something that looks messy, unrequested tests, "while I'm here" cleanups — all inventions; they bypass the coordination system. Exception: trivial typo fixes in comments, error strings, or markdown prose.

## Where to find things

Full map: [AGENTS.md § Where to find things](../AGENTS.md). Vault-specific extras:

| You need… | Look in… |
|---|---|
| An adopted EFS v2 owner ruling | [EFS v2 owner rulings](../Designs/efsv2/owner-rulings.md) |
| A specific design | `Designs/README.md` (curated map) or grep `Designs/` |
| Terminology | [[Glossary]] |
| How something works in EFS | `Architecture/README.md` |
| How to do something process-wise | the rest of `Onboarding/` (see [[Onboarding/README\|its map]]) |
| Engineering/research open questions | grep `## Open questions` in `Designs/`; do not treat them as owner choices unless an owner inbox does |

## Next reads

- [[repo-map]] — what's where in `/efs/`.
- [[write-a-design]] — if your task involves writing a design.
- [[conventions]] — tags, paths, tri-sync, commit messages.
- [[escalation]] — when to stop and ask vs. note and continue.
