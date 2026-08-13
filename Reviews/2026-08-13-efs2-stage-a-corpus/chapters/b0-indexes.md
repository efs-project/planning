# B0 baseline — indexes & query ABI
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 5 of the Stage A pass. This chapter makes the B0 "SPINE" arm's index and
query surface exact: storage layouts, ordinal width, the IndexSpec grammar, the
one page-result ABI, revocation-aware counts, digest lookup, author
enumeration, best-locator selection, spam bounds, and the acceptance rule.
F4's mandatory coverage cell has an exact disposable interface; other
alternatives remain sketches marked as bakeoff arms. Names follow
the shared Stage-A skeleton (`TypeSchemaId`, `OccurrenceRef = (EnvelopeId,
leafIndex uint16)`, `AdmissionOrdinal`, …).

Revision note: repaired against the revised seam pins (SR-1..SR-18,
[[b0-overview]]). Load-bearing changes: the occurrence lifecycle moves to an
occKey-keyed status overlay and the consecutive-ordinal law is retired
(SR-10, §2.2/§2.2a); `selectBestLocator` bounds TOTAL postings visited, live
or dead, and returns a resumable cursor (§7); the unique-by-Type counter
decrements on last-live-occurrence withdrawal (SR-18d, §3.3); ordinals are
`uint64` at every ABI, `uint48` physical (SR-4); the BindingHead is the SR-8
two-slot layout (§2.4/§3.6); digest keys use the encoding chapter's `u16
algCode` (SR-18a, §3.5); all key formulas regenerate under the SR-1
`abi.encode` discipline (§2.1).

---

## 0. Scope, spine position, and the acceptance rule

**THE LINE (this chapter's acceptance rule).** [DERIVED INVARIANT —
onchain-completeness.md §6 "cost scales with the **answer** (match count or one
page), not with global history"; carried by owner ruling 2026-08-12's
acceptance-obligation clause] Every read defined here must cost proportional to
the answer — the match count or one bounded page — never global history, never
the total postings at a hot key beyond one bounded page, never log replay. A
capability is on-chain-complete only if a bounded reader answers it from a
keyed index carrying the predicate and a live-revocation story [DERIVED
INVARIANT — onchain-completeness.md §1/§6: the v1 B4 postings word
`author(160)|spineIdx(64)|flags(32)` carried no `definitionId` and no
revocation story, making predicate-filtered reverse reads O(all postings at
target); VERIFIED]. Durability alone is not sufficient; durability ≠
queryability ≠ composability are independent requirements throughout [DERIVED
INVARIANT — onchain-completeness.md §1].

**Mandatory automatic indexing.** [OWNER RULING — owner-rulings.md 2026-07-15,
item 12 block: "RULED (James) — MANDATORY automatic indexing; EAS opt-in
REJECTED (bundle-wide) … Anything written on-chain through EFS … is
force-indexed"; re-carried 2026-08-12: "Once a Realm admits a Type/index
profile, every admitted item is indexed automatically according to that
declaration; an individual writer cannot opt out and create invisible
half-presence"; VERIFIED] Every index in this chapter is populated by the
admission path for every accepted Occurrence, unconditionally. Writer opt-out
is classified **[REJECTED — owner-rulings.md 2026-07-15 item 12: "EAS opt-in
REJECTED"]**. The only opt-out is not publishing on-chain ("private/local =
your business; on-chain = everyone's to use" — same ruling).

**Physical position (axis 6).** All storage below lives inside the ONE atomic
physical Core contract; index logic is an internal library (`LibIndex`) with no
external call boundary, so admission + all index appends commit or revert
atomically in one EVM call [B0 spine pin, axis 6]. Slots derive from printable
pinned domain constants (§2.1), not Solidity declaration order [PROPOSAL —
auditable, reimplementable byte-for-byte]. The external ABI and key derivation
are the durable contract; physical slot packing is replaceable until frozen
[DERIVED INVARIANT — system-constitution.md "Physical storage layout is
replaceable until frozen. The semantic query contract … is the durable part";
VERIFIED].

---

## 1. AdmissionOrdinal: width choice and century arithmetic

`AdmissionOrdinal` is the Realm-local, strictly increasing, gapless-in-effect
sequence number assigned to every **accepted** Occurrence (reverted admissions
consume nothing; state reverts). Ordinals assign **per accepted occurrence in
submission order** [SR-10] — within one admission event, the selected leaves
in ascending `leafIndex`; across events, event order; the per-envelope
consecutive-ordinal law is retired (§2.2). Ordinal `0` is the reserved
sentinel NONE; the first accepted Occurrence has ordinal `1` [PROPOSAL — a
zero sentinel makes zero-initialized storage mean "no admission", eliminating
an existence flag; adopted by SR-4/SR-10]. Width discipline [SR-4]: `uint64`
at every external ABI, receipt, and vector; `uint48` as the physical packed
representation (this section's arithmetic).

### 1.1 Exhaustion arithmetic (the math, in-chapter)

Seconds per Julian year = 31,557,600. Seconds per century = 3,155,760,000
(≈ 3.156e9).

| Width | Max ordinals | Sustained write rate that exhausts in 100 years | Century capacity at stated rates |
|---|---|---|---|
| uint32 | 4,294,967,295 | **1.36 writes/s** | 10/s → 13.6 y; 100/s → 1.36 y; 1,000/s → 50 days |
| uint48 | 281,474,976,710,655 | **≈ 89,194 writes/s** | 10/s → 891,900 y; 1,000/s → 8,919 y; 10,000/s → 891.9 y |
| uint64 | 18,446,744,073,709,551,615 | ≈ 5.85e9 writes/s | any conceivable EVM rate → ≥ 10⁵ centuries |

Derivations: `4,294,967,295 / 3.156e9 s ≈ 1.36/s`;
`281,474,976,710,655 / 3.156e9 s ≈ 89,194/s`;
`281,474,976,710,655 / (10,000 × 31,557,600) ≈ 891.9 years`.

- uint32 **[REJECTED — arithmetic above]**: any Realm averaging more than
  ~1.36 admissions/second for a century exhausts it. Ethereum L1 alone
  averages ~15 tx/s today (PLAUSIBLE); a busy L3 exceeds this by orders of
  magnitude. Fails the 50-year panel outright.
- uint64: safe but halves packing density (4/slot vs 5/slot) for headroom no
  EVM Realm can use (5.85 **billion** sustained writes/s to exhaust in a
  century).
- **uint48 is the B0 physical choice [PROPOSAL, adopted by SR-4 — rationale:
  891.9 years of capacity at a sustained 10,000 admissions/s, which is ~100×
  beyond any deployed EVM Realm's sustained total tx rate, while packing 5
  ordinals per 256-bit slot; the exhaustion behavior at the (unreachable)
  limit is the hard admission revert `U48_GUARD`, never wraparound, with a
  named successor-realm seam (SR-4)].** The same guard class covers the
  `nextTypeOrd`/`nextPrincipalOrd` counters (§2.4): local ordinals revert at
  2^48 − 1, never wrap, never alias [red-team repair — the guard is named for
  all three counters, not only the admission ordinal]. The external ABI
  carries `uint64` (SR-4).

### 1.2 Packing constants

```
ORDINAL_BITS        = 48
ORDINAL_NONE        = 0                      // sentinel; first real ordinal = 1
ORDINAL_MAX         = 2^48 - 1 = 281,474,976,710,655
POSTINGS_PER_SLOT   = 5                      // 5 × 48 = 240 bits used
SLOT_SPARE_BITS     = 16                     // bits [240..255], MBZ (must be zero)
```

Lane convention [PROPOSAL]: within a packed slot, lane `k` (k = 0..4) occupies
bits `[48·k .. 48·k+47]`, lane 0 least-significant. Extraction:
`ord = (slot >> (48*k)) & (2^48 - 1)`. Bits are numbered 0 (LSB) to 255 (MSB);
EVM words are big-endian when serialized, but all layouts below are defined by
bit position, which is serialization-independent. Spare bits [240..255] are
MBZ and reserved; they are **not** usable as per-slot metadata (keeps appends
single-purpose and the layout audit trivial) [PROPOSAL].

---

## 2. Storage primitives

Four primitives carry every index: the **admission log** (ordinal-keyed
global spine of accepted Occurrences — pages + hydration), the **occ-status
overlay** (occKey-keyed lifecycle store, the single owner of
status/revocation [SR-10], §2.2a), the **packed postings store** (key →
append-only packed ordinal array + counter head), and **meta words** (one or
two packed slots per Type/Record/Envelope/Principal/Binding). Full canonical bodies
are state-readable per the full-body-spine and no-body-elision rulings [OWNER
RULING — owner-rulings.md 2026-07-15 items 17 "full-body spine: RULED — PAY
IT", 18 "no body-elision: RULED — ETCH IT"; VERIFIED]; their byte-cell layout
is owned by the encoding/envelope chapters — this chapter treats
`canonicalBody` as opaque and consumes only "leaf `k` of envelope `E` yields
`RecordId` in ≤ 1 SLOAD" (declared dependency).

### 2.1 Slot and key derivation

SR-1 applies without exception here. This chapter **consumes**, and does not
redefine, the `DOM_* bytes32` words in [[b0-encoding-and-ids]] §1.3. Each is
already `keccak256("efs2/<name>/<version>")`; no raw domain string is an
active key or slot preimage below. Every structured preimage uses
`abi.encode` with fixed-width words, and every dynamic component is hashed
once before entering the outer preimage.

Slot formulas [PROPOSAL — exact SR-1 form]:

```
logBase            = uint256(keccak256(abi.encode(DOM_SLOT_LOG)))
logSlotA(ord)      = logBase + 2*uint256(ord)       // EnvelopeId word
logSlotB(ord)      = logBase + 2*uint256(ord) + 1   // metadata word

pheadSlot(pk)      = keccak256(abi.encode(DOM_SLOT_PH, pk))
pdataBase(pk)      = uint256(keccak256(abi.encode(DOM_SLOT_PD, pk)))
pdataSlot(pk, i)   = pdataBase(pk) + uint256(i)     // i = floor(n/5)
tmetaSlot(tid)     = keccak256(abi.encode(DOM_SLOT_TM, tid))
rmetaSlot(rid)     = keccak256(abi.encode(DOM_SLOT_RM, rid))
emetaSlot(eid)     = keccak256(abi.encode(DOM_SLOT_EM, eid))
pmetaSlot(prid)    = keccak256(abi.encode(DOM_SLOT_PM, prid))
principalByOrdBase = uint256(keccak256(abi.encode(DOM_SLOT_PBO)))
principalByOrd(po) = principalByOrdBase + uint256(po)
typeByOrdBase      = uint256(keccak256(abi.encode(DOM_SLOT_TBO)))
typeByOrd(to)      = typeByOrdBase + uint256(to)
bheadSlot0(bk)     = uint256(keccak256(abi.encode(DOM_SLOT_BH, bk)))
bheadSlot1(bk)     = bheadSlot0(bk) + 1
revisionBase       = uint256(keccak256(abi.encode(DOM_SLOT_REV)))
revisionSlot(i)    = revisionBase + 2*uint256(i)
countersSlot       = keccak256(abi.encode(DOM_SLOT_CTR))
```

The SR-10 store is the owner chapter's `occStatus[occKey]` mapping. Its key
uses the encoding registry's explicitly dual-purpose `DOM_OCCURRENCE`; no
second lifecycle key domain is minted:

```
occKey(E, k)       = keccak256(abi.encode(
                       DOM_OCCURRENCE, E, uint256(k)))
