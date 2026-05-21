# Cross-repo reference mirror

**Status:** draft
**Target repos:** `planning`, `contracts` (later: `client`, `sdk`)
**Depends on:** —
**Supersedes:** —

#status/draft #kind/design #repo/planning #repo/contracts #blocked-on/concrete-CI-need

> **Status note (2026-05-21):** This design was originally drafted as `DESIGN-0001` when the planning vault had no `/efs/` colocation. The subsequent decision to colocate all EFS repos under `/efs/` (see [[design-system]]) made the local-machine sibling-read case trivial without a mirror, eliminating the design's primary use case. The design is kept on file because two narrower use cases still exist (see below) — but it does not warrant implementation until one of them surfaces a concrete need.

## Problem

Agents working in `/planning/` need to read canonical reference material (ADRs, specs) from sibling dev repos to write informed designs. With `/efs/` colocation, the local-machine case is solved: agents read `../contracts/docs/adr/0041-...` directly from the sibling clone.

Two narrower failure modes survive:

- **CI / restricted environments** — an agent in a GitHub Actions runner usually has only one repo checked out and can't read another repo's files. A `planning`-repo workflow that lints designs or resolves wiki-links to ADRs has no `contracts/` available.
- **Web/Obsidian-Publish rendering** — humans browsing `github.com/efs-project/planning` see broken `../contracts/...` relative paths. If Obsidian Publish or a static site is ever used, same problem.

(The original third use case — local-machine stale clones, branch-divergent reads — is real but rare and easily fixed by `git pull` in the sibling repo. Not load-bearing.)

## Proposal

Mirror canonical reference material from each dev repo into `planning/Reference/` as read-only flat markdown files, synced on every push to the source repo's `main` branch.

### Directory layout

```
planning/
  Reference/
    README.md                  ← banner: "Read-only mirror. Do not edit."
    contracts/
      adr/
        0001-three-layer-data-model.md
        ...
        0041-pin-tag-schema-split-for-cardinality.md
      specs/                   ← optional, deferred (see Open Questions)
    client/
      adr/
        ...
    sdk/
      adr/
        ...
```

Each mirrored file gets a banner comment so an agent that lands on it via grep, search, or wiki-link knows immediately it's a mirror:

```markdown
<!--
MIRRORED FROM github.com/efs-project/contracts/blob/main/docs/adr/0041-pin-tag-schema-split-for-cardinality.md
DO NOT EDIT IN THIS REPO. Edits here will be overwritten by the next sync.
Source of truth: github.com/efs-project/contracts
-->
```

### Sync mechanism

A GitHub Action in each source repo, triggered on push to `main` matching `docs/adr/**` (and later `specs/**`, conditional on the deferred specs decision):

1. Checkout the source repo at the new commit.
2. Checkout `efs-project/planning` at `main`.
3. Copy ADR files into `Reference/<source-repo>/adr/` with the banner prepended.
4. If the diff is non-empty, commit with message `sync(<source-repo>): mirror ADRs from <short-sha>` and push.

Commits authored by a bot identity so they're visually distinct from agent-authored semantic commits in `git log` and easy to filter out:

```bash
# scan history without the sync noise
git log --invert-grep --grep '^sync('
```

### What gets mirrored

- **Always: ADRs.** Per `contracts/docs/adr/README.md` they're immutable once Accepted, so the mirror is essentially append-only and drift between syncs is zero.
- **Conditional: specs.** Pending the deferred decision on where authoritative system specs live (saved in agent memory as `open-question-where-specs-live`). Recommend deferring spec mirroring until that decision is resolved — mirroring now would mean rewriting every copy when the source moves.
- **Never:** source code, tests, deploy scripts, internal docs, transient WIP, anything that isn't agent-consumable canonical reference.

### What agents do with it

- **Writing a design here in `planning/Designs/`** — reference ADRs by path: `Reference/contracts/adr/0041-pin-tag-schema-split-for-cardinality.md`. Wiki-links work too: `[[0041-pin-tag-schema-split-for-cardinality]]` (Obsidian resolves to the mirror file).
- **Implementing in the target repo** — read the source-of-truth file (`docs/adr/0041-...`) directly. Don't read the planning mirror from inside `contracts/`; it may be a few minutes stale, and the local copy is right there.

### Trust model

The mirror is authoritative-for-reading only. The source repo's file is the truth. If an agent ever observes a discrepancy: the source wins. File a bug against the sync action, don't try to "fix" the mirror by editing it.

## Open questions

- [ ] **Sync direction**: push from the source repo's Action, or pull from a single `planning/` Action? Push is simpler (Action lives where the source files live, gets the new SHA implicitly). Pull is more decoupled (one Action handles all sources). Recommend **push** for v1; revisit if managing N source-repo Actions becomes annoying.
- [ ] **Bot identity**: real GitHub App, a dedicated machine user with PAT, or just a `Co-authored-by:` trailer on James's account? GitHub App is cleanest but takes setup. Recommend **dedicated machine user with PAT** for v1; promote to App if rate limits or audit needs push us there.
- [ ] **Specs mirroring** — defer until `open-question-where-specs-live` resolves, or mirror now as a convenience even if the source location may move later? Recommend defer.
- [ ] **What if an ADR is deleted from source?** Per `contracts/`'s append-only ADR discipline this shouldn't happen, but if it did: should the mirror keep a tombstone? Probably yes — agents finding broken `Reference/contracts/adr/NNNN-...` links shouldn't get a 404.
- [ ] **Commit-noise budget** — ~N sync commits/day per active source repo. Acceptable, but humans scanning `git log` will want a filter recipe in the README. The `git log --invert-grep '^sync('` snippet above goes in there.

## Implementation notes

**In `contracts/` (and analogously `client/`, `sdk/` later):**

- Add `.github/workflows/sync-reference.yml`.
- Trigger: `on: push: { branches: [main], paths: ['docs/adr/**'] }`.
- Needs a PAT or App token with write access to `efs-project/planning`.
- ~30 lines of YAML; `actions/checkout` (both repos), a script that prepends the banner during copy, then a conditional commit + push if the diff is non-empty.

**In `planning/`:**

- Add `Reference/README.md` describing the directory, naming the bot identity, and linking back to this design.
- Add a `Reference/` entry to the main README's Directory Structure (currently marked *planned* — promote to *present*).
- Optionally a `CODEOWNERS` entry making the bot the owner of `Reference/**`, so accidental human edits show up as a CODEOWNERS-flagged file in PR review.

**Rollout order:**

1. Land this design (status → `accepted`); add a Backlog Kanban item: `- [ ] Implement [[0001-cross-repo-reference-mirror]] #repo/contracts #repo/planning`.
2. Set up bot identity and PAT.
3. Implement `contracts/` → `planning/` sync. Smoke test: edit an ADR, verify the mirror updates within minutes.
4. Backfill: one-time copy of all existing `contracts/docs/adr/*` into the mirror.
5. Repeat steps 3–4 for `client/` and `sdk/` once those repos exist.
6. Tombstone this design once the sync is in production across all then-existing repos.
