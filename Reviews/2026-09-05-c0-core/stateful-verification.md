# Stateful integration evidence and retrospective

**Status:** all three implementation tasks independently reviewed, including
the reader's batch-metadata correction at `bfc696f`. Final whole-plan review
and complete C0 journeys are not finished.

## Evidence so far

### Task 3 reader and real transaction pressure at bfc696f

Implementation `f47c6b1` plus review correction `bfc696f` adds a bounded,
independent pinned-state reader and normally deployed managed-chain tests.
Root freshly reran the final **45 Node tests: 45 passed, zero failed/skipped**.
The unchanged producer code also passed root's **86 Core / 28 admission-parser**
checks and normal size gate during this review turn. Those earlier synthetic
probe tests retain their own witness semantics, not the new C0 wrapper's law.

The reader independently recomputes ordinary identities, Type caches,
chronological admission/lifecycle, Binding heads, complete RAW_AUDIT history,
all ten posting families and their origin-to-high-water words. It checks the
three complete runtime identities and dependency getters at one EIP-1898
block-hash pin, with finite row/response/work budgets. Transaction contribution
is separate and requires exact submitted transaction, receipt and event
correlation; a no-log state read leaves contribution UNKNOWN.

One Important review finding was repaired: the first version ignored two
batch authority words. The fix checks complete row shape and both independent
synthetic fixture expectations for every batch. Forty-six added outcome/audit
assertions exercise all four historical batches, missing metadata/expectations,
substitution and malformed shapes. Missing evidence is UNKNOWN/PARTIAL;
contradictory complete evidence is INVALID/PARTIAL. Focused RED/GREEN is in
the implementation report; scoped re-review approved with no remaining or
introduced Critical/Important issue. This validates synthetic row integrity,
not actual Principal authentication.

The real same-block race produces one transition and correctly correlated
ALL_FRESH/ALL_REUSED outcomes. Invalid-last-leaf and terminal-source failures
leave all enumerable kernel state unchanged. Actual retry/sweep costs and
the resulting Files constraints are recorded below. Three-component slice
fit is not four-component G0 initialization or authenticated Files acceptance.

### Canonical Task 2 implementation at e6dcb40

The selected implementation is committed locally at
`e6dcb40dc81e576bba15bd9899c00a330ff7801a`; independent task review approved
spec compliance and quality, with no Critical/Important findings.
Root freshly reran **86 Core Solidity executions (76 distinct test functions)**,
**28 prior admission/parser tests**, and **34 Node executions**: all passed,
zero failed/skipped. The Core total includes ten inherited repeats; the prior
authenticated probe tests do not authenticate the new trusted host.

Root also reproduced current-source normal sizes and a fresh managed local
deployment/publication smoke. Core/library/helper runtimes are
6,186/24,179/18,805 bytes. Current Core creation plus constructor arguments is
11,810 bytes; the group-plus-Object publication receipt used 11,317,773 gas.
All three actual runtimes and immutable identities matched, selected raw-state
assertions passed and the owned child exited cleanly. The smoke's normal
Cancun node uses a larger transaction allowance than the source C0 ceiling;
this observed receipt is below that ceiling, but Task 3 must enforce it on
every transaction and finish independent reconstruction.

Actual runtime hashes for this source and its local deployment order:

```text
PreparationHelper fb7a6e93fbeb756d5db901cac83963cd3059003d245a5f81aeaff54905b82480
AdmissionLibrary  990786dc086bda28f0625545792c0ef181d63b3c17412329a70772f493483686
Core              2114dd92f551b215706338f6c15c9d9908caed739fd47a26b0b13d9d8e1df131
```

These are not the earlier experimental runtime-template hashes. Formatting
can change compiler metadata/hash without changing measured code lengths.
They describe the committed trusted-host slice, not permanent EFS identity.

Deferred minor findings for the final whole-plan review:

- Add explicit braces to the currently correct nested unique-Record revival
  branch (`StateKernel.sol:436`) so its `else` binding is easier to maintain.
- Document intentional packed-field/selector truncation invariants and resolve
  justified cast lint narrowly (`StateKernel.sol:140`, `Preparation.t.sol:201`).
  No incorrect cast was found; current build output is not lint-clean.

The review's resource qualification is not a missing Task 2 claim: caps were
explicitly provisional in its scope. Normal-budget transaction sweeps and
full authority/bootstrap/resource validation remain required downstream.
A saved worker size log contained an earlier test-only lookalike fixture
excerpt; root's fresh final-source size/suite runs above supersede that log for
current verification. No production-size claim relies on that stale excerpt.

### Reviewed helper baseline

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

