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

- **`contracts/src/AuthorityUpgrade.sol` + `contracts/src/FilesRouterV2.sol`**
  — real per-account authorization IN THE CORE. The populated Core/carrier
  pair upgrades in place to revision 3: `claimPrincipal` binds each author
  principal to an account once; every write is an EIP-712 `AuthorIntent`
  (publication + operation commitment + byte commitment + executor binding +
  sequential nonce + deadline) verified by `executeAuthorized` **on-chain**.
  The router is bound INTO the signature (`executor` + codehash): a bearer of
  the signed intent cannot strip the router's Files preconditions
  (`ErrExecutorBinding`), replay it (`ErrIntentNonce`), retarget it
  (`ErrOpCommitment`) or carry it across upgrades (execution-set-id in the
  digest). The operator key remains admin-era genesis authority (same trust
  class as the upgrade controller) and is **never served to the browser**.
  The carrier gains permissionless write-once content-addressed chunk staging
  (`stageChunk`, C0ChunkTree-law-validated, ≤1 MiB / 256 chunks).
  `FilesRouterV1.sol` is retained unchanged for history; the V1 gauntlet
  still passes against it.
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
  disposable local signers — **one approval per operation, content writes
  included** (chunk staging is permissionless and needs no second dialog),
  resumable staging for interrupted uploads, Lens switching with the Why?
  drawer, honest coverage/conflict/unavailable copy, folder export gated on
  COMPLETE coverage. Boots against the relay (`/config`) or as a **static
  export** (`./config.json` + direct JSON-RPC to an explicitly configured
  endpoint).
- **`scripts/`** — `run.mjs` (interactive environment; `--upgrade` enables a
  live in-place upgrade of the populated pair), the validated relay
  (`server.mjs` — raw transactions only to router/carrier, latest-reads
  allowlist, request batching, no keys held server-side),
  `export-static.mjs` + `static-server.mjs` (standalone static hosting: the
  same page served by a generic file server, talking JSON-RPC directly),
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
  honest filter → a 22.5 KiB six-chunk note verified in-browser → image
  upload with verified preview → folder export → live in-place upgrade of the
  populated authority pair → post-upgrade one-approval write). Zero page
  errors; a throwing `window.ethereum` proves zero wallet discovery.
- `test/authority.test.mjs` — the authority gauntlet against the live
  upgraded pair: routed create verified through the reader, impersonation
  (mined rejection), replay (`ErrIntentNonce` from the Core, proven on an op
  with no destination precondition), direct-Core bypass (`ErrExecutorBinding`,
  mined), executor forgery, op-commitment tampering, expired deadline, a
  10 KiB three-chunk file with out-of-order interruption + resume under ONE
  signature, chunk-law attacks (wrong leaf, wrong shape, bad index), and a
  stale-era intent refused after a further upgrade. Gas: createDir 5.13M,
  8-leaf 10 KiB createFile 8.62M.
- `test/static-hosting.browser.mjs` — the exported browser on a generic
  static file server with direct RPC: read + one-approval write journeys,
  every network request asserted to touch only the two configured origins.
- `test/completeness-regressions.test.mjs` + `test/completeness.browser.mjs`
  — the completeness-composition failure class as executable regressions at
  the reader and browser boundary (no COMPLETE or ABSENT from exhausted
  budgets, lens/basis isolation, unreadable ≠ empty, partial listings not
  exportable as copies).
- `test/churn.perf.mjs` → `evidence/churn-perf.json` — churn-heavy and
  larger folders built through the ROUTED write path: the retained 64/60
  shape 413 requests / 2.45 s at 50 ms (baseline: refusal at page 4, 7.7 s at
  page 8); 512-lifetime/48-live 2,987 requests COMPLETE / 12.6 s at 50 ms;
  300-live 3,409 requests COMPLETE / 13.3 s at 50 ms.
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
integrity read-back plus a "Stage missing bytes now" resume for interrupted
staging (the two-step "1 of 2" approvals this review labeled were later
REPLACED by the single-approval intent model), upload renames proposed instead of
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

Folders beyond 512 lifetime names are unmeasured, and per-position enumeration
cost is protocol-shaped (the first-mutation inventory visits retracted
positions; a cheap current-folder listing needs contract-side aggregation —
a design question, not a reader bug). Bytes cap at 1 MiB (256 × 4 KiB chunks);
alternate-provider byte recovery is not built. Properties/typed tables,
mirrors, collections, redirects, sorting and negative filters remain v1-parity
gaps. Real-wallet prompts are untested — writes use counted simulated
approvals on disposable local keys (simulated dialogs are NOT real-wallet
evidence); the exact manual wallet test is in the handoff. Permissionless
chunk staging means anyone may pay to stage committed bytes — spam costs the
spammer gas and can only ever fill in exactly the committed content; pricing
/ incentives for who stages remain an open venue-economics question. All
measurements are loopback with optional injected delay, not WAN.
