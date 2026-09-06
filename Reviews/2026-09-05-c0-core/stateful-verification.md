# Stateful integration evidence and retrospective

**Status:** in progress. Pure Binding/index helpers are reviewed. The first
joined stateful draft compiles but exceeds normal deployment limits; bounded
size diagnosis is the immediate next gate. The stateful kernel, independent
state reader and full C0 journeys are not complete.

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

## First joined physical measurement

The actual compiled `StatefulHarness` artifact is **41,470 bytes of runtime**
against the normal 24,576-byte limit, and **50,823 bytes of creation bytecode**
before constructor arguments against the 49,152-byte initcode limit. The
normal `forge build --sizes` gate fails. Root independently read those byte
lengths from the compiled artifact and reran that normal size command: exit 1,
with the same runtime/initcode sizes. Forge's ability to execute this test host
does not establish normal Anvil/EVM deployment.

Root also reran the current Core Solidity suite: 44 passed, zero failed or
skipped (21 body, 18 helper and five initial state/dependency/memory-guard
tests; four fuzz properties at 128 runs). This remains an oversized Forge
test host, not normal deployment or a complete twelve-case acceptance pass.
The independent reader is unfinished. The implementer's three isolated
compiler-input measurements are:

| Diagnostic layout | Host runtime / creation bytes | Helper runtime / creation bytes |
|---|---:|---:|
| Inline, publish-only host (required getters removed for diagnosis) | 39,048 / 48,401 | none |
| Parser/body STATICCALL helper, required getters retained | 29,901 / 33,970 | 15,110 / 15,136 |
| Parser/body helper, publish-only host | 27,329 / 31,398 | 15,110 / 15,136 |

These are implementer-reported measurements of actual typed ABI calls, not
subtraction of isolated component sizes. All three still exceed the normal
runtime cap. They also omit helper codehash, gas and predecode returndata
bounds, so they are optimistic, not accepted deployment layouts. Removing
required readback does not solve the size problem and is not a scope change.

The subsequent bounded experiment kept every raw getter and the same touched-row
journal. It moved all pure preparation behind a shallow helper ABI: opaque
compiled caches, flat references, distinct posting keys and a decoded effect.
Core still owns target/dependency checks, authority, CAS, lifecycle and replay.
The measurement includes immutable helper identity and bounded STATICCALL
handling before dynamic decode. Root reproduced the normal size gate:
**26,988-byte host runtime / 29,217-byte creation**, and **18,805-byte helper
runtime / 18,831-byte creation**. The host is still 2,412 bytes over the limit.
Root also reproduced nine focused passing tests: five initial regressions plus
opaque-cache/preparation equivalence over all sixteen candidates, wrong helper
identity, oversized input/output handling and STATICCALL write refusal.

The helper's finite gas/input/output limits are provisional experiment values,
not validated maxima for all legal schemas or a complete C0 resource profile.
In particular opaque caches still carry expanded ABI bytes; moving their
decoder does not eliminate transport or storage costs. No fit or full
acceptance claim follows from the focused tests.

The next isolated refinement replaces journal serialization only: typed pools
for immutable Record/Envelope/Type insertions, fixed words for the other rows,
and the same chronological replay and reverse lookup. Explicit memory copies
must prevent later mutations from changing earlier snapshots. Every immutable
insertion asserts the full empty prestate; all earlier-selected visibility,
retry behavior and full-width metadata remain intact. Keep required getters
and the guarded helper boundary, with no coalescing or simultaneous lookup
algorithm change. This targets bookkeeping costs, not reduced semantics.

The layout remains unselected. Normal deployment, worst-case measurements and
the dependency-aware deployment commitment remain required even after a fit.

No unlimited-size setting, external mutable registry or silent helper was
added to the current draft. The experimental compiler profile remains native
Solidity 0.8.30, Cancun, optimizer 200 and via IR.

This is useful falsification of the inlined physical layout, not evidence
against the data semantics and not a reason to hide the deployment gate.
Follow the [physical-fit qualifications](codex-integration-notes.md#physical-fit-gate).

### Next resource falsifier: small group, large opaque cache

A source/arithmetic review found a concrete generic-parser pressure case:
sixteen members, each with sixty-four BOOL fields. Use distinct one-byte
printable Type names; per member, field names are `0x21..0x60`. Empty meaning,
absent specDigest, zero 32-byte qualifier, zero roles/indexes/constraints and
`validationProfile=0` are accepted by the current parser grammar. Each field
descriptor is `u16(1) || nameByte || u8(BOOL=1)`. There is no extra group name
or compatibility-count suffix.

| Quantity | Bytes |
|---|---:|
| One Type blob | 306 |
| Sixteen-member group | 4,930 |
| SR-17 Record body including group-byte length | 4,932 |
| One `abi.encode(SchemaCache)` | 20,864 |
| Complete helper `CompiledGroup` return | 336,096 |
| Provisional helper group-output cap | 131,072 |

Root independently reconstructed the fixture framing and encoded the exact
ABI structs: the byte counts above agree, with return size exceeding the
provisional cap by 205,024 bytes. This is **not yet an actual parser/helper
execution or gas measurement**; the separate call-gas cap could fail first.
The fixture is not an additional permitted group in the fixed G4 inventory.

Retain it for the next resource sweep. It shows why cache transport/storage
must be measured independently of original descriptor length and why current
experiment caps cannot claim generic maxima. It does not establish that
simply increasing the cap is viable: compact cache representation, storage
cost, call gas and whole-transaction limits need measured comparison. Keep the
current journal-size experiment isolated rather than changing its caps too.

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
  STATICCALL preparation-helper candidate would require its own codehash and
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

Physical fit should have been measured with the earliest joined skeleton,
before expanding its behavior matrix. Passing component sizes concealed the
cost of nested ABI transport and state-journal machinery when combined.
The correction is an explicit normal-size gate and one attributable layout
experiment at a time, not larger artificial limits or deleted obligations.
The sequential journal's useful invariant is exact planned replay, not the
incidental use of ABI-encoded bytes for every row; preserve the invariant while
measuring a simpler representation.

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
