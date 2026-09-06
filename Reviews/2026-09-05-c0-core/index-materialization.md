# Exact C0 INDEX module inventory

**Status:** selected reversible serializer input; no encoded module, enabled
capability getter or full initialized C0 is claimed.

This closes the INDEX row/framing input for
[Codex materialization](codex-materialization.md). The [read overlay](read-overlay.md)
is the selected runtime meaning, amending the retained B0 rules. Source row
encodings: [B0 INDEX §0.1](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md).
This does not reopen portable Type bytes, admission algorithms or AUTHORITY.

## Exact frame and ownership

Unsigned integers are fixed-width big-endian; names are exact ASCII without
NUL termination. Preserve these section and row orders. Nested B0 encodings
are repeated below so an implementer need not infer their framing.

```text
indexCodexBytes :=
  u16 indexCodexRevision = 2
  u16 limitCount = 14             || Limit[14]
  u16 codeTableCount = 13         || CodeTable[13]
  u16 cursorLayoutCount = 2       || CursorLayout[2]
  u16 contextSelectorCount = 3    || ContextSelector[3]
  u16 continuationCount = 3       || Continuation[3]
  u16 kindModeCount = 10          || (u8 indexKind || u8 postingsMode)[10]
  u16 capabilityBytesLen = 101    || exactCapabilityManifest

Limit := u16 nameLen || asciiName || u256 value
CodeTable := u16 tableNameLen || asciiTableName || u16 rowCount ||
  rowCount * (u32 code || u16 nameLen || asciiName)
CursorLayout := u8 layoutCode || u8 layoutVersion || u8 fieldCount ||
  fieldCount * (u16 fieldNameLen || asciiFieldName || u16 lowBit ||
                u16 bitWidth || u8 constraintCode || u256 constraintValue)
ContextSelector := u8 selectorCode || u16 outputBitCount ||
                   u16 tokenBytesLen || tokenBytes
Continuation := u8 familyCode || u8 layoutCode || u8 contextSelectorCode ||
                u8 canonicalEndRuleCode || u8 positionRuleCode ||
                u8 endpointModePolicyCode
```

The outer manifest still embeds AUTHORITY code1 then INDEX code2, with exact
`u32 moduleLen`. No separate INDEX hash. Reject wrong versions/counts/order,
duplicate/missing/unknown rows, different names/values, malformed/truncated
lengths and unconsumed bytes. A supported intermediate artifact with capability
zeros is explicitly incomplete; it cannot mint a full C0 run.

## Fourteen limit rows

```text
ORDINAL_NONE=0
ORDINAL_MAX=281474976710655
MAX_INDEX_SPECS=8
MAX_PAGE_ITEMS=512
MAX_PAGE_ITEMS_HYDRATED=256
PAGE_SCAN_MAX=1024
PAGE_CURSOR_VERSION=1
CURSOR_END=0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
POSTING_KEY_CANDIDATE_MAX=43
POSTING_KEY_DEDUP_COMPARE_MAX=903
DISTINCT_OCCURRENCE_KEYS_MAX=43
BINDING_PROBES_MAX=48
BATCH_PROBES_MAX=64
MAX_HISTORY_PAGE=64
```

`ORDINAL_MAX` is the exhaustion boundary, not an admissible ordinal. Counts
and conversions respect the existing kernel's refusal at that boundary.
Page/hydration limits are selected inputs to the next measurement, not
maximum-gas-fit evidence. The actual hydrated ABI can return65,856 bytes.

Retire `INDEX_HEAD_TOUCH_MAX=44` and its alias `F_MAX=44` from active C0.
B0 §4.2 derived them from at most43 occurrence-family keys plus one unique-Type
transition. [StateKernel](src/StateKernel.sol) additionally appends Binding
history/first Scope anchors and changes a withdrawal target's occurrence
families. A total C0 bound cannot silently retain that narrower derivation.
The retained43/903 rows concern only candidate/deduplicated occurrence-family
keys and their pair comparisons, not total SLOADs, SSTOREs, journal entries
or gas. Existing bounded request/planner and normal transaction gas caps still
apply; measure aggregate operation/transaction work with its counting unit
explicit. Do not replace a retired estimate with an unmeasured new total.

