# B0 contract Lens — ResolutionPlan/1 and bounded point resolution

**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 7 of the Stage A commissioned pass (2026-08-12). This chapter makes the B0
"spine" arm's contract-Lens surface exact: the `ResolutionPlan/1` byte layout, its
storage on the state-readable Record spine, the deterministic resolution algorithm
over Principal-qualified Binding heads, the honest outcome model, the risk-bearer
ABI split, gas arithmetic at the 1/8/32/64 benchmark sizes, the deferred PATH
profile stub, and the challenge-window consumer pattern. Alternatives (CREATE2
plan store, advisory sections, roster hints) appear only as labeled bakeoff arms
with sketched interfaces. Post-red-team, this chapter is repaired to the
overview's SR pins — chiefly SR-6 (BindingKey domain), SR-8 (2-slot head, no
authority basis on the head, regenerated gas rows), SR-13 (verifier chain),
and SR-18 (shared vocabularies) — and carries the DI-13 client-tier
conformance rules the carry-in register imported.

Evidence base: [[lens-spec]] §2–§3 (LR-1/LR-2/LR-3, PlanV1 evidence, plan-store
options), [[lens-read-gotchas]], `Reviews/2026-07-25-lens-pass-corpus/`
(object-taxonomy §2.2 RosterV1 layout; core-onchain §§2–6 gas and storage
analysis), [[owner-rulings]] 2026-07-15 item F (line 51–53), [[system-constitution]]
"Lenses for contracts and people" (line ~193–199), [[assumptions-and-requirements]]
§10 (the basis-grade axis), and the intake audit CARRY-IN lane. Per the greenfield
rules, every lens-pass mechanism re-enters here under an explicit label; nothing
is inherited by default.

---

## 1. Scope and inherited pins

This chapter assumes the B0 spine pins (binding for this arm; alternatives are
bakeoff arms only):

- axis 5/axis 6: one atomic physical Core contract; `LensResolve` is a narrow
  logical module realized as an internal library; the Record spine is
  state-readable with full bodies (no elision) — [OWNER RULING] items 17/18,
  [[owner-rulings]] 2026-07-15 ("17 — full-body spine: RULED — PAY IT";
  "18 — no body-elision: RULED — ETCH IT").
- axis 2: uniform full-width `bytes32 PrincipalId` everywhere; B0 Principals are
  intrinsic zero-setup account Principals whose authority is validated at
  admission time by the SR-13 verifier chain
  (`computePrincipalId(principal) == envelope.header.principalId` asserted
  before `verify(AccountPrincipal calldata p, bytes32 digest, bytes calldata
  witness, VerifyContext memory ctx) → (AuthorityBasisWord, bytes32
  codehashOrZero)`) and recorded as the SR-7 packed `AuthorityBasisWord` on
  each accepting `AdmissionBatch`, with its conditional `authorityCodehash`
  (zero unless `CONTRACT_ERC1271`), then hydrated through the occurrence
  receipt — **NOT on the Binding head or EnvelopeMeta**. One Envelope may be
  admitted in stages under separately verified batches, so no singular
  envelope-level basis/codehash exists
  (SR-8) ([DERIVED INVARIANT — kel.md §3/§8.2 admission-time-validation
  lesson, via CARRY-IN KEL finding (a); representation per SR-7/SR-8/SR-13]).
- Binding heads: Lane 6 owns `PositionKey` derivation, the head state machine
  (CAS, tombstone, no-resurrection), and head storage. This chapter consumes
  its exact SR-8 head and Lane 5's basis-qualified read wrappers (§5.2).
- The canonical BODY codec is owned by the encoding chapter; §4.1 states the one
  property this chapter needs from it.

Out of scope here: RICH/client lens composition, imports, channels, discovery,
advisory grammars, wide enumeration, GATE install ceremonies (the attack-repair
conformance rules ride the consumer-profile chapter), and the EAS adapter seam.

---

## 2. Named constants

