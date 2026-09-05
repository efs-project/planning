# Partial C0 admission probe — run codec

This is a disposable, finite admission/cache slice, not a C0 genesis, Codex,
general Core, or durable ABI. The prior sixteen candidate descriptors remain
byte-identical. All temporary choices below are explicit run inputs.

## Constructor and temporary identity

```solidity
struct Config {
    bytes32 realmId;
    address stateByteStore;
    address schemaAuthor;
    address bootstrapAuthor;
    bytes32[4] groupByteHashes;
}
constructor(Config memory config, bytes memory intrinsicGroup, bytes memory declarationInventory);
```

`groupByteHashes` are Keccak hashes of the four exact raw group byte vectors,
not Type-group domain hashes. They are distinct, nonzero, and ordered G4
6/3/6/1. `schemaAuthor` and `bootstrapAuthor` are distinct nonzero synthetic
accounts. The bootstrap author has no implemented Files action here. The
nonzero `stateByteStore` is a reserved inert fixture address in this experiment,
not a deployed/usable carrier. No byte-writing operation is admitted.

The intrinsic MC/1 group contains exactly one schema with exactly the field
`groupBytes BYTES(max=8190)`, no roles, indexes or constraints. Its name,
meaning, specDigest and qualifier are pinned temporary metadata, not an
adopted Codex ID. The parser derives its ID; it is initialized intrinsically
without an ordinary Record or Occurrence.

`declarationInventory` is retained opaque documentary bytes. It lists the
candidate grammar declarations separately from actual probe support. It is
not an active G3 capability manifest. Only Type-group admission, parsed
cache retention and the automatic indexes below are implemented. No Binding,
Lens, digest-instance lookup, scalar-instance index or arbitrary Record-body
validation is claimed by accepting member declarations.

```text
probeCommitment = keccak256(abi.encode(
  keccak256("efs2/c0-admission-probe/run/1"), realmId, stateByteStore,
  schemaAuthor, bootstrapAuthor, groupByteHashes,
  keccak256(intrinsicGroup), keccak256(declarationInventory)))
c0ProfileId = keccak256(abi.encode(
  keccak256("efs2/mvp-c0/profile/1"), probeCommitment))
```

This deliberately substitutes a named **probe commitment** for full C0's
post-deployment experimentCommitment; source/toolchain/runtime hashes are
reported separately. It cannot claim G0–G3 initialization or full C0.

## Sole write shape

```solidity
struct EnvelopeHeader {
    uint16 profile; bytes32 principalId; bytes32 authorityRef;
    uint64 authEpoch; bytes32 pubNonce; uint64 notAfter;
}
struct C0RealmEffects {
    bytes32 realmId; address core; bytes32 routeConfigId;
    bytes32 genesisReceiptHash; uint8 operationKind; bytes32 envelopeId;
    uint64 leafMask; bytes32 expectedRevisionsHash;
    address stateByteStore; bytes32 byteCommitment;
}
struct WritePlan {
    bytes32 c0ProfileId; bytes32 publicationDigest; bytes32 realmId;
    bytes32 realmEffectsDigest; address executor; bytes32 executorCodeHash;
    uint192 nonceKey; uint64 nonceSeq; uint64 notAfter;
}
function publishWithPlanC0(
    EnvelopeHeader calldata publication, bytes32[] calldata recordIds,
    bytes calldata canonicalBody, C0RealmEffects calldata effects,
    WritePlan calldata plan, bytes calldata witness
) external returns (uint8 outcome, uint64 ordinal);
```

Exactly one Record/leaf per call (`recordIds.length=1`, `leafMask=1`), and the
type is always the intrinsic meta-Type. Operation is `ADMIT_TYPE_GROUP=1`;
Route, genesis receipt, byte commitment are zero, expected-revision hash is
Keccak(empty), stateByteStore matches the configured inert address. Canonical
body is u16BE group length followed by exact group bytes, total at most 8192.

The source's Record, Principal, unsigned publication, Envelope, Occurrence,
RealmEffects and EIP-712 WritePlan preimages/type strings are unchanged:
[publication law §4.1](../../Designs/efsv2/disposable-mvp-profile.md).
`executor=address(probe)` and `executorCodeHash=probe.codehash` are the explicit
run dispatch convention. The submitter may be a separate payer. No arbitrary
executor, external validator or callback is called.

Only the configured schema author may publish; the intrinsic descriptor is
`0x0100 || address20`. Signature is exactly 65 bytes, low-s, v 27/28, nonzero
recovery. `profile=1`, authorityRef/authEpoch=0. Zero pubNonce is legal.
Expiry zero means no deadline, else timestamp <= notAfter. Nonce is per
`(principalId,uint192 nonceKey)`, starts at 1 and increments exactly once per
fresh admission; publication and plan deadlines must match.

