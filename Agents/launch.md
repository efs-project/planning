# Start or resume one EFS role

Use this contract in any harness. It adds routing and continuity, not permissions. Repository instructions, [project authority](../Onboarding/authority.md), the actual assignment, and runtime tool limits still apply. Take initiative on authorized reversible work; a request to explain, review, or report status does not authorize edits, publishing, outreach, deployment, or task creation.

## Universal prompt — no shell required

Replace the bracketed values with the actual assignment. The planning checkout can be a supplied file view; no particular local directory name is required.

> Work as [role ID or exact roster name] on [objective and acceptance criteria; or unassigned]. In the supplied planning checkout at [branch and commit/source revision], read AGENTS.md, Agents/README.md, Agents/launch.md, and only the selected role brief. Read the assigned code repository's instructions if applicable. Start from [task/card/handoff reference, or fresh start]. Confirm your role, unique session label, scope, acceptance owner, source revisions and visibility before work. Read only the relevant current maps/inboxes/rulings. Preserve other writers' changes. If no task is assigned, orient read-only and report readiness; do not start a new task. Resume from evidence, not assumed chat memory.

Any optional shell helper only prints routing context; Markdown remains sufficient without it. A printed launch prompt does not launch a worker or grant access.

## Start checklist

1. Resolve exactly one [registry row](./README.md). Unknown or ambiguous names require clarification, not a guessed role. Read its one brief, not the entire roster's briefs. A title change alone does not load a role.
2. Identify objective, authorized action type (review/report/design/change), deliverables, exclusions, and **one acceptance owner** for implementation. Name collaborators/reviewers for affected interfaces. An acceptance owner coordinates acceptance; only the project owner can make reserved rulings.
3. Identify each planning/code repository, branch and exact commit or other source revision. Discover actual paths; do not assume sibling directories are the assigned worktrees. Read local repository instructions. Resolve the current map, inbox/hold, and rulings only for the touched domain.
4. Choose a non-secret human-readable session label, such as `sdk-read-20260903-b`. It identifies this instance, not a harness or a role. Inspect dirty files, the relevant card, recent status/handoff, and related visible branches before writes. Record freshness gaps.
5. Briefly state role/session, scope, sources/visibility, acceptance owner, and next action. If assigned, proceed within scope. If explicitly **unassigned**, do nothing beyond read-only orientation and reporting readiness: no claiming cards, edits, empty handoffs, scheduled loops, or newly created tasks. An explicit request to pick work uses the existing [decision tree](../Onboarding/start-here.md).

## Resolve the source, not just the folder

A source's existence, freshness, and authority are different facts. Current maps may be in an assigned branch rather than `main`. Resolve the task handoff's branch/commit using a supplied checkout, file view, or read-only `git show <commit>:<path>`; check its current-spine/inbox/rulings rather than importing that branch into another worker's work.

Obtain the assigned ref/commit from the owning task/handoff and verify it. Do not use broken Markdown links to absent files, hardcode machine-local worktree names or live branch defaults into role prompts, merge design branches merely to read them, or substitute legacy SDK/July client designs for missing v2 sources. If a needed revision is unavailable, name that specific gap and ask for the source; independent authorized work may continue.

## Multiple writers, including the same harness

`Agent:` carries the stable role ID prospectively, `Harness:` the actual harness, and `Co-authored-by:` the actual known model. None identifies a session. Two Codex instances of `v2-pm` need distinct session labels and scope records just as two different harnesses do. Preserve historical model-shaped trailers unchanged; do not infer their role.

Use existing cards/status/handoffs for session labels and assigned paths. A status line is advisory, **not a cross-machine lock**; its absence proves nothing about other writers. Distinct authorized scopes can proceed in isolated worktrees. Overlapping edits require an agreed split or explicit handoff first; preserve dirty work and stage exact paths. Existing [TTL rules](../Onboarding/conventions.md#kanban-entries) remain; no new timeout seizes another task, and Under Review/Blocked cards cannot be reclaimed without asking.

Sync only an owned safe checkout. Inspect branch and dirty state before fetch/rebase, never rebase another worker's branch, never autostash unrelated changes, and never force-push. An assigned pinned experiment/review revision is not an instruction to rebase onto main. Offline work may continue locally within an authorized independent scope: report last observed commit/date, unavailable remote visibility, and unchecked assumptions. Local cleanliness is not remote reachability.

## Resume and finish

Read the existing task handoff if there is one, then verify refs, completed evidence, remaining scope and dirty-state claims against the receiving checkout. Re-read changed source maps/rulings rather than replaying an entire private chat. If a required commit is missing, obtain a remote-reachable commit or explicit secure transfer; do not pretend a different machine's local commit is available.

For a useful handoff, use the [template](./handoff-template.md) beside canonical task work or in dated notes. Separate **local committed**, **remote reachable**, and **merged**; report commands/results and not-run checks. Append one dated session line to the existing [status log](../Daily%20Notes/agent-status.md) when writes are authorized. Read-only/unassigned starts report status in chat instead of mutating the log. Do not create per-role task ledgers or copy private conversations.

Review disagreement is evidence, not a vote. Reviewers inspect actual artifacts and return bounded findings, falsifiers or reproductions; they do not grant a protocol freeze. Stop at the task's finish line and report the next safe action. Role self-expansion, new authority, new schedules, or material cross-role boundary changes require owner approval.
