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
uniform-PrincipalId arm crosses. Mandatory F1/F3 bakeoff carriers are exact
disposable cell interfaces; other alternatives remain labeled bakeoff sketches.

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

struct TargetRecordCommitment {
    bytes32 typeSchemaId;
    bytes32 bodyHash;              // keccak256(canonicalBody); body is not carried
}

struct TargetEnvelopeEvidence {          // unsigned carriage for §3.3 T4 only
    uint16         withdrawalLeafIndex;  // selected Withdrawal leaf this proves
    EnvelopeHeader header;
    bytes32[]      recordIds;            // FULL committed vector
    TargetRecordCommitment targetCommitment;
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
`E_TARGET_EVIDENCE`. The commitment pair is fixed at 64 bytes and never carries
the target canonical body. Maximal legal `abi.encode(evidence)` is exactly
`32 + 384 + 2,080 + 1,184 + 4,128 = 7,808` bytes: outer dynamic-struct offset,
fixed struct head, 64-entry vector, maximal valid RSA `AccountPrincipal` (empty
origin plus 1,024-byte key), and maximal witness. The ERC-1271 alternative has
a nonempty origin but only a 20-byte account and is smaller. The maximal item therefore
fits the 8,192-byte aggregate evidence cap independently of a target body's
legal size. The 16,384-byte whole-wire cap still applies to the enclosing call.
These are decoding and bounded-carriage checks and therefore run on every call,
including an all-selected-ACTIVE retry. They do **not** perform the semantic
one-to-one match below.

On the non-idempotent path, as the ascending shadow walk determines each
source outcome, point-in-order target state, and authenticated target
Envelope-header availability,
`targetEvidence` MUST be in strictly
increasing `withdrawalLeafIndex` order and bind one-to-one to exactly the newly
accepted Withdrawal leaves whose target transition is
`NEVER_ADMITTED -> PRE_WITHDRAWN` **and** whose authenticated target bundle
(header, full vector, authenticated TypeSchemaId/bodyHash commitment) is not otherwise
available from persisted or staged state. An ACTIVE duplicate
source occurrence, a target whose complete authenticated bundle is already
persisted/staged (including a sibling whose exact body is carried in the
authenticated current Envelope), or a target already in
WITHDRAWN/PRE_WITHDRAWN at that point requires no
caller evidence on a mixed/new call; supplying it for that leaf is extra and
reverts. The all-selected-ACTIVE path is deliberately earlier: after the checks
above and envelope identity/authentication, it returns without applying this
semantic cardinality rule, so byte-for-byte retry of the successful
evidence-bearing calldata remains valid. For PRE_WITHDRAWN on a mixed/new call,
Core loads the original evidence through `occStatus[target].revokedAtOrdinal`
rather than asking the caller again. Missing, extra, duplicate, unselected-leaf,
or non-Withdrawal evidence on the non-idempotent path reverts
`E_TARGET_EVIDENCE`. Each required item is then
structurally validated, recomputes its SR-2 EnvelopeId, binds its typed
`targetPrincipal` to its declared header id before witness verification under
§4.4, carries the full committed vector plus exactly the target commitment pair,
and is consumed only by
its named selected Withdrawal.

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

**Mandatory bakeoff signing seams (exact, disposable, not B0).** These spellings
are frozen so Stage B compares semantics rather than inventing them while
measuring.

F1/X17 uses one chain-free signed card per Record:

```text
DS_CARD = keccak256(abi.encode(
  keccak256("EIP712Domain(string name,string version)"),
  keccak256("EFS2-Card"), keccak256("1")))
CARD_TYPE =
  "PublicationCard(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32 typeSchemaId,bytes32 recordId)"
CARD_TYPEHASH = keccak256(ascii(CARD_TYPE))
cardStructHash = keccak256(abi.encode(
  CARD_TYPEHASH, profile, principalId, authorityRef, authEpoch, pubNonce,
  notAfter, typeSchemaId, recordId))
eip712CardDigest = keccak256(0x1901 || DS_CARD || cardStructHash)
CardId = keccak256(abi.encode(DOM_BAKEOFF_F1_CARD, eip712CardDigest))
OccurrenceRef_F1 = (CardId, uint16(0))
```

The unsigned wire carries exactly one canonical body plus one witness and checks
`recordIdOf(typeSchemaId,body)==recordId`. F1 retains the **byte-exact SR-3
AdmissionIntent**: `intent.envelopeId=CardId`, `leafMask=1`, `action=0`, and
`expectedRevisions=[]` except for the one `(leafIndex=0,revision)` entry on a
Binding card. No intent field or type string changes.

F3 removes AdmissionIntent and signs this exact Realm-bound carrier:

```text
ExpectedRevision(uint16 leafIndex,uint32 revision)
PublicationEnvelopeBound(uint16 profile,bytes32 principalId,bytes32 realmId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 admissionNotAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)

DS_F3 = keccak256(abi.encode(
  keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
  keccak256("EFS2-Envelope-Bound"), keccak256("1"), chainId,
  verifyingContract))
EXPECTED_REVISION_TYPEHASH = keccak256(
  "ExpectedRevision(uint16 leafIndex,uint32 revision)")
expectedRevisionsHash = keccak256(concat(
  keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH,item.leafIndex,item.revision))
  for item in array order))
recordIdsHash = keccak256(abi.encodePacked(recordIds))
F3_TYPEHASH = keccak256(
  "PublicationEnvelopeBound(uint16 profile,bytes32 principalId,bytes32 realmId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 admissionNotAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)")
f3StructHash = keccak256(abi.encode(
  F3_TYPEHASH, profile, principalId, realmId, authorityRef, authEpoch,
  pubNonce, notAfter, recordIdsHash, leafMask, action,
  expectedRevisionsHash, nonceKey, nonceSeq, admissionNotAfter))
eip712F3Digest = keccak256(0x1901 || DS_F3 || f3StructHash)
F3EnvelopeId = keccak256(abi.encode(
  DOM_BAKEOFF_F3_ENVELOPE, eip712F3Digest))
```

`realmId` equals the admitting Realm; `leafMask` is nonzero/in-range;
`action=0`; expected revisions are ordered and cover exactly the selected
Binding leaves; the nonce lane and both expiries retain their SR-3/B0 meanings.
F3 has no AdmissionIntent, IntentId, intent witness, or consumed-intent object.
Changing mask, nonce, revision, Realm, or admission expiry changes the F3 id.
Its rejection condition remains: if copied signed evidence cannot stay
verifiable at a destination, reject F3 regardless of gas.

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

Admission is the sole `TargetEnvelopeEvidence` verifier. Before either the
status owner (`LibIndex`) or Binding receives a withdrawal effect, Admission
constructs this typed context from state or from one fully validated retained/
caller evidence value:

```solidity
struct ValidatedOccurrenceLifecycleEffect {
    OccurrenceRef target;
    bytes32 targetOccKey;
    bytes32 targetPrincipalId;       // authenticated; author equality already checked
    uint8 priorStatus;               // NEVER_ADMITTED|ACTIVE|WITHDRAWN|PRE_WITHDRAWN
    uint64 priorOrdinal;
    uint64 priorRevokedAtOrdinal;
    uint64 evidenceOrdinal;          // 0, or immutable retained evidence key
    uint8 targetEffectKind;          // 0 ordinary, 1 Binding mutation, 2 Withdrawal
    bytes32 targetBindingKey;        // nonzero only for ACTIVE kind-1 body/head fold
    bool targetIsCurrentBindingHead;
}
```

For a new evidence-backed prewithdrawal, `evidenceOrdinal` is the newly
allocated Withdrawal ordinal at which Admission stores the already-validated
canonical evidence; for a terminal retry it is the existing nonzero
`priorRevokedAtOrdinal`; otherwise it is zero. Admission asserts
`targetOccKey == occKeyOf(target)`, classifies the target Record/effect, and
authenticates the target Principal before constructing the context.
`LibIndex` owns and writes lifecycle/status, while `LibBinding` owns the
possible head consequence; both consume this same typed value only. Neither
library accepts witness/evidence bytes, decodes a descriptor, calls an
authority verifier, or repeats author equality.

| # | Transition | From → To | Guard | Effect |
|---|---|---|---|---|
| T1 | `ADMIT` | NEVER_ADMITTED → ACTIVE | envelope + witness + consent valid (§5.3) | assign the next ordinal; store status + receipt; run mandatory postings |
| T2 | `DUP_ADMIT` | ACTIVE → ACTIVE | same occKey re-admitted | `ALREADY_ADMITTED`; return existing receipt; no write |
| T3 | `WITHDRAW` | ACTIVE → WITHDRAWN | admitted `Withdrawal/1`, author match (§3.3) | one-way status flip; set `revokedAtOrdinal`; decrement indexes exactly once |
| T4 | `PRE_WITHDRAW` | NEVER_ADMITTED → PRE_WITHDRAWN | persisted target header, or authenticated target-envelope evidence + author match (§3.3) | block target before its first admission; when evidence was required, store its canonical bytes at the Withdrawal ordinal |
| T5 | `DUP_WITHDRAW` | WITHDRAWN → WITHDRAWN | second withdrawal | no-op success |
| T5b | `DUP_PRE_WITHDRAW` | PRE_WITHDRAWN → PRE_WITHDRAWN | author match using retained original evidence when no target header exists; no caller evidence | no-op success |
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

`Withdrawal/1` is an ordinary Record Type with a reserved kernel TypeSchemaId —
not a special transaction kind [PROPOSAL — one write path; withdrawal evidence is
itself portable, authored, and admissible per-Realm]. Its concrete
TypeSchemaId value remains a Stage B Codex output. The exact schema is:

```text
Withdrawal/1 body fields (canonical order):
  target  OCCREF
Reference role `target`: targetClass=OCCURRENCE, expectedType unused,
                         selector=DIRECT(fieldIdx=target, memberIdx=0)
canonicalBody = target.envelopeId ‖ u16be(target.leafIndex)  // exactly 34 bytes
```

There is no split `bytes32 targetEnvelopeId` + `uint16 targetLeafIndex`
schema and no ad hoc effect decoder. Prose below uses
`withdrawal.target.envelopeId` / `withdrawal.target.leafIndex`; these are the
two components of the one MC/1 `OCCREF` value.

Semantics [DERIVED INVARIANT — candidate lines 227–231, restated exactly]:
a Withdrawal admitted in Realm V marks `(V, target)` WITHDRAWN, meaning "the
issuer no longer maintains this publication in V". It does NOT delete the Record
or its bodies, does NOT retract any other Principal's occurrence of the same
Record, does NOT rewind or free any Binding head (Binding-chapter interplay is
open item O5), and has NO effect in any Realm where it is not admitted.

Authority guard [PROPOSAL]: effective iff
`withdrawalEnvelope.header.principalId == targetEnvelope.header.principalId` —
full bytes32 comparison (R-D2). When the target Envelope header is already known,
its persisted or authenticated staged header supplies the target Principal even
if this target leaf is still `NEVER_ADMITTED`. When the target transition is
`NEVER_ADMITTED -> PRE_WITHDRAWN` and that complete authenticated target bundle
is unavailable, the caller MUST carry
`TargetEnvelopeEvidence`: the target's signed header fields, full ordered
`recordIds[]` vector, the target's `(typeSchemaId, bodyHash)` commitment, typed
`targetPrincipal`, and witness. The canonical body is deliberately absent. The
evidence item is already one-to-one bound to this newly accepted Withdrawal leaf
by §2.2. Admission recomputes `evidenceEnvelopeId` from the evidence header and
full vector and MUST require, in this order:

```text
evidenceEnvelopeId == withdrawal.target.envelopeId
withdrawal.target.leafIndex < targetEvidence.recordIds.length
keccak256(abi.encode(DOM_RECORD,
                     targetEvidence.targetCommitment.typeSchemaId,
                     targetEvidence.targetCommitment.bodyHash)) ==
    targetEvidence.recordIds[withdrawal.target.leafIndex]
computePrincipalId(targetEvidence.targetPrincipal) ==
    targetEvidence.header.principalId
verify(targetEvidence.targetPrincipal, targetEnvelopeDigest,
       targetEvidence.witness, verifyContext)
targetEvidence.header.principalId == withdrawalEnvelope.header.principalId
```

The EnvelopeId equality, target-index range, and target-commitment guards
therefore run before Admission classifies `targetEffectKind` from the
authenticated `typeSchemaId`, performs author comparison,
or any `PRE_WITHDRAWN` write. An ID mismatch, out-of-range target,
missing/extra/duplicate evidence, or invalid target witness reverts
`E_TARGET_EVIDENCE`; author mismatch reverts `ErrWithdrawNotAuthor`; only complete
equality permits `PRE_WITHDRAWN`. A bare `targetEnvelopeId` can never cause
pre-withdrawal when the authenticated header/vector and target commitment are
not already available.

Admission is the only evidence decoder. After these checks (or equivalent
state lookup for an already known target), it constructs the exact shared
`ValidatedOccurrenceLifecycleEffect` defined in §3.2. `LibIndex` and
`LibBinding` receive that typed context only. They receive no opaque evidence
bytes, define no alternate proof grammar, and never repeat descriptor,
witness, or author validation.

On that effective evidence-backed transition, after the Withdrawal occurrence
has received ordinal `wOrd`, Core stores exactly
`abi.encode(decodedTargetEnvelopeEvidence)` at
`preWithdrawalEvidence[wOrd]`. This is the canonical ABI re-encoding in the field
order of §2.2, not the caller's potentially non-canonical outer calldata bytes;
it contains the exact validated header, full RecordId vector, target commitment,
typed descriptor, and witness used by the transition. Its encoded length is
included in
both the 8,192-byte aggregate target-evidence bound and the 16,384-byte whole-wire
bound, so the state carrier cannot become an unbounded side channel. The target
overlay stores `revokedAtOrdinal = wOrd`, giving reconstruction a direct pointer.
No evidence bytes are stored for ACTIVE->WITHDRAWN or a terminal-target no-op.

For a new Withdrawal occurrence targeting `PRE_WITHDRAWN`, Core follows the
target's nonzero `revokedAtOrdinal`, loads and decodes the retained evidence,
checks the stored evidence's ID/range/descriptor linkage, and uses its already
authenticated header Principal for the author comparison; it does not call live
target authority again. The original accepted Withdrawal plus immutable retained
bytes are the admission-time authentication fact that W-7 replays. The caller MUST
NOT resupply evidence. The target effect is a no-op and the retained bytes are
neither replaced nor copied. Re-admission of the same already-ACTIVE Withdrawal
occurrence is ordinary T2 idempotence and returns before target-effect preflight,
also without evidence.

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
time] The witness is verified exactly once in each `publish` call that passes
bounded structure and descriptor equality, before the all-selected-ACTIVE
classification. The Realm's versioned
verifier result is discarded on that no-op path; only a non-idempotent accepting
call persists its `AuthorityBasisWord` and conditional contract-account codehash
in an `AdmissionBatch` resolved by its newly accepted occurrences' receipts. A
later staged call reverifies. Reads consume receipts and never re-run authority
checks. For profile 1
(intrinsic account Principals, no rotation) this is cheap insurance; it becomes
load-bearing the moment managed Principals activate (§6) — which is exactly why
the discipline is fixed now rather than retrofitted (kel §3 line 94: the
"KEL-added-later-as-peer" failure).

