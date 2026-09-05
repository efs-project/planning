# Stateful integration evidence and retrospective

**Status:** in progress. Pure Binding/index helpers are implemented and their
independent task review is closed after one focused test correction. The stateful kernel,
independent state reader and full C0 journeys are not complete.

## Evidence so far

Controller verification of `e10bc56`, repeated after fix `0c3b9ee`:

```sh
forge test --root Reviews/2026-09-05-c0-core \
  --use <native-solc-0.8.30> --offline
```

39 passed, zero failed/skipped: 18 helper tests plus 21 existing body tests.
Four fuzz properties ran 128 cases each. The helper report records explicit
failing stubs followed by behavioral RED/GREEN. Tests exercise literal domains
and packed words, exact predecessor/revision checks, tombstone transitions,
full-width Principal IDs, actual sixteen candidate caches and a separate
synthetic schema reaching the 43-key occurrence bound. Test-function gas is
not a complete admission-transaction measurement.

The unchanged independent body/admitted-cache Node suite was also freshly
re-run after the fix: 15 passed, zero failed/skipped, including actual four-group
admission and 39 valid/malformed ordinary Record comparisons. This closes the
task review's artifact-provenance question; it is still body-component evidence.

The independent task review found no production logic defect, but correctly
rejected an empty-body negative labelled as a same-shaped ordinary Type.
That explicit identity-versus-shape falsifier now uses a real parsed non-kernel
descriptor and valid body. The scoped re-review approved the correction with
no new breakage and no remaining findings. Helpers are ready for Task 2 to
consume; this is not stateful admission or whole-branch review completion.

## What the design pass changed

- **Bounded dependencies:** the old descriptor parser accepted an array of
  admitted Types. Supplying all history would make an ordinary publication's
  work grow with the entire Realm. The new internal dependency-returning
  interface will defer only external membership checks; the kernel proves
  each dependency through persisted or earlier-selected point state. The old
  strict parser and its regression behavior remain required.
- **Identity and receipt ownership:** recompute selected Record and Envelope
  identities; store the canonical unsigned header/vector once. The store
  allocates accepting batches and ordinals. Callers cannot supply them as
  trusted facts. Historical authority basis belongs to the batch, not the
  portable Envelope.
- **Reference semantics:** portable Envelope membership and local lifecycle
  are separate checks. Unknown source evidence is not absence. OBJECT checks
  the exact admitted ObjectGenesis Type without conferring charter authority.
  Unspecified reference-class resolution is explicitly unsupported in this
  bounded runtime, not declared invalid grammar.
- **SDK receipt causality:** a successful transaction does not expose an
  internal Solidity return value, and matching post-state does not identify
  which racing transaction created it. A test-host-only event will expose the
  actual result for independently correlated transaction tests. State-only
  reconstruction still requires no event/history service. The final C0
  authenticated receipt mechanism remains separate work.
- **SDK audit ergonomics:** keep membership/lifecycle and current-head/audit
  history distinct. RAW_AUDIT includes withdrawn producers; complete history
  requires an origin-to-high-water chain at one basis, not only matching
  counts. These shapes may inform disposable adapters, not public ABI freeze.
- **Physical size:** a source module is not a separate deployed runtime.
  Combined code size and costs must be measured. The unselected immutable
  STATICCALL validation-helper fallback would require its own codehash and
  deployment commitment, not just a passing Core codehash.

## What could have gone better

The stateful plan originally left its input tuples too loose: a caller-chosen
batch identifier and independently supplied unsigned Envelope bytes would
have made the implementation infer trust boundaries. The interface review
removed both before state code began. Likewise, checking dependencies and
transaction causality at the join exposed gaps that isolated parser tests
could not establish. Pin these cross-component obligations before generating
implementation or SDK wrappers; do not respond by adding duplicate state.

An adversarial test needs the actual hostile shape, not only a suggestive
label. The helper review's lookalike correction is the specific improvement
from this checkpoint. Extra test counts would not replace that falsifier.

## Next work and owner followups

Execute [Task 2 and Task 3](stateful-plan.md):
one store, atomic shadow/replay, actual postings/lifecycle/history effects,
normal-runtime local-chain tests and independent state reconstruction. Retain
the [twelve stateful acceptance cases](stateful-integration.md), the SDK
causality/closure checks and [explicit C0 qualifications](codex-integration-notes.md).

There is no immediate owner question. Full authenticated intent/nonce paths,
exact bootstrap/capabilities, Lens/Files, SDK/static-SPA integration and all nine
C0 browser journeys remain open. Actual-wallet participation and public or
permanent release authority will be requested when those gates are reached.
