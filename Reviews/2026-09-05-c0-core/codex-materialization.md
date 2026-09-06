# Materialize one exact C0 Codex, not an onchain interpreter

**Status:** selected reversible architecture for the next C0 artifact; no
complete Codex bytes, enabled G3 proof or initialized Core are claimed here.

## Selection and alternatives

For this closed immutable run, independently serialize and validate the full
Codex offchain, then compile its expected length/hash and needed derived
constants into the actual Core artifact. The constructor requires the exact
length and `keccak256(codexBytes)` to match those **compiled expectations**,
not a hash supplied alongside the caller's bytes. Retain the complete exact
bytes for independent readback. Generated offsets/lengths locate the concrete
AUTHORITY, INDEX and capability material; validate them against both readers
before compiling. No mutable decoder registry or runtime bytecode dispatch.

This is smaller than implementing a general onchain Codex language parser
for a single accepted artifact. Merely accepting a caller's self-consistent
hash is insufficient. A general parser could support multiple artifacts per
runtime, but that flexibility is not a C0 requirement and adds code-size and
validation surface. A later run may use a new generated artifact/runtime;
this is not a permanent decision that EFS cannot evolve.

Exact matching establishes byte identity, **not source correctness or
capability execution**. Two independent full serializers/readers must agree
on literal vectors and interpret every active row. G3 still exercises actual
endpoints; G0 still verifies templates/compiler/link-map/runtime dependencies.
The [real initializer](initialization-boundary.md) still compares seed Codex,
derived Type-root and capability-root commitments against these exact bytes.

The dependency order remains acyclic:

```text
exact Type and owner-module inputs -> Codex + expected hash/metadata
  -> generated Core/template artifact -> experiment seed
  -> linked deployment -> deployment commitment -> initialization
```

Codex may not contain its enclosing hash, experiment seed, final deployment
commitment or deployment-specific Core address. The [initialization selection](initialization-boundary.md)
is separately seed-committed; configurable run values are not smuggled into
a universal protocol constant table. Hashing a prose file or an empty owner
module cannot replace concrete materialization.

## Closed overlay inventory

Select outer `codexRevision=2` for the C0 overlay, preserving MC version 1
and the distinct protocol major/minor values 0/0. Preserve portable
Record/Envelope/Occurrence/Principal/Type identity formulas. This does not
relabel the changed artifact as B0 revision 1.

| Owner | Retain or change | Materialization gate |
|---|---|---|
| Outer encoding | Actual bounded field/constraint/algorithm grammar and active domains; concrete derived IDs from retained groups. | Inventory every retained/changed/omitted row; no silently active metadata for absent behavior. |
| Derived Type inventory | Intrinsic meta-Type and actual group-2 BindingSet/Tombstone/Withdrawal members, not B0 singleton candidates. | Recompute exact IDs from original group bytes; omit unsupported B0 intrinsic evolution schemas rather than zero placeholders. |
| AUTHORITY | Exact [revision-2/verifier-C001 programs](authority-module-boundary.md); composite/direct profiles 6/7; same-Principal session is a required later branch. | Complete branch/error/basis/retention/grant/metering bytes and implementation. No unimplemented profile may be ACTIVE. |
| INDEX | [Exact revision-2 inventory](index-materialization.md): fourteen limits, thirteen code tables, retained cursors/contexts, Scope kind10, fixed RAW_AUDIT kinds8/10 and one 101-byte manifest. | Independently serialize/read the selected rows; verify the capability getter returns the same manifest bytes. |
| C0 admission/bootstrap | Exact request, batch-evidence, initialization-selection and V2 run/deployment grammars. | Classify local format/derived bounds separately from universal field limits; do not duplicate AUTHORITY or INDEX-owned constants. |

The [read overlay](read-overlay.md) closes the source-group readback,
unsupported-query and actual returndata-size gaps. `selectBestLocator` is
outside the eighteen C0 capabilities: no active selector/layout/context or
promise of its ranking behavior may be copied in and then left unimplemented.
Existing numeric codes kept by the overlay retain their values; omission is
not renumbering or reassignment. The [outer sheet](outer-materialization.md)
and linked INDEX sheet are the exact serializer inputs; unresolved owner
programs and dependency/result inventory cannot be invented from this
architecture note.