The immutable `AdmissionBatch` plus logical `AdmissionReceipt/1` is the
historical validation evidence: it records that this Realm's named verifier,
at the recorded basis and codehash, accepted the envelope author for the newly
admitted occurrence. Core intentionally does **not** persist the main envelope
witness. `getEnvelopeBytes` therefore cannot replay a historic signature and a
reader MUST NOT call the present ERC-1271 account (or any present authority)
and treat that answer as the historic verdict. Historical authorship grade
comes from the receipt's immutable admission basis. A caller that separately
possesses the original witness may replay a pure signature against the
persisted unsigned envelope, but that is additive evidence, not a state-only
Core guarantee.

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

The word and `codehashOrZero` are retained once by the non-idempotent accepting
call's `AdmissionBatch`; every occurrence newly accepted in that call resolves
that exact pair in its logical receipt. A later staged admission of the same
Envelope is reverified and may retain a different pair. Envelope metadata owns
no singular authority basis. The codehash occupies a conditional second slot
only for contract-account kinds. `authEpoch` remains in the signed envelope
header and never enters the basis word.

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
exactly one entry for every selected **CAS-bearing Binding mutation**
(`BindingSet/1` or `BindingTombstone/1`), in selected-leaf order, and is empty
only when no such leaf is selected. `Withdrawal/1` is a kernel effect but has no
Binding CAS entry: it targets an exact occurrence and its head consequence is
derived at its point in the ordered shadow walk. Missing, extra,
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

