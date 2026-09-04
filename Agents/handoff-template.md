# Small task handoff

Optional: use only when a real task needs continuity. Store beside canonical work or in dated notes, not in a new per-role queue. Link existing rulings and cards; do not duplicate them. Omit private chat, credentials, personal paths, and account bindings. Follow [start/resume](./launch.md).

```markdown
# Handoff: <task>

- Objective and acceptance criteria:
- Role ID / outgoing session / intended receiving role:
- Acceptance owner; interface collaborators/reviewers:
- Scope / exclusions / approval basis (source, authority, date):
- Repositories: <repo identity, branch, full commit or source revision for each>
- Visibility per commit: <local committed | remote reachable at named ref | merged into named branch>; checked <date>; unknowns:
- Canonical sources: <task/card, current map, inbox/hold, rulings; exact revisions>
- Completed: <artifacts and evidence, not activity claims>
- Remaining:
- Dirty/uncommitted/untracked work: <exact paths and ownership; none if verified>
- Checks: <commands, revision, result>; not run: <checks and reason>
- Risks, unresolved questions, falsifiers:
- Next action and stop condition:
```

## Synthetic example — not a real task or Git claim

- Objective: preserve a qualified partial read in one Explorer fixture; acceptance owner `data-explorer-pm`, collaborator `sdk-pm`.
- Role/session: outgoing `web-client-dev / explorer-fixture-20260903-a`; incoming `web-client-dev / explorer-fixture-20260903-b`.
- Scope/approval: fictional owner-approved disposable fixture only, no production UI, publication or Core change.
- Sources: fictional planning revision `1111111111111111111111111111111111111111`, `example/fixture-law`; the handoff links its canonical map/ruling rather than reprinting them.
- Work: fictional code revision `2222222222222222222222222222222222222222` on `example/explorer-fixture` is **local committed only**; **remote reachable: not verified**; **merged: no**. A receiver cannot assume it exists locally. Sender must provide an authorized push or secure patch/bundle transfer first.
- Completed: qualified `PARTIAL` result retained in one fixture. Remaining: tampered-byte negative case. Dirty: `tests/example-partial-read.test.ts`, owned by outgoing session, not in that commit; transfer explicitly or leave it with sender.
- Checks: synthetic `npm test -- example-partial-read` passed at the recorded dirty state, **not proof about the commit alone**. Native browser check not run (no browser assigned).
- Risk/next: obtain the exact commit and agreed dirty-file handoff, rerun the fixture, then add the negative case. Stop if the source law changed or expected bytes are unavailable.

After a real push, name the remote ref and verify reachability after fetch; after a real merge, name the target branch and verify containment separately. Do not upgrade either label from a clean worktree or successful local commit.