Omit locator-selection limits32/48/80: no `selectBestLocator` is selected.
Retain the64-entry revision-number `readHistory` bound from
[B0 Binding](../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md).
Do not select optional `readHeadBatch` or `readHeadByPosition` convenience
ABIs for this Core increment; accordingly there is no `MAX_HEAD_BATCH` row.
SDK/Lens code can compute keys and issue bounded required Binding point reads.
Reconsider a convenience batch if measured consumer needs justify it. This
removes no required capability.

## Thirteen code tables

Tables/entries appear in exactly this order. Changed membership uses a new
`/2` name; retained numeric meanings are never reassigned.

```text
IndexKind/2:
  1 KIND_BY_TYPE; 2 KIND_UNIQUE_BY_TYPE; 3 KIND_BY_RECORD;
  4 KIND_BY_PRINCIPAL; 5 KIND_TARGET; 6 KIND_ROLE; 7 KIND_SPEC;
  8 KIND_BINDING_HIST; 9 KIND_DIGEST; 10 KIND_BINDING_SCOPE
IndexSpecKind/1:
  1 SCALAR_EQ; 2 REF_BACKLINK; 3 DIGEST_EQ
Completeness/1:
  0 UNKNOWN; 1 COMPLETE; 2 PARTIAL; 3 UNSUPPORTED
OccurrenceStatus/1:
  0 NEVER_ADMITTED; 1 ACTIVE; 2 WITHDRAWN; 3 PRE_WITHDRAWN
PageEndpointMode/1:
  1 PAGE_RAW; 2 PAGE_HYDRATED
PostingsMode/1:
  0 LIVENESS; 1 RAW_AUDIT
IndexErrorSignature/2:
  1 ErrPageCursor(uint256);
  4 ErrIndexQueryUnsupported(bytes32,uint8,uint8,bytes32);
  5 ErrPageBasis(uint64,uint64); 6 ErrReadState(bytes32)
CursorFieldConstraint/1:
  0 ANY; 1 EQ
ContextToken/2:
  1 DOM_PK; 2 REALM_ID; 3 REALM_BASIS_AT_H; 4 LITERAL_U256;
  5 ENDPOINT_MODE; 6 TYPE_SCHEMA_ID; 7 INDEX_KIND; 8 INDEX_ORDINAL;
  9 VALUE_KEY
ContinuationFamily/2:
  1 ORDINARY; 2 ADMISSION_LOG; 3 UNIQUE_BY_TYPE
CanonicalEndRule/2:
  1 POSTINGS_FIRST_ORD_GT_H; 2 ADMISSION_H;
  3 UNIQUE_OUTER_FIRST_ORD_GT_H
PositionRule/2:
  1 ORDINARY_NEXT_LT_END_NONZERO; 2 ADMISSION_NEXT_LE_END;
  3 UNIQUE_OUTER_INNER_CANONICAL
EndpointModePolicy/1:
  0 NONE; 1 RAW_OR_HYDRATED
```

Retained PRE_WITHDRAWN vocabulary does not enable C0 pre-withdrawal mutation.
Omit LocatorScoreMode and selector-only errors2/3, ContextToken10–14,
family/end/position4. Do not recycle those codes. New signature row codes4–6
are local registry identifiers, **not** Solidity selectors or MC/1 structural
error codes. Their strings must agree with the separate frozen ABI_RESULT
registry, which owns actual ABI decoding. `ErrReadState` is shared across
point/query projections. Unknown/provider-supplied reverts are not automatically
verified Core errors; the read overlay's runtime/profile/source checks apply.

## Cursors and continuation

Both retained layouts have `layoutVersion=1` and six fields. Names below are
serialized field names; layout labels are explanatory, as in B0.

```text
layoutCode1 PAGE_CURSOR_V1:
  nextPosition (0,48,ANY,0)
  claimedEnd   (48,48,ANY,0)
  basisOrdinal (96,48,ANY,0)
  version      (144,8,EQ,1)
  contextTag   (152,103,ANY,0)
  reserved     (255,1,EQ,0)
layoutCode2 UNIQUE_TYPE_CURSOR_V1:
  outerNextIndex (0,48,ANY,0)
  innerPlusOne   (48,48,ANY,0)
  basisOrdinal   (96,48,ANY,0)
  version        (144,8,EQ,1)
  contextTag     (152,103,ANY,0)
  reserved       (255,1,EQ,0)
```

