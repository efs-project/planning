# Design System

**Status:** draft
**Target repos:** `planning`
**Depends on:** —
**Supersedes:** —

#status/draft #kind/design #repo/planning

## Problem

EFS is being built by a swarm of AI coding agents working across multiple sibling repos (`contracts/`, future `client/`, future `sdk/`). The agents need a shared place to:

1. **Decide what to do** — read current state, pick up work, know they have the context to start.
2. **Coordinate cross-repo work** — designs that span repos, kanban that tracks work across repos, decisions that aren't per-repo.
3. **Build and share system knowledge** — architecture overviews, glossary, onboarding — things that don't belong in any one repo's specs or ADRs.

The human (James) is the single PM and reviewer. The system needs to give him observability without forcing him to read every file every day.

## Proposal

This file codifies the planning vault as the **brain for the swarm**: the place every agent reads to orient, decide, and act; and the place the human reviews to gate decisions and track project state.

### Directory layout

```
/efs/
  contracts/                 ← code, ADRs, specs (per-repo authoritative)
  client/                    ← (future)
  sdk/                       ← (future)
  planning/                  ← THIS VAULT
    README.md                ← SOP + directory map + quick start
    Kanban.md                ← cross-repo task board
    _Index.base              ← Obsidian Bases queries (configured by human)
    _Notes.canvas            ← Obsidian Canvas
    Daily Notes/             ← human's per-day notes; also catch-all for uncategorized content
    Designs/                 ← name-first drafts; numbered promoted designs
      README.md              ← folder intro + curated content map (by status)
      _template.md           ← copy to start a new draft
      <slug>.md              ← drafts
      NNNN-<slug>.md         ← promoted designs
    Architecture/            ← descriptive: "how the system works today"
      README.md              ← folder intro + curated content map
      *.md                   ← layered model, invariants, key concepts
    Glossary.md              ← single alphabetical file with ## term anchors
    Onboarding/              ← procedural: "how YOU do X"
      README.md              ← reading order + curated content map
      start-here.md
      write-a-design.md
      conventions.md
      repo-map.md
      escalation.md
```

**No `Misc/` folder.** Per information-architecture review, miscellany folders rot — content dropped in becomes invisible. Uncategorized notes go in `Daily Notes/`. Content with a durable home belongs in one of the named folders.

### `/efs/` agent home

All EFS repos live as siblings under `/efs/`. An agent's working directory is `/efs/` or a worktree inside a specific repo. Cross-repo reads are direct filesystem reads — no mirror needed for the local-machine case.

**Worktree convention:** `/efs/<repo>/.worktrees/<slug>`. Each task runs in a fresh worktree under its repo. The path resolves siblings via `../../../planning/`.

**Path conventions:**

| Use case | Form | Example |
|---|---|---|
| In-vault references | `[[wiki-link]]` (no extension) | `[[design-system]]`, `[[Glossary#TAG]]` |
| Out-of-vault references in prose | repo-relative, no `/efs/` prefix | `contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md` |
| Out-of-vault references in markdown link form | vault-rooted relative path | `[ADR-0041](../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)` |
| Shell command | whatever `pwd` requires | `cd ../contracts && git status` |

**Never use absolute `/efs/...` paths in committed files** — bakes in a mount point and breaks for any agent on a different layout (CI runners, alternate dev environments).

### Designs lifecycle

Designs are dynamic proposals. They live in `Designs/` and may span any subset of repos.

**Name-first drafts.** A new design is a file with a descriptive slug, no number:

```
Designs/offline-sync.md
```

> ⚠️ **DO NOT NUMBER YOUR OWN DRAFT.** Numbers are allocated only at the human-gated promotion ceremony. Writing `0007-offline-sync.md` yourself breaks the promotion process and bypasses the review gate.

**Status taxonomy:**