**Deterministic shadow preflight [PROPOSAL — exact].** The non-idempotent path
does not validate every leaf against one unchanged storage snapshot. It builds
one bounded in-memory `ShadowState`, initialized lazily from persisted state,
and advances it in ascending selected `leafIndex` order:

```text
ShadowState {
  nextOrdinal                     // starts admissionCount
  nextEnvelopeOrdinal, nextTypeOrdinal, nextPrincipalOrdinal
  occurrence[occKey]              // status, ordinal, revokedAtOrdinal
  envelopeAvailable[EnvelopeId]   // persisted, or authenticated current header/vector
  targetCommitment[OccurrenceKey] // authenticated TypeSchemaId/bodyHash only
  plannedPrewithdrawEvidence[wOrd]
  binding[bindingKey]             // head + exact producing OccurrenceRef
  postingHead[pk]                 // count/liveCount/lastOrdinal/RAW_AUDIT
  recordLive[RecordId]            // occurrence and unique-by-Type fold inputs
  typeCache[TypeSchemaId]         // persisted or earlier planned bootstrap
  leafPlan[]                      // exact before/after values and prospective ordinal
}
```

After the main Envelope witness succeeds, its verified header and full
`recordIds[]` vector enter `envelopeAvailable` before the leaf loop. They are
staged availability, not a state write. Every sibling target's body must also be
carried in this main wire (selected bodies already are) and RecordId-matched, or
already state-readable; Admission derives its `(typeSchemaId,
keccak256(canonicalBody))` commitment and Type/effect class without duplicate
evidence. Thus a
Withdrawal targeting a sibling in this authenticated Envelope never supplies
duplicate `TargetEnvelopeEvidence`. Other entries are loaded from storage on
first touch and thereafter only from the shadow; an external never-admitted
target's evidence carries only its signed target commitment as §3.3 requires.

