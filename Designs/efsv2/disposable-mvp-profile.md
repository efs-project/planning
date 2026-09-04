# EFS 2.0 — Disposable MVP-C0 Core/Files profile

**Status:** draft — bounded Stage B control, not a protocol or product profile
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[core-architecture-candidate]], [[hierarchical-files-and-folders]], and the [Stage A corpus](../../Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md)
**Companion:** [[mvp-c0-genesis-manifest]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-09-04

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/content #topic/read-path #topic/coherence

> **Authority boundary.** This profile exercises the already permitted
> disposable Core Stage B comparison. It does not authorize Web Client or
> product implementation, public or permanent deployment, durable user data,
> promotion, or a semantic freeze. The controlling correction is the
> [[2026-09-02-efs2-coherence-and-mvp-readiness-review-errata|coherence review
> errata]]; the review remains evidence rather than authority.

## Problem

The EFS v2 design has enough exact proposal-stage material to run a useful
Core/Files experiment, but no single document currently says which temporary
choices compose one runnable control. The result is either paralysis while
permanent bakeoffs remain open or accidental adoption because the first code
silently picks a Type model, carrier, Principal, signature ceremony, or result
vocabulary.

MVP-C0 is the smallest write-capable control that closes those experiment-only
gaps. It is deliberately namespaced and disposable. Its output is evidence for
the permanent bakeoffs, not the winner of them.

## 1. Experiment contract

### 1.1 Included

One MVP-C0 run contains:

- one fresh local EVM Realm and one atomic experimental Core;
- one synthetic bootstrap EOA represented by the B0 intrinsic account
  Principal, with relayer/payer kept separate;
- the B0 bundled Type/index-identity arm, extended inside the C0 namespace with
  the genesis-only `KIND_BINDING_SCOPE` capability required to prove complete
  directory listing;
- exact Type admission through Stage A SR-17;
- one root Directory, one namespace Plan, one content Plan, one public Mount,
  and one Route established by [[mvp-c0-genesis-manifest]];
- point lookup, bounded complete listing, exact file read, and verified byte
  range read at one committed Realm basis;
- create-empty-directory, create-small-file, and publish-file-revision, each by
  one Principal and one atomic Core transaction;
- one normal EOA `WritePlan` approval per write, one direct-EOA transaction
  fallback per write, and one bounded same-Principal session path; and
- canonical read-back plus a second implementation's state-only reconstruction
  of Types, Records, Occurrences, admissions, Bindings, scope postings, Files
  roots, and retained EOA witnesses.

The first run uses only synthetic names and bytes. A public testnet run, even a
disposable one, is a separately authorized follow-up because public state
cannot be destroyed.

### 1.2 Excluded

MVP-C0 does not include:

- Arcade or any other founding product, public corpus, steward, or brand;
- a shipped File Browser, EFS OS, Data Explorer, native mount, service worker,
  or production repository choice;
- rename, move, unlink, overwrite certification, cross-Principal atomicity, or
  `FILES_PRECONDITION_CERTIFIED`;
- cross-Realm mutation or a Commons dependency;
- managed Principals, KEL, recovery, persona linkage, account migration, or a
  claim that lost keys can be recovered;
- a permanent byte tier, custody promise, numeric file-size limit, Type/query
  identity choice, Realm venue, upgrade policy, contract topology, or release
  ABI; or
- mainnet, permanent deployment, migration, v1 compatibility, or production
  security/conformance claims.

### 1.3 Namespacing and non-adoption

Every C0-only domain string, Type name, contract name, fixture ID, generated
package, receipt, and exported manifest begins with or commits to
`efs2/mvp-c0/2026-09-03`. Each run adds a random `runId` and a source/toolchain
commitment. A value without both markers is not an MVP-C0 artifact.

No C0 Realm is upgraded in place to change semantics. A change to canonical
bytes, Type/index capability, WritePlan grammar, authority behavior, carrier,
or result interpretation creates a new `runId`, new experiment commitment,
new contracts, and new Realm. Older runs remain readable evidence and are
marked retired; they are never relabeled conformant.

## 2. Temporary control choices

| Surface | MVP-C0 control | What remains open |
|---|---|---|
| Type/query identity | Stage A B0 bundled `TypeSchemaId`, including all declared index obligations; `KIND_BINDING_SCOPE` is added to the same C0-only bundle at genesis | layered semantic Type/shape/representation/validation/QueryProfile split |
| Principal | one intrinsic bootstrap account Principal; direct EOA and bounded delegated-session verification paths for that same Principal | tagged author surface, managed Principal, succession, recovery, portable contract identity |
| Realm | fresh local EVM chain, one atomic Core, immutable for the run | venue, upgradeability, Commons, physical module split |
| Files | root Directory; one-Principal namespace/content Plans; bounded complete listing; create directory/file/revision | multi-Principal writes, certified exclusivity, rename/move/delete, private and cross-Realm mounts |
| bytes | separate state-readable small-byte carrier selected and bounded per run | production carrier mix, economic tier, permanent maximum, long-term custody |
| authorization | one composite EIP-712 `WritePlan` for the normal relayed EOA path | detachable realm-neutral authorship grammar and permanent delegation/account profile |
| results | four-outcome point law plus orthogonal qualification dimensions | product-specific presentation enums and a permanent wire ABI |

The Type/query seam stays explicit in SDK-facing data even though C0 implements
only the bundled arm:

```text
TypeProfileRef =
  BUNDLED_B0_C0 { typeSchemaId }
  | SPLIT_FUTURE { semanticTypeId, representationId, queryProfileId }
```

`SPLIT_FUTURE` is a reserved adapter shape, not a decodable C0 value and not
evidence that those identifiers have been designed. Code that assumes
`queryProfileId == typeSchemaId`, omits the discriminator, or exposes a second
mutable index identity fails the C0 seam test.

## 3. Principal honesty

The bootstrap and normal EOA arm use the Stage A intrinsic account Principal.
It requires no prior registration transaction. The Principal is the semantic
author reference; actual signer, relayer, payer, Realm, authority basis, and
verification profile remain separately inspectable. The proposal-stage source
is [Stage A's Principal/authority chapter](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md).

For the EOA arm, Core persists the exact canonical unsigned publication
statement, `WritePlan` bytes, and accepted low-s secp256k1 witness needed for a
second implementation to recover the signer. Reconstruction must independently
recompute every RecordId, the portable publication digest, EnvelopeId,
OccurrenceRefs, Realm-effects digest, and outer typed-data digest; recover the
EOA; derive the account Principal; and compare those values with the admission
receipt. A stored `valid=true` bit or event is not sufficient.

This does not solve key loss. Until a separately reviewed managed-Principal or
account-migration profile exists, loss or theft of the EOA can strand or
capture that Principal's current Bindings. C0 uses synthetic data precisely so
that this known limitation creates no user dependency.

The session arm uses that same bootstrap Principal with the distinct retained
delegation basis in §4.3. It does not introduce a contract-account Principal.
For future contract-account comparisons, retained call bytes and the historical
authority/code basis show what Core accepted, but a later reader cannot replay a time-varying
ERC-1271 verdict as timeless authorship. Such evidence is labelled
Realm-and-basis-qualified. C0 never promotes it to detachable portable proof.

## 4. One-approval write law

### 4.1 One composite approval and publication identity

After explicitly recorded connection/network setup, the normal EOA path
presents exactly one routine wallet approval: one EIP-712 signature
over `WritePlan/1`. A relayer or other payer submits the resulting transaction;
the EOA is not then asked to approve a second transaction.

MVP-C0 reuses the exact unsigned Stage A `PublicationEnvelope/1` field layout,
RecordId vector rule, EnvelopeId formula, and Occurrence mapping. It does not
mint a parallel content identity. The canonical unsigned statement and its
portable digest are:

```text
PublicationEnvelope/1 unsigned fields, in order:
  profile       uint16   = 1
  principalId   bytes32
  authorityRef  bytes32  = 0
  authEpoch     uint64   = 0
  pubNonce      bytes32
  notAfter      uint64
  recordIds     bytes32[]

DS_ENV = keccak256(abi.encode(
  keccak256("EIP712Domain(string name,string version)"),
  keccak256("EFS2-Envelope"), keccak256("1")))
ENVELOPE_TYPESTRING =
  "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
ENVELOPE_TYPEHASH = keccak256(bytes(ENVELOPE_TYPESTRING))
recordIdsHash = keccak256(abi.encodePacked(recordIds))
publicationStatementPreimage = abi.encode(
  ENVELOPE_TYPEHASH, profile, principalId, authorityRef, authEpoch,
  pubNonce, notAfter, recordIdsHash)
publicationStructHash = keccak256(publicationStatementPreimage)
publicationDigest = keccak256(
  0x1901 || DS_ENV || publicationStructHash)

DOM_ENVELOPE = keccak256("efs2/envelope/1")
EnvelopeId = keccak256(abi.encode(DOM_ENVELOPE, publicationDigest))
OccurrenceRef(i) = (EnvelopeId, uint16(i))
DOM_OCCURRENCE = keccak256("efs2/occurrence/1")
OccurrenceKey(i) = keccak256(abi.encode(
  DOM_OCCURRENCE, EnvelopeId, uint256(i)))
```

`recordIds` is the full ordered vector with `1 <= length <= 64`; selected
inline bodies must independently recompute their positional RecordIds. Witness,
Realm, selected mask, carrier, and transaction bytes never enter EnvelopeId.
The portable `publicationDigest` is therefore byte-for-byte the Stage A
`eip712EnvelopeDigest`, and the resulting EnvelopeId and OccurrenceRefs are
Stage-A-compatible identities.

The witness profile is intentionally different. C0 does **not** attach a
chain-free EOA signature directly to `publicationDigest`. Instead the one
Realm-bound WritePlan signature contains that digest. `c0ProfileId` is derived
from the final, post-deployment commitment defined by
[[mvp-c0-genesis-manifest#1. Roles and immutable inputs]]:

```text
DOM_C0_PROFILE = keccak256("efs2/mvp-c0/profile/1")
c0ProfileId = keccak256(abi.encode(
  DOM_C0_PROFILE, experimentCommitment))
```

`c0ProfileId` is neither the unsigned envelope's `profile=1` field nor Core's
Stage A-derived `coreProfileId`. The typed WritePlan commits to two separately
recomputable meanings:

```text
ExpectedRevision/1 {
  leafIndex  uint16
  revision   uint32
}

EXPECTED_REVISION_TYPESTRING =
  "ExpectedRevision(uint16 leafIndex,uint32 revision)"
EXPECTED_REVISION_TYPEHASH =
  keccak256(bytes(EXPECTED_REVISION_TYPESTRING))
expectedRevisionsHash = keccak256(concat(
  keccak256(abi.encode(
    EXPECTED_REVISION_TYPEHASH, item.leafIndex, item.revision))
  for item in strictly increasing leafIndex order))

C0RealmEffects/1 {
  realmId                bytes32
  core                   address
  routeConfigId          bytes32
  genesisReceiptHash     bytes32
  operationKind          uint8
  envelopeId             bytes32
  leafMask               uint64
  expectedRevisionsHash  bytes32
  stateByteStore         address
  byteCommitment         bytes32
}

REALM_EFFECTS_TYPESTRING =
  "C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)"
REALM_EFFECTS_TYPEHASH = keccak256(bytes(REALM_EFFECTS_TYPESTRING))
realmEffectsDigest = keccak256(abi.encode(
  REALM_EFFECTS_TYPEHASH, realmId, core, routeConfigId, genesisReceiptHash,
  operationKind, envelopeId, leafMask, expectedRevisionsHash, stateByteStore,
  byteCommitment))

WritePlan/1 {
  c0ProfileId          bytes32
  publicationDigest   bytes32
  realmId              bytes32
  realmEffectsDigest  bytes32
  executor             address
  executorCodeHash     bytes32
  nonceKey             uint192
  nonceSeq             uint64
  notAfter             uint64
}

EIP712Domain {
  name              = "EFS2-MVP-C0-WritePlan"
  version           = "1"
  chainId           = selected C0 chain
  verifyingContract = selected C0 Core
}

WRITE_DOMAIN_TYPESTRING =
  "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
WRITE_DOMAIN_TYPEHASH = keccak256(bytes(WRITE_DOMAIN_TYPESTRING))
domainSeparator = keccak256(abi.encode(
  WRITE_DOMAIN_TYPEHASH,
  keccak256("EFS2-MVP-C0-WritePlan"), keccak256("1"),
  chainId, verifyingContract))

WRITE_PLAN_TYPESTRING =
  "WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)"
WRITE_PLAN_TYPEHASH = keccak256(bytes(WRITE_PLAN_TYPESTRING))
writePlanStructHash = keccak256(abi.encode(
  WRITE_PLAN_TYPEHASH, c0ProfileId, publicationDigest, realmId,
  realmEffectsDigest, executor, executorCodeHash,
  nonceKey, nonceSeq, notAfter))
writePlanDigest = keccak256(0x1901 || domainSeparator || writePlanStructHash)
```

Every declared `C0RealmEffects` and `WritePlan` field appears exactly once and
in the same order in its type string and hash preimage. The
`realmEffectsDigest` binds only its declared fields. Executor/code hash, nonce
lane, expiry, `c0ProfileId`, and `publicationDigest` are bound by the outer
`WritePlan`; prose must not attribute them to the sub-digest.

`operationKind` is closed for C0:

```text
1 = ADMIT_TYPE_GROUP
2 = CREATE_DIRECTORY
3 = ADMIT_RESOLUTION_PLANS
4 = ADMIT_MOUNT_CONFIG
5 = ADMIT_MOUNT
6 = ADMIT_ROUTE_CONFIG
7 = ADMIT_BOOTSTRAP_SEAL
8 = CREATE_SMALL_FILE
9 = PUBLISH_FILE_REVISION
```

Zero and all other values reject. Kinds 1 and 3–6 are legal only before the
bootstrap seal; kind 7 is legal exactly once; kinds 2, 8, and 9 are the runtime
Files subset. `routeConfigId` is exactly zero for pre-Route bootstrap kinds
1–6, and it is the manifest-pinned nonzero Route for the seal and every later
write. `genesisReceiptHash` is exactly zero for every bootstrap write through
the seal and is the persisted nonzero G12 receipt hash for every runtime write.
`stateByteStore` is always the manifest-pinned carrier. The byte commitment is
nonzero only for the two byte-writing kinds and exactly zero for the others.
`expectedRevisionsHash` commits the strictly ordered CAS vector, including the
hash of the empty byte string when no item applies.

`publicationDigest` commits the exact unsigned Principal, publication fields,
and ordered Record leaves. `realmEffectsDigest` commits exactly the Realm,
Core, Route, genesis receipt, operation kind, derived EnvelopeId, selected
leaves, expected Binding revisions, byte store, and byte commitment. The outer
WritePlan additionally commits the C0 profile, publication digest,
executor/code hash, nonce lane, and expiry. Core recomputes all three preimages
before mutation; omission, reordering, substitution, expiry, wrong
executor/code, stale CAS, wrong genesis receipt, or a different byte
commitment reverts the whole call.

For the normal EOA arm, C0's sole write entrypoint verifies the composite
witness in this order:

1. decode the exact unsigned `PublicationEnvelope/1` fields and selected inline
   bodies; recompute every carried RecordId, `publicationDigest`, EnvelopeId,
   and selected OccurrenceRef;
2. require `plan.realmId == effects.realmId == Core.realmId`,
   `effects.core == verifyingContract == address(Core)`,
   `plan.publicationDigest == publicationDigest`,
   `publication.notAfter == plan.notAfter`,
   `effects.envelopeId == EnvelopeId`, a nonzero in-range `leafMask`, the
   correct Route/genesis-receipt rule for the operation kind, and the exact SR-3
   `expectedRevisionsHash` for all selected CAS-bearing leaves;
3. recompute `c0ProfileId` from Core's persisted final
   `experimentCommitment`, then recompute `realmEffectsDigest` and
   `writePlanDigest` field-for-field;
4. enforce canonical 65-byte secp256k1 encoding, low-s, valid v, nonzero
   recovery, and recover the EOA from `writePlanDigest`; and
5. require that EOA to equal the address encoded by the declared intrinsic
   account Principal before persisting the exact unsigned envelope, WritePlan,
   witness, and `C0_COMPOSITE_EOA_V1` authority basis with each fresh
   Occurrence's admission receipt.

The mapping from `(EnvelopeId, leafIndex)` to RecordId, Principal, status, and
admission ordinal remains the Stage A mapping. What varies is the verifier
input: Stage A's `AuthorityVerifierV1.verify(principal,
eip712EnvelopeDigest,envelopeWitness,...)` expects a direct chain-free envelope
witness; C0 verifies `writePlanDigest` and records the explicit composite
basis. Therefore C0 structurally reuses SR-17's ordinary Record admission and
atomic Type-cache materialization through a `publishWithPlanC0` variant, but it
does not call the composite witness a Stage A envelope witness or claim Stage A
witness compatibility.

One signature therefore approves both the publication and its exact local
effects without collapsing their meanings. Because the EIP-712 domain is
Realm/chain/Core-bound, this arm does **not** claim an independently detachable
realm-neutral authorship signature. That stronger property requires either:

1. an additional author signature over the realm-neutral publication digest;
   or
2. a prior bounded delegation whose signed scope explicitly authorizes the
   publication profile.

Neither is smuggled into the one-prompt claim. Section 4.3 exercises bounded
delegation only for Realm-bound C0 WritePlans; it does not establish the
stronger detachable-authorship property or a permanent delegation design.

### 4.2 Separate meanings and receipts

The SDK and any Inspector preserve these stages separately:

| Evidence | Means | Does not mean |
|---|---|---|
| authorship/publication receipt | the signer approved the exact publication digest as part of this composite C0 plan | detachable realm-neutral authorship |
| authorization receipt | Core accepted the WritePlan witness for the exact Realm effects under the named authority basis | transaction inclusion, effect, or finality |
| submission receipt | one transaction/user-operation was submitted by the named payer through the named transport | EFS admission or canonical state |
| EVM transaction receipt | that transaction executed or reverted at one chain basis | canonical IDs/read results, byte availability, or finality |
| admission/effect receipts | Core committed the selected Occurrences and exact Binding/index effects atomically | verified external bytes or product success |
| canonical read-back | an independent read recomputed IDs and observed the expected post-state at a committed basis | permanence, global currentness, or future availability |

The operation is reported successful only after canonical read-back agrees with
the plan and admission/effect receipts. Wallet acknowledgement, signature
creation, a relay job ID, transaction hash, and even a successful transaction
receipt are earlier evidence states, not canonical EFS success.

### 4.3 Same-Principal delegated-session path

The bootstrap EOA approves one bounded, revocable C0 session grant for its
existing `bootstrapPrincipalId`. This is an explicit alternative verification
path, not a new smart-account Principal. G7's immutable namespace/content
Plans, their sole Principal, the File Object, and the existing file-head
Binding author/key identity stay unchanged; only the authorized actual signer
differs. A revision advances the same head by ordinary CAS, not a new signer's
head or a widened/replaced Plan.

The run-frozen C0 grant codec/domain and verification rules are committed with
the experiment's source/Codex inputs before genesis; this is no permanent
grant framework or additional Files mutation kind. After runtime activation,
the EOA signs the exact grant digest, Core independently recovers the
bootstrap EOA before registering it, and independent read-back verifies the
grant's exact bytes, approval witness, registration receipt, and state basis.
Replaying registration cannot reset consumed budgets/nonces or revive a
revoked grant.
The grant binds at least:

- run/C0 profile, unsigned publication profile, chain/Realm, Core,
  executor/code hash, and session public key;
- allowed operation kinds: create directory, create small file, publish
  revision;
- allowed root/Route and the exact `bootstrapPrincipalId`;
- per-operation and aggregate byte/value/gas ceilings;
- grant identifier, nonce domain, expiry, and a state-readable revocation
  location controlled only by the bootstrap EOA; and
- whether a relayer or paymaster may submit.

For C0, the signed `WritePlan.nonceKey` selects exactly one session grant.
Normal composite-EOA and direct-EOA writes use lane zero; session grants bind
a nonzero `uint192 nonceKey` in their EOA-approved bytes. Registration records
the immutable mapping `(bootstrapPrincipalId, nonceKey) -> grantId` and rejects
any collision with a different grant, including revoked or expired grants.
The mapping is retained and the lane is never recycled. It is not a truncated
hash-to-lane convention. The grant's own identifier is derived by its committed
run codec without including a self-referential identifier field in its preimage.

A session write must match both the exact registered grant and its signed
nonce lane. Two grants for the same session key therefore cannot authorize
the same signed plan interchangeably. Substituting a grant, including after
revocation of the original, rejects before any nonce, budget or Files mutation.
Registration replay cannot change this mapping or reset consumption. Retained
authority evidence includes this mapping at admission, so later revocation or
another grant never reinterprets an earlier write. This narrows the C0 nonce
lane rules without changing the `WritePlan/1` field list or granting detachable
realm-neutral authorship.

For a delegated write, Core performs §4.1 steps 1–3 unchanged, then verifies
the canonical low-s session signature over that exact `writePlanDigest`
against the public key named by the registered grant. This replaces the
normal EOA steps 4–5: the session key does **not** pass direct EOA recovery
equality with the Principal. Core instead verifies the retained EOA grant
approval and its same-Principal scope, membership of the target under the
granted root/Route, all publication/effect/operation constraints, nonce,
expiry, executor/code, revocation, and remaining per-operation/aggregate
byte/value/gas budgets at admission. Nonce and budget consumption commit
atomically with the write or revert with it.

Each fresh Occurrence retains the unsigned envelope, WritePlan, exact grant
and EOA approval witness, session signature, actual signer, and
`C0_DELEGATED_SESSION_V1` authority/witness basis. That basis includes the
state-readable grant/revocation/budget evidence and admission basis needed
for a second reader to recompute authorization independently, not a stored
`valid=true` verdict or a later live grant check. The envelope's
`principalId=bootstrapPrincipalId`, `authorityRef=0`, `authEpoch=0` and ordinary
Envelope/Occurrence identity rules remain unchanged; the grant linkage lives
in the explicitly distinct C0 witness/receipt, not a replacement author ID.
The normal `C0_COMPOSITE_EOA_V1` branch remains unchanged.

After that grant is canonical and independently read back, the session key may
sign routine WritePlans without a wallet prompt. The target is zero routine
wallet prompts, not zero signatures, zero policy checks, or zero receipts. The
client rechecks expiry, revocation, scope, executor code, and ceilings before
each signature and Core checks them again. A wallet acknowledgement or bundler
receipt never substitutes for canonical read-back.

If the grant is missing, expired, revoked, over budget, or unavailable at the
required basis, the client returns `UNKNOWN` or a typed authorization failure;
it does not silently fall back to a broader wallet permission. Core rejects
any unproved check without mutation. Revocation bars later writes; it never
rewrites already admitted revision history or retroactively invalidates the
authority proved at an earlier admission basis.

Connection/network setup, grant approval/registration, and revocation have
separate complete provider/prompt totals linked to each dependent operation,
plus full first-use/lifecycle totals as required by
[[../web-client-os/mvp0-acceptance#Setup and full first-use accounting]].
This same-Principal session control is not proof of arbitrary real smart-wallet
interoperability, full AA, recovery, or detached realm-neutral authorship.

### 4.4 Direct EOA fallback

When relaying or typed-data support is unavailable, the same EOA may call the
C0 Core directly in one transaction prompt. Calldata contains the exact
publication and Realm-effect plan; Core requires `msg.sender` to derive the
named account Principal and applies the same validation, CAS, atomicity, and
read-back rules.

This is a different and weaker authorship evidence profile. The EVM transaction
signature proves a chain-local transaction sender, while Core state records
the resulting Realm-qualified admission; it does not retain a separate
portable publication signature. The UI and receipt say
`DIRECT_EOA_TRANSACTION_AUTHORSHIP`, never `PORTABLE_AUTHORSHIP`. The fallback
must not first ask for a WritePlan signature and then ask for a transaction;
that would violate the one-prompt target.

## 5. State-readable small-byte carrier

C0 deploys a separate `MvpC0StateByteStore`, not a new File or Record identity.
It accepts exact bytes, checks the committed `ChunkTree/1`/digest, and exposes
bounded `read` and `readRange` from current contract state. Reconstruction uses
state/code and proofs, never old calldata, logs, a gateway database, or an
operator's private cache. This instantiates the optional
[Stage A byte-store seam](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md#11-the-venue-byte-store-seam-sketch-only--not-part-of-b0-core)
only inside the C0 namespace.

The identities remain distinct:

```text
File Object         stable logical file
FileRevision        immutable selected generation
ChunkTree/digest    exact byte identity and range geometry
carrier handle      where this run stored those bytes
Locator             authored claim connecting retrieval to the carrier
availability        observed ability to obtain bytes at a basis
integrity           independent digest/tree/proof verdict for obtained bytes
```

Finding a File or Locator does not imply available bytes. Missing carrier data
is `availability=UNAVAILABLE` and `bytes=NOT_RETURNED` (or `UNKNOWN` on either
axis), never `ABSENT_PROVEN` for the File. Bytes that can be read but do not
match the selected digest/tree are `availability=AVAILABLE`, `bytes=RETURNED`,
and `integrity=FAILED`; they are never upgraded to verified bytes. The carrier
address/code hash and exact capability are committed by the run manifest and
Route evidence; the carrier never becomes a hidden singleton.

There is no permanent numeric file cap. Each run measures candidate sizes and
records `maxStateFileBytes` and `maxReadRangeBytes` in its immutable experiment
parameters. The contract enforces those run-local values. The selected size is
the largest tested candidate that satisfies the declared transaction-gas,
state-growth, cold-read, proof, and client-memory margins. Changing it creates
a new run/profile commitment; C0 evidence cannot be quoted as a protocol limit.

## 6. Canonical point-result law

Every C0 point read returns exactly one top-level outcome:

```text
FOUND | ABSENT_PROVEN | UNKNOWN | CONFLICT
```

This contracts the proposal-stage
[B0 Lens outcomes](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md)
without discarding their fail-closed basis and completeness discipline.

It also returns orthogonal qualification dimensions; they are never folded
into the outcome or into one `ok` bit:

```text
PointResult<T> {
  outcome
  value?        // present only for FOUND
  domain        // exact Realm, query/profile, subject and key
  basis         // block hash/state root/Realm revision/admission high
  coverage      // COMPLETE | PARTIAL | UNKNOWN
  support       // SUPPORTED | UNSUPPORTED | UNKNOWN
  validation    // VALID | INVALID | UNKNOWN
  authority     // AUTHORIZED_AT_BASIS | UNAUTHORIZED_PROVEN |
                // UNKNOWN | NOT_APPLICABLE
  currentness   // CURRENT_AT_BASIS | HISTORICAL | SUPERSEDED |
                // UNKNOWN | NOT_APPLICABLE
  finality      // FINAL | UNFINALIZED | UNKNOWN | NOT_APPLICABLE
  integrity     // VERIFIED | FAILED | UNKNOWN | NOT_APPLICABLE
  availability  // AVAILABLE | UNAVAILABLE | UNKNOWN | NOT_APPLICABLE
  bytes         // RETURNED | NOT_RETURNED | UNKNOWN | NOT_APPLICABLE
  effect        // COMMITTED | NOT_COMMITTED_PROVEN | UNKNOWN |
                // NOT_APPLICABLE
  evidenceCommitment
  reasonCode?
}
```

`validation` is Type/profile and semantic validation; `integrity` is exact
digest/tree/proof verification. `availability=AVAILABLE` says bytes were
obtainable at the named observation basis, while `bytes=RETURNED` says this
response carries them. Neither implies `integrity=VERIFIED`: obtained bytes may
fail their committed digest. Authority, currentness, finality, integrity, and
availability are independent claims and retain their own basis/evidence.

Write-journey progress is not canonical effect. It remains in separate
receipts with a stage such as:

```text
OperationStage =
  PLANNED | AUTHORIZED | SUBMITTED | INCLUDED |
  REVERTED | READ_BACK_VERIFIED | UNKNOWN
```

`effect=COMMITTED` requires canonical read-back of the exact planned effects at
the named basis. A proved revert or proved unchanged relevant state may support
`NOT_COMMITTED_PROVEN`. A wallet acknowledgement, authorization receipt,
submission ID, pending transaction, or transaction receipt changes an
operation stage but never by itself changes canonical effect from `UNKNOWN`.

Rules:

1. `FOUND` means one value is selected under the named point rule at the exact
   basis. It does not imply authority, currentness elsewhere, finality,
   integrity, availability, returned bytes, or committed write effect.
2. `ABSENT_PROVEN` requires supported and valid evaluation over complete
   coverage of the whole named domain at the committed basis.
3. `UNKNOWN` covers unavailable basis/evidence, incomplete coverage,
   unsupported profile, indeterminate validation, resource exhaustion, and
   unavailable required authority history. It never falls through to a lower
   source or becomes absence.
4. `CONFLICT` preserves incompatible values/evidence that the named rule cannot
   lawfully collapse. It never becomes either value or absence.
5. A merged result is `ABSENT_PROVEN` only when **every** input is
   `ABSENT_PROVEN`, complete, supported, and valid for the **same committed
   basis and domain**. Any basis/domain mismatch, `PARTIAL`, `UNKNOWN`, invalid
   input, or unsupported input makes the merged result `UNKNOWN`; any material
   unresolved disagreement is `CONFLICT`.
6. An empty page, zero value, missing RPC response, missing Locator, or failed
   provider is not proof of absence.

Files-specific states such as not-a-directory, malformed selected evidence,
masked, resource limit, or byte-integrity failure remain typed reason/effect/
validation/bytes detail around this point law. They do not grow a second
competing universal point-outcome enum.

## 7. Stop and destruction rules

Stop the run before further writes if any of these occurs:

- independent code computes a different Type, Record, Envelope, Principal,
  WritePlan, Realm, receipt, File, Plan, Mount, Route, or post-state digest;
- a point or merged read turns incomplete/unavailable evidence into absence;
- Type or index admission can occur outside the committed C0 bundle, or a
  writer can bypass mandatory indexing;
- `BindingScope` was not active before the first Files Binding;
- a routine normal EOA or direct fallback needs more than one user prompt,
  or setup/revocation calls or prompts are omitted from the linked totals;
- a session write escapes its grant, continues after revocation/expiry, or is
  reported successful before canonical read-back;
- EOA witness reconstruction depends on logs, historical calldata, or trust in
  Core's stored verdict;
- carrier reads cannot be verified from state or conflate availability with
  File identity; or
- the measured gas/state/read budget has no bounded passing file size.

On stop or completion:

1. disable the run in every client/SDK manifest and mark its RealmId retired;
2. revoke every session grant and stop relayers/paymasters;
3. retain exact non-secret source refs, toolchains, manifests, vectors,
   receipts, measurements, and falsification evidence;
4. delete disposable local keys, funded-account secrets, local chain state,
   caches, gateways, and deployments that are actually erasable; and
5. state explicitly that public-chain bytes, if a later authorized testnet run
   occurs, cannot be destroyed by this procedure. `SELFDESTRUCT`, endpoint
   shutdown, or lost keys are never described as chain-data erasure.

No run becomes a default, dependency, seed, or production migration source
merely because it passed.

## Open questions

- [ ] **Evidence gate:** run the declared byte-size/gas/state/read sweep and
  record the selected per-run caps before a valid genesis manifest is sealed.
- [ ] **Evidence gate:** independently implement the composite WritePlan digest,
  direct fallback, retained EOA witness verification, and revocable session
  path; stop on any divergent digest or prompt count.
- [ ] **Evidence gate:** prove complete listing from genesis-time
  `BindingScope`; if it fails, relabel listing `PARTIAL` and do not substitute a
  hosted index.
- [ ] **Evidence gate:** complete the state-only second-reader reconstruction
  and Realm-retirement drill before C0 evidence can inform a permanent design.

No permanent Type/query-axis answer, carrier limit, Principal model, product
choice, or freeze decision is required merely to run these gates.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies accepted or landed
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

MVP-C0 is disposable Stage B evidence. Use a new isolated implementation
worktree and local Realm per semantic revision. The future SDK and File Browser
acceptance overlay consume this profile but do not inherit implementation
authorization from it.
