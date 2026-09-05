# Browser rehearsal report

**Status:** local browser rehearsal passed its bounded integrated checks
**Evidence ceiling:** disposable local workflow UI, not C0/M0, product,
real-wallet, compatibility, accessibility-participant or deployment evidence

## Delivered

- Responsive Files workspace with a live fixed-basis header, qualified listings,
  human Folder/File and metadata evidence labels, safe empty vs partial/unknown
  copy, folder/file creation and text revision flows.
- Explicit relayed/direct/session modes. The browser owns one visible simulated
  confirmation ceremony; the injected SDK/provider split owns the recorded
  EIP-1193 method calls. Session setup precedes routine planning and routine
  session writes add no browser confirmation.
- Separate Data Inspector tab: record inventory, exact record/schema reads,
  independently verified payload bytes, typed validation, a concise decoded
  field table and folded raw evidence.
- Original `Signal Drift` byte artifact. Browse creates no iframe. Play pins the
  configured File/revision/content identity, requests verified bytes, and only
  then creates a fresh `sandbox="allow-scripts"` iframe/Blob URL. Stop,
  navigation and page teardown remove the frame and revoke the URL.
- Honest unavailable states when explicit SDK/configuration or evidence is
  missing. Transaction inclusion is pending; only `READ_BACK_VERIFIED` plus
  `effect=COMMITTED` renders saved success. A new submit immediately replaces
  any prior Saved label with an in-progress state.
- Session mode is enabled only after a qualified exact read-back matches every
  expected grant field, identity and active state; `FOUND` alone is insufficient.

## Executed checks

From `Reviews/2026-09-04-mvp-rehearsal`:

```sh
node --test test/web-model.test.mjs test/web-surface.test.mjs
node --check web/app.mjs
node --check web/game-source.mjs
```

Latest browser-owned subset: 17/17 Node tests passed; both module syntax checks
passed. These are included in the rehearsal's final joined 42/42 Node result.
The tests cover result language, human row presentation, fixed-basis display,
read-back success gating, prompt policies, qualified same-basis launch,
contradictory evidence rejection, exact active session-grant admission,
generation-fenced deferred reads, resource teardown, absence of a pre-Play
iframe, game CSP/external-resource exclusions, inline script syntax and sandbox
tokens.

## Integrated browser evidence

The root-owned controller executed 8/8 Playwright journeys against real Chromium
148.0.7778.96, the fresh disposable Anvil contracts and the browser's current
source. The retained run covered desktop and mobile presentation, guest file
read, relayed/direct/session writes and their simulated prompt counts, decoded
typed data, explicit verified game launch, and cold reopening. The
machine-readable result is `artifacts/browser-results.json`; it records no page
errors.

The controller supplied the explicit deployment/accounts/config, seeded the
game into the local byte store, and recorded provider-channel calls. The run
observed zero guest wallet calls, one relayed owner-message approval, one direct
owner transaction approval, one separate session-setup approval and zero
routine browser confirmations for session revisions.

This does not establish real extension behavior, participant accessibility,
cross-browser compatibility, corrupt-provider recovery, public deployment or
any full C0 M0 row. Cancellation and contradictory-evidence paths are retained
as deterministic model tests, not claimed as additional browser journeys.

## Known lab-only boundaries

The UI assumes the versioned `efs-lab/1` builders and finite pages. Its randomly
chosen create salt and ten-minute deadline are explicit operation inputs, not
protocol defaults. Local confirmations deliberately stand in for wallet UI;
no extension is detected or contacted. The game has no external assets,
network API, wallet, same-origin permission, persistent state or parent bridge.