occStatusSlot(key) = keccak256(abi.encode(DOM_OCCURRENCE, key))
```

Additive-offset regions and hash-derived point slots collide only with
negligible probability (the standard Solidity mapping-layout argument;
offsets are ≤ 2^49, far below the 2^256 keyspace) [PLAUSIBLE — standard EVM
storage-layout reasoning; the red team should confirm no region can be driven
into another by attacker-chosen inputs: all offsets are ordinal-bounded, not
attacker-chosen].

**Postings key derivation (the predicate is ALWAYS in the key)** [DERIVED
INVARIANT — onchain-completeness.md §1/§3.2: the v1 defect was a predicate-blind
postings word; the key must carry the predicate so filtered reverse reads are
O(matches)]:

```
pk(T, kind, ordinal, valueKey) = keccak256(abi.encode(
  DOM_PK, T, uint256(kind), uint256(ordinal), valueKey))

scalarValueKey(fieldBytes) = keccak256(abi.encode(
  DOM_VK_SCALAR, keccak256(fieldBytes)))

occurrenceTargetKey(envelopeId, leafIndex) = keccak256(abi.encode(
  DOM_VK_OCC, envelopeId, uint256(leafIndex)))

digestTargetKey(algCode, digestBytes) = keccak256(abi.encode(
  DOM_VK_DIGEST, uint256(algCode), keccak256(digestBytes)))
```

`indexKind` values (closed set; unknown kind ⇒ UNSUPPORTED, never a scan):

```
KIND_BY_TYPE       = 0x01   // typeSchemaId = T, ordinal 0, valueKey 0
KIND_UNIQUE_BY_TYPE= 0x02   // typeSchemaId = T, ordinal 0, valueKey 0
KIND_BY_RECORD     = 0x03   // typeSchemaId = 0, ordinal 0, valueKey = RecordId
KIND_BY_PRINCIPAL  = 0x04   // typeSchemaId = 0, ordinal 0, valueKey = PrincipalId (full 32 bytes)
KIND_TARGET        = 0x05   // typeSchemaId = 0, ordinal 0, valueKey = targetKey (general reference backlink)
KIND_ROLE          = 0x06   // typeSchemaId = T, ordinal = roleOrdinal, valueKey = targetKey (predicate backlink)
KIND_SPEC          = 0x07   // typeSchemaId = T, ordinal = specOrdinal, valueKey per IndexSpec (§4)
KIND_BINDING_HIST  = 0x08   // raw audit history: typeSchemaId = 0, ordinal 0,
                            // valueKey = BindingKey; never liveness-filtered
KIND_DIGEST        = 0x09   // typeSchemaId = 0, ordinal 0, valueKey = digestTargetKey;
                            // DIGEST_EQ value postings, never a reference role
```

`PrincipalId` participates at full 32-byte width in `pk` and everywhere else;
no truncation to 160 bits anywhere in this chapter [DERIVED INVARIANT —
system-constitution.md "Every Principal-bearing ID, ABI, storage key, index
key, Binding, and Lens preserves the full bytes32 PrincipalId"; VERIFIED].

### 2.2 The reversible admission log (2 slots per accepted Occurrence)

The log is only (a) the globally ordered accepted-occurrence spine and (b) the
direct `ordinal → OccurrenceRef` hydration table. Lifecycle state does not
live here [PROPOSAL — SR-10 exact contract].

```
logSlotA(ord): EnvelopeId                       // full 32 bytes
logSlotB(ord): packed word, bit layout:
  leafIndex    bits [0..15]   uint16
  typeOrd      bits [16..63]  uint48   // local TypeSchema ordinal
  principalOrd bits [64..111] uint48   // local author Principal ordinal
  reserved     bits [112..255]         // MBZ (u144)
```

The full-width `EnvelopeId` plus `leafIndex` is the reversible
`OccurrenceRef`; the log never stores only an irreversible `occKey`. Newly
accepted leaves receive ordinals in ascending selected `leafIndex` within a
call and submission order across calls. Subset and staged admission are
therefore intentionally sparse relative to envelope leaf indexes. No
per-envelope range, reserved hole, leaf-mask walk, or arithmetic derives an
occurrence ordinal. `(EnvelopeId, leafIndex) → ordinal` reads
`occStatus[occKey].ordinal`; the reverse direction reads these two log words.

`typeOrd`/`principalOrd` are Realm-local uint48 ordinals assigned at the first
admission touching that TypeSchema/Principal, with reverse maps
`typeByOrd`/`principalByOrd` (one 32-byte slot each, written once) and forward
maps in the meta words [PROPOSAL — lets the hot log word carry typing and
authorship without 32-byte ids; the F7 bakeoff arm removes them, §10]. Both
counters use `U48_GUARD` and never wrap.

### 2.2a The occKey status overlay (sole lifecycle owner)

```
OccStatus @ occStatus[occKey]:
  status           bits [0..7]     uint8  // 0 NEVER_ADMITTED, 1 ACTIVE,
                                           // 2 WITHDRAWN, 3 PRE_WITHDRAWN
  ordinal          bits [8..55]    uint48 // 0 iff never accepted
  revokedAtOrdinal bits [56..103]  uint48 // withdrawal ordinal; else 0
  reserved         bits [104..255]        // MBZ
```

Every transition is decided before leaf effects. Admission has already
authenticated target authorship/evidence and passes the shared typed context:

```solidity
struct OccurrenceRef { bytes32 envelopeId; uint16 leafIndex; }
struct ValidatedOccurrenceLifecycleEffect {
  OccurrenceRef target;
  bytes32 targetOccKey;
  bytes32 targetPrincipalId;
  uint8 priorStatus;
  uint64 priorOrdinal;
  uint64 priorRevokedAtOrdinal;
  uint64 evidenceOrdinal;
  uint8 targetEffectKind;
  bytes32 targetBindingKey;
  bool targetIsCurrentBindingHead;
}
```

`LibIndex` owns lifecycle/status semantics but Admission's bounded shadow runs
the fold before storage commit. It never accepts or decodes
`TargetEnvelopeEvidence`, verifies a witness/descriptor, or compares authors.
The following is first applied to the point-in-order shadow and journaled, then
replayed against asserted prestates during commit:

```
activateOccurrence(E, k):
  NEVER_ADMITTED -> require nextOrdinal < 2^48 - 1 else U48_GUARD;
                    ACTIVE { ordinal = nextOrdinal++; revokedAtOrdinal = 0 }
  ACTIVE          -> ALREADY_ADMITTED(existing ordinal/receipt), no writes
  WITHDRAWN       -> revert ErrOccWithdrawn
  PRE_WITHDRAWN   -> revert ErrOccWithdrawn

withdrawOccurrence(validated, withdrawalOrdinal):
  require validated.priorStatus == ACTIVE and current overlay matches
  ACTIVE -> WITHDRAWN { revokedAtOrdinal = withdrawalOrdinal }
  decrement occurrence-level index heads exactly once (§6)

preWithdrawOccurrence(validated, withdrawalOrdinal):
  require validated.priorStatus == NEVER_ADMITTED
  require validated.targetOccKey == occKeyOf(validated.target)
  require validated.evidenceOrdinal == 0 ||
          validated.evidenceOrdinal == withdrawalOrdinal
  NEVER_ADMITTED -> PRE_WITHDRAWN
  ordinal = 0; revokedAtOrdinal = withdrawalOrdinal
  // nonzero means Admission already retained canonical evidence there;
  // zero means Admission had authenticated header/vector + target commitment
  decrement nothing

withdrawOccurrence(validated terminal target):
  require current overlay matches validated terminal status/evidenceOrdinal
  success, no writes, no decrement; never load/replace/revalidate evidence
```

The shadow entry for an occurrence is loaded from persisted state once; later
sibling leaves see the prior planned transition. A fresh source is planned
ACTIVE at its prospective ordinal before its own Withdrawal effect runs. Thus
bind→withdraw in one Envelope stages ordinary postings/liveCount `+1` then the
exact withdrawal dedup set `−1` (net zero for that source), while its
`KIND_BINDING_HIST` audit revisions only append. Withdraw-before-a-later
selected source stages PRE_WITHDRAWN first; the later activation rejects
no-resurrection before any SSTORE. Of two sibling Withdrawals, only the first
effective target fold decrements; the terminal second is a target no-op.

Every touched `PostingsHead` shadow carries exact
`count/liveCount/lastOrdinal/flags` and planned packed-lane value, not an
unqualified aggregate delta. Record live-occurrence and unique-by-Type
zero-crossings are updated after each sibling in the same order. The plan also
freezes the stable-deduplicated posting-key list, RAW_AUDIT appends, and all
before/after words. Commit derives no keys and makes no lifecycle/count choice:
it asserts each before word—including an earlier sibling's just-written after
word—and stores the recorded after word. A mismatch is an internal invariant
panic reverting the call, never a late user-facing withdrawal/index error.

The immutable `ordinal` survives `ACTIVE → WITHDRAWN`; terminal states never
resurrect. The liveness rule derives the reversible reference first and then
loads the overlay:

```
liveAt(ord, H):
  if ord == 0 or ord > H: return false
  ref = { envelopeId: logSlotA(ord), leafIndex: logSlotB(ord).leafIndex }
  s = occStatus[occKey(ref.envelopeId, ref.leafIndex)]
  assert s.ordinal == ord
  return s.revokedAtOrdinal == 0 || s.revokedAtOrdinal > H
```

Because the fold records *when* it happened, an item withdrawn after `H`
remains live at `H`; pages pinned to one `H` are phantom/ghost-free. No reader
consults a log-owned revocation field.

### 2.3 The packed postings store (axis-7 arm)

Per postings key `pk`:

```
pheadSlot(pk): PostingsHead, bit layout:
  count       bits [0..63]    uint64  // total ordinals ever appended
  liveCount   bits [64..127]  uint64  // revocation-aware current count (§6)
  lastOrdinal bits [128..175] uint48  // last appended ordinal (append monotonicity check)
  flags       bits [176..191] uint16  // bit0 RAW_AUDIT; all others MBZ
  reserved    bits [192..255] MBZ

pdataSlot(pk, i): 5 packed uint48 ordinals, lanes per §1.2; entries are
  append-only, strictly ascending (asserted: newOrd > lastOrdinal).
```

Append pseudocode (deterministic; used by every family):

```
appendPosting(pk, ord):
  head = SLOAD(pheadSlot(pk))
  assert head.flags == 0                    // liveness family only
  assert ord > head.lastOrdinal            // strict ascending
  i = head.count / 5 ; lane = head.count % 5
  word = (lane == 0) ? 0 : SLOAD(pdataSlot(pk, i))
  SSTORE(pdataSlot(pk, i), word | ord << (48*lane))
  head.count += 1 ; head.liveCount += 1 ; head.lastOrdinal = ord
  SSTORE(pheadSlot(pk), head)
```

`KIND_BINDING_HIST` is the one explicit exception to occurrence-liveness
postings. It uses `appendAuditPosting`, which requires/sets
`flags = RAW_AUDIT (0x0001)`, appends the physical producing ordinal, and
increments both `count` and `liveCount`; for this family `liveCount == count`
means "audit entries retained", not "currently active occurrences". The
withdrawal fold MUST NOT decrement a RAW_AUDIT head, and a generic decrement
attempt against one reverts an internal invariant error. Pages over this family
enumerate every physical ordinal at the pinned basis and hydrate each
occurrence's status separately. Thus withdrawal can change an entry's grade but
can never hide the mutation that produced a historical Binding revision.
No caller selects the flag: `indexKind == KIND_BINDING_HIST` is the only route
to `appendAuditPosting`, and every other kind requires `flags == 0`.

`appendPosting` is called at most once per `(occurrence ordinal, pk)`. The
Binding-owned raw audit append is outside the occurrence-level liveness key set
and is not included in its admit/withdraw dedup symmetry. Before
any posting write, admission derives the complete bounded candidate-key list
for the occurrence in this order: `KIND_BY_RECORD`, `KIND_BY_TYPE`, and
`KIND_BY_PRINCIPAL`; reference instances in schema role/field order and array
element order
(general then predicate key); then IndexSpecs in `specOrdinal` order. The
record-level unique-by-Type transition is handled separately after
`KIND_BY_RECORD` (§3.3). Admission performs a stable first-seen deduplication
over the **full occurrence-level** list:

```
postingKeysForOccurrence(leaf):
  candidates = deriveCandidateKeys(leaf)       // length <= POSTING_KEY_CANDIDATE_MAX
  distinct = []
  for key in candidates:
    if key not in distinct: distinct.push(key) // bounded linear membership
  return distinct                              // preserves first-seen order
