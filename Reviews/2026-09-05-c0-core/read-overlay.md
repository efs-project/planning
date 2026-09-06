# C0 read surface: exact Types, supported queries and bounded history

**Status:** run-local implementation specification, not implemented G3 evidence
or a permanent ABI. Source basis: B0 INDEX §§3–6, Binding §8, admission's ABI
inventory, the current StateStore, and the C0 Scope/capability refinements.

Keep the existing owner ABIs where they are sufficient. Eighteen capability
rows do not require eighteen separate engines: point hydration, ordinary
posting pages, nested unique-Type pages and historical Binding lookup share
the retained state. No private indexer or event-only reconstruction path.

## Exact Type readback needs its complete group

Preserve B0 `getTypeSchema(T)`'s existing five return fields. Its
`canonicalBody` means the exact selected **TypeSchemaBlob**, without its
`u16 blobLen` frame, not the resolved ABI cache. SR-17 commits the whole group
and member index; a member blob alone is insufficient to recompute `T`.

Add this narrow origin read and a bounded intrinsic-group read:

```solidity
function getTypeOrigin(bytes32 typeSchemaId) external view
  returns (bytes32 groupRecordId, uint16 memberIndex, bool intrinsic);
function intrinsicTypeGroupBytes() external view returns (bytes memory);
```

These project existing `TypeRow`/bootstrap storage; they do not duplicate the
group or add another identity. Unknown Type: `typeOrd == 0`, empty canonical
body, zero origin/index and false intrinsic. The intrinsic meta-Type is known
with `typeOrd == 1`, admission ordinal zero, member index zero and group
RecordId zero. Derive its intrinsic flag from the known meta-Type identity,
not merely a zero group RecordId. Other known inconsistent rows must refuse,
not become an unknown sentinel.

The reader uses one pinned state source and:

1. Gets the member blob and origin. For an ordinary Type, reads the exact
   group Record, verifies its RecordId/meta-Type, then decodes the Record
   body's `groupBytes` BYTES field. **Do not hash the whole Record body as
   the raw group.** For the intrinsic Type, use `intrinsicTypeGroupBytes()`.
2. Bounds the raw complete group to 8,190 bytes, parses its canonical framing,
   checks the member index and matches the selected blob byte for byte.
3. Recomputes the existing full-group hash and member TypeId, then compares
   with the requested `T`. Separately checks the returned role/index counts.

The getter copies only the bounded selected blob; it may scan at most sixteen
length frames to find it. It must not reconstruct names/meaning/fields from a
cache that did not retain those original bytes. Raw bytes remain useful when
an app cannot interpret a later Type; the SDK does not invent compatibility.

### Small point-read implementation boundary

Keep a `TypeRow storage` reference, not a copied row/cache. The helper stores
`abi.encode(SchemaCache)`, so a bounded word projection can recover the two
counts without copying up to 131,072 cache bytes or importing the full parser
into Core. Offsets below are byte positions from the cache's first data byte:

| Position | Canonical word |
|---:|---|
| 0 | Tuple start =32. |
| 32 / 64 / 96 | TypeId / blobHash / maxBodyBytes. |
| 128 / 160 / 192 / 224 | Fields / roles / indexes / constraints array offsets, **relative to tuple start32**. |

Require bounded length before reads, exact tuple start, matching TypeId/blob
hash, aligned in-range dynamic offsets, fields offset224/count1..64, role
count≤16, index count≤8 and constraint count≤32 before narrowing. Role count
lives at `32+word(160)`, index count at `32+word(192)`. Check the static tails:
roles use `32+96R` bytes, indexes `32+64I`, constraints `32+128C`; require their
contiguous order and exact end-of-cache. The fields tail is dynamic; do not
pretend this projection validates every field descriptor/ABI item again.

This relies on the fixed verified preparation helper's canonical stored
output. It is not a public validator for caller-supplied caches. Use the
`bytes storage` variable's own slot reference and normal long-bytes data base,
never hardcoded Store/mapping/member slots. Check offsets with subtraction
bounds before additions/reads. Original group/body slices remain byte-bounded;
unaligned copying must zero final memory padding.

