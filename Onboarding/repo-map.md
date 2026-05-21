# Repo map

`/efs/` is your home. All EFS repos live as siblings underneath it.

## Layout

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

**Rule of thumb.** Decisions tied to one repo's code live in that repo's ADRs. Decisions that span repos start as designs in `planning/Designs/` and land as ADRs in each affected repo.

## Worktree convention

Per-task worktrees live under each repo:

```
/efs/contracts/.worktrees/<slug>/    ← a worktree for a feature branch
/efs/client/.worktrees/<slug>/       ← same shape for client
```

The four-level path resolves siblings via `../../../planning/` from inside a worktree.

`/efs/planning/` itself is typically the main checkout (no worktrees) since it's documentation and concurrent edits go through rebase rather than branch isolation.

## Cross-repo reads (from inside the vault)

You can read sibling-repo files directly:

```bash
cat ../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md
ls ../contracts/specs/
```

Reference them in designs as repo-relative paths in prose:

```markdown
…per `contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md`…
```

Or as markdown links:

```markdown
…[ADR-0041](../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)…
```

Never use absolute `/efs/...` paths in committed files — bakes in a mount point.

## Cross-repo reads (from inside a worktree of another repo)

If you're in `/efs/contracts/.worktrees/feature-x/` and need to read planning:

```bash
cat ../../../planning/Designs/design-system.md
```

The path is `../../../planning/` from any worktree four levels deep.

## Cross-repo writes

Commit boundaries:

- Each commit lives in the repo whose content it changes.
- If a contracts PR tombstones a landed design, that's a separate commit in `planning/`, not a co-mingled commit. Same agent, two commits, two pushes.

## What's NOT in the planning vault

Per-repo specs live in their repo: `contracts/specs/`, eventually `client/specs/` and `sdk/specs/`. The decision "specs stay in the owning repo" was made deliberately (see [[design-system]] § Migration plan) because the `/efs/` colocation makes cross-repo reads cheap, and co-locating specs with code preserves the "spec changes alongside code in the same PR" enforcement.

## CI / GitHub Actions

A CI runner typically checks out one repo at a time. Cross-repo reads aren't directly available. If a workflow needs an ADR from a sibling repo, it must either `gh api`/clone on demand, or accept that some references can't resolve. See [[cross-repo-reference-mirror]] — a deferred design that would mirror canonical references into `planning/Reference/` for exactly this case.
