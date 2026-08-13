# B0 authorship: PublicationEnvelope, Occurrence, AdmissionIntent

**Stage A chapter — post-red-team revision; not landed, adopts nothing.**
Repairs applied per the revised SR pins in [[b0-overview]]: SR-1/SR-2 (ID
discipline regeneration, EIP-712 array-rule note, chain-free domain with the
Stage B wallet gate), SR-3 (merged AdmissionIntent/1 shape), SR-5
(measured-not-claimed one-tx property), SR-7 (AuthorityBasisWord), SR-9
(wrong-author withdrawal reverts; publishBatch scope note), SR-10
(occKey-addressable status overlay; T4 evidence mechanism; T6 covers
PRE_WITHDRAWN), SR-12 (admitAsSender Binding-class restriction), SR-13
(AccountPrincipal calldata channel + principal-binding equality), SR-15
(idempotent duplicate no-ops win set-wide).

Lane 2 of the Stage A design pass. This chapter makes the B0 "SPINE" arm exact for
axis 3 (portable authored Envelope + separate Realm-bound AdmissionIntent) and axis 5
(inline canonical Record leaves), and specifies the authority-witness seam the axis-2
uniform-PrincipalId arm crosses. Alternatives (Realm-bound envelope F3, RecordId
leaves F5, tagged author F2) get sketched interfaces only, marked as bakeoff arms.

Evidence base read for this chapter (all VERIFIED reads unless marked PLAUSIBLE):
`Designs/efsv2/core-architecture-candidate.md` (envelope/intent/occurrence sketch,
lines 134–187, 246–263), `Designs/efsv2/kel.md` §3 (lines 85–98), §8 (411–491),
§9 (493–513), `Designs/efsv2/identity.md` (lines 11, 16, 18),
`Designs/efsv2/codex-envelope.md` (lines 23, 28, 31),
`Designs/efsv2/owner-rulings.md` (2026-07-15 item F lines 51–54; 2026-08-12 lines
169–221), `Designs/efsv2/system-constitution.md` (§One transaction lines 149–163;
cross-Realm trace line 315), `Designs/efsv2/assumptions-and-requirements.md` rows
R-D1 (line 155), R-D2 (156), R-D6 (160), R-D7 (161), R-D8 (162), R-D9 (163), and the
intake audit `scratchpad/audit-lanes.json` CARRY-IN KEL lesson set (a)–(h) and
STANDARDS lane (EIP-712, EIP-7825, ERC-1271/6492/7702 findings).

---

## 0. Scope and dependencies

This chapter owns: the exact bytes and signing profiles of `PublicationEnvelope/1`
and `AdmissionIntent/1`; `OccurrenceRef` semantics and the per-occurrence admission
state machine; `Withdrawal/1`; subset carriage; replay/domain-confusion rules; the
relayer-substitution invariant; and the reserved authority-basis seam.

This chapter consumes (assumptions listed in §10 and flagged for the synthesizer):

- `recordIdOf(typeSchemaId, canonicalBody) → bytes32 RecordId` from the Type/Record
  chapter. Required properties: deterministic, collision-resistant, input includes
  the full canonical body, excludes every envelope field.
- `IAuthorityVerifier` from Lane 3 (Principal/authority). Assumed shape in §4.4.
- Admission-receipt persistence, `RealmRevisionId`, `AdmissionOrdinal` from the
  admission/realm chapter (V2-E5). This chapter defines what crosses the seam, not
  the receipt spine layout.
- `canonicalBody` is opaque bytes with declared properties (deterministic, bounded,
  structurally validatable) — owned by the encoding chapter.

Realm noun convention: one deployed Core contract IS one Realm. `realmId` appears in
signed intents (portable bytes must name their Realm); on-contract reads are
implicitly Realm-local and take no `realmId` argument.

---

## 1. ID family and domain constants used here

[PROPOSAL — per the shared Stage A skeleton; rationale: one uniform, printable,
versioned domain-separation discipline] Structural IDs in this chapter follow:

```text
id = keccak256( ascii(DOMAIN_TAG) ‖ abi.encode(field_1, …, field_n) )
```

where `DOMAIN_TAG` is a pinned printable ASCII constant that includes the layout
version, `abi.encode` is standard Solidity ABI encoding (every field widened to a
32-byte big-endian word — fixed-width, offset-free for the static field lists used
here), and `keccak256` is the EFS-native hash [PROPOSAL — EVM-native, cheapest].

Domain constants pinned by this chapter:

| Constant | Value (ASCII) | Used for |
|---|---|---|
| `DOMAIN_ENVELOPE` | `"efs2/envelope/1"` | EnvelopeId wrap (§2.3) |
| `DOMAIN_OCCURRENCE` | `"efs2/occurrence/1"` | `occKey` (§3.1) |
| EIP-712 domain name, envelope | `"EFS2-Envelope"` | envelope signing (§2.4) |
| EIP-712 domain name, intent | `"EFS2-AdmissionIntent"` | intent signing (§5.1) |
| EIP-712 version, both | `"1"` | |

Signable digests are always EIP-712 digests (`0x1901 ‖ …`); structural IDs are
always `keccak256(ascii-prefix ‖ …)`. The two byte spaces are disjoint by
construction: no structural ID begins with `0x1901`-prefixed hashing, and no signable
digest is ever used directly as a stored identifier without the §2.3 wrap.
[PROPOSAL — this is the family-level half of the domain-confusion defense, §8.]

---

## 2. PublicationEnvelope/1

### 2.1 Semantic fields, canonical order

[PROPOSAL — B0 axis-1/axis-5 arm: one immutable shared envelope carrying inline
canonical Record leaves; field set from the candidate sketch (core-architecture-
candidate.md lines 134–141) plus the kel §8.1 authority seam]

```text
PublicationEnvelope/1 (canonical semantic order):
  1. profile      uint16   — envelope profile; MUST be 1
  2. principalId  bytes32  — semantic author (full width, R-D2)
  3. authorityId  bytes32  — RESERVED; MUST be 0x00…00 in profile 1  (§6)
  4. authEpoch    uint64   — RESERVED; MUST be 0 in profile 1        (§6)
  5. pubNonce     bytes32  — author-controlled publication distinguisher (§2.6)
  6. notAfter     uint64   — unix seconds; 0 = no expiry; admission gate only
  7. recordIds[]  bytes32[] — ordered leaf commitments; length = count,
                              1 ≤ count ≤ MAX_ENVELOPE_LEAVES
  (unsigned carriage alongside: leaf bodies for carried leaves + witness)
```

Normative field rules:

- `recordIds[i] = recordIdOf(typeSchemaId_i, canonicalBody_i)` — the leaf commitment
  is the RecordId itself, never the raw body bytes. [PROPOSAL — this single choice
  is what makes subset carriage (§7) and body-independent EnvelopeId possible.]
- `leafIndex` of leaf i is its zero-based position in `recordIds`. `uint16` width
  gives profile headroom; profile 1 caps count at 64 (§2.5).
- Duplicate `recordIds` entries in one envelope are legal; they produce distinct
  Occurrences of one Record. [PROPOSAL — matches candidate lines 176–181; cheap,
  and forbidding them buys nothing.]