```text
evidenceCursor = 0
expectedRevisionCursor = 0
shadow.nextOrdinal = admissionCount

static shape pass over selected leaves ascending:
  classify each selected kernel-effect Type from its carried RecordId-matched body
  associate exactly one ordered expectedRevisions item with every selected
    BIND_SET/BIND_TOMBSTONE leaf, including an ACTIVE duplicate; compare no value yet

for i in ascending set-bit order of leafMask:
  expectedItem = the statically associated item, if any  // cursor always consumed
  src = occurrence[occKey(envelopeId,i)]
  if src.status == ACTIVE:
      plan ALREADY_ADMITTED; continue                 // no effect replay
  if src.status in {WITHDRAWN,PRE_WITHDRAWN}:
      reject E_NO_RESURRECTION                         // no writes exist

  prospective = shadow.nextOrdinal + 1; guard u48; shadow.nextOrdinal = prospective
  shadow-activate source occurrence at prospective
  stage its Record/body, mandatory posting appends, record-live folds, and any
  intrinsic Type-cache materialization; all later leaves observe these results

  classify application effect by the closed list only:
    NONE | BIND_SET | BIND_TOMBSTONE | WITHDRAWAL

  if BIND_SET or BIND_TOMBSTONE:
      load current shadow head and its exact shadow source
      require expectedItem.revision == shadowHead.revision
      require body predecessor == shadow source (or explicit NONE iff UNSET)
      derive and apply the next head/revision/source and RAW_AUDIT append in shadow

  if WITHDRAWAL:
      load target occurrence from point-in-order shadow
      establish target Principal/header from authenticated staged current
        Envelope, persisted state, retained planned/persisted evidence, or—only
        when target is NEVER_ADMITTED and no complete authenticated target
        bundle is available—
        the next caller TargetEnvelopeEvidence item
      establish authenticated target TypeSchemaId/bodyHash from a state-readable
        Record, the RecordId-matched carried sibling body, or that evidence's
        commitment pair; otherwise reject E_TARGET_EVIDENCE
      classify targetEffectKind from TypeSchemaId. For NEVER_ADMITTED, derive no
        body semantics, Binding key, index delta, or head delta; only reject a
        Withdrawal target or plan PRE_WITHDRAWN/no-resurrection
      enforce caller-evidence cardinality at this exact point: missing, extra,
        duplicate, or wrong withdrawalLeafIndex rejects; terminal retries consume none
      derive every ValidatedOccurrenceLifecycleEffect field from this shadow,
        including prior status/ordinals, evidenceOrdinal, effect class,
        targetBindingKey, and targetIsCurrentBindingHead
      verify author/target-kind, then apply the target lifecycle, Binding-head,
        posting live-count, record-live, and unique-by-Type consequences in shadow

after loop:
  require both evidence and expected-revision cursors exhausted exactly
```

