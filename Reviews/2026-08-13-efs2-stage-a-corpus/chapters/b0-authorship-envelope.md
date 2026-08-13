# B0 authorship: PublicationEnvelope, Occurrence, AdmissionIntent

**Stage A chapter — post-red-team revision; not landed, adopts nothing.**
Repairs applied per the revised SR pins in [[b0-overview]]: SR-1/SR-2 (ID
discipline regeneration, EIP-712 array-rule note, chain-free domain with the
Stage B wallet gate), SR-3 (merged AdmissionIntent/1 shape), SR-5
(measured-not-claimed one-tx property), SR-7 (AuthorityBasisWord), SR-9
(wrong-author withdrawal reverts; publishBatch scope note), SR-10
(occKey-addressable status overlay; T4 evidence mechanism; T6 covers
PRE_WITHDRAWN), SR-12 (implicit-sender Binding-class restriction), SR-13
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

This chapter consumes (assumptions listed in §11 and flagged for the synthesizer):

- `recordIdOf(typeSchemaId, canonicalBody) → bytes32 RecordId` from the Type/Record
  chapter. Required properties: deterministic, collision-resistant, input includes
  the full canonical body, excludes every envelope field.
- `AccountPrincipal`, `PrincipalId`, `AuthorityVerifierV1`, `VerifyContext`, and
  `AuthorityBasisWord` from [[b0-principal-authority]]. Their exact interface is consumed in
  §4.4 and is not redefined here.
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

[PROPOSAL — SR-1; rationale: one uniform, printable, versioned domain-separation
discipline] Structural IDs in this chapter follow the set-wide two-level rule:

```text
DOM_X    = keccak256("efs2/<name>/<version>")
preimage = abi.encode(DOM_X, field_1, …, field_n)
id       = keccak256(preimage)
```

The printable string is hashed once into the domain word before entering an ID
preimage. Every outer field is a fixed-width 32-byte ABI word; variable-length or
structured values enter only through one `keccak256` commitment. `keccak256` is the
EFS-native hash [PROPOSAL — EVM-native, cheapest].

Domain constants pinned by this chapter:

| Constant | Value | Used for |
|---|---|---|
| `DOM_ENVELOPE` | `keccak256("efs2/envelope/1")` | EnvelopeId wrap (§2.3) |
| `DOM_OCCURRENCE` | `keccak256("efs2/occurrence/1")` | `occKey` (§3.1) |
| `DOM_INTENT` | `keccak256("efs2/admission-intent/1")` | IntentId wrap (§5.1) |
| EIP-712 domain name, envelope | `"EFS2-Envelope"` | envelope signing (§2.4) |
| EIP-712 domain name, intent | `"EFS2-AdmissionIntent"` | intent signing (§5.1) |
| EIP-712 version, both | `"1"` | |

Signable digests are always the hash of an EIP-712 transcript exactly
`0x1901 ‖ DS ‖ structHash` (66 bytes). Structural ID preimages are `abi.encode`
sequences of 32-byte words (`32*k` bytes). Those preimage shapes are distinct; under
the explicit collision-resistance assumption, a signable transcript cannot be
confused with an ID preimage. A stored 32-byte hash output carries no visible prefix,
so callers must still use the typed interfaces below rather than infer a family from
hash bytes. No signable digest is stored directly as an identifier without its SR-1
wrap. [PROPOSAL — the family-level half of the domain-confusion defense, §8.]

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
  3. authorityRef bytes32  — RESERVED; MUST be 0x00…00 in profile 1  (§6)
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
    bytes32 authorityRef; // 0 in profile 1
    uint64  authEpoch;    // 0 in profile 1
    bytes32 pubNonce;
    uint64  notAfter;     // 0 = none
}

struct LeafBody {
    bytes32 typeSchemaId;
    bytes   canonicalBody; // opaque to this chapter; bounded (§2.5)
}

struct TargetEnvelopeEvidence {          // unsigned carriage for §3.3 T4 only
    uint16         withdrawalLeafIndex;  // selected Withdrawal leaf this proves
    EnvelopeHeader header;
    bytes32[]      recordIds;            // FULL committed vector; no bodies
    AccountPrincipal targetPrincipal;
    bytes          witness;
}

