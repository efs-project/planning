# Adversarial review record

**Status:** integrated audit trail; findings below were applied to the main
review and the revised `Designs/efs15/` draft unless marked residual

## Lanes

| Lane | Question |
|---|---|
| V2 invariant/source pass | Which v2 properties remain necessary after portable data is removed, and which exact mechanisms are unsafe to copy? |
| V1/EAS implementation pass | Can universal IDs fit the deployed model, what must change, and what does live Sepolia actually contain? |
| Product red team | Does the proposed core support Arcade, Nanda, Git/wiki, files, and schemas without importing v2 scope through the back door? |
| Schema/resolver pass | Can 1.5 keep EAS's shared-type, records-by-type, validation, and interoperability advantages? |
| ID-profile challenge | What must an implementation-grade `EFS-ID/1` spec settle before durable data? |

All lanes were read-only. Their agreement is evidence for the recommendation,
not owner adoption.

## Findings that materially changed the draft

### 1. “Change the SDK IDs” was false

**Challenge:** v1 DATA has an empty payload, semantic edges and indexes use EAS
receipt/schema UIDs, and EAS rejects a non-receipt `refUID`.

**Correction:** 1.5 is an additive sibling schema/resolver/index/view profile
over EAS. The SDK changes with it, but cannot create the invariant alone.

### 2. Universal IDs are necessary but insufficient

**Challenge:** IDs without slot/cardinality, receipt folding, immutable
revision semantics, and honest reads still allow split graphs, stale receipt
resurrection, mutable citations, and false absence.

**Correction:** the minimum now includes the four semantic roles, legal target
matrix, duplicate/supersession/revocation fold, exact-versus-moving links, and
typed basis/completeness outcomes.

### 3. Full-width principals do not make KEL additive

**Challenge:** preserving `bytes32 PrincipalId` avoids an object-ID truncation,
but does not retroactively prove which device was authorized, solve historical
rotation, or prevent a thief from racing first future-KEL inception.

**Correction:** the design now calls this a namespace seam only. KEL remains
explicit debt and a later compatibility proof, not a promised transparent
upgrade.

### 4. Arcade's existing schedule conflicts only with durable seeding

**Challenge:** the current Arcade plan assumes a v1/no-contract-change demo,
while the 1.5 draft forbids durable Arcade state before universal IDs.

**Correction:** guest browse/play UI can proceed behind an adapter. New v1
seed data must be declared disposable/reseedable; permanent links wait for the
1.5 ID and fork gates.

### 5. The live deployment is not empty

**Challenge:** a point-in-time Sepolia read found 1,654 indexed records,
including 107 DATA from seven attesters. Deployed anchor depth (`32`) also
differs from current source (`256`).

**Correction:** retain v1 as legacy evidence, inventory/classify records and
dependent URLs, and never infer live behavior from current source alone.

### 6. Shared topics are not shared schemas

**Challenge:** a universal TAGDEF can name `GameRelease`, but it does not define
canonical fields, connect to EAS's registered schema/resolver, enumerate
admitted records, or distinguish shape validity from endorsement.

**Correction:** the schema trace now separates portable Type/Shape identity,
origin-scoped physical EAS schema reference, identified read-only validator,
realm-local admission policy, record identity, and origin-scoped receipt;
records-by-known-type and validation grades are release gates.

### 7. Specialized physical schemas may still be useful

**Challenge:** forcing every semantic role through one Solidity payload can
increase gas and resolver complexity. Conversely, keeping every v1 schema as
a semantic kind defeats the bounded graph.

**Correction:** four core **semantic** roles are the public model; physical
schemas may specialize behind registry-declared canonical-source rules and one
SDK spelling. Derived projections point back to that source rather than become
a second independently authored fact.

### 8. Trust and discovery were missing from the anonymous-link story

**Challenge:** a direct game/app URL is hostile input. If it may select the
lens that authorizes itself, “anonymous one-click” becomes a security bypass.

**Correction:** a URL may pin exact content or suggest a view, but the viewer,
OS, or resource owner supplies the security/curation policy. Discovery and
submission never imply endorsement.

### 9. IDs and author timestamps are not chronology

**Challenge:** comments, feeds, edit histories, and latest receipt folds need
ordering. Portable IDs carry none; author time is untrusted.

**Correction:** EAS admission position/time is explicit realm-local evidence;
1.5 stores a semantic admission ordinal in durable state for slot resolution.
Author time remains testimony. Exact replies cite immutable objects. Any
cross-realm order is a reader policy, not 1.5 consensus.

### 10. Closure is a reusable profile, not another kernel kind

**Challenge:** Arcade packages, Nanda skills, Git bundles, and multi-file
documents all need verified byte closure. Solving each independently invites
four incompatible manifest systems.

**Correction:** reserve a generic exact-artifact/closure profile above the
four-role graph. It can be added after the ID core without expanding the
kernel kind set.

### 11. Receipt aggregation is not slot resolution

**Challenge:** grouping duplicate receipts for one assertion and choosing
among different assertions at one cardinality slot were described as one
“receipt fold,” making retry, supersession, and revocation circular.

