# For James

- **T-6 days to OnionDAO. Triage list (this week only):**
- **DECIDE — SDK track posture.** Drop / soft-launch (PM recommends) / push. Unblocks comms + entrant onboarding tone. Added 2026-05-26 by @pm.
- **DO — finish Lists merge.** You said you're wrapping it up. This is the keystone; once merged, Sepolia deploy + schema freeze fall out for free. Added 2026-05-26 by @pm.
- **DO — post one announce paragraph somewhere this week.** Even minimal. Silence = no attendees. Added 2026-05-26 by @pm.
- **CONFIRM — OnionDAO logistics.** Venue / dates within June / host expecting you. PM has no visibility into this. Added 2026-05-26 by @pm.
- **REVIEW — [[brainstorm-system]]** (drafted 2026-05-26 per your green light). Light read; promotes when you say go. Not blocking OnionDAO. Added 2026-05-26 by @pm.
- **HEADS-UP: Lists design coming for PM review** when you wrap it up. PM will read for vault coherence + surface concerns; not a substance reviewer. You decide who does substantive review. Added 2026-05-26.
- **COHERENCE BLOCKER — ADR-0041 and ADR-0043 are referenced as settled but don't exist as written ADRs.** Multiple batch-3 brainstorms (`bs-schema-freeze-recommendation-v1`, `bs-contract-upgradeability-v1`, `bs-vocab-coherence-audit-v1`) all bumped into this. ADR-0041 (PIN/TAG cardinality split) is cited as the foundation of 3-of-7 schema decisions. ADR-0043 has TWO conflicting definitions on two branches (`editions-to-lenses` says "Rename editions to lenses" Accepted; `custom-lists` says "EFS Edge Constraint Callbacks" Deferred) — whichever lands second must renumber, and the Glossary already links a dangling reference. **Ask:** can these get written/resolved (or have the "settled" framing removed) before more agents pile decisions on phantom ADRs? Time-sensitive: gets worse when Lists merges and specs sync to `main`. Added 2026-05-26 by @pm.
- **DOWNGRADED — typed-edge schema gap is NOT a Lists-blocker.** Earlier surface said this might need addressing before Lists merge. Batch-2 audit ([[Brainstorms/2026-05-26-bs-schema-coverage-audit-v1-schema-gap-map|bs-schema-coverage-audit-v1]]) re-evaluated honestly: of the 8 TAG-overload roles flagged, 5 work fine, 2 strain but workable with SDK conventions, and only 1 (state-transition / event edges with payload — provenance handoff, ownership transfer, synonymy-with-citation) actually breaks. That one is a real gap deserving an EVENT/TRANSITION schema design **before mainnet shape freeze**, but is NOT blocking Sepolia/OnionDAO. Removing the time-pressure framing. Updated 2026-05-26 by @pm.
- **DEFERRED (do not think about this week):** my SOUL review, Milestones.md expansion, SDK design thread, Devcon, EFS OS SDK, dev tool app.

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

When you produce something James needs to look at, append a bullet at the **top of this file** (above the `---` separator). One line, clearly actionable:

```markdown
- **Awaiting promotion: [[design-slug]]** — read & promote per [[design-system#Promotion ceremony]]. Added 2026-05-21.
- **Blocked on decision: [[some-design]]** — needs your call on X (see `## Open questions` in the design). Added 2026-05-21.
- **#needs/james flag in [[some-design]]** — quick question about Y. Added 2026-05-21.
```

Conventions:

- **Top of file = most recently added.** James scans top-down.
- **One line each.** Description + link + date. No nested bullets.
- **Remove your item** when James has acted on it (don't archive; the commit history is the archive).
- **Empty file is the goal state** — anything above the `---` separator means James has work waiting.
- **WIP limit:** 3 ready-for-promotion items at any time (per [[conventions#WIP limits]]). If this file has 3 awaiting-promotion items, stop queuing new ones until James clears one.

Don't put low-priority observations here. Use [[Decisions]] for one-line decisions you made yourself, `Daily Notes/` for ephemeral notes, design-file `## Open questions` for trackable items inside a design.