| Status | Meaning |
|---|---|
| `draft` | Author is writing; may be incomplete. |
| `review` | Author thinks it's ready; soliciting comment from other agents and human. |
| `ready-for-promotion` | Reviewed and converged; awaiting human promotion ceremony. |
| `accepted` | Promoted by human. Numbered. Implementation can start. |
| `landed` | Implementation merged in all target repos. Body replaced with tombstone. |
| `abandoned` | Explicitly chosen against. File kept for reasoning. |
| `rejected` | Hard-vetoed by human; do not revive without re-litigation. |

`rejected` and `abandoned` differ: `abandoned` may be revisited freely (the team got bored, the moment passed); `rejected` requires a new argument that addresses the original veto.

**Tri-sync invariant.** Status appears in three places (prose, tag, filename — at promotion). All three must agree:

- [ ] **Prose** `**Status:** X` in the design front-matter
- [ ] **Tag** `#status/X` on the tag line
- [ ] **Filename** — unnumbered slug pre-promotion (`offline-sync.md`); numbered slug post-promotion (`0007-offline-sync.md`)

Status changes update all three in the same commit. (Filename only changes at promotion.)

### Promotion ceremony

The promotion of a draft to `accepted` is **human-gated and atomic.**

**Pre-promotion checklist** (filled by the drafting agent, scanned by the human at promotion time). Every design carries this section near the bottom:

```markdown
## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
```

**The ceremony itself:**

1. Human reads the design and the pre-promotion checklist.
2. Human writes a one-line trust token in the design body: `Promoted by @james on YYYY-MM-DD`.
3. Atomic git operation:
   ```bash
   git mv Designs/<slug>.md Designs/NNNN-<slug>.md
   # edit prose Status, tag #status/, Kanban entry — all in same commit
   git commit -m "promote: DESIGN-NNNN — <title>"
   git push
   ```
4. Commit message MUST be `promote: DESIGN-NNNN — <title>`. The commit body MUST include the trust token literally.

**Why human-only.** The promotion is irreversible (number is permanent, references propagate). An agent that self-promotes can effectively self-approve, bypassing review. Requiring the trust token (written by James in chat or the file) creates an unforgeable signal.

**Trust model for promotion-by-proxy.** James may delegate the `git mv` execution to an agent for convenience, but only after he has written the trust token. The atomic commit shape — single `git mv` + tri-sync edit + token in body — is the integrity check. Any deviation triggers manual review.

**Number allocation.** At promotion time, the human (or proxy agent) `grep`s `Designs/` for the highest existing `NNNN-` prefix and picks the next free number. If two promotions race and both pick the same number, git push will reject the second; the loser rebases and bumps. The race is rare because promotion is a deliberate, human-driven act.

### Cross-repo work tracking

A multi-repo design lands when **all** target-repo PRs merge. The design file owns the truth.

Each `## Implementation notes` section includes a PR checklist:

```markdown
## Implementation notes

PR tracking:
- [x] contracts#412 — merged 2026-05-19
- [ ] client#88 — in review
- [ ] sdk#15 — not started

The design status moves to `landed` only when all PRs check.
```

**Kanban tracks attention; the design file tracks truth.** A Kanban card represents one work-stream (often one PR); the design file is the cross-cutting state record. Do not move the Kanban card to Done until the design is `landed`.

### Wiki conventions

Three folders with sharp scopes:

| Folder | Voice | Audience | Example |
|---|---|---|---|
| `Architecture/` | descriptive, present tense — "how X works today" | engineer wanting to understand | `Architecture/lenses.md` |
| `Onboarding/` | procedural, imperative — "how YOU do X" | newcomer wanting to act | `Onboarding/write-a-design.md` |
| `Designs/` | deliberative, forward-looking — "what we're going to change" | participant in a decision | `Designs/design-system.md` |

**Placement decision tree:**

- Is it being debated? → `Designs/`
- Does it tell a newcomer how to act? → `Onboarding/`
- Does it describe the live system? → `Architecture/`
- Is it a term that needs a definition? → `Glossary.md`
- Otherwise → `Daily Notes/`, or ask in chat

### Glossary

Single `Glossary.md` file, alphabetized by `## Term` H2 anchors. Wiki-links from anywhere in the vault target the anchor: `[[Glossary#TAG]]`.

