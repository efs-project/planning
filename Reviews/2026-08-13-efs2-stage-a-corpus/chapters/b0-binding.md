# B0 Binding & Withdrawal state machine

**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 6 of the Stage A commissioned pass (2026-08-12). This chapter makes the
B0 "SPINE" arm's Binding subsystem exact: key derivation, the complete head
state machine, Withdrawal/1, the equivocation posture, the absence predicate,
and the ABI. It assumes the shared name/type skeleton (`TypeSchemaId`,
`RecordId`, `EnvelopeId`, `OccurrenceRef = (EnvelopeId, leafIndex uint16)`,
`PrincipalId` bytes32 full-width, `RealmId`, `AdmissionOrdinal`, `PositionKey`,
`BindingKey`, ResolutionPlan `RecordId` (`PlanId` alias), `AuthorityBasis`) and the B0 axis pins (immutable
shared PublicationEnvelope; uniform PrincipalId; portable Envelope + separate
Realm-bound AdmissionIntent; one atomic physical Core with internal libraries).
Post-red-team, this chapter is repaired to the overview's SR pins — chiefly
SR-3 (intent-carried `expectedRevisions`), SR-6 (key domains), SR-8 (2-slot
head), SR-10 (occurrence-status overlay), and SR-15 (idempotent duplicates).
The final identity-preserving repair forbids every current-envelope OCCREF;
same-envelope RecordId references remain legal, and cross-envelope effect chains
compose through the optional non-Core atomic router.

Evidence base: [[owner-rulings]] 2026-07-15 item F (lines 51–53, read
verbatim — VERIFIED); [[system-constitution]] "One transaction and honest
mutation" (lines 153–163 — VERIFIED); [[core-architecture-candidate]]
"Binding and withdrawal" (lines 211–232 — VERIFIED);
[[joined-pass-synthesis]] JR-5 (line 29 — VERIFIED); [[lens-spec]] §1 item 2
(line 71 — VERIFIED); [[assumptions-and-requirements]] §12 item 7 (line 533 —
VERIFIED); the intake audit CARRY-IN lane (absence sources, anti-fallthrough,
item-F carriage, LR-3(ii) caveat); the red-team findings archived in the pass
corpus (duplicate-semantics fork; double-booked history; sentinel/REF
composition).

---

## 1. Keys: PositionKey and BindingKey

### 1.1 Exact preimages

Both keys follow the SR-1 two-level ID discipline [PROPOSAL — pinned by the
overview]: `DOM_X = keccak256("efs2/<name>/<version>")` (the string enters the
encoding chapter's closed §1.3 table); preimage = `abi.encode(DOM_X, …fields)`
with every field a fixed-width word; id = `keccak256(preimage)`. keccak256 is
the EFS-native hash (EVM-native, cheapest).

```text
DOM_POSITION = keccak256("efs2/position/1")     // SR-6 pin
DOM_BINDING  = keccak256("efs2/binding/1")      // SR-6 pin

PositionKey = keccak256( abi.encode(DOM_POSITION, purpose, subject, fieldRole) )
              // abi.encode(bytes32,bytes32,bytes32,bytes32) = exactly 128
              // bytes, each field one big-endian 32-byte word, in this order.

BindingKey  = keccak256( abi.encode(DOM_BINDING, principalId, positionKey) )
              // abi.encode(bytes32,bytes32,bytes32) = exactly 96 bytes.
```

Preimage total lengths are therefore 128 and 96 bytes. The disjoint domain
words and differing preimage lengths make cross-family collisions structurally
impossible. A future layout change mints `/2`; `/1` preimages are never
reinterpreted. [PROPOSAL — regenerated field-for-field under SR-1/SR-6.]

[REJECTED — superseded sub-variant, kept for the record]: this chapter's
draft form prepended the raw ASCII strings `"efs2/position/1"` /
`"efs2/bindingkey/1"` to the preimage. SR-1 retires raw-ASCII-prefix
concatenation set-wide, and SR-6 retires the spellings `efs2/bindingkey/1`
and `efs2/binding-key/1`; the pinned domains above are the only B0 forms.

Field types and widths:

| Field | Type | Meaning |
|---|---|---|
| `purpose` | `bytes32` | What kind of slot this is (see §1.2) |
| `subject` | `bytes32` | The stable thing the slot is about: a `RecordId`, ObjectGenesis `RecordId` (ObjectId), `RealmId`, `PrincipalId`, or `TypeSchemaId`. Opaque to the kernel. |
| `fieldRole` | `bytes32` | Which declared role/slot of the purpose this is. Small role ordinals are left-padded (`bytes32(uint256(n))`); role-name hashes use `keccak256(abi.encode(DOM_FIELDROLE, keccak256(utf8Name)))` with `DOM_FIELDROLE = keccak256("efs2/fieldrole/1")` [PROPOSAL — SR-1 discipline: variable-length content enters pre-hashed]. Opaque to the kernel. |
| `principalId` | `bytes32` | Full-width, always. Never truncated to 160 bits anywhere in this chapter's ABI, storage, or preimages. [DERIVED INVARIANT — system-constitution lines 146–148: "Every Principal-bearing ID, ABI, storage key, index key, Binding, and Lens preserves the full bytes32 PrincipalId."] |

**Sentinel legality of small-ordinal `fieldRole` values [PROPOSAL — red-team
composition repair, per SR-11's body-convention rule]:** `purpose`, `subject`,
and `fieldRole` are declared `BYTES_FIXED(32)` in the kernel Binding-class
schemas — **never REF-kind**. The encoding chapter's sentinel rules (all
values < 2^16 reserved; zero forbidden) apply only to REF-kind fields, so the
left-padded small role ordinals above are legal. Declaring any of these three
fields as REF-kind would make every small-ordinal `fieldRole` body
structurally unadmittable (`ERR_SENTINEL_IN_BODY`) and is therefore
[REJECTED] for the kernel schemas.

Because all candidate `subject` values are themselves keccak256 outputs under
disjoint domain words, cross-kind subject collision (a RecordId equal to a
RealmId) is cryptographically negligible and the kernel does not tag the
subject kind inside the preimage. [PROPOSAL — one fewer field; the declaring
Type gives the subject kind its meaning.]

### 1.2 What `purpose` ranges over — decided for B0

**B0 decision: `purpose` is a free, kernel-opaque `bytes32`. There is no
bounded on-chain purpose registry and no admission-time purpose validation.**
[PROPOSAL]

Rationale:

1. A registry gate would make new application slots a governance action,
   violating the constitution's "application Types that require no Core
   contract upgrade" (system-constitution lines 113–116) and reintroducing the
   admission-callback surface the kickoff bans (kickoff line 93).
2. Squatting is structurally harmless: `BindingKey` includes `principalId`,
   so no third party can occupy *your* slot; a colliding purpose choice by
   another app merely names a different slot of a different principal, or — at
   worst — the same principal's same slot, which is that principal's own
   modeling error, visible in history.
3. Kernel neutrality: the kernel never interprets purposes, so an unbounded
   range costs nothing at admission (the key is one hash either way).

Two blessed derivation conventions (client/SDK-level, NOT enforced by the
kernel; conformance tests check the SDK, not the chain) [PROPOSAL]:

```text
Typed position   : purpose = TypeSchemaId of the Type that declares this
                   binding position (axis-4 Variant A folds binding-position
                   declarations into Type identity, so the TypeSchemaId is the
                   natural purpose value).
Ad-hoc app slot  : purpose = keccak256(abi.encode(DOM_PURPOSE,
                   keccak256(utf8PurposeString)))
                   with DOM_PURPOSE = keccak256("efs2/purpose/1")
                   [PROPOSAL — regenerated under SR-1; the string enters the
                   encoding chapter's closed table]
```

Anti-preimage-hiding rule [PROPOSAL]: **the kernel never accepts a
precomputed `PositionKey` on the write path.** Binding-class Record bodies
carry the full `(purpose, subject, fieldRole)` tuple; admission recomputes
`PositionKey` and `BindingKey` from the admitted bytes. This guarantees every
admitted head's position tuple is state-readable (reconstruction without any
off-chain dictionary), and makes "hidden slot" writes impossible. Read APIs
accept either the raw keys or the tuple (§8).

### 1.3 Principal derivation — writers cannot bind another's key