Root checked this header/tail geometry with independent ethers ABI encoding
for R/I/C counts0/0/0,1/1/1 and16/8/32. These are ABI-layout fixtures, not
admissible-Type or onchain-read performance evidence. Actual intrinsic/all
sixteen admitted caches and malformed-offset synthetic fixtures must validate
the implementation.

Record point reads return bounded retained bodies (≤8,192); empty bytes are
not an absence test. Envelope bytes are `abi.encode(EnvelopeHeader,bytes32[])`:
six static header words, array offset at192 exactly224, count at224, IDs from256.
Require count1..64 and exact length `256+32N` (maximum2,304) before copying;
Principal is the word at32 and authEpoch at96. Check scalar widths, preserve
the exact bytes and leave full independent identity reconstruction in the
reader. Do not call compileGroup/prepareRecord as a read shortcut: those
construct/validate full caches or bodies and solve a different problem.

## Query classification and refusal are shared

Use one internal classifier for raw/hydrated pages and `counts`. Let `H` be
the selected admission high-water (current for `counts`). A Type-scoped
query requires the Type to exist at `H`; the intrinsic Type exists at H=0.
Check the declared role/spec at that same basis, not today's mutable source.

| Index kind | Required query tuple `(T, ordinal, valueKey)` |
|---|---|
| 1 by-Type; 2 unique-by-Type | Known Type at H, ordinal 0, valueKey 0. |
| 3 by-Record; 4 by-Principal; 5 target; 8 Binding history; 9 digest; 10 Scope | T=0 and ordinal=0; valueKey is the exact opaque key. |
| 6 typed role | Known Type at H; declared role ordinal; exact target key. |
| 7 scalar | Known Type at H; declared SCALAR_EQ spec ordinal; exact scalar key. |

Other kinds/shapes or disabled capabilities are unsupported. Do not repair a
tuple into another key, require global target existence, or impose a blanket
`valueKey != 0`. A supported global key can be authoritatively empty. Digest
algorithm/length checks belong to structured `lookupByDigest`, which computes
the existing kind-9 key; the generic key itself is opaque.

Pages retain `UNSUPPORTED` with zero items/coverage and cursor 0; they do not
return COMPLETE or CURSOR_END for that refusal. `counts` has no completeness
field, so add an INDEX-owned run-local error instead of fabricating zeros:

```solidity
error ErrIndexQueryUnsupported(bytes32 typeSchemaId, uint8 indexKind,
  uint8 indexOrdinal, bytes32 valueKey);
error ErrPageBasis(uint64 requestedBasis, uint64 currentHighWater);
error ErrReadState(bytes32 subject);
```

The last error reports an internally inconsistent known row/join, not
provider unavailability. Include these exact signatures and precedence in
the revised INDEX error inventory before materialization. They are C0
refinements; B0 only supplies `ErrPageCursor` for these generic pages.

After the initialized-state guard, apply this exact order:

1. Request-only basis validation. If cursor=0, basis zero resolves once to
   current H; an explicit initial basis above current H or the physical u48
   maximum reverts `ErrPageBasis`. If cursor is nonzero, a zero/out-of-range
   **requested** basis reverts `ErrPageCursor` without decoding the token.
2. Classify the query at that H. Unsupported returns qualified UNSUPPORTED,
   without interpreting the nonzero token's embedded basis or other fields.
3. Supported query only: decode/validate its token, including exact H,
   context/end/positions; any mismatch or CURSOR_END input reverts
   `ErrPageCursor`. Then perform bounded scan/hydration.

Thus unsupported plus valid explicit H ignores even a malformed or
basis-mismatching token; unsupported plus zero requested H and a nonzero
cursor still reverts. A supported resumed query always requires exact token
basis agreement. Return the selected RealmRevisionId/H even on a qualified
unsupported result; these fields are not block/finality proofs.

