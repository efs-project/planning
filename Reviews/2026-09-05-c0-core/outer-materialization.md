# Exact C0 outer Codex inventory

**Status:** selected reversible serializer input; no encoded full Codex,
complete AUTHORITY/session module or initialized Core is claimed.

This supplies the remaining outer row/framing input to
[Codex materialization](codex-materialization.md). Retain its exact domain,
raw-string and derived-ID tables as the single written source for those rows.
The [INDEX sheet](index-materialization.md) and
[AUTHORITY sheet](authority-module-boundary.md) own their embedded modules.
Source framing is [B0 encoding §1.6](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md).

## Closed frame

Unsigned integers are fixed-width big-endian; names are exact ASCII, no NUL.
The following order is exact. Existing sections preserve their relative order;
the raw-string section, supplemental constants and grammar dictionaries are
explicit additions first specified in outer revision2. The
[V3 dependency refinement](dependency-deployment-v3.md#active-codex-interpretation)
selects still-unminted outer revision3/grammar2 for the new run framing;
embedded owner-module revisions and other row meanings are unchanged.

```text
u16 codexRevision=3 || u16 mcVersion=1
DomainTable[25]                         // existing u16 count, u16 len + bytes
RawStringTable[6]                       // exact414 bytes, selected sheet
u16 constCount=25 || NumericRow[25]
u16 c0ConstCount=6 || NumericRow[6]
u16 wordCount=0
u16 algCount=5 || AlgorithmRow[5]
u16 kindCount=14 || SmallCodeRow[14]
u16 selCount=2 || SmallCodeRow[2]
u16 errCount=17 || WideCodeRow[17]
u16 cstrCount=3 || SmallCodeRow[3]
u16 c0GrammarTableCount=3 || GrammarTable[3]
u16 ownerModuleCount=2
  u16 moduleCode=1 || u32 moduleLen || exactAuthorityBytes
  u16 moduleCode=2 || u32 moduleLen || exactIndexBytes
u16 idCount=4 || NamedIdRow[4]

NumericRow := u16 nameLen || asciiName || u64 value
AlgorithmRow := u16 algCode || u16 digestLen || u16 nameLen || asciiName
SmallCodeRow := u8 code || u16 nameLen || asciiName
WideCodeRow := u16 code || u16 nameLen || asciiName
GrammarTable := u16 nameLen || asciiName || u16 rowCount || WideCodeRow[rowCount]
NamedIdRow := u16 nameLen || asciiName || bytes32 id
```

Domain/raw tables include their existing counts, not a second count around
them. The algorithms' exact ascending code/length/name triples and four
derived IDs remain in the selected sheet. No EIP1967 or other fixed-word
placeholder survives. Require exact counts/names/codes/values/order and exact
module consumption; reject unknown/duplicate/missing/reordered rows, invalid
lengths and trailing bytes. No enclosing hash, seed, address or deployment
commitment appears in these fixed outer inputs.

## Twenty-five universal numeric rows

```text
MAX_BODY_BYTES=8192
MAX_TYPESCHEMA_BYTES=8192
MAX_GROUP_SIZE=16
MAX_FIELDS=64
MAX_REFERENCE_ROLES=16
REF_INSTANCES_MAX=16
MAX_CONSTRAINTS=32
MAX_NEST_DEPTH=4
MAX_ARRAY_COUNT=1024
MAX_MAP_ENTRIES=256
MAX_STRING_BYTES=4096
MAX_BYTES_LEN=8192
MAX_FIELD_NAME_BYTES=64
MAX_TYPE_NAME_BYTES=128
MAX_MEANING_BYTES=2048
MAX_EXTRACT_WALK=16
MAX_ENVELOPE_LEAVES=64
MAX_ENVELOPE_BODY_BYTES=8192
MAX_BIND_LEAVES_PER_ENVELOPE=64
MAX_GROUP_BYTES=8190
MAX_DOMAIN_STRING_BYTES=64
PROTOCOL_MAJOR=0
PROTOCOL_MINOR=0
SENTINEL_BOUND=65536
REALM_MIN_TX_GAS=16777216
```

Printed order follows B0§2.6, then its§1.6 additions. MC_VERSION appears once
in the header; MAX_INDEX_SPECS belongs only to INDEX. No operative
POLICY_GAS_MAX is selected for this fixed-null-policy runtime. Structural
Envelope/body maxima are not guarantees that every legal combination fits
one transaction: the existing selected-leaf fallback and measured cap failures
remain evidence, not reasons to silently raise the transaction cap.

## Six supplemental C0 numeric rows

```text
C0_GRAMMAR_REVISION=2
C0_COMMITMENT_COUNT_MAX=64
C0_COMMITMENT_LABEL_BYTES_MAX=64
C0_SEED_V3_GUARD_MIN_BYTES=840
C0_SEED_V3_GUARD_MAX_BYTES=13818
C0_PUBLICATION_WIRE_MAX_BYTES=16384
```

These encoding-owned PROFILE constants have distinct meanings from the
universal structural limits. The seed bounds name selected V3 prechecks;
they are not tight accepted-length extrema (V3 grammar gives858..13773).
The closed V2 codec's corresponding730..13645 evidence is unchanged; V3
implementation must test its new extremes. Do not add derived-size/version
synonyms for each fixed format.

This is the smaller adequate alternative to a large table of every field
width/derived size. A lone grammar revision without these distinct acceptance
limits would make the inventory harder to audit. Six explicit rows plus a
fixed grammar retain that auditability without introducing an interpreter.

## Closed code dictionaries

Within each dictionary use this exact ascending-code order:

```text
field kinds:
  1 BOOL; 2 UINT; 3 INT; 4 BYTES_FIXED; 5 BYTES; 6 STRING;
  7 REF; 8 OCCREF; 9 PRINCIPAL; 10 DIGEST;
  11 ARRAY; 12 MAP; 13 STRUCT; 14 OPTION
reference selectors:
  0 DIRECT; 1 ARRAY_STRUCT_MEMBER
structural errors:
  0 OK; 1 ERR_TRAILING; 2 ERR_TRUNCATED; 3 ERR_BOUND; 4 ERR_UTF8;
  5 ERR_MAP_ORDER; 6 ERR_OPTION_FLAG; 7 ERR_BOOL;
  8 ERR_SENTINEL_IN_BODY; 9 ERR_DIGEST; 11 ERR_DEPTH; 12 ERR_COUNT;
  13 ERR_SCHEMA_MALFORMED; 14 ERR_CONSTRAINT; 15 ERR_REF_BUDGET;
  16 ERR_ROLE_SELECTOR; 17 ERR_EFFECT_BINDING_TARGET_CARDINALITY
constraint kinds:
  1 INT_RANGE; 2 NONEMPTY; 3 NAME_PROFILE

ReferenceTargetClass/1 (5 rows):
  1 RECORD; 2 TYPESCHEMA; 3 PRINCIPAL; 4 OCCURRENCE; 5 OBJECT
ValidationProfile/1 (1 row):
  0 INTRINSIC
ExpectedTypeSelector/1 (3 rows):
  0 ANY; 1 SELF; 256 GROUP_REF_BASE
```

Only the final three dictionaries have serialized table names, in that exact
order. Earlier dictionaries retain B0's positional framing. Preserve error
gap10. Structural error vocabulary does not map arbitrary wrapper errors to
numeric codes: actual `InvalidBody(uint16)`/`InvalidSchema()` and exposed or
bubbled Solidity signatures belong to ABI_RESULT. `INTRINSIC` does not claim
that admission performs full Unicode normalization/STRUCT-FULL.

## Exact meaning of grammar revision2

The revision selects these fixed rules together, not “whatever future code
does.” A semantic change requires a new grammar and outer artifact revision.
Unchanged Type/Record/Envelope identity formulas and underlying field/operand
widths remain in the source encoding; this does not revise portable bytes.
Relative to the earlier grammar1, only the Seed/Deployment interpretation and
run-domain selection change; schema, Request, Selection and batch rules do not.

Schema rules:

- validationProfile0 only; DIRECT/memberIdx0 only. The selector1 dictionary
  entry preserves its known meaning but is unsupported. No second selector
  support mask competes with this rule.
- DIRECT roles cover exactly REF, OCCREF, ARRAY(REF), OPTION(REF), or
  OPTION(OCCREF). Each reference-bearing top-level field has exactly one role.
  OCCREF forms require class4; expectedType must be0 outside classes1/5.
  Declaring a class is not runtime support: INDEX alone owns that support mask.
- expectedType0 means ANY;1 resolves SELF to the containing exact revision;
  256+k resolves another member with `k < memberCount <= MAX_GROUP_SIZE`,
  `k != ownIndex`, and group size>1. Other values below SENTINEL_BOUND reject;
  values at or above SENTINEL_BOUND are exact external Type IDs requiring the existing dependency
  checks. GROUP_REF_BASE is a family base, not just sentinel256.
- Schema names/role names are nonempty printable ASCII32..126; meaning may
  be empty and may contain ASCII0..127. No Unicode/NFC claim for schema
  metadata. Anonymous nested descriptors have zero-length names.
- Schema OPTION consumes one nesting level; body OPTION does not. Extraction
  uses the actual conservative sum of preceding fields' skipReads≤16. It is
  not a complete general E1 compiler. Existing field bounds, exact role/index
  eligibility, total reference budget and constraint operands remain unchanged.

Sources: [TypeGroupParser](../2026-09-05-c0-admission/src/TypeGroupParser.sol)
field/roles/resolve/extraction/text and [RecordBody](src/RecordBody.sol) decode.
In particular, ASCII **meaning** differs from named metadata's control-byte
refusal; do not silently apply the stricter name rule to both.

Fixed transport rules consume the already exact field sequences and checks:

| Transport | Selected interpretation and ownership |
|---|---|
| SeedV3 | `u16(3)` + exact existing V1 SeedInputs encoding + nine bytes32 suffix fields, in [V3 deployment](dependency-deployment-v3.md#seed-v3) order: four dependency salts, four dependency template hashes, Core link-map hash. Both commitment lists are nonempty/bounded; entries have exact u32 frame length, u16 label length, label and digest32. Labels use `[A-Za-z0-9._/-]`, strictly increasing raw-byte lexicographic order; digests nonzero. Exact namespace and one required nonzero selection-label digest. Supplemental rows bound lists/labels/precheck lengths. |
| DeploymentV3 | `u16(3)` + seed32 + Core/ByteStore/AdmissionLibrary/PreparationHelper/PointReadLibrary/QueryReadLibrary, each address20/salt32/initHash32/runtimeHash32. Derived size730. Nonzero seed/hashes and six distinct nonzero addresses; salts may be zero. Exact target-aware Core link-map2 is pinned by SeedV3, not an unnamed Admission-only map. |
| Selection/InitConfig | Existing nine-word/seven-word canonical ABI sequences in [C0InitializationSelection](src/C0InitializationSelection.sol), derived288/224 bytes. InitConfigVersion1; finality0..3 with positive parameter only for2, otherwise zero; immutable upgrade authority0/ref0; declared gas≥REALM_MIN_TX_GAS; exact null-policy hash; nonzero executor. Policy derives from the deployment commitment. |
| Request | Exact typed ABI and validation order from [C0Request](src/C0Request.sol) and [request boundary](outer-request-boundary.md). Profile1/reserved authorityRef0/authEpoch0; vectors/CAS/body limits use existing universal rows. Equivalent publication wire=`544+32N+160L+sum(ceil32(body))`, capped16384. Actual call limit=`21412+ceil32(F)` with authenticated run file cap F; ordinary ABI acceptance remains selected. |
| Batch evidence | Exact version1 packed field order from [batch evidence](batch-authority-evidence.md), implemented in [C0BatchEvidence](src/C0BatchEvidence.sol). Derive Plan220/Effects241/CAS6 and branch maxima from that one layout. Descriptor/witness/code observation rules are consumed from AUTHORITY, not redefined by another constant table. Only existing composite/direct branches are described; session still requires its own completed program/evidence specification. |

No competing fixed-size rows for730/288/224/220/241/1036. Their values follow
from the selected complete field sequences, not from independent tunable
limits. The seed's source/toolchain commitments open the actual retained
inputs; linking this prose is not a substitute for those bytes.

## Before a full artifact can be minted

This sheet closes outer serialization choices, not every dependency program
or resource setting. Complete AUTHORITY/session and ABI_RESULT against actual
public Core behavior. Explicitly classify/fix the preparation dependency's
returndata/gas budgets before claiming H-MODULE-COMPLETE; current experimental
131072/8192/163840-byte and15m/5m-gas limits are not extra universal Type limits.
Run-selected file/read caps, executor, authors, salts, finality, addresses,
codehashes and margins remain authenticated REALM_CONFIG values.

Then generate both independent encoders/readers and compare literal vectors,
all rows, offsets and exact retained bytes. Measure complete Codex size and
actual constructor/retention/runtime cost—not only each isolated module—under
normal deployment caps. A complete row inventory is not capability execution,
and a partial module cannot mint full C0 merely because it encodes cleanly.
