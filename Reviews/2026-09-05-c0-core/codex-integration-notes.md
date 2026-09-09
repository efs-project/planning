# Exact bootstrap inputs still needed by the joined Core

**Status:** engineering refinement for the disposable C0 run; not a permanent Codex or a claim that these capabilities execute yet.

Source audit against `0b57513` found a real composition issue: the complete
B0 AUTHORITY module advertises active ERC-1271, P256 and RSA verification, while
the C0 control explicitly exercises composite EOA, direct EOA and a bounded
same-Principal session. Copying B0's active rows into an EOA-only runtime would
be a false claim, not a harmless unimplemented feature. The same B0 module
cannot mint while its ERC-1271 gas constant is measurement-pending.

## Run-local refinement

Build an explicitly versioned **C0 overlay**, not an unchanged B0 AUTHORITY
revision 1. Preserve the imported Record/Envelope/Occurrence identity formulas,
canonical EOA Principal derivation, exact unsigned publication fields, Type
grammar and required index/Binding behavior. Keep every required C0 journey.

The overlay's acceptance table must name composite EOA, direct-transaction EOA
and delegated-session verification and their distinct retained bases. It must
explicitly mark Stage A direct-envelope witnesses, ERC-1271, P256 and RSA
acceptance as unsupported in C0, rather than advertising them as active. The
unsupported verifier programs/constants are not executable C0 requirements; no
invented ERC-1271 gas value or pending placeholder enters a minted C0 module.
This implements the already bounded C0 scope; it neither rejects those future
EFS account capabilities nor expands this MVP into managed identity work.

Likewise, resolve the intrinsic inventory explicitly. C0's intrinsic bootstrap
meta-Type plus the sixteen G4 Types do not imply support for B0's four intrinsic
evolution schemas. Kernel Binding IDs must be derived from the actual G4
group-2 candidates, not separate singleton blobs. Keep the old run artifacts
and Type candidate bytes unchanged; new runtime semantics require a new run.

Pre-withdrawal needs the same explicit support treatment. B0 authenticates a
never-admitted target through `TargetEnvelopeEvidence` containing a direct
envelope witness; a C0 composite WritePlan signature is not that witness.
The first stateful module may exercise withdrawal of already-admitted targets
using their retained C0 authority evidence. It must reject a never-admitted
target until a bounded C0-authenticated evidence overlay is implemented and
independently tested. Do not infer authority from a bare target ID or silently
call the unsupported B0 verifier. This is an unfinished capability, not a
permanent removal of pre-withdrawal or a claim of complete B0 lifecycle support.

Also preserve C0's closed operation table. There is no generic public
`TOMBSTONE` or `WITHDRAW` operation in its nine current operation kinds. Test
the complete reusable Binding transition module through an internal-kernel
test harness; do not introduce a production `bind()` entrypoint or smuggle an
arbitrary mutation under a Files operation name. Required C0 Files paths and
their authenticated publication boundary are unchanged.

The initial stateful resolver also needs a precise reference-support row.
For external OCCREF, retained Envelope membership is checkable even when the
target leaf is NEVER_ADMITTED or WITHDRAWN; local lifecycle is not reference
existence. An unavailable external envelope yields `REFERENCE_UNPROVED`, a
bounded preflight refusal with UNKNOWN knowledge, not invalid bytes or proven
absence. Current-envelope OCCREF still rejects unconditionally. RECORD/OBJECT
references use the explicit selected/persisted Record rule, with OBJECT's exact
ObjectGenesis Type requirement. That class check is not publisher ownership
or authority from a charter Binding.

TYPESCHEMA and PRINCIPAL remain valid reference grammar classes, but the cited
B0 corpus does not supply their runtime existence predicate and none of the
sixteen C0 candidates uses either class. The first resolver must report them
as unsupported capability, not invalid classes, until that predicate is
specified and tested. A later C0 capability serializer must not advertise full
five-class resolution from evidence covering only the three implemented
classes. This is a scoped engineering gap, not a permanent Type restriction.

Index overlay work must carry `KIND_BINDING_SCOPE=0x0a` and its exact value-key
domain through the Codex, point/page/cursor decoders and RAW_AUDIT rules. Its
first-bind **and first-tombstone** admission anchor is appended exactly once,
never filtered or removed by lifecycle changes. Re-measure aggregate fan-out;
do not treat B0's estimated `F_MAX=44` as observed C0 cost.

This refinement selects the honest scope of the next disposable serializer,
not its unimplemented byte layout. Before deployment, freeze the actual
ordered tables, error/status/program rules and independent vectors, with
explicit source-to-overlay ownership. No source prose hash or nonzero dummy
commitment substitutes for the table bytes.

## Physical fit gate

