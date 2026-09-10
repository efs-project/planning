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
  still passes against it. **`byteCommitment` is now enforced**, not merely
  signed: the router derives it from the publication's own ChunkTree leaf for
  createFile/edit (and checks the revision references that leaf), and requires
  it to be zero for every other operation kind.
- **`scripts/verify-export.mjs` + `sdk/export-bundle.mjs`** — authenticated
  export (`EFS_FILES_EXPORT_V1`). The bundle carries the record graph, the
  selection, content keyed by its ChunkTree id, the block header, the path
  chain from the mount root, and the full pinned RPC transcript. The offline
  verifier re-derives every commitment and labels each claim by what actually
  establishes it: **SELF-CONSISTENT** (recomputed from the bundle's own bytes
  — a fabricated-but-coherent bundle also reaches this tier),
  **TRANSCRIPT-ATTESTED** (currency and existence, supported by the pinned
  transcript, which is evidence rather than proof), **ANCHOR-DECLARED** (the
  chain/block/Core/mount tuple the bundle cannot prove about itself) and
  **NOT-PROVABLE-OFFLINE** (authorship provenance). `--recheck-manifest`
  emits the consumed reads so any RPC endpoint you trust can replay them —
  that replay, not the verifier, is what upgrades transcript claims.
- **`web/wallet.mjs`** — the real-wallet path (EIP-1193). Sponsored mode:
  **one** `eth_signTypedData_v4` request per operation, with an explicit,
  replaceable sponsor submitting and paying; the sponsor cannot alter what was
  signed and never builds a `claimPrincipal`. Direct mode is clearly labeled
  and prompts once per transaction, honestly counted. Author, signer,
  submitter and payer are separate roles.
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
  shape 414 requests / 2.43 s at 50 ms (baseline: refusal at page 4, 7.7 s at
  page 8); 512-lifetime/48-live 2,988 requests COMPLETE / 12.3 s at 50 ms;
  300-live 3,410 requests COMPLETE / 13.3 s at 50 ms. (Each count is one
  request higher than the previous checkpoint: the priority lenses now
  enumerate a third source principal — the one reserved for a wallet — which
  costs exactly one page read per listing even though it holds no claims.)
- `test/export-roundtrip.test.mjs` — a live world (multichunk **and** empty
  file) exported through the same assembly the browser uses, verified offline
  by the CLI in a separate process, then attacked: 15 hostile mutations
  (tampered bytes, substituted record bodies, missing dependency, fabricated
  basis, dummy evidence, orphan/missing content, forged header field,
  contradictory transcript, renamed/retargeted selection, foreign-Core
  transcript, hidden removal marker, case-duplicate key, odd-length bytes)
  each refused. `test/export-verifier.test.mjs` pins the original defect: the
  fabricated bundle from the 2026-09-10 review is refused, and V0 bundles are
  rejected as unverifiable rather than silently re-certified.
- `test/wallet.browser.mjs` — the wallet flow through an executable EIP-1193
  harness whose key lives outside the page: sponsored mode proves exactly one
  typed-data request per change with the wallet account's balance unchanged
  and the sponsor's reduced; direct mode proves one prompt per transaction.
  Cancellation, expiry and the served config (no sponsor key) are asserted.
  This proves provider request counts and payloads — **not** real wallet UI.
- `test/ux.browser.mjs` — 320px reachability, keyboard-only create,
  Escape-restores-opener, cancel-is-not-approval, 200% text.
- `test/reader-extensions.test.mjs` — nested/content/history APIs vs the
  managed chain. `test/read-path.perf.mjs` — navigation and content costs,
  shared scope vs fresh scope, 0/50ms injected delay (loopback only).
- Screenshots: `evidence/browser/` (exported by the UX suite).

## Economics and index research (2026-09-10)

- [gas-engineering-2026-09-10.md](gas-engineering-2026-09-10.md) — measured
  cost anatomy of a v2 write (2,838,264 gas / 94 slots for a tag), peer
  comparison, the 1.26× ablation of the unqueryable posting families, ranked
  proposals, Merkle findings.
- [indexing-and-state-2026-09-10.md](indexing-and-state-2026-09-10.md) —
  the ten posting families in plain terms, the directory-local ordinal that
  already exists (kind-10 scope list), a costed bitmap index for the owner's
  four queries on today's and Glamsterdam's gas schedules, the state-tier
  rule, the MUD verdict (fork `store`, refuse the World), dedup and
  bytecode-as-storage, and the decisions/clarifications the owner is asked
  for. Verbatim research strands in
  [research-2026-09-10/](research-2026-09-10/).