Evaluate contexts as fixed-width ABI words, then take the low103 bits of
their ABI-encoded keccak256. Every token is its one-byte code except
`LITERAL_U256`, encoded as code4 then the32-byte value. All three selectors
have `outputBitCount=103`:

```text
selector1:
  DOM_PK, REALM_ID, REALM_BASIS_AT_H, LITERAL_U256(1), ENDPOINT_MODE,
  TYPE_SCHEMA_ID, INDEX_KIND, INDEX_ORDINAL, VALUE_KEY
selector2:
  DOM_PK, REALM_ID, REALM_BASIS_AT_H, LITERAL_U256(1), LITERAL_U256(3)
selector3:
  DOM_PK, REALM_ID, REALM_BASIS_AT_H, LITERAL_U256(1), LITERAL_U256(4),
  ENDPOINT_MODE, TYPE_SCHEMA_ID

continuations (family,layout,context,end,position,endpointPolicy):
  (1,1,1,1,1,1)
  (2,1,2,2,2,0)
  (3,2,3,3,3,1)
```

Scope uses the ordinary selector/layout with kind10; no new cursor family
or domain. Kinds1–10 appear in the kind-mode section ascending; mode1 only
for8 and10, mode0 otherwise. This explicitly commits RAW_AUDIT rather than
accepting a caller-supplied filtering mode.

This revision selects the read overlay's exact precedence: initialized guard,
request-only basis validation, supported-query classification, token validation
only for supported queries, then bounded scan. Unsupported pages carry qualified
RealmRevision/H, zero items/coverage and cursor0; unsupported counts revert.
RAW_AUDIT never filters/decrements; current-only point/count reads are not
historical-H implementations. Preserve all outer/inner scan charges and empty
resumable PARTIAL pages.

## Capability tail and acceptance

Embed the exact [101-byte grammar and eighteen named rows](bootstrap-inputs.md#closed-capability-manifest-for-the-next-serializer)
once, after kind modes. The domain definition belongs to outer encoding;
INDEX owns its use/layout/support semantics. No capability codec is implemented
yet; the grammar is a specification, not a passing test.

```text
domainWord:bytes32 || orderedTypeGroupRoot:bytes32 || uint8(0x19)
|| concat(i=1..18: uint8(i) || uint8(support[i]))
```

Support is0 or1 only. All eighteen must be1 **and executed by real bounded
endpoints** for final full-C0 G3 acceptance; all-one bytes alone prove nothing.
The immutable Type root is derived from the exact ordered four groups. The
capability getter must return byte-identical manifest data retained in INDEX.

Two independent encoders/readers must reject reordered/duplicate rows, omitted
Scope mode, altered cursor bits/context literals, wrong signature names/codes,
retired active rows, count/framing errors, unsupported masks and wrong expected
Type roots. Then exercise each advertised endpoint, including continuation and
contract-side returndata budgets. Complete AUTHORITY/session bytes, remaining
outer numeric/error/result registry and real Core integration are still needed
before materializing the full Codex.

This keeps the first implementation smaller without weakening required
capabilities. The tradeoff: several bounded point calls until measurement
justifies a convenience batch. No owner choice or permanent ABI/protocol freeze
is made by this disposable selection.

The SDK PM's bounded source check found no required dependency on either
omitted convenience selector: the current [five seams](../../Designs/sdkv2/mvp-interface.md)
require exact points/bounded pages, and the historical Lens-consumed ABI and
walk use point reads ([B0 Lens](../2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md)).
The measurable followup is a1/8/32/64-entry contract-Lens point-STATICCALL
matrix against a disposable batch control: cold/warm UNSET/BOUND/TOMBSTONED
mixes, total/forwarded gas, post-call reserve, returndata and consumer runtime.
For guest reads compare individual/RPC-batched calls pinned to the same block
hash, including latency, request count, partial failure and provider caps.
Reconsider Core batching only if point reads fail the consumer budget. This
compatibility check ran no new test and does not establish that budget fit.