`getBindingAtBasis` uses the same initial-basis rule (zero=current), with no
cursor. Ordinary point ABIs and `counts` without a basis parameter are
current-state reads; offchain callers pin the `eth_call` block for a logical
operation. Do not silently mix them with a historical-H page.

## Capability-to-engine mapping

The next [occurrence/receipt component](occurrence-receipt-design.md) specifies
the exact current-state joins and bounded accepting-batch search for rows4–5.
Its [implementation plan](occurrence-receipt-plan.md) does not include pages,
Principal authority evidence, or full Core initialization.

The [101-byte manifest](bootstrap-inputs.md#closed-capability-manifest-for-the-next-serializer)
still has exactly eighteen rows. The additional origin/intrinsic helpers
complete row 1, not a nineteenth support bit.

| Capability rows | Implementation obligation |
|---|---|
| 1 Type | Exact member plus source-group recovery above; ordinal-zero distinction. |
| 2 Record; 3 Envelope | Retained Type/body/first admission and exact unsigned full membership vector. Withdrawal never deletes either. |
| 4 Occurrence | Real `(EnvelopeId, leafIndex)`/AdmissionOrdinal mappings, never dense leaf/base arithmetic. Retain lifecycle separately. C0 never-admitted pre-withdrawal remains unsupported. |
| 5 Receipt | Find the actual accepting batch with at most 64 boundary probes; return exact original basis/codehash/block plus separately qualified lifecycle. |
| 6 Admission log | One-based ordinal walk with its own context/canonical end. |
| 7 Unique Type | Stable first-Record anchor; nested by-Record search for any occurrence live at H. Never filter solely by the anchor's lifecycle. |
| 8–13 | Shared ordinary page engine for kinds 1/3/4/5/6/7 and exact tuple classification above. |
| 14 Binding point | Current packed head, or at most 48 historical boundary probes and hydration of one effect; no unbounded history fold. |
| 15 Binding history | Kind 8 RAW_AUDIT; physical position r−1 is revision r. Preserve the separate bounded `readHistory` revision-number API. |
| 16 Digest | Kind 9 plus structured alias; supported empty general family is not byte unavailability. |
| 17 ByteDigest | Validate profile algorithm/length, derive exact ByteDigest RecordId, point-read then follow declared backlinks. No new index or endpoint required. |
| 18 Scope | Kind 10 RAW_AUDIT; first-bind **or first-tombstone** anchor once. Decode its position, then read the Binding at the same H. |

RAW_AUDIT is fixed to kinds 8 and 10, checked against stored head mode where
a head exists; it is never a caller option. These heads' live-count field
tracks physical audit entries for compatibility, with no withdrawal decrement.
Other occurrence families use `liveAt(ordinal,H)`; unique-Type uses its nested
live-set rule. `counts` reports actual maintained current counts, not a scan
estimate or an H-pinned historical count it does not implement.

Principal descriptor readback needs no second descriptor store. Resolve the
known Principal's first admission to its accepting batch (the same 64-probe
bound), extract the descriptor from retained authority evidence, recompute
PrincipalId, and verify the batch/Envelope join. A known Principal with missing
or contradictory required evidence is an error/incomplete reconstruction,
not an absent descriptor. Current composite/direct descriptor length is 22;
session must preserve the same Principal descriptor rule when implemented.

The original B0 `IndexedReceiptView` and simpler `receiptOf` shapes are
distinct projections, not permission to silently change either ABI. The
[per-batch extension](batch-authority-evidence.md) remains separate and must
be retained before a real Core can claim complete receipt reconstruction.

## Bounds, continuations and SDK cost

Keep B0's two page cursor grammars and context formulas unchanged, applying
the ordinary formula to Scope's explicit kind 10. Charge every outer and
inner **consumed** posting to PAGE_SCAN_MAX=1,024; a dead-only window can return
empty PARTIAL with a resumable cursor. Boundary-only inspections are separately
accounted work, as explicitly refined below. Validate canonical ends from state,
reserved/version bits, query/mode/RealmRevision context and every physical
position. A resumed suffix's COMPLETE is not proof that prior pages were read.