An intermediate artifact with session explicitly reserved/unsupported can
test encoders and composite/direct work. It is **not a complete C0 Codex or
valid full run**. The final artifact requires all eighteen G3 rows enabled
and backed by real bounded endpoints, plus the complete session journey.
There is no late mutable bit flip to promote the intermediate artifact.

## Source-to-C0 outer-table disposition

The following closes which B0 material may enter the active outer inventory;
the [outer row sheet](outer-materialization.md) now supplies exact revision-2
framing, numeric/code tables and fixed grammar. ABI_RESULT still requires the
actual joined Core. Source: encoding §§1.3/1.6/2.6, current TypeGroupParser,
RecordBody/IndexKeys and StateStore. Omitted portable meanings are not reused.

| Rows | C0 disposition |
|---|---|
| Type group, Type, Record, Envelope, Occurrence, Principal, Realm, RealmRevision, Position, Binding, core Profile, RealmGenesis domains | Retain exact B0 preimages/formulas. `DOM_PROFILE` is coreProfileId, not C0's WritePlan profile. |
| PK, scalar, digest and occurrence-target domains | Retain; append Scope's exact `efs2/vk/binding-scope/1` once. |
| DOM_LEAF, DOM_INTENT, compound-value domain | Omit from active Core inventory: no leaf subvariant, B0 AdmissionIntent or compound-index execution is selected. Do not alias these to WritePlan. |
| DOM_SLOT_LOG/PH/PD/TM/RM/EM/PM/PBO/TBO/BH/REV/CTR and EIP1967 admin/implementation words | Omit: Solidity-mapping physical layout and immutable C0 do not implement these addresses or proxy slots. Actual packing/layout is revision/codehash-qualified PHYSICAL_LAYOUT. |
| FIELDROLE, PURPOSE, PLAN_PURPOSE, LENS_SEM_B0 tags | APP_PROFILE for the separate Binding-position/Lens/application recipes, preserving any used formulas. No implicit general Core Lens interpreter. |
| Fixture, bakeoff and measurement/result domains | EVIDENCE_ONLY, not active Core semantic constants. |
| Five digest algorithms | Retain exact codes/lengths/names: 0x11 sha1/20, 0x12 sha2-256/32, 0x13 sha2-512/64, 0x1b keccak-256/32, 0xef01 git-sha1-object/20. Vocabulary support is not security endorsement or every content profile's acceptance. |
| Fourteen field kinds and three constraint kinds | Retain numeric meanings. DIRECT selector 0 is supported; ARRAY_STRUCT_MEMBER selector 1 is reserved/unsupported in this parser, not redefined. |
| Numeric structural error codes | Retain 0–9 and 11–17 with the original gap. Actual Solidity wrapper/kernel/bootstrap/query errors need the separate exact ABI_RESULT registry. |
| Numeric limits | Retain encoding §2.6 structural values and protocol0/0, sentinel65536, Realm gas floor16777216. MC version appears once in the header; MAX_INDEX_SPECS appears once in INDEX. Omit the operative POLICY_GAS_MAX row from this fixed-null-policy runtime. |

The complete parser scope must accompany the artifact: ASCII schema metadata,
DIRECT-only references, conservative supported OPTION/schema-depth and reference
extraction rules are C0 acceptance restrictions, not a claim of full unchanged
B0 grammar acceptance. Keep the established Type bytes and identities intact.

## Encoding-owned C0 domains and exact raw strings

Retain the twelve identity domains and four key domains above in their B0
table order, append Scope's `efs2/vk/binding-scope/1`, then append the following
eight rows in the printed order. Thus the selected revision-2 outer domain
table has **25 rows**. Its existing `u16 count`, then `u16 len || asciiBytes`
framing remains unchanged; the symbolic names below aid review but are not
extra bytes in this domain section. Each domain word is `H(exactAsciiValue)`.

| Name | Exact ASCII value |
|---|---|
| DOM_EXPERIMENT_SEED | `efs2/mvp-c0/experiment-seed/2` |
| DOM_EXPERIMENT_DEPLOYMENT | `efs2/mvp-c0/experiment-deployment/2` |
| DOM_C0_PROFILE | `efs2/mvp-c0/profile/1` |
| DOM_ORDERED_TYPE_GROUPS | `efs2/mvp-c0/ordered-type-groups/1` |
| DOM_INDEX_CAPABILITIES | `efs2/mvp-c0/index-capabilities/1` |
| DOM_INITIALIZATION_SELECTION | `efs2/mvp-c0/initialization-selection/1` |
| DOM_NULL_POLICY | `efs2/mvp-c0/null-policy/1` |
| DOM_INITIAL_POLICY | `efs2/mvp-c0/initial-policy/1` |

