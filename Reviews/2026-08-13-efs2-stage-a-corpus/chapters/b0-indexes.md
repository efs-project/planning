# B0 baseline — indexes & query ABI
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 5 of the Stage A pass. This chapter makes the B0 "SPINE" arm's index and
query surface exact: storage layouts, ordinal width, the IndexSpec grammar, the
one page-result ABI, revocation-aware counts, digest lookup, author
enumeration, best-locator selection, spam bounds, and the acceptance rule.
Alternatives get sketched interfaces only, marked as bakeoff arms. Names follow
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

ID family rule [PROPOSAL — per shared skeleton]: all derived keys use
`keccak256(DOMAIN_TAG ‖ version-pinned preimage)` with printable pinned ASCII
domain constants. Domain constants used by this chapter:

```
DOM_PK        = "efs2/pk/1"            // postings key
DOM_VK_SCALAR = "efs2/vk/scalar/1"     // scalar value key (over-32-byte case)
DOM_VK_CMPD   = "efs2/vk/compound/1"   // compound value key
DOM_VK_DIGEST = "efs2/vk/digest/1"     // ByteDigest value key
DOM_SLOT_LOG  = "efs2/slot/log/1"      // admission log region
DOM_SLOT_PH   = "efs2/slot/phead/1"    // postings head
DOM_SLOT_PD   = "efs2/slot/pdata/1"    // postings data region
DOM_SLOT_TM   = "efs2/slot/tmeta/1"    // TypeSchemaMeta
DOM_SLOT_RM   = "efs2/slot/rmeta/1"    // RecordMeta
DOM_SLOT_EM   = "efs2/slot/emeta/1"    // EnvelopeMeta
DOM_SLOT_PM   = "efs2/slot/pmeta/1"    // PrincipalMeta
DOM_SLOT_PBO  = "efs2/slot/pbyord/1"   // principalOrd -> PrincipalId
DOM_SLOT_TBO  = "efs2/slot/tbyord/1"   // typeOrd -> TypeSchemaId
DOM_SLOT_BH   = "efs2/slot/bhead/1"    // BindingHead
DOM_SLOT_REV  = "efs2/slot/revepoch/1" // RealmRevision epoch table
DOM_SLOT_CTR  = "efs2/slot/counters/1" // global counters slot
```

Slot formulas (all concatenations are raw bytes, fixed width, in the order
written; integers big-endian at their declared width):

```
logSlotA(ord)      = keccak256(DOM_SLOT_LOG) + 2*ord        // envelopeId word
logSlotB(ord)      = keccak256(DOM_SLOT_LOG) + 2*ord + 1    // packed meta word
pheadSlot(pk)      = keccak256(DOM_SLOT_PH ‖ pk)
pdataSlot(pk, i)   = keccak256(DOM_SLOT_PD ‖ pk) + i        // i = slot index = floor(n/5)
tmetaSlot(tid)     = keccak256(DOM_SLOT_TM ‖ tid)
rmetaSlot(rid)     = keccak256(DOM_SLOT_RM ‖ rid)
emetaSlot(eid)     = keccak256(DOM_SLOT_EM ‖ eid)
pmetaSlot(prid)    = keccak256(DOM_SLOT_PM ‖ prid)
principalByOrd(po) = keccak256(DOM_SLOT_PBO) + po
typeByOrd(to)      = keccak256(DOM_SLOT_TBO) + to
bheadSlot(bk)      = keccak256(DOM_SLOT_BH ‖ bk)
revEpochSlot(i)    = keccak256(DOM_SLOT_REV) + 2*i          // pair of slots per epoch
countersSlot       = keccak256(DOM_SLOT_CTR)                // ordinal counter etc.
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
pk(typeSchemaId, indexKind uint8, indexOrdinal uint8, valueKey bytes32)
  = keccak256(DOM_PK ‖ typeSchemaId ‖ indexKind ‖ indexOrdinal ‖ valueKey)
```

`indexKind` values (closed set; unknown kind ⇒ UNSUPPORTED, never a scan):

```
KIND_BY_TYPE       = 0x01   // typeSchemaId = T, ordinal 0, valueKey 0
KIND_UNIQUE_BY_TYPE= 0x02   // typeSchemaId = T, ordinal 0, valueKey 0
KIND_BY_RECORD     = 0x03   // typeSchemaId = 0, ordinal 0, valueKey = RecordId
KIND_BY_PRINCIPAL  = 0x04   // typeSchemaId = 0, ordinal 0, valueKey = PrincipalId (full 32 bytes)
KIND_TARGET        = 0x05   // typeSchemaId = 0, ordinal 0, valueKey = targetKey (general backlink + digest lookup)
KIND_ROLE          = 0x06   // typeSchemaId = T, ordinal = roleOrdinal, valueKey = targetKey (predicate backlink)
KIND_SPEC          = 0x07   // typeSchemaId = T, ordinal = specOrdinal, valueKey per IndexSpec (§4)
KIND_BINDING_HIST  = 0x08   // typeSchemaId = 0, ordinal 0, valueKey = BindingKey
```

