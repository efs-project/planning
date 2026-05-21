# Designs

Numbered design proposals with lifecycle. The canonical protocol lives in [[design-system]] (this folder's own meta-design). The vault's main [README](../README.md) is the entry point. This file is the folder-local quick-start.

## Quick start (writing a new design)

1. Copy `_template.md` to `Designs/<descriptive-slug>.md`. **Do not include a number** — numbers come at promotion only.
2. Fill the front-matter (`**Status:**`, `**Target repos:**`, `**Depends on:**`).
3. Match the tag line to status: `#status/draft #kind/design #repo/<each-target>`.
4. Write the design. Open questions go in `## Open questions` as `- [ ]` checkboxes.
5. Commit: `design: draft <slug> — short title`.
6. Push.
7. When ready for review: change prose `**Status:** review`, tag `#status/review`, push.
8. When ready for promotion: fill the `## Pre-promotion checklist`, change status to `ready-for-promotion`, ask James.

See [[write-a-design]] in Onboarding for the full walkthrough.

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

## Index

For a curated map of designs by status and target-repo, see `_MOC.md`. The list below is the directory listing.

| File | Status | Target repos |
|---|---|---|
| [[design-system]] | draft | `planning` |
| [[cross-repo-reference-mirror]] | draft (`#blocked-on/concrete-CI-need`) | `planning`, `contracts` |