```

This is key equality, not value equality: repeated equal runtime REF/DIGEST
values, repeated array elements, and overlaps between mandatory and declared
families append one posting iff they derive the same final `pk`. Distinct
predicate keys remain distinct. With `POSTING_KEY_CANDIDATE_MAX = 43`, the
simple bounded implementation performs at most `43 * 42 / 2 = 903` bytes32
comparisons; no attacker-controlled loop can exceed that structural bound.
The resulting key set is deterministic from immutable schema + body state.

Postings arrays are never compacted and never rewritten; dead entries remain
and are filtered at read time via `liveAt` and the status overlay (§2.2a). On-chain
compaction is **[REJECTED for B0 — [PROPOSAL] it breaks cursor stability and
ordinal-position determinism; a compacted *view* remains addable later as a
redeployable read layer without kernel state, consistent with the
reserve-selector-as-floor clause in onchain-completeness.md §4]**.

### 2.4 Meta words, receipt batches, and Binding heads

```
TypeSchemaMeta @ tmetaSlot(typeSchemaId):
  typeOrd        [0..47]   uint48
  admitOrdinal   [48..95]  uint48   // ordinal of the Occurrence that admitted the schema
  refRoleCount   [96..103] uint8
  indexSpecCount [104..111] uint8
  bodyLen        [112..143] uint32
  flags          [144..159] uint16  // MBZ in B0
  reserved       [160..255] MBZ

RecordMeta @ rmetaSlot(recordId):
  firstAdmitOrdinal [0..47]  uint48  // 0 = not admitted
  typeOrd           [48..95] uint48
  bodyLen           [96..127] uint32
  flags             [128..143] uint16 // MBZ
  reserved          [144..255] MBZ
  // occurrence counts intentionally NOT duplicated here: they live in the
  // KIND_BY_RECORD postings head (count / liveCount).

EnvelopeMeta @ emetaSlot(envelopeId), consumed from the admission owner:
  principalId       bytes32
  envelopeOrdinal   uint40
  leafCount         uint16
  persisted canonical unsigned-header carriage and full RecordId vector;
  main witness, bodies, target evidence, consent, and receipt basis excluded

  // No leaf-ordinal base exists. No receipt revision, block, or authority
  // basis lives here: staged admission may give one Envelope multiple batches.

PrincipalMeta @ pmetaSlot(principalId):
  principalOrd      [0..47]  uint48
  firstAdmitOrdinal [48..95] uint48
  reserved          [96..255] MBZ
  // authored-occurrence counts live in the KIND_BY_PRINCIPAL postings head.

BindingHead @ bheadSlot0/1(bindingKey), exactly two slots (SR-8):
  slot 0:
    state           [0..7]     uint8  // BindingState wire value below
    revision        [8..39]    uint32
    currentOrdinal  [40..87]   uint48 // widened to uint64 at every ABI
    targetKind      [88..95]   uint8  // 0 NONE, 1 RECORD, 2 OCCURRENCE
    tombstoneCause  [96..103]  uint8  // 0 NONE, 1 EXPLICIT, 2 WITHDRAWAL
    targetLeaf      [104..119] uint16 // iff OCCURRENCE, else zero
    reserved        [120..255]         // MBZ (u136)
  slot 1:
    targetRef       bytes32            // zero when TOMBSTONED

AdmissionBatchMeta (one packed word), consumed from the admission owner:
  firstOrdinal    [0..47]    uint48
  acceptedCount   [48..63]   uint16
  admittedAtBlock [64..111]  uint48
  revisionOrdinal [112..143] uint32
  reserved        [144..255]          // MBZ (u112)

batchAuthorityBasis[batchId] = AuthorityBasisWord
batchCodehash[batchId] = codehashOrZero // stored only for CONTRACT_ERC1271

AuthorityBasisWord =
  kind u8 | verifierVersion u16 | witnessProfile u8 |
  basisBlock u64 | delegateOrZero u160

RealmRevision rows map `revisionOrdinal` to the exact `RealmRevisionId`.
`receiptOf` locates an ordinal's batch by bounded binary search over append-only
`firstOrdinal` boundaries (`BATCH_PROBES_MAX = 64` covers a uint64 batch id),
then returns that batch's explicit revision, full `AuthorityBasisWord`, and
conditional codehash. It never infers authority from Envelope first-touch
metadata or projects it into a lossy code. The signed header's `authEpoch` is
`uint64` (zero in B0) and is hydrated from the persisted envelope.

countersSlot:
  nextOrdinal  [0..47]  uint48  // next allocatable ordinal; initialized to 1
  revisionCount [48..79] uint32
  nextTypeOrd  [80..127] uint48
  nextPrincipalOrd [128..175] uint48
  reserved MBZ
```

---

## 3. Baseline automatic indexes (the mandatory set)

Everything in this section is populated for every accepted Occurrence with no
declaration and no writer choice [OWNER RULING — mandatory automatic indexing,
§0]. Per newly accepted leaf, the baseline writes are: 2 log slots (§2.2), one
fresh status-overlay slot (§2.2a), the
`KIND_BY_TYPE` append, the `KIND_BY_RECORD` append, the `KIND_BY_PRINCIPAL`
append, the conditional `KIND_UNIQUE_BY_TYPE` append, and per reference
instance the `KIND_TARGET` + `KIND_ROLE` appends (§3.5).

### 3.1 Exact point reads (Type / Record / Envelope / Occurrence / receipt)

Type/Record/Envelope/Occurrence reads are O(1), plus
body-length-proportional copying. Receipt hydration is bounded by
`BATCH_PROBES_MAX = 64` because current owner state records exact authority
per accepting batch rather than pretending one envelope has one receipt.
Every public AdmissionOrdinal is `uint64`; packed u48 fields widen on read and
every write range-checks before packing.

```solidity
function getTypeSchema(bytes32 typeSchemaId) external view
  returns (bytes memory canonicalBody, uint48 typeOrd, uint64 admitOrdinal,
           uint8 refRoleCount, uint8 indexSpecCount);

function getRecord(bytes32 recordId) external view
  returns (bytes32 typeSchemaId, bytes memory canonicalBody,
           uint64 firstAdmitOrdinal);

function getEnvelope(bytes32 envelopeId) external view
  returns (bytes memory canonicalUnsignedEnvelope, uint40 envelopeOrdinal,
           uint16 leafCount, bytes32 principalId, uint64 authEpoch);
// canonicalUnsignedEnvelope = abi.encode(EnvelopeHeader, fullRecordIds).
// It is sufficient to recompute the digest/EnvelopeId, not to replay the
// intentionally unstored main witness; receipt/batch is historical validation evidence.

function getOccurrence(bytes32 envelopeId, uint16 leafIndex) external view
  returns (uint8 status, uint64 ordinal, bytes32 recordId,
           bytes32 typeSchemaId, bytes32 principalId,
           uint64 revokedAtOrdinal);

function getOccurrenceByOrdinal(uint64 ordinal) external view
  returns (bytes32 envelopeId, uint16 leafIndex, bytes32 recordId,
           bytes32 typeSchemaId, bytes32 principalId,
           uint8 status, uint64 revokedAtOrdinal);

function getReceipt(uint64 ordinal) external view
  returns (IndexedReceiptView memory);

struct IndexedReceiptView {
  bytes32 envelopeId;
  uint16  leafIndex;
  bytes32 realmId;
  bytes32 realmRevisionId;
  AuthorityBasisWord authorityBasis; // exact packed word, never a code
  bytes32 authorityCodehash;   // zero unless CONTRACT_ERC1271
  uint64  authEpoch;           // signed-header field; zero in B0
  uint64  admissionOrdinal;
  uint48  admittedAtBlock;
  uint8   acceptedStatus;      // immutable receipt outcome: 1 ACCEPTED
  uint8   occurrenceStatus;    // current overlay status
  uint64  revokedAtOrdinal;    // current overlay fold; zero while live
}
```

Non-existent ids return zeroed results with a distinguishing `exists` proxy:
`firstAdmitOrdinal == 0` / `envelopeOrdinal == 0` / occurrence status
`NEVER_ADMITTED` means "not admitted in this Realm" — which, on authoritative
Core state, is **proven Realm-local absence** because admission cannot succeed
without writing these words (mandatory indexing; complete-by-construction)
[PROPOSAL — semantics; reconciled with the carry-in absence discipline in
§5.2]. `getOccurrenceByOrdinal` rejects `ordinal == 0`, values above the
current high-water, and values above the physical u48 range; it never maps a
sparse envelope leaf through base arithmetic. For `PRE_WITHDRAWN`, only
`status`, `ordinal == 0`, and `revokedAtOrdinal` come from the overlay. The
retained target evidence supplies `recordId`, `typeSchemaId`, and `principalId`
from its signed RecordId-matched `(typeSchemaId, bodyHash)` commitment and
authenticated descriptor. It does not make the never-admitted body readable.

### 3.2 Globally ordered accepted-admission pages

The admission log itself, paged by ordinal range — no separate postings:

```solidity
function admissionLogPage(PageRequest calldata req) external view
  returns (PageResult memory); // items[i] = bytes32(uint256(ordinal)), ascending
```

Cursor = next ordinal to read. COMPLETE when the page reaches
`highWaterOrdinal` (= `nextOrdinal − 1` clamped to `req.basisOrdinal` if
pinned); PARTIAL with cursor otherwise.

### 3.3 Unique Records by Type

`KIND_UNIQUE_BY_TYPE` under `pk(T, KIND_UNIQUE_BY_TYPE, 0, 0)` enumerates
**unique Records of Type T having at least one live occurrence at the reported
basis**. Its posting for Record `R` is appended once, at `R`'s stable first
admission ordinal; resurrection of the *record's live set* never appends a
second unique posting.

The unique reader does **not** apply `liveAt` to that stable outer ordinal:
the first occurrence may be withdrawn while another occurrence of the same
Record remains live. Outer ordinals identify Records; record liveness comes
only from the per-Record fold below.

The current-basis count is maintained from `KIND_BY_RECORD` transitions:

```
on occurrence admission for record R of type T:
  br = head(pk(0, KIND_BY_RECORD, 0, R))
  before = br.liveCount
  append occurrence ordinal to br                 // count++, liveCount++
  if before == 0:
    if br.count was 0 before the append:
      append R's stable first ordinal to uniqueByType(T)
    else:
      uniqueByType(T).liveCount += 1              // 0 -> 1, no new posting

on ACTIVE -> WITHDRAWN for an occurrence of R:
  decrement byRecord(R).liveCount first
  if byRecord(R).liveCount == 0:
    uniqueByType(T).liveCount -= 1                // last live occurrence only
