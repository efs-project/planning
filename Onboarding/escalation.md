# Escalation

When to stop and ask vs. note-and-continue. Adapted from `contracts/docs/agent-workflow.md`. **When in doubt, default to Tier 2.**

## Tier 1 — STOP AND ASK NOW (blocking)

Stop immediately, ask in chat, wait for an answer. Do not commit, do not prepare speculative work, do not note-and-continue.

- Anything that **contradicts the [[design-system]] meta-design** (self-numbering a draft, force-pushing past a rebase conflict, deleting a tombstoned design).
- **Modifying a landed (`#status/landed`) design's tombstone** — tombstones are append-only; supersede with a new design instead.
- **Promoting a design** as anyone other than James (or via James's literal trust token).
- Choosing between **two or more non-trivial structural approaches** affecting multiple files, with no clear winner from existing docs.
- **Deleting or rewriting >200 lines** of vault content.
- Discovering that your task as specified would **break a convention James didn't consider** (e.g. it needs a glossary term that doesn't exist AND a Glossary structure change).

## Tier 2 — ASK BEFORE NEXT COMMIT (semi-blocking, default for ambiguity)

Finish the immediate task, surface the question in chat at end of turn, don't start the next commit until resolved.

- Introducing a **new tag** to the canonical vocabulary (`#status/...`, `#kind/...`, `#repo/...`) — update [[conventions]] in the same commit and flag in chat.
- A design that **affects another agent's in-flight work** (check [[Kanban]] In Flight before committing).
- A **change to `Designs/_template.md`**, which shapes every future draft.
- **Deviation from a documented convention** ([[conventions]]) — propose it in chat first.
- The human's instruction has **two reasonable interpretations** and you picked one.

## Tier 3 — NOTE FOR LATER (non-blocking)

Append to the right place and keep working.

- **In-design `<!-- AGENT-Q: ... -->` comments** — questions bound to a specific line, addressed before promotion.
- **Open Questions section** of an in-flight design — trackable items, surfaced via the Tasks plugin rollup.
- **`Daily Notes/<date>.md`** — observations that don't deserve their own design.
- **New design with `#kind/question`** — Tier 2-shaped questions needing real discussion.

## Trivial changes — no tier

- Typo fixes in prose, error strings, comments.
- Adding a glossary entry for a term used by a design you're writing.
- Updating the `expires` date on your own In Flight Kanban card.
- Local rephrasing within a single design's body (you authored it).
- Whitespace / formatting fixes.

Sanity check: grep [[design-system]] and [[conventions]] for the exact convention you're touching. A hit means it's no longer trivial — return to the tier check.

## Asking well

James's time is the constrained resource. Make the question:

- **Specific.** "Should we do A or B?" with file paths and trade-offs. Not "what should we do?"
- **Backed by reasoning.** Why is this hard? What did you consider? What's your default if no answer?
- **Bounded.** What does answering unblock? What does NOT answering let you keep doing?

## When you make a decision

- **Tier 2** — write the rationale into the affected file (design body, [[conventions]]) and mention it in the PR/commit body.
- **Tier 3** — one-line note in the file or `Daily Notes/`.

## When the rules are wrong

A rule here or in [[design-system]] blocking sensible work is itself a Tier 2 trigger. Surface it; don't quietly bypass.