After full binding and signature authentication, an exact existing ACTIVE
Occurrence returns `(2, existingOrdinal)` without changes, before deadline/
sequence replay checks. Fresh occurrence returns `(1, newOrdinal)`. Reusing a
Record in a new envelope gives a new occurrence and reuses equal caches.
New group Records must first appear in exact configured order; all further
group bytes are outside this finite run.

## State read ABI

```solidity
struct RecordRow { bytes32 typeId; bytes body; uint64 ordinal; }
struct EnvelopeRow {
    bytes unsignedStatement; bytes effects; bytes plan; bytes witness;
    bytes32 principalId; uint64 ordinal;
}
struct AdmissionRow {
    bytes32 envelopeId; uint16 leafIndex; bytes32 recordId;
    bytes32 principalId; uint64 ordinal; uint48 admittedAtBlock;
    uint64 admittedAtTimestamp; bytes32 witnessProfile;
    uint192 nonceKey; uint64 nonceSeq;
}
struct TypeRow {
    bytes32 groupRecordId; uint16 memberIndex; uint64 ordinal;
    uint64 admittedAtOrdinal; bytes cacheBytes;
}
function getRecord(bytes32 recordId) external view returns (RecordRow memory);
function getEnvelope(bytes32 envelopeId) external view returns (EnvelopeRow memory);
function getAdmission(bytes32 occurrenceKey) external view returns (AdmissionRow memory);
function getTypeCache(bytes32 typeId) external view returns (TypeRow memory);
function principalDescriptor(bytes32 principalId) external view returns (bytes memory);
function lastSequence(bytes32 principalId, uint192 nonceKey) external view returns (uint64);
function indexLength(uint8 kind, bytes32 key) external view returns (uint256);
function indexAt(uint8 kind, bytes32 key, uint256 index) external view returns (bytes32);
```

Row ordinal zero means not present **at the queried chain basis**, not global
nonexistence. An unavailable provider/read is UNKNOWN. `unsignedStatement` is
exactly `abi.encode(EnvelopeHeader, fullRecordIds)`, distinct from the EIP-712
hash preimage. Effects and plan are exact `abi.encode(the struct)` bytes;
witnessProfile is `keccak256("C0_COMPOSITE_EOA_V1")` as a **probe label**, not a
permanently allocated AuthorityBasisWord. Admission rows are probe evidence,
not the complete Stage A physical AdmissionReceipt/index layout.

`cacheBytes=abi.encode(TypeGroupParser.SchemaCache)` from the exact tuple in
[the plan](admission-plan.md). Roles resolve SELF/GROUP_REF in cache only;
canonical group bytes remain untouched. The intrinsic Type has ordinal 1 and
zero admission provenance; later Type ordinals follow member order. Record
ordinals and Envelope ordinals are each independently dense and one-based.

Index kinds (closed; global indexes require key=0):

1. Type IDs, including intrinsic.
2. Principal IDs.
3. Unique Record IDs by Type ID.
4. Occurrence keys by Type ID.
5. Occurrence keys by Record ID.
6. Occurrence keys by Principal ID.
7. Occurrence keys in admission order.

All reads are bounded point/index reads. This is a fixed-block inventory,
not a general COMPLETE QueryProfile or an event-only reconstruction API.
Parsed member index declarations are retained, not executed for hypothetical
future instances. All counters, rows, indexes, witness and caches change
atomically; there is no cache-registration or failure-injection write port.

Public getters: `realmId`, `stateByteStore`, `schemaAuthor`, `bootstrapAuthor`,
`metaTypeId`, `probeCommitment`, `c0ProfileId`, `inventory(uint256)`,
`intrinsicGroupBytes`, `declarationInventoryBytes`, `admittedGroupCount`,
`admissionCount`, `recordCount`, `envelopeCount`.

The finite JavaScript `readCold(source, expected)` result retains caller-pinned
source identity (`source.source` label plus expected chain/Core/profile/runtime
hash), `requestedBasis`, and `attemptedBasis`. The collector may call the supplied
`onBasis` callback after acquiring a block; `collectSnapshot` supports this hook.
A collection failure returns `UNKNOWN` with this context and `basis=null`;
malformed returned evidence returns `INVALID`, also with `basis=null`. Only a
successfully verified snapshot supplies `basis`. Requested/attempted fields are
context, not assertions of verified availability; absent context remains null.