A caller evidence item remains target-specific to its named Withdrawal; it is
never promoted into generic staged Envelope availability for another target.
A first evidence-backed prewithdrawal stages its canonical evidence at that
Withdrawal source's prospective ordinal. A later sibling Withdrawal targeting
the same now-PRE_WITHDRAWN occurrence reuses that planned retained evidence and
is a terminal no-op; it neither consumes caller evidence nor decrements counts.
The shadow applies the same stable posting-key deduplication and RAW_AUDIT
exception as commit. It is bounded by 64 selected leaves, the per-leaf reference
and posting-key caps, and the bounded target-evidence wire cap; no unbounded map
or scan is introduced.

Only after this whole walk, all consent/policy/reference checks, and all counter
guards succeed may commit begin. Commit persists the staged main header/vector
prelude, then replays `leafPlan[]` in the identical ascending order using the
recorded prospective ordinals and before/after values. Every actual prestate
must equal the plan's expected prestate, including changes written by an earlier
sibling during that same replay. A mismatch is an internal implementation
invariant fault (`assert`/panic) that reverts the entire call; it is never a
normal input/CAS/evidence rejection after ordinal allocation. No verifier,
policy callback, evidence parse, CAS decision, or other fallible external-input
check occurs during commit.

```text
publish(bytes envelopeBytes, AccountPrincipal calldata principal,
        bytes intentBytes, bytes intentWitness):
 1. require envelopeBytes.length ≤ MAX_ENVELOPE_WIRE_BYTES; decode EnvelopeWire;
    validate the main-envelope structure, body/carriage bounds, and the bounded
    syntactic shape of every target-evidence item (§2.2), but DO NOT yet match
    targetEvidence to Withdrawal effects
 2. computed ← computePrincipalId(principal)
    require computed == env.header.principalId
      — AUTH_PRINCIPAL_MISMATCH(declared, computed), before ANY witness verify
 3. envDigest ← §2.4; envelopeId ← §2.3
 4. (basisE, codehashE) ← AuthorityVerifierV1.verify(
       principal, envDigest, env.witness, verifyContext)
    // reverts typed on failure; persist this pair only if this call accepts new state
 5. decode the consent carriage only far enough to identify explicit-intent or
    implicit-sender form and derive the prospective leafMask; require leafMask ≠ 0,
    bits ≥ count clear, every selected body carried, and every body RecordId-matched.
    Read the occurrence overlay for every selected source occurrence.
 6. EARLY-ACTIVE: if every selected source occurrence is already ACTIVE, return
    the stable envelopeOrdinal and each existing ordinal/receipt as
    ALREADY_ADMITTED. Do not semantically match or verify targetEvidence; do not
    check Type/effect/policy/CAS state, either expiry, explicit intent witness,
    expectedRevisions, or intent nonce; discard (basisE, codehashE); write nothing.
 7. NON-IDEMPOTENT CONSENT: reject selected WITHDRAWN/PRE_WITHDRAWN source
    occurrences (E_NO_RESURRECTION). For explicit mode, decode the exact §5.1
    AdmissionIntent and require action == 0; envelopeId/realmId/leafMask match;
    both expiries pass; expectedRevisions exactly cover selected CAS-bearing
    Binding mutations (value checks occur point-in-order below); (basisI, codehashI) ←
    AuthorityVerifierV1.verify(principal, eip712IntentDigest, intentWitness,
    verifyContext), used only for consent and never as the receipt basis; require
    a fresh nonceSeq == lastSeq + 1 and stage that nonce write. For implicit mode, require
    intentBytes encodes only leafMask, intentWitness is empty, msg.sender is the
    account in principal, no selected leaf is one of the three kernel-effect
    Types, and envelope expiry
    passes.
 8. initialize the bounded shadow from persisted counters/point reads and mark
    this authenticated Envelope header + full vector staged-available; set both
    semantic-carriage cursors to zero
 9. walk selected leaves in ascending mask order exactly as specified above.
    Structurally validate each Type/body; check references, policy, counter
    bounds, point-in-order expected revision and predecessor; assign each fresh
    source a prospective ordinal without writing; and update shadow occurrence,
    staged cache, Binding, RAW_AUDIT, posting/live-count, and unique-record folds
10. at each Withdrawal in that same walk, decide target status and evidence need
    from the current shadow, validate/consume exactly one caller evidence item
    only when required, construct `ValidatedOccurrenceLifecycleEffect` entirely
    from the shadow, and apply its target consequences there. A sibling target
    derives the commitment pair from the authenticated staged main header/vector
    plus its exact RecordId-matched carried body; terminal retries reuse
    retained persisted/planned evidence and consume no caller item
11. require both semantic-carriage cursors exhausted and the complete shadow
    plan valid. Until this point no nonce, ordinal, Envelope, Record, status,
    cache, index, evidence, batch, or Binding state has been written
12. commit the staged nonce and, on first touch, header/full vector plus
    first-use PrincipalRecord; create one AdmissionBatch with (basisE,codehashE)
13. replay the exact leaf plan in the same ascending order and with its exact
    prospective ordinals: write each fresh source/log/Record; materialize staged
    Type cache; append mandatory and RAW_AUDIT postings; apply the planned
    Binding head; store planned prewithdraw evidence before its target pointer;
    and perform each planned exactly-once live/unique-count decrement. ACTIVE
    duplicates remain write-free
14. every commit prestate is asserted against the plan. Any mismatch is an
    internal invariant panic and reverts the entire call; commit performs no
    fallible input, evidence, policy, authority, or CAS decision
15. emit receipt outcomes; ANY failure or internal invariant fault above reverts
    EVERYTHING (steps 1–14 are one EVM call frame — the one-transaction gate)
```

