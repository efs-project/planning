# EFS-ID/1 — candidate universal identity profile

**Status:** draft
**Target repos:** planning, contracts, sdk
**Depends on:** [[requirements-and-boundaries]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-07

#status/draft #kind/spec #repo/planning #repo/contracts #repo/sdk #topic/efs15 #topic/efsv2

## Standing

This is the concrete candidate produced by the 2026-08-07 v2→1.5 deep dive.
It is intentionally specific enough to test and reject. The printable domains,
word order, name grammar, and provisional vectors are **not frozen** until an
independent review and Solidity/TypeScript differential suite pass.

The compatibility promise is deliberately narrow:

- EFS 1.5 TagDef/DataId, coordinated ShapeId/TypeId/
  RecordBodyCommitment/RecordVersionId/FieldRoleId, and slot IDs are candidates
  for permanent byte stability and versioned successor coexistence;
- `SemanticEdgeId` is a chain-free assertion digest for grouping EAS receipts,
  not native v2's future sequence/authority/revocation-bound `ClaimId`; and
- raw EAS SchemaUID/receipt UID bytes are never complete locators. Physical
  references include chain and registry/EAS deployment origin.

Current reopened v2 drafts already print `efs.id.tagdef.v1` and
`efs.id.slot.v1` for incompatible kind-word/five-word formulas. Those drafts
are not a second valid interpretation of this candidate. Before EFS-ID/1
freezes, native v2 must either adopt the frozen 1.5 TAGDEF/SLOT formulas or move
its incompatible formulas to new domain/profile strings; the same `*.v1`
domain may never mean two layouts.

## Goals

- `/Arcade/` and every shared topic have one ownerless precomputable ID.
- Owned DATA IDs are precomputable from full-width principal plus persisted
  salt and never from mined receipts or mutable content.
- Exact typed RecordVersion IDs commit DataId, TypeId, ShapeId, and canonical
  application-body bytes so a bare DataId is never misrepresented as an exact
  cross-realm record.
- Cardinality-one and cardinality-many coordinates cannot collide.
- Object-kind namespaces are explicit, so equal `bytes32` values of different
  kinds do not share a slot.
- Every preimage is fixed-width and identically implementable in Solidity and
  TypeScript.
- A future corrected profile coexists under new domains; history is never
  reinterpreted.

## Non-goals

- Portable signed application claims beyond the narrow immutable-type
  authorization below, KEL authority, actor sequence, global revocation, or
  global current state.
- A content-derived GameId or one objectively canonical game.
- A generation/filesystem ID before exact artifact/package semantics settle.
- Rich/dynamic application schemas beyond the bounded all-static
  `TypeDescriptorV1`/`EAS-ABI/1` bridge below.
- Treating a semantic-edge digest as action order or authorship evidence.

## Primitive notation

```text
D(s)       = keccak256(UTF8(s))
H(words…)  = keccak256(abi.encode(bytes32 words…))
W64(n)     = bytes32(uint256(uint64(n))), only for 0 <= n <= 2^64 - 1
WU256(n)   = bytes32(uint256(n)), only for 0 <= n <= 2^256 - 1
W256(i)    = signed int256 encoded as one two's-complement bytes32 word,
             only for -2^255 <= i <= 2^255 - 1
A(a)       = bytes32(uint256(uint160(a)))
ZERO       = bytes32(0)
```

All identity preimages use fixed-width words. `abi.encodePacked` is forbidden.
Every implementation publishes the printable domain string and its bytes32
hash; code must not scatter inline derivations.

## Candidate constants

```text
ROOT_TAGDEF_ID        = D("efs.id.tagdef.root.v1")

DOMAIN_TAGDEF         = D("efs.id.tagdef.v1")
DOMAIN_DATA           = D("efs.id.data.v1")
DOMAIN_RECORD_BODY    = D("efs.id.recordbody.v1")
DOMAIN_RECORD         = D("efs.id.record.v1")
DOMAIN_FIELD_ROLE     = D("efs.id.fieldrole.v1")
DOMAIN_SLOT           = D("efs.id.slot.v1")
DOMAIN_EDGE           = D("efs.id.edge.v1")

TYPE_DESCRIPTOR_V1    = D("efs.type.descriptor.v1")
CODEC_EAS_ABI_STATIC  = D("efs.codec.eas-abi.static.v1")
DOMAIN_SHAPE_FIELD    = D("efs.id.shape.field.fold.v1")
EMPTY_SHAPE_FIELDS    = D("efs.id.shape.fields.empty.v1")
DOMAIN_SHAPE          = D("efs.id.shape.v1")
DOMAIN_TYPE_FIELD     = D("efs.id.type.field.fold.v1")
EMPTY_TYPE_FIELDS     = D("efs.id.type.fields.empty.v1")
DOMAIN_TYPE           = D("efs.id.type.v1")
DOMAIN_TYPE_AUTH      = D("efs.type.authorization.v1")
DOMAIN_VALIDATOR      = D("efs.id.validator.v1")
DOMAIN_POLICY         = D("efs.id.admission-policy.v1")
DOMAIN_EAS_DEPLOYMENT = D("efs.id.eas-deployment.v1")
DOMAIN_EAS_SCHEMA     = D("efs.id.eas-schema.v1")
DOMAIN_BINDING        = D("efs.id.binding.v1")
DOMAIN_BINDING_RECORD = D("efs.state.binding-record.v1")
PROFILE_RECORD_FIXED  = D("efs.binding.profile.record-nonrevocable.eas-abi1.v1")

ROLE_PIN              = D("efs.claimrole.pin.v1")
ROLE_TAG              = D("efs.claimrole.tag.v1")

OBJECTKIND_NONE       = D("efs.objectkind.none.v1")
OBJECTKIND_TAGDEF     = D("efs.objectkind.tagdef.v1")
OBJECTKIND_DATA       = D("efs.objectkind.data.v1")
OBJECTKIND_RECORD     = D("efs.objectkind.record.v1")
OBJECTKIND_PRINCIPAL  = D("efs.objectkind.principal.v1")
OBJECTKIND_TYPE       = D("efs.objectkind.type.v1")  // reserved
```

Profile bounds are `MAX_APPLICATION_FIELDS = 16`, `MAX_EFS_REFERENCES = 8`,
`MAX_MODULE_CONFIG_BYTES = 256`, `MAX_APPLICATION_BODY_BYTES = 512`,
`MAX_EAS_PAYLOAD_BYTES = 736`, and `MODULE_CALL_GAS_CAP = 100_000` per
configured module. The exact schema-string bound is 1,024 ASCII bytes.

The root is deliberately nonzero, domain-separated, and intrinsically
materialized: it needs no EAS receipt before a resolver may admit its children.
The same `EfsObjectKind` codes are used in subject and target positions;
`OBJECTKIND_NONE` is legal only for a subjectless PIN. `OPAQUE`, physical
EAS-schema, and EAS-receipt object kinds are not in the core.
Foreign receipts
remain origin-scoped provenance references rather than graph subjects.

Kind validation is exact:

| Kind | Admission check |
|---|---|
| TAGDEF | nonzero and registered in the shared realm registry; root is intrinsic |
| DATA | registered DataId/preimage |
| RECORD | registered RecordVersionId/body commitment |
| PRINCIPAL | nonzero address-shaped word in the 1.5 carrier |
| TYPE | reserved; reject until the shared-type target profile freezes |

A raw EAS UID is not detectable from bytes alone. It rejects as a semantic
target only because it has no registration under the declared kind.

## Shared topic/definition ID

```text
nameHash = keccak256(canonicalSegmentBytes)

tagDefId = H(
  DOMAIN_TAGDEF,
  parentTagDefId,
  nameHash
)
```

`/` is `ROOT_TAGDEF_ID`. `/Arcade/` hashes its canonical `Arcade` segment under
the root. Chain, EAS deployment, resolver, schema UID, attester, transaction,
and first-instantiator identity are excluded.

This candidate intentionally omits the reopened historical formula's extra
named-node kind word. TAGDEF already supplies the domain; one parent/name pair
should have one shared Schelling-point identity. If a future profile truly
needs typed named nodes, it receives a successor domain rather than splitting
EFS-ID/1.

Concurrent identical instantiations converge on one semantic registry entry
even if EAS admits several receipts. Same ID with a different canonical
preimage fails deterministically. No creator owns the topic.

## Owned DATA ID

```text
dataId = H(
  DOMAIN_DATA,
  principalId,
  salt
)
```

For EFS 1.5 admission:

```text
principalId = bytes32(uint256(uint160(easAttester)))
```

The pure derivation consumes the full bytes32 and never truncates internally.
The 1.5 carrier rejects zero/non-address-shaped principals and zero salt.
Clients generate 32 bytes of cryptographic entropy, persist the salt in the
write plan before signing, and never derive it from content, time, chain, or an
EAS UID.

The core DATA identity registry binds only the derivation preimage. A DataId is
a publisher-owned stable object/lineage coordinate, **not by itself an exact
cross-realm record**: separate realms could admit different bodies beneath the
same DataId. Exact typed records therefore use the record-version identity
below. In 1.5:

- a stable lineage/project is one DataId;
- an exact GameRelease, Markdown revision, comment, proposal, or app record is
  a RecordVersionId committing its canonical body under that DataId;
- applications may still allocate a fresh DataId for a standalone one-version
  record, but its exact link remains the RecordVersionId; and
- Git commits keep native Git OIDs rather than receiving parallel revision IDs.

DataId alone does not assert a globally canonical type, descriptor, or current
version. Several exact RecordVersions (and, where an application permits,
several TypeIds) may live under one lineage; realm/app policy decides which
typed records constitute its project/service history. An application that
needs a genesis descriptor or one selected release expresses that rule in its
TypeDescriptor/admission policy and subject-qualified PIN, not in DataId bytes.

## Bounded shared type and shape identity

`TypeDescriptorV1` is both the canonical identity input and the compact
immutable execution descriptor available to the router on chain. A closure may
carry human documentation, but it can never replace these bytes during
admission.

The descriptor is one exact byte string, with no ABI offsets or trailing data:

```text
offset   bytes  value
0        32     TYPE_DESCRIPTOR_V1
32       32     CODEC_EAS_ABI_STATIC
64       32     publisher PrincipalId
96       32     typeNameWord
128       4     major, unsigned big-endian uint32
132       4     minor, unsigned big-endian uint32
136       4     patch, unsigned big-endian uint32
140       1     applicationFieldCount, 0..16
141      35*n   ordered FieldEntryV1 values, with no unused entries

FieldEntryV1 = nameWord[32] || typeCode[2] || referenceKindCode[1]
```

`typeNameWord` and every field `nameWord` contain the raw ASCII name in the
most-significant/leftmost bytes followed by zero padding. Names use
`[A-Za-z][A-Za-z0-9_]{0,31}`. Embedded zeroes, nonzero bytes after the first
zero, duplicate field names, and any application field named `dataId`,
`recordVersionId`, `recordBodyCommitment`, `typeId`, `shapeId`,
`bindingVersionId`, `salt`, `efsDataId`, `efsRecordVersionId`,
`efsRecordBodyCommitment`, `efsTypeId`, `efsShapeId`,
`efsBindingVersionId`, or `efsDataSalt` rejects. Reserving the shorter aliases
prevents a later codec from creating confusing duplicates. The numeric version
is exactly the three uint32 values; prerelease/build strings and alternate
textual renderings do not enter identity. `0.0.0` is legal.

The two-byte `typeCode` is unsigned big-endian and has one canonical spelling:

| Code | ABI type |
|---|---|
| `0x0001` | `bool` |
| `0x0002` | `address` |
| `0x0100 + N`, `1 <= N <= 32` | `bytesN` |
| `0x0200 + N`, `1 <= N <= 32` | `uint(8*N)` |
| `0x0300 + N`, `1 <= N <= 32` | `int(8*N)` |

Every other code rejects. `referenceKindCode` is `0` for an ordinary scalar,
`1` for TAGDEF, `2` for DATA, `3` for RECORD, or `4` for PRINCIPAL. Nonzero
reference kinds are legal only on `bytes32` (`0x0120`) and at most eight fields
may use them. Code `5` is reserved for TYPE and rejects in EAS-ABI/1. Codes map
to the identically named `EfsObjectKind` word; zero maps to
`OBJECTKIND_NONE`.

Shape identity covers only the byte-level codec and ordered application field
names/types. Type identity additionally covers publisher-qualified semantic
name/version and which fields are EFS references. This preserves the useful
case where different semantic types share one encoding shape without creating
a FieldRoleId cycle:

```text
shapeFold[0] = EMPTY_SHAPE_FIELDS
shapeFold[i+1] = H(
  DOMAIN_SHAPE_FIELD,
  shapeFold[i],
  W64(i),
  field[i].nameWord,
  W64(field[i].typeCode)
)

shapeId = H(
  DOMAIN_SHAPE,
  CODEC_EAS_ABI_STATIC,
  W64(applicationFieldCount),
  shapeFold[applicationFieldCount]
)

typeFold[0] = EMPTY_TYPE_FIELDS
typeFold[i+1] = H(
  DOMAIN_TYPE_FIELD,
  typeFold[i],
  W64(i),
  field[i].nameWord,
  objectKindWord(field[i].referenceKindCode)
)

typeId = H(
  DOMAIN_TYPE,
  publisherPrincipalId,
  typeNameWord,
  W64(major),
  W64(minor),
  W64(patch),
  shapeId,
  typeFold[applicationFieldCount]
)
```

The 1.5 type-publisher profile is an ECDSA-recoverable address-shaped principal.
Publication is relayable and chain/router-independent:

```text
descriptorHash = keccak256(exactTypeDescriptorV1Bytes)
authorizationMessage = H(DOMAIN_TYPE_AUTH, descriptorHash)
authorizationDigest = keccak256(
  0x19 || ASCII("Ethereum Signed Message:\n32") || authorizationMessage
)
```

`TypeAuthorizationV1` is exactly a 65-byte secp256k1 `(r,s,v)` signature over
that EIP-191 digest. `v` is 27 or 28, `s` is low per EIP-2, recovery must be
nonzero and equal the descriptor's publisher principal, and ERC-2098 or other
encodings reject. Anyone may relay those same descriptor/signature bytes into
any realm; chain ID, router, and registrar do not enter authorization or TypeId.
Contract publishers, ERC-1271, KEL, delegation, and rotation need a successor
authorization profile rather than weakening this one.

The registry stores the exact descriptor bytes/hash and the first valid
65-byte publisher signature as state-retrievable authorization; exact type
lookup and paginated catalog output expose both so another realm never depends
on historical logs or an online publisher. Signature bytes are not part of
TypeId or registration equality: multiple valid low-s signatures may recover
the same publisher. Re-registering the same TypeId with byte-identical
descriptor bytes and any valid authorization is an idempotent no-op; the same
TypeId with different descriptor bytes rejects. A known ShapeId with a
different canonical shape projection rejects, while different TypeDescriptors
may share it when that projection is byte-identical. FieldRoleIds are derived
only after TypeId exists and only for nonzero reference-kind fields.

### Exact typed record/version identity

This coordinated extension freezes with `TypeDescriptorV1`/`EAS-ABI/1`, not in
isolation:

```text
applicationBodyHash = keccak256(canonicalApplicationBodyBytes)

recordBodyCommitment = H(
  DOMAIN_RECORD_BODY,
  typeId,
  shapeId,
  applicationBodyHash
)

recordVersionId = H(
  DOMAIN_RECORD,
  dataId,
  typeId,
  recordBodyCommitment
)
```

Canonical application body excludes EFS prefix fields, salt, admission binding,
realm, EAS origin, receipt, and reader/curator state. BindingVersionId may vary
across realms without renaming identical semantic record bytes. A different
typed body produces a different RecordVersionId even under the same DataId.

As an **Arcade portable-profile example**, not a core kind, GameProject/Work is
the publisher-owned DataId. GameRelease is the
RecordVersionId of a canonical GameRelease body that commits the
chain-independent `ArtifactManifest/1` identity. ArtifactManifest remains a
third identity defined by the artifact-profile freeze.

## PIN slot and semantic edge

```text
pinSlotId = H(
  DOMAIN_SLOT,
  ROLE_PIN,
  principalId,
  definitionId,
  subjectKind,
  subjectId,
  targetKind
)

pinSemanticEdgeId = H(
  DOMAIN_EDGE,
  ROLE_PIN,
  pinSlotId,
  targetId,
  ZERO,              // PIN has no weight
  W64(expiresAt)
)
```

All PINs under
`(principal, definition, subjectKind, subjectId, targetKind)` compete. Changing
the target changes the assertion digest but not its slot. A subjectless named
channel uses `(OBJECTKIND_NONE, ZERO)`; every other subject kind requires a
nonzero subject that passes its kind-specific admission check. This extra
source coordinate is necessary for several stable projects to each select a
current release without making a DataId masquerade as a definition.

In EFS-ID/1, `definitionId` must resolve to a registered `TagDefId`. TypeId and
DataId are not accepted as a predicate/definition. If a successor profile needs multiple
definition namespaces, it must add an explicit `definitionKind` rather than
let equal bytes collide. EfsObjectKind protects subject/target coordinates,
not the definition position; `OBJECTKIND_TYPE` still rejects until its object
profile freezes.

For the 1.5 MVP `expiresAt = 0`; nonzero expiry is rejected until every fold,
read, index, and UI implements stale-not-dead behavior. Whether the reserved
expiry word should remain in the frozen edge preimage is an independent-review
item.

## TAG slot and semantic edge

```text
tagSlotId = H(
  DOMAIN_SLOT,
  ROLE_TAG,
  principalId,
  definitionId,
  targetKind,
  targetId
)

tagSemanticEdgeId = H(
  DOMAIN_EDGE,
  ROLE_TAG,
  tagSlotId,
  targetId,
  W256(weight),
  W64(expiresAt)
)
```

Each `(principal, definition, targetKind, target)` relation has one current
weight/expiry head. Different targets coexist, producing cardinality-many
behavior. Including `targetKind` fixes the reopened historical TAG-slot
omission: equal address/DATA/TypeId/TAGDEF bytes cannot share a slot.

Changing weight/expiry changes `SemanticEdgeId` but not the slot. The review
must still decide whether weight belongs in the assertion digest or should be
modeled as a new immutable value targeted by the edge.

## Receipt aggregation and slot resolution

These are separate folds:

1. **Receipt aggregation** groups lineage-instantiation receipts by DataId,
   exact typed-record admissions by RecordVersionId, and relationship receipts
   by `SemanticEdgeId`. Receipt mapping may expose both DataId and
   RecordVersionId, but distinct versions under one lineage never collapse as
   retries. Duplicates remain individually auditable.
2. **Slot resolution** compares distinct edge IDs at one SlotId using a durable
   monotonically increasing realm-local semantic `admissionOrdinal` stored by
   the 1.5 state layer.

Grouping by edge is insufficient to model reassertion. Each realm-local slot
also stores `slotRevision` and one current activation:

```text
SlotState = {
  slotRevision,
  headSemanticEdgeId,
  activationOrdinal,
  canonicalReceiptRef,
  createdFromSlotRevision
}
```

Every PIN/TAG write carries `expectedSlotRevision` outside SemanticEdgeId. The
resolver applies this fold:

1. If `expectedSlotRevision == current.slotRevision`, the write creates a new
   activation, stores its receipt as canonical, and advances both the slot
   revision and admission ordinal.
2. If the current head has the same SemanticEdgeId **and** its
   `createdFromSlotRevision` equals the request's expected revision, the write
   is an idempotent duplicate of that activation. Its receipt is attached for
   provenance but never becomes canonical and changes no semantic state.
3. Otherwise the write is stale/conflicting and fails. A delayed retry cannot
   reassert an old edge over a newer slot head.

A deterministic write plan contains at most one state-changing activation per
SlotId. The planner collapses intermediate same-slot choices to the final
intent or rejects them; an A→B transition across time uses two plans. This is
required for whole-plan at-least-once replay to reduce to the duplicate rule.

Leading proof behavior then becomes:

- a repeated receipt attached to the current activation is a state no-op;
- a new PIN target or TAG weight with the correct expected revision becomes a
  new slot activation at its stored ordinal;
- revoking a duplicate, noncanonical, or superseded receipt changes provenance
  only;
- revoking the current activation's canonical receipt clears the slot,
  advances slot revision, and never lets attached duplicates or older edges
  keep it alive or resurrect;
- reasserting after clear uses the new expected revision and creates a new
  activation ordinal even when it reuses the same SemanticEdgeId;
- expiry, when supported, marks the head stale and never falls back; and
- another realm's receipt and fold remain independent.

Only the canonical receipt is the current activation's semantic liveness
witness. Each receipt maps in O(1) to its activation plus a canonical/inert
flag. Revoking a live duplicate never changes the head; revoking the live
canonical receipt clears it even if inert duplicates remain. An exact
RecordVersion admission is non-revocable in EFS 1.5. An application may publish
a separate revocable retraction/deprecation relationship, but core 1.5 gives
that relationship no magic status and never erases or mutates the exact record.

IDs and author timestamps are never clocks.

## EAS payload boundary

New 1.5 semantic references live in typed payload fields. Native EAS `refUID`
and `recipient` are zero in the core schemas unless a separately reviewed
interop profile uses them as non-authoritative explorer decoration.
Zero recipient intentionally gives up native EAS recipient-index discovery;
EFS semantic events/indexes replace it. Any future nonzero `refUID` must name
an existing receipt on the exact origin EAS deployment and never implies that
the referenced receipt is currently live.

### EAS-CARRIER/1 core schema strings and payloads

Every 1.5 physical schema names the one shared router as resolver. These four
core schema strings are exact UTF-8, including comma/space spelling:

```text
TAGDEF (non-revocable)
bytes32 efsTagDefId, bytes32 efsParentTagDefId, string efsSegment

DATA (non-revocable)
bytes32 efsDataId, bytes32 efsDataSalt

PIN (revocable)
bytes32 efsSemanticEdgeId, bytes32 efsSlotId, bytes32 efsDefinitionId, bytes32 efsSubjectKind, bytes32 efsSubjectId, bytes32 efsTargetKind, bytes32 efsTargetId, uint64 efsExpiresAt, uint64 efsExpectedSlotRevision

TAG (revocable)
bytes32 efsSemanticEdgeId, bytes32 efsSlotId, bytes32 efsDefinitionId, bytes32 efsTargetKind, bytes32 efsTargetId, int256 efsWeight, uint64 efsExpiresAt, uint64 efsExpectedSlotRevision
```

TAGDEF data is the canonical ABI encoding of the claimed ID, parent ID, and raw
ASCII segment. Because it is the one dynamic core payload, the router decodes
then re-encodes the tuple and requires byte-for-byte equality with the supplied
data, exact offset/length/padding, no trailing bytes, and the EFS-ID/1 segment
grammar before recomputing TagDefId. Before any `abi.decode`, it rejects a
payload shorter than 160 bytes or longer than 192 bytes; a legal nonempty
1-to-63-byte segment can occupy only those bounded canonical tuple sizes. Root
is intrinsic and never attested.

DATA data is exactly two ABI words. The router derives PrincipalId from the EAS
attester, recomputes DataId from principal/salt, and rejects zero salt. This
standalone schema lets a lineage exist before any typed record; a typed record
may instead stage and atomically register the same DataId from its seven-word
prefix.

PIN data is exactly nine ABI words and TAG data exactly eight. The router
validates canonical uint64/int256 words; recomputes SlotId and SemanticEdgeId;
requires `efsExpiresAt == 0`; applies the expected-slot-revision fold; and
checks every definition/subject/target kind and referenced object. The expected
revision is deliberately in carrier data but outside SemanticEdgeId.

For every core or typed-record request, `recipient == address(0)`, `refUID ==
bytes32(0)`, native `expirationTime == 0`, resolver `value == 0`, and callback
`msg.value == 0`. The router rejects any mismatch even though EAS itself permits
those fields. EAS requires its resolver callback ABI to remain payable, so the
router instead pins `isPayable() == false`, accepts no payment, and forwards no
ETH. The request's native `revocable`
flag must equal the schema profile above; schema registration itself uses that
same fixed flag. SchemaUID is always derived by the exact EAS rule already
shown, using the corresponding string, shared router address, and revocability.

The typed application-record prefix carries claimed `DataId`,
`RecordVersionId`, `RecordBodyCommitment`, `TypeId`, `ShapeId`, explicit
`BindingVersionId`, and owned-DATA salt. The resolver derives the
address-shaped PrincipalId from EAS attester; recomputes DataId, canonical body
commitment, and RecordVersionId; verifies the selected binding matches the
origin-scoped physical schema/type/shape; and atomically registers the DATA
identity, exact record, admission evidence, and semantic indexes. This avoids
a second EAS attestation solely to reveal the DataId preimage and prevents two
realm-divergent bodies from sharing one “exact” link.

The leading `EAS-ABI/1` MVP deliberately avoids dynamic-offset ambiguity:

- the physical payload is seven static `bytes32` prefix words in the order
  above followed by zero to 16 top-level static scalar application fields;
- permitted application types are `bool`, `address`, `bytes1` through
  `bytes32`, and `uintM`/`intM` for valid ABI widths. Strings, dynamic bytes,
  arrays, and tuples reject in this codec version;
- `canonicalApplicationBodyBytes` is exactly the `32 * fieldCount` suffix of
  the full payload, not a decode/re-encode of a dynamic tuple;
- the canonical descriptor above supplies the codec, ordered restricted-ASCII
  field names, exact type codes, and reference declarations; and
- the router checks exact total length and canonical ABI word padding/range
  (`bool`, address, bytesN, uintM, and intM) before hashing the suffix.

The physical schema spelling is byte-exact. Its prefix is:

```text
bytes32 efsDataId, bytes32 efsRecordVersionId, bytes32 efsRecordBodyCommitment, bytes32 efsTypeId, bytes32 efsShapeId, bytes32 efsBindingVersionId, bytes32 efsDataSalt
```

For each application field in order, append exactly `, `, the canonical ABI
type spelling produced by `typeCode`, one ASCII space, and the unpadded field
name. There is no leading/trailing whitespace or trailing comma. The empty
shape is exactly the prefix. This exact UTF-8 string is both the SDK encoder
input and the SchemaRegistry UID input; alternate whitespace or type aliases
are different schemas and do not satisfy the binding.

The expected EAS SchemaUID reproduces the pinned SchemaRegistry rule exactly:

```text
schemaUid = keccak256(
  abi.encodePacked(exactPhysicalSchemaString, routerAddress, false)
)
```

This is the sole `abi.encodePacked` use in the profile: interoperability with
an already-defined EAS identifier, not a new EFS identity preimage.

This constrained first codec is a conscious developer-experience debt. A later
dynamic codec gets a new codec/profile version and independently specified
body-extraction algorithm; it cannot reinterpret EAS-ABI/1 records.

The realm has one immutable `Efs15RouterResolver` that is the registered EAS
resolver for every 1.5 physical schema and the only writer to the shared
registry-index. New `EAS-ABI/1` app shapes register permissionlessly through
that already-deployed router; they do not deploy a core resolver or mutate an
owner allowlist. EAS callbacks accept only the pinned EAS contract and the
attestation's registered schema/binding.
The constructor stores immutable EAS and SchemaRegistry addresses and requires
`IEAS(easAddress).getSchemaRegistry() == schemaRegistryAddress`; deployment
reverts rather than accepting a mismatched origin tuple.

Origin and binding identities are exact:

```text
easDeploymentId = H(
  DOMAIN_EAS_DEPLOYMENT,
  WU256(chainId),
  A(easAddress),
  A(schemaRegistryAddress)
)

physicalEasSchemaId = H(
  DOMAIN_EAS_SCHEMA,
  easDeploymentId,
  schemaUid
)

routerRuntimeCodeHash = extcodehash(routerAddress)

validatorRuntimeCodeHash = extcodehash(validatorAddress)
validatorConfigHash = keccak256(exactValidatorConfigBytes)

policyRuntimeCodeHash = extcodehash(policyAddress)
policyConfigHash = keccak256(exactPolicyConfigBytes)

validatorId = ZERO when validatorAddress == address(0), otherwise H(
  DOMAIN_VALIDATOR,
  validatorRuntimeCodeHash,
  validatorConfigHash
)

admissionPolicyId = ZERO when policyAddress == address(0), otherwise H(
  DOMAIN_POLICY,
  easDeploymentId,
  A(policyAddress),
  policyRuntimeCodeHash,
  policyConfigHash
)

bindingVersionId = H(
  DOMAIN_BINDING,
  typeId,
  shapeId,
  physicalEasSchemaId,
  keccak256(UTF8(exactPhysicalSchemaString)),
  A(routerAddress),
  routerRuntimeCodeHash,
  A(validatorAddress),
  validatorId,
  A(policyAddress),
  admissionPolicyId,
  PROFILE_RECORD_FIXED
)
```

For a live contract, `extcodehash(address)` is the keccak256 hash of its exact
deployed runtime bytecode under EVM semantics. A nonzero module address must
have nonempty deployed code. The config bytes are the exact length-delimited
bytes stored by the binding registry; an empty config for a present module uses
`keccak256("")`. The all-zero absent-module special case below overrides those
derivations.

The validator/policy config hashes commit the exact opaque configuration bytes
passed to their module. Each config is at most 256 bytes. Each configured
module call forwards at most 100,000 gas; a later need for a larger cap is a new
router/profile rather than a mutable binding knob. The router checks its
own and every configured module's runtime code hash on every admission.
For an absent module its address, ID, runtime code hash, config hash, and config
bytes are all zero/empty; partial zero configurations reject.

That codehash proves only the directly called contract's outer runtime. A
`staticcall` can still read mutable contracts/oracles, and a proxy can retain
its outer code while changing delegated behavior; the router cannot
mechanically prove purity or a closed dependency set. Therefore `ValidatorId`
means “this read-only module/config was called,” and `validatorValid` is an
admission result at the recorded realm/block basis, not timeless portable
validity. Only router-native codec/identity/reference checks receive that
stronger deterministic claim. A reader may require an independently audited
self-contained module; mechanically pure portable validators require a later
bounded VM or approved-code-family profile.

Type and binding registration is permanent and has no owner allowlist. Any
relayer may register an exactly publisher-authorized TypeDescriptorV1 or a
binding. Registration recomputes every ID; stores the exact descriptor, schema
string hash, addresses, code hashes, and config bytes/hashes needed for
execution; and queries the pinned SchemaRegistry record to prove that the exact
schema string names this router and is non-revocable. Type equality compares
descriptor bytes and recovered publisher, not signature bytes. Binding
equality compares every ordered BindingVersionId formula input plus both exact
length-delimited config byte strings field by field: exact replay is a no-op
and the same BindingVersionId with any difference rejects. A binding is
permanently **registered**;
there is no core activate/deactivate switch or privileged owner. It is not
guaranteed permanently usable: direct runtime-codehash drift, module rejection,
or basis-dependent policy state can make a later admission fail. A writer may
attempt any registered binding. Deprecation and reader distrust are explicit
claims/policies, not retroactive deletion of accepted history. A directly
committed address, codehash, or config change receives a new binding ID.
Undisclosed transitive/proxy changes do not rename the binding and therefore
weaken trust in it; the recorded evaluation basis makes that limitation visible.

Evidence is split at the same boundary as execution. The first successful
`(BindingVersionId, RecordVersionId)` pair stores on-chain
`BindingRecordEvidence`: BindingVersionId, RecordVersionId, evaluation
`block.number`, a monotonically increasing router pair-admission ordinal, and
the validator/policy result. Each accepted physical receipt separately stores
`ReceiptEvidence`: the receipt UID within this pinned EAS deployment, receipt
`block.number`, a monotonically increasing router receipt-admission ordinal,
and its `BindingRecordKey`. The latter points to the original pair evaluation;
a duplicate receipt never makes a reused result appear newly evaluated at the
duplicate's block. The SDK combines the realm tuple to form `EasReceiptRef` and
may add transaction hash/index and log index after mining; the resolver cannot
know those eventual receipt positions during its callback.

The router itself enforces identity, codec, reference, and index invariants.
Optional application modules implement exactly one of these bounded ABIs:

```solidity
validateEfs15(
  bytes32 bindingVersionId,
  bytes32 dataId,
  bytes32 recordVersionId,
  bytes32 principalId,
  bytes32 typeId,
  bytes32 shapeId,
  bytes32 applicationBodyHash,
  uint8 applicationFieldCount,
  bytes32[16] calldata applicationBodyWords,
  bytes calldata validatorConfig
) external view returns (bytes4);

efs15PolicyRouter() external view returns (address);

admitEfs15(
  bytes32 bindingVersionId,
  bytes32 dataId,
  bytes32 recordVersionId,
  bytes32 principalId,
  bytes32 typeId,
  bytes32 shapeId,
  bytes32 applicationBodyHash,
  uint8 applicationFieldCount,
  bytes32[16] calldata applicationBodyWords,
  bytes calldata policyConfig
) external returns (bytes4);
```

The validator is `staticcall`. The stateful admission policy is a normal call
behind the router's reentrancy guard. Within the gas cap it may mutate any state
reachable under its own/downstream authority; the EVM cannot confine it to one
contract. The router grants it no user signing/value authority, and guarded
core writes reject, but a binding that selects a policy must treat its external
side effects as trusted/audited application behavior. All effects remain atomic
with the EAS transaction and revert if admission later fails. Unused body words
are zero and the field count identifies the canonical prefix. Each call uses a
100,000-gas upper bound; EIP-150 or a low-gas outer transaction may reduce the
forwarded amount. The router uses a fixed 32-byte assembly output buffer and
requires `returndatasize() == 32`; it never allocates or copies arbitrary
untrusted return data. A module that still returns the acceptance magic
succeeds; revert/out-of-gas fails closed. Success requires exactly one 32-byte
ABI return word whose decoded `bytes4` equals the first four bytes of
`keccak256("EFS15_VALIDATOR_OK")` or `keccak256("EFS15_POLICY_OK")`,
respectively. Revert, out-of-gas, wrong-sized return data, or wrong magic rejects
the entire EAS transaction. The router commits no identity/index/slot state
until its checks and both calls succeed.

Registration calls `efs15PolicyRouter()` by staticcall with the same fixed
32-byte output-buffer/return-size rule, requires one canonical address return
word equal to this router, and rejects otherwise. A
conforming stateful policy also rejects `admitEfs15` unless `msg.sender` is that
router and keys all mutable admission state by BindingVersionId. This is a
module responsibility and audit surface, not a false claim that the router can
prove arbitrary bytecode confinement.

Stateful policy effects are idempotent at one explicit admission pair:

```text
BindingRecordKey = H(
  DOMAIN_BINDING_RECORD,
  bindingVersionId,
  recordVersionId
)
```

The first successful `(BindingVersionId, RecordVersionId)` pair checks both
module code hashes, calls the validator and policy once, and stores pair-specific
`BindingRecordEvidence`. A later receipt for the same pair still passes every
router codec/identity/reference/schema check and rechecks current direct module
code hashes, but does **not** call either module or repeat policy side effects; it
attaches receipt provenance to the original pair result. Direct codehash drift
rejects even this duplicate while leaving the historical pair evidence intact.
A new BindingVersionId for the same RecordVersionId is a new pair and runs both
modules once. Global body/type/reference indexes remain first-RecordVersion-only
across all bindings. This three-level fold—RecordVersion, binding-record pair,
then receipts—is the at-least-once boundary.

The router recomputes IDs and checks principal/attester, legal definition and
target kinds, referenced-object existence, revocability, zero expiry,
canonical body bytes, and same-ID conflict behavior. Semantic indexes key on
EFS IDs; origin-scoped EAS receipt references key receipt/audit/revocation
history only.

The physical-schema profile is exact:

- TAGDEF, DATA-lineage, and typed RecordVersion admissions are non-revocable;
- PIN and TAG admissions are revocable and the resolver rejects a request with
  the wrong native `revocable` flag;
- native `expirationTime` and semantic `expiresAt` are both zero; and
- native EAS resolver `value` and callback `msg.value` are zero, the payable EAS
  callback ABI pins `isPayable() == false`, and no module receives or forwards
  ETH; and
- EAS-ABI/1 payloads have exact all-static length and canonical scalar words;
  dynamic fields reject until a separately versioned codec freezes them.

TAGDEF payloads include the raw canonical ASCII segment. The resolver derives
its hash while validating, and the state spine can render/reconstruct the path.
Current-state code never treats EAS `isAttestationValid(uid)` as a liveness
check: on the pinned EAS version it proves existence only. Reads fold native
revocation and expiration fields plus EFS slot state explicitly.

For typed RecordVersions, `realmAdmitted` and `realmActive` mean only that the
first exact admission succeeded in this realm and its non-revocable receipt is
present. Both remain true permanently. They do **not** mean current, endorsed,
not retracted, or effective for a reader. App-defined retraction/deprecation
claims affect only the named reader/app policy and do not remove the record
from records-by-type or target-backlink indexes.

A coordinated `TypeDescriptorV1` may declare at most eight of its top-level
`bytes32` fields as typed EFS-object references. Field names use
`[A-Za-z][A-Za-z0-9_]{0,31}` and each descriptor-local role is:

```text
fieldRoleId = H(
  DOMAIN_FIELD_ROLE,
  typeId,
  W64(fieldIndex),
  keccak256(ASCII(fieldName))
)
```

The descriptor rejects duplicate names or roles. Each reference also declares
one EfsObjectKind. Admission applies that kind's exact existence/shape check. A
DATA reference equal to the current record's freshly derived DataId is legal as
a staged same-admission dependency: the router validates its principal/salt
preimage before reference checks and commits it only after every check/module
succeeds. Every other target must already be registry-visible when this
callback runs; parent-first multiAttest ordering makes earlier same-transaction
objects visible. A RecordVersion is indexed only on its first admission, never
again for duplicate EAS receipts. Both paginated views are maintained:

```text
(TypeId, FieldRoleId, targetKind, targetId) -> RecordVersionId[]
(targetKind, targetId) -> (TypeId, FieldRoleId, RecordVersionId)[]
```

All declared EFS references are indexed, so a complete target-first state walk
can prove absence at a named basis; ordinary opaque `bytes32` fields make no
reference claim. The reference is immutable body data, not a PIN/TAG or
endorsement. This generic seam is acceptable only if a structurally different
second app registers through the unchanged router and the fork proof bounds
gas/storage cost.

Origin types are exact:

```text
EasDeploymentRef      = (chainId, easAddress, schemaRegistryAddress)
PhysicalEasSchemaRef  = (EasDeploymentRef, schemaUid)
EasReceiptRef         = (chainId, easAddress, receiptUid)
```

Schema lookup and attestation provenance name different contracts; neither is
inferred from raw UID bytes.

## Canonical shared-name/path candidate

The recommended 1.5 ID segment is deliberately contract-verifiable ASCII:

```text
[A-Za-z0-9][A-Za-z0-9_-]{0,62}
```

The exact raw ASCII bytes are hashed and case is preserved. Dot, tilde, slash,
percent, whitespace, controls, non-ASCII, empty segments, and malformed UTF-8
all reject. Canonical ID paths contain no percent encoding or Unicode
normalization step. A URL adapter reads and splits the raw pathname before any
framework decoding, rejects every percent sign/escape, then requires each raw
segment to satisfy this grammar. Encoded letters, encoded reserved bytes, and
double-decoding therefore all reject rather than becoming ID aliases. Human
Unicode names are display metadata outside EFS-ID/1.

Path behavior:

- `/` is the root;
- `/Arcade` and `/Arcade/` resolve to the same subject;
- repeated internal separators reject;
- trailing slash never creates an empty segment;
- `/Arcade/` and `/arcade/` differ; and
- query, fragment, chain, realm, and lens never enter identity.

This candidate chooses canonical EFS subject spelling `/Arcade/` for the
Arcade vector. Legacy `/games` and the web route `/arcade` are explicit route
or migration mappings; they are not alternate bytes hashed as the same
subject. A mapping always discloses its source and target.

As an Arcade-profile rule, curator game slugs are separate moving-view slots.
Once an official slug names
a GameProject, selecting a newer GameRelease may move within that Project, but
the slug never silently changes to another Project. Retirement leaves an
explicit tombstone/redirect and provenance rather than reusing the name.

The exact ASCII range, 63-byte cap, and URL adapter vectors remain subject to
independent review, but an unverified client-side Unicode normalization boundary
is not an acceptable fallback.

## Content and artifact separation

`contentHash` never enters DataId and is never used as its salt.

- DataId answers “which publisher-owned EFS object/lineage?”
- ArtifactManifest identity answers “which exact canonical member closure?”
- a typed digest (`f1220<sha256>` in the first profile) verifies member bytes;
- MIRROR answers “where are bytes claimed to match this exact digest/manifest?”;
  the publishing workflow verifies before submission and every strict reader
  verifies fetched bytes before use, but an on-chain resolver cannot fetch a
  URL and independently prove that assertion; and
- an upstream source with different bytes is provenance, not a mirror.

Identical bytes under different authors/releases may have different DataIds.
Multiple gateways for one CID are locator plurality, not proof of independent
custody or replication.

## Provisional smoke vectors

These were recomputed with ethers `AbiCoder` on 2026-08-07 and independently
rechecked after the RecordVersion, FieldRole, EfsObjectKind, and
subject-qualified PIN additions. They are smoke values, not reviewed golden
vectors or a substitute for the differential suite.

```text
ROOT_TAGDEF_ID
  0x431596efe354726c62a0973a90d86cb065f7ef218fae6ed0162b8a3ad5813183

DOMAIN_TAGDEF
  0x81fc67d4b482c1dd534a062e9419f45e015e50723880758155ab9aa0a5c25585

Vector-only private key `0x11` repeated 32 bytes derives address
`0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A` and PrincipalId
  0x00000000000000000000000019e7e376e7c213b7e7e7e46cc70a5dd086daff2a

nameHash("Arcade")
  0xa2005729cb262264a435052344149441c9760a067bea377b7f7048b787c4d2fc

TagDefId("/Arcade/")
  0xae27eb48d80b91bede8b93293e46bba950a95fd8186f7ec07865f0d80b32a6ca

DataId(principal above, salt = 0x42 repeated)
  0x71fcaec62542720696f2c3ff52b4f23c7efa875242b8657141e1e1b09cc27241

TagDefId("/Arcade/Release/")
  0x4fd683b0fc53a0d1dc66cabda5c74b250c000a004d3adcf48fc76c492a9c9835

TypeDescriptorV1 fixture: publisher = principal above, name = `GameRelease`,
version = `1.0.0`, and one `bytes32 project` field declared as a DATA reference.
The 176 descriptor bytes hash to:

  0x620ff0f2e52cd47f0904bd4bcdbb6f1230beae3733aa75c10f75218bbe74c94b

TypeAuthorizationV1 authorizationMessage
  0x79847d01af527a70ec755fd6b120de14ea2139ecccac30ec5e79ed88218f134a

EIP-191 authorizationDigest
  0xc0f8e9d43b61b7c014b893fdcb41a0c6f0dc1190bd312bf4448d578b55e29e29

EIP-191 signature (recovers the address above)
  0x02bf19488ceecd99e3927fb628c078f0e362392c298bf6782e6a8030c46d4de310bf0f03787505ea0ad9bba733d7f39c9701e89266ef8afc21cd2c0dd14b768f1b

ShapeId
  0xb10c845bd68865979c80c29354694427acf9001120877351663ef54c916b4082

TypeId
  0xdd9fca83ba36da1ef6a781f05a6625e5b5f8c89d2c91f4131c891cf4d54fd63a

Exact physical schema string
  bytes32 efsDataId, bytes32 efsRecordVersionId, bytes32 efsRecordBodyCommitment, bytes32 efsTypeId, bytes32 efsShapeId, bytes32 efsBindingVersionId, bytes32 efsDataSalt, bytes32 project

Exact physical schema string hash
  0x22374a3579baba8557fed0cbbd6ba20a27b51b765985880577a0b7cc80b11b5e

canonicalApplicationBodyBytes = the DataId above, as the one `bytes32 project`
reference

applicationBodyHash
  0xe70887f53cfd484c583b4728ba5c924b0f76389dd04fd743c19fb046fb34fd70

RecordBodyCommitment
  0x874c626ff77c7becb515e98c82a43a005d947cdd46d5b9694b5b787bba20c4d6

RecordVersionId
  0x4950adfc750c871d28a2e68922bfba74c3bc62cfa09ddef9148fbf8d17e80732

FieldRoleId(TypeId above, field index 0, field name "project")
  0x1954110e35d6cea965e9d64da623f251ab282ba3d3b7a20a171944686ec76666

PIN slot for that principal, release definition, DATA subject above,
OBJECTKIND_RECORD
  0xd1930f5f317c96fe78b8ab1c4cb3087f5b6821295e16e986978ca017d26df850

PIN semantic edge to that RecordVersionId, no expiry
  0x7b3e956a184febcec47a0a19c3993bf9b5e2d6d583d8a8650f31206e10ab3fe6

TAG slot for that principal, /Arcade/, OBJECTKIND_DATA, DataId above
  0x7ee0f24da9dbc461df20b7ba50072eef7c811848eb6573b8f8fc2445de7d3822

TAG semantic edge for that membership, weight 1, no expiry
  0x396065d9d01b077f56601da6ee850ab1dd5fe742a663d1b087ca1938794b3abc

Binding fixture: chainId 11155111; EAS/registry/router/validator/policy addresses
are 0x22/0x33/0x44/0x55/0x66 repeated 20 bytes respectively; validator config
is 0x0102 and policy config is 0xa0. Runtime hashes are
D("fixture.router.runtime"), D("fixture.validator.runtime"), and
D("fixture.policy.runtime").

EAS-CARRIER/1 SchemaUIDs (TAGDEF, DATA, PIN, TAG)
  0x58f60a0d5b4f7806e36056a90d3f9cabf541b06e6986a5f0de4ce57614ba8a7c
  0x595dc66da7bdb520b5cfa6d51a5af358381dfc5eb7edb4ae6471d6d0d89a1018
  0xe223ad279330c3bdd197d2c0cd6273a9af9faeb07837efa4d562624836f26abd
  0x721aa78b2c3c09d628d4f139049837ddce70a99123678aa3857df37bd14252f5

GameRelease physical SchemaUID
  0x58e7b9f9765f71fa7135e64779d7bc4ae93b0460dfba391a96769014c89da890

EasDeploymentId
  0xb6ef8157ea02dce96c618f83c311986d4c95a9b05a0dc197b4fd91a33d9c0c30

PhysicalEasSchemaId(GameRelease)
  0x8f0065844bae2f3d94f92487a0068c5b2b0269ce808bdbdb8adf64984cfa04dd

Router/validator/policy runtime code hashes
  0x2e70c51d9271e930dda6caa7eba55991099d206acda54aa92d7cd5adf3902b51
  0xa676fadde31d660c133b82a6277d8523d52c98fd8d71cd3813426293fa1b723c
  0xee7c8efae64869cb4ce090d1ce43c3b50700f3bf255fc2119d3fb70831d4ed98

ValidatorConfigHash / PolicyConfigHash
  0x22ae6da6b482f9b1b19b0b897c3fd43884180a1c5ee361e1107a1bc635649dda
  0xfec18a9ddb06077929803cdc92f56c05e3eaa46edb2fa1ae550563b37906c77c

ValidatorId / AdmissionPolicyId
  0x55c4206fe1783ac80b9b08fbd6cc27d68da3bb03bba6a5da3a3ce02dbb0f5f02
  0x382155af62320eaa76258d2592a6f3e9901913610e3916ff0ea6121d714cb1fe

BindingVersionId / absent-modules BindingVersionId
  0xc00f02a15aaa54c4de0162c4d5378e8cb175cd6d24e663d1355adbffebae6c62
  0xef5e3e735dc65b61c2bd1c4f4027035880dbd127208e5959471979f7e4c16b8b

BindingRecordKey(binding above, RecordVersion above)
  0x4edb325fab52fef9e78e81d9fbab515bfb2fa88ef813defe9201e38d9504c6a4

EFS15_VALIDATOR_OK / EFS15_POLICY_OK magic
  0x7cb8e94f / 0x2a739036
```

The repeated `0x11` private key and `0x42` salt are public vector fixtures,
never production credentials or entropy.

## Required golden and failure suite

- Every domain/role/object-kind constant and pairwise-distinctness assertion.
- Root, `/Arcade`, `/Arcade/`, case difference, and repeated separator.
- ASCII grammar boundary; case difference; dot, tilde, slash, percent,
  whitespace, control, non-ASCII, and malformed UTF-8 rejection; 63-byte accept
  and 64-byte reject.
- URL encoded-slash, encoded-percent, alternate spelling, and double-decoding
  failures.
- Two full-width principals with identical low 160 bits derive different IDs;
  the 1.5 address adapter rejects the non-address-shaped one.
- Zero salt reject; same principal/salt equality across realms; principal/salt
  inequality.
- DataId unchanged by content, chain, schema, resolver, time, and EAS UID.
- TypeDescriptor exact-byte length, name-word padding, numeric-version
  endianness, canonical type-code spelling, reserved-name rejection, duplicate
  fields, trailing bytes, and reference-kind/type compatibility.
- TypeAuthorization EIP-191 digest/signature recovery; wrong publisher,
  high-s, bad-v, ERC-2098, and malformed signatures reject; the same authorized
  descriptor relays across chain/router and multiple valid signatures remain
  one idempotent registration.
- ShapeId changes with codec/name/type/order but not reference declarations;
  TypeId changes with publisher/name/version/shape/reference declarations.
  Same-ID/same-bytes registration is a no-op and same-ID/different-bytes
  rejects.
- RecordBodyCommitment and RecordVersionId change with type, shape, or canonical
  body but not realm, binding, receipt, locator, or curator; same DataId plus
  divergent bodies across realms yields different exact IDs.
- FieldRoleId changes with TypeId, field index, or field name; duplicate
  descriptor names/roles, more than 16 fields, and more than eight references
  reject.
- PIN target changes edge but not slot; subject or target-kind changes slot;
  `(OBJECTKIND_NONE, ZERO)` is the only subjectless form and every nonzero
  subject passes its kind-specific admission check.
- TAG target/target-kind changes slot; weight/expiry changes edge but not slot.
- W64 overflow rejects; TAG vectors cover weight `-1`, `int256.min`, and
  `int256.max` for Solidity/TypeScript two's-complement parity.
- PIN/TAG role transplant yields distinct IDs.
- Raw EAS UID disguised as a checked target rejects; unknown/zero target kind,
  missing parent/definition/target reject.
- Shared duplicate and DATA retry cause no duplicate semantic state.
- Receipt aggregation across retries; PIN A→B→A and TAG weight 1→2→1; delayed
  retry rejection; duplicate/noncanonical/current revocation; no resurrection;
  expired head no fallback.
- Native revocable-flag mismatch, nonzero native or semantic expiry, malformed
  resolver value/payment, ABI/trailing bytes, noncanonical scalar padding/range,
  dynamic EAS-ABI/1 fields, and `isAttestationValid`-without-liveness failure
  cases.
- Nonzero recipient and nonzero refUID reject on every EAS-CARRIER/1 and
  EAS-ABI/1 schema even when the referenced EAS receipt exists.
- Exact TAGDEF/DATA/PIN/TAG schema strings, SchemaUIDs, word counts/order, and
  TAGDEF dynamic round-trip canonicality match Solidity and TypeScript; TAGDEF
  payloads outside 160-to-192 bytes reject before dynamic decode.
- Permissionless registration of a structurally different second app through
  the unchanged router; exact prefix/schema-string derivation; forged
  schema/router/binding/module identity rejects.
- Binding replay is idempotent; no deactivate path exists; module runtime-code
  drift, gas-cap/reentrancy failure, revert, wrong return length, oversized
  hostile return data, and wrong magic all fail atomically without arbitrary
  returndata allocation.
- Stateful policy direct-call rejection; first binding-record pair calls modules
  once; same-pair retry skips side effects; a new binding reruns modules; direct
  codehash drift rejects a duplicate without changing historical evidence.
- An app-defined retraction does not change immutable RecordVersion
  `realmActive`, records-by-type, or backlink results; a named reader policy may
  still treat it as ineffective.
- Known-type and target-first reference indexes agree, remain duplicate-free,
  and expose cursor/basis/completeness.
- The fixture's `project` reference to its own freshly derived DataId succeeds
  as a staged lineage dependency; an unrelated unregistered DATA target fails.
- Two realms share edge bytes while origin-scoped receipts/revocation stay
  independent.
- Parent-first same-batch success, shuffled dependency failure, and full
  rollback.
- Enumerable-state reconstruction equals point and enumeration views without
  historical logs.
- Solidity↔TypeScript differential fuzz over every formula/name vector.
- EFS-ID/1 remains resolvable beside a synthetic EFS-ID/2 successor.
- The incompatible reopened v2 TAGDEF-kind-word and five-word SLOT layouts do
  not ship under EFS-ID/1's `efs.id.tagdef.v1`/`efs.id.slot.v1` domains.

## Open questions

- [ ] Independently review exact printable domains, ABI word order, nonzero
  root, omitted TAGDEF kind word, and target-kind-complete slot formulas.
- [ ] Resolve the explicit v2-draft TAGDEF/SLOT domain collision: v2 adopts the
  frozen 1.5 formulas or renames its incompatible profile before either freeze.
- [ ] Independently review the restricted ASCII grammar, 63-byte boundary, and
  URL adapter behavior; keep Unicode display labels outside the ID preimage.
- [ ] Confirm `/Arcade/` as the canonical EFS subject spelling and publish
  explicit mappings for legacy `/games` and web `/arcade`; do not treat aliases
  as equal ID preimages.
- [ ] Decide whether reserved `expiresAt` and TAG weight belong in
  `SemanticEdgeId`; the 1.5 MVP still rejects nonzero expiry.
- [ ] Independently review the `TypeDescriptorV1` bytes, type/reference codes,
  ShapeId/TypeId folds, exact seven-field prefix, and binding/module identities;
  keep `OBJECTKIND_TYPE` targeting reserved unless a product needs it.
- [ ] Benchmark the selected hard bounds and immutable router gas maxima for
  descriptor-declared typed references and their paginated reverse index.
- [ ] Let the Arcade portable profile freeze `ArtifactManifest/1` canonical
  bytes and identity independently; do not put its digest into DataId or make
  it a core EFS-ID/1 kind.
- [ ] Specify the durable realm-local admission ordinal and two-fold
  receipt/slot state machine in contract-ready form.
- [ ] Prove full-body state reconstruction, gas bounds, EAS behavior, races,
  retries, revocation, and successor coexistence on a Sepolia fork.
- [ ] Run an independent namespace/cryptography review and two-language
  differential fuzz before calling any smoke value golden.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

No implementation is authorized by this draft. A passing standalone ID library
and fork proof produce the contract/SDK handoffs; they do not promote this spec
without the normal owner ceremony.
