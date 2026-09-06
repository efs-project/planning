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
| INDEX | Versioned B0-owned limits/codes/cursors plus Scope kind10, fixed RAW_AUDIT kinds8/10, exact read overlay/errors and one 101-byte manifest. | Fix full framing/table order once; verify the capability getter returns the same manifest bytes. |
| C0 admission/bootstrap | Exact request, batch-evidence, initialization-selection and V2 run/deployment grammars. | Classify local format/derived bounds separately from universal field limits; do not duplicate AUTHORITY or INDEX-owned constants. |

The [read overlay](read-overlay.md) closes the source-group readback,
unsupported-query and actual returndata-size gaps. `selectBestLocator` is
outside the eighteen C0 capabilities: no active selector/layout/context or
promise of its ranking behavior may be copied in and then left unimplemented.
Existing numeric codes kept by the overlay retain their values; omission is
not renumbering or reassignment. The exact outer/INDEX row sheet is required
before serializer implementation, not a license for an implementer to invent
missing tables from this architecture note.

An intermediate artifact with session explicitly reserved/unsupported can
test encoders and composite/direct work. It is **not a complete C0 Codex or
valid full run**. The final artifact requires all eighteen G3 rows enabled
and backed by real bounded endpoints, plus the complete session journey.
There is no late mutable bit flip to promote the intermediate artifact.

## Source-to-C0 outer-table disposition

The following closes which B0 material may enter the active outer inventory;
the exact revision-2 framing and string/result registry are the next bounded
serializer spec. Source: encoding §§1.3/1.6/2.6, current TypeGroupParser,
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

Before serializer dispatch, select one encoding-owned raw-string table for
the unchanged PublicationEnvelope type/domain strings; B0's template does not
already encode them. AUTHORITY's six WritePlan/effects/CAS strings remain only
in their current owner constants. Classify the C0 `/2` seed/deployment domains,
profile `/1`, ordered-group/capability/selection/null-policy/initial-policy
domains and reserved source label explicitly; their interpretation is fixed,
but executor/salts/finality and chosen limits remain run inputs. No dummy
value or prose hash resolves these missing framing rows.

## Validation and remaining work

1. Finish the exact outer/INDEX inventory and complete session/error program
   rows. Distinguish inert metadata from executable promises explicitly.
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