These are encoding-owned PROFILE interpretation constants, not optional
measurement metadata. INDEX owns the capability manifest's layout and rows,
but does not define a second domain constant. The manifest's leading domain
word is a use of this constant, not a duplicate constant-definition row.
The old V1 run codec remains unchanged evidence; its `/1` seed/deployment
domains are not additional active V2 rows.

Immediately **after the domain table and before named numeric constants**,
add the following revision-2 section. Integers use the outer format's
big-endian widths. Strings are exact ASCII bytes without NUL termination.

```text
u16 rawStringCount = 6
for each row, in the printed name order:
  u16 nameLen || asciiName || u16 valueLen || exactAsciiValue
```

| Name | Exact ASCII value |
|---|---|
| C0_INITIALIZATION_SELECTION_LABEL | `c0/init-selection/1` |
| C0_SEED_NAMESPACE | `efs2/mvp-c0/2026-09-03` |
| PUBLICATION_DOMAIN_NAME | `EFS2-Envelope` |
| PUBLICATION_DOMAIN_TYPE | `EIP712Domain(string name,string version)` |
| PUBLICATION_DOMAIN_VERSION | `1` |
| PUBLICATION_ENVELOPE_TYPE | `PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)` |

All six raw-string rows are encoding-owned PROFILE constants. Require the
exact count, names, order and values; reject duplicates, unknown/missing rows,
truncation and length mismatch. These are not domain-preimage rows subject
to the `efs2/...` domain grammar or its 64-byte bound: in particular the
PublicationEnvelope type string is longer. This section does not introduce
arbitrary user-provided string constants or change any portable identity.
Existing outer sections preserve their relative order; the supplemental
constant/grammar insertions are explicit in the [outer sheet](outer-materialization.md).
With the exact names/values above, this raw-string section is414 bytes,
including its two-byte count; use that independently derived length as a
literal framing check, not a substitute for validating every row.

AUTHORITY constants31–36 remain the sole definitions of its six
WritePlan/effects/CAS strings. The Publication domain version `1` above is a
distinct semantic constant, not a second definition of the WritePlan domain
version. Their equal raw value does not merge the two protocols.

Source checks: [C0PlanCodec](src/C0PlanCodec.sol) publication type/domain;
[C0RunCodecV2](src/C0RunCodecV2.sol) V2 domains and reserved source label;
the unchanged [V1 input codec](../2026-09-04-mvp-c0-foundation/src/C0RunCodec.sol)
still enforces that exact namespace inside V2;
[C0InitializationSelection](src/C0InitializationSelection.sol) selection and
policy domains; [bootstrap inputs](bootstrap-inputs.md) ordered-group and
capability commitments; [AUTHORITY ownership](authority-module-boundary.md)
constants31–36. The bootstrap source and deployed codec comparisons are
covered by the [closed codec checkpoint](bootstrap-codecs-verification.md).

Keep the domain uses distinct. With `H = keccak256` and `abi = abi.encode`:

- Experiment seed is `H(abi(DOM_EXPERIMENT_SEED, H(seedBytesV2)))`;
  deployment commitment is
  `H(abi(DOM_EXPERIMENT_DEPLOYMENT, experimentSeed, H(deployBytesV2)))`.
- C0 profile is `H(abi(DOM_C0_PROFILE, experimentCommitment))`, not the
  separate B0 Core profile formula that commits the complete Codex.
- Ordered-group manifest is `abi(DOM_ORDERED_TYPE_GROUPS, bytes32[4])`;
  its hash is retained once as the capability manifest's ordered Type root.
  The capability root hashes the exact complete 101-byte packed manifest.
- Selection begins with its domain word in the nine-word ABI transport;
  its complete hash occupies the seed source row with the reserved label.
- Null-policy **bytes** are `abi(DOM_NULL_POLICY)`; `nullPolicyHash` hashes
  those bytes and is **not** the domain word itself. Initial policy is
  `H(abi(DOM_INITIAL_POLICY, nullPolicyHash, experimentCommitment))`.

