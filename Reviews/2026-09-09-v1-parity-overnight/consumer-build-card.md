# Next visible result: one useful Files screen

**Status:** bounded consumer work card; not implemented or a new SDK/profile ABI.
The [upgrade-aware read prerequisite](../2026-09-08-upgradeable-foundation/upgrade-read-verification.md)
now passes. Reuse the [existing consumer specification](../2026-09-08-upgradeable-foundation/consumer-checkpoint.md)
and [directory dataflow](directory-read-next.md), not a second file-tree model.

## What James should be able to see

Open a static SPA without a wallet. One real folder contains a note, another
placement of that note, and a deliberate disagreement between two authors.
Switch **A first**, **B first**, and **Both agree**. The displayed result must
change for the explained reason, at one pinned observation. A small
**Why this result?** drawer works on phones and exposes the retained evidence.
The synthetic operator is clearly labeled; named Principals do not imply
those humans signed.

The first read slice needs no desktop shell, plugin host, universal property
editor, drag-and-drop framework or production wallet integration. It does need
the same shared reader path that the later SDK/SPA will use and a deployed
Solidity consumer returning equivalent selected results. Do not grow a second
authoritative browser tree or present raw Scope anchors as current entries.

The Data Explorer PM reviewed this boundary read-only at `53e4753` on
September 9 (task `01a02a24-0348-7c50-81fd-2a4ac43c62af`). Its advice narrows
the **first** screen to guest reading and explanation; executable writes are
the subsequent join below. A scenario stepper may select retained, explicitly
pinned observations from actual fixture admissions. Missing/corrupt-evidence
variants must say what was withheld/substituted; they are failure injections,
not a new canonical history. No browser state change may impersonate a
contract mutation or a freshly verified current observation.

Show remove/retract as two clearly non-executable comparison cards until the
operation boundary exists. Their effects are predicted, not recorded. A local
draft-preservation demonstration likewise does not count as a successful save
or a real-wallet test. Clear stale preview/action selection when the Lens
changes; do not wait for the new asynchronous reads to finish.

## Three joins, each earning a concrete result

1. **Files interpretation:** a bounded selected Entry/Whiteout and node-charter
   check over actual read-profile state. Mount/Plan scope and exact parent,
   name-role, target kind/leaf and Type are checked. A malformed winner does
   not become a valid losing file. Missing historical charter proof stays
   unresolved; it is not current-maintenance failure or global absence.
2. **Shared reader + screen:** aggregate Scope pages, union exact positions,
   resolve and validate selected rows, with scoped evidence reuse and bounded
   concurrent hydration. Display proven rows early without marking unfinished
   rows or enumeration complete. Keep conflict/unresolved rows inspectable.
3. **Intent actions:** connect create/edit/rename/move/remove/restore only after
   the Files operation boundary enforces its profile and preconditions onchain.
   A disabled, explained action is preferable to a button that claims the raw
   Core publication has certified Files semantics. Read-only progress does
   not complete this third join.

These joins reuse the chosen contracts and Reader/Actions separation. They
are not permission to replace the SDK PM's API or make a new production repo.
The full [v1 inventory](../2026-09-09-files-parity-performance/parity.md) stays
open beyond this small visible loop.

The full-snapshot independent oracle is a test comparator, not the guest SDK's
hot path. The measured screen must use bounded contract reads and retain their
exact evidence; serving an already-downloaded snapshot is a separately labeled
offline arm. Do not quietly swap the two to claim a network-latency win.

## Observable pass/fail checks

| Journey | Pass | Must not happen |
|---|---|---|
| Open folder as guest | Usable rows, pinned view, zero wallet/submitter calls | Wallet connection needed just to browse |
| Load a partial or churned folder | Known rows remain, progress and continuation visible | Empty screen claims an empty folder before complete coverage |
| Switch the three views | Selected file or explicit conflict/absent agreement matches contract and independent reader | Silent author truncation or a losing author's preview on a conflict |
| One selected claim is malformed | That position is unresolved and explained; unrelated valid rows remain | Fallthrough, disappearance or whole-table failure |
| Rename or move a file | Stable File ID; destination placed and source masked atomically | Partial destination on failed source CAS; old name reappears from a lower author |
| Edit loses a race or crosses upgrade | Draft intact, old consent not resubmitted, refresh/review offered | Automatic retry with changed intent or lost draft |
| Remove versus retract | Remove masks the placement; retract can reveal another author | Claim that bytes were erased; rename masks listed as Removed items |
| Undo remove | Fresh collision-checked placement and marker retirement | Overwriting a new occupant or deleting history |
| Browse on phone/keyboard | Explanation reachable, stable row focus, deliberate Load-more focus handoff | Hidden evidence or focus jumping to a different file |

The first screen has earned its purpose when James can predict the partial,
conflict, malformed-selection, stale/upgrade and remove/retract outcomes
without opening raw JSON. Those comprehension checks supplement executable
contract/reader assertions; they do not replace them.

Negative tag filters, globally sorted complete results, transport fallback,
collections and redirects need their own evidence. A locally sorted partial
list or old active tag occurrence does not prove those features.

## Measure the whole read, not just its last call

Use the unchanged eight-row [browser control](browser-latency.md) at 0 and
50 ms injected request delay, then measure the new join under the same arms.
Count first useful rows, fully settled initial page, continuation, requests,
response bytes, maximum concurrency, onchain call gas and any wallet activity.
Keep setup, projection, source verification and final sealing costs separate.
Use the same exact dataset and interpretation checks for a claimed comparison.

Start with small pages and an ordered pool of four as an experimental arm,
not a production constant. Success requires less repeated work with identical
qualified results, preserved cancellation and same-basis final sealing—not
merely a shorter timer. Contract 64-author point costs cannot be multiplied
into an unmeasured promise for a complete 64-author directory.

### Independent full-reconstruction control

An offline replay on September 9 reverified the unchanged
[optimized lifecycle report](../2026-09-09-files-parity-performance/optimized.json).
Its retained terminal snapshot has 95 admissions; the saved collection accounts
for 1,337 RPC requests and 482,238 JSON-result bytes. The whole report file is
1,958,750 bytes because it also retains other evidence.

Seven consecutive local `verifyUpgradeState(terminalSnapshot, expected)` calls
all returned VERIFIED: first 53.57 ms, then 37.00, 36.16, 35.56, 35.19, 36.36
and 35.06 ms. JSON parsing happened before timing. These are diagnostic CPU
samples on the shared machine, not browser, WAN, chain-finality or percentile
measurements. They suggest separating evidence acquisition from local checking;
they do not justify weakening either. Do not invoke a full retained-inventory
reconstruction as the normal folder-open algorithm.

Replay environment: Node 26.0.0; source baseline `53e4753`. Report keccak:
`f0bb38f17713e8d83ff51868de2862e1da404712a838fae0c8e116131f6edd4c`.
The upgrade and underlying state verifiers were unchanged. To repeat, load the
JSON once, call `verifyUpgradeState(report.terminalSnapshot, report.expected)`
seven times with `performance.now()` around each call, assert VERIFIED every
time, and report every sample. Do not count deserialization or saved report
size as onchain or RPC execution cost.
