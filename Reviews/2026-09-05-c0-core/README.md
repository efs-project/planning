# Joined C0 Core implementation track

**Status:** in progress — disposable local implementation toward the full C0 MVP, not a completed profile or a production repository.

This is the continuous integration home after the published
[Type-admission checkpoint](../2026-09-05-c0-admission/README.md). Keep adding the
missing pieces here instead of declaring a succession of disconnected probes
to be the MVP. The existing `efs-lab/1` browser remains a usable separate demo;
its passes cannot substitute for the exact C0 acceptance rows.

## Finish line and order

The controlling specifications remain the [C0 profile](../../Designs/efsv2/disposable-mvp-profile.md),
[ordered genesis](../../Designs/efsv2/mvp-c0-genesis-manifest.md),
[five SDK seams](../../Designs/sdkv2/mvp-interface.md), and
[nine joined acceptance journeys](../../Designs/web-client-os/mvp0-acceptance.md).

1. Consume the real admitted Type caches to validate application Record bodies;
   add generic reference resolution and the declared index obligations.
2. Implement atomic multi-leaf admission, Binding CAS/history/no-resurrection,
   and genesis-active BindingScope. Keep the author, actual signer and payer
   separate; preserve canonical bodies and retained authority evidence.
3. Materialize the exact Codex/capability inventory as those capabilities are
   implemented, then join the real Core and carrier through G0–G12. A list of
   desired capabilities is not evidence that they are implemented. No opaque
   replacement commitment counts as completed initialization.
4. Connect the bounded contract Lens and Files kernels: empty root → atomic
   small-file creation → exact path/bytes/complete listing → rejected stale-CAS
   update with all Core state unchanged. Then close all three mutation paths.
5. Wire the same Core into the typed SDK, static SPA and separate Data Explorer.
   Run all nine C0 journeys with independent reconstruction and wallet traces;
   distinguish synthetic signature tests from actual wallet UX evidence.

Each increment records tests, failure analysis, design refinements and the next
unfinished requirement. The full goal stays active until the integrated finish
line is supported, not merely because the current increment passes.

## Architecture choice for this iteration

Use small source modules with one atomic mutation boundary. Reuse the tested
descriptor parser and carrier where their contracts fit; do not copy the old
admission probe wholesale or make its temporary commitment the new Realm.
First separate pure body parsing/extraction from stateful target lookup and
effects. The same extracted values feed validation, indexes and Binding
interpretation; the SDK must not implement a second state mutation path.

Compared with extending the schema-only probe, this avoids inheriting its
one-author/one-leaf restrictions. Compared with a genesis-only shell, it builds
the capabilities that genesis must actually prove. Physical linking versus
inlining is measured once the joined runtime exists; it is not a permanent
contract-topology decision.

The [Codex integration notes](codex-integration-notes.md) close a source-scope
ambiguity before bootstrap: the C0 account-support overlay must be explicit,
not a B0 module falsely advertising unimplemented verification paths. They
also identify the exact capability/group-root/session bytes still to build.
The [authority-order refinement](authority-order-and-evidence.md) separates
currently authorized retries from historical result reads and records the
direct-EOA boundary and per-batch evidence requirements. It closes design
ambiguities, not executed authentication or session coverage.
The [authority-module/preflight boundary](authority-module-boundary.md) now
selects distinct C0 verifier programs and bounded operation-only validation
before the existing state planner. The [batch-evidence codec draft](batch-authority-evidence.md)
specifies a bounded per-batch extension without overwriting Envelope evidence
or the original full basis word. The [common codec implementation plan](authority-codec-plan.md)
is the current two-task increment: pure commitments/retention plus independent
reader agreement, not another mutation path or an authentication-complete claim.
Its [execution/review checkpoint](authority-codec-verification.md) records the
reviewed Solidity implementation/test hardening through `aff4d8c` and the
reviewed independent reader at `5f16e56`. Root reproduced 107 Core, 28 parser
and 76 Node passes, including actual deployed cross-language agreement. The
final gate found and closed a sparse-JS-array commitment bug at `1ce66df`;
root's final covering 77 Node checks pass, with unchanged deployed agreement.
Both task gates and the single final fix/re-review wave are closed. Exact authority
rows and a source-reviewed wrapper sequence now supply concrete next inputs
without splitting or duplicating the existing state planner.

The [typed request boundary](outer-request-boundary.md) selects ordinary
calldata and the existing Principal structure, with independent logical and
actual-call byte budgets. Its [bounded preparation plan](request-bounds-plan.md)
now executes at `0696b21`: root reproduced 118 Core and 78 expanded Node passes,
including the real receiver and hostile ABI cases. Both independent task and
[final whole-increment review](request-verification.md) approved through
`c13a368`, without a final fix wave. This preserves the single external witness and existing
identities; bounded preparation is not authenticated Core or Files acceptance.
SDK review kept five public seams and clarified original-input snapshot and
readiness boundaries without adding another signature.

## Completed body checkpoint

[Application-body validation plan](body-validation-plan.md): a reusable Solidity
validator and an independent JavaScript reader exercised against actual admitted
Type caches. Fresh controller checks pass: 21 Solidity tests and 15 Node tests,
including 39 independently identified valid/malformed body comparisons. See
[verification and retrospective](verification.md) for review status, component
resources, repaired design seams and remaining gaps.

