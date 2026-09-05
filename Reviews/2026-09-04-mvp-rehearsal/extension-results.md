# Workflow extension: useful Files, data tables and exact challenges

**Status:** implemented, locally verified and independently reviewed on 2026-09-04;
disposable `efs-lab/1` evidence, not full C0 or public-product readiness.
**Input checkpoint:** `5a0ee4d`. James requested fleshing out the existing prototype.
**Plan:** [extension-plan.md](extension-plan.md), using the earlier
[consumer PM handoff](pm-handoff.md). No contract or SDK wire changes.

## What you can try

| Area | Working extension | Important bound |
|---|---|---|
| Files | Open a directory or exact file/revision link; continue an eight-entry page; inspect old revisions; upload/download binary or text | 16 KiB payload, lab ASCII names up to 64 bytes, one lab tree; no rename/move/delete |
| Data | Select one exact schema; inspect, sort, filter and copy loaded rows; continue a four-record page | Read-only finite inventory, not a query service or plugin platform |
| Arcade | Choose Challenge A or B; inspect the exact game and seed; explicitly Play; Stop and reopen the same challenge | Ordinary bytes32 Record, single-artifact release, scripts-only frame; no host bridge or trusted score |

The default root includes `Page-examples` with eleven files. The game has two
retained revisions: legacy revision 1 and challenge-aware revision 2. Typed
numeric rows include `42`, `9007199254740993`, and `18446744073709551615`, kept
as exact decimal values through sorting, display, keyboard selection and copy.

Links are hash routes within this ephemeral deployment:
`#files/dir/<directoryId>`, `#files/file/<fileId>?revision=1`, and
`#arcade?challenge=<recordId>`. A new demo run has a new chain/run identity.
These are not durable EFS links or a portable deployment discovery scheme.

## Implementation shape

The active browser entry is `web/bootstrap.mjs` -> `web/workflow-app.mjs`.
It creates three bounded native-module controllers: `files-view.mjs`,
`data-view.mjs`, and `arcade-view.mjs`. Each owns its view and cancels stale
asynchronous completions; the shell owns navigation and the evidence panel.
The original `web/app.mjs` is retained first-checkpoint reference and is not
loaded by the active entry. It must not be mistaken for another runtime.

No new service, framework, product repository, dependency or Core noun was
needed. The existing injected SDK still mediates reads, validation, planning,
approval, submission and independently authority-checked read-back. Data also
recomputes the Record ID from verified payload bytes; successful schema parsing
alone cannot lend those bytes a different requested identity.

Arcade pins the exact game File/revision/content, expected challenge schema,
single-artifact closure, runner profile and empty capability ceiling. Game and
challenge evidence must agree on chain, block hash, block number and timestamp.
The validated seed enters the isolated Blob document as a strictly parsed
fragment, not executable host code or a capability bridge. The same seed and
release generate the same 128-obstacle sequence in a fresh browser context.
The displayed FNV32 sequence hash is a diagnostic, **not** cryptographic proof,
fair-play verification or an authenticated score. Input/timing still affect play.

## Final verification

| Check | Result | What it establishes |
|---|---|---|
| Solidity suite | 24/24, including 128 fuzz cases | Existing lab state/authorization/carrier and onchain reader controls remain intact |
| Node suite | 95/95 | SDK integration, identity/qualification faults, controller models, continuation/lifecycle laws and gateway controls |
| Strict TypeScript | PASS | Existing SDK consumer remains type-checkable |
| Original joined Chromium journeys | 8/8 | Guest, relayed/direct/session writes, cold read-back, Data and isolated game still work |
| Extended joined Chromium journeys | 19/19 | Exact history/download, binary upload, pinned continuation, precision/copy/mobile, corruption, fresh-context challenges, interrupted Play and actual-SDK cancellation |
| Focused Files Chromium regressions | 9/9 | Mocked-provider DOM boundary: unavailable/corrupt download denial, invalid input, stale reads and Cancel/Close/Escape/session cancellation |

Joined browser checks use actual loopback Solidity contracts and the SDK, with
explicit RPC fault injection for negative cases. Focused Files browser checks
use a mock SDK; they are not another nine EVM journeys. Both use Chromium
148.0.7778.96 in the retained root run. Reports:
[original browser](artifacts/browser-results.json),
[extensions](artifacts/browser-extension-results.json),
[source/output manifest](artifacts/source-manifest.json).
The existing nine local cost/read measurements were rerun; the contract byte
sizes and high full-payload storage cost remain the same design concern.

## Review findings and closure

Independent read-only review found and reproduced two Important bugs:

1. A provider could substitute a genuine schema/payload under another requested
   Record ID, and Data would display it as validated. The fix recomputes the
   Record ID before decoding/display, retains `RECORD_ID_MISMATCH` evidence,
   and has both model and actual-SDK/RPC regression plus genuine positive control.
2. Closing a write dialog during a delayed nonce read did not cancel pending
   preparation. In the session path this could submit without another prompt.
   A separate write-generation fence now covers Cancel, Close and Escape and
   checks pre-submit awaits. Browser regressions reproduce the former bug and
   prove both newly configured and already active sessions cannot submit it.

Minor fixes: the keyboard skip link now focuses the workspace without breaking
its route; Arcade rejects contradictory chain/timestamp evidence; initial
provider failure stays UNKNOWN; large table numbers do not wrap into misleading
digit fragments. Complete inventory remains separate from valid individual rows.

Cancellation cannot undo an already approved session grant or an already
submitted operation. The latter still gets independent read-back; neither path
claims rollback. Normal `close('approved')` does not invalidate a legitimate
pending wallet preparation. The independent reviewer rechecked this ordering,
reran focused tests and found no remaining Critical/Important lab blocker.

## What this changes for MVP planning

The PM-requested first table, exact challenge, and small upload/download flows
are now concrete, testable integration examples rather than untouched backlog.
Keep their separation and user-facing evidence handling. Do not port the lab
identifiers, single-owner tree or full-payload receipt storage as permanent EFS.

Next highest-leverage work remains the first real C0 admission, then generic
Principal/Binding/Lens/index state wired through these same SDK-facing views.
Chunked large files, rename/move/delete and placement semantics, extensible
Explorer views, real-wallet compatibility, a named affordable execution profile
and durable deployment discovery remain outside this increment. All nine full
C0 M0 rows are still NOT_RUN. No protocol freeze, main merge, public deployment
or real-account interaction is authorized or implied by these results.