**Correction:** lineage retries group by DataId, exact typed admissions by
RecordVersionId, and relationship retries by `SemanticEdgeId`; a stored
realm-local semantic admission ordinal plus slot revision/CAS resolves distinct
edges at a SlotId. One canonical relationship receipt controls liveness; exact
records are non-revocable. State and bodies are reconstructible from enumerable
receipt references plus pinned EAS storage without logs.

### 12. Native v2 cannot be a 1.5 launch dependency

**Challenge:** requiring unfinished native v2 to prove byte preservation before
durable 1.5 writes defeated the bridge's purpose.

**Correction:** 1.5 freezes versioned domains and a synthetic successor
coexistence adapter now. Future v2 may preserve IDs natively or expose the
immutable 1.5 namespace as legacy; it may never reinterpret them.

### 13. Stable object, exact record, and schema admission were conflated

**Challenge:** “Record/ObjectId,” shared resolver policy, and BindingVersionId
mixed stable lineage, exact revision, deterministic validation, stateful venue
policy, and per-record outcome.

**Correction:** DataId is the stable author-qualified lineage. Exact
RecordVersionId commits DataId, TypeId, ShapeId, and canonical body. TypeId,
ShapeId, ValidatorId, AdmissionPolicyId, BindingVersionId, first-pair
BindingRecordEvidence, and per-receipt ReceiptEvidence remain separate. Every
physical schema uses one immutable shared router/registry-index; bounded binding
modules cannot author core state.

### 14. Arcade needs three identities, not “GameId”

**Challenge:** publisher-qualified creative work, exact release, and
chain-independent byte closure can diverge. A curator slug cannot be all three.

**Correction:** GameProject/Work, GameRelease, and `ArtifactManifest/1` are
distinct. Curators choose moving views. A mirror claim binds locator plus exact
digest; intake and strict readers verify bytes because an on-chain resolver
cannot fetch the locator. Differing upstream versions are provenance.

### 15. Arcade policy was leaking into the kernel

**Challenge:** GameProject/Release shapes, `/Arcade/` slugs, mirror/provenance,
runner capabilities, and official curator choices were worded as EFS 1.5 core
requirements.

**Correction:** those are an Arcade portable profile and deployment. Core 1.5
ends at generic IDs/principals, four graph folds, type/shape/binding admission,
bounded honest indexes, retry/no-resurrection, and successor coexistence.
TypeDescriptors may declare a hard-bounded set of typed EFS-object references
with paginated reverse indexes; a new app must use that seam without a contract
upgrade rather than gaining an app-specific kernel kind.

### 16. EAS schema registration does not enforce the 1.5 payload contract

**Challenge:** EAS permits per-request revocability choices, its schema string
does not canonicalize ABI bytes, and the pinned 1.7.1
`isAttestationValid(uid)` existence answer omits revocation/expiry.

**Correction:** the 1.5 profile freezes per-role revocability, rejects all MVP
expiry, and restricts EAS-ABI/1 to exact-length canonical static scalar payloads;
dynamic values wait for a successor codec. It folds native revocation/expiry explicitly. TAGDEF includes raw restricted-ASCII bytes
so the shared registry validates and reconstructs names on chain.

### 17. “The router recomputes TypeId” was not yet implementable

**Challenge:** TypeId, ShapeId, and BindingVersionId had no exact preimages;
the prefix schema had no byte-exact field spelling; and a closure could not
supply the field/type/reference data an on-chain router needs. FieldRoleId also
created a cycle if placed inside its own TypeId input.

**Correction:** [[efs-id-1-candidate]] now gives one bounded canonical
`TypeDescriptorV1` byte string that is also stored as the on-chain execution
descriptor; exact type/reference codes and name grammar; acyclic ShapeId,
TypeId, and FieldRole folds; the seven `efs`-prefixed schema fields and EAS
SchemaUID rule; exact origin/binding identities; and same-ID replay/conflict
behavior. The end-to-end smoke fixture is one real typed DATA reference rather
than an unrelated scalar field.

### 18. Binding and immutable-record “activity” were underspecified

**Challenge:** an “inactive binding” had no authority/lifecycle, module calls
had no exact ABI or bound, and calling retraction a standard relationship left
its effect on immutable RecordVersion state ambiguous.

**Correction:** bindings are permissionlessly registered, immutable,
idempotent, and never owner-deactivated; changed behavior receives a new
binding. Direct immutable modules receive an exact bounded input, fixed gas,
bounded config, exact return word, runtime-codehash check, and atomic failure
semantics. RecordVersion `realmActive` is monotone admission evidence only;
app-defined retraction/deprecation changes reader-qualified effectiveness, not
the record, type index, or backlinks.

### 19. Staticcall plus codehash does not prove deterministic validation

**Challenge:** even an immutable outer validator can read a mutable oracle or
delegate to changeable code. The router cannot mechanically prove a closed
dependency set from runtime codehash/config, so “deterministic ValidatorId”
overclaimed what permissionless EVM modules establish.

**Correction:** core codec/identity/reference checks remain deterministic.
`ValidatorId` identifies the directly called read-only module/config, while
`validatorValid` is an admission result at an explicit realm/block basis.
Stronger timeless portable validation requires audited self-contained code or
a later mechanically bounded VM/approved-code-family profile.