Measure the combined runtime under the ordinary 24,576-byte deployment limit;
internal library files still inline into that runtime. Keep one Core storage
owner and do not hide an oversized host with an unlimited-size setting.
The [joined measurements](stateful-verification.md#first-joined-physical-measurement)
show the inline host does not fit, and a parser/body-only helper does not fit
even when required getters are removed for diagnosis. Keep those getters.
The guarded pure-preparation helper also leaves Core 2,412 bytes too large;
the typed-journal attempt increased runtime and is not selected. The selected
prototype retains the smaller serialized journal and moves the unchanged
admission kernel behind one immutable, explicitly linked Solidity library,
while Core keeps initialization and required readback. This is trusted
DELEGATECALL execution with full Core storage authority, not a sandbox.
There is no generic target/slot/payload port, mutable link or selector router.
The **selected preparation boundary** is an immutable, stateless pure-preparation
helper called by STATICCALL during preflight: opaque compiled cache bytes,
flat references, posting keys and decoded effects, without deep schema/body
ABI decoding in Core. It is not an external mutable registry or delegatecall
facet system. Do not combine this continuation with a journal rewrite,
coalescing or an unrelated lookup algorithm.
Core retains all dependency/reference/state choices; actual authenticated
authority still needs the outer wrapper. This run-local layout requires
bounded calls/returndata, retained address and runtime codehash, independent
dependency verification and new aggregate measurements. It is not the unchanged
B0 one-physical-Core layout.

The current `ExperimentDeploymentV1` lists only Core and byte-store runtime
hashes. A helper/library-backed complete run therefore needs a versioned
dependency commitment/readback refinement first; verifying Core's codehash
alone does not verify linked execution and preparation dependencies. Check the
actual linked address and independently expected library runtime hash on every
entry and before initialization, including its constructor-generated address
patch. The [V2 deployment refinement](dependency-deployment-v2.md) specifies the
closed four-component commitment and acyclic linking/deployment order; its
codecs are [implemented and reviewed](bootstrap-codecs-verification.md), while
full bootstrap is not. The later [read-library refinement](read-library-layout.md)
requires the closed [six-component V3 successor](dependency-deployment-v3.md)
and target-aware links. V2 code/evidence stays unchanged. Only reversible prototype
topology is selected, not permanent product topology.
The [current architecture](../../Designs/efsv2/core-architecture-candidate.md#modular-contract-shape-to-prototype)
and [C0 control table](../../Designs/efsv2/disposable-mvp-profile.md#2-temporary-control-choices)
leave the physical split open to measurement; B0 admission §5.4 remains the
baseline being compared.

## Concrete input work, in dependency order

| Input | Already available | Work still required |
|---|---|---|
| Seed/deployment bytes | Independent V1 and [V2/selection codecs](bootstrap-codecs-verification.md); [V3 six-component framing](dependency-deployment-v3.md) and [real initialization boundary](initialization-boundary.md) specified | Implement V3/target-link-map/genesis and bounded seed/group openings; enforce the explicit one-time executor. Supply complete real inputs and independently verify construction, not just runtime consistency. |
| Encoding tables | Ordered domain, bounds, algorithm, field/selector/error/constraint grammars | Materialize exact C0 tables and declare every overlay difference once. Keep index-owned limits/codes out of duplicate encoding rows. |
| Authority module | B0 byte grammar and explicit C0 authorization obligations | Encode the C0 support table, exact verifier/basis rules, session-grant fields/ID/approval/metering and retained evidence. No unsupported path may appear ACTIVE. |
| Index module/capabilities | B0 index tables/cursor rules; C0 scope override; [closed 101-byte manifest and declaration mapping](bootstrap-inputs.md#closed-capability-manifest-for-the-next-serializer) | Integrate the versioned INDEX module and independently validate every enabled point/page/continuation. The manifest is unimplemented; a documentary list is not an active capability. |
| Type-group root | Sixteen exact candidate blobs; [160-byte run-local root grammar and literal vector](bootstrap-inputs.md) | Implement independent codecs and enforce the seed's expected inventory during G4, then reconstruct from retained state. Preserve the 6/3/6/1 inventory/order; one-off vector agreement is not bootstrap completion. |
| Run bounds | Component-only carrier/schema measurements | Measure complete Core+carrier operations and the required read/proof/client costs before selecting valid immutable run bounds. |

## Next authenticated boundary, after stateful reconstruction

The next bounded authority increment should reuse C0's exact publication,
ExpectedRevision, RealmEffects and WritePlan fields/type strings, plus its
intrinsic EOA descriptor/Principal identity. The existing authenticated
[Type probe](../2026-09-05-c0-admission/run-codec.md#sole-write-shape) supplies
composite-signature recovery and independent-vector evidence, not a finished
wrapper. Its arbitrary nonce lanes, one-schema-author/one-leaf scope, singular
Envelope witness, documentary basis label and probe genesis are explicit
shortcuts; preserve the old evidence rather than silently adopting them.

Before implementation, specify these three concrete inputs:

1. Versioned C0 AUTHORITY branch/program/error/basis rows and failure order,
   including EOA code observations and exact direct-caller rules. Reuse the
   B0 owner-module grammar, not its unsupported ACTIVE verifier inventory.
2. Historical evidence per fresh accepting batch: exact plan/effects/witness,
   actual signer and context, with grant linkage for session writes. B0's
   256-bit basis word is fully occupied; an evidence/grant ID needs an explicit
   extension, not unused bits or a documentary string hash.
3. Exact grant/EOA approval/registration/revocation bytes and metering units.
   Normal composite/direct writes use lane zero; a session's approved nonzero
   uint192 lane maps permanently to one grant. No truncated hash lane, recycled
   lane or grant ID in its own preimage. Admission-time historical evidence
   must not be reinterpreted through a later live grant.

The [selected retry-order and evidence refinement](authority-order-and-evidence.md)
now distinguishes currently authorized writes from public historical reads,
fixes shared lane-zero sequencing and selects a narrow direct caller rule.
It records the source tension and required falsifiers, not an encoded module
or executed wrapper.

The [module/preflight refinement](authority-module-boundary.md) selects a
distinct C0 verifier version rather than relabeling B0's hardcoded programs,
the direct-Core executor convention and bounded operation-only validation
before the existing planner. The [batch-evidence codec](batch-authority-evidence.md)
drafts exact composite/direct retention (at most 1,036 bytes), with one
immutable value per accepting batch and separate transaction contribution.
The module note now supplies exact source-reviewed rows/programs; their actual
serialization, outer wire/operation guards and joined implementation are still
required. The [codec checkpoint](authority-codec-verification.md) records the
reviewed pure Solidity encoder and independent reader/deployed agreement;
the joined codec gate and sparse-vector final fix close at `1ce66df`, with
root's covering 77 Node checks passing.
Neither that component nor the written rows supply full session or G0 coverage.

Common codecs plus composite/direct verification and batch evidence are a
useful intermediate package. It must leave session NOT_IMPLEMENTED until the
complete grant/program path executes; it cannot mint a complete C0 run. Encode
and test the selected C0 ordering instead of inheriting B0's expired-retry
shortcut. Preserve the weaker direct-transaction
evidence grade: ordinary Core state cannot recover an unavailable transaction
signature or turn sender observation into detachable publication proof.
Tests must cover multiple accepting batches for one Envelope, wrong fields,
signer/sender/lane, replay/expiry and whole-call rollback. This is source-mapped
remaining engineering, not an owner identity redesign or a completed codec.

## Source anchors

- [Encoding §1.6](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md):
  outer Codex module ownership and no-placeholder rule; §3.4/§6 intrinsic IDs.
- [Authority §3.8](../2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md):
  active witness rows, byte-exact verifier programs and pending constant C16.
- [Indexes §0.1](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md):
  ordered index module and limits; C0 [Files §5](../../Designs/efsv2/hierarchical-files-and-folders.md)
  supplies the BindingScope override.
- [C0 §4](../../Designs/efsv2/disposable-mvp-profile.md) and
  [genesis G3/G4](../../Designs/efsv2/mvp-c0-genesis-manifest.md):
  current scope/authorization and required capability/Type inventory.
- [Admission §5.5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md)
  and [Binding §4](../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md):
  authenticated pre-withdrawal and terminal occurrence behavior, qualified by
  C0 §4's explicit witness incompatibility and closed operation table.
- [Authorship §3.1](../2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md)
  separates portable occurrence membership from the Realm-local lifecycle;
  [encoding §3.1](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md)
  supplies the five valid reference classes and exact-Type qualification.
- [Foundation run codec](../2026-09-04-mvp-c0-foundation/run-codec.md) and
  [measurement limits](../2026-09-04-mvp-c0-foundation/README.md):
  reusable exact encoding, not a completed or valid bootstrap report.

No owner question is needed for this refinement. The engineer implementing the
serializer must return exact bytes and executed coverage before calling G0–G3
complete. Public deployment, permanent support/profile choices and release
remain outside this run.

The [materialization decision](codex-materialization.md) selects independent
full offchain encoders plus an exact compiled length/hash check in the closed
Core, not a general onchain Codex interpreter. Its explicit outer-table
dispositions prevent unsupported B0 behavior and physical slots from entering
the active C0 inventory. The [read overlay](read-overlay.md) closes the
eighteen-row engine mapping, exact Type origin and unsupported-count semantics.
Neither document is an encoded complete Codex or implemented capability proof.
