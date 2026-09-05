# EFS agents

A small directory of reusable roles. No scripts or required ceremony.

## Start

> Read `planning/Agents/README.md` and your role's profile. Work on [task]. Read optional notes when useful for resuming.

Read **one profile**, not the whole folder. Repository `AGENTS.md` and your assignment still apply; a role doesn't authorize unrelated work.

Profiles describe a focus, not an exhaustive fence. Notice adjacent problems, investigate what matters to your assignment, and coordinate with affected roles rather than dismissing it as “not mine” or silently taking over. Current instructions and owner rulings govern; profile prose grants no release, deployment or protocol-decision authority.

## Profiles

Folder names are stable role IDs, independent of harness or model.

| Role / familiar name | Profile |
|---|---|
| Project Manager / General PM | [pm](./pm/SOUL.md) |
| v2 PM | [v2-pm](./v2-pm/SOUL.md) · [notes](./v2-pm/NOTES.md) |
| Web Client / OS PM | [web-client-os-pm](./web-client-os-pm/SOUL.md) |
| SDK PM | [sdk-pm](./sdk-pm/SOUL.md) |
| Git / Forge PM | [git-forge-pm](./git-forge-pm/SOUL.md) |
| Arcade PM | [arcade-pm](./arcade-pm/SOUL.md) |
| OS Drivers / Drive / Native Filesystem PM | [native-filesystem-pm](./native-filesystem-pm/SOUL.md) |
| Open Web App Store PM | [app-store-pm](./app-store-pm/SOUL.md) |
| Data Explorer / Files PM | [data-explorer-pm](./data-explorer-pm/SOUL.md) |
| Media Library PM | [media-library-pm](./media-library-pm/SOUL.md) · [notes](./media-library-pm/NOTES.md) |
| Booru PM | [booru-pm](./booru-pm/SOUL.md) · [notes](./booru-pm/NOTES.md) |
| Contracts Dev | [contracts-dev](./contracts-dev/SOUL.md) |
| Web Client Dev | [web-client-dev](./web-client-dev/SOUL.md) |
| SDK Dev | [sdk-dev](./sdk-dev/SOUL.md) |
| Integration & Test Lead | [integration-test-lead](./integration-test-lead/SOUL.md) |
| Security Reviewer | [security-reviewer](./security-reviewer/SOUL.md) |

Media Library and Booru are separate; clarify an ambiguous combined title.

## Profiles and notes

- **`SOUL.md`**: enduring mission, judgment, collaboration and a few starting links—not a specification or file-ownership list.
- **`NOTES.md` beside it**: optional IDs, current handoff and a few dated messages. Create/read it only when useful. Link longer work and canonical decisions; don't duplicate a backlog. Verify last-known refs before resuming.

When ordinary work reveals misleading guidance or a moved source, correct the smallest passage during an authorized write session; otherwise suggest the correction in chat. Replace or delete stale detail rather than accumulating it. Keep tools, versions, current restrictions and task status in their existing source docs or notes. Reconfirm the assigned source revision; don't substitute legacy docs for a missing current map. Changes to ownership or authority still need the project owner. No routine whole-roster audit is required.

## Notes and harness IDs

Copy into `NOTES.md` when needed; omit unused fields:

```markdown
# <Role> notes
## Sessions
- <date> · <Codex / Claude Code / Antigravity> · <conversation/session/agent ID>
  Context: <EFS task; shareable workspace label if needed>
  Last seen: <repo, branch, commit; local-only or pushed>.
  Related session: <forked from / related to / replaces ID; scope difference, if useful>.
## Handoff
- <What changed; source/test links; unfinished work; next useful action>
## Messages
- <date> · <sender harness/ID> → <recipient harness/ID or role>: <brief note>
  Acknowledged: <recipient/date, only when actually observed>
```

IDs locate sessions; they don't prove identity, grant access or authorize contact. Record only verified EFS details you may share: tracked notes can be public. No tokens, private share links, personal data or transcripts. Private bindings may use ignored `Agents/local/` (local-only, not a secret store).

After a fork, verify the current session ID and role; inherited notes may describe the parent. A fork need not replace it.

Notes don't notify another harness. Use available messaging tools within scope after confirming the recipient, or leave a note for its next session. Mark sent/read/acknowledged only when observed. Sync shared notes when authorized; preserve others' messages. Silence isn't evidence of refusal or absence.