A term graduates to its own `Architecture/<term>.md` page when its definition exceeds ~300 words. The Glossary entry becomes a 2-line stub linking to the page.

**Never split into `Glossary-A-F.md` and `Glossary-G-M.md`.** That's the worst of both worlds (file lookup AND anchor jumps). Stay single-file; use `## A`, `## B` section markers if scrolling becomes annoying.

### Link conventions

| Reference target | Form |
|---|---|
| Another file in the vault | `[[filename]]` (no extension) |
| A glossary term | `[[Glossary#term]]` |
| An ADR in a sibling repo | `[ADR-NNNN-title](../contracts/docs/adr/NNNN-title.md)` |
| A spec in a sibling repo | `[Spec NN](../contracts/specs/NN-...)` |
| A PR or external URL | full URL, or `[text](url)` |

Wiki-links use Obsidian's auto-rename on filename changes — this is why we prefer them inside the vault. Cross-repo links (markdown form) do **not** auto-update; rename-cleanup is a manual or scripted pass.

### Kanban conventions

`Kanban.md` is the cross-repo task board.

**Columns:** Backlog, In Flight, Blocked, Under Review, Done.

**In Flight card format:**

```markdown
- [ ] Implement [[0007-offline-sync]] #repo/client #repo/sdk
  — @claude-opus-4.7, branch claude/offline-sync, claimed 2026-05-21, expires 2026-05-24
```

The annotation includes: agent identity, branch, claim date, expiry date.

**TTL on claims.** An In Flight card includes a 3-day default expiry. After expiry, any agent (or the human) can reclaim the card. Prevents silent abandonment of work.

**Daily agent check-in.** Active agents append once per work-session to `Daily Notes/agent-status.md`:

```markdown
## 2026-05-21
- @claude-opus-4.7: offline-sync — finished proposal section, opening for review
- @codex-gpt-5: sdk-core — blocked on offline-sync acceptance
```

Provides James a Monday-morning standup view without reading every file or `git log`.

**Drafts-in-flight convention.** A new design draft also gets a Backlog Kanban entry tagged `#kind/design` so other agents see it before starting a parallel draft on the same topic:

```markdown
- [ ] Draft: offline-sync #kind/design #repo/client — @claude, started 2026-05-21
```

Move the card to Done (or delete) when the design is `accepted` or `abandoned`; the design file's status field is the truth from that point.

### Open questions in designs

A design's `## Open questions` section uses `- [ ]` checkbox lists. Obsidian's Tasks plugin rolls these into a global view; the human can scan all open questions across all designs in one place.

Resolve in place when answered — replace the unchecked item with `- [x]` plus a one-line note pointing at the resolution (a sibling design, a James decision in chat captured in `Daily Notes/`, an ADR in a sibling repo).

For Tier 1/2 questions about **cross-cutting planning concerns** (not tied to one design — e.g., "where do specs live"), open a new design tagged `#kind/question` if the question deserves the lifecycle. Otherwise capture in `Daily Notes/`.

### Folder READMEs (content maps)

Each major folder gets a `README.md` that serves as both folder intro and hand-curated content map — organized meaningfully (by status, by subsystem, by reading order), not just alphabetically. Examples:

- `Designs/README.md` — designs grouped by status and by target-repo
- `Architecture/README.md` — grouped by subsystem (data model, indexing, router, etc.)
- `Onboarding/README.md` — recommended reading order for new agents

The folder README is the human's mental model expressed in markdown. `_Index.base` (Obsidian Bases) supplements with automatic rollups configured by James in Obsidian; the curated README is what an agent reads first.

Naming note: this convention uses plain `README.md` rather than the Obsidian-community `_MOC.md` ("Map of Content"). README is universally understood, renders on GitHub automatically, and avoids PKM-specific jargon.

### Onboarding/ — ships with five files

