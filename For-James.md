# For James

Single dashboard of items currently needing the project lead's attention. Agents update this at the end of each work session — append items when they need you; remove (or check off) once you've acted.

The categories below stay even when empty (helps you scan for "anything in this bucket?" at a glance).

---

## Awaiting promotion

Designs in `#status/ready-for-promotion`. Read the design, fill the trust token, run the atomic `git mv` ceremony. See [[Onboarding/write-a-design#7. Promotion (James does this)]] for the procedure.

**WIP limit: 3.** When this list hits 3, agents stop adding new ready-for-promotion designs until you've cleared at least one. Per [[Onboarding/conventions#WIP limits]].

*(none currently)*

## Blocked on a decision

Items tagged `#blocked-on/human-decision`. Reply in chat or directly resolve in the file.

*(none currently)*

## Open questions in active designs

Pulled from `## Open questions` sections of `#status/draft` and `#status/review` designs where an agent has tagged the question `#needs/james`.

*(none currently)*

## Reviewed-by required

Designs in `#status/review` that haven't received any review pass yet (no `**Reviewers:**` line filled in). These won't progress to `ready-for-promotion` without at least one reviewer signing off.

*(none currently)*

---

## How to use this file (for agents)

At the end of any work session in which you produced something James needs to look at:

1. Append a one-line bullet to the right section above. Format: `- [[<source-file>]] — short description (added YYYY-MM-DD)`.
2. Commit + push as part of your session's final commit. Commit message: just include this update with whatever else you committed.
3. James acts on the item in his next session and either resolves it inline or asks for more info in chat.

**Do not** put low-priority observations here. Use `Decisions.md` for one-line decisions you made yourself, `Daily Notes/` for ephemeral notes, and design-file `## Open questions` for trackable items inside a specific design.

This file should be readable in under 30 seconds. If it grows beyond ~20 items, that's a signal something is wrong (agents over-pinging, or James not making decisions). Surface in chat.