- [tag-system-2026-09-10.md](tag-system-2026-09-10.md) — the tag deep dive:
  a tag is a concept record with commons and namespaced profiles, every
  string is a binding, hierarchy-as-inference is a typed edge and grouping
  is never inference, `TagSet` assertions with DENY, bitmap families over the
  scope ordinal with mandatory ordinal verification, read-time expansion by
  default; costs on both schedules; booru evidence (Danbooru/e621 rewrite
  posts, Hydrus is our shape); the five decisions that are the owner's.
  Strands, three architect memos and the judge in
  [research-2026-09-10/tags/](research-2026-09-10/tags/).
- [index-layer-2026-09-10.md](index-layer-2026-09-10.md) — can indexes be a
  separate, later-declared, crowd-backfilled layer contracts still rely on?
  Yes, under three rules: hook the write path at declaration and backfill
  only the past; one coverage frontier per (family, scope) column advanced
  only by kernel-derived bits; contract reads revert outside coverage.
  Six kernel facts verified (five ordinals per posting word; kind-10 carries
  only an admission ordinal → the Etched K10 decision); the v1 sort overlay
  re-homed as verified snapshot runs; D-D reduced to one ratification.
  Strands, memos and judge in
  [research-2026-09-10/index-layer/](research-2026-09-10/index-layer/).
- [message-to-codex-2026-09-10.md](message-to-codex-2026-09-10.md) — the
  owner's digest for Codex: where the work is, which intake corrections are
  now measured, what was ruled versus leaned on (with pros and cons), and the
  proposed prototyping split.
- [reconciliation-with-codex-2026-09-10.md](reconciliation-with-codex-2026-09-10.md)
  — Codex's reply accepted point by point (the tag-follows-the-file join is
  the largest correction; the mixed-run gas table; ROSTER is not now-or-
  never; D-D must reconcile August 12), the agreed split, and the prototype
  test matrix. Dated correction sections were appended to the gas, index-
  layer and tag documents rather than rewriting them.

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

## Corrections to earlier claims

Four statements from the previous checkpoint were too strong, and are
corrected here rather than quietly dropped:

- **"Every write is an AuthorIntent" was wrong.** It is true of the supported
  user path through FilesRouterV2. The upgraded Core still inherits the
  operator-authorized `executeFixture` entrypoint from the foundation, so
  privileged fixture/bootstrap writes remain possible. That is a declared
  trust boundary of this prototype, not an untrusted-user exploit — and the
  operator key is still never served to the browser.
- **`claimPrincipal` is not production identity.** It binds an arbitrary
  unclaimed id to `msg.sender`, first-come, once, with no ownership
  derivation, migration or recovery. It is front-runnable by construction.
  The fixture therefore *reserves* one principal for a wallet to claim, and
  the app reports a squatted slot explicitly instead of silently deriving an
  invisible identity.
- **`byteCommitment` used to be signed metadata only.** It was not compared to
  the publication. It is now enforced by the router (above); before this
  change it constrained nothing on its own.
- **Permissionless staging validates a caller-supplied commitment**, not a
  previously admitted publication. Anyone may stage bytes for any
  self-consistent tree. Content integrity, author admission and staging
  economics are three separate things; the sponsor binds its *gas* to trees
  named by an intent it verified, which is a funding policy, not a protocol
  rule.

## Honest limits

Folders beyond 512 lifetime names are unmeasured, and per-position enumeration
cost is protocol-shaped (the first-mutation inventory visits retracted
positions; a cheap current-folder listing needs contract-side aggregation —
a design question, not a reader bug). Bytes cap at 1 MiB (256 × 4 KiB chunks);
alternate-provider byte recovery is not built. Properties/typed tables,
mirrors, collections, redirects, sorting and negative filters remain v1-parity
gaps. Real wallet **software** (MetaMask and friends) is still untested: the wallet
suite drives a faithful EIP-1193 harness, which proves request counts,
payloads and role separation but not another vendor's UI. The remaining
manual gate is in the walkthrough. Simulated-signer dialogs remain simulated
and are never counted as real-wallet evidence. Permissionless
chunk staging means anyone may pay to stage committed bytes — spam costs the
spammer gas and can only ever fill in exactly the committed content; pricing
/ incentives for who stages remain an open venue-economics question. All
measurements are loopback with optional injected delay, not WAN.