Idempotency is occurrence-granular and unambiguous. After bounded wire/structural
checks, EnvelopeId recomputation, descriptor equality, envelope-witness
authentication, selection decoding, and selected body-to-RecordId checks, an
all-selected-ACTIVE retry returns the existing `PublishResult` receipts as
`ALREADY_ADMITTED` and writes nothing. In particular, byte-for-byte retry of a
successful evidence-backed T4 call still carries its original bounded
`targetEvidence`; the early return deliberately occurs before that list could be
reclassified as extra. It also precedes expiry, expected-revision, intent-witness,
and nonce checks and appends no AdmissionBatch or evidence copy. In a mixed mask,
the shortcut is unavailable: ACTIVE members no-op while newly accepted members
require one fresh valid intent, full semantic target-evidence cardinality/effect
preflight, and new ordinals. Evidence for an ACTIVE source leaf in that mixed call
is extra and reverts. Re-withdrawal of a `WITHDRAWN` or
`PRE_WITHDRAWN` target is likewise a no-op success after the author guard, using
retained original evidence when the complete authenticated target bundle is not
otherwise available; no caller evidence is required or accepted again.
Re-admission of the same Withdrawal occurrence exits
through T2 before that guard. Terminal status prevents resurrection; duplicate
handling never does so by whole-call revert.

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
selected envelope contains none of the three kernel-effect Types; they always
require explicit SR-3 intent, while only `BindingSet/1` and
`BindingTombstone/1` carry `expectedRevisions`. On the non-idempotent
path, Realm is this contract by construction, the envelope expiry applies, and the
account transaction nonce supplies replay control. Consent mode is transient validation input only:
explicit and implicit consent produce the same `PublishResult`,
`AdmissionBatch`, and `AdmissionReceipt/1` shapes and persist no mode tag. R-D8
is not violated [DERIVED INVARIANT]: authorship still derives exclusively
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
persisted without re-encoding in the accepting call's `AdmissionBatch`; each
newly accepted occurrence in that call resolves them through its receipt.
Nothing in this chapter caches authority at read time [DERIVED INVARIANT —
CARRY-IN (a): admission-time validation + persisted authorization basis].

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
EnvelopeId, occKeys, and principalId. Against identical account state, the
AuthorityBasis pair is identical except for `basisBlock`; across an account-state
change, delegate/codehash may also differ. Those differences belong to the actual
accepting call's `AdmissionBatch`, never to the rail or Envelope metadata.
`AdmissionOrdinal` and block basis MAY differ — they record WHEN a Realm accepted,
which is venue-relative existence evidence, never authorship (R-D9) — and since
the first acceptance wins and later ones no-op (T2), the identity/authorship state
is identical whichever rail lands first while the receipt honestly names that
acceptance's basis. A rail that can alter any authorship-bearing field is a broken
implementation, detectable by this vector.

---

## 10. Storage layout and external ABI (Realm-local)

Storage contract exported by this chapter (the Realm/admission chapter is the
sole physical owner of the receipt/batch, overlay, and retained-evidence spine;
the declarations below pin the byte-for-byte seam, while the Record-body spine
is a sibling chapter):

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
// getEnvelopeBytes returns the exact canonical unsigned envelope:
//   abi.encode(EnvelopeHeader(profile, principalId, authorityRef, authEpoch,
//                             pubNonce, notAfter), recordIds)
// The header mappings + full vector above are its stored lossless
// representation. Bodies, main witness, target evidence, consent/intent,
// submitter, payer, and receipt basis are expressly excluded.

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

// ---- authenticated pre-withdrawal evidence (Realm-owned; effective T4 only) ----
mapping(uint48 withdrawalOrdinal => bytes) preWithdrawalEvidence;
// Value = abi.encode(decoded TargetEnvelopeEvidence) in the exact §2.2 field order.
// Length is nonzero and <= MAX_ENVELOPE_BODY_BYTES. The PRE_WITHDRAWN target's
// revokedAtOrdinal is this key. Empty means this accepted Withdrawal did not use
// caller target evidence; entries are immutable and never copied on T5b.

