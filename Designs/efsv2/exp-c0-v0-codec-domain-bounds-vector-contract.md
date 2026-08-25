# EXP-C0/v0 — codec, domain, bounds, and vector contract

**Status:** draft — exact disposable experiment contract; **NON-DURABLE** and **NON-CONFORMANT**
**Target repos:** planning, disposable experiments
**Depends on:** [[exp-c0-v0-data-structure-profile]], [[exp-c0-v0-result-api-profile]], [[../../Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README|EXP-C0 semantic trace seal]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #topic/efsv2 #topic/readiness

## Contract

This selects candidate bytes for the **one disposable micro-Realm only**. It
does not set `protocolConformance=true`, reserve an EFS namespace, or provide
freeze-final golden vectors. Implementations use this document literally; a
disagreement is a failed experiment, not a reason to normalize values.

## ABI-v2/0 canonical control encoding

All wire/control bytes are Solidity ABI coder v2 `abi.encode` bytes, with no
function selector and no packed encoding. This gives immediate independent
Solidity/JavaScript parity and a candid size/gas baseline. `PROFILE_VERSION` is
the ABI value `uint16(0)`. Every structure is the tuple of fields in the exact
declaration order in [[exp-c0-v0-data-structure-profile]] or
[[exp-c0-v0-result-api-profile]]; nested structures are nested tuples, and
arrays are ABI dynamic arrays unless the declaration says fixed-size.

```text
Bytes       = ABI `bytes`
Array<T>    = ABI `T[]`
bool        = ABI `bool`
enum        = ABI `uint8` with fixed codes below
Id/Hash     = ABI `bytes32`
Address     = ABI `address`
uN          = ABI `uintN`
Optional<T> = ABI tuple `(bool present, T value)`
```

The artifact type is known from the request/vector filename and its manifest.
The one deliberate dispatch exception is the kind-3 Type value: its complete
wire is the canonical outer `abi.encode(uint16 codecVersion, bytes
payloadBytes)` envelope. This is a bounded codec coordinate, not a generic
self-describing tag. Arrays are in declaration order only where order has
meaning (`leaves`, `effects`, `principals`, `probes`). All other collections
are sorted by `keccak256(abi.encode(key))`, then by
`abi.encode(key)` for the astronomically unlikely hash tie. Decoders reject a
wrong ABI tuple shape, noncanonical order, duplicate key, reserved/unknown
field or selector, absent-vs-present zero substitution, and any bound failure.
ABI's fixed 32-byte words are intentional; no implementation may substitute
`abi.encodePacked` or a custom compact codec.

Enum codes are closed in this control. Unknown and reserved values reject:

| Surface | Codes |
|---|---|
| Principal authority | `EOA=1`, `ERC1271=2` |
| Verifier profile | `EOA_SECP256K1=1`, `ERC1271_STATICCALL=2` |
| Verifier transcript result | `AUTHORIZED=1`, `DENIED=2`, `MALFORMED=3`, `REVERTED=4` |
| Visibility / suite | `PUBLIC=1`; the sole fixture suite is `1` |
| Effect kind | `BIND=1`, `TOMBSTONE=2`, `WITHDRAW=3`, `ACTIVATE_QUERY=4`, `ADVANCE_COVERAGE=5` |
| Operation outcome | `COMMITTED=1` |
| Activation state | `PENDING=1`, `ACTIVE_PARTIAL=2`, `TERMINAL_COMPLETE=3` |
| Query index kind | `EXACT_BYTES_FIELD=1` |
| Cursor ordering | `ADMISSION_ORDINAL_ASC=1` |
| Lens combiner | `FIRST_FOUND_AFTER_PROVED_ABSENCE=1` |
| Representation order / encoding | `FIELD_KEY_ASC=1`, `ABI_TUPLE_V0=1` |
| Scalar kind | `U64=1`, `BOOL=2`, `BYTES=3`, `RECORD_ID=4` |
| Constraint | `REQUIRED=1`, `MAX_BYTES=2`, `MAX_LIST=3` |
| Reference target | `EXACT_TYPE_RECORD=1`, `SELF_TYPE_RECORD=2` |
| Disclosed power | `UPGRADE=1`, `PAUSE=2`, `POLICY=3`, `VERIFIER=4`, `ROUTER=5`, `REGISTRY=6` |
| Byte-attempt outcome | `VERIFIED=1`, `INTEGRITY_FAILED=2`, `UNAVAILABLE=3`, `PARTIAL=4` |
| Source transport | `RPC_HTTP=1`, `ARCHIVE_EXPORT=2`, `DECLARED_OTHER=3` |
| Byte digest algorithm | `KECCAK_256=1` |
| Base posting | `TYPE=1`, `RECORD_REFERENCE=2`, `AUTHOR=3`, `DIGEST=4` |
| Interpretation descriptor | `COMPONENT=1`, `EXECUTION_PROFILE=2`, `POLICY=3`, `ADMINISTRATION=4` |

Result/fact/payload enums use the explicit code tables in
[[exp-c0-v0-result-api-profile]]. `NOT_APPLICABLE=255` where that profile
permits it. `ABSENT` optional is always `present=0`, never an enum value. A decoder must
ABI-decode then ABI-reencode byte-for-byte before semantic validation, so
noncanonical offsets, aliasing, or trailing bytes are `MALFORMED_ABI`.

Type readers apply that byte-identical outer decode/re-encode check before
codec dispatch. Codec 0's payload is the exact codec-free
`TypeSchemaPayloadV0` tuple. A canonical unknown codec is retained as exact raw
envelope and payload bytes and receives `UNSUPPORTED`, `UNPROVEN`, and
`INCOMPLETE` grades; it is never passed to the codec-0 decoder. Its C0
admission attempt rejects without effect. The whole envelope, including outer
head, length, payload, and padding, is capped before opaque payload copying.

`PositionKey` hashes the exact ABI tuple `(bytes32 purpose, bytes32 subject,
bytes32 fieldRole)`. All three coordinates are nonzero and remain full-width in
every API, state key, vector, and comparator; an implementation may not narrow
purpose or role to `uint16`. Purpose and role registries remain fixture-local
and values not listed in a vector reject. `BindingScopeKey` hashes `(PrincipalId, purpose,
subject)` and deliberately excludes `fieldRole`, which is the enumerated member
value. The terminal posting element is:

```text
PostingV0 {
  indexKey: Hash
  postingOrdinal: u32
  recordId: RecordId
}
```

`PostingV0[]` sorts by `indexKey`, then `postingOrdinal`, then `recordId` and
rejects duplicates. This array, not a host query response, is the preimage of
the terminal postings root.

## Hash and identity domains

`D(name) = keccak256(bytes(name))`, where `name` is the case-sensitive ASCII
literal shown below. `H(domain, values...) = keccak256(abi.encode(domain,
uint16(0), values...))`. Each domain is a `bytes32` `D(name)` value, so no
untyped string ever enters an ID preimage.

| Name | Exact preimage |
|---|---|
| `TypeSchemaId` | `H(D("EFS2/EXP-C0/V0/TYPE"), u16 codecVersion, Bytes payloadBytes)` |
| `RecordId` | `H(D("EFS2/EXP-C0/V0/RECORD"), TypeSchemaId, H(D("EFS2/EXP-C0/V0/BODY"), canonicalBody))` |
| `PrincipalId` | `H(D("EFS2/EXP-C0/V0/PRINCIPAL"), Principal)` |
| Origin-lineage commitment | `H(D("EFS2/EXP-C0/V0/ORIGIN_LINEAGE"), OriginLineageV0)` |
| Source-endpoint commitment | `H(D("EFS2/EXP-C0/V0/SOURCE_ENDPOINT"), SourceEndpointV0)` |
| source-locator commitment | `H(D("EFS2/EXP-C0/V0/SOURCE_LOCATOR"), Bytes locator)` |
| source-descriptor commitment | `H(D("EFS2/EXP-C0/V0/SOURCE_DESCRIPTOR"), SourceDescriptorV0)` |
| byte-read-request commitment | `H(D("EFS2/EXP-C0/V0/BYTE_READ_REQUEST"), ByteReadRequestV0)` |
| `VerifierProfileId` | `H(D("EFS2/EXP-C0/V0/VERIFIER"), VerifierProfile)` |
| `PublicationSetId` | `H(D("EFS2/EXP-C0/V0/PUBLICATION"), PublicationSet)` |
| `OccurrenceId` | `H(D("EFS2/EXP-C0/V0/OCCURRENCE"), PublicationSetId, leafIndex)` |
| `SourceWitnessId` | `H(D("EFS2/EXP-C0/V0/SOURCE_WITNESS"), SourceWitnessSidecar)` |
| `DestinationWitnessId` | `H(D("EFS2/EXP-C0/V0/DESTINATION_WITNESS"), DestinationWitnessSidecar)` |
| `initialRevisionCommitment` | `H(D("EFS2/EXP-C0/V0/INITIAL_REVISION"), generation, componentCommitment, executionProfileId, policyId, verifierProfileId, administrationCommitment, activationStart, activationEndExclusive)` |
| `RealmId` | `H(D("EFS2/EXP-C0/V0/REALM"), originLineage, genesisCommitment, coreCommitment, initialRevisionCommitment, disclosedPowers)` |
| `RealmRevisionId` | `H(D("EFS2/EXP-C0/V0/REALM_REVISION"), RealmRevision)` |
| `PositionKey` | `H(D("EFS2/EXP-C0/V0/POSITION"), purpose, subject, fieldRole)` |
| `BindingKey` | `H(D("EFS2/EXP-C0/V0/BINDING"), PrincipalId, PositionKey)` |
| `BindingScopeKey` | `H(D("EFS2/EXP-C0/V0/BINDING_SCOPE"), PrincipalId, purpose, subject)` |
| typed reference base key | `H(D("EFS2/EXP-C0/V0/BASE/RECORD_REFERENCE"), TypeSchemaId, u16 fieldKey, targetRecordId)` |
| exact-bytes index key | `H(D("EFS2/EXP-C0/V0/INDEX/EXACT_BYTES"), TypeSchemaId, u16 fieldKey, Bytes canonicalValue)` |
| Record body commitment / `DIGEST` base key | `H(D("EFS2/EXP-C0/V0/BODY"), canonicalBody)` |
| `DescriptorCommitment` | `H(D("EFS2/EXP-C0/V0/DESCRIPTOR"), u8 descriptorKind, Bytes canonicalDescriptor)` |
| `QueryProfileId` | `H(D("EFS2/EXP-C0/V0/QUERY_PROFILE"), QueryProfile)` |
| `ResolutionPlanId` | `H(D("EFS2/EXP-C0/V0/RESOLUTION_PLAN"), ResolutionPlan)` |
| `AdmissionPlanId` | `H(D("EFS2/EXP-C0/V0/ADMISSION_PLAN"), AdmissionPlan)` |
| `EffectSetId` | `H(D("EFS2/EXP-C0/V0/EFFECT_SET"), EffectV0[])` |
| `OperationId` | `H(D("EFS2/EXP-C0/V0/OPERATION"), AdmissionPlanId, EffectSetId)` |
| `AdmissionId` | `H(D("EFS2/EXP-C0/V0/ADMISSION"), OccurrenceId, RealmRevisionId, OperationId, admissionOrdinal)` |
| cursor commitment | `H(D("EFS2/EXP-C0/V0/CURSOR"), CursorV0)` |
| `ResultV0` commitment | `H(D("EFS2/EXP-C0/V0/RESULT"), ResultV0)` |
| Plan-signature receipt commitment | `H(D("EFS2/EXP-C0/V0/PLAN_SIGNATURE_RECEIPT"), PlanSignatureReceiptV0)` |
| account/submission receipt commitment | `H(D("EFS2/EXP-C0/V0/ACCOUNT_SUBMISSION_RECEIPT"), AccountSubmissionReceiptV0)` |
| canonical-effect receipt commitment | `H(D("EFS2/EXP-C0/V0/CANONICAL_EFFECT_RECEIPT"), CanonicalEffectReceiptV0)` |
| acquisition-evidence packet commitment | `H(D("EFS2/EXP-C0/V0/ACQUISITION_EVIDENCE"), AcquisitionEvidencePacketV0)` |
| source-observation evidence commitment | `H(D("EFS2/EXP-C0/V0/SOURCE_OBSERVATION_EVIDENCE"), SourceObservationEvidenceV0)` |
| terminal postings root | `H(D("EFS2/EXP-C0/V0/POSTINGS"), PostingV0[])` |
| projection root | `H(D("EFS2/EXP-C0/V0/PROJECTION"), ProjectionPayloadV0, finiteInventoryCount)` |

`RealmBootstrap.initialRevisionCommitment` excludes only `RealmRevision.realmId`
and therefore breaks the fixed point while retaining initial component,
execution, policy, verifier, administration, activation, and power commitments
inside Realm identity. `RealmBootstrap.initialRevisionId` is checked after both
structures are decoded: the revision payload must name the derived RealmId,
generation zero, and the exact initial commitment. A hidden or substituted
**disclosed** power/revision therefore changes the RealmId. This does not prove
that every proxy, facet, registry, or other implementation power was disclosed;
the full hidden-power topology corpus remains a design-only falsifier.
`RealmBootstrap.coreCommitment` and every RealmRevision component, execution,
policy, and administration commitment must resolve to an exact retained
`DESCRIPTORS` row of the corresponding closed kind. The row key is
`(descriptorKind, DescriptorCommitment)` and its value is the exact bounded
descriptor bytes; recomputation mismatch or a missing row invalidates complete
reconstruction. A descriptor commitment proves identity/integrity only, never
support or authority.

The COMPONENT descriptor's exact closed preimage is
`ComponentDescriptorV0`; its Core address, runtime-code hash, execution,
policy, verifier, dependency, routing, administration, and disclosed-power
coordinates are cross-checked through bootstrap, initial revision, launch, and
AdmissionPlan. Runtime code bytes remain separate launch evidence, bounded at
24,576 bytes, and must hash to the descriptor's commitment. This keeps the
descriptor below 4,096 bytes. `OriginLineageV0` similarly commits exact chain
namespace/reference/genesis fields; the SourceDescriptor repeats and must match
those chain coordinates while binding the origin/component commitments and
exact Realm/revision. Unknown preimage fields reject rather than being silently
dropped by ABI encoding.
Signatures are over
`H(D("EFS2/EXP-C0/V0/SIGN"), AdmissionPlanId, signerPrincipalId,
verifierProfileId)` for destination witnesses and the same form with
`PublicationSetId` for source witnesses.

## Fixed disposable bounds

| Surface | C0/v0 bound |
|---|---:|
| Realm bootstrap/revisions | 1 bootstrap; 2 revisions |
| Type envelopes / Records / PublicationSets / Occurrences | 16 / 16 / 8 / 16 |
| Principal descriptors / verifier profiles / AdmissionPlans / destination witnesses | 16 / 4 / 32 / 32 |
| interpretation descriptors | 4 closed kinds; 1..4,096 bytes each |
| retained runtime-code launch evidence | 1..24,576 bytes; outside descriptor bytes |
| SourceDescriptor endpoints / locator / read-preimage bytes | 8 / 256 / 4,096 |
| complete canonical Type envelope / Record body | 2,048 / 4,096 bytes |
| Type fields / constraints / roles / reference extraction | 16 / 8 / 8 / 8 |
| Publication leaves and admission occurrences | 2 / 2 |
| source/destination signature | 256 bytes each |
| operations / admissions / transcripts | 32 / 32 / 32 |
| bindings per principal / Binding history / rows per BindingScopeKey | 8 / 16 / 8 |
| withdrawals / base postings / QueryProfiles / activations | 8 / 32 / 1 / 2 |
| QueryProfile indexes / posting rows / page members | 1 / 32 / 32 |
| ResolutionPlans / required point inputs / Lens Principals / probes | 4 / 32 / 64 / 64 |
| effects per Plan / cost / nonce | 4 / `u64` / `u64` |
| all opaque input/result byte fields | 4,096 bytes, unless a narrower field bound states otherwise |

The Type-envelope cap is Realm-total and includes application Types; the four-Type
HELLO_FILES control therefore runs inside, rather than around, the same bound.
The fixture may have fewer values but must never accept more. Bounds are
candidate experiment caps, selected to make complete state enumeration and
Solidity loops obvious. They are not gas evidence or production ceilings.

## Error precedence and effect rule

`ErrorV0 { code:u8; subject:Bytes[0..4096] }` uses these codes and precedence;
the first applicable error wins:

1. `1 MALFORMED_ABI` — wrong tuple shape, dynamic offsets/lengths, nonzero
   padding, trailing bytes, or malformed known-codec payload;
2. `2 NONCANONICAL` — order, duplicate, zero/absent substitution, reserved or
   unknown coordinate;
3. `3 LIMIT_EXCEEDED` — any declared C0/v0 cap;
4. `4 INVALID_TYPE_OR_RECORD` — closed Type interpreter/references or a
   Type-envelope key/ID integrity check fails;
5. `5 PLAN_OR_REALM_MISMATCH` — unknown source, wrong Realm/revision/Core,
   actor/author/effect-set substitution, or malformed effect target;
6. `6 EXPIRED` — execution coordinate is not strictly before expiry;
7. `7 NONCE_COLLISION` — an occupied nonce has a different Plan; exact Plan is
   instead idempotent success returning its existing operation;
8. `8 VERIFIER_DENIED` — selected profile/transcript denies, malforms, or
   reverts; no `hasCode` fallback is legal;
9. `9 POLICY_OR_COST_DENIED` — activation authority, consent, fanout, maximum
   cost, or policy basis fails;
10. `10 PRECONDITION_FAILED` — expected Binding revision, target existence,
    activation state, or terminal commitment fails;
11. `11 UNSUPPORTED` — request needs an omitted C0/v0 profile or names a
    canonical Type codec C0/v0 cannot interpret.

For Type values specifically, outer canonicalization precedes every semantic
grade. A malformed outer envelope or codec-0 payload is code 1; a canonical
codec-0 payload with an unknown coordinate is code 2; a canonical envelope
stored under the wrong `TypeSchemaId` is code 4; and a canonical unknown codec
is code 11. Codes 1, 2, 4, and 11 all reject admission without state effect.

For codes 1–11, `MUTATION` returns `effect=NOT_COMMITTED_PROVEN` only after
the model/SUT compares equal complete projection roots. For a lost submission
channel no error is emitted and `effect=UNKNOWN`; the two legal outcomes remain
unobserved until a canonical basis read-back.

## Vector bundle contract

Each trace has one directory `vectors/<TRACE_ID>/` containing exactly:

```text
request.abi               canonical ABI request/sidecars or read request
pre-projection.abi        complete ABI ProjectionPayload tuple
pre-root.hex              H projection root
expected-result.abi       ABI ResultV0 tuple
expected-delta.json       only mustAdd/mustChange/mustAdvance/mustNotChange
post-projection.abi       required for EXACT transition/read traces
post-root.hex             required for EXACT transition/read traces
README.md                 trace ID, source manifest pin, all symbolic-to-byte substitutions
```

`request.abi` is exactly `abi.encode(RequestV0)`, where `RequestV0` is
`(uint8 requestKind, bytes data)` and `data` is exactly `abi.encode` of the
logical API input tuple in [[exp-c0-v0-result-api-profile]]; `requestKind` is
`1 validate`, `2 bootstrap`, `3 admit`, `4 bind`, `5 withdraw`, `6 activate`,
`7 advance`, `8 point`, `9 page`, `10 lens`, `11 submission`, `12 bytes`, or
`13 reconstruct`. The vector `README.md` names the source ABI tuple signature.

For effectful rejection, `post-projection.abi` must byte-equal the preimage
and `post-root.hex` must equal `pre-root.hex`. For a read-only trace the same is
true. `X1_DROPPED_SUBMISSION_CHANNEL` instead omits post files and supplies an
`unobserved-alternatives.json` with exactly the absent/full-unchanged and
committed/exact-atomic alternatives. Each vector independently recomputes every
stored ID, cursor, terminal postings root, finite count, and projection root.

## Serialized clean-room contract

`Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json` is the
generated consumer-facing subset of this candidate contract. It carries the
exact Result and Bytes payload ABI/domain/preimage, all enums, canonical JSON
and file serialization rules, required JSON pointers, and the full decoded
HELLO expectation. It also carries the exact Type outer ABI
`abi.encode(uint16 codecVersion, bytes payloadBytes)`, codec-0 payload ABI,
`DOMAIN_TYPE`, profile version, Type-ID preimage, 2048-byte whole-envelope cap,
and the path plus raw SHA-256 lock for `vectors/type-envelope-v0.json`.

An old clean-room reader recomputes identity for both codec 0 and canonical
opaque codec 1. Codec 1 retains exact raw bytes but is graded `UNSUPPORTED`,
`UNPROVEN`, semantically `INCOMPLETE`, and `ZERO_EFFECT_REJECT` for C0
admission. Neither the decoded JSON crosswalk nor the current raw locks freeze a
protocol codec; successor-profile and promotion gates remain open.

## All 61 trace obligations

Every listed ID is required to get the vector bundle above before this exact
control can claim complete differential replay. The current experiment instead
gives every ID an explicit evidence disposition and implements only a subset of
bundles. The final column adds the unique
assertion that must be checked in addition to its manifest delta/result profile.

| Group | Trace IDs | Additional vector obligation |
|---|---|---|
| Realm (8) | `R0_BOOTSTRAP_RA`, `R1_SAME_CHAIN_DIFFERENT_CORE`, `R2_SAME_CHAIN_ID_DIFFERENT_GENESIS`, `R3A_LEFT_BRANCH_EXACT_COMPLETE`, `R3B_RIGHT_BRANCH_EXACT_COMPLETE`, `R3C_DIVERGENT_BRANCH_AGGREGATE`, `R4_HIDDEN_ADMIN_REJECT`, `R5_UNANNOUNCED_POST_BOOTSTRAP_MUTATION` | Derive distinct Realm/Revision IDs for all non-identical bootstrap commitments; aggregate fork is `CONFLICT`, hidden/unannounced power rejects unchanged. |
| Type/publication (23) | `T0_EXACT_TYPE_AND_RECORDS`, `T1_NONCANONICAL_TWIN`, `P0_EOA_TWO_LEAF_ADMIT_AND_BIND_BEFORE_EXPIRY`, `P0B_INVALID_EOA_SIGNATURE_WRONG_PRINCIPAL`, `P1_INVALID_SECOND_LEAF_ATOMIC_REJECT`, `P2A_SOURCE_WITNESS_AS_DESTINATION_AUTHORITY`, `P2B1_WRONG_DESTINATION_REALM`, `P2B2_WRONG_REALM_REVISION`, `P2B3_WRONG_CORE_COMMITMENT`, `P2C1_SUBSTITUTED_ACTOR`, `P2C2_SUBSTITUTED_EFFECT_SET`, `P2C3_SUBSTITUTED_BINDING_PRECONDITION`, `P2D_SAME_NONCE_DIFFERENT_PLAN`, `P2E_AT_EXPIRY_BOUNDARY_REJECT`, `P2F_AFTER_EXPIRY_REJECT`, `P3_EXACT_RETRY_IDEMPOTENT`, `P4A_EIP7702_DECLARED_EOA_PROFILE`, `P4B_EIP7702_INVALID_EOA_MAGIC_IGNORED`, `P4C_DECLARED_ERC1271_PROFILE_BASIS_MISMATCH`, `P5A_ERC1271_V1_ADMISSION`, `P5B_ERC1271_EXTERNAL_CHANGE_TO_V2`, `P5C_ERC1271_HISTORICAL_RECEIPT_STABLE`, `P5D_ERC1271_LATER_ACCEPTANCE_NO_RETRO_ADMISSION` | T0 recomputes exact closed reference; T1 is code 2; P0 commits both leaves/receipts/postings/binding atomically; P0B–P2F prove unchanged roots; P3 returns same OperationId; P4–P5 retain selected profile/transcript and never reinterpret history from current code. |
| Binding (4) | `B0_CAS_UPDATE_REV2`, `B1_STALE_CAS_ZERO_EFFECT`, `B2_TOMBSTONE_REV3`, `B3_WITHDRAW_NO_RESURRECTION` | History appends exactly once, scope keeps the key across tombstone/Withdrawal, stale CAS root is unchanged. |
| Query (14) | `Q0_UNAUTHORIZED_PROFILE_ACTIVATION`, `Q0B_FANOUT_LIMIT_ACTIVATION_REJECT`, `Q0D_COST_CAP_ACTIVATION_REJECT`, `Q0C_UNCONSENTING_COST_BEARER_SUBSTITUTION`, `Q1A_AUTHORIZED_ACTIVATION_AND_PARTIAL_BACKFILL`, `Q1B_NONEMPTY_PARTIAL_PAGE`, `Q1C_EMPTY_PARTIAL_PAGE`, `Q1D_AUTHORIZED_FUTURE_WRITE_DUAL_POSTING`, `Q1E_UNCONSENTED_FUTURE_WRITE_CHARGE_REJECT`, `Q2_PREMATURE_TERMINAL_REJECT`, `Q3_STATE_DERIVED_TERMINAL_COMPLETE`, `Q4A_KNOWN_CURSOR_COORDINATE_MISMATCH`, `Q4B_REQUIRED_BASIS_UNAVAILABLE`, `Q5_POINT_FOUND_SCOPE_PARTIAL` | Q0/Q1E/Q2 reject unchanged; Q1A retains authority/cost/consent; Q1B/C are partial even empty; Q1D dual-posts; Q3 derives count/root; Q4 rejects mismatched cursor/basis; Q5 separates found point from partial scope. |
| Lens/results (9) | `L0_PROVED_ABSENCE_ALLOWS_PINNED_FALLBACK`, `L1_PARTIAL_HIGHER_PRIORITY_BLOCKS_FALLBACK`, `L2_BENEFICIARY_PLAN_SUBSTITUTION`, `L3A_UNSUPPORTED_REQUIRED_PROFILE`, `L3B_REQUIRED_PROFILE_BASIS_UNAVAILABLE`, `X0A_RECORD_FOUND_BYTES_INTEGRITY_FAILED`, `X0B_RECORD_FOUND_BYTES_UNAVAILABLE`, `X0C_RECORD_FOUND_BYTES_PARTIAL`, `X1_DROPPED_SUBMISSION_CHANNEL` | L0 has same-basis ordered probes; L1–L3 preserve no fallback; X0 retains `FOUND` while varying byte facts; X1 is the sole `UNOBSERVED` vector. |
| Reconstruction (3) | `Z0_STATE_ONLY_RECONSTRUCTION`, `Z1A_RECONSTRUCTION_MISSING_REQUIRED_ITEM`, `Z1B_RECONSTRUCTION_SUBSTITUTED_DUPLICATED_OR_REORDERED_ITEM` | Z0 reproduces exact count/root without logs/indexer/wallet; Z1A is missing-required, Z1B integrity-fails rather than accepting a smaller projection. |

The group counts sum to **61**. A check must reject duplicate trace IDs and
require exactly the manifest's 61 IDs and 38 result-profile names.

## Reopened before production

This deliberately chooses Keccak-256, ABI-v2/0, enum codes, error precedence,
and numerical caps only to create falsifiable disposable evidence. All are
reopened before any production use, alongside final carrier/comparator results,
cross-language independent codec evidence, complete signature/malleability and
gas corpus, target Realm profile, final topology/storage, scale measurements,
two independent reconstructors, and owner ratification.

## Pre-promotion checklist

- [x] All 61 sealed IDs have an explicit evidence disposition
- [ ] All 61 sealed IDs have a complete required vector bundle
- [x] Exact candidate domains, bounds, and error precedence selected
- [ ] Independent TypeScript/Rust/Solidity encoders agree
- [ ] Model/SUT replay records all expected roots/results
- [ ] At least one `#status/review` pass

## Implementation notes

The first consumer must generate vector bytes outside any Solidity/SUT code;
the independent model and SUT may share only these pinned disposable vector files, never a
semantic helper library.
