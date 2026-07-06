# Designs

Design proposals with lifecycle. The canonical protocol lives in [[design-system]] (this folder's own meta-design). The vault's main [README](../README.md) is the entry point. This file is the folder-local quick-start AND the curated content map.

## Quick start (writing a new design)

1. Copy `_template.md` to `Designs/<descriptive-slug>.md`. **Do not include a number** — numbers come at promotion only.
2. Fill the front-matter (`**Status:**`, `**Target repos:**`, `**Depends on:**`).
3. Match the tag line to status: `#status/draft #kind/design #repo/<each-target>`.
4. Write the design. Open questions go in `## Open questions` as `- [ ]` checkboxes.
5. Commit: `design: draft <slug> — short title`.
6. Push.
7. When ready for review: change prose `**Status:** review`, tag `#status/review`, push.
8. When ready for promotion: fill the `## Pre-promotion checklist`, change status to `ready-for-promotion`, ask James.

See [`Onboarding/write-a-design.md`](../Onboarding/write-a-design.md) for the full walkthrough.

## File-naming

- Drafts: `<descriptive-slug>.md` — no number.
- Promoted: `NNNN-<descriptive-slug>.md` — number assigned by the human at promotion.

Reference any design as `DESIGN-NNNN` once promoted; before promotion, reference by slug or `[[wiki-link]]`.

## Wiki-link convention

Use `[[filename]]` (no extension) for in-vault references:

```markdown
see [[design-system]]
…depends on [[cross-repo-reference-mirror]]
```

Alias form when prose flows better:

```markdown
see the [[design-system|design system meta-design]]
```

Cross-repo references (ADRs, specs in dev repos) use markdown form:

```markdown
see [ADR-0041](../../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)
```

---

## Content map

Hand-curated index of designs in this folder, organized by **status** then by **target repo**. Updated in the same commit as design status changes (part of the tri-sync invariant).

For automated rollups by status, see `../_Index.base` (Obsidian Bases view; configured by James).

### In flight

#### Draft

| Design | Target repos | Notes |
|---|---|---|
| [[efs-substrate-decision]] | `planning`, `contracts`, `sdk` | The foundation ruling: EAS-carried v2+ with mechanically-reserved portability (envelope/KEL/identity-word); portable currency explicitly not sold; experiments + commissioned workstreams. Amends the three v2 docs. |
| [[deterministic-ids]] | `contracts`, `sdk`, `planning` | v2 core: the identity Codex — deterministic EFS IDs, derivation rules, registry, duplicate/existence/refUID semantics. Amended by [[efs-substrate-decision]]. |
| [[efs-v2-holistic-redesign]] | `planning`, `contracts`, `sdk` | Umbrella: the one-final-freeze bundle, conventions-before-data, gap workstreams, explicit non-changes. |
| [[efs-v2-transition-plan]] | `planning`, `contracts`, `sdk` | Guardrails, phase sequence, verification gates, abort triggers for the v2 window. |

#### Review

*(none)*

#### Ready for promotion

*(none)*

### Deferred / blocked

| Design | Target repos | Blocked on |
|---|---|---|
| [[cross-repo-reference-mirror]] | `planning`, `contracts` | `#blocked-on/concrete-CI-need` — `/efs/` colocation removed the primary use case; will resurface if CI needs cross-repo ADR access. |

### Accepted (numbered, in effect)

| Design | Target repos | Notes |
|---|---|---|
| [[0001-design-system]] | `planning` | Meta-design for this vault. Canonical protocol — perpetual reference, does not progress to `landed`. Promoted 2026-05-21. |

### Landed

*(none)*

### Abandoned / rejected

*(none)*

### By target repo

| Repo | Designs |
|---|---|
| `planning` | [[0001-design-system]], [[cross-repo-reference-mirror]] |
| `contracts` | [[cross-repo-reference-mirror]] |
| `client` | *(none)* |
| `sdk` | *(none)* |
