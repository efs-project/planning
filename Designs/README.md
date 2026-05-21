# Designs

Numbered design proposals with lifecycle. The full rules live in the vault's main [README → Designs Protocol](../README.md#-designs-protocol); this file just indexes the directory and notes a few folder-local conventions.

## Quick start

1. Copy `_template.md` to `NNNN-kebab-case-slug.md` (next free number; see index below).
2. Fill in the front-matter (`**Status:**`, `**Target repos:**`, etc.) and the matching tag line (`#status/draft`, `#repo/<name>`, etc.).
3. Write the design. Open questions go in the `## Open questions` section as `- [ ]` checkboxes.
4. Commit with message `design: draft DESIGN-NNNN — short title` and push.

## File-naming

`NNNN-kebab-case-slug.md`. Numbers are sequential, permanent, and never reused. Slugs can change without breaking references. Reference a design in prose as `DESIGN-NNNN`.

## Wiki-link convention

Cross-design links use the Obsidian wiki-link form on the filename (no extension):

```markdown
see [[0001-cross-repo-reference-mirror]]
```

Use the alias form when the prose reads better:

```markdown
…depends on [[0001-cross-repo-reference-mirror|DESIGN-0001]]
```

## Index

Manually maintained for now. Replace with an Obsidian Bases view if it gets unwieldy.

| # | Title | Status | Target repos |
|---|---|---|---|
| 0001 | [Cross-repo reference mirror](./0001-cross-repo-reference-mirror.md) | draft | `planning`, `contracts` |