| Constant | Value | Status |
|---|---|---|
| `PLAN_VERSION_1` | `0x01` | [PROPOSAL] |
| `MAX_PLAN_ENTRIES_CORE` | `64` | [PROPOSAL — rationale §3.4; benchmark sizes 1/8/32/64 are the V2-E2 gate] |
| `MAX_PLAN_ENTRIES_CLIENT` | `256` | [HYPOTHESIS — client compile ceiling, not enforced by Core; falsified/retuned by the V2-E2-successor client bench; evidence: lens-spec §2.4 "[LP-4] candidate 64 vs 256"] |
| `PLAN_HEADER_BYTES` | `96` | [PROPOSAL] |
| `PLAN_ENTRY_BYTES` | `64` | [PROPOSAL] |
| `MAX_PLAN_FRAME_BYTES` | `96 + 64·64 = 4,192` | arithmetic; value of the one MC/1 BYTES field |
| `MAX_PLAN_CANONICAL_BODY_BYTES` | `2 + 4,192 = 4,194` | MC/1 u16 length prefix plus frame |
| `SEMANTICS_PROFILE_B0` | `keccak256("efs2/lens-semantics/b0/1")` | [PROPOSAL — multi-segment name, legal under amended SR-1; the string enters the encoding chapter's closed §1.3 table] |
| `DOM_BINDING` | `keccak256("efs2/binding/1")` | SR-6 pin [PROPOSAL]. The draft spellings `efs2/binding-key/1` (this chapter) and `efs2/bindingkey/1` (Lane 6 draft) are retired [REJECTED — SR-6] |
| `DOM_PLAN_PURPOSE` | `keccak256("efs2/plan-purpose/1")` | [PROPOSAL — regenerated under SR-1; enters the closed table] |
| `WINNER_NONE` | `0xFFFF` (uint16 sentinel) | [PROPOSAL] |
| `TYPE_RESOLUTION_PLAN_1` | TypeSchemaId of the plan Type — value produced by the encoding/type chapter's golden vectors | TBD (encoding chapter decides the preimage; this chapter fixes the body layout it commits) |
| `MAX_PATH_DEPTH_CORE` | TBD — decided by the deferred PATH benchmark (§9) | deferred |

**Two constants, two jobs** [DERIVED INVARIANT — lens-pass-synthesis LN-3 /
lens-spec §2.4: "the CORE per-plan entry cap ≠ the client compile ceiling; conflating
them was the `MAX_LENSES = 20` mistake"]. `MAX_PLAN_ENTRIES_CORE` bounds what the
Core resolver will execute; `MAX_PLAN_ENTRIES_CLIENT` bounds what a client
compiler will emit for rich lenses that project down to plans. Core never reads
the client constant.

---

## 3. `ResolutionPlan/1` — exact packed frame and MC/1 body

### 3.1 Derived invariants this layout obeys

- **No contract parses CBOR.** The contract-tier policy artifact is one packed,
  big-endian, fixed-width, offset-free byte string; any structured client-side
  authoring format stays client-side. [DERIVED INVARIANT — lens-spec §2.2 (LR-1);
  lens-pass corpus object-taxonomy §2.1/§2.2, VERIFIED.]
- **Plan-committed caps; exact-length frames; reserved bytes zero; fail-closed
  unknowns.** Every limit the resolver honors is committed inside the plan bytes
  or is a named Core constant; the only parseable bytes are canonical bytes
  (no malleability class). [DERIVED INVARIANT — lens-spec §2.2 AO-19 rules;
  object-taxonomy §2.2 canonicality list, VERIFIED.]
- **Full-width `bytes32 PrincipalId` entries, never truncated.** [DERIVED
  INVARIANT — system-constitution "Authorship and authority" (full-width rule);
  lens-spec §0.5 "venue ordinals rejected for v1 semantic surfaces".]

### 3.2 Byte layout

All frame integers are big-endian and fixed width. The Type has exactly one
field, `frame BYTES(maxLen=4,192)`, so the Record's MC/1 canonical body is
exactly `u16(frameLen) ‖ frame`. The frame is exactly
`PLAN_HEADER_BYTES + PLAN_ENTRY_BYTES · N` bytes; the complete canonical body
is therefore `98 + 64·N` bytes. Any other prefix or length rejects.
[PROPOSAL — layout is fresh B0 design; field inventory carries the lens-pass
evidence (object-taxonomy §2.2's 96 + 64·N RosterV1 frame) as its precedent.]

```text
ResolutionPlan/1 frame  (value of the Record's one `frame` field;
                         canonical body begins with its u16 length)

HEADER — 96 bytes = 3 × 32-byte words
word 0 (bytes 0..31):
  [0]      uint8    planVersion       = PLAN_VERSION_1 (0x01)
  [1]      uint8    combiner          ; 0x00 = EXACT
                                      ; 0x01 = PRIORITY_FIRST_PRESENT
                                      ; 0x02 = THRESHOLD
  [2]      uint8    planFlags         ; bit0 = ALL_TIERS_SINGLETON
                                      ; all other bits reserved, must be 0
  [3]      uint8    reserved0         = 0x00
  [4:6]    uint16   thresholdK        ; combiner=THRESHOLD: 1 ≤ k ≤ N
                                      ; other combiners: must be 0
  [6:8]    uint16   entryCount N      ; 1 ≤ N ≤ MAX_PLAN_ENTRIES_CORE
  [8:32]   bytes24  reserved1         = 0
word 1 (bytes 32..63):
  bytes32  purposeAndScope            ; §3.3 — consumer-checked commitment
word 2 (bytes 64..95):
  bytes32  semanticsProfileId         ; must equal SEMANTICS_PROFILE_B0 for the
                                      ; B0 resolver to execute; else UNSUPPORTED

ENTRIES — N × 64 bytes, entry i at byte offset 96 + 64·i
entry word A (offset +0):
  bytes32  principalId               ; full-width PrincipalId, never truncated
entry word B (offset +32):
  [0:2]    uint16   tier             ; PRIORITY_FIRST_PRESENT: lower = higher
                                     ;   priority (tier 1 outranks tier 2);
                                     ; EXACT / THRESHOLD: must be 0
  [2:4]    uint16   entryFlags       ; all bits reserved, must be 0 in B0
  [4:12]   uint64   minAuthFloor     ; reserved for managed Principals (§6.5);
                                     ;   must be 0 in B0
  [12:32]  bytes20  reserved2        = 0
```

Ordering rule: entries strictly ascending by `(tier, principalId)` compared as
`(uint16, uint256)`; a `principalId` appears at most once in the whole plan.
[DERIVED INVARIANT — lens-spec §2.2 "strictly ascending (tier, principal)
entries, each principal at most once".]

Tiers need not be dense (1,3,7 is legal); only the total order matters.
[PROPOSAL — dense renumbering would force whole-plan recompute on every edit for
no semantic gain; content addressing already makes any change a new plan.]

B0 carries **no advisory/deny section**. Point-deny composition is a consumer
pattern: a gate that honors deny sources pins a second plan over the deny
position and combines outcomes in its own code. [PROPOSAL — keeps the B0
resolver single-purpose; the lens-pass advisory caps (`MAX_ADVISORY_RULES`,
`MAX_DENY_SOURCES_PER_RULE`, lens-spec §2.2) re-enter with the GATE consumer
profile chapter, not here. If the red team shows a gate that cannot soundly
compose two plans, this returns as a versioned plan section.]

### 3.3 `purposeAndScope`

```text
purposeAndScope = keccak256(abi.encode(DOM_PLAN_PURPOSE, purposeTag32, scopeCommitment32))
```

Fixed 96-byte preimage under the SR-1 discipline: the `bytes32` domain word,
a `bytes32` right-padded ASCII purpose tag (e.g. `"gate/install"`,
`"config/point"`, `"display"`), and a `bytes32` scope commitment
(`0x00…00` = unscoped). [The draft's raw-ASCII-prefix form is
REJECTED — superseded by SR-1.] The resolver treats
`purposeAndScope` as opaque data; a conforming state-changing consumer MUST
compare it for equality against its expected value before acting, so a display
plan cannot be pinned into a gate. [PROPOSAL — cross-purpose reuse guard;
descends from lens-spec §0.1's purpose-scoping requirement without importing the
lens grammar.]

### 3.4 The CORE cap: why 64

[PROPOSAL] `MAX_PLAN_ENTRIES_CORE = 64` because:

1. The validated design center for real trust lists is 15–55 principals
   [HYPOTHESIS — lens-spec §9; falsified by V2-E2-successor workload evidence];
   64 covers it with margin and is the top V2-E2 benchmark size (1/8/32/64).
2. Worst-case cold resolution at N=64 is ≈ 549k gas (§9, regenerated under
   SR-8's 2-slot head), ≈ 3.3% of the EIP-7825 tx cap — a plan-bounded
   resolve stays composable inside any caller.
3. `entryCount` is uint16, so raising the cap later is a constant + benchmark
   change, not a layout change.

The value is a benchmark-gated candidate: V2-E2 measurements on the real Lane 6
head layout confirm or retune it. If measured aggregate gas at the design center
fails the budget, the tradeoff returns to James per the kickoff's measurement
gate; it is not silently narrowed.

### 3.5 Structural validation — rejection codes

`validatePlan` (and every resolve, §7) runs these checks in order; the first
failure is the code. Each code is a golden rejection vector. [PROPOSAL — code
inventory; the fail-closed posture is DERIVED (lens-spec §2.2).]

| Code | Name | Fires when |
|---|---|---|
| 1 | `BAD_TYPE` | Record exists but its TypeSchemaId ≠ `TYPE_RESOLUTION_PLAN_1` |
| 2 | `BAD_LENGTH` | body < 2 bytes; `u16(body[0:2]) != body.length-2`; frame length ≠ `96 + 64·entryCount`; or frame < 96 bytes |
| 3 | `BAD_VERSION` | `planVersion` ≠ 0x01 |
| 4 | `BAD_COMBINER` | `combiner` ∉ {0,1,2} |
| 5 | `BAD_FLAGS` | reserved bit set in `planFlags`, or any `entryFlags` ≠ 0 |
| 6 | `BAD_THRESHOLD` | THRESHOLD with k=0 or k>N; non-THRESHOLD with k≠0 |
| 7 | `BAD_ENTRY_COUNT` | N = 0 or N > `MAX_PLAN_ENTRIES_CORE` |
| 8 | `ENTRIES_NOT_ASCENDING` | any adjacent pair not strictly ascending by `(tier, principalId)` |
| 9 | `DUPLICATE_PRINCIPAL` | same `principalId` twice (implied by 8; kept as a named vector) |
| 10 | `RESERVED_NONZERO` | `reserved0`/`reserved1`/`reserved2` ≠ 0 |
| 11 | `BAD_TIER_FOR_COMBINER` | EXACT/THRESHOLD with any `tier` ≠ 0 |
| 12 | `SINGLETON_BIT_FALSE` | `ALL_TIERS_SINGLETON` set but two entries share a tier |
| 13 | `AUTH_FLOOR_UNSUPPORTED` | any `minAuthFloor` ≠ 0 under plan version 1 |

Validation is pure memory work over already-loaded bytes (one bounded loop,
~N iterations); B0 revalidates on every resolve rather than keeping a trusted
"registered plans" set, so the resolver holds zero standing state.
[PROPOSAL — correctness/simplicity first; a validation cache is a deferred perf
lever per the SDK priority order correct → easy → performant.]

---

## 4. Plan storage: admitted Records on the spine

### 4.1 B0 pin

[PROPOSAL — B0 baseline] A ResolutionPlan is an **ordinary admitted Record** on
the state-readable Record spine:

```text
planRecordId = RecordId(plan Record)
             = keccak256(abi.encode(DOM_RECORD, TYPE_RESOLUTION_PLAN_1,
                                    keccak256(canonicalBody)))
         (DOM_RECORD = keccak256("efs2/record/1"); form shown under the SR-1
          discipline — variable-length body enters pre-hashed; exact RecordId
          preimage owned by the identity/encoding chapters)
```

`PlanId` is only an ergonomic alias for this exact `planRecordId`; B0 mints no
`DOM_PLAN`, parallel plan hash, profile-specific identity, or alternate
retrieval key.

The encoding seam is closed: `ResolutionPlan/1` has one
`frame BYTES(maxLen=4,192)` field. Its canonical body is
`u16(frameLen) ‖ frame`; the two-byte big-endian prefix is part of RecordId.
The resolver checks that prefix, then parses the fixed-offset frame beginning at
canonical-body offset 2. The frame itself remains the exact §3.2 layout, so no
contract parses a general-purpose codec, CBOR, or an author-supplied offset. The
maximum canonical body is 4,194 bytes. This makes plans ordinary first-class
Records without an opaque-body exception or a parallel plan encoding.

The resolver reads plan bytes with the spine's body read (Lane 5/6 ABI,
assumed):

```solidity
function recordBody(bytes32 recordId) external view returns (bytes memory);
// state-readable, full body, never elided — [OWNER RULING] items 17/18
```

### 4.2 Why this beats the CREATE2/EXTCODECOPY store for B0

The lens pass's plan store was: deploy plan bytes as immutable code at a
CREATE2 address derived from `planRecordId`; consumers derive the address and
`EXTCODECOPY`; "address derivation is the verification."
[HYPOTHESIS — lens-spec §2.3, explicitly marked "(PLAUSIBLE — V-2 fixture is
the gate)"; the source itself never fixture-verified it.]

The requirement behind it is only: **the plan store must not be a trusted
party** [DERIVED INVARIANT — lens-spec §2.3's stated purpose; CARRY-IN restates
it verbatim]. The B0 spine satisfies it without new machinery:

1. **Content addressing does the same verification.** `PlanId` is the plan
   `RecordId`, a content hash; any reader (contract via `recordBody` + rehash if
   it distrusts the Core, or any second implementation reconstructing from
   state) can verify bytes against the id. Inside the atomic Core (axis 6), the resolver and the
   spine are one contract and one trust domain — there is no separate "store
   party" to distrust, which was the CREATE2 trick's entire job in a
   multi-contract world.
2. **Reconstruction and honesty come free.** A plan Record is admitted evidence:
   it is enumerable by Type, carried by ordinary Envelopes, replicated by the
   same reconstruction pass as everything else, and portable — the same
   content-derived plan RecordId denotes the same plan in every Realm. A
   CREATE2 store is a second, per-Realm storage system outside the admitted
   graph that the reconstruction trace would have to special-case.
3. **No second write path.** CREATE2 needs a deployment entrypoint, initcode
   discipline, and an EVM-evolution exposure (EOF, initcode/`EXTCODECOPY`
   repricing — the CARRY-IN names this invalidation surface). Plans-as-Records
   ride the one admission path that is already the system's security boundary.
4. **The gas argument favors CREATE2 only as a perf lever.** Loading the maximal
   4,194-byte canonical body from storage words costs ≈132 cold SLOADs
   ≈277k gas; `EXTCODECOPY` of the same bytes is ≈2,600 + 3·132 + memory
   ≈3.0k. That ~90× delta on the
   plan-load component (≈ 50% of worst-case resolve, §9) is real — but it is a
   physical-storage question, and physical storage layout is replaceable until
   frozen [DERIVED INVARIANT — system-constitution "On-chain graph and
   indexes"]. If Lane 5/6 adopts SSTORE2-shaped body storage *inside the
   spine*, the entire benefit arrives for every Record with no lens-specific
   store. Deferred per correct → easy → performant.

**Bakeoff arm (kept, gated):** `PLAN-STORE-B` = CREATE2/EXTCODECOPY store.
Sketched interface only:

```solidity
// PLAN-STORE-B (bakeoff arm; fixture gate = the V-2 successor fixture:
// deploy → derive address → EXTCODECOPY → byte-equality → resolve-equivalence
// against PLAN-STORE-A on identical fixtures, plus a poisoned-store negative)
function deployPlan(bytes calldata planBytes)
    external returns (address at, bytes32 planRecordId);
function planAddress(bytes32 planRecordId)
    external view returns (address); // pure CREATE2 derivation from RecordId
```

Adopt B over A only if (i) the V2-E2 gas matrix shows the plan-load component
breaking a consumer budget the spine's own storage evolution cannot fix, and
(ii) the fixture discharges V-2. [PROPOSAL — decision rule.]

---

## 5. Keys and the consumed Binding read ABI

### 5.1 BindingKey derivation

```text
BindingKey = keccak256( abi.encode(DOM_BINDING, principalId, positionKey) )
DOM_BINDING = keccak256("efs2/binding/1")
```

Fixed 96-byte preimage (three bytes32 words); keccak cost 30 + 6·3 = 48 gas.
[PROPOSAL — the SR-6 pinned formula, identical in Lane 6; the cross-lane
reconciliation flag is discharged. The draft's raw-ASCII
`"efs2/binding-key/1"` prefix form is REJECTED — superseded by SR-1/SR-6.]
`PositionKey = keccak256(abi.encode(DOM_POSITION, purpose, subject,
fieldRole))` derivation is owned by Lane 6 (SR-6); this chapter treats
`positionKey` as an opaque `bytes32` input.

### 5.2 Head-read ABI (pinned by SR-8; Lane 6 layout)

```solidity
enum HeadState { UNSET, BOUND, TOMBSTONED }   // 0, 1, 2 — Lane 6 / SR-8 names.

struct BindingHead {                 // decoded SR-8 2-slot head
    uint8   state;                   // HeadState
    uint8   targetKind;              // 0 NONE / 1 RECORD / 2 OCCURRENCE
    uint8   tombstoneCause;          // 0 NONE / 1 EXPLICIT / 2 WITHDRAWAL
    uint32  revision;                // CAS revision counter (u32, guarded)
    uint64  admissionOrdinal;        // currentOrdinal, uint64 at ABI (SR-4)
    bytes32 targetA;                 // targetRef; meaningful only when BOUND
    uint16  targetLeaf;
}

function getBindingHead(bytes32 bindingKey) external view returns (
    BindingHead memory head, bytes32 realmBasis, uint64 highWaterOrdinal);
function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
    external view returns (
        BindingHead memory head, bytes32 realmBasis, uint64 highWaterOrdinal);
```

Storage cost model (drives §9) [PROPOSAL — pinned by SR-8, no longer an
assumption]: **2 slots per head**, slot 0 zero for `UNSET` keys — an absent
probe costs 1 cold SLOAD; a bound/tombstoned probe costs 2 (meta +
`targetA`). `realmBasis` and `highWaterOrdinal` are query metadata returned
separately; neither is a head field or substitutes for one. There is **no
SR-7 authority word in either head slot** — the exact
`AuthorityBasisWord` plus conditional `authorityCodehash` live on the
occurrence's accepting AdmissionBatch and are hydrated through its receipt,
reachable by following `admissionOrdinal` through the reversible admission
log and bounded batch-boundary lookup (SR-8). This cannot be inferred from
EnvelopeMeta: staged admissions of the same Envelope are reverified and may
record different basis blocks, delegates, revisions, or codehashes.

[REJECTED — superseded sub-variant, kept for the record]: the draft assumed a
3-word head carrying `authorityBasis` (1 cold SLOAD absent / 3 present).
SR-8 removed the basis word from the head; the §9 gas rows regenerate.

Semantics consumed:

```solidity
struct ResolvedTarget {
    uint8   targetKind; // 0 NONE, 1 RECORD, 2 OCCURRENCE
    bytes32 targetA;    // RecordId or EnvelopeId
    uint16  targetLeaf; // MUST be 0 for RECORD/NONE; leaf index for OCCURRENCE
}
```

`ResolvedTarget` is the only value compared or returned by the resolver. A
BOUND head normalizes byte-for-byte to this struct. `RECORD` requires
`targetLeaf == 0`; `OCCURRENCE` preserves the full `(EnvelopeId,leafIndex)`.
Two Occurrence targets with the same EnvelopeId and different leaf indexes are
different values. No bytes32-only projection may alias them.

- `BOUND` ("present") head ⇒ the value was admitted under CAS from an authored
  Occurrence whose Principal matches `bindingKey`'s derivation, with authority
  validated at admission by the SR-13 verifier chain and recorded on that
  occurrence's accepting AdmissionBatch; its receipt hydrates the exact SR-7
  `AuthorityBasisWord` and conditional `authorityCodehash` (zero unless
  `CONTRACT_ERC1271`) [DERIVED INVARIANT — admission-time
  validation, kel.md §8.2 via CARRY-IN; core-architecture-candidate "Binding and
  withdrawal": "Admission derives principalId from the authored Occurrence, so a
  writer cannot bind another Principal's key"].
- `TOMBSTONED` contributes "no present claim" to every combiner, exactly like
  `UNSET`; the distinction is provenance/history, not resolution input
  (`tombstoneCause` is head-readable for provenance display — the graded
  NONE_EXPLICIT / NONE_WITHDRAWN outcomes cost no extra SLOAD, SR-8).
  No-resurrection is Lane 6's state machine. [PROPOSAL — resolution-side rule.]
- On-chain, the executing state **is** the complete Realm-local point map:
  `UNSET`/`TOMBSTONED` at the current basis is **proven absence** — absence
  source 1 (authoritative state at positive closure) of the four-source
  discipline, not a new fifth source. [DERIVED INVARIANT — the CARRY-IN's
  reconciliation demand; joined-pass JR-5 four sources; lens-pass corpus
  core-onchain P-CORE-3.]

---

## 6. Combiner semantics

The B0 combiner set is **closed**: `EXACT`, `PRIORITY_FIRST_PRESENT`,
`THRESHOLD(k)`. Unknown tags reject at validation (`BAD_COMBINER`), never at
execution. [DERIVED INVARIANT — closed contract-tier vocabulary; lens-pass
corpus core-onchain P-CORE-7.] **[REJECTED — repaired]:** bytes32-only
`targetRef` equality aliases two
Occurrence targets in the same Envelope. Value equality is exact structural
equality of all three `ResolvedTarget` fields
`(targetKind,targetA,targetLeaf)`; RECORD values additionally require
`targetLeaf=0`. Every combiner is deterministic over (plan bytes, head states at
the basis) — never over gas price, warmth, or call path. [DERIVED INVARIANT —
identical-semantics rule, core-onchain §4.2 carried.]

Enum numeric order for the outcome (deliberate): `0 = UNKNOWN` so a
zero-initialized result reads fail-closed, never FOUND. [PROPOSAL]

```solidity
enum Presence { UNKNOWN, FOUND, ABSENT, CONFLICT, UNSUPPORTED } // 0..4
```

Vocabulary boundary [PROPOSAL — SR-18(b) cross-check]: `Presence` is the
**resolve-outcome** enum and is distinct from the shared **page-status**
`Completeness` enum SR-18(b) pins for every paged external ABI
(`UNKNOWN = 0, COMPLETE = 1, PARTIAL = 2, UNSUPPORTED = 3`). B0 point
resolution returns no pages, so the two vocabularies never mix on this
chapter's ABI; they deliberately share the one discipline that matters:
**0 = UNKNOWN, so zero-initialized results fail closed in both**. Any future
paged lens surface (client-tier enumeration) uses the SR-18(b) enum, not
`Presence`.

### 6.1 EXACT — unanimity

All N entries are required sources; tiers are structurally 0.

- Let `P` = entries whose head is `BOUND`.
- **T1** if ≥ 2 distinct values appear among `P` → `CONFLICT`.
- **T2** else if `|P| < N` → `ABSENT` (proved: every missing head is proven
  absent at the basis).
- **T3** else → `FOUND(v)`, the common value; winner = lowest-index entry.

Conflict outranks absence deliberately: partial disagreement is the more
dangerous state and must not be masked by one signer's silence. [PROPOSAL]
At N=1, EXACT is the plain point read.

### 6.2 PRIORITY_FIRST_PRESENT — tiered fallback

Entries are grouped by ascending `tier` (lower number = higher priority; the
worked constitution example "SecurityCouncil tier 1 outranks Alice tier 2"
carries). Walk tiers in ascending order; for tier `t` with entry set `E_t`:

- **T4** probe every entry in `E_t`. If no `BOUND` head → next tier.
- **T5** if ≥ 1 `BOUND` head and all present values equal → `FOUND(v)`,
  `winnerTier = t`, winner = lowest-index present entry. STOP (lower-priority
  tiers are never probed).
- **T6** if present values disagree within `t` → `CONFLICT`. STOP.
- **T7** all tiers exhausted with no present head → `ABSENT` (proved).

**Verify-above-the-winner is satisfied by construction**: the ascending walk
probes every entry ranked strictly above the winner before the winner can be
selected; no roster, hint, or auxiliary index is consulted, so none can be a
correctness dependency. [DERIVED INVARIANT — LR-3, lens-spec §3.2; the B0 walk
is the degenerate "hint-free" instantiation. Any future claimant-roster
fast path is a perf [HYPOTHESIS] that must preserve these exact semantics and
rides the V2-E2 successor benchmark.]

Equal-tier conflict detection: the full within-tier scan runs even after the
first present head; early exit at first-present is legal only when
`ALL_TIERS_SINGLETON` is set (then each tier has one entry and the scan is the
probe). [DERIVED INVARIANT — lens-spec §3.2 "early exit is legal only when the
plan's allTiersSingleton bit is set".]

**Anti-fallthrough**: a tier is passed over only on *proved absence* of every
entry in it. A head that is `BOUND` but ungradeable (§6.5) stops resolution
with `UNKNOWN`; it never yields to a lower tier — first-trusted-wins is
anti-monotone under missing data. [DERIVED INVARIANT — lens-read-gotchas "Never
fall through on UNKNOWN"; joined-pass JR-1.]

### 6.3 THRESHOLD(k) — closed committee count

All N entries are approvers; tiers are structurally 0; `1 ≤ k ≤ N` committed in
the plan. Probe all N (no early exit in B0 — required to detect two-value
conflicts and keep the walk deterministic):

- Group `BOUND` heads by value; let `m(v)` = count per value.
- **T8** if exactly one value has `m(v) ≥ k` → `FOUND(v)`; winner = lowest-index
  entry carrying `v`.
- **T9** if two or more distinct values reach `k` (possible only when
  `k ≤ N/2`) → `CONFLICT`.
- **T10** if no value reaches `k` → `ABSENT` (proved: "no value attains k
  approvals at this basis" is a positive fact of authoritative state). The
  result's `presentCount`/`agreeCount` fields (§7.2) expose sub-threshold
  disagreement so a consumer can distinguish "silent" from "split".

THRESHOLD counts only over the plan's **closed** entry list. Open-set counting
is not a combiner: a gate that wants "k of an evolving population" reads the
Realm's revocation-aware count index over a closed roster and applies its own
threshold in consumer code. [DERIVED INVARIANT — lens-spec §3.4 "Counting is
not a combiner"; owner-rulings 2026-07-15 item E (revocation-aware counts).]

### 6.4 Claim-conditional authority

Authority status is evaluated **only** for principals holding a `BOUND` claim
at the position, and only for entries at tiers at-or-above the selected winner
(for EXACT/THRESHOLD: all entries, since all are consulted). Absent principals
are never graded, so an attacker parking an ungradeable principal in a plan
cannot wedge positions that principal never claimed. [DERIVED INVARIANT — LR-2,
lens-spec §3.1; imported per CARRY-IN under exactly this label.]

### 6.5 Where the authority check attaches (B0 vs managed Principals)

In B0, account-Principal authority is **intrinsically present**: admission-time
validation already proved control (SR-13 verifier chain), and the head's
existence is the proof — the resolver's authority step is a constant
`AUTH_OK`, **reads nothing**, and costs nothing (the head carries no basis
word, SR-8). [DERIVED INVARIANT — admission-time validation ruling, kel.md
§8.2 via CARRY-IN finding (a); this is the "dissolved, not falsified" path
the CARRY-IN predicted: the LR-2 check migrates into the admission receipt
design.]

The seam for managed Principals is already in the layout and the walk:

- layout: per-entry `minAuthFloor` (uint64) — the minimum authority
  epoch/grade the plan demands of that entry (`0` = intrinsic, the only legal
  B0 value; enforcement code `AUTH_FLOOR_UNSUPPORTED` keeps the seam honest).
- walk: step (5) of §7.1 — `gradeAuthority(entry, head)` runs for `BOUND`
  heads only. Under managed Principals it **follows `head.admissionOrdinal`
  through the reversible admission log and accepting-batch lookup** to the
  receipt's exact SR-7 `AuthorityBasisWord` plus conditional
  `authorityCodehash`, and compares them against `entry.minAuthFloor` under
  the then-current authority module — the SR-8 attachment path; the extra log
  + batch/receipt SLOADs are paid only by managed-tier plans, never by B0.
  Per-batch hydration is mandatory: staged admissions of one Envelope may
  have distinct verifier bases/codehashes, so EnvelopeMeta is never a
  substitute. A `BOUND`
  head that cannot be graded at the required floor yields
  `UNKNOWN(REASON_AUTHORITY_UNGRADEABLE)` and blocks (never falls through).
  Prospective revocation means floors, not emptied slots: removal affects
  later admissions only, so consumers gate with floors. [DERIVED INVARIANT —
  minAuthEpoch/prospective-revocation pair, kel.md §7.3 + lens-pass AO-16 via
  CARRY-IN; attachment path per SR-8.]

The exhaustive enumeration of on-chain `UNKNOWN` causes under managed
Principals is a carried verification debt, not settled. [HYPOTHESIS — lens-spec
§3.1's V-3; falsifier: a fixture producing an ungradeable-BOUND state outside
the enumerated reason codes.]

---

## 7. The resolution algorithm

### 7.1 Deterministic pseudocode

`basis` is explicit in the algorithm; the on-chain instantiation fixes
`basis := current executing state` (a contract cannot read at an arbitrary past
basis), and the SDK instantiation passes a pinned basis and must satisfy §7.3.
All probes in one resolve read one frozen basis — on-chain automatically (one
EVM state), off-chain by rule (never interleave probes across bases; the
one-basis phantom/ghost lesson). [DERIVED INVARIANT — FSP-BASIS-1,
lens-read-gotchas "One-basis rule".]

```text
resolve(planRecordId, positionKey, basis) → ResolveResult
  # (1) LOAD
  body ← recordBody@basis(planRecordId)  # MC/1: u16 frameLen ‖ frame
  if body unavailable:
      on-chain  → revert PlanUnavailable(planRecordId)    # authoritative: config error
      off-chain → return UNKNOWN(REASON_PLAN_UNAVAILABLE) # never ABSENT
  # (2) VALIDATE  (pure memory; §3.5 order; first failure wins)
  code ← validateStructure(body)
  if code ≠ 0:
      on-chain  → revert PlanMalformed(planRecordId, code) # fail-closed
      off-chain → return UNKNOWN(REASON_PLAN_MALFORMED, code)
  frame ← body[2 : 2 + u16be(body[0:2])]  # fixed only after BAD_LENGTH passes
  if frame.semanticsProfileId ≠ SEMANTICS_PROFILE_B0:
      return UNSUPPORTED(REASON_UNRECOGNIZED_SEMANTICS_PROFILE)
  # (3) PROBE ORDER — fixed by combiner (§6): EXACT/THRESHOLD = all entries in
  #     stored order; PRIORITY = ascending tier groups in stored order
  heads ← []
  for entry in consultedEntries(frame, combiner):
      bk ← keccak256(abi.encode(
        DOM_BINDING, entry.principalId, positionKey
      ))
      # DOM_BINDING = keccak256("efs2/binding/1") (SR-6)
      (h, headRealmBasis, headHighWater) ← getBindingHead@basis(bk)
      if h unavailable (off-chain partial replica):
          return UNKNOWN(REASON_COVERAGE_PARTIAL)          # never ABSENT
      requireSameBasis(headRealmBasis, headHighWater, basis)
      # (4) CLAIM-CONDITIONAL AUTHORITY — BOUND heads only (§6.4)
      if h.state == BOUND:
          # (5) AUTHORITY GRADE — B0: intrinsic AUTH_OK (§6.5)
          g ← gradeAuthority(entry, h)
          if g == AUTH_UNKNOWN:
              return UNKNOWN(REASON_AUTHORITY_UNGRADEABLE) # blocks; no fallthrough
      heads.append((entry, h))
      # PRIORITY only: tier-boundary decision per §6.2 T4–T6; STOP on decide
  # (6) COMBINE — compare every ResolvedTarget field; two leaves in one
  #     Envelope are distinct. Apply §6.1/§6.2/§6.3 transitions T1–T10.
  (presence, target, winner) ← combine(combiner, thresholdK, heads)
  # (7) REPORT — two axes, never collapsed (§7.2)
  return ResolveResult{presence, target, winner,
                       winnerAdmissionOrdinal,
                       presentCount, agreeCount,
                       basisReport(basis)}
```

Budget note: an on-chain resolve that exceeds gas **reverts atomically** — there
is no partial answer to mislabel as absence; the EVM enforces the
"budget exhaustion never grounds absence" rail for free, and liveness is
delivered by construction (plans are bounded by `MAX_PLAN_ENTRIES_CORE`).
[DERIVED INVARIANT — core-onchain §3 (VERIFIED as EVM semantics) + the absence
discipline, CARRY-IN.]

### 7.2 Result and outcome model

```solidity
uint8 constant REASON_NONE                            = 0;
uint8 constant REASON_UNRECOGNIZED_SEMANTICS_PROFILE  = 1; // UNSUPPORTED
uint8 constant REASON_UNSUPPORTED_CAPABILITY          = 2; // UNSUPPORTED (SDK: future plan versions/PATH)
uint8 constant REASON_AUTHORITY_UNGRADEABLE           = 3; // UNKNOWN (reserved in B0; managed Principals)
uint8 constant REASON_BASIS_UNAVAILABLE               = 4; // UNKNOWN (off-chain only)
uint8 constant REASON_PLAN_UNAVAILABLE                = 5; // UNKNOWN (off-chain only; on-chain reverts)
uint8 constant REASON_COVERAGE_PARTIAL                = 6; // UNKNOWN (off-chain partial replica)
uint8 constant REASON_PLAN_MALFORMED                  = 7; // UNKNOWN (off-chain only; on-chain reverts)

struct BasisReport {
    bytes32 realmRevisionId;  // RealmRevisionId in force at the read (V2-E5 seam)
    uint64  blockNumber;      // read basis
    uint64  admissionHigh;    // admission-ordinal high-water mark at the basis
    uint8   basisKind;        // 0 = AUTHORITATIVE_LOCAL (the only on-chain value);
                              // 1 = REPLICA_AT_BASIS; 2 = IMPORTED_EVIDENCE (SDK)
}

struct ResolveResult {
    Presence presence;               // UNKNOWN|FOUND|ABSENT|CONFLICT|UNSUPPORTED
    uint8    reasonCode;             // ≠ 0 only for UNKNOWN/UNSUPPORTED
    ResolvedTarget target;           // exact target when FOUND; all zero otherwise
    uint16   winnerIndex;            // plan entry index; WINNER_NONE when no winner
    uint16   winnerTier;             // 0 for EXACT/THRESHOLD
    uint64   winnerAdmissionOrdinal; // 0 when no winner
    uint16   presentCount;           // consulted entries with BOUND heads
    uint16   agreeCount;             // heads agreeing with `target` (0 when no winner)
    BasisReport basis;
}
```

B0 returns no per-winner authority word: account-Principal grading is the
constant `AUTH_OK` and performs no receipt read. A caller needing the exact
SR-7 `AuthorityBasisWord` and conditional `authorityCodehash` (zero unless
`CONTRACT_ERC1271`) hydrates
`getReceipt(winnerAdmissionOrdinal)` separately; that lookup returns the
winning occurrence's accepting AdmissionBatch fields, not envelope first-touch
metadata, and therefore remains correct across staged admissions. A future managed-Principal
profile may mint a versioned `ResolveResult` extension that follows that
ordinal during resolution; it does not enlarge this B0 result or head.

**When each presence value fires** (exact, closed):

| Presence | Fires when |
|---|---|
| `FOUND` | T3 / T5 / T8 — a value is selected under the combiner at the basis |
| `ABSENT` | T2 / T7 / T10 — proved under absence source 1 (authoritative state at positive closure, §5.2); off-chain, only when the source holds one of the four absence proofs; otherwise UNKNOWN |
| `CONFLICT` | T1 / T6 / T9 — disagreement the combiner cannot lawfully collapse |
| `UNSUPPORTED` | recognized plan whose semantics this resolver cannot honestly execute (`semanticsProfileId` mismatch; SDK: future capability/PATH request) |
| `UNKNOWN` | a consulted BOUND head ungradeable at the required floor (reserved in B0); off-chain: basis/plan/coverage unavailable — enumerated by `reasonCode` |

**The never-collapse rule** [DERIVED INVARIANT — the two-axis result honesty,
assumptions-and-requirements §10 ("Never compress these to a Boolean valid";
slot state, freshness, completeness orthogonal) + joined-pass JR-1 tuple]:

- The **presence axis** (`Presence`) and the **authorization/freshness basis
  axis** (`BasisReport` plus the receipt identified by
  `winnerAdmissionOrdinal`) are orthogonal and both remain available.
  `FOUND` never implies "current everywhere" — it is FOUND *at this
  Realm, at this basis, under this plan*; a consumer needing freshness compares
  `basis.blockNumber`/`admissionHigh` age against its own policy (the survivor
  §10 grades `AUTHORITY-ADMITTED` / `SNAPSHOT@H` / `CURRENT@H` are the SDK's
  vocabulary over this same field pair).
- `CONFLICT` never degrades to `ABSENT` or to either conflicting value.
- `UNKNOWN` never degrades to `ABSENT` ("UNKNOWN is never absence") and never
  falls through to a lower-priority source.
- Consumers declare acceptable outcomes explicitly (§7.4) and otherwise fail
  closed.

**DI-13 client conformance [DERIVED INVARIANT].** Client and SDK renderers
apply two additional non-contract rules to this result:

1. A `CONFLICT` row renders **no claimant-derived content**. It may identify
   the conflicting principals/values as warning metadata, but it never chooses
   one claimant's bytes, label, icon, or link for the result row; doing so
   recreates the grindable phishing tie-break that AV-21/AO-8 rejected.
2. The complete read answer is the six-axis tuple **authorization, existence,
   freshness/basis, availability, slot state, completeness**. No SDK helper,
   packet, product copy, or UI collapses that tuple to a success checkmark.
   Negative and unresolved axes remain visible even when another axis is
   positive.

The SDK result-model fixture must include both a CONFLICT row with hostile
claimant presentation fields and a mixed six-axis result; it fails if any
claimant-derived content is selected or either result renders as a checkmark.

### 7.3 Honest behavior when the source basis is unavailable

Per the PM execution defaults (no dead-chain survival machinery): the B0
resolver assumes a **qualifying Realm** — the executing chain serves its own
authoritative state; `basisKind = AUTHORITATIVE_LOCAL` is the only on-chain
value. Off-chain consumers resolving against replicas/imports MUST return
`UNKNOWN(REASON_BASIS_UNAVAILABLE | REASON_COVERAGE_PARTIAL)` when the pinned
basis or full head coverage is unavailable — never `ABSENT`, and never a silent
re-resolve against a different Realm or later basis. [PROPOSAL — instantiates
the PM default; the absence discipline makes the shape forced.]

### 7.4 ABI surface

```solidity
// LensResolve — internal library on the atomic Core (axis 6);
// external view wrappers on the Core contract:

error PlanUnavailable(bytes32 planRecordId);
error PlanMalformed(bytes32 planRecordId, uint8 rejectCode);
error ResolveNotAccepted(uint8 presence, uint8 reasonCode);

/// Neutral, stateless point resolution. Anyone may call with any plan —
/// personalization of DISPLAY is free and harmless (view-only).
function resolve(bytes32 planRecordId, bytes32 positionKey)
    external view returns (ResolveResult memory r);

/// Fail-closed wrapper for state-changing consumers: reverts unless
/// bit(uint8(r.presence)) is set in acceptMask. Gates SHOULD pass
/// acceptMask = (1 << uint8(Presence.FOUND)) only; including UNKNOWN or
/// CONFLICT bits in a gate's mask is non-conformant.
function resolveStrict(bytes32 planRecordId, bytes32 positionKey, uint8 acceptMask)
    external view returns (ResolvedTarget memory target, ResolveResult memory r);

/// Structural validation only (no probes). ok=false ⇒ rejectCode per §3.5.
function validatePlan(bytes32 planRecordId)
    external view returns (bool ok, uint8 rejectCode);

/// Pure helper; must byte-match the Lane 6 formula.
function deriveBindingKey(bytes32 principalId, bytes32 positionKey)
    external pure returns (bytes32);
```

The `acceptMask` is the B0 skeleton of the AcceptanceMatrix idea
[PROPOSAL — carried from lens-spec §3.3's `AcceptanceMatrixV1` as a proposal,
reduced to one presence bitmask; the full matrix (per-axis acceptance) is a
consumer-profile concern, not Core].

---

## 8. Risk-bearer enforcement at the ABI

**The rule**: a caller may supply any plan to *personalize display*; any
consumer whose **state changes** based on the result must pin or approve its
plan; a caller can never supply the trust policy that authorizes that caller.
[DERIVED INVARIANT — system-constitution "Lenses for contracts and people"
("The party bearing risk selects or approves the Lens. A caller cannot choose
the trust list that authorizes that caller."); lens-spec §0.4.]

The ABI split realizes it:

- `resolve` / `resolveStrict` are **views** — neutral machinery, safe for any
  caller-supplied `planRecordId` because a view authorizes nothing.
- Authorization happens only inside a consumer contract, and a conforming
  consumer's state-changing paths read the plan RecordId **exclusively from its own
  storage**, written by its own admin authority:

```solidity
contract ExampleGate {
    bytes32 public approvedPlanRecordId;   // pinned ResolutionPlan RecordId
    bytes32 public constant EXPECTED_PURPOSE_AND_SCOPE = /* §3.3 value */ 0x0;

    function setApprovedPlan(bytes32 planRecordId) external onlyGateAdmin {
        (bool ok, uint8 code) = core.validatePlan(planRecordId);
        require(ok, "malformed");
        // conformance: check the plan's purposeAndScope against expectation
        approvedPlanRecordId = planRecordId;
    }

    function act(bytes32 positionKey /* no planRecordId parameter */)
        external
    {
        (ResolvedTarget memory target, ) = core.resolveStrict(
            approvedPlanRecordId, positionKey,
            uint8(1) << uint8(Presence.FOUND));
        // Example policy: require the exact target class expected by this gate.
        require(target.targetKind == 1 && target.targetLeaf == 0, "not record");
        // ... state change gated on target.targetA ...
    }
}
```

**Negative test (named fixture `LENS-NEG-1`, the beneficiary-self-authorization
test)**: gate G pins plan P1 (not containing principal M). Attacker M crafts
plan P2 whose roster is `[M]` (or M at tier 0 above all others), binds the
position under M's key, and attempts (a) calling `G.act` hoping P2 is consulted
— must be impossible because `act` takes no plan parameter; (b) calling
`G.setApprovedPlan(P2)` from M — must revert on `onlyGateAdmin`; (c) invoking
`core.resolve(P2, pos)` directly — succeeds as a view and returns FOUND, which
is the *correct* outcome, and the fixture asserts no G state changed. The
conformance claim under test is structural: no state-changing code path in a
conforming consumer reads a caller-supplied plan id. [PROPOSAL — fixture
definition; the rule it tests is the derived invariant above.]

---

## 9. Gas budget arithmetic — 1 / 8 / 32 / 64

Standards FACTS used (not EFS policy): cold SLOAD 2,100 / warm 100, cold
account access 2,600 (EIP-2929); keccak 30 + 6 per word; EIP-7825 caps any
transaction at **16,777,216 gas (= 2²⁴), live on L1 since Fusaka 2025-12-03**.
EFS POLICY [PROPOSAL, per CARRY-IN]: treat 2²⁴ as the portable per-tx floor for
a qualifying Realm and re-verify the cap against the adopted Realm gas profile
(an L2/L3 may not enforce 7825; V2-E5's Realm descriptor should carry the
venue's cap).

Model (consumed SR-8 layout, §5.2): plan load from spine storage words =
`ceil((2 + 96 + 64N)/32) = (4 + 2N)` cold SLOADs; every present-head probe = 2 cold SLOADs; `N`
BindingKey keccaks cost 48 gas each; fixed overhead (dispatch, memory,
loop, basis report) budgeted 2,000. Worst case is a full walk with every head
present (EXACT and THRESHOLD always probe all N; PRIORITY's worst case is a
last-tier winner or all-absent).

```text
gasWorst(N) ≈ (4 + 2N)·2100  +  N·2·2100  +  N·48  +  2000
```

| N | Plan load (cold) | Probes (cold, all present) | keccak | Total cold ≈ | % of 2²⁴ cap | Total warm ≈ |
|---|---|---|---|---|---|---|
| 1  | 6 w = 12,600   | 2 SLOAD = 4,200     | 48    | **18.8 k**  | 0.11 % | 2.8 k |
| 8  | 20 w = 42,000  | 16 SLOAD = 33,600   | 384   | **78.0 k**  | 0.46 % | 6.0 k |
| 32 | 68 w = 142,800 | 64 SLOAD = 134,400  | 1,536 | **280.7 k** | 1.67 % | 16.7 k |
| 64 | 132 w = 277,200| 128 SLOAD = 268,800 | 3,072 | **551.1 k** | 3.28 % | 31.1 k |

(warm = same-transaction repeat: (planWords + probeSLOADs)·100 + keccaks +
overhead; EIP-2929 makes a batched action gating several operations through one
plan pay the cold cost once.)

All-absent worst case (every probe 1 SLOAD): N=64 →
277,200 + 64·2,100 + 3,072 + 2,000 ≈ **416.7 k** (2.48 % of cap).

Headroom statement: at the CORE cap, one worst-case cold resolve consumes
≈ 3.28 % of the EIP-7825 transaction budget, leaving ≈ 96.72 %
(≈ 16.23 M gas) for the consumer's own logic; five worst-case resolves in
one gated batch cost ≈ 2.755 M, or ≈ 16.42 % of the cap. A naive wide sorted directory page
(128 items × 55 principals ≈ 29.5 M) exceeds the cap and is not promised at any
size the naive path implies — point resolution and bounded candidate pages are
the whole on-chain enumeration promise. [DERIVED INVARIANT — venue-conditional
physics; lens-pass-synthesis LN-4 (VERIFIED); lens-spec §1 [LP-2].]

All rows are schedule arithmetic (VERIFIED as arithmetic), not measurements:
the real-kernel numbers are V2-E2's to produce at exactly these four sizes on
the real Lane 6 head layout. [HYPOTHESIS — falsified/retuned by the V2-E2
matrix; the lens pass's own critic found lane floors ~3× understated on the old
kernel, so treat every row as a floor.] The SSTORE2-shaped body-storage lever
(§4.2, item 4) would cut the N=64 worst case by ≈ 272 k (to ≈ 277 k); it is a
Lane 5/6 physical-layout option, deferred.

**Separate client-tier scale requirement.** The contract benchmark grid stays
exactly `N = {1, 8, 32, 64}` and Core rejects plans above 64. Stage B also
benchmarks the TypeScript and Rust SDK/client resolvers at
`N = {50, 100, 256}` on pinned mobile and desktop profiles, reporting wall
time, peak memory, RPC/page count, result equality, and honest
UNKNOWN/PARTIAL propagation. The 100/256 cases are client-tier composition
requirements, never on-chain plans or hidden Core scans.

---

## 10. Deferred: the bounded-depth PATH profile

Deferred [PROPOSAL], reserved with an interface stub only. The constitution
already scopes it: "Core must support a bounded, deterministic contract Lens
profile for point resolution … A **separately benchmarked** bounded-depth path
profile may build on it" [system-constitution, "Lenses for contracts and
people", line ~193–196 — cited as the deferral authority].

```solidity
// PATH/1 — sketched interface; NOT part of B0; separately benchmarked.
// Each step i resolves positionKey_i = derivePosition(value_{i-1}, stepRoles[i])
// under the same plan; any non-FOUND intermediate outcome propagates unchanged
// (anti-fallthrough applies per step). MAX_PATH_DEPTH_CORE bounds depth.
function resolvePath(
    bytes32 planRecordId,
    bytes32 rootPositionKey,
    bytes32[] calldata stepRoles,   // length ≤ MAX_PATH_DEPTH_CORE (TBD; candidate ≤ 4)
    uint8   acceptMaskPerStep
) external view returns (ResolveResult memory finalR, uint8 depthReached);
```

Cost envelope for the benchmark to confirm: ≤ depth × gasWorst(N); at depth 4,
N=64 cold ≈ 2.73 M (16.3 % of the 2²⁴ cap) — feasible but exactly why it is
*separately* benchmarked rather than assumed. `MAX_PATH_DEPTH_CORE` is TBD;
the PATH benchmark (a V2-E2 extension fixture) decides it. Until then, an SDK
receiving a PATH request against Core returns
`UNSUPPORTED(REASON_UNSUPPORTED_CAPABILITY)`.

---

## 11. The challenge-window consumer pattern (untrusted authors)

**Standing authority** [OWNER RULING — [[owner-rulings]] 2026-07-15, item F,
lines 51–53]: the chain keeps the LWW winner, not the conflict; there is **no**
on-chain collision/duplicity bit — it is TOCTOU-defeated (the attacker controls
timing; the bit stops only clumsy simultaneous equivocation) [REJECTED — same
ruling; do not reintroduce kernel duplicity state without a new ruling].
Ratified wording: "on-chain gates use closed, trusted author sets; EFS does not
guarantee contracts can detect equivocation, and contracts needing certainty
against untrusted authors must use a challenge-window (delay + re-check)
pattern."

Per the PM directive, the lesson and the safety requirement are preserved while
**exact collision-state mechanics stay unfrozen**. B0 therefore documents the
pattern as consumer-side code against the §7.4 ABI, freezing no Core state:

```solidity
// Consumer-side pattern — no Core support required beyond resolve().
struct PendingDecision {
    bytes32 positionKey;
    ResolvedTarget target;            // exact resolved target at commit
    uint16  winnerIndex;              // decision-scoped identity of the winner
    uint64  winnerAdmissionOrdinal;   // exact winning occurrence at commit
    uint64  admissionHigh;            // basis high-water at commit
    uint64  readyAt;                  // block.timestamp + WINDOW (consumer constant)
}

// commit step:
//   r = core.resolve(approvedPlanRecordId, pos); require(r.presence == FOUND);
//   store PendingDecision{pos, r.target, r.winnerIndex, r.winnerAdmissionOrdinal,
//                         r.basis.admissionHigh, now + WINDOW}
// finalize step (only after readyAt):
//   r2 = core.resolve(approvedPlanRecordId, pos);
//   ok = r2.presence == FOUND
//     && r2.target.targetKind == pd.target.targetKind
//     && r2.target.targetA == pd.target.targetA
//     && r2.target.targetLeaf == pd.target.targetLeaf
//     && r2.winnerIndex == pd.winnerIndex
//     && r2.winnerAdmissionOrdinal == pd.winnerAdmissionOrdinal;
//                                                // decision-scoped recheck
//   if (!ok) abort;  else act;
```

Properties, each a fixture:

- **Decision-scoped recheck** — the finalize re-check compares exactly the
  decision inputs (all target fields + plan entry + exact winning admission
  ordinal), not global position quiescence, so
  unrelated churn at busy positions cannot permanently wedge honest decisions.
  [DERIVED INVARIANT — LR-3(ii)'s repair of the originally adopted item-F
  instantiation, lens-spec §3.2 via CARRY-IN.]
- **Attack bound** — an equivocating author who flips the head inside the
  window forces an *abort*, including flip-away-then-rebind-to-the-same-target
  sequences because the winning admission ordinal changes (a DoS of the
  decision, priced at the attacker's own gas via CAS writes), never a wrong
  acceptance. [DERIVED INVARIANT —
  core-onchain attack table, "revocation race inside a challenge window" row.]
- **Unfrozen mechanics** — `WINDOW` is a consumer constant (no Core default);
  whether Core later adds an O(1) revalidation counter (`positionSeq`-shaped:
  finalize checks one word instead of re-resolving, ≈ 3–4 SLOADs vs a full
  walk) is a [HYPOTHESIS — lens-pass corpus core-onchain §5.4, PLAUSIBLE;
  falsifier: the V2-E2 successor must show the bump-invariant ("every
  view-affecting transition bumps") holds across every Lane 6 transition, else
  the counter is unsound and stays out]. B0 ships without it; correctness never
  depends on it.
- B0 note: Binding CAS at cardinality-one heads makes every fresh same-principal
  rebind a distinct admitted occurrence (`winnerAdmissionOrdinal` motion),
  which the recheck catches without a separate head read; cross-Principal
  "equivocation" is just plan-visible
  CONFLICT and is handled by the combiner, not the window.

---

## 12. Traceability summary (rule → label → source)

| Rule | Label | Source |
|---|---|---|
| No on-chain CBOR; packed fixed-width offset-free plan | DERIVED INVARIANT | lens-spec §2.2 LR-1 (VERIFIED) |
| Plan-committed caps; exact-length; reserved-zero; fail-closed unknowns | DERIVED INVARIANT | lens-spec §2.2 / object-taxonomy §2.2 (VERIFIED) |
| CORE cap ≠ client ceiling (two constants) | DERIVED INVARIANT | lens-pass-synthesis LN-3 (VERIFIED) |
| `MAX_PLAN_ENTRIES_CORE = 64` | PROPOSAL | §3.4 arithmetic + 15–55 center (HYPOTHESIS) |
| Plans as admitted spine Records; PlanId is the exact ResolutionPlan RecordId | PROPOSAL | §4.2 argument; enabled by OWNER RULING items 17/18 |
| CREATE2/EXTCODECOPY plan store | HYPOTHESIS (bakeoff arm B) | lens-spec §2.3, self-marked PLAUSIBLE, V-2 gate |
| Claim-conditional authority | DERIVED INVARIANT | lens-spec §3.1 LR-2 (VERIFIED); dissolved-into-admission path noted per CARRY-IN |
| Verify-above-the-winner; hints never correctness | DERIVED INVARIANT | lens-spec §3.2 LR-3 (VERIFIED) |
| Singleton-bit early-exit legality | DERIVED INVARIANT | lens-spec §3.2 (VERIFIED) |
| Anti-fallthrough on UNKNOWN | DERIVED INVARIANT | lens-read-gotchas throughline; joined-pass JR-1 (VERIFIED) |
| Absence = source 1 (authoritative state at closure); UNKNOWN never absence | DERIVED INVARIANT | JR-5 four sources + CARRY-IN reconciliation demand (VERIFIED) |
| Two-axis honesty; never-collapse | DERIVED INVARIANT | assumptions-and-requirements §10 (VERIFIED); constitution outcome list |
| Budget exhaustion reverts, never grounds absence | DERIVED INVARIANT | core-onchain §3 (VERIFIED, EVM semantics) |
| Combiner set closed at EXACT/PRIORITY/THRESHOLD; exact T1–T10 semantics | PROPOSAL | fresh B0 definitions under P-CORE-7 evidence |
| Counting is not a combiner (closed committees only) | DERIVED INVARIANT | lens-spec §3.4; owner-rulings item E (VERIFIED) |
| Risk-bearer pins the plan; view/state ABI split; LENS-NEG-1 | DERIVED INVARIANT (rule) + PROPOSAL (fixture) | system-constitution Lenses section (VERIFIED) |
| EIP-7825 cap = 16,777,216 live since Fusaka 2025-12-03; wide pages impossible | DERIVED INVARIANT (venue-conditional FACT) | lens-pass-synthesis LN-4 (VERIFIED); re-verify per Realm profile |
| Gas rows §9 | arithmetic (VERIFIED as arithmetic) + HYPOTHESIS (as totals; V2-E2 gate) | EIP-2929 schedule |
| PATH profile deferred, separately benchmarked | PROPOSAL (deferral) | constitution line ~193–196 (VERIFIED) |
| No collision bit; challenge-window for untrusted authors | OWNER RULING (item F) + REJECTED (the bit) | owner-rulings 2026-07-15 lines 51–53 (VERIFIED) |
| Decision-scoped recheck | DERIVED INVARIANT | lens-spec §3.2 LR-3(ii) (VERIFIED) |
| `positionSeq`-shaped O(1) revalidation | HYPOTHESIS | core-onchain §5.4 (PLAUSIBLE), V2-E2 falsifier named |

Golden-vector categories this chapter owes the fixture chapter: plan
encode/validate vectors (valid N ∈ {1,8,32,64}; one per rejection code 1–13;
MC/1 u16 frame-length prefix round-trip plus short/long/noncanonical-prefix
rejections);
combiner outcome vectors (each of T1–T10, incl. two-value THRESHOLD conflict at
k ≤ N/2, RECORD-vs-OCCURRENCE same targetA conflict, same EnvelopeId with
different targetLeaf conflict, and the tombstone-contributes-absent case);
BindingKey derivation
vectors (incl. two Principals sharing low-160-bits); LENS-NEG-1; challenge-window
commit/abort/finalize comparing all target fields, winner index, and exact
winning admission ordinal; cross-language
(Solidity/TS/Rust) byte-identical plan
frames and plan RecordIds.

Separate SDK/client fixtures run `N = {50,100,256}` on pinned mobile and
desktop profiles (never as Core plans) and assert equal results plus honest
UNKNOWN/PARTIAL propagation. The DI-13 fixture adds a hostile CONFLICT row
whose claimant-controlled presentation fields must not render and a mixed
six-axis answer that must not become a success checkmark.

---

## Interfaces exposed

The compact contract other chapters rely on:

```solidity
// ---- constants ----
uint16  MAX_PLAN_ENTRIES_CORE = 64;          // Core-enforced
uint16  MAX_PLAN_ENTRIES_CLIENT = 256;       // client-side ceiling, not Core-enforced
bytes32 SEMANTICS_PROFILE_B0 = keccak256("efs2/lens-semantics/b0/1");
// PlanId is only an alias for the RecordId whose TypeSchemaId = TYPE_RESOLUTION_PLAN_1.
// That Type has one frame BYTES(maxLen=4192) field; canonicalBody is
// u16(frameLen) ‖ the §3.2 frame, totaling 98 + 64·N bytes.

// ---- types ----
enum Presence { UNKNOWN, FOUND, ABSENT, CONFLICT, UNSUPPORTED }
struct BasisReport { bytes32 realmRevisionId; uint64 blockNumber; uint64 admissionHigh; uint8 basisKind; }
struct ResolvedTarget { uint8 targetKind; bytes32 targetA; uint16 targetLeaf; }
struct ResolveResult {
    Presence presence; uint8 reasonCode; ResolvedTarget target;
    uint16 winnerIndex; uint16 winnerTier;
    uint64 winnerAdmissionOrdinal;
    uint16 presentCount; uint16 agreeCount; BasisReport basis;
}

// ---- external views on Core ----
function resolve(bytes32 planRecordId, bytes32 positionKey) external view returns (ResolveResult memory);
function resolveStrict(bytes32 planRecordId, bytes32 positionKey, uint8 acceptMask)
    external view returns (ResolvedTarget memory target, ResolveResult memory);
function validatePlan(bytes32 planRecordId) external view returns (bool ok, uint8 rejectCode);
function deriveBindingKey(bytes32 principalId, bytes32 positionKey) external pure returns (bytes32);
// DOM_BINDING = keccak256("efs2/binding/1")
// deriveBindingKey = keccak256(abi.encode(DOM_BINDING, principalId, positionKey))

// ---- errors ----
error PlanUnavailable(bytes32 planRecordId);
error PlanMalformed(bytes32 planRecordId, uint8 rejectCode);
error ResolveNotAccepted(uint8 presence, uint8 reasonCode);

// ---- consumed exactly from Lane 5/6 ----
function recordBody(bytes32 recordId) external view returns (bytes memory); // full body, no elision
function getBindingHead(bytes32 bindingKey) external view returns (
    BindingHead memory head, bytes32 realmBasis, uint64 highWaterOrdinal);
function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
    external view returns (
        BindingHead memory head, bytes32 realmBasis, uint64 highWaterOrdinal);
// BindingHead = { state(UNSET|BOUND|TOMBSTONED), targetKind,
//                 tombstoneCause, revision, admissionOrdinal uint64,
//                 targetA, targetLeaf } decoded from the exact SR-8 two slots.
// realmBasis/highWaterOrdinal are separately qualified query metadata.
// Probe cost: 1 cold SLOAD absent/metadata-only; 2 with targetA.

// ---- reserved seams ----
// per-entry minAuthFloor (uint64, 0 in B0) + walk step (5) gradeAuthority():
//   managed-Principal attachment point; BOUND-heads-only, blocks with
//   UNKNOWN(REASON_AUTHORITY_UNGRADEABLE), never falls through.
// resolvePath(...): PATH/1 stub, separately benchmarked, not in B0.
// Challenge window: consumer-side pattern only; no Core state frozen.
```

Conformance rules other chapters must carry: state-changing consumers read
the plan RecordId only from their own admin-written storage and check
`purposeAndScope`;
gates accept only the FOUND bit; UNKNOWN/CONFLICT never collapse or fall
through; SDK resolves pin one basis for all probes of one resolution and return
UNKNOWN (never ABSENT) on unavailable basis/coverage; CONFLICT rows render no
claimant-derived content; the six-axis answer tuple never becomes a success
checkmark.

## Open items

1. ~~Encoding-chapter reconciliation~~ — **CLOSED**: one
   `frame BYTES(maxLen=4,192)` field; canonical body
   `u16(frameLen) ‖ frame`; parser offset 2; ordinary RecordId over the whole
   body. Only the concrete `TYPE_RESOLUTION_PLAN_1` golden-vector value waits
   for Stage B minting; no encoding decision remains open.
2. **`MAX_PLAN_ENTRIES_CORE = 64`** — confirm/retune on V2-E2 real-kernel
   measurements at 1/8/32/64; budget failure returns to James per the kickoff
   gate. Closed by: V2-E2 matrix.
3. **PLAN-STORE-B (CREATE2/EXTCODECOPY)** — run the V-2-successor fixture and
   the plan-load gas comparison before freeze; adopt only under the §4.2
   decision rule. Closed by: bakeoff round + fixture.
4. **PATH profile** — depth constant, position-derivation formula for steps,
   and the separate benchmark. Closed by: a dedicated PATH fixture round;
   constitution already authorizes the split.
5. **UNKNOWN exhaustiveness under managed Principals** (V-3 successor) — the
   reason-code enumeration must be re-proved exhaustive when the authority
   module lands. Closed by: Principal/authority chapter + red team.
6. **`positionSeq`-shaped O(1) revalidation** — bump-invariant proof across all
   Lane 6 transitions before any adoption. Closed by: V2-E2 successor.
7. **Advisory/deny composition** — whether two-plan consumer composition
   suffices for GATE deny sources or a versioned plan section returns. Closed
   by: consumer/GATE profile chapter + red team.
8. **acceptMask vs full AcceptanceMatrix** — whether per-axis acceptance
   (basis-age floors, basisKind restrictions) belongs in Core's
   `resolveStrict` or stays consumer code. Closed by: consumer-profile chapter.
9. **Realm gas profile** — V2-E5's Realm descriptor should carry the venue tx
    cap so the §9 headroom claims are checkable per Realm (EIP-7825 is L1
    physics, not guaranteed on an L2/L3). Closed by: V2-E5 lane.