This closes structural body parsing/extraction only. It does not
claim stateful target validity, Files semantic validity, completed application
admission, G3 capability activation, or any C0 browser row.

## Current stateful increment

The [stateful increment](stateful-integration.md) records the state owners,
exact dispatch rule and twelve adversarial acceptance cases for application
admission, Binding and postings. Its [implementation plan](stateful-plan.md)
has completed the pure key/effect helpers at `e10bc56` plus review fix
`0c3b9ee`: 39 Solidity and 15 Node regression checks pass, with independent
task review closed. Inline stateful layouts fail normal deployment and the
typed-journal attempt was larger. The selected fixed linked-admission layout
now passes normal deployment and a real local publication smoke: Core 6,186,
AdmissionLibrary 24,190 and preparation helper 18,805 runtime bytes. The library
has only 386 bytes spare in that original measurement. The canonical
implementation at `e6dcb40` adds constructor identity refusal and fixes mixed
retry allocation, reducing library runtime to 24,179 bytes (397 spare).
Independent task review approved; root reproduced 86 Core executions
(76 distinct), 28 parser/admission and 34 Node passes plus a fresh current-code
deployment smoke. The independent reader is now implemented at `f47c6b1` with
reviewed integrity fix `bfc696f`; root's final 45 Node tests pass, including
real same-block contribution, full raw-history reconstruction and resource
sweeps. Sixteen fresh simple Records exceed the normal transaction budget;
smaller-mask fallback is multiple transactions, not an atomic Files fallback.
See [stateful evidence and retrospective](stateful-verification.md) for exact
costs and repaired unchecked batch fields. The final whole-plan review and
single fix/re-review wave now close at `3e56bc0`: historical replay reproduces
the unchanged artifact; root's expanded62 Node,86 Core and28 parser checks and
normal sizes pass. Two nonblocking maintenance followups remain explicit;
the full source-pin failure is no longer open. All three task gates and this
bounded final gate are closed.
Authentication, complete bootstrap and actual Files operations are the next
integration work, not capabilities completed by this trusted-context slice.

[Bootstrap input refinements](bootstrap-inputs.md) specify the four-group
commitment, closed capability manifest and existing digest point/backlink path
without changing candidate Type bytes. Neither a vector nor a capability list
is an implemented bootstrap or evidence that all endpoints work.
The [dependency-aware deployment V2 design](dependency-deployment-v2.md)
specifies the four-component commitment and acyclic link/initcode sequence;
its implementation and full G0–G12 execution remain outstanding.
The [real initialization boundary](initialization-boundary.md) adds the missing
seed/group proof carriage and an explicitly pinned one-time bootstrap executor.
It keeps the trusted test host separate and makes configuration/deployment
provenance checks explicit; the new initializer itself is not implemented.
The [bootstrap codec component](bootstrap-codecs-verification.md) now implements
the V2 seed/deployment and configuration-selection readers through `c2b5f7b`.
Root reproduced131 Core/91 expanded Node and unchanged V1 tests; task review
approved after complete deployed-field/u64 comparisons were added. Final
whole-increment review approved `de58903..a0af29f` without a blocking fix wave.
These tests do not initialize Core.
The [read overlay](read-overlay.md) fixes the shared read surface and SDK
evidence/budget contract; the [Codex materialization selection](codex-materialization.md)
uses one compiled exact artifact instead of a general onchain interpreter.
Its exact domain/raw-string rows and the [INDEX revision-2 inventory](index-materialization.md)
now pin concrete serializer inputs, retire an understated aggregate fan-out
estimate and keep optional convenience reads outside the first Core surface.
The [outer revision-2 row sheet](outer-materialization.md) now closes numeric,
code-dictionary and fixed-format inventory as well. Serializer implementation,
full capability/authority coverage and actual joined budgets remain next work.
The [point-read plan](point-reads-plan.md) now implements shared original
Type/Record/Envelope projections and bounded storage-byte access through `154fcbe`.
Root reproduced151 Forge/92 Node checks; task and whole-increment review closed
after missing negative tests, duplicated frame validation and returned-Envelope
evidence assertions were repaired. The
[verification checkpoint](point-reads-verification.md) preserves the separate
trusted host and later occurrence/query/authority/initializer work.
The [occurrence/receipt design](occurrence-receipt-design.md) and
[bounded implementation plan](occurrence-receipt-plan.md) now execute at
`08c2a16`: current admission/lifecycle and original accepting-batch projections,
without another store or write path. Root reproduced160 Forge/93 Node checks
and normal18,664-byte host deployment; independent task review approved.
The [verification checkpoint](occurrence-receipt-verification.md) retains the
full evidence and outstanding final increment review/initialized-Core boundary.

The [SDK/static Files handoff](browser-integration-handoff.md) reconciles the
PMs' source-backed adapter responsibilities and the next joined browser trace.
It preserves the existing lab control, specifies one SDK truth adapter and
keeps wallet/action code out of guest boot. Its prerequisite is the actual
initialized/authenticated C0 ABI and run, not a test-harness address swap.

## Owner followups

None needed to continue reversible local engineering. Later, actual-wallet
participation and any product-repository/public-deployment/permanent release
authority must be requested precisely when needed. No general Type-system or
venue questionnaire is reopened by this work.