struct EnvelopeWire {
    EnvelopeHeader header;
    bytes32[]      recordIds;            // FULL vector, length = count, always
    uint16[]       carriedLeafIndexes;   // strictly increasing, each < count
    LeafBody[]     bodies;               // parallel to carriedLeafIndexes
    bytes          witness;              // §4, ≤ MAX_WITNESS_BYTES
    TargetEnvelopeEvidence[] targetEvidence;
}
```

Validation (fail closed, R-D6, all errors named in §11):
`envelopeBytes.length ≤ MAX_ENVELOPE_WIRE_BYTES` else `E_WIRE_LIMIT` — this
counts the entire ABI carriage, including every target-evidence header, vector,
typed descriptor, and witness;
`profile == 1`; `authorityRef == 0 && authEpoch == 0` else `E_RESERVED_AUTHORITY`;
`1 ≤ recordIds.length ≤ MAX_ENVELOPE_LEAVES` else `E_LEAF_LIMIT`;
`carriedLeafIndexes` strictly increasing and in range else `E_LEAF_RANGE`;
for every carried leaf, `recordIdOf(bodies[j].typeSchemaId, bodies[j].canonicalBody)
== recordIds[carriedLeafIndexes[j]]` else `E_BODY_MISMATCH`;
`Σ bodies[j].canonicalBody.length ≤ MAX_ENVELOPE_BODY_BYTES` else `E_BODY_LIMIT`;
`targetEvidence.length ≤ MAX_ENVELOPE_LEAVES`; every evidence vector has
`1 ≤ recordIds.length ≤ MAX_ENVELOPE_LEAVES`, every evidence witness is
`≤ MAX_WITNESS_BYTES`, and
`Σ abi.encode(targetEvidence[j]).length ≤ MAX_ENVELOPE_BODY_BYTES`, else
`E_TARGET_EVIDENCE`. These reuse the existing 64-leaf and 8,192-byte Stage B
hypotheses; target evidence creates no unbounded secondary carriage surface.

After `leafMask` and current occurrence states are known, `targetEvidence` MUST be
in strictly increasing `withdrawalLeafIndex` order and bind one-to-one to exactly
the selected pre-withdrawal-class Withdrawal leaves whose targets lack a persisted
envelope header (`NEVER_ADMITTED`, or `PRE_WITHDRAWN` for an idempotent repeat).
Missing, extra, duplicate, unselected-leaf, non-Withdrawal, or evidence for a
target with an already-persisted header reverts `E_TARGET_EVIDENCE`. Each item is
then structurally validated, recomputes
its SR-2 EnvelopeId, binds its typed `targetPrincipal` to its declared header id
before witness verification under §4.4, carries the full committed vector and no
bodies, and is consumed only by its named selected Withdrawal.

### 2.3 EnvelopeId

```text
DOM_ENVELOPE          = keccak256("efs2/envelope/1")
eip712EnvelopeDigest = keccak256( 0x1901 ‖ DS_ENV ‖ structHash )        (§2.4)
EnvelopeId           = keccak256(abi.encode(DOM_ENVELOPE,
                                            eip712EnvelopeDigest))
```

[PROPOSAL — single-source identity: the ID is a pure function of the signed digest,
so the signature always binds exactly the ID and no parallel identity can diverge.
Evidence: the July round independently converged on "single canonical envelope
identifier = the EIP-712 digest" (codex-envelope.md line 28, red-team verified);
B0 adds the SR-1 domain-word wrap for ID-family uniformity and so no stored
identifier is itself a signable digest. Cost: one extra keccak per envelope, once.]

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
  "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)" )

structHash = keccak256( abi.encode(
    ENVELOPE_TYPEHASH, profile, principalId, authorityRef, authEpoch,
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

Cost model used to form the Stage B hypotheses. Schedule numbers are PLAUSIBLE
(standard post-Berlin/London gas schedule; EIP-7623 calldata floor since Pectra)
and are exactly what the Stage B measurement harness must replace with measured
values:

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

The four SR-5 size constants below are [HYPOTHESIS], not protocol claims. Stage B
re-derives them against each qualifying Realm's gas cap and mandatory index fan-out:

| Constant | Value | Governing arithmetic |
|---|---|---|
| `MAX_ENVELOPE_LEAVES` | 64 | structural cap; matches `leafMask uint64` (§5.1) |
| `MAX_ENVELOPE_BODY_BYTES` | 8,192 | Σ carried canonical bodies per envelope |
| `MAX_BODY_BYTES` | 8,192 | one leaf may use the whole envelope body budget |
| `MAX_BIND_LEAVES_PER_ENVELOPE` | 64 | Binding-class leaf structural cap |
| `MAX_WITNESS_BYTES` | 4,096 | bounds ERC-1271 witness blobs |
| `MAX_ERC1271_VERIFY_GAS` | 200,000 | cap on the external `isValidSignature` call |
| `MAX_ENVELOPE_WIRE_BYTES` | 16,384 | entire EnvelopeWire, including bounded target evidence |
| `G_ADMIT_BUDGET` | 15,000,000 | ≤ G_TX_CAP with ~10% margin |

Schedule-derived illustration for the candidate values (not a claim that a maximal
legal envelope fits one transaction):

```text
bodies   8,192 × 707    =  5,792,224
vector      64 × 22,100 =  1,414,400
occs        64 × 90,000 =  5,760,000
fixed                   ≈    150,000
ILLUSTRATIVE TOTAL      ≈ 13,116,624
```

Shared governing inequality, which Stage B evaluates with measured `c_occ`, body,
and mandatory-index terms for each Realm profile:

```text
c_byte·MAX_ENVELOPE_BODY_BYTES + (c_vec + c_occ)·MAX_ENVELOPE_LEAVES + G_FIXED
    ≤ G_ADMIT_BUDGET ≤ realm tx cap