For C0, extend REALM_CONFIG's transport inventory beyond B0's
InitConfig/RealmRevision to the retained SeedV2, DeploymentV2 and
InitializationSelection transports. Selected executor, selection digest,
run ID, authors, salts, addresses/code hashes, finality, chosen limits and
derived seed/deployment/profile/policy IDs are run values, not extra literal
PROFILE constants. Their interpretation rules and framing bounds still
require the exact PROFILE inventory; moving their values here cannot hide a
missing rule. Construction/measurement reports remain EVIDENCE_ONLY while
their authenticated commitments remain mandatory run inputs. Getter/error/
result signatures belong to ABI_RESULT, not this domain or raw-string table.

## Selected exact intrinsic opening and derived Type rows

Use the **existing85-byte Core candidate** for this disposable full-C0
artifact, not the older admission probe's differently named/meta-described
Type. No new descriptor design or changed application Type bytes are needed.
The selected descriptor is `TypeSchemaGroup/1`, empty meaning, absent
specDigest, zero qualifier, one `groupBytes BYTES(max8190)` field and no
roles/indexes/constraints. Its exact encoding is:

```text
blob = hex"0001001154797065536368656d6147726f75702f31000000"
       || bytes32(0)
       || hex"0001000a67726f75704279746573051ffe0000000000000000"
rawGroup = uint16(1) || uint16(81) || blob
```

The blob is81 bytes, raw group85. Its group hash is
`0xfb8f8bc5451b7f4c0f310320a566a57bc35d4c4f5ca796632ac2248545536bde`.
Root independently compared this literal against the current fixture encoder
and derived the ID using the separate Type-input reader. The initializer must
match this exact retained group opening and its derived meta-Type, not merely
accept any group with a shape-compatible one-field schema. This selects the
reversible experiment artifact; it freezes no permanent Type identity.

The final derived-ID section has `idCount=4`, named rows in this exact order,
with unchanged `u16 nameLen || asciiName || bytes32 id` framing:

| Name | Exact derived ID |
|---|---|
| TYPE_BINDING_SET_V1 | `0x3d40b6b53db7885be062d89270f41085fa8c59738cbc66fe28857d0573ef3a91` |
| TYPE_BINDING_TOMBSTONE_V1 | `0xd9a17f2bdf9d885520b42b39778ec88f792b9b5a4fe0851cc388b2932b31add1` |
| TYPE_SCHEMA_GROUP_V1 | `0x8579a7ae3b45b341133398999f7113e2abf5d01c5f8a4f78b3d7927dd754293d` |
| TYPE_WITHDRAWAL_V1 | `0xc8261b4f9cd91e465be894c8fc41f45bc5a221b08db1ef8a610325b439b9c605` |

Only the meta-Type is installed intrinsically at G2. The three kernel-known
ordinary Types are group2 members0/1/2 and still enter through ordinary G4
admission; this table identifies them, not pre-admits them. Root recomputed
their IDs from the original group bytes with the independent parser and prior
group closure, rather than trusting the candidate JSON's supplied IDs.
Omit B0's unsupported intrinsic evolution Types, with no zero placeholders.

## Validation and remaining work

1. Use the selected [outer inventory](outer-materialization.md) alongside
   INDEX/domain/raw-string inputs. Complete ABI_RESULT and session/error
   programs, and classify the remaining dependency budgets; distinguish inert
   metadata from executable promises explicitly.
2. Implement two independently structured full encoders/readers, strict
   original-input validation and literal vectors; reject reordered/duplicate/
   missing/unknown rows, extra/truncated bytes and cross-version confusion.
3. Generate the small expected-hash/length/offset/derived-ID Solidity input.
   Independently compare generated constants to retained complete bytes.
4. Join construction/initialization/readback; reject caller-substituted but
   self-consistent Codex, wrong capability/Type roots and dependency artifacts.
5. Execute enabled capabilities and measure complete runtime/initcode/gas and
   contract-consumer returndata. Exact hash agreement cannot close these tests.

What could have been simpler: earlier bootstrap prose mixed a generic B0
interpreter description, C0's narrower support and physical layout choices.
Selecting one exact artifact removes that unnecessary implementation question
while making unsupported rows and remaining runtime work explicit.

No owner answer is needed for this disposable architecture. A permanent
Codex, protocol scope/freeze or release remains human-gated.
