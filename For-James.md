# For James

- **T-6 days to OnionDAO. Triage list (this week only):**
- **DECIDE — SDK track posture.** Drop / soft-launch (PM recommends) / push. Unblocks comms + entrant onboarding tone. Added 2026-05-26 by @pm.
- **DO — finish Lists merge.** You said you're wrapping it up. This is the keystone; once merged, Sepolia deploy + schema freeze fall out for free. Added 2026-05-26 by @pm.
- **DO — post one announce paragraph somewhere this week.** Even minimal. Silence = no attendees. Added 2026-05-26 by @pm.
- **CONFIRM — OnionDAO logistics.** Venue / dates within June / host expecting you. PM has no visibility into this. Added 2026-05-26 by @pm.
- **REVIEW — [[brainstorm-system]]** (drafted 2026-05-26 per your green light). Light read; promotes when you say go. Not blocking OnionDAO. Added 2026-05-26 by @pm.
- **GO recommendation delivered — EFS Lists ready for dev.** PM reviewed `custom-lists` design + ADR-0044 (coherence + brainstorm cross-reference, NOT Solidity security — that was the 3-reviewer sweep). Verdict: GO. Design independently arrived at the exact TAG-overload fix the brainstorms found. Your call to greenlight. Added 2026-05-26 by @pm.
- **DECISION NEEDED — ADR-0043 numbering collision (real, confirmed on branches).** `custom-lists` uses 0043 = "EFS Edge Constraint Callbacks" (Deferred); `editions-to-lenses` uses 0043 = "Rename editions to lenses" (Accepted). Whichever merges second must renumber; Glossary already links "per ADR-0043" expecting the rename. Pick the renumber loser before both land. (The earlier "phantom ADR" alarm is RESOLVED — ADR-0041/0042/0043/0044 all exist with coherent content on `custom-lists`; it was a main-vs-branch sync artifact.) Added 2026-05-26 by @pm.
- **MINOR — `git pull` the contracts repo when convenient.** Local `contracts/` checkout is ~30 commits behind `origin/main` (local ADRs stop at 0032; origin has through 0043). This caused the brief "phantom ADR" false alarm. Some batch-3 brainstorm findings (rot-audit "main missing ADRs", the "~11 contracts" count) were read from the stale local tree and are confounded — re-verify against `origin/` before acting on them. PM didn't pull in case the tree is intentionally pinned. Added 2026-05-28 by @pm.
- **REVIEW (you commissioned this) — proposed EFS design process.** [[Brainstorms/2026-05-28-pm-design-process-synthesis]] distills the Lists `design-lessons.md` + your "human attention is precious" framing into a streamlined lifecycle: **human judgment at the frame (early) + gate (late), AI grinds in between** — instead of 18 AI rounds before you read it. Meta-irony: this proposal should go through its own frame review (you read it, name the simplest framing) before I formalize it as `Onboarding/design-process.md`. No rush; not OnionDAO-blocking. Added 2026-05-28 by @pm.
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
