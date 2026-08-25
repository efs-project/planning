# EXP-C0/v0 — shared ResultV0 and API profile

**Status:** draft — exact disposable experiment profile; **NON-DURABLE** and **NON-CONFORMANT**
**Target repos:** planning, disposable experiments
**Depends on:** [[exp-c0-v0-data-structure-profile]], [[../../Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README|EXP-C0 semantic trace seal]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #topic/efsv2 #topic/readiness

## Scope

Every pure-model, Solidity, SDK façade, and Explorer adapter in the disposable
run must retain this one qualified result. A friendly view may add labels but
cannot discard, infer, or overwrite a field. This is a candidate ABI profile,
not a final Solidity ABI or a promise of public endpoint compatibility.

## Exact ResultV0

```text
ResultV0 {
  kind: MUTATION | POINT | SCOPE | REQUEST | VERIFIER | AGGREGATE | BYTES | SUBMISSION | RECONSTRUCTION
  subjectKind: REALM | TYPE | RECORD | OCCURRENCE | ADMISSION | BINDING | QUERY | LENS | OPERATION | PROJECTION | COLLECTION_ENTRY
  subject: Bytes[0..4096]                  // ABI-encoded exact key, request, or finite domain
  realmId: RealmId | ABSENT                 // ABSENT only for portable Type/Record validation
  realmRevisionId: RealmRevisionId | ABSENT
  executionCoordinate: u64 | ABSENT
  admissionHighWater: u32 | ABSENT
  observerBasis: ObserverBasisV0 | ABSENT
  profileCommitments: ProfileCommitmentsV0
  facts: FactsV0
  payload: PayloadV0                       // tagged ABI-encoded subtype below
  rawRetention: RawRetentionV0
  projectionIntegrity: MATCHED | MISSING_REQUIRED_ITEM | INTEGRITY_FAILED | NOT_APPLICABLE
}

ObserverBasisV0 {
  blockHash: Hash
  stateRoot: Hash
  sourceKind: ONCHAIN_ATOMIC | AUTHENTICATED_OBSERVER | SOURCE_OBSERVED
  finality: UNPROVEN | OBSERVED_FINAL
  freshnessCoordinate: u64
}

ProfileCommitmentsV0 {
  typeSchemaId: TypeSchemaId | ABSENT
  queryProfileId: QueryProfileId | ABSENT
  queryGeneration: u32 | ABSENT
  policyId: Hash | ABSENT
  verifierProfileId: VerifierProfileId | ABSENT
  codeCommitment: Hash | ABSENT
  dependencyCommitment: Hash | ABSENT
  resolutionPlanId: ResolutionPlanId | ABSENT
}

RawRetentionV0 {
  present: bool
  canonicalBytes: Bytes[0..4096]
  commitment: Hash                         // zero iff absent; otherwise keccak256(canonicalBytes)
}
```

The `kind` codes are exactly the sealed result-profile vocabulary, in the order
above starting at one: `MUTATION=1`, `POINT=2`, `SCOPE=3`, `REQUEST=4`,
`VERIFIER=5`, `AGGREGATE=6`, `BYTES=7`, `SUBMISSION=8`, and
`RECONSTRUCTION=9`. There is no separate `BOOTSTRAP`, `PAGE`, or `LENS` result
kind. Bootstrap is the `MUTATION` rule below; a page is a `SCOPE`; and a Lens
returns the sealed `POINT`, `SCOPE`, or `REQUEST` profile selected by its
qualified outcome.

`subjectKind` uses declaration order starting at one. `COLLECTION_ENTRY=11` is
the generic raw-reader subject; it prevents the read ABI from needing a new
subject noun for every Core collection. Its `subject` is exactly
`abi.encode(uint8 collectionKind, bytes canonicalKey)`, where
`collectionKind` is one of the 28 projection kinds and `canonicalKey` is the
exact collection key encoding. Semantic helpers may still use `RECORD`,
`BINDING`, and the other named subjects, but cannot change the raw point value
or claim a different basis.

An absent `observerBasis` has the all-zero nested tuple. A present
`ONCHAIN_ATOMIC` basis has zero block hash and state root and
`finality=UNPROVEN`, because a contract cannot know its inclusion block or
finality. It retains Realm revision, execution coordinate, and high-water in the
outer result. Observer-source codes are stable within this disposable profile:
`ONCHAIN_ATOMIC=1`, `AUTHENTICATED_OBSERVER=2`, and `SOURCE_OBSERVED=3`. A
present `AUTHENTICATED_OBSERVER` must contain nonzero block hash and state root
and is legal only when the consumer's declared proof/authentication profile was
actually satisfied. A present `SOURCE_OBSERVED` also retains nonzero block hash
and state root, but must use `finality=UNPROVEN`: it says only what a named
source returned. It proves neither source authenticity, canonicality, state
membership, nor finality. Its supplementary evidence packet is defined below.
Finality/freshness is observer evidence, never a Core mutation fact.

Every `T | ABSENT` field in the logical definition is the ABI tuple
`(bool present, T value)`: `present=false` requires the zero ABI value for
`value`; `present=true` requires the named value. A present ID/hash cannot be
zero; a present integer may be zero when zero is a legitimate coordinate. No
zero `bytes32`, address, or integer silently denotes absence. The same zero law
applies to nested optional payload fields: an absent cursor, operation, receipt,
error, observer basis, or raw-retention value carries its all-zero ABI value.
All `u64` values stay full-width integers at every language boundary. The JS
control uses `bigint`; a JSON-facing adapter uses a canonical decimal string,
never an IEEE-754 JSON number. `u32`, `u16`, and `u8` remain safe JS integers.

## FactsV0: no-collapse vocabulary

```text
FactsV0 {
  presence: FOUND | ABSENT_PROVEN | UNKNOWN | CONFLICT | OPAQUE | MASKED | NOT_APPLICABLE
  coverage: COMPLETE | PARTIAL | NOT_APPLICABLE
  support: SUPPORTED | UNSUPPORTED | LIMIT_EXCEEDED | NOT_APPLICABLE
  validation: STRUCTURALLY_VALID | SEMANTICALLY_VALID | INVALID | UNPROVEN | NOT_APPLICABLE
  authority: AUTHORIZED | DENIED | UNPROVEN | NOT_APPLICABLE
  lifecycle: ADMITTED | WITHDRAWN | CARRIED_ONLY | UNPROVEN | NOT_APPLICABLE
  selection: CURRENT | NOT_CURRENT | CONFLICT | UNKNOWN | NOT_APPLICABLE
  bytes: VERIFIED_AVAILABLE | PARTIAL | UNAVAILABLE | INTEGRITY_FAILED | NOT_APPLICABLE
  effect: COMMITTED | NOT_COMMITTED_PROVEN | UNKNOWN | NOT_APPLICABLE
}
```

Legality rules:

1. `ABSENT_PROVEN` requires `coverage=COMPLETE` and an exact local mapping or
   terminally exhausted declared finite domain at the pinned basis.
2. `SCOPE` results use `coverage=COMPLETE` only after the exact Type,
   QueryProfile activation/generation, ordering, high-water, and basis are
   terminal; short, empty, timed-out, pruned, or mixed-basis pages are not
   complete.
3. `MUTATION` and `SUBMISSION` use `coverage=NOT_APPLICABLE`. `effect=UNKNOWN`
   is legal only for `SUBMISSION` and also requires non-applicable coverage. A rejected
   effect is `NOT_COMMITTED_PROVEN` only with an exact equal pre/post projection
   root; a dropped channel is `UNKNOWN`.
4. `AUTHORIZED` requires the retained exact verifier profile and transcript;
   current ERC-1271 code, a self-declared interface, or signature shape alone
   is insufficient.
5. A present Record with unavailable/corrupt bytes remains `FOUND`; a carried
   portable artifact remains `CARRIED_ONLY`, not admitted.
6. `NOT_APPLICABLE` may describe only a fact the `kind` cannot speak to; it
   cannot hide a failed, unavailable, unsupported, or unproven check.
7. `ABSENT_PROVEN` also requires `support=SUPPORTED`; an unsupported or
   over-limit request cannot prove absence. Degraded or failed bytes never prove
   semantic absence.
8. `MASKED` requires a retained mask-policy commitment and observer basis.
   `selection=CURRENT` requires a Binding or Lens subject. `AUTHORIZED`
   requires a retained verifier profile; the vector must additionally retain
   the exact transcript or policy proof that produced that fact.
9. `effect=COMMITTED` is a mutation fact except for an exact complete
   `POINT/OPERATION` idempotent read-back. A fresh committed mutation and every
   `NOT_COMMITTED_PROVEN` rejection carry a canonical effect receipt.

The remaining sealed illegal families depend on evidence outside the nine fact
codes: a short/timed-out/event/indexer scope, a semantic-validity inference made
solely from admission, an authority claim made solely from signature shape or
current code, and a transport acknowledgement presented as canonical effect.
Their request/vector evidence must be checked; the facts tuple alone cannot
reconstruct the forbidden provenance and therefore must not pretend to do so.

## Payloads

```text
PayloadV0 { payloadKind: u8; data: Bytes }
PointPayloadV0 { key: Bytes; valuePresent: bool; value: Bytes; proofOfLocalAbsence: bool }
PagePayloadV0 {
  members: Bytes[0..32]                    // ordered array of canonical member keys
  cursorPresent: bool
  cursor: CursorV0
  pageOrdinal: u16
  declaredDomainRoot: Hash
}
RequestPayloadV0 { request: Bytes[0..4096]; errorPresent: bool; error: ErrorV0 }
PlanSignatureReceiptV0 {
  admissionPlanId: AdmissionPlanId
  signer: PrincipalId
  verifierProfileId: VerifierProfileId
  signedDigest: Hash
  verifierTranscriptCommitment: Hash
  authority: AUTHORIZED | DENIED | UNPROVEN
}
AccountSubmissionReceiptV0 {
  admissionPlanId: AdmissionPlanId
  accountAuthorizationCommitment: Hash
  transportPresent: bool
  transportReference: Bytes[0..128]
  observerBasisPresent: bool
  observerBasis: ObserverBasisV0
}
CanonicalEffectReceiptV0 {
  operationPresent: bool
  operationId: OperationId
  realmId: RealmId
  realmRevisionId: RealmRevisionId
  executionCoordinate: u64
  beforeProjectionRoot: Hash
  afterProjectionRoot: Hash
  effect: COMMITTED | NOT_COMMITTED_PROVEN
}
MutationPayloadV0 {
  operationPresent: bool
  operationId: OperationId
  admissionReceiptIds: AdmissionId[0..2]
  planSignatureReceiptPresent: bool
  planSignatureReceipt: PlanSignatureReceiptV0
  canonicalEffectReceiptPresent: bool
  canonicalEffectReceipt: CanonicalEffectReceiptV0
  errorPresent: bool
  error: ErrorV0
}
SubmissionPayloadV0 {
  admissionPlanId: AdmissionPlanId
  accountSubmissionReceiptPresent: bool
  accountSubmissionReceipt: AccountSubmissionReceiptV0
}
BytesPayloadV0 { recordId: RecordId; expectedDigest: Hash; bytesPresent: bool; availableBytes: Bytes[0..4096] }
ReconstructionPayloadV0 { rootPresent: bool; projectionRoot: Hash; finiteInventoryCount: u32; issuePresent: bool; missingOrInvalidKey: Bytes }
VerifierPayloadV0 { planSignatureReceipt: PlanSignatureReceiptV0 }
AggregatePayloadV0 { componentResultCommitments: Hash[2..8]; declaredDomainRoot: Hash }
```

For C0/v0, `BytesPayloadV0.expectedDigest` is normatively
`keccak256(availableBytes)` whenever verified bytes are present. It is not an
algorithm-generic field. A later `ByteDigest { profile, digest }` shape, if
selected, is a successor-profile and `GO-FREEZE` question; old C0/v0 values are
never reinterpreted under it.

`PayloadV0.data` is exactly `abi.encode` of the subtype selected by
`payloadKind`: `1 POINT`, `2 PAGE`, `3 MUTATION`, `4 SUBMISSION`, `5 BYTES`,
`6 RECONSTRUCTION`, `7 REQUEST`, `8 VERIFIER`, or `9 AGGREGATE`. Result-to-
payload mapping is literal and one-to-one: `MUTATION→MUTATION`, `POINT→POINT`,
`SCOPE→PAGE`, `REQUEST→REQUEST`, `VERIFIER→VERIFIER`,
`AGGREGATE→AGGREGATE`, `BYTES→BYTES`, `SUBMISSION→SUBMISSION`, and
`RECONSTRUCTION→RECONSTRUCTION`. No JSON, selector, packed alternative, or
payload tag borrowed from another result kind is legal. `ErrorV0` is the exact candidate error code and detail fields from
[[exp-c0-v0-codec-domain-bounds-vector-contract]]. Error is a payload datum; it
does not replace the facts envelope.

The three receipt layers are deliberately separate. A valid Plan signature is
not an account submission, an account or transport acknowledgement is not a
canonical effect, and a canonical effect receipt is produced only from exact
Realm state read-back. `NOT_COMMITTED_PROVEN` requires a present
`CanonicalEffectReceiptV0` whose before/after projection roots are equal at the
same Realm, Realm revision, and execution coordinate as `ResultV0`. The receipt
describes the whole atomic Plan mutation and its full pre/post projection, not
one member effect; there is deliberately no `effectIndex`. For every fresh
committed Plan mutation or proved rejection, both `MutationPayloadV0` and its
receipt carry `operationPresent=true`, the same nonzero `OperationId`, and the
same execution coordinate as the outer result. A dropped channel has no
canonical effect receipt and remains `effect=UNKNOWN`.

Bootstrap has no bespoke result kind. It is exactly a `MUTATION` whose subject
kind is `REALM`, whose facts use the sealed `BOOTSTRAP_COMMITTED` profile, and
whose payload is `MutationPayloadV0`. It has no OperationId or admission
receipts: both the mutation and effect-receipt operation options are absent and
carry the zero nested ID. It carries a `COMMITTED` whole-bootstrap canonical
effect receipt with distinct before and after projection roots. A same-root
bootstrap or a bootstrap receipt that invents an OperationId is invalid.

`rawRetention` carries the canonical raw envelope or result bytes consumed by
the adapter. A façade may link to them instead of duplicating a larger artifact,
but a literal C0/v0 result vector always carries the bytes and checks the
commitment. The raw field is identity/provenance evidence, never a friendly DTO.

## Supplementary source-observation evidence

A direct public RPC read is useful evidence, but the source's response is not an
authenticated state proof. The following observer packet stays outside
`ResultV0` and binds that weaker observation without adding a Core noun:

```text
SourceEndpointV0 {
  transportKind: RPC_HTTP | ARCHIVE_EXPORT | DECLARED_OTHER
  locator: Bytes[1..256]
  interfaceCommitment: Hash
  eligible: bool
}

SourceDescriptorV0 {
  chainNamespace: Bytes[1..64]
  chainReference: Bytes[1..64]
  originLineageCommitment: Hash
  componentDescriptorCommitment: Hash
  realmId: RealmId
  realmRevisionId: RealmRevisionId
  endpoints: SourceEndpointV0[1..8]           // exact ordered selection candidates
  selectionPolicyCommitment: Hash
}

ByteReadRequestV0 {
  realmId: RealmId
  realmRevisionId: RealmRevisionId
  recordId: RecordId
  digestAlgorithm: KECCAK_256                 // exact C0 algorithm
  expectedDigest: Hash
  start: u32
  length: u32                                 // nonzero; start + length <= MAX_U32
  sourceDescriptorCommitment: Hash
  requestedBlockReference: Bytes[1..128]
  requestedSourceKind: ONCHAIN_ATOMIC | AUTHENTICATED_OBSERVER | SOURCE_OBSERVED
  requestedFinality: UNPROVEN | OBSERVED_FINAL
}

SourceObservationEvidenceV0 {
  resultV0Commitment: Hash
  requestCommitment: Hash
  requestBytes: Bytes                         // exact retained ByteReadRequestV0 preimage
  sourceDescriptorCommitment: Hash
  sourceDescriptorBytes: Bytes                // exact retained SourceDescriptorV0 preimage
  requestedBlockReference: Bytes[1..128]
  observedBlockNumber: u64
  observedBlockHash: Hash
  observedStateRoot: Hash
  canonicalityAssessment: UNASSESSED | SOURCE_REPORTED | CROSS_SOURCE_MATCHED | CONFLICT
  proofKind: NONE | ACCOUNT_STORAGE_PROOF | DECLARED_OTHER
  proofScope: NONE | POINT | FINITE_SET
  proofScopeCommitment: Hash | ABSENT
  causalAvailability: AVAILABLE | PARTIAL | UNAVAILABLE | UNKNOWN
  evidencePointer: Bytes[0..256]
}
```

The request, source descriptor, observed block, and exact `ResultV0` commitment
cannot be mixed across reads. `SOURCE_REPORTED` and `CROSS_SOURCE_MATCHED` are
attributed assessments, not canonicality or finality proofs. `proofKind` records
what was supplied, not that it verified; only a successful declared verifier may
emit `AUTHENTICATED_OBSERVER`. `causalAvailability` reports whether the source
can still serve the history and side data needed to reproduce the observation;
it never turns missing history into absence.

The HELLO C0 packet is an exact weak-observation profile, not a self-upgrading
claim: it requires `SOURCE_REPORTED`, proof kind/scope `NONE`, an absent proof
scope commitment, and `AVAILABLE`. A stronger grade, declared proof, or changed
availability is a different evidence fact and fails this fixture even when its
enum code is known. Request/source/result commitments are nonzero, and both raw
preimages are decoded, canonically re-encoded, recomputed, and cross-linked.

## Supplementary byte-acquisition evidence

Ordered carrier attempts are observer evidence rather than Core state and stay
outside `ResultV0`:

```text
ByteAttemptEvidenceV0 {
  ordinal: u16
  locatorCommitment: Hash
  sourceCommitment: Hash
  eligible: bool
  expectedDigest: Hash
  observedDigest: Hash
  requestedStart: u32
  requestedLength: u32
  observedLength: u32
  outcome: VERIFIED | INTEGRITY_FAILED | UNAVAILABLE | PARTIAL
  observerBasis: ObserverBasisV0
  evidencePointer: Bytes[0..256]
}
AcquisitionEvidencePacketV0 {
  requestCommitment: Hash
  requestBytes: Bytes                         // exact retained ByteReadRequestV0 preimage
  sourceDescriptorCommitment: Hash
  sourceDescriptorBytes: Bytes                // exact retained SourceDescriptorV0 preimage
  resultV0Commitment: Hash
  attempts: ByteAttemptEvidenceV0[1..8]
}
```

An Explorer may therefore show corrupt-primary then verified-fallback without
changing the final `BYTES` result: the final result remains `presence=FOUND`,
`bytes=VERIFIED_AVAILABLE`, while the failed primary survives in the packet.
The packet commitment prevents attempts, basis, and result bytes from different
reads being mixed. This is a disposable observer packet, not a new Core noun.
Each attempt ordinal names the same ordered SourceEndpoint and locator, and its
`eligible` bit must equal that endpoint's committed bit; an opaque policy label
cannot create eligibility. Every eligible `VERIFIED` attempt exactly equals the
final Result observer basis across block hash, state root, source kind,
finality, and freshness. Failed earlier candidates may retain a different
basis.

## API operations

All operations consume/return canonical profile structures, not ABI-specific
tuples. Solidity may expose ABI tuples that losslessly encode the same values.

| Operation | Input | Result constraints |
|---|---|---|
| `validatePortable(type, record)` | exact bytes | `POINT`; no Realm; `CARRIED_ONLY`; no effect |
| `bootstrap(bootstrap, revision)` | canonical structures | `MUTATION/REALM`; mutation root changes exactly once |
| `admit(plan, sourceWitness, destinationWitness)` | exact Plan and sidecars | `MUTATION`; atomic 0-or-all effects and receipts |
| `bind(effect)` / `withdraw(effect)` | Plan containing one matching effect | `MUTATION`; source of authority remains Plan/profile |
| `activateQuery(effect)` / `advanceCoverage(effect)` | Plan + activation fields | `MUTATION`; cost/consent and terminal commitment retained |
| `getPoint(collectionKind, key, basis)` | exact collection kind/key and Realm basis | `POINT/COLLECTION_ENTRY`; local exact absence may be complete |
| `getPage(request, cursor, basis)` | exact Type/Profile/generation/order | `SCOPE/PAGE`; cursor is committed, pages never merge across bases |
| `resolve(planId, fieldRole, basis)` | immutable Plan plus nonzero exact role; PositionKey is derived from stored purpose/subject | `POINT`, `SCOPE`, or `REQUEST`; ordered probe evidence remains in the exact subject/raw retention |
| `observeSubmission(plan, transport)` | Plan/transport reference | `SUBMISSION`; never claims effect without canonical read-back |
| `readBytes(requestBytes, sourceDescriptorBytes)` | exact canonical ByteReadRequest/SourceDescriptor preimages | `BYTES`; retains Record presence separately and emits separately committed acquisition/observation evidence |
| `reconstruct(bootstrap, observerBasis)` | bootstrap plus authenticated basis | `RECONSTRUCTION`; enumerates complete declared projection only |

## CursorV0 and page invariants

```text
CursorV0 {
  realmId: RealmId
  realmRevisionId: RealmRevisionId
  queryProfileId: QueryProfileId
  generation: u32
  ordering: ADMISSION_ORDINAL_ASC
  activationHighWater: u32
  coveredThroughHighWater: u32
  executionCoordinate: u64
  observerBlockHash: Hash | ZERO_HASH       // zero only for one atomic onchain call
  afterPostingOrdinal: u32
  declaredDomainRoot: Hash
}
```

The cursor commitment is the hash of canonical `CursorV0`. Continuation rejects
if any coordinate differs. `afterPostingOrdinal` is exclusive. A result cannot
merge pages merely because their block numbers match. The sole v0 page ordering
is admission/posting ordinal ascending; ranking, arbitrary joins, and host
pagination remain outside Core.

## Lens and result-specific limits

- `ResolutionPlan.principals` is unique and ordered; `maximumProbes` equals its
  length and may not exceed 64.
- The resolver returns every probe up to the selection or terminal condition,
  including a proved absence, `UNKNOWN`, conflict, unsupported profile, or
  limit error. `UNKNOWN/PARTIAL` at a higher priority prohibits fallback.
- At most 32 page members, two admission receipt IDs, and 64 Lens probes are
  returned. An over-limit request returns `support=LIMIT_EXCEEDED`, never an
  empty/absent result.

## Reopened before production

This profile does not select the final contract ABI, error selector scheme,
observer proof format, result compression, final page/Lens caps, final
canonicality/finality vocabulary, SDK transport, or Explorer presentation. Any
projection that cannot retain all ResultV0 fields is a failed disposable adapter,
not permission to collapse the fact.

## Pre-promotion checklist

- [x] Explicit lossless axes and basis rules retained
- [ ] Model, SUT, SDK façade, and Explorer adapter byte-for-byte crosswalked
- [ ] All 61 traces return legal facts envelopes
- [ ] At least one `#status/review` pass

## Implementation notes

The independent model should expose this logical API directly. Solidity and SDK
implementations may add ergonomics only around raw-preserving conversions.

Clean-room SDK and Explorer experiments consume the generated
`Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json`, not this
prose or the Core experiment sources. That disposable JSON carries the exact
`ResultV0`/`BytesPayloadV0` ABI, complete enum registry, Result domain and
commitment preimage, and the fully decoded HELLO Result. `uint64` values are
decimal strings at this JSON boundary. A consumer retains the raw encoded
Result and verifies decode/re-encode/recommit equality; the decoded object is a
lossless expected-value crosswalk, not an alternate identity surface.

The contract also fixes a byte-identical, environment-free same-source receipt
shape for the two consumer lanes. Its false conformance, durability, production,
deployment, and freeze flags and zero exact replay count are part of the
serialized acceptance contract. Passing it does not promote this candidate
profile or make its current hashes permanent.