`PrincipalId` participates at full 32-byte width in `pk` and everywhere else;
no truncation to 160 bits anywhere in this chapter [DERIVED INVARIANT —
system-constitution.md "Every Principal-bearing ID, ABI, storage key, index
key, Binding, and Lens preserves the full bytes32 PrincipalId"; VERIFIED].

### 2.2 The admission log (2 slots per accepted Occurrence)

The log is simultaneously (a) the **globally ordered accepted-admission
pages** index, (b) the O(1) hydration table `ordinal → OccurrenceRef`, and
(c) the **revocation-fold store** used by every liveness check [PROPOSAL —
merging the revocation fold into the per-ordinal word makes liveness + typing
+ authorship one SLOAD per item].

```
logSlotA(ord): EnvelopeId                       // full 32 bytes
logSlotB(ord): packed word, bit layout:
  leafIndex        bits [0..15]    uint16
  typeOrd          bits [16..63]   uint48   // local ordinal of the Occurrence's TypeSchema
  principalOrd     bits [64..111]  uint48   // local ordinal of the author Principal
  revokedAtOrdinal bits [112..159] uint48   // 0 = live; else ordinal of the withdrawal/revocation fold
  flags            bits [160..175] uint16   // MBZ in B0
  reserved         bits [176..255] MBZ
```

Rules:
- Leaves of one envelope are admitted atomically with **consecutive
  ordinals**: `ordinal(leaf k) = EnvelopeMeta.admitOrdinalBase + k`
  [PROPOSAL — one base per envelope makes envelope↔ordinal mapping O(1) both
  ways].
- `revokedAtOrdinal` is write-once monotone: transitions only `0 → W` where
  `W` = the AdmissionOrdinal of the accepted withdrawal/revocation Occurrence.
  Never cleared: no resurrection [DERIVED INVARIANT — system-constitution.md
  "History is append-only evidence. Withdrawal … do not erase prior bytes or
  unexpectedly resurrect an older value"; VERIFIED].
- **Liveness at a basis** (the rule every read uses):
  `liveAt(ord, H) ⇔ ord ≤ H ∧ (revokedAt(ord) == 0 ∨ revokedAt(ord) > H)`.
  Because the fold records *when* it happened (an ordinal, not a bit), reads
  pinned at basis `H` are consistent: an item revoked after `H` is still live
  at `H`. This is the postings families' **live-revocation story**
  [DERIVED INVARIANT — onchain-completeness.md §1/§6 requires one; the ordinal-
  valued fold (vs a bit) is [PROPOSAL — enables basis-pinned reads and repairs
  the FSP-BASIS-1 ghost anomaly, lens-read-gotchas.md "One-basis rule"]].

`typeOrd`/`principalOrd` are Realm-local uint48 ordinals assigned at the first
admission touching that TypeSchema/Principal, with reverse maps
`typeByOrd`/`principalByOrd` (one 32-byte slot each, written once) and forward
maps in the meta words [PROPOSAL — lets the hot log word carry typing and
authorship without 32-byte ids; the F7 bakeoff arm removes them, §10].

### 2.3 The packed postings store (axis-7 arm)

Per postings key `pk`:

```
pheadSlot(pk): PostingsHead, bit layout:
  count       bits [0..63]    uint64  // total ordinals ever appended
  liveCount   bits [64..127]  uint64  // revocation-aware current count (§6)
  lastOrdinal bits [128..175] uint48  // last appended ordinal (append monotonicity check)
  flags       bits [176..191] uint16  // MBZ
  reserved    bits [192..255] MBZ

pdataSlot(pk, i): 5 packed uint48 ordinals, lanes per §1.2; entries are
  append-only, strictly ascending (asserted: newOrd > lastOrdinal).
```

Append pseudocode (deterministic; used by every family):

```
appendPosting(pk, ord):
  head = SLOAD(pheadSlot(pk))
  assert ord > head.lastOrdinal            // strict ascending
  i = head.count / 5 ; lane = head.count % 5
  word = (lane == 0) ? 0 : SLOAD(pdataSlot(pk, i))
  SSTORE(pdataSlot(pk, i), word | ord << (48*lane))
  head.count += 1 ; head.liveCount += 1 ; head.lastOrdinal = ord
  SSTORE(pheadSlot(pk), head)
```

Postings arrays are never compacted and never rewritten; dead entries remain
and are filtered at read time via `logSlotB.revokedAtOrdinal` (§2.2). On-chain
compaction is **[REJECTED for B0 — [PROPOSAL] it breaks cursor stability and
ordinal-position determinism; a compacted *view* remains addable later as a
redeployable read layer without kernel state, consistent with the
reserve-selector-as-floor clause in onchain-completeness.md §4]**.

### 2.4 Meta words (one packed slot each)

```
TypeSchemaMeta @ tmetaSlot(typeSchemaId):
  typeOrd        [0..47]   uint48
  admitOrdinal   [48..95]  uint48   // ordinal of the Occurrence that admitted the schema
  refRoleCount   [96..103] uint8
  indexSpecCount [104..111] uint8
  bodyLen        [112..143] uint32
  flags          [144..159] uint16  // bit0 = COMPOUND_PRESENT; others MBZ
  reserved       [160..255] MBZ

RecordMeta @ rmetaSlot(recordId):
  firstAdmitOrdinal [0..47]  uint48  // 0 = not admitted
  typeOrd           [48..95] uint48
  bodyLen           [96..127] uint32
  flags             [128..143] uint16 // MBZ
  reserved          [144..255] MBZ
  // occurrence counts intentionally NOT duplicated here: they live in the
  // KIND_BY_RECORD postings head (count / liveCount).

EnvelopeMeta @ emetaSlot(envelopeId):
  admitOrdinalBase [0..47]   uint48
  leafCount        [48..63]  uint16
  principalOrd     [64..111] uint48
  authorityBasisCode [112..127] uint16  // versioned verifier profile id (admission chapter owns codes)
  authEpoch        [128..159] uint32   // KEL seam, MBZ in B0 [DERIVED INVARIANT — carry-in KEL (b): reserve the authority seam now]
  bodyLen          [160..191] uint32
  flags            [192..207] uint16   // MBZ
  reserved         [208..255] MBZ

PrincipalMeta @ pmetaSlot(principalId):
  principalOrd      [0..47]  uint48
  firstAdmitOrdinal [48..95] uint48
  reserved          [96..255] MBZ
  // authored-occurrence counts live in the KIND_BY_PRINCIPAL postings head.

BindingHead @ bheadSlot(bindingKey):
  state          [0..7]    uint8   // 0=UNSET, 1=SET, 2=TOMBSTONE
  revision       [8..39]   uint32
  currentOrdinal [40..87]  uint48  // ordinal of the Occurrence that produced current state
  reserved       [88..255] MBZ

RealmRevision epoch table (receipts):
  revEpochSlot(i):   packed { fromOrdinal [0..47] uint48, reserved MBZ }
  revEpochSlot(i)+1: RealmRevisionId (32 bytes)
  epochCount stored in countersSlot (bits [48..79] uint32)
  revisionAt(ord) = binary search over epochs, ≤ 32 probes [bounded; epoch
  count is upgrade-rate bounded, not attacker-writable]

countersSlot:
  nextOrdinal  [0..47]  uint48
  epochCount   [48..79] uint32
  nextTypeOrd  [80..127] uint48
  nextPrincipalOrd [128..175] uint48
  reserved MBZ
```

---

## 3. Baseline automatic indexes (the mandatory set)

Everything in this section is populated for every accepted Occurrence with no
declaration and no writer choice [OWNER RULING — mandatory automatic indexing,
§0]. Per accepted leaf, the baseline writes are: 2 log slots (§2.2), the
`KIND_BY_TYPE` append, the `KIND_BY_RECORD` append, the `KIND_BY_PRINCIPAL`
append, the conditional `KIND_UNIQUE_BY_TYPE` append, and per reference
instance the `KIND_TARGET` + `KIND_ROLE` appends (§3.5).

### 3.1 Exact point reads (Type / Record / Envelope / Occurrence / receipt)

All O(1) (a fixed number of SLOADs, plus body-length-proportional copy for
body reads — proportional to the answer, satisfying THE LINE):

```solidity
function getTypeSchema(bytes32 typeSchemaId) external view
  returns (bytes memory canonicalBody, uint48 typeOrd, uint48 admitOrdinal,
           uint8 refRoleCount, uint8 indexSpecCount);

function getRecord(bytes32 recordId) external view
  returns (bytes32 typeSchemaId, bytes memory canonicalBody,
           uint48 firstAdmitOrdinal);

function getEnvelope(bytes32 envelopeId) external view
  returns (bytes memory canonicalEnvelope, uint48 admitOrdinalBase,
           uint16 leafCount, bytes32 principalId);

function getOccurrence(bytes32 envelopeId, uint16 leafIndex) external view
  returns (uint48 ordinal, bytes32 recordId, bytes32 typeSchemaId,
           bytes32 principalId, uint48 revokedAtOrdinal);

function getOccurrenceByOrdinal(uint48 ordinal) external view
  returns (bytes32 envelopeId, uint16 leafIndex, bytes32 recordId,
           bytes32 typeSchemaId, bytes32 principalId, uint48 revokedAtOrdinal);

function getReceipt(uint48 ordinal) external view
  returns (AdmissionReceipt memory);

struct AdmissionReceipt {
  bytes32 envelopeId;
  uint16  leafIndex;
  bytes32 principalId;        // full width
  bytes32 realmRevisionId;    // via epoch table at `ordinal`
  uint16  authorityBasisCode; // versioned verifier profile used at admission
  uint32  authEpoch;          // 0 in B0; KEL seam
  uint48  ordinal;
  uint48  revokedAtOrdinal;   // 0 = live now
}
```

Non-existent ids return zeroed results with a distinguishing `exists` proxy:
`firstAdmitOrdinal == 0` / `admitOrdinalBase == 0` / `ordinal == 0` means "not
admitted in this Realm" — which, on authoritative Core state, is **proven
Realm-local absence** because admission cannot succeed without writing these
words (mandatory indexing; complete-by-construction) [PROPOSAL — semantics;
reconciled with the carry-in absence discipline in §5.2].

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

`KIND_UNIQUE_BY_TYPE` postings under `pk(T, 0x02, 0, 0)`: appended exactly when
the `KIND_BY_RECORD` head for the leaf's RecordId transitions `count 0 → 1`
(the head is already loaded during the by-record append; the check is free).
The posting's ordinal is the record's **first** admission ordinal. Liveness of
a *record* (vs an occurrence) at basis `H`: the record's `KIND_BY_RECORD`
`liveCount > 0` at current basis, or — basis-pinned — at least one live
occurrence per §2.2's rule; the paged reader filters by hydrating the first
posting and, if dead, consulting `KIND_BY_RECORD` for that record (cost scales
with the page, not history) [PROPOSAL].

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
accepted leaf with ordinal `o`, admission appends **two** postings:

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

`targetKey(X)` by declared target kind (the role declaration carries the kind;
types chapter owns the role table):

```
RECORD / PRINCIPAL / REALM / TYPESCHEMA targets (canonical 32 bytes):
    targetKey = the id itself
OCCURRENCE targets:
    targetKey = keccak256("efs2/vk/occ/1" ‖ envelopeId ‖ leafIndex(uint16 BE))
BYTEDIGEST targets (algorithm-tagged foreign digests; never EFS identity):
    targetKey = keccak256(DOM_VK_DIGEST ‖ algId(uint32 BE) ‖ digestBytes)
ADDRESS targets (raw EVM address, the v1 R3 lesson):
    targetKey = keccak256("efs2/vk/addr/1" ‖ address(20 bytes))
```

**contentHash → Record/file lookup (deliverable 6).** A digest reference is a
reference; the `KIND_TARGET` family keyed by the digest's `targetKey` **is**
the bounded keyed lookup "given a sha-256/keccak/git-OID, find what declares
it" [OWNER RULING — owner-rulings.md 2026-07-15 item 13: "add a `contentHash →
DATA/file` index to the A–E bundle … Only the unbounded global dedup sweep …
stays off-chain"; VERIFIED]. Exact shape:

```solidity
function lookupByDigest(uint32 algId, bytes calldata digest,
                        PageRequest calldata req) external view
  returns (PageResult memory);
// = pagePostings(0, KIND_TARGET, 0, keccak256(DOM_VK_DIGEST ‖ algId ‖ digest), req)
```

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
to `pk(0, KIND_BINDING_HIST, 0, bindingKey)`.

```solidity
enum BindingState { UNSET, SET, TOMBSTONE }

function getBindingHead(bytes32 bindingKey) external view
  returns (BindingState state, uint32 revision, uint48 currentOrdinal,
           bytes32 realmBasis, uint48 highWaterOrdinal);

function getBindingAtBasis(bytes32 bindingKey, uint48 basisOrdinal)
  external view
  returns (BindingState state, uint48 asOfOrdinal,
           bytes32 realmBasis, uint48 highWaterOrdinal);
```

- Latest point read: 1 SLOAD (the head). `state == UNSET` on authoritative
  Core state is **proven complete Realm-local absence**: every admitted
  Binding writes the head, mandatory indexing admits no bypass, so an unset
  head at basis = no admitted Binding at that key, at that basis
  [PROPOSAL — semantics; this is the "complete Realm-local absence at a basis"
  obligation from the baseline list, grounded in complete-by-construction
  indexing].
- Basis-pinned read: if `currentOrdinal ≤ basisOrdinal`, the head answers
  directly. Else binary-search the history postings for the greatest ordinal
  `≤ basisOrdinal` (postings are strictly ascending): ≤ `BINDING_PROBES_MAX =
  48` packed-slot probes (covers 2^48 entries; each probe 1 SLOAD), then
  hydrate that one Occurrence for the bound value. `asOfOrdinal = 0` with
  `state = UNSET` when no mutation existed at or before the basis. Bounded,
  deterministic, answer-proportional.

Withdrawal of the current Binding occurrence and tombstones fold through the
same head + history (bindings chapter owns which transitions are legal;
no-resurrection is enforced there; this chapter only stores and pages).

---

## 4. Declared IndexSpec grammar (Variant A) + fan-out cost model

### 4.1 Grammar (closed, bounded)

Under Type Variant A (B0 axis 4), the `IndexSpec[]` is part of the TypeSchema
canonical body, hence inside `TypeSchemaId` — a new canonical index is a new
TypeSchema [B0 spine pin]. The declaration encoding is fixed-width and packed;
no contract ever parses CBOR or any variable-offset encoding [DERIVED
INVARIANT — carry-in LR-1, lens-spec.md §2.2 "packed, big-endian, fixed-width,
offset-free … No contract parses CBOR"].

Exactly 8 bytes per IndexSpec, big-endian field order as written:

```
IndexSpec (8 bytes):
  byte 0: mode      uint8   // 1=SCALAR_EQ, 2=REF_EQ, 3=BACKLINK, 4=COMPOUND
  byte 1: fieldA    uint8   // canonical-body field ordinal (0-based)
  byte 2: fieldB    uint8   // COMPOUND second component; MBZ otherwise
  byte 3: roleA     uint8   // reference-role ordinal for REF_EQ/BACKLINK; MBZ for SCALAR_EQ/COMPOUND
  byte 4: keyKind   uint8   // 1=WORD32 (canonical field encoding is exactly 32 bytes), 2=HASHED
  byte 5: flags     uint8   // MBZ in B0
  bytes 6–7: reserved uint16 // MBZ
INDEXSPECS_MAX = 8 per TypeSchema
COMPOUND_COMPONENTS_MAX = 2
```

Modes:
- **SCALAR_EQ** — exact equality on ONE canonical bounded scalar field.
  `valueKey`: if the field's canonical encoding is exactly 32 bytes
  (`keyKind = WORD32`), `valueKey` = that word verbatim; else (bounded bytes,
  `SCALAR_BYTES_MAX = 128`) `keyKind = HASHED` and
  `valueKey = keccak256(DOM_VK_SCALAR ‖ fieldBytes)`. A declared
  `keyKind` inconsistent with the field's shape fails Type admission.
- **REF_EQ** — typed-reference equality on the field holding role `roleA`.
  `valueKey = targetKey(X)` per §3.5. Note: REF_EQ postings coincide with the
  KIND_ROLE family for the same (T, role); Type admission therefore rejects a
  REF_EQ spec whose `roleA` is a declared reference role (it is already
  automatically indexed — declaring it again would double-charge writers for
  an identical posting set) [PROPOSAL]. REF_EQ exists for reference-*valued*
  scalar fields that are deliberately not declared as graph roles (types
  chapter owns that distinction).
- **BACKLINK** — target-first backlink by declared field role: exactly the
  KIND_ROLE family of §3.5. In B0, every declared reference role is
  automatically backlink-indexed, so mode 3 in a spec is redundant and Type
  admission rejects it (`ERR_SPEC_REDUNDANT`) [PROPOSAL — keeps "declared role
  ⇒ reverse-queryable" unconditional, per the backlink ruling; the mode code
  is retained in the grammar so Variant-B arms (index profiles separate from
  Type identity) can express opt-in backlinks without renumbering].
- **COMPOUND** — small exact compound key over two components:
  `valueKey = keccak256(DOM_VK_CMPD ‖ keyOf(fieldA) ‖ keyOf(fieldB))` where
  `keyOf` is the SCALAR_EQ/REF_EQ per-field rule. **Gated on workload proof
  [HYPOTHESIS — falsifier: a Stage-B fixture workload (Git multi-ref or Nanda
  catalog) that a single-key index cannot serve in ≤ 2 page reads; until such
  a workload is measured, `COMPOUND_ENABLED = false` and Type admission
  rejects mode 4 with `ERR_COMPOUND_DISABLED`]**. The encoding is pinned now
  so enabling it later changes no preimage grammar.

Static validation at Type admission (deterministic, no callbacks — arbitrary
Type-created admission callbacks are [REJECTED — kickoff "no arbitrary
Type-created admission callbacks"; VERIFIED]): every `fieldA/fieldB` ordinal
must exist in the canonical body shape and be statically extractable; every
`roleA` must exist in the role table; modes/keyKinds must be in the closed
sets; violations revert Type admission.

### 4.2 Fan-out cost model — who pays

Fan-out is fully determined by the admitted TypeSchema, so every writer sees
the exact price before writing [PROPOSAL — "Type authors declare, writers pay"
per core-architecture-candidate.md Indexes section]:

```
F(leaf) = 4                                  // baseline: byType + byRecord + byPrincipal + uniqueByType(≤1)
        + 2 × refInstances(leaf)             // KIND_TARGET + KIND_ROLE per reference instance
        + applicableSpecs(leaf)              // ≤ INDEXSPECS_MAX = 8
REF_INSTANCES_MAX = 16 per leaf              // consumed from the types/encoding chapter [TBD there;
                                             // this chapter's arithmetic assumes ≤ 16]
F_MAX = 4 + 2×16 + 8 = 44 postings per leaf
```

- **Admit:** the admitting writer pays `F(leaf)` posting appends + 2 log slots
  + meta updates, in the same atomic call (§9 arithmetic).
- **Withdraw/revoke:** the withdrawing writer pays the same declared fan-out
  again: the fold sets `revokedAtOrdinal` (1 SSTORE) and decrements
  `liveCount` in **every** postings head the admit incremented. The key set is
  recomputed deterministically from the state-readable canonical body + the
  admitted TypeSchema (re-extraction), so no key list is stored [PROPOSAL —
  determinism from the full-body spine; zero extra state].
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
  uint48  basisOrdinal; // 0 = current basis; else pin: fold only ordinals ≤ basisOrdinal
}

struct PageResult {
  bytes32 realmBasis;        // RealmRevisionId under which the page was computed
  uint48  highWaterOrdinal;  // greatest ordinal folded into the answering state
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
  uint48  ordinal;
  bytes32 envelopeId;
  uint16  leafIndex;
  bytes32 recordId;
  bytes32 principalId;   // full width
}

function counts(bytes32 typeSchemaId, uint8 indexKind, uint8 indexOrdinal,
                bytes32 valueKey) external view
  returns (uint64 totalCount, uint64 liveCount, uint48 lastOrdinal,
           bytes32 realmBasis, uint48 highWaterOrdinal);
```

Item encodings per endpoint: postings/admission-log/binding-history pages
return AdmissionOrdinals as `bytes32(uint256(ordinal))`. Consumers hydrate via
`getOccurrenceByOrdinal` or the hydrated variant.

### 5.2 Completeness semantics (exact rules)

1. **Never-empty rule** [DERIVED INVARIANT — system-constitution.md acceptance
   trace "truncation or missing coverage returns PARTIAL/UNKNOWN, never
   empty"; VERIFIED]: a call that truncates (page bound, scan bound, or gas
   bound reached) returns `PARTIAL` with a resumable `cursor` — including when
   `items` is empty because the scan window held only dead entries.
   `COMPLETE` with empty `items` is returned **only** when the index
   authoritatively holds zero live entries at the basis — which, on Core
   state, is proven Realm-local absence (complete-by-construction, §0).
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
   `revokedAtOrdinal` relative to `H` (§2.2), so a revocation landing between
   pages does not ghost earlier pages, and admissions after `H` do not phantom
   into later ones. Cross-page basis consistency is therefore exact, not
   best-effort.
5. `coverage` is examined-entry count; `items.length < coverage` reveals
   dead-entry filtering honestly (§8's spray-degradation bound rides on it).

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
raw item      = postings data (2,100/5 amortized ≈ 420) + logSlotB liveness (2,100) ≈ 2,520
hydrated item = raw + logSlotA envelopeId (2,100) + leaf→recordId (≤ 2,100)        ≈ 6,720
```

Named constants with arithmetic against the cap:

```
MAX_PAGE_ITEMS           = 512   // raw pages:      512 × 2,520 ≈ 1.29M gas ≈ 7.7% of 16,777,216
MAX_PAGE_ITEMS_HYDRATED  = 256   // hydrated pages: 256 × 6,720 ≈ 1.72M gas ≈ 10.3% of cap
PAGE_SCAN_MAX            = 1024  // dead-entry scan bound per call:
                                 // worst 1,024 × 2,520 ≈ 2.58M ≈ 15.4% of cap
PAGE_GAS_ENVELOPE        = 4.4M  // named worst-call bound (rounded up from the
                                 // derived 2.58M scan + 1.72M hydration ≈ 4.30M,
                                 // ≈ 26% of cap) — a composing contract keeps
                                 // ≥ 12.3M for its own logic
CURSOR_END               = 2^256 - 1
```

Returndata: 512 × 32 B = 16 KiB (raw) / 256 × 160 B = 40 KiB (hydrated) —
negligible against calldata/returndata practice [PLAUSIBLE]. A contract
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
  set from the state-readable body (§4.2) and decrements each head's
  `liveCount` by exactly the number of postings that admit appended under that
  key. The fold and all decrements are one atomic call (axis 6); a partial
  decrement cannot be observed.
- Invariants (assertable in the prototype): `liveCount ≤ count`;
  `Σ decrements(key) ≤ Σ increments(key)`; a second withdrawal of the same
  Occurrence is rejected by the monotone `revokedAtOrdinal` check before any
  decrement (no double-decrement).

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
          append; liveCount adds zero extra slots) → 0 marginal slots, 0 marginal
          cold accesses; ≈ 0 marginal gas beyond the append itself.
withdraw: fold (1 SSTORE-modify to logSlotB ≈ 5,000 cold) +
          F(leaf) head decrements ≈ F × (2,100 + 2,900) = F × 5,000
          worst F = 44 → ≈ 225,000 gas; typical F (2 roles ⇒ 4 ref postings,
          1 spec, 4 baseline) = 9 → ≈ 50,000
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
struct SelectSpec {                 // supplied or pinned by the consumer
  bytes32 typeSchemaId;             // the locator-evidence Type to consider
  uint8   roleOrdinal;              // role whose target identifies the content
  uint8   scoreMode;                // 1 = SCORE_FIELD_MAX, 2 = SCORE_LATEST
  uint8   scoreFieldOrdinal;        // canonical uint64 field read as score (mode 1)
}

function selectBestLocator(bytes32 targetKey, SelectSpec calldata spec,
                           uint48 basisOrdinal) external view
  returns (uint48 bestOrdinal,      // 0 = none live in examined window
           uint64 bestScore,
           uint16 examined,
           Completeness completeness);
```

Algorithm (deterministic pseudocode):

```
selectBestLocator(targetKey, spec, H):
  key   = pk(spec.typeSchemaId, KIND_ROLE, spec.roleOrdinal, targetKey)
  best  = (score = -∞, ordinal = 0); examined = 0
  for ord in postings(key) ascending, while examined < LOCATOR_CANDIDATES_MAX:
      if not liveAt(ord, H): continue            // §2.2 rule; dead entries skipped, still counted below
      examined += 1
      s = (spec.scoreMode == SCORE_LATEST) ? ord
          : extractUint64(body(ord), spec.scoreFieldOrdinal)   // static extractor, encoding chapter
      // deterministic total order: higher score wins; ties → LOWEST ordinal wins
      if s > best.score or (s == best.score and (best.ordinal == 0 or ord < best.ordinal)):
          best = (s, ord)
  completeness = (more live candidates remain beyond the window) ? PARTIAL : COMPLETE
  return (best.ordinal, best.score, examined, completeness)
```

Exactness notes:
- `LOCATOR_CANDIDATES_MAX = 32` live candidates examined per call [PROPOSAL —
  32 × (liveness 2,520 + body-field extract ≈ 2,600) ≈ 164k gas ≈ 1% of the
  7825 cap; a hostile sprayer padding the candidate list costs themselves
  admission gas per entry and can only force `PARTIAL`, never a wrong
  COMPLETE].
- Tie-breaks are total and pinned: `(score desc, AdmissionOrdinal asc)` —
  the earliest equally-scored locator wins, so the selection is stable under
  later spam [PROPOSAL — earliest-wins prevents rank-jacking by re-publishing
  the same score; SCORE_LATEST mode exists for freshest-wins consumers and is
  equally deterministic].
- `PARTIAL` means "best of the examined window"; a consumer needing the global
  optimum pages the postings itself under §5. Honest, bounded, and stated.
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
| `INDEXSPECS_MAX` | 8 | Type creator's declarable spec fan-out |
| `REF_INSTANCES_MAX` | 16/leaf | reference fan-out per leaf (types/encoding chapter owns; assumed here) |
| `COMPOUND_COMPONENTS_MAX` | 2 | compound key width |
| `COMPOUND_ENABLED` | false (B0) | mode 4 admission gate (§4.1) |
| `SCALAR_BYTES_MAX` | 128 | scalar key preimage size |
| `F_MAX` | 44 postings/leaf | total per-leaf declared fan-out (derived, §4.2) |
| `MAX_PAGE_ITEMS` | 512 | raw page size (§5.3 arithmetic) |
| `MAX_PAGE_ITEMS_HYDRATED` | 256 | hydrated page size |
| `PAGE_SCAN_MAX` | 1024 | entries examined per page call |
| `LOCATOR_CANDIDATES_MAX` | 32 | live candidates per selection call |
| `BINDING_PROBES_MAX` | 48 | binary-search probes per basis-pinned binding read |
| `ORDINAL_MAX` | 2^48−1 | admission ceiling; revert, never wrap |

Bound arguments:

- **Hostile Type creator.** Fan-out is capped (`INDEXSPECS_MAX`,
  `REF_INSTANCES_MAX`), statically validated, callback-free (§4.1), and fixed
  at Type admission — a Type cannot make *admission* unbounded (the cost is
  `F(leaf) ≤ F_MAX`, known before writing) and cannot make *reads* unbounded
  (every read is a bounded page or an O(1) point/count).
- **Hot values.** A key with 10⁹ postings costs the same per page as a key
  with 10: page reads touch `≤ PAGE_SCAN_MAX` entries, `counts()` is 1 SLOAD,
  binding point reads are 1 SLOAD (+ ≤ 48 probes pinned). No read's cost is a
  function of total key cardinality — THE LINE, mechanically.
- **Spray-then-self-revoke degradation (stated honestly).** Self-revocation
  cannot inflate `liveCount` (§6.2) but the dead entries remain in the array,
  so a sprayer can dilute a key: readers page through dead entries at
  `≈ 420–2,520 gas each`, bounded per call by `PAGE_SCAN_MAX` (worst ≈ 2.58M
  gas per call, §5.3), resuming via cursor. Attacker cost: ≥ ~13.4k gas per
  spam posting × F at admit **plus** the withdrawal pass (§6.3); defender cost
  per page is capped and the `coverage` field makes dilution visible.
  Compaction stays a redeployable future view (§2.3). [HYPOTHESIS — the
  economic asymmetry (attacker pays ~10× per entry what any single reader pays
  to skip it, once) suffices; falsifier: a Stage-B adversarial fixture where
  sustained spray makes a legitimate consumer's steady-state read cost exceed
  2× its clean-key cost at equal page yield.]
- **Griefing via shared keys.** Postings keys include the predicate and exact
  value; an attacker cannot append into a key they cannot legitimately write
  to — but any writer CAN reference any target (permissionless graph). So
  target-keyed families are dilutable by construction; that is the same
  openness that makes backlinks useful, and the per-page bound + coverage
  honesty is the designed mitigation, not prevention [stated as POLICY,
  consistent with owner ruling F's trusted-author-set guidance for gates].

---

## 9. Write-path cost model + aggregate arithmetic under EIP-7825

Per accepted leaf (cold, worst-case; harness re-measures [HYPOTHESIS as §5.3]):

```
log slots:            2 × SSTORE-new           ≈ 44,200
posting append:       amortized ≈ 13,420 each  // head 5,000 + data (22,100 + 4×5,000)/5
meta updates:         RecordMeta (new 22,100 | seen 0) + Envelope/Principal/Type
                      metas amortized over the envelope ≈ 30,000/leaf worst
baseline postings:    4 × 13,420 ≈ 53,700
typical leaf (2 roles ⇒ 4 ref postings, 1 spec):  (4+4+1) × 13,420 ≈ 120,800
   → typical index total ≈ 44,200 + 120,800 + 30,000 ≈ 195,000 gas/leaf
worst leaf (F_MAX = 44): 44 × 13,420 ≈ 590,500
   → worst index total ≈ 44,200 + 590,500 + 30,000 ≈ 664,700 gas/leaf
```

EIP-7825 batch arithmetic (cap 16,777,216):

```
index-only ceiling:  16,777,216 / 664,700  ≈ 25 worst-declared leaves per tx
                     16,777,216 / 195,000  ≈ 86 typical leaves per tx
with bodies:         a 1 KiB canonical body ≈ 32 words × 22,100 ≈ 707,000 gas
                     → worst leaf + 1 KiB body ≈ 1.37M → ≤ 12 leaves/tx
```

Consequence for the envelope chapter [dependsOn]: any `ENVELOPE_MAX_LEAVES ≥
16` must either bound per-leaf declarations/bodies or accept that worst-case
envelopes revert on gas before reaching the leaf cap; this chapter's numbers
are the constraint, the envelope chapter picks the constant.

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

---

## Interfaces exposed

The compact contract other chapters rely on:

**Types & constants** (consumed by lenses, bindings, client, harness):
`Completeness {UNKNOWN=0, COMPLETE, PARTIAL, UNSUPPORTED}`, `PageRequest`,
`PageResult`, `HydratedItem`, `AdmissionReceipt`, `BindingState`;
`AdmissionOrdinal = uint48` (0 = NONE, first = 1, revert at 2^48−1);
`CURSOR_END = 2^256−1`; the §8 limits table; the §5.3 page maxima.

**Key derivation** (stable grammar): `pk(typeSchemaId, indexKind,
indexOrdinal, valueKey)` with the closed `KIND_*` set (§2.1) and the
`targetKey`/`valueKey` rules (§3.5, §4.1) — all preimages domain-tagged
`"efs2/…/1"`.

**Guarantees other chapters may assume:**
- `ordinal → (EnvelopeId, leafIndex, RecordId, TypeSchemaId, PrincipalId,
  revokedAtOrdinal)` in ≤ 4 SLOADs (O(1) hydration).
- `liveAt(ord, H) ⇔ ord ≤ H ∧ (revokedAt == 0 ∨ revokedAt > H)` — the one
  liveness rule; basis-pinned pages are phantom/ghost-free (FSP-BASIS-1).
- Every enumeration returns the six-part page tuple; truncation ⇒ PARTIAL,
  undeclared ⇒ UNSUPPORTED, UNKNOWN reserved for non-authoritative tiers;
  empty+COMPLETE = proven Realm-local absence at the stated basis.
- Mandatory indexing: an accepted Occurrence is present in every applicable
  family in the same atomic call; there is no admitted-but-unindexed state.
- `counts()` liveCount is revocation-aware at current basis, O(1).
- Fan-out formula `F(leaf) = 4 + 2·refInstances + specs ≤ 44` — the envelope
  chapter's leaf-cap constraint; withdrawal costs the same fan-out again.
- Full `bytes32 PrincipalId` width preserved in every key, item, and ABI.

**External functions** (Solidity signatures as defined above): `getTypeSchema`,
`getRecord`, `getEnvelope`, `getOccurrence`, `getOccurrenceByOrdinal`,
`getReceipt`, `admissionLogPage`, `pagePostings`, `pagePostingsHydrated`,
`counts`, `lookupByDigest`, `getBindingHead`, `getBindingAtBasis`,
`selectBestLocator`.

**Internal seam:** `LibIndex.appendPosting(pk, ord)` /
`LibIndex.foldRevocation(ord, W, keys…)` invoked only by the admission path of
the one atomic Core (axis 6); no external writer can touch index state.

## Open items

1. **Gas re-measurement (A2 snapshot).** Every gas figure (§5.3, §6.3, §9) is
   schedule-derived [PLAUSIBLE/HYPOTHESIS]; the Stage-A measurement harness
   must replace them and re-derive `MAX_PAGE_ITEMS`, `PAGE_SCAN_MAX`,
   `PAGE_GAS_ENVELOPE`, and the leaf ceilings. Closed by: harness lane +
   fixture corpus run.
2. **`REF_INSTANCES_MAX` reconciliation.** Assumed 16/leaf here; the
   types/encoding chapter owns the real bound. Closed by: synthesizer
   reconciling the two chapters' constants.
3. **Compound-key enable gate.** `COMPOUND_ENABLED = false` pending a fixture
   workload a single-key index cannot serve in ≤ 2 page reads (§4.1). Closed
   by: Stage-B Git/Nanda workload measurement.
4. **Count-at-basis.** `liveCount` is current-basis only; historical counts
   are a client fold. Whether any contract workload needs an on-chain
   count-at-basis (per-key history index — real state cost) is unproven.
   Closed by: fixture evidence; else signed as a client-tier fold.
5. **Self-enumeration pricing.** The author index is in the bundle per §3.4;
   owner ruling D's roots-forward alternative stays the priced fallback.
   Closed by: James, on the aggregate snapshot numbers.
6. **Realm profile without EIP-7825.** Page constants assume the 16,777,216
   cap; a Realm without it (or with a revised cap) re-derives §5.3. Closed by:
   V2-E5 Realm-descriptor chapter declaring the gas profile as a descriptor
   field (adapter seam already shaped for it).
7. **Best-locator score semantics.** `SCORE_FIELD_MAX`/`SCORE_LATEST` are
   pinned; whether Lane 8 needs a composite `SELECT_PROFILE_V2` (multi-field,
   third-party availability attestations) is theirs. Closed by: Lane 8
   chapter + synthesizer.
8. **UNSUPPORTED vs Variant-B coverage.** §5.2 rule 2 is structural under
   Variant A. If the axis-4 bakeoff selects Variant B (separate IndexProfile),
   the UNSUPPORTED rule must gain start-basis/coverage fields
   (`PARTIAL`-until-proven-backfill). Closed by: axis-4 bakeoff outcome.
9. **Local-ordinal reverse maps.** `typeOrd`/`principalOrd` (§2.2) trade two
   one-time slots per new Type/Principal for a packed hot word; the F7 arm
   deletes them. Closed by: axis-7 bakeoff measurement.
10. **Spray-degradation economics.** The §8 [HYPOTHESIS] needs the named
    adversarial fixture (sustained spray vs steady-state reader cost ratio).
    Closed by: Stage-B adversarial fixture run.
