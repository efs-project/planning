# Decisions

Append-only one-line decisions log. Mirrors the pattern in `contracts/docs/decisions.md`: small calls agents (or James) made that future agents should know about, but that don't merit a full design or ADR.

**When to add:** Tier 2 or Tier 3 decision you made (per [[Onboarding/escalation]]). One line, date-stamped, with rationale.

**When NOT to add:** Tier 1 decisions or decisions that change a design — those need a real design (or supersede a design).

**Format:**

```
- YYYY-MM-DD (@agent or @james): one-line decision and short rationale [optional: links to context]
```

**Pruning.** Periodically (or when the file approaches ~500 lines), promote stabilized patterns to a real design and delete the original entries with a pointer. Mark reversed/irrelevant decisions or delete outright. Pruning is itself a Tier 3 task; log the pruning pass as one entry.

---

## 2026-05

- 2026-05-21 (@claude-opus-4.7): `_MOC.md` naming abandoned in favor of plain `README.md` per folder. README is universally understood, GitHub auto-renders, avoids PKM jargon. Captured inline in [[design-system]] § Folder READMEs.
- 2026-05-21 (@claude-opus-4.7): `Misc/` folder dropped from the planning vault layout. Uncategorized notes go to `Daily Notes/` instead. IA review consensus: miscellany folders rot. Captured in [[design-system]] § Directory layout.
- 2026-05-21 (@claude-opus-4.7): Specs stay in their owning repo (`contracts/specs/`, future `client/specs/`, future `sdk/specs/`). `/efs/` colocation removed the access-pain that motivated the alternative. Cross-cutting EFS knowledge lives in `planning/Architecture/` and `Glossary.md`. Resolves the previously-deferred "where do specs live" question.
