# Files-browser MVP — the everyday loop, joined and drivable

**Status:** working local prototype on branch `fable/2026-09-09-files-browser`;
disposable experiment, not a product repo, public deployment, protocol freeze
or parity certification. Start with [walkthrough.md](walkthrough.md) (15
minutes, no Solidity needed); the honest per-row record is
[acceptance.md](acceptance.md); the build plan was [plan.md](plan.md).

## What this closes

The September 9 gap was integration: reads, writes and the browser existed as
separate proofs. This experiment joins them into one path —
**contracts → shared SDK → static SPA** — and makes the sixteen-journey
walkthrough drivable against real local v2 contracts:

- **`contracts/src/FilesRouterV1.sol`** — the routed write path. Per-author
  EIP-712 authority (one-time principal claims), the ASCII name profile
  (unsupported ≠ invalid, never rewritten), plan-wide destination/NOREPLACE
  and source-identity preconditions via on-chain `resolve`, folder-move cycle
  witnesses, remove-vs-rename marker semantics, restore collisions, stale-edit
  CAS — all enforced in the contract, then executed atomically through the
  existing upgradeable Core. Honest limit: the Core admission is still the
  synthetic operator's bearer FixturePlan, so routed operations are
  router-checked but NOT `FILES_PRECONDITION_CERTIFIED` (RoutedAdmissionIntent
  consent binding remains future Core work, per the design).
- **`sdk/files-actions.mjs`** — browser-portable five-seam actions: pure
  deterministic planning (apps never build leaf masks/CAS rows), explicit
  authorization, submission encoding, canonical read-back (only a fresh
  independent re-read may claim `COMMITTED`).
- **Shared-reader extensions** (in `../2026-09-09-files-reader`, compatible):
  subject-keyed child-directory listing, verified file content (bytes
  re-hashed against ChunkTree commitments before display, historical
  revisions included), name timelines, revision chains, Removed items, tags.
- **`web/`** — the browser: breadcrumb navigation, verified previews,
  create/edit/organize flows with counted **simulated** approvals on labeled
  disposable local signers, Lens switching with the Why? drawer, honest
  coverage/conflict/unavailable copy, folder export.
- **`scripts/`** — `run.mjs` (interactive environment; `--upgrade` enables a
  live U1→U2 upgrade), the validated relay (`server.mjs` — raw transactions
  only to router/carrier, latest-reads allowlist, no keys held server-side),
  `verify-export.mjs` (clean offline re-verification of an export bundle).

## Evidence

- `test/router.test.mjs` — all 10 routed operation kinds + 9 adversarial
  contract-level refusals against the live populated fixture; measured gas
  (createFile 8,731,665 vs 8.67M raw baseline ≈ 0.7% router overhead; rename
  5.39M; dir-move+witness 5.42M; edit 4.2M; remove 5.1M; restore 4.3M; all
  under the unchanged 16,777,216 cap; one 7-leaf create per transaction).
- `test/journeys.browser.mjs` — the 12-step everyday loop in real Chromium
  (guest zero-wallet browse → verified content and old revisions → create →
  fresh-context reload → edit → rename (stable identity asserted) → copy vs
  second placement → remove/Removed items/restore-as → attributed tags and
  honest filter → image upload with verified preview → folder export → live
  U1→U2 populated upgrade → post-upgrade write). Zero page errors; a throwing
  `window.ethereum` proves zero wallet discovery.
- `test/ux.browser.mjs` — 320px reachability, keyboard-only create,
  Escape-restores-opener, cancel-is-not-approval, 200% text.
- `test/reader-extensions.test.mjs` — nested/content/history APIs vs the
  managed chain. `test/read-path.perf.mjs` — navigation and content costs,
  shared scope vs fresh scope, 0/50ms injected delay (loopback only).
- Screenshots: `evidence/browser/` (exported by the UX suite).

Prior experiments' files and published evidence are untouched; where this
branch's compatible reader extensions supersede their byte-pins at this
revision, that is stated here instead of rewriting their history.

## UX review

An independent UX/accessibility review (22 findings) ran against the app
source. Applied: draft preservation on failed note create/edit (the stale-edit
message is now true), Move consent shows the actual destination folder and a
blank path means "this folder", a visible submitting state with double-submit
protection and signer snapshots, "verified bytes" claims only after an
integrity read-back plus a "Stage bytes now" retry for unstaged files,
two-step approvals labeled "1 of 2", upload renames proposed instead of
silently applied, error messages in a separate `role="alert"` region with
focus landing on the outcome, readable author-label contrast, keyboard-focusable
upload control, accessible names on row/restore/tag-chip actions, honest
"currently unreadable" Trash state, honest tag-filter failure (shows nothing
rather than guessing), plain-language copy (snapshots, Records written,
"Removed here (hidden, not erased)"), phone-width row stacking and dialog
grids. Deferred as known polish: a folder picker for Move (today: typed path
with validation), collapsing row actions behind a menu at phone widths,
border-contrast tuning on secondary buttons.

## Honest limits

Deep-churn folders still exhaust the read budget (the retained 64/60 control;
unchanged). Bytes are single-chunk ≤16 KiB. Properties/typed tables, mirrors,
collections, redirects, sorting and negative filters remain v1-parity gaps.
Real-wallet prompts are untested — writes use counted simulated approvals on
disposable local keys; the exact manual wallet test is in the handoff. All
measurements are loopback with optional injected delay, not WAN.
