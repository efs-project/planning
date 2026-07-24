# Repo map

The canonical EFS repos are siblings. `/efs/` is the portable name used in
documentation; discover the actual local parent directory before running
commands.

```text
/efs/
  planning/                  ← coordination vault and active v2 design work
  contracts/                 ← deployed v1/Sepolia implementation and specs
  sdk/                       ← unmerged pre-v2 SDK implementation; legacy input
  client/                    ← outdated v1 Vite/Lit client
  content/                   ← static content and playable examples
  devnet/                    ← v1 development-network operations
  datasets/                  ← dataset staging and deployment tooling
  hackathon/                 ← historical event materials
```

Additional worktrees may sit beside these repos. They are task-local working
state, not additional canonical repos.

## Current phase

EFS is being redesigned from scratch as EFS v2. The current design spine lives
in `planning/Designs/efsv2/`; Client v2 lives in
`planning/Designs/clientv2/`. The existing contracts, SDK, and client are useful
evidence, but they do not define the v2 architecture unless a current design
explicitly carries something forward.

## What's authoritative where

| Concern | Authority |
|---|---|
| Current v2 architecture and open choices | `planning/Designs/efsv2/` and its owner inbox |
| Current Client v2 architecture and open choices | `planning/Designs/clientv2/` and its owner inbox |
| Deployed v1 Solidity behavior | `contracts/specs/`, then `contracts/docs/adr/` |
| Deployed v1 Solidity code | `contracts/` |
| Pre-v2 SDK behavior | `sdk/docs/specs/` and `sdk/` — reference only during v2 redesign |
| Legacy Vite/Lit client behavior | `client/` — not the Client v2 implementation target |
| Cross-repo work and milestones | `planning/Kanban.md` and `planning/Milestones.md` |
| Cross-cutting terminology | `planning/Glossary.md` |
| Process and agent guidance | each repo's `AGENTS.md`, plus `planning/Onboarding/` |

**Rule of thumb:** use repo-local specs to understand what v1 does today. Use
the planning design spine to understand what v2 may become. Never silently
promote a v1 mechanism into the v2 baseline.

## Worktree convention

Task worktrees may live under a repo or beside the sibling repos. Resolve paths
from the worktree you actually occupy. Never assume a fixed number of `../`
segments without checking.

`planning/` is normally a shared main checkout rather than a worktree. Pull
before reading or writing and follow the PM concurrency rules in
`Agents/pm.md`.

## Cross-repo reads and writes

From the vault, sibling files are readable through relative paths such as
`../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md`.

Each commit belongs to the repo whose file it changes. A change spanning
planning, contracts, and client produces separate commits. Never bake an
absolute local path into a committed file.

## CI and GitHub Actions

A CI runner usually checks out one repository. Workflows cannot assume sibling
repos exist. If a check needs another repo's artifact, fetch or pin it
explicitly; do not rely on a developer's local sibling layout.