```

Thus two live occurrences of one Record count once, and withdrawing either
one alone does not decrement the unique head. Re-admitting an ACTIVE
occurrence writes nothing; a terminal occurrence never resurrects.

For the current basis, the page tests `byRecord(R).liveCount` in O(1) per
outer item. A historical-basis page cannot use the current count. It walks the
outer unique list and, for each candidate Record, its nested `KIND_BY_RECORD`
postings until it finds one occurrence live at `H` or exhausts that record.
**Every outer posting and every nested posting examined is charged to the one
`PAGE_SCAN_MAX` budget.** The `uint256` cursor encodes
`(outerUniqueCursor, innerRecordCursor)`; if the budget ends in either loop,
the reader returns that exact resumable cursor with `PARTIAL`, including when
the page has no items. It performs no hidden history scan and returns
`COMPLETE` only after the outer list and any active nested walk are exhausted.

### 3.4 Occurrences by Type, by Record, by Principal

`KIND_BY_TYPE` / `KIND_BY_RECORD` / `KIND_BY_PRINCIPAL` postings as declared in
§2.1, all read through the one page ABI (§5).

**Author enumeration.** `KIND_BY_PRINCIPAL` **is** author enumeration ("`ls ~`
/ self-restore", onchain-completeness R8). Owner ruling D left self-enumeration
**PENDING on numbers**, leaning "recover roots and forward-walk, with orphan
claims (loose edges not under any owned folder) as the residual gap" [OWNER
RULING — owner-rulings.md 2026-07-15 item D; VERIFIED]. B0 ships the full
author-keyed index, priced inside the ONE aggregate gas bundle (§9).
**Orphan-claims note:** with the full author index there is no orphan gap —
every authored Occurrence is enumerable regardless of graph reachability. If
the aggregate snapshot fails budget, the fallback returned to James is
roots-forward enumeration + an explicit signed orphan gap — never silently
taken [OWNER RULING D + kickoff "return that exact tradeoff to James"].

### 3.5 Reference postings: general backlink + predicate backlink + digest lookup

For every reference instance (role `r` of TypeSchema `T`, target `X`) in an
accepted leaf with ordinal `o`, admission derives **two candidate** postings:

1. `pk(0, KIND_TARGET, 0, targetKey(X))` — the **general backlink** family:
   "every Occurrence referencing X, any type, any role."
2. `pk(T, KIND_ROLE, r, targetKey(X))` — the **predicate backlink** family:
   "Occurrences of T referencing X via role r."

Rationale for two families [PROPOSAL]: "who references X at all" cannot be
answered from predicate-keyed families without enumerating the unbounded set
of (T, r) pairs (violates THE LINE); the predicate question cannot be answered
from a predicate-blind family without scanning — exactly the v1 B4 defect
[DERIVED INVARIANT — onchain-completeness.md §1]. Both are required by the
backlink ruling [OWNER RULING — owner-rulings.md 2026-07-15 item A: "backlinks
incl. predicate-typed (items 1–4): ON-CHAIN, indexed. Slam-dunk"; VERIFIED].
The occurrence-wide stable deduplication in §2.3 runs after all candidates are
derived. Repeating `X` within one role or across roles therefore never appends
the same ordinal twice to one final key: the general key is written once;
each distinct predicate key is written once. Consequently `liveCount` counts
live Occurrences under a key, not repeated equal fields inside one Occurrence.

`targetKey(X)` by the encoding chapter's closed `ReferenceRole.targetClass`
(the role declaration carries the class):

```
RECORD / TYPESCHEMA / PRINCIPAL / OBJECT targets (canonical 32 bytes):
    targetKey = the id itself
OCCURRENCE targets:
    targetKey = occurrenceTargetKey(envelopeId, leafIndex)          // §2.1
```

There is no `REALM`, `ADDRESS`, or `BYTEDIGEST` ReferenceRole target class.
Realm/account concepts that need graph backlinks are represented by ordinary
application Records and referenced as RECORD/OBJECT. A raw scalar may be
declared for value equality where its field kind is eligible, but that does
not make it a graph reference. `DIGEST` is a value kind indexed only through
`DIGEST_EQ` below.

**contentHash → Record/file lookup (deliverable 6).** A DIGEST_EQ field is a
declared value; the `KIND_DIGEST` family keyed by `digestTargetKey` **is** the
bounded keyed lookup "given a sha-256/keccak/git-OID, find what declares
it" [OWNER RULING — owner-rulings.md 2026-07-15 item 13: "add a `contentHash →
DATA/file` index to the A–E bundle … Only the unbounded global dedup sweep …
stays off-chain"; VERIFIED]. Exact shape:

```solidity
function lookupByDigest(uint16 algCode, bytes calldata digest,
                        PageRequest calldata req) external view
  returns (PageResult memory);
// = pagePostings(0, KIND_DIGEST, 0,
//                digestTargetKey(algCode, digest), req)
```

Writer and reader use the identical `digestTargetKey` formula. Before lookup,
Core requires `algCode` to exist in the encoding chapter's one closed u16
table and requires `digest.length` to match that row. Unknown codes and
malformed lengths return a typed validation error (an implementation may
instead return `UNSUPPORTED`); they never produce `COMPLETE + empty` and
therefore never masquerade as proven absence.

Cost scales with matches (THE LINE). The global dedup sweep ("every duplicate
everywhere") remains off-chain **[REJECTED for Core — same ruling]**.

**Reverse membership / cited-by.** B0 has no LIST or REDIRECT kinds;
membership entries and alias/redirect assertions are ordinary typed Records
with declared reference roles, so the v1 R5/R6 gaps are covered by the two
families above with no special machinery [OWNER RULING — owner-rulings.md
2026-07-15 item B: "reverse membership + REDIRECT cited-by: ON-CHAIN … build
the indexes"; VERIFIED — satisfied structurally; red team: check no app
profile reintroduces an unindexed containment shortcut].

### 3.6 Current Binding point reads + complete Realm-local absence at a basis

Per admitted Binding mutation (the bindings chapter owns CAS/tombstone
semantics), admission updates `BindingHead` and appends the mutation's ordinal
to `pk(0, KIND_BINDING_HIST, 0, bindingKey)` through the RAW_AUDIT path.
Revision `r` is physical posting position `r-1` plus one; no liveness filter,
count decrement, or compaction may alter that mapping. `readHistory` hydrates
the producing OccurrenceRef and its status at the call basis, so a withdrawn
mutation remains a visible revision marked WITHDRAWN.

```solidity
enum BindingState { UNSET, BOUND, TOMBSTONED }

struct BindingHead {                  // byte-identical decoded SR-8 head
  uint8   state;                      // BindingState
  uint8   targetKind;                 // 0 NONE / 1 RECORD / 2 OCCURRENCE
  uint8   tombstoneCause;             // 0 NONE / 1 EXPLICIT / 2 WITHDRAWAL
  uint32  revision;
  uint64  admissionOrdinal;           // physical currentOrdinal u48, widened
  bytes32 targetA;                    // targetRef; zero when TOMBSTONED
  uint16  targetLeaf;
}

function getBindingHead(bytes32 bindingKey) external view
  returns (BindingHead memory head, bytes32 realmBasis,
           uint64 highWaterOrdinal);

function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
  external view
  returns (BindingHead memory head, bytes32 realmBasis,
           uint64 highWaterOrdinal);
```

Realm basis and high-water are query metadata, not fields smuggled into or
substituted for the head. Latest point read costs one SLOAD for an absent or
metadata-only result and two for a present head including `targetRef`.
`state == UNSET` on authoritative Core state is **proven complete Realm-local
absence**: every admitted Binding writes the head, mandatory indexing admits
no bypass, so an unset head at basis = no admitted Binding at that key, at
that basis [PROPOSAL — semantics; this is the "complete Realm-local absence at
a basis" obligation from the baseline list, grounded in
complete-by-construction indexing].
- Basis-pinned read: if `currentOrdinal ≤ basisOrdinal`, the head answers
  directly. Else binary-search the history postings for the greatest ordinal
  `≤ basisOrdinal` (postings are strictly ascending): ≤ `BINDING_PROBES_MAX =
  48` packed-slot probes (covers the physical 2^48 entries; each probe 1 SLOAD), then
  hydrate that one Occurrence for the bound value.
  `head.admissionOrdinal = 0` with `state = UNSET` when no mutation existed at
  or before the basis. Bounded,
  deterministic, answer-proportional.

The Binding CAS source check is separate from the head read: it loads the
reversible log entry at `head.admissionOrdinal` and compares the claimed
predecessor to `(source.envelopeId, source.leafIndex)`. No hash-only log word
promises an `occKey → EnvelopeId` reverse lookup.

Withdrawal of the current Binding occurrence and tombstones fold through the
same head + history (bindings chapter owns which transitions are legal;
no-resurrection is enforced there; this chapter only stores and pages).
Withdrawal never removes, filters, or decrements a `KIND_BINDING_HIST` entry.

---

## 4. Declared IndexSpec grammar (Variant A) + fan-out cost model

### 4.1 Grammar (closed, bounded)

Under Type Variant A (B0 axis 4), the `IndexSpec[]` is part of the TypeSchema
canonical body, hence inside `TypeSchemaId` — a new canonical index is a new
TypeSchema [B0 spine pin]. The declaration encoding is fixed-width and packed;
no contract ever parses CBOR or any variable-offset encoding [DERIVED
INVARIANT — carry-in LR-1, lens-spec.md §2.2 "packed, big-endian, fixed-width,
offset-free … No contract parses CBOR"].

The encoding chapter owns one byte-exact grammar; this chapter consumes it
verbatim:

```
IndexSpec (2 bytes):
  u8 indexKind  // 1 SCALAR_EQ, 2 REF_BACKLINK, 3 DIGEST_EQ
  u8 target     // fieldIdx for SCALAR_EQ/DIGEST_EQ; roleId for REF_BACKLINK
MAX_INDEX_SPECS = 8
```

Mappings:

- **SCALAR_EQ** appends under
  `pk(T, KIND_SPEC, specOrdinal, scalarValueKey(fieldBytes))`. Eligible kinds
  and bounded extraction are exactly the encoding chapter's rules; no local
  key-kind byte changes those bytes.
- **REF_BACKLINK** names a declared role and produces the general
  `KIND_TARGET` plus predicate `KIND_ROLE` writes of §3.5 for every instance.
  These are the mandatory reference writes, not a third duplicate posting.
- **DIGEST_EQ** names a DIGEST value field and appends under the global
  `KIND_DIGEST` family with the same `digestTargetKey` used by
  `lookupByDigest` (§3.5). It creates no `KIND_ROLE` or `KIND_TARGET`
  posting and is not a ReferenceRole target class.

TypeSchema admission rejects an unknown kind, an ineligible or
non-extractable target, and duplicate `(indexKind, target)` pairs. It also
rejects declarations that would append the same posting twice. Validation is
deterministic and callback-free; arbitrary Type-created admission callbacks
remain [REJECTED — kickoff "no arbitrary Type-created admission callbacks";
VERIFIED]. Compound and alternate grammars are **[REJECTED for B0]**; adding
one requires a new versioned schema grammar and a new seam resolution before
vectors, never reinterpretation of these two bytes.

### 4.2 Fan-out cost model — who pays

The admitted TypeSchema fixes the fan-out ceiling; the canonical leaf body
fixes the exact deduplicated key count, which admission computes before the
first write. A writer can therefore price the exact submitted body and can
always rely on the schema-level maximum [PROPOSAL — "Type authors declare,
writers pay" per core-architecture-candidate.md Indexes section]:

```
candidateKeys(leaf) = ordered list from §2.3
C(leaf) = len(candidateKeys(leaf))
        = 3                                  // byType + byRecord + byPrincipal
        + 2 × refInstances(leaf)             // candidate general + predicate backlinks
        + applicableValueSpecs(leaf)         // SCALAR_EQ/DIGEST_EQ; ≤ MAX_INDEX_SPECS