```

Whether a maximal envelope admits in one transaction is measured output. Subset
admission (§7) remains the relief valve, but it does not prove that the candidate
constants are safe. If measurement lowers the safe cap, the constant shrinks and
the change returns to James; the chapter does not silently absorb the mismatch.

Bodies larger than `MAX_BODY_BYTES` never enter envelopes: large content is
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
DOM_OCCURRENCE = keccak256("efs2/occurrence/1")
OccurrenceKey = keccak256(abi.encode(DOM_OCCURRENCE,
                                     envelopeId,
                                     uint256(leafIndex)))
```

`OccurrenceKey` (shortened to `occKey` in pseudocode) is the single-word
storage/index key for an occurrence [PROPOSAL — one
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

State per `occKey` in one Realm is the SR-10 four-state overlay:
`NEVER_ADMITTED (0) | ACTIVE (1) | WITHDRAWN (2) | PRE_WITHDRAWN (3)`.

| # | Transition | From → To | Guard | Effect |
|---|---|---|---|---|
| T1 | `ADMIT` | NEVER_ADMITTED → ACTIVE | envelope + witness + consent valid (§5.3) | assign the next ordinal; store status + receipt; run mandatory postings |
| T2 | `DUP_ADMIT` | ACTIVE → ACTIVE | same occKey re-admitted | `ALREADY_ADMITTED`; return existing receipt; no write |
| T3 | `WITHDRAW` | ACTIVE → WITHDRAWN | admitted `Withdrawal/1`, author match (§3.3) | one-way status flip; set `revokedAtOrdinal`; decrement indexes exactly once |
| T4 | `PRE_WITHDRAW` | NEVER_ADMITTED → PRE_WITHDRAWN | authenticated target-envelope evidence + author match (§3.3) | block target before its first admission |
| T5 | `DUP_WITHDRAW` | WITHDRAWN → WITHDRAWN | second withdrawal | no-op success |
| T5b | `DUP_PRE_WITHDRAW` | PRE_WITHDRAWN → PRE_WITHDRAWN | second withdrawal | no-op success |
| T6 | `ADMIT_AFTER_WITHDRAW` | WITHDRAWN/PRE_WITHDRAWN → ✗ | admit attempt on terminal occKey | revert `E_NO_RESURRECTION` |

There are no other transitions; `WITHDRAWN` and `PRE_WITHDRAWN` are terminal
[PROPOSAL]. Ordinals are assigned only to actually accepted occurrences, in
selected-leaf submission order. No ordinal is derived arithmetically from an
envelope or leaf index. All transitions inside one `publish()` call are atomic:
any non-idempotent leaf failing a guard reverts the whole call (one-transaction
gate, constitution lines 149–152). T4 (pre-withdrawal) is adopted from the July envelope evidence
[PROPOSAL — codex-envelope.md line 31:
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
`withdrawalEnvelope.header.principalId == targetEnvelope.header.principalId` —
full bytes32 comparison (R-D2). When the target is already known, its persisted
header supplies the target Principal. When the target is `NEVER_ADMITTED`, the
caller MUST carry `TargetEnvelopeEvidence`: the target's signed header fields, the
full ordered `recordIds[]` vector, typed `targetPrincipal`, and its witness, but no
bodies. The evidence item is already one-to-one bound to this selected Withdrawal
leaf by §2.2. Admission recomputes `evidenceEnvelopeId` from the evidence header
and full vector and MUST require, in this order:

```text
evidenceEnvelopeId == withdrawal.targetEnvelopeId
withdrawal.targetLeafIndex < targetEvidence.recordIds.length
computePrincipalId(targetEvidence.targetPrincipal) ==
    targetEvidence.header.principalId
verify(targetEvidence.targetPrincipal, targetEnvelopeDigest,
       targetEvidence.witness, verifyContext)
targetEvidence.header.principalId == withdrawalEnvelope.header.principalId
```

The EnvelopeId equality and target-index range guard therefore run before author
comparison or any `PRE_WITHDRAWN` write. An ID mismatch, out-of-range target,
missing/extra/duplicate evidence, or invalid target witness reverts
`E_TARGET_EVIDENCE`; author mismatch reverts `ErrWithdrawNotAuthor`; only complete
equality permits `PRE_WITHDRAWN`. A bare `targetEnvelopeId` can never cause
pre-withdrawal.

A wrong-author Withdrawal reverts the whole envelope with
`ErrWithdrawNotAuthor`; it is not admitted as inert evidence [PROPOSAL — SR-9].
Within one envelope this punishes only the mistaken author because every leaf shares
one authenticated Principal. An opt-in all-or-nothing `publishBatch` still aborts if
any element fails; aggregators must pre-validate elements, as they already do for
expired intents and CAS failures. The occurrence overlay, never a scan of Withdrawal
Records, remains the only source of effective status.

---

## 4. Authorship witness formats

### 4.1 Witness wire form

```text
witness = witnessProfile uint8 ‖ profile-specific bytes
          (total ≤ MAX_WITNESS_BYTES)
```

The closed `WitnessProfile/1` table and profile-to-`authorityKind` compatibility
rules are owned by [[b0-principal-authority]] §3.3. This chapter carries those
bytes without defining a peer vocabulary. In verifier v1 the active profiles are
`WP_SECP256K1_RAW65`, `WP_ERC1271_CALL`, `WP_P256_RAW64`, and
`WP_RSA_PKCS1_SHA256`; `WP_P256_WEBAUTHN` is reserved for verifier v2. The
principal chapter also owns low-S checks, ERC-1271 gas/returndata bounds, EIP-7702
delegate observation, and rejection of ERC-6492 as an admission witness.

### 4.2 What the witness signs

The witness always signs `eip712EnvelopeDigest` (§2.4) — never the EnvelopeId,
never raw bodies, never a Realm value. One witness authorizes the whole envelope
(all leaves); per-leaf witnesses do not exist in profile 1 [PROPOSAL — matches
"one exact actor witness authorizes an envelope", R-D8 register line 162].

### 4.3 Admission-time validation, not read-time

[DERIVED INVARIANT — kel §3 line 93 and §8.2 lines 437–449: read-time-only
authorization lets a removed key backdate; a signature has no trusted creation
time] The witness is verified exactly once per Realm, at admission, by the
Realm's versioned verifier; the resulting `AuthorityBasisWord` and conditional
contract-account codehash are persisted with the receipt; reads consume receipts
and never re-run authority checks. For profile 1
(intrinsic account Principals, no rotation) this is cheap insurance; it becomes
load-bearing the moment managed Principals activate (§6) — which is exactly why
the discipline is fixed now rather than retrofitted (kel §3 line 94: the
"KEL-added-later-as-peer" failure).

### 4.4 Consumed verifier interface (Lane 3 seam)

Consumed verbatim from [[b0-principal-authority]] §3.2:

```solidity
type AuthorityBasisWord is bytes32;

struct VerifyContext {
    bytes32 selfChainRefHash;
    uint64 blockNumber;
}

AuthorityVerifierV1.verify(
    AccountPrincipal calldata p,
    bytes32 digest,
    bytes calldata witness,
    VerifyContext memory ctx
) -> (AuthorityBasisWord basis, bytes32 codehashOrZero)
```

`verify` reverts on failure and reads no `msg.sender`/`tx.origin`. Admission MUST
first execute
`computePrincipalId(principal) == envelope.header.principalId`, reverting
`AUTH_PRINCIPAL_MISMATCH(declared, computed)` before either envelope- or
intent-witness verification. First-use `PrincipalRecord` persistence copies
exactly this verified calldata descriptor. The returned basis is persisted without
projection:

```text
AuthorityBasisWord = kind u8 ‖ verifierVersion u16 ‖ witnessProfile u8 ‖
                     basisBlock u64 ‖ delegateOrZero u160
```

The word is the receipt authority-basis slot and the envelope-meta index value;
`codehashOrZero` occupies a conditional second slot only for contract-account
kinds. `authEpoch` remains in the signed envelope header and never enters the
basis word.

---

## 5. AdmissionIntent/1

### 5.1 Layout and Realm-bound signing domain

```text
AdmissionIntent/1 (canonical semantic order):
  1. realmId             bytes32  — the target Realm
  2. envelopeId          bytes32
  3. leafMask            uint64   — bit i set ⇒ admit leaf i; bits ≥ count MUST
                                      be 0; at least one bit set
  4. action              uint8    — MBZ = 0 = ADMIT in B0
  5. expectedRevisions[] ExpectedRevision[]
      ExpectedRevision = (leafIndex uint16, revision uint32)
  6. nonceKey            uint192  — §5.2
  7. nonceSeq            uint64   — §5.2
  8. notAfter            uint64   — unix seconds; 0 = none; bounds the
                                      sign-to-include TOCTOU window
  (carriage alongside: intent witness, same §4.1 formats)
```

```text
ExpectedRevision(uint16 leafIndex,uint32 revision)
AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)

EXPECTED_REVISION_TYPEHASH = keccak256(
  "ExpectedRevision(uint16 leafIndex,uint32 revision)")

expectedRevisionsHash = keccak256(concat(
  keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH,
                       item.leafIndex,
                       item.revision))
  for item in expectedRevisions, in array order
))

INTENT_TYPEHASH = keccak256(
  "AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)")

intentStructHash = keccak256(abi.encode(
  INTENT_TYPEHASH, realmId, envelopeId, leafMask, action,
  expectedRevisionsHash, nonceKey, nonceSeq, notAfter
))

DS_INT = keccak256( abi.encode(
           keccak256("EIP712Domain(string name,string version,uint256 chainId,"
                     "address verifyingContract)"),
           keccak256("EFS2-AdmissionIntent"),
           keccak256("1"),
           chainId,
           verifyingContract ) )

eip712IntentDigest = keccak256(0x1901 ‖ DS_INT ‖ intentStructHash)

DOM_INTENT = keccak256("efs2/admission-intent/1")
IntentId = keccak256(abi.encode(DOM_INTENT, eip712IntentDigest))
```

[PROPOSAL — full Realm-bound domain: chainId + verifyingContract + realmId. The
intent is the deliberately non-portable half of axis 3: it authorizes local
effects in exactly one Realm and must be worthless everywhere else. The Realm
checks `realmId == its own RealmId` (`E_REALM_MISMATCH`) in addition to domain
verification, so even a hypothetical second deployment sharing an address across
chains — CREATE2 — still separates, and honest clients can DISPLAY the target
Realm from the signed bytes alone.]

`expectedRevisions` carries the Realm-local half of Binding dual CAS. It contains
exactly one entry for every selected Binding-class leaf, in selected-leaf order,
and is empty only when no Binding-class leaf is selected. Missing, extra,
duplicate, out-of-order, or mismatched entries reject; no wildcard or blind
Binding write exists. Each Binding body still carries its portable
`predecessorOccurrence` CAS.

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
mapping(bytes32 principalId => mapping(uint192 nonceKey => uint64 lastSeq)) intentNonces;
```

Replay within the Realm: impossible (seq consumed). Replay across Realms:
impossible (domain + realmId). Reordering within one lane: impossible (strict
increment); across lanes: author's explicit choice.

### 5.3 Admission algorithm (one call, atomic)

```text
publish(bytes envelopeBytes, AccountPrincipal calldata principal,
        bytes intentBytes, bytes intentWitness):
 1. require envelopeBytes.length ≤ MAX_ENVELOPE_WIRE_BYTES; decode EnvelopeWire;
    validate the main envelope and bounded target-evidence carriage (§2.2)
 2. computed ← computePrincipalId(principal)
    require computed == env.header.principalId
      — AUTH_PRINCIPAL_MISMATCH(declared, computed), before ANY witness verify
 3. envDigest ← §2.4; envelopeId ← §2.3
 4. (basisE, codehashE) ← AuthorityVerifierV1.verify(
       principal, envDigest, env.witness, verifyContext)
    // reverts typed on failure; persist this exact pair for accepted occurrences
 5. select explicit-intent or implicit-sender mode (§5.4); require leafMask ≠ 0,
    bits ≥ count clear, every selected body carried, and every body RecordId-matched.
    Derive the ascending selected pre-withdrawal-class leaf list (target header
    absent) from selected Withdrawal bodies and target states; require
    targetEvidence.withdrawalLeafIndex
    matches that list exactly (one-to-one; no missing/extra/duplicate entries).
    For each pair, before author comparison or state write, require the recomputed
    evidence EnvelopeId equals Withdrawal.targetEnvelopeId and targetLeafIndex is
    in range; then run the target descriptor/witness checks of §3.3.
 6. classify every selected occurrence under §3.2. If every selected outcome is an
    idempotent no-op, return its existing receipts/outcomes without consuming a
    nonce or writing. If any selected occurrence is WITHDRAWN/PRE_WITHDRAWN and
    the operation is admission, revert E_NO_RESURRECTION.
 7. for explicit mode, decode the exact §5.1 AdmissionIntent and require:
      action == 0; envelopeId/realmId/leafMask match; both expiries pass;
      expectedRevisions exactly covers selected Binding-class leaves and every
      expected revision matches current Realm state.
    (basisI, codehashI) ← AuthorityVerifierV1.verify(
       principal, eip712IntentDigest, intentWitness, verifyContext)
    // the same typed descriptor is used for both checks; verification failure reverts
    consume mapping[principalId][uint192 nonceKey] at nonceSeq == lastSeq + 1
 8. for implicit-sender mode, require intentBytes encodes only leafMask,
    intentWitness is empty, msg.sender is the account in `principal`, and no
    selected leaf is Binding-class; the transaction nonce supplies replay control.
 9. if first admission touching envelopeId: persist header + FULL recordIds vector
    and first-use PrincipalRecord bytes copied from `principal` (state-readable, §10)
10. for each selected bit i, ascending:
      dispatch §3.2; ACTIVE duplicates write nothing and return ALREADY_ADMITTED;
      newly accepted occurrences receive consecutive next ordinals in this
      submission order only; store any new Record body; apply Withdrawal §3.3
      only after its exactly matched target evidence has passed the ID, target
      index, descriptor, witness, and author checks; then write PRE_WITHDRAWN
11. atomically materialize the parsed schema cache when the accepted Record is an
    intrinsic TypeSchemaGroup/1 Record; this is structural bootstrap work, not an
    application effect or second write primitive
12. run mandatory index postings for every newly accepted occurrence and the
    exactly-once decrement for every effective withdrawal
    [OWNER RULING — mandatory automatic indexing, no writer opt-out,
     owner-rulings.md 2026-07-15 lines 59–62 and 2026-08-12 lines 203–210]
13. emit receipt outcomes; ANY non-idempotent failure above reverts EVERYTHING
    (steps 1–12
    are one EVM call frame — the one-transaction gate)
```

Idempotency is occurrence-granular and unambiguous. An all-duplicate retry returns
the existing receipts as `ALREADY_ADMITTED` and writes nothing. In a mixed mask,
duplicates no-op while newly accepted occurrences require one fresh valid intent,
consume its nonce, and receive new ordinals. Re-withdrawal of a `WITHDRAWN` or
`PRE_WITHDRAWN` target is likewise a no-op success. Terminal status prevents
resurrection; duplicate handling never does so by whole-call revert.

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
  state. Its authority grade stays in the source-qualified `AUTH_FOREIGN_ORIGIN`
  range, never destination truth [DERIVED INVARIANT — kel §8.1 lines 433:
  "Evidence import MUST NOT occupy
  the authoritative-admission bit"; loss-map deferred to V2-E8 per the PM
  directive, seam specified here].

REJECTED for B0: open admission (anyone admits any valid envelope) — the griefing
lever above; revisit only if a fixture shows author-only admission blocks a real
workload (route to the F3 bakeoff notes).]

**Implicit same-tx intent within `publish`.** When the transaction sender is the
account named by the verified `AccountPrincipal`, `intentBytes` may carry only a
`uint64 leafMask` and `intentWitness` is empty. The mode is legal only when the
selected envelope contains no Binding-class leaves; Binding-class leaves always
require the explicit SR-3 intent with `expectedRevisions`. Realm is this contract
by construction, the envelope expiry still applies, and the account transaction
nonce supplies replay control. The receipt records `intentKind = IMPLICIT_SENDER`.
R-D8 is not violated [DERIVED INVARIANT]: authorship still derives exclusively
from the envelope witness; `msg.sender` supplies only Realm-local consent for the
same account. Any rail can reach the same state through explicit intent.

`publish` is the sole Core write primitive. `publishBatch` is only an optional
all-or-nothing composition of independent `publish` elements, not a second
semantic primitive.

---

## 6. The reserved authority-basis seam (managed Principals)

[DERIVED INVARIANT — kel §8.1 (lines 415–432: the envelope must bind authority;
record identity excludes actor/grant carriage) + kel §3 (line 94: retrofitting a
KEL-aware lane later fails); the PM skeleton pins this lane to specify the exact
reserved encoding]

The reservation is physical, not rhetorical: `authorityRef bytes32` and
`authEpoch uint64` sit in the signed struct and the EnvelopeId preimage TODAY, at
fixed positions 3 and 4 (§2.1), pinned to zero, with nonzero values rejected
(`E_RESERVED_AUTHORITY`, fail closed).

Activation path when a managed-Principal profile lands:

- `PublicationEnvelope/2` = the SAME layout, same field offsets, same
  `DOM_ENVELOPE` word, same EIP-712 type string, with `profile = 2` and nonzero
  `authorityRef`/`authEpoch` permitted; the verifier gains grant/epoch validation
  (kel §8.2 steps 3–5). Because the fields already exist, activation changes the
  legal VALUE RANGE, not the layout, the hash formula, or any offset — EnvelopeId
  semantics (how an id is computed from fields) are untouched, which is the exact
  sense in which the task's requirement "without changing RecordId or EnvelopeId
  semantics" is met.
- `RecordId` is untouched by construction: no envelope field ever enters it.
- Receipts already persist `AuthorityBasisWord` plus conditional codehash (§4.3),
  so historical profile-1
  admissions keep their recorded bare-account basis forever; kel §8.1's rule
  "bare mode is exactly authorityRef = 0, authEpoch = 0" maps onto profile 1
  verbatim, and its "once KEL activates, that branch is permanently disabled for
  future authoritative admission" becomes a Realm-policy line in the profile-2
  verifier [DERIVED INVARIANT — kel §8.1 line 435].

Honest consequence, stated for the red team: OccurrenceRef includes EnvelopeId, so
a profile-2 author re-signing the same leaves under a NEW grant (new
authorityRef/authEpoch values) mints a new EnvelopeId and therefore new
Occurrences. kel's own answer was a logical `claimId` that excludes actor/grant
carriage. B0 deliberately has no logical-claim id — occurrence identity IS the
signed event [PROPOSAL — simpler algebra; re-authorization is a new authored
event, and continuity across it is Binding-chapter machinery (the head moves) plus
receipts]. If fixture work shows continuity-across-reauthorization must live in
the identity layer, that is a named falsifier of this proposal and routes to a
kel-style claimId variant in the bakeoff notes — not a silent patch.

The exact `AuthorityBasisWord` and conditional codehash returned by §4.4 are
persisted per accepted admission without re-encoding; nothing in this chapter
caches authority at read time [DERIVED INVARIANT — CARRY-IN (a): admission-time
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
carried for selected leaves; unselected leaves stay NEVER_ADMITTED and admissible later
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
| A signable digest stored or used as an ID, or an ID signed as a digest | structural preimages are `32*k`-byte ABI-word sequences; EIP-712 transcripts are exactly 66 bytes (`0x1901 ‖ DS ‖ structHash`); collision resistance plus typed interfaces keep the families distinct | §1 |
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
3. Before verification, `computePrincipalId(principal)` must equal the declared
   `header.principalId`; the same typed descriptor is then an input to both checks.
4. Authorship verification inputs: `(AccountPrincipal, eip712EnvelopeDigest,
   witness, VerifyContext)`. `AuthorityVerifierV1.verify` reads no
   `msg.sender`/`tx.origin` (§4.4).
5. Intent verification inputs: `(AccountPrincipal, eip712IntentDigest,
   intentWitness, VerifyContext)`
   — the intent authenticates the AUTHOR, not the submitter, so a relayer
   carrying both signed blobs adds nothing and subtracts nothing.
6. Receipt identity/authorship fields: principalId, AuthorityBasisWord plus any
   conditional contract codehash, envelopeId,
   occKey, ordinal. A Realm MAY log the submitting `msg.sender` as diagnostic
   event data, but it enters no ID preimage, no receipt identity, and no read
   path [PROPOSAL — diagnostics allowed, semantics forbidden].
7. The ONLY `msg.sender`-sensitive path is the implicit-sender mode inside
   `publish` (§5.4), which replaces
   the intent SIGNATURE with the strictly stronger fact that the consenting
   account itself is acting — and which any rail can bypass via the explicit
   path with identical persisted results.

Substitution vector (binding for the harness): the same `(EnvelopeWire, intent,
intentWitness)` bytes submitted by (a) the author's own EOA, (b) an unrelated EOA
relayer, (c) a 4337 bundler with a paymaster, MUST yield byte-identical
EnvelopeId, occKeys, principalId, and AuthorityBasisWord (plus conditional
codehash). `AdmissionOrdinal` and block
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
mapping(bytes32 envelopeId => bytes32) envelopeAuthorityRef;// 0 until profile 2
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
struct OccStatus {
    uint8  status;             // 0 NEVER_ADMITTED / 1 ACTIVE /
                              // 2 WITHDRAWN / 3 PRE_WITHDRAWN
    uint48 ordinal;            // 0 = none; admitted ordinals start at 1
    uint48 revokedAtOrdinal;   // 0 until an effective withdrawal
}
mapping(bytes32 occKey => OccStatus) occStatus;
// The ordinal-keyed admission log owns receipt paging/hydration. No receipt
// reference is duplicated in this overlay.

// ---- intent nonces ----
mapping(bytes32 principalId => mapping(uint192 nonceKey => uint64)) intentNonces;
```

Both stored ordinal fields are widened to `uint64` at every public ABI, receipt,
and vector. Before assigning the next ordinal, Core applies `U48_GUARD` and reverts
at `2^48 - 1`; a successor Realm/revision is the named migration seam. Zero remains
the none-sentinel.

State-readability [DERIVED INVARIANT — constitution reconstruction clause;
R-D3]: header + full RecordId vector persist on first admission so a second
implementation can re-verify authorship of every admitted occurrence from state
alone — no logs, no EFS-operated service (EIP-4444-proof by construction).

External ABI (Solidity signatures other chapters and the SDK compile against):

```solidity
struct ExpectedRevisionArg {
    uint16 leafIndex;
    uint32 revision;
}

struct AdmissionIntentArg {           // mirrors §5.1 fields 1–8
    bytes32 realmId;
    bytes32 envelopeId;
    uint64 leafMask;
    uint8 action;                     // MBZ = 0 = ADMIT
    ExpectedRevisionArg[] expectedRevisions;
    uint192 nonceKey;
    uint64 nonceSeq;
    uint64 notAfter;
}

function publish(
    bytes calldata envelopeBytes,
    AccountPrincipal calldata principal,
    bytes calldata intentBytes,
    bytes calldata intentWitness
) external returns (bytes32 envelopeId, uint8[] memory outcomes,
                    uint64[] memory admissionOrdinals);

function occKeyOf(bytes32 envelopeId, uint16 leafIndex)
    external pure returns (bytes32);

function occurrenceStateOf(bytes32 occKey)
    external view returns (uint8 status, uint64 ordinal, uint64 revokedAtOrdinal);

function envelopeHeaderOf(bytes32 envelopeId) external view
    returns (bool known, uint16 profile, bytes32 principalId, bytes32 authorityRef,
             uint64 authEpoch, bytes32 pubNonce, uint64 notAfter, uint16 count);

function envelopeRecordIdsOf(bytes32 envelopeId, uint16 start, uint16 limit)
    external view returns (bytes32[] memory page, uint16 total);
```

All reads are point reads or hard-bounded pages; `known = false` is honest
unknown-at-this-Realm, never a claim about other Realms [DERIVED INVARIANT —
constitution honest-reads clause].

Named error selectors: `E_PROFILE, E_RESERVED_AUTHORITY, E_EMPTY_ENVELOPE,
E_LEAF_LIMIT, E_LEAF_RANGE, E_BODY_LIMIT, E_WIRE_LIMIT, E_BODY_MISMATCH, E_BAD_WITNESS,
E_NOT_AUTHOR, E_REALM_MISMATCH, E_NONCE, E_EXPIRED_ENVELOPE, E_EXPIRED_INTENT,
E_EXPECTED_REVISION, E_TARGET_EVIDENCE, E_NO_RESURRECTION,
AUTH_PRINCIPAL_MISMATCH, ErrWithdrawNotAuthor, U48_GUARD`.

## 11. Constants table (consolidated)

| Constant | Value | Set by |
|---|---|---|
| `MAX_ENVELOPE_LEAVES` | 64 | [HYPOTHESIS] structural cap; Stage B re-derives |
| `MAX_ENVELOPE_BODY_BYTES` | 8,192 | [HYPOTHESIS] Stage B re-derives |
| `MAX_BODY_BYTES` | 8,192 | [HYPOTHESIS] one leaf may fill the envelope; Stage B re-derives |
| `MAX_BIND_LEAVES_PER_ENVELOPE` | 64 | [HYPOTHESIS] Stage B re-derives |
| `MAX_WITNESS_BYTES` | 4,096 | §2.5; applies to each main/target witness; aggregate target evidence also shares the 8,192-byte and 16,384-byte caps |
| `MAX_ENVELOPE_WIRE_BYTES` | 16,384 | [HYPOTHESIS] entire EnvelopeWire including all target evidence; Stage B re-derives |
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
6. Identity-chain and witness vectors: a valid witness for an attacker descriptor
   with a different declared `header.principalId` MUST fail with
   `AUTH_PRINCIPAL_MISMATCH` before `verify`; honest descriptor equality passes;
   low-S malleability rejection; 1271 gas-bomb and
   returndata-bomb bounded; 7702 account before/under/after delegation classified
   per-admission; ERC-6492 wrapper rejected.
7. Nonce/expiry vectors: lane replay, cross-lane concurrency, expired envelope
   vs expired intent.
8. Occurrence state machine: T1–T6 including authenticated `PRE_WITHDRAWN`,
   terminal no-resurrection, wrong-author whole-envelope
   `ErrWithdrawNotAuthor`, `ALREADY_ADMITTED`, and duplicate withdrawal no-ops;
   target-evidence wrong EnvelopeId and out-of-range targetLeafIndex MUST-FAIL
   before author comparison; missing/extra/duplicate/wrong-leaf evidence and
   aggregate evidence/wire overflow MUST-FAIL.
9. Two Principals with identical low-160-bit accounts distinct end-to-end (R-D2).
10. Bounds: 65 leaves, count = 0, oversize body, oversize witness, leafMask bit ≥
    count — each MUST-FAIL with its named error.

---

## Interfaces exposed

Compact contract other chapters may rely on:

- **Types**: `PublicationEnvelope/1` (§2.1 field list including `authorityRef`;
  exact EIP-712 type string §2.4); exact SR-3 `AdmissionIntent/1` and
  `ExpectedRevision` (§5.1); `OccurrenceRef = (EnvelopeId bytes32, leafIndex
  uint16)`; `OccurrenceKey = keccak256(abi.encode(DOM_OCCURRENCE, envelopeId,
  uint256(leafIndex)))`; `EnvelopeId = keccak256(abi.encode(DOM_ENVELOPE,
  eip712EnvelopeDigest))`; the principal chapter's `WitnessProfile/1`,
  `AccountPrincipal`, and exact `AuthorityBasisWord` plus conditional codehash;
  constants table §11.
- **Guarantees**: EnvelopeId/RecordId/OccurrenceRef exclude witness, submitter,
  rail, payer, and Realm; authorityRef/authEpoch are physically reserved (zero,
  fail-closed) so managed Principals activate without layout or formula change;
  subset carriage always ships the full RecordId vector; occurrence states are
  exactly NEVER_ADMITTED/ACTIVE/WITHDRAWN/PRE_WITHDRAWN with T1–T6 and atomic
  multi-leaf admission; stored ordinals are u48 and every public value is u64;
  withdrawal is author-only, Realm-local, non-deleting, non-resurrecting,
  authenticated pre-withdrawal legal only with bounded one-to-one target evidence
  whose recomputed EnvelopeId and target-index range match the Withdrawal before
  author comparison; admission is author-consented (no
  third-party admission); descriptor equality precedes witness verification;
  authority is verified at admission and persisted, never re-derived at read;
  `publish` is the only Core write primitive.
- **ABI**: §10 function signatures.
- **Consumed (dependsOn)**: `recordIdOf` (Type/Record chapter);
  `AccountPrincipal`, `computePrincipalId`, `AuthorityVerifierV1`,
  `AuthorityBasisWord` (principal chapter); receipt spine,
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
