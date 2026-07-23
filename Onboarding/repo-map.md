# Repo map

`/efs/` is your home; all EFS repos are siblings underneath it.

```
/efs/
  contracts/                 ← Solidity contracts, ADRs, specs
  client/                    ← (future) production web client
  sdk/                       ← (future) JS/TS SDK
  planning/                  ← THIS VAULT — designs, kanban, glossary, onboarding
```

## What's authoritative where

| Concern | Lives in |
|---|---|
| Solidity code | `contracts/` |
| Contract behavior specs | `contracts/specs/` |
| Contract-level decisions (ADRs) | `contracts/docs/adr/` |
| Client UI code | `client/` (when it exists) |
| Client architecture decisions | `client/docs/adr/` (when it exists) |
| SDK API code | `sdk/` (when it exists) |
| Cross-repo design proposals | `planning/Designs/` |
| Cross-repo task board | `planning/Kanban.md` |
| Cross-cutting terminology | `planning/Glossary.md` |
| System overviews ("how EFS works today") | `planning/Architecture/` |
| Process / how-to-contribute | `planning/Onboarding/` |
| Human's daily notes / catch-all | `planning/Daily Notes/` |

**Rule of thumb.** Decisions tied to one repo's code live in that repo's ADRs. Decisions spanning repos start as designs in `planning/Designs/` and land as ADRs in each affected repo.

Per-repo specs stay in their repo (`contracts/specs/`, eventually `client/specs/`, `sdk/specs/`) — a deliberate decision (see [[design-system]] § Migration plan) so spec changes ride alongside code in the same PR.

## Worktree convention

Per-task worktrees live under each repo: `/efs/contracts/.worktrees/<slug>/`, `/efs/client/.worktrees/<slug>/`. From a worktree four levels deep, siblings resolve via `../../../planning/` (`cat ../../../planning/Designs/0001-design-system.md`).

`/efs/planning/` itself is typically the main checkout (no worktrees) — concurrent edits go through rebase rather than branch isolation.

## Cross-repo reads and writes

From inside the vault, sibling files read directly: `cat ../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md`. Reference them in designs as repo-relative paths in prose (…per `contracts/docs/adr/0041-...`…) or as markdown links: `[ADR-0041](../contracts/docs/adr/0041-...)`. Never use absolute `/efs/...` paths in committed files — bakes in a mount point.

Each commit lives in the repo whose content it changes. If a contracts PR tombstones a landed design, that's a separate commit in `planning/` — same agent, two commits, two pushes. Never co-mingle.

## CI / GitHub Actions

A CI runner typically checks out one repo at a time, so cross-repo reads aren't available. A workflow needing a sibling repo's ADR must `gh api`/clone on demand, or accept unresolvable references. See [[cross-repo-reference-mirror]] — a deferred design that would mirror canonical references into `planning/Reference/`.
