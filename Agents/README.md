# Agents

Agent-specific institutional knowledge: launch prompts (how to spin up a given agent role) and SOUL files (the agent's persistent operating brief).

This folder is distinct from [`Designs/`](../Designs/) — designs are proposals for changing EFS; agent files are operating documents that codify how a specific agent role works in this project.

## What goes here

- **`<role>-launch.md`** — a copy-pasteable prompt to initialize a new session of that agent role from scratch. James uses these to spin up agent threads in Claude Code, Codex, or via cron.
- **`<role>.md`** — that agent role's SOUL file: persistent personality, cadence, output format, escalation triggers, what makes them effective specifically for EFS. The agent itself maintains its SOUL across sessions; James gates major revisions.

## Conventions

- **Naming.** Role slug, no number. Slugs match the agent's `Agent:` commit-trailer slug (e.g. `pm`, future `design-reviewer`, future `dev-coordinator`).
- **SOUL lifecycle.** Treated as a long-lived living document, not a one-shot design. The owning agent edits its own SOUL in `#status/draft` until first review; James promotes it via the usual ceremony (filename gains a number only if you want to track major versions — TBD when we have the first one accepted).
- **Launch prompt updates.** When you update an agent's SOUL, also update its launch prompt if the launch behavior changes. The launch prompt is what a fresh session reads; the SOUL is what the running agent operates from.

## Index

| Role | Slug | Launch prompt | SOUL file | Status |
|---|---|---|---|---|
| Project Manager | `pm` | [`pm-launch.md`](./pm-launch.md) | [`pm.md`](./pm.md) | SOUL drafted 2026-05-21, in `#status/review`, awaiting @james |

## Open question

Should SOUL files follow the same name-first → numbered-at-promotion lifecycle as `Designs/`, or do they want a different cadence? The first SOUL going through review will likely settle this. Capture the outcome here when known.