D(leaf) = len(stableUnique(candidateKeys(leaf))) // exact distinct posting keys

sum(1 for REF/OCCREF/OPTION(REF),
    declared maxCount for ARRAY(REF))
  <= REF_INSTANCES_MAX = 16 per schema

POSTING_KEY_CANDIDATE_MAX = 3 + 2×16 + 8 = 43
DISTINCT_OCCURRENCE_KEYS_MAX = 43
INDEX_HEAD_TOUCH_MAX = 43 + 1 uniqueByType transition = 44
F_MAX = INDEX_HEAD_TOUCH_MAX = 44             // compatibility name in tables
```

`REF_INSTANCES_MAX = 16` is a consumed SR-18e structural guarantee, not an
assumption. `validateTypeSchemaGroup` enforces it with `ERR_REF_BUDGET`, and
the runtime body walk carries the same defense-in-depth counter, so actual
per-leaf extraction cannot exceed it. The two-byte IndexSpec grammar removes
the old alternate-mode overhead and preserves this conservative `F_MAX`.
Repeated equal runtime values can reduce `D(leaf)` but can never raise it; the
bounded dedup work is at most 903 bytes32 comparisons (§2.3).

- **Admit:** the admitting writer appends once to each of the `D(leaf)`
  distinct occurrence-level keys. The separate unique-by-Type transition may
  append one stable Record posting or modify its live count (§3.3). The same
  call writes 2 log slots, one new `OccStatus` slot, and meta/batch state (§9).
- **Withdraw/revoke:** after the one-way overlay flip, the fold re-derives
  candidate keys in the same order, runs the identical stable deduplication,
  and decrements each of the exact `D(leaf)` occurrence-level heads once.
  `KIND_UNIQUE_BY_TYPE` decrements only when the affected Record's
  `KIND_BY_RECORD.liveCount` reaches zero (§3.3). The key set is
  recomputed deterministically from the state-readable canonical body + the
  admitted immutable TypeSchema (re-extraction), so admit and withdrawal are
  symmetric without storing a key list [PROPOSAL — determinism from the
  full-body spine; zero extra state].
- Nobody else ever pays: readers pay only per-page costs; Type creators pay
  only their schema's admission.

### 4.3 Postings layout recap

All declared-index postings live in the §2.3 store under
`pk(typeSchemaId, KIND_SPEC, specOrdinal, valueKey)` — the predicate
`(typeSchemaId, specOrdinal)` (or `(typeSchemaId, roleOrdinal)` for KIND_ROLE)
is **always in the key**, never in the posting word [DERIVED INVARIANT — the
v1 definitionId defect, onchain-completeness.md §1; §3.2 "the postings word
must carry the predicate (or a per-(target,definitionId) sub-index)" — B0
takes the sub-index realization: key-carried predicate + packed ordinals].

---

## 5. The page-result ABI (every enumeration)

### 5.1 Types and signatures

One request/result shape for **every** enumeration in Core — postings pages,
admission-log pages, binding history, digest lookup [PROPOSAL — one ABI keeps
client and contract consumers layout-independent]:

```solidity
enum Completeness { UNKNOWN, COMPLETE, PARTIAL, UNSUPPORTED }
// 0 = UNKNOWN so zero-initialized/defaulted results can never claim completeness.

struct PageRequest {
  uint256 cursor;       // 0 = start; else the cursor from the prior PageResult
  uint16  maxItems;     // clamped to the endpoint's MAX_PAGE_* constant
  uint64  basisOrdinal; // 0 = current basis; range-check before physical use
}

struct PageResult {
  bytes32 realmBasis;        // RealmRevisionId under which the page was computed
  uint64  highWaterOrdinal;  // greatest ordinal folded into the answering state
                             // (= min(nextOrdinal-1, basisOrdinal if pinned))
  uint256 cursor;            // resume position; CURSOR_END = 2^256-1 when exhausted
  bytes32[] items;           // endpoint-declared item encoding (ordinals: bytes32(uint256(ord)))
  uint32  coverage;          // entries EXAMINED from the underlying structure this call
                             // (≥ items.length; dead/filtered entries counted)
  Completeness completeness;
}

function pagePostings(bytes32 typeSchemaId, uint8 indexKind,
                      uint8 indexOrdinal, bytes32 valueKey,
                      PageRequest calldata req) external view
  returns (PageResult memory);

function pagePostingsHydrated(bytes32 typeSchemaId, uint8 indexKind,
                              uint8 indexOrdinal, bytes32 valueKey,
                              PageRequest calldata req) external view
  returns (PageResult memory ordinals, HydratedItem[] memory hydrated);

struct HydratedItem {
  uint64  ordinal;
  bytes32 envelopeId;
  uint16  leafIndex;
  bytes32 recordId;
  bytes32 principalId;   // full width
  uint8   occurrenceStatus; // ACTIVE | WITHDRAWN at highWaterOrdinal
  uint64  revokedAtOrdinal; // zero when not withdrawn at that basis
}

function counts(bytes32 typeSchemaId, uint8 indexKind, uint8 indexOrdinal,
                bytes32 valueKey) external view
  returns (uint64 totalCount, uint64 liveCount, uint64 lastOrdinal,
           bytes32 realmBasis, uint64 highWaterOrdinal);
```

Item encodings per endpoint: postings/admission-log/binding-history pages
return AdmissionOrdinals as `bytes32(uint256(ordinal))`. Consumers hydrate via
`getOccurrenceByOrdinal` or the hydrated variant. The two lifecycle fields
are redundant for ordinary live-filtered postings (returned items are ACTIVE)
but load-bearing for RAW_AUDIT Binding history.

For `KIND_BINDING_HIST`, `coverage` counts physical audit postings examined
and `items` includes them regardless of current occurrence liveness. The
hydrated form carries the occurrence status/revoked ordinal returned by
`getOccurrenceByOrdinal`. All other occurrence-posting families apply
`liveAt(ord,H)` filtering. A caller cannot request RAW_AUDIT behavior for any
other kind: it is fixed by the closed `indexKind` code and checked against the
head flag.

### 5.2 Completeness semantics (exact rules)

1. **Never-empty rule** [DERIVED INVARIANT — system-constitution.md acceptance
   trace "truncation or missing coverage returns PARTIAL/UNKNOWN, never
   empty"; VERIFIED]: a call that truncates (page bound, scan bound, or gas
   bound reached) returns `PARTIAL` with a resumable `cursor` — including when
   `items` is empty because the scan window held only dead entries.
   An initial (`cursor == 0`) `COMPLETE` with empty `items` proves the index
   authoritatively holds zero live entries at the basis. On a resumed call,
   `COMPLETE` means the validated suffix is exhausted; an empty terminal page
   cannot erase items returned on earlier pages or independently ground
   whole-key absence. Whole-query absence requires the complete cursor chain
   to contain no items. This distinction is mandatory for every stateless
   cursor, including §7's canonical-bound selector.
2. **UNSUPPORTED, never silent-empty**: an `indexKind` outside the closed set,
   a `(typeSchemaId, KIND_SPEC, specOrdinal)` not declared by the admitted
   TypeSchema, an unknown `typeSchemaId` for a type-scoped kind, or a disabled
   mode returns `completeness = UNSUPPORTED` with zero items (checked against
   `TypeSchemaMeta`, 1 SLOAD). An undeclared index can therefore never be
   confused with a declared-but-empty one [DERIVED INVARIANT — "Mutable 'add
   an index later' cannot imply complete historical absence",
   core-architecture-candidate.md Indexes; under Variant A the case is
   structural: a new index = a new TypeSchemaId].
3. **UNKNOWN is reserved; Core never emits it.** Authoritative Core state
   answers COMPLETE/PARTIAL/UNSUPPORTED. The enum reserves UNKNOWN so
   replicas, backfills, and imported foreign evidence carry the same ABI; at
   those tiers UNKNOWN never falls through to the next source and never
   grounds absence [DERIVED INVARIANT — carry-in read-honesty core:
   anti-fallthrough + absence-source discipline, joined-pass-synthesis JR-1 /
   lens-read-gotchas]. **Absence-source reconciliation (required by the
   carry-in):** this chapter adds exactly one absence source to the
   four-source list — *"authoritative complete venue-local index at a pinned
   basis"* — sound because mandatory indexing makes every index
   complete-by-construction over admitted state; no other source in this
   chapter may ground absence [PROPOSAL].
4. **One-basis discipline (FSP-BASIS-1)** [DERIVED INVARIANT —
   lens-read-gotchas.md "One-basis rule": interleaving paged enumeration with
   point reads at drifting bases yields phantoms and ghosts; VERIFIED]: page 1
   returns `highWaterOrdinal = H`; callers pass `basisOrdinal = H` on every
   subsequent page and point read of one logical operation. Liveness folds by
   `revokedAtOrdinal` relative to `H` (§2.2a), so a revocation landing between
   pages does not ghost earlier pages, and admissions after `H` do not phantom
   into later ones. Cross-page basis consistency is therefore exact, not
   best-effort.
5. `coverage` is examined-entry count; `items.length < coverage` reveals
   dead-entry filtering honestly (§8's spray-degradation bound rides on it).
   The raw Binding-history family instead has `items.length == coverage` until
   the requested item/page bound; lifecycle status is hydrated, not filtered.

### 5.3 EIP-7825-aware page maxima (arithmetic in-chapter)

Standards FACT [VERIFIED — pm directive + lens-pass-synthesis LN-4: EIP-7825
tx gas cap = 16,777,216, live on L1 since Fusaka 2025-12-03]. EFS POLICY
[PROPOSAL]: B0 assumes a qualifying Realm enforces a cap ≤ 16,777,216; a Realm
profile without the cap loosens nothing here (the constants stay, sized so a
composing contract retains headroom). Gas figures below use the post-Berlin
schedule (cold SLOAD 2,100; warm SLOAD 100; SSTORE 0→v 20,000 + 2,100 cold
access; SSTORE v→v′ 2,900 warm / 5,000 cold) [PLAUSIBLE — EIP-2929/2200/3529
values from memory; the measurement harness re-verifies; every number below is
harness input, not a freeze claim [HYPOTHESIS — falsified by the A2 gas
snapshot if any bound exceeds 130% of the estimate]].

Per-item worst-case read costs (cold, adversarially non-clustered ordinals):

```
raw item      = postings data (2,100/5 amortized ≈ 420)
              + reversible log A+B (4,200) + OccStatus (2,100) ≈ 6,720
hydrated item = raw + leaf→recordId (≤ 2,100)                     ≈ 8,820
```

These are deliberately conservative [HYPOTHESIS]: `liveAt` must obtain both
components of `OccurrenceRef` before reading the overlay. An implementation
may cache those same log words for hydration, but may not price or implement a
nonexistent log-owned revocation field.

Named constants with arithmetic against the cap:

```
MAX_PAGE_ITEMS           = 512   // raw pages:      512 × 6,720 ≈ 3.44M gas ≈ 20.5% of cap
MAX_PAGE_ITEMS_HYDRATED  = 256   // hydrated pages: 256 × 8,820 ≈ 2.26M gas ≈ 13.5% of cap
PAGE_SCAN_MAX            = 1024  // dead-entry scan bound per call:
                                 // worst 1,024 × 6,720 ≈ 6.88M ≈ 41.0% of cap
PAGE_GAS_ENVELOPE        = 7.7M  // [HYPOTHESIS] rounded above the 6.88M scan
                                 // + 256 × 2,100 hydration increment ≈ 7.42M