### 20. Publisher-qualified types still need cross-realm bootstrap

**Challenge:** requiring the publisher to call each local router made a
“universal reusable TypeId” depend on that key remaining online in every future
realm. Allowing anyone to claim a publisher would erase provenance.

**Correction:** `TypeAuthorizationV1` is one exact chain/router-independent
EIP-191 ECDSA signature over immutable descriptor bytes. Any registrar may
relay it; EOA-only authorization and key-loss/compromise are explicit 1.5 debt.
This is a narrow type-publication exception, not a portable application-record
envelope or KEL.

### 21. A normal-call policy cannot be confined to “its own state”

**Challenge:** permissionless EVM code can call and mutate downstream contracts
under whatever authority it holds. A router reentrancy guard protects core
storage but cannot prove or enforce app-side confinement.

**Correction:** the bounded stateful policy hook remains to preserve EAS-style
admission rules, but its reachable side effects are explicitly trusted/audited
binding behavior. It receives no user signing/value capability, core writes are
guarded, and all effects revert atomically if admission fails.

### 22. Reopened v2 already reused two candidate domain strings

**Challenge:** v2's draft kind-word TAGDEF and five-word SLOT formulas already
print `efs.id.tagdef.v1` and `efs.id.slot.v1`, while 1.5 deliberately uses
different layouts under those same strings. Collision resistance does not make
two incompatible formulas one versioned namespace.

**Correction:** the successor contract now names this collision explicitly.
Before either freeze, native v2 adopts the frozen 1.5 TAGDEF/SLOT formulas or
moves its incompatible drafts to new domain/profile strings.

### 23. At-least-once receipts must not rerun stateful admission

**Challenge:** keying module execution or global indexes by EAS receipt would
rerun stateful policy effects on an idempotent publish retry, while keying all
admission evidence by RecordVersion alone would hide which binding actually ran.

**Correction:** the router uses a three-level fold: global body/type/reference
indexes once per RecordVersion, validator/policy execution once per
`(BindingVersionId, RecordVersionId)`, and physical receipt provenance once per
receipt. Pair-level evaluation evidence is separate from per-receipt evidence,
so a duplicate never relabels an old result with a new block basis.

### 24. EAS carrier fields and payment behavior must be byte-exact

**Challenge:** named roles were insufficient to implement a compatible resolver,
and calling EAS callback entrypoints `nonpayable` contradicted EAS's payable
resolver ABI. TAGDEF prose also claimed a redundant hash absent from its exact
schema.

**Correction:** EAS-CARRIER/1 now freezes all four core schema strings, field
orders, exact lengths/canonicality, revocability, and zero metadata/value rules.
The resolver callbacks retain the payable EAS ABI while `isPayable() == false`,
`msg.value == 0`, and no ETH is forwarded. TAGDEF carries only the raw segment;
the router derives its hash.

## Points deliberately not “fixed” by importing v2

- No portable signed application envelope beyond the narrow immutable-type
  authorization exception, and no carrier-independent current/revocation state.
- No full KEL, native device actors, historical scopes, passkeys/PQ, or
  organizations.
- No full compiled lens architecture; only minimum read/trust honesty.
- No global-current cross-chain state.
- No private consumer drive.
- No full neutral Git forge.
- No native Arcade comment/moderation dependency.

These are not forgotten. They are named debt with pull-forward triggers in
[[requirements-and-boundaries]] and the disposition ledger.

## Residual design risks

| Risk | Required closure |
|---|---|
| Frozen ID bytes rename history | [[efs-id-1-candidate]], golden vectors, fuzzing, independent review, and a synthetic successor/coexistence test |
| Canonical path disagreement | independently review the restricted-ASCII grammar, byte cap, and URL adapter; Unicode remains display metadata |
| Duplicate receipts corrupt current state | formal receipt fold plus fork race/revocation/state-reconstruction tests |
| EAS version behavior drifts | supported-deployment/bytecode pin and conformance suite |
| “Shared schema” remains a label | end-to-end publish/reuse/admit/query/project trace |
| Arcade official identity later moves | as an Arcade deployment gate, choose stable curator principal, realm, and custody/recovery posture; require a reviewed Safe/smart account only if recovery is a launch need |
| Old v1 state is accidentally erased or misattributed | complete inventory, legacy adapter, explicit projected/re-authored/reseeded labels |
| Read APIs hide partial results | typed basis/completeness/unknown/truncation contract across contract, SDK, and client |
| 1.5 grows into unfinished v2 | enforce scope kill conditions and product claims in the main review |

## Review conclusion

No lane found a reason to abandon 1.5. All lanes rejected the “small SDK patch”
framing and converged on the same bounded architecture: new semantic IDs and
four roles over a sibling EAS profile, with explicit receipt folding,
schema/resolver preservation, honest reads, stable DataId lineages, and
body-bound immutable RecordVersion semantics.

The remaining uncertainty is a finite freeze/prototype package. It is not a
reason to reopen portable envelopes, KEL, or the entire v2 architecture for
the Arcade MVP.
