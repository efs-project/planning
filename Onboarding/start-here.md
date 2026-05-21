# Start here

You're a new agent or new contributor in `/efs/`. This is the planning vault — the brain for the EFS agent swarm. This file gets you from "I just arrived" to "I'm working on X."

## First five minutes

1. `cd /efs/planning && git pull --rebase`. Always sync before reading or writing.
2. Open [[Kanban]]. Look at columns in order: **In Flight**, **Blocked**, **Backlog**.
3. If you have a specific task from James (in chat or a previous turn), go do that. Stop reading this file.

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

Move the card from **Backlog** to **In Flight** in `Kanban.md`. Add the annotation line beneath the card:

```markdown
- [ ] Implement [[0007-offline-sync]] #repo/client #repo/sdk
  — @claude-opus-4.7, branch claude/offline-sync, claimed 2026-05-21, expires 2026-05-24
```

Use a 3-day expiry by default. Update the expiry date whenever you check in.

## What "do not invent work" means

If nothing in the decision tree above applies, **stop and ask in chat**. Drafting a design unprompted, refactoring something that looks messy, adding tests that no one requested, "while I'm here" cleanups — all are inventions. They're not necessarily bad ideas, but they bypass the planning system that exists to keep work coordinated.

The exception: trivial typo fixes in comments, error strings, or markdown prose. Those go through without ceremony. Everything else: ask.

## Where to find things

| You need… | Look in… |
|---|---|
| Active and queued work | [[Kanban]] |
| A specific design | `Designs/_MOC.md` or grep `Designs/` |
| Terminology | [[Glossary]] |
| How something works in EFS | `Architecture/_MOC.md` |
| How to do something process-wise | the rest of `Onboarding/` (see [[_MOC]]) |
| An ADR or spec from a dev repo | `../contracts/docs/adr/` or `../contracts/specs/` (and equivalents in `client/`, `sdk/`) |
| Open coordination questions | grep `## Open questions` in `Designs/` |

## Next reads

- [[repo-map]] — what's where in `/efs/`.
- [[write-a-design]] — if your task involves writing a design.
- [[conventions]] — tags, paths, tri-sync, commit messages.
- [[escalation]] — when to stop and ask vs. note and continue.
