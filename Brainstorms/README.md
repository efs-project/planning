# Brainstorms

Raw, exploratory, agent-generated content. The place where ideas live before they're real artifacts (Designs / Kanban cards / Decisions).

**Canonical conventions: [[brainstorm-system]].** This README is the quick reference.

## What goes here

- Use case generation ("10 EFS use cases across industries")
- Edge case hunts ("failure modes for ADR-0041")
- Comparative analyses ("how 5 decentralized FS projects handle X")
- Steel-mans / adversarial brainstorms
- Captured external context (chat dumps, design notes from outside the vault)
- Requirements lists pulled from user research
- Half-baked ideas worth not losing

## What does NOT go here

- Proper architectural proposals → `Designs/`
- Active work items → `Kanban.md`
- Per-day notes / human ephemera → `Daily Notes/`
- Decisions James made → `Decisions.md`

## Five rules

1. **One file per brainstorm.** New thought = new file.
2. **Frontmatter required and parseable.** `agent`, `date`, `status` mandatory; `anchors` optional but useful.
3. **Filename: `YYYY-MM-DD-<agent-slug>-<topic-slug>.md`.** Date-first, kebab-case.
4. **Do not edit another agent's brainstorm.** Reference it from a new one if you want to build on it.
5. **Only the PM reads cross-cuttingly.** Other agents read brainstorms in their scope; don't try to curate.

## Status vocabulary

| | |
|---|---|
| `raw` | new, awaiting PM curation |
| `surfaced` | PM brought to attention |
| `integrated` | folded into a real artifact; see `integrated_into:` |
| `reference` | durable context; indefinite lifespan |
| `obsolete` | deliberately dead; requires `reason:` in frontmatter |

**No auto-anything.** Pruning is always deliberate.

## Minimal frontmatter example

```yaml
---
agent: bs-divergent-usecases
date: 2026-06-03
status: raw
anchors:
  - area: sdk
  - milestone: oniondao
---

# 10 EFS use cases for the SDK to stress-test

(freeform content)
```

## Index

PM-maintained map: [`INDEX.md`](./INDEX.md). Grouped by area and status.