// ---- intent nonces ----
mapping(bytes32 principalId => mapping(uint192 nonceKey => uint64)) intentNonces;
```

Both stored ordinal fields are widened to `uint64` at every public ABI, receipt,
and vector. Before assigning the next ordinal, Core applies `U48_GUARD` and reverts
at `2^48 - 1`; a successor Realm/revision is the named migration seam. Zero remains
the none-sentinel.

State-readability [DERIVED INVARIANT — constitution reconstruction clause;
R-D3]: header + full RecordId vector persist on first admission so a second
implementation can recompute every unsigned-envelope digest, EnvelopeId,
OccurrenceRef, and downstream admitted effect from state alone. The immutable
receipt/batch basis is the evidence that admission-time authorship validation
succeeded; absent an externally supplied original witness, historic signature
verification is not replayable from state and is not claimed. For a
PRE_WITHDRAWN target whose header never otherwise entered state, the
effective Withdrawal's ordinal retains the exact bounded canonical evidence bytes
needed to recompute the target EnvelopeId, leaf range, descriptor equality,
witness, and author. This is a narrow lifecycle exception, retained because the
never-admitted target has no receipt or unsigned-envelope spine; it does not
silently make main-envelope witnesses persistent. No logs or EFS-operated
service are required for either reconstruction path (EIP-4444-proof by
construction).

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

struct OccurrenceRef {
    bytes32 envelopeId;
    uint16 leafIndex;
}

struct PublishLeafResult {
    uint16 leafIndex;
    uint8 outcome;                    // 1 ADMITTED, 2 ALREADY_ADMITTED
    uint64 admissionOrdinal;          // fresh or existing
}

struct PublishResult {
    bytes32 envelopeId;
    uint40 envelopeOrdinal;           // stable existing or newly assigned
    PublishLeafResult[] leaves;        // selected leaves, ascending mask order
}

struct AdmissionReceiptView {         // exact logical AdmissionReceipt/1
    OccurrenceRef occurrenceRef;
    bytes32 realmId;
    bytes32 realmRevisionId;
    AuthorityBasisWord authorityBasis;
    bytes32 authorityCodehash;         // zero unless CONTRACT_ERC1271
    uint64 admissionOrdinal;
    uint48 admittedAtBlock;
    uint8 acceptedStatus;              // 1 ACCEPTED
}

function publish(
    bytes calldata envelopeBytes,
    AccountPrincipal calldata principal,
    bytes calldata intentBytes,
    bytes calldata intentWitness
) external returns (PublishResult memory);

function occKeyOf(bytes32 envelopeId, uint16 leafIndex)
    external pure returns (bytes32);

function occurrenceStateOf(bytes32 occKey)
    external view returns (uint8 status, uint64 ordinal, uint64 revokedAtOrdinal);

function envelopeHeaderOf(bytes32 envelopeId) external view
    returns (bool known, uint16 profile, bytes32 principalId, bytes32 authorityRef,
             uint64 authEpoch, bytes32 pubNonce, uint64 notAfter, uint16 count);

function envelopeRecordIdsOf(bytes32 envelopeId, uint16 start, uint16 limit)
    external view returns (bytes32[] memory page, uint16 total);

/// Exact `abi.encode(EnvelopeHeader, fullRecordIds)` reconstructed from the
/// persisted header/vector. This is canonical UNSIGNED semantic-envelope
/// bytes. It excludes all witnesses, bodies, target evidence, consent/intent,
/// carrier, payer, and receipt material.
function getEnvelopeBytes(bytes32 envelopeId)
    external view returns (bytes memory canonicalUnsignedEnvelope);

function receiptOf(bytes32 envelopeId, uint16 leafIndex) external view
    returns (AdmissionReceiptView memory);

function preWithdrawalEvidenceAt(uint64 withdrawalOrdinal) external view
    returns (bytes memory canonicalTargetEvidence);
// Empty iff that accepted Withdrawal did not cause an evidence-backed T4.
// Nonempty bytes are <= MAX_ENVELOPE_BODY_BYTES and decode exactly as §2.2.
```

All reads are point reads or hard-bounded pages; `known = false` is honest
unknown-at-this-Realm, never a claim about other Realms [DERIVED INVARIANT —
constitution honest-reads clause].

Authorship/Realm-owned error selectors are exact and byte-identical here and in
the Realm chapter:

```solidity
error E_PROFILE(uint16 got);
error E_RESERVED_AUTHORITY(bytes32 authorityRef, uint64 authEpoch);
error E_EMPTY_ENVELOPE();
error E_LEAF_LIMIT(uint256 got);
error E_LEAF_RANGE(uint16 leafIndex);
error E_BODY_LIMIT(uint256 got);
error E_WIRE_LIMIT(uint256 got);
error E_BODY_MISMATCH(uint16 leafIndex);
error E_REALM_MISMATCH(bytes32 expected, bytes32 got);
error E_NONCE(uint192 nonceKey, uint64 expected, uint64 got);
error E_EXPIRED_ENVELOPE(uint64 notAfter);
error E_EXPIRED_INTENT(uint64 notAfter);
error E_EXPECTED_REVISION(uint16 leafIndex, uint32 expected, uint32 actual);
error E_TARGET_EVIDENCE(uint16 withdrawalLeafIndex);
error E_NO_RESURRECTION(bytes32 envelopeId, uint16 leafIndex);
error E_STRUCTURAL(uint16 leafIndex, uint16 code);
error E_UNKNOWN_TYPE(uint16 leafIndex);
error E_REF_UNSATISFIED(uint16 leafIndex, uint8 roleOrdinal);
error E_BOUNDS(uint16 code);
error E_POLICY(uint16 code);
error AUTH_PRINCIPAL_MISMATCH(bytes32 declared, bytes32 computed);
error ErrWithdrawNotAuthor(bytes32 targetEnvelopeId, uint16 targetLeafIndex,
                           bytes32 envelopePrincipal, bytes32 targetPrincipal);
error U48_GUARD();
```

