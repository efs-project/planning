# Files-browser MVP integration plan

**Status:** implementation plan for the everyday-loop mission; local prototype
only — no production repo, main merge, public deployment, durable data or
protocol freeze. Base checkpoint `cce0c73` on branch
`fable/2026-09-09-files-browser`.

## Goal

Close the integration gap named in the mission: one coherent
contracts → SDK → SPA path where the sixteen-journey walkthrough
([testnet-files-mvp-plan](../../Designs/efsv2/testnet-files-mvp-plan.md)) can
actually be driven in a real browser against real local v2 contracts, with
authorization and atomic preconditions enforced on-chain, honest
partial/conflict/unknown handling preserved, and an acceptance ledger that
says PASS / component-only / FAIL / NOT_RUN without inflation.

## What exists (mapped, reused, not rebuilt)

- **Core/carrier + upgrade regime** — `2026-09-08-upgradeable-foundation`
  (`executeFixture` = atomic multi-leaf publication with per-leaf CAS,
  EIP-712 FixturePlan by a synthetic operator; transparent proxies; U1→U2).
- **Operation recipes** — `2026-09-09-files-parity-performance/workflow.mjs`
  leaf shapes (7-leaf create, 3-leaf edit, 4-leaf rename/move, tombstone
  retract, attributed tags) and `files-reader/test/fixture.mjs` composers.
- **Bounded reader** — `2026-09-09-files-reader` scope qualification,
  five-outcome rows, page validation, budgets, evidence ledger.
- **Guest screen + harness** — `2026-09-09-files-screen` SPA shell, strict
  read relay, Playwright evidence harness, lane presentation.
- Patterns from `2026-09-05-mvp-build-start`: RPC-method/target allowlists,
  static-export CSP, one-use opaque handles, negative tests.

## The missing joins (build order)

1. **Reader extensions** (edit `files-reader` compatibly + new modules):
   subject-keyed directory opening (child folders, breadcrumbs; fixes the
   latent parent-mountId loop), content resolution (revision head →
   FileRevision → ChunkTree → carrier bytes, verified before exposure),
   exported name/revision history, per-author tag reads.
2. **FilesRouterV1 contract** (new, separately deployed; delegates admission
   to the existing Core): per-author EIP-712 authority over the whole routed
   operation (registry of principal → account; guest/unauthorized signers
   rejected on-chain), ASCII name-profile enforcement
   (`MALFORMED` vs `UNSUPPORTED` split), plan-wide source/destination
   preconditions via Core `resolve` (NOREPLACE, source identity), cycle
   witness verification for folder moves, remove-vs-rename marker semantics
   (RemovalMarker + mask vs plain whiteout), whole-tx atomicity, typed errors.
   Honest labels: C0 arm, `filesPreconditionCertified=false` (bearer plans
   can still reach Core directly; certified consent binding remains future
   work per §8.2), synthetic operator co-signature retained and displayed.
3. **SDK actions** (`sdk/`): browser-portable leaf/codec port (no Buffer),
   five-seam families — deterministic `plan` (intent → leaves, CAS,
   predicted IDs; apps never build masks/ordinals), `authorize` (author +
   operator EIP-712 via an explicit local test signer), `submit` (raw tx via
   validated relay), `readBack` (independent re-read at a committed basis;
   only this may claim `effect=COMMITTED`). Typed failures; no unqualified
   `valid`/`success`.
4. **SPA** (`web/`, evolved from files-screen): nested navigation with
   breadcrumbs and per-directory scopes; file panel (verified text/image
   preview — never executing untrusted content in the trusted origin); the
   mutation journeys (create folder/note, upload image, edit + draft
   preservation, history + open old revision, rename/move, copy vs second
   placement, remove/restore + Removed items, tags + filter); Lens switching
   and Why-drawer retained; honest coverage copy retained; local-signer
   consent dialog with a visible prompt counter and the "simulated wallet"
   label.
5. **Performance** (simple candidates first, per the correctness-first
   ruling): transport JSON-RPC array batching (relay + rpc-source),
   qualification reuse keyed on (source identity, blockHash) across
   navigation scopes, page-size comparison; measure RPC counts/bytes/latency
   on representative folders before/after against the retained baselines;
   keep the 64-name/60-retraction churn control honest.
6. **Upgrade + export**: repeat key journeys across U1→U2 (same addresses,
   old citations, stale plans refused, new writes); export selected subtree
   (plain files + evidence bundle) and reopen in a fresh reader with no
   browser-cache dependence.
7. **Evidence + handoff**: Playwright journey tests as the automated
   counterparts, screenshots, gas/latency tables, the sixteen-row acceptance
   ledger with per-row status, 15-minute walkthrough, startup/reset/test
   commands, remaining blockers and the (few) genuinely-owner decisions.

## Working rules

- One authoritative resolver: base reader modules extended in place with
  compatible signatures; content/history/tags/actions are new modules beside
  them. No browser-side tree.
- Contract preconditions are the enforcement; UI checks are convenience.
  Adversarial tests submit around the UI.
- Wallet honesty: guest = zero prompts (asserted); writes = one approval on
  the local disposable signer, counted, labeled simulated; real-wallet
  evidence stays an explicit manual test for James.
- Preserve prior experiments' files and evidence untouched; where my edits
  supersede their byte-pins at this revision, say so in the README instead
  of rewriting history.
- Every increment: focused tests + real-browser check before the next.