CURSOR_END               = 2^256 - 1
```

Returndata: 512 × 32 B = 16 KiB (raw) / 256 × 160 B = 40 KiB (hydrated) —
bounded independently of postings cardinality [PLAUSIBLE]. A contract
needing tighter bounds lowers `maxItems`; the clamp is
`min(req.maxItems, MAX_PAGE_*)`, never a revert.

---

## 6. Revocation-aware current counts

[OWNER RULING — owner-rulings.md 2026-07-15 item E: "live count …
revocation-aware, PAY for it. Do NOT ship 'advisory only.' Revocation-aware
state (count drops when endorsements are revoked) is core to EFS"; VERIFIED.
Advisory-only counters are therefore **[REJECTED — same ruling]**.]

### 6.1 Counter design (exact)

Every postings head carries `liveCount` (§2.3):

- **Increment**: `appendPosting` (+1) at admit — every family, every key.
- **Decrement**: the withdrawal/revocation fold recomputes the admit-time key
  set from the state-readable body (§4.2) after the one-way
  `ACTIVE → WITHDRAWN` overlay transition, applies the identical stable
  first-seen deduplication, and decrements each distinct occurrence-level
  head's `liveCount` exactly once. `KIND_BY_RECORD` decrements first;
  `KIND_UNIQUE_BY_TYPE` decrements only if that value becomes zero — the
  Record's last live occurrence (§3.3). The fold and all decrements are one
  atomic call (axis 6); a partial decrement cannot be observed.
- Invariants (assertable in the prototype): `liveCount ≤ count`;
  `Σ decrements(key) ≤ Σ increments(key)`; a repeated withdrawal of a
  `WITHDRAWN` or `PRE_WITHDRAWN` target is a no-op success before any
  decrement (no double-decrement). Pre-withdrawal of a never-admitted target
  writes `PRE_WITHDRAWN` plus any required bounded retained target evidence
  and decrements nothing.

The clauses above govern occurrence-liveness families. `KIND_BINDING_HIST` is
the explicit RAW_AUDIT exception: append increments `count` and the ABI's
compatibility `liveCount` together, withdrawal never decrements either, and
readers inspect each retained entry's separately hydrated occurrence status.
Treating its `liveCount` as a live-claim count is non-conformant.

For each ACTIVE occurrence and final key, the exact symmetry invariant is
`one append at activation ↔ one decrement at withdrawal`, regardless of how
many equal runtime values emitted that key before deduplication.

`counts()` (§5.1) returns `(totalCount, liveCount)` in one SLOAD plus basis
words — O(1), THE LINE's cheapest read.

### 6.2 The spray-then-self-revoke inflation attack, and what the counter claims

Attack [DERIVED INVARIANT — onchain-completeness.md §1 "Live counts = raw
`.length`, never revocation-decremented → attacker-inflatable by
spray-then-self-revoke"; VERIFIED]: an attacker admits N endorsements at a
key, waits for observers to sample the raw figure, then self-revokes all N.

Under this design:
- `totalCount` and the postings array length **stay inflated forever** (append-
  only). They are audit figures, never gate inputs.
- `liveCount` returns to its true value the moment the fold lands, and
  basis-pinned page reads at any basis after the fold see the dead entries
  filtered. The *number* cannot be left inflated by self-revocation.

**What `liveCount` claims:** the number of admitted, not-withdrawn postings
under this exact key at the returned (current) basis. **What it does NOT
claim:** distinct Principals, distinct Records, endorsement quality, or
Sybil-resistance — N fresh Principals paying N admissions raise it to N
legitimately. A contract gating on a threshold over *untrusted* authors must
therefore combine `liveCount` with a closed trusted author set or a
challenge-window (delay + re-check) pattern; Core ships no duplicity/collision
bit [OWNER RULING — owner-rulings.md 2026-07-15 item F: "on-chain gates use
closed, trusted author sets … challenge-window (delay + re-check) pattern";
the collision bit is TOCTOU-defeated and **[REJECTED — same ruling]**;
VERIFIED]. Counts at a *historical* basis are not stored (that would be a
per-key history index); a basis-pinned count is a client fold over the paged
postings — stated honestly in the ABI docs [PROPOSAL; see Open items].

### 6.3 Cost per write

```
admit:    +1 SSTORE-modify per head touched (the head write is shared with the
          append; liveCount adds zero extra slots) → 0 marginal posting slots;
          the fresh OccStatus slot is priced in §9.
withdraw: OccStatus modify (≈ 5,000 cold) + occurrence-level head decrements;
          uniqueByType decrements only on byRecord liveCount 1 -> 0.
          Conservative ceiling: ≤ D(leaf) distinct decrements + 1 unique
          transition + overlay = 44 × 5,000 + 5,000 ≈ 225,000 gas
          [HYPOTHESIS], plus bounded re-derivation/dedup computation.
```

This is the priced "PAY for it": revocation costs the same order as admission,
by design, and is charged to the withdrawing writer [OWNER RULING item E].

---

## 7. Deterministic best-locator selection

[OWNER RULING — owner-rulings.md 2026-07-15 item C: best-mirror ranking
ON-CHAIN, "zero new state"; VERIFIED. B0 realization: a pure view over
postings + state-readable bodies — no selection state is ever written.]

Lane 8 owns Locator/availability evidence shapes; this chapter consumes them
as opaque canonical bodies with statically extractable declared fields.

```solidity
uint16 constant LOCATOR_POSTINGS_VISIT_MAX = 32;
uint8  constant LOCATOR_BOUNDARY_PROBES_MAX = 48;
uint16 constant LOCATOR_TOTAL_POSTING_READ_MAX = 80;

struct SelectSpec {                 // supplied or pinned by the consumer
  bytes32 typeSchemaId;             // the locator-evidence Type to consider
  uint8   roleOrdinal;              // role whose target identifies the content
  uint8   scoreMode;                // 1 = SCORE_FIELD_MAX, 2 = SCORE_LATEST
  uint8   scoreFieldOrdinal;        // canonical uint64 field read as score (mode 1)
}

function selectBestLocator(
    bytes32 targetKey,
    SelectSpec calldata spec,
    uint64 basisOrdinal,
    uint256 cursor
) external view returns (
    uint64 bestOrdinal,
    uint64 bestScore,
    uint16 postingsVisited,
    uint256 nextCursor,
    Completeness completeness
);
```

Algorithm (deterministic pseudocode):

```
unsupportedSelect():
  return (0, 0, 0, CURSOR_END, UNSUPPORTED)

validateSelectSpec(targetKey, spec, H):
  if targetKey == 0: return false
  meta = TypeSchemaMeta[spec.typeSchemaId]
  if meta does not exist || uint64(meta.admitOrdinal) > H: return false
  role = declaredRole(spec.typeSchemaId, spec.roleOrdinal)
  if role does not exist: return false
  if !declaresIndexSpec(spec.typeSchemaId, REF_BACKLINK,
                        spec.roleOrdinal): return false

  if spec.scoreMode == SCORE_LATEST:
    return spec.scoreFieldOrdinal == 0       // MBZ in this mode
  if spec.scoreMode != SCORE_FIELD_MAX: return false

  field = declaredField(spec.typeSchemaId, spec.scoreFieldOrdinal)
  if field does not exist || field.kind != UINT || field.width != 64:
    return false
  if !isStaticallyExtractable(field): return false
  if !declaresIndexSpec(spec.typeSchemaId, SCALAR_EQ,
                        spec.scoreFieldOrdinal): return false
  return true

postingAt(key, index):
  word = SLOAD(pdataSlot(key, index / POSTINGS_PER_SLOT))
  return lane48(word, index % POSTINGS_PER_SLOT)

canonicalEndAtBasis(key, H, head):
  // Return the first physical index whose ordinal is > H, or head.count.
  // Strictly ascending postings make this the unique canonical boundary.
  if head.count == 0: return (0, 0)
  if uint64(head.lastOrdinal) <= H: return (head.count, 0)

  lo = 0; hi = head.count; probes = 0
  while lo < hi:
    mid = lo + (hi - lo) / 2
    ord = postingAt(key, mid); probes += 1
    if uint64(ord) <= H: lo = mid + 1
    else: hi = mid
  assert probes <= LOCATOR_BOUNDARY_PROBES_MAX
  return (lo, probes)

selectBestLocator(targetKey, spec, basisOrdinal, cursor):
  currentH = nextOrdinal - 1
  contextTag = selectContextTag(targetKey, spec) // 111-bit commitment

  if cursor == 0:
    H = (basisOrdinal == 0) ? currentH : basisOrdinal
    i = 0
  else:
    if cursor == CURSOR_END: revert ErrSelectCursor(cursor)
    (i, claimedEnd, cursorH, cursorTag) = decodeSelectCursor(cursor)
    if basisOrdinal != cursorH || cursorTag != contextTag:
      revert ErrSelectCursor(cursor)
    H = cursorH

  if H > currentH: revert ErrSelectBasis(H, currentH)

  // Validate the Type at H, role, score shape, and index obligations BEFORE
  // deriving/loading the postings key. Undeclared/invalid is not absence.
  if !validateSelectSpec(targetKey, spec, H): return unsupportedSelect()

  key = pk(spec.typeSchemaId, KIND_ROLE, spec.roleOrdinal, targetKey)
  head = SLOAD(pheadSlot(key))
  require head.count <= 2^48 - 1                 // structural invariant

  (canonicalEnd, boundaryProbes) = canonicalEndAtBasis(key, H, head)
  if cursor != 0:
    // The boundary is recomputed from authenticated Realm state. The cursor
    // does not get to choose, truncate, or enlarge it.
    if claimedEnd != canonicalEnd ||
       i == 0 || i % LOCATOR_POSTINGS_VISIT_MAX != 0 ||
       i >= canonicalEnd:
      revert ErrSelectCursor(cursor)

  windowVisited = 0
  winnerPresent = false
  bestOrdinal = 0
  bestScore = 0

  while i < canonicalEnd && windowVisited < LOCATOR_POSTINGS_VISIT_MAX:
    ord = postingAt(key, i)
    i += 1
    windowVisited += 1                 // count EVERY scan posting first
    assert ord <= H                    // guaranteed by canonical upper bound
    if !liveAt(ord, H): continue
    score = (spec.scoreMode == SCORE_LATEST)
      ? ord
      : extractUint64(body(ord), spec.scoreFieldOrdinal)
    if !winnerPresent || score > bestScore ||
       (score == bestScore && ord < bestOrdinal):
      winnerPresent = true
      bestScore = score
      bestOrdinal = ord

  postingsVisited = boundaryProbes + windowVisited
  assert postingsVisited <= LOCATOR_TOTAL_POSTING_READ_MAX
  if i == canonicalEnd:
    if !winnerPresent: return (0, 0, postingsVisited, CURSOR_END, COMPLETE)
    return (bestOrdinal, bestScore, postingsVisited, CURSOR_END, COMPLETE)
  next = encodeSelectCursor(i, canonicalEnd, H, contextTag)
  if !winnerPresent: return (0, 0, postingsVisited, next, PARTIAL)
  return (bestOrdinal, bestScore, postingsVisited, next, PARTIAL)
```

Cursor grammar [PROPOSAL — state-free and fail-closed]:

```
SelectCursor (uint256, nonzero and never CURSOR_END):
  nextIndex       bits [0..47]    u48
  claimedEnd      bits [48..95]   u48  // checked against canonicalEndAtBasis
  basisOrdinal    bits [96..143]  u48
  contextTag      bits [144..254] u111
  reserved        bit  [255]      0

contextTag = low111(keccak256(abi.encode(
  DOM_PK, targetKey, spec.typeSchemaId, uint256(spec.roleOrdinal),
  uint256(spec.scoreMode), uint256(spec.scoreFieldOrdinal))))
