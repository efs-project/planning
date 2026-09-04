# EFS agents

A small directory of reusable roles. No scripts or required ceremony.

## Start

> Read `planning/Agents/README.md` and your role's profile. Work on [task]. Check your notes if resuming; keep useful profile knowledge and handoffs up to date.

Read **one profile**, not the whole folder. Repository `AGENTS.md` and your assignment still apply; a role doesn't authorize unrelated work.

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
| Media Library PM | [media-library-pm](./media-library-pm/SOUL.md) |
| Booru PM | [booru-pm](./booru-pm/SOUL.md) |
| Contracts Dev | [contracts-dev](./contracts-dev/SOUL.md) |
| Web Client Dev | [web-client-dev](./web-client-dev/SOUL.md) |
| SDK Dev | [sdk-dev](./sdk-dev/SOUL.md) |
| Integration & Test Lead | [integration-test-lead](./integration-test-lead/SOUL.md) |
| Security Reviewer | [security-reviewer](./security-reviewer/SOUL.md) |

Media Library and Booru are separate; clarify an ambiguous combined title.

## Profiles and notes

- **`SOUL.md`**: purpose, responsibilities, useful sources and working preferences. Improve your profile as needed; ownership/authority changes still need James.
- **`NOTES.md` beside it**: optional IDs, current handoff and a few dated messages. Create/read it only when useful. Link longer work and canonical decisions; don't duplicate a backlog. Verify last-known refs before resuming.

## Notes and harness IDs

Copy into `NOTES.md` when needed; omit unused fields:

```markdown
# <Role> notes
## Sessions
- <date> · <Codex / Claude Code / Antigravity> · <conversation/session/agent ID>
  Context: <EFS task; shareable workspace label if needed>
  Last seen: <repo, branch, commit; local-only or pushed>. Replaces: <older ID, if relevant>.
## Handoff
- <What changed; source/test links; unfinished work; next useful action>
## Messages
- <date> · <sender harness/ID> → <recipient harness/ID or role>: <brief note>
  Acknowledged: <recipient/date, only when actually observed>
```

IDs locate sessions; they don't prove identity, grant access or authorize contact. Record only verified EFS details you may share: tracked notes can be public. No tokens, private share links, personal data or transcripts. Private bindings may use ignored `Agents/local/` (local-only, not a secret store).

Notes don't notify another harness. Use available messaging tools within scope after confirming the recipient, or leave a note for its next session. Mark sent/read/acknowledged only when observed. Sync shared notes when authorized; preserve others' messages. Silence isn't evidence of refusal or absence.