`principalId` in the `BindingKey` preimage is always the **admitted
Envelope's authenticated principal**, produced by the SR-13 verifier chain
(`computePrincipalId(principal) == envelope.header.principalId` asserted
before witness verification) — never a field of the Binding Record body and
never free calldata. A writer therefore cannot bind, tombstone, or withdraw at
another Principal's BindingKey; the mismatch error class does not exist
because the input path does not exist. [DERIVED INVARIANT —
core-architecture-candidate lines 219–221: "Admission derives principalId
from the authored Occurrence, so a writer cannot bind another Principal's
key"; carried unchanged into B0, now made evaluable by SR-13.]

---

## 2. Storage layout (Realm-local, inside the atomic Core)

The Core contract is one Realm deployment, so `RealmId` is implicit in every
mapping below. All state is ordinary contract storage — never event-only —
so a second implementation reconstructs the full Binding history from state
alone. [DERIVED INVARIANT — system-constitution lines 210–216
(state-readable reconstruction); onchain-completeness three-axes lesson via
CARRY-IN: event-derived = off-chain under EIP-4444.]

**One history owner [PROPOSAL — red-team repair; the postings lane wins]:**
the draft carried two full per-BindingKey histories — a revision-keyed 3-slot
`Entry` mapping here AND the Lane 5 `KIND_BINDING_HIST` postings. That is
double-booked state (each store can derive the other's answers) and
double-booked gas. The revision-keyed `Entry` mapping is [REJECTED —
superseded]; **THE Binding history is the Lane 5 `KIND_BINDING_HIST` postings
family plus the SR-10 admission log**: each head mutation appends the
producing occurrence's `AdmissionOrdinal` to the bindingKey's posting list;
per-revision detail (target, cause, body tuple) hydrates from the admission
log entry and the occurrence's state-readable body (full-body spine, owner
ruling items 17/18). `KIND_BINDING_HIST` is a RAW_AUDIT family: its physical
postings are never liveness-filtered or decremented, and each history result
hydrates the producing occurrence's current/basis-pinned status separately.
Withdrawal therefore grades a historical mutation but never hides its
revision. This chapter keeps **heads only**.

```solidity
// ---- named storage (illustrative Solidity; layout is the normative part) --

// Binding head, exactly 2 slots per BindingKey (SR-8). Zero slot 0 == UNSET.
struct BindingHeadSlots {
    uint256 meta;       // slot 0 — bit layout §2.1
    bytes32 targetRef;  // slot 1 — RecordId | EnvelopeId; zero when TOMBSTONED
}
mapping(bytes32 bindingKey => BindingHeadSlots) heads;

// The occurrence lifecycle store is NOT owned here. SR-10 pins one owner:
// the admission lane's occKey-addressable status overlay
//   mapping(occKey => OccStatus)
//   OccStatus = { status u8 (0 NEVER_ADMITTED, 1 ACTIVE, 2 WITHDRAWN,
//                 3 PRE_WITHDRAWN), ordinal u48, revokedAtOrdinal u48 }
// with occKey = keccak256(abi.encode(DOM_OCCURRENCE, envelopeId,
//                                          uint256(leafIndex))),
// DOM_OCCURRENCE = keccak256("efs2/occurrence/1") (encoding/authorship owner,
// under SR-1). This chapter CONSUMES that overlay; the draft's Binding-local
// `occLife` word is [REJECTED — merged into the SR-10 overlay, which owns
// pre-admission status (PRE_WITHDRAWN) this lane's word could not represent].
```

### 2.1 Head `meta` bit layout (slot 0, one 256-bit word) — SR-8 pin

Bit 0 is the least-significant bit of the word. All multi-bit fields are
unsigned big-endian within their span (ordinary EVM integer packing).

| Bits | Width | Field | Values |
|---|---|---|---|
| 0–7 | 8 | `state` | 0 = UNSET (the zero word IS absence), 1 = BOUND, 2 = TOMBSTONED |
| 8–39 | 32 | `revision` | 1-based; 0 only in the UNSET zero-word; typed guard at `2^32 − 1` (§3.3) |
| 40–87 | 48 | `currentOrdinal` | AdmissionOrdinal of the producing admission, u48 physical (SR-4; uint64 at every ABI) |
| 88–95 | 8 | `targetKind` | 0 = NONE, 1 = RECORD, 2 = OCCURRENCE |
| 96–103 | 8 | `tombstoneCause` | 0 = NONE, 1 = EXPLICIT, 2 = WITHDRAWAL |
| 104–119 | 16 | `targetLeaf` | leaf index iff `targetKind == OCCURRENCE`, else 0 |
| 120–255 | 136 | reserved | MUST be zero in `/1`; nonzero rejects at write, ignored at read. |

Slot 1 is `targetRef` (`bytes32`), zero when TOMBSTONED.

Probe costs [PROPOSAL — SR-8 gas shape]: proved-absent = **1 cold SLOAD**
(~2,100); present state/revision/cause/targetLeaf = 1 SLOAD; present incl.
`targetRef` = **2 SLOADs** (~4,200). The CAS source-occurrence check reads the
reversible two-word log entry, adding **2 log SLOADs** (§3.3). There is no
`sourceEnv` slot on the head and no
`authorityBasis` on the head: the producing occurrence and its authority
evidence are reached by following `currentOrdinal` through the reversible
admission log into `getReceipt(currentOrdinal)`. Receipt hydration finds the
occurrence's accepting `AdmissionBatch` from its append-only `firstOrdinal`
boundaries and returns that batch's exact SR-7 `AuthorityBasisWord` plus the
conditional `authorityCodehash` (zero unless `CONTRACT_ERC1271`). EnvelopeMeta
owns neither field: staged admissions of one Envelope are separately verified
and may belong to different accepting batches with different basis blocks,
delegates, revisions, or codehashes. B0 account-Principal grading is constant
`AUTH_OK` and reads none of them.

### 2.2 Occurrence status overlay (consumed, not owned) — SR-10 field names

This chapter uses the SR-10 overlay's exact vocabulary everywhere:

| Field | Width | Values / meaning |
|---|---|---|
| `status` | u8 | 0 = NEVER_ADMITTED, 1 = ACTIVE, 2 = WITHDRAWN, 3 = PRE_WITHDRAWN |
| `ordinal` | u48 | AdmissionOrdinal assigned at admission; 0 = none (ordinals start at 1) |
| `revokedAtOrdinal` | u48 | AdmissionOrdinal of the withdrawal / pre-withdrawal; 0 otherwise |

The overlay OWNS pre-admission status: `PRE_WITHDRAWN` marks an occKey
withdrawn before its envelope was ever admitted (§4). The one-way flips
(NEVER_ADMITTED → ACTIVE; ACTIVE → WITHDRAWN; NEVER_ADMITTED → PRE_WITHDRAWN)
drive the exactly-once index decrement and the no-resurrection guard (§3.4).

---

## 3. The Binding state machine

### 3.1 States

Per `BindingKey`, Realm-local:

```text
UNSET                      heads[k].meta == 0. Nothing was ever admitted here.
BOUND(target, revision)    A live head: state=1, targetKind ∈ {RECORD, OCCURRENCE}.
TOMBSTONED(revision)       A live authored/derived "no value": state=2,
                           cause ∈ {EXPLICIT, WITHDRAWAL}.
```

TOMBSTONED is a *live* state with a revision and a producing occurrence — it
is evidence, not deletion. UNSET has no revision, no history, no bytes.

### 3.2 Inputs

Three Binding-class canonical Record bodies (field schemas below; exact byte
codec is owned by the encoding chapter — this chapter treats `canonicalBody`
as opaque bytes with these declared, statically extractable fields). Field
**kinds** for the sentinel-critical fields are pinned here [PROPOSAL — the
red-team composition repair; SR-11 requires Binding-class bodies legal under
the encoding chapter's REF/sentinel rules]:

```text
BindingSet/1 {
  purpose       BYTES_FIXED(32)   // never REF-kind (§1.1 sentinel rule)
  subject       BYTES_FIXED(32)   // never REF-kind
  fieldRole     BYTES_FIXED(32)   // never REF-kind
  targetRecord  OPTION(REF)       // role targetRecord: targetClass=RECORD,
                                  // expectedType=ANY, DIRECT selector
  targetOccurrence OPTION(OCCREF) // role targetOccurrence:
                                  // targetClass=OCCURRENCE, DIRECT selector
  predecessor   OPTION(OCCREF)    // (envelopeId, leafIndex); NONE ⇔ first
                                  // write at this key. Uses the encoding
                                  // chapter's EXPLICIT NONE encoding — never
                                  // raw bytes32(0) (SR-11 sentinel rule).
                                  // role predecessor: targetClass=OCCURRENCE,
                                  // DIRECT selector
}

BindingTombstone/1 {
  purpose       BYTES_FIXED(32)
  subject       BYTES_FIXED(32)
  fieldRole     BYTES_FIXED(32)
  predecessor   OPTION(OCCREF)    // NONE ⇔ first write (T4)
                                  // role predecessor: targetClass=OCCURRENCE,
                                  // DIRECT selector; no target fields exist
}

Withdrawal/1 {
  target        OCCREF            // (targetEnvelopeId, targetLeafIndex);
                                  // always a real reference, never NONE;
                                  // role target: targetClass=OCCURRENCE,
                                  // DIRECT selector
}
```

These are ordinary MC/1 schemas, not ad hoc kernel byte layouts. In
particular, `Withdrawal/1.canonicalBody` is exactly the 34-byte MC/1 `OCCREF`
encoding `target.envelopeId ‖ u16be(target.leafIndex)`. `BindingSet/1` passes
kernel effect validation iff **exactly one** of `targetRecord` and
`targetOccurrence` is present. Both absent or both present are
`E_STRUCTURAL(leafIndex, ERR_EFFECT_BINDING_TARGET_CARDINALITY=17)` before
any state write.
The exact role/index rows are:

| Type | roleId | name / fieldIdx | targetClass | expectedType | selector | IndexSpec |
|---|---:|---|---|---|---|---|
| BindingSet | 0 | targetRecord / 3 | RECORD | 0 (ANY) | DIRECT, member 0 | REF_BACKLINK(0) |
| BindingSet | 1 | targetOccurrence / 4 | OCCURRENCE | 0 (unused) | DIRECT, member 0 | REF_BACKLINK(1) |
| BindingSet | 2 | predecessor / 5 | OCCURRENCE | 0 (unused) | DIRECT, member 0 | REF_BACKLINK(2) |
| BindingTombstone | 0 | predecessor / 3 | OCCURRENCE | 0 (unused) | DIRECT, member 0 | REF_BACKLINK(0) |
| Withdrawal | 0 | target / 0 | OCCURRENCE | 0 (unused) | DIRECT, member 0 | REF_BACKLINK(0) |

There are no other ReferenceRoles or IndexSpecs in these three Types. Field
indexes are zero-based; role IDs are dense; every reference leaf is covered
once. The meaning/spec/qualifier bytes and resulting concrete TypeSchemaIds are
Codex golden-vector material that Stage B must pin over this exact shape before
genesis.
The effect parser derives the head tuple without another body convention:

```text
targetRecord present     => targetKind=RECORD,     targetA=RecordId,   targetLeaf=0
targetOccurrence present => targetKind=OCCURRENCE, targetA=EnvelopeId, targetLeaf=leafIndex
```

`BindingTombstone/1` has neither target field. Its only occurrence reference
is `predecessor`; `Withdrawal/1` has exactly its one `target`. Thus every
kernel reference is representable by, and uniquely covered by, the closed
ReferenceRole grammar. Concrete `TYPE_BINDING_SET_V1`,
`TYPE_BINDING_TOMBSTONE_V1`, and `TYPE_WITHDRAWAL_V1` values remain Stage B
Codex outputs over these exact schemas; no value is minted in Stage A.

[REJECTED — superseded sub-variant]: the draft encoded first-write
predecessors as `predecessorEnvelopeId = bytes32(0), predecessorLeafIndex =
0`. Raw-zero REF values are sentinel-illegal under the encoding chapter's
rules; the explicit `OPTION(OCCREF)` NONE encoding above replaces the
`(0,0)` convention everywhere, including the T1/T4 guards.

These arrive only as leaves of an admitted PublicationEnvelope; there is no
separate external `bind()` transaction. The kernel recognizes them by
kernel-pinned `TypeSchemaId` constants `TYPE_BINDING_SET_V1`,
`TYPE_BINDING_TOMBSTONE_V1`, `TYPE_WITHDRAWAL_V1` — exactly the closed SR-11
list; concrete values mint in Stage B via the encoding chapter's constants
table and golden vectors. [PROPOSAL — kernel-known Type IDs rather than a
leaf-header kind discriminator; the alternative (a `kind` byte in the
Envelope leaf header) is a sketched bakeoff arm belonging to the envelope
chapter.]

Realm-local CAS precision rides in the **AdmissionIntent**, not the portable
Envelope, preserving axis 3 (portable authored evidence; Realm-bound
admission). This is now pinned by SR-3 [PROPOSAL — overview pin]: the intent
carries `expectedRevisions[]` of `(leafIndex uint16, revision uint32)`,
**required for every selected CAS-bearing `BindingSet/1` or
`BindingTombstone/1` leaf** — the Binding machine bans wildcard/blind
realm-local writes; `Withdrawal/1` has no revision CAS item because it targets
an exact occurrence. The array is empty only when no CAS-bearing Binding
mutation is selected. Correspondingly, SR-12's
`admitAsSender` implicit-intent path is legal **only when the envelope
contains none of the three kernel-effect Types**. The predecessor *occurrence* is portable
authored testimony and lives in the Record body; the *revision* is Realm-local
state and would poison portability if signed into the Envelope.

`expectedRevision` is REQUIRED per selected BindingSet/Tombstone leaf (no
wildcard sentinel). A writer who does not know the starting revision reads it
first. Within one Envelope it also predicts legal earlier effects in leaf order;
successful same-key chains themselves use separate Envelopes through the router;
blind writes are exactly the race this machine refuses to paper over.
[PROPOSAL — races explicit, per system-constitution line 155: "Mutable state
uses explicit predecessor/CAS rules where races matter." Width is u32 per
SR-3/SR-8, guarded (§3.3).]

All three kernel bodies are additionally subject to Admission's common
`E_SELF_ENVELOPE_OCCREF` guard. `targetOccurrence`, `predecessor`, and
Withdrawal `target` may never name the Envelope that contains their own Record.
That is an identity constraint, not a Binding-policy choice: EnvelopeId commits
the RecordId, so embedding that same EnvelopeId in the Record body would require
a hash fixed point. A same-envelope BindingSet may still target an earlier
RecordId through `targetRecord OPTION(REF)`.

### 3.3 Transitions — complete table

`P` = predecessor `OPTION(OCCREF)` from the Record body, `xr` =
`expectedRevision` from the intent (u32), `head` = `heads[k]` decoded.
`src(head)` = the producing `OccurrenceRef`, reached through the reversible
admission log:

```text
src = {
  envelopeId: logSlotA(head.currentOrdinal),
  leafIndex:  logSlotB(head.currentOrdinal).leafIndex
}
occKeyOf(P) == occKeyOf(src)
occKeyOf(x) = keccak256(abi.encode(
  DOM_OCCURRENCE, x.envelopeId, uint256(x.leafIndex)
))
```

This is two cold log SLOADs per CAS check. No `occKey -> EnvelopeId` reverse
lookup exists or is needed. Every admission
below also appends the producing `AdmissionOrdinal` to the bindingKey's
`KIND_BINDING_HIST` RAW_AUDIT posting list (Lane 5 — THE history, §2), rewrites
`heads[k]`, consumes one fresh `AdmissionOrdinal` (assigned per accepted
occurrence in submission order, SR-10), and fires the Lane 5 hook
`onBindingHeadChanged` — atomically with the whole envelope admission call.

| # | Name | From | Input | Guard | To |
|---|---|---|---|---|---|
| T1 | FIRST_BIND | UNSET | BindingSet | `P == NONE && xr == 0` | BOUND(t, 1) |
| T2 | REBIND | BOUND(r) | BindingSet | `P == src(head) && xr == r` | BOUND(t′, r+1) |
| T3 | TOMBSTONE | BOUND(r) | BindingTombstone | `P == src(head) && xr == r` | TOMBSTONED(r+1, EXPLICIT) |
| T4 | FIRST_TOMBSTONE | UNSET | BindingTombstone | `P == NONE && xr == 0` | TOMBSTONED(1, EXPLICIT) |
| T5 | REBIND_AFTER_TOMBSTONE | TOMBSTONED(r) | BindingSet | `P == src(head) && xr == r` | BOUND(t′, r+1) |
| T6 | RETOMBSTONE | TOMBSTONED(r) | BindingTombstone | `P == src(head) && xr == r` | TOMBSTONED(r+1, EXPLICIT) |
| T7 | WITHDRAW_HEAD | BOUND(r) | Withdrawal targeting `src(head)` | withdrawal author == binding principal (structural, §1.3); target status ACTIVE | TOMBSTONED(r+1, WITHDRAWAL) |
| T8 | WITHDRAW_NONHEAD | any | Withdrawal targeting an occurrence that is not any current head's source | author rule; target ACTIVE | no head transition (overlay only) |
| T9 | WITHDRAW_TOMBSTONE_HEAD | TOMBSTONED(r) | Withdrawal targeting `src(head)` | author rule; target ACTIVE | TOMBSTONED(r+1, WITHDRAWAL) |

**Point-in-order shadow fold [PROPOSAL — exact].** For preflight, `head` is not
reloaded from storage for every selected leaf. On first touch Admission hydrates
the persisted head and its reversible source into a bounded memory entry; every
later selected leaf reads the updated entry. A fresh BindingSet/Tombstone source
is shadow-activated at its prospective ordinal before this table runs. Its
intent's expected-revision entry was structurally associated with that selected
leaf; for a fresh source the value is compared to the current shadow revision,
and `P` is compared to the current shadow source. An ACTIVE duplicate consumes
no transition and does not value-check or replay its already-landed CAS.

The transition immediately updates shadow state: revision, head target/state,
`admissionOrdinal`, exact source `(currentEnvelopeId,leafIndex)`, and one planned
RAW_AUDIT append. Later leaves read this updated value rather than a stale
pre-call head. Because a successful second same-key mutation would need its body
to name the first source `(currentEnvelopeId,leafIndex)`, §3.2 forbids that chain
inside one Envelope. The legal sequential form uses independently precomputed
Envelopes A and B:

```text
router publish(A): BindingSet P=NONE,  xr=0 -> BOUND rev1, source=(A,0)
router publish(B): BindingSet P=(A,0), xr=1 -> BOUND rev2, source=(B,0)
```

Both calls use explicit AdmissionIntents. In one outer EVM transaction B sees
A's state, and any later failure rolls both calls back. Two same-key mutations
placed in one Envelope against the same prior head do not both succeed: the
second observes the first shadow update and fails CAS before any write.

A Withdrawal receives its `ValidatedOccurrenceLifecycleEffect` from the same
point-in-order shadow. `targetIsCurrentBindingHead` is exact equality with that
shadow source. A cross-envelope Withdrawal published after A through the atomic
router therefore plans T7/T9. Two Withdrawal leaves in one Envelope may legally
name that same prior external source: the first tombstones it and the second sees
the terminal shadow target and plans no second target effect. Preflight writes
nothing.

Commit replays the planned transitions in the same ascending leaf order. Each
plan records its complete before head/source and after head/source. Commit
asserts the actual before value—including an earlier sibling change already
committed in this replay—then writes only the recorded after value/history
append. A mismatch is an internal invariant panic reverting the whole call;
`ErrCas*`, `ErrRevisionGuard`, target-kind, and author failures are preflight
input errors and never first discovered after ordinal allocation.

Revision guard [PROPOSAL — SR-8]: a transition that would produce
`newRevision == 2^32 − 1` reverts `ErrRevisionGuard(bindingKey)`. The named
successor seam: a bricked `(principal, position)` migrates by explicit
successor-position evidence (a fresh position whose Binding body names the
exhausted position — the same seam class as `U48_GUARD`); the kernel never
wraps or reuses revisions.

Notes.

- T4 exists so a principal can assert an authored "explicitly nothing"
  distinct from silence; resolvers grade the two differently (§6). [PROPOSAL]
- T5 is legal and is not resurrection: the new head is produced by a *fresh*
  occurrence with a strictly greater `AdmissionOrdinal`; even if `targetA`
  equals some historical target, the *value* recurring is fine — only the
  *occurrence* may not (§3.4).
- T6 is permitted for guard uniformity; the author pays for their own
  history growth. A per-key history bound is deliberately absent (history is
  paid postings state, THE-LINE-compatible: point reads never scan it). Red
  team may attack this; see Open items.
- T7/T9 carry NO CAS fields: a Withdrawal states "I no longer maintain this
  occurrence," which is meaningful regardless of intervening rebinds. If the
  target is no longer the head source, it degrades to T8 — the withdrawal
  still lands (overlay flip + counts), the head is untouched.
- Every transition's producing occurrence becomes `src(head)` of the new
  state — including T7/T9, where `src` becomes the *withdrawal* occurrence —
  so the CAS guard is uniform across all states: the next writer always names
  the occurrence that produced what they see.

### 3.4 The NO-RESURRECTION rule — precise statement

**Total order used:** `AdmissionOrdinal` — the Realm-global, strictly
increasing ordinal (uint64 ABI / u48 physical, SR-4) assigned to every
accepted occurrence in submission order (SR-10; owned by the admission lane —
this chapter only consumes its monotonicity).

**Rule [DERIVED INVARIANT — system-constitution lines 156–158: withdrawal,
revocation, tombstones and replacement "do not erase prior bytes or
unexpectedly resurrect an older value"; made exact here]:**

> For every BindingKey `k`, the sequence of head states is produced by
> occurrences whose AdmissionOrdinals are strictly increasing in revision
> order, and **an occurrence may produce at most one head state at one key,
> ever.** Consequently an older admitted Binding Occurrence can never
> displace a newer head: the only transitions into a head state (T1–T7, T9)
> require a fresh admission consuming a fresh, strictly greater ordinal, and
> the SR-10 status overlay guarantees one occurrence is admitted at most
> once — re-admission of an ACTIVE occKey is an idempotent no-op that runs
> no Binding logic, and a WITHDRAWN or PRE_WITHDRAWN occKey is permanently
> blocked from admission.

What exactly cannot recur: the **(occurrence → head) event**. What may
recur: the *target value* (rebinding to a previously used target is a new
assertion by a new occurrence — legal), and the *position* (T5). There is no
"revert to predecessor" transition anywhere in the table; the machine has no
input that installs an old occurrence as head.

Enforcement mechanics — re-derived from the SR-10 overlay guard per SR-15
(the draft's duplicate-revert mechanism is [REJECTED], below):

1. **Overlay guard (SR-10 + SR-15).** Before any leaf effect, admission reads
   the occKey's overlay status: `ACTIVE` → the occurrence was already
   admitted; this leaf is an **idempotent no-op** returning its existing
   receipt (`ALREADY_ADMITTED`), writing nothing — no Binding logic runs, so
   no second head event can exist. `WITHDRAWN` / `PRE_WITHDRAWN` → admission
   of this occKey is **permanently blocked**. The typed status fold reports the
   terminal source to Admission, and Admission alone reverts
   `E_NO_RESURRECTION(bytes32 envelopeId,uint16 leafIndex)` before any effect
   or commit. LibBinding consumes only the prevalidated lifecycle result; if a
   terminal source reaches its effect fold, that is an assert-only internal
   planner invariant, never a second external error. Resurrection is a genuine
   error, not a benign retry, and only the occurrence's own author could have
   caused the state [PROPOSAL — whole-call revert per the all-or-nothing
   admission posture, SR-9 rationale].
2. The CAS guard compares against `src(head)` — the *newest* producer. A
   stale writer holding an old predecessor gets `ErrCasPredecessor`, never a
   silent overwrite and never a rollback.
3. Revisions only increment (`newRevision = head.revision + 1`, checked,
   guarded at `2^32 − 1`); the `KIND_BINDING_HIST` posting list is
   append-only (Lane 5 postings are never rewritten).

[REJECTED — superseded per SR-15]: the draft enforced (1) with
`ErrDuplicateOccurrence` / `ErrAlreadyWithdrawn` whole-call reverts on any
duplicate. Reverting on duplicates breaks legitimate subset-admission
retries (admit leaf 0 now, retry a mask including leaf 0 while admitting
leaf 1 later — the retry would revert the new leaf), and the realm and
authorship chapters pinned the opposite semantics. Idempotent no-op at
occurrence granularity is the composition-safe rule; no-resurrection never
needed the duplicate revert, only the status guard.

### 3.5 Races — typed errors, never silent last-write

Two writers race the same key with the same predecessor: chain serialization
admits one; the other's **entire envelope admission call reverts** with the
typed error below (all-or-revert per the one-call atomicity rule,
system-constitution lines 153–155 — a partially applied envelope is worse
than a retried one; note this is a *conflict* revert, not a duplicate revert —
SR-15 governs only duplicates). [DERIVED INVARIANT — atomic admission; the
revert-data shape is PROPOSAL.]

```solidity
error ErrCasPredecessor(bytes32 bindingKey,
                        bytes32 haveEnvelopeId, uint16 haveLeafIndex,
                        uint64 haveOrdinal, uint32 haveRevision);
                        // predecessor mismatch; carries the current head's
                        // reversible OccurrenceRef as the log names it
error ErrCasRevision(bytes32 bindingKey, uint32 expected, uint32 have);
error ErrRevisionGuard(bytes32 bindingKey);          // 2^32−1; successor seam §3.3
error ErrWithdrawNotAuthor(bytes32 targetEnvelopeId, uint16 targetLeafIndex,
                           bytes32 envelopePrincipal, bytes32 targetPrincipal);
error ErrWithdrawTargetKind(bytes32 targetEnvelopeId, uint16 targetLeafIndex);
                          // target is itself a Withdrawal/1 occurrence
error ErrReservedBitsNonzero(bytes32 bindingKey);
```

`ErrWithdrawNotAuthor` is raised by Admission while creating the validated
withdrawal context and bubbles through the shared Core ABI; `E_TARGET_EVIDENCE`
owns missing/invalid target evidence. LibBinding defines no
`ErrWithdrawTargetProof`, no no-resurrection rejection, and no evidence
decoder. The sole external terminal-source rejection is Admission/Authorship's
`E_NO_RESURRECTION(bytes32 envelopeId,uint16 leafIndex)`.

[REJECTED — removed per SR-15]: `ErrDuplicateOccurrence`,
`ErrAlreadyWithdrawn`. Duplicates are idempotent no-ops at occurrence
granularity (ALREADY_ADMITTED / no-op success), never reverts.

Revert data carries the current head's producing
`OccurrenceRef { envelopeId, leafIndex }`, ordinal, and revision so a
well-behaved client can re-read, re-decide, and re-sign from the reversible
two-word log entry. No hash-preimage or occKey-to-Envelope lookup is part of
the contract. Idempotent
retry of the *same* envelope returns `ALREADY_ADMITTED` per occurrence and
writes nothing — the retry learns its write already landed (idempotency per
system-constitution line 154, now aligned with realm §5.5 and authorship
§3.2 T2/T5).

### 3.6 Batch bound under the EIP-7825 transaction cap

Per-leaf worst-case admission cost for a Binding-class leaf, cold,
post-Berlin arithmetic, **including the Lane 5 mandatory fan-out** (the
draft's figure booked a now-dead 3-slot history append while omitting Lane
5's mandatory bundle — the red-team's double-booking finding; repaired here)
[HYPOTHESIS — schedule arithmetic, replaced by the Stage B harness]:

```text
head write (slot 0 + slot 1, first bind): 2 × 22,100 =  44,200   (rebind: ~10,000)
SR-10 overlay write (fresh occKey slot):                22,100
Lane 5 mandatory bundle (Binding-class leaf, worst —
  admission-log 2 slots + baseline postings +
  KIND_BINDING_HIST append + meta updates,
  per the index chapter's §9 pricing):                ~141,000
receipt/dispatch/hook share:                           ~10,000
                                                      ---------
                                              ≈ 217,000 gas per Binding leaf (upper)
```

Against the live EIP-7825 per-transaction cap of **16,777,216 gas** (L1 since
Fusaka, 2025-12-03; a Realm's own cap may differ — re-verify per adopted
Realm profile [DERIVED INVARIANT — CARRY-IN, venue-conditional physics]):

```text
MAX_BIND_LEAVES_PER_ENVELOPE = 64         // SR-5 pin (structural, = leafMask u64)
64 × 217,000 ≈ 13.9M  vs  16,777,216      (residual ≈ 2.9M ≈ 17% before
                                           envelope-fixed costs: signature
                                           verification, calldata, RecordId
                                           recompute, intent checks)
```

[HYPOTHESIS — per SR-5: 64 is the **structural** cap; whether a maximal
all-Binding envelope admits in ONE transaction is a **measured Stage B
output, not a claimed property**. The arithmetic above says the margin is
thin; subset admission via `leafMask` (SR-3) is the guarantee, and a lower
measured cap shrinks the constant and returns to James.]

[REJECTED — superseded]: the draft's `MAX_BIND_LEAVES_PER_ENVELOPE = 128`
with "~90,000 gas per Binding leaf" and a claimed ≥ 30% margin. The 90k
figure booked the dead history mapping and omitted Lane 5's mandatory
per-leaf bundle; the constant is SR-5's 64.

---

## 4. Withdrawal/1 semantics

A Withdrawal targets one authored `OccurrenceRef` and means: *its author no
longer maintains that occurrence.* It is itself an ordinary authored
occurrence (admitted, ordinal-stamped, historical).

**Authority guard.** Only the occurrence's own author may withdraw it:
`envelopePrincipal(withdrawal) == envelopePrincipal(target)`, else the whole
envelope reverts `ErrWithdrawNotAuthor` (SR-9: revert; the
admit-as-inert-evidence arm is [REJECTED] for B0). Withdrawal never retracts
another issuer's occurrence and never deletes the Record. [DERIVED INVARIANT
— core-architecture-candidate lines 228–231, carried unchanged.]

**Pre-withdrawal (the authorship lifecycle's T4; overlay status
PRE_WITHDRAWN) [PROPOSAL — SR-10's evidence mechanism; the leaked-envelope
defense].** A Withdrawal may target an occKey whose overlay status is
NEVER_ADMITTED — the case of a signed-but-leaked envelope its author wants
dead before anyone admits it. The target occurrence has no admitted body/receipt;
an unsigned Envelope spine that happens to exist because another leaf was
admitted is not enough to authenticate the target commitment or witness. The
**authorship/admission owner alone** therefore always accepts, retains, and
validates the exact `TargetEnvelopeEvidence` shape for fresh T4:
target header, full RecordId vector, the target `(typeSchemaId, bodyHash)`
commitment pair, typed `AccountPrincipal`, and witness. It recomputes EnvelopeId,
checks the target leaf range and
`keccak256(abi.encode(DOM_RECORD,typeSchemaId,bodyHash))` against the signed
target RecordId, binds
the descriptor to the header Principal before verifying the witness, and
performs the author comparison. This Binding module receives only the
resulting typed `ValidatedOccurrenceLifecycleEffect` context shared with the
status owner; it never accepts,
decodes, or verifies opaque evidence bytes and defines no second evidence
format. For a valid NEVER_ADMITTED target it sets `PRE_WITHDRAWN` with
`revokedAtOrdinal` = the Withdrawal ordinal. No head is touched (a
never-admitted occurrence produced no head), no Binding key/body semantics are
derived, and no count decrements (nothing was incremented). Admission uses the
authenticated TypeSchemaId only to classify the closed kernel effect and reject
a Withdrawal target. Missing or invalid evidence already failed in Admission
with `E_TARGET_EVIDENCE`; an author mismatch already failed with
`ErrWithdrawNotAuthor`.
`PRE_WITHDRAWN` permanently blocks later admission of that occKey (§3.4) —
the evaluable author guard keeps this from being a griefing lever: only the
target's own author can ever produce the proof.

**Withdrawals are terminal.** A Withdrawal/1 occurrence cannot itself be
withdrawn (`ErrWithdrawTargetKind`). Un-withdrawing is re-asserting via a
fresh BindingSet/occurrence — never reactivation of the old one. This keeps
the count algebra monotone per occurrence (at most one decrement, ever) and
closes a resurrection side-door. [PROPOSAL]

**Duplicate withdrawal is a no-op [PROPOSAL — SR-15].** Re-withdrawal of a
WITHDRAWN (or PRE_WITHDRAWN) occKey is an idempotent no-op success: the
overlay is already terminal, nothing writes, no second decrement can fire
(the flip is one-way). The draft's `ErrAlreadyWithdrawn` revert is
[REJECTED].

**Effect on the Binding head — decided: TOMBSTONE, never revert to
predecessor.** Withdrawing the head-producing occurrence executes T7 (or T9):
the head becomes `TOMBSTONED(r+1, cause = WITHDRAWAL)` with the withdrawal
occurrence as the new `src(head)`. Justification [PROPOSAL]:

1. *Revert-to-predecessor is resurrection.* It would install an occurrence
   with an older AdmissionOrdinal as head after a newer head existed —
   exactly what §3.4 forbids. The predecessor may itself be withdrawn, stale,
   or a value the principal abandoned for cause.
2. *Downgrade attack.* Under revert semantics, an attacker holding a
   briefly-compromised key could withdraw the current head and thereby
   *select* an old, vulnerable value without ever signing a new binding —
   authority to erase would become authority to choose. Tombstone semantics
   are fail-safe: withdrawal can only ever produce "no live value," never a
   value the principal is not currently asserting.
3. *No hidden stack.* Revert semantics make the effective value a function of
   withdrawal order over the whole history (a stack the resolver would have
   to replay); tombstone semantics keep `heads[k]` a point read.

The principal who wants the predecessor's value back signs a fresh
BindingSet naming it as target — one explicit, ordinal-stamped act.

**WITHDRAWN-predecessor CAS semantics [PROPOSAL — stated exactly, per the
T4-interplay repair].** Invariant: **`src(head)` is always an ACTIVE
occurrence.** T7/T9 atomically install the withdrawal occurrence as the new
`src(head)` in the same call that flips the target to WITHDRAWN, so a head is
never left pointing at a WITHDRAWN producer. Consequences for writers:

- A CAS whose predecessor `P` names a **WITHDRAWN** occurrence can only be
  stale — the head moved (T7/T9) when the withdrawal landed — and fails
  `ErrCasPredecessor` carrying the current producer (the withdrawal
  occurrence). The correct rebind-after-withdrawal is T5 with
  `P = the withdrawal occurrence` and `xr = r` (the post-T7 revision): the
  next writer names the occurrence that produced the tombstone they see.
- A CAS whose predecessor names a **PRE_WITHDRAWN** or **NEVER_ADMITTED**
  occurrence likewise fails `ErrCasPredecessor` — such an occurrence never
  produced a head state, so it can never equal `src(head)`.

**Effect on non-head occurrences (T8).** Lifecycle only: the SR-10 overlay
flips ACTIVE → WITHDRAWN (one-way; re-withdrawal is a no-op success per
SR-15), `revokedAtOrdinal` is set, counts decrement, no head changes.
Withdrawing an occurrence that was *never* a binding (an ordinary
claim/endorsement) is the same T8 path — Withdrawal/1 is one mechanism for
all occurrence kinds.

**Effect on counts (Lane 5 seam).** In the same atomic call, the kernel
fires `onOccurrenceWithdrawn(envelopeId, leafIndex, typeSchemaId,
principalId)`. Lane 5 decrements the occurrence-level posting heads that this
occurrence incremented at admission. It first decrements the Record's
`KIND_BY_RECORD.liveCount`; `KIND_UNIQUE_BY_TYPE.liveCount` decrements **only
if that per-Record count reaches zero in the same fold** — the withdrawn
occurrence was the Record's last live occurrence. Revocation-aware counts are
an owner-carried acceptance obligation [OWNER RULING — owner-rulings
2026-07-15 item E, line 49: revocation-aware live counts, "PAY for it";
re-carried 2026-08-12 lines 184–186]. Exactly-once discipline: the decrement fires iff the
overlay flip happens, and the flip is one-way — no double decrement, no
decrement without a flip. (Pre-withdrawal flips NEVER_ADMITTED →
PRE_WITHDRAWN and fires no decrement: nothing was incremented.)

**Effect on history — never erases bytes.** The withdrawn occurrence's
envelope bytes, Record body, admission receipt, history postings, and the
withdrawal itself all remain state-readable forever. Withdrawal adds
evidence; it never subtracts any. [DERIVED INVARIANT —
system-constitution lines 156–158.] Readers surface WITHDRAWN as a grade on
the historical occurrence, not as its disappearance.

---

## 5. Equivocation posture

**[OWNER RULING — owner-rulings.md 2026-07-15 item F, lines 51–53, ratified
wording preserved]:** *"on-chain gates use closed, trusted author sets; EFS
does not guarantee contracts can detect equivocation, and contracts needing
certainty against untrusted authors must use a challenge-window (delay +
re-check) pattern."* The chain keeps the winner at a BindingKey, not the
conflict; there is **no kernel collision/duplicity state** in B0, and none
may be added without a new ruling.

**TOCTOU restatement (two sentences, per the ruling's recorded clinching
argument):** A kernel collision bit can only reflect equivocation already
on-chain at read time, so a contract that has already acted on the earlier
value is never retroactively protected. Because the attacker controls timing
— sign the good value, wait for the contract to act, then sign the conflict —
the bit stops only clumsy simultaneous equivocation, never timed
equivocation; the real defenses are closed trusted author sets or a
contract-side challenge window (delay + re-check).

**Why per-principal same-slot equivocation is structurally impossible
on-chain under CAS + ordinal ordering [DERIVED INVARIANT — this chapter's
§1.3/§3, mechanism argument]:**

1. `BindingKey` embeds the kernel-derived `principalId` (§1.3) — only the
   key owner's admitted envelopes can touch the slot;
2. admissions within a Realm are serialized by the chain and stamped with
   strictly increasing AdmissionOrdinals;
3. every head transition is a CAS naming the unique current producer and
   incrementing the revision by exactly one; and
4. `heads` is a mapping — one slot pair per key, at most one head at any basis.

Therefore two live heads at one BindingKey at one basis cannot exist, and two
admitted producers at the same revision cannot exist. What *can* exist is two
conflicting **signed but unadmitted** envelopes for the same slot — off-chain
evidence. At most one admits; the other reverts with `ErrCasPredecessor`.
Apps and clients may still detect and display off-chain duplicity by scanning
signed material (the ruling records that they already do); autonomous
contracts read one slot and rely on trusted author sets or the window. Note
the July global same-`(principal, order)` equivocation rule is REMOVED and
not reintroduced here [REJECTED — assumptions-and-requirements §12 item 7,
line 533: one envelope may legitimately carry several records at one order].

**Challenge-window consumer pattern (non-normative sketch — this is consumer
code, not kernel surface):**

```text
t0: h0 = readHead(k)                 // record (revision, admissionOrdinal, block)
    require h0.state == BOUND
    ... wait Δ blocks (Δ chosen by the risk bearer) ...
t1: h1 = readHead(k)
    require h1.revision == h0.revision   // unchanged through the window
    act on h0.target
```

`readHead` exposes `revision` and `admissionOrdinal` (currentOrdinal) in one
word precisely so this re-check is a single cold SLOAD (§2.1).

**Preserved lesson, mechanics unfrozen [per the PM directive, line 21]:**
the equivocation/TOCTOU lesson and the challenge-window safety requirement
are binding; the *exact* collision-state mechanics — window parameterization,
any consumer-side conflict registry, and the LR-3(ii) caveat that the
originally adopted item-F window instantiation had no sound form at busy
positions (CARRY-IN, lens-pass evidence) — remain UNFROZEN and are bakeoff /
follow-on material, not part of B0's frozen surface.

---

## 6. Complete absence at a basis

### 6.1 The predicate

A resolver may report **ABSENT** for `(principalId, positionKey)` at Realm
basis `B` (a specific block/state root of one Realm) iff:

```text
ABSENT(p, pk, B)  ⇔  an admissible absence source (§6.2) proves
                     heads[ BindingKey(p, pk) ].meta == 0 at basis B
```

i.e. head slot 0 is the zero word — state UNSET, revision 0, no history (the
zero word IS absence, SR-8). This is a *point* predicate over one storage
slot; it never requires enumeration, so it stays inside THE LINE (cost scales
with the answer).

TOMBSTONED is **not** ABSENT. The full position-state outcome set a resolver
reports [PROPOSAL — aligns with the read-model chapter's presence axis;
mapping in Open items]:

```text
FOUND(target, revision, ordinal)      state == BOUND
NONE_EXPLICIT(revision, ordinal)      state == TOMBSTONED, cause == EXPLICIT
NONE_WITHDRAWN(revision, ordinal)     state == TOMBSTONED, cause == WITHDRAWAL
ABSENT                                proved UNSET at B (this section)
UNKNOWN(cause)                        anything else
```

(Both graded NONE_* outcomes are readable from head slot 0 alone —
`tombstoneCause` is on the head per SR-8 — so the graded outcome set costs
no extra SLOAD.)

### 6.2 The four legitimate absence sources

[DERIVED INVARIANT — joined-pass-synthesis JR-5, line 29 (read verbatim);
restated against the B0 binding map:]

1. **Own-node total-state read** at basis B (includes the degenerate and most
   important case: a smart contract reading its own Realm's Core storage in
   the current block — contract state reads ARE the authoritative total-state
   read, which is why on-chain Plans may treat a zero head word as proved
   absence with no further machinery);
2. **Verified state proof to positive closure** — e.g. a Merkle-Patricia
   exclusion proof of the head slot against B's state root, verified locally;
3. **Venue-committed bundle closure manifest** whose committed scope covers
   the binding-head keyspace being asked about; and
4. **A signed closed-realm/bundle completeness manifest at signer-trust
   grade** — the answer is then only as strong as the signer trust, and the
   grade says so.

**FINAL-scope precondition [DERIVED INVARIANT — lens-spec.md line 71]:**
sources 3 and 4 ground absence only for scopes the manifest enumerates as
`FINAL`; a `PARTIAL(cursor)` scope never yields absence, and every
`ABSENT` carries rule-coverage provenance (which source, which scope, which
basis).

**Never grounds absence [DERIVED INVARIANT — lens-spec.md line 71]:** budget
exhaustion, partial replicas, hosted-RPC bare word (an unproven `0x0` from
`eth_getStorageAt`), deny hits, whiteouts, and author checkpoints.

### 6.3 Anti-fallthrough

**UNKNOWN never falls through to the next source. [DERIVED INVARIANT —
CARRY-IN read-honesty core; lens-read-gotchas binding rule: "missing data
stops resolution; only a proof of absence yields."]** In any priority
resolution over Principal-qualified heads (a ResolutionPlan walking tiers),
if the probe of a higher-priority Principal's head returns UNKNOWN — proof
unavailable, basis missing, budget exceeded — resolution STOPS and returns
UNKNOWN(cause). Only a proved ABSENT (§6.1–6.2) or an explicit
NONE_* head yields to the next tier. First-trusted-wins is anti-monotone
under missing data: skipping an unproven higher tier can only ever flip an
answer from the truth, never toward it.

---

## 7. Cardinality-many stays out of Bindings — the boundary rule

**Rule [DERIVED INVARIANT — core-architecture-candidate lines 224–227:
"Collections/cardinality-many claims remain independent Occurrences plus
enumeration indexes; they are not forced through one winning head"]:**

1. A Binding is appropriate only for a position whose declaring Type marks
   the `fieldRole` cardinality-one (one selected release, one current
   profile, one config value). The kernel cannot verify semantic cardinality
   and does not try; the boundary is enforced where it can be:
2. **Only Binding-class leaves create or change heads.** Ordinary Record
   occurrences (comments, endorsements, memberships, reviews) never touch
   `heads` regardless of their content — there is no code path from a
   non-Binding leaf to a head write.
3. **No read API ever synthesizes a winner from an enumeration.** Occurrence
   enumeration (Lane 5) returns all matching occurrences with pagination,
   basis, and completeness; multiplicity and disagreement stay visible.
   Plans resolve *heads only*; they never "pick one" from a many-set.
4. Named anti-pattern (conformance-flagged, not kernel-blocked):
   *head-ifying a many-position* — e.g. binding "the comment" for a target.
   The kernel admits it (it cannot know better); SDK conformance tests and
   Type-review checklists flag it; fixtures must include one such abuse and
   show enumeration remains complete and unaffected.

This is the same boundary the ten-curators example exercises: ten
endorsement occurrences of one Record enumerate as ten; a *curator's
selection* is that curator's own Binding at their own BindingKey — 50
curators means 50 independent heads, resolved through whatever Plan the risk
bearer pins, never one global winner.

---

## 8. ABI

Write path: there are no standalone external bind/tombstone/withdraw
functions in B0 — all writes enter through the admission lane's single
permissionless entrypoint (`publish(envelopeBytes, principal, intentBytes,
intentWitness)`, SR-12/SR-13, that chapter's surface) and reach this
subsystem as internal library calls. All three kernel-effect Types require an
explicit AdmissionIntent; selected BindingSet/Tombstone leaves additionally
carry `expectedRevisions` (SR-3). `admitAsSender` is legal only when none of
the three is selected (SR-12). This
preserves axis 6 (one atomic physical Core; modules as internal libraries)
and per-call Core atomicity. Cross-envelope sequences use explicit intents and
the optional non-Core router; sequential calls share one all-or-nothing outer
EVM transaction. The internal transition API and the external read
ABI are both normative:

```solidity
// ---------- internal library surface (called only by Admission) ----------
library LibBinding {
    // Admission-authenticated effect context. No witness/evidence bytes cross
    // this seam. targetEffectKind: 0 ordinary/no Binding effect,
    // 1 Binding mutation, 2 Withdrawal (not a legal withdrawal target).
    // targetBindingKey is nonzero only for an ACTIVE kind-1 target whose body
    // produced a Realm head; it is zero for NEVER_ADMITTED prewithdrawal because
    // no body semantics/head delta exists. Head status was computed against
    // preflight state. evidenceOrdinal equals the effective Withdrawal ordinal
    // for fresh T4, reuses that retained ordinal for PRE_WITHDRAWN, and is zero
    // for ACTIVE/WITHDRAWN paths. The status-owner LibIndex
    // consumes the byte-identical struct before Binding applies any head fold.
    struct OccurrenceRef { bytes32 envelopeId; uint16 leafIndex; }

    struct ValidatedOccurrenceLifecycleEffect {
        OccurrenceRef target;
        bytes32 targetOccKey;
        bytes32 targetPrincipalId;
        uint8   priorStatus;
        uint64  priorOrdinal;
        uint64  priorRevokedAtOrdinal;
        uint64  evidenceOrdinal;
        uint8   targetEffectKind;
        bytes32 targetBindingKey;
        bool    targetIsCurrentBindingHead;
    }

    struct ShadowBindingHead {
        uint8 state; uint8 targetKind; uint8 tombstoneCause;
        uint32 revision; uint64 admissionOrdinal;
        bytes32 targetA; uint16 targetLeaf;
        OccurrenceRef source; // explicit even when ordinal is only prospective
    }

    struct BindingTransitionPlan {
        bytes32 bindingKey;
        bool hasHeadTransition;
        bool appendRawAudit;
        ShadowBindingHead beforeHead;
        ShadowBindingHead afterHead;
    }

    // Pure/memory preflight folds. They receive the point-in-order shadow head,
    // emit exact before/after plans, and perform all typed CAS/guard reverts.
    // `pred*` is decoded OPTION(OCCREF); predIsNone means explicit first write.
    function planBind(
        ShadowBindingHead memory shadowHead,
        bytes32 principalId,           // kernel-derived from the envelope
        bytes32 purpose, bytes32 subject, bytes32 fieldRole,
        uint8   targetKind, bytes32 targetA, uint16 targetLeaf,
        bool    predIsNone, bytes32 predEnvelopeId, uint16 predLeafIndex,
        uint32  expectedRevision,      // from AdmissionIntent (SR-3)
        bytes32 srcEnvelopeId, uint16 srcLeafIndex,
        uint64  admissionOrdinal
    ) internal pure returns (BindingTransitionPlan memory plan);

    function planTombstone(
        ShadowBindingHead memory shadowHead,
        bytes32 principalId,
        bytes32 purpose, bytes32 subject, bytes32 fieldRole,
        bool    predIsNone, bytes32 predEnvelopeId, uint16 predLeafIndex,
        uint32  expectedRevision,
        bytes32 srcEnvelopeId, uint16 srcLeafIndex,
        uint64  admissionOrdinal
    ) internal pure returns (BindingTransitionPlan memory plan);

    // Plans T7/T8/T9/no-op from Admission's exact shadow lifecycle context.
    function planWithdrawal(
        ShadowBindingHead memory shadowHead,
        ValidatedOccurrenceLifecycleEffect memory target,
        bytes32 wSrcEnvelopeId, uint16 wSrcLeafIndex,
        uint64  admissionOrdinal
    ) internal pure returns (BindingTransitionPlan memory plan);

    // Commit never re-runs a transition. It asserts the stored/current shadow
    // word equals plan.beforeHead and stores plan.afterHead + planned audit.
    // Mismatch is an internal invariant panic reverting the full publish call.
    function commitBindingPlan(BindingTransitionPlan memory plan) internal;
}

// ---------- external read surface (on the Core contract) ----------
struct BindingHead {                  // decoded SR-8 2-slot head
    uint8   state;            // 0 UNSET / 1 BOUND / 2 TOMBSTONED
    uint8   targetKind;       // 0 NONE / 1 RECORD / 2 OCCURRENCE
    uint8   tombstoneCause;   // 0 NONE / 1 EXPLICIT / 2 WITHDRAWAL
    uint32  revision;
    uint64  admissionOrdinal; // currentOrdinal, widened to uint64 at ABI (SR-4)
    bytes32 targetA;          // targetRef; zero when TOMBSTONED
    uint16  targetLeaf;
    // NOTE: no sourceEnvelopeId/sourceLeafIndex on the head (SR-8): the
    // producing OccurrenceRef is the pair
    // { logSlotA(admissionOrdinal), logSlotB(admissionOrdinal).leafIndex }
    // — one reversible two-word read through Lane 5.
}

struct BindingHistoryEntry {   // hydrated from KIND_BINDING_HIST + the log
    uint32  revision;          // 1-based position in the posting sequence
    uint64  admissionOrdinal;  // the posting's ordinal
    bytes32 envelopeId;        // producing OccurrenceRef.EnvelopeId (log slot A)
    uint16  leafIndex;         // producing OccurrenceRef.leafIndex (log slot B)
    uint8   occurrenceStatus;  // ACTIVE | WITHDRAWN at the requested basis
    uint64  revokedAtOrdinal;  // zero unless/while the occurrence is withdrawn
}

/// 1 cold SLOAD if UNSET or if only meta is needed; 2 SLOADs with targetRef.
/// UNSET => zeroed struct.
function readHead(bytes32 bindingKey)
    external view returns (BindingHead memory);

/// Tuple convenience: computes PositionKey+BindingKey per §1.1, then readHead.
function readHeadByPosition(
    bytes32 principalId,
    bytes32 purpose, bytes32 subject, bytes32 fieldRole
) external view returns (BindingHead memory, bytes32 bindingKey);

/// Batched probe for ResolutionPlan walks: one call, N heads, order preserved.
/// N bounded by MAX_HEAD_BATCH = 64 (named constant [PROPOSAL]; 64 heads ×
/// 2 SLOADs ≈ 269k gas cold — comfortably inside any read context and inside
/// the 16,777,216 EIP-7825 cap with >60x margin if ever used in a tx).
function readHeadBatch(bytes32[] calldata bindingKeys)
    external view returns (BindingHead[] memory);

/// Paged history ascending from `fromRevision` (1-based), max `limit`
/// entries, `limit` <= MAX_HISTORY_PAGE = 64 (named constant [PROPOSAL]).
/// A direct page over the bindingKey's physical KIND_BINDING_HIST postings.
/// Physical posting position `r - 1` is revision `r`; no liveness filter,
/// decrement, or compaction may remove it. Each entry hydrates lifecycle
/// status at the requested/current basis plus its reversible OccurrenceRef
/// from the admission log (THE history, §2); deep
/// hydration (targets, position tuple) is via the occurrence's
/// state-readable body. completeness uses the shared SR-18b enum
/// { UNKNOWN=0, COMPLETE=1, PARTIAL=2, UNSUPPORTED=3 }: COMPLETE when the
/// physical posting sequence is exhausted, PARTIAL with resume-at nextRevision
/// otherwise; never UNKNOWN here — this is authoritative local state.
function readHistory(bytes32 bindingKey, uint32 fromRevision, uint16 limit)
    external view returns (
        BindingHistoryEntry[] memory entries,
        uint32 nextRevision,
        uint8  completeness
    );

/// Occurrence status read — a convenience view over the SR-10 overlay
/// (owner: admission lane). status: 0 NEVER_ADMITTED / 1 ACTIVE /
/// 2 WITHDRAWN / 3 PRE_WITHDRAWN. Ordinals widened to uint64 at ABI (SR-4).
function readOccurrenceStatus(bytes32 envelopeId, uint16 leafIndex)
    external view returns (uint8 status, uint64 ordinal,
                           uint64 revokedAtOrdinal);
```

Basis semantics for reads: a contract calling in-Realm reads current-block
authoritative state (absence source 1, §6.2). An off-chain client pins basis
via `eth_call` at a block hash and applies §6.2's source discipline before
ever uttering ABSENT. The read functions themselves return raw state; grading
is the reader's obligation — the kernel never emits an ungraded "not found".

Events (`BindingHeadChanged`, `OccurrenceWithdrawn`) are emitted for indexer
convenience but are NEVER load-bearing: every fact above is reconstructible
from storage alone (heads + postings + admission log + bodies). [DERIVED
INVARIANT — state-readable reconstruction, system-constitution lines
210–216.]

Named constants (B0 values):

| Constant | Value | Decided by |
|---|---|---|
| `DOM_POSITION` | `keccak256("efs2/position/1")` | SR-6 pin [PROPOSAL] |
| `DOM_BINDING` | `keccak256("efs2/binding/1")` | SR-6 pin [PROPOSAL]; spellings `efs2/bindingkey/1`, `efs2/binding-key/1` retired [REJECTED] |
| `DOM_FIELDROLE` | `keccak256("efs2/fieldrole/1")` | this chapter [PROPOSAL]; enters the encoding closed table |
| `DOM_PURPOSE` | `keccak256("efs2/purpose/1")` | this chapter [PROPOSAL]; enters the encoding closed table |
| `MAX_BIND_LEAVES_PER_ENVELOPE` | 64 | SR-5 pin; §3.6 arithmetic; harness re-derives [HYPOTHESIS] |
| `MAX_HEAD_BATCH` | 64 | §8 [PROPOSAL] |
| `MAX_HISTORY_PAGE` | 64 | §8 [PROPOSAL] |
| `TYPE_BINDING_SET_V1` | TBD | SR-11 closed list; encoding chapter's constants table + golden vectors |
| `TYPE_BINDING_TOMBSTONE_V1` | TBD | same |
| `TYPE_WITHDRAWAL_V1` | TBD | same |

---

## Interfaces exposed

The compact contract other chapters rely on:

1. **Key derivation (SR-6 pinned):**
   `PositionKey = keccak256(abi.encode(DOM_POSITION, purpose, subject, fieldRole))`;
   `BindingKey = keccak256(abi.encode(DOM_BINDING, principalId, positionKey))`;
   `DOM_POSITION = keccak256("efs2/position/1")`,
   `DOM_BINDING = keccak256("efs2/binding/1")`; `purpose`/`subject`/
   `fieldRole` are kernel-opaque bytes32 (BYTES_FIXED(32) in the kernel
   schemas, never REF-kind); `principalId` is always kernel-derived (SR-13),
   full-width. Write path never accepts precomputed keys; the position tuple
   is always state-readable from the admitted body.
2. **State machine:** heads are the SR-8 2-slot layout, UNSET | BOUND |
   TOMBSTONED(EXPLICIT|WITHDRAWAL), `revision` u32 with `ErrRevisionGuard` +
   successor-position seam; transitions T1–T9 exactly as tabled; CAS =
   (predecessor `OPTION(OCCREF)` in the portable body — explicit NONE for
   first writes, never raw 0) + (required per selected BindingSet/Tombstone
   `expectedRevision uint32` in the Realm-bound AdmissionIntent, SR-3);
   point-in-order mutations consume/compare these against shadow heads;
   current-envelope OCCREF is forbidden, so successful sequential same-key
   mutations use independent Envelopes through the atomic router; CAS/authority failures are
   typed whole-envelope reverts; **duplicates are idempotent no-ops at
   occurrence granularity (SR-15)** — re-admission of ACTIVE returns
   ALREADY_ADMITTED, re-withdrawal of a terminal occKey is a no-op success;
   WITHDRAWN/PRE_WITHDRAWN permanently block source admission: the internal
   fold reports terminal status and Admission reverts the sole external
   `E_NO_RESURRECTION(bytes32 envelopeId,uint16 leafIndex)` before effects or
   commit; revisions and AdmissionOrdinals strictly increase; an occurrence
   produces at most one head state ever (no-resurrection via the SR-10 overlay
   guard); withdrawal of a head tombstones, never reverts; `src(head)` is
   always ACTIVE.
3. **For the envelope/admission chapter:** kernel recognition of the three
   SR-11 Binding-class TypeSchemaIds; the SR-3 `expectedRevisions[]`
   `(leafIndex uint16, revision uint32)` carriage (required per selected
   BindingSet/Tombstone leaf; no entry for Withdrawal; implicit sender excluded
   for all three kernel-effect Types per SR-12); the SR-10 overlay guard
   consulted point-in-order before Binding logic;
   AdmissionOrdinal per accepted occurrence; full external pre-withdrawal
   evidence verification and retention (§4); current-envelope OCCREF rejection;
   `MAX_BIND_LEAVES_PER_ENVELOPE = 64` (SR-5) enforced at
   admission.
4. **For Lane 5 (indexes/counts):** same-transaction hooks
   `onBindingHeadChanged(bindingKey, newRevision, newState, cause,
   principalId, positionKey)` and `onOccurrenceWithdrawn(envelopeId,
   leafIndex, typeSchemaId, principalId)`; **the `KIND_BINDING_HIST`
   postings family + the reversible two-word admission log ARE the Binding
   history (one owner —
   the revision-keyed Entry mapping is dead)**; the withdrawal decrement
   fires exactly once per occurrence (overlay flip is one-way;
   pre-withdrawal fires no decrement); occurrence-level heads decrement on
   that flip, while `KIND_UNIQUE_BY_TYPE` decrements only when the affected
   Record's `KIND_BY_RECORD.liveCount` reaches zero.
5. **For the Lens/Plan chapter:** point resolution consumes `readHead` /
   `readHeadBatch` (1 cold SLOAD absent / 2 present — SR-8); the
   position-state outcome set is FOUND / NONE_EXPLICIT / NONE_WITHDRAWN /
   ABSENT / UNKNOWN(cause), all head-slot-0-readable; no `authorityBasis`
   on the head — authority evidence is reached via `admissionOrdinal` →
   reversible log → accepting AdmissionBatch → receipt's exact
   `AuthorityBasisWord` plus conditional `authorityCodehash` (SR-7/SR-8);
   this per-accepting-batch path is required because staged admissions of one
   Envelope may record different verifier bases/codehashes; on-chain in-Realm reads
   may treat a zero head word as proved ABSENT; off-chain readers must
   satisfy §6.2's four sources + FINAL-scope precondition; UNKNOWN never
   falls through a tier. Challenge-window re-check = one SLOAD on
   `revision`.
6. **For the read-model/client chapters:** history is append-only postings,
   state-readable, paginated with the shared SR-18b Completeness enum
   (UNKNOWN=0 fail-closed, COMPLETE=1, PARTIAL=2, UNSUPPORTED=3) and a
   revision cursor; WITHDRAWN is a grade on preserved evidence, never a
   deletion; no kernel collision state exists — equivocation display is
   client-side scanning of signed material, per owner ruling item F.

## Open items

1. **Kernel-pinned TypeSchemaId values** (`TYPE_BINDING_SET_V1`, etc.):
   mint in Stage B via the encoding chapter's constants table (SR-11 owns
   the closed list). The minting MUST honor this chapter's field-kind pins
   (§3.2: predecessor = OPTION(OCCREF) with explicit NONE;
   purpose/subject/fieldRole = BYTES_FIXED(32), never REF) — a GV-2 member
   registering the three kernel schemas and a GV-18 first-bind round-trip
   through STRUCT-EVM are owed to the vectors chapter.
2. ~~AdmissionIntent per-leaf carriage~~ — **CLOSED by SR-3**: the merged
   AdmissionIntent/1 carries `expectedRevisions[]` of `(leafIndex uint16,
   revision uint32)`, required per selected CAS-bearing `BindingSet/1` or
   `BindingTombstone/1` leaf and absent for `Withdrawal/1`; the fallback
   (revision in the portable body) is moot.
3. ~~`occLife` overlay vs. the admission lane's occurrence status word~~ —
   **CLOSED by SR-10**: one owner, the occKey-addressable status overlay
   (admission lane); this chapter's field names are aligned to it
   (status/ordinal/revokedAtOrdinal), and the overlay owns pre-admission
   status (PRE_WITHDRAWN).
4. **T6 (tombstone-over-tombstone) unbounded self-history**: allowed for
   guard uniformity; red team should attack whether self-paid postings
   growth at one key needs a bound or pricing note (Lane 5 / gas chapter).
   Point reads never scan it (THE LINE holds either way).
5. **Outcome-vocabulary alignment**: map FOUND / NONE_EXPLICIT /
   NONE_WITHDRAWN / ABSENT / UNKNOWN onto the read-model chapter's presence +
   authorization/freshness axes (the §10 grade axis from the survivors audit)
   so grades never compress to a Boolean — closed by the read-model chapter.
6. **Gas numbers**: §3.6 and §8 costs are arithmetic estimates
   [HYPOTHESIS]; the measurement harness must re-derive the per-leaf cost
   (now including Lane 5's mandatory fan-out — the draft's 90k figure is
   [REJECTED] as double-booked/under-booked), whether a maximal 64-leaf
   Binding envelope fits one transaction (SR-5: measured output, not claimed
   property), and the probe costs including the 1/8/32/64-Principal Plan
   walks over `readHeadBatch`.
7. **Challenge-window mechanics** (Δ selection, busy-position soundness per
   LR-3(ii)): explicitly UNFROZEN per the PM directive — a follow-on consumer-
   pattern note, not B0 kernel surface.
8. **Cross-Realm copied Binding evidence** (recognition of a source Realm's
   head as imported testimony): envelope/cross-realm chapter; this chapter
   only guarantees copied bytes never touch destination heads without
   destination admission.