```

On an initial `cursor == 0` call, `basisOrdinal == 0` resolves once to the
current high-water `H`; an explicit nonzero basis selects that historical
basis. Every resumed call passes the exact encoded `H` as `basisOrdinal` —
zero never re-resolves to a later current basis during resumption.

`canonicalEndAtBasis` computes the unique first position with ordinal `> H`
using the authoritative sorted postings. Its fast path returns `head.count`
when `head.lastOrdinal ≤ H`; otherwise a lower-bound binary search performs at
most 48 point reads for any physically legal list. Every resumed call
recomputes this boundary and requires `claimedEnd == canonicalEnd`. A nonzero
cursor also requires an emitted window boundary
`nextIndex ∈ {32, 64, ...} < canonicalEnd`; zero, a truncated/enlarged end, an
end-position cursor, a basis/context mismatch, a nonzero reserved bit, or any
other malformed encoding reverts `ErrSelectCursor`.

The u111 context commitment is cursor-misuse detection, not an authorization
primitive. Bit 255 is zero so an encoded resumable cursor cannot collide with
`CURSOR_END`. Stateless cursors cannot prove that a caller consumed earlier
pages: a resumed page's `COMPLETE` applies to the suffix beginning at its
validated `nextIndex`. Whole-query absence requires either an initial
`cursor == 0` call that returns empty `COMPLETE`, or combination of every
window result along one cursor chain.

Exactness notes:
- `LOCATOR_POSTINGS_VISIT_MAX = 32` bounds sequential candidate visits, live
  or dead. `LOCATOR_BOUNDARY_PROBES_MAX = 48` bounds the canonical-end search;
  `postingsVisited` counts **both** boundary point reads and sequential visits,
  so `LOCATOR_TOTAL_POSTING_READ_MAX = 80` is the honest per-call physical-read
  ceiling. Repriced worst case: `48 × 2,100 + 32 × 8,820 ≈ 383k` gas before
  fixed overhead [HYPOTHESIS]. Dead-posting spray therefore yields bounded
  `PARTIAL + nextCursor`, never unbounded look-ahead or false `COMPLETE`.
- The canonical boundary includes exactly the postings whose strictly
  ascending ordinal is `≤ H`. Later appends necessarily have ordinal `> H`,
  so continuous writes cannot change `canonicalEnd` or prevent completion.
- Tie-breaks are total and pinned: `(score desc, AdmissionOrdinal asc)` —
  the earliest equally-scored locator wins, so the selection is stable under
  later spam [PROPOSAL — earliest-wins prevents rank-jacking by re-publishing
  the same score; SCORE_LATEST mode exists for freshest-wins consumers and is
  equally deterministic].
- Winner presence is an explicit boolean during comparison. A real candidate
  with score `0` is valid and beats no winner; ordinal `0` remains only the
  no-winner sentinel. Every window with no live candidate returns the exact
  pair `(bestOrdinal=0, bestScore=0)` for either PARTIAL or COMPLETE.
- `PARTIAL` means "best of this visited window" and always carries a resumable
  cursor. `bestOrdinal == 0 && PARTIAL` is **not absence**. Only
  an initial empty `COMPLETE`, or an empty aggregate after consuming the whole
  cursor chain, proves no live candidate at the pinned basis. A consumer
  combines window winners under the same total order until `COMPLETE`; the
  function never scans beyond the declared window to decide whether a live
  candidate remains.
- Full declaration validation precedes the postings-head lookup. An unknown
  Type, undeclared role/`REF_BACKLINK` obligation, invalid score mode,
  non-u64/non-extractable score field, or missing `SCALAR_EQ` score declaration
  returns `UNSUPPORTED` with zero visits and `CURSOR_END`; none can become
  `COMPLETE + empty`.
- Bounded inputs: the score is one declared uint64 field; composite
  scoring (durability tier + verification status + operator diversity) is a
  Lane 8 profile question — if Lane 8 needs multi-field scores, it compiles
  them into one canonical score field at publication or defines
  `SELECT_PROFILE_V2` [dependsOn — flagged].

---

## 8. Hot-value / spam bounds — the limits table

How a hostile Type creator or writer is prevented from making admission or
reads unbounded [kickoff falsifier 5]:

| Constant | Value | Bounds |
|---|---|---|
| `MAX_INDEX_SPECS` | 8 | encoding-owned TypeSchema bound; 2-byte grammar |
| `REF_INSTANCES_MAX` | 16/leaf | encoding-owned structural guarantee; `ERR_REF_BUDGET` |
| `POSTING_KEY_CANDIDATE_MAX` | 43/leaf | raw occurrence-level derived keys before dedup |
| `POSTING_KEY_DEDUP_COMPARE_MAX` | 903/leaf | bounded stable-dedup bytes32 comparisons |
| `F_MAX` | 44 head touches/leaf | ≤43 distinct occurrence keys + unique transition (§4.2) |
| `MAX_PAGE_ITEMS` | 512 | raw page size (§5.3 arithmetic) |
| `MAX_PAGE_ITEMS_HYDRATED` | 256 | hydrated page size |
| `PAGE_SCAN_MAX` | 1024 | entries examined per page call |
| `LOCATOR_POSTINGS_VISIT_MAX` | 32 | sequential locator postings per call, dead included |
| `LOCATOR_BOUNDARY_PROBES_MAX` | 48 | canonical upper-bound point reads per call |
| `LOCATOR_TOTAL_POSTING_READ_MAX` | 80 | honest total: boundary probes + sequential visits |
| `BINDING_PROBES_MAX` | 48 | binary-search probes per basis-pinned binding read |
| `BATCH_PROBES_MAX` | 64 | binary-search probes for exact receipt batch |
| `ORDINAL_MAX` | 2^48−1 | admission ceiling; revert, never wrap |

Bound arguments:

- **Hostile Type creator.** Fan-out is capped (`MAX_INDEX_SPECS`,
  `REF_INSTANCES_MAX`), statically validated, callback-free (§4.1), and fixed
  at Type admission — a Type cannot make *admission* unbounded (the cost is
  `C(leaf) ≤ 43`, `D(leaf) ≤ 43`, and ≤44 head touches, known before writing)
  and cannot make *reads* unbounded
  (every read is a bounded page, an O(1) point/count, or an explicitly capped
  batch/history probe).
- **Hot values.** A key with 10⁹ postings costs the same per page as a key
  with 10: page reads touch `≤ PAGE_SCAN_MAX` entries, `counts()` is 1 SLOAD,
  binding point reads are 1 SLOAD (+ ≤ 48 probes pinned). No read's cost is a
  function of total key cardinality — THE LINE, mechanically.
- **Spray-then-self-revoke degradation (stated honestly).** Self-revocation
  cannot inflate `liveCount` (§6.2) but the dead entries remain in the array,
  so a sprayer can dilute a key: readers page through dead entries at
  a derived `≈ 6,720 gas each` before fixed overhead, bounded per call by
  `PAGE_SCAN_MAX` (worst ≈ 6.88M gas per call [HYPOTHESIS], §5.3), resuming
  via cursor. Attacker cost: at least one posting append per entry at admit
  **plus** the withdrawal pass (§6.3); defender cost
  per page is capped and the `coverage` field makes dilution visible.
  Compaction stays a redeployable future view (§2.3). [HYPOTHESIS — the
  economic asymmetry suffices; the overlay pricing invalidates the old claimed
  ratio. Falsifier: a Stage-B adversarial fixture where sustained spray makes
  a legitimate consumer's steady-state read cost exceed 2× its clean-key cost
  at equal page yield.]
- **Griefing via shared keys.** Postings keys include the predicate and exact
  value; an attacker cannot append into a key they cannot legitimately write
  to — but any writer CAN reference any target (permissionless graph). So
  target-keyed families are dilutable by construction; that is the same
  openness that makes backlinks useful, and the per-page bound + coverage
  honesty is the designed mitigation, not prevention [stated as POLICY,
  consistent with owner ruling F's trusted-author-set guidance for gates].

---

## 9. Write-path cost model + aggregate arithmetic under EIP-7825

All figures here are schedule-derived **[HYPOTHESIS]** inputs for the Stage B
harness, not envelope-fit claims. The overlay and per-batch full receipt basis
change the earlier arithmetic:

```
per newly accepted occurrence:
  reversible log:     2 × SSTORE-new                     ≈ 44,200
  fresh OccStatus:    1 × SSTORE-new                     ≈ 22,100
  log + lifecycle subtotal                               ≈ 66,300
  posting append:     amortized ≈ 13,420 each
                      // head modify + packed-data new/modify cycle
  baseline/index writes use D(leaf) distinct occurrence keys plus the
  conditional unique-by-Type transition; raw duplicate candidates do not write

typical leaf (2 roles ⇒ 4 ref postings, 1 spec):
  (D <= 3+4+1, plus unique <= 1) × 13,420                ≈ 120,800 max
  occurrence/log/posting subtotal                        ≈ 187,100

worst leaf (D = 43 plus one unique append/head transition):
  44 × 13,420                                            ≈ 590,500
  occurrence/log/posting subtotal                        ≈ 656,800

stable-dedup computation:
  <= 903 bytes32 comparisons + bounded key derivation     remeasure in harness

per accepting call with at least one new occurrence:
  AdmissionBatchMeta + AuthorityBasisWord                ≈ 44,200 new-slot floor
  + conditional contract codehash                        ≈ 0 or 22,100
  + first-touch Envelope/Record/Type/Principal metadata,
    canonical bodies, schema-cache and kernel effects    measured separately

pre-withdrawal of a never-admitted target:
  fresh PRE_WITHDRAWN OccStatus + bounded retained target evidence;
  no log entry for the target and no index-head decrement             measured
