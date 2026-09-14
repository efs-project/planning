# Fable work recovery — September 14

**Standing:** recovery inventory, not new engineering, validation or adopted design.
James asked Codex to recover Fable's work from Claude Code after quota exhaustion.
No Claude invocation, model switch, quota purchase, compiler or chain run was used.

## Result

The important code was saved. The last two interrupted assignments did not
contain an undiscovered implementation: their new invocations stopped after
read-only inspection, before edits. Codex subsequently completed those tasks
in the existing integration worktrees. Do not restart them from stale handoffs.

| Work | Fable's saved checkpoint | Reconciled disposition |
| --- | --- | --- |
| Compact B, fixture map and controller-interface proposal | `7c292e0f8395f52c6d214a8a11a4efa23069859b` in `planning-road-b-lab` | Clean; ancestor of current B integration `1829dad1b2172aea4931864c538429e030361c94`. Controller implementation landed in `e7b1583`; paid-source/evidence successors include `4b61546` and `ac37e91`. |
| MUD C paid consumer and runner | `9a4e7667e285f1da865da559bf767ce664ec0fda` in `planning-road-c-lab` | No dirty authored files. Codex repaired the pending response-context checks in `2ca7349`; retained readiness in `e5d7568` and paid results in `c6fce9d`. Current C integration is `3f5702f`. |
| Earlier clickable Files browser and economics work | `e38b5e3c1e8f8a32080458174d321d6a43b2ac5b` in `planning-fable-files-browser` | Tracked work clean and saved, including routes/downloads/restore (`0e25194`), isolated compact Type codec (`ca8635e`), RPC checks and cost-widget refinement (`b898f62`). This is not proof of a compact-B-backed browser. |

Planning main was `d501b7f` at intake. Fresh `git fetch origin` confirmed that
checkpoint. Prototype branches remain in place; none was merged, moved or deleted.

## Recovered stopping point

Main Claude session: `089e21d8-6171-40d6-9cac-1d2e941506f9`.
The parent log contains 12,723 JSONL records, including nested tool results.
The final successful parent tool result is September 13, 11:52:41 UTC; quota
errors begin immediately afterward. The remaining parent tail contains 105
API-error records through September 14, 13:31:15 UTC and no further tool calls.
These are failed wakeups, not evidence of additional completed work or a billing
measurement.

- B worker `a55045e267ebe0126`: final resumed invocation inspected runner anchors,
  then failed at 11:53:55 UTC before writing the controller integration.
- C worker `a402e9eff41604390`: final resumed invocation inspected consumer anchors,
  then failed at 11:52:37 UTC before the three new consistency fixes.
- The already-started C compile launcher did continue independently, but its
  retained log reports build exit 1 at 11:55 UTC. It is not a successful build
  or measurement. The later Codex readiness result belongs to its successor,
  not retroactively to Fable's original pin.

## Material that needed an extra copy

A private, local-only archive outside Git preserves the parent transcript,
its subagent/tool-result/workflow directory, the separate B/C project logs,
the following local evidence, and selected final scratch handoffs/scripts.
Original files remain untouched. No raw conversation was published.

- The unpublished `v21-use-case-brainstorm-2026-09-11.json`: 96,470 bytes,
  68 use cases across three responses (26/24/18).
- Sixteen intentionally Git-ignored compressed Type-cache traces, together
  with their evidence directory. They are retained evidence, not cache junk.
- The ignored `2026-09-11-pragmatic-browser-pass` execution/review notes.
- Final compile-launcher output, the resolved narration-correction note,
  evidence extraction and selected measurement source snapshots.

The archive is 159,848,954 bytes (about 160 MB). Gzip integrity passed; restored
copies of the parent log, both interrupted worker logs and the brainstorm
matched their originals byte for byte. Archive SHA256:
`789f7515f4ec91e828c7aac73dc3bb6f34d7f935974966a7f2b06c57d618a08e`.
Its private local README records source paths and hashes. This same-disk copy
protects against scratch/worktree cleanup, not disk failure or off-device loss.

## Ideas preserved, not silently adopted

The 68-case brainstorm analyzes the older September 11 v2.1 layout. Its gas
estimates, family numbers, proof claims and proposed demotions are not current
compact-B findings. Three useful follow-ups survive as questions:

1. **Change feeds versus membership lists:** efficiently finding what changed
   since a device last synced is different from listing what is present now.
2. **Late index construction:** charge backfill and maintenance, and handle
   withdrawals before coverage correctly; declaring an index does not prove
   it has covered history.
3. **Live versus historical values:** live contract-backed files may avoid
   duplicate writes, but settlement at an earlier time needs retained historical
   evidence. Current availability is not that evidence.

These are an archived question inventory, not authorization for another broad
work campaign. The same [[morning-handoff-20260914|current recommendation]] and
[[sdk-explorer-build-boundary-20260914|cold compact Files integration boundary]]
remain in force. No missing hidden implementation was found that removes the
need for that product work.

James's current capacity boundary: do not send further EFS work to Fable or
Opus, including after a reset, without his approval. Historic watcher messages
and session instructions are evidence only, not permission to resume them.