1. **`start-here.md`** — decision tree from "I just arrived" to "I'm working on X." Includes the explicit "do not invent work" rule.
2. **`write-a-design.md`** — annotated walkthrough of the full design lifecycle. Includes the **DO NOT NUMBER YOURSELF** warning in bold.
3. **`conventions.md`** — tri-sync invariant, tag vocabulary, commit-message style, path forms, link conventions. Deep reference.
4. **`repo-map.md`** — `/efs/` layout, what's authoritative where, worktree convention.
5. **`escalation.md`** — Tier 1/2/3 model adapted from `contracts/docs/agent-workflow.md`, scoped to planning artifacts.

These ship as seed versions in the same change that lands this design. They will evolve.

### Migration plan

When this design is promoted (becomes `0001-design-system.md`):

1. Rename `Designs/0001-cross-repo-reference-mirror.md` → `Designs/cross-repo-reference-mirror.md`. Set status to `draft`, add `#blocked-on/concrete-CI-need` tag, drop "DESIGN-0001" prefix from the title.
2. This file: written as `Designs/design-system.md` (name-only). Promoted to `Designs/0001-design-system.md` at the ceremony.
3. Update `Designs/README.md` to remove old DESIGN-0001 references, point at this design and the deferred mirror draft, and fold the curated content map into the same file (no separate MOC file).
4. Update `Designs/_template.md` to match the new name-first + new-taxonomy + tri-sync-checklist format.
5. Add `Architecture/README.md` and `Onboarding/README.md` as folder intros + curated content maps. (`Designs/README.md` already exists; gets the same treatment.)
6. Create `Glossary.md` seeded with load-bearing EFS terms: anchor, attestation, data, design, edge, EFS, ephemeral/durable/etched, lens, mirror, PIN, planning vault, property, sort overlay, TAG, tombstone, tri-sync.
7. Create the five Onboarding files (seed versions).
8. Update main `README.md`: refresh directory listing, point at this design as the canonical protocol, trim duplicated lifecycle/tag/protocol prose that this design now owns.
9. Update agent memory: `efs-planning-repo.md` reflects new structure; close `open-question-where-specs-live` with the decision "specs stay in their owning repo" (rationale: `/efs/` colocation removes the access-pain motivation, and per-repo specs preserve code-review-enforces-sync).
10. Add Kanban Backlog entry: `- [ ] Migrate to /efs/ home directory layout #repo/planning #blocked-on/human-decision` — the actual `mv` of repos under `/efs/` is a James decision and is not blocked by this design.

### What's deferred

- **`Reference/` mirror** — `Designs/cross-repo-reference-mirror.md` stays in draft, blocked on a concrete CI need. Will resurface when a CI workflow specifically requires cross-repo ADR access.
- **Rename-cleanup tooling** (`scripts/rename-design.sh`) — needed when first rename-with-cross-repo-back-refs happens. ~20 lines of bash. Not blocking.
- **`_Index.base` configured queries** — Obsidian Bases syntax; James configures in Obsidian directly.
- **Pre-commit hooks** for tri-sync enforcement — convention v1; harden if violated in practice.
- **Promotion priority field** (P0/P1/P2 tags) — current scale doesn't need it. Add when the promotion queue regularly exceeds three.
- **Reverse index** (code → governance) — agents asking "what design governs this file" — defer; tags + grep suffice.
- **CODEOWNERS on Designs/** — only relevant if planning adopts a PR-flow. Currently direct-push.

## Open questions

- [ ] **Does the literal move of repos to `/efs/` happen now or as a separate task?** This design assumes `/efs/` paths as the convention but doesn't require the move to land first. Recommend: design accepted now with paths as the convention; the literal `mv` of clones is a James decision on a Backlog Kanban item.
- [ ] **`#priority/{p0,p1,p2}` tag on Backlog items?** PM-review agent suggested for triage. Defer until volume justifies; revisit when the In Flight column regularly exceeds three.
- [ ] **CODEOWNERS-style protection on `Designs/_template.md`** so an accidental edit there doesn't ripple to every future draft? Probably YAGNI; flag if a template-edit accident happens.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

PR tracking (none yet — design lives in `planning/` and is the migration).

Implementation is the migration plan above. Single commit (or small batch). No separate code repo work.