```

The full receipt basis belongs to each admission batch because staged calls
for one Envelope may use different Realm revisions, verifier basis blocks, or
contract codehashes. It is not amortized into or projected from EnvelopeMeta.

`MAX_ENVELOPE_LEAVES = 64` remains the SR-5 structural `leafMask uint64`
bound, **not a promise that 64 maximal leaves fit one transaction**. No row in
this chapter claims a 64-leaf fit. The harness must measure the aggregate path
(bodies, cache/effects, overlay, postings, and full batch receipt metadata)
against the qualifying Realm gas cap and return any lower safe cap to James.

**The ONE aggregate bundle.** These per-write figures exist to be summed, not
signed individually: the mandatory-index bundle (baseline families + reference
families + digest lookup + author index + revocation-aware counters +
best-locator view) is priced as ONE gas snapshot against the fixture corpus,
because per-item the gas-cheapest do-nothing is always the Tier-3 outcome
[DERIVED INVARIANT — onchain-completeness.md §4 "price this whole bundle … as
ONE gas snapshot, and sign the aggregate once"; VERIFIED]. If the aggregate
fails the budget, the specific capability tradeoff returns to James — nothing
here is silently droppable [OWNER RULING — 2026-08-12 acceptance-obligation
clause; kickoff measurement gate].

---

## 10. Rejected alternatives and sketched bakeoff arms

**Rejected (with kill sources):**
- Writer opt-out / EAS-style optional indexing — [REJECTED — owner-rulings.md
  2026-07-15 item 12].
- Advisory-only counts — [REJECTED — item E].
- Predicate-blind postings word (v1 B4 layout) — [REJECTED — onchain-
  completeness.md §1; the lesson (predicate in key + revocation story) is
  carried, the layout is not resurrected].
- On-chain duplicity/collision bit — [REJECTED — item F, TOCTOU-defeated].
- uint32 ordinals — [REJECTED — §1.1 arithmetic].
- Event-derived indexes ("logs as index") — [REJECTED — onchain-completeness.md
  §0: event-derived = off-chain under EIP-4444 pruning].
- On-chain postings compaction (B0) — [REJECTED for B0 — §2.3; future
  redeployable view reserved].

**Bakeoff arm F7 — full-width postings (axis 7 alternative; interface sketch
only).** `pdataSlot(pk, i)` holds one 32-byte value per posting: the
`EnvelopeId` (with `leafIndex` + fold in a paired word), i.e. 2 slots/posting,
no packing, no ordinal indirection. Deltas to measure: write ≈ +30k gas per
posting (2 SSTORE-new vs amortized 13.4k); read −2,100/item hydration (no
logSlotA load) and no reliance on `typeOrd`/`principalOrd` local-ordinal maps
(which F7 deletes). Same external ABI (§5) — the page/result shape is
layout-independent by design, so the arm swaps `LibIndex` internals only.
Decision statistic: aggregate write gas vs hydrated-read gas on the frozen
fixture corpus [bakeoff cell per the Stage-A harness; not adopted here].

**Bakeoff sketch — envelope-range log.** Replace per-ordinal `logSlotA`
(envelopeId every leaf) with a binary-searched (baseOrdinal → envelopeId)
range map: write −22.1k/leaf, hydration +~40 probes × 2,100 ≈ +84k/item worst.
Rejected for B0 on read-cost grounds [PROPOSAL — reads dominate over a
century; the arm is recorded for the harness to confirm the asymmetry].

**Bakeoff arm F4 — exact profile coverage interface (not B0).** F4 permits at
most one active and one pending IndexProfile per `(TypeId,ShapeId)`. Admission
writes to the active profile and, while present, the pending profile, bounding
profile fan-out at two. A second pending declaration rejects.

```solidity
enum F4ProfileState { UNDECLARED, DECLARED, BACKFILLING, COMPLETE }
struct F4CoverageState {
  bytes32 indexProfileId; bytes32 typeId; bytes32 shapeId; uint8 state;
  uint32 coverageRevision; uint64 declaredAtOrdinal;
  uint64 historicalEndOrdinal; uint64 backfillNextOrdinal;
  uint64 backfillThroughOrdinal; uint64 liveFromOrdinal;
  uint64 backfillStartedAtBasis; uint64 completedAtBasis;
  uint64 retiredAtBasis;
}
function backfillIndexProfile(
  bytes32 indexProfileId, uint64 expectedNextOrdinal, uint16 maxAdmissions
) external returns (
  uint64 nextOrdinal, uint64 throughOrdinal,
  uint32 coverageRevision, uint8 state
);
```

At declaration ordinal `d`: state=`DECLARED`, revision=1,
`historicalEndOrdinal=d`, `backfillNextOrdinal=1`,
`backfillThroughOrdinal=0`, `liveFromOrdinal=d+1`, and all transition bases are
zero. The declaration occurrence belongs to historical scan `[1,d]`; later
admissions at `>=liveFromOrdinal` enter the pending live partition.

The disposable cap is exactly `F4_BACKFILL_SCAN_MAX=16`. A call requires
`1<=maxAdmissions<=16` and CAS equality with `backfillNextOrdinal`; otherwise a
typed error reverts without changing state. The first success changes
DECLARED→BACKFILLING and records the current admission high-water, then scans
exactly `[next,min(historicalEnd,next+maxAdmissions-1)]`. Matching occurrences
append deterministic historical postings. Every successful state-changing call
increments `coverageRevision` exactly once. Completion occurs when
`next=historicalEnd+1`: set COMPLETE and `completedAtBasis`, activate the new
profile, set the prior active profile's `retiredAtBasis`, and clear pending. A
backfill call mints no admission ordinal. Further calls on COMPLETE reject.

Historical/live partitions remain append-only and ordinal-sorted. A cursor
commits query key, profile, basis, and `coverageRevision`; revision drift makes
resume revert and restart at zero. F4 page operations return the ordinary six
PageResult fields first plus:

```solidity
struct F4CoverageReport {
  bytes32 indexProfileId; uint8 state; uint32 coverageRevision;
  uint64 declaredAtOrdinal; uint64 historicalEndOrdinal;
  uint64 backfillThroughOrdinal; uint64 liveFromOrdinal;
  uint64 backfillStartedAtBasis; uint64 completedAtBasis;
  uint64 retiredAtBasis;
}
struct F4PageResult {
  bytes32 realmBasis; uint64 highWaterOrdinal; uint256 cursor;
  bytes32[] items; uint32 coverage; Completeness completeness;
  F4CoverageReport profile;
}
```

For requested basis H: UNSUPPORTED before declaration; COMPLETE iff the profile
is COMPLETE, backfill covers `min(H,historicalEndOrdinal)`, and H is not past
retirement; otherwise a known profile is PARTIAL. Unknown/malformed profile or
undeclared shape is UNSUPPORTED. UNKNOWN is only unavailable/unproven external
basis. Future basis and stale/mismatched cursor revert. PARTIAL never proves
absence; the report makes `[1,backfillThroughOrdinal]` and the bounded live
interval explicit. [PROPOSAL — exact cell interface; adoption remains open.]

---

## Interfaces exposed

The compact contract other chapters rely on:

**Types & constants** (consumed by lenses, bindings, client, harness):
`Completeness {UNKNOWN=0, COMPLETE, PARTIAL, UNSUPPORTED}`, `PageRequest`,
`PageResult`, `HydratedItem`, `OccStatus`, `IndexedReceiptView`, `BindingHead`,
`BindingState`;
`AdmissionOrdinal = uint64` externally (physical u48, 0 = NONE, first = 1,
`U48_GUARD` before packing);
`CURSOR_END = 2^256−1`; the §8 limits table; the §5.3 page maxima.

**Key derivation** (stable grammar): `pk(typeSchemaId, indexKind,
indexOrdinal, valueKey)` with the closed `KIND_*` set (§2.1) and the
`targetKey`/`valueKey` rules (§3.5, §4.1) — all preimages domain-tagged
with encoding-owned hashed domain words and `abi.encode` fixed words.

**Guarantees other chapters may assume:**
- `ordinal → (EnvelopeId, leafIndex, RecordId, TypeSchemaId, PrincipalId,
  status, revokedAtOrdinal)` by direct two-word log hydration plus one
  occKey-overlay read; no scan or envelope-leaf arithmetic.
- `liveAt(ord, H) ⇔ ord ≤ H ∧ (revokedAt == 0 ∨ revokedAt > H)` — the one
  liveness rule; basis-pinned pages are phantom/ghost-free (FSP-BASIS-1).
- Every enumeration returns the six-part page tuple; truncation ⇒ PARTIAL,
  undeclared ⇒ UNSUPPORTED, UNKNOWN reserved for non-authoritative tiers;
  initial empty+COMPLETE, or an empty aggregate over a full validated cursor
  chain, = proven Realm-local absence at the stated basis; an isolated resumed
  suffix never grounds whole-query absence.
- Mandatory indexing: an accepted Occurrence is present in every applicable
  family in the same atomic call; there is no admitted-but-unindexed state.
- `counts()` liveCount is revocation-aware at current basis, O(1).
- `KIND_BINDING_HIST` is a closed RAW_AUDIT family: physical revision postings
  are never liveness-filtered, decremented, or compacted; history reads hydrate
  lifecycle status separately. Its compatibility `liveCount` equals `count`
  and is not a live-claim count.
- `KIND_UNIQUE_BY_TYPE.liveCount` means live unique Records and changes only
  on the corresponding `KIND_BY_RECORD.liveCount` transitions `0 → 1` and
  `1 → 0` (last live occurrence).
- Candidate fan-out `C(leaf) = 3 + 2·refInstances + valueSpecs ≤ 43` is
  stably deduplicated to `D(leaf) ≤ 43`; with the conditional unique-record
  transition, `F_MAX = 44` head touches. Withdrawal replays the same dedup set.
  Transaction fit remains a measured hypothesis.
- `selectBestLocator` scans at most 32 sequential postings, counting dead ones,
  plus at most 48 logarithmic point reads to recompute the canonical
  ordinal-at-basis boundary; `postingsVisited` reports both (≤80). It validates
  the declared Type/role/score indexes before lookup, rejects any cursor whose
  claimed end differs from the canonical boundary, and returns `PARTIAL` only
  with a validated resumable cursor.
- Full `bytes32 PrincipalId` width preserved in every key, item, and ABI.

**External functions** (Solidity signatures as defined above): `getTypeSchema`,
`getRecord`, `getEnvelope`, `getOccurrence`, `getOccurrenceByOrdinal`,
`getReceipt`, `admissionLogPage`, `pagePostings`, `pagePostingsHydrated`,
`counts`, `lookupByDigest`, `getBindingHead`, `getBindingAtBasis`,
`selectBestLocator`.

**Internal seam:** the logical folds
`activateOccurrence`, `withdrawOccurrence`, `preWithdrawOccurrence`,
`appendPosting`, and `foldRevocation` first operate on Admission's bounded
point-in-order shadow and emit exact typed before/after operations. Admission
is the sole verifier/evidence-retention owner; no evidence/witness bytes cross
this seam. Posting-key derivation and stable dedup happen only in preflight.
Commit accepts the frozen journal, asserts each current word equals its planned
before value, and stores its after value in the identical leaf order; it does
not re-derive or re-decide. No external writer can touch index state.

## Open items

1. **Gas re-measurement (Stage B snapshot).** Every gas figure (§5.3, §6.3, §9) is
   schedule-derived [PLAUSIBLE/HYPOTHESIS]; the Stage B measurement harness
   must replace them and re-derive `MAX_PAGE_ITEMS`, `PAGE_SCAN_MAX`,
   `PAGE_GAS_ENVELOPE`, and the leaf ceilings. Closed by: harness lane +
   fixture corpus run.
2. **Count-at-basis.** `liveCount` is current-basis only; historical counts
   are a client fold. Whether any contract workload needs an on-chain
   count-at-basis (per-key history index — real state cost) is unproven.
   Closed by: fixture evidence; else signed as a client-tier fold.
3. **Self-enumeration pricing.** The author index is in the bundle per §3.4;
   owner ruling D's roots-forward alternative stays the priced fallback.
   Closed by: James, on the aggregate snapshot numbers.
4. **Realm profile without EIP-7825.** Page constants assume the 16,777,216
   cap; a Realm without it (or with a revised cap) re-derives §5.3. Closed by:
   V2-E5 Realm-descriptor chapter declaring the gas profile as a descriptor
   field (adapter seam already shaped for it).
5. **Best-locator score semantics.** `SCORE_FIELD_MAX`/`SCORE_LATEST` are
   pinned; whether Lane 8 needs a composite `SELECT_PROFILE_V2` (multi-field,
   third-party availability attestations) is theirs. Closed by: Lane 8
   chapter + synthesizer.
6. ~~**UNSUPPORTED vs Variant-B coverage.**~~ **CLOSED as an executable cell
   interface, not adopted:** §10 freezes F4's active/pending bound, CAS backfill,
   coverage state, cursor revision, and F4PageResult. Variant A remains B0;
   axis-4 adoption still requires the measured bakeoff outcome and James.
7. **Local-ordinal reverse maps.** `typeOrd`/`principalOrd` (§2.2) trade two
   one-time slots per new Type/Principal for a packed hot word; the F7 arm
   deletes them. Closed by: axis-7 bakeoff measurement.
8. **Spray-degradation economics.** The §8 [HYPOTHESIS] needs the named
   adversarial fixture (sustained spray vs steady-state reader cost ratio).
   Closed by: Stage-B adversarial fixture run.