The next isolated refinement replaced journal serialization only: typed pools
for immutable Record/Envelope/Type insertions, fixed words for the other rows,
and the same chronological replay and reverse lookup. Explicit memory copies
prevent later mutations from changing earlier snapshots. Every immutable
insertion asserts the full empty prestate; earlier-selected visibility,
retry behavior and full-width metadata were preserved, with no coalescing or
simultaneous lookup-algorithm change.

That implementation **increased** host runtime to **28,866 bytes** (creation
31,095), 1,878 bytes larger than the opaque/serialized baseline. Root reproduced
the normal size failure and sixteen focused passing tests, including snapshot
independence, full insertion prestates, repeated word/head writes, full-width
transport and joined duplicate Record/Type reuse. It is retained as a negative
result and is **not selected**. The smaller guarded opaque/serialized variant
remains the comparison baseline. This result does not prove all possible typed
journals are larger, and no optimizer sweep is being substituted for a design.

### Selected linked layout

The fitting experiment preserves the smaller baseline's algorithm and
uses one immutable linked Solidity admission library. Core keeps its public
entrypoints, initialization and all required raw getters; the library executes
the unchanged planning/replay kernel against Core's actual storage reference.
The preparation helper remains a guarded STATICCALL dependency. This adds no
second store, mutable selector router, facet registry or upgrade authority.

| Candidate | Main consequence | Next action |
|---|---|---|
| Linked admission library | Moves planning and replay together; full trusted access to Core storage | Selected for reversible Task 2 continuation after reproduced normal deployment. |
| External view planner | Needs Core read callbacks and transport/decoding of the complete journal; returned values still require trusted planner semantics | Not selected; the smaller linkage experiment fits. |

The library is **trusted Core execution, not a sandbox**. No user selects its
address, storage slot or delegatecall payload. Check the actual compiler-linked
target's nonempty code and independently expected immutable runtime codehash
on every entry; expose that identity for reconstruction. Preserve failure
propagation, chronological replay and zero external calls during replay.