### Nested unique-prefix refinement

For historical unique-Type walks, do not require a binary upper-bound search
for every nested Record. A valid strictly increasing list `p` with count `n`
has `i < upper_bound(H)` exactly when `i < n && p[i] <= H`. The outer canonical
end remains checked exactly as before. An active inner cursor may prove its
position is in the canonical prefix by this checked direct predicate, instead
of materializing the inner end. Both cursor encodings and context tags stay
unchanged; all inspected packed words/ordinals and Record associations retain
their state-integrity checks. This relies on admission-maintained ordering;
it does not audit unvisited rows.

This is an **explicit C0 refinement** of B0 INDEX§3.3/5.1a's "every examined"
and "without prefetch" wording. A boundary-only inspection reads an ordinal
solely to prove prefix membership or normalize a cursor. It does not inspect
lifecycle, hydrate, emit or consume that position. It is excluded from
`coverage`, but must be separately counted in instrumentation and gas evidence.
No prefetch means no semantic consumption beyond the stopping point; it does
not forbid these bounded boundary checks. Every eligible inner item actually
processed is charged once to coverage and the shared scan budget.

Use this exact next-state order:

1. At loop entry, test membership before charged lifecycle processing. A
   physical position at count needs no posting read; lastOrdinal≤H permits
   the count fast path. A resumed position outside the prefix is a cursor
   error, not a successful empty page.
2. On a live match, emit the stable outer Record anchor and advance to the next
   outer position with innerPlusOne0; do not inspect the next inner item.
3. After a dead inner item, advance its index. If continuing, the next loop
   entry checks membership. If stopping now, one boundary-only check normalizes
   the cursor: still eligible → retain this inner position; exhausted → advance
   outer, possibly COMPLETE. Never emit a cursor that its next call must reject.
4. Stopping immediately after an outer anchor may emit `(outer,1)`. Verify
   that this anchor is the retained Record's first admission and first by-Record
   posting, so its inner index0 is known eligible at H. On resume, repeat the
   required identity checks without consuming the outer candidate twice.

The [finite model](reference/unique-prefix-model.mjs) compared12,830 range
predicates and1,290,330 inner stop/coverage cases against an independently
computed end, including u48-near-boundary positions and a counterexample when
ordering is absent. Root ran it with Node26 at the Binding design checkpoint.
It establishes finite ordered-list equivalence only: no actual cursor words,
packed storage, outer-loop integration, Solidity, normal-cap or gas proof.
Those remain required in the shared-page task. An implementation should avoid
the model's redundant per-step boundary checks by reusing the checked candidate.

Do not infer a read-gas guarantee from this improvement. Measure boundary,
lifecycle and hydration work separately, especially dead-only pages. No
unmeasured `gasleft()` threshold is selected here. An underfunded call remains
a call failure/UNKNOWN to a consumer, not a fabricated successful PARTIAL;
successful bounded stopping must have an exact progressing cursor and enough
measured return budget. Lowering maxItems alone cannot bound a dead-only scan.

### Result-size measurement inputs

Keep maximum raw items 512 and hydrated items 256 for the next measurement,
not as already-proven gas fit. Actual canonical ABI return sizes are:

| Return shape | Exact bytes for N items | Selected maximum |
|---|---:|---:|
| `PageResult` | 256 + 32N | 16,640 at N=512 |
| `(PageResult, HydratedItem[])` | 320 + 256N | 65,856 at N=256 |

The hydrated row has seven ABI words (224 bytes) plus its ordinal in the
PageResult items vector (32 bytes). Root encoded the exact ABI with ethers
6.15 at N=0/1/256/512 and checked both formulas. This corrects B0 §5.3's
illustrative 160-byte hydrated-row estimate; it is not deployed read-gas
evidence. An onchain SDK consumer needs an explicit returndata allowance and
may request fewer items. Bounded return size does not itself bound all scan
gas; measure maximum-dead and nested pages separately.

