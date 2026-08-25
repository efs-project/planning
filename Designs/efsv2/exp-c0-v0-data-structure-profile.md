# EXP-C0/v0 — disposable data-structure profile

**Status:** draft — exact disposable experiment profile; **NON-DURABLE** and **NON-CONFORMANT**
**Target repos:** planning, disposable experiments
**Depends on:** [[v2-contract-readiness-program]], [[core-architecture-candidate]], [[layered-type-system-and-data-abi]], [[../../Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README|EXP-C0 semantic trace seal]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #topic/efsv2 #topic/readiness

## Purpose and authority boundary

This packet selects one small, exact **candidate** representation for the sealed
`EXP-C0` micro-Realm. It is sufficient for one independent pure model and one
monolithic disposable Solidity SUT to consume identical inputs and compare
identical state/projection roots. It is neither a protocol specification nor an
owner ruling. Nothing here authorizes production contracts, permanent data,
deployment, a Commons venue, or `GO-CODE`.

The semantic trace seal remains authoritative for transition meaning and
qualified outcomes. This profile only replaces its symbolic field shapes with a
candidate structure surface. [[exp-c0-v0-codec-domain-bounds-vector-contract]]
owns wire bytes, IDs, bounds, errors, and vectors; [[exp-c0-v0-result-api-profile]]
owns read/result projection.

## Common conventions

- `Id` is a `bytes32` defined by the exact domain/preimage registry. Every
  structure is encoded as its declared Solidity ABI-v2 tuple with `abi.encode`;
  `uN` therefore means `uintN` (not a packed integer). `Hash` is `bytes32`,
  `Bytes` is `bytes`, and `Address` is `address`.
- Every stored value is immutable except an explicitly named append-only or
  CAS-only collection. No log, transaction receipt, cache, indexer, wallet,
  Commons service, or manually supplied module list is state.
- An implementation must retain canonical bytes for every `TypeSchemaEnvelope`,
  `Record`, `PublicationSet`, Principal, verifier profile, witness, Plan,
  receipt, QueryProfile, ResolutionPlan, and Realm interpretation descriptor
  named below. It must not reconstruct an old value from a current policy,
  account code, mutable name, or orphan hash commitment.

## Portable artifacts

```text
TypeSchemaEnvelope {
  codecVersion: u16
  payloadBytes: Bytes
}

TypeSchemaPayloadV0 {
  semanticCommitment: Bytes[1..512]
  shape: ShapeV0
  representation: RepresentationV0
  intrinsicConstraints: ConstraintV0[0..8]
  referenceRoles: ReferenceRoleV0[0..8]
}

ShapeV0 {
  fields: FieldV0[1..16]                 // strictly ascending fieldKey
}
FieldV0 {
  fieldKey: u16                           // nonzero, unique, no reserved key
  scalarKind: U64 | BOOL | BYTES | RECORD_ID
  required: bool
  maxLengthOrCount: u16                   // 0 for fixed scalar
}
RepresentationV0 { fieldOrder: FIELD_KEY_ASC; encoding: ABI_TUPLE_V0 }
ConstraintV0 { fieldKey: u16; rule: REQUIRED | MAX_BYTES | MAX_LIST }
ReferenceRoleV0 {
  fieldKey: u16
  targetKind: EXACT_TYPE_RECORD | SELF_TYPE_RECORD
  targetTypeSchemaId: TypeSchemaId         // nonzero only for EXACT_TYPE_RECORD
}

Record {
  typeSchemaId: TypeSchemaId
  canonicalBody: Bytes[0..4096]
}

PublicationSet {
  semanticAuthor: PrincipalId
  sourcePublicationActor: PrincipalId
  sourceAuthorityProfileId: VerifierProfileId
  sourceAuthorityEpoch: u32
  nonceLane: u32
  nonce: u64
  expiryCoordinate: u64
  visibility: PUBLIC
  suites: u8 = 1
  leaves: RecordId[1..2]                  // ordered; duplicate leaves rejected
}

Occurrence { publicationSetId: PublicationSetId; leafIndex: u16 }

SourceWitnessSidecar {
  publicationSetId: PublicationSetId
  signer: PrincipalId
  verifierProfileId: VerifierProfileId
  signedDigest: Hash
  signature: Bytes[1..256]
}
```

The exact Type wire and kind-3 projection value are the complete canonical
`abi.encode(uint16 codecVersion, bytes payloadBytes)` envelope bytes. Codec 0
defines `payloadBytes = abi.encode(TypeSchemaPayloadV0)`; the codec coordinate
is not repeated inside that payload. Readers canonicalize the bounded outer
envelope before codec dispatch. A canonical unknown codec remains identifiable
and byte-for-byte retainable, but its support is `UNSUPPORTED`, validation is
`UNPROVEN`, and semantic reconstruction is `INCOMPLETE`. C0/v0 never decodes
such bytes as codec 0 and rejects their admission with zero effect.

### Exact `ABI_TUPLE_V0` body mapping

`ABI_TUPLE_V0` is generated mechanically from `ShapeV0.fields` in ascending
`fieldKey` order. It is not a Type-author-supplied Solidity type string:

| `scalarKind` | Required component | Optional component |
|---|---|---|
| `U64` | `uint64` | `(bool present, uint64 value)` |
| `BOOL` | `bool` | `(bool present, bool value)` |
| `BYTES` | `bytes` | `(bool present, bytes value)` |
| `RECORD_ID` | `bytes32` | `(bool present, bytes32 value)` |

`Record.canonicalBody` is `abi.encode` of those components as one tuple in that
order. The portable interpreter derives the component layout from the exact
Type, ABI-decodes, and ABI-reencodes byte-for-byte before applying semantic
checks. This rejects noncanonical offsets, aliasing, padding, or trailing bytes.
An absent optional has `present=false` and the zero/empty ABI value; a present
optional may legitimately contain zero, `false`, or empty bytes. Required
`BYTES` may also be empty when its constraints permit it.

For `U64`, `BOOL`, and `RECORD_ID`, `maxLengthOrCount` must be zero. For
`BYTES`, it is the inclusive byte cap and cannot exceed the profile's 4,096-byte
body cap. `MAX_BYTES` may target only `BYTES`. `REQUIRED` is reserved and
unsupported because `FieldV0.required` already owns that law; `MAX_LIST` is
reserved and unsupported because C0/v0 has no list scalar. This prevents two
different descriptors from expressing the same accepted-value set through a
redundant constraint. Unknown scalars, representations, constraints, roles,
duplicate or reserved field keys, unsorted fields, and inconsistent redundant
constraints reject rather than being ignored.

Reference extraction happens only after canonical structural validation.
Every role field must be `RECORD_ID`. `EXACT_TYPE_RECORD` requires a nonzero
`targetTypeSchemaId`; `SELF_TYPE_RECORD` requires zero and resolves to the
containing Type. An exact role naming the containing Type is noncanonical: the
only self form is `SELF_TYPE_RECORD`. Unknown kinds, wrong zero laws, missing
target Types or Records, and target Records carrying another Type all reject.
Validation pass one independently recomputes the complete finite Type and
Record inventories; pass two decodes bodies and resolves roles, so acyclic
cross-Type forward references do not depend on input order.

`TypeSchemaPayloadV0` is a flat exact nominal Type. `semanticCommitment`, shape,
representation, intrinsic constraints, and closed roles are all identity-bearing.
No View, tag, catalog entry, Type name, callback, or index declaration changes
Type or Record identity. The only legal recursive role in this profile is
`SELF_TYPE_RECORD`. Because a Type ID commits its exact role target IDs, a fresh
A↔B exact-Type cycle requires each final ID before either descriptor can be
authored. C0/v0 has no placeholder, normalization, or group codec; mutually
recursive cross-Type groups are explicitly unsupported. Open readers, maps,
lists, and additional scalar kinds remain reopened comparison/freeze work.

The sealed `T_NOTE` fixture uses exactly two fields: `1: BYTES required max 64`
and `2: RECORD_ID optional`, with exactly one `SELF_TYPE_RECORD` role for field 2.
This is a fixture choice, not a general Type grammar adoption.

## Realm, Principals, and verifier evidence

```text
OriginLineageV0 {
  chainNamespace: Bytes[1..64]
  chainReference: Bytes[1..64]
  genesisCommitment: Hash                    // exact nonzero bytes32
}

ComponentDescriptorV0 {
  coreAddress: Address                       // nonzero
  runtimeCodeCommitment: Hash                // keccak256 of separate retained code evidence
  executionProfileCommitment: Hash
  policyCommitment: Hash
  verifierProfileId: VerifierProfileId
  dependencyCommitment: Hash
  routingCommitment: Hash
  administrationCommitment: Hash
  disclosedPowers: PowerV0[0..8]             // canonical ascending enum
}

RuntimeCodeEvidenceV0 {
  runtimeCodeBytes: Bytes[1..24576]           // launch evidence, not descriptor bytes
  runtimeCodeCommitment: Hash                 // keccak256(runtimeCodeBytes)
}

RealmBootstrap {
  originLineage: Bytes[1..320]                // exact canonical OriginLineageV0 bytes
  genesisCommitment: Hash
  coreCommitment: Hash
  initialRevisionCommitment: Hash           // RealmRevision fields excluding realmId
  initialRevisionId: RealmRevisionId
  disclosedPowers: PowerV0[0..8]          // canonical ascending enum
}

RealmRevision {
  realmId: RealmId
  generation: u32
  componentCommitment: Hash
  executionProfileId: Hash
  policyId: Hash
  verifierProfileId: VerifierProfileId
  administrationCommitment: Hash
  activationStart: u64
  activationEndExclusive: u64             // MAX_U64 while current
}

DescriptorKindV0 {
  COMPONENT | EXECUTION_PROFILE | POLICY | ADMINISTRATION
}

DescriptorArtifactV0 {
  descriptorKind: DescriptorKindV0
  canonicalDescriptor: Bytes[1..4096]
}

Principal {
  authorityKind: EOA | ERC1271
  originLineage: Bytes[0..128]            // empty for portable EOA fixture
  account: Address
}

VerifierProfile {
  profileKind: EOA_SECP256K1 | ERC1271_STATICCALL
  profileRevision: u8 = 0
  acceptedMagic: bytes4                   // ERC-1271 only; zero for EOA
  maxGas: u32                             // ERC-1271 only
  maxReturnBytes: u16                     // ERC-1271 only
}

VerifierTranscript {
  admissionId: AdmissionId
  digest: Hash
  domain: Hash
  account: Address
  signature: Bytes[1..256]
  verifierProfileId: VerifierProfileId
  codeCommitment: Hash
  dependencyCommitment: Hash
  executionCoordinate: u64
  gasLimit: u32
  returnedBytes: Bytes[0..64]
  result: AUTHORIZED | DENIED | MALFORMED | REVERTED
}
```

`OriginLineageV0` and `ComponentDescriptorV0` are exact, closed canonical
preimages: unknown object fields reject rather than disappearing during ABI
encoding. `RealmBootstrap.originLineage` retains the first preimage and
`coreCommitment` names the second through the closed COMPONENT descriptor
domain. The initial revision, launch configuration, and AdmissionPlan repeat
and cross-check the exact component, execution, policy, verifier,
administration, dependency, routing, power, Realm, and Realm-revision
coordinates. The SourceDescriptor repeats chain namespace/reference and must
match the retained OriginLineage preimage. This is topology-neutral: the
dependency/routing/administration commitments can describe a direct contract,
proxy, router, facets, or a successor topology without changing Core nouns.

Runtime bytecode is deliberately separate from `ComponentDescriptorV0`.
Launch validation proves `keccak256(runtimeCodeBytes) ==
runtimeCodeCommitment`; placing up to 24,576 runtime bytes inside the descriptor
would violate the selected 4,096-byte descriptor cap.

`PrincipalId` derives from the canonical `Principal`, never a truncated address.
The verifier is selected solely by the Plan-bound profile; `hasCode` is never a
dispatch rule. A transcript is historical evidence: later code cannot reinterpret
an admitted receipt. The two selected profiles are only the EOA and static
ERC-1271 fixture profiles; delegation, rotation, recovery, EIP-7913, and a
general signature-suite registry remain reopened.

## Plans, operations, admissions, and effects

```text
EffectV0 {
  kind: BIND | TOMBSTONE | WITHDRAW | ACTIVATE_QUERY | ADVANCE_COVERAGE
  principalId: PrincipalId                 // BIND/TOMBSTONE/WITHDRAW target
  positionKey: PositionKey                 // BIND/TOMBSTONE only
  recordId: RecordId                       // BIND only
  occurrenceId: OccurrenceId               // WITHDRAW only
  expectedRevision: u32                    // BIND/TOMBSTONE; zero means absent
  queryProfileId: QueryProfileId           // query effects only
  generation: u32                          // query effects only
  coverageHighWater: u32                   // ADVANCE_COVERAGE only
  terminalCount: u32                       // terminal advance only
  terminalPostingsRoot: Hash                // terminal advance only
}

AdmissionPlan {
  occurrenceIds: OccurrenceId[1..2]        // source PublicationSet leafIndex order
  realmId: RealmId
  realmRevisionId: RealmRevisionId
  coreCommitment: Hash
  semanticAuthor: PrincipalId
  actor: PrincipalId
  verifierProfileId: VerifierProfileId
  nonceLane: u32
  nonce: u64
  expiryCoordinate: u64
  executorCommitment: Hash
  dependencyCommitment: Hash
  payer: PrincipalId
  maximumCost: u64
  effects: EffectV0[1..4]                  // canonical by kind then target key
}

DestinationWitnessSidecar {
  admissionPlanId: AdmissionPlanId
  signer: PrincipalId
  signedDigest: Hash
  signature: Bytes[1..256]
}

Operation {
  admissionPlanId: AdmissionPlanId
  effectSetId: Hash
  outcome: COMMITTED
  executionCoordinate: u64
}

AdmissionReceipt {
  occurrenceId: OccurrenceId
  realmId: RealmId
  realmRevisionId: RealmRevisionId
  operationId: OperationId
  admissionOrdinal: u32
  admissionHighWater: u32
  policyId: Hash
  verifierProfileId: VerifierProfileId
  accepted: true
}
```

`EffectV0` is a closed tagged union, not a struct whose unused coordinates may
carry ignored data:

| Kind | Required/active coordinates | Coordinates that must be zero | `effectTargetKey` |
|---|---|---|---|
| `BIND=1` | nonzero `principalId`, `positionKey`, `recordId`; `expectedRevision` any `u32` | `occurrenceId`, `queryProfileId`, `generation`, `coverageHighWater`, `terminalCount`, `terminalPostingsRoot` | `keccak256(abi.encode(principalId, positionKey))` |
| `TOMBSTONE=2` | nonzero `principalId`, `positionKey`; `expectedRevision` any `u32` | `recordId`, `occurrenceId`, `queryProfileId`, `generation`, `coverageHighWater`, `terminalCount`, `terminalPostingsRoot` | `keccak256(abi.encode(principalId, positionKey))` |
| `WITHDRAW=3` | nonzero `principalId`, `occurrenceId` | `positionKey`, `recordId`, `expectedRevision`, `queryProfileId`, `generation`, `coverageHighWater`, `terminalCount`, `terminalPostingsRoot` | `keccak256(abi.encode(principalId, occurrenceId))` |
| `ACTIVATE_QUERY=4` | nonzero `queryProfileId`; `generation > 0` | `principalId`, `positionKey`, `recordId`, `occurrenceId`, `expectedRevision`, `coverageHighWater`, `terminalCount`, `terminalPostingsRoot` | `keccak256(abi.encode(queryProfileId, generation))` |
| `ADVANCE_COVERAGE=5` | nonzero `queryProfileId`; `generation > 0`; `coverageHighWater: u32`; a zero terminal root requires zero terminal count | `principalId`, `positionKey`, `recordId`, `occurrenceId`, `expectedRevision` | `keccak256(abi.encode(queryProfileId, generation))` |

Unknown kinds reject. Effects arrive in strictly ascending
`(kind, effectTargetKey)` order; an equal pair is a duplicate and rejects.
There is no sorting or normalization. `occurrenceIds` contains one or two
unique nonzero IDs in the source `PublicationSet`'s `leafIndex` order. Opaque
IDs must not be sorted to guess that order. Validation precedes
`AdmissionPlanId` and `EffectSetId` derivation in both controls.

An exact retry returns the existing `OperationId` only when the complete Plan
preimage matches the nonce lane binding. A distinct Plan under the same
`(RealmId, semanticAuthor, nonceLane, nonce)` is rejected. `expiryCoordinate`
is exclusive: valid iff `executionCoordinate < expiryCoordinate`.

## State collections and lifecycle

```text
types[TypeSchemaId] = exact TypeSchemaEnvelope bytes
records[RecordId] = Record
publicationSets[PublicationSetId] = PublicationSet
occurrences[OccurrenceId] = Occurrence
sourceWitnesses[SourceWitnessId] = SourceWitnessSidecar
principals[PrincipalId] = Principal
verifierProfiles[VerifierProfileId] = VerifierProfile
admissionPlans[AdmissionPlanId] = AdmissionPlan
destinationWitnesses[DestinationWitnessId] = DestinationWitnessSidecar
descriptors[(DescriptorKindV0, DescriptorCommitment)] = Bytes
noncePlans[(RealmId, PrincipalId, u32, u64)] = (AdmissionPlanId, OperationId)
operations[OperationId] = Operation
admissions[AdmissionId] = AdmissionReceipt
verifierTranscripts[AdmissionId] = VerifierTranscript
basePostings[(BaseKind, Hash, admissionOrdinal)] = (RecordId, AdmissionId)

BindingHead { revision: u32; target: RecordId | TOMBSTONE; operationId: OperationId }
bindingHeads[(PrincipalId, PositionKey)] = BindingHead       // CAS_ONLY
bindingHistory[(PrincipalId, PositionKey, revision)] = BindingHead  // append-only
bindingScopes[(PrincipalId, purpose, subject, scopeOrdinal)] = fieldRole // append-only
withdrawals[(PrincipalId, OccurrenceId)] = OperationId       // append-only
```

`purpose`, `subject`, and `fieldRole` are each full-width `bytes32` values.
`PositionKey = H(purpose, subject, fieldRole)`, `BindingKey = H(PrincipalId,
PositionKey)`, and `BindingScopeKey = H(PrincipalId, purpose, subject)` use the
registry in the codec packet. No `u16` truncation or global per-Principal scope
counter is allowed.

For a given `(PrincipalId, purpose, subject)`, its scope counter is exactly the
number of rows ever appended to that scope. The first successful transition of
one Position from `UNSET`—either first bind or first tombstone—stores its exact
`fieldRole` at the old counter ordinal and increments the counter once. Rebind,
later tombstone, retry, failed CAS, and Withdrawal append nothing. Thus a read of
all ordinals in `[0, scopeCount)` is a complete enumeration for that one
Principal/purpose/subject scope at the selected basis; another directory subject
has a different counter and cannot pollute it. Ordinals are contiguous, roles
are unique within a scope, and rows are never removed. A tombstone occupies a
scope position; Withdrawal never deletes a Record, rewinds a head, or withdraws
another issuer's Occurrence. Every rejected mutation leaves every collection,
nonce, counter, and root unchanged.

`BaseKind` is closed in C0/v0: `1 TYPE` uses `baseKey=TypeSchemaId`; `2
RECORD_REFERENCE` uses the exact typed-backlink commitment over
`(TypeSchemaId, fieldKey, targetRecordId)`; `3 AUTHOR` uses
`baseKey=PrincipalId`; and `4 DIGEST` uses the exact Record body commitment.
`DIGEST` is only canonical-body equality. The separate C0/v0
`BytesPayloadV0.expectedDigest` and Files `contentDigest` are explicitly
Keccak-256; algorithm agility requires a successor profile selected at
`GO-FREEZE`, not reinterpretation of these fields. Address,
list, redirect, range, prefix, full-text, application-specific, and untyped
backlinks are unsupported rather than silently mapped onto these four codes.

## Query, pages, and Lens inputs

```text
QueryProfile {
  typeSchemaId: TypeSchemaId
  indexes: IndexSpecV0[1..1]
}
IndexSpecV0 { kind: EXACT_BYTES_FIELD; fieldKey: u16; maxFanout: u8 = 1 }

QueryProfileActivation {
  realmId: RealmId
  queryProfileId: QueryProfileId
  realmRevisionId: RealmRevisionId
  generation: u32
  activationHighWater: u32
  historicalStart: u32 = 0
  coveredThroughHighWater: u32
  state: PENDING | ACTIVE_PARTIAL | TERMINAL_COMPLETE
  policyId: Hash
  backfillPayer: PrincipalId
  backfillConsent: Hash
  futureWriteCostRule: Hash
  maximumFanout: u8
  maximumCost: u64
  terminalCount: u32 | ABSENT
  terminalPostingsRoot: Hash | ABSENT
}

indexPostings[(QueryProfileId, generation, indexKey, postingOrdinal)] = RecordId

ResolutionPlan {
  purpose: Hash                             // full-width bytes32
  subject: Hash                             // full-width bytes32
  principals: PrincipalId[1..64]           // ordered, unique
  combiner: FIRST_FOUND_AFTER_PROVED_ABSENCE
  maximumProbes: u8                        // equals principals.length
}

RequiredPointInputV0 {
  resolutionPlanId: ResolutionPlanId
  fieldRole: Hash                            // exact nonzero full-width role
  positionKey: PositionKey
  principalIds: PrincipalId[1..64]          // exactly the Plan's ordered candidates
}

CostCommitmentV0 {
  operationId: OperationId
  payer: PrincipalId
  authorityOrConsent: Hash
  maximumCost: u64
  realizedCandidateCharge: u64
}

requiredPointInputs[(ResolutionPlanId, PositionKey)] = RequiredPointInputV0
costCommitments[OperationId] = CostCommitmentV0
```

ResolutionPlan `purpose` and `subject`, and RequiredPointInput `fieldRole`, are
nonzero full-width `bytes32`. Lens reads and test controls accept
`(resolutionPlanId, fieldRole, basis)`, reload the immutable Plan, and derive
`PositionKey(purpose, subject, fieldRole)` themselves. A caller cannot inject an
unrelated raw Position or evidence for a Principal outside that Plan.

`EXACT_BYTES_FIELD` requires the retained exact Type, a known field whose
`scalarKind=BYTES`, and a posting Record carrying that Type. Its key is
`H(D("EFS2/EXP-C0/V0/INDEX/EXACT_BYTES"), TypeSchemaId, fieldKey,
canonicalBytesValue)`. Arbitrary keys, `RECORD_ID` fields, wrong-Type Records,
or values not decoded from that Record reject. Typed parent/child discovery
remains the separate `RECORD_REFERENCE` base-posting surface.

Only a Realm-authorized operation creates or advances an activation. An empty
partial page is still partial. `TERMINAL_COMPLETE` requires the exact interval,
high-water, count, and postings root. A Lens makes only local Binding point
probes at one basis, and never runs arbitrary policy or ERC-1271 calls per
entry.

## Authoritative reconstruction projection

`ProjectionPayloadV0` is the canonical sequence, in this exact order:

1. realm bootstraps; 2. realm revisions; 3. types; 4. records;
5. publication sets; 6. occurrences; 7. source witnesses; 8. nonce plans;
9. operations; 10. admissions; 11. verifier transcripts; 12. base postings;
13. binding heads; 14. binding histories; 15. binding scopes; 16. withdrawals;
17. QueryProfile definitions; 18. activations; 19. index postings;
20. ResolutionPlans; 21. required point inputs; 22. cost commitments;
23. named counters; 24. Principals; 25. verifier profiles; 26. AdmissionPlans;
27. destination witnesses; 28. interpretation descriptors.

`ProjectionPayloadV0` is exactly `abi.encode(ProjectionEntryV0[])`.
`ProjectionEntryV0` is `(uint8 collectionKind, bytes key, bytes value)`;
`key` and `value` are the exact collection-specific `abi.encode` bytes. Entries
sort by `collectionKind`, then `keccak256(key)`, then `key`. The exact kinds are
`1 REALM_BOOTSTRAPS`, `2 REALM_REVISIONS`, `3 TYPES`, `4 RECORDS`,
`5 PUBLICATION_SETS`, `6 OCCURRENCES`, `7 SOURCE_WITNESSES`, `8 NONCE_PLANS`,
`9 OPERATIONS`, `10 ADMISSIONS`, `11 VERIFIER_TRANSCRIPTS`, `12 BASE_POSTINGS`,
`13 BINDING_HEADS`, `14 BINDING_HISTORY`, `15 BINDING_SCOPES`, `16 WITHDRAWALS`,
`17 QUERY_PROFILE_DEFINITIONS`, `18 QUERY_PROFILE_ACTIVATIONS`,
`19 INDEX_POSTINGS`, `20 RESOLUTION_PLANS`, `21 REQUIRED_POINT_INPUTS`,
`22 COST_COMMITMENTS`, `23 COUNTERS`, `24 PRINCIPALS`, `25 VERIFIER_PROFILES`,
`26 ADMISSION_PLANS`, `27 DESTINATION_WITNESSES`, and `28 DESCRIPTORS`. Kinds
24–28 are deliberately appended so the existing disposable 1–23 registry is
not renumbered. `finiteInventoryCount` is the number of entries, not bytes.
`projectionRoot` commits the projection payload and count but is excluded from
its own preimage. The only counters are `admissionHighWater`, per-Binding
revision, per-`BindingScopeKey` scope count, and per-activation coverage
high-water.

A generic raw collection read uses `ResultV0.subjectKind = COLLECTION_ENTRY`
and `ResultV0.subject = abi.encode(uint8 collectionKind, bytes canonicalKey)`.
`canonicalKey` is exactly the registry key bytes below, not a decoded tuple or a
semantic identifier substituted for it. Semantic reader helpers may expose
`RECORD`, `OCCURRENCE`, or another narrower subject kind, but the generic
`getPoint` seam for all 28 collections uses this lossless composite subject.

### Exact collection key/value ABI registry

The following registry is exhaustive for C0/v0. A projection entry whose key or
value cannot ABI-decode and byte-for-byte re-encode under its row is malformed.
No implementation may substitute a JSON key, packed key, storage slot, mapping
iterator key, or current-state reconstruction for these bytes.

| Kind | Collection | Exact `key = abi.encode(...)` | Exact `value = abi.encode(...)` |
|---:|---|---|---|
| 1 | `REALM_BOOTSTRAPS` | `RealmId` | `RealmBootstrap` |
| 2 | `REALM_REVISIONS` | `RealmId, u32 generation` | `RealmRevision` |
| 3 | `TYPES` | `TypeSchemaId` | exact `TypeSchemaEnvelope` bytes |
| 4 | `RECORDS` | `RecordId` | `Record` |
| 5 | `PUBLICATION_SETS` | `PublicationSetId` | `PublicationSet` |
| 6 | `OCCURRENCES` | `OccurrenceId` | `Occurrence` |
| 7 | `SOURCE_WITNESSES` | `SourceWitnessId` | `SourceWitnessSidecar` |
| 8 | `NONCE_PLANS` | `RealmId, PrincipalId, u32 nonceLane, u64 nonce` | `AdmissionPlanId, OperationId` |
| 9 | `OPERATIONS` | `OperationId` | `Operation` |
| 10 | `ADMISSIONS` | `AdmissionId` | `AdmissionReceipt` |
| 11 | `VERIFIER_TRANSCRIPTS` | `AdmissionId` | `VerifierTranscript` |
| 12 | `BASE_POSTINGS` | `u8 baseKind, Hash baseKey, u32 admissionOrdinal` | `RecordId, AdmissionId` |
| 13 | `BINDING_HEADS` | `PrincipalId, PositionKey` | `BindingHeadV0` |
| 14 | `BINDING_HISTORY` | `PrincipalId, PositionKey, u32 revision` | `BindingHeadV0` |
| 15 | `BINDING_SCOPES` | `PrincipalId, bytes32 purpose, bytes32 subject, u32 scopeOrdinal` | `bytes32 fieldRole` |
| 16 | `WITHDRAWALS` | `PrincipalId, OccurrenceId` | `OperationId` |
| 17 | `QUERY_PROFILE_DEFINITIONS` | `QueryProfileId` | `QueryProfile` |
| 18 | `QUERY_PROFILE_ACTIVATIONS` | `QueryProfileId, u32 generation` | `QueryProfileActivation` |
| 19 | `INDEX_POSTINGS` | `QueryProfileId, u32 generation, Hash indexKey, u32 postingOrdinal` | `RecordId` |
| 20 | `RESOLUTION_PLANS` | `ResolutionPlanId` | `ResolutionPlan` |
| 21 | `REQUIRED_POINT_INPUTS` | `ResolutionPlanId, PositionKey` | `RequiredPointInputV0` |
| 22 | `COST_COMMITMENTS` | `OperationId` | `CostCommitmentV0` |
| 23 | `COUNTERS` | `CounterKeyV0` | `u32 value` |
| 24 | `PRINCIPALS` | `PrincipalId` | `Principal` |
| 25 | `VERIFIER_PROFILES` | `VerifierProfileId` | `VerifierProfile` |
| 26 | `ADMISSION_PLANS` | `AdmissionPlanId` | `AdmissionPlan` including the exact `EffectV0[]` |
| 27 | `DESTINATION_WITNESSES` | `DestinationWitnessId` | `DestinationWitnessSidecar` |
| 28 | `DESCRIPTORS` | `u8 descriptorKind, DescriptorCommitment` | `Bytes canonicalDescriptor` |

The two helper tuples used only to remove union/namespace ambiguity are:

```text
BindingHeadV0 {
  revision: u32
  tombstone: bool
  target: RecordId                         // zero iff tombstone=true
  operationId: OperationId
}

CounterKeyV0 {
  counterKind: u8                          // 1 admission; 2 Binding; 3 scope; 4 coverage
  realmId: RealmId
  subject: Hash                            // zero, BindingKey, BindingScopeKey, or QueryProfileId
  generation: u32                          // nonzero only for coverage
}
```

Counter rows are respectively `(1, RealmId, ZERO_HASH, 0)`,
`(2, RealmId, BindingKey, 0)`, `(3, RealmId, BindingScopeKey, 0)`, and
`(4, RealmId, QueryProfileId, generation)`. Values that do not fit `u32` reject
the C0/v0 control rather than widening silently. A complete projection may have
zero entries in a legitimately empty collection. The disposable inspector
therefore accepts separate control metadata naming explicitly empty collection
kinds. Unknown, duplicate, or populated declared-empty kinds reject. Full
declared-collection control requires the union of populated and declared-empty
kinds to equal the exact registry `1..28`; the metadata is outside
`ProjectionPayloadV0`, while the handoff artifact checksum commits both the
payload and declaration. The synthetic registry fixture remains a **full
populated-collection control** because it deliberately contains at least one
canonical row of every kind. A smaller unaccounted matched subset is
`PARTIAL_INVARIANT_CONTROL`, never full-state reconstruction evidence.

Full-state relationship validation is fail-closed in this candidate. Source
and destination witnesses must carry the exact `SIGN` digest. Every Operation
must recompute from its retained AdmissionPlan and exact effect set. Nonce,
Admission, verifier-transcript, Binding, Withdrawal, cost, and obvious
resolution references must close over retained rows. A BasePosting's key
ordinal must equal the referenced AdmissionReceipt ordinal and its Record must
equal that receipt's exact Occurrence leaf. A terminal query activation must
bind its key/profile/generation, satisfy
`historicalStart <= coveredThrough == activationHighWater`, and carry the exact
retained postings count/root plus an equal coverage counter.

`DescriptorKindV0` is closed: `1 COMPONENT`, `2 EXECUTION_PROFILE`, `3 POLICY`,
and `4 ADMINISTRATION`. A Descriptor key is valid only when
`DescriptorCommitment = H(D("EFS2/EXP-C0/V0/DESCRIPTOR"), descriptorKind,
canonicalDescriptor)` and the value re-encodes byte-for-byte. Every component,
execution-profile, policy, and administration commitment named by a retained
`RealmRevision` must have that exact `(kind, commitment) -> bytes` row. An
unknown kind, digest mismatch, missing preimage, or descriptor outside 1..4,096
bytes invalidates full-state reconstruction. These opaque candidate descriptor
bytes preserve historical interpretation input; they do not make a descriptor
authorized, supported, or semantically valid by hash alone.

## Reopened before production

- This two-field `T_NOTE`, ABI-tuple grammar, fixed bounds, two-leaf carrier,
  two selected verifier profiles, and one query index are controls, not durable
  Core choices.
- The required Type, Principal, carrier, and Realm comparators remain required;
  no loser is adopted by omission.
- Final codecs/hashes, malformed-input precedence, hard limits, full Type
  grammar, signature suites, cost policy, Lens grammar/caps, topology/storage,
  read-profile proof law, Realm succession, and production reconstruction ABI
  remain open for the later gates.

## Pre-promotion checklist

- [ ] All `## Reopened before production` items either measured or explicitly deferred
- [x] `**Target repos:**` confirmed
- [x] No permanent implementation authority claimed
- [ ] Independent model/SUT/vector replay evidence attached
- [ ] At least one `#status/review` pass

## Implementation notes

Implement only in a disposable experiment after the sibling codec/vector packet
has concrete binary fixtures. No production-repository implementation follows
from this draft.