Solidity's external-library calling convention passes a storage pointer as a
slot, not the contents of the store. Its deployed runtime also incorporates the
library's own address for direct-call protection, so a raw compiler runtime
template hash is not the deployed-library hash. Use real link references and
deployed-code verification. These details are sourced from the pinned
[Solidity 0.8.30 library documentation](https://docs.soliditylang.org/en/v0.8.30/contracts.html#libraries).
EIP-6780 does not turn delegatecall into a sandbox or prove code quality; its
[SELFDESTRUCT rule](https://eips.ethereum.org/EIPS/eip-6780) is not a replacement
for this identity and trust boundary.

Root independently reproduced the normal size gate (exit 0):

| Component | Runtime bytes | Creation bytes before arguments | Runtime margin |
|---|---:|---:|---:|
| Core test host | 6,186 | 8,474 | 18,390 |
| AdmissionLibrary | 24,190 | 24,222 | **386** |
| PreparationHelper | 18,805 | 18,831 | 5,771 |

Root also reproduced 20 focused test executions, zero failures/skips: 15
distinct tests and five inherited repeats, not twenty distinct checks.
Linkage cases cover two independent Core stores, wrong/missing/changed code,
direct library mutation-call refusal and exact helper-failure rollback.
Runtime substitutions use explicitly synthetic Forge etch; those tests alone
are not deployment evidence. Existing unsafe-typecast lint warnings remain
visible; a successful size command is not a lint-clean claim.

A separate fresh root-managed Anvil smoke then deployed all three actual
contracts under normal Cancun size/gas limits and admitted the existing first
Type group plus a later selected ObjectGenesis. Core initcode including
arguments was 11,770 bytes. Deployment gas was 4,120,023 helper / 5,284,337
library / 2,240,086 Core. The publication used **11,317,414 gas**, an observation,
not a maximum. Counts were `(2,1,7,1,2,1,7,0)` for Records, Envelopes, Types,
Principals, admissions, batches, posting keys and Binding keys. The owned
child exited cleanly; no public RPC, unlimited-size flag or runtime etch was
used in that deployment run.

Actual library runtime hash was
`0xf2fbfc50b998c960cab182a67fc8f4ba7b8c184bb73ebbce94bfd8cc483a93af`,
distinct from its raw template hash. The driver applied the compiler's own
address immutable metadata (offset 41, length 32 for this artifact), verified
complete runtime bytes, linked Core using actual compiler references and
checked all four identity getters. These offsets/hashes belong to the retained
measurement, not the next full Core artifact.

The driver fetched every resulting inventory/row/posting, recomputed Record
identities and checked selected exact provenance, Envelope, batch and posting
assertions without using events. It did **not** independently derive every
cache, packed admission field or posting family; it used `latest` on an owned
idle node, not Task 3's pinned-basis independent fold. Its trusted context is
synthetic and does not authenticate a Principal or establish wallet UX.

Select this layout for the reversible prototype. Before completing Task 2,
add construction-time linked identity refusal as well as per-call guards,
finish all twelve cases and remeasure every changed runtime. Library headroom
is narrow. Full authority/bootstrap/Files fit, resource sweeps and the
[dependency-aware G0 V2 implementation](dependency-deployment-v2.md) remain
open. Slice fit is not full fit or an MVP-ready declaration.

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
selected stateful acceptance work separate rather than silently changing caps.

### Journal allocation pressure and correction

A read-only review found a reachable mixed-retry concern: the initial selected
prototype reserves `256 * selectedLeaves + 4` Change entries whenever any
leaf is fresh. Sixty-three ACTIVE leaves plus one fresh leaf therefore reserve
the same capacity as sixty-four fresh leaves, although ACTIVE leaves stage no
changes. The source-derived initialized-array geometry is 98,329 memory words
(3,146,528 bytes) before payloads. If the compiled allocator materializes that
geometry, memory expansion alone is about 19.18 million gas. This is **not a
measured execution trace**; compiler allocation and actual high-water remain
to be checked. The [source transaction budget and candidate limits](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md#56-eip-7825-arithmetic--cap-and-stage-b-hypotheses)
must not be confused with this smoke's normal Cancun node defaults.

The current source's conservative journal-capacity derivation is:
four own Record/reverse/admission/lifecycle rows, up to `43 * 3` own posting
changes, three unique-Type changes, plus the largest exclusive special branch:
32 group-cache rows, eight first-Binding rows, or 49 withdrawal-target changes.
That is at most **185 per fresh leaf**, plus five call-wide Envelope/Principal/
batch rows. The existing 256-per-selected capacity has slack, but the selected
count wastes memory on retries. A proposed `256 * freshCount + 5` capacity
keeps conservative slack without changing journal entries or their order.

The minimal falsifier uses one retained 64-leaf Envelope repeating a small
ordinary Record, with 63 occurrences already admitted via small masks. Compare
all-ACTIVE retry, one-fresh-only selection and the mixed 64-selected call from
equivalent prestates; record exact state, gas and memory. Then sweep 1/8/16/32/64
selected/fresh counts separately from group parsing and maximum reference
fan-out. Structural carriage caps are not guaranteed single-transaction
capacity; source-selected-leaf fallback remains necessary. No new owner
decision or broader journal rewrite follows from this targeted measurement.

The implementer then reproduced the mixed-retry defect and applied that
allocation-only correction. Root independently reran the stable regression
against StateKernel SHA256
`d4456cad413bfaaa8c1efa2f61bcfe9bfb143913ceb812e1c6c3028bd63fc858`:

| Host-call gas measurement | Before (implementer RED) | After (root-reproduced GREEN) |
|---|---:|---:|
| Select only the final fresh leaf | 374,101 | 374,678 |
| Select 63 ACTIVE plus one fresh leaf | 30,820,604 | 3,277,006 |
| Select 64 all-ACTIVE leaves afterward | 2,653,526 | 2,655,004 |

These are `gasleft()` deltas around host calls inside Forge, not actual
transaction receipts or maxima. Snapshot/revert restores identical storage
for the first two calls; the fixed final-only → restore → mixed → all-ACTIVE
order does not establish identical access warmth. The test also compares
complete observable final state and exact fresh batch/ordinal outcomes. Root
reproduced its passing bounded-overhead assertion. The prior source/log keeps
the RED evidence; the initial retained linked variant uses the old allocation.

Root's normal size gate still passes after this correction and the constructor
identity guard: Core runtime/creation **6,186/8,514**, library **24,179/24,211**,
helper **18,805/18,831** bytes. Library runtime margin is now **397 bytes**.
The earlier successful deployment smoke remains evidence for its retained
pre-correction artifact; the canonical rerun above covers the current source.
Independent task review approved the scoped implementation. The fix does not guarantee that sixty-four
fresh items or arbitrary legal schemas fit the transaction budget.

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
  Measured inline layouts fail; a fixed linked admission library and guarded
  preparation helper fit this slice. Both dependencies need independently
  checked identities and deployment commitments, not only a Core codehash.

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

The typed journal was plausibly simpler but made runtime larger. Retaining
the failed result prevented us from adopting an intuition as an optimization.
Once normal deployment passed, stop exploring physical variants and finish
the actual stateful matrix. A smoke that retrieves all rows still needs an
independent semantic fold before it can claim all those rows are correct.

## Next work and owner followups

### Historical generator check discovered during Task 3

The implementer's expanded Node run includes two failures outside the Task 3
paths: `source-pinned inventory materializes sixteen members in four
independently parsed ordered groups` and `source drift, reordered inventory,
and missing exact dependencies cannot produce an artifact` in
`../2026-09-05-mvp-build-start/type-inputs/inventory.test.mjs`.
Root reproduced both failures with the focused test command. They fail before
inventory behavior because `materialize.mjs:40` reads live-checkout source
bytes rather than acquiring them at `inputs.v1.json.sourceRevision`.

The frozen expected genesis SHA256 is
`5d1a4235e09f141059e21076be56f07baa032509739a370fa64ef8b1aaccf7cf`;
the current file and Task 3 base `aff1f6f` both hash to
`5ff293fbaa66f786a59d77d9b64a137c03e4dbe42c76350e785c9f742b7a1be6`.
Manifest, input, materializer and tests have no changes since that base.
Root separately fetched all five source files from the recorded
`1a51c5d728766f25d31fcf7575e578dca3aaf780` Git revision and verified every
expected source digest, including genesis. This is a pre-existing historical
replay/source-acquisition mismatch, not permission to refresh expected hashes
or regenerate the four candidate Type groups. Expanded-suite results must
remain reported with failures; they are not all-green Task 3 evidence.

Followup: supply an explicit pinned-source acquisition path for historical
materialization and the new G0 closure, keeping hash verification mandatory
and ordinary source-drift negatives intact. A frozen artifact's reproduction
must not depend on today's working-tree prose. No source/fixture rewrite is
part of the current reader task.

### Continue the integrated work

Task 2's implementation and independent review are complete at `e6dcb40`.
The [Task 3 reader](stateful-plan.md) is implemented at `f47c6b1` with reviewed
fix `bfc696f`; all three task gates are closed. Perform the final whole-plan
review once, retaining the deferred Task 2 maintenance findings and explicit
runtime/resource limitations, then continue authenticated code and bootstrap.
Do not restart the completed helper/kernel/reader sequence. Retain
the [twelve stateful acceptance cases](stateful-integration.md), the SDK
causality/closure checks and [explicit C0 qualifications](codex-integration-notes.md).

Root's fresh actual-transaction rerun at `f47c6b1` reproduces final-only/mixed/all-ACTIVE retry
gas of 545,833 / 3,581,018 / 2,917,031. Its unique UINT8 Record sweep in a
64-member Envelope reports 1 and 8 fresh selected leaves succeeding at
2,512,688 and 7,735,429 gas; 16/32/64 fail under the explicit 16,777,216
transaction ceiling with unchanged state. Ten selections of at most seven
leaves admit all64 using the same Envelope. The retained bounded call traces
classify 16 fresh as out of gas and 32/64 as out of gas/out of memory; each
failure reconstructs unchanged state. The later metadata-integrity correction
changes no producer code or measured transaction costs. These numbers are fixture results, not a
general eight-Record maximum or a valid final C0 write budget.

**SDK/Files consequence:** splitting selected masks preserves Envelope identity
but changes signed `WritePlan` effects. It does not preserve one signature,
one wallet prompt or atomicity across those transactions. Do not offer that
fallback as a transparent split of one atomic Files operation. Measure each
complete required Files mutation with authority and carrier joined; refuse an
oversized plan before prompting or use an explicitly different workflow.
Session automation can change prompt counts, not cross-transaction atomicity.
The [required Files shapes](../../Designs/efsv2/hierarchical-files-and-folders.md#81-operation-shapes)
are four fresh leaves for empty-directory creation, seven for initial file
creation and three for revision (including their prescribed charter/Binding
leaves). Those actual typed bodies, reference fan-out and carrier costs are the
next load-bearing budget cases; eight simple UINT8 successes do not prove
seven Files leaves fit. Optimize only if those integrated cases need it, not
to turn the structural64 limit into an invented atomic-capacity promise.

The [reviewed authority-order refinement](authority-order-and-evidence.md)
closes current authorization versus historical receipt lookup, shared lane-zero
sequencing and the narrow direct caller rule; exact codecs and wrapper tests
remain next work. It logs the later product fallback-availability question
without requesting an owner answer for this local run.
The [module/preflight refinement](authority-module-boundary.md) and
[exact batch-evidence draft](batch-authority-evidence.md) turn those rules
into the next concrete codec and operation-validation boundaries. They avoid
a second state planner, retain historical observations and distinguish G6's
two-leaf root from runtime directory creation. No encoded module or executed
authenticated wrapper follows from these design inputs.

There is no immediate owner question. Full authenticated intent/nonce paths,
exact bootstrap/capabilities, Lens/Files, SDK/static-SPA integration and all nine
C0 browser journeys remain open. Actual-wallet participation and public or
permanent release authority will be requested when those gates are reached.
