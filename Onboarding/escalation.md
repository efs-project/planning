# Escalation

When to stop and ask vs. note-and-continue. Adapted from `contracts/docs/agent-workflow.md` and scoped to planning-vault artifacts.

James runs multiple agents in parallel. Wrong-direction work compounds expensively. **When in doubt, default to Tier 2.**

## Tier 1 — STOP AND ASK NOW (blocking)

Stop work immediately. Ask in chat. Do not commit, do not prepare speculative work, do not just note-and-continue. Wait for an answer.

Triggers:

- About to do something that **contradicts the [[design-system]] meta-design** (e.g., self-numbering a draft, force-pushing past a rebase conflict, deleting a tombstoned design).
- About to **modify a landed (`#status/landed`) design's tombstone** — tombstones are append-only history; supersede with a new design instead.
- About to **promote a design** as anything other than James (or via James's literal trust token).
- Choosing between **two or more non-trivial structural approaches** that affect multiple files, with no clear winner from existing docs.
- About to **delete or rewrite >200 lines** of vault content.
- Discovering that completing your task as specified would **break a convention James didn't consider** (e.g., your design needs to reference a glossary term that doesn't exist yet AND requires a Glossary structure change).

## Tier 2 — ASK BEFORE NEXT COMMIT (semi-blocking, default for ambiguity)

Finish the immediate task. At end of turn: surface the question in chat. Do not start the next commit until resolved.

Triggers:

- Introducing a **new tag** to the canonical vocabulary (`#status/...`, `#kind/...`, `#repo/...`, etc.) — update [[conventions]] in the same commit and flag in chat.
- A design that **affects another agent's in-flight work** (look at [[Kanban]] In Flight before committing).
- A **change to `Designs/_template.md`** that affects how every future draft is shaped.
- **Deviation from a documented convention** (`[[conventions]]`) — propose the change in chat first.
- The human's instruction has **two reasonable interpretations** and you picked one.

## Tier 3 — NOTE FOR LATER (non-blocking)

Append to the appropriate place and keep working.

- **In-design `<!-- AGENT-Q: ... -->` comments** — questions bound to a specific line, addressed before promotion.
- **Open Questions section** of an in-flight design — for trackable items, surfaced via the Tasks plugin rollup.
- **`Daily Notes/<date>.md`** — for nice-to-have observations that don't deserve their own design.
- **New design with `#kind/question`** — for Tier 2-shaped questions that need real discussion.

## Trivial changes — no tier

For these, skip the tier check entirely and just do the work:

- Typo fixes in prose, error strings, comments.
- Adding a glossary entry for a term used by a design you're writing.
- Updating the `expires` date on your own In Flight Kanban card.
- Local rephrasing within a single design's body (you authored it).
- Whitespace / formatting fixes.

Sanity check: grep [[design-system]] and [[conventions]] for the exact convention you're touching. If a hit, the change is no longer trivial — return to the tier check.

## Asking well

When you escalate (Tier 1 or 2), James's time is the constrained resource. Make the question:

- **Specific.** "Should we do A or B?" with file paths and trade-offs. Not "what should we do?"
- **Backed by reasoning.** Why is this hard? What did you consider? What's your default if no answer?
- **Bounded.** What does answering unblock? What does NOT answering let you keep doing?

## When you make a decision

If you act on a Tier 2 or 3 call:

- **Tier 2** — write the rationale into the affected file (design body, [[conventions]]) and mention in PR/commit body so it's reviewable.
- **Tier 3** — one-line note in the file or `Daily Notes/`.

## When the rules are wrong

If a rule here or in [[design-system]] is blocking sensible work, that's a Tier 2 trigger. Surface it. Don't quietly bypass.