- There is deliberately NO author `order`/sequence field. [PROPOSAL — deviation
  from the July kel §8.1 envelope (`order uint64`, `prev bytes32`), argued: (i)
  R-D9 (register line 163) says author order is not nonce, uniqueness, or trusted
  chronology, and kel §8.1 itself demotes `prev` to an evidence hint because
  multiple actors share no consensus head; (ii) in B0 every per-slot ordering need
  is served by the Binding chapter's explicit predecessor/CAS chain, which is
  Realm-ordered and honest; a global per-author sequence would smuggle a
  chronology claim into portable evidence. Falsifier: if a fixture (Git push
  intake) needs author-side ordering that Binding CAS cannot express, this returns
  as a HYPOTHESIS revision.]
- `notAfter` gates admission only; an expired envelope remains verifiable portable
  evidence forever. [PROPOSAL — expiry as admissibility, not validity; evidence
  never stops verifying.]
- Envelopes with `count = 0` are structurally invalid (`E_EMPTY_ENVELOPE`).
  [PROPOSAL — an authored event must assert something.]

### 2.2 Wire encoding (transport)

[PROPOSAL] Only preimages and digests are frozen; transport is standard ABI
encoding of the following calldata structs. Rationale: the EVM already has one
canonical, tool-supported struct codec; inventing a packed transport buys nothing
at this layer (contrast: the Lens plan object, which contracts parse from raw
bytes — LR-1 carry-in — is a different tier).

```solidity
struct EnvelopeHeader {
    uint16  profile;      // = 1
    bytes32 principalId;
    bytes32 authorityId;  // 0 in profile 1
    uint64  authEpoch;    // 0 in profile 1
    bytes32 pubNonce;
    uint64  notAfter;     // 0 = none
}

struct LeafBody {
    bytes32 typeSchemaId;
    bytes   canonicalBody; // opaque to this chapter; bounded (§2.5)
}

struct EnvelopeWire {
    EnvelopeHeader header;
    bytes32[]      recordIds;            // FULL vector, length = count, always
    uint16[]       carriedLeafIndexes;   // strictly increasing, each < count
    LeafBody[]     bodies;               // parallel to carriedLeafIndexes
    bytes          witness;              // §4, ≤ MAX_WITNESS_BYTES
}
```

Validation (fail closed, R-D6, all errors named in §11):
`profile == 1`; `authorityId == 0 && authEpoch == 0` else `E_RESERVED_AUTHORITY`;
`1 ≤ recordIds.length ≤ MAX_ENVELOPE_LEAVES` else `E_LEAF_LIMIT`;
`carriedLeafIndexes` strictly increasing and in range else `E_LEAF_RANGE`;
for every carried leaf, `recordIdOf(bodies[j].typeSchemaId, bodies[j].canonicalBody)
== recordIds[carriedLeafIndexes[j]]` else `E_BODY_MISMATCH`;
`Σ bodies[j].canonicalBody.length ≤ MAX_ENVELOPE_BODY_BYTES` else `E_BODY_LIMIT`.

### 2.3 EnvelopeId

```text
eip712EnvelopeDigest = keccak256( 0x1901 ‖ DS_ENV ‖ structHash )        (§2.4)
EnvelopeId           = keccak256( ascii("efs2/envelope/1")
                                  ‖ abi.encode(eip712EnvelopeDigest) )
```

[PROPOSAL — single-source identity: the ID is a pure function of the signed digest,
so the signature always binds exactly the ID and no parallel identity can diverge.
Evidence: the July round independently converged on "single canonical envelope
identifier = the EIP-712 digest" (codex-envelope.md line 28, red-team verified);
B0 adds the ascii wrap for ID-family uniformity and so no stored identifier is
itself a signable digest. Cost: one extra keccak per envelope, once.]

Consequences (each [DERIVED INVARIANT] from the formula):

- EnvelopeId depends on header fields + the RecordId vector only — NOT on raw body
  bytes, the witness, the carrier, the submitting transaction, or the Realm.
  Moving a Record between envelopes changes nothing about its RecordId (candidate
  falsifier 3); re-signing the same fields yields the same EnvelopeId (same-bytes
  re-submission is idempotent, §3.2); a different witness for the same fields
  (e.g. a re-signed envelope after a wallet migration under the same key) yields
  the SAME EnvelopeId — witnesses never enter identity (kel §8.1 lesson: identity
  excludes actor/grant carriage).
- Rail independence (R-D8): no field encodes `msg.sender`, `tx.origin`, payer, or
  gas data; see §9.

### 2.4 Signing profile — EIP-712 under a chain-free constant domain

[standards FACT — EIP-712 is Final; domain fields are individually optional per the
spec. PLAUSIBLE at "Final": status re-verified by the Stage A standards audit
(audit-lanes.json STANDARDS lane), not re-read by this lane.]

```text
DS_ENV = keccak256( abi.encode(
           keccak256("EIP712Domain(string name,string version)"),
           keccak256("EFS2-Envelope"),
           keccak256("1") ) )

ENVELOPE_TYPEHASH = keccak256(
  "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityId,"
  "uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)" )

structHash = keccak256( abi.encode(
    ENVELOPE_TYPEHASH, profile, principalId, authorityId, authEpoch,
    pubNonce, notAfter,
    keccak256(abi.encodePacked(recordIds)) ) )   // EIP-712 array rule

eip712EnvelopeDigest = keccak256( 0x1901 ‖ DS_ENV ‖ structHash )
```

**The deliberate argument for the chain-free constant domain.** The default EIP-712
posture — `chainId` + `verifyingContract` in the domain — is the ecosystem's replay
defense and what every auditor expects. The July round chose a chain-free constant
domain (identity.md line 16; codex-envelope.md line 23, wallet-signability
red-team-confirmed against stock `eth_signTypedData_v4`), and under the greenfield
ruling that choice is evidence that must re-earn inclusion, not a baseline.
B0 re-adopts it, deliberately [PROPOSAL], because in the B0 axis-3 arm it is not a
convenience but a semantic statement:

1. The envelope asserts exactly one thing: *this Principal authored these Records
   as one publication event*. That claim is Realm-independent by design (axis 3
   arm A). Binding the signature to a chain would make the portable claim
   chain-qualified — the F3 (Realm-bound) arm — and would force re-signing to make
   the same assertion elsewhere, fracturing "identical bytes, identical evidence"
   (R-D1, R-D7).
2. Envelope replay across Realms is not an attack to *prevent* but a semantics to
   *neutralize*: a replayed envelope creates zero Realm effects because every
   Realm-local effect requires a Realm-bound AdmissionIntent (§5) authorized by
   the author (§5.4). The defense moved, it did not vanish — see the relocation
   table below.
3. One signature, every Realm: a curator can verify Sepolia-authored evidence on a
   fresh L3 with no signature ceremony re-run — the constitution's cross-Realm
   trace (system-constitution.md line 315).

