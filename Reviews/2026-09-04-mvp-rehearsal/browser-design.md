# Browser rehearsal design

**Status:** working authorized local design; lab workflow evidence only
**Owner:** web-client-dev
**Inputs:** rehearsal README, current MVP0 acceptance overlay, Data Explorer and
Arcade product boundaries

## Objective and evidence ceiling

Build one polished static browser for the local EFS lab. It makes the Files,
typed-data inspection and explicit verify-before-play journeys tangible without
claiming full C0 grammar, M0 passage, a product repository, a real wallet, or a
production runner. Every screen says `LOCAL WORKFLOW LAB`; receipts and success
states come only from the injected SDK and local contracts.

## Structure

- `web/index.html` supplies the accessible landmark, navigation and dialog
  skeleton. No build step or framework is required.
- `web/styles.css` plus the document's small typed-record style block supply
  responsive, keyboard-visible presentation, including the decoded field table.
- `web/model.mjs` contains pure result-normalization, action-state and sandbox
  lifecycle helpers.
- `web/app.mjs` adapts an injected `window.EfsLabSdk` or `/sdk/index.js` module to the
  DOM. It never imports contract helpers as an oracle.
- `web/game-source.mjs` exports the original game document as UTF-8 bytes for the SDK
  fixture only when the SDK asks for seed material. Browser launch always reads
  verified bytes back through the SDK; it never launches this source directly.
- `test/web-model.test.mjs` tests the pure safety and lifecycle rules.

## Injected SDK boundary

`web/bootstrap.mjs` supplies a promise or object at `window.EfsLabSdk` and the
explicit `window.EFS_LAB_BOOTSTRAP`; app code has a module fallback from
`window.EFS_LAB_SDK_URL || "/sdk/index.js"`. `createLabSdk` receives distinct
`readProvider`, `walletProvider`, `relayProvider`, `sessionProvider` and the
deployment descriptor. It consumes the published five-seam names:

```text
readPage({ kind, directory?, cursor?, limit, blockTag }) -> qualified page
readExact({ kind, id/file/revision?, blockTag }) -> qualified exact result
readVerifiedBytes({ contentId, expectedBytes?, blockTag }) -> verified bytes or qualified failure
operations.{mkdir,createFile,reviseFile,publishRecord}(input) -> canonical lab operation
planWrite({ operation, previousRevisionId? }) -> plan
prepareWrite(plan, { mode, account, grant? }) -> prepared
submitWrite(prepared, { from? }) -> observed submission/receipt evidence
readBack(submitted, { blockTag }) -> comparison + full prior journey
```

An adapter rejects absent methods and renders `UNAVAILABLE`; it does not create
sample success data. All identifiers, basis, coverage, integrity, availability,
effect and raw evidence are retained from SDK results.

## Journeys

### Files

The left pane is a directory tree; the main pane is a fixed-basis listing and
selection. Folder creation, text-file creation and text revision begin with a
preview of mode, plan digest and predicted effects. Completion requires the
SDK's independent read-back result; transaction acknowledgement remains
`Submitted — verifying effect`. Reads pin and display their basis. Partial,
unknown and unavailable states keep observed entries and never say empty or
not found. Corrupt byte attempts remain visible and never reach preview/play.

### Approval modes

- **Relayed simulation:** one deliberate local confirmation for the exact
  message approval, no transaction confirmation.
- **Direct simulation:** one deliberate local transaction confirmation and no
  preceding message approval.
- **Session simulation:** setup is separately visible; only an exact,
  qualified, active read-back of the expected registered grant enables routine
  writes with zero confirmation prompts.

These are instrumented local EIP-1193 rehearsals, not extension interaction.
The confirmation dialog names the mode, digest and count. Cancellation is a
typed local rejection and performs no write.

### Data inspector

A separate tab lists qualified typed records and selected schema. A concise
decoded field table is the default view, with raw schema, payload and validation
evidence retained in a disclosure. The evidence panel exposes identifiers,
basis, coverage/support/validation, authority, currentness/finality,
integrity/availability/returned-byte state, effect, attempts and raw JSON.
Missing rich presentation never hides a raw record.

### Tiny Arcade rehearsal

The browser exposes one original tiny game record. Browsing or inspecting never
creates an iframe. Explicit Play first requests an exact qualified revision and
independently verified bytes at the same block-hash basis. Launch requires
`FOUND`, supported/valid/available observations, an exact content match, and
`VERIFIED`/`RETURNED` bytes. The browser creates a Blob URL and a fresh iframe
with `sandbox="allow-scripts"`, no same-origin, wallet, network or host bridge.
The game uses pointer/keyboard input inside its frame, bounds every animation
and listener, and reports only within its own document. Stop, navigation, tab
change and replacement advance a generation fence: pending reads cannot mount
after cancellation, while a mounted frame is removed and its Blob URL revoked.
Corrupt/unavailable results render an honest blocker with attempts.

## Accessibility and adversarial checks

All actions are native buttons/forms; tabs and dialogs expose ARIA state;
status changes use a polite live region; focus returns after dialogs; visible
focus and reduced motion are supported. Tests cover partial-vs-empty language,
success only after read-back, exact prompt budgets, qualified same-basis
verify-before-play, superseded deferred reads, no iframe on browse, sandbox
flags and idempotent teardown/resource revocation.

## Exit

The report records executed browser/model checks and manual/browser evidence
separately. Full C0/M0, real wallet behavior, browser compatibility, public
deployment and product adoption remain unclaimed.

## 2026-09-04 extension addendum

The active entry is now `web/workflow-app.mjs`; the first-checkpoint `app.mjs`
above remains reference only. [Extension results](extension-results.md) record
three view controllers, exact revision routes, upload/download/history, loaded
schema tables and typed deterministic challenges. Small binaries are supported;
the lab limit stays 16 KiB. Cancellation stops pre-submit continuation but cannot
undo an already-approved grant or already-submitted effect. This qualification
supersedes any reading of the earlier "performs no write" sentence as rollback.