Authority-verifier errors bubble unchanged from the principal chapter's §3.6;
Binding transition errors bubble unchanged from the Binding chapter's §3.5.
There is no generic `E_AUTHORITY`, `E_BAD_WITNESS`, `E_NOT_AUTHOR`, or
`E_CAS_CONFLICT` alias.

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
   aggregate evidence/wire overflow MUST-FAIL; effective evidence-backed T4
   MUST return byte-identical canonical evidence through
   `preWithdrawalEvidenceAt(withdrawalOrdinal)`. Replay that successful call's
   exact original calldata after both expiries: it MUST return
   `ALREADY_ADMITTED` with the existing ordinal, despite carrying the now-extra
   original target evidence, and MUST leave nonce, AdmissionBatch count,
   evidence bytes, and all state unchanged. Malformed/oversize wire or a failing
   envelope witness MUST still fail before the shortcut. A mixed mask formed by
   adding one NEVER_ADMITTED leaf MUST NOT take the shortcut: the consumed intent
   and old ACTIVE-leaf evidence fail; a fresh intent plus exactly the evidence
   required by newly accepted T4 leaves receives full preflight. T5b uses retained
   original evidence without caller resupply and MUST NOT replace or copy it.
   A mandatory **T4-MAX-BODY** vector creates a target Record with exactly
   `MAX_BODY_BYTES = 8,192` canonical bytes, signs its Envelope without admitting
   it, and successfully prewithdraws it using only
   `(typeSchemaId, keccak256(canonicalBody))`. With one target RecordId, an EOA
   descriptor, and a 65-byte witness, canonical `abi.encode(TargetEnvelopeEvidence)`
   is 800 bytes; the 8,192-byte target body is absent from evidence, retained
   state, and the Withdrawal wire. The vector MUST also fail after flipping
   either commitment word.
   Four same-call shadow fixtures are mandatory:
   - **SHADOW-1 bind→withdraw:** leaf 0 first-binds key K at prospective ordinal
     `o`; leaf 1 withdraws `(E,0)` at `o+1`. Preflight sees leaf 0 ACTIVE/current,
     then plans it WITHDRAWN, one liveness decrement, and K TOMBSTONED by leaf 1;
     history contains both physical revisions after commit.
   - **SHADOW-2 sequential same-key bind:** from UNSET, leaf 0 carries
     `(predecessor=NONE,xr=0)` and leaf 1 carries
     `(predecessor=(E,0),xr=1)`. Both admit; the final head is leaf 1 at revision
     2. Reversing/staling either CAS rejects the whole call before writes.
   - **SHADOW-3 withdraw-before-later target:** leaf 0 withdraws `(E,1)` and
     leaf 1 would otherwise be fresh. Its carried body is RecordId-matched; the
     authenticated main header/vector means no caller target evidence is
     needed. Leaf 0 plans PRE_WITHDRAWN, then leaf
     1 hits no-resurrection. The call reverts with counters, nonce, header,
     evidence, receipts, indexes, and Binding state all unchanged.
   - **SHADOW-4 duplicate withdrawal:** two fresh Withdrawal leaves target one
     initially NEVER_ADMITTED, header-absent external occurrence. The first
     consumes one evidence item (including the authenticated commitment pair), plans
     PRE_WITHDRAWN, and stages that evidence at its prospective ordinal. The
     second sees terminal shadow state, reuses the planned retained evidence,
     consumes none, and is an accepted target no-op. Extra second evidence
     rejects; both Withdrawal sources receive consecutive ordinals and exactly
     one evidence value exists. The ACTIVE-target variant likewise permits only
     the first lifecycle/head/decrement consequence.
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
  exact `PublishResult`, `PublishLeafResult`, and `AdmissionReceiptView` (§10);
  constants table §11.
- **Guarantees**: EnvelopeId/RecordId/OccurrenceRef exclude witness, submitter,
  rail, payer, and Realm; authorityRef/authEpoch are physically reserved (zero,
  fail-closed) so managed Principals activate without layout or formula change;
  subset carriage always ships the full RecordId vector; occurrence states are
  exactly NEVER_ADMITTED/ACTIVE/WITHDRAWN/PRE_WITHDRAWN with T1–T6 and atomic
  multi-leaf admission; stored ordinals are u48 and every public value is u64;
  withdrawal is author-only, Realm-local, non-deleting, non-resurrecting,
  authenticated pre-withdrawal legal only with bounded one-to-one target evidence
  whose recomputed EnvelopeId, target-index range, and
  `H(DOM_RECORD,typeSchemaId,bodyHash)` match the signed target RecordId before
  author comparison; evidence and retained state contain the commitment pair,
  never the target body; an effective evidence-backed T4 durably retains one bounded
  canonical evidence value at its Withdrawal ordinal, and terminal repeats load
  it rather than requiring evidence again; after bounded structure and envelope
  authentication, an all-selected-ACTIVE retry returns before semantic evidence,
  effect, expiry, or intent replay checks, while every mixed/new call performs
  them with a fresh intent; admission is author-consented (no
  third-party admission); descriptor equality precedes witness verification;
  authority is verified at admission and persisted, never re-derived at read;
  `publish` is the only Core write primitive.
- **ABI**: §10 function signatures and the byte-identical authorship/Realm-owned
  error-selector block; delegated authority/Binding selectors bubble unchanged.
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