Cost honestly stated: a harvested envelope signature is valid everywhere, forever
(minus `notAfter`). What it buys an attacker: nothing on-chain (§5.4 — admission
requires the author's Realm-bound intent), and off-chain only the disclosure of
content the author already signed for publication. Clients MUST present envelope
signing as a global, permanent authorship act, never as a Realm-scoped action
[PROPOSAL — client conformance rule, routed to the client lane].

**Replay-defense relocation table** (required by the standards audit: "a constant
domain moves all replay defense into the Envelope/AdmissionIntent nonce+realm
design" — audit-lanes.json STANDARDS/EIP-712):

| Defense normally provided by | Where it lives in B0 |
|---|---|
| `chainId` in domain | `AdmissionIntent` domain (§5.1) + `realmId` in intent message |
| `verifyingContract` in domain | `AdmissionIntent` domain (§5.1) |
| per-signature effect nonce | intent 2-D nonce (§5.2); envelope has NO effect nonce because it has no effects |
| signature expiry | envelope `notAfter` (admissibility only) + intent `notAfter` (TOCTOU bound) |
| same-struct cross-protocol replay | distinct EIP-712 domain names + distinct primary type strings (§8) |
| duplicate-submission replay | EnvelopeId idempotency + occurrence state machine (§3.2) |
| resurrection of withdrawn content | per-occurrence `WITHDRAWN` terminal state, incl. pre-withdrawal (§3.3) |
| equivocation (two conflicting envelopes) | deliberately NOT defended on-chain [OWNER RULING — owner-rulings.md 2026-07-15 item F, lines 51–54: no kernel collision bit, TOCTOU-defeated; contracts use closed author sets or challenge windows]. Challenge-window compatibility preserved; exact collision-state mechanics stay unfrozen per the PM directive. |

Bakeoff seam: cell F3 (Realm-bound envelope) = same struct with `realmId bytes32`
inserted after `principalId`, signed under the full domain of §5.1, and no separate
intent. Its comparison vectors are the §12 matrix; its rejection condition is the
BAKEOFF lane's: if F3 cannot keep copied signed evidence verifiable at a
destination, it is rejected regardless of gas (candidate lines 155–158).

### 2.5 Size bounds — named constants with EIP-7825 arithmetic

[standards FACT — EIP-7825 caps every transaction at 16,777,216 gas, live on L1
since Fusaka 2025-12-03; VERIFIED by the intake audit (CARRY-IN + STANDARDS lanes).
A Realm's descriptor states its own cap; the L1 figure is the conservative default
until the realm chapter says otherwise.]

Cost model used to size the constants. Schedule numbers are PLAUSIBLE (standard
post-Berlin/London gas schedule; EIP-7623 calldata floor since Pectra) and are
exactly what the Stage A measurement harness must replace with measured values:

```text
G_TX_CAP           = 16,777,216   [standards FACT, EIP-7825]
G_SSTORE_NEW       ≈ 22,100       (20,000 store + 2,100 cold access)   [PLAUSIBLE]
G_CALLDATA_NZ      ≈ 16 /byte     (execution-dominated txs)            [PLAUSIBLE]
c_byte  ≈ 22,100/32 + 16          ≈ 707 gas per stored body byte
c_vec   = 22,100                  per leaf (RecordId vector slot, §10 storage)
c_occ   ≤ 90,000                  per admitted occurrence: state word + receipt
                                  leaf + mandatory postings [HYPOTHESIS — budget
                                  handed to the index/admission chapters; falsified
                                  by harness measurement above 90k, which shrinks
                                  MAX_ENVELOPE_LEAVES rather than being absorbed
                                  silently (kickoff lines 106–107)]
G_FIXED ≈ 150,000                 sig verify + intent + header storage + dispatch
```

Named constants [PROPOSAL — values sized so the worst legal envelope admits fully
in ONE transaction under G_TX_CAP with margin]:

| Constant | Value | Governing arithmetic |
|---|---|---|
| `MAX_ENVELOPE_LEAVES` | 64 | matches `leafMask uint64` (§5.1); worst case below |
| `MAX_ENVELOPE_BODY_BYTES` | 8,192 | Σ carried canonical bodies per envelope |
| `MAX_LEAF_BODY_BYTES` | 8,192 | one leaf may use the whole body budget |
| `MAX_WITNESS_BYTES` | 4,096 | bounds ERC-1271 witness blobs |
| `MAX_ERC1271_VERIFY_GAS` | 200,000 | cap on the external `isValidSignature` call |
| `MAX_ENVELOPE_WIRE_BYTES` | 16,384 | header + 64×32 vector + bodies + witness, rounded |
| `G_ADMIT_BUDGET` | 15,000,000 | ≤ G_TX_CAP with ~10% margin |

Worst-case single-tx full admission (all 64 leaves, 8,192 body bytes):

```text
bodies   8,192 × 707    =  5,792,224
vector      64 × 22,100 =  1,414,400
occs        64 × 90,000 =  5,760,000
fixed                   ≈    150,000
TOTAL                   ≈ 13,116,624  ≤  G_ADMIT_BUDGET (15,000,000)  ≤  G_TX_CAP
```

Governing inequality, which any future constant revision must re-satisfy:

```text
c_byte·MAX_ENVELOPE_BODY_BYTES + (c_vec + c_occ)·MAX_ENVELOPE_LEAVES + G_FIXED
    ≤ G_ADMIT_BUDGET ≤ realm tx cap
```

Realms with caps below L1's do not shrink the protocol constants: envelope
constants are portable protocol law; per-tx feasibility is Realm physics; subset
admission (§7) is the relief valve — a 64-leaf envelope admits across several
transactions on a small-cap Realm, each batch atomic within its own call.
[PROPOSAL — keeps portable validity independent of any one Realm's gas profile.]

Bodies larger than `MAX_LEAF_BODY_BYTES` never enter envelopes: large content is
Locator/ByteDigest/closure territory (candidate lines 330–342); record bodies are
typed semantic content, not file bytes [DERIVED INVARIANT — constitution "Canonical
Records store only the bytes that define their typed semantic content"].

### 2.6 `pubNonce` semantics

[PROPOSAL] `pubNonce` is an author-controlled 256-bit value with exactly two
protocol semantics: (i) it distinguishes otherwise-identical publications — same
principal, same leaves — as distinct authored events (distinct EnvelopeIds, hence
distinct Occurrences); (ii) via EnvelopeId it feeds idempotency and
no-resurrection (§3). It is NOT a sequence, NOT uniqueness-enforced, NOT
chronology, and admission never orders by it [DERIVED INVARIANT — R-D9, register
line 163: author-side numbers are testimony, not trusted time; and OWNER RULING
item F: the chain does not police author equivocation]. Zero is a legal value;
clients SHOULD default to 32 random bytes (also the hook the privacy lane can use:
a high-entropy pubNonce denies dictionary attackers a fully-guessable envelope
preimage — see §7 caveat).

---

## 3. Occurrence

### 3.1 OccurrenceRef and occKey

```text
OccurrenceRef = (EnvelopeId bytes32, leafIndex uint16)      — 34 bytes, packed
occKey        = keccak256( ascii("efs2/occurrence/1")
                           ‖ abi.encode(envelopeId, uint256(leafIndex)) )
```

`occKey` is the single-word storage/index key for an occurrence [PROPOSAL — one
keccak flattens the pair for mappings; the pair form is the ABI/wire form].
Validity: `leafIndex < count` of the referenced envelope; a reference at or beyond
`count` is structurally invalid wherever it is checkable and `UNKNOWN`-graded where
the envelope header is unavailable [DERIVED INVARIANT — fail closed, R-D6; honest
UNKNOWN, constitution honest-reads clause].

Semantics [DERIVED INVARIANT — candidate lines 176–187]: an Occurrence is the
authored publication event "Principal P asserted Record R at position i of signed
envelope E". Ten curators endorsing one `GameRelease` Record share one RecordId and
hold ten OccurrenceRefs. The Occurrence exists as portable evidence the moment the
envelope is signed; every *status* of an occurrence (admitted, withdrawn, ordinal)
is a Realm-local overlay, never a property of the evidence itself. An occurrence
without a Realm admission receipt is exactly kel §9's PORTABLE-SIGNATURE-ONLY grade
[DERIVED INVARIANT — kel.md line 513]: authorship claim proven, admission/order/
currency proven nowhere.

Because OccurrenceRef contains EnvelopeId, a re-authorization (future managed
Principal re-signing under a new grant) that changes any *header value* would
change EnvelopeId and thus mint new Occurrences. §6 explains why the reserved
seam keeps re-authorization OUT of the header value space in profile 1, and the
consequence for profile 2 is stated there honestly.

### 3.2 Per-Realm occurrence admission state machine

State per `occKey` in one Realm: `UNSEEN (0) | ADMITTED (1) | WITHDRAWN (2)`.

| # | Transition | From → To | Guard | Effect |
|---|---|---|---|---|
| T1 | `ADMIT` | UNSEEN → ADMITTED | envelope + witness + intent valid (§5.3) | store occ state, receipt leaf, ordinal; run mandatory index postings |
| T2 | `DUP_ADMIT` | ADMITTED → ADMITTED | same occKey re-admitted | no-op; return existing receipt ref (idempotent — constitution line 152) |
| T3 | `WITHDRAW` | ADMITTED → WITHDRAWN | admitted `Withdrawal/1`, author match (§3.3) | mark withdrawn; history preserved |
| T4 | `PRE_WITHDRAW` | UNSEEN → WITHDRAWN | admitted `Withdrawal/1`, author match | mark withdrawn before target ever admitted |
| T5 | `DUP_WITHDRAW` | WITHDRAWN → WITHDRAWN | second withdrawal | no-op success |
| T6 | `ADMIT_AFTER_WITHDRAW` | WITHDRAWN → ✗ | admit attempt on withdrawn occKey | revert `E_WITHDRAWN` (no-resurrection) |

There are no other transitions; `WITHDRAWN` is terminal [PROPOSAL]. All transitions
inside one `admit()` call are atomic: any leaf failing any guard reverts the whole
call (one-transaction gate, constitution lines 149–152). T4 (pre-withdrawal) is
adopted from the July envelope evidence [PROPOSAL — codex-envelope.md line 31:
"admits before its target — pre-revocation is legal — load-bearing for cross-chain
revoke replay"; the surviving reason here: an author whose unsubmitted signed
envelope leaked can kill its admissibility in a Realm before the leak lands].

Rejected-attempt handling: a reverted admission leaves no state and returns a
typed error; there is no permanent "rejected" receipt in B0 [PROPOSAL — matches
candidate lines 205–208; a durable rejection spine is admission-chapter territory
if V2-E5 needs it].

### 3.3 Withdrawal/1

`Withdrawal/1` is an ordinary Record Type with a reserved, pinned TypeSchemaId —
not a special transaction kind [PROPOSAL — one write path; withdrawal evidence is
itself portable, authored, and admissible per-Realm]. Pinned schema (exact
TypeSchemaId value computed by the Type chapter's formula over this schema text —
open item O2):

```text
Withdrawal/1 body fields (canonical order):
  targetEnvelopeId  bytes32
  targetLeafIndex   uint16
Reference roles: target : OccurrenceRef (statically extractable)
Body codec: encoding-chapter canonical codec over the two fields; fixed length.
```

Semantics [DERIVED INVARIANT — candidate lines 227–231, restated exactly]:
a Withdrawal admitted in Realm V marks `(V, target)` WITHDRAWN, meaning "the
issuer no longer maintains this publication in V". It does NOT delete the Record
or its bodies, does NOT retract any other Principal's occurrence of the same
Record, does NOT rewind or free any Binding head (Binding-chapter interplay is
open item O5), and has NO effect in any Realm where it is not admitted.

Authority guard [PROPOSAL]: effective iff
`envelopePrincipal(withdrawal's own envelope) == envelopePrincipal(targetEnvelopeId)`
— full bytes32 comparison (R-D2). A withdrawal whose author differs from the
target's author admits as ordinary evidence (someone asserting they withdraw a
thing they don't own is still evidence of the assertion) but triggers NO state
transition [PROPOSAL — cheaper and more honest than reverting: reverting would let
anyone grief-block batches containing bogus withdrawals; label the admitted record
inert via the receipt's `authorizationResult`-style field, seam to the admission
chapter]. Red-team note: this admits-but-inert path must never be presentable as an
effective withdrawal — reads of occurrence state come only from the state machine,
never from scanning Withdrawal records [DERIVED INVARIANT — the
confirms-but-unreadable bug class; reads key on state, not on record existence].

---

## 4. Authorship witness formats

### 4.1 Witness wire form

```text
witness = witnessKind uint8 ‖ kind-specific bytes     (total ≤ MAX_WITNESS_BYTES)
```

| Kind | Value | Layout after the kind byte | Verification |
|---|---|---|---|
| `WK_KEY_RECOVERY` | `0x01` | `r bytes32 ‖ s bytes32 ‖ v uint8` (65 bytes; low-S required, `v ∈ {27,28}`) | `ecrecover(digest)` must yield the account bound in the Principal's authority reference |
| `WK_ERC1271_CALL` | `0x02` | `account address(20) ‖ sigData bytes` | `IERC1271(account).isValidSignature(digest, sigData)` == magic value, called with ≤ `MAX_ERC1271_VERIFY_GAS`, returndata read bounded to 32 bytes |
| reserved | `0x03–0x7F` | — | future suites (P-256/WebAuthn per EIP-7951, ERC-7913 keys, PQ) — Lane 3 space |
| invalid | `0x00`, `0x80–0xFF` | — | `E_BAD_WITNESS` (fail closed, R-D6) |

The three account shapes the task requires map as follows [PROPOSAL]:

- **EOA**: `WK_KEY_RECOVERY`. Malleability: non-low-S or bad `v` rejects
  (`E_BAD_WITNESS`) — one signature, one witness encoding [DERIVED INVARIANT —
  golden vectors require byte-stable witnesses].
- **7702-delegated EOA**: also `WK_KEY_RECOVERY` — the authority is the KEY, not
  the delegated code. There is deliberately no third witness kind: the verifier,
  not the witness, classifies the account's code state at admission and records it
  in `AuthorityBasis.codeState` (`0` empty / `1` 7702-designator / `2` contract).
  This is the candidate's versioned-verifier rule — never `hasCode ? 1271 :
  ecrecover` dispatch [DERIVED INVARIANT — candidate lines 246–250; STANDARDS-lane
  7702 vector: the same account before, under, and after delegation must classify
  under the basis recorded at each admission, never the current one].
- **Contract account (ERC-1271)**: `WK_ERC1271_CALL`. [standards FACT — ERC-1271
  Final.] Policy honestly argued: the July round ruled "No ERC-1271 anywhere,
  ever" (identity.md line 18 — chain-bound, state-dependent); under the greenfield
  ruling that ban is evidence. B0 re-admits 1271 at admission time ONLY, with the
  state-dependence neutralized by the receipt: the persisted `AuthorityBasis` pins
  `codehash`, verifier version, and the admission block/RealmRevision, so later
  account-code changes never reinterpret recorded authorship [DERIVED INVARIANT —
  kel §8.2 admission-time ruling + constitution authority-history clause; also the
  STANDARDS lane's stated re-earning price]. 1271 never appears on read/Lens paths
  (candidate falsifier 8). ERC-6492 counterfactual signatures are NOT an
  admission witness [POLICY — 6492 verification is simulation-based and flips when
  the account deploys; SDK pre-flight only. Cite: STANDARDS lane 6492 finding].

### 4.2 What the witness signs

The witness always signs `eip712EnvelopeDigest` (§2.4) — never the EnvelopeId,
never raw bodies, never a Realm value. One witness authorizes the whole envelope
(all leaves); per-leaf witnesses do not exist in profile 1 [PROPOSAL — matches
"one exact actor witness authorizes an envelope", R-D8 register line 162].

### 4.3 Admission-time validation, not read-time

[DERIVED INVARIANT — kel §3 line 93 and §8.2 lines 437–449: read-time-only
authorization lets a removed key backdate; a signature has no trusted creation
time] The witness is verified exactly once per Realm, at admission, by the
Realm's versioned verifier; the resulting `AuthorityBasis` is persisted with the
receipt; reads consume receipts and never re-run authority checks. For profile 1
(intrinsic account Principals, no rotation) this is cheap insurance; it becomes
load-bearing the moment managed Principals activate (§6) — which is exactly why
the discipline is fixed now rather than retrofitted (kel §3 line 94: the
"KEL-added-later-as-peer" failure).

### 4.4 Consumed verifier interface (Lane 3 seam)

Assumed shape — the synthesizer must reconcile against Lane 3's chapter:

```solidity
struct AuthorityBasis {
    uint16  verifierVersion;  // Realm's authority-verifier revision
    uint8   witnessKind;      // §4.1 value actually verified
    uint8   codeState;        // 0 empty / 1 7702-designator / 2 contract code
    bytes32 codehash;         // EXTCODEHASH at admission; 0x0 if empty
}

interface IAuthorityVerifier {
    /// MUST be pure w.r.t. everything except the account's own chain state;
    /// MUST take principalId at full bytes32 width (R-D2);
    /// MUST NOT read msg.sender/tx.origin (R-D8).
    function verify(bytes32 principalId, bytes32 digest, bytes calldata witness)
        external view returns (bool ok, AuthorityBasis memory basis);
}
```

Requirements this chapter imposes on Lane 3: the Principal's authority reference
resolves to exactly one account/key per witness kind; two Principals with
identical low-160-bit accounts remain distinct through `verify` (R-D2 vector);
verification gas is bounded by `MAX_ERC1271_VERIFY_GAS` for kind `0x02`.

---

## 5. AdmissionIntent/1

### 5.1 Layout and Realm-bound signing domain

```text
AdmissionIntent/1 (canonical semantic order):
  1. realmId     bytes32  — the target Realm (redundant with the domain's
                            verifyingContract; kept as defense-in-depth and as the
                            portable display value)
  2. action      uint8    — 0x01 = ADMIT; all other values reserved, reject
  3. envelopeId  bytes32
  4. leafMask    uint64   — bit i set ⇒ admit leaf i; bits ≥ count MUST be 0;
                            at least one bit set
  5. nonceKey    uint64   — §5.2
  6. nonceSeq    uint64   — §5.2
  7. notAfter    uint64   — unix seconds; 0 = none; bounds the sign-to-include
                            TOCTOU window
  (carriage alongside: intent witness, same §4.1 formats)
```

```text
DS_INT = keccak256( abi.encode(
           keccak256("EIP712Domain(string name,string version,uint256 chainId,"
                     "address verifyingContract)"),
           keccak256("EFS2-AdmissionIntent"),
           keccak256("1"),
           chainId,
           address(coreContract) ) )

INTENT_TYPEHASH = keccak256(
  "AdmissionIntent(bytes32 realmId,uint8 action,bytes32 envelopeId,"
  "uint64 leafMask,uint64 nonceKey,uint64 nonceSeq,uint64 notAfter)" )

eip712IntentDigest = keccak256( 0x1901 ‖ DS_INT ‖
    keccak256(abi.encode(INTENT_TYPEHASH, realmId, action, envelopeId,
                         leafMask, nonceKey, nonceSeq, notAfter)) )
```

[PROPOSAL — full Realm-bound domain: chainId + verifyingContract + realmId. The
intent is the deliberately non-portable half of axis 3: it authorizes local
effects in exactly one Realm and must be worthless everywhere else. The Realm
checks `realmId == its own RealmId` (`E_REALM_MISMATCH`) in addition to domain
verification, so even a hypothetical second deployment sharing an address across
chains — CREATE2 — still separates, and honest clients can DISPLAY the target
Realm from the signed bytes alone.]

`leafMask` at `uint64` is deliberately matched to `MAX_ENVELOPE_LEAVES = 64`; a
future profile raising the leaf cap must mint `AdmissionIntent/2` with a wider
selector (open item O4).

### 5.2 Intent nonces

[PROPOSAL — 2-D nonces, ERC-4337 precedent (4337 is SDK/rail-lane machinery, never
a Core dependency — STANDARDS lane scoping): per `(principalId, nonceKey)` lane the
Realm stores `lastSeq uint64`; require `nonceSeq == lastSeq + 1`. Distinct
`nonceKey` lanes admit concurrently; one lane serializes. Rationale: single
monotonic nonces serialize a Principal's relayed admissions; random-nonce spent
sets cost a permanent storage slot per intent. Storage: one slot per active lane.]

```solidity
mapping(bytes32 principalId => mapping(uint64 nonceKey => uint64 lastSeq)) intentNonces;
```

Replay within the Realm: impossible (seq consumed). Replay across Realms:
impossible (domain + realmId). Reordering within one lane: impossible (strict
increment); across lanes: author's explicit choice.

### 5.3 Admission algorithm (one call, atomic)

```text
admit(EnvelopeWire env, AdmissionIntent it, bytes intentWitness):
 1. validate env structurally (§2.2)                        — else revert
 2. envDigest ← §2.4; envelopeId ← §2.3
 3. require it.action == ADMIT, it.envelopeId == envelopeId,
         it.realmId == thisRealmId                          — E_REALM_MISMATCH
 4. require it.notAfter == 0 or block.timestamp ≤ it.notAfter — E_EXPIRED_INTENT
    require env.header.notAfter == 0 or block.timestamp ≤ env.header.notAfter
                                                            — E_EXPIRED_ENVELOPE
 5. require it.leafMask ≠ 0; bits ≥ count clear             — E_LEAF_RANGE
    require every set bit is in carriedLeafIndexes          — E_LEAF_RANGE
    (bodies must be carried for every leaf being admitted: inline-leaf arm)
 6. (okE, basisE) ← verifier.verify(env.header.principalId, envDigest, env.witness)
    require okE                                             — E_BAD_WITNESS
 7. (okI, basisI) ← verifier.verify(env.header.principalId, intentDigest,
                                    intentWitness)
    require okI                                             — E_NOT_AUTHOR (§5.4)
 8. consume nonce lane (§5.2)                               — E_NONCE
 9. if first admission touching envelopeId: persist header + FULL recordIds
    vector (state-readable, §10)
10. for each set bit i, ascending:
      occKey ← §3.1; dispatch state machine §3.2
      (T1 admit: store state + receipt leaf + ordinal; T2 duplicate: no-op;
       E_WITHDRAWN reverts ALL)
      if recordIds[i] not yet in the Record spine: store body (Record chapter)
      if typeSchemaId == WITHDRAWAL_TYPE_ID: apply §3.3 overlay
11. run mandatory index postings for every newly admitted occurrence
    [OWNER RULING — mandatory automatic indexing, no writer opt-out,
     owner-rulings.md 2026-07-15 lines 59–62 and 2026-08-12 lines 203–210]
12. emit one receipt reference; ANY failure above reverts EVERYTHING (steps 1–11
    are one EVM call frame — the one-transaction gate)
```

Idempotent retry: re-submitting an already-admitted (envelope, leafMask) pair
no-ops at every T2 and succeeds — but note it still consumes the intent's nonce
lane step; SDKs SHOULD reuse the same intent bytes on retry, which fails at step 8
after the first success and returns the duplicate-receipt read instead [PROPOSAL —
"retry = read on success" client rule; keeps on-chain retries from burning lanes].

### 5.4 Who may admit — author-only, and the implicit same-tx intent

[PROPOSAL — B0 rules that the intent witness must authenticate the ENVELOPE's own
`principalId` (step 7). Consequences and rationale:

- A harvested envelope signature grants no admission anywhere (§2.4 cost).
- No third party can force an author's publication INTO a Realm the author never
  chose — unauthorized carriage is a real griefing/privacy lever otherwise (an
  attacker paying to admit your envelope into a Realm you deliberately avoided).
- Third-party citation stays fully expressible the one-write-path way: publish
  YOUR OWN envelope with a Recognition/citation Record referencing the foreign
  OccurrenceRef. Destination admission of foreign evidence as *evidence-grade
  import* (kel §8.3's second lane; the EAS adapter) is exactly the V2-E8 adapter
  seam: an import enters as algorithm-tagged foreign evidence in the importer's
  OWN authored envelope, and never occupies the author's authoritative-admission
  state [DERIVED INVARIANT — kel §8.1 lines 433: "Evidence import MUST NOT occupy
  the authoritative-admission bit"; loss-map deferred to V2-E8 per the PM
  directive, seam specified here].

REJECTED for B0: open admission (anyone admits any valid envelope) — the griefing
lever above; revisit only if a fixture shows author-only admission blocks a real
workload (route to the F3 bakeoff notes).]

**Implicit same-tx intent.** When the transaction sender IS the Principal's bound
account, the explicit intent is redundant ceremony:

```solidity
function admitAsSender(EnvelopeWire calldata env, uint64 leafMask)
    external returns (bytes32 receiptId);
```

Guard: `msg.sender == account(env.header.principalId)` (Lane 3 resolution; works
for EOAs, 7702 EOAs, and contract accounts calling directly). Steps 3–8 of §5.3
are replaced by: realm = this contract by construction; expiry check on the
envelope only; no nonce (the account's own transaction nonce is the replay
defense); receipt records `intentKind = IMPLICIT_SENDER` instead of an intent
witness. R-D8 is not violated [DERIVED INVARIANT — argued precisely: authorship
still derives exclusively from the envelope witness (steps 1–2, 6); `msg.sender`
here supplies only the Realm-local admission CONSENT, and only when the sender IS
the very account whose consent step 7 would verify — it substitutes for the
intent signature, never for the authorship signature. Any rail can produce the
identical end state via the explicit-intent path (§9 vector).]

---

## 6. The reserved authority-basis seam (managed Principals)

[DERIVED INVARIANT — kel §8.1 (lines 415–432: the envelope must bind authority;
record identity excludes actor/grant carriage) + kel §3 (line 94: retrofitting a
KEL-aware lane later fails); the PM skeleton pins this lane to specify the exact
reserved encoding]

The reservation is physical, not rhetorical: `authorityId bytes32` and
`authEpoch uint64` sit in the signed struct and the EnvelopeId preimage TODAY, at
fixed positions 3 and 4 (§2.1), pinned to zero, with nonzero values rejected
(`E_RESERVED_AUTHORITY`, fail closed).

Activation path when a managed-Principal profile lands:

- `PublicationEnvelope/2` = the SAME layout, same field offsets, same
  `DOMAIN_ENVELOPE` tag, same EIP-712 type string, with `profile = 2` and nonzero
  `authorityId`/`authEpoch` permitted; the verifier gains grant/epoch validation
  (kel §8.2 steps 3–5). Because the fields already exist, activation changes the
  legal VALUE RANGE, not the layout, the hash formula, or any offset — EnvelopeId
  semantics (how an id is computed from fields) are untouched, which is the exact
  sense in which the task's requirement "without changing RecordId or EnvelopeId
  semantics" is met.
- `RecordId` is untouched by construction: no envelope field ever enters it.
- Receipts already persist `AuthorityBasis` (§4.3), so historical profile-1
  admissions keep their recorded bare-account basis forever; kel §8.1's rule
  "bare mode is exactly authorityId = 0, authEpoch = 0" maps onto profile 1
  verbatim, and its "once KEL activates, that branch is permanently disabled for
  future authoritative admission" becomes a Realm-policy line in the profile-2
  verifier [DERIVED INVARIANT — kel §8.1 line 435].

Honest consequence, stated for the red team: OccurrenceRef includes EnvelopeId, so
a profile-2 author re-signing the same leaves under a NEW grant (new
authorityId/authEpoch values) mints a new EnvelopeId and therefore new
Occurrences. kel's own answer was a logical `claimId` that excludes actor/grant
carriage. B0 deliberately has no logical-claim id — occurrence identity IS the
signed event [PROPOSAL — simpler algebra; re-authorization is a new authored
event, and continuity across it is Binding-chapter machinery (the head moves) plus
receipts]. If fixture work shows continuity-across-reauthorization must live in
the identity layer, that is a named falsifier of this proposal and routes to a
kel-style claimId variant in the bakeoff notes — not a silent patch.

`AuthorityBasis` (the name the shared skeleton reserves) is the § 4.4 struct; the
admission chapter persists it per receipt; nothing in this chapter caches
authority at read time [DERIVED INVARIANT — CARRY-IN (a): admission-time
validation + persisted authorization basis].

---

## 7. Subset carriage

**B0 SUPPORTS strict-subset carriage and strict-subset admission.** This falls out
of §2.1's leaf commitment: the signature commits `recordIds[]`, not bodies, so a
carrier presents `header + FULL recordIds vector + bodies for the subset` and any
verifier recomputes `structHash → digest → EnvelopeId` and checks the witness.
(The task's alternative — REJECTED-for-B0 and route to F5 — does not arise; inline
leaves with RecordId commitments already make subsets natural. Cell F5's
RecordId-LEAF arm differs in what the wire carries, not in subset math.)

What a verifier of a subset CAN conclude [each DERIVED INVARIANT of the formulas]:

1. Principal P (under the verified witness and, once admitted somewhere, a
   persisted basis) signed an envelope with EnvelopeId E containing exactly
   `count` leaves.
2. Leaf i of E commits RecordId R_i — for ALL i, revealed or not (the vector is
   always full).
3. Every revealed body hashes to its committed RecordId.
4. The positions (leafIndexes) of revealed leaves within E.

What a verifier CANNOT conclude:

5. The content of unrevealed leaves — only their RecordIds. **Privacy caveat
   [DERIVED INVARIANT — CARRY-IN dictionary-oracle checklist]: a RecordId of a
   low-entropy body is dictionary-guessable; subset carriage is therefore NOT a
   confidentiality mechanism. Confidential leaves need the privacy lane's
   salted/ciphertext body profiles; this chapter only guarantees it never
   ACCIDENTALLY reveals bodies.**
6. That the subset was intended to stand alone, or that the envelope carried
   nothing else relevant — the full vector prevents hiding the COUNT but not the
   MEANING of siblings.
7. Any application-level atomicity: an envelope is not an application
   transaction; co-publication semantics live in an explicit typed transaction
   Record [DERIVED INVARIANT — constitution lines 158–163].
8. Any admission, order, currency, or Realm status — absent a receipt this is
   PORTABLE-SIGNATURE-ONLY (§3.1).

Subset ADMISSION mechanics are §5.3 steps 5+10: `leafMask` selects; bodies must be
carried for selected leaves; unselected leaves stay UNSEEN and admissible later
(new intent, new nonce, same envelope — step 9's header/vector persistence makes
later admissions cheaper by `G_ENV_HEADER + c_vec·L`).

---

## 8. Replay and domain-confusion rules

The complete cross-signature confusion matrix. Family A = envelope digests
(§2.4); family B = intent digests (§5.1); family C = structural IDs (§1).

| Attack | Defense | Why it holds |
|---|---|---|
| Intent bytes presented as an envelope (or vice versa) at the wire | decoder profile/field-shape mismatch fails closed | but parsing is NOT the defense — the signature is: |
| Intent digest verified as envelope signature (or vice versa) | distinct `typeHash` (different primary type strings) AND distinct domain names ⇒ digests differ unless keccak collides | EIP-712: digest = keccak(0x1901 ‖ DS ‖ structHash); both DS and structHash differ by construction [standards FACT — EIP-712 encoding; PROPOSAL — the specific names] |
| Envelope replayed on another chain/Realm | no defense needed at the envelope tier (no effects); intent tier: DS_INT chainId + verifyingContract + realmId check | §2.4 argument; §5.1 |
| Intent replayed within its Realm | 2-D nonce consumed | §5.2 |
| Envelope re-submitted after withdrawal | occurrence T6 refusal | §3.2 |
| A signable digest stored or used as an ID, or an ID signed as a digest | IDs are ascii-prefixed keccak, digests are 0x1901-prefixed — disjoint byte spaces | §1 |
| EFS2 signature replayed into ANOTHER protocol's 712 flow (or foreign 712 into EFS2) | domain name "EFS2-…" + type strings are EFS2-specific; foreign verifiers hash different DS | standard 712 hygiene [standards FACT] |
| KEL/control events vs envelopes (future profile 2) | kel events sign purpose-tagged transcripts under their own domains (kel §5.5) — same discipline, disjoint tags | [DERIVED INVARIANT — kel line 295] |
| Same-(principal, slot) equivocation via two envelopes | NOT defended on-chain; no collision state added | [OWNER RULING — item F, owner-rulings.md lines 51–54]; challenge-window pattern remains available to consumers, collision-state mechanics unfrozen (PM directive) |

Golden-vector obligations from this table are §12 categories 3, 7, 8.

---

## 9. The rail-substitution invariant (R-D8)

[DERIVED INVARIANT — R-D8, assumptions-and-requirements.md line 162: authority
never derives from msg.sender, relayer, paymaster, wallet vendor, or submission
rail; one exact actor witness authorizes an envelope]

Why the LAYOUT guarantees it — an exhaustive input audit:

1. `EnvelopeId` inputs: §2.1 fields 1–7. None is sender/rail/payer-derived.
2. `OccurrenceRef` inputs: EnvelopeId + leafIndex. Same.
3. Authorship verification inputs: `(principalId, eip712EnvelopeDigest, witness)`.
   `IAuthorityVerifier.verify` is banned from reading `msg.sender`/`tx.origin`
   (§4.4 interface contract).
4. Intent verification inputs: `(principalId, eip712IntentDigest, intentWitness)`
   — the intent authenticates the AUTHOR, not the submitter, so a relayer
   carrying both signed blobs adds nothing and subtracts nothing.
5. Receipt identity/authorship fields: principalId, AuthorityBasis, envelopeId,
   occKey, ordinal. A Realm MAY log the submitting `msg.sender` as diagnostic
   event data, but it enters no ID preimage, no receipt identity, and no read
   path [PROPOSAL — diagnostics allowed, semantics forbidden].
6. The ONLY `msg.sender`-sensitive path is `admitAsSender` (§5.4), which replaces
   the intent SIGNATURE with the strictly stronger fact that the consenting
   account itself is acting — and which any rail can bypass via the explicit
   path with identical persisted results.

Substitution vector (binding for the harness): the same `(EnvelopeWire, intent,
intentWitness)` bytes submitted by (a) the author's own EOA, (b) an unrelated EOA
relayer, (c) a 4337 bundler with a paymaster, MUST yield byte-identical
EnvelopeId, occKeys, principalId, and AuthorityBasis. `AdmissionOrdinal` and block
basis MAY differ — they record WHEN a Realm accepted, which is venue-relative
existence evidence, never authorship (R-D9) — and since the first acceptance wins
and later ones no-op (T2), the persisted end state is identical whichever rail
lands first. A rail that can alter any authorship-bearing field is a broken
implementation, detectable by this vector.

---

## 10. Storage layout and external ABI (Realm-local)

Storage owned by this chapter (admission-receipt spine and Record-body spine are
sibling chapters; slot packing shown explicitly):

```solidity
// ---- envelope spine (written once, first admission touching the envelope) ----
mapping(bytes32 envelopeId => bytes32) envelopePrincipal;   // full width
mapping(bytes32 envelopeId => bytes32) envelopeAuthorityId; // 0 until profile 2
mapping(bytes32 envelopeId => bytes32) envelopePubNonce;
mapping(bytes32 envelopeId => uint256) envelopeMeta;
//   bits   0–15  profile
//   bits  16–31  count
//   bits  32–95  authEpoch
//   bits  96–159 notAfter
//   bit   160    headerStored flag
//   bits 161–255 zero (reserved)
mapping(bytes32 envelopeId => bytes32[]) envelopeRecordIds; // length = count

// ---- occurrence overlay (this contract IS the realm) ----
mapping(bytes32 occKey => uint256) occState;
//   bits  0–7    status: 0 UNSEEN / 1 ADMITTED / 2 WITHDRAWN
//   bits  8–71   admissionOrdinal (uint64; admission chapter assigns)
//   bits 72–255  receipt reference (admission-chapter seam; zero-padded)

// ---- intent nonces ----
mapping(bytes32 principalId => mapping(uint64 nonceKey => uint64)) intentNonces;
```

State-readability [DERIVED INVARIANT — constitution reconstruction clause;
R-D3]: header + full RecordId vector persist on first admission so a second
implementation can re-verify authorship of every admitted occurrence from state
alone — no logs, no EFS-operated service (EIP-4444-proof by construction).

External ABI (Solidity signatures other chapters and the SDK compile against):

```solidity
struct AdmissionIntentArg {           // mirrors §5.1 fields 1–7
    bytes32 realmId; uint8 action; bytes32 envelopeId; uint64 leafMask;
    uint64 nonceKey; uint64 nonceSeq; uint64 notAfter;
}

function admit(EnvelopeWire calldata env, AdmissionIntentArg calldata intent,
               bytes calldata intentWitness) external returns (bytes32 receiptRef);

function admitAsSender(EnvelopeWire calldata env, uint64 leafMask)
    external returns (bytes32 receiptRef);

function occKeyOf(bytes32 envelopeId, uint16 leafIndex)
    external pure returns (bytes32);

function occurrenceStateOf(bytes32 occKey)
    external view returns (uint8 status, uint64 admissionOrdinal, bytes32 receiptRef);

function envelopeHeaderOf(bytes32 envelopeId) external view
    returns (bool known, uint16 profile, bytes32 principalId, bytes32 authorityId,
             uint64 authEpoch, bytes32 pubNonce, uint64 notAfter, uint16 count);

function envelopeRecordIdsOf(bytes32 envelopeId, uint16 start, uint16 limit)
    external view returns (bytes32[] memory page, uint16 total);
```

All reads are point reads or hard-bounded pages; `known = false` is honest
UNSEEN-at-this-Realm, never a claim about other Realms [DERIVED INVARIANT —
constitution honest-reads clause].

Named error selectors: `E_PROFILE, E_RESERVED_AUTHORITY, E_EMPTY_ENVELOPE,
E_LEAF_LIMIT, E_LEAF_RANGE, E_BODY_LIMIT, E_BODY_MISMATCH, E_BAD_WITNESS,
E_NOT_AUTHOR, E_REALM_MISMATCH, E_NONCE, E_EXPIRED_ENVELOPE, E_EXPIRED_INTENT,
E_WITHDRAWN`.

## 11. Constants table (consolidated)

| Constant | Value | Set by |
|---|---|---|
| `MAX_ENVELOPE_LEAVES` | 64 | §2.5 arithmetic; harness may shrink, never silently |
| `MAX_ENVELOPE_BODY_BYTES` | 8,192 | §2.5 |
| `MAX_LEAF_BODY_BYTES` | 8,192 | §2.5 |
| `MAX_WITNESS_BYTES` | 4,096 | §2.5 |
| `MAX_ENVELOPE_WIRE_BYTES` | 16,384 | §2.5 |
| `MAX_ERC1271_VERIFY_GAS` | 200,000 | §4.1 |
| `G_ADMIT_BUDGET` | 15,000,000 | §2.5; ≤ Realm tx cap (L1: 16,777,216, EIP-7825) |
| `c_occ` budget | ≤ 90,000 gas | HYPOTHESIS; measurement closes it |
| `WITHDRAWAL_TYPE_ID` | TBD — Type-chapter formula over the §3.3 pinned schema | open item O2 |

## 12. Golden-vector categories owned by this chapter

1. Envelope digest/EnvelopeId vectors, including stock `eth_signTypedData_v4`
   reproduction of the chain-free domain (re-run against current wallets — the
   July confirmation is 2026-07 evidence, open item O6).
2. Intent digest vectors under two different chainIds/addresses.
3. Cross-family confusion vectors (§8 matrix rows, each as a MUST-FAIL).
4. Subset carriage: full-vector + partial bodies verify; truncated vector,
   reordered vector, wrong-position body each MUST-FAIL.
5. Rail substitution (§9): three rails, byte-identical persisted authorship.
6. Witness vectors: low-S malleability rejection; 1271 gas-bomb and
   returndata-bomb bounded; 7702 account before/under/after delegation classified
   per-admission; ERC-6492 wrapper rejected.
7. Nonce/expiry vectors: lane replay, cross-lane concurrency, expired envelope
   vs expired intent.
8. Occurrence state machine: T1–T6 including pre-withdrawal, no-resurrection,
   cross-principal withdrawal inert, duplicate admit idempotency.
9. Two Principals with identical low-160-bit accounts distinct end-to-end (R-D2).
10. Bounds: 65 leaves, count = 0, oversize body, oversize witness, leafMask bit ≥
    count — each MUST-FAIL with its named error.

---

## Interfaces exposed

Compact contract other chapters may rely on:

- **Types**: `PublicationEnvelope/1` (§2.1 field list; EIP-712 type string §2.4);
  `AdmissionIntent/1` (§5.1); `OccurrenceRef = (EnvelopeId bytes32, leafIndex
  uint16)`; `occKey = keccak256("efs2/occurrence/1" ‖ abi.encode(envelopeId,
  uint256(leafIndex)))`; `EnvelopeId = keccak256("efs2/envelope/1" ‖
  abi.encode(eip712EnvelopeDigest))`; witness kinds `0x01 WK_KEY_RECOVERY`,
  `0x02 WK_ERC1271_CALL`; `AuthorityBasis {verifierVersion u16, witnessKind u8,
  codeState u8, codehash b32}`; constants table §11.
- **Guarantees**: EnvelopeId/RecordId/OccurrenceRef exclude witness, submitter,
  rail, payer, and Realm; authorityId/authEpoch are physically reserved (zero,
  fail-closed) so managed Principals activate without layout or formula change;
  subset carriage always ships the full RecordId vector; occurrence states are
  exactly UNSEEN/ADMITTED/WITHDRAWN with T1–T6 and atomic multi-leaf admission;
  withdrawal is author-only, Realm-local, non-deleting, non-resurrecting,
  pre-withdrawal legal; admission is author-consented (no third-party admission);
  authority is verified at admission and persisted, never re-derived at read.
- **ABI**: §10 function signatures.
- **Consumed (dependsOn)**: `recordIdOf` (Type/Record chapter);
  `IAuthorityVerifier` + principal→account resolution (Lane 3); receipt spine,
  `AdmissionOrdinal`, `RealmRevisionId`, Realm gas-cap descriptor (admission/realm
  chapter, V2-E5); canonicalBody codec + Withdrawal/1 static extraction (encoding
  chapter); Binding-head interplay with WITHDRAWN predecessors (Binding chapter);
  mandatory posting cost fitting the `c_occ ≤ 90k` budget (index chapter).

## Open items

- **O1 — measured constants.** `c_occ`, `c_leaf`-class costs, and `G_FIXED` are
  HYPOTHESES; the measurement harness closes them. If measurement breaks the §2.5
  inequality, `MAX_ENVELOPE_LEAVES` shrinks and the tradeoff returns to James
  (kickoff rule), never silently.
- **O2 — `WITHDRAWAL_TYPE_ID` value.** Type chapter computes it over the §3.3
  pinned schema; this chapter freezes the schema text, not the number.
- **O3 — author-only admission vs fixtures.** Confirm no acceptance trace
  (cross-Realm copy, EAS import, Git intake) needs third-party authoritative
  admission; the Recognition-record pattern plus the V2-E8 evidence-import seam is
  the claimed answer. Closed by the fixture lane running the cross-Realm trace.
- **O4 — leaf-cap headroom.** Raising `MAX_ENVELOPE_LEAVES` past 64 requires
  `AdmissionIntent/2` (wider selector). Decide at first real demand; costless now.
- **O5 — Binding interplay.** What a WITHDRAWN predecessor occurrence means for a
  live Binding head (freed? frozen? unaffected?) — Binding chapter closes;
  equivocation/collision-state mechanics stay unfrozen there per the PM directive.
- **O6 — wallet re-verification.** Re-run chain-free-domain signability against
  current major wallets (July evidence aging); vector category 1.
- **O7 — re-authorization continuity.** B0 has no logical claimId; if fixtures
  show identity-layer continuity across managed-Principal re-signing is required,
  the kel-style claimId variant enters the bakeoff (named falsifier in §6).
  Closed by Stage B fixture evidence + synthesizer.
- **O8 — subset-carriage dictionary oracle.** Privacy lane must rule how salted/
  private body profiles compose with RecordId-visible subset carriage (§7.5).
- **O9 — durable rejected-attempt receipts.** B0 leaves rejected admissions
  stateless; admission chapter (V2-E5) decides if a rejection spine is needed.