## SDK projection, not additional public seams

The SDK PM's bounded review confirmed the existing exact-read, scoped-page and
generated-Solidity seams fit this surface. Make exact Type reading one pinned
composite evidence operation: retain each raw subread and its verification
result, and expose a generated friendly DTO only after full-group identity and
count checks. A failed subread preserves earlier evidence and makes its check
UNKNOWN. Only the complete consistent unknown sentinel establishes Realm-local
absence; inconsistent origins/blobs/counts are CONFLICT/INVALID, not absence.

Give `counts` disjoint adapter branches: a supported numeric zero, verified
UNSUPPORTED with **no numeric value**, and UNKNOWN for an unavailable/unknown
revert. Recognize a custom error only against the verified runtime/profile/
result ABI, not its first four bytes alone. `ErrReadState` is inconsistent-state
evidence. Count zero does not prove object absence or historical-H completeness.

Preserve two coordinates: the observation pin (source/block/finality) and the
semantic RealmRevision/H. Basis=0 is request intent, not retained evidence.
Capture resolved H and the original pin; continuation remains opaque and
binds the query/mode/order, revision/H, pin, resource policy and coverage.
Immutable evidence may be explicitly qualified for H; a mutable current-only
point result cannot silently hydrate an older-H page. Return it as a separate
current observation if no historical projection is available.

Generated onchain readers need a byte allowance at least 32 bits wide:
65,856 exceeds uint16's 65,535. For allowance B≥320, the hydrated item budget
is `min(256, floor((B−320)/256))`. If that is zero, do not send maxItems=0:
Core clamps it to one, so this allowance cannot safely admit a nonempty page.
Use zero-output low-level STATICCALL, check RETURNDATASIZE before copying
either success **or revert** bytes, then validate the exact ABI and matching
ordinal/hydrated arrays. Bound forwarded gas independently and retain a
post-call reserve. Resource/malformed/no-code failures must not become
UNSUPPORTED, empty, PARTIAL or absence. This is an adapter requirement, not
implemented SDK code or a new default page size.

## Next implementation and falsifiers

Build shared read helpers against the existing StateStore and retained
authority mapping, then measure them inside the real Core. Do not omit a
required getter to make bytecode fit. Initialization/Codex/authentication
remain separate unfinished joins; no all-enabled capability claim yet.

Required tests: intrinsic versus unknown Type; wrong member/group/Record join;
missing known Principal evidence; sparse Envelope admission and multiple
batches; undeclared scalar query versus supported empty global key; all
malformed tuple families; classifier/basis/cursor error precedence; every
cursor stop/corruption case; dead-only empty PARTIAL; unique anchor withdrawn
while another occurrence is live; historical Binding before/after tombstone
and withdrawal; Scope first tombstone and no duplicate anchor; exact ABI sizes;
bounded scans/probes/read gas; one-basis SDK reconstruction after new writes.
For the nested-prefix refinement, compare exact items/coverage/completeness/
cursor words against an end-based oracle: resume at last eligible and refuse
at end; dead scan-stop before next `<H`/`==H`/`>H`/no physical next; last dead
item of the last outer Record; live match coinciding with either limit; outer
anchor/inner/between-Record stops; new writes beside a pinned-H continuation;
and malformed boundary words as separately labeled state-refusal cases.

SDK cases also include staged Type-subread failures; whole Record body versus
extracted groupBytes; supported zero versus unsupported-no-value and forged
error selectors; H1 pages beside mutable H2 points; unavailable/noncanonical
block pin; and returndata allowances around 320/576/65,535/65,536/65,856,
including oversized success/revert, no-code empty success, malformed offsets,
mismatched arrays and gas exhaustion. The smaller allowance may require a
smaller requested page, never integer truncation or an invented Core result.

No owner decision is required for this reversible surface refinement. It
does not grant accounts authority, promise generic View-wide completeness,
add arbitrary references or freeze a production ABI.
